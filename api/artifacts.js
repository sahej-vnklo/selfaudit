import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const { data, error } = await supabase
    .from('artifacts')
    .select('id, artifact_type, title, summary, artifact_data, created_at, report_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ artifacts: data ?? [] })
}
