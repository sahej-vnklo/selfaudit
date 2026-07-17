import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_BORDER,
  DARK_HERO_BORDER,
  DARK_HERO_INSET,
  DARK_HERO_SHADOW,
  DARK_HERO_SURFACE,
  DARK_INPUT_BG,
  DARK_PAGE_BG,
  DARK_PANEL_BORDER,
  DARK_PANEL_SHADOW,
  DARK_PANEL_SURFACE,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_BORDER,
  LIGHT_HERO_BORDER,
  LIGHT_HERO_INSET,
  LIGHT_HERO_SHADOW,
  LIGHT_HERO_SURFACE,
  LIGHT_INPUT_BG,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_BORDER,
  LIGHT_PANEL_SHADOW,
  LIGHT_PANEL_SURFACE,
  LIGHT_TEXT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_BORDER,
  SHARP_HERO_BORDER,
  SHARP_HERO_INSET,
  SHARP_HERO_SHADOW,
  SHARP_HERO_SURFACE,
  SHARP_INPUT_BG,
  SHARP_PAGE_BG,
  SHARP_PANEL_BORDER,
  SHARP_PANEL_SHADOW,
  SHARP_PANEL_SURFACE,
  SHARP_TEXT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_PANEL_SURFACE,
    border: DARK_BORDER,
    text: DARK_TEXT,
    textSoft: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    accent: '#C8622A',
    accentSoft: 'rgba(200,98,42,0.12)',
    inputBg: DARK_INPUT_BG,
    error: '#C05050',
    buttonText: '#ffffff',
    buttonTextSoft: '#ffffff',
    buttonBorder: '#ffffff',
  },
  light: {
    bg: LIGHT_PAGE_BG,
    surface: LIGHT_PANEL_SURFACE,
    border: LIGHT_BORDER,
    text: LIGHT_TEXT,
    textSoft: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    accent: '#C8622A',
    accentSoft: 'rgba(200,98,42,0.1)',
    inputBg: LIGHT_INPUT_BG,
    error: '#8C2A2A',
    buttonText: '#ffffff',
    buttonTextSoft: '#ffffff',
    buttonBorder: '#ffffff',
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_PANEL_SURFACE,
    border: SHARP_BORDER,
    text: SHARP_TEXT,
    textSoft: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    accent: SHARP_ACCENT,
    accentSoft: SHARP_ACCENT_SOFT,
    inputBg: SHARP_INPUT_BG,
    error: '#C07878',
    buttonText: SHARP_TEXT,
    buttonTextSoft: SHARP_TEXT_SOFT,
    buttonBorder: SHARP_ACCENT,
  },
}

function getThemeVars(theme) {
  const C = THEMES[theme] || THEMES.dark
  const rich =
    theme === 'sharp'
      ? {
          heroSurface: SHARP_HERO_SURFACE,
          panelSurface: SHARP_PANEL_SURFACE,
          heroBorder: SHARP_HERO_BORDER,
          panelBorder: SHARP_PANEL_BORDER,
          heroInset: SHARP_HERO_INSET,
          heroShadow: SHARP_HERO_SHADOW,
          panelShadow: SHARP_PANEL_SHADOW,
        }
      : theme === 'dark'
        ? {
            heroSurface: DARK_HERO_SURFACE,
            panelSurface: DARK_PANEL_SURFACE,
            heroBorder: DARK_HERO_BORDER,
            panelBorder: DARK_PANEL_BORDER,
            heroInset: DARK_HERO_INSET,
            heroShadow: DARK_HERO_SHADOW,
            panelShadow: DARK_PANEL_SHADOW,
          }
        : theme === 'light'
          ? {
              heroSurface: 'linear-gradient(155deg, #fcfcfd 0%, #ececee 100%)',
              panelSurface: '#f1f1f3',
              heroBorder: '1px solid rgba(20,16,15,0.12)',
              panelBorder: '1px solid rgba(20,16,15,0.10)',
              heroInset: 'inset 0 1px 0 rgba(255,255,255,0.9)',
              heroShadow: '0 1px 2px rgba(20,16,15,0.07), 0 8px 20px -12px rgba(20,16,15,0.18)',
              panelShadow: '0 1px 2px rgba(20,16,15,0.06)',
            }
        : {
            heroSurface: C.surface,
            panelSurface: C.surface,
            heroBorder: `1px solid ${C.border}`,
            panelBorder: `1px solid ${C.border}`,
            heroInset: 'none',
            heroShadow: 'none',
            panelShadow: 'none',
          }
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
    '--rich-hero-surface': rich.heroSurface,
    '--rich-panel-surface': rich.panelSurface,
    '--rich-hero-border': rich.heroBorder,
    '--rich-panel-border': rich.panelBorder,
    '--rich-hero-inset': rich.heroInset,
    '--rich-hero-shadow': rich.heroShadow,
    '--rich-panel-shadow': rich.panelShadow,
  }
}

const ARTIFACT_TYPES = ['ACTION_PLAN', 'SOP', 'PROCESS_CHANGE', 'PRICING_MODEL', 'HIRING_BRIEF', 'EMAIL', 'INVESTOR_UPDATE', 'TEAM_BRIEF']

const ARTIFACT_LABELS = {
  ACTION_PLAN:      'Action Plan',
  SOP:              'Standard SOP',
  PROCESS_CHANGE:   'Process Redesign',
  PRICING_MODEL:    'Pricing Model',
  HIRING_BRIEF:     'Hiring Brief',
  EMAIL:            'Email Draft',
  INVESTOR_UPDATE:  'Investor Update',
  TEAM_BRIEF:       'Team Brief',
}

const ARTIFACT_DESCRIPTIONS = {
  ACTION_PLAN:      'Step-by-step execution roadmap',
  SOP:              'Operational playbook',
  PROCESS_CHANGE:   'Workflow improvements',
  PRICING_MODEL:    'Monetization strategy',
  HIRING_BRIEF:     'Role and team plan',
  EMAIL:            'Outreach template',
  INVESTOR_UPDATE:  'Investor or advisor update',
  TEAM_BRIEF:       'Internal team communication',
}

const ARTIFACT_ICONS = {
  ACTION_PLAN:      '↗',
  SOP:              '≣',
  PROCESS_CHANGE:   '◌',
  PRICING_MODEL:    '$',
  HIRING_BRIEF:     '◍',
  EMAIL:            '✉',
  INVESTOR_UPDATE:  '◈',
  TEAM_BRIEF:       '◉',
}

const PUSH_ACTIONS = {
  EMAIL:       { label: 'Create Gmail Draft' },
  TEAM_BRIEF:  { label: 'Post to Slack' },
  ACTION_PLAN: { label: 'Push to Notion' },
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

function normalizeFindingAreaId(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildStageFinding(parsedReport, healthIntel) {
  const topDomain = parsedReport?.domains?.find((domain) => domain.status === 'critical')
    || parsedReport?.domains?.find((domain) => domain.status === 'needs_work')
    || null

  if (topDomain?.name && (topDomain.finding || topDomain.action)) {
    return {
      areaId: normalizeFindingAreaId(topDomain.name),
      title: topDomain.finding || `${topDomain.name} needs attention`,
      severity: topDomain.status === 'critical' ? 'high' : 'medium',
      status: topDomain.status === 'critical' ? 'bad' : 'watch',
      recommendation: topDomain.action || parsedReport?.priority_actions?.[0] || '',
      metricKey: null,
      metricValue: null,
      comparator: null,
      thresholdValue: null,
    }
  }

  const governanceDiagnosis = Array.isArray(healthIntel?.governance_top_diagnoses)
    ? healthIntel.governance_top_diagnoses[0]
    : null

  if (governanceDiagnosis?.title) {
    return {
      areaId: governanceDiagnosis.area_id || '',
      title: governanceDiagnosis.title,
      severity: governanceDiagnosis.severity || 'medium',
      status: (healthIntel?.governance_areas_needing_attention ?? 0) > 0 ? 'bad' : 'watch',
      recommendation: Array.isArray(healthIntel?.health_check_actions) ? (healthIntel.health_check_actions[0] || '') : '',
      metricKey: null,
      metricValue: null,
      comparator: null,
      thresholdValue: null,
    }
  }

  return null
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

function slugifyArtifactFilename(input) {
  return String(input || 'artifact')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

async function downloadArtifactPdf(artifact, artifactLabel) {
  if (!artifact) throw new Error('Artifact not ready')

  const shell = document.createElement('div')
  shell.style.position = 'fixed'
  shell.style.left = '-100000px'
  shell.style.top = '0'
  shell.style.width = '820px'
  shell.style.padding = '40px'
  shell.style.background = '#F7F5EF'
  shell.style.color = '#1D241B'
  shell.style.fontFamily = '-apple-system, "Helvetica Neue", "Inter", Arial, sans-serif'
  shell.style.zIndex = '-1'

  const title = document.createElement('h1')
  title.textContent = artifact.title || artifactLabel || 'SelfAudit Artifact'
  title.style.fontSize = '30px'
  title.style.lineHeight = '1.15'
  title.style.margin = '0 0 12px'
  title.style.fontFamily = '"Titillium Web", -apple-system, "Helvetica Neue", "Inter", Arial, sans-serif'
  title.style.fontWeight = '600'
  shell.appendChild(title)

  if (artifact.summary) {
    const summary = document.createElement('p')
    summary.textContent = artifact.summary
    summary.style.fontSize = '15px'
    summary.style.lineHeight = '1.7'
    summary.style.color = '#4C5D43'
    summary.style.margin = '0 0 24px'
    shell.appendChild(summary)
  }

  ;(artifact.sections || []).forEach((section) => {
    const sectionWrap = document.createElement('section')
    sectionWrap.style.background = '#FFFFFF'
    sectionWrap.style.border = '1px solid #D8D2C6'
    sectionWrap.style.borderRadius = '12px'
    sectionWrap.style.padding = '18px 20px'
    sectionWrap.style.marginBottom = '14px'
    sectionWrap.style.boxShadow = '0 10px 24px rgba(35, 41, 29, 0.05)'

    const label = document.createElement('div')
    label.textContent = section.label || 'Section'
    label.style.fontSize = '11px'
    label.style.letterSpacing = '0.08em'
    label.style.textTransform = 'uppercase'
    label.style.color = '#67765D'
    label.style.marginBottom = '10px'
    label.style.fontWeight = '600'
    sectionWrap.appendChild(label)

    const content = document.createElement('div')
    content.textContent = section.content || ''
    content.style.fontSize = '14px'
    content.style.lineHeight = '1.8'
    content.style.whiteSpace = 'pre-wrap'
    content.style.color = '#263022'
    sectionWrap.appendChild(content)

    shell.appendChild(sectionWrap)
  })

  document.body.appendChild(shell)

  try {
    const canvas = await html2canvas(shell, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F7F5EF',
    })

    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 24
    const renderWidth = pageWidth - (margin * 2)
    const scaleRatio = renderWidth / canvas.width
    const sliceHeightPx = Math.floor((pageHeight - (margin * 2)) / scaleRatio)

    let offsetY = 0
    let pageIndex = 0

    while (offsetY < canvas.height) {
      const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - offsetY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = currentSliceHeight
      const sliceContext = sliceCanvas.getContext('2d')
      if (!sliceContext) throw new Error('Failed to prepare artifact PDF page')

      sliceContext.drawImage(
        canvas,
        0, offsetY, canvas.width, currentSliceHeight,
        0, 0, canvas.width, currentSliceHeight
      )

      if (pageIndex > 0) pdf.addPage()
      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        renderWidth,
        currentSliceHeight * scaleRatio
      )

      offsetY += currentSliceHeight
      pageIndex += 1
    }

    const typeSlug = slugifyArtifactFilename(artifactLabel || artifact.type || 'artifact')
    const titleSlug = slugifyArtifactFilename(artifact.title || 'selfaudit')
    pdf.save(`selfaudit-${typeSlug}-${titleSlug}.pdf`)
  } finally {
    document.body.removeChild(shell)
  }
}

export default function ExecutionPanel({ report, reports = [], userInfo, variant = 'report', theme: themeProp = null, onActionStaged = null, healthIntel = null }) {
  const theme = themeProp || localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const sharpThemeActive = theme === 'sharp'
  const darkThemeActive = theme === 'dark'
  const lightThemeActive = theme === 'light'
  const reportOptions = useMemo(() => {
    const fromList = Array.isArray(reports) ? reports.filter(isActionableReport) : []
    if (fromList.length > 0) return fromList
    return report && isActionableReport(report) ? [report] : []
  }, [report, reports])

  const [selectedReportId, setSelectedReportId] = useState(() => reportOptions[0]?.id ?? null)
  const [selectedType, setSelectedType]   = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [showFormats, setShowFormats] = useState(false)
  const [error, setError]             = useState(null)
  const [artifact, setArtifact]       = useState(null)
  const [currentArtifactId, setCurrentArtifactId] = useState(null)
  const [currentArtifactType, setCurrentArtifactType] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)
  const [pastArtifacts, setPastArtifacts] = useState([])
  const [expandedPast, setExpandedPast]   = useState(null)
  const [showSendPopup, setShowSendPopup]     = useState(false)
  const [sendingArtifact, setSendingArtifact] = useState(false)
  const [sendArtifactErr, setSendArtifactErr] = useState(null)
  const [sendArtifactDone, setSendArtifactDone] = useState(false)
  const [commChannels, setCommChannels]         = useState([{ type: 'email', label: 'Account Email', params: null }])
  const [savedCommPref, setSavedCommPref]       = useState(null)
  const [selectedChannel, setSelectedChannel]   = useState('email')

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

  // Stabilise scopedUserInfo so the fetch effect doesn't re-fire on every parent
  // re-render — userInfo is an object prop that gets a new reference each render
  // even when its content hasn't changed. We compare JSON and return the previous
  // reference when content is identical, keeping the effect dep stable.
  const scopedUserInfoRef = useRef(null)
  const scopedUserInfo = useMemo(() => {
    const next = buildScopedUserInfo(userInfo, activeReport, parsedReport)
    if (
      scopedUserInfoRef.current !== null &&
      JSON.stringify(next) === JSON.stringify(scopedUserInfoRef.current)
    ) {
      return scopedUserInfoRef.current
    }
    scopedUserInfoRef.current = next
    return next
  }, [userInfo, activeReport, parsedReport])
  const recommendationContent = useMemo(
    () => getRecommendedMoveContent(activeReport, parsedReport, recommendations),
    [activeReport, parsedReport, recommendations]
  )
  const stageFinding = useMemo(() => buildStageFinding(parsedReport, healthIntel), [parsedReport, healthIntel])
  const activeIndex = useMemo(
    () => reportOptions.findIndex((item) => item.id === activeReport?.id),
    [reportOptions, activeReport]
  )

  useEffect(() => {
    setShowFormats(false)
    setArtifact(null)
    setCurrentArtifactId(null)
    setCurrentArtifactType(null)
    setCopiedSection(null)
    setShowSendPopup(false)
    setSendingArtifact(false)
    setSendArtifactErr(null)
    setSendArtifactDone(false)
  }, [activeReport?.id])

  useEffect(() => {
    const userId = userInfo?.userId
    if (!userId) return
    let cancelled = false
    async function loadPast() {
      try {
        const sb = await initSupabase()
        const { data: { session: s } } = await sb.auth.getSession()
        const token = s?.access_token || ''
        const res = await fetch(`/api/artifacts?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setPastArtifacts(data.artifacts ?? [])
      } catch { /* non-blocking */ }
    }
    loadPast()
    return () => { cancelled = true }
  }, [userInfo?.userId])

  // Fetch available communication channels for this user
  useEffect(() => {
    const userId = userInfo?.userId
    if (!userId) return
    let cancelled = false
    async function loadChannels() {
      try {
        const sb = await initSupabase()
        const { data: { session: s } } = await sb.auth.getSession()
        const token = s?.access_token || ''
        const res = await fetch(`/api/comm-channels?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          setCommChannels(data.channels)
        }
        if (data.savedPref) {
          setSavedCommPref(data.savedPref)
          setSelectedChannel(data.savedPref.channel_type ?? 'email')
        }
      } catch { /* non-blocking */ }
    }
    loadChannels()
    return () => { cancelled = true }
  }, [userInfo?.userId])

  useEffect(() => {
    let cancelled = false

    async function loadPanelState() {
      if (!parsedReport) {
        setRecommendations([])
        setSelectedType(null)
        return
      }

      setError(null)

      try {
        const recommendationResponse = await fetch('/api/generate-artifact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ report: parsedReport, userInfo: scopedUserInfo }),
        }).then(async (response) => response.ok ? response.json() : { recommendations: { recommended: [] } })

        if (cancelled) return

        const recommended = recommendationResponse?.recommendations?.recommended ?? []
        setRecommendations(recommended)
        setSelectedType((prev) => (prev && ARTIFACT_TYPES.includes(prev) ? prev : (recommended[0] || null)))
      } catch {
        if (!cancelled) {
          setRecommendations([])
        }
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
      if (data.recommendations?.recommended?.length) {
        setRecommendations(data.recommendations.recommended)
      }
      setSendArtifactDone(false)
      setSendArtifactErr(null)
      setArtifact(data.artifact)
      setCurrentArtifactId(data.savedArtifact?.id ?? null)
      setCurrentArtifactType(selectedType)
      setShowFormats(false)
      if (data.savedArtifact) {
        setPastArtifacts((prev) => [
          { ...data.savedArtifact, artifact_type: selectedType, title: data.artifact?.title, summary: data.artifact?.summary, artifact_data: data.artifact },
          ...prev.filter((a) => a.id !== data.savedArtifact.id),
        ])
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const isGenerateDisabled = !selectedType || generating || !parsedReport

  const copyAll = (art) => {
    if (!art) return
    const text = [art.title, art.summary, '', ...(art.sections || []).map(s => `${s.label}\n${s.content}`)].join('\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedSection('all')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const copySection = (section, idx) => {
    navigator.clipboard.writeText(`${section.label}\n${section.content}`).catch(() => {})
    setCopiedSection(idx)
    setTimeout(() => setCopiedSection(null), 2000)
  }

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

  async function doSendArtifact() {
    if (!artifact || !scopedUserInfo?.userId) return
    setSendingArtifact(true)
    setSendArtifactErr(null)
    try {
      const ch = commChannels.find(c => c.type === selectedChannel) ?? commChannels[0]
      const params = ch.type === 'email'
        ? { email: scopedUserInfo.email }
        : (ch.params ?? {})

      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const headers = { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }
      const res = await fetch('/api/actions/notify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId:       scopedUserInfo.userId,
          channelType:  ch.type,
          params,
          artifactData: { title: artifact.title, type: currentArtifactType, sections: artifact.sections ?? [], summary: artifact.summary ?? null },
          savePref: true,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Could not send')
      setSavedCommPref({ channel_type: ch.type, params })
      setSendArtifactDone(true)
      setShowSendPopup(false)
    } catch (e) {
      setSendArtifactErr(e.message)
    } finally {
      setSendingArtifact(false)
    }
  }

  return (
    <div style={{ ...themeVars, ...(variant === 'dashboard' ? ep.cardWrapper : ep.wrapper) }} data-pdf-hide>

      {/* Send artifact popup — channel picker */}
      {showSendPopup && (() => {
        const CHANNEL_ICON = {
          email: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
          slack: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M9 9h6M9 15h6M9 9v6M15 9v6"/></svg>,
          gmail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
        }
        function channelSubtitle(ch) {
          if (ch.type === 'email') return scopedUserInfo?.email || 'your account email'
          if (ch.type === 'slack') return ch.params?.channel ? `#${ch.params.channel}` : 'Slack workspace'
          if (ch.type === 'gmail') return ch.params?.recipient || 'Gmail draft'
          return ch.type
        }
        const isFirstTime = !savedCommPref
        const accent = 'var(--accent, #c8622a)'
        const accentBg = 'rgba(200,98,42,0.08)'
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!sendingArtifact) setShowSendPopup(false) }} />
            <div style={{ position: 'relative', background: 'var(--rich-panel-surface, var(--surface, #1a1a1a))', border: '1px solid var(--border, #333)', borderRadius: 12, padding: '22px 24px', width: '100%', maxWidth: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Send this artifact</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
                {isFirstTime ? 'Pick where you want this sent. We\'ll remember your choice.' : 'Send to your saved channel, or pick a different one.'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {commChannels.map(ch => {
                  const isSel = selectedChannel === ch.type
                  return (
                    <button
                      key={ch.type}
                      type="button"
                      onClick={() => setSelectedChannel(ch.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: isSel ? `1.5px solid ${accent}` : '1px solid var(--border, #333)', background: isSel ? accentBg : 'var(--surface2, rgba(255,255,255,0.04))', transition: 'border-color 0.12s, background 0.12s' }}
                    >
                      <span style={{ color: isSel ? accent : 'var(--text-muted)', flexShrink: 0 }}>{CHANNEL_ICON[ch.type] ?? CHANNEL_ICON.email}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? accent : 'var(--text)' }}>{ch.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelSubtitle(ch)}</div>
                      </div>
                      {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: accent, flexShrink: 0 }}><path d="M20 6L9 17l-5-5"/></svg>}
                    </button>
                  )
                })}
              </div>
              {sendArtifactErr && <div style={{ fontSize: 11, color: 'var(--error, #f87171)', marginBottom: 10 }}>{sendArtifactErr}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={doSendArtifact} disabled={sendingArtifact} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: sendingArtifact ? 'not-allowed' : 'pointer', opacity: sendingArtifact ? 0.6 : 1 }}>
                  {sendingArtifact ? 'Sending…' : 'Send →'}
                </button>
                <button type="button" onClick={() => setShowSendPopup(false)} disabled={sendingArtifact} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border, #333)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: sendingArtifact ? 'not-allowed' : 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
        <div style={{ ...ep.formatsPanel, ...((sharpThemeActive || darkThemeActive || lightThemeActive) ? ep.formatsPanelSharp : {}) }}>
          <div style={ep.formatsHeader}>
            <div style={ep.formatsEyebrow}>Build from this audit</div>
            <div style={ep.formatsSub}>
              Pick the output SelfAudit should generate for {recommendationContent.dateLabel} · {recommendationContent.topic || 'Audit focus'}.
            </div>
          </div>

          {/* Recommended types — shown prominently */}
          <div style={ep.outputCardGrid}>
            {(recommendations.length > 0 ? recommendations : ARTIFACT_TYPES.slice(0, 1)).map((type) => {
              if (!ARTIFACT_TYPES.includes(type)) return null
              const isSelected = selectedType === type
              return (
                <button
                  key={type}
                  type="button"
                  style={{
                    ...ep.outputCard,
                    ...((sharpThemeActive || darkThemeActive || lightThemeActive) ? ep.outputCardSharp : {}),
                    ...(isSelected ? ep.outputCardSelected : {}),
                    ...(isSelected && sharpThemeActive ? ep.outputCardSelectedSharp : {}),
                    ...(isSelected && darkThemeActive ? ep.outputCardSelectedDark : {}),
                    ...(isSelected && lightThemeActive ? ep.outputCardSelectedLight : {}),
                    ...(generating ? ep.outputCardDisabled : {}),
                  }}
                  onClick={() => !generating && setSelectedType(type)}
                >
                  <div style={ep.outputCardIcon}>{ARTIFACT_ICONS[type]}</div>
                  <div style={ep.outputCardBody}>
                    <div style={ep.outputCardTitleRow}>
                      <div style={ep.outputCardTitle}>{ARTIFACT_LABELS[type]}</div>
                      <span style={ep.recBadge}>Recommended</span>
                    </div>
                    <div style={ep.outputCardText}>{ARTIFACT_DESCRIPTIONS[type]}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Other formats — quiet secondary section */}
          {ARTIFACT_TYPES.filter((type) => !recommendations.includes(type)).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 10 }}>
                Other formats
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ARTIFACT_TYPES.filter((type) => !recommendations.includes(type)).map((type) => {
                  const isSelected = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={generating}
                      onClick={() => !generating && setSelectedType(type)}
                      style={{
                        background: isSelected ? 'var(--accent-soft, rgba(200,98,42,0.1))' : 'transparent',
                        border: `0.5px solid ${isSelected ? 'var(--accent, #C8622A)' : 'var(--d-border, rgba(255,255,255,0.08))'}`,
                        borderRadius: 8,
                        padding: '7px 12px',
                        fontSize: 12,
                        color: isSelected ? 'var(--accent, #C8622A)' : 'var(--fg-mute)',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        opacity: generating ? 0.5 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      {ARTIFACT_LABELS[type]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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

      {error && <p style={ep.errorMsg}>{error}</p>}

      {artifact && (
        <div style={ep.artifactPanel}>
          <div style={ep.artifactHeader}>
            <div style={ep.artifactTitleGroup}>
              <div style={ep.artifactTitle}>{artifact.title}</div>
              {artifact.summary && <div style={ep.artifactSummary}>{artifact.summary}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button type="button" style={ep.copyAllBtn} onClick={() => copyAll(artifact)}>
                {copiedSection === 'all' ? 'Copied' : 'Copy all'}
              </button>
              <button
                type="button"
                style={{ ...ep.copyAllBtn, background: 'transparent', border: '1px solid var(--button-border)', color: 'var(--button-text)' }}
                onClick={() => downloadArtifactPdf(artifact, ARTIFACT_LABELS[artifact.type] || artifact.type).catch(() => {})}
              >
                PDF
              </button>
              {PUSH_ACTIONS[currentArtifactType] && (
                <button
                  type="button"
                  style={{ ...ep.copyAllBtn, background: sendArtifactDone ? 'transparent' : 'var(--accent)', border: sendArtifactDone ? '1px solid var(--border)' : '1px solid var(--accent)', color: sendArtifactDone ? 'var(--text-muted)' : 'var(--button-text)' }}
                  disabled={sendArtifactDone || !scopedUserInfo?.userId}
                  onClick={() => setShowSendPopup(true)}
                >
                  {sendArtifactDone ? 'Sent ✓' : 'Send'}
                </button>
              )}
            </div>
          </div>
          {sendArtifactErr && !showSendPopup && <p style={ep.stageError}>{sendArtifactErr}</p>}
          {(artifact.sections || []).map((section, idx, arr) => (
            <div key={idx} style={idx === arr.length - 1 ? ep.sectionCardLast : ep.sectionCard}>
              <div style={ep.sectionCardHeader}>
                <div style={ep.sectionLabel}>{section.label}</div>
                <button type="button" style={ep.copySectionBtn} onClick={() => copySection(section, idx)}>
                  {copiedSection === idx ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p style={ep.sectionContent}>{section.content}</p>
            </div>
          ))}
        </div>
      )}

      {pastArtifacts.length > 0 && (
        <div style={ep.pastList}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 4 }}>
            Previous artifacts
          </div>
          {pastArtifacts.map((past) => {
            const isExpanded = expandedPast === past.id
            const pastData = past.artifact_data
            const label = ARTIFACT_LABELS[past.artifact_type] || past.artifact_type
            const date = past.created_at
              ? new Date(past.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : ''
            return (
              <div key={past.id} style={ep.pastCard}>
                <div style={ep.pastCardHeader} onClick={() => setExpandedPast(isExpanded ? null : past.id)}>
                  <div style={ep.pastCardLeft}>
                    <span style={ep.pastTypeBadge}>{label}</span>
                    <span style={ep.pastTitle}>{past.title || label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{date}</span>
                    <span style={ep.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && pastData && (
                  <div style={ep.pastExpanded}>
                    {(pastData.sections || []).map((section, idx, arr) => (
                      <div key={idx} style={idx === arr.length - 1 ? ep.sectionCardLast : ep.sectionCard}>
                        <div style={ep.sectionCardHeader}>
                          <div style={ep.sectionLabel}>{section.label}</div>
                          <button type="button" style={ep.copySectionBtn} onClick={() => copySection(section, `past-${past.id}-${idx}`)}>
                            {copiedSection === `past-${past.id}-${idx}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p style={ep.sectionContent}>{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
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
    border: 'var(--rich-hero-border)',
    background: 'var(--rich-hero-surface)',
    boxShadow: 'var(--rich-hero-inset), var(--rich-hero-shadow)',
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
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-soft)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  auditSelector: {
    minWidth: 240,
    maxWidth: '100%',
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  auditSelectorStatic: {
    background: 'var(--surface)',
    border: '0.5px solid var(--border)',
    color: 'var(--text-soft)',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
  },
  recommendedTitle: {
    fontSize: 32,
    lineHeight: 1.04,
    color: 'var(--text)',
    fontWeight: 600,
    maxWidth: 840,
    marginBottom: 10,
    fontFamily: 'var(--font-heading)',
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
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text)',
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
    border: 'var(--rich-hero-border)',
    background: 'var(--rich-hero-surface)',
    boxShadow: 'var(--rich-hero-inset), var(--rich-hero-shadow)',
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
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-soft)',
    cursor: 'pointer',
    minWidth: 220,
    flex: '0 1 auto',
    transition: 'border-color 0.15s, background 0.15s',
  },
  outputCardSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  outputCardSelected: {
    border: '1px solid rgba(200,98,42,0.5)',
    background: 'rgba(200,98,42,0.08)',
    boxShadow: '0 0 0 1px rgba(200,98,42,0.08) inset',
  },
  outputCardSelectedSharp: {
    border: '1px solid rgba(200,98,42,0.5)',
    background: 'rgba(200,98,42,0.08)',
    boxShadow: '0 0 0 1px rgba(200,98,42,0.08) inset',
  },
  outputCardSelectedDark: {
    border: '1px solid rgba(200,98,42,0.45)',
    background: 'rgba(200,98,42,0.1)',
    boxShadow: '0 0 0 1px rgba(200,98,42,0.08) inset',
  },
  outputCardSelectedLight: {
    border: '1px solid rgba(200,98,42,0.35)',
    background: 'rgba(200,98,42,0.06)',
    boxShadow: '0 0 0 1px rgba(200,98,42,0.06) inset',
  },
  outputCardDisabled: {
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  outputCardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    flexShrink: 0,
    background: 'var(--surface)',
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
  stageError: {
    fontSize: 12, color: 'var(--error)', marginTop: 8,
  },
  stageNotice: {
    fontSize: 12, color: 'var(--text-muted)', marginTop: 8,
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
