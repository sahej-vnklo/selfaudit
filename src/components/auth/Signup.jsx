import React, { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function Signup({ onSuccess, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)
  const [emailSent, setEmailSent] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'At least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setGlobalError(null)
    if (!validate()) return
    setLoading(true)

    const timeout = setTimeout(() => {
      setLoading(false)
      setGlobalError('Connection timed out. Please try again.')
    }, 8000)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', email: form.email, password: form.password, name: form.name }),
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok || data.error) { setGlobalError(friendlyError(data.error || 'Sign up failed.')); return }
      // session is null when email confirmation is required
      if (data.session) {
        // Fire-and-forget: don't await setSession — it can stall and freeze the button.
        // Pass the session to onSuccess so App updates its state before navigating.
        if (supabase) {
          supabase.auth.setSession(data.session).catch(err =>
            console.warn('[signup] setSession error:', err?.message)
          )
        }
        onSuccess(data.session)
      } else {
        setEmailSent(true)
      }
    } catch (e) {
      clearTimeout(timeout)
      setGlobalError('Connection error. Please try again.')
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  // Email confirmation pending state
  if (emailSent) {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.logo} onClick={() => { window.location.hash = '' }}>
            self<span style={{ color: 'var(--green)' }}>audit</span>
          </div>
        </nav>
        <div style={s.wrap}>
          <div style={s.card}>
            <p style={s.eyebrow}>Almost there</p>
            <h2 style={s.title}>Check your email</h2>
            <p style={{ fontSize: 15, color: 'var(--gray-600)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a confirmation link to <strong style={{ color: 'var(--black)' }}>{form.email}</strong>.
              Click it to activate your account, then come back and log in.
            </p>
            <button style={{ ...s.btn, marginTop: 28 }} onClick={onLogin}>
              Go to login
            </button>
          </div>
        </div>
      </div>
    )
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
            <p style={s.eyebrow}>Create account</p>
            <h2 style={s.title}>Start your first audit</h2>
            <p style={s.sub}>Free to start. No credit card required.</p>
          </div>

          <div style={s.fields}>
            <Field label="Your name" type="text" value={form.name} onChange={v => update('name', v)} placeholder="Jane Smith" error={errors.name} required />
            <Field label="Email address" type="email" value={form.email} onChange={v => update('email', v)} placeholder="jane@company.com" error={errors.email} required />
            <Field label="Password" type="password" value={form.password} onChange={v => update('password', v)} placeholder="Min. 8 characters" error={errors.password} required onEnter={handleSubmit} />
          </div>

          {globalError && <p style={s.errorMsg}>{globalError}</p>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create free account'}
          </button>

          <p style={s.privacy}>
            By signing up you agree to our terms. Your data is only used to run and store your audits.
          </p>

          <p style={s.switch}>
            Already have an account?{' '}
            <button style={s.link} onClick={onLogin}>Log in</button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, error, required, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>
        {label}
        {required && <span style={{ color: 'var(--green)', marginLeft: 3 }}>*</span>}
      </label>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocused : {}), ...(error ? s.inputError : {}) }}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
      {error && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{error}</p>}
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('already registered')) return 'An account with this email already exists.'
  if (msg.includes('Password should')) return 'Password must be at least 8 characters.'
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
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8 },
  sub: { fontSize: 14, color: 'var(--gray-600)' },
  fields: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' },
  input: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--black)', background: 'var(--white)', transition: 'border-color 0.15s' },
  inputFocused: { borderColor: 'var(--green)', boxShadow: '0 0 0 3px rgba(29,158,117,0.1)' },
  inputError: { borderColor: '#E24B4A' },
  errorMsg: { fontSize: 13, color: '#A32D2D', marginBottom: '1rem' },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1rem' },
  privacy: { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.5, marginBottom: '1.25rem' },
  switch: { fontSize: 13, color: 'var(--gray-600)', textAlign: 'center' },
  link: { background: 'none', border: 'none', color: 'var(--green)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
