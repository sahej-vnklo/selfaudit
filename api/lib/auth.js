import { createClient } from '@supabase/supabase-js'

function getAnonClient() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
}

// Validates the Bearer token in Authorization header belongs to expectedUserId.
// Sends 401 and returns false on failure. Usage:
//   if (!await validateUserToken(req, res, userId)) return
export async function validateUserToken(req, res, expectedUserId) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  const { data, error } = await getAnonClient().auth.getUser(token)
  if (error || data?.user?.id !== expectedUserId) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
