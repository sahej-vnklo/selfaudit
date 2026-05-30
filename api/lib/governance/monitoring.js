import { evaluateOperationalArea, getOperationalAreaModule } from './area-registry.js'
import { buildAreaMetricSnapshots } from './metric-snapshots.js'

// Flatten all area metric snapshots into one combined key→value map
// so compound rules can reference metrics from different areas.
function buildCombinedMetrics(snapshots) {
  const all = {}
  for (const snapshot of snapshots) {
    if (snapshot.metricsByKey) Object.assign(all, snapshot.metricsByKey)
  }
  return all
}

// Cross-area compound rules — fire only when two metrics from different areas
// breach thresholds simultaneously, signalling a structural problem.
function evaluateCompoundRules(m) {
  const findings = []

  const num = (key) => (typeof m[key] === 'number' ? m[key] : null)

  const churn        = num('churn_rate')
  const runway       = num('runway_months')
  const openDeals    = num('open_deals')
  const leadVol      = num('lead_volume')
  const ltvCac       = num('ltv_cac_ratio')
  const goalProg     = num('goal_progress')
  const followThru   = num('followthrough_rate')
  const stageConv    = num('stage_conversion')
  const salesCycle   = num('sales_cycle_days')

  if (churn !== null && runway !== null && churn > 5 && runway < 9) {
    findings.push({
      id: 'compound:cash-fragility',
      type: 'risk', status: 'bad', severity: 'critical',
      areaId: 'cross', areaLabel: 'Cross-Area',
      title: 'Cash fragility',
      summary: `Churn at ${churn}% combined with ${runway} months runway creates compounding financial pressure.`,
      recommendation: 'Treat churn reduction and cash conservation as a single priority — one directly extends the other.',
      metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
    })
  }

  if (openDeals !== null && leadVol !== null && openDeals === 0 && leadVol < 10) {
    findings.push({
      id: 'compound:pipeline-collapse',
      type: 'risk', status: 'bad', severity: 'critical',
      areaId: 'cross', areaLabel: 'Cross-Area',
      title: 'Pipeline collapse',
      summary: 'No open deals and lead flow below 10 — the revenue engine has stalled at both ends of the funnel.',
      recommendation: 'Start an outbound sprint immediately and review every lead source for blockage.',
      metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
    })
  }

  if (ltvCac !== null && churn !== null && ltvCac < 1 && churn > 5) {
    findings.push({
      id: 'compound:unit-economics-inversion',
      type: 'risk', status: 'bad', severity: 'critical',
      areaId: 'cross', areaLabel: 'Cross-Area',
      title: 'Unit economics are inverted',
      summary: `LTV:CAC below 1 and churn above 5% means acquiring customers is destroying value, not building it.`,
      recommendation: 'Pause acquisition spend and fix retention before scaling further.',
      metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
    })
  }

  if (goalProg !== null && followThru !== null && goalProg < 60 && followThru < 60) {
    findings.push({
      id: 'compound:execution-breakdown',
      type: 'risk', status: 'bad', severity: 'high',
      areaId: 'cross', areaLabel: 'Cross-Area',
      title: 'Execution breakdown',
      summary: 'Goal progress below 60% and follow-through below 60% — strategy is not surviving contact with execution.',
      recommendation: 'Cut active priorities to 3 or fewer and rebuild weekly accountability before adding new goals.',
      metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
    })
  }

  if (stageConv !== null && salesCycle !== null && stageConv < 15 && salesCycle > 45) {
    findings.push({
      id: 'compound:sales-process-breakdown',
      type: 'risk', status: 'bad', severity: 'high',
      areaId: 'cross', areaLabel: 'Cross-Area',
      title: 'Sales process breakdown',
      summary: `Conversion below 15% and sales cycle above 45 days — the funnel is leaking at every stage and moving too slowly.`,
      recommendation: 'Run a focused sales process diagnostic and fix qualification and late-stage friction first.',
      metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
    })
  }

  return findings
}

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

export function runGovernanceMonitoring({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString(), userOverrides = null } = {}) {
  const snapshots = buildAreaMetricSnapshots({ brain, brief, normalized, checkedAt })

  const areas = snapshots.map((snapshot) => {
    const area = getOperationalAreaModule(snapshot.areaId)
    const findings = evaluateOperationalArea(snapshot.areaId, snapshot.metricsByKey, userOverrides)
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

  const areaFindings = areas.flatMap((area) =>
    area.findings.map((finding) => ({ ...finding, areaId: area.areaId, areaLabel: area.label }))
  )

  // Compound rules fire on combined metrics from all areas
  const combinedMetrics = buildCombinedMetrics(snapshots)
  const compoundFindings = evaluateCompoundRules(combinedMetrics)

  const findings = [...areaFindings, ...compoundFindings]

  const areaRisks = areas.flatMap((area) =>
    area.findings
      .filter((finding) => finding.status === 'watch' || finding.status === 'bad')
      .map((finding) => toLegacyRisk(area, finding))
  )

  const compoundRisks = compoundFindings.map((finding) => ({
    severity: finding.severity,
    category: 'cross-area',
    title: finding.title,
    description: finding.summary,
    evidence: 'Cross-area compound signal',
    recommended_action: finding.recommendation,
    source: 'governance-compound',
  }))

  const risks = [...areaRisks, ...compoundRisks]

  return {
    checkedAt,
    areas,
    snapshots,
    findings,
    compoundFindings,
    risks,
    summary: {
      totalAreas: areas.length,
      areasWithSignals: areas.filter((area) => area.coverage > 0).length,
      areasNeedingAttention: areas.filter((area) => area.status === 'bad').length,
      areasToWatch: areas.filter((area) => area.status === 'watch').length,
      compoundSignals: compoundFindings.length,
    },
  }
}
