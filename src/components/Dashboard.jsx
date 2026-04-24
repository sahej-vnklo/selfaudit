import React from 'react'
import { supabase } from '../lib/supabase.js'

export default function Dashboard({ user, onSignOut, onStartAudit }) {
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={s.navRight}>
          <span style={s.userEmail}>{user?.email}</span>
          <button style={s.signOutBtn} onClick={onSignOut}>Sign out</button>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.welcomeRow}>
          <div>
            <p style={s.eyebrow}>Dashboard</p>
            <h1 style={s.heading}>Welcome back, {name}.</h1>
            <p style={s.sub}>Your audit history and account will live here.</p>
          </div>
        </div>

        <div style={s.placeholder}>
          <div style={s.placeholderInner}>
            <p style={s.placeholderIcon}>📋</p>
            <p style={s.placeholderTitle}>No audits yet</p>
            <p style={s.placeholderSub}>Run your first audit to see your results here.</p>
            <button style={s.ctaBtn} onClick={onStartAudit}>
              Start your first audit →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-100)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2.5rem', background: 'var(--white)', borderBottom: '0.5px solid var(--gray-200)',
  },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  userEmail: { fontSize: 13, color: 'var(--gray-600)' },
  signOutBtn: { fontSize: 13, color: 'var(--gray-600)', background: 'none', border: '0.5px solid var(--gray-200)', padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  main: { maxWidth: 720, margin: '0 auto', padding: '3rem 2rem' },
  welcomeRow: { marginBottom: '2.5rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  heading: { fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, lineHeight: 1.2, marginBottom: 8 },
  sub: { fontSize: 15, color: 'var(--gray-600)' },
  placeholder: { background: 'var(--white)', border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '4rem 2rem' },
  placeholderInner: { textAlign: 'center' },
  placeholderIcon: { fontSize: 32, marginBottom: 16 },
  placeholderTitle: { fontSize: 16, fontWeight: 500, color: 'var(--black)', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: 'var(--gray-600)', marginBottom: 24 },
  ctaBtn: { display: 'inline-flex', alignItems: 'center', background: 'var(--green)', color: 'white', fontSize: 14, fontWeight: 500, padding: '11px 22px', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer' },
}
