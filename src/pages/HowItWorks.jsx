import React, { useState, useEffect, useRef, useCallback } from 'react'
import './HowItWorks.css'

// ── Pillar / tower data (mirrored from Landing) ───────────────────────────────
const PILLARS = [
  { idx: '01', name: 'Reconnaissance', desc: 'We monitor every signal across your business around the clock — systems, markets, conversations, behaviors. Nothing gets missed.' },
  { idx: '02', name: 'Diagnostic',     desc: 'Contextual AI reconstructs the full chain of cause across teams, vendors, and timelines. From noise to root cause, in seconds.' },
  { idx: '03', name: 'Investigative',  desc: 'Every detected event is ranked by real business impact. Triage becomes math, not opinion. Focus always goes where it matters most.' },
  { idx: '04', name: 'Synthesis',      desc: 'Approved playbooks execute autonomously in your existing tools — Slack, SAP, ServiceNow — with full audit trail and provenance.' },
  { idx: '05', name: 'Memory',         desc: 'Post-action verification catches the moment a process starts to drift — long before quarterly review can catch it.' },
  { idx: '06', name: 'Feedback',       desc: 'Every outcome feeds back into the system, making each loop smarter and more precise. The system compounds with every cycle.' },
]

const PILLAR_CENTERS = [0.262, 0.403, 0.519, 0.625, 0.718, 0.836]
const VH_TOP = 0.058, VH_BOT = 0.074, SIDE_L = 3, SIDE_R = 97

function pillarClipPath(i) {
  const cy  = PILLAR_CENTERS[i]
  const top = ((cy - VH_TOP) * 100).toFixed(1)
  const mid = (cy * 100).toFixed(1)
  const bot = ((cy + VH_BOT) * 100).toFixed(1)
  return `polygon(50% ${top}%, ${SIDE_R}% ${mid}%, 50% ${bot}%, ${SIDE_L}% ${mid}%)`
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LOOPS = [
  { idx: '01', name: 'Reconnaissance', closed: 'Monitors every signal around the clock. Every reading feeds directly into the next scan — nothing gets observed and forgotten.' },
  { idx: '02', name: 'Diagnostic',     closed: 'Traces root cause across departments and timelines. Each chain traced sharpens the next diagnosis. The system gets harder to fool.' },
  { idx: '03', name: 'Investigative',  closed: 'Ranks every detected event by real business impact. The ranking model improves with every cycle. Priority stops being opinion.' },
  { idx: '04', name: 'Synthesis',      closed: 'Executes approved playbooks inside your existing tools. Every outcome feeds back into future playbooks. Action compounds.' },
  { idx: '05', name: 'Memory',         closed: 'Verifies every action taken. Drift detected early is drift corrected before it compounds. The loop never assumes it worked.' },
  { idx: '06', name: 'Feedback',       closed: 'Every outcome re-enters the system as signal. The loop is not just the product — it is the improvement mechanism.' },
]

const BEFORE_AFTER = [
  {
    dimension: 'Discovery',
    before: 'You learn about the problem after the damage has already compounded.',
    after: 'The system flags the drift before it reaches your attention.',
  },
  {
    dimension: 'Information routing',
    before: 'Flows through people — slowly, lossily, filtered by whoever holds it.',
    after: 'Routes automatically through the intelligence layer. Nothing gets lost in translation.',
  },
  {
    dimension: 'Decisions',
    before: 'Based on whatever information is available, which is always incomplete.',
    after: 'Based on the full operational picture — continuously updated, never stale.',
  },
  {
    dimension: 'Improvement',
    before: 'Happens through retrospectives, quarterly reviews, post-mortems.',
    after: 'Happens continuously, inside every loop, compounding with every cycle.',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function HowItWorks({ onBack }) {
  const [activePillar, setActivePillar] = useState(0)
  const [descVisible,  setDescVisible]  = useState(true)
  const autoTimerRef  = useRef(null)
  const pillarsRef    = useRef(null)

  const changePillar = useCallback((i) => {
    if (i === activePillar) return
    setDescVisible(false)
    setTimeout(() => { setActivePillar(i); setDescVisible(true) }, 180)
  }, [activePillar])

  useEffect(() => {
    const start = () => {
      autoTimerRef.current = setInterval(() => {
        setActivePillar(prev => (prev + 1) % 6)
      }, 4200)
    }
    const stop = () => clearInterval(autoTimerRef.current)
    const el = pillarsRef.current
    el?.addEventListener('mouseenter', stop)
    el?.addEventListener('mouseleave', start)
    start()
    return () => {
      stop()
      el?.removeEventListener('mouseenter', stop)
      el?.removeEventListener('mouseleave', start)
    }
  }, [])

  return (
    <div className="sa-hiw">

      {/* NAV */}
      <nav className="hiw-nav">
        <button className="hiw-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          SelfAudit
        </button>
        <div className="hiw-nav-center">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <g stroke="#ff3d1f" strokeLinejoin="round" strokeLinecap="round" fill="none">
              <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
              <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
              <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
            </g>
          </svg>
          <span>How It Works</span>
        </div>
        <button className="hiw-nav-cta" onClick={onBack}>Start Audit</button>
      </nav>

      {/* OPENING */}
      <section className="hiw-open">
        <div className="hiw-open-inner">
          <h1 className="hiw-h1">Most businesses<br />run open loops.</h1>
          <p className="hiw-body">
            Decisions made. Executed. Forgotten. The information that should be making your business sharper is scattered across tools, meetings, and inboxes. Nobody is connecting it. Nobody is learning from it. The loop never closes — and you can't see where it's bleeding.
          </p>
        </div>
      </section>

      {/* OPEN vs CLOSED LOOP */}
      <section className="hiw-shift">
        <div className="hiw-section-inner">
          <h2 className="hiw-h2">The shift that changes everything.</h2>
          <p className="hiw-sub">In control systems, there are two modes of operation. One compounds with every cycle. One doesn't.</p>
          <div className="hiw-loops-compare">

            <div className="loop-card loop-open">
              <div className="loop-label">Open Loop</div>
              <div className="loop-sequence">
                <span className="loop-node">Signal</span>
                <span className="loop-arrow">→</span>
                <span className="loop-node">Decision</span>
                <span className="loop-arrow">→</span>
                <span className="loop-node">Action</span>
                <span className="loop-arrow">→</span>
                <span className="loop-node loop-dead">Lost</span>
              </div>
              <p className="loop-desc">
                Information is produced. Nobody captures it. Nobody learns from it. The next decision starts from zero. Most companies still operate this way — not because they chose to, but because nothing closed the loop for them.
              </p>
            </div>

            <div className="loop-card loop-closed">
              <div className="loop-label">Closed Loop</div>
              <div className="loop-sequence">
                <span className="loop-node loop-lit">Signal</span>
                <span className="loop-arrow loop-lit-arrow">→</span>
                <span className="loop-node loop-lit">Intelligence</span>
                <span className="loop-arrow loop-lit-arrow">→</span>
                <span className="loop-node loop-lit">Action</span>
                <span className="loop-arrow loop-lit-arrow">↺</span>
              </div>
              <p className="loop-desc">
                Every outcome feeds back in. Every cycle sharpens the next. The system self-corrects continuously — not quarterly. This is how SelfAudit operates, across all six intelligence loops, simultaneously.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* LEGIBILITY */}
      <section className="hiw-legible">
        <div className="hiw-section-inner">
          <div className="hiw-legible-inner">
            <div>
              <h2 className="hiw-h2">For a closed loop to work, your business must be legible.</h2>
              <p className="hiw-body">
                Every important signal your business emits has to be captured. Not stored in someone's memory. Not buried in a thread. Captured, connected, and fed into the intelligence layer continuously.
              </p>
              <p className="hiw-body" style={{ marginTop: 20 }}>
                When your business is legible, something changes fundamentally: the system always has an up-to-date view of what's actually happening. Not what was reported. Not what was remembered. What happened.
              </p>
            </div>
            <div className="hiw-signals-panel">
              <div className="signals-list">
                {[
                  ['Support',  'Response times, ticket volume, recurring failures'],
                  ['Pipeline', 'Deal velocity, stall patterns, conversion gaps'],
                  ['Finance',  'Margin drift, burn rate, receivable delays'],
                  ['Strategy', 'Goal progress, repeated blockers, team capacity'],
                ].map(([lane, desc]) => (
                  <div className="signal-row" key={lane}>
                    <span className="signal-lane">{lane}</span>
                    <span className="signal-desc">{desc}</span>
                    <span className="signal-pulse" />
                  </div>
                ))}
              </div>
              <div className="signal-sink">
                <div className="sink-label">Intelligence Layer</div>
                <div className="sink-sub">Continuously connected. Always current.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIX LOOPS — tower */}
      <section className="hiw-six" ref={pillarsRef}>
        <div className="hiw-section-inner">
          <div className="hiw-pillars-wrap">

            <div className="hiw-pillars-header">
              <h2 className="hiw-h2">SelfAudit is the closed loop<br />for your entire operation.</h2>
              <p className="hiw-sub">Six continuous intelligence loops. Each one feeds the next. Together they form a system that never stops improving.</p>
              <nav className="hiw-pillar-nav">
                {PILLARS.map((p, i) => (
                  <button
                    key={p.idx}
                    className={`hiw-pillar-btn${activePillar === i ? ' active' : ''}`}
                    onClick={() => changePillar(i)}
                    onMouseEnter={() => changePillar(i)}
                  >
                    <span className="hiw-p-idx">{p.idx}</span>
                    <span className="hiw-p-name">{p.name}</span>
                    <span className="hiw-p-arrow">›</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="hiw-pillars-cube-area">
              <div className="hiw-tower-art">
                <img
                  className="hiw-tower-base"
                  src="/assets/platform-stack.png"
                  alt="SelfAudit layered intelligence"
                  style={{ padding: '5px 0 0' }}
                />
                <img
                  className="hiw-tower-glow"
                  src="/assets/platform-stack.png"
                  alt=""
                  aria-hidden="true"
                  style={{ clipPath: pillarClipPath(activePillar) }}
                />
              </div>
              <div className="hiw-pillar-readout">
                <div className="hiw-readout-eyebrow">
                  {PILLARS[activePillar].idx} — {PILLARS[activePillar].name}
                </div>
                <p className={`hiw-readout-desc${descVisible ? ' show' : ''}`}>
                  {PILLARS[activePillar].desc}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="hiw-ba">
        <div className="hiw-section-inner">
          <h2 className="hiw-h2">What actually changes.</h2>
          <p className="hiw-sub">When your business runs on a closed loop instead of an open one.</p>
          <div className="ba-table">
            <div className="ba-header">
              <div className="ba-dim-head" />
              <div className="ba-col-head ba-before-head">Open Loop</div>
              <div className="ba-col-head ba-after-head">Closed Loop</div>
            </div>
            {BEFORE_AFTER.map(row => (
              <div className="ba-row" key={row.dimension}>
                <div className="ba-dim">{row.dimension}</div>
                <div className="ba-before">{row.before}</div>
                <div className="ba-after">{row.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE OS FRAME */}
      <section className="hiw-os">
        <div className="hiw-section-inner">
          <div className="hiw-os-inner">
            <h2 className="hiw-h2-xl">Not a tool.<br /><em>The operating system<br />your business runs on.</em></h2>
            <p className="hiw-body">
              Tools require you to operate them. You pull the report, run the query, interpret the output, then decide what to do. An operating system runs the operation. SelfAudit watches every signal, traces every chain, and surfaces what matters — without being asked.
            </p>
            <p className="hiw-body" style={{ marginTop: 20 }}>
              You stop being the information router. Your velocity stops being bounded by what you personally can see and process. The intelligence layer handles the routing. You handle the decisions that actually require you.
            </p>
            <div className="hiw-pull">
              Your business stops being an open loop.<br />
              It becomes a closed-loop system that compounds every time it runs.
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="hiw-final">
        <div className="hiw-final-glow" />
        <div className="hiw-final-inner">
          <h2 className="hiw-final-title">Close the loop.</h2>
          <p className="hiw-final-sub">The business is already emitting the signals. SelfAudit connects them.</p>
          <button className="hiw-cta-btn" onClick={onBack}>Start Audit</button>
        </div>
      </section>

    </div>
  )
}
