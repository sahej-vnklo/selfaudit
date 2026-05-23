import { randomUUID } from 'crypto'
import { PROVIDER_CONFIGS } from '../../lib/connectors/providers.js'
import { validateUserToken } from '../lib/auth.js'
import { requireIntelligencePlan } from '../lib/plans.js'
import { createClient } from '@supabase/supabase-js'
import { signOAuthState } from '../lib/connectors/oauth-state.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  const config = PROVIDER_CONFIGS.hubspot

  if (!config) return res.status(400).json({ error: 'Provider not found' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return
  if (!process.env.OAUTH_STATE_SECRET) return res.status(500).json({ error: 'Server misconfiguration' })
  if (!await requireIntelligencePlan({ userId, res, supabase, feature: 'Connectors' })) return

  const state = signOAuthState(
    { userId, provider: 'hubspot', nonce: randomUUID(), ts: Date.now() },
    process.env.OAUTH_STATE_SECRET,
  )
  const url = new URL(config.authUrl)
  url.searchParams.set('client_id', config.clientId || '')
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', config.scopes.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')

  return res.status(200).json({ url: url.toString() })
}
