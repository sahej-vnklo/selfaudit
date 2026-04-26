import React, { useState, useEffect } from 'react'
import { initSupabase } from '../lib/supabase.js'

export default function Dashboard({ user, onStartAudit }) {
  const handleSignOut = async () => {
    try {
      const supabase = await initSupabase()
      await supabase.auth.signOut()
    } catch (e) {
      console.error(e)
    } finally {
      localStorage.clear()
      window.location.href = '/'
    }
  }
  const [profile, setProfile]               = useState(null)
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [section, setSection]               = useState('home')
  const [collapsed, setCollapsed]           = useState(false)

  const name     = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'
  const email    = user?.email || ''
  const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!user) return
    initSupabase().then(sb =>
      sb.from('profiles')
        .select('context, tier')
        .eq('id', user.id)
        .single()
        .then(({ data }) => { if (data) setProfile(data) })
    ).catch(() => {})
  }, [user])

  const toggleCollapse = () => {
    setCollapsed(c => !c)
    setProfileExpanded(false)
  }

  return (
    <div style={s.shell}>

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside style={{ ...s.sidebar, width: collapsed ? 60 : 240 }}>

        {/* Logo + Toggle */}
        <div style={s.logoRow}>
          {!collapsed && (
            <div style={s.sidebarLogo} onClick={() => setSection('home')}>
              self<span style={{ color: 'var(--green)', fontWeight: 400 }}>audit</span>
            </div>
          )}
          <button
            style={{ ...s.toggleBtn, margin: collapsed ? '0 auto' : '0 0 0 auto' }}
            onClick={toggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '❯' : '❮'}
          </button>
        </div>

        {/* Home nav item */}
        <div style={{ padding: collapsed ? '0 8px' : '0 12px', marginBottom: 4 }}>
          <SidebarItem
            icon="⌂" label="Home"
            active={section === 'home'} collapsed={collapsed}
            onClick={() => setSection('home')}
          />
        </div>

        {/* Profile */}
        <div style={{ ...s.profileWrap, padding: collapsed ? '0 8px' : '0 12px' }}>
          <button
            style={{
              ...s.profileBtn,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 8px',
            }}
            onClick={() => !collapsed && setProfileExpanded(p => !p)}
            title={collapsed ? name : undefined}
          >
            <div style={s.avatar}>{initials}</div>
            {!collapsed && (
              <>
                <div style={s.profileText}>
                  <div style={s.profileName}>{name}</div>
                  <div style={s.profileEmail}>{email}</div>
                </div>
                <span style={{
                  ...s.chevron,
                  transform: profileExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>▾</span>
              </>
            )}
          </button>

          {profileExpanded && !collapsed && (
            <div style={s.contextBox}>
              <p style={s.contextLabel}>Your context</p>
              <p style={s.contextText}>
                {profile?.context || 'No context set — complete onboarding to add one.'}
              </p>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings */}
        <div style={{ ...s.settingsGroup, padding: collapsed ? '0 8px' : '0 12px' }}>
          {!collapsed && <p style={s.settingsGroupLabel}>Settings</p>}
          <SidebarItem
            icon="$" label="Billing"
            active={section === 'billing'} collapsed={collapsed}
            onClick={() => setSection(section === 'billing' ? 'home' : 'billing')}
          />
          <SidebarItem
            icon="⚙" label="Account"
            active={section === 'account'} collapsed={collapsed}
            onClick={() => setSection(section === 'account' ? 'home' : 'account')}
          />
        </div>

        {/* Sign out */}
        <div style={{ padding: collapsed ? '0 8px' : '0 12px', marginTop: 8 }}>
          {collapsed
            ? <button style={s.signOutIcon} onClick={handleSignOut} title="Sign out">→</button>
            : <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
          }
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <div style={s.main}>

        {section === 'home' && (
          <>
            {/* Content */}
            <div style={s.content}>
              <div style={s.emptyCard}>
                <p style={s.emptyIcon}>🏢</p>
                <p style={s.emptyTitle}>No audits yet</p>
                <p style={s.emptyBody}>Run a business audit and the report will appear here.</p>
                <button style={s.ctaBtn} onClick={() => onStartAudit({
                  name:    user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
                  email:   user?.email || '',
                  phone:   '',
                  context: profile?.context || '',
                })}>
                  Start audit →
                </button>
              </div>
            </div>
          </>
        )}

        {section === 'billing' && (
          <div style={{ ...s.content, maxWidth: 900 }}>
            <p style={s.sectionEyebrow}>Billing</p>
            <h2 style={s.sectionTitle}>Subscription</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 32, marginTop: -12 }}>
              Your current plan is highlighted. Upgrade or downgrade any time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {TIERS.map(tier => (
                <TierCard key={tier.key} tier={tier} currentTier={profile?.tier || 'essential'} />
              ))}
            </div>
          </div>
        )}

        {section === 'account' && (
          <div style={s.content}>
            <div style={s.sectionCard}>
              <p style={s.sectionEyebrow}>Account</p>
              <h2 style={s.sectionTitle}>Account settings</h2>
              <div style={s.accountRow}>
                <div>
                  <p style={s.accountLabel}>Email</p>
                  <p style={s.accountValue}>{email}</p>
                </div>
              </div>
              <div style={s.dangerZone}>
                <p style={s.dangerLabel}>Danger zone</p>
                <button style={s.deleteBtn}>Delete account</button>
                <p style={s.deleteNote}>
                  Permanently deletes your account and all audit data. This cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const TIERS = [
  {
    key: 'essential',
    name: 'Essential',
    price: '$49',
    desc: 'One domain. Unlimited audits. Your dedicated department head.',
    features: ['1 industry, 1 domain', 'Unlimited audits on that domain', 'Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'Email delivery'],
  },
  {
    key: 'business',
    name: 'Business',
    price: '$99',
    desc: 'Every function of your business, fully audited. No blind spots.',
    popular: true,
    features: ['Everything in Essential', 'All domains for your industry', 'AI opportunity breakdown', 'Re-audit anytime — track progress'],
  },
  {
    key: 'portfolio',
    name: 'Portfolio',
    price: '$299',
    desc: 'Every industry. Every domain. Built for those who operate at scale.',
    features: ['Everything in Business', 'All industries & domains', 'Multiple businesses', 'First access to new features', 'Priority Vnklo AI access'],
  },
]

const TIER_ORDER = { essential: 0, business: 1, portfolio: 2 }

function TierCard({ tier, currentTier }) {
  const current    = tier.key === currentTier
  const isUpgrade  = TIER_ORDER[tier.key] > TIER_ORDER[currentTier]
  const isDowngrade = TIER_ORDER[tier.key] < TIER_ORDER[currentTier]

  return (
    <div style={{
      background: current ? 'var(--green-light)' : 'var(--white)',
      border: current ? '1.5px solid var(--green)' : '0.5px solid var(--gray-200)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {current && (
        <div style={{ position: 'absolute', top: -11, left: 16, background: 'var(--green)', color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
          Current plan
        </div>
      )}
      {tier.popular && !current && (
        <div style={{ position: 'absolute', top: -11, right: 16, background: 'var(--green)', color: 'white', fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
          Most popular
        </div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: current ? 'var(--green-dark)' : 'var(--gray-600)', marginBottom: 6, marginTop: 8 }}>
        {tier.name}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--black)', lineHeight: 1, marginBottom: 4 }}>
        {tier.price}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-400)' }}>/mo</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>{tier.desc}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {tier.features.map(f => (
          <li key={f} style={{ fontSize: 12, color: 'var(--gray-600)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <span style={{ color: 'var(--green)', fontWeight: 600, flexShrink: 0, lineHeight: 1.6 }}>→</span> {f}
          </li>
        ))}
      </ul>
      {current && (
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-dark)', textAlign: 'center', padding: '9px', background: 'rgba(29,158,117,0.12)', borderRadius: 'var(--radius-sm)' }}>
          Active plan
        </div>
      )}
      {isUpgrade && (
        <button style={{ fontSize: 13, fontWeight: 500, color: 'white', background: 'var(--green)', border: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }}>
          Upgrade to {tier.name}
        </button>
      )}
      {isDowngrade && (
        <button style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)', background: 'none', border: '0.5px solid var(--gray-200)', padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s' }}>
          Downgrade to {tier.name}
        </button>
      )}
    </div>
  )
}

function SidebarItem({ label, icon, active, collapsed, onClick }) {
  return (
    <button
      style={{
        ...s.sidebarItem,
        ...(active ? s.sidebarItemActive : {}),
        ...(collapsed ? { justifyContent: 'center', padding: '8px 0' } : {}),
      }}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {icon && <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{icon}</span>}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = {
  shell: {
    display: 'flex', minHeight: '100vh', background: 'var(--gray-100)',
  },

  // Sidebar
  sidebar: {
    flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    background: 'var(--white)', borderRight: '0.5px solid var(--gray-200)',
    padding: '24px 0', position: 'sticky', top: 0, height: '100vh',
    overflowX: 'hidden', overflowY: 'auto',
    transition: 'width 0.2s ease',
  },

  // Logo + toggle row
  logoRow: {
    display: 'flex', alignItems: 'center',
    padding: '0 12px', marginBottom: 20, gap: 8,
  },
  sidebarLogo: {
    fontSize: 17, fontWeight: 600, letterSpacing: '-0.5px',
    color: 'var(--black)', cursor: 'pointer', userSelect: 'none',
    flex: 1, whiteSpace: 'nowrap',
  },
  toggleBtn: {
    background: 'rgba(29,158,117,0.15)', border: 'none', cursor: 'pointer',
    fontSize: 20, color: 'var(--green)', padding: '8px',
    borderRadius: 'var(--radius-sm)', lineHeight: 1,
    transition: 'background 0.15s',
    flexShrink: 0,
  },

  // Profile
  profileWrap: { marginBottom: 8 },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: 'none', border: 'none', cursor: 'pointer',
    borderRadius: 'var(--radius-sm)', textAlign: 'left',
    transition: 'background 0.15s',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
    background: 'var(--green-light)', color: 'var(--green-dark)',
    fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 13, fontWeight: 600, color: 'var(--black)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  profileEmail: {
    fontSize: 11, color: 'var(--gray-400)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: 11, color: 'var(--gray-400)', flexShrink: 0,
    display: 'inline-block', transition: 'transform 0.15s',
  },
  contextBox: {
    margin: '6px 8px 0',
    background: 'var(--gray-100)', borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
  },
  contextLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--green)', fontWeight: 600, marginBottom: 6,
  },
  contextText: {
    fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.6,
  },

  // Settings
  settingsGroup: { marginBottom: 8 },
  settingsGroupLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--gray-400)', fontWeight: 600, padding: '0 8px', marginBottom: 4,
  },
  sidebarItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', textAlign: 'left',
    fontSize: 13, color: 'var(--gray-600)', fontWeight: 500,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px 10px', borderRadius: 'var(--radius-sm)',
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },
  sidebarItemActive: {
    background: 'var(--green-light)', color: 'var(--green-dark)',
  },
  signOutBtn: {
    display: 'block', width: '100%',
    fontSize: 13, color: 'var(--gray-400)', background: 'none',
    border: '0.5px solid var(--gray-200)', padding: '8px 12px',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center',
  },
  signOutIcon: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', height: 36,
    fontSize: 16, color: 'var(--gray-400)', background: 'none',
    border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  // Content
  content: { flex: 1, padding: '32px', maxWidth: 760 },

  emptyCard: {
    background: 'var(--white)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '4rem 2rem', textAlign: 'center',
  },
  emptyIcon:  { fontSize: 32, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 500, color: 'var(--black)', marginBottom: 8 },
  emptyBody:  { fontSize: 14, color: 'var(--gray-600)', marginBottom: 24 },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 14, fontWeight: 500, padding: '11px 22px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
  },

  // Section cards (billing / account)
  sectionCard: {
    background: 'var(--white)', border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '2rem',
  },
  sectionEyebrow: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--green)', fontWeight: 600, marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400,
    lineHeight: 1.2, marginBottom: 24,
  },

  // Account
  accountRow: {
    padding: '14px 16px', background: 'var(--gray-100)',
    borderRadius: 'var(--radius-sm)', marginBottom: 32,
  },
  accountLabel: { fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 },
  accountValue: { fontSize: 14, color: 'var(--black)', fontWeight: 500 },
  dangerZone: {
    borderTop: '0.5px solid var(--gray-200)', paddingTop: 24,
  },
  dangerLabel: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: '#A32D2D', fontWeight: 600, marginBottom: 12,
  },
  deleteBtn: {
    fontSize: 13, fontWeight: 500, color: '#A32D2D',
    background: 'none', border: '0.5px solid #E8C4C4',
    padding: '9px 18px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    marginBottom: 10,
  },
  deleteNote: { fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6 },
}
