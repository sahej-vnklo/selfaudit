import React, { useState, useEffect, useRef } from 'react'
import { usePostHog } from '@posthog/react'

const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161616',
  surface3: '#1C1C1C',
  ink: '#E8E4DC',
  inkSoft: '#C8C4BC',
  inkMuted: '#888888',
  inkFaint: '#444444',
  accent: '#6B5CE7',
  accentDark: '#5849D0',
  accentSoft: '#1A1630',
  accentText: '#9D8FF0',
  border: '#222222',
  border2: '#2A2A2A',
  card: '#141414',
  redMuted: 'rgba(192, 80, 80, 0.78)',
  redSoft: '#1A0A0A',
  amber: '#C9A040',
}

const serif = "'Playfair Display', Georgia, serif"
const wrap = { maxWidth: 1140, margin: '0 auto', padding: '0 28px' }

const sectionLabel = {
  textAlign: 'center',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: C.inkFaint,
  marginBottom: 16,
  fontWeight: 600,
}

const h2Style = {
  fontFamily: serif,
  fontSize: 'clamp(30px, 4vw, 48px)',
  fontWeight: 700,
  lineHeight: 1.05,
  letterSpacing: '-0.04em',
  textAlign: 'center',
  marginBottom: 18,
  color: C.ink,
}

// ── Data ──────────────────────────────────────────────────────────────────────

const compareRows = [
  { dim: 'Waiting weeks for a calendar invite', old: 'Full-day event / 4-8 weeks', neo: '5 minutes (Real-time)' },
  { dim: 'Paying for generic advice', old: 'Generic templates & frameworks', neo: 'Domain-Specific Logic (Facts)' },
  { dim: 'Solving one problem at a time', old: 'Speaker-dependent domain', neo: 'Persistent Intelligence (Scale)' },
  { dim: 'Billed by the session', old: 'Once a year / Billed per session', neo: 'Always monitoring your health' },
  { dim: 'Guesswork & intuition', old: 'Human bias, agenda, and error', neo: 'Pattern Recognition (The Edge)' },
]

const verdictCards = [
  {
    badge: 'Critical · Operations',
    badgeBg: '#1A0A0A',
    badgeColor: '#C05050',
    symptom: '"QC team is burning cash on mistakes."',
    reveal: 'Root cause traced to a non-existent accountability protocol — not a tech failure.',
    outcome: 'Process redesign + automated performance oversight.',
    industry: 'Manufacturing',
    time: '6 min',
    findings: '3 critical · 2 needs-work',
  },
  {
    badge: 'Critical · Strategy',
    badgeBg: '#1A1508',
    badgeColor: '#C9A040',
    symptom: '"Revenue is flat despite heavy effort."',
    reveal: 'Seasonal capital model misaligned with actual service capacity.',
    outcome: 'Pricing model restructure + real-time capacity-to-revenue tracking.',
    industry: 'Service business',
    time: '5 min',
    findings: '4 critical',
  },
  {
    badge: 'Needs work · People',
    badgeBg: '#0A1A10',
    badgeColor: '#4A9E6B',
    symptom: '"We need to automate, but the product isn\'t ready."',
    reveal: 'Management churn is the actual bottleneck — not technical debt.',
    outcome: 'Hiring brief + Team alignment SOPs removed organisational drag.',
    industry: 'SaaS (25 employees)',
    time: '7 min',
    findings: '2 critical · 3 needs-work',
  },
]

const diagnosticThreads = [
  { domain: 'Pricing', industry: 'Agency', q: 'Are you charging for the product or the complexity?', a: 'CRITICAL: You\'re subsidising client inefficiencies. Raise price or cut scope.' },
  { domain: 'Sales', industry: 'SaaS', q: 'What happens after a demo that doesn\'t close?', a: 'NEEDS WORK: No structured follow-up loop. Leads dying in silence.' },
  { domain: 'Operations', industry: 'E-commerce', q: 'Who owns fulfilment errors end-to-end?', a: 'CRITICAL: Accountability gap. Errors are absorbed, not resolved.' },
  { domain: 'Finance', industry: 'Consulting', q: 'Do you know your real cost-per-delivered-hour?', a: 'CRITICAL: You\'re likely running 30% below target margin unknowingly.' },
  { domain: 'People & HR', industry: 'SaaS', q: 'Are your two lowest performers costing more than their salary?', a: 'CRITICAL: Replace before automating. Automation scales dysfunction.' },
  { domain: 'Marketing', industry: 'Agency', q: 'Can you trace every lead to a specific acquisition channel?', a: 'NEEDS WORK: Blind spend. You\'re paying for channels you can\'t measure.' },
  { domain: 'Strategy', industry: 'Manufacturing', q: 'What\'s the single constraint stopping your next revenue tier?', a: 'CRITICAL: Capacity illusion. You\'re solving demand problems, not supply ones.' },
  { domain: 'Product', industry: 'SaaS', q: 'Are users churning before they hit the activation moment?', a: 'CRITICAL: Onboarding is leaking value. Fix this before more features.' },
]

const intelligencePillars = [
  {
    title: 'Trained on the hard stuff.',
    body: 'We ingested the playbooks of scaled businesses and studied exactly where the ones that failed went wrong. That pattern library is not available to a human consultant charging $400/hr.',
  },
  {
    title: 'No conflict of interest. Ever.',
    body: 'Most consultants are incentivised to keep you as a client. Our Intelligence Layer is incentivised to solve the problem and get you to the next stage — even if that means telling you something brutal.',
  },
  {
    title: 'Cross-domain systems view.',
    body: 'Businesses fail because they apply a marketing fix to a pricing problem. We map dependencies across your entire operation. If the leak is in Finance, we don\'t look at your Ads.',
  },
  {
    title: 'The moat compounds over time.',
    body: 'Every audit feeds the Intelligence Layer. The more you use it, the more precise the pattern recognition. Unlike a consultant, our system gets smarter every time you engage.',
  },
]

const aiCards = [
  {
    num: '1',
    title: 'When we say no.',
    body: 'Most of the time, the answer is no. A pricing problem is not an AI problem. A bad hire is not an AI problem. A broken sales process is not an AI problem. SelfAudit will name the real issue, even if it is less interesting than "deploy an agent."',
  },
  {
    num: '2',
    title: 'When we say yes.',
    body: 'When AI genuinely fits, you will know exactly where: the workflow, the likely ROI, and the order of operations. No vague "AI for ops." Real specifics on where automation creates compounding leverage.',
  },
  {
    num: '3',
    title: 'Why we can tell.',
    body: 'SelfAudit has run audits across industries and functions. It has seen what compounded for a 5-person agency and what wasted six figures at a 50-person firm. That pattern library is the difference between advice and judgment.',
  },
]

const growthIntelligence = [
  'Persistent business state model',
  'Memory across audits',
  'Business health score',
  'Goal progress tracking across re-audits',
  'Intelligence brief (MRR, CAC, LTV, churn, margins)',
  'File upload and parsing (P&L, balance sheet, pitch deck)',
  'Industry-personalised financial metrics',
  'Pattern intelligence',
]

const growthExecution = [
  'Action plan generation',
  'SOP generation',
  'Process redesign documents',
  'Pricing model restructure',
  'Hiring brief generation',
  'Email drafts',
]

const growthDashboard = [
  'Open issues tracker with severity ranking',
  'Business health score dashboard',
  'Domain-level score breakdown',
  'Goal progress bar',
  'Audit history timeline',
  'Re-engagement alerts',
  'Report status tracking',
]

const growthIntegrations = [
  'Webhook notifications (Slack, Teams, Discord, any app)',
  'Weekly digest email',
  'Scheduled re-audits',
]

const freeFeatures = [
  'Root cause diagnosis',
  '6-10 question deep audit conversation',
  'Multi-domain coverage',
  'Industry-specific questioning (40+ industries)',
  'Goal gap analysis',
  'Ranked priority actions',
  'Non-AI fixes identified first',
  'AI opportunity breakdown',
  'Honest truth summary',
  'Report download (HTML)',
  'Share report with Vnklo',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryButton({ label, onClick, small = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: hovered ? C.accentDark : C.accent,
        color: '#fff',
        padding: small ? '10px 18px' : '16px 28px',
        borderRadius: 999,
        fontSize: small ? 14 : 16,
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.18s ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
      <span style={{ fontSize: small ? 16 : 18 }}>→</span>
    </button>
  )
}

function OutlineButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: hovered ? C.surface2 : 'transparent',
        color: C.ink,
        padding: '14px 22px',
        borderRadius: 999,
        fontSize: 15,
        fontWeight: 600,
        border: `1px solid ${C.border2}`,
        cursor: 'pointer',
        transition: 'background 0.18s ease, border-color 0.18s ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function FeatureList({ items, color = C.inkSoft, iconColor = C.accentText, icon = '✓' }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color, fontSize: 14 }}>
          <span style={{ color: iconColor, flexShrink: 0, fontWeight: 700, lineHeight: 1.5 }}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Diagnostic Loop ───────────────────────────────────────────────────────────

function DiagnosticLoop() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('question') // 'question' | 'answer'
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const intervalRef = useRef(null)

  const thread = diagnosticThreads[currentIndex]

  useEffect(() => {
    if (paused || expanded) return
    intervalRef.current = setInterval(() => {
      setPhase((p) => {
        if (p === 'question') return 'answer'
        setCurrentIndex((i) => (i + 1) % diagnosticThreads.length)
        return 'question'
      })
    }, 2200)
    return () => clearInterval(intervalRef.current)
  }, [paused, expanded, currentIndex])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { if (!expanded) setPaused(false) }}
      style={{ maxWidth: 720, margin: '0 auto', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{
        background: C.card,
        border: `1px solid ${expanded ? C.accent : C.border}`,
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'border-color 0.25s ease',
        boxShadow: expanded ? `0 0 40px rgba(107,92,231,0.15)` : 'none',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 22px',
          borderBottom: `1px solid ${C.border}`,
          background: C.surface2,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.inkFaint, marginLeft: 6, letterSpacing: '0.08em' }}>
            selfaudit · intelligence engine
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {!expanded && !paused && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28CA41', animation: 'pulse 1.5s infinite' }} />
            )}
            <span style={{ fontSize: 11, color: C.inkFaint }}>{paused ? 'PAUSED' : expanded ? 'EXPANDED' : 'LIVE'}</span>
          </div>
        </div>

        {/* Domain pill */}
        <div style={{ padding: '16px 22px 0' }}>
          <span style={{
            background: C.accentSoft,
            color: C.accentText,
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {thread.domain} · {thread.industry}
          </span>
        </div>

        {/* Question */}
        <div style={{ padding: '14px 22px' }}>
          <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 6 }}>Audit query</div>
          <div style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 600,
            color: C.ink,
            lineHeight: 1.35,
            opacity: phase === 'question' || phase === 'answer' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}>
            {thread.q}
          </div>
        </div>

        {/* Answer */}
        <div style={{
          padding: '14px 22px 20px',
          borderTop: `1px solid ${C.border}`,
          opacity: phase === 'answer' ? 1 : 0,
          transition: 'opacity 0.5s ease',
          minHeight: 72,
        }}>
          <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 6 }}>Intelligence verdict</div>
          <div style={{
            fontSize: 15,
            color: thread.a.startsWith('CRITICAL') ? '#C05050' : C.amber,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
            {thread.a}
          </div>
        </div>

        {/* Expanded: all domains */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 22px' }}>
            <div style={{ fontSize: 12, color: C.inkMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              All domains being monitored
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Sales', 'Ops', 'Pricing', 'Hiring', 'Finance', 'Delivery', 'Marketing', 'Strategy', 'Product', 'People & HR', 'Customer Experience', 'Legal & Compliance', 'Technology', 'Brand'].map(d => (
                <span key={d} style={{
                  background: C.surface2,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: C.inkSoft,
                  fontWeight: 500,
                }}>
                  {d}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 13, color: C.inkMuted, fontStyle: 'italic' }}>
              Click to collapse
            </div>
          </div>
        )}

        {!expanded && (
          <div style={{ padding: '10px 22px 14px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: C.inkFaint }}>Hover to pause · Click to explore all domains</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

// ── Pricing Drawer ────────────────────────────────────────────────────────────

function GrowthOSCard({ onSignUp }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div style={{
      background: C.card,
      border: `1px solid rgba(107,92,231,0.6)`,
      boxShadow: '0 18px 50px rgba(107,92,231,0.14)',
      borderRadius: 18,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Growth OS</div>
        <span style={{ background: C.accentSoft, color: C.accentText, borderRadius: 999, padding: '4px 10px', fontSize: 11 }}>
          Recommended
        </span>
      </div>

      <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
        $99<span style={{ fontSize: 20, color: C.inkMuted, marginLeft: 4 }}>/mo</span>
      </div>
      <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 8, marginBottom: 24 }}>$79/mo billed annually</div>

      {/* Promise — no feature list by default */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '🧠', label: 'The Intelligence Layer', sub: 'Persistent memory, health score, financial metrics, pattern recognition' },
          { icon: '⚡', label: 'Execution Engine', sub: 'SOPs, action plans, process redesigns, hiring briefs — generated instantly' },
          { icon: '📊', label: 'Command Centre', sub: 'Live dashboard, severity tracker, goal progress, re-engagement alerts' },
          { icon: '🔔', label: 'Integrations', sub: 'Slack, Teams, Discord, weekly digest, scheduled re-audits' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, lineHeight: 1.4, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: C.inkMuted }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer toggle */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        style={{
          background: 'none',
          border: `1px solid ${C.border2}`,
          borderRadius: 8,
          color: C.inkMuted,
          fontSize: 13,
          padding: '8px 14px',
          cursor: 'pointer',
          marginBottom: 20,
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'border-color 0.2s',
        }}
      >
        <span>{drawerOpen ? '↑' : '↓'}</span>
        {drawerOpen ? 'Hide full capabilities' : 'View full capabilities'}
      </button>

      {/* Drawer content */}
      {drawerOpen && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { title: 'Intelligence Layer', items: growthIntelligence },
            { title: 'Execution Outputs', items: growthExecution },
            { title: 'Dashboard & Command Centre', items: growthDashboard },
            { title: 'Integrations & Notifications', items: growthIntegrations },
          ].map(section => (
            <div key={section.title}>
              <div style={{ fontFamily: serif, fontSize: 16, color: C.ink, marginBottom: 10 }}>{section.title}</div>
              <FeatureList items={section.items} iconColor={C.accentText} />
            </div>
          ))}
        </div>
      )}

      <PrimaryButton label="Start Growth OS — $99/mo" onClick={() => onSignUp('business')} />
      <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>Cancel anytime. No contracts.</div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()
  const [inputValue, setInputValue] = useState('')

  const handleAuditStart = (problem) => {
    posthog?.capture('audit_started', { source: 'landing', problem: problem || '' })
    onStart(problem)
  }

  const handleSignUpWithPlan = (plan) => {
    posthog?.capture('signup_plan_selected', { plan })
    onSignUp(plan)
  }

  const handleLogoClick = () => {
    if (session) {
      window.location.hash = 'dashboard'
    } else {
      window.location.href = '/'
    }
  }

  const handleDiagnose = () => {
    if (inputValue.trim()) {
      handleAuditStart(inputValue.trim())
    } else {
      handleAuditStart()
    }
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.ink, lineHeight: 1.6, minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <nav style={{ padding: '22px 0', borderBottom: `1px solid ${C.border}`, background: 'rgba(10,10,10,0.96)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer', color: C.ink }} onClick={handleLogoClick}>
            self<span style={{ color: C.accentText, fontWeight: 500 }}>audit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              Pricing
            </button>
            <button onClick={() => { window.location.hash = 'login' }} style={{ fontSize: 14, color: C.inkMuted, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              Sign in
            </button>
            <PrimaryButton label="Start free audit" onClick={() => handleAuditStart()} small />
            <div style={{ fontSize: 14, color: C.inkMuted }}>
              by{' '}
              <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accentText, textDecoration: 'none', fontWeight: 500 }}>
                Vnklo
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section style={{ padding: '112px 0 100px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(107,92,231,0.18), transparent 34%)' }}>
        <div style={wrap}>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, marginBottom: 24 }}>
            Not another AI consultant. Your new business nervous system.
          </div>

          <h1 style={{ fontFamily: serif, fontSize: 'clamp(38px, 5.5vw, 68px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.05em', margin: '0 auto 24px', maxWidth: 860, color: C.ink }}>
            Stop treating symptoms.<br />Find out what's actually broken.
          </h1>

          <p style={{ fontSize: 20, color: C.inkSoft, maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>
            Tell us where it hurts. We'll tell you why — and what to do first.
          </p>

          {/* Interactive Input Bar */}
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 999,
              padding: '6px 6px 6px 24px',
              gap: 10,
              transition: 'border-color 0.2s',
            }}
              onFocus={() => {}}
            >
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDiagnose()}
                placeholder='Example: "Sales are slow but I don\'t know why."'
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  color: C.ink,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleDiagnose}
                style={{
                  background: C.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 22px',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.18s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}
              >
                Diagnose →
              </button>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: C.inkMuted }}>
              Free root-cause diagnosis. No account needed. Takes 5 minutes. Brutally honest.
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Advisory Contrast ── */}
      <section id="comparison" style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>Advisory fatigue</div>
          <h2 style={h2Style}>Why founders are replacing advisory calls and meetings.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            The old model was built for a world that moved slowly. Yours doesn't.
          </p>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
              <div style={{ padding: '20px 28px', borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.inkMuted }}>What you're doing now</div>
                <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4 }}>Slow, expensive, guessing</div>
              </div>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.accentText }}>SelfAudit</div>
                <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 4 }}>Instant, data-driven, persistent</div>
              </div>
            </div>

            {compareRows.map((row, i) => (
              <div key={row.dim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < compareRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '18px 28px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>{row.dim}</div>
                  <div style={{ fontSize: 13, color: C.inkFaint }}>{row.old}</div>
                </div>
                <div style={{ padding: '18px 28px', fontSize: 14, color: C.accentText, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {row.neo}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Intelligence Moat ── */}
      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Why this works</div>
          <h2 style={h2Style}>The intelligence moat.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            We're not "honest." We're technically superior. Here's why.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
            {intelligencePillars.map(pillar => (
              <div key={pillar.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ color: C.accentText, fontSize: 20, marginBottom: 16 }}>→</div>
                <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', color: C.ink }}>{pillar.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 15, margin: 0 }}>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Diagnostic Loop ── */}
      <section style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>The engine, live</div>
          <h2 style={h2Style}>Where business failure hides.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 48px' }}>
            Our Intelligence Layer maps 40+ industries and 200+ failure points. Watch it work.
          </p>
          <DiagnosticLoop />
        </div>
      </section>

      {/* ── 5. Evidence of Intelligence ── */}
      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Intelligence in action</div>
          <h2 style={h2Style}>Evidence of the Intelligence Layer.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            We don't tell you what you want to hear. We tell you what's actually killing your growth.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {verdictCards.map(card => (
              <div key={card.symptom} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20, padding: '4px 10px', borderRadius: 999, display: 'inline-block', alignSelf: 'flex-start', background: card.badgeBg, color: card.badgeColor }}>
                  {card.badge}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>What they thought</div>
                  <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.inkSoft, lineHeight: 1.4 }}>{card.symptom}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>What we found</div>
                  <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.55, fontWeight: 500 }}>{card.reveal}</div>
                </div>

                <div style={{ padding: 14, background: C.surface2, borderRadius: 10, marginTop: 'auto' }}>
                  <div style={{ fontSize: 11, color: C.accentText, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>The Outcome</div>
                  <div style={{ fontSize: 14, color: C.inkSoft }}>{card.outcome}</div>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: C.inkMuted }}>{card.industry}</span>
                  <span style={{ color: C.inkMuted }}>{card.time} · {card.findings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Accountability Loop ── */}
      <section style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>The unfair advantage</div>
          <h2 style={h2Style}>Advice you can't ignore.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 680, margin: '0 auto 60px' }}>
            Most audits are static. A PDF you open once and file away. SelfAudit creates an intelligent loop that monitors your progress, alerts you when you're slipping, and forces the discipline of execution.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
            {[
              {
                title: 'We track the fix.',
                icon: '🔁',
                body: 'After every audit, SelfAudit monitors whether the critical findings are being addressed. You can\'t close an issue until the Intelligence Layer is satisfied.',
              },
              {
                title: 'We tap you on the shoulder.',
                icon: '🔔',
                body: 'Re-engagement alerts fire when your business health score drops, a critical finding goes unaddressed, or a goal you set is at risk. Think of it as a COO that never goes offline.',
              },
              {
                title: 'The system compounds.',
                icon: '📈',
                body: 'Every re-audit builds on the last. The Intelligence Layer knows your business trajectory, your weak points, and your patterns. Over time, it becomes your most knowledgeable advisor.',
              },
            ].map(item => (
              <div key={item.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ fontSize: 28, marginBottom: 18 }}>{item.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', color: C.ink }}>{item.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 15, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. AI Graveyard ── */}
      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>The AI question, answered honestly</div>
          <h2 style={h2Style}>The "AI Strategy" Graveyard.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 680, margin: '0 auto 60px' }}>
            Most AI projects are expensive science experiments that die in a slide deck. SelfAudit doesn't just "deploy AI" — it validates whether AI is even the solution.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
            {aiCards.map(card => (
              <div key={card.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentSoft, color: C.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, fontWeight: 700, marginBottom: 18, flexShrink: 0 }}>
                  {card.num}
                </div>
                <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2, color: C.ink }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: C.inkSoft, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 52, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            You'll leave knowing exactly which problems deserve AI, and which ones deserve a manager, a process, or a hard conversation.
          </p>
        </div>
      </section>

      {/* ── 8. Pricing ── */}
      <section id="pricing" style={{ padding: '100px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>Pricing</div>
          <h2 style={h2Style}>Diagnosis is free. Execution is the edge.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 700, margin: '0 auto 60px' }}>
            Start with the truth. Upgrade when you're ready to fix it.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1080, margin: '0 auto' }}>
            {/* Free */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Free</div>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Root-Cause Diagnosis</div>
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
                $0
              </div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 8, marginBottom: 24 }}>The truth about your business.</div>

              <div style={{ marginBottom: 24 }}>
                <FeatureList items={freeFeatures} />
              </div>

              <div style={{ marginTop: 'auto' }}>
                <OutlineButton label="Start free audit" onClick={() => handleAuditStart()} />
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>One audit. No account needed.</div>
              </div>
            </div>

            {/* Growth OS */}
            <GrowthOSCard onSignUp={handleSignUpWithPlan} />
          </div>

          <p style={{ textAlign: 'center', marginTop: 34, fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Your competitors aren't smarter. They just have better data on their own business.
          </p>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section style={{ background: C.bg, textAlign: 'center', padding: '110px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style}>Stop guessing. Get a diagnosis.</h2>
          <div style={{ marginTop: 28 }}>
            <PrimaryButton label="Start your free audit" onClick={() => handleAuditStart()} />
          </div>
          <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 14 }}>
            5 minutes. No account needed. Brutally honest.
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#060606', color: '#B8B6B0', padding: '42px 0', textAlign: 'center', fontSize: 14, borderTop: `1px solid ${C.border}` }}>
        <div style={wrap}>
          Built by{' '}
          <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accentText, textDecoration: 'none', fontWeight: 500 }}>
            Vnklo
          </a>
        </div>
      </footer>
    </div>
  )
}
