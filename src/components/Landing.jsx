import { useEffect, useState, useCallback } from 'react'
import { usePostHog } from '@posthog/react'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import HeroMatrix from './home/HeroMatrix.jsx'
import OriginMap from './home/OriginMap.jsx'
import './Landing.css'

// ── Burger menu overlay ───────────────────────────────────────────────────────
function BurgerMenu({ onClose, onLogoClick, onNav }) {
  const [showContact, setShowContact] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactMsg, setContactMsg] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactDone, setContactDone] = useState(false)
  const [contactError, setContactError] = useState(null)

  const handleContact = async () => {
    setContactError(null)
    if (!contactEmail.trim()) { setContactError('Enter your email.'); return }
    if (!contactMsg.trim()) { setContactError('Write a message first.'); return }
    setContactLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactEmail.trim(), message: contactMsg.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setContactError(data?.error || 'Something went wrong.'); return }
      setContactDone(true)
    } catch {
      setContactError('Something went wrong. Try again.')
    } finally {
      setContactLoading(false)
    }
  }

  const closeContact = () => {
    setShowContact(false)
    setContactEmail('')
    setContactMsg('')
    setContactError(null)
    setContactDone(false)
  }

  return (
    <div className="sa-home menu-overlay">
      <header className="menu-top">
        <div className="menu-logo-wrap" onClick={onLogoClick}>
          <span className="menu-logo-text">SelfAudit</span>
        </div>
        <button className="menu-close-btn" onClick={onClose} aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
          Close
        </button>
      </header>

      <div className="menu-body">
        <div className="menu-col left">
          <div className="menu-eyebrow">Explore</div>
          <div className="menu-group">
            <button className="menu-cat">Platform</button>
            <div className="menu-sublist">
              <button className="menu-sublink" onClick={() => onNav('intelligence-layer')}>The Intelligence Layer</button>
              <button className="menu-sublink" onClick={() => onNav('live-ontology')}>Live Ontology</button>
            </div>
          </div>
          <div className="menu-group">
            <button className="menu-cat" onClick={() => onNav('voice')}>What's Next</button>
          </div>
          <div className="menu-group">
            <button className="menu-cat" onClick={() => onNav('capabilities')}>Capabilities</button>
          </div>
        </div>

        <div className="menu-col right">
          <div className="menu-eyebrow">Company</div>
          <div className="menu-stack">
            <button className="menu-cat" onClick={() => onNav('about')}>About</button>
            <button className="menu-cat" onClick={() => setShowContact(true)}>Contact</button>
          </div>
        </div>
      </div>

      {showContact && (
        <div className="menu-contact-overlay" onClick={closeContact}>
          <div className="menu-contact-box" onClick={(e) => e.stopPropagation()}>
            <button className="menu-contact-close" onClick={closeContact}>✕</button>
            {contactDone ? (
              <>
                <h2 className="menu-contact-title">We'll be in touch.</h2>
                <p className="menu-contact-sub">Message received. We'll get back to you shortly.</p>
              </>
            ) : (
              <>
                <h2 className="menu-contact-title">Get in touch.</h2>
                <p className="menu-contact-sub">Write whatever's on your mind. We read everything.</p>
                <div className="menu-contact-fields">
                  <input
                    className="menu-contact-input"
                    type="email"
                    placeholder="your@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={contactLoading}
                    autoFocus
                  />
                  <textarea
                    className="menu-contact-textarea"
                    placeholder="Your message..."
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    disabled={contactLoading}
                    rows={5}
                  />
                </div>
                {contactError && <p className="menu-contact-error">{contactError}</p>}
                <button className="menu-contact-submit" onClick={handleContact} disabled={contactLoading}>
                  {contactLoading ? 'Sending…' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Capability data ───────────────────────────────────────────────────────────
const CAPABILITIES = [
  {
    q: 'What is breaking?',
    name: 'Sentinel',
    desc: 'Continuous loss detection. Margin leaks, churn chains, runway truth — caught, quantified, and ranked before they compound.',
    keys: 'Loss detection · Margin leak · Churn chain · Cash-runway truth',
    frameTitle: 'Sentinel — Loss Detection',
    body: (
      <>
        <div className="alert-hero">
          <span className="tag">High impact detected</span>
          <h6>Margin Leak — Vendor Contracts</h6>
          <span className="amt">$38,200</span>
          <div className="sub">Annualized impact · COGS +2.8% · runway −6.1 days</div>
        </div>
        <div className="flabel" style={{ marginBottom: 8 }}>Active signals — ranked</div>
        <div className="sig-row"><span className="t">Vendor cost per unit increasing <span className="d">· +16% vs contract baseline</span></span><span className="amt">$19,400</span></div>
        <div className="sig-row"><span className="t">Freight surcharges rising <span className="d">· +22% vs baseline</span></span><span className="amt">$11,300</span></div>
        <div className="sig-row"><span className="t">Discount leakage on renewals <span className="d">· +9% vs baseline</span></span><span className="amt">$7,500</span></div>
      </>
    ),
  },
  {
    q: 'What happens if?',
    name: 'Foresight',
    desc: 'Decisions simulated before they are made. A knowledge layer answers what is. Only a causal model answers what if.',
    keys: 'What-if simulation · Scenario comparison · Consequence projection',
    frameTitle: 'Foresight — What-If Simulation',
    body: (
      <>
        <div className="scen-grid">
          <div className="scen">
            <span className="flabel">Scenario A</span>
            <h6>Hire 2 warehouse leads</h6>
            <div className="kv"><span>Investment</span><b>$164,000/yr</b></div>
            <div className="kv"><span>Annual impact</span><b>+$210,000</b></div>
            <div className="kv"><span>Payback</span><b>9.4 months</b></div>
          </div>
          <div className="scen rec">
            <span className="recchip">Recommended</span>
            <h6>Automate inventory reconciliation</h6>
            <div className="kv"><span>Investment</span><b>$22,000/yr</b></div>
            <div className="kv"><span>Annual impact</span><b>+$390,000</b></div>
            <div className="kv"><span>Payback</span><b>2.1 months</b></div>
          </div>
        </div>
        <div className="fore-note">&gt; what if we delay the Q3 price increase by one quarter?<br />margin <span className="hl">−1.8pt through Q3</span> · revenue at risk $46K/mo · runway <span className="hl">−11 days</span></div>
      </>
    ),
  },
  {
    q: 'Why is it happening?',
    name: 'Counsel',
    desc: 'Ask the business anything and receive a verdict backed by the model — the drivers, the evidence, and where automation would pay for itself.',
    keys: 'Ask anything · Root-cause verdicts · AI opportunity mapping',
    frameTitle: 'Counsel — Root Cause',
    body: (
      <>
        <div className="quest">
          <span className="flabel">Question</span>
          What is driving blended CAC up this quarter?
        </div>
        <div className="verdict-card">
          <div>
            <span className="flabel">Verdict</span>
            <p>Primary driver identified: paid spend is concentrated in a saturated channel, pushing budget into lower-intent audiences, while inbound sales-cycle length is up 18%. Channel mix, not creative fatigue, explains most of the increase.</p>
          </div>
          <div className="conf">
            <div className="num">82%</div>
            <span className="flabel">Confidence</span>
          </div>
        </div>
        <div className="drivers">
          <div className="driver"><span className="n">2.1x</span><span className="t">Paid spend concentrated in saturated channel</span></div>
          <div className="driver"><span className="n">1.7x</span><span className="t">Inbound sales-cycle length increase</span></div>
          <div className="driver"><span className="n">1.4x</span><span className="t">Lead quality decline, top-of-funnel</span></div>
        </div>
      </>
    ),
  },
  {
    q: 'Now what?',
    name: 'Dispatch',
    desc: 'From verdict to fix. Every diagnosis ships with its artifact — the SOP, the sequence, the brief — executed only on approval.',
    keys: 'Execution artifacts · SOPs · Sequences · Board reports',
    frameTitle: 'Dispatch — Execution Queue',
    body: (
      <>
        <div className="flabel" style={{ marginBottom: 8 }}>Artifacts — from verdict #147</div>
        <div className="art-row"><span className="t">channel_reallocation_plan</span><span className="status approved">Approved · Executed</span></div>
        <div className="art-row"><span className="t">inbound_sales_cycle_playbook</span><span className="status ready">Awaiting approval</span></div>
        <div className="art-row"><span className="t">paid_spend_reduction_sop.pdf</span><span className="status ready">Awaiting approval</span></div>
        <div className="art-row"><span className="t">board_update_q3.pdf</span><span className="status approved">Approved · Delivered</span></div>
        <div className="approve-note">Nothing executes without operator approval</div>
      </>
    ),
  },
]

const FrameDots = () => (
  <>
    <span className="fdot" /><span className="fdot" /><span className="fdot" />
  </>
)

// ── Component ─────────────────────────────────────────────────────────────────
export default function Landing({ onStart, session, openMenu, onMenuOpened }) {
  const posthog = usePostHog()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (openMenu) {
      setMenuOpen(true)
      onMenuOpened?.()
    }
  }, [openMenu, onMenuOpened])

  const handleLogoClick = useCallback(() => {
    if (session) {
      window.location.hash = 'dashboard'
    } else {
      window.location.href = '/'
    }
  }, [session])

  const handleStartAudit = useCallback(() => {
    posthog?.capture('audit_started', { source: 'landing' })
    if (session) {
      onStart('')
    } else {
      window.location.hash = 'login'
    }
  }, [posthog, onStart, session])

  const handleNav = useCallback((hash) => {
    setMenuOpen(false)
    window.location.hash = hash
  }, [])

  // ── Reveal-on-scroll for section copy ─────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.sa-home .reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.15 })
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="sa-home">
      {menuOpen && (
        <BurgerMenu
          onClose={() => setMenuOpen(false)}
          onLogoClick={handleLogoClick}
          onNav={handleNav}
        />
      )}

      {/* NAV */}
      <nav className="nav">
        <div className="wrap nav-inner">
          <a className="logo" href="#" onClick={(e) => { e.preventDefault(); handleLogoClick() }}>SelfAudit</a>
          <div className="nav-actions">
            <button className="nav-cta" onClick={handleStartAudit}>Book a Demo</button>
            <div className="nav-icon-group" aria-hidden="true">
              <button className="nav-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)} />
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero-slot">
        <HeroMatrix />
      </header>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="wrap">
          <p className="reveal">Our software models the <span className="dim">causal structure</span> of a business — every area, every relationship, every standard — and powers every decision with what it knows: what is breaking, why, and what happens next.</p>
        </div>
      </section>

      {/* ORIGIN */}
      <section className="origin" id="origin">
        <div className="wrap">
          <div className="wordmark reveal">Origin</div>
          <p className="origin-tag reveal">The causal model of the business. The system of record for cause and effect.</p>

          <div className="frame reveal">
            <div className="frame-bar">
              <FrameDots />
              <span className="frame-title">SelfAudit — Origin · Business Model · Causal Structure</span>
            </div>
            <div className="frame-body origin-body">
              <div className="fmap-slot"><OriginMap /></div>
              <aside className="overview-panel">
                <span className="flabel">Model Overview</span>
                <p>This is your business, modeled — not a generic industry benchmark. Every area above is built from your real data and your real standards, and Origin already knows how they affect each other: what a slip in one causes downstream, and how fast. That connected model is what every signal, simulation, and verdict in SelfAudit is grounded in.</p>
              </aside>
            </div>
          </div>

          <ul className="origin-points">
            <li className="reveal"><span className="k">Modeled, not indexed</span><span className="v">Not a pile of documents or a dashboard of metrics. A working model of how the business behaves — areas, relationships, time lags, consequences.</span></li>
            <li className="reveal"><span className="k">Your standards</span><span className="v">Every threshold is defined by the operator. Margin above 60%. Response under 4 hours. Runway never below 8 months. Origin holds the line continuously.</span></li>
            <li className="reveal"><span className="k">Cause and effect</span><span className="v">Origin models how one decision ripples through every part of the business — a pricing change touching margin this quarter, retention the next. Every capability below runs on that model.</span></li>
          </ul>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="caps" id="capabilities">
        <div className="wrap">
          <span className="label">Built on Origin</span>
          <p className="caps-intro reveal">Four capabilities, operational from the day the business is modeled. Each one answers a question every operator carries.</p>

          {CAPABILITIES.map((cap) => (
            <div className="cap" key={cap.name}>
              <div className="cap-text reveal">
                <div className="q">{cap.q}</div>
                <div className="wordmark">{cap.name}</div>
                <p className="desc">{cap.desc}</p>
                <span className="keys">{cap.keys}</span>
              </div>
              <div className="frame reveal">
                <div className="frame-bar">
                  <FrameDots />
                  <span className="frame-title">{cap.frameTitle}</span>
                </div>
                <div className="frame-body">{cap.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ENGAGEMENT */}
      <section className="engagement" id="engagement">
        <div className="wrap">
          <h2 className="reveal">Deployed with you.<br />Not downloaded by you.</h2>
          <div className="eng-grid reveal">
            <div className="eng-card">
              <span className="n">01 — THE DEMO</span>
              <h4>The system, live</h4>
              <p>Thirty minutes. A real problem traced through a modeled business — signal, chain, verdict, fix.</p>
            </div>
            <div className="eng-card">
              <span className="n">02 — THE MODELING</span>
              <h4>Origin, built for you</h4>
              <p>In the first week we map your areas, define your standards, and connect your data. The business leaves modeled.</p>
            </div>
            <div className="eng-card">
              <span className="n">03 — THE WATCH</span>
              <h4>Continuous operation</h4>
              <p>Sentinel runs against your standards permanently. Verdicts when something breaks. Execution only on your approval.</p>
            </div>
          </div>
          <div className="security-line">
            <span className="k">Security</span>
            <span>Customer data is encrypted, isolated per deployment, and never used for training. Full documentation available in the demo.</span>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="closing" id="book">
        <div className="wrap">
          <h2 className="reveal">Every business deserves<br /><span className="dim">to know why.</span></h2>
          <button className="btn inverse" onClick={handleStartAudit}>Book a Demo</button>
        </div>
      </section>

      <footer>
        <div className="wrap foot-inner">
          <span>© 2026 SelfAudit — Enterprise Intelligence</span>
          <span>
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">Privacy</a>
            <a href={TERMS_HASH}>Terms</a>
            <a href="#">Security</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
