import { updateAlertStatus } from './lib/monitoring/risk-alerts.js'
import { validateUserToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, alertId, status } = req.body || {}
  if (!userId || !alertId || !status) {
    return res.status(400).json({ error: 'Missing userId, alertId, or status' })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    const updated = await updateAlertStatus(userId, alertId, status)
    return res.status(200).json({ alert: updated })
  } catch (err) {
    console.error('[update-risk-alert]', err.message)
    return res.status(400).json({ error: err.message })
  }
}
