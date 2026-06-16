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

  // Risks
  if (openDeals.length === 0) {
    out.risks.push(signal('pipeline', 'high', 'Empty pipeline', 'No open deals in CRM. Revenue is not being actively worked.', 'open_deals = 0', provider))
  }
  const highValueSoon = closingSoon.filter(d => d.amount >= 10000)
  if (highValueSoon.length > 0) {
    out.risks.push(signal('pipeline', 'medium',
      `${highValueSoon.length} high-value deal${highValueSoon.length > 1 ? 's' : ''} closing in 14 days`,
      'Deals over $10k are due soon.',
      highValueSoon.map(d => `${d.label} $${d.amount} by ${d.closedate}`).join('; '),
      provider,
    ))
  }
  if (lifecycle.lead > 5 && lifecycle.sql === 0) {
    out.risks.push(signal('contacts', 'medium', 'Leads not converting to SQL',
      `${lifecycle.lead} leads with no SQLs. Qualification funnel may be broken.`,
      `leads=${lifecycle.lead}, sql=0`, provider,
    ))
  }

  // Opportunities
  if (lifecycle.sql > 0) {
    out.opportunities.push(signal('contacts', 'medium', `${lifecycle.sql} SQL${lifecycle.sql > 1 ? 's' : ''} ready for close`, 'Qualified leads ready to move to proposal or close.', `sql=${lifecycle.sql}`, provider))
  }
  if (newThisMonth > 0) {
    out.opportunities.push(signal('contacts', 'low', `${newThisMonth} new contacts this month`, 'Fresh contacts — early pipeline opportunity.', `new_this_month=${newThisMonth}`, provider))
  }

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

  if (churnRate > 5) {
    out.risks.push(signal('revenue', 'high', 'High monthly churn', `Churn at ${churnRate}% — revenue is leaking.`, `churn_rate=${churnRate}%`, provider))
  } else if (churnRate > 2) {
    out.risks.push(signal('revenue', 'medium', 'Elevated churn', `Churn at ${churnRate}% above healthy baseline.`, `churn_rate=${churnRate}%`, provider))
  }
  if (mrr === 0 && activeCustomers === 0) {
    out.risks.push(signal('revenue', 'high', 'No active subscriptions', 'Zero active subscriptions found.', 'active_subs=0', provider))
  }
  if (newSubs30d > 0) {
    out.opportunities.push(signal('revenue', 'low', `${newSubs30d} new subscriber${newSubs30d > 1 ? 's' : ''} in 30 days`, 'Focus on onboarding quality to protect early retention.', `new_subs_30d=${newSubs30d}`, provider))
  }

  return out
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

  if (tickets.length > 20) {
    out.risks.push(signal('support', 'medium', 'High open ticket volume', `${tickets.length} open tickets — support queue may be backing up.`, `open_tickets=${tickets.length}`, provider))
  }

  return out
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
  crm:     normalizeCRM,
  revenue: normalizeRevenue,
  comms:   normalizeComms,
  support: normalizeSupport,
  docs:    normalizeDocs,
  email:   normalizeEmail,
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
  if (normalized.risks.length) {
    lines.push('Risks:')
    normalized.risks.forEach(r => lines.push(`- [${r.severity}] ${r.title}: ${r.description}`))
  }
  if (normalized.opportunities.length) {
    lines.push('Opportunities:')
    normalized.opportunities.forEach(o => lines.push(`- ${o.title}: ${o.description}`))
  }

  lines.push('')
  lines.push('Use this data directly. Reference specific numbers. Do not ask for information already present here.')
  return lines.join('\n')
}
