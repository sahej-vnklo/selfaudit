import { validateUserToken } from '../../lib/auth.js'
import { disconnectComposio } from '../../lib/connectors/composio.js'

const SUPPORTED = ['hubspot', 'stripe', 'gmail', 'slack', 'notion', 'zendesk', 'googledrive']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, provider } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!provider || !SUPPORTED.includes(provider)) {
    return res.status(400).json({ error: `Invalid provider. Supported: ${SUPPORTED.join(', ')}` })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    const disconnected = await disconnectComposio(userId, provider)
    return res.status(200).json({ success: true, disconnected, provider })
  } catch (err) {
    console.error('[composio/disconnect] error:', err.message)
    return res.status(500).json({ error: err.message || 'Failed to disconnect' })
  }
}
