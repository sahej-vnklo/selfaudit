import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from '../../../lib/intelligence/company-brain.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Returns a spoken business update prefixed with caller context so the AI
// can greet personally and reference something real before diving in.
export async function getBusinessOverview(userId) {
  const sb = getSupabase()

  const [profileResult, brainResult, healthResult, alertsResult, actionsResult, snapshotResult] = await Promise.allSettled([
    sb.from('profiles').select('name').eq('id', userId).single(),
    getCompanyBrain(userId),
    sb.from('business_health_checks')
      .select('summary, risks, recommended_actions, checked_at')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single(),
    sb.from('risk_alerts')
      .select('severity, title, description')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3),
    sb.from('pending_actions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending'),
    sb.from('area_metric_snapshots')
      .select('metric_name, value, delta_from_prior, area')
      .eq('user_id', userId)
      .not('delta_from_prior', 'is', null)
      .order('captured_at', { ascending: false })
      .limit(20),
  ])

  const callerName = profileResult.status === 'fulfilled' ? (profileResult.value?.data?.name || '').split(' ')[0] : ''
  const brain = brainResult.status === 'fulfilled' ? brainResult.value : null
  const health = healthResult.status === 'fulfilled' ? healthResult.value?.data : null
  const alerts = alertsResult.status === 'fulfilled' ? (alertsResult.value?.data ?? []) : []
  const pendingCount = actionsResult.status === 'fulfilled' ? (actionsResult.value?.data?.length ?? 0) : 0
  const snapshots = snapshotResult.status === 'fulfilled' ? (snapshotResult.value?.data ?? []) : []

  // Find something positive to mention in the greeting
  const positiveSnapshot = snapshots.find((s) => s.delta_from_prior > 0 && ['conversion_rate', 'mrr', 'new_customers', 'nps', 'goal_progress', 'open_deals'].includes(s.metric_name))
  const positiveHint = positiveSnapshot
    ? `${positiveSnapshot.metric_name.replace(/_/g, ' ')} is up`
    : (brain?.opportunities?.length ? brain.opportunities[0] : null)

  // Urgency level for greeting selection
  const hasCritical = alerts.some((a) => a.severity === 'critical') || health?.risks?.some((r) => r.severity === 'critical')
  const urgency = hasCritical ? 'high' : (alerts.length || pendingCount > 0) ? 'medium' : 'low'

  // Build the business update — keep it to 2 points max for voice
  const parts = []

  // Priority 1: critical/high risks
  if (health?.risks?.length) {
    const critical = health.risks.filter((r) => r.severity === 'critical')
    const high = health.risks.filter((r) => r.severity === 'high')
    const topRisk = [...critical, ...high][0]
    if (topRisk) {
      parts.push(topRisk.title + '.')
    } else if (health.summary) {
      parts.push(health.summary)
    }
  } else if (health?.summary) {
    parts.push(health.summary)
  }

  // Priority 2: open alerts (only if we haven't already covered critical)
  if (alerts.length && parts.length < 2) {
    const critical = alerts.filter((a) => a.severity === 'critical')
    if (critical.length) {
      parts.push(`Critical: ${critical[0].title}.`)
    } else if (!hasCritical) {
      parts.push(`${alerts.length} open alert${alerts.length > 1 ? 's' : ''} — top one: ${alerts[0].title}.`)
    }
  }

  // Priority 3: pending actions (if no other urgency filled the slots)
  if (pendingCount > 0 && parts.length < 2) {
    parts.push(`${pendingCount} action${pendingCount > 1 ? 's' : ''} waiting for your approval.`)
  }

  // Priority 4: positive opportunity (only when things are calm)
  if (!hasCritical && brain?.opportunities?.length && parts.length < 2) {
    parts.push(`One thing worth your attention: ${brain.opportunities[0]}.`)
  }

  const update = parts.length
    ? parts.join(' ')
    : "Nothing critical right now. Things look stable."

  // Rotating greetings — pick one so each call feels different
  const greetings = hasCritical
    ? ['We need to talk.', 'Glad you called.', 'Good timing.']
    : ['Talk to me.', "What are we looking at?", "Good you called.", callerName ? `${callerName}.` : "Hey."]
  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  // Prefix with caller context — AI uses these as instructions, not speech
  const contextPrefix = [
    `[GREETING:${greeting}]`,
    callerName ? `[CALLER:${callerName}]` : '',
    positiveHint ? `[NOTABLE:${positiveHint}]` : '',
    `[URGENCY:${urgency}]`,
  ].filter(Boolean).join(' ')

  return `${contextPrefix}\n\n${update}`
}
