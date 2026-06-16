// Generic connector data fetcher.
// Reads tool-registry.js to know what to call. Knows nothing about specific apps.
// Adding a new connector = add it to tool-registry.js. Nothing changes here.

import { getComposioConnectionMap, executeTool } from './composio.js'
import { TOOL_REGISTRY } from './tool-registry.js'
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

// Fetches data from every app the user has connected.
// Returns: { hubspot: { provider, category, fetched_at, data: { deals, contacts, pipelines } }, stripe: { ... }, ... }
// If user connects Salesforce tomorrow, it just appears here automatically — no code changes needed.
export async function fetchAllConnectedData(userId) {
  let connectionMap = {}
  try {
    connectionMap = await getComposioConnectionMap(userId)
  } catch (err) {
    console.warn('[data-fetcher] could not get connections:', err.message)
    return {}
  }

  const providers = Object.keys(connectionMap).filter(p => TOOL_REGISTRY[p])
  if (!providers.length) return {}

  const results = {}

  await Promise.allSettled(providers.map(async (provider) => {
    const { category, tools } = TOOL_REGISTRY[provider]
    const providerResult = {
      provider,
      category,
      fetched_at: new Date().toISOString(),
      data: {},
    }

    const toolResults = await Promise.allSettled(
      tools.map(async ({ slug, args, dataKey }) => {
        const res = await executeTool(userId, slug, args)
        return { dataKey, data: res?.data ?? res }
      })
    )

    let hits = 0
    for (const r of toolResults) {
      if (r.status === 'fulfilled' && r.value.data) {
        providerResult.data[r.value.dataKey] = r.value.data
        hits++
      } else if (r.status === 'rejected') {
        console.warn(`[data-fetcher] ${provider} tool failed:`, r.reason?.message)
      }
    }

    logSync(userId, provider, hits > 0 ? 'success' : 'error', hits)
    results[provider] = providerResult
  }))

  return results
}
