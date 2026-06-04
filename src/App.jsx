import React, { useState, useEffect, useCallback, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { supabase, initSupabase } from './lib/supabase.js'
import Landing from './components/Landing.jsx'
import Login from './components/auth/Login.jsx'
import Signup from './components/auth/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'
import DashboardWelcomeTour from './components/DashboardWelcomeTour.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import TermsPage from './components/TermsPage.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Voice from './pages/Voice.jsx'
import UseCaseCustomerService    from './pages/UseCaseCustomerService.jsx'
import UseCaseSalesMarketing     from './pages/UseCaseSalesMarketing.jsx'
import UseCaseFinanceAccounting  from './pages/UseCaseFinanceAccounting.jsx'
import UseCaseManagementStrategy from './pages/UseCaseManagementStrategy.jsx'

const PENDING_AUTH_INTENT_KEY = 'sa-auth-intent'
const PENDING_CHECKOUT_RETURN_KEY = 'sa-checkout-return'

const SCREENS = {
  LANDING:             'landing',
  AUDIT:               'audit',
  REPORT:              'report',
  LOGIN:               'login',
  SIGNUP:              'signup',
  DASHBOARD:           'dashboard',
  TOUR_PREVIEW:        'tour-preview',
  ADMIN:               'admin',
  TERMS:               'terms',
  HOW_IT_WORKS:        'how-it-works',
  VOICE:               'voice',
  UC_CUSTOMER_SERVICE:    'use-case-customer-service',
  UC_SALES_MARKETING:     'use-case-sales-marketing',
  UC_FINANCE_ACCOUNTING:  'use-case-finance-accounting',
  UC_MANAGEMENT_STRATEGY: 'use-case-management-strategy',
}

const HASH_SCREENS = new Set([
  SCREENS.LOGIN, SCREENS.SIGNUP,
  SCREENS.DASHBOARD,
  SCREENS.TOUR_PREVIEW,
  SCREENS.ADMIN, SCREENS.TERMS,
  SCREENS.HOW_IT_WORKS,
  SCREENS.VOICE,
  SCREENS.UC_CUSTOMER_SERVICE,
  SCREENS.UC_SALES_MARKETING,
  SCREENS.UC_FINANCE_ACCOUNTING,
  SCREENS.UC_MANAGEMENT_STRATEGY,
])

const DASHBOARD_SECTION_HASHES = new Set(['home', 'reports', 'intelligence', 'business-state', 'alerts', 'connectors', 'agent', 'billing', 'account'])

function getHashSection() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return hash.split('?')[0]
}

function syncScreenForAuthenticatedHash(setScreen) {
  const section = getHashSection()
  if (section === 'admin') {
    setScreen(SCREENS.ADMIN)
    return true
  }
  if (section === 'terms') {
    setScreen(SCREENS.TERMS)
    return true
  }
  if (section === 'dashboard' || DASHBOARD_SECTION_HASHES.has(section)) {
    setScreen(SCREENS.DASHBOARD)
    return true
  }
  return false
}

function readPendingCheckoutIntent() {
  try {
    const intent = JSON.parse(localStorage.getItem(PENDING_AUTH_INTENT_KEY) || 'null')
    if (intent?.plan && ['professional', 'enterprise'].includes(intent.plan)) {
      return intent
    }
  } catch (_) {}
  return null
}

function clearPendingCheckoutIntent() {
  try {
    localStorage.removeItem(PENDING_AUTH_INTENT_KEY)
  } catch (_) {}
}

function readPendingCheckoutReturn() {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_CHECKOUT_RETURN_KEY) || 'null')
    if (pending?.sessionId) return pending
  } catch (_) {}
  return null
}

function writePendingCheckoutReturn(payload) {
  try {
    localStorage.setItem(PENDING_CHECKOUT_RETURN_KEY, JSON.stringify(payload))
  } catch (_) {}
}

function clearPendingCheckoutReturn() {
  try {
    localStorage.removeItem(PENDING_CHECKOUT_RETURN_KEY)
  } catch (_) {}
}

function captureCheckoutReturnFromHash() {
  const section = getHashSection()
  if (section !== 'billing') return null
  const hash = window.location.hash.replace(/^#\/?/, '')
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const params = new URLSearchParams(query)
  const checkout = params.get('checkout')
  const sessionId = params.get('session_id')
  const plan = params.get('plan')

  if (checkout !== 'success' || !sessionId) return null

  const payload = {
    sessionId,
    plan: ['professional', 'enterprise'].includes(plan) ? plan : 'professional',
    at: Date.now(),
  }
  writePendingCheckoutReturn(payload)
  return payload
}

function screenFromHash(isAuthenticated = false) {
  const section = getHashSection()
  if (section === 'login')              return SCREENS.LOGIN
  if (section === 'signup')             return SCREENS.SIGNUP
  if (section === 'dashboard')          return SCREENS.DASHBOARD
  if (section === 'tour-preview')       return SCREENS.TOUR_PREVIEW
  if (section === 'admin')              return SCREENS.ADMIN
  if (section === 'terms')              return SCREENS.TERMS
  if (section === 'how-it-works')                 return SCREENS.HOW_IT_WORKS
  if (section === 'voice')                        return SCREENS.VOICE
  if (section === 'use-case-customer-service')    return SCREENS.UC_CUSTOMER_SERVICE
  if (section === 'use-case-sales-marketing')     return SCREENS.UC_SALES_MARKETING
  if (section === 'use-case-finance-accounting')  return SCREENS.UC_FINANCE_ACCOUNTING
  if (section === 'use-case-management-strategy') return SCREENS.UC_MANAGEMENT_STRATEGY
  // Dashboard section hashes (#billing, #reports, etc.) must not exit the dashboard
  if (isAuthenticated && DASHBOARD_SECTION_HASHES.has(section)) return SCREENS.DASHBOARD
  return null
}

async function maybeHandleEmailAuthConfirm(sb) {
  if (window.location.pathname !== '/auth/confirm') return null

  const params = new URLSearchParams(window.location.search)
  const tokenHash = params.get('token_hash')
  const type = params.get('type')
  const next = params.get('next') || '/'

  if (!tokenHash || !type) {
    history.replaceState({}, '', '/#login')
    return { error: 'That sign-in link is incomplete. Please request a new one.' }
  }

  const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type })
  history.replaceState({}, '', next.startsWith('/') ? next : '/')

  if (error) {
    return { error: error.message || 'That sign-in link is invalid or expired.' }
  }

  return { error: null }
}

export default function App() {
  const [screen,              setScreen]              = useState(screenFromHash() ?? SCREENS.LANDING)
  const [userInfo,            setUserInfo]            = useState(null)
  const [openMenuOnBack,      setOpenMenuOnBack]      = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const [auditSessionId,      setAuditSessionId]      = useState(null)
  const [session,             setSession]             = useState(null)
  const [authLoading,         setAuthLoading]         = useState(true)
  const [authMessage,         setAuthMessage]         = useState('')
  const [auditJustCompleted,  setAuditJustCompleted]  = useState(false)
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const pendingCheckoutRef = React.useRef(false)

  useEffect(() => {
    captureCheckoutReturnFromHash()
  }, [])

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
    if (!session?.user?.id || !session?.user?.email || pendingCheckoutRef.current) return 'noop'

    const intent = readPendingCheckoutIntent()
    if (!intent) return 'noop'

    pendingCheckoutRef.current = true
    try {
      // ── Invite path — redeem code, skip Stripe entirely ──────────────────
      if (intent.ref) {
        try {
          const inviteRes = await fetch('/api/invite-redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ code: intent.ref, userId: session.user.id }),
          })
          const inviteData = await inviteRes.json()
          if (inviteRes.ok && inviteData?.success) {
            clearPendingCheckoutIntent()
            window.location.hash = 'home'
            return 'redirected'
          }
          console.warn('[auth] invite redeem failed:', inviteData?.error || 'unknown error')
        } catch (inviteErr) {
          console.warn('[auth] invite redeem threw:', inviteErr?.message ?? inviteErr)
        }
        // If invite fails, clear intent and let them hit the billing page
        clearPendingCheckoutIntent()
        return 'failed'
      }

      // ── Normal Stripe checkout path ───────────────────────────────────────
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          tier: intent.plan,
          userId: session.user.id,
          email: session.user.email,
        }),
      })
      const data = await response.json()
      if (response.ok && data?.url) {
        clearPendingCheckoutIntent()
        window.location.href = data.url
        return 'redirected'
      }
      console.warn('[auth] pending checkout failed:', data?.error || 'unknown error')
      clearPendingCheckoutIntent()
      return 'failed'
    } catch (error) {
      console.warn('[auth] pending checkout threw:', error?.message ?? error)
      clearPendingCheckoutIntent()
      return 'failed'
    } finally {
      pendingCheckoutRef.current = false
    }
  }, [])

  const maybeFinishCheckoutReturn = useCallback(async (session) => {
    const pending = captureCheckoutReturnFromHash() || readPendingCheckoutReturn()
    if (!pending?.sessionId || !session?.user?.id || !session?.access_token) return 'noop'

    setScreen(SCREENS.DASHBOARD)
    if (getHashSection() !== 'billing') {
      window.location.hash = 'billing'
    }

    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await fetch('/api/checkout-session-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: session.user.id,
            sessionId: pending.sessionId,
          }),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          console.warn('[auth] checkout return verify failed:', data?.error || 'unknown error')
          return 'pending'
        }

        if (data?.ready) {
          clearPendingCheckoutReturn()
          history.replaceState({ section: 'home' }, '', '#home')
          setScreen(SCREENS.DASHBOARD)
          return 'activated'
        }

        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    } catch (error) {
      console.warn('[auth] checkout return verify threw:', error?.message ?? error)
    }

    return 'pending'
  }, [])

  // ── Respond to history changes (back/forward, logo clicks) ────────────────
  // Keep a ref so the listener always reads the current session without needing
  // to be re-registered on every session change (avoids stale closure window).
  const sessionRef = useRef(session)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    const syncScreenFromLocation = () => {
      const s = screenFromHash(!!sessionRef.current)
      setScreen(s ?? SCREENS.LANDING)
    }

    window.addEventListener('hashchange', syncScreenFromLocation)
    window.addEventListener('popstate', syncScreenFromLocation)
    return () => {
      window.removeEventListener('hashchange', syncScreenFromLocation)
      window.removeEventListener('popstate', syncScreenFromLocation)
    }
  }, [])

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
        const confirmResult = await maybeHandleEmailAuthConfirm(sb)
        if (confirmResult?.error) {
          setAuthMessage(confirmResult.error)
          navigate(SCREENS.LOGIN)
        }

        // ── Step 1: resolve session fully before any auth-gated UI renders ──
        // getSession() reads from storage first; only hits network if token
        // is expired. refreshSession() would consume the refresh token on
        // every page load, causing multi-tab logout races.
        const { data } = await sb.auth.getSession()
        clearTimeout(authTimeout)
        setSession(data?.session ?? null)
        if (data?.session) {
          syncScreenForAuthenticatedHash(setScreen)

          const checkoutReturnResult = await maybeFinishCheckoutReturn(data.session)
          if (checkoutReturnResult === 'activated') {
            setAuthLoading(false)
            return
          }
          if (checkoutReturnResult === 'pending') {
            setAuthLoading(false)
            setScreen(SCREENS.DASHBOARD)
            return
          }

          // If the user clicked Google on the Login page, check they have an active plan
          // before letting them in. This runs on the OAuth redirect path (page reload),
          // so it must be here — onAuthStateChange fires too late.
          const loginIntent = localStorage.getItem('sa-oauth-login-intent')
          if (loginIntent === '1') {
            localStorage.removeItem('sa-oauth-login-intent')
            const { data: profile } = await sb.from('profiles')
              .select('stripe_subscription_id')
              .eq('id', data.session.user.id)
              .single()
            if (!profile?.stripe_subscription_id) {
              await sb.auth.signOut()
              setSession(null)
              setAuthLoading(false)
              navigate(SCREENS.SIGNUP)
              return
            }
          }
          const checkoutResult = await maybeStartPendingCheckout(data.session)
          if (checkoutResult === 'redirected') return
          if (checkoutResult === 'failed') {
            setAuthLoading(false)
            navigate(SCREENS.DASHBOARD)
            return
          }
          const currentHash = getHashSection()
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
            const checkoutReturnResult = await maybeFinishCheckoutReturn(session)
            if (checkoutReturnResult === 'activated') {
              setAuthLoading(false)
              return
            }
            if (checkoutReturnResult === 'pending') {
              setAuthLoading(false)
              setScreen(SCREENS.DASHBOARD)
              return
            }

            // If the user clicked Google on the Login page but has no existing account,
            // sign them out and redirect to signup instead of landing them in the dashboard.
            const loginIntent = localStorage.getItem('sa-oauth-login-intent')
            if (loginIntent === '1') {
              localStorage.removeItem('sa-oauth-login-intent')
              const { data: profile } = await sb.from('profiles')
                .select('stripe_subscription_id, tier')
                .eq('id', session.user.id)
                .single()
              if (!profile?.stripe_subscription_id) {
                await sb.auth.signOut()
                navigate(SCREENS.SIGNUP)
                return
              }
            }
            const checkoutResult = await maybeStartPendingCheckout(session)
            if (checkoutResult === 'redirected') return
            if (checkoutResult === 'failed') {
              setAuthLoading(false)
              navigate(SCREENS.DASHBOARD)
              return
            }
            setAuthLoading(false)
            const currentHash = getHashSection()
            if (currentHash === 'admin') return
            if (DASHBOARD_SECTION_HASHES.has(currentHash) || currentHash === 'dashboard') {
              setScreen(SCREENS.DASHBOARD)
              return
            }
            // Don't navigate away from signup — let the signup flow finish writing
            // the tier and subscription before onSuccess redirects to dashboard.
            if (currentHash === 'signup') return
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
  }, [maybeFinishCheckoutReturn, maybeStartPendingCheckout, navigate])

  // ── Landing CTA handler — redirect to signup or dashboard ────────────────
  const handleLandingStart = () => {
    window.location.hash = session ? 'home' : 'signup'
  }
  const handleReportReady = () => {
    // Reports are now accessed via the Sessions tab in the dashboard
    setAuditJustCompleted(true)
    navigate(SCREENS.DASHBOARD)
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

  if (authLoading) return (
    <div style={{ height: '100vh', background: '#0F1520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #1E2D42', borderTopColor: '#4A7FA8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (screen === SCREENS.LOGIN) {
    // Guard: a logged-in user must never see the login screen (e.g. browser back).
    // session is kept current by onAuthStateChange so this check is always fresh.
    if (session) { navigate(SCREENS.DASHBOARD); return null }
    return <Login
      initialMessage={authMessage}
      onSuccess={(session) => {
        if (session) setSession(session)
      }}
      onSignup={() => navigate(SCREENS.SIGNUP)}
    />
  }

  if (screen === SCREENS.SIGNUP) {
    if (session) {
      if (readPendingCheckoutIntent()) {
        return (
          <div style={{ height: '100vh', background: '#0F1520', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#E9EEF5' }}>
            <div style={{ width: 32, height: 32, border: '2px solid #1E2D42', borderTopColor: '#4A7FA8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14 }}>Preparing checkout…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )
      }
      navigate(SCREENS.DASHBOARD)
      return null
    }
    return <Signup onLogin={() => navigate(SCREENS.LOGIN)} />
  }

  if (screen === SCREENS.ADMIN) {
    return <AdminDashboard
      session={session}
      onUnauthorized={() => navigate(SCREENS.LANDING)}
    />
  }

  if (screen === SCREENS.TOUR_PREVIEW) {
    return <DashboardWelcomeTour onComplete={() => {}} />
  }

  if (screen === SCREENS.TERMS) {
    return <TermsPage />
  }

  const goBackToMenu = () => {
    setOpenMenuOnBack(true)
    window.location.hash = ''
    history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (screen === SCREENS.HOW_IT_WORKS) return <HowItWorks onBack={goBackToMenu} />
  if (screen === SCREENS.VOICE)        return <Voice      onBack={goBackToMenu} />

  if (screen === SCREENS.UC_CUSTOMER_SERVICE)    return <UseCaseCustomerService    onBack={goBackToMenu} />
  if (screen === SCREENS.UC_SALES_MARKETING)     return <UseCaseSalesMarketing     onBack={goBackToMenu} />
  if (screen === SCREENS.UC_FINANCE_ACCOUNTING)  return <UseCaseFinanceAccounting  onBack={goBackToMenu} />
  if (screen === SCREENS.UC_MANAGEMENT_STRATEGY) return <UseCaseManagementStrategy onBack={goBackToMenu} />

  if (screen === SCREENS.DASHBOARD) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    return <Dashboard
      user={session.user}
      onSignOut={handleSignOut}
      auditJustCompleted={auditJustCompleted}
      onAuditCompletedAck={() => setAuditJustCompleted(false)}
      onStartAudit={() => {
        // Dashboard is the product — no navigation to separate chat screen
        setAuditJustCompleted(false)
      }}
    />
  }

  // ── Landing page (no chat — signup/login CTA only) ───────────────────────
  return (
    <>
      {screen === SCREENS.LANDING && (
        <Landing
          onStart={handleLandingStart}
          onSignUp={(plan) => { window.location.hash = plan ? `signup?plan=${plan}` : 'signup' }}
          session={session}
          openMenu={openMenuOnBack}
          onMenuOpened={() => setOpenMenuOnBack(false)}
        />
      )}
    </>
  )
}
