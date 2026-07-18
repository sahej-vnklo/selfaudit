import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { requireIntelligencePlan } from './lib/plans.js'
import { getCompanyBrain, upsertCompanyBrain } from './lib/intelligence/company-brain.js'
import { getComposioConnectionMap } from './lib/connectors/composio.js'
import { getAvailableDataSources, isConversational, planWithClaude } from './lib/agent/planner.js'
import { gatherAgentContext } from './lib/agent/gather-context.js'
import { generateAgentAnswer } from './lib/agent/generate-agent-answer.js'
import { buildCounselSources, canOfferCounselReport, normalizeCounselResult } from './lib/agent/counsel.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}

function titleFromQuery(query) {
  const clean = String(query || '').replace(/\s+/g, ' ').trim()
  return clean.length > 72 ? `${clean.slice(0, 69)}…` : clean
}

async function loadThread(sb, userId, requestedThreadId = null) {
  let query = sb.from('counsel_threads').select('id, title, created_at, updated_at').eq('user_id', userId)
  if (requestedThreadId) query = query.eq('id', requestedThreadId)
  else query = query.order('updated_at', { ascending: false }).limit(1)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data || null
}

async function loadMessages(sb, userId, threadId) {
  if (!threadId) return []
  const { data, error } = await sb
    .from('counsel_messages')
    .select('id, role, content, response_data, sources, created_at')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(80)
  if (error) throw error
  return data || []
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.method === 'GET' ? req.query.userId : req.body?.userId
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()
  if (!await requireIntelligencePlan({ userId, res, supabase: sb, feature: 'Counsel' })) return

  if (req.method === 'GET') {
    try {
      const thread = await loadThread(sb, userId, req.query.threadId || null)
      const messages = await loadMessages(sb, userId, thread?.id)
      const { data: threads, error: threadsError } = await sb
        .from('counsel_threads')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)
      if (threadsError) throw threadsError
      return res.status(200).json({ thread, threads: threads || [], messages })
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Could not load Counsel history' })
    }
  }

  const query = String(req.body?.query || '').trim()
  if (!query) return res.status(400).json({ error: 'Missing query' })

  try {
    let thread = req.body?.newThread
      ? null
      : await loadThread(sb, userId, req.body?.threadId || null)
    if (!thread) {
      const { data, error } = await sb.from('counsel_threads').insert({
        user_id: userId,
        title: titleFromQuery(query),
      }).select('id, title, created_at, updated_at').single()
      if (error) throw error
      thread = data
    }

    const existingMessages = await loadMessages(sb, userId, thread.id)
    const conversationHistory = existingMessages.slice(-12).map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }))

    let result
    let plan = null
    let context = { context_blocks: [], structured_context: {}, sources_used: [], missing_sources: [] }

    if (isConversational(query)) {
      result = normalizeCounselResult({
        answer: "Ask me anything about your business. I’ll check the relevant connected data and business history before I answer.",
        confidence: 'high',
      })
    } else {
      const apiKey = process.env.CLAUDE_API_KEY
      if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')

      const [brain, connectionMap] = await Promise.all([
        getCompanyBrain(userId).catch(() => null),
        getComposioConnectionMap(userId).catch(() => ({})),
      ])
      const availableSources = getAvailableDataSources(brain, connectionMap)
      plan = await planWithClaude(query, brain, availableSources, conversationHistory, apiKey)
      context = await gatherAgentContext(userId, {
        available_sources: plan.sources_to_fetch,
        missing_sources: availableSources.filter((source) => !plan.sources_to_fetch.includes(source)),
      })
      result = normalizeCounselResult(await generateAgentAnswer({ query, plan, context, conversationHistory }))
    }

    const sources = buildCounselSources(context)
    const responseData = {
      ...result,
      intent: plan?.intent || 'conversational',
      investigation_plan: plan ? {
        hypothesis: plan.hypothesis,
        focus_areas: plan.focus_areas,
        rationale: plan.rationale,
      } : null,
      missing_sources: context.missing_sources || [],
      can_create_report: canOfferCounselReport(result, sources, existingMessages.length),
    }

    const { error: userMessageError } = await sb.from('counsel_messages').insert({
      thread_id: thread.id,
      user_id: userId,
      role: 'user',
      content: query,
    })
    if (userMessageError) throw userMessageError

    const { data: savedMessage, error: assistantMessageError } = await sb.from('counsel_messages').insert({
      thread_id: thread.id,
      user_id: userId,
      role: 'assistant',
      content: result.answer,
      response_data: responseData,
      sources,
    }).select('id, role, content, response_data, sources, created_at').single()
    if (assistantMessageError) throw assistantMessageError

    await sb.from('counsel_threads').update({ updated_at: new Date().toISOString() }).eq('id', thread.id).eq('user_id', userId)

    Promise.allSettled([
      sb.from('agent_findings').insert({
        user_id: userId,
        query,
        intent: responseData.intent,
        answer: result.answer,
        full_result: { ...responseData, sources },
        confidence: result.confidence,
      }),
      (result.risks_found.length || result.opportunities_found.length)
        ? upsertCompanyBrain(userId, {
            watchouts: result.risks_found.length ? result.risks_found : undefined,
            opportunities: result.opportunities_found.length ? result.opportunities_found : undefined,
          })
        : Promise.resolve(),
    ]).catch(() => {})

    return res.status(200).json({ thread, message: savedMessage })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Counsel could not complete the investigation' })
  }
}
