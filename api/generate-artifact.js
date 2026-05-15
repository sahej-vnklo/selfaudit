import { createClient } from '@supabase/supabase-js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const ARTIFACT_TYPES = ['ACTION_PLAN', 'SOP', 'PROCESS_CHANGE', 'PRICING_MODEL', 'HIRING_BRIEF', 'EMAIL']

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function recommend(report) {
  const recommended = []
  const domains = report.domains ?? []
  const nonAiFixes = report.non_ai_fixes ?? []
  const goalMode = report.goal_gap_analysis != null
  const missingCaps = (report.missing_capabilities ?? []).length > 0

  const allText = [
    report.honest_truth ?? '',
    ...(report.priority_actions ?? []),
    ...nonAiFixes.map(f => `${f.issue} ${f.fix}`),
    ...domains.map(d => `${d.name} ${d.finding ?? ''} ${d.action ?? ''}`),
    ...(report.missing_capabilities ?? []),
    report.goal_gap_analysis?.gap ?? '',
    report.goal_gap_analysis?.fastest_path ?? '',
  ].join(' ').toLowerCase()

  if (goalMode && missingCaps) recommended.push('ACTION_PLAN')

  const hasProcessIssues = nonAiFixes.some(f =>
    /process|workflow|system|procedure|manual|repetitive|inconsistent/i.test(`${f.issue} ${f.fix}`)
  ) || /broken process|process gap|no process|process doesn't|no clear process/i.test(allText)
  if (hasProcessIssues) {
    if (!recommended.includes('SOP')) recommended.push('SOP')
    if (!recommended.includes('PROCESS_CHANGE')) recommended.push('PROCESS_CHANGE')
  }

  const pricingDomain = domains.find(d => /pricing|price|revenue|monetiz/i.test(d.name))
  if (pricingDomain && ['needs_work', 'critical'].includes(pricingDomain.status)) {
    if (!recommended.includes('PRICING_MODEL')) recommended.push('PRICING_MODEL')
  } else if (/undercharg|pricing model|price point|pricing structure|wrong price/i.test(allText)) {
    if (!recommended.includes('PRICING_MODEL')) recommended.push('PRICING_MODEL')
  }

  if (/hiring|hire\b|headcount|team gap|missing role|need.*hire|no.*head of|lacks a/i.test(allText)) {
    if (!recommended.includes('HIRING_BRIEF')) recommended.push('HIRING_BRIEF')
  }

  if (/sales outreach|cold email|follow.?up|prospect|lead generation|outreach/i.test(allText)) {
    if (!recommended.includes('EMAIL')) recommended.push('EMAIL')
  }

  if (recommended.length === 0) {
    recommended.push('ACTION_PLAN')
    const topDomain = domains.find(d => d.status === 'critical') ?? domains.find(d => d.status === 'needs_work')
    if (topDomain && /process|ops|operation|delivery|service|fulfil/i.test(topDomain.name)) {
      recommended.push('SOP')
    } else {
      recommended.push('PROCESS_CHANGE')
    }
  }

  if (!recommended.includes('ACTION_PLAN')) recommended.unshift('ACTION_PLAN')

  return {
    recommended: [...new Set(recommended)].slice(0, 3),
    available: ARTIFACT_TYPES,
  }
}

const SYSTEM_PROMPT = `You are SelfAudit's execution engine. Your job is to generate a single, specific, ready-to-use business artifact from an audit report.

RULES:
1. The artifact must be generated FROM the report findings — not generic
2. Reference specific gaps, findings, and recommendations from the report
3. Every artifact must be immediately usable — no placeholders like [INSERT NAME]
4. Use the user's industry and domain context throughout
5. If goalMode is true, prioritize closing the goal gap fastest
6. Artifacts must be copy-paste ready — the user should be able to use this today

QUALITY TEST (apply before finalizing):
- Is this specific to their situation? No generic templates.
- Can they use it today without editing? No placeholders.
- Does it reference actual findings from their report? Must be grounded.
- Is it the right length? Enough to be useful, not padded.

SAFETY:
- Only use information from the report and userInfo provided
- Do not invent company names, numbers, or team structures not in the report
- If a specific detail is missing, use a reasonable contextual default in brackets e.g. [adjust timeline based on your team size] — only when genuinely needed

Return VALID JSON ONLY. No markdown, no backticks, no preamble.`

const TYPE_INSTRUCTIONS = {
  SOP: `Generate a Standard Operating Procedure (SOP) for the most critical operational fix identified in this report.

Sections required (use these exact labels):
- Title: Specific SOP title (e.g. "SOP: Lead Qualification & Handoff Process")
- Purpose: Why this SOP exists and what specific problem it solves — reference the finding
- Owner: Who owns this process (role, not a name)
- Steps: Numbered, concrete steps (at least 6). Each step should be actionable and specific.
- Success Criteria: 3-5 measurable indicators that this process is working`,

  PRICING_MODEL: `Generate a concrete pricing model restructure based on the pricing or revenue gaps in this report.

Sections required (use these exact labels):
- Current Problem: What's broken about the current pricing — name it specifically
- Proposed Tiers: Each tier with name, price point, what's included, and who it's for. Write each tier as a complete description.
- Positioning Rationale: Why this structure works for their customer and their gap
- Transition Plan: How to migrate or introduce this — specific steps`,

  HIRING_BRIEF: `Generate a hiring brief for the most critical missing role identified in this report.

Sections required (use these exact labels):
- Role: Full title and who they report to
- Why Now: The specific business case for this hire, grounded in the report findings
- What They Own: Their core responsibilities and decision rights — be specific
- 90-Day Outcomes: 3-5 specific measurable outcomes in the first 90 days
- Must-Haves: Non-negotiable skills or experience for this specific role
- Red Flags: What disqualifies a candidate — be honest and specific`,

  EMAIL: `Generate a ready-to-send email draft for the most critical outreach or communication need in this report.

Sections required (use these exact labels):
- Subject Line: Specific, non-generic — one strong line
- Body: Full email written in first person, direct and human. Include opening context, the core message, and a natural close. Write it as a complete email, not bullet points.
- CTA: The single clear action you want the recipient to take`,

  ACTION_PLAN: `Generate a prioritized action plan to execute the top recommendation from this report.

Sections required (use these exact labels):
- Goal: The specific outcome this plan achieves — state it clearly with a measurable target
- Timeline: Total timeframe with honest rationale
- Week 1: Exact actions for the first 7 days — specific, assignable tasks
- Month 1: Key milestones to hit by end of month 1 — measurable
- Month 3: Where this gets them by the 90-day mark
- Blockers: The top 2-3 things that could derail this and how to handle each one`,

  PROCESS_CHANGE: `Generate a before/after process redesign doc for the most broken process in this report.

Sections required (use these exact labels):
- Process Name: What this process is
- Current State: Walk through how it works now — what's broken, where it fails, what it costs the business
- New State: Walk through the redesigned process step by step — be specific about what changes
- Transition Steps: Who does what, in what order, to move from current state to new state
- Owner: Who owns this ongoing, what their accountability looks like, and how you know it's working`,
}

function buildUserPrompt(artifactType, report, userInfo) {
  const goalContext = userInfo.goalMode
    ? `\nGoal: ${userInfo.goal || 'not specified'}\nGoal timeline: ${userInfo.goalTimeline || 'not specified'}`
    : ''

  return `Generate a ${artifactType} artifact based on this audit report.

USER CONTEXT:
Name: ${userInfo.name || '[user]'}
Industry: ${userInfo.industry || 'not specified'}
Domain: ${userInfo.domain || 'not specified'}${goalContext}

${TYPE_INSTRUCTIONS[artifactType]}

AUDIT REPORT:
${JSON.stringify(report, null, 2)}

Return a single JSON object with this exact structure:
{
  "type": "${artifactType}",
  "title": "Specific descriptive title based on their actual situation — not generic",
  "summary": "One sentence: what this artifact does and why it matters for their specific situation",
  "sections": [
    { "label": "Section Name", "content": "Fully written content — no placeholders, grounded in their report findings" }
  ]
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { artifactType, report, userInfo, reportId, userId } = req.body
  if (!report) {
    return res.status(400).json({ error: 'Missing report' })
  }

  const recommendations = recommend(report)

  if (!artifactType) {
    return res.status(200).json({ recommendations })
  }

  if (!ARTIFACT_TYPES.includes(artifactType)) {
    return res.status(400).json({ error: 'Invalid artifact type' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key not configured' })
  }

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(artifactType, report, userInfo) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' })
    }

    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const artifact = JSON.parse(clean)

    let savedArtifact = null

    if (userId && reportId) {
      try {
        const { data, error } = await supabase
          .from('artifacts')
          .insert({
            user_id: userId,
            report_id: reportId,
            artifact_type: artifactType,
            title: artifact.title ?? null,
            summary: artifact.summary ?? null,
            artifact_data: artifact,
            updated_at: new Date().toISOString(),
          })
          .select('id, created_at')
          .single()

        if (error) throw error
        savedArtifact = data
      } catch (saveErr) {
        console.warn('[generate-artifact] artifact save failed:', saveErr.message)
      }
    }

    return res.status(200).json({ artifact, recommendations, savedArtifact })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
