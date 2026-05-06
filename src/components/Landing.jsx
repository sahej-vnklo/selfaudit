import React, { useState, useEffect, useRef } from 'react'
import { usePostHog } from '@posthog/react'

const THEMES = {
  dark: {
    theme: 'dark',
    bg: '#0F1520',
    surface: '#141D2B',
    surface2: '#111827',
    surface3: '#1A2535',
    card: '#111827',
    border: '#1E2D42',
    border2: '#243247',
    ink: '#E8E2D8',
    inkSoft: '#B8B0A4',
    inkMuted: '#7A8FA8',
    inkFaint: '#4A6080',
    accent: '#4A7FA8',
    accentDark: '#3A6A90',
    accentSoft: '#1A2535',
    accentText: '#8FBAD8',
    redMuted: 'rgba(192, 80, 80, 0.78)',
    redSoft: '#1A0A0A',
    amber: '#C9A040',
  },
  light: {
    theme: 'light',
    bg: '#F5F0E8',
    surface: '#EDE6DC',
    surface2: '#E8E0D4',
    surface3: '#E2D8CC',
    card: '#E8DFD3',
    border: '#C4B4A4',
    border2: '#BAA898',
    ink: '#1A1410',
    inkSoft: '#5C4840',
    inkMuted: '#6B5040',
    inkFaint: '#8A6A58',
    accent: '#8C4A42',
    accentDark: '#7A3C36',
    accentSoft: '#F0E4E0',
    accentText: '#8C4A42',
    redMuted: 'rgba(140, 74, 66, 0.85)',
    redSoft: '#F5EDEB',
    amber: '#8C6A30',
  },
}

const serif = "'Playfair Display', Georgia, serif"
const wrap = { maxWidth: 1140, margin: '0 auto', padding: '0 28px' }

const sectionLabel = (C) => ({
  textAlign: 'center',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: C.inkFaint,
  marginBottom: 16,
  fontWeight: 600,
})

const h2Style = (C) => ({
  fontFamily: serif,
  fontSize: 'clamp(30px, 4vw, 48px)',
  fontWeight: 700,
  lineHeight: 1.05,
  letterSpacing: '-0.04em',
  textAlign: 'center',
  marginBottom: 18,
  color: C.ink,
})

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
    badgeBgDark: '#1A0A0A',
    badgeBgLight: '#F5E8E8',
    badgeColorDark: '#C05050',
    badgeColorLight: '#8C2A2A',
    symptom: '"QC team is burning cash on mistakes."',
    reveal: 'Root cause traced to a non-existent accountability protocol — not a tech failure.',
    outcome: 'Process redesign + automated performance oversight.',
    industry: 'Manufacturing',
    time: '6 min',
    findings: '3 critical · 2 needs-work',
  },
  {
    badge: 'Critical · Strategy',
    badgeBgDark: '#1A1508',
    badgeBgLight: '#F5F0E0',
    badgeColorDark: '#C9A040',
    badgeColorLight: '#7A5A10',
    symptom: '"Revenue is flat despite heavy effort."',
    reveal: 'Seasonal capital model misaligned with actual service capacity.',
    outcome: 'Pricing model restructure + real-time capacity-to-revenue tracking.',
    industry: 'Service business',
    time: '5 min',
    findings: '4 critical',
  },
  {
    badge: 'Needs work · People',
    badgeBgDark: '#0A1A10',
    badgeBgLight: '#E8F5EE',
    badgeColorDark: '#4A9E6B',
    badgeColorLight: '#1A6B3A',
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

const visionOutputs = {
  'Hit $1M ARR': {
    'Pre-revenue': 'Getting to $1M from zero is a distribution problem, not a product one. You need one repeatable channel before anything else.',
    'Early traction': 'You have proof. $1M from early traction is a conversion and pricing problem. The market exists — you\'re just leaving money in it.',
    'Plateaued': 'A plateau on the way to $1M means your current channel is maxed. The next dollar needs a different door.',
    'Growing but bleeding cash': 'Growing to $1M while bleeding means your unit economics are broken. Fix the margin before you fix the growth.',
    'Ready to scale': 'You\'re positioned. $1M is a systems and capacity problem now — not a sales one.',
  },
  '2x my revenue': {
    'Pre-revenue': 'You can\'t double what doesn\'t exist yet. First dollar before second dollar.',
    'Early traction': 'Doubling from early traction means finding your second acquisition channel. One channel is a single point of failure.',
    'Plateaued': 'Revenue plateaus before doubling for one reason: you\'ve exhausted your current buyer. The next 2x is a new segment.',
    'Growing but bleeding cash': 'Doubling revenue while bleeding cash doubles your problem. Margin first, then scale.',
    'Ready to scale': 'You\'re ready. 2x from here is an execution and capacity problem. Let\'s find what breaks first when you push.',
  },
  'Exit in 3 years': {
    'Pre-revenue': 'Three years to exit with no revenue is aggressive. You need 18 months of strong growth before anyone values this.',
    'Early traction': 'Exit in 3 years from early traction is achievable — if you build the right metrics story now. EBITDA and retention are what buyers look at.',
    'Plateaued': 'A plateau kills exit multiples. Buyers pay for trajectory, not history. You need 12 months of upward movement before going to market.',
    'Growing but bleeding cash': 'Nobody buys a bleeding business at a premium. Fix the cash model — that\'s your first 12 months.',
    'Ready to scale': 'Good position. 3 years to exit means you need 2 years of clean growth and 1 year of process. Start the documentation now.',
  },
  'Break even': {
    'Pre-revenue': 'Breaking even is a cost structure and pricing problem. Let\'s find where your model leaks before you burn more.',
    'Early traction': 'You\'re close. Breaking even from early traction means your CAC is too high or your price is too low. Usually both.',
    'Plateaued': 'Plateau and not breaking even means your fixed costs scaled before your revenue did. One of them needs to move.',
    'Growing but bleeding cash': 'Growing and not breaking even is the most dangerous position. You\'re buying revenue. Let\'s find what it actually costs you.',
    'Ready to scale': 'Scaling without breaking even first multiplies the problem. Get to zero before you go positive.',
  },
  'Enter new market': {
    'Pre-revenue': 'Entering a new market without proving the first one is a sequencing error. Nail market one first.',
    'Early traction': 'New market from early traction works if your ICP transfers. If it doesn\'t, you\'re starting over with less runway.',
    'Plateaued': 'A plateau is often a sign you\'ve hit the ceiling of your current market. A new market might be the right move — or a distraction. Let\'s find out.',
    'Growing but bleeding cash': 'New markets cost money you don\'t have margin for right now. Fix the bleed first.',
    'Ready to scale': 'You\'re positioned for it. New market entry from scale is a GTM and localisation problem. Let\'s map the gaps.',
  },
  'Scale the team': {
    'Pre-revenue': 'Scaling a team before revenue is how startups die. Get the money first.',
    'Early traction': 'Hiring from early traction works if you\'re hiring for your bottleneck. Most people hire for the wrong role at this stage.',
    'Plateaued': 'Team size isn\'t your plateau problem. Adding people to a stuck business makes it more stuck.',
    'Growing but bleeding cash': 'Hiring while bleeding is the fastest way to run out of runway. Every new hire needs to be cash-positive within 90 days.',
    'Ready to scale': 'Good. Scaling the team from a strong base is a hiring brief and onboarding problem. Let\'s find where the first 5 hires need to go.',
  },
}

const timelineLabels = {
  '6 months': 'in 6 months',
  '12 months': 'in 12 months',
  '2 years': 'in 2 years',
  '3+ years': 'in 3+ years',
}

const intelligencePillars = [
  {
    title: 'Built on how businesses actually fail.',
    body: 'We studied the playbooks of scaled businesses and the exact points where failed ones went wrong. That failure library is not something a $400/hr consultant has access to.',
  },
  {
    title: 'Incentivised to solve it. Not to extend it.',
    body: 'Consultants stay paid by staying needed. Our system is built to close the problem and move you to the next stage — even if that means telling you something uncomfortable.',
  },
  {
    title: "A pricing problem won't show up in your ads. We look everywhere.",
    body: 'Businesses fail because they apply the wrong fix to the wrong layer. We map dependencies across your full operation before we tell you where to look.',
  },
  {
    title: 'Every audit makes the next one smarter.',
    body: "Each audit feeds the intelligence layer. The more you engage, the more precisely it understands your business trajectory, weak points, and patterns — unlike any consultant you'll ever hire.",
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

const typewriterStatements = [
  "Sales are flat but I don't know why.",
  'I want to hit $500k revenue next quarter.',
  'We keep hiring but the team still feels broken.',
  'I want to scale to 3 new markets in 12 months.',
  'Revenue is growing but margins keep shrinking.',
  'My goal is to cut operational costs by 30%.',
  'My best people are burning out.',
  'I want to build a business I can exit in 3 years.',
  "We're busy but never making progress.",
  'I want to double our recurring revenue this year.',
  "Customers churn after 60 days and I can't figure out why.",
  "My goal is $1M ARR — I need to know what's blocking it.",
  "I think we need AI but I'm not sure where.",
  'I want to be investor-ready in 6 months.',
  'Our ops are a mess and nobody owns anything.',
  'I want to go from 10 to 50 employees without breaking culture.',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryButton({ label, onClick, small = false, C }) {
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

function OutlineButton({ label, onClick, C }) {
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

function FeatureList({ items, color, iconColor, icon = '✓' }) {
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

function DiagnosticLoop({ C }) {
  const [displayQ, setDisplayQ] = useState('')
  const [displayA, setDisplayA] = useState('')
  const [phase, setPhase] = useState('typing-q')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const pausedRef = useRef(false)

  const thread = diagnosticThreads[currentIndex]

  useEffect(() => {
    let cancelled = false
    let index = 0

    const sleep = (ms) => new Promise(r => setTimeout(r, ms))

    const runLoop = async () => {
      while (!cancelled) {
        const currentThread = diagnosticThreads[index % diagnosticThreads.length]

        setCurrentIndex(index % diagnosticThreads.length)

        setPhase('typing-q')
        setDisplayA('')
        for (let i = 0; i <= currentThread.q.length; i++) {
          if (cancelled) return
          while (pausedRef.current) await sleep(100)
          setDisplayQ(currentThread.q.slice(0, i))
          await sleep(28)
        }

        await sleep(400)

        setPhase('typing-a')
        for (let i = 0; i <= currentThread.a.length; i++) {
          if (cancelled) return
          while (pausedRef.current) await sleep(100)
          setDisplayA(currentThread.a.slice(0, i))
          await sleep(22)
        }

        await sleep(500)
        setDisplayQ('')
        setDisplayA('')
        setPhase('typing-q')

        await sleep(300)

        index = (index + 1) % diagnosticThreads.length
        setCurrentIndex(index)
      }
    }

    runLoop()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true; setIsPaused(true) }}
      onMouseLeave={() => { if (!expanded) { pausedRef.current = false; setIsPaused(false) } }}
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
            {!expanded && !isPaused && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28CA41', animation: 'pulse 1.5s infinite' }} />
            )}
            <span style={{ fontSize: 11, color: C.inkFaint }}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
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
          }}>
            {displayQ}
          </div>
        </div>

        {/* Answer */}
        <div style={{
          padding: '14px 22px 20px',
          borderTop: `1px solid ${C.border}`,
          minHeight: 72,
        }}>
          <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 6 }}>Intelligence verdict</div>
          <div style={{
            fontSize: 15,
            color: thread.a.startsWith('CRITICAL') ? '#C05050' : C.amber,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
            {displayA}
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

function GrowthOSCard({ onSignUp, C }) {
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
              <FeatureList items={section.items} color={C.inkSoft} iconColor={C.accentText} />
            </div>
          ))}
        </div>
      )}

      <PrimaryButton label="Start Growth OS — $99/mo" onClick={() => onSignUp('business')} C={C} />
      <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>Cancel anytime. No contracts.</div>
    </div>
  )
}

function VisionWidget({ C, serif, visionOpen, setVisionOpen, visionGoal, setVisionGoal, visionCurrent, setVisionCurrent, visionTimeline, setVisionTimeline, visionRef, onStart }) {

  const goals = ['Hit $1M ARR', '2x my revenue', 'Exit in 3 years', 'Break even', 'Enter new market', 'Scale the team']
  const currentStates = ['Pre-revenue', 'Early traction', 'Plateaued', 'Growing but bleeding cash', 'Ready to scale']
  const timelines = ['6 months', '12 months', '2 years', '3+ years']

  const output = visionGoal && visionCurrent ? visionOutputs[visionGoal]?.[visionCurrent] : null
  const allSelected = visionGoal && visionCurrent && visionTimeline

  const tileStyle = (selected) => ({
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${selected ? C.accent : C.border2}`,
    background: selected ? C.accentSoft : 'transparent',
    color: selected ? C.accentText : C.inkSoft,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  })

  const reset = () => {
    setVisionGoal(null)
    setVisionCurrent(null)
    setVisionTimeline(null)
  }

  return (
    <div ref={visionRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setVisionOpen(o => !o); reset() }}
        style={{
          background: 'none',
          border: `1px solid ${C.border2}`,
          borderRadius: 999,
          padding: '7px 16px',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: C.inkSoft,
          fontFamily: 'inherit',
          letterSpacing: '-0.01em',
        }}
      >
        Vision.
      </button>

      {visionOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: 480,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
          zIndex: 100,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.inkMuted, marginBottom: 16 }}>
            What's yours?
          </div>

          {/* Q1 — Goal */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>The goal</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {goals.map(g => (
                <div key={g} onClick={() => setVisionGoal(g)} style={tileStyle(visionGoal === g)}>{g}</div>
              ))}
            </div>
          </div>

          {/* Q2 — Current */}
          {visionGoal && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>Right now</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {currentStates.map(s => (
                  <div key={s} onClick={() => setVisionCurrent(s)} style={tileStyle(visionCurrent === s)}>{s}</div>
                ))}
              </div>
            </div>
          )}

          {/* Q3 — Timeline */}
          {visionCurrent && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>Timeline</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {timelines.map(t => (
                  <div key={t} onClick={() => setVisionTimeline(t)} style={tileStyle(visionTimeline === t)}>{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          {output && visionTimeline && (
            <div style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 18,
            }}>
              <div style={{
                fontFamily: serif,
                fontSize: 15,
                color: C.ink,
                lineHeight: 1.6,
                marginBottom: 16,
              }}>
                {output}
              </div>
              <button
                onClick={() => { setVisionOpen(false); onStart(`Goal: ${visionGoal} ${timelineLabels[visionTimeline]}. Currently: ${visionCurrent}.`) }}
                style={{
                  width: '100%',
                  background: C.accent,
                  color: C.theme === 'dark' ? '#E8E2D8' : '#F5F0E8',
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Map the path — free →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()
  const [theme, setTheme] = useState(() => localStorage.getItem('sa-theme') || 'dark')
  const C = THEMES[theme]
  const [inputValue, setInputValue] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typewriterRef = useRef(null)
  const statementIndexRef = useRef(0)
  const userFocusedRef = useRef(false)
  const [visionOpen, setVisionOpen] = useState(false)
  const [visionGoal, setVisionGoal] = useState(null)
  const [visionCurrent, setVisionCurrent] = useState(null)
  const [visionTimeline, setVisionTimeline] = useState(null)
  const visionRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false

    const runLoop = async () => {
      while (!cancelled) {
        if (userFocusedRef.current) {
          await new Promise(r => setTimeout(r, 300))
          continue
        }

        const statement = typewriterStatements[statementIndexRef.current % typewriterStatements.length]
        statementIndexRef.current++

        setIsTyping(true)
        typewriterRef.current = statement

        for (let i = 0; i <= statement.length; i++) {
          if (cancelled || userFocusedRef.current) break
          setPlaceholder(statement.slice(0, i))
          await new Promise(r => setTimeout(r, 38))
        }

        await new Promise(r => setTimeout(r, 2000))

        for (let i = statement.length; i >= 0; i--) {
          if (cancelled || userFocusedRef.current) break
          setPlaceholder(statement.slice(0, i))
          await new Promise(r => setTimeout(r, 18))
        }

        setIsTyping(false)
        typewriterRef.current = null

        await new Promise(r => setTimeout(r, 400))
      }
    }

    runLoop()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (visionRef.current && !visionRef.current.contains(e.target)) {
        setVisionOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      <nav style={{ padding: '22px 0', borderBottom: `1px solid ${C.border}`, background: theme === 'dark' ? 'rgba(28,35,48,0.97)' : 'rgba(245,240,232,0.97)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
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
            <VisionWidget
              C={C}
              serif={serif}
              visionOpen={visionOpen}
              setVisionOpen={setVisionOpen}
              visionGoal={visionGoal}
              setVisionGoal={setVisionGoal}
              visionCurrent={visionCurrent}
              setVisionCurrent={setVisionCurrent}
              visionTimeline={visionTimeline}
              setVisionTimeline={setVisionTimeline}
              visionRef={visionRef}
              onStart={handleAuditStart}
            />
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'none',
                border: `1px solid ${C.border2}`,
                borderRadius: 999,
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: C.inkSoft,
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
            <PrimaryButton label="Start free audit" onClick={() => handleAuditStart()} small C={C} />
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
      <section style={{ padding: '112px 0 100px', textAlign: 'center', background: theme === 'dark' ? 'radial-gradient(circle at top, rgba(74,127,168,0.15), transparent 34%)' : 'radial-gradient(circle at top, rgba(140,74,66,0.08), transparent 34%)' }}>
        <div style={wrap}>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, marginBottom: 24 }}>
            Your problems. Your goals. Your next move. One system.
          </div>

          <h1 style={{
            fontFamily: serif,
            fontSize: 'clamp(42px, 5.5vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            margin: '0 auto 16px',
            color: C.ink,
          }}>
            Your problems, diagnosed.<br />
            Your goals, reverse-engineered.
          </h1>

          <p style={{
            fontFamily: serif,
            fontSize: 'clamp(22px, 3vw, 36px)',
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            margin: '0 auto 14px',
            color: C.inkSoft,
            maxWidth: 860,
          }}>
            Your blind spots, exposed. Your next move, decided.
          </p>

          <p style={{
            fontSize: 16,
            color: C.inkMuted,
            maxWidth: 580,
            margin: '0 auto 48px',
            lineHeight: 1.6,
            textAlign: 'center',
            fontWeight: 400,
          }}>
            One system. Root-cause diagnosis, goal gap analysis, and a real execution plan — end to end.
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
                placeholder={placeholder}
                onFocus={() => { userFocusedRef.current = true; setPlaceholder('') }}
                onBlur={() => { userFocusedRef.current = false }}
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
                Let&apos;s go →
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
          <div style={sectionLabel(C)}>Advisory fatigue</div>
          <h2 style={h2Style(C)}>Why founders are replacing advisory calls and meetings.</h2>
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
          <div style={sectionLabel(C)}>Why this works</div>
          <h2 style={h2Style(C)}>The intelligence moat.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            We're not "honest." We're technically superior. Here's why.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1040, margin: '0 auto' }}>
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
          <div style={sectionLabel(C)}>The engine, live</div>
          <h2 style={h2Style(C)}>Where business failure hides.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 48px' }}>
            Our Intelligence Layer maps 40+ industries and 200+ failure points. Watch it work.
          </p>
          <DiagnosticLoop C={C} />
        </div>
      </section>

      {/* ── 5. Evidence of Intelligence ── */}
      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel(C)}>Intelligence in action</div>
          <h2 style={h2Style(C)}>Evidence of the Intelligence Layer.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            We don't tell you what you want to hear. We tell you what's actually killing your growth.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {verdictCards.map(card => (
              <div key={card.symptom} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20, padding: '4px 10px', borderRadius: 999, display: 'inline-block', alignSelf: 'flex-start', background: theme === 'dark' ? card.badgeBgDark : card.badgeBgLight, color: theme === 'dark' ? card.badgeColorDark : card.badgeColorLight }}>
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
          <div style={sectionLabel(C)}>The unfair advantage</div>
          <h2 style={h2Style(C)}>Advice you can't ignore.</h2>
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
          <div style={sectionLabel(C)}>The AI question, answered honestly</div>
          <h2 style={h2Style(C)}>The "AI Strategy" Graveyard.</h2>
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
          <div style={sectionLabel(C)}>Pricing</div>
          <h2 style={h2Style(C)}>Diagnosis is free. Execution is the edge.</h2>
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
                <FeatureList items={freeFeatures} color={C.inkSoft} iconColor={C.accentText} />
              </div>

              <div style={{ marginTop: 'auto' }}>
                <OutlineButton label="Start free audit" onClick={() => handleAuditStart()} C={C} />
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>One audit. No account needed.</div>
              </div>
            </div>

            {/* Growth OS */}
            <GrowthOSCard onSignUp={handleSignUpWithPlan} C={C} />
          </div>

          <p style={{ textAlign: 'center', marginTop: 34, fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Your competitors aren't smarter. They just have better data on their own business.
          </p>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section style={{ background: C.bg, textAlign: 'center', padding: '110px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style(C)}>Stop guessing. Get a diagnosis.</h2>
          <div style={{ marginTop: 28 }}>
            <PrimaryButton label="Start your free audit" onClick={() => handleAuditStart()} C={C} />
          </div>
          <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 14 }}>
            5 minutes. No account needed. Brutally honest.
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: theme === 'dark' ? '#111820' : '#E8E0D4', color: '#B8B6B0', padding: '42px 0', textAlign: 'center', fontSize: 14, borderTop: `1px solid ${C.border}` }}>
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
