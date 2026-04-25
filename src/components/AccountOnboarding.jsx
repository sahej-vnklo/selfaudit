import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

// ─── Data ────────────────────────────────────────────────────────────────────

const DOMAINS = [
  { id: 'strategy',   label: 'Strategy' },
  { id: 'operations', label: 'Operations' },
  { id: 'sales',      label: 'Sales' },
  { id: 'marketing',  label: 'Marketing' },
  { id: 'finance',    label: 'Finance' },
  { id: 'people',     label: 'People & culture' },
  { id: 'product',    label: 'Product' },
  { id: 'cx',         label: 'Customer experience' },
]

const BUSINESS_OPTIONS = ['Retail', 'SaaS', 'Service', 'Manufacturing', 'Agency', 'Other']
const PERSONAL_OPTIONS  = ['Career', 'Finance', 'Health', 'Relationships', 'Other']

function buildContext(type, category, domains) {
  const list = domains.join(', ')
  return type === 'business'
    ? `${category} business. Looking to audit: ${list}.`
    : `Personal goals — focused on ${category}. Looking to audit: ${list}.`
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
      {[1, 2, 3, 4].map(n => (
        <div key={n} style={{
          flex: 1, height: 3, borderRadius: 3,
          background: n <= current ? 'var(--green)' : 'var(--gray-200)',
          transition: 'background 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ─── Step 1 — type ────────────────────────────────────────────────────────────

function Step1({ onSelect }) {
  return (
    <div>
      <p style={s.eyebrow}>Step 1 of 4</p>
      <h2 style={s.title}>What are you auditing?</h2>
      <p style={s.sub}>This shapes every question the audit asks.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32 }}>
        {[
          { type: 'business', icon: '🏢', label: 'Business', desc: 'A company, startup, or side project' },
          { type: 'personal', icon: '👤', label: 'Personal', desc: 'Career, goals, finances, or decisions' },
        ].map(opt => (
          <button
            key={opt.type}
            style={s.typeCard}
            onClick={() => onSelect(opt.type)}
            onMouseEnter={e => Object.assign(e.currentTarget.style, s.typeCardHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { borderColor: 'var(--gray-200)', background: 'var(--white)' })}
          >
            <span style={s.typeIcon}>{opt.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={s.typeLabel}>{opt.label}</div>
              <div style={s.typeDesc}>{opt.desc}</div>
            </div>
            <span style={s.typeArrow}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2 — category ────────────────────────────────────────────────────────

function Step2({ type, onSelect, onBack }) {
  const options  = type === 'business' ? BUSINESS_OPTIONS : PERSONAL_OPTIONS
  const heading  = type === 'business' ? 'What industry?' : 'What area of life?'
  const subtext  = type === 'business'
    ? 'Helps the audit use the right benchmarks.'
    : 'Helps the audit focus its questions.'

  return (
    <div>
      <p style={s.eyebrow}>Step 2 of 4</p>
      <h2 style={s.title}>{heading}</h2>
      <p style={s.sub}>{subtext}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
        {options.map(opt => (
          <button
            key={opt}
            style={s.pill}
            onClick={() => onSelect(opt)}
            onMouseEnter={e => Object.assign(e.currentTarget.style, s.pillHover)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'var(--gray-100)', color: 'var(--gray-800)', borderColor: 'var(--gray-200)' })}
          >
            {opt}
          </button>
        ))}
      </div>
      <BackLink onClick={onBack} />
    </div>
  )
}

// ─── Step 3 — domains ─────────────────────────────────────────────────────────

function Step3({ tier, selected, onToggle, onNext, onBack }) {
  const isFree   = tier === 'free'
  const canNext  = isFree ? selected.length === 1 : selected.length === DOMAINS.length
  const hint     = isFree
    ? `Choose 1 domain to focus your audit. (${selected.length}/1 selected)`
    : 'All domains included — the audit will cover everything.'

  return (
    <div>
      <p style={s.eyebrow}>Step 3 of 4</p>
      <h2 style={s.title}>{isFree ? 'Pick your focus.' : 'Everything is covered.'}</h2>
      <p style={s.sub}>{hint}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 28 }}>
        {DOMAINS.map(d => {
          const active   = selected.includes(d.label)
          const disabled = isFree && !active && selected.length >= 1
          return (
            <button
              key={d.id}
              disabled={disabled}
              onClick={() => !disabled && onToggle(d.label)}
              style={{
                ...s.domainCard,
                ...(active ? s.domainCardActive : {}),
                ...(disabled ? s.domainCardDisabled : {}),
              }}
            >
              {active && <span style={s.domainCheck}>✓</span>}
              {d.label}
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
      <p style={s.eyebrow}>Step 4 of 4</p>
      <h2 style={s.title}>Does this sound right?</h2>
      <p style={s.sub}>
        We generated a context summary from your answers. Edit it until it feels accurate — the audit uses this to ask the right questions.
      </p>
      <textarea
        style={s.textarea}
        value={contextText}
        onChange={e => setContextText(e.target.value)}
        rows={5}
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

export default function AccountOnboarding({ user, onComplete }) {
  const [step,     setStep]     = useState(1)
  const [type,     setType]     = useState(null)
  const [category, setCategory] = useState(null)
  const [domains,  setDomains]  = useState([])
  const [ctxText,  setCtxText]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [tier,     setTier]     = useState('free')

  // Fetch tier from profile
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('tier').eq('id', user.id).single()
      .then(({ data }) => { if (data) setTier(data.tier) })
  }, [user])

  // Paid tier: auto-select all domains when reaching step 3
  useEffect(() => {
    if (step !== 3 || tier !== 'paid') return
    const labels = DOMAINS.map(d => d.label)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDomains(labels.slice(0, i))
      if (i >= labels.length) clearInterval(interval)
    }, 80)
    return () => clearInterval(interval)
  }, [step, tier])

  const handleType = (t) => { setType(t); setStep(2) }

  const handleCategory = (c) => {
    setCategory(c)
    setStep(3)
    if (tier === 'free') setDomains([])
  }

  const toggleDomain = (label) => {
    if (tier === 'free') {
      setDomains(prev => prev.includes(label) ? [] : [label])
    }
    // paid: controlled by animation, no manual toggle
  }

  const handleDomainsNext = () => {
    const generated = buildContext(type, category, domains)
    setCtxText(generated)
    setStep(4)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles')
      .update({ context: ctxText.trim(), onboarding_complete: true })
      .eq('id', user.id)
    setSaving(false)
    onComplete()
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
        <div style={{ ...s.card, maxWidth: step === 3 ? 540 : 480 }}>
          <StepBar current={step} />

          {step === 1 && <Step1 onSelect={handleType} />}

          {step === 2 && (
            <Step2
              type={type}
              onSelect={handleCategory}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <Step3
              tier={tier}
              selected={domains}
              onToggle={toggleDomain}
              onNext={handleDomainsNext}
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

  // Step 1 — type cards
  typeCard: {
    display: 'flex', alignItems: 'center', gap: 16, width: '100%',
    padding: '20px 22px', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)', background: 'var(--white)',
    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
  },
  typeCardHover: { borderColor: 'var(--green)', background: 'var(--green-light)' },
  typeIcon:  { fontSize: 28, flexShrink: 0 },
  typeLabel: { fontSize: 15, fontWeight: 600, color: 'var(--black)', marginBottom: 2 },
  typeDesc:  { fontSize: 13, color: 'var(--gray-600)' },
  typeArrow: { marginLeft: 'auto', fontSize: 18, color: 'var(--green)', flexShrink: 0 },

  // Step 2 — pills
  pill: {
    padding: '10px 20px', borderRadius: 'var(--radius-pill)',
    border: '0.5px solid var(--gray-200)', background: 'var(--gray-100)',
    fontSize: 14, fontWeight: 500, color: 'var(--gray-800)',
    cursor: 'pointer', transition: 'all 0.15s',
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
    fontFamily: 'var(--sans)',
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
