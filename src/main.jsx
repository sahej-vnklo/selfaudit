import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  loaded: (posthog) => {
    const host = window.location.hostname
    const isProduction = host === 'tryselfaudit.com'
    if (!isProduction) {
      posthog.opt_out_capturing()
    }
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <PostHogProvider client={posthog}>
    <App />
  </PostHogProvider>
)
