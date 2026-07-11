import { METRIC_DEFINITIONS } from './metric-definitions.js'

export const NORMALIZER_VERSION = '2.0.0'

// Normalizes raw connector data into a single unified shape.
// Entry point: normalizeConnectorData(connectorData) — takes output of fetchAllConnectedData.
// Organized by category (crm, revenue, comms, support, docs, email).
// Adding a new CRM = extend normalizeCRM(). Adding a new revenue tool = extend normalizeRevenue().
// Callers never import per-connector functions — only normalizeConnectorData and formatNormalizedForPrompt.

function metric(key, label, value, unit, source, confidence = 'high') {
  return { key, label, value, unit, source, confidence }
}

function signal(type, severity, title, description, evidence, source) {
  return { type, severity, title, description, evidence, source }
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0
  return Number(value.toFixed(digits))
}

function toNumber(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

export function createNormalizedOutput(provider) {
  return {
    provider,
    fetched_at: new Date().toISOString(),
    metrics:       [],
    entities:      [],
    signals:       [],
    risks:         [],
    opportunities: [],
  }
}

export function mergeNormalized(base, overlay) {
  if (!base) return overlay
  if (!overlay) return base
  return {
    provider:      `${base.provider}+${overlay.provider}`,
    fetched_at:    overlay.fetched_at,
    metrics:       [...base.metrics,       ...overlay.metrics],
    entities:      [...base.entities,      ...overlay.entities],
    signals:       [...base.signals,       ...overlay.signals],
    risks:         [...base.risks,         ...overlay.risks],
    opportunities: [...base.opportunities, ...overlay.opportunities],
  }
}

// ── CRM (HubSpot, Salesforce, Pipedrive, ...) ─────────────────────────────────

function normalizeCRM(provider, data) {
  const out = createNormalizedOutput(provider)

  const toNumber = (v) => { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
  const iso = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null }
  const lifecycleKey = (props = {}) => {
    const raw = String(props.lifecyclestage || props.hs_lead_status || '').toLowerCase()
    if (raw.includes('customer'))                                                       return 'customer'
    if (raw.includes('salesqualified') || raw === 'sql' || raw.includes('opportunity')) return 'sql'
    if (raw.includes('marketingqualified') || raw === 'mql')                           return 'mql'
    return 'lead'
  }

  const deals     = data?.deals?.results     ?? data?.deals?.data     ?? []
  const contacts  = data?.contacts?.results  ?? data?.contacts?.data  ?? []
  const pipelines = data?.pipelines?.results ?? data?.pipelines?.data ?? []

  // Build stage lookup from pipelines
  const stageRows      = pipelines.flatMap(p => p.stages || [])
  const stageNameById  = Object.fromEntries(stageRows.map(s => [s.id, s.label || s.id]))
  const closedStageIds = new Set(
    stageRows.filter(s => String(s?.metadata?.isClosed || '').toLowerCase() === 'true').map(s => s.id)
  )

  const openDeals      = deals.filter(d => !closedStageIds.has(d.properties?.dealstage))
  const totalOpenValue = openDeals.reduce((sum, d) => sum + toNumber(d.properties?.amount), 0)
  const avgDealSize    = openDeals.length ? Math.round(totalOpenValue / openDeals.length) : 0

  const now          = Date.now()
  const fourteenDays = now + 14 * 24 * 60 * 60 * 1000
  const monthStart   = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const closingSoon = openDeals
    .filter(d => { const ts = new Date(d.properties?.closedate || '').getTime(); return ts >= now && ts <= fourteenDays })
    .map(d => ({
      type:      'deal',
      id:        d.id,
      label:     d.properties?.dealname || 'Untitled deal',
      amount:    toNumber(d.properties?.amount),
      closedate: iso(d.properties?.closedate),
      stage:     stageNameById[d.properties?.dealstage] || d.properties?.dealstage || 'Unknown',
      source:    provider,
    }))

  const lifecycle = { lead: 0, mql: 0, sql: 0, customer: 0 }
  contacts.forEach(c => { lifecycle[lifecycleKey(c.properties)] += 1 })

  const newThisMonth = contacts.filter(
    c => new Date(c.properties?.createdate || 0).getTime() >= monthStart.getTime()
  ).length

  // Metrics
  if (openDeals.length >= 0)  out.metrics.push(metric('open_deals',           'Open deals',           openDeals.length,  'count', provider))
  if (totalOpenValue >= 0)    out.metrics.push(metric('open_pipeline_value',   'Open pipeline value',  totalOpenValue,    'USD',   provider))
  if (avgDealSize > 0)        out.metrics.push(metric('avg_deal_size',         'Avg deal size',        avgDealSize,       'USD',   provider))
  if (newThisMonth >= 0)      out.metrics.push(metric('new_contacts_this_month','New contacts/month',  newThisMonth,      'count', provider))
  if (lifecycle.lead != null) out.metrics.push(metric('leads',     'Leads',           lifecycle.lead,     'count', provider))
  if (lifecycle.mql  != null) out.metrics.push(metric('mqls',      'MQLs',            lifecycle.mql,      'count', provider))
  if (lifecycle.sql  != null) out.metrics.push(metric('sqls',      'SQLs',            lifecycle.sql,      'count', provider))
  if (lifecycle.customer != null) out.metrics.push(metric('customers', 'Customers in CRM', lifecycle.customer, 'count', provider))

  // Entities (deals closing soon)
  out.entities.push(...closingSoon)

  return out
}

// ── Revenue (Stripe, Chargebee, Recurly, ...) ─────────────────────────────────

function normalizeRevenue(provider, data) {
  const out = createNormalizedOutput(provider)

  const activeSubs   = data?.active_subs?.data   ?? data?.active_subs?.results   ?? []
  const canceledSubs = data?.canceled_subs?.data  ?? data?.canceled_subs?.results ?? []

  function toMonthlyAmount(sub) {
    let monthly = 0
    for (const item of sub.items?.data ?? []) {
      const price    = item.price
      if (!price?.unit_amount) continue
      const amount   = price.unit_amount / 100
      const interval = price.recurring?.interval ?? 'month'
      const count    = price.recurring?.interval_count ?? 1
      if      (interval === 'month') monthly += amount / count
      else if (interval === 'year')  monthly += amount / count / 12
      else if (interval === 'week')  monthly += amount * 52 / 12 / count
      else if (interval === 'day')   monthly += amount * 365 / 12 / count
    }
    return monthly
  }

  if (!activeSubs.length && !canceledSubs.length) return null

  const thirtyDaysAgo    = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const mrr              = activeSubs.reduce((sum, s) => sum + toMonthlyAmount(s), 0)
  const activeCustomers  = new Set(activeSubs.map(s => s.customer).filter(Boolean)).size
  const canceledCount    = canceledSubs.length
  const churnRate        = (activeCustomers + canceledCount) > 0
    ? Number(((canceledCount / (activeCustomers + canceledCount)) * 100).toFixed(2))
    : 0
  const newSubs30d       = activeSubs.filter(s => s.created >= thirtyDaysAgo).length
  const avgMo            = activeCustomers > 0 ? mrr / activeCustomers : 0
  const ltv              = churnRate > 0 ? Number((avgMo / (churnRate / 100)).toFixed(2)) : null

  if (mrr != null)              out.metrics.push(metric('mrr',              'MRR',                     Number(mrr.toFixed(2)),        'USD',   provider))
  if (mrr != null)              out.metrics.push(metric('arr',              'ARR',                     Number((mrr * 12).toFixed(2)), 'USD',   provider))
  if (activeCustomers != null)  out.metrics.push(metric('active_customers', 'Active customers',         activeCustomers,               'count', provider))
  if (churnRate != null)        out.metrics.push(metric('churn_rate',       'Monthly churn rate',       churnRate,                     '%',     provider))
  if (newSubs30d != null)       out.metrics.push(metric('new_customers_30d','New subscribers (30d)',    newSubs30d,                    'count', provider))
  if (ltv != null)              out.metrics.push(metric('ltv',              'Estimated customer LTV',   ltv,                           'USD',   provider))

  return out
}

// ── Ecommerce (Shopify verified; other providers transport-only) ──────────────

export function normalizeEcommerce(provider, data) {
  const out = createNormalizedOutput(provider)
  if (String(provider || '').toLowerCase() !== 'shopify') return out

  const orders = data?.orders?.results ?? data?.orders?.data ?? data?.orders ?? data?.data?.orders ?? []
  if (!Array.isArray(orders) || !orders.length) return out

  const asOf = resolveAsOf(data, orders)
  const windowStart = asOf ? asOf.getTime() - 30 * 24 * 60 * 60 * 1000 : null
  const primaryCurrency = data?.shop?.currency || data?.shop?.currency_code || firstCurrency(orders)
  const skippedCurrencies = new Set()
  const includedOrders = []

  for (const order of orders) {
    const createdAt = parseDate(order.created_at || order.createdAt || order.processed_at)
    if (!createdAt || (windowStart && createdAt.getTime() < windowStart) || (asOf && createdAt.getTime() > asOf.getTime())) continue
    if (isTestOrder(order) || isCancelledBeforeFulfilment(order)) continue

    const currency = order.currency || order.currency_code || order.presentment_currency || primaryCurrency
    if (primaryCurrency && currency && currency !== primaryCurrency) {
      if (!skippedCurrencies.has(currency)) {
        console.warn(`[normalize] shopify skipped ${currency} order data; primary currency is ${primaryCurrency}`)
        skippedCurrencies.add(currency)
      }
      continue
    }

    includedOrders.push(order)
  }

  const totalOrders = includedOrders.length
  if (!totalOrders) return out

  let grossRevenue = 0
  let refundedRevenue = 0
  let refundedOrders = 0
  let repeatOrders = 0
  let refundAmountsComplete = true
  const seenEmails = new Set()
  const fulfilmentHours = []
  const skuRollups = new Map()

  for (const order of includedOrders.sort((a, b) => orderTime(a) - orderTime(b))) {
    const lineItems = order.line_items ?? order.lineItems ?? []
    const orderGross = lineItems.reduce((sum, lineItem) => sum + lineItemAmount(lineItem), 0)
    const { total: refundTotal, complete: refundComplete } = refundAmount(order)
    if (!refundComplete) refundAmountsComplete = false
    grossRevenue += orderGross
    refundedRevenue += refundTotal
    // Refund COUNTING is presence-based; only refund DOLLARS require explicit amounts.
    const hasRefund = (order.refunds || []).some((refund) =>
      (refund.refund_line_items ?? refund.refundLineItems ?? []).length > 0 ||
      (refund.transactions || []).length > 0
    )
    if (hasRefund) refundedOrders += 1

    const email = customerEmail(order)
    if (email) {
      if (seenEmails.has(email)) repeatOrders += 1
      seenEmails.add(email)
    }

    const firstFulfilmentAt = firstFulfilmentDate(order)
    const createdAt = parseDate(order.created_at || order.createdAt || order.processed_at)
    if (createdAt && firstFulfilmentAt && firstFulfilmentAt.getTime() >= createdAt.getTime()) {
      fulfilmentHours.push((firstFulfilmentAt.getTime() - createdAt.getTime()) / (60 * 60 * 1000))
    }

    for (const lineItem of lineItems) {
      const sku = String(lineItem.sku || lineItem.variant_sku || '').trim()
      if (!sku) continue
      const label = lineItem.title || lineItem.name || sku
      const rollup = skuRollups.get(sku) || { type: 'sku', id: sku, label, refund_count: 0, refund_rate: 0, orders_count: 0, refunded_amount: 0, order_ids: [] }
      rollup.orders_count += 1
      const orderId = order.id || order.admin_graphql_api_id
      // Cap retained order ids so aggregate SKU entities cannot grow without bound.
      if (orderId && rollup.order_ids.length < 200 && !rollup.order_ids.includes(orderId)) rollup.order_ids.push(orderId)
      skuRollups.set(sku, rollup)
    }

    for (const refundLine of refundedSkuAmounts(order)) {
      const rollup = skuRollups.get(refundLine.sku) || { type: 'sku', id: refundLine.sku, label: refundLine.sku, refund_count: 0, refund_rate: 0, orders_count: 0, refunded_amount: 0, order_ids: [] }
      rollup.refund_count += 1
      if (refundLine.amount == null) rollup._amountsIncomplete = true
      else if (rollup.refunded_amount != null) rollup.refunded_amount = round(rollup.refunded_amount + refundLine.amount)
      skuRollups.set(refundLine.sku, rollup)
    }
  }

  // A rollup with any amount-less refund cannot claim measured dollars — null it so the
  // financial-impact layer reports tier 'none' instead of an understated "observed" figure.
  for (const rollup of skuRollups.values()) {
    if (rollup._amountsIncomplete) rollup.refunded_amount = null
    delete rollup._amountsIncomplete
  }

  const netRevenue = round(grossRevenue - refundedRevenue)
  const refundRate = round((refundedOrders / totalOrders) * 100)
  const averageOrderValue = round(grossRevenue / totalOrders)
  const repeatRate = round((repeatOrders / totalOrders) * 100)
  const medianFulfilment = median(fulfilmentHours)

  addDefinedMetric(out, 'daily_revenue', netRevenue, primaryCurrency || 'currency', provider)
  if (refundAmountsComplete) addDefinedMetric(out, 'refunded_amount_30d', round(refundedRevenue), primaryCurrency || 'currency', provider)
  addDefinedMetric(out, 'refund_rate', refundRate, '%', provider)
  addDefinedMetric(out, 'aov', averageOrderValue, primaryCurrency || 'currency', provider)
  addDefinedMetric(out, 'orders_count', totalOrders, 'count', provider)
  if (medianFulfilment != null) addDefinedMetric(out, 'fulfilment_time_hrs', round(medianFulfilment), 'hours', provider)
  addDefinedMetric(out, 'repeat_rate', repeatRate, '%', provider)

  const skuEntities = [...skuRollups.values()]
    .map((rollup) => ({
      ...rollup,
      order_ids: [...rollup.order_ids].sort((a, b) => a.localeCompare(b)),
      refund_rate: rollup.orders_count > 0 ? round((rollup.refund_count / rollup.orders_count) * 100) : 0,
      source: provider,
    }))
    .sort((a, b) => b.refund_count - a.refund_count || b.refund_rate - a.refund_rate || a.id.localeCompare(b.id))
    .slice(0, 10)

  out.entities.push(...skuEntities)

  return out
}

export function reconcileEcommerceRevenue(normalizedEcom, normalizedRevenue) {
  const ecommerceRevenue = findMetricValue(normalizedEcom, ['daily_revenue'])
  const revenueSystemRevenue = findMetricValue(normalizedRevenue, ['revenue_30d', 'net_revenue', 'revenue', 'daily_revenue'])
  if (ecommerceRevenue == null || revenueSystemRevenue == null) return null

  const baseline = Math.max(Math.abs(ecommerceRevenue), Math.abs(revenueSystemRevenue))
  const delta = Math.abs(ecommerceRevenue - revenueSystemRevenue)
  if (baseline === 0 || delta / baseline <= 0.15) return null

  return signal(
    'data-quality',
    'medium',
    'Revenue sources disagree',
    'Shopify and revenue-system totals differ by more than 15%.',
    `shopify=${round(ecommerceRevenue)}, revenue_system=${round(revenueSystemRevenue)}, variance=${round((delta / baseline) * 100)}%`,
    'shopify+stripe',
  )
}

function addDefinedMetric(out, key, value, unit, source) {
  const definition = METRIC_DEFINITIONS[key]
  if (!definition) return
  out.metrics.push(metric(key, definition.label, value, unit, source))
}

function resolveAsOf(data, orders) {
  const explicit = parseDate(data?.as_of || data?.fetched_at)
  if (explicit) return explicit

  const latest = orders
    .map((order) => parseDate(order.created_at || order.createdAt || order.processed_at))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0]

  return latest || new Date()
}

function firstCurrency(orders) {
  return orders.find((order) => order.currency || order.currency_code || order.presentment_currency)?.currency
    || orders.find((order) => order.currency_code)?.currency_code
    || orders.find((order) => order.presentment_currency)?.presentment_currency
    || 'USD'
}

function parseDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function orderTime(order) {
  return parseDate(order.created_at || order.createdAt || order.processed_at)?.getTime() || 0
}

function isTestOrder(order) {
  return Boolean(order.test || order.is_test || String(order.source_name || '').toLowerCase() === 'test')
}

function isCancelledBeforeFulfilment(order) {
  const cancelledAt = order.cancelled_at || order.canceled_at
  return Boolean(cancelledAt && !fulfilments(order).length)
}

function fulfilments(order) {
  return order.fulfillments ?? order.fulfilments ?? []
}

function firstFulfilmentDate(order) {
  return fulfilments(order)
    .map((fulfilment) => parseDate(fulfilment.created_at || fulfilment.createdAt))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime())[0] || null
}

function lineItemAmount(lineItem) {
  return toNumber(lineItem.price || lineItem.current_total_price || lineItem.total_price) * toNumber(lineItem.quantity || 1)
}

// Refund dollars must be explicit or absent — never reconstructed from list prices.
// A partial refund reconstructed from the full line price overstates "observed" loss,
// which is exactly the false precision the financial-impact tiers exist to prevent.
// Returns { total, complete } — complete=false when any refund line lacks an explicit amount.
function refundAmount(order) {
  let total = 0
  let complete = true
  for (const refund of order.refunds || []) {
    const refundLineItems = refund.refund_line_items ?? refund.refundLineItems ?? []
    if (refundLineItems.length) {
      for (const item of refundLineItems) {
        const amount = refundLineAmount(item)
        if (amount == null) complete = false
        else total += amount
      }
      continue
    }

    total += (refund.transactions || [])
      .filter((transaction) => String(transaction.kind || '').toLowerCase() === 'refund')
      .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0)
  }
  return { total, complete }
}

// Explicit refund amounts only (subtotal/total/amount on the refund line). Returns null
// when the payload does not state the refunded amount.
function refundLineAmount(item) {
  const subtotal = item.subtotal ?? item.total ?? item.amount
  if (subtotal != null) return toNumber(subtotal)
  return null
}

function refundedSkuAmounts(order) {
  const refunds = []
  for (const refund of order.refunds || []) {
    for (const item of refund.refund_line_items ?? refund.refundLineItems ?? []) {
      const lineItem = item.line_item || item.lineItem || {}
      const sku = String(lineItem.sku || item.sku || '').trim()
      if (sku) refunds.push({ sku, amount: refundLineAmount(item) })
    }
  }
  return refunds
}

function customerEmail(order) {
  return String(order.email || order.customer?.email || order.contact_email || '').trim().toLowerCase()
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const midpoint = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2
}

function findMetricValue(normalized, keys) {
  const found = normalized?.metrics?.find((item) => keys.includes(item.key))
  if (!found) return null
  const value = Number(found.value)
  return Number.isFinite(value) ? value : null
}

// ── Comms (Slack, Teams, ...) ─────────────────────────────────────────────────

function normalizeComms(provider, data) {
  const out = createNormalizedOutput(provider)
  const channels = data?.channels?.channels ?? data?.channels?.results ?? data?.channels ?? []
  if (!channels.length) return null

  out.metrics.push(metric('slack_channels', 'Slack channels', channels.length, 'count', provider))

  const activeChannels = channels.filter(c => !c.is_archived)
  if (activeChannels.length !== channels.length) {
    out.signals.push(signal('comms', 'info', `${activeChannels.length} active Slack channels`, '', `channels=${channels.length}`, provider))
  }

  return out
}

// ── Support (Zendesk, Intercom, Freshdesk, ...) ───────────────────────────────

function normalizeSupport(provider, data) {
  const out = createNormalizedOutput(provider)
  const tickets = data?.open_tickets?.tickets ?? data?.open_tickets?.results ?? data?.open_tickets ?? []
  if (!tickets.length) return null

  out.metrics.push(metric('open_tickets', 'Open support tickets', tickets.length, 'count', provider))
  out.entities.push(...tickets
    .filter((ticket) => ticket?.id != null)
    .map((ticket) => ({
      type: 'ticket',
      id: String(ticket.id),
      created_at: ticketCreatedAt(ticket),
      order_id: explicitTicketOrderId(ticket),
      source: provider,
    })))

  const surgeRatio = supportTicketSurgeRatio(tickets, data)
  if (surgeRatio != null) addDefinedMetric(out, 'support_ticket_surge_ratio', surgeRatio, 'ratio', provider)

  return out
}

function ticketCreatedAt(ticket) {
  const created = parseDate(ticket.created_at || ticket.createdAt)
  return created ? created.toISOString() : null
}

function explicitTicketOrderId(ticket) {
  const raw = ticket.order_id
    ?? ticket.orderId
    ?? ticket.external_order_id
    ?? ticket.externalOrderId
    ?? ticket.associated_order_id
    ?? ticket.order?.id
    ?? ticket.order?.order_id
    ?? ticket.order?.admin_graphql_api_id
  return raw == null || raw === '' ? null : String(raw)
}

function supportTicketSurgeRatio(tickets, data) {
  const dated = tickets
    .map((ticket) => parseDate(ticket.created_at || ticket.createdAt))
    .filter(Boolean)
  if (!dated.length) return null

  const newest = dated.slice().sort((a, b) => b.getTime() - a.getTime())[0]
  const anchor = parseDate(data?.as_of || data?.fetched_at) || newest
  const dayMs = 24 * 60 * 60 * 1000
  const recentStart = anchor.getTime() - 9 * dayMs
  const priorStart = anchor.getTime() - 18 * dayMs

  let recent = 0
  let prior = 0
  for (const created of dated) {
    const ts = created.getTime()
    if (ts > anchor.getTime()) continue
    if (ts >= recentStart) recent += 1
    else if (ts >= priorStart) prior += 1
  }

  if (prior < 3) return null
  return round(recent / prior, 2)
}

// ── Docs (Notion, Google Drive, Confluence, ...) ──────────────────────────────

function normalizeDocs(provider, data) {
  const out = createNormalizedOutput(provider)
  const pages = data?.pages?.results ?? data?.files?.files ?? data?.pages ?? []
  if (!pages.length) return null

  out.metrics.push(metric('doc_count', 'Documents indexed', pages.length, 'count', provider))
  return out
}

// ── Email (Gmail, Outlook, ...) ───────────────────────────────────────────────

function normalizeEmail(provider, data) {
  const out = createNormalizedOutput(provider)
  const threads = data?.threads?.threads ?? data?.threads ?? []
  if (!threads.length) return null

  out.metrics.push(metric('email_threads', 'Recent email threads', threads.length, 'count', provider))
  return out
}

// ── Main entry point ──────────────────────────────────────────────────────────

const CATEGORY_NORMALIZERS = {
  crm:       normalizeCRM,
  revenue:   normalizeRevenue,
  ecommerce: normalizeEcommerce,
  Ecommerce: normalizeEcommerce,
  comms:     normalizeComms,
  support:   normalizeSupport,
  docs:      normalizeDocs,
  email:     normalizeEmail,
}

// Takes the output of fetchAllConnectedData and returns a single merged normalized shape.
// Callers (health-check, audit, gather-context) call this and get one unified object
// regardless of which apps the user has connected.
export function normalizeConnectorData(connectorData) {
  if (!connectorData || !Object.keys(connectorData).length) return null

  let merged = null

  for (const [, providerData] of Object.entries(connectorData)) {
    const normalizer = CATEGORY_NORMALIZERS[providerData.category]
    if (!normalizer) continue

    try {
      const n = normalizer(providerData.provider, providerData.data)
      if (!n) continue
      n.fetched_at = providerData.fetched_at
      merged = merged ? mergeNormalized(merged, n) : n
    } catch (err) {
      console.warn(`[normalize] ${providerData.provider} normalization failed:`, err.message)
    }
  }

  return merged
}

// Extracts raw row arrays from connector data for BI history storage.
// Called by the sync cron alongside normalizeConnectorData.
// Returns { deals, subscriptions, tickets } — each an array of clean rows ready to INSERT.
export function extractRawRows(connectorData) {
  const deals         = []
  const subscriptions = []
  const tickets       = []

  for (const [, providerData] of Object.entries(connectorData || {})) {
    const { provider, category, data } = providerData

    if (category === 'crm') {
      const rawDeals  = data?.deals?.results  ?? data?.deals?.data  ?? []
      const pipelines = data?.pipelines?.results ?? data?.pipelines?.data ?? []
      const stageRows     = pipelines.flatMap(p => p.stages || [])
      const stageNameById = Object.fromEntries(stageRows.map(s => [s.id, s.label || s.id]))

      for (const d of rawDeals) {
        const p      = d.properties || {}
        const amount = p.amount != null ? Number(p.amount) : null
        deals.push({
          provider,
          deal_id:     d.id,
          deal_name:   p.dealname    || null,
          amount:      Number.isFinite(amount) ? amount : null,
          stage:       stageNameById[p.dealstage] || p.dealstage || null,
          close_date:  p.closedate   ? String(p.closedate).slice(0, 10) : null,
          probability: p.hs_deal_stage_probability != null ? Number(p.hs_deal_stage_probability) : null,
          pipeline:    p.pipeline    || null,
        })
      }
    }

    if (category === 'revenue') {
      const activeSubs   = data?.active_subs?.data   ?? data?.active_subs?.results   ?? []
      const canceledSubs = data?.canceled_subs?.data ?? data?.canceled_subs?.results ?? []

      const toMonthly = (sub) => {
        let m = 0
        for (const item of sub.items?.data ?? []) {
          const price = item.price
          if (!price?.unit_amount) continue
          const a  = price.unit_amount / 100
          const iv = price.recurring?.interval       ?? 'month'
          const ic = price.recurring?.interval_count ?? 1
          if      (iv === 'month') m += a / ic
          else if (iv === 'year')  m += a / ic / 12
          else if (iv === 'week')  m += a * 52 / 12 / ic
          else if (iv === 'day')   m += a * 365 / 12 / ic
        }
        return Number(m.toFixed(2))
      }

      for (const s of activeSubs) {
        subscriptions.push({
          provider,
          sub_id:        s.id,
          customer_id:   s.customer || null,
          status:        'active',
          amount_monthly: toMonthly(s),
          plan_interval: s.items?.data?.[0]?.price?.recurring?.interval || null,
          created_at:    s.created   ? new Date(s.created * 1000).toISOString()    : null,
          canceled_at:   null,
        })
      }

      for (const s of canceledSubs) {
        subscriptions.push({
          provider,
          sub_id:        s.id,
          customer_id:   s.customer || null,
          status:        'canceled',
          amount_monthly: toMonthly(s),
          plan_interval: s.items?.data?.[0]?.price?.recurring?.interval || null,
          created_at:    s.created    ? new Date(s.created * 1000).toISOString()    : null,
          canceled_at:   s.canceled_at ? new Date(s.canceled_at * 1000).toISOString() : null,
        })
      }
    }

    if (category === 'support') {
      const rawTickets = data?.open_tickets?.tickets ?? data?.open_tickets?.results ?? data?.open_tickets ?? []
      for (const t of rawTickets) {
        tickets.push({
          provider,
          ticket_id:   String(t.id),
          status:      t.status     || null,
          priority:    t.priority   || null,
          created_at:  t.created_at || null,
          resolved_at: t.updated_at || null,
        })
      }
    }
  }

  return { deals, subscriptions, tickets }
}

// Formats normalized data as a text block for Claude prompts.
export function formatNormalizedForPrompt(normalized) {
  if (!normalized) return ''

  const lines = [`LIVE CONNECTOR DATA (from ${normalized.provider}):`]
  const m = Object.fromEntries(normalized.metrics.map(x => [x.key, x]))

  if (m.open_deals)           lines.push(`Open deals: ${m.open_deals.value} worth $${Number(m.open_pipeline_value?.value ?? 0).toLocaleString()}`)
  if (m.avg_deal_size?.value) lines.push(`Avg deal size: $${Number(m.avg_deal_size.value).toLocaleString()}`)
  if (m.new_contacts_this_month?.value) lines.push(`New contacts this month: ${m.new_contacts_this_month.value}`)

  const closingSoon = normalized.entities.filter(e => e.type === 'deal')
  if (closingSoon.length) lines.push(`Closing soon: ${closingSoon.map(d => `${d.label} $${d.amount} by ${d.closedate}`).join(', ')}`)

  if (m.mrr?.value)                lines.push(`MRR: $${Number(m.mrr.value).toLocaleString()}`)
  if (m.arr?.value)                lines.push(`ARR: $${Number(m.arr.value).toLocaleString()}`)
  if (m.churn_rate?.value != null) lines.push(`Monthly churn: ${m.churn_rate.value}%`)
  if (m.active_customers?.value != null) lines.push(`Active customers: ${m.active_customers.value}`)
  if (m.ltv?.value)                lines.push(`Estimated LTV: $${Number(m.ltv.value).toLocaleString()}`)
  if (m.open_tickets?.value)       lines.push(`Open support tickets: ${m.open_tickets.value}`)
  if (m.slack_channels?.value)     lines.push(`Slack channels: ${m.slack_channels.value}`)

  if (normalized.signals.length) {
    lines.push('Signals:')
    normalized.signals.forEach(s => lines.push(`- ${s.title}`))
  }

  lines.push('')
  lines.push('Use this data directly. Reference specific numbers. Do not ask for information already present here.')
  return lines.join('\n')
}
