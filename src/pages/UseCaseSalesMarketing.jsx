import React from 'react'
import './UseCases.css'

const SIGNALS = [
  { name: 'Pipeline health & velocity', desc: 'Tracks deal movement over time — not just volume. Surfaces slowdowns before they become stalls.' },
  { name: 'Deal stall detection', desc: 'Flags deals marked active with zero movement. Shows real pipeline, not what the CRM reports.' },
  { name: 'Outreach activity gaps', desc: 'Identifies where and when outreach volume dropped. Names the segment going dark.' },
  { name: 'Conversion by source', desc: 'Which channels are actually converting. Separates signal from noise in your acquisition mix.' },
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
        <button className="uc-nav-cta" onClick={onBack}>Start Audit</button>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Sales &amp; Marketing</div>
        <h1 className="uc-h1">It shows you <em>real pipeline.</em> Not what the CRM says it is.</h1>
        <p className="uc-intro">
          Pipeline looks healthy until it doesn't. SelfAudit watches deal movement, outreach activity, and conversion patterns continuously — surfacing the gaps your CRM will never show you.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">Deals stall silently. The CRM stays green.</h2>
          <div>
            <p className="uc-body">
              Deals get marked active and never touched again. Outreach volume drops in specific segments without anyone noticing. Conversion differences between channels compound for quarters before they surface in a report.
            </p>
            <p className="uc-body">
              The CRM reflects what was entered — not the truth of what's moving. By the time someone pulls the pipeline report, the quarter is already at risk.
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
              <span>Sales &amp; Marketing</span>
            </div>
            <p className="uc-verdict-quote">
              "Three deals in final stage have had zero activity in 47 days. Outreach to the enterprise segment dropped 38% over the last three weeks. Real pipeline is 40% of what the CRM is reporting."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Deals re-engaged or removed.</strong> Outreach gap addressed before end of quarter. Pipeline forecast corrected. The problem was upstream — not in the close.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">See your real pipeline.</h2>
        <p className="uc-cta-sub">SelfAudit shows you what's actually moving — and what's been sitting still for 47 days.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
