import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { getCompanyBrain } from '../intelligence/company-brain.js'
import { getCompanyDNASummary } from '../intelligence/company-dna.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { loadSchema } from '../blueprint/schema-registry.js'
import { getEnrichedMetricEdge } from './graph/index.js'
import { projectDownstream } from './causal-engine.js'
import { runGovernanceMonitoring } from './monitoring.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}

const STATUS_RANK = { 'no-signal': 0, good: 1, watch: 2, bad: 3 }
const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 }

function findingKey(finding) {
  return finding?.id || `${finding?.areaId || ''}::${finding?.metricKey || ''}::${finding?.title || ''}`
}

function scanMetricValue(snapshots, metricKey) {
  for (const snapshot of snapshots || []) {
    if (snapshot?.metricsByKey && metricKey in snapshot.metricsByKey) {
      return snapshot.metricsByKey[metricKey]
    }
  }
  return null
}

function flattenMetricValues(snapshots) {
  return Object.assign({}, ...(snapshots || []).map((snapshot) => snapshot.metricsByKey || {}))
}

function buildMetricCatalog(schema) {
  const catalog = new Map()
  for (const area of schema?.areas || []) {
    for (const metric of area.metricFamilies || []) {
      if (!metric?.key || catalog.has(metric.key)) continue
      catalog.set(metric.key, {
        key: metric.key,
        label: metric.label || metric.key.replace(/_/g, ' '),
        unit: metric.unit || 'number',
        areaId: area.id || area.areaId,
        areaLabel: area.label || area.id || area.areaId,
        preferredDirection: metric.preferredDirection || null,
      })
    }
  }
  return catalog
}

export function computeAfterValue(beforeValue, deltaType, deltaValue) {
  const numericBefore = Number.isFinite(Number(beforeValue)) ? Number(beforeValue) : 0
  const numericDelta = Number(deltaValue)

  if (deltaType === 'percent') return Math.max(0, numericBefore * (1 + numericDelta / 100))
  if (deltaType === 'set') return Math.max(0, numericDelta)
  return Math.max(0, numericBefore + numericDelta)
}

function round(value, precision = 2) {
  if (!Number.isFinite(Number(value))) return null
  const factor = 10 ** precision
  return Math.round(Number(value) * factor) / factor
}

function deltaFor(before, after) {
  if (!Number.isFinite(Number(before)) || !Number.isFinite(Number(after))) {
    return { absolute: null, percent: null }
  }
  const absolute = Number(after) - Number(before)
  return {
    absolute: round(absolute),
    percent: Number(before) === 0 ? null : round((absolute / Math.abs(Number(before))) * 100, 1),
  }
}

export function projectKnownRelationship(fromKey, toKey, beforeSource, afterSource, baselineValues) {
  const target = Number(baselineValues[toKey])
  const before = Number(beforeSource)
  const after = Number(afterSource)
  if (![target, before, after].every(Number.isFinite) || before === 0) return null

  if (fromKey === 'burn_rate' && toKey === 'runway_months' && after > 0) {
    return { value: round(target * (before / after)), evidenceTier: 'calculated', basis: 'Cash held constant while burn changes.' }
  }

  if (fromKey === 'churn_rate' && toKey === 'mrr') {
    const beforeRetention = Math.max(0, 1 - before / 100)
    const afterRetention = Math.max(0, 1 - after / 100)
    if (beforeRetention === 0) return null
    return {
      value: round(target * ((afterRetention ** 3) / (beforeRetention ** 3))),
      evidenceTier: 'estimated',
      basis: 'Three-month retention effect with acquisition and pricing held constant.',
    }
  }

  const proportionalPairs = new Set([
    'lead_volume:open_deals',
    'stage_conversion:open_deals',
    'open_deals:pipeline_value',
    'pipeline_value:mrr',
  ])
  if (proportionalPairs.has(`${fromKey}:${toKey}`)) {
    return {
      value: round(target * (after / before)),
      evidenceTier: 'estimated',
      basis: 'Proportional relationship with all other drivers held constant.',
    }
  }

  return null
}

function buildAreaStatusChanges(baseline, simulated) {
  const baselineMap = new Map((baseline?.areas || []).map((area) => [area.areaId, area.status]))
  return (simulated?.areas || [])
    .filter((area) => baselineMap.get(area.areaId) !== area.status)
    .map((area) => ({
      areaId: area.areaId,
      areaLabel: area.label,
      before: baselineMap.get(area.areaId) || 'no-signal',
      after: area.status,
    }))
}

export function buildDelta(baseline, simulated) {
  const baselineMap = new Map((baseline?.findings || []).map((finding) => [findingKey(finding), finding]))
  const simulatedMap = new Map((simulated?.findings || []).map((finding) => [findingKey(finding), finding]))
  const newFindings = []
  const worsenedFindings = []
  const improvedFindings = []

  for (const [key, finding] of simulatedMap.entries()) {
    const previous = baselineMap.get(key)
    if (!previous) {
      newFindings.push(finding)
      continue
    }
    const statusUp = (STATUS_RANK[finding.status] || 0) > (STATUS_RANK[previous.status] || 0)
    const severityUp = (SEVERITY_RANK[finding.severity] || 0) > (SEVERITY_RANK[previous.severity] || 0)
    const statusDown = (STATUS_RANK[finding.status] || 0) < (STATUS_RANK[previous.status] || 0)
    if (statusUp || severityUp) worsenedFindings.push(finding)
    else if (statusDown) improvedFindings.push(finding)
  }

  for (const [key, finding] of baselineMap.entries()) {
    if (!simulatedMap.has(key)) improvedFindings.push(finding)
  }

  return {
    newFindings,
    worsenedFindings,
    improvedFindings,
    areaStatusChanges: buildAreaStatusChanges(baseline, simulated),
  }
}

function scenarioDirection(metric, before, after) {
  if (!metric || before == null || after == null || before === after) return 'neutral'
  if (metric.preferredDirection === 'lower-is-better') return after < before ? 'positive' : 'negative'
  if (metric.preferredDirection === 'higher-is-better') return after > before ? 'positive' : 'negative'
  return 'neutral'
}

function buildComparisonRows({ scenario, schema, baseline, afterValue, downstream }) {
  const catalog = buildMetricCatalog(schema)
  const values = flattenMetricValues(baseline.snapshots)
  const directMetric = catalog.get(scenario.metricKey) || {
    key: scenario.metricKey,
    label: scenario.label || scenario.metricKey.replace(/_/g, ' '),
    unit: 'number',
    areaId: null,
    areaLabel: 'Business',
    preferredDirection: null,
  }
  const beforeValue = values[scenario.metricKey] ?? null
  const directDelta = deltaFor(beforeValue, afterValue)
  const rows = [{
    ...directMetric,
    baseline: beforeValue,
    scenario: afterValue,
    delta: directDelta.absolute,
    deltaPercent: directDelta.percent,
    evidenceTier: 'calculated',
    direction: scenarioDirection(directMetric, beforeValue, afterValue),
    basis: scenario.deltaType === 'set' ? 'User-defined scenario value.' : 'Calculated from the requested change.',
  }]

  for (const effect of downstream.slice(0, 5)) {
    const metric = catalog.get(effect.key) || {
      key: effect.key,
      label: effect.key.replace(/_/g, ' '),
      unit: 'number',
      areaId: null,
      areaLabel: 'Connected area',
      preferredDirection: null,
    }
    const projected = projectKnownRelationship(scenario.metricKey, effect.key, beforeValue, afterValue, values)
    const projectedDelta = projected ? deltaFor(values[effect.key], projected.value) : { absolute: null, percent: null }
    rows.push({
      ...metric,
      baseline: values[effect.key] ?? null,
      scenario: projected?.value ?? null,
      delta: projectedDelta.absolute,
      deltaPercent: projectedDelta.percent,
      evidenceTier: projected?.evidenceTier || 'directional',
      direction: projected
        ? scenarioDirection(metric, values[effect.key], projected.value)
        : 'pressure',
      basis: projected?.basis || effect.mechanism,
      confidence: effect.confidence,
      delay: effect.delay || null,
      hops: effect.hops,
    })
  }

  return rows
}

function uniqueText(items, limit = 3) {
  return [...new Set(items.filter(Boolean))].slice(0, limit)
}

function buildDecisionBrief({ directRow, delta, downstream, patterns, comparisonRows }) {
  const risks = [...delta.newFindings, ...delta.worsenedFindings]
  const improvements = delta.improvedFindings
  const directPositive = directRow.direction === 'positive'
  const directNegative = directRow.direction === 'negative'

  let verdict = 'No material threshold change'
  let tone = 'neutral'
  if (risks.length > improvements.length || (directNegative && !improvements.length)) {
    verdict = 'Risk increases under this scenario'
    tone = 'negative'
  } else if (improvements.length > risks.length || (directPositive && !risks.length)) {
    verdict = 'Likely net positive'
    tone = 'positive'
  } else if (risks.length && improvements.length) {
    verdict = 'Material trade-off'
    tone = 'mixed'
  }

  const patternSupport = patterns?.filter((pattern) =>
    downstream.some((effect) => effect.key === pattern.to_metric && pattern.from_metric === directRow.key)
  ) || []
  const calculatedCount = comparisonRows.filter((row) => row.evidenceTier === 'calculated').length
  const estimatedCount = comparisonRows.filter((row) => row.evidenceTier === 'estimated').length
  const confidence = patternSupport.length || calculatedCount > 1
    ? 'High confidence'
    : estimatedCount || downstream.some((effect) => effect.confidence === 'high')
      ? 'Medium confidence'
      : 'Directional confidence'

  const upside = uniqueText([
    ...improvements.map((finding) => finding.summary || finding.title),
    ...comparisonRows.filter((row) => row.direction === 'positive').map((row) => `${row.label} improves under the modeled assumptions.`),
  ])
  const downside = uniqueText([
    ...risks.map((finding) => finding.summary || finding.title),
    ...comparisonRows.filter((row) => row.direction === 'negative').map((row) => `${row.label} moves in an unfavorable direction.`),
  ])
  const affectedAreas = uniqueText(comparisonRows.map((row) => row.areaLabel), 6)
  const assumptions = uniqueText([
    ...comparisonRows.filter((row) => row.evidenceTier !== 'directional').map((row) => row.basis),
    'Connected data remains broadly consistent over the selected horizon.',
    'No unmodeled intervention changes the outcome.',
  ], 4)
  const missingData = uniqueText([
    ...comparisonRows.filter((row) => row.baseline == null).map((row) => `No measured baseline for ${row.label}.`),
    ...comparisonRows.filter((row) => row.evidenceTier === 'directional').map((row) => `No calibrated magnitude for ${directRow.label} → ${row.label}.`),
  ], 4)

  return { verdict, tone, confidence, upside, downside, affectedAreas, assumptions, missingData }
}

function buildTimeline(downstream, comparisonRows) {
  const directRow = comparisonRows[0]
  const events = [{
    horizon: 'Now',
    tone: directRow.direction,
    text: `${directRow.label} changes from the current baseline.`,
  }]
  downstream.slice(0, 3).forEach((effect, index) => {
    const row = comparisonRows.find((item) => item.key === effect.key)
    events.push({
      horizon: effect.delay || (index === 0 ? '30 days' : index === 1 ? '60 days' : '90 days'),
      tone: row?.direction || 'pressure',
      text: `${row?.label || effect.key.replace(/_/g, ' ')}: ${effect.mechanism}`,
    })
  })
  return events
}

async function loadSimulationContext(supabase, userId) {
  const [brainRes, briefRes, schemaRes, dnaRes] = await Promise.allSettled([
    getCompanyBrain(userId, supabase),
    supabase.from('intelligence_brief').select('financial, operational, context').eq('user_id', userId).single(),
    loadSchema(userId),
    getCompanyDNASummary(supabase, userId),
  ])

  const brain = brainRes.status === 'fulfilled' ? brainRes.value : null
  const brief = briefRes.status === 'fulfilled' ? briefRes.value.data : null
  const schema = schemaRes.status === 'fulfilled' ? schemaRes.value : null
  const dna = dnaRes.status === 'fulfilled' ? dnaRes.value : { status: 'insufficient_data', patterns: [] }

  let normalized = null
  try {
    const { data: snapshot } = await supabase
      .from('connector_snapshots')
      .select('normalized_data, fetched_at')
      .eq('user_id', userId)
      .maybeSingle()
    const age = snapshot?.fetched_at ? Date.now() - new Date(snapshot.fetched_at).getTime() : Infinity
    if (snapshot?.normalized_data && age < 24 * 60 * 60 * 1000) {
      normalized = snapshot.normalized_data
    } else {
      const connectorData = await fetchAllConnectedData(userId)
      if (Object.keys(connectorData).length) normalized = normalizeConnectorData(connectorData)
    }
  } catch {
    normalized = null
  }

  return { brain, brief, normalized, schema, dna }
}

export async function runScenario(supabase, userId, scenario) {
  const sb = supabase || getSupabase()
  const { brain, brief, normalized, schema, dna } = await loadSimulationContext(sb, userId)
  const baseline = runGovernanceMonitoring({ brain, brief, normalized, schema })
  const beforeValue = scanMetricValue(baseline.snapshots, scenario.metricKey)

  if (beforeValue == null) {
    throw new Error(`No measured baseline is available for ${scenario.label || scenario.metricKey}.`)
  }

  const afterValue = computeAfterValue(beforeValue, scenario.deltaType, scenario.deltaValue)
  const simulated = runGovernanceMonitoring({
    brain,
    brief,
    normalized,
    schema,
    metricOverrides: { [scenario.metricKey]: afterValue },
  })

  const downstream = projectDownstream(scenario.metricKey, 2).map((effect) => {
    const enriched = effect.hops === 1 ? getEnrichedMetricEdge(scenario.metricKey, effect.key) : null
    return { ...effect, delay: enriched?.delay || null, conditions: enriched?.conditions || [], sources: enriched?.sources || [] }
  })
  const delta = buildDelta(baseline, simulated)
  const comparisonRows = buildComparisonRows({ scenario, schema, baseline, afterValue, downstream })
  const decisionBrief = buildDecisionBrief({
    directRow: comparisonRows[0],
    delta,
    downstream,
    patterns: dna.patterns,
    comparisonRows,
  })

  return {
    id: randomUUID(),
    title: scenario.title || scenario.label,
    createdAt: new Date().toISOString(),
    scenario: { ...scenario, beforeValue, afterValue },
    baseline: { summary: baseline.summary, findings: baseline.findings },
    simulated: { summary: simulated.summary, findings: simulated.findings },
    delta,
    comparisonRows,
    timeline: buildTimeline(downstream, comparisonRows),
    causalChain: downstream,
    decisionBrief,
    evidence: {
      companyPatternStatus: dna.status,
      companyPatternsUsed: dna.patterns?.filter((pattern) =>
        downstream.some((effect) => effect.key === pattern.to_metric && pattern.from_metric === scenario.metricKey)
      ) || [],
      disclaimer: 'Projections depend on the stated assumptions. Directional effects are not numerical forecasts.',
    },
    appliedPatch: { metricKey: scenario.metricKey, before: beforeValue, after: afterValue },
  }
}
