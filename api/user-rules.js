import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// All valid rule IDs — used to reject unknown rule IDs on write.
const KNOWN_RULE_IDS = new Set([
  'customer-service:first-response-watch',
  'customer-service:first-response-bad',
  'customer-service:resolution-watch',
  'customer-service:repeat-issue-bad',
  'customer-service:csat-bad',
  'marketing-sales:open-deals-bad',
  'marketing-sales:lead-volume-watch',
  'marketing-sales:stage-conversion-watch',
  'marketing-sales:stage-conversion-bad',
  'marketing-sales:sales-cycle-watch',
  'finance-accounting:churn-watch',
  'finance-accounting:churn-bad',
  'finance-accounting:runway-watch',
  'finance-accounting:runway-bad',
  'finance-accounting:ltv-cac-watch',
  'finance-accounting:ltv-cac-bad',
  'management-strategy:goal-progress-watch',
  'management-strategy:priority-backlog-bad',
  'management-strategy:repeated-blockers-watch',
  'management-strategy:followthrough-watch',
  'management-strategy:followthrough-bad',
])

// Default values shown in the UI when no override is set.
const RULE_DEFAULTS = {
  'customer-service:first-response-watch':     { value: 8,   unit: 'hours',   label: 'First response time — watch' },
  'customer-service:first-response-bad':       { value: 24,  unit: 'hours',   label: 'First response time — bad' },
  'customer-service:resolution-watch':         { value: 48,  unit: 'hours',   label: 'Resolution time — watch' },
  'customer-service:repeat-issue-bad':         { value: 20,  unit: '%',       label: 'Repeat issue rate — bad' },
  'customer-service:csat-bad':                 { value: 80,  unit: 'score',   label: 'CSAT — bad' },
  'marketing-sales:open-deals-bad':            { value: 3,   unit: 'deals',   label: 'Open deals — bad' },
  'marketing-sales:lead-volume-watch':         { value: 10,  unit: 'leads',   label: 'Lead volume — watch' },
  'marketing-sales:stage-conversion-watch':    { value: 25,  unit: '%',       label: 'Stage conversion — watch' },
  'marketing-sales:stage-conversion-bad':      { value: 15,  unit: '%',       label: 'Stage conversion — bad' },
  'marketing-sales:sales-cycle-watch':         { value: 45,  unit: 'days',    label: 'Sales cycle — watch' },
  'finance-accounting:churn-watch':            { value: 2,   unit: '%',       label: 'Churn rate — watch' },
  'finance-accounting:churn-bad':              { value: 5,   unit: '%',       label: 'Churn rate — bad' },
  'finance-accounting:runway-watch':           { value: 12,  unit: 'months',  label: 'Runway — watch' },
  'finance-accounting:runway-bad':             { value: 6,   unit: 'months',  label: 'Runway — bad' },
  'finance-accounting:ltv-cac-watch':          { value: 3,   unit: 'ratio',   label: 'LTV:CAC — watch' },
  'finance-accounting:ltv-cac-bad':            { value: 1,   unit: 'ratio',   label: 'LTV:CAC — bad' },
  'management-strategy:goal-progress-watch':   { value: 60,  unit: '%',       label: 'Goal progress — watch' },
  'management-strategy:priority-backlog-bad':  { value: 5,   unit: 'items',   label: 'Priority backlog — bad' },
  'management-strategy:repeated-blockers-watch': { value: 2, unit: 'count',   label: 'Repeated blockers — watch' },
  'management-strategy:followthrough-watch':   { value: 80,  unit: '%',       label: 'Follow-through — watch' },
  'management-strategy:followthrough-bad':     { value: 60,  unit: '%',       label: 'Follow-through — bad' },
}

export default async function handler(req, res) {
  const { userId } = req.method === 'GET' ? req.query : (req.body || {})

  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  // GET — return all overrides for the user plus defaults for the UI
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_rule_overrides')
      .select('rule_id, area_id, metric_key, value, enabled, updated_at')
      .eq('user_id', userId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({
      overrides: data ?? [],
      defaults: RULE_DEFAULTS,
    })
  }

  // POST — upsert a single override
  if (req.method === 'POST') {
    const { ruleId, areaId, metricKey, value, enabled = true } = req.body || {}

    if (!ruleId || !KNOWN_RULE_IDS.has(ruleId)) {
      return res.status(400).json({ error: 'Unknown rule ID' })
    }
    if (typeof value !== 'number' || !isFinite(value) || value < 0) {
      return res.status(400).json({ error: 'value must be a non-negative finite number' })
    }

    const { data, error } = await supabase
      .from('user_rule_overrides')
      .upsert({
        user_id:    userId,
        rule_id:    ruleId,
        area_id:    areaId || ruleId.split(':')[0],
        metric_key: metricKey || '',
        value,
        enabled:    Boolean(enabled),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,rule_id' })
      .select('rule_id, area_id, metric_key, value, enabled, updated_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ override: data })
  }

  // DELETE — remove an override, restoring the hardcoded default
  if (req.method === 'DELETE') {
    const ruleId = req.query.ruleId || req.body?.ruleId

    if (!ruleId || !KNOWN_RULE_IDS.has(ruleId)) {
      return res.status(400).json({ error: 'Unknown rule ID' })
    }

    const { error } = await supabase
      .from('user_rule_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('rule_id', ruleId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
