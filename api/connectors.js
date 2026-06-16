import { createClient } from '@supabase/supabase-js'
import { getConnectorRegistry } from './lib/connectors/registry.js'
import { requireIntelligencePlan } from './lib/plans.js'
import { getComposioConnectionMap } from './lib/connectors/composio.js'

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

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { userId } = req.body || {}
  if (!token || !userId) return res.status(401).json({ error: 'Unauthorized' })

  const anon = getAnonSupabase()
  const { data: authData, error: authError } = await anon.auth.getUser(token)
  if (authError || authData?.user?.id !== userId) return res.status(401).json({ error: 'Unauthorized' })

  const service = getServiceSupabase()
  if (!await requireIntelligencePlan({ userId, res, supabase: service, feature: 'Connectors' })) return

  let connectionMap = {}
  try {
    connectionMap = await getComposioConnectionMap(userId)
  } catch (err) {
    console.warn('[connectors] Composio status fetch failed:', err.message)
  }

  const registry = getConnectorRegistry()
  const connectors = registry.map((connector) => {
    const conn = connectionMap[connector.id] || {}
    return {
      ...connector,
      connected:      !!conn.connected,
      connected_at:   conn.connected_at   ?? null,
      last_synced_at: conn.connected_at   ?? null,
    }
  })

  return res.status(200).json({ connectors })
}
