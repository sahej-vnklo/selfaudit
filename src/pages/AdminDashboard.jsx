import React, { useEffect, useMemo, useState } from 'react'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_AMBER,
  DARK_AMBER_BG,
  DARK_AMBER_TEXT,
  DARK_BORDER,
  DARK_BORDER_STRONG,
  DARK_GREEN,
  DARK_GREEN_BG,
  DARK_GREEN_TEXT,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_RED_BG,
  DARK_RED_TEXT,
  DARK_SOLID_PANEL_ALT,
  DARK_TEXT,
  DARK_TEXT_FAINT,
  DARK_TEXT_MUTED,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_AMBER,
  LIGHT_AMBER_BG,
  LIGHT_AMBER_TEXT,
  LIGHT_BORDER,
  LIGHT_BORDER_STRONG,
  LIGHT_GREEN,
  LIGHT_GREEN_BG,
  LIGHT_GREEN_TEXT,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED,
  LIGHT_RED_BG,
  LIGHT_RED_TEXT,
  LIGHT_SOLID_PANEL_ALT,
  LIGHT_TEXT,
  LIGHT_TEXT_FAINT,
  LIGHT_TEXT_MUTED,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_AMBER,
  SHARP_AMBER_BG,
  SHARP_AMBER_TEXT,
  SHARP_BORDER,
  SHARP_BORDER_STRONG,
  SHARP_GREEN,
  SHARP_GREEN_BG,
  SHARP_GREEN_TEXT,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_RED_BG,
  SHARP_RED_TEXT,
  SHARP_SOLID_PANEL_ALT,
  SHARP_TEXT,
  SHARP_TEXT_FAINT,
  SHARP_TEXT_MUTED,
} from '../lib/sharpTheme.js'

const ADMIN_EMAIL = 'sahej@vnklo.com'

const THEME_ORDER = ['dark', 'light', 'sharp']

const ADMIN_THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    surface3: DARK_SOLID_PANEL_ALT,
    border: DARK_BORDER,
    border2: DARK_BORDER_STRONG,
    text: DARK_TEXT,
    textMuted: DARK_TEXT_MUTED,
    textFaint: DARK_TEXT_FAINT,
    accent: DARK_ACCENT,
    accentLight: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    red: DARK_RED,
    redBg: DARK_RED_BG,
    redText: DARK_RED_TEXT,
    amber: DARK_AMBER,
    amberBg: DARK_AMBER_BG,
    amberText: DARK_AMBER_TEXT,
    green: DARK_GREEN,
    greenBg: DARK_GREEN_BG,
    greenText: DARK_GREEN_TEXT,
    blue: '#7090B0',
  },
  light: {
    bg: LIGHT_PAGE_BG,
    surface: LIGHT_HERO_SURFACE,
    surface2: LIGHT_PANEL_SURFACE,
    surface3: LIGHT_SOLID_PANEL_ALT,
    border: LIGHT_BORDER,
    border2: LIGHT_BORDER_STRONG,
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
    textFaint: LIGHT_TEXT_FAINT,
    accent: LIGHT_ACCENT,
    accentLight: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    red: LIGHT_RED,
    redBg: LIGHT_RED_BG,
    redText: LIGHT_RED_TEXT,
    amber: LIGHT_AMBER,
    amberBg: LIGHT_AMBER_BG,
    amberText: LIGHT_AMBER_TEXT,
    green: LIGHT_GREEN,
    greenBg: LIGHT_GREEN_BG,
    greenText: LIGHT_GREEN_TEXT,
    blue: '#5B7FA6',
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    surface3: SHARP_SOLID_PANEL_ALT,
    border: SHARP_BORDER,
    border2: SHARP_BORDER_STRONG,
    text: SHARP_TEXT,
    textMuted: SHARP_TEXT_MUTED,
    textFaint: SHARP_TEXT_FAINT,
    accent: SHARP_ACCENT,
    accentLight: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    red: SHARP_RED,
    redBg: SHARP_RED_BG,
    redText: SHARP_RED_TEXT,
    amber: SHARP_AMBER,
    amberBg: SHARP_AMBER_BG,
    amberText: SHARP_AMBER_TEXT,
    green: SHARP_GREEN,
    greenBg: SHARP_GREEN_BG,
    greenText: SHARP_GREEN_TEXT,
    blue: SHARP_ACCENT,
  },
}

function getAdminThemeVars(theme) {
  const C = ADMIN_THEMES[theme] || ADMIN_THEMES.light
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--surface3': C.surface3,
    '--border': C.border,
    '--border2': C.border2,
    '--text': C.text,
    '--text-muted': C.textMuted,
    '--text-faint': C.textFaint,
    '--accent': C.accent,
    '--accent-light': C.accentLight,
    '--accent-text': C.accentText,
    '--red': C.red,
    '--red-bg': C.redBg,
    '--red-text': C.redText,
    '--amber': C.amber,
    '--amber-bg': C.amberBg,
    '--amber-text': C.amberText,
    '--green': C.green,
    '--green-bg': C.greenBg,
    '--green-text': C.greenText,
    '--blue': C.blue,
  }
}

const G = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  accentText: 'var(--accent-text)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  redText: 'var(--red-text)',
  amber: 'var(--amber)',
  amberBg: 'var(--amber-bg)',
  amberText: 'var(--amber-text)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  greenText: 'var(--green-text)',
  blue: 'var(--blue)',
}

const MONO = '"DM Mono", ui-monospace, monospace'
const SANS = '"DM Sans", system-ui, -apple-system, sans-serif'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconHome },
  { key: 'users', label: 'Users', Icon: IconPerson, badge: 'userCount' },
  { key: 'settings', label: 'Settings', Icon: IconGear },
]

const TIER_STYLES = {
  foundation:   { bg: G.accentLight, color: G.accentText,  border: G.accent  },
  intelligence: { bg: G.surface3,    color: G.blue,        border: G.border2  },
  pilot:        { bg: G.greenBg,     color: G.greenText,   border: G.green    },
}

function normTier(tier) {
  if (tier === 'intelligence') return 'intelligence'
  return 'foundation'
}

function displayTierLabel(tier) {
  if (normTier(tier) === 'intelligence') return 'Professional'
  return 'Unpaid'
}

// Use this for displaying plan label per user — checks is_pilot first
function userPlanLabel(user) {
  if (user?.is_pilot) return 'Pilot'
  if (normTier(user?.tier) === 'intelligence') return 'Professional'
  return 'Unpaid'
}

function userPlanStyle(user) {
  if (user?.is_pilot) return TIER_STYLES.pilot
  return TIER_STYLES[normTier(user?.tier)] || TIER_STYLES.foundation
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fmtRelative(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const units = [
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (const [unit, size] of units) {
    if (absMs >= size || unit === 'minute') {
      return rtf.format(Math.round(diffMs / size), unit)
    }
  }

  return 'just now'
}

function panelStyle(extra = {}) {
  return {
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 6,
    ...extra,
  }
}

function textClamp(text, length = 60) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

function initials(name, email) {
  const source = (name || email || 'SA').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

function parseMaybeJson(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function asArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(Boolean)
  }
  return []
}

function stripAssumption(value) {
  return String(value || '').replace(/\[assumption\]/gi, '').trim()
}

function isAssumption(value) {
  return /\[assumption\]/i.test(String(value || ''))
}

function monoStyle(extra = {}) {
  return {
    fontFamily: MONO,
    fontVariantNumeric: 'tabular-nums',
    ...extra,
  }
}

function getSsePayload(raw) {
  const events = raw
    .split('\n\n')
    .map(chunk => chunk
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.replace(/^data:\s?/, '').trim())
      .join(''))
    .filter(Boolean)

  for (let i = events.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(events[i])
    } catch {
      continue
    }
  }

  throw new Error('Unable to parse MCP event stream response.')
}

async function callAdminTool(tool, input = {}, token) {
  if (!token) throw new Error('No session token available.')

  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${tool}-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: tool,
        arguments: input,
      },
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(raw || `Admin request failed (${response.status})`)
  }

  const contentType = response.headers.get('content-type') || ''
  let payload

  if (contentType.includes('text/event-stream')) {
    payload = getSsePayload(raw)
  } else {
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error('Unable to parse admin response.')
    }
  }

  if (payload?.error) {
    throw new Error(payload.error.message || 'Admin tool failed.')
  }

  const text = payload?.result?.content?.find?.(entry => entry.type === 'text')?.text
  if (text) {
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  return payload?.result ?? null
}

function getReportMode(report) {
  const parsed = parseMaybeJson(report?.content)
  const raw = report?.conversation_mode || parsed?.conversation_mode || parsed?.mode || ''
  if (raw === 'EXECUTION_HUMAN') return 'HUMAN_MOMENT'
  if (raw === 'EXECUTION') return 'EXECUTION'
  return 'DIAGNOSTIC'
}

function getReportStatus(report, sharedWithVnklo = false) {
  if (report?.status) return String(report.status).toUpperCase()
  if (sharedWithVnklo) return 'SHARED'
  return 'READY'
}

function extractChatRowsFromReport(report) {
  const parsed = parseMaybeJson(report?.content)
  const candidates = [
    report?.conversation_history,
    report?.chat_messages,
    report?.messages,
    parsed?.conversation_history,
    parsed?.chat_messages,
    parsed?.messages,
  ]

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const rows = candidate
      .map((row, index) => ({
        id: row.id || `${report?.id || 'report'}-${index}`,
        role: row.role || row.sender || 'assistant',
        message: row.message || row.content || row.text || '',
      }))
      .filter(row => row.message)

    if (rows.length > 0) return rows
  }

  return null
}

function extractBusinessIntel(source) {
  const latestReport = source?.reports?.[0] || null
  const latestDiagnostic = source?.reports?.find?.(report => getReportMode(report) === 'DIAGNOSTIC') || latestReport
  const parsed = parseMaybeJson(latestDiagnostic?.content) || {}
  const businessState = parsed.business_state || parsed.businessState || {}

  const coreOffer = businessState.core_offer || parsed.core_offer || parsed.offer || ''
  const activeGoal = businessState.active_goal || parsed.active_goal || parsed.goal || ''
  const goalScore = Number(businessState.goal_score ?? parsed.goal_score ?? 0) || 0
  const operationalBlockers = asArray(businessState.operational_blockers || parsed.operational_blockers)
  const targetCustomer = businessState.target_customer || parsed.target_customer || ''
  const assumptionsUnverified = asArray(businessState.assumptions_unverified || parsed.assumptions_unverified)
  const funnelStages = asArray(businessState.funnel_stages || parsed.funnel_stages)
  const revenueStreams = asArray(businessState.revenue_streams || parsed.revenue_streams)
  const domainsAudited = asArray(parsed.domains).map(entry => {
    if (typeof entry === 'string') return entry
    return entry?.name || entry?.domain || ''
  }).filter(Boolean)
  const lastAuditHeadline = parsed.headline || parsed.title || latestReport?.title || ''

  return {
    coreOffer,
    activeGoal,
    goalScore,
    operationalBlockers,
    targetCustomer,
    assumptionsUnverified,
    funnelStages,
    revenueStreams,
    domainsAudited,
    lastAuditHeadline,
    latestReport,
    latestDiagnostic,
  }
}

function Spinner() {
  return (
    <div style={{ padding: '32px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: 20,
        height: 20,
        border: `0.5px solid ${G.border2}`,
        borderTopColor: G.accentText,
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
    </div>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div style={{
      ...panelStyle({
        background: G.redBg,
        borderColor: G.red,
        color: G.redText,
        padding: '12px 14px',
        marginBottom: 16,
        fontSize: 13,
      }),
    }}>
      {message}
    </div>
  )
}

function Badge({ children, tone = 'default', mono = false }) {
  const toneMap = {
    default: { bg: G.surface2, color: G.textMuted, border: G.border2 },
    accent: { bg: G.accentLight, color: G.accentText, border: G.accent },
    green: { bg: G.greenBg, color: G.greenText, border: G.green },
    amber: { bg: G.amberBg, color: G.amberText, border: G.amber },
    red: { bg: G.redBg, color: G.redText, border: G.red },
  }
  const style = toneMap[tone] || toneMap.default

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 8px',
      borderRadius: 4,
      border: `0.5px solid ${style.border}`,
      background: style.bg,
      color: style.color,
      fontSize: 11,
      lineHeight: 1,
      fontWeight: 500,
      ...(mono ? monoStyle() : null),
    }}>
      {children}
    </span>
  )
}

function StatusDot({ color }) {
  return (
    <span style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: color,
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: G.textFaint,
      marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

function EmptyText({ children = '—' }) {
  return (
    <span style={{ color: G.textMuted, fontStyle: 'italic' }}>{children}</span>
  )
}

function ProgressBar({ value, tone = 'accent' }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  const fill = tone === 'green' ? G.greenText : tone === 'amber' ? G.amberText : G.accentText
  return (
    <div style={{
      width: '100%',
      height: 8,
      border: `0.5px solid ${G.border2}`,
      background: G.surface2,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${safe}%`,
        height: '100%',
        background: fill,
      }} />
    </div>
  )
}

function MessageThread({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10 }}>
      {rows.map((row, index) => {
        const isUser = row.role === 'user'
        return (
          <div key={row.id || index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%',
              border: `0.5px solid ${isUser ? G.accent : G.border2}`,
              background: isUser ? G.accentLight : G.surface2,
              color: isUser ? G.text : G.textMuted,
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {row.message || <span style={{ fontStyle: 'italic', color: G.textFaint }}>empty</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TextSection({ label, text, italic = false }) {
  if (!text) return null
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{
        color: G.textMuted,
        fontSize: 13,
        lineHeight: 1.7,
        fontStyle: italic ? 'italic' : 'normal',
      }}>
        {text}
      </div>
    </div>
  )
}

function ReportSchemaB({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {p.headline && (
        <div style={{ color: G.text, fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
          {p.headline}
        </div>
      )}
      <TextSection label="Acknowledgment" text={p.acknowledgment} />
      <TextSection label="What This Actually Is" text={p.what_this_actually_is} />
      {p.delivery_script && (
        <div>
          <SectionLabel>Delivery Script</SectionLabel>
          <div style={{
            ...panelStyle({
              background: G.surface2,
              padding: '12px 14px',
              color: G.textMuted,
              fontSize: 12,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: MONO,
            }),
          }}>
            {p.delivery_script}
          </div>
        </div>
      )}
      <TextSection label="What To Expect" text={p.what_to_expect} />
      <TextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function ReportSchemaExecution({ p }) {
  const deliveryPlan = p.delivery_plan ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {p.headline && (
        <p style={{ fontSize: 17, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>
      )}
      <TextSection label="Execution Context" text={p.execution_context} />
      {deliveryPlan.length > 0 && (
        <div>
          <SectionLabel>Delivery Plan</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deliveryPlan.map((item, i) => (
              <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
                {item.action && <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{item.step ? `${item.step}. ` : ''}{item.action}</p>}
                {item.why && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <TextSection label="What To Expect" text={p.what_to_expect} />
      <TextSection label="Key Message" text={p.key_message} />
      <TextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function ReportSchemaA({ p }) {
  const domains = p.domains ?? []
  const nonAiFixes = p.non_ai_fixes ?? []
  const aiOpportunities = p.ai_opportunities ?? []
  const priorityActions = p.priority_actions ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {p.headline && (
        <div style={{ color: G.text, fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>
          {p.headline}
        </div>
      )}

      <TextSection label="Verdict" text={p.overall_verdict} />

      <div>
        <SectionLabel>Domains</SectionLabel>
        {domains.length === 0 ? (
          <EmptyText>No domain breakdown available.</EmptyText>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {domains.map((domain, index) => {
              const status = String(domain.status || '').toLowerCase()
              const tone = status === 'good' ? 'green' : status === 'critical' ? 'red' : 'amber'
              return (
                <div key={index} style={{ ...panelStyle({ background: G.surface2, padding: '12px 14px' }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ color: G.text, fontSize: 13, fontWeight: 500 }}>{domain.name || 'Domain'}</div>
                    {domain.status && <Badge tone={tone}>{String(domain.status).replace(/_/g, ' ')}</Badge>}
                  </div>
                  {domain.finding && <div style={{ color: G.textMuted, fontSize: 12, lineHeight: 1.65 }}>{domain.finding}</div>}
                  {domain.action && (
                    <div style={{ marginTop: 8, color: G.text, fontSize: 12, lineHeight: 1.65 }}>
                      <span style={{ color: G.accentText }}>→</span> {domain.action}
                    </div>
                  )}
                  {domain.urgency && (
                    <div style={{ marginTop: 8 }}>
                      <Badge tone="amber">{domain.urgency}</Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {nonAiFixes.length > 0 && (
        <div>
          <SectionLabel>Non-AI Fixes</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nonAiFixes.map((item, index) => (
              <div key={index} style={{ ...panelStyle({ background: G.surface2, padding: '10px 14px' }) }}>
                {item.issue && <div style={{ color: G.text, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{item.issue}</div>}
                {item.fix && <div style={{ color: G.textMuted, fontSize: 12, lineHeight: 1.65 }}>{item.fix}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {aiOpportunities.length > 0 && (
        <div>
          <SectionLabel>AI Opportunities</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aiOpportunities.map((item, index) => (
              <div key={index} style={{ ...panelStyle({ background: G.surface2, padding: '10px 14px' }) }}>
                {item.area && <div style={{ color: G.text, fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{item.area}</div>}
                {item.why && <div style={{ color: G.textMuted, fontSize: 12, lineHeight: 1.65 }}>{item.why}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <SectionLabel>Priority Actions</SectionLabel>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {priorityActions.map((item, index) => (
              <li key={index} style={{ color: G.textMuted, fontSize: 12, lineHeight: 1.65 }}>
                {typeof item === 'string' ? item : item.action || item.text || JSON.stringify(item)}
              </li>
            ))}
          </ol>
        </div>
      )}

      <TextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function ReportSchemaGoal({ p }) {
  const gap = p.goal_gap_analysis || {}
  const missingCapabilities = p.missing_capabilities || []
  const priorityActions = p.priority_actions || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {p.headline && (
        <p style={{ fontSize: 17, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>
      )}

      <TextSection label="Verdict" text={p.overall_verdict} />
      <TextSection label="Goal" text={gap.goal} />
      <TextSection label="Current Position" text={gap.current_position} />
      <TextSection label="The Gap" text={gap.gap} />
      <TextSection label="Fastest Path" text={gap.fastest_path} />
      <TextSection label="Timeline" text={p.timeline_feasibility || gap.realistic_timeline} />

      {missingCapabilities.length > 0 && (
        <div>
          <SectionLabel>Missing Capabilities</SectionLabel>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {missingCapabilities.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <SectionLabel>Priority Actions</SectionLabel>
          <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {priorityActions.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>
                {typeof item === 'string' ? item : (item.action ?? item.text ?? JSON.stringify(item))}
              </li>
            ))}
          </ol>
        </div>
      )}

      <TextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function ReportContent({ content }) {
  if (!content) return <EmptyText>No content stored.</EmptyText>

  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return (
      <pre style={{
        margin: 0,
        color: G.textMuted,
        fontSize: 12,
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: MONO,
      }}>
        {content}
      </pre>
    )
  }

  const mode = parsed.conversation_mode ?? 'DIAGNOSTIC'
  if (mode === 'GOAL_GAP') return <ReportSchemaGoal p={parsed} />
  if (mode === 'EXECUTION') return <ReportSchemaExecution p={parsed} />
  if (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN') return <ReportSchemaB p={parsed} />
  return <ReportSchemaA p={parsed} />
}

function IconHome() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 6.2L7 2L12 6.2V12H8.75V8.8H5.25V12H2V6.2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="4.25" r="2.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.25 12C2.25 9.85 4.37 8.1 7 8.1C9.63 8.1 11.75 9.85 11.75 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="1.85" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 1.75V2.8M7 11.2V12.25M12.25 7H11.2M2.8 7H1.75M10.75 3.25L10 4M4 10L3.25 10.75M10.75 10.75L10 10M4 4L3.25 3.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconChevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
    >
      <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SidebarButton({ active, label, Icon, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        border: `0.5px solid ${active ? G.accent : G.border}`,
        borderRadius: 6,
        background: active ? G.accentLight : 'transparent',
        color: active ? G.accentText : G.textMuted,
        cursor: 'pointer',
        fontSize: 13,
        textAlign: 'left',
        fontFamily: SANS,
      }}
    >
      <span style={{ display: 'flex', color: active ? G.accentText : G.textFaint }}>
        <Icon />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <Badge mono>{badge}</Badge>
      )}
    </button>
  )
}

function AdminSidebar({ session, navSection, onNav, userCount }) {
  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: G.bg,
      borderRight: `0.5px solid ${G.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px 12px',
    }}>
      <div style={{ marginBottom: 18, padding: '0 4px' }}>
        <div style={{ color: G.text, fontSize: 16, letterSpacing: '-0.03em' }}>
          self<span style={{ color: G.accentText }}>audit</span>
        </div>
        <div style={{ color: G.textFaint, fontSize: 11, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          admin console
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {NAV_ITEMS.map(item => (
          <SidebarButton
            key={item.key}
            active={navSection === item.key}
            label={item.label}
            Icon={item.Icon}
            badge={item.badge === 'userCount' ? userCount : null}
            onClick={() => onNav(item.key)}
          />
        ))}
      </div>

      <div style={{ marginTop: 'auto', ...panelStyle({ padding: '10px 12px' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `0.5px solid ${G.accent}`,
            background: G.accentLight,
            color: G.accentText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...monoStyle({ fontSize: 12 }),
          }}>
            {initials(session?.user?.user_metadata?.full_name, session?.user?.email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: G.text, fontSize: 12 }}>{session?.user?.user_metadata?.full_name || 'Sahej'}</div>
            <div style={{ color: G.textMuted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function AdminTopbar({ section, onCycleTheme }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div style={{
      height: 48,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: `0.5px solid ${G.border}`,
      background: G.bg,
    }}>
      <div style={{ color: G.text, fontSize: 13 }}>
        selfaudit <span style={{ color: G.textFaint }}>/</span> <span style={{ color: G.accentText }}>{section}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          type="button"
          onClick={onCycleTheme}
          aria-label="Cycle theme"
          style={{
            border: `0.5px solid ${G.border2}`,
            background: G.surface2,
            color: G.textMuted,
            borderRadius: 6,
            padding: '4px 11px',
            fontSize: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: SANS,
          }}
        >
          ◐ Theme
        </button>
        <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{today}</div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, delta }) {
  return (
    <div style={{ ...panelStyle({ padding: '14px 16px' }) }}>
      <div style={{ color: G.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ color: G.text, fontSize: 28, lineHeight: 1, marginBottom: 10, ...monoStyle() }}>
        {value}
      </div>
      <Badge tone="accent" mono>{delta}</Badge>
    </div>
  )
}

function UserActivityPanel({ users, stats }) {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  const paying      = users.filter(u => normTier(u.tier) === 'intelligence')
  const churnRisk   = paying.filter(u => !u.last_health_check_at || new Date(u.last_health_check_at).getTime() < thirtyDaysAgo)
  const newThisMonth = users.filter(u => u.created_at && new Date(u.created_at).getTime() >= thirtyDaysAgo)

  const tiles = [
    { label: 'Paying users',         value: paying.length,                   tone: 'accent', note: 'active subscriptions' },
    { label: 'Audits this week',     value: stats?.reports_this_week ?? '—', tone: 'green',  note: 'reports generated last 7 days' },
    { label: 'Churn risk (30d idle)',value: churnRisk.length,                tone: churnRisk.length > 0 ? 'red' : 'default', note: 'paid but inactive 30+ days' },
    { label: 'New this month',       value: newThisMonth.length,             tone: 'default', note: 'signed up last 30 days' },
  ]

  const toneColor = { accent: G.accentText, green: G.greenText, red: G.redText, default: G.textMuted }

  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
      <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>User activity</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {tiles.map(tile => (
          <div key={tile.label} style={{ ...panelStyle({ background: G.surface2, padding: '14px 12px' }) }}>
            <div style={{ color: G.textMuted, fontSize: 11, lineHeight: 1.4, marginBottom: 12 }}>{tile.label}</div>
            <div style={{ color: toneColor[tile.tone], fontSize: 28, lineHeight: 1, marginBottom: 6, ...monoStyle() }}>{tile.value}</div>
            <div style={{ color: G.textFaint, fontSize: 11 }}>{tile.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTable({ users, detailCache, onSelectUser, title = 'Users' }) {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter(user => {
      const matchesSearch = !query || [user.name, user.email, user.industry, user.domain]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
      const matchesTier = tierFilter === 'all'
        || (tierFilter === 'pilot'        && user.is_pilot)
        || (tierFilter === 'intelligence' && !user.is_pilot && normTier(user.tier) === 'intelligence')
      return matchesSearch && matchesTier
    })
  }, [search, tierFilter, users])

  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ color: G.text, fontSize: 13 }}>{title}</div>
        <div style={{ color: G.textFaint, fontSize: 11, ...monoStyle() }}>{filtered.length} rows</div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="search name, email, industry"
          style={{
            flex: 1,
            minWidth: 220,
            height: 34,
            borderRadius: 6,
            border: `0.5px solid ${G.border2}`,
            background: G.surface2,
            color: G.text,
            padding: '0 12px',
            outline: 'none',
            fontSize: 12,
            fontFamily: SANS,
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all',          label: 'All' },
            { key: 'intelligence', label: 'Professional' },
            { key: 'pilot',        label: 'Pilot' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTierFilter(f.key)}
              style={{
                padding: '7px 10px', borderRadius: 4,
                border: `0.5px solid ${tierFilter === f.key ? G.accent : G.border2}`,
                background: tierFilter === f.key ? G.accentLight : G.surface2,
                color: tierFilter === f.key ? G.accentText : G.textMuted,
                cursor: 'pointer', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: '0.06em', fontFamily: SANS,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 400, overflow: 'auto', border: `0.5px solid ${G.border}`, borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: G.surface, zIndex: 1 }}>
            <tr>
              {['', 'Name', 'Email', 'Plan', 'Industry', 'Domain', 'Reports', 'Joined', 'Last audit', 'Last check', 'Connectors'].map(label => (
                <th
                  key={label || 'status'}
                  style={{
                    padding: '10px 12px',
                    borderBottom: `0.5px solid ${G.border}`,
                    color: G.textFaint,
                    fontSize: 10,
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: label === '' ? 'center' : 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '24px 12px', color: G.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
                  no users found
                </td>
              </tr>
            ) : filtered.map(user => {
              const detail = detailCache[user.email]
              const lastAudit = detail?.reports?.[0]?.created_at || null
              const hasStarted = (detail?.chat_sessions?.length ?? 0) > 0 || user.industry || user.domain
              const dotColor = user.report_count > 0 ? G.greenText : hasStarted ? G.amberText : G.textFaint
              const tierStyle = userPlanStyle(user)

              return (
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  style={{ cursor: 'pointer', borderBottom: `0.5px solid ${G.border}` }}
                >
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}><StatusDot color={dotColor} /></td>
                  <td style={{ padding: '12px', color: G.text, fontSize: 12 }}>{user.name || '—'}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12 }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: `0.5px solid ${tierStyle.border}`,
                      background: tierStyle.bg,
                      color: tierStyle.color,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}>
                      {userPlanLabel(user)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12 }}>{user.industry || '—'}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12 }}>{user.domain || '—'}</td>
                  <td style={{ padding: '12px', color: G.text, fontSize: 12, ...monoStyle() }}>{user.report_count ?? 0}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12, ...monoStyle() }}>{fmtDate(user.created_at)}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12, ...monoStyle() }}>{fmtDate(lastAudit)}</td>
                  <td style={{ padding: '12px', fontSize: 12, ...monoStyle() }}>
                    {user.last_health_check_at ? (
                      <span style={{ color: user.last_health_score >= 70 ? G.greenText : user.last_health_score >= 45 ? G.amberText : G.redText }}>
                        {user.last_health_score ?? '—'} · {fmtDate(user.last_health_check_at)}
                      </span>
                    ) : <span style={{ color: G.textFaint }}>—</span>}
                  </td>
                  <td style={{ padding: '12px', color: user.connector_count > 0 ? G.greenText : G.textFaint, fontSize: 12, ...monoStyle() }}>
                    {user.connector_count > 0 ? `${user.connector_count} connected` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RightRail({ stats, users, detailCache, reliability }) {
  const totalUsers = stats?.total_users ?? users.length
  const totalReports = stats?.total_reports ?? users.reduce((sum, user) => sum + (user.report_count ?? 0), 0)
  const totalSessions = stats?.total_chat_sessions ?? 0
  const reportRate = totalSessions > 0 ? ((totalReports / totalSessions) * 100).toFixed(0) : '0'
  const avgReports = totalUsers > 0 ? (totalReports / totalUsers).toFixed(2) : '0.00'
  const signupsThisWeek = stats?.signups_this_week ?? 0

  const tierCounts = users.reduce((acc, user) => {
    if (user.is_pilot) {
      acc.pilot = (acc.pilot || 0) + 1
    } else {
      const tier = normTier(user.tier)
      acc[tier] = (acc[tier] || 0) + 1
    }
    return acc
  }, { foundation: 0, intelligence: 0, pilot: 0 })

  const mrr = tierCounts.intelligence * 99

  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
      <div style={{ ...panelStyle({ padding: '16px 16px 14px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 12 }}>Platform health</div>
        {[
          ['chat → report rate', `${reportRate}%`],
          ['avg reports / user', avgReports],
          ['signups this week', signupsThisWeek],
          ['total sessions', totalSessions],
        ].map(([label, value], index, list) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index === list.length - 1 ? 'none' : `0.5px solid ${G.border}`,
          }}>
            <div style={{ color: G.textMuted, fontSize: 12 }}>{label}</div>
            <div style={{ color: G.text, fontSize: 12, ...monoStyle() }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 16px 14px' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div style={{ color: G.text, fontSize: 13 }}>Plan distribution</div>
          <div style={{ color: G.accentText, fontSize: 13, ...monoStyle() }}>${mrr}/mo</div>
        </div>
        {[
          { key: 'intelligence', label: 'Professional', price: 99,  color: G.accentText },
          { key: 'pilot',        label: 'Pilot',        price: 0,   color: G.greenText  },
        ].map(row => {
          const count = tierCounts[row.key] || 0
          const width = totalUsers > 0 ? (count / totalUsers) * 100 : 0
          return (
            <div key={row.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ color: G.textMuted, fontSize: 11 }}>{row.label}</div>
                <div style={{ color: G.text, fontSize: 11, ...monoStyle() }}>
                  {count}{row.price > 0 ? ` · $${count * row.price}` : ' · free'}
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 4, border: `0.5px solid ${G.border2}`, background: G.surface2, overflow: 'hidden' }}>
                <div style={{ width: `${width}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 16px 14px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 12 }}>Reliability watch</div>
        {[
          ['unresolved alerts', reliability?.unresolved_alerts],
          ['acknowledged alerts', reliability?.acknowledged_alerts],
          ['old unresolved alerts', reliability?.old_unresolved_alerts],
          ['health checks (24h)', reliability?.health_checks_last_day],
          ['stale syntheses', reliability?.stale_synthesis_count],
        ].map(([label, value], index, list) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: index === list.length - 1 ? 'none' : `0.5px solid ${G.border}`,
          }}>
            <div style={{ color: G.textMuted, fontSize: 12 }}>{label}</div>
            <div style={{ color: G.text, fontSize: 12, ...monoStyle() }}>{value ?? '—'}</div>
          </div>
        ))}

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${G.border}` }}>
          <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Latest runs
          </div>
          {[
            ['health check', reliability?.latest_health_check_at ? fmtRelative(reliability.latest_health_check_at) : '—'],
            ['connector sync', reliability?.latest_connector_sync_at ? `${reliability.latest_connector_provider || 'unknown'} · ${fmtRelative(reliability.latest_connector_sync_at)}` : '—'],
            ['synthesis', reliability?.latest_synthesis_at ? fmtRelative(reliability.latest_synthesis_at) : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ color: G.textMuted, fontSize: 11 }}>{label}</div>
              <div style={{ color: G.text, fontSize: 11, textAlign: 'right' }}>{value}</div>
            </div>
          ))}
        </div>

        {(reliability?.failing_syncs?.length ?? 0) > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${G.border}` }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Recent sync failures
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reliability.failing_syncs.slice(0, 3).map((item, index) => (
                <div key={`${item.provider}-${item.synced_at}-${index}`} style={{ background: G.surface2, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div style={{ color: G.text, fontSize: 11 }}>{item.provider || 'unknown'}</div>
                    <div style={{ color: item.status === 'error' ? G.redText : G.amberText, fontSize: 11, textTransform: 'uppercase' }}>{item.status || 'issue'}</div>
                  </div>
                  <div style={{ color: G.textMuted, fontSize: 11, lineHeight: 1.5 }}>{textClamp(item.error_message || 'No error message captured.', 70)}</div>
                  <div style={{ color: G.textFaint, fontSize: 10, marginTop: 4 }}>{fmtRelative(item.synced_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

function TierEditor({ email, tier, onChange, saving }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(value => !value)}
        style={{
          border: `0.5px solid ${(TIER_STYLES[normTier(tier)] || TIER_STYLES.foundation).border}`,
          background: (TIER_STYLES[normTier(tier)] || TIER_STYLES.foundation).bg,
          color: (TIER_STYLES[normTier(tier)] || TIER_STYLES.foundation).color,
          borderRadius: 4,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 11,
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: SANS,
        }}
      >
        {displayTierLabel(tier)}
        <IconChevron open={open} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: 140,
          zIndex: 10,
          ...panelStyle({ padding: 6 }),
        }}>
          {['intelligence', 'foundation'].map(nextTier => (
            <button
              key={nextTier}
              disabled={saving}
              onClick={() => {
                setOpen(false)
                if (nextTier !== normTier(tier)) onChange(email, nextTier)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                color: G.text,
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: SANS,
              }}
            >
              {nextTier}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function UserDetailView({ user, detail, onBack, onTierChange, tierSaving, session }) {
  const [expandedReports, setExpandedReports] = useState(new Set())
  const [showAllReports, setShowAllReports] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState(new Set())
  const [reportDetails, setReportDetails] = useState({})
  const [reportError, setReportError] = useState('')
  const [stripeStatus, setStripeStatus] = useState(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [hcTriggering, setHcTriggering] = useState(false)
  const [hcMessage, setHcMessage] = useState('')

  useEffect(() => {
    setExpandedReports(new Set())
    setExpandedSessions(new Set())
    setShowAllReports(false)
    setReportDetails({})
    setReportError('')
    setStripeStatus(null)
    setHcMessage('')
  }, [user?.email])

  const loadStripeStatus = async () => {
    if (stripeLoading || stripeStatus) return
    setStripeLoading(true)
    try {
      const data = await callAdminTool('tsa_get_stripe_status', { email: user.email }, session?.access_token)
      setStripeStatus(data)
    } catch { setStripeStatus({ status: 'error', error: 'Could not load' }) }
    finally { setStripeLoading(false) }
  }

  const triggerHealthCheck = async () => {
    if (hcTriggering) return
    setHcTriggering(true)
    setHcMessage('')
    try {
      const res = await fetch('/api/admin-trigger-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (res.ok) setHcMessage(`✓ Done — health score: ${data.health_score ?? '?'}`)
      else setHcMessage(`✗ ${data.error || 'Failed'}`)
    } catch { setHcMessage('✗ Request failed') }
    finally { setHcTriggering(false) }
  }

  const profile = detail?.profile || user
  const reports = detail?.reports || []
  const chatSessions = detail?.chat_sessions || []
  const liveBrain = detail?.brain ?? null
  const intel = extractBusinessIntel(detail || { reports })

  // Prefer live brain state (from business_state + intelligence_profiles tables)
  // over values parsed from report JSON — fall back to intel when brain is absent
  const coreOffer            = liveBrain?.core_offer             || intel.coreOffer
  const targetCustomer       = liveBrain?.target_customer        || intel.targetCustomer
  const activeGoal           = liveBrain?.active_goal            || intel.activeGoal
  const goalScore            = liveBrain?.goal_score             ?? intel.goalScore
  const operationalBlockers  = liveBrain?.operational_blockers?.length  ? liveBrain.operational_blockers  : intel.operationalBlockers
  const assumptionsUnverified= liveBrain?.assumptions_unverified?.length? liveBrain.assumptions_unverified : intel.assumptionsUnverified
  const domainsAudited       = liveBrain?.domains_audited?.length        ? liveBrain.domains_audited        : intel.domainsAudited
  const lastAuditHeadline    = liveBrain?.last_audit_headline    || intel.lastAuditHeadline
  const topPriorities        = liveBrain?.top_priorities  ?? []
  const watchouts            = liveBrain?.watchouts        ?? []

  const summaryText = liveBrain?.intelligence_summary || (() => {
    const parts = []
    if (coreOffer)          parts.push(stripAssumption(coreOffer))
    if (targetCustomer)     parts.push(`targeting ${stripAssumption(targetCustomer)}`)
    if (activeGoal)         parts.push(`working toward ${stripAssumption(activeGoal)}`)
    if (lastAuditHeadline)  parts.push(`Last finding: ${lastAuditHeadline}`)
    return parts.join('. ')
  })()
  const displayedReports = showAllReports ? reports : reports.slice(0, 5)
  const stripeCustomerId = profile?.stripe_customer_id || profile?.customer_id || '—'
  const stripeSubscriptionId = profile?.stripe_subscription_id || profile?.subscription_id || '—'

  const toggleReport = async (report) => {
    const next = new Set(expandedReports)
    if (next.has(report.id)) {
      next.delete(report.id)
      setExpandedReports(next)
      return
    }

    next.add(report.id)
    setExpandedReports(next)

    if (!reportDetails[report.id]) {
      try {
        const fullReport = await callAdminTool('tsa_get_report', { report_id: report.id }, session?.access_token)
        setReportDetails(prev => ({ ...prev, [report.id]: fullReport }))
      } catch (error) {
        setReportError(error.message || 'Unable to load report detail.')
      }
    }
  }

  const toggleSession = (sessionId) => {
    const next = new Set(expandedSessions)
    if (next.has(sessionId)) next.delete(sessionId)
    else next.add(sessionId)
    setExpandedSessions(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 12px',
          borderRadius: 6,
          border: `0.5px solid ${G.border2}`,
          background: G.surface2,
          color: G.textMuted,
          cursor: 'pointer',
          fontSize: 12,
          fontFamily: SANS,
        }}
      >
        ← back to dashboard
      </button>

      <div style={{ ...panelStyle({ padding: '18px 18px 16px' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: G.text, fontSize: 20, marginBottom: 4 }}>{user.name || '(no name)'}</div>
            <div style={{ color: G.textMuted, fontSize: 13 }}>{user.email}</div>
          </div>
          <TierEditor email={user.email} tier={profile?.tier || user.tier} onChange={onTierChange} saving={tierSaving} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
          {[
            ['industry', profile?.industry],
            ['domain', profile?.domain],
            ['joined', fmtDate(profile?.created_at || user.created_at)],
            ['total reports', reports.length],
            ['last audit', fmtDate(reports[0]?.created_at)],
          ].map(([label, value]) => (
            <div key={label} style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
              <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
              <div style={{ color: G.text, fontSize: 13, ...(typeof value === 'number' ? monoStyle() : null) }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>What the AI knows</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionLabel>core offer</SectionLabel>
              <div style={{ color: isAssumption(coreOffer) ? G.textMuted : G.text, fontSize: 13, fontStyle: isAssumption(coreOffer) ? 'italic' : 'normal', lineHeight: 1.7 }}>
                {coreOffer ? stripAssumption(coreOffer) : <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>target customer</SectionLabel>
              <div style={{ color: isAssumption(targetCustomer) ? G.textMuted : G.text, fontSize: 13, fontStyle: isAssumption(targetCustomer) ? 'italic' : 'normal', lineHeight: 1.7 }}>
                {targetCustomer ? stripAssumption(targetCustomer) : <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>operational blockers</SectionLabel>
              {operationalBlockers.length === 0 ? (
                <EmptyText />
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                  {operationalBlockers.map((blocker, index) => (
                    <li key={index} style={{ fontStyle: isAssumption(blocker) ? 'italic' : 'normal' }}>
                      {stripAssumption(blocker)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {topPriorities.length > 0 && (
              <div>
                <SectionLabel>unresolved priorities</SectionLabel>
                <ul style={{ margin: 0, paddingLeft: 18, color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                  {topPriorities.slice(0, 4).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {watchouts.length > 0 && (
              <div>
                <SectionLabel>watchouts</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {watchouts.slice(0, 4).map((w, i) => <Badge key={i} tone="red">{w}</Badge>)}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionLabel>active goal</SectionLabel>
              <div style={{ color: G.text, fontSize: 13, marginBottom: 8 }}>
                {activeGoal ? stripAssumption(activeGoal) : <EmptyText />}
              </div>
              <ProgressBar value={goalScore || 0} />
              <div style={{ marginTop: 6, color: G.accentText, fontSize: 11, ...monoStyle() }}>{Math.round(goalScore || 0)} / 100</div>
            </div>
            <div>
              <SectionLabel>last audit headline</SectionLabel>
              <div style={{ color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                {lastAuditHeadline || <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>assumptions unverified</SectionLabel>
              {assumptionsUnverified.length === 0 ? (
                <EmptyText />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {assumptionsUnverified.map((item, index) => (
                    <Badge key={index} tone="amber">{stripAssumption(item)}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <SectionLabel>domains audited</SectionLabel>
              {domainsAudited.length === 0 ? (
                <EmptyText />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {domainsAudited.map((domain, index) => (
                    <Badge key={`${domain}-${index}`}>{domain}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {summaryText && (
        <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
          <SectionLabel>AI SUMMARY</SectionLabel>
          <div style={{ color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
            {summaryText}
          </div>
        </div>
      )}

      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ color: G.text, fontSize: 13 }}>Audit history</div>
          {reports.length > 5 && (
            <button
              onClick={() => setShowAllReports(value => !value)}
              style={{
                border: `0.5px solid ${G.border2}`,
                background: G.surface2,
                color: G.textMuted,
                borderRadius: 4,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: SANS,
              }}
            >
              {showAllReports ? 'show less' : 'show all'}
            </button>
          )}
        </div>
        <ErrorBanner message={reportError} />
        {displayedReports.length === 0 ? (
          <EmptyText>No reports yet.</EmptyText>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayedReports.map(report => {
              const fullReport = reportDetails[report.id]
              const mode = getReportMode(fullReport || report)
              const status = getReportStatus(fullReport || report, !!profile?.shared_with_vnklo)
              const open = expandedReports.has(report.id)
              return (
                <div key={report.id} style={{ ...panelStyle({ background: G.surface2, overflow: 'hidden' }) }}>
                  <button
                    onClick={() => toggleReport(report)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      cursor: 'pointer',
                      color: G.text,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, marginBottom: 6 }}>{report.title || '(untitled report)'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Badge tone={mode === 'HUMAN_MOMENT' ? 'amber' : mode === 'EXECUTION' ? 'accent' : 'default'}>{mode}</Badge>
                        <Badge tone={status === 'SHARED' ? 'accent' : 'green'}>{status}</Badge>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ color: G.textMuted, fontSize: 11, ...monoStyle() }}>{fmtDate(report.created_at)}</div>
                      <div style={{ color: G.textMuted }}><IconChevron open={open} /></div>
                    </div>
                  </button>
                  {open && (
                    <div style={{ borderTop: `0.5px solid ${G.border}`, padding: '14px' }}>
                      <ReportContent content={(fullReport || report).content} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Chat sessions</div>
        {chatSessions.length === 0 ? (
          <EmptyText>No chat sessions found.</EmptyText>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chatSessions.map(session => {
              const open = expandedSessions.has(session.session_id)
              const pseudoRows = session.messages?.length
                ? session.messages
                : [{ id: `${session.session_id}-empty`, role: 'assistant', message: 'No messages captured for this session.' }]
              return (
                <div key={session.session_id} style={{ ...panelStyle({ background: G.surface2, overflow: 'hidden' }) }}>
                  <button
                    onClick={() => toggleSession(session.session_id)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      cursor: 'pointer',
                      color: G.text,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: G.textMuted, fontSize: 12, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {session.preview || 'No preview stored for this session.'}
                      </div>
                      <Badge mono>{session.message_count} msgs</Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ color: G.textMuted, fontSize: 11, ...monoStyle() }}>{fmtDate(session.started_at)}</div>
                      <div style={{ color: G.textMuted }}><IconChevron open={open} /></div>
                    </div>
                  </button>
                  {open && (
                    <div style={{ borderTop: `0.5px solid ${G.border}`, padding: '0 14px 14px' }}>
                      <MessageThread rows={pseudoRows} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Plan management</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['intelligence', 'foundation'].map(tier => (
            <button
              key={tier}
              disabled={tierSaving}
              onClick={() => onTierChange(user.email, tier)}
              style={{
                padding: '8px 10px',
                borderRadius: 4,
                border: `0.5px solid ${normTier(profile?.tier || user.tier) === tier ? G.accent : G.border2}`,
                background: normTier(profile?.tier || user.tier) === tier ? G.accentLight : G.surface2,
                color: normTier(profile?.tier || user.tier) === tier ? G.accentText : G.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: SANS,
              }}
            >
              {displayTierLabel(tier)}
            </button>
          ))}
        </div>

        <SectionLabel>Billing identifiers</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>plan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ color: G.text, fontSize: 12, fontWeight: 500 }}>
                {user.is_pilot ? 'Pilot' : detail?.plan_name ? detail.plan_name.charAt(0).toUpperCase() + detail.plan_name.slice(1) : '—'}
              </div>
              {user.is_pilot && user.access_expires_at && (
                <span style={{ fontSize: 11, color: G.greenText }}>
                  free until {new Date(user.access_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <div style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>stripe customer id</div>
            <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{stripeCustomerId}</div>
          </div>
          <div style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>stripe subscription id</div>
            <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{stripeSubscriptionId}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', background: G.amberBg, border: `0.5px solid ${G.amber}`, borderRadius: 6, fontSize: 11, color: G.amberText, lineHeight: 1.5 }}>
          ⚠ Changing plan here updates the database only. Cancel the Stripe subscription separately if needed.
        </div>
      </div>

      {/* ── Alert history ─────────────────────────────────────────────────── */}
      {detail?.alerts?.length > 0 && (
        <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
          <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Alert history</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.alerts.map((alert) => {
              const sevTone = alert.severity === 'critical' || alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'amber' : 'default'
              const statusTone = alert.status === 'resolved' ? 'green' : alert.status === 'acknowledged' ? 'amber' : 'red'
              return (
                <div key={alert.id} style={{ ...panelStyle({ background: G.surface2, padding: '10px 14px' }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
                    <div style={{ color: G.text, fontSize: 12, fontWeight: 500, flex: 1 }}>{alert.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Badge tone={sevTone}>{alert.severity}</Badge>
                      <Badge tone={statusTone}>{alert.status}</Badge>
                    </div>
                  </div>
                  {alert.description && <div style={{ color: G.textMuted, fontSize: 11, lineHeight: 1.5, marginBottom: 4 }}>{alert.description}</div>}
                  <div style={{ color: G.textFaint, fontSize: 10, ...monoStyle() }}>{fmtDate(alert.created_at)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Health check history ───────────────────────────────────────────── */}
      {detail?.health_checks?.length > 0 && (
        <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
          <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Health check history</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.health_checks.map((hc) => {
              const score = hc.health_score ?? 0
              const tone = score >= 70 ? 'green' : score >= 45 ? 'amber' : 'red'
              return (
                <div key={hc.id} style={{ ...panelStyle({ background: G.surface2, padding: '10px 14px' }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ color: G.textMuted, fontSize: 11, ...monoStyle() }}>{fmtDate(hc.checked_at)}</div>
                    <Badge tone={tone}>{score}/100</Badge>
                  </div>
                  {hc.summary && <div style={{ color: G.textMuted, fontSize: 12, lineHeight: 1.5 }}>{hc.summary}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Connector activity ─────────────────────────────────────────────── */}
      {detail?.connectors?.length > 0 && (
        <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
          <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Connector activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detail.connectors.map((c, i) => {
              const tone = c.status === 'success' ? 'green' : c.status === 'error' ? 'red' : 'amber'
              return (
                <div key={i} style={{ ...panelStyle({ background: G.surface2, padding: '10px 14px' }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: c.error_message ? 6 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: G.text, fontSize: 12, fontWeight: 500 }}>{c.provider}</div>
                      <Badge tone={tone}>{c.status}</Badge>
                      {c.records_fetched > 0 && <span style={{ color: G.textFaint, fontSize: 11, ...monoStyle() }}>{c.records_fetched} records</span>}
                    </div>
                    <div style={{ color: G.textFaint, fontSize: 11, ...monoStyle() }}>{fmtDate(c.synced_at)}</div>
                  </div>
                  {c.error_message && <div style={{ color: G.redText, fontSize: 11, lineHeight: 1.5 }}>{c.error_message}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Stripe subscription status ─────────────────────────────────────── */}
      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ color: G.text, fontSize: 13 }}>Stripe subscription</div>
          {!stripeStatus && (
            <button
              onClick={loadStripeStatus}
              disabled={stripeLoading}
              style={{ padding: '5px 10px', borderRadius: 4, border: `0.5px solid ${G.border2}`, background: G.surface2, color: G.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: SANS }}
            >
              {stripeLoading ? 'Loading…' : 'Load status'}
            </button>
          )}
        </div>
        {!stripeStatus && !stripeLoading && (
          <div style={{ color: G.textFaint, fontSize: 12, fontStyle: 'italic' }}>Click "Load status" to fetch live data from Stripe.</div>
        )}
        {stripeStatus && stripeStatus.status !== 'error' && stripeStatus.status !== 'no_subscription' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {[
              ['Status', stripeStatus.status],
              ['Next billing', stripeStatus.current_period_end ? new Date(stripeStatus.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'],
              ['Amount', stripeStatus.amount ? `$${(stripeStatus.amount / 100).toFixed(0)}/${stripeStatus.currency}` : '—'],
              ['Card', stripeStatus.card_last4 ? `${stripeStatus.card_brand} ···· ${stripeStatus.card_last4}` : '—'],
              ['Expires', stripeStatus.card_exp_month ? `${stripeStatus.card_exp_month}/${String(stripeStatus.card_exp_year).slice(-2)}` : '—'],
              ['Cancel at period end', stripeStatus.cancel_at_period_end ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
                <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ color: G.text, fontSize: 12, ...monoStyle() }}>{value}</div>
              </div>
            ))}
          </div>
        )}
        {stripeStatus?.status === 'no_subscription' && (
          <div style={{ color: G.textMuted, fontSize: 12 }}>No active subscription found.</div>
        )}
        {stripeStatus?.status === 'error' && (
          <div style={{ color: G.redText, fontSize: 12 }}>{stripeStatus.error}</div>
        )}
      </div>

      {/* ── Trigger health check ───────────────────────────────────────────── */}
      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 10 }}>Actions</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={triggerHealthCheck}
            disabled={hcTriggering}
            style={{ padding: '8px 14px', borderRadius: 6, border: `0.5px solid ${G.accent}`, background: G.accentLight, color: G.accentText, fontSize: 12, fontWeight: 500, cursor: hcTriggering ? 'not-allowed' : 'pointer', opacity: hcTriggering ? 0.6 : 1, fontFamily: SANS }}
          >
            {hcTriggering ? 'Running…' : 'Run health check'}
          </button>
          {hcMessage && <span style={{ fontSize: 12, color: hcMessage.startsWith('✓') ? G.greenText : G.redText }}>{hcMessage}</span>}
        </div>
      </div>
    </div>
  )
}

function InvitePanel({ session }) {
  const [invite, setInvite]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [working, setWorking]     = useState(false)
  const [cap, setCap]             = useState(10)
  const [copied, setCopied]       = useState(false)
  const [message, setMessage]     = useState('')

  const loadStatus = async () => {
    setLoading(true)
    try {
      const data = await callAdminTool('tsa_get_invite_status', {}, session?.access_token)
      setInvite(data?.has_active_invite ? data.invite : null)
    } catch { setMessage('Could not load invite status.') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStatus() }, [])

  const handleGenerate = async () => {
    setWorking(true)
    setMessage('')
    try {
      const data = await callAdminTool('tsa_create_invite', { cap }, session?.access_token)
      setInvite(data?.invite || null)
      setMessage('New invite link generated.')
    } catch { setMessage('Could not generate invite link.') }
    finally { setWorking(false) }
  }

  const handleExpire = async () => {
    setWorking(true)
    setMessage('')
    try {
      await callAdminTool('tsa_expire_invite', {}, session?.access_token)
      setInvite(null)
      setMessage('Invite link expired.')
    } catch { setMessage('Could not expire invite link.') }
    finally { setWorking(false) }
  }

  const inviteUrl = invite ? `${window.location.origin}/#signup?ref=${invite.code}` : null

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ color: G.text, fontSize: 13 }}>Pilot invite link</div>
        {invite && (
          <Badge tone="green">
            {invite.used_count} / {invite.cap} used
          </Badge>
        )}
      </div>

      {loading ? (
        <div style={{ color: G.textFaint, fontSize: 12 }}>Loading…</div>
      ) : invite ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: '8px 12px', background: G.surface2, border: `0.5px solid ${G.border2}`, borderRadius: 6, fontSize: 11, color: G.textMuted, ...monoStyle(), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inviteUrl}
            </div>
            <button
              onClick={handleCopy}
              style={{ padding: '8px 14px', borderRadius: 6, border: `0.5px solid ${G.accent}`, background: G.accentLight, color: G.accentText, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: SANS }}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <ProgressBar value={invite.cap > 0 ? (invite.used_count / invite.cap) * 100 : 0} tone={invite.used_count >= invite.cap ? 'red' : 'green'} />
            <div style={{ marginTop: 4, fontSize: 11, color: G.textFaint }}>{invite.cap - invite.used_count} spots remaining</div>
          </div>
          <button
            onClick={handleExpire}
            disabled={working}
            style={{ padding: '7px 14px', borderRadius: 6, border: `0.5px solid ${G.red}`, background: G.redBg, color: G.redText, fontSize: 11, fontWeight: 500, cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.6 : 1, fontFamily: SANS }}
          >
            {working ? 'Working…' : 'Expire link now'}
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: G.textMuted }}>Max signups:</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={cap}
              onChange={e => setCap(Math.max(1, parseInt(e.target.value) || 10))}
              style={{ width: 64, padding: '5px 8px', borderRadius: 6, border: `0.5px solid ${G.border2}`, background: G.surface2, color: G.text, fontSize: 12, fontFamily: SANS }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={working}
            style={{ padding: '7px 14px', borderRadius: 6, border: `0.5px solid ${G.accent}`, background: G.accentLight, color: G.accentText, fontSize: 12, fontWeight: 500, cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.6 : 1, fontFamily: SANS }}
          >
            {working ? 'Generating…' : 'Generate invite link'}
          </button>
          <div style={{ fontSize: 12, color: G.textFaint }}>No active invite link.</div>
        </div>
      )}

      {message && (
        <div style={{ marginTop: 10, fontSize: 11, color: G.textMuted }}>{message}</div>
      )}
    </div>
  )
}

export default function AdminDashboard({ session, onUnauthorized }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sa-theme') || 'light')
  const [navSection, setNavSection] = useState('dashboard')
  const [selectedUser, setSelectedUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [detailCache, setDetailCache] = useState({})
  const [reliability, setReliability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tierSaving, setTierSaving] = useState(false)

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      onUnauthorized?.()
    }
  }, [session, onUnauthorized])

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEME_ORDER.indexOf(prev)
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length]
    })
  }

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsData, usersData, reliabilityData] = await Promise.all([
          callAdminTool('tsa_get_stats', {}, session.access_token),
          callAdminTool('tsa_list_users', {}, session.access_token),
          callAdminTool('tsa_get_reliability', {}, session.access_token),
        ])
        if (cancelled) return
        setStats(statsData)
        setUsers(Array.isArray(usersData) ? usersData : [])
        setReliability(reliabilityData || null)
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load admin data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) return
    if (users.length === 0) return

    let cancelled = false

    const hydrate = async () => {
      for (const user of users) {
        if (!user.email || detailCache[user.email]) continue
        try {
          const detail = await callAdminTool('tsa_get_user', { email: user.email }, session.access_token)
          if (cancelled) return
          setDetailCache(prev => prev[user.email] ? prev : { ...prev, [user.email]: detail })
        } catch {
          if (cancelled) return
        }
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [users, session, detailCache])

  if (!session || session.user?.email !== ADMIN_EMAIL) return null

  const tierCounts = users.reduce((acc, user) => {
    if (user.is_pilot) {
      acc.pilot = (acc.pilot || 0) + 1
    } else {
      const tier = normTier(user.tier)
      acc[tier] = (acc[tier] || 0) + 1
    }
    return acc
  }, { foundation: 0, intelligence: 0, pilot: 0 })

  const mrr = tierCounts.intelligence * 99
  const sectionName = selectedUser ? 'user detail' : navSection

  const kpis = [
    {
      label: 'paying users',
      value: tierCounts.intelligence,
      delta: `${tierCounts.pilot} pilot${tierCounts.pilot !== 1 ? 's' : ''} · +${stats?.signups_this_week ?? 0} this week`,
    },
    {
      label: 'reports generated',
      value: stats?.total_reports ?? users.reduce((sum, user) => sum + (user.report_count ?? 0), 0),
      delta: `+${stats?.reports_today ?? 0} today`,
    },
    {
      label: 'health checks run',
      value: stats?.health_checks_last_day ?? '—',
      delta: 'last 24h',
    },
    {
      label: 'mrr',
      value: `$${mrr}`,
      delta: `${tierCounts.intelligence} paying · ${tierCounts.pilot} pilot`,
    },
  ]

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    if (!detailCache[user.email]) {
      try {
        const detail = await callAdminTool('tsa_get_user', { email: user.email }, session.access_token)
        setDetailCache(prev => ({ ...prev, [user.email]: detail }))
      } catch (detailError) {
        setError(detailError.message || 'Unable to load user detail.')
      }
    }
  }

  const handleTierChange = async (email, tier) => {
    if (!email) return
    setTierSaving(true)
    setError('')
    try {
      await callAdminTool('tsa_update_user_tier', { email, tier }, session.access_token)
      setUsers(prev => prev.map(user => user.email === email ? { ...user, tier } : user))
      setDetailCache(prev => ({
        ...prev,
        [email]: prev[email]
          ? { ...prev[email], profile: { ...prev[email].profile, tier } }
          : prev[email],
      }))
      setSelectedUser(prev => prev?.email === email ? { ...prev, tier } : prev)
    } catch (saveError) {
      setError(saveError.message || 'Unable to update user tier.')
    } finally {
      setTierSaving(false)
    }
  }

  return (
    <div style={{
      ...getAdminThemeVars(theme),
      minHeight: '100vh',
      background: G.bg,
      color: G.text,
      display: 'flex',
      fontFamily: SANS,
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <AdminSidebar
        session={session}
        navSection={navSection}
        onNav={(nextSection) => {
          setNavSection(nextSection)
          setSelectedUser(null)
        }}
        userCount={users.length}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AdminTopbar section={sectionName} onCycleTheme={cycleTheme} />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: 20 }}>
            <ErrorBanner message={error} />

            {loading ? (
              <Spinner />
            ) : selectedUser && !detailCache[selectedUser.email] ? (
              <Spinner />
            ) : selectedUser ? (
              <UserDetailView
                user={selectedUser}
                detail={detailCache[selectedUser.email]}
                onBack={() => {
                  setSelectedUser(null)
                  setNavSection('dashboard')
                }}
                onTierChange={handleTierChange}
                tierSaving={tierSaving}
                session={session}
              />
            ) : navSection === 'dashboard' ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                    {kpis.map(kpi => (
                      <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
                    ))}
                  </div>

                  <UserActivityPanel users={users} stats={stats} />

                  <InvitePanel session={session} />

                  <UsersTable users={users} detailCache={detailCache} onSelectUser={handleSelectUser} title="User table" />
                </div>

                <RightRail stats={stats} users={users} detailCache={detailCache} reliability={reliability} />
              </div>
            ) : navSection === 'users' ? (
              <UsersTable users={users} detailCache={detailCache} onSelectUser={handleSelectUser} title="Users" />
            ) : (
              <div style={{ ...panelStyle({ padding: '18px 20px' }) }}>
                <div style={{ color: G.text, fontSize: 13, marginBottom: 6 }}>Settings</div>
                <div style={{ color: G.textMuted, fontSize: 12 }}>coming soon</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
