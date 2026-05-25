import { getOperationalAreaModule } from './area-registry.js'

const STATUS_PRIORITY = { bad: 0, watch: 1, good: 2, 'no-signal': 3 }
const SEVERITY_PRIORITY = { critical: 0, high: 1, medium: 2, low: 3 }

function compareFindings(a, b) {
  return (SEVERITY_PRIORITY[a.severity] ?? 9) - (SEVERITY_PRIORITY[b.severity] ?? 9)
}

function getMetricDefinition(area, metricKey) {
  return area?.metricFamilies?.find((metric) => metric.key === metricKey) ?? null
}

function buildRootCause(area, finding, metricDefinition) {
  const defaultInterpretation = metricDefinition?.defaultInterpretation || ''
  const rationale = finding?.rationale || ''
  const parts = [
    `${area.label} is under pressure because ${finding.summary.toLowerCase()}`,
    rationale,
    defaultInterpretation,
  ].filter(Boolean)

  return parts.join(' ')
}

function buildImpact(area, finding) {
  if (finding.metricKey === 'runway_months') {
    return 'This increases the chance of reactive cost cuts or forced financing decisions.'
  }
  if (finding.metricKey === 'churn_rate') {
    return 'This quietly drains growth because new revenue has to replace what is leaking out.'
  }
  if (finding.metricKey === 'stage_conversion' || finding.metricKey === 'open_deals') {
    return 'This weakens future revenue because pipeline is not strong enough to absorb normal fallout.'
  }
  if (finding.metricKey === 'followthrough_rate' || finding.metricKey === 'priority_backlog') {
    return 'This slows execution and turns leadership attention into operational debt.'
  }
  return `${area.label} performance will keep drifting if this is not corrected.`
}

function buildDiagnosisItem(areaEntry, finding) {
  const area = getOperationalAreaModule(areaEntry.areaId)
  const metricDefinition = getMetricDefinition(area, finding.metricKey)

  return {
    areaId: areaEntry.areaId,
    areaLabel: areaEntry.label,
    status: finding.status,
    severity: finding.severity,
    title: finding.title,
    summary: finding.summary,
    rootCause: buildRootCause(areaEntry, finding, metricDefinition),
    impact: buildImpact(areaEntry, finding),
    evidence: `${metricDefinition?.label || finding.metricKey}: observed ${finding.metricValue}, threshold ${finding.comparator} ${finding.thresholdValue}`,
    recommendation: finding.recommendation,
  }
}

function dedupeActions(items) {
  const seen = new Set()
  const output = []
  for (const item of items) {
    const key = String(item || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }
  return output
}

function buildExecutiveSummary(areasNeedingAttention, areasToWatch, diagnoses) {
  if (!diagnoses.length) {
    return 'No governance issues are currently being flagged from the available business signals.'
  }

  const top = diagnoses[0]
  const parts = []
  if (areasNeedingAttention > 0) {
    parts.push(`${areasNeedingAttention} area${areasNeedingAttention > 1 ? 's' : ''} need attention`)
  }
  if (areasToWatch > 0) {
    parts.push(`${areasToWatch} area${areasToWatch > 1 ? 's' : ''} should be watched closely`)
  }
  parts.push(`Top issue: ${top.title.toLowerCase()}`)
  return parts.join('. ') + '.'
}

export function buildGovernanceAdvice(governance) {
  const areas = Array.isArray(governance?.areas) ? governance.areas : []

  const diagnoses = areas
    .filter((area) => area.status === 'bad' || area.status === 'watch')
    .sort((a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9))
    .flatMap((area) =>
      [...(area.findings ?? [])]
        .sort(compareFindings)
        .map((finding) => buildDiagnosisItem(area, finding))
    )

  const recommendedActions = dedupeActions(
    diagnoses
      .sort(compareFindings)
      .map((item) => item.recommendation)
  ).slice(0, 6)

  const alertCandidates = diagnoses
    .filter((item) => item.severity === 'critical' || item.severity === 'high' || item.severity === 'medium')
    .map((item) => ({
      severity: item.severity,
      category: item.areaId,
      title: item.title,
      description: item.summary,
      evidence: item.evidence,
      recommended_action: item.recommendation,
      source: 'governance',
    }))

  return {
    summary: buildExecutiveSummary(
      governance?.summary?.areasNeedingAttention ?? 0,
      governance?.summary?.areasToWatch ?? 0,
      diagnoses,
    ),
    diagnoses: diagnoses.slice(0, 8),
    recommended_actions: recommendedActions,
    alert_candidates: alertCandidates,
  }
}
