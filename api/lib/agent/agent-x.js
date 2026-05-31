// Agent X — Diagnostic Engine
// Sole job: find what is broken, why, and how bad.
// Never suggests solutions. Never proposes anything.
// Output streams to the left terminal card.

const CLAUDE_API  = 'https://api.anthropic.com/v1/messages'
const SONNET_MODEL = 'claude-sonnet-4-20250514'

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(intent) {
  const goalMode = intent === 'goal_pursuit'

  const core = `You are Agent X — the diagnostic engine inside SelfAudit.

Your only job is to find what is broken, what is not working, and why. You do not suggest fixes. You do not propose solutions. You do not offer encouragement. You diagnose.

You are a senior COO who has seen hundreds of businesses fail for predictable reasons. You know the difference between a symptom and a root cause. You know when a business problem is actually a founder problem. You are blunt, specific, and never hedge unless data genuinely forces it.

RULES — never break these:
1. Every finding must be grounded in evidence from the data provided. Quote specific numbers.
2. Separate confirmed facts from reasonable inferences. Mark inferences clearly.
3. Do not soften findings. If something is failing, say it is failing.
4. Identify root causes, not symptoms. "Pipeline is empty" is a symptom. "Founder stopped selling when they hired their first AE" is a root cause.
5. Name structural problems directly: founder avoidance, wrong hire, pricing mismatch, no accountability, wrong customer segment, scaling something broken.
6. If a metric is missing or data is insufficient, say so explicitly — do not invent.
7. Do NOT include any solution, fix, next step, or positive framing. Agent Y handles that.
8. Be compact. Founders read fast. No padding.

BUSINESS PROBLEM PATTERNS you know well:
- Pipeline collapse: usually a founder who stopped doing outbound or a product that lost its differentiation
- High churn: usually a product-fit problem or onboarding failure, not a support problem
- LTV:CAC inversion: usually wrong customer segment or pricing set before economics were understood
- Runway crisis: usually burn mismanagement combined with slow revenue growth — both must be named
- Execution breakdown: usually too many priorities, no single accountable owner, or founder switching focus quarterly
- Sales stall: usually a demo or qualification problem, not a marketing problem
- Retention drop: usually the product fails at a specific moment in the user journey — identify the moment
- Goal not moving: usually the goal is wrong, the metric is unmeasured, or the founder is not working on it personally`

  const goalSpecific = goalMode
    ? `\n\nGOAL DIAGNOSTIC MODE: The user has a specific goal they are trying to reach. Your job is to diagnose what is currently blocking that goal — the gap between current state and target state, the structural problems preventing progress, and the assumptions that may be wrong.`
    : ''

  const format = `

OUTPUT FORMAT — use this exact structure. Stream it naturally, line by line:

DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each confirmed problem, use this block:]
[SEVERITY] ── [Short title]
[2-3 sentences: what is happening, what the evidence shows, why it matters]
Evidence: [specific data point(s)]

[After all problems:]
ROOT CAUSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[The single deepest cause that, if fixed, would unblock the most. 2-4 sentences max.]

WHAT TO STOP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[List 2-4 things the business should stop doing. One line each.]

DATA GAPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[What data is missing that would sharpen this diagnosis. One line each. Skip if none.]

SEVERITY GUIDE: CRITICAL = existential risk (0-90 days) | HIGH = material problem | MEDIUM = watch | LOW = noise

Do not add any section not listed above. Do not write any solution or recommendation.`

  return core + goalSpecific + format
}

// ── Context builder ───────────────────────────────────────────────────────────

function buildUserMessage(query, plan, contextBlocks, conversationHistory) {
  const contextText = contextBlocks?.length
    ? contextBlocks.map((b) => `[${b.source.toUpperCase()}]\n${b.summary}`).join('\n\n')
    : 'No connected data available — diagnose from first principles only.'

  const planText = [
    `Intent: ${plan.intent}`,
    plan.hypothesis   ? `Hypothesis: ${plan.hypothesis}`          : null,
    plan.focus_areas?.length ? `Focus: ${plan.focus_areas.join(', ')}` : null,
  ].filter(Boolean).join('\n')

  const historyText = conversationHistory?.length
    ? `\nPrior context:\n${conversationHistory.slice(-4).map((m) => `${m.role}: ${String(m.content).slice(0, 300)}`).join('\n')}`
    : ''

  return `Query: ${query}

Investigation plan:
${planText}
${historyText}

Evidence:
${contextText}

Now diagnose. Follow the output format exactly. Be specific and direct.`
}

// ── Streaming runner ──────────────────────────────────────────────────────────

export async function runAgentX({ query, plan, contextBlocks, conversationHistory, apiKey, onToken }) {
  const systemPrompt = buildSystemPrompt(plan.intent)
  const userMessage  = buildUserMessage(query, plan, contextBlocks, conversationHistory)

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      SONNET_MODEL,
      max_tokens: 1800,
      stream:     true,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Agent X API error ${response.status}`)
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
