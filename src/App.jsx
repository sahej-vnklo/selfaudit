import React, { useState } from 'react'
import Landing from './components/Landing.jsx'
import Onboarding from './components/Onboarding.jsx'
import Dashboard from './components/Dashboard.jsx'
import AuditChat from './components/AuditChat.jsx'
import Report from './components/Report.jsx'
import ConfigScreen from './components/ConfigScreen.jsx'

const ENV_CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || ''

const SCREENS = {
  CONFIG: 'config',
  LANDING: 'landing',
  ONBOARDING: 'onboarding',
  DASHBOARD: 'dashboard',
  AUDIT: 'audit',
  REPORT: 'report',
}

export default function App() {
  const needsConfig = !ENV_CLAUDE_KEY

  const [screen, setScreen] = useState(needsConfig ? SCREENS.CONFIG : SCREENS.LANDING)
  const [claudeKey, setClaudeKey] = useState(ENV_CLAUDE_KEY)
  const [userInfo, setUserInfo] = useState(null)
  const [conversationHistory, setConversationHistory] = useState([])
  const [attioPersonId, setAttioPersonId] = useState(null)

  const handleConfig = (ck) => {
    setClaudeKey(ck)
    setScreen(SCREENS.LANDING)
  }

  const handleStart = () => setScreen(SCREENS.ONBOARDING)

  const handleOnboarding = async (info) => {
    setUserInfo(info)
    setScreen(SCREENS.DASHBOARD)

    // Upsert person in Attio — fire and forget
    try {
      const res = await fetch('/api/attio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert_person', userInfo: info }),
      })
      const data = await res.json()
      if (data.person_id) setAttioPersonId(data.person_id)
    } catch (e) {
      // Non-blocking — CRM sync failure should not break the user flow
      console.error('Attio upsert failed:', e)
    }
  }

  const handleStartAudit = () => setScreen(SCREENS.AUDIT)

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
      {screen === SCREENS.DASHBOARD && userInfo && (
        <Dashboard userInfo={userInfo} onStartAudit={handleStartAudit} />
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
          attioPersonId={attioPersonId}
        />
      )}
    </>
  )
}
