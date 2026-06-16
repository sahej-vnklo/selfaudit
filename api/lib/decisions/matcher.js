function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildFindingFingerprint(finding) {
  const areaId = String(finding?.areaId || finding?.finding_area_id || '')
  const metricKey = String(finding?.metricKey || finding?.metric_key || '')
  const title = normalizeTitle(finding?.title || finding?.finding_title || '')
  return `${areaId}::${metricKey}::${title}`
}

function scoreDecisionMatch(decision, finding) {
  let score = 0
  const decisionArea = decision.finding_area_id || ''
  const findingArea = finding.areaId || ''
  const decisionMetric = decision.metric_key || ''
  const findingMetric = finding.metricKey || ''
  const decisionTitle = normalizeTitle(decision.finding_title)
  const findingTitle = normalizeTitle(finding.title)

  if (decisionArea && findingArea && decisionArea === findingArea && decisionMetric && findingMetric && decisionMetric === findingMetric) {
    score += 5
  }

  if (decisionArea && findingArea && decisionArea === findingArea && decisionTitle && findingTitle && decisionTitle === findingTitle) {
    score += 3
  }

  if (decision.finding_severity && finding.severity && decision.finding_severity === finding.severity) {
    score += 1
  }

  if (decision.finding_status && finding.status && decision.finding_status === finding.status) {
    score += 1
  }

  return score
}

export async function findRelevantDecisions(supabase, userId, currentFindings) {
  if (!supabase || !userId || !Array.isArray(currentFindings) || currentFindings.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('decision_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const scored = []

  for (const decision of data ?? []) {
    let bestScore = 0
    for (const finding of currentFindings) {
      bestScore = Math.max(bestScore, scoreDecisionMatch(decision, finding))
    }

    if (bestScore >= 3) {
      scored.push({ ...decision, _decision_score: bestScore })
    }
  }

  const deduped = Array.from(
    new Map(
      scored
        .sort((a, b) => {
          if ((b._decision_score ?? 0) !== (a._decision_score ?? 0)) {
            return (b._decision_score ?? 0) - (a._decision_score ?? 0)
          }
          return new Date(b.created_at) - new Date(a.created_at)
        })
        .map((decision) => [decision.id, decision]),
    ).values(),
  )

  return deduped.slice(0, 5)
}
