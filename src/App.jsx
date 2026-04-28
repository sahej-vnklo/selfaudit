import React, { useState } from 'react'
import Landing from './components/Landing.jsx'
import Onboarding from './components/Onboarding.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import ConfigScreen from './components/ConfigScreen.jsx'
import Signup from './components/Signup.jsx'
import AccountOnboarding from './components/AccountOnboarding.jsx'
import Dashboard from './components/Dashboard.jsx'

// In production: set VITE_CLAUDE_API_KEY as env var and remove ConfigScreen
const ENV_CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''

const SCREENS = {
  CONFIG:             'config',
  LANDING:            'landing',
  // Free audit flow
  ONBOARDING:         'onboarding',
  AUDIT:              'audit',
  REPORT:             'report',
  // Auth flow
  SIGNUP:             'signup',
  ACCOUNT_ONBOARDING: 'account_onboarding',
  DASHBOARD:          'dashboard',
}

export default function App() {
  const needsConfig = !ENV_CLAUDE_KEY

  const [screen, setScreen] = useState(needsConfig ? SCREENS.CONFIG : SCREENS.LANDING)
  const [claudeKey, setClaudeKey] = useState(ENV_CLAUDE_KEY)

  // Free audit flow state
  const [userInfo, setUserInfo] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])

  // Auth flow state
  const [currentUser, setCurrentUser] = useState(null)
  const [userTier, setUserTier] = useState(null)

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleConfig = (ck) => {
    setClaudeKey(ck)
    setScreen(SCREENS.LANDING)
  }

  // Free audit
  const handleStart = () => setScreen(SCREENS.ONBOARDING)
  const handleOnboarding = (info) => {
    setUserInfo(info)
    setScreen(SCREENS.AUDIT)
  }
  const handleReportReady = (history) => {
    setConversationHistory(history)
    setScreen(SCREENS.REPORT)
  }

  // Auth / paid flow
  const handleSignUp = () => setScreen(SCREENS.SIGNUP)
  const handleSignupComplete = ({ user, tier }) => {
    setCurrentUser(user)
    setUserTier(tier)
    setScreen(SCREENS.ACCOUNT_ONBOARDING)
  }
  const handleAccountOnboardingComplete = () => setScreen(SCREENS.DASHBOARD)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {screen === SCREENS.CONFIG && (
        <ConfigScreen onReady={handleConfig} />
      )}

      {screen === SCREENS.LANDING && (
        <Landing onStart={handleStart} onSignUp={handleSignUp} />
      )}

      {/* Free audit flow */}
      {screen === SCREENS.ONBOARDING && (
        <Onboarding onComplete={handleOnboarding} />
      )}
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

      {/* Auth / paid flow */}
      {screen === SCREENS.SIGNUP && (
        <Signup
          onComplete={handleSignupComplete}
          onBack={() => setScreen(SCREENS.LANDING)}
        />
      )}
      {screen === SCREENS.ACCOUNT_ONBOARDING && currentUser && (
        <AccountOnboarding
          user={currentUser}
          tier={userTier}
          onComplete={handleAccountOnboardingComplete}
        />
      )}
      {screen === SCREENS.DASHBOARD && currentUser && (
        <Dashboard user={currentUser} tier={userTier} />
      )}
    </>
  )
}
