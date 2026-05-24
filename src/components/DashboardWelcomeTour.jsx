import React, { useEffect, useMemo } from 'react'
import prototypeHtml from '../../prototypes/onboarding-tour-demo.html?raw'

const COMPLETE_MESSAGE = 'selfaudit-tour-complete'

function buildTourHtml() {
  const injectedCss = `
    <style>
      .demo-controls { display: none !important; }
    </style>
  `

  const injectedScript = `
    <script>
      window.addEventListener('message', function () {})
      document.addEventListener('click', function (event) {
        var chrome = document.getElementById('chrome')
        var restartBtn = document.getElementById('restartBtn')
        if (!chrome || !chrome.classList.contains('zeroed')) return
        if (restartBtn && (event.target === restartBtn || restartBtn.contains(event.target))) return
        window.parent.postMessage({ type: '${COMPLETE_MESSAGE}' }, '*')
      }, true)
    </script>
  `

  return prototypeHtml
    .replace('</head>', `${injectedCss}</head>`)
    .replace('</body>', `${injectedScript}</body>`)
}

export default function DashboardWelcomeTour({ onComplete }) {
  const srcDoc = useMemo(() => buildTourHtml(), [])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event?.data?.type !== COMPLETE_MESSAGE) return
      onComplete?.()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onComplete])

  return (
    <div style={styles.shell}>
      <iframe
        title="SelfAudit welcome tour"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        style={styles.frame}
      />
    </div>
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    background: '#09111c',
  },
  frame: {
    width: '100%',
    height: '100vh',
    border: 'none',
    display: 'block',
    background: 'transparent',
  },
}
