import { createClient } from '@supabase/supabase-js'
import { refreshTokenIfNeeded } from './refresh-token.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

const toNumber = (value) => {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num : 0
}

const iso = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null
}

const lifecycleKey = (contact) => {
  const raw = String(contact?.properties?.lifecyclestage || contact?.properties?.hs_lead_status || '').toLowerCase()
  if (raw.includes('customer')) return 'customer'
  if (raw.includes('salesqualified') || raw === 'sql' || raw.includes('opportunity')) return 'sql'
  if (raw.includes('marketingqualified') || raw === 'mql') return 'mql'
  return 'lead'
}

async function logSync(supabase, payload) {
  await supabase.from('connector_sync_logs').insert(payload)
}

export async function fetchHubspotBusinessState(userId, integrations) {
  const supabase = getSupabase()
  try {
    const token = await refreshTokenIfNeeded(userId, 'hubspot', integrations)
    const headers = { Authorization: `Bearer ${token}` }
    const urls = [
      ['deals', 'https://api.hubapi.com/crm/v3/objects/deals?limit=20&properties=dealname,amount,dealstage,closedate,hs_deal_stage_probability,pipeline&sort=-createdate'],
      ['pipelines', 'https://api.hubapi.com/crm/v3/pipelines/deals'],
      ['contacts', 'https://api.hubapi.com/crm/v3/objects/contacts?limit=20&properties=firstname,lastname,email,hs_lead_status,lifecyclestage,createdate&sort=-createdate'],
      ['engagements', 'https://api.hubapi.com/engagements/v1/engagements/recent/modified?count=10'],
    ]

    const settled = await Promise.allSettled(
      urls.map(async ([key, url]) => {
        const response = await fetch(url, { headers })
        if (!response.ok) throw new Error(`${key} fetch failed`)
        return [key, await response.json()]
      })
    )

    const data = Object.fromEntries(settled.filter(r => r.status === 'fulfilled').map(r => r.value))
    const failures = settled.filter(r => r.status === 'rejected').length
    if (Object.keys(data).length === 0) throw new Error('HubSpot sync returned no data')
    const deals = data.deals?.results || []
    const contacts = data.contacts?.results || []
    const engagements = data.engagements?.results || []
    const recordCount = deals.length + contacts.length + engagements.length + (data.pipelines?.results?.length || 0)
    const stageRows = (data.pipelines?.results || []).flatMap(pipe => pipe.stages || [])
    const stageNameById = Object.fromEntries(stageRows.map(stage => [stage.id, stage.label || stage.displayOrder || stage.id]))
    const closedStageIds = new Set(stageRows.filter(stage => String(stage?.metadata?.isClosed || '').toLowerCase() === 'true').map(stage => stage.id))
    const hasProposalStage = stageRows.some((stage) => /proposal/i.test(String(stage.label || stage.id || '')))
    const openDeals = deals.filter(deal => !closedStageIds.has(deal.properties?.dealstage))
    const totalOpenValue = openDeals.reduce((sum, deal) => sum + toNumber(deal.properties?.amount), 0)
    const weightedValue = openDeals.reduce((sum, deal) => sum + (toNumber(deal.properties?.amount) * (toNumber(deal.properties?.hs_deal_stage_probability) / 100)), 0)
    const stageMap = {}
    openDeals.forEach((deal) => {
      const name = stageNameById[deal.properties?.dealstage] || deal.properties?.dealstage || 'Unknown'
      if (!stageMap[name]) stageMap[name] = { name, count: 0, total_value: 0 }
      stageMap[name].count += 1
      stageMap[name].total_value += toNumber(deal.properties?.amount)
    })

    const now = Date.now()
    const fourteenDays = now + (14 * 24 * 60 * 60 * 1000)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const dealsClosingSoon = openDeals
      .filter((deal) => {
        const ts = new Date(deal.properties?.closedate || '').getTime()
        return ts >= now && ts <= fourteenDays
      })
      .map((deal) => ({
        name: deal.properties?.dealname || 'Untitled deal',
        amount: toNumber(deal.properties?.amount),
        closedate: iso(deal.properties?.closedate),
        stage: stageNameById[deal.properties?.dealstage] || deal.properties?.dealstage || 'Unknown',
      }))

    const lifecycleCounts = { lead: 0, mql: 0, sql: 0, customer: 0 }
    contacts.forEach((contact) => { lifecycleCounts[lifecycleKey(contact)] += 1 })
    const recentContacts = [...contacts]
      .sort((a, b) => new Date(b.properties?.createdate || b.createdAt || 0) - new Date(a.properties?.createdate || a.createdAt || 0))
      .slice(0, 5)
      .map((contact) => ({
        name: `${contact.properties?.firstname || ''} ${contact.properties?.lastname || ''}`.trim() || 'Unknown contact',
        email: contact.properties?.email || '',
        stage: lifecycleKey(contact),
        created: iso(contact.properties?.createdate || contact.createdAt),
      }))

    const newThisMonth = contacts.filter((contact) => new Date(contact.properties?.createdate || contact.createdAt || 0).getTime() >= monthStart.getTime()).length
    const signals = [
      openDeals.length ? `${openDeals.length} open deals worth $${totalOpenValue.toLocaleString()}` : '',
      weightedValue ? `Pipeline weighted at $${Math.round(weightedValue).toLocaleString()} total` : '',
      dealsClosingSoon.filter((deal) => deal.amount >= 10000).length ? `${dealsClosingSoon.filter((deal) => deal.amount >= 10000).length} deals over $10k closing in 14 days` : '',
      hasProposalStage && !Object.values(stageMap).some((stage) => /proposal/i.test(stage.name)) ? 'No deals in proposal stage' : '',
      newThisMonth ? `${newThisMonth} new contacts added this month` : '',
    ].filter(Boolean).slice(0, 5)

    const result = {
      source: 'hubspot',
      fetched_at: new Date().toISOString(),
      pipeline: {
        total_open_deals: openDeals.length,
        total_open_value: totalOpenValue,
        avg_deal_size: openDeals.length ? Math.round(totalOpenValue / openDeals.length) : 0,
        stages: Object.values(stageMap),
        deals_closing_soon: dealsClosingSoon,
      },
      contacts: {
        new_this_month: newThisMonth,
        by_lifecycle_stage: lifecycleCounts,
        recent: recentContacts,
      },
      signals,
    }

    const nextIntegrations = {
      ...(integrations || {}),
      hubspot: {
        ...(integrations?.hubspot || {}),
        last_synced_at: new Date().toISOString(),
      },
    }

    await supabase.from('profiles').update({ integrations: nextIntegrations }).eq('id', userId)
    await logSync(supabase, {
      user_id: userId,
      provider: 'hubspot',
      status: failures > 0 ? 'partial' : 'success',
      records_fetched: recordCount,
    })
    return result
  } catch (err) {
    await logSync(supabase, {
      user_id: userId,
      provider: 'hubspot',
      status: 'error',
      records_fetched: 0,
      error_message: err.message,
    }).catch(() => {})
    return null
  }
}
