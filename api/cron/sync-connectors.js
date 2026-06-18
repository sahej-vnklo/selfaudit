// 5:30 AM UTC cron — pulls fresh connector data for all Intelligence-tier users
// and stores normalized snapshots in connector_snapshots table.
//
// The 6 AM intelligence-synthesis and 8 AM business-health crons both read
// from this table instead of hitting Composio independently.
//
// If this cron fails for a user, the 8 AM health check falls back to a live
// Composio call automatically — nothing breaks.

import { createClient }              from '@supabase/supabase-js'
import { getComposioConnectionMap }  from '../lib/connectors/composio.js'
import { fetchAllConnectedData }     from '../lib/connectors/data-fetcher.js'
import { normalizeConnectorData }    from '../lib/connectors/normalize.js'
import { isAuthorisedCronRequest }   from '../lib/cron-auth.js'

const INTELLIGENCE_TIERS = new Set(['intelligence'])
const BATCH_LIMIT        = 50

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.CRON_SECRET) {
    console.warn('[cron/sync-connectors] CRON_SECRET not set — rejecting request')
    return res.status(401).json({ error: 'Unauthorised' })
  }

  if (!isAuthorisedCronRequest(req, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorised' })
  }

  const sb         = getSupabase()
  const started_at = new Date().toISOString()

  const summary = {
    synced_users:    0,
    skipped_users:   0,
    failures:        [],
    started_at,
    finished_at:     null,
  }

  // 1. Fetch Intelligence-tier users
  const { data: profiles, error: profilesErr } = await sb
    .from('profiles')
    .select('id, tier')
    .in('tier', [...INTELLIGENCE_TIERS])
    .limit(BATCH_LIMIT)

  if (profilesErr) {
    console.error('[cron/sync-connectors] profiles fetch failed:', profilesErr.message)
    return res.status(500).json({ error: profilesErr.message })
  }

  const users = profiles ?? []

  // 2. Check Composio connections for all users in parallel
  const connectionChecks = await Promise.allSettled(
    users.map(async (user) => {
      const connectionMap = await getComposioConnectionMap(user.id)
      return {
        userId:         user.id,
        hasConnections: Object.keys(connectionMap || {}).length > 0,
        providers:      Object.keys(connectionMap || {}),
      }
    })
  )

  // 3. For each user with connections — fetch and store snapshot
  for (let i = 0; i < users.length; i++) {
    const user   = users[i]
    const check  = connectionChecks[i]

    const hasConnections = check.status === 'fulfilled' ? check.value.hasConnections : false
    const providers      = check.status === 'fulfilled' ? check.value.providers      : []

    if (!hasConnections) {
      summary.skipped_users += 1
      continue
    }

    try {
      const connectorData = await fetchAllConnectedData(user.id)

      if (!connectorData || Object.keys(connectorData).length === 0) {
        summary.skipped_users += 1
        continue
      }

      const normalized = normalizeConnectorData(connectorData)
      if (!normalized) {
        summary.skipped_users += 1
        continue
      }

      const fetchedAt = new Date().toISOString()

      await sb
        .from('connector_snapshots')
        .upsert(
          {
            user_id:         user.id,
            normalized_data: normalized,
            providers,
            fetched_at:      fetchedAt,
            updated_at:      fetchedAt,
          },
          { onConflict: 'user_id' }
        )

      summary.synced_users += 1
    } catch (err) {
      console.error(`[cron/sync-connectors] failed for user ${user.id}:`, err?.message || err)
      summary.failures.push({ userId: user.id, error: err?.message || 'unknown' })
    }
  }

  summary.finished_at = new Date().toISOString()
  return res.status(200).json(summary)
}
