import React, { useState, useEffect, useRef } from 'react'
import { sendMessage } from '../lib/audit.js'
import { initSupabase } from '../lib/supabase.js'

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

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({ type, tierData, onDismiss }) {
  const isDomain = type === 'domain'

  const title = isDomain
    ? "This domain isn't included in your plan."
    : "This industry isn't included in your plan."

  const ctaLabel = isDomain
    ? 'Upgrade to Business — $99/mo'
    : 'Upgrade to Portfolio — $299/mo'

  const pills     = isDomain ? (DOMAIN_MAP[tierData?.industry] || ALL_DOMAINS) : ALL_INDUSTRIES
  const currentItem = isDomain ? tierData?.domain : tierData?.industry

  return (
    <div style={m.overlay}>
      <div style={m.modal}>
        <h2 style={m.title}>{title}</h2>
        <div style={m.pills}>
          {pills.map(item => {
            const isCurrent = item.toLowerCase() === currentItem?.toLowerCase()
            return (
              <span key={item} style={{ ...m.pill, ...(isCurrent ? m.pillInactive : m.pillActive) }}>
                {item}
              </span>
            )
          })}
        </div>
        <button style={m.cta} onClick={onDismiss}>{ctaLabel}</button>
        <button style={m.dismiss} onClick={onDismiss}>Stay on my plan</button>
      </div>
    </div>
  )
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

const FIRST_MESSAGE = () =>
  `Let's start simple. In one sentence — what's the biggest problem you're actually trying to solve right now?`

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditChat({ userInfo, onReportReady, conversationHistory, setConversationHistory }) {
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [initialized,  setInitialized]  = useState(false)
  const [tierData,     setTierData]     = useState(null)   // { tier, industry, domain }
  const [upgradeModal, setUpgradeModal] = useState(null)   // 'domain' | 'industry' | null
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (!initialized) {
      const firstMsg = FIRST_MESSAGE()
      setConversationHistory([
        { role: 'assistant', content: firstMsg, display: firstMsg }
      ])
      setInitialized(true)
    }
  }, [])

  // Fetch tier/industry/domain for logged-in users via Supabase client
  useEffect(() => {
    if (!userInfo?.userId) return
    initSupabase()
      .then(sb => sb
        .from('profiles')
        .select('tier, industry, domain')
        .eq('id', userInfo.userId)
        .single()
      )
      .then(({ data }) => {
        if (data) {
          console.log('TIER DATA:', { tier: data.tier, industry: data.industry, domain: data.domain })
          setTierData(data)
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

  // Fix 4: "Auditing:" label — derived from tier profile data
  const auditingLabel = React.useMemo(() => {
    if (!tierData) return userInfo?.context || ''
    const { tier, industry, domain } = tierData
    if (tier === 'portfolio') return 'Portfolio'
    if (tier === 'business')  return industry || userInfo?.context || ''
    // essential
    if (industry && domain)   return `${industry} — ${domain}`
    return userInfo?.context || ''
  }, [tierData, userInfo])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    // ── Tier gating — check before sending, never mid-response ───────────────
    if (tierData) {
      const { tier, industry, domain } = tierData
      console.log('CHECKING MESSAGE:', text, 'AGAINST DOMAIN:', domain, '| tier:', tier)

      if (tier === 'essential' && detectDomainViolation(text, domain)) {
        setInput('')
        setUpgradeModal('domain')
        return
      }

      if (tier === 'business' && detectIndustryViolation(text, industry)) {
        setInput('')
        setUpgradeModal('industry')
        return
      }
      // 'portfolio' and anything else: pass through freely
    }
    // ── End gating ────────────────────────────────────────────────────────────

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
      {upgradeModal && (
        <UpgradeModal
          type={upgradeModal}
          tierData={tierData}
          onDismiss={() => { setUpgradeModal(null); inputRef.current?.focus() }}
        />
      )}

      <nav style={styles.nav}>
        <div style={{...styles.logo, cursor: 'pointer'}} onClick={handleLogoClick}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.navMeta}>
          <span style={styles.auditingLabel}>Auditing:</span>
          <span style={styles.auditingContext}>{auditingLabel}</span>
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Modal styles ─────────────────────────────────────────────────────────────

const m = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--white)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)',
    padding: '2rem', width: '100%', maxWidth: 480,
    boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
  },
  title: {
    fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400,
    lineHeight: 1.3, marginBottom: '1.25rem', color: 'var(--black)',
  },
  pills: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.75rem',
  },
  pill: {
    fontSize: 13, fontWeight: 500, padding: '6px 14px',
    borderRadius: 'var(--radius-pill)', border: '0.5px solid',
    cursor: 'default',
  },
  pillActive: {
    background: 'var(--green-light)', color: 'var(--green-dark)',
    borderColor: 'var(--green)',
  },
  pillInactive: {
    background: 'var(--white)', color: 'var(--gray-300)',
    borderColor: 'var(--gray-200)',
  },
  cta: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, padding: '13px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    marginBottom: 12,
  },
  dismiss: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: 'var(--gray-400)', padding: 8,
  },
}
