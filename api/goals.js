import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { getCompanyBrain } from './lib/intelligence/company-brain.js'
import { loadSchema } from './lib/blueprint/schema-registry.js'
import { runGovernanceMonitoring } from './lib/governance/monitoring.js'
import { computeGoalScore } from './lib/goals/score.js'
import { getActiveGoal, syncFlatGoalFields, upsertGoalNode } from './lib/goals/service.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function getRecentSnapshots(userId, metricKey) {
  if (!userId || !metricKey) return null

  const { data, error } = await supabase
    .from('area_metric_snapshots')
    .select('value, captured_at')
    .eq('user_id', userId)
    .eq('metric_name', metricKey)
    .order('captured_at', { ascending: false })
    .limit(2)

  if (error) throw error
  return data ?? []
}

async function getManagementStrategyStatus(userId) {
  const [brain, schema] = await Promise.all([
    getCompanyBrain(userId, supabase),
    loadSchema(userId),
  ])

  const monitoring = runGovernanceMonitoring({
    brain,
    schema,
    checkedAt: new Date().toISOString(),
  })

  return monitoring.areas.find((area) => area.areaId === 'management-strategy')?.status ?? null
}

export default async function handler(req, res) {
  const userId = req.method === 'GET' ? req.query.userId : req.body?.userId

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  if (!await validateUserToken(req, res, userId)) return

  try {
    if (req.method === 'GET') {
      const [{ data: all, error }, active] = await Promise.all([
        supabase
          .from('goal_nodes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        getActiveGoal(supabase, userId),
      ])

      if (error) throw error
      return res.status(200).json({ active, all: all ?? [] })
    }

    const goalData = req.body?.goalData
    if (!goalData || typeof goalData !== 'object') {
      return res.status(400).json({ error: 'Missing goalData' })
    }

    const stagedGoal = await upsertGoalNode(supabase, userId, goalData)
    const [recentSnapshots, areaStatus] = await Promise.all([
      getRecentSnapshots(userId, stagedGoal.metric_key),
      getManagementStrategyStatus(userId),
    ])

    const score = computeGoalScore(stagedGoal, recentSnapshots, areaStatus)
    const updatedGoal = await upsertGoalNode(supabase, userId, {
      ...stagedGoal,
      progress: score.progress,
      health_score: score.health_score,
    })

    syncFlatGoalFields(supabase, userId, updatedGoal).catch(() => {})

    return res.status(200).json({ active: updatedGoal, goal: updatedGoal })
  } catch (error) {
    console.error('[goals]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Goal update failed' })
  }
}
