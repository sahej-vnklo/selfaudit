import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from '../../../lib/intelligence/company-brain.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Returns a plain spoken summary of the current business state.
// No scores, no JSON — just what a smart advisor would say on a call.
export async function getBusinessOverview(userId) {
  const sb = getSupabase()

  const [brainResult, healthResult, alertsResult, actionsResult] = await Promise.allSettled([
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
  ])

  const brain = brainResult.status === 'fulfilled' ? brainResult.value : null
  const health = healthResult.status === 'fulfilled' ? healthResult.value?.data : null
  const alerts = alertsResult.status === 'fulfilled' ? (alertsResult.value?.data ?? []) : []
  const pendingCount = actionsResult.status === 'fulfilled' ? (actionsResult.value?.data?.length ?? 0) : 0

  const parts = []

  // Lead with biggest concern from health check risks
  if (health?.risks?.length) {
    const critical = health.risks.filter((r) => r.severity === 'critical')
    const high = health.risks.filter((r) => r.severity === 'high')
    const topRisks = [...critical, ...high].slice(0, 2)
    if (topRisks.length) {
      parts.push(topRisks.map((r) => r.title).join('. ') + '.')
    } else if (health.summary) {
      parts.push(health.summary)
    }
  } else if (health?.summary) {
    parts.push(health.summary)
  }

  // Open alerts
  if (alerts.length) {
    const critical = alerts.filter((a) => a.severity === 'critical')
    if (critical.length) {
      parts.push(`Critical alert: ${critical[0].title}.`)
    } else {
      parts.push(`You have ${alerts.length} open alert${alerts.length > 1 ? 's' : ''}. Top one: ${alerts[0].title}.`)
    }
  }

  // Brain watchouts not already covered
  if (brain?.watchouts?.length && parts.length < 2) {
    parts.push(brain.watchouts[0])
  }

  // Opportunities if things look okay
  if (brain?.opportunities?.length && !alerts.some((a) => a.severity === 'critical')) {
    parts.push(`One opportunity worth acting on: ${brain.opportunities[0]}.`)
  }

  // Pending actions
  if (pendingCount > 0) {
    parts.push(`You have ${pendingCount} action${pendingCount > 1 ? 's' : ''} waiting for your approval. Say "list my actions" to go through them.`)
  }

  if (!parts.length) {
    return "I don't have enough data to give you a full picture yet. Try running a health check from your dashboard first, then call back."
  }

  return parts.join(' ')
}
