import { evaluateOperationalArea, getOperationalAreaModule } from './area-registry.js'
import { buildAreaMetricSnapshots } from './metric-snapshots.js'
import { buildCompoundDiagnosis } from './causal-engine.js'
import {
  COMPOUND_RULES_CONSTRUCTION,
  COMPOUND_RULES_CONSUMER_APP,
  COMPOUND_RULES_ECOMMERCE,
  COMPOUND_RULES_HEALTHCARE,
  COMPOUND_RULES_HOSPITALITY,
  COMPOUND_RULES_LOGISTICS,
  COMPOUND_RULES_MANUFACTURING,
  COMPOUND_RULES_MARKETPLACE,
  COMPOUND_RULES_PS,
  COMPOUND_RULES_REAL_ESTATE,
  COMPOUND_RULES_SAAS,
  COMPOUND_RULES_WHOLESALE,
} from '../blueprint/catalog/areas.js'

export const DETECTION_VERSION = '1.0.0'

function buildCombinedMetrics(snapshots) {
  const all = {}
  for (const snapshot of snapshots) {
    if (snapshot.metricsByKey) Object.assign(all, snapshot.metricsByKey)
  }
  return all
}

function compareCondition(value, comparator, threshold) {
  switch (comparator) {
    case 'lt':  return value < threshold
    case 'lte': return value <= threshold
    case 'gt':  return value > threshold
    case 'gte': return value >= threshold
    case 'eq':  return value === threshold
    case 'neq': return value !== threshold
    default:    return false
  }
}

// Evaluate compound rules from the schema (or fall back to SaaS defaults).
// Compound rules are cross-area signals that fire when two metrics breach simultaneously.
const COMPOUND_RULES_BY_INDUSTRY = {
  'saas-software': COMPOUND_RULES_SAAS,
  'ecommerce-d2c': COMPOUND_RULES_ECOMMERCE,
  'manufacturing': COMPOUND_RULES_MANUFACTURING,
  'professional-services': COMPOUND_RULES_PS,
  'marketplace-platform': COMPOUND_RULES_MARKETPLACE,
  'consumer-app': COMPOUND_RULES_CONSUMER_APP,
  'hospitality-fb': COMPOUND_RULES_HOSPITALITY,
  'retail-hospitality': COMPOUND_RULES_HOSPITALITY,
  healthcare: COMPOUND_RULES_HEALTHCARE,
  'wholesale-distribution': COMPOUND_RULES_WHOLESALE,
  'logistics-freight': COMPOUND_RULES_LOGISTICS,
  construction: COMPOUND_RULES_CONSTRUCTION,
  'real-estate': COMPOUND_RULES_REAL_ESTATE,
}

function normalizeIndustryId(value) {
  return String(value || '').trim().toLowerCase().replace(/[_\s]+/g, '-')
}

// Persisted schemas carry frozen COPIES of catalog compound rules; text fields
// added to the catalog later (rootCause/impact) are missing from older schemas.
// Backfill display texts from the catalog by rule id — user-customized
// conditions/thresholds in the stored rule always win.
const CATALOG_COMPOUND_BY_ID = new Map(
  Object.values(COMPOUND_RULES_BY_INDUSTRY).flat().map((rule) => [rule.id, rule])
)

function resolveCompoundRules(schema, brain) {
  if (schema?.compoundRules) {
    return schema.compoundRules.map((rule) => {
      const catalog = CATALOG_COMPOUND_BY_ID.get(rule.id)
      if (!catalog) return rule
      return {
        ...rule,
        rootCause: rule.rootCause ?? catalog.rootCause ?? null,
        impact: rule.impact ?? catalog.impact ?? null,
      }
    })
  }
  const industryId = normalizeIndustryId(schema?.industryId || schema?.industry_id || schema?.industry || brain?.industry)
  return COMPOUND_RULES_BY_INDUSTRY[industryId] ?? []
}

function evaluateCompoundRules(compoundRules, combinedMetrics) {
  const rules = compoundRules ?? []

  return rules
    .filter((rule) =>
      rule.conditions.every((cond) => {
        const val = combinedMetrics[cond.metricKey]
        return val != null && compareCondition(val, cond.comparator, cond.value)
      })
    )
    .map((rule) => ({
      id:              rule.id,
      type:            'risk',
      status:          rule.status ?? 'bad',
      severity:        rule.severity ?? 'high',
      areaId:          'cross',
      areaLabel:       'Cross-Area',
      title:           rule.title,
      summary:         rule.summary,
      recommendation:  rule.recommendation,
      rootCause:       rule.rootCause ?? null,
      impact:          rule.impact ?? null,
      metricKey:       'compound',
      comparator:      'compound',
      thresholdValue:  null,
      metricValue:     null,
      contributingMetrics: rule.conditions.map((condition) => ({
        key: condition.metricKey,
        value: combinedMetrics[condition.metricKey],
        comparator: condition.comparator,
        thresholdValue: condition.value,
      })),
    }))
}

function finding({
  id,
  areaId,
  areaLabel,
  severity,
  status = 'bad',
  metricKey,
  metricValue,
  comparator,
  thresholdValue,
  title,
  summary,
  recommendation,
  rootCause,
  impact,
  source = 'governance',
  extra = {},
}) {
  return {
    id,
    type: 'risk',
    status,
    severity,
    areaId,
    areaLabel,
    metricKey,
    metricValue,
    comparator,
    thresholdValue,
    title,
    summary,
    recommendation,
    rootCause,
    impact,
    source,
    ...extra,
  }
}

function resolveRuleOverride(ruleId, defaultValue, userOverrides) {
  const override = userOverrides?.get?.(ruleId)
  if (override && !override.enabled) return { enabled: false, value: defaultValue }
  if (override) return { enabled: true, value: override.value }
  return { enabled: true, value: defaultValue }
}

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return null
  return `$${Math.round(Number(value)).toLocaleString('en-US')}`
}

function buildFinancialImpact(observed, observedScope, windowDays = 30) {
  const value = Number(observed)
  if (!Number.isFinite(value) || value <= 0 || !observedScope || !Number.isFinite(Number(windowDays)) || Number(windowDays) <= 0) {
    return { tier: 'none', assumptions: ['insufficient measured refund dollars'] }
  }

  const pace = value / Number(windowDays)
  const projection = pace * 30
  return {
    tier: 'observed+estimated',
    observed: Math.round(value),
    observed_scope: observedScope,
    estimated_exposure: {
      low: Math.round(projection * 0.7),
      high: Math.round(projection * 1.3),
      basis: 'current 30-day refund pace continuing, +/-30%',
    },
    assumptions: ['refund pace unchanged', 'no intervention'],
  }
}

function formatFinancialImpact(financialImpact) {
  const observed = formatCurrency(financialImpact?.observed)
  const low = formatCurrency(financialImpact?.estimated_exposure?.low)
  const high = formatCurrency(financialImpact?.estimated_exposure?.high)
  if (!observed || !low || !high) return ''
  return ` Observed refunds ${observed}; if the current pace continues, ${low}–${high} over the next 30 days.`
}

function ratioText(ratio) {
  if (ratio >= 3 && ratio < 4) return 'tripled'
  if (ratio >= 2 && ratio < 3) return 'doubled'
  return `rose ${Math.floor(ratio)}x`
}

function parseTimestamp(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function supportWindowCounts(tickets, anchor) {
  if (!tickets.length || !anchor) return null
  const dayMs = 24 * 60 * 60 * 1000
  const recentStart = anchor.getTime() - 9 * dayMs
  const priorStart = anchor.getTime() - 18 * dayMs
  let recent = 0
  let prior = 0

  for (const ticket of tickets) {
    const created = parseTimestamp(ticket.created_at)
    if (!created || created.getTime() > anchor.getTime()) continue
    if (created.getTime() >= recentStart) recent += 1
    else if (created.getTime() >= priorStart) prior += 1
  }

  return {
    recent,
    prior,
    ratio: prior > 0 ? Number((recent / prior).toFixed(2)) : null,
    recent_window_days: 9,
    prior_window_days: 9,
    anchor: anchor.toISOString(),
  }
}

function buildSupportCorrelation(spike, normalized, metrics) {
  const tickets = (normalized?.entities ?? []).filter((entity) => entity.type === 'ticket')
  if (!tickets.length) return null

  const linkedTickets = Array.isArray(spike.order_ids) && spike.order_ids.length
    ? tickets.filter((ticket) => ticket.order_id && spike.order_ids.includes(ticket.order_id))
    : []

  if (linkedTickets.length) {
    const anchor = linkedTickets
      .map((ticket) => parseTimestamp(ticket.created_at))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]
    const counts = supportWindowCounts(linkedTickets, anchor)
    if (counts?.prior >= 2 && counts.ratio >= 2) {
      return {
        scope: 'sku_order_linked',
        recent_count: counts.recent,
        prior_count: counts.prior,
        ratio: counts.ratio,
        ratio_text: ratioText(counts.ratio),
        recent_window_days: counts.recent_window_days,
        prior_window_days: counts.prior_window_days,
        anchor: counts.anchor,
      }
    }
    return null
  }

  const storeRatio = Number(metrics.support_ticket_surge_ratio)
  if (!Number.isFinite(storeRatio) || storeRatio < 2) return null
  const anchor = tickets
    .map((ticket) => parseTimestamp(ticket.created_at))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const counts = supportWindowCounts(tickets, anchor)
  return {
    scope: 'store_wide',
    recent_count: counts?.recent ?? null,
    prior_count: counts?.prior ?? null,
    ratio: storeRatio,
    ratio_text: ratioText(storeRatio),
    recent_window_days: counts?.recent_window_days ?? 9,
    prior_window_days: counts?.prior_window_days ?? 9,
    anchor: counts?.anchor ?? null,
  }
}

function evaluateLegacyParityRules(snapshots, normalized, userOverrides = null) {
  const metrics = buildCombinedMetrics(snapshots)
  const findings = []

  const add = (item) => {
    if (resolveRuleOverride(item.id, item.thresholdValue, userOverrides).enabled) findings.push(finding(item))
  }

  const emptyPipelineThreshold = resolveRuleOverride('legacy:empty-pipeline', 0, userOverrides)
  if (emptyPipelineThreshold.enabled && metrics.open_deals === emptyPipelineThreshold.value) {
    add({ id: 'legacy:empty-pipeline', areaId: 'marketing-sales', areaLabel: 'Marketing & Sales', severity: 'critical', metricKey: 'open_deals', metricValue: metrics.open_deals, comparator: 'eq', thresholdValue: emptyPipelineThreshold.value, title: 'Empty pipeline', summary: 'No open deals in CRM. Revenue generation is not being actively worked.', recommendation: 'Run an outbound sprint immediately. Review lead sources and qualification rate.', rootCause: 'Lead flow has dried up and no new deals have been opened in CRM.', impact: 'Without pipeline, revenue generation is on track to stall within 30–60 days.' })
  }

  const leadsNoSqlThreshold = resolveRuleOverride('legacy:leads-not-converting-sql', 5, userOverrides)
  if (leadsNoSqlThreshold.enabled && metrics.lead_volume > leadsNoSqlThreshold.value && metrics.sqls === 0) {
    add({ id: 'legacy:leads-not-converting-sql', areaId: 'marketing-sales', areaLabel: 'Marketing & Sales', severity: 'high', metricKey: 'stage_conversion', metricValue: 0, comparator: 'compound', thresholdValue: leadsNoSqlThreshold.value, title: 'Leads not converting to SQL', summary: `${metrics.lead_volume} leads in CRM with zero SQLs. Top-of-funnel qualification process may be broken.`, recommendation: 'Audit lead qualification criteria and the SDR-to-AE handoff process.', rootCause: 'The likely driver is a lead qualification process that is not converting inbound interest into sales-qualified conversations.', impact: 'Top-of-funnel effort is being wasted as leads sit idle, go cold, and conversion rate approaches zero.', extra: { contributingMetrics: [{ key: 'lead_volume', value: metrics.lead_volume }, { key: 'sqls', value: metrics.sqls }] } })
  }

  const noCustomersThreshold = resolveRuleOverride('legacy:no-customers-active-leads', 0, userOverrides)
  if (noCustomersThreshold.enabled && metrics.customers === 0 && metrics.lead_volume > noCustomersThreshold.value) {
    add({ id: 'legacy:no-customers-active-leads', areaId: 'marketing-sales', areaLabel: 'Marketing & Sales', severity: 'high', metricKey: 'customers', metricValue: metrics.customers, comparator: 'compound', thresholdValue: noCustomersThreshold.value, title: 'No customers in CRM despite active leads', summary: 'CRM shows leads but zero customers. Either conversion is broken or CRM data is not being updated.', recommendation: 'Audit CRM data hygiene. Verify closed-won deals are being marked correctly in HubSpot.', rootCause: 'Either deals are closing but not being recorded, or conversion from lead to customer is broken.', impact: 'CRM data cannot be trusted for forecasting or pipeline management — decisions are being made blind.', extra: { contributingMetrics: [{ key: 'customers', value: metrics.customers }, { key: 'lead_volume', value: metrics.lead_volume }] } })
  }

  const retentionSignalThreshold = resolveRuleOverride('legacy:negative-retention-signals', 0, userOverrides)
  if (retentionSignalThreshold.enabled && metrics.negative_retention_signals > retentionSignalThreshold.value) {
    add({ id: 'legacy:negative-retention-signals', areaId: 'customer-service', areaLabel: 'Customer Service', severity: 'medium', status: 'watch', metricKey: 'negative_retention_signals', metricValue: metrics.negative_retention_signals, comparator: 'gt', thresholdValue: retentionSignalThreshold.value, title: 'Negative retention signals detected', summary: `${metrics.negative_retention_signals} churn or at-risk signal${metrics.negative_retention_signals > 1 ? 's' : ''} logged from audit history.`, recommendation: 'Proactively reach out to at-risk accounts. Assign an owner to each flagged account.', rootCause: 'Recent audit history flagged churn risk, cancellations, or escalation signals across accounts.', impact: 'Unaddressed at-risk accounts are likely to churn — quietly eroding the revenue base.' })
  }

  const ticketVolumeThreshold = resolveRuleOverride('legacy:high-open-ticket-volume', 20, userOverrides)
  if (ticketVolumeThreshold.enabled && metrics.ticket_volume > ticketVolumeThreshold.value) {
    add({ id: 'legacy:high-open-ticket-volume', areaId: 'customer-service', areaLabel: 'Customer Service', severity: 'medium', status: 'watch', metricKey: 'ticket_volume', metricValue: metrics.ticket_volume, comparator: 'gt', thresholdValue: ticketVolumeThreshold.value, title: 'High open ticket volume', summary: `${metrics.ticket_volume} open tickets — support queue may be backing up.`, recommendation: 'Review support queue capacity and triage the oldest open tickets.', rootCause: 'Support queue volume is high enough to suggest unresolved customer issues are accumulating.', impact: 'A backed-up support queue can turn fixable service issues into churn and escalation risk.' })
  }

  const noActiveSubscriptionsThreshold = resolveRuleOverride('legacy:no-active-subscriptions', 0, userOverrides)
  if (noActiveSubscriptionsThreshold.enabled && metrics.mrr === 0 && metrics.active_customers === noActiveSubscriptionsThreshold.value) {
    add({ id: 'legacy:no-active-subscriptions', areaId: 'finance-accounting', areaLabel: 'Finance & Accounting', severity: 'high', metricKey: 'active_customers', metricValue: metrics.active_customers, comparator: 'compound', thresholdValue: noActiveSubscriptionsThreshold.value, title: 'No active subscriptions', summary: 'Zero active subscriptions found.', recommendation: 'Verify Stripe subscription sync and confirm whether active subscriptions exist outside the connected account.', rootCause: 'Stripe reports no monthly recurring revenue and no active customers.', impact: 'If accurate, recurring revenue has stopped and revenue recovery needs immediate attention.', extra: { contributingMetrics: [{ key: 'mrr', value: metrics.mrr }, { key: 'active_customers', value: metrics.active_customers }] } })
  }

  const highBacklogThreshold = resolveRuleOverride('legacy:high-action-backlog', 5, userOverrides)
  const watchBacklogThreshold = resolveRuleOverride('legacy:action-backlog-building', 3, userOverrides)
  if (highBacklogThreshold.enabled && metrics.priority_backlog >= highBacklogThreshold.value) {
    add({ id: 'legacy:high-action-backlog', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'high', metricKey: 'priority_backlog', metricValue: metrics.priority_backlog, comparator: 'gte', thresholdValue: highBacklogThreshold.value, title: 'High unresolved action backlog', summary: `${metrics.priority_backlog} priority actions unresolved from audit history. Execution is stalling.`, recommendation: 'Time-box a weekly review session. Pick 3 actions, assign owners, set a 7-day deadline.', rootCause: 'Too many audit-identified actions are accumulating without being closed out or assigned.', impact: 'Execution slows as the team loses focus — critical fixes get delayed and eventually forgotten.' })
  } else if (watchBacklogThreshold.enabled && metrics.priority_backlog >= watchBacklogThreshold.value) {
    add({ id: 'legacy:action-backlog-building', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'medium', status: 'watch', metricKey: 'priority_backlog', metricValue: metrics.priority_backlog, comparator: 'gte', thresholdValue: watchBacklogThreshold.value, title: 'Action backlog building', summary: `${metrics.priority_backlog} unresolved priority actions tracked across audit sessions.`, recommendation: 'Assign each action an owner and deadline before the next audit.', rootCause: 'More actions are being identified than are being completed between sessions.', impact: 'Without a clear owner and deadline for each action, important work quietly gets deprioritised.' })
  }

  const repeatedBlockersThreshold = resolveRuleOverride('legacy:repeated-blockers-unresolved', 2, userOverrides)
  if (repeatedBlockersThreshold.enabled && metrics.repeated_blockers >= repeatedBlockersThreshold.value) {
    add({ id: 'legacy:repeated-blockers-unresolved', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'medium', status: 'watch', metricKey: 'repeated_blockers', metricValue: metrics.repeated_blockers, comparator: 'gte', thresholdValue: repeatedBlockersThreshold.value, title: 'Repeated blockers unresolved', summary: `${metrics.repeated_blockers} recurring blockers surfacing across multiple sessions.`, recommendation: 'These look systemic — address the likely driver, not just the symptom each time.', rootCause: 'The same obstacles keep surfacing session after session without evidence that the underlying constraint has changed.', impact: 'Systemic blockers compound — they slow execution across multiple areas simultaneously.' })
  }

  const watchoutsThreshold = resolveRuleOverride('legacy:multiple-watchouts-active', 3, userOverrides)
  if (watchoutsThreshold.enabled && metrics.watchouts >= watchoutsThreshold.value) {
    add({ id: 'legacy:multiple-watchouts-active', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'low', status: 'watch', metricKey: 'watchouts', metricValue: metrics.watchouts, comparator: 'gte', thresholdValue: watchoutsThreshold.value, title: 'Multiple watchouts active', summary: `${metrics.watchouts} active watchouts from audit history need monitoring.`, recommendation: 'Review each watchout. Close out resolved ones so the signal stays clean.', rootCause: 'Several signals flagged for monitoring have not been resolved or closed out.', impact: 'Active watchouts are risks one bad week away from becoming full alerts.' })
  }

  const unfollowedThreshold = resolveRuleOverride('legacy:last-audit-not-followed-up', 1, userOverrides)
  if (unfollowedThreshold.enabled && metrics.last_session_unfollowed === unfollowedThreshold.value) {
    add({ id: 'legacy:last-audit-not-followed-up', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'low', status: 'watch', metricKey: 'last_session_unfollowed', metricValue: 1, comparator: 'eq', thresholdValue: unfollowedThreshold.value, title: 'Last audit not followed up', summary: 'No follow-up recorded on the previous audit session actions.', recommendation: 'Mark each action as done, carried forward, or deprioritised — do not leave it in limbo.', rootCause: 'The previous audit produced action items that were never marked completed, carried forward, or deprioritised.', impact: 'Without accountability on prior actions, audits lose their value — plans do not translate to execution.' })
  }

  const criticalGoalThreshold = resolveRuleOverride('legacy:goal-trajectory-critical', 20, userOverrides)
  const watchGoalThreshold = resolveRuleOverride('legacy:goal-progress-below-target', 50, userOverrides)
  if (criticalGoalThreshold.enabled && metrics.goal_progress < criticalGoalThreshold.value) {
    add({ id: 'legacy:goal-trajectory-critical', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'high', metricKey: 'goal_progress', metricValue: metrics.goal_progress, comparator: 'lt', thresholdValue: criticalGoalThreshold.value, title: 'Goal trajectory critical', summary: `Goal score at ${metrics.goal_progress}/100 — progress is severely off track.`, recommendation: 'Reassess goal feasibility and timeline. Break into smaller milestones with weekly check-ins.', rootCause: 'Current execution pace is far below what is needed to hit the stated goal on time.', impact: 'At this trajectory, the goal is on track to be missed and the gap is likely to widen the longer it goes unaddressed.' })
  } else if (watchGoalThreshold.enabled && metrics.goal_progress < watchGoalThreshold.value) {
    add({ id: 'legacy:goal-progress-below-target', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'medium', status: 'watch', metricKey: 'goal_progress', metricValue: metrics.goal_progress, comparator: 'lt', thresholdValue: watchGoalThreshold.value, title: 'Goal progress below target', summary: `Goal score at ${metrics.goal_progress}/100. Current execution pace is unlikely to meet the timeline.`, recommendation: 'Identify the single biggest blocker to goal achievement and address it this week.', rootCause: 'Progress is happening but not fast enough to meet the goal by the current deadline.', impact: 'Missing the goal affects investor confidence, team morale, and planning for the next cycle.' })
  }

  const unrealisticTimelineThreshold = resolveRuleOverride('legacy:goal-timeline-unrealistic', 1, userOverrides)
  const tightTimelineThreshold = resolveRuleOverride('legacy:goal-timeline-tight', 1, userOverrides)
  if (unrealisticTimelineThreshold.enabled && metrics.goal_timeline_unrealistic === unrealisticTimelineThreshold.value) {
    add({ id: 'legacy:goal-timeline-unrealistic', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'high', metricKey: 'goal_timeline_unrealistic', metricValue: 1, comparator: 'eq', thresholdValue: unrealisticTimelineThreshold.value, title: 'Goal timeline flagged unrealistic', summary: 'The most recent audit marked this timeline as unrealistic.', recommendation: 'Renegotiate the goal or the timeline based on current capacity and constraints.', rootCause: 'The most recent audit identified the timeline as beyond what current capacity can deliver.', impact: 'Pursuing an unrealistic timeline creates pressure without progress — the team burns out chasing a moving target.' })
  } else if (tightTimelineThreshold.enabled && metrics.goal_timeline_tight === tightTimelineThreshold.value) {
    add({ id: 'legacy:goal-timeline-tight', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'medium', status: 'watch', metricKey: 'goal_timeline_tight', metricValue: 1, comparator: 'eq', thresholdValue: tightTimelineThreshold.value, title: 'Goal timeline flagged tight', summary: 'Audit marked this timeline as achievable but with no margin for error.', recommendation: 'Identify the single biggest risk to the timeline and build a mitigation plan now.', rootCause: 'The timeline looks achievable but relies on everything going right with no room for error.', impact: 'Any unexpected delay or setback puts the deadline at risk because there is no recovery buffer built in.' })
  }

  const operationalBlockersThreshold = resolveRuleOverride('legacy:multiple-operational-blockers', 2, userOverrides)
  if (operationalBlockersThreshold.enabled && metrics.operational_blockers >= operationalBlockersThreshold.value) {
    add({ id: 'legacy:multiple-operational-blockers', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'medium', status: 'watch', metricKey: 'operational_blockers', metricValue: metrics.operational_blockers, comparator: 'gte', thresholdValue: operationalBlockersThreshold.value, title: 'Multiple operational blockers active', summary: `${metrics.operational_blockers} operational blockers logged.`, recommendation: 'Pick the highest-impact blocker and dedicate focused capacity to clearing it this sprint.', rootCause: 'Several operational constraints are simultaneously limiting throughput and progress.', impact: 'Multiple blockers compound each other — removing one still leaves the others in place.' })
  }

  const conversionBottlenecksThreshold = resolveRuleOverride('legacy:conversion-bottlenecks', 2, userOverrides)
  if (conversionBottlenecksThreshold.enabled && metrics.conversion_bottlenecks >= conversionBottlenecksThreshold.value) {
    add({ id: 'legacy:conversion-bottlenecks', areaId: 'marketing-sales', areaLabel: 'Marketing & Sales', severity: 'medium', status: 'watch', metricKey: 'conversion_bottlenecks', metricValue: metrics.conversion_bottlenecks, comparator: 'gte', thresholdValue: conversionBottlenecksThreshold.value, title: 'Conversion bottlenecks identified', summary: `${metrics.conversion_bottlenecks} known conversion bottlenecks.`, recommendation: 'Map the full customer journey and instrument each stage to find where drop-off concentrates.', rootCause: 'Known friction points in the customer journey are reducing conversion at multiple stages.', impact: 'Every untreated bottleneck silently reduces the yield from marketing and sales spend.' })
  }

  const constraintsThreshold = resolveRuleOverride('legacy:multiple-constraints', 3, userOverrides)
  if (constraintsThreshold.enabled && metrics.current_constraints >= constraintsThreshold.value) {
    add({ id: 'legacy:multiple-constraints', areaId: 'management-strategy', areaLabel: 'Management & Strategy', severity: 'low', status: 'watch', metricKey: 'current_constraints', metricValue: metrics.current_constraints, comparator: 'gte', thresholdValue: constraintsThreshold.value, title: 'Multiple constraints stacking', summary: `${metrics.current_constraints} active constraints may be creating compound throughput drag.`, recommendation: 'Identify which constraint is the binding one and focus there — the others likely resolve downstream.', rootCause: 'Multiple simultaneous constraints are creating compounding drag across the operation.', impact: 'Stacked constraints reduce throughput more than the sum of their parts — they interact and amplify each other.' })
  }

  const highValueDeals = (normalized?.entities ?? []).filter((entity) => entity.type === 'deal' && (entity.amount ?? 0) >= 10000)
  const highValueDealsThreshold = resolveRuleOverride('legacy:high-value-deals-closing', 0, userOverrides)
  if (highValueDealsThreshold.enabled && highValueDeals.length > highValueDealsThreshold.value) {
    add({ id: 'legacy:high-value-deals-closing', areaId: 'marketing-sales', areaLabel: 'Marketing & Sales', severity: 'medium', status: 'watch', metricKey: 'high_value_deals_closing', metricValue: highValueDeals.length, comparator: 'gt', thresholdValue: highValueDealsThreshold.value, title: `${highValueDeals.length} high-value deal${highValueDeals.length > 1 ? 's' : ''} closing in 14 days`, summary: 'Deals over $10k are due soon and may need focused attention to close.', recommendation: 'Review each deal status. Schedule closing calls and resolve any open objections.', rootCause: 'High-value deals are approaching close date and may stall without active follow-through.', impact: 'Missing these deals creates a significant revenue gap that is hard to recover in the same quarter.' })
  }

  return findings
}

function evaluateEntityRules(normalized, userOverrides = null) {
  const metrics = buildCombinedMetrics([{ metricsByKey: Object.fromEntries((normalized?.metrics ?? []).map((metric) => [metric.key, metric.value])) }])
  const findings = []
  const refundRate = metrics.refund_rate

  const refundRateThreshold = resolveRuleOverride('entity:ecommerce-refund-rate-high', 10, userOverrides)
  if (refundRateThreshold.enabled && refundRate > refundRateThreshold.value) {
    const financialImpact = buildFinancialImpact(metrics.refunded_amount_30d, 'store', 30)
    findings.push(finding({ id: 'entity:ecommerce-refund-rate-high', areaId: 'revenue-sales', areaLabel: 'Revenue & Sales', severity: 'high', metricKey: 'refund_rate', metricValue: refundRate, comparator: 'gt', thresholdValue: refundRateThreshold.value, title: 'Refund rate is critically high', summary: `Refund rate is ${refundRate}% over the trailing 30 days.${formatFinancialImpact(financialImpact)}`, recommendation: 'Halt the most-refunded products or channels and run an immediate driver review.', rootCause: 'The likely driver is a product, expectation, or fulfilment problem visible through refund volume.', impact: 'At this level, refunds indicate structural margin pressure, not an exception.', source: 'governance-entity', extra: { financialImpact } }))
  }

  const skuSpikeThreshold = resolveRuleOverride('entity:sku-refund-spike', 3, userOverrides)
  const spike = (normalized?.entities ?? []).find((entity) =>
    skuSpikeThreshold.enabled &&
    entity.type === 'sku' &&
    refundRate > 0 &&
    entity.refund_count >= 5 &&
    entity.refund_rate >= refundRate * skuSpikeThreshold.value
  )
  if (spike) {
    const financialImpact = buildFinancialImpact(spike.refunded_amount, `sku:${spike.id}`, 30)
    const supportCorrelation = buildSupportCorrelation(spike, normalized, metrics)
    let summary = `${spike.id} has a ${spike.refund_rate}% refund rate, at least ${skuSpikeThreshold.value}× the store average.${formatFinancialImpact(financialImpact)}`
    if (supportCorrelation?.scope === 'sku_order_linked') {
      summary = `Refunds for SKU ${spike.id} rose to ${spike.refund_rate}% over nine days — support tickets tied to its orders ${supportCorrelation.ratio_text} in the same window.${formatFinancialImpact(financialImpact)}`
    } else if (supportCorrelation?.scope === 'store_wide') {
      summary += ` Store-wide support volume ${supportCorrelation.ratio_text} in the same window.`
    }
    findings.push(finding({ id: 'entity:sku-refund-spike', areaId: 'revenue-sales', areaLabel: 'Revenue & Sales', severity: 'high', metricKey: 'refund_rate', metricValue: spike.refund_rate, comparator: 'gte', thresholdValue: Number((refundRate * skuSpikeThreshold.value).toFixed(2)), title: 'SKU-level refund spike', summary, recommendation: 'Inspect this SKU immediately: product quality, sizing, listing accuracy, fulfilment, and recent batch issues.', rootCause: 'The likely driver is a SKU-specific product, expectation, or fulfilment issue compared with the store average.', impact: 'This SKU is carrying disproportionate refund pressure while aggregate revenue can still look acceptable.', source: 'governance-entity', extra: { entityType: spike.type, entityId: spike.id, entityLabel: spike.label, financialImpact, ...(supportCorrelation ? { supportCorrelation } : {}) } }))
  }

  return findings
}

// Returns findings whose area is not in the snapshot list — callers must still surface
// those, otherwise a detection silently vanishes for users without that area selected.
function applyAdditionalFindingsToAreas(areas, extraFindings) {
  const unattached = []
  for (const finding of extraFindings) {
    const area = areas.find((item) => item.areaId === finding.areaId)
    if (!area) {
      unattached.push(finding)
      continue
    }
    area.findings.push(finding)
    if (finding.status === 'bad') area.status = 'bad'
    else if (finding.status === 'watch' && area.status !== 'bad') area.status = 'watch'
    area.summary = summarizeArea(area, area.status, area.findings, area.coverage)
  }
  return unattached
}

function deriveAreaStatus(findings, coverage) {
  if (!coverage) return 'no-signal'
  if (findings.some((f) => f.status === 'bad'))   return 'bad'
  if (findings.some((f) => f.status === 'watch')) return 'watch'
  return 'good'
}

function summarizeArea(area, status, findings, coverage) {
  if (!coverage) return `No live signals yet for ${area?.label ?? 'this area'}.`
  if (status === 'bad') {
    return findings.filter((f) => f.status === 'bad').slice(0, 2).map((f) => f.title).join('; ')
  }
  if (status === 'watch') {
    return findings.filter((f) => f.status === 'watch' || f.status === 'bad').slice(0, 2).map((f) => f.title).join('; ')
  }
  return `${area?.label ?? 'This area'} looks stable based on the currently available signals.`
}

export function toLegacyRisk(area, finding) {
  return {
    severity:           finding.severity,
    category:           area.areaId,
    title:              finding.title,
    description:        finding.summary,
    evidence:           `${finding.metricKey} ${finding.comparator} ${finding.thresholdValue} (observed ${finding.metricValue})`,
    recommended_action: finding.recommendation,
    source:             'governance',
    rootCause:          finding.rootCause ?? null,
    impact:             finding.impact ?? null,
    ...(finding.financialImpact ? { financialImpact: finding.financialImpact } : {}),
    ...(finding.supportCorrelation ? { supportCorrelation: finding.supportCorrelation } : {}),
  }
}

export function runGovernanceMonitoring({
  brain           = null,
  brief           = null,
  normalized      = null,
  checkedAt       = new Date().toISOString(),
  userOverrides   = null,
  schema          = null,
  metricOverrides = null,
  userMetrics     = null,
} = {}) {
  const snapshots = buildAreaMetricSnapshots({ brain, brief, normalized, checkedAt, schema, metricOverrides, userMetrics })

  // Build a lookup from schemaArea.id → schemaArea so evaluators use per-user rule packs if present
  const schemaAreaMap = Object.fromEntries(
    (schema?.areas ?? []).map((a) => [a.id, a])
  )

  const areas = snapshots.map((snapshot) => {
    const catalogArea = getOperationalAreaModule(snapshot.areaId)
    const schemaArea  = schemaAreaMap[snapshot.areaId] ?? null
    const areaRef     = schemaArea ?? catalogArea

    const findings = evaluateOperationalArea(snapshot.areaId, snapshot.metricsByKey, userOverrides, schemaArea)
    const status   = deriveAreaStatus(findings, snapshot.coverage)
    const summary  = summarizeArea(areaRef, status, findings, snapshot.coverage)

    return {
      areaId:   snapshot.areaId,
      label:    areaRef?.label ?? snapshot.areaId,
      status,
      summary,
      coverage: snapshot.coverage,
      sources:  snapshot.sources,
      metrics:  snapshot.metrics,
      findings,
    }
  })

  const combinedMetrics   = buildCombinedMetrics(snapshots)
  const compoundFindings  = evaluateCompoundRules(resolveCompoundRules(schema, brain), combinedMetrics)
  const parityFindings    = evaluateLegacyParityRules(snapshots, normalized, userOverrides)
  const entityFindings    = evaluateEntityRules(normalized, userOverrides)
  const unattachedFindings = applyAdditionalFindingsToAreas(areas, [...parityFindings, ...entityFindings])

  const areaFindings = areas.flatMap((area) =>
    area.findings.map((finding) => ({ ...finding, areaId: area.areaId, areaLabel: area.label }))
  )

  const findings = [...areaFindings, ...unattachedFindings, ...compoundFindings]

  // Causal diagnosis surfaces likely upstream drivers and cascades across bad metrics.
  const badMetricKeys = [...areaFindings, ...unattachedFindings]
    .filter((f) => f.status === 'bad' || f.status === 'watch')
    .map((f) => f.metricKey)
    .filter((k) => k !== 'compound')
  const causalDiagnosis = buildCompoundDiagnosis([...new Set(badMetricKeys)])

  const areaRisks = areas.flatMap((area) =>
    area.findings
      .filter((f) => f.status === 'watch' || f.status === 'bad')
      .map((f) => toLegacyRisk(area, f))
  )

  const unattachedRisks = unattachedFindings
    .filter((f) => f.status === 'watch' || f.status === 'bad')
    .map((f) => toLegacyRisk({ areaId: f.areaId, label: f.areaLabel }, f))

  const compoundRisks = compoundFindings.map((finding) => ({
    severity:           finding.severity,
    category:           'cross-area',
    title:              finding.title,
    description:        finding.summary,
    evidence:           'Cross-area compound signal',
    recommended_action: finding.recommendation,
    source:             'governance-compound',
    rootCause:          finding.rootCause ?? null,
    impact:             finding.impact ?? null,
  }))

  const risks = [...areaRisks, ...unattachedRisks, ...compoundRisks]

  return {
    checkedAt,
    areas,
    snapshots,
    findings,
    compoundFindings,
    causalDiagnosis,
    risks,
    summary: {
      totalAreas:              areas.length,
      areasWithSignals:        areas.filter((a) => a.coverage > 0).length,
      areasNeedingAttention:   areas.filter((a) => a.status === 'bad').length,
      areasToWatch:            areas.filter((a) => a.status === 'watch').length,
      compoundSignals:         compoundFindings.length,
    },
  }
}
