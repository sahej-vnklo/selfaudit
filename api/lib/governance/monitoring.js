import { evaluateOperationalArea, getOperationalAreaModule } from './area-registry.js'
import { buildAreaMetricSnapshots } from './metric-snapshots.js'
import { buildCompoundDiagnosis } from './causal-engine.js'
import { COMPOUND_RULES_SAAS } from '../blueprint/catalog/areas.js'

function buildCombinedMetrics(snapshots) {
  const all = {}
  for (const snapshot of snapshots) {
    if (snapshot.metricsByKey) Object.assign(all, snapshot.metricsByKey)
  }
  return all
}

function compareCondition(value, comparator, threshold) {
  switch (comparator) {
    case 'lt':  return value < threshold
    case 'lte': return value <= threshold
    case 'gt':  return value > threshold
    case 'gte': return value >= threshold
    case 'eq':  return value === threshold
    case 'neq': return value !== threshold
    default:    return false
  }
}

// Evaluate compound rules from the schema (or fall back to SaaS defaults).
// Compound rules are cross-area signals that fire when two metrics breach simultaneously.
function evaluateCompoundRules(compoundRules, combinedMetrics) {
  // undefined = no schema at all → fall back to SaaS defaults
  // [] = schema exists but this industry has no rules yet → use empty, don't apply wrong-industry rules
  const rules = compoundRules === undefined ? COMPOUND_RULES_SAAS : (compoundRules ?? [])

  return rules
    .filter((rule) =>
      rule.conditions.every((cond) => {
        const val = combinedMetrics[cond.metricKey]
        return val != null && compareCondition(val, cond.comparator, cond.value)
      })
    )
    .map((rule) => ({
      id:              rule.id,
      type:            'risk',
      status:          rule.status ?? 'bad',
      severity:        rule.severity ?? 'high',
      areaId:          'cross',
      areaLabel:       'Cross-Area',
      title:           rule.title,
      summary:         rule.summary,
      recommendation:  rule.recommendation,
      metricKey:       'compound',
      comparator:      'compound',
      thresholdValue:  null,
      metricValue:     null,
    }))
}

function deriveAreaStatus(findings, coverage) {
  if (!coverage) return 'no-signal'
  if (findings.some((f) => f.status === 'bad'))   return 'bad'
  if (findings.some((f) => f.status === 'watch')) return 'watch'
  return 'good'
}

function summarizeArea(area, status, findings, coverage) {
  if (!coverage) return `No live signals yet for ${area?.label ?? 'this area'}.`
  if (status === 'bad') {
    return findings.filter((f) => f.status === 'bad').slice(0, 2).map((f) => f.title).join('; ')
  }
  if (status === 'watch') {
    return findings.filter((f) => f.status === 'watch' || f.status === 'bad').slice(0, 2).map((f) => f.title).join('; ')
  }
  return `${area?.label ?? 'This area'} looks stable based on the currently available signals.`
}

function toLegacyRisk(area, finding) {
  return {
    severity:           finding.severity,
    category:           area.areaId,
    title:              finding.title,
    description:        finding.summary,
    evidence:           `${finding.metricKey} ${finding.comparator} ${finding.thresholdValue} (observed ${finding.metricValue})`,
    recommended_action: finding.recommendation,
    source:             'governance',
  }
}

export function runGovernanceMonitoring({
  brain           = null,
  brief           = null,
  normalized      = null,
  checkedAt       = new Date().toISOString(),
  userOverrides   = null,
  schema          = null,
  metricOverrides = null,
  userMetrics     = null,
} = {}) {
  const snapshots = buildAreaMetricSnapshots({ brain, brief, normalized, checkedAt, schema, metricOverrides, userMetrics })

  // Build a lookup from schemaArea.id → schemaArea so evaluators use per-user rule packs if present
  const schemaAreaMap = Object.fromEntries(
    (schema?.areas ?? []).map((a) => [a.id, a])
  )

  const areas = snapshots.map((snapshot) => {
    const catalogArea = getOperationalAreaModule(snapshot.areaId)
    const schemaArea  = schemaAreaMap[snapshot.areaId] ?? null
    const areaRef     = schemaArea ?? catalogArea

    const findings = evaluateOperationalArea(snapshot.areaId, snapshot.metricsByKey, userOverrides, schemaArea)
    const status   = deriveAreaStatus(findings, snapshot.coverage)
    const summary  = summarizeArea(areaRef, status, findings, snapshot.coverage)

    return {
      areaId:   snapshot.areaId,
      label:    areaRef?.label ?? snapshot.areaId,
      status,
      summary,
      coverage: snapshot.coverage,
      sources:  snapshot.sources,
      metrics:  snapshot.metrics,
      findings,
    }
  })

  const areaFindings = areas.flatMap((area) =>
    area.findings.map((finding) => ({ ...finding, areaId: area.areaId, areaLabel: area.label }))
  )

  const combinedMetrics   = buildCombinedMetrics(snapshots)
  const compoundFindings  = evaluateCompoundRules(schema?.compoundRules, combinedMetrics)

  const findings = [...areaFindings, ...compoundFindings]

  // Causal diagnosis — surfaces root causes and cascades across bad metrics
  const badMetricKeys = areaFindings
    .filter((f) => f.status === 'bad' || f.status === 'watch')
    .map((f) => f.metricKey)
    .filter((k) => k !== 'compound')
  const causalDiagnosis = buildCompoundDiagnosis([...new Set(badMetricKeys)])

  const areaRisks = areas.flatMap((area) =>
    area.findings
      .filter((f) => f.status === 'watch' || f.status === 'bad')
      .map((f) => toLegacyRisk(area, f))
  )

  const compoundRisks = compoundFindings.map((finding) => ({
    severity:           finding.severity,
    category:           'cross-area',
    title:              finding.title,
    description:        finding.summary,
    evidence:           'Cross-area compound signal',
    recommended_action: finding.recommendation,
    source:             'governance-compound',
  }))

  const risks = [...areaRisks, ...compoundRisks]

  return {
    checkedAt,
    areas,
    snapshots,
    findings,
    compoundFindings,
    causalDiagnosis,
    risks,
    summary: {
      totalAreas:              areas.length,
      areasWithSignals:        areas.filter((a) => a.coverage > 0).length,
      areasNeedingAttention:   areas.filter((a) => a.status === 'bad').length,
      areasToWatch:            areas.filter((a) => a.status === 'watch').length,
      compoundSignals:         compoundFindings.length,
    },
  }
}
