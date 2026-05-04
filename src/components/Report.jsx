import React, { useState } from 'react'
import * as Sentry from '@sentry/react'
import { generateReport, sendReportEmail } from '../lib/audit.js'
import { initSupabase } from '../lib/supabase.js'
import { usePostHog } from '@posthog/react'
import ExecutionPanel from './ExecutionPanel.jsx'

export default function Report({ userInfo, conversationHistory, sessionId }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareState, setShareState] = useState('idle') // idle | sending | sent | error
  const [downloadState, setDownloadState] = useState('idle') // idle | downloading
  const posthog = usePostHog()

  React.useEffect(() => {
    async function build() {
      try {
        const apiMessages = conversationHistory
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }))
        const r = await generateReport(apiMessages, {
          userId:       userInfo?.userId,
          goalMode:     userInfo?.goalMode     ?? false,
          goal:         userInfo?.goal         ?? '',
          goalTimeline: userInfo?.goalTimeline ?? '',
          goalBaseline: userInfo?.goalBaseline ?? '',
        })
        setReport(r)

        if (userInfo?.userId) {
          fetch('/api/save-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId:    userInfo.userId,
              sessionId,
              report:    r,
              industry:  userInfo.industry,
              domain:    userInfo.domain,
            }),
          }).catch(e => console.warn('[save-report] failed:', e?.message))

          initSupabase().then(async sb => {
            // Append to context — fetch existing first so history accumulates
            const newEntry = [
              r.headline,
              r.overall_verdict ?? r.execution_context ?? r.acknowledgment ?? '',
            ].filter(Boolean).join(' — ')

            const { data: profile } = await sb
              .from('profiles')
              .select('context')
              .eq('id', userInfo.userId)
              .single()
              .catch(() => ({ data: null }))

            const existing = profile?.context ? profile.context.trim() : ''
            const updatedContext = existing
              ? `${existing}\n\n[Audit ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}] ${newEntry}`
              : `[Audit ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}] ${newEntry}`

            sb.from('profiles')
              .update({ context: updatedContext })
              .eq('id', userInfo.userId)
              .catch(e => console.warn('[profiles] context update failed:', e?.message))
          })

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
    try {
      const html = buildReportHtml(report, userInfo)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const slug = (report.headline || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
      a.href = url
      a.download = `selfaudit-report-${slug}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.warn('[download] failed:', e.message)
    } finally {
      setDownloadState('idle')
    }
  }

  const handleShare = async () => {
    if (shareState !== 'idle') return
    setShareState('sending')
    posthog?.capture('report_shared', { email: userInfo?.email })
    try {
      await sendReportEmail({ userInfo, report })
      setShareState('sent')
    } catch (e) {
      Sentry.captureException(e)
      posthog?.captureException(e)
      setShareState('error')
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  const mode = report.conversation_mode ?? 'DIAGNOSTIC'
  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusBg = { strong: '#E1F5EE', needs_work: '#FAEEDA', critical: '#FCEBEB' }
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  const headerSubtext = mode === 'DIAGNOSTIC'
    ? report.overall_verdict
    : mode === 'EXECUTION'
      ? report.execution_context
      : report.acknowledgment

  const shareCopy = mode === 'DIAGNOSTIC'
    ? 'Share this report with Vnklo and discuss your first steps on implementing AI in the areas identified. One click — we\'ll reach out directly.'
    : 'Share this report with Vnklo and we\'ll reach out to talk through next steps. One click.'

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={() => window.location.reload()}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
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

      <div style={styles.content}>

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

        {/* DIAGNOSTIC sections */}
        {mode === 'DIAGNOSTIC' && <>
          {report.goal_gap_analysis && (
            <GoalGapPanel
              gap={report.goal_gap_analysis}
              missingCapabilities={report.missing_capabilities}
              rankingLogic={report.ranking_logic}
              timelineFeasibility={report.timeline_feasibility}
              confidenceLevel={report.confidence_level}
            />
          )}

          <Section title="Domain Findings">
            <div style={styles.domainsGrid}>
              {report.domains?.map((d, i) => (
                <div key={i} style={{ ...styles.domainCard, borderTop: `3px solid ${statusColor[d.status]}` }}>
                  <div style={styles.domainTop}>
                    <span style={styles.domainName}>{d.name}</span>
                    <span style={{
                      ...styles.badge,
                      background: statusBg[d.status],
                      color: statusColor[d.status]
                    }}>{statusLabel[d.status]}</span>
                  </div>
                  <p style={styles.domainFinding}>{d.finding}</p>
                  <p style={styles.domainAction}>→ {d.action}</p>
                </div>
              ))}
            </div>
          </Section>

          {report.non_ai_fixes?.length > 0 && (
            <Section title="Fix These First">
              <div style={styles.fixList}>
                {report.non_ai_fixes.map((f, i) => (
                  <div key={i} style={styles.fixItem}>
                    <div style={styles.fixIssue}>{f.issue}</div>
                    <div style={styles.fixSolution}>{f.fix}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {report.ai_opportunities?.length > 0 && (
            <Section title="What's Now Possible">
              <div style={styles.aiList}>
                {report.ai_opportunities.map((a, i) => (
                  <div key={i} style={styles.aiItem}>
                    <div style={styles.aiArea}>{a.area}</div>
                    <div style={styles.aiWhy}>{a.why}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Priority Actions">
            <div style={styles.actions}>
              {report.priority_actions?.map((a, i) => (
                <div key={i} style={styles.action}>
                  <div style={styles.actionNum}>{i + 1}</div>
                  <div style={styles.actionText}>{a}</div>
                </div>
              ))}
            </div>
          </Section>
        </>}

        {/* EXECUTION sections */}
        {mode === 'EXECUTION' && <>
          {report.delivery_plan?.length > 0 && (
            <Section title="Delivery Plan">
              <div style={styles.planList}>
                {report.delivery_plan.map((s, i) => (
                  <div key={i} style={styles.planItem}>
                    <div style={styles.planStep}>{s.step}</div>
                    <div>
                      <div style={styles.planAction}>{s.action}</div>
                      <div style={styles.planWhy}>{s.why}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {report.what_to_expect && (
            <Section title="What to Expect">
              <p style={styles.prose}>{report.what_to_expect}</p>
            </Section>
          )}

          {report.key_message && (
            <Section title="Key Message">
              <div style={styles.keyMessage}>
                <p style={styles.keyMessageText}>{report.key_message}</p>
              </div>
            </Section>
          )}
        </>}

        {/* HUMAN_MOMENT sections */}
        {mode === 'HUMAN_MOMENT' && <>
          {report.what_this_actually_is && (
            <Section title="What This Actually Is">
              <p style={styles.prose}>{report.what_this_actually_is}</p>
            </Section>
          )}

          {report.delivery_script && (
            <Section title="What to Say">
              <div style={styles.scriptBlock}>
                <p style={styles.scriptText}>{report.delivery_script}</p>
              </div>
            </Section>
          )}

          {report.what_to_expect && (
            <Section title="What to Expect">
              <p style={styles.prose}>{report.what_to_expect}</p>
            </Section>
          )}
        </>}

        {/* Honest Truth — shared across all modes */}
        <Section title="The Honest Truth">
          <div style={styles.truth}>
            <p style={styles.truthText}>{report.honest_truth}</p>
          </div>
        </Section>

        {mode === 'DIAGNOSTIC' && (
          <ExecutionPanel report={report} userInfo={userInfo} />
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

        {/* Share CTA */}
        <div data-pdf-hide style={styles.shareCta}>
          <div style={styles.shareCard}>
            <div style={styles.shareLeft}>
              <p style={styles.shareTitle}>Want to act on this?</p>
              <p style={styles.shareBody}>{shareCopy}</p>
            </div>
            <div style={styles.shareRight}>
              {shareState === 'idle' && (
                <button style={styles.shareBtn} onClick={handleShare}>
                  Share with Vnklo
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 7 }}>
                    <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              {shareState === 'sending' && (
                <div style={styles.shareStatus}>
                  <div style={styles.spinner} />
                  Sending...
                </div>
              )}
              {shareState === 'sent' && (
                <div style={{ ...styles.shareStatus, color: 'var(--green)' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sent — Vnklo will be in touch.
                </div>
              )}
              {shareState === 'error' && (
                <div style={{ ...styles.shareStatus, color: '#A32D2D', flexDirection: 'column', gap: 6 }}>
                  <span>Failed to send.</span>
                  <button style={styles.retryBtn} onClick={() => { setShareState('idle') }}>Try again</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <p style={styles.disclaimer}>
          This report is for your eyes only and is displayed on-screen. Built by <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: 'var(--green)' }}>Vnklo</a>.
        </p>

      </div>
    </div>
  )
}

function buildReportHtml(report, userInfo) {
  const mode = report.conversation_mode ?? 'DIAGNOSTIC'
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const e = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const sec = (title, body) => `<div class="section"><div class="section-title">${e(title)}</div>${body}</div>`

  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusBg    = { strong: '#E1F5EE', needs_work: '#FAEEDA', critical: '#FCEBEB' }
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  const headerSub = mode === 'DIAGNOSTIC' ? report.overall_verdict
    : mode === 'EXECUTION' ? report.execution_context
    : report.acknowledgment

  let body = `
    <div style="margin-bottom:40px;padding-bottom:28px;border-bottom:0.5px solid #e0e0e0;">
      <span class="label">Your Audit Report</span>
      <h1>${e(report.headline)}</h1>
      ${headerSub ? `<p class="verdict">${e(headerSub)}</p>` : ''}
      <div class="meta">${e(userInfo?.name ?? '')} · ${e(date)}</div>
    </div>`

  if (mode === 'DIAGNOSTIC') {
    if (report.goal_gap_analysis) {
      const gap = report.goal_gap_analysis
      const feasText = report.timeline_feasibility || gap.realistic_timeline || ''
      const fl = feasText.toLowerCase()
      const fe = fl.startsWith('unrealistic') ? 'unrealistic' : fl.startsWith('tight') ? 'tight' : 'feasible'
      const fc = fe === 'unrealistic' ? '#A32D2D' : fe === 'tight' ? '#BA7517' : '#1D9E75'
      const fb = fe === 'unrealistic' ? '#FCEBEB' : fe === 'tight' ? '#FAEEDA' : '#E1F5EE'
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
        <div class="domain-card" style="border-top:3px solid ${statusColor[d.status] ?? '#888'}">
          <div class="domain-top">
            <span class="domain-name">${e(d.name)}</span>
            <span class="badge" style="background:${statusBg[d.status] ?? '#eee'};color:${statusColor[d.status] ?? '#888'}">${statusLabel[d.status] ?? d.status}</span>
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
      body += sec("What's Now Possible", report.ai_opportunities.map(a => `
        <div class="ai-item"><div class="ai-area">${e(a.area)}</div><div class="ai-why">${e(a.why)}</div></div>`).join(''))
    }

    if (report.priority_actions?.length > 0) {
      body += sec('Priority Actions', `<div class="actions-list">${report.priority_actions.map((a, i) => `
        <div class="action-row"><div class="action-num">${i + 1}</div><div class="action-text">${e(a)}</div></div>`).join('')}</div>`)
    }
  }

  if (mode === 'EXECUTION') {
    if (report.delivery_plan?.length > 0) {
      body += sec('Delivery Plan', `<div class="plan-list">${report.delivery_plan.map(s => `
        <div class="plan-item"><div class="plan-step">${s.step}</div><div><div class="plan-action">${e(s.action)}</div><div class="plan-why">${e(s.why)}</div></div></div>`).join('')}</div>`)
    }
    if (report.what_to_expect) body += sec('What to Expect', `<p class="prose">${e(report.what_to_expect)}</p>`)
    if (report.key_message)    body += sec('Key Message', `<div class="key-msg"><p>${e(report.key_message)}</p></div>`)
  }

  if (mode === 'HUMAN_MOMENT') {
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
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#111;font-size:14px;line-height:1.6}
.wrap{max-width:680px;margin:0 auto;padding:48px 32px 80px}
.label{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#1D9E75;margin-bottom:12px;display:block}
h1{font-size:28px;font-weight:400;line-height:1.2;margin-bottom:14px;color:#111}
.verdict{font-size:15px;color:#555;line-height:1.7;margin-bottom:14px}
.meta{font-size:12px;color:#888}
.section{margin-bottom:36px}
.section-title{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#888;margin-bottom:14px;font-weight:500}
.domain-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.domain-card{border:.5px solid #e0e0e0;border-radius:8px;padding:14px 16px}
.domain-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.domain-name{font-size:13px;font-weight:500}
.badge{font-size:11px;padding:2px 9px;border-radius:100px;font-weight:500}
.finding{font-size:13px;color:#555;line-height:1.6;margin-bottom:6px}
.act{font-size:12px;color:#333;font-style:italic}
.fix-item{background:#FAEEDA;border-radius:8px;padding:14px 16px;border:.5px solid #FAC775;margin-bottom:10px}
.fix-issue{font-size:13px;font-weight:500;color:#854F0B;margin-bottom:4px}
.fix-sol{font-size:13px;color:#333;line-height:1.6}
.ai-item{background:#E1F5EE;border-radius:8px;padding:14px 16px;border:.5px solid #9FE1CB;margin-bottom:10px}
.ai-area{font-size:13px;font-weight:500;color:#0F6E56;margin-bottom:4px}
.ai-why{font-size:13px;color:#333;line-height:1.6}
.actions-list{display:flex;flex-direction:column;gap:10px}
.action-row{display:flex;gap:12px;align-items:flex-start}
.action-num{width:22px;height:22px;border-radius:50%;background:#111;color:#fff;font-size:11px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px}
.action-text{font-size:14px;color:#333;line-height:1.6}
.truth{background:#111;border-radius:8px;padding:24px}
.truth p{font-size:15px;color:#fff;line-height:1.7}
.plan-list{display:flex;flex-direction:column;gap:12px}
.plan-item{display:flex;gap:14px;align-items:flex-start}
.plan-step{width:26px;height:26px;border-radius:50%;background:#111;color:#fff;font-size:12px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.plan-action{font-size:14px;font-weight:500;color:#111;margin-bottom:3px}
.plan-why{font-size:13px;color:#555;line-height:1.6}
.prose{font-size:14px;color:#555;line-height:1.75}
.key-msg{background:#111;border-radius:8px;padding:20px 24px}
.key-msg p{font-size:16px;color:#fff;line-height:1.6}
.script{background:#f9f9f9;border-left:3px solid #1D9E75;border-radius:0 8px 8px 0;padding:20px 24px}
.script p{font-size:14px;color:#333;line-height:1.8;white-space:pre-wrap}
.gg-panel{border:1.5px solid #1D9E75;border-radius:8px;overflow:hidden;margin-bottom:36px}
.gg-eyebrow{background:#1D9E75;color:#fff;font-size:11px;font-weight:500;letter-spacing:.7px;text-transform:uppercase;padding:8px 18px}
.gg-goal{background:#E1F5EE;padding:14px 18px;display:flex;gap:10px;align-items:baseline;border-bottom:.5px solid #9FE1CB}
.gg-goal-label{font-size:11px;font-weight:500;color:#0F6E56;text-transform:uppercase;flex-shrink:0}
.gg-goal-text{font-size:15px;font-weight:500;color:#0F6E56}
.gg-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:.5px solid #e0e0e0}
.gg-half{padding:14px 18px;border-right:.5px solid #e0e0e0}
.gg-block{padding:14px 18px;border-bottom:.5px solid #e0e0e0}
.gg-label{font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.gg-text{font-size:13px;color:#555;line-height:1.65}
.move-list{display:flex;flex-direction:column;gap:8px}
.move{display:flex;gap:10px;align-items:flex-start}
.move-num{width:20px;height:20px;border-radius:50%;background:#111;color:#fff;font-size:10px;font-weight:500;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.move-text{font-size:13px;color:#333;line-height:1.6}
.cap-list{display:flex;flex-direction:column;gap:8px}
.cap-item{display:flex;gap:10px;align-items:flex-start}
.cap-dot{width:6px;height:6px;border-radius:50%;background:#111;flex-shrink:0;margin-top:5px}
.cap-text{font-size:13px;color:#333;line-height:1.6}
.rank-row{display:flex;gap:6px;flex-wrap:wrap}
.rank-cell{flex:1 1 90px;padding:8px 12px;background:#f3f3f3;border-radius:6px}
.rank-label{font-size:10px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.rank-val{font-size:12px;font-weight:500;color:#111}
.tl-block{padding:14px 18px}
.tl-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.tl-badge{font-size:10px;font-weight:700;color:#fff;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.6px}
.tl-lbl{font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#888}
footer{font-size:11px;color:#aaa;text-align:center;margin-top:48px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="wrap">
${body}
<footer>SelfAudit report · Built by <a href="https://vnklo.com" style="color:#1D9E75">Vnklo</a></footer>
</div>
</body>
</html>`
}

function GoalGapPanel({ gap, missingCapabilities, rankingLogic, timelineFeasibility, confidenceLevel }) {
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
  const feasColor = feasibilityEnum === 'unrealistic' ? '#A32D2D' : feasibilityEnum === 'tight' ? '#BA7517' : '#1D9E75'
  const feasBg    = feasibilityEnum === 'unrealistic' ? '#FCEBEB' : feasibilityEnum === 'tight' ? '#FAEEDA' : '#E1F5EE'
  const feasText  = timelineFeasibility || gap.realistic_timeline
  const feasBodyColor = feasColor === '#1D9E75' ? '#0F6E56' : feasColor === '#BA7517' ? '#854F0B' : '#7A1A1A'

  // Confidence
  const confEnum = (() => {
    if (!confidenceLevel) return null
    const l = confidenceLevel.toLowerCase()
    if (l.startsWith('high'))   return 'high'
    if (l.startsWith('medium')) return 'medium'
    if (l.startsWith('low'))    return 'low'
    return null
  })()
  const confColor   = confEnum === 'high' ? '#1D9E75' : confEnum === 'medium' ? '#BA7517' : '#A32D2D'
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

function LoadingScreen() {
  return (
    <div style={styles.loadingPage}>
      <nav style={styles.nav}>
        <div style={styles.logo}>self<span style={{ color: 'var(--green)' }}>audit</span></div>
      </nav>
      <div style={styles.loadingBody}>
        <div style={styles.spinner} />
        <p style={styles.loadingTitle}>Building your report</p>
        <p style={styles.loadingSubtitle}>Analyzing your audit — this takes about 15 seconds.</p>
      </div>
    </div>
  )
}

function ErrorScreen({ error }) {
  return (
    <div style={styles.loadingPage}>
      <nav style={styles.nav}>
        <div style={styles.logo}>self<span style={{ color: 'var(--green)' }}>audit</span></div>
      </nav>
      <div style={styles.loadingBody}>
        <p style={{ color: '#A32D2D', fontSize: 14 }}>Failed to generate report: {error}</p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--white)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2rem', borderBottom: '0.5px solid var(--gray-200)',
    background: 'var(--white)', position: 'sticky', top: 0, zIndex: 10
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
    color: 'var(--green)', display: 'block', marginBottom: 12
  },
  headline: {
    fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 4vw, 32px)',
    fontWeight: 400, lineHeight: 1.2, marginBottom: 16, color: 'var(--black)'
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
    background: 'var(--white)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1rem 1.125rem'
  },
  domainTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  domainName: { fontSize: 13, fontWeight: 500, color: 'var(--black)' },
  badge: { fontSize: 11, padding: '2px 9px', borderRadius: 'var(--radius-pill)', fontWeight: 500 },
  domainFinding: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 8 },
  domainAction: { fontSize: 12, color: 'var(--gray-800)', fontStyle: 'italic', lineHeight: 1.5 },
  fixList: { display: 'flex', flexDirection: 'column', gap: 10 },
  fixItem: {
    background: '#FAEEDA', borderRadius: 'var(--radius)',
    padding: '1rem 1.125rem', border: '0.5px solid #FAC775'
  },
  fixIssue: { fontSize: 13, fontWeight: 500, color: '#854F0B', marginBottom: 4 },
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
    background: 'var(--black)', color: 'white',
    fontSize: 12, fontWeight: 500, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1
  },
  planAction: { fontSize: 14, fontWeight: 500, color: 'var(--black)', marginBottom: 3 },
  planWhy: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  prose: { fontSize: 14, color: 'var(--gray-700)', lineHeight: 1.75 },
  keyMessage: {
    background: 'var(--black)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem'
  },
  keyMessageText: { fontSize: 16, color: 'white', lineHeight: 1.6, margin: 0, fontFamily: 'var(--serif)', fontWeight: 400 },
  scriptBlock: {
    background: 'var(--gray-50, #F9F9F9)', borderLeft: '3px solid var(--green)',
    borderRadius: '0 var(--radius) var(--radius) 0', padding: '1.25rem 1.5rem'
  },
  scriptText: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' },
  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  action: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  actionNum: {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--black)', color: 'white',
    fontSize: 11, fontWeight: 500, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginTop: 1
  },
  actionText: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.6 },
  truth: {
    background: 'var(--black)', borderRadius: 'var(--radius)',
    padding: '1.5rem'
  },
  truthText: { fontSize: 15, color: 'white', lineHeight: 1.7, margin: 0 },
  anonPrompt: {
    marginTop: '3rem', marginBottom: '1rem',
    borderLeft: '3px solid var(--green)',
    background: 'var(--gray-50, #F9F9F9)',
    borderRadius: '0 var(--radius) var(--radius) 0',
    padding: '1.25rem 1.5rem',
    display: 'flex', gap: '1.5rem',
    alignItems: 'center', flexWrap: 'wrap',
  },
  anonLeft: { flex: 1, minWidth: 200 },
  anonTitle: { fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 6 },
  anonBody: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  anonRight: { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  anonBtn: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 13, fontWeight: 500, padding: '9px 18px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  anonSignIn: {
    fontSize: 12, color: 'var(--gray-400)', textDecoration: 'none',
    cursor: 'pointer',
  },
  shareCta: { marginTop: '1rem', marginBottom: '1.5rem' },
  shareCard: {
    border: '1.5px solid var(--green)', borderRadius: 'var(--radius)',
    padding: '1.5rem', display: 'flex', gap: '1.5rem',
    alignItems: 'center', flexWrap: 'wrap'
  },
  shareLeft: { flex: 1, minWidth: 200 },
  shareTitle: { fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--black)' },
  shareBody: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  shareRight: { flexShrink: 0 },
  shareBtn: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 14, fontWeight: 500, padding: '11px 20px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s', whiteSpace: 'nowrap'
  },
  shareStatus: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: 'var(--gray-600)'
  },
  retryBtn: {
    fontSize: 12, color: 'var(--green)', background: 'none',
    border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0
  },
  spinner: {
    width: 18, height: 18, borderRadius: '50%',
    border: '2px solid var(--gray-200)',
    borderTopColor: 'var(--green)',
    animation: 'spin 0.8s linear infinite'
  },
  disclaimer:  { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.6 },
  loadingPage: { minHeight: '100vh', background: 'var(--white)' },
  loadingBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '70vh', gap: 16
  },
  loadingTitle: { fontSize: 18, fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--black)' },
  loadingSubtitle: { fontSize: 13, color: 'var(--gray-400)' }
}

const gg = {
  panel: {
    marginBottom: '2.5rem', borderRadius: 'var(--radius)',
    border: '1.5px solid var(--green)', overflow: 'hidden',
  },
  eyebrow: {
    background: 'var(--green)', color: 'white',
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
    background: 'var(--black)', color: 'white',
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
    fontSize: 10, fontWeight: 700, color: 'white',
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
    background: 'var(--black)', flexShrink: 0, marginTop: 5,
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
  rankValue: { fontSize: 12, fontWeight: 500, color: 'var(--black)' },
  confRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  confDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  confLabel: { fontSize: 12, fontWeight: 500 },
  confDetail: { fontSize: 12, color: 'var(--gray-500)' },
}
