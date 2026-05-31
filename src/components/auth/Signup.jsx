import React, { useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../../lib/legal.js'

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
  serif:       '"Cormorant Garamond", "Times New Roman", serif',
  sans:        '"Manrope", -apple-system, system-ui, sans-serif',
  mono:        '"JetBrains Mono", ui-monospace, monospace',
}

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'

const SIGNUP_PLANS = [
  { key: 'foundation',   name: 'Foundation',   price: '$29' },
  { key: 'intelligence', name: 'Intelligence',  price: '$99', popular: true },
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
      if (['foundation', 'intelligence'].includes(plan)) return plan
    }
    return 'foundation'
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [codeSent, setCodeSent] = useState(false)
  const [otpType,  setOtpType]  = useState('signup')

  const rememberPlanIntent = () => {
    localStorage.setItem(PENDING_AUTH_INTENT_KEY, JSON.stringify({ plan: selectedPlan, at: Date.now() }))
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
                Enter it here to create your account, then we'll take you into checkout for the {selectedPlan === 'intelligence' ? 'Intelligence' : 'Foundation'} plan.
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
              <button style={{ ...s.btn, marginTop: 16, opacity: loading ? 0.7 : 1 }} onClick={handleVerifyCode} disabled={loading}>
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
            <p style={s.cardSub}>Choose a plan to get started. Billing happens after account creation.</p>

            {/* Plan selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.fgMute, marginBottom: 10 }}>
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
                        padding: '12px 16px', borderRadius: 10,
                        border: sel ? `1.5px solid ${C.ember}` : `1px solid ${C.line2}`,
                        background: sel ? 'rgba(26,17,16,0.04)' : '#ffffff',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        fontFamily: C.sans,
                      }}
                    >
                      <div style={{
                        width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
                        border: sel ? `5px solid ${C.ember}` : `1.5px solid ${C.line2}`,
                        background: '#ffffff', transition: 'all 0.15s',
                      }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.fg }}>{p.name}</span>
                        {p.popular && (
                          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: C.ember, color: '#fff', padding: '2px 8px', borderRadius: 100 }}>
                            Popular
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: sel ? C.ember : C.fg }}>
                        {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: C.fgMute }}>/mo</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input style={s.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
              <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" onKeyDown={e => e.key === 'Enter' && handleSendCode()} />
              {error && <p style={s.errorMsg}>{error}</p>}
              <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSendCode} disabled={loading}>
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

function SignupNav({ onLogin }) {
  return (
    <nav style={s.nav}>
      <div style={s.logoWrap} onClick={() => { window.location.hash = '' }}>
        <svg viewBox="0 0 32 32" fill="none" width="26" height="26" style={{ color: C.ember }}>
          <g stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" fill="none">
            <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8"/>
            <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4"/>
          </g>
        </svg>
        <span style={s.logoText}>SelfAudit</span>
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
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    display: 'flex', alignItems: 'center',
    padding: '0 48px', height: 80,
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.line}`,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoText: { fontFamily: C.serif, fontSize: 27, fontWeight: 500, letterSpacing: '-0.01em', color: C.fg, lineHeight: 1 },
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
  eyebrow:     { fontFamily: C.mono, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.ember, marginBottom: 18 },
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
    background: C.ember, color: '#ffffff',
    fontSize: 15, fontWeight: 600,
    borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: C.sans, letterSpacing: '-0.01em',
    transition: 'opacity 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtn: {
    width: '100%', marginTop: 10, padding: '12px',
    borderRadius: 8, border: `1px solid ${C.line}`,
    background: 'transparent', color: C.fgDim,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: C.sans,
  },
  fine:     { fontSize: 11.5, color: C.fgMute, textAlign: 'center', lineHeight: 1.6, marginTop: 0, marginBottom: 0 },
  fineLink: { color: C.ember, textDecoration: 'none', fontWeight: 500 },
  switchBtn: {
    marginTop: 20, background: 'none', border: 'none',
    color: C.fgMute, fontSize: 13.5, cursor: 'pointer',
    fontFamily: C.sans, textDecoration: 'underline',
    textDecorationColor: C.line2,
  },
}
