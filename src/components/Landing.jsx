import React, { useState, useEffect, useRef } from 'react'
import { usePostHog } from '@posthog/react'

const THEMES = {
  dark: {
    theme: 'dark',
    bg: '#0E0C0A',
    surface: '#161310',
    surface2: '#1A1714',
    surface3: '#1F1B16',
    card: '#161310',
    border: '#1F1B16',
    border2: '#2A2620',
    ink: '#F5F1E8',
    inkSoft: '#D4CEC0',
    inkMuted: '#B5AC9D',
    inkFaint: '#8A8378',
    accent: '#E07A6A',
    accentDark: '#C56858',
    accentSoft: '#2A1A15',
    accentText: '#E07A6A',
    redMuted: '#E07A6A',
    redSoft: '#2A1A15',
    amber: '#D9B05C',
  },
  light: {
    theme: 'light',
    bg: '#F7F4ED',
    surface: '#F2EDE2',
    surface2: '#EDE5D4',
    surface3: '#E4DDD0',
    card: '#FBFAF6',
    border: '#E4DDD0',
    border2: '#D8CFBC',
    ink: '#1A1814',
    inkSoft: '#3A352D',
    inkMuted: '#5A5246',
    inkFaint: '#8A8378',
    accent: '#6E2A1E',
    accentDark: '#5A2218',
    accentSoft: '#F6EAE5',
    accentText: '#6E2A1E',
    redMuted: '#6E2A1E',
    redSoft: '#F6EAE5',
    amber: '#8A6F1A',
  },
}

const serif = "'Playfair Display', Georgia, serif"
const wrap = { maxWidth: 1140, margin: '0 auto', padding: '0 28px' }

const sectionLabel = (C) => ({
  textAlign: 'center',
  fontSize: 12,
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


const storyCards = [
  {
    severity: 'CRITICAL',
    domain: 'Operations',
    meta: 'Manufacturing · 6 min',
    thinking: '"Our QC team is burning through budget for no reason."',
    found: 'No accountability protocol existed. Errors were absorbed, not owned. The QC team was fixing problems that should not have reached them.',
    changed: 'Redesigned the handoff process. QC errors dropped 60% in 6 weeks without a single new hire.',
  },
  {
    severity: 'CRITICAL',
    domain: 'Strategy',
    meta: 'Service Business · 5 min',
    thinking: '"Revenue is flat. We need to do more marketing."',
    found: 'Seasonal capital model completely misaligned with actual service capacity. They were marketing into months they could not deliver in.',
    changed: 'Pricing model restructured around capacity windows. Revenue up 34% in the next quarter without increasing ad spend.',
  },
  {
    severity: 'NEEDS WORK',
    domain: 'People',
    meta: 'SaaS · 7 min',
    thinking: '"We need to automate but the product is not ready."',
    found: 'Management churn was the real bottleneck. 3 team leads had left in 4 months. The product was fine. The org was not.',
    changed: 'Hiring brief built for a Head of Delivery. Onboarding SOP created. Product velocity increased within 60 days.',
  },
  {
    severity: 'CRITICAL',
    domain: 'Finance',
    meta: 'Agency · 5 min',
    thinking: '"We are busy and growing. Margins should be fine."',
    found: 'Billable hour rate had not been reviewed in 2 years. Inflation and scope creep had eroded margin to 11%. Profitable on paper, bleeding in reality.',
    changed: 'Pricing repriced by project type. Average margin recovered to 31% within one billing cycle.',
  },
  {
    severity: 'CRITICAL',
    domain: 'Sales',
    meta: 'SaaS · 6 min',
    thinking: '"Our close rate is low. We need a better demo."',
    found: 'Deals were not dying in the demo — they were dying in follow-up. No structured sequence existed after the call. Leads were going cold in silence.',
    changed: '5-touch follow-up sequence built. Close rate improved 28% in 6 weeks. Demo unchanged.',
  },
  {
    severity: 'NEEDS WORK',
    domain: 'Marketing',
    meta: 'E-commerce · 4 min',
    thinking: '"We need more traffic. Our ads are not working."',
    found: 'Traffic was not the problem. Conversion rate on the product page was 0.8% — industry average is 2.4%. They were pouring spend into a leaking funnel.',
    changed: 'Product page rebuilt. Ad spend held flat. Revenue increased 41% from the same traffic.',
  },
  {
    severity: 'CRITICAL',
    domain: 'Operations',
    meta: 'Consulting · 8 min',
    thinking: '"We are understaffed. We need to hire."',
    found: 'Three consultants were spending 40% of their time on admin tasks that had no business being done manually. Capacity was not the issue. Workflow was.',
    changed: 'Two automations built. Equivalent of 1.2 FTE recovered. Hiring paused indefinitely.',
  },
  {
    severity: 'NEEDS WORK',
    domain: 'Customer Experience',
    meta: 'Healthcare · 6 min',
    thinking: '"Patient satisfaction scores are dropping. We need better staff training."',
    found: 'The drop correlated exactly with a scheduling system change 3 months prior. Wait times had increased 18 minutes on average. Staff were not the problem.',
    changed: 'Scheduling logic reverted and rebuilt. Satisfaction scores recovered within 30 days. Training budget untouched.',
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

const socialProofQuotes = [
  '"Found a $40k pricing gap in 6 minutes. My consultant missed it for two years."',
  '"Told me to stop hiring before I burned $180k on the wrong fix."',
  '"Revenue up 34% after repricing. Same clients, same team, same effort."',
  '"The most uncomfortable 5 minutes I\'ve had. Also the most valuable."',
  '"Close rate up 28% in 6 weeks. The demo was never the problem."',
  '"It read my actual pipeline. Not what I thought was in it."',
  '"Cancelled the $400/hr advisor. Never looked back."',
  '"Our problem was not what we thought it was. At all."',
  '"Found the leak in our funnel before we spent another dollar on ads."',
  '"Margin recovered from 11% to 31% in one billing cycle."',
  '"Equivalent of 1.2 FTE recovered. No new hires needed."',
  '"It told me exactly what was wrong. Not what I wanted to hear."',
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
        fontSize: small ? 15 : 17,
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.18s ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
      <span style={{ fontSize: small ? 17 : 19 }}>→</span>
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
        fontSize: 16,
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
        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color, fontSize: 15 }}>
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

        await sleep(2000)
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
          <div style={{ fontSize: 13, color: C.inkFaint, marginLeft: 6, letterSpacing: '0.08em' }}>
            selfaudit · intelligence engine
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {!expanded && !isPaused && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28CA41', animation: 'pulse 1.5s infinite' }} />
            )}
            <span style={{ fontSize: 12, color: C.inkFaint }}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
          </div>
        </div>

        {/* Domain pill */}
        <div style={{ padding: '16px 22px 0' }}>
          <span style={{
            background: C.accentSoft,
            color: C.accentText,
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {thread.domain} · {thread.industry}
          </span>
        </div>

        {/* Question */}
        <div style={{ padding: '14px 22px' }}>
          <div style={{ fontSize: 14, color: C.inkMuted, marginBottom: 6 }}>Audit query</div>
          <div style={{
            fontFamily: serif,
            fontSize: 21,
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
          <div style={{ fontSize: 14, color: C.inkMuted, marginBottom: 6 }}>Intelligence verdict</div>
          <div style={{
            fontSize: 16,
            color: thread.a.startsWith('CRITICAL') ? (C.theme === 'light' ? '#6E2A1E' : '#E07A6A') : C.amber,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
            {displayA}
          </div>
        </div>

        {/* Expanded: all domains */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '20px 22px' }}>
            <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              All domains being monitored
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Sales', 'Ops', 'Pricing', 'Hiring', 'Finance', 'Delivery', 'Marketing', 'Strategy', 'Product', 'People & HR', 'Customer Experience', 'Legal & Compliance', 'Technology', 'Brand'].map(d => (
                <span key={d} style={{
                  background: C.surface2,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 14,
                  color: C.inkSoft,
                  fontWeight: 500,
                }}>
                  {d}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 18, fontSize: 14, color: C.inkMuted, fontStyle: 'italic' }}>
              Click to collapse
            </div>
          </div>
        )}

        {!expanded && (
          <div style={{ padding: '10px 22px 14px', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: C.inkFaint }}>Hover to pause · Click to explore all domains</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ fontFamily: serif, fontSize: 29, fontWeight: 700, color: C.ink, letterSpacing: '-0.03em' }}>Intelligence</div>
        <span style={{ background: C.accentSoft, color: C.accentText, borderRadius: 999, padding: '4px 10px', fontSize: 12 }}>
          Recommended
        </span>
      </div>

      <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
        $99<span style={{ fontSize: 21, color: C.inkMuted, marginLeft: 4 }}>/mo</span>
      </div>
      <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 8, marginBottom: 24 }}>$79/mo billed annually</div>

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
              <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 14, color: C.inkMuted }}>{item.sub}</div>
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
          fontSize: 14,
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
              <div style={{ fontFamily: serif, fontSize: 17, color: C.ink, marginBottom: 10 }}>{section.title}</div>
              <FeatureList items={section.items} color={C.inkSoft} iconColor={C.accentText} />
            </div>
          ))}
        </div>
      )}

      <PrimaryButton label="Start Intelligence — $99/mo" onClick={() => onSignUp('intelligence')} C={C} />
      <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 12 }}>Cancel anytime. No contracts.</div>
    </div>
  )
}

function TextNavLink({ label, onClick, C, muted = false, active = false }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontSize: 15,
        fontWeight: 500,
        color: '#9A8A78',
        fontFamily: 'inherit',
        opacity: hovered || active ? 1 : 0.84,
        textDecoration: hovered || active ? 'underline' : 'none',
        textUnderlineOffset: 4,
      }}
    >
      {label}
    </button>
  )
}

function ThemeTextToggle({ theme, setTheme, C }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      style={{
        background: 'none',
        border: `1px solid ${C.border2}`,
        borderRadius: 999,
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        color: C.inkSoft,
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
    </button>
  )
}

function LandingNav({ C, pageOpen, onBack, onPricing, onStories, onConnected, onSignIn, onStartAudit, onLogoClick, storiesOpen, connectedOpen, pricingOpen, theme, setTheme }) {
  return (
    <nav style={{ padding: '20px 0', borderBottom: `1px solid ${C.border}`, background: C.theme === 'light' ? C.surface : '#1A1410', position: 'sticky', top: 0, zIndex: 20 }}>
      <div className="sa-nav-grid">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {pageOpen && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                color: C.inkSoft,
                fontFamily: 'inherit',
              }}
              aria-label="Back to landing"
            >
              ←
            </button>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer', color: C.ink }} onClick={onLogoClick}>
            self<span style={{ color: C.accentText, fontWeight: 500 }}>audit</span>
          </div>
        </div>

        <div className="sa-nav-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <TextNavLink label="Pricing" onClick={onPricing} C={C} active={pricingOpen} />
          <TextNavLink label="Stories" onClick={onStories} C={C} active={storiesOpen} />
          <TextNavLink label="Integrations" onClick={onConnected} C={C} active={connectedOpen} />
          <TextNavLink label="Sign in" onClick={onSignIn} C={C} muted />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
          <ThemeTextToggle theme={theme} setTheme={setTheme} C={C} />
          <PrimaryButton label="Start free audit" onClick={onStartAudit} small C={C} />
        </div>
      </div>
    </nav>
  )
}

function ConnectorLogo({ tool, src, brandColor, fallbackText }) {
  const [failed, setFailed] = useState(!src)

  if (failed) {
    return (
      <div style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: brandColor,
        color: '#fff',
        fontSize: 9,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {fallbackText || tool.slice(0, 2)}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={tool}
      width="20"
      height="20"
      onError={() => setFailed(true)}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    />
  )
}

function LandingFooter({ C, theme, setTheme }) {
  return (
    <footer style={{ background: '#1A1410', color: '#6A5A48', padding: '42px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15 }}>
          Built by{' '}
          <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
            Vnklo
          </a>
        </div>
      </div>
    </footer>
  )
}

function StoriesPage({ C, onStartAudit }) {
  return (
    <>
      <section style={{ padding: '96px 0 72px', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel(C)}>REAL DIAGNOSES. REAL OUTCOMES.</div>
          <h1 style={{
            fontFamily: serif,
            fontSize: 'clamp(40px, 5vw, 68px)',
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            color: C.ink,
            margin: '0 auto 18px',
            maxWidth: 760,
          }}>
            What founders found out.
          </h1>
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 760, margin: '0 auto' }}>
            These are not case studies. They are moments where someone finally got an honest answer about their business.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 0 96px', background: C.bg }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            {storyCards.map((story) => {
              const critical = story.severity === 'CRITICAL'
              return (
                <div
                  key={`${story.severity}-${story.domain}-${story.meta}`}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${critical ? C.redMuted : C.amber}`,
                    borderRadius: 16,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      fontSize: 12,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: critical ? C.redMuted : C.amber,
                    }}>
                      {story.severity} · {story.domain}
                    </div>
                    <div style={{ fontSize: 14, color: C.inkMuted, textAlign: 'right' }}>{story.meta}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>What they came in thinking</div>
                    <div style={{ fontFamily: serif, fontSize: 24, fontStyle: 'italic', lineHeight: 1.4, color: C.ink }}>
                      {story.thinking}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>What we actually found</div>
                    <div style={{ fontSize: 16, color: C.inkSoft, lineHeight: 1.65 }}>
                      {story.found}
                    </div>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, color: C.accentText, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>What changed</div>
                    <div style={{ fontSize: 16, color: C.ink, lineHeight: 1.65, fontWeight: 500 }}>
                      {story.changed}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ background: C.surface, textAlign: 'center', padding: '88px 0 96px' }}>
        <div style={wrap}>
          <div style={{ fontFamily: serif, fontSize: 'clamp(28px, 4vw, 44px)', color: C.ink, lineHeight: 1.15, marginBottom: 28 }}>
            Every audit starts with a question you have not asked yet.
          </div>
          <PrimaryButton label="Start your free audit" onClick={() => onStartAudit('')} C={C} />
          <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 14 }}>
            5 minutes. No account needed.
          </div>
        </div>
      </section>
    </>
  )
}

function ConnectedPage({ C, theme, onStartAudit }) {
  const liveBadge = theme === 'dark'
    ? { background: '#0A1A10', color: '#4A9E6B' }
    : { background: '#E8F5EE', color: '#1A6B3A' }
  const connectorColumns = [
    {
      heading: 'CRM & PIPELINE',
      tools: [
        { name: 'HubSpot', src: 'https://cdn.simpleicons.org/hubspot/FF7A59', brandColor: '#FF7A59', live: true },
        { name: 'Salesforce', src: 'https://cdn.simpleicons.org/salesforce/00A1E0', brandColor: '#00A1E0' },
        { name: 'Pipedrive', src: 'https://cdn.simpleicons.org/pipedrive/017737', brandColor: '#017737' },
        { name: 'Close', src: '', brandColor: '#7B68EE', fallbackText: 'C' },
      ],
    },
    {
      heading: 'REVENUE & BILLING',
      tools: [
        { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe/635BFF', brandColor: '#635BFF' },
        { name: 'Paddle', src: 'https://cdn.simpleicons.org/paddle/007AB5', brandColor: '#007AB5', fallbackText: 'Pa' },
        { name: 'Chargebee', src: 'https://cdn.simpleicons.org/chargebee/FF4B00', brandColor: '#FF4B00', fallbackText: 'Cb' },
        { name: 'Recurly', src: 'https://cdn.simpleicons.org/recurly/7B4CB3', brandColor: '#7B4CB3', fallbackText: 'Re' },
      ],
    },
    {
      heading: 'SUPPORT & CX',
      tools: [
        { name: 'Zendesk', src: 'https://cdn.simpleicons.org/zendesk/03363D', brandColor: '#03363D' },
        { name: 'Intercom', src: 'https://cdn.simpleicons.org/intercom/6AFDEF', brandColor: '#6AFDEF' },
        { name: 'Help Scout', src: 'https://cdn.simpleicons.org/helpscout/1292EE', brandColor: '#1292EE', fallbackText: 'HS' },
        { name: 'Freshdesk', src: 'https://cdn.simpleicons.org/freshdesk/22C55E', brandColor: '#22C55E', fallbackText: 'Fd' },
      ],
    },
    {
      heading: 'COMMS & EMAIL',
      tools: [
        { name: 'Slack', src: 'https://cdn.simpleicons.org/slack/4A154B', brandColor: '#4A154B' },
        { name: 'Gmail', src: 'https://cdn.simpleicons.org/gmail/EA4335', brandColor: '#EA4335' },
        { name: 'Microsoft Teams', src: 'https://cdn.simpleicons.org/microsoftteams/6264A7', brandColor: '#6264A7' },
        { name: 'Mailchimp', src: 'https://cdn.simpleicons.org/mailchimp/FFE01B', brandColor: '#FFE01B' },
      ],
    },
    {
      heading: 'PROJECT & DELIVERY',
      tools: [
        { name: 'Asana', src: 'https://cdn.simpleicons.org/asana/F06A6A', brandColor: '#F06A6A' },
        { name: 'Linear', src: 'https://cdn.simpleicons.org/linear/5E6AD2', brandColor: '#5E6AD2' },
        { name: 'ClickUp', src: 'https://cdn.simpleicons.org/clickup/7B68EE', brandColor: '#7B68EE' },
        { name: 'Jira', src: 'https://cdn.simpleicons.org/jira/0052CC', brandColor: '#0052CC' },
      ],
    },
    {
      heading: 'KNOWLEDGE & DOCS',
      tools: [
        { name: 'Notion', src: `https://cdn.simpleicons.org/notion/${theme === 'dark' ? 'FFFFFF' : '000000'}`, brandColor: theme === 'dark' ? '#FFFFFF' : '#000000' },
        { name: 'Google Drive', src: 'https://cdn.simpleicons.org/googledrive/4285F4', brandColor: '#4285F4' },
        { name: 'Confluence', src: 'https://cdn.simpleicons.org/confluence/172B4D', brandColor: '#172B4D' },
        { name: 'OneDrive', src: 'https://cdn.simpleicons.org/onedrive/0078D4', brandColor: '#0078D4' },
      ],
    },
  ]

  return (
    <>
      <style>{`
        .sa-integrations-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 32px;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 900px) {
          .sa-integrations-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .sa-integrations-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      <section style={{ padding: '96px 0 82px', background: C.bg, textAlign: 'center' }}>
        <div style={wrap}>
          <div style={{ ...sectionLabel(C), color: C.inkMuted }}>LIVE BUSINESS INTELLIGENCE</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(42px, 5vw, 52px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink, margin: '0 auto 18px' }}>
            Your business, under the hood.
          </h1>
          <p style={{ fontSize: 17, color: C.inkSoft, maxWidth: 580, margin: '0 auto' }}>
            Most advice is based on what you remember. SelfAudit connects directly to your tools — and audits from what&apos;s actually there.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 0 90px', background: C.bg }}>
        <div style={{ ...wrap, maxWidth: 1080 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            {[
              {
                num: '01',
                title: 'Two clicks per tool',
                body: 'No CSV exports. No copy-paste. No briefing calls. SelfAudit reads your tools directly and knows what\'s in them.',
              },
              {
                num: '02',
                title: 'Runs across every function',
                body: 'Pipeline velocity. Revenue signals. Support backlog. Ops gaps. Team blockers. Checked automatically, on a schedule you set.',
              },
              {
                num: '03',
                title: 'Full visibility. Every week. Automatically.',
                body: 'Not a dashboard full of numbers. A ranked list of what\'s actually wrong — with the evidence to back it up. Delivered on a weekly cadence so nothing slips through.',
              },
            ].map((step, index) => (
              <div key={step.num} style={{ padding: '28px 28px 24px', borderRight: index < 2 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontFamily: serif, fontSize: 30, color: C.accentText, marginBottom: 12 }}>{step.num}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 10 }}>{step.title}</div>
                <div style={{ fontSize: 16, color: C.inkSoft, lineHeight: 1.65 }}>{step.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 92px', background: C.bg }}>
        <div style={{ ...wrap, maxWidth: 1240 }}>
          <div style={{ ...sectionLabel(C), color: C.inkMuted }}>READS FROM</div>
          <h2 style={h2Style(C)}>Every system that runs your business.</h2>
          <p style={{ textAlign: 'center', fontSize: 17, color: C.inkSoft, maxWidth: 760, margin: '0 auto 44px' }}>
            Connect once. SelfAudit handles the rest — pulling live data across your entire stack, not just one tool.
          </p>

          <div className="sa-integrations-grid">
            {connectorColumns.map((column) => (
              <div key={column.heading}>
                <div style={{ fontSize: 10, color: C.accentText, letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: `0.5px solid ${C.border}`, paddingBottom: 8, marginBottom: 16, fontWeight: 700 }}>
                  {column.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {column.tools.map((tool) => (
                    <div key={tool.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <ConnectorLogo tool={tool.name} src={tool.src} brandColor={tool.brandColor} fallbackText={tool.fallbackText} />
                      <span style={{ fontSize: 13, color: C.inkSoft, display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {tool.name}
                        {tool.live && (
                          <span style={{ ...liveBadge, borderRadius: 999, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>
                            Live
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: 13, color: C.inkMuted, fontStyle: 'italic', marginTop: 22 }}>
            10+ more connectors available in your dashboard — and more shipping every month.
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 92px', background: C.bg }}>
        <div style={{ ...wrap, textAlign: 'center', maxWidth: 980 }}>
          <h2 style={{ fontFamily: serif, fontSize: 32, color: C.ink, lineHeight: 1.12, margin: '0 auto 16px' }}>
            It doesn&apos;t wait to be asked.
          </h2>
          <p style={{ fontSize: 17, color: C.inkSoft, maxWidth: 760, margin: '0 auto 28px' }}>
            SelfAudit runs scheduled sweeps across your connected stack — weekly, daily, or on demand. When something shifts, you hear about it before it becomes a problem.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              'Pipeline velocity drop',
              'Churn signal detected',
              'Support backlog spike',
              'Revenue vs forecast gap',
              'Unresolved team blockers',
              'Goal tracking off pace',
            ].map((pill) => (
              <span key={pill} style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.inkSoft, borderRadius: 999, padding: '9px 14px', fontSize: 14 }}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '64px 0', background: C.surface2 }}>
        <div style={{ ...wrap, textAlign: 'center', maxWidth: 980 }}>
          <div style={{ fontFamily: serif, fontSize: 28, fontStyle: 'italic', lineHeight: 1.4, color: C.ink, maxWidth: 680, margin: '0 auto 28px' }}>
            Every other audit tool asks you to describe your business. SelfAudit already knows.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: C.inkSoft, fontSize: 16 }}>
            <span>No self-reported metrics.</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
            <span>No memory gaps.</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
            <span>No guesswork.</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.border, display: 'inline-block' }} />
            <span>No waiting for a calendar invite.</span>
          </div>
        </div>
      </section>

      <section style={{ background: C.bg, textAlign: 'center', padding: '64px 0' }}>
        <div style={wrap}>
          <div style={{ fontSize: 22, color: C.ink, lineHeight: 1.2, marginBottom: 10 }}>
            Ready to audit from the source?
          </div>
          <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 24 }}>
            Connect your first tool in 2 minutes.
          </div>
          <PrimaryButton label="Start free audit" onClick={() => onStartAudit('')} C={C} />
          <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 14 }}>
            HubSpot live now. Stripe, Slack, Gmail, Notion shipping soon.
          </div>
        </div>
      </section>
    </>
  )
}

function SocialProofTicker({ C }) {
  const [rowOneItems, setRowOneItems] = useState([])
  const [rowTwoItems, setRowTwoItems] = useState([])
  const wrapperRef = useRef(null)
  const rowOneRef = useRef(null)
  const rowTwoRef = useRef(null)
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    rowOneOffset: 0,
    rowTwoOffset: 0,
  })

  useEffect(() => {
    const firstRow = socialProofQuotes.slice(0, 6)
    const secondRow = socialProofQuotes.slice(6, 12)
    setRowOneItems([...firstRow, ...firstRow])
    setRowTwoItems([...secondRow, ...secondRow])

    const styleId = 'sa-social-proof-keyframes'
    let el = document.getElementById(styleId)
    if (!el) {
      el = document.createElement('style')
      el.id = styleId
      document.head.appendChild(el)
    }
    el.textContent = `
      @keyframes saSocialProofScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `
    return () => {
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const firstTrack = rowOneRef.current
    const secondTrack = rowTwoRef.current
    if (!wrapper || !firstTrack || !secondTrack) return

    const duration = 90
    const trackConfigs = [
      { ref: rowOneRef, reverse: false, key: 'rowOneOffset' },
      { ref: rowTwoRef, reverse: true, key: 'rowTwoOffset' },
    ]

    const getClientX = (event) => ('touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX)

    const getTranslateX = (el) => {
      const transform = window.getComputedStyle(el).transform
      if (!transform || transform === 'none') return 0
      return new DOMMatrixReadOnly(transform).m41
    }

    const normalizeOffset = (offset, width) => {
      let normalized = offset % width
      if (normalized > 0) normalized -= width
      if (normalized === -width) normalized = 0
      return normalized
    }

    const beginDrag = (event) => {
      if ('button' in event && event.button !== 0) return
      event.preventDefault()

      dragRef.current.isDragging = true
      dragRef.current.startX = getClientX(event)
      wrapper.style.cursor = 'grabbing'

      trackConfigs.forEach(({ ref, key }) => {
        const el = ref.current
        if (!el) return
        el.style.animationPlayState = 'paused'
        dragRef.current[key] = getTranslateX(el)
        el.style.animation = 'none'
        el.style.transform = `translateX(${dragRef.current[key]}px)`
      })
    }

    const moveDrag = (event) => {
      if (!dragRef.current.isDragging) return
      if (event.cancelable) event.preventDefault()

      const delta = getClientX(event) - dragRef.current.startX
      trackConfigs.forEach(({ ref, key }) => {
        const el = ref.current
        if (!el) return
        el.style.transform = `translateX(${dragRef.current[key] + delta}px)`
      })
    }

    const endDrag = () => {
      if (!dragRef.current.isDragging) return

      dragRef.current.isDragging = false
      wrapper.style.cursor = 'grab'

      trackConfigs.forEach(({ ref, reverse }) => {
        const el = ref.current
        if (!el) return

        const width = el.scrollWidth / 2
        const currentOffset = getTranslateX(el)
        const normalized = normalizeOffset(currentOffset, width)
        const progress = reverse
          ? (normalized + width) / width
          : Math.abs(normalized) / width
        const delay = progress >= 1 ? 0 : -(progress * duration)

        el.style.animation = `saSocialProofScroll ${duration}s linear infinite`
        el.style.animationDirection = reverse ? 'reverse' : 'normal'
        el.style.animationDelay = `${delay}s`
        el.style.animationPlayState = 'running'
        el.style.transform = ''
      })
    }

    wrapper.addEventListener('mousedown', beginDrag)
    wrapper.addEventListener('touchstart', beginDrag, { passive: false })
    window.addEventListener('mousemove', moveDrag)
    window.addEventListener('touchmove', moveDrag, { passive: false })
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('touchend', endDrag)

    return () => {
      wrapper.removeEventListener('mousedown', beginDrag)
      wrapper.removeEventListener('touchstart', beginDrag)
      window.removeEventListener('mousemove', moveDrag)
      window.removeEventListener('touchmove', moveDrag)
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('touchend', endDrag)
    }
  }, [rowOneItems, rowTwoItems])

  return (
    <section style={{ padding: '170px 0 140px', background: C.bg }}>
      <div
        ref={wrapperRef}
        style={{ position: 'relative', overflow: 'hidden', width: '100%', padding: '32px 0', cursor: 'grab', touchAction: 'pan-y' }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 160,
          zIndex: 2,
          pointerEvents: 'none',
          background: `linear-gradient(to right, ${C.bg} 0%, transparent 100%)`,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 160,
          zIndex: 2,
          pointerEvents: 'none',
          background: `linear-gradient(to left, ${C.bg} 0%, transparent 100%)`,
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div
            ref={rowOneRef}
            style={{
              display: 'flex',
              width: 'max-content',
              whiteSpace: 'nowrap',
              animation: 'saSocialProofScroll 90s linear infinite',
            }}
          >
            {rowOneItems.map((quote, index) => (
              <div key={`${quote}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '0 120px' }}>
                <span style={{ fontFamily: serif, fontSize: 60, fontStyle: 'italic', color: C.ink, lineHeight: 1.08 }}>{quote}</span>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.border, flexShrink: 0, display: 'inline-block' }} />
              </div>
            ))}
          </div>

          <div
            ref={rowTwoRef}
            style={{
              display: 'flex',
              width: 'max-content',
              whiteSpace: 'nowrap',
              animation: 'saSocialProofScroll 90s linear infinite',
              animationDirection: 'reverse',
            }}
          >
            {rowTwoItems.map((quote, index) => (
              <div key={`${quote}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '0 120px' }}>
                <span style={{ fontFamily: serif, fontSize: 60, fontStyle: 'italic', color: C.ink, lineHeight: 1.08 }}>{quote}</span>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.border, flexShrink: 0, display: 'inline-block' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
    fontSize: 14,
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
          fontSize: 14,
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
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.inkMuted, marginBottom: 16 }}>
            What's yours?
          </div>

          {/* Q1 — Goal */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>The goal</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {goals.map(g => (
                <div key={g} onClick={() => setVisionGoal(g)} style={tileStyle(visionGoal === g)}>{g}</div>
              ))}
            </div>
          </div>

          {/* Q2 — Current */}
          {visionGoal && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>Right now</div>
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
              <div style={{ fontSize: 14, color: C.inkSoft, marginBottom: 10, fontWeight: 500 }}>Timeline</div>
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
                fontSize: 16,
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
                  fontSize: 15,
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

// ── Pricing Page ──────────────────────────────────────────────────────────────

const pricingFAQ = [
  { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no lock-ins. Cancel from your account settings and your plan ends at the billing period.' },
  { q: 'What happens to my data if I cancel?', a: 'Your audit history and intelligence profile stay on file for 90 days after cancellation, then are permanently deleted.' },
  { q: 'Is there a free trial?', a: 'No trial, but anyone can run a full diagnostic audit for free — no account needed. You only pay when you want to save results or access the intelligence layer.' },
  { q: 'What\'s the difference between Foundation and Intelligence?', a: 'Foundation is per-audit diagnosis — run an audit, get a full report. Intelligence is persistent: your business state is tracked across audits, re-audits are unlimited, and the system learns your patterns over time.' },
  { q: 'Do you offer team or agency plans?', a: 'Not yet. Portfolio tier is available for operators running multiple businesses — reach out directly.' },
]

function PricingPage({ C, onSignUp, onStartAudit }) {
  const [openFAQ, setOpenFAQ] = useState(null)

  return (
    <div style={{ padding: '72px 0 100px' }}>
      <div style={wrap}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={sectionLabel(C)}>Pricing</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, margin: '0 auto 16px' }}>
            Two ways to run SelfAudit.
          </h1>
          <p style={{ fontSize: 18, color: C.inkSoft, maxWidth: 560, margin: '0 auto' }}>
            Choose how deep you want the intelligence embedded in your business.
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1080, margin: '0 auto 80px' }}>
          {/* Foundation */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 36, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: '-0.03em', marginBottom: 10 }}>Foundation</div>
            <div style={{ fontFamily: serif, fontSize: 52, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
              $29<span style={{ fontSize: 22, color: C.inkMuted, marginLeft: 4 }}>/mo</span>
            </div>
            <div style={{ fontSize: 15, color: C.inkMuted, marginTop: 8, marginBottom: 28 }}>The truth about your business.</div>
            <div style={{ marginBottom: 28 }}>
              <FeatureList items={freeFeatures} color={C.inkSoft} iconColor={C.accentText} />
            </div>
            <div style={{ marginTop: 'auto' }}>
              <OutlineButton label="Start Foundation — $29/mo" onClick={() => onSignUp('foundation')} C={C} />
              <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 12, textAlign: 'center' }}>Includes account setup and immediate access.</div>
            </div>
          </div>

          {/* Intelligence */}
          <GrowthOSCard onSignUp={onSignUp} C={C} />
        </div>

        {/* Comparison table */}
        <div style={{ maxWidth: 760, margin: '0 auto 80px' }}>
          <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: C.ink, textAlign: 'center', marginBottom: 32 }}>What's included</h3>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {[
              { feature: 'Full drill-down audit',             foundation: true,  intelligence: true },
              { feature: 'Complete written report',           foundation: true,  intelligence: true },
              { feature: 'Root cause diagnosis',              foundation: true,  intelligence: true },
              { feature: 'Fix-first priority list',           foundation: true,  intelligence: true },
              { feature: 'Email delivery',                    foundation: true,  intelligence: true },
              { feature: 'Unlimited re-audits',               foundation: false, intelligence: true },
              { feature: 'Persistent business intelligence',  foundation: false, intelligence: true },
              { feature: 'AI opportunity breakdown',          foundation: false, intelligence: true },
              { feature: 'Health score tracking',             foundation: false, intelligence: true },
              { feature: 'Ask TSA (business Q&A)',            foundation: false, intelligence: true },
              { feature: 'Risk alerts',                       foundation: false, intelligence: true },
              { feature: 'Connector integrations',            foundation: false, intelligence: true },
            ].map(({ feature, foundation, intelligence }, i) => (
              <div key={feature} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < 11 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? 'transparent' : C.surface,
              }}>
                <span style={{ fontSize: 14, color: C.inkSoft }}>{feature}</span>
                <span style={{ textAlign: 'center', fontSize: 16, color: foundation ? C.accentText : C.inkMuted }}>{foundation ? '✓' : '—'}</span>
                <span style={{ textAlign: 'center', fontSize: 16, color: intelligence ? C.accentText : C.inkMuted }}>{intelligence ? '✓' : '—'}</span>
              </div>
            ))}
            {/* Header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 120px',
              padding: '12px 20px', background: C.surface,
              borderBottom: `1px solid ${C.border}`, order: -1,
            }}>
              <span />
              <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.ink, letterSpacing: '0.04em' }}>FOUNDATION</span>
              <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.accentText, letterSpacing: '0.04em' }}>INTELLIGENCE</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 680, margin: '0 auto 80px' }}>
          <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, color: C.ink, textAlign: 'center', marginBottom: 32 }}>Common questions</h3>
          {pricingFAQ.map(({ q, a }, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: '18px 0' }}>
              <button
                type="button"
                style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left' }}
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
              >
                <span style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>{q}</span>
                <span style={{ fontSize: 18, color: C.inkMuted, flexShrink: 0 }}>{openFAQ === i ? '−' : '+'}</span>
              </button>
              {openFAQ === i && (
                <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.7, margin: '12px 0 0' }}>{a}</p>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: C.inkSoft, marginBottom: 28 }}>
            Not sure which plan? Start with the free audit first.
          </p>
          <PrimaryButton label="Start your free audit" onClick={() => onStartAudit('')} C={C} />
          <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 12 }}>5 minutes. No account needed. Brutally honest.</div>
        </div>

      </div>
    </div>
  )
}

// ── Engine Room ───────────────────────────────────────────────────────────────

const streamRows = [
  { time: '23:42:18', type: 'INGEST',  text: 'HubSpot · 4 deals updated',               pill: 'CRM'   },
  { time: '23:42:21', type: 'INGEST',  text: 'Stripe · payment burst · $2,400',          pill: 'REV'   },
  { time: '23:42:27', type: 'SIGNAL',  text: 'CAC trending up · 22% WoW',               pill: 'WATCH' },
  { time: '23:42:31', type: 'INGEST',  text: 'Slack · 127 messages parsed',              pill: 'COMMS' },
  { time: '23:42:38', type: 'VERDICT', text: 'Pipeline leak · $8.6K/mo · F#2547',       pill: 'CRIT'  },
  { time: '23:42:44', type: 'INGEST',  text: 'Linear · 6 tickets shipped',               pill: 'OPS'   },
  { time: '23:42:51', type: 'SIGNAL',  text: 'Goal #3 · 3 weeks behind pace',            pill: 'WATCH' },
  { time: '23:42:57', type: 'INGEST',  text: 'Gmail · 14 customer threads',              pill: 'COMMS' },
  { time: '23:43:04', type: 'VERDICT', text: 'Strategy drift · 35-person co · F#2548',  pill: 'HIGH'  },
  { time: '23:43:09', type: 'INGEST',  text: 'Notion · OKRs Q3 indexed',                pill: 'DOCS'  },
  { time: '23:43:14', type: 'SIGNAL',  text: 'Activation dropped 14% · onboarding',     pill: 'WATCH' },
  { time: '23:43:19', type: 'INGEST',  text: 'Stripe · churn cohort shape change',      pill: 'REV'   },
  { time: '23:43:24', type: 'VERDICT', text: 'Pricing positioning · B2B SaaS · F#2549', pill: 'HIGH'  },
  { time: '23:43:30', type: 'INGEST',  text: 'HubSpot · 12 new leads scored',           pill: 'CRM'   },
  { time: '23:43:36', type: 'SIGNAL',  text: 'Cohort LTV down 9% · last 4wk',           pill: 'WATCH' },
]

const erRows = [...streamRows, ...streamRows]
const mono = "'JetBrains Mono', 'Fira Mono', 'Courier New', monospace"

function EngineRoom({ C }) {
  const [stats, setStats] = useState({ s1: 847, s2: 12, s3: 94, s4: 3.4 })

  useEffect(() => {
    const id = setInterval(() => {
      setStats({
        s1: Math.floor(820 + Math.random() * 60),
        s2: Math.floor(9 + Math.random() * 6),
        s3: Math.floor(92 + Math.random() * 5),
        s4: parseFloat((3.0 + Math.random() * 0.9).toFixed(1)),
      })
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const panelBg        = C.theme === 'dark' ? '#FBFAF6' : '#0E0C0A'
  const panelSurface   = C.theme === 'dark' ? 'rgba(242,237,226,0.9)' : 'rgba(15,11,8,0.8)'
  const panelBorder    = C.theme === 'dark' ? '#E4DDD0' : 'rgba(250,247,242,0.08)'
  const panelBorderSoft = C.theme === 'dark' ? '#EDE5D4' : 'rgba(250,247,242,0.06)'
  const panelInkFaint  = C.theme === 'dark' ? '#8A8378' : 'rgba(250,247,242,0.40)'
  const panelInkDim    = C.theme === 'dark' ? '#B8A682' : 'rgba(250,247,242,0.28)'
  const panelInkSoft   = C.theme === 'dark' ? '#3A352D' : 'rgba(250,247,242,0.85)'
  const panelRowBorder = C.theme === 'dark' ? 'rgba(26,20,16,0.08)' : 'rgba(250,247,242,0.06)'
  const panelVerdictBg = C.theme === 'dark' ? 'rgba(110,42,30,0.06)' : 'rgba(224,122,106,0.06)'
  const panelVerdictColor = C.theme === 'dark' ? '#6E2A1E' : '#E07A6A'
  const panelIngestColor  = C.theme === 'dark' ? '#2F6B47' : '#7BAE89'
  const panelSignalColor  = C.theme === 'dark' ? '#8A6F1A' : '#E07A6A'

  const typeColor = (type) => {
    if (type === 'INGEST') return panelIngestColor
    if (type === 'SIGNAL') return panelSignalColor
    return panelVerdictColor
  }

  return (
    <section style={{ background: C.bg, padding: 'clamp(56px, 7vw, 100px) 0 clamp(64px, 8vw, 120px)' }}>
      <style>{`
        @keyframes erScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes erPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div className="sa-er-grid">

        {/* ── Left: copy ── */}
        <div className="sa-er-sticky" style={{ position: 'sticky', top: 140 }}>

          <div style={{
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.accent,
            marginBottom: 24,
          }}>
            Real-time intelligence layer
          </div>

          <h2 style={{
            fontFamily: serif,
            fontSize: 'clamp(52px, 5.5vw, 76px)',
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            margin: '0 0 28px',
            color: C.ink,
          }}>
            Inside the<br />
            <em style={{ fontStyle: 'italic', color: C.redMuted }}>engine room.</em>
          </h2>

          <p style={{
            fontFamily: serif,
            fontSize: 'clamp(18px, 1.6vw, 22px)',
            color: C.inkSoft,
            lineHeight: 1.65,
            margin: '0 0 40px',
          }}>
            Every minute, the brain ingests signals from your tools, pattern-matches against thousands of business outcomes, and surfaces what matters.{' '}
            <em style={{ fontStyle: 'italic' }}>This is what&apos;s happening right now.</em>
          </p>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 32 }}>
            {[
              { value: stats.s1.toString(), label: 'Signals processed / min' },
              { value: stats.s2.toString(), label: 'Active investigations' },
              { value: `${stats.s3}%`,      label: 'Verdict confidence' },
              { value: `${stats.s4}s`,      label: 'Median diagnosis time' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: serif,
                  fontSize: 52,
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: C.redMuted,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: C.inkFaint,
                  marginTop: 8,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: stream panel ── */}
        <div className="sa-er-stream" style={{
          background: panelBg,
          borderRadius: 12,
          height: 600,
          overflow: 'hidden',
          border: `1px solid ${panelBorder}`,
          position: 'relative',
          boxShadow: C.theme === 'light' ? '0 1px 0 #D8CFBC, 0 8px 0 rgba(26,20,16,0.04), 0 32px 80px rgba(26,20,16,0.22), 0 12px 32px rgba(26,20,16,0.14)' : '0 2px 0 #1F1B16, 0 20px 50px rgba(0,0,0,0.45)',
        }}>
          {/* Header bar */}
          <div style={{
            background: panelSurface,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${panelBorder}`,
          }}>
            <div style={{ fontFamily: mono, fontSize: 13, color: panelInkFaint }}>
              stream / <span style={{ color: panelVerdictColor }}>live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: panelIngestColor, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: panelIngestColor }}>RECEIVING</span>
            </div>
          </div>

          {/* Top fade */}
          <div style={{
            position: 'absolute', top: 45, left: 0, right: 0, height: 56,
            background: `linear-gradient(to bottom, ${panelBg}, transparent)`,
            zIndex: 2, pointerEvents: 'none',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: `linear-gradient(to top, ${panelBg}, transparent)`,
            zIndex: 2, pointerEvents: 'none',
          }} />

          {/* Scroll body */}
          <div style={{ height: 'calc(100% - 45px)', overflow: 'hidden' }}>
            <div style={{ animation: 'erScroll 28s linear infinite' }}>
              {erRows.map((row, i) => {
                const isVerdict = row.type === 'VERDICT'
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '76px 68px 1fr 50px',
                    gap: '0 14px',
                    alignItems: 'center',
                    padding: '11px 20px',
                    borderBottom: `1px solid ${panelRowBorder}`,
                    background: isVerdict ? panelVerdictBg : 'transparent',
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: panelInkDim }}>{row.time}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: typeColor(row.type) }}>{row.type}</span>
                    <span style={{
                      fontFamily: mono, fontSize: 12,
                      color: isVerdict ? panelVerdictColor : panelInkSoft,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{row.text}</span>
                    <span style={{
                      fontFamily: mono, fontSize: 10, letterSpacing: '0.06em',
                      color: isVerdict ? panelVerdictColor : panelInkDim,
                      border: `1px solid ${isVerdict ? panelVerdictColor : panelBorder}`,
                      borderRadius: 3,
                      padding: '2px 5px',
                      textAlign: 'center',
                    }}>{row.pill}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── Four Verbs ────────────────────────────────────────────────────────────────

function FourVerbs({ C }) {
  const cardBg = C.theme === 'dark' ? C.card : '#ffffff'

  const verbs = [
    {
      num: '01',
      verb: 'diagnoses.',
      desc: 'Tell it a symptom. It investigates across your tools, history, and patterns — then names the cause, not the surface.',
      card: (
        <div style={{ background: cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 22 }}>SYMPTOM</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontStyle: 'italic', color: C.inkMuted, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
            &ldquo;Why is our churn climbing?&rdquo;
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
            VERDICT · 3.4S
          </div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.55 }}>
            Retention <em style={{ fontStyle: 'italic', color: C.redMuted }}>looks fine</em> because acquisition is masking it. Your cohorts are weaker —{' '}
            <em style={{ fontStyle: 'italic', color: C.redMuted }}>the curves cross in nine months.</em>
          </div>
        </div>
      ),
    },
    {
      num: '02',
      verb: 'remembers.',
      desc: 'Every diagnosis, signal, conversation — compounds. By day ninety, it knows your business better than your co-founder.',
      card: (
        <div style={{ background: cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, minHeight: 340 }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 22 }}>MEMORY · 11 WEEKS</div>
          {[
            { day: 'Day 04', text: 'Founder said hiring was the biggest constraint.', accent: false },
            { day: 'Day 31', text: 'Pricing flagged as a leak. Was deprioritized.', accent: false },
            { day: 'Day 58', text: 'Hiring discussion resurfaced — pricing still untouched.', accent: false },
            { day: 'Day 77', text: 'Third time hiring has come up before pricing was settled. Pattern, not coincidence.', accent: true },
          ].map((item, i, arr) => (
            <div key={item.day} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr',
              gap: 16,
              alignItems: 'start',
              padding: '14px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontFamily: mono, fontSize: 12, color: C.accent, paddingTop: 2 }}>{item.day}</span>
              {item.accent
                ? <em style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: C.redMuted, lineHeight: 1.55 }}>{item.text}</em>
                : <span style={{ fontFamily: serif, fontSize: 16, color: C.inkSoft, lineHeight: 1.55 }}>{item.text}</span>
              }
            </div>
          ))}
        </div>
      ),
    },
    {
      num: '03',
      verb: 'watches.',
      desc: 'Weekly governance across your connected tools. If a metric drifts or a goal slips, you hear about it before the meeting.',
      card: (
        <div style={{ background: cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 22 }}>ALERTS · LAST 7 DAYS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { time: 'SUN · 23:42', body: <>CAC drifted <em style={{ fontStyle: 'italic', color: C.redMuted }}>22% this week.</em> Cause sits in Thursday&apos;s launch.</> },
              { time: 'WED · 04:18', body: <>Goal &ldquo;Hit $500K Q3&rdquo; is now <em style={{ fontStyle: 'italic', color: C.redMuted }}>3 weeks behind pace.</em> Path salvageable.</> },
              { time: 'FRI · 09:02', body: <>Onboarding completion dropped <em style={{ fontStyle: 'italic', color: C.redMuted }}>14%</em> after Tuesday&apos;s UX change.</> },
            ].map((alert) => (
              <div key={alert.time} style={{
                borderLeft: `3px solid ${C.accent}`,
                borderRadius: '0 8px 8px 0',
                padding: '12px 16px',
                background: C.surface2,
              }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>{alert.time}</div>
                <div style={{ fontFamily: serif, fontSize: 16, color: C.inkSoft, lineHeight: 1.55 }}>{alert.body}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      num: '04',
      verb: 'decides.',
      desc: 'Other AI gives you ten options. The brain picks one move — ranked by impact, evidence, and what you can actually do this week.',
      card: (
        <div style={{ background: cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 24 }}>NEXT MOVE · RANKED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {['Hire a VP of Sales', 'Run a Google Ads test', 'Launch the new feature'].map((item) => (
              <div key={item} style={{ fontFamily: serif, fontSize: 18, fontStyle: 'italic', color: C.inkFaint, textDecoration: 'line-through' }}>{item}</div>
            ))}
          </div>
          <div style={{ borderTop: `2px solid ${C.accent}`, paddingTop: 14, marginTop: 'auto' }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.55 }}>
              <em style={{ fontStyle: 'italic', color: C.redMuted }}>Cancel the agency contract.</em>{' '}
              Reallocate the $5K to Clay. 30-day test with one rep.{' '}
              <em style={{ fontStyle: 'italic', color: C.redMuted }}>Stop everything else.</em>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="sa-fv-section" style={{ background: C.bg, position: 'relative', borderTop: `1px solid ${C.border}` }}>
      <div style={{ height: '400vh', position: 'relative' }}>

        {/* Sticky heading */}
        <div className="sa-fv-sticky-head" style={{
          position: 'sticky',
          top: 0,
          paddingTop: 'clamp(64px, 9vw, 140px)',
          paddingLeft: 'clamp(28px, 6vw, 80px)',
          paddingRight: 'clamp(28px, 6vw, 80px)',
          paddingBottom: 40,
          background: C.bg,
          zIndex: 1,
          minHeight: 'clamp(280px, 32vh, 360px)',
        }}>
          <div style={{ maxWidth: 780 }}>
            <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 20 }}>
              What an operating brain actually does
            </div>
            <h2 style={{
              fontFamily: serif,
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: C.ink,
              margin: '0 0 20px',
            }}>
              Four things <em style={{ fontStyle: 'italic', color: C.redMuted }}>only a brain</em> can do.
            </h2>
            <p style={{ fontFamily: serif, fontSize: 22, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Tools wait for prompts. Dashboards show numbers. Reports get filed. A brain <em style={{ fontStyle: 'italic' }}>works.</em>
            </p>
          </div>
        </div>

        {/* Four sticky verb cards */}
        {verbs.map((v, i) => (
          <div
            key={v.num}
            className="sa-fv-card"
            style={{
              position: 'sticky',
              top: `calc(clamp(280px, 32vh, 360px) + ${i * 24}px)`,
              zIndex: 2 + i,
              marginLeft: 'clamp(28px, 6vw, 80px)',
              marginRight: 'clamp(28px, 6vw, 80px)',
              marginBottom: i === 3 ? 0 : 'calc(100vh - clamp(360px, 36vh, 420px))',
              background: C.bg,
              borderTop: `1px solid ${C.ink}`,
              paddingTop: 'clamp(40px, 6vw, 72px)',
              paddingBottom: 'clamp(48px, 7vw, 80px)',
              boxShadow: i === 0 ? 'none' : `0 -12px 40px ${C.theme === 'light' ? 'rgba(26,20,16,0.06)' : 'rgba(0,0,0,0.4)'}`,
            }}
          >
            <div className="sa-fv-card-grid">
              {/* Left */}
              <div>
                <div style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.accent, marginBottom: 16 }}>
                  {v.num} / FOUR
                </div>
                <h3 style={{
                  fontFamily: serif,
                  fontSize: 'clamp(32px, 6vw, 88px)',
                  fontWeight: 700,
                  lineHeight: 0.98,
                  letterSpacing: '-0.045em',
                  margin: '0 0 24px',
                }}>
                  <span style={{ color: C.ink }}>It </span>
                  <em style={{ fontStyle: 'italic', color: C.redMuted }}>{v.verb}</em>
                </h3>
                <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
                  {v.desc}
                </p>
              </div>

              {/* Right: card */}
              {v.card}
            </div>
          </div>
        ))}

      </div>
    </section>
  )
}

// ── Live Diagnosis ────────────────────────────────────────────────────────────

function LiveDiagnosis({ C }) {
  const sectionRef  = useRef(null)
  const symptomRef  = useRef(null)
  const step0Ref    = useRef(null)
  const step1Ref    = useRef(null)
  const step2Ref    = useRef(null)
  const step3Ref    = useRef(null)
  const vlabelRef   = useRef(null)
  const vtextRef    = useRef(null)
  const vmetaRef    = useRef(null)
  const m1Ref       = useRef(null)
  const m2Ref       = useRef(null)
  const m3Ref       = useRef(null)
  const m4Ref       = useRef(null)
  const cancelRef   = useRef(false)

  useEffect(() => {
    const stepRefs = [step0Ref, step1Ref, step2Ref, step3Ref]
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    const cycles = [
      {
        symptom: 'Our team is busy every day but nothing seems to be moving forward.',
        verdictSegments: [
          { text: 'You’re not held back by effort. You have ', italic: false },
          { text: 'strategic ambiguity', italic: true },
          { text: ' — your team is making competent decisions about ', italic: false },
          { text: 'three different versions', italic: true },
          { text: ' of where this company is going.', italic: false },
        ],
        meta: { m1: 'Strategic ambiguity', m2: '91% · High', m3: '$340K / quarter', m4: 'Re-anchor the team by Friday' },
      },
      {
        symptom: 'Revenue is up but margins keep getting worse every month.',
        verdictSegments: [
          { text: 'Your revenue is growing because ', italic: false },
          { text: 'discounting hides the leak.', italic: true },
          { text: ' Margin won’t recover until your ', italic: false },
          { text: 'delivery model changes', italic: true },
          { text: ' — not your pricing.', italic: false },
        ],
        meta: { m1: 'Delivery model leak', m2: '88% · High', m3: '$210K / quarter', m4: 'Rework delivery before Q4' },
      },
      {
        symptom: 'Churn looks stable but new customer cohorts feel weaker.',
        verdictSegments: [
          { text: 'Your cohorts aren’t weaker. ', italic: false },
          { text: 'Your onboarding moved', italic: true },
          { text: ' when you redesigned the dashboard in March. Activation dropped ', italic: false },
          { text: '31% the next week.', italic: true },
          { text: ' Nobody told you.', italic: false },
        ],
        meta: { m1: 'Onboarding regression', m2: '94% · Very high', m3: '$185K LTV / cohort', m4: 'Revert flow · A/B in 7 days' },
      },
      {
        symptom: 'We keep hiring and the work keeps slowing down.',
        verdictSegments: [
          { text: 'You’re hiring ahead of clarity. Every new person inherits ', italic: false },
          { text: 'three competing priorities', italic: true },
          { text: ' and picks one. That’s why work is slowing — ', italic: false },
          { text: 'not because they’re not working.', italic: true },
        ],
        meta: { m1: 'Priority dilution', m2: '89% · High', m3: '1 quarter of velocity', m4: 'Freeze hiring · Re-spec roadmap' },
      },
    ]

    const buildHtml = (chars, upTo) => {
      let html = ''
      let j = 0
      while (j < upTo) {
        if (chars[j].italic) {
          html += `<em style="font-style:italic;color:${C.theme === 'dark' ? '#8A6F1A' : C.amber}">`
          while (j < upTo && chars[j].italic) {
            const c = chars[j].char
            html += c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c
            j++
          }
          html += '</em>'
        } else {
          const c = chars[j].char
          html += c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c
          j++
        }
      }
      return html
    }

    let cycleIndex = 0

    const runLoop = async () => {
      while (!cancelRef.current) {
        const cycle = cycles[cycleIndex % cycles.length]
        cycleIndex++

        // 1. Reset
        if (symptomRef.current) { symptomRef.current.textContent = ''; symptomRef.current.classList.remove('ldc-done') }
        stepRefs.forEach(r => { if (r.current) r.current.classList.remove('ldc-show') })
        if (vlabelRef.current) vlabelRef.current.classList.remove('ldc-show')
        if (vtextRef.current)  vtextRef.current.innerHTML = ''
        if (vmetaRef.current)  vmetaRef.current.classList.remove('ldc-show')
        await sleep(300)

        // 2. Type symptom
        for (let i = 1; i <= cycle.symptom.length; i++) {
          if (cancelRef.current) return
          if (symptomRef.current) symptomRef.current.textContent = cycle.symptom.slice(0, i)
          await sleep(28)
        }
        if (symptomRef.current) symptomRef.current.classList.add('ldc-done')
        await sleep(300)

        // 3. Reveal steps
        for (const ref of stepRefs) {
          if (cancelRef.current) return
          if (ref.current) ref.current.classList.add('ldc-show')
          await sleep(380)
        }
        await sleep(300)

        // 4. Verdict label
        if (cancelRef.current) return
        if (vlabelRef.current) vlabelRef.current.classList.add('ldc-show')
        await sleep(200)

        // 5. Type verdict
        const flatChars = []
        for (const seg of cycle.verdictSegments)
          for (const char of [...seg.text])
            flatChars.push({ char, italic: seg.italic })

        for (let i = 1; i <= flatChars.length; i++) {
          if (cancelRef.current) return
          if (vtextRef.current) vtextRef.current.innerHTML = buildHtml(flatChars, i)
          await sleep(22)
        }

        // 6. Meta
        if (cancelRef.current) return
        if (m1Ref.current) m1Ref.current.textContent = cycle.meta.m1
        if (m2Ref.current) m2Ref.current.textContent = cycle.meta.m2
        if (m3Ref.current) m3Ref.current.textContent = cycle.meta.m3
        if (m4Ref.current) m4Ref.current.textContent = cycle.meta.m4
        if (vmetaRef.current) vmetaRef.current.classList.add('ldc-show')

        // 7. Hold
        await sleep(5400)
      }
    }

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        observer.disconnect()
        runLoop()
      }
    }, { threshold: 0.3 })

    if (sectionRef.current) observer.observe(sectionRef.current)

    return () => {
      cancelRef.current = true
      observer.disconnect()
    }
  }, [])

  const panelBg         = C.theme === 'dark' ? '#FBFAF6' : '#0E0C0A'
  const panelSurface    = C.theme === 'dark' ? 'rgba(242,237,226,0.9)' : 'rgba(15,11,8,0.6)'
  const panelBorder     = C.theme === 'dark' ? '#E4DDD0' : 'rgba(250,247,242,0.10)'
  const panelBorderSoft = C.theme === 'dark' ? '#EDE5D4' : 'rgba(250,247,242,0.08)'
  const panelInkFaint   = C.theme === 'dark' ? '#8A8378' : 'rgba(250,247,242,0.35)'
  const panelInkMuted   = C.theme === 'dark' ? '#5A5246' : 'rgba(250,247,242,0.50)'
  const panelInkSoft    = C.theme === 'dark' ? '#3A352D' : 'rgba(250,247,242,0.85)'
  const panelInk        = C.theme === 'dark' ? '#1A1814' : 'rgba(250,247,242,0.92)'
  const panelDotBg      = C.theme === 'dark' ? 'rgba(26,20,16,0.10)' : 'rgba(250,247,242,0.18)'
  const panelHealthy    = C.theme === 'dark' ? '#2F6B47' : '#7BAE89'
  const panelAmber      = C.theme === 'dark' ? '#8A6F1A' : C.amber
  const panelCritical   = C.theme === 'dark' ? '#6E2A1E' : '#E07A6A'

  return (
    <section ref={sectionRef} style={{ background: C.bg, padding: 'clamp(64px, 8vw, 140px) 0' }}>
      <style>{`
        @keyframes ldcBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .ldc-symptom::after {
          content: '';
          display: inline-block;
          width: 2px;
          height: 1.1em;
          background: ${C.amber};
          margin-left: 3px;
          vertical-align: text-bottom;
          animation: ldcBlink 0.9s steps(2) infinite;
        }
        .ldc-symptom.ldc-done::after { display: none; }
        .ldc-step {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .ldc-step.ldc-show { opacity: 1; transform: translateX(0); }
        .ldc-vlabel { opacity: 0; transition: opacity 0.4s ease; }
        .ldc-vlabel.ldc-show { opacity: 1; }
        .ldc-meta { opacity: 0; transition: opacity 0.5s ease; }
        .ldc-meta.ldc-show { opacity: 1; }
      `}</style>

      {/* Intro */}
      <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 64px', padding: '0 28px' }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.amber, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginRight: 14 }} />}
          A live diagnosis
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginLeft: 14 }} />}
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5.5vw, 80px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.04, color: C.ink, margin: '0 0 20px' }}>
          Watch the brain <em style={{ fontStyle: 'italic', color: C.amber }}>think.</em>
        </h2>
        <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
          Not a chat. A reasoning process. Real signals. Real verdict. Real next move.
        </p>
      </div>

      {/* Console panel */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: C.theme === 'light' ? '0 1px 0 #D8CFBC, 0 8px 0 rgba(26,20,16,0.04), 0 32px 80px rgba(26,20,16,0.22), 0 12px 32px rgba(26,20,16,0.14)' : '0 2px 0 #1F1B16, 0 20px 50px rgba(0,0,0,0.45)' }}>

          {/* Top bar */}
          <div style={{ background: panelSurface, borderBottom: `1px solid ${panelBorderSoft}`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: panelDotBg }} />)}
              </div>
              <span style={{ fontFamily: mono, fontSize: 12, color: panelInkMuted }}>selfaudit · diagnosis console</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: panelHealthy, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: panelHealthy }}>● LIVE</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 36 }}>

            {/* Symptom */}
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: panelInkFaint, marginBottom: 12 }}>SYMPTOM</div>
            <div
              ref={symptomRef}
              className="ldc-symptom"
              style={{ fontFamily: serif, fontSize: 24, fontStyle: 'italic', color: panelInk, minHeight: 68, lineHeight: 1.45 }}
            />

            {/* Thinking steps */}
            <div style={{ padding: '22px 0', borderTop: `1px solid ${panelBorderSoft}`, borderBottom: `1px solid ${panelBorderSoft}`, margin: '22px 0', minHeight: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
              {[
                { ref: step0Ref, action: 'Reading',               source: 'HubSpot · 92 deals · 8 weeks' },
                { ref: step1Ref, action: 'Cross-referencing',     source: 'Stripe cohort revenue curves' },
                { ref: step2Ref, action: 'Mapping',               source: 'decision velocity vs. execution surface area' },
                { ref: step3Ref, action: 'Isolating root cause ·', source: '4 candidates eliminated' },
              ].map(step => (
                <div key={step.action} ref={step.ref} className="ldc-step" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: panelHealthy, fontFamily: mono, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: panelInkMuted }}>
                    {step.action}{' '}<span style={{ color: panelInkSoft }}>{step.source}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Verdict label */}
            <div ref={vlabelRef} className="ldc-vlabel" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: panelAmber, marginBottom: 14 }}>
              VERDICT
            </div>

            {/* Verdict text */}
            <div
              ref={vtextRef}
              style={{ fontFamily: serif, fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 500, color: panelInk, minHeight: 120, lineHeight: 1.55 }}
            />

            {/* Meta grid */}
            <div ref={vmetaRef} className="ldc-meta sa-ld-meta" style={{ marginTop: 36, borderTop: `1px solid ${panelBorderSoft}`, paddingTop: 24 }}>
              {[
                { label: 'ROOT CAUSE',     ref: m1Ref, color: panelAmber },
                { label: 'CONFIDENCE',     ref: m2Ref, color: panelHealthy },
                { label: 'REVENUE AT RISK',ref: m3Ref, color: panelAmber },
                { label: 'NEXT MOVE',      ref: m4Ref, color: panelInkSoft },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: panelInkFaint, marginBottom: 6 }}>{item.label}</div>
                  <div ref={item.ref} style={{ fontFamily: serif, fontSize: 15, color: item.color, fontWeight: 500, lineHeight: 1.45 }} />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

// ── Dashboard Section ─────────────────────────────────────────────────────────

function DashboardSection({ C }) {
  const healthRef = useRef(null)
  const goalRef   = useRef(null)
  const P     = C.theme === 'dark' ? THEMES.light : THEMES.dark
  const amber = C.theme === 'dark' ? '#8A6F1A' : '#D9B05C'
  const green = C.theme === 'dark' ? '#2F6B47' : '#7BAE89'

  useEffect(() => {
    const id = setInterval(() => {
      if (healthRef.current) healthRef.current.textContent = String(68 + Math.floor(Math.random() * 3))
      if (goalRef.current)   goalRef.current.textContent   = `${42 + Math.floor(Math.random() * 2)}%`
    }, 4500)
    return () => clearInterval(id)
  }, [])

  // Pre-computed rgba from amber (#F5F0E8 → 201,160,64) and red (192,80,80)
  const amberBg     = C.theme === 'dark' ? 'rgba(138,111,26,0.10)' : 'rgba(196,149,106,0.08)'
  const amberBorder = C.theme === 'dark' ? 'rgba(138,111,26,0.30)' : 'rgba(196,149,106,0.25)'
  const redBg       = C.theme === 'dark' ? 'rgba(110,42,30,0.12)' : 'rgba(196,149,106,0.15)'

  const panelBg         = P.bg
  const panelBorderSoft = C.theme === 'dark' ? '#EDE5D4' : 'rgba(250,247,242,0.06)'
  const panelInkFaint   = C.theme === 'dark' ? '#8A8378' : 'rgba(250,247,242,0.40)'
  const panelInkDim     = C.theme === 'dark' ? '#6B655B' : 'rgba(250,247,242,0.30)'
  const panelInkMuted   = C.theme === 'dark' ? '#5A5246' : 'rgba(250,247,242,0.65)'
  const panelInkSoft    = C.theme === 'dark' ? '#3A352D' : 'rgba(250,247,242,0.85)'
  const panelSurface    = C.theme === 'dark' ? 'rgba(242,237,226,0.9)' : 'rgba(15,11,8,0.6)'
  const panelCardBg     = C.theme === 'dark' ? 'rgba(26,20,16,0.04)' : 'rgba(250,247,242,0.02)'
  const panelCardBorder = C.theme === 'dark' ? '#E4DDD0' : 'rgba(250,247,242,0.06)'
  const panelDotBg      = C.theme === 'dark' ? 'rgba(26,20,16,0.10)' : 'rgba(250,247,242,0.18)'
  const panelPillBg     = C.theme === 'dark' ? 'rgba(26,20,16,0.05)' : 'rgba(250,247,242,0.04)'
  const panelPillBorder = C.theme === 'dark' ? '#D8CFBC' : 'rgba(250,247,242,0.08)'
  const panelPillText   = C.theme === 'dark' ? '#5A5246' : 'rgba(250,247,242,0.75)'
  const panelSidebarBg  = C.theme === 'dark' ? 'rgba(242,237,226,0.6)' : 'rgba(15,11,8,0.7)'
  const panelSidebarDivider = C.theme === 'dark' ? 'rgba(26,20,16,0.08)' : 'rgba(250,247,242,0.04)'
  const panelActiveItem = C.theme === 'dark' ? '#1A1814' : '#fff'
  const panelActiveItemBg = amberBg

  const Sidebar = () => (
    <div className="sa-dash-sidebar" style={{ background: panelSidebarBg, borderRight: `1px solid ${panelSidebarDivider}`, padding: '22px 0', minHeight: 540 }}>
      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: panelInkDim, padding: '0 22px', marginBottom: 8 }}>Workspace</div>

      {/* Active item */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 22px', borderLeft: `2px solid ${amber}`, background: panelActiveItemBg }}>
        <span style={{ fontFamily: mono, fontSize: 13, color: panelActiveItem }}>● Command centre</span>
      </div>
      {['■ Audits', '◐ Signals', '⊕ Connectors'].map(item => (
        <div key={item} style={{ padding: '9px 22px 9px 24px', fontFamily: mono, fontSize: 13, color: panelInkMuted }}>{item}</div>
      ))}

      <div style={{ margin: '18px 22px', height: 1, background: panelSidebarDivider }} />

      <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: panelInkDim, padding: '0 22px', marginBottom: 8 }}>Intelligence</div>
      {['⎈ Brief', '✦ Ask SelfAudit', '◷ Governance'].map(item => (
        <div key={item} style={{ padding: '9px 22px 9px 24px', fontFamily: mono, fontSize: 13, color: panelInkMuted }}>{item}</div>
      ))}
    </div>
  )

  return (
    <section style={{ background: C.bg, padding: 'clamp(64px, 8vw, 160px) 0', borderTop: `1px solid ${C.border}` }}>

      {/* Intro */}
      <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 64px', padding: '0 28px' }}>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginRight: 14 }} />}
          The brain, on day 47
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginLeft: 14 }} />}
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5.5vw, 80px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.04, color: C.ink, margin: '0 0 20px' }}>
          It remembers <em style={{ fontStyle: 'italic', color: C.redMuted }}>everything.</em>
        </h2>
        <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
          Your business state, tracked. Your goals, watched. Your patterns, learned. This is what the brain looks like once it knows you.
        </p>
      </div>

      {/* Dashboard frame */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ background: panelBg, borderRadius: 16, overflow: 'hidden', boxShadow: C.theme === 'light' ? '0 1px 0 #D8CFBC, 0 8px 0 rgba(26,20,16,0.04), 0 32px 80px rgba(26,20,16,0.22), 0 12px 32px rgba(26,20,16,0.14)' : '0 2px 0 #1F1B16, 0 20px 50px rgba(0,0,0,0.45)' }}>

          {/* Top bar */}
          <div style={{ background: panelSurface, borderBottom: `1px solid ${panelBorderSoft}`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: panelDotBg }} />)}
              </div>
              <span style={{ fontFamily: mono, fontSize: 12, color: panelInkMuted }}>selfaudit · command centre</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: green, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: green }}>LIVE</span>
            </div>
          </div>

          {/* Body grid */}
          <div className="sa-dash-body">
            <Sidebar />

            {/* Main panel */}
            <div style={{ padding: '28px 32px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: P.ink }}>Your business · this week</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: panelInkFaint }}>Last synced 2m ago</div>
              </div>

              {/* Alert banner */}
              <div style={{ background: amberBg, borderLeft: `3px solid ${amber}`, borderRadius: '0 8px 8px 0', padding: '14px 16px', marginBottom: 22, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: amber, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontFamily: serif, fontSize: 13, color: panelInkSoft, lineHeight: 1.5 }}>
                  Market Validation is still flagged from your May 4 audit. Worth updating before it compounds.
                </span>
              </div>

              {/* Stats grid */}
              <div className="sa-dash-stats">
                {[
                  { label: 'HEALTH SCORE',  dynRef: healthRef, val: '68',  sub: '▲ 12 vs last week',  subColor: amber },
                  { label: 'OPEN ISSUES',   dynRef: null,      val: '3',   sub: '2 critical · 1 high', subColor: panelInkMuted },
                  { label: 'AUDITS RUN',    dynRef: null,      val: '4',   sub: 'Latest: today',        subColor: panelInkMuted },
                  { label: 'GOAL PROGRESS', dynRef: goalRef,   val: '42%', sub: 'On pace · Q3',         subColor: green },
                ].map(stat => (
                  <div key={stat.label} style={{ background: panelCardBg, border: `1px solid ${panelCardBorder}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: panelInkFaint, marginBottom: 8 }}>{stat.label}</div>
                    <div ref={stat.dynRef} style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, color: P.ink, lineHeight: 1 }}>{stat.val}</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: stat.subColor, marginTop: 6 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Recommended next move */}
              <div style={{ background: amberBg, border: `1px solid ${amberBorder}`, borderRadius: 12, padding: '20px 22px', marginBottom: 18 }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: amber, marginBottom: 10 }}>Recommended next move</div>
                <p style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: P.ink, lineHeight: 1.55, margin: '0 0 16px' }}>
                  Cancel the agency contract this week. Run a{' '}
                  <em style={{ fontStyle: 'italic', color: amber }}>30-day Clay test</em>
                  {' '}with one rep before scaling outbound.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={{ background: amber, color: '#1A1410', border: 'none', borderRadius: 999, padding: '7px 14px', fontFamily: mono, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    Generate action plan
                  </button>
                  {['Draft cancellation email', 'Create SOP', '+3 more'].map(pill => (
                    <button key={pill} style={{ background: panelPillBg, border: `1px solid ${panelPillBorder}`, borderRadius: 999, padding: '7px 14px', fontFamily: mono, fontSize: 12, color: panelPillText, cursor: 'pointer' }}>
                      {pill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open issues */}
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: panelInkFaint, marginBottom: 8 }}>Open issues</div>
              {[
                { title: 'Market validation',             meta: 'Critical · flagged May 4',    badge: 'CRITICAL', badgeBg: redBg,       badgeColor: C.theme === 'dark' ? '#6E2A1E' : P.redMuted },
                { title: 'Pricing model needs restructure', meta: 'High · 3 audits in a row',   badge: 'HIGH',     badgeBg: amberBg,     badgeColor: amber },
                { title: 'Sales cycle drift',             meta: 'High · trending worse',       badge: 'HIGH',     badgeBg: amberBg,     badgeColor: amber },
              ].map(issue => (
                <div key={issue.title} style={{ background: panelCardBg, border: `1px solid ${panelCardBorder}`, borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 14, color: P.ink, marginBottom: 3 }}>{issue.title}</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: panelInkFaint }}>{issue.meta}</div>
                  </div>
                  <span style={{ background: issue.badgeBg, color: issue.badgeColor, fontFamily: mono, fontSize: 10, letterSpacing: '0.08em', borderRadius: 4, padding: '3px 8px', flexShrink: 0 }}>
                    {issue.badge}
                  </span>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Compounding Section ───────────────────────────────────────────────────────

function CompoundingSection({ C }) {
  const P     = C.theme === 'dark' ? THEMES.light : THEMES.dark
  const amber = C.theme === 'dark' ? '#8A6F1A' : '#D9B05C'
  const axisFill = C.theme === 'dark' ? '#8A8378' : 'rgba(255,255,255,0.35)'

  // Chart points [x, y] in a 560×210 viewbox (y=210 = baseline)
  const pts = [
    { x: 20,  y: 188, label: 'DAY 1'  },
    { x: 187, y: 148, label: 'DAY 30' },
    { x: 373, y: 92,  label: 'DAY 60' },
    { x: 540, y: 34,  label: 'DAY 90' },
  ]

  // Smooth cubic bezier through the four points
  const curve = `M ${pts[0].x},${pts[0].y} C 85,184 135,162 ${pts[1].x},${pts[1].y} C 255,132 308,108 ${pts[2].x},${pts[2].y} C 448,80 492,50 ${pts[3].x},${pts[3].y}`
  const fill  = `${curve} L ${pts[3].x},210 L ${pts[0].x},210 Z`

  return (
    <section style={{ background: C.bg, padding: 'clamp(64px, 8vw, 140px) 0', borderTop: `1px solid ${C.border}` }}>
      <div className="sa-comp-grid">

        {/* ── Left: copy ── */}
        <div>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 28 }}>
            The compounding advantage
          </div>

          <h2 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5.5vw, 78px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 28px' }}>
            Day 1, it sees your business.<br />
            <em style={{ fontStyle: 'italic', color: C.redMuted }}>Day 90, it sees you.</em>
          </h2>

          <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.65, margin: '0 0 28px', maxWidth: 480 }}>
            Most tools reset every session. The brain builds state. Every audit, every metric, every decision sharpens what it knows.
          </p>

          <blockquote style={{ borderLeft: `3px solid ${C.redMuted}`, paddingLeft: 20, margin: 0 }}>
            <p style={{ fontFamily: serif, fontSize: 18, fontStyle: 'italic', color: C.inkMuted, lineHeight: 1.6, margin: 0 }}>
              &ldquo;The longer you run it, the less you can run without it.&rdquo;
            </p>
          </blockquote>
        </div>

        {/* ── Right: dark knowledge card ── */}
        <div style={{ background: P.bg, borderRadius: 14, overflow: 'hidden', border: `1px solid ${P.border}`, boxShadow: C.theme === 'light' ? '0 1px 0 #D8CFBC, 0 8px 0 rgba(26,20,16,0.04), 0 32px 80px rgba(26,20,16,0.22), 0 12px 32px rgba(26,20,16,0.14)' : '0 2px 0 #1F1B16, 0 20px 50px rgba(0,0,0,0.45)' }}>

          {/* Card header */}
          <div style={{ padding: '28px 32px 12px' }}>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.theme === 'dark' ? P.inkFaint : 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Brain knowledge · over time
            </div>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: P.ink, lineHeight: 1.25 }}>
              It stops asking and starts telling.
            </div>
          </div>

          {/* SVG chart */}
          <div style={{ padding: '8px 32px 4px' }}>
            <svg viewBox="0 0 560 228" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={amber} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={amber} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Filled area */}
              <path d={fill} fill="url(#compGrad)" />

              {/* Curve line */}
              <path d={curve} fill="none" stroke={amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Milestone dots */}
              {pts.map(pt => (
                <g key={pt.label}>
                  <circle cx={pt.x} cy={pt.y} r="9"  fill={amber} fillOpacity="0.18" />
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill={amber} />
                </g>
              ))}

              {/* X-axis labels */}
              {pts.map(pt => (
                <text
                  key={`lbl-${pt.label}`}
                  x={pt.x} y="226"
                  textAnchor="middle"
                  fontFamily={mono}
                  fontSize="10"
                  fill={axisFill}
                  letterSpacing="0.06em"
                >
                  {pt.label}
                </text>
              ))}
            </svg>
          </div>

          {/* Milestone rows */}
          <div style={{ padding: '0 32px 28px' }}>
            {[
              { day: 'DAY 30', body: <>Catches a margin leak your CFO had written off as <em style={{ fontStyle: 'italic', color: amber }}>seasonality.</em></> },
              { day: 'DAY 60', body: <>Questions a senior hire <em style={{ fontStyle: 'italic', color: amber }}>before</em> you sign the offer. It was right to.</> },
              { day: 'DAY 90', body: <>Tells you what to do — <em style={{ fontStyle: 'italic', color: amber }}>before</em> you&apos;ve finished asking the question.</> },
            ].map(m => (
              <div key={m.day} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16, alignItems: 'start', padding: '16px 0', borderTop: C.theme === 'dark' ? `1px solid ${P.border}` : '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: amber, letterSpacing: '0.06em', paddingTop: 2 }}>{m.day}</span>
                <span style={{ fontFamily: serif, fontSize: 16, color: C.theme === 'dark' ? P.inkSoft : 'rgba(232,226,216,0.82)', lineHeight: 1.58 }}>{m.body}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA({ onStart, C }) {
  const [inputVal, setInputVal]     = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const userFocusedRef = useRef(false)
  const cancelledRef   = useRef(false)
  const idxRef         = useRef(0)

  // Same rotating typewriter as hero, independent instance
  useEffect(() => {
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const run = async () => {
      while (!cancelledRef.current) {
        if (userFocusedRef.current) { await sleep(300); continue }
        const stmt = typewriterStatements[idxRef.current % typewriterStatements.length]
        idxRef.current++
        for (let i = 0; i <= stmt.length; i++) {
          if (cancelledRef.current || userFocusedRef.current) break
          setPlaceholder(stmt.slice(0, i))
          await sleep(36)
        }
        await sleep(2000)
        for (let i = stmt.length; i >= 0; i--) {
          if (cancelledRef.current || userFocusedRef.current) break
          setPlaceholder(stmt.slice(0, i))
          await sleep(18)
        }
        await sleep(400)
      }
    }
    run()
    return () => { cancelledRef.current = true }
  }, [])

  const go = () => onStart(inputVal.trim())

  const red       = C.accent
  const redBorder = C.border

  return (
    <section style={{ background: C.bg, padding: 'clamp(64px, 8vw, 130px) 0 clamp(48px, 6vw, 100px)' }}>
      <style>{`
        .fca-input::placeholder { color: rgba(250,247,242,0.32); }
      `}</style>

      {/* Eyebrow */}
      <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: red, marginBottom: 48 }}>
        — THE BUSINESS BRAIN · READY
      </div>

      {/* Begin. */}
      <div style={{ textAlign: 'center', lineHeight: 0.9, marginBottom: 40 }}>
        <span style={{ fontFamily: serif, fontSize: 'clamp(52px, 14vw, 188px)', fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.04em', color: C.ink }}>Begin</span>
        <span style={{ fontFamily: serif, fontSize: 'clamp(52px, 14vw, 188px)', fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.04em', color: red }}>.</span>
      </div>

      {/* Subtitle */}
      <p style={{ textAlign: 'center', fontFamily: serif, fontSize: 'clamp(18px, 2.2vw, 26px)', fontStyle: 'italic', color: C.inkSoft, lineHeight: 1.5, margin: '0 0 64px' }}>
        Tell it what feels wrong. Get the truth in five minutes.
      </p>

      {/* Input bar */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ display: 'flex', border: `1px solid ${redBorder}`, borderRadius: 4, overflow: 'hidden' }}>
          <input
            className="fca-input"
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder={placeholder}
            onFocus={() => { userFocusedRef.current = true; setPlaceholder('') }}
            onBlur={() => { userFocusedRef.current = false }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '22px 28px',
              fontFamily: mono,
              fontSize: 15,
              color: C.ink,
              minWidth: 0,
            }}
          />
          <button
            onClick={go}
            style={{
              background: red,
              color: C.bg,
              border: 'none',
              padding: '0 36px',
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            DIAGNOSE →
          </button>
        </div>

        {/* Tagline */}
        <div style={{ textAlign: 'center', marginTop: 26, fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint }}>
          FREE · NO ACCOUNT · BRUTALLY HONEST
        </div>
      </div>
    </section>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()
  const [theme, setTheme] = useState(() => localStorage.getItem('sa-theme') || 'dark')
  const C = THEMES[theme]
  const [storiesOpen, setStoriesOpen] = useState(false)
  const [connectedOpen, setConnectedOpen] = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typewriterRef = useRef(null)
  const statementIndexRef = useRef(0)
  const userFocusedRef = useRef(false)
  const sbRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

  useEffect(() => {
    const circumference = 163 // 2 * PI * 26
    const arc = document.getElementById('sb-progress')
    const el = sbRef.current
    if (!el || !arc) return
    const onScroll = () => {
      const scrolled = window.scrollY
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const pct = Math.min(1, Math.max(0, scrolled / docH))
      arc.style.strokeDashoffset = circumference - pct * circumference
      if (scrolled > 400 && scrolled < docH - 200) {
        el.classList.add('scroll-brain-show')
      } else {
        el.classList.remove('scroll-brain-show')
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const styleId = 'sa-bg-texture'
    let el = document.getElementById(styleId)
    if (!el) {
      el = document.createElement('style')
      el.id = styleId
      document.head.appendChild(el)
    }

    if (theme === 'light') {
      el.textContent = `
      body {
        background-image:
          radial-gradient(ellipse 80% 60% at 10% 15%, rgba(210,198,178,0.35) 0%, transparent 70%),
          radial-gradient(ellipse 70% 55% at 90% 85%, rgba(215,203,183,0.3) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 75% 20%, rgba(225,215,198,0.2) 0%, transparent 70%),
          radial-gradient(ellipse 45% 35% at 20% 80%, rgba(220,210,193,0.2) 0%, transparent 70%);
        background-attachment: fixed;
        background-color: #F7F4ED;
        background-size: 100% 100%;
      }
    `
    } else {
      el.textContent = `
      body {
        background-image: none;
        background-attachment: scroll;
        background-color: #0E0C0A;
      }
    `
    }

    return () => {
      if (el) el.textContent = ''
    }
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

  const handleAuditStart = (problem) => {
    posthog?.capture('audit_started', { source: 'landing', problem: problem || '' })
    onStart(problem ?? '')
  }

  const handleSignUpWithPlan = (plan) => {
    posthog?.capture('signup_plan_selected', { plan })
    onSignUp(plan)
  }

  const handleLogoClick = () => {
    if (storiesOpen || connectedOpen || pricingOpen) {
      setStoriesOpen(false)
      setConnectedOpen(false)
      setPricingOpen(false)
      return
    }
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
      handleAuditStart('')
    }
  }

  const closePagesAndThen = (callback) => {
    if (storiesOpen || connectedOpen || pricingOpen) {
      setStoriesOpen(false)
      setConnectedOpen(false)
      setPricingOpen(false)
      window.setTimeout(callback, 30)
      return
    }
    callback()
  }

  const handlePricingNav = () => {
    setStoriesOpen(false)
    setConnectedOpen(false)
    setPricingOpen(true)
  }

  const pageOpen = storiesOpen || connectedOpen || pricingOpen

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.ink, lineHeight: 1.6, minHeight: '100vh' }}>

      <style>{`
        /* ── Scroll indicator ── */
        .scroll-brain { opacity: 0; transition: opacity 0.4s ease; }
        .scroll-brain-show { opacity: 1; }

        /* ── Responsive layout ── */

        /* Nav */
        .sa-nav-grid { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:20px; max-width:1140px; margin:0 auto; padding:0 28px; }
        @media(max-width:768px){
          .sa-nav-grid { grid-template-columns:1fr auto; }
          .sa-nav-center { display:none !important; }
        }

        /* Engine Room */
        .sa-er-grid { max-width:1280px; margin:0 auto; padding:0 48px; display:grid; grid-template-columns:1fr 1.2fr; gap:80px; align-items:start; }
        @media(max-width:960px){
          .sa-er-grid { grid-template-columns:1fr; padding:0 24px; gap:48px; }
          .sa-er-sticky { position:static !important; top:auto !important; }
          .sa-er-stream { height:380px !important; }
        }
        @media(max-width:480px){
          .sa-er-grid { padding:0 16px; }
          .sa-er-stream { height:300px !important; }
        }

        /* Four Verbs sticky stack */
        .sa-fv-card-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(32px,5vw,64px); align-items:start; max-width:1200px; margin:0 auto; }
        @media(max-width:768px){
          .sa-fv-section > div { height:auto !important; }
          .sa-fv-sticky-head { position:relative !important; top:auto !important; min-height:auto !important; }
          .sa-fv-card { position:relative !important; top:auto !important; margin-bottom:0 !important; box-shadow:none !important; }
          .sa-fv-card-grid { grid-template-columns:1fr !important; gap:32px !important; }
        }

        /* Live Diagnosis meta */
        .sa-ld-meta { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        @media(max-width:600px){ .sa-ld-meta { grid-template-columns:repeat(2,1fr); } }

        /* Moat comparison */
        .sa-moat-grid { display:grid; grid-template-columns:1fr 1.15fr; gap:40px; align-items:start; }
        @media(max-width:768px){ .sa-moat-grid { grid-template-columns:1fr; } }

        /* Dashboard */
        .sa-dash-body { display:grid; grid-template-columns:220px 1fr; }
        .sa-dash-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:22px; }
        @media(max-width:960px){
          .sa-dash-body { grid-template-columns:1fr; }
          .sa-dash-sidebar { display:none !important; }
          .sa-dash-stats { grid-template-columns:repeat(2,1fr); }
        }

        /* Compounding */
        .sa-comp-grid { max-width:1180px; margin:0 auto; padding:0 28px; display:grid; grid-template-columns:1fr 1.15fr; gap:80px; align-items:center; }
        @media(max-width:960px){ .sa-comp-grid { grid-template-columns:1fr; gap:48px; } }

        /* Always On feed rows */
        .sa-always-row { display:grid; grid-template-columns:164px 1fr; gap:48px; align-items:start; padding:42px 0; }
        @media(max-width:640px){ .sa-always-row { grid-template-columns:1fr; gap:8px; padding:28px 0; } }

        /* Founders cards */
        .sa-founders-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
        @media(max-width:768px){ .sa-founders-grid { grid-template-columns:1fr; } }

        /* Pricing rows */
        .sa-pricing-row { display:grid; grid-template-columns:150px 1fr 1fr 200px; gap:0 44px; align-items:center; padding:56px 0; }
        @media(max-width:960px){ .sa-pricing-row { grid-template-columns:1fr; gap:20px; padding:36px 0; } }

        /* Hero input: stack on tiny screens */
        @media(max-width:480px){
          .sa-hero-bar { flex-direction:column !important; border-radius:16px !important; padding:12px !important; }
          .sa-hero-btn { border-radius:10px !important; width:100%; text-align:center; padding:14px !important; }
        }
      `}</style>

      {/* Scroll progress indicator */}
      <div
        ref={sbRef}
        className="scroll-brain"
        style={{ position: 'fixed', right: 36, bottom: 36, width: 60, height: 60, zIndex: 90, pointerEvents: 'none' }}
      >
        <svg viewBox="0 0 60 60" width="60" height="60" style={{ overflow: 'visible' }}>
          {/* Background ring */}
          <circle cx="30" cy="30" r="26" fill="none" stroke={C.ink} strokeWidth="1" opacity="0.15" />
          {/* Progress arc */}
          <circle
            id="sb-progress"
            cx="30" cy="30" r="26"
            fill="none"
            stroke={C.accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="163"
            strokeDashoffset="163"
            transform="rotate(-90 30 30)"
          />
          {/* Center dot */}
          <circle cx="30" cy="30" r="3" fill={C.accent} />
          {/* Label */}
          <text
            x="30" y="52"
            textAnchor="middle"
            style={{ fontFamily: mono, fontSize: 7, fill: C.ink, letterSpacing: '0.1em' }}
          >SCROLL</text>
        </svg>
      </div>
      <LandingNav
        C={C}
        pageOpen={pageOpen}
        storiesOpen={storiesOpen}
        connectedOpen={connectedOpen}
        theme={theme}
        setTheme={setTheme}
        pricingOpen={pricingOpen}
        onBack={() => {
          setStoriesOpen(false)
          setConnectedOpen(false)
          setPricingOpen(false)
        }}
        onPricing={handlePricingNav}
        onStories={() => {
          setConnectedOpen(false)
          setPricingOpen(false)
          setStoriesOpen(true)
        }}
        onConnected={() => {
          setStoriesOpen(false)
          setPricingOpen(false)
          setConnectedOpen(true)
        }}
        onSignIn={() => { window.location.hash = 'login' }}
        onStartAudit={() => handleAuditStart('')}
        onLogoClick={handleLogoClick}
      />

      {storiesOpen ? (
        <>
          <StoriesPage C={C} onStartAudit={handleAuditStart} />
          <LandingFooter C={C} theme={theme} setTheme={setTheme} />
        </>
      ) : connectedOpen ? (
        <>
          <ConnectedPage C={C} theme={theme} onStartAudit={handleAuditStart} />
          <LandingFooter C={C} theme={theme} setTheme={setTheme} />
        </>
      ) : pricingOpen ? (
        <>
          <PricingPage C={C} onSignUp={handleSignUpWithPlan} onStartAudit={handleAuditStart} />
          <LandingFooter C={C} theme={theme} setTheme={setTheme} />
        </>
      ) : (
        <>

      {/* ── 1. Hero ── */}
      <section style={{ padding: 'clamp(56px, 7vw, 112px) 0 clamp(48px, 6vw, 100px)', textAlign: 'center', background: 'none' }}>
        <div style={wrap}>
          <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, marginBottom: 24 }}>
            Now live — The ultimate business intelligence layer
          </div>

          <h1 style={{
            fontFamily: serif,
            fontSize: 'clamp(30px, 5.5vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            margin: '0 auto 16px',
            color: C.ink,
          }}>
            Introducing the next generation business brain
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
            The missing layer that elevates your business to top-tier.
          </p>

          <p style={{
            fontSize: 17,
            color: C.inkMuted,
            maxWidth: 580,
            margin: '0 auto 48px',
            lineHeight: 1.6,
            textAlign: 'center',
            fontWeight: 400,
          }}>
            Tell it what feels wrong. It reads your live data, finds the cause, and tells you the next move — before you have to ask.
          </p>

          {/* Interactive Input Bar */}
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div className="sa-hero-bar" style={{
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
                  fontSize: 16,
                  color: C.ink,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              <button
                onClick={handleDiagnose}
                className="sa-hero-btn"
                style={{
                  background: C.theme === 'light' ? C.ink : C.accent,
                  color: C.theme === 'light' ? C.bg : '#fff',
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 22px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.18s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.theme === 'light' ? C.inkSoft : C.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = C.theme === 'light' ? C.ink : C.accent}
              >
                Let&apos;s go →
              </button>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, color: C.inkMuted }}>
              Free root-cause diagnosis. No account needed. Takes 5 minutes. Brutally honest.
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Business Brain Statement ── */}
      <section style={{ padding: 'clamp(56px, 7vw, 112px) 0 clamp(56px, 7vw, 120px)', background: C.surface }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 28px', textAlign: 'center' }}>
          <p style={{
            fontFamily: serif,
            fontSize: 'clamp(22px, 3.8vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            margin: 0,
            color: C.ink,
          }}>
            <span>Your business has a CRM. </span>
            <span style={{ color: C.inkFaint }}>A payment processor. A docs tool. An analytics dashboard. A comms platform. </span>
            <span>What it does </span>
            <em style={{ color: C.redMuted, fontStyle: 'italic' }}>not</em>
            <span> have — yet — is </span>
            <em style={{ color: C.redMuted, fontStyle: 'italic' }}>a business brain.</em>
          </p>
        </div>
      </section>

      {/* ── 3. Engine Room ── */}
      <EngineRoom C={C} />

      {/* ── 4. Four Verbs ── */}
      <FourVerbs C={C} />

      {/* ── 5. Live Diagnosis ── */}
      <LiveDiagnosis C={C} />

      {/* ── 6. The Moat, Named ── */}
      <section style={{ padding: 'clamp(56px, 7vw, 112px) 0', background: C.surface }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>

          {/* Intro */}
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto clamp(40px, 5vw, 88px)' }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 20 }}>
              The moat, named
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 5vw, 72px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 24px' }}>
              Most tools answer.<br />
              <em style={{ fontStyle: 'italic', color: C.redMuted }}>SelfAudit investigates.</em>
            </h2>
            <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Every founder has tried asking an AI about their business. They know exactly what&apos;s missing. We named it.
            </p>
          </div>

          {/* Comparison table */}
          <div className="sa-moat-grid">

            {/* Left — other tools */}
            <div>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                Other AI tools
              </div>
              {[
                'Waits for your prompt',
                'Forgets you between sessions',
                'Gives you ten options to consider',
                'Says "consider these factors"',
                'Answers based on what you said',
                'Hedges to stay polite',
              ].map(item => (
                <div key={item} style={{ fontFamily: serif, fontSize: 19, fontStyle: 'italic', color: C.inkFaint, padding: '22px 0', borderBottom: `1px solid ${C.border}` }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Right — SelfAudit card */}
            <div style={{ background: C.theme === 'dark' ? C.card : '#ffffff', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkFaint, padding: '20px 32px 16px', borderBottom: `1px solid ${C.border}` }}>
                SelfAudit
              </div>
              {[
                { plain: 'Reads your ',          italic: 'actual business' },
                { plain: 'Compounds ',           italic: 'every audit' },
                { plain: 'Picks ',               italic: 'one move' },
                { plain: 'Says ',                italic: '"your churn lies — here\'s why"' },
                { plain: 'Answers based on ',    italic: 'what\'s happening' },
                { plain: 'Says the thing ',      italic: 'no one will tell you' },
              ].map((row, i, arr) => (
                <div key={row.italic} style={{ fontFamily: serif, fontSize: 19, color: C.ink, padding: '22px 32px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  {row.plain}<em style={{ fontStyle: 'italic', color: C.redMuted }}>{row.italic}</em>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>


      {/* ── 7. Dashboard ── */}
      <DashboardSection C={C} />

      {/* ── 8. Compounding ── */}
      <CompoundingSection C={C} />

      {/* ── 9. Always On ── */}
      <section style={{ background: C.bg, padding: 'clamp(56px, 7vw, 120px) 0', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>

          {/* Header */}
          <div style={{ maxWidth: 760, marginBottom: 'clamp(32px, 4vw, 64px)' }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 24 }}>
              Always on
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(30px, 6vw, 80px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 20px' }}>
              It works while{' '}
              <em style={{ fontStyle: 'italic', color: C.redMuted }}>you&apos;re not looking.</em>
            </h2>
            <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Set the goal. Connect the tools. The brain takes the rest.
            </p>
          </div>

          {/* Feed rows */}
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {[
              {
                label: 'SUN · 11:42 PM',
                body: <>Your CAC drifted <em style={{ fontStyle: 'italic', color: C.redMuted }}>22% this week.</em> The cause sits in last Thursday&apos;s launch. Fix is in your inbox by Monday 7 AM.</>,
              },
              {
                label: 'MAR · GOAL #3',
                body: <>Quietly checked every Friday. <em style={{ fontStyle: 'italic', color: C.redMuted }}>You&apos;re three weeks behind</em> — but salvageable. Here&apos;s what to drop.</>,
              },
              {
                label: 'METRIC · CHURN',
                body: <>It opens an investigation <em style={{ fontStyle: 'italic', color: C.redMuted }}>without being asked.</em> By the time you log in, the diagnosis is already on your dashboard.</>,
              },
              {
                label: 'CONNECTOR · STRIPE',
                body: <>Revenue cohort shape changed last week. <em style={{ fontStyle: 'italic', color: C.redMuted }}>Three reasons surfaced</em>, ranked by likelihood. Awaiting your review.</>,
              },
            ].map(row => (
              <div key={row.label} className="sa-always-row" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, paddingTop: 5 }}>
                  {row.label}
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, color: C.ink, lineHeight: 1.55 }}>
                  {row.body}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 10. What founders found out ── */}
      <section style={{ background: C.bg, padding: 'clamp(56px, 7vw, 120px) 0', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 28px' }}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 4vw, 72px)' }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginRight: 14 }} />}
              Real diagnoses
              {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginLeft: 14 }} />}
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 5.5vw, 76px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 20px' }}>
              What founders <em style={{ fontStyle: 'italic', color: C.redMuted }}>found out.</em>
            </h2>
            <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
              These are not testimonials. They&apos;re moments where someone<br />finally got an honest answer.
            </p>
          </div>

          {/* 2×2 card grid */}
          <div className="sa-founders-grid">
            {[
              {
                severity: 'CRITICAL', domain: 'PIPELINE', severityColor: C.redMuted,
                meta: 'May · Series A SaaS',
                quote: '“You’re burning $8,600 a month to maintain the illusion of pipeline activity.”',
                result: <><strong>Cancelled the agency.</strong> Reallocated to Clay. Conversion rate moved from 1.4% to 11.2% in 30 days.</>,
              },
              {
                severity: 'CRITICAL', domain: 'STRATEGY', severityColor: C.redMuted,
                meta: 'April · Pre-seed',
                quote: '“You built a SaaS no one asked for. Funding won’t fix that. Revenue might.”',
                result: <><strong>20 discovery calls. Six paid pilots.</strong> Investor conversations restarted from a position of evidence.</>,
              },
              {
                severity: 'HIGH', domain: 'TEAM', severityColor: C.amber,
                meta: 'March · 35-person team',
                quote: '“Your team isn’t underperforming. They’re solving last quarter’s strategy.”',
                result: <><strong>One re-anchor meeting.</strong> OKRs rewritten in 48 hours. Velocity recovered within one sprint.</>,
              },
              {
                severity: 'HIGH', domain: 'PRICING', severityColor: C.amber,
                meta: 'February · B2B SaaS',
                quote: '“You don’t have a sales problem. You have a positioning problem dressed up as one.”',
                result: <><strong>Pricing page rewritten.</strong> Inbound conversion up 41% in 19 days. VP of Sales hire cancelled.</>,
              },
            ].map(card => (
              <div key={card.domain} style={{
                background: C.theme === 'light' ? 'transparent' : C.card,
                border: C.theme === 'light' ? 'none' : `1px solid ${C.border}`,
                borderTop: `1px solid ${C.border}`,
                borderRadius: C.theme === 'light' ? 0 : 12,
                padding: '28px 28px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
                {/* Arrow icon */}
                <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.22 }}>
                  <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                    <path d="M3 15 L15 3 M6 3 H15 V12" stroke={C.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                    <span style={{ color: card.severityColor }}>{card.severity}</span>
                    <span style={{ color: C.inkFaint }}> · {card.domain}</span>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: C.inkFaint }}>{card.meta}</div>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 22 }} />

                {/* Quote */}
                <p style={{ fontFamily: serif, fontSize: 22, fontStyle: 'italic', fontWeight: 600, color: C.ink, lineHeight: 1.45, margin: '0 0 22px' }}>
                  {card.quote}
                </p>

                <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 18 }} />

                {/* Result */}
                <p style={{ fontFamily: serif, fontSize: 16, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>
                  {card.result}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 11. Pricing ── */}
      <section style={{ background: C.bg, padding: 'clamp(56px, 7vw, 120px) 0', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 28px' }}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginRight: 14 }} />}
              Pricing
              {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginLeft: 14 }} />}
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 'clamp(28px, 6vw, 80px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: C.ink, margin: '0 0 20px' }}>
              Less than one bad hour<br />
              <em style={{ fontStyle: 'italic', color: C.redMuted }}>with a consultant.</em>
            </h2>
            <p style={{ fontFamily: serif, fontSize: 20, fontStyle: 'italic', color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
              Two ways to run the brain. Start free. Upgrade when you&apos;re convinced.
            </p>
          </div>

          {/* Plan rows */}
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {[
              {
                price: '$29',
                label: 'FOUNDATION',
                heading: <>The <em style={{ fontStyle: 'italic', color: C.redMuted }}>diagnosis</em>, on demand.</>,
                body: 'Unlimited audits. Full reports. Action plans, SOPs, and email drafts generated from any finding.',
                features: ['Unlimited diagnoses', 'Root-cause reports', 'Action plans & SOPs', 'Health score · history'],
                cta: 'Start Foundation →',
                plan: 'foundation',
              },
              {
                price: '$99',
                label: 'INTELLIGENCE',
                heading: <>The <em style={{ fontStyle: 'italic', color: C.redMuted }}>full brain.</em></>,
                body: 'Live connectors. Compounding memory. Weekly governance. Ask SelfAudit anything — it investigates before answering.',
                features: ['Everything in Foundation', 'HubSpot, Stripe, Slack, Gmail', 'Memory · Agent · Governance', 'Goal tracking with reality checks'],
                cta: 'Start Intelligence →',
                plan: 'intelligence',
              },
            ].map(p => (
              <div key={p.label} className="sa-pricing-row" style={{ borderBottom: `1px solid ${C.border}` }}>

                {/* Price */}
                <div style={{ lineHeight: 1 }}>
                  <span style={{ fontFamily: serif, fontSize: 68, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink }}>
                    {p.price}
                  </span>
                  <span style={{ fontFamily: serif, fontSize: 18, color: C.inkMuted, marginLeft: 3 }}>/mo</span>
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>
                    {p.label}
                  </div>
                  <h3 style={{ fontFamily: serif, fontSize: 34, fontWeight: 700, lineHeight: 1.14, letterSpacing: '-0.03em', color: C.ink, margin: '0 0 14px' }}>
                    {p.heading}
                  </h3>
                  <p style={{ fontFamily: serif, fontSize: 16, color: C.inkSoft, lineHeight: 1.65, margin: 0 }}>
                    {p.body}
                  </p>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ fontFamily: mono, fontSize: 12, color: C.inkFaint, lineHeight: 1.5 }}>{f}</div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSignUpWithPlan(p.plan)}
                  style={{
                    background: C.ink,
                    color: C.bg,
                    border: 'none',
                    borderRadius: 999,
                    padding: '15px 24px',
                    fontFamily: serif,
                    fontSize: 17,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    letterSpacing: '-0.01em',
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {p.cta}
                </button>

              </div>
            ))}
          </div>

        </div>
      </section>

      <FinalCTA onStart={handleAuditStart} C={C} />

      <LandingFooter C={C} theme={theme} setTheme={setTheme} />
        </>
      )}
    </div>
  )
}
