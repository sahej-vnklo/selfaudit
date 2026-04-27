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
  const [reportsLoading, setReportsLoading] = useState(true)
  const [section,        setSection]        = useState('home')
  const [isCollapsed,    setIsCollapsed]    = useState(false)

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
          .select('tier, industry, domain, context, name, phone, onboarding_complete')
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
        }
      } catch (err) {
        console.error('[dashboard] profile fetch threw:', err?.message ?? err)
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [user])

  const startAudit = () => onStartAudit({
    name:     user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email:    user?.email || '',
    phone:    '',
    context:  profile?.context  || '',
    userId:   user?.id          || null,
    tier:     profile?.tier     || null,
    industry: profile?.industry || null,
    domain:   profile?.domain   || null,
  })

  const tier     = normalizeTier(profile?.tier)
  const industry = profile?.industry || null
  const domain   = profile?.domain   || null
  const badge    = TIER_BADGE[tier]  || TIER_BADGE.essential

  return (
    <div style={s.shell}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside style={{ ...s.sidebar, width: isCollapsed ? 56 : 240 }}>

        {/* Logo + collapse toggle */}
        <div style={{ ...s.logoRow, justifyContent: 'space-between', alignItems: 'center' }}>
          {!isCollapsed && (
            <div style={s.logo} onClick={() => setSection('home')}>
              self<span style={{ color: G.green }}>audit</span>
            </div>
          )}
          <CollapseBtn isCollapsed={isCollapsed} onClick={() => setIsCollapsed(c => !c)} />
        </div>

        {/* Primary nav */}
        <nav style={s.nav}>
          <NavItem icon={<IconHome />}    label="Home"    active={section === 'home'}    collapsed={isCollapsed} onClick={() => { if (isCollapsed) return; setSection('home') }} />
          <NavItem icon={<IconReports />} label="Reports" active={section === 'reports'} collapsed={isCollapsed} onClick={() => { if (isCollapsed) return; setSection('reports') }} />
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings nav */}
        <div style={s.settingsSection}>
          {!isCollapsed && <div style={s.settingsLabel}>Settings</div>}
          <NavItem icon={<IconBilling />} label="Billing" active={section === 'billing'} collapsed={isCollapsed} onClick={() => { if (isCollapsed) return; setSection('billing') }} />
          <NavItem icon={<IconAccount />} label="Account" active={section === 'account'} collapsed={isCollapsed} onClick={() => { if (isCollapsed) return; setSection('account') }} />
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
            name={name}
            tier={tier}
            industry={industry}
            domain={domain}
            badge={badge}
            context={profile?.context || ''}
            reportsLoading={reportsLoading}
            onStartAudit={startAudit}
          />
        )}

        {section === 'reports' && (
          <div style={s.content}>
            <div style={s.pageHeader}>
              <div>
                <h1 style={s.pageTitle}>Reports</h1>
                <p style={s.pageSub}>Your saved audit reports.</p>
              </div>
              <button style={s.newAuditBtn} onClick={startAudit}>New audit →</button>
            </div>
            {reportsLoading ? <ReportSkeletons /> : <EmptyReports onStartAudit={startAudit} />}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {TIERS.map(t => (
                <TierCard key={t.key} tier={t} currentTier={tier} />
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

  // ── Context ───────────────────────────────────────────────────────────────
  const [contextVal,     setContextVal]     = useState('')
  const [contextChanged, setContextChanged] = useState(false)
  const [contextSaving,  setContextSaving]  = useState(false)

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
      setContextVal(profile.context || '')
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

  async function saveContext() {
    setContextSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ context: contextVal.trim() }).eq('id', user.id)
      onProfileChange({ context: contextVal.trim() })
      setContextChanged(false)
    } catch(e) { console.error(e) }
    finally { setContextSaving(false) }
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

      {/* ── 2. Context card ─────────────────────────────────────────────── */}
      <div style={{ ...acct.card, marginTop: 12 }}>
        <div style={acct.contextPad}>
          <div style={acct.fieldLabel}>Audit context</div>
          <textarea
            value={contextVal}
            onChange={e => { setContextVal(e.target.value); setContextChanged(true) }}
            style={acct.textarea}
          />
          {contextChanged && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                style={{ ...acct.saveBtn, opacity: contextSaving ? 0.6 : 1 }}
                onClick={saveContext}
                disabled={contextSaving}
              >
                {contextSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

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

// ─── Home section ─────────────────────────────────────────────────────────────

function HomeSection({ name, tier, industry, domain, badge, context, reportsLoading, onStartAudit }) {
  return (
    <div style={s.content}>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>{getGreeting()}{name ? `, ${name}` : ''}.</h1>
          <p style={s.pageSub}>Your audits and reports live here.</p>
        </div>
        <button style={s.newAuditBtn} onClick={onStartAudit}>New audit →</button>
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

      {/* Audit scope card */}
      <ScopeCard tier={tier} industry={industry} domain={domain} context={context} />

      {/* Recent reports */}
      <div style={{ marginTop: 28 }}>
        <div style={s.sectionLabel}>Recent reports</div>
        {reportsLoading ? <ReportSkeletons /> : <EmptyReports onStartAudit={onStartAudit} />}
      </div>
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

// ─── Tier card (billing section) ──────────────────────────────────────────────

function TierCard({ tier, currentTier }) {
  const current     = tier.key === currentTier
  const isUpgrade   = (TIER_ORDER[tier.key] ?? 0) > (TIER_ORDER[currentTier] ?? 0)
  const isDowngrade = (TIER_ORDER[tier.key] ?? 0) < (TIER_ORDER[currentTier] ?? 0)

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
        <button style={{ fontSize: 13, fontWeight: 500, color: 'white', background: G.green, border: 'none', padding: '10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s' }}>
          Upgrade to {tier.name}
        </button>
      )}
      {isDowngrade && (
        <button style={{ fontSize: 13, fontWeight: 500, color: G.inkMuted, background: 'none', border: `0.5px solid ${G.border}`, padding: '10px', borderRadius: 8, cursor: 'pointer' }}>
          Downgrade to {tier.name}
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
