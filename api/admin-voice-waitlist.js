import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient as createAuth } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sahej@vnklo.com'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Verify admin session token
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const authClient = createAuth(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
  const { data: userData, error: authError } = await authClient.auth.getUser(token)
  if (authError || userData?.user?.email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch waitlist using service role
  const supabase = createSupabase(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from('voice_waitlist')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin-voice-waitlist] fetch error:', error.message)
    return res.status(500).json({ error: 'Could not fetch waitlist.' })
  }

  return res.status(200).json({ entries: data || [] })
}
