import React from 'react'
import './UseCases.css'

const SIGNALS = [
  {
    name: 'Response time vs SLA',
    desc: 'Catches response time drifting before it breaches your threshold. Traces the cause — overloaded agent, ticket category spike, product issue — and tells you which one to fix first.',
  },
  {
    name: 'Ticket volume & resolution',
    desc: 'Identifies volume spikes before they become SLA problems. Diagnoses whether the cause is seasonal, product-related, or a process gap — then sequences the fix.',
  },
  {
    name: 'Recurring issue patterns',
    desc: 'Links repeat complaints to their root cause — a product feature, an onboarding gap, a specific cohort. Generates the brief for the team that needs to fix it.',
  },
  {
    name: 'Single points of failure',
    desc: 'Identifies the agent or process carrying too much load. Diagnoses whether it\'s a capacity, training, or ownership problem — and tells you which to address first.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function UseCaseCustomerService({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Customer Service</div>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Customer Service</div>
        <h1 className="uc-h1">Not just what's breaking.<br /><em>Why it's breaking. And exactly what to fix.</em></h1>
        <p className="uc-intro">
          SelfAudit doesn't alert you when your support operation crosses a threshold. It traces the cause across your entire business — agent load, product issues, process gaps — and gives you a specific, sequenced fix before the customer feels it.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The damage compounds long before anyone reports it.</h2>
          <div>
            <p className="uc-body">
              One agent ends up carrying the weight of the team. Ticket volume spikes in a specific category nobody is watching. A product feature released last month is generating 3x normal escalations — but nobody has connected it to the SLA trend yet.
            </p>
            <p className="uc-body">
              By the time it reaches a weekly report, the customer has already decided to leave. SelfAudit traces the chain — signal to root cause to fix — in real time, not retrospect.
            </p>
          </div>
        </div>
      </section>

      <section className="uc-chain-section">
        <div className="uc-chain-inner">
          <div className="uc-signals-eyebrow">How SelfAudit works in Customer Service</div>
          <div className="uc-chain-grid">
            <div className="uc-chain-step">
              <div className="uc-chain-num">01</div>
              <div className="uc-chain-title">What's happening</div>
              <p className="uc-chain-body">Response time is trending 18% above your defined threshold. Ticket volume in one category spiked 3x this week. One agent is handling 61% of tier-2 escalations.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">02</div>
              <div className="uc-chain-title">Why it's happening</div>
              <p className="uc-chain-body">The spike traces back to a product feature released three weeks ago. It's generating a specific error pattern in one user cohort — not a capacity problem. The agent load is a symptom, not the cause.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">03</div>
              <div className="uc-chain-title">What to do next</div>
              <p className="uc-chain-body">Escalate the feature finding to product with a ready-to-send brief. Redistribute agent load in the short term. Flag the cohort for proactive outreach before they churn.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="uc-signals">
        <div className="uc-signals-eyebrow">From signal to fix</div>
        <h2 className="uc-h2">Every input diagnosed. Every finding actioned.</h2>
        <div className="uc-signals-grid">
          {SIGNALS.map(s => (
            <div className="uc-signal-card" key={s.name}>
              <div className="uc-signal-name">{s.name}</div>
              <div className="uc-signal-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="uc-verdict-section">
        <div className="uc-verdict-inner">
          <div className="uc-verdict-section-label">Live finding</div>
          <div className="uc-verdict-card">
            <div className="uc-verdict-meta">
              <span className="uc-sev-high">High</span>
              <span>·</span>
              <span>Customer Service</span>
            </div>
            <p className="uc-verdict-quote">
              "Response time is 18% above your 4-hour threshold. Root cause: one product feature released 3 weeks ago is generating a specific error for a single cohort. That cohort represents 61% of current tier-2 volume."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Action:</strong> Product brief generated and ready to send. Agent load redistributed. Cohort flagged for proactive outreach. The fix is upstream — not in the support queue.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">Know what to fix. Not just what's broken.</h2>
        <p className="uc-cta-sub">SelfAudit gives your support operation a diagnosis — not just an alert.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
