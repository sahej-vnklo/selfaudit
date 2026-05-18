import React, { useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import * as Sentry from '@sentry/react'
import { generateReport } from '../lib/audit.js'
import { usePostHog } from '@posthog/react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import ExecutionPanel from './ExecutionPanel.jsx'
import DiagnosticReport from './reports/DiagnosticReport.jsx'
import ExecutionReport from './reports/ExecutionReport.jsx'
import HumanMomentReport from './reports/HumanMomentReport.jsx'
import GoalGapReport from './reports/GoalGapReport.jsx'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_AMBER,
  DARK_AMBER_BG,
  DARK_AMBER_TEXT,
  DARK_BORDER,
  DARK_GREEN,
  DARK_GREEN_BG,
  DARK_GREEN_TEXT,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_RED_BG,
  DARK_RED_TEXT,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_AMBER,
  LIGHT_AMBER_BG,
  LIGHT_AMBER_TEXT,
  LIGHT_BORDER,
  LIGHT_GREEN,
  LIGHT_GREEN_BG,
  LIGHT_GREEN_TEXT,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED,
  LIGHT_RED_BG,
  LIGHT_RED_TEXT,
  LIGHT_TEXT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_AMBER,
  SHARP_AMBER_BG,
  SHARP_AMBER_TEXT,
  SHARP_BORDER,
  SHARP_GREEN,
  SHARP_GREEN_BG,
  SHARP_GREEN_TEXT,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_RED_BG,
  SHARP_RED_TEXT,
  SHARP_TEXT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    border: DARK_BORDER,
    text: DARK_TEXT,
    textSoft: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    accent: DARK_ACCENT,
    accentSoft: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    buttonText: DARK_TEXT,
    success: DARK_GREEN,
    successBg: DARK_GREEN_BG,
    successText: DARK_GREEN_TEXT,
    warning: DARK_AMBER,
    warningBg: DARK_AMBER_BG,
    warningText: DARK_AMBER_TEXT,
    danger: DARK_RED,
    dangerBg: DARK_RED_BG,
    dangerText: DARK_RED_TEXT,
  },
  light: {
    bg: LIGHT_PAGE_BG,
    surface: LIGHT_HERO_SURFACE,
    surface2: LIGHT_PANEL_SURFACE,
    border: LIGHT_BORDER,
    text: LIGHT_TEXT,
    textSoft: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    accent: LIGHT_ACCENT,
    accentSoft: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    buttonText: '#FBF7F2',
    success: LIGHT_GREEN,
    successBg: LIGHT_GREEN_BG,
    successText: LIGHT_GREEN_TEXT,
    warning: LIGHT_AMBER,
    warningBg: LIGHT_AMBER_BG,
    warningText: LIGHT_AMBER_TEXT,
    danger: LIGHT_RED,
    dangerBg: LIGHT_RED_BG,
    dangerText: LIGHT_RED_TEXT,
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    border: SHARP_BORDER,
    text: SHARP_TEXT,
    textSoft: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    accent: SHARP_ACCENT,
    accentSoft: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    buttonText: SHARP_TEXT,
    success: SHARP_GREEN,
    successBg: SHARP_GREEN_BG,
    successText: SHARP_GREEN_TEXT,
    warning: SHARP_AMBER,
    warningBg: SHARP_AMBER_BG,
    warningText: SHARP_AMBER_TEXT,
    danger: SHARP_RED,
    dangerBg: SHARP_RED_BG,
    dangerText: SHARP_RED_TEXT,
  },
}

function getThemeTokens(theme) {
  return THEMES[theme] || THEMES.dark
}

function getThemeVars(theme) {
  const C = getThemeTokens(theme)
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--border': C.border,
    '--text': C.text,
    '--text-soft': C.textSoft,
    '--text-muted': C.textMuted,
    '--accent': C.accent,
    '--accent-soft': C.accentSoft,
    '--accent-text': C.accentText,
    '--button-text': C.buttonText,
    '--success': C.success,
    '--success-bg': C.successBg,
    '--success-text': C.successText,
    '--warning': C.warning,
    '--warning-bg': C.warningBg,
    '--warning-text': C.warningText,
    '--danger': C.danger,
    '--danger-bg': C.dangerBg,
    '--danger-text': C.dangerText,
    '--white': C.surface,
    '--black': C.text,
    '--gray-50': C.surface2,
    '--gray-100': C.surface2,
    '--gray-200': C.border,
    '--gray-400': C.textMuted,
    '--gray-500': C.textMuted,
    '--gray-600': C.textSoft,
    '--gray-700': C.textSoft,
    '--gray-800': C.text,
    '--green': C.accent,
    '--green-light': C.accentSoft,
    '--green-mid': C.border,
    '--green-dark': C.accentText,
  }
}

function getStatusStyles(theme) {
  const C = getThemeTokens(theme)
  return {
    color: {
      strong: C.successText,
      needs_work: C.warningText,
      critical: C.dangerText,
    },
    bg: {
      strong: C.successBg,
      needs_work: C.warningBg,
      critical: C.dangerBg,
    },
  }
}

export default function Report({ userInfo, conversationHistory, sessionId }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadState, setDownloadState] = useState('idle') // idle | downloading
  const posthog = usePostHog()
  const contentRef = useRef(null)

  React.useEffect(() => {
    async function build() {
      try {
        const apiMessages = conversationHistory
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }))

        let reportToken = ''
        if (userInfo?.userId) {
          const sb = await initSupabase()
          const { data: { session: _s } } = await sb.auth.getSession()
          reportToken = _s?.access_token || ''
        }

        const r = await generateReport(apiMessages, {
          industry:     userInfo?.industry,
          domain:       userInfo?.domain,
          userId:       userInfo?.userId,
          goalMode:     userInfo?.goalMode     ?? false,
          goal:         userInfo?.goal         ?? '',
          goalTimeline: userInfo?.goalTimeline ?? '',
          goalBaseline: userInfo?.goalBaseline ?? '',
          token:        reportToken || undefined,
        })
        setReport(r)

        if (userInfo?.userId) {
          initSupabase().then(async sb => {
            const { data: { session } } = await sb.auth.getSession()
            const token = session?.access_token || ''
            fetch('/api/save-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({
                userId:       userInfo.userId,
                sessionId,
                report:       r,
                industry:     userInfo.industry,
                domain:       userInfo.domain,
                goalMode:     userInfo.goalMode     ?? false,
                goalTimeline: userInfo.goalTimeline ?? '',
                goalBaseline: userInfo.goalBaseline ?? '',
                userEmail:    userInfo.email        || '',
                userName:     userInfo.name         || '',
              }),
            }).catch(e => console.warn('[save-report] failed:', e?.message))
          }).catch(e => console.warn('[save-report] auth failed:', e?.message))

          // Save to user_memory for Layer 4 compounding intelligence
          if (r.conversation_mode === 'DIAGNOSTIC') {
            initSupabase().then(sb => sb.from('user_memory').insert({
              user_id:          userInfo.userId,
              headline:         r.headline,
              core_problem:     r.overall_verdict,
              root_causes:      r.non_ai_fixes?.map(f => f.issue) ?? [],
              priority_actions: r.priority_actions ?? [],
              ai_opportunities: r.ai_opportunities?.map(a => a.area) ?? [],
              domains_audited:  r.domains?.map(d => d.name) ?? [],
              business_state:   r.business_state ?? null,
              ranked_path:      r.ranked_path ?? null,
              status:           'open',
            })).catch(e => console.warn('[memory] save failed:', e?.message))
          }

          const attioBase = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
          fetch('/api/log-to-attio', {
            ...attioBase,
            body: JSON.stringify({
              action:              'log_audit',
              email:               userInfo.email,
              conversationHistory: apiMessages,
              report:              r,
              industry:            userInfo.industry,
              domain:              userInfo.domain,
            }),
          }).catch(e => console.warn('[report] Attio log_audit failed:', e.message))

          fetch('/api/log-to-attio', {
            ...attioBase,
            body: JSON.stringify({ action: 'increment_report_count', email: userInfo.email }),
          }).catch(e => console.warn('[report] Attio increment failed:', e.message))
        }

        posthog?.capture('report_generated', {
          conversation_mode: r.conversation_mode ?? 'DIAGNOSTIC',
          domain_count: r.domains?.length,
          has_ai_opportunities: (r.ai_opportunities?.length ?? 0) > 0,
          has_non_ai_fixes: (r.non_ai_fixes?.length ?? 0) > 0,
          priority_action_count: r.priority_actions?.length,
        })
      } catch (e) {
        Sentry.captureException(e)
        posthog?.captureException(e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    build()
  }, [])

  const handleDownload = () => {
    if (downloadState !== 'idle') return
    setDownloadState('downloading')
    const run = async () => {
      try {
        if (!contentRef.current) throw new Error('Report content not ready')

        const source = contentRef.current
        const clone = source.cloneNode(true)
        clone.querySelectorAll('[data-pdf-hide]').forEach(node => node.remove())
        clone.style.width = `${source.offsetWidth}px`
        clone.style.maxWidth = 'none'
        clone.style.position = 'fixed'
        clone.style.left = '-100000px'
        clone.style.top = '0'
        clone.style.zIndex = '-1'
        clone.style.background = 'var(--bg)'
        clone.style.paddingBottom = '0'
        document.body.appendChild(clone)

        let canvas
        try {
          canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
          })
        } finally {
          document.body.removeChild(clone)
        }

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
          if (!sliceContext) throw new Error('Failed to prepare PDF page')

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

        const slug = (report.headline || 'report')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 60)

        pdf.save(`selfaudit-report-${slug}.pdf`)
      } catch (e) {
        console.warn('[download] failed:', e.message)
      } finally {
        setDownloadState('idle')
      }
    }

    run()
  }

  if (loading) return <LoadingScreen theme={theme} />
  if (error) return <ErrorScreen error={error} theme={theme} />

  const mode = report.conversation_mode ?? 'DIAGNOSTIC'
  const isGoal = report.report_family === 'GOAL' || mode === 'GOAL_GAP'
  const { color: statusColor, bg: statusBg } = getStatusStyles(theme)
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  const headerSubtext = isGoal
    ? report.overall_verdict
    : mode === 'DIAGNOSTIC'
    ? report.overall_verdict
    : mode === 'EXECUTION'
      ? report.execution_context
      : report.acknowledgment

  const reportBody = isGoal
    ? (
      <GoalGapReport
        report={report}
        Section={Section}
        styles={styles}
      />
    )
    : mode === 'DIAGNOSTIC'
    ? (
      <DiagnosticReport
        report={report}
        userInfo={userInfo}
        Section={Section}
        GoalGapPanel={GoalGapPanel}
        ForwardTrajectorySection={ForwardTrajectorySection}
        ExecutionPanel={ExecutionPanel}
        styles={styles}
        statusColor={statusColor}
        statusBg={statusBg}
        statusLabel={statusLabel}
      />
    )
    : mode === 'EXECUTION'
      ? (
        <ExecutionReport
          report={report}
          Section={Section}
          ForwardTrajectorySection={ForwardTrajectorySection}
          styles={styles}
        />
      )
      : (
        <HumanMomentReport
          report={report}
          Section={Section}
          styles={styles}
        />
      )

  return (
    <div style={{ ...themeVars, ...styles.page }}>
      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={() => window.location.reload()}>
          self<span style={{ color: 'var(--accent)' }}>audit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            style={{ ...styles.downloadBtn, opacity: downloadState === 'downloading' ? 0.6 : 1 }}
            onClick={handleDownload}
            disabled={downloadState === 'downloading'}
          >
            {downloadState === 'downloading' ? 'Downloading...' : 'Download Report'}
          </button>
          <div style={styles.navRight}>Audit Report</div>
        </div>
      </nav>

      <div ref={contentRef} style={styles.content}>

        {/* Header — shared across all modes */}
        <div style={styles.reportHeader}>
          <span style={styles.reportLabel}>Your Audit Report</span>
          <h1 style={styles.headline}>{report.headline}</h1>
          {headerSubtext && <p style={styles.verdict}>{headerSubtext}</p>}
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 5 }}>
                <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {userInfo.name}
            </span>
            {mode === 'DIAGNOSTIC' && userInfo.context && <>
              <span style={styles.metaDot}>·</span>
              <span style={styles.metaItem}>{userInfo.context}</span>
            </>}
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {reportBody}

        {!isGoal && (
          <Section title="The Honest Truth">
            <div style={styles.truth}>
              <p style={styles.truthText}>{report.honest_truth}</p>
            </div>
          </Section>
        )}

        {/* Anonymous signup prompt */}
        {!userInfo?.userId && (
          <div data-pdf-hide style={styles.anonPrompt}>
            <div style={styles.anonLeft}>
              <p style={styles.anonTitle}>Your report won't be saved.</p>
              <p style={styles.anonBody}>Create a free account to save this report, track your progress, and get smarter audits every time — SelfAudit remembers your business context across sessions.</p>
            </div>
            <div style={styles.anonRight}>
              <button style={styles.anonBtn} onClick={() => { window.location.hash = 'signup' }}>
                Create free account →
              </button>
              <a href="#login" style={styles.anonSignIn}>Already have an account? Sign in</a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function buildReportHtml(report, userInfo, theme) {
  const mode = report.conversation_mode ?? 'DIAGNOSTIC'
  const isGoal = report.report_family === 'GOAL' || mode === 'GOAL_GAP'
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const C = getThemeTokens(theme)
  const statusStyles = getStatusStyles(theme)

  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const sec = (title, body) => `<div class="section"><div class="section-title">${e(title)}</div>${body}</div>`

  const statusColor = statusStyles.color
  const statusBg = statusStyles.bg
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  const headerSub = isGoal ? report.overall_verdict
    : mode === 'DIAGNOSTIC' ? report.overall_verdict
    : mode === 'EXECUTION' ? report.execution_context
    : report.acknowledgment

  let body = `
    <div style="margin-bottom:40px;padding-bottom:28px;border-bottom:0.5px solid ${C.border};">
      <span class="label">Your Audit Report</span>
      <h1>${e(report.headline)}</h1>
      ${headerSub ? `<p class="verdict">${e(headerSub)}</p>` : ''}
      <div class="meta">${e(userInfo?.name ?? '')} · ${e(date)}</div>
    </div>`

  if (isGoal) {
    const gap = report.goal_gap_analysis || {}
    const caps = Array.isArray(report.missing_capabilities) ? report.missing_capabilities.filter(Boolean) : []
    const feasText = report.timeline_feasibility || gap.realistic_timeline || ''
    const fl = feasText.toLowerCase()
    const fe = fl.startsWith('unrealistic') ? 'unrealistic' : fl.startsWith('tight') ? 'tight' : 'feasible'
    const fc = fe === 'unrealistic' ? C.dangerText : fe === 'tight' ? C.warningText : C.successText
    const fb = fe === 'unrealistic' ? C.dangerBg : fe === 'tight' ? C.warningBg : C.successBg
    const rankCells = report.ranking_logic ? [
      { label: 'Impact', value: report.ranking_logic.impact },
      { label: 'Urgency', value: report.ranking_logic.urgency },
      { label: 'Cost', value: report.ranking_logic.cost },
      { label: 'Dependency', value: report.ranking_logic.dependency },
    ].filter(r => r.value) : []

    body += sec('Goal Gap Analysis', `
      <div class="gg-block"><div class="gg-label">Goal</div><p class="gg-text">${e(gap.goal || '')}</p></div>
      <div class="gg-row">
        <div class="gg-half"><div class="gg-label">Current position</div><p class="gg-text">${e(gap.current_position || '')}</p></div>
        <div class="gg-half" style="border-right:none"><div class="gg-label">The gap</div><p class="gg-text">${e(gap.gap || '')}</p></div>
      </div>
      <div class="gg-block"><div class="gg-label">Fastest path</div><p class="gg-text">${e(gap.fastest_path || '')}</p></div>
      <div class="gg-block"><div class="gg-label">Realistic timeline</div><p class="gg-text">${e(gap.realistic_timeline || '')}</p></div>
      ${caps.length > 0 ? `<div class="gg-block"><div class="gg-label">Missing capabilities</div><div class="cap-list">${caps.map(c => `<div class="cap-item"><div class="cap-dot"></div><div class="cap-text">${e(c)}</div></div>`).join('')}</div></div>` : ''}
      ${rankCells.length > 0 ? `<div class="gg-block"><div class="gg-label">Ranking logic</div><div class="rank-row">${rankCells.map(r => `<div class="rank-cell"><div class="rank-label">${e(r.label)}</div><div class="rank-val">${e(r.value)}</div></div>`).join('')}</div></div>` : ''}
      <div class="tl-block" style="background:${fb};border-top:0.5px solid ${fc}">
        <div class="tl-header"><span class="tl-badge" style="background:${fc}">${fe}</span><span class="tl-lbl">Timeline feasibility</span></div>
        <p class="gg-text">${e(feasText)}</p>
      </div>
    `)

    if (report.priority_actions?.length > 0) {
      body += sec('Priority Actions', `<div class="actions-list">${report.priority_actions.map((a, i) => `
        <div class="action-row"><div class="action-num">${i + 1}</div><div class="action-text">${e(a)}</div></div>`).join('')}</div>`)
    }
  } else if (mode === 'DIAGNOSTIC') {
    if (report.goal_gap_analysis) {
      const gap = report.goal_gap_analysis
      const feasText = report.timeline_feasibility || gap.realistic_timeline || ''
      const fl = feasText.toLowerCase()
      const fe = fl.startsWith('unrealistic') ? 'unrealistic' : fl.startsWith('tight') ? 'tight' : 'feasible'
      const fc = fe === 'unrealistic' ? C.dangerText : fe === 'tight' ? C.warningText : C.successText
      const fb = fe === 'unrealistic' ? C.dangerBg : fe === 'tight' ? C.warningBg : C.successBg
      const caps = Array.isArray(report.missing_capabilities) ? report.missing_capabilities.filter(Boolean) : []
      const rankCells = report.ranking_logic ? [
        { label: 'Impact', value: report.ranking_logic.impact },
        { label: 'Urgency', value: report.ranking_logic.urgency },
        { label: 'Cost', value: report.ranking_logic.cost },
        { label: 'Blocked by', value: report.ranking_logic.dependency },
      ].filter(r => r.value) : []
      const moves = gap.fastest_path
        ? gap.fastest_path.split(/\n|(?<=\.)\s+(?=\d\.|\d\)|-|•)/).map(s => s.replace(/^[\d.\)\-•\s]+/, '').trim()).filter(Boolean)
        : []

      body += `
        <div class="gg-panel">
          <div class="gg-eyebrow">Goal Gap Analysis</div>
          <div class="gg-goal"><span class="gg-goal-label">Goal</span><span class="gg-goal-text">${e(gap.goal)}</span></div>
          <div class="gg-row">
            <div class="gg-half"><div class="gg-label">Where you are now</div><p class="gg-text">${e(gap.current_position)}</p></div>
            <div class="gg-half" style="border-right:none"><div class="gg-label">What's missing</div><p class="gg-text">${e(gap.gap)}</p></div>
          </div>
          <div class="gg-block">
            <div class="gg-label">Fastest path</div>
            <div class="move-list">${moves.length > 0
              ? moves.map((m, i) => `<div class="move"><div class="move-num">${i + 1}</div><div class="move-text">${e(m)}</div></div>`).join('')
              : `<p class="gg-text">${e(gap.fastest_path)}</p>`
            }</div>
          </div>
          ${caps.length > 0 ? `<div class="gg-block"><div class="gg-label">Missing capabilities</div><div class="cap-list">${caps.map(c => `<div class="cap-item"><div class="cap-dot"></div><div class="cap-text">${e(c)}</div></div>`).join('')}</div></div>` : ''}
          ${rankCells.length > 0 ? `<div class="gg-block"><div class="gg-label">Ranking</div><div class="rank-row">${rankCells.map(r => `<div class="rank-cell"><div class="rank-label">${e(r.label)}</div><div class="rank-val">${e(r.value)}</div></div>`).join('')}</div></div>` : ''}
          <div class="tl-block" style="background:${fb};border-top:0.5px solid ${fc}">
            <div class="tl-header"><span class="tl-badge" style="background:${fc}">${fe}</span><span class="tl-lbl">Timeline</span></div>
            <p class="gg-text">${e(feasText)}</p>
          </div>
        </div>`
    }

    if (report.domains?.length > 0) {
      body += sec('Domain Findings', `<div class="domain-grid">${report.domains.map(d => `
        <div class="domain-card" style="border-top:3px solid ${statusColor[d.status] ?? C.textMuted}">
          <div class="domain-top">
            <span class="domain-name">${e(d.name)}</span>
            <span class="badge" style="background:${statusBg[d.status] ?? C.surface2};color:${statusColor[d.status] ?? C.textMuted}">${statusLabel[d.status] ?? d.status}</span>
          </div>
          <p class="finding">${e(d.finding)}</p>
          <p class="act">→ ${e(d.action)}</p>
        </div>`).join('')}</div>`)
    }

    if (report.non_ai_fixes?.length > 0) {
      body += sec('Fix These First', report.non_ai_fixes.map(f => `
        <div class="fix-item"><div class="fix-issue">${e(f.issue)}</div><div class="fix-sol">${e(f.fix)}</div></div>`).join(''))
    }

    if (report.ai_opportunities?.length > 0) {
      body += sec("If You Actually Built This", report.ai_opportunities.map(a => `
        <div class="ai-item"><div class="ai-area">${e(a.area)}</div><div class="ai-why">${e(a.why)}</div></div>`).join(''))
    }

    if (report.priority_actions?.length > 0) {
      body += sec('Priority Actions', `<div class="actions-list">${report.priority_actions.map((a, i) => `
        <div class="action-row"><div class="action-num">${i + 1}</div><div class="action-text">${e(a)}</div></div>`).join('')}</div>`)
    }

    body += buildForwardTrajectoryHtml(report.forward_trajectory, e)
  }

  if (mode === 'EXECUTION') {
    if (report.delivery_plan?.length > 0) {
      body += sec('Delivery Plan', `<div class="plan-list">${report.delivery_plan.map(s => `
        <div class="plan-item"><div class="plan-step">${s.step}</div><div><div class="plan-action">${e(s.action)}</div><div class="plan-why">${e(s.why)}</div></div></div>`).join('')}</div>`)
    }
    if (report.what_to_expect) body += sec('What to Expect', `<p class="prose">${e(report.what_to_expect)}</p>`)
    if (report.key_message)    body += sec('Key Message', `<div class="key-msg"><p>${e(report.key_message)}</p></div>`)
    body += buildForwardTrajectoryHtml(report.forward_trajectory, e)
  }

  if (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN') {
    if (report.what_this_actually_is) body += sec('What This Actually Is', `<p class="prose">${e(report.what_this_actually_is)}</p>`)
    if (report.delivery_script)       body += sec('What to Say', `<div class="script"><p>${e(report.delivery_script)}</p></div>`)
    if (report.what_to_expect)        body += sec('What to Expect', `<p class="prose">${e(report.what_to_expect)}</p>`)
  }

  body += sec('The Honest Truth', `<div class="truth"><p>${e(report.honest_truth)}</p></div>`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SelfAudit Report — ${e(report.headline)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${C.bg};color:${C.text};font-size:14px;line-height:1.6}
.wrap{max-width:680px;margin:0 auto;padding:48px 32px 80px}
.label{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:${C.accent};margin-bottom:12px;display:block}
h1{font-size:28px;font-weight:400;line-height:1.2;margin-bottom:14px;color:${C.text}}
.verdict{font-size:15px;color:${C.textSoft};line-height:1.7;margin-bottom:14px}
.meta{font-size:12px;color:${C.textMuted}}
.section{margin-bottom:36px}
.section-title{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:${C.textMuted};margin-bottom:14px;font-weight:500}
.domain-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.domain-card{border:.5px solid ${C.border};border-radius:8px;padding:14px 16px;background:${C.surface}}
.domain-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.domain-name{font-size:13px;font-weight:500}
.badge{font-size:11px;padding:2px 9px;border-radius:100px;font-weight:500}
.finding{font-size:13px;color:${C.textSoft};line-height:1.6;margin-bottom:6px}
.act{font-size:12px;color:${C.text};font-style:italic}
.fix-item{background:${C.warningBg};border-radius:8px;padding:14px 16px;border:.5px solid ${C.warning};margin-bottom:10px}
.fix-issue{font-size:13px;font-weight:500;color:${C.warningText};margin-bottom:4px}
.fix-sol{font-size:13px;color:${C.text};line-height:1.6}
.ai-item{background:${C.accentSoft};border-radius:8px;padding:14px 16px;border:.5px solid ${C.border};margin-bottom:10px}
.ai-area{font-size:13px;font-weight:500;color:${C.accentText};margin-bottom:4px}
.ai-why{font-size:13px;color:${C.text};line-height:1.6}
.actions-list{display:flex;flex-direction:column;gap:10px}
.action-row{display:flex;gap:12px;align-items:flex-start}
.action-num{width:22px;height:22px;border-radius:50%;background:${C.surface2};color:${C.text};font-size:11px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px}
.action-text{font-size:14px;color:${C.text};line-height:1.6}
.truth{background:${C.surface2};border-radius:8px;padding:24px}
.truth p{font-size:15px;color:${C.text};line-height:1.7}
.plan-list{display:flex;flex-direction:column;gap:12px}
.plan-item{display:flex;gap:14px;align-items:flex-start}
.plan-step{width:26px;height:26px;border-radius:50%;background:${C.surface2};color:${C.text};font-size:12px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.plan-action{font-size:14px;font-weight:500;color:${C.text};margin-bottom:3px}
.plan-why{font-size:13px;color:${C.textSoft};line-height:1.6}
.prose{font-size:14px;color:${C.textSoft};line-height:1.75}
.key-msg{background:${C.surface2};border-radius:8px;padding:20px 24px}
.key-msg p{font-size:16px;color:${C.text};line-height:1.6}
.script{background:${C.surface2};border-left:3px solid ${C.accent};border-radius:0 8px 8px 0;padding:20px 24px}
.script p{font-size:14px;color:${C.text};line-height:1.8;white-space:pre-wrap}
.traj-wrap{background:${C.surface};border:.5px solid ${C.border};border-radius:8px;padding:18px}
.traj-header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.traj-badge{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;background:${C.accentSoft};color:${C.accentText};padding:4px 8px;border-radius:999px}
.traj-horizon{font-size:11px;color:${C.textMuted};text-transform:uppercase;letter-spacing:.5px}
.traj-summary{font-size:14px;color:${C.text};line-height:1.7;margin-bottom:16px}
.traj-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.traj-column{background:${C.surface2};border-radius:8px;padding:14px}
.traj-column-label{font-size:11px;font-weight:500;color:${C.textMuted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.traj-column-text{font-size:13px;color:${C.text};line-height:1.7}
.traj-table{display:flex;flex-direction:column;border:.5px solid ${C.border};border-radius:8px;overflow:hidden}
.traj-row{display:grid;grid-template-columns:1fr 1.2fr 1.2fr}
.traj-head{background:${C.surface2}}
.traj-row + .traj-row{border-top:.5px solid ${C.border}}
.traj-metric,.traj-value{padding:12px 14px;font-size:12px;line-height:1.6}
.traj-metric{font-weight:500;color:${C.text};border-right:.5px solid ${C.border}}
.traj-value{color:${C.textSoft};border-right:.5px solid ${C.border}}
.traj-row .traj-value:last-child{border-right:none}
.traj-confidence{margin-top:12px;font-size:12px;color:${C.textMuted};line-height:1.6}
.gg-panel{border:1.5px solid ${C.accent};border-radius:8px;overflow:hidden;margin-bottom:36px}
.gg-eyebrow{background:${C.accent};color:${C.buttonText};font-size:11px;font-weight:500;letter-spacing:.7px;text-transform:uppercase;padding:8px 18px}
.gg-goal{background:${C.accentSoft};padding:14px 18px;display:flex;gap:10px;align-items:baseline;border-bottom:.5px solid ${C.border}}
.gg-goal-label{font-size:11px;font-weight:500;color:${C.accentText};text-transform:uppercase;flex-shrink:0}
.gg-goal-text{font-size:15px;font-weight:500;color:${C.accentText}}
.gg-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:.5px solid ${C.border}}
.gg-half{padding:14px 18px;border-right:.5px solid ${C.border}}
.gg-block{padding:14px 18px;border-bottom:.5px solid ${C.border}}
.gg-label{font-size:11px;font-weight:500;color:${C.textMuted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.gg-text{font-size:13px;color:${C.textSoft};line-height:1.65}
.move-list{display:flex;flex-direction:column;gap:8px}
.move{display:flex;gap:10px;align-items:flex-start}
.move-num{width:20px;height:20px;border-radius:50%;background:${C.surface2};color:${C.text};font-size:10px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.move-text{font-size:13px;color:${C.text};line-height:1.6}
.cap-list{display:flex;flex-direction:column;gap:8px}
.cap-item{display:flex;gap:10px;align-items:flex-start}
.cap-dot{width:6px;height:6px;border-radius:50%;background:${C.surface2};flex-shrink:0;margin-top:5px}
.cap-text{font-size:13px;color:${C.text};line-height:1.6}
.rank-row{display:flex;gap:6px;flex-wrap:wrap}
.rank-cell{flex:1 1 90px;padding:8px 12px;background:${C.surface2};border-radius:6px}
.rank-label{font-size:10px;font-weight:500;color:${C.textMuted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.rank-val{font-size:12px;font-weight:500;color:${C.text}}
.tl-block{padding:14px 18px}
.tl-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.tl-badge{font-size:10px;font-weight:700;color:${C.buttonText};padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.6px}
.tl-lbl{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:${C.textMuted}}
footer{font-size:11px;color:${C.textMuted};text-align:center;margin-top:48px}
@media (max-width: 640px){.traj-columns,.traj-row{grid-template-columns:1fr}.traj-metric,.traj-value{border-right:none}.traj-row .traj-value{border-top:.5px solid ${C.border}}}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="wrap">
${body}
<footer>SelfAudit report · Built by <a href="https://vnklo.com" style="color:${C.accent}">Vnklo</a></footer>
</div>
</body>
</html>`
}

function GoalGapPanel({ gap, missingCapabilities, rankingLogic, timelineFeasibility, confidenceLevel }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const C = getThemeTokens(theme)
  // Resolve timeline status — prefer structured field, fall back to text parsing
  const feasibilityEnum = (() => {
    if (timelineFeasibility) {
      const l = timelineFeasibility.toLowerCase()
      if (l.startsWith('unrealistic')) return 'unrealistic'
      if (l.startsWith('tight'))       return 'tight'
      if (l.startsWith('feasible'))    return 'feasible'
    }
    const t = (gap.realistic_timeline || '').toLowerCase()
    if (t.includes('not achievable') || t.includes('unrealistic') || t.includes('too short') || t.includes('unlikely')) return 'unrealistic'
    if (t.includes('tight') || t.includes('challenging') || t.includes('aggressive') || t.includes('stretch'))          return 'tight'
    return 'feasible'
  })()
  const feasColor = feasibilityEnum === 'unrealistic' ? C.dangerText : feasibilityEnum === 'tight' ? C.warningText : C.successText
  const feasBg    = feasibilityEnum === 'unrealistic' ? C.dangerBg : feasibilityEnum === 'tight' ? C.warningBg : C.successBg
  const feasText  = timelineFeasibility || gap.realistic_timeline
  const feasBodyColor = feasColor

  // Confidence
  const confEnum = (() => {
    if (!confidenceLevel) return null
    const l = confidenceLevel.toLowerCase()
    if (l.startsWith('high'))   return 'high'
    if (l.startsWith('medium')) return 'medium'
    if (l.startsWith('low'))    return 'low'
    return null
  })()
  const confColor   = confEnum === 'high' ? C.successText : confEnum === 'medium' ? C.warningText : C.dangerText
  const confDetail  = confidenceLevel ? confidenceLevel.replace(/^(high|medium|low)\s*[—–\-]\s*/i, '') : ''

  // Parse fastest path into numbered items
  const fastestMoves = gap.fastest_path
    ? gap.fastest_path.split(/\n|(?<=\.)\s+(?=\d\.|\d\)|-|•)/).map(s => s.replace(/^[\d\.\)\-•\s]+/, '').trim()).filter(Boolean)
    : []

  const caps = Array.isArray(missingCapabilities) ? missingCapabilities.filter(Boolean) : []

  const rankCells = rankingLogic ? [
    { label: 'Impact',     value: rankingLogic.impact     },
    { label: 'Urgency',    value: rankingLogic.urgency    },
    { label: 'Cost',       value: rankingLogic.cost       },
    { label: 'Blocked by', value: rankingLogic.dependency },
  ].filter(r => r.value) : []

  return (
    <div style={gg.panel}>
      <div style={gg.eyebrow}>Goal Gap Analysis</div>

      {/* Goal */}
      <div style={gg.goalRow}>
        <div style={gg.goalLabel}>Goal</div>
        <div style={gg.goalText}>{gap.goal}</div>
      </div>

      {/* Current position + gap */}
      <div style={gg.row}>
        <div style={gg.half}>
          <div style={gg.blockLabel}>Where you are now</div>
          <p style={gg.blockText}>{gap.current_position}</p>
        </div>
        <div style={{ ...gg.half, borderRight: 'none' }}>
          <div style={gg.blockLabel}>What's missing</div>
          <p style={gg.blockText}>{gap.gap}</p>
        </div>
      </div>

      {/* Fastest path */}
      <div style={gg.fastestBlock}>
        <div style={gg.blockLabel}>Fastest path</div>
        <div style={gg.moveList}>
          {fastestMoves.length > 0
            ? fastestMoves.map((move, i) => (
                <div key={i} style={gg.move}>
                  <div style={gg.moveNum}>{i + 1}</div>
                  <div style={gg.moveText}>{move}</div>
                </div>
              ))
            : <p style={gg.blockText}>{gap.fastest_path}</p>
          }
        </div>
      </div>

      {/* Missing capabilities */}
      {caps.length > 0 && (
        <div style={gg.capsBlock}>
          <div style={gg.blockLabel}>Missing capabilities</div>
          <div style={gg.capList}>
            {caps.map((cap, i) => (
              <div key={i} style={gg.capItem}>
                <div style={gg.capDot} />
                <div style={gg.capText}>{cap}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking */}
      {rankCells.length > 0 && (
        <div style={gg.rankBlock}>
          <div style={gg.blockLabel}>Ranking</div>
          <div style={gg.rankRow}>
            {rankCells.map(r => (
              <div key={r.label} style={gg.rankCell}>
                <div style={gg.rankLabel}>{r.label}</div>
                <div style={gg.rankValue}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline feasibility */}
      <div style={{ ...gg.timelineBlock, background: feasBg, borderTop: `0.5px solid ${feasColor}` }}>
        <div style={gg.timelineHeader}>
          <span style={{ ...gg.feasBadge, background: feasColor }}>{feasibilityEnum}</span>
          <div style={{ ...gg.blockLabel, margin: 0 }}>Timeline</div>
        </div>
        <p style={{ ...gg.blockText, color: feasBodyColor }}>{feasText}</p>

        {confEnum && (
          <div style={gg.confRow}>
            <span style={{ ...gg.confDot, background: confColor }} />
            <span style={{ ...gg.confLabel, color: confColor }}>Confidence: {confEnum}</span>
            {confDetail && <span style={gg.confDetail}>{confDetail}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

function normalizeTrajectoryPoints(forwardTrajectory) {
  return Array.isArray(forwardTrajectory?.comparison_points)
    ? forwardTrajectory.comparison_points.filter(point =>
        point &&
        typeof point.metric === 'string' && point.metric.trim() &&
        typeof point.current_path === 'string' && point.current_path.trim() &&
        typeof point.recommended_path === 'string' && point.recommended_path.trim()
      )
    : []
}

function ForwardTrajectorySection({ forwardTrajectory, Section, styles }) {
  const points = normalizeTrajectoryPoints(forwardTrajectory)
  if (!forwardTrajectory || points.length === 0) return null

  return (
    <Section title="Forward Trajectory">
      <div style={styles.trajectoryWrap}>
        <div style={styles.trajectoryHeader}>
          {forwardTrajectory.dimension && (
            <span style={styles.trajectoryBadge}>{forwardTrajectory.dimension}</span>
          )}
          {forwardTrajectory.horizon && (
            <span style={styles.trajectoryHorizon}>{forwardTrajectory.horizon}</span>
          )}
        </div>

        {forwardTrajectory.summary && (
          <p style={styles.trajectorySummary}>{forwardTrajectory.summary}</p>
        )}

        <div style={styles.trajectoryColumns}>
          <div style={styles.trajectoryColumn}>
            <div style={styles.trajectoryColumnLabel}>If current path continues</div>
            <p style={styles.trajectoryColumnText}>{forwardTrajectory.if_current_path_continues}</p>
          </div>
          <div style={styles.trajectoryColumn}>
            <div style={styles.trajectoryColumnLabel}>If top recommendation is executed</div>
            <p style={styles.trajectoryColumnText}>{forwardTrajectory.if_top_recommendation_is_executed}</p>
          </div>
        </div>

        <div style={styles.trajectoryTable}>
          <div style={{ ...styles.trajectoryRow, ...styles.trajectoryTableHead }}>
            <div style={styles.trajectoryMetricCell}>Dimension</div>
            <div style={styles.trajectoryValueCell}>Current path</div>
            <div style={{ ...styles.trajectoryValueCell, borderRight: 'none' }}>Recommended path</div>
          </div>
          {points.map((point, index) => (
            <div
              key={`${point.metric}-${index}`}
              style={{
                ...styles.trajectoryRow,
                borderTop: index === 0 ? '0.5px solid var(--gray-200)' : '0.5px solid var(--gray-200)',
              }}
            >
              <div style={styles.trajectoryMetricCell}>{point.metric}</div>
              <div style={styles.trajectoryValueCell}>{point.current_path}</div>
              <div style={{ ...styles.trajectoryValueCell, borderRight: 'none' }}>{point.recommended_path}</div>
            </div>
          ))}
        </div>

        {forwardTrajectory.confidence_note && (
          <div style={styles.trajectoryConfidence}>
            <span style={styles.trajectoryConfidenceLabel}>Confidence note:</span> {forwardTrajectory.confidence_note}
          </div>
        )}
      </div>
    </Section>
  )
}

function buildForwardTrajectoryHtml(forwardTrajectory, e) {
  const points = normalizeTrajectoryPoints(forwardTrajectory)
  if (!forwardTrajectory || points.length === 0) return ''

  return `
    <div class="section">
      <div class="section-title">Forward Trajectory</div>
      <div class="traj-wrap">
        <div class="traj-header">
          ${forwardTrajectory.dimension ? `<span class="traj-badge">${e(forwardTrajectory.dimension)}</span>` : ''}
          ${forwardTrajectory.horizon ? `<span class="traj-horizon">${e(forwardTrajectory.horizon)}</span>` : ''}
        </div>
        ${forwardTrajectory.summary ? `<p class="traj-summary">${e(forwardTrajectory.summary)}</p>` : ''}
        <div class="traj-columns">
          <div class="traj-column">
            <div class="traj-column-label">If current path continues</div>
            <p class="traj-column-text">${e(forwardTrajectory.if_current_path_continues)}</p>
          </div>
          <div class="traj-column">
            <div class="traj-column-label">If top recommendation is executed</div>
            <p class="traj-column-text">${e(forwardTrajectory.if_top_recommendation_is_executed)}</p>
          </div>
        </div>
        <div class="traj-table">
          <div class="traj-row traj-head">
            <div class="traj-metric">Dimension</div>
            <div class="traj-value">Current path</div>
            <div class="traj-value">Recommended path</div>
          </div>
          ${points.map(point => `
            <div class="traj-row">
              <div class="traj-metric">${e(point.metric)}</div>
              <div class="traj-value">${e(point.current_path)}</div>
              <div class="traj-value">${e(point.recommended_path)}</div>
            </div>
          `).join('')}
        </div>
        ${forwardTrajectory.confidence_note ? `<div class="traj-confidence"><strong>Confidence note:</strong> ${e(forwardTrajectory.confidence_note)}</div>` : ''}
      </div>
    </div>`
}

function LoadingScreen({ theme }) {
  const themeVars = getThemeVars(theme)
  return (
    <div style={{ ...themeVars, ...styles.loadingPage }}>
      <nav style={styles.nav}>
        <div style={styles.logo}>self<span style={{ color: 'var(--accent)' }}>audit</span></div>
      </nav>
      <div style={styles.loadingBody}>
        <div style={styles.spinner} />
        <p style={styles.loadingTitle}>Building your report</p>
        <p style={styles.loadingSubtitle}>Analyzing your audit — this takes about 15 seconds.</p>
      </div>
    </div>
  )
}

function ErrorScreen({ error, theme }) {
  const themeVars = getThemeVars(theme)
  return (
    <div style={{ ...themeVars, ...styles.loadingPage }}>
      <nav style={styles.nav}>
        <div style={styles.logo}>self<span style={{ color: 'var(--accent)' }}>audit</span></div>
      </nav>
      <div style={styles.loadingBody}>
        <p style={{ color: 'var(--danger-text)', fontSize: 14 }}>Failed to generate report: {error}</p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2rem', borderBottom: '0.5px solid var(--gray-200)',
    background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10
  },
  logo: { fontSize: 16, fontWeight: 500, letterSpacing: '-0.4px' },
  navRight: { fontSize: 12, color: 'var(--gray-400)' },
  downloadBtn: {
    fontSize: 12, fontWeight: 500, color: 'var(--gray-600)',
    background: 'none', border: '0.5px solid var(--gray-200)',
    borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  content: { maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' },
  reportHeader: {
    marginBottom: '3rem', paddingBottom: '2rem',
    borderBottom: '0.5px solid var(--gray-200)'
  },
  reportLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--accent)', display: 'block', marginBottom: 12
  },
  headline: {
    fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: 400, lineHeight: 1.2, marginBottom: 16, color: 'var(--text)'
  },
  verdict: { fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 16 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: 'var(--gray-400)' },
  metaDot: { fontSize: 12, color: 'var(--gray-200)' },
  section: { marginBottom: '2.5rem' },
  sectionTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--gray-400)', marginBottom: '1rem', fontWeight: 500
  },
  domainsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12
  },
  domainCard: {
    background: 'var(--surface)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1rem 1.125rem'
  },
  domainTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  domainName: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  badge: { fontSize: 11, padding: '2px 9px', borderRadius: 'var(--radius-pill)', fontWeight: 500 },
  domainFinding: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 8 },
  domainAction: { fontSize: 12, color: 'var(--gray-800)', fontStyle: 'italic', lineHeight: 1.5 },
  fixList: { display: 'flex', flexDirection: 'column', gap: 10 },
  fixItem: {
    background: 'var(--warning-bg)', borderRadius: 'var(--radius)',
    padding: '1rem 1.125rem', border: '0.5px solid var(--warning)'
  },
  fixIssue: { fontSize: 13, fontWeight: 500, color: 'var(--warning-text)', marginBottom: 4 },
  fixSolution: { fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6 },
  aiList: { display: 'flex', flexDirection: 'column', gap: 10 },
  aiItem: {
    background: 'var(--green-light)', borderRadius: 'var(--radius)',
    padding: '1rem 1.125rem', border: '0.5px solid var(--green-mid)'
  },
  aiArea: { fontSize: 13, fontWeight: 500, color: 'var(--green-dark)', marginBottom: 4 },
  aiWhy: { fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6 },
  planList: { display: 'flex', flexDirection: 'column', gap: 10 },
  planItem: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  planStep: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 12, fontWeight: 500, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1
  },
  planAction: { fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 3 },
  planWhy: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  prose: { fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.75 },
  keyMessage: {
    background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem'
  },
  keyMessageText: { fontSize: 16, color: 'var(--text)', lineHeight: 1.6, margin: 0, fontFamily: 'var(--serif)', fontWeight: 400 },
  trajectoryWrap: {
    background: 'var(--surface)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1.125rem', overflowX: 'auto'
  },
  trajectoryHeader: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  trajectoryBadge: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase',
    background: 'var(--green-light)', color: 'var(--green-dark)', padding: '4px 8px', borderRadius: '999px'
  },
  trajectoryHorizon: { fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  trajectorySummary: { fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 1rem' },
  trajectoryColumns: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 },
  trajectoryColumn: { background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '0.875rem' },
  trajectoryColumnLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: 6
  },
  trajectoryColumnText: { fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 },
  trajectoryTable: {
    display: 'flex', flexDirection: 'column', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', overflow: 'hidden', minWidth: 540
  },
  trajectoryTableHead: { background: 'var(--surface2)' },
  trajectoryRow: { display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr' },
  trajectoryMetricCell: {
    padding: '0.75rem 0.875rem', fontSize: 12, lineHeight: 1.6, fontWeight: 500,
    color: 'var(--text)', borderRight: '0.5px solid var(--gray-200)'
  },
  trajectoryValueCell: {
    padding: '0.75rem 0.875rem', fontSize: 12, lineHeight: 1.6, color: 'var(--gray-700)',
    borderRight: '0.5px solid var(--gray-200)'
  },
  trajectoryConfidence: { marginTop: 12, fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6 },
  trajectoryConfidenceLabel: { fontWeight: 600, color: 'var(--gray-600)' },
  scriptBlock: {
    background: 'var(--gray-50)', borderLeft: '3px solid var(--green)',
    borderRadius: '0 var(--radius) var(--radius) 0', padding: '1.25rem 1.5rem'
  },
  scriptText: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  action: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  actionNum: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 11, fontWeight: 500, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1
  },
  actionText: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.6 },
  truth: {
    background: 'var(--surface2)', borderRadius: 'var(--radius)',
    padding: '1.5rem'
  },
  truthText: { fontSize: 15, color: 'var(--text)', lineHeight: 1.7, margin: 0 },
  anonPrompt: {
    marginTop: '3rem', marginBottom: '1rem',
    borderLeft: '3px solid var(--green)',
    background: 'var(--gray-50)',
    borderRadius: '0 var(--radius) var(--radius) 0',
    padding: '1.25rem 1.5rem',
    display: 'flex', gap: '1.5rem',
    alignItems: 'center', flexWrap: 'wrap',
  },
  anonLeft: { flex: 1, minWidth: 200 },
  anonTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 },
  anonBody: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  anonRight: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  anonBtn: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--green)', color: 'var(--button-text)',
    fontSize: 13, fontWeight: 500, padding: '9px 18px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  anonSignIn: {
    fontSize: 12, color: 'var(--gray-400)', textDecoration: 'none',
    cursor: 'pointer',
  },
  spinner: {
    width: 18, height: 18, borderRadius: '50%',
    border: '2px solid var(--gray-200)',
    borderTopColor: 'var(--green)',
    animation: 'spin 0.8s linear infinite'
  },
  disclaimer:  { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.6 },
  loadingPage: { minHeight: '100vh', background: 'var(--bg)' },
  loadingBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '70vh', gap: 16
  },
  loadingTitle: { fontSize: 18, fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--text)' },
  loadingSubtitle: { fontSize: 13, color: 'var(--gray-400)' }
}

const gg = {
  panel: {
    marginBottom: '2.5rem', borderRadius: 'var(--radius)',
    border: '1.5px solid var(--green)', overflow: 'hidden',
  },
  eyebrow: {
    background: 'var(--green)', color: 'var(--button-text)',
    fontSize: 11, fontWeight: 500, letterSpacing: '0.7px', textTransform: 'uppercase',
    padding: '8px 18px',
  },
  goalRow: {
    background: 'var(--green-light)', padding: '14px 18px',
    display: 'flex', alignItems: 'baseline', gap: 10,
    borderBottom: '0.5px solid var(--green-mid)',
  },
  goalLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--green-dark)',
    textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0,
  },
  goalText: {
    fontSize: 15, fontWeight: 500, color: 'var(--green-dark)', lineHeight: 1.5,
  },
  row: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 0, borderBottom: '0.5px solid var(--gray-200)',
  },
  half: {
    padding: '14px 18px',
    borderRight: '0.5px solid var(--gray-200)',
  },
  fastestBlock: {
    padding: '14px 18px',
    borderBottom: '0.5px solid var(--gray-200)',
  },
  blockLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--gray-400)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
  },
  blockText: {
    fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.65, margin: 0,
  },
  moveList: { display: 'flex', flexDirection: 'column', gap: 8 },
  move: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  moveNum: {
    width: 20, height: 20, borderRadius: '50%',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: 10, fontWeight: 500, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  moveText: { fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6 },
  timelineBlock: {
    padding: '14px 18px',
    borderRadius: '0 0 var(--radius) var(--radius)',
  },
  timelineHeader: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  feasBadge: {
    fontSize: 10, fontWeight: 700, color: 'var(--button-text)',
    padding: '2px 8px', borderRadius: 4,
    textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0,
  },
  timelineLabel: {
    fontSize: 11, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
  },
  capsBlock: {
    padding: '14px 18px',
    borderBottom: '0.5px solid var(--gray-200)',
  },
  capList: { display: 'flex', flexDirection: 'column', gap: 8 },
  capItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  capDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--surface2)', flexShrink: 0, marginTop: 5,
  },
  capText: { fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6 },
  rankBlock: {
    padding: '14px 18px',
    borderBottom: '0.5px solid var(--gray-200)',
  },
  rankRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  rankCell: {
    flex: '1 1 90px', padding: '8px 12px',
    background: 'var(--gray-100)', borderRadius: 6,
  },
  rankLabel: {
    fontSize: 10, fontWeight: 500, color: 'var(--gray-400)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3,
  },
  rankValue: { fontSize: 12, fontWeight: 500, color: 'var(--text)' },
  confRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  confDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  confLabel: { fontSize: 12, fontWeight: 500 },
  confDetail: { fontSize: 12, color: 'var(--gray-500)' },
}
