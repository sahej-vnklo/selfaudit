import React, { useEffect, useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../../lib/legal.js'
import './Login.css'

// ── Hardcoded light-mode design tokens ───────────────────────────────────────
const C = {
  bg:          '#ffffff',
  fg:          '#1a1110',
  fgDim:       '#6b5d54',
  fgMute:      '#9a8a7f',
  line2:       'rgba(26, 17, 16, 0.16)',
  ember:       'oklch(0.52 0.18 32)',
  emberGlow:   'oklch(0.5 0.19 33)',
  serif:       '"Titillium Web", -apple-system, "Helvetica Neue", "Inter", Arial, sans-serif',
  sans:        '-apple-system, "Helvetica Neue", "Inter", Arial, sans-serif',
  mono:        '"JetBrains Mono", ui-monospace, monospace',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Login({ onSuccess, initialMessage = '' }) {
  const [email,        setEmail]        = useState('')
  const [code,         setCode]         = useState('')
  const [error,        setError]        = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [codeSent,     setCodeSent]     = useState(false)
  const [otpType,      setOtpType]      = useState('magiclink')

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
            <h1 style={s.headline}>Check your <span style={s.em}>inbox.</span></h1>
            <div style={s.card}>
              <p style={s.eyebrow}>Sign-in code sent</p>
              <h2 style={s.cardTitle}>Enter your sign-in code</h2>
              <p style={s.cardSub}>
                We sent a code to <strong style={{ color: C.fg }}>{email}</strong>. Enter it here to sign in.
              </p>
              <CodeField value={code} onChange={setCode} onEnter={handleVerifyCode} />
              {error && <p style={s.error}>{error}</p>}
              <button
                className="sa-login-primary"
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
          <div style={s.card}>
            <p style={s.eyebrow}>Welcome Back</p>
            <h2 style={s.cardTitle}>Log in to your account</h2>
            <p style={s.cardSub}>We'll email you a sign-in code to enter on this device.</p>

            <EmailField value={email} onChange={setEmail} onEnter={handleSendCode} />
            {error && <p style={s.error}>{error}</p>}

            <button
              className="sa-login-primary"
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Email me a code'}
            </button>
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
    <nav className="sa-login-nav">
      <div className="sa-login-nav-inner">
        <a
          className="sa-login-logo"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            window.location.hash = ''
          }}
        >
          SelfAudit
        </a>
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

  // Auth layout
  auth: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px 64px',
  },
  inner: {
    width: '100%',
    maxWidth: 432,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Headline
  headline: {
    fontFamily: C.serif,
    fontWeight: 500,
    fontSize: 'clamp(37px, 5.2vw, 67px)',
    lineHeight: 1,
    letterSpacing: '-0.025em',
    textAlign: 'center',
    marginBottom: 36,
    color: C.fg,
  },
  em: {
    fontStyle: 'normal',
    fontWeight: 500,
    color: C.emberGlow,
  },

  // Card
  card: {
    position: 'relative',
    width: '100%',
    padding: '34px 35px 32px',
    background: '#ffffff',
    border: `1px solid ${C.line2}`,
    borderRadius: 10,
    boxShadow: [
      '0 1px 2px rgba(26, 17, 16, 0.06)',
      '0 18px 44px -28px rgba(26, 17, 16, 0.24)',
      'inset 0 1px 0 rgba(255,255,255,0.9)',
    ].join(', '),
  },

  eyebrow: {
    fontFamily: C.mono,
    fontSize: 13,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: C.ember,
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: C.serif,
    fontWeight: 500,
    fontSize: 'clamp(24px, 2.7vw, 32px)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    marginBottom: 11,
    color: C.fg,
  },
  cardSub: {
    color: C.fgDim,
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 24,
    maxWidth: '38ch',
  },

  // Field
  fieldLabel: {
    display: 'block',
    fontFamily: C.mono,
    fontSize: 13,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: C.fgMute,
    marginBottom: 9,
  },
  input: {
    width: '100%',
    height: 46,
    padding: '0 15px',
    background: '#f7f7f9',
    border: `1px solid ${C.line2}`,
    borderRadius: 8,
    color: C.fg,
    fontFamily: C.sans,
    fontSize: 14,
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
    height: 46,
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(25, 25, 27, 0.9)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 6,
    backdropFilter: 'blur(14px) saturate(120%)',
    WebkitBackdropFilter: 'blur(14px) saturate(120%)',
    fontFamily: C.sans,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    boxShadow: '0 10px 24px -16px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    transition: 'background .2s, border-color .2s, box-shadow .2s, transform .2s',
  },
  ghostBtn: {
    width: '100%',
    padding: '10px',
    marginTop: 10,
    borderRadius: 6,
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
  fine: {
    textAlign: 'center',
    marginTop: 18,
    fontSize: 13,
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
