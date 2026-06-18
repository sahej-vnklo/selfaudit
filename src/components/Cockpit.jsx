import React, { useState, useEffect, useCallback } from 'react'
import { initSupabase } from '../lib/supabase.js'

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

const SERIF = '"Cormorant Garamond", "Times New Roman", serif'

// escalate / alert / critical → full newspaper article with approve/skip
const ACTIONABLE_TIERS = new Set(['escalate', 'alert', 'critical'])

const STATUS_DOT_COLOR = {
  bad:         'var(--red)',
  watch:       'var(--amber)',
  good:        'var(--green)',
  'no-signal': 'var(--border2)',
}

const STATUS_DOT_LABEL = {
  bad: 'critical', watch: 'watch', good: 'good', 'no-signal': 'no signal',
}

function sevStyle(severity) {
  if (severity === 'critical') return { label: 'Critical', bg: C.redBg,   color: C.redText,   border: C.red   }
  if (severity === 'high')     return { label: 'High',     bg: C.amberBg, color: C.amberText, border: C.amber }
  return                              { label: 'Medium',   bg: C.amberBg, color: C.amberText, border: C.amber }
}

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff  = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 2)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function nextCheckLabel() {
  const now  = new Date()
  const next = new Date()
  next.setUTCHours(8, 0, 0, 0)
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  const diffHours = Math.round((next - now) / 3600000)
  if (diffHours <= 1) return 'Next check under 1h'
  return `Next check in ${diffHours}h`
}

// ── Loading / empty states ──────────────────────────────────────────────────

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
          Run your first health check to see a briefing on what's happening across your business.
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
    </div>
  )
}

function LoadingSkeleton() {
  const shimmer = { background: 'var(--surface2)', borderRadius: 6, animation: 'cockpit-shimmer 1.4s ease-in-out infinite' }
  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes cockpit-shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      <div style={{ ...shimmer, height: 88 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...shimmer, height: 220 }} />
          <div style={{ ...shimmer, height: 160 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...shimmer, height: 180 }} />
          <div style={{ ...shimmer, height: 140 }} />
        </div>
      </div>
    </div>
  )
}

// ── Newspaper article (actionable alerts) ────────────────────────────────────

function NewspaperArticle({ alert, userId, areaLabel, onDone }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState(null)

  const sev             = sevStyle(alert.severity)
  const hasPendingAction = alert.execution_staged && alert.evidence?.pending_action_id
  const rootCause       = alert.evidence?.rootCause
  const impact          = alert.evidence?.impact

  async function doApprove() {
    if (busy) return
    setBusy(true); setErr(null)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const res = await fetch('/api/actions/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body:    JSON.stringify({ userId, pendingActionId: alert.evidence.pending_action_id, decision: 'approve' }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Action failed')
      onDone(alert.id)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  async function doSkip() {
    if (busy) return
    setBusy(true); setErr(null)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const res = await fetch('/api/update-risk-alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body:    JSON.stringify({ userId, alertId: alert.id, status: 'acknowledged' }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not skip')
      onDone(alert.id)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div style={{ paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ padding: '2px 7px', borderRadius: 4, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {sev.label}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>{areaLabel}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.textFaint }}>{timeAgo(alert.created_at)}</span>
      </div>

      <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 500, color: C.text, lineHeight: 1.2, margin: '0 0 6px' }}>
        {alert.title}
      </h3>
      {alert.description && (
        <p style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: C.textMuted, lineHeight: 1.65, margin: '0 0 12px' }}>
          {alert.description}
        </p>
      )}

      {rootCause && (
        <p style={{ fontSize: 13, lineHeight: 1.7, color: C.text, margin: '0 0 7px' }}>
          <span style={{ fontWeight: 600, color: C.textMuted, marginRight: 5 }}>Because</span>{rootCause}
        </p>
      )}
      {impact && (
        <p style={{ fontSize: 13, lineHeight: 1.7, color: C.text, margin: '0 0 7px' }}>
          <span style={{ fontWeight: 600, color: C.textMuted, marginRight: 5 }}>If ignored</span>{impact}
        </p>
      )}

      {alert.recommended_action && (
        <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', margin: '12px 0', fontSize: 13, lineHeight: 1.65 }}>
          <span style={{ fontWeight: 600, color: C.green, marginRight: 5 }}>Fix</span>
          <span style={{ color: C.text }}>{alert.recommended_action}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        {hasPendingAction && (
          <button type="button" onClick={doApprove} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 6, border: `1px solid ${C.green}`, background: C.greenBg, color: C.greenText, fontSize: 12, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
            Approve action
          </button>
        )}
        <button type="button" onClick={doSkip} disabled={busy} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
          Skip for now
        </button>
        {err && <span style={{ fontSize: 11, color: C.redText, marginLeft: 4 }}>{err}</span>}
      </div>
    </div>
  )
}

// ── Watching brief (lower-tier alerts) ──────────────────────────────────────

function WatchBrief({ alert, areaLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontFamily: SERIF, fontWeight: 500, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{alert.title}</div>
        <div style={{ fontSize: 11, color: C.textFaint }}>{areaLabel}</div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CockpitSection({ user, navigateSection }) {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState(null)
  const [dismissed, setDismissed]   = useState(new Set())

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
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ userId: user.id }),
      })
      setDismissed(new Set())
      await fetchData()
    } catch {
      await fetchData()
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return <div style={{ padding: '22px 24px' }}><LoadingSkeleton /></div>

  if (error) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: C.textMuted }}>
      <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
      <button type="button" onClick={fetchData} style={{ fontSize: 12, color: C.accentText, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
    </div>
  )

  if (!data?.has_data) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <EmptyState onRun={runHealthCheck} refreshing={refreshing} />
    </div>
  )

  // ── Derived values ──────────────────────────────────────────────────────
  const areaLabelById = new Map((data.selected_areas || []).map(a => [a.id, a.label]))
  const getAreaLabel  = (id) => areaLabelById.get(id) || (id || '').replace(/-/g, ' ').replace(/^[a-z]/, c => c.toUpperCase())

  const visibleAlerts = (data.alerts || []).filter(a => !dismissed.has(a.id))
  const needsAction   = visibleAlerts.filter(a => ACTIONABLE_TIERS.has(a.escalation_tier))
  const watching      = visibleAlerts.filter(a => !ACTIONABLE_TIERS.has(a.escalation_tier))

  const summaryText = data.cross_dept_insight || 'No critical issues flagged from the latest health check.'
  const checkLabel  = data.last_checked ? timeAgo(data.last_checked) : null
  const metrics     = data.cos?.at_a_glance || []

  function handleDone(alertId) {
    setDismissed(prev => new Set([...prev, alertId]))
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header — company identity + AI summary */}
      <div style={{ background: 'var(--d-surface)', border: '1px solid var(--d-border)', borderRadius: 12, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: C.text, lineHeight: 1.15 }}>
            {data.company_name || 'My Business'}
          </div>
          {(data.selected_areas || []).length > 0 && (
            <div style={{ fontSize: 12, color: C.textFaint, marginTop: 3 }}>
              {data.selected_areas.length} area{data.selected_areas.length !== 1 ? 's' : ''} monitored
            </div>
          )}
        </div>

        <div style={{ flex: 1, paddingLeft: 20, borderLeft: '1px solid var(--d-border)' }}>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.65, margin: '0 0 10px' }}>{summaryText}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textFaint, flexWrap: 'wrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'cockpit-pulse 2.4s ease-in-out infinite' }} />
            <style>{`@keyframes cockpit-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
            {checkLabel ? `Checked ${checkLabel}` : 'No checks run yet'}
            <span style={{ color: C.border2 }}>·</span>
            <span>{nextCheckLabel()}</span>
            <button type="button" onClick={runHealthCheck} disabled={refreshing} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: 'transparent', border: '1px solid var(--d-border)', color: C.textMuted, fontSize: 11.5, fontWeight: 500, cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.5 : 1 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              {refreshing ? 'Running…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Body — newspaper feed (left) + sidebar (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 16, alignItems: 'start' }}>

        {/* Left — alert feed */}
        <div>
          {/* Needs action */}
          <div style={{ borderTop: `2px solid ${C.text}`, paddingTop: 8, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Needs action</span>
            <span style={{ fontSize: 11, color: C.textFaint }}>{needsAction.length} {needsAction.length === 1 ? 'alert' : 'alerts'}</span>
          </div>

          {needsAction.length === 0 ? (
            <div style={{ fontSize: 13, color: C.greenText, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
              No critical alerts right now. Business is running clean.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {needsAction.map(alert => (
                <NewspaperArticle
                  key={alert.id}
                  alert={alert}
                  userId={user?.id}
                  areaLabel={getAreaLabel(alert.category)}
                  onDone={handleDone}
                />
              ))}
            </div>
          )}

          {/* Watching */}
          {watching.length > 0 && (
            <>
              <div style={{ borderTop: `2px solid ${C.text}`, paddingTop: 8, marginTop: needsAction.length > 0 ? 24 : 4, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Watching</span>
                <span style={{ fontSize: 11, color: C.textFaint }}>{watching.length} signal{watching.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {watching.map(alert => (
                  <WatchBrief key={alert.id} alert={alert} areaLabel={getAreaLabel(alert.category)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right — sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Areas */}
          <div style={{ background: 'var(--d-surface)', border: '1px solid var(--d-border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>Areas</div>
            {(data.selected_areas || []).length === 0 ? (
              <div style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>Complete onboarding to see area status.</div>
            ) : (
              (data.selected_areas || []).map(area => (
                <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT_COLOR[area.status] || STATUS_DOT_COLOR['no-signal'], flexShrink: 0 }} />
                  <span style={{ color: C.text, flex: 1 }}>{area.label}</span>
                  <span style={{ color: C.textFaint, fontSize: 11 }}>{STATUS_DOT_LABEL[area.status] || 'no signal'}</span>
                </div>
              ))
            )}
          </div>

          {/* Metrics */}
          {metrics.length > 0 && (
            <div style={{ background: 'var(--d-surface)', border: '1px solid var(--d-border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>Metrics</div>
              {metrics.map((item, i) => {
                const isBad = item.trend === 'up-bad' || item.trend === 'down-bad'
                const valColor = isBad ? C.redText : (item.trend !== 'flat' ? C.amberText : C.text)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12, borderBottom: i < metrics.length - 1 ? '1px solid var(--d-border)' : 'none' }}>
                    <span style={{ color: C.textMuted }}>{item.label}</span>
                    <span style={{ fontWeight: 500, color: valColor }}>{item.value}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Chat link */}
          <button
            type="button"
            onClick={() => navigateSection?.('home')}
            style={{ background: 'var(--d-surface)', border: '1px solid var(--d-border)', borderRadius: 10, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 6 }}>Ask anything</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, marginBottom: 10 }}>Deep-dive any alert or talk through what's going on.</div>
            <div style={{ fontSize: 12, color: C.accentText, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
              Open chat
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </button>

        </div>
      </div>
    </div>
  )
}
