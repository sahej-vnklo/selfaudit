import React, { useState } from 'react'
import * as Sentry from '@sentry/react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { initSupabase } from '../../lib/supabase.js'
import { usePostHog } from '@posthog/react'

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'

const THEMES = {
  dark: {
    bg: '#0F1520',
    surface: '#141D2B',
    surface2: '#111827',
    border: '#1E2D42',
    text: '#E8E2D8',
    textSoft: '#B8B0A4',
    textMuted: '#7A8FA8',
    accent: '#4A7FA8',
    accentSoft: '#1A2535',
    accentText: '#8FBAD8',
    inputBg: '#111827',
    error: '#C05050',
    danger: '#C05050',
    placeholder: '#7A8FA8',
    buttonText: '#E8E2D8',
    focusRing: 'rgba(74,127,168,0.18)',
  },
  light: {
    bg: '#F5F0E8',
    surface: '#EDE6DC',
    surface2: '#E8DFD3',
    border: '#C4B4A4',
    text: '#1A1410',
    textSoft: '#5C4840',
    textMuted: '#6B5040',
    accent: '#8C4A42',
    accentSoft: '#F0E4E0',
    accentText: '#7A3C36',
    inputBg: '#E8DFD3',
    error: '#8C2A2A',
    danger: '#8C2A2A',
    placeholder: '#8A6A58',
    buttonText: '#F5F0E8',
    focusRing: 'rgba(140,74,66,0.14)',
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

function ProviderButton({ icon, label, onClick, disabled }) {
  return (
    <button type="button" style={s.providerButton} onClick={onClick} disabled={disabled}>
      <span style={s.providerIconWrap}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12S6.8 21.4 12 21.4c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z" />
      <path fill="#4285F4" d="M21.1 12.1c0-.5-.1-.9-.1-1.3H12v3.9h5.5c-.3 1.2-1.3 2.2-2.6 2.9l3.2 2.5c1.9-1.8 3-4.4 3-8z" opacity=".001" />
      <path fill="#FBBC05" d="M4.8 7.6l3.2 2.4C8.8 8.3 10.2 7 12 7c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 4.5 14.6 3.6 12 3.6c-3.6 0-6.7 2-8.2 4.9z" />
      <path fill="#34A853" d="M12 20.4c2.5 0 4.7-.8 6.2-2.3l-3.2-2.5c-.9.6-2 1-3 1-2.5 0-4.7-1.7-5.5-4l-3.3 2.5c1.5 3 4.6 5.3 8.8 5.3z" />
      <path fill="#4285F4" d="M6.5 12.6c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.2 6.3C2.8 7.2 2.6 8.2 2.6 9.2s.2 2 .6 2.9l3.3-2.5z" />
    </svg>
  )
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  )
}

const stripePromise = fetch('/api/config')
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(cfg => loadStripe(cfg.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''))
  .catch(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''))

export default function Signup({ onSuccess, onLogin }) {
  return (
    <Elements stripe={stripePromise}>
      <SignupForm onSuccess={onSuccess} onLogin={onLogin} />
    </Elements>
  )
}

function SignupForm({ onSuccess, onLogin }) {
  const stripe   = useStripe()
  const elements = useElements()
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const C = THEMES[theme] || THEMES.dark
  const stripeStyle = {
    style: {
      base: {
        fontSize: '14px',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: C.text,
        '::placeholder': { color: C.placeholder },
      },
      invalid: { color: C.danger },
    },
  }

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  })
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash.startsWith('signup?plan=')) {
      const plan = hash.split('plan=')[1]
      if (['essential', 'business'].includes(plan)) return plan
    }
    return 'essential'
  })
  const [errors,       setErrors]       = useState({})
  const [loading,      setLoading]      = useState(false)
  const [globalError,  setGlobalError]  = useState(null)
  const [emailSent,    setEmailSent]    = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const posthog = usePostHog()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'At least 8 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Required'
    else if (form.password && form.confirmPassword !== form.password) e.confirmPassword = "Passwords don't match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setGlobalError(null)
    if (!validate()) return
    setLoading(true)
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`
    posthog?.capture('signup_submitted', { plan: selectedPlan, email: form.email })
    try {
      const sb = await initSupabase()

      // 1. Create auth user
      const { data, error: authError } = await sb.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: fullName } },
      })
      if (authError) { setGlobalError(friendlyError(authError.message)); return }

      const user = data.user
      if (user) {
        // Log to Attio CRM (fire-and-forget)
        fetch('/api/log-to-attio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create_user', email: form.email, name: fullName, tier: selectedPlan }),
        }).catch(e => console.warn('[signup] Attio failed:', e.message))

        // 2. Upsert profile row with selected tier.
        // Wait 300ms first so the handle_new_user trigger has time to create
        // the row — without this the upsert and trigger can race, leaving tier=null.
        await new Promise(r => setTimeout(r, 300))

        const { data: profileData, error: profileError } = await sb
          .from('profiles')
          .upsert({ id: user.id, name: fullName }, { onConflict: 'id' })
          .select('tier')
          .single()
        if (profileError) throw profileError
        console.log('[signup] tier written:', profileData?.tier)

        // 3. Create Stripe customer + subscription (all plans require card)
        if (!stripe || !elements) throw new Error('Stripe is not loaded yet. Please try again.')
        const cardNumber = elements.getElement(CardNumberElement)
        if (!cardNumber) throw new Error('Card element not found')

        const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumber,
          billing_details: { name: fullName, email: form.email },
        })
        if (pmError) throw new Error(pmError.message)

        const { data: subData, error: fnError } = await sb.functions.invoke(
          'create-stripe-subscription',
          { body: { userId: user.id, email: form.email, name: fullName, tier: selectedPlan, paymentMethodId: paymentMethod.id } }
        )
        if (fnError) throw fnError
        if (subData?.error) throw new Error(subData.error)

        await sb.from('profiles').update({
          tier:                   selectedPlan,
          stripe_customer_id:     subData.customerId,
          stripe_subscription_id: subData.subscriptionId,
        }).eq('id', user.id).throwOnError()

        posthog?.identify(user.id, { email: form.email, name: fullName, plan: selectedPlan })
        posthog?.capture('signup_completed', { plan: selectedPlan, email: form.email })
      }

      if (data.session) {
        onSuccess(data.session)
      } else {
        setEmailSent(true)
      }
    } catch (e) {
      Sentry.captureException(e)
      posthog?.captureException(e)
      setGlobalError(e.message || 'Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const rememberPlanIntent = () => {
    localStorage.setItem(PENDING_AUTH_INTENT_KEY, JSON.stringify({
      plan: selectedPlan,
      at: Date.now(),
    }))
  }

  const handleOAuthSignup = async (provider) => {
    setGlobalError(null)
    setLoading(true)
    try {
      rememberPlanIntent()
      const sb = await initSupabase()
      const { data, error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error('Could not start social sign in.')
    } catch (error) {
      localStorage.removeItem(PENDING_AUTH_INTENT_KEY)
      setGlobalError(friendlyError(error?.message || 'Could not start sign in.'))
      setLoading(false)
    }
  }

  const handleMagicLinkSignup = async () => {
    setGlobalError(null)
    const email = form.email.trim()
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email first' }))
      return
    }
    setLoading(true)
    try {
      rememberPlanIntent()
      const sb = await initSupabase()
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/`,
          data: fullName ? { name: fullName } : undefined,
        },
      })
      if (error) throw error
      setMagicLinkSent(true)
    } catch (error) {
      localStorage.removeItem(PENDING_AUTH_INTENT_KEY)
      setGlobalError(friendlyError(error?.message || 'Could not send magic link.'))
    } finally {
      setLoading(false)
    }
  }

  // Email confirmation pending state
  if (emailSent) {
    return (
      <div style={{ ...themeVars, ...s.page }}>
        <nav style={s.nav}>
          <div style={s.logo} onClick={() => { window.location.hash = '' }}>
            self<span style={{ color: 'var(--accent)' }}>audit</span>
          </div>
        </nav>
        <div style={s.wrap}>
          <div style={{ ...themeVars, ...s.card }}>
            <p style={s.eyebrow}>Almost there</p>
            <h2 style={s.title}>Check your email</h2>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
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

  if (magicLinkSent) {
    return (
      <div style={{ ...themeVars, ...s.page }}>
        <nav style={s.nav}>
          <div style={s.logo} onClick={() => { window.location.hash = '' }}>
            self<span style={{ color: 'var(--accent)' }}>audit</span>
          </div>
        </nav>
        <div style={s.wrap}>
          <div style={{ ...themeVars, ...s.card }}>
            <p style={s.eyebrow}>Check your inbox</p>
            <h2 style={s.title}>Your sign-in link is on the way</h2>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a magic link to <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
              Open it to create your account, then we&apos;ll take you into checkout for the {selectedPlan === 'business' ? 'Intelligence' : 'Foundation'} plan.
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
    <div style={{ ...themeVars, ...s.page }}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => window.location.hash = ''}>
          self<span style={{ color: 'var(--accent)' }}>audit</span>
        </div>
      </nav>

      <div style={s.wrap}>
        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>Create account</p>
            <h2 style={s.title}>Start your first audit</h2>
            <p style={s.sub}>Choose a plan and enter your card to get started.</p>
          </div>

          <div style={s.fields}>
            {/* First + Last name — two equal columns */}
            <div style={s.nameRow}>
              <Field
                label="First name" type="text"
                value={form.firstName} onChange={v => update('firstName', v)}
                placeholder="Jane" error={errors.firstName} required
              />
              <Field
                label="Last name" type="text"
                value={form.lastName} onChange={v => update('lastName', v)}
                placeholder="Smith" error={errors.lastName} required
              />
            </div>
            <Field label="Email address" type="email" value={form.email} onChange={v => update('email', v)} placeholder="jane@company.com" error={errors.email} required />
            <Field label="Password" type="password" value={form.password} onChange={v => update('password', v)} placeholder="Min. 8 characters" error={errors.password} required />
            <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Repeat password" error={errors.confirmPassword} required onEnter={handleSubmit} />
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

          <div style={s.altAuthShell}>
            <div style={s.dividerRow}>
              <span style={s.dividerLine} />
              <span style={s.dividerLabel}>or create your account first</span>
              <span style={s.dividerLine} />
            </div>
            <div style={s.providerGrid}>
              <ProviderButton icon={<GoogleMark />} label="Continue with" onClick={() => handleOAuthSignup('google')} disabled={loading} />
              <ProviderButton icon={<MicrosoftMark />} label="Continue with" onClick={() => handleOAuthSignup('azure')} disabled={loading} />
            </div>
            <button type="button" style={s.magicButton} onClick={handleMagicLinkSignup} disabled={loading}>
              Email me a magic link
            </button>
            <p style={s.altAuthHint}>
              Social and magic-link signup create your account first, then send you into secure checkout for the selected plan.
            </p>
          </div>

          {/* Stripe card fields — always shown */}
          <div style={{ paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-soft)', marginBottom: 2 }}>
              Card details
            </div>
            <StripeField label="Card number"><CardNumberElement options={stripeStyle} /></StripeField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <StripeField label="Expiry"><CardExpiryElement options={stripeStyle} /></StripeField>
              <StripeField label="CVC"><CardCvcElement options={stripeStyle} /></StripeField>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Secured by Stripe. Card details never stored on our servers.</p>
          </div>

          {globalError && <p style={s.errorMsg}>{globalError}</p>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading || !stripe}>
            {loading ? 'Creating account…' : 'Create account + start plan →'}
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

const SIGNUP_PLANS = [
  { key: 'essential', name: 'Foundation', price: '$29' },
  { key: 'business',  name: 'Intelligence',  price: '$99',  popular: true },
]

function StripeField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={s.label}>{label}</label>
      <div style={{ ...s.input, padding: '10px 12px' }}>{children}</div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, error, required, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>
        {label}
        {required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
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
      {error && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>}
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('already registered')) return 'An account with this email already exists.'
  if (msg.includes('Password should')) return 'Password must be at least 8 characters.'
  if (msg.includes('provider is not enabled')) return 'This sign-in method is not enabled yet in Supabase Auth.'
  return msg
}

const s = {
  page:        { minHeight: '100vh', background: 'var(--bg)' },
  nav:         { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  logo:        { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text)' },
  wrap:        { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card:        { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header:      { marginBottom: '2rem' },
  eyebrow:     { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 },
  title:       { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8, color: 'var(--text)' },
  sub:         { fontSize: 14, color: 'var(--text-soft)' },
  fields:      { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' },
  nameRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  altAuthShell:{ marginBottom: '1.5rem' },
  dividerRow:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerLabel:{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-soft)', whiteSpace: 'nowrap' },
  providerGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' },
  providerButton: {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  providerIconWrap: { width: 18, height: 18, display: 'grid', placeItems: 'center', flexShrink: 0 },
  magicButton: {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '0.5px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  altAuthHint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 10, marginBottom: 0 },
  label:       { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  input:       { width: '100%', padding: '10px 12px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', transition: 'border-color 0.15s', boxSizing: 'border-box' },
  inputFocused:{ borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--focus-ring)' },
  inputError:  { borderColor: 'var(--danger)' },
  errorMsg:    { fontSize: 13, color: 'var(--error)', marginBottom: '1rem' },
  btn:         { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1rem' },
  privacy:     { fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, marginBottom: '1.25rem' },
  switch:      { fontSize: 13, color: 'var(--text-soft)', textAlign: 'center' },
  link:        { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
