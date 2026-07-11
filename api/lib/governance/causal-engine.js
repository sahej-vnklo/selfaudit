import { getConceptEdgesForMetric, getMetricEdges } from './graph/index.js'

/**
 * Universal business causal graph.
 *
 * This is product IP — a model of how business metrics cause each other.
 * Users define what to watch (their schema); this engine knows how things connect.
 *
 * Each edge: { from, to, mechanism, confidence }
 *   from/to     — metric keys (standardised across all areas)
 *   mechanism   — plain-English explanation of the causal link
 *   confidence  — 'high' | 'medium' | 'low' — how direct the relationship is
 */
const METRIC_EDGES = getMetricEdges()

// Build adjacency index for fast lookup
const _downstreamIndex = new Map()  // from → [edge, ...]
const _upstreamIndex   = new Map()  // to → [edge, ...]

for (const edge of METRIC_EDGES) {
  if (!_downstreamIndex.has(edge.from)) _downstreamIndex.set(edge.from, [])
  _downstreamIndex.get(edge.from).push(edge)

  if (!_upstreamIndex.has(edge.to)) _upstreamIndex.set(edge.to, [])
  _upstreamIndex.get(edge.to).push(edge)
}

/**
 * Given a bad metric, trace upstream causes to find the likely root.
 * Returns a list of root candidates sorted by confidence and depth.
 *
 * @param {string} metricKey - The metric that is failing
 * @param {number} maxDepth  - How many hops to trace (default 3)
 * @returns {{ rootKey: string, path: string[], mechanisms: string[], confidence: string }[]}
 */
export function traceRootCause(metricKey, maxDepth = 3) {
  const results = []

  function walk(key, path, mechanisms, depth) {
    const upstream = _upstreamIndex.get(key) ?? []
    if (upstream.length === 0 || depth === 0) {
      if (path.length > 0) {
        results.push({
          rootKey: path[0],
          // path = [root, ..., direct_upstream], metricKey is the terminal
          path: [...path, metricKey],
          mechanisms: [...mechanisms],
          confidence: mechanisms.every((e) => e.conf === 'high') ? 'high' : mechanisms.some((e) => e.conf === 'high') ? 'medium' : 'low',
        })
      }
      return
    }
    for (const edge of upstream) {
      walk(edge.from, [edge.from, ...path], [{ conf: edge.confidence, text: edge.mechanism }, ...mechanisms], depth - 1)
    }
  }

  walk(metricKey, [], [], maxDepth)
  // Deduplicate by rootKey, keep the path with highest confidence
  const byRoot = new Map()
  for (const r of results) {
    const existing = byRoot.get(r.rootKey)
    if (!existing || confidenceRank(r.confidence) > confidenceRank(existing.confidence)) {
      byRoot.set(r.rootKey, r)
    }
  }
  return [...byRoot.values()].sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))
}

/**
 * Given a bad metric, project which downstream metrics it will likely harm next.
 *
 * @param {string} metricKey
 * @param {number} maxDepth
 * @returns {{ key: string, mechanism: string, confidence: string, hops: number }[]}
 */
export function projectDownstream(metricKey, maxDepth = 2) {
  const results = []
  const visited = new Set()

  function walk(key, depth, hops) {
    if (depth === 0) return
    const downstream = _downstreamIndex.get(key) ?? []
    for (const edge of downstream) {
      if (visited.has(edge.to)) continue
      visited.add(edge.to)
      results.push({ key: edge.to, mechanism: edge.mechanism, confidence: edge.confidence, hops })
      walk(edge.to, depth - 1, hops + 1)
    }
  }

  walk(metricKey, maxDepth, 1)
  return results.sort((a, b) => a.hops - b.hops || confidenceRank(b.confidence) - confidenceRank(a.confidence))
}

/**
 * Build a compound causal diagnosis from a list of active bad/watch metrics.
 * Returns a narrative explanation of what is causing what.
 *
 * @param {string[]} badMetricKeys — keys with bad or watch status
 * @returns {{ summary: string, chains: object[], rootCandidates: string[] }}
 */
export function buildCompoundDiagnosis(badMetricKeys) {
  if (!badMetricKeys.length) return { summary: '', chains: [], rootCandidates: [] }

  // For each bad metric, find if it appears in the causal graph as a driver
  const chains = []
  const rootCounts = new Map()

  for (const key of badMetricKeys) {
    const downstream = projectDownstream(key, 2).filter((d) => badMetricKeys.includes(d.key))
    if (downstream.length > 0) {
      chains.push({ driver: key, effects: downstream })
      rootCounts.set(key, (rootCounts.get(key) ?? 0) + downstream.length)
    }
  }

  // Root candidates are bad metrics that drive the most other bad metrics
  const rootCandidates = [...rootCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

  const summary = rootCandidates.length
    ? `The most likely root issue is ${rootCandidates[0]} — it is causally upstream of ${rootCounts.get(rootCandidates[0])} of the other failing metrics.`
    : `Multiple issues are failing without a single obvious causal root.`

  return { summary, chains, rootCandidates }
}

export function getExplanationContext(metricKeys) {
  return Object.fromEntries(
    (metricKeys || []).map((metricKey) => [
      metricKey,
      getConceptEdgesForMetric(metricKey).map((edge) => ({
        id: edge.id,
        effect: edge.effect,
        confidence: edge.confidence,
        conditions: edge.conditions,
        delay: edge.delay,
        sources: edge.sources,
      })),
    ])
  )
}

function confidenceRank(c) {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}
