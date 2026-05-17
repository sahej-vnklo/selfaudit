import React, { useState, useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { sendMessage } from '../lib/audit.js'
import { initSupabase } from '../lib/supabase.js'
import { usePostHog } from '@posthog/react'
import {
  DARK_ACCENT,
  DARK_ACCENT_DEEP,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_BORDER,
  DARK_BORDER_STRONG,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED_BG,
  DARK_RED_TEXT,
  DARK_TEXT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_DEEP,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_BORDER,
  LIGHT_BORDER_STRONG,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED_BG,
  LIGHT_RED_TEXT,
  LIGHT_TEXT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_DEEP,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_BORDER,
  SHARP_BORDER_STRONG,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED_BG,
  SHARP_RED_TEXT,
  SHARP_TEXT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

// ─── Chat helpers ─────────────────────────────────────────────────────────────

const FIRST_MESSAGE = (userInfo) => {
  if (userInfo?.goalMode && userInfo?.goal) {
    const timeline = userInfo.goalTimeline ? ` by ${userInfo.goalTimeline}` : ''
    return `So you want to ${userInfo.goal}${timeline} — let's map where you actually are. Walk me through the current state: what's your revenue today, and what's driving it?`
  }
  return `What's going on in your business right now?`
}

const CONTACT_PROMPT_TEXT = "One thing before we go deeper — what's your name and email? I'll send you the full report when we're done. (e.g. Jane Smith, jane@company.com)"
const CONTACT_RETRY_TEXT = "I didn't catch a valid email — just drop your name and email so I can send the report. (e.g. Jane Smith, jane@company.com)"
const CONTACT_CONFIRM_TEXT = "Got it. Let's keep going."
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/

function isContactMetaMessage(msg) {
  return !!(msg?.isContactPrompt || msg?.isContactReply || msg?.isContactRetry || msg?.isContactConfirmation)
}

function cleanContactReplyContent(text = '') {
  return text
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/\b(sahej|jane|smith|my name is|email is|i am)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toSubstantiveHistory(history) {
  return history
    .filter(m => m.role !== 'system')
    .filter(m => !m.isContactPrompt && !m.isContactRetry && !m.isContactConfirmation)
    .map(m => {
      if (!m.isContactReply) return m

      const cleanedContent = cleanContactReplyContent(m.nonContactContent || m.content)
      if (cleanedContent.length < 5) return null

      return {
        ...m,
        content: cleanedContent,
        display: cleanedContent,
      }
    })
    .filter(Boolean)
}

function toApiMessages(history) {
  return toSubstantiveHistory(history)
    .map(m => ({ role: m.role, content: m.content }))
}

function parseContactReply(text) {
  const emailMatch = text.match(EMAIL_REGEX)
  if (!emailMatch) return null

  const email = emailMatch[0]
  let name = ''

  const beforeEmail = text.slice(0, emailMatch.index).trim()
  const commaParts = beforeEmail.split(',').map(part => part.trim()).filter(Boolean)
  const candidateName = commaParts[commaParts.length - 1]

  if (candidateName && /^[A-Za-z][A-Za-z .'-]{1,60}$/.test(candidateName) && candidateName.split(/\s+/).length <= 4) {
    name = candidateName
  }

  if (!name) {
    name = text
      .replace(email, '')
      .replace(/[<>()[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[,\s-]+|[,\s-]+$/g, '')
      .trim()
  }

  return { name, email }
}

function extractNonContactText(text, email, name) {
  let remaining = text.replace(email, '')

  if (name && name.length <= 40 && name.split(/\s+/).length <= 4) {
    remaining = remaining.replace(name, '')
  }

  remaining = remaining
    .replace(/\b(my name is|email is|i am)\b/gi, '')
    .replace(/[,\s]+/g, ' ')
    .trim()

  return remaining.length > 15 ? remaining : ''
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditChat({ theme = 'dark', userInfo, onReportReady, conversationHistory, setConversationHistory }) {
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [initialized,   setInitialized]   = useState(false)
  const [tierData,      setTierData]      = useState(null)   // { tier, industry, domain }
  const [memoryContext, setMemoryContext] = useState(null)
  const [contactInfo, setContactInfo] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    collected: !!(userInfo?.name && userInfo?.email) || !!userInfo?.userId,
  })
  const [collectingContact, setCollectingContact] = useState(false)
  const awaitingContactRef = useRef(false)
  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)
  const sessionIdRef = useRef(crypto.randomUUID())
  const posthog     = usePostHog()
  const themeStyles = getStyles(theme)
  const resolvedUserInfo = React.useMemo(() => ({
    ...userInfo,
    name: contactInfo.name || userInfo?.name || '',
    email: contactInfo.email || userInfo?.email || '',
  }), [userInfo, contactInfo])

  useEffect(() => {
    if (!initialized) {
      const firstMsg = FIRST_MESSAGE(userInfo)
      setConversationHistory([
        { role: 'assistant', content: firstMsg, display: firstMsg }
      ])
      setInitialized(true)
    }
  }, [])

  // Fetch tier/industry/domain + memory context for logged-in users
  useEffect(() => {
    if (!userInfo?.userId) return
    initSupabase()
      .then(async sb => {
        const { data } = await sb
          .from('profiles')
          .select('tier, industry, domain')
          .eq('id', userInfo.userId)
        const row = data?.[0]
        if (row) setTierData(row)

        // Fetch last 3 memory entries for compounding context — non-blocking
        try {
          const { data: memRows } = await sb
            .from('user_memory')
            .select('headline, core_problem, priority_actions, status, session_date')
            .eq('user_id', userInfo.userId)
            .order('created_at', { ascending: false })
            .limit(3)

          if (memRows?.length > 0) {
            const memCtx = memRows.map((m, i) =>
              `Session ${i + 1} (${new Date(m.session_date).toLocaleDateString()}): ${m.headline}. Core problem: ${m.core_problem}. Top priorities: ${m.priority_actions?.slice(0, 2).join(', ')}. Status: ${m.status}.`
            ).join('\n')
            setMemoryContext(memCtx)
          }
        } catch {
          // non-blocking — audit still works without memory context
        }
      })
      .catch(() => {})
  }, [userInfo?.userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory, loading])

  // Fix 1: logo nav — dashboard for logged-in, homepage for anonymous
  const handleLogoClick = () => {
    if (userInfo?.userId) {
      window.location.hash = '#dashboard'
    } else {
      window.location.href = '/'
    }
  }

  // "Auditing:" label — prefer tierData once loaded, fall back to profile fields
  // passed directly from Dashboard so the label is correct on first render too.
  const auditingLabel = React.useMemo(() => {
    if (userInfo?.goalMode && userInfo?.goal) return `Goal: ${userInfo.goal}`
    const tier     = tierData?.tier     ?? userInfo?.tier
    const industry = tierData?.industry ?? userInfo?.industry
    const domain   = tierData?.domain   ?? userInfo?.domain

    if (industry && domain)   return `${industry} — ${domain}`
    if (industry)             return industry
    return ''
  }, [tierData, userInfo])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const isContactReply = awaitingContactRef.current
    const parsedContact = isContactReply ? parseContactReply(text) : null
    const nonContactText = parsedContact?.email
      ? extractNonContactText(text, parsedContact.email, parsedContact.name)
      : ''
    const userMsg = {
      role: 'user',
      content: text,
      display: text,
      ...(isContactReply ? { isContactReply: true } : {}),
      ...(nonContactText ? { nonContactContent: nonContactText } : {}),
    }
    let newHistory = [...conversationHistory, userMsg]
    setConversationHistory(newHistory)
    let textForClaude = text
    let effectiveContactInfo = contactInfo

    if (isContactReply) {
      if (parsedContact?.email) {
        const nextContactInfo = {
          name: parsedContact.name || '',
          email: parsedContact.email,
          collected: true,
        }

        setContactInfo(nextContactInfo)
        effectiveContactInfo = nextContactInfo
        setCollectingContact(false)
        awaitingContactRef.current = false
        newHistory = [...newHistory, {
          role: 'assistant',
          content: CONTACT_CONFIRM_TEXT,
          display: CONTACT_CONFIRM_TEXT,
          isContactConfirmation: true,
        }]
        setConversationHistory(newHistory)

        if (!nonContactText || nonContactText.split(/\s+/).length <= 3) {
          inputRef.current?.focus()
          return
        }

        textForClaude = nonContactText
      } else {
        setCollectingContact(true)
        setConversationHistory([...newHistory, {
          role: 'assistant',
          content: CONTACT_RETRY_TEXT,
          display: CONTACT_RETRY_TEXT,
          isContactRetry: true,
          isContactPrompt: true,
        }])
        inputRef.current?.focus()
        return
      }
    }

    setLoading(true)

    const messageIndex = newHistory.filter(m => m.role === 'user' && (!m.isContactReply || m.nonContactContent)).length
    posthog?.capture('audit_message_sent', {
      message_index: messageIndex,
      industry: tierData?.industry ?? userInfo?.industry,
      domain: tierData?.domain ?? userInfo?.domain,
      tier: tierData?.tier ?? userInfo?.tier,
    })

    try {
      const apiMessages = toApiMessages(newHistory)

      let auditToken = ''
      if (resolvedUserInfo?.userId) {
        const sb = await initSupabase()
        const { data: { session: _s } } = await sb.auth.getSession()
        auditToken = _s?.access_token || ''
      }

      const response = await sendMessage(apiMessages, {
        industry:      tierData?.industry     ?? resolvedUserInfo?.industry,
        domain:        tierData?.domain       ?? resolvedUserInfo?.domain,
        userId:        resolvedUserInfo?.userId,
        goalMode:      resolvedUserInfo?.goalMode ?? false,
        goal:          resolvedUserInfo?.goal ?? '',
        goalTimeline:  resolvedUserInfo?.goalTimeline ?? '',
        goalBaseline:  resolvedUserInfo?.goalBaseline ?? '',
        memoryContext,
        token:         auditToken || undefined,
      })
      const isReady      = response.includes('[READY_FOR_REPORT]')
      const cleanResponse = response
        .replace('[READY_FOR_REPORT]', '')
        .trim()

      const assistantMsg = { role: 'assistant', content: cleanResponse, display: cleanResponse }
      let finalHistory = [...newHistory, assistantMsg]
      const assistantCount = finalHistory.filter(m => m.role === 'assistant' && !isContactMetaMessage(m)).length
      if (!effectiveContactInfo.collected && !awaitingContactRef.current && assistantCount >= 4) {
        awaitingContactRef.current = true
        setCollectingContact(true)
        finalHistory = [...finalHistory, {
          role: 'assistant',
          content: CONTACT_PROMPT_TEXT,
          display: CONTACT_PROMPT_TEXT,
          isContactPrompt: true,
        }]
      }
      setConversationHistory(finalHistory)

      if (resolvedUserInfo?.userId) {
        const sessionId = sessionIdRef.current
        const userId = resolvedUserInfo.userId
        initSupabase().then(sb => sb.from('chats').insert([
          { user_id: userId, session_id: sessionId, role: 'user',      message: textForClaude },
          { user_id: userId, session_id: sessionId, role: 'assistant', message: cleanResponse },
        ])).catch(e => console.warn('[chats] save failed:', e?.message))
      }

      if (isReady) {
        const reportHistory = toSubstantiveHistory(finalHistory)
        posthog?.capture('audit_report_ready', {
          message_count: reportHistory.filter(m => m.role === 'user').length,
          industry: tierData?.industry ?? resolvedUserInfo?.industry,
          domain: tierData?.domain ?? resolvedUserInfo?.domain,
          tier: tierData?.tier ?? resolvedUserInfo?.tier,
        })

        const sessionId = sessionIdRef.current
        if (resolvedUserInfo?.userId) {
          const goalInput = reportHistory.find(m => m.role === 'user')?.content ?? ''
          initSupabase().then(sb => {
            sb.from('audit_sessions').insert({
              user_id:    resolvedUserInfo.userId,
              session_id: sessionId,
              goal_input: goalInput,
              industry:   tierData?.industry ?? resolvedUserInfo?.industry ?? null,
              domain:     tierData?.domain   ?? resolvedUserInfo?.domain   ?? null,
            }).catch(e => console.warn('[audit_sessions] save failed:', e?.message))

            const msgs = reportHistory
              .filter(m => m.role !== 'system')
              .map(m => ({ session_id: sessionId, role: m.role, content: m.content }))
            sb.from('audit_messages').insert(msgs)
              .catch(e => console.warn('[audit_messages] save failed:', e?.message))
          }).catch(() => {})
        }

        setTimeout(() => onReportReady(reportHistory, sessionId, effectiveContactInfo.collected ? effectiveContactInfo : null), 1200)
      }
    } catch (err) {
      Sentry.captureException(err)
      posthog?.captureException(err)
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
    <div style={themeStyles.page}>
      <nav style={themeStyles.nav}>
        <div style={{...themeStyles.logo, cursor: 'pointer'}} onClick={handleLogoClick}>
          self<span style={{ color: themeStyles.accentColor }}>audit</span>
        </div>
        {auditingLabel && (
          <div style={themeStyles.navMeta}>
            <span style={themeStyles.auditingLabel}>Auditing:</span>
            <span style={themeStyles.auditingContext}>{auditingLabel}</span>
          </div>
        )}
      </nav>

      <div style={themeStyles.messages}>
        {conversationHistory.map((msg, i) => (
          <Message key={i} msg={msg} delay={i * 0.05} themeStyles={themeStyles} />
        ))}

        {loading && (
          <div style={themeStyles.typingWrap}>
            <div style={themeStyles.typingBubble}>
              <span style={{ ...themeStyles.dot, animationDelay: '0s' }} />
              <span style={{ ...themeStyles.dot, animationDelay: '0.2s' }} />
              <span style={{ ...themeStyles.dot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={themeStyles.inputArea}>
        <div style={themeStyles.inputWrap}>
          <textarea
            ref={inputRef}
            style={themeStyles.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Your answer..."
            rows={1}
            disabled={loading}
          />
          <button
            style={{ ...themeStyles.sendBtn, ...((!input.trim() || loading) ? themeStyles.sendDisabled : {}) }}
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p style={themeStyles.hint}>Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Message({ msg, delay, themeStyles }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      ...themeStyles.msgRow,
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: `fadeUp 0.3s ease ${delay}s both`
    }}>
      {!isUser && (
        <div style={themeStyles.avatar}>SA</div>
      )}
      <div style={{
        ...themeStyles.bubble,
        ...(isUser ? themeStyles.userBubble : themeStyles.aiBubble),
        ...(msg.error ? themeStyles.errorBubble : {})
      }}>
        <FormattedText text={msg.display} msgTextStyle={themeStyles.msgText} />
      </div>
    </div>
  )
}

function FormattedText({ text, msgTextStyle }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p style={msgTextStyle}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const CHAT_THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    nav: DARK_HERO_SURFACE,
    surface: DARK_PANEL_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    border: DARK_BORDER,
    borderSoft: DARK_BORDER_STRONG,
    text: DARK_TEXT,
    textSoft: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    accent: DARK_ACCENT,
    accentDark: DARK_ACCENT_DEEP,
    accentSoft: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    userText: DARK_TEXT,
    errorBg: DARK_RED_BG,
    errorBorder: DARK_BORDER_STRONG,
    errorText: DARK_RED_TEXT,
  },
  light: {
    bg: LIGHT_PAGE_BG,
    nav: LIGHT_HERO_SURFACE,
    surface: LIGHT_PANEL_SURFACE,
    surface2: LIGHT_PANEL_SURFACE,
    border: LIGHT_BORDER,
    borderSoft: LIGHT_BORDER_STRONG,
    text: LIGHT_TEXT,
    textSoft: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    accent: LIGHT_ACCENT,
    accentDark: LIGHT_ACCENT_DEEP,
    accentSoft: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    userText: '#FBF7F2',
    errorBg: LIGHT_RED_BG,
    errorBorder: LIGHT_BORDER_STRONG,
    errorText: LIGHT_RED_TEXT,
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    nav: SHARP_HERO_SURFACE,
    surface: SHARP_PANEL_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    border: SHARP_BORDER,
    borderSoft: SHARP_BORDER_STRONG,
    text: SHARP_TEXT,
    textSoft: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    accent: SHARP_ACCENT,
    accentDark: SHARP_ACCENT_DEEP,
    accentSoft: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    userText: SHARP_TEXT,
    errorBg: SHARP_RED_BG,
    errorBorder: SHARP_BORDER_STRONG,
    errorText: SHARP_RED_TEXT,
  },
}

function getTheme(theme) {
  return CHAT_THEMES[theme] || CHAT_THEMES.dark
}

function getStyles(theme) {
  const T = getTheme(theme)

  return {
    accentColor: T.accent,
    page: { height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, color: T.text },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2rem', borderBottom: `0.5px solid ${T.border}`,
      background: T.nav, zIndex: 10, flexShrink: 0, color: T.text
    },
    logo: { fontSize: 16, fontWeight: 500, letterSpacing: '-0.4px', color: T.text },
    navMeta: { display: 'flex', alignItems: 'center', gap: 6, maxWidth: '60%' },
    auditingLabel: { fontSize: 12, color: T.textMuted },
    auditingContext: {
      fontSize: 12, color: T.textSoft, fontWeight: 500,
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
      background: T.accentSoft, color: T.accentText,
      border: `1px solid ${T.borderSoft}`,
      fontSize: 10, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    },
    bubble: {
      maxWidth: '80%', padding: '12px 16px',
      borderRadius: 14, border: `0.5px solid ${T.border}`,
      lineHeight: 1.6
    },
    aiBubble: {
      background: T.surface, color: T.text, borderColor: T.border,
      borderBottomLeftRadius: 4
    },
    userBubble: {
      background: T.accent, color: T.userText, borderColor: T.accentDark,
      borderBottomRightRadius: 4
    },
    errorBubble: {
      borderColor: T.errorBorder,
      background: T.errorBg,
      color: T.errorText,
    },
    msgText: { fontSize: 14, margin: 0, lineHeight: 1.7 },
    typingWrap: { display: 'flex', alignItems: 'flex-end', gap: 10 },
    typingBubble: {
      background: T.surface, border: `0.5px solid ${T.border}`,
      borderRadius: 14, borderBottomLeftRadius: 4,
      padding: '14px 16px', display: 'flex', gap: 5, alignItems: 'center'
    },
    dot: {
      width: 6, height: 6, borderRadius: '50%',
      background: T.textMuted,
      display: 'inline-block',
      animation: 'pulse 1.2s ease infinite'
    },
    inputArea: {
      padding: '1rem 1.5rem 1.25rem',
      borderTop: `0.5px solid ${T.border}`,
      background: T.nav, flexShrink: 0
    },
    inputWrap: {
      display: 'flex', alignItems: 'flex-end', gap: 10,
      maxWidth: 680, margin: '0 auto',
      background: T.surface2, borderRadius: 14,
      border: `0.5px solid ${T.borderSoft}`, padding: '8px 8px 8px 14px'
    },
    textarea: {
      flex: 1, border: 'none', background: 'transparent',
      fontSize: 14, resize: 'none', lineHeight: 1.5,
      color: T.text, minHeight: 24, maxHeight: 120,
      outline: 'none', fontFamily: 'var(--sans)'
    },
    sendBtn: {
      width: 36, height: 36, borderRadius: 8,
      background: T.accent, color: T.userText,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: 'none', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.15s'
    },
    sendDisabled: { background: T.borderSoft, color: T.textMuted, cursor: 'not-allowed' },
    hint: { fontSize: 11, color: T.textMuted, textAlign: 'center', maxWidth: 680, margin: '8px auto 0' }
  }
}
