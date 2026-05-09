import React, { useState, useEffect, useCallback } from 'react'
import * as Sentry from '@sentry/react'
import { supabase, initSupabase } from './lib/supabase.js'
import Landing from './components/Landing.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import Login from './components/auth/Login.jsx'
import Signup from './components/auth/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'

const SCREENS = {
  LANDING:             'landing',
  AUDIT:               'audit',
  REPORT:              'report',
  LOGIN:               'login',
  SIGNUP:              'signup',
  DASHBOARD:           'dashboard',
  ACCOUNT_ONBOARDING:  'account_onboarding',
  ADMIN:               'admin',
}

const HASH_SCREENS = new Set([
  SCREENS.LOGIN, SCREENS.SIGNUP,
  SCREENS.DASHBOARD, SCREENS.ACCOUNT_ONBOARDING,
  SCREENS.ADMIN,
])

const DASHBOARD_SECTION_HASHES = new Set(['home', 'reports', 'intelligence', 'billing', 'account'])

function screenFromHash(isAuthenticated = false) {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (h === 'login')              return SCREENS.LOGIN
  if (h === 'signup' || h.startsWith('signup?')) return SCREENS.SIGNUP
  if (h === 'dashboard')          return SCREENS.DASHBOARD
  if (h === 'account_onboarding') return isAuthenticated ? SCREENS.DASHBOARD : SCREENS.LOGIN
  if (h === 'admin')              return SCREENS.ADMIN
  // Dashboard section hashes (#billing, #reports, etc.) must not exit the dashboard
  if (isAuthenticated && DASHBOARD_SECTION_HASHES.has(h)) return SCREENS.DASHBOARD
  return null
}

export default function App() {
  const [screen,              setScreen]              = useState(screenFromHash() ?? SCREENS.LANDING)
  const [userInfo,            setUserInfo]            = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [auditSessionId,      setAuditSessionId]      = useState(null)
  const [session,             setSession]             = useState(null)
  const [authLoading,         setAuthLoading]         = useState(true)
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const pendingCheckoutRef = React.useRef(false)

  // ── navigate: defined early so effects can safely reference it ────────────
  const navigate = useCallback((s) => {
    setScreen(s)
    if (HASH_SCREENS.has(s)) {
      window.location.hash = s
    } else {
      history.pushState({ screen: s }, '', window.location.pathname)
    }
  }, [])

  const maybeStartPendingCheckout = useCallback(async (session) => {
    if (!session?.user?.id || !session?.user?.email || pendingCheckoutRef.current) return false

    let intent = null
    try {
      intent = JSON.parse(localStorage.getItem(PENDING_AUTH_INTENT_KEY) || 'null')
    } catch (_) {
      intent = null
    }

    if (!intent?.plan || !['essential', 'business'].includes(intent.plan)) {
      try { localStorage.removeItem(PENDING_AUTH_INTENT_KEY) } catch (_) {}
      return false
    }

    pendingCheckoutRef.current = true
    try {
      localStorage.removeItem(PENDING_AUTH_INTENT_KEY)
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: intent.plan,
          userId: session.user.id,
          email: session.user.email,
        }),
      })
      const data = await response.json()
      if (response.ok && data?.url) {
        window.location.href = data.url
        return true
      }
      console.warn('[auth] pending checkout failed:', data?.error || 'unknown error')
      return false
    } catch (error) {
      console.warn('[auth] pending checkout threw:', error?.message ?? error)
      return false
    } finally {
      pendingCheckoutRef.current = false
    }
  }, [])

  // ── Respond to history changes (back/forward, logo clicks) ────────────────
  useEffect(() => {
    const syncScreenFromLocation = () => {
      const s = screenFromHash(!!session)
      setScreen(s ?? SCREENS.LANDING)
    }

    window.addEventListener('hashchange', syncScreenFromLocation)
    window.addEventListener('popstate', syncScreenFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncScreenFromLocation)
      window.removeEventListener('popstate', syncScreenFromLocation)
    }
  }, [session])

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    let subscription = null

    // Safety timeout: only fires if onAuthStateChange never emits INITIAL_SESSION
    // (e.g. /api/config is unreachable). Reads localStorage so a logged-in user
    // isn't bounced to Login while the Supabase client is still initialising.
    const authTimeout = setTimeout(() => {
      console.warn('[auth] auth init timed out after 8s — unblocking UI')
      let recovered = null
      try {
        const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        if (key) {
          const stored = JSON.parse(localStorage.getItem(key))
          if (stored?.access_token && stored?.user) recovered = stored
        }
      } catch (_) {}
      setSession(recovered)
      setAuthLoading(false)
    }, 8000)

    initSupabase()
      .then(async (sb) => {
        // ── Step 1: resolve session fully before any auth-gated UI renders ──
        // getSession() awaits any pending token refresh so auth.uid() is valid
        // when Dashboard mounts and runs its RLS-gated profile query.
        // Dashboard must never render until this resolves.
        const { data } = await sb.auth.refreshSession()
        clearTimeout(authTimeout)
        setSession(data?.session ?? null)
        if (data?.session) {
          const redirected = await maybeStartPendingCheckout(data.session)
          if (redirected) return
          const currentHash = window.location.hash.replace(/^#\/?/, '')
          if (currentHash !== 'admin' && currentHash !== 'dashboard' && !DASHBOARD_SECTION_HASHES.has(currentHash)) {
            navigate(SCREENS.DASHBOARD)
          }
        }
        setAuthLoading(false)

        // ── Step 2: subscribe for subsequent auth events only ──────────────
        // INITIAL_SESSION is ignored — already handled by getSession() above.
        // Only SIGNED_IN and SIGNED_OUT drive navigation and state changes.
        const { data: { subscription: sub } } = sb.auth.onAuthStateChange(async (event, session) => {
          if (event === 'INITIAL_SESSION') return

          setSession(session)

          if (event === 'SIGNED_OUT') {
            navigate(SCREENS.LANDING)
            return
          }

          if (session && event === 'SIGNED_IN') {
            const redirected = await maybeStartPendingCheckout(session)
            if (redirected) return
            setAuthLoading(false)
            const currentHash = window.location.hash.replace(/^#\/?/, '')
            if (currentHash === 'admin') return
            navigate(SCREENS.DASHBOARD)
          }
        })

        subscription = sub
      })
      .catch((err) => {
        clearTimeout(authTimeout)
        Sentry.captureException(err)
        console.error('[auth] initSupabase failed:', err.message)
        setSession(null)
        setAuthLoading(false)
      })

    return () => {
      clearTimeout(authTimeout)
      subscription?.unsubscribe()
    }
  }, [maybeStartPendingCheckout, navigate])

  // ── Existing audit flow handlers ──────────────────────────────────────────
  const handleAuditStart = (problem) => {
    const isGoalMode = typeof problem === 'string' && problem.startsWith('Goal:')
    setUserInfo({
      name: '',
      email: '',
      phone: '',
      context: problem || '',
      userId: session?.user?.id || null,
      tier: null,
      industry: null,
      domain: null,
      goalMode: isGoalMode,
      goal: isGoalMode ? problem.split('Goal:')[1]?.split('.')[0]?.trim() : '',
      goalTimeline: isGoalMode ? (problem.match(/in (.+?)\./)?.[1] || '') : '',
      goalBaseline: '',
      anonymous: !session,
    })
    navigate(SCREENS.AUDIT)
  }
  const handleReportReady = (history, sessionId, contactInfo) => {
    setConversationHistory(history)
    setAuditSessionId(sessionId ?? null)
    if (contactInfo?.email) {
      setUserInfo(prev => prev ? {
        ...prev,
        name: contactInfo.name || prev.name || '',
        email: contactInfo.email || prev.email || '',
      } : prev)
    }
    navigate(SCREENS.REPORT)
  }
  const handleSignOut = () => {
    // Use the client if it's already initialized — don't await initSupabase()
    // because it may still be pending and will silently hang the button click.
    if (supabase) {
      supabase.auth.signOut().catch(e => console.error('[auth] signOut error:', e?.message))
    }
    // Belt-and-suspenders: wipe all Supabase session keys from localStorage
    // so the page comes up clean even if signOut() hasn't finished yet.
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k))
    } catch (_) {}
    window.location.replace('/')
  }

  if (authLoading) return null

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (screen === SCREENS.LOGIN) {
    // Guard: a logged-in user must never see the login screen (e.g. browser back).
    // session is kept current by onAuthStateChange so this check is always fresh.
    if (session) { navigate(SCREENS.DASHBOARD); return null }
    return <Login
      onSuccess={(session) => {
        if (session) setSession(session)
      }}
      onSignup={() => navigate(SCREENS.SIGNUP)}
    />
  }

  if (screen === SCREENS.SIGNUP) {
    if (session) { navigate(SCREENS.DASHBOARD); return null }
    return <Signup
      onSuccess={(session) => {
        if (session) {
          setSession(session)
          navigate(SCREENS.DASHBOARD)
        }
      }}
      onLogin={() => navigate(SCREENS.LOGIN)}
    />
  }

  if (screen === SCREENS.ACCOUNT_ONBOARDING) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    navigate(SCREENS.DASHBOARD)
    return null
  }

  if (screen === SCREENS.ADMIN) {
    return <AdminDashboard
      session={session}
      onUnauthorized={() => navigate(SCREENS.LANDING)}
    />
  }

  if (screen === SCREENS.DASHBOARD) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    return <Dashboard
      user={session.user}
      onSignOut={handleSignOut}
      onStartAudit={(info) => {
        setUserInfo(info)
        navigate(SCREENS.AUDIT)
      }}
    />
  }

  // ── Existing audit flow ───────────────────────────────────────────────────
  return (
    <>
      {screen === SCREENS.LANDING    && <Landing onStart={handleAuditStart} onSignUp={(plan) => { window.location.hash = plan ? `signup?plan=${plan}` : 'signup' }} session={session} />}
      {screen === SCREENS.AUDIT && userInfo && (
        <AuditChat
          theme={theme}
          userInfo={userInfo}
          onReportReady={handleReportReady}
          conversationHistory={conversationHistory}
          setConversationHistory={setConversationHistory}
        />
      )}
      {screen === SCREENS.REPORT && userInfo && (
        <Report
          userInfo={userInfo}
          conversationHistory={conversationHistory}
          sessionId={auditSessionId}
        />
      )}
    </>
  )
}
