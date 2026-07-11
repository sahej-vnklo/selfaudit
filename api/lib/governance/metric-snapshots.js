import { normalizeGovernanceMetrics } from './shared/contracts.js'
import {
  AREA_CUSTOMER_SERVICE,
  AREA_FINANCE_ACCOUNTING,
  AREA_MANAGEMENT_STRATEGY,
  AREA_MARKETING_SALES,
} from '../blueprint/catalog/areas.js'

// Backward-compat fallback: the 4 SaaS areas used before schema-driven selection existed.
// When no schema is passed, the engine monitors these by default.
const DEFAULT_AREAS = [
  AREA_CUSTOMER_SERVICE,
  AREA_FINANCE_ACCOUNTING,
  AREA_MANAGEMENT_STRATEGY,
  AREA_MARKETING_SALES,
]

function metric(key, value, source) {
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) return null
  return { key, value, source }
}

function safeNumber(value) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getNestedValue(obj, path) {
  if (!obj || !path) return null
  let cur = obj
  for (const part of path.split('.')) {
    if (cur == null) return null
    cur = cur[part]
  }
  return cur ?? null
}

// Resolve the first source in the list that returns a non-null value
function resolveSources(sources, { brief, brain, normalized }) {
  const normMetrics = normalizeGovernanceMetrics(normalized?.metrics)
  for (const src of sources) {
    let val = null
    if (src.type === 'brief')         val = getNestedValue(brief, src.path)
    else if (src.type === 'brain')    val = getNestedValue(brain, src.path)
    else if (src.type === 'normalized') val = normMetrics[src.field] ?? null
    else if (src.type === 'integration') {
      if (Array.isArray(normalized?.metrics)) {
        const found = normalized.metrics.find((m) => m.source === src.integration && m.key === src.field)
        val = found?.value ?? null
      }
    }
    if (val != null) return val
  }
  return null
}

// Resolve an input slot used by 'divide'/'ratio' transforms.
// Input can be { metricKey } (reference to already-resolved metrics) or { metricKey, sources }
function resolveInput(input, ctx, resolved) {
  if (input.sources?.length) {
    const raw = resolveSources(input.sources, ctx)
    return safeNumber(raw)
  }
  if (input.metricKey) return resolved[input.metricKey] ?? null
  return null
}

// Apply a single metric mapping to produce a numeric value (or null if unavailable)
function applyTransform(mapping, ctx, resolved) {
  const { transform, sources = [], inputs = [], computation } = mapping

  switch (transform) {
    case 'safeNumber': {
      return safeNumber(resolveSources(sources, ctx))
    }

    case 'arrayLength': {
      const raw = resolveSources(sources, ctx)
      if (Array.isArray(raw)) return raw.length
      return safeNumber(raw)
    }

    case 'computed': {
      if (computation === 'session-followthrough-rate') {
        const sessions = ctx.brain?.recent_sessions ?? []
        const done = new Set(['resolved', 'done', 'closed', 'complete', 'completed'])
        const followedThrough = sessions.filter((s) => done.has(String(s?.status || '').toLowerCase())).length
        return sessions.length > 0 ? Number(((followedThrough / sessions.length) * 100).toFixed(1)) : null
      }
      if (computation === 'negative-retention-signal-count') {
        const signals = ctx.brain?.retention_signals ?? []
        return signals.filter((s) => /churn|cancel|downgrade|at.?risk|complaint|escalat/i.test(String(s))).length
      }
      if (computation === 'last-session-unfollowed') {
        return ctx.brain?.last_session?.status === 'unknown (not followed up)' ? 1 : 0
      }
      if (computation === 'goal-timeline-unrealistic') {
        return String(ctx.brain?.goal_timeline || '').toLowerCase().includes('unrealistic') ? 1 : 0
      }
      if (computation === 'goal-timeline-tight') {
        return String(ctx.brain?.goal_timeline || '').toLowerCase().includes('tight') ? 1 : 0
      }
      return null
    }

    case 'ratio':
    case 'divide': {
      if (inputs.length < 2) return null
      const [numInput, denomInput] = inputs
      const numerator   = resolveInput(numInput,   ctx, resolved)
      const denominator = resolveInput(denomInput, ctx, resolved)
      if (numerator == null || denominator == null || denominator === 0) return null
      const result = transform === 'ratio'
        ? (numerator / denominator) * 100
        : numerator / denominator
      return Number(result.toFixed(2))
    }

    default:
      return null
  }
}

function buildSnapshotForArea(area, ctx, checkedAt) {
  if (!Array.isArray(area.metricMappings) || area.metricMappings.length === 0) {
    return { areaId: area.id, checkedAt, metrics: [], metricsByKey: {}, sources: [], coverage: 0 }
  }

  const resolved = {}
  const metrics  = []

  // Pass 1: resolve all non-derived transforms
  for (const mapping of area.metricMappings) {
    if (['safeNumber', 'arrayLength', 'computed'].includes(mapping.transform)) {
      const value = applyTransform(mapping, ctx, resolved)
      if (value != null) {
        resolved[mapping.metricKey] = value
        metrics.push(metric(mapping.metricKey, value, mapping.source))
      }
    }
  }

  // Pass 2: resolve derived transforms that may reference pass-1 results
  for (const mapping of area.metricMappings) {
    if (['divide', 'ratio'].includes(mapping.transform)) {
      const value = applyTransform(mapping, ctx, resolved)
      if (value != null) {
        resolved[mapping.metricKey] = value
        metrics.push(metric(mapping.metricKey, value, mapping.source))
      }
    }
  }

  const valid   = metrics.filter(Boolean)
  const sources = [...new Set(valid.map((m) => m.source).filter(Boolean))]
  const metricsByKey = normalizeGovernanceMetrics(valid)

  // metricOverrides: force-write (used by simulation to test hypothetical values)
  if (ctx.metricOverrides && typeof ctx.metricOverrides === 'object') {
    for (const [key, value] of Object.entries(ctx.metricOverrides)) {
      if (value != null && Number.isFinite(Number(value))) {
        metricsByKey[key] = Number(value)
      }
    }
  }

  // userMetrics: fill-only — user-defined values from Logic page.
  // Only applied when a connector or brain hasn't already resolved the key.
  if (ctx.userMetrics && typeof ctx.userMetrics === 'object') {
    for (const [key, value] of Object.entries(ctx.userMetrics)) {
      if (value != null && Number.isFinite(Number(value)) && metricsByKey[key] == null) {
        metricsByKey[key] = Number(value)
      }
    }
  }

  return {
    areaId: area.id,
    checkedAt,
    metrics: valid,
    metricsByKey,
    sources,
    coverage: valid.length,
  }
}

export function buildAreaMetricSnapshots({
  brain           = null,
  brief           = null,
  normalized      = null,
  checkedAt       = new Date().toISOString(),
  schema          = null,
  metricOverrides = null,
  userMetrics     = null,
} = {}) {
  const areas = schema?.areas?.length ? schema.areas : DEFAULT_AREAS
  const ctx   = { brain, brief, normalized, metricOverrides, userMetrics }

  return areas.map((area) => buildSnapshotForArea(area, ctx, checkedAt))
}
