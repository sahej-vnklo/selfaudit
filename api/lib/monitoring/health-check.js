import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from '../intelligence/company-brain.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { runGovernanceMonitoring } from '../governance/monitoring.js'
import { buildGovernanceAdvice } from '../governance/advice.js'
import { enrichGovernanceWithAI } from '../governance/ai-advisor.js'
import { computeSchemaFingerprint, loadSchema } from '../blueprint/schema-registry.js'
import { writeHealthCheckToIntelligenceBrief } from './writeback.js'
import { recomputeCompanyDNA } from '../intelligence/company-dna.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

const SEVERITY_DEDUCTION = { critical: 20, high: 12, medium: 6, low: 2 }
const SEVERITY_ORDER      = { critical: 0, high: 1, medium: 2, low: 3 }

// Persist governance metric snapshots to area_metric_snapshots table.
// Non-blocking — failures are swallowed so the health check always completes.
async function persistMetricSnapshots(userId, snapshots, sb, capturedAt, schemaVersion = null) {
  if (!userId || !snapshots?.length) return
  try {
    const rows = []
    for (const snapshot of snapshots) {
      for (const m of snapshot.metrics ?? []) {
        if (m.value == null) continue
        rows.push({ area: snapshot.areaId, metric_name: m.key, value: m.value, source: m.source || 'governance' })
      }
    }
    if (!rows.length) return

    // Fetch most recent prior snapshot for each metric to compute delta
    const { data: recentRows } = await sb
      .from('area_metric_snapshots')
      .select('area, metric_name, value')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
      .limit(100)

    // First occurrence of each area+metric_name is the most recent prior value
    const priorMap = {}
    for (const row of recentRows ?? []) {
      const key = `${row.area}:${row.metric_name}`
      if (priorMap[key] == null) priorMap[key] = row.value
    }

    const insertRows = rows.map((r) => ({
      user_id:         userId,
      area:            r.area,
      metric_name:     r.metric_name,
      value:           r.value,
      captured_at:     capturedAt,
      schema_version:  schemaVersion ?? null,
      source:          r.source,
      delta_from_prior: priorMap[`${r.area}:${r.metric_name}`] != null
        ? Number((r.value - priorMap[`${r.area}:${r.metric_name}`]).toFixed(4))
        : null,
    }))

    await sb.from('area_metric_snapshots').insert(insertRows)
  } catch (err) {
    console.warn('[health-check] metric snapshot persist failed:', err?.message)
  }
}

function risk(severity, category, title, description, evidence, recommended_action, source, rootCause, impact) {
  return { severity, category, title, description, evidence, recommended_action, source, rootCause: rootCause ?? null, impact: impact ?? null }
}

function scoreFromRisks(risks) {
  const total = risks.reduce((sum, r) => sum + (SEVERITY_DEDUCTION[r.severity] ?? 0), 0)
  return Math.max(0, Math.min(100, 100 - total))
}

// ── Analyzer: Pipeline (HubSpot) ─────────────────────────────────────────────

function analyzePipelineRisk(normalized) {
  if (!normalized) return []

  const risks = []
  const m = Object.fromEntries(normalized.metrics.map((x) => [x.key, x.value]))

  const openDeals     = m.open_deals     ?? null
  const leads         = m.leads          ?? 0
  const sqls          = m.sqls           ?? 0
  const closingSoon   = normalized.entities.filter((e) => e.type === 'deal')
  const highValueSoon = closingSoon.filter((d) => (d.amount ?? 0) >= 10000)

  if (openDeals === 0) {
    risks.push(risk(
      'critical', 'pipeline',
      'Empty pipeline',
      'No open deals in CRM. Revenue generation is not being actively worked.',
      'open_deals = 0 in HubSpot',
      'Run an outbound sprint immediately. Review lead sources and qualification rate.',
      'hubspot',
      'Lead flow has dried up and no new deals have been opened in CRM.',
      'Without pipeline, revenue generation will stall completely within 30–60 days.',
    ))
  } else if (openDeals !== null && openDeals < 3) {
    risks.push(risk(
      'high', 'pipeline',
      'Thin pipeline',
      `Only ${openDeals} open deal${openDeals !== 1 ? 's' : ''} in CRM. Not enough to absorb normal deal fallout.`,
      `open_deals = ${openDeals}`,
      'Actively add new deals. Check lead flow and qualification rate.',
      'hubspot',
      'Not enough deals are being created to build a funnel with enough fallout buffer.',
      'If even one deal slips, there is no backup — revenue becomes unpredictable immediately.',
    ))
  }

  if (highValueSoon.length > 0) {
    risks.push(risk(
      'medium', 'pipeline',
      `${highValueSoon.length} high-value deal${highValueSoon.length > 1 ? 's' : ''} closing in 14 days`,
      'Deals over $10k are due soon and may need focused attention to close.',
      highValueSoon.map((d) => `${d.label} $${d.amount} by ${d.closedate}`).join('; '),
      'Review each deal status. Schedule closing calls and resolve any open objections.',
      'hubspot',
      'High-value deals are approaching close date and may stall without active follow-through.',
      'Missing these deals creates a significant revenue gap that is hard to recover in the same quarter.',
    ))
  }

  if (leads > 5 && sqls === 0) {
    risks.push(risk(
      'high', 'pipeline',
      'Leads not converting to SQL',
      `${leads} leads in CRM with zero SQLs. Top-of-funnel qualification process may be broken.`,
      `leads = ${leads}, sqls = 0`,
      'Audit lead qualification criteria and the SDR-to-AE handoff process.',
      'hubspot',
      'Lead qualification process is not converting inbound interest into sales-qualified conversations.',
      'Top-of-funnel effort is wasted — leads sit idle, go cold, and conversion rate approaches zero.',
    ))
  }

  return risks
}

// ── Analyzer: Revenue (intelligence_brief) ───────────────────────────────────

function analyzeRevenueRisk(brief) {
  if (!brief) return []

  const risks = []
  const f = brief.financial || {}
  const c = brief.context   || {}

  const churn   = f.churn   != null ? Number(f.churn)   : null
  const runway  = f.runway  != null ? Number(f.runway)  : (c.runway != null ? Number(c.runway) : null)
  const ltv     = f.ltv     != null ? Number(f.ltv)     : null
  const cac     = f.cac     != null ? Number(f.cac)     : null
  const burn    = f.burn_rate != null ? Number(f.burn_rate) : null

  if (churn !== null && churn > 5) {
    risks.push(risk(
      'high', 'revenue',
      'High monthly churn',
      `Monthly churn at ${churn}% is well above a healthy threshold (≤2%). Revenue is actively leaking.`,
      `churn = ${churn}%`,
      'Run a churn post-mortem on the last 90 days. Identify the top 3 cancellation reasons and build counter-playbooks.',
      'intelligence_brief',
      'More than 5% of revenue is leaving every month — customers are not finding lasting value.',
      'At this rate, the business loses over 60% of its revenue base annually before counting new sales.',
    ))
  } else if (churn !== null && churn > 2) {
    risks.push(risk(
      'medium', 'revenue',
      'Elevated churn',
      `Monthly churn at ${churn}% is above ideal (≤2%). Compounding effect will suppress net revenue growth.`,
      `churn = ${churn}%`,
      'Survey churned customers. Add health-score monitoring for at-risk accounts.',
      'intelligence_brief',
      'Monthly churn above the healthy threshold is quietly suppressing net revenue growth.',
      'Even strong new sales are partially offset — compounding over 12 months caps total growth potential.',
    ))
  }

  if (runway !== null && runway < 6) {
    risks.push(risk(
      'critical', 'revenue',
      'Runway under 6 months',
      `Only ${runway} months of runway remaining. Cash position is critical.`,
      `runway = ${runway} months${burn ? `, burn = $${burn}/mo` : ''}`,
      'Extend runway immediately — cut non-essential spend and/or accelerate revenue. Begin fundraise conversations now.',
      'intelligence_brief',
      'Current burn rate is consuming cash faster than revenue can replenish it.',
      'Without immediate action, the business runs out of operating capital and cannot pay its obligations.',
    ))
  } else if (runway !== null && runway < 12) {
    risks.push(risk(
      'high', 'revenue',
      'Runway under 12 months',
      `${runway} months of runway. Tight enough that a slow quarter could force hard decisions.`,
      `runway = ${runway} months`,
      'Begin fundraising or reach profitability planning now — do not wait until under 6 months.',
      'intelligence_brief',
      'Cash reserves are being drawn down faster than revenue growth can offset burn.',
      'A slow quarter or unexpected cost spike could force immediate cuts or a distressed raise.',
    ))
  }

  if (ltv !== null && cac !== null && cac > 0) {
    const ratio = ltv / cac
    if (ratio < 1) {
      risks.push(risk(
        'critical', 'revenue',
        'LTV:CAC below 1x — unit economics are inverted',
        'Spending more to acquire customers than they return. The business model is not viable at current economics.',
        `ltv = ${ltv}, cac = ${cac}, ratio = ${ratio.toFixed(2)}x`,
        'Stop growth spend immediately. Fix either CAC (cheaper acquisition) or LTV (better retention/pricing) before scaling.',
        'intelligence_brief',
        'The cost of acquiring a customer exceeds the lifetime revenue that customer generates.',
        'Every new customer added loses money — growth makes the economics worse, not better.',
      ))
    } else if (ratio < 3) {
      risks.push(risk(
        'medium', 'revenue',
        'LTV:CAC below 3x',
        `LTV:CAC at ${ratio.toFixed(1)}x. Healthy SaaS benchmark is 3x+. Margins are thin.`,
        `ltv = ${ltv}, cac = ${cac}, ratio = ${ratio.toFixed(2)}x`,
        'Focus on reducing acquisition cost or improving retention and expansion revenue.',
        'intelligence_brief',
        'Customer acquisition cost is high relative to the revenue each customer returns over their lifetime.',
        'Thin margins leave little room for error and make profitable scaling very difficult.',
      ))
    }
  }

  return risks
}

// ── Analyzer: Churn / Customer health ────────────────────────────────────────

function analyzeCustomerRisk(brain, normalized) {
  if (!brain && !normalized) return []

  const risks = []
  const retentionSignals = brain?.retention_signals ?? []

  if (retentionSignals.length > 0) {
    const negativeSignals = retentionSignals.filter((s) =>
      /churn|cancel|downgrade|at.?risk|complaint|escalat/i.test(String(s))
    )
    if (negativeSignals.length > 0) {
      risks.push(risk(
        'medium', 'customer',
        'Negative retention signals detected',
        `${negativeSignals.length} churn or at-risk signal${negativeSignals.length > 1 ? 's' : ''} logged from audit history.`,
        negativeSignals.slice(0, 2).join('; '),
        'Proactively reach out to at-risk accounts. Assign an owner to each flagged account.',
        'company_brain',
        'Recent audit history flagged churn risk, cancellations, or escalation signals across accounts.',
        'Unaddressed at-risk accounts are likely to churn — quietly eroding the revenue base.',
      ))
    }
  }

  if (normalized) {
    const m = Object.fromEntries(normalized.metrics.map((x) => [x.key, x.value]))
    const customers = m.customers ?? 0
    const leads     = m.leads     ?? 0

    if (customers === 0 && leads > 0) {
      risks.push(risk(
        'high', 'customer',
        'No customers in CRM despite active leads',
        'CRM shows leads but zero customers. Either conversion is broken or CRM data is not being updated.',
        `customers = 0, leads = ${leads}`,
        'Audit CRM data hygiene. Verify closed-won deals are being marked correctly in HubSpot.',
        'hubspot',
        'Either deals are closing but not being recorded, or conversion from lead to customer is broken.',
        'CRM data cannot be trusted for forecasting or pipeline management — decisions are being made blind.',
      ))
    }
  }

  return risks
}

// ── Analyzer: Execution (unresolved actions, session follow-up) ───────────────

function analyzeExecutionRisk(brain) {
  if (!brain) return []

  const risks = []
  const priorities = brain.top_priorities     ?? []
  const blockers   = brain.repeated_blockers  ?? []
  const watchouts  = brain.watchouts          ?? []

  if (priorities.length >= 5) {
    risks.push(risk(
      'high', 'execution',
      'High unresolved action backlog',
      `${priorities.length} priority actions unresolved from audit history. Execution is stalling.`,
      `top_priorities count = ${priorities.length}`,
      'Time-box a weekly review session. Pick 3 actions, assign owners, set a 7-day deadline.',
      'company_brain',
      'Too many audit-identified actions are accumulating without being closed out or assigned.',
      'Execution slows as the team loses focus — critical fixes get delayed and eventually forgotten.',
    ))
  } else if (priorities.length >= 3) {
    risks.push(risk(
      'medium', 'execution',
      'Action backlog building',
      `${priorities.length} unresolved priority actions tracked across audit sessions.`,
      `top_priorities count = ${priorities.length}`,
      'Assign each action an owner and deadline before the next audit.',
      'company_brain',
      'More actions are being identified than are being completed between sessions.',
      'Without a clear owner and deadline for each action, important work quietly gets deprioritised.',
    ))
  }

  if (blockers.length >= 2) {
    risks.push(risk(
      'medium', 'execution',
      'Repeated blockers unresolved',
      `${blockers.length} recurring blockers surfacing across multiple sessions: ${blockers.slice(0, 2).join('; ')}`,
      `repeated_blockers count = ${blockers.length}`,
      'These are systemic — address the root cause, not just the symptom each time.',
      'company_brain',
      'The same obstacles keep surfacing session after session without being resolved at the root.',
      'Systemic blockers compound — they slow execution across multiple areas simultaneously.',
    ))
  }

  if (watchouts.length >= 3) {
    risks.push(risk(
      'low', 'execution',
      'Multiple watchouts active',
      `${watchouts.length} active watchouts from audit history need monitoring.`,
      `watchouts count = ${watchouts.length}`,
      'Review each watchout. Close out resolved ones so the signal stays clean.',
      'company_brain',
      'Several signals flagged for monitoring have not been resolved or closed out.',
      'Active watchouts are risks one bad week away from becoming full alerts.',
    ))
  }

  if (brain.last_session?.status === 'unknown (not followed up)') {
    risks.push(risk(
      'low', 'execution',
      'Last audit not followed up',
      'No follow-up recorded on the previous audit session actions.',
      `last_session headline: "${brain.last_session.headline}"`,
      'Mark each action as done, carried forward, or deprioritised — do not leave it in limbo.',
      'company_brain',
      'The previous audit produced action items that were never marked completed, carried forward, or deprioritised.',
      'Without accountability on prior actions, audits lose their value — plans do not translate to execution.',
    ))
  }

  return risks
}

// ── Analyzer: Goal risk ───────────────────────────────────────────────────────

function analyzeGoalRisk(brain) {
  if (!brain?.active_goal) return []

  const risks = []
  const score    = brain.goal_score    ?? 0
  const timeline = brain.goal_timeline ?? ''

  if (score < 20) {
    risks.push(risk(
      'high', 'goal',
      'Goal trajectory critical',
      `Goal score at ${score}/100 — progress is severely off track for: "${brain.active_goal}"`,
      `goal_score = ${score}, goal = "${brain.active_goal}"`,
      'Reassess goal feasibility and timeline. Break into smaller milestones with weekly check-ins.',
      'company_brain',
      'Current execution pace is far below what is needed to hit the stated goal on time.',
      'At this trajectory, the goal will be missed — and the gap will widen the longer it goes unaddressed.',
    ))
  } else if (score < 50) {
    risks.push(risk(
      'medium', 'goal',
      'Goal progress below target',
      `Goal score at ${score}/100. Current execution pace is unlikely to meet the timeline.`,
      `goal_score = ${score}, goal = "${brain.active_goal}"`,
      'Identify the single biggest blocker to goal achievement and address it this week.',
      'company_brain',
      'Progress is happening but not fast enough to meet the goal by the current deadline.',
      'Missing the goal affects investor confidence, team morale, and planning for the next cycle.',
    ))
  }

  const tl = timeline.toLowerCase()
  if (tl.includes('unrealistic')) {
    risks.push(risk(
      'high', 'goal',
      'Goal timeline flagged unrealistic',
      `The most recent audit marked this timeline as unrealistic: "${brain.active_goal}"`,
      `goal_timeline = "${timeline}"`,
      'Renegotiate the goal or the timeline based on current capacity and constraints.',
      'company_brain',
      'The most recent audit identified the timeline as beyond what current capacity can deliver.',
      'Pursuing an unrealistic timeline creates pressure without progress — the team burns out chasing a moving target.',
    ))
  } else if (tl.includes('tight')) {
    risks.push(risk(
      'medium', 'goal',
      'Goal timeline flagged tight',
      'Audit marked this timeline as achievable but with no margin for error.',
      `goal_timeline = "${timeline}"`,
      'Identify the single biggest risk to the timeline and build a mitigation plan now.',
      'company_brain',
      'The timeline is achievable but relies on everything going right with no room for error.',
      'Any unexpected delay or setback will put the deadline at risk — there is no recovery buffer built in.',
    ))
  }

  return risks
}

// ── Analyzer: Operational ─────────────────────────────────────────────────────

function analyzeOperationalRisk(brain) {
  if (!brain) return []

  const risks = []
  const blockers    = brain.operational_blockers    ?? []
  const bottlenecks = brain.conversion_bottlenecks  ?? []
  const constraints = brain.current_constraints     ?? []

  if (blockers.length >= 2) {
    risks.push(risk(
      'medium', 'operations',
      'Multiple operational blockers active',
      `${blockers.length} operational blockers logged: ${blockers.slice(0, 2).join('; ')}`,
      `operational_blockers = ${JSON.stringify(blockers.slice(0, 3))}`,
      'Pick the highest-impact blocker and dedicate focused capacity to clearing it this sprint.',
      'company_brain',
      'Several operational constraints are simultaneously limiting throughput and progress.',
      'Multiple blockers compound each other — removing one still leaves the others in place.',
    ))
  }

  if (bottlenecks.length >= 2) {
    risks.push(risk(
      'medium', 'operations',
      'Conversion bottlenecks identified',
      `${bottlenecks.length} known conversion bottlenecks: ${bottlenecks.slice(0, 2).join('; ')}`,
      `conversion_bottlenecks = ${JSON.stringify(bottlenecks.slice(0, 3))}`,
      'Map the full customer journey and instrument each stage to find where drop-off concentrates.',
      'company_brain',
      'Known friction points in the customer journey are reducing conversion at multiple stages.',
      'Every untreated bottleneck silently reduces the yield from marketing and sales spend.',
    ))
  }

  if (constraints.length >= 3) {
    risks.push(risk(
      'low', 'operations',
      'Multiple constraints stacking',
      `${constraints.length} active constraints may be creating compound throughput drag.`,
      `current_constraints count = ${constraints.length}`,
      'Identify which constraint is the binding one and focus there — the others likely resolve downstream.',
      'company_brain',
      'Multiple simultaneous constraints are creating compounding drag across the operation.',
      'Stacked constraints reduce throughput more than the sum of their parts — they interact and amplify each other.',
    ))
  }

  return risks
}

// ── Summary and opportunity builders ─────────────────────────────────────────

function buildOpportunities(brain, normalized) {
  const opps = []

  if (brain?.opportunities?.length) {
    brain.opportunities.slice(0, 3).forEach((o) => {
      opps.push({ title: String(o), source: 'company_brain' })
    })
  }

  if (normalized?.opportunities?.length) {
    normalized.opportunities.forEach((o) => {
      opps.push({ title: o.title, description: o.description, source: o.source })
    })
  }

  return opps
}

function buildSummary(risks, brain) {
  const byLevel = { critical: [], high: [], medium: [], low: [] }
  risks.forEach((r) => byLevel[r.severity]?.push(r.title))

  const parts = []

  if (byLevel.critical.length) {
    parts.push(`${byLevel.critical.length} critical issue${byLevel.critical.length > 1 ? 's' : ''} require immediate attention: ${byLevel.critical.join(', ')}.`)
  }
  if (byLevel.high.length) {
    parts.push(`${byLevel.high.length} high-severity risk${byLevel.high.length > 1 ? 's' : ''} flagged: ${byLevel.high.join(', ')}.`)
  }
  if (byLevel.medium.length) {
    parts.push(`${byLevel.medium.length} medium risk${byLevel.medium.length > 1 ? 's' : ''} worth monitoring.`)
  }
  if (parts.length === 0) {
    parts.push('No significant risks detected. Business signals look stable.')
  }

  if (brain?.active_goal) {
    parts.push(`Active goal: "${brain.active_goal}" — score ${brain.goal_score ?? 0}/100.`)
  }

  return parts.join(' ')
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function runBusinessHealthCheck(userId) {
  if (!userId) throw new Error('userId required')

  const sb         = getSupabase()
  const checked_at = new Date().toISOString()

  // 1-4: Load company brain, intelligence_brief, user overrides, schema in parallel
  const [brainRes, briefRes, overridesRes, schemaRes] = await Promise.allSettled([
    getCompanyBrain(userId),
    sb.from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .single(),
    sb.from('user_rule_overrides')
      .select('rule_id, value, enabled')
      .eq('user_id', userId),
    loadSchema(userId),
  ])

  const brain        = brainRes.status     === 'fulfilled' ? brainRes.value      : null
  const brief        = briefRes.status     === 'fulfilled' ? briefRes.value.data : null
  const overrideRows = overridesRes.status === 'fulfilled' ? (overridesRes.value.data ?? []) : []
  const schema       = schemaRes.status    === 'fulfilled' ? schemaRes.value     : null

  const userOverrides = overrideRows.length > 0
    ? new Map(overrideRows.map((row) => [row.rule_id, { value: row.value, enabled: row.enabled }]))
    : null
  const schemaVersion = computeSchemaFingerprint(schema)

  if (briefRes.status === 'fulfilled' && briefRes.value.error) {
    console.warn('[health-check] brief fetch error:', briefRes.value.error.message)
  }

  // 5: Pull connector data — use pre-fetched snapshot (< 4h old) when available,
  //    fall back to live Composio call if snapshot is missing or stale
  let normalized = null
  try {
    const { data: snap } = await sb
      .from('connector_snapshots')
      .select('normalized_data, fetched_at')
      .eq('user_id', userId)
      .single()

    const snapAgeMs = snap?.fetched_at
      ? Date.now() - new Date(snap.fetched_at).getTime()
      : Infinity

    if (snap?.normalized_data && snapAgeMs < 4 * 60 * 60 * 1000) {
      normalized = snap.normalized_data
    } else {
      const connectorData = await fetchAllConnectedData(userId)
      if (Object.keys(connectorData).length) normalized = normalizeConnectorData(connectorData)
    }
  } catch { /* non-blocking */ }

  // 7: Run all analyzers
  const allRisks = [
    ...analyzePipelineRisk(normalized),
    ...analyzeRevenueRisk(brief),
    ...analyzeCustomerRisk(brain, normalized),
    ...analyzeExecutionRisk(brain),
    ...analyzeGoalRisk(brain),
    ...analyzeOperationalRisk(brain),
  ].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))

  const health_score  = scoreFromRisks(allRisks)
  const opportunities = buildOpportunities(brain, normalized)
  const summary       = buildSummary(allRisks, brain)

  // Load user-defined metrics from Logic page — fill-in values for keys
  // not already resolved from connectors or brain.
  const { data: customMetricRows } = await sb
    .from('user_custom_metrics')
    .select('name, value')
    .eq('user_id', userId)

  const userMetrics   = Object.fromEntries(
    (customMetricRows ?? []).map((r) => [r.name, Number(r.value)])
  )
  const hasMetrics    = Object.keys(userMetrics).length > 0
  const hasConnectors = !!normalized

  const governanceBase = runGovernanceMonitoring({
    brain, brief, normalized, checkedAt: checked_at, userOverrides, schema, userMetrics,
  })

  // Persist metric snapshots non-blocking — do not await, never blocks health check
  persistMetricSnapshots(userId, governanceBase.snapshots, sb, checked_at, schemaVersion)
    .then(() => recomputeCompanyDNA(sb, userId))
    .catch(() => {})

  // Gate: skip AI diagnosis when the user has no metrics and no connector data.
  // Without real input, Claude would invent narratives against thin air.
  const deterministicGovernanceAdvice = buildGovernanceAdvice(governanceBase)
  const governanceAdvice = (hasMetrics || hasConnectors)
    ? await enrichGovernanceWithAI({
        userId,
        governance: governanceBase,
        brain,
        intelligenceBrief: brief,
        deterministicAdvice: deterministicGovernanceAdvice,
      })
    : deterministicGovernanceAdvice
  const governance          = {
    ...governanceBase,
    advice_summary: governanceAdvice.summary,
    diagnoses: governanceAdvice.diagnoses,
    recommended_actions: governanceAdvice.recommended_actions,
    alert_candidates: governanceAdvice.alert_candidates,
  }
  const recommended_actions = [...new Set([
    ...allRisks.slice(0, 5).map((r) => r.recommended_action),
    ...governance.recommended_actions,
  ].filter(Boolean))].slice(0, 8)

  const evidence = {
    connector: normalized
      ? { provider: normalized.provider, fetched_at: normalized.fetched_at, metric_count: normalized.metrics.length }
      : null,
    brain_signals: {
      watchouts:  brain?.watchouts?.length        ?? 0,
      priorities: brain?.top_priorities?.length   ?? 0,
      blockers:   brain?.repeated_blockers?.length ?? 0,
    },
    intelligence_brief_loaded: !!brief,
    governance: {
      areas_with_signals: governance.summary.areasWithSignals,
      areas_needing_attention: governance.summary.areasNeedingAttention,
      areas_to_watch: governance.summary.areasToWatch,
      total_findings: governance.findings.length,
      alert_candidates: governance.alert_candidates.length,
      diagnoses: governance.diagnoses.length,
      advice_summary: governance.advice_summary,
      area_statuses: governance.areas.map((area) => ({
        area_id: area.areaId,
        status: area.status,
        coverage: area.coverage,
      })),
      top_diagnoses: governance.diagnoses.slice(0, 3).map((item) => ({
        area_id: item.areaId,
        title: item.title,
        severity: item.severity,
      })),
    },
  }

  const result = {
    userId,
    checked_at,
    schema_version: schemaVersion,
    health_score,
    risks: allRisks,
    opportunities,
    summary,
    recommended_actions,
    evidence,
    governance,
  }

  writeHealthCheckToIntelligenceBrief(userId, { ...result, normalized }, sb).catch(() => {})

  return result
}
