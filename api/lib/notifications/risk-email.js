// buildRiskAlertEmail — builds the risk alert notification email payload.
// Matches the visual style of send-report.js (same CSS variables, same structure).

const SEVERITY_COLOR  = { critical: '#A32D2D', high: '#BA7517', medium: '#8A6A00' }
const SEVERITY_BG     = { critical: '#FCEBEB', high:  '#FAEEDA', medium: '#FAFAE0' }
const SEVERITY_BORDER = { critical: '#E8A0A0', high:  '#F0C878', medium: '#D4C84A' }
const SEVERITY_LABEL  = { critical: 'Critical', high: 'High',    medium: 'Medium'  }

function severityColor(s)  { return SEVERITY_COLOR[s]  || '#6B6860' }
function severityBg(s)     { return SEVERITY_BG[s]     || '#F4F3EF' }
function severityBorder(s) { return SEVERITY_BORDER[s] || '#E8E6E0' }
function severityLabel(s)  { return SEVERITY_LABEL[s]  || s }

function alertBlock(alert) {
  const color  = severityColor(alert.severity)
  const bg     = severityBg(alert.severity)
  const border = severityBorder(alert.severity)
  const label  = severityLabel(alert.severity)
  const evidence = typeof alert.evidence === 'object' && alert.evidence !== null
    ? (alert.evidence.raw ?? JSON.stringify(alert.evidence))
    : String(alert.evidence || '')

  return `
  <div style="border:1px solid ${border};border-left:4px solid ${color};background:${bg};border-radius:8px;padding:16px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <span style="background:${color};color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
      <span style="font-size:15px;font-weight:600;color:#0D0D0D;">${alert.title}</span>
    </div>
    ${alert.description ? `<p style="font-size:14px;color:#2C2B28;margin:0 0 10px;line-height:1.6;">${alert.description}</p>` : ''}
    ${evidence ? `<div style="font-size:12px;color:#6B6860;background:rgba(0,0,0,0.04);border-radius:4px;padding:8px 10px;margin-bottom:10px;font-family:monospace;">Evidence: ${evidence}</div>` : ''}
    ${alert.recommended_action ? `
    <div style="font-size:13px;color:#0F6E56;font-weight:500;margin-top:8px;">
      → ${alert.recommended_action}
    </div>` : ''}
  </div>`
}

function groupBySeverity(alerts) {
  const order = ['critical', 'high', 'medium']
  const groups = {}
  for (const s of order) {
    const group = alerts.filter((a) => a.severity === s)
    if (group.length) groups[s] = group
  }
  return groups
}

export function buildRiskAlertEmail(user, alerts) {
  if (!alerts?.length) return null

  const name         = user?.name  || user?.email?.split('@')[0] || 'there'
  const email        = user?.email || ''
  const dashboardUrl = 'https://tryselfaudit.com/#connectors'   // placeholder — update when alert deep-link exists
  const groups       = groupBySeverity(alerts)
  const criticalCount = (groups.critical || []).length
  const highCount     = (groups.high     || []).length

  const subjectPrefix = criticalCount > 0
    ? `🚨 ${criticalCount} critical risk${criticalCount > 1 ? 's' : ''} flagged`
    : highCount > 0
      ? `⚠️ ${highCount} high-risk alert${highCount > 1 ? 's' : ''}`
      : `📋 ${alerts.length} risk alert${alerts.length > 1 ? 's' : ''} from your health check`
  const subject = `${subjectPrefix} — SelfAudit`

  const alertSections = Object.entries(groups).map(([severity, group]) => `
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6B6860;font-weight:600;margin-bottom:10px;">
      ${severityLabel(severity)} risks (${group.length})
    </div>
    ${group.map(alertBlock).join('')}
  </div>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;color:#0D0D0D;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">

  <div style="border-bottom:2px solid #A32D2D;padding-bottom:16px;margin-bottom:24px;">
    <div style="font-size:13px;color:#6B6860;letter-spacing:0.5px;text-transform:uppercase;">SelfAudit — Risk Alert</div>
    <h1 style="font-size:20px;margin:8px 0 4px;">Business health check flagged ${alerts.length} risk${alerts.length > 1 ? 's' : ''} requiring attention</h1>
  </div>

  <p style="font-size:15px;color:#2C2B28;margin-bottom:24px;">Hi ${name}, your scheduled business health check has identified the following risks. Review each one and take action where needed.</p>

  ${alertSections}

  <div style="margin-top:28px;text-align:center;">
    <a href="${dashboardUrl}" style="display:inline-block;background:#0D0D0D;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
      View in Dashboard →
    </a>
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8E6E0;font-size:12px;color:#B0ADA4;">
    Sent via SelfAudit — tryselfaudit.com · Built by Vnklo
  </div>

</body>
</html>`

  // Plain-text fallback
  const text = [
    `SelfAudit — Business Health Alert`,
    ``,
    `Hi ${name}, your health check flagged ${alerts.length} risk${alerts.length > 1 ? 's' : ''}:`,
    ``,
    ...alerts.map((a, i) => [
      `${i + 1}. [${severityLabel(a.severity).toUpperCase()}] ${a.title}`,
      a.description     ? `   Why it matters: ${a.description}` : '',
      a.evidence        ? `   Evidence: ${typeof a.evidence === 'object' ? (a.evidence.raw || JSON.stringify(a.evidence)) : a.evidence}` : '',
      a.recommended_action ? `   Action: ${a.recommended_action}` : '',
    ].filter(Boolean).join('\n')),
    ``,
    `View your dashboard: ${dashboardUrl}`,
    ``,
    `— SelfAudit / tryselfaudit.com`,
  ].join('\n')

  return { subject, html, text, to: email }
}
