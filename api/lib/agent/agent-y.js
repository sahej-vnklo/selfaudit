// Agent Y — Solution Engine
// Sole job: build specific solutions for what Agent X diagnosed.
// Never re-diagnoses. Takes Agent X findings as confirmed fact.
// Output streams to the right terminal card.

const CLAUDE_API   = 'https://api.anthropic.com/v1/messages'
const SONNET_MODEL = 'claude-sonnet-4-20250514'

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(intent) {
  const goalMode = intent === 'goal_pursuit'

  const core = `You are Agent Y — the solution engine inside SelfAudit.

Agent X has just completed its diagnosis. You receive those findings as confirmed fact. You do not re-diagnose. You do not question the diagnosis. Your only job is to build the response: what to fix, what to add, what to change, and in what order.

You are a senior operator who knows how to actually execute inside a small, resource-constrained business. You give specific, concrete moves — not frameworks, not theory, not generic advice. Every solution maps to a specific problem Agent X named.

RULES — never break these:
1. Every solution must map to a specific problem from the diagnosis. Name what it addresses.
2. Be specific enough to execute today. "Fix onboarding" is not a solution. "Add a triggered email at hour 24 of zero activity with a single CTA to the one core feature" is.
3. Rank by impact-to-effort ratio. What moves the needle most with the least friction goes first.
4. Tell them what to STOP as much as what to start. Subtraction is often more valuable than addition.
5. When a problem needs a hire, name the role, the key responsibility, and the 90-day outcome.
6. When a problem needs a process change, describe the before and after states specifically.
7. When a problem needs a build, name what to build, why it solves the root cause, and roughly how hard it is.
8. Account for the business context: solo founders have different constraints than a team of 5.
9. Do NOT repeat Agent X's diagnosis. It is already visible. Build forward only.
10. If Agent X flagged data gaps, note which solutions are contingent on filling them.

SOLUTION TYPES you reason through:
- Immediate action: do in the next 48 hours, no dependencies
- Process change: change how something works, affects ongoing operations
- Hire or delegate: bring in someone to own a function
- Build or automate: create a system or tool that does the work
- Stop doing: remove something that is costing time, money, or focus
- Validate first: test an assumption before committing to a full solution

SOLUTION QUALITY TEST (apply before finalizing each item):
- Is this specific enough to start today?
- Does it address the root cause Agent X named, not just the symptom?
- Does the effort level match the severity?
- Is the owner clear — founder, hire, contractor, or tool?`

  const goalSpecific = goalMode
    ? `\n\nGOAL PURSUIT MODE: The user has a specific goal. Your solutions must be sequenced to close the gap Agent X identified between current state and target state. The fastest path to the goal, not the most comprehensive solution, should come first.`
    : ''

  const format = `

OUTPUT FORMAT — use this exact structure. Stream it naturally, line by line:

SOLUTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each solution, use this block:]
[PRIORITY] ── [Short title]
Addresses: [specific Agent X finding]
[2-3 sentences: exactly what to do, how to do it, why it solves the root cause]
Effort: [hours | 1-2 days | this week | this month]
Owner: [founder | hire: role | tool: name | contractor]

STOP DOING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Things to cut, cancel, or stop. One line each. Be direct.]

EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [First action — most important]
2. [Second action]
3. [Third action]
[Continue as needed. Order matters — say why when non-obvious.]

CONTINGENT ON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Solutions that require a data gap to be filled before executing. Skip if none.]

PRIORITY GUIDE: IMMEDIATE = do today | HIGH = this week | MEDIUM = this month | BUILD = structural change`

  return core + goalSpecific + format
}

// ── Context builder ───────────────────────────────────────────────────────────

function buildUserMessage(query, agentXOutput, contextBlocks, conversationHistory) {
  const contextText = contextBlocks?.length
    ? contextBlocks.map((b) => `[${b.source.toUpperCase()}]\n${b.summary}`).join('\n\n')
    : 'No additional data available.'

  const historyText = conversationHistory?.length
    ? `\nPrior context:\n${conversationHistory.slice(-4).map((m) => `${m.role}: ${String(m.content).slice(0, 300)}`).join('\n')}`
    : ''

  return `Original query: ${query}
${historyText}

AGENT X DIAGNOSIS (treat as confirmed fact):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${agentXOutput}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Business context (for solution calibration):
${contextText}

Build the solution set. Follow the output format exactly. Every solution must map to a specific Agent X finding.`
}

// ── Streaming runner ──────────────────────────────────────────────────────────

export async function runAgentY({ query, agentXOutput, plan, contextBlocks, conversationHistory, apiKey, onToken }) {
  const systemPrompt = buildSystemPrompt(plan.intent)
  const userMessage  = buildUserMessage(query, agentXOutput, contextBlocks, conversationHistory)

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      SONNET_MODEL,
      max_tokens: 2000,
      stream:     true,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Agent Y API error ${response.status}`)
  }

  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''
  let   fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const event = JSON.parse(data)
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const token = event.delta.text
          fullText += token
          if (onToken) onToken(token)
        }
      } catch { /* skip malformed SSE events */ }
    }
  }

  return fullText
}
