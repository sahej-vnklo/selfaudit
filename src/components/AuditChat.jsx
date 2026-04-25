import React, { useState, useEffect, useRef } from 'react'
import { sendMessage } from '../lib/audit.js'

const FIRST_MESSAGE = (context) =>
  `I'm here to audit — no agenda, no AI evangelism. Just honest clarity.\n\nYou're looking at: **${context}**\n\nLet's start simple. In one sentence — what's the biggest problem you're actually trying to solve right now?`

export default function AuditChat({ userInfo, apiKey, onReportReady, conversationHistory, setConversationHistory }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!initialized) {
      const firstMsg = FIRST_MESSAGE(userInfo.context)
      setConversationHistory([
        { role: 'assistant', content: firstMsg, display: firstMsg }
      ])
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg = { role: 'user', content: text, display: text }
    const newHistory = [...conversationHistory, userMsg]
    setConversationHistory(newHistory)
    setLoading(true)

    try {
      const apiMessages = newHistory
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await sendMessage(apiMessages)
      const isReady = response.includes('[READY_FOR_REPORT]')
      const cleanResponse = response.replace('[READY_FOR_REPORT]', '').trim()

      const assistantMsg = { role: 'assistant', content: cleanResponse, display: cleanResponse }
      const finalHistory = [...newHistory, assistantMsg]
      setConversationHistory(finalHistory)

      if (isReady) {
        setTimeout(() => onReportReady(finalHistory), 1200)
      }
    } catch (err) {
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        display: 'Something went wrong. Please try again.',
        error: true
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={() => window.location.reload()}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.navMeta}>
          <span style={styles.auditingLabel}>Auditing:</span>
          <span style={styles.auditingContext}>{userInfo.context}</span>
        </div>
      </nav>

      <div style={styles.messages}>
        {conversationHistory.map((msg, i) => (
          <Message key={i} msg={msg} delay={i * 0.05} />
        ))}

        {loading && (
          <div style={styles.typingWrap}>
            <div style={styles.typingBubble}>
              <span style={{ ...styles.dot, animationDelay: '0s' }} />
              <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
              <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputWrap}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Your answer..."
            rows={1}
            disabled={loading}
          />
          <button
            style={{ ...styles.sendBtn, ...((!input.trim() || loading) ? styles.sendDisabled : {}) }}
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p style={styles.hint}>Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

function Message({ msg, delay }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      ...styles.msgRow,
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: `fadeUp 0.3s ease ${delay}s both`
    }}>
      {!isUser && (
        <div style={styles.avatar}>SA</div>
      )}
      <div style={{
        ...styles.bubble,
        ...(isUser ? styles.userBubble : styles.aiBubble),
        ...(msg.error ? { borderColor: '#F09595', background: '#FCEBEB' } : {})
      }}>
        <FormattedText text={msg.display} />
      </div>
    </div>
  )
}

function FormattedText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p style={styles.msgText}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 500 }}>{part.slice(2, -2)}</strong>
        }
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ))
      })}
    </p>
  )
}

const styles = {
  page: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--white)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2rem', borderBottom: '0.5px solid var(--gray-200)',
    background: 'var(--white)', zIndex: 10, flexShrink: 0
  },
  logo: { fontSize: 16, fontWeight: 500, letterSpacing: '-0.4px' },
  navMeta: { display: 'flex', alignItems: 'center', gap: 6, maxWidth: '60%' },
  auditingLabel: { fontSize: 12, color: 'var(--gray-400)' },
  auditingContext: {
    fontSize: 12, color: 'var(--gray-600)', fontWeight: 500,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  messages: {
    flex: 1, overflowY: 'auto',
    padding: '2rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '1rem',
    maxWidth: 680, width: '100%', margin: '0 auto', boxSizing: 'border-box'
  },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--green-light)', color: 'var(--green-dark)',
    fontSize: 10, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  },
  bubble: {
    maxWidth: '80%', padding: '12px 16px',
    borderRadius: 'var(--radius)', border: '0.5px solid transparent',
    lineHeight: 1.6
  },
  aiBubble: {
    background: 'var(--gray-100)', borderColor: 'var(--gray-200)',
    borderBottomLeftRadius: 4
  },
  userBubble: {
    background: 'var(--green)', color: 'white',
    borderBottomRightRadius: 4
  },
  msgText: { fontSize: 14, margin: 0, lineHeight: 1.7 },
  typingWrap: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  typingBubble: {
    background: 'var(--gray-100)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', borderBottomLeftRadius: 4,
    padding: '14px 16px', display: 'flex', gap: 5, alignItems: 'center'
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--gray-400)',
    display: 'inline-block',
    animation: 'pulse 1.2s ease infinite'
  },
  inputArea: {
    padding: '1rem 1.5rem 1.25rem',
    borderTop: '0.5px solid var(--gray-200)',
    background: 'var(--white)', flexShrink: 0
  },
  inputWrap: {
    display: 'flex', alignItems: 'flex-end', gap: 10,
    maxWidth: 680, margin: '0 auto',
    background: 'var(--gray-100)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)', padding: '8px 8px 8px 14px'
  },
  textarea: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 14, resize: 'none', lineHeight: 1.5,
    color: 'var(--black)', minHeight: 24, maxHeight: 120,
    outline: 'none', fontFamily: 'var(--sans)'
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--green)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.15s'
  },
  sendDisabled: { background: 'var(--gray-200)', color: 'var(--gray-400)', cursor: 'not-allowed' },
  hint: { fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 8, maxWidth: 680, margin: '8px auto 0' }
}
