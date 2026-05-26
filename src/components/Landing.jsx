import React, { useState, useEffect, useRef } from 'react'
import { usePostHog } from '@posthog/react'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import {
  DARK_ACCENT,
  DARK_ACCENT_DEEP,
  DARK_ACCENT_TEXT,
  DARK_BORDER,
  DARK_BORDER_STRONG,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_PANEL_SURFACE_ALT,
  DARK_SOLID_PANEL,
  DARK_TEXT,
  DARK_TEXT_FAINT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_DEEP,
  LIGHT_ACCENT_TEXT,
  LIGHT_BORDER,
  LIGHT_BORDER_STRONG,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_PANEL_SURFACE_ALT,
  LIGHT_SOLID_PANEL,
  LIGHT_TEXT,
  LIGHT_TEXT_FAINT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_DEEP,
  SHARP_ACCENT_TEXT,
  SHARP_BORDER,
  SHARP_BORDER_STRONG,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_PANEL_SURFACE_ALT,
  SHARP_SOLID_PANEL,
  SHARP_TEXT,
  SHARP_TEXT_FAINT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

const PALETTE = {
  onyx: '#222526',
  graphite: '#353A3E',
  platinum: '#E0E0E0',
  jet: '#1A1A1A',
  ash: '#BFBFBF',
}

const CONSOLE = {
  black: '#000000',
  crimson1: '#110909',
  crimson2: '#1C1514',
  sequoia: '#7D615E',
  barberry: '#A98D86',
  green: '#88D8A8',
}

const ELITE = {
  page: DARK_PAGE_BG,
  band: DARK_HERO_SURFACE,
  panel: DARK_PANEL_SURFACE,
  panel2: DARK_PANEL_SURFACE_ALT,
  line: DARK_BORDER,
  lineStrong: DARK_BORDER_STRONG,
  ink: DARK_TEXT,
  soft: DARK_TEXT_SOFT,
  muted: DARK_TEXT_MUTED,
  faint: DARK_TEXT_FAINT,
  accent: DARK_ACCENT,
  accentDeep: DARK_ACCENT_DEEP,
}

const LIGHT = {
  page: LIGHT_PAGE_BG,
  band: LIGHT_HERO_SURFACE,
  panel: LIGHT_PANEL_SURFACE,
  panel2: LIGHT_PANEL_SURFACE_ALT,
  line: LIGHT_BORDER,
  lineStrong: LIGHT_BORDER_STRONG,
  ink: LIGHT_TEXT,
  soft: LIGHT_TEXT_SOFT,
  muted: LIGHT_TEXT_MUTED,
  faint: LIGHT_TEXT_FAINT,
  accent: LIGHT_ACCENT,
  accentDeep: LIGHT_ACCENT_DEEP,
  consoleBg: '#1C290D',
  consoleSurface: '#253313',
  consolePanel: '#223010',
  consolePanel2: '#2A3A14',
  consoleBorder: '#3A5020',
  consoleBorderSoft: '#4A6030',
  consoleInk: '#C8D4B8',
  consoleSoft: '#8A9E78',
  consoleMuted: '#676F53',
  consoleFaint: '#4F6642',
  consoleVerdict: '#8A9E78',
  consoleVerdictBg: '#2E3E18',
  consoleAmber: '#C9A040',
}

const SHARP = {
  page: SHARP_PAGE_BG,
  band: SHARP_HERO_SURFACE,
  panel: SHARP_PANEL_SURFACE,
  panel2: SHARP_PANEL_SURFACE_ALT,
  line: SHARP_BORDER,
  lineStrong: SHARP_BORDER_STRONG,
  ink: SHARP_TEXT,
  soft: SHARP_TEXT_SOFT,
  muted: SHARP_TEXT_MUTED,
  faint: SHARP_TEXT_FAINT,
  accent: SHARP_ACCENT,
  accentDeep: SHARP_ACCENT_DEEP,
  consoleBg: '#0D1930',
  consoleSurface: '#152742',
  consolePanel: '#1A2F4E',
  consolePanel2: SHARP_SOLID_PANEL,
  consoleBorder: SHARP_BORDER,
  consoleBorderSoft: SHARP_BORDER_STRONG,
  consoleInk: SHARP_TEXT,
  consoleSoft: SHARP_TEXT_SOFT,
  consoleMuted: SHARP_TEXT_MUTED,
  consoleFaint: SHARP_TEXT_FAINT,
  consoleVerdict: '#7E9FE7',
  consoleVerdictBg: '#203756',
  consoleAmber: '#8DABEA',
}

const THEMES = {
  dark: {
    theme: 'dark',
    bg: ELITE.page,
    surface: ELITE.band,
    surface2: ELITE.panel2,
    surface3: ELITE.panel,
    card: ELITE.panel,
    border: ELITE.line,
    border2: ELITE.lineStrong,
    ink: ELITE.ink,
    inkSoft: ELITE.soft,
    inkMuted: ELITE.muted,
    inkFaint: ELITE.faint,
    accent: ELITE.accent,
    accentDark: ELITE.accentDeep,
    accentSoft: ELITE.panel2,
    accentText: ELITE.soft,
    redMuted: ELITE.accent,
    redSoft: ELITE.panel2,
    amber: ELITE.accent,
  },
  light: {
    theme: 'light',
    bg: LIGHT.page,
    surface: LIGHT.band,
    surface2: LIGHT.panel2,
    surface3: LIGHT.panel,
    card: LIGHT.panel,
    border: LIGHT.line,
    border2: LIGHT.lineStrong,
    ink: LIGHT.ink,
    inkSoft: LIGHT.soft,
    inkMuted: LIGHT.muted,
    inkFaint: LIGHT.faint,
    accent: LIGHT.accent,
    accentDark: LIGHT.accentDeep,
    accentSoft: LIGHT.panel2,
    accentText: LIGHT.accentDeep,
    redMuted: LIGHT.accentDeep,
    redSoft: LIGHT.panel2,
    amber: LIGHT.accent,
  },
  sharp: {
    theme: 'sharp',
    bg: SHARP.page,
    surface: SHARP.band,
    surface2: SHARP.panel2,
    surface3: SHARP.panel,
    card: SHARP.panel,
    border: SHARP.line,
    border2: SHARP.lineStrong,
    ink: SHARP.ink,
    inkSoft: SHARP.soft,
    inkMuted: SHARP.muted,
    inkFaint: SHARP.faint,
    accent: SHARP.accent,
    accentDark: SHARP.accentDeep,
    accentSoft: SHARP.panel2,
    accentText: SHARP_ACCENT_TEXT,
    redMuted: '#6E8FDE',
    redSoft: SHARP.panel2,
    amber: '#90ABE5',
  },
}

const THEME_ORDER = ['dark', 'light', 'sharp']

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

const heroConnectorStrip = [
  { name: 'Zendesk', bubble: 'Z', bubbleBg: '#0F766E', bubbleColor: '#E8FFFB' },
  { name: 'Freshdesk', bubble: 'F', bubbleBg: '#22C55E', bubbleColor: '#F3FFF6' },
  { name: 'QuickBooks', bubble: 'Q', bubbleBg: '#2CA01C', bubbleColor: '#F3FFF0' },
  { name: 'Xero', bubble: 'X', bubbleBg: '#13B5EA', bubbleColor: '#F2FCFF' },
  { name: 'HubSpot', bubble: 'H', bubbleBg: '#FF7A59', bubbleColor: '#FFF4EF' },
  { name: 'Salesforce', bubble: 'S', bubbleBg: '#00A1E0', bubbleColor: '#EFFBFF' },
  { name: 'Notion', bubble: 'N', bubbleBg: '#8B949E', bubbleColor: '#111111' },
  { name: 'Slack', bubble: 'S', bubbleBg: '#4A154B', bubbleColor: '#F7ECF7' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PrimaryButton({ label, onClick, small = false, C }) {
  const [hovered, setHovered] = useState(false)
  const darkTheme = C.theme === 'dark'
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
        color: darkTheme ? C.bg : (C.theme === 'light' ? '#FFFFFF' : C.ink),
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
  const sharpTheme = C.theme === 'sharp'
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
        background: sharpTheme ? (hovered ? C.accentDark : C.accent) : (hovered ? C.surface2 : 'transparent'),
        color: C.ink,
        padding: '14px 22px',
        borderRadius: 999,
        fontSize: 16,
        fontWeight: 600,
        border: sharpTheme ? 'none' : `1px solid ${C.border2}`,
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
        boxShadow: expanded ? `0 0 0 1px ${C.border2}` : 'none',
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
            {[PALETTE.ash, PALETTE.graphite, PALETTE.platinum].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: C.inkFaint, marginLeft: 6, letterSpacing: '0.08em' }}>
            selfaudit · intelligence engine
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {!expanded && !isPaused && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, animation: 'pulse 1.5s infinite' }} />
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
            color: thread.a.startsWith('CRITICAL') ? C.accentText : C.amber,
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
      border: `1px solid ${C.border2}`,
      boxShadow: 'none',
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
        color: C.inkMuted,
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
  const cycleTheme = () => {
    const currentIndex = THEME_ORDER.indexOf(theme)
    const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length]
    setTheme(nextTheme)
  }

  return (
    <button
      onClick={cycleTheme}
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
      ◐ Theme
    </button>
  )
}

function LandingNav({ C, pageOpen, onBack, onPricing, onStories, onConnected, onSignIn, onStartAudit, onLogoClick, storiesOpen, connectedOpen, pricingOpen, theme, setTheme }) {
  const navBg = C.theme === 'dark'
    ? 'rgba(10, 6, 6, 0.88)'
    : C.theme === 'sharp'
      ? 'rgba(21, 46, 76, 0.9)'
      : 'rgba(245, 240, 234, 0.86)'
  return (
    <nav style={{ padding: '20px 0', borderBottom: `1px solid ${C.border}`, background: navBg, backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 20 }}>
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
          <PrimaryButton label="Start free" onClick={onStartAudit} small C={C} />
        </div>
      </div>
    </nav>
  )
}

function ConnectorLogo({ tool, src, brandColor, fallbackText }) {
  return (
    <div style={{
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: PALETTE.graphite,
      border: `1px solid ${PALETTE.ash}`,
      color: PALETTE.platinum,
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

function LandingFooter({ C, theme, setTheme }) {
  return (
    <footer style={{ background: C.surface, color: C.inkMuted, padding: '42px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15 }}>
          Built by{' '}
          <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
            Vnklo
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.inkMuted, textDecoration: 'none' }}>
            Privacy Policy
          </a>
          <a href={TERMS_HASH} style={{ color: C.inkMuted, textDecoration: 'none' }}>
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  )
}

function StoriesPage({ C, onStartAudit }) {
  return (
    <>
      <section style={{ padding: '96px 0 72px', background: C.theme === 'light' ? '#C8C0B0' : C.bg }}>
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

      <section style={{ padding: '0 0 96px', background: C.theme === 'light' ? '#C8C0B0' : C.bg }}>
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            {storyCards.map((story) => {
              const critical = story.severity === 'CRITICAL'
              return (
                <div
                  key={story.domain + story.meta}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.theme === 'light' ? '#A8A09A' : C.border}`,
                    borderLeft: `3px solid ${critical ? C.redMuted : C.amber}`,
                    borderRadius: 16,
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    boxShadow: C.theme === 'light' ? '0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)' : 'none',
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
    ? { background: PALETTE.graphite, color: PALETTE.platinum }
    : { background: PALETTE.ash, color: PALETTE.jet }
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
          boxShadow: 'none',
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
                  color: C.theme === 'light' ? '#FFFFFF' : C.ink,
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
              { feature: 'Ask SelfAudit (business Q&A)',      foundation: false, intelligence: true },
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

  const softPalette = C.theme === 'sharp' ? SHARP : LIGHT
  const tonedMode = C.theme !== 'dark'
  const panelBg        = tonedMode ? softPalette.consoleBg : CONSOLE.crimson1
  const panelSurface   = tonedMode ? softPalette.consoleSurface : CONSOLE.crimson2
  const panelBorder    = tonedMode ? softPalette.consoleBorder : '#2B1D1B'
  const panelBorderSoft = tonedMode ? softPalette.consoleBorderSoft : '#2B1D1B'
  const panelInkFaint  = tonedMode ? softPalette.consoleFaint : CONSOLE.sequoia
  const panelInkDim    = tonedMode ? softPalette.consoleMuted : CONSOLE.sequoia
  const panelInkSoft   = tonedMode ? softPalette.consoleSoft : CONSOLE.barberry
  const panelRowBorder = tonedMode ? softPalette.consoleBorder : '#2B1D1B'
  const panelVerdictBg = tonedMode ? softPalette.consoleVerdictBg : '#2B1514'
  const panelVerdictColor = tonedMode ? softPalette.consoleAmber : '#FF6432'
  const panelTextColor = tonedMode ? softPalette.consoleInk : PALETTE.platinum
  const panelIngestColor  = tonedMode ? '#7BD8B6' : '#77E8BE'
  const panelSignalColor  = tonedMode ? softPalette.consoleAmber : '#FF6432'
  const displayAccent = C.theme === 'sharp' ? '#6F8FE0' : C.redMuted
  const statColor = C.theme === 'sharp' ? panelTextColor : C.redMuted
  const panelShellBg = C.theme === 'light'
    ? 'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.06), transparent 26%), linear-gradient(180deg, #2E3E18 0%, #1C290D 100%)'
    : C.theme === 'sharp'
      ? 'linear-gradient(180deg, #0E1C30 0%, #0B1728 100%)'
      : 'linear-gradient(180deg, #090505 0%, #050303 100%)'
  const panelShadow = C.theme === 'light'
    ? '0 34px 88px rgba(31, 54, 35, 0.18), 0 14px 32px rgba(31, 54, 35, 0.12)'
    : C.theme === 'sharp'
      ? '0 28px 72px rgba(8, 18, 34, 0.28)'
      : '0 34px 88px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(74, 49, 43, 0.16)'
  const panelSheen = C.theme === 'light'
    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 22%, rgba(255,255,255,0) 40%)'
    : C.theme === 'sharp'
      ? 'linear-gradient(180deg, rgba(138,167,226,0.08) 0%, rgba(138,167,226,0) 34%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 30%)'

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
            fontFamily: 'inherit',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.accentText,
            fontWeight: 600,
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
            <em style={{ fontStyle: 'italic', color: displayAccent }}>engine room.</em>
          </h2>

          <p style={{
            fontFamily: serif,
            fontSize: 'clamp(18px, 1.6vw, 22px)',
            color: C.inkSoft,
            lineHeight: 1.65,
            margin: '0 0 40px',
          }}>
            This is what runs behind every audit — reading your tools, detecting signals, and surfacing what matters before you have to ask.
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
                  color: statColor,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: 'inherit',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: C.inkMuted,
                  fontWeight: 600,
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
          background: panelShellBg,
          borderRadius: 12,
          height: 600,
          overflow: 'hidden',
          border: `1px solid ${panelBorder}`,
          position: 'relative',
          boxShadow: panelShadow,
        }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: panelSheen, pointerEvents: 'none', zIndex: 1 }} />
          {/* Header bar */}
          <div style={{
            background: panelSurface,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${panelBorder}`,
          }}>
            <div style={{ fontFamily: 'inherit', fontSize: 13, color: panelInkSoft, fontWeight: 600, letterSpacing: '0.04em' }}>
              stream / <span style={{ color: panelVerdictColor, fontWeight: 700 }}>live</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: panelIngestColor, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', color: panelIngestColor, fontWeight: 700 }}>RECEIVING</span>
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
                    <span style={{ fontFamily: 'inherit', fontSize: 11, color: panelInkDim, fontWeight: 500, letterSpacing: '0.04em' }}>{row.time}</span>
                    <span style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: typeColor(row.type), letterSpacing: '0.04em' }}>{row.type}</span>
                    <span style={{
                      fontFamily: 'inherit', fontSize: 12,
                      color: isVerdict ? panelVerdictColor : panelTextColor,
                      fontWeight: isVerdict ? 500 : 400,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{row.text}</span>
                    <span style={{
                      fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.06em',
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
  const sectionRef  = useRef(null)
  const headingRef  = useRef(null)
  const cardRefs    = useRef([])

  const I = {
    bg: C.bg,
    border: C.border,
    border2: C.border,
    ink: C.ink,
    inkSoft: C.inkSoft,
    inkMuted: C.inkMuted,
    inkFaint: C.inkFaint,
    accent: C.theme === 'sharp' ? '#8AA6E4' : C.theme === 'light' ? '#5C7248' : CONSOLE.barberry,
    redMuted: C.theme === 'sharp' ? '#8AA6E4' : C.theme === 'light' ? '#5C7248' : CONSOLE.barberry,
  }

  const cardBg = C.card
  const cardPanelBg = C.theme === 'sharp' ? C.surface2 : C.surface

  const verbs = [
    {
      num: '01',
      verb: 'diagnoses.',
      desc: 'Tell it a symptom. It investigates across your tools, history, and patterns — then names the cause, not the surface.',
      card: (
        <div style={{ background: cardBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 22 }}>SYMPTOM</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontStyle: 'italic', color: C.inkMuted, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
            &ldquo;Why is our churn climbing?&rdquo;
          </div>
          <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: I.redMuted, fontWeight: 700, marginBottom: 16 }}>VERDICT · 3.4S</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.55 }}>
            Retention <em style={{ fontStyle: 'italic', color: I.redMuted }}>looks fine</em> because acquisition is masking it. Your cohorts are weaker —{' '}
            <em style={{ fontStyle: 'italic', color: I.redMuted }}>the curves cross in nine months.</em>
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
          <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 22 }}>MEMORY · 11 WEEKS</div>
          {[
            { day: 'Day 04', text: 'Founder said hiring was the biggest constraint.', accent: false },
            { day: 'Day 31', text: 'Pricing flagged as a leak. Was deprioritized.', accent: false },
            { day: 'Day 58', text: 'Hiring discussion resurfaced — pricing still untouched.', accent: false },
            { day: 'Day 77', text: 'Third time hiring has come up before pricing was settled. Pattern, not coincidence.', accent: true },
          ].map((item, i, arr) => (
            <div key={item.day} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16, alignItems: 'start', padding: '14px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontFamily: 'inherit', fontSize: 12, color: I.redMuted, fontWeight: 600, paddingTop: 2 }}>{item.day}</span>
              {item.accent
                ? <em style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: I.redMuted, lineHeight: 1.55 }}>{item.text}</em>
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
          <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 22 }}>ALERTS · LAST 7 DAYS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { time: 'SUN · 23:42', body: <>CAC drifted <em style={{ fontStyle: 'italic', color: I.redMuted }}>22% this week.</em> Cause sits in Thursday&apos;s launch.</> },
              { time: 'WED · 04:18', body: <>Goal &ldquo;Hit $500K Q3&rdquo; is now <em style={{ fontStyle: 'italic', color: I.redMuted }}>3 weeks behind pace.</em> Path salvageable.</> },
              { time: 'FRI · 09:02', body: <>Onboarding completion dropped <em style={{ fontStyle: 'italic', color: I.redMuted }}>14%</em> after Tuesday&apos;s UX change.</> },
            ].map((alert) => (
              <div key={alert.time} style={{ borderLeft: `3px solid ${I.redMuted}`, borderRadius: '0 8px 8px 0', padding: '12px 16px', background: cardPanelBg }}>
                <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 6 }}>{alert.time}</div>
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
          <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 24 }}>NEXT MOVE · RANKED</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {['Hire a VP of Sales', 'Run a Google Ads test', 'Launch the new feature'].map((item) => (
              <div key={item} style={{ fontFamily: serif, fontSize: 18, fontStyle: 'italic', color: C.inkFaint, textDecoration: 'line-through' }}>{item}</div>
            ))}
          </div>
          <div style={{ borderTop: `2px solid ${I.redMuted}`, paddingTop: 14, marginTop: 'auto' }}>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, color: C.ink, lineHeight: 1.55 }}>
              <em style={{ fontStyle: 'italic', color: I.redMuted }}>Cancel the agency contract.</em>{' '}
              Reallocate the $5K to Clay. 30-day test with one rep.{' '}
              <em style={{ fontStyle: 'italic', color: I.redMuted }}>Stop everything else.</em>
            </div>
          </div>
        </div>
      ),
    },
  ]

  useEffect(() => {
    const section = sectionRef.current
    const heading = headingRef.current
    const cards   = cardRefs.current
    if (!section || !heading || cards.some(c => !c)) return

    const CARD_STAGGER = 24
    const nav = document.querySelector('nav')
    let vh = window.innerHeight
    let headingH = heading.offsetHeight
    let navH = nav ? nav.offsetHeight : 64

    function applyHeight() {
      vh       = window.innerHeight
      headingH = heading.offsetHeight
      navH     = nav ? nav.offsetHeight : 64
      // heading + 4 card runways + 1 breathing viewport
      section.style.height = `${headingH + 5 * vh}px`
    }

    function onScroll() {
      const sectionTop = section.getBoundingClientRect().top
      const scrolled   = -sectionTop

      heading.style.position = scrolled <= 0 ? 'relative' : 'sticky'
      heading.style.top      = '0px'

      cards.forEach((card, i) => {
        // pinTop starts just below nav so card content isn't clipped.
        // absTop = headingH + i*vh so each card starts 1 viewport apart.
        // switchAt = absTop - pinTop keeps transition seamless (no jump).
        const pinTop   = navH + i * CARD_STAGGER
        const absTop   = headingH + i * vh
        const switchAt = absTop - pinTop

        if (scrolled < switchAt) {
          card.style.position = 'absolute'
          card.style.top      = `${absTop}px`
        } else {
          card.style.position = 'sticky'
          card.style.top      = `${pinTop}px`
        }
      })
    }

    applyHeight()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', applyHeight)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', applyHeight)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="sa-fv-section"
      style={{
        background:  I.bg,
        borderTop:   `1px solid ${I.border}`,
        position:    'relative',
        height:      '500vh',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .sa-fv-section { height: auto !important; }
          .sa-fv-heading { position: relative !important; top: auto !important; }
          .sa-fv-card-wrap { position: relative !important; top: auto !important; margin-bottom: 48px !important; }
        }
      `}</style>

      {/* Heading */}
      <div
        ref={headingRef}
        className="sa-fv-heading"
        style={{
          background: I.bg,
          zIndex:     10,
          padding:    `clamp(64px, 9vw, 140px) clamp(28px, 6vw, 80px) 40px`,
        }}
      >
        <div style={{ maxWidth: 780 }}>
          <div style={{ fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: I.inkMuted, fontWeight: 600, marginBottom: 20 }}>
            What an operating brain actually does
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', color: I.ink, margin: '0 0 20px' }}>
            Four things <em style={{ fontStyle: 'italic', color: I.redMuted }}>only a brain</em> can do.
          </h2>
          <p style={{ fontFamily: serif, fontSize: 22, color: I.inkSoft, lineHeight: 1.6, margin: 0 }}>
            Tools wait for prompts. Dashboards show numbers. Reports get filed. A brain <em style={{ fontStyle: 'italic' }}>works.</em>
          </p>
        </div>
      </div>

      {/* Cards — JS positions them inside the tall section */}
      {verbs.map((v, i) => (
        <div
          key={v.num}
          ref={el => cardRefs.current[i] = el}
          className="sa-fv-card-wrap"
          style={{
            position:      'absolute',
            width:         '100%',
            boxSizing:     'border-box',
            background:    I.bg,
            borderTop:     `1px solid ${I.border2}`,
            paddingLeft:   'clamp(28px, 6vw, 80px)',
            paddingRight:  'clamp(28px, 6vw, 80px)',
            paddingTop:    'clamp(40px, 6vw, 72px)',
            paddingBottom: 'clamp(48px, 7vw, 80px)',
            zIndex:        10 + i,
            boxShadow:     'none',
          }}
        >
          <div className="sa-fv-card-grid">
            <div>
              <div style={{ fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: I.accent, fontWeight: 700, marginBottom: 16 }}>
                {v.num} / FOUR
              </div>
              <h3 style={{ fontFamily: serif, fontSize: 'clamp(32px, 6vw, 88px)', fontWeight: 700, lineHeight: 0.98, letterSpacing: '-0.045em', margin: '0 0 24px' }}>
                <span style={{ color: I.ink }}>It </span>
                <em style={{ fontStyle: 'italic', color: I.redMuted }}>{v.verb}</em>
              </h3>
              <p style={{ fontFamily: serif, fontSize: 20, color: I.inkSoft, lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
                {v.desc}
              </p>
            </div>
            {v.card}
          </div>
        </div>
      ))}
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
          html += `<em style="font-style:italic;color:${C.theme === 'light' ? '#5C7248' : CONSOLE.barberry}">`
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

  const softPalette = C.theme === 'sharp' ? SHARP : LIGHT
  const tonedMode = C.theme !== 'dark'
  const panelBg         = tonedMode ? softPalette.consoleBg : CONSOLE.crimson1
  const panelSurface    = tonedMode ? softPalette.consoleSurface : CONSOLE.crimson2
  const panelBorder     = tonedMode ? softPalette.consoleBorder : '#2B1D1B'
  const panelBorderSoft = tonedMode ? softPalette.consoleBorderSoft : '#2B1D1B'
  const panelInkFaint   = tonedMode ? softPalette.consoleFaint : CONSOLE.sequoia
  const panelInkMuted   = tonedMode ? softPalette.consoleMuted : CONSOLE.sequoia
  const panelInkSoft    = tonedMode ? softPalette.consoleSoft : CONSOLE.barberry
  const panelInk        = tonedMode ? softPalette.consoleInk : PALETTE.platinum
  const macDots = ['#FF5F57', '#FFBD2E', '#28C840']
  const panelHealthy    = CONSOLE.green
  const panelAmber      = tonedMode ? softPalette.consoleAmber : CONSOLE.barberry
  const panelCritical   = tonedMode ? softPalette.consoleMuted : CONSOLE.sequoia
  const panelShellBg = C.theme === 'light'
    ? 'radial-gradient(circle at 22% 0%, rgba(255,255,255,0.06), transparent 24%), linear-gradient(180deg, #2E3E18 0%, #1C290D 100%)'
    : C.theme === 'sharp'
      ? 'linear-gradient(180deg, #0C182A 0%, #091321 100%)'
      : 'linear-gradient(180deg, #090505 0%, #040202 100%)'
  const panelShadow = C.theme === 'light'
    ? '0 34px 92px rgba(31, 54, 35, 0.18), 0 14px 34px rgba(31, 54, 35, 0.12)'
    : C.theme === 'sharp'
      ? '0 26px 68px rgba(8, 18, 34, 0.26)'
      : '0 34px 88px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(74, 49, 43, 0.14)'
  const panelSheen = C.theme === 'light'
    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 24%, rgba(255,255,255,0) 42%)'
    : C.theme === 'sharp'
      ? 'linear-gradient(180deg, rgba(138,167,226,0.08) 0%, rgba(138,167,226,0) 34%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 28%)'

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
          background: ${tonedMode ? softPalette.consoleAmber : CONSOLE.barberry};
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
        <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: panelInkSoft, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginRight: 14 }} />}
          A live diagnosis
          {C.theme === 'light' && <span style={{ display: 'inline-block', width: 28, height: 1, background: C.border2, verticalAlign: 'middle', marginLeft: 14 }} />}
        </div>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(32px, 5.5vw, 80px)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1.04, color: C.ink, margin: '0 0 20px' }}>
          Watch the brain <em style={{ fontStyle: 'italic', color: C.theme === 'light' ? C.accent : panelAmber }}>think.</em>
        </h2>
        <p style={{ fontFamily: serif, fontSize: 20, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
          Not a chat. A reasoning process. Real signals. Real verdict. Real next move.
        </p>
      </div>

      {/* Console panel */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ background: panelShellBg, border: `1px solid ${panelBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: panelShadow, position: 'relative' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: panelSheen, pointerEvents: 'none', zIndex: 1 }} />

          {/* Top bar */}
          <div style={{ position: 'relative', zIndex: 2, background: panelSurface, borderBottom: `1px solid ${panelBorderSoft}`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {macDots.map(color => <div key={color} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
              </div>
              <span style={{ fontFamily: 'inherit', fontSize: 12, color: panelInkSoft, fontWeight: 600, letterSpacing: '0.04em' }}>selfaudit · diagnosis console</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: panelHealthy, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', color: panelHealthy, fontWeight: 700 }}>● LIVE</span>
            </div>
          </div>

          {/* Body */}
          <div style={{ position: 'relative', zIndex: 2, padding: 36 }}>

            {/* Symptom */}
            <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, marginBottom: 12 }}>SYMPTOM</div>
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
                  <span style={{ color: panelHealthy, fontFamily: 'inherit', fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'inherit', fontSize: 13, color: panelInkMuted }}>
                    {step.action}{' '}<span style={{ color: panelInkSoft }}>{step.source}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Verdict label */}
            <div ref={vlabelRef} className="ldc-vlabel" style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkSoft, fontWeight: 600, marginBottom: 14 }}>
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
                  <div style={{ fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, marginBottom: 6 }}>{item.label}</div>
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
  const softPalette = C.theme === 'sharp' ? SHARP : LIGHT
  const tonedMode = C.theme !== 'dark'
  const amber = C.theme === 'sharp' ? '#88A5E5' : tonedMode ? softPalette.consoleAmber : CONSOLE.barberry
  const green = CONSOLE.green

  useEffect(() => {
    const id = setInterval(() => {
      if (healthRef.current) healthRef.current.textContent = String(68 + Math.floor(Math.random() * 3))
      if (goalRef.current)   goalRef.current.textContent   = `${42 + Math.floor(Math.random() * 2)}%`
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const tokens = C.theme === 'light'
    ? {
        amberBg: '#2A3808',
        amberBorder: '#4A6010',
        redBg: '#3A1010',
        panelBg: '#1A2A0A',
        panelBorder: '#3A5020',
        panelBorderSoft: '#2A3E14',
        panelInkFaint: '#5C7840',
        panelInkDim: '#7A9860',
        panelInkMuted: '#8AAA70',
        panelInkSoft: '#C8D8B0',
        panelSurface: 'linear-gradient(180deg, #253313 0%, #1E2C0E 100%)',
        panelPillBg: '#2E4018',
        panelPillBorder: '#4A6028',
        panelPillText: '#B8D098',
        panelSidebarBg: 'linear-gradient(180deg, #1C290D 0%, #162208 100%)',
        panelSidebarDivider: '#2E4018',
        panelActiveItemBg: '#3A5020',
        panelShellBg: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.07), transparent 22%), linear-gradient(180deg, #2E3E18 0%, #1C290D 100%)',
        panelShellShadow: '0 44px 120px rgba(31, 54, 35, 0.22), 0 18px 42px rgba(31, 54, 35, 0.14)',
        panelSheen: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 18%, rgba(255,255,255,0) 40%)',
        panelBodyBg: '#223010',
        cardFill: '#2A3E14',
        cardBorder: '#3A5420',
        issueRowBg: '#243612',
        panelHeadingInk: '#E8F0D8',
      }
    : C.theme === 'sharp'
      ? {
          amberBg: '#324D73',
          amberBorder: '#4E719C',
          redBg: '#2F4668',
          panelBg: '#0F1D31',
          panelBorder: '#34557A',
          panelBorderSoft: '#284666',
          panelInkFaint: '#7E93AF',
          panelInkDim: '#93A7C2',
          panelInkMuted: '#93A7C2',
          panelInkSoft: '#E3ECF8',
          panelSurface: 'linear-gradient(180deg, #152841 0%, #122238 100%)',
          panelPillBg: '#2D4467',
          panelPillBorder: '#48678F',
          panelPillText: '#C9D8EC',
          panelSidebarBg: 'linear-gradient(180deg, #13253C 0%, #102033 100%)',
          panelSidebarDivider: '#284666',
          panelActiveItemBg: '#3A547C',
          panelShellBg: 'radial-gradient(circle at 20% 0%, rgba(141,170,228,0.10), transparent 22%), linear-gradient(180deg, #102033 0%, #0D1A2A 100%)',
          panelShellShadow: '0 38px 96px rgba(7, 17, 32, 0.34), 0 16px 40px rgba(7, 17, 32, 0.2)',
          panelSheen: 'linear-gradient(180deg, rgba(150,179,232,0.08) 0%, rgba(150,179,232,0.02) 18%, rgba(150,179,232,0) 38%)',
          panelBodyBg: '#223754',
          cardFill: '#304768',
          cardBorder: '#446489',
          issueRowBg: '#2B4262',
          panelHeadingInk: '#F4F8FE',
        }
      : {
          amberBg: '#2A1F1C',
          amberBorder: '#4F3832',
          redBg: '#4A2A27',
          panelBg: '#070404',
          panelBorder: '#2E221E',
          panelBorderSoft: '#231916',
          panelInkFaint: '#7F6660',
          panelInkDim: '#937973',
          panelInkMuted: '#937973',
          panelInkSoft: '#D7C2BB',
          panelSurface: 'linear-gradient(180deg, #120D0C 0%, #0D0908 100%)',
          panelPillBg: '#251B19',
          panelPillBorder: '#43312D',
          panelPillText: '#C0A69F',
          panelSidebarBg: 'linear-gradient(180deg, #0A0605 0%, #060403 100%)',
          panelSidebarDivider: '#1C1311',
          panelActiveItemBg: '#2B201D',
          panelShellBg: 'radial-gradient(circle at 18% 0%, rgba(255,255,255,0.035), transparent 22%), linear-gradient(180deg, #0B0706 0%, #050303 100%)',
          panelShellShadow: '0 44px 120px rgba(0, 0, 0, 0.52), 0 18px 44px rgba(0, 0, 0, 0.28)',
          panelSheen: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 16%, rgba(255,255,255,0) 34%)',
          panelBodyBg: '#0F0B0A',
          cardFill: '#17100F',
          cardBorder: '#2C201D',
          issueRowBg: '#140E0D',
          panelHeadingInk: '#F4EDE7',
        }

  const {
    amberBg,
    amberBorder,
    redBg,
    panelBg,
    panelBorder,
    panelBorderSoft,
    panelInkFaint,
    panelInkDim,
    panelInkMuted,
    panelInkSoft,
    panelSurface,
    panelPillBg,
    panelPillBorder,
    panelPillText,
    panelSidebarBg,
    panelSidebarDivider,
    panelActiveItemBg,
    panelShellBg,
    panelShellShadow,
    panelSheen,
    panelBodyBg,
    cardFill,
    cardBorder,
    issueRowBg,
    panelHeadingInk,
  } = tokens

  const macDots = ['#FF5F57', '#FFBD2E', '#28C840']
  const panelActiveItem = tonedMode ? softPalette.consoleInk : PALETTE.platinum

  const Sidebar = () => (
    <div className="sa-dash-sidebar" style={{ background: panelSidebarBg, borderRight: `1px solid ${panelSidebarDivider}`, padding: '22px 0', minHeight: 540 }}>
      <div style={{ fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, padding: '0 22px', marginBottom: 8 }}>Workspace</div>

      {/* Active item */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 22px', borderLeft: `2px solid ${amber}`, background: panelActiveItemBg }}>
        <span style={{ fontFamily: mono, fontSize: 13, color: panelActiveItem }}>● Command centre</span>
      </div>
      {['■ Audits', '◐ Signals', '⊕ Connectors'].map(item => (
        <div key={item} style={{ padding: '9px 22px 9px 24px', fontFamily: mono, fontSize: 13, color: panelInkMuted }}>{item}</div>
      ))}

      <div style={{ margin: '18px 22px', height: 1, background: panelSidebarDivider }} />

      <div style={{ fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, padding: '0 22px', marginBottom: 8 }}>Intelligence</div>
      {['⎈ Brief', '✦ Ask SelfAudit', '◷ Governance'].map(item => (
        <div key={item} style={{ padding: '9px 22px 9px 24px', fontFamily: mono, fontSize: 13, color: panelInkMuted }}>{item}</div>
      ))}
    </div>
  )

  return (
    <section style={{ background: C.bg, padding: 'clamp(64px, 8vw, 160px) 0', borderTop: `1px solid ${C.border}` }}>

      {/* Intro */}
      <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 64px', padding: '0 28px' }}>
        <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
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
        <div style={{ background: panelShellBg, border: `1px solid ${panelBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: panelShellShadow, position: 'relative' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: panelSheen, pointerEvents: 'none', zIndex: 1 }} />

          {/* Top bar */}
          <div style={{ position: 'relative', zIndex: 2, background: panelSurface, borderBottom: `1px solid ${panelBorderSoft}`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {macDots.map(color => <div key={color} style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />)}
              </div>
              <span style={{ fontFamily: 'inherit', fontSize: 12, color: panelInkSoft, fontWeight: 600, letterSpacing: '0.04em' }}>selfaudit · command centre</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: green, animation: 'erPulse 1.5s infinite' }} />
              <span style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', color: green, fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          {/* Body grid */}
          <div className="sa-dash-body" style={{ position: 'relative', zIndex: 2, background: panelBodyBg }}>
            <Sidebar />

            {/* Main panel */}
            <div style={{ padding: '28px 32px' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
                <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: panelHeadingInk }}>Your business · this week</div>
                <div style={{ fontFamily: 'inherit', fontSize: 10, color: panelInkMuted, fontWeight: 500 }}>Last synced 2m ago</div>
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
                  <div key={stat.label} style={{ background: cardFill, border: `1px solid ${cardBorder}`, borderRadius: 10, padding: 16, boxShadow: C.theme === 'light' ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, marginBottom: 8 }}>{stat.label}</div>
                    <div ref={stat.dynRef} style={{ fontFamily: serif, fontSize: 30, fontWeight: 600, color: panelHeadingInk, lineHeight: 1 }}>{stat.val}</div>
                    <div style={{ fontFamily: 'inherit', fontSize: 10, color: stat.subColor, fontWeight: 500, marginTop: 6 }}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Recommended next move */}
              <div style={{ background: amberBg, border: `1px solid ${amberBorder}`, borderRadius: 12, padding: '20px 22px', marginBottom: 18, boxShadow: C.theme === 'light' ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkSoft, fontWeight: 600, marginBottom: 10 }}>Recommended next move</div>
                <p style={{ fontFamily: serif, fontSize: 17, fontWeight: 500, color: panelHeadingInk, lineHeight: 1.55, margin: '0 0 16px' }}>
                  Cancel the agency contract this week. Run a{' '}
                  <em style={{ fontStyle: 'italic', color: amber }}>30-day Clay test</em>
                  {' '}with one rep before scaling outbound.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={{ background: amber, color: CONSOLE.black, border: 'none', borderRadius: 999, padding: '7px 14px', fontFamily: mono, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
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
              <div style={{ fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: panelInkMuted, fontWeight: 600, marginBottom: 8 }}>Open issues</div>
              {[
                { title: 'Market validation',             meta: 'Critical · flagged May 4',    badge: 'CRITICAL', badgeBg: redBg,       badgeColor: '#F0B1A5' },
                { title: 'Pricing model needs restructure', meta: 'High · 3 audits in a row',   badge: 'HIGH',     badgeBg: amberBg,     badgeColor: amber },
                { title: 'Sales cycle drift',             meta: 'High · trending worse',       badge: 'HIGH',     badgeBg: amberBg,     badgeColor: amber },
              ].map(issue => (
                <div key={issue.title} style={{ background: issueRowBg, border: `1px solid ${cardBorder}`, borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 14, color: panelHeadingInk, marginBottom: 3 }}>{issue.title}</div>
                    <div style={{ fontFamily: 'inherit', fontSize: 10, color: panelInkMuted, fontWeight: 500 }}>{issue.meta}</div>
                  </div>
                  <span style={{ background: issue.badgeBg, color: issue.badgeColor, fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, borderRadius: 4, padding: '3px 8px', flexShrink: 0 }}>
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
  const softPalette = C.theme === 'sharp' ? SHARP : LIGHT
  const tonedMode = C.theme !== 'dark'
  const amber = C.theme === 'light'
    ? '#A8C890'
    : tonedMode ? softPalette.consoleAmber : '#F0AE76'
  const axisFill = C.theme === 'light'
    ? '#6A8A58'
    : tonedMode ? softPalette.consoleFaint : CONSOLE.sequoia
  const cardBg = C.theme === 'light'
    ? 'radial-gradient(circle at 22% 10%, rgba(255,255,255,0.06), transparent 24%), radial-gradient(circle at 78% 0%, rgba(100, 160, 80, 0.08), transparent 28%), linear-gradient(180deg, #2E3E18 0%, #1A2A0A 100%)'
    : tonedMode ? softPalette.consoleBg : '#090505'
  const cardBorder = C.theme === 'light'
    ? '#4A6028'
    : tonedMode ? softPalette.consoleBorder : '#2F211E'
  const cardInk = C.theme === 'light'
    ? '#E8F0D8'
    : tonedMode ? softPalette.consoleInk : PALETTE.platinum
  const cardSoft = C.theme === 'light'
    ? '#B8D098'
    : tonedMode ? softPalette.consoleSoft : CONSOLE.barberry
  const cardFaint = C.theme === 'light'
    ? '#8AAA70'
    : tonedMode ? softPalette.consoleFaint : CONSOLE.sequoia
  const cardShadow = C.theme === 'light'
    ? '0 44px 116px rgba(31, 54, 35, 0.3), 0 20px 48px rgba(31, 54, 35, 0.2), 0 0 0 1px rgba(74, 102, 40, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)'
    : C.theme === 'dark'
      ? '0 28px 72px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(74, 49, 43, 0.2)'
      : '0 24px 60px rgba(8, 18, 34, 0.24)'
  const cardGlow = C.theme === 'dark'
    ? 'radial-gradient(circle at 50% 42%, rgba(90, 63, 58, 0.18), transparent 62%)'
    : C.theme === 'light'
      ? 'radial-gradient(circle at 50% 40%, rgba(79, 102, 66, 0.16), transparent 58%), radial-gradient(circle at 50% 42%, rgba(200, 220, 180, 0.22), transparent 76%)'
      : 'none'
  const chartTopOpacity = C.theme === 'light' ? '0.38' : '0.28'
  const chartBottomOpacity = C.theme === 'light' ? '0.06' : '0.02'

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
          <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 28 }}>
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

        {/* ── Right: knowledge card ── */}
        <div style={{ position: 'relative' }}>
          {cardGlow !== 'none' && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: '-34px -32px',
                background: cardGlow,
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
          )}
          <div style={{ position: 'relative', zIndex: 1, background: cardBg, borderRadius: 14, overflow: 'hidden', border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}>
          {C.theme === 'light' && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 24%, rgba(255,255,255,0) 44%), radial-gradient(circle at 50% 32%, rgba(255,255,255,0.05), transparent 58%), radial-gradient(circle at 50% 120%, rgba(18,10,7,0.12), transparent 44%)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {/* Card header */}
          <div style={{ position: 'relative', zIndex: 3, padding: '28px 32px 12px' }}>
            <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: cardSoft, fontWeight: 600, marginBottom: 10 }}>
              Brain knowledge · over time
            </div>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: cardInk, lineHeight: 1.25 }}>
              It stops asking and starts telling.
            </div>
          </div>

          {/* SVG chart */}
          <div style={{ position: 'relative', zIndex: 3, padding: '8px 32px 4px' }}>
            <svg viewBox="0 0 560 228" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={amber} stopOpacity={chartTopOpacity} />
                  <stop offset="100%" stopColor={amber} stopOpacity={chartBottomOpacity} />
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
          <div style={{ position: 'relative', zIndex: 3, padding: '0 32px 28px' }}>
            {[
              { day: 'DAY 30', body: <>Catches a margin leak your CFO had written off as <em style={{ fontStyle: 'italic', color: amber }}>seasonality.</em></> },
              { day: 'DAY 60', body: <>Questions a senior hire <em style={{ fontStyle: 'italic', color: amber }}>before</em> you sign the offer. It was right to.</> },
              { day: 'DAY 90', body: <>Tells you what to do — <em style={{ fontStyle: 'italic', color: amber }}>before</em> you&apos;ve finished asking the question.</> },
            ].map(m => (
              <div key={m.day} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 16, alignItems: 'start', padding: '16px 0', borderTop: `1px solid ${cardBorder}` }}>
                <span style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 700, color: amber, letterSpacing: '0.08em', paddingTop: 2 }}>{m.day}</span>
                <span style={{ fontFamily: serif, fontSize: 16, color: cardSoft, lineHeight: 1.58 }}>{m.body}</span>
              </div>
            ))}
          </div>

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
  const redBorder = C.border2

  return (
    <section style={{ background: C.bg, padding: 'clamp(64px, 8vw, 130px) 0 clamp(48px, 6vw, 100px)' }}>
      <style>{`
        .fca-input::placeholder { color: ${C.inkFaint}; }
      `}</style>

      {/* Eyebrow */}
      <div style={{ textAlign: 'center', fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, marginBottom: 48 }}>
        — THE BUSINESS BRAIN · READY
      </div>

      {/* Begin. */}
      <div style={{ textAlign: 'center', lineHeight: 0.9, marginBottom: 40 }}>
        <span style={{ fontFamily: serif, fontSize: 'clamp(44px, 10vw, 132px)', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.035em', color: C.ink }}>Begin</span>
        <span style={{ fontFamily: serif, fontSize: 'clamp(44px, 10vw, 132px)', fontWeight: 600, fontStyle: 'italic', letterSpacing: '-0.035em', color: red }}>.</span>
      </div>

      {/* Subtitle */}
      <p style={{ textAlign: 'center', fontFamily: serif, fontSize: 'clamp(18px, 2.2vw, 26px)', fontStyle: 'italic', color: C.inkSoft, lineHeight: 1.5, margin: '0 0 64px' }}>
        Tell it what feels wrong. Get the truth in five minutes.
      </p>

      {/* Input bar */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ display: 'flex', border: `1px solid ${redBorder}`, borderRadius: 4, overflow: 'hidden', background: C.surface }}>
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
              color: C.theme === 'light' ? '#FFFFFF' : C.ink,
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
        <div style={{ textAlign: 'center', marginTop: 26, fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600 }}>
          FREE · NO ACCOUNT · BRUTALLY HONEST
        </div>
      </div>
    </section>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('sa-theme') || 'dark'
  })
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

    el.textContent = theme === 'sharp'
      ? `
        body {
          background-image:
            radial-gradient(circle at top, rgba(58, 115, 234, 0.12), transparent 36%),
            radial-gradient(circle at 85% 18%, rgba(137, 167, 226, 0.07), transparent 24%),
            linear-gradient(180deg, #122A47 0%, #0F2239 34%, #0a1627 100%);
          background-attachment: scroll;
          background-color: #0D1930;
        }
      `
      : `
        body {
          background-image: none;
          background-attachment: scroll;
          background-color: ${C.bg};
        }
      `

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
            OPERATIONAL DEBT DIAGNOSTICS
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
            Something is wrong. You can feel it. You just can&apos;t name it.
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
            At $1M revenue, operational debt absorbs $230,000 a year. We find it in 5 minutes.
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
            Tell it what feels wrong. Get the truth in five minutes.
          </p>

          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div className="sa-hero-bar" style={{
              display: 'flex',
              alignItems: 'center',
              background: C.surface3,
              border: `1px solid ${C.border2}`,
              borderRadius: 999,
              padding: '6px 6px 6px 24px',
              gap: 10,
              transition: 'border-color 0.2s',
            }}>
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
                  background: C.accent,
                  color: C.theme === 'light' ? '#FFFFFF' : C.ink,
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

      <section style={{ background: C.surface3, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...wrap, paddingTop: 22, paddingBottom: 22 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
            Connects to
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            {heroConnectorStrip.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  color: C.inkMuted,
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: item.bubbleBg,
                    color: item.bubbleColor,
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {item.bubble}
                </span>
                <span>{item.name}</span>
              </div>
            ))}
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
            <span>Most founders know something is off. Revenue feels stuck. The team is busy but nothing moves. Cash is tighter than the numbers suggest.</span>
            <br />
            <br />
            <span>
              That feeling has a name:
              <span style={{ color: C.redMuted }}> operational debt</span>.
            </span>
            <span style={{ color: C.inkFaint }}> It&apos;s not a management failure, it&apos;s an infrastructure failure.</span>
            <span> And it&apos;s absorbing 20-25% of your productive capacity every year.</span>
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
            <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 20 }}>
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
              <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
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
                <div key={item} style={{ fontFamily: serif, fontSize: 19, fontStyle: 'italic', color: C.inkMuted, padding: '22px 0', borderBottom: `1px solid ${C.border}` }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Right — SelfAudit card */}
            <div style={{ background: C.theme === 'sharp' ? C.surface3 : C.card, border: `1px solid ${C.theme === 'sharp' ? C.border2 : C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ fontFamily: 'inherit', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, padding: '20px 32px 16px', borderBottom: `1px solid ${C.border}` }}>
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
            <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 24 }}>
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
                <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accentText, fontWeight: 600, paddingTop: 5 }}>
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
            <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
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
            ].map(card => {
              const isLightCard = C.theme === 'light'
              return (
              <div key={card.domain} style={{
                background: C.card,
                border: `1px solid ${isLightCard ? '#CFC7BA' : C.border}`,
                borderRadius: isLightCard ? 18 : 12,
                padding: '28px 28px 32px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: isLightCard ? '0 20px 48px rgba(31, 54, 35, 0.08)' : 'none',
              }}>
                {/* Arrow icon */}
                <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.22 }}>
                  <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                    <path d="M3 15 L15 3 M6 3 H15 V12" stroke={C.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                    <span style={{ color: card.severityColor }}>{card.severity}</span>
                    <span style={{ color: C.inkFaint }}> · {card.domain}</span>
                  </div>
                  <div style={{ fontFamily: 'inherit', fontSize: 11, color: C.inkMuted, fontWeight: 500 }}>{card.meta}</div>
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
            )})}
          </div>

        </div>
      </section>

      {/* ── 11. Pricing ── */}
      <section style={{ background: C.bg, padding: 'clamp(56px, 7vw, 120px) 0', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 28px' }}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkMuted, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
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
                  <div style={{ fontFamily: 'inherit', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accentText, fontWeight: 700, marginBottom: 12 }}>
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
                    <div key={f} style={{ fontFamily: 'inherit', fontSize: 13, color: C.inkMuted, lineHeight: 1.5, fontWeight: 500 }}>{f}</div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSignUpWithPlan(p.plan)}
                  style={{
                    background: C.accent,
                    color: C.theme === 'light' ? '#FFFFFF' : C.ink,
                    border: 'none',
                    borderRadius: 999,
                    padding: '15px 24px',
                    fontFamily: 'inherit',
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
