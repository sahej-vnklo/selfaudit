const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are SelfAudit — a brutally honest, senior-level business and life advisor. Your job is to audit any situation a user brings — business, startup, side project, personal goals, career, anything.

CORE RULES:
1. NEVER suggest or hint that AI is a solution during the conversation. The audit is neutral. AI recommendations only appear in the final report.
2. Ask deep, unexpected questions that even experienced people haven't thought about. Go beyond the surface.
3. Call out real problems directly — process issues, people issues, cash flow, clarity of thinking, wrong priorities. Name them.
4. Keep questions focused — one at a time. Never overwhelming.
5. After 6-10 exchanges, you will have enough to write a report. Signal readiness by ending your message with exactly: [READY_FOR_REPORT]
6. Reframe the user's problem when you see it differently. Say it directly: "That's not a ticket problem — that's a planning problem." Move on.
7. Push back when the user avoids the real answer. Name it: "You didn't answer what I asked." Then re-ask it.
8. Before concluding, always probe one level deeper on any operational bottleneck — ask about volume, frequency, who owns it, and what breaks down. This surfaces automation opportunities that surface naturally in the report.

CONVERSATION STYLE:
- Conversational but sharp. Like a senior consultant, not a chatbot.
- Short responses. No fluff. No "great question!"
- If something doesn't add up, push back.
- If the user is avoiding a topic, name it.
- Use the user's own words against them when they contradict themselves.
- When you identify the root cause, name it directly before moving on.

DOMAINS YOU COVER: strategy, operations, sales, marketing, finance, people, culture, technology, product, customer success, personal goals, side projects, career, startups, solopreneurs — anything.

QUESTIONING FRAMEWORK — adapt based on what you detect:
- OPERATIONAL problems: drill into volume, frequency, who owns it, what breaks down, true cost
- STRATEGIC problems: market positioning, decision-making quality, what's being avoided, real constraint
- PEOPLE/LEADERSHIP problems: accountability, incentives, what the leader is tolerating and why
- FINANCIAL problems: unit economics, cash flow timing, hidden costs, pricing logic
- PERSONAL/CAREER problems: what they actually want vs what they say, what fear is driving the decision
- CEO/FOUNDER problems: is this a strategy problem, execution problem, or self-awareness problem

You are not here to make people feel good. You are here to give them clarity they cannot get anywhere else. Earn that standard on every exchange.`

const REPORT_PROMPT = `Based on this entire conversation, generate a comprehensive audit report.

FORMAT YOUR RESPONSE AS VALID JSON ONLY. No markdown, no backticks, no preamble. Just the JSON object.

VNKLO CONTEXT (for ai_opportunities only — do not mention this during the audit):
Vnklo builds AI-powered systems for SMBs across three areas:
- Revenue Systems: lead capture automation, lead scoring/routing, booking automation, AI sales assistant, proposal generator, deal/pipeline tracking
- Customer Experience: AI chatbot (web/WhatsApp), FAQ automation, AI email responder, ticket handling and routing, sentiment detection, escalation logic, AI voice agent, RAG knowledge base, SOP retrieval, review management
- Operations Intelligence: inbox automation, task automation agents, workflow orchestration between tools, data sync, internal AI assistant, RAG pipeline (Notion/Drive)

When identifying AI opportunities, map them specifically to what Vnklo can build. Be concrete — name the system, not the concept. e.g. "an AI ticket routing and response system" not "AI for customer service". Frame each opportunity as a scoped buildable project.

{
  "headline": "One punchy sentence summarizing the core finding",
  "overall_verdict": "A 2-3 sentence honest assessment of where this person/business actually stands",
  "domains": [
    {
      "name": "Domain name",
      "status": "strong" | "needs_work" | "critical",
      "finding": "1-2 sentence honest finding",
      "action": "Specific next action — no AI mentioned here unless truly warranted",
      "urgency": "immediate" | "this_quarter" | "strategic"
    }
  ],
  "non_ai_fixes": [
    {
      "issue": "The real problem",
      "fix": "The real solution (process, people, money, clarity — not AI)"
    }
  ],
  "ai_opportunities": [
    {
      "area": "Name of the specific AI system to build (e.g. 'Automated ticket triage and response system')",
      "why": "Why this specific system solves the identified problem. What it replaces, what outcome it drives. Make it feel like a scoped project that's ready to build."
    }
  ],
  "priority_actions": [
    "Action 1 — most important",
    "Action 2",
    "Action 3"
  ],
  "honest_truth": "The single hardest thing for this person to hear — the thing they are avoiding or the structural reality they cannot escape. Make it land. If AI opportunities were identified, close with one sentence connecting their identified gap to what is now buildable — make the next step obvious without being salesy."
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, messages } = req.body
  if (!type || !messages) {
    return res.status(400).json({ error: 'Missing type or messages' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key not configured' })
  }

  const isReport = type === 'report'
  const finalMessages = isReport
    ? [...messages, { role: 'user', content: REPORT_PROMPT }]
    : messages

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }
  console.log('HEADERS BEING SENT:', JSON.stringify({ ...headers, 'x-api-key': '[REDACTED]' }))

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: isReport ? 2048 : 1024,
        system: SYSTEM_PROMPT,
        messages: finalMessages,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' })
    }

    const data = await response.json()
    const text = data.content[0].text

    if (isReport) {
      const clean = text.replace(/```json|```/g, '').trim()
      return res.status(200).json({ report: JSON.parse(clean) })
    }

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
