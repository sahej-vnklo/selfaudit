import React, { useState } from 'react'
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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

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

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  })
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '')
    if (hash.startsWith('signup?plan=')) {
      const plan = hash.split('plan=')[1]
      if (['essential', 'business', 'portfolio'].includes(plan)) return plan
    }
    return 'essential'
  })
  const [errors,       setErrors]       = useState({})
  const [loading,      setLoading]      = useState(false)
  const [globalError,  setGlobalError]  = useState(null)
  const [emailSent,    setEmailSent]    = useState(false)

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
        // 2. Insert profile row with selected tier
        await sb.from('profiles').insert({
          id:         user.id,
          name:       fullName,
          tier:       selectedPlan,
        }).throwOnError()

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
          stripe_customer_id:     subData.customerId,
          stripe_subscription_id: subData.subscriptionId,
        }).eq('id', user.id).throwOnError()
      }

      if (data.session) {
        onSuccess(data.session)
      } else {
        setEmailSent(true)
      }
    } catch (e) {
      setGlobalError(e.message || 'Connection error. Please try again.')
    } finally {
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
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-600)', marginBottom: 10 }}>
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
                      border: sel ? '1.5px solid var(--green)' : '0.5px solid var(--gray-200)',
                      background: sel ? 'var(--green-light)' : 'var(--white)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                      border: sel ? '5px solid var(--green)' : '1.5px solid var(--gray-200)',
                      background: 'var(--white)', transition: 'all 0.15s',
                    }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)' }}>{p.name}</span>
                      {p.popular && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'var(--green)', color: 'white', padding: '1px 7px', borderRadius: 100 }}>
                          Popular
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: sel ? 'var(--green-dark)' : 'var(--gray-800)' }}>
                      {p.price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-600)' }}>/mo</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stripe card fields — always shown */}
          <div style={{ paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gray-600)', marginBottom: 2 }}>
              Card details
            </div>
            <StripeField label="Card number"><CardNumberElement options={stripeStyle} /></StripeField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <StripeField label="Expiry"><CardExpiryElement options={stripeStyle} /></StripeField>
              <StripeField label="CVC"><CardCvcElement options={stripeStyle} /></StripeField>
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: 0 }}>Secured by Stripe. Card details never stored on our servers.</p>
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
  { key: 'essential', name: 'Essential', price: '$49' },
  { key: 'business',  name: 'Business',  price: '$99',  popular: true },
  { key: 'portfolio', name: 'Portfolio', price: '$299' },
]

const stripeStyle = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: '#0D0D0D',
      '::placeholder': { color: '#B0ADA4' },
    },
    invalid: { color: '#E24B4A' },
  },
}

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
  page:        { minHeight: '100vh', background: 'var(--gray-100)' },
  nav:         { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--white)', borderBottom: '0.5px solid var(--gray-200)' },
  logo:        { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer' },
  wrap:        { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card:        { background: 'var(--white)', borderRadius: 'var(--radius)', border: '0.5px solid var(--gray-200)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header:      { marginBottom: '2rem' },
  eyebrow:     { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  title:       { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8 },
  sub:         { fontSize: 14, color: 'var(--gray-600)' },
  fields:      { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' },
  nameRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  label:       { fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' },
  input:       { width: '100%', padding: '10px 12px', border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--black)', background: 'var(--white)', transition: 'border-color 0.15s', boxSizing: 'border-box' },
  inputFocused:{ borderColor: 'var(--green)', boxShadow: '0 0 0 3px rgba(29,158,117,0.1)' },
  inputError:  { borderColor: '#E24B4A' },
  errorMsg:    { fontSize: 13, color: '#A32D2D', marginBottom: '1rem' },
  btn:         { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--green)', color: 'white', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1rem' },
  privacy:     { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', lineHeight: 1.5, marginBottom: '1.25rem' },
  switch:      { fontSize: 13, color: 'var(--gray-600)', textAlign: 'center' },
  link:        { background: 'none', border: 'none', color: 'var(--green)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
