import React from 'react'
import './Voice.css'

// ── Phone transcript data ─────────────────────────────────────────────────────
const TRANSCRIPT = [
  {
    who: 'you',
    text: "What's the biggest risk in the business right now?",
  },
  {
    who: 'sa',
    text: <>Churn in the March cohort is up 34% week-on-week. Root cause: onboarding drop-off at step 3. <strong>If unaddressed, you lose ~$18k MRR by end of month.</strong></>,
  },
  {
    who: 'you',
    text: 'What should I do first?',
  },
  {
    who: 'sa',
    text: <><strong>Pause the new onboarding flow</strong> and route that cohort to manual check-in. I'll flag this for your 9am review.</>,
  },
]

// ── Waveform bars ─────────────────────────────────────────────────────────────
const WAVE_HEIGHTS = [18, 32, 24, 40, 28, 36, 20, 44, 30, 38, 22, 34, 26, 42, 18, 36, 28, 40, 24, 32]

export default function Voice({ onBack }) {
  return (
    <div className="sa-voice">

      {/* NAV */}
      <nav className="voice-nav">
        <button className="voice-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          SelfAudit
        </button>
        <div className="voice-nav-center">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <g stroke="oklch(0.52 0.18 32)" strokeLinejoin="round" strokeLinecap="round" fill="none">
              <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
              <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
              <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
            </g>
          </svg>
          <span>Voice</span>
        </div>
        <button className="voice-nav-cta" onClick={onBack}>Pilot Login</button>
      </nav>

      {/* HERO */}
      <section className="voice-hero">
        <p className="voice-label">Vision</p>
        <h1 className="voice-h1">
          They teach in school that business<br />
          is a separate entity.<br />
          I say why not make it a separate <em>living</em> entity.
        </h1>
      </section>

      {/* DIVIDER */}
      <div className="voice-rule" />

      {/* MAIN — copy + phone */}
      <section className="voice-main">

        <div className="voice-copy">
          <h2 className="voice-h2">
            The next era of business software is a{' '}
            <em>phone call with your business itself.</em>
          </h2>
          <p className="voice-body">
            Not a dashboard. Not an app. A direct line — available any time, from anywhere. Your business picks up. It knows the history, the risks, the numbers, and what needs to happen next.
          </p>
          <p className="voice-body">
            The operating intelligence layer is already live. Memory, diagnosis, synthesis, governance — running now. This builds the voice bridge that makes it feel like a phone call with your business itself.
          </p>
          <p className="voice-body">
            Founders will not open five tools. <strong>They will call the business directly.</strong> That is the category.
          </p>
        </div>

        <div className="voice-phone-col">
          <div className="voice-dial-label">
            DIAL IN ANYTIME —{' '}
            <span className="voice-dial-number">+1 (855) SELFAUDIT</span>
          </div>

          {/* Phone shell */}
          <div className="voice-phone">
            {/* Status bar */}
            <div className="vp-status">
              <span className="vp-time">9:41</span>
              <div className="vp-dots">
                <span /><span /><span />
              </div>
            </div>

            {/* Call info */}
            <div className="vp-call-info">
              <div className="vp-connected">Connected</div>
              <div className="vp-name">Your Business</div>
              <div className="vp-number">+1 (855) SELFAUDIT</div>
              <div className="vp-duration">04:23</div>
            </div>

            {/* Waveform */}
            <div className="vp-wave">
              {WAVE_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  className="vp-wave-bar"
                  style={{ '--h': `${h}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>

            {/* Transcript */}
            <div className="vp-transcript">
              <div className="vp-transcript-label">LIVE TRANSCRIPT</div>
              <div className="vp-messages">
                {TRANSCRIPT.map((msg, i) => (
                  <div key={i} className={`vp-msg vp-msg-${msg.who}`}>
                    <div className="vp-msg-who">{msg.who === 'you' ? 'YOU' : 'SELFAUDIT'}</div>
                    <div className="vp-msg-text">{msg.text}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="vp-controls">
              <button className="vp-ctrl" aria-label="Mute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>
                </svg>
              </button>
              <button className="vp-ctrl vp-hangup" aria-label="End call">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/>
                </svg>
              </button>
              <button className="vp-ctrl" aria-label="Speaker">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* WAITLIST */}
      <section className="voice-waitlist">
        <div className="voice-waitlist-inner">
          <h2 className="voice-waitlist-title">Be first.</h2>
          <p className="voice-waitlist-sub">
            The intelligence is already running. The voice bridge is what's next. Leave your email — we'll reach out when it's ready.
          </p>
          <div className="voice-form">
            <input
              className="voice-input"
              type="email"
              placeholder="your@email.com"
            />
            <button className="voice-submit">Request Access</button>
          </div>
          <p className="voice-form-note">No spam. No newsletters. Just access when it's live.</p>
        </div>
      </section>

    </div>
  )
}
