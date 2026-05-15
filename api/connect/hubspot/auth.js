import { createHmac, randomBytes } from 'crypto'
import { PROVIDER_CONFIGS } from '../../lib/connectors/providers.js'

function buildState(userId) {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error('OAUTH_STATE_SECRET is not configured')
  const payload = { userId, provider: 'hubspot', nonce: randomBytes(16).toString('hex'), ts: Date.now() }
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(raw).digest('hex')
  return `${raw}.${sig}`
}

export default async function handler(req, res) {
  const userId = req.query?.state
  const config = PROVIDER_CONFIGS.hubspot

  if (!config) return res.status(400).json({ error: 'Provider not found' })
  if (!userId) return res.status(400).json({ error: 'Missing state' })
  if (!process.env.OAUTH_STATE_SECRET) return res.status(500).json({ error: 'Server misconfiguration' })

  const state = buildState(userId)
  const url = new URL(config.authUrl)
  url.searchParams.set('client_id', config.clientId || '')
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', config.scopes.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')

  return res.redirect(302, url.toString())
}
