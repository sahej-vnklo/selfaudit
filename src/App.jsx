import React, { useState, useEffect, useCallback } from 'react'
import { supabase, initSupabase } from './lib/supabase.js'
import Landing from './components/Landing.jsx'
import Onboarding from './components/Onboarding.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import Login from './components/auth/Login.jsx'
import Signup from './components/auth/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'
import AccountOnboarding from './components/AccountOnboarding.jsx'

const SCREENS = {
  LANDING:             'landing',
  ONBOARDING:          'onboarding',
  AUDIT:               'audit',
  REPORT:              'report',
  LOGIN:               'login',
  SIGNUP:              'signup',
  DASHBOARD:           'dashboard',
  ACCOUNT_ONBOARDING:  'account_onboarding',
}

const HASH_SCREENS = new Set([
  SCREENS.LOGIN, SCREENS.SIGNUP,
  SCREENS.DASHBOARD, SCREENS.ACCOUNT_ONBOARDING,
])

function screenFromHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  if (h === 'login')              return SCREENS.LOGIN
  if (h === 'signup')             return SCREENS.SIGNUP
  if (h === 'dashboard')          return SCREENS.DASHBOARD
  if (h === 'account_onboarding') return SCREENS.ACCOUNT_ONBOARDING
  return null
}

export default function App() {
  const [screen,              setScreen]              = useState(screenFromHash() ?? SCREENS.LANDING)
  const [userInfo,            setUserInfo]            = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [session,             setSession]             = useState(null)
  const [authLoading,         setAuthLoading]         = useState(true)

  // ── navigate: defined early so effects can safely reference it ────────────
  const navigate = useCallback((s) => {
    setScreen(s)
    if (HASH_SCREENS.has(s)) {
      window.location.hash = s
    } else {
      history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // ── Respond to hash changes (back/forward, logo clicks) ───────────────────
  useEffect(() => {
    const onHashChange = () => {
      const s = screenFromHash()
      setScreen(s ?? SCREENS.LANDING)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    let subscription = null

    // Safety timeout: unblock the UI if Supabase is slow.
    // Recover session from localStorage so a logged-in user isn't bounced to Login
    // when getSession() hangs due to gotrue lock contention.
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
      .then((sb) => {
        sb.auth.getSession().then(({ data, error }) => {
          clearTimeout(authTimeout)
          if (error) {
            console.error('[auth] getSession error:', error.message)
          }
          setSession(data?.session ?? null)
          setAuthLoading(false)
        }).catch((err) => {
          clearTimeout(authTimeout)
          console.error('[auth] getSession threw:', err?.message ?? err)
          setSession(null)
          setAuthLoading(false)
        })

        const { data: { subscription: sub } } = sb.auth.onAuthStateChange(async (event, session) => {
          setSession(session)

          // SIGNED_OUT: clear state and go home
          if (event === 'SIGNED_OUT') {
            navigate(SCREENS.LANDING)
            return
          }

          // SIGNED_IN only (new login) — navigate based on onboarding status.
          // INITIAL_SESSION (page refresh) is intentionally excluded: the initial
          // screen is already set from screenFromHash(), so we let it stand.
          if (session && event === 'SIGNED_IN') {
            const { data: profile } = await sb
              .from('profiles')
              .select('onboarding_complete')
              .eq('id', session.user.id)
              .single()

            if (profile && !profile.onboarding_complete) {
              navigate(SCREENS.ACCOUNT_ONBOARDING)
            } else if (profile?.onboarding_complete) {
              navigate(SCREENS.DASHBOARD)
            }
          }
        })

        subscription = sub
      })
      .catch((err) => {
        clearTimeout(authTimeout)
        console.error('[auth] initSupabase failed:', err.message)
        setSession(null)
        setAuthLoading(false)
        // Do NOT redirect — let the screen guard handle it
      })

    return () => {
      clearTimeout(authTimeout)
      subscription?.unsubscribe()
    }
  }, [navigate])

  // ── Existing audit flow handlers ──────────────────────────────────────────
  const handleStart      = () => navigate(SCREENS.ONBOARDING)
  const handleOnboarding = async (info) => {
    const merged = userInfo ? { ...userInfo, ...info } : info
    setUserInfo(merged)
    if (session && info.context?.trim()) {
      try {
        const sb = await initSupabase()
        await sb.from('profiles').update({ context: info.context.trim() }).eq('id', session.user.id)
      } catch (e) {
        console.warn('[onboarding] context save failed:', e?.message)
      }
    }
    navigate(SCREENS.AUDIT)
  }
  const handleReportReady = (history) => { setConversationHistory(history); navigate(SCREENS.REPORT) }
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
        // Set session immediately so the Dashboard guard doesn't redirect back
        // before onAuthStateChange has a chance to fire.
        if (session) setSession(session)
        navigate(SCREENS.DASHBOARD)
      }}
      onSignup={() => navigate(SCREENS.SIGNUP)}
    />
  }

  if (screen === SCREENS.SIGNUP) {
    if (session) { navigate(SCREENS.DASHBOARD); return null }
    return <Signup
      onSuccess={(session) => {
        // Set session immediately so the AccountOnboarding guard doesn't
        // redirect back to login before onAuthStateChange has fired.
        if (session) setSession(session)
        navigate(SCREENS.ACCOUNT_ONBOARDING)
      }}
      onLogin={() => navigate(SCREENS.LOGIN)}
    />
  }

  if (screen === SCREENS.ACCOUNT_ONBOARDING) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    return <AccountOnboarding
      user={session.user}
      onComplete={() => navigate(SCREENS.DASHBOARD)}
      onBack={() => navigate(SCREENS.LANDING)}
    />
  }

  if (screen === SCREENS.DASHBOARD) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    return <Dashboard
      user={session.user}
      onSignOut={handleSignOut}
      onStartAudit={(info) => {
        setUserInfo(info)
        navigate(SCREENS.ONBOARDING)
      }}
    />
  }

  // ── Existing audit flow ───────────────────────────────────────────────────
  return (
    <>
      {screen === SCREENS.LANDING    && <Landing onStart={handleStart} session={session} />}
      {screen === SCREENS.ONBOARDING && (
        <Onboarding
          onComplete={handleOnboarding}
          defaultValues={userInfo ? {
            name:    userInfo.name    || '',
            email:   userInfo.email   || '',
            phone:   userInfo.phone   || '',
            context: userInfo.context || '',
          } : undefined}
        />
      )}
      {screen === SCREENS.AUDIT && userInfo && (
        <AuditChat
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
        />
      )}
    </>
  )
}
