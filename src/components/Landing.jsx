import { useEffect, useState, useCallback } from 'react'
import { usePostHog } from '@posthog/react'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import HeroMatrix from './home/HeroMatrix.jsx'
import OriginMap from './home/OriginMap.jsx'
import './Landing.css'

// ── Burger menu overlay ───────────────────────────────────────────────────────
function BurgerMenu({ onClose, onLogoClick, onNav, onAnchor }) {
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
        <div className="menu-col">
          <div className="menu-eyebrow">Explore</div>
          <div className="menu-group">
            <button className="menu-cat" onClick={() => onAnchor('origin')}>Origin</button>
            <div className="menu-sublist">
              <button className="menu-sublink" onClick={() => onAnchor('sentinel')}>Sentinel</button>
              <button className="menu-sublink" onClick={() => onAnchor('foresight')}>Foresight</button>
              <button className="menu-sublink" onClick={() => onAnchor('counsel')}>Counsel</button>
              <button className="menu-sublink" onClick={() => onAnchor('dispatch')}>Dispatch</button>
            </div>
          </div>
          <div className="menu-group">
            <button className="menu-cat" onClick={() => onNav('about')}>About</button>
          </div>
          <div className="menu-group">
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
export default function Landing({ onStart, onSignUp, session, openMenu, onMenuOpened }) {
  const posthog = usePostHog()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOverDark, setNavOverDark] = useState(true)
  const [demoOpen, setDemoOpen] = useState(false)
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false)
  const [demoName, setDemoName] = useState('')
  const [demoJobTitle, setDemoJobTitle] = useState('')
  const [demoCompany, setDemoCompany] = useState('')
  const [demoCountry, setDemoCountry] = useState('')
  const [demoEmail, setDemoEmail] = useState('')
  const [demoPhone, setDemoPhone] = useState('')
  const [demoNeed, setDemoNeed] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoDone, setDemoDone] = useState(false)
  const [demoError, setDemoError] = useState(null)

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

  const handleDashboard = useCallback(() => {
    posthog?.capture('dashboard_opened', { source: 'landing' })
    window.location.hash = session ? 'home' : 'login'
  }, [posthog, session])

  const openDemoRequest = useCallback(() => {
    posthog?.capture('demo_request_opened', { source: 'landing' })
    setDemoError(null)
    setDemoOpen(true)
  }, [posthog])

  const closeDemoRequest = useCallback(() => {
    if (demoLoading) return
    setDemoOpen(false)
    setDemoError(null)
  }, [demoLoading])

  const submitDemoRequest = useCallback(async (event) => {
    event.preventDefault()
    setDemoError(null)
    if (!demoName.trim()) { setDemoError('Enter your name.'); return }
    if (!demoJobTitle.trim()) { setDemoError('Enter your job title.'); return }
    if (!demoCompany.trim()) { setDemoError('Enter your company name.'); return }
    if (!demoCountry.trim()) { setDemoError('Enter your country.'); return }
    if (!demoEmail.trim()) { setDemoError('Enter your work email.'); return }
    if (!demoPhone.trim()) { setDemoError('Enter your phone number.'); return }
    if (!demoNeed.trim()) { setDemoError('Give us some context.'); return }

    setDemoLoading(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail.trim(),
          message: `Demo request\n\nName: ${demoName.trim()}\nJob title: ${demoJobTitle.trim()}\nCompany: ${demoCompany.trim()}\nCountry: ${demoCountry.trim()}\nWork email: ${demoEmail.trim()}\nPhone number: ${demoPhone.trim()}\n\nContext:\n${demoNeed.trim()}`,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setDemoError(data?.error || 'Could not send your request. Please try again.')
        return
      }
      posthog?.capture('demo_request_submitted', { source: 'landing' })
      setDemoDone(true)
    } catch {
      setDemoError('Could not send your request. Please try again.')
    } finally {
      setDemoLoading(false)
    }
  }, [demoCompany, demoCountry, demoEmail, demoJobTitle, demoName, demoNeed, demoPhone, posthog])

  const openGettingStarted = useCallback(() => {
    posthog?.capture('get_started_opened', { source: 'landing' })
    setGettingStartedOpen(true)
  }, [posthog])

  const handleNav = useCallback((hash) => {
    setMenuOpen(false)
    window.location.hash = hash
  }, [])

  const handleAnchor = useCallback((id) => {
    setMenuOpen(false)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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

  useEffect(() => {
    if (!demoOpen && !gettingStartedOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (demoOpen && !demoLoading) setDemoOpen(false)
      if (gettingStartedOpen) setGettingStartedOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [demoLoading, demoOpen, gettingStartedOpen])

  useEffect(() => {
    let animationFrame = null
    const darkSections = document.querySelectorAll('.sa-home .hero-matrix')

    const updateNavContrast = () => {
      animationFrame = null
      const sampleY = 40
      const isOverDark = Array.from(darkSections).some((sectionEl) => {
        const rect = sectionEl.getBoundingClientRect()
        return rect.top <= sampleY && rect.bottom >= sampleY
      })
      setNavOverDark(isOverDark)
    }

    const scheduleUpdate = () => {
      if (animationFrame !== null) return
      animationFrame = requestAnimationFrame(updateNavContrast)
    }

    updateNavContrast()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (animationFrame !== null) cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div className="sa-home">
      {menuOpen && (
        <BurgerMenu
          onClose={() => setMenuOpen(false)}
          onLogoClick={handleLogoClick}
          onNav={handleNav}
          onAnchor={handleAnchor}
        />
      )}

      {/* NAV */}
      <nav className={`nav ${navOverDark ? 'nav-over-dark' : 'nav-over-light'}`}>
        <div className="wrap nav-inner">
          <a className="logo" href="#" onClick={(e) => { e.preventDefault(); handleLogoClick() }}>SelfAudit</a>
          <div className="nav-actions">
            <button className="nav-cta" onClick={handleDashboard}>Dashboard</button>
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
            <div className="cap" id={cap.name.toLowerCase()} key={cap.name}>
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

      {/* CLOSING ACTIONS */}
      <section className="closing-actions" id="book">
        <div className="wrap">
          <div className="closing-rule" />
          <div className="closing-action-grid reveal">
            <button className="closing-action closing-action-demo" type="button" onClick={openDemoRequest}>
              <span>
                <span className="closing-action-title">Request a Demo</span>
                <span className="closing-action-copy">See SelfAudit applied to the operating questions that matter to you.</span>
              </span>
              <span className="closing-action-arrow" aria-hidden="true">→</span>
            </button>
            <button className="closing-action closing-action-start" type="button" onClick={openGettingStarted}>
              <span>
                <span className="closing-action-title">Get Started</span>
                <span className="closing-action-copy">Review what you need, configure the business, and begin your evaluation.</span>
              </span>
              <span className="closing-action-arrow" aria-hidden="true">→</span>
            </button>
          </div>
          <div className="closing-rule" />
        </div>
      </section>

      {demoOpen && (
        <div className="landing-modal-overlay" role="presentation" onMouseDown={closeDemoRequest}>
          <section className="landing-modal landing-demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-request-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="landing-modal-close" type="button" aria-label="Close demo request" onClick={closeDemoRequest}>×</button>
            {demoDone ? (
              <div className="landing-modal-success">
                <span className="landing-modal-kicker">Request received</span>
                <h2 id="demo-request-title">We’ll take it from here.</h2>
                <p>We’ll review your business context and contact you to arrange a focused demonstration.</p>
                <button className="landing-modal-primary" type="button" onClick={() => { setDemoOpen(false); setDemoDone(false) }}>Return to SelfAudit</button>
              </div>
            ) : (
              <form onSubmit={submitDemoRequest}>
                <span className="landing-modal-kicker">Request a demo</span>
                <h2 id="demo-request-title">Tell us about your business.</h2>
                <p className="landing-modal-intro">Give us enough context to make the conversation useful from the first minute.</p>
                <div className="landing-form-grid">
                  <label>
                    <span>Name</span>
                    <input value={demoName} onChange={(event) => setDemoName(event.target.value)} disabled={demoLoading} autoComplete="name" autoFocus />
                  </label>
                  <label>
                    <span>Job title</span>
                    <input value={demoJobTitle} onChange={(event) => setDemoJobTitle(event.target.value)} disabled={demoLoading} autoComplete="organization-title" />
                  </label>
                  <label>
                    <span>Company</span>
                    <input value={demoCompany} onChange={(event) => setDemoCompany(event.target.value)} disabled={demoLoading} autoComplete="organization" />
                  </label>
                  <label>
                    <span>Country</span>
                    <input value={demoCountry} onChange={(event) => setDemoCountry(event.target.value)} disabled={demoLoading} autoComplete="country-name" />
                  </label>
                  <label>
                    <span>Work email</span>
                    <input type="email" value={demoEmail} onChange={(event) => setDemoEmail(event.target.value)} disabled={demoLoading} autoComplete="email" placeholder="you@company.com" />
                  </label>
                  <label>
                    <span>Phone number</span>
                    <input type="tel" value={demoPhone} onChange={(event) => setDemoPhone(event.target.value)} disabled={demoLoading} autoComplete="tel" placeholder="+1 555 000 0000" />
                  </label>
                </div>
                <label>
                  <span>Give us some context</span>
                  <textarea value={demoNeed} onChange={(event) => setDemoNeed(event.target.value)} disabled={demoLoading} rows={3} placeholder="The decisions, risks, or blind spots you want to improve…" />
                </label>
                {demoError && <p className="landing-form-error" role="alert">{demoError}</p>}
                <button className="landing-modal-primary" type="submit" disabled={demoLoading}>{demoLoading ? 'Sending…' : 'Request the demo'}</button>
              </form>
            )}
          </section>
        </div>
      )}

      {gettingStartedOpen && (
        <div className="landing-modal-overlay" role="presentation" onMouseDown={() => setGettingStartedOpen(false)}>
          <section className="landing-modal landing-guide" role="dialog" aria-modal="true" aria-labelledby="getting-started-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="landing-modal-close" type="button" aria-label="Close getting started guide" onClick={() => setGettingStartedOpen(false)}>×</button>
            <span className="landing-modal-kicker">Before you begin</span>
            <h2 id="getting-started-title">Prepare the business for a useful first run.</h2>
            <p className="landing-modal-intro">SelfAudit becomes valuable when it can see real operating data and judge it against standards you actually use.</p>
            <ol className="landing-readiness-list">
              <li><span>01</span><div><strong>Choose the operating areas.</strong><p>Know which parts of the business you want to monitor first—such as finance, sales, customer service, or operations.</p></div></li>
              <li><span>02</span><div><strong>Gather access to your tools.</strong><p>Have administrator or authorized access ready for the systems you plan to connect.</p></div></li>
              <li><span>03</span><div><strong>Define the standards.</strong><p>Bring the targets or thresholds that describe healthy performance. You can refine them during setup.</p></div></li>
              <li><span>04</span><div><strong>Assign an accountable operator.</strong><p>Someone should own configuration, review signals, and approve any action before it reaches the business.</p></div></li>
            </ol>
            <div className="landing-guide-note"><strong>Evaluation period</strong><span>Your evaluation begins after the initial configuration is usable—not merely when the account is created.</span></div>
          </section>
        </div>
      )}

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
