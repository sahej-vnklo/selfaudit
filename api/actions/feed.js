import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { normalizeDispatchPackage } from '../lib/dispatch/packages.js'

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

  const [packagesRes, historyRes] = await Promise.all([
    supabase
      .from('pending_actions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100),
    supabase
      .from('execution_log')
      .select('*')
      .eq('user_id', userId)
      .order('executed_at', { ascending: false })
      .limit(20),
  ])

  if (packagesRes.error) {
    return res.status(500).json({ error: packagesRes.error.message })
  }
  if (historyRes.error) {
    return res.status(500).json({ error: historyRes.error.message })
  }

  const actions = packagesRes.data || []
  const artifactIds = [...new Set(actions.map((action) => action.artifact_id).filter(Boolean))]
  let artifactMap = new Map()
  if (artifactIds.length > 0) {
    const { data: artifacts, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, artifact_type, title, summary, artifact_data, created_at')
      .in('id', artifactIds)
    if (artifactError) return res.status(500).json({ error: artifactError.message })
    artifactMap = new Map((artifacts || []).map((artifact) => [artifact.id, artifact]))
  }

  const packages = actions.map((action) => normalizeDispatchPackage(action, artifactMap.get(action.artifact_id)))

  return res.status(200).json({
    pending: packages.filter((action) => action.status === 'pending'),
    packages,
    history: historyRes.data || [],
  })
}
