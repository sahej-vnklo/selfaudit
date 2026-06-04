import React from 'react'
import './UseCases.css'

const SIGNALS = [
  {
    name: 'Pipeline health & velocity',
    desc: 'Distinguishes genuine pipeline growth from deals that haven\'t moved in weeks. Diagnoses whether the slowdown is a rep, a segment, or a market signal — and tells you which to address.',
  },
  {
    name: 'Deal stall detection',
    desc: 'Traces a stalled deal to the specific rep, stage, or objection pattern. Doesn\'t just flag it — generates the re-engagement approach and the conversation to have.',
  },
  {
    name: 'Outreach activity gaps',
    desc: 'Links outreach volume drops to pipeline impact downstream. Diagnoses whether it\'s a capacity problem or a behavioral one — then sequences the fix accordingly.',
  },
  {
    name: 'Conversion by source',
    desc: 'Surfaces which channels are actually converting vs which look good on paper. Diagnoses why conversion is dropping in specific sources and what to change first.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function UseCaseSalesMarketing({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Sales &amp; Marketing</div>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Sales &amp; Marketing</div>
        <h1 className="uc-h1">The pipeline problem isn't where you think it is. <em>SelfAudit traces it to the source.</em></h1>
        <p className="uc-intro">
          A stalled pipeline isn't always a lead quality problem. Sometimes it's one rep, one behavior change, one segment going dark. SelfAudit diagnoses the actual cause — not the symptom the CRM is showing you — and tells you exactly what to do about it.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The CRM shows green. The pipeline is rotting quietly.</h2>
          <div>
            <p className="uc-body">
              Deals stay marked active for weeks with no movement. Outreach volume drops in a specific segment and nobody notices until the end of quarter. A rep changes their approach after a lost deal and the downstream effect takes 6 weeks to show up in revenue.
            </p>
            <p className="uc-body">
              By the time the pipeline review happens, the problem is already expensive. SelfAudit doesn't wait for the review. It traces the signal to the cause and gives you the fix while there's still time to act.
            </p>
          </div>
        </div>
      </section>

      <section className="uc-chain-section">
        <div className="uc-chain-inner">
          <div className="uc-signals-eyebrow">How SelfAudit works in Sales &amp; Marketing</div>
          <div className="uc-chain-grid">
            <div className="uc-chain-step">
              <div className="uc-chain-num">01</div>
              <div className="uc-chain-title">What's happening</div>
              <p className="uc-chain-body">3 deals in final stage have had zero activity in 47 days. Enterprise outreach dropped 38% over the last 3 weeks. Pipeline velocity is at 40% of last quarter — but the CRM shows everything active.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">02</div>
              <div className="uc-chain-title">Why it's happening</div>
              <p className="uc-chain-body">Not a market problem. One rep changed their outreach approach after a lost deal on March 14th. The stall is behavioral, not structural. The CRM reflects what was entered — not what's actually moving.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">03</div>
              <div className="uc-chain-title">What to do next</div>
              <p className="uc-chain-body">One targeted coaching conversation — framed around the specific pattern, not generic performance. Re-engagement sequences for the 3 stalled deals drafted and ready to send. CRM hygiene rules updated so status reflects reality going forward.</p>
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
              <span>Sales &amp; Marketing</span>
            </div>
            <p className="uc-verdict-quote">
              "3 deals in final stage, zero activity in 47 days. Enterprise outreach down 38% — traced to one rep who changed approach after a lost deal on March 14th. The pipeline problem is behavioral, not structural. Real pipeline is 40% of what the CRM reports."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Action:</strong> Coaching brief generated around the specific behavior pattern. Re-engagement sequences for all 3 deals drafted. CRM hygiene rules enforced going forward. The quarter is recoverable — but only this week.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">Know why pipeline stalls. Not just that it did.</h2>
        <p className="uc-cta-sub">SelfAudit diagnoses your sales operation — then tells you exactly what to fix and who needs to hear it.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
