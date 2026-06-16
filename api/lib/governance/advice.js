import { getArea } from '../blueprint/catalog/index.js'

const STATUS_PRIORITY   = { bad: 0, watch: 1, good: 2, 'no-signal': 3 }
const SEVERITY_PRIORITY = { critical: 0, high: 1, medium: 2, low: 3 }

function compareFindings(a, b) {
  return (SEVERITY_PRIORITY[a.severity] ?? 9) - (SEVERITY_PRIORITY[b.severity] ?? 9)
}

function getMetricDefinition(area, metricKey) {
  return area?.metricFamilies?.find((m) => m.key === metricKey) ?? null
}

function buildRootCause(area, finding, metricDefinition) {
  const parts = [
    `${area.label} is under pressure because ${finding.summary.toLowerCase()}`,
    finding.rationale || '',
    metricDefinition?.defaultInterpretation || '',
  ].filter(Boolean)
  return parts.join(' ')
}

function buildImpact(area, finding) {
  // Use the metric family's defaultInterpretation as the impact statement when available
  const def = getMetricDefinition(area, finding.metricKey)
  if (def?.defaultInterpretation) return def.defaultInterpretation
  return `${area.label} performance will keep drifting if this is not corrected.`
}

function buildDiagnosisItem(areaEntry, finding) {
  const area           = getArea(areaEntry.areaId) ?? areaEntry
  const metricDef      = getMetricDefinition(area, finding.metricKey)

  return {
    areaId:         areaEntry.areaId,
    areaLabel:      areaEntry.label,
    status:         finding.status,
    severity:       finding.severity,
    metricKey:      finding.metricKey,
    metricValue:    finding.metricValue,
    comparator:     finding.comparator,
    thresholdValue: finding.thresholdValue,
    title:          finding.title,
    summary:        finding.summary,
    rootCause:      buildRootCause(areaEntry, finding, metricDef),
    impact:         buildImpact(area, finding),
    evidence:       `${metricDef?.label || finding.metricKey}: observed ${finding.metricValue}, threshold ${finding.comparator} ${finding.thresholdValue}`,
    recommendation: finding.recommendation,
  }
}

function dedupeActions(items) {
  const seen   = new Set()
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
  const top   = diagnoses[0]
  const parts = []
  if (areasNeedingAttention > 0) parts.push(`${areasNeedingAttention} area${areasNeedingAttention > 1 ? 's' : ''} need attention`)
  if (areasToWatch > 0)          parts.push(`${areasToWatch} area${areasToWatch > 1 ? 's' : ''} should be watched closely`)
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
    diagnoses.sort(compareFindings).map((item) => item.recommendation)
  ).slice(0, 6)

  const alertCandidates = diagnoses
    .map((item) => ({
      severity:           item.severity,
      category:           item.areaId,
      title:              item.title,
      description:        item.summary,
      evidence:           item.evidence,
      recommended_action: item.recommendation,
      metricKey:          item.metricKey,
      metricValue:        item.metricValue,
      comparator:         item.comparator,
      thresholdValue:     item.thresholdValue,
      status:             item.status,
      source:             'governance',
    }))

  return {
    summary: buildExecutiveSummary(
      governance?.summary?.areasNeedingAttention ?? 0,
      governance?.summary?.areasToWatch          ?? 0,
      diagnoses,
    ),
    diagnoses:          diagnoses.slice(0, 8),
    recommended_actions: recommendedActions,
    alert_candidates:   alertCandidates,
  }
}
