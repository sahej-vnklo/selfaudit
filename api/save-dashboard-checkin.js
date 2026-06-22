import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { synthesizeUserIntelligence } from './lib/intelligence/synthesize.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const ALLOWED_ACTION_STATUSES = new Set(['done', 'partial', 'not_started'])
const ALLOWED_FEEDBACK_STATUSES = new Set(['done', 'in_progress', 'failed', 'skipped'])
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

function sanitizeActionFeedback(input) {
  if (!Array.isArray(input)) return []
  return input.slice(0, 5).map(item => ({
    text:    typeof item?.text    === 'string' ? item.text.trim().slice(0, 300)    : '',
    status:  ALLOWED_FEEDBACK_STATUSES.has(item?.status) ? item.status             : 'skipped',
    outcome: typeof item?.outcome === 'string' ? item.outcome.trim().slice(0, 400) : '',
  })).filter(item => item.text)
}

// Derive a coarse session status from per-action feedback (backward compatible).
function deriveActionStatus(feedback, fallback) {
  if (!feedback?.length) return fallback
  if (feedback.every(a => a.status === 'done'))                          return 'done'
  if (feedback.some(a => a.status === 'done' || a.status === 'in_progress')) return 'partial'
  return 'not_started'
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
    actionFeedback = [],
  } = req.body || {}

  if (!userId || !reportId) {
    return res.status(400).json({ error: 'Missing userId or reportId' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const cleanSinceLast = sanitizeText(sinceLast)
  const cleanImproved = sanitizeText(improved)
  const cleanBlocked = sanitizeText(blocked)
  const cleanChangedAreas = sanitizeChangedAreas(changedAreas)
  const cleanActionFeedback = sanitizeActionFeedback(actionFeedback)
  const cleanActionStatus = deriveActionStatus(cleanActionFeedback, ALLOWED_ACTION_STATUSES.has(actionStatus) ? actionStatus : 'partial')

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
        action_feedback: cleanActionFeedback,
      })

    if (insertError) throw insertError

    // When a founder confirms actions worked, write those as grounded pattern rows.
    // These are the only rows that will eventually feed back into audit prompts
    // once we have enough user_reported_worked rows to make the signal trustworthy.
    const workedActions = cleanActionFeedback.filter(a => a.status === 'done')
    if (workedActions.length > 0) {
      const patternRows = workedActions.map(a => ({
        industry:          null,
        domain:            null,
        conversation_mode: null,
        root_causes:       [],
        actions_given:     [a.text],
        source_type:       'user_reported_worked',
        source_user_id:    userId,
        source_report_id:  reportId,
      }))
      supabase.from('patterns').insert(patternRows).catch(() => {})
    }

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
