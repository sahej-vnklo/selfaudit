// risk-alerts.js — persistence and deduplication for health check risks.
//
// Expected Supabase table:
//
// create table risk_alerts (
//   id                  uuid primary key default gen_random_uuid(),
//   user_id             uuid not null references profiles(id) on delete cascade,
//   health_check_id     uuid references business_health_checks(id) on delete set null,
//   severity            text not null,
//   category            text not null,
//   title               text not null,
//   description         text,
//   evidence            jsonb,
//   recommended_action  text,
//   status              text not null default 'open',
//   notification_sent   boolean not null default false,
//   created_at          timestamptz default now(),
//   resolved_at         timestamptz
// );
// create index on risk_alerts (user_id, status, created_at desc);

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

const ALERT_SEVERITIES = new Set(['medium', 'high', 'critical'])

// Normalise a title for deduplication — strips leading numbers, currency amounts,
// and counts so "3 SQLs ready for close" matches "1 SQL ready for close".
function normaliseTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\d[\d,.]*/g, '#')   // replace numbers/amounts with placeholder
    .replace(/\s+/g, ' ')
    .trim()
}

// Returns open alerts for a user keyed by "category::normalisedTitle"
async function loadOpenAlertIndex(sb, userId) {
  const { data } = await sb
    .from('risk_alerts')
    .select('id, category, title')
    .eq('user_id', userId)
    .eq('status', 'open')

  const index = new Map()
  for (const row of data ?? []) {
    const key = `${row.category}::${normaliseTitle(row.title)}`
    index.set(key, row.id)
  }
  return index
}

// Creates risk alerts from a health check result, skipping duplicates.
// Only medium / high / critical risks are persisted as alerts.
export async function createRiskAlertsFromHealthCheck(userId, healthCheck) {
  if (!userId || !healthCheck) return []

  const sb            = getSupabase()
  const healthCheckId = healthCheck.id ?? null   // present if caller passes the persisted row id

  // Load existing open alerts to deduplicate
  const openIndex = await loadOpenAlertIndex(sb, userId)

  const toInsert = []
  const alertCandidates = [
    ...(healthCheck.risks ?? []),
    ...(healthCheck.governance?.alert_candidates ?? []),
  ]

  for (const risk of alertCandidates) {
    if (!ALERT_SEVERITIES.has(risk.severity)) continue

    const key = `${risk.category}::${normaliseTitle(risk.title)}`
    if (openIndex.has(key)) continue   // already an open alert for this

    toInsert.push({
      user_id:            userId,
      health_check_id:    healthCheckId,
      severity:           risk.severity,
      category:           risk.category,
      title:              risk.title,
      description:        risk.description ?? null,
      evidence:           risk.evidence ? { raw: risk.evidence } : null,
      recommended_action: risk.recommended_action ?? null,
      status:             'open',
      notification_sent:  false,
    })
  }

  if (toInsert.length === 0) return []

  const { data, error } = await sb
    .from('risk_alerts')
    .insert(toInsert)
    .select()

  if (error) {
    console.error('[risk-alerts] insert error:', error.message)
    return []
  }

  return data ?? []
}

// Returns all open alerts for a user, newest first.
export async function getOpenAlerts(userId) {
  if (!userId) return []

  const sb = getSupabase()
  const { data, error } = await sb
    .from('risk_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[risk-alerts] fetch error:', error.message)
    return []
  }

  return data ?? []
}

// Returns unresolved alerts for a user, newest first.
// Includes both open and acknowledged items so the inbox can track work in progress.
export async function getActiveAlerts(userId) {
  if (!userId) return []

  const sb = getSupabase()
  const { data, error } = await sb
    .from('risk_alerts')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['open', 'acknowledged'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[risk-alerts] active fetch error:', error.message)
    return []
  }

  return data ?? []
}

// Updates the status of a single alert owned by userId.
// Allowed transitions: open → acknowledged, open/acknowledged → resolved.
export async function updateAlertStatus(userId, alertId, status) {
  if (!userId || !alertId) throw new Error('userId and alertId required')
  if (!['acknowledged', 'resolved'].includes(status)) {
    throw new Error(`Invalid status "${status}" — must be acknowledged or resolved`)
  }

  const sb = getSupabase()

  const patch = { status }
  if (status === 'resolved') patch.resolved_at = new Date().toISOString()

  const { data, error } = await sb
    .from('risk_alerts')
    .update(patch)
    .eq('id', alertId)
    .eq('user_id', userId)   // ownership guard
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
