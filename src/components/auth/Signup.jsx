import React, { useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../../lib/legal.js'
import './Login.css'

// ── Hardcoded light-mode tokens — matches Login.jsx exactly ──────────────────
const C = {
  bg:          '#ffffff',
  fg:          '#1a1110',
  fgDim:       '#6b5d54',
  fgMute:      '#9a8a7f',
  line:        'rgba(26, 17, 16, 0.1)',
  line2:       'rgba(26, 17, 16, 0.16)',
  ember:       'oklch(0.52 0.18 32)',
  emberGlow:   'oklch(0.5 0.19 33)',
  serif:       '"Titillium Web", -apple-system, "Helvetica Neue", "Inter", Arial, sans-serif',
  sans:        '-apple-system, "Helvetica Neue", "Inter", Arial, sans-serif',
  mono:        '"JetBrains Mono", ui-monospace, monospace',
}

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'

const SIGNUP_PLANS = [
  { key: 'professional', name: 'Professional', price: '$99',  popular: true },
  { key: 'enterprise',   name: 'Enterprise',   price: '$999' },
]

export default function Signup({ onLogin }) {
  return <SignupForm onLogin={onLogin} />
}

function SignupForm({ onLogin }) {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [code,         setCode]         = useState('')
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash.startsWith('signup?plan=')) {
      const plan = hash.split('plan=')[1]
      if (['professional', 'enterprise'].includes(plan)) return plan
    }
    return 'professional'
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [codeSent, setCodeSent] = useState(false)
  const [otpType,  setOtpType]  = useState('signup')

  // Read invite ref silently from URL — user never sees or types this
  const inviteRef = (() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    const match = hash.match(/[?&]ref=([^&]+)/)
    return match ? match[1] : null
  })()

  const rememberPlanIntent = () => {
    const intent = { plan: selectedPlan, at: Date.now() }
    if (inviteRef) intent.ref = inviteRef
    localStorage.setItem(PENDING_AUTH_INTENT_KEY, JSON.stringify(intent))
  }

  const handleSendCode = async () => {
    setError(null)
    if (!name.trim())  { setError('Enter your name first.'); return }
    if (!email.trim()) { setError('Enter your email first.'); return }
    setLoading(true)
    try {
      rememberPlanIntent()
      const response = await fetch('/api/send-auth-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), mode: 'signup', origin: window.location.origin }),
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
    if (!code.trim()) { setError('Enter the code first.'); return }
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

  // ── Code verification screen ──────────────────────────────────────────────
  if (codeSent) {
    return (
      <div style={s.page}>
        <SignupNav />
        <section style={s.auth}>
          <div style={s.inner}>
            <h1 style={s.headline}>Check your<br /><em style={s.em}>inbox.</em></h1>
            <div style={s.card}>
              <p style={s.eyebrow}>Verify your account</p>
              <h2 style={s.cardTitle}>Enter your code</h2>
              <p style={s.cardSub}>
                We sent a code to <strong style={{ color: C.fg }}>{email}</strong>.
                Enter it here to activate your account.
              </p>
              <input
                style={{ ...s.input, marginTop: 8, textAlign: 'center', fontSize: 24, letterSpacing: '0.35em', fontVariantNumeric: 'tabular-nums' }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter code"
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
              />
              {error && <p style={s.errorMsg}>{error}</p>}
              <button className="sa-login-primary" style={{ ...s.btn, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleVerifyCode} disabled={loading}>
                {loading ? 'Verifying…' : 'Create account'}
              </button>
              <button style={s.secondaryBtn} onClick={() => { setCodeSent(false); setCode(''); setError(null) }}>
                Use a different email
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // ── Main signup screen ────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <SignupNav onLogin={onLogin} />
      <section style={s.auth}>
        <div style={s.inner}>
          <h1 style={s.headline}>Audit your business.<br /><em style={s.em}>Fix what matters.</em></h1>

          <div style={s.card}>
            <p style={s.eyebrow}>Create account</p>
            <h2 style={s.cardTitle}>Start your first audit</h2>
            <p style={s.cardSub}>Create your account to get started.</p>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input style={s.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" onKeyDown={e => e.key === 'Enter' && handleSendCode()} />
              {error && <p style={s.errorMsg}>{error}</p>}
              <button className="sa-login-primary" style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSendCode} disabled={loading}>
                {loading ? 'Sending…' : 'Email me a code'}
              </button>
            </div>

            <p style={s.fine}>
              By signing up, you agree to our{' '}
              <a href={TERMS_HASH} style={s.fineLink}>Terms of Service</a>
              {' '}and{' '}
              <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={s.fineLink}>Privacy Policy</a>.
            </p>
          </div>

          {onLogin && (
            <button style={s.switchBtn} onClick={onLogin}>
              Already have an account? Sign in
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function SignupNav() {
  return (
    <nav className="sa-login-nav" aria-label="SelfAudit">
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

function friendlyError(msg) {
  if (msg.includes('already registered'))                                        return 'An account with this email already exists.'
  if (msg.includes('An account with this email already exists.'))               return 'An account with this email already exists.'
  if (msg.includes('Token has expired') || msg.includes('expired'))             return 'That code expired. Request a new one.'
  if (msg.includes('Token verification failed') || msg.includes('invalid'))     return 'That code is incorrect. Check it and try again.'
  return msg
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
  auth: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 24px 100px',
  },
  inner: { width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  headline: {
    fontFamily: C.serif, fontWeight: 500,
    fontSize: 'clamp(40px, 5.5vw, 72px)',
    lineHeight: 1.0, letterSpacing: '-0.025em',
    textAlign: 'center', marginBottom: 48, color: C.fg,
  },
  em: { fontStyle: 'italic', color: C.emberGlow },
  card: {
    position: 'relative', width: '100%',
    padding: '44px 44px 40px',
    background: 'linear-gradient(165deg, #ffffff, #fbf7f1)',
    border: `1px solid ${C.line2}`,
    borderRadius: 16,
    boxShadow: [
      '0 0 0 1px rgba(40, 22, 14, 0.06)',
      '0 1px 1px rgba(40, 22, 14, 0.08)',
      '0 8px 18px -10px rgba(50, 26, 14, 0.28)',
      '0 40px 80px -40px rgba(50, 26, 14, 0.34)',
      'inset 0 1px 0 rgba(255,255,255,0.75)',
    ].join(', '),
  },
  eyebrow:     { fontFamily: C.mono, fontSize: 13, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.ember, marginBottom: 18 },
  cardTitle:   { fontFamily: C.serif, fontWeight: 500, fontSize: 'clamp(28px, 3vw, 36px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 12, color: C.fg },
  cardSub:     { color: C.fgDim, fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: '38ch' },
  input: {
    width: '100%', height: 52, padding: '0 16px',
    background: '#ffffff', border: `1px solid ${C.line2}`,
    borderRadius: 8, color: C.fg, fontFamily: C.sans,
    fontSize: 15, outline: 'none', transition: 'border-color .2s, box-shadow .2s',
    boxSizing: 'border-box', display: 'block',
  },
  errorMsg: { fontSize: 13, color: C.ember, margin: '4px 0 0' },
  btn: {
    width: '100%', height: 52, marginTop: 4,
    background: 'rgba(25, 25, 27, 0.9)', color: '#ffffff',
    fontSize: 15, fontWeight: 600,
    borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.18)', cursor: 'pointer',
    fontFamily: C.sans, letterSpacing: '-0.01em',
    boxShadow: '0 10px 24px -16px rgba(0, 0, 0, 0.78), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(14px) saturate(120%)',
    WebkitBackdropFilter: 'blur(14px) saturate(120%)',
    transition: 'background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease, opacity .15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtn: {
    width: '100%', marginTop: 10, padding: '12px',
    borderRadius: 8, border: `1px solid ${C.line}`,
    background: 'transparent', color: C.fgDim,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: C.sans,
  },
  fine:     { fontSize: 13, color: C.fgMute, textAlign: 'center', lineHeight: 1.6, marginTop: 0, marginBottom: 0 },
  fineLink: { color: C.ember, textDecoration: 'none', fontWeight: 500 },
  switchBtn: {
    marginTop: 20, background: 'none', border: 'none',
    color: C.fgMute, fontSize: 13.5, cursor: 'pointer',
    fontFamily: C.sans, textDecoration: 'underline',
    textDecorationColor: C.line2,
  },
}
