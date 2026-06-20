import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from '../intelligence/company-brain.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { loadSchema } from '../blueprint/schema-registry.js'
import { projectDownstream } from './causal-engine.js'
import { runGovernanceMonitoring } from './monitoring.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
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

function findTriggerAreaId(snapshots, metricKey) {
  for (const snapshot of snapshots || []) {
    if (snapshot?.metricsByKey && metricKey in snapshot.metricsByKey) {
      return snapshot.areaId || null
    }
  }
  return null
}

function computeAfterValue(beforeValue, deltaType, deltaValue) {
  const numericBefore = Number.isFinite(Number(beforeValue)) ? Number(beforeValue) : 0
  const numericDelta = Number(deltaValue)

  if (deltaType === 'percent') {
    return Math.max(0, numericBefore * (1 + numericDelta / 100))
  }
  if (deltaType === 'set') {
    return Math.max(0, numericDelta)
  }
  return Math.max(0, numericBefore + numericDelta)
}

function buildAreaStatusChanges(baseline, simulated) {
  const baselineMap = new Map((baseline?.areas || []).map((area) => [area.areaId, area.status]))
  return (simulated?.areas || [])
    .filter((area) => baselineMap.get(area.areaId) !== area.status)
    .map((area) => ({
      areaId: area.areaId,
      before: baselineMap.get(area.areaId) || 'no-signal',
      after: area.status,
    }))
}

function buildNarrative(triggerMetricKey, downstream) {
  if (!downstream?.length) {
    return `Changing ${triggerMetricKey} does not trigger a clear downstream cascade in the current causal graph.`
  }

  const chain = downstream.slice(0, 3).map((item) => item.nodeId).join(' -> ')
  return `${triggerMetricKey} is likely to pressure ${chain} next.`
}

function buildDelta(baseline, simulated) {
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

  return {
    newFindings,
    worsenedFindings,
    improvedFindings,
    areaStatusChanges: buildAreaStatusChanges(baseline, simulated),
  }
}

async function loadSimulationContext(supabase, userId) {
  const [brainRes, briefRes, schemaRes] = await Promise.allSettled([
    getCompanyBrain(userId, supabase),
    supabase.from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .single(),
    loadSchema(userId),
  ])

  const brain = brainRes.status === 'fulfilled' ? brainRes.value : null
  const brief = briefRes.status === 'fulfilled' ? briefRes.value.data : null
  const schema = schemaRes.status === 'fulfilled' ? schemaRes.value : null

  let normalized = null
  try {
    // Prefer the daily connector snapshot (written at 5:30 AM by sync-connectors cron)
    // to avoid redundant live Composio calls on every simulation run.
    const { data: snapshot } = await supabase
      .from('connector_snapshots')
      .select('normalized_data, fetched_at')
      .eq('user_id', userId)
      .maybeSingle()

    const snapshotAgeMs = snapshot?.fetched_at
      ? Date.now() - new Date(snapshot.fetched_at).getTime()
      : Infinity
    const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000

    if (snapshot?.normalized_data && snapshotAgeMs < STALE_THRESHOLD_MS) {
      normalized = snapshot.normalized_data
    } else {
      // Snapshot missing or older than 24h — fall back to live fetch
      const connectorData = await fetchAllConnectedData(userId)
      if (Object.keys(connectorData).length) normalized = normalizeConnectorData(connectorData)
    }
  } catch {
    normalized = null
  }

  return { brain, brief, normalized, schema }
}

export async function runScenario(supabase, userId, scenario) {
  const sb = supabase || getSupabase()
  const { brain, brief, normalized, schema } = await loadSimulationContext(sb, userId)

  const baseline = runGovernanceMonitoring({ brain, brief, normalized, schema })
  const beforeValue = scanMetricValue(baseline.snapshots, scenario.metricKey)
  const afterValue = computeAfterValue(beforeValue, scenario.deltaType, scenario.deltaValue)

  const simulated = runGovernanceMonitoring({
    brain,
    brief,
    normalized,
    schema,
    metricOverrides: { [scenario.metricKey]: afterValue },
  })

  const triggerAreaId = findTriggerAreaId(simulated.snapshots, scenario.metricKey)
  const downstream = projectDownstream(triggerAreaId, simulated.findings)
  const delta = buildDelta(baseline, simulated)

  return {
    baseline: {
      summary: baseline.summary,
      findings: baseline.findings,
      causalDiagnosis: baseline.causalDiagnosis,
    },
    scenario: {
      summary: simulated.summary,
      findings: simulated.findings,
      causalDiagnosis: simulated.causalDiagnosis,
    },
    delta,
    cascade: {
      triggerMetricKey: scenario.metricKey,
      triggerAreaId,
      downstream,
      narrative: buildNarrative(scenario.metricKey, downstream),
    },
    appliedPatch: {
      metricKey: scenario.metricKey,
      before: beforeValue,
      after: afterValue,
    },
  }
}
