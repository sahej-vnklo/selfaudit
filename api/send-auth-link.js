import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function buildOrigin(req) {
  const explicit = String(req.body?.origin || '').trim()
  if (/^https?:\/\//i.test(explicit)) return explicit.replace(/\/+$/, '')

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`.replace(/\/+$/, '')
}

async function findAuthUserByEmail(email) {
  const target = normaliseEmail(email)
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const users = data?.users || []
    const match = users.find((user) => normaliseEmail(user.email) === target)
    if (match) return match
    if (users.length < 1000) break
    page += 1
  }

  return null
}

function buildEmailHtml({ mode, name, confirmUrl }) {
  const firstName = String(name || '').trim().split(/\s+/)[0] || 'there'
  const title = mode === 'signup' ? 'Finish creating your SelfAudit account' : 'Your SelfAudit sign-in link'
  const intro = mode === 'signup'
    ? `Hi ${firstName}, your account link is ready.`
    : `Hi ${firstName}, here is your secure sign-in link.`
  const body = mode === 'signup'
    ? 'Click below to create your account and continue inside SelfAudit.'
    : 'Click below to sign in to your SelfAudit account.'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #f7f4ef; margin: 0; padding: 24px; }
      .card { max-width: 560px; margin: 0 auto; background: #fffdf8; border: 1px solid #e7ded2; border-radius: 16px; padding: 32px 28px; }
      .eyebrow { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #7c6f63; margin-bottom: 10px; }
      h1 { font-size: 28px; line-height: 1.2; margin: 0 0 14px; color: #1f2937; }
      p { font-size: 15px; line-height: 1.7; color: #4b5563; margin: 0 0 14px; }
      .button { display: inline-block; margin-top: 10px; padding: 13px 22px; border-radius: 10px; background: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 600; }
      .footer { margin-top: 28px; padding-top: 18px; border-top: 1px solid #ece5da; font-size: 12px; color: #8b7d70; }
      .fallback { word-break: break-all; font-size: 12px; color: #6b7280; margin-top: 14px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="eyebrow">SelfAudit</div>
      <h1>${title}</h1>
      <p>${intro}</p>
      <p>${body}</p>
      <a class="button" href="${confirmUrl}">${mode === 'signup' ? 'Create account' : 'Sign in'}</a>
      <p class="fallback">If the button does not open, paste this link into your browser:<br>${confirmUrl}</p>
      <div class="footer">This link is secure and time-sensitive. If you did not request it, you can ignore this email.</div>
    </div>
  </body>
</html>`
}

async function sendEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'SelfAudit <audit@tryselfaudit.com>',
      to: [to],
      subject,
      html,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.message || `Resend responded with ${response.status}`)
  }

  return payload
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const email = normaliseEmail(req.body?.email)
  const name = String(req.body?.name || '').trim()
  const mode = req.body?.mode === 'signup' ? 'signup' : 'login'

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }

  try {
    const existingUser = await findAuthUserByEmail(email)

    if (mode === 'login' && !existingUser) {
      return res.status(404).json({ error: 'No account exists for that email yet.' })
    }

    if (mode === 'signup' && existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const origin = buildOrigin(req)
    const redirectTo = `${origin}/`

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        data: name ? { name } : undefined,
        redirectTo,
      },
    })

    if (error) throw error

    const tokenHash = data?.properties?.hashed_token
    const verificationType = data?.properties?.verification_type
    if (!tokenHash || !verificationType) {
      throw new Error('Could not generate auth link')
    }

    const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verificationType)}`

    await sendEmail({
      to: email,
      subject: mode === 'signup' ? 'Create your SelfAudit account' : 'Your SelfAudit sign-in link',
      html: buildEmailHtml({ mode, name: name || existingUser?.user_metadata?.name || email, confirmUrl }),
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Could not send sign-in link.' })
  }
}
