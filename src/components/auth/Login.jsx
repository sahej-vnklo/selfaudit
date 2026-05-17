import React, { useState } from 'react'
import { initSupabase } from '../../lib/supabase.js'
import { usePostHog } from '@posthog/react'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_BORDER,
  DARK_HERO_SURFACE,
  DARK_INPUT_BG,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_BORDER,
  SHARP_HERO_SURFACE,
  SHARP_INPUT_BG,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_TEXT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../../lib/sharpTheme.js'

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    border: DARK_BORDER,
    text: DARK_TEXT,
    textSoft: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    accent: DARK_ACCENT,
    accentSoft: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    inputBg: DARK_INPUT_BG,
    error: DARK_RED,
    buttonText: DARK_TEXT,
    focusRing: 'rgba(183,154,146,0.18)',
  },
  light: {
    bg: '#F5F0EA',
    surface: '#EFE7DF',
    surface2: '#E8DDD3',
    border: '#D9C9BE',
    text: '#261B19',
    textSoft: '#6E5B55',
    textMuted: '#8A746D',
    accent: '#A98D86',
    accentSoft: '#E8DDD3',
    accentText: '#8F7069',
    inputBg: '#E8DDD3',
    error: '#8C2A2A',
    buttonText: '#FBF7F2',
    focusRing: 'rgba(169,141,134,0.14)',
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    border: SHARP_BORDER,
    text: SHARP_TEXT,
    textSoft: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    accent: SHARP_ACCENT,
    accentSoft: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    inputBg: SHARP_INPUT_BG,
    error: SHARP_RED,
    buttonText: SHARP_TEXT,
    focusRing: 'rgba(107,140,255,0.18)',
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
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const posthog = usePostHog()
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)

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
    if (!email.trim()) {
      setError('Enter your email first.')
      return
    }
    setLoading(true)
    try {
      const sb = await initSupabase()
      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
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
              We sent a magic link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
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
        <div style={s.headline}>
          <h1 style={s.headlineText}>See your business<br />clearly.</h1>
        </div>

        <div style={s.card}>
          <div style={s.header}>
            <p style={s.eyebrow}>Welcome back</p>
            <h2 style={s.title}>Log in to your account</h2>
          </div>

          <div style={s.authStack}>
            <ProviderButton icon={<GoogleMark />} label="Continue with Google" onClick={() => handleOAuthLogin('google')} disabled={loading} />

            <div style={s.dividerRow}>
              <span style={s.dividerLine} />
              <span style={s.dividerLabel}>or continue with email</span>
              <span style={s.dividerLine} />
            </div>

            <EmailField value={email} onChange={setEmail} onEnter={handleMagicLinkLogin} />

            {error && <p style={s.errorMsg}>{error}</p>}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleMagicLinkLogin} disabled={loading}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>

            <p style={s.switch}>
              Don't have an account?{' '}
              <button style={s.link} onClick={onSignup}>Sign up</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmailField({ value, onChange, onEnter }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      style={{ ...s.input, ...(focused ? s.inputFocused : {}) }}
      type="email"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="you@company.com"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
    />
  )
}

function friendlyError(msg) {
  if (msg.includes('provider is not enabled')) return 'This sign-in method is not enabled yet in Supabase Auth.'
  if (msg.includes('Signups not allowed for otp')) return 'No account exists for that email yet.'
  return msg
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  nav: { display: 'flex', alignItems: 'center', padding: '1.25rem 2.5rem', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)' },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px', cursor: 'pointer', color: 'var(--text)' },
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' },
  headline: { textAlign: 'center', marginBottom: '2rem' },
  headlineText: { fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, lineHeight: 1.2, color: 'var(--text)', margin: 0 },
  createAccountPill: { marginTop: '1.25rem', width: '100%', maxWidth: 420, padding: '13px', borderRadius: 100, border: 'none', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, cursor: 'pointer' },
  card: { background: 'var(--surface)', borderRadius: 'var(--radius)', border: '0.5px solid var(--border)', padding: '2.5rem', width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease' },
  header: { marginBottom: '2rem' },
  eyebrow: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, lineHeight: 1.3, color: 'var(--text)' },
  authStack: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  providerButton: { width: '100%', padding: '11px 16px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  providerIconWrap: { width: 18, height: 18, display: 'grid', placeItems: 'center', flexShrink: 0 },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, background: 'var(--border)' },
  dividerLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-soft)', whiteSpace: 'nowrap' },
  input: { width: '100%', padding: '10px 12px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 14, color: 'var(--text)', background: 'var(--input-bg)', transition: 'border-color 0.15s' },
  inputFocused: { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--focus-ring)' },
  errorMsg: { fontSize: 13, color: 'var(--error)', marginBottom: '1rem' },
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: 'var(--button-text)', fontSize: 15, fontWeight: 500, padding: '13px', borderRadius: 'var(--radius)', cursor: 'pointer', border: 'none', transition: 'background 0.15s', marginBottom: '1.25rem' },
  switch: { fontSize: 13, color: 'var(--text-soft)', textAlign: 'center' },
  link: { background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 500, cursor: 'pointer', fontSize: 13, padding: 0 },
}
