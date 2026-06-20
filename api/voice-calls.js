import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = req.query.userId
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()
  const { data, error } = await sb
    .from('voice_calls')
    .select('id, started_at, ended_at, duration_seconds, ended_reason, headline, summary, topics, decisions, actions_approved, actions_dismissed')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ calls: data ?? [] })
}
