// Stripe connector — fetches subscription, revenue, and churn data via Restricted API Key.
// Stored in profiles.integrations.stripe = { api_key, connected_at, account_name, last_synced_at }

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// HTTP Basic auth header for Stripe — apiKey as username, empty password
function stripeAuth(apiKey) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
}

async function stripeGet(apiKey, path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: stripeAuth(apiKey) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Stripe API error ${res.status}`)
  }
  return res.json()
}

// Paginate Stripe list endpoint — fetches up to maxPages * 100 objects
async function stripeList(apiKey, path, params = {}, maxPages = 3) {
  const items = []
  let startingAfter = null
  let page = 0

  while (page < maxPages) {
    const qs = new URLSearchParams({ limit: '100', ...params })
    if (startingAfter) qs.set('starting_after', startingAfter)
    const data = await stripeGet(apiKey, `${path}?${qs}`)
    items.push(...(data.data ?? []))
    if (!data.has_more || !data.data?.length) break
    startingAfter = data.data[data.data.length - 1].id
    page++
  }
  return items
}

// Normalize a subscription's amount to monthly USD
function toMonthlyAmount(sub) {
  const items = sub.items?.data ?? []
  let monthly = 0
  for (const item of items) {
    const price = item.price
    if (!price?.unit_amount) continue
    const amount = price.unit_amount / 100 // cents → dollars
    const interval = price.recurring?.interval ?? 'month'
    const count    = price.recurring?.interval_count ?? 1
    if      (interval === 'month') monthly += amount / count
    else if (interval === 'year')  monthly += amount / count / 12
    else if (interval === 'week')  monthly += amount * 52 / 12 / count
    else if (interval === 'day')   monthly += amount * 365 / 12 / count
  }
  return monthly
}

export async function fetchStripeBusinessState(userId, integrations) {
  const apiKey = integrations?.stripe?.api_key
  if (!apiKey) return null

  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)

  try {
    const [activeSubsRaw, canceledSubsRaw] = await Promise.all([
      stripeList(apiKey, '/subscriptions', { status: 'active' }),
      stripeList(apiKey, '/subscriptions', { status: 'canceled', 'canceled_at[gte]': String(thirtyDaysAgo) }),
    ])

    // MRR from active subscriptions
    const mrr = activeSubsRaw.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)

    // Active customers = unique customer IDs
    const activeCustomerIds = new Set(activeSubsRaw.map(s => s.customer).filter(Boolean))
    const activeCustomers = activeCustomerIds.size

    // Monthly churn rate = canceled_last_30d / (active + canceled_last_30d) * 100
    const canceledCount = canceledSubsRaw.length
    const totalAtStart  = activeCustomers + canceledCount
    const churnRate     = totalAtStart > 0
      ? Number(((canceledCount / totalAtStart) * 100).toFixed(2))
      : 0

    // New subscriptions in last 30 days
    const newSubs = activeSubsRaw.filter(s => s.created >= thirtyDaysAgo)

    // Rough LTV: avg_monthly_value / monthly_churn (only if churn > 0)
    const avgMonthlyPerCustomer = activeCustomers > 0 ? mrr / activeCustomers : 0
    const monthlyChurnDecimal   = churnRate / 100
    const ltv = monthlyChurnDecimal > 0
      ? Number((avgMonthlyPerCustomer / monthlyChurnDecimal).toFixed(2))
      : null

    // Persist last_synced_at non-blocking
    const sb = getSupabase()
    sb.from('profiles')
      .update({ integrations: { ...integrations, stripe: { ...integrations.stripe, last_synced_at: new Date().toISOString() } } })
      .eq('id', userId)
      .then(() => {})
      .catch(() => {})

    // Log sync
    sb.from('connector_sync_logs')
      .insert({ user_id: userId, connector_type: 'stripe', status: 'success', record_count: activeSubsRaw.length })
      .then(() => {})
      .catch(() => {})

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
    console.warn('[stripe] fetch failed:', err.message)

    // Log failure
    const sb = getSupabase()
    sb.from('connector_sync_logs')
      .insert({ user_id: userId, connector_type: 'stripe', status: 'error', error_message: err.message })
      .then(() => {})
      .catch(() => {})

    return null
  }
}

// Validate a Stripe API key and return basic account info
export async function validateStripeApiKey(apiKey) {
  const account = await stripeGet(apiKey, '/account')
  return {
    valid:        true,
    account_name: account.business_profile?.name || account.settings?.dashboard?.display_name || account.email || 'Stripe Account',
    account_id:   account.id,
  }
}
