// GET /api/dept-data?userId=xxx&area=customer-service
// Returns everything needed for a single department page:
// active issues, metric history, and rules with user overrides.

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const CATEGORY_TO_AREA = {
  customer:             'customer-service',
  pipeline:             'marketing-sales',
  'marketing-sales':    'marketing-sales',
  revenue:              'finance-accounting',
  'finance-accounting': 'finance-accounting',
  execution:            'management-strategy',
  goal:                 'management-strategy',
  operations:           'management-strategy',
  'management-strategy':'management-strategy',
}

// All 20 governance rules keyed by area — mirrors THRESHOLD_AREAS in Dashboard.jsx
const AREA_RULES = {
  'customer-service': [
    { ruleId: 'customer-service:first-response-watch', label: 'First response — watch above', unit: 'hrs',  defaultValue: 8,  min: 1,   max: 168, metricKey: 'first_response_time' },
    { ruleId: 'customer-service:first-response-bad',   label: 'First response — bad above',   unit: 'hrs',  defaultValue: 24, min: 1,   max: 168, metricKey: 'first_response_time' },
    { ruleId: 'customer-service:resolution-watch',     label: 'Resolution time — watch above', unit: 'hrs',  defaultValue: 48, min: 1,   max: 336, metricKey: 'resolution_time' },
    { ruleId: 'customer-service:repeat-issue-bad',     label: 'Repeat issue rate — bad above', unit: '%',    defaultValue: 20, min: 0,   max: 100, metricKey: 'repeat_issue_rate' },
    { ruleId: 'customer-service:csat-bad',             label: 'CSAT — bad below',              unit: 'pts',  defaultValue: 80, min: 0,   max: 100, metricKey: 'csat' },
  ],
  'marketing-sales': [
    { ruleId: 'marketing-sales:open-deals-bad',            label: 'Open deals — bad below',         unit: 'deals', defaultValue: 3,  min: 0, max: 999, metricKey: 'open_deals' },
    { ruleId: 'marketing-sales:lead-volume-watch',         label: 'Lead volume — watch below',      unit: 'leads', defaultValue: 10, min: 0, max: 999, metricKey: 'lead_volume' },
    { ruleId: 'marketing-sales:stage-conversion-watch',    label: 'Stage conversion — watch below', unit: '%',     defaultValue: 25, min: 0, max: 100, metricKey: 'stage_conversion' },
    { ruleId: 'marketing-sales:stage-conversion-bad',      label: 'Stage conversion — bad below',   unit: '%',     defaultValue: 15, min: 0, max: 100, metricKey: 'stage_conversion' },
    { ruleId: 'marketing-sales:sales-cycle-watch',         label: 'Sales cycle — watch above',      unit: 'days',  defaultValue: 45, min: 1, max: 365, metricKey: 'sales_cycle_days' },
  ],
  'finance-accounting': [
    { ruleId: 'finance-accounting:churn-watch',   label: 'Churn — watch above',   unit: '%',     defaultValue: 2,  min: 0,  max: 100, metricKey: 'churn_rate' },
    { ruleId: 'finance-accounting:churn-bad',     label: 'Churn — bad above',     unit: '%',     defaultValue: 5,  min: 0,  max: 100, metricKey: 'churn_rate' },
    { ruleId: 'finance-accounting:runway-watch',  label: 'Runway — watch below',  unit: 'mo',    defaultValue: 12, min: 1,  max: 120, metricKey: 'runway_months' },
    { ruleId: 'finance-accounting:runway-bad',    label: 'Runway — bad below',    unit: 'mo',    defaultValue: 6,  min: 1,  max: 120, metricKey: 'runway_months' },
    { ruleId: 'finance-accounting:ltv-cac-watch', label: 'LTV:CAC — watch below', unit: 'ratio', defaultValue: 3,  min: 0,  max: 20,  metricKey: 'ltv_cac_ratio' },
    { ruleId: 'finance-accounting:ltv-cac-bad',   label: 'LTV:CAC — bad below',   unit: 'ratio', defaultValue: 1,  min: 0,  max: 20,  metricKey: 'ltv_cac_ratio' },
  ],
  'management-strategy': [
    { ruleId: 'management-strategy:goal-progress-watch',    label: 'Goal progress — watch below',    unit: '%',    defaultValue: 60, min: 0, max: 100, metricKey: 'goal_progress' },
    { ruleId: 'management-strategy:priority-backlog-bad',   label: 'Priority backlog — bad above',   unit: 'items',defaultValue: 5,  min: 0, max: 50,  metricKey: 'priority_backlog' },
    { ruleId: 'management-strategy:repeated-blockers-watch',label: 'Repeated blockers — watch above',unit: 'count',defaultValue: 2,  min: 0, max: 20,  metricKey: 'repeated_blockers' },
    { ruleId: 'management-strategy:followthrough-watch',    label: 'Follow-through — watch below',   unit: '%',    defaultValue: 80, min: 0, max: 100, metricKey: 'followthrough_rate' },
    { ruleId: 'management-strategy:followthrough-bad',      label: 'Follow-through — bad below',     unit: '%',    defaultValue: 60, min: 0, max: 100, metricKey: 'followthrough_rate' },
  ],
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, area } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!area || !AREA_RULES[area]) return res.status(400).json({ error: 'Invalid area' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  // Categories that map to this area (for filtering risk_alerts)
  const categories = Object.entries(CATEGORY_TO_AREA)
    .filter(([, v]) => v === area)
    .map(([k]) => k)

  const [alertsRes, snapshotsRes, overridesRes, hcRes, customRes] = await Promise.allSettled([
    // Open risk alerts for this area's categories
    sb.from('risk_alerts')
      .select('id, severity, category, title, description, evidence, recommended_action, created_at')
      .eq('user_id', userId)
      .eq('status', 'open')
      .in('category', categories)
      .order('created_at', { ascending: false })
      .limit(20),

    // Metric history for this area — last 60 snapshots (enough for sparklines + 30-day view)
    sb.from('area_metric_snapshots')
      .select('metric_name, value, delta_from_prior, captured_at, source')
      .eq('user_id', userId)
      .eq('area', area)
      .order('captured_at', { ascending: false })
      .limit(120),

    // User overrides for this area's rules
    sb.from('user_rule_overrides')
      .select('rule_id, value, enabled')
      .eq('user_id', userId)
      .like('rule_id', `${area}:%`),

    // Latest stored health check for area status
    sb.from('business_health_checks')
      .select('checked_at, evidence')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single(),

    // User-defined custom metrics for this area
    sb.from('user_custom_metrics')
      .select('id, name, value, unit, created_at')
      .eq('user_id', userId)
      .eq('area_id', area)
      .order('created_at', { ascending: true }),
  ])

  const alerts      = alertsRes.status    === 'fulfilled' ? (alertsRes.value.data    ?? []) : []
  const snapshots   = snapshotsRes.status === 'fulfilled' ? (snapshotsRes.value.data ?? []) : []
  const overrides   = overridesRes.status === 'fulfilled' ? (overridesRes.value.data ?? []) : []
  const hc          = hcRes.status        === 'fulfilled' ? hcRes.value.data               : null
  const customMetrics = customRes.status  === 'fulfilled' ? (customRes.value.data    ?? []) : []

  // Area status from latest health check evidence
  const areaStatuses = hc?.evidence?.governance?.area_statuses ?? []
  const areaStatus   = areaStatuses.find(a => a.area_id === area)?.status ?? 'no-signal'

  // Build metric history map: { [metric_name]: [{value, delta, at}] oldest→newest }
  const reversedSnaps = [...snapshots].reverse()
  const metricHistory = {}
  for (const row of reversedSnaps) {
    if (!metricHistory[row.metric_name]) metricHistory[row.metric_name] = []
    metricHistory[row.metric_name].push({ value: row.value, delta: row.delta_from_prior, at: row.captured_at, source: row.source })
  }

  // Build rules with current value + user override
  const overrideMap = Object.fromEntries(overrides.map(o => [o.rule_id, o.value]))
  const rules = (AREA_RULES[area] || []).map(rule => {
    const history = (metricHistory[rule.metricKey] ?? []).slice(-14)
    const latest  = history.length ? history[history.length - 1] : null
    return {
      ...rule,
      currentValue:  latest?.value  ?? null,
      currentDelta:  latest?.delta  ?? null,
      sparkline:     history.map(h => h.value),
      userValue:     overrideMap[rule.ruleId] ?? null,
      isOverridden:  overrideMap[rule.ruleId] !== undefined,
    }
  })

  // Unique metrics (for history section)
  const metricKeys = [...new Set(rules.map(r => r.metricKey))]
  const metricHistoryForPage = Object.fromEntries(
    metricKeys.map(key => [
      key,
      (metricHistory[key] ?? []).map(h => ({ value: h.value, at: h.at })),
    ])
  )

  return res.status(200).json({
    area,
    status: areaStatus,
    last_checked: hc?.checked_at ?? null,
    issues: alerts.map(a => ({
      id:               a.id,
      severity:         a.severity,
      title:            a.title,
      description:      a.description,
      recommended:      a.recommended_action,
      created_at:       a.created_at,
    })),
    rules,
    custom_metrics: customMetrics,
    metric_history: metricHistoryForPage,
    has_connector_data: snapshots.some(s => s.source === 'hubspot' || s.source === 'stripe'),
  })
}
