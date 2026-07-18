import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { getCompanyBrain, upsertCompanyBrain } from './lib/intelligence/company-brain.js'
import { isConversational, getAvailableDataSources, planWithClaude } from './lib/agent/planner.js'
import { gatherAgentContext } from './lib/agent/gather-context.js'
import { generateAgentAnswer } from './lib/agent/generate-agent-answer.js'
import { requireIntelligencePlan } from './lib/plans.js'
import { getComposioConnectionMap } from './lib/connectors/composio.js'

// Table ownership: supabase/migrations/20260710000002_cleanup_ad_hoc_tables.sql

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query, userId, conversationHistory } = req.body || {}
  if (!query || !userId) {
    return res.status(400).json({ error: 'Missing query or userId' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' })

  const sb = getSupabase()
  if (!await requireIntelligencePlan({ userId, res, supabase: sb, feature: 'Ask SelfAudit' })) return

  // ── Step 1: Load brain + integrations in parallel ────────────────────────────
  const [brain, connectionMap] = await Promise.all([
    getCompanyBrain(userId).catch(() => null),
    getComposioConnectionMap(userId).catch(() => ({})),
  ])

  // ── Step 2: Short-circuit conversational messages ─────────────────────────────
  if (isConversational(query)) {
    return res.status(200).json({
      answer:              "Hey — ask me anything about your business. Revenue, hiring, operations, pricing, what's blocking you — I'll investigate and give you a direct answer.",
      root_cause:          null,
      severity_score:      null,
      financial_impact:    null,
      fix_priority:        null,
      execution_plan:      [],
      evidence:            [],
      assumptions:         [],
      missing_data:        [],
      confidence:          null,
      follow_up_question:  null,
      risks_found:         [],
      opportunities_found: [],
      data_sources_used:   [],
      intent:              'conversational',
      investigation_plan:  null,
    })
  }

  // ── Step 3: Claude (Haiku) decides what to investigate ───────────────────────
  const availableSources = getAvailableDataSources(brain, connectionMap)

  let plan
  try {
    plan = await planWithClaude(query, brain, availableSources, conversationHistory, apiKey)
  } catch (err) {
    console.error('[agent] planner failed:', err.message)
    // Fallback to safe defaults rather than crashing
    plan = {
      sources_to_fetch: ['company_brain', 'recent_audits'].filter(s => availableSources.includes(s)),
      intent:           'general_strategy',
      focus_areas:      [],
      hypothesis:       null,
      rationale:        'Planner unavailable — using defaults',
    }
  }

  // ── Step 4: Gather only the sources the planner chose ────────────────────────
  const gatherPlan = {
    available_sources: plan.sources_to_fetch,
    missing_sources:   availableSources.filter(s => !plan.sources_to_fetch.includes(s)),
  }
  const context = await gatherAgentContext(userId, gatherPlan)

  // ── Step 5: Claude (Sonnet) generates the structured answer ──────────────────
  let result
  try {
    result = await generateAgentAnswer({ query, plan, context, conversationHistory })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Agent answer generation failed' })
  }

  // ── Step 6: Persist finding + update brain (non-blocking) ────────────────────
  Promise.allSettled([
    sb.from('agent_findings').insert({
      user_id:     userId,
      query,
      intent:      plan.intent,
      answer:      typeof result.answer === 'string' ? result.answer : JSON.stringify(result.answer),
      full_result: { ...result, investigation_plan: plan },
      confidence:  result.confidence,
    }),

    (result.risks_found?.length || result.opportunities_found?.length)
      ? upsertCompanyBrain(userId, {
          watchouts:     result.risks_found?.length        ? result.risks_found        : undefined,
          opportunities: result.opportunities_found?.length ? result.opportunities_found : undefined,
        })
      : Promise.resolve(),
  ]).catch(() => {})

  // ── Step 7: Return ────────────────────────────────────────────────────────────
  return res.status(200).json({
    answer:              result.answer,
    root_cause:          result.root_cause,
    severity_score:      result.severity_score,
    financial_impact:    result.financial_impact,
    fix_priority:        result.fix_priority,
    execution_plan:      result.execution_plan      ?? [],
    evidence:            result.evidence            ?? [],
    assumptions:         result.assumptions         ?? [],
    missing_data:        result.missing_data        ?? [],
    confidence:          result.confidence,
    follow_up_question:  result.follow_up_question,
    risks_found:         result.risks_found         ?? [],
    opportunities_found: result.opportunities_found ?? [],
    data_sources_used:   context.sources_used,
    intent:              plan.intent,
    investigation_plan:  {
      hypothesis:    plan.hypothesis,
      focus_areas:   plan.focus_areas,
      rationale:     plan.rationale,
      sources_chose: plan.sources_to_fetch,
    },
  })
}
