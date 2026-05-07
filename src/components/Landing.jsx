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

const compareRows = [
  { dim: 'Waiting weeks for a calendar invite', old: 'Full-day event / 4-8 weeks', neo: '5 minutes (Real-time)' },
  { dim: 'Paying for generic advice', old: 'Generic templates & frameworks', neo: 'Domain-Specific Logic (Facts)' },
  { dim: 'Solving one problem at a time', old: 'Speaker-dependent domain', neo: 'Persistent Intelligence (Scale)' },
  { dim: 'Billed by the session', old: 'Once a year / Billed per session', neo: 'Always monitoring your health' },
  { dim: 'Guesswork & intuition', old: 'Human bias, agenda, and error', neo: 'Pattern Recognition (The Edge)' },
]

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

      <PrimaryButton label="Start Intelligence — $99/mo" onClick={() => onSignUp('business')} C={C} />
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
        color: muted ? C.inkMuted : C.inkSoft,
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

function LandingNav({ C, pageOpen, onBack, onPricing, onStories, onConnected, onSignIn, onStartAudit, onLogoClick, storiesOpen, connectedOpen, theme, setTheme }) {
  return (
    <nav style={{ padding: '20px 0', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 20 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <TextNavLink label="Pricing" onClick={onPricing} C={C} />
          <TextNavLink label="Stories" onClick={onStories} C={C} active={storiesOpen} />
          <TextNavLink label="Connected" onClick={onConnected} C={C} active={connectedOpen} />
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

function LandingFooter({ C, theme, setTheme }) {
  return (
    <footer style={{ background: C.surface, color: C.inkMuted, padding: '42px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15 }}>
          Built by{' '}
          <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accentText, textDecoration: 'none', fontWeight: 500 }}>
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
      color: '#FF7A59',
      tools: ['HubSpot', 'Salesforce', 'Pipedrive', 'Close'],
    },
    {
      heading: 'REVENUE & BILLING',
      color: '#635BFF',
      tools: ['Stripe', 'Paddle', 'Chargebee', 'Recurly'],
    },
    {
      heading: 'SUPPORT & CX',
      color: '#03363D',
      tools: ['Zendesk', 'Intercom', 'Help Scout', 'Freshdesk'],
    },
    {
      heading: 'COMMS & EMAIL',
      color: '#4A154B',
      tools: ['Slack', 'Gmail', 'Microsoft Teams', 'Mailchimp'],
    },
    {
      heading: 'PROJECT & DELIVERY',
      color: '#F96854',
      tools: ['Asana', 'Linear', 'ClickUp', 'Jira'],
    },
    {
      heading: 'KNOWLEDGE & DOCS',
      color: '#000000',
      tools: ['Notion', 'Google Drive', 'Confluence', 'OneDrive'],
    },
  ]

  return (
    <>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 18 }}>
            {connectorColumns.map((column) => (
              <div key={column.heading} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 11, color: C.accentText, letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: `0.5px solid ${C.border}`, paddingBottom: 8, marginBottom: 14, fontWeight: 700 }}>
                  {column.heading}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {column.tools.map((tool) => (
                    <div key={tool} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: column.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: C.inkSoft, display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {tool}
                        {tool === 'HubSpot' && (
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
    <section style={{ padding: '140px 0', background: C.bg }}>
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()
  const [theme, setTheme] = useState(() => localStorage.getItem('sa-theme') || 'dark')
  const C = THEMES[theme]
  const [storiesOpen, setStoriesOpen] = useState(false)
  const [connectedOpen, setConnectedOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typewriterRef = useRef(null)
  const statementIndexRef = useRef(0)
  const userFocusedRef = useRef(false)

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

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
        background-color: #F5F0E8;
        background-size: 100% 100%;
      }
    `
    } else {
      el.textContent = `
      body {
        background-image: none;
        background-attachment: scroll;
        background-color: #0F1520;
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
    if (storiesOpen || connectedOpen) {
      setStoriesOpen(false)
      setConnectedOpen(false)
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
    if (storiesOpen || connectedOpen) {
      setStoriesOpen(false)
      setConnectedOpen(false)
      window.setTimeout(callback, 30)
      return
    }
    callback()
  }

  const handlePricingNav = () => closePagesAndThen(() => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  })

  const pageOpen = storiesOpen || connectedOpen

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.ink, lineHeight: 1.6, minHeight: '100vh' }}>
      <LandingNav
        C={C}
        pageOpen={pageOpen}
        storiesOpen={storiesOpen}
        connectedOpen={connectedOpen}
        theme={theme}
        setTheme={setTheme}
        onBack={() => {
          setStoriesOpen(false)
          setConnectedOpen(false)
        }}
        onPricing={handlePricingNav}
        onStories={() => {
          setConnectedOpen(false)
          setStoriesOpen(true)
        }}
        onConnected={() => {
          setStoriesOpen(false)
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
      ) : (
        <>

      {/* ── 1. Hero ── */}
      <section style={{ padding: '112px 0 100px', textAlign: 'center', background: 'none' }}>
        <div style={wrap}>
          <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, marginBottom: 24 }}>
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
            fontSize: 17,
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
                  fontSize: 16,
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
                  fontSize: 16,
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
            <div style={{ marginTop: 14, fontSize: 14, color: C.inkMuted }}>
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
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            The old model was built for a world that moved slowly. Yours doesn't.
          </p>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
              <div style={{ padding: '20px 28px', borderRight: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.inkMuted }}>What you're doing now</div>
                <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 4 }}>Slow, expensive, guessing</div>
              </div>
              <div style={{ padding: '20px 28px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.accentText }}>SelfAudit</div>
                <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 4 }}>Instant, data-driven, persistent</div>
              </div>
            </div>

            {compareRows.map((row, i) => (
              <div key={row.dim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < compareRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '18px 28px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 15, color: C.inkSoft, fontWeight: 500 }}>{row.dim}</div>
                  <div style={{ fontSize: 14, color: C.inkFaint }}>{row.old}</div>
                </div>
                <div style={{ padding: '18px 28px', fontSize: 15, color: C.accentText, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
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
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            We're not "honest." We're technically superior. Here's why.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 1040, margin: '0 auto' }}>
            {intelligencePillars.map(pillar => (
              <div key={pillar.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ color: C.accentText, fontSize: 21, marginBottom: 16 }}>→</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', color: C.ink }}>{pillar.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 16, margin: 0 }}>{pillar.body}</p>
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
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 640, margin: '0 auto 48px' }}>
            Our Intelligence Layer maps 40+ industries and 200+ failure points. Watch it work.
          </p>
          <DiagnosticLoop C={C} />
        </div>
      </section>

      {/* ── 5. Accountability Loop ── */}
      <section style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel(C)}>The unfair advantage</div>
          <h2 style={h2Style(C)}>Advice you can't ignore.</h2>
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 680, margin: '0 auto 60px' }}>
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
                <h3 style={{ fontSize: 21, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', color: C.ink }}>{item.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 16, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialProofTicker C={C} />

      {/* ── 6. AI Graveyard ── */}
      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel(C)}>The AI question, answered honestly</div>
          <h2 style={h2Style(C)}>The "AI Strategy" Graveyard.</h2>
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 680, margin: '0 auto 60px' }}>
            Most AI projects are expensive science experiments that die in a slide deck. SelfAudit doesn't just "deploy AI" — it validates whether AI is even the solution.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
            {aiCards.map(card => (
              <div key={card.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentSoft, color: C.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 19, fontWeight: 700, marginBottom: 18, flexShrink: 0 }}>
                  {card.num}
                </div>
                <h3 style={{ fontFamily: serif, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2, color: C.ink }}>{card.title}</h3>
                <p style={{ fontSize: 16, color: C.inkSoft, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 52, fontFamily: serif, fontStyle: 'italic', fontSize: 23, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            You'll leave knowing exactly which problems deserve AI, and which ones deserve a manager, a process, or a hard conversation.
          </p>
        </div>
      </section>

      {/* ── 7. Pricing ── */}
      <section id="pricing" style={{ padding: '100px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel(C)}>Pricing</div>
          <h2 style={h2Style(C)}>Two ways to run SelfAudit.</h2>
          <p style={{ textAlign: 'center', fontSize: 19, color: C.inkSoft, maxWidth: 700, margin: '0 auto 60px' }}>
            Choose the plan that fits how deep you want SelfAudit embedded in the business.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1080, margin: '0 auto' }}>
            {/* Foundation */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: serif, fontSize: 29, fontWeight: 700, color: C.ink, letterSpacing: '-0.03em', marginBottom: 10 }}>Foundation</div>
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
                $29<span style={{ fontSize: 21, color: C.inkMuted, marginLeft: 4 }}>/mo</span>
              </div>
              <div style={{ fontSize: 15, color: C.inkMuted, marginTop: 8, marginBottom: 24 }}>The truth about your business.</div>

              <div style={{ marginBottom: 24 }}>
                <FeatureList items={freeFeatures} color={C.inkSoft} iconColor={C.accentText} />
              </div>

              <div style={{ marginTop: 'auto' }}>
                <OutlineButton label="Start Foundation — $29/mo" onClick={() => handleSignUpWithPlan('essential')} C={C} />
                <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 12 }}>Includes account setup and immediate access.</div>
              </div>
            </div>

            {/* Intelligence */}
            <GrowthOSCard onSignUp={handleSignUpWithPlan} C={C} />
          </div>

          <p style={{ textAlign: 'center', marginTop: 34, fontFamily: serif, fontStyle: 'italic', fontSize: 21, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Your competitors aren't smarter. They just have better data on their own business.
          </p>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section style={{ background: C.bg, textAlign: 'center', padding: '110px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style(C)}>Stop guessing. Get a diagnosis.</h2>
          <div style={{ marginTop: 28 }}>
            <PrimaryButton label="Start your free audit" onClick={() => handleAuditStart('')} C={C} />
          </div>
          <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 14 }}>
            5 minutes. No account needed. Brutally honest.
          </div>
        </div>
      </section>

      <LandingFooter C={C} theme={theme} setTheme={setTheme} />
        </>
      )}
    </div>
  )
}
