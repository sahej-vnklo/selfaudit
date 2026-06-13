import React from 'react'
import './UseCases.css'
import './IntelligenceLayer.css'

const COMPONENTS = [
  {
    name: 'Memory',
    body: 'Every decision. Every pattern. Every chain traced and how it resolved. SelfAudit builds a private operating memory of your business — specific to how your company breaks, recovers, and grows.',
  },
  {
    name: 'Diagnosis',
    body: 'Not what\'s wrong. Why it\'s wrong. Traces cause across departments, tools, and timelines. A support spike that traces back to a bad-fit deal closed last month. The chain, not just the symptom.',
  },
  {
    name: 'Synthesis',
    body: 'HubSpot knows your pipeline. Stripe knows your revenue. Slack knows your team. None of them know how those three connect right now. Synthesis reads across all of them — finding what\'s invisible to any single tool.',
  },
  {
    name: 'Governance',
    body: 'You define what healthy looks like. Response under 4 hours. Margin above 60%. 10 active deals in pipeline. Governance watches your thresholds — not industry benchmarks — and flags the moment you drift from your own standard.',
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
        <h1 className="uc-h1">Your business<br />has data everywhere.<br /><em>And nothing connecting it.</em></h1>
        <p className="uc-intro">
          Every tool your team uses produces data. Every person on your team takes actions. But between the data and the decisions — there is nothing. No one reading across all of it. No one connecting what one tool knows to what another sees. That gap is where problems compound undetected. The Intelligence Layer is what closes it.
        </p>
      </section>

      <div className="uc-rule" />

      {/* FOUR COMPONENTS */}
      <section className="il-components">
        <div className="il-components-inner">
          <div className="uc-signals-eyebrow">What it's made of</div>
          <h2 className="uc-h2">Four layers. One brain.</h2>
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

      {/* CTA */}
      <section className="uc-cta">
        <h2 className="uc-cta-title">Start building the layer.</h2>
        <p className="uc-cta-sub">It starts accumulating from your first audit. The longer it runs, the sharper it gets.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
