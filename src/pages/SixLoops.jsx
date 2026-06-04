import React from 'react'
import './UseCases.css'
import './SixLoops.css'

const LOOPS = [
  {
    idx: '01',
    name: 'Reconnaissance',
    what: 'The intelligence layer begins with continuous observation. Every signal your business emits — across systems, markets, conversations, and behaviours — is captured and processed in real time. Nothing waits for a scheduled report. Nothing relies on a human to notice and escalate. The reconnaissance loop is always running, always reading, never switching off.',
    produces: 'A continuously updated signal map across all four operating lanes — Customer Service, Sales, Finance, and Strategy. The raw material everything else runs on.',
    feeds: 'Every signal captured by Reconnaissance becomes the input for Diagnostic. Without a complete signal picture, diagnosis is partial. Reconnaissance ensures nothing enters the system already missing context.',
  },
  {
    idx: '02',
    name: 'Diagnostic',
    what: 'Capturing a signal is not the same as understanding it. The Diagnostic loop takes every signal Reconnaissance surfaces and asks the harder question: what is actually causing this? It reconstructs the chain of cause across departments, vendors, timelines, and prior decisions — tracing the symptom back to its origin, however far back that goes.',
    produces: 'A root cause finding with a confidence level and a chain of evidence. Not "support response time is degrading" — but why it is, what triggered it, and what it connects to elsewhere in the business.',
    feeds: 'Diagnostic passes its findings to Investigative, which determines which of many competing findings deserve the most attention. Without Diagnostic\'s causal chain, Investigative would be ranking symptoms, not causes.',
  },
  {
    idx: '03',
    name: 'Investigative',
    what: 'At any given moment, the intelligence layer has surfaced more findings than any one person can act on simultaneously. The Investigative loop applies a consistent, objective framework to every finding — ranking each one by its real business impact, not by how recently it was flagged or how loudly it was reported. Triage becomes mathematics, not opinion.',
    produces: 'A ranked priority queue where every item has a severity, a business cost, and a connection to the root cause that produced it. The highest-priority item is always the one that, left unaddressed, costs the most.',
    feeds: 'Investigative hands the ranked findings to Synthesis, which determines what to do about them. Without ranking, Synthesis would have no basis for sequencing action.',
  },
  {
    idx: '04',
    name: 'Synthesis',
    what: 'Knowing what is wrong and why it is wrong is not enough. The Synthesis loop takes the ranked, diagnosed findings and produces the specific, sequenced response — the action plan, the process fix, the team brief, the outreach, the SOP. It executes approved playbooks autonomously inside your existing tools, with a full audit trail. The gap between diagnosis and done closes in a single loop.',
    produces: 'Ready-to-use artifacts: action plans, process SOPs, team briefs, hiring specs, outreach drafts. And where playbooks are approved, direct execution inside connected tools — with every action logged and attributed.',
    feeds: 'Every action Synthesis takes becomes an outcome that Memory and Feedback need to verify and learn from. Synthesis closes the immediate loop; the broader system learns from what it did.',
  },
  {
    idx: '05',
    name: 'Memory',
    what: 'Action without verification is an open loop. The Memory loop closes it. After every Synthesis output, Memory tracks what was done, monitors whether it worked, and catches the moment a process starts to drift again — long before a quarterly review would surface it. It also accumulates the operating history of the business: every pattern seen, every decision made, every recovery executed.',
    produces: 'A growing private operating memory specific to how your business works — what breaks it, what fixes it, what patterns keep returning. This accumulated context makes every future diagnosis faster and more precise.',
    feeds: 'Memory feeds both Feedback and Reconnaissance. The accumulated context it builds sharpens every future signal read. The verification it performs feeds the learning that Feedback applies to the whole system.',
  },
  {
    idx: '06',
    name: 'Feedback',
    what: 'The sixth loop is what makes the system compound. Feedback takes every outcome — every action taken, every result observed, every pattern resolved or recurring — and feeds it back into the intelligence layer as new signal. The system learns from what it did. Each cycle improves the accuracy of the next diagnosis, the precision of the next priority ranking, the relevance of the next recommended action.',
    produces: 'A continuously improving intelligence system. Not static rules that degrade over time, but a living model of your business that gets more accurate with every cycle it completes.',
    feeds: 'Feedback returns everything it learns to Reconnaissance, completing the loop. The next observation cycle begins with sharper pattern recognition than the last. The system does not plateau — it compounds.',
  },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function SixLoops({ onBack }) {
  return (
    <div className="sa-uc">

      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">The Six Loops</div>
      </nav>

      {/* HERO */}
      <section className="uc-hero sl-hero">
        <div className="uc-area-tag">Platform</div>
        <h1 className="uc-h1">Six continuous loops.<br /><em>One operating system.</em></h1>
        <p className="uc-intro">
          Each loop runs continuously, 24 hours a day. Each one feeds the next. The intelligence doesn't live in any single loop — it lives in the chain. Remove one and the system loses its ability to compound.
        </p>
      </section>

      <div className="uc-rule" />

      {/* LOOPS */}
      <div className="sl-loops">
        {LOOPS.map((loop, i) => (
          <section key={loop.idx} className={`sl-loop ${i % 2 === 1 ? 'sl-loop-alt' : ''}`}>
            <div className="sl-loop-inner">

              <div className="sl-loop-left">
                <div className="sl-loop-num">{loop.idx}</div>
                <div className="sl-loop-name">{loop.name}</div>
              </div>

              <div className="sl-loop-right">
                <p className="sl-loop-what">{loop.what}</p>

                <div className="sl-loop-meta">
                  <div className="sl-meta-block">
                    <div className="sl-meta-label">Produces</div>
                    <p className="sl-meta-body">{loop.produces}</p>
                  </div>
                  {i < LOOPS.length - 1 && (
                    <div className="sl-meta-block">
                      <div className="sl-meta-label">Feeds into</div>
                      <p className="sl-meta-body">{loop.feeds}</p>
                    </div>
                  )}
                  {i === LOOPS.length - 1 && (
                    <div className="sl-meta-block">
                      <div className="sl-meta-label">Completes the loop</div>
                      <p className="sl-meta-body">{loop.feeds}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        ))}
      </div>

      {/* CLOSING */}
      <section className="sl-closing">
        <div className="sl-closing-inner">
          <h2 className="uc-h2">The power isn't in any single loop.<br /><em>It's in all six running at once.</em></h2>
          <p className="uc-body">
            Each loop is powerful in isolation. Reconnaissance without Diagnostic is just monitoring. Diagnostic without Investigative produces findings nobody knows how to prioritise. Investigative without Synthesis produces a ranked list nobody acts on.
          </p>
          <p className="uc-body">
            Together, they form a closed system that observes, understands, prioritises, acts, remembers, and learns — continuously, without stopping, without being asked. That is what makes SelfAudit an operating system and not a tool.
          </p>
          <button className="uc-cta-btn sl-cta" onClick={onBack}>Start Audit</button>
        </div>
      </section>

    </div>
  )
}
