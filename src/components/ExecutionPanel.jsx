import React, { useEffect, useMemo, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'

const THEMES = {
  dark: {
    bg: '#060303',
    surface: '#0F0909',
    border: '#2E211F',
    text: '#F3ECE6',
    textSoft: '#D2BCB5',
    textMuted: '#A88D85',
    accent: '#B79A92',
    accentSoft: '#1D1514',
    inputBg: '#1D1514',
    error: '#C05050',
    buttonText: '#F3ECE6',
    buttonTextSoft: '#D2BCB5',
    buttonBorder: '#B79A92',
  },
  light: {
    bg: '#F5F0EA',
    surface: '#EFE7DF',
    border: '#D9C9BE',
    text: '#261B19',
    textSoft: '#6E5B55',
    textMuted: '#8A746D',
    accent: '#A98D86',
    accentSoft: '#E8DDD3',
    inputBg: '#E8DDD3',
    error: '#8C2A2A',
    buttonText: '#FBF7F2',
    buttonTextSoft: '#FBF7F2',
    buttonBorder: '#FBF7F2',
  },
  sharp: {
    bg: '#0F2239',
    surface: '#132C49',
    border: '#2D4E72',
    text: '#F4F7FC',
    textSoft: '#D8E2F1',
    textMuted: '#A9BCD5',
    accent: '#3A73EA',
    accentSoft: '#193857',
    inputBg: '#193857',
    error: '#C07878',
    buttonText: '#F4F7FC',
    buttonTextSoft: '#D8E2F1',
    buttonBorder: '#3A73EA',
  },
}

function getThemeVars(theme) {
  const C = THEMES[theme] || THEMES.dark
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--border': C.border,
    '--text': C.text,
    '--text-soft': C.textSoft,
    '--text-muted': C.textMuted,
    '--accent': C.accent,
    '--accent-soft': C.accentSoft,
    '--input-bg': C.inputBg,
    '--error': C.error,
    '--button-text': C.buttonText,
    '--button-text-soft': C.buttonTextSoft,
    '--button-border': C.buttonBorder,
  }
}

const ARTIFACT_TYPES = ['ACTION_PLAN', 'SOP', 'PROCESS_CHANGE', 'PRICING_MODEL', 'HIRING_BRIEF', 'EMAIL']

const ARTIFACT_LABELS = {
  ACTION_PLAN:    'Action Plan',
  SOP:            'Standard SOP',
  PROCESS_CHANGE: 'Process Redesign',
  PRICING_MODEL:  'Pricing Model',
  HIRING_BRIEF:   'Hiring Brief',
  EMAIL:          'Email Draft',
}

function parseReportPayload(report) {
  if (!report) return null
  if (report.report_data && typeof report.report_data === 'object') return report.report_data
  if (report.content) {
    try {
      return typeof report.content === 'string' ? JSON.parse(report.content) : report.content
    } catch {
      return null
    }
  }
  if (typeof report === 'object') return report
  return null
}

function isActionableReport(report) {
  const parsed = parseReportPayload(report)
  if (!parsed) return false
  const mode = parsed.report_family === 'GOAL' || parsed.conversation_mode === 'GOAL_GAP'
    ? 'GOAL_GAP'
    : (parsed.conversation_mode || report?.conversation_mode || 'DIAGNOSTIC')
  return mode === 'DIAGNOSTIC' || mode === 'GOAL_GAP' || mode === 'EXECUTION'
}

function formatAuditOptionLabel(report) {
  const date = report?.created_at
    ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Latest'
  const title = report?.headline || report?.title || 'Audit'
  return `${date} — ${title}`
}

function buildScopedUserInfo(userInfo, report, parsedReport) {
  return {
    ...userInfo,
    industry: report?.industry || userInfo?.industry || '',
    domain: report?.domain || userInfo?.domain || '',
    goalMode: parsedReport?.report_family === 'GOAL' || parsedReport?.conversation_mode === 'GOAL_GAP',
    goal: parsedReport?.goal_gap_analysis?.goal || userInfo?.goal || '',
    goalTimeline: parsedReport?.timeline_feasibility || parsedReport?.goal_gap_analysis?.realistic_timeline || userInfo?.goalTimeline || '',
  }
}

export default function ExecutionPanel({ report, reports = [], userInfo, variant = 'report' }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const reportOptions = useMemo(() => {
    const fromList = Array.isArray(reports) ? reports.filter(isActionableReport) : []
    if (fromList.length > 0) return fromList
    return report && isActionableReport(report) ? [report] : []
  }, [report, reports])

  const [selectedReportId, setSelectedReportId] = useState(() => reportOptions[0]?.id ?? null)
  const [selectedType, setSelectedType]   = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [loadingSaved, setLoadingSaved]   = useState(false)
  const [currentArtifact, setCurrentArtifact] = useState(null)
  const [pastArtifacts, setPastArtifacts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [expandedPast, setExpandedPast]   = useState({})
  const [copyState, setCopyState]         = useState({})
  const [error, setError]                 = useState(null)

  useEffect(() => {
    if (reportOptions.some((item) => item.id === selectedReportId)) return
    setSelectedReportId(reportOptions[0]?.id ?? null)
  }, [reportOptions, selectedReportId])

  const activeReport = useMemo(() => (
    reportOptions.find((item) => item.id === selectedReportId)
    || reportOptions[0]
    || null
  ), [reportOptions, selectedReportId])

  const parsedReport = useMemo(() => parseReportPayload(activeReport), [activeReport])
  const scopedUserInfo = useMemo(
    () => buildScopedUserInfo(userInfo, activeReport, parsedReport),
    [userInfo, activeReport, parsedReport]
  )

  useEffect(() => {
    let cancelled = false

    async function loadPanelState() {
      if (!parsedReport) {
        setRecommendations([])
        setSelectedType(null)
        setCurrentArtifact(null)
        setPastArtifacts([])
        return
      }

      setError(null)
      setLoadingSaved(true)

      try {
        const [recommendationResponse, savedArtifactsResponse] = await Promise.all([
          fetch('/api/generate-artifact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report: parsedReport, userInfo: scopedUserInfo }),
          }).then(async (response) => response.ok ? response.json() : { recommendations: { recommended: [] } }),
          scopedUserInfo?.userId && activeReport?.id
            ? initSupabase().then((sb) => sb
              .from('artifacts')
              .select('id, artifact_type, artifact_data, created_at')
              .eq('user_id', scopedUserInfo.userId)
              .eq('report_id', activeReport.id)
              .order('created_at', { ascending: false })
            )
            : Promise.resolve({ data: [] }),
        ])

        if (cancelled) return

        const recommended = recommendationResponse?.recommendations?.recommended ?? []
        setRecommendations(recommended)
        setSelectedType((prev) => (prev && ARTIFACT_TYPES.includes(prev) ? prev : (recommended[0] || null)))

        const rows = savedArtifactsResponse?.data ?? []
        const hydratedArtifacts = rows
          .map((row) => {
            const payload = row.artifact_data && typeof row.artifact_data === 'object' ? row.artifact_data : null
            if (!payload) return null
            return {
              ...payload,
              type: payload.type || row.artifact_type,
              _artifactId: row.id,
              _createdAt: row.created_at,
            }
          })
          .filter(Boolean)

        setCurrentArtifact(hydratedArtifacts[0] || null)
        setPastArtifacts(hydratedArtifacts.slice(1))
        setExpandedPast({})
      } catch {
        if (!cancelled) {
          setRecommendations([])
          setCurrentArtifact(null)
          setPastArtifacts([])
        }
      } finally {
        if (!cancelled) setLoadingSaved(false)
      }
    }

    loadPanelState()

    return () => {
      cancelled = true
    }
  }, [activeReport, parsedReport, scopedUserInfo])

  const handleGenerate = async () => {
    if (!selectedType || generating || !parsedReport) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: selectedType,
          report: parsedReport,
          userInfo: scopedUserInfo,
          userId: scopedUserInfo?.userId ?? null,
          reportId: activeReport?.id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (currentArtifact) {
        setPastArtifacts(prev => [currentArtifact, ...prev])
        setExpandedPast(prev => {
          const shifted = {}
          Object.entries(prev).forEach(([k, v]) => { shifted[parseInt(k) + 1] = v })
          return shifted
        })
      }
      setCurrentArtifact(data.artifact)
      if (data.recommendations?.recommended?.length) {
        setRecommendations(data.recommendations.recommended)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopySection = (key, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyState(prev => ({ ...prev, [key]: 'copied' }))
      setTimeout(() => setCopyState(prev => ({ ...prev, [key]: 'idle' })), 2000)
    }).catch(() => {})
  }

  const handleCopyAll = (artifact, key) => {
    const lines = [artifact.title, artifact.summary, '']
    artifact.sections.forEach(s => {
      lines.push(`[${s.label.toUpperCase()}]`)
      lines.push(s.content)
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n').trimEnd()).then(() => {
      setCopyState(prev => ({ ...prev, [key]: 'copied' }))
      setTimeout(() => setCopyState(prev => ({ ...prev, [key]: 'idle' })), 2000)
    }).catch(() => {})
  }

  const isGenerateDisabled = !selectedType || generating || !parsedReport

  if (!parsedReport) {
    return (
      <div style={{ ...themeVars, ...(variant === 'dashboard' ? ep.cardWrapper : ep.wrapper) }} data-pdf-hide>
        <div style={ep.header}>
          <h2 style={ep.sectionTitle}>Turn This Into Action</h2>
          <p style={ep.subtitle}>Run a diagnostic report to generate ready-to-use outputs from real findings.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...themeVars, ...(variant === 'dashboard' ? ep.cardWrapper : ep.wrapper) }} data-pdf-hide>
      <div style={ep.header}>
        <h2 style={ep.sectionTitle}>Turn This Into Action</h2>
        <p style={ep.subtitle}>Generate ready-to-use outputs from your audit findings.</p>
      </div>

      {reportOptions.length > 1 && (
        <div style={ep.scopeRow}>
          <span style={ep.scopeLabel}>Generating from</span>
          <select
            value={activeReport?.id ?? ''}
            onChange={(event) => setSelectedReportId(event.target.value)}
            style={ep.scopeSelect}
            disabled={generating}
          >
            {reportOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {formatAuditOptionLabel(item)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={ep.pillRow}>
        {ARTIFACT_TYPES.map(type => {
          const isSelected = selectedType === type
          const isRec = recommendations.includes(type)
          return (
            <button
              key={type}
              style={{
                ...ep.pill,
                ...(isSelected ? ep.pillSelected : {}),
                ...(generating ? ep.pillDisabled : {}),
              }}
              onClick={() => !generating && setSelectedType(type)}
            >
              {ARTIFACT_LABELS[type]}
              {isRec && <span style={ep.recBadge}>Recommended</span>}
            </button>
          )
        })}
      </div>

      <button
        style={{ ...ep.generateBtn, ...(isGenerateDisabled ? ep.generateBtnDisabled : {}) }}
        onClick={handleGenerate}
        disabled={isGenerateDisabled}
      >
        {generating ? (
          <span style={ep.generateBtnInner}>
            <span style={ep.spinner} />
            Generating...
          </span>
        ) : (
          `Generate ${selectedType ? ARTIFACT_LABELS[selectedType] : '...'}`
        )}
      </button>

      {loadingSaved && <p style={ep.helperText}>Loading saved outputs for this audit…</p>}
      {error && <p style={ep.errorMsg}>{error}</p>}

      {currentArtifact && (
        <div style={ep.artifactPanel}>
          <ArtifactContent
            artifact={currentArtifact}
            copyKey="cur"
            copyState={copyState}
            onCopySection={handleCopySection}
            onCopyAll={handleCopyAll}
          />
        </div>
      )}

      {pastArtifacts.length > 0 && (
        <div style={ep.pastList}>
          {pastArtifacts.map((a, i) => (
            <div key={i} style={ep.pastCard}>
              <div
                style={ep.pastCardHeader}
                onClick={() => setExpandedPast(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <div style={ep.pastCardLeft}>
                  <span style={ep.pastTypeBadge}>{ARTIFACT_LABELS[a.type] ?? a.type}</span>
                  <span style={ep.pastTitle}>{a.title}</span>
                </div>
                <span style={ep.expandIcon}>{expandedPast[i] ? '▲' : '▼'}</span>
              </div>
              {expandedPast[i] && (
                <div style={ep.pastExpanded}>
                  <ArtifactContent
                    artifact={a}
                    copyKey={`past-${i}`}
                    copyState={copyState}
                    onCopySection={handleCopySection}
                    onCopyAll={handleCopyAll}
                    compact
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactContent({ artifact, copyKey, copyState, onCopySection, onCopyAll, compact }) {
  const copyAllKey = `${copyKey}-all`
  return (
    <>
      <div style={{ ...ep.artifactHeader, ...(compact ? ep.artifactHeaderCompact : {}) }}>
        <div style={ep.artifactTitleGroup}>
          <div style={ep.artifactTitle}>{artifact.title}</div>
          {artifact.summary && <div style={ep.artifactSummary}>{artifact.summary}</div>}
        </div>
        <button
          style={ep.copyAllBtn}
          onClick={() => onCopyAll(artifact, copyAllKey)}
        >
          {copyState[copyAllKey] === 'copied' ? '✓ Copied' : 'Copy All'}
        </button>
      </div>
      {(artifact.sections ?? []).map((s, i) => {
        const sKey = `${copyKey}-s${i}`
        const isLast = i === artifact.sections.length - 1
        return (
          <div key={i} style={isLast ? ep.sectionCardLast : ep.sectionCard}>
            <div style={ep.sectionCardHeader}>
              <span style={ep.sectionLabel}>{s.label}</span>
              <button
                style={ep.copySectionBtn}
                onClick={() => onCopySection(sKey, s.content)}
              >
                {copyState[sKey] === 'copied' ? '✓' : 'Copy'}
              </button>
            </div>
            <div style={ep.sectionContent}>{s.content}</div>
          </div>
        )
      })}
    </>
  )
}

const ep = {
  wrapper: {
    marginTop: '2.5rem',
    paddingTop: '2.5rem',
    borderTop: '0.5px solid var(--border)',
    marginBottom: '2.5rem',
  },
  cardWrapper: {
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    borderRadius: 8,
    padding: 14,
  },
  header: { marginBottom: '1.25rem' },
  sectionTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--text-muted)', marginBottom: '0.375rem', fontWeight: 500,
  },
  subtitle: {
    fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0,
  },
  scopeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  scopeLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  scopeSelect: {
    minWidth: 240,
    maxWidth: '100%',
    background: 'var(--input-bg)',
    border: '0.5px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  pillRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem',
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text-soft)',
    transition: 'border-color 0.1s, background 0.1s, color 0.1s',
    lineHeight: 1,
  },
  pillSelected: {
    border: '1.5px solid var(--accent)',
    background: 'var(--accent)', color: 'var(--button-text)',
  },
  pillDisabled: {
    cursor: 'not-allowed', opacity: 0.55,
  },
  recBadge: {
    fontSize: 10, fontWeight: 600,
    color: 'var(--accent)',
    letterSpacing: '0.2px',
  },
  generateBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--accent)', color: 'var(--button-text)',
    fontSize: 14, fontWeight: 500,
    padding: '10px 20px',
    borderRadius: 'var(--radius)', border: 'none',
    cursor: 'pointer', minWidth: 160,
    transition: 'background 0.15s',
  },
  generateBtnDisabled: {
    background: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed',
  },
  generateBtnInner: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid var(--button-border)',
    borderTopColor: 'var(--button-text)',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  errorMsg: {
    fontSize: 12, color: 'var(--error)', marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 8,
  },
  artifactPanel: {
    marginTop: '1.25rem',
    border: '1.5px solid var(--accent)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  artifactHeader: {
    background: 'var(--accent)',
    padding: '14px 18px',
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12,
  },
  artifactHeaderCompact: {
    background: 'var(--accent-soft)',
    borderBottom: '0.5px solid var(--border)',
  },
  artifactTitleGroup: { flex: 1, minWidth: 0 },
  artifactTitle: {
    fontSize: 14, fontWeight: 500, color: 'var(--button-text)',
    lineHeight: 1.4, marginBottom: 4,
  },
  artifactSummary: {
    fontSize: 12, color: 'var(--button-text-soft)',
    fontStyle: 'italic', lineHeight: 1.5,
  },
  copyAllBtn: {
    flexShrink: 0,
    fontSize: 11, fontWeight: 500, color: 'var(--button-text)',
    background: 'var(--accent-soft)',
    border: '1px solid var(--button-border)',
    borderRadius: 'var(--radius-sm)', padding: '5px 10px',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  sectionCard: {
    padding: '14px 18px',
    borderBottom: '0.5px solid var(--border)',
    background: 'var(--surface)',
  },
  sectionCardLast: {
    padding: '14px 18px',
    background: 'var(--surface)',
  },
  sectionCardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  copySectionBtn: {
    fontSize: 11, color: 'var(--text-muted)',
    background: 'none',
    border: '0.5px solid var(--border)',
    borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
    flexShrink: 0,
  },
  sectionContent: {
    fontSize: 13, color: 'var(--text)', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', margin: 0,
  },
  pastList: {
    marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8,
  },
  pastCard: {
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  pastCardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px', cursor: 'pointer',
    userSelect: 'none',
  },
  pastCardLeft: {
    display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
  },
  pastTypeBadge: {
    fontSize: 10, fontWeight: 600, color: 'var(--accent)',
    background: 'var(--accent-soft)',
    borderRadius: 4, padding: '2px 7px',
    letterSpacing: '0.2px', flexShrink: 0,
  },
  pastTitle: {
    fontSize: 13, fontWeight: 500, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  expandIcon: {
    fontSize: 9, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8,
  },
  pastExpanded: {
    borderTop: '0.5px solid var(--border)',
  },
}
