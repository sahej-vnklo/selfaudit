import React, { useState } from 'react'

export default function Onboarding({ onComplete }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', context: '' })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(0)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.context.trim()) e.context = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (validate()) onComplete(form)
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
      </nav>

      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.step}>Before we begin</p>
            <h2 style={styles.title}>Tell us a little about yourself</h2>
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
              placeholder="e.g. My e-commerce business, My SaaS startup, My personal productivity, Planning a new venture..."
              multiline
              error={errors.context}
              required
            />
          </div>

          <button style={styles.btn} onClick={handleSubmit}>
            Start the audit
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <p style={styles.privacy}>
            Your info is only used to personalize the audit and optionally share with Vnklo if you choose to.
          </p>
        </div>
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
    ...(multiline ? { height: 80, resize: 'none', paddingTop: 10 } : {})
  }

  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>
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
    display: 'flex', alignItems: 'center',
    padding: '1.25rem 2.5rem',
    background: 'var(--white)',
    borderBottom: '0.5px solid var(--gray-200)'
  },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  wrap: {
    display: 'flex', justifyContent: 'center',
    padding: '3rem 1.5rem'
  },
  card: {
    background: 'var(--white)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)',
    padding: '2.5rem', width: '100%', maxWidth: 480,
    animation: 'fadeUp 0.4s ease'
  },
  header: { marginBottom: '2rem' },
  step: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, marginBottom: 8, lineHeight: 1.3 },
  sub: { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 },
  fields: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--gray-800)' },
  input: {
    width: '100%', padding: '10px 12px',
    border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14, color: 'var(--black)',
    background: 'var(--white)',
    transition: 'border-color 0.15s'
  },
  inputFocused: { borderColor: 'var(--green)', boxShadow: '0 0 0 3px rgba(29,158,117,0.1)' },
  inputError: { borderColor: '#E24B4A' },
  hint: { fontSize: 12, color: 'var(--gray-400)' },
  errorMsg: { fontSize: 12, color: '#A32D2D' },
  btn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, padding: '13px',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    border: 'none', transition: 'background 0.15s'
  },
  privacy: { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }
}
