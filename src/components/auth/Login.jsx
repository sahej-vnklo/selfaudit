import React, { useEffect, useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../../lib/legal.js'

// ── Hardcoded light-mode design tokens ───────────────────────────────────────
const C = {
  bg:          '#ffffff',
  fg:          '#1a1110',
  fgDim:       '#6b5d54',
  fgMute:      '#9a8a7f',
  line:        'rgba(26, 17, 16, 0.1)',
  line2:       'rgba(26, 17, 16, 0.16)',
  ember:       'oklch(0.52 0.18 32)',
  emberGlow:   'oklch(0.5 0.19 33)',
  serif:       '"Cormorant Garamond", "Times New Roman", serif',
  sans:        '"Manrope", -apple-system, system-ui, sans-serif',
  mono:        '"JetBrains Mono", ui-monospace, monospace',
}

// ── Toggle: flip to true to re-enable public signup ───────────────────────────
const SHOW_SIGNUP = false

// ── Main component ────────────────────────────────────────────────────────────
export default function Login({ onSuccess, onSignup, initialMessage = '' }) {
  const [email,     setEmail]     = useState('')
  const [code,      setCode]      = useState('')
  const [error,     setError]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [codeSent,  setCodeSent]  = useState(false)
  const [otpType,   setOtpType]   = useState('magiclink')

  useEffect(() => {
    if (initialMessage) setError(initialMessage)
  }, [initialMessage])

  const handleSendCode = async () => {
    setError(null)
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true)
    try {
      const response = await fetch('/api/send-auth-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mode: 'login', origin: window.location.origin }),
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
    if (!code.trim()) { setError('Enter the code first.'); return }
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

  // ── Code verification screen ──────────────────────────────────────────────
  if (codeSent) {
    return (
      <div style={s.page}>
        <LoginNav />
        <section style={s.auth}>
          <div style={s.inner}>
            <h1 style={s.headline}>Check your <em style={s.em}>inbox.</em></h1>
            <div style={s.card}>
              <p style={s.eyebrow}>Sign-in code sent</p>
              <h2 style={s.cardTitle}>Enter your sign-in code</h2>
              <p style={s.cardSub}>
                We sent a code to <strong style={{ color: C.fg }}>{email}</strong>. Enter it here to sign in.
              </p>
              <CodeField value={code} onChange={setCode} onEnter={handleVerifyCode} />
              {error && <p style={s.error}>{error}</p>}
              <button
                style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                onClick={handleVerifyCode}
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
              <button style={s.ghostBtn} onClick={() => { setCodeSent(false); setCode(''); setError(null) }}>
                Use a different email
              </button>
            </div>
            <Fine />
          </div>
        </section>
      </div>
    )
  }

  // ── Email screen ──────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <LoginNav />
      <section style={s.auth}>
        <div style={s.inner}>
          <h1 style={s.headline}>See your business <em style={s.em}>clearly.</em></h1>

          <div style={s.card}>
            <p style={s.eyebrow}>Welcome Back</p>
            <h2 style={s.cardTitle}>Log in to your account</h2>
            <p style={s.cardSub}>We'll email you a sign-in code to enter on this device.</p>

            <EmailField value={email} onChange={setEmail} onEnter={handleSendCode} />
            {error && <p style={s.error}>{error}</p>}

            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Email me a code'}
            </button>

            {SHOW_SIGNUP && (
              <p style={s.switchLine}>
                Don't have an account?{' '}
                <button style={s.switchLink} onClick={onSignup}>Sign up</button>
              </p>
            )}
            <p style={s.switchLine}>
              Not a pilot user?{' '}
              <button style={s.switchLink} onClick={() => { window.location.hash = 'voice' }}>Get early access.</button>
            </p>
          </div>

          <Fine />
        </div>
      </section>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function LoginNav() {
  return (
    <nav style={s.nav}>
      <div style={s.logoWrap} onClick={() => { window.location.hash = '' }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <defs>
            <filter id="lgGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#ff3d1f" floodOpacity="0.9" />
            </filter>
          </defs>
          <g filter="url(#lgGlow)" stroke="#ff3d1f" strokeLinejoin="round" strokeLinecap="round" fill="none">
            <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8" />
            <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4" />
            <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2" />
          </g>
        </svg>
        <span style={s.logoText}>SelfAudit</span>
      </div>
    </nav>
  )
}

function EmailField({ value, onChange, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.fieldLabel}>Work Email</label>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocused : {}) }}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="you@company.com"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
    </div>
  )
}

function CodeField({ value, onChange, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.fieldLabel}>Sign-in code</label>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocused : {}), textAlign: 'center', fontSize: 24, letterSpacing: '0.35em' }}
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
    </div>
  )
}

function Fine() {
  return (
    <p style={s.fine}>
      By continuing, you agree to our{' '}
      <a href={TERMS_HASH} style={s.fineLink}>Terms of Service</a>
      {' '}and{' '}
      <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={s.fineLink}>Privacy Policy</a>.
    </p>
  )
}

function friendlyError(msg) {
  if (msg.includes('Signups not allowed for otp'))                              return 'No account exists for that email yet.'
  if (msg.includes('No account exists for that email yet.'))                    return 'No account exists for that email yet.'
  if (msg.includes('Token has expired') || msg.includes('expired'))             return 'That code expired. Request a new one.'
  if (msg.includes('Token verification failed') || msg.includes('invalid'))     return 'That code is incorrect. Check it and try again.'
  return msg
}

// ── Styles (hardcoded light-mode) ─────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    fontFamily: C.sans,
    WebkitFontSmoothing: 'antialiased',
    display: 'flex',
    flexDirection: 'column',
    color: C.fg,
  },

  // Nav
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    padding: '0 48px',
    height: 80,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.line}`,
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  logoText: {
    fontFamily: C.serif,
    fontSize: 27,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: C.fg,
    lineHeight: 1,
  },

  // Auth layout
  auth: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px 100px',
  },
  inner: {
    width: '100%',
    maxWidth: 540,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Headline
  headline: {
    fontFamily: C.serif,
    fontWeight: 500,
    fontSize: 'clamp(46px, 6.5vw, 84px)',
    lineHeight: 0.98,
    letterSpacing: '-0.025em',
    textAlign: 'center',
    marginBottom: 56,
    color: C.fg,
  },
  em: {
    fontStyle: 'italic',
    color: C.emberGlow,
  },

  // Card
  card: {
    position: 'relative',
    width: '100%',
    padding: '44px 44px 40px',
    background: 'linear-gradient(165deg, #ffffff, #fbf7f1)',
    border: `1px solid rgba(26, 17, 16, 0.16)`,
    borderRadius: 16,
    boxShadow: [
      '0 0 0 1px rgba(40, 22, 14, 0.06)',
      '0 1px 1px rgba(40, 22, 14, 0.08)',
      '0 8px 18px -10px rgba(50, 26, 14, 0.28)',
      '0 40px 80px -40px rgba(50, 26, 14, 0.34)',
      'inset 0 1px 0 rgba(255,255,255,0.75)',
    ].join(', '),
  },

  eyebrow: {
    fontFamily: C.mono,
    fontSize: 11,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: C.ember,
    marginBottom: 18,
  },
  cardTitle: {
    fontFamily: C.serif,
    fontWeight: 500,
    fontSize: 'clamp(30px, 3.4vw, 40px)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    marginBottom: 14,
    color: C.fg,
  },
  cardSub: {
    color: C.fgDim,
    fontSize: 15,
    lineHeight: 1.6,
    marginBottom: 30,
    maxWidth: '38ch',
  },

  // Field
  fieldLabel: {
    display: 'block',
    fontFamily: C.mono,
    fontSize: 10,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: C.fgMute,
    marginBottom: 9,
  },
  input: {
    width: '100%',
    height: 56,
    padding: '0 18px',
    background: '#ffffff',
    border: `1px solid ${C.line2}`,
    borderRadius: 8,
    color: C.fg,
    fontFamily: C.sans,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box',
    display: 'block',
  },
  inputFocused: {
    borderColor: 'oklch(0.6 0.18 35 / 0.7)',
    boxShadow: '0 0 0 3px oklch(0.55 0.2 35 / 0.16)',
  },

  // Buttons
  btn: {
    width: '100%',
    height: 56,
    marginTop: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, oklch(0.66 0.145 42), oklch(0.59 0.15 37))',
    color: '#fdf6ee',
    border: '1px solid oklch(0.6 0.14 40)',
    borderRadius: 8,
    fontFamily: C.sans,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(255,255,255,0.28) inset, 0 14px 32px -14px oklch(0.62 0.15 40 / 0.45)',
    transition: 'transform .2s, box-shadow .2s',
  },
  ghostBtn: {
    width: '100%',
    padding: '12px',
    marginTop: 12,
    borderRadius: 8,
    border: `1px solid ${C.line2}`,
    background: 'transparent',
    color: C.fgDim,
    fontFamily: C.sans,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },

  // Misc
  error: {
    fontSize: 13,
    color: C.ember,
    marginTop: 8,
    marginBottom: 4,
  },
  switchLine: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
    color: C.fgDim,
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: C.emberGlow,
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: 15,
    padding: 0,
    fontFamily: C.sans,
    transition: 'color .2s',
  },
  fine: {
    textAlign: 'center',
    marginTop: 22,
    fontSize: 12,
    lineHeight: 1.6,
    color: C.fg,
    maxWidth: '40ch',
  },
  fineLink: {
    color: C.fgDim,
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
}
