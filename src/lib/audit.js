export async function sendMessage(messages, { industry, domain, userId, goalMode, goal, goalTimeline, goalBaseline, token } = {}) {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ type: 'chat', messages, industry, domain, userId, goalMode, goal, goalTimeline, goalBaseline }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'API error')
  }

  const data = await response.json()
  return data.text
}

export async function generateReport(messages, { industry, domain, userId, goalMode, goal, goalTimeline, goalBaseline, token } = {}) {
  const response = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ type: 'report', messages, industry, domain, userId, goalMode, goal, goalTimeline, goalBaseline }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'API error')
  }

  const data = await response.json()
  return data.report
}

export async function sendReportEmail({ userInfo, report, token }) {
  const response = await fetch('/api/send-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
  .badge { font-size: 13px; padding: 2px 8px; border-radius: 100px; font-weight: 500; }
  .domain-text { font-size: 13px; color: #6B6860; margin-top: 4px; }
  .domain-action { font-size: 13px; color: #2C2B28; margin-top: 4px; font-style: italic; }
  .fix { padding: 10px 12px; background: #FFF8F0; border-radius: 6px; margin-bottom: 8px; }
  .fix-issue { font-size: 13px; font-weight: 500; color: #854F0B; }
  .fix-solution { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .ai-item { padding: 10px 12px; background: #E1F5EE; border-radius: 6px; margin-bottom: 8px; }
  .ai-area { font-size: 13px; font-weight: 500; color: #0F6E56; }
  .ai-why { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .priority { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
  .priority-num { background: #0D0D0D; color: white; font-size: 13px; font-weight: 500; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .truth { background: #0D0D0D; color: white; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.7; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8E6E0; font-size: 13px; color: #B0ADA4; }
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
