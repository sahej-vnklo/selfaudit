function normalizeDateInput(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function sanitizeGoalData(goalData = {}) {
  const payload = {
    id: goalData.id || undefined,
    parent_goal_id: goalData.parent_goal_id || null,
    owner_team_member_id: goalData.owner_team_member_id || null,
    area_id: goalData.area_id || null,
    title: String(goalData.title || '').trim(),
    goal_type: goalData.goal_type || 'company',
    metric_key: goalData.metric_key || null,
    metric_direction: goalData.metric_direction || null,
    baseline_value: goalData.baseline_value ?? null,
    target_value: goalData.target_value ?? null,
    current_value: goalData.current_value ?? null,
    progress: typeof goalData.progress === 'number' ? goalData.progress : Number(goalData.progress ?? 0),
    health_score: typeof goalData.health_score === 'number' ? goalData.health_score : Number(goalData.health_score ?? 0),
    deadline: normalizeDateInput(goalData.deadline),
    status: goalData.status || 'active',
    source_report_id: goalData.source_report_id || null,
    updated_at: new Date().toISOString(),
  }

  if (!payload.title) {
    throw new Error('Goal title is required')
  }

  for (const key of ['baseline_value', 'target_value', 'current_value']) {
    if (payload[key] != null) {
      const numeric = Number(payload[key])
      payload[key] = Number.isFinite(numeric) ? numeric : null
    }
  }

  if (!Number.isFinite(payload.progress)) payload.progress = 0
  if (!Number.isFinite(payload.health_score)) payload.health_score = 0

  if (!payload.id) delete payload.id
  return payload
}

export async function upsertGoalNode(supabase, userId, goalData) {
  if (!supabase) throw new Error('Supabase client is required')
  if (!userId) throw new Error('User ID is required')

  const payload = sanitizeGoalData(goalData)
  if (!payload.id && payload.goal_type === 'company' && payload.status === 'active') {
    const existingActiveGoal = await getActiveGoal(supabase, userId)
    if (existingActiveGoal?.id) {
      payload.id = existingActiveGoal.id
    }
  }

  const { data, error } = await supabase
    .from('goal_nodes')
    .upsert(
      { ...payload, user_id: userId },
      payload.id ? { onConflict: 'id' } : undefined
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function getActiveGoal(supabase, userId) {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('goal_nodes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('goal_type', 'company')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function syncFlatGoalFields(supabase, userId, goalNode) {
  try {
    if (!supabase || !userId || !goalNode) return

    const timeline = goalNode.deadline
      ? new Date(goalNode.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        })
      : null

    await supabase
      .from('business_state')
      .upsert(
        {
          user_id: userId,
          active_goal: goalNode.title ?? null,
          goal_score: Math.round(Number(goalNode.progress) || 0),
          goal_timeline: timeline,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
  } catch (error) {
    console.warn('[goals] flat goal sync failed:', error?.message || error)
  }
}
