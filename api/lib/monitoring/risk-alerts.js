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
import { mapFindingToEscalationTier, tierRank } from './escalation.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

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
    .select('id, category, title, escalation_tier, severity, execution_staged')
    .eq('user_id', userId)
    .eq('status', 'open')

  const index = new Map()
  for (const row of data ?? []) {
    const key = `${row.category}::${normaliseTitle(row.title)}`
    index.set(key, row)
  }
  return index
}

function buildEvidence(risk) {
  const raw = typeof risk.evidence === 'string' ? risk.evidence : null
  const rootCause = risk.rootCause ?? null
  const impact    = risk.impact    ?? null
  if (!raw && !rootCause && !impact) return null
  return { raw, rootCause, impact }
}

function buildAlertPayload(userId, healthCheckId, risk) {
  return {
    user_id: userId,
    health_check_id: healthCheckId,
    severity: risk.severity,
    category: risk.category,
    title: risk.title,
    description: risk.description ?? null,
    evidence: buildEvidence(risk),
    recommended_action: risk.recommended_action ?? null,
    escalation_tier: mapFindingToEscalationTier(risk),
    finding_status: risk.status ?? null,
    metric_key: risk.metricKey ?? null,
    metric_value: risk.metricValue ?? null,
    threshold_value: risk.thresholdValue ?? null,
    comparator: risk.comparator ?? null,
    status: 'open',
    notification_sent: false,
  }
}

// Creates risk alerts from a health check result, skipping duplicates unless the
// incoming alert has escalated above the currently open tier.
export async function createRiskAlertsFromHealthCheck(userId, healthCheck) {
  if (!userId || !healthCheck) return []

  const sb            = getSupabase()
  const healthCheckId = healthCheck.id ?? null   // present if caller passes the persisted row id

  // Load existing open alerts to deduplicate
  const openIndex = await loadOpenAlertIndex(sb, userId)

  const toInsert = []
  const updatedAlerts = []
  const alertCandidates = [
    ...(healthCheck.risks ?? []),
    ...(healthCheck.governance?.alert_candidates ?? []),
  ]

  for (const risk of alertCandidates) {
    const key = `${risk.category}::${normaliseTitle(risk.title)}`
    const payload = buildAlertPayload(userId, healthCheckId, risk)
    const existing = openIndex.get(key)

    if (existing) {
      const existingTier = existing.escalation_tier || mapFindingToEscalationTier(existing)
      if (tierRank(payload.escalation_tier) <= tierRank(existingTier)) continue

      const { data: updated, error: updateError } = await sb
        .from('risk_alerts')
        .update({
          severity:           payload.severity,
          description:        payload.description,
          evidence:           payload.evidence,
          recommended_action: payload.recommended_action,
          escalation_tier:    payload.escalation_tier,
          finding_status:     payload.finding_status,
          metric_key:         payload.metric_key,
          metric_value:       payload.metric_value,
          threshold_value:    payload.threshold_value,
          comparator:         payload.comparator,
          health_check_id:    payload.health_check_id,
          notification_sent:  false,
        })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.warn('[risk-alerts] update error:', updateError.message)
      } else if (updated) {
        updatedAlerts.push(updated)
        openIndex.set(key, updated)
      }
      continue
    }

    toInsert.push(payload)
  }

  if (toInsert.length === 0) return updatedAlerts

  const { data, error } = await sb
    .from('risk_alerts')
    .insert(toInsert)
    .select()

  if (error) {
    console.error('[risk-alerts] insert error:', error.message)
    return updatedAlerts
  }

  return [...updatedAlerts, ...(data ?? [])]
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
