import React from 'react'
import './UseCases.css'

const SIGNALS = [
  { name: 'Response time vs SLA', desc: 'Tracks drift before breach — not after. Flags the trend, not the violation.' },
  { name: 'Ticket volume & resolution', desc: 'Patterns across time, not snapshots. Identifies when volume is outpacing capacity.' },
  { name: 'Recurring issue patterns', desc: 'Names the repeat failure — the product gap, the process hole, the cohort at risk.' },
  { name: 'Single points of failure', desc: 'The agent carrying too much. The queue nobody owns. Visible before it breaks.' },
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
        <button className="uc-nav-cta" onClick={onBack}>Start Audit</button>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Customer Service</div>
        <h1 className="uc-h1">The moment your support starts drifting, <em>SelfAudit names it.</em></h1>
        <p className="uc-intro">
          The problems that compound quietly in customer service are the ones that eventually show up in churn. SelfAudit watches your support operation continuously — so the damage never reaches your customers first.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">Support teams carry invisible load.</h2>
          <div>
            <p className="uc-body">
              Ticket volume spikes go unnoticed until SLAs breach. One agent ends up carrying the weight of the team while the rest show green. Recurring issues repeat across cohorts — the same product gap, the same failure — and nobody connects the pattern until the customer has already decided to leave.
            </p>
            <p className="uc-body">
              By the time it appears in a weekly report, the damage has already compounded. SelfAudit surfaces it while there's still time to act.
            </p>
          </div>
        </div>
      </section>

      <section className="uc-signals">
        <div className="uc-signals-eyebrow">What SelfAudit watches</div>
        <h2 className="uc-h2">Four signals. Continuously.</h2>
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
              "Response time started trending 18% above target on Tuesday. One agent is handling 61% of all tier-2 escalations. The pattern traces back to a single product feature released three weeks ago."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Flagged before SLA breach.</strong> Workload redistributed. Product team escalated. The agent wasn't the problem — the feature was.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">See it in your support operation.</h2>
        <p className="uc-cta-sub">SelfAudit surfaces what's drifting before your customers feel it.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
