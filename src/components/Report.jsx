import React, { useState } from 'react'
import { generateReport, sendReportEmail } from '../lib/audit.js'

export default function Report({ userInfo, conversationHistory, apiKey }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareState, setShareState] = useState('idle') // idle | sending | sent | error

  React.useEffect(() => {
    async function build() {
      try {
        const apiMessages = conversationHistory
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }))
        const r = await generateReport(apiMessages)
        setReport(r)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    build()
  }, [])

  const handleShare = async () => {
    if (shareState !== 'idle') return
    setShareState('sending')
    try {
      await sendReportEmail({ userInfo, report })
      setShareState('sent')
    } catch (e) {
      setShareState('error')
    }
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} />

  const statusColor = { strong: '#1D9E75', needs_work: '#BA7517', critical: '#A32D2D' }
  const statusBg = { strong: '#E1F5EE', needs_work: '#FAEEDA', critical: '#FCEBEB' }
  const statusLabel = { strong: 'Strong', needs_work: 'Needs Work', critical: 'Critical' }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={() => window.location.reload()}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.navRight}>Audit Report</div>
      </nav>

      <div style={styles.content}>

        {/* Header */}
        <div style={styles.reportHeader}>
          <span style={styles.reportLabel}>Your Audit Report</span>
          <h1 style={styles.headline}>{report.headline}</h1>
          <p style={styles.verdict}>{report.overall_verdict}</p>
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginRight: 5 }}>
                <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1.5 10.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {userInfo.name}
            </span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>{userInfo.context}</span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Domain Cards */}
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

        {/* Non-AI Fixes */}
        {report.non_ai_fixes?.length > 0 && (
          <Section title="Fix These First — No AI Needed">
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

        {/* AI Opportunities */}
        {report.ai_opportunities?.length > 0 && (
          <Section title="Where AI Actually Applies">
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

        {/* Priority Actions */}
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

        {/* Honest Truth */}
        <Section title="The Honest Truth">
          <div style={styles.truth}>
            <p style={styles.truthText}>{report.honest_truth}</p>
          </div>
        </Section>

        {/* Share CTA */}
        <div style={styles.shareCta}>
          <div style={styles.shareCard}>
            <div style={styles.shareLeft}>
              <p style={styles.shareTitle}>Want to act on this?</p>
              <p style={styles.shareBody}>Share this report with Vnklo and discuss your first steps on implementing AI in the areas identified. One click — we'll reach out directly.</p>
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
  shareCta: { marginTop: '3rem', marginBottom: '1.5rem' },
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
  disclaimer: { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.6 },
  loadingPage: { minHeight: '100vh', background: 'var(--white)' },
  loadingBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '70vh', gap: 16
  },
  loadingTitle: { fontSize: 18, fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--black)' },
  loadingSubtitle: { fontSize: 13, color: 'var(--gray-400)' }
}
