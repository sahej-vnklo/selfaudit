import React, { useState } from 'react'

export default function Landing({ onStart }) {
  const [hovered, setHovered] = useState(false)

  const domains = [
    'Business strategy', 'Operations', 'Sales', 'Marketing',
    'Finance', 'People & culture', 'Technology', 'Product',
    'Side projects', 'Startups', 'Career', 'Personal goals', 'Anything else'
  ]

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={() => window.location.reload()}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.navRight}>
          by <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: 'var(--green)', fontWeight: 500 }}>Vnklo</a>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.badge}>
          <span style={styles.dot} />
          Free · No signup required · No AI hype
        </div>

        <h1 style={styles.h1}>
          Does your business<br />
          <em style={styles.em}>actually need AI?</em>
        </h1>

        <p style={styles.sub}>
          A 5-minute audit that cuts through the noise. Find out where AI genuinely helps — and where something else is broken first.
        </p>

        <button
          style={{ ...styles.cta, ...(hovered ? styles.ctaHover : {}) }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onStart}
        >
          Start your free audit
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8 }}>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <p style={styles.subtext}>Works for businesses, startups, side projects & personal goals</p>

        <div style={styles.pillsWrap}>
          <p style={styles.pillsLabel}>Covers every domain</p>
          <div style={styles.pills}>
            {domains.map(d => (
              <span key={d} style={styles.pill}>{d}</span>
            ))}
          </div>
        </div>
      </main>

      <section style={styles.promises}>
        {[
          {
            icon: '→',
            title: "We'll tell you if AI isn't the answer.",
            body: "Sometimes it's a process problem, a people problem, or a cash-flow problem. We'll name it directly."
          },
          {
            icon: '→',
            title: 'No bias during the audit.',
            body: "The conversation is completely neutral. AI recommendations only appear in your final report — never mid-audit."
          },
          {
            icon: '→',
            title: "Questions you haven't thought to ask.",
            body: "Built on real consulting frameworks. Expect to be challenged — even if you've been running things for years."
          }
        ].map((p, i) => (
          <div key={i} style={styles.promise}>
            <div style={styles.promiseIcon}>{p.icon}</div>
            <div>
              <p style={styles.promiseTitle}>{p.title}</p>
              <p style={styles.promiseBody}>{p.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>
        Built by <a href="https://vnklo.com" target="_blank" rel="noopener" style={{ color: 'var(--green)' }}>Vnklo</a> — AI systems for businesses that are ready for them.
      </footer>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2.5rem',
    borderBottom: '0.5px solid var(--gray-200)',
    position: 'sticky', top: 0, background: 'var(--white)', zIndex: 10,
  },
  logo: { fontSize: 17, fontWeight: 500, fontFamily: 'var(--sans)', letterSpacing: '-0.5px' },
  navRight: { fontSize: 13, color: 'var(--gray-600)' },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '5rem 2rem 4rem', maxWidth: 680, margin: '0 auto', width: '100%'
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'var(--green-light)', color: 'var(--green-dark)',
    fontSize: 12, fontWeight: 500, padding: '5px 14px',
    borderRadius: 'var(--radius-pill)', marginBottom: '2rem'
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
    display: 'inline-block'
  },
  h1: {
    fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 6vw, 52px)',
    fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.5px',
    marginBottom: '1.5rem', color: 'var(--black)'
  },
  em: { fontStyle: 'italic', color: 'var(--green)' },
  sub: {
    fontSize: 17, color: 'var(--gray-600)', lineHeight: 1.7,
    maxWidth: 460, marginBottom: '2.5rem'
  },
  cta: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, padding: '14px 28px',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    marginBottom: '0.75rem'
  },
  ctaHover: { background: 'var(--green-dark)', transform: 'translateY(-1px)' },
  subtext: { fontSize: 12, color: 'var(--gray-400)', marginBottom: '3rem' },
  pillsWrap: { width: '100%' },
  pillsLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--gray-400)', marginBottom: '0.75rem'
  },
  pills: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: {
    fontSize: 12, color: 'var(--gray-600)',
    background: 'var(--gray-100)', border: '0.5px solid var(--gray-200)',
    padding: '4px 12px', borderRadius: 'var(--radius-pill)'
  },
  promises: {
    maxWidth: 560, margin: '0 auto', padding: '0 2rem 4rem',
    borderTop: '0.5px solid var(--gray-200)',
    paddingTop: '3rem',
  },
  promise: {
    display: 'flex', gap: '1rem', alignItems: 'flex-start',
    padding: '1rem 0', borderBottom: '0.5px solid var(--gray-200)'
  },
  promiseIcon: {
    fontSize: 16, color: 'var(--green)', fontWeight: 500,
    marginTop: 2, flexShrink: 0
  },
  promiseTitle: { fontSize: 14, fontWeight: 500, color: 'var(--black)', marginBottom: 4 },
  promiseBody: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 },
  footer: {
    textAlign: 'center', fontSize: 12, color: 'var(--gray-400)',
    padding: '2rem', borderTop: '0.5px solid var(--gray-200)'
  }
}
