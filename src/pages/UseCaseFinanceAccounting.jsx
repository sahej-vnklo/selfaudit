import React from 'react'
import './UseCases.css'

const SIGNALS = [
  {
    name: 'Margin by product/service',
    desc: 'Catches the gap between quoted margin and actual delivery margin. Diagnoses whether it\'s a pricing problem, a scope problem, or an efficiency problem — and tells you which engagement to address first.',
  },
  {
    name: 'Burn rate & runway',
    desc: 'Tracked weekly, not monthly. When burn changes, SelfAudit traces it to the specific cost driver — headcount, vendor, or operational spend — before it shortens your runway without explanation.',
  },
  {
    name: 'LTV:CAC & churn signals',
    desc: 'Surfaces deteriorating unit economics early. Diagnoses whether the problem is retention, expansion, or acquisition-based — so the fix goes to the right team, not the wrong one.',
  },
  {
    name: 'Overdue receivables',
    desc: 'Names the client, the amount, and the days outstanding. Diagnoses whether the delay is a process gap, a relationship issue, or a dispute — and drafts the follow-up conversation.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function UseCaseFinanceAccounting({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Finance &amp; Accounting</div>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Finance &amp; Accounting</div>
        <h1 className="uc-h1">The margin gap isn't a pricing problem. <em>SelfAudit finds what actually caused it.</em></h1>
        <p className="uc-intro">
          Most financial problems look like one thing and are actually another. SelfAudit doesn't surface numbers — it traces them. From margin drift to scope creep to the specific engagement absorbing it. From runway shortfall to the exact cost driver behind it. Then it tells you what to fix.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The numbers look fine in the dashboard. The business tells a different story.</h2>
          <div>
            <p className="uc-body">
              A service line is priced at 58% margin but delivering at 33%. Two client engagements have absorbed 40 hours of unbilled work this quarter — because sales closed at one scope and delivery is executing at another, and nobody owns the gap between them.
            </p>
            <p className="uc-body">
              By the time it shows up in a financial review, the compounding has already happened. SelfAudit traces the cause while there's still a quarter to fix it.
            </p>
          </div>
        </div>
      </section>

      <section className="uc-chain-section">
        <div className="uc-chain-inner">
          <div className="uc-signals-eyebrow">How SelfAudit works in Finance &amp; Accounting</div>
          <div className="uc-chain-grid">
            <div className="uc-chain-step">
              <div className="uc-chain-num">01</div>
              <div className="uc-chain-title">What's happening</div>
              <p className="uc-chain-body">Gross margin on service line 3 is 33% — against the 58% it was priced at. Three receivables are 45+ days overdue, totalling $67k. Runway shortened by 3 weeks this month without explanation.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">02</div>
              <div className="uc-chain-title">Why it's happening</div>
              <p className="uc-chain-body">Not a pricing problem. A scope delivery problem. Two engagements absorbed 40+ unbilled hours this quarter. Sales closed at one scope, delivery executed at another. Nobody owns the handoff — so nobody bills the overrun.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">03</div>
              <div className="uc-chain-title">What to do next</div>
              <p className="uc-chain-body">Bill the current overruns on both engagements — SelfAudit drafts the client conversation. Implement a scope change sign-off process before the next delivery cycle. Chase the three outstanding receivables with tailored follow-ups, ready to send.</p>
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
              <span className="uc-sev-critical">Critical</span>
              <span>·</span>
              <span>Finance &amp; Accounting</span>
            </div>
            <p className="uc-verdict-quote">
              "Service line 3 is delivering at 33% margin against a 58% quote. Root cause: two client engagements absorbed 40+ unbilled hours through scope additions nobody is tracking. $67k in receivables overdue. Runway shortened by 3 weeks — tied to a vendor contract that auto-renewed in April."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Action:</strong> Scope overrun billing initiated — client conversations drafted. Scope sign-off process implemented for next cycle. Receivables follow-ups ready to send. Vendor contract flagged for review before next renewal.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">Know where the money is going. Not just that it went.</h2>
        <p className="uc-cta-sub">SelfAudit traces your financial signals to their root cause — then tells you exactly what to fix and how to say it.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
