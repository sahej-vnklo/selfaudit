import React, { useState } from 'react'

const DOMAINS = [
  'Business strategy',
  'Operations',
  'Sales',
  'Marketing',
  'Finance',
  'People & culture',
  'Product',
  'Customer experience',
  'Leadership',
]

const PLANS = [
  {
    id: 'essential',
    label: 'Essential',
    price: '$19/mo',
    description: 'Pick up to 3 domains for a deep-dive audit.',
    features: ['Choose up to 3 domains', 'Full written report', 'Root cause diagnosis', 'AI opportunity mapping'],
  },
  {
    id: 'business',
    label: 'Business',
    price: '$49/mo',
    description: 'Every department. Every blind spot. Nothing missed.',
    features: ['All 9 domains covered', 'Unlimited sessions', 'Full drill-down audit', 'Priority action list'],
    recommended: true,
  },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState(null)
  const [selectedDomains, setSelectedDomains] = useState([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', context: '' })
  const [errors, setErrors] = useState({})

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Step 0 → Step 1: plan chosen, set domains
  const handlePlanSelect = (p) => {
    setPlan(p)
    setSelectedDomains(p === 'business' ? [...DOMAINS] : [])
    setStep(1)
  }

  // Step 1 → Step 2: domains confirmed
  const handleDomainsNext = () => setStep(2)

  const toggleDomain = (d) => {
    if (plan === 'business') return // all locked-in for business
    if (selectedDomains.includes(d)) {
      setSelectedDomains(prev => prev.filter(x => x !== d))
    } else if (selectedDomains.length < 3) {
      setSelectedDomains(prev => [...prev, d])
    }
  }

  const validateInfo = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.context.trim()) e.context = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (validateInfo()) {
      onComplete({ ...form, plan, selectedDomains })
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.stepIndicator}>
          {['Plan', 'Domains', 'You'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                ...styles.stepDot,
                background: i < step ? 'var(--green)' : i === step ? 'var(--green)' : 'var(--gray-200)',
                color: i <= step ? 'white' : 'var(--gray-400)',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ ...styles.stepLabel, color: i === step ? 'var(--black)' : 'var(--gray-400)' }}>{label}</span>
              {i < 2 && <span style={{ color: 'var(--gray-200)', fontSize: 12, marginLeft: 2 }}>›</span>}
            </div>
          ))}
        </div>
      </nav>

      <div style={styles.wrap}>

        {/* Step 0: Plan selection */}
        {step === 0 && (
          <div style={styles.card}>
            <div style={styles.header}>
              <p style={styles.stepLabel2}>Step 1 of 3</p>
              <h2 style={styles.title}>Choose your plan</h2>
              <p style={styles.sub}>Your first audit is free — pick a plan to unlock the full experience.</p>
            </div>
            <div style={styles.planGrid}>
              {PLANS.map(p => (
                <button
                  key={p.id}
                  style={{
                    ...styles.planCard,
                    ...(p.recommended ? styles.planCardRecommended : {}),
                  }}
                  onClick={() => handlePlanSelect(p.id)}
                >
                  {p.recommended && (
                    <div style={styles.recommendedBadge}>Most popular</div>
                  )}
                  <div style={styles.planName}>{p.label}</div>
                  <div style={styles.planPrice}>{p.price}</div>
                  <p style={styles.planDesc}>{p.description}</p>
                  <ul style={styles.planFeatures}>
                    {p.features.map(f => (
                      <li key={f} style={styles.planFeatureItem}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>→</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div style={{
                    ...styles.selectPlanBtn,
                    background: p.recommended ? 'var(--green)' : 'transparent',
                    color: p.recommended ? 'white' : 'var(--black)',
                    border: p.recommended ? 'none' : '1px solid var(--gray-200)',
                  }}>
                    Select {p.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Domain selection */}
        {step === 1 && (
          <div style={styles.card}>
            <div style={styles.header}>
              <p style={styles.stepLabel2}>Step 2 of 3</p>
              <h2 style={styles.title}>
                {plan === 'business' ? 'All domains — covered.' : 'Select up to 3 domains'}
              </h2>
              <p style={styles.sub}>
                {plan === 'business'
                  ? 'Your Business plan covers every area of your business. Every blind spot will be audited.'
                  : `Pick the 3 areas you most want to dig into. You can always run another audit later.`}
              </p>
            </div>

            <div style={styles.domainsGrid}>
              {DOMAINS.map(d => {
                const isSelected = selectedDomains.includes(d)
                const isDisabled = plan !== 'business' && !isSelected && selectedDomains.length >= 3
                return (
                  <button
                    key={d}
                    onClick={() => toggleDomain(d)}
                    disabled={isDisabled}
                    style={{
                      ...styles.domainChip,
                      ...(isSelected ? styles.domainChipSelected : {}),
                      ...(isDisabled ? styles.domainChipDisabled : {}),
                    }}
                  >
                    <span style={styles.domainChipCheck}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {d}
                    {plan === 'business' && isSelected && (
                      <span style={styles.coveredBadge}>Covered in your plan</span>
                    )}
                  </button>
                )
              })}
            </div>

            {plan === 'essential' && (
              <p style={styles.selectionCount}>
                {selectedDomains.length} of 3 selected
              </p>
            )}

            <div style={styles.stepActions}>
              <button style={styles.backBtn} onClick={() => setStep(0)}>← Back</button>
              <button
                style={{
                  ...styles.nextBtn,
                  ...(plan === 'business' || selectedDomains.length > 0 ? {} : styles.nextBtnDisabled),
                }}
                onClick={handleDomainsNext}
                disabled={plan !== 'business' && selectedDomains.length === 0}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: User info */}
        {step === 2 && (
          <div style={styles.card}>
            <div style={styles.header}>
              <p style={styles.stepLabel2}>Step 3 of 3</p>
              <h2 style={styles.title}>Tell us about yourself</h2>
              <p style={styles.sub}>So we can tailor the audit — and so Vnklo knows who to reach out to if you want help.</p>
            </div>

            <div style={styles.fields}>
              <Field
                label="Your name"
                value={form.name}
                onChange={v => update('name', v)}
                placeholder="Jane Smith"
                error={errors.name}
                required
              />
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
                label="Phone number"
                value={form.phone}
                onChange={v => update('phone', v)}
                placeholder="+1 (555) 000-0000"
                type="tel"
                hint="Optional — but helpful if Vnklo reaches out"
              />
              <Field
                label="What are you auditing today?"
                value={form.context}
                onChange={v => update('context', v)}
                placeholder="e.g. My e-commerce business, My SaaS startup, My personal productivity..."
                multiline
                error={errors.context}
                required
              />
            </div>

            <div style={styles.stepActions}>
              <button style={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
              <button style={styles.submitBtn} onClick={handleSubmit}>
                Start the audit →
              </button>
            </div>

            <p style={styles.privacy}>
              Your info is only used to personalize the audit and optionally share with Vnklo if you choose to.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint, error, required, multiline }) {
  const [focused, setFocused] = useState(false)
  const inputStyle = {
    ...styles.input,
    ...(focused ? styles.inputFocused : {}),
    ...(error ? styles.inputError : {}),
    ...(multiline ? { height: 80, resize: 'none', paddingTop: 10 } : {}),
  }
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>
        {label}
        {required && <span style={{ color: 'var(--green)', marginLeft: 3 }}>*</span>}
      </label>
      {multiline ? (
        <textarea
          style={inputStyle}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          style={inputStyle}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        />
      )}
      {hint && !error && <p style={styles.hint}>{hint}</p>}
      {error && <p style={styles.errorMsg}>{error}</p>}
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--gray-100)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2.5rem',
    background: 'var(--white)',
    borderBottom: '0.5px solid var(--gray-200)',
  },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  stepIndicator: { display: 'flex', alignItems: 'center', gap: 12 },
  stepDot: {
    width: 22, height: 22, borderRadius: '50%',
    fontSize: 11, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  stepLabel: { fontSize: 12, fontWeight: 500 },
  wrap: { display: 'flex', justifyContent: 'center', padding: '3rem 1.5rem' },
  card: {
    background: 'var(--white)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)',
    padding: '2.5rem', width: '100%', maxWidth: 560,
    animation: 'fadeUp 0.4s ease',
  },
  header: { marginBottom: '2rem' },
  stepLabel2: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, marginBottom: 8, lineHeight: 1.3 },
  sub: { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 },

  // Plan selection
  planGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  planCard: {
    background: 'var(--white)', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '1.5rem',
    textAlign: 'left', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 8,
    position: 'relative', transition: 'border-color 0.15s',
    fontFamily: 'var(--sans)',
  },
  planCardRecommended: {
    border: '2px solid var(--green)',
    boxShadow: '0 4px 20px rgba(29,158,117,0.1)',
  },
  recommendedBadge: {
    position: 'absolute', top: -11, right: 16,
    background: 'var(--green)', color: 'white',
    fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
    textTransform: 'uppercase', padding: '3px 10px',
    borderRadius: 'var(--radius-pill)',
  },
  planName: { fontSize: 15, fontWeight: 600, color: 'var(--black)' },
  planPrice: { fontSize: 22, fontWeight: 700, fontFamily: 'var(--serif)', color: 'var(--black)' },
  planDesc: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5, marginBottom: 4 },
  planFeatures: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  planFeatureItem: { fontSize: 13, color: 'var(--gray-600)', display: 'flex', gap: 8 },
  selectPlanBtn: {
    marginTop: 8, width: '100%', padding: '10px',
    borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 500,
    cursor: 'pointer', transition: 'background 0.15s',
    fontFamily: 'var(--sans)',
  },

  // Domain selection
  domainsGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' },
  domainChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 'var(--radius-pill)',
    border: '1px solid var(--gray-200)', background: 'var(--white)',
    fontSize: 13, color: 'var(--gray-600)', cursor: 'pointer',
    fontFamily: 'var(--sans)', transition: 'all 0.15s',
  },
  domainChipSelected: {
    border: '1px solid var(--green)', background: 'var(--green-light)',
    color: 'var(--green-dark)', fontWeight: 500,
  },
  domainChipDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  domainChipCheck: { fontSize: 11, fontWeight: 700, color: 'var(--green)', width: 12 },
  coveredBadge: {
    fontSize: 10, fontWeight: 600, background: 'var(--green)',
    color: 'white', padding: '1px 7px', borderRadius: 'var(--radius-pill)',
    marginLeft: 4,
  },
  selectionCount: { fontSize: 12, color: 'var(--gray-400)', marginBottom: '1.5rem' },

  // User info fields
  fields: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' },
  input: {
    width: '100%', padding: '10px 12px',
    border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14, color: 'var(--black)',
    background: 'var(--white)',
    transition: 'border-color 0.15s',
  },
  inputFocused: { borderColor: 'var(--green)', boxShadow: '0 0 0 3px rgba(29,158,117,0.1)' },
  inputError: { borderColor: '#E24B4A' },
  hint: { fontSize: 12, color: 'var(--gray-400)' },
  errorMsg: { fontSize: 12, color: '#A32D2D' },
  privacy: { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 },

  // Nav actions
  stepActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' },
  backBtn: {
    fontSize: 14, color: 'var(--gray-600)', background: 'none',
    border: 'none', cursor: 'pointer', padding: '10px 0',
    fontFamily: 'var(--sans)',
  },
  nextBtn: {
    background: 'var(--green)', color: 'white',
    fontSize: 14, fontWeight: 500, padding: '11px 24px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },
  nextBtnDisabled: { background: 'var(--gray-200)', color: 'var(--gray-400)', cursor: 'not-allowed' },
  submitBtn: {
    background: 'var(--green)', color: 'white',
    fontSize: 14, fontWeight: 500, padding: '11px 24px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },
}
