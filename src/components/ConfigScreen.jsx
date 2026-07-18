import React, { useState } from 'react'

export default function ConfigScreen({ onReady }) {
  const [claudeKey, setClaudeKey] = useState('')
  const [resendKey, setResendKey] = useState('')
  const [error, setError] = useState('')

  const handle = () => {
    if (!claudeKey.trim().startsWith('sk-ant-')) {
      setError('Claude API key should start with sk-ant-')
      return
    }
    if (!resendKey.trim().startsWith('re_')) {
      setError('Resend API key should start with re_')
      return
    }
    onReady(claudeKey.trim(), resendKey.trim())
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>self<span style={{ color: 'var(--green)' }}>audit</span></div>
        <h2 style={styles.title}>Setup required</h2>
        <p style={styles.sub}>Add your API keys to run the audit engine. These are stored in memory only — never logged or transmitted.</p>

        <div style={styles.field}>
          <label style={styles.label}>Claude API Key <span style={{ color: 'var(--green)' }}>*</span></label>
          <input
            type="password"
            style={styles.input}
            value={claudeKey}
            onChange={e => setClaudeKey(e.target.value)}
            placeholder="sk-ant-..."
          />
          <p style={styles.hint}>Get yours at console.anthropic.com</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Resend API Key <span style={{ color: 'var(--green)' }}>*</span></label>
          <input
            type="password"
            style={styles.input}
            value={resendKey}
            onChange={e => setResendKey(e.target.value)}
            placeholder="re_..."
          />
          <p style={styles.hint}>Get yours at resend.com — free tier is fine</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.btn} onClick={handle}>
          Launch SelfAudit
        </button>

        <p style={styles.note}>
          In production, move these keys to environment variables (VITE_CLAUDE_API_KEY, VITE_RESEND_API_KEY) and remove this screen.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', background: 'var(--gray-100)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
  },
  card: {
    background: 'var(--white)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)',
    padding: '2.5rem', width: '100%', maxWidth: 440
  },
  logo: { fontSize: 20, fontWeight: 500, letterSpacing: '-0.5px', marginBottom: '1.5rem' },
  title: { fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 8 },
  sub: { fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '1.5rem' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--gray-800)' },
  input: {
    width: '100%', padding: '10px 12px',
    border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
    fontSize: 14, color: 'var(--black)', background: 'var(--white)'
  },
  hint: { fontSize: 13, color: 'var(--gray-400)', marginTop: 4 },
  error: { fontSize: 13, color: '#A32D2D', marginBottom: '1rem' },
  btn: {
    width: '100%', padding: 13, background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, borderRadius: 'var(--radius)',
    border: 'none', cursor: 'pointer', marginBottom: '1rem'
  },
  note: {
    fontSize: 13, color: 'var(--gray-400)', lineHeight: 1.6,
    background: 'var(--gray-100)', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--green)'
  }
}
