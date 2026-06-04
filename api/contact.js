const RESEND_API_KEY = process.env.RESEND_API_KEY
const ADMIN_EMAIL    = 'sahej@vnklo.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, message } = req.body || {}

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email.' })
  }
  if (!message || typeof message !== 'string' || message.trim().length < 5) {
    return res.status(400).json({ error: 'Please write a message.' })
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured.' })
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:     'SelfAudit <audit@tryselfaudit.com>',
        to:       [ADMIN_EMAIL],
        reply_to: email.trim(),
        subject:  `Contact — ${email.trim()}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;color:#0D0D0D;max-width:520px;margin:0 auto;padding:24px">
            <div style="font-size:12px;color:#9a8a7f;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:16px">SelfAudit · Contact</div>
            <h2 style="font-size:20px;margin:0 0 20px">New message</h2>
            <div style="background:#f8f4f1;border-radius:8px;padding:16px;font-size:14px;color:#5a4f4a;margin-bottom:20px">
              <strong>From:</strong> ${email.trim()}
            </div>
            <div style="font-size:15px;line-height:1.7;color:#2C2B28;white-space:pre-wrap">${message.trim()}</div>
          </div>
        `,
      }),
    })
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[contact] Resend error:', err.message)
    return res.status(500).json({ error: 'Could not send message. Please try again.' })
  }
}
