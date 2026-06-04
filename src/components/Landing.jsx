import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePostHog } from '@posthog/react'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import './Landing.css'

// ── Burger menu overlay ───────────────────────────────────────────────────────
function BurgerMenu({ onClose, onLogoClick, onNav }) {
  const [showContact,   setShowContact]   = useState(false)
  const [contactEmail,  setContactEmail]  = useState('')
  const [contactMsg,    setContactMsg]    = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactDone,   setContactDone]   = useState(false)
  const [contactError,  setContactError]  = useState(null)

  const handleContact = async () => {
    setContactError(null)
    if (!contactEmail.trim()) { setContactError('Enter your email.'); return }
    if (!contactMsg.trim())   { setContactError('Write a message first.'); return }
    setContactLoading(true)
    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: contactEmail.trim(), message: contactMsg.trim() }),
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
    <div className="sa-land menu-overlay">

      {/* Top bar */}
      <header className="menu-top">
        <div className="menu-logo-wrap" onClick={onLogoClick}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <g stroke="oklch(0.52 0.18 32)" strokeLinejoin="round" strokeLinecap="round" fill="none">
              <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
              <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
              <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
            </g>
          </svg>
          <span className="menu-logo-text">SelfAudit</span>
        </div>
        <button className="menu-close-btn" onClick={onClose} aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
          Close
        </button>
      </header>

      {/* Body */}
      <div className="menu-body">

        {/* LEFT — Explore */}
        <div className="menu-col left">
          <div className="menu-eyebrow">Explore</div>

          <div className="menu-group">
            <button className="menu-cat">Platform</button>
            <div className="menu-sublist">
              <button className="menu-sublink" onClick={() => onNav('intelligence-layer')}>The Intelligence Layer</button>
              <button className="menu-sublink" onClick={() => onNav('six-loops')}>The Six Loops</button>
            </div>
          </div>

          <div className="menu-group">
            <button className="menu-cat">Use Cases</button>
            <div className="menu-sublist">
              <button className="menu-sublink" onClick={() => onNav('use-case-customer-service')}>Customer Service</button>
              <button className="menu-sublink" onClick={() => onNav('use-case-sales-marketing')}>Sales &amp; Marketing</button>
              <button className="menu-sublink" onClick={() => onNav('use-case-finance-accounting')}>Finance &amp; Accounting</button>
              <button className="menu-sublink" onClick={() => onNav('use-case-management-strategy')}>Management &amp; Strategy</button>
            </div>
          </div>
        </div>

        {/* RIGHT — Commercial + Company */}
        <div className="menu-col right">
          <div className="menu-eyebrow">Commercial</div>

          <div className="menu-eyebrow">Company</div>
          <div className="menu-stack">
            <button className="menu-cat">About</button>
            <button className="menu-cat" onClick={() => setShowContact(true)}>Contact</button>
          </div>
        </div>

      </div>

      {/* Contact modal */}
      {showContact && (
        <div className="menu-contact-overlay" onClick={closeContact}>
          <div className="menu-contact-box" onClick={e => e.stopPropagation()}>
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
                    onChange={e => setContactEmail(e.target.value)}
                    disabled={contactLoading}
                    autoFocus
                  />
                  <textarea
                    className="menu-contact-textarea"
                    placeholder="Your message..."
                    value={contactMsg}
                    onChange={e => setContactMsg(e.target.value)}
                    disabled={contactLoading}
                    rows={5}
                  />
                </div>
                {contactError && <p className="menu-contact-error">{contactError}</p>}
                <button
                  className="menu-contact-submit"
                  onClick={handleContact}
                  disabled={contactLoading}
                >
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

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Do I need connectors before it becomes useful?',
    a: 'No. SelfAudit starts with what you know about your business. Connectors deepen the system over time — but the operation does not wait for perfect data to begin diagnosing.',
  },
  {
    q: "What's the closest thing to SelfAudit that already exists?",
    a: "A $2M war room. A permanent team of analysts, a CFO, a process consultant, and a risk officer — running simultaneously, 24/7. That's what this is. At $1,188 a year.",
  },
  {
    q: 'When do I need Enterprise?',
    a: "When one operator isn't enough. Enterprise deploys SelfAudit as an intelligence layer across your entire organization — every team, every function, running from the same live diagnosis. Custom compliance, security controls, and SSO included. The difference between one person using intelligence and an entire business operating on it.",
  },
  {
    q: 'What are the four operating lanes?',
    a: "Customer Service. Marketing & Sales. Finance & Accounting. Management & Strategy. SelfAudit watches all four simultaneously, flags what's drifting, and tells you which one is bleeding first. Then it tells you exactly how to fix it — specific actions, sequenced. It doesn't report problems. It closes them.\n\nGive it a goal. It builds the entire operation to reach it.",
  },
]

// ── Lane data ─────────────────────────────────────────────────────────────────
const LANES = [
  {
    name: 'Customer Service',
    metrics: ['Response time vs SLA', 'Ticket volume & resolution', 'Recurring issue patterns', 'Single points of failure'],
    scenario: "Flags the moment response time starts trending before it breaches. Names the agent who's carrying too much.",
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3 18c0-3.314 3.134-6 7-6s7 2.686 7 6"/></svg>,
  },
  {
    name: 'Sales & Marketing',
    metrics: ['Pipeline health & velocity', 'Deal stall detection', 'Outreach activity gaps', 'Conversion by source'],
    scenario: "Surfaces the deals marked active that haven't moved in 60 days. Shows you real pipeline, not what the CRM says it is.",
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14l4.5-4.5 3 3L14 7l3.5 2.5"/><path d="M14 5h3.5v3.5"/></svg>,
  },
  {
    name: 'Finance & Accounting',
    metrics: ['Margin by product/service', 'Burn rate & runway', 'LTV:CAC & churn signals', 'Overdue receivables'],
    scenario: "Finds the service priced at 55% margin but delivering at 31%. The gap is absorbed by scope creep nobody's tracking.",
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v16"/><path d="M6.5 5.5C6.5 4.12 8.07 3 10 3s3.5 1.12 3.5 2.5S12 8 10 8s-3.5 1.12-3.5 2.5S8.07 13 10 13s3.5 1.12 3.5 2.5S12 17 10 17s-3.5-1.12-3.5-2.5"/></svg>,
  },
  {
    name: 'Management & Strategy',
    metrics: ['Goal progress & blockers', 'Execution follow-through', 'Repeated priority patterns', 'Team bottlenecks'],
    scenario: "Notices when you set the same goal two years in a row. Names the blocker you keep stepping around.",
    icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="2.5" width="6" height="6" rx="1"/><rect x="11.5" y="2.5" width="6" height="6" rx="1"/><rect x="2.5" y="11.5" width="6" height="6" rx="1"/><rect x="11.5" y="11.5" width="6" height="6" rx="1"/></svg>,
  },
]

// ── Artifact data ─────────────────────────────────────────────────────────────
const ARTIFACTS = [
  { name: 'Outreach Email',  desc: 'Ready-to-send. Personalized to the specific opportunity surfaced.',       icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="13" rx="2"/><path d="M2 7l8 5 8-5"/></svg> },
  { name: 'Process SOP',     desc: 'Step-by-step operational playbook to fix the diagnosed gap.',             icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M8 7h4M8 10h4M8 13h2"/></svg> },
  { name: 'Team Brief',      desc: 'Share findings with your team. The what, the why, the what next.',        icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="2.8"/><circle cx="14" cy="7" r="2.8"/><path d="M1 17c0-2.5 2.686-4.5 6-4.5M9 17c0-2.5 2.686-4.5 6-4.5"/></svg> },
  { name: 'Action Plan',     desc: 'Sequenced steps, ranked by impact, with owners and timelines.',           icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 10l2 2 4-4"/></svg> },
  { name: 'Hiring Brief',    desc: 'Role definition built from the actual gap the business has.',             icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="16" height="11" rx="2"/><path d="M7 6V5a3 3 0 0 1 6 0v1"/></svg> },
  { name: 'PDF Report',      desc: 'Full audit report. Shareable with board, investors, or advisors.',        icon: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9M7 9l3 3 3-3"/><path d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"/></svg> },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function Landing({ onStart, session, openMenu, onMenuOpened }) {
  const posthog = usePostHog()

  const [openFaq,  setOpenFaq]  = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (openMenu) {
      setMenuOpen(true)
      onMenuOpened?.()
    }
  }, [openMenu, onMenuOpened])

  const navRef        = useRef(null)
  const heroRef       = useRef(null)
  const heroImgRef    = useRef(null)
  const floatStackRef = useRef(null)
  const stageRef      = useRef(null)

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

  // ── Nav scrolled state ────────────────────────────────────────────────────
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Hero parallax — mouse + scroll RAF loop ───────────────────────────────
  useEffect(() => {
    const heroImg = heroImgRef.current
    const hero    = heroRef.current
    if (!heroImg || !hero) return

    let mx = 0, my = 0, tmx = 0, tmy = 0
    let scrollY = 0, tScrollY = 0
    let rafId

    const onMouseMove = (e) => {
      const r = hero.getBoundingClientRect()
      if (e.clientY > r.bottom || e.clientY < r.top) return
      tmx = (e.clientX / r.width) - 0.5
      tmy = ((e.clientY - r.top) / r.height) - 0.5
    }
    const onScroll = () => { tScrollY = window.scrollY }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('scroll', onScroll, { passive: true })

    const tick = () => {
      mx      += (tmx - mx) * 0.07
      my      += (tmy - my) * 0.07
      scrollY += (tScrollY - scrollY) * 0.12

      const heroH = hero.offsetHeight
      const t     = Math.min(1, scrollY / heroH)
      const trZ   = -t * 80
      const trY   = t * -60
      const scl   = 1 + (1 - t) * 0.04 + Math.abs(mx) * 0.005

      heroImg.style.transform =
        `translateY(${trY}px) translateZ(${trZ}px) rotateX(${-my * 4}deg) rotateY(${mx * 6}deg) scale(${scl})`

      const fs = floatStackRef.current
      if (fs) {
        const r   = fs.getBoundingClientRect()
        const off = (window.innerHeight / 2 - (r.top + r.bottom) / 2) / window.innerHeight
        fs.style.transform = `rotateY(${-off * 4}deg) rotateX(${off * 6}deg)`
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // ── Stage cards magnify on scroll-into-view ───────────────────────────────
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const fire = () => {
      stage.classList.remove('cards-in')
      void stage.offsetWidth
      stage.classList.add('cards-in')
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? fire() : stage.classList.remove('cards-in'))
    }, { threshold: 0.35 })
    io.observe(stage)
    return () => io.disconnect()
  }, [])

  // ── Verdict 3-D tilt ─────────────────────────────────────────────────────
  const handleVerdictMove  = (e) => {
    const c = e.currentTarget, r = c.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top)  / r.height
    c.style.transform = `rotateX(${-(y - 0.5) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateY(-4px)`
    c.style.setProperty('--mx', (x * 100) + '%')
    c.style.setProperty('--my', (y * 100) + '%')
  }
  const handleVerdictLeave = (e) => { e.currentTarget.style.transform = '' }

  // ── FAQ toggle ────────────────────────────────────────────────────────────
  const toggleFaq = (i) => setOpenFaq(prev => prev === i ? null : i)

  return (
    <div className="sa-land">

      {/* NAV */}
      <nav className="nav" ref={navRef} style={{ height: 80 }}>
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div className="logo-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <defs>
                <filter id="saNavGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ff3d1f" floodOpacity="0.9" />
                </filter>
              </defs>
              <g filter="url(#saNavGlow)" stroke="#ff3d1f" strokeLinejoin="round" strokeLinecap="round" fill="none">
                <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
                <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
                <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
              </g>
            </svg>
          </div>
          <span className="logo-text" style={{ fontSize: 27 }}>SelfAudit</span>
        </div>
        <div className="nav-right">
          <div className="nav-links">
            <button style={{ fontSize: 15, color: 'var(--ember-glow)' }} onClick={() => { window.location.hash = 'voice' }}>Coming Soon</button>
            <button style={{ fontSize: 15 }} onClick={() => { window.location.hash = 'how-it-works' }}>How It Works</button>
          </div>
          <button className="nav-cta" onClick={handleStartAudit} style={{ fontSize: 17, height: 43, marginLeft: 18 }}>
            Start Audit
          </button>
          <button className="nav-burger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero" ref={heroRef}>
        <div className="hero-stage">
          <div className="hero-img-wrap" ref={heroImgRef}>
            <img src="/assets/hero.png" alt="" className="hero-img" />
          </div>
          <div className="hero-vignette" />
          <div className="hero-grain" />
        </div>
        <div className="hero-content" />
      </section>

      {/* STATEMENT */}
      <section className="statement">
        <p className="statement-heading">
          Performant software was never a luxury.<br />
          Strategic intelligence still is.<br />
          Until now.
        </p>
        <p className="statement-body">
          SelfAudit is the intelligence layer that never sleeps — autonomous, continuous, surfacing what matters the most.
        </p>
      </section>

      {/* PROBLEM */}
      <section className="problem block">
        <h2 className="h2">The problem isn't the data.<br />It's that nobody is connecting it.</h2>
        <div className="problem-card">
          <div className="problem-eyebrow">Cross-Department Root Cause</div>
          <p className="problem-quote">
            "Your hiring freeze caused your support backlog, which drove your churn, which is{' '}
            <span className="problem-quote-em">shortening your runway.</span>"
          </p>
          <p className="problem-body">
            No single tool sees this. HubSpot knows your pipeline. Stripe knows your revenue. Zendesk knows your tickets. SelfAudit knows how all three connect — and tells you before it becomes a crisis.
          </p>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto">
        <div className="manifesto-inner">
          <p className="manifesto-punch">
            McKinsey sells it. Palantir builds it. Bloomberg rents fragments of it.<br />
            SelfAudit puts it directly in your hands.
          </p>
          <p className="manifesto-body">
            Six continuous analytical loops running inside your business 24/7 — surfacing inefficiencies, compounding decisions in real time.
          </p>
          <p className="manifesto-pull">
            What Fortune 500s pay millions for is now accessible the moment you log in.
          </p>
          <p className="manifesto-close">ALL YOURS</p>
        </div>
      </section>

      {/* FOUR LANES */}
      <section className="four-lanes block">
        <h2 className="h2">All four parts of your business. <em>Simultaneously.</em></h2>
        <p className="lede">
          No single person can watch Customer Service, Sales, Finance, and Strategy at once with equal attention. SelfAudit does. And when Sales is closing bad-fit deals that are straining delivery and spiking support tickets — it traces the chain.
        </p>
        <div className="lanes-grid">
          {LANES.map(lane => (
            <div className="lane-card" key={lane.name}>
              <div className="lane-icon-wrap">{lane.icon}</div>
              <h3 className="lane-name">{lane.name}</h3>
              <ul className="lane-metrics">
                {lane.metrics.map(m => <li key={m}>{m}</li>)}
              </ul>
              <p className="lane-scenario">{lane.scenario}</p>
            </div>
          ))}
        </div>
      </section>

      {/* YOUR STANDARDS */}
      <section className="standards block">
        <div className="standards-inner">
          <div className="standards-panel">
            <div className="standards-panel-label">Your Defined Standards</div>
            <div className="standards-compare">
              <div className="standards-col standards-generic">
                <div className="standards-col-head">Generic AI</div>
                {[['SLA','Industry average'],['Margin','Benchmark'],['Pipeline','Best practice'],['Churn','SaaS median']].map(([k,v]) => (
                  <div className="standards-row" key={k}>
                    <span className="std-key">{k}</span>
                    <span className="std-val-dim">{v}</span>
                  </div>
                ))}
              </div>
              <div className="standards-col standards-yours">
                <div className="standards-col-head">SelfAudit</div>
                {[['SLA','4hrs (yours)'],['Margin','>60% (yours)'],['Pipeline','10+ deals (yours)'],['Churn','<2%/mo (yours)']].map(([k,v]) => (
                  <div className="standards-row" key={k}>
                    <span className="std-key">{k}</span>
                    <span className="std-val-ember">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="standards-copy">
            <h2 className="h2">Not the average business. <em>Your business.</em></h2>
            <p className="lede">
              Every threshold, every standard, every definition of healthy is yours. A 24-hour SLA is excellent for a volume support team and catastrophic for a premium service firm. SelfAudit doesn't assume. You define what good looks like across all four lanes — and the system flags the moment your operation drifts from your own standard.
            </p>
            <div className="standards-callout">
              <strong>Your standards, not ours.</strong>{' '}
              <em>Pipeline should have 10+ active deals. Gross margin must stay above 60%. Customer response under 4 hours. Runway never below 8 months. Once you set them, the system watches them — continuously, not quarterly.</em>
            </div>
          </div>
        </div>
      </section>

      {/* ARTIFACTS */}
      <section className="artifacts block">
        <div className="artifacts-inner">
          <div className="artifacts-copy">
            <h2 className="h2">Not just what to do. <em>The thing that does it.</em></h2>
            <p className="lede">
              Most intelligence tools tell you there's a problem. SelfAudit hands you the tool to fix it. Every diagnosis produces a ready-to-use artifact — the outreach email, the process SOP, the team brief, the hiring spec. Not a recommendation to think about. The actual deliverable. From diagnosis to done in one session.
            </p>
            <div className="artifacts-callout">
              <strong>The highest-retention feature in the product.</strong>{' '}
              <em>Founders who generate artifacts weekly are deeply integrated — the product produces things they share, implement, and send. The artifact becomes the evidence that SelfAudit is doing its job. That's a very hard habit to walk away from.</em>
            </div>
          </div>
          <div className="artifacts-grid">
            {ARTIFACTS.map(a => (
              <div className="artifact-card" key={a.name}>
                <div className="artifact-icon-wrap">{a.icon}</div>
                <div>
                  <div className="artifact-name">{a.name}</div>
                  <div className="artifact-desc">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STAGE — live view */}
      <section className="stage" ref={stageRef}>
        <div className="stage-inner">
          <div>
            <div className="eyebrow" />
            <h2 className="h2">The system that already knows what's breaking.</h2>
            <p className="lede" style={{ marginTop: 24 }}>
              No switching between tools. No waiting for reports. SelfAudit surfaces what needs attention — and what to do next — before you think to ask.
            </p>
            <div style={{ marginTop: 36 }}>
              <button className="btn btn-primary" onClick={handleStartAudit} style={{ fontSize: 16, height: 43 }}>
                Start Audit
              </button>
            </div>
          </div>

          <div className="float-stack" ref={floatStackRef}>
            {/* Card 1 — live signal scan */}
            <div className="float-card float-card-1">
              <div className="fc-header">
                <span className="fc-title">LIVE SIGNAL SCAN</span>
                <span className="fc-status">Detecting</span>
              </div>
              <div className="fc-big">17 signals</div>
              <div className="fc-small">Across support, sales, finance, and strategy.<br />4 require attention.</div>
              <div className="fc-chart">
                <svg viewBox="0 0 320 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="saChartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%"   stopColor="oklch(0.65 0.18 35)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="oklch(0.65 0.18 35)" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,40 C30,38 50,30 80,32 C110,34 130,18 160,20 C190,22 210,8 240,12 C270,16 290,28 320,22 L320,60 L0,60 Z"
                    fill="url(#saChartGrad)"
                  />
                  <path
                    d="M0,40 C30,38 50,30 80,32 C110,34 130,18 160,20 C190,22 210,8 240,12 C270,16 290,28 320,22"
                    fill="none" stroke="oklch(0.7 0.18 38)" strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* Card 2 — root cause queue */}
            <div className="float-card float-card-2">
              <div className="fc-header">
                <span className="fc-title">ROOT CAUSE QUEUE</span>
                <span className="fc-status">Ranked</span>
              </div>
              <div className="fc-row">
                <span className="label">Pipeline too thin</span>
                <span className="value" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ember-glow)' }}>Critical</span>
              </div>
              <div className="fc-row">
                <span className="label">Margin leak detected</span>
                <span className="value" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-dim)' }}>High</span>
              </div>
              <div className="fc-row">
                <span className="label">Follow-up gap</span>
                <span className="value" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-dim)' }}>High</span>
              </div>
              <div className="fc-row">
                <span className="label">Founder bottleneck</span>
                <span className="value" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-mute)' }}>Watch</span>
              </div>
            </div>

            {/* Card 3 — consultant-grade finding */}
            <div className="float-card float-card-3">
              <div className="fc-header">
                <span className="fc-title">CONSULTANT-GRADE FINDING</span>
                <span className="fc-status">Executing</span>
              </div>
              <div className="fc-big" style={{ fontSize: 14, lineHeight: 1.6 }}>
                Pause the next hire.<br /><br />
                Redesign the sales-to-delivery handoff before adding headcount.<br /><br />
                The business is not short on people.<br />
                It is losing capacity through unclear ownership.
              </div>
              <div className="fc-small" style={{ marginTop: 10 }}>
                Install a single handoff owner and weekly exception review.
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map(i => (
                  <span key={i} style={{ height: 4, flex: 1, background: 'var(--ember)', borderRadius: 2 }} />
                ))}
                <span style={{ height: 4, flex: 1, background: 'var(--line-2)', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERDICTS */}
      <section className="verdicts block" style={{ padding: '110px 48px 140px' }}>
        <div className="eyebrow" />
        <h2 className="h2">Not testimonials. <em>Verdicts.</em></h2>
        <p className="lede">
          We don't surface what operators want to hear. We surface what operations need to know — before the damage compounds.
        </p>

        <div className="verdicts-grid">
          {[
            {
              sev: 'Critical', high: false, cat: 'Vendor Risk',
              quote: '"Your vendor SLA breach was flagged 11 days before your ops team knew it existed."',
              outcome: <><strong>Rerouted in 4 hours.</strong> $2.1M in exposure recovered before it reached a single dashboard.</>,
            },
            {
              sev: 'Critical', high: false, cat: 'Process Drift',
              quote: '"Three teams were running the same manual exception process. None knew the others existed."',
              outcome: <><strong>Policy unified in 48 hours.</strong> 60% reduction in redundant operational work across regions.</>,
            },
            {
              sev: 'High', high: true, cat: 'Inventory',
              quote: "\"You don't have a stock problem. You have a forecasting problem dressed as one.\"",
              outcome: 'SKU-4421 rerouted. $840k in SLA penalties avoided. Inside one loop, no escalation.',
            },
            {
              sev: 'High', high: true, cat: 'Compliance',
              quote: '"Your approval workflow had 14 steps. SelfAudit closed it in 3 — inside policy — without asking."',
              outcome: <><strong>11 days to first action.</strong> Zero manual escalation. Full audit trail. Completely autonomous.</>,
            },
          ].map((v, i) => (
            <div
              key={i}
              className="verdict-card"
              onMouseMove={handleVerdictMove}
              onMouseLeave={handleVerdictLeave}
            >
              <div className="vc-label">
                <span className={`vc-severity${v.high ? ' high' : ''}`}>{v.sev}</span>
                <span className="vc-sep">·</span>
                <span className="vc-category">{v.cat}</span>
              </div>
              <p className="vc-quote">{v.quote}</p>
              <div className="vc-outcome">{v.outcome}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ECONOMICS */}
      <section className="economics block" style={{ padding: '130px 48px 150px' }}>
        <div className="eyebrow" />
        <h2 className="h2 econ-headline">
          Strategic intelligence used to belong to the <em>Fortune 500.</em>
        </h2>
        <p className="lede econ-lede">Here's what it cost them. Here's what it costs now.</p>

        <div className="econ-grid">
          <div className="econ-card">
            <div className="econ-label">McKinsey</div>
            <div className="econ-price">$500K–$5M</div>
            <p className="econ-desc">Periodic strategic intelligence. Brilliant, expensive, and gone the moment the engagement ends.</p>
          </div>
          <div className="econ-card">
            <div className="econ-label">Bloomberg</div>
            <div className="econ-price">$30K<span className="unit">/yr</span></div>
            <p className="econ-desc">World-class market intelligence. It still does not know your customers, pipeline, margins, or stalled priorities.</p>
          </div>
          <div className="econ-card">
            <div className="econ-label">Fractional COO</div>
            <div className="econ-price">$60K–$180K<span className="unit">/yr</span></div>
            <p className="econ-desc">Human pattern recognition on a part-time schedule. Helpful, but bounded by hours, memory, and access.</p>
          </div>
          <div className="econ-card is-featured">
            <div className="econ-label">SELFAUDIT</div>
            <div className="econ-price">$1,188<span className="unit">/yr</span></div>
            <p className="econ-desc">Continuous strategic intelligence operation. Always watching. Always diagnosing. Always getting sharper.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq block" style={{ padding: '130px 48px 150px' }}>
        <div className="faq-head">
          <h2 className="h2" style={{ maxWidth: 'none', whiteSpace: 'nowrap' }}>
            Fair Questions. <em>Already Answered</em>
          </h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div
              key={i}
              className={`faq-item${openFaq === i ? ' open' : ''}`}
              tabIndex={0}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleFaq(i)}
            >
              <button className="faq-q" onClick={() => toggleFaq(i)}>
                {item.q}
                <span className="faq-sign" />
              </button>
              <div className="faq-a-wrap">
                <div className="faq-a-inner">
                  <p className="faq-a">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="demo">
        <div className="final-cta-glow" />
        <div className="final-cta-inner">
          <div className="final-cta-eyebrow" />
          <h2 className="final-cta-title">Stop guessing.<br />Start knowing.</h2>
          <p className="final-cta-sub">
            The business is already emitting the truth. The operation is whether you can hear it in time.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleStartAudit}
            style={{ marginTop: 8, fontSize: 17, padding: '16px 32px', height: 51 }}
          >
            Start Audit
          </button>
        </div>
      </section>

      {/* BURGER MENU — portal to body so position:fixed escapes hero's perspective/transform context */}
      {menuOpen && createPortal(
        <BurgerMenu
          onClose={() => setMenuOpen(false)}
          onLogoClick={() => { setMenuOpen(false); handleLogoClick() }}
          onNav={(hash) => { setMenuOpen(false); window.location.hash = hash }}
        />,
        document.body
      )}

      {/* FOOTER */}
      <footer className="site-footer" id="company">
        <div className="site-footer-inner">
          <div className="site-footer-brand">
            <div className="site-footer-logo">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <g stroke="#c94a28" strokeLinejoin="round" strokeLinecap="round" fill="none">
                  <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
                  <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
                  <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
                </g>
              </svg>
              <span style={{ fontSize: 24 }}>SelfAudit</span>
            </div>
          </div>
          <nav className="site-footer-nav">
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16 }}>
              Privacy Policy
            </a>
            <a href={TERMS_HASH} style={{ fontSize: 15 }}>
              Terms of Service
            </a>
          </nav>
        </div>
        <div className="site-footer-bottom">
          <span style={{ fontSize: 11 }}>© 2026 SelfAudit. All rights reserved.</span>
          <span style={{ fontSize: 11 }}>Built for operators.</span>
        </div>
      </footer>

    </div>
  )
}
