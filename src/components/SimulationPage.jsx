import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import './Foresight.css'

const SUGGESTION_CATALOG = [
  { key: 'churn_rate', text: 'What if churn reaches 7%?' },
  { key: 'pipeline_value', text: 'What if pipeline drops by 30%?' },
  { key: 'mrr', text: 'What if MRR grows by 20%?' },
  { key: 'burn_rate', text: 'What if monthly burn falls by 15%?' },
  { key: 'runway_months', text: 'What if runway falls to 8 months?' },
  { key: 'csat', text: 'What if CSAT falls to 75?' },
  { key: 'lead_volume', text: 'What if lead volume grows by 25%?' },
  { key: 'stage_conversion', text: 'What if conversion improves by 10%?' },
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

async function getAuthHeaders() {
  const supabase = await initSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function EvidenceBadge({ tier }) {
  return <span className={`foresight-evidence ${tier || 'directional'}`}>{titleCase(tier || 'directional')}</span>
}

function formatObservedAt(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString()
}

function directionCopy(row) {
  if (row?.direction === 'positive') return 'Improvement expected'
  if (row?.direction === 'negative') return 'Adverse direction'
  if (row?.direction === 'mixed') return 'Competing effects'
  return 'Direction unknown'
}

function EmptyResults() {
  return (
    <div className="foresight-empty">
      <div className="foresight-empty-copy">
        <span className="foresight-kicker">Decision workspace</span>
        <h2>Test the decision before the business feels it.</h2>
        <p>State a decision or a metric change. Foresight will separate your assumption from measured facts, calculated effects, estimates, and relationships whose magnitude is still unknown.</p>
      </div>
      <div className="foresight-methods">
        <div><EvidenceBadge tier="assumed" /><span>A change supplied by you, not observed business data.</span></div>
        <div><EvidenceBadge tier="calculated" /><span>Direct mathematics from measured values.</span></div>
        <div><EvidenceBadge tier="estimated" /><span>Modeled range with explicit assumptions.</span></div>
        <div><EvidenceBadge tier="directional" /><span>Defensible direction without invented magnitude.</span></div>
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
        <div className="foresight-legend"><EvidenceBadge tier="assumed" /><EvidenceBadge tier="calculated" /><EvidenceBadge tier="estimated" /><EvidenceBadge tier="directional" /></div>
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
                <td>
                  <span>{formatValue(row.baseline, row.unit)}</span>
                  {row.source && (
                    <small className="foresight-source">
                      {row.source.sourceLabel}{formatObservedAt(row.source.observedAt) ? ` · ${formatObservedAt(row.source.observedAt)}` : ''}
                    </small>
                  )}
                </td>
                {results.map((result) => {
                  const scenarioRow = result.comparisonRows?.find((item) => item.key === row.key)
                  const delta = formatDelta(scenarioRow)
                  return (
                    <td key={result.id} className={selectedResult?.id === result.id ? 'selected' : ''}>
                      <span>{scenarioRow?.scenario == null ? 'Directional' : formatValue(scenarioRow.scenario, scenarioRow.unit)}</span>
                      {delta && <small className={scenarioRow.direction}>{delta}</small>}
                      {!delta && scenarioRow && <small className={scenarioRow.direction || 'unknown'}>{directionCopy(scenarioRow)}</small>}
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
  const graph = result?.causalGraph || { nodes: [], edges: [] }
  const levels = [...new Set((graph.nodes || []).map((node) => node.depth))].sort((a, b) => a - b)
  return (
    <div className="foresight-panel foresight-causal">
      <div className="foresight-panel-head">
        <div><span className="foresight-kicker">Causal map</span><h2>How the decision travels through the business</h2></div>
      </div>
      {levels.length ? (
        <div className="foresight-graph-levels">
          {levels.map((depth) => (
            <div className="foresight-graph-level" key={depth}>
              <span className="foresight-level-label">{depth === 0 ? 'Assumed change' : `Effect level ${depth}`}</span>
              {(graph.nodes || []).filter((node) => node.depth === depth).map((node) => {
                const incoming = (graph.edges || []).filter((edge) => edge.to === node.key)
                return (
                  <div className={`foresight-node ${depth === 0 ? 'origin' : ''}`} key={node.key}>
                    <div className="foresight-node-meta"><EvidenceBadge tier={node.evidenceTier || (depth === 0 ? 'assumed' : 'directional')} /><span>{directionCopy(node)}</span></div>
                    <strong>{node.label || titleCase(node.key)}</strong>
                    {incoming.map((edge) => (
                      <div className="foresight-relation" key={`${edge.from}-${edge.to}`}>
                        <small>From {edge.fromLabel}{edge.delay ? ` · ${edge.delay}` : ''}</small>
                        <p>{edge.effectText}</p>
                        {edge.conditions?.map((condition) => <p className="condition" key={condition}>Condition: {condition}</p>)}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ) : <p className="foresight-chain-empty">No defensible downstream relationship is available for this metric yet.</p>}
    </div>
  )
}

function EvidenceGap({ result }) {
  const missing = result?.decisionBrief?.missingData || []
  return (
    <div className="foresight-panel foresight-gap">
      <span className="foresight-kicker">Evidence boundary</span>
      <h2>No outcome was manufactured.</h2>
      <p>Foresight could not model this decision safely from the facts currently available.</p>
      {missing.length > 0 && <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul>}
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
  const saveDisabled = result?.status === 'insufficient_evidence'
  const dispatchDisabled = saveDisabled || result?.scenario?.mode !== 'decision'
  const confidence = brief.confidence && typeof brief.confidence === 'object'
    ? brief.confidence
    : { overall: brief.confidence || 'unknown' }
  return (
    <aside className="foresight-panel foresight-brief">
      <div className="foresight-brief-head">
        <span className="foresight-kicker">Decision brief</span>
        <h2>{brief.verdict}</h2>
        <div className="foresight-confidence" aria-label="Model confidence">
          {Object.entries(confidence).map(([key, value]) => (
            <span key={key}><small>{titleCase(key)}</small><strong>{titleCase(value)}</strong></span>
          ))}
        </div>
        {brief.condition && <p className="foresight-condition">{brief.condition}</p>}
      </div>
      <BriefSection icon="trending-up" title="Upside" items={brief.upside} empty="No measured upside crossed a threshold." />
      <BriefSection icon="alert-triangle" title="Downside" items={brief.downside} empty="No downside is evidenced by the modeled variables. Unmodeled effects may still exist." />
      <BriefSection icon="building" title="Affected areas" items={brief.affectedAreas} empty="Only the selected metric is affected." />
      <BriefSection icon="clipboard-text" title="Assumptions" items={brief.assumptions} />
      <BriefSection icon="help-circle" title="Missing data" items={brief.missingData} empty="No material data gap was detected for this run." />
      <div className="foresight-brief-actions">
        <button type="button" className="foresight-btn secondary" onClick={onSave} disabled={saveDisabled || saving || saved}>
          <i className={`ti ti-${saved ? 'check' : 'bookmark'}`} aria-hidden="true" />{saved ? 'Saved' : saving ? 'Saving…' : 'Save scenario'}
        </button>
        <button
          type="button"
          className="foresight-btn primary"
          disabled={dispatchDisabled || dispatching || dispatched}
          title={result?.scenario?.mode !== 'decision' ? 'Name the action behind the metric change before sending it to Dispatch.' : ''}
          onClick={onDispatch}
        >
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

  const executeScenario = async (question) => {
    const normalizedQuestion = String(question || '').trim()
    if (!normalizedQuestion || running) return
    setRunning(true)
    setError('')
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId, question: normalizedQuestion }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'The scenario could not be modeled.')
      setResults((current) => {
        if (payload.status === 'insufficient_evidence') return [payload]
        const comparable = current.filter((item) => item.status !== 'insufficient_evidence')
        if (comparable.length < 2) return [...comparable, payload]
        const replaceIndex = Math.max(0, comparable.findIndex((item) => item.id === selectedId))
        return comparable.map((item, index) => index === replaceIndex ? payload : item)
      })
      setSelectedId(payload.id)
      setInput(normalizedQuestion)
    } catch (requestError) {
      setError(requestError?.message || 'The scenario could not be modeled.')
    } finally {
      setRunning(false)
    }
  }

  const handleRun = () => {
    executeScenario(input)
  }

  const runSuggestion = (suggestion) => {
    setInput(suggestion.text)
    executeScenario(suggestion.text)
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
          runId: selectedResult.id,
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
        body: JSON.stringify({ userId, runId: selectedResult.id }),
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
            {selectedResult.status === 'insufficient_evidence'
              ? <EvidenceGap result={selectedResult} />
              : view === 'comparison'
                ? <ScenarioComparison results={results} selectedResult={selectedResult} onSelect={setSelectedId} />
                : <CausalMap result={selectedResult} />}
            {selectedResult.status !== 'insufficient_evidence' && <ImpactTimeline events={selectedResult.timeline} />}
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
