import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const RESEND_API_KEY = process.env.RESEND_API_KEY
const ADMIN_EMAIL    = 'sahej@vnklo.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, source = 'voice_page' } = req.body || {}

  // Basic validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' })
  }
  const cleaned = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return res.status(400).json({ error: 'Please enter a valid email.' })
  }

  // ── Insert into voice_waitlist ────────────────────────────────────────────
  const { error: insertErr } = await supabase
    .from('voice_waitlist')
    .insert({ email: cleaned, source })

  if (insertErr) {
    // Unique violation — email already on waitlist, treat as success
    if (insertErr.code === '23505') {
      return res.status(200).json({ success: true, already: true })
    }
    console.error('[voice-waitlist] insert error:', insertErr.message)
    return res.status(500).json({ error: 'Could not save your email. Please try again.' })
  }

  // ── Notify sahej@vnklo.com via Resend ────────────────────────────────────
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from:    'SelfAudit <audit@tryselfaudit.com>',
          to:      [ADMIN_EMAIL],
          subject: `Voice Waitlist — ${cleaned}`,
          html:    `
            <div style="font-family:-apple-system,sans-serif;color:#0D0D0D;max-width:480px;margin:0 auto;padding:24px">
              <div style="font-size:13px;color:#9a8a7f;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:16px">SelfAudit · Voice Waitlist</div>
              <h2 style="font-size:22px;margin:0 0 8px">New pilot request</h2>
              <p style="font-size:16px;color:#2C2B28;margin:0 0 24px"><strong>${cleaned}</strong> just joined the Voice waitlist.</p>
              <div style="background:#f8f4f1;border-radius:8px;padding:16px;font-size:13px;color:#5a4f4a">
                <div><strong>Source:</strong> ${source}</div>
                <div style="margin-top:6px"><strong>Time:</strong> ${new Date().toUTCString()}</div>
              </div>
            </div>
          `,
        }),
      })
    } catch (emailErr) {
      // Email failure must not block the success response
      console.warn('[voice-waitlist] Resend error:', emailErr.message)
    }
  }

  return res.status(200).json({ success: true })
}
