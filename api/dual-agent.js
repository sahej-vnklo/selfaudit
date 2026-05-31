// Dual-agent SSE endpoint
// Smart intent router → Agent X diagnoses/investigates → Agent Y solves/acts
// Single HTTP connection, named SSE events per agent

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

// ── Intent router ─────────────────────────────────────────────────────────────
// Classifies every message into a mode so agents respond appropriately.
// No API call — pure pattern matching for speed.

function classifyIntent(query, conversationHistory = []) {
  const q     = query.trim()
  const lower = q.toLowerCase()
  const words = q.split(/\s+/).length

  // ── Memory / context reference ─────────────────────────────────────────────
  // User is referencing something from a past session or prior turn
  if (/\b(last time|previously|you said|we discussed|from before|based on what|you mentioned|in my last|in our last|before you said|what you found|your (last|previous) (analysis|session|finding))\b/i.test(q)) {
    return { mode: 'memory', label: 'RECALLING', xLabel: 'SCANNING MEMORY', yLabel: 'FOLLOW-UP' }
  }

  // ── News / new information ─────────────────────────────────────────────────
  // User is sharing something that just happened
  if (/^(just|we just|i just|fyi[,:]?|update[,:]?|heads up|news:|btw,?)\b/i.test(lower) ||
      /\b(just (got|closed|lost|hired|fired|launched|signed|raised|onboarded|churned|cancelled|found out|learned))\b/i.test(lower)) {
    return { mode: 'news', label: 'PROCESSING UPDATE', xLabel: 'ANALYZING IMPACT', yLabel: 'IMMEDIATE ACTIONS' }
  }

  // ── Goal pursuit ───────────────────────────────────────────────────────────
  // User is working toward a specific target or milestone
  if (/\b(want to|trying to|goal is|aiming to|need to (reach|hit|get to)|how (do i|can i) (reach|hit|get to|grow|scale)|grow to|scale to|by q[1-4]|by (end of|next month|next quarter))\b/i.test(lower) ||
      /\$[\d,k]+\s*(mrr|arr|revenue|\/mo|a month|per month)/i.test(q) ||
      /\b(in \d+ (months?|weeks?)|milestone|my target|my goal)\b/i.test(lower)) {
    return { mode: 'goal', label: 'GOAL MODE', xLabel: 'GAP ANALYSIS', yLabel: 'FASTEST PATH' }
  }

  // ── Quick investigation ────────────────────────────────────────────────────
  // Short specific question — wants an answer, not a full diagnosis
  if (words <= 12 && /^(why|what('?s| is| are)|how much|how many|show me|is my|are my|which|when did|what happened|where is)\b/i.test(q)) {
    return { mode: 'scan', label: 'INVESTIGATING', xLabel: 'INVESTIGATING', yLabel: 'QUICK ACTIONS' }
  }

  // ── Discussion / thinking out loud ─────────────────────────────────────────
  // User is exploring an idea, not stating a clear problem
  if (/\b(thinking (about|of)|considering|not sure (if|whether|about)|maybe i (should|could)|what do you think|should i|is it worth|i('?m| am) wondering|your (take|view|thoughts?) on)\b/i.test(lower)) {
    return { mode: 'discuss', label: 'DISCUSSING', xLabel: 'ANALYSIS', yLabel: 'PERSPECTIVE' }
  }

  // ── Default: business problem diagnosis ───────────────────────────────────
  return { mode: 'diagnose', label: 'DIAGNOSING', xLabel: 'DIAGNOSING', yLabel: 'SOLUTIONS' }
}

// ── Count result components (for Results Ready badge) ─────────────────────────

function countComponents(xOutput, yOutput) {
  let count = 0
  const xLines = (xOutput || '').split('\n')
  const yLines = (yOutput || '').split('\n')
  for (const line of xLines) {
    if (/^(CRITICAL|HIGH|MEDIUM|LOW|ROOT CAUSE|WHAT TO STOP)/.test(line)) count++
  }
  for (const line of yLines) {
    if (/^(IMMEDIATE|HIGH IMPACT|BUILD NEXT|STOP DOING|EXECUTION ORDER|\d+\.)/.test(line)) count++
  }
  return count
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
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

  // ── Conversational short-circuit ──────────────────────────────────────────
  if (isConversational(query)) {
    const reply = `I diagnose business problems and build the solution plan.\n\nTell me what is not working — pipeline dry, churn spiking, cash running short, team not executing, goal not moving — and I will run a full analysis.\n\nOr share any update, ask a specific question, or tell me what you are trying to achieve.`
    sse(res, 'mode',           { mode: 'conversational', label: 'LISTENING', xLabel: 'AGENT X', yLabel: 'AGENT Y' })
    sse(res, 'agent_x_start',  {})
    sse(res, 'agent_x_token',  { token: reply })
    sse(res, 'agent_x_complete', { output: reply })
    sse(res, 'agent_y_start',  {})
    sse(res, 'agent_y_complete', { output: '' })
    sse(res, 'session_result', { componentCount: 0 })
    sse(res, 'done',           {})
    res.end()
    return
  }

  // ── Classify intent (explicit override beats auto-detect) ────────────────
  const OVERRIDE_LABELS = {
    diagnose: { mode: 'diagnose', label: 'DIAGNOSING',  xLabel: 'DIAGNOSING',   yLabel: 'SOLUTIONS' },
    goal:     { mode: 'goal',     label: 'GOAL MODE',   xLabel: 'GAP ANALYSIS', yLabel: 'FASTEST PATH' },
    scan:     { mode: 'scan',     label: 'SCANNING',    xLabel: 'INVESTIGATING',yLabel: 'QUICK ACTIONS' },
  }
  const { mode, label, xLabel, yLabel } = modeOverride && OVERRIDE_LABELS[modeOverride]
    ? OVERRIDE_LABELS[modeOverride]
    : classifyIntent(query, conversationHistory)
  sse(res, 'mode', { mode, label, xLabel, yLabel })

  try {
    sse(res, 'status', { phase: 'planning' })

    // ── Load brain + integrations ─────────────────────────────────────────
    const [brain, integrationsResult] = await Promise.allSettled([
      userId ? getCompanyBrain(userId) : Promise.resolve(null),
      userId ? supabase.from('profiles').select('integrations').eq('id', userId).single() : Promise.resolve({ data: null }),
    ])

    const businessBrain = brain.status === 'fulfilled' ? brain.value : null
    const integrations  = integrationsResult.status === 'fulfilled'
      ? integrationsResult.value?.data?.integrations ?? null
      : null

    // ── Plan + gather context ─────────────────────────────────────────────
    const availableSources = getAvailableDataSources(businessBrain, integrations)
    const plan = await planWithClaude(query, businessBrain, availableSources, conversationHistory, apiKey)
    const context = await gatherAgentContext(userId, plan)

    // Inject mode into plan so agents adjust their prompts
    plan.mode = mode

    // ── Agent X ───────────────────────────────────────────────────────────
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

    // ── Agent Y ───────────────────────────────────────────────────────────
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

    // ── Session result (for Results Ready badge) ──────────────────────────
    const componentCount = countComponents(agentXOutput, agentYOutput)
    sse(res, 'session_result', { componentCount })

    // ── Persist non-blocking ──────────────────────────────────────────────
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
        } catch { /* non-blocking — never fails the session */ }
      })()
    }

    sse(res, 'done', {})
    res.end()
  } catch (err) {
    sseError(res, err.message || 'Unexpected error')
  }
}
