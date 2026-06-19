// Shared artifact generation instructions used by both:
//   - api/generate-artifact.js  (manual session, full audit report as context)
//   - api/lib/monitoring/critical-action-staging.js  (cron, single alert as context)
//
// Keeping these in one place means both paths produce the same quality output.

export const ARTIFACT_SYSTEM_PROMPT = `You are SelfAudit's execution engine. Your job is to generate a single, specific, ready-to-use business artifact.

RULES:
1. The artifact must be generated FROM the findings provided — not generic
2. Reference specific gaps, findings, and recommendations from the context
3. Every artifact must be immediately usable — no placeholders like [INSERT NAME]
4. Use the user's industry and business context throughout
5. Artifacts must be copy-paste ready — the user should be able to use this today

QUALITY TEST (apply before finalizing):
- Is this specific to their situation? No generic templates.
- Can they use it today without editing? No placeholders.
- Does it reference actual findings from the context? Must be grounded.
- Is it the right length? Enough to be useful, not padded.

SAFETY:
- Only use information from the context provided
- Do not invent company names, numbers, or team structures not in the context
- If a specific detail is missing, use a reasonable contextual default in brackets — only when genuinely needed

Return VALID JSON ONLY. No markdown, no backticks, no preamble.`

export const ARTIFACT_TYPE_INSTRUCTIONS = {
  ACTION_PLAN: `Generate a prioritized action plan to execute the top recommendation from the findings.

Sections required (use these exact labels):
- Goal: The specific outcome this plan achieves — state it clearly with a measurable target
- Timeline: Total timeframe with honest rationale
- Week 1: Exact actions for the first 7 days — specific, assignable tasks
- Month 1: Key milestones to hit by end of month 1 — measurable
- Month 3: Where this gets them by the 90-day mark
- Blockers: The top 2-3 things that could derail this and how to handle each one`,

  SOP: `Generate a Standard Operating Procedure (SOP) for the most critical operational fix identified.

Sections required (use these exact labels):
- Title: Specific SOP title (e.g. "SOP: Lead Qualification & Handoff Process")
- Purpose: Why this SOP exists and what specific problem it solves — reference the finding
- Owner: Who owns this process (role, not a name)
- Steps: Numbered, concrete steps (at least 6). Each step should be actionable and specific.
- Success Criteria: 3-5 measurable indicators that this process is working`,

  PROCESS_CHANGE: `Generate a before/after process redesign doc for the most broken process identified.

Sections required (use these exact labels):
- Process Name: What this process is
- Current State: Walk through how it works now — what's broken, where it fails, what it costs the business
- New State: Walk through the redesigned process step by step — be specific about what changes
- Transition Steps: Who does what, in what order, to move from current state to new state
- Owner: Who owns this ongoing, what their accountability looks like, and how you know it's working`,

  PRICING_MODEL: `Generate a concrete pricing model restructure based on the pricing or revenue gaps identified.

Sections required (use these exact labels):
- Current Problem: What's broken about the current pricing — name it specifically
- Proposed Tiers: Each tier with name, price point, what's included, and who it's for. Write each tier as a complete description.
- Positioning Rationale: Why this structure works for their customer and their gap
- Transition Plan: How to migrate or introduce this — specific steps`,

  HIRING_BRIEF: `Generate a hiring brief for the most critical missing role identified.

Sections required (use these exact labels):
- Role: Full title and who they report to
- Why Now: The specific business case for this hire, grounded in the findings
- What They Own: Their core responsibilities and decision rights — be specific
- 90-Day Outcomes: 3-5 specific measurable outcomes in the first 90 days
- Must-Haves: Non-negotiable skills or experience for this specific role
- Red Flags: What disqualifies a candidate — be honest and specific`,

  EMAIL: `Generate a ready-to-send email draft for the most critical outreach or communication need identified.

Sections required (use these exact labels):
- Subject Line: Specific, non-generic — one strong line
- Body: Full email written in first person, direct and human. Include opening context, the core message, and a natural close. Write it as a complete email, not bullet points.
- CTA: The single clear action you want the recipient to take`,

  INVESTOR_UPDATE: `Generate a concise investor or advisor update based on the findings.

Sections required (use these exact labels):
- Subject Line: Direct one-line subject for the email or message
- Highlights: 3 specific wins or progress points — reference actual numbers or milestones from the findings
- Metrics: Key business metrics in this format — Metric: Value (vs prior period or target). Include at least 3.
- Challenges: The real challenges right now, grounded in the findings — no spin, be honest
- Asks: 1-3 specific asks from the reader — money, intro, advice, or unblocking something concrete
- Next Milestone: One clear next milestone with a timeline`,

  TEAM_BRIEF: `Generate a team communication brief for the most urgent operational issue identified.

Sections required (use these exact labels):
- Situation: What is happening right now — the honest one-paragraph version the team needs to hear
- What Needs to Change: Specific behaviors, processes, or outputs that must change — not vague direction
- Who Owns What: Clear ownership per workstream or area — name the role, not a person
- Success Criteria: How the team will know in 30 days that this worked — make it measurable
- What Happens If We Don't: The honest consequence of not fixing this — be direct`,
}

export const ARTIFACT_JSON_SCHEMA = (artifactType) => `
Return a single JSON object with this exact structure:
{
  "type": "${artifactType}",
  "title": "Specific descriptive title based on their actual situation — not generic",
  "summary": "One sentence: what this artifact does and why it matters for their specific situation",
  "sections": [
    { "label": "Section Name", "content": "Fully written content — no placeholders, grounded in the findings" }
  ]
}`
