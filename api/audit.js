// v2 - serverless only
//
// SAFETY/CONTROL LAYER (Layer 4):
// - Only analyze what the user provides
// - Do not invent company data
// - Work with partial info — ask only when it blocks a decision
// - Mark assumptions explicitly
// - User stays in control of what gets analyzed
// - No auto-actions to external tools yet (execution is copy-ready drafts)
// - Store feedback on user acceptance/rejection for future improvement

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { fetchHubspotBusinessState } from './lib/connectors/hubspot.js'
import { normalizeHubspotData, formatNormalizedForPrompt } from './lib/connectors/normalize.js'
import { getCompanyBrain, formatBrainForPrompt } from './lib/intelligence/company-brain.js'
import { getUserPlan } from './lib/plans.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function fetchBusinessState(userId) {
  if (!userId) return ''
  try {
    const brain = await getCompanyBrain(userId)
    return formatBrainForPrompt(brain)
  } catch {
    return ''
  }
}

async function fetchPatterns(industry, domain) {
  if (!industry && !domain) return ''
  try {
    let query = supabase
      .from('patterns')
      .select('root_causes, actions_given, industry, domain')
      .order('created_at', { ascending: false })
      .limit(8)

    if (industry) query = query.eq('industry', industry)
    if (domain)   query = query.eq('domain', domain)

    const { data } = await query
    if (!data?.length) return ''

    const lines = ['PATTERN INTELLIGENCE (what fixed similar problems in this industry/domain):']
    for (const row of data) {
      const cause = row.root_causes?.[0]
      const fix = row.actions_given?.[0]
      if (cause && fix) lines.push(`- ${cause} → fixed by: ${fix}`)
    }
    lines.push('')
    lines.push('Use these patterns to sharpen your diagnosis. If you see a matching root cause, reference that this pattern has appeared before and what resolved it.')
    return lines.join('\n')
  } catch {
    return ''
  }
}

async function fetchConnectorContext(userId, supabase) {
  if (!userId) return ''
  try {
    const plan = await getUserPlan(userId, supabase)
    if (plan !== 'intelligence') return ''

    const { data } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', userId)
      .single()

    if (!data?.integrations?.hubspot?.access_token) return ''

    const hubspotData = await fetchHubspotBusinessState(userId, data.integrations)
    if (!hubspotData) return ''

    const normalized = normalizeHubspotData(hubspotData)
    return formatNormalizedForPrompt(normalized)
  } catch {
    return ''
  }
}

async function fetchIntelligenceBrief(userId) {
  if (!userId) return ''
  try {
    const { data } = await supabase
      .from('intelligence_brief')
      .select('financial, operational, context')
      .eq('user_id', userId)
      .single()

    if (!data) return ''

    const lines = ['INTELLIGENCE BRIEF (hard verified numbers — treat these as ground truth, not assumptions):']

    const f = data.financial || {}
    const o = data.operational || {}
    const c = data.context || {}

    if (f.mrr) lines.push(`MRR: $${Number(f.mrr).toLocaleString()}`)
    if (f.arr) lines.push(`ARR: $${Number(f.arr).toLocaleString()}`)
    if (f.gross_margin) lines.push(`Gross margin: ${f.gross_margin}%`)
    if (f.cac) lines.push(`CAC: $${f.cac}`)
    if (f.ltv) lines.push(`LTV: $${f.ltv} (LTV:CAC ratio: ${f.cac ? (f.ltv / f.cac).toFixed(1) : 'unknown'})`)
    if (f.churn) lines.push(`Monthly churn: ${f.churn}%`)
    if (f.burn_rate) lines.push(`Monthly burn: $${Number(f.burn_rate).toLocaleString()}`)
    if (f.runway || c.runway) lines.push(`Runway: ${f.runway || c.runway} months`)
    if (o.headcount) lines.push(`Headcount: ${o.headcount}`)
    if (o.active_customers) lines.push(`Active customers: ${o.active_customers}`)
    if (o.nps) lines.push(`NPS: ${o.nps}`)
    if (o.sales_cycle) lines.push(`Sales cycle: ${o.sales_cycle} days`)
    if (c.funding_stage) lines.push(`Funding stage: ${c.funding_stage}`)
    if (c.competitors) lines.push(`Competitors: ${c.competitors}`)
    if (c.biggest_risk) lines.push(`Stated biggest risk: ${c.biggest_risk}`)
    if (c.current_focus) lines.push(`Current focus: ${c.current_focus}`)

    if (lines.length === 1) return ''

    lines.push('')
    lines.push('Use these numbers directly in your analysis. Do not ask for information already provided here. Flag any metrics that indicate structural problems (e.g. LTV:CAC below 3x, churn above 5% monthly, burn with less than 6 months runway).')

    return lines.join('\n')
  } catch {
    return ''
  }
}

async function fetchUserMemory(userId) {
  if (!userId) return ''
  try {
    const lines = ['USER MEMORY (most recent first):']
    let hasMemory = false

    // Pull structured memory from user_memory table (Layer 4)
    const { data: memoryRows } = await supabase
      .from('user_memory')
      .select('session_date, headline, core_problem, root_causes, priority_actions, ai_opportunities, domains_audited, business_state, ranked_path, status')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(3)

    if (memoryRows?.length > 0) {
      hasMemory = true
      for (const row of memoryRows) {
        lines.push('')
        const date = row.session_date ? new Date(row.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
        const normalizedStatus = typeof row.status === 'string' ? row.status.trim().toLowerCase() : ''
        const unresolved = normalizedStatus && normalizedStatus !== 'done' && normalizedStatus !== 'resolved'
        lines.push(`[Audit — ${date}${row.status === 'done' ? ' — resolved' : unresolved ? ' — unresolved' : ''}]`)
        if (row.headline)         lines.push(`Finding: ${row.headline}`)
        if (row.core_problem)     lines.push(`Core problem: ${row.core_problem}`)
        if (row.root_causes?.length)     lines.push(`Root causes: ${row.root_causes.join('; ')}`)
        if (row.priority_actions?.length) lines.push(`Actions given: ${row.priority_actions.join('; ')}`)
        if (row.domains_audited?.length)  lines.push(`Domains audited: ${row.domains_audited.join(', ')}`)
        if (row.business_state?.goal_state) lines.push(`Goal state: ${row.business_state.goal_state}`)
        if (row.business_state?.gap)        lines.push(`Gap identified: ${row.business_state.gap}`)
        if (unresolved) lines.push('Follow-up status: previous actions still appear unresolved')
        if (row.ranked_path?.length > 0) {
          const top = row.ranked_path[0]
          if (top?.move) lines.push(`Top ranked move: ${top.move} (${top.impact ?? ''} impact, ${top.urgency ?? ''})`)
        }
      }
    }

    // Fall back to legacy profiles.context if no structured memory
    if (!hasMemory) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('context')
        .eq('id', userId)
        .single()

      const context = profileData?.context ?? ''
      if (context) {
        const entries = context.split(/(?=\[Audit — )/).map(s => s.trim()).filter(Boolean)
        const recent = entries.slice(-3).reverse()

        for (const entry of recent) {
          lines.push('')
          const headerMatch = entry.match(/\[Audit — ([^\]]+)\]/)
          if (!headerMatch) {
            const firstLine = entry.split('\n')[0].slice(0, 120)
            if (firstLine) { lines.push(firstLine); hasMemory = true }
            continue
          }

          hasMemory = true
          const headerParts = headerMatch[1].split(' — ')
          const date = headerParts[0] ?? ''
          const mode = headerParts[1] ?? ''
          const ctx  = headerParts.slice(2).join(' — ')
          lines.push(`[${[date, mode, ctx].filter(Boolean).join(' — ')}]`)

          for (const line of entry.split('\n').slice(1)) {
            const l = line.trim()
            if (!l || l.startsWith('Status:')) continue
            if (l.startsWith('Headline:'))             lines.push(`Finding:${l.slice(9)}`)
            else if (l.startsWith('Root causes found:')) lines.push(`Root causes:${l.slice(18)}`)
            else if (l.startsWith('Key actions given:')) lines.push(`Actions given:${l.slice(18)}`)
            else lines.push(l)
          }
        }
      }
    }

    if (!hasMemory) return ''

    lines.push('')
    lines.push('MEMORY RULES:')
    lines.push('- Reference past findings naturally when relevant: "Last time we identified X — has that changed?"')
    lines.push('- Do not re-ask questions already answered in past sessions')
    lines.push('- If the user\'s stated problem contradicts past findings, surface the contradiction directly')
    lines.push('- If this is their 2nd+ audit, open with one sentence referencing a specific past finding')

    return lines.join('\n')
  } catch {
    return ''
  }
}

function clipPromptLine(value, max = 240) {
  if (typeof value !== 'string') return ''
  const clean = value.replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean
}

function buildSessionContinuity(messages) {
  if (!Array.isArray(messages) || messages.length < 2) return ''

  const normalized = messages
    .filter(msg => msg && (msg.role === 'user' || msg.role === 'assistant'))
    .map(msg => ({ role: msg.role, content: clipPromptLine(msg.content, msg.role === 'user' ? 260 : 220) }))
    .filter(msg => msg.content)

  if (normalized.length < 2) return ''

  const userMessages = normalized.filter(msg => msg.role === 'user')
  const assistantMessages = normalized.filter(msg => msg.role === 'assistant')
  if (userMessages.length === 0) return ''

  const firstUser = userMessages[0]?.content
  const latestUser = userMessages[userMessages.length - 1]?.content
  const previousUserFacts = userMessages
    .slice(Math.max(0, userMessages.length - 4), Math.max(0, userMessages.length - 1))
    .map(msg => msg.content)
    .filter(Boolean)
  const latestAssistant = assistantMessages[assistantMessages.length - 1]?.content

  const lines = ['CURRENT SESSION CONTINUITY (highest priority context for this reply):']

  if (firstUser) lines.push(`Original issue raised this session: ${firstUser}`)

  if (previousUserFacts.length > 0) {
    lines.push('User has already said this in the current session:')
    for (const fact of previousUserFacts) lines.push(`- ${fact}`)
  }

  if (latestAssistant) lines.push(`Last assistant question or direction: ${latestAssistant}`)
  if (latestUser && latestUser !== firstUser) lines.push(`Latest user answer: ${latestUser}`)

  lines.push('')
  lines.push('SESSION RULES:')
  lines.push('- Continue from this exact point. Do not restart or recap generically.')
  lines.push('- Do not ask the user to repeat facts already stated in this session.')
  lines.push('- If you revisit an earlier fact, reference it directly and go one level deeper.')

  return lines.join('\n')
}

function buildSystemPrompt(industry, domain, intelligenceBrief, userMemory, goalMode, goal, goalTimeline, goalBaseline, businessState, patterns, connectorContext, sessionContinuity) {
  const base = `You are SelfAudit — a brutally honest, senior-level business and life advisor. Your job is to audit any situation a user brings — business, startup, side project, personal goals, career, anything.

CORE RULES:
1. NEVER suggest or hint that AI is a solution during the conversation. The audit is neutral. AI recommendations only appear in the final report.
2. Ask deep, unexpected questions that even experienced people haven't thought about. Go beyond the surface.
3. Call out real problems directly — process issues, people issues, cash flow, clarity of thinking, wrong priorities. Name them.
4. Keep questions focused — one at a time. Never overwhelming.
5. After 6-10 exchanges, you will have enough to write a report. Signal readiness by ending your message with exactly: [READY_FOR_REPORT]
6. Reframe the user's problem when you see it differently. Say it directly: "That's not a ticket problem — that's a planning problem." Move on.
7. Push back when the user avoids the real answer. Name it: "You didn't answer what I asked." Then re-ask it. Exception: do NOT apply this in EXECUTION or HUMAN_MOMENT mode — in those modes the user is not avoiding anything. They've made a decision. Respect it.
8. Before concluding, always probe one level deeper on any operational bottleneck — ask about volume, frequency, who owns it, and what breaks down. This surfaces automation opportunities that surface naturally in the report. Exception: skip this in EXECUTION or HUMAN_MOMENT mode.

CONVERSATION MODE DETECTION — read this before every response:

After the first exchange, classify the conversation into one of three modes and behave accordingly for the rest of the conversation:

MODE 1: DIAGNOSTIC
User has an unsolved problem. Something is broken or unclear. They need diagnosis.
Signals: "we're struggling with", "I don't know why", "keeps happening", "trying to figure out", "what should I do about"
Behaviour: Run the full onion-peeling framework. Ask deep questions. Find root cause. Current behaviour.

MODE 2: EXECUTION
Decision is already made. User needs help executing it well, not re-examining it.
Signals: "deal is done", "I've decided", "we're closing", "I'm selling", "already chose", "happening in X weeks", "signed the papers", "closing in"
Behaviour: STOP diagnosing. Don't question the decision. Don't reframe it as a problem. Ask what they need to execute this well. Help them think through the execution clearly.

MODE 3: HUMAN_MOMENT
Emotional weight is present. User is carrying something hard. They need to be heard before they need to be helped.
Signals: "telling my employees", "letting people go", "100 people", "don't know how to tell them", "hardest thing", "shutting down", "I built this", grief, fear, responsibility for others
Behaviour:
- Lead with ONE sentence of genuine human acknowledgment. Not therapy. Not over the top. Just honest recognition of what they're carrying. Example: "That's a weight most people don't talk about — you're thinking about 100 people's lives, not just a transaction."
- Then ask ONE practical question to understand what kind of support they actually need: delivery, timing, what to say, how to handle reactions.
- Do NOT interrogate. Do NOT reframe. Do NOT lecture. Do NOT tell them they're thinking about it wrong.
- They came for help executing something hard, not for a diagnosis.

IMPORTANT: Modes 2 and 3 often appear together. A business sale with employees being let go is both EXECUTION and HUMAN_MOMENT. In this case: acknowledge first (HUMAN_MOMENT), then support execution (EXECUTION). Never switch to DIAGNOSTIC mode once EXECUTION or HUMAN_MOMENT is detected.

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

  const goalBlock = goalMode ? `

GOAL CONTEXT:
User's goal: ${goal}
Timeline: ${goalTimeline}
Current baseline: ${goalBaseline || 'not provided'}

BUSINESS STATE MODEL — build and maintain this internally throughout the conversation:
As the user shares information, populate this internal model:
  revenue_streams: list of active revenue sources
  core_offer: what they sell and to whom
  target_customer: who buys and why
  funnel_stages: how deals/users move from awareness to paid
  conversion_bottlenecks: where they lose people
  retention_churn_signals: what causes drop-off or repeat purchase
  team_ownership: who owns what, headcount, key gaps
  operational_blockers: what slows them down day to day
  pricing_structure: how they price, tiers, discounts
  current_constraints: cash, time, people, market
  stated_goal: ${goal}
  baseline_current_position: ${goalBaseline || 'not provided — ask early'}
  assumptions_unverified: anything you inferred but haven't confirmed

Populate each field from conversation. Leave blank only if genuinely not discussed.
Mark inferences explicitly: e.g. "Assuming ~$X MRR based on their description — not confirmed."

LAYER 2 RULES (GOAL MODE):

You are running a GAP AUDIT, not a problem chat.

1. Build the business-state model above from the conversation. Update it as you learn more.
2. Compare current state vs goal explicitly. Name the gap — not vaguely, but specifically:
   - FAIL: "pricing is wrong"
   - PASS: "missing usage-based tier in pricing model — current flat rate caps revenue at existing seat count"
3. Identify MISSING CAPABILITIES — what the business literally lacks to reach the goal:
   - Not "improve onboarding"
   - But "missing automated activation sequence: no in-app trigger for users who don't complete setup in 48h"
4. Rank by IMPACT (for this goal), URGENCY (given timeline), COST (to fix), DEPENDENCY (what blocks what).
   Explain why one move outranks another — not just the ranking, the reasoning.
5. Provide a HONEST TIMELINE REALITY CHECK. If their timeline is unrealistic, say it directly and explain why.
   Do not soften it. "Doubling revenue in 2 weeks is not achievable — this is a 90-day restructure at minimum."
6. Work with PARTIAL INFO. If something is missing, mark it as an assumption and proceed with the best-supported
   recommendation. Only ask for clarification when it blocks a real decision.
7. You are producing a DECISION-GRADE GAP ANALYSIS. Behave like a structured consultant, not a freeform chatbot.
8. Opening message must reference their specific goal and timeline: "So you want to [goal] by [timeline] — let's map where you actually are."
9. priority_actions in the report must be ranked by "what moves this specific goal fastest" — not by severity.
10. honest_truth must close: "To hit [their goal] by [their timeline], the single most important move is [specific action]."` : ''

  const scopeBlock = (!industry || !domain) ? '' : `

AUDIT CONTEXT:
Industry: ${industry}
Audit domain: ${domain}

Stay focused on ${domain} for a ${industry} business throughout. Do not question or challenge what type of business the user runs.

If the user raises something from a completely different industry: acknowledge it in one sentence, ask one sharp ${domain}-focused question, and end your message with [SCOPE_LIMIT] on its own line.

[SCOPE_LIMIT] must fire every time you redirect scope. Never add it otherwise.`

  const persistentContextExists = !!(userMemory || businessState || intelligenceBrief || connectorContext)
  const openingRule = persistentContextExists ? `

OPENING RULE (memory exists — this overrides all other opening instructions):
Your next message should reference one specific known finding, goal, or constraint from the persistent context above when doing so fits naturally.
Use this exact format: "[Specific past finding] — is that still the main thing you're working on, or has something shifted?"
Examples: "Last time we flagged your demo-to-close rate dropping — has that moved?" or "You were working on hitting $100k MRR — are you still on that path, or has the focus changed?"
Do NOT open with "How can I help", "What are you working on", or any generic question. You already know this business. Act like it.` : ''

  const intelligenceBriefBlock = intelligenceBrief ? `\n\n---\n${intelligenceBrief}` : ''
  const memoryBlock = userMemory ? `\n\n---\n${userMemory}` : ''
  const businessStateBlock = businessState ? `\n\n---\n${businessState}` : ''
  const patternsBlock      = patterns      ? `\n\n---\n${patterns}`       : ''
  const connectorBlock = connectorContext ? `\n\n---\nCONNECTOR DATA\n${connectorContext}` : ''
  const sessionContinuityBlock = sessionContinuity ? `\n\n---\n${sessionContinuity}` : ''
  const contextPriorityBlock = `

CONTEXT PRIORITY:
1. Current session continuity and the user's latest answer
2. Verified numbers or live connector data
3. Company intelligence accumulated across prior audits
4. Recent user memory from prior sessions
5. General patterns from similar companies

If two sources conflict, do not ignore it. Name the contradiction and ask one direct clarifying question.`

  return base + goalBlock + scopeBlock + intelligenceBriefBlock + businessStateBlock + memoryBlock + patternsBlock + connectorBlock + sessionContinuityBlock + contextPriorityBlock + openingRule
}

function buildReportPrompt(goalMode) {
  const goalGapField = goalMode ? `,
  "goal_gap_analysis": {
    "goal": "Restate their specific goal in one clear, concrete sentence",
    "current_position": "Honest 1-2 sentence assessment of where they actually stand right now relative to that goal",
    "gap": "What specific capabilities, systems, or changes are missing to reach the goal. Be precise — name the actual missing thing, not the category.",
    "fastest_path": "The 2-3 moves that close the gap fastest. Name the actual move, not the category. PASS: 'Rebuild onboarding to activate users in under 10 minutes via in-app trigger sequence.' FAIL: 'Improve onboarding.'",
    "realistic_timeline": "Honest narrative on whether their stated timeline is achievable and why. Do not soften if unrealistic."
  },
  "business_state": {
    "revenue_streams": ["list of active revenue sources from conversation"],
    "core_offer": "what they sell, to whom, and at what price — from conversation",
    "target_customer": "who buys and why — from conversation",
    "funnel_stages": ["stages from awareness to paid — from conversation"],
    "conversion_bottlenecks": ["where they lose people — from conversation"],
    "retention_churn_signals": ["what causes drop-off or repeat purchase — from conversation"],
    "team_ownership": "who owns what, headcount, key gaps — from conversation",
    "operational_blockers": ["what slows them down day to day — from conversation"],
    "pricing_structure": "how they price, tiers, discounts — from conversation",
    "current_constraints": ["cash, time, people, market constraints — from conversation"],
    "assumptions_unverified": ["anything inferred but not confirmed — flag these explicitly, e.g. 'Assuming ~$X MRR based on description — not confirmed'"]
  },
  "missing_capabilities": [
    "One specific missing capability per item. PASS: 'Automated email sequence triggered when trial user hasn't set up integration after 48h.' FAIL: 'Better email marketing.'"
  ],
  "ranking_logic": {
    "impact": "high | medium | low — for reaching the stated goal specifically",
    "urgency": "immediate | this_quarter | strategic — given the stated timeline",
    "cost": "low | medium | high — estimated effort and resource cost to fix",
    "dependency": "what this move is blocked by, or 'none'"
  },
  "timeline_feasibility": "feasible | tight | unrealistic — [one sentence explaining exactly why, referencing their goal and timeline directly]",
  "confidence_level": "high | medium | low — [one sentence: what evidence this is based on and what's missing]"` : ''

  const goalGapInstruction = goalMode ? `

GOAL MODE REPORT RULES — ALL of these are required when goalMode is active:

1. goal_gap_analysis: include with all 5 sub-fields populated
2. business_state: extract from conversation — use "not discussed" only if genuinely absent; flag inferences in assumptions_unverified
3. missing_capabilities: list specific missing capabilities — not categories, not advice. Each item must name the actual thing that doesn't exist yet.
4. ranking_logic: assess the top-priority gap by impact/urgency/cost/dependency
5. timeline_feasibility: must start with exactly "feasible", "tight", or "unrealistic" then a dash then one honest sentence
6. confidence_level: must start with exactly "high", "medium", or "low" then a dash then one sentence on evidence basis
7. priority_actions: ranked by "what moves this specific goal fastest"
8. honest_truth: must close with "To hit [their goal] by [their timeline], the single most important move is [specific action]."

SPECIFICITY REQUIREMENT: Every finding must name the actual thing, not the category.
SAFETY: Only use what the user told you. Flag assumptions. Do not invent data.` : ''

  return `Based on this entire conversation, generate a report.

FORMAT YOUR RESPONSE AS VALID JSON ONLY. No markdown, no backticks, no preamble. Just the JSON object.

REPORT GENERATION RULES:

First, classify the conversation that just happened:
- DIAGNOSTIC: User had a problem to solve. Root cause analysis was needed.
- EXECUTION: Decision was already made. User needed execution support.
- HUMAN_MOMENT: User was carrying something emotionally hard. Human acknowledgment and practical support was needed.
- EXECUTION_HUMAN: Both EXECUTION and HUMAN_MOMENT applied.

Then generate the appropriate report JSON based on the mode:

IF DIAGNOSTIC — generate this structure:

VNKLO CONTEXT (for ai_opportunities only):
Vnklo builds AI-powered systems for SMBs across three areas:
- Revenue Systems: lead capture automation, lead scoring/routing, booking automation, AI sales assistant, proposal generator, deal/pipeline tracking
- Customer Experience: AI chatbot (web/WhatsApp), FAQ automation, AI email responder, ticket handling and routing, sentiment detection, escalation logic, AI voice agent, RAG knowledge base, SOP retrieval, review management
- Operations Intelligence: inbox automation, task automation agents, workflow orchestration between tools, data sync, internal AI assistant, RAG pipeline (Notion/Drive)

Write ai_opportunities as a senior advisor laying out what is now buildable for a business like theirs — proactive, concrete, confident. Do not write "based on what you shared" or "you mentioned". Each opportunity should read as a natural, forward-looking recommendation. Name the specific system, not the category. Be direct.

{
  "conversation_mode": "DIAGNOSTIC",
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
      "area": "Name of the specific system (e.g. 'Automated lead scoring and routing system')",
      "why": "A forward-looking recommendation — what this system does, what it replaces, and what outcome it drives for a business at this stage. Written as confident advice, not a reaction to the conversation."
    }
  ],
  "priority_actions": [
    "Action 1 — most important",
    "Action 2",
    "Action 3"
  ],
  "business_state": {
    "current_state": "2-sentence description of where the business actually is right now — not what they say, what you observed.",
    "goal_state": "What they're trying to reach. Name it in concrete terms.",
    "gap": "The specific missing capabilities or decisions standing between current and goal. Name them directly, no fluff.",
    "missing_capabilities": ["Capability 1", "Capability 2", "Capability 3"]
  },
  "ranked_path": [
    {
      "move": "The specific action or change",
      "impact": "high",
      "urgency": "immediate",
      "cost": "low",
      "dependency": null,
      "rationale": "One sentence: why this ranks here."
    }
  ],
  "timeline_reality": {
    "goal_timeline_stated": "What timeline they mentioned or implied, if any.",
    "assessment": "feasible",
    "honest_take": "One sentence: what's actually achievable and why.",
    "assumptions": ["Assumption 1 that could break this", "Assumption 2"]
  },
  "forward_trajectory": {
    "dimension": "financial | operational | sales | people | strategic | personal",
    "horizon": "6 months",
    "summary": "One direct sentence on what compounds if nothing changes versus what becomes more likely if the top move is executed.",
    "if_current_path_continues": "What likely happens if they stay on the current path. Use probability language. Use numbers only if supported by the conversation or Intelligence Brief.",
    "if_top_recommendation_is_executed": "What likely happens if they execute the top-ranked move. Tie this to the actual move, not generic improvement.",
    "comparison_points": [
      {
        "metric": "The consequence dimension being compared, e.g. LTV:CAC, close rate, error rate, team trust, decision speed, burnout risk",
        "current_path": "Expected trajectory if nothing changes",
        "recommended_path": "Expected trajectory if the top move is executed"
      }
    ],
    "confidence_note": "One sentence explaining what evidence supports this trajectory and where uncertainty remains."
  },
  "honest_truth": "The single hardest thing for this person to hear — the thing they are avoiding or the structural reality they cannot escape. Make it land. If AI opportunities were identified, close with one sentence connecting their identified gap to what is now buildable — make the next step obvious without being salesy."
  ${goalGapField}
}

DIAGNOSTIC LAYER 2 FIELD RULES (apply only when generating DIAGNOSTIC reports):

business_state:
- Always populate all 4 sub-fields, even with partial information
- If a field is inferred rather than stated, append " [assumption]" to that value
- missing_capabilities must list specific things that don't exist yet — not categories, not advice
- Example pass: "No automated follow-up sequence after proposal sent [assumption]"
- Example fail: "Better sales process"

ranked_path:
- Minimum 3 moves, maximum 6
- Order by combined impact + urgency score (high impact + immediate urgency ranks highest)
- impact: "high" | "medium" | "low"
- urgency: "immediate" | "this_quarter" | "strategic"
- cost: "low" | "medium" | "high"
- dependency: what must be true first, or null if none
- rationale: one sentence explaining why this ranks where it does

timeline_reality:
- Always present — even if no timeline was mentioned
- If no timeline was stated: set goal_timeline_stated to "not mentioned" and assess based on complexity observed
- assessment must be exactly "feasible", "tight", or "unrealistic"
- honest_take: one direct sentence — do not soften if unrealistic

forward_trajectory:
- Always present in DIAGNOSTIC mode
- Compare exactly two futures: "if current path continues" vs "if top recommendation is executed"
- Choose the consequence dimension that matters most for this audit: financial, operational, sales, people, strategic, or personal
- Use numbers only when they are actually supported by the conversation, Intelligence Brief, or connector data
- If hard metrics are not supported, still populate comparison_points using directional consequences rather than invented numbers
- Use cautious language: likely, probably, at risk of, more likely to, less likely to
- Tie the upside path to the top-ranked move, not to generic advice
- confidence_note must explain the evidence basis and uncertainty directly

These 4 fields (business_state, ranked_path, timeline_reality, forward_trajectory) appear ONLY in DIAGNOSTIC mode.
EXECUTION and HUMAN_MOMENT reports must NOT include them.

IF EXECUTION — generate this structure. ALL six fields are required. Do not omit any field.

{
  "conversation_mode": "EXECUTION",
  "headline": "One sentence naming what they're executing and the core challenge in doing it well",
  "execution_context": "2-3 sentences. What they're navigating. Name it clearly without judgment.",
  "delivery_plan": [
    { "step": 1, "action": "Schedule a direct conversation with your leadership team before any wider announcement", "why": "Surprises at the top destroy trust faster than the news itself. Give them time to process before they have to manage others." },
    { "step": 2, "action": "Prepare a one-page written summary of the timeline and what it means for each team", "why": "People ask the same questions in a crisis. Having answers ready in writing reduces panic and gives them something to hold." }
  ],
  "what_to_expect": "What will likely happen when they execute this. Reactions, questions, complications. Prepare them for the real shape of it.",
  "key_message": "The single most important thing they need to communicate. One sentence.",
  "forward_trajectory": {
    "dimension": "financial | operational | sales | people | strategic | personal",
    "horizon": "30-90 days",
    "summary": "Optional. Only include when there is a meaningful execution consequence to compare, such as timing, rollout quality, customer risk, team impact, or operational drag.",
    "if_current_path_continues": "Optional. What likely happens if they execute poorly, delay, or keep the current execution approach.",
    "if_top_recommendation_is_executed": "Optional. What likely happens if they execute the strongest recommendation well.",
    "comparison_points": [
      {
        "metric": "The key consequence being compared",
        "current_path": "Likely outcome under current execution path",
        "recommended_path": "Likely outcome under stronger execution path"
      }
    ],
    "confidence_note": "Optional. One sentence on evidence and uncertainty."
  },
  "honest_truth": "Validation or the one thing they need to hear to do this well."
}

ALL six core fields above are required. delivery_plan must contain at least two concrete steps with real action and why text, not placeholders.

EXECUTION forward_trajectory rules:
- Include forward_trajectory only when there is a real consequence worth comparing between execution paths
- Good examples: delayed customer communication vs immediate communication, sloppy rollout vs disciplined rollout, no handoff plan vs clear handoff plan
- If included, keep it short, practical, and tied to execution quality or timing
- If there is no meaningful compare-able consequence, omit forward_trajectory entirely

IF HUMAN_MOMENT or EXECUTION_HUMAN — generate this structure. ALL six fields are required. Do not omit any field.

{
  "conversation_mode": "HUMAN_MOMENT",
  "headline": "One sentence that names what they're actually carrying — human and direct",
  "acknowledgment": "Genuine recognition of what this situation actually is. Not therapy speak. Not corporate. Just honest. 2-3 sentences.",
  "what_this_actually_is": "Name the real situation clearly. What they're navigating. What makes it hard. What makes it right that they're thinking carefully about it.",
  "delivery_script": "Something like this:\n\n\"I want to be straight with you about where things stand. [Continue with 3-5 sentences of actual words in first person that the person could say out loud. Make it human, not corporate. Not bullet points — write it as a continuous spoken paragraph.]\"",
  "what_to_expect": "The human reactions they'll face. How to hold the room. What questions will come. How to handle them with dignity.",
  "honest_truth": "The one thing that matters most. Often: they're doing the right thing by thinking this carefully. Name it directly."
}

ALL six fields above are required. Do not skip delivery_script or what_to_expect. delivery_script must contain actual words the person can say, written out in first person as a continuous paragraph, not bullet points. It must start with 'Something like this:' followed by a newline and the actual script in quotes.

CRITICAL RULES FOR NON-DIAGNOSTIC REPORTS:
- NO "Fix These First" section
- NO AI opportunities section
- NO domain findings with status ratings
- NO priority actions list
- The report is not a diagnostic. It is support for a human navigating something real.${goalGapInstruction}`
}

function normalizeGoalReport(report) {
  return {
    ...report,
    report_family: 'GOAL',
    conversation_mode: 'GOAL_GAP',
  }
}

function validateGoalReport(report) {
  const issues = []
  const gap = report.goal_gap_analysis
  const feasibility = typeof report.timeline_feasibility === 'string' ? report.timeline_feasibility.trim().toLowerCase() : ''

  if (!gap || typeof gap !== 'object' || Array.isArray(gap)) issues.push('goal_gap_analysis')
  if (!Array.isArray(report.missing_capabilities)) issues.push('missing_capabilities')
  if (!Array.isArray(report.priority_actions)) issues.push('priority_actions')
  if (!report.ranking_logic || typeof report.ranking_logic !== 'object' || Array.isArray(report.ranking_logic)) issues.push('ranking_logic')
  if (typeof report.timeline_feasibility !== 'string' || !report.timeline_feasibility.trim()) issues.push('timeline_feasibility')
  if (feasibility && !(feasibility.startsWith('feasible') || feasibility.startsWith('tight') || feasibility.startsWith('unrealistic'))) {
    issues.push('timeline_feasibility_format')
  }
  if (typeof report.confidence_level !== 'string' || !report.confidence_level.trim()) issues.push('confidence_level')
  if (typeof report.honest_truth !== 'string' || !report.honest_truth.trim()) issues.push('honest_truth')

  return issues
}

function validateForwardTrajectory(forwardTrajectory, { required = false } = {}) {
  if (!forwardTrajectory) return required ? ['forward_trajectory'] : []
  if (typeof forwardTrajectory !== 'object' || Array.isArray(forwardTrajectory)) return ['forward_trajectory']

  const issues = []
  const requiredFields = [
    'dimension',
    'horizon',
    'summary',
    'if_current_path_continues',
    'if_top_recommendation_is_executed',
    'confidence_note',
  ]

  for (const field of requiredFields) {
    if (typeof forwardTrajectory[field] !== 'string' || !forwardTrajectory[field].trim()) {
      issues.push(`forward_trajectory.${field}`)
    }
  }

  if (!Array.isArray(forwardTrajectory.comparison_points) || forwardTrajectory.comparison_points.length === 0) {
    issues.push('forward_trajectory.comparison_points')
  } else {
    const invalidPoint = forwardTrajectory.comparison_points.some(point =>
      !point ||
      typeof point.metric !== 'string' || !point.metric.trim() ||
      typeof point.current_path !== 'string' || !point.current_path.trim() ||
      typeof point.recommended_path !== 'string' || !point.recommended_path.trim()
    )
    if (invalidPoint) issues.push('forward_trajectory.comparison_points')
  }

  return issues
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, messages, industry, domain, userId, goalMode, goal, goalTimeline, goalBaseline } = req.body
  if (!type || !messages) {
    return res.status(400).json({ error: 'Missing type or messages' })
  }

  // Anonymous audits (no userId) are allowed. If userId is present, the caller
  // must prove ownership — otherwise any user's private context could be stolen.
  if (userId && !await validateUserToken(req, res, userId)) return

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key not configured' })
  }

  const isReport = type === 'report'
  const finalMessages = isReport
    ? [...messages, { role: 'user', content: buildReportPrompt(goalMode) }]
    : messages

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }

  const [intelligenceBrief, userMemory, businessState, patterns] = await Promise.all([
    fetchIntelligenceBrief(userId),
    fetchUserMemory(userId),
    fetchBusinessState(userId),
    fetchPatterns(industry, domain),
  ])
  const connectorContext = await fetchConnectorContext(userId, supabase)
  const sessionContinuity = buildSessionContinuity(messages)

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: isReport ? (goalMode ? 4000 : 3200) : 1024,
        system: buildSystemPrompt(industry, domain, intelligenceBrief, userMemory, goalMode, goal, goalTimeline, goalBaseline, businessState, patterns, connectorContext, sessionContinuity),
        messages: finalMessages,
      }),
    })

    if (!response.ok) {
      let errMessage = 'Claude API error'
      try {
        const err = await response.json()
        errMessage = err.error?.message || errMessage
      } catch { /* non-JSON error body */ }
      return res.status(response.status).json({ error: errMessage })
    }

    const data = await response.json()
    const text = data.content[0].text

    if (isReport) {
      const clean = text.replace(/```json|```/g, '').trim()
      let report = JSON.parse(clean)
      if (goalMode) report = normalizeGoalReport(report)

      const requiredHumanMoment  = ['headline','acknowledgment','what_this_actually_is','delivery_script','what_to_expect','honest_truth']
      const requiredExecution    = ['headline','execution_context','delivery_plan','what_to_expect','key_message','honest_truth']
      const requiredDiagnostic   = ['business_state','ranked_path','timeline_reality','forward_trajectory']

      const mode = report.conversation_mode
      const required = goalMode                            ? []
                     : mode === 'HUMAN_MOMENT'             ? requiredHumanMoment
                     : mode === 'EXECUTION_HUMAN'          ? requiredHumanMoment
                     : mode === 'EXECUTION'                ? requiredExecution
                     : mode === 'DIAGNOSTIC'               ? requiredDiagnostic
                     : null
      const goalIssues = goalMode ? validateGoalReport(report) : []
      const trajectoryIssues = goalMode
        ? []
        : mode === 'DIAGNOSTIC'
          ? validateForwardTrajectory(report.forward_trajectory, { required: true })
          : mode === 'EXECUTION'
            ? validateForwardTrajectory(report.forward_trajectory, { required: false })
            : []

      if (required || goalMode) {
        const missing = goalMode
          ? goalIssues
          : [...required.filter(f => !report[f]), ...trajectoryIssues]
        if (missing.length > 0) {
          console.log(`[audit] ${mode} report missing fields: ${missing.join(', ')} — retrying`)
          try {
            const retryMessages = [
              ...finalMessages,
              { role: 'assistant', content: text },
              {
                role: 'user',
                content: goalMode
                  ? `Your response failed GOAL report validation for these fields: ${missing.join(', ')}. Regenerate the complete JSON with the goal-mode fields populated correctly. goal_gap_analysis and ranking_logic must be objects, missing_capabilities and priority_actions must be arrays, timeline_feasibility must begin with feasible, tight, or unrealistic, and confidence_level and honest_truth must be non-empty strings.`
                  : mode === 'DIAGNOSTIC'
                    ? `Your response failed DIAGNOSTIC report validation for these fields: ${missing.join(', ')}. Regenerate the complete JSON. forward_trajectory is required in DIAGNOSTIC mode, must compare current path vs top recommendation, must include dimension, horizon, summary, if_current_path_continues, if_top_recommendation_is_executed, comparison_points, and confidence_note, and must use numbers only when supported by evidence.`
                    : (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN')
                      ? `Your response failed ${mode} report validation for these fields: ${missing.join(', ')}. Regenerate the complete JSON with all six required fields: headline, acknowledgment, what_this_actually_is, delivery_script, what_to_expect, and honest_truth. delivery_script must contain actual spoken words in first person as a continuous paragraph starting with "Something like this:" followed by the script in quotes.`
                      : `Your response failed EXECUTION report validation for these fields: ${missing.join(', ')}. Regenerate the complete JSON with all core EXECUTION fields populated. If you include forward_trajectory, it must be complete, practical, and tied to execution consequences.`,
              },
            ]
            const retryResponse = await fetch(CLAUDE_API, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: goalMode ? 4000 : 3200,
                system: buildSystemPrompt(industry, domain, intelligenceBrief, userMemory, goalMode, goal, goalTimeline, goalBaseline, businessState, patterns, connectorContext, sessionContinuity),
                messages: retryMessages,
              }),
            })
            if (retryResponse.ok) {
              const retryData  = await retryResponse.json()
              const retryClean = retryData.content[0].text.replace(/```json|```/g, '').trim()
              report = JSON.parse(retryClean)
              if (goalMode) report = normalizeGoalReport(report)
              console.log(`[audit] retry succeeded for ${mode}`)
            } else {
              console.warn(`[audit] retry API call failed: ${retryResponse.status}`)
            }
          } catch (retryErr) {
            console.warn('[audit] retry failed:', retryErr.message)
          }
        }
      }

      return res.status(200).json({ report })
    }

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
