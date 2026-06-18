// POST /api/actions/notify
// Sends an approved alert action to the user's preferred communication channel.
// For now: email via Resend. Later: Slack/Gmail via Composio.
//
// Body: { userId, alertId, channelType, params, alertData, savePref }
//   alertData: { title, description, rootCause, impact, recommended_action, severity, category, escalation_tier }
//   savePref:  true → upsert the chosen channel into user_connector_prefs

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const TIER_COLOR = { critical: '#A32D2D', alert: '#BA5B17', escalate: '#8A6A00', flag: '#285AA6', watch: '#6B6860' }
const SEV_LABEL  = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

function buildApprovalEmail({ toEmail, alertData }) {
  const tier      = alertData.escalation_tier || 'alert'
  const color     = TIER_COLOR[tier] || '#6B6860'
  const sevLabel  = SEV_LABEL[alertData.severity] || alertData.severity || ''
  const areaLabel = String(alertData.category || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const subject = `Action approved: ${alertData.title || 'Risk alert'} — SelfAudit`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;color:#0D0D0D;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">

  <div style="border-bottom:2px solid ${color};padding-bottom:14px;margin-bottom:22px;">
    <div style="font-size:12px;color:#6B6860;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">SelfAudit — Action Approved</div>
    <h1 style="font-size:20px;margin:0;font-weight:700;">${esc(alertData.title)}</h1>
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
      ${sevLabel ? `<span style="font-size:11px;background:${color};color:#fff;padding:2px 10px;border-radius:999px;font-weight:600;text-transform:uppercase;">${esc(sevLabel)}</span>` : ''}
      ${areaLabel ? `<span style="font-size:11px;color:#6B6860;">${esc(areaLabel)}</span>` : ''}
    </div>
  </div>

  ${alertData.description ? `<p style="font-size:15px;color:#2C2B28;margin:0 0 18px;line-height:1.65;">${esc(alertData.description)}</p>` : ''}

  ${alertData.rootCause ? `
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;font-weight:700;color:#6B6860;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Root cause</div>
    <div style="font-size:14px;color:#1A1A1A;">${esc(alertData.rootCause)}</div>
  </div>` : ''}

  ${alertData.impact ? `
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;font-weight:700;color:#6B6860;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">If ignored</div>
    <div style="font-size:14px;color:#1A1A1A;">${esc(alertData.impact)}</div>
  </div>` : ''}

  ${alertData.recommended_action ? `
  <div style="border:1px solid #D4EDDA;border-left:4px solid #1D9E75;background:#F0FBF5;border-radius:8px;padding:14px 16px;margin:20px 0;">
    <div style="font-size:11px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Approved action</div>
    <div style="font-size:14px;color:#0D2B1A;line-height:1.6;">${esc(alertData.recommended_action)}</div>
  </div>` : ''}

  <div style="margin-top:28px;text-align:center;">
    <a href="https://tryselfaudit.com/#home" style="display:inline-block;background:#0D0D0D;color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:14px;font-weight:600;">
      View Dashboard →
    </a>
  </div>

  <div style="margin-top:30px;padding-top:14px;border-top:1px solid #E8E6E0;font-size:12px;color:#B0ADA4;">
    Sent via SelfAudit — tryselfaudit.com · Built by Vnklo
  </div>

</body>
</html>`

  const text = [
    `SelfAudit — Action Approved`,
    ``,
    alertData.title,
    ``,
    alertData.description || '',
    alertData.rootCause   ? `Root cause: ${alertData.rootCause}` : '',
    alertData.impact      ? `If ignored: ${alertData.impact}` : '',
    alertData.recommended_action ? `Approved action: ${alertData.recommended_action}` : '',
    ``,
    `View your dashboard: https://tryselfaudit.com/#home`,
    `— SelfAudit / tryselfaudit.com`,
  ].filter(s => s !== null).join('\n')

  return { subject, html, text, to: toEmail }
}

async function sendViaResend({ subject, html, text, to }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ from: 'SelfAudit <audit@tryselfaudit.com>', to: [to], subject, html, text }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Resend error ${res.status}`)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, alertId, channelType, params, alertData, savePref } = req.body || {}
  if (!userId || !channelType || !alertData) {
    return res.status(400).json({ error: 'userId, channelType, and alertData are required' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  // Save pref if this is the first pick or user changed preference
  if (savePref && params) {
    await sb.from('user_connector_prefs').upsert(
      { user_id: userId, channel_type: channelType, params, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,channel_type' }
    )
  }

  try {
    if (channelType === 'email') {
      const toEmail = params?.email
      if (!toEmail) return res.status(400).json({ error: 'params.email is required for email channel' })

      const payload = buildApprovalEmail({ toEmail, alertData })
      await sendViaResend(payload)

    } else {
      return res.status(400).json({ error: `Channel type "${channelType}" not yet supported` })
    }

    // Log the execution
    const now = new Date().toISOString()
    await sb.from('execution_log').insert({
      user_id:     userId,
      action_type: 'NOTIFY',
      tool_slug:   `notify:${channelType}`,
      connector:   channelType,
      final_args:  { channelType, ...(params ?? {}) },
      outcome:     'success',
      executed_at: now,
    })

    // Mark alert acknowledged so it leaves the cockpit queue
    if (alertId) {
      await sb.from('risk_alerts')
        .update({ status: 'acknowledged', updated_at: now })
        .eq('id', alertId)
        .eq('user_id', userId)
    }

    return res.status(200).json({ outcome: 'success' })
  } catch (err) {
    console.warn('[notify]', err?.message || err)
    return res.status(500).json({ error: err?.message || 'Failed to send notification' })
  }
}
