import React, { useEffect, useMemo, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'

const OPERATION_OPTIONS = [
  { id: 'increase-absolute', label: 'Increase by', deltaType: 'absolute', sign: 1 },
  { id: 'decrease-absolute', label: 'Decrease by', deltaType: 'absolute', sign: -1 },
  { id: 'increase-percent', label: 'Increase by %', deltaType: 'percent', sign: 1 },
  { id: 'decrease-percent', label: 'Decrease by %', deltaType: 'percent', sign: -1 },
  { id: 'set', label: 'Set to', deltaType: 'set', sign: 1 },
]

function formatMetricValue(value, unit) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 'No baseline'
  if (unit === 'percent') return `${numeric}%`
  if (unit === 'currency') return `$${numeric.toLocaleString()}`
  if (unit === 'months') return `${numeric} months`
  if (unit === 'days') return `${numeric} days`
  if (unit === 'hours') return `${numeric} hours`
  if (unit === 'ratio') return `${numeric}x`
  return `${numeric}`
}

function formatAreaLabel(areaId) {
  return String(areaId || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatStatusChange(change) {
  if (!change) return ''
  return `${formatAreaLabel(change.areaId)}: ${change.before} -> ${change.after}`
}

function buildScenarioLabel(metricLabel, operation, amount) {
  if (!metricLabel || !operation) return 'Scenario simulation'
  if (operation.deltaType === 'set') {
    return `${operation.label} ${metricLabel} ${amount}`
  }
  const suffix = operation.deltaType === 'percent' ? '%' : ''
  return `${operation.label} ${metricLabel} ${amount}${suffix}`
}

export default function SimulationPage({ userId }) {
  const [metrics, setMetrics] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [selectedMetric, setSelectedMetric] = useState('')
  const [operationId, setOperationId] = useState('increase-absolute')
  const [amount, setAmount] = useState('3')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const selectedMetricMeta = useMemo(
    () => metrics.find((metric) => metric.key === selectedMetric) || null,
    [metrics, selectedMetric]
  )

  const selectedOperation = useMemo(
    () => OPERATION_OPTIONS.find((option) => option.id === operationId) || OPERATION_OPTIONS[0],
    [operationId]
  )

  useEffect(() => {
    let cancelled = false
    setMetricsLoading(true)
    setMetricsError('')

    ;(async () => {
      try {
        const response = await fetch('/api/simulate-metrics')
        const data = await response.json().catch(() => [])
        if (!response.ok) throw new Error(data?.error || 'Could not load simulation metrics.')

        if (!cancelled) {
          const nextMetrics = Array.isArray(data) ? data : []
          setMetrics(nextMetrics)
          if (nextMetrics[0]?.key) setSelectedMetric((current) => current || nextMetrics[0].key)
        }
      } catch (loadError) {
        if (!cancelled) setMetricsError(loadError?.message || 'Could not load simulation metrics.')
      } finally {
        if (!cancelled) setMetricsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const submitScenario = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!userId) {
      setError('Sign in again before running a simulation.')
      return
    }
    if (!selectedMetricMeta) {
      setError('Choose a metric to simulate.')
      return
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount)) {
      setError('Enter a valid number.')
      return
    }

    setLoading(true)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const signedValue = selectedOperation.deltaType === 'set'
        ? numericAmount
        : numericAmount * selectedOperation.sign

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          scenario: {
            metricKey: selectedMetricMeta.key,
            deltaType: selectedOperation.deltaType,
            deltaValue: signedValue,
            label: buildScenarioLabel(selectedMetricMeta.label, selectedOperation, numericAmount),
          },
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Simulation could not be run.')
      }

      setResult(data)
    } catch (submitError) {
      setError(submitError?.message || 'Simulation could not be run.')
    } finally {
      setLoading(false)
    }
  }

  const hasMeaningfulChanges = Boolean(
    result?.delta?.newFindings?.length || result?.delta?.areaStatusChanges?.length
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Scenario Simulator</div>
        <h1 style={styles.title}>Stress-test one metric before it becomes real.</h1>
        <p style={styles.sub}>
          Adjust a live metric, rerun the governance engine, and see what new pressure shows up downstream.
        </p>
      </div>

      <form onSubmit={submitScenario} style={styles.formCard}>
        <div style={styles.fieldGrid}>
          <label style={styles.field}>
            <span style={styles.label}>Metric</span>
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
              style={styles.select}
              disabled={metricsLoading || loading}
            >
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label} · {formatAreaLabel(metric.areaId)}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Scenario</span>
            <select
              value={operationId}
              onChange={(event) => setOperationId(event.target.value)}
              style={styles.select}
              disabled={loading}
            >
              {OPERATION_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Value {selectedMetricMeta?.unit ? `(${selectedMetricMeta.unit})` : ''}
            </span>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              style={styles.input}
              disabled={loading}
            />
          </label>
        </div>

        <div style={styles.formFooter}>
          <div style={styles.metricHint}>
            {metricsLoading
              ? 'Loading metric catalog…'
              : selectedMetricMeta
                ? `${selectedMetricMeta.label} is monitored inside ${formatAreaLabel(selectedMetricMeta.areaId)}.`
                : 'Pick a metric to simulate.'}
          </div>
          <button type="submit" style={styles.runButton} disabled={loading || metricsLoading || !selectedMetric}>
            {loading ? 'Running…' : 'Run simulation'}
          </button>
        </div>

        {metricsError && <div style={styles.error}>{metricsError}</div>}
        {error && <div style={styles.error}>{error}</div>}
      </form>

      {result && (
        <div style={styles.results}>
          <section style={styles.resultCard}>
            <div style={styles.cardEyebrow}>Applied Change</div>
            <div style={styles.patchValue}>
              {selectedMetricMeta?.label || result?.appliedPatch?.metricKey}
            </div>
            <div style={styles.patchMeta}>
              {`${formatMetricValue(result?.appliedPatch?.before, selectedMetricMeta?.unit)} -> ${formatMetricValue(result?.appliedPatch?.after, selectedMetricMeta?.unit)}`}
            </div>
          </section>

          <section style={styles.resultCard}>
            <div style={styles.cardEyebrow}>Projected Cascade</div>
            <div style={styles.narrative}>{result?.cascade?.narrative || 'No cascade narrative returned.'}</div>
          </section>

          <section style={styles.resultCard}>
            <div style={styles.cardEyebrow}>New Risks</div>
            {result?.delta?.newFindings?.length ? (
              <div style={styles.list}>
                {result.delta.newFindings.map((finding, index) => (
                  <div key={`${finding.id || finding.title}-${index}`} style={styles.listRow}>
                    <div style={styles.listTitle}>{finding.title}</div>
                    <div style={styles.listMeta}>
                      {formatAreaLabel(finding.areaId)} · {finding.status || finding.severity || 'signal'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.empty}>No new risks triggered at this level.</div>
            )}
          </section>

          <section style={styles.resultCard}>
            <div style={styles.cardEyebrow}>Area Status Changes</div>
            {result?.delta?.areaStatusChanges?.length ? (
              <div style={styles.list}>
                {result.delta.areaStatusChanges.map((change) => (
                  <div key={change.areaId} style={styles.listRow}>
                    <div style={styles.listTitle}>{formatAreaLabel(change.areaId)}</div>
                    <div style={styles.listMeta}>{formatStatusChange(change)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.empty}>No area status changes surfaced in this scenario.</div>
            )}
          </section>

          {!hasMeaningfulChanges && (
            <section style={styles.resultCard}>
              <div style={styles.cardEyebrow}>Interpretation</div>
              <div style={styles.empty}>No new risks triggered at this level.</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    display: 'grid',
    gap: 20,
  },
  header: {
    display: 'grid',
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--accent-text)',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    lineHeight: 1.1,
    color: 'var(--text)',
  },
  sub: {
    margin: 0,
    maxWidth: 760,
    color: 'var(--text-secondary)',
    fontSize: '0.98rem',
    lineHeight: 1.6,
  },
  formCard: {
    display: 'grid',
    gap: 18,
    padding: 20,
    borderRadius: 20,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    boxShadow: '0 18px 40px -28px rgba(0,0,0,0.45)',
  },
  fieldGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  field: {
    display: 'grid',
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  select: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 14,
    padding: '12px 14px',
    fontFamily: 'inherit',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 14,
    padding: '12px 14px',
    fontFamily: 'inherit',
  },
  formFooter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricHint: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  runButton: {
    border: '1px solid var(--accent)',
    background: 'var(--accent)',
    color: 'var(--bg)',
    borderRadius: 999,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: {
    color: 'var(--red-text)',
    fontSize: 13,
  },
  results: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  resultCard: {
    display: 'grid',
    gap: 10,
    padding: 18,
    borderRadius: 18,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
  },
  cardEyebrow: {
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  patchValue: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  patchMeta: {
    color: 'var(--accent-text)',
    fontSize: 14,
  },
  narrative: {
    color: 'var(--text)',
    fontSize: 15,
    lineHeight: 1.6,
  },
  list: {
    display: 'grid',
    gap: 10,
  },
  listRow: {
    padding: '12px 14px',
    borderRadius: 14,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
  },
  listTitle: {
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 600,
  },
  listMeta: {
    marginTop: 4,
    color: 'var(--text-secondary)',
    fontSize: 12,
    lineHeight: 1.5,
  },
  empty: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    lineHeight: 1.6,
  },
}
