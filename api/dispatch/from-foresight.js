import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { stageForesightDispatchPackage } from '../lib/dispatch/packages.js'
import { getOwnedForesightRun } from '../lib/governance/foresight-runs.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { userId, runId } = req.body || {}
  if (!userId || typeof runId !== 'string' || !runId) {
    return res.status(400).json({ error: 'userId and runId are required' })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    const run = await getOwnedForesightRun(supabase, userId, runId)
    if (!run) return res.status(404).json({ error: 'Foresight run not found' })
    if (run.status === 'insufficient_evidence') {
      return res.status(422).json({ error: 'This run does not contain enough evidence for Dispatch' })
    }
    if (run.result?.scenario?.mode !== 'decision') {
      return res.status(422).json({ error: 'Name the action behind the metric change before sending it to Dispatch' })
    }
    const staged = await stageForesightDispatchPackage(supabase, userId, run.id, run.result)
    return res.status(staged.created ? 201 : 200).json({ package: staged.action, created: staged.created })
  } catch (error) {
    console.error('[dispatch/from-foresight]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Could not prepare the Foresight action package' })
  }
}
