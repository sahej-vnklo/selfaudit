import React from 'react'
import './UseCases.css'
import './IntelligenceLayer.css'

const COMPONENTS = [
  {
    name: 'Ontology',
    body: 'Before it can watch anything, it has to understand your business. SelfAudit builds a living model of your company — your units, your people, your processes, your relationships. A SaaS company and a logistics firm share almost nothing structurally. The ontology makes sure SelfAudit understands yours specifically, not a generic template.',
  },
  {
    name: 'Memory',
    body: 'Every decision. Every pattern. Every chain traced and how it resolved. SelfAudit builds a private operating memory of your business — specific to how your company breaks, recovers, and grows. Day 1, it knows your structure. Day 365, it knows your business better than anyone you could hire.',
  },
  {
    name: 'Diagnosis',
    body: 'Not what\'s wrong. Why it\'s wrong. Traces cause across departments, tools, and timelines. A support spike that traces back to a bad-fit deal closed last month. A margin gap that traces to a pricing decision made two quarters ago. The chain, not just the symptom.',
  },
  {
    name: 'Synthesis',
    body: 'A churn signal in Customer Service. A velocity drop in Sales. A cash flow shift in Finance. Three separate tools, three separate alerts — or one compound root cause that spans all three. Synthesis reads across every unit simultaneously and finds what\'s invisible to any single tool.',
  },
  {
    name: 'Governance',
    body: 'You define what healthy looks like. Response under 4 hours. Margin above 60%. 10 active deals in pipeline. Governance watches your thresholds — not industry benchmarks — and flags the exact moment your operation drifts from your own standard.',
  },
  {
    name: 'Execution',
    body: 'Every finding comes staged for action. The retention email is drafted. The SOP is written. The task is assigned. You review it. You approve it. Then it runs. The system never acts before you say so — and it never makes you start from scratch.',
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


    </div>
  )
}
