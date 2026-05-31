import { normalizeGovernanceMetrics } from './shared/contracts.js'
import { OPERATIONAL_AREA_REGISTRY } from './area-registry.js'

function metric(key, value, source, metadata = {}) {
  if (value == null || Number.isNaN(value)) return null
  return { key, value, source, ...metadata }
}

function ratio(numerator, denominator) {
  const top = Number(numerator)
  const bottom = Number(denominator)
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= 0) return null
  return Number(((top / bottom) * 100).toFixed(1))
}

function safeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildCustomerServiceMetrics({ brief }) {
  const operational = brief?.operational ?? {}
  const metrics = [
    metric('ticket_volume', safeNumber(operational.support_tickets_per_week), 'intelligence_brief'),
  ].filter(Boolean)

  return {
    areaId: 'customer-service',
    metrics,
    sources: metrics.length ? ['intelligence_brief'] : [],
  }
}

function buildMarketingSalesMetrics({ brief, normalized }) {
  const operational = brief?.operational ?? {}
  const normalizedMetrics = normalizeGovernanceMetrics(normalized?.metrics)
  const leadVolume = normalizedMetrics.leads ?? normalizedMetrics.new_contacts_this_month ?? null
  const sqlCount = normalizedMetrics.sqls ?? null

  const metrics = [
    metric('pipeline_value', normalizedMetrics.open_pipeline_value ?? null, 'hubspot'),
    metric('open_deals', normalizedMetrics.open_deals ?? null, 'hubspot'),
    metric('lead_volume', leadVolume, 'hubspot'),
    metric('stage_conversion', leadVolume ? ratio(sqlCount, leadVolume) : null, 'derived', { derivedFrom: ['sqls', 'leads'] }),
    metric('sales_cycle_days', safeNumber(operational.sales_cycle), 'intelligence_brief'),
  ].filter(Boolean)

  return {
    areaId: 'marketing-sales',
    metrics,
    sources: [...new Set(metrics.map((item) => item.source === 'derived' ? 'hubspot' : item.source))],
  }
}

function buildFinanceAccountingMetrics({ brief, normalized }) {
  const financial = brief?.financial ?? {}
  const context   = brief?.context   ?? {}

  // Extract Stripe metrics — prefer live connector data over manual brief entries
  const stripe = {}
  if (normalized?.metrics) {
    for (const m of normalized.metrics.filter(m => m.source === 'stripe')) {
      stripe[m.key] = m.value
    }
  }

  const mrr      = stripe.mrr        ?? safeNumber(financial.mrr)
  const churn    = stripe.churn_rate ?? safeNumber(financial.churn)
  const ltv      = stripe.ltv        ?? safeNumber(financial.ltv)
  const cac      = safeNumber(financial.cac)
  const burnRate = safeNumber(financial.burn_rate)
  const runway   = safeNumber(financial.runway ?? context.runway)

  const mrrSource   = stripe.mrr        != null ? 'stripe' : 'intelligence_brief'
  const churnSource = stripe.churn_rate != null ? 'stripe' : 'intelligence_brief'
  const ltvSource   = stripe.ltv        != null ? 'stripe' : 'intelligence_brief'

  const metrics = [
    metric('mrr',          mrr,       mrrSource),
    metric('churn_rate',   churn,     churnSource),
    metric('burn_rate',    burnRate,  'intelligence_brief'),
    metric('runway_months',runway,    'intelligence_brief'),
    metric('ltv_cac_ratio',
      ltv != null && cac != null && cac > 0 ? Number((ltv / cac).toFixed(2)) : null,
      'derived', { derivedFrom: [ltvSource, 'intelligence_brief'] }
    ),
  ].filter(Boolean)

  return {
    areaId: 'finance-accounting',
    metrics,
    sources: [...new Set(metrics.map((item) => item.source === 'derived' ? mrrSource : item.source))],
  }
}

function buildManagementStrategyMetrics({ brain }) {
  const sessions = brain?.recent_sessions ?? []
  const resolvedStatuses = new Set(['resolved', 'done', 'closed', 'complete', 'completed'])
  const followedThrough = sessions.filter((session) => resolvedStatuses.has(String(session?.status || '').toLowerCase())).length
  const followthroughRate = sessions.length > 0 ? Number(((followedThrough / sessions.length) * 100).toFixed(1)) : null

  const metrics = [
    metric('goal_progress', safeNumber(brain?.goal_score), 'company_brain'),
    metric('priority_backlog', Array.isArray(brain?.top_priorities) ? brain.top_priorities.length : null, 'company_brain'),
    metric('repeated_blockers', Array.isArray(brain?.repeated_blockers) ? brain.repeated_blockers.length : null, 'company_brain'),
    metric('watchouts', Array.isArray(brain?.watchouts) ? brain.watchouts.length : null, 'company_brain'),
    metric('followthrough_rate', followthroughRate, 'derived', { derivedFrom: ['recent_sessions.status'] }),
  ].filter(Boolean)

  return {
    areaId: 'management-strategy',
    metrics,
    sources: [...new Set(metrics.map((item) => item.source === 'derived' ? 'company_brain' : item.source))],
  }
}

export function buildAreaMetricSnapshots({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString() } = {}) {
  const builders = [
    buildCustomerServiceMetrics,
    buildMarketingSalesMetrics,
    buildFinanceAccountingMetrics,
    buildManagementStrategyMetrics,
  ]

  const knownAreas = new Set(OPERATIONAL_AREA_REGISTRY.map((area) => area.id))

  return builders
    .map((builder) => builder({ brain, brief, normalized }))
    .filter((snapshot) => snapshot && knownAreas.has(snapshot.areaId))
    .map((snapshot) => ({
      areaId: snapshot.areaId,
      checkedAt,
      metrics: snapshot.metrics,
      metricsByKey: normalizeGovernanceMetrics(snapshot.metrics),
      sources: snapshot.sources,
      coverage: snapshot.metrics.length,
    }))
}
