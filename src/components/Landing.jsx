import React, { useState } from 'react'
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

const compareRows = [
  { dim: 'Time to insight', s: 'Full-day event', c: '4-8 weeks', o: '5 minutes', oGood: true },
  { dim: 'Personalized to your business', s: 'Generic frameworks', c: 'Yes', o: 'Yes', cGood: true, oGood: true },
  { dim: 'Covers every department', s: 'Speaker-dependent', c: 'Usually one domain', o: 'Every domain', oGood: true },
  { dim: 'Audits per month', s: 'Once a year', c: 'Billed per session', o: 'Unlimited', oGood: true },
  { dim: 'Replaces a department hire', s: 'No', c: 'Partially', o: 'Yes', oGood: true },
  { dim: 'Q&A depth', s: '2 minutes if lucky', c: 'Unlimited', o: 'Unlimited', cGood: true, oGood: true },
  { dim: 'Available right now', s: 'Wait for next event', c: 'Weeks to start', o: 'Instantly', oGood: true },
]

const verdictCards = [
  {
    badge: 'Critical · Operations',
    badgeBg: '#1A0A0A',
    badgeColor: '#C05050',
    verdict: '"You\'re managing symptoms while your QC team burns thousands in preventable mistakes monthly because accountability doesn\'t exist."',
    industry: 'Manufacturing',
    time: '6 min',
    findings: '3 critical · 2 needs-work',
    fix: 'Performance accountability before any tech',
  },
  {
    badge: 'Critical · Strategy',
    badgeBg: '#1A1508',
    badgeColor: '#C9A040',
    verdict: '"You\'re strangling your only revenue source by refusing to invest in the capacity to serve it properly."',
    industry: 'Service business',
    time: '5 min',
    findings: '4 critical',
    fix: 'Seasonal capital model, not AI tools',
  },
  {
    badge: 'Needs work · People',
    badgeBg: '#0A1A10',
    badgeColor: '#4A9E6B',
    verdict: '"This isn\'t a technology problem. It\'s a management problem you\'ve been paying to ignore."',
    industry: 'SaaS (25 employees)',
    time: '7 min',
    findings: '2 critical · 3 needs-work',
    fix: 'Replace two underperformers before automating',
  },
]

const pillars = [
  {
    title: "Questions you haven't thought to ask.",
    body: 'Built on real consulting frameworks used by firms charging serious money. The audit drills down until it hits the real root cause, not the symptom you came in with.',
  },
  {
    title: 'Zero flattery. Zero bias.',
    body: "This isn't a chatbot trained to keep you comfortable. It will disagree with you when you're wrong and name the thing you're avoiding.",
  },
  {
    title: 'Trained on how the best operate.',
    body: 'Studied the playbooks of founders who scaled, the mistakes that stalled them, and the patterns of businesses still guessing. That pattern recognition is the edge.',
  },
]

const triadCards = [
  {
    num: '1',
    title: 'When we say no.',
    body: 'Most of the time, the answer is no. A pricing problem is not an AI problem. A bad hire is not an AI problem. A broken sales process is not an AI problem. SelfAudit will name the real issue, even if it is less interesting than "deploy an agent."',
  },
  {
    num: '2',
    title: 'When we say yes.',
    body: 'When AI genuinely fits, you will know exactly where: the workflow, the likely ROI, and the order of operations. No vague "AI for ops." Real specifics.',
  },
  {
    num: '3',
    title: 'Why we can tell.',
    body: 'SelfAudit has run audits across industries and functions. It has seen what compounded for a 5-person agency and what wasted six figures at a 50-person firm. That pattern library is the difference between advice and judgment.',
  },
]

const freeFeatures = [
  'Root cause diagnosis',
  '6-10 question deep audit conversation',
  'Multi-domain coverage',
  'Industry-specific questioning (40+ industries)',
  'Goal gap analysis',
  'Timeline feasibility assessment',
  'Ranked priority actions',
  'Non-AI fixes identified first',
  'AI opportunity breakdown',
  'Honest truth summary',
  'Report download (HTML)',
  'Share report with Vnklo',
]

const freeLimitations = [
  'No memory between audits',
  'No business health score',
  'No goal tracking',
  'No intelligence brief',
  'No file upload or financial metrics',
  'No pattern intelligence',
  'No execution outputs',
  'No dashboard',
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

function FeatureList({ items, color = C.inkSoft, iconColor = C.accentText, icon = '✓', muted = false }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {items.map((item) => (
        <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color, fontSize: 14, opacity: muted ? 0.78 : 1 }}>
          <span style={{ color: iconColor, flexShrink: 0, fontWeight: 700, lineHeight: 1.5 }}>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Landing({ onStart, onSignUp, session }) {
  const posthog = usePostHog()

  const handleAuditStart = () => {
    posthog?.capture('audit_started', { source: 'landing' })
    onStart()
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

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.ink, lineHeight: 1.6, minHeight: '100vh' }}>
      <nav style={{ padding: '22px 0', borderBottom: `1px solid ${C.border}`, background: 'rgba(10,10,10,0.96)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer', color: C.ink }} onClick={handleLogoClick}>
            self<span style={{ color: C.accentText, fontWeight: 500 }}>audit</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Pricing
            </button>
            <button
              onClick={() => { window.location.hash = 'login' }}
              style={{ fontSize: 14, color: C.inkMuted, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Sign in
            </button>
            <PrimaryButton label="Start free audit" onClick={handleAuditStart} small />
            <div style={{ fontSize: 14, color: C.inkMuted }}>
              by{' '}
              <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accentText, textDecoration: 'none', fontWeight: 500 }}>
                Vnklo
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section style={{ padding: '112px 0 92px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(107,92,231,0.18), transparent 34%)' }}>
        <div style={wrap}>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(42px, 6vw, 74px)', fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.05em', margin: '0 auto 24px', maxWidth: 900, color: C.ink }}>
            Most founders are making decisions on gut feel.
            <br />
            SelfAudit gives you the diagnosis.
          </h1>

          <p style={{ fontSize: 20, color: C.inkSoft, maxWidth: 640, margin: '0 auto 34px' }}>
            Deep diagnosis. Ranked priorities. No consultant invoice.
          </p>

          <PrimaryButton label="Start your free audit — no account needed" onClick={handleAuditStart} />

          <div style={{ marginTop: 16, fontSize: 13, color: C.inkMuted }}>
            5 minutes. No account needed. Brutally honest.
          </div>
        </div>
      </section>

      <section id="comparison" style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>The new math of advisory</div>
          <h2 style={h2Style}>Advisory used to require a calendar invite.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 56px' }}>
            Here&apos;s what most founders are still doing to get answers, and what the faster version looks like.
          </p>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', maxWidth: 1040, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', borderBottom: `1px solid ${C.border}`, background: C.surface2 }}>
              <div style={{ padding: 22 }} />
              <div style={{ padding: 22, borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>What you&apos;re doing now</div>
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 4 }}>Seminars, advisors, paid sessions, waiting</div>
              </div>
              <div style={{ padding: 22, borderLeft: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.accentText }}>SelfAudit</div>
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 4 }}>Direct diagnosis, immediately</div>
              </div>
            </div>

            {compareRows.map((row, index) => (
              <div key={row.dim} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', borderBottom: index < compareRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '18px 22px', fontSize: 14, fontWeight: 600, background: C.surface2, color: C.ink, borderRight: `1px solid ${C.border}` }}>
                  {row.dim}
                </div>
                <div style={{ padding: '18px 22px', fontSize: 14, color: C.inkMuted, borderRight: `1px solid ${C.border}` }}>
                  <div>{row.s}</div>
                  <div style={{ color: row.cGood ? C.accentText : C.inkMuted, fontWeight: row.cGood ? 600 : 400, marginTop: 3 }}>{row.c}</div>
                </div>
                <div style={{ padding: '18px 22px', fontSize: 14, color: row.oGood ? C.accentText : C.inkMuted, fontWeight: row.oGood ? 600 : 400 }}>
                  {row.o}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Real verdicts</div>
          <h2 style={h2Style}>This is what you get.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 620, margin: '0 auto 56px' }}>
            No vague frameworks. No strategy perfume. Real diagnoses in plain English.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {verdictCards.map((card) => (
              <div key={card.verdict} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 20, padding: '4px 10px', borderRadius: 999, display: 'inline-block', alignSelf: 'flex-start', background: card.badgeBg, color: card.badgeColor }}>
                  {card.badge}
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 22, color: C.ink, flex: 1 }}>
                  {card.verdict}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['Industry', card.industry], ['Audit time', card.time], ['Findings', card.findings]].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: C.inkMuted, fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: 500, color: C.ink, fontSize: 14, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: C.surface2, borderRadius: 10, fontSize: 13, color: C.inkSoft }}>
                  <strong style={{ color: C.ink }}>Fix first:</strong> {card.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>Coverage</div>
          <h2 style={h2Style}>Whatever&apos;s broken, we&apos;ll find it.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 620, margin: '0 auto 56px' }}>
            From pricing to people, from strategy to execution, across 40+ industries.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 860, margin: '0 auto' }}>
            {['SaaS', 'E-commerce', 'Agency', 'Law firm', 'Healthcare', 'Real estate', 'Manufacturing', 'Consulting', 'Logistics', 'Restaurant & hospitality', 'Education', 'Media & content', 'Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & HR', 'Product', 'Customer experience', 'Technology', 'Legal & compliance', 'Pricing', 'Supply chain', 'Brand'].map((item) => (
              <span key={item} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '10px 18px', borderRadius: 999, fontSize: 14, fontWeight: 500, color: C.inkSoft }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Why this works</div>
          <h2 style={h2Style}>Why this beats free AI advice.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 34, maxWidth: 1040, margin: '56px auto 0' }}>
            {pillars.map((pillar) => (
              <div key={pillar.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ color: C.accentText, fontSize: 20, marginBottom: 16 }}>→</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.02em', color: C.ink }}>{pillar.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 15, margin: 0 }}>{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: C.surface }}>
        <div style={wrap}>
          <div style={sectionLabel}>The AI question, answered honestly</div>
          <h2 style={h2Style}>Most &ldquo;AI strategies&rdquo; are wishful thinking.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 680, margin: '0 auto 60px' }}>
            Every audit ends with the same honest read: where would AI actually move the needle, and where is it just expensive theater? Most consultants won&apos;t answer this. Most AI tools can&apos;t. SelfAudit will.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, maxWidth: 1040, margin: '0 auto' }}>
            {triadCards.map((card) => (
              <div key={card.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 30, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentSoft, color: C.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontSize: 18, fontWeight: 700, marginBottom: 18, flexShrink: 0 }}>
                  {card.num}
                </div>
                <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2, color: C.ink }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: C.inkSoft, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 52, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            You&apos;ll leave knowing exactly which problems deserve AI, and which ones deserve a manager, a process, or a hard conversation.
          </p>
        </div>
      </section>

      <section id="pricing" style={{ padding: '100px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Pricing</div>
          <h2 style={h2Style}>Two modes. One decision.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 700, margin: '0 auto 60px' }}>
            Start free. Upgrade when you need memory, execution, and intelligence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Free</div>
              <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 700, color: C.ink, marginBottom: 10 }}>Business Audit</div>
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', color: C.ink, lineHeight: 1 }}>
                $0
              </div>

              <div style={{ marginTop: 24, marginBottom: 18 }}>
                <FeatureList items={freeFeatures} />
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, marginTop: 4 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.redMuted, marginBottom: 14 }}>
                  What you do not get
                </div>
                <FeatureList items={freeLimitations} color={C.redMuted} iconColor={C.redMuted} icon="×" muted />
              </div>

              <div style={{ marginTop: 28 }}>
                <OutlineButton label="Start free audit" onClick={handleAuditStart} />
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>One audit. No account needed.</div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid rgba(107,92,231,0.6)`, boxShadow: '0 18px 50px rgba(107,92,231,0.14)', borderRadius: 18, padding: 32, display: 'flex', flexDirection: 'column', position: 'relative' }}>
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

              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accentText, marginBottom: 14 }}>
                Everything in Free, plus:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                <div>
                  <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 10 }}>Intelligence Layer</div>
                  <FeatureList items={growthIntelligence} iconColor={C.accentText} />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                  <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 10 }}>Execution Outputs</div>
                  <FeatureList items={growthExecution} iconColor={C.accentText} />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                  <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 10 }}>Dashboard &amp; Command Centre</div>
                  <FeatureList items={growthDashboard} iconColor={C.accentText} />
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
                  <div style={{ fontFamily: serif, fontSize: 20, color: C.ink, marginBottom: 10 }}>Integrations &amp; Notifications</div>
                  <FeatureList items={growthIntegrations} iconColor={C.accentText} />
                </div>
              </div>

              <div style={{ marginTop: 28 }}>
                <PrimaryButton label="Start Growth OS — $99/mo" onClick={() => handleSignUpWithPlan('business')} />
                <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>Cancel anytime. No contracts.</div>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 34, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            Your competitors aren&apos;t smarter. They just have better data on their own business.
          </p>
        </div>
      </section>

      <section style={{ background: C.surface, textAlign: 'center', padding: '110px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style}>Stop guessing. Get a diagnosis.</h2>
          <div style={{ marginTop: 28 }}>
            <PrimaryButton label="Start your free audit" onClick={handleAuditStart} />
          </div>
          <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 14 }}>
            5 minutes. No account needed. Brutally honest.
          </div>
        </div>
      </section>

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
