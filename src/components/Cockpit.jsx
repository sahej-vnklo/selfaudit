import React, { useState, useEffect, useCallback } from 'react'
import { initSupabase } from '../lib/supabase.js'

// CSS vars from parent .sa-dash (theme-aware, no prop needed)
const C = {
  bg:            'var(--bg)',
  surface:       'var(--surface)',
  surface2:      'var(--surface2)',
  surface3:      'var(--surface3)',
  border:        'var(--border)',
  border2:       'var(--border2)',
  text:          'var(--text)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  textFaint:     'var(--text-faint)',
  accent:        'var(--accent)',
  accentLight:   'var(--accent-light)',
  accentText:    'var(--accent-text)',
  red:           'var(--red)',
  redBg:         'var(--red-bg)',
  redText:       'var(--red-text)',
  amber:         'var(--amber)',
  amberBg:       'var(--amber-bg)',
  amberText:     'var(--amber-text)',
  green:         'var(--green)',
  greenBg:       'var(--green-bg)',
  greenText:     'var(--green-text)',
}

const AREA_ICONS = {
  'customer-service': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  'finance-accounting': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  'marketing-sales': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  'management-strategy': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

const STATUS_STYLE = {
  bad:        { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',   label: 'Concerned' },
  watch:      { color: 'var(--amber-text)', bg: 'var(--amber-bg)', border: 'var(--amber)', label: 'Watch' },
  good:       { color: 'var(--green-text)', bg: 'var(--green-bg)', border: 'var(--green)', label: 'Stable' },
  'no-signal':{ color: 'var(--text-faint)', bg: 'transparent',     border: 'var(--border)', label: 'No data' },
}

const SEV_STYLE = {
  critical: { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',   label: 'Critical' },
  high:     { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',   label: 'High' },
  medium:   { color: 'var(--amber-text)', bg: 'var(--amber-bg)', border: 'var(--amber)', label: 'Medium' },
  low:      { color: 'var(--text-faint)', bg: 'transparent',     border: 'var(--border)', label: 'Low' },
}

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 2)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function Sparkline({ values, color = 'currentColor', width = 52, height = 24 }) {
  if (!values || values.length < 2) return <div style={{ width, height }} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  const w = width
  const h = height
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = pad + ((max - v) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.85"/>
    </svg>
  )
}

function EmptyState({ onRun, refreshing }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 40px', color: C.textMuted }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
        <rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No analysis yet</div>
        <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 340, lineHeight: 1.6 }}>
          Run your first health check so the Chief of Staff can brief you on what's happening across your business.
        </div>
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={refreshing}
        style={{ padding: '9px 20px', borderRadius: 8, background: C.accentLight, border: `1px solid ${C.accent}`, color: C.accentText, fontSize: 13, fontWeight: 600, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
      >
        {refreshing ? 'Running analysis…' : 'Run analysis now'}
      </button>
      <div style={{ fontSize: 12, color: C.textFaint, maxWidth: 360, textAlign: 'center', lineHeight: 1.5 }}>
        You can also add business context in the <strong style={{ color: C.textMuted }}>Context</strong> tab or connect tools via <strong style={{ color: C.textMuted }}>Connectors</strong> to get richer insights.
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  const shimmer = { background: 'var(--surface2)', borderRadius: 6, animation: 'cockpit-shimmer 1.4s ease-in-out infinite' }
  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes cockpit-shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      <div style={{ ...shimmer, height: 220 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ ...shimmer, height: 200 }} />)}
      </div>
      <div style={{ ...shimmer, height: 56 }} />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PriorityItem({ item, index }) {
  const sev = SEV_STYLE[item.severity] || SEV_STYLE.medium
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 12px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.surface3, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: C.textFaint, flexShrink: 0, marginTop: 1 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, lineHeight: 1.35, marginBottom: 2 }}>{item.title}</div>
        {item.impact && <div style={{ fontSize: 11, color: C.textMuted }}>{item.impact}</div>}
      </div>
      <div style={{ padding: '2px 7px', borderRadius: 100, fontSize: 9.5, fontWeight: 700, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, flexShrink: 0, marginTop: 1, letterSpacing: '0.03em' }}>
        {sev.label}
      </div>
    </div>
  )
}

function GlanceRow({ item }) {
  const isGood = item.trend === 'up-good' || item.trend === 'down-good'
  const isBad  = item.trend === 'up-bad'  || item.trend === 'down-bad'
  const deltaColor = isGood ? C.greenText : isBad ? C.redText : C.amberText
  const deltaBg    = isGood ? C.greenBg   : isBad ? C.redBg   : C.amberBg

  const sparkColor = isGood ? 'var(--green)' : isBad ? 'var(--red)' : 'var(--amber)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>{item.label}</div>
      {item.sparkline?.length >= 2 && <Sparkline values={item.sparkline} color={sparkColor} width={44} height={18} />}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, flexShrink: 0 }}>{item.value}</div>
      {item.delta != null && (
        <div style={{ padding: '1px 5px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: deltaColor, background: deltaBg, flexShrink: 0 }}>
          {item.delta > 0 ? '↑' : '↓'} {Math.abs(item.delta).toFixed(1)}
        </div>
      )}
    </div>
  )
}

function DeptCard({ dept, onViewDept }) {
  const st = STATUS_STYLE[dept.status] || STATUS_STYLE['no-signal']
  const metricDeltaColor = dept.key_metric?.delta != null
    ? (dept.key_metric.delta > 0 ? C.redText : C.greenText)
    : C.textFaint
  const sparkColor = dept.key_metric?.delta != null
    ? (dept.key_metric.delta > 0 ? 'var(--red)' : 'var(--green)')
    : 'var(--text-secondary)'

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'default' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: C.surface2, border: `1px solid ${C.border}`, display: 'grid', placeItems: 'center', color: C.textMuted, flexShrink: 0 }}>
            {AREA_ICONS[dept.id]}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.text }}>{dept.name}</div>
            <div style={{ fontSize: 10.5, color: C.textFaint }}>{dept.role}</div>
          </div>
        </div>
        <div style={{ padding: '2px 7px', borderRadius: 100, fontSize: 9.5, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, flexShrink: 0, letterSpacing: '0.03em' }}>
          {st.label}
        </div>
      </div>

      {/* Top Issue */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>Top Issue</div>
        {dept.top_issue ? (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{dept.top_issue.title}</div>
            {dept.top_issue.sub && <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{dept.top_issue.sub}</div>}
          </>
        ) : (
          <div style={{ fontSize: 12, color: C.greenText }}>No issues detected</div>
        )}
      </div>

      {/* Key Metric */}
      {dept.key_metric ? (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>{dept.key_metric.label}</div>
            <div>
              <span style={{ fontSize: 19, fontWeight: 700, color: C.text, lineHeight: 1 }}>{dept.key_metric.value}{dept.key_metric.unit}</span>
              {dept.key_metric.delta != null && (
                <span style={{ fontSize: 11, fontWeight: 600, color: metricDeltaColor, marginLeft: 5 }}>
                  {dept.key_metric.delta > 0 ? '↑' : '↓'} {Math.abs(dept.key_metric.delta).toFixed(1)}{dept.key_metric.unit}
                </span>
              )}
            </div>
          </div>
          {dept.key_metric.sparkline?.length >= 2 && (
            <Sparkline values={dept.key_metric.sparkline} color={sparkColor} width={52} height={26} />
          )}
        </div>
      ) : (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, padding: '8px 10px' }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>Connect tools or add context to see metrics</div>
        </div>
      )}

      {/* Latest Insight */}
      {dept.latest_insight && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>Latest Insight</div>
          <div style={{ fontSize: 11.5, color: C.textMuted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {dept.latest_insight}
          </div>
        </div>
      )}

      {/* View link */}
      <div style={{ marginTop: 'auto', fontSize: 11.5, color: C.accentText, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
        onClick={() => onViewDept?.(dept.id)}>
        View department
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CockpitSection({ user, navigateSection }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]       = useState(null)

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const res = await fetch(`/api/cockpit-data?userId=${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Could not load cockpit data')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const runHealthCheck = async () => {
    if (!user?.id || refreshing) return
    setRefreshing(true)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      await fetch('/api/run-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id }),
      })
      await fetchData()
    } catch {
      // non-blocking — just refresh
      await fetchData()
    } finally {
      setRefreshing(false)
    }
  }

  const updatedLabel = data?.last_checked ? `Last updated ${timeAgo(data.last_checked)}` : null

  // ── Render states ──
  if (loading) return (
    <div style={{ padding: '22px 24px' }}>
      <LoadingSkeleton />
    </div>
  )

  if (error) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: C.textMuted }}>
      <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
      <button type="button" onClick={fetchData} style={{ fontSize: 12, color: C.accentText, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Retry
      </button>
    </div>
  )

  if (!data?.has_data) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <EmptyState onRun={runHealthCheck} refreshing={refreshing} />
    </div>
  )

  const { cos, departments, cross_dept_insight, opportunities } = data

  // ── Full Cockpit render ────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Chief of Staff Block ─────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.accentText }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'cockpit-pulse 2.4s ease-in-out infinite' }} />
            AI Chief of Staff
            <style>{`@keyframes cockpit-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {updatedLabel && <span style={{ fontSize: 11.5, color: C.textFaint }}>{updatedLabel}</span>}
            <button
              type="button"
              onClick={runHealthCheck}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: 'transparent', border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11.5, fontWeight: 500, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.5 : 1 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ ...(refreshing ? { animation: 'spin 1s linear infinite' } : {})}}>
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              {refreshing ? 'Running…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* 3-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.85fr' }}>

          {/* LEFT — Greeting + priorities */}
          <div style={{ padding: '22px 22px', borderRight: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif', fontSize: 26, fontWeight: 500, lineHeight: 1.15, marginBottom: 5, color: C.text }}>
              Good morning, {userName}.
            </div>
            <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5, marginBottom: 18 }}>
              {cos.priorities.length > 0
                ? `After reviewing all departments, I found ${cos.priorities.length} issue${cos.priorities.length !== 1 ? 's' : ''} requiring your attention.`
                : 'Everything looks stable across your departments.'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {cos.priorities.length > 0
                ? cos.priorities.map((p, i) => <PriorityItem key={i} item={p} index={i} />)
                : <div style={{ fontSize: 13, color: C.greenText, padding: '10px 12px', background: C.greenBg, borderRadius: 8, border: `1px solid var(--green)` }}>No active risks detected.</div>
              }
            </div>
          </div>

          {/* MIDDLE — Recommended move */}
          <div style={{ padding: '22px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>Recommended Move</div>
            {cos.recommended_move ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.2, marginBottom: 14 }}>{cos.recommended_move.action}</div>
                {cos.recommended_move.extras?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {cos.recommended_move.extras.map((ex, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
                        <div style={{ width: 15, height: 15, borderRadius: '50%', background: C.greenBg, border: `1px solid var(--green)`, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                          <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                        {ex}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigateSection?.('home')}
                  style={{ marginTop: 'auto', width: '100%', padding: '9px 14px', background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: 8, color: C.accentText, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  Discuss with Chief of Staff →
                </button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 8 }}>No specific recommendation at this time.</div>
            )}
          </div>

          {/* RIGHT — At a glance */}
          <div style={{ padding: '22px' }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>At a Glance</div>
            {cos.at_a_glance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cos.at_a_glance.map((item, i) => <GlanceRow key={i} item={item} />)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
                Add financial data in the Context tab to see your key metrics here.
              </div>
            )}
          </div>

        </div>

        {/* Confidence bar */}
        {data.confidence != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.textFaint }}>
            <span>Confidence in insights</span>
            <div style={{ flex: 1, maxWidth: 130, height: 3, background: C.surface2, borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: `${data.confidence}%`, height: '100%', background: C.accent, borderRadius: 100 }} />
            </div>
            <span>{data.confidence}%</span>
          </div>
        )}
      </div>

      {/* ── Department Briefing ──────────────────────────────────────────────── */}
      <div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
          Department Briefing
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {departments.map(dept => (
            <DeptCard key={dept.id} dept={dept} onViewDept={(id) => navigateSection?.(`dept-${id}`)} />
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden' }}>

        {/* Cross-dept insight */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRight: `1px solid ${C.border}`, cursor: 'pointer', minWidth: 0 }}
          onClick={() => navigateSection?.('oversight')}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.accentLight, display: 'grid', placeItems: 'center', color: C.accentText, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2M7.05 7.05L5.64 5.64M18.36 18.36l-1.41-1.41M7.05 16.95l-1.41 1.41M18.36 5.64l-1.41 1.41" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1 }}>Cross-department insight</div>
            <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {cross_dept_insight || 'Run analysis to see how departments connect.'}
            </div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.textFaint, flexShrink: 0 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        {/* Opportunities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRight: `1px solid ${C.border}`, cursor: 'pointer', minWidth: 0 }}
          onClick={() => navigateSection?.('intelligence')}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.greenBg, display: 'grid', placeItems: 'center', color: C.greenText, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1 }}>High-impact opportunities</div>
            <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {opportunities.length > 0 ? `${opportunities.length} identified — ${opportunities[0]}` : 'No opportunities flagged yet.'}
            </div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.textFaint, flexShrink: 0 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        {/* Ask Chief of Staff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer', minWidth: 0 }}
          onClick={() => navigateSection?.('home')}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.accentLight, display: 'grid', placeItems: 'center', color: C.accentText, flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 1 }}>Ask Chief of Staff</div>
            <div style={{ fontSize: 11, color: C.textMuted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Ask anything. Backed by all department data.</div>
          </div>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.textFaint, flexShrink: 0 }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

      </div>
    </div>
  )
}
