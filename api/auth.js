// redeploy trigger
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, email, password, name } = req.body || {}
  if (!action) return res.status(400).json({ error: 'Missing action' })

  const supabase = getSupabase()

  if (action === 'signin') {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ session: data.session, user: data.user })
  }

  if (action === 'signup') {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const opts = name ? { options: { data: { name: name.trim() } } } : {}
    const { data, error } = await supabase.auth.signUp({ email, password, ...opts })
    if (error) return res.status(400).json({ error: error.message })
    // session is null when email confirmation is required
    return res.json({ session: data.session ?? null, user: data.user ?? null })
  }

  return res.status(400).json({ error: 'Unknown action' })
}
