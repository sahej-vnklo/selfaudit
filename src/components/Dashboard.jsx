import React, { useState, useEffect, useRef } from 'react'
import { supabase, initSupabase } from '../lib/supabase.js'

// ─── Design tokens ────────────────────────────────────────────────────────────

const G = {
  green:        '#1D9E75',
  greenLight:   '#E1F5EE',
  greenDark:    '#0F6E56',
  blue:         '#185FA5',
  blueLight:    '#E6F1FB',
  purple:       '#534AB7',
  purpleLight:  '#EEEDFE',
  bg:           '#F5F4F0',
  metricBg:     '#EDECE8',
  white:        '#FFFFFF',
  border:       '#E5E3DC',
  ink:          '#1A1A1A',
  inkMuted:     '#6B6B6B',
  inkFaint:     '#9A9A9A',
}

// ─── Domain map (Business scope card) ─────────────────────────────────────────

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

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_BADGE = {
  essential: { bg: '#E1F5EE', color: '#0F6E56', label: 'Essential' },
  business:  { bg: '#E6F1FB', color: '#185FA5', label: 'Business'  },
  portfolio: { bg: '#EEEDFE', color: '#534AB7', label: 'Portfolio' },
  free:      { bg: '#E1F5EE', color: '#0F6E56', label: 'Essential' }, // legacy
  paid:      { bg: '#E6F1FB', color: '#185FA5', label: 'Business'  }, // legacy
}

const TIERS = [
  {
    key: 'essential', name: 'Essential', price: '$49',
    desc: 'One domain. Unlimited audits. Your dedicated department head.',
    features: ['1 industry, 1 domain', 'Unlimited audits on that domain', 'Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'Email delivery'],
  },
  {
    key: 'business', name: 'Business', price: '$99', popular: true,
    desc: 'Every function of your business, fully audited. No blind spots.',
    features: ['Everything in Essential', 'All domains for your industry', 'AI opportunity breakdown', 'Re-audit anytime — track progress'],
  },
  {
    key: 'portfolio', name: 'Portfolio', price: '$299',
    desc: 'Every industry. Every domain. Built for those who operate at scale.',
    features: ['Everything in Business', 'All industries & domains', 'Multiple businesses', 'First access to new features', 'Priority Vnklo AI access'],
  },
]

const TIER_ORDER = { essential: 0, business: 1, portfolio: 2, free: 0, paid: 1 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Normalize legacy tier strings so all display + logic is consistent
function normalizeTier(raw) {
  if (raw === 'paid')  return 'business'
  if (raw === 'free')  return 'essential'
  if (raw === 'business' || raw === 'portfolio') return raw
  return 'essential'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h <= 11) return 'Good morning'
  if (h >= 12 && h <= 16) return 'Good afternoon'
  if (h >= 17 && h <= 21) return 'Good evening'
  return 'Hey'
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M7.5 1.5L1.5 6.5V13.5H5.5V9.5H9.5V13.5H13.5V6.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)

const IconReports = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="2.5" y="1.5" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 5.5H10M5 8H10M5 10.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconBilling = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="1.5" y="3.5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 6.5H13.5" stroke="currentColor" strokeWidth="1.2"/>
    <rect x="3.5" y="8.5" width="3" height="1.5" rx="0.5" fill="currentColor"/>
  </svg>
)

const IconAccount = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2 13C2 10.24 4.46 8 7.5 8C10.54 8 13 10.24 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconSignOut = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M5 2H2.5C1.95 2 1.5 2.45 1.5 3V10C1.5 10.55 1.95 11 2.5 11H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M8.5 9L11.5 6.5L8.5 4M4.5 6.5H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─── Main component ───────────────────────────────────────────────────────────

export default function Dashboard({ user, onStartAudit, onSignOut }) {
  const [profile,        setProfile]        = useState(null)
  const [reports,        setReports]        = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [billing,        setBilling]        = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError,   setBillingError]   = useState('')
  const [portalLoading,  setPortalLoading]  = useState(false)
  const [section,        setSection]        = useState(() => {
    const h = window.location.hash.replace(/^#/, '')
    return ['home', 'reports', 'billing', 'account'].includes(h) ? h : 'home'
  })
  const [isCollapsed,    setIsCollapsed]    = useState(false)

  const SECTIONS = ['home', 'reports', 'billing', 'account']

  // Keep browser history in sync so back/forward navigates between sections
  const navigateSection = (s) => {
    history.pushState({ section: s }, '', `#${s}`)
    setSection(s)
  }

  useEffect(() => {
    // Stamp the initial history entry so popstate has a state object when
    // the user navigates back to the dashboard from a section.
    history.replaceState({ section: 'home' }, '', '#dashboard')

    const onPopState = (e) => {
      // Prefer the state object; fall back to reading the hash directly
      const fromState = e.state?.section
      const fromHash  = window.location.hash.replace(/^#/, '')
      const s = (fromState && SECTIONS.includes(fromState))
        ? fromState
        : (SECTIONS.includes(fromHash) ? fromHash : 'home')
      setSection(s)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const name     = user?.user_metadata?.name?.trim() || ''
  const email    = user?.email || ''
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (email[0] || '?').toUpperCase()

  useEffect(() => {
    if (!user) return
    let cancelled = false

    ;(async () => {
      try {
        // user prop is set by App.jsx only when session exists — skip getSession()
        // to avoid Supabase auth-lock contention causing a false null return
        const sb = await initSupabase()
        if (cancelled) return

        const { data, error } = await sb
          .from('profiles')
          .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id')
          .eq('id', user.id)
          .single()

        if (cancelled) return
        if (error) {
          console.error('[dashboard] profile fetch error:', error.message)
          return
        }
        if (data) {
          console.log('[dashboard] profile loaded:', { tier: data.tier, industry: data.industry, domain: data.domain })
          setProfile(data)
        } else {
          // RLS may not have resolved auth.uid() yet — retry once after a short delay
          await new Promise(r => setTimeout(r, 800))
          const retry = await sb
            .from('profiles')
            .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id')
            .eq('id', user.id)
            .single()
          if (!cancelled && retry.data) {
            console.log('[dashboard] profile loaded (retry):', { tier: retry.data.tier })
            setProfile(retry.data)
          }
        }

        // Fetch reports after profile resolves
        const { data: rData } = await sb
          .from('reports')
          .select('id, title, content, headline, industry, domain, conversation_mode, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        if (!cancelled) setReports(rData ?? [])
      } catch (err) {
        console.error('[dashboard] profile fetch threw:', err?.message ?? err)
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [user])

  // Fetch live billing details from Stripe when the billing section is opened
  useEffect(() => {
    if (section !== 'billing') return
    if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) return
    if (billing) return  // already loaded
    setBillingLoading(true)
    setBillingError('')
    ;(async () => {
      try {
        const sb = await initSupabase()
        const { data, error } = await sb.functions.invoke('get-billing-details', {
          body: {
            customerId:     profile.stripe_customer_id,
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
  }, [section, profile?.stripe_customer_id, profile?.stripe_subscription_id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const [goalModal, setGoalModal] = useState(false)

  const baseAuditInfo = () => ({
    name:     user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email:    user?.email || '',
    phone:    '',
    context:  profile?.context  || '',
    userId:   user?.id          || null,
    tier:     profile?.tier     || null,
    industry: profile?.industry || null,
    domain:   profile?.domain   || null,
  })

  const startAudit = () => onStartAudit(baseAuditInfo())

  const startGoalAudit = (goalData) => {
    onStartAudit({ ...baseAuditInfo(), goalMode: true, ...goalData })
  }

  const tier     = normalizeTier(profile?.tier)
  const industry = profile?.industry || null
  const domain   = profile?.domain   || null
  const badge    = TIER_BADGE[tier]  || TIER_BADGE.essential

  return (
    <div style={s.shell}>

      {goalModal && (
        <GoalCaptureModal
          onClose={() => setGoalModal(false)}
          onStart={startGoalAudit}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside style={{ ...s.sidebar, width: isCollapsed ? 56 : 240 }}>

        {/* Logo + collapse toggle */}
        <div style={{ ...s.logoRow, justifyContent: 'space-between', alignItems: 'center' }}>
          {!isCollapsed && (
            <div style={s.logo} onClick={() => navigateSection('home')}>
              self<span style={{ color: G.green }}>audit</span>
            </div>
          )}
          <CollapseBtn isCollapsed={isCollapsed} onClick={() => setIsCollapsed(c => !c)} />
        </div>

        {/* Primary nav */}
        <nav style={s.nav}>
          <NavItem icon={<IconHome />}    label="Home"    active={section === 'home'}    collapsed={isCollapsed} onClick={() => navigateSection('home')} />
          <NavItem icon={<IconReports />} label="Reports" active={section === 'reports'} collapsed={isCollapsed} onClick={() => navigateSection('reports')} />
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings nav */}
        <div style={s.settingsSection}>
          {!isCollapsed && <div style={s.settingsLabel}>Settings</div>}
          <NavItem icon={<IconBilling />} label="Billing" active={section === 'billing'} collapsed={isCollapsed} onClick={() => navigateSection('billing')} />
          <NavItem icon={<IconAccount />} label="Account" active={section === 'account'} collapsed={isCollapsed} onClick={() => navigateSection('account')} />
        </div>

        {/* User card */}
        <div style={s.userCard}>
          <div style={s.avatar}>{initials}</div>
          {!isCollapsed && (
            <div style={s.userInfo}>
              <div style={s.userName}>{name || email}</div>
              <span style={{ ...s.tierBadge, background: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button style={s.signOut} onClick={onSignOut}>
          <IconSignOut />
          {!isCollapsed && 'Sign out'}
        </button>

      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div style={s.main}>

        {section === 'home' && (
          <HomeSection
            user={user}
            name={name}
            tier={tier}
            industry={industry}
            domain={domain}
            badge={badge}
            context={profile?.context || ''}
            reportsLoading={reportsLoading}
            reports={reports}
            onStartAudit={startAudit}
            onStartGoalAudit={() => setGoalModal(true)}
          />
        )}

        {section === 'reports' && (
          <div style={s.content}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageTitle}>Reports</h1>
                <p style={s.pageSub}>Your saved audit reports.</p>
              </div>
              <AuditStartButtons onDiagnose={startAudit} onGoal={() => setGoalModal(true)} />
            </div>
            {reportsLoading
              ? <ReportSkeletons />
              : reports.length > 0
                ? <ReportList reports={reports} />
                : <EmptyReports onStartAudit={startAudit} />
            }
          </div>
        )}

        {section === 'billing' && (
          <div style={{ ...s.content, maxWidth: 960 }}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageTitle}>Subscription</h1>
                <p style={s.pageSub}>Your current plan is highlighted. Upgrade or downgrade any time.</p>
              </div>
            </div>

            {/* Live billing details for paid tiers */}
            {(tier === 'business' || tier === 'portfolio') && (
              <LiveBillingCard
                billing={billing}
                billingLoading={billingLoading}
                billingError={billingError}
                onOpenPortal={openPortal}
                portalLoading={portalLoading}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
              {TIERS.map(t => (
                <TierCard key={t.key} tier={t} currentTier={tier} userId={user?.id} email={user?.email} />
              ))}
            </div>
          </div>
        )}

        {section === 'account' && (
          <AccountSection
            user={user}
            profile={profile}
            onProfileChange={(updated) => setProfile(p => ({ ...p, ...updated }))}
            onSignOut={onSignOut}
          />
        )}

      </div>
    </div>
  )
}

// ─── Account section ──────────────────────────────────────────────────────────

function AccountSection({ user, profile, onProfileChange, onSignOut }) {
  const email = user?.email || ''

  // ── Name ──────────────────────────────────────────────────────────────────
  const [nameVal,     setNameVal]     = useState('')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameSaving,  setNameSaving]  = useState(false)
  const nameRef = useRef(null)

  // ── Phone ─────────────────────────────────────────────────────────────────
  const [phoneVal,     setPhoneVal]     = useState('')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [phoneSaving,  setPhoneSaving]  = useState(false)
  const phoneRef = useRef(null)

  // ── Delete modal ──────────────────────────────────────────────────────────
  const [showDelete,   setShowDelete]   = useState(false)
  const [deleteConf,   setDeleteConf]   = useState('')
  const [deleteError,  setDeleteError]  = useState('')
  const [deleting,     setDeleting]     = useState(false)

  // Sync from profile once loaded
  useEffect(() => {
    if (profile) {
      setNameVal(profile.name || user?.user_metadata?.name || '')
      setPhoneVal(profile.phone || '')
    }
  }, [profile, user])

  // Focus inputs when editing starts
  useEffect(() => { if (nameEditing)  nameRef.current?.focus()  }, [nameEditing])
  useEffect(() => { if (phoneEditing) phoneRef.current?.focus() }, [phoneEditing])

  async function saveName() {
    const trimmed = nameVal.trim()
    if (!trimmed || trimmed === (profile?.name || user?.user_metadata?.name || '')) {
      setNameEditing(false); return
    }
    setNameSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ name: trimmed }).eq('id', user.id)
      onProfileChange({ name: trimmed })
    } catch(e) { console.error(e) }
    finally { setNameSaving(false); setNameEditing(false) }
  }

  async function savePhone() {
    const trimmed = phoneVal.trim()
    if (trimmed === (profile?.phone || '')) { setPhoneEditing(false); return }
    setPhoneSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ phone: trimmed }).eq('id', user.id)
      onProfileChange({ phone: trimmed })
    } catch(e) { console.error(e) }
    finally { setPhoneSaving(false); setPhoneEditing(false) }
  }

  async function handleDeleteAccount() {
    if (deleteConf.trim().toLowerCase() !== 'delete') {
      setDeleteError('Type "delete" to confirm.'); return
    }
    setDeleting(true)
    try {
      const sb = await initSupabase()
      // Delete profile row (cascade will handle auth.users via admin or trigger)
      await sb.from('profiles').delete().eq('id', user.id)
      await sb.auth.signOut()
      window.location.href = '/'
    } catch(e) {
      console.error(e)
      setDeleteError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div style={s.content}>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Account settings</h1>
          <p style={s.pageSub}>Manage your profile and preferences.</p>
        </div>
      </div>

      {/* ── 1. Profile card ─────────────────────────────────────────────── */}
      <div style={acct.card}>

        {/* NAME */}
        <div style={acct.row}>
          <div style={acct.fieldLabel}>Name</div>
          {nameEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <input
                ref={nameRef}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setNameEditing(false) }}
                disabled={nameSaving}
                style={acct.input}
              />
              {nameSaving && <span style={acct.savingText}>Saving…</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={acct.fieldValue}>{nameVal || <span style={{ color: G.inkFaint }}>—</span>}</div>
              <button style={acct.editBtn} onClick={() => setNameEditing(true)}>Edit</button>
            </div>
          )}
        </div>

        <div style={acct.divider} />

        {/* EMAIL */}
        <div style={acct.row}>
          <div style={acct.fieldLabel}>Email</div>
          <div style={{ ...acct.fieldValue, color: G.inkMuted }}>{email}</div>
        </div>

        <div style={acct.divider} />

        {/* PHONE */}
        <div style={acct.row}>
          <div style={acct.fieldLabel}>Phone number</div>
          {phoneEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <input
                ref={phoneRef}
                value={phoneVal}
                onChange={e => setPhoneVal(e.target.value)}
                onBlur={savePhone}
                onKeyDown={e => { if (e.key === 'Enter') savePhone(); if (e.key === 'Escape') setPhoneEditing(false) }}
                disabled={phoneSaving}
                placeholder="Add phone number"
                style={acct.input}
              />
              {phoneSaving && <span style={acct.savingText}>Saving…</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={acct.fieldValue}>
                {phoneVal || <span style={{ color: G.inkFaint }}>Add phone number</span>}
              </div>
              <button style={acct.editBtn} onClick={() => setPhoneEditing(true)}>Edit</button>
            </div>
          )}
        </div>

      </div>

      {/* ── 2. Developer Tools (admin only) ────────────────────────────── */}
      {email === 'sahej@vnklo.com' && (
        <DevToolsCard user={user} profile={profile} onProfileChange={onProfileChange} />
      )}

      {/* ── 3. Delete account ───────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <span style={acct.deleteNudge}>Want to delete your account? </span>
        <button style={acct.deleteLink} onClick={() => { setShowDelete(true); setDeleteConf(''); setDeleteError('') }}>
          Delete account
        </button>
      </div>

      {/* ── Confirmation modal ──────────────────────────────────────────── */}
      {showDelete && (
        <div style={acct.modalOverlay} onClick={() => setShowDelete(false)}>
          <div style={acct.modal} onClick={e => e.stopPropagation()}>
            <div style={acct.modalTitle}>Delete your account?</div>
            <p style={acct.modalBody}>
              This permanently deletes your account and all audit data. This cannot be undone.
            </p>
            <p style={acct.modalBody}>
              Type <strong>delete</strong> to confirm.
            </p>
            <input
              value={deleteConf}
              onChange={e => { setDeleteConf(e.target.value); setDeleteError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleDeleteAccount() }}
              placeholder="delete"
              style={{ ...acct.input, marginBottom: 8 }}
              autoFocus
            />
            {deleteError && <p style={{ fontSize: 12, color: '#C0392B', margin: '0 0 10px' }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={acct.modalCancel} onClick={() => setShowDelete(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                style={{ ...acct.modalDelete, opacity: deleting ? 0.6 : 1 }}
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Account section styles ────────────────────────────────────────────────────

const acct = {
  card: {
    background: G.white,
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    padding: '4px 0',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '14px 22px',
  },
  divider: {
    height: '0.5px', background: G.border,
    margin: '0 22px',
  },
  fieldLabel: {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.5px', color: G.inkFaint,
    width: 120, flexShrink: 0,
  },
  fieldValue: {
    fontSize: 14, color: G.ink, fontWeight: 500, flex: 1,
  },
  editBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: G.green, fontWeight: 500, padding: 0,
    flexShrink: 0,
  },
  input: {
    flex: 1, fontSize: 14, color: G.ink, fontWeight: 500,
    border: `0.5px solid ${G.border}`, borderRadius: 8,
    padding: '7px 11px', background: G.bg,
    outline: 'none', fontFamily: 'inherit',
    width: '100%',
  },
  savingText: { fontSize: 12, color: G.inkFaint, flexShrink: 0 },
  contextPad: { padding: '14px 22px' },
  textarea: {
    width: '100%', height: 120, resize: 'none', fontSize: 13,
    color: G.ink, lineHeight: 1.6,
    border: `0.5px solid ${G.border}`, borderRadius: 8,
    padding: '10px 12px', background: G.white,
    outline: 'none', fontFamily: 'inherit',
    marginTop: 10, boxSizing: 'border-box',
  },
  saveBtn: {
    background: G.green, color: 'white',
    fontSize: 12, fontWeight: 500, border: 'none',
    padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
    flexShrink: 0,
  },
  deleteNudge: { fontSize: 12, color: G.inkFaint },
  deleteLink: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: '#C0392B', fontWeight: 500, padding: 0,
    textDecoration: 'underline',
  },
  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: G.white, borderRadius: 14,
    padding: '28px 28px 24px', width: 380, maxWidth: '90vw',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  },
  modalTitle: { fontSize: 16, fontWeight: 600, color: G.ink, marginBottom: 10 },
  modalBody:  { fontSize: 13, color: G.inkMuted, lineHeight: 1.6, margin: '0 0 10px' },
  modalCancel: {
    background: 'none', border: `0.5px solid ${G.border}`,
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: G.inkMuted, cursor: 'pointer', padding: '8px 16px',
  },
  modalDelete: {
    background: '#C0392B', color: 'white',
    border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '8px 16px',
  },
}

// ─── Goal Mode components ─────────────────────────────────────────────────────

function AuditStartButtons({ onDiagnose, onGoal }) {
  return (
    <div style={gm.btnRow}>
      <button style={gm.diagnoseBtn} onClick={onDiagnose}>Diagnose a problem</button>
      <button style={gm.goalBtn}     onClick={onGoal}>Map a goal →</button>
    </div>
  )
}

const GOAL_CATEGORIES = ['Revenue', 'Growth', 'Operations', 'Team', 'Exit']

function GoalCaptureModal({ onClose, onStart }) {
  const [goal,         setGoal]         = useState('')
  const [category,     setCategory]     = useState('')
  const [timeline,     setTimeline]     = useState('')
  const [baseline,     setBaseline]     = useState('')
  const [error,        setError]        = useState('')

  const submit = () => {
    if (!goal.trim()) { setError('Tell us your goal first.'); return }
    if (!timeline.trim()) { setError('Add a timeline.'); return }
    onStart({
      goal:          goal.trim(),
      goalCategory:  category,
      goalTimeline:  timeline.trim(),
      goalBaseline:  baseline.trim(),
    })
  }

  return (
    <div style={gm.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={gm.modal}>
        <button style={gm.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div style={gm.modalEyebrow}>Goal Mode</div>
        <h2 style={gm.modalTitle}>Map a goal</h2>
        <p style={gm.modalSub}>Define where you want to get to and we'll identify the gap between here and there.</p>

        <div style={gm.field}>
          <label style={gm.label}>What's your goal? <span style={{ color: G.green }}>*</span></label>
          <input
            style={gm.input}
            value={goal}
            onChange={e => { setGoal(e.target.value); setError('') }}
            placeholder='e.g. "Double revenue to $1M ARR", "Reduce churn below 3%"'
            autoFocus
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Category</label>
          <div style={gm.categoryRow}>
            {GOAL_CATEGORIES.map(c => (
              <button
                key={c}
                style={{ ...gm.categoryPill, ...(category === c ? gm.categoryActive : {}) }}
                onClick={() => setCategory(cat => cat === c ? '' : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Timeline <span style={{ color: G.green }}>*</span></label>
          <input
            style={gm.input}
            value={timeline}
            onChange={e => { setTimeline(e.target.value); setError('') }}
            placeholder='e.g. "by end of Q3 2025", "within 6 months"'
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Where are you now?</label>
          <input
            style={gm.input}
            value={baseline}
            onChange={e => setBaseline(e.target.value)}
            placeholder='e.g. "$420K ARR, growing 5% MoM, 8% churn"'
          />
          <p style={gm.hint}>Optional — the more specific, the sharper the gap analysis.</p>
        </div>

        {error && <p style={gm.errorText}>{error}</p>}

        <button style={gm.startBtn} onClick={submit}>
          Start gap audit →
        </button>
      </div>
    </div>
  )
}

const gm = {
  btnRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  diagnoseBtn: {
    fontSize: 13, fontWeight: 500, padding: '9px 16px',
    borderRadius: 8, border: `1px solid ${G.border}`,
    background: G.white, color: G.ink, cursor: 'pointer',
    whiteSpace: 'nowrap', transition: 'border-color 0.15s',
  },
  goalBtn: {
    background: G.green, color: 'white',
    fontSize: 13, fontWeight: 500, padding: '9px 16px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    flexShrink: 0, whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },
  overlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: G.white, borderRadius: 16, padding: '2rem',
    width: '100%', maxWidth: 480, position: 'relative',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    maxHeight: '90vh', overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 14, color: G.inkFaint, padding: 4, lineHeight: 1,
  },
  modalEyebrow: {
    fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase',
    color: G.green, marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20, fontWeight: 500, color: G.ink,
    margin: '0 0 6px', letterSpacing: '-0.3px',
  },
  modalSub: {
    fontSize: 13, color: G.inkMuted, lineHeight: 1.6,
    margin: '0 0 24px',
  },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: G.ink, marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px',
    border: `1px solid ${G.border}`, borderRadius: 8,
    fontSize: 14, color: G.ink, background: G.white,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  hint: { fontSize: 11, color: G.inkFaint, marginTop: 4 },
  categoryRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  categoryPill: {
    fontSize: 12, padding: '5px 12px', borderRadius: 20,
    border: `1px solid ${G.border}`, background: G.white,
    color: G.inkMuted, cursor: 'pointer', transition: 'all 0.15s',
  },
  categoryActive: {
    background: G.ink, color: G.white, borderColor: G.ink,
  },
  startBtn: {
    width: '100%', padding: 13, background: G.green, color: 'white',
    fontSize: 14, fontWeight: 500, borderRadius: 8,
    border: 'none', cursor: 'pointer', marginTop: 8,
  },
  errorText: { fontSize: 12, color: '#A32D2D', marginBottom: 8 },
}

// ─── Home section helpers ─────────────────────────────────────────────────────

function parseReportContent(content) {
  if (!content) return null
  try { return typeof content === 'string' ? JSON.parse(content) : content } catch { return null }
}

function computeHealthScore(domains) {
  if (!domains || domains.length === 0) return 0
  const sum = domains.reduce((acc, d) => {
    if (d.status === 'critical')   return acc + 30
    if (d.status === 'needs_work') return acc + 60
    return acc + 85
  }, 0)
  return Math.round(sum / domains.length)
}

// ─── Home section ─────────────────────────────────────────────────────────────

function HomeSection({ user, name, tier, industry, domain, badge, context, reportsLoading, reports, onStartAudit, onStartGoalAudit }) {
  const [dismissedBanner, setDismissedBanner] = useState(false)
  const issuesRef = useRef(null)

  const latestReport  = reports[0] ?? null
  const latestContent = latestReport ? parseReportContent(latestReport.content) : null
  const latestDomains = latestContent?.domains ?? []

  const showBanner = reports.length > 0 && !dismissedBanner && latestReport &&
    (Date.now() - new Date(latestReport.created_at).getTime()) > 24 * 60 * 60 * 1000

  return (
    <div style={s.content}>
      {/* Re-engagement banner */}
      {showBanner && (
        <ReEngagementBanner
          report={latestReport}
          domains={latestDomains}
          onDismiss={() => setDismissedBanner(true)}
          onUpdateStatus={() => issuesRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
      )}

      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>{getGreeting()}{name ? `, ${name}` : ''}.</h1>
          <p style={s.pageSub}>Your audits and reports live here.</p>
        </div>
        <AuditStartButtons onDiagnose={onStartAudit} onGoal={onStartGoalAudit} />
      </div>

      {/* Metric cards */}
      <div style={s.metricsGrid}>
        <MetricCard label="Audits run" value="0" />
        <MetricCard label="Last audit" value="—" />
        <MetricCard
          label="Plan"
          value={badge.label}
          valueColor={badge.color}
          sub={tier !== 'portfolio'
            ? <button style={s.upgradeLink} onClick={() => {}}>Upgrade →</button>
            : null}
        />
      </div>

      {/* Business Health Score Card */}
      {latestDomains.length > 0 && (
        <BusinessHealthScoreCard
          reports={reports}
          latestDomains={latestDomains}
          onStartAudit={onStartAudit}
        />
      )}

      {/* Open Issues Tracker */}
      {latestDomains.length > 0 && (
        <div ref={issuesRef} style={{ marginTop: 16 }}>
          <OpenIssuesTracker report={latestReport} domains={latestDomains} />
        </div>
      )}

      {/* Audit scope card */}
      <ScopeCard tier={tier} industry={industry} domain={domain} context={context} />

      {/* Past Audits */}
      <PastAuditsSection
        reports={reports}
        reportsLoading={reportsLoading}
        onStartAudit={onStartAudit}
      />

      {/* VNKLO CTA Card */}
      {reports.length > 0 && (
        <VnkloCTACard user={user} reports={reports} />
      )}
    </div>
  )
}

// ─── Re-engagement banner ─────────────────────────────────────────────────────

function ReEngagementBanner({ report, domains, onDismiss, onUpdateStatus }) {
  const badCount = domains.filter(d => d.status === 'critical' || d.status === 'needs_work').length
  const daysAgo  = Math.floor((Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c4e54 0%, #01696f 100%)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        👋
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
          Back for a check-in?
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
          Your last audit flagged {badCount} critical/needs_work {badCount === 1 ? 'issue' : 'issues'} — any progress?
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          {report.title} · done {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.5)',
            color: '#fff',
            fontSize: 12, fontWeight: 500,
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={onUpdateStatus}
          style={{
            background: '#fff',
            border: 'none',
            color: '#0c4e54',
            fontSize: 12, fontWeight: 600,
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Update Status →
        </button>
      </div>
    </div>
  )
}

// ─── Business Health Score Card ───────────────────────────────────────────────

function BusinessHealthScoreCard({ reports, latestDomains, onStartAudit }) {
  const score     = computeHealthScore(latestDomains)
  const prevDoms  = reports.length > 1 ? (parseReportContent(reports[1].content)?.domains ?? []) : null
  const prevScore = prevDoms !== null ? computeHealthScore(prevDoms) : null
  const delta     = prevScore !== null ? score - prevScore : null

  const r    = 20
  const cx   = 25
  const cy   = 25
  const circ = 2 * Math.PI * r

  const statusColor = (status) => {
    if (status === 'critical')   return '#C0392B'
    if (status === 'needs_work') return '#B7600A'
    return '#0F6E56'
  }

  const domainScore = (d) => {
    if (d.status === 'critical')   return 30
    if (d.status === 'needs_work') return 60
    return 85
  }

  return (
    <div style={{ background: G.white, border: `0.5px solid ${G.border}`, borderRadius: 12, padding: '20px', marginBottom: 0, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>Business Health Score</span>
        <button
          onClick={onStartAudit}
          style={{
            background: 'none', border: `0.5px solid ${G.border}`, borderRadius: 8,
            fontSize: 12, fontWeight: 500, color: G.green,
            padding: '6px 14px', cursor: 'pointer',
          }}
        >
          Run New Audit →
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={G.border} strokeWidth="4" />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={G.green}
            strokeWidth="4"
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </svg>
        <div>
          <span style={{ fontSize: 28, fontWeight: 700, color: G.ink, fontFamily: 'ui-monospace, monospace', letterSpacing: '-1px' }}>{score}</span>
          <span style={{ fontSize: 14, color: G.inkFaint, fontFamily: 'ui-monospace, monospace' }}>/100</span>
          {delta !== null && (
            <div style={{ fontSize: 12, color: delta >= 0 ? G.greenDark : '#C0392B', fontWeight: 500, marginTop: 2 }}>
              {delta >= 0 ? `↑ Up from ${prevScore}` : `↓ Down from ${prevScore}`}
            </div>
          )}
        </div>
      </div>

      {latestDomains.slice(0, 4).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {latestDomains.slice(0, 4).map((d, i) => {
            const ds    = domainScore(d)
            const color = statusColor(d.status)
            return (
              <div key={i} style={{ background: '#F9F8F5', border: `0.5px solid ${G.border}`, borderRadius: 8, padding: '12px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: G.inkFaint, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: G.ink, fontFamily: 'ui-monospace, monospace', marginBottom: 6 }}>{ds}</div>
                <div style={{ height: 4, background: G.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${ds}%`, background: color, borderRadius: 2 }} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                  background: d.status === 'critical' ? '#FDECEA' : d.status === 'needs_work' ? '#FEF3E2' : '#E1F5EE',
                  color,
                }}>
                  {d.status?.replace(/_/g, ' ') ?? 'good'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Open Issues Tracker ──────────────────────────────────────────────────────

function OpenIssuesTracker({ report, domains }) {
  const getKey = (domainName) => `tsa_issue_${report.id}_${domainName}`

  const [statuses, setStatuses] = useState(() => {
    const init = {}
    domains.forEach(d => {
      init[d.name] = localStorage.getItem(`tsa_issue_${report.id}_${d.name}`) || 'open'
    })
    return init
  })

  const cycleStatus = (domainName) => {
    const cur  = statuses[domainName] || 'open'
    const next = cur === 'open' ? 'in_progress' : cur === 'in_progress' ? 'resolved' : 'open'
    localStorage.setItem(getKey(domainName), next)
    setStatuses(prev => ({ ...prev, [domainName]: next }))
  }

  const openCount     = Object.values(statuses).filter(s => s === 'open').length
  const resolvedCount = Object.values(statuses).filter(s => s === 'resolved').length

  const dotColor = (status) => {
    if (status === 'critical')   return '#C0392B'
    if (status === 'needs_work') return '#B7600A'
    return '#0F6E56'
  }

  const chipStyle = (status) => {
    if (status === 'open')        return { background: '#FDECEA', color: '#C0392B' }
    if (status === 'in_progress') return { background: '#FEF3E2', color: '#B7600A' }
    return { background: '#E1F5EE', color: '#0F6E56' }
  }

  return (
    <div style={{ background: G.white, border: `0.5px solid ${G.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `0.5px solid ${G.border}` }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: G.ink }}>Open Issues</span>
        <span style={{ fontSize: 12, color: G.inkFaint }}>{openCount} open · {resolvedCount} resolved</span>
      </div>
      <div>
        {domains.map((d, i) => {
          const issueStatus = statuses[d.name] || 'open'
          const chip        = chipStyle(issueStatus)
          const isResolved  = issueStatus === 'resolved'
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 18px',
                borderBottom: i < domains.length - 1 ? `0.5px solid ${G.border}` : 'none',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor(d.status), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: G.ink }}>{d.name}</div>
                {d.finding && (
                  <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.finding}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 100, background: chip.background, color: chip.color }}>
                  {issueStatus.replace(/_/g, ' ')}
                </span>
                {isResolved ? (
                  <span style={{ fontSize: 14, color: '#0F6E56' }}>✓</span>
                ) : (
                  <button
                    onClick={() => cycleStatus(d.name)}
                    style={{
                      background: 'none', border: `0.5px solid ${G.border}`,
                      borderRadius: 6, fontSize: 11, fontWeight: 500,
                      color: G.inkMuted, padding: '4px 10px', cursor: 'pointer',
                    }}
                  >
                    {issueStatus === 'open' ? 'Mark Progress' : 'Update'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── VNKLO CTA card ───────────────────────────────────────────────────────────

function VnkloCTACard({ user, reports }) {
  const [shared,  setShared]  = useState(false)
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
    } catch (e) {
      console.error('[vnklo-cta] share failed:', e?.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div style={{ background: '#1A1A1A', borderRadius: 12, padding: '20px 24px', marginTop: 24 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
        Ready to fix this?
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
        Get a free strategy call with VNKLO
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        Share your audit — an AI consultant will map out exactly what to fix and how.
      </div>
      {shared ? (
        <div style={{ fontSize: 13, fontWeight: 500, color: G.green }}>
          ✓ Sent! We'll be in touch within 24h.
        </div>
      ) : (
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: '100%', background: '#fff', border: 'none',
            color: '#1A1A1A', fontSize: 13, fontWeight: 600,
            padding: '11px', borderRadius: 8, cursor: sharing ? 'not-allowed' : 'pointer',
            opacity: sharing ? 0.7 : 1,
          }}
        >
          {sharing ? 'Sharing…' : 'Share Report with VNKLO →'}
        </button>
      )}
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, valueColor, sub }) {
  return (
    <div style={s.metricCard}>
      <div style={s.metricLabel}>{label}</div>
      <div style={{ ...s.metricValue, ...(valueColor ? { color: valueColor } : {}) }}>{value}</div>
      {sub && <div style={{ marginTop: 8 }}>{sub}</div>}
    </div>
  )
}

// ─── Scope card ───────────────────────────────────────────────────────────────

function ScopeCard({ tier, industry, domain, context }) {
  const allDomains     = (tier === 'business' && industry) ? (DOMAIN_MAP[industry] || []) : []
  const visibleDomains = allDomains.slice(0, 4)
  const extraCount     = allDomains.length - 4

  // Primary: show industry — domain label (the user-facing scope), fall back to context paragraph
  const scopeLabel = industry
    ? (tier === 'essential' && domain ? `${industry} — ${domain}` : industry)
    : null
  const isEmpty    = !scopeLabel && !context
  const primaryVal = scopeLabel || context || 'Start an audit to set your scope'

  return (
    <div style={s.scopeCard}>
      <div>
        <div style={s.sectionLabel}>Your audit scope</div>
        <div style={{ ...s.scopeValue, ...(isEmpty ? { color: 'var(--gray-400)', fontStyle: 'italic', fontSize: 14 } : {}) }}>
          {primaryVal}
        </div>
        {scopeLabel && context && (
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6, lineHeight: 1.6 }}>
            {context}
          </p>
        )}
      </div>

      {tier !== 'portfolio' && (industry || domain) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {industry && <span style={s.greenPill}>{industry}</span>}
          {tier === 'essential' && domain && (
            <span style={s.grayPill}>{domain}</span>
          )}
          {tier === 'business' && visibleDomains.map(d => (
            <span key={d} style={s.grayPill}>{d}</span>
          ))}
          {tier === 'business' && extraCount > 0 && (
            <span style={s.grayPill}>+{extraCount} more</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Past Audits section ──────────────────────────────────────────────────────

const MODE_BADGE = {
  DIAGNOSTIC:    { bg: G.metricBg,   color: G.inkFaint  },
  EXECUTION:     { bg: '#E6F1FB',    color: '#185FA5'   },
  HUMAN_MOMENT:  { bg: '#EEEDFE',    color: '#534AB7'   },
  EXECUTION_HUMAN: { bg: '#EEEDFE',  color: '#534AB7'   },
}

function PastAuditCard({ report }) {
  const headline = report.headline || report.title || '(untitled)'
  const scope    = [report.industry, report.domain].filter(Boolean).join(' — ')
  const mode     = report.conversation_mode ?? 'DIAGNOSTIC'
  const badge    = MODE_BADGE[mode] ?? MODE_BADGE.DIAGNOSTIC
  const date     = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div style={{
      background: G.white,
      border: `0.5px solid ${G.border}`,
      borderRadius: 10,
      padding: '14px 18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: G.ink, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {headline}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {scope && (
            <span style={{ fontSize: 12, color: G.inkMuted }}>{scope}</span>
          )}
          {scope && <span style={{ fontSize: 12, color: G.border }}>·</span>}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
            background: badge.bg, color: badge.color,
          }}>
            {mode.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: G.inkFaint, flexShrink: 0, whiteSpace: 'nowrap' }}>
        {date}
      </div>
    </div>
  )
}

function PastAuditsSection({ reports, reportsLoading, onStartAudit }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={s.sectionLabel}>Past Audits</div>
      {reportsLoading
        ? <ReportSkeletons />
        : reports.length > 0
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => <PastAuditCard key={r.id} report={r} />)}
            </div>
          )
          : (
            <div style={s.emptyReports}>
              <div style={s.emptyReportsText}>No audits yet. Start your first audit.</div>
              <button style={s.emptyReportsBtn} onClick={onStartAudit}>Start audit →</button>
            </div>
          )
      }
    </div>
  )
}

// ─── Report skeletons (loading state) ────────────────────────────────────────

function ReportSkeletons() {
  return (
    <>
      <style>{`@keyframes skeletonPulse{0%,100%{opacity:.55}50%{opacity:.25}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              background: G.metricBg,
              borderRadius: 10,
              height: 54,
              animation: 'skeletonPulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ─── Empty reports ────────────────────────────────────────────────────────────

function EmptyReports({ onStartAudit }) {
  return (
    <div style={s.emptyReports}>
      <div style={s.emptyReportsText}>Run your first audit to see your report here.</div>
      <button style={s.emptyReportsBtn} onClick={onStartAudit}>Start audit →</button>
    </div>
  )
}

// ─── DevTools card (admin only) ──────────────────────────────────────────────

function DevToolsCard({ user, profile, onProfileChange }) {
  const [saving, setSaving] = useState(null)
  const current = normalizeTier(profile?.tier)

  const switchTier = async (tier) => {
    setSaving(tier)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ tier }).eq('id', user.id)
      onProfileChange({ tier })
    } catch (e) {
      console.error('[devtools] tier switch failed:', e?.message)
    } finally {
      setSaving(null)
    }
  }

  const tiers = ['essential', 'business', 'portfolio']
  const tierColors = {
    essential: { bg: '#E1F5EE', color: '#0F6E56', active: '#0F6E56' },
    business:  { bg: '#E6F1FB', color: '#185FA5', active: '#185FA5' },
    portfolio: { bg: '#EEEDFE', color: '#534AB7', active: '#534AB7' },
  }

  return (
    <div style={{ marginTop: 28, background: '#FFFBE6', border: '1px solid #F0D96A', borderRadius: 12, padding: '18px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#8A6D00', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Developer Tools — Testing only
      </div>
      <p style={{ fontSize: 12, color: '#8A6D00', marginBottom: 14 }}>Tier switcher — changes your profile tier for testing.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {tiers.map(t => {
          const tc = tierColors[t]
          const isCurrent = current === t
          return (
            <button
              key={t}
              onClick={() => switchTier(t)}
              disabled={!!saving}
              style={{
                background: isCurrent ? tc.active : tc.bg,
                color: isCurrent ? '#fff' : tc.color,
                border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving && saving !== t ? 0.5 : 1,
                textTransform: 'capitalize',
                transition: 'opacity 0.15s',
              }}
            >
              {saving === t ? 'Saving…' : t}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Report content renderer ──────────────────────────────────────────────────

const REPORT_STATUS_COLORS = {
  critical:   { bg: '#FDECEA', color: '#C0392B' },
  needs_work: { bg: '#FEF3E2', color: '#B7600A' },
  good:       { bg: '#E1F5EE', color: '#0F6E56' },
}

function DashSectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: G.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
      {children}
    </p>
  )
}

function DashTextSection({ label, text, italic }) {
  if (!text) return null
  return (
    <div>
      <DashSectionLabel>{label}</DashSectionLabel>
      <p style={{ fontSize: 14, color: G.inkMuted, lineHeight: 1.65, fontStyle: italic ? 'italic' : 'normal' }}>{text}</p>
    </div>
  )
}

function DashReportSchemaB({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {p.headline && <p style={{ fontSize: 16, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>}
      <DashTextSection label="Acknowledgment"       text={p.acknowledgment} />
      <DashTextSection label="What This Actually Is" text={p.what_this_actually_is} />
      {p.delivery_script && (
        <div>
          <DashSectionLabel>Delivery Script</DashSectionLabel>
          <div style={{
            background: '#F0EFEB', borderRadius: 8, padding: '12px 14px',
            fontSize: 13, color: G.ink, lineHeight: 1.7,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {p.delivery_script}
          </div>
        </div>
      )}
      <DashTextSection label="What To Expect" text={p.what_to_expect} />
      <DashTextSection label="Honest Truth"   text={p.honest_truth} italic />
    </div>
  )
}

function DashReportSchemaA({ p }) {
  const domains          = p.domains          ?? []
  const non_ai_fixes     = p.non_ai_fixes     ?? []
  const ai_opportunities = p.ai_opportunities ?? []
  const priority_actions = p.priority_actions ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {p.headline && <p style={{ fontSize: 16, fontWeight: 700, color: G.ink, lineHeight: 1.4 }}>{p.headline}</p>}
      <DashTextSection label="Verdict" text={p.overall_verdict} />

      <div>
        <DashSectionLabel>Domains</DashSectionLabel>
        {domains.length === 0 ? (
          <p style={{ fontSize: 13, color: G.inkFaint, fontStyle: 'italic' }}>No domain breakdown available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {domains.map((d, i) => {
              const sc = REPORT_STATUS_COLORS[d.status] ?? { bg: G.bg, color: G.inkMuted }
              const uc = d.urgency === 'immediate' ? { bg: '#FDECEA', color: '#C0392B' } : { bg: G.bg, color: G.inkFaint }
              return (
                <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: G.ink }}>{d.name}</p>
                    {d.status && (
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 100, padding: '2px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  {d.finding && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55, marginBottom: d.action ? 6 : 0 }}>{d.finding}</p>}
                  {d.action && (
                    <p style={{ fontSize: 13, color: G.ink, lineHeight: 1.55, marginBottom: d.urgency ? 6 : 0 }}>
                      <span style={{ fontWeight: 600 }}>→ Action:</span> {d.action}
                    </p>
                  )}
                  {d.urgency && (
                    <span style={{ display: 'inline-block', background: uc.bg, color: uc.color, borderRadius: 100, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                      {d.urgency}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {non_ai_fixes.length > 0 && (
        <div>
          <DashSectionLabel>Non-AI Fixes</DashSectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {non_ai_fixes.map((item, i) => (
              <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
                {item.issue && <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{item.issue}</p>}
                {item.fix   && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item.fix}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {ai_opportunities.length > 0 && (
        <div>
          <DashSectionLabel>AI Opportunities</DashSectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ai_opportunities.map((item, i) => (
              <div key={i} style={{ background: G.bg, border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px' }}>
                {item.area && <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, marginBottom: 4 }}>{item.area}</p>}
                {item.why  && <p style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>{item.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {priority_actions.length > 0 && (
        <div>
          <DashSectionLabel>Priority Actions</DashSectionLabel>
          <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {priority_actions.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: G.inkMuted, lineHeight: 1.55 }}>
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
  if (!content) return <p style={{ fontSize: 13, color: G.inkFaint, fontStyle: 'italic' }}>No content stored.</p>
  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return <pre style={{ fontSize: 12, color: G.inkMuted, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{content}</pre>
  }
  return parsed.conversation_mode === 'EXECUTION_HUMAN'
    ? <DashReportSchemaB p={parsed} />
    : <DashReportSchemaA p={parsed} />
}

// ─── Report list + card ───────────────────────────────────────────────────────

function ReportCard({ report }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: G.white, border: `1px solid ${open ? G.green : G.border}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 18px', cursor: 'pointer', gap: 12,
          background: open ? G.greenLight : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: G.ink, flex: 1 }}>{report.title || '(untitled)'}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: G.inkFaint, whiteSpace: 'nowrap' }}>
            {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
          </p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
            style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: G.inkFaint }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: '16px 18px', borderTop: `1px solid ${G.border}` }}>
          <DashReportContent content={report.content} />
        </div>
      )}
    </div>
  )
}

function ReportList({ reports }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map(r => <ReportCard key={r.id} report={r} />)}
    </div>
  )
}

// ─── Collapse button ──────────────────────────────────────────────────────────

function CollapseBtn({ isCollapsed, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        style={s.collapseBtn}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {isCollapsed ? '›' : '‹'}
      </button>
      {hovered && (
        <div style={s.tooltip}>{isCollapsed ? 'Expand menu' : 'Collapse menu'}</div>
      )}
    </div>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, collapsed, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <button
        style={{
          ...s.navItem,
          ...(active ? s.navItemActive : {}),
          ...(collapsed ? { justifyContent: 'center', padding: '8px 0' } : {}),
        }}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{ display: 'flex', flexShrink: 0, color: active ? G.greenDark : G.inkMuted }}>
          {icon}
        </span>
        {!collapsed && <span>{label}</span>}
      </button>
      {collapsed && hovered && (
        <div style={s.tooltip}>{label}</div>
      )}
    </div>
  )
}

// ─── Live billing card ────────────────────────────────────────────────────────

function LiveBillingCard({ billing, billingLoading, billingError, onOpenPortal, portalLoading }) {
  const nextDate = billing?.current_period_end
    ? new Date(billing.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const card = billing?.card
  const expiry = card ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : null
  const brand  = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card'

  return (
    <div style={{ background: G.white, border: `0.5px solid ${G.border}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      {billingLoading && (
        <div style={{ padding: '18px 22px', fontSize: 13, color: G.inkFaint }}>Loading billing details…</div>
      )}
      {billingError && !billingLoading && (
        <div style={{ padding: '14px 22px', fontSize: 13, color: '#C0392B', background: '#FDE9E7' }}>{billingError}</div>
      )}
      {!billingLoading && !billingError && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'center', gap: 0 }}>
          <div style={{ padding: '18px 22px', borderRight: `0.5px solid ${G.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: G.inkFaint, marginBottom: 5 }}>Next billing</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.ink }}>{nextDate || '—'}</div>
          </div>
          <div style={{ padding: '18px 22px', borderRight: `0.5px solid ${G.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: G.inkFaint, marginBottom: 5 }}>Payment method</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: G.ink }}>
              {card ? `${brand} ···· ${card.last4}` : '—'}
            </div>
            {expiry && <div style={{ fontSize: 11, color: G.inkFaint, marginTop: 2 }}>Expires {expiry}</div>}
          </div>
          <div style={{ padding: '18px 22px', borderRight: `0.5px solid ${G.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: G.inkFaint, marginBottom: 5 }}>Status</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: G.greenDark, background: G.greenLight, display: 'inline-block', padding: '2px 10px', borderRadius: 100 }}>
              {billing?.status || 'active'}
            </div>
          </div>
          <div style={{ padding: '18px 22px' }}>
            <button
              onClick={onOpenPortal}
              disabled={portalLoading}
              style={{ fontSize: 12, fontWeight: 500, color: G.green, background: 'none', border: `0.5px solid ${G.green}`, padding: '7px 14px', borderRadius: 8, cursor: portalLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: portalLoading ? 0.6 : 1 }}
            >
              {portalLoading ? 'Redirecting…' : 'Update payment →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tier card (billing section) ──────────────────────────────────────────────

function TierCard({ tier, currentTier, userId, email }) {
  const [loading, setLoading] = useState(false)
  const current     = tier.key === currentTier
  const isUpgrade   = (TIER_ORDER[tier.key] ?? 0) > (TIER_ORDER[currentTier] ?? 0)
  const isDowngrade = (TIER_ORDER[tier.key] ?? 0) < (TIER_ORDER[currentTier] ?? 0)

  const handleCheckout = async () => {
    if (!userId || !email) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.key, userId, email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch (e) {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: current ? G.greenLight : G.white,
      border: current ? `1.5px solid ${G.green}` : `0.5px solid ${G.border}`,
      borderRadius: 12, padding: '20px',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {current && (
        <div style={{ position: 'absolute', top: -11, left: 16, background: G.green, color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>
          Current plan
        </div>
      )}
      {tier.popular && !current && (
        <div style={{ position: 'absolute', top: -11, right: 16, background: G.green, color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>
          Most popular
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: current ? G.greenDark : G.inkMuted, marginBottom: 6, marginTop: 8 }}>
        {tier.name}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: G.ink, lineHeight: 1, marginBottom: 4 }}>
        {tier.price}<span style={{ fontSize: 13, fontWeight: 500, color: G.inkFaint }}>/mo</span>
      </div>
      <div style={{ fontSize: 12, color: G.inkMuted, marginBottom: 16, lineHeight: 1.5 }}>{tier.desc}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {tier.features.map(f => (
          <li key={f} style={{ fontSize: 12, color: G.inkMuted, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <span style={{ color: G.green, fontWeight: 600, flexShrink: 0, lineHeight: 1.6 }}>→</span> {f}
          </li>
        ))}
      </ul>
      {current && (
        <div style={{ fontSize: 12, fontWeight: 500, color: G.greenDark, textAlign: 'center', padding: '9px', background: 'rgba(29,158,117,0.12)', borderRadius: 8 }}>
          Active plan
        </div>
      )}
      {isUpgrade && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{ fontSize: 13, fontWeight: 500, color: 'white', background: loading ? G.inkFaint : G.green, border: 'none', padding: '10px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
        >
          {loading ? 'Redirecting…' : `Upgrade to ${tier.name}`}
        </button>
      )}
      {isDowngrade && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{ fontSize: 13, fontWeight: 500, color: G.inkMuted, background: 'none', border: `0.5px solid ${G.border}`, padding: '10px', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Redirecting…' : `Downgrade to ${tier.name}`}
        </button>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  // Shell — full height, no outer scroll
  shell: {
    display: 'flex', height: '100vh', overflow: 'hidden',
    background: G.bg,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // ── Sidebar ────────────────────────────────────────────────────────────────
  sidebar: {
    flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    background: G.white, borderRight: `0.5px solid ${G.border}`,
    padding: '22px 0 16px',
    height: '100vh', overflowY: 'auto',
    transition: 'width 0.18s ease',
    overflow: 'hidden',
  },
  logoRow: { padding: '0 14px 0 20px', marginBottom: 24 },
  collapseBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, color: G.inkFaint, padding: '2px 4px',
    lineHeight: 1, flexShrink: 0,
    transition: 'color 0.15s',
  },
  logo: {
    fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px',
    color: G.ink, cursor: 'pointer', userSelect: 'none',
  },
  nav: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '0 10px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    width: '100%', textAlign: 'left',
    fontSize: 13, color: G.inkMuted, fontWeight: 500,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px 10px', borderRadius: 8,
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    background: G.greenLight, color: G.greenDark,
  },
  settingsSection: { padding: '0 10px', marginBottom: 6 },
  settingsLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: '1px',
    textTransform: 'uppercase', color: G.inkFaint,
    padding: '0 10px', marginBottom: 4,
  },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    margin: '8px 10px 0', padding: '10px 10px',
    background: G.bg, borderRadius: 10,
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: G.greenLight, color: G.greenDark,
    fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 13, fontWeight: 600, color: G.ink, marginBottom: 5,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tierBadge: {
    display: 'inline-block',
    fontSize: 10, fontWeight: 600, letterSpacing: '0.3px',
    padding: '2px 8px', borderRadius: 100,
  },
  signOut: {
    display: 'flex', alignItems: 'center', gap: 6,
    margin: '6px 16px 0',
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, color: G.inkFaint, padding: '6px 4px',
    transition: 'color 0.15s',
  },

  // ── Main ────────────────────────────────────────────────────────────────────
  main: { flex: 1, overflowY: 'auto', minWidth: 0 },
  content: { padding: '32px 36px', maxWidth: 820 },

  pageHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 28,
  },
  pageTitle: { fontSize: 20, fontWeight: 500, color: G.ink, margin: '0 0 4px' },
  pageSub:   { fontSize: 13, color: G.inkMuted, margin: 0 },
  newAuditBtn: {
    background: G.green, color: 'white',
    fontSize: 13, fontWeight: 500, padding: '9px 18px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    flexShrink: 0, whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },

  // Metric cards
  metricsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12, marginBottom: 14,
  },
  metricCard: {
    background: G.metricBg, borderRadius: 12,
    padding: '18px 20px',
  },
  metricLabel: {
    fontSize: 11, color: G.inkFaint, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
  },
  metricValue: {
    fontSize: 22, fontWeight: 600, color: G.ink, letterSpacing: '-0.3px',
  },
  upgradeLink: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    fontSize: 12, color: G.green, fontWeight: 500,
  },

  // Scope card
  scopeCard: {
    background: G.white, border: `0.5px solid ${G.border}`,
    borderRadius: 12, padding: '20px 22px',
  },
  sectionLabel: {
    fontSize: 11, color: G.inkFaint, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
  },
  scopeValue: { fontSize: 15, color: G.ink, fontWeight: 500 },
  greenPill: {
    fontSize: 12, fontWeight: 500,
    background: G.greenLight, color: G.greenDark,
    padding: '3px 10px', borderRadius: 100,
    display: 'inline-block',
  },
  grayPill: {
    fontSize: 12, fontWeight: 500,
    background: G.metricBg, color: G.inkMuted,
    padding: '3px 10px', borderRadius: 100,
    display: 'inline-block',
  },

  // Empty reports
  emptyReports: {
    border: `1.5px dashed ${G.border}`, borderRadius: 12,
    padding: '44px 24px', textAlign: 'center',
  },
  emptyReportsText: { fontSize: 13, color: G.inkFaint, marginBottom: 16 },
  emptyReportsBtn: {
    background: 'none', border: `0.5px solid ${G.border}`,
    borderRadius: 8, fontSize: 13, fontWeight: 500,
    color: G.inkMuted, cursor: 'pointer', padding: '8px 18px',
  },

  // Sidebar tooltip
  tooltip: {
    position: 'absolute',
    left: 'calc(100% + 10px)',
    top: '50%',
    transform: 'translateY(-50%)',
    background: G.ink,
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: 6,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 200,
  },
}
