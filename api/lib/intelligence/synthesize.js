import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function normalizeTier(raw) {
  if (raw === 'intelligence') return 'intelligence'
  return 'foundation'
}

export function isIntelligenceTier(raw) {
  return normalizeTier(raw) === 'intelligence'
}

function parseJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(Boolean)
  }
  return []
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))]
}

function stripAssumption(value) {
  return String(value || '').replace(/\[assumption\]/gi, '').trim()
}

function countTop(items, limit = 5) {
  const counts = new Map()
  items.forEach((item) => {
    const key = stripAssumption(item)
    if (!key) return
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value)
}

function bool(value) {
  return !!value
}

function extractFromReports(reports) {
  const headlines = []
  const domains = []
  const blockers = []
  const priorities = []
  const opportunities = []
  const watchouts = []
  const modes = []
  let latestHeadline = ''
  let latestGoal = ''
  let latestGoalScore = null

  reports.forEach((report, index) => {
    const parsed = parseJson(report.content)
    if (!parsed) return

    const mode = parsed.report_family === 'GOAL' || parsed.conversation_mode === 'GOAL_GAP'
      ? 'GOAL_GAP'
      : (parsed.conversation_mode || report.conversation_mode || 'DIAGNOSTIC')

    modes.push(mode)
    if (parsed.headline) {
      headlines.push(parsed.headline)
      if (index === 0) latestHeadline = parsed.headline
    }

    const reportDomains = Array.isArray(parsed.domains) ? parsed.domains : []
    reportDomains.forEach((domain) => {
      if (domain?.name) domains.push(domain.name)
      if (domain?.status === 'critical' && domain?.finding) watchouts.push(`${domain.name}: ${domain.finding}`)
      if (domain?.status === 'needs_work' && domain?.action) watchouts.push(`${domain.name}: ${domain.action}`)
    })

    const nonAiFixes = Array.isArray(parsed.non_ai_fixes) ? parsed.non_ai_fixes : []
    nonAiFixes.forEach((fix) => {
      if (fix?.issue) blockers.push(fix.issue)
    })

    const reportPriorities = Array.isArray(parsed.priority_actions) ? parsed.priority_actions : []
    reportPriorities.forEach((item) => priorities.push(item))

    const aiOpps = Array.isArray(parsed.ai_opportunities) ? parsed.ai_opportunities : []
    aiOpps.forEach((item) => {
      if (item?.area) opportunities.push(item.area)
    })

    if (mode === 'GOAL_GAP') {
      const gap = parsed.goal_gap_analysis || {}
      if (gap.goal && !latestGoal) latestGoal = gap.goal
      const feasibility = String(parsed.timeline_feasibility || '').trim()
      if (feasibility) watchouts.push(feasibility)
      const maybeScore = String(parsed.timeline_feasibility || '').toLowerCase()
      if (maybeScore.startsWith('feasible')) latestGoalScore = 80
      if (maybeScore.startsWith('tight')) latestGoalScore = 50
      if (maybeScore.startsWith('unrealistic')) latestGoalScore = 20
      asArray(parsed.missing_capabilities).forEach(item => blockers.push(item))
    }
  })

  return {
    topHeadlines: uniq(headlines).slice(0, 6),
    domainsAudited: uniq(domains),
    repeatedBlockers: countTop(blockers, 6),
    rawBlockers: blockers,
    topPriorities: uniq(priorities).slice(0, 6),
    opportunities: uniq(opportunities).slice(0, 6),
    watchouts: uniq(watchouts).slice(0, 6),
    modesSeen: uniq(modes),
    latestHeadline,
    latestGoal,
    latestGoalScore,
  }
}

function extractFromMemory(memoryRows) {
  const rootCauses = []
  const priorities = []
  const domains = []
  const openLoops = []

  memoryRows.forEach((row) => {
    asArray(row.root_causes).forEach(item => rootCauses.push(item))
    asArray(row.priority_actions).forEach(item => priorities.push(item))
    asArray(row.domains_audited).forEach(item => domains.push(item))
    if (row.status === 'open' && row.headline) openLoops.push(row.headline)
  })

  return {
    repeatedBlockers: countTop(rootCauses, 6),
    rawRootCauses: rootCauses,
    topPriorities: uniq(priorities).slice(0, 6),
    domainsAudited: uniq(domains),
    openLoops: uniq(openLoops).slice(0, 6),
  }
}

function extractConnectorState(profile, syncLogs, connectorSnapshot = null) {
  const integrations = profile?.integrations || {}
  const connectedProviders = Object.entries(integrations)
    .filter(([, value]) => bool(value?.access_token))
    .map(([key]) => key)

  const latestLog = Array.isArray(syncLogs) && syncLogs.length > 0 ? syncLogs[0] : null

  // If a connector_snapshots row exists, use it as the authoritative source for
  // whether live data has been fetched and when — more reliable than sync_logs metadata
  const snapshotProviders = connectorSnapshot?.providers ?? []
  const hasSnapshotData   = snapshotProviders.length > 0
  const latestSync        = connectorSnapshot?.fetched_at || latestLog?.synced_at || null

  return {
    connectedProviders: hasSnapshotData ? snapshotProviders : connectedProviders,
    hasLiveConnectors: hasSnapshotData || connectedProviders.length > 0,
    latestConnectorSync: latestSync,
    recentConnectorSignals: latestLog
      ? [`${latestLog.provider} sync ${latestLog.status}${latestLog.records_fetched ? ` (${latestLog.records_fetched} records)` : ''}`]
      : [],
  }
}

function confidenceFromSources({ reports, hasBrief, hasConnectors, blockerCount, goalScore }) {
  let score = 0
  if (reports >= 3) score += 2
  else if (reports >= 1) score += 1
  if (hasBrief) score += 2
  if (hasConnectors) score += 2
  if (blockerCount >= 2) score += 1
  if (typeof goalScore === 'number' && goalScore > 0) score += 1

  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

function buildSummary({
  businessState,
  topHeadlines,
  repeatedBlockers,
  topPriorities,
  activeGoal,
  targetCustomer,
  connectedProviders,
}) {
  const parts = []
  if (businessState?.core_offer) parts.push(stripAssumption(businessState.core_offer))
  if (targetCustomer) parts.push(`serving ${stripAssumption(targetCustomer)}`)
  if (activeGoal) parts.push(`working toward ${stripAssumption(activeGoal)}`)
  if (repeatedBlockers[0]) parts.push(`still blocked most by ${repeatedBlockers[0].toLowerCase()}`)
  if (topPriorities[0]) parts.push(`next best move is ${topPriorities[0].toLowerCase()}`)
  if (topHeadlines[0]) parts.push(`latest finding: ${topHeadlines[0]}`)
  if (connectedProviders.length > 0) parts.push(`connector visibility live via ${connectedProviders.join(', ')}`)
  return parts.join('. ')
}

function deriveChanges(previous, next) {
  if (!previous) return []
  const changes = []
  if ((previous.active_goal || '') !== (next.active_goal || '')) {
    changes.push(`Active goal changed to ${next.active_goal || 'none set'}`)
  }
  if ((previous.goal_score ?? 0) !== (next.goal_score ?? 0)) {
    changes.push(`Goal score moved from ${previous.goal_score ?? 0} to ${next.goal_score ?? 0}`)
  }
  if ((previous.top_headlines?.[0] || '') !== (next.top_headlines?.[0] || '')) {
    changes.push(`New top finding: ${next.top_headlines?.[0] || 'none'}`)
  }
  const previousFocus = JSON.stringify(previous.focus_areas || [])
  const nextFocus = JSON.stringify(next.focus_areas || [])
  if (previousFocus !== nextFocus) {
    changes.push('Focus areas shifted')
  }
  return changes.slice(0, 5)
}

function defaultNotificationPreferences(userId) {
  return {
    user_id: userId,
    enabled: true,
    frequency: 'daily',
    channels: ['in_app'],
    areas: ['goal_progress', 'pipeline_revenue', 'execution', 'customer_health', 'critical_risks'],
    updated_at: new Date().toISOString(),
  }
}

export async function synthesizeUserIntelligence(userId, options = {}) {
  const supabase = options.supabase || getSupabase()
  if (!userId) return { skipped: true, reason: 'missing_user_id' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, tier, industry, domain, integrations')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error(profileError?.message || 'Profile not found')
  }

  if (!isIntelligenceTier(profile.tier)) {
    return { skipped: true, reason: 'not_intelligence_tier' }
  }

  const [
    reportsResult,
    memoryResult,
    businessStateResult,
    briefResult,
    syncLogsResult,
    previousProfileResult,
    existingPrefsResult,
    connectorSnapshotResult,
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('id, content, conversation_mode, created_at, title')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('user_memory')
      .select('headline, root_causes, priority_actions, domains_audited, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('business_state')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('intelligence_brief')
      .select('financial, operational, context, completion_pct, updated_at, doc_paths')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('connector_sync_logs')
      .select('provider, status, records_fetched, synced_at')
      .eq('user_id', userId)
      .order('synced_at', { ascending: false })
      .limit(5),
    supabase
      .from('intelligence_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('intelligence_notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('connector_snapshots')
      .select('providers, fetched_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (reportsResult.error)         console.warn('[synthesize] reports fetch error:', reportsResult.error.message)
  if (memoryResult.error)          console.warn('[synthesize] memory fetch error:', memoryResult.error.message)
  if (businessStateResult.error)   console.warn('[synthesize] business_state fetch error:', businessStateResult.error.message)
  if (briefResult.error)           console.warn('[synthesize] brief fetch error:', briefResult.error.message)
  if (syncLogsResult.error)        console.warn('[synthesize] sync_logs fetch error:', syncLogsResult.error.message)

  const reports         = reportsResult.data         ?? []
  const memoryRows      = memoryResult.data          ?? []
  const businessState   = businessStateResult.data   ?? null
  const intelligenceBrief = briefResult.data         ?? null
  const syncLogs        = syncLogsResult.data        ?? []
  const previousProfile = previousProfileResult.data ?? null
  const existingPrefs   = existingPrefsResult.data   ?? null
  const connectorSnapshot = connectorSnapshotResult.data ?? null

  const reportData = extractFromReports(reports)
  const memoryData = extractFromMemory(memoryRows)
  const connectorData = extractConnectorState(profile, syncLogs, connectorSnapshot)
  const combinedDomains = uniq([...reportData.domainsAudited, ...memoryData.domainsAudited]).slice(0, 12)
  // Use raw arrays so countTop sees true frequencies — merging the already-summarised
  // repeatedBlockers arrays would discard frequency data and double-count items
  const combinedBlockers = countTop([...reportData.rawBlockers, ...memoryData.rawRootCauses, ...asArray(businessState?.operational_blockers)], 8)
  const combinedPriorities = uniq([...reportData.topPriorities, ...memoryData.topPriorities]).slice(0, 8)
  const activeGoal = businessState?.active_goal || reportData.latestGoal || ''
  const goalScore = typeof businessState?.goal_score === 'number'
    ? businessState.goal_score
    : (reportData.latestGoalScore ?? 0)
  const focusAreas = uniq([
    ...(profile.domain ? [profile.domain] : []),
    ...combinedDomains,
    ...(activeGoal ? ['Goal Progress'] : []),
    ...(connectorData.hasLiveConnectors ? ['Connectors'] : []),
  ]).slice(0, 8)
  const watchouts = uniq([
    ...reportData.watchouts,
    ...memoryData.openLoops.map(item => `Open loop: ${item}`),
  ]).slice(0, 8)

  const confidence = confidenceFromSources({
    reports: reports.length,
    hasBrief: !!intelligenceBrief,
    hasConnectors: connectorData.hasLiveConnectors,
    blockerCount: combinedBlockers.length,
    goalScore,
  })

  const nextProfile = {
    user_id: userId,
    summary: buildSummary({
      businessState,
      topHeadlines: reportData.topHeadlines,
      repeatedBlockers: combinedBlockers,
      topPriorities: combinedPriorities,
      activeGoal,
      targetCustomer: businessState?.target_customer,
      connectedProviders: connectorData.connectedProviders,
    }),
    active_goal: activeGoal || null,
    goal_score: goalScore || 0,
    confidence,
    top_headlines: reportData.topHeadlines,
    focus_areas: focusAreas,
    domains_audited: combinedDomains,
    repeated_blockers: combinedBlockers,
    top_priorities: combinedPriorities,
    watchouts: watchouts,
    opportunities: reportData.opportunities,
    changes_since_last: [],
    has_verified_brief: !!intelligenceBrief,
    has_live_connectors: connectorData.hasLiveConnectors,
    latest_connector_sync: connectorData.latestConnectorSync,
    source_counts: {
      reports: reports.length,
      memory_entries: memoryRows.length,
      connected_providers: connectorData.connectedProviders.length,
      intelligence_docs: Array.isArray(intelligenceBrief?.doc_paths) ? intelligenceBrief.doc_paths.length : 0,
    },
    synthesized_profile: {
      business_state: businessState || null,
      top_headlines: reportData.topHeadlines,
      focus_areas: focusAreas,
      domains_audited: combinedDomains,
      repeated_blockers: combinedBlockers,
      top_priorities: combinedPriorities,
      opportunities: reportData.opportunities,
      watchouts,
      confidence,
      connector_state: connectorData,
      reports_analyzed: reports.map(report => ({ id: report.id, created_at: report.created_at, title: report.title })),
      memory_context: memoryRows,
      intelligence_brief: intelligenceBrief,
    },
    last_synthesized_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  nextProfile.changes_since_last = deriveChanges(previousProfile, nextProfile)

  const { error: upsertError } = await supabase
    .from('intelligence_profiles')
    .upsert(nextProfile, { onConflict: 'user_id' })

  if (upsertError) throw new Error(upsertError.message)

  if (!existingPrefs) {
    await supabase
      .from('intelligence_notification_preferences')
      .upsert(defaultNotificationPreferences(userId), { onConflict: 'user_id' })
  }

  return {
    success: true,
    userId,
    reportsAnalyzed: reports.length,
    confidence,
    focusAreas,
    watchouts,
  }
}

export async function synthesizeEligibleUsers(options = {}) {
  const supabase = options.supabase || getSupabase()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, tier')

  if (error) throw new Error(error.message)

  const eligible = (profiles || []).filter(profile => isIntelligenceTier(profile.tier))
  const results = []

  for (const profile of eligible) {
    try {
      const result = await synthesizeUserIntelligence(profile.id, { supabase })
      results.push({ userId: profile.id, ...result })
    } catch (err) {
      results.push({ userId: profile.id, success: false, error: err.message })
    }
  }

  return {
    processed: eligible.length,
    successful: results.filter(item => item.success).length,
    failed: results.filter(item => item.success === false).length,
    results,
  }
}
