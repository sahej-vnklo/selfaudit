import React, { useEffect, useMemo, useState } from 'react'

const ADMIN_EMAIL = 'sahej@vnklo.com'
const G = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161616',
  border: '#1E1E1E',
  border2: '#2A2A2A',
  text: '#E8E4DC',
  textMuted: '#888888',
  textFaint: '#444444',
  accent: '#01696f',
  accentLight: '#0a2e30',
  accentText: '#2dd4bf',
  red: '#9E3030',
  redBg: '#1A0A0A',
  redText: '#C05050',
  amber: '#8A6A1A',
  amberBg: '#1A1508',
  amberText: '#C9A040',
  green: '#2D6B45',
  greenBg: '#0A1A10',
  greenText: '#4A9E6B',
}

const MONO = '"DM Mono", ui-monospace, monospace'
const SANS = '"DM Sans", system-ui, -apple-system, sans-serif'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconHome },
  { key: 'users', label: 'Users', Icon: IconPerson, badge: 'userCount' },
  { key: 'settings', label: 'Settings', Icon: IconGear },
]

const TIER_STYLES = {
  essential: { bg: G.surface2, color: G.textMuted, border: G.border2 },
  business: { bg: G.accentLight, color: G.accentText, border: G.accent },
  portfolio: { bg: G.greenBg, color: G.greenText, border: G.green },
}

function normTier(tier) {
  if (tier === 'paid') return 'business'
  if (tier === 'free') return 'essential'
  return tier || 'essential'
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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

async function callAdminTool(tool, input = {}) {
  const key = import.meta.env.VITE_TSA_ADMIN_KEY
  if (!key) throw new Error('VITE_TSA_ADMIN_KEY is not configured.')

  const response = await fetch(`/api/mcp?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
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

  return parsed.conversation_mode === 'EXECUTION_HUMAN'
    ? <ReportSchemaB p={parsed} />
    : <ReportSchemaA p={parsed} />
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

function AdminTopbar({ section }) {
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
      <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{today}</div>
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

function ConversionFunnel({ steps }) {
  const total = steps[0]?.count || 0

  return (
    <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
      <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Conversion funnel</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {steps.map((step, index) => {
          const pct = total > 0 ? Math.round((step.count / total) * 100) : 0
          const prev = steps[index - 1]
          const drop = prev && prev.count > 0 ? Math.max(0, Math.round(((prev.count - step.count) / prev.count) * 100)) : 0
          return (
            <div key={step.label} style={{ ...panelStyle({ background: G.surface2, padding: '14px 12px' }) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                <div style={{ color: G.textMuted, fontSize: 11, lineHeight: 1.4 }}>{step.label}</div>
                {index > 0 ? <Badge tone="red" mono>{drop}% drop</Badge> : <Badge mono>base</Badge>}
              </div>
              <div style={{ color: G.text, fontSize: 24, lineHeight: 1, marginBottom: 6, ...monoStyle() }}>{step.count}</div>
              <div style={{ color: G.accentText, fontSize: 11, ...monoStyle() }}>{pct}% of signups</div>
            </div>
          )
        })}
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
      const matchesTier = tierFilter === 'all' || normTier(user.tier) === tierFilter
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
          {['all', 'essential', 'business', 'portfolio'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              style={{
                padding: '7px 10px',
                borderRadius: 4,
                border: `0.5px solid ${tierFilter === tier ? G.accent : G.border2}`,
                background: tierFilter === tier ? G.accentLight : G.surface2,
                color: tierFilter === tier ? G.accentText : G.textMuted,
                cursor: 'pointer',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: SANS,
              }}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 400, overflow: 'auto', border: `0.5px solid ${G.border}`, borderRadius: 6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: G.surface, zIndex: 1 }}>
            <tr>
              {['', 'Name', 'Email', 'Tier', 'Industry', 'Domain', 'Reports', 'Joined', 'Last audit'].map(label => (
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
                <td colSpan={9} style={{ padding: '24px 12px', color: G.textMuted, textAlign: 'center', fontStyle: 'italic' }}>
                  no users found
                </td>
              </tr>
            ) : filtered.map(user => {
              const detail = detailCache[user.email]
              const lastAudit = detail?.reports?.[0]?.created_at || null
              const hasStarted = (detail?.chat_sessions?.length ?? 0) > 0 || user.industry || user.domain
              const dotColor = user.report_count > 0 ? G.greenText : hasStarted ? G.amberText : G.textFaint
              const tierStyle = TIER_STYLES[normTier(user.tier)] || TIER_STYLES.essential

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
                      {normTier(user.tier)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12 }}>{user.industry || '—'}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12 }}>{user.domain || '—'}</td>
                  <td style={{ padding: '12px', color: G.text, fontSize: 12, ...monoStyle() }}>{user.report_count ?? 0}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12, ...monoStyle() }}>{fmtDate(user.created_at)}</td>
                  <td style={{ padding: '12px', color: G.textMuted, fontSize: 12, ...monoStyle() }}>{fmtDate(lastAudit)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RightRail({ stats, users, detailCache }) {
  const totalUsers = stats?.total_users ?? users.length
  const totalReports = stats?.total_reports ?? users.reduce((sum, user) => sum + (user.report_count ?? 0), 0)
  const totalSessions = stats?.total_chat_sessions ?? 0
  const reportRate = totalSessions > 0 ? ((totalReports / totalSessions) * 100).toFixed(0) : '0'
  const avgReports = totalUsers > 0 ? (totalReports / totalUsers).toFixed(2) : '0.00'
  const signupsThisWeek = stats?.signups_this_week ?? 0

  const tierCounts = users.reduce((acc, user) => {
    const tier = normTier(user.tier)
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, { essential: 0, business: 0, portfolio: 0 })

  const mrr = tierCounts.essential * 49 + tierCounts.business * 99 + tierCounts.portfolio * 299

  const intelligenceUsers = [...users]
    .filter(user => (user.report_count ?? 0) > 0)
    .sort((a, b) => (b.report_count ?? 0) - (a.report_count ?? 0))
    .slice(0, 5)

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
          <div style={{ color: G.text, fontSize: 13 }}>Tier distribution</div>
          <div style={{ color: G.accentText, fontSize: 13, ...monoStyle() }}>${mrr}/mo</div>
        </div>
        {[
          ['essential', 49],
          ['business', 99],
          ['portfolio', 299],
        ].map(([tier, price]) => {
          const count = tierCounts[tier] || 0
          const width = totalUsers > 0 ? (count / totalUsers) * 100 : 0
          return (
            <div key={tier} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ color: G.textMuted, fontSize: 11 }}>{tier}</div>
                <div style={{ color: G.text, fontSize: 11, ...monoStyle() }}>{count} · ${count * price}</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, border: `0.5px solid ${G.border2}`, background: G.surface2, overflow: 'hidden' }}>
                <div style={{ width: `${width}%`, height: '100%', background: tier === 'portfolio' ? G.greenText : tier === 'business' ? G.accentText : G.textMuted }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 16px 14px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 4 }}>What the AI knows</div>
        <div style={{ color: G.textFaint, fontSize: 11, lineHeight: 1.5, marginBottom: 14 }}>
          Business intelligence accumulated across all sessions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {intelligenceUsers.length === 0 ? (
            <EmptyText>No audited users yet.</EmptyText>
          ) : intelligenceUsers.map(user => {
            const detail = detailCache[user.email]
            const intel = detail ? extractBusinessIntel(detail) : null
            return (
              <div key={user.id} style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
                <div style={{ color: G.text, fontSize: 12, marginBottom: 6 }}>{user.name || user.email}</div>
                <div style={{ color: G.textMuted, fontSize: 11, lineHeight: 1.55 }}>
                  {intel?.coreOffer ? textClamp(stripAssumption(intel.coreOffer), 60) : 'loading intelligence…'}
                </div>
                {intel?.activeGoal && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>active goal</div>
                      <div style={{ color: G.accentText, fontSize: 10, ...monoStyle() }}>{Math.round(intel.goalScore || 0)}%</div>
                    </div>
                    <ProgressBar value={intel.goalScore || 0} />
                  </div>
                )}
                <div style={{ color: G.textFaint, fontSize: 10, marginTop: 8 }}>
                  {intel?.lastAuditHeadline || detail?.reports?.[0]?.title || 'No audit headline yet'}
                </div>
                {intel?.domainsAudited?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {intel.domainsAudited.slice(0, 3).map(domain => <Badge key={domain}>{domain}</Badge>)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
          border: `0.5px solid ${(TIER_STYLES[normTier(tier)] || TIER_STYLES.essential).border}`,
          background: (TIER_STYLES[normTier(tier)] || TIER_STYLES.essential).bg,
          color: (TIER_STYLES[normTier(tier)] || TIER_STYLES.essential).color,
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
        {normTier(tier)}
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
          {['essential', 'business', 'portfolio'].map(nextTier => (
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

function UserDetailView({ user, detail, onBack, onTierChange, tierSaving }) {
  const [expandedReports, setExpandedReports] = useState(new Set())
  const [showAllReports, setShowAllReports] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState(new Set())
  const [reportDetails, setReportDetails] = useState({})
  const [reportError, setReportError] = useState('')

  useEffect(() => {
    setExpandedReports(new Set())
    setExpandedSessions(new Set())
    setShowAllReports(false)
    setReportDetails({})
    setReportError('')
  }, [user?.email])

  const profile = detail?.profile || user
  const reports = detail?.reports || []
  const chatSessions = detail?.chat_sessions || []
  const intel = extractBusinessIntel(detail || { reports })
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
        const fullReport = await callAdminTool('tsa_get_report', { report_id: report.id })
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
        <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Business intelligence</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionLabel>core offer</SectionLabel>
              <div style={{ color: isAssumption(intel.coreOffer) ? G.textMuted : G.text, fontSize: 13, fontStyle: isAssumption(intel.coreOffer) ? 'italic' : 'normal', lineHeight: 1.7 }}>
                {intel.coreOffer ? stripAssumption(intel.coreOffer) : <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>target customer</SectionLabel>
              <div style={{ color: isAssumption(intel.targetCustomer) ? G.textMuted : G.text, fontSize: 13, fontStyle: isAssumption(intel.targetCustomer) ? 'italic' : 'normal', lineHeight: 1.7 }}>
                {intel.targetCustomer ? stripAssumption(intel.targetCustomer) : <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>operational blockers</SectionLabel>
              {intel.operationalBlockers.length === 0 ? (
                <EmptyText />
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                  {intel.operationalBlockers.map((blocker, index) => (
                    <li key={index} style={{ fontStyle: isAssumption(blocker) ? 'italic' : 'normal' }}>
                      {stripAssumption(blocker)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionLabel>active goal</SectionLabel>
              <div style={{ color: G.text, fontSize: 13, marginBottom: 8 }}>
                {intel.activeGoal ? stripAssumption(intel.activeGoal) : <EmptyText />}
              </div>
              <ProgressBar value={intel.goalScore || 0} />
              <div style={{ marginTop: 6, color: G.accentText, fontSize: 11, ...monoStyle() }}>{Math.round(intel.goalScore || 0)} / 100</div>
            </div>
            <div>
              <SectionLabel>last audit headline</SectionLabel>
              <div style={{ color: G.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                {intel.lastAuditHeadline || <EmptyText />}
              </div>
            </div>
            <div>
              <SectionLabel>assumptions unverified</SectionLabel>
              {intel.assumptionsUnverified.length === 0 ? (
                <EmptyText />
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {intel.assumptionsUnverified.map((item, index) => (
                    <Badge key={index} tone="amber">{stripAssumption(item)}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
              const pseudoRows = [
                {
                  id: `${session.session_id}-user`,
                  role: 'user',
                  message: session.preview || 'No captured preview for this session.',
                },
                {
                  id: `${session.session_id}-assistant`,
                  role: 'assistant',
                  message: 'The admin MCP feed currently returns session summaries here. Full thread rendering stays wired through MessageThread whenever raw messages are available in the stored report payload.',
                },
              ]
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
                      <MessageThread rows={extractChatRowsFromReport(reports[0]) || pseudoRows} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ ...panelStyle({ padding: '16px 18px' }) }}>
        <div style={{ color: G.text, fontSize: 13, marginBottom: 14 }}>Tier management</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['essential', 'business', 'portfolio'].map(tier => (
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
              {tier}
            </button>
          ))}
        </div>

        <SectionLabel>Billing identifiers</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <div style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>stripe customer id</div>
            <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{stripeCustomerId}</div>
          </div>
          <div style={{ ...panelStyle({ background: G.surface2, padding: '10px 12px' }) }}>
            <div style={{ color: G.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>stripe subscription id</div>
            <div style={{ color: G.textMuted, fontSize: 12, ...monoStyle() }}>{stripeSubscriptionId}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard({ session, onUnauthorized }) {
  const [navSection, setNavSection] = useState('dashboard')
  const [selectedUser, setSelectedUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [detailCache, setDetailCache] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tierSaving, setTierSaving] = useState(false)

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      onUnauthorized?.()
    }
  }, [session, onUnauthorized])

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsData, usersData] = await Promise.all([
          callAdminTool('tsa_get_stats', {}),
          callAdminTool('tsa_list_users', {}),
        ])
        if (cancelled) return
        setStats(statsData)
        setUsers(Array.isArray(usersData) ? usersData : [])
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
          const detail = await callAdminTool('tsa_get_user', { email: user.email })
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

  const sharedCount = users.reduce((count, user) => {
    const shared = detailCache[user.email]?.profile?.shared_with_vnklo
    return count + (shared ? 1 : 0)
  }, 0)

  const startedAuditCount = users.reduce((count, user) => {
    const detail = detailCache[user.email]
    const started = (detail?.chat_sessions?.length ?? 0) > 0 || (user.report_count ?? 0) > 0 || user.industry || user.domain
    return count + (started ? 1 : 0)
  }, 0)

  const tierCounts = users.reduce((acc, user) => {
    const tier = normTier(user.tier)
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, { essential: 0, business: 0, portfolio: 0 })

  const mrr = tierCounts.essential * 49 + tierCounts.business * 99 + tierCounts.portfolio * 299
  const sectionName = selectedUser ? 'user detail' : navSection

  const kpis = [
    {
      label: 'total users',
      value: stats?.total_users ?? users.length,
      delta: `+${stats?.signups_this_week ?? 0} this week`,
    },
    {
      label: 'reports generated',
      value: stats?.total_reports ?? users.reduce((sum, user) => sum + (user.report_count ?? 0), 0),
      delta: `+${stats?.reports_today ?? 0} today`,
    },
    {
      label: 'chat → report rate',
      value: `${stats?.total_chat_sessions ? Math.round(((stats.total_reports ?? 0) / stats.total_chat_sessions) * 100) : 0}%`,
      delta: `${stats?.total_chat_sessions ?? 0} sessions`,
    },
    {
      label: 'mrr',
      value: `$${mrr}`,
      delta: `${tierCounts.essential}/${tierCounts.business}/${tierCounts.portfolio}`,
    },
  ]

  const funnelSteps = [
    { label: 'Signed up', count: stats?.total_users ?? users.length },
    { label: 'Started audit', count: startedAuditCount },
    { label: 'Got report', count: stats?.total_reports ? users.filter(user => (user.report_count ?? 0) > 0).length : users.filter(user => (user.report_count ?? 0) > 0).length },
    { label: 'Shared with VNKLO', count: sharedCount },
  ]

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    if (!detailCache[user.email]) {
      try {
        const detail = await callAdminTool('tsa_get_user', { email: user.email })
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
      await callAdminTool('tsa_update_user_tier', { email, tier })
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
        <AdminTopbar section={sectionName} />

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
              />
            ) : navSection === 'dashboard' ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                    {kpis.map(kpi => (
                      <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
                    ))}
                  </div>

                  <ConversionFunnel steps={funnelSteps} />

                  <UsersTable users={users} detailCache={detailCache} onSelectUser={handleSelectUser} title="User table" />
                </div>

                <RightRail stats={stats} users={users} detailCache={detailCache} />
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
