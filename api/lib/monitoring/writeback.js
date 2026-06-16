function pickNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function buildOperationalPatch(normalized) {
  if (!normalized || !Array.isArray(normalized.metrics)) return {}

  const metricsByKey = Object.fromEntries(
    normalized.metrics
      .filter((item) => item?.key)
      .map((item) => [item.key, item.value]),
  )

  const patch = {}
  const candidates = {
    mrr: metricsByKey.mrr,
    arr: metricsByKey.arr,
    churn_rate: metricsByKey.churn_rate,
    active_customers: metricsByKey.active_customers ?? metricsByKey.customers,
    open_deals: metricsByKey.open_deals,
    open_pipeline_value: metricsByKey.open_pipeline_value ?? metricsByKey.pipeline_value,
  }

  for (const [key, rawValue] of Object.entries(candidates)) {
    const value = pickNumber(rawValue)
    if (value != null) patch[key] = value
  }

  return patch
}

export async function writeHealthCheckToIntelligenceBrief(userId, healthResult, supabase) {
  if (!userId || !healthResult || !supabase) return

  try {
    const { data: existingRow, error: existingError } = await supabase
      .from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      console.warn('[health-check] intelligence brief readback failed:', existingError.message)
      return
    }

    const existingContext = existingRow?.context && typeof existingRow.context === 'object' ? existingRow.context : {}
    const existingOperational = existingRow?.operational && typeof existingRow.operational === 'object' ? existingRow.operational : {}
    const governance = healthResult.governance || {}
    const causalDiagnosis = governance.causalDiagnosis || {}

    const contextPatch = {
      causal_summary: causalDiagnosis.summary || existingContext.causal_summary || null,
      root_candidates: Array.isArray(causalDiagnosis.rootCandidates) ? causalDiagnosis.rootCandidates : (existingContext.root_candidates || []),
      top_diagnoses: Array.isArray(governance.diagnoses)
        ? governance.diagnoses.slice(0, 3).map((item) => ({
            title: item?.title || '',
            severity: item?.severity || 'medium',
          }))
        : (existingContext.top_diagnoses || []),
      advice_summary: governance.advice_summary || existingContext.advice_summary || null,
      health_score: healthResult.health_score ?? existingContext.health_score ?? null,
      last_health_check_at: healthResult.checked_at || existingContext.last_health_check_at || null,
    }

    const operationalPatch = buildOperationalPatch(healthResult.normalized)

    const { error: upsertError } = await supabase
      .from('intelligence_brief')
      .upsert({
        user_id: userId,
        context: {
          ...existingContext,
          ...contextPatch,
        },
        operational: {
          ...existingOperational,
          ...operationalPatch,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (upsertError) {
      console.warn('[health-check] intelligence brief writeback failed:', upsertError.message)
    }
  } catch (error) {
    console.warn('[health-check] intelligence brief writeback failed:', error?.message || error)
  }
}
