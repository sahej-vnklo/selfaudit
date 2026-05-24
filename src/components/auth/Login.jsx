import React, { useEffect, useState } from 'react'
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
    '--button-text': C.buttonText,
    '--focus-ring': C.focusRing,
  }
}

export default function Login({ onSuccess, onSignup, initialMessage = '' }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [otpType, setOtpType] = useState('magiclink')
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)

  useEffect(() => {
    if (initialMessage) setError(initialMessage)
  }, [initialMessage])

  const handleSendCode = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Enter your email first.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/send-auth-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          mode: 'login',
          origin: window.location.origin,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Could not send sign-in code.')
      setOtpType(data?.otpType || 'magiclink')
      setCodeSent(true)
      setCode('')
    } catch (e) {
      setError(friendlyError(e?.message || 'Could not send sign-in code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)
    if (!code.trim()) {
      setError('Enter the code first.')
      return
    }
    setLoading(true)
    try {
      const sb = await initSupabase()
      const { data, error: verifyError } = await sb.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: otpType || 'magiclink',
      })
      if (verifyError) throw verifyError
      onSuccess?.(data?.session || null)
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
          <div style={s.logo} onClick={() => window.location.hash = ''}>
            self<span style={{ color: 'var(--accent)' }}>audit</span>
          </div>
        </nav>

        <div style={s.wrap}>
          <div style={s.card}>
            <div style={s.header}>
              <p style={s.eyebrow}>Check your inbox</p>
              <h2 style={s.title}>Enter your sign-in code</h2>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a sign-in code to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              Enter it here on this device to sign in.
            </p>
            <CodeField value={code} onChange={setCode} onEnter={handleVerifyCode} />
            {error && <p style={{ ...s.errorMsg, marginTop: 12 }}>{error}</p>}
            <button style={{ ...s.btn, marginTop: 20, opacity: loading ? 0.7 : 1 }} onClick={handleVerifyCode} disabled={loading}>
              {loading ? 'Verifying…' : 'Verify code'}
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
          <h1 style={s.headlineText}>See your business<br />clearly.</h1>
        </div>

        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>Welcome back</p>
            <h2 style={s.title}>Log in to your account</h2>
            <p style={s.sub}>We&apos;ll email you a sign-in code to enter on this device.</p>
          </div>

          <div style={s.authStack}>
            <EmailField value={email} onChange={setEmail} onEnter={handleSendCode} />

            {error && <p style={s.errorMsg}>{error}</p>}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSendCode} disabled={loading}>
              {loading ? 'Sending…' : 'Email me a code'}
            </button>

            <p style={s.switch}>
              Don't have an account?{' '}
              <button style={s.link} onClick={onSignup}>Sign up</button>
            </p>

            <p style={s.legal}>
              By continuing, you agree to our{' '}
              <a href={TERMS_HASH} style={s.legalLink}>Terms of Service</a>
              {' '}and{' '}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={s.legalLink}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailField({ value, onChange, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      style={{ ...s.input, ...(focused ? s.inputFocused : {}) }}
      type="email"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="you@company.com"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
    />
  )
}

function CodeField({ value, onChange, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      style={{ ...s.input, ...s.codeInput, ...(focused ? s.inputFocused : {}) }}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
      placeholder="Enter code"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
    />
  )
}

function friendlyError(msg) {
  if (msg.includes('Signups not allowed for otp')) return 'No account exists for that email yet.'
  if (msg.includes('No account exists for that email yet.')) return 'No account exists for that email yet.'
  if (msg.includes('Token has expired') || msg.includes('expired')) return 'That code expired. Request a new one.'
  if (msg.includes('Token verification failed') || msg.includes('invalid')) return 'That code is incorrect. Check it and try again.'
  return msg
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text)' },
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' },
  headline: { textAlign: 'center', marginBottom: '2rem' },
  headlineText: { fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--text)', margin: 0 },
  createAccountPill: { marginTop: '1.25rem', width: '100%', maxWidth: 420, padding: '13px', borderRadius: 100, border: 'none', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  card: { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header: { marginBottom: '2rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)' },
  sub: { fontSize: 14, color: 'var(--text-soft)', marginTop: 10 },
  authStack: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  input: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', transition: 'border-color 0.15s' },
  inputFocused: { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--focus-ring)' },
  codeInput: { marginTop: 18, textAlign: 'center', fontSize: 24, letterSpacing: '0.35em', fontVariantNumeric: 'tabular-nums' },
  errorMsg: { fontSize: 13, color: 'var(--error)', marginBottom: '1rem' },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1.25rem' },
  secondaryBtn: { width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-soft)', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  switch: { fontSize: 13, color: 'var(--text-soft)', textAlign: 'center' },
  link: { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
  legal: { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: '0.5rem 0 0' },
  legalLink: { color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 500 },
}
