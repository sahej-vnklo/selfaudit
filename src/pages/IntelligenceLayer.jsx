import React from 'react'
import './UseCases.css'
import './IntelligenceLayer.css'

const COMPONENTS = [
  {
    name: 'Memory',
    body: 'Every decision made. Every finding surfaced. Every pattern that appeared and how it resolved. The intelligence layer builds a private operating memory of your business — specific to how your company breaks, recovers, and grows. It gets harder to replicate the longer it runs.',
  },
  {
    name: 'Diagnosis',
    body: 'Not what\'s wrong. Why it\'s wrong. The diagnosis layer traces cause across departments, vendors, timelines, and decisions. A support spike that traces to a product feature. A margin gap that traces to a scope handoff no one owns. The chain, not just the symptom.',
  },
  {
    name: 'Synthesis',
    body: 'HubSpot knows your pipeline. Stripe knows your revenue. Zendesk knows your tickets. None of them know how those three connect. Synthesis reads across all of them simultaneously — finding the patterns that only exist in the space between your tools.',
  },
  {
    name: 'Governance',
    body: 'You define what good looks like. Response under 4 hours. Margin above 60%. Pipeline with 10+ active deals. The governance layer watches your thresholds — not industry benchmarks — and flags the moment your operation drifts from your own standard.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function IntelligenceLayer({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">The Intelligence Layer</div>
      </nav>

      {/* HERO */}
      <section className="uc-hero">
        <div className="uc-area-tag">Platform</div>
        <h1 className="uc-h1">The brain<br />underneath<br /><em>your business.</em></h1>
        <p className="uc-intro">
          SelfAudit is not a tool you use. It's an intelligence layer your business runs on — continuously processing signals, building memory, and surfacing what matters before you think to ask.
        </p>
      </section>

      <div className="uc-rule" />

      {/* WHAT IT IS */}
      <section className="il-concept">
        <div className="il-concept-inner">
          <h2 className="uc-h2">It doesn't replace your tools.<br />It connects what they can't.</h2>
          <div className="il-concept-body">
            <p className="uc-body">
              HubSpot, Stripe, Zendesk, Slack — they each know one part of your business. They do their job well. But none of them know how the three connect. None of them can tell you that the support spike this week traces back to the sales rep who closed a bad-fit deal last month.
            </p>
            <p className="uc-body">
              The intelligence layer sits underneath all of it. It reads what every tool knows, connects what none of them see alone, and builds a continuously updated picture of your entire operation — not a domain at a time.
            </p>
          </div>
        </div>
      </section>

      {/* FOUR COMPONENTS */}
      <section className="il-components">
        <div className="il-components-inner">
          <div className="uc-signals-eyebrow">What it's made of</div>
          <h2 className="uc-h2">Four layers. One operating system.</h2>
          <div className="il-components-grid">
            {COMPONENTS.map(c => (
              <div className="il-component-card" key={c.name}>
                <div className="il-component-name">{c.name}</div>
                <p className="il-component-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY IT COMPOUNDS */}
      <section className="il-compounds">
        <div className="il-compounds-inner">
          <div className="il-compounds-copy">
            <h2 className="uc-h2">Unlike a tool you query — it compounds.</h2>
            <p className="uc-body">
              Every audit sharpens the next diagnosis. Every pattern recognised makes the next one easier to trace. Every decision remembered means the next similar situation is handled with context, not from zero.
            </p>
            <p className="uc-body">
              A tool gets you the answer to the question you thought to ask. The intelligence layer surfaces what you didn't know to look for — because it's been building the picture continuously, not waiting to be queried.
            </p>
          </div>
          <div className="il-compounds-stat">
            <div className="il-stat-number">6</div>
            <div className="il-stat-label">continuous intelligence loops running simultaneously across your business, 24/7</div>
          </div>
        </div>
      </section>

      {/* ACCUMULATION */}
      <section className="il-accumulation">
        <div className="il-accumulation-inner">
          <h2 className="uc-h2">The longer it runs,<br /><em>the more irreplaceable it becomes.</em></h2>
          <p className="uc-body">
            Not because of lock-in. Because of accumulated context. Three years of your decisions, your thresholds, your patterns, your recoveries — the intelligence layer builds a private operating memory of your business that nothing starting from zero can replicate.
          </p>
          <p className="uc-body">
            A competitor can copy the interface. They cannot copy the intelligence the system has built about how your specific business works.
          </p>
          <div className="il-pull">
            The interface is replaceable. The accumulated context is not.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="uc-cta">
        <h2 className="uc-cta-title">Start building the layer.</h2>
        <p className="uc-cta-sub">The intelligence starts accumulating from the first audit. The longer it runs, the sharper it gets.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
