import { createClient } from '@supabase/supabase-js'
import { getConnectorRegistry } from './lib/connectors/registry.js'

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
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
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
  const { data, error } = await service
    .from('profiles')
    .select('integrations')
    .eq('id', userId)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  const integrations = data?.integrations || {}
  const registry = getConnectorRegistry()

  const connectors = registry.map((connector) => {
    const integration = integrations?.[connector.id] || {}
    return {
      ...connector,
      connected:      !!integration.access_token,
      connected_at:   integration.connected_at   ?? null,
      last_synced_at: integration.last_synced_at ?? null,
    }
  })

  return res.status(200).json({ connectors })
}
