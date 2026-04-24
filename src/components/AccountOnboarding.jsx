import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AccountOnboarding({ user, onComplete }) {
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    if (context.trim()) {
      await supabase.from('profiles').update({ context: context.trim() }).eq('id', user.id)
    }
    setLoading(false)
    onComplete()
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>One last thing</p>
            <h2 style={s.title}>What are you working on?</h2>
            <p style={s.sub}>This helps us personalise every audit to your situation. You can update it any time.</p>
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Your business or project <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={s.textarea}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. A bootstrapped SaaS for HR teams, 8 employees, pre-revenue..."
              rows={4}
            />
          </div>

          <button
            style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Go to dashboard →'}
          </button>

          <button style={s.skip} onClick={onComplete}>Skip for now</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-100)' },
  nav: { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--white)', borderBottom: '0.5px solid var(--gray-200)' },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  wrap: { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card: { background: 'var(--white)', borderRadius: 'var(--radius)', border: '0.5px solid var(--gray-200)', padding: '2.5rem', width: '100%', maxWidth: 480, animation: 'fadeUp 0.4s ease' },
  header: { marginBottom: '2rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8 },
  sub: { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 },
  fieldWrap: { marginBottom: '1.75rem' },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--gray-800)', marginBottom: 6 },
  textarea: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--black)', background: 'var(--white)', resize: 'vertical', lineHeight: 1.6 },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', marginBottom: '0.75rem' },
  skip: { width: '100%', background: 'none', border: 'none', fontSize: 13, color: 'var(--gray-400)', cursor: 'pointer', textAlign: 'center', padding: '8px' },
}
