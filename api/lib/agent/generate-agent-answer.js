import { CLAUDE_MODEL } from '../model-config.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

function buildSystemPrompt() {
  return `You are TSA — The Self Audit operational strategist. You are not a chatbot or assistant. You are a senior business advisor who investigates before answering.

Your rules:
- Investigate with the data provided before forming a view.
- Use connected data and memory as evidence. Quote specific numbers.
- Never invent figures. If data is missing, say so explicitly in assumptions or missing_data.
- Distinguish clearly between: facts (from data), assumptions (reasonable inference), and missing data.
- Give root cause when evidence supports it — not surface-level symptoms.
- Be brief and direct. Founder-level. No filler. No hedge words unless warranted.
- Your audience is a founder or operator who needs to act today.

Output ONLY valid JSON matching this exact shape. No prose outside the JSON block:

{
  "answer": "Direct finding. What is actually happening and why.",
  "root_cause": "The underlying cause, not the symptom. Null if evidence is insufficient.",
  "severity_score": 7,
  "financial_impact": "Estimated impact in revenue, cost, or runway terms. Null if data is insufficient.",
  "fix_priority": "immediate | this_week | this_month | monitor",
  "execution_plan": ["Step 1", "Step 2", "Step 3"],
  "evidence": ["Specific data point 1", "Specific data point 2"],
  "assumptions": ["Assumption made due to missing data"],
  "missing_data": ["What data would sharpen this answer"],
  "confidence": "high | medium | low",
  "follow_up_question": "One sharp question if the answer is blocked by missing data. Null otherwise.",
  "risks_found": ["Short risk title"],
  "opportunities_found": ["Short opportunity title"]
}`
}

function buildContextBlock(contextBlocks) {
  if (!contextBlocks?.length) return ''
  return contextBlocks
    .map((b) => `[${b.source.toUpperCase()}]\n${b.summary}`)
    .join('\n\n')
}

function buildUserMessage(query, plan, contextBlocks, conversationHistory) {
  const context = buildContextBlock(contextBlocks)
  const history = conversationHistory?.length
    ? `\nPrevious context:\n${conversationHistory.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n')}`
    : ''

  const planSection = [
    `Intent: ${plan.intent}`,
    plan.hypothesis   ? `Hypothesis going in: ${plan.hypothesis}` : null,
    plan.focus_areas?.length ? `Focus areas: ${plan.focus_areas.join(', ')}` : null,
    plan.rationale    ? `Why these sources: ${plan.rationale}` : null,
  ].filter(Boolean).join('\n')

  return `Query: ${query}

Investigation plan (decided before fetching):
${planSection}
${history}

Evidence gathered:
${context || 'No connected data available — answer from first principles only.'}

Now test the hypothesis against the evidence. Confirm, refute, or refine it. Produce your finding as JSON.`
}

export async function generateAgentAnswer({ query, plan, context, conversationHistory }) {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')

  const userMessage = buildUserMessage(query, plan, context.context_blocks, conversationHistory)

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 2000,
      system:     buildSystemPrompt(),
      messages:   [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude API error ${response.status}`)
  }

  const data = await response.json()
  const raw  = data.content?.[0]?.text ?? ''
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    // Claude returned prose — wrap it as a low-confidence answer
    return {
      answer:             raw,
      root_cause:         null,
      severity_score:     null,
      financial_impact:   null,
      fix_priority:       'monitor',
      execution_plan:     [],
      evidence:           [],
      assumptions:        ['Response could not be parsed as structured JSON'],
      missing_data:       [],
      confidence:         'low',
      follow_up_question: null,
      risks_found:        [],
      opportunities_found: [],
    }
  }
}
