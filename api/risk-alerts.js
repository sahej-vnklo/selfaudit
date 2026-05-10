import { getOpenAlerts } from './lib/monitoring/risk-alerts.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body || {}
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    const alerts = await getOpenAlerts(userId)
    return res.status(200).json({ alerts })
  } catch (err) {
    console.error('[risk-alerts]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
