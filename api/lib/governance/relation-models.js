import { getMetricEdges } from './graph/index.js'

const RELATION_METADATA = {
  'first_response_time:csat': { polarity: 'inverse' },
  'resolution_time:csat': { polarity: 'inverse' },
  'resolution_time:repeat_issue_rate': { polarity: 'same' },
  'repeat_issue_rate:csat': { polarity: 'inverse' },
  'csat:churn_rate': { polarity: 'inverse', delay: '30–60 days' },
  'ticket_volume:first_response_time': { polarity: 'same' },
  'churn_rate:mrr': { polarity: 'inverse', delay: 'Within 3 months', model: 'churn-retention-3m' },
  'churn_rate:ltv_cac_ratio': { polarity: 'inverse' },
  'ltv_cac_ratio:runway_months': { polarity: 'same' },
  'mrr:runway_months': { polarity: 'same' },
  'burn_rate:runway_months': { polarity: 'inverse', delay: 'Immediate', model: 'cash-constant-runway' },
  'lead_volume:open_deals': { polarity: 'same', delay: '30–60 days', model: 'proportional' },
  'stage_conversion:open_deals': { polarity: 'same', model: 'proportional' },
  'open_deals:pipeline_value': { polarity: 'same', model: 'proportional' },
  'pipeline_value:mrr': { polarity: 'same', delay: '1–2 quarters', model: 'proportional' },
  'sales_cycle_days:stage_conversion': { polarity: 'inverse' },
  'sales_cycle_days:pipeline_value': { polarity: 'inverse' },
  'open_deals:mrr': { polarity: 'same', delay: 'Next quarter' },
  'followthrough_rate:goal_progress': { polarity: 'same' },
  'priority_backlog:followthrough_rate': { polarity: 'inverse' },
  'repeated_blockers:goal_progress': { polarity: 'inverse' },
  'repeated_blockers:followthrough_rate': { polarity: 'inverse' },
  'goal_progress:churn_rate': { polarity: 'inverse' },
  'out_of_stock_skus:daily_revenue': { polarity: 'inverse' },
  'out_of_stock_skus:repeat_rate': { polarity: 'inverse' },
  'refund_rate:daily_revenue': { polarity: 'inverse' },
  'refund_rate:repeat_rate': { polarity: 'inverse' },
  'fulfilment_time_hrs:refund_rate': { polarity: 'same' },
  'conversion_rate:daily_revenue': { polarity: 'same' },
  'avg_days_of_stock:out_of_stock_skus': { polarity: 'inverse' },
  'avg_machine_uptime:output_vs_plan': { polarity: 'same' },
  // Uptime versus defect rate is conditional/non-linear in the source wording.
  // It intentionally has no polarity, so Foresight will not invent a direction.
  'avg_machine_uptime:defect_rate': { polarity: null, conditions: ['Machine condition and maintenance regime are required.'] },
  'defect_rate:scrap_rate': { polarity: 'same' },
  'scrap_rate:output_vs_plan': { polarity: 'inverse' },
  'output_vs_plan:oee': { polarity: 'same' },
  'overdue_milestones:avg_client_csat': { polarity: 'inverse' },
  'overdue_milestones:projects_at_risk': { polarity: 'same' },
  'utilisation_rate:overdue_milestones': { polarity: null, conditions: ['Only over-utilisation is expected to increase milestone risk.'] },
  'avg_client_csat:churn_rate': { polarity: 'inverse', delay: '60–90 days' },
  'projects_at_risk:avg_client_csat': { polarity: 'inverse' },
}

function relationKey(from, to) {
  return `${from}:${to}`
}

export function getScenarioRelations() {
  return getMetricEdges().map((edge) => ({
    ...edge,
    ...(RELATION_METADATA[relationKey(edge.from, edge.to)] || {}),
    evidenceScope: 'general_business_relationship',
  }))
}

export function applyPolarity(direction, polarity) {
  if (!['up', 'down'].includes(direction) || !['same', 'inverse'].includes(polarity)) return 'unknown'
  if (polarity === 'same') return direction
  return direction === 'up' ? 'down' : 'up'
}

export function buildScenarioGraph(metricKey, sourceDirection, maxDepth = 2) {
  const relations = getScenarioRelations()
  const adjacency = new Map()
  for (const relation of relations) {
    if (!adjacency.has(relation.from)) adjacency.set(relation.from, [])
    adjacency.get(relation.from).push(relation)
  }

  const nodes = new Map([[metricKey, {
    key: metricKey,
    depth: 0,
    changeDirection: sourceDirection,
    incomingDirections: [sourceDirection],
  }]])
  const edges = []
  const queue = [{ key: metricKey, depth: 0, direction: sourceDirection, path: [metricKey] }]
  const expanded = new Set()

  while (queue.length) {
    const current = queue.shift()
    if (current.depth >= maxDepth) continue
    const expansionKey = `${current.key}:${current.depth}:${current.direction}`
    if (expanded.has(expansionKey)) continue
    expanded.add(expansionKey)

    for (const relation of adjacency.get(current.key) || []) {
      const targetDirection = applyPolarity(current.direction, relation.polarity)
      const edge = {
        id: relationKey(relation.from, relation.to),
        from: relation.from,
        to: relation.to,
        depth: current.depth + 1,
        polarity: relation.polarity || null,
        changeDirection: targetDirection,
        mechanism: relation.mechanism,
        confidence: relation.confidence || 'low',
        evidenceScope: relation.evidenceScope,
        delay: relation.delay || null,
        model: relation.model || null,
        conditions: relation.conditions || [],
        path: [...current.path, relation.to],
      }
      edges.push(edge)

      const existing = nodes.get(relation.to)
      if (existing) {
        existing.incomingDirections.push(targetDirection)
        existing.changeDirection = new Set(existing.incomingDirections).size === 1
          ? existing.incomingDirections[0]
          : 'mixed'
        existing.depth = Math.min(existing.depth, current.depth + 1)
      } else {
        nodes.set(relation.to, {
          key: relation.to,
          depth: current.depth + 1,
          changeDirection: targetDirection,
          incomingDirections: [targetDirection],
        })
      }

      if (!current.path.includes(relation.to)) {
        queue.push({
          key: relation.to,
          depth: current.depth + 1,
          direction: targetDirection,
          path: [...current.path, relation.to],
        })
      }
    }
  }

  return {
    root: metricKey,
    nodes: [...nodes.values()],
    edges,
  }
}
