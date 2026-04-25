import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
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
  const [authLoading,         setAuthLoading]         = useState(!!supabase)

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
    if (!supabase) return

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('[auth] getSession error:', error.message)
      setSession(data?.session ?? null)
      setAuthLoading(false)
    }).catch((err) => {
      console.error('[auth] getSession threw:', err)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      // Route the user based on onboarding state on sign-in or session restore
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const { data: profile } = await supabase
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

    return () => subscription.unsubscribe()
  }, [navigate])

  // ── Existing audit flow handlers ──────────────────────────────────────────
  const handleStart       = ()        => navigate(SCREENS.ONBOARDING)
  const handleOnboarding  = (info)    => { setUserInfo(info); navigate(SCREENS.AUDIT) }
  const handleReportReady = (history) => { setConversationHistory(history); navigate(SCREENS.REPORT) }
  const handleSignOut     = async ()  => {
    await supabase?.auth.signOut()
    setSession(null)
    navigate(SCREENS.LANDING)
  }

  if (authLoading) return null

  // ── Auth screens ──────────────────────────────────────────────────────────
  if (screen === SCREENS.LOGIN) {
    return <Login
      onSuccess={() => navigate(SCREENS.DASHBOARD)}
      onSignup={() => navigate(SCREENS.SIGNUP)}
    />
  }

  if (screen === SCREENS.SIGNUP) {
    return <Signup
      onSuccess={() => navigate(SCREENS.ACCOUNT_ONBOARDING)}
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
      onStartAudit={() => navigate(SCREENS.ONBOARDING)}
    />
  }

  // ── Existing audit flow ───────────────────────────────────────────────────
  return (
    <>
      {screen === SCREENS.LANDING    && <Landing onStart={handleStart} />}
      {screen === SCREENS.ONBOARDING && <Onboarding onComplete={handleOnboarding} />}
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
