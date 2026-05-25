import { evaluateOperationalArea, getOperationalAreaModule } from './area-registry.js'
import { buildAreaMetricSnapshots } from './metric-snapshots.js'

function deriveAreaStatus(findings, coverage) {
  if (!coverage) return 'no-signal'
  if (findings.some((finding) => finding.status === 'bad')) return 'bad'
  if (findings.some((finding) => finding.status === 'watch')) return 'watch'
  return 'good'
}

function summarizeArea(area, status, findings, coverage) {
  if (!coverage) {
    return `No live signals yet for ${area.label}.`
  }
  if (status === 'bad') {
    return findings
      .filter((finding) => finding.status === 'bad')
      .slice(0, 2)
      .map((finding) => finding.title)
      .join('; ')
  }
  if (status === 'watch') {
    return findings
      .filter((finding) => finding.status === 'watch' || finding.status === 'bad')
      .slice(0, 2)
      .map((finding) => finding.title)
      .join('; ')
  }
  return `${area.label} looks stable based on the currently available signals.`
}

function toLegacyRisk(area, finding) {
  return {
    severity: finding.severity,
    category: area.areaId,
    title: finding.title,
    description: finding.summary,
    evidence: `${finding.metricKey} ${finding.comparator} ${finding.thresholdValue} (observed ${finding.metricValue})`,
    recommended_action: finding.recommendation,
    source: 'governance',
  }
}

export function runGovernanceMonitoring({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString() } = {}) {
  const snapshots = buildAreaMetricSnapshots({ brain, brief, normalized, checkedAt })

  const areas = snapshots.map((snapshot) => {
    const area = getOperationalAreaModule(snapshot.areaId)
    const findings = evaluateOperationalArea(snapshot.areaId, snapshot.metricsByKey)
    const status = deriveAreaStatus(findings, snapshot.coverage)
    const summary = summarizeArea(area, status, findings, snapshot.coverage)

    return {
      areaId: snapshot.areaId,
      label: area?.label ?? snapshot.areaId,
      status,
      summary,
      coverage: snapshot.coverage,
      sources: snapshot.sources,
      metrics: snapshot.metrics,
      findings,
    }
  })

  const findings = areas.flatMap((area) =>
    area.findings.map((finding) => ({ ...finding, areaId: area.areaId, areaLabel: area.label }))
  )

  const risks = areas.flatMap((area) =>
    area.findings
      .filter((finding) => finding.status === 'watch' || finding.status === 'bad')
      .map((finding) => toLegacyRisk(area, finding))
  )

  return {
    checkedAt,
    areas,
    snapshots,
    findings,
    risks,
    summary: {
      totalAreas: areas.length,
      areasWithSignals: areas.filter((area) => area.coverage > 0).length,
      areasNeedingAttention: areas.filter((area) => area.status === 'bad').length,
      areasToWatch: areas.filter((area) => area.status === 'watch').length,
    },
  }
}
