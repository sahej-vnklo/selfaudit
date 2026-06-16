// Single file for all connector data fetching via Composio proxy.
// Adding a new connector = add a function here. Never create a new file per connector.

import { getComposioConnection, composioProxy } from './composio.js'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function logSync(userId, provider, status, count = 0, error = null) {
  const sb = getSupabase()
  sb.from('connector_sync_logs').insert({
    user_id: userId,
    provider,
    status,
    records_fetched: count,
    ...(error ? { error_message: error } : {}),
  }).then(() => {}).catch(() => {})
}

// ── HubSpot ───────────────────────────────────────────────────────────────────

const toNumber = (v) => { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
const iso = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null }

const lifecycleKey = (contact) => {
  const raw = String(contact?.properties?.lifecyclestage || contact?.properties?.hs_lead_status || '').toLowerCase()
  if (raw.includes('customer'))                                                       return 'customer'
  if (raw.includes('salesqualified') || raw === 'sql' || raw.includes('opportunity')) return 'sql'
  if (raw.includes('marketingqualified') || raw === 'mql')                           return 'mql'
  return 'lead'
}

async function hubspotGet(connectedAccountId, path) {
  const result = await composioProxy(connectedAccountId, { endpoint: path, method: 'GET' })
  if (result?.data) return result.data
  if (result?.response) return result.response
  return result
}

export async function fetchHubspotData(userId) {
  const conn = await getComposioConnection(userId, 'hubspot')
  if (!conn) return null

  const connId = conn.id

  try {
    const [dealsRes, pipelinesRes, contactsRes] = await Promise.allSettled([
      hubspotGet(connId, '/crm/v3/objects/deals?limit=20&properties=dealname,amount,dealstage,closedate,hs_deal_stage_probability,pipeline&sort=-createdate'),
      hubspotGet(connId, '/crm/v3/pipelines/deals'),
      hubspotGet(connId, '/crm/v3/objects/contacts?limit=20&properties=firstname,lastname,email,hs_lead_status,lifecyclestage,createdate&sort=-createdate'),
    ])

    if (dealsRes.status === 'rejected' && pipelinesRes.status === 'rejected' && contactsRes.status === 'rejected') {
      throw new Error('All HubSpot fetches failed')
    }

    const deals     = dealsRes.status     === 'fulfilled' ? (dealsRes.value?.results     || []) : []
    const contacts  = contactsRes.status  === 'fulfilled' ? (contactsRes.value?.results  || []) : []
    const pipelines = pipelinesRes.status === 'fulfilled' ? (pipelinesRes.value?.results || []) : []

    const stageRows      = pipelines.flatMap(pipe => pipe.stages || [])
    const stageNameById  = Object.fromEntries(stageRows.map(s => [s.id, s.label || s.id]))
    const closedStageIds = new Set(stageRows.filter(s => String(s?.metadata?.isClosed || '').toLowerCase() === 'true').map(s => s.id))
    const hasProposalStage = stageRows.some(s => /proposal/i.test(String(s.label || s.id || '')))

    const openDeals       = deals.filter(d => !closedStageIds.has(d.properties?.dealstage))
    const totalOpenValue  = openDeals.reduce((sum, d) => sum + toNumber(d.properties?.amount), 0)
    const weightedValue   = openDeals.reduce((sum, d) => sum + toNumber(d.properties?.amount) * (toNumber(d.properties?.hs_deal_stage_probability) / 100), 0)

    const stageMap = {}
    openDeals.forEach(d => {
      const name = stageNameById[d.properties?.dealstage] || d.properties?.dealstage || 'Unknown'
      if (!stageMap[name]) stageMap[name] = { name, count: 0, total_value: 0 }
      stageMap[name].count      += 1
      stageMap[name].total_value += toNumber(d.properties?.amount)
    })

    const now           = Date.now()
    const fourteenDays  = now + 14 * 24 * 60 * 60 * 1000
    const monthStart    = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    const dealsClosingSoon = openDeals
      .filter(d => { const ts = new Date(d.properties?.closedate || '').getTime(); return ts >= now && ts <= fourteenDays })
      .map(d => ({
        name:      d.properties?.dealname || 'Untitled deal',
        amount:    toNumber(d.properties?.amount),
        closedate: iso(d.properties?.closedate),
        stage:     stageNameById[d.properties?.dealstage] || d.properties?.dealstage || 'Unknown',
      }))

    const lifecycleCounts = { lead: 0, mql: 0, sql: 0, customer: 0 }
    contacts.forEach(c => { lifecycleCounts[lifecycleKey(c)] += 1 })

    const recentContacts = [...contacts]
      .sort((a, b) => new Date(b.properties?.createdate || 0) - new Date(a.properties?.createdate || 0))
      .slice(0, 5)
      .map(c => ({
        name:    `${c.properties?.firstname || ''} ${c.properties?.lastname || ''}`.trim() || 'Unknown',
        email:   c.properties?.email || '',
        stage:   lifecycleKey(c),
        created: iso(c.properties?.createdate),
      }))

    const newThisMonth = contacts.filter(c => new Date(c.properties?.createdate || 0).getTime() >= monthStart.getTime()).length

    const signals = [
      openDeals.length ? `${openDeals.length} open deals worth $${totalOpenValue.toLocaleString()}` : '',
      weightedValue ? `Pipeline weighted at $${Math.round(weightedValue).toLocaleString()} total` : '',
      dealsClosingSoon.filter(d => d.amount >= 10000).length ? `${dealsClosingSoon.filter(d => d.amount >= 10000).length} deals over $10k closing in 14 days` : '',
      hasProposalStage && !Object.values(stageMap).some(s => /proposal/i.test(s.name)) ? 'No deals in proposal stage' : '',
      newThisMonth ? `${newThisMonth} new contacts added this month` : '',
    ].filter(Boolean).slice(0, 5)

    logSync(userId, 'hubspot', 'success', deals.length + contacts.length + pipelines.length)

    return {
      source:     'hubspot',
      fetched_at: new Date().toISOString(),
      pipeline: {
        total_open_deals:   openDeals.length,
        total_open_value:   totalOpenValue,
        avg_deal_size:      openDeals.length ? Math.round(totalOpenValue / openDeals.length) : 0,
        stages:             Object.values(stageMap),
        deals_closing_soon: dealsClosingSoon,
      },
      contacts: {
        new_this_month:     newThisMonth,
        by_lifecycle_stage: lifecycleCounts,
        recent:             recentContacts,
      },
      signals,
    }
  } catch (err) {
    console.warn('[data-fetcher:hubspot] fetch failed:', err.message)
    logSync(userId, 'hubspot', 'error', 0, err.message)
    return null
  }
}

// ── Stripe ────────────────────────────────────────────────────────────────────

function toMonthlyAmount(sub) {
  const items = sub.items?.data ?? []
  let monthly = 0
  for (const item of items) {
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

async function stripeList(connectedAccountId, path, params = {}, maxPages = 3) {
  const items = []
  let startingAfter = null
  let page = 0

  while (page < maxPages) {
    const qs = new URLSearchParams({ limit: '100', ...params })
    if (startingAfter) qs.set('starting_after', startingAfter)

    const result = await composioProxy(connectedAccountId, { endpoint: `${path}?${qs.toString()}`, method: 'GET' })
    const data   = result?.data ?? result?.response ?? result

    items.push(...(data?.data ?? []))
    if (!data?.has_more || !data?.data?.length) break
    startingAfter = data.data[data.data.length - 1].id
    page++
  }

  return items
}

export async function fetchStripeData(userId) {
  const conn = await getComposioConnection(userId, 'stripe')
  if (!conn) return null

  const connId        = conn.id
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)

  try {
    const [activeSubsRaw, canceledSubsRaw] = await Promise.all([
      stripeList(connId, '/v1/subscriptions', { status: 'active' }),
      stripeList(connId, '/v1/subscriptions', { status: 'canceled', 'canceled_at[gte]': String(thirtyDaysAgo) }),
    ])

    const mrr               = activeSubsRaw.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)
    const activeCustomerIds = new Set(activeSubsRaw.map(s => s.customer).filter(Boolean))
    const activeCustomers   = activeCustomerIds.size
    const canceledCount     = canceledSubsRaw.length
    const totalAtStart      = activeCustomers + canceledCount
    const churnRate         = totalAtStart > 0 ? Number(((canceledCount / totalAtStart) * 100).toFixed(2)) : 0
    const newSubs           = activeSubsRaw.filter(s => s.created >= thirtyDaysAgo)
    const avgMoPerCustomer  = activeCustomers > 0 ? mrr / activeCustomers : 0
    const churnDecimal      = churnRate / 100
    const ltv               = churnDecimal > 0 ? Number((avgMoPerCustomer / churnDecimal).toFixed(2)) : null

    logSync(userId, 'stripe', 'success', activeSubsRaw.length)

    return {
      fetched_at:       new Date().toISOString(),
      mrr:              Number(mrr.toFixed(2)),
      arr:              Number((mrr * 12).toFixed(2)),
      active_customers: activeCustomers,
      churn_rate:       churnRate,
      new_subs_30d:     newSubs.length,
      ltv,
      canceled_30d:     canceledCount,
    }
  } catch (err) {
    console.warn('[data-fetcher:stripe] fetch failed:', err.message)
    logSync(userId, 'stripe', 'error', 0, err.message)
    return null
  }
}
