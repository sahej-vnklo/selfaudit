import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from '../intelligence/company-brain.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { runGovernanceMonitoring } from '../governance/monitoring.js'
import { buildGovernanceAdvice } from '../governance/advice.js'
import { enrichGovernanceWithAI } from '../governance/ai-advisor.js'
import { computeSchemaFingerprint, loadSchema } from '../blueprint/schema-registry.js'
import { writeHealthCheckToIntelligenceBrief } from './writeback.js'
import { recomputeCompanyDNA } from '../intelligence/company-dna.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

const SEVERITY_DEDUCTION = { critical: 20, high: 12, medium: 6, low: 2 }
const SEVERITY_ORDER      = { critical: 0, high: 1, medium: 2, low: 3 }

// Persist governance metric snapshots to area_metric_snapshots table.
// Non-blocking — failures are swallowed so the health check always completes.
async function persistMetricSnapshots(userId, snapshots, sb, capturedAt, schemaVersion = null) {
  if (!userId || !snapshots?.length) return
  try {
    const rows = []
    for (const snapshot of snapshots) {
      for (const m of snapshot.metrics ?? []) {
        if (m.value == null) continue
        rows.push({ area: snapshot.areaId, metric_name: m.key, value: m.value, source: m.source || 'governance' })
      }
    }
    if (!rows.length) return

    // Fetch most recent prior snapshot for each metric to compute delta
    const { data: recentRows } = await sb
      .from('area_metric_snapshots')
      .select('area, metric_name, value')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
      .limit(100)

    // First occurrence of each area+metric_name is the most recent prior value
    const priorMap = {}
    for (const row of recentRows ?? []) {
      const key = `${row.area}:${row.metric_name}`
      if (priorMap[key] == null) priorMap[key] = row.value
    }

    const insertRows = rows.map((r) => ({
      user_id:         userId,
      area:            r.area,
      metric_name:     r.metric_name,
      value:           r.value,
      captured_at:     capturedAt,
      schema_version:  schemaVersion ?? null,
      source:          r.source,
      delta_from_prior: priorMap[`${r.area}:${r.metric_name}`] != null
        ? Number((r.value - priorMap[`${r.area}:${r.metric_name}`]).toFixed(4))
        : null,
    }))

    await sb.from('area_metric_snapshots').insert(insertRows)
  } catch (err) {
    console.warn('[health-check] metric snapshot persist failed:', err?.message)
  }
}

function scoreFromRisks(risks) {
  const total = risks.reduce((sum, r) => sum + (SEVERITY_DEDUCTION[r.severity] ?? 0), 0)
  return Math.max(0, Math.min(100, 100 - total))
}

// ── Summary and opportunity builders ─────────────────────────────────────────

function buildOpportunities(brain) {
  const opps = []

  if (brain?.opportunities?.length) {
    brain.opportunities.slice(0, 3).forEach((o) => {
      opps.push({ title: String(o), source: 'company_brain' })
    })
  }

  return opps
}

function buildSummary(risks, brain) {
  const byLevel = { critical: [], high: [], medium: [], low: [] }
  risks.forEach((r) => byLevel[r.severity]?.push(r.title))

  const parts = []

  if (byLevel.critical.length) {
    parts.push(`${byLevel.critical.length} critical issue${byLevel.critical.length > 1 ? 's' : ''} require immediate attention: ${byLevel.critical.join(', ')}.`)
  }
  if (byLevel.high.length) {
    parts.push(`${byLevel.high.length} high-severity risk${byLevel.high.length > 1 ? 's' : ''} flagged: ${byLevel.high.join(', ')}.`)
  }
  if (byLevel.medium.length) {
    parts.push(`${byLevel.medium.length} medium risk${byLevel.medium.length > 1 ? 's' : ''} worth monitoring.`)
  }
  if (parts.length === 0) {
    parts.push('No significant risks detected. Business signals look stable.')
  }

  if (brain?.active_goal) {
    parts.push(`Active goal: "${brain.active_goal}" — score ${brain.goal_score ?? 0}/100.`)
  }

  return parts.join(' ')
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runBusinessHealthCheck(userId) {
  if (!userId) throw new Error('userId required')

  const sb         = getSupabase()
  const checked_at = new Date().toISOString()

  // 1-4: Load company brain, intelligence_brief, user overrides, schema in parallel
  const [brainRes, briefRes, overridesRes, schemaRes] = await Promise.allSettled([
    getCompanyBrain(userId),
    sb.from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .single(),
    sb.from('user_rule_overrides')
      .select('rule_id, value, enabled')
      .eq('user_id', userId),
    loadSchema(userId),
  ])

  const brain        = brainRes.status     === 'fulfilled' ? brainRes.value      : null
  const brief        = briefRes.status     === 'fulfilled' ? briefRes.value.data : null
  const overrideRows = overridesRes.status === 'fulfilled' ? (overridesRes.value.data ?? []) : []
  const schema       = schemaRes.status    === 'fulfilled' ? schemaRes.value     : null

  const userOverrides = overrideRows.length > 0
    ? new Map(overrideRows.map((row) => [row.rule_id, { value: row.value, enabled: row.enabled }]))
    : null
  const schemaVersion = computeSchemaFingerprint(schema)

  if (briefRes.status === 'fulfilled' && briefRes.value.error) {
    console.warn('[health-check] brief fetch error:', briefRes.value.error.message)
  }

  // 5: Pull connector data — use pre-fetched snapshot (< 4h old) when available,
  //    fall back to live Composio call if snapshot is missing or stale
  let normalized = null
  try {
    const { data: snap } = await sb
      .from('connector_snapshots')
      .select('normalized_data, fetched_at')
      .eq('user_id', userId)
      .single()

    const snapAgeMs = snap?.fetched_at
      ? Date.now() - new Date(snap.fetched_at).getTime()
      : Infinity

    if (snap?.normalized_data && snapAgeMs < 4 * 60 * 60 * 1000) {
      normalized = snap.normalized_data
    } else {
      const connectorData = await fetchAllConnectedData(userId)
      if (Object.keys(connectorData).length) normalized = normalizeConnectorData(connectorData)
    }
  } catch { /* non-blocking */ }

  // Load user-defined metrics from Logic page — fill-in values for keys
  // not already resolved from connectors or brain.
  const { data: customMetricRows } = await sb
    .from('user_custom_metrics')
    .select('name, value')
    .eq('user_id', userId)

  const userMetrics   = Object.fromEntries(
    (customMetricRows ?? []).map((r) => [r.name, Number(r.value)])
  )
  const hasMetrics    = Object.keys(userMetrics).length > 0
  const hasConnectors = !!normalized

  const governanceBase = runGovernanceMonitoring({
    brain, brief, normalized, checkedAt: checked_at, userOverrides, schema, userMetrics,
  })

  // Persist metric snapshots non-blocking — do not await, never blocks health check
  persistMetricSnapshots(userId, governanceBase.snapshots, sb, checked_at, schemaVersion)
    .then(() => recomputeCompanyDNA(sb, userId))
    .catch(() => {})

  // Gate: skip AI diagnosis when the user has no metrics and no connector data.
  // Without real input, Claude would invent narratives against thin air.
  const deterministicGovernanceAdvice = buildGovernanceAdvice(governanceBase)
  const blueprintForAI = schema ? {
    industry:      schema.industryId || schema.industry_id || schema.industry || null,
    areas:         schema.areas      ?? [],
    unitTypes:     schema.unitTypes  ?? [],
    compoundRules: schema.compoundRules ?? [],
  } : null

  const governanceAdvice = (hasMetrics || hasConnectors)
    ? await enrichGovernanceWithAI({
        userId,
        governance: governanceBase,
        brain,
        intelligenceBrief: brief,
        deterministicAdvice: deterministicGovernanceAdvice,
        blueprint: blueprintForAI,
      })
    : deterministicGovernanceAdvice
  const governance          = {
    ...governanceBase,
    advice_summary: governanceAdvice.summary,
    diagnoses: governanceAdvice.diagnoses,
    recommended_actions: governanceAdvice.recommended_actions,
    alert_candidates: governanceAdvice.alert_candidates,
  }
  const allRisks = [...(governance.risks ?? [])]
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
  const health_score  = scoreFromRisks(allRisks)
  const opportunities = buildOpportunities(brain)
  const summary       = buildSummary(allRisks, brain)
  const recommended_actions = [...new Set([
    ...allRisks.slice(0, 5).map((r) => r.recommended_action),
    ...governance.recommended_actions,
  ].filter(Boolean))].slice(0, 8)

  const evidence = {
    connector: normalized
      ? { provider: normalized.provider, fetched_at: normalized.fetched_at, metric_count: normalized.metrics.length }
      : null,
    brain_signals: {
      watchouts:  brain?.watchouts?.length        ?? 0,
      priorities: brain?.top_priorities?.length   ?? 0,
      blockers:   brain?.repeated_blockers?.length ?? 0,
    },
    intelligence_brief_loaded: !!brief,
    governance: {
      areas_with_signals: governance.summary.areasWithSignals,
      areas_needing_attention: governance.summary.areasNeedingAttention,
      areas_to_watch: governance.summary.areasToWatch,
      total_findings: governance.findings.length,
      alert_candidates: governance.alert_candidates.length,
      diagnoses: governance.diagnoses.length,
      advice_summary: governance.advice_summary,
      area_statuses: governance.areas.map((area) => ({
        area_id: area.areaId,
        status: area.status,
        coverage: area.coverage,
      })),
      top_diagnoses: governance.diagnoses.slice(0, 3).map((item) => ({
        area_id: item.areaId,
        title: item.title,
        severity: item.severity,
      })),
    },
  }

  const result = {
    userId,
    checked_at,
    schema_version: schemaVersion,
    health_score,
    risks: allRisks,
    opportunities,
    summary,
    recommended_actions,
    evidence,
    governance,
  }

  writeHealthCheckToIntelligenceBrief(userId, { ...result, normalized }, sb).catch(() => {})

  return result
}
