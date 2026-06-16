import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { getActionForArtifact } from '../lib/actions/registry.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, artifactId, artifactType, artifact } = req.body || {}
  if (!userId || !artifactType || !artifact) {
    return res.status(400).json({ error: 'userId, artifactType, and artifact are required' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const action = getActionForArtifact(artifactType)
  if (!action) {
    return res.status(400).json({ error: `No action registered for artifact type: ${artifactType}` })
  }

  const stagedArgs = action.buildArgs(artifact, {})

  const { data, error } = await supabase
    .from('pending_actions')
    .insert({
      user_id: userId,
      artifact_id: artifactId || null,
      action_type: artifactType,
      tool_slug: action.tool,
      connector: action.connector,
      title: action.label,
      staged_args: stagedArgs,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ action: data })
}
