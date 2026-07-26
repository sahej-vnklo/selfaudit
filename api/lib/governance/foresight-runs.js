function latestObservedAt(result) {
  const timestamps = (result?.baseline?.facts || [])
    .map((fact) => fact?.observedAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())
  return timestamps[0]?.toISOString() || null
}

export async function persistForesightRun(supabase, userId, question, result) {
  const payload = {
    id: result.id,
    user_id: userId,
    model_version: result.modelVersion,
    question,
    status: result.status,
    scenario: result.scenario || {},
    result,
    baseline_observed_at: latestObservedAt(result),
    created_at: result.createdAt,
  }
  const { error } = await supabase.from('foresight_runs').insert(payload)
  if (error) throw error
  return result.id
}

export async function getOwnedForesightRun(supabase, userId, runId) {
  const { data, error } = await supabase
    .from('foresight_runs')
    .select('id, user_id, model_version, question, status, scenario, result, created_at')
    .eq('id', runId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data || null
}
