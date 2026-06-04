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
      <nav className="uc-nav">
        <button className="uc-back" onClick={onBack}><BackArrow /> SelfAudit</button>
        <div className="uc-nav-center">About</div>
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
