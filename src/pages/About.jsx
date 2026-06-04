import React from 'react'
import './UseCases.css'
import './About.css'

const BackArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5" />
  </svg>
)

export default function About({ onBack }) {
  return (
    <div className="about-page">

      {/* Nav */}
      <nav className="about-nav">
        <button className="about-back" onClick={onBack}>
          <BackArrow /> Back
        </button>
        <div className="about-logo">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <g stroke="oklch(0.52 0.18 32)" strokeLinejoin="round" strokeLinecap="round" fill="none">
              <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
              <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
              <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
            </g>
          </svg>
          SelfAudit
        </div>
      </nav>

      {/* Hero */}
      <section className="about-hero">
        <div className="about-eyebrow">About</div>
        <h1>Built by someone who lived inside the problem.</h1>
      </section>

      {/* Founder */}
      <section className="about-founder">
        <div className="about-founder-inner">

          {/* Left */}
          <div className="about-founder-left">
            <img
              className="about-founder-photo"
              src="/assets/founder.jpg"
              alt="Sahej Singh, Founder of SelfAudit"
            />
            <p className="about-founder-name">Sahej Singh</p>
            <p className="about-founder-title">Founder</p>
          </div>

          {/* Right */}
          <div className="about-founder-right">
            <p className="about-lead">
              I spent a decade inside operations and customer experience — watching the same problems surface, compound, and get discovered too late. Not because the people were bad. Because the visibility wasn't there.
            </p>
            <p>
              Operators were running on gut feel and delayed reports. By the time something reached a dashboard or a weekly meeting, it had already cost real money and real customers. The fix existed — it just required a consultant nobody could afford, or an analyst nobody had time to train.
            </p>
            <p>
              I built SelfAudit because I wanted the kind of clarity that used to require a $500/hour advisor to be available to any business, any size, any stage. Not a dashboard. Not another alert. A diagnosis — with a specific, sequenced fix attached.
            </p>
            <p>
              We're early. A small group of pilots are using it now, and a waitlist is forming for the full product. If you're an operator who's ever felt like you're running blind — this was built for you.
            </p>
          </div>

        </div>
      </section>

      <hr className="about-divider" />

      {/* Mission */}
      <section className="about-mission">
        <p className="about-mission-quote">
          "The clarity that used to require an expensive advisor should be available to every operator — not just the ones who can afford the room."
        </p>
      </section>

    </div>
  )
}
