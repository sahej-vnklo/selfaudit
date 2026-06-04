import React from 'react'
import './UseCases.css'

const SIGNALS = [
  {
    name: 'Goal progress & blockers',
    desc: 'Tracks goal progress continuously, not quarterly. When progress stalls, diagnoses whether it\'s a resource problem, an ownership gap, or a structural blocker — and names which one is actually in the way.',
  },
  {
    name: 'Execution follow-through',
    desc: 'Closes the gap between what was decided and what happened. Identifies where decisions didn\'t convert to action — and whether the breakdown was clarity, ownership, or capacity.',
  },
  {
    name: 'Repeated priority patterns',
    desc: 'Recognises when the same goal reappears quarter after quarter. Diagnoses why it keeps returning — usually a structural gap, not a strategy failure — and tells you what to fix so it doesn\'t come back.',
  },
  {
    name: 'Team bottlenecks',
    desc: 'Identifies where capacity is being absorbed and why. Diagnoses whether the constraint is a person, a process, or a dependency — and sequences the right intervention.',
  },
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
        <h1 className="uc-h1">The goal isn't wrong. <em>The structure to execute it doesn't exist yet.</em></h1>
        <p className="uc-intro">
          Most strategic failures aren't strategy problems. They're accountability gaps, structural blockers, and decisions that never converted to action. SelfAudit traces the execution breakdown — names the blocker, assigns the owner, and monitors it weekly until it closes.
        </p>
      </section>

      <div className="uc-rule" />

      <section className="uc-problem">
        <div className="uc-problem-inner">
          <h2 className="uc-h2">The same priorities keep coming back. Because the blocker never got fixed.</h2>
          <div>
            <p className="uc-body">
              A goal gets set. It gets attention for two weeks. It stalls. By next quarter it's back in the top three — reworded, re-prioritised, same outcome. Not because the strategy is wrong. Because the structural gap underneath it was never formally addressed.
            </p>
            <p className="uc-body">
              The information reaching the top is always filtered, summarised, and delayed. SelfAudit gives you an unfiltered view of what's actually happening — what was decided, what happened, and what's blocking the gap between the two.
            </p>
          </div>
        </div>
      </section>

      <section className="uc-chain-section">
        <div className="uc-chain-inner">
          <div className="uc-signals-eyebrow">How SelfAudit works in Management &amp; Strategy</div>
          <div className="uc-chain-grid">
            <div className="uc-chain-step">
              <div className="uc-chain-num">01</div>
              <div className="uc-chain-title">What's happening</div>
              <p className="uc-chain-body">"Improve onboarding conversion" has been a top-3 priority for 3 consecutive quarters. Progress stalls at week 2 each cycle. Current conversion is 34% — 18 points below your defined threshold.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">02</div>
              <div className="uc-chain-title">Why it's happening</div>
              <p className="uc-chain-body">Not a strategy problem. The goal is right. The blocker is structural — the handoff between sales qualification and product onboarding has no assigned owner. Decisions get deferred because nobody has the authority to make them.</p>
            </div>
            <div className="uc-chain-divider" />
            <div className="uc-chain-step">
              <div className="uc-chain-num">03</div>
              <div className="uc-chain-title">What to do next</div>
              <p className="uc-chain-body">Assign the handoff owner this week. Define decision rights — one person, one threshold, one escalation path. SelfAudit monitors weekly and flags the moment progress slows. This goal stops repeating when the structure exists to close it.</p>
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
              <span>Management &amp; Strategy</span>
            </div>
            <p className="uc-verdict-quote">
              "Onboarding conversion goal has appeared in top-3 priorities for 3 consecutive quarters. Progress stalls at week 2 each cycle. Root cause: the sales-to-product handoff has no owner, no decision rights, and no defined threshold. The strategy is right. The structure to execute it doesn't exist."
            </p>
            <div className="uc-verdict-outcome">
              <strong>Action:</strong> Ownership assigned. Decision rights defined. Threshold set at 52% conversion. SelfAudit monitors weekly — flags the moment progress slows before the quarter ends. This goal does not appear again next quarter.
            </div>
          </div>
        </div>
      </section>

      <section className="uc-cta">
        <h2 className="uc-cta-title">Stop setting the same goal twice.</h2>
        <p className="uc-cta-sub">SelfAudit finds the structural gap underneath the repeating priority — then tells you exactly what to put in place to close it.</p>
        <button className="uc-cta-btn" onClick={onBack}>Start Audit</button>
      </section>

    </div>
  )
}
