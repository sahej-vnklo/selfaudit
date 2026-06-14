import React from 'react'
import './UseCases.css'
import './LiveOntology.css'

const COMPONENTS = [
  {
    name: 'Areas',
    body: 'The defined sections of your business — Sales, Finance, Customer Service, Operations. You choose which ones exist. A logistics company and a SaaS startup structure themselves completely differently. Areas make sure SelfAudit maps to how your business actually runs, not a generic template.',
  },
  {
    name: 'Units',
    body: 'The metrics and signals that matter inside each area. Churn rate. Pipeline velocity. Burn rate. Response time. You choose which units to track, set what healthy looks like, and define your own thresholds. Not industry averages — your standards.',
  },
  {
    name: 'Relationships',
    body: 'How areas connect to each other. A degradation in Customer Service traces into Retention. A slowdown in Sales traces into Finance runway. The ontology knows which way things flow — so when something moves in one area, SelfAudit already knows where else to look.',
  },
  {
    name: 'Objects',
    body: 'The individual entities inside each area — your people, your accounts, your products, your processes. Each one tracked individually, not averaged into a single number. When a pattern breaks, the ontology knows exactly where it broke.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function LiveOntology({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Live Ontology</div>
      </nav>

      {/* HERO */}
      <section className="uc-hero">
        <div className="uc-area-tag">Platform</div>
        <h1 className="uc-h1">Before it can watch<br />your business, it needs<br /><em>to understand it.</em></h1>
        <p className="uc-intro">
          Most AI tools read your data and hand you an answer. SelfAudit does something different first — it builds a living model of your company. Your structure. Your areas. Your people, processes, and the relationships between them. That model is the Live Ontology. Everything else runs on top of it.
        </p>
      </section>

      <div className="uc-rule" />

      {/* WHAT IT IS */}
      <section className="il-concept">
        <div className="il-concept-inner">
          <h2 className="uc-h2">Not a template.<br />A map of your business.</h2>
          <div className="il-concept-body">
            <p className="uc-body">
              A logistics company and a SaaS startup share almost nothing structurally. The same system built for both would be useful to neither. The Live Ontology solves this — it makes SelfAudit understand your specific business, not a generic version of your industry.
            </p>
            <p className="uc-body">
              You choose the areas that matter. You define what healthy looks like inside each one. You set your own thresholds. The system maps how those areas connect. From that point on, every diagnosis, every finding, and every recommended action is grounded in how your business actually works.
            </p>
          </div>
        </div>
      </section>

      {/* COMPONENTS */}
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

      {/* LOCAL FIRST */}
      <section className="lo-local">
        <div className="lo-local-inner">
          <h2 className="uc-h2">It lives on your machine.<br />Not ours.</h2>
          <p className="uc-body">
            The Live Ontology is stored locally — on your device, not a shared cloud server. Your business structure is private. The AI reasoning happens in the cloud, but what it reasons about stays with you. No vendor ever sees your map. No data sharing. Your machine. Your model.
          </p>
          <div className="il-pull">
            The ontology is the foundation.<br />Memory, Diagnosis, Synthesis, Governance, Execution — all of it runs on top of this map.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="uc-cta">
        <h2 className="uc-cta-title">Start building your map.</h2>
        <p className="uc-cta-sub">The ontology starts taking shape the moment you log in. The longer it runs, the more it understands.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
