import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import IntelligenceBrief from './IntelligenceBrief.jsx'

const THEMES = {
  dark: {
    bg: '#0F1520',
    surface: '#141D2B',
    surface2: '#111827',
    surface3: '#1A2535',
    panel: '#141D2B',
    panelAlt: '#111827',
    border: '#1E2D42',
    border2: '#243247',
    text: '#E8E2D8',
    textSecondary: '#B8B0A4',
    textMuted: '#7A8FA8',
    textFaint: '#4A6080',
    accent: '#4A7FA8',
    accentLight: '#1A2535',
    accentText: '#8FBAD8',
    red: '#C05050',
    redBg: '#1A0A0A',
    redText: '#C05050',
    amber: '#8C6A30',
    amberBg: '#1A1508',
    amberText: '#C9A040',
    green: '#4A9E6B',
    greenBg: '#0A1A10',
    greenText: '#4A9E6B',
    blue: '#5B7FA6',
    violet: '#7A6AAE',
    sand: '#A67A5B',
    white: '#F5F0E8',
    overlay: 'rgba(3,7,16,0.6)',
    overlaySoft: 'rgba(0,0,0,0.35)',
  },
  light: {
    bg: '#F5F0E8',
    surface: '#EDE6DC',
    surface2: '#E8DFD3',
    surface3: '#E2D8CC',
    panel: '#EDE6DC',
    panelAlt: '#E8DFD3',
    border: '#C4B4A4',
    border2: '#BAA898',
    text: '#1A1410',
    textSecondary: '#5C4840',
    textMuted: '#6B5040',
    textFaint: '#8A6A58',
    accent: '#8C4A42',
    accentLight: '#F0E4E0',
    accentText: '#7A3C36',
    red: '#B85C5C',
    redBg: '#F5E8E8',
    redText: '#8C2A2A',
    amber: '#8C6A30',
    amberBg: '#F5F0E0',
    amberText: '#7A5A10',
    green: '#4A9E6B',
    greenBg: '#E8F5EE',
    greenText: '#1A6B3A',
    blue: '#5B7FA6',
    violet: '#7A6AAE',
    sand: '#A67A5B',
    white: '#FFFFFF',
    overlay: 'rgba(26,20,16,0.22)',
    overlaySoft: 'rgba(58,34,18,0.12)',
  },
}

const G = {
  black: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  panel: 'var(--panel)',
  panelAlt: 'var(--panel-alt)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  accentText: 'var(--accent-text)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  redText: 'var(--red-text)',
  amber: 'var(--amber)',
  amberBg: 'var(--amber-bg)',
  amberText: 'var(--amber-text)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  greenText: 'var(--green-text)',
  blue: 'var(--blue)',
  violet: 'var(--violet)',
  sand: 'var(--sand)',
  white: 'var(--white)',
  overlay: 'var(--overlay)',
  overlaySoft: 'var(--overlay-soft)',
}

function getThemeVars(theme) {
  const C = THEMES[theme] || THEMES.dark
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--surface3': C.surface3,
    '--panel': C.panel,
    '--panel-alt': C.panelAlt,
    '--border': C.border,
    '--border2': C.border2,
    '--text': C.text,
    '--text-secondary': C.textSecondary,
    '--text-muted': C.textMuted,
    '--text-faint': C.textFaint,
    '--accent': C.accent,
    '--accent-light': C.accentLight,
    '--accent-text': C.accentText,
    '--red': C.red,
    '--red-bg': C.redBg,
    '--red-text': C.redText,
    '--amber': C.amber,
    '--amber-bg': C.amberBg,
    '--amber-text': C.amberText,
    '--green': C.green,
    '--green-bg': C.greenBg,
    '--green-text': C.greenText,
    '--blue': C.blue,
    '--violet': C.violet,
    '--sand': C.sand,
    '--white': C.white,
    '--overlay': C.overlay,
    '--overlay-soft': C.overlaySoft,
  }
}

const DOMAIN_MAP = {
  SaaS: ['Strategy', 'Product', 'Sales', 'Marketing', 'Customer Experience', 'Technology', 'Data & Analytics', 'Finance', 'People & Culture'],
  Agency: ['Strategy', 'Sales', 'Marketing', 'Operations', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  Retail: ['Strategy', 'Operations', 'Marketing', 'Sales', 'Supply Chain', 'Customer Experience', 'Finance', 'Brand'],
  'E-commerce': ['Strategy', 'Marketing', 'Operations', 'Technology', 'Customer Experience', 'Supply Chain', 'Data & Analytics', 'Finance'],
  'Restaurant / Food': ['Operations', 'Marketing', 'Finance', 'People & Culture', 'Customer Experience', 'Brand', 'Supply Chain'],
  Healthcare: ['Operations', 'Strategy', 'Legal & Compliance', 'People & Culture', 'Finance', 'Technology', 'Customer Experience'],
  Legal: ['Operations', 'Strategy', 'Legal & Compliance', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Real Estate': ['Sales', 'Marketing', 'Operations', 'Finance', 'Strategy', 'Brand', 'Customer Experience'],
  Construction: ['Operations', 'Finance', 'People & Culture', 'Supply Chain', 'Strategy', 'Legal & Compliance'],
  Manufacturing: ['Operations', 'Supply Chain', 'Finance', 'Technology', 'People & Culture', 'Strategy', 'Legal & Compliance'],
  Logistics: ['Operations', 'Supply Chain', 'Technology', 'Finance', 'Strategy', 'People & Culture'],
  Education: ['Strategy', 'Operations', 'Marketing', 'Technology', 'People & Culture', 'Finance', 'Customer Experience'],
  'Finance / Accounting': ['Strategy', 'Operations', 'Legal & Compliance', 'Technology', 'People & Culture', 'Finance', 'Data & Analytics'],
  Insurance: ['Operations', 'Legal & Compliance', 'Finance', 'Technology', 'Strategy', 'Customer Experience'],
  Consulting: ['Strategy', 'Operations', 'Sales', 'Marketing', 'People & Culture', 'Finance', 'Brand'],
  Marketing: ['Strategy', 'Brand', 'Data & Analytics', 'Operations', 'Sales', 'Customer Experience', 'Technology'],
  'Media / Publishing': ['Strategy', 'Brand', 'Marketing', 'Operations', 'Finance', 'Technology', 'Data & Analytics'],
  'Travel / Hospitality': ['Operations', 'Customer Experience', 'Marketing', 'Finance', 'Brand', 'People & Culture'],
  Nonprofit: ['Strategy', 'Operations', 'Finance', 'Marketing', 'People & Culture', 'Partnerships'],
  'Freelancer / Solo': ['Strategy', 'Sales', 'Marketing', 'Finance', 'Brand', 'Operations'],
  Other: ['Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & Culture', 'Technology', 'Customer Experience'],
}

const BUSINESS_OPTIONS = [
  'SaaS', 'Agency', 'Retail', 'E-commerce', 'Restaurant / Food',
  'Healthcare', 'Legal', 'Real Estate', 'Construction', 'Manufacturing',
  'Logistics', 'Education', 'Finance / Accounting', 'Insurance',
  'Consulting', 'Marketing', 'Media / Publishing', 'Travel / Hospitality',
  'Nonprofit', 'Freelancer / Solo', 'Other',
]

const TIER_BADGE = {
  essential: { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Foundation' },
  business: { bg: 'var(--surface3)', color: 'var(--blue)', label: 'Intelligence' },
  portfolio: { bg: 'var(--surface3)', color: 'var(--violet)', label: 'Intelligence' },
  free: { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Foundation' },
  paid: { bg: 'var(--surface3)', color: 'var(--blue)', label: 'Intelligence' },
}

const TIERS = [
  {
    key: 'essential',
    name: 'Foundation',
    price: '$29',
    desc: 'The truth about your business.',
    features: ['Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'Email delivery'],
  },
  {
    key: 'business',
    name: 'Intelligence',
    price: '$99',
    popular: true,
    desc: 'Persistent intelligence embedded into the business.',
    features: ['Everything in Foundation', 'AI opportunity breakdown', 'Re-audit anytime', 'Track progress'],
  },
]

const TIER_ORDER = { essential: 0, business: 1, portfolio: 2, free: 0, paid: 1 }
const SECTIONS = ['home', 'reports', 'intelligence', 'connectors', 'billing', 'account']

function normalizeTier(raw) {
  if (raw === 'paid') return 'business'
  if (raw === 'free') return 'essential'
  if (raw === 'business' || raw === 'portfolio') return raw
  return 'essential'
}

function parseReportContent(content) {
  if (!content) return null
  try {
    return typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return null
  }
}

function computeHealthScore(domains) {
  if (!domains?.length) return 0
  const total = domains.reduce((sum, domain) => {
    if (domain.status === 'critical') return sum + 30
    if (domain.status === 'needs_work') return sum + 60
    return sum + 85
  }, 0)
  return Math.round(total / domains.length)
}

function severityRank(status) {
  if (status === 'critical') return 0
  if (status === 'needs_work') return 1
  return 2
}

function domainScore(domain) {
  if (domain.status === 'critical') return 30
  if (domain.status === 'needs_work') return 60
  return 85
}

function domainSeverityColor(status) {
  if (status === 'critical') return G.red
  if (status === 'needs_work') return G.amber
  return G.green
}

function modeDotColor(mode) {
  if (mode === 'EXECUTION') return G.violet
  if (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN') return G.sand
  return G.blue
}

function getInitials(name, email) {
  if (name) return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] || '?').toUpperCase()
}

function getSectionFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const section = hash.split('?')[0]
  return SECTIONS.includes(section) ? section : 'home'
}

function formatRelativeTime(input) {
  if (!input) return 'just now'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return 'just now'

  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const units = [
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (const [unit, size] of units) {
    if (absMs >= size || unit === 'minute') {
      return rtf.format(Math.round(diffMs / size), unit)
    }
  }

  return 'just now'
}

function extractGoalFromContext(context) {
  if (!context) return { goal: '', progress: null, timeline: '' }
  if (typeof context === 'object') {
    return {
      goal: context.active_goal || context.goal || context.current_goal || '',
      progress: typeof context.goal_progress === 'number' ? context.goal_progress : null,
      timeline: context.goal_timeline || context.timeline_assessment || '',
    }
  }
  const goalMatch = String(context).match(/active goal:\s*(.+)/i)
  return { goal: goalMatch?.[1]?.trim() || '', progress: null, timeline: '' }
}

function extractGoalState(profile, reports, businessState) {
  const savedScore = typeof businessState?.goal_score === 'number' ? businessState.goal_score : null
  const fromProfile = extractGoalFromContext(profile?.context)
  if (fromProfile.goal) {
    return {
      ...fromProfile,
      progress: savedScore ?? fromProfile.progress,
    }
  }

  for (const report of reports) {
    const parsed = parseReportContent(report.content)
    if (!parsed) continue
    const goal = parsed.goal_gap_analysis?.goal || parsed.business_state?.goal_state || parsed.business_state?.active_goal || ''
    const timeline = parsed.timeline_feasibility || parsed.goal_gap_analysis?.realistic_timeline || parsed.timeline_reality?.honest_take || ''
    const timelineText = String(timeline || '').trim().toLowerCase()
    const fallbackProgress = savedScore != null
      ? savedScore
      : timelineText.startsWith('feasible')
        ? 80
        : timelineText.startsWith('tight')
          ? 50
          : timelineText.startsWith('unrealistic')
            ? 20
            : null
    if (goal) return { goal, progress: fallbackProgress, timeline }
  }

  return { goal: '', progress: null, timeline: '' }
}

export default function Dashboard({ user, onStartAudit, onSignOut }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const [profile, setProfile] = useState(null)
  const [businessState, setBusinessState] = useState(null)
  const [businessStateLoading, setBusinessStateLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [section, setSection] = useState(() => getSectionFromHash())
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [scopeSetupOpen, setScopeSetupOpen] = useState(false)
  const pendingAuditRef = useRef(null)

  const name = profile?.name?.trim() || user?.user_metadata?.name?.trim() || ''
  const email = user?.email || ''
  const initials = getInitials(name, email)
  const tier = normalizeTier(profile?.tier)
  const badge = TIER_BADGE[tier] || TIER_BADGE.essential

  useEffect(() => {
    const syncSection = () => setSection(getSectionFromHash())
    window.addEventListener('hashchange', syncSection)
    window.addEventListener('popstate', syncSection)
    if (window.location.hash === '#dashboard' || !window.location.hash) {
      history.replaceState({ section: 'home' }, '', '#home')
    }
    return () => {
      window.removeEventListener('hashchange', syncSection)
      window.removeEventListener('popstate', syncSection)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    ;(async () => {
      try {
        const sb = await initSupabase()
        if (cancelled) return

        const { data, error } = await sb
          .from('profiles')
          .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete')
          .eq('id', user.id)
          .single()

        if (cancelled) return
        if (error) {
          console.error('[dashboard] profile fetch error:', error.message)
          return
        }

        if (data) {
          setProfile(data)
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800))
          const retry = await sb
            .from('profiles')
            .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete')
            .eq('id', user.id)
            .single()
          if (!cancelled && retry.data) setProfile(retry.data)
        }

        const { data: reportData } = await sb
          .from('reports')
          .select('id, title, content, headline, industry, domain, conversation_mode, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (!cancelled) setReports(reportData ?? [])
      } catch (err) {
        console.error('[dashboard] profile fetch threw:', err?.message ?? err)
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (section !== 'billing') return
    if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) return
    if (billing) return
    setBillingLoading(true)
    setBillingError('')

    ;(async () => {
      try {
        const sb = await initSupabase()
        const { data, error } = await sb.functions.invoke('get-billing-details', {
          body: {
            customerId: profile.stripe_customer_id,
            subscriptionId: profile.stripe_subscription_id,
          },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        setBilling(data)
      } catch (err) {
        setBillingError(err.message || 'Could not load billing details.')
      } finally {
        setBillingLoading(false)
      }
    })()
  }, [billing, profile?.stripe_customer_id, profile?.stripe_subscription_id, section])

  useEffect(() => {
    if (!user?.id) {
      setBusinessStateLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setBusinessStateLoading(true)
      try {
        const sb = await initSupabase()
        const { data, error } = await sb
          .from('business_state')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (cancelled) return
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('[dashboard] business_state fetch error:', error.message)
          }
          setBusinessState(null)
          return
        }

        setBusinessState(data || null)
      } catch (error) {
        if (!cancelled) {
          console.error('[dashboard] business_state fetch threw:', error?.message ?? error)
          setBusinessState(null)
        }
      } finally {
        if (!cancelled) setBusinessStateLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const navigateSection = (nextSection) => {
    history.pushState({ section: nextSection }, '', `#${nextSection}`)
    setSection(nextSection)
  }

  const baseAuditInfo = () => ({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    phone: '',
    context: profile?.context || '',
    userId: user?.id || null,
    tier: profile?.tier || null,
    industry: profile?.industry || null,
    domain: profile?.domain || null,
  })

  const ensureScopeThen = (next) => {
    if (profile?.industry) {
      next({ industry: profile.industry, domain: profile?.domain || null })
      return
    }
    pendingAuditRef.current = next
    setScopeSetupOpen(true)
  }

  const startAudit = () => {
    ensureScopeThen((scope) => onStartAudit({ ...baseAuditInfo(), ...scope }))
  }

  const startGoalAudit = (goalData) => {
    ensureScopeThen((scope) => onStartAudit({ ...baseAuditInfo(), ...scope, goalMode: true, ...goalData }))
  }

  const openPortal = async () => {
    if (!profile?.stripe_customer_id) return
    setPortalLoading(true)
    try {
      const sb = await initSupabase()
      const { data, error } = await sb.functions.invoke('create-portal-session', {
        body: { customerId: profile.stripe_customer_id, returnUrl: window.location.href },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setBillingError(err.message || 'Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const sectionMeta = {
    home: '/ command centre',
    reports: '/ reports',
    intelligence: '/ intelligence brief',
    connectors: '/ connectors',
    billing: '/ billing',
    account: '/ account',
  }

  return (
    <div style={{ ...themeVars, ...styles.shell }}>
      {goalModal && (
        <GoalCaptureModal onClose={() => setGoalModal(false)} onStart={(goalData) => {
          setGoalModal(false)
          startGoalAudit(goalData)
        }} />
      )}
      {scopeSetupOpen && (
        <AuditScopeSetupModal
          user={user}
          onClose={() => {
            setScopeSetupOpen(false)
            pendingAuditRef.current = null
          }}
          onSaved={(scope) => {
            setProfile((prev) => ({ ...(prev || {}), ...scope }))
            setScopeSetupOpen(false)
            pendingAuditRef.current?.(scope)
            pendingAuditRef.current = null
          }}
        />
      )}

      <aside
        style={{ ...styles.sidebar, ...(sidebarExpanded ? styles.sidebarExpanded : {}) }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <SidebarButton icon={<IconHome />} active={section === 'home'} onClick={() => navigateSection('home')} label="Home" expanded={sidebarExpanded} />
        <SidebarButton icon={<IconReports />} active={section === 'reports'} onClick={() => navigateSection('reports')} label="Reports" expanded={sidebarExpanded} />
        <SidebarButton icon={<IconIntelligence />} active={section === 'intelligence'} onClick={() => navigateSection('intelligence')} label="Intelligence brief" expanded={sidebarExpanded} />
        <SidebarButton icon={<IconConnectors />} active={section === 'connectors'} onClick={() => navigateSection('connectors')} label="Connectors" expanded={sidebarExpanded} />
        <div style={{ flex: 1 }} />
        <SidebarButton icon={<IconGear />} active={section === 'billing'} onClick={() => navigateSection('billing')} label="Billing" expanded={sidebarExpanded} />
        <button
          type="button"
          onClick={() => navigateSection('account')}
          style={{
            ...styles.avatarButton,
            ...(sidebarExpanded ? styles.avatarButtonExpanded : {}),
            ...(section === 'account' ? styles.avatarButtonActive : {}),
          }}
          aria-label="Account"
          title="Account"
        >
          <span style={{ ...styles.avatarChip, ...(section === 'account' ? styles.avatarChipActive : {}) }}>{initials}</span>
          {sidebarExpanded && <span style={styles.sidebarLabel}>Account</span>}
        </button>
      </aside>

      <div style={styles.appFrame}>
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <div style={styles.logo} onClick={() => navigateSection('home')}>
              self<span style={{ color: G.accentText }}>audit</span>
            </div>
            <div style={styles.breadcrumb}>{sectionMeta[section] || '/ command centre'}</div>
          </div>

          <div style={styles.topbarActions}>
            <button type="button" style={styles.ghostButton} onClick={startAudit}>
              diagnose a problem
            </button>
            <button type="button" style={styles.primaryButton} onClick={() => setGoalModal(true)}>
              map a goal
            </button>
          </div>
        </header>

        <main style={styles.main}>
          {section === 'home' && (
            <HomeSection
              user={user}
              profile={profile}
              businessState={businessState}
              businessStateLoading={businessStateLoading}
              reports={reports}
              reportsLoading={reportsLoading}
              onStartAudit={startAudit}
              onStartGoalAudit={() => setGoalModal(true)}
            />
          )}

          {section === 'reports' && (
            <PageShell
              title="Reports"
              sub="Your saved audit reports."
              actions={<TopButtons onDiagnose={startAudit} onGoal={() => setGoalModal(true)} />}
            >
              {reportsLoading
                ? <ReportSkeletons />
                : reports.length > 0
                  ? <ReportList reports={reports} userId={user?.id} />
                  : <EmptyReports onStartAudit={startAudit} />}
            </PageShell>
          )}

          {section === 'intelligence' && (
            <PageShell>
              <IntelligenceBrief
                user={user}
                profile={profile}
                onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              />
            </PageShell>
          )}

          {section === 'connectors' && (
            <ConnectorsSection user={user} />
          )}

          {section === 'billing' && (
            <PageShell title="Subscription" sub="Your current plan is highlighted. Upgrade or downgrade any time.">
              {(tier === 'business' || tier === 'portfolio') && (
                <LiveBillingCard
                  billing={billing}
                  billingLoading={billingLoading}
                  billingError={billingError}
                  onOpenPortal={openPortal}
                  portalLoading={portalLoading}
                />
              )}
              <div style={styles.tierGrid}>
                {TIERS.map((item) => (
                  <TierCard key={item.key} tier={item} currentTier={tier === 'portfolio' ? 'business' : tier} userId={user?.id} email={user?.email} />
                ))}
              </div>
            </PageShell>
          )}

          {section === 'account' && (
            <AccountSection
              user={user}
              profile={profile}
              onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              onSignOut={onSignOut}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function PageShell({ title, sub, actions, children }) {
  return (
    <div style={styles.pageShell}>
      {(title || actions) && (
        <div style={styles.pageHeader}>
          <div>
            {title && <h1 style={styles.pageTitle}>{title}</h1>}
            {sub && <p style={styles.pageSub}>{sub}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

function HomeSection({ user, profile, businessState, businessStateLoading, reports, reportsLoading, onStartAudit, onStartGoalAudit }) {
  const issuesRef = useRef(null)
  const latestReport = reports[0] || null
  const latestContent = latestReport ? parseReportContent(latestReport.content) : null
  const latestDomains = latestContent?.domains || []
  const sortedDomains = [...latestDomains].sort((a, b) => severityRank(a.status) - severityRank(b.status))
  const flaggedDomains = sortedDomains.filter((domain) => domain.status === 'critical' || domain.status === 'needs_work')
  const staleReport = latestReport && (Date.now() - new Date(latestReport.created_at).getTime()) > 24 * 60 * 60 * 1000
  const alertDomain = flaggedDomains[0]
  const healthScore = latestDomains.length ? computeHealthScore(latestDomains) : null
  const openIssuesCount = flaggedDomains.length
  const goalState = extractGoalState(profile, reports, businessState)
  const lastReportDate = latestReport?.created_at
    ? new Date(latestReport.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—'

  return (
    <div style={styles.pageShell}>
      {staleReport && alertDomain && (
        <div style={styles.alertBar}>
          <div style={styles.alertTextWrap}>
            <span style={styles.alertDot} />
            <span style={styles.alertText}>
              {alertDomain.name} is still flagged from your {lastReportDate} audit. Worth updating before it compounds.
            </span>
          </div>
          <button type="button" style={styles.alertButton} onClick={() => issuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            update status
          </button>
        </div>
      )}

      <div style={styles.kpiGrid}>
        <KpiCard
          label="Health score"
          value={reportsLoading ? '…' : healthScore ?? '—'}
          delta={healthScore === null ? 'No recent diagnostic report' : healthScore >= 70 ? 'Stable' : healthScore >= 45 ? 'Watch closely' : 'Needs attention'}
          tone={healthScore === null ? 'neutral' : healthScore >= 70 ? 'up' : healthScore >= 45 ? 'warn' : 'down'}
        />
        <KpiCard
          label="Open issues"
          value={reportsLoading ? '…' : openIssuesCount}
          delta={openIssuesCount === 0 ? 'Nothing flagged' : `${openIssuesCount} domains still open`}
          tone={openIssuesCount === 0 ? 'up' : openIssuesCount > 2 ? 'down' : 'warn'}
        />
        <KpiCard
          label="Audits run"
          value={reportsLoading ? '…' : reports.length}
          delta={reports.length > 0 ? `Latest: ${lastReportDate}` : 'No reports yet'}
          tone="neutral"
        />
        <KpiCard
          label="Goal progress"
          value={goalState.goal ? (typeof goalState.progress === 'number' ? `${goalState.progress}%` : '—') : '—'}
          delta={goalState.goal ? goalState.goal : 'No active goal'}
          tone={typeof goalState.progress === 'number' ? 'up' : 'neutral'}
        />
      </div>

      <div style={styles.homeColumns}>
        <div style={styles.leftColumn}>
          <div ref={issuesRef}>
            <OpenIssuesPanel report={latestReport} domains={sortedDomains} />
          </div>
          <AuditHistoryPanel reports={reports} reportsLoading={reportsLoading} />
        </div>

        <div style={styles.rightColumn}>
          <BusinessHealthPanel latestDomains={latestDomains} />
          {goalState.goal && <GoalPanel goalState={goalState} />}
          <BusinessStateCard user={user} businessState={businessState} loading={businessStateLoading} />
          {reports.length > 0 && <VnkloCTACard user={user} reports={reports} />}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, delta, tone }) {
  const toneColor = tone === 'up' ? G.greenText : tone === 'warn' ? G.amberText : tone === 'down' ? G.redText : G.textFaint
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={{ ...styles.kpiDelta, color: toneColor }}>{delta}</div>
    </div>
  )
}

function OpenIssuesPanel({ report, domains }) {
  if (!report || domains.length === 0) {
    return (
      <PanelCard title="open issues">
        <EmptyPanel message="Run an audit to populate issue tracking." />
      </PanelCard>
    )
  }

  return (
    <OpenIssuesTracker report={report} domains={domains} />
  )
}

function AuditHistoryPanel({ reports, reportsLoading }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={styles.panelCard}>
      <button type="button" style={styles.panelToggle} onClick={() => setExpanded((prev) => !prev)}>
        <div style={styles.panelTitle}>audit history</div>
        <div style={styles.panelToggleRight}>
          <span style={styles.panelCountBadge}>{reports.length}</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', color: G.textFaint }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {expanded && (
        reportsLoading ? (
          <ReportSkeletons compact />
        ) : reports.length === 0 ? (
          <EmptyPanel message="No past audits yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.slice(0, 3).map((report) => (
              <AuditHistoryRow key={report.id} report={report} />
            ))}
          </div>
        )
      )}
    </div>
  )
}

function BusinessHealthPanel({ latestDomains }) {
  const score = latestDomains.length ? computeHealthScore(latestDomains) : 0
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const fill = (score / 100) * circumference

  return (
    <PanelCard title="business health">
      {latestDomains.length === 0 ? (
        <EmptyPanel message="Health bars appear after your first diagnostic report." />
      ) : (
        <>
          <div style={styles.healthHeader}>
            <div style={styles.donutWrap}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke={G.border} strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke={G.accent}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${fill} ${circumference}`}
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div style={styles.donutScore}>{score}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>overall score</div>
              <div style={{ fontSize: 15, color: G.text, marginTop: 6 }}>
                {score >= 70 ? 'Healthy foundation' : score >= 45 ? 'Mixed signals' : 'Structural risk'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {latestDomains.slice(0, 5).map((domain) => {
              const value = domainScore(domain)
              const barColor = value < 40 ? G.red : value <= 65 ? G.amber : G.green
              return (
                <div key={domain.name} style={styles.domainBarRow}>
                  <div style={styles.domainBarLabel}>{domain.name}</div>
                  <div style={styles.domainBarTrack}>
                    <div style={{ ...styles.domainBarFill, width: `${value}%`, background: barColor }} />
                  </div>
                  <div style={styles.domainBarValue}>{value}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </PanelCard>
  )
}

function GoalPanel({ goalState }) {
  const progress = typeof goalState.progress === 'number' ? Math.max(0, Math.min(100, goalState.progress)) : 0
  return (
    <PanelCard title="active goal">
      <div style={{ fontSize: 14, color: G.textSecondary, lineHeight: 1.5 }}>{goalState.goal}</div>
      <div style={styles.goalTrack}>
        <div style={{ ...styles.goalFill, width: `${progress}%` }} />
      </div>
      <div style={styles.goalMetaRow}>
        <div>{typeof goalState.progress === 'number' ? `${goalState.progress}% of the way there` : 'Progress not quantified yet'}</div>
        <div>{goalState.timeline || 'Timeline still being assessed'}</div>
      </div>
    </PanelCard>
  )
}

function formatAuditUpdateLabel(updatedAt) {
  if (!updatedAt) return 'latest'
  return new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function looksAssumed(value) {
  if (Array.isArray(value)) return value.some((item) => String(item || '').includes('[assumption]'))
  return String(value || '').includes('[assumption]')
}

function displayBusinessStateValue(value, emptySeparator = ', ') {
  if (Array.isArray(value)) return value.filter(Boolean).join(emptySeparator)
  return typeof value === 'string' ? value.trim() : ''
}

function parseBusinessStateList(value, mode) {
  if (!value.trim()) return []
  if (mode === 'funnel') {
    return value
      .split(/\n|→|->/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (mode === 'blockers') {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function BusinessStateValue({ value, emptyLabel = 'Not discussed yet', separator = ', ' }) {
  const rendered = displayBusinessStateValue(value, separator)
  const assumed = looksAssumed(value)
  if (!rendered) {
    return <div style={styles.businessStateEmpty}>{emptyLabel}</div>
  }
  return <div style={{ ...styles.businessStateValue, ...(assumed ? styles.businessStateAssumed : {}) }}>{rendered}</div>
}

function BusinessStateCard({ user, businessState, loading }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    core_offer: '',
    revenue_streams: '',
    operational_blockers: '',
    target_customer: '',
    funnel_stages: '',
  })
  const [savedState, setSavedState] = useState(businessState)

  useEffect(() => {
    setSavedState(businessState)
  }, [businessState])

  useEffect(() => {
    if (!editing) {
      setDraft({
        core_offer: savedState?.core_offer || '',
        revenue_streams: displayBusinessStateValue(savedState?.revenue_streams, ', '),
        operational_blockers: displayBusinessStateValue(savedState?.operational_blockers, '; '),
        target_customer: savedState?.target_customer || '',
        funnel_stages: displayBusinessStateValue(savedState?.funnel_stages, ' → '),
      })
    }
  }, [editing, savedState])

  const subtitle = `Updated after ${formatAuditUpdateLabel(savedState?.updated_at)} audit`

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const sb = await initSupabase()
      const payload = {
        user_id: user.id,
        core_offer: draft.core_offer.trim(),
        revenue_streams: parseBusinessStateList(draft.revenue_streams, 'streams'),
        operational_blockers: parseBusinessStateList(draft.operational_blockers, 'blockers'),
        target_customer: draft.target_customer.trim(),
        funnel_stages: parseBusinessStateList(draft.funnel_stages, 'funnel'),
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await sb
        .from('business_state')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single()

      if (error) throw error
      setSavedState(data || payload)
      setEditing(false)
    } catch (error) {
      console.error('[dashboard] business_state save failed:', error?.message ?? error)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setEditing(false)
    setDraft({
      core_offer: savedState?.core_offer || '',
      revenue_streams: displayBusinessStateValue(savedState?.revenue_streams, ', '),
      operational_blockers: displayBusinessStateValue(savedState?.operational_blockers, '; '),
      target_customer: savedState?.target_customer || '',
      funnel_stages: displayBusinessStateValue(savedState?.funnel_stages, ' → '),
    })
  }

  return (
    <div style={styles.businessStateCard}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.businessStateTitle}>What we know</div>
          <div style={styles.businessStateSub}>{subtitle}</div>
        </div>
        {editing ? (
          <div style={styles.businessStateActions}>
            <button type="button" style={styles.businessStateGhostBtn} onClick={cancel} disabled={saving}>Cancel</button>
            <button type="button" style={styles.businessStateSaveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button type="button" style={styles.businessStateEditBtn} onClick={() => setEditing(true)}>
            edit
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.emptyPanel}>Loading business context…</div>
      ) : editing ? (
        <div style={styles.businessStateGrid}>
          <BusinessStateEditor label="Core offer" value={draft.core_offer} onChange={(value) => setDraft((prev) => ({ ...prev, core_offer: value }))} />
          <BusinessStateEditor label="Revenue streams" value={draft.revenue_streams} onChange={(value) => setDraft((prev) => ({ ...prev, revenue_streams: value }))} />
          <BusinessStateEditor label="Operational blockers" value={draft.operational_blockers} onChange={(value) => setDraft((prev) => ({ ...prev, operational_blockers: value }))} />
          <BusinessStateEditor label="Target customer" value={draft.target_customer} onChange={(value) => setDraft((prev) => ({ ...prev, target_customer: value }))} />
          <BusinessStateEditor label="Funnel stages" value={draft.funnel_stages} onChange={(value) => setDraft((prev) => ({ ...prev, funnel_stages: value }))} />
        </div>
      ) : (
        <div style={styles.businessStateGrid}>
          <div>
            <div style={styles.businessStateLabel}>Core offer</div>
            <BusinessStateValue value={savedState?.core_offer} />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Revenue streams</div>
            <BusinessStateValue value={savedState?.revenue_streams} separator=", " />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Operational blockers</div>
            <BusinessStateValue value={savedState?.operational_blockers} separator="; " />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Target customer</div>
            <BusinessStateValue value={savedState?.target_customer} />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Funnel stages</div>
            <BusinessStateValue value={savedState?.funnel_stages} separator=" → " />
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessStateEditor({ label, value, onChange }) {
  return (
    <label style={styles.businessStateEditorShell}>
      <div style={styles.businessStateLabel}>{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        style={styles.businessStateTextarea}
      />
    </label>
  )
}

function PanelCard({ title, right, children }) {
  return (
    <div style={styles.panelCard}>
      <div style={styles.panelHeader}>
        <div style={styles.panelTitle}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

function EmptyPanel({ message }) {
  return <div style={styles.emptyPanel}>{message}</div>
}

function TopButtons({ onDiagnose, onGoal }) {
  return (
    <div style={styles.topbarActions}>
      <button type="button" style={styles.ghostButton} onClick={onDiagnose}>
        diagnose a problem
      </button>
      <button type="button" style={styles.primaryButton} onClick={onGoal}>
        map a goal
      </button>
    </div>
  )
}

const CONNECTOR_LIST = [
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', available: true },
  { id: 'stripe', name: 'Stripe', category: 'Revenue', available: false },
  { id: 'slack', name: 'Slack', category: 'Comms', available: false },
  { id: 'gmail', name: 'Gmail', category: 'Email', available: false },
  { id: 'notion', name: 'Notion', category: 'Docs', available: false },
]

function ConnectorsSection({ user }) {
  const [connectors, setConnectors] = useState({})
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState('')
  const [toast, setToast] = useState('')
  const [preview, setPreview] = useState(null)

  const getSessionToken = async () => {
    const sb = await initSupabase()
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token || ''
  }

  const loadStatus = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const token = await getSessionToken()
      if (!token) return
      const response = await fetch('/api/connect/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json()
      setConnectors(data?.connectors || {})
    } catch {
      setConnectors({})
    } finally {
      setLoading(false)
    }
  }

  const loadHubspotPreview = async () => {
    if (!user?.id) return
    try {
      const token = await getSessionToken()
      if (!token) return
      const response = await fetch('/api/connect/hubspot/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json()
      if (data?.source === 'hubspot') setPreview(data)
      else setPreview(null)
    } catch {
      setPreview(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [user?.id])

  useEffect(() => {
    const hash = window.location.hash || ''
    const [, rawQuery = ''] = hash.split('?')
    if (!rawQuery) return

    const params = new URLSearchParams(rawQuery)
    const connected = params.get('connected')
    const error = params.get('error')
    if (!connected && !error) return

    setToast(connected ? `${connected} connected.` : `Could not connect ${error}.`)
    history.replaceState(history.state, '', '/#connectors')
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (connectors?.hubspot?.connected) {
      loadHubspotPreview()
      return
    }
    setPreview(null)
  }, [connectors?.hubspot?.connected, connectors?.hubspot?.last_synced_at, user?.id])

  const disconnect = async (provider) => {
    if (!user?.id) return
    setDisconnecting(provider)
    try {
      const token = await getSessionToken()
      if (!token) return
      await fetch('/api/connect/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, provider }),
      })
      if (provider === 'hubspot') setPreview(null)
      await loadStatus()
    } finally {
      setDisconnecting('')
    }
  }

  return (
    <PageShell title="Connectors" sub="Connect live systems so audits can reason from verified data, not just self-reported context.">
      {toast && <div style={styles.connectorsToast}>{toast}</div>}
      <div style={styles.connectorsGrid}>
        {CONNECTOR_LIST.map((connector) => {
          const status = connectors?.[connector.id] || {}
          const connected = !!status.connected
          const busy = disconnecting === connector.id

          return (
            <div key={connector.id} style={{ ...styles.connectorCard, opacity: connector.available ? 1 : 0.68 }}>
              <div style={styles.connectorCardTop}>
                <div>
                  <div style={styles.connectorName}>{connector.name}</div>
                  <div style={styles.connectorCategory}>{connector.category}</div>
                </div>
                <span
                  style={{
                    ...styles.connectorBadge,
                    ...(connected
                      ? styles.connectorBadgeConnected
                      : connector.available
                        ? styles.connectorBadgeAdd
                        : styles.connectorBadgeSoon),
                  }}
                >
                  {connected ? 'Connected' : connector.available ? 'Add' : 'Coming soon'}
                </span>
              </div>

              <div style={styles.connectorBodyText}>
                {connector.id === 'hubspot'
                  ? 'Pipeline, contacts, and activity sync into the audit context.'
                  : 'Reserved for the next connector release.'}
              </div>

              {connector.available ? (
                connected ? (
                  <button type="button" style={styles.connectorDisconnectBtn} onClick={() => disconnect(connector.id)} disabled={busy}>
                    {busy ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.connectorConnectBtn}
                    onClick={() => { window.location.href = `/api/connect/hubspot/auth?state=${user.id}` }}
                  >
                    Connect HubSpot
                  </button>
                )
              ) : (
                <div style={styles.connectorSoonText}>Available in a later release.</div>
              )}

              {connector.id === 'hubspot' && connected && preview?.source === 'hubspot' && (
                <div style={styles.connectorPreview}>
                  <div style={styles.connectorPreviewMeta}>
                    Last synced: {formatRelativeTime(status.last_synced_at || preview.fetched_at)}
                  </div>
                  {preview.pipeline && (
                    <div style={styles.connectorPreviewStat}>
                      Open deals: {preview.pipeline.total_open_deals ?? 0}
                      {typeof preview.pipeline.total_open_value === 'number' ? ` · $${preview.pipeline.total_open_value.toLocaleString()}` : ''}
                    </div>
                  )}
                  {!!preview.signals?.length && (
                    <div style={styles.connectorSignals}>
                      {preview.signals.slice(0, 2).map((signal) => (
                        <div key={signal} style={styles.connectorSignalLine}>{signal}</div>
                      ))}
                    </div>
                  )}
                  <button type="button" style={styles.connectorSyncBtn} onClick={loadHubspotPreview}>
                    Sync now
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {loading && <div style={styles.connectorsLoading}>Checking connector status…</div>}
    </PageShell>
  )
}

function AccountSection({ user, profile, onProfileChange, onSignOut }) {
  const email = user?.email || ''
  const [nameVal, setNameVal] = useState('')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConf, setDeleteConf] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const nameRef = useRef(null)
  const phoneRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setNameVal(profile.name || user?.user_metadata?.name || '')
      setPhoneVal(profile.phone || '')
    }
  }, [profile, user])

  useEffect(() => {
    if (nameEditing) nameRef.current?.focus()
  }, [nameEditing])

  useEffect(() => {
    if (phoneEditing) phoneRef.current?.focus()
  }, [phoneEditing])

  async function saveName() {
    const trimmed = nameVal.trim()
    if (!trimmed || trimmed === (profile?.name || user?.user_metadata?.name || '')) {
      setNameEditing(false)
      return
    }
    setNameSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ name: trimmed }).eq('id', user.id)
      onProfileChange({ name: trimmed })
    } catch (error) {
      console.error(error)
    } finally {
      setNameSaving(false)
      setNameEditing(false)
    }
  }

  async function savePhone() {
    const trimmed = phoneVal.trim()
    if (trimmed === (profile?.phone || '')) {
      setPhoneEditing(false)
      return
    }
    setPhoneSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ phone: trimmed }).eq('id', user.id)
      onProfileChange({ phone: trimmed })
    } catch (error) {
      console.error(error)
    } finally {
      setPhoneSaving(false)
      setPhoneEditing(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConf.trim().toLowerCase() !== 'delete') {
      setDeleteError('Type "delete" to confirm.')
      return
    }
    setDeleting(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').delete().eq('id', user.id)
      await sb.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error(error)
      setDeleteError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <PageShell title="Account settings" sub="Manage your profile and preferences.">
      <div style={account.card}>
        <AccountRow
          label="Name"
          editing={nameEditing}
          saving={nameSaving}
          value={nameVal}
          onEdit={() => setNameEditing(true)}
          placeholder="—"
          inputRef={nameRef}
          onChange={setNameVal}
          onBlur={saveName}
          onEscape={() => setNameEditing(false)}
          onEnter={saveName}
        />
        <div style={account.divider} />
        <div style={account.row}>
          <div style={account.label}>Email</div>
          <div style={{ ...account.value, color: G.textSecondary }}>{email}</div>
        </div>
        <div style={account.divider} />
        <AccountRow
          label="Phone number"
          editing={phoneEditing}
          saving={phoneSaving}
          value={phoneVal}
          onEdit={() => setPhoneEditing(true)}
          placeholder="Add phone number"
          inputRef={phoneRef}
          onChange={setPhoneVal}
          onBlur={savePhone}
          onEscape={() => setPhoneEditing(false)}
          onEnter={savePhone}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <span style={{ fontSize: 12, color: G.textFaint }}>Need to leave? </span>
        <button
          type="button"
          style={account.deleteLink}
          onClick={() => {
            setShowDelete(true)
            setDeleteConf('')
            setDeleteError('')
          }}
        >
          Delete account
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button type="button" style={account.signOutBtn} onClick={onSignOut}>
          Sign out
        </button>
      </div>

      {showDelete && (
        <div style={account.overlay} onClick={() => setShowDelete(false)}>
          <div style={account.modal} onClick={(event) => event.stopPropagation()}>
            <div style={account.modalTitle}>Delete your account?</div>
            <p style={account.modalBody}>This permanently deletes your account and all audit data. This cannot be undone.</p>
            <p style={account.modalBody}>Type <strong>delete</strong> to confirm.</p>
            <input
              value={deleteConf}
              onChange={(event) => {
                setDeleteConf(event.target.value)
                setDeleteError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleDeleteAccount()
              }}
              placeholder="delete"
              style={account.input}
              autoFocus
            />
            {deleteError && <p style={{ fontSize: 12, color: G.redText, marginTop: 10 }}>{deleteError}</p>}
            <div style={account.modalActions}>
              <button type="button" style={account.modalCancel} onClick={() => setShowDelete(false)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" style={account.modalDelete} onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function AccountRow({ label, editing, saving, value, onEdit, placeholder, inputRef, onChange, onBlur, onEscape, onEnter }) {
  return (
    <div style={account.row}>
      <div style={account.label}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onEnter()
              if (event.key === 'Escape') onEscape()
            }}
            disabled={saving}
            placeholder={placeholder}
            style={account.input}
          />
          {saving && <span style={{ fontSize: 12, color: G.textFaint }}>Saving…</span>}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={account.value}>{value || <span style={{ color: G.textFaint }}>{placeholder}</span>}</div>
          <button type="button" style={account.editButton} onClick={onEdit}>
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

function AuditStartButtons({ onDiagnose, onGoal }) {
  return <TopButtons onDiagnose={onDiagnose} onGoal={onGoal} />
}

const GOAL_CATEGORIES = ['Revenue', 'Growth', 'Operations', 'Team', 'Exit']

function GoalCaptureModal({ onClose, onStart }) {
  const [goal, setGoal] = useState('')
  const [category, setCategory] = useState('')
  const [timeline, setTimeline] = useState('')
  const [baseline, setBaseline] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!goal.trim()) {
      setError('Tell us your goal first.')
      return
    }
    if (!timeline.trim()) {
      setError('Add a timeline.')
      return
    }
    onStart({
      goal: goal.trim(),
      goalCategory: category,
      goalTimeline: timeline.trim(),
      goalBaseline: baseline.trim(),
    })
  }

  return (
    <div style={gm.overlay} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div style={gm.modal}>
        <button type="button" style={gm.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div style={gm.eyebrow}>Goal mode</div>
        <h2 style={gm.title}>Map a goal</h2>
        <p style={gm.sub}>Define where you want to get to and we&apos;ll identify the gap between here and there.</p>

        <div style={gm.field}>
          <label style={gm.label}>What&apos;s your goal? <span style={{ color: G.accentText }}>*</span></label>
          <input
            style={gm.input}
            value={goal}
            onChange={(event) => { setGoal(event.target.value); setError('') }}
            placeholder='e.g. "Double revenue to $1M ARR", "Reduce churn below 3%"'
            autoFocus
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Category</label>
          <div style={gm.categoryRow}>
            {GOAL_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                style={{ ...gm.categoryPill, ...(category === item ? gm.categoryActive : {}) }}
                onClick={() => setCategory((prev) => prev === item ? '' : item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Timeline <span style={{ color: G.accentText }}>*</span></label>
          <input
            style={gm.input}
            value={timeline}
            onChange={(event) => { setTimeline(event.target.value); setError('') }}
            placeholder='e.g. "by end of Q3 2026", "within 6 months"'
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Where are you now?</label>
          <input
            style={gm.input}
            value={baseline}
            onChange={(event) => setBaseline(event.target.value)}
            placeholder='e.g. "$420K ARR, growing 5% MoM, 8% churn"'
          />
          <p style={gm.hint}>Optional — the more specific, the sharper the gap analysis.</p>
        </div>

        {error && <p style={gm.error}>{error}</p>}

        <button type="button" style={gm.startBtn} onClick={submit}>
          Start gap audit
        </button>
      </div>
    </div>
  )
}

function AuditScopeSetupModal({ user, onClose, onSaved }) {
  const [industry, setIndustry] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!industry) {
      setError('Pick your industry first.')
      return
    }

    setSaving(true)
    try {
      const sb = await initSupabase()
      const { error: updateError } = await sb
        .from('profiles')
        .update({ industry })
        .eq('id', user.id)

      if (updateError) throw updateError
      onSaved({ industry })
    } catch (updateError) {
      console.error('[dashboard] scope setup failed:', updateError?.message ?? updateError)
      setError('Could not save your audit setup. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={gm.overlay} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div style={gm.modal}>
        <button type="button" style={gm.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div style={gm.eyebrow}>Audit setup</div>
        <h2 style={gm.title}>Before we start</h2>
        <p style={gm.sub}>Pick your industry to get started.</p>

        <div style={gm.field}>
          <label style={gm.label}>Industry <span style={{ color: G.accentText }}>*</span></label>
          <div style={gm.categoryRow}>
            {BUSINESS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option}
                style={{ ...gm.categoryPill, ...(industry === option ? gm.categoryActive : {}) }}
                onClick={() => {
                  setIndustry(option)
                  setError('')
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={gm.error}>{error}</p>}

        <button type="button" style={gm.startBtn} onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Start audit'}
        </button>
      </div>
    </div>
  )
}

function OpenIssuesTracker({ report, domains }) {
  const getKey = (domainName) => `tsa_issue_${report.id}_${domainName}`
  const [statuses, setStatuses] = useState(() => {
    const initial = {}
    domains.forEach((domain) => {
      initial[domain.name] = localStorage.getItem(getKey(domain.name)) || 'open'
    })
    return initial
  })

  const cycleStatus = (domainName) => {
    const current = statuses[domainName] || 'open'
    const next = current === 'open' ? 'in_progress' : current === 'in_progress' ? 'resolved' : 'open'
    localStorage.setItem(getKey(domainName), next)
    setStatuses((prev) => ({ ...prev, [domainName]: next }))
  }

  const rows = domains.slice(0, 3).map((domain) => ({
    ...domain,
    issueStatus: statuses[domain.name] || 'open',
  }))

  return (
    <PanelCard title="open issues">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((domain) => (
          <button
            key={domain.name}
            type="button"
            onClick={() => cycleStatus(domain.name)}
            style={styles.issueRow}
          >
            <div style={{ ...styles.issueSeverityBar, background: domainSeverityColor(domain.status) }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={styles.issueTitle}>{domain.name}</div>
              <div style={styles.issueSub}>
                {[domain.status?.replace(/_/g, ' '), new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span style={{ ...styles.statusBadge, ...issueStatusStyle(domain.issueStatus) }}>
              {domain.issueStatus.replace(/_/g, ' ')}
            </span>
          </button>
        ))}
      </div>
    </PanelCard>
  )
}

function issueStatusStyle(status) {
  if (status === 'resolved') return { background: G.greenBg, color: G.greenText }
  if (status === 'in_progress') return { background: G.amberBg, color: G.amberText }
  return { background: G.redBg, color: G.redText }
}

function AuditHistoryRow({ report }) {
  const [open, setOpen] = useState(false)
  const headline = report.headline || report.title || '(untitled)'
  const scope = [report.industry, report.domain].filter(Boolean).join(' / ')
  const mode = report.conversation_mode || 'DIAGNOSTIC'

  return (
    <div style={styles.historyCard}>
      <button type="button" style={styles.historyButton} onClick={() => setOpen((prev) => !prev)}>
        <div style={{ ...styles.modeDot, background: modeDotColor(mode) }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={styles.historyTitle}>{headline}</div>
          <div style={styles.historySub}>{[scope, new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })].filter(Boolean).join(' · ')}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', color: G.textFaint }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={styles.historyExpanded}>
          <DashReportContent content={report.content} />
        </div>
      )}
    </div>
  )
}

function VnkloCTACard({ user, reports }) {
  const [shared, setShared] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (!user?.id || !reports[0]?.id) return
    setSharing(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({
        shared_with_vnklo: true,
        shared_report_id: reports[0].id,
      }).eq('id', user.id)
      setShared(true)
    } catch (error) {
      console.error('[vnklo-cta] share failed:', error?.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div style={styles.ctaCard}>
      <div style={styles.ctaEyebrow}>Ready to fix this?</div>
      <div style={styles.ctaTitle}>Get a free strategy call with VNKLO</div>
      <div style={styles.ctaSub}>Share your audit — an AI consultant will map out exactly what to fix and how.</div>
      {shared ? (
        <div style={{ color: G.accentText, fontSize: 13 }}>Sent. We&apos;ll be in touch within 24h.</div>
      ) : (
        <button type="button" style={styles.ctaButton} onClick={handleShare} disabled={sharing}>
          {sharing ? 'Sharing…' : 'Share report with VNKLO'}
        </button>
      )}
    </div>
  )
}

function ReportSkeletons({ compact = false }) {
  return (
    <>
      <style>{'@keyframes dashSkeletonPulse{0%,100%{opacity:.55}50%{opacity:.22}}'}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              background: G.panel,
              border: `0.5px solid ${G.border}`,
              borderRadius: 10,
              height: compact ? 48 : 58,
              animation: 'dashSkeletonPulse 1.4s ease-in-out infinite',
              animationDelay: `${index * 0.18}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

function EmptyReports({ onStartAudit }) {
  return (
    <div style={styles.emptyReports}>
      <div style={styles.emptyReportsText}>Run your first audit to see your report here.</div>
      <button type="button" style={styles.emptyReportsBtn} onClick={onStartAudit}>
        Start audit
      </button>
    </div>
  )
}

const REPORT_STATUS_COLORS = {
  critical: { bg: G.redBg, color: G.redText },
  needs_work: { bg: G.amberBg, color: G.amberText },
  good: { bg: G.greenBg, color: G.greenText },
}

function DashSectionLabel({ children }) {
  return <p style={reportStyles.sectionLabel}>{children}</p>
}

function DashTextSection({ label, text, italic }) {
  if (!text) return null
  return (
    <div>
      <DashSectionLabel>{label}</DashSectionLabel>
      <p style={{ ...reportStyles.bodyText, fontStyle: italic ? 'italic' : 'normal' }}>{text}</p>
    </div>
  )
}

function DashReportSchemaB({ p }) {
  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Acknowledgment" text={p.acknowledgment} />
      <DashTextSection label="What This Actually Is" text={p.what_this_actually_is} />
      {p.delivery_script && (
        <div>
          <DashSectionLabel>Delivery Script</DashSectionLabel>
          <div style={reportStyles.codeBlock}>{p.delivery_script}</div>
        </div>
      )}
      <DashTextSection label="What To Expect" text={p.what_to_expect} />
      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportSchemaA({ p }) {
  const domains = p.domains ?? []
  const nonAiFixes = p.non_ai_fixes ?? []
  const aiOpportunities = p.ai_opportunities ?? []
  const priorityActions = p.priority_actions ?? []

  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Verdict" text={p.overall_verdict} />

      <div>
        <DashSectionLabel>Domains</DashSectionLabel>
        {domains.length === 0 ? (
          <p style={reportStyles.emptyText}>No domain breakdown available.</p>
        ) : (
          <div style={reportStyles.listStack}>
            {domains.map((domain, index) => {
              const colors = REPORT_STATUS_COLORS[domain.status] ?? { bg: G.surface3, color: G.textSecondary }
              const urgencyColors = domain.urgency === 'immediate'
                ? { bg: G.redBg, color: G.redText }
                : domain.urgency === 'this_quarter'
                  ? { bg: G.amberBg, color: G.amberText }
                  : { bg: G.surface3, color: G.textFaint }
              return (
                <div key={`${domain.name || 'domain'}-${index}`} style={reportStyles.card}>
                  <div style={reportStyles.cardTopRow}>
                    <p style={reportStyles.cardTitle}>{domain.name}</p>
                    {domain.status && <span style={{ ...reportStyles.pill, background: colors.bg, color: colors.color }}>{domain.status.replace(/_/g, ' ')}</span>}
                  </div>
                  {domain.finding && <p style={reportStyles.bodyText}>{domain.finding}</p>}
                  {domain.action && <p style={reportStyles.actionText}><span style={{ fontWeight: 600 }}>→ Action:</span> {domain.action}</p>}
                  {domain.urgency && <span style={{ ...reportStyles.pill, background: urgencyColors.bg, color: urgencyColors.color }}>{domain.urgency}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {nonAiFixes.length > 0 && (
        <div>
          <DashSectionLabel>Non-AI Fixes</DashSectionLabel>
          <div style={reportStyles.listStack}>
            {nonAiFixes.map((item, index) => (
              <div key={index} style={reportStyles.card}>
                {item.issue && <p style={reportStyles.cardTitle}>{item.issue}</p>}
                {item.fix && <p style={reportStyles.bodyText}>{item.fix}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {aiOpportunities.length > 0 && (
        <div>
          <DashSectionLabel>AI Opportunities</DashSectionLabel>
          <div style={reportStyles.listStack}>
            {aiOpportunities.map((item, index) => (
              <div key={index} style={reportStyles.card}>
                {item.area && <p style={reportStyles.cardTitle}>{item.area}</p>}
                {item.why && <p style={reportStyles.bodyText}>{item.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <DashSectionLabel>Priority Actions</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {priorityActions.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>
                {typeof item === 'string' ? item : (item.action ?? item.text ?? JSON.stringify(item))}
              </li>
            ))}
          </ol>
        </div>
      )}

      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportSchemaGoal({ p }) {
  const gap = p.goal_gap_analysis || {}
  const missingCapabilities = p.missing_capabilities || []
  const priorityActions = p.priority_actions || []

  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Verdict" text={p.overall_verdict} />
      <DashTextSection label="Goal" text={gap.goal} />
      <DashTextSection label="Current Position" text={gap.current_position} />
      <DashTextSection label="The Gap" text={gap.gap} />
      <DashTextSection label="Fastest Path" text={gap.fastest_path} />
      <DashTextSection label="Timeline" text={p.timeline_feasibility || gap.realistic_timeline} />

      {missingCapabilities.length > 0 && (
        <div>
          <DashSectionLabel>Missing Capabilities</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {missingCapabilities.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <DashSectionLabel>Priority Actions</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {priorityActions.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>
                {typeof item === 'string' ? item : (item.action ?? item.text ?? JSON.stringify(item))}
              </li>
            ))}
          </ol>
        </div>
      )}

      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportContent({ content }) {
  if (!content) return <p style={reportStyles.emptyText}>No content stored.</p>
  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return <pre style={reportStyles.fallbackBlock}>{content}</pre>
  }
  const mode = parsed.conversation_mode
  if (mode === 'GOAL_GAP') return <DashReportSchemaGoal p={parsed} />
  return (mode === 'EXECUTION_HUMAN' || mode === 'EXECUTION' || mode === 'HUMAN_MOMENT')
    ? <DashReportSchemaB p={parsed} />
    : <DashReportSchemaA p={parsed} />
}

function ReportCard({ report, userId }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(report.status ?? 'unknown')
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (event, nextStatus) => {
    event.stopPropagation()
    if (updating) return
    setUpdating(true)
    try {
      const sb = await initSupabase()
      await sb.from('reports').update({ status: nextStatus }).eq('id', report.id)
      setStatus(nextStatus)
    } catch (error) {
      console.warn('[report-status] update failed:', error.message)
    } finally {
      setUpdating(false)
    }
  }

  const statusPill = {
    unknown: { bg: G.surface3, color: G.textFaint },
    ongoing: { bg: G.amberBg, color: G.amberText },
    resolved: { bg: G.greenBg, color: G.greenText },
  }[status] ?? { bg: G.surface3, color: G.textFaint }

  return (
    <div style={{ ...styles.reportCard, borderColor: open ? G.accent : G.border }}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        style={{ ...styles.reportCardHeader, background: open ? G.surface2 : 'transparent' }}
      >
        <p style={styles.reportCardTitle}>{report.title || '(untitled)'}</p>
        <div style={styles.reportCardActions}>
          <span style={{ ...styles.statusBadge, background: statusPill.bg, color: statusPill.color }}>
            {status === 'unknown' ? 'not followed up' : status}
          </span>
          {status !== 'resolved' && (
            <button type="button" onClick={(event) => updateStatus(event, 'resolved')} disabled={updating} style={styles.reportActionDone}>
              Done
            </button>
          )}
          {status === 'unknown' && (
            <button type="button" onClick={(event) => updateStatus(event, 'ongoing')} disabled={updating} style={styles.reportActionWarn}>
              Still open
            </button>
          )}
          {status === 'resolved' && (
            <button type="button" onClick={(event) => updateStatus(event, 'ongoing')} disabled={updating} style={styles.reportActionGhost}>
              Reopen
            </button>
          )}
          <p style={styles.reportDate}>
            {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
          </p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: G.textFaint, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {open && (
        <div style={styles.reportCardBody}>
          <DashReportContent content={report.content} />
        </div>
      )}
    </div>
  )
}

function ReportList({ reports, userId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reports.map((report) => <ReportCard key={report.id} report={report} userId={userId} />)}
    </div>
  )
}

function LiveBillingCard({ billing, billingLoading, billingError, onOpenPortal, portalLoading }) {
  const nextDate = billing?.current_period_end
    ? new Date(billing.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const card = billing?.card
  const expiry = card ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : null
  const brand = card?.brand ? `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)}` : 'Card'

  return (
    <div style={styles.billingCard}>
      {billingLoading && <div style={styles.billingLoading}>Loading billing details…</div>}
      {billingError && !billingLoading && <div style={styles.billingError}>{billingError}</div>}
      {!billingLoading && !billingError && (
        <div style={styles.billingGrid}>
          <BillingMetric label="Next billing" value={nextDate || '—'} />
          <BillingMetric label="Payment method" value={card ? `${brand} ···· ${card.last4}` : '—'} sub={expiry ? `Expires ${expiry}` : ''} />
          <BillingMetric label="Status" value={billing?.status || 'active'} accent />
          <div style={styles.billingActionCell}>
            <button type="button" onClick={onOpenPortal} disabled={portalLoading} style={styles.billingPortalBtn}>
              {portalLoading ? 'Redirecting…' : 'Update payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BillingMetric({ label, value, sub, accent }) {
  return (
    <div style={styles.billingMetric}>
      <div style={styles.billingLabel}>{label}</div>
      <div style={accent ? styles.billingStatus : styles.billingValue}>{value}</div>
      {sub && <div style={styles.billingSub}>{sub}</div>}
    </div>
  )
}

function TierCard({ tier, currentTier, userId, email }) {
  const [loading, setLoading] = useState(false)
  const current = tier.key === currentTier
  const isUpgrade = (TIER_ORDER[tier.key] ?? 0) > (TIER_ORDER[currentTier] ?? 0)
  const isDowngrade = (TIER_ORDER[tier.key] ?? 0) < (TIER_ORDER[currentTier] ?? 0)

  const handleCheckout = async () => {
    if (!userId || !email) return
    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.key, userId, email }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...styles.tierCard, borderColor: current ? G.accent : G.border, background: current ? G.surface2 : G.surface }}>
      {current && <div style={styles.tierRibbon}>Current plan</div>}
      {tier.popular && !current && <div style={styles.tierRibbonAlt}>Most popular</div>}
      <div style={styles.tierName}>{tier.name}</div>
      <div style={styles.tierPrice}>
        {tier.price}
        <span style={styles.tierPriceUnit}>/mo</span>
      </div>
      <div style={styles.tierDesc}>{tier.desc}</div>
      <ul style={styles.tierFeatures}>
        {tier.features.map((feature) => (
          <li key={feature} style={styles.tierFeatureItem}>
            <span style={styles.tierArrow}>→</span>
            {feature}
          </li>
        ))}
      </ul>
      {current && <div style={styles.activePlan}>Active plan</div>}
      {isUpgrade && (
        <button type="button" onClick={handleCheckout} disabled={loading} style={styles.tierUpgradeBtn}>
          {loading ? 'Redirecting…' : `Upgrade to ${tier.name}`}
        </button>
      )}
      {isDowngrade && (
        <button type="button" onClick={handleCheckout} disabled={loading} style={styles.tierDowngradeBtn}>
          {loading ? 'Redirecting…' : `Downgrade to ${tier.name}`}
        </button>
      )}
    </div>
  )
}

function SidebarButton({ icon, active, onClick, label, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.sidebarButton,
        ...(expanded ? styles.sidebarButtonExpanded : {}),
        ...(active ? styles.sidebarButtonActive : {}),
      }}
      aria-label={label}
      title={label}
    >
      <span style={styles.sidebarIcon}>{icon}</span>
      {expanded && <span style={styles.sidebarLabel}>{label}</span>}
    </button>
  )
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 6.5L8 2L13.5 6.5V13.5H9.75V9.75H6.25V13.5H2.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.5H10.5L13 5V13.5H4V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.5 2.5V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8H11M6 10.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconIntelligence() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="3.5" rx="4.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 3.5V7.75C3.5 8.85 5.51 9.75 8 9.75C10.49 9.75 12.5 8.85 12.5 7.75V3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 7.75V12.5C3.5 13.6 5.51 14.5 8 14.5C10.49 14.5 12.5 13.6 12.5 12.5V7.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconConnectors() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 3.5H6a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5A2.5 2.5 0 1 0 8 5.5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.75V3.25M8 12.75V14.25M12.45 3.55L11.39 4.61M4.61 11.39L3.55 12.45M14.25 8H12.75M3.25 8H1.75M12.45 12.45L11.39 11.39M4.61 4.61L3.55 3.55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: G.black,
    overflow: 'hidden',
  },
  sidebar: {
    width: 52,
    background: G.surface,
    borderRight: `0.5px solid ${G.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
    gap: 4,
    flexShrink: 0,
    transition: 'width 0.18s ease',
    overflow: 'hidden',
  },
  sidebarExpanded: {
    width: 176,
    alignItems: 'stretch',
    padding: '16px 8px',
  },
  sidebarButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: G.textSecondary,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  sidebarButtonExpanded: {
    width: '100%',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  sidebarButtonActive: {
    background: G.accentLight,
    color: G.accentText,
  },
  sidebarIcon: {
    width: 16,
    height: 16,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  sidebarLabel: {
    fontSize: 13,
    color: 'inherit',
    whiteSpace: 'nowrap',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: G.textSecondary,
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: 4,
  },
  avatarButtonExpanded: {
    width: '100%',
    padding: '0 12px',
    justifyContent: 'flex-start',
    gap: 12,
  },
  avatarButtonActive: {
    background: G.accentLight,
    color: G.accentText,
  },
  avatarChip: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: G.surface3,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  avatarChipActive: {
    background: G.surface,
  },
  appFrame: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topbar: {
    height: 48,
    background: G.surface,
    borderBottom: `0.5px solid ${G.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    gap: 16,
    flexShrink: 0,
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minWidth: 0,
  },
  logo: {
    fontSize: 16,
    color: G.text,
    letterSpacing: '-0.04em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  breadcrumb: {
    fontSize: 12,
    color: G.textMuted,
    whiteSpace: 'nowrap',
  },
  topbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  ghostButton: {
    border: `0.5px solid ${G.border2}`,
    background: 'none',
    color: G.textSecondary,
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  primaryButton: {
    background: G.accent,
    color: G.white,
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: 12,
    border: 'none',
    cursor: 'pointer',
  },
  main: {
    background: G.black,
    flex: 1,
    overflowY: 'auto',
    padding: 20,
  },
  pageShell: {
    maxWidth: 1240,
    margin: '0 auto',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 28,
    color: G.text,
    fontWeight: 500,
    letterSpacing: '-0.04em',
    margin: 0,
  },
  pageSub: {
    marginTop: 8,
    fontSize: 13,
    color: G.textSecondary,
  },
  alertBar: {
    background: G.amberBg,
    border: `0.5px solid ${G.amber}`,
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  alertTextWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: G.amberText,
    flexShrink: 0,
  },
  alertText: {
    color: G.amberText,
    fontSize: 12,
  },
  alertButton: {
    background: 'transparent',
    color: G.amberText,
    border: `0.5px solid ${G.amber}`,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    background: G.panel,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: 14,
    minWidth: 0,
  },
  kpiLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  kpiValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 500,
    color: G.text,
  },
  kpiDelta: {
    marginTop: 8,
    fontSize: 11,
  },
  homeColumns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 12,
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  panelCard: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: 14,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  panelMeta: {
    fontSize: 11,
    color: G.textFaint,
  },
  panelToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 12,
  },
  panelToggleRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  panelCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    padding: '0 8px',
    display: 'grid',
    placeItems: 'center',
    background: G.surface,
    color: G.textSecondary,
    fontSize: 11,
  },
  inlineLink: {
    border: 'none',
    background: 'transparent',
    color: G.textSecondary,
    fontSize: 12,
    cursor: 'pointer',
  },
  emptyPanel: {
    fontSize: 12,
    color: G.textSecondary,
    padding: '8px 0',
  },
  issueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: '12px 10px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  issueSeverityBar: {
    width: 4,
    height: 34,
    borderRadius: 999,
    flexShrink: 0,
  },
  issueTitle: {
    fontSize: 13,
    color: G.textSecondary,
  },
  issueSub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  historyCard: {
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  historyButton: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 10px',
    cursor: 'pointer',
    color: 'inherit',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  historyTitle: {
    fontSize: 13,
    color: G.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historySub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 4,
  },
  historyExpanded: {
    borderTop: `0.5px solid ${G.border}`,
    padding: '12px 10px',
  },
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  donutWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    flexShrink: 0,
  },
  donutScore: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    color: G.text,
    fontSize: 18,
  },
  domainBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  domainBarLabel: {
    width: 80,
    fontSize: 11,
    color: G.textMuted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  domainBarTrack: {
    flex: 1,
    height: 3,
    background: G.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  domainBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  domainBarValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 11,
    color: G.textFaint,
  },
  goalTrack: {
    marginTop: 14,
    height: 4,
    background: G.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    background: G.accent,
    borderRadius: 999,
  },
  goalMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
    fontSize: 11,
    color: G.textFaint,
  },
  businessStateCard: {
    background: G.surface2,
    border: `1.5px solid ${G.accent}`,
    borderRadius: 8,
    padding: 14,
  },
  businessStateSub: {
    marginTop: 5,
    fontSize: 12,
    color: G.textSecondary,
  },
  businessStateTitle: {
    fontSize: 15,
    color: G.text,
    letterSpacing: '-0.02em',
  },
  businessStateGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  businessStateLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  businessStateValue: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  businessStateEmpty: {
    fontSize: 13,
    color: G.textFaint,
    fontStyle: 'italic',
    lineHeight: 1.6,
  },
  businessStateAssumed: {
    color: G.textFaint,
    fontStyle: 'italic',
  },
  businessStateEditBtn: {
    border: `0.5px solid ${G.border2}`,
    background: 'transparent',
    color: G.textSecondary,
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  businessStateActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  businessStateGhostBtn: {
    border: `0.5px solid ${G.border2}`,
    background: 'transparent',
    color: G.textSecondary,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  businessStateSaveBtn: {
    border: 'none',
    background: G.accent,
    color: G.white,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  businessStateEditorShell: {
    display: 'flex',
    flexDirection: 'column',
  },
  businessStateTextarea: {
    width: '100%',
    minHeight: 74,
    resize: 'vertical',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: G.text,
    fontSize: 13,
    lineHeight: 1.5,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  scopeSetupGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  scopeSetupPill: {
    fontSize: 12,
    padding: '9px 12px',
    borderRadius: 8,
    border: `0.5px solid ${G.border2}`,
    background: G.surface,
    color: G.textSecondary,
    cursor: 'pointer',
    textAlign: 'left',
  },
  scopeSetupPillActive: {
    background: G.accentLight,
    color: G.accentText,
    borderColor: G.accent,
  },
  scopePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  scopePill: {
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    color: G.textSecondary,
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
  },
  ctaCard: {
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: 16,
  },
  ctaEyebrow: {
    fontSize: 10,
    letterSpacing: '0.08em',
    color: G.textFaint,
    textTransform: 'uppercase',
  },
  ctaTitle: {
    fontSize: 15,
    color: G.text,
    marginTop: 8,
  },
  ctaSub: {
    fontSize: 12,
    color: G.textSecondary,
    marginTop: 6,
    marginBottom: 12,
  },
  ctaButton: {
    width: '100%',
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  emptyReports: {
    border: `1px dashed ${G.border2}`,
    borderRadius: 12,
    padding: '42px 24px',
    textAlign: 'center',
    background: G.surface,
  },
  emptyReportsText: {
    fontSize: 13,
    color: G.textSecondary,
    marginBottom: 16,
  },
  emptyReportsBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 12,
    cursor: 'pointer',
  },
  connectorsToast: {
    marginBottom: 16,
    border: `0.5px solid ${G.border}`,
    background: G.accentLight,
    color: G.accentText,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 13,
  },
  connectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  connectorCard: {
    background: G.panel,
    border: `0.5px solid ${G.border}`,
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  connectorCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  connectorName: {
    fontSize: 16,
    fontWeight: 600,
    color: G.text,
  },
  connectorCategory: {
    marginTop: 4,
    fontSize: 12,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  connectorBadge: {
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  connectorBadgeConnected: {
    background: G.greenBg,
    color: G.greenText,
  },
  connectorBadgeAdd: {
    background: G.accentLight,
    color: G.accentText,
  },
  connectorBadgeSoon: {
    background: G.surface3,
    color: G.textFaint,
  },
  connectorBodyText: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.5,
  },
  connectorConnectBtn: {
    border: 'none',
    borderRadius: 999,
    background: G.accent,
    color: G.white,
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorDisconnectBtn: {
    border: `0.5px solid ${G.border}`,
    borderRadius: 999,
    background: 'transparent',
    color: G.text,
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorSoonText: {
    fontSize: 12,
    color: G.textFaint,
  },
  connectorPreview: {
    borderTop: `0.5px solid ${G.border}`,
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  connectorPreviewMeta: {
    fontSize: 12,
    color: G.textFaint,
  },
  connectorPreviewStat: {
    fontSize: 13,
    color: G.textSecondary,
  },
  connectorSignals: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  connectorSignalLine: {
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.45,
  },
  connectorSyncBtn: {
    alignSelf: 'flex-start',
    border: `0.5px solid ${G.border}`,
    borderRadius: 999,
    background: G.surface2,
    color: G.text,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorsLoading: {
    marginTop: 14,
    fontSize: 12,
    color: G.textFaint,
  },
  reportCard: {
    background: G.surface2,
    border: `1px solid ${G.border}`,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reportCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '13px 16px',
    cursor: 'pointer',
  },
  reportCardTitle: {
    flex: 1,
    minWidth: 0,
    color: G.text,
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reportCardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  reportActionDone: {
    fontSize: 11,
    color: G.accentText,
    background: G.accentLight,
    border: 'none',
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportActionWarn: {
    fontSize: 11,
    color: G.amberText,
    background: G.amberBg,
    border: 'none',
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportActionGhost: {
    fontSize: 11,
    color: G.textSecondary,
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportDate: {
    fontSize: 11,
    color: G.textFaint,
  },
  reportCardBody: {
    padding: '14px 16px',
    borderTop: `0.5px solid ${G.border}`,
  },
  billingCard: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  billingLoading: {
    padding: '18px 22px',
    fontSize: 13,
    color: G.textSecondary,
  },
  billingError: {
    padding: '14px 22px',
    fontSize: 13,
    color: G.redText,
    background: G.redBg,
  },
  billingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'stretch',
  },
  billingMetric: {
    padding: '18px 22px',
    borderRight: `0.5px solid ${G.border}`,
  },
  billingActionCell: {
    padding: '18px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: G.textFaint,
    marginBottom: 6,
  },
  billingValue: {
    fontSize: 14,
    color: G.text,
  },
  billingStatus: {
    display: 'inline-block',
    background: G.greenBg,
    color: G.greenText,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
  },
  billingSub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 4,
  },
  billingPortalBtn: {
    background: 'transparent',
    color: G.accentText,
    border: `0.5px solid ${G.accent}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
  },
  tierCard: {
    position: 'relative',
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 360,
  },
  tierRibbon: {
    position: 'absolute',
    top: -11,
    left: 16,
    background: G.accent,
    color: G.white,
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tierRibbonAlt: {
    position: 'absolute',
    top: -11,
    right: 16,
    background: G.surface3,
    color: G.textSecondary,
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tierName: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: G.textFaint,
  },
  tierPrice: {
    marginTop: 6,
    fontSize: 28,
    color: G.text,
  },
  tierPriceUnit: {
    fontSize: 13,
    color: G.textFaint,
    marginLeft: 2,
  },
  tierDesc: {
    marginTop: 10,
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  tierFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '16px 0 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  tierFeatureItem: {
    fontSize: 12,
    color: G.textSecondary,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 7,
  },
  tierArrow: {
    color: G.accentText,
  },
  activePlan: {
    background: G.accentLight,
    color: G.accentText,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    textAlign: 'center',
  },
  tierUpgradeBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  tierDowngradeBtn: {
    background: 'transparent',
    color: G.textSecondary,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
}

const account = {
  card: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    padding: '4px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 22px',
  },
  divider: {
    height: 1,
    background: G.border,
    margin: '0 22px',
  },
  label: {
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    width: 120,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: G.text,
    flex: 1,
  },
  editButton: {
    background: 'transparent',
    border: 'none',
    color: G.accentText,
    fontSize: 12,
    cursor: 'pointer',
  },
  input: {
    flex: 1,
    width: '100%',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '9px 11px',
    color: G.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  deleteLink: {
    background: 'transparent',
    border: 'none',
    color: G.redText,
    textDecoration: 'underline',
    fontSize: 12,
    cursor: 'pointer',
  },
  signOutBtn: {
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    color: G.textSecondary,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: G.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: 380,
    maxWidth: '90vw',
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 14,
    padding: '26px 24px 22px',
    boxShadow: `0 24px 60px ${G.overlaySoft}`,
  },
  modalTitle: {
    fontSize: 16,
    color: G.text,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  modalCancel: {
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    color: G.textSecondary,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  modalDelete: {
    background: G.red,
    border: 'none',
    color: G.white,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
}

const gm = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    background: G.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 16,
    padding: '2rem',
    width: '100%',
    maxWidth: 480,
    position: 'relative',
    boxShadow: `0 24px 60px ${G.overlaySoft}`,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'transparent',
    border: 'none',
    color: G.textFaint,
    fontSize: 14,
    cursor: 'pointer',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: G.accentText,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    color: G.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  field: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: G.text,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    color: G.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 5,
  },
  categoryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    fontSize: 12,
    padding: '5px 12px',
    borderRadius: 999,
    border: `0.5px solid ${G.border2}`,
    background: G.surface,
    color: G.textSecondary,
    cursor: 'pointer',
  },
  categoryActive: {
    background: G.accentLight,
    color: G.accentText,
    borderColor: G.accent,
  },
  startBtn: {
    width: '100%',
    padding: 13,
    background: G.accent,
    color: G.white,
    fontSize: 14,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    fontSize: 12,
    color: G.redText,
    marginBottom: 8,
  },
}

const reportStyles = {
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headline: {
    fontSize: 16,
    color: G.text,
    lineHeight: 1.45,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.65,
  },
  actionText: {
    marginTop: 7,
    fontSize: 13,
    color: G.text,
    lineHeight: 1.6,
  },
  emptyText: {
    fontSize: 13,
    color: G.textFaint,
    fontStyle: 'italic',
  },
  listStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    background: G.surface,
    border: `1px solid ${G.border}`,
    borderRadius: 8,
    padding: '12px 14px',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    color: G.text,
    fontWeight: 700,
  },
  pill: {
    borderRadius: 999,
    padding: '2px 9px',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  priorityList: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  priorityItem: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  codeBlock: {
    background: G.black,
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 13,
    color: G.text,
    lineHeight: 1.7,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  fallbackBlock: {
    fontSize: 12,
    color: G.textSecondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.6,
  },
}
