export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userInfo, report } = req.body

  if (!userInfo || !report) {
    return res.status(400).json({ error: 'Missing data' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not configured' })
  }

  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusBg = { strong: '#E1F5EE', needs_work: '#FAEEDA', critical: '#FCEBEB' }
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  const emailHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #0D0D0D; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { border-bottom: 2px solid #1D9E75; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 13px; color: #6B6860; letter-spacing: 0.5px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 8px 0 4px; }
  .user-card { background: #F4F3EF; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .user-card p { margin: 2px 0; font-size: 14px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6860; margin-bottom: 12px; }
  .verdict { font-size: 15px; color: #2C2B28; line-height: 1.7; }
  .domain { padding: 12px; border-left: 3px solid #E8E6E0; margin-bottom: 8px; }
  .domain-name { font-weight: 500; font-size: 14px; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 100px; font-weight: 500; margin-left: 8px; }
  .domain-text { font-size: 13px; color: #6B6860; margin-top: 4px; }
  .domain-action { font-size: 13px; color: #2C2B28; margin-top: 4px; font-style: italic; }
  .fix { padding: 10px 12px; background: #FFF8F0; border-radius: 6px; margin-bottom: 8px; border: 1px solid #FAC775; }
  .fix-issue { font-size: 13px; font-weight: 500; color: #854F0B; }
  .fix-solution { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .ai-item { padding: 10px 12px; background: #E1F5EE; border-radius: 6px; margin-bottom: 8px; border: 1px solid #9FE1CB; }
  .ai-area { font-size: 13px; font-weight: 500; color: #0F6E56; }
  .ai-why { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .priority { display: flex; gap: 10px; margin-bottom: 8px; }
  .priority-num { background: #0D0D0D; color: white; font-size: 11px; font-weight: 500; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
    ${userInfo.context ? `<p><strong>Auditing:</strong> ${userInfo.context}</p>` : ''}
  </div>

  <div class="section">
    <h2>Overall Assessment</h2>
    <p class="verdict">${report.overall_verdict}</p>
  </div>

  <div class="section">
    <h2>Domain Findings</h2>
    ${(report.domains || []).map(d => `
      <div class="domain" style="border-left-color: ${statusColor[d.status] || '#888'}">
        <div class="domain-name">
          ${d.name}
          <span class="badge" style="background:${statusBg[d.status] || '#eee'};color:${statusColor[d.status] || '#888'}">${statusLabel[d.status] || d.status}</span>
        </div>
        <div class="domain-text">${d.finding}</div>
        <div class="domain-action">→ ${d.action}</div>
      </div>
    `).join('')}
  </div>

  ${(report.non_ai_fixes || []).length > 0 ? `
  <div class="section">
    <h2>Fix These First — No AI Needed</h2>
    ${report.non_ai_fixes.map(f => `
      <div class="fix">
        <div class="fix-issue">${f.issue}</div>
        <div class="fix-solution">${f.fix}</div>
      </div>
    `).join('')}
  </div>` : ''}

  ${(report.ai_opportunities || []).length > 0 ? `
  <div class="section">
    <h2>Where AI Actually Applies</h2>
    ${report.ai_opportunities.map(a => `
      <div class="ai-item">
        <div class="ai-area">${a.area}</div>
        <div class="ai-why">${a.why}</div>
      </div>
    `).join('')}
  </div>` : ''}

  <div class="section">
    <h2>Priority Actions</h2>
    ${(report.priority_actions || []).map((a, i) => `
      <div class="priority">
        <span class="priority-num">${i + 1}</span>
        <span style="font-size:14px">${a}</span>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>The Honest Truth</h2>
    <div class="truth">${report.honest_truth}</div>
  </div>

  <div class="footer">
    Sent via SelfAudit — tryselfaudit.com · Built by Vnklo
  </div>
</body>
</html>`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SelfAudit <onboarding@resend.dev>',
        to: ['sales@vnklo.com'],
        reply_to: userInfo.email,
        subject: `Audit Report — ${userInfo.name} | ${userInfo.context || 'General Audit'}`,
        html: emailHTML,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(500).json({ error: err.message || 'Failed to send' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
