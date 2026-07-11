// Dual-agent SSE endpoint
// Mode is always explicit — user selects /diagnose, /goal, or /scan
// No automatic intent detection — eliminates hallucination

import { createClient } from '@supabase/supabase-js'
import { validateUserToken }           from './lib/auth.js'
import { getCompanyBrain }             from './lib/intelligence/company-brain.js'
import { getAvailableDataSources, planWithClaude } from './lib/agent/planner.js'
import { gatherAgentContext }          from './lib/agent/gather-context.js'
import { runAgentX }                   from './lib/agent/agent-x.js'
import { runAgentY }                   from './lib/agent/agent-y.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// ── Mode definitions ──────────────────────────────────────────────────────────

const MODES = {
  diagnose: { mode: 'diagnose', label: 'DIAGNOSING',   xLabel: 'DIAGNOSING',    yLabel: 'SOLUTIONS'    },
  goal:     { mode: 'goal',     label: 'GOAL MODE',    xLabel: 'GAP ANALYSIS',  yLabel: 'FASTEST PATH' },
  scan:     { mode: 'scan',     label: 'SCANNING',     xLabel: 'INVESTIGATING', yLabel: 'QUICK ACTIONS'},
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function sseError(res, message) {
  sse(res, 'error', { message })
  sse(res, 'done',  {})
  res.end()
}

// ── Count result components (for Results Ready badge) ─────────────────────────

function countComponents(xOutput, yOutput) {
  let count = 0
  for (const line of (xOutput || '').split('\n')) {
    if (/^(CRITICAL|HIGH|MEDIUM|LOW|ROOT CAUSE|WHAT TO STOP)/.test(line)) count++
  }
  for (const line of (yOutput || '').split('\n')) {
    if (/^(IMMEDIATE|HIGH IMPACT|BUILD NEXT|STOP DOING|EXECUTION ORDER|\d+\.)/.test(line)) count++
  }
  return count
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Claude API key not configured' })

  const { query, userId, conversationHistory = [], industry, domain, modeOverride } = req.body || {}
  if (!query?.trim()) return res.status(400).json({ error: 'Missing query' })

  // Auth check BEFORE flushing SSE headers
  if (userId) {
    const valid = await validateUserToken(req, res, userId)
    if (!valid) return
  }

  // Start SSE stream
  res.setHeader('Content-Type',      'text/event-stream')
  res.setHeader('Cache-Control',     'no-cache')
  res.setHeader('Connection',        'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Resolve mode — explicit override required, defaults to diagnose
  const { mode, label, xLabel, yLabel } = MODES[modeOverride] || MODES.diagnose
  sse(res, 'mode', { mode, label, xLabel, yLabel })

  try {
    sse(res, 'status', { phase: 'planning' })

    // Load brain + integrations
    const [brain, integrationsResult] = await Promise.allSettled([
      userId ? getCompanyBrain(userId) : Promise.resolve(null),
      userId
        ? supabase.from('profiles').select('integrations').eq('id', userId).single()
        : Promise.resolve({ data: null }),
    ])

    const businessBrain = brain.status === 'fulfilled' ? brain.value : null
    const integrations  = integrationsResult.status === 'fulfilled'
      ? integrationsResult.value?.data?.integrations ?? null
      : null

    // Plan + gather context
    const availableSources = getAvailableDataSources(businessBrain, integrations)
    const plan = await planWithClaude(query, businessBrain, availableSources, conversationHistory, apiKey)
    plan.mode  = mode   // inject mode so agents use the right prompts
    const context = await gatherAgentContext(userId, plan)

    // Agent X
    sse(res, 'agent_x_start', {})
    let agentXOutput = ''
    try {
      agentXOutput = await runAgentX({
        query, plan,
        contextBlocks:      context.context_blocks,
        conversationHistory,
        apiKey,
        onToken: (token) => sse(res, 'agent_x_token', { token }),
      })
    } catch (err) {
      sse(res, 'agent_x_token', { token: `\n> ERROR: ${err.message}` })
      agentXOutput = `Error: ${err.message}`
    }
    sse(res, 'agent_x_complete', { output: agentXOutput })

    // Detect gathering phase (diagnose/goal only — Agent X asked questions, not a full diagnosis)
    const isConversationalMode = mode === 'diagnose' || mode === 'goal'
    const agentXHasDiagnosis   = /DIAGNOSIS|ROOT CAUSE|GOAL GAP ANALYSIS|THE GAP|BLOCKERS/.test(agentXOutput)
    const agentXIsGathering    = isConversationalMode && !agentXHasDiagnosis

    if (agentXIsGathering) {
      sse(res, 'agent_y_start',    {})
      sse(res, 'agent_y_complete', { output: '__gathering__' })
      sse(res, 'session_result',   { componentCount: 0 })
      sse(res, 'done', {})
      res.end()
      return
    }

    // Agent Y
    sse(res, 'agent_y_start', {})
    let agentYOutput = ''
    try {
      agentYOutput = await runAgentY({
        query, agentXOutput, plan,
        contextBlocks:      context.context_blocks,
        conversationHistory,
        apiKey,
        onToken: (token) => sse(res, 'agent_y_token', { token }),
      })
    } catch (err) {
      sse(res, 'agent_y_token', { token: `\n> ERROR: ${err.message}` })
      agentYOutput = `Error: ${err.message}`
    }
    sse(res, 'agent_y_complete', { output: agentYOutput })

    // Session result for Results Ready badge
    sse(res, 'session_result', { componentCount: countComponents(agentXOutput, agentYOutput) })

    // Persist non-blocking
    if (userId) {
      ;(async () => {
        try {
          await supabase.from('agent_findings').insert({
            user_id:     userId,
            query,
            intent:      plan.intent,
            answer:      agentYOutput,
            full_result: { agent_x: agentXOutput, agent_y: agentYOutput, plan, mode },
            confidence:  'medium',
          })
        } catch { /* non-blocking */ }
      })()
    }

    sse(res, 'done', {})
    res.end()
  } catch (err) {
    sseError(res, err.message || 'Unexpected error')
  }
}
