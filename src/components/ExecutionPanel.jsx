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
    bg: '#101B33',
    surface: '#1C3151',
    border: '#45679A',
    text: '#F4F7FC',
    textSoft: '#D8E2F1',
    textMuted: '#AFC2DE',
    accent: '#6B8CFF',
    accentSoft: '#2C446B',
    inputBg: '#22385D',
    error: '#C07878',
    buttonText: '#F4F7FC',
    buttonTextSoft: '#D8E2F1',
    buttonBorder: '#6B8CFF',
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

const ARTIFACT_DESCRIPTIONS = {
  ACTION_PLAN:    'Step-by-step execution roadmap',
  SOP:            'Operational playbook',
  PROCESS_CHANGE: 'Workflow improvements',
  PRICING_MODEL:  'Monetization strategy',
  HIRING_BRIEF:   'Role and team plan',
  EMAIL:          'Outreach template',
}

const ARTIFACT_ICONS = {
  ACTION_PLAN: '↗',
  SOP: '≣',
  PROCESS_CHANGE: '◌',
  PRICING_MODEL: '$',
  HIRING_BRIEF: '◍',
  EMAIL: '✉',
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

function trimWords(input, count = 3) {
  return String(input || '')
    .replace(/[^\w\s&/-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, count)
    .join(' ')
}

function formatReportDate(report) {
  return report?.created_at
    ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Latest'
}

function getReportModeLabel(parsedReport, report) {
  const mode = parsedReport?.report_family === 'GOAL' || parsedReport?.conversation_mode === 'GOAL_GAP'
    ? 'Goal audit'
    : parsedReport?.conversation_mode === 'EXECUTION'
      ? 'Execution audit'
      : report?.conversation_mode === 'EXECUTION'
        ? 'Execution audit'
        : 'Diagnostic audit'
  return mode
}

function getAuditTopic(report, parsedReport) {
  const criticalDomain = parsedReport?.domains?.find((domain) => domain.status === 'critical')
  const needsWorkDomain = parsedReport?.domains?.find((domain) => domain.status === 'needs_work')
  const topDomain = criticalDomain || needsWorkDomain || parsedReport?.domains?.[0]

  if (parsedReport?.goal_gap_analysis?.goal) return trimWords(parsedReport.goal_gap_analysis.goal, 3)
  if (topDomain?.name) return trimWords(topDomain.name, 3)
  return trimWords(report?.headline || report?.title || 'Audit focus', 3)
}

function getRecommendedMoveContent(report, parsedReport, recommendations) {
  const topDomain = parsedReport?.domains?.find((domain) => domain.status === 'critical')
    || parsedReport?.domains?.find((domain) => domain.status === 'needs_work')
    || parsedReport?.domains?.[0]
    || null
  const topFix = parsedReport?.priority_actions?.[0]
    || parsedReport?.non_ai_fixes?.[0]?.fix
    || topDomain?.action
    || parsedReport?.goal_gap_analysis?.fastest_path
    || report?.headline
    || 'Move on the highest-leverage fix'
  const rationale = parsedReport?.honest_truth
    || topDomain?.finding
    || parsedReport?.goal_gap_analysis?.gap
    || 'SelfAudit is surfacing the strongest next move from this audit so execution stays tied to the real bottleneck.'
  const primaryType = recommendations?.[0] || 'ACTION_PLAN'
  const dateLabel = formatReportDate(report)
  const topic = getAuditTopic(report, parsedReport)

  return {
    dateLabel,
    topic,
    modeLabel: getReportModeLabel(parsedReport, report),
    title: String(topFix || '').replace(/\.$/, ''),
    rationale: String(rationale || '').trim(),
    primaryType,
    stats: [
      {
        icon: '↑',
        label: 'High leverage',
        value: topDomain?.name ? `${topDomain.name} bottleneck first` : 'Strong upside from the next move',
      },
      {
        icon: '◎',
        label: 'Audit source',
        value: `${dateLabel} · ${topic || 'Audit focus'}`,
      },
      {
        icon: '▣',
        label: 'Best first format',
        value: ARTIFACT_LABELS[primaryType] || 'Action Plan',
      },
    ],
  }
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
  const sharpThemeActive = theme === 'sharp'
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
  const [showFormats, setShowFormats] = useState(false)
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
  const recommendationContent = useMemo(
    () => getRecommendedMoveContent(activeReport, parsedReport, recommendations),
    [activeReport, parsedReport, recommendations]
  )
  const activeIndex = useMemo(
    () => reportOptions.findIndex((item) => item.id === activeReport?.id),
    [reportOptions, activeReport]
  )

  useEffect(() => {
    setShowFormats(false)
  }, [activeReport?.id])

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
      let artifactToken = ''
      if (scopedUserInfo?.userId) {
        const sb = await initSupabase()
        const { data: { session: _s } } = await sb.auth.getSession()
        artifactToken = _s?.access_token || ''
      }
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(artifactToken ? { Authorization: `Bearer ${artifactToken}` } : {}) },
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

  const cycleReport = (direction) => {
    if (reportOptions.length <= 1) return
    const nextIndex = (activeIndex + direction + reportOptions.length) % reportOptions.length
    setSelectedReportId(reportOptions[nextIndex]?.id ?? reportOptions[0]?.id ?? null)
  }

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
        <p style={ep.subtitle}>SelfAudit&apos;s strongest next move from your audit findings.</p>
      </div>

      <div style={ep.recommendedCard}>
        <div style={ep.recommendedTopRow}>
          <div style={ep.recommendedEyebrow}>Recommended move</div>
          <div style={ep.auditSelectorWrap}>
            {reportOptions.length > 1 && (
              <button type="button" style={ep.auditNavBtn} onClick={() => cycleReport(-1)} disabled={generating} aria-label="Previous audit">
                ←
              </button>
            )}
            {reportOptions.length > 1 ? (
              <select
                value={activeReport?.id ?? ''}
                onChange={(event) => setSelectedReportId(event.target.value)}
                style={ep.auditSelector}
                disabled={generating}
              >
                {reportOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatAuditOptionLabel(item)}
                  </option>
                ))}
              </select>
            ) : (
              <div style={ep.auditSelectorStatic}>
                {recommendationContent.dateLabel} · {recommendationContent.topic || 'Audit focus'}
              </div>
            )}
            {reportOptions.length > 1 && (
              <button type="button" style={ep.auditNavBtn} onClick={() => cycleReport(1)} disabled={generating} aria-label="Next audit">
                →
              </button>
            )}
          </div>
        </div>

        <div style={ep.recommendedTitle}>{recommendationContent.title}</div>
        <div style={ep.recommendedBody}>{recommendationContent.rationale}</div>

        <div style={ep.recommendedStats}>
          {recommendationContent.stats.map((item) => (
            <div key={item.label} style={ep.recommendedStat}>
              <div style={ep.recommendedStatIcon}>{item.icon}</div>
              <div>
                <div style={ep.recommendedStatLabel}>{item.label}</div>
                <div style={ep.recommendedStatValue}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={ep.recommendedActions}>
          <button
            style={{ ...ep.generateBtn, ...(generating ? ep.generateBtnDisabled : {}) }}
            onClick={() => {
              setSelectedType('ACTION_PLAN')
              setShowFormats(true)
            }}
            disabled={generating}
          >
            Execute Action Plan →
          </button>
          <div style={ep.recommendedMeta}>
            {`Built from ${recommendationContent.modeLabel.toLowerCase()}`}
          </div>
        </div>
      </div>

      {showFormats && (
        <div style={{ ...ep.formatsPanel, ...(sharpThemeActive ? ep.formatsPanelSharp : {}) }}>
          <div style={ep.formatsHeader}>
            <div style={ep.formatsEyebrow}>Build from this audit</div>
            <div style={ep.formatsSub}>
              Pick the output SelfAudit should generate for {recommendationContent.dateLabel} · {recommendationContent.topic || 'Audit focus'}.
            </div>
          </div>

          <div style={ep.outputCardGrid}>
            {ARTIFACT_TYPES.map((type) => {
              const isSelected = selectedType === type
              const isRec = recommendations.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  style={{
                    ...ep.outputCard,
                    ...(sharpThemeActive ? ep.outputCardSharp : {}),
                    ...(isSelected ? ep.outputCardSelected : {}),
                    ...(isSelected && sharpThemeActive ? ep.outputCardSelectedSharp : {}),
                    ...(generating ? ep.outputCardDisabled : {}),
                  }}
                  onClick={() => !generating && setSelectedType(type)}
                >
                  <div style={ep.outputCardIcon}>{ARTIFACT_ICONS[type]}</div>
                  <div style={ep.outputCardBody}>
                    <div style={ep.outputCardTitleRow}>
                      <div style={ep.outputCardTitle}>{ARTIFACT_LABELS[type]}</div>
                      {isRec && <span style={ep.recBadge}>Recommended</span>}
                    </div>
                    <div style={ep.outputCardText}>{ARTIFACT_DESCRIPTIONS[type]}</div>
                  </div>
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
        </div>
      )}

      {loadingSaved && showFormats && <p style={ep.helperText}>Loading saved outputs for this audit…</p>}
      {error && <p style={ep.errorMsg}>{error}</p>}

      {showFormats && currentArtifact && (
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

      {showFormats && pastArtifacts.length > 0 && (
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
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    padding: 0,
  },
  header: { marginBottom: '0.9rem' },
  sectionTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--text-muted)', marginBottom: '0.375rem', fontWeight: 500,
  },
  subtitle: {
    fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0,
  },
  recommendedCard: {
    border: '1px solid rgba(107, 140, 255, 0.5)',
    background: 'linear-gradient(180deg, rgba(31,48,79,0.96) 0%, rgba(15,32,57,0.98) 100%)',
    boxShadow: '0 0 0 1px rgba(107, 140, 255, 0.14) inset, 0 18px 40px rgba(0,0,0,0.28)',
    borderRadius: 14,
    padding: '18px 22px',
    marginBottom: '0.85rem',
  },
  recommendedTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  recommendedEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  auditSelectorWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  auditNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-soft)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  auditSelector: {
    minWidth: 240,
    maxWidth: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    color: 'var(--text)',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  auditSelectorStatic: {
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    color: 'var(--text-soft)',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
  },
  recommendedTitle: {
    fontSize: 32,
    lineHeight: 1.04,
    color: 'var(--button-text)',
    fontWeight: 600,
    maxWidth: 840,
    marginBottom: 10,
    fontFamily: 'Georgia, Times New Roman, serif',
  },
  recommendedBody: {
    fontSize: 14,
    color: 'var(--text-soft)',
    lineHeight: 1.7,
    maxWidth: 720,
    marginBottom: 14,
  },
  recommendedStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
    marginBottom: 16,
  },
  recommendedStat: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    minWidth: 0,
  },
  recommendedStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--button-text)',
    fontSize: 16,
    flexShrink: 0,
  },
  recommendedStatLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  recommendedStatValue: {
    fontSize: 12.5,
    color: 'var(--text-soft)',
    lineHeight: 1.45,
  },
  recommendedActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  recommendedMeta: {
    fontSize: 12,
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
  },
  formatsPanel: {
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--surface)',
    padding: '16px 14px 14px',
    marginBottom: '1rem',
  },
  formatsPanelSharp: {
    border: '1px solid rgba(107, 140, 255, 0.28)',
    background: 'linear-gradient(180deg, rgba(39,63,102,0.94) 0%, rgba(23,43,71,0.985) 100%)',
    boxShadow: '0 0 0 1px rgba(107,140,255,0.1) inset, 0 16px 30px rgba(5,15,30,0.16)',
  },
  formatsHeader: {
    marginBottom: 14,
  },
  formatsEyebrow: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: 6,
  },
  formatsSub: {
    fontSize: 14,
    color: 'var(--text-soft)',
    lineHeight: 1.6,
  },
  outputCardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: '1rem',
  },
  outputCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    textAlign: 'left',
    padding: '12px 18px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-soft)',
    cursor: 'pointer',
    minWidth: 220,
    flex: '0 1 auto',
  },
  outputCardSharp: {
    background: 'linear-gradient(180deg, rgba(39,63,102,0.9) 0%, rgba(23,43,71,0.98) 100%)',
    border: '1px solid rgba(107,140,255,0.2)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035), 0 10px 20px rgba(5,15,30,0.12)',
  },
  outputCardSelected: {
    border: '1px solid var(--accent)',
    boxShadow: '0 0 0 1px rgba(107, 140, 255, 0.16) inset',
    background: 'rgba(107,140,255,0.12)',
  },
  outputCardSelectedSharp: {
    border: '1px solid rgba(107,140,255,0.62)',
    background: 'linear-gradient(180deg, rgba(72,109,187,0.3) 0%, rgba(39,63,102,0.98) 100%)',
    boxShadow: '0 0 0 1px rgba(107,140,255,0.18) inset, 0 14px 28px rgba(0,0,0,0.2)',
  },
  outputCardDisabled: {
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  outputCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.02)',
  },
  outputCardBody: {
    minWidth: 0,
    flex: '0 1 auto',
  },
  outputCardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  outputCardTitle: {
    fontSize: 14,
    color: 'var(--text)',
    fontWeight: 500,
  },
  outputCardText: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
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
