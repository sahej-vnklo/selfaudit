import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

const PLAN_INFO = {
  essential: { label: 'Essential', price: '$49', period: '/mo' },
  business:  { label: 'Business',  price: '$99', period: '/mo' },
  portfolio: { label: 'Portfolio', price: '$299', period: '/mo' },
}

const UPGRADE_PLANS = [
  {
    id: 'business',
    label: 'Business',
    price: '$99/mo',
    features: ['5 workspaces', 'Multi-domain scoping', 'Priority reporting', 'Team access'],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    price: '$299/mo',
    features: ['Unlimited workspaces', 'All domains', 'Portfolio dashboard', 'Dedicated support'],
  },
]

export default function Dashboard({ user, tier: tierProp }) {
  const [profile, setProfile] = useState(null)
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)

  const tier = profile?.tier || tierProp || 'essential'
  const isPaid = tier === 'business' || tier === 'portfolio'

  // Load profile
  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    })()
  }, [user?.id])

  // Load billing details for paid users
  useEffect(() => {
    if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) return
    setBillingLoading(true)
    setBillingError('')
    ;(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-billing-details', {
          body: {
            customerId: profile.stripe_customer_id,
            subscriptionId: profile.stripe_subscription_id,
          },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        setBilling(data)
      } catch (err) {
        setBillingError(err.message || 'Could not load billing details.')
      } finally {
        setBillingLoading(false)
      }
    })()
  }, [profile?.stripe_customer_id, profile?.stripe_subscription_id])

  const openPortal = async () => {
    if (!profile?.stripe_customer_id) return
    setPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          customerId: profile.stripe_customer_id,
          returnUrl: window.location.href,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setBillingError(err.message || 'Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const firstName = profile?.first_name || user?.user_metadata?.first_name || 'there'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Nav */}
      <nav style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: C.ink }}>
          self<span style={{ color: C.accent, fontWeight: 500 }}>audit</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: C.inkMuted }}>
            {profile?.first_name} {profile?.last_name}
          </span>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
            style={{ fontSize: 13, color: C.inkMuted, background: 'none', border: `1px solid ${C.border}`, borderRadius: 100, padding: '6px 16px', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: C.ink, marginBottom: 6 }}>
            Welcome back, {firstName}.
          </h1>
          <p style={{ fontSize: 15, color: C.inkMuted }}>
            You're on the <strong style={{ color: C.ink }}>{PLAN_INFO[tier]?.label || tier}</strong> plan.
          </p>
        </div>

        {/* Billing section */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: C.inkMuted, marginBottom: 18 }}>
            Billing
          </div>

          {isPaid ? (
            <PaidBillingCard
              tier={tier}
              billing={billing}
              billingLoading={billingLoading}
              billingError={billingError}
              onOpenPortal={openPortal}
              portalLoading={portalLoading}
            />
          ) : (
            <EssentialBillingCard />
          )}
        </section>
      </div>
    </div>
  )
}

function PaidBillingCard({ tier, billing, billingLoading, billingError, onOpenPortal, portalLoading }) {
  const plan = PLAN_INFO[tier]

  const nextBillingDate = billing?.current_period_end
    ? new Date(billing.current_period_end * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const cardExpiry = billing?.card
    ? `${String(billing.card.exp_month).padStart(2, '0')}/${String(billing.card.exp_year).slice(-2)}`
    : null

  const cardBrand = billing?.card?.brand
    ? billing.card.brand.charAt(0).toUpperCase() + billing.card.brand.slice(1)
    : 'Card'

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Plan row */}
      <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 4 }}>Current plan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>
            {plan.label}
            <span style={{ fontSize: 14, fontWeight: 400, color: C.inkMuted, marginLeft: 8 }}>
              {plan.price}{plan.period}
            </span>
          </div>
        </div>
        <div style={{
          padding: '5px 14px', borderRadius: 100,
          background: C.accentSoft, color: C.accentDark,
          fontSize: 12, fontWeight: 600,
        }}>
          Active
        </div>
      </div>

      {/* Details */}
      {billingLoading ? (
        <div style={{ padding: '28px', color: C.inkMuted, fontSize: 14 }}>Loading billing details…</div>
      ) : billingError ? (
        <div style={{ padding: '28px', color: C.error, fontSize: 14, background: C.errorBg }}>{billingError}</div>
      ) : (
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, borderBottom: `1px solid ${C.border}` }}>
          <DetailRow
            label="Next billing date"
            value={nextBillingDate || '—'}
          />
          <DetailRow
            label="Payment method"
            value={billing?.card
              ? `${cardBrand} ···· ${billing.card.last4}  ·  ${cardExpiry}`
              : '—'
            }
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '20px 28px' }}>
        <button
          onClick={onOpenPortal}
          disabled={portalLoading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 100,
            background: 'transparent', border: `1.5px solid ${C.border}`,
            color: C.ink, fontSize: 14, fontWeight: 500,
            cursor: portalLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.borderColor = C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
        >
          {portalLoading ? 'Redirecting…' : 'Update payment method →'}
        </button>
      </div>
    </div>
  )
}

function EssentialBillingCard() {
  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 4 }}>Current plan</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>
              Essential
              <span style={{ fontSize: 14, fontWeight: 400, color: C.inkMuted, marginLeft: 8 }}>$49/mo</span>
            </div>
          </div>
          <div style={{ padding: '5px 14px', borderRadius: 100, background: C.accentSoft, color: C.accentDark, fontSize: 12, fontWeight: 600 }}>
            Active
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 14 }}>
        Upgrade your plan
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {UPGRADE_PLANS.map(p => (
          <div
            key={p.id}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px' }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{p.label}</div>
            <div style={{ fontSize: 14, color: C.accent, fontWeight: 600, marginBottom: 14 }}>{p.price}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: C.inkSoft, display: 'flex', gap: 8 }}>
                  <span style={{ color: C.accent, fontWeight: 700, flexShrink: 0 }}>→</span> {f}
                </li>
              ))}
            </ul>
            <button style={{
              width: '100%', padding: '10px', borderRadius: 100,
              background: C.accent, color: 'white', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Upgrade to {p.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: C.inkMuted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{value}</div>
    </div>
  )
}
