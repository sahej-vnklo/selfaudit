// BI slice query layer.
// Reads from connector_metric_history, connector_deals, connector_subscriptions, connector_tickets.
// Returns structured data that Claude reads as tables — not compressed summaries.
//
// Usage: buildBIContext(userId) → formatBIContextForPrompt(ctx)

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Returns trend rows for a set of metric keys over the last N days.
// Groups multiple readings on the same day by taking the last value.
async function getMetricTrend(sb, userId, metricKeys, days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await sb
    .from('connector_metric_history')
    .select('metric_key, metric_value, synced_at, provider')
    .eq('user_id', userId)
    .in('metric_key', metricKeys)
    .gte('synced_at', since)
    .order('synced_at', { ascending: true })

  if (!data?.length) return {}

  // Group by metric_key → dedupe by date (keep last value per day)
  const grouped = {}
  for (const row of data) {
    if (!grouped[row.metric_key]) grouped[row.metric_key] = {}
    const date = row.synced_at.slice(0, 10)
    grouped[row.metric_key][date] = { value: row.metric_value, provider: row.provider }
  }

  // Convert to sorted arrays
  const result = {}
  for (const [key, byDate] of Object.entries(grouped)) {
    result[key] = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { value, provider }]) => ({ date, value, provider }))
  }
  return result
}

// Returns deal rows from the most recent sync.
async function getCurrentDeals(sb, userId) {
  const { data: latest } = await sb
    .from('connector_deals')
    .select('synced_at')
    .eq('user_id', userId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  if (!latest) return []

  const { data } = await sb
    .from('connector_deals')
    .select('deal_name, amount, stage, close_date, probability, pipeline, provider')
    .eq('user_id', userId)
    .eq('synced_at', latest.synced_at)
    .order('amount', { ascending: false, nullsFirst: false })
    .limit(25)

  return data ?? []
}

// Returns subscription rows from the most recent sync.
async function getCurrentSubscriptions(sb, userId) {
  const { data: latest } = await sb
    .from('connector_subscriptions')
    .select('synced_at')
    .eq('user_id', userId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  if (!latest) return []

  const { data } = await sb
    .from('connector_subscriptions')
    .select('sub_id, customer_id, status, amount_monthly, plan_interval, created_at, canceled_at, provider')
    .eq('user_id', userId)
    .eq('synced_at', latest.synced_at)
    .limit(100)

  return data ?? []
}

// Main: assemble all BI slices for a user.
export async function buildBIContext(userId) {
  if (!userId) return null
  try {
    const sb = getSupabase()
    const [revenue, pipeline, support, deals, subs] = await Promise.allSettled([
      getMetricTrend(sb, userId, ['mrr', 'arr', 'churn_rate', 'active_customers', 'new_customers_30d'], 30),
      getMetricTrend(sb, userId, ['open_deals', 'open_pipeline_value', 'avg_deal_size'], 30),
      getMetricTrend(sb, userId, ['open_tickets'], 14),
      getCurrentDeals(sb, userId),
      getCurrentSubscriptions(sb, userId),
    ])

    const ctx = {
      revenue:       revenue.status === 'fulfilled' ? revenue.value : {},
      pipeline:      pipeline.status === 'fulfilled' ? pipeline.value : {},
      support:       support.status === 'fulfilled' ? support.value : {},
      deals:         deals.status === 'fulfilled' ? deals.value : [],
      subscriptions: subs.status === 'fulfilled' ? subs.value : [],
    }

    // Return null if there's nothing meaningful
    const hasData = Object.values(ctx.revenue).some(a => a.length > 0)
      || Object.values(ctx.pipeline).some(a => a.length > 0)
      || Object.values(ctx.support).some(a => a.length > 0)
      || ctx.deals.length > 0
      || ctx.subscriptions.length > 0

    return hasData ? ctx : null
  } catch {
    return null
  }
}

// Formats BI context as structured tables for Claude.
// Claude reads numbers directly — no chart needed.
export function formatBIContextForPrompt(ctx) {
  if (!ctx) return ''

  const lines = ['HISTORICAL CONNECTOR DATA (from connected tools):']
  let hasContent = false

  // Revenue trend
  const mrr = ctx.revenue?.mrr
  if (mrr?.length >= 2) {
    hasContent = true
    lines.push('')
    lines.push('MRR TREND (last 30 days):')
    lines.push('Date       | MRR')
    for (const r of mrr.slice(-10)) {
      lines.push(`${r.date} | $${Number(r.value).toLocaleString()}`)
    }
    const first = mrr[0]
    const last  = mrr[mrr.length - 1]
    const delta = last.value - first.value
    const sign  = delta >= 0 ? '+' : ''
    lines.push(`Change over period: ${sign}$${Number(Math.abs(delta)).toLocaleString()}`)
  }

  const churn = ctx.revenue?.churn_rate
  if (churn?.length >= 2) {
    hasContent = true
    const latest = churn[churn.length - 1]
    const oldest = churn[0]
    const dir    = latest.value > oldest.value ? '↑' : latest.value < oldest.value ? '↓' : '→'
    lines.push(`Churn rate: ${latest.value}% ${dir} (was ${oldest.value}% on ${oldest.date})`)
  }

  const activeCust = ctx.revenue?.active_customers
  if (activeCust?.length >= 2) {
    hasContent = true
    const latest = activeCust[activeCust.length - 1]
    const oldest = activeCust[0]
    lines.push(`Active customers: ${latest.value} (was ${oldest.value} on ${oldest.date})`)
  }

  // Pipeline trend
  const openDeals = ctx.pipeline?.open_deals
  if (openDeals?.length >= 2) {
    hasContent = true
    lines.push('')
    lines.push('PIPELINE TREND (last 30 days):')
    const latest = openDeals[openDeals.length - 1]
    const oldest = openDeals[0]
    lines.push(`Open deals: ${oldest.value} on ${oldest.date} → ${latest.value} on ${latest.date}`)
    const pv = ctx.pipeline?.open_pipeline_value
    if (pv?.length) {
      const latestPv = pv[pv.length - 1]
      lines.push(`Pipeline value: $${Number(latestPv.value).toLocaleString()}`)
    }
  }

  // Current deals table
  if (ctx.deals?.length) {
    hasContent = true
    lines.push('')
    lines.push('CURRENT DEALS (latest sync):')
    lines.push('Deal name            | Amount     | Stage          | Close date | Probability')
    for (const d of ctx.deals.slice(0, 15)) {
      const name  = (d.deal_name || 'Untitled').slice(0, 20).padEnd(20)
      const amt   = d.amount != null ? `$${Number(d.amount).toLocaleString()}` : '—'
      const stage = (d.stage || '—').slice(0, 14).padEnd(14)
      const close = d.close_date || '—'
      const prob  = d.probability != null ? `${d.probability}%` : '—'
      lines.push(`${name} | ${amt.padEnd(10)} | ${stage} | ${close} | ${prob}`)
    }
  }

  // Subscriptions summary (active vs canceled)
  if (ctx.subscriptions?.length) {
    hasContent = true
    const active   = ctx.subscriptions.filter(s => s.status === 'active')
    const canceled = ctx.subscriptions.filter(s => s.status === 'canceled')
    const totalMRR = active.reduce((sum, s) => sum + (s.amount_monthly || 0), 0)
    lines.push('')
    lines.push('SUBSCRIPTIONS (current snapshot):')
    lines.push(`Active: ${active.length} | Canceled in snapshot: ${canceled.length} | Combined MRR: $${Number(totalMRR.toFixed(2)).toLocaleString()}`)
    if (active.length > 0 && active.length <= 20) {
      lines.push('Customer ID          | Monthly   | Plan interval | Since')
      for (const s of active.slice(0, 10)) {
        const cust  = (s.customer_id || '—').slice(0, 20).padEnd(20)
        const amt   = `$${Number(s.amount_monthly || 0).toLocaleString()}`
        const iv    = s.plan_interval || '—'
        const since = s.created_at ? s.created_at.slice(0, 10) : '—'
        lines.push(`${cust} | ${amt.padEnd(9)} | ${iv.padEnd(13)} | ${since}`)
      }
    }
  }

  // Support trend
  const tickets = ctx.support?.open_tickets
  if (tickets?.length >= 2) {
    hasContent = true
    const latest = tickets[tickets.length - 1]
    const oldest = tickets[0]
    const dir    = latest.value > oldest.value ? '↑ increasing' : latest.value < oldest.value ? '↓ decreasing' : '→ stable'
    lines.push('')
    lines.push(`SUPPORT TICKETS: ${latest.value} open (${dir} from ${oldest.value} on ${oldest.date})`)
  }

  if (!hasContent) return ''

  lines.push('')
  lines.push('Use these numbers to identify trends. Reference specific changes and dates when diagnosing. Do not ask for data already present here.')

  return lines.join('\n')
}
