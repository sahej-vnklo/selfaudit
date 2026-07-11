import { AREA_CATALOG } from '../blueprint/catalog/areas.js'
import { getMetricEdges } from '../governance/graph/index.js'

function bucketDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function direction(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric === 0) return 0
  return numeric > 0 ? 1 : -1
}

const METRIC_DIRECTION_MAP = Object.values(AREA_CATALOG || {}).reduce((acc, area) => {
  for (const metric of area?.metricFamilies || []) {
    if (metric?.key && metric?.preferredDirection) {
      acc[metric.key] = metric.preferredDirection
    }
  }
  return acc
}, {})

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

function buildSeriesMaps(rows) {
  const buckets = []
  const seenBuckets = new Set()
  const metricMap = new Map()
  const areaMap = new Map()

  for (const row of rows || []) {
    const bucket = bucketDay(row.captured_at)
    if (!bucket) continue

    if (!seenBuckets.has(bucket)) {
      seenBuckets.add(bucket)
      buckets.push(bucket)
    }

    if (row.metric_name) {
      if (!metricMap.has(row.metric_name)) metricMap.set(row.metric_name, new Map())
      metricMap.get(row.metric_name).set(bucket, row)
    }

    if (row.area) {
      if (!areaMap.has(row.area)) areaMap.set(row.area, new Map())
      areaMap.get(row.area).set(bucket, row)
    }
  }

  return { buckets, metricMap, areaMap }
}

function resolveEdgeSeries(edge, metricMap, areaMap) {
  const fromMetricSeries = metricMap.get(edge.from)
  const toMetricSeries = metricMap.get(edge.to)
  if (fromMetricSeries || toMetricSeries) {
    return {
      fromKey: edge.from,
      toKey: edge.to,
      fromSeries: fromMetricSeries || null,
      toSeries: toMetricSeries || null,
    }
  }

  const fromAreaSeries = areaMap.get(edge.from)
  const toAreaSeries = areaMap.get(edge.to)
  return {
    fromKey: edge.from,
    toKey: edge.to,
    fromSeries: fromAreaSeries || null,
    toSeries: toAreaSeries || null,
  }
}

function movementState(metricKey, delta) {
  const rawDirection = direction(delta)
  if (rawDirection === 0) return 0

  const preferredDirection = METRIC_DIRECTION_MAP[metricKey]
  if (preferredDirection === 'lower-is-better') {
    return rawDirection > 0 ? 1 : -1
  }
  if (preferredDirection === 'higher-is-better') {
    return rawDirection > 0 ? -1 : 1
  }
  return rawDirection
}

function scoreEdge(edge, buckets, metricMap, areaMap, userId) {
  const { fromKey, toKey, fromSeries, toSeries } = resolveEdgeSeries(edge, metricMap, areaMap)
  if (!fromSeries || !toSeries) return null

  let supportCount = 0
  let sameRunHits = 0
  let lag1Hits = 0
  let contradictions = 0

  for (let index = 0; index < buckets.length; index += 1) {
    const sourceRow = fromSeries.get(buckets[index])
    const sourceDelta = sourceRow?.delta_from_prior
    if (sourceDelta == null) continue

    supportCount += 1

    const sourceDirection = movementState(fromKey, sourceDelta)
    const sameDirection = movementState(toKey, toSeries.get(buckets[index])?.delta_from_prior)
    const nextDirection = movementState(
      toKey,
      index + 1 < buckets.length ? toSeries.get(buckets[index + 1])?.delta_from_prior : null
    )

    if (sourceDirection !== 0 && sameDirection === sourceDirection) sameRunHits += 1
    if (sourceDirection !== 0 && nextDirection === sourceDirection) lag1Hits += 1
    if (
      sourceDirection !== 0 && (
        sameDirection === sourceDirection * -1 ||
        nextDirection === sourceDirection * -1
      )
    ) {
      contradictions += 1
    }
  }

  if (supportCount < 5) return null

  const weight = clamp((lag1Hits * 2 + sameRunHits - contradictions * 2) / supportCount, 0, 1)

  return {
    user_id: userId,
    from_metric: fromKey,
    to_metric: toKey,
    weight,
    support_count: supportCount,
    same_run_hits: sameRunHits,
    lag_1_hits: lag1Hits,
    contradictions,
    lag_hint: lag1Hits >= sameRunHits ? 1 : 0,
    pattern_type: 'edge_weight',
    narrative: `${fromKey} movement preceded ${toKey} movement in the expected direction ${lag1Hits} of ${supportCount} observed cycles.`,
    last_computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function recomputeCompanyDNA(supabase, userId) {
  if (!supabase || !userId) return []

  const { data: rows, error } = await supabase
    .from('area_metric_snapshots')
    .select('area, metric_name, value, delta_from_prior, captured_at')
    .eq('user_id', userId)
    .order('captured_at', { ascending: true })

  if (error || !rows?.length) return []

  const causalGraph = getMetricEdges()
  if (!Array.isArray(causalGraph) || !causalGraph.length) return []

  const { buckets, metricMap, areaMap } = buildSeriesMaps(rows)
  if (!buckets.length) return []

  const patterns = causalGraph
    .map((edge) => scoreEdge(edge, buckets, metricMap, areaMap, userId))
    .filter(Boolean)

  if (!patterns.length) return []

  const { error: upsertError } = await supabase
    .from('company_causal_patterns')
    .upsert(patterns, {
      onConflict: 'user_id,from_metric,to_metric,pattern_type',
    })

  if (upsertError) {
    console.warn('[company-dna] upsert failed:', upsertError.message)
  }

  return patterns
}

export async function getTopPatterns(supabase, userId, limit = 5) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('company_causal_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('pattern_type', 'edge_weight')
    .gte('support_count', 5)
    .order('weight', { ascending: false })
    .order('support_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn('[company-dna] top patterns fetch failed:', error.message)
    return []
  }

  return data || []
}

export function formatDNAForPrompt(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) return null

  return [
    'COMPANY DNA — RECURRING PATTERNS (observed, not proven causal laws):',
    ...patterns.map((pattern) =>
      `• ${pattern.from_metric} → ${pattern.to_metric}: weight ${Number(pattern.weight || 0).toFixed(2)}, seen ${pattern.support_count} cycles. ${pattern.narrative}`
    ),
  ].join('\n')
}

export async function getCompanyDNASummary(supabase, userId) {
  if (!supabase || !userId) {
    return { status: 'insufficient_data', patterns: [], formatted: null }
  }

  const [{ count: healthCheckCount = 0 } = {}, patterns] = await Promise.all([
    supabase
      .from('business_health_checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count }) => ({ count }))
      .catch(() => ({ count: 0 })),
    getTopPatterns(supabase, userId, 5),
  ])

  if (healthCheckCount < 8 || patterns.length === 0) {
    return { status: 'insufficient_data', patterns: [], formatted: null }
  }

  return {
    status: 'active',
    patterns,
    formatted: formatDNAForPrompt(patterns),
  }
}
