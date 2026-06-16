// buildRiskAlertEmail — builds the risk alert notification email payload.
// Matches the visual style of send-report.js (same CSS variables, same structure).

const TIER_COLOR = {
  critical: '#A32D2D',
  alert: '#BA5B17',
  escalate: '#8A6A00',
  flag: '#285AA6',
  watch: '#6B6860',
}
const TIER_BG = {
  critical: '#FCEBEB',
  alert: '#FBEBDD',
  escalate: '#FAFAE0',
  flag: '#EAF2FF',
  watch: '#F4F3EF',
}
const TIER_BORDER = {
  critical: '#E8A0A0',
  alert: '#F0BA78',
  escalate: '#D4C84A',
  flag: '#A8C1F0',
  watch: '#E8E6E0',
}
const TIER_LABEL = {
  critical: 'Critical',
  alert: 'Alert',
  escalate: 'Escalate',
  flag: 'Flag',
  watch: 'Watch',
}
const TIER_ORDER = ['critical', 'alert', 'escalate', 'flag', 'watch']

function tierColor(value) { return TIER_COLOR[value] || '#6B6860' }
function tierBg(value) { return TIER_BG[value] || '#F4F3EF' }
function tierBorder(value) { return TIER_BORDER[value] || '#E8E6E0' }
function tierLabel(value) { return TIER_LABEL[value] || value }

function alertBlock(alert) {
  const tier = alert.escalation_tier || 'watch'
  const color  = tierColor(tier)
  const bg     = tierBg(tier)
  const border = tierBorder(tier)
  const label  = tierLabel(tier)
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

function groupByTier(alerts) {
  const groups = {}
  for (const tier of TIER_ORDER) {
    const group = alerts.filter((a) => (a.escalation_tier || 'watch') === tier)
    if (group.length) groups[tier] = group
  }
  return groups
}

function getHighestTier(alerts) {
  for (const tier of TIER_ORDER) {
    if (alerts.some((alert) => (alert.escalation_tier || 'watch') === tier)) return tier
  }
  return 'watch'
}

export function buildRiskAlertEmail(user, alerts) {
  if (!alerts?.length) return null

  const name         = user?.name  || user?.email?.split('@')[0] || 'there'
  const email        = user?.email || ''
  const dashboardUrl = 'https://tryselfaudit.com/#home'
  const groups       = groupByTier(alerts)
  const highestTier  = getHighestTier(alerts)

  const subjectPrefix = highestTier === 'critical'
    ? `🚨 Critical alert${alerts.length > 1 ? 's' : ''} flagged`
    : highestTier === 'alert'
      ? `⚠️ Alert${alerts.length > 1 ? 's' : ''} requiring attention`
      : highestTier === 'escalate'
        ? `⚠️ Escalation${alerts.length > 1 ? 's' : ''} surfaced`
        : highestTier === 'flag'
          ? `📌 Flagged issue${alerts.length > 1 ? 's' : ''} from your health check`
          : `👀 Watch item${alerts.length > 1 ? 's' : ''} from your health check`
  const subject = `${subjectPrefix} — SelfAudit`

  const alertSections = Object.entries(groups).map(([tier, group]) => `
  <div style="margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6B6860;font-weight:600;margin-bottom:10px;">
      ${tierLabel(tier)} (${group.length})
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
      `${i + 1}. [${tierLabel(a.escalation_tier || 'watch').toUpperCase()}] ${a.title}`,
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
