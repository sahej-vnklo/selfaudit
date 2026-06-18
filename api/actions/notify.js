// POST /api/actions/notify
// Sends an approved action to the user's preferred communication channel.
//
// Body: { userId, alertId?, channelType, params, savePref? }
// + one of:
//   alertData:       { title, description, rootCause, impact, recommended_action, severity, category, escalation_tier }
//   artifactData:    { title, type, sections, summary }   ← from ExecutionPanel Push
//   pendingActionId: string                               ← loads staged_args from DB

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
const ARTIFACT_TYPE_LABELS = {
  ACTION_PLAN: 'Action Plan', EMAIL: 'Email Draft', TEAM_BRIEF: 'Team Brief',
  SOP: 'Standard SOP', PROCESS_CHANGE: 'Process Redesign', PRICING_MODEL: 'Pricing Model',
  HIRING_BRIEF: 'Hiring Brief', INVESTOR_UPDATE: 'Investor Update',
}

// ── Alert approval email (cockpit card with no staged artifact) ───────────────
function buildApprovalEmail({ toEmail, alertData }) {
  const tier      = alertData.escalation_tier || 'alert'
  const color     = TIER_COLOR[tier] || '#6B6860'
  const sevLabel  = SEV_LABEL[alertData.severity] || alertData.severity || ''
  const areaLabel = String(alertData.category || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const subject   = `Action approved: ${alertData.title || 'Risk alert'} — SelfAudit`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;color:#0D0D0D;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">
  <div style="border-bottom:2px solid ${color};padding-bottom:14px;margin-bottom:22px;">
    <div style="font-size:12px;color:#6B6860;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">SelfAudit — Action Approved</div>
    <h1 style="font-size:20px;margin:0;font-weight:700;">${esc(alertData.title)}</h1>
    <div style="margin-top:8px;">
      ${sevLabel ? `<span style="font-size:11px;background:${color};color:#fff;padding:2px 10px;border-radius:999px;font-weight:600;text-transform:uppercase;">${esc(sevLabel)}</span>` : ''}
      ${areaLabel ? `<span style="font-size:11px;color:#6B6860;margin-left:8px;">${esc(areaLabel)}</span>` : ''}
    </div>
  </div>
  ${alertData.description ? `<p style="font-size:15px;color:#2C2B28;margin:0 0 18px;line-height:1.65;">${esc(alertData.description)}</p>` : ''}
  ${alertData.rootCause ? `<div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:#6B6860;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Root cause</div><div style="font-size:14px;color:#1A1A1A;">${esc(alertData.rootCause)}</div></div>` : ''}
  ${alertData.impact ? `<div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:700;color:#6B6860;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">If ignored</div><div style="font-size:14px;color:#1A1A1A;">${esc(alertData.impact)}</div></div>` : ''}
  ${alertData.recommended_action ? `<div style="border:1px solid #D4EDDA;border-left:4px solid #1D9E75;background:#F0FBF5;border-radius:8px;padding:14px 16px;margin:20px 0;"><div style="font-size:11px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Approved action</div><div style="font-size:14px;color:#0D2B1A;line-height:1.6;">${esc(alertData.recommended_action)}</div></div>` : ''}
  <div style="margin-top:28px;text-align:center;"><a href="https://tryselfaudit.com/#home" style="display:inline-block;background:#0D0D0D;color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:14px;font-weight:600;">View Dashboard →</a></div>
  <div style="margin-top:30px;padding-top:14px;border-top:1px solid #E8E6E0;font-size:12px;color:#B0ADA4;">Sent via SelfAudit — tryselfaudit.com · Built by Vnklo</div>
</body></html>`

  const text = [`SelfAudit — Action Approved`, ``, alertData.title, ``, alertData.description || '',
    alertData.rootCause ? `Root cause: ${alertData.rootCause}` : '',
    alertData.impact ? `If ignored: ${alertData.impact}` : '',
    alertData.recommended_action ? `Approved action: ${alertData.recommended_action}` : '',
    ``, `View your dashboard: https://tryselfaudit.com/#home`, `— SelfAudit / tryselfaudit.com`,
  ].filter(Boolean).join('\n')

  return { subject, html, text, to: toEmail }
}

// ── Artifact email (ExecutionPanel Push, or staged pending_action) ────────────
function buildArtifactEmail({ toEmail, title, type, sections = [], summary }) {
  const typeLabel = ARTIFACT_TYPE_LABELS[type] || type || 'Artifact'
  const subject   = `${typeLabel}: ${title || 'Artifact'} — SelfAudit`

  const sectionBlocks = sections.map(s => `
  <div style="border:1px solid #E8E6E0;border-radius:8px;padding:14px 16px;margin-bottom:12px;">
    <div style="font-size:11px;font-weight:700;color:#6B6860;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">${esc(s.label)}</div>
    <div style="font-size:14px;color:#1A1A1A;line-height:1.7;white-space:pre-wrap;">${esc(s.content)}</div>
  </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;color:#0D0D0D;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">
  <div style="border-bottom:2px solid #0D0D0D;padding-bottom:14px;margin-bottom:22px;">
    <div style="font-size:12px;color:#6B6860;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">SelfAudit — ${esc(typeLabel)}</div>
    <h1 style="font-size:20px;margin:0;font-weight:700;">${esc(title)}</h1>
    ${summary ? `<p style="font-size:14px;color:#6B6860;margin:8px 0 0;line-height:1.5;">${esc(summary)}</p>` : ''}
  </div>
  ${sectionBlocks}
  <div style="margin-top:28px;text-align:center;"><a href="https://tryselfaudit.com/#home" style="display:inline-block;background:#0D0D0D;color:#fff;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:14px;font-weight:600;">View Dashboard →</a></div>
  <div style="margin-top:30px;padding-top:14px;border-top:1px solid #E8E6E0;font-size:12px;color:#B0ADA4;">Sent via SelfAudit — tryselfaudit.com · Built by Vnklo</div>
</body></html>`

  const text = [`SelfAudit — ${typeLabel}`, ``, title, summary ? `\n${summary}` : '',
    ``, ...sections.map(s => [`[${s.label}]`, s.content, ''].join('\n')),
    `View your dashboard: https://tryselfaudit.com/#home`, `— SelfAudit / tryselfaudit.com`,
  ].filter(s => s != null).join('\n')

  return { subject, html, text, to: toEmail }
}

// Parse staged_args markdown (## heading\n\ncontent) into sections array
function parseStagedArgsToSections(pendingAction) {
  const { staged_args, action_type } = pendingAction

  if (action_type === 'EMAIL') {
    return [
      { label: 'Subject', content: staged_args?.subject || '' },
      { label: 'Body',    content: staged_args?.body    || '' },
    ].filter(s => s.content)
  }

  if (staged_args?.markdown) {
    return staged_args.markdown
      .split(/\n##\s+/)
      .filter(Boolean)
      .map(block => {
        const newline = block.indexOf('\n')
        if (newline === -1) return { label: block.trim(), content: '' }
        return { label: block.slice(0, newline).trim(), content: block.slice(newline + 1).trim() }
      })
      .filter(s => s.label)
  }

  if (staged_args?.markdown_text) {
    return [{ label: 'Content', content: staged_args.markdown_text }]
  }

  return []
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

  const { userId, alertId, channelType, params, alertData, artifactData, pendingActionId, savePref } = req.body || {}

  if (!userId || !channelType) return res.status(400).json({ error: 'userId and channelType are required' })
  if (!alertData && !artifactData && !pendingActionId) return res.status(400).json({ error: 'alertData, artifactData, or pendingActionId is required' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

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

      let emailPayload

      if (pendingActionId) {
        // Load staged artifact from pending_actions and send its content
        const { data: pa, error: paErr } = await sb
          .from('pending_actions')
          .select('*')
          .eq('id', pendingActionId)
          .eq('user_id', userId)
          .single()
        if (paErr || !pa) return res.status(404).json({ error: 'Staged action not found' })
        const sections = parseStagedArgsToSections(pa)
        const title    = pa.staged_args?.title || pa.title || 'Action'
        emailPayload   = buildArtifactEmail({ toEmail, title, type: pa.action_type, sections })

      } else if (artifactData) {
        // Direct artifact push from ExecutionPanel
        emailPayload = buildArtifactEmail({
          toEmail,
          title:    artifactData.title,
          type:     artifactData.type,
          sections: artifactData.sections ?? [],
          summary:  artifactData.summary,
        })

      } else {
        // Alert approval summary (cockpit card with no staged artifact)
        emailPayload = buildApprovalEmail({ toEmail, alertData })
      }

      await sendViaResend(emailPayload)

    } else {
      return res.status(400).json({ error: `Channel type "${channelType}" not yet supported` })
    }

    const now = new Date().toISOString()
    await sb.from('execution_log').insert({
      user_id:     userId,
      action_type: pendingActionId ? 'STAGED_ARTIFACT' : artifactData ? 'ARTIFACT_PUSH' : 'NOTIFY',
      tool_slug:   `notify:${channelType}`,
      connector:   channelType,
      final_args:  { channelType, ...(params ?? {}) },
      outcome:     'success',
      executed_at: now,
    })

    if (pendingActionId) {
      await sb.from('pending_actions')
        .update({ status: 'executed', updated_at: now })
        .eq('id', pendingActionId)
        .eq('user_id', userId)
    }

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
