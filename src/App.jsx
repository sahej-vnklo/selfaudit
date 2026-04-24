import React, { useState } from 'react'
import Landing from './components/Landing.jsx'
import Onboarding from './components/Onboarding.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import ConfigScreen from './components/ConfigScreen.jsx'

// In production: set these as env vars and remove ConfigScreen
const ENV_CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''
const ENV_RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY || ''

const SCREENS = {
  CONFIG: 'config',
  LANDING: 'landing',
  ONBOARDING: 'onboarding',
  AUDIT: 'audit',
  REPORT: 'report',
}

export default function App() {
  const needsConfig = !ENV_CLAUDE_KEY || !ENV_RESEND_KEY

  const [screen, setScreen] = useState(needsConfig ? SCREENS.CONFIG : SCREENS.LANDING)
  const [claudeKey, setClaudeKey] = useState(ENV_CLAUDE_KEY)
  const [resendKey, setResendKey] = useState(ENV_RESEND_KEY)
  const [userInfo, setUserInfo] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])

  const handleConfig = (ck, rk) => {
    setClaudeKey(ck)
    setResendKey(rk)
    setScreen(SCREENS.LANDING)
  }

  const handleStart = () => setScreen(SCREENS.ONBOARDING)

  const handleOnboarding = (info) => {
    setUserInfo(info)
    setScreen(SCREENS.AUDIT)
  }

  const handleReportReady = (history) => {
    setConversationHistory(history)
    setScreen(SCREENS.REPORT)
  }

  return (
    <>
      {screen === SCREENS.CONFIG && (
        <ConfigScreen onReady={handleConfig} />
      )}
      {screen === SCREENS.LANDING && (
        <Landing onStart={handleStart} />
      )}
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
          resendApiKey={resendKey}
        />
      )}
    </>
  )
}
