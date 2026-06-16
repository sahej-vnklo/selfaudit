function isSignificantFinding(finding) {
  const status = String(finding?.status || '').toLowerCase()
  const severity = String(finding?.severity || '').toLowerCase()
  return ['watch', 'bad'].includes(status) || ['medium', 'high', 'critical'].includes(severity)
}

function toNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function compareMetricResult(directionHint, originalValue, nextValue) {
  if (nextValue == null) return 'unknown'
  if (originalValue == null) return 'unknown'
  if (nextValue === originalValue) return 'unchanged'

  const hint = String(directionHint || '').toLowerCase()
  const higherIsWorse = hint.includes('lt ') || hint.includes('lte ') || hint.includes('below') || hint.includes('under')
  const lowerIsWorse = hint.includes('gt ') || hint.includes('gte ') || hint.includes('above') || hint.includes('over')

  if (higherIsWorse) return nextValue > originalValue ? 'worsened' : 'improved'
  if (lowerIsWorse) return nextValue < originalValue ? 'worsened' : 'improved'

  return nextValue < originalValue ? 'improved' : 'worsened'
}

export async function createDecisionRecord(supabase, userId, { pendingAction, executionLogRow }) {
  if (!supabase || !userId || !pendingAction || !executionLogRow) return null

  const finding = pendingAction.finding_snapshot
  if (!finding || typeof finding !== 'object' || !isSignificantFinding(finding)) {
    return null
  }

  const payload = {
    user_id: userId,
    pending_action_id: pendingAction.id,
    execution_log_id: executionLogRow.id,
    artifact_id: pendingAction.artifact_id || null,
    source_health_check_id: pendingAction.source_health_check_id || null,
    finding_fingerprint: pendingAction.finding_fingerprint || '',
    finding_area_id: finding.areaId || '',
    finding_title: finding.title || '',
    finding_status: finding.status || null,
    finding_severity: finding.severity || null,
    metric_key: finding.metricKey || null,
    metric_value: toNumber(finding.metricValue),
    comparator: finding.comparator || null,
    threshold_value: toNumber(finding.thresholdValue),
    recommendation: finding.recommendation || null,
    action_type: pendingAction.action_type,
    tool_slug: pendingAction.tool_slug || null,
    connector: pendingAction.connector || null,
    execution_outcome: executionLogRow.outcome,
    finding_snapshot: finding,
    action_snapshot: {
      artifact_id: pendingAction.artifact_id || null,
      title: pendingAction.title || null,
      staged_args: pendingAction.staged_args || {},
      final_args: executionLogRow.final_args || {},
    },
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('decision_records')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function observeDecisionOutcomes(supabase, userId, healthCheckId, findings) {
  try {
    if (!supabase || !userId) return

    const currentFindings = Array.isArray(findings) ? findings : []
    const { data: pendingDecisions, error } = await supabase
      .from('decision_records')
      .select('*')
      .eq('user_id', userId)
      .eq('observation_status', 'pending')

    if (error) throw error
    if (!pendingDecisions?.length) return

    for (const decision of pendingDecisions) {
      const matchedFinding = currentFindings.find((finding) =>
        (decision.metric_key && finding.metricKey && decision.metric_key === finding.metricKey && decision.finding_area_id === finding.areaId)
        || (!decision.metric_key && decision.finding_area_id === finding.areaId && decision.finding_title === finding.title)
      )

      let observedResult = 'resolved'
      let observedMetricValue = null
      let observedNotes = 'Finding is no longer present in the latest governance pass.'

      if (matchedFinding) {
        observedMetricValue = toNumber(matchedFinding.metricValue)
        observedResult = compareMetricResult(
          `${decision.metric_key || ''} ${decision.comparator || ''} ${decision.threshold_value || ''}`,
          toNumber(decision.metric_value),
          observedMetricValue,
        )
        observedNotes = `Latest finding status: ${matchedFinding.status || 'unknown'}`
      }

      await supabase
        .from('decision_records')
        .update({
          observation_status: 'observed',
          observed_health_check_id: healthCheckId || null,
          observed_at: new Date().toISOString(),
          observed_metric_value: observedMetricValue,
          observed_result: observedResult,
          observed_notes: observedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', decision.id)
    }
  } catch (error) {
    console.warn('[decisions] observe outcomes failed:', error?.message || error)
  }
}

export async function getRecentDecisions(supabase, userId, limit = 20) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('decision_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
