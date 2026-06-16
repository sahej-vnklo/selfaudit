// Connector status endpoint — returns which toolkits the user has connected.
// Now powered by Composio instead of profiles.integrations in Supabase.

import { createClient } from '@supabase/supabase-js'
import { getComposioConnectionMap } from '../lib/connectors/composio.js'
import { requireIntelligencePlan } from './lib/plans.js'
import { CONNECTOR_REGISTRY } from '../lib/connectors/registry.js'

function getAnonSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
}

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token  = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { userId } = req.body || {}
  if (!token || !userId) return res.status(401).json({ error: 'Unauthorized' })

  const anon = getAnonSupabase()
  const { data: authData, error: authError } = await anon.auth.getUser(token)
  if (authError || authData?.user?.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  const service = getServiceSupabase()
  if (!await requireIntelligencePlan({ userId, res, supabase: service, feature: 'Connectors' })) return

  try {
    const composioMap = await getComposioConnectionMap(userId)

    // Build status for every connector in the registry
    const connectors = Object.fromEntries(
      CONNECTOR_REGISTRY
        .filter(c => c.status === 'available')
        .map(c => [
          c.id,
          {
            connected:    !!composioMap[c.id]?.connected,
            connected_at: composioMap[c.id]?.connected_at || null,
          },
        ])
    )

    return res.status(200).json({ connectors })
  } catch (err) {
    console.error('[connect/status] Composio lookup failed:', err.message)
    // Return all disconnected rather than an error — UI can still render
    const connectors = Object.fromEntries(
      CONNECTOR_REGISTRY
        .filter(c => c.status === 'available')
        .map(c => [c.id, { connected: false, connected_at: null }])
    )
    return res.status(200).json({ connectors })
  }
}
