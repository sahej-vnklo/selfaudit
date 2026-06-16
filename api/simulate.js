import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { runScenario } from './lib/governance/simulation.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, scenario } = req.body || {}
  if (!userId || !scenario || typeof scenario !== 'object') {
    return res.status(400).json({ error: 'userId and scenario are required' })
  }

  const { metricKey, deltaType, deltaValue, label } = scenario
  if (!metricKey || !deltaType || deltaValue == null || !label) {
    return res.status(400).json({ error: 'All scenario fields are required' })
  }

  if (!['absolute', 'percent', 'set'].includes(deltaType)) {
    return res.status(400).json({ error: 'deltaType must be absolute, percent, or set' })
  }

  if (!await validateUserToken(req, res, userId)) return

  try {
    const result = await runScenario(supabase, userId, scenario)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[simulate]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Simulation failed' })
  }
}
