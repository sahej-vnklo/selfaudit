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

const AREA_META = {
  'customer-service': {
    name:        'Support',
    fullName:    'Customer Service',
    role:        'Head of Customer Support',
    description: 'Response times, resolution speed, repeat issues, and customer satisfaction.',
  },
  'marketing-sales': {
    name:        'Sales & Marketing',
    fullName:    'Marketing & Sales',
    role:        'Head of Growth',
    description: 'Pipeline health, lead volume, stage conversion, and sales cycle.',
  },
  'finance-accounting': {
    name:        'Finance',
    fullName:    'Finance & Accounting',
    role:        'Chief Financial Officer',
    description: 'Churn rate, cash runway, and LTV:CAC unit economics.',
  },
  'management-strategy': {
    name:        'Strategy & Ops',
    fullName:    'Management & Strategy',
    role:        'Chief Operating Officer',
    description: 'Goal progress, execution follow-through, blockers, and priority backlog.',
  },
}

const STATUS_STYLE = {
  bad:         { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',    label: 'Concerned' },
  watch:       { color: 'var(--amber-text)', bg: 'var(--amber-bg)', border: 'var(--amber)',  label: 'Watch' },
  good:        { color: 'var(--green-text)', bg: 'var(--green-bg)', border: 'var(--green)',  label: 'Stable' },
  'no-signal': { color: 'var(--text-faint)', bg: 'transparent',     border: 'var(--border)', label: 'No data' },
}

const SEV_STYLE = {
  critical: { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',    label: 'Critical' },
  high:     { color: 'var(--red-text)',   bg: 'var(--red-bg)',   border: 'var(--red)',    label: 'High' },
  medium:   { color: 'var(--amber-text)', bg: 'var(--amber-bg)', border: 'var(--amber)',  label: 'Medium' },
  low:      { color: 'var(--text-faint)', bg: 'transparent',     border: 'var(--border)', label: 'Low' },
}

function timeAgo(isoStr) {
  if (!isoStr) return null
  const diff  = Date.now() - new Date(isoStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (hours < 1)  return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function Sparkline({ values, color = 'var(--text-secondary)', width = 80, height = 28 }) {
  if (!values || values.length < 2) return null
  const min   = Math.min(...values)
  const max   = Math.max(...values)
  const range = max - min || 1
  const pad   = 3
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width  - pad * 2)
    const y = pad + ((max - v) / range)        * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>
    </svg>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function IssueRow({ issue, isLast }) {
  const sev = SEV_STYLE[issue.severity] || SEV_STYLE.medium
  return (
    <div style={{ padding: '13px 16px', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: issue.description ? 6 : 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.3, flex: 1 }}>{issue.title}</div>
        <div style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: sev.color, background: sev.bg, border: `1px solid ${sev.border}`, flexShrink: 0 }}>
          {sev.label}
        </div>
      </div>
      {issue.description && (
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55, marginBottom: issue.recommended ? 8 : 4 }}>{issue.description}</div>
      )}
      {issue.recommended && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '7px 10px', background: C.surface2, borderRadius: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.accentText, flexShrink: 0, marginTop: 2 }}>
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <div style={{ fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5 }}>{issue.recommended}</div>
        </div>
      )}
      {issue.created_at && (
        <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 6 }}>Flagged {timeAgo(issue.created_at)}</div>
      )}
    </div>
  )
}

function RuleRow({ rule, userId, onSaved }) {
  // Empty string = no override (suggestion state). User's value = override state.
  const [localValue, setLocalValue] = useState(rule.isOverridden ? String(rule.userValue) : '')
  const [saving, setSaving]         = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const isSet = localValue !== ''

  const handleBlur = async () => {
    if (localValue === '') {
      // User cleared the field — delete any existing override
      if (rule.isOverridden) await deleteOverride()
      return
    }
    const num = parseFloat(localValue)
    if (isNaN(num) || num < rule.min || num > rule.max) {
      setLocalValue(rule.isOverridden ? String(rule.userValue) : '')
      return
    }
    setSaving(true)
    try {
      const sb    = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      const res   = await fetch('/api/user-rules', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ userId, ruleId: rule.ruleId, areaId: rule.ruleId.split(':')[0], metricKey: rule.metricKey, value: num }),
      })
      if (res.ok) {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
        onSaved?.()
      }
    } catch { /* non-blocking */ }
    setSaving(false)
  }

  const deleteOverride = async () => {
    try {
      const sb    = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      await fetch(`/api/user-rules?userId=${userId}&ruleId=${encodeURIComponent(rule.ruleId)}`, {
        method:  'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setLocalValue('')
      onSaved?.()
    } catch { /* non-blocking */ }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
      background: C.surface,
      border: `1px solid ${isSet ? C.accent : C.border}`,
      borderRadius: 9, transition: 'border-color 0.15s',
    }}>

      {/* Label + live value */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, marginBottom: 3 }}>{rule.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rule.currentValue != null ? (
            <>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                Now: <strong style={{ color: C.text }}>{rule.currentValue}{rule.unit}</strong>
              </span>
              {rule.currentDelta != null && (
                <span style={{ fontSize: 11, color: rule.currentDelta > 0 ? C.redText : C.greenText }}>
                  {rule.currentDelta > 0 ? '↑' : '↓'} {Math.abs(rule.currentDelta).toFixed(1)}
                </span>
              )}
              {rule.sparkline?.length >= 2 && (
                <Sparkline values={rule.sparkline} color={rule.currentDelta > 0 ? 'var(--red)' : 'var(--green)'} width={64} height={22} />
              )}
            </>
          ) : (
            <span style={{ fontSize: 11, color: C.textFaint }}>No data yet</span>
          )}
        </div>
      </div>

      {/* Threshold input + suggestion label */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min={rule.min}
            max={rule.max}
            step="any"
            value={localValue}
            placeholder={String(rule.defaultValue)}
            onChange={e => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            style={{
              width: 72,
              padding: '5px 8px',
              borderRadius: 7,
              border: `1px solid ${isSet ? C.accent : C.border}`,
              background: isSet ? C.surface2 : 'transparent',
              color: isSet ? C.text : C.textFaint,
              fontSize: 13,
              fontWeight: isSet ? 600 : 400,
              textAlign: 'center',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 11.5, color: C.textMuted, minWidth: 32 }}>{rule.unit}</span>
        </div>
        <div style={{ fontSize: 10.5, textAlign: 'right', minHeight: 14 }}>
          {saving && <span style={{ color: C.textFaint }}>Saving…</span>}
          {savedFlash && !saving && <span style={{ color: C.greenText }}>Saved ✓</span>}
          {isSet && !saving && !savedFlash && (
            <button type="button" onClick={deleteOverride}
              style={{ color: C.textFaint, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 10.5 }}>
              Clear
            </button>
          )}
          {!isSet && !saving && !savedFlash && (
            <span style={{ color: C.textFaint, opacity: 0.6 }}>Suggested: {rule.defaultValue} {rule.unit}</span>
          )}
        </div>
      </div>

    </div>
  )
}

function CustomMetricRow({ metric, userId, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const sb    = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      await fetch(`/api/custom-metrics?userId=${userId}&id=${metric.id}`, {
        method:  'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      onDeleted?.()
    } catch { /* non-blocking */ }
    setDeleting(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text }}>{metric.name}</div>
        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>Your metric</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{metric.value}</span>
          {metric.unit && <span style={{ fontSize: 11.5, color: C.textMuted }}>{metric.unit}</span>}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{ fontSize: 10.5, color: C.textFaint, background: 'none', border: 'none', cursor: deleting ? 'not-allowed' : 'pointer', textDecoration: 'underline', padding: 0, opacity: deleting ? 0.5 : 1 }}
        >
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  )
}

function AddCustomMetricForm({ userId, areaId, onAdded }) {
  const [open, setOpen]     = useState(false)
  const [name, setName]     = useState('')
  const [value, setValue]   = useState('')
  const [unit, setUnit]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const reset = () => { setName(''); setValue(''); setUnit(''); setError(''); setOpen(false) }

  const handleSave = async () => {
    if (!name.trim()) { setError('Give this metric a name.'); return }
    if (value === '' || isNaN(Number(value))) { setError('Enter a number.'); return }
    setSaving(true)
    setError('')
    try {
      const sb    = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      const res   = await fetch('/api/custom-metrics', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ userId, area_id: areaId, name: name.trim(), value: Number(value), unit: unit.trim() }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error || 'Failed to save.'); return }
      reset()
      onAdded?.()
    } catch { setError('Something went wrong.') }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: 9, cursor: 'pointer', color: C.textMuted, fontSize: 12.5, fontWeight: 500, width: '100%', transition: 'border-color 0.15s' }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, color: C.textFaint }}>+</span>
        Add your own metric
      </button>
    )
  }

  return (
    <div style={{ padding: '14px 16px', background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 9, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>New custom metric</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {/* Name */}
        <div style={{ flex: '2 1 160px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint }}>Metric name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Response rate"
            maxLength={80}
            style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        {/* Value */}
        <div style={{ flex: '1 1 90px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint }}>Value</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. 95"
            style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }}
          />
        </div>

        {/* Unit */}
        <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint }}>Unit</label>
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="%, hrs…"
            maxLength={20}
            style={{ padding: '7px 10px', borderRadius: 7, border: `1px solid ${C.border}`, background: C.surface2, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
      </div>

      {error && <div style={{ fontSize: 12, color: C.redText }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '7px 18px', borderRadius: 7, background: C.accentLight, border: `1px solid ${C.accent}`, color: C.accentText, fontSize: 12.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}
        >
          {saving ? 'Saving…' : 'Save metric'}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{ padding: '7px 14px', borderRadius: 7, background: 'none', border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  const s = { background: 'var(--surface2)', borderRadius: 8, animation: 'dept-shimmer 1.4s ease-in-out infinite' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes dept-shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
      <div style={{ ...s, height: 56 }} />
      <div style={{ ...s, height: 120 }} />
      <div style={{ ...s, height: 80 }} />
      <div style={{ ...s, height: 200 }} />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DepartmentPage({ areaId, user, navigateSection, view = 'all' }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const meta = AREA_META[areaId] || { name: areaId, role: '', description: '' }

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const res = await fetch(`/api/dept-data?userId=${user.id}&area=${areaId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Could not load department data')
      setData(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id, areaId])

  useEffect(() => { fetchData() }, [fetchData])

  const st = STATUS_STYLE[data?.status] || STATUS_STYLE['no-signal']

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

      {/* Back */}
      <button
        type="button"
        onClick={() => navigateSection?.('cockpit')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.textMuted, fontSize: 13, cursor: 'pointer', padding: 0, width: 'fit-content' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Cockpit
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, marginBottom: 4 }}>{meta.name}</h1>
          <div style={{ fontSize: 13, color: C.textMuted }}>{meta.role} — {meta.description}</div>
        </div>
        {data && (
          <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, flexShrink: 0, letterSpacing: '0.04em' }}>
            {st.label}
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {error && (
        <div style={{ fontSize: 13, color: C.textMuted, padding: '20px 0' }}>
          {error} —{' '}
          <button type="button" onClick={fetchData} style={{ color: C.accentText, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ── Active Issues — shown when view is 'issues' or 'all' ────────── */}
          {(view === 'issues' || view === 'all') && (
            <div>
              <SectionHeader
                title="Active Issues"
                sub={data.issues.length === 0 ? 'No open issues for this department.' : `${data.issues.length} open issue${data.issues.length !== 1 ? 's' : ''} flagged by monitoring.`}
              />
              {data.issues.length > 0 ? (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 380, overflowY: 'auto' }}>
                  {data.issues.map((issue, i) => (
                    <IssueRow key={issue.id} issue={issue} isLast={i === data.issues.length - 1} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '14px 16px', background: C.greenBg, border: `1px solid var(--green)`, borderRadius: 10, fontSize: 13, color: C.greenText }}>
                  No active issues — this department looks healthy.
                </div>
              )}
            </div>
          )}

          {/* ── Metrics & Standards + Custom — shown when view is 'standards' or 'all' */}
          {(view === 'standards' || view === 'all') && (
            <>
              <div>
                <SectionHeader
                  title="Metrics & Your Standards"
                  sub="These thresholds define what 'watch' and 'concerned' mean for your business. Edit any value — the monitoring system uses your number from the next run."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.rules.map(rule => (
                    <RuleRow key={rule.ruleId} rule={rule} userId={user?.id} onSaved={fetchData} />
                  ))}
                </div>
                {!data.has_connector_data && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                    <strong style={{ color: C.text }}>No live data connected.</strong> Metric values will appear once you connect a tool (e.g. HubSpot, Stripe) or run a health check with manual context filled in.
                  </div>
                )}
              </div>

              <div>
                <SectionHeader
                  title="Your Own Metrics"
                  sub="Track anything that matters to your business. These won't affect monitoring scoring — they're your personal signals."
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(data.custom_metrics ?? []).map(m => (
                    <CustomMetricRow key={m.id} metric={m} userId={user?.id} onDeleted={fetchData} />
                  ))}
                  <AddCustomMetricForm userId={user?.id} areaId={areaId} onAdded={fetchData} />
                </div>
              </div>
            </>
          )}

          {data.last_checked && (
            <div style={{ fontSize: 11.5, color: C.textFaint }}>
              Data from health check run {timeAgo(data.last_checked)}. Run a new analysis from the Cockpit to refresh.
            </div>
          )}
        </>
      )}
    </div>
  )
}
