import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { stageForesightDispatchPackage } from '../lib/dispatch/packages.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { userId, sourceId, result } = req.body || {}
  if (!userId || !sourceId || !result || typeof result !== 'object' || Array.isArray(result)) {
    return res.status(400).json({ error: 'userId, sourceId, and result are required' })
  }
  if (JSON.stringify(result).length > 500_000) return res.status(413).json({ error: 'The Foresight result is too large' })
  if (!await validateUserToken(req, res, userId)) return

  try {
    const staged = await stageForesightDispatchPackage(supabase, userId, sourceId, result)
    return res.status(staged.created ? 201 : 200).json({ package: staged.action, created: staged.created })
  } catch (error) {
    console.error('[dispatch/from-foresight]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Could not prepare the Foresight action package' })
  }
}
