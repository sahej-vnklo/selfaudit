export function formatDecisionsForPrompt(decisions) {
  if (!Array.isArray(decisions) || decisions.length === 0) return []

  return decisions.slice(0, 5).map((decision) => {
    const formatted = {
      finding_area_id: decision.finding_area_id,
      finding_title: decision.finding_title,
      metric_key: decision.metric_key,
      prior_action: decision.action_type,
      execution_outcome: decision.execution_outcome,
      executed_at: decision.created_at,
    }

    if (decision.observed_result != null) {
      formatted.observed_result = decision.observed_result
    }

    return formatted
  })
}
