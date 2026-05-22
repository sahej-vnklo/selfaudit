import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

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
  if (!await validateUserToken(req, res, userId)) return

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error
    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not delete account' })
  }
}
