// Weekly digest cron — Monday 9am UTC.
// Loops Intelligence-tier users, runs a health check (connector-generic),
// pulls open risk alerts, and sends a structured email digest via Resend.
// Saves last_digest_sent_at + last_digest_summary to profiles on success.
//
// Vercel invokes this with: Authorization: Bearer <CRON_SECRET>
// Manual trigger: POST /api/cron/weekly-digest?secret=<CRON_SECRET>

import { createClient } from '@supabase/supabase-js'
import { runBusinessHealthCheck } from '../lib/monitoring/health-check.js'

const INTELLIGENCE_TIERS = new Set(['business', 'portfolio'])
const BATCH_LIMIT = 50

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
    console.warn('[cron/weekly-digest] CRON_SECRET not set — endpoint is unprotected')
    return true
  }
  const authHeader = String(req.headers.authorization || '')
  if (authHeader === `Bearer ${secret}`) return true
  const qSecret = req.query?.secret || new URL(req.url || '', 'http://x').searchParams.get('secret')
  if (qSecret === secret) return true
  return false
}

function severityColor(severity) {
  return { critical: '#A32D2D', high: '#BA7517', medium: '#B07D00', low: '#1D9E75' }[severity] || '#6B6860'
}

function severityBg(severity) {
  return { critical: '#FCEBEB', high: '#FAEEDA', medium: '#FFF8F0', low: '#E1F5EE' }[severity] || '#F3F2EE'
}

function severityLabel(severity) {
  return severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : ''
}

function buildDigestEmail({ userName, healthResult, openAlerts, weekDate }) {
  const score = healthResult?.health_score ?? null
  const risks = healthResult?.risks ?? []
  const opportunities = healthResult?.opportunities ?? []
  const summary = healthResult?.summary ?? ''
  const recommendedActions = healthResult?.recommended_actions ?? []
  const connectorUsed = healthResult?.evidence?.connector?.provider ?? null

  const criticalRisks = risks.filter(r => r.severity === 'critical')
  const highRisks     = risks.filter(r => r.severity === 'high')
  const otherRisks    = risks.filter(r => r.severity !== 'critical' && r.severity !== 'high')

  const scoreColor = score === null ? '#6B6860' : score >= 70 ? '#1D9E75' : score >= 40 ? '#BA7517' : '#A32D2D'

  const greeting = userName ? `Hi ${userName.split(' ')[0]},` : 'Hi,'

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #0D0D0D; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { border-bottom: 2px solid #0D0D0D; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 13px; color: #6B6860; letter-spacing: 0.5px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 8px 0 4px; line-height: 1.3; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6860; margin-bottom: 12px; }
  .score-block { display: inline-flex; align-items: center; gap: 12px; }
  .score-num { font-size: 36px; font-weight: 700; color: ${scoreColor}; line-height: 1; }
  .score-label { font-size: 13px; color: #6B6860; }
  .summary { font-size: 15px; color: #2C2B28; line-height: 1.7; margin: 0; }
  .risk { padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid; }
  .risk-title { font-size: 13px; font-weight: 500; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 100px; font-weight: 500; margin-left: 8px; }
  .risk-desc { font-size: 13px; color: #6B6860; margin-top: 2px; }
  .risk-action { font-size: 13px; color: #2C2B28; margin-top: 4px; font-style: italic; }
  .action-item { display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start; }
  .action-num { background: #0D0D0D; color: white; font-size: 11px; font-weight: 500; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .opp { padding: 10px 12px; background: #E1F5EE; border-radius: 6px; margin-bottom: 8px; }
  .opp-title { font-size: 13px; font-weight: 500; color: #0F6E56; }
  .opp-desc { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .connector-badge { font-size: 12px; color: #6B6860; background: #F3F2EE; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8E6E0; font-size: 12px; color: #B0ADA4; }
  .cta { display: inline-block; background: #0D0D0D; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500; margin-top: 8px; }
</style></head>
<body>
  <div class="header">
    <div class="logo">SelfAudit — Weekly Digest</div>
    <h1>Your weekly business health brief</h1>
    <div style="font-size:13px;color:#6B6860;margin-top:4px">Week of ${weekDate}</div>
  </div>

  <p style="font-size:15px;color:#2C2B28">${greeting} Here's where your business stands this week.</p>

  ${score !== null ? `
  <div class="section">
    <h2>Health Score</h2>
    <div class="score-block">
      <div class="score-num">${score}</div>
      <div class="score-label">out of 100<br><span style="color:${scoreColor}">${score >= 70 ? 'Stable' : score >= 40 ? 'Needs attention' : 'Critical'}</span></div>
    </div>
    ${connectorUsed ? `<div style="margin-top:8px"><span class="connector-badge">Data from: ${connectorUsed}</span></div>` : ''}
    ${summary ? `<p class="summary" style="margin-top:12px">${summary}</p>` : ''}
  </div>` : ''}

  ${criticalRisks.length > 0 ? `
  <div class="section">
    <h2>Critical — Act Now</h2>
    ${criticalRisks.map(r => `
    <div class="risk" style="background:#FCEBEB;border-left-color:#A32D2D">
      <div class="risk-title">${r.title}<span class="badge" style="background:#A32D2D;color:white">Critical</span></div>
      <div class="risk-desc">${r.description}</div>
      <div class="risk-action">→ ${r.recommended_action}</div>
    </div>`).join('')}
  </div>` : ''}

  ${highRisks.length > 0 ? `
  <div class="section">
    <h2>High Priority</h2>
    ${highRisks.map(r => `
    <div class="risk" style="background:#FAEEDA;border-left-color:#BA7517">
      <div class="risk-title">${r.title}<span class="badge" style="background:#FAEEDA;color:#BA7517">High</span></div>
      <div class="risk-desc">${r.description}</div>
      <div class="risk-action">→ ${r.recommended_action}</div>
    </div>`).join('')}
  </div>` : ''}

  ${otherRisks.length > 0 ? `
  <div class="section">
    <h2>Also Flagged</h2>
    ${otherRisks.map(r => `
    <div class="risk" style="background:${severityBg(r.severity)};border-left-color:${severityColor(r.severity)}">
      <div class="risk-title">${r.title}<span class="badge" style="background:${severityBg(r.severity)};color:${severityColor(r.severity)}">${severityLabel(r.severity)}</span></div>
      <div class="risk-desc">${r.description}</div>
    </div>`).join('')}
  </div>` : ''}

  ${openAlerts.length > 0 ? `
  <div class="section">
    <h2>Open Alerts (${openAlerts.length})</h2>
    ${openAlerts.slice(0, 5).map(a => `
    <div class="risk" style="background:${severityBg(a.severity)};border-left-color:${severityColor(a.severity)}">
      <div class="risk-title">${a.title}<span class="badge" style="background:${severityBg(a.severity)};color:${severityColor(a.severity)}">${severityLabel(a.severity)}</span></div>
      ${a.description ? `<div class="risk-desc">${a.description}</div>` : ''}
    </div>`).join('')}
    ${openAlerts.length > 5 ? `<p style="font-size:13px;color:#6B6860">+ ${openAlerts.length - 5} more open alerts</p>` : ''}
  </div>` : ''}

  ${recommendedActions.length > 0 ? `
  <div class="section">
    <h2>This Week's Actions</h2>
    ${recommendedActions.slice(0, 5).map((a, i) => `
    <div class="action-item">
      <span class="action-num">${i + 1}</span>
      <span style="font-size:14px">${a}</span>
    </div>`).join('')}
  </div>` : ''}

  ${opportunities.length > 0 ? `
  <div class="section">
    <h2>Opportunities</h2>
    ${opportunities.slice(0, 3).map(o => `
    <div class="opp">
      <div class="opp-title">${o.title}</div>
      ${o.description ? `<div class="opp-desc">${o.description}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <div class="section">
    <a href="https://tryselfaudit.com" class="cta">Open SelfAudit Dashboard</a>
  </div>

  <div class="footer">
    Weekly digest from SelfAudit by Vnklo — tryselfaudit.com<br>
    <a href="https://vnklo.com" style="color:#6B6860">Built by Vnklo</a>
  </div>
</body>
</html>`

  return html
}

async function sendDigestEmail({ userEmail, userName, healthResult, openAlerts, resendApiKey }) {
  if (!userEmail || !resendApiKey) return false

  const weekDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const html = buildDigestEmail({ userName, healthResult, openAlerts, weekDate })

  const score = healthResult?.health_score
  const scoreLabel = score === null ? '' : score >= 70 ? ' — Stable' : score >= 40 ? ' — Needs attention' : ' — Critical'
  const subject = `Your SelfAudit weekly digest${scoreLabel} — ${weekDate}`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from:    'SelfAudit <audit@tryselfaudit.com>',
        to:      [userEmail],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[weekly-digest] Resend error:', err?.message || res.status)
      return false
    }
    return true
  } catch (err) {
    console.warn('[weekly-digest] send failed:', err.message)
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

  // Fetch Intelligence-tier users with email fields
  const { data: profiles, error: profilesErr } = await sb
    .from('profiles')
    .select('id, tier, notification_email')
    .in('tier', [...INTELLIGENCE_TIERS])
    .limit(BATCH_LIMIT)

  if (profilesErr) {
    console.error('[cron/weekly-digest] profiles fetch failed:', profilesErr.message)
    return res.status(500).json({ error: profilesErr.message })
  }

  // Fetch auth emails in one call via admin API
  let authEmailMap = {}
  try {
    const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authUsers?.users ?? []) {
      if (u.email) authEmailMap[u.id] = { email: u.email, name: u.user_metadata?.name || '' }
    }
  } catch (authErr) {
    console.warn('[cron/weekly-digest] auth user list failed:', authErr.message)
  }

  const users = profiles ?? []
  const summary = {
    total_users:   users.length,
    sent:          0,
    skipped:       0,
    failures:      [],
    started_at,
    finished_at:   null,
  }

  for (const user of users) {
    try {
      const authInfo    = authEmailMap[user.id] || {}
      const userEmail   = user.notification_email || authInfo.email
      const userName    = authInfo.name || ''

      if (!userEmail) {
        summary.skipped++
        continue
      }

      // Run health check (connector-generic — uses whatever integrations are connected)
      const healthResult = await runBusinessHealthCheck(user.id)

      // Fetch open alerts for this user
      const { data: openAlerts } = await sb
        .from('risk_alerts')
        .select('severity, category, title, description')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)

      const sent = await sendDigestEmail({
        userEmail,
        userName,
        healthResult,
        openAlerts: openAlerts ?? [],
        resendApiKey: process.env.RESEND_API_KEY,
      })

      if (sent) {
        // Save digest summary + sent timestamp to profiles
        const digestSummary = {
          health_score:    healthResult.health_score,
          risk_count:      healthResult.risks.length,
          critical_count:  healthResult.risks.filter(r => r.severity === 'critical').length,
          high_count:      healthResult.risks.filter(r => r.severity === 'high').length,
          open_alerts:     (openAlerts ?? []).length,
          top_risks:       healthResult.risks.slice(0, 3).map(r => ({ title: r.title, severity: r.severity })),
          connector_used:  healthResult.evidence?.connector?.provider ?? null,
          summary:         healthResult.summary,
        }

        await sb.from('profiles').update({
          last_digest_sent_at:    new Date().toISOString(),
          last_digest_summary:    digestSummary,
        }).eq('id', user.id).catch(e => console.warn('[weekly-digest] profile update failed:', e.message))

        summary.sent++
      } else {
        summary.failures.push({ userId: user.id, error: 'email send failed' })
      }
    } catch (userErr) {
      console.error(`[cron/weekly-digest] failed for user ${user.id}:`, userErr.message)
      summary.failures.push({ userId: user.id, error: userErr.message })
    }
  }

  summary.finished_at = new Date().toISOString()
  return res.status(200).json(summary)
}
