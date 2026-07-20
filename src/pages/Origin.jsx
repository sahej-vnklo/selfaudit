import React from 'react'
import './Origin.css'

const MODEL_LAYERS = [
  {
    number: '01',
    title: 'Areas',
    body: 'The parts of the company you operate: Finance, Sales, Customer Service, Product, People, or the structure that fits your business.',
  },
  {
    number: '02',
    title: 'Measures',
    body: 'The metrics that describe each area, where their values come from, and whether the evidence is current enough to trust.',
  },
  {
    number: '03',
    title: 'Standards',
    body: 'Your targets, thresholds, and definitions of healthy performance. The operator sets the rules; SelfAudit watches them.',
  },
  {
    number: '04',
    title: 'Relationships',
    body: 'The links that explain how movement in one part of the business can create pressure somewhere else.',
  },
]

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

export default function Origin({ onBack }) {
  const openSentinel = () => {
    window.location.hash = 'origin/sentinel'
  }

  return (
    <div className="origin-page">
      <nav className="origin-page-nav" aria-label="Origin navigation">
        <div className="origin-page-nav-inner">
          <button className="origin-page-logo" type="button" onClick={onBack}>SelfAudit</button>
          <button className="origin-page-explore" type="button" onClick={onBack}><BackArrow /> Explore</button>
        </div>
      </nav>

      <main>
        <header className="origin-page-hero">
          <div className="origin-page-wrap origin-page-hero-grid">
            <div>
              <span className="origin-page-label">The foundation</span>
              <p className="origin-page-question">What does SelfAudit understand before it gives an answer?</p>
              <h1>Origin</h1>
            </div>
            <div className="origin-page-hero-copy">
              <h2>The model every decision is grounded in.</h2>
              <p>
                Origin describes how your business is structured, what it measures, what healthy performance means, and how its operating areas relate. Sentinel, Foresight, Counsel, and Dispatch all reason from this shared foundation.
              </p>
            </div>
          </div>
        </header>

        <section className="origin-page-analogy" aria-labelledby="origin-analogy-title">
          <div className="origin-page-wrap origin-page-analogy-grid">
            <span className="origin-page-label">In plain English</span>
            <div>
              <h2 id="origin-analogy-title">A map and rulebook for the business.</h2>
              <p>
                A normal dashboard knows that numbers exist. Origin records what those numbers mean, where they belong, what good looks like, and which other parts of the company they may affect. It gives every capability the same operating context instead of making each one guess from raw data.
              </p>
            </div>
          </div>
        </section>

        <section className="origin-page-model" aria-labelledby="origin-model-title">
          <div className="origin-page-wrap">
            <span className="origin-page-label">The model</span>
            <h2 id="origin-model-title">Built from the language your business already uses.</h2>
            <div className="origin-page-model-grid">
              {MODEL_LAYERS.map((layer) => (
                <article key={layer.number}>
                  <span>{layer.number}</span>
                  <h3>{layer.title}</h3>
                  <p>{layer.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="origin-page-example" aria-labelledby="origin-example-title">
          <div className="origin-page-wrap origin-page-example-grid">
            <div>
              <span className="origin-page-label">A simple example</span>
              <h2 id="origin-example-title">One change becomes a business consequence.</h2>
              <p>Origin gives SelfAudit the connected context to examine a chain, while keeping observed facts separate from modeled judgment.</p>
            </div>
            <div className="origin-page-chain" aria-label="Example relationship from support response time to cash pressure">
              <article><small>Customer Service</small><strong>Response time rises</strong></article>
              <span aria-hidden="true">→</span>
              <article><small>Customer</small><strong>Renewal risk increases</strong></article>
              <span aria-hidden="true">→</span>
              <article><small>Finance</small><strong>Runway faces pressure</strong></article>
            </div>
          </div>
        </section>

        <section className="origin-page-boundary" aria-labelledby="origin-boundary-title">
          <div className="origin-page-wrap origin-page-boundary-grid">
            <span className="origin-page-label">What the promise means</span>
            <div>
              <h2 id="origin-boundary-title">Structured context, not a magical digital clone.</h2>
              <p>
                Origin is only as useful as the configuration and evidence behind it. It does not invent missing relationships or turn uncertain inputs into facts. Its job is to make the business model explicit, inspectable, and reusable across every decision surface.
              </p>
            </div>
          </div>
        </section>

        <section className="origin-page-next">
          <div className="origin-page-wrap">
            <button type="button" onClick={openSentinel}>
              <span>
                <small>See the model at work</small>
                <strong>Sentinel</strong>
                <em>What needs attention now?</em>
              </span>
              <ForwardArrow />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
