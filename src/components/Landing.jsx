import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePostHog } from '@posthog/react'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import './Landing.css'

// ── Burger menu overlay ───────────────────────────────────────────────────────
function BurgerMenu({ onClose, onLogoClick }) {
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
              <button className="menu-sublink">The Intelligence Layer</button>
              <button className="menu-sublink">The Six Loops</button>
              <button className="menu-sublink">Integrations</button>
            </div>
          </div>

          <div className="menu-group">
            <button className="menu-cat">Use Cases</button>
            <div className="menu-sublist">
              <button className="menu-sublink">Customer Service</button>
              <button className="menu-sublink">Sales &amp; Marketing</button>
              <button className="menu-sublink">Finance &amp; Accounting</button>
              <button className="menu-sublink">Management &amp; Strategy</button>
            </div>
          </div>

          <div className="menu-group">
            <button className="menu-cat">Impact Studies</button>
          </div>
        </div>

        {/* RIGHT — Commercial + Company */}
        <div className="menu-col right">
          <div className="menu-eyebrow">Commercial</div>

          <div className="menu-group">
            <button className="menu-cat">Pricing</button>
            <div className="menu-sublist">
              <button className="menu-sublink">Professional</button>
              <button className="menu-sublink">Enterprise</button>
            </div>
          </div>

          <div className="menu-divider" />

          <div className="menu-eyebrow">Company</div>
          <div className="menu-stack">
            <button className="menu-cat">About</button>
            <button className="menu-cat">Security</button>
            <button className="menu-cat">Careers</button>
            <button className="menu-cat">Contact</button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Pillar data ───────────────────────────────────────────────────────────────
const PILLARS = [
  { idx: '01', name: 'Reconnaissance', desc: 'We monitor every signal across your business around the clock — systems, markets, conversations, behaviors. Nothing gets missed.' },
  { idx: '02', name: 'Diagnostic',     desc: 'Contextual AI reconstructs the full chain of cause across teams, vendors, and timelines. From noise to root cause, in seconds.' },
  { idx: '03', name: 'Investigative',  desc: 'Every detected event is ranked by real business impact. Triage becomes math, not opinion. Focus always goes where it matters most.' },
  { idx: '04', name: 'Synthesis',      desc: 'Approved playbooks execute autonomously in your existing tools — Slack, SAP, ServiceNow — with full audit trail and provenance.' },
  { idx: '05', name: 'Memory',         desc: 'Post-action verification catches the moment a process starts to drift — long before quarterly review can catch it.' },
  { idx: '06', name: 'Feedback',       desc: 'Every outcome feeds back into the system, making each loop smarter and more precise. The system compounds with every cycle.' },
]

// Vertical centres of each glass plate (fraction of image height, top→bottom)
const PILLAR_CENTERS = [0.262, 0.403, 0.519, 0.625, 0.718, 0.836]
const VH_TOP = 0.058, VH_BOT = 0.074, SIDE_L = 3, SIDE_R = 97

function pillarClipPath(i) {
  const cy  = PILLAR_CENTERS[i]
  const top = ((cy - VH_TOP) * 100).toFixed(1)
  const mid = (cy * 100).toFixed(1)
  const bot = ((cy + VH_BOT) * 100).toFixed(1)
  return `polygon(50% ${top}%, ${SIDE_R}% ${mid}%, 50% ${bot}%, ${SIDE_L}% ${mid}%)`
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function Landing({ onStart, session }) {
  const posthog = usePostHog()

  const [activePillar, setActivePillar] = useState(0)
  const [descVisible,  setDescVisible]  = useState(true)
  const [openFaq,      setOpenFaq]      = useState(null)
  const [menuOpen,     setMenuOpen]     = useState(false)

  const navRef        = useRef(null)
  const heroRef       = useRef(null)
  const heroImgRef    = useRef(null)
  const floatStackRef = useRef(null)
  const stageRef      = useRef(null)
  const pillarsRef    = useRef(null)
  const autoTimerRef  = useRef(null)

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

  // Pillar change with brief fade so text transitions smoothly
  const changePillar = useCallback((i) => {
    if (i === activePillar) return
    setDescVisible(false)
    setTimeout(() => {
      setActivePillar(i)
      setDescVisible(true)
    }, 180)
  }, [activePillar])

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

  // ── Pillar auto-advance ───────────────────────────────────────────────────
  useEffect(() => {
    const start = () => {
      autoTimerRef.current = setInterval(() => {
        setActivePillar(prev => (prev + 1) % 6)
      }, 4200)
    }
    const stop = () => clearInterval(autoTimerRef.current)
    const el = pillarsRef.current
    el?.addEventListener('mouseenter', stop)
    el?.addEventListener('mouseleave', start)
    start()
    return () => {
      stop()
      el?.removeEventListener('mouseenter', stop)
      el?.removeEventListener('mouseleave', start)
    }
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
            <button style={{ fontSize: 15 }}>How It Works</button>
            <button style={{ fontSize: 15 }}>Pricing</button>
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

      {/* PILLARS */}
      <section className="pillars block" id="platform" ref={pillarsRef}>
        <div className="pillars-wrap">

          <div className="pillars-header">
            <div className="eyebrow" />
            <h2 className="h2">Six loops. <em>One system.</em></h2>
            <p className="lede">
              SelfAudit operates through six continuous intelligence loops. Each loop works 24/7. Together, they turn complexity into clarity and action.
            </p>
            <nav className="pillar-nav">
              {PILLARS.map((p, i) => (
                <button
                  key={p.idx}
                  className={`pillar-btn${activePillar === i ? ' active' : ''}`}
                  onClick={() => changePillar(i)}
                  onMouseEnter={() => changePillar(i)}
                >
                  <span className="idx">{p.idx}</span>
                  <span className="name">{p.name}</span>
                  <span className="arrow">›</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="pillars-cube-area">
            <div className="tower-art">
              <img
                className="tower-base"
                src="/assets/platform-stack.png"
                alt="SelfAudit layered intelligence"
                style={{ padding: '5px 0 0' }}
              />
              <img
                className="tower-glow"
                src="/assets/platform-stack.png"
                alt=""
                aria-hidden="true"
                style={{ clipPath: pillarClipPath(activePillar) }}
              />
            </div>
            <div className="pillar-readout">
              <div className="readout-eyebrow">
                {PILLARS[activePillar].idx} — {PILLARS[activePillar].name}
              </div>
              <p className={`readout-desc${descVisible ? ' show' : ''}`}>
                {PILLARS[activePillar].desc}
              </p>
            </div>
          </div>

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
