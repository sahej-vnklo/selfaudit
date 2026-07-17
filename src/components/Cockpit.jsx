import React, { useState, useEffect, useCallback } from 'react'
import { initSupabase } from '../lib/supabase.js'
import './Cockpit.css'

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

const DISPLAY_FONT = '-apple-system, "Helvetica Neue", "Inter", Arial, sans-serif'

// escalate / alert / critical → ranked top signals; lower tiers stay in Watching
const ACTIONABLE_TIERS = new Set(['escalate', 'alert', 'critical'])

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

function EmptyState({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '60px 40px', color: C.textMuted }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>No signals yet</div>
        <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 380, lineHeight: 1.7 }}>
          Connect your tools and set your metrics. SelfAudit monitors your business continuously from there — no prompting required.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={() => onNavigate('connectors')}
          style={{ padding: '9px 24px', borderRadius: 8, background: C.accentLight, border: `1px solid ${C.accent}`, color: C.accentText, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Connect your tools
        </button>
        <button
          type="button"
          onClick={() => onNavigate('account?tab=metrics')}
          style={{ padding: '6px 16px', borderRadius: 8, background: 'transparent', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
        >
          or set metrics manually
        </button>
      </div>
    </div>
  )
}

const MONITORING_STEPS = [
  { text: 'Connecting to your tools',     ms: 0    },
  { text: 'Reading live metrics',         ms: 2800 },
  { text: 'Evaluating business health',   ms: 5800 },
  { text: 'Identifying risks',            ms: 8800 },
  { text: 'Composing diagnostics',        ms: 11000 },
]

function AnimatedDots() {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])
  return <span style={{ opacity: 0.5 }}>{dots}</span>
}

function ReadyState({ onStart, running }) {
  const [visibleSteps, setVisibleSteps] = useState([])
  const [doneSteps, setDoneSteps]       = useState(new Set())

  useEffect(() => {
    if (!running) { setVisibleSteps([]); setDoneSteps(new Set()); return }

    const timers = []
    MONITORING_STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => setVisibleSteps(prev => [...prev, i]), step.ms))
      if (i < MONITORING_STEPS.length - 1) {
        timers.push(setTimeout(() => setDoneSteps(prev => new Set([...prev, i])), MONITORING_STEPS[i + 1].ms - 100))
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [running])

  if (running) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 280 }}>
        {visibleSteps.map(i => {
          const done = doneSteps.has(i)
          const isLast = i === visibleSteps[visibleSteps.length - 1]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: done ? C.textMuted : C.text }}>
              <span style={{ fontSize: 11, minWidth: 14, color: done ? C.green : C.accent }}>
                {done ? '✓' : '›'}
              </span>
              <span>
                {MONITORING_STEPS[i].text}
                {!done && isLast && <AnimatedDots />}
                {done && <span style={{ opacity: 0.4 }}> done</span>}
              </span>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '60px 40px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>You're all set</div>
        <div style={{ fontSize: 13, color: C.textMuted, maxWidth: 360, lineHeight: 1.7 }}>
          Your tools are connected. Start monitoring and SelfAudit will evaluate your business health and flag what needs attention — automatically from here.
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        style={{ padding: '11px 32px', borderRadius: 8, background: C.accent, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.01em' }}
      >
        Start monitoring
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

// ── Approve popup — channel picker shown when user clicks Approve ────────────

function ApprovePopup({ lead, userId, userEmail, commChannels, savedCommPref, onSuccess, onClose }) {
  const defaultChannel = savedCommPref?.channel_type ?? 'email'
  const [selected, setSelected]   = useState(defaultChannel)
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState(null)

  const channels = commChannels?.length > 0 ? commChannels : [{ type: 'email', label: 'Account Email', params: null }]
  const isFirstTime = !savedCommPref

  const CHANNEL_ICON = {
    email: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    ),
    slack: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M9 9h6M9 15h6M9 9v6M15 9v6"/></svg>
    ),
    gmail: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    ),
  }

  function getChannelSubtitle(ch) {
    if (ch.type === 'email') return userEmail || 'your account email'
    if (ch.type === 'slack') return ch.params?.channel ? `#${ch.params.channel}` : 'Slack workspace'
    if (ch.type === 'gmail') return ch.params?.recipient || 'Gmail draft'
    return ch.type
  }

  async function doSend() {
    if (busy) return
    setBusy(true); setErr(null)
    try {
      const ch     = channels.find(c => c.type === selected) ?? channels[0]
      const params = ch.type === 'email' ? { email: userEmail } : (ch.params ?? {})

      const hasStagedArtifact = lead.execution_staged && lead.evidence?.pending_action_id

      const body = {
        userId,
        alertId:     lead.id,
        channelType: ch.type,
        params,
        savePref:    true,
        // If a specific artifact was staged by the system, send that.
        // Otherwise fall back to sending the alert summary.
        ...(hasStagedArtifact
          ? { pendingActionId: lead.evidence.pending_action_id }
          : {
              alertData: {
                title:              lead.title,
                description:        lead.description,
                rootCause:          lead.evidence?.rootCause,
                impact:             lead.evidence?.impact,
                recommended_action: lead.recommended_action,
                severity:           lead.severity,
                category:           lead.category,
                escalation_tier:    lead.escalation_tier,
              }
            }
        ),
      }

      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const headers = { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }

      const res = await fetch('/api/actions/notify', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not send')
      onSuccess()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '22px 24px', width: '100%', maxWidth: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.28)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Send this action</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 18, lineHeight: 1.5 }}>
          {isFirstTime ? 'Pick where you want this sent. We\'ll remember your choice.' : 'Send to your saved channel, or pick a different one.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {channels.map(ch => {
            const isSelected = selected === ch.type
            return (
              <button
                key={ch.type}
                type="button"
                onClick={() => setSelected(ch.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  border: isSelected ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: isSelected ? C.accentLight : C.surface2,
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <span style={{ color: isSelected ? C.accentText : C.textMuted, flexShrink: 0 }}>
                  {CHANNEL_ICON[ch.type] ?? CHANNEL_ICON.email}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? C.accentText : C.text }}>{ch.label}</div>
                  <div style={{ fontSize: 11, color: C.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getChannelSubtitle(ch)}</div>
                </div>
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentText, flexShrink: 0 }}><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>
            )
          })}
        </div>

        {err && <div style={{ fontSize: 11, color: C.redText, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={doSend}
            disabled={busy}
            style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${C.green}`, background: C.greenBg, color: C.greenText, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Sending…' : 'Send →'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ padding: '8px 14px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Watching brief (lower-tier alerts) ──────────────────────────────────────

function WatchBrief({ alert, areaLabel }) {
  const metricDisplay = alert.metric_key && alert.metric_value != null
    ? `${alert.metric_key.replace(/_/g, ' ')}: ${alert.metric_value}`
    : null
  const subtitle = metricDisplay || (alert.description ? alert.description.slice(0, 80) : null) || areaLabel

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontFamily: DISPLAY_FONT, fontWeight: 500, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{alert.title}</div>
        <div style={{ fontSize: 11, color: C.textFaint }}>{subtitle}</div>
      </div>
    </div>
  )
}

function OpportunityBrief({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontFamily: DISPLAY_FONT, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  )
}

function SignalListItem({ signal, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`sentinel-signal${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(signal.id)}
    >
      <span className="sentinel-signal-rank">{String(signal.rank).padStart(2, '0')}</span>
      <span className="sentinel-signal-copy">
        <span className="sentinel-signal-title">{signal.title}</span>
        <span className="sentinel-signal-description">{signal.issue_summary}</span>
      </span>
      <span className={`sentinel-signal-impact${signal.financial_impact ? '' : ' unquantified'}`}>
        {signal.financial_impact?.display || 'Not quantified'}
      </span>
    </button>
  )
}

function SummaryRow({ label, children, className = '' }) {
  return (
    <div className={`sentinel-summary-row${className ? ` ${className}` : ''}`}>
      <div className="sentinel-summary-label">{label}</div>
      <div className="sentinel-summary-value">{children}</div>
    </div>
  )
}

function SignalSummaryPanel({ signal, alert, user, commChannels, savedCommPref, navigateSection, onDone }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    setBusy(false)
    setErr(null)
    setShowPopup(false)
  }, [signal?.id])

  if (!signal || !alert) {
    return (
      <aside className="sentinel-summary empty" aria-live="polite">
        <h2>Signal summary</h2>
        <p>Select a signal to review its evidence and recommended next step.</p>
      </aside>
    )
  }

  const approveLabel = signal.execution_staged && alert.evidence?.pending_action_label
    ? `Approve: ${alert.evidence.pending_action_label}`
    : 'Approve action'

  async function doSkip() {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/update-risk-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ userId: user?.id, alertId: alert.id, status: 'acknowledged' }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Could not skip')
      onDone(alert.id)
    } catch (error) {
      setErr(error.message)
      setBusy(false)
    }
  }

  function viewFullAnalysis() {
    sessionStorage.setItem(
      'sa_probe_question',
      `Give me a full analysis of this signal: ${signal.title}. Context: ${signal.issue_summary}`,
    )
    navigateSection?.('home')
  }

  return (
    <>
      {showPopup && (
        <ApprovePopup
          lead={alert}
          userId={user?.id}
          userEmail={user?.email}
          commChannels={commChannels}
          savedCommPref={savedCommPref}
          onSuccess={() => { setShowPopup(false); onDone(alert.id) }}
          onClose={() => setShowPopup(false)}
        />
      )}

      <aside className="sentinel-summary" aria-live="polite">
        <div className="sentinel-summary-head">
          <h2>Signal summary</h2>
          <span className="sentinel-selected-chip">Selected ✓</span>
        </div>

        <SummaryRow label="Signal" className="primary">
          <strong>{signal.title}</strong>
        </SummaryRow>

        <SummaryRow label="Issue summary">{signal.issue_summary}</SummaryRow>

        <SummaryRow label="Likely driver">
          {signal.likely_driver || 'The available evidence does not identify a likely driver yet.'}
        </SummaryRow>

        {signal.impact_summary && (
          <SummaryRow label="If ignored">{signal.impact_summary}</SummaryRow>
        )}

        <SummaryRow label={signal.affected_label}>
          <span className="sentinel-summary-icon" aria-hidden="true">◎</span>
          {signal.affected_detail}
        </SummaryRow>

        <SummaryRow label={signal.financial_impact?.label || 'Financial impact'} className="financial">
          <span className={signal.financial_impact ? 'quantified-impact' : 'unquantified-impact'}>
            {signal.financial_impact?.display || 'Not quantified'}
          </span>
          {signal.financial_impact?.basis && <small>{signal.financial_impact.basis}</small>}
        </SummaryRow>

        <SummaryRow label="Urgency">
          <strong>{signal.urgency.label}</strong> — {signal.urgency.detail}
        </SummaryRow>

        <SummaryRow label="Responsible area">{signal.area_label}</SummaryRow>

        <SummaryRow label="Recommended next step">
          {signal.recommended_next_step || 'Review the signal and assign the next operating step.'}
        </SummaryRow>

        <div className="sentinel-summary-actions">
          <button type="button" className="sentinel-analysis-btn" onClick={viewFullAnalysis}>View full analysis →</button>
          <button type="button" className="sentinel-approve-btn" onClick={() => setShowPopup(true)} disabled={busy}>{approveLabel}</button>
          <button type="button" className="sentinel-skip-btn" onClick={doSkip} disabled={busy}>Skip for now</button>
        </div>
        {err && <div className="sentinel-summary-error">{err}</div>}
      </aside>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function CockpitSection({ user, navigateSection }) {
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monitoring, setMonitoring] = useState(false)
  const [error, setError]           = useState(null)
  const [dismissed, setDismissed]   = useState(new Set())
  const [selectedSignalId, setSelectedSignalId] = useState(null)

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

  useEffect(() => {
    const available = (data?.top_signals || []).filter((signal) => !dismissed.has(signal.id))
    setSelectedSignalId((current) => (
      available.some((signal) => signal.id === current) ? current : (available[0]?.id || null)
    ))
  }, [data, dismissed])

  const runHealthCheck = async (fromReadyState = false) => {
    if (!user?.id || refreshing) return
    if (fromReadyState) setMonitoring(true)
    setRefreshing(true)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const [healthRes] = await Promise.all([
        fetch('/api/run-health-check', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body:    JSON.stringify({ userId: user.id }),
        }),
        fromReadyState ? new Promise(r => setTimeout(r, 14000)) : Promise.resolve(),
      ])
      setDismissed(new Set())
      await fetchData()
    } catch {
      await fetchData()
    } finally {
      setRefreshing(false)
      setMonitoring(false)
    }
  }

  if (loading) return <div style={{ padding: '22px 24px' }}><LoadingSkeleton /></div>

  if (error) return (
    <div style={{ padding: '40px 24px', textAlign: 'center', color: C.textMuted }}>
      <div style={{ fontSize: 13, marginBottom: 12 }}>{error}</div>
      <button type="button" onClick={fetchData} style={{ fontSize: 12, color: C.accentText, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
    </div>
  )

  if (!data?.has_data) {
    const isReady = data?.has_connectors || data?.metrics_configured
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isReady
          ? <ReadyState onStart={() => runHealthCheck(true)} running={monitoring} />
          : <EmptyState onNavigate={navigateSection} />
        }
      </div>
    )
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const areaLabelById = new Map((data.selected_areas || []).map(a => [a.id, a.label]))
  const getAreaLabel  = (id) => areaLabelById.get(id) || (id || '').replace(/-/g, ' ').replace(/^[a-z]/, c => c.toUpperCase())
  const topSignals    = (data.top_signals || []).filter((signal) => !dismissed.has(signal.id))
  const selectedSignal = topSignals.find((signal) => signal.id === selectedSignalId) || topSignals[0] || null
  const selectedAlert = selectedSignal
    ? (data.alerts || []).find((alert) => alert.id === selectedSignal.id) || null
    : null
  const watching      = (data.alerts || []).filter(a => !dismissed.has(a.id) && !ACTIONABLE_TIERS.has(a.escalation_tier))
  const checkLabel    = data.last_checked ? timeAgo(data.last_checked) : null

  function handleDone(alertId) {
    setDismissed(prev => new Set([...prev, alertId]))
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="sentinel-page">
      <header className="sentinel-toolbar">
        <div>
          <h1>Top Signals</h1>
          <p>Ranked by estimated financial impact where quantified</p>
        </div>
        <div className="sentinel-update">
          <span className="sentinel-update-dot" />
          <span>{checkLabel ? `Updated ${checkLabel}` : 'No checks run yet'}</span>
          <span>·</span>
          <span>{nextCheckLabel()}</span>
          <button type="button" className="sentinel-refresh" onClick={runHealthCheck} disabled={refreshing}>
            {refreshing ? 'Running…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Logic nudge — shown when user has neither connectors nor custom metrics */}
      {!data.metrics_configured && !data.has_connectors && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.amberBg, border: `1px solid ${C.amber}`, borderRadius: 4, padding: '11px 16px', marginBottom: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.amber, flexShrink: 0 }} aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 13, color: C.amberText, flex: 1, lineHeight: 1.5 }}>
            Monitoring is paused. Connect your tools or add metrics manually so the system has something to evaluate.
          </span>
          <button
            type="button"
            onClick={() => navigateSection?.('connectors')}
            style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: C.amberText, background: 'transparent', border: `1px solid ${C.amber}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Connect tools →
          </button>
        </div>
      )}

      {(data.probing_queue || []).length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.amberBg, border: `1px solid ${C.amber}55`, borderRadius: 4, padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: C.amberText, flex: 1 }}>
            {data.probing_queue.length} blind area{data.probing_queue.length !== 1 ? 's need' : ' needs'} more evidence.
          </span>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('sa_probe_question', data.probing_queue[0].question)
              navigateSection?.('home')
            }}
            style={{ color: C.amberText, background: 'transparent', border: `1px solid ${C.amber}`, borderRadius: 3, padding: '5px 10px', fontSize: 11 }}
          >
            Review blind spots →
          </button>
        </div>
      )}

      <div className="sentinel-workspace">
        <section className="sentinel-list-pane" aria-label="Top signals">
          {topSignals.length === 0 ? (
            <div className="sentinel-empty-signals">No critical issues right now. Business is running clean.</div>
          ) : (
            <div className="sentinel-signal-list">
              {topSignals.map((signal) => (
                <SignalListItem
                  key={signal.id}
                  signal={signal}
                  selected={signal.id === selectedSignal?.id}
                  onSelect={setSelectedSignalId}
                />
              ))}
            </div>
          )}
        </section>

        <SignalSummaryPanel
          signal={selectedSignal}
          alert={selectedAlert}
          user={user}
          commChannels={data.comm_channels}
          savedCommPref={data.saved_comm_pref}
          navigateSection={navigateSection}
          onDone={handleDone}
        />
      </div>

      <div className="sentinel-lower">
        {(data.opportunities || []).length > 0 && (
          <>
            <div style={{ borderTop: `2px solid ${C.green}`, paddingTop: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.greenText }}>Opportunities</span>
              <span style={{ fontSize: 11, color: C.textFaint }}>{data.opportunities.length} signal{data.opportunities.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              {data.opportunities.map((text, i) => <OpportunityBrief key={i} text={text} />)}
            </div>
          </>
        )}

        {watching.length > 0 && (
          <>
            <div style={{ borderTop: `2px solid ${C.text}`, paddingTop: 8, marginTop: (data.opportunities || []).length > 0 ? 24 : 4, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>Watching</span>
              <span style={{ fontSize: 11, color: C.textFaint }}>{watching.length} signal{watching.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              {watching.map(alert => <WatchBrief key={alert.id} alert={alert} areaLabel={getAreaLabel(alert.category)} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
