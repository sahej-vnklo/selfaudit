const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are SelfAudit — a brutally honest, senior-level business and life advisor. Your job is to audit any situation a user brings — business, startup, side project, personal goals, career, anything.

CORE RULES:
1. NEVER suggest or hint that AI is a solution during the conversation. The audit is neutral. AI recommendations only appear in the final report.
2. Ask deep, unexpected questions that even experienced people haven't thought about. Go beyond the surface.
3. Call out real problems directly — process issues, people issues, cash flow, clarity of thinking, wrong priorities. Name them.
4. Keep questions focused — one at a time. Never overwhelming.
5. After 6-10 exchanges, you will have enough to write a report. Before concluding, always probe one level deeper on any operational bottleneck — ask about volume, frequency, who handles it, and what breaks down. This surfaces automation opportunities that surface naturally in the report. Signal readiness by ending your message with exactly: [READY_FOR_REPORT]

CONVERSATION STYLE:
- Conversational but sharp. Like a senior consultant, not a chatbot.
- Short responses. No fluff. No "great question!"
- If something doesn't add up, push back.
- If the user is avoiding a topic, name it.

DOMAINS YOU COVER: strategy, operations, sales, marketing, finance, people, culture, technology, product, customer success, personal goals, side projects, career, startups, solopreneurs — anything.

You are not here to make people feel good. You are here to give them clarity.`

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
      "action": "Specific next action — no AI mentioned here unless truly warranted"
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
  "honest_truth": "The one thing they probably don't want to hear but need to. Direct. No softening. If AI opportunities were identified, close with one sentence that connects the identified gap to what's now possible — make the next step obvious without being salesy."
}`

export async function sendMessage(messages, apiKey) {
  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API error')
  }

  const data = await response.json()
  return data.content[0].text
}

export async function generateReport(messages, apiKey) {
  const reportMessages = [
    ...messages,
    { role: 'user', content: REPORT_PROMPT }
  ]

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: reportMessages,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'API error')
  }

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function sendReportEmail({ userInfo, report }) {
  const response = await fetch('/api/send-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInfo, report }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Email send failed')
  }

  return true
}

function buildEmailHTML(userInfo, report) {
  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #0D0D0D; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { border-bottom: 2px solid #1D9E75; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 13px; color: #6B6860; letter-spacing: 0.5px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 8px 0 4px; }
  .user-card { background: #F4F3EF; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .user-card p { margin: 2px 0; font-size: 14px; }
  .user-card strong { color: #0D0D0D; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6860; margin-bottom: 12px; }
  .verdict { font-size: 16px; color: #2C2B28; line-height: 1.7; }
  .headline { font-size: 18px; font-weight: 600; color: #0D0D0D; margin-bottom: 12px; }
  .domain { padding: 12px; border-left: 3px solid #E8E6E0; margin-bottom: 8px; }
  .domain-name { font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 8px; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 100px; font-weight: 500; }
  .domain-text { font-size: 13px; color: #6B6860; margin-top: 4px; }
  .domain-action { font-size: 13px; color: #2C2B28; margin-top: 4px; font-style: italic; }
  .fix { padding: 10px 12px; background: #FFF8F0; border-radius: 6px; margin-bottom: 8px; }
  .fix-issue { font-size: 13px; font-weight: 500; color: #854F0B; }
  .fix-solution { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .ai-item { padding: 10px 12px; background: #E1F5EE; border-radius: 6px; margin-bottom: 8px; }
  .ai-area { font-size: 13px; font-weight: 500; color: #0F6E56; }
  .ai-why { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .priority { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
  .priority-num { background: #0D0D0D; color: white; font-size: 11px; font-weight: 500; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .truth { background: #0D0D0D; color: white; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.7; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8E6E0; font-size: 12px; color: #B0ADA4; }
</style></head>
<body>
  <div class="header">
    <div class="logo">SelfAudit by Vnklo</div>
    <h1>${report.headline}</h1>
  </div>

  <div class="user-card">
    <p><strong>Name:</strong> ${userInfo.name}</p>
    <p><strong>Email:</strong> ${userInfo.email}</p>
    ${userInfo.phone ? `<p><strong>Phone:</strong> ${userInfo.phone}</p>` : ''}
    ${userInfo.context ? `<p><strong>Context:</strong> ${userInfo.context}</p>` : ''}
  </div>

  <div class="section">
    <h2>Overall Assessment</h2>
    <p class="verdict">${report.overall_verdict}</p>
  </div>

  <div class="section">
    <h2>Domain Findings</h2>
    ${report.domains.map(d => `
      <div class="domain" style="border-left-color: ${statusColor[d.status]}">
        <div class="domain-name">
          ${d.name}
          <span class="badge" style="background: ${statusColor[d.status]}20; color: ${statusColor[d.status]}">${statusLabel[d.status]}</span>
        </div>
        <div class="domain-text">${d.finding}</div>
        <div class="domain-action">→ ${d.action}</div>
      </div>
    `).join('')}
  </div>

  ${report.non_ai_fixes?.length ? `
  <div class="section">
    <h2>Fix These First (No AI Needed)</h2>
    ${report.non_ai_fixes.map(f => `
      <div class="fix">
        <div class="fix-issue">${f.issue}</div>
        <div class="fix-solution">${f.fix}</div>
      </div>
    `).join('')}
  </div>` : ''}

  ${report.ai_opportunities?.length ? `
  <div class="section">
    <h2>Where AI Actually Helps</h2>
    ${report.ai_opportunities.map(a => `
      <div class="ai-item">
        <div class="ai-area">${a.area}</div>
        <div class="ai-why">${a.why}</div>
      </div>
    `).join('')}
  </div>` : ''}

  <div class="section">
    <h2>Priority Actions</h2>
    ${report.priority_actions.map((a, i) => `
      <div class="priority">
        <div class="priority-num">${i + 1}</div>
        <div style="font-size: 14px">${a}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>The Honest Truth</h2>
    <div class="truth">${report.honest_truth}</div>
  </div>

  <div class="footer">
    Sent via SelfAudit — selfaudit.co · Built by Vnklo
  </div>
</body>
</html>`
}
