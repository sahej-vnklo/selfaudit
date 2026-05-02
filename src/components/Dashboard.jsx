import React, { useState } from 'react'

const PLAN_META = {
  essential: {
    label: 'Essential',
    price: '$19/mo',
    features: ['Up to 3 domains per audit', 'Full written report', 'Root cause diagnosis', 'AI opportunity mapping'],
  },
  business: {
    label: 'Business',
    price: '$49/mo',
    features: ['All 9 domains covered', 'Unlimited audit sessions', 'Full drill-down audit', 'Priority action list'],
  },
  free: {
    label: 'Free',
    price: '$0',
    features: ['1 domain per audit', 'Surface-level report'],
  },
}

export default function Dashboard({ userInfo, onStartAudit }) {
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)

  const plan = userInfo?.plan || 'free'
  const meta = PLAN_META[plan] || PLAN_META.free
  const firstName = (userInfo?.name || '').split(' ')[0] || 'there'

  const handleUpgrade = async () => {
    setUpgradeLoading(true)
    setUpgradeError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan === 'essential' ? 'business' : 'essential',
          email: userInfo?.email,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setUpgradeError(data.error || 'Something went wrong')
        setUpgradeLoading(false)
      }
    } catch (err) {
      setUpgradeError(err.message)
      setUpgradeLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          self<span style={{ color: 'var(--green)' }}>audit</span>
        </div>
        <div style={styles.navRight}>
          <span style={{
            ...styles.planBadge,
            ...(plan === 'business' ? styles.planBadgeBusiness : styles.planBadgeEssential),
          }}>
            {meta.label}
          </span>
        </div>
      </nav>

      <div style={styles.wrap}>
        <div style={styles.mainCard}>
          <div style={styles.header}>
            <span style={styles.welcomeLabel}>Dashboard</span>
            <h2 style={styles.title}>Welcome, {firstName}.</h2>
            <p style={styles.sub}>
              Your <strong>{meta.label}</strong> plan is active.{' '}
              {plan === 'business'
                ? 'All 9 domains are covered in this session.'
                : plan === 'essential'
                ? `${userInfo?.selectedDomains?.length || 0} domain${userInfo?.selectedDomains?.length !== 1 ? 's' : ''} selected.`
                : 'Start your free audit.'}
            </p>
          </div>

          {/* Billing section */}
          <div style={styles.billingSection}>
            <div style={styles.billingHeader}>
              <span style={styles.billingTitle}>Billing</span>
              <span style={{
                ...styles.planBadge,
                ...(plan === 'business' ? styles.planBadgeBusiness : styles.planBadgeEssential),
              }}>
                {meta.label} — {meta.price}
              </span>
            </div>

            <ul style={styles.featureList}>
              {meta.features.map(f => (
                <li key={f} style={styles.featureItem}>
                  <span style={styles.featureCheck}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan !== 'business' && (
              <div style={styles.upgradeCard}>
                <div style={styles.upgradeLeft}>
                  <p style={styles.upgradeTitle}>Upgrade to Business</p>
                  <p style={styles.upgradeSub}>
                    Cover all 9 domains, unlock unlimited sessions and full drill-down audits.
                  </p>
                </div>
                <button
                  style={{ ...styles.upgradeBtn, ...(upgradeLoading ? styles.upgradeBtnLoading : {}) }}
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                >
                  {upgradeLoading ? 'Redirecting...' : 'Upgrade to Business →'}
                </button>
              </div>
            )}

            {upgradeError && (
              <p style={styles.upgradeError}>{upgradeError}</p>
            )}
          </div>

          {/* Selected domains (for essential) */}
          {plan === 'essential' && userInfo?.selectedDomains?.length > 0 && (
            <div style={styles.domainsSection}>
              <p style={styles.domainsLabel}>Selected domains</p>
              <div style={styles.domainPills}>
                {userInfo.selectedDomains.map(d => (
                  <span key={d} style={styles.domainPill}>{d}</span>
                ))}
              </div>
            </div>
          )}

          {plan === 'business' && userInfo?.selectedDomains?.length > 0 && (
            <div style={styles.domainsSection}>
              <p style={styles.domainsLabel}>Covered domains</p>
              <div style={styles.domainPills}>
                {userInfo.selectedDomains.map(d => (
                  <span key={d} style={{ ...styles.domainPill, ...styles.domainPillBusiness }}>{d}</span>
                ))}
              </div>
            </div>
          )}

          <button style={styles.startBtn} onClick={onStartAudit}>
            Start your audit
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 8 }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--gray-100)' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2.5rem',
    background: 'var(--white)',
    borderBottom: '0.5px solid var(--gray-200)',
  },
  logo: { fontSize: 17, fontWeight: 500, letterSpacing: '-0.5px' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  planBadge: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 'var(--radius-pill)', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  planBadgeBusiness: { background: 'var(--green-light)', color: 'var(--green-dark)' },
  planBadgeEssential: { background: 'var(--gray-100)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)' },
  wrap: { display: 'flex', justifyContent: 'center', padding: '3rem 1.5rem' },
  mainCard: {
    background: 'var(--white)', borderRadius: 'var(--radius)',
    border: '0.5px solid var(--gray-200)',
    padding: '2.5rem', width: '100%', maxWidth: 520,
    animation: 'fadeUp 0.4s ease',
  },
  header: { marginBottom: '2rem' },
  welcomeLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', display: 'block', marginBottom: 8 },
  title: { fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, marginBottom: 8, lineHeight: 1.3 },
  sub: { fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6 },

  billingSection: {
    border: '0.5px solid var(--gray-200)', borderRadius: 'var(--radius)',
    padding: '1.25rem', marginBottom: '1.5rem',
  },
  billingHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  billingTitle: { fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' },
  featureList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' },
  featureItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-600)' },
  featureCheck: { color: 'var(--green)', fontWeight: 600, fontSize: 12, flexShrink: 0 },

  upgradeCard: {
    background: 'var(--green-light)', border: '1px solid var(--green-mid)',
    borderRadius: 'var(--radius-sm)', padding: '1rem',
    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    marginTop: 8,
  },
  upgradeLeft: { flex: 1, minWidth: 160 },
  upgradeTitle: { fontSize: 13, fontWeight: 600, color: 'var(--green-dark)', marginBottom: 2 },
  upgradeSub: { fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5 },
  upgradeBtn: {
    background: 'var(--green)', color: 'white',
    fontSize: 13, fontWeight: 500, padding: '9px 16px',
    borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap', fontFamily: 'var(--sans)',
    transition: 'background 0.15s',
  },
  upgradeBtnLoading: { background: 'var(--gray-400)', cursor: 'not-allowed' },
  upgradeError: { fontSize: 12, color: '#A32D2D', marginTop: 8 },

  domainsSection: { marginBottom: '1.5rem' },
  domainsLabel: { fontSize: 12, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  domainPills: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  domainPill: {
    fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-pill)',
    background: 'var(--gray-100)', border: '0.5px solid var(--gray-200)', color: 'var(--gray-600)',
  },
  domainPillBusiness: {
    background: 'var(--green-light)', border: '0.5px solid var(--green-mid)', color: 'var(--green-dark)',
  },

  startBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 15, fontWeight: 500, padding: '13px',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    border: 'none', transition: 'background 0.15s',
    fontFamily: 'var(--sans)',
  },
}
