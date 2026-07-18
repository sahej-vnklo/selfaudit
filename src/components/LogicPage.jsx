import React, { useState, useEffect, useCallback, useRef } from 'react'
import { initSupabase } from '../lib/supabase.js'

const C = {
  text:       'var(--text)',
  textMuted:  'var(--text-muted)',
  textFaint:  'var(--text-faint)',
  border:     'var(--border)',
  surface:    'var(--surface)',
  surface2:   'var(--surface2)',
  green:      'var(--green)',
  greenBg:    'var(--green-bg)',
  greenText:  'var(--green-text)',
  amber:      'var(--amber)',
  amberBg:    'var(--amber-bg)',
  amberText:  'var(--amber-text)',
  red:        'var(--red)',
  accent:     'var(--accent)',
  accentText: 'var(--accent-text)',
}

const DIR_LABEL = {
  'higher-is-better': '↑ higher is better',
  'lower-is-better':  '↓ lower is better',
  'contextual':       '~ contextual',
}

function comparatorLabel(comp) {
  if (comp === 'gt') return 'above'
  if (comp === 'lt') return 'below'
  return comp
}

function thresholdHint(thresholds, unit) {
  const { watch, bad } = thresholds
  const parts = []
  if (watch) parts.push(`watch ${comparatorLabel(watch.comparator)} ${watch.value}${unit ? ' ' + unit : ''}`)
  if (bad)   parts.push(`bad ${comparatorLabel(bad.comparator)} ${bad.value}${unit ? ' ' + unit : ''}`)
  return parts.length ? parts.join(' · ') : null
}

function SavedBadge() {
  return (
    <span style={{ fontSize: 13, color: C.greenText, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 4, padding: '1px 6px', fontWeight: 600, letterSpacing: '0.04em' }}>
      Saved
    </span>
  )
}

function MetricRow({ areaId, metric, userId }) {
  const [val, setVal]       = useState(metric.savedValue != null ? String(metric.savedValue) : '')
  const [saved, setSaved]   = useState(metric.savedValue != null)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState(null)
  const debounceRef         = useRef(null)

  const persist = useCallback(async (rawVal) => {
    const num = parseFloat(rawVal)
    if (isNaN(num)) return
    setSaving(true); setErr(null)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const res = await fetch('/api/custom-metrics', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body:    JSON.stringify({ userId, area_id: areaId, name: metric.key, value: num, unit: metric.unit }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed')
      setSaved(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }, [userId, areaId, metric.key, metric.unit])

  function handleChange(e) {
    const v = e.target.value
    setVal(v)
    setSaved(false)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => persist(v), 800)
  }

  const hint = thresholdHint(metric.thresholds, metric.unit)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', alignItems: 'start', gap: 16, padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{metric.label}</span>
          <span style={{ fontSize: 13, color: C.textFaint, background: C.surface2, borderRadius: 3, padding: '1px 5px' }}>
            {metric.unit}
          </span>
          <span style={{ fontSize: 13, color: C.textFaint }}>{DIR_LABEL[metric.preferredDirection] ?? ''}</span>
        </div>
        {metric.defaultInterpretation && (
          <p style={{ fontSize: 13, color: C.textFaint, margin: '0 0 4px', lineHeight: 1.5 }}>{metric.defaultInterpretation}</p>
        )}
        {hint && (
          <p style={{ fontSize: 13, color: C.amberText, margin: 0 }}>System flags: {hint}</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <input
          type="number"
          value={val}
          onChange={handleChange}
          placeholder="—"
          style={{
            width: '100%',
            padding: '7px 10px',
            fontSize: 14,
            fontWeight: 500,
            color: C.text,
            background: C.surface2,
            border: `1px solid ${val ? C.accent : C.border}`,
            borderRadius: 6,
            outline: 'none',
            textAlign: 'right',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 13, color: C.textFaint, height: 14 }}>
          {saving && 'Saving…'}
          {!saving && saved && <SavedBadge />}
          {!saving && err && <span style={{ color: C.red }}>{err}</span>}
        </div>
      </div>
    </div>
  )
}

function AreaSection({ area, userId }) {
  const filledCount = area.metrics.filter(m => m.savedValue != null).length

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 10, borderBottom: `2px solid ${C.text}`, marginBottom: 4 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>{area.label}</h2>
        <span style={{ fontSize: 13, color: C.textFaint }}>
          {filledCount}/{area.metrics.length} set
        </span>
      </div>
      {area.metrics.map(metric => (
        <MetricRow key={metric.key} areaId={area.id} metric={metric} userId={userId} />
      ))}
    </div>
  )
}

export default function LogicPage({ user }) {
  const [areas, setAreas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    async function load() {
      try {
        const sb = await initSupabase()
        const { data: { session } } = await sb.auth.getSession()
        const tok = session?.access_token || ''

        const res = await fetch(`/api/logic-catalog?userId=${user.id}`, {
          headers: tok ? { Authorization: `Bearer ${tok}` } : {},
        })
        if (!res.ok) throw new Error('Could not load logic catalog')
        const json = await res.json()
        if (!cancelled) setAreas(json.areas ?? [])
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  if (loading) return (
    <div style={{ padding: '40px 32px', color: C.textFaint, fontSize: 13 }}>Loading…</div>
  )

  if (error) return (
    <div style={{ padding: '40px 32px', color: C.textFaint, fontSize: 13 }}>{error}</div>
  )

  if (areas.length === 0) return (
    <div style={{ padding: '40px 32px', maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Logic</h1>
      <p style={{ fontSize: 14, color: C.textFaint, lineHeight: 1.65 }}>
        No areas set up yet. Complete onboarding to select the parts of your business you want to monitor — then come back here to set your numbers.
      </p>
    </div>
  )

  const totalSet   = areas.reduce((n, a) => n + a.metrics.filter(m => m.savedValue != null).length, 0)
  const totalTotal = areas.reduce((n, a) => n + a.metrics.length, 0)

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>Logic</h1>
        <p style={{ fontSize: 13, color: C.textFaint, margin: '0 0 6px', lineHeight: 1.6 }}>
          Set your current numbers. The system uses these as the baseline — so it knows what good and bad looks like for your business, not just in general.
        </p>
        <p style={{ fontSize: 13, color: C.textFaint, margin: 0 }}>
          {totalSet} of {totalTotal} metrics set · changes save automatically
        </p>
      </div>

      {areas.map(area => (
        <AreaSection key={area.id} area={area} userId={user?.id} />
      ))}
    </div>
  )
}
