import React, { useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { usePostHog } from '@posthog/react'

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


export default function Login({ onSuccess, onSignup }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const posthog = usePostHog()
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError(null)
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    posthog?.capture('login_submitted', { email: form.email })
    try {
      const sb = await initSupabase()
      const { data, error: authError } = await sb.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (authError) { setError(friendlyError(authError.message)); return }
      // Supabase stores the session internally and fires onAuthStateChange(SIGNED_IN).
      // No setSession() call needed — that was the source of the gotrue lock race.
      posthog?.identify(data.session.user.id, { email: form.email })
      posthog?.capture('login_completed', { email: form.email })
      onSuccess(data.session)
    } catch (e) {
      posthog?.captureException(e)
      setError('Connection timed out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider) => {
    setError(null)
    setLoading(true)
    try {
      localStorage.setItem('sa-oauth-login-intent', '1')
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
    } catch (e) {
      setError(friendlyError(e?.message || 'Could not start sign in.'))
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async () => {
    setError(null)
    if (!form.email) {
      setError('Enter your email first.')
      return
    }
    setLoading(true)
    try {
      const sb = await initSupabase()
      const { error } = await sb.auth.signInWithOtp({
        email: form.email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
      setMagicLinkSent(true)
    } catch (e) {
      setError(friendlyError(e?.message || 'Could not send magic link.'))
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
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
              <p style={s.eyebrow}>Check your inbox</p>
              <h2 style={s.title}>Your sign-in link is on the way</h2>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.7, marginTop: 12 }}>
              We sent a magic link to <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
              Open it to sign in to your account.
            </p>
            <button style={{ ...s.btn, marginTop: 28 }} onClick={() => setMagicLinkSent(false)}>
              Back
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
            <p style={s.eyebrow}>Welcome back</p>
            <h2 style={s.title}>Log in to your account</h2>
          </div>

          <div style={s.altAuthShell}>
            <div style={s.providerGrid}>
              <ProviderButton icon={<GoogleMark />} label="Continue with" onClick={() => handleOAuthLogin('google')} disabled={loading} />
            </div>
            <button type="button" style={s.magicButton} onClick={handleMagicLinkLogin} disabled={loading}>
              Email me a magic link
            </button>
            <div style={s.dividerRow}>
              <span style={s.dividerLine} />
              <span style={s.dividerLabel}>or use your password</span>
              <span style={s.dividerLine} />
            </div>
          </div>

          <div style={s.fields}>
            <Field label="Email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="you@company.com" />
            <Field label="Password" type="password" value={form.password} onChange={v => update('password', v)} placeholder="••••••••"
              onEnter={handleSubmit} />
          </div>

          {error && <p style={s.errorMsg}>{error}</p>}

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p style={s.switch}>
            Don&apos;t have an account?{' '}
            <button style={s.link} onClick={onSignup}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.label}>{label}</label>
      <input
        style={{ ...s.input, ...(focused ? s.inputFocused : {}) }}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
    </div>
  )
}

function friendlyError(msg) {
  if (msg.includes('Invalid login')) return 'Incorrect email or password.'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
  if (msg.includes('provider is not enabled')) return 'This sign-in method is not enabled yet in Supabase Auth.'
  if (msg.includes('Signups not allowed for otp')) return 'No account exists for that email yet.'
  return msg
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text)' },
  wrap: { display: 'flex', justifyContent: 'center', padding: '4rem 1.5rem' },
  card: { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header: { marginBottom: '2rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)' },
  altAuthShell: { marginBottom: '1.25rem' },
  providerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' },
  providerButton: { width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  providerIconWrap: { width: 18, height: 18, display: 'grid', placeItems: 'center', flexShrink: 0 },
  magicButton: { width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-soft)', whiteSpace: 'nowrap' },
  fields: { display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  input: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', transition: 'border-color 0.15s' },
  inputFocused: { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--focus-ring)' },
  errorMsg: { fontSize: 13, color: 'var(--error)', marginBottom: '1rem' },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1.25rem' },
  switch: { fontSize: 13, color: 'var(--text-soft)', textAlign: 'center' },
  link: { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
