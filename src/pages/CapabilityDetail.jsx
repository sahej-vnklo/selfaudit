import React from 'react'
import { CAPABILITY_DETAILS } from './capabilityDetailData.js'
import './CapabilityDetail.css'

const BackArrow = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11.5 3.5L6 9l5.5 5.5" />
  </svg>
)

const ForwardArrow = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
)

export default function CapabilityDetail({ capability, onBack, onNavigate }) {
  const detail = CAPABILITY_DETAILS[capability]

  if (!detail) return null

  const nextDetail = CAPABILITY_DETAILS[detail.next]

  return (
    <div className={`capability-detail capability-${capability}`}>
      <nav className="capability-detail-nav" aria-label={`${detail.name} navigation`}>
        <div className="capability-detail-nav-inner">
          <button className="capability-detail-logo" type="button" onClick={onBack}>
            SelfAudit
          </button>
          <button className="capability-detail-explore" type="button" onClick={onBack}>
            <BackArrow /> Explore
          </button>
        </div>
      </nav>

      <main>
        <header className="capability-detail-hero">
          <div className="capability-detail-wrap capability-detail-hero-grid">
            <div>
              <span className="capability-detail-index">Capability {detail.index}</span>
              <p className="capability-detail-question">{detail.question}</p>
              <h1>{detail.name}</h1>
            </div>
            <div className="capability-detail-hero-copy">
              <h2>{detail.headline}</h2>
              <p>{detail.intro}</p>
              <ul className="capability-detail-tags" aria-label={`${detail.name} capabilities`}>
                {detail.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
          </div>
        </header>

        <section className="capability-detail-analogy" aria-labelledby={`${capability}-plain-language`}>
          <div className="capability-detail-wrap capability-detail-analogy-grid">
            <span className="capability-detail-section-label">In plain English</span>
            <div>
              <h2 id={`${capability}-plain-language`}>{detail.analogyTitle}</h2>
              <p>{detail.analogy}</p>
            </div>
          </div>
        </section>

        <section className="capability-detail-flow" aria-labelledby={`${capability}-flow`}>
          <div className="capability-detail-wrap">
            <span className="capability-detail-section-label">How it works</span>
            <h2 id={`${capability}-flow`}>{detail.flowTitle}</h2>
            <div className="capability-detail-flow-grid">
              {detail.flow.map((step, index) => (
                <React.Fragment key={step.number}>
                  <article className="capability-detail-flow-step">
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                  {index < detail.flow.length - 1 && <span className="capability-detail-flow-arrow" aria-hidden="true">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section className="capability-detail-example" aria-labelledby={`${capability}-example`}>
          <div className="capability-detail-wrap capability-detail-example-grid">
            <div className="capability-detail-example-copy">
              <span className="capability-detail-section-label">{detail.exampleLabel}</span>
              <h2 id={`${capability}-example`}>{detail.exampleTitle}</h2>
              <p>{detail.exampleSetup}</p>
            </div>
            <div className="capability-detail-example-visual">
              <article>
                <span>{detail.exampleBefore.label}</span>
                <strong>{detail.exampleBefore.value}</strong>
                <p>{detail.exampleBefore.note}</p>
              </article>
              <div className="capability-detail-example-connector" aria-hidden="true">
                <span />
                <ForwardArrow />
              </div>
              <article className="is-result">
                <span>{detail.exampleAfter.label}</span>
                <strong>{detail.exampleAfter.value}</strong>
                <p>{detail.exampleAfter.note}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="capability-detail-truth" aria-labelledby={`${capability}-truth`}>
          <div className="capability-detail-wrap">
            <span className="capability-detail-section-label">What the promise means</span>
            <h2 id={`${capability}-truth`}>Useful intelligence without pretending certainty.</h2>
            <div className="capability-detail-truth-grid">
              {detail.truths.map((truth, index) => (
                <article key={truth.title}>
                  <span>0{index + 1}</span>
                  <h3>{truth.title}</h3>
                  <p>{truth.body}</p>
                </article>
              ))}
            </div>
            <aside className="capability-detail-guardrail">
              <span>Boundary</span>
              <p>{detail.guardrail}</p>
            </aside>
          </div>
        </section>

        <section className="capability-detail-next">
          <div className="capability-detail-wrap">
            <button type="button" onClick={() => onNavigate(detail.next)}>
              <span>
                <small>Continue through the system</small>
                <strong>{nextDetail.name}</strong>
                <em>{nextDetail.question}</em>
              </span>
              <ForwardArrow />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
