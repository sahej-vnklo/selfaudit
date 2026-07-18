import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  const userId = req.method === 'GET' ? req.query?.userId : req.body?.userId
  if (!userId) return res.status(400).json({ error: 'userId is required' })
  if (!await validateUserToken(req, res, userId)) return

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('foresight_scenarios')
        .select('id, title, scenario, result, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return res.status(200).json({ scenarios: data || [] })
    }

    if (req.method === 'POST') {
      const { title, scenario, result } = req.body || {}
      const normalizedTitle = typeof title === 'string' ? title.trim().slice(0, 160) : ''
      const validScenario = scenario && typeof scenario === 'object' && !Array.isArray(scenario)
      const validResult = result && typeof result === 'object' && !Array.isArray(result)
      if (!normalizedTitle || !validScenario || !validResult) {
        return res.status(400).json({ error: 'title, scenario, and result are required' })
      }
      if (JSON.stringify({ scenario, result }).length > 500_000) {
        return res.status(413).json({ error: 'The saved scenario is too large' })
      }
      const payload = {
        user_id: userId,
        title: normalizedTitle,
        scenario,
        result,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('foresight_scenarios')
        .insert(payload)
        .select('id, title, scenario, result, created_at, updated_at')
        .single()
      if (error) throw error
      return res.status(201).json({ scenario: data })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[foresight-scenarios]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Foresight scenario request failed' })
  }
}
