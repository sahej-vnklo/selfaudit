import React, { useState } from 'react'

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
  { dim: 'Time to insight',              s: 'Full-day event',      sBad: true,  c: '4–8 weeks',          cBad: true,  o: '5 minutes',    oGood: true },
  { dim: 'Personalized to your business', s: 'Generic frameworks', sBad: true,  c: 'Yes',                cGood: true, o: 'Yes',          oGood: true },
  { dim: 'Covers every department',       s: 'Speaker-dependent',  sBad: true,  c: 'Usually one domain', cBad: true,  o: 'Every domain', oGood: true },
  { dim: "Will say AI isn't the answer",  s: 'Rarely',             sBad: true,  c: 'Rarely',             cBad: true,  o: 'Always',       oGood: true },
  { dim: 'Q&A depth',                     s: '2 minutes if lucky', sBad: true,  c: 'Unlimited',          cGood: true, o: 'Unlimited',    oGood: true },
  { dim: 'Available right now',           s: 'Wait for next event',sBad: true,  c: 'Weeks to start',     cBad: true,  o: 'Instantly',    oGood: true },
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
    title: "Tells you when AI isn't the answer.",
    body: "Sometimes it's a process problem, a people problem, a cash-flow problem. We'll name it directly. Built by an AI consultancy that would rather lose the sale than recommend something you don't need.",
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

const HOW_STEPS = [
  { num: '01', title: 'Give context', desc: 'Optional. Your business type, size, and situation.' },
  { num: '02', title: 'Describe your problem', desc: 'What feels broken, stuck, or unclear.' },
  { num: '03', title: 'Answer 5–7 questions', desc: 'The audit drills in. No fluff, no filler.' },
  { num: '04', title: 'Get your report', desc: 'A ruthless diagnosis and exactly what to do next.' },
]

export default function Landing({ onStart }) {
  const [howOpen, setHowOpen] = useState(false)

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: C.bg, color: C.ink, lineHeight: 1.6, minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ padding: '24px 0', borderBottom: `1px solid ${C.border}`, background: C.bg, position: 'relative' }}>
        <div style={{ ...wrap, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            self<span style={{ color: C.accent, fontWeight: 500 }}>audit</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* How it works */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setHowOpen(o => !o)}
                style={{ fontSize: 14, color: howOpen ? C.accent : C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                How it works
                <span style={{ fontSize: 10, display: 'inline-block', transform: howOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▾</span>
              </button>
              <div style={{
                position: 'absolute', top: 'calc(100% + 16px)', left: '50%',
                transform: howOpen ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
                opacity: howOpen ? 1 : 0,
                pointerEvents: howOpen ? 'auto' : 'none',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '8px 0', width: 340, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              }}>
                {HOW_STEPS.map((step, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: i < HOW_STEPS.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.5px', minWidth: 20, paddingTop: 2 }}>{step.num}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{step.title}</div>
                      <div style={{ fontSize: 13, color: C.inkMuted }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing scroll */}
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Pricing
            </button>

            {/* Sign in */}
            <button
              onClick={() => { window.location.hash = 'login' }}
              style={{ fontSize: 14, color: C.inkSoft, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
            >
              Sign in
            </button>

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
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: C.accentSoft, color: C.accentDark,
            padding: '8px 16px', borderRadius: 100,
            fontSize: 13, fontWeight: 500, marginBottom: 32,
          }}>
            &ldquo;Advisory like never seen before&rdquo;
          </div>
          <h1 style={{
            fontFamily: serif, fontSize: 'clamp(40px, 6vw, 68px)', fontWeight: 700,
            lineHeight: 1.05, letterSpacing: '-2px',
            marginBottom: 28, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto',
          }}>
            The business audit that<br />
            <em style={{ color: C.accent, fontStyle: 'italic', fontWeight: 500 }}>actually tells you the truth.</em>
          </h1>
          <p style={{ fontSize: 19, color: C.inkSoft, maxWidth: 620, margin: '0 auto 40px' }}>
            5 minutes. Every department. Every blind spot. A ruthless diagnostic of what&apos;s broken in your business — and exactly what to do about it.
          </p>
          <Btn label="Start your free audit" onClick={onStart} />
          <div style={{ marginTop: 16, fontSize: 13, color: C.inkMuted }}>
            No signup · No credit card · First audit free
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
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', borderBottom: `1px solid ${C.border}`, background: '#FAFAF7' }}>
              <div style={{ padding: 24 }} />
              {[
                { name: 'Seminar',    tag: '$1,500+ ticket',            color: C.ink },
                { name: 'Consultant', tag: '$15k to $150k engagement',  color: C.ink },
                { name: 'SelfAudit', tag: 'Free to start',             color: C.accent },
              ].map((col, i) => (
                <div key={i} style={{ padding: 24, borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', color: col.color }}>{col.name}</div>
                  <div style={{ fontSize: 12, color: C.inkMuted, fontWeight: 400, marginTop: 4 }}>{col.tag}</div>
                </div>
              ))}
            </div>
            {/* Rows */}
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
            You don&apos;t need another seminar. You need a diagnosis.
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
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 8, color: C.inkSoft }}>
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
            <Btn label="See what yours says" onClick={onStart} />
          </div>
        </div>
      </section>

      {/* Domains */}
      <section style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>Coverage</div>
          <h2 style={h2Style}>Whatever&apos;s broken —<br />we&apos;ll find it.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 600, margin: '0 auto 64px' }}>
            From the top of the org chart to the bottom. From finance to feelings.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {['Business strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & culture', 'Product', 'Customer experience', 'Leadership', 'Anything else'].map(d => (
              <span key={d} style={{ background: C.bg, border: `1px solid ${C.border}`, padding: '10px 20px', borderRadius: 100, fontSize: 14, fontWeight: 500, color: C.inkSoft }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section style={{ padding: '100px 0', background: C.bg }}>
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

      {/* Pricing */}
      <section id="pricing" style={{ padding: '100px 0', background: C.card }}>
        <div style={wrap}>
          <div style={sectionLabel}>Pricing</div>
          <h2 style={h2Style}>Pay what a decent coffee costs.<br />Get what a $15k consultant would tell you.</h2>
          <p style={{ textAlign: 'center', fontSize: 18, color: C.inkSoft, maxWidth: 540, margin: '0 auto 64px' }}>
            Your first audit is always free — no account needed. Come back for more.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 760, margin: '0 auto' }}>
            {/* Free card */}
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 36, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.inkMuted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 20 }}>Free</div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, letterSpacing: '-1px', color: C.ink, lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, marginBottom: 28 }}>No account needed</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['1 domain per audit', 'Surface level report', 'Short verdict — useful, not complete'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: C.ink, border: `1px solid ${C.border}`, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Start free audit
              </button>
            </div>

            {/* Pro card */}
            <div style={{ background: C.card, border: `2px solid ${C.accent}`, borderRadius: 16, padding: 36, display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: `0 12px 40px rgba(92,141,110,0.12)` }}>
              <div style={{ position: 'absolute', top: -13, right: 24, background: C.accent, color: 'white', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 100 }}>
                Most popular
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 20 }}>Pro</div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, letterSpacing: '-1px', color: C.ink, lineHeight: 1 }}>$19<span style={{ fontSize: 18, fontWeight: 500, color: C.inkMuted }}>/mo</span></div>
              <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, marginBottom: 28 }}>or $199/year — save 2 months</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['All domains covered', 'Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'AI vs non-AI breakdown', 'Email delivery', 'Re-audit to track progress'].map(f => (
                  <li key={f} style={{ fontSize: 14, color: C.inkSoft, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: C.accent, fontWeight: 600, flexShrink: 0 }}>→</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', background: C.accent, color: 'white', border: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDark}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}
              >
                Get full access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ background: C.bg, textAlign: 'center', padding: '120px 0' }}>
        <div style={wrap}>
          <h2 style={h2Style}>Stop guessing.<br />Get a diagnosis.</h2>
          <p style={{ fontSize: 19, color: C.inkSoft, maxWidth: 500, margin: '0 auto 40px' }}>
            Whatever&apos;s broken, it has a name. In 5 minutes you&apos;ll know what it is — and what to do about it.
          </p>
          <Btn label="Run my audit" onClick={onStart} />
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

    </div>
  )
}
