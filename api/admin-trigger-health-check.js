import { runBusinessHealthCheck } from './lib/monitoring/health-check.js'
import { createRiskAlertsFromHealthCheck } from './lib/monitoring/risk-alerts.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const ADMIN_EMAIL = 'sahej@vnklo.com'

async function isAuthorized(req) {
  const key = req.headers['x-tsa-admin-key'] || ''
  if (process.env.TSA_ADMIN_KEY && key === process.env.TSA_ADMIN_KEY) return true

  const auth = req.headers.authorization || ''
  if (auth.startsWith('Bearer ')) {
    try {
      const { data } = await supabase.auth.getUser(auth.slice(7))
      if (data?.user?.email === ADMIN_EMAIL) return true
    } catch { /* deny */ }
  }
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!await isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    const result = await runBusinessHealthCheck(userId)
    if (!result) return res.status(500).json({ error: 'Health check returned no result' })

    const { data: hc, error: hcErr } = await supabase
      .from('business_health_checks')
      .insert({
        user_id:             userId,
        checked_at:          new Date().toISOString(),
        health_score:        result.health_score ?? null,
        risks:               result.risks ?? [],
        opportunities:       result.opportunities ?? [],
        summary:             result.summary ?? null,
        recommended_actions: result.recommended_actions ?? [],
        evidence:            result.evidence ?? {},
      })
      .select('id')
      .single()

    if (hcErr) return res.status(500).json({ error: hcErr.message })

    await createRiskAlertsFromHealthCheck(userId, { ...result, id: hc.id })

    return res.status(200).json({ success: true, health_score: result.health_score })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Health check failed' })
  }
}
