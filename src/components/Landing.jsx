import React, { useState } from 'react'
import { usePostHog } from '@posthog/react'

const C = {
  bg: '#F8F7F4',
  ink: '#1A1A1A',
  inkSoft: '#4A4A4A',
  inkMuted: '#7A7A7A',
  accent: '#5C8D6E',
  accentDark: '#3F6B52',
  accentSoft: '#E6F0EA',
  border: '#E8E6E0',
  card: '#FFFFFF',
}

const serif = "'Playfair Display', Georgia, serif"

const wrap = { maxWidth: 1100, margin: '0 auto', padding: '0 32px' }

const sectionLabel = {
  textAlign: 'center', fontSize: 12, letterSpacing: 2,
  textTransform: 'uppercase', color: '#7A7A7A', marginBottom: 16, fontWeight: 500,
}

const h2Style = {
  fontFamily: serif, fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 700,
  lineHeight: 1.1, letterSpacing: '-1px', textAlign: 'center', marginBottom: 20,
}

const compareRows = [
  { dim: 'Time to insight',               s: 'Full-day event',      sBad: true,  c: '4–8 weeks',          cBad: true,  o: '5 minutes',    oGood: true },
  { dim: 'Personalized to your business', s: 'Generic frameworks',  sBad: true,  c: 'Yes',                cGood: true, o: 'Yes',          oGood: true },
  { dim: 'Covers every department',       s: 'Speaker-dependent',   sBad: true,  c: 'Usually one domain', cBad: true,  o: 'Every domain', oGood: true },
  { dim: 'Audits per month',              s: 'Once a year',         sBad: true,  c: 'Billed per session', cBad: true,  o: 'Unlimited',    oGood: true },
  { dim: 'Replaces a department hire',    s: 'No',                  sBad: true,  c: 'Partially',          cBad: true,  o: 'Yes',          oGood: true },
  { dim: 'Q&A depth',                     s: '2 minutes if lucky',  sBad: true,  c: 'Unlimited',          cGood: true, o: 'Unlimited',    oGood: true },
  { dim: 'Available right now',           s: 'Wait for next event', sBad: true,  c: 'Weeks to start',     cBad: true,  o: 'Instantly',    oGood: true },
]

const verdictCards = [
  {
    badge: 'Critical · Operations', badgeBg: '#FDE9E7', badgeColor: '#B84A3E',
    verdict: '"You\'re managing symptoms while your QC team burns thousands in preventable mistakes monthly because accountability doesn\'t exist."',
    industry: 'Manufacturing', time: '6 min', findings: '3 critical · 2 needs-work',
    fix: 'Performance accountability before any tech',
  },
  {
    badge: 'Critical · Strategy', badgeBg: '#FFF3E0', badgeColor: '#C68A2E',
    verdict: '"You\'re strangling your only revenue source by refusing to invest in the capacity to serve it properly."',
    industry: 'Service business', time: '5 min', findings: '4 critical',
    fix: 'Seasonal capital model, not AI tools',
  },
  {
    badge: 'Needs work · People', badgeBg: '#E6F0EA', badgeColor: '#3F6B52',
    verdict: '"This isn\'t a technology problem. It\'s a management problem you\'ve been paying to ignore."',
    industry: 'SaaS (25 employees)', time: '7 min', findings: '2 critical · 3 needs-work',
    fix: 'Replace two underperformers before automating',
  },
]

const pillars = [
  {
    title: "Questions you haven't thought to ask.",
    body: "Built on real consulting frameworks used by firms charging $500/hour. The audit drills down until it hits the real root cause — not the symptom you came in with.",
  },
  {
    title: 'Zero flattery. Zero bias.',
    body: "This isn't a chatbot trained to keep you happy. It's built to disagree with you when you're wrong. Expect to be challenged — even if you've been running things for years.",
  },
  {
    title: "Trained on how the best operate.",
    body: "Studied the playbooks of founders who scaled — how they grew, what they avoided, where they almost broke — and the patterns of businesses still figuring it out. You get the read someone three levels above you would give.",
  },
]

const recurringCards = [
  {
    num: '01',
    title: 'The Pricing Decision',
    quote: '"Should I raise prices? By how much? Will I lose the wrong customers?"',
    body: "Pressure-test the move against your margins, your competitive set, and your customer mix — before you announce anything.",
  },
  {
    num: '02',
    title: "The Hire You Can't Get Wrong",
    quote: '"Head of Sales or a sales hire? Senior or scrappy? Equity or salary-heavy?"',
    body: "Walk through the role, the timing, the comp structure. Get the read before you post the job.",
  },
  {
    num: '03',
    title: 'The Vendor / Tool Decision',
    quote: '"Is this $40K/yr platform actually worth it? Is there a cheaper version that does 80%?"',
    body: "Frameworks for evaluating build-vs-buy, switching costs, and the real ROI math vendors won't show you.",
  },
  {
    num: '04',
    title: 'The Quarter Reset',
    quote: '"What should I be focused on for the next 90 days?"',
    body: "A monthly or quarterly re-audit on a single domain. Track what's improved, what's regressed, and what to attack next.",
  },
  {
    num: '05',
    title: 'The Investor Conversation',
    quote: '"They\'re asking about my margins, my churn, my CAC. What\'s the honest read?"',
    body: "Pre-meeting prep that fractional CFOs charge $5K for. Know your numbers — and the questions behind the questions.",
  },
  {
    num: '06',
    title: 'The Gut Check',
    quote: '"I\'m about to make a big call. Tell me what I\'m not seeing."',
    body: "The one question every founder wishes they had a senior operator to ask. Now you have it on demand.",
  },
]

const triadCards = [
  {
    num: '1',
    title: 'When we say no.',
    body: 'Most of the time, the answer is no. A pricing problem is not an AI problem. A bad hire is not an AI problem. A broken sales process is not an AI problem. SelfAudit will name the real issue — even if it\'s less interesting than "deploy an agent."',
  },
  {
    num: '2',
    title: 'When we say yes.',
    body: 'When AI genuinely fits, you\'ll know exactly where: the specific workflow, the realistic ROI, and the order of operations. No vague "AI for ops." Real specifics — automate intake triage, save 14 hours a week, here\'s what it looks like.',
  },
  {
    num: '3',
    title: 'Why we can tell.',
    body: "SelfAudit has run audits across every domain and industry. It has seen what compounded for a 5-person agency and what wasted $200K at a 50-person firm. That pattern library is the difference between advice and judgment.",
  },
]

function Btn({ label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: hov ? C.accentDark : C.accent, color: 'white',
        padding: '16px 32px', borderRadius: 100,
        fontSize: 16, fontWeight: 500, border: 'none', cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {label} <span style={{ fontSize: 18 }}>→</span>
    </button>
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

      {/* Nav */}
      <nav style={{ padding: '24px 0', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer' }}
            onClick={handleLogoClick}
          >
            self<span style={{ color: C.accent, fontWeight: 500 }}>audit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Pricing
            </button>
            <button
              onClick={() => { window.location.hash = 'login' }}
              style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Sign in
            </button>
            {onSignUp && (
              <button
                onClick={() => onSignUp()}
                style={{ fontSize: 14, fontWeight: 600, color: 'white', background: C.accent, border: 'none', borderRadius: 100, padding: '8px 18px', cursor: 'pointer' }}
              >
                Create account
              </button>
            )}
            <div style={{ fontSize: 14, color: C.inkMuted }}>
              by{' '}
              <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
                Vnklo
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '120px 0 100px', textAlign: 'center' }}>
        <div style={wrap}>
          <h1 style={{
            fontFamily: serif, fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 700,
            lineHeight: 1.05, letterSpacing: '-2px',
            margin: '0 auto 28px', maxWidth: 880,
          }}>
            The advisor every founder<br />
            <em style={{ color: C.accent, fontStyle: 'italic', fontWeight: 500 }}>wishes they had.</em>
          </h1>
          <p style={{ fontSize: 19, color: C.inkSoft, maxWidth: 680, margin: '0 auto 24px' }}>
            Trained on how the best operate. Studied the playbooks of founders you read about — how they scaled, what they avoided, where they almost broke. Bring it any decision, any month: pricing, hiring, product, capital. Get the read someone three levels above you would give.
          </p>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 20, color: C.ink, maxWidth: 680, margin: '0 auto 40px' }}>
            On call. On your side. On a flat fee.
          </p>
          <Btn label="Start your free audit" onClick={handleAuditStart} />
          <div style={{ marginTop: 16, fontSize: 13, color: C.inkMuted }}>
            First audit free · 500+ businesses on retainer · Cancel anytime
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>The new math of advisory</div>
          <h2 style={h2Style}>Advisory used to require<br />a calendar invite.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 600, margin: '0 auto 64px' }}>
            Not anymore. Here&apos;s what it used to cost to get real business advice — and what it costs now.
          </p>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', borderBottom: `1px solid ${C.border}`, background: '#FAFAF7' }}>
              <div style={{ padding: 24 }} />
              {[
                { name: 'Seminar',    tag: '$1,500+ ticket',           color: C.ink },
                { name: 'Consultant', tag: '$15k to $150k engagement', color: C.ink },
                { name: 'SelfAudit', tag: 'From $49/mo',              color: C.accent },
              ].map((col, i) => (
                <div key={i} style={{ padding: 24, borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', color: col.color }}>{col.name}</div>
                  <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 400, marginTop: 4 }}>{col.tag}</div>
                </div>
              ))}
            </div>
            {compareRows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', borderBottom: i < compareRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '20px 24px', fontSize: 14, fontWeight: 600, background: '#FAFAF7', display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.border}` }}>
                  {row.dim}
                </div>
                <div style={{ padding: '20px 24px', fontSize: 15, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.border}`, color: row.sBad ? C.inkMuted : (row.sGood ? C.accent : C.ink), fontWeight: row.sGood ? 600 : 400 }}>
                  {row.s}
                </div>
                <div style={{ padding: '20px 24px', fontSize: 15, display: 'flex', alignItems: 'center', borderRight: `1px solid ${C.border}`, color: row.cBad ? C.inkMuted : (row.cGood ? C.accent : C.ink), fontWeight: row.cGood ? 600 : 400 }}>
                  {row.c}
                </div>
                <div style={{ padding: '20px 24px', fontSize: 15, display: 'flex', alignItems: 'center', color: row.oGood ? C.accent : C.inkMuted, fontWeight: row.oGood ? 600 : 400 }}>
                  {row.o}
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 48, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft }}>
            You don&apos;t need another seminar. You need an advisor on retainer.
          </p>
        </div>
      </section>

      {/* Verdicts */}
      <section style={{ padding: '100px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Real verdicts</div>
          <h2 style={h2Style}>This is what you get.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 600, margin: '0 auto 64px' }}>
            No &ldquo;leverage synergies.&rdquo; Real diagnoses in plain English.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {verdictCards.map((card, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600,
                  marginBottom: 20, padding: '4px 10px', borderRadius: 4,
                  display: 'inline-block', alignSelf: 'flex-start',
                  background: card.badgeBg, color: card.badgeColor,
                }}>
                  {card.badge}
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.3px', marginBottom: 24, color: C.ink, flex: 1 }}>
                  {card.verdict}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[['Industry', card.industry], ['Audit time', card.time], ['Findings', card.findings]].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: C.inkMuted, fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: 500, color: C.ink, fontSize: 14 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: '#FAFAF7', borderRadius: 8, fontSize: 13, color: C.inkSoft }}>
                  <strong style={{ color: C.ink }}>Fix first:</strong> {card.fix}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <Btn label="See what yours says" onClick={handleAuditStart} />
          </div>
        </div>
      </section>

      {/* What founders bring back */}
      <section style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>What founders bring back</div>
          <h2 style={h2Style}>The audit is just<br />the first session.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 64px' }}>
            Your business doesn&apos;t pause between audits. Neither should your advisor.<br />
            Here&apos;s what SelfAudit gets used for after the diagnosis.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1040, margin: '0 auto' }}>
            {recurringCards.map((card, i) => (
              <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, color: C.accent, marginBottom: 16 }}>{card.num}</div>
                <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 16px', lineHeight: 1.2 }}>{card.title}</h3>
                <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: C.accentDark, marginBottom: 16, lineHeight: 1.4 }}>{card.quote}</div>
                <p style={{ fontSize: 14, color: C.inkSoft, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 56, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft }}>
            Same flat fee. Same depth. Every time.
          </p>
        </div>
      </section>

      {/* Domains */}
      <section style={{ padding: '100px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>Coverage</div>
          <h2 style={h2Style}>Whatever&apos;s broken —<br />we&apos;ll find it.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 600, margin: '0 auto 64px' }}>
            From the top of the org chart to the bottom. From finance to feelings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {['SaaS', 'E-commerce', 'Agency', 'Law firm', 'Healthcare', 'Real estate', 'Manufacturing', 'Consulting', 'Logistics', 'Restaurant & hospitality', 'Education', 'Media & content', 'Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & HR', 'Product', 'Customer experience', 'Technology', 'Legal & compliance', 'Pricing', 'Supply chain', 'Brand'].map(d => (
              <span key={d} style={{ background: C.card, border: `1px solid ${C.border}`, padding: '10px 20px', borderRadius: 100, fontSize: 14, fontWeight: 500, color: C.inkSoft }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>Why this works</div>
          <h2 style={h2Style}>Why this beats<br />free AI advice.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, maxWidth: 1000, margin: '64px auto 0' }}>
            {pillars.map((p, i) => (
              <div key={i}>
                <div style={{ color: C.accent, fontSize: 20, marginBottom: 16 }}>→</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.3px' }}>{p.title}</h3>
                <p style={{ color: C.inkSoft, fontSize: 15 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Most "AI strategies" are wishful thinking */}
      <section style={{ padding: '100px 0', background: C.bg }}>
        <div style={wrap}>
          <div style={sectionLabel}>The AI question, answered honestly</div>
          <h2 style={h2Style}>Most &ldquo;AI strategies&rdquo; are<br />wishful thinking.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 640, margin: '0 auto 64px' }}>
            Every audit ends with the same honest read: of everything we found, where would AI actually move the needle — and where is it just expensive theater? Most consultants won&apos;t answer this. Most AI tools can&apos;t. SelfAudit will.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, maxWidth: 1040, margin: '0 auto' }}>
            {triadCards.map((card, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 100, background: C.accentSoft, color: C.accentDark,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: serif, fontSize: 18, fontWeight: 700, marginBottom: 20, flexShrink: 0,
                }}>
                  {card.num}
                </div>
                <h3 style={{ fontFamily: serif, fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 16px', lineHeight: 1.2 }}>{card.title}</h3>
                <p style={{ fontSize: 15, color: C.inkSoft, margin: 0 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 56, fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: C.inkSoft, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            You&apos;ll leave knowing exactly which problems deserve AI — and which ones deserve a manager, a process, or a hard conversation.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>Pricing</div>
          <h2 style={h2Style}>The advisor who never sugarcoats.<br />Never bills by the hour.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1040, margin: '64px auto 0' }}>

            {/* Essential */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>Essential</div>
              <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 20, lineHeight: 1.5 }}>One domain on retainer. Unlimited audits. Your dedicated department head.</div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, letterSpacing: '-1px', color: C.ink, lineHeight: 1 }}>
                $49<span style={{ fontSize: 18, fontWeight: 500, color: C.inkMuted }}>/mo</span>
              </div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, marginBottom: 28 }}>&nbsp;</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['1 industry, 1 domain', 'Unlimited audits on that domain', 'Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'Email delivery'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSignUpWithPlan('essential')}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: C.ink, border: `1px solid ${C.border}`, transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EDECEA'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Start with Essential
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.inkMuted, marginTop: 12 }}>First audit free</div>
            </div>

            {/* Business */}
            <div style={{ background: C.card, border: `2px solid ${C.accent}`, borderRadius: 16, padding: 36, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 12px 40px rgba(92,141,110,0.12)' }}>
              <div style={{ position: 'absolute', top: -13, right: 24, background: C.accent, color: 'white', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 100 }}>
                Most popular
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>Business</div>
              <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 20, lineHeight: 1.5 }}>Your whole company on retainer. Every function, fully audited. No blind spots.</div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, letterSpacing: '-1px', color: C.ink, lineHeight: 1 }}>
                $99<span style={{ fontSize: 18, fontWeight: 500, color: C.inkMuted }}>/mo</span>
              </div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, marginBottom: 28 }}>&nbsp;</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Everything in Essential, plus:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['All domains for your industry — no blind spots', 'AI opportunity breakdown', 'Re-audit anytime — track improvement over time'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSignUpWithPlan('business')}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', background: C.accent, color: 'white', border: 'none', transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}
              >
                Get full access
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.inkMuted, marginTop: 12 }}>First audit free</div>
            </div>

            {/* Portfolio */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>Portfolio</div>
              <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 20, lineHeight: 1.5 }}>Every industry. Every domain. Built for those who operate at scale.</div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, letterSpacing: '-1px', color: C.ink, lineHeight: 1 }}>
                $299<span style={{ fontSize: 18, fontWeight: 500, color: C.inkMuted }}>/mo</span>
              </div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, marginBottom: 28 }}>&nbsp;</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Everything in Business, plus:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['All industries, all domains — audit any business type', 'Run audits across multiple businesses', 'First access to new features', 'Priority access to Vnklo AI implementation'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSignUpWithPlan('portfolio')}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: C.ink, border: `1px solid ${C.border}`, transition: 'background 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EDECEA'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Start with Portfolio
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: C.inkMuted, marginTop: 12 }}>First audit free</div>
            </div>

          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ background: C.bg, textAlign: 'center', padding: '120px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style}>Stop guessing.<br />Get a diagnosis.</h2>
          <p style={{ fontSize: 19, color: C.inkSoft, maxWidth: 540, margin: '0 auto 40px' }}>
            Whatever&apos;s broken, it has a name. In 5 minutes you&apos;ll know what it is — and what to do about it.
          </p>
          <Btn label="Run my audit" onClick={handleAuditStart} />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.ink, color: '#B8B6B0', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>
        <div style={wrap}>
          Built by{' '}
          <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: C.accentSoft, textDecoration: 'none', fontWeight: 500 }}>
            Vnklo
          </a>{' '}
          — we build AI systems for businesses that actually need them.<br />
          If your audit surfaces real AI opportunities, we can help you implement.
        </div>
      </footer>

      {/* Floating social proof pill */}
      <div style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 50,
        background: C.ink, color: '#F8F7F4',
        padding: '10px 18px', borderRadius: 100,
        fontSize: 13, fontWeight: 500,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}>
        ✦ 500+ audits completed
      </div>

    </div>
  )
}
