// Agent planner — Step 1 of the multi-step reasoning loop.
// Claude (Haiku) reads the query, business snapshot, and available sources
// and decides what to investigate before any data is fetched.

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

// What each source contains — shown to the planning model so it can choose intelligently
const SOURCE_CATALOG = {
  company_brain:       'Business model, goals, revenue streams, known blockers, funnel stages, constraints, last audit headline',
  intelligence_brief:  'Synthesised financial metrics: MRR, ARR, churn rate, CAC, LTV, gross margin, burn rate, runway, NPS',
  recent_audits:       'Domain-level findings from the last 3 audits — what was flagged, root causes, which domains had issues',
  health_checks:       'Current business health score (0–100) and risk breakdown from the most recent automated health check',
  risk_alerts:         'Open risk flags not yet resolved — categorised by severity and domain',
  hubspot_pipeline:    'Live CRM pipeline: open deals, total pipeline value, average deal size, deals closing within 14 days',
  hubspot_contacts:    'CRM contacts: new leads this month, lifecycle stage breakdown, MQLs, SQLs, customer count',
}

// Messages that should get a conversational reply, not a full diagnosis
const CONVERSATIONAL_PATTERNS = [
  // Greetings
  /^(hi|hey|hello|howdy|hiya|yo|sup|good (morning|afternoon|evening))\b/i,
  // Acknowledgements / short replies
  /^(thanks?|thank you|ty|cheers|cool|ok|okay|got it|nice|great|perfect|sounds good|awesome|understood|makes sense|alright|sure|yep|nope|yes|no)\b/i,
  // Tests
  /^(test|testing|ping|check)\b/i,
  // Questions about the agents or system
  /^what does (agent|this|it|selfaudit)/i,
  /^what (is|are) (agent|this|selfaudit|you|your)/i,
  /^(who|what) are (you|the agents)/i,
  /^how (does|do) (agent|this|you|it|selfaudit)/i,
  /^(tell me about|explain|describe) (agent|this|selfaudit|yourself|how)/i,
  // Capability questions
  /^(how can (you|u) help|what can (you|u) do|what do (you|u) do)/i,
  /^(can (you|u) (help|tell|explain|show))/i,
  // Meta questions
  /^(how does this work|how do (you|u) work|what('?s| is) this)/i,
]

export function isConversational(query) {
  const q = String(query || '').trim()
  if (CONVERSATIONAL_PATTERNS.some((p) => p.test(q))) return true
  // Very short messages with no business keywords are conversational
  const businessKeywords = /\b(pipeline|revenue|churn|cash|sales|customer|product|team|hire|burn|runway|margin|cac|ltv|mrr|arr|metric|goal|problem|issue|broken|stuck|failing|struggling|growth|conversion)\b/i
  if (q.length < 30 && !businessKeywords.test(q)) return true
  return false
}

// Condensed business snapshot for the planning prompt — just enough context
// for the model to make good source choices without reading everything
function buildBrainSnapshot(brain) {
  if (!brain) return 'No business context available yet.'
  const lines = []
  if (brain.industry)            lines.push(`Industry: ${brain.industry}`)
  if (brain.core_offer)          lines.push(`Offers: ${brain.core_offer}`)
  if (brain.target_customer)     lines.push(`Sells to: ${brain.target_customer}`)
  if (brain.active_goal)         lines.push(`Active goal: ${brain.active_goal}`)
  if (brain.last_session?.headline) lines.push(`Last audit finding: ${brain.last_session.headline}`)
  if (brain.conversion_bottlenecks?.length)
    lines.push(`Known bottlenecks: ${brain.conversion_bottlenecks.slice(0, 2).join('; ')}`)
  if (brain.operational_blockers?.length)
    lines.push(`Known blockers: ${brain.operational_blockers.slice(0, 2).join('; ')}`)
  return lines.length ? lines.join('\n') : 'Business profile exists but is mostly empty.'
}

// ── Step 1: Claude decides what to investigate ────────────────────────────────

export async function planWithClaude(query, brain, availableSources, conversationHistory, apiKey) {
  const catalogLines = availableSources
    .map((s) => `- ${s}: ${SOURCE_CATALOG[s] || 'custom data source'}`)
    .join('\n')

  const historySnippet = conversationHistory?.length
    ? conversationHistory.slice(-2).map((m) => `${m.role}: ${m.content}`).join('\n')
    : ''

  const prompt = `You are TSA's investigation planner. Before any data is fetched, you decide which sources are actually relevant to the query.

BUSINESS SNAPSHOT:
${buildBrainSnapshot(brain)}

AVAILABLE SOURCES (only these exist — do not hallucinate others):
${catalogLines}

${historySnippet ? `RECENT CONVERSATION:\n${historySnippet}\n\n` : ''}QUERY: "${query}"

Rules:
- Pick only sources genuinely relevant to this specific query
- Fewer focused sources beat fetching everything
- company_brain is almost always worth including — it grounds the answer
- If the query is about revenue/pipeline/deals, include hubspot sources if available
- Use intent "goal_pursuit" when the user is asking how to achieve a future state, reach a target, or close a gap to a goal ("how do I get to", "hit $X", "reach X by", "want to achieve")
- Output ONLY valid JSON, no prose

{
  "sources_to_fetch": ["source_name"],
  "intent": "revenue_stuck | pipeline_issue | churn_issue | hiring_decision | pricing_decision | operations_bottleneck | goal_pursuit | general_strategy",
  "focus_areas": ["what specifically to look for in the data"],
  "hypothesis": "One sentence: what you expect the answer to be and why",
  "rationale": "Why these sources and not others"
}`

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Planner API error ${response.status}`)
  }

  const data  = await response.json()
  const raw   = data.content?.[0]?.text ?? ''
  const clean = raw.replace(/```json|```/g, '').trim()

  try {
    const plan = JSON.parse(clean)

    // Safety: only keep sources that actually exist
    plan.sources_to_fetch = (plan.sources_to_fetch ?? [])
      .filter((s) => availableSources.includes(s))

    // Always include company_brain if available and not already selected
    if (availableSources.includes('company_brain') && !plan.sources_to_fetch.includes('company_brain')) {
      plan.sources_to_fetch.unshift('company_brain')
    }

    // Fallback if model returned nothing useful
    if (plan.sources_to_fetch.length === 0) {
      plan.sources_to_fetch = ['company_brain', 'recent_audits'].filter((s) => availableSources.includes(s))
    }

    return {
      sources_to_fetch: plan.sources_to_fetch,
      intent:           plan.intent || 'general_strategy',
      focus_areas:      Array.isArray(plan.focus_areas) ? plan.focus_areas : [],
      hypothesis:       typeof plan.hypothesis === 'string' ? plan.hypothesis : null,
      rationale:        typeof plan.rationale  === 'string' ? plan.rationale  : null,
    }
  } catch {
    // Planner parse failure — use safe defaults rather than crashing
    return {
      sources_to_fetch: ['company_brain', 'recent_audits', 'risk_alerts'].filter((s) => availableSources.includes(s)),
      intent:           'general_strategy',
      focus_areas:      [],
      hypothesis:       null,
      rationale:        'Planner response could not be parsed — using safe defaults',
    }
  }
}

// ── Available source detection (unchanged) ────────────────────────────────────

export function getAvailableDataSources(userBrain, integrations) {
  const sources = ['company_brain', 'recent_audits', 'health_checks', 'risk_alerts']

  if (userBrain?.intelligence_summary || userBrain?.top_priorities?.length) {
    sources.push('intelligence_brief')
  }

  if (integrations?.hubspot?.access_token) {
    sources.push('hubspot_pipeline', 'hubspot_contacts')
  }

  return sources
}
