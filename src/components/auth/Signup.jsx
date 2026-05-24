import React, { useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../../lib/legal.js'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_BORDER,
  DARK_HERO_SURFACE,
  DARK_INPUT_BG,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_BORDER,
  LIGHT_HERO_SURFACE,
  LIGHT_INPUT_BG,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED,
  LIGHT_TEXT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_BORDER,
  SHARP_HERO_SURFACE,
  SHARP_INPUT_BG,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_TEXT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../../lib/sharpTheme.js'

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    border: DARK_BORDER,
    text: DARK_TEXT,
    textSoft: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    accent: DARK_ACCENT,
    accentSoft: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    inputBg: DARK_INPUT_BG,
    error: DARK_RED,
    danger: DARK_RED,
    placeholder: DARK_TEXT_MUTED,
    buttonText: DARK_TEXT,
    focusRing: 'rgba(183,154,146,0.18)',
  },
  light: {
    bg: LIGHT_PAGE_BG,
    surface: LIGHT_HERO_SURFACE,
    surface2: LIGHT_PANEL_SURFACE,
    border: LIGHT_BORDER,
    text: LIGHT_TEXT,
    textSoft: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    accent: LIGHT_ACCENT,
    accentSoft: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    inputBg: LIGHT_INPUT_BG,
    error: LIGHT_RED,
    danger: LIGHT_RED,
    placeholder: LIGHT_TEXT_MUTED,
    buttonText: '#FBF7F2',
    focusRing: 'rgba(169,141,134,0.14)',
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    border: SHARP_BORDER,
    text: SHARP_TEXT,
    textSoft: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    accent: SHARP_ACCENT,
    accentSoft: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    inputBg: SHARP_INPUT_BG,
    error: SHARP_RED,
    danger: SHARP_RED,
    placeholder: SHARP_TEXT_MUTED,
    buttonText: SHARP_TEXT,
    focusRing: 'rgba(107,140,255,0.18)',
  },
}

function getThemeVars(theme) {
  const C = THEMES[theme] || THEMES.dark
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--border': C.border,
    '--text': C.text,
    '--text-soft': C.textSoft,
    '--text-muted': C.textMuted,
    '--accent': C.accent,
    '--accent-soft': C.accentSoft,
    '--accent-text': C.accentText,
    '--input-bg': C.inputBg,
    '--error': C.error,
    '--danger': C.danger,
    '--placeholder': C.placeholder,
    '--button-text': C.buttonText,
    '--focus-ring': C.focusRing,
  }
}

export default function Signup({ onLogin }) {
  return <SignupForm onLogin={onLogin} />
}

function SignupForm({ onLogin }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)

  const [name,  setName]                = useState('')
  const [email, setEmail]               = useState('')
  const [code, setCode]                 = useState('')
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash.startsWith('signup?plan=')) {
      const plan = hash.split('plan=')[1]
      if (['foundation', 'intelligence'].includes(plan)) return plan
    }
    return 'foundation'
  })
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [codeSent, setCodeSent]         = useState(false)
  const [otpType, setOtpType]           = useState('signup')

  const rememberPlanIntent = () => {
    localStorage.setItem(PENDING_AUTH_INTENT_KEY, JSON.stringify({ plan: selectedPlan, at: Date.now() }))
  }

  const handleSendCode = async () => {
    setError(null)
    if (!name.trim()) { setError('Enter your name first.'); return }
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true)
    try {
      rememberPlanIntent()
      const response = await fetch('/api/send-auth-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          mode: 'signup',
          origin: window.location.origin,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Could not send sign-in code.')
      setOtpType(data?.otpType || 'signup')
      setCodeSent(true)
      setCode('')
    } catch (e) {
      localStorage.removeItem(PENDING_AUTH_INTENT_KEY)
      setError(friendlyError(e?.message || 'Could not send sign-in code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)
    if (!code.trim()) { setError('Enter the 6-digit code first.'); return }
    setLoading(true)
    try {
      const sb = await initSupabase()
      const { error: verifyError } = await sb.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: otpType || 'signup',
      })
      if (verifyError) throw verifyError
    } catch (e) {
      setError(friendlyError(e?.message || 'Could not verify that code.'))
    } finally {
      setLoading(false)
    }
  }

  if (codeSent) {
    return (
      <div style={{ ...themeVars, ...s.page }}>
        <nav style={s.nav}>
          <div style={s.logo} onClick={() => { window.location.hash = '' }}>
            self<span style={{ color: 'var(--accent)' }}>audit</span>
          </div>
        </nav>
        <div style={s.wrap}>
          <div style={s.card}>
            <p style={s.eyebrow}>Check your inbox</p>
            <h2 style={s.title}>Enter your account code</h2>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Enter it here on this device to create your account, then we&apos;ll take you straight into checkout for the {selectedPlan === 'intelligence' ? 'Intelligence' : 'Foundation'} plan.
            </p>
            <CodeField value={code} onChange={setCode} onEnter={handleVerifyCode} />
            {error && <p style={{ ...s.errorMsg, marginTop: 12 }}>{error}</p>}
            <button style={{ ...s.btn, marginTop: 20, opacity: loading ? 0.7 : 1 }} onClick={handleVerifyCode} disabled={loading}>
              {loading ? 'Verifying…' : 'Create account'}
            </button>
            <button style={s.secondaryBtn} onClick={() => { setCodeSent(false); setCode(''); setError(null) }}>
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...themeVars, ...s.page }}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => window.location.hash = ''}>
          self<span style={{ color: 'var(--accent)' }}>audit</span>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={s.headline}>
          <h1 style={s.headlineText}>Audit your business.<br />Fix what matters.</h1>
        </div>

        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>Create account</p>
            <h2 style={s.title}>Start your first audit</h2>
            <p style={s.sub}>Choose a plan to get started. Billing happens after account creation.</p>
          </div>

          {/* Plan selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-soft)', marginBottom: 10 }}>
              Choose plan
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SIGNUP_PLANS.map(p => {
                const sel = selectedPlan === p.key
                return (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlan(p.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                      border: sel ? '1.5px solid var(--accent)' : '0.5px solid var(--border)',
                      background: sel ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: sel ? '5px solid var(--accent)' : '1.5px solid var(--border)',
                      background: 'var(--surface)', transition: 'all 0.15s',
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      {p.popular && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'var(--accent)', color: 'var(--button-text)', padding: '1px 7px', borderRadius: 100 }}>
                          Popular
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: sel ? 'var(--accent-text)' : 'var(--text)' }}>
                      {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-soft)' }}>/mo</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Auth */}
          <div style={s.authStack}>
            <input
              style={s.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
            />
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
            />

            {error && <p style={s.errorMsg}>{error}</p>}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSendCode} disabled={loading}>
              {loading ? 'Sending…' : 'Email me a code'}
            </button>
          </div>

          <p style={s.privacy}>
            By signing up, you agree to our{' '}
            <a href={TERMS_HASH} style={s.legalLink}>Terms of Service</a>
            {' '}and{' '}
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={s.legalLink}>Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  )
}

const SIGNUP_PLANS = [
  { key: 'foundation',    name: 'Foundation',    price: '$29' },
  { key: 'intelligence',  name: 'Intelligence',  price: '$99', popular: true },
]

function friendlyError(msg) {
  if (msg.includes('already registered')) return 'An account with this email already exists.'
  if (msg.includes('An account with this email already exists.')) return 'An account with this email already exists.'
  if (msg.includes('Token has expired') || msg.includes('expired')) return 'That code expired. Request a new one.'
  if (msg.includes('Token verification failed') || msg.includes('invalid')) return 'That code is incorrect. Check it and try again.'
  return msg
}

function CodeField({ value, onChange, onEnter }) {
  return (
    <input
      style={{ ...s.input, ...s.codeInput }}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      placeholder="123456"
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
    />
  )
}

const s = {
  page:         { minHeight: '100vh', background: 'var(--bg)' },
  nav:          { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  logo:         { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text)' },
  wrap:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' },
  headline:     { textAlign: 'center', marginBottom: '2rem' },
  headlineText: { fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--text)', margin: 0 },
  loginPill:    { marginTop: '1.25rem', padding: '10px 28px', borderRadius: 100, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-soft)', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  card:         { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header:       { marginBottom: '2rem' },
  eyebrow:      { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 },
  title:        { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8, color: 'var(--text)' },
  sub:          { fontSize: 14, color: 'var(--text-soft)' },
  authStack:    { display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' },
  input:        { width: '100%', padding: '10px 12px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', transition: 'border-color 0.15s', boxSizing: 'border-box' },
  codeInput:    { marginTop: 18, textAlign: 'center', fontSize: 24, letterSpacing: '0.35em', fontVariantNumeric: 'tabular-nums' },
  errorMsg:     { fontSize: 13, color: 'var(--error)', margin: 0 },
  btn:          { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s' },
  secondaryBtn: { width: '100%', marginTop: 10, padding: '12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-soft)', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  privacy:      { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, marginTop: '1.25rem', marginBottom: 0 },
  legalLink:    { color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
}
