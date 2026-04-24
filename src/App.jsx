import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import Landing from './components/Landing.jsx'
import Onboarding from './components/Onboarding.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import ConfigScreen from './components/ConfigScreen.jsx'
import Login from './components/auth/Login.jsx'
import Signup from './components/auth/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'
import AccountOnboarding from './components/AccountOnboarding.jsx'

const ENV_CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''

const SCREENS = {
  CONFIG: 'config',
  LANDING: 'landing',
  ONBOARDING: 'onboarding',
  AUDIT: 'audit',
  REPORT: 'report',
  LOGIN: 'login',
  SIGNUP: 'signup',
  DASHBOARD: 'dashboard',
  ACCOUNT_ONBOARDING: 'account_onboarding',
}

// Derive initial screen from URL hash so direct links work (#login, #signup, #dashboard)
function screenFromHash() {
  const h = window.location.hash.replace('#', '')
  if (h === 'login') return SCREENS.LOGIN
  if (h === 'signup') return SCREENS.SIGNUP
  if (h === 'dashboard') return SCREENS.DASHBOARD
  return null
}

export default function App() {
  const needsConfig = !ENV_CLAUDE_KEY
  const [screen, setScreen] = useState(screenFromHash() ?? (needsConfig ? SCREENS.CONFIG : SCREENS.LANDING))
  const [claudeKey, setClaudeKey] = useState(ENV_CLAUDE_KEY)
  const [userInfo, setUserInfo] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(!!supabase)

  // Auth state listener
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Sync screen → hash for auth screens
  const navigate = (s) => {
    setScreen(s)
    const hashScreens = [SCREENS.LOGIN, SCREENS.SIGNUP, SCREENS.DASHBOARD, SCREENS.ACCOUNT_ONBOARDING]
    if (hashScreens.includes(s)) {
      window.location.hash = s
    } else {
      history.replaceState(null, '', window.location.pathname)
    }
  }

  const requireAuth = (s) => {
    if (!session) { navigate(SCREENS.LOGIN); return false }
    navigate(s)
    return true
  }

  // Existing audit flow handlers (unchanged)
  const handleConfig = (ck) => { setClaudeKey(ck); navigate(SCREENS.LANDING) }
  const handleStart = () => navigate(SCREENS.ONBOARDING)
  const handleOnboarding = (info) => { setUserInfo(info); navigate(SCREENS.AUDIT) }
  const handleReportReady = (history) => { setConversationHistory(history); navigate(SCREENS.REPORT) }
  const handleSignOut = async () => {
    await supabase?.auth.signOut()
    setSession(null)
    navigate(SCREENS.LANDING)
  }

  if (authLoading) return null

  // Auth & account screens
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
    return <AccountOnboarding user={session.user} onComplete={() => navigate(SCREENS.DASHBOARD)} />
  }
  if (screen === SCREENS.DASHBOARD) {
    if (!session) { navigate(SCREENS.LOGIN); return null }
    return <Dashboard
      user={session.user}
      onSignOut={handleSignOut}
      onStartAudit={() => navigate(SCREENS.ONBOARDING)}
    />
  }

  // Existing audit flow (unchanged)
  return (
    <>
      {screen === SCREENS.CONFIG && <ConfigScreen onReady={handleConfig} />}
      {screen === SCREENS.LANDING && <Landing onStart={handleStart} />}
      {screen === SCREENS.ONBOARDING && <Onboarding onComplete={handleOnboarding} />}
      {screen === SCREENS.AUDIT && userInfo && (
        <AuditChat
          userInfo={userInfo}
          apiKey={claudeKey}
          onReportReady={handleReportReady}
          conversationHistory={conversationHistory}
          setConversationHistory={setConversationHistory}
        />
      )}
      {screen === SCREENS.REPORT && userInfo && (
        <Report
          userInfo={userInfo}
          conversationHistory={conversationHistory}
          apiKey={claudeKey}
        />
      )}
    </>
  )
}
