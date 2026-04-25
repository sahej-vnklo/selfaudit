import React, { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function Login({ onSuccess, onSignup }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(null)
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)

    const timeout = setTimeout(() => {
      setLoading(false)
      setError('Connection timed out. Please try again.')
    }, 8000)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', email: form.email, password: form.password }),
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok || data.error) { setError(friendlyError(data.error || 'Sign in failed.')); return }
      // Fire-and-forget: don't await setSession — it can stall and freeze the button.
      // Pass the session to onSuccess so App updates its state before navigating.
      if (data.session && supabase) {
        supabase.auth.setSession(data.session).catch(err =>
          console.warn('[login] setSession error:', err?.message)
        )
      }
      onSuccess(data.session)
    } catch (e) {
      setError('Connection timed out. Please try again.')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => window.location.hash = ''}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>Welcome back</p>
            <h2 style={s.title}>Log in to your account</h2>
          </div>

          <div style={s.fields}>
            <Field label="Email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@company.com" />
            <Field label="Password" type="password" value={form.password} onChange={v => update('password', v)} placeholder="••••••••"
              onEnter={handleSubmit} />
          </div>

          {error && <p style={s.errorMsg}>{error}</p>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p style={s.switch}>
            Don&apos;t have an account?{' '}
            <button style={s.link} onClick={onSignup}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>{label}</label>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocused : {}) }}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('Invalid login')) return 'Incorrect email or password.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
  return msg
}

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-100)' },
  nav: { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--white)', borderBottom: '0.5px solid var(--gray-200)' },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer' },
  wrap: { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card: { background: 'var(--white)', borderRadius: 'var(--radius)', border: '0.5px solid var(--gray-200)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header: { marginBottom: '2rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3 },
  fields: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' },
  input: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--black)', background: 'var(--white)', transition: 'border-color 0.15s' },
  inputFocused: { borderColor: 'var(--green)', boxShadow: '0 0 0 3px rgba(29,158,117,0.1)' },
  errorMsg: { fontSize: 13, color: '#A32D2D', marginBottom: '1rem' },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1.25rem' },
  switch: { fontSize: 13, color: 'var(--gray-600)', textAlign: 'center' },
  link: { background: 'none', border: 'none', color: 'var(--green)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
