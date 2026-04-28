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
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

const C = {
  bg: '#F8F7F4',
  ink: '#1A1A1A',
  inkSoft: '#4A4A4A',
  inkMuted: '#7A7A7A',
  accent: '#5C8D6E',
  accentDark: '#3F6B52',
  accentSoft: '#E6F0EA',
  border: '#E8E6E0',
  card: '#FFFFFF',
  error: '#B84A3E',
  errorBg: '#FDE9E7',
}

const PLANS = [
  {
    id: 'essential',
    label: 'Essential',
    price: '$49',
    period: '/mo',
    description: 'For solo consultants and independent advisors.',
    features: ['1 workspace', 'Full audit access', 'Basic reporting'],
  },
  {
    id: 'business',
    label: 'Business',
    price: '$99',
    period: '/mo',
    description: 'For growing agencies and multi-team businesses.',
    features: ['5 workspaces', 'Multi-domain scoping', 'Priority reporting', 'Team access'],
    popular: true,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    price: '$299',
    period: '/mo',
    description: 'For investment portfolios and multi-entity operators.',
    features: ['Unlimited workspaces', 'All domains + industries', 'Portfolio dashboard', 'Dedicated support'],
  },
]

const stripeElementStyle = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: C.ink,
      '::placeholder': { color: C.inkMuted },
    },
    invalid: { color: C.error },
  },
}

export default function Signup({ onComplete, onBack }) {
  return (
    <Elements stripe={stripePromise}>
      <SignupForm onComplete={onComplete} onBack={onBack} />
    </Elements>
  )
}

function SignupForm({ onComplete, onBack }) {
  const stripe = useStripe()
  const elements = useElements()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [plan, setPlan] = useState('essential')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const showCard = plan === 'business' || plan === 'portfolio'

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 8) e.password = 'Must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setGlobalError('')

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { first_name: form.firstName, last_name: form.lastName } },
      })
      if (authError) throw authError

      const user = authData.user
      if (!user) throw new Error('Signup failed — no user returned.')

      // 2. Insert initial profile row
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        tier: plan,
      })
      if (profileError) throw profileError

      // 3. For paid plans: create Stripe subscription via edge function
      if (showCard) {
        if (!stripe || !elements) throw new Error('Stripe not loaded')

        const cardNumber = elements.getElement(CardNumberElement)
        if (!cardNumber) throw new Error('Card element not found')

        const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumber,
          billing_details: {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
          },
        })
        if (pmError) throw new Error(pmError.message)

        const { data: subData, error: fnError } = await supabase.functions.invoke(
          'create-stripe-subscription',
          {
            body: {
              userId: user.id,
              email: form.email,
              name: `${form.firstName} ${form.lastName}`,
              tier: plan,
              paymentMethodId: paymentMethod.id,
            },
          }
        )
        if (fnError) throw fnError
        if (subData?.error) throw new Error(subData.error)

        // 4. Store Stripe IDs in profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            stripe_customer_id: subData.customerId,
            stripe_subscription_id: subData.subscriptionId,
          })
          .eq('id', user.id)
        if (updateError) throw updateError
      }

      onComplete({
        user,
        tier: plan,
        firstName: form.firstName,
        lastName: form.lastName,
      })
    } catch (err) {
      setGlobalError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: C.ink }}>
          self<span style={{ color: C.accent, fontWeight: 500 }}>audit</span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{ fontSize: 14, color: C.inkMuted, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            ← Back
          </button>
        )}
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 10, color: C.ink }}>
            Create your account
          </h1>
          <p style={{ fontSize: 16, color: C.inkMuted }}>Choose a plan, then set up your credentials.</p>
        </div>

        {/* Account fields */}
        <div style={sectionCard}>
          <SectionLabel>Your details</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field
              label="First name"
              value={form.firstName}
              onChange={v => update('firstName', v)}
              placeholder="Jane"
              error={errors.firstName}
              required
            />
            <Field
              label="Last name"
              value={form.lastName}
              onChange={v => update('lastName', v)}
              placeholder="Smith"
              error={errors.lastName}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field
              label="Email address"
              value={form.email}
              onChange={v => update('email', v)}
              placeholder="jane@company.com"
              type="email"
              error={errors.email}
              required
            />
            <Field
              label="Password"
              value={form.password}
              onChange={v => update('password', v)}
              placeholder="At least 8 characters"
              type="password"
              error={errors.password}
              required
            />
            <Field
              label="Confirm password"
              value={form.confirmPassword}
              onChange={v => update('confirmPassword', v)}
              placeholder="Repeat your password"
              type="password"
              error={errors.confirmPassword}
              required
            />
          </div>
        </div>

        {/* Plan selector */}
        <div style={{ ...sectionCard, marginTop: 16 }}>
          <SectionLabel>Choose your plan</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLANS.map(p => {
              const selected = plan === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '18px 20px',
                    borderRadius: 10,
                    border: selected ? `2px solid ${C.accent}` : `1.5px solid ${C.border}`,
                    background: selected ? C.accentSoft : C.card,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {/* Radio indicator */}
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: selected ? `5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                    background: C.card, transition: 'all 0.15s',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{p.label}</span>
                      {p.popular && (
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: C.accent, background: C.accentSoft, padding: '2px 8px', borderRadius: 100 }}>
                          Popular
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: C.ink }}>
                        {p.price}<span style={{ fontSize: 13, fontWeight: 400, color: C.inkMuted }}>{p.period}</span>
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: C.inkMuted, marginBottom: 8 }}>{p.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.features.map(f => (
                        <span key={f} style={{ fontSize: 12, color: C.inkSoft, background: selected ? 'rgba(92,141,110,0.08)' : C.bg, padding: '2px 10px', borderRadius: 100, border: `1px solid ${C.border}` }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stripe card fields — slide in for paid plans */}
        <div style={{
          maxHeight: showCard ? '320px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ ...sectionCard, marginTop: 16 }}>
            <SectionLabel>Payment details</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StripeField label="Card number">
                <CardNumberElement options={stripeElementStyle} />
              </StripeField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StripeField label="Expiry (MM/YY)">
                  <CardExpiryElement options={stripeElementStyle} />
                </StripeField>
                <StripeField label="CVC">
                  <CardCvcElement options={stripeElementStyle} />
                </StripeField>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.inkMuted, marginTop: 12 }}>
              Secured by Stripe. Your card details are never stored on our servers.
            </p>
          </div>
        </div>

        {/* Global error */}
        {globalError && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: C.errorBg, borderRadius: 8, fontSize: 14, color: C.error }}>
            {globalError}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !stripe}
          style={{
            marginTop: 20, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: loading ? C.inkMuted : C.accent,
            color: 'white', fontSize: 15, fontWeight: 600,
            padding: '15px', borderRadius: 100, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Creating account…' : showCard ? 'Create account + start plan →' : 'Create account →'}
        </button>

        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: C.inkMuted }}>
          Already have an account?{' '}
          <button style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A7A7A', marginBottom: 14 }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', error, required }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 12px', fontSize: 14, color: C.ink,
          background: C.card, borderRadius: 8,
          border: error ? `1.5px solid ${C.error}` : focused ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
          boxShadow: focused && !error ? `0 0 0 3px rgba(92,141,110,0.12)` : 'none',
          outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit',
        }}
      />
      {error && <span style={{ fontSize: 12, color: C.error }}>{error}</span>}
    </div>
  )
}

function StripeField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{label}</label>
      <div style={{
        padding: '11px 12px', background: C.card, borderRadius: 8,
        border: `1.5px solid ${C.border}`, transition: 'border 0.15s',
      }}>
        {children}
      </div>
    </div>
  )
}

const sectionCard = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '24px',
}
