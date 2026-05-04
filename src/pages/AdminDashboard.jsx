import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'sahej@vnklo.com'

const G = {
  green:      '#1D9E75',
  greenLight: '#E1F5EE',
  greenDark:  '#0F6E56',
  bg:         '#F5F4F0',
  white:      '#FFFFFF',
  border:     '#E5E3DC',
  ink:        '#1A1A1A',
  inkMuted:   '#6B6B6B',
  inkFaint:   '#9A9A9A',
  red:        '#C0392B',
  redLight:   '#FDECEA',
}

// Admin shell accent (new design tokens)
const AG  = '#01696f'
const AGL = '#E0F2EE'

const THIRTY_MIN_MS = 30 * 60 * 1000

function normTier(t) {
  if (t === 'paid') return 'business'
  if (t === 'free') return 'essential'
  return t || 'essential'
}

function getServiceClient() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://spinhhzpboojmpndaxue.supabase.co'
  const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: `3px solid ${G.border}`,
        borderTopColor: AG,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      background: G.redLight, color: G.red, border: `1px solid #f5c6c2`,
      borderRadius: 8, padding: '12px 16px', fontSize: 14, marginBottom: 20,
    }}>
      {message}
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: `1px solid ${G.border}`,
        borderRadius: 8, padding: '8px 14px', fontSize: 14,
        color: G.inkMuted, cursor: 'pointer', marginBottom: 24,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = AG}
      onMouseLeave={e => e.currentTarget.style.borderColor = G.border}
    >
      ← Back to users
    </button>
  )
}

function Badge({ label, bg, color }) {
  return (
    <span style={{
      background: bg ?? G.greenLight, color: color ?? G.greenDark,
      borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

function Chevron({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const TIER_COLORS = {
  essential: { bg: '#E1F5EE', color: '#0F6E56' },
  business:  { bg: '#E6F1FB', color: '#185FA5' },
  portfolio: { bg: '#EEEDFE', color: '#534AB7' },
  free:      { bg: '#E1F5EE', color: '#0F6E56' },
  paid:      { bg: '#E6F1FB', color: '#185FA5' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Message thread ───────────────────────────────────────────────────────────

function MessageThread({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 4px' }}>
      {rows.map((row, i) => {
        const isUser = row.role === 'user'
        return (
          <div key={row.id ?? i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '76%',
              background: isUser ? G.green : G.bg,
              color: isUser ? G.white : G.ink,
              borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '8px 12px',
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {row.message || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>empty</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Report content renderer ─────────────────────────────────────────────────

const STATUS_COLORS = {
  critical:   { bg: '#FDECEA', color: '#C0392B' },
  needs_work: { bg: '#FEF3E2', color: '#B7600A' },
  good:       { bg: '#E1F5EE', color: '#0F6E56' },
}

const URGENCY_COLORS = {
  immediate: { bg: '#FDECEA', color: '#C0392B' },
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: G.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
      {children}
    </p>
  )
}

function TextSection({ label, text, italic }) {
  if (!text) return null
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p style={{ fontSize: 14, color: G.inkMuted, lineHeight: 1.65, fontStyle: italic ? 'italic' : 'normal' }}>{text}</p>
    </div>
  )
}

function ReportSchemaB({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {p.headline && (
        <p style={{ fontSize: 17, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>
      )}
      <TextSection label="Acknowledgment"       text={p.acknowledgment} />
      <TextSection label="What This Actually Is" text={p.what_this_actually_is} />
      {p.delivery_script && (
        <div>
          <SectionLabel>Delivery Script</SectionLabel>
          <div style={{
            background: '#F0EFEB', borderRadius: 8, padding: '12px 14px',
            fontSize: 13, color: G.ink, lineHeight: 1.7,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {p.delivery_script}
          </div>
        </div>
      )}
      <TextSection label="What To Expect" text={p.what_to_expect} />
      <TextSection label="Honest Truth"   text={p.honest_truth} italic />
    </div>
  )
}

function ReportSchemaA({ p }) {
  const domains          = p.domains          ?? []
  const non_ai_fixes     = p.non_ai_fixes     ?? []
  const ai_opportunities = p.ai_opportunities ?? []
  const priority_actions = p.priority_actions ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {p.headline && (
        <p style={{ fontSize: 17, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>
      )}

      <TextSection label="Verdict" text={p.overall_verdict} />

      <div>
        <SectionLabel>Domains</SectionLabel>
        {domains.length === 0 ? (
          <p style={{ fontSize: 13, color: G.inkFaint, fontStyle: 'italic' }}>No domain breakdown available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {domains.map((d, i) => {
              const sc = STATUS_COLORS[d.status] ?? { bg: G.bg, color: G.inkMuted }
              const uc = URGENCY_COLORS[d.urgency] ?? { bg: G.bg, color: G.inkFaint }
              return (
                <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>{d.name}</p>
                    {d.status && (
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 100, padding: '2px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {d.finding && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55, marginBottom: d.action ? 6 : 0 }}>{d.finding}</p>}
                  {d.action && (
                    <p style={{ fontSize: 13, color: G.ink, lineHeight: 1.55, marginBottom: d.urgency ? 6 : 0 }}>
                      <span style={{ fontWeight: 600 }}>→ Action:</span> {d.action}
                    </p>
                  )}
                  {d.urgency && (
                    <span style={{ display: 'inline-block', background: uc.bg, color: uc.color, borderRadius: 100, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                      {d.urgency}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {non_ai_fixes.length > 0 && (
        <div>
          <SectionLabel>Non-AI Fixes</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {non_ai_fixes.map((item, i) => (
              <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
                {item.issue && <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{item.issue}</p>}
                {item.fix   && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item.fix}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {ai_opportunities.length > 0 && (
        <div>
          <SectionLabel>AI Opportunities</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ai_opportunities.map((item, i) => (
              <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
                {item.area && <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{item.area}</p>}
                {item.why  && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {priority_actions.length > 0 && (
        <div>
          <SectionLabel>Priority Actions</SectionLabel>
          <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {priority_actions.map((item, i) => (
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
  if (!content) return <p style={{ fontSize: 13, color: G.inkFaint, fontStyle: 'italic' }}>No content stored.</p>

  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return <pre style={{ fontSize: 12, color: G.inkMuted, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{content}</pre>
  }

  return parsed.conversation_mode === 'EXECUTION_HUMAN'
    ? <ReportSchemaB p={parsed} />
    : <ReportSchemaA p={parsed} />
}

// ─── User List (restyled — data fetch unchanged) ──────────────────────────────

function UserList({ onSelectUser }) {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => {
    async function load() {
      const sb = getServiceClient()
      if (!sb) { setError('VITE_SUPABASE_SERVICE_ROLE_KEY not set'); setLoading(false); return }
      const { data, error: err } = await sb.from('admin_user_overview').select('*').order('created_at', { ascending: false })
      if (err) setError(err.message)
      else setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (u.name     ?? '').toLowerCase().includes(q) ||
      (u.email    ?? '').toLowerCase().includes(q) ||
      (u.industry ?? '').toLowerCase().includes(q)
    const matchTier = tierFilter === 'all' || normTier(u.tier) === tierFilter
    return matchSearch && matchTier
  })

  const statusDot = u => {
    if ((u.report_count ?? 0) > 0) return '#0F6E56'
    if (u.industry)                 return '#B7600A'
    return G.inkFaint
  }

  return (
    <div>
      {/* Search + tier filter row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or industry…"
          style={{
            flex: 1, minWidth: 180, padding: '7px 12px', fontSize: 13,
            border: `1px solid ${G.border}`, borderRadius: 8,
            background: G.bg, color: G.ink, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'essential', 'business', 'portfolio'].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600,
                borderRadius: 20, border: `1px solid ${tierFilter === t ? AG : G.border}`,
                background: tierFilter === t ? AGL : G.white,
                color: tierFilter === t ? AG : G.inkMuted,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: G.inkFaint, flexShrink: 0 }}>{filtered.length} users</span>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <Spinner /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${G.border}` }}>
                {['Name', 'Email', 'Tier', 'Industry', 'Domain', 'Reports', 'Joined', ''].map((label, i) => (
                  <th key={i} style={{
                    padding: '8px 12px', textAlign: 'left',
                    fontWeight: 600, color: G.inkFaint, fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '32px 12px', textAlign: 'center', color: G.inkFaint }}>
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((u, i) => {
                const tc        = TIER_COLORS[u.tier] ?? TIER_COLORS.essential
                const dotColor  = statusDot(u)
                const isHovered = hoveredRow === (u.id ?? i)
                return (
                  <tr
                    key={u.id ?? i}
                    onClick={() => onSelectUser(u)}
                    onMouseEnter={() => setHoveredRow(u.id ?? i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: `1px solid ${G.border}`, cursor: 'pointer',
                      background: isHovered ? G.bg : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ color: G.ink, fontWeight: 500 }}>{u.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: G.inkMuted }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {u.tier
                        ? <Badge label={normTier(u.tier)} bg={tc.bg} color={tc.color} />
                        : <span style={{ color: G.inkFaint }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: G.inkMuted }}>{u.industry || '—'}</td>
                    <td style={{ padding: '10px 12px', color: G.inkMuted }}>{u.domain || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: G.ink, fontWeight: 600, fontFamily: '"DM Mono", ui-monospace, monospace' }}>
                      {u.report_count ?? 0}
                    </td>
                    <td style={{ padding: '10px 12px', color: G.inkMuted, whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', width: 56 }}>
                      {isHovered && <span style={{ fontSize: 12, color: AG, fontWeight: 600 }}>View →</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── User Detail ──────────────────────────────────────────────────────────────

function UserDetail({ user, onBack }) {
  const [reports, setReports]                   = useState([])
  const [chats, setChats]                       = useState([])
  const [loading, setLoading]                   = useState(true)
  const [error, setError]                       = useState(null)
  const [expandedReports, setExpandedReports]   = useState(new Set())
  const [expandedSessions, setExpandedSessions] = useState(new Set())

  useEffect(() => {
    async function load() {
      const sb = getServiceClient()
      if (!sb) { setError('VITE_SUPABASE_SERVICE_ROLE_KEY not set'); setLoading(false); return }

      const [{ data: rData, error: rErr }, { data: cData, error: cErr }] = await Promise.all([
        sb.from('reports').select('id, title, content, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('chats').select('id, session_id, role, message, created_at').eq('user_id', user.id).order('created_at', { ascending: true }),
      ])

      if (rErr || cErr) setError((rErr ?? cErr).message)
      setReports(rData ?? [])
      setChats(cData ?? [])
      setLoading(false)
    }
    load()
  }, [user.id])

  const sessionMap = chats.reduce((acc, row) => {
    const key = row.session_id ?? row.id
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  const sessions = Object.entries(sessionMap).map(([sid, rows]) => {
    const sorted     = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
    const userMsg    = sorted.find(r => r.role === 'user')
    const preview    = (userMsg?.message ?? '').slice(0, 100)
    const latestTs   = sorted[sorted.length - 1].created_at
    const earliestTs = sorted[0].created_at
    return { sid, rows: sorted, preview, count: rows.length, latestTs, date: earliestTs }
  }).sort((a, b) => b.date.localeCompare(a.date))

  const reportToSession = {}
  const sessionToReport = {}
  reports.forEach(report => {
    const reportTs = new Date(report.created_at).getTime()
    let bestSid  = null
    let bestDiff = Infinity
    sessions.forEach(session => {
      const diff = reportTs - new Date(session.latestTs).getTime()
      if (diff >= 0 && diff <= THIRTY_MIN_MS && diff < bestDiff) {
        bestSid  = session.sid
        bestDiff = diff
      }
    })
    if (bestSid) {
      reportToSession[report.id] = bestSid
      sessionToReport[bestSid]   = report
    }
  })

  const toggleReport  = id  => setExpandedReports(prev  => { const n = new Set(prev); n.has(id)  ? n.delete(id)  : n.add(id);  return n })
  const toggleSession = sid => setExpandedSessions(prev => { const n = new Set(prev); n.has(sid) ? n.delete(sid) : n.add(sid); return n })

  const tc = TIER_COLORS[user.tier] ?? TIER_COLORS.essential

  return (
    <div>
      <BackButton onClick={onBack} />

      <div style={{
        background: G.white, border: `1px solid ${G.border}`,
        borderRadius: 12, padding: '24px 28px', marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{user.name || '(no name)'}</h2>
            <p style={{ fontSize: 14, color: G.inkMuted }}>{user.email}</p>
          </div>
          {user.tier && <Badge label={user.tier} bg={tc.bg} color={tc.color} />}
        </div>
        <div style={{ display: 'flex', gap: 32, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            ['Industry', user.industry],
            ['Domain',   user.domain],
            ['Joined',   fmtDate(user.created_at)],
            ['Reports',  user.report_count ?? '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontWeight: 600, color: G.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 15, color: G.ink }}>{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {loading ? <Spinner /> : (
        <>
          <section style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 14 }}>
              Reports <span style={{ color: G.inkFaint, fontWeight: 400 }}>({reports.length})</span>
            </h3>
            {reports.length === 0 ? (
              <p style={{ color: G.inkFaint, fontSize: 14 }}>No reports yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.map(r => {
                  const open          = expandedReports.has(r.id)
                  const linkedSid     = reportToSession[r.id]
                  const linkedSession = linkedSid ? sessions.find(s => s.sid === linkedSid) : null
                  return (
                    <div key={r.id} style={{
                      background: G.white, border: `1px solid ${open ? AG : G.border}`,
                      borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s',
                    }}>
                      <div
                        onClick={() => toggleReport(r.id)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 16px', cursor: 'pointer', gap: 12,
                          background: open ? AGL : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <p style={{ fontSize: 14, fontWeight: 600, color: G.ink, flex: 1 }}>{r.title || '(untitled)'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <p style={{ fontSize: 12, color: G.inkFaint, whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</p>
                          <Chevron open={open} />
                        </div>
                      </div>
                      {open && (
                        <div style={{ padding: '0 16px 16px' }}>
                          <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 14, marginTop: 2 }}>
                            <ReportContent content={r.content} />
                          </div>
                          {linkedSession && (
                            <div style={{ marginTop: 16, borderTop: `1px solid ${G.border}`, paddingTop: 14 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: G.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                Source chat · {linkedSession.count} messages
                              </p>
                              <MessageThread rows={linkedSession.rows} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: G.ink, marginBottom: 14 }}>
              Chats <span style={{ color: G.inkFaint, fontWeight: 400 }}>({sessions.length} sessions)</span>
            </h3>
            {sessions.length === 0 ? (
              <p style={{ color: G.inkFaint, fontSize: 14 }}>No chats yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map(({ sid, rows, preview, count, date }) => {
                  const open         = expandedSessions.has(sid)
                  const linkedReport = sessionToReport[sid]
                  return (
                    <div key={sid} style={{
                      background: G.white, border: `1px solid ${open ? AG : G.border}`,
                      borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s',
                    }}>
                      <div
                        onClick={() => toggleSession(sid)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          padding: '12px 16px', cursor: 'pointer', gap: 12,
                          background: open ? AGL : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: G.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {preview || <span style={{ color: G.inkFaint, fontStyle: 'italic' }}>empty</span>}
                          </p>
                          {linkedReport && (
                            <p style={{ fontSize: 12, color: AG, fontWeight: 600, marginTop: 4 }}>
                              → {linkedReport.title || '(untitled report)'}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 12, color: G.inkFaint, whiteSpace: 'nowrap' }}>{fmtDate(date)}</p>
                            <p style={{ fontSize: 11, color: G.inkFaint }}>{count} msg{count !== 1 ? 's' : ''}</p>
                          </div>
                          <Chevron open={open} />
                        </div>
                      </div>
                      {open && (
                        <div style={{ borderTop: `1px solid ${G.border}`, padding: '0 16px 12px' }}>
                          <MessageThread rows={rows} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
)

const IconPerson = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M1.5 12.5C1.5 10.01 4.02 8 7 8C9.98 8 12.5 10.01 12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const IconDoc = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 5H9M5 7.5H9M5 10H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const IconFunnel = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 2.5H12.5L8.5 7.5V12L5.5 10V7.5L1.5 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
)

const IconGear = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 1.5V2.5M7 11.5V12.5M12.5 7H11.5M2.5 7H1.5M10.95 3.05L10.24 3.76M3.76 10.24L3.05 10.95M10.95 10.95L10.24 10.24M3.76 3.76L3.05 3.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',   Icon: IconGrid,   badge: null },
  { key: 'users',     label: 'Users',       Icon: IconPerson, badge: 'userCount' },
  { key: 'reports',   label: 'Reports',     Icon: IconDoc,    badge: 'reportCount' },
  { key: 'leads',     label: 'VNKLO Leads', Icon: IconFunnel, badge: 'vnkloCount' },
  { key: 'settings',  label: 'Settings',    Icon: IconGear,   badge: null },
]

function AdminSidebar({ navSection, onNav, session, userCount, reportCount, vnkloCount }) {
  const counts = { userCount, reportCount, vnkloCount }
  return (
    <aside style={{
      width: 216, flexShrink: 0, height: '100vh',
      background: G.white, borderRight: `1px solid ${G.border}`,
      display: 'flex', flexDirection: 'column',
      padding: '20px 0 16px',
    }}>
      {/* Logo + admin badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 28 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: G.ink, letterSpacing: '-0.4px' }}>
          self<span style={{ color: AG }}>audit</span>
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
          background: AGL, color: AG, borderRadius: 6, padding: '3px 8px',
        }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {NAV_ITEMS.map(({ key, label, Icon, badge }) => {
          const active = navSection === key
          const count  = badge ? counts[badge] : null
          return (
            <button
              key={key}
              onClick={() => onNav(key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? AGL : 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: active ? AG : G.inkMuted, textAlign: 'left',
              }}
            >
              <span style={{ color: active ? AG : G.inkFaint, display: 'flex', flexShrink: 0 }}>
                <Icon />
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {count != null && count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'center',
                  background: active ? 'rgba(1,105,111,0.12)' : '#F0EFEB',
                  color: active ? AG : G.inkFaint,
                  borderRadius: 10, padding: '1px 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Session info */}
      <div style={{ padding: '12px 16px 0', borderTop: `1px solid ${G.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.ink }}>Sahej</div>
        <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.user.email}
        </div>
      </div>
    </aside>
  )
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function AdminTopbar({ title }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{
      height: 56, flexShrink: 0,
      background: G.white, borderBottom: `1px solid ${G.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: G.ink }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: G.inkFaint }}>{today}</span>
        <button style={{
          background: 'none', border: `1px solid ${G.border}`, borderRadius: 8,
          fontSize: 12, fontWeight: 500, color: G.inkMuted,
          padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Export CSV
        </button>
        <button style={{
          background: AG, border: 'none', borderRadius: 8,
          fontSize: 12, fontWeight: 500, color: G.white,
          padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Invite User
        </button>
      </div>
    </div>
  )
}

// ─── KPI Row ──────────────────────────────────────────────────────────────────

function KpiRow({ users, vnkloLeads, chatSessions, loading }) {
  const totalUsers   = users.length
  const totalReports = users.reduce((s, u) => s + (u.report_count ?? 0), 0)
  const chatRate     = chatSessions > 0
    ? `${((totalReports / chatSessions) * 100).toFixed(0)}%`
    : '—'

  const kpis = [
    {
      label: 'Total Users',
      value: loading ? '—' : totalUsers,
      delta: loading ? '—' : `${totalUsers} total`,
      up: true,
    },
    {
      label: 'Reports Generated',
      value: loading ? '—' : totalReports,
      delta: loading ? '—' : `${totalReports} total`,
      up: true,
    },
    {
      label: 'Chat → Report Rate',
      value: loading ? '—' : chatRate,
      delta: loading ? '—' : chatSessions > 0 ? `${chatSessions} sessions` : 'no sessions',
      up: null,
    },
    {
      label: 'VNKLO Leads',
      value: loading ? '—' : vnkloLeads,
      delta: loading ? '—' : vnkloLeads > 0 ? 'shared' : 'none yet',
      up: vnkloLeads > 0 ? true : null,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, color: G.inkFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            {k.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: G.ink, fontFamily: '"DM Mono", ui-monospace, monospace', letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>
            {k.value}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
            background: k.up === true ? AGL : k.up === false ? G.redLight : '#F0EFEB',
            color:      k.up === true ? AG   : k.up === false ? G.red      : G.inkFaint,
          }}>
            {k.delta}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Conversion Funnel ────────────────────────────────────────────────────────

function ConversionFunnel({ users, vnkloLeads }) {
  const total     = users.length
  const started   = users.filter(u => u.industry).length
  const gotReport = users.filter(u => (u.report_count ?? 0) > 0).length

  const steps = [
    { label: 'Signed up',         count: total },
    { label: 'Started audit',     count: started },
    { label: 'Got report',        count: gotReport },
    { label: 'Shared with VNKLO', count: vnkloLeads },
  ]

  return (
    <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: G.ink, marginBottom: 16 }}>Conversion Funnel</div>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {steps.map((step, i) => {
          const pct     = total > 0 ? Math.round((step.count / total) * 100) : 0
          const prev    = steps[i - 1]
          const dropPct = prev && prev.count > 0
            ? Math.round(((prev.count - step.count) / prev.count) * 100)
            : 0
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 6px', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: G.inkFaint }}>→</span>
                  {dropPct > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: G.red, background: G.redLight, padding: '1px 5px', borderRadius: 4 }}>
                      ↓{dropPct}%
                    </span>
                  )}
                </div>
              )}
              <div style={{ flex: 1, textAlign: 'center', background: G.bg, borderRadius: 10, padding: '14px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: G.ink, fontFamily: '"DM Mono", monospace', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {step.count}
                </div>
                <div style={{ fontSize: 11, color: AG, fontWeight: 600, marginTop: 4 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: G.inkMuted, marginTop: 3, lineHeight: 1.3 }}>{step.label}</div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ users, vnkloLeads, chatSessions, recentReports, loading }) {
  const totalUsers   = users.length
  const totalReports = users.reduce((s, u) => s + (u.report_count ?? 0), 0)
  const chatRate     = chatSessions > 0
    ? `${((totalReports / chatSessions) * 100).toFixed(0)}%`
    : '—'
  const avgReports   = totalUsers > 0 ? (totalReports / totalUsers).toFixed(1) : '0'

  const now           = Date.now()
  const weekAgo       = now - 7 * 24 * 60 * 60 * 1000
  const signupsThisWk = users.filter(u => u.created_at && new Date(u.created_at).getTime() > weekAgo).length

  const tierCounts = {
    essential: users.filter(u => normTier(u.tier) === 'essential').length,
    business:  users.filter(u => normTier(u.tier) === 'business').length,
    portfolio: users.filter(u => normTier(u.tier) === 'portfolio').length,
  }
  const mrr = tierCounts.essential * 49 + tierCounts.business * 99 + tierCounts.portfolio * 299

  const TIER_CFG = [
    { key: 'essential', label: 'Essential', price: 49,  color: '#0F6E56' },
    { key: 'business',  label: 'Business',  price: 99,  color: '#185FA5' },
    { key: 'portfolio', label: 'Portfolio', price: 299, color: '#534AB7' },
  ]

  // Recent activity: merge recent reports + recent signups, sort by date
  const reportActivity = recentReports.slice(0, 4).map(r => ({
    type: 'report', label: r.title || 'Untitled report', date: r.created_at,
  }))
  const signupActivity = users.slice(0, 3).map(u => ({
    type: 'signup', label: `${u.name || u.email} signed up`, date: u.created_at,
  }))
  const activity = [...reportActivity, ...signupActivity]
    .filter(e => e.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const Card = ({ children }) => (
    <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
      {children}
    </div>
  )

  const KvRow = ({ label, value, last }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: last ? 'none' : `1px solid ${G.border}`,
    }}>
      <span style={{ fontSize: 12, color: G.inkMuted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: G.ink, fontFamily: '"DM Mono", monospace' }}>{value}</span>
    </div>
  )

  const healthRows = [
    ['Chat → report rate', chatRate],
    ['Avg reports / user', avgReports],
    ['Signups this week',  signupsThisWk],
    ['VNKLO conversions',  vnkloLeads],
    ['Total sessions',     chatSessions],
  ]

  return (
    <div style={{ width: 300, flexShrink: 0 }}>
      {/* Platform Health */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.ink, marginBottom: 10 }}>Platform Health</div>
        {healthRows.map(([l, v], i) => <KvRow key={l} label={l} value={v} last={i === healthRows.length - 1} />)}
      </Card>

      {/* Tier Distribution & MRR */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: G.ink }}>Tier Distribution</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: AG, fontFamily: '"DM Mono", monospace' }}>
            ${mrr.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 500, color: G.inkFaint }}>/mo</span>
          </span>
        </div>
        {TIER_CFG.map(tc => {
          const count = tierCounts[tc.key]
          const pct   = totalUsers > 0 ? (count / totalUsers) * 100 : 0
          return (
            <div key={tc.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: G.inkMuted }}>{tc.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: G.ink, fontFamily: '"DM Mono", monospace' }}>
                  {count} · ${(count * tc.price).toLocaleString()}
                </span>
              </div>
              <div style={{ height: 4, background: G.bg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: tc.color, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          )
        })}
      </Card>

      {/* Recent Activity */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 600, color: G.ink, marginBottom: 10 }}>Recent Activity</div>
        {loading ? (
          <div style={{ fontSize: 12, color: G.inkFaint, padding: '8px 0' }}>Loading…</div>
        ) : activity.length === 0 ? (
          <div style={{ fontSize: 12, color: G.inkFaint, padding: '8px 0' }}>No recent activity.</div>
        ) : (
          activity.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '7px 0',
              borderBottom: i < activity.length - 1 ? `1px solid ${G.border}` : 'none',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: ev.type === 'signup' ? AG : '#534AB7',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: G.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.label}
                </div>
                <div style={{ fontSize: 10, color: G.inkFaint, marginTop: 2 }}>{fmtDate(ev.date)}</div>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const NAV_TITLE = {
  dashboard: 'Dashboard',
  users:     'Users',
  reports:   'Reports',
  leads:     'VNKLO Leads',
  settings:  'Settings',
}

export default function AdminDashboard({ session, onUnauthorized }) {
  const [selectedUser,  setSelectedUser]  = useState(null)
  const [navSection,    setNavSection]    = useState('dashboard')
  const [users,         setUsers]         = useState([])
  const [loadingStats,  setLoadingStats]  = useState(true)
  const [vnkloLeads,    setVnkloLeads]    = useState(0)
  const [chatSessions,  setChatSessions]  = useState(0)
  const [recentReports, setRecentReports] = useState([])

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      onUnauthorized?.()
    }
  }, [session, onUnauthorized])

  useEffect(() => {
    if (!session || session.user?.email !== ADMIN_EMAIL) return
    ;(async () => {
      const sb = getServiceClient()
      if (!sb) { setLoadingStats(false); return }

      const { data } = await sb
        .from('admin_user_overview').select('*').order('created_at', { ascending: false })
      setUsers(data ?? [])

      const [chatRes, vnkloRes, reportsRes] = await Promise.allSettled([
        sb.from('chats').select('session_id', { count: 'exact', head: true }),
        sb.from('profiles').select('id', { count: 'exact', head: true }).eq('shared_with_vnklo', true),
        sb.from('reports').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
      ])
      if (chatRes.status    === 'fulfilled') setChatSessions(chatRes.value.count ?? 0)
      if (vnkloRes.status   === 'fulfilled') setVnkloLeads(vnkloRes.value.count ?? 0)
      if (reportsRes.status === 'fulfilled') setRecentReports(reportsRes.value.data ?? [])
      setLoadingStats(false)
    })()
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session || session.user?.email !== ADMIN_EMAIL) return null

  const totalReports = users.reduce((s, u) => s + (u.report_count ?? 0), 0)

  const handleNav = (s) => { setNavSection(s); setSelectedUser(null) }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: G.bg,
      fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <AdminSidebar
        navSection={navSection}
        onNav={handleNav}
        session={session}
        userCount={users.length}
        reportCount={totalReports}
        vnkloCount={vnkloLeads}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <AdminTopbar title={selectedUser ? 'User Detail' : (NAV_TITLE[navSection] ?? 'Dashboard')} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {selectedUser ? (
            <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />
          ) : navSection === 'dashboard' ? (
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* Main column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <KpiRow
                  users={users}
                  vnkloLeads={vnkloLeads}
                  chatSessions={chatSessions}
                  loading={loadingStats}
                />
                <ConversionFunnel users={users} vnkloLeads={vnkloLeads} />
                <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.ink, marginBottom: 14 }}>User Table</div>
                  <UserList onSelectUser={setSelectedUser} />
                </div>
              </div>

              {/* Right panel */}
              <RightPanel
                users={users}
                vnkloLeads={vnkloLeads}
                chatSessions={chatSessions}
                recentReports={recentReports}
                loading={loadingStats}
              />
            </div>
          ) : (
            <div style={{ background: G.white, border: `1px solid ${G.border}`, borderRadius: 12, padding: '28px 32px' }}>
              <UserList onSelectUser={setSelectedUser} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
