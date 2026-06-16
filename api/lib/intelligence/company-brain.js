import { createClient } from '@supabase/supabase-js'
import { getActiveGoal } from '../goals/service.js'
import { getCompanyDNASummary } from './company-dna.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Fields that live in each table — used to route upsert patches correctly
const BUSINESS_STATE_FIELDS = new Set([
  'core_offer', 'target_customer', 'revenue_streams', 'pricing_structure',
  'funnel_stages', 'conversion_bottlenecks', 'operational_blockers',
  'current_constraints', 'active_goal', 'goal_timeline', 'goal_baseline',
  'goal_score', 'goal_score_delta', 'last_audit_headline',
  'assumptions_unverified', 'team_ownership', 'retention_signals',
])

const INTELLIGENCE_PROFILE_FIELDS = new Set([
  'summary', 'confidence', 'top_headlines', 'focus_areas', 'domains_audited',
  'repeated_blockers', 'top_priorities', 'watchouts', 'opportunities',
  'changes_since_last', 'has_verified_brief', 'has_live_connectors',
  'source_counts', 'synthesized_profile',
])

// Safe merge: never overwrite a non-empty value with null/empty.
// Arrays are unioned and deduplicated. Objects are shallow-merged.
export function mergeCompanyBrain(existing, patch) {
  const merged = { ...existing }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) continue

    const current = merged[key]

    if (Array.isArray(value)) {
      const base = Array.isArray(current) ? current : []
      merged[key] = [...new Set([...base, ...value].filter(Boolean))]
    } else if (typeof value === 'object') {
      merged[key] = { ...(current && typeof current === 'object' ? current : {}), ...value }
    } else if (typeof value === 'string') {
      if (value.trim() !== '') merged[key] = value
    } else {
      merged[key] = value
    }
  }

  return merged
}

// Fetch a unified company brain for a user from all relevant tables.
// Returns a single flat object — callers don't need to know which table data came from.
export async function getCompanyBrain(userId, supabase = null) {
  if (!userId) return null

  const sb = supabase || getSupabase()

  const [profileRes, stateRes, intelRes, memoryRes] = await Promise.allSettled([
    sb.from('profiles')
      .select('industry, domain, tier')
      .eq('id', userId)
      .single(),

    sb.from('business_state')
      .select('*')
      .eq('user_id', userId)
      .single(),

    sb.from('intelligence_profiles')
      .select('summary, confidence, top_headlines, focus_areas, domains_audited, repeated_blockers, top_priorities, watchouts, opportunities, changes_since_last, synthesized_profile, last_synthesized_at')
      .eq('user_id', userId)
      .single(),

    sb.from('user_memory')
      .select('headline, core_problem, root_causes, priority_actions, ai_opportunities, domains_audited, status, session_date, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const profile  = profileRes.status === 'fulfilled' ? profileRes.value.data        : null
  const state    = stateRes.status   === 'fulfilled' ? stateRes.value.data          : null
  const intel    = intelRes.status   === 'fulfilled' ? intelRes.value.data          : null
  const sessions = memoryRes.status  === 'fulfilled' ? (memoryRes.value.data ?? []) : []
  const activeGoal = await getActiveGoal(sb, userId).catch(() => null)
  let companyDNA = { status: 'insufficient_data', patterns: [], formatted: null }
  try {
    companyDNA = await getCompanyDNASummary(sb, userId)
  } catch {
    companyDNA = { status: 'insufficient_data', patterns: [], formatted: null }
  }

  return {
    // Identity
    industry:              profile?.industry               ?? null,
    domain:                profile?.domain                 ?? null,
    tier:                  profile?.tier                   ?? null,

    // Business model (business_state)
    core_offer:            state?.core_offer               ?? null,
    target_customer:       state?.target_customer          ?? null,
    revenue_streams:       state?.revenue_streams          ?? [],
    pricing_structure:     state?.pricing_structure        ?? null,
    funnel_stages:         state?.funnel_stages            ?? [],
    conversion_bottlenecks: state?.conversion_bottlenecks ?? [],
    operational_blockers:  state?.operational_blockers     ?? [],
    current_constraints:   state?.current_constraints      ?? [],
    active_goal_id:        activeGoal?.id                  ?? null,
    active_goal:           activeGoal?.title               ?? state?.active_goal ?? null,
    goal_timeline:         state?.goal_timeline            ?? null,
    goal_baseline:         state?.goal_baseline            ?? null,
    goal_score:            activeGoal?.progress            ?? state?.goal_score ?? 0,
    goal_health_score:     activeGoal?.health_score        ?? null,
    goal_deadline:         activeGoal?.deadline            ?? null,
    goal_metric_key:       activeGoal?.metric_key          ?? null,
    goal_area_id:          activeGoal?.area_id             ?? null,
    last_audit_headline:   state?.last_audit_headline      ?? null,
    assumptions_unverified: state?.assumptions_unverified  ?? [],
    team_ownership:        state?.team_ownership           ?? null,
    retention_signals:     state?.retention_signals        ?? [],

    // Synthesised intelligence (intelligence_profiles)
    intelligence_summary:  intel?.summary                  ?? null,
    confidence:            intel?.confidence               ?? null,
    top_headlines:         intel?.top_headlines            ?? [],
    focus_areas:           intel?.focus_areas              ?? [],
    domains_audited:       intel?.domains_audited          ?? [],
    repeated_blockers:     intel?.repeated_blockers        ?? [],
    top_priorities:        intel?.top_priorities           ?? [],
    watchouts:             intel?.watchouts                ?? [],
    opportunities:         intel?.opportunities            ?? [],
    synthesized_profile:   intel?.synthesized_profile      ?? null,
    last_synthesized_at:   intel?.last_synthesized_at      ?? null,
    company_dna_status:    companyDNA.status,
    company_dna_patterns:  companyDNA.patterns,
    company_dna_formatted: companyDNA.formatted,

    // Latest session memory
    last_session: sessions.length > 0 ? {
      headline:         sessions[0].headline,
      core_problem:     sessions[0].core_problem,
      root_causes:      sessions[0].root_causes,
      priority_actions: sessions[0].priority_actions,
      ai_opportunities: sessions[0].ai_opportunities,
      domains_audited:  sessions[0].domains_audited,
      status:           sessions[0].status,
      session_date:     sessions[0].session_date,
    } : null,

    // All recent sessions for pattern detection
    recent_sessions: sessions,
  }
}

// Persist a patch to the right tables. Merges safely — never blanks out existing data.
export async function upsertCompanyBrain(userId, patch) {
  if (!userId || !patch || typeof patch !== 'object') return

  const sb = getSupabase()
  const statePatch = {}
  const intelPatch = {}

  for (const [key, value] of Object.entries(patch)) {
    if (BUSINESS_STATE_FIELDS.has(key)) {
      statePatch[key] = value
    } else if (INTELLIGENCE_PROFILE_FIELDS.has(key)) {
      intelPatch[key] = value
    }
  }

  const ops = []

  if (Object.keys(statePatch).length > 0) {
    ops.push(
      sb.from('business_state')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data: existing }) => {
          const merged = mergeCompanyBrain(existing || {}, statePatch)
          delete merged.id
          delete merged.user_id
          delete merged.updated_at
          return sb.from('business_state').upsert(
            { ...merged, user_id: userId, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
        })
    )
  }

  if (Object.keys(intelPatch).length > 0) {
    ops.push(
      sb.from('intelligence_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data: existing }) => {
          const merged = mergeCompanyBrain(existing || {}, intelPatch)
          delete merged.id
          delete merged.user_id
          delete merged.created_at
          return sb.from('intelligence_profiles').upsert(
            { ...merged, user_id: userId, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
        })
    )
  }

  const results = await Promise.allSettled(ops)
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message)
  if (errors.length > 0) {
    console.error('[company-brain] upsert errors:', errors)
  }
}

// Detect recurring patterns across multiple audit sessions.
// Returns structured insights for injection into the Claude prompt.
function detectPatterns(sessions) {
  if (!sessions || sessions.length < 2) return null

  const domainFreq   = {}
  const issueFreq    = {}

  for (const s of sessions) {
    for (const d of (s.domains_audited || [])) {
      domainFreq[d] = (domainFreq[d] || 0) + 1
    }
    for (const rc of (s.root_causes || [])) {
      if (rc && typeof rc === 'string' && rc.length > 4) {
        issueFreq[rc] = (issueFreq[rc] || 0) + 1
      }
    }
  }

  const repeatedDomains = Object.entries(domainFreq)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([d, n]) => `${d} (${n}x)`)

  const recurringIssues = Object.entries(issueFreq)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([issue, n]) => `"${issue}" — flagged ${n} sessions`)

  const openSessions = sessions.filter(s => s.status === 'open' || s.status === 'unknown (not followed up)').length

  return {
    total:          sessions.length,
    repeatedDomains,
    recurringIssues,
    openSessions,
  }
}

// Format the company brain as a concise context string for Claude prompts.
// Called by audit.js to inject structured business knowledge into the system prompt.
export function formatBrainForPrompt(brain) {
  if (!brain) return ''

  const lines = ['COMPANY INTELLIGENCE (verified across sessions):']

  if (brain.industry)            lines.push(`Industry: ${brain.industry}`)
  if (brain.domain)              lines.push(`Focus domain: ${brain.domain}`)
  if (brain.core_offer)          lines.push(`Core offer: ${brain.core_offer}`)
  if (brain.target_customer)     lines.push(`Target customer: ${brain.target_customer}`)
  if (brain.revenue_streams?.length)
                                  lines.push(`Revenue streams: ${brain.revenue_streams.join(', ')}`)
  if (brain.pricing_structure)   lines.push(`Pricing: ${brain.pricing_structure}`)
  if (brain.funnel_stages?.length)
                                  lines.push(`Funnel: ${brain.funnel_stages.join(' → ')}`)
  if (brain.conversion_bottlenecks?.length)
                                  lines.push(`Known bottlenecks: ${brain.conversion_bottlenecks.join('; ')}`)
  if (brain.operational_blockers?.length)
                                  lines.push(`Operational blockers: ${brain.operational_blockers.join('; ')}`)
  if (brain.current_constraints?.length)
                                  lines.push(`Current constraints: ${brain.current_constraints.join(', ')}`)
  if (brain.active_goal)         lines.push(`Active goal: ${brain.active_goal}`)
  if (brain.goal_timeline)       lines.push(`Goal timeline: ${brain.goal_timeline}`)
  if (brain.last_audit_headline) lines.push(`Last audit finding: ${brain.last_audit_headline}`)
  if (brain.top_priorities?.length)
                                  lines.push(`Top priorities: ${brain.top_priorities.join('; ')}`)
  if (brain.watchouts?.length)   lines.push(`Watchouts: ${brain.watchouts.join('; ')}`)
  if (brain.opportunities?.length)
                                  lines.push(`Known AI opportunities: ${brain.opportunities.join('; ')}`)
  if (brain.assumptions_unverified?.length)
                                  lines.push(`Unverified assumptions: ${brain.assumptions_unverified.join('; ')}`)

  const patterns = detectPatterns(brain.recent_sessions)
  if (patterns && patterns.total >= 2) {
    lines.push('')
    lines.push(`AUDIT HISTORY (${patterns.total} sessions on record):`)
    if (patterns.repeatedDomains.length > 0)
      lines.push(`  Domains flagged repeatedly: ${patterns.repeatedDomains.join(', ')}`)
    if (patterns.recurringIssues.length > 0)
      lines.push(`  Recurring issues across sessions: ${patterns.recurringIssues.join(' | ')}`)
    if (patterns.openSessions > 0)
      lines.push(`  Unresolved sessions: ${patterns.openSessions} — actions from previous audits not yet followed up`)
    lines.push('  Do NOT re-diagnose issues already identified. Instead, ask what is blocking the fix.')
  }

  if (brain.last_session) {
    const s = brain.last_session
    lines.push('')
    lines.push('LAST SESSION:')
    if (s.headline)         lines.push(`  Finding: ${s.headline}`)
    if (s.core_problem)     lines.push(`  Core problem: ${s.core_problem}`)
    if (s.priority_actions?.length)
                            lines.push(`  Priority actions: ${s.priority_actions.slice(0, 3).join('; ')}`)
    if (s.status)           lines.push(`  Status: ${s.status}`)
  }

  if (lines.length === 1) return '' // nothing meaningful to add

  lines.push('')
  lines.push('Use this as ground truth. Do not re-ask questions already answered here. Correct your understanding if the user contradicts any field.')

  return lines.join('\n')
}
