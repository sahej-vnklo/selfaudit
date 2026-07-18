import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import './Counsel.css'

const STARTERS = [
  'What needs my attention today?',
  'Where is the business losing momentum?',
  'What is the biggest risk to our current goal?',
  'What should I prioritize this week?',
]

async function getSessionToken() {
  const sb = await initSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token || ''
}

function formatSourceTime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function confidenceLabel(value) {
  if (value === 'high') return 'High confidence'
  if (value === 'medium') return 'Medium confidence'
  return 'Low confidence'
}

function resizeComposer(element) {
  if (!element) return
  element.style.height = '34px'
  const nextHeight = Math.min(Math.max(element.scrollHeight, 34), 120)
  element.style.height = `${nextHeight}px`
  element.style.overflowY = element.scrollHeight > 120 ? 'auto' : 'hidden'
}

function SourceList({ sources = [] }) {
  if (!sources.length) return null
  return (
    <div className="counsel-sources" aria-label="Sources checked">
      <span className="counsel-sources-label">Checked</span>
      {sources.map((source) => {
        const freshness = formatSourceTime(source.freshness)
        return (
          <span className="counsel-source" key={source.key} title={freshness ? `Fresh as of ${freshness}` : undefined}>
            <i />
            {source.label}
            {freshness && <small>{freshness}</small>}
          </span>
        )
      })}
    </div>
  )
}

function AssistantMessage({ message, onOpenSentinel, onOpenForesight, onCreateReport, reportLoading }) {
  const data = message.response_data || {}
  const hasDetails = data.root_cause || data.execution_plan?.length || data.evidence?.length || data.missing_data?.length
  const hasSentinelSource = (message.sources || []).some((source) => source.key === 'risk_alerts')

  return (
    <article className="counsel-message counsel-message-assistant">
      <div className="counsel-avatar" aria-hidden="true">C</div>
      <div className="counsel-response">
        <div className="counsel-answer">{message.content}</div>

        {hasDetails && (
          <div className="counsel-analysis">
            {data.root_cause && (
              <section>
                <h3>What this means</h3>
                <p>{data.root_cause}</p>
              </section>
            )}

            {data.execution_plan?.length > 0 && (
              <section>
                <h3>Recommended next moves</h3>
                <ol>
                  {data.execution_plan.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                </ol>
              </section>
            )}

            {data.evidence?.length > 0 && (
              <details>
                <summary>Evidence used</summary>
                <ul>{data.evidence.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
              </details>
            )}

            {(data.assumptions?.length > 0 || data.missing_data?.length > 0) && (
              <details>
                <summary>Assumptions and missing data</summary>
                {data.assumptions?.length > 0 && <ul>{data.assumptions.map((item, index) => <li key={`a-${index}-${item}`}>{item}</li>)}</ul>}
                {data.missing_data?.length > 0 && <ul>{data.missing_data.map((item, index) => <li key={`m-${index}-${item}`}>{item}</li>)}</ul>}
              </details>
            )}
          </div>
        )}

        <SourceList sources={message.sources} />

        {data.confidence && (
          <div className={`counsel-confidence is-${data.confidence}`}>
            <span>{confidenceLabel(data.confidence)}</span>
            {data.missing_data?.length > 0 && <span>· {data.missing_data.length} data gap{data.missing_data.length === 1 ? '' : 's'}</span>}
          </div>
        )}

        <div className="counsel-actions">
          {hasSentinelSource && <button type="button" onClick={onOpenSentinel}>Open supporting signals</button>}
          {data.execution_plan?.length > 0 && <button type="button" onClick={onOpenForesight}>Test in Foresight</button>}
          {data.can_create_report && (
            <button type="button" className="is-primary" disabled={reportLoading} onClick={() => onCreateReport(data.intent === 'goal_pursuit' ? 'goal' : 'auto')}>
              {reportLoading ? 'Creating report…' : data.intent === 'goal_pursuit' ? 'Create goal report' : 'Create report'}
            </button>
          )}
        </div>

        {data.follow_up_question && <div className="counsel-followup">Useful next question: {data.follow_up_question}</div>}
      </div>
    </article>
  )
}

export default function Counsel({ user, onOpenSentinel, onOpenForesight, onCreateReport }) {
  const [messages, setMessages] = useState([])
  const [threads, setThreads] = useState([])
  const [threadId, setThreadId] = useState(null)
  const [newThread, setNewThread] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const historyRequestRef = useRef(0)

  const loadHistory = useCallback(async (requestedThreadId = null) => {
    if (!user?.id) return
    const requestId = historyRequestRef.current + 1
    historyRequestRef.current = requestId
    setHistoryLoading(true)
    setError('')
    try {
      const token = await getSessionToken()
      const params = new URLSearchParams({ userId: user.id })
      if (requestedThreadId) params.set('threadId', requestedThreadId)
      const response = await fetch(`/api/counsel?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load Counsel')
      if (requestId !== historyRequestRef.current) return
      setMessages(data.messages || [])
      setThreads(data.threads || [])
      setThreadId(data.thread?.id || null)
      setNewThread(false)
    } catch (loadError) {
      if (requestId === historyRequestRef.current) setError(loadError.message)
    } finally {
      if (requestId === historyRequestRef.current) setHistoryLoading(false)
    }
  }, [user?.id])

  useEffect(() => { loadHistory() }, [loadHistory])

  useEffect(() => {
    const probe = sessionStorage.getItem('sa_probe_question')
    if (!probe) return
    sessionStorage.removeItem('sa_probe_question')
    setInput(probe)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    if (messages.length > 0 || loading) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length, loading])

  useEffect(() => { resizeComposer(inputRef.current) }, [input])

  const conversationForReport = useMemo(() => messages.map((message) => ({
    role: message.role,
    content: message.role === 'assistant'
      ? [message.content, ...(message.response_data?.execution_plan || [])].join('\n')
      : message.content,
  })), [messages])

  const startNewConversation = () => {
    setMessages([])
    setThreadId(null)
    setNewThread(true)
    setInput('')
    setError('')
    setTimeout(() => inputRef.current?.focus(), 40)
  }

  const submit = async (suggested = null) => {
    const query = String(suggested || input).trim()
    if (!query || loading || !user?.id) return

    const optimistic = { id: `local-${Date.now()}`, role: 'user', content: query, created_at: new Date().toISOString() }
    setMessages((current) => [...current, optimistic])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const token = await getSessionToken()
      const response = await fetch('/api/counsel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id, threadId, newThread, query }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Counsel could not answer')

      setThreadId(data.thread.id)
      setNewThread(false)
      setMessages((current) => [...current, data.message])
      setThreads((current) => {
        const existing = current.filter((thread) => thread.id !== data.thread.id)
        return [{ ...data.thread, updated_at: new Date().toISOString() }, ...existing]
      })
    } catch (submitError) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id))
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (reportKind = 'auto') => {
    if (!onCreateReport || reportLoading) return
    setReportLoading(true)
    try {
      await onCreateReport(conversationForReport, reportKind)
    } catch (reportError) {
      setError(reportError.message || 'Could not create the report')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="counsel-shell">
      <aside className="counsel-history" aria-label="Counsel conversations">
        <div className="counsel-history-head">
          <div>
            <span>Conversations</span>
            <small>Business memory</small>
          </div>
          <button type="button" onClick={startNewConversation} aria-label="New conversation">+</button>
        </div>
        <div className="counsel-thread-list">
          {threads.map((thread) => (
            <button
              type="button"
              key={thread.id}
              className={thread.id === threadId && !newThread ? 'active' : ''}
              onClick={() => loadHistory(thread.id)}
            >
              <span>{thread.title}</span>
              <small>{new Date(thread.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
            </button>
          ))}
          {!historyLoading && threads.length === 0 && <p>Your conversations will stay here.</p>}
        </div>
      </aside>

      <section className="counsel-main">
        <header className="counsel-header">
          <div>
            <span className="counsel-kicker">Counsel</span>
            <h1>Talk to your business.</h1>
            <p>I investigate the relevant data before giving you a view.</p>
          </div>
          <div className="counsel-live"><i /> Connected intelligence</div>
        </header>

        <div className="counsel-conversation">
          {historyLoading ? (
            <div className="counsel-empty">Loading business memory…</div>
          ) : messages.length === 0 ? (
            <div className="counsel-welcome">
              <p>Choose a starting point, or ask anything below.</p>
              <div className="counsel-starters">
                {STARTERS.map((starter) => <button type="button" key={starter} onClick={() => submit(starter)}>{starter}<span>→</span></button>)}
              </div>
            </div>
          ) : (
            messages.map((message) => message.role === 'user' ? (
              <article className="counsel-message counsel-message-user" key={message.id}>
                <div>{message.content}</div>
              </article>
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                onOpenSentinel={onOpenSentinel}
                onOpenForesight={onOpenForesight}
                onCreateReport={createReport}
                reportLoading={reportLoading}
              />
            ))
          )}

          {loading && (
            <div className="counsel-investigating">
              <span><i /><i /><i /></span>
              Investigating the relevant business data…
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <div className="counsel-error">{error}</div>}

        <div className="counsel-composer-wrap">
          <div className="counsel-composer">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              disabled={loading}
              placeholder="Ask anything about your business…"
              onChange={(event) => setInput(event.target.value)}
              onInput={(event) => resizeComposer(event.currentTarget)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
            />
            <button type="button" disabled={!input.trim() || loading} onClick={() => submit()} aria-label="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </div>
          <p>Reads connected data automatically. Any external action still requires your approval.</p>
        </div>
      </section>
    </div>
  )
}
