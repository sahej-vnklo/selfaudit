import { updateAlertStatus } from './lib/monitoring/risk-alerts.js'
import { validateUserToken } from './lib/auth.js'
import { requireIntelligencePlan } from './lib/plans.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, alertId, status } = req.body || {}
  if (!userId || !alertId || !status) {
    return res.status(400).json({ error: 'Missing userId, alertId, or status' })
  }
  if (!await validateUserToken(req, res, userId)) return
  if (!await requireIntelligencePlan({ userId, res, supabase, feature: 'Alerts' })) return

  try {
    const updated = await updateAlertStatus(userId, alertId, status)
    return res.status(200).json({ alert: updated })
  } catch (err) {
    console.error('[update-risk-alert]', err.message)
    return res.status(400).json({ error: err.message })
  }
}
