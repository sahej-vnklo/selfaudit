import { PROVIDER_CONFIGS } from '../../lib/connectors/providers.js'

export default async function handler(req, res) {
  const userId = req.query?.state
  const config = PROVIDER_CONFIGS.hubspot

  if (!config) return res.status(400).json({ error: 'Provider not found' })
  if (!userId) return res.status(400).json({ error: 'Missing state' })

  const state = Buffer.from(JSON.stringify({ userId, provider: 'hubspot' })).toString('base64')
  const url = new URL(config.authUrl)
  url.searchParams.set('client_id', config.clientId || '')
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', config.scopes.join(' '))
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')

  return res.redirect(302, url.toString())
}
