import { validateUserToken } from '../../lib/auth.js'
import { fetchHubspotData } from '../../lib/connectors/data-fetcher.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, provider = 'hubspot' } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  try {
    if (provider === 'hubspot') {
      const data = await fetchHubspotData(userId)
      if (!data) return res.status(200).json({ source: null })
      return res.status(200).json(data)
    }

    return res.status(400).json({ error: `Preview not available for ${provider}` })
  } catch (err) {
    console.error('[composio/preview] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
