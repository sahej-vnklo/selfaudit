// Dual-agent SSE endpoint
// Agent X diagnoses → Agent Y solves
// Single HTTP connection, two named SSE event streams

import { createClient } from '@supabase/supabase-js'
import { validateUserToken }                        from './lib/auth.js'
import { getCompanyBrain }                          from './lib/intelligence/company-brain.js'
import { isConversational, getAvailableDataSources, planWithClaude } from './lib/agent/planner.js'
import { gatherAgentContext }                       from './lib/agent/gather-context.js'
import { runAgentX }                                from './lib/agent/agent-x.js'
import { runAgentY }                                from './lib/agent/agent-y.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function sseError(res, message) {
  sse(res, 'error', { message })
  sse(res, 'done',  {})
  res.end()
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Claude API key not configured' })

  const { query, userId, conversationHistory = [], industry, domain } = req.body || {}
  if (!query?.trim()) return res.status(400).json({ error: 'Missing query' })

  // Auth check BEFORE flushing SSE headers — validateUserToken writes to res on failure
  if (userId) {
    const valid = await validateUserToken(req, res, userId)
    if (!valid) return  // validateUserToken already wrote the 401 response
  }

  // Auth passed — now start SSE stream
  res.setHeader('Content-Type',      'text/event-stream')
  res.setHeader('Cache-Control',     'no-cache')
  res.setHeader('Connection',        'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Short-circuit conversational messages
  if (isConversational(query)) {
    const intro = `I diagnose what is broken in your business and build the fix plan.\n\nTell me what is not working — pipeline dry, churn spiking, cash running short, team not executing, goal not moving — and I will run a full analysis.\n\nAgent X will diagnose the root cause. Agent Y will build the solution.`
    sse(res, 'agent_x_start',    {})
    sse(res, 'agent_x_token',    { token: intro })
    sse(res, 'agent_x_complete', { output: intro })
    sse(res, 'agent_y_start',    {})
    sse(res, 'agent_y_complete', { output: '' })
    sse(res, 'done',             {})
    res.end()
    return
  }

  try {
    // ── Step 1: Load brain + integrations ──────────────────────────────────
    sse(res, 'status', { phase: 'planning' })

    const [brain, integrationsResult] = await Promise.allSettled([
      userId ? getCompanyBrain(userId) : Promise.resolve(null),
      userId ? supabase.from('profiles').select('integrations').eq('id', userId).single() : Promise.resolve({ data: null }),
    ])

    const businessBrain = brain.status === 'fulfilled' ? brain.value : null
    const integrations  = integrationsResult.status === 'fulfilled'
      ? integrationsResult.value?.data?.integrations ?? null
      : null

    // ── Step 2: Plan — what sources to fetch ──────────────────────────────
    const availableSources = getAvailableDataSources(businessBrain, integrations)
    const plan = await planWithClaude(query, businessBrain, availableSources, conversationHistory, apiKey)

    // ── Step 3: Gather context (shared by both agents) ────────────────────
    const context = await gatherAgentContext(userId, plan)

    // ── Step 4: Agent X streams to left card ─────────────────────────────
    sse(res, 'agent_x_start', {})

    let agentXOutput = ''
    try {
      agentXOutput = await runAgentX({
        query,
        plan,
        contextBlocks:      context.context_blocks,
        conversationHistory,
        apiKey,
        onToken: (token) => sse(res, 'agent_x_token', { token }),
      })
    } catch (err) {
      sse(res, 'agent_x_token', { token: `\n\nDiagnosis error: ${err.message}` })
      agentXOutput = `Diagnosis could not be completed: ${err.message}`
    }

    sse(res, 'agent_x_complete', { output: agentXOutput })

    // ── Step 5: Agent Y streams to right card ─────────────────────────────
    sse(res, 'agent_y_start', {})

    let agentYOutput = ''
    try {
      agentYOutput = await runAgentY({
        query,
        agentXOutput,
        plan,
        contextBlocks:      context.context_blocks,
        conversationHistory,
        apiKey,
        onToken: (token) => sse(res, 'agent_y_token', { token }),
      })
    } catch (err) {
      sse(res, 'agent_y_token', { token: `\n\nSolution error: ${err.message}` })
      agentYOutput = `Solutions could not be completed: ${err.message}`
    }

    sse(res, 'agent_y_complete', { output: agentYOutput })

    // ── Step 6: Persist agent findings non-blocking ───────────────────────
    if (userId) {
      supabase.from('agent_findings').insert({
        user_id:     userId,
        query,
        intent:      plan.intent,
        answer:      agentYOutput,
        full_result: { agent_x: agentXOutput, agent_y: agentYOutput, plan },
        confidence:  'medium',
      }).catch(() => {})
    }

    sse(res, 'done', {})
    res.end()
  } catch (err) {
    sseError(res, err.message || 'Unexpected error')
  }
}
