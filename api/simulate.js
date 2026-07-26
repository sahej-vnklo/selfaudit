import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { runScenario } from './lib/governance/simulation.js'
import { persistForesightRun } from './lib/governance/foresight-runs.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, question, scenario } = req.body || {}
  const normalizedQuestion = typeof question === 'string' ? question.trim() : ''
  const legacyScenario = scenario && typeof scenario === 'object' && !Array.isArray(scenario) ? scenario : null
  if (!userId || (!normalizedQuestion && !legacyScenario)) {
    return res.status(400).json({ error: 'userId and a question are required' })
  }

  if (normalizedQuestion.length > 2000) {
    return res.status(413).json({ error: 'The scenario question is too long' })
  }

  if (legacyScenario) {
    const { metricKey, deltaType, deltaValue, label } = legacyScenario
    if (!metricKey || !deltaType || !Number.isFinite(Number(deltaValue)) || !label) {
      return res.status(400).json({ error: 'All legacy scenario fields are required' })
    }
    if (!['absolute', 'percent', 'set'].includes(deltaType)) {
      return res.status(400).json({ error: 'deltaType must be absolute, percent, or set' })
    }
  }

  if (!await validateUserToken(req, res, userId)) return

  try {
    const result = await runScenario(
      supabase,
      userId,
      normalizedQuestion ? { question: normalizedQuestion } : legacyScenario,
    )
    await persistForesightRun(
      supabase,
      userId,
      normalizedQuestion || legacyScenario.title || legacyScenario.label,
      result,
    )
    return res.status(200).json(result)
  } catch (error) {
    console.error('[simulate]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Simulation failed' })
  }
}
