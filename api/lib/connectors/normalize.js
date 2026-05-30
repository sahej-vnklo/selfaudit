// Normalized business signal format — single shape for all connectors.
// HubSpot, Stripe, Gmail etc. each map their raw API response to this structure.
// The audit prompt and dashboard consume this shape, never raw provider data.

function metric(key, label, value, unit, source, confidence = 'high') {
  return { key, label, value, unit, source, confidence }
}

function signal(type, severity, title, description, evidence, source) {
  return { type, severity, title, description, evidence, source }
}

// Merges two normalized outputs (e.g. HubSpot + Stripe) into one combined shape.
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

// Empty normalized output — seed this per provider.
export function createNormalizedOutput(provider) {
  return {
    provider,
    fetched_at: new Date().toISOString(),
    metrics:      [],
    entities:     [],
    signals:      [],
    risks:        [],
    opportunities: [],
  }
}

// Maps HubSpot raw result (from fetchHubspotBusinessState) → normalized shape.
export function normalizeHubspotData(hubspotData) {
  if (!hubspotData) return null

  const out = createNormalizedOutput('hubspot')
  out.fetched_at = hubspotData.fetched_at || out.fetched_at

  const p  = hubspotData.pipeline || {}
  const c  = hubspotData.contacts || {}
  const lc = c.by_lifecycle_stage || {}

  // ── Metrics ──────────────────────────────────────────────────────────────
  if (typeof p.total_open_deals === 'number') {
    out.metrics.push(metric('open_deals', 'Open deals', p.total_open_deals, 'count', 'hubspot'))
  }
  if (typeof p.total_open_value === 'number') {
    out.metrics.push(metric('open_pipeline_value', 'Open pipeline value', p.total_open_value, 'USD', 'hubspot'))
  }
  if (typeof p.avg_deal_size === 'number' && p.avg_deal_size > 0) {
    out.metrics.push(metric('avg_deal_size', 'Avg deal size', p.avg_deal_size, 'USD', 'hubspot'))
  }
  if (typeof c.new_this_month === 'number') {
    out.metrics.push(metric('new_contacts_this_month', 'New contacts this month', c.new_this_month, 'count', 'hubspot'))
  }
  if (lc.lead     != null) out.metrics.push(metric('leads',     'Leads',           lc.lead,     'count', 'hubspot'))
  if (lc.mql      != null) out.metrics.push(metric('mqls',      'MQLs',            lc.mql,      'count', 'hubspot'))
  if (lc.sql      != null) out.metrics.push(metric('sqls',      'SQLs',            lc.sql,      'count', 'hubspot'))
  if (lc.customer != null) out.metrics.push(metric('customers', 'Customers in CRM', lc.customer, 'count', 'hubspot'))

  // ── Entities (deals closing soon, recent contacts) ────────────────────────
  if (p.deals_closing_soon?.length) {
    p.deals_closing_soon.forEach((deal) => {
      out.entities.push({
        type:      'deal',
        id:        deal.name,
        label:     deal.name,
        amount:    deal.amount,
        closedate: deal.closedate,
        stage:     deal.stage,
        source:    'hubspot',
      })
    })
  }
  if (c.recent?.length) {
    c.recent.forEach((contact) => {
      out.entities.push({
        type:    'contact',
        id:      contact.email || contact.name,
        label:   contact.name,
        stage:   contact.stage,
        created: contact.created,
        source:  'hubspot',
      })
    })
  }

  // ── Signals (existing string signals → structured) ────────────────────────
  if (hubspotData.signals?.length) {
    hubspotData.signals.forEach((s) => {
      out.signals.push(signal('pipeline', 'info', s, s, s, 'hubspot'))
    })
  }

  // ── Risks ─────────────────────────────────────────────────────────────────
  if (p.total_open_deals === 0) {
    out.risks.push(signal(
      'pipeline', 'high',
      'Empty pipeline',
      'No open deals in HubSpot. Revenue is not being actively worked.',
      'total_open_deals = 0',
      'hubspot',
    ))
  }

  const highValueSoon = (p.deals_closing_soon || []).filter((d) => d.amount >= 10000)
  if (highValueSoon.length > 0) {
    out.risks.push(signal(
      'pipeline', 'medium',
      `${highValueSoon.length} high-value deal${highValueSoon.length > 1 ? 's' : ''} closing in 14 days`,
      'Deals over $10k are due soon and may need focused attention to close.',
      highValueSoon.map((d) => `${d.name} $${d.amount} by ${d.closedate}`).join('; '),
      'hubspot',
    ))
  }

  if ((lc.lead || 0) > 5 && (lc.sql || 0) === 0) {
    out.risks.push(signal(
      'contacts', 'medium',
      'Leads not converting to SQL',
      `${lc.lead} leads in CRM with no SQLs. Top-of-funnel is not qualifying through.`,
      `leads=${lc.lead}, sql=0`,
      'hubspot',
    ))
  }

  // ── Opportunities ─────────────────────────────────────────────────────────
  if ((lc.sql || 0) > 0) {
    out.opportunities.push(signal(
      'contacts', 'medium',
      `${lc.sql} SQL${lc.sql > 1 ? 's' : ''} ready for close`,
      'Qualified leads in CRM that could be moved to proposal or close stage.',
      `sql=${lc.sql}`,
      'hubspot',
    ))
  }
  if ((c.new_this_month || 0) > 0) {
    out.opportunities.push(signal(
      'contacts', 'low',
      `${c.new_this_month} new contacts this month`,
      'Fresh contacts added recently — early pipeline opportunity.',
      `new_this_month=${c.new_this_month}`,
      'hubspot',
    ))
  }
  if (p.avg_deal_size > 0 && p.total_open_deals > 0) {
    out.opportunities.push(signal(
      'pipeline', 'low',
      `$${p.avg_deal_size.toLocaleString()} avg deal in pipeline`,
      'Use average deal size as a benchmark when qualifying new opportunities.',
      `avg_deal_size=${p.avg_deal_size}`,
      'hubspot',
    ))
  }

  return out
}

// Converts a normalized output into a text block for the Claude prompt.
// Every future connector maps to the same shape and plugs into this formatter.
export function formatNormalizedForPrompt(normalized) {
  if (!normalized) return ''

  const lines = [`LIVE CONNECTOR DATA (verified from ${normalized.provider}):`]
  const m = Object.fromEntries(normalized.metrics.map((metric) => [metric.key, metric]))

  if (m.open_deals && m.open_pipeline_value != null) {
    lines.push(`Open deals: ${m.open_deals.value} worth $${Number(m.open_pipeline_value.value).toLocaleString()}`)
  }
  if (m.avg_deal_size?.value) {
    lines.push(`Avg deal size: $${Number(m.avg_deal_size.value).toLocaleString()}`)
  }
  if (m.new_contacts_this_month?.value) {
    lines.push(`New contacts this month: ${m.new_contacts_this_month.value}`)
  }

  const closingSoon = normalized.entities.filter((e) => e.type === 'deal')
  if (closingSoon.length) {
    lines.push(`Closing soon: ${closingSoon.map((d) => `${d.label} $${d.amount} by ${d.closedate}`).join(', ')}`)
  }

  if (normalized.signals.length) {
    lines.push('Signals:')
    normalized.signals.forEach((s) => lines.push(`- ${s.title}`))
  }

  if (normalized.risks.length) {
    lines.push('Risks flagged:')
    normalized.risks.forEach((r) => lines.push(`- [${r.severity}] ${r.title}: ${r.description}`))
  }

  if (normalized.opportunities.length) {
    lines.push('Opportunities:')
    normalized.opportunities.forEach((o) => lines.push(`- ${o.title}: ${o.description}`))
  }

  lines.push('')
  lines.push('Use this data directly in your diagnosis. Reference specific numbers. Do not ask the user for information already present here.')
  return lines.join('\n')
}
