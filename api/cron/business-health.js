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
// Until then, all Intelligence-tier users (tier = 'business' | 'portfolio')
// are treated as monitoring-enabled.

import { createClient } from '@supabase/supabase-js'
import { runBusinessHealthCheck } from '../lib/monitoring/health-check.js'
import { createRiskAlertsFromHealthCheck } from '../lib/monitoring/risk-alerts.js'

const INTELLIGENCE_TIERS = new Set(['business', 'portfolio'])
const BATCH_LIMIT = 50   // max users processed per cron invocation

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function isAuthorised(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[cron/business-health] CRON_SECRET not set — endpoint is unprotected')
    return true   // allow in dev; block in prod by ensuring the var is set
  }

  // Vercel cron header
  const authHeader = String(req.headers.authorization || '')
  if (authHeader === `Bearer ${secret}`) return true

  // Manual trigger via query param
  const qSecret = req.query?.secret || new URL(req.url || '', 'http://x').searchParams.get('secret')
  if (qSecret === secret) return true

  return false
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
    .select('id, tier, integrations')
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
