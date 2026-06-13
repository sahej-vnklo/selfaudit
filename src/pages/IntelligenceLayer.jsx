import React from 'react'
import './UseCases.css'
import './IntelligenceLayer.css'

const COMPONENTS = [
  {
    name: 'Memory',
    body: 'Every decision made. Every pattern that surfaced. Every chain that was traced and how it resolved. SelfAudit builds a private operating memory of your specific business — how it breaks, how it recovers, what it costs when it drifts. That memory gets harder to replicate every day it runs.',
  },
  {
    name: 'Diagnosis',
    body: 'Not what\'s wrong. Why it\'s wrong — and where it started. Diagnosis traces cause across departments, tools, timelines, and decisions. A support spike that traces back to a product change. A margin gap that traces to a pricing decision made three quarters ago. The chain, not just the symptom.',
  },
  {
    name: 'Synthesis',
    body: 'HubSpot knows your pipeline. Stripe knows your revenue. Slack knows your team. None of them know how those three are connected right now. Synthesis reads across all of them simultaneously — finding the patterns that only exist in the space between your tools, invisible to any single one of them.',
  },
  {
    name: 'Governance',
    body: 'You define what healthy looks like. Response under 4 hours. Margin above 60%. Pipeline with 10 or more active deals. Governance watches your thresholds — not industry benchmarks, not best practices — and flags the exact moment your operation drifts from your own standard.',
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
          Every tool your team uses produces data. Every person on your team takes actions. But between the data and the decisions — there is nothing. No one reading across all of it. No one connecting what one tool knows to what another tool sees. That gap is where problems compound undetected. The Intelligence Layer is what closes it.
        </p>
      </section>

      <div className="uc-rule" />

      {/* WHAT IT IS */}
      <section className="il-concept">
        <div className="il-concept-inner">
          <h2 className="uc-h2">It doesn't replace your tools.<br />It reads across all of them.</h2>
          <div className="il-concept-body">
            <p className="uc-body">
              HubSpot, Stripe, Slack, Notion — they each know one part of your business extremely well. But none of them can tell you that the support tickets spiking this week trace back to the sales rep who overpromised features to close a deal last month. That connection lives in the gap between them.
            </p>
            <p className="uc-body">
              The Intelligence Layer sits underneath your entire operation. It pulls what every tool knows, connects what none of them see alone, and builds a continuously updated picture of your business — not one function at a time, but all of it at once.
            </p>
          </div>
        </div>
      </section>

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

      {/* WHY IT COMPOUNDS */}
      <section className="il-compounds">
        <div className="il-compounds-inner">
          <div className="il-compounds-copy">
            <h2 className="uc-h2">Unlike a tool you query —<br />it compounds.</h2>
            <p className="uc-body">
              Every diagnosis sharpens the next. Every pattern recognised makes the next one faster to trace. Every decision remembered means the next similar situation is handled with context, not from zero.
            </p>
            <p className="uc-body">
              A tool gives you the answer to the question you thought to ask. The Intelligence Layer surfaces what you didn't know to look for — because it has been reading your business continuously, not waiting to be prompted.
            </p>
          </div>
          <div className="il-compounds-stat">
            <div className="il-stat-number">24/7</div>
            <div className="il-stat-label">continuously reading every signal across every part of your business — without being asked</div>
          </div>
        </div>
      </section>

      {/* ACCUMULATION */}
      <section className="il-accumulation">
        <div className="il-accumulation-inner">
          <h2 className="uc-h2">The longer it runs,<br /><em>the more irreplaceable it becomes.</em></h2>
          <p className="uc-body">
            Not because of lock-in. Because of accumulated context. Three years of your decisions, your thresholds, your patterns, your recoveries — the Intelligence Layer builds a private operating memory of your business that nothing starting from scratch can replicate.
          </p>
          <p className="uc-body">
            A competitor can copy the interface. They cannot copy what the system has learned about how your specific business works.
          </p>
          <div className="il-pull">
            The interface is replaceable.<br />The accumulated context is not.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="uc-cta">
        <h2 className="uc-cta-title">Start building the layer.</h2>
        <p className="uc-cta-sub">The Intelligence Layer starts accumulating from your first audit. The longer it runs, the sharper it gets.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
