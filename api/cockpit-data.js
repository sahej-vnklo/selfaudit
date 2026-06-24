// GET /api/cockpit-data?userId=xxx
// Read-only — surfaces stored health check + metric data for the Cockpit view.
// Never triggers a new health check run.

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { getIndustry, getArea } from './lib/blueprint/catalog/index.js'
import { getCommChannelProviders } from './lib/connectors/registry.js'
import { getComposioConnectionMap } from './lib/connectors/composio.js'

const AREA_META = {
  'customer-service':     { name: 'Support',        role: 'Head of Customer Support',  key_metric: 'first_response_time', metric_label: 'Avg. Response Time', unit: 'h' },
  'marketing-sales':      { name: 'Sales & Mktg',   role: 'Head of Growth',            key_metric: 'open_deals',           metric_label: 'Open Deals',         unit: ''  },
  'finance-accounting':   { name: 'Finance',         role: 'Chief Financial Officer',   key_metric: 'runway_months',        metric_label: 'Cash Runway',        unit: 'mo' },
  'management-strategy':  { name: 'Strategy & Ops', role: 'Chief Operating Officer',   key_metric: 'goal_progress',        metric_label: 'Goal Progress',      unit: '%' },
}

// Map health check risk categories → area ids
const CATEGORY_TO_AREA = {
  pipeline:   'marketing-sales',
  revenue:    'finance-accounting',
  customer:   'customer-service',
  execution:  'management-strategy',
  goal:       'management-strategy',
  operations: 'management-strategy',
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function statusLabel(s) {
  if (s === 'bad')       return 'Concerned'
  if (s === 'watch')     return 'Watch'
  if (s === 'good')      return 'Stable'
  return 'No signal'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = req.query.userId
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  const [hcRes, snapshotsRes, alertsRes, profileRes, briefRes, stateRes, overridesRes, schemaRes, metricsCountRes, connSnapRes, commPrefsRes] = await Promise.allSettled([
    // Latest stored health check
    sb.from('business_health_checks')
      .select('checked_at, health_score, risks, recommended_actions, summary, evidence')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single(),

    // Last 56 metric snapshots (up to 7 per area × 4 areas × 2 metrics) for sparklines
    sb.from('area_metric_snapshots')
      .select('area, metric_name, value, delta_from_prior, captured_at')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
      .limit(200),

    // Open risk alerts for per-area top issues
    sb.from('risk_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50),

    // Intelligence profile for cross-dept insight + opportunities + probing queue
    sb.from('intelligence_profiles')
      .select('summary, top_priorities, watchouts, opportunities, repeated_blockers, last_synthesized_at, confidence_level, synthesized_profile')
      .eq('user_id', userId)
      .single(),

    // Intelligence brief for at-a-glance metrics
    sb.from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .single(),

    // Business state for user name context
    sb.from('business_state')
      .select('active_goal, goal_score')
      .eq('user_id', userId)
      .single(),

    // User rule overrides — to know which areas are calibrated
    sb.from('user_rule_overrides')
      .select('rule_id')
      .eq('user_id', userId),

    // Company schema — for company name and selected areas
    sb.from('company_schemas')
      .select('schema')
      .eq('user_id', userId)
      .single(),

    // Metrics count — to know if user has configured their Logic
    sb.from('user_custom_metrics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),

    // Connector snapshot — to know which integrations are active (for comm channel list)
    sb.from('connector_snapshots')
      .select('providers')
      .eq('user_id', userId)
      .single(),

    // Saved communication preferences
    sb.from('user_connector_prefs')
      .select('channel_type, params')
      .eq('user_id', userId),
  ])

  const hc           = hcRes.status        === 'fulfilled' ? hcRes.value.data            : null
  const snapshots = snapshotsRes.status === 'fulfilled' ? (snapshotsRes.value.data ?? []) : []
  const alerts    = alertsRes.status    === 'fulfilled' ? (alertsRes.value.data ?? [])    : []
  const intelRaw  = profileRes.status   === 'fulfilled' ? profileRes.value.data           : null
  const intel     = intelRaw
  const brief     = briefRes.status     === 'fulfilled' ? briefRes.value.data              : null
  const state     = stateRes.status     === 'fulfilled' ? stateRes.value.data              : null
  const overrideRows      = overridesRes.status    === 'fulfilled' ? (overridesRes.value.data ?? []) : []
  const metricsCount      = metricsCountRes.status === 'fulfilled' ? (metricsCountRes.value.count ?? 0) : 0
  const connProviders     = connSnapRes.status     === 'fulfilled' ? (connSnapRes.value.data?.providers ?? []) : []
  const savedPrefs        = commPrefsRes.status    === 'fulfilled' ? (commPrefsRes.value.data ?? []) : []

  // Live Composio connection check — connector_snapshots is only populated by cron,
  // so we check Composio directly to detect freshly-connected tools.
  let liveConnectionCount = 0
  try {
    const connectionMap = await getComposioConnectionMap(userId)
    liveConnectionCount = Object.values(connectionMap || {}).filter(c => c.connected).length
  } catch { /* non-fatal — fall back to snapshot providers */ }

  // Communication channels — email is always available; Slack/Gmail show if connected
  const COMM_CONNECTORS = getCommChannelProviders()
  const savedPrefMap = Object.fromEntries(savedPrefs.map(p => [p.channel_type, p.params]))
  const commChannels = [
    { type: 'email', label: 'Account Email', params: savedPrefMap['email'] ?? null },
    ...COMM_CONNECTORS
      .filter(c => connProviders.includes(c))
      .map(c => ({ type: c, label: c === 'slack' ? 'Slack' : 'Gmail', params: savedPrefMap[c] ?? null })),
  ]
  const savedCommPref = savedPrefs.length > 0
    ? savedPrefs.sort((a, b) => (b.updated_at ?? '') > (a.updated_at ?? '') ? 1 : -1)[0]
    : null

  // Per-area calibration status — count overrides per area prefix
  const AREA_IDS = ['customer-service', 'marketing-sales', 'finance-accounting', 'management-strategy']
  const overrideCountByArea = Object.fromEntries(AREA_IDS.map(id => [id, 0]))
  for (const row of overrideRows) {
    const areaId = AREA_IDS.find(id => row.rule_id.startsWith(id + ':'))
    if (areaId) overrideCountByArea[areaId]++
  }
  const calibration = AREA_IDS.map(id => ({
    id:           id,
    overrides:    overrideCountByArea[id],
    customised:   overrideCountByArea[id] > 0,
  }))

  // ── Build sparklines and latest metric per area ───────────────────────────
  // Group snapshots: { [area]: { [metric_name]: [values oldest→newest] } }
  const metricHistory = {}
  // snapshots are desc by captured_at — reverse to get oldest→newest per metric
  const reversedSnaps = [...snapshots].reverse()
  for (const row of reversedSnaps) {
    if (!metricHistory[row.area]) metricHistory[row.area] = {}
    if (!metricHistory[row.area][row.metric_name]) metricHistory[row.area][row.metric_name] = []
    metricHistory[row.area][row.metric_name].push({ value: row.value, delta: row.delta_from_prior, at: row.captured_at })
  }

  function getMetric(areaId, metricName) {
    const history = metricHistory[areaId]?.[metricName] ?? []
    if (!history.length) return null
    const latest = history[history.length - 1]
    const sparkline = history.slice(-7).map(h => h.value)
    return { value: latest.value, delta: latest.delta, sparkline }
  }

  // ── At-a-glance metrics from brief + snapshots ────────────────────────────
  const f = brief?.financial || {}
  const ctx = brief?.context || {}
  const op = brief?.operational || {}

  const atAGlance = []

  const churnVal = f.churn != null ? Number(f.churn) : getMetric('finance-accounting', 'churn_rate')?.value ?? null
  const churnDelta = getMetric('finance-accounting', 'churn_rate')?.delta ?? null
  if (churnVal != null) atAGlance.push({ label: 'Churn', value: `${churnVal}%`, delta: churnDelta, trend: churnDelta > 0 ? 'up-bad' : churnDelta < 0 ? 'down-good' : 'flat', sparkline: getMetric('finance-accounting', 'churn_rate')?.sparkline ?? [] })

  const mrrVal = f.mrr != null ? Number(f.mrr) : null
  if (mrrVal != null) atAGlance.push({ label: 'MRR', value: `$${mrrVal.toLocaleString()}`, delta: null, trend: 'flat', sparkline: [] })

  const runwayVal = ctx.runway != null ? Number(ctx.runway) : getMetric('finance-accounting', 'runway_months')?.value ?? null
  const runwayDelta = getMetric('finance-accounting', 'runway_months')?.delta ?? null
  if (runwayVal != null) atAGlance.push({ label: 'Runway', value: `${runwayVal} mo`, delta: runwayDelta, trend: runwayDelta != null ? (runwayDelta < 0 ? 'down-bad' : 'up-good') : 'flat', sparkline: getMetric('finance-accounting', 'runway_months')?.sparkline ?? [] })

  const csatVal = op.nps != null ? Number(op.nps) : getMetric('customer-service', 'csat')?.value ?? null
  const csatDelta = getMetric('customer-service', 'csat')?.delta ?? null
  if (csatVal != null) atAGlance.push({ label: 'CSAT / NPS', value: String(csatVal), delta: csatDelta, trend: csatDelta != null ? (csatDelta < 0 ? 'down-bad' : 'up-good') : 'flat', sparkline: getMetric('customer-service', 'csat')?.sparkline ?? [] })

  // ── Area statuses from stored evidence ───────────────────────────────────
  const areaStatuses = hc?.evidence?.governance?.area_statuses ?? []
  const statusByArea = Object.fromEntries(areaStatuses.map(a => [a.area_id, a.status]))

  // ── Company identity + dynamic area list from schema ─────────────────────
  const schemaData    = schemaRes.status === 'fulfilled' ? schemaRes.value.data?.schema : null
  const companyName   = schemaData?.customBusinessName || getIndustry(schemaData?.industryId)?.label || null

  // If the schema has no areas (old schema saved before area selection was wired in),
  // fall back to the industry's default area list from the catalog.
  const rawAreas = Array.isArray(schemaData?.areas) && schemaData.areas.length > 0
    ? schemaData.areas
    : (getIndustry(schemaData?.industryId)?.defaultAreas ?? []).map(id => getArea(id)).filter(Boolean)
  const selectedAreas = rawAreas.map((a) => ({ id: a.id, label: a.label, status: statusByArea[a.id] ?? 'no-signal' }))

  // ── Strategic priorities — cluster actionable alerts into max 3 themes ───
  function buildStrategicPriorities(rawAlerts) {
    const THEME_MAP = {
      'finance-accounting':  'finance',
      'revenue':             'finance',
      'marketing-sales':     'growth',
      'pipeline':            'growth',
      'customer':            'customer',
      'customer-service':    'customer',
      'execution':           'execution',
      'management-strategy': 'execution',
      'goal':                'execution',
      'operations':          'execution',
      'product':             'product',
      'product-engineering': 'product',
    }
    const THEME_LABELS = {
      finance:   'Finance & Runway',
      growth:    'Pipeline & Growth',
      customer:  'Customer & Support',
      execution: 'Execution & Strategy',
      product:   'Product & Engineering',
    }
    const SEV_RANK  = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }
    const TIER_RANK = { critical: 5, alert: 4, escalate: 3, flag: 2, watch: 1 }
    const ACTIONABLE = new Set(['critical', 'alert', 'escalate'])

    const actionable = rawAlerts.filter(a => ACTIONABLE.has(a.escalation_tier))

    const byTheme = new Map()
    for (const alert of actionable) {
      const theme = THEME_MAP[alert.category] || 'other'
      if (!byTheme.has(theme)) byTheme.set(theme, [])
      byTheme.get(theme).push(alert)
    }

    const themes = []
    for (const [theme, themeAlerts] of byTheme) {
      const lead = themeAlerts.reduce((best, a) => {
        const aScore = (TIER_RANK[a.escalation_tier] || 0) * 10 + (SEV_RANK[a.severity] || 0)
        const bScore = (TIER_RANK[best.escalation_tier] || 0) * 10 + (SEV_RANK[best.severity] || 0)
        return aScore > bScore ? a : best
      })
      themes.push({
        theme,
        theme_label: THEME_LABELS[theme] || theme,
        lead,
        covered_count: themeAlerts.length,
        covered_titles: themeAlerts.filter(a => a.id !== lead.id).map(a => a.title),
      })
    }

    themes.sort((a, b) => {
      const aScore = (TIER_RANK[a.lead.escalation_tier] || 0) * 10 + (SEV_RANK[a.lead.severity] || 0)
      const bScore = (TIER_RANK[b.lead.escalation_tier] || 0) * 10 + (SEV_RANK[b.lead.severity] || 0)
      return bScore - aScore
    })

    return themes.slice(0, 3)
  }

  const strategicPriorities = buildStrategicPriorities(alerts)

  // ── Per-area top issues from risk_alerts ──────────────────────────────────
  const issuesByArea = {}
  for (const alert of alerts) {
    const areaId = CATEGORY_TO_AREA[alert.category] || null
    if (!areaId) continue
    if (!issuesByArea[areaId]) {
      issuesByArea[areaId] = { title: alert.title, sub: alert.description, action: alert.recommended_action, severity: alert.severity }
    }
  }

  // ── Build department cards ────────────────────────────────────────────────
  const departments = Object.entries(AREA_META).map(([areaId, meta]) => {
    const status     = statusByArea[areaId] ?? 'no-signal'
    const topIssue   = issuesByArea[areaId] ?? null
    const keyMetric  = getMetric(areaId, meta.key_metric)

    return {
      id:            areaId,
      name:          meta.name,
      role:          meta.role,
      status,
      status_label:  statusLabel(status),
      top_issue:     topIssue ? { title: topIssue.title, sub: topIssue.sub?.slice(0, 100) ?? '' } : null,
      key_metric:    keyMetric ? {
        label:    meta.metric_label,
        value:    keyMetric.value,
        unit:     meta.unit,
        delta:    keyMetric.delta,
        sparkline: keyMetric.sparkline,
      } : null,
      latest_insight: topIssue?.sub ?? null,
    }
  })

  // ── CoS priorities from stored risks ─────────────────────────────────────
  const risks = Array.isArray(hc?.risks) ? hc.risks : []
  const priorities = risks.slice(0, 5).map(r => ({
    title:    r.title,
    severity: r.severity,
    impact:   r.evidence || null,
    action:   r.recommended_action || null,
  }))

  // ── Recommended move — first recommended action with context ──────────────
  const actions = Array.isArray(hc?.recommended_actions) ? hc.recommended_actions : []
  const recommendedMove = actions.length > 0 ? {
    action:  actions[0],
    extras:  actions.slice(1, 4),
  } : null

  // ── Cross-dept insight ────────────────────────────────────────────────────
  const crossDeptInsight = hc?.evidence?.governance?.advice_summary
    || intel?.summary
    || null

  // Probing queue — blind areas the system hasn't seen data for yet
  const rawProbingQueue  = intel?.synthesized_profile?.probing_queue ?? []
  const dismissedAreas   = new Set(schemaData?.dismissedBlindAreas ?? [])
  const probing_queue    = rawProbingQueue.filter(p => !dismissedAreas.has(p.areaId))

  return res.status(200).json({
    company_name:         companyName,
    selected_areas:       selectedAreas,
    alerts:               alerts,
    strategic_priorities: strategicPriorities,
    last_checked:       hc?.checked_at ?? null,
    health_score:       hc?.health_score ?? null,
    confidence:         intel?.confidence_level ?? null,
    cos: {
      priorities,
      recommended_move: recommendedMove,
      at_a_glance:      atAGlance,
    },
    departments,
    cross_dept_insight: crossDeptInsight,
    opportunities:      Array.isArray(intel?.opportunities) ? intel.opportunities.slice(0, 3) : [],
    active_goal:          state?.active_goal ?? null,
    goal_score:           state?.goal_score ?? null,
    calibration,
    metrics_configured:   metricsCount > 0,
    has_connectors:       liveConnectionCount > 0 || connProviders.length > 0,
    has_data:             !!hc,
    comm_channels:        commChannels,
    saved_comm_pref:      savedCommPref,
    probing_queue,
  })
}
