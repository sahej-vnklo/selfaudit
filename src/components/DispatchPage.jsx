import React, { useEffect, useMemo, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import './Dispatch.css'

const STATUS_FILTERS = [
  { id: 'pending', label: 'Needs approval', icon: 'alert-circle' },
  { id: 'ready', label: 'Ready', icon: 'circle-check' },
  { id: 'executing', label: 'In progress', icon: 'clock' },
  { id: 'executed', label: 'Completed', icon: 'circle-check' },
  { id: 'failed', label: 'Failed', icon: 'alert-triangle' },
  { id: 'dismissed', label: 'Rejected', icon: 'circle-x' },
]

const SOURCE_META = {
  sentinel: { label: 'Sentinel', icon: 'shield-check' },
  counsel: { label: 'Counsel', icon: 'message' },
  foresight: { label: 'Foresight', icon: 'chart-line' },
  audit: { label: 'Audit', icon: 'clipboard-data' },
}

const ACTION_INPUTS = {
  EMAIL: { key: 'recipient_email', label: 'Recipient email', placeholder: 'name@example.com' },
  TEAM_BRIEF: { key: 'channel', label: 'Slack channel', placeholder: '#leadership or channel ID' },
  ACTION_PLAN: { key: 'parent_id', label: 'Notion page or database ID', placeholder: 'Paste a Notion parent ID' },
}

function titleCase(value) {
  return String(value || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function timeAgo(value) {
  const time = new Date(value || 0).getTime()
  if (!Number.isFinite(time) || time <= 0) return 'Recently prepared'
  const minutes = Math.max(1, Math.floor((Date.now() - time) / 60_000))
  if (minutes < 60) return `Prepared ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Prepared ${hours}h ago`
  return `Prepared ${Math.floor(hours / 24)}d ago`
}

function statusLabel(status) {
  return STATUS_FILTERS.find((item) => item.id === status)?.label || titleCase(status)
}

function packagePreview(action) {
  const artifact = action?.artifact?.artifact_data
  const sections = Array.isArray(artifact?.sections) ? artifact.sections : []
  if (action?.action_type === 'TEAM_BRIEF') {
    return sections.map((section) => `${section.label}\n${section.content}`).join('\n\n')
  }
  if (action?.action_type === 'EMAIL') {
    return sections.find((section) => section.label === 'Body')?.content || artifact?.summary || action?.objective || ''
  }
  return sections.map((section) => `## ${section.label}\n${section.content}`).join('\n\n')
}

function sourceFor(action) {
  const key = String(action?.source_type || 'audit').toLowerCase()
  return { key, ...(SOURCE_META[key] || SOURCE_META.audit), label: action?.source_label || SOURCE_META[key]?.label || 'SelfAudit' }
}

function connectorLabel(connector) {
  if (!connector) return 'Workspace'
  return connector === 'gmail' ? 'Gmail' : titleCase(connector)
}

function QueueFilters({ packages, status, source, onStatus, onSource }) {
  return (
    <aside className="dispatch-queue" aria-label="Dispatch queue filters">
      <h2>Queue</h2>
      <div className="dispatch-filter-list">
        <button type="button" className={!status ? 'active' : ''} onClick={() => onStatus('')}>
          <i className="ti ti-list" aria-hidden="true" /><span>All packages</span><b>{packages.length}</b>
        </button>
        {STATUS_FILTERS.map((item) => {
          const count = packages.filter((action) => action.status === item.id).length
          return (
            <button type="button" key={item.id} className={status === item.id ? 'active' : ''} onClick={() => onStatus(item.id)}>
              <i className={`ti ti-${item.icon}`} aria-hidden="true" /><span>{item.label}</span><b>{count}</b>
            </button>
          )
        })}
      </div>
      <div className="dispatch-filter-divider" />
      <h3>Sources</h3>
      <div className="dispatch-filter-list sources">
        {Object.entries(SOURCE_META).map(([key, item]) => (
          <button type="button" key={key} className={source === key ? 'active' : ''} onClick={() => onSource(source === key ? '' : key)}>
            <i className={`ti ti-${item.icon}`} aria-hidden="true" /><span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function PackageCard({ action, selected, onSelect }) {
  const source = sourceFor(action)
  return (
    <button type="button" className={`dispatch-package${selected ? ' selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <div className="dispatch-package-top">
        <span className={`dispatch-source ${source.key}`}><i className={`ti ti-${source.icon}`} aria-hidden="true" />{source.label}</span>
        <span className={`dispatch-status ${action.status}`}>{statusLabel(action.status)}</span>
      </div>
      <strong>{action.title || 'Prepared action'}</strong>
      <p>{action.objective || 'Review the prepared work and approval boundary.'}</p>
      <div className="dispatch-package-meta">
        <span className={`priority ${action.priority || 'medium'}`}>{titleCase(action.priority || 'medium')}</span>
        <span>{action.owner_label || 'Operator'}</span>
        <span>{timeAgo(action.source_created_at || action.created_at)}</span>
      </div>
      <div className="dispatch-destinations">
        <span><i className="ti ti-plug-connected" aria-hidden="true" />{connectorLabel(action.connector)}</span>
        {action.artifact_bundle?.[0]?.type && <span><i className="ti ti-file-text" aria-hidden="true" />{titleCase(action.artifact_bundle[0].type)}</span>}
      </div>
    </button>
  )
}

function PackageList({ packages, selectedId, onSelect }) {
  return (
    <section className="dispatch-packages" aria-label="Action packages">
      <div className="dispatch-column-head"><h2>Action packages</h2><span>{packages.length}</span></div>
      <div className="dispatch-package-list">
        {packages.length ? packages.map((action) => (
          <PackageCard key={action.id} action={action} selected={selectedId === action.id} onSelect={() => onSelect(action.id)} />
        )) : (
          <div className="dispatch-empty-column">
            <i className="ti ti-inbox" aria-hidden="true" />
            <strong>No packages in this view</strong>
            <p>Prepared work from Sentinel, Counsel, Foresight, and audits will appear here.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function DetailSection({ label, children }) {
  return <section className="dispatch-detail-section"><h3>{label}</h3>{children}</section>
}

function ActionDetail({ action, userId, onResolved }) {
  const [destination, setDestination] = useState('')
  const [preview, setPreview] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const actionInput = ACTION_INPUTS[action?.action_type]

  useEffect(() => {
    setDestination(actionInput ? String(action?.staged_args?.[actionInput.key] || '') : '')
    setPreview(packagePreview(action))
    setEditing(false)
    setError('')
  }, [action?.id, action?.staged_args, actionInput])

  if (!action) {
    return <aside className="dispatch-detail empty"><i className="ti ti-pointer" aria-hidden="true" /><p>Select an action package to review its evidence and approval boundary.</p></aside>
  }

  const source = sourceFor(action)
  const artifact = action.artifact?.artifact_data
  const sections = Array.isArray(artifact?.sections) ? artifact.sections : []
  const canResolve = action.status === 'pending'

  async function resolve(decision) {
    if (!canResolve || busy) return
    setBusy(decision)
    setError('')
    try {
      const supabase = await initSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      const finalArgs = {}
      if (decision === 'approve' && actionInput) finalArgs[actionInput.key] = destination.trim()
      if (decision === 'approve' && editing) {
        if (action.action_type === 'ACTION_PLAN') finalArgs.markdown = preview
        if (action.action_type === 'TEAM_BRIEF') finalArgs.markdown_text = preview
        if (action.action_type === 'EMAIL') finalArgs.body = preview
      }
      const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ userId, pendingActionId: action.id, decision, finalArgs }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not resolve this action package.')
      await onResolved?.()
    } catch (requestError) {
      setError(requestError?.message || 'Could not resolve this action package.')
    } finally {
      setBusy('')
    }
  }

  return (
    <aside className="dispatch-detail" aria-label="Selected action summary">
      <div className="dispatch-detail-head">
        <div><span className={`dispatch-source ${source.key}`}><i className={`ti ti-${source.icon}`} aria-hidden="true" />{source.label}</span><h2>Action summary</h2></div>
        <span className={`dispatch-status ${action.status}`}>{statusLabel(action.status)}</span>
      </div>
      <div className="dispatch-detail-scroll">
        <DetailSection label="Objective"><p className="dispatch-objective">{action.objective || action.title}</p></DetailSection>
        <DetailSection label="Evidence">
          {action.evidence_snapshot?.length ? <div className="dispatch-evidence">{action.evidence_snapshot.map((item, index) => <div key={`${item.label}-${index}`}><span>{item.label}</span><strong>{String(item.value ?? '—')}</strong></div>)}</div> : <p className="muted">The package is grounded in its source report and prepared artifact.</p>}
        </DetailSection>
        <DetailSection label="Prepared work">
          <div className="dispatch-artifacts">
            {(action.artifact_bundle?.length ? action.artifact_bundle : [{ type: action.action_type, title: artifact?.title || action.title }]).map((item, index) => (
              <details key={`${item.type}-${index}`}>
                <summary><i className="ti ti-file-text" aria-hidden="true" /><span>{item.title || titleCase(item.type)}</span><small>{titleCase(item.type)}</small></summary>
                {sections.length > 0 && <div>{sections.map((section) => <p key={section.label}><strong>{section.label}</strong>{section.content}</p>)}</div>}
              </details>
            ))}
          </div>
        </DetailSection>
        <DetailSection label="Owner / destination">
          <p>{action.owner_label || 'Operator'} <span>·</span> {action.destination_label || connectorLabel(action.connector)}</p>
          {canResolve && actionInput && <label className="dispatch-destination">{actionInput.label}<input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={actionInput.placeholder} /></label>}
        </DetailSection>
        <DetailSection label="Approval boundary"><p>{action.approval_boundary}</p></DetailSection>
        <DetailSection label="Outbound summary (preview)">
          {editing ? <textarea className="dispatch-preview editable" value={preview} onChange={(event) => setPreview(event.target.value)} aria-label="Edit outbound package" /> : <pre className="dispatch-preview">{preview || action.objective}</pre>}
        </DetailSection>
        {error && <div className="dispatch-error" role="alert"><i className="ti ti-alert-circle" aria-hidden="true" />{error}</div>}
      </div>
      <div className="dispatch-detail-actions">
        {canResolve ? (
          <>
            <button type="button" className="reject" onClick={() => resolve('dismiss')} disabled={!!busy}>{busy === 'dismiss' ? 'Rejecting…' : 'Reject'}</button>
            <button type="button" onClick={() => setEditing((value) => !value)} disabled={!!busy}>{editing ? 'Keep changes' : 'Edit package'}</button>
            <button type="button" className="approve" onClick={() => resolve('approve')} disabled={!!busy || (actionInput && !destination.trim())}>{busy === 'approve' ? 'Dispatching…' : 'Approve & dispatch'}</button>
          </>
        ) : <div className="dispatch-resolved-note"><i className="ti ti-history" aria-hidden="true" />This package is {statusLabel(action.status).toLowerCase()} and preserved in the execution record.</div>}
      </div>
    </aside>
  )
}

export default function DispatchPage({ userId, actionFeed, loading, onRefresh }) {
  const packages = Array.isArray(actionFeed?.packages) ? actionFeed.packages : (actionFeed?.pending || [])
  const [status, setStatus] = useState('pending')
  const [source, setSource] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(() => packages.filter((action) => {
    if (status && action.status !== status) return false
    if (source && sourceFor(action).key !== source) return false
    return true
  }), [packages, source, status])

  const selected = filtered.find((action) => action.id === selectedId) || filtered[0] || null

  useEffect(() => {
    if (selectedId && filtered.some((action) => action.id === selectedId)) return
    setSelectedId(filtered[0]?.id || null)
  }, [filtered, selectedId])

  if (loading) return <div className="dispatch-loading"><i className="ti ti-loader-2 spin" aria-hidden="true" />Preparing the execution queue…</div>

  return (
    <main className="dispatch-page">
      <header className="dispatch-page-head">
        <div><span>Dispatch</span><h1>Turn decisions into controlled execution.</h1><p>Review, approve, and track every action before it reaches the business.</p></div>
        <button type="button" onClick={onRefresh}><i className="ti ti-refresh" aria-hidden="true" />Refresh</button>
      </header>
      <div className="dispatch-status-strip">
        {STATUS_FILTERS.slice(0, 4).map((item) => <button type="button" key={item.id} className={status === item.id ? 'active' : ''} onClick={() => setStatus(item.id)}><span>{item.label}</span><strong>{packages.filter((action) => action.status === item.id).length}</strong></button>)}
      </div>
      <div className="dispatch-workspace">
        <QueueFilters packages={packages} status={status} source={source} onStatus={setStatus} onSource={setSource} />
        <PackageList packages={filtered} selectedId={selected?.id} onSelect={setSelectedId} />
        <ActionDetail action={selected} userId={userId} onResolved={onRefresh} />
      </div>
    </main>
  )
}
