import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { getCompanyBrain } from '../intelligence/company-brain.js'
import { getCompanyDNASummary } from '../intelligence/company-dna.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { loadSchema } from '../blueprint/schema-registry.js'
import { runGovernanceMonitoring } from './monitoring.js'
import { buildScenarioGraph } from './relation-models.js'
import { interpretScenarioQuestion } from './scenario-parser.js'

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

export function buildUserMetricMap(rows = []) {
  return Object.fromEntries(
    rows
      .filter((row) => row?.name && row.value != null && Number.isFinite(Number(row.value)))
      .map((row) => [row.name, Number(row.value)]),
  )
}

const SOURCE_PRIORITY = {
  connector: 5,
  integration: 5,
  normalized: 5,
  intelligence_brief: 4,
  company_brain: 3,
  manual: 2,
  derived: 1,
  unknown: 0,
}

function normalizedSourceType(source) {
  const value = String(source || '').toLowerCase()
  if (/connector|integration|stripe|hubspot|salesforce|quickbooks|xero|shopify|zendesk/.test(value)) return 'connector'
  if (/brief/.test(value)) return 'intelligence_brief'
  if (/brain/.test(value)) return 'company_brain'
  if (/manual/.test(value)) return 'manual'
  if (/derived|computed|ratio|divide/.test(value)) return 'derived'
  return value || 'unknown'
}

export function buildBaselineFacts(snapshots = [], userMetricRows = []) {
  const manualRows = new Map((userMetricRows || []).map((row) => [row.name, row]))
  const facts = new Map()

  for (const snapshot of snapshots || []) {
    const metricSources = new Map((snapshot.metrics || []).map((item) => [item.key, item]))
    for (const [key, value] of Object.entries(snapshot.metricsByKey || {})) {
      if (!Number.isFinite(Number(value))) continue
      const sourceMetric = metricSources.get(key)
      const manualRow = manualRows.get(key)
      const sourceType = sourceMetric
        ? normalizedSourceType(sourceMetric.source)
        : manualRow
          ? 'manual'
          : 'unknown'
      const fact = {
        key,
        value: Number(value),
        sourceType,
        sourceLabel: sourceMetric?.source || (manualRow ? 'User-entered metric' : 'Unknown source'),
        observedAt: sourceType === 'manual'
          ? manualRow?.updated_at || null
          : snapshot.checkedAt || null,
      }
      const previous = facts.get(key)
      if (!previous || (SOURCE_PRIORITY[fact.sourceType] || 0) > (SOURCE_PRIORITY[previous.sourceType] || 0)) {
        facts.set(key, fact)
      }
    }
  }

  return facts
}

export function buildMetricCatalog(schema) {
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

function rawChangeDirection(before, after) {
  if (!Number.isFinite(Number(before)) || !Number.isFinite(Number(after)) || Number(before) === Number(after)) return 'neutral'
  return Number(after) > Number(before) ? 'up' : 'down'
}

function directionFromRawChange(metric, changeDirection) {
  if (changeDirection === 'mixed') return 'mixed'
  if (!['up', 'down'].includes(changeDirection)) return 'unknown'
  if (metric?.preferredDirection === 'lower-is-better') return changeDirection === 'down' ? 'positive' : 'negative'
  if (metric?.preferredDirection === 'higher-is-better') return changeDirection === 'up' ? 'positive' : 'negative'
  return 'unknown'
}

function directionLabel(direction) {
  if (direction === 'up') return 'increase'
  if (direction === 'down') return 'decrease'
  if (direction === 'mixed') return 'move in competing directions'
  return 'change'
}

function evidenceRank(tier) {
  return tier === 'calculated' ? 3 : tier === 'estimated' ? 2 : tier === 'directional' ? 1 : 0
}

function buildComparisonRows({ scenario, schema, baselineFacts, afterValue, scenarioGraph }) {
  const catalog = buildMetricCatalog(schema)
  const values = Object.fromEntries([...baselineFacts.entries()].map(([key, fact]) => [key, fact.value]))
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
    source: baselineFacts.get(scenario.metricKey) || null,
    baseline: beforeValue,
    scenario: afterValue,
    delta: directDelta.absolute,
    deltaPercent: directDelta.percent,
    evidenceTier: 'assumed',
    direction: scenarioDirection(directMetric, beforeValue, afterValue),
    changeDirection: rawChangeDirection(beforeValue, afterValue),
    basis: scenario.deltaType === 'set' ? 'User-defined scenario value.' : 'Calculated from the requested change.',
  }]

  const scenarioValues = new Map([[scenario.metricKey, afterValue]])
  const graphNodes = [...(scenarioGraph?.nodes || [])]
    .filter((node) => node.key !== scenario.metricKey)
    .sort((a, b) => a.depth - b.depth)

  for (const node of graphNodes.slice(0, 8)) {
    const metric = catalog.get(node.key) || {
      key: node.key,
      label: node.key.replace(/_/g, ' '),
      unit: 'number',
      areaId: null,
      areaLabel: 'Connected area',
      preferredDirection: null,
    }
    const incoming = (scenarioGraph.edges || []).filter((edge) => edge.to === node.key)
    const candidates = incoming
      .map((edge) => {
        const sourceScenarioValue = scenarioValues.get(edge.from)
        const sourceBaselineValue = values[edge.from]
        if (sourceScenarioValue == null || sourceBaselineValue == null) return null
        const projected = projectKnownRelationship(
          edge.from,
          node.key,
          sourceBaselineValue,
          sourceScenarioValue,
          values,
        )
        return projected ? { ...projected, edge } : null
      })
      .filter(Boolean)
      .sort((a, b) => evidenceRank(b.evidenceTier) - evidenceRank(a.evidenceTier))

    const projected = candidates[0] || null
    if (projected) scenarioValues.set(node.key, projected.value)
    const projectedDelta = projected ? deltaFor(values[node.key], projected.value) : { absolute: null, percent: null }
    const nodeDirection = projected
      ? rawChangeDirection(values[node.key], projected.value)
      : node.changeDirection
    const mechanisms = [...new Set(incoming.map((edge) => edge.mechanism).filter(Boolean))]
    rows.push({
      ...metric,
      source: baselineFacts.get(node.key) || null,
      baseline: values[node.key] ?? null,
      scenario: projected?.value ?? null,
      delta: projectedDelta.absolute,
      deltaPercent: projectedDelta.percent,
      evidenceTier: projected?.evidenceTier || 'directional',
      direction: projected
        ? scenarioDirection(metric, values[node.key], projected.value)
        : directionFromRawChange(metric, nodeDirection),
      changeDirection: nodeDirection,
      basis: projected?.basis || `${metric.label} is expected to ${directionLabel(nodeDirection)}; the magnitude is not calibrated.`,
      mechanisms,
      confidence: incoming.length && incoming.every((edge) => edge.confidence === 'high') ? 'high' : 'medium',
      delay: incoming.map((edge) => edge.delay).find(Boolean) || null,
      depth: node.depth,
    })
  }

  const rowMap = new Map(rows.map((row) => [row.key, row]))
  const causalGraph = {
    root: scenarioGraph.root,
    nodes: (scenarioGraph.nodes || []).map((node) => {
      const row = rowMap.get(node.key)
      const metric = catalog.get(node.key)
      return {
        ...node,
        label: metric?.label || node.key.replace(/_/g, ' '),
        direction: row?.direction || directionFromRawChange(metric, node.changeDirection),
        evidenceTier: row?.evidenceTier || 'directional',
        scenario: row?.scenario ?? null,
        baseline: row?.baseline ?? null,
      }
    }),
    edges: (scenarioGraph.edges || []).map((edge) => ({
      ...edge,
      fromLabel: catalog.get(edge.from)?.label || edge.from.replace(/_/g, ' '),
      toLabel: catalog.get(edge.to)?.label || edge.to.replace(/_/g, ' '),
      effectText: edge.changeDirection === 'unknown'
        ? 'The direction of this relationship cannot be defended without additional conditions.'
        : `${catalog.get(edge.to)?.label || edge.to.replace(/_/g, ' ')} is expected to ${directionLabel(edge.changeDirection)}. Magnitude is ${rowMap.get(edge.to)?.scenario == null ? 'not calibrated' : 'modeled separately'}.`,
    })),
  }

  return { rows, causalGraph }
}

function uniqueText(items, limit = 3) {
  return [...new Set(items.filter(Boolean))].slice(0, limit)
}

export function buildDecisionBrief({ scenario, delta, comparisonRows, causalGraph, patterns = [] }) {
  const directRow = comparisonRows[0]
  const positiveRows = comparisonRows.filter((row) => row.direction === 'positive')
  const negativeRows = comparisonRows.filter((row) => row.direction === 'negative')
  const unknownRows = comparisonRows.filter((row) => ['unknown', 'mixed'].includes(row.direction))
  const calculatedRows = comparisonRows.filter((row) => row.evidenceTier === 'calculated')
  const estimatedRows = comparisonRows.filter((row) => row.evidenceTier === 'estimated')
  const directionalRows = comparisonRows.filter((row) => row.evidenceTier === 'directional')
  const risks = [...delta.newFindings, ...delta.worsenedFindings]

  let verdict = 'No defensible material direction'
  let tone = 'neutral'
  if (positiveRows.length && !negativeRows.length) {
    verdict = scenario.mode === 'decision'
      ? 'Favorable operating direction — economics incomplete'
      : 'Favorable metric direction — decision incomplete'
    tone = 'positive'
  } else if (negativeRows.length && !positiveRows.length) {
    verdict = scenario.mode === 'decision'
      ? 'Unfavorable direction under stated assumptions'
      : 'Unfavorable metric direction — decision incomplete'
    tone = 'negative'
  } else if (positiveRows.length && negativeRows.length) {
    verdict = 'Material trade-off — compare the conditions'
    tone = 'mixed'
  } else if (unknownRows.length) {
    verdict = 'Partial model — more evidence is required'
    tone = 'neutral'
  }

  const allEdges = causalGraph?.edges || []
  const directionConfidence = unknownRows.length
    ? 'low'
    : allEdges.length && allEdges.every((edge) => edge.confidence === 'high')
      ? 'high'
      : 'medium'
  const magnitudeConfidence = directionalRows.length
    ? calculatedRows.length || estimatedRows.length ? 'mixed' : 'low'
    : calculatedRows.length && !estimatedRows.length ? 'high'
      : estimatedRows.length ? 'medium'
        : 'low'
  const hasCompanyPattern = patterns.some((pattern) =>
    allEdges.some((edge) => edge.from === pattern.from_metric && edge.to === pattern.to_metric)
  )
  const confidence = {
    direction: hasCompanyPattern && directionConfidence !== 'low' ? 'high' : directionConfidence,
    magnitude: magnitudeConfidence,
    feasibility: scenario.mode === 'decision' && scenario.action ? 'not_assessed' : 'not_assessed',
  }

  const upside = uniqueText(positiveRows.map((row) =>
    row.scenario == null
      ? `${row.label} is expected to improve; the magnitude is not calibrated.`
      : `${row.label} improves from ${row.baseline} to ${row.scenario} under the stated assumptions.`
  ), 5)
  const downside = uniqueText([
    ...negativeRows.map((row) =>
      row.scenario == null
        ? `${row.label} is expected to worsen; the magnitude is not calibrated.`
        : `${row.label} worsens from ${row.baseline} to ${row.scenario} under the stated assumptions.`
    ),
    ...risks.map((finding) => `A modeled threshold is crossed: ${finding.title || finding.summary}.`),
    ...(scenario.mode !== 'decision'
      ? ['Operational and implementation effects are not modeled because the action has not been specified.']
      : []),
    ...(scenario.mode === 'decision' && (scenario.costs || []).length
      ? ['Stated implementation costs are recorded but are not netted against the modeled operating effect.']
      : []),
  ], 5)
  const affectedAreas = uniqueText(comparisonRows.map((row) => row.areaLabel), 8)
  const assumptions = uniqueText([
    ...(scenario.statedAssumptions || []),
    ...comparisonRows.filter((row) => ['assumed', 'calculated', 'estimated'].includes(row.evidenceTier)).map((row) => row.basis),
  ], 6)
  const missingData = uniqueText([
    ...(scenario.missingInputs || []),
    ...comparisonRows.filter((row) => row.baseline == null).map((row) => `No measured baseline for ${row.label}.`),
    ...directionalRows.map((row) => `No calibrated magnitude for ${directRow.label} → ${row.label}.`),
    ...(scenario.mode !== 'decision'
      ? ['How the metric change will be achieved.', 'Implementation cost and operational consequences.']
      : []),
    ...(scenario.mode === 'decision' && !(scenario.costs || []).length
      ? ['The cost of implementing the decision.']
      : []),
    ...(scenario.mode === 'decision' && (scenario.costs || []).length
      ? ['The net financial effect after the stated implementation cost.']
      : []),
  ], 8)

  const condition = scenario.mode === 'decision'
    ? 'This describes the operating direction if the stated metric change is achieved. It is not a net financial recommendation until cost and feasibility are modeled.'
    : 'This is a metric stress test, not a complete decision recommendation. Feasibility and implementation effects are not assessed.'

  return {
    verdict,
    tone,
    confidence,
    confidenceLabel: `Direction ${confidence.direction} · Magnitude ${confidence.magnitude} · Feasibility ${confidence.feasibility.replace(/_/g, ' ')}`,
    upside,
    downside,
    affectedAreas,
    assumptions,
    missingData,
    condition,
  }
}

function buildTimeline(causalGraph, comparisonRows) {
  const directRow = comparisonRows[0]
  const events = [{
    horizon: 'Now',
    tone: directRow.direction,
    text: `${directRow.label} is assumed to change from ${directRow.baseline} to ${directRow.scenario}.`,
  }]
  const seen = new Set()
  for (const edge of causalGraph?.edges || []) {
    if (seen.has(edge.to)) continue
    seen.add(edge.to)
    const row = comparisonRows.find((item) => item.key === edge.to)
    if (!row) continue
    events.push({
      horizon: edge.delay || 'Timing unknown',
      tone: row.direction,
      text: row.scenario == null
        ? row.basis
        : `${row.label} is modeled from ${row.baseline} to ${row.scenario}. ${row.basis}`,
    })
    if (events.length >= 5) break
  }
  return events
}

async function loadSimulationContext(supabase, userId) {
  const [brainRes, briefRes, schemaRes, dnaRes, userMetricsRes] = await Promise.allSettled([
    getCompanyBrain(userId, supabase),
    supabase.from('intelligence_brief').select('financial, operational, context').eq('user_id', userId).single(),
    loadSchema(userId),
    getCompanyDNASummary(supabase, userId),
    supabase.from('user_custom_metrics').select('name, value, updated_at').eq('user_id', userId),
  ])

  const brain = brainRes.status === 'fulfilled' ? brainRes.value : null
  const brief = briefRes.status === 'fulfilled' ? briefRes.value.data : null
  const schema = schemaRes.status === 'fulfilled' ? schemaRes.value : null
  const dna = dnaRes.status === 'fulfilled' ? dnaRes.value : { status: 'insufficient_data', patterns: [] }
  const userMetricRows = userMetricsRes.status === 'fulfilled'
    ? userMetricsRes.value.data || []
    : []
  const userMetrics = userMetricsRes.status === 'fulfilled'
    ? buildUserMetricMap(userMetricRows)
    : {}

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

  return { brain, brief, normalized, schema, dna, userMetrics, userMetricRows }
}

function legacyScenarioToV2(scenario) {
  if (!scenario?.metricKey) return null
  return {
    version: 2,
    title: scenario.title || scenario.label,
    question: scenario.title || scenario.label,
    mode: 'metric_stress_test',
    action: null,
    changes: [{
      metricKey: scenario.metricKey,
      label: scenario.label,
      operation: scenario.deltaType,
      value: Number(scenario.deltaValue),
      evidenceType: 'user_assumption',
    }],
    costs: [],
    horizonMonths: null,
    statedAssumptions: [],
    missingInputs: [],
    parser: 'legacy_structured',
  }
}

function insufficientResult({ interpreted, missingData, baselineFacts, createdAt }) {
  return {
    id: randomUUID(),
    modelVersion: 'foresight-v2.0.0',
    status: 'insufficient_evidence',
    title: interpreted.title || interpreted.question || 'Scenario',
    createdAt,
    scenario: interpreted,
    baseline: {
      facts: [...baselineFacts.values()],
      summary: null,
      findings: [],
    },
    simulated: null,
    delta: { newFindings: [], worsenedFindings: [], improvedFindings: [], areaStatusChanges: [] },
    comparisonRows: [],
    timeline: [],
    causalGraph: { root: null, nodes: [], edges: [] },
    causalChain: [],
    decisionBrief: {
      verdict: 'Not enough evidence to model this decision',
      tone: 'neutral',
      confidence: { direction: 'low', magnitude: 'low', feasibility: 'not_assessed' },
      confidenceLabel: 'Direction low · Magnitude low · Feasibility not assessed',
      upside: [],
      downside: ['SelfAudit has not manufactured an outcome from missing evidence.'],
      affectedAreas: [],
      assumptions: interpreted.statedAssumptions || [],
      missingData: uniqueText(missingData, 8),
      condition: 'Add the missing company facts or state the assumptions explicitly to run a bounded scenario.',
    },
    evidence: {
      companyPatternStatus: 'not_used',
      companyPatternsUsed: [],
      disclaimer: 'No projection was produced because the required evidence was not available.',
    },
    appliedPatch: null,
  }
}

export async function runScenario(supabase, userId, input) {
  const sb = supabase || getSupabase()
  const { brain, brief, normalized, schema, dna, userMetrics, userMetricRows } = await loadSimulationContext(sb, userId)
  const baseline = runGovernanceMonitoring({ brain, brief, normalized, schema, userMetrics })
  const baselineFacts = buildBaselineFacts(baseline.snapshots, userMetricRows)
  const catalog = [...buildMetricCatalog(schema).values()]
  const interpreted = input?.question
    ? await interpretScenarioQuestion(input.question, catalog)
    : legacyScenarioToV2(input?.scenario || input)
  const createdAt = new Date().toISOString()

  if (!interpreted || !interpreted.changes?.length) {
    return insufficientResult({
      interpreted: interpreted || {
        title: String(input?.question || 'Scenario'),
        question: String(input?.question || ''),
        statedAssumptions: [],
      },
      missingData: interpreted?.missingInputs?.length
        ? interpreted.missingInputs
        : ['Name the company metric to change and the amount of the change.'],
      baselineFacts,
      createdAt,
    })
  }

  if (interpreted.changes.length > 1) {
    return insufficientResult({
      interpreted,
      missingData: [
        ...(interpreted.missingInputs || []),
        'This scenario changes multiple business metrics. Model one lever at a time or provide a calibrated multi-variable response model.',
      ],
      baselineFacts,
      createdAt,
    })
  }

  const change = interpreted.changes[0]
  const scenario = {
    ...interpreted,
    metricKey: change.metricKey,
    label: change.label,
    deltaType: change.operation,
    deltaValue: change.value,
  }
  const beforeValue = baselineFacts.get(scenario.metricKey)?.value ?? null
  if (beforeValue == null) {
    return insufficientResult({
      interpreted,
      missingData: [
        ...(interpreted.missingInputs || []),
        `No current ${scenario.label || scenario.metricKey} baseline is available.`,
      ],
      baselineFacts,
      createdAt,
    })
  }

  const afterValue = computeAfterValue(beforeValue, scenario.deltaType, scenario.deltaValue)
  const simulated = runGovernanceMonitoring({
    brain,
    brief,
    normalized,
    schema,
    userMetrics,
    metricOverrides: { [scenario.metricKey]: afterValue },
  })

  const sourceDirection = rawChangeDirection(beforeValue, afterValue)
  const rawGraph = buildScenarioGraph(scenario.metricKey, sourceDirection, 2)
  const delta = buildDelta(baseline, simulated)
  const { rows: comparisonRows, causalGraph } = buildComparisonRows({
    scenario,
    schema,
    baselineFacts,
    afterValue,
    scenarioGraph: rawGraph,
  })
  const decisionBrief = buildDecisionBrief({
    scenario,
    delta,
    comparisonRows,
    causalGraph,
    patterns: dna.patterns || [],
  })
  const companyPatternsUsed = dna.patterns?.filter((pattern) =>
    causalGraph.edges.some((edge) => edge.to === pattern.to_metric && edge.from === pattern.from_metric)
  ) || []
  const hasDirectionalRows = comparisonRows.some((row) => row.evidenceTier === 'directional')

  return {
    id: randomUUID(),
    modelVersion: 'foresight-v2.0.0',
    status: hasDirectionalRows ? 'bounded' : 'modeled',
    title: scenario.title || scenario.label,
    createdAt,
    scenario: { ...scenario, beforeValue, afterValue },
    baseline: {
      summary: baseline.summary,
      findings: baseline.findings,
      facts: comparisonRows.map((row) => row.source).filter(Boolean),
    },
    simulated: { summary: simulated.summary, findings: simulated.findings },
    delta,
    comparisonRows,
    timeline: buildTimeline(causalGraph, comparisonRows),
    causalGraph,
    causalChain: causalGraph.edges,
    decisionBrief,
    evidence: {
      companyPatternStatus: dna.status,
      companyPatternsUsed,
      disclaimer: 'Calculated results use measured values and explicit formulas. Estimated and directional effects depend on stated assumptions and are not promises about the future.',
    },
    appliedPatch: { metricKey: scenario.metricKey, before: beforeValue, after: afterValue },
  }
}
