import { createClient } from '@supabase/supabase-js'
import { buildRiskAlertEmail } from './lib/notifications/risk-email.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body || {}
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  // 1. Fetch user profile (name + email for the notification)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('id', userId)
    .single()

  if (profileErr || !profile) {
    return res.status(404).json({ error: 'User not found' })
  }

  // 2. Fetch open alerts that have not been notified yet
  const { data: alerts, error: alertsErr } = await supabase
    .from('risk_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('notification_sent', false)
    .order('created_at', { ascending: false })

  if (alertsErr) {
    return res.status(500).json({ error: alertsErr.message })
  }

  if (!alerts?.length) {
    return res.status(200).json({ sent: false, reason: 'No unsent alerts' })
  }

  // 3. Build email payload
  const emailPayload = buildRiskAlertEmail(profile, alerts)
  if (!emailPayload) {
    return res.status(200).json({ sent: false, reason: 'Nothing to send' })
  }

  // 4. Send via Resend
  // TODO: swap `to` for user email once user-facing alerts are enabled.
  //       Currently sends to the ops address so the team can monitor.
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY

  if (!RESEND_API_KEY) {
    // No provider configured — return payload for inspection without marking sent
    return res.status(200).json({
      sent:    false,
      reason:  'RESEND_API_KEY not configured',
      payload: emailPayload,
    })
  }

  let sendError = null
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    'SelfAudit <audit@tryselfaudit.com>',
        to:      [emailPayload.to || profile.email],
        subject: emailPayload.subject,
        html:    emailPayload.html,
        text:    emailPayload.text,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      sendError = err.message || `Resend responded with ${response.status}`
    }
  } catch (fetchErr) {
    sendError = fetchErr.message
  }

  if (sendError) {
    console.error('[send-risk-alerts] send failed:', sendError)
    return res.status(500).json({ error: sendError })
  }

  // 5. Mark alerts as notified only after confirmed send
  const alertIds = alerts.map((a) => a.id)
  const { error: updateErr } = await supabase
    .from('risk_alerts')
    .update({ notification_sent: true })
    .in('id', alertIds)

  if (updateErr) {
    // Email was sent — log the failure but don't error the response
    console.warn('[send-risk-alerts] failed to mark alerts sent:', updateErr.message)
  }

  return res.status(200).json({
    sent:           true,
    alerts_notified: alertIds.length,
  })
}
