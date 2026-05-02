import React, { useState, useEffect } from 'react'
import * as Sentry from '@sentry/react'
import { usePostHog } from '@posthog/react'

// ─── Data ────────────────────────────────────────────────────────────────────

const DOMAINS = [
  { id: 'strategy',     label: 'Strategy' },
  { id: 'operations',   label: 'Operations' },
  { id: 'sales',        label: 'Sales' },
  { id: 'marketing',    label: 'Marketing' },
  { id: 'finance',      label: 'Finance' },
  { id: 'people',       label: 'People & Culture' },
  { id: 'product',      label: 'Product' },
  { id: 'cx',           label: 'Customer Experience' },
  { id: 'technology',   label: 'Technology' },
  { id: 'legal',        label: 'Legal & Compliance' },
  { id: 'supply',       label: 'Supply Chain' },
  { id: 'brand',        label: 'Brand' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'data',         label: 'Data & Analytics' },
]

const BUSINESS_OPTIONS = [
  'SaaS', 'Agency', 'Retail', 'E-commerce', 'Restaurant / Food',
  'Healthcare', 'Legal', 'Real Estate', 'Construction', 'Manufacturing',
  'Logistics', 'Education', 'Finance / Accounting', 'Insurance',
  'Consulting', 'Marketing', 'Media / Publishing', 'Travel / Hospitality',
  'Nonprofit', 'Freelancer / Solo', 'Other',
]

// Domains relevant to each industry — drives Step 3 filter
const ALL_DOMAIN_LABELS = DOMAINS.map(d => d.label)

const DOMAIN_MAP = {
  'SaaS':                 ['Strategy', 'Product', 'Sales', 'Marketing', 'Customer Experience', 'Technology', 'Data & Analytics', 'Finance', 'People & Culture'],
  'Agency':               ['Strategy', 'Sales', 'Marketing', 'Operations', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Retail':               ['Strategy', 'Operations', 'Marketing', 'Sales', 'Supply Chain', 'Customer Experience', 'Finance', 'Brand'],
  'E-commerce':           ['Strategy', 'Marketing', 'Operations', 'Technology', 'Customer Experience', 'Supply Chain', 'Data & Analytics', 'Finance'],
  'Restaurant / Food':    ['Operations', 'Marketing', 'Finance', 'People & Culture', 'Customer Experience', 'Brand', 'Supply Chain'],
  'Healthcare':           ['Operations', 'Strategy', 'Legal & Compliance', 'People & Culture', 'Finance', 'Technology', 'Customer Experience'],
  'Legal':                ['Operations', 'Strategy', 'Legal & Compliance', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Real Estate':          ['Sales', 'Marketing', 'Operations', 'Finance', 'Strategy', 'Brand', 'Customer Experience'],
  'Construction':         ['Operations', 'Finance', 'People & Culture', 'Supply Chain', 'Strategy', 'Legal & Compliance'],
  'Manufacturing':        ['Operations', 'Supply Chain', 'Finance', 'Technology', 'People & Culture', 'Strategy', 'Legal & Compliance'],
  'Logistics':            ['Operations', 'Supply Chain', 'Technology', 'Finance', 'Strategy', 'People & Culture'],
  'Education':            ['Strategy', 'Operations', 'Marketing', 'Technology', 'People & Culture', 'Finance', 'Customer Experience'],
  'Finance / Accounting': ['Strategy', 'Operations', 'Legal & Compliance', 'Technology', 'People & Culture', 'Finance', 'Data & Analytics'],
  'Insurance':            ['Operations', 'Legal & Compliance', 'Finance', 'Technology', 'Strategy', 'Customer Experience'],
  'Consulting':           ['Strategy', 'Operations', 'Sales', 'Marketing', 'People & Culture', 'Finance', 'Brand'],
  'Marketing':            ['Strategy', 'Brand', 'Data & Analytics', 'Operations', 'Sales', 'Customer Experience', 'Technology'],
  'Media / Publishing':   ['Strategy', 'Brand', 'Marketing', 'Operations', 'Finance', 'Technology', 'Data & Analytics'],
  'Travel / Hospitality': ['Operations', 'Customer Experience', 'Marketing', 'Finance', 'Brand', 'People & Culture'],
  'Nonprofit':            ['Strategy', 'Operations', 'Finance', 'Marketing', 'People & Culture', 'Partnerships'],
  'Freelancer / Solo':    ['Strategy', 'Sales', 'Marketing', 'Finance', 'Brand', 'Operations'],
  'Other':                ['Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & Culture', 'Technology', 'Customer Experience'],
}

function buildContext(tier, industry, domain) {
  const article = /^[aeiou]/i.test(industry) ? 'an' : 'a'

  if (tier === 'business') {
    return `You run ${article} ${industry} business and want a comprehensive audit across your entire operation. This audit will examine every function of your business to surface the highest-impact opportunities for growth. Be as specific as possible below — the more context you give, the sharper the questions.`
  }
  if (tier === 'portfolio') {
    return `You manage multiple businesses across different industries. This audit will evaluate your portfolio for operational efficiency, cross-business leverage, and where AI can create the most compounded value across your holdings. Be as specific as possible below — the more context you give, the sharper the questions.`
  }
  // essential (default)
  return `You run ${article} ${industry} business and want a deep audit of your ${domain}. This audit will focus on identifying structural gaps, missed opportunities, and the single most important lever for growth. Be as specific as possible below — the more context you give, the sharper the questions.`
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          flex: 1, height: 3, borderRadius: 3,
          background: n <= current ? 'var(--green)' : 'var(--gray-200)',
          transition: 'background 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ─── Step 1 — category ────────────────────────────────────────────────────────

function Step2({ onSelect, loadingTier }) {
  return (
    <div>
      <p style={s.eyebrow}>Step 1 of 3</p>
      <h2 style={s.title}>What industry?</h2>
      <p style={s.sub}>Helps the audit use the right benchmarks.</p>
      {loadingTier ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 36, color: 'var(--gray-400)', fontSize: 14 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--gray-200)', borderTopColor: 'var(--green)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          Loading your plan details…
        </div>
      ) : (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28,
          maxHeight: 340, overflowY: 'auto', paddingRight: 4,
        }}>
          {BUSINESS_OPTIONS.map(opt => (
            <button
              key={opt}
              style={s.pill}
              onClick={() => onSelect(opt)}
              onMouseEnter={e => Object.assign(e.currentTarget.style, s.pillHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, {
                background: 'var(--gray-100)', color: 'var(--gray-800)', borderColor: 'var(--gray-200)',
              })}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 3 — domains ─────────────────────────────────────────────────────────

function isPaidTier(tier) {
  return tier === 'paid' || tier === 'business' || tier === 'portfolio'
}

function Step3({ tier, selected, onToggle, onNext, onBack, domainLabels }) {
  const isFree  = !isPaidTier(tier)
  const canNext = isFree ? selected.length >= 1 : true
  const hint    = isFree
    ? `Choose 1 domain to focus your audit. (${selected.length}/1 selected)`
    : tier === 'portfolio'
    ? 'Your Portfolio plan covers every domain across all industries. Deselect anything that doesn\'t apply.'
    : 'Your Business plan covers all domains for your industry — the audit runs across everything.'

  return (
    <div>
      <p style={s.eyebrow}>Step 2 of 3</p>
      <h2 style={s.title}>{isFree ? 'Pick your focus.' : 'Everything is covered.'}</h2>

      {!isFree && (
        <div style={s.proBanner}>
          ✦ Your Pro plan includes full-spectrum auditing across all domains.
        </div>
      )}

      <p style={s.sub}>{hint}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
        {domainLabels.map(label => {
          const active   = selected.includes(label)
          const disabled = isFree && !active && selected.length >= 1
          return (
            <button
              key={label}
              disabled={disabled}
              onClick={() => !disabled && onToggle(label)}
              style={{
                ...s.domainCard,
                ...(active   ? s.domainCardActive   : {}),
                ...(disabled ? s.domainCardDisabled : {}),
              }}
            >
              {active && <span style={s.domainCheck}>✓</span>}
              {label}
            </button>
          )
        })}
      </div>

      <button
        style={{ ...s.btn, marginTop: 28, opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'not-allowed' }}
        onClick={onNext}
        disabled={!canNext}
      >
        Continue →
      </button>
      <BackLink onClick={onBack} />
    </div>
  )
}

// ─── Step 4 — context summary ─────────────────────────────────────────────────

function Step4({ contextText, setContextText, onSave, saving }) {
  return (
    <div>
      <p style={s.eyebrow}>Step 3 of 3</p>
      <h2 style={s.title}>Does this sound right?</h2>
      <p style={s.sub}>
        We generated a context summary from your answers. Edit it until it feels accurate — the audit uses this to ask the right questions.
      </p>
      <textarea
        style={s.textarea}
        value={contextText}
        onChange={e => setContextText(e.target.value)}
        placeholder="Add anything else — your biggest challenge, your goal, what's been tried..."
        rows={6}
      />
      <button
        style={{ ...s.btn, marginTop: 16, opacity: saving ? 0.7 : 1 }}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save and go to dashboard →'}
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BackLink({ onClick }) {
  return (
    <button style={s.back} onClick={onClick}>← Back</button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AccountOnboarding({ user, onComplete, onBack }) {
  const [step,            setStep]            = useState(2)
  const [category,        setCategory]        = useState(null)
  const [domains,         setDomains]         = useState([])
  const [ctxText,         setCtxText]         = useState('')
  const [saving,          setSaving]          = useState(false)
  const [tier,            setTier]            = useState('free')
  const [tierLoaded,      setTierLoaded]      = useState(false)
  const [pendingCategory, setPendingCategory] = useState(null)
  const posthog = usePostHog()

  // Domains available for Step 3 — filtered by selected industry
  const availableDomains = React.useMemo(
    () => (category && DOMAIN_MAP[category]) ? DOMAIN_MAP[category] : ALL_DOMAIN_LABELS,
    [category]
  )

  // Fetch tier directly from Supabase client — more reliable than the server
  // API which requires SUPABASE_SERVICE_ROLE_KEY to be set in the environment.
  useEffect(() => {
    if (!user?.id) return
    import('../lib/supabase.js').then(({ initSupabase }) =>
      initSupabase().then(sb =>
        sb.from('profiles').select('tier').eq('id', user.id).single()
      )
    )
      .then(({ data }) => {
        setTier(data?.tier ?? 'free')
        setTierLoaded(true)
      })
      .catch((err) => {
        Sentry.captureException(err)
        setTierLoaded(true) // unblock with default 'free' tier on any error
      })
  }, [user])

  // If user clicked an industry before tier resolved, advance to step 3 now
  useEffect(() => {
    if (!tierLoaded || pendingCategory === null) return
    setStep(3)
    if (!isPaidTier(tier)) setDomains([])
    setPendingCategory(null)
  }, [tierLoaded, pendingCategory, tier])

  // Paid tiers: animate domains selecting one by one.
  // Portfolio cascades ALL domain labels; business/paid uses the industry-filtered set.
  useEffect(() => {
    if (step !== 3 || !isPaidTier(tier)) return
    const source = tier === 'portfolio' ? ALL_DOMAIN_LABELS : availableDomains
    let i = 0
    const interval = setInterval(() => {
      i++
      setDomains(source.slice(0, i))
      if (i >= source.length) clearInterval(interval)
    }, tier === 'portfolio' ? 80 : 150)
    return () => clearInterval(interval)
  }, [step, tier, availableDomains])

  const handleCategory = (c) => {
    posthog?.capture('account_onboarding_industry_selected', { industry: c, tier })
    setCategory(c)
    if (!tierLoaded) {
      // Tier fetch still in-flight — store intent and advance once it resolves
      setPendingCategory(c)
      return
    }
    setStep(3)
    if (!isPaidTier(tier)) setDomains([])
  }

  const toggleDomain = (label) => {
    if (!isPaidTier(tier)) {
      setDomains(prev => prev.includes(label) ? [] : [label])
    } else {
      // Paid tiers: allow deselect/reselect after animation completes
      setDomains(prev =>
        prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label]
      )
    }
  }

  const handleDomainsNext = () => {
    const selectedDomain = isPaidTier(tier) ? (domains[0] ?? null) : domains[0]
    const generated = buildContext(tier, category, selectedDomain)
    setCtxText(generated)
    setStep(4)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const userId  = user.id
      const context = ctxText.trim()
      const selectedDomain = domains[0] ?? null
      console.log('[onboarding] posting to save-context with:', { userId, context, industry: category, domain: selectedDomain })
      const res = await fetch('/api/save-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, context, industry: category, domain: selectedDomain }),
      })
      const result = await res.json().catch(() => ({}))
      console.log('[onboarding] save-context response:', result)
      if (!res.ok) {
        console.error('[onboarding] save-context error:', result.error)
        // Still navigate — don't block the user on a non-critical save failure
      }
      posthog?.capture('account_onboarding_completed', { industry: category, domain: selectedDomain, tier })
    } catch (e) {
      Sentry.captureException(e)
      console.error('[onboarding] save-context fetch failed:', e.message)
    } finally {
      setSaving(false)
      onComplete()
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>Setting up your account</div>
      </nav>

      <div style={s.wrap}>
        <div style={{ ...s.card, maxWidth: step === 3 ? 560 : 480 }}>
          <StepBar current={step - 1} />

          {step === 2 && (
            <Step2
              onSelect={handleCategory}
              loadingTier={pendingCategory !== null && !tierLoaded}
            />
          )}

          {step === 3 && (
            <Step3
              tier={tier}
              selected={domains}
              onToggle={toggleDomain}
              onNext={handleDomainsNext}
              domainLabels={availableDomains}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <Step4
              contextText={ctxText}
              setContextText={setCtxText}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  page:    { minHeight: '100vh', background: 'var(--gray-100)' },
  nav:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2.5rem', background: 'var(--white)', borderBottom: '0.5px solid var(--gray-200)' },
  logo:    { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  wrap:    { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card:    { background: 'var(--white)', borderRadius: 'var(--radius)', border: '0.5px solid var(--gray-200)', padding: '2.5rem', width: '100%', animation: 'fadeUp 0.35s ease', transition: 'max-width 0.3s ease' },

  eyebrow: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--green)', fontWeight: 600, marginBottom: 8 },
  title:   { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, marginBottom: 8 },
  sub:     { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 },

  proBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--green-light)', border: '0.5px solid var(--green)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: 13, fontWeight: 500, color: 'var(--green-dark)',
    marginBottom: 14, marginTop: 4,
  },

  // Step 1 — pills
  pill: {
    padding: '10px 20px', borderRadius: 'var(--radius-pill)',
    border: '0.5px solid var(--gray-200)', background: 'var(--gray-100)',
    fontSize: 14, fontWeight: 500, color: 'var(--gray-800)',
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  pillHover: { background: 'var(--green)', color: 'white', borderColor: 'var(--green)' },

  // Step 3 — domain cards
  domainCard: {
    padding: '14px 16px', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)', background: 'var(--white)',
    fontSize: 14, fontWeight: 500, color: 'var(--gray-800)',
    cursor: 'pointer', textAlign: 'left', position: 'relative',
    transition: 'all 0.18s',
  },
  domainCardActive: {
    background: 'var(--green-light)', borderColor: 'var(--green)',
    color: 'var(--green-dark)',
  },
  domainCardDisabled: {
    opacity: 0.35, cursor: 'not-allowed',
  },
  domainCheck: {
    position: 'absolute', top: 10, right: 12,
    fontSize: 11, color: 'var(--green)', fontWeight: 700,
  },

  // Step 4
  textarea: {
    width: '100%', marginTop: 20, padding: '12px 14px',
    border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius)',
    fontSize: 14, color: 'var(--black)', lineHeight: 1.7,
    resize: 'vertical', background: 'var(--gray-100)',
    fontFamily: 'var(--sans)', minHeight: 120,
    boxSizing: 'border-box',
  },

  // Shared
  btn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, padding: '13px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  back: {
    display: 'block', marginTop: 16, background: 'none', border: 'none',
    fontSize: 13, color: 'var(--gray-400)', cursor: 'pointer', padding: 0,
  },
}
