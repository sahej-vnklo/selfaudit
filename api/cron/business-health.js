// Cron-safe endpoint for scheduled business health checks.
//
// Vercel invokes this with: Authorization: Bearer <CRON_SECRET>
// Manual trigger: POST /api/cron/business-health with the same header,
//   or ?secret=<CRON_SECRET> as a query param.
//
// Required env var:
//   CRON_SECRET — set in Vercel project settings → Environment Variables
//
// NOTE: profiles.monitoring_enabled does not exist yet.
// When added, run this migration in Supabase SQL Editor:
//
//   alter table profiles add column if not exists monitoring_enabled boolean not null default true;
//
// Until then, all Intelligence-tier users are treated as monitoring-enabled.

import { createClient } from '@supabase/supabase-js'
import { runBusinessHealthCheck } from '../lib/monitoring/health-check.js'
import { createRiskAlertsFromHealthCheck } from '../lib/monitoring/risk-alerts.js'
import { buildRiskAlertEmail } from '../lib/notifications/risk-email.js'

const INTELLIGENCE_TIERS = new Set(['intelligence'])
const BATCH_LIMIT = 50   // max users processed per cron invocation
const ALERT_CADENCE_MS = {
  daily: 24 * 60 * 60 * 1000,
  every_3_days: 3 * 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function isAuthorised(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[cron/business-health] CRON_SECRET not set — rejecting request')
    return false
  }

  // Vercel cron header
  const authHeader = String(req.headers.authorization || '')
  if (authHeader === `Bearer ${secret}`) return true

  // Manual trigger via query param
  const qSecret = req.query?.secret || new URL(req.url || '', 'http://x').searchParams.get('secret')
  if (qSecret === secret) return true

  return false
}

function mapAlertCategoryToPreference(alert) {
  const category = String(alert?.category || '').toLowerCase()
  if (category === 'pipeline' || category === 'revenue') return 'pipeline_revenue'
  if (category === 'goal') return 'goal_progress'
  if (category === 'customer') return 'customer_health'
  if (category === 'execution' || category === 'operations') return 'execution'
  return null
}

function alertMatchesPreferences(alert, prefAreas) {
  if (!Array.isArray(prefAreas) || prefAreas.length === 0) return false
  if (alert?.severity === 'critical' && prefAreas.includes('critical_risks')) return true
  const mapped = mapAlertCategoryToPreference(alert)
  return !!mapped && prefAreas.includes(mapped)
}

function alertsAreDue(prefRow) {
  if (!prefRow?.enabled) return false
  const cadenceMs = ALERT_CADENCE_MS[prefRow.frequency] || ALERT_CADENCE_MS.daily
  const lastMarker = prefRow.updated_at ? new Date(prefRow.updated_at).getTime() : 0
  if (!lastMarker || Number.isNaN(lastMarker)) return true
  return (Date.now() - lastMarker) >= cadenceMs
}

async function sendAlertEmail({ userEmail, userName, alerts, resendApiKey }) {
  if (!userEmail || !resendApiKey || !alerts?.length) return false
  const emailPayload = buildRiskAlertEmail({ name: userName, email: userEmail }, alerts)
  if (!emailPayload) return false

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'SelfAudit <audit@tryselfaudit.com>',
        to: [emailPayload.to || userEmail],
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.warn('[cron/business-health] alert email send failed:', err?.message || response.status)
      return false
    }
    return true
  } catch (error) {
    console.warn('[cron/business-health] alert email send failed:', error?.message || error)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAuthorised(req)) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const sb         = getSupabase()
  const started_at = new Date().toISOString()

  // 1. Fetch Intelligence-tier users (monitoring_enabled filter added once column exists)
  const { data: profiles, error: profilesErr } = await sb
    .from('profiles')
    .select('id, tier, integrations, notification_email, email, name')
    // When monitoring_enabled column is added, replace the in filter with:
    // .eq('monitoring_enabled', true)
    // .in('tier', [...INTELLIGENCE_TIERS])
    .in('tier', [...INTELLIGENCE_TIERS])
    .limit(BATCH_LIMIT)

  if (profilesErr) {
    console.error('[cron/business-health] profiles fetch failed:', profilesErr.message)
    return res.status(500).json({ error: profilesErr.message })
  }

  const users = profiles ?? []

  const summary = {
    checked_users:  0,
    alerts_created: 0,
    alert_emails_sent: 0,
    failures:       [],
    started_at,
    finished_at:    null,
  }

  // 2. Process each user — isolated try/catch so one failure can't abort the batch
  for (const user of users) {
    try {
      // Run health check
      const result = await runBusinessHealthCheck(user.id)

      // Persist health check result
      let healthCheckId = null
      try {
        const { data: hcRow } = await sb
          .from('business_health_checks')
          .insert({
            user_id:             user.id,
            checked_at:          result.checked_at,
            health_score:        result.health_score,
            risks:               result.risks,
            opportunities:       result.opportunities,
            summary:             result.summary,
            recommended_actions: result.recommended_actions,
            evidence:            result.evidence,
          })
          .select('id')
          .single()
        healthCheckId = hcRow?.id ?? null
      } catch (persistErr) {
        console.warn(`[cron/business-health] persist failed for ${user.id}:`, persistErr.message)
      }

      // Create deduped risk alerts
      let newAlerts = []
      try {
        newAlerts = await createRiskAlertsFromHealthCheck(user.id, { ...result, id: healthCheckId })
      } catch (alertErr) {
        console.warn(`[cron/business-health] alert creation failed for ${user.id}:`, alertErr.message)
      }

      try {
        const { data: prefRow } = await sb
          .from('intelligence_notification_preferences')
          .select('enabled, frequency, channels, areas, updated_at')
          .eq('user_id', user.id)
          .maybeSingle()

        const wantsEmail = !!prefRow?.enabled && Array.isArray(prefRow?.channels) && prefRow.channels.includes('email')
        const dueNow = alertsAreDue(prefRow)

        if (wantsEmail && dueNow) {
          const { data: unsentAlerts = [] } = await sb
            .from('risk_alerts')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'open')
            .eq('notification_sent', false)
            .order('created_at', { ascending: false })

          const matchedAlerts = unsentAlerts.filter((alert) => alertMatchesPreferences(alert, prefRow.areas || []))
          const userEmail = user.notification_email || user.email

          if (userEmail && matchedAlerts.length > 0) {
            const sent = await sendAlertEmail({
              userEmail,
              userName: user.name || '',
              alerts: matchedAlerts,
              resendApiKey: process.env.RESEND_API_KEY,
            })

            if (sent) {
              const alertIds = matchedAlerts.map((alert) => alert.id)
              await sb.from('risk_alerts').update({ notification_sent: true }).in('id', alertIds)
              await sb
                .from('intelligence_notification_preferences')
                .update({ updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
              summary.alert_emails_sent += 1
            }
          }
        }
      } catch (emailErr) {
        console.warn(`[cron/business-health] alert delivery failed for ${user.id}:`, emailErr.message)
      }

      summary.checked_users  += 1
      summary.alerts_created += newAlerts.length
    } catch (userErr) {
      console.error(`[cron/business-health] failed for user ${user.id}:`, userErr.message)
      summary.failures.push({ userId: user.id, error: userErr.message })
    }
  }

  summary.finished_at = new Date().toISOString()

  return res.status(200).json(summary)
}
