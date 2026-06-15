/**
 * Universal business causal graph.
 *
 * This is product IP — a hardcoded model of how business metrics cause each other.
 * Users define what to watch (their schema); this engine knows how things connect.
 *
 * Each edge: { from, to, mechanism, confidence }
 *   from/to     — metric keys (standardised across all areas)
 *   mechanism   — plain-English explanation of the causal link
 *   confidence  — 'high' | 'medium' | 'low' — how direct the relationship is
 */
const CAUSAL_GRAPH = [
  // ─── Support / Service ───────────────────────────────────────────────────────
  { from: 'first_response_time',  to: 'csat',            mechanism: 'Slow first responses are the single strongest predictor of low satisfaction scores.', confidence: 'high' },
  { from: 'resolution_time',      to: 'csat',            mechanism: 'Long resolution times erode trust, compounding even after the issue is fixed.', confidence: 'high' },
  { from: 'resolution_time',      to: 'repeat_issue_rate', mechanism: 'When issues take too long to close, customers contact support again before the original problem is resolved.', confidence: 'medium' },
  { from: 'repeat_issue_rate',    to: 'csat',            mechanism: 'Recurring issues are the clearest driver of low satisfaction — customers lose trust in permanent fixes.', confidence: 'high' },
  { from: 'csat',                 to: 'churn_rate',      mechanism: 'Low satisfaction is a leading indicator of churn, typically preceding cancellations by 30–60 days.', confidence: 'high' },
  { from: 'ticket_volume',        to: 'first_response_time', mechanism: 'Surge in volume reduces available capacity, stretching first-response times.', confidence: 'medium' },

  // ─── Revenue / Finance ───────────────────────────────────────────────────────
  { from: 'churn_rate',           to: 'mrr',             mechanism: 'Every percentage point of monthly churn compounds into exponential MRR erosion over time.', confidence: 'high' },
  { from: 'churn_rate',           to: 'ltv_cac_ratio',   mechanism: 'Higher churn compresses LTV directly, collapsing the LTV:CAC ratio regardless of acquisition efficiency.', confidence: 'high' },
  { from: 'ltv_cac_ratio',        to: 'runway_months',   mechanism: 'Weak unit economics require more capital per dollar of growth, accelerating burn and compressing runway.', confidence: 'medium' },
  { from: 'mrr',                  to: 'runway_months',   mechanism: 'MRR growth extends runway by reducing net burn — the two move inversely when costs are stable.', confidence: 'high' },
  { from: 'burn_rate',            to: 'runway_months',   mechanism: 'Burn rate is the primary lever on runway — a 20% burn reduction is typically a 20%+ runway extension.', confidence: 'high' },

  // ─── Sales / Pipeline ────────────────────────────────────────────────────────
  { from: 'lead_volume',          to: 'open_deals',      mechanism: 'Lead volume is the upstream source for open deals — a drop in leads typically shows up as a pipeline gap in 30–60 days.', confidence: 'high' },
  { from: 'stage_conversion',     to: 'open_deals',      mechanism: 'Poor funnel conversion reduces the number of deals that survive to open status even when lead volume is fine.', confidence: 'high' },
  { from: 'open_deals',           to: 'pipeline_value',  mechanism: 'Pipeline value is directly proportional to deal count — fewer open deals mean less total pipeline.', confidence: 'high' },
  { from: 'pipeline_value',       to: 'mrr',             mechanism: 'Closed pipeline converts to MRR — a persistent pipeline shortfall shows up as flat or declining MRR 1–2 quarters later.', confidence: 'medium' },
  { from: 'sales_cycle_days',     to: 'stage_conversion', mechanism: 'Long sales cycles often mask poor late-stage conversion — they keep deals "active" while reducing real close probability.', confidence: 'medium' },
  { from: 'sales_cycle_days',     to: 'pipeline_value',  mechanism: 'Longer cycles tie up pipeline capacity, reducing the effective value of open deals.', confidence: 'low' },
  { from: 'open_deals',           to: 'mrr',             mechanism: 'Deal count drives future revenue — fewer open deals now predict weaker MRR in the next quarter.', confidence: 'medium' },

  // ─── Management / Execution ──────────────────────────────────────────────────
  { from: 'followthrough_rate',   to: 'goal_progress',   mechanism: 'Follow-through directly controls how much of the agreed strategy becomes executed work.', confidence: 'high' },
  { from: 'priority_backlog',     to: 'followthrough_rate', mechanism: 'Too many open priorities splits focus and makes reliable follow-through impossible.', confidence: 'high' },
  { from: 'repeated_blockers',    to: 'goal_progress',   mechanism: 'Blockers that recur are by definition preventing completion of the same goals repeatedly.', confidence: 'high' },
  { from: 'repeated_blockers',    to: 'followthrough_rate', mechanism: 'Recurring blockers are the most direct cause of broken follow-through — they prevent action even when intent is good.', confidence: 'high' },
  { from: 'goal_progress',        to: 'churn_rate',      mechanism: 'When product and operational goals slip, the downstream effects (slower delivery, more bugs, weaker features) compound into higher churn.', confidence: 'low' },

  // ─── E-commerce ──────────────────────────────────────────────────────────────
  { from: 'out_of_stock_skus',    to: 'daily_revenue',   mechanism: 'Stockouts directly block revenue — every out-of-stock item on a high-traffic day is captured demand left on the table.', confidence: 'high' },
  { from: 'out_of_stock_skus',    to: 'repeat_rate',     mechanism: 'A stockout on a repeat customer purchase shifts them to a competitor, reducing return probability.', confidence: 'medium' },
  { from: 'refund_rate',          to: 'daily_revenue',   mechanism: 'Each refund reverses booked revenue, creating a direct drag on net daily revenue.', confidence: 'high' },
  { from: 'refund_rate',          to: 'repeat_rate',     mechanism: 'Customers who refund rarely purchase again — high refund rates are the fastest predictor of poor repeat rate.', confidence: 'high' },
  { from: 'fulfilment_time_hrs',  to: 'refund_rate',     mechanism: 'Slow fulfilment increases cancellation requests and post-delivery refunds driven by expectation mismatch.', confidence: 'medium' },
  { from: 'conversion_rate',      to: 'daily_revenue',   mechanism: 'A 0.5% drop in conversion rate compounds directly into revenue loss proportional to site traffic.', confidence: 'high' },
  { from: 'avg_days_of_stock',    to: 'out_of_stock_skus', mechanism: 'Low average days of stock is the clearest leading indicator of imminent stockouts.', confidence: 'high' },

  // ─── Manufacturing ───────────────────────────────────────────────────────────
  { from: 'avg_machine_uptime',   to: 'output_vs_plan',  mechanism: 'Machine downtime directly reduces available production hours, making plan attainment mechanically impossible.', confidence: 'high' },
  { from: 'avg_machine_uptime',   to: 'defect_rate',     mechanism: 'Machines running at the edge of availability often run with degraded precision, increasing defect rates.', confidence: 'medium' },
  { from: 'defect_rate',          to: 'scrap_rate',      mechanism: 'Every defective unit that cannot be reworked becomes scrap — the two metrics move in parallel.', confidence: 'high' },
  { from: 'scrap_rate',           to: 'output_vs_plan',  mechanism: 'Scrapped units must be remade — scrap directly reduces usable output against plan.', confidence: 'high' },
  { from: 'output_vs_plan',       to: 'oee',             mechanism: 'Performance (output vs planned rate) is one of the three OEE components — low output depresses the OEE score.', confidence: 'high' },

  // ─── Professional Services ───────────────────────────────────────────────────
  { from: 'overdue_milestones',   to: 'avg_client_csat', mechanism: 'Missed milestones are the fastest way to erode client confidence — satisfaction drops before formal escalation.', confidence: 'high' },
  { from: 'overdue_milestones',   to: 'projects_at_risk', mechanism: 'Projects with overdue milestones are the primary population of at-risk projects.', confidence: 'high' },
  { from: 'utilisation_rate',     to: 'overdue_milestones', mechanism: 'Over-utilisation stretches team capacity, making milestone slippage inevitable when any task takes longer than planned.', confidence: 'medium' },
  { from: 'avg_client_csat',      to: 'churn_rate',      mechanism: 'Low client satisfaction is the clearest predictor of non-renewal — it typically leads cancellations by 60–90 days.', confidence: 'high' },
  { from: 'projects_at_risk',     to: 'avg_client_csat', mechanism: 'At-risk projects are almost always the source of the lowest satisfaction scores across the portfolio.', confidence: 'high' },
]

// Build adjacency index for fast lookup
const _downstreamIndex = new Map()  // from → [edge, ...]
const _upstreamIndex   = new Map()  // to → [edge, ...]

for (const edge of CAUSAL_GRAPH) {
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

function confidenceRank(c) {
  return c === 'high' ? 3 : c === 'medium' ? 2 : 1
}
