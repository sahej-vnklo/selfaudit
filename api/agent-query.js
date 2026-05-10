import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain, upsertCompanyBrain } from './lib/intelligence/company-brain.js'
import { classifyAgentIntent, isConversational, getAvailableDataSources, buildAgentInvestigationPlan } from './lib/agent/planner.js'
import { gatherAgentContext } from './lib/agent/gather-context.js'
import { generateAgentAnswer } from './lib/agent/generate-agent-answer.js'

/*
  SQL — run once in Supabase Dashboard:

  create table if not exists agent_findings (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    query       text not null,
    intent      text,
    answer      text,
    full_result jsonb,
    confidence  text,
    created_at  timestamptz default now()
  );

  alter table agent_findings enable row level security;
  create policy "Users see own findings" on agent_findings
    for all using (auth.uid() = user_id);

  create index on agent_findings (user_id, created_at desc);
*/

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

async function getIntegrations(sb, userId) {
  try {
    const { data } = await sb.from('profiles').select('integrations').eq('id', userId).single()
    return data?.integrations ?? null
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' })
  }

  const { query, userId, conversationHistory } = req.body || {}
  if (!query || !userId) {
    return res.status(400).json({ error: 'Missing query or userId' })
  }

  const sb = getSupabase()

  // 1. Load brain + integrations in parallel
  const [brain, integrations] = await Promise.all([
    getCompanyBrain(userId).catch(() => null),
    getIntegrations(sb, userId),
  ])

  // 2. Short-circuit conversational messages — no investigation needed
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
    })
  }

  // 3. Plan
  const intent          = classifyAgentIntent(query)
  const availableSources = getAvailableDataSources(brain, integrations)
  const plan            = buildAgentInvestigationPlan(intent, query, availableSources)

  // 4. Gather context
  const context = await gatherAgentContext(userId, plan)

  // 5. Generate answer
  let result
  try {
    result = await generateAgentAnswer({ query, plan, context, conversationHistory })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Agent answer generation failed' })
  }

  // 6. Persist finding + update brain (non-blocking)
  Promise.allSettled([
    sb.from('agent_findings').insert({
      user_id:     userId,
      query,
      intent,
      answer:      typeof result.answer === 'string' ? result.answer : JSON.stringify(result.answer),
      full_result: result,
      confidence:  result.confidence,
    }),

    (result.risks_found?.length || result.opportunities_found?.length)
      ? upsertCompanyBrain(userId, {
          watchouts:    result.risks_found?.length       ? result.risks_found       : undefined,
          opportunities: result.opportunities_found?.length ? result.opportunities_found : undefined,
        })
      : Promise.resolve(),
  ]).catch(() => {})

  // 7. Return
  return res.status(200).json({
    answer:             result.answer,
    root_cause:         result.root_cause,
    severity_score:     result.severity_score,
    financial_impact:   result.financial_impact,
    fix_priority:       result.fix_priority,
    execution_plan:     result.execution_plan     ?? [],
    evidence:           result.evidence           ?? [],
    assumptions:        result.assumptions        ?? [],
    missing_data:       result.missing_data       ?? [],
    confidence:         result.confidence,
    follow_up_question: result.follow_up_question,
    risks_found:        result.risks_found        ?? [],
    opportunities_found: result.opportunities_found ?? [],
    data_sources_used:  context.sources_used,
    intent,
  })
}
