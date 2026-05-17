import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { synthesizeUserIntelligence } from './lib/intelligence/synthesize.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const ALLOWED_ACTION_STATUSES = new Set(['done', 'partial', 'not_started'])
const ALLOWED_CHANGED_AREAS = new Set(['goal_progress', 'pipeline_revenue', 'execution', 'customer_health', 'critical_risks'])

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sanitizeChangedAreas(input) {
  const next = []
  for (const area of Array.isArray(input) ? input : []) {
    if (ALLOWED_CHANGED_AREAS.has(area) && !next.includes(area)) next.push(area)
  }
  return next
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    userId,
    reportId,
    reportTitle = '',
    sinceLast = '',
    improved = '',
    blocked = '',
    actionStatus = 'partial',
    changedAreas = [],
  } = req.body || {}

  if (!userId || !reportId) {
    return res.status(400).json({ error: 'Missing userId or reportId' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const cleanSinceLast = sanitizeText(sinceLast)
  const cleanImproved = sanitizeText(improved)
  const cleanBlocked = sanitizeText(blocked)
  const cleanActionStatus = ALLOWED_ACTION_STATUSES.has(actionStatus) ? actionStatus : 'partial'
  const cleanChangedAreas = sanitizeChangedAreas(changedAreas)

  if (!cleanSinceLast) {
    return res.status(400).json({ error: 'Missing founder update summary' })
  }

  try {
    const headlineSource = sanitizeText(reportTitle)
    const headline = headlineSource
      ? `Dashboard follow-up — ${headlineSource}`
      : 'Dashboard follow-up'

    const businessState = {
      checkin_type: 'dashboard_followup',
      since_last: cleanSinceLast,
      improved: cleanImproved,
      blocked: cleanBlocked,
      action_status: cleanActionStatus,
      changed_areas: cleanChangedAreas,
      captured_from: 'dashboard',
      captured_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from('user_memory')
      .insert({
        user_id: userId,
        report_id: reportId,
        headline,
        core_problem: cleanBlocked || cleanSinceLast,
        root_causes: cleanBlocked ? [cleanBlocked] : [],
        priority_actions: cleanImproved ? [cleanImproved] : [],
        domains_audited: cleanChangedAreas,
        business_state: businessState,
        status: cleanActionStatus === 'done' ? 'done' : 'open',
      })

    if (insertError) throw insertError

    try {
      await synthesizeUserIntelligence(userId, { supabase })
    } catch (synthError) {
      console.warn('[save-dashboard-checkin] synthesis failed:', synthError?.message || synthError)
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not save founder update' })
  }
}
