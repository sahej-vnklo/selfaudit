// Sends the user their own copy of the audit report.
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function normalizeTrajectoryPoints(forwardTrajectory) {
  return Array.isArray(forwardTrajectory?.comparison_points)
    ? forwardTrajectory.comparison_points.filter(point =>
        point &&
        typeof point.metric === 'string' && point.metric.trim() &&
        typeof point.current_path === 'string' && point.current_path.trim() &&
        typeof point.recommended_path === 'string' && point.recommended_path.trim()
      )
    : []
}

function buildForwardTrajectorySection(forwardTrajectory) {
  const points = normalizeTrajectoryPoints(forwardTrajectory)
  if (!forwardTrajectory || points.length === 0) return ''

  return `
    <div class="section">
      <h2>Forward Trajectory</h2>
      <div class="trajectory-shell">
        <div class="trajectory-header">
          ${forwardTrajectory.dimension ? `<span class="trajectory-badge">${esc(forwardTrajectory.dimension)}</span>` : ''}
          ${forwardTrajectory.horizon ? `<span class="trajectory-horizon">${esc(forwardTrajectory.horizon)}</span>` : ''}
        </div>
        ${forwardTrajectory.summary ? `<p class="verdict">${esc(forwardTrajectory.summary)}</p>` : ''}
        <div class="trajectory-grid">
          <div class="trajectory-card">
            <div class="trajectory-label">If current path continues</div>
            <div class="trajectory-body">${esc(forwardTrajectory.if_current_path_continues)}</div>
          </div>
          <div class="trajectory-card">
            <div class="trajectory-label">If top recommendation is executed</div>
            <div class="trajectory-body">${esc(forwardTrajectory.if_top_recommendation_is_executed)}</div>
          </div>
        </div>
        <table class="trajectory-table" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Current path</th>
              <th>Recommended path</th>
            </tr>
          </thead>
          <tbody>
            ${points.map(point => `
              <tr>
                <td>${esc(point.metric)}</td>
                <td>${esc(point.current_path)}</td>
                <td>${esc(point.recommended_path)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${forwardTrajectory.confidence_note ? `<div class="trajectory-note"><strong>Confidence note:</strong> ${esc(forwardTrajectory.confidence_note)}</div>` : ''}
      </div>
    </div>`
}
// Called from save-report.js after every successful report save.
// Separate from send-report.js which notifies sales@vnklo.com.

function buildReportBody(report) {
  const mode = report.conversation_mode ?? 'DIAGNOSTIC'
  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusBg    = { strong: '#E1F5EE', needs_work: '#FAEEDA', critical: '#FCEBEB' }
  const statusLabel = { strong: 'Strong',  needs_work: 'Needs Work', critical: 'Critical' }

  if (report.report_family === 'GOAL' || mode === 'GOAL_GAP') {
    const gap = report.goal_gap_analysis || {}
    const fl  = (report.timeline_feasibility || '').toLowerCase()
    const feasColor = fl.startsWith('unrealistic') ? '#A32D2D' : fl.startsWith('tight') ? '#BA7517' : '#1D9E75'
    const caps = report.missing_capabilities || []
    const actions = report.priority_actions || []
    return `
      <div class="section"><h2>Goal</h2><p class="verdict">${esc(gap.goal)}</p></div>
      <div class="section"><h2>Where You Are Now</h2><p class="verdict">${esc(gap.current_position)}</p></div>
      <div class="section"><h2>The Gap</h2><p class="verdict">${esc(gap.gap)}</p></div>
      <div class="section"><h2>Fastest Path</h2><p class="verdict">${esc(gap.fastest_path)}</p></div>
      ${caps.length > 0 ? `<div class="section"><h2>Missing Capabilities</h2>${caps.map(c => `<div class="fix"><div class="fix-issue">${esc(c)}</div></div>`).join('')}</div>` : ''}
      <div class="section"><h2>Timeline</h2><p class="verdict" style="color:${feasColor};font-weight:500">${esc(report.timeline_feasibility)}</p></div>
      ${actions.length > 0 ? `<div class="section"><h2>Priority Actions</h2>${actions.map((a, i) => `<div class="priority"><span class="priority-num">${i + 1}</span><span>${esc(a)}</span></div>`).join('')}</div>` : ''}
      ${buildForwardTrajectorySection(report.forward_trajectory)}
      <div class="section"><h2>The Honest Truth</h2><div class="truth">${esc(report.honest_truth)}</div></div>`
  }

  if (mode === 'EXECUTION') {
    return `
      <div class="section"><h2>Execution Context</h2><p class="verdict">${esc(report.execution_context)}</p></div>
      ${(report.delivery_plan || []).length > 0 ? `<div class="section"><h2>Delivery Plan</h2>${report.delivery_plan.map(item => `<div class="fix"><div class="fix-issue">${item.step ? `${esc(item.step)}. ` : ''}${esc(item.action)}</div><div class="fix-solution">${esc(item.why)}</div></div>`).join('')}</div>` : ''}
      <div class="section"><h2>What to Expect</h2><p class="verdict">${esc(report.what_to_expect)}</p></div>
      ${buildForwardTrajectorySection(report.forward_trajectory)}
      <div class="section"><h2>The Honest Truth</h2><div class="truth">${esc(report.honest_truth)}</div></div>`
  }

  if (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN') {
    return `
      <div class="section"><h2>Acknowledgment</h2><p class="verdict">${esc(report.acknowledgment)}</p></div>
      <div class="section"><h2>What This Actually Is</h2><p class="verdict">${esc(report.what_this_actually_is)}</p></div>
      ${report.delivery_script ? `<div class="section"><h2>What to Say</h2><div class="truth">${esc(report.delivery_script)}</div></div>` : ''}
      <div class="section"><h2>What to Expect</h2><p class="verdict">${esc(report.what_to_expect)}</p></div>
      <div class="section"><h2>The Honest Truth</h2><div class="truth">${esc(report.honest_truth)}</div></div>`
  }

  // DIAGNOSTIC (default)
  return `
    <div class="section"><h2>Overall Assessment</h2><p class="verdict">${esc(report.overall_verdict)}</p></div>
    <div class="section"><h2>Domain Findings</h2>
      ${(report.domains || []).map(d => `
        <div class="domain" style="border-left-color:${statusColor[d.status] || '#888'}">
          <div class="domain-name">${esc(d.name)}<span class="badge" style="background:${statusBg[d.status] || '#eee'};color:${statusColor[d.status] || '#888'}">${esc(statusLabel[d.status] || d.status)}</span></div>
          <div class="domain-text">${esc(d.finding)}</div>
          <div class="domain-action">→ ${esc(d.action)}</div>
        </div>`).join('')}
    </div>
    ${(report.non_ai_fixes || []).length > 0 ? `<div class="section"><h2>Fix These First</h2>${report.non_ai_fixes.map(f => `<div class="fix"><div class="fix-issue">${esc(f.issue)}</div><div class="fix-solution">${esc(f.fix)}</div></div>`).join('')}</div>` : ''}
    ${(report.ai_opportunities || []).length > 0 ? `<div class="section"><h2>Where AI Actually Applies</h2>${report.ai_opportunities.map(a => `<div class="ai-item"><div class="ai-area">${esc(a.area)}</div><div class="ai-why">${esc(a.why)}</div></div>`).join('')}</div>` : ''}
    ${(report.priority_actions || []).length > 0 ? `<div class="section"><h2>Priority Actions</h2>${report.priority_actions.map((a, i) => `<div class="priority"><span class="priority-num">${i + 1}</span><span>${esc(a)}</span></div>`).join('')}</div>` : ''}
    ${buildForwardTrajectorySection(report.forward_trajectory)}
    <div class="section"><h2>The Honest Truth</h2><div class="truth">${esc(report.honest_truth)}</div></div>`
}

export async function sendUserReportEmail({ userEmail, userName, report, resendApiKey }) {
  if (!userEmail || !resendApiKey) return

  const headline = report?.headline || 'Your SelfAudit Report'

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #0D0D0D; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }
  .header { border-bottom: 2px solid #0D0D0D; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 13px; color: #6B6860; letter-spacing: 0.5px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 8px 0 4px; line-height: 1.3; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6860; margin-bottom: 12px; }
  .verdict { font-size: 15px; color: #2C2B28; line-height: 1.7; margin: 0; }
  .domain { padding: 12px; border-left: 3px solid #E8E6E0; margin-bottom: 8px; }
  .domain-name { font-weight: 500; font-size: 14px; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 100px; font-weight: 500; margin-left: 8px; }
  .domain-text { font-size: 13px; color: #6B6860; margin-top: 4px; }
  .domain-action { font-size: 13px; color: #2C2B28; margin-top: 4px; font-style: italic; }
  .fix { padding: 10px 12px; background: #FFF8F0; border-radius: 6px; margin-bottom: 8px; border: 1px solid #FAC775; }
  .fix-issue { font-size: 13px; font-weight: 500; color: #854F0B; }
  .fix-solution { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .ai-item { padding: 10px 12px; background: #E1F5EE; border-radius: 6px; margin-bottom: 8px; }
  .ai-area { font-size: 13px; font-weight: 500; color: #0F6E56; }
  .ai-why { font-size: 13px; color: #2C2B28; margin-top: 2px; }
  .priority { display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start; }
  .priority-num { background: #0D0D0D; color: white; font-size: 11px; font-weight: 500; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .trajectory-shell { background: #F8F7F3; border: 1px solid #E8E6E0; border-radius: 8px; padding: 14px; }
  .trajectory-header { margin-bottom: 10px; }
  .trajectory-badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; background: #E1F5EE; color: #0F6E56; border-radius: 999px; padding: 4px 8px; margin-right: 8px; }
  .trajectory-horizon { font-size: 11px; color: #6B6860; text-transform: uppercase; letter-spacing: 0.5px; }
  .trajectory-grid { display: flex; gap: 10px; margin: 12px 0; }
  .trajectory-card { flex: 1; background: white; border: 1px solid #E8E6E0; border-radius: 8px; padding: 12px; }
  .trajectory-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6860; margin-bottom: 6px; }
  .trajectory-body { font-size: 13px; color: #2C2B28; line-height: 1.6; }
  .trajectory-table { width: 100%; border-collapse: collapse; margin-top: 10px; background: white; border: 1px solid #E8E6E0; border-radius: 8px; overflow: hidden; }
  .trajectory-table th, .trajectory-table td { padding: 10px 12px; text-align: left; vertical-align: top; font-size: 12px; line-height: 1.6; border-bottom: 1px solid #E8E6E0; }
  .trajectory-table th { background: #F4F3EF; color: #6B6860; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .trajectory-table td { color: #2C2B28; }
  .trajectory-table tbody tr:last-child td { border-bottom: none; }
  .trajectory-note { margin-top: 10px; font-size: 12px; color: #6B6860; line-height: 1.6; }
  .truth { background: #0D0D0D; color: white; padding: 16px; border-radius: 8px; font-size: 15px; line-height: 1.7; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E8E6E0; font-size: 12px; color: #B0ADA4; }
</style></head>
<body>
  <div class="header">
    <div class="logo">SelfAudit by Vnklo</div>
    <h1>${esc(headline)}</h1>
  </div>
  ${buildReportBody(report)}
  <div class="footer">Your SelfAudit report — tryselfaudit.com · Built by <a href="https://vnklo.com" style="color:#6B6860">Vnklo</a></div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from:    'SelfAudit <audit@tryselfaudit.com>',
        to:      [userEmail],
        subject: `Your SelfAudit report — ${headline}`,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[user-report-email] Resend error:', err?.message || res.status)
    }
  } catch (err) {
    console.warn('[user-report-email] failed:', err.message)
  }
}
