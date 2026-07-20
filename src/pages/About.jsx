import React from 'react'
import './UseCases.css'
import './About.css'

const PRINCIPLES = [
  {
    number: '01',
    title: 'Evidence before confidence.',
    body: 'SelfAudit should distinguish what the data proves, what the system estimates, and what still requires human judgment.',
  },
  {
    number: '02',
    title: 'The business is one system.',
    body: 'A problem rarely stays inside one department. Intelligence should connect the effects across customers, revenue, delivery, people, and risk.',
  },
  {
    number: '03',
    title: 'Clarity must lead somewhere.',
    body: 'A useful diagnosis explains what changed, why it matters, and the next decision—without burying the operator in another dashboard.',
  },
  {
    number: '04',
    title: 'Control remains human.',
    body: 'The system can prepare and prioritize work, but consequential action should remain visible, reviewable, and governed by the operator.',
  },
]

const OPERATING_LOOP = [
  { label: 'See', detail: 'Monitor the standards and signals that define a healthy business.' },
  { label: 'Understand', detail: 'Connect evidence across operating areas to explain cause and consequence.' },
  { label: 'Decide', detail: 'Model the likely trade-offs before committing the business.' },
  { label: 'Act', detail: 'Turn approved decisions into controlled, traceable execution.' },
]

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function About({ onBack }) {
  return (
    <div className="sa-uc about-page">
      <nav className="uc-nav" aria-label="About navigation">
        <button className="uc-back" type="button" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">About</div>
      </nav>

      <main>
        <section className="about-hero">
          <p className="about-eyebrow">About SelfAudit</p>
          <h1>A business should not have to discover important problems late.</h1>
          <p className="about-hero-copy">
            SelfAudit is building an operating intelligence layer that helps a company see what is changing, understand why it matters, and decide what to do next.
          </p>
        </section>

        <section className="about-purpose" aria-labelledby="about-purpose-title">
          <div className="about-purpose-copy">
            <p className="about-section-label">Why we exist</p>
            <h2 id="about-purpose-title">Most businesses have data. They still lack a shared view of reality.</h2>
          </div>
          <div className="about-purpose-body">
            <p>
              Important evidence is scattered across tools, departments, meetings, and individual judgment. Reports describe isolated outcomes. Dashboards wait for someone to ask the right question. By the time the pattern becomes obvious, the cost is already real.
            </p>
            <p>
              SelfAudit grew from years spent inside business operations, watching capable people make difficult decisions with incomplete context. The problem was not effort. The missing layer was continuous, connected judgment.
            </p>
          </div>
        </section>

        <section className="about-mission" aria-labelledby="about-mission-title">
          <p className="about-section-label about-section-label-light">Our mission</p>
          <h2 id="about-mission-title">Give every operator a living, evidence-grounded understanding of the business.</h2>
          <p>
            Not another place to inspect charts. A system that watches the standards the business cares about, reasons across operating areas, makes uncertainty visible, and carries an approved decision toward execution.
          </p>
        </section>

        <section className="about-loop" aria-labelledby="about-loop-title">
          <div className="about-loop-heading">
            <p className="about-section-label">The operating loop</p>
            <h2 id="about-loop-title">From fragmented information to controlled action.</h2>
          </div>
          <div className="about-loop-grid">
            {OPERATING_LOOP.map((step, index) => (
              <article className="about-loop-step" key={step.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.label}</h3>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-principles" aria-labelledby="about-principles-title">
          <div className="about-principles-heading">
            <p className="about-section-label">How we build</p>
            <h2 id="about-principles-title">Principles before features.</h2>
            <p>These are the boundaries SelfAudit is intended to preserve as the product grows.</p>
          </div>
          <div className="about-principles-grid">
            {PRINCIPLES.map((principle) => (
              <article className="about-principle" key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-vision" aria-labelledby="about-vision-title">
          <p className="about-section-label">Our vision</p>
          <h2 id="about-vision-title">A company that can understand itself while there is still time to act.</h2>
          <p>
            We believe operating intelligence should become a permanent capability of the business—not an occasional report, a consulting engagement, or knowledge that disappears when one person leaves the room.
          </p>
        </section>
      </main>
    </div>
  )
}
