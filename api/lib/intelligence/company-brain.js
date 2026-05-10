import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
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
export async function getCompanyBrain(userId) {
  if (!userId) return null

  const sb = getSupabase()

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
      .select('summary, confidence, top_headlines, focus_areas, domains_audited, repeated_blockers, top_priorities, watchouts, opportunities, changes_since_last, goal_score, synthesized_profile, last_synthesized_at')
      .eq('user_id', userId)
      .single(),

    sb.from('user_memory')
      .select('headline, core_problem, root_causes, priority_actions, ai_opportunities, domains_audited, status, session_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
  const state   = stateRes.status === 'fulfilled'   ? stateRes.value.data   : null
  const intel   = intelRes.status === 'fulfilled'   ? intelRes.value.data   : null
  const memory  = memoryRes.status === 'fulfilled'  ? memoryRes.value.data  : null

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
    active_goal:           state?.active_goal              ?? null,
    goal_timeline:         state?.goal_timeline            ?? null,
    goal_baseline:         state?.goal_baseline            ?? null,
    goal_score:            state?.goal_score               ?? intel?.goal_score ?? 0,
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

    // Latest session memory
    last_session: memory ? {
      headline:         memory.headline,
      core_problem:     memory.core_problem,
      root_causes:      memory.root_causes,
      priority_actions: memory.priority_actions,
      ai_opportunities: memory.ai_opportunities,
      domains_audited:  memory.domains_audited,
      status:           memory.status,
      session_date:     memory.session_date,
    } : null,
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
