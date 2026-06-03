import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code, userId } = req.body || {}
  if (!code || !userId) return res.status(400).json({ error: 'Missing code or userId' })

  // Validate that the request comes from the actual user
  if (!await validateUserToken(req, res, userId)) return

  // Look up the invite code
  const { data: invite, error: inviteErr } = await supabase
    .from('invite_codes')
    .select('id, active, cap, used_count')
    .eq('code', code)
    .single()

  if (inviteErr || !invite) return res.status(404).json({ error: 'Invalid invite link.' })
  if (!invite.active)             return res.status(403).json({ error: 'This invite link has expired.' })
  if (invite.used_count >= invite.cap) return res.status(403).json({ error: 'This invite link has reached its limit.' })

  // Set access expiry to exactly one year from now
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  // Activate pilot access on the profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      is_pilot:          true,
      access_expires_at: expiresAt.toISOString(),
      tier:              'intelligence',
    })
    .eq('id', userId)

  if (profileErr) {
    console.error('[invite-redeem] profile update failed:', profileErr.message)
    return res.status(500).json({ error: 'Could not activate your account. Please try again.' })
  }

  // Increment used_count — non-blocking, log failure but don't fail the request
  const { error: countErr } = await supabase
    .from('invite_codes')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id)

  if (countErr) {
    console.error('[invite-redeem] used_count increment failed:', countErr.message)
  }

  return res.status(200).json({
    success:    true,
    expires_at: expiresAt.toISOString(),
  })
}
