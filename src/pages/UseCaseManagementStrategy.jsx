import React from 'react'
import './UseCases.css'

const SIGNALS = [
  { name: 'Goal progress & blockers', desc: 'Continuous, not quarterly. Flags the moment progress slows and names why.' },
  { name: 'Execution follow-through', desc: 'What was decided vs what happened. Closes the loop between intent and action.' },
  { name: 'Repeated priority patterns', desc: 'Goals that keep returning. Blockers that never get formally assigned. SelfAudit names the pattern.' },
  { name: 'Team bottlenecks', desc: 'Where capacity is being absorbed. The person, the process, the dependency slowing everything down.' },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function UseCaseManagementStrategy({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">Management &amp; Strategy</div>
        <button className="uc-nav-cta" onClick={onBack}>Start Audit</button>
      </nav>

      <section className="uc-hero">
        <div className="uc-area-tag">Management &amp; Strategy</div>
        <h1 className="uc-h1">Notices when you set <em>the same goal three quarters in a row.</em></h1>
        <p className="uc-intro">
          Priorities get set but execution isn't verified. Goals repeat because the blocker never got fixed. SelfAudit watches the strategic layer of your business continuously — closing the gap between what you decided and what actually happened.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The strategic picture is always filtered and delayed.</h2>
          <div>
            <p className="uc-body">
              Team bottlenecks stay invisible until they become crises. Execution follow-through is assumed, not verified. The information reaching the person at the top has been filtered, summarised, and delayed — by the time it arrives, the window to act has usually passed.
            </p>
            <p className="uc-body">
              SelfAudit gives you an unfiltered, continuously updated view of what's actually happening — not what was reported.
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
              <span>Management &amp; Strategy</span>
            </div>
            <p className="uc-verdict-quote">
              "Improve onboarding conversion has been a top-3 priority for three consecutive quarters. The blocker — unclear handoff ownership between sales and product — has never been formally assigned an owner."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Blocker named and assigned.</strong> Goal sequenced with a specific owner and deadline. Pattern monitoring active — SelfAudit flags the moment it starts repeating again.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">Close the loop on execution.</h2>
        <p className="uc-cta-sub">SelfAudit turns strategic intent into verified outcomes — not just plans.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
