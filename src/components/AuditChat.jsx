import React, { useState, useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { sendMessage } from '../lib/audit.js'
import { initSupabase } from '../lib/supabase.js'
import { usePostHog } from '@posthog/react'

// ─── Gating data ──────────────────────────────────────────────────────────────

const ALL_DOMAINS = [
  'Strategy', 'Operations', 'Sales', 'Marketing', 'Finance',
  'People & Culture', 'Product', 'Customer Experience', 'Technology',
  'Legal & Compliance', 'Supply Chain', 'Brand', 'Partnerships', 'Data & Analytics',
]

const ALL_INDUSTRIES = [
  'SaaS', 'Agency', 'Retail', 'E-commerce', 'Restaurant / Food',
  'Healthcare', 'Legal', 'Real Estate', 'Construction', 'Manufacturing',
  'Logistics', 'Education', 'Finance / Accounting', 'Insurance',
  'Consulting', 'Marketing', 'Media / Publishing', 'Travel / Hospitality',
  'Nonprofit', 'Freelancer / Solo', 'Other',
]

const DOMAIN_MAP = {
  'SaaS':                 ['Strategy', 'Product', 'Sales', 'Marketing', 'Customer Experience', 'Technology', 'Data & Analytics', 'Finance', 'People & Culture'],
  'Agency':               ['Strategy', 'Sales', 'Marketing', 'Operations', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Retail':               ['Strategy', 'Operations', 'Marketing', 'Sales', 'Supply Chain', 'Customer Experience', 'Finance', 'Brand'],
  'E-commerce':           ['Strategy', 'Marketing', 'Operations', 'Technology', 'Customer Experience', 'Supply Chain', 'Data & Analytics', 'Finance'],
  'Restaurant / Food':    ['Operations', 'Marketing', 'Finance', 'People & Culture', 'Customer Experience', 'Brand', 'Supply Chain'],
  'Healthcare':           ['Operations', 'Strategy', 'Legal & Compliance', 'People & Culture', 'Finance', 'Technology', 'Customer Experience'],
  'Legal':                ['Operations', 'Strategy', 'Legal & Compliance', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Real Estate':          ['Sales', 'Marketing', 'Operations', 'Finance', 'Strategy', 'Brand', 'Customer Experience'],
  'Construction':         ['Operations', 'Finance', 'People & Culture', 'Supply Chain', 'Strategy', 'Legal & Compliance'],
  'Manufacturing':        ['Operations', 'Supply Chain', 'Finance', 'Technology', 'People & Culture', 'Strategy', 'Legal & Compliance'],
  'Logistics':            ['Operations', 'Supply Chain', 'Technology', 'Finance', 'Strategy', 'People & Culture'],
  'Education':            ['Strategy', 'Operations', 'Marketing', 'Technology', 'People & Culture', 'Finance', 'Customer Experience'],
  'Finance / Accounting': ['Strategy', 'Operations', 'Legal & Compliance', 'Technology', 'People & Culture', 'Finance', 'Data & Analytics'],
  'Insurance':            ['Operations', 'Legal & Compliance', 'Finance', 'Technology', 'Strategy', 'Customer Experience'],
  'Consulting':           ['Strategy', 'Operations', 'Sales', 'Marketing', 'People & Culture', 'Finance', 'Brand'],
  'Marketing':            ['Strategy', 'Brand', 'Data & Analytics', 'Operations', 'Sales', 'Customer Experience', 'Technology'],
  'Media / Publishing':   ['Strategy', 'Brand', 'Marketing', 'Operations', 'Finance', 'Technology', 'Data & Analytics'],
  'Travel / Hospitality': ['Operations', 'Customer Experience', 'Marketing', 'Finance', 'Brand', 'People & Culture'],
  'Nonprofit':            ['Strategy', 'Operations', 'Finance', 'Marketing', 'People & Culture', 'Partnerships'],
  'Freelancer / Solo':    ['Strategy', 'Sales', 'Marketing', 'Finance', 'Brand', 'Operations'],
  'Other':                ['Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & Culture', 'Technology', 'Customer Experience'],
}

// ─── Gating detection ─────────────────────────────────────────────────────────

function detectDomainViolation(text, savedDomain) {
  if (!savedDomain) return false
  const lower = text.toLowerCase()
  return ALL_DOMAINS.some(d =>
    d.toLowerCase() !== savedDomain.toLowerCase() &&
    lower.includes(d.toLowerCase())
  )
}

function detectIndustryViolation(text, savedIndustry) {
  if (!savedIndustry) return false
  const lower = text.toLowerCase()
  return ALL_INDUSTRIES.some(ind =>
    ind.toLowerCase() !== savedIndustry.toLowerCase() &&
    lower.includes(ind.toLowerCase())
  )
}

// ─── Upgrade Panel ────────────────────────────────────────────────────────────

function UpgradePanel({ type, tierData, userInfo, panelStyles, onDismiss }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError,   setCheckoutError]   = useState(null)
  const posthog = usePostHog()

  const isDomain    = type === 'domain'
  const isEssential = tierData?.tier === 'essential'
  const targetTier  = isEssential ? 'business' : 'portfolio'
  const ctaLabel    = isEssential ? 'Upgrade to Business — $99/mo' : 'Upgrade to Portfolio — $299/mo'
  const pills       = isEssential ? (DOMAIN_MAP[tierData?.industry] || ALL_DOMAINS) : ALL_INDUSTRIES
  const currentItem = isEssential ? tierData?.domain : tierData?.industry

  useEffect(() => {
    posthog?.capture('upgrade_panel_shown', {
      trigger_type: type,
      current_tier: tierData?.tier,
      target_tier: targetTier,
      industry: tierData?.industry,
      domain: tierData?.domain,
    })
  }, [])

  const handleUpgrade = async () => {
    posthog?.capture('upgrade_clicked', {
      current_tier: tierData?.tier,
      target_tier: targetTier,
      industry: tierData?.industry,
      domain: tierData?.domain,
    })
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, userId: userInfo?.userId, email: userInfo?.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      window.location.href = data.url
    } catch (e) {
      Sentry.captureException(e)
      posthog?.captureException(e)
      setCheckoutError(e.message)
      setCheckoutLoading(false)
    }
  }

  return (
    <div style={panelStyles.panel}>
      <button style={panelStyles.close} onClick={onDismiss} aria-label="Close">✕</button>
      <div style={panelStyles.eyebrow}>SCOPE LIMIT</div>
      <div style={panelStyles.title}>Outside your scope</div>
      <p style={panelStyles.sub}>
        {isEssential
          ? `You're getting a ${tierData?.domain || 'selected domain'}-only audit. Unlock all ${pills.length} domains.`
          : `You're getting a ${tierData?.industry || 'selected industry'}-only audit. Unlock all ${pills.length} industries.`}
      </p>
      <div style={panelStyles.sectionLabel}>YOUR PLAN</div>
      <div style={panelStyles.pills}>
        {pills.filter(item => item.toLowerCase() === currentItem?.toLowerCase()).map(item => (
          <span key={item} style={{ ...panelStyles.pill, ...panelStyles.pillCurrent }}>{item}</span>
        ))}
      </div>
      <div style={panelStyles.sectionLabel}>{isEssential ? 'UNLOCK WITH BUSINESS' : 'UNLOCK WITH PORTFOLIO'}</div>
      <div style={panelStyles.pills}>
        {pills.filter(item => item.toLowerCase() !== currentItem?.toLowerCase()).map(item => (
          <span key={item} style={{ ...panelStyles.pill, ...panelStyles.pillLocked }}>{item}</span>
        ))}
      </div>
      <button
        style={{ ...panelStyles.cta, opacity: checkoutLoading ? 0.7 : 1 }}
        onClick={handleUpgrade}
        disabled={checkoutLoading}
      >
        {checkoutLoading ? 'Redirecting…' : ctaLabel}
      </button>
      {checkoutError && <div style={panelStyles.error}>{checkoutError}</div>}
      <div style={panelStyles.stayLink} onClick={onDismiss}>Stay on my plan</div>
    </div>
  )
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

const FIRST_MESSAGE = (userInfo) => {
  if (userInfo?.goalMode && userInfo?.goal) {
    const timeline = userInfo.goalTimeline ? ` by ${userInfo.goalTimeline}` : ''
    return `So you want to ${userInfo.goal}${timeline} — let's map where you actually are. Walk me through the current state: what's your revenue today, and what's driving it?`
  }
  if (userInfo?.context?.trim()) {
    return `You said "${userInfo.context}" — where is this hitting the business hardest right now: revenue, delivery, demand, or the team?`
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
  const [scopePanel,    setScopePanel]    = useState(null)   // 'domain' | 'industry' | null
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
  const panelStyles = getPanelStyles(theme)
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

    if (tier === 'portfolio') return 'Portfolio'
    if (tier === 'business')  return industry || ''
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

      const response = await sendMessage(apiMessages, {
        industry:      tierData?.industry     ?? resolvedUserInfo?.industry,
        domain:        tierData?.domain       ?? resolvedUserInfo?.domain,
        userId:        resolvedUserInfo?.userId,
        goalMode:      resolvedUserInfo?.goalMode ?? false,
        goal:          resolvedUserInfo?.goal ?? '',
        goalTimeline:  resolvedUserInfo?.goalTimeline ?? '',
        goalBaseline:  resolvedUserInfo?.goalBaseline ?? '',
        memoryContext,
      })
      const isReady      = response.includes('[READY_FOR_REPORT]')
      const isScopeLimit = response.includes('[SCOPE_LIMIT]')
      const cleanResponse = response
        .replace('[READY_FOR_REPORT]', '')
        .replace('[SCOPE_LIMIT]', '')
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

      if (isScopeLimit) setScopePanel('domain')
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
      {scopePanel && (
        <UpgradePanel
          type={scopePanel}
          tierData={tierData}
          userInfo={resolvedUserInfo}
          panelStyles={panelStyles}
          onDismiss={() => { setScopePanel(null); inputRef.current?.focus() }}
        />
      )}

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
    bg: '#0F1520',
    nav: '#141D2B',
    surface: '#1A2535',
    surface2: '#111827',
    border: '#1E2D42',
    borderSoft: '#243247',
    text: '#E8E2D8',
    textSoft: '#B8B0A4',
    textMuted: '#7A8FA8',
    accent: '#4A7FA8',
    accentDark: '#3A6A90',
    accentSoft: '#1A2535',
    accentText: '#8FBAD8',
    userText: '#F5F0E8',
    errorBg: '#301719',
    errorBorder: '#8F4D4D',
    errorText: '#F3D2D2',
  },
  light: {
    bg: '#F5F0E8',
    nav: '#EDE6DC',
    surface: '#E8DFD3',
    surface2: '#F0E8DE',
    border: '#C4B4A4',
    borderSoft: '#BAA898',
    text: '#1A1410',
    textSoft: '#5C4840',
    textMuted: '#8A6A58',
    accent: '#8C4A42',
    accentDark: '#7A3C36',
    accentSoft: '#F0E4E0',
    accentText: '#8C4A42',
    userText: '#F5F0E8',
    errorBg: '#F5E8E8',
    errorBorder: '#D1A3A3',
    errorText: '#7A2C2C',
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

// ─── Panel styles ─────────────────────────────────────────────────────────────

function getPanelStyles(theme) {
  const T = getTheme(theme)

  return {
    panel: {
      position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
      width: 280, zIndex: 200, background: T.surface, borderRadius: 16,
      boxShadow: theme === 'dark' ? '0 18px 44px rgba(0,0,0,0.34)' : '0 12px 34px rgba(58,34,18,0.12)',
      padding: 24, border: `1px solid ${T.border}`,
      color: T.text,
    },
    eyebrow: {
      fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.textMuted,
    },
    title: {
      fontSize: 18, fontWeight: 700, color: T.text, marginTop: 4,
    },
    close: {
      position: 'absolute', top: 16, right: 16,
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 14, color: T.textMuted, padding: 0, lineHeight: 1,
    },
    sub: {
      fontSize: 13, color: T.textSoft, lineHeight: 1.5, marginTop: 6, marginBottom: 0,
    },
    sectionLabel: {
      fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
      color: T.textMuted, marginTop: 20,
    },
    pills: {
      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8,
    },
    pill: {
      fontSize: 12, borderRadius: 20, padding: '4px 12px',
      border: 'none', cursor: 'default',
    },
    pillCurrent: {
      background: T.accent, color: T.userText,
    },
    pillLocked: {
      background: T.surface2, color: T.textSoft,
    },
    cta: {
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: T.accent, color: T.userText, borderRadius: 10,
      padding: '12px', fontWeight: 600, fontSize: 14,
      border: 'none', cursor: 'pointer', marginTop: 20, boxSizing: 'border-box',
    },
    stayLink: {
      textAlign: 'center', fontSize: 12, color: T.textMuted, cursor: 'pointer', marginTop: 10,
    },
    error: {
      fontSize: 11, color: T.errorText, textAlign: 'center', marginTop: 8,
    },
  }
}
