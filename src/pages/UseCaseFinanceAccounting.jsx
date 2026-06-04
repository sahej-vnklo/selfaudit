import React from 'react'
import './UseCases.css'

const SIGNALS = [
  { name: 'Margin by product/service', desc: 'Actual delivery margin vs quoted margin. Flags the gap being absorbed by scope nobody is tracking.' },
  { name: 'Burn rate & runway', desc: 'Watched weekly, not monthly. Catches the moment runway calculation changes before it surprises you.' },
  { name: 'LTV:CAC & churn signals', desc: 'Early warning, not lagging indicator. Surfaces the ratio shift before it becomes a board conversation.' },
  { name: 'Overdue receivables', desc: 'Tracked continuously. Names the client, the amount, and how long it has been outstanding.' },
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
        <button className="uc-nav-cta" onClick={onBack}>Start Audit</button>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Finance &amp; Accounting</div>
        <h1 className="uc-h1">It finds the margin gap <em>before the quarter ends.</em></h1>
        <p className="uc-intro">
          Margin drift is invisible until reporting time. SelfAudit watches your financial signals continuously — so the gap between what you quoted and what you're delivering never compounds to the point it can't be fixed.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The numbers look fine until they don't.</h2>
          <div>
            <p className="uc-body">
              The service that looked profitable on paper is delivering at half the margin. Burn rate shifts week to week but nobody is watching it daily. LTV:CAC ratios deteriorate slowly, then suddenly. By the time it appears in a financial review, the compounding has already happened.
            </p>
            <p className="uc-body">
              Finance should be one of the most visible parts of the business. Instead it's one of the last places a problem surfaces.
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
              <span className="uc-sev-critical">Critical</span>
              <span>·</span>
              <span>Finance &amp; Accounting</span>
            </div>
            <p className="uc-verdict-quote">
              "Service line 3 is priced at 58% margin but delivering at 33%. The 25-point gap is absorbed entirely by scope additions that aren't being billed. Three receivables are 45+ days overdue — $67k outstanding."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Scope creep policy implemented.</strong> Billing process corrected. Receivables chased. Runway recalculated with accurate burn data — 6 weeks longer than previously modelled.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">See your actual numbers.</h2>
        <p className="uc-cta-sub">SelfAudit closes the gap between what you think the finances say and what they actually say.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
