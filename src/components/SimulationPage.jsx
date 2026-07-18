import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import './Foresight.css'

const SYNONYMS = {
  churn_rate: ['churn', 'churn rate', 'customer churn'],
  mrr: ['mrr', 'monthly recurring revenue', 'monthly revenue'],
  pipeline_value: ['pipeline', 'pipeline value'],
  lead_volume: ['leads', 'lead volume'],
  stage_conversion: ['conversion', 'conversion rate'],
  burn_rate: ['burn', 'burn rate'],
  runway_months: ['runway', 'cash runway'],
  csat: ['csat', 'customer satisfaction', 'satisfaction'],
  headcount: ['headcount', 'team size', 'employees'],
}

const SUGGESTION_CATALOG = [
  { key: 'churn_rate', text: 'What if churn reaches 7%?', deltaType: 'set', deltaValue: 7 },
  { key: 'pipeline_value', text: 'What if pipeline drops by 30%?', deltaType: 'percent', deltaValue: -30 },
  { key: 'mrr', text: 'What if MRR grows by 20%?', deltaType: 'percent', deltaValue: 20 },
  { key: 'burn_rate', text: 'What if monthly burn falls by 15%?', deltaType: 'percent', deltaValue: -15 },
  { key: 'runway_months', text: 'What if runway falls to 8 months?', deltaType: 'set', deltaValue: 8 },
  { key: 'csat', text: 'What if CSAT falls to 75?', deltaType: 'set', deltaValue: 75 },
  { key: 'lead_volume', text: 'What if lead volume grows by 25%?', deltaType: 'percent', deltaValue: 25 },
  { key: 'stage_conversion', text: 'What if conversion improves by 10%?', deltaType: 'percent', deltaValue: 10 },
]

function titleCase(value) {
  return String(value || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value, unit) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  if (unit === 'percent') return `${number.toFixed(number % 1 ? 1 : 0)}%`
  if (unit === 'currency') {
    if (Math.abs(number) >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`
    if (Math.abs(number) >= 1_000) return `$${(number / 1_000).toFixed(0)}K`
    return `$${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  if (unit === 'months') return `${number.toFixed(1)} mo`
  if (unit === 'days') return `${number.toFixed(0)} days`
  if (unit === 'hours') return `${number.toFixed(1)} hrs`
  if (unit === 'ratio') return `${number.toFixed(1)}×`
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatDelta(row) {
  if (row?.delta == null) return null
  if (row.unit === 'percent') return `${row.delta > 0 ? '+' : ''}${Number(row.delta).toFixed(1)}pp`
  if (row.deltaPercent != null) return `${row.deltaPercent > 0 ? '+' : ''}${row.deltaPercent}%`
  return `${row.delta > 0 ? '+' : ''}${formatValue(row.delta, row.unit)}`
}

function parseScenario(text, metrics) {
  const clean = text.trim()
  const lower = clean.toLowerCase()
  const ordered = [...metrics].sort((a, b) => String(b.label).length - String(a.label).length)
  let metric = ordered.find((item) => {
    const names = [item.label?.toLowerCase(), item.key?.replace(/_/g, ' '), ...(SYNONYMS[item.key] || [])]
    return names.filter(Boolean).some((name) => lower.includes(name))
  })
  if (!metric) return { error: 'Name a metric in the decision, such as churn, MRR, pipeline, burn, runway, or CSAT.' }

  const valueMatch = clean.match(/-?\d+(?:\.\d+)?/)
  if (!valueMatch) return { error: 'Add the amount you want to test, such as 7%, 20%, or 8 months.' }
  const rawValue = Math.abs(Number(valueMatch[0]))
  if (!Number.isFinite(rawValue)) return { error: 'The scenario amount could not be read.' }

  const isDecrease = /drop|decreas|declin|fall|reduce|cut|lower|lose/.test(lower)
  const isIncrease = /increase|grow|rise|raise|improve|higher|add/.test(lower)
  const explicitTarget = /\bto\b|hits?|reaches?|at\s+\d|falls?\s+to|drops?\s+to/.test(lower)
  const saysBy = /\bby\b/.test(lower)
  let deltaType = explicitTarget ? 'set' : (saysBy || lower.includes('%')) && (isDecrease || isIncrease) ? 'percent' : 'set'
  let deltaValue = rawValue
  if (deltaType === 'percent' && isDecrease) deltaValue = -rawValue
  if (deltaType === 'absolute' && isDecrease) deltaValue = -rawValue

  return {
    scenario: {
      title: clean,
      label: metric.label,
      metricKey: metric.key,
      deltaType,
      deltaValue,
    },
  }
}

async function getAuthHeaders() {
  const supabase = await initSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function EvidenceBadge({ tier }) {
  return <span className={`foresight-evidence ${tier || 'directional'}`}>{titleCase(tier || 'directional')}</span>
}

function EmptyResults() {
  return (
    <div className="foresight-empty">
      <div className="foresight-empty-copy">
        <span className="foresight-kicker">Decision workspace</span>
        <h2>Test the decision before the business feels it.</h2>
        <p>Choose a live metric and Foresight will separate what can be calculated from what can only be estimated or projected directionally.</p>
      </div>
      <div className="foresight-methods">
        <div><EvidenceBadge tier="calculated" /><span>Direct mathematics from measured values.</span></div>
        <div><EvidenceBadge tier="estimated" /><span>Modeled range with explicit assumptions.</span></div>
        <div><EvidenceBadge tier="directional" /><span>Likely pressure without fake precision.</span></div>
      </div>
    </div>
  )
}

function ScenarioComparison({ results, selectedResult, onSelect }) {
  const rows = selectedResult?.comparisonRows || []
  return (
    <div className="foresight-panel foresight-comparison">
      <div className="foresight-panel-head">
        <div>
          <span className="foresight-kicker">Scenario comparison</span>
          <h2>Current position against each choice</h2>
        </div>
        <div className="foresight-legend"><EvidenceBadge tier="calculated" /><EvidenceBadge tier="estimated" /><EvidenceBadge tier="directional" /></div>
      </div>
      <div className="foresight-table-wrap">
        <table className="foresight-table">
          <thead>
            <tr>
              <th>Outcome</th>
              <th>Current</th>
              {results.map((result, index) => (
                <th key={result.id} className={selectedResult?.id === result.id ? 'selected' : ''}>
                  <button type="button" onClick={() => onSelect(result.id)}>
                    <span>Scenario {String.fromCharCode(65 + index)}</span>
                    <small>{selectedResult?.id === result.id ? 'Selected' : 'Compare'}</small>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  <span>{row.label}</span>
                  <small>{row.areaLabel}</small>
                </th>
                <td>{formatValue(row.baseline, row.unit)}</td>
                {results.map((result) => {
                  const scenarioRow = result.comparisonRows?.find((item) => item.key === row.key)
                  const delta = formatDelta(scenarioRow)
                  return (
                    <td key={result.id} className={selectedResult?.id === result.id ? 'selected' : ''}>
                      <span>{scenarioRow?.scenario == null ? 'Directional' : formatValue(scenarioRow.scenario, scenarioRow.unit)}</span>
                      {delta && <small className={scenarioRow.direction}>{delta}</small>}
                      {!delta && scenarioRow && <small className="pressure">Pressure expected</small>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImpactTimeline({ events = [] }) {
  return (
    <div className="foresight-panel foresight-timeline">
      <div className="foresight-panel-head compact">
        <div><span className="foresight-kicker">Impact over time</span><h2>When consequences are likely to surface</h2></div>
      </div>
      <div className="foresight-timeline-track">
        {events.map((event, index) => (
          <div className="foresight-event" key={`${event.horizon}-${index}`}>
            <span className={`foresight-event-dot ${event.tone}`} />
            <strong>{event.horizon}</strong>
            <p>{event.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CausalMap({ result }) {
  const source = result?.comparisonRows?.[0]
  const effects = result?.causalChain || []
  return (
    <div className="foresight-panel foresight-causal">
      <div className="foresight-panel-head">
        <div><span className="foresight-kicker">Causal map</span><h2>How the decision travels through the business</h2></div>
      </div>
      <div className="foresight-chain">
        <div className="foresight-node origin"><small>Decision lever</small><strong>{source?.label || 'Scenario'}</strong></div>
        {effects.length ? effects.map((effect, index) => (
          <React.Fragment key={`${effect.key}-${index}`}>
            <div className="foresight-arrow"><span>→</span><small>{effect.delay || `Hop ${index + 1}`}</small></div>
            <div className="foresight-node"><small>{titleCase(effect.confidence)} confidence</small><strong>{titleCase(effect.key)}</strong><p>{effect.mechanism}</p></div>
          </React.Fragment>
        )) : <p className="foresight-chain-empty">No defensible downstream relationship is available for this metric yet.</p>}
      </div>
    </div>
  )
}

function BriefSection({ icon, title, items, empty }) {
  return (
    <section className="foresight-brief-section">
      <i className={`ti ti-${icon}`} aria-hidden="true" />
      <div><h3>{title}</h3>{items?.length ? items.map((item) => <p key={item}>{item}</p>) : <p className="muted">{empty}</p>}</div>
    </section>
  )
}

function DecisionBrief({ result, saving, saved, onSave, dispatching, dispatched, onDispatch }) {
  const brief = result?.decisionBrief
  if (!brief) return <aside className="foresight-panel foresight-brief empty"><span>Select a scenario to generate its decision brief.</span></aside>
  return (
    <aside className="foresight-panel foresight-brief">
      <div className="foresight-brief-head"><span className="foresight-kicker">Decision brief</span><h2>{brief.verdict}</h2><span className={`foresight-verdict ${brief.tone}`}>{brief.confidence}</span></div>
      <BriefSection icon="trending-up" title="Upside" items={brief.upside} empty="No measured upside crossed a threshold." />
      <BriefSection icon="alert-triangle" title="Downside" items={brief.downside} empty="No new material downside crossed a threshold." />
      <BriefSection icon="building" title="Affected areas" items={brief.affectedAreas} empty="Only the selected metric is affected." />
      <BriefSection icon="clipboard-text" title="Assumptions" items={brief.assumptions} />
      <BriefSection icon="help-circle" title="Missing data" items={brief.missingData} empty="No material data gap was detected for this run." />
      <div className="foresight-brief-actions">
        <button type="button" className="foresight-btn secondary" onClick={onSave} disabled={saving || saved}>
          <i className={`ti ti-${saved ? 'check' : 'bookmark'}`} aria-hidden="true" />{saved ? 'Saved' : saving ? 'Saving…' : 'Save scenario'}
        </button>
        <button type="button" className="foresight-btn primary" disabled={dispatching || dispatched} onClick={onDispatch}>
          <i className={`ti ti-${dispatched ? 'check' : 'send'}`} aria-hidden="true" />{dispatched ? 'Sent to Dispatch' : dispatching ? 'Preparing…' : 'Send to Dispatch'}
        </button>
      </div>
    </aside>
  )
}

export default function SimulationPage({ userId, onOpenDispatch }) {
  const [metrics, setMetrics] = useState([])
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('comparison')
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [savedScenarios, setSavedScenarios] = useState([])
  const [savedOpen, setSavedOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedResultIds, setSavedResultIds] = useState(new Set())
  const [dispatching, setDispatching] = useState(false)
  const [dispatchedResultIds, setDispatchedResultIds] = useState(new Set())
  const composerRef = useRef(null)

  const selectedResult = results.find((result) => result.id === selectedId) || results[0] || null
  const suggestions = useMemo(() => {
    const metricMap = new Map(metrics.map((metric) => [metric.key, metric]))
    const catalog = SUGGESTION_CATALOG
      .filter((item) => metricMap.has(item.key))
      .slice(0, 3)
      .map((item) => ({ ...item, metric: metricMap.get(item.key) }))
    if (catalog.length) return catalog
    return metrics.slice(0, 3).map((metric) => ({
      key: metric.key,
      metric,
      text: `What if ${metric.label} changes by 10%?`,
      deltaType: 'percent',
      deltaValue: 10,
    }))
  }, [metrics])

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    ;(async () => {
      try {
        const headers = await getAuthHeaders()
        const [metricsResponse, savedResponse] = await Promise.all([
          fetch(`/api/simulate-metrics?userId=${encodeURIComponent(userId)}`, { headers, signal: controller.signal }),
          fetch(`/api/foresight-scenarios?userId=${encodeURIComponent(userId)}`, { headers, signal: controller.signal }),
        ])
        if (!metricsResponse.ok) throw new Error('Could not load your business metrics.')
        const metricData = await metricsResponse.json()
        setMetrics(metricData.metrics || [])
        if (savedResponse.ok) {
          const savedData = await savedResponse.json()
          setSavedScenarios(savedData.scenarios || [])
        }
      } catch (requestError) {
        if (requestError?.name !== 'AbortError') setError(requestError?.message || 'Foresight could not load.')
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [userId])

  const executeScenario = async (scenario) => {
    if (!scenario || running) return
    setRunning(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId, scenario }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'The scenario could not be modeled.')
      setResults((current) => {
        if (current.length < 2) return [...current, payload]
        const replaceIndex = Math.max(0, current.findIndex((item) => item.id === selectedId))
        return current.map((item, index) => index === replaceIndex ? payload : item)
      })
      setSelectedId(payload.id)
      setInput(scenario.title || '')
    } catch (requestError) {
      setError(requestError?.message || 'The scenario could not be modeled.')
    } finally {
      setRunning(false)
    }
  }

  const handleRun = () => {
    const parsed = parseScenario(input, metrics)
    if (parsed.error) {
      setError(parsed.error)
      composerRef.current?.focus()
      return
    }
    executeScenario(parsed.scenario)
  }

  const runSuggestion = (suggestion) => {
    setInput(suggestion.text)
    executeScenario({
      title: suggestion.text,
      label: suggestion.metric.label,
      metricKey: suggestion.key,
      deltaType: suggestion.deltaType,
      deltaValue: suggestion.deltaValue,
    })
  }

  const saveScenario = async () => {
    if (!selectedResult || saving) return
    setSaving(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/foresight-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          userId,
          title: selectedResult.title,
          scenario: selectedResult.scenario,
          result: selectedResult,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'The scenario could not be saved.')
      setSavedScenarios((current) => [payload.scenario, ...current])
      setSavedResultIds((current) => new Set([...current, selectedResult.id]))
    } catch (requestError) {
      setError(requestError?.message || 'The scenario could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const sendToDispatch = async () => {
    if (!selectedResult || dispatching) return
    setDispatching(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/dispatch/from-foresight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId, sourceId: selectedResult.id, result: selectedResult }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'The scenario could not be prepared for Dispatch.')
      setDispatchedResultIds((current) => new Set([...current, selectedResult.id]))
      onOpenDispatch?.()
    } catch (requestError) {
      setError(requestError?.message || 'The scenario could not be prepared for Dispatch.')
    } finally {
      setDispatching(false)
    }
  }

  const openSaved = (savedScenario) => {
    const restored = savedScenario.result
    if (!restored?.id) return
    setResults((current) => current.some((item) => item.id === restored.id) ? current : [...current.slice(-1), restored])
    setSelectedId(restored.id)
    setInput(restored.title || savedScenario.title)
    setSavedResultIds((current) => new Set([...current, restored.id]))
    setSavedOpen(false)
  }

  if (loading) return <div className="foresight-status">Loading your business model…</div>

  return (
    <main className="foresight-page">
      <header className="foresight-page-head">
        <div><span className="foresight-kicker accent">Foresight</span><h1>Model a decision before it moves.</h1><p>Compare the likely consequences against your current business position.</p></div>
        <div className="foresight-saved-wrap">
          <button className="foresight-saved-btn" type="button" onClick={() => setSavedOpen((open) => !open)} aria-expanded={savedOpen}>
            <i className="ti ti-folder" aria-hidden="true" />Saved scenarios<span>{savedScenarios.length}</span>
          </button>
          {savedOpen && (
            <div className="foresight-saved-menu">
              <strong>Saved scenarios</strong>
              {savedScenarios.length ? savedScenarios.map((savedScenario) => (
                <button type="button" key={savedScenario.id} onClick={() => openSaved(savedScenario)}>
                  <span>{savedScenario.title}</span><small>{new Date(savedScenario.updated_at).toLocaleDateString()}</small>
                </button>
              )) : <p>No saved scenarios yet.</p>}
            </div>
          )}
        </div>
      </header>

      <section className="foresight-composer" aria-label="Create a scenario">
        <label htmlFor="foresight-input">What decision are you considering?</label>
        <div className="foresight-input-row">
          <textarea
            id="foresight-input"
            ref={composerRef}
            rows="1"
            value={input}
            placeholder="Example: What if churn reaches 7%?"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleRun()
              }
            }}
          />
          <button type="button" className="foresight-run" onClick={handleRun} disabled={running || !input.trim()}>
            {running ? <i className="ti ti-loader-2 spin" aria-hidden="true" /> : <i className="ti ti-chart-line" aria-hidden="true" />}
            {running ? 'Modeling…' : 'Run scenario'}
          </button>
        </div>
        <div className="foresight-suggestions">
          <span>Based on available metrics</span>
          {suggestions.map((suggestion) => <button type="button" key={suggestion.key} onClick={() => runSuggestion(suggestion)} disabled={running}>{suggestion.text}</button>)}
        </div>
        {error && <div className="foresight-error" role="alert"><i className="ti ti-alert-circle" aria-hidden="true" />{error}</div>}
      </section>

      {!selectedResult ? <EmptyResults /> : (
        <div className="foresight-workspace">
          <div className="foresight-main-column">
            <div className="foresight-view-tabs" role="tablist" aria-label="Foresight result view">
              <button type="button" role="tab" aria-selected={view === 'comparison'} onClick={() => setView('comparison')}>Comparison</button>
              <button type="button" role="tab" aria-selected={view === 'causal'} onClick={() => setView('causal')}>Causal map</button>
            </div>
            {view === 'comparison'
              ? <ScenarioComparison results={results} selectedResult={selectedResult} onSelect={setSelectedId} />
              : <CausalMap result={selectedResult} />}
            <ImpactTimeline events={selectedResult.timeline} />
            <p className="foresight-disclaimer">{selectedResult.evidence?.disclaimer}</p>
          </div>
          <DecisionBrief
            result={selectedResult}
            saving={saving}
            saved={savedResultIds.has(selectedResult.id)}
            onSave={saveScenario}
            dispatching={dispatching}
            dispatched={dispatchedResultIds.has(selectedResult.id)}
            onDispatch={sendToDispatch}
          />
        </div>
      )}
    </main>
  )
}
