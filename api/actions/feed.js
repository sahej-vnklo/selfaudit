import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.query.userId
  if (!userId) {
    return res.status(400).json({ error: 'userId required' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const [pendingRes, historyRes] = await Promise.all([
    supabase
      .from('pending_actions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('execution_log')
      .select('*')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(20),
  ])

  if (pendingRes.error) {
    return res.status(500).json({ error: pendingRes.error.message })
  }
  if (historyRes.error) {
    return res.status(500).json({ error: historyRes.error.message })
  }

  return res.status(200).json({
    pending: pendingRes.data || [],
    history: historyRes.data || [],
  })
}
