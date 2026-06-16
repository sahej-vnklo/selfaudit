import { validateUserToken } from '../../lib/auth.js'
import { fetchAllConnectedData } from '../../lib/connectors/data-fetcher.js'
import { normalizeConnectorData } from '../../lib/connectors/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  try {
    const connectorData = await fetchAllConnectedData(userId)
    if (!Object.keys(connectorData).length) return res.status(200).json({ source: null })

    const normalized = normalizeConnectorData(connectorData)
    return res.status(200).json({ source: normalized?.provider ?? null, normalized, raw: connectorData })
  } catch (err) {
    console.error('[composio/preview] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
