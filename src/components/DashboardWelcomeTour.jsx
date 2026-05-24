import React, { useEffect, useMemo, useState } from 'react'

const NAV_SEQUENCE = [
  'This is your command centre.',
  'Reports stores every audit so nothing gets lost.',
  'Intelligence Brief keeps what matters right now close at hand.',
  'What We Know is everything SelfAudit has learned about your business.',
  'Connectors brings in real data instead of self-reported guesses.',
  'Ask SelfAudit investigates before answering.',
  'Billing manages your plan.',
  'Account controls your workspace.',
]

const CARD_SEQUENCE = [
  'Your score, updated after every audit.',
  'What is still unresolved.',
  'Where AI can move the needle for you.',
  'What changed since your last audit.',
]

const RECOMMENDED_COPY = 'The one thing to do this week.'

const STAGE_ORDER = ['welcome', 'nav', 'cards', 'recommended', 'zero']

export default function DashboardWelcomeTour({ onComplete, completing = false, theme = 'dark' }) {
  const [stageIndex, setStageIndex] = useState(0)
  const [navIndex, setNavIndex] = useState(-1)
  const [cardIndex, setCardIndex] = useState(-1)

  const stage = STAGE_ORDER[stageIndex]
  const c = useMemo(() => THEME_MAP[theme] || THEME_MAP.dark, [theme])

  useEffect(() => {
    if (stage !== 'nav') return undefined
    setNavIndex(0)
    const id = window.setInterval(() => {
      setNavIndex((current) => {
        if (current >= NAV_ITEMS.length - 1) {
          window.clearInterval(id)
          return current
        }
        return current + 1
      })
    }, 950)
    return () => window.clearInterval(id)
  }, [stage])

  useEffect(() => {
    if (stage !== 'cards') return undefined
    setCardIndex(0)
    const id = window.setInterval(() => {
      setCardIndex((current) => {
        if (current >= DASHBOARD_CARDS.length - 1) {
          window.clearInterval(id)
          return current
        }
        return current + 1
      })
    }, 950)
    return () => window.clearInterval(id)
  }, [stage])

  const nextStage = () => {
    setStageIndex((current) => Math.min(current + 1, STAGE_ORDER.length - 1))
  }

  return (
    <div style={{ ...styles.page, background: c.pageBg, color: c.text }}>
      <div style={{ ...styles.frame, background: c.frameBg, borderColor: c.frameBorder }}>
        <div style={styles.chrome}>
          {(stage === 'nav' || stage === 'cards' || stage === 'recommended' || stage === 'zero') && (
            <aside style={{ ...styles.sidebar, background: c.sidebarBg, borderColor: c.sidebarBorder }}>
              <div style={styles.sidebarTop}>
                <div style={{ ...styles.collapseBtn, background: c.buttonSurface, color: c.textSoft }}>‹</div>
              </div>
              <nav style={styles.navList}>
                {NAV_ITEMS.map((item, index) => (
                  <div
                    key={item.label}
                    style={{
                      ...styles.navItem,
                      ...(index <= navIndex ? styles.visibleItem : {}),
                      ...(index === navIndex ? { background: c.activeBg, borderColor: c.activeBorder, color: c.text } : {}),
                      color: index <= navIndex ? c.textSoft : 'transparent',
                    }}
                  >
                    <span style={styles.navIcon}>{item.icon}</span>
                    <span style={styles.navLabel}>{item.label}</span>
                  </div>
                ))}
              </nav>
              <div style={styles.bottomStack}>
                {BOTTOM_ITEMS.map((item, bottomIndex) => {
                  const index = NAV_ITEMS.length + bottomIndex
                  return (
                    <div
                      key={item.label}
                      style={{
                        ...styles.navItem,
                        ...(index <= navIndex ? styles.visibleItem : {}),
                        ...(index === navIndex ? { background: c.activeBg, borderColor: c.activeBorder, color: c.text } : {}),
                        color: index <= navIndex ? c.textSoft : 'transparent',
                      }}
                    >
                      <span style={styles.navIcon}>{item.icon}</span>
                      <span style={styles.navLabel}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </aside>
          )}

          <section style={styles.content}>
            {(stage === 'nav' || stage === 'cards' || stage === 'recommended' || stage === 'zero') && (
              <header style={{ ...styles.topbar, background: c.topbarBg, borderColor: c.topbarBorder }}>
                <div style={styles.topbarBrand}>
                  <div style={styles.logo}>self<span style={{ color: c.accent }}>audit</span></div>
                  <div style={{ ...styles.crumb, color: c.textFaint }}>/ command centre</div>
                </div>
                <div style={styles.topbarActions}>
                  <button type="button" style={{ ...styles.actionBtn, background: c.buttonSurface, borderColor: c.buttonBorder, color: c.textSoft }}>◐ Theme</button>
                  <button type="button" style={{ ...styles.actionBtn, background: c.buttonSurface, borderColor: c.buttonBorder, color: c.textSoft }}>Alerts <span style={{ ...styles.count, background: c.badgeBg, color: c.badgeText }}>3</span></button>
                  <button type="button" style={{ ...styles.actionBtn, background: c.buttonSurface, borderColor: c.buttonBorder, color: c.textSoft }}>diagnose a problem</button>
                  <button type="button" style={{ ...styles.primaryBtn, background: c.accent }}>map a goal</button>
                </div>
              </header>
            )}

            {stage === 'welcome' && (
              <div style={styles.centerStage}>
                <div style={styles.centerCopy}>
                  <h1 style={styles.welcomeTitle}>Welcome to SelfAudit</h1>
                  <p style={{ ...styles.welcomeCopy, color: c.textSoft }}>
                    Before you start using the dashboard, we&apos;ll show you how the workspace is structured and what each area is for.
                  </p>
                  <div style={styles.stageActions}>
                    <button type="button" style={{ ...styles.primaryCta, background: c.accent }} onClick={nextStage}>
                      Guide me
                    </button>
                    <button type="button" style={{ ...styles.ghostCta, borderColor: c.buttonBorder, color: c.textSoft }} onClick={onComplete} disabled={completing}>
                      {completing ? 'Finishing…' : 'Skip for now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(stage === 'nav' || stage === 'cards' || stage === 'recommended' || stage === 'zero') && (
              <main style={styles.main}>
                <div style={styles.cardsGrid}>
                  {DASHBOARD_CARDS.map((card, index) => (
                    <div
                      key={card.title}
                      style={{
                        ...styles.card,
                        background: c.cardBg,
                        borderColor: c.cardBorder,
                        opacity: stage === 'cards' || stage === 'recommended' || stage === 'zero'
                          ? (index <= cardIndex || stage === 'recommended' || stage === 'zero' ? 1 : 0.3)
                          : 0.28,
                        transform: stage === 'cards' || stage === 'recommended' || stage === 'zero'
                          ? (index <= cardIndex || stage === 'recommended' || stage === 'zero' ? 'translateY(0)' : 'translateY(16px)')
                          : 'translateY(16px)',
                      }}
                    >
                      <div style={{ ...styles.eyebrow, color: c.textFaint }}>{card.title}</div>
                      {index === 0 && (
                        <>
                          <div style={styles.metric}>74</div>
                          <div style={{ ...styles.metricSub, color: c.green }}>+6 this week</div>
                          <div style={{ ...styles.hint, color: c.textFaint }}>Recomputed after every audit</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {(stage === 'recommended' || stage === 'zero') && (
                  <div style={{ ...styles.recommendedCard, background: c.recommendedBg, borderColor: c.cardBorder }}>
                    <div style={{ ...styles.eyebrow, color: c.accentText }}>Recommended move</div>
                    <h2 style={styles.recommendedTitle}>Fix the handoff between audit insight and weekly execution.</h2>
                    <p style={{ ...styles.recommendedCopy, color: c.textSoft }}>
                      SelfAudit should surface the strongest next move, make it obvious, and keep the founder oriented around one decisive priority each week.
                    </p>
                  </div>
                )}

                {stage === 'zero' && (
                  <div style={styles.zeroState}>
                    <h2 style={styles.zeroTitle}>SelfAudit doesn&apos;t know your business yet.</h2>
                    <p style={{ ...styles.zeroCopy, color: c.textSoft }}>That changes after your first audit.</p>
                  </div>
                )}
              </main>
            )}
          </section>
        </div>

        {stage !== 'welcome' && stage !== 'zero' && (
          <div style={styles.calloutLayer}>
            <div style={{ ...styles.callout, color: c.callout }}>
              {stage === 'nav' ? NAV_SEQUENCE[Math.max(navIndex, 0)] : stage === 'cards' ? CARD_SEQUENCE[Math.max(cardIndex, 0)] : RECOMMENDED_COPY}
            </div>
          </div>
        )}

        {stage !== 'welcome' && (
          <div style={styles.demoControls}>
            {stage !== 'zero' && (
              <button type="button" style={{ ...styles.ghostCta, borderColor: c.buttonBorder, color: c.textSoft }} onClick={nextStage}>
                Continue
              </button>
            )}
            <button type="button" style={{ ...styles.primaryCta, background: c.accent, minWidth: 180 }} onClick={onComplete} disabled={completing}>
              {stage === 'zero' ? (completing ? 'Finishing…' : 'Start using SelfAudit') : (completing ? 'Finishing…' : 'Skip tour')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { label: 'Home', icon: '⌂' },
  { label: 'Reports', icon: '▤' },
  { label: 'Intelligence Brief', icon: '◫' },
  { label: 'What We Know', icon: '◌' },
  { label: 'Connectors', icon: '⇄' },
  { label: 'Ask SelfAudit', icon: '◎' },
]

const BOTTOM_ITEMS = [
  { label: 'Billing', icon: '◐' },
  { label: 'Account', icon: 'SV' },
]

const DASHBOARD_CARDS = [
  { title: 'Business health' },
  { title: 'Open issues' },
  { title: 'AI opportunities' },
  { title: 'Weekly digest & alerts' },
]

const THEME_MAP = {
  dark: {
    pageBg: 'radial-gradient(circle at top left, #1a2845 0%, #0e1524 48%, #09111c 100%)',
    frameBg: 'linear-gradient(180deg, #16213a 0%, #101826 100%)',
    frameBorder: 'rgba(149, 172, 216, 0.14)',
    sidebarBg: 'linear-gradient(180deg, rgba(31,48,79,0.96) 0%, rgba(15,32,57,0.98) 100%)',
    sidebarBorder: 'rgba(69, 103, 154, 0.55)',
    topbarBg: 'linear-gradient(180deg, rgba(31,48,79,0.96) 0%, rgba(15,32,57,0.98) 100%)',
    topbarBorder: 'rgba(69,103,154,0.45)',
    cardBg: 'linear-gradient(180deg, rgba(45, 63, 103, 0.7) 0%, rgba(35, 49, 80, 0.92) 100%)',
    recommendedBg: 'linear-gradient(180deg, rgba(40, 58, 95, 0.88) 0%, rgba(27, 41, 67, 0.96) 100%)',
    cardBorder: 'rgba(149, 172, 216, 0.14)',
    buttonSurface: 'rgba(255,255,255,0.03)',
    buttonBorder: 'rgba(93,127,176,0.55)',
    activeBg: 'linear-gradient(180deg, rgba(34,54,88,0.96) 0%, rgba(18,36,62,0.985) 100%)',
    activeBorder: 'rgba(93,127,176,0.55)',
    badgeBg: 'rgba(107,140,255,0.2)',
    badgeText: '#aebcff',
    accent: '#6B8CFF',
    accentText: '#aebcff',
    green: '#8ec594',
    text: '#f0f4ff',
    textSoft: '#cad5ee',
    textFaint: '#8b99bb',
    callout: 'rgba(252, 244, 218, 0.96)',
  },
  light: {
    pageBg: 'linear-gradient(180deg, #edf2fb 0%, #e2e9f4 100%)',
    frameBg: 'linear-gradient(180deg, #f7f9fd 0%, #eef3fb 100%)',
    frameBorder: 'rgba(91, 114, 156, 0.18)',
    sidebarBg: 'linear-gradient(180deg, rgba(234,240,250,0.98) 0%, rgba(225,234,247,0.98) 100%)',
    sidebarBorder: 'rgba(149, 168, 201, 0.65)',
    topbarBg: 'linear-gradient(180deg, rgba(238,243,251,0.98) 0%, rgba(230,237,248,0.98) 100%)',
    topbarBorder: 'rgba(149,168,201,0.55)',
    cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(241,245,252,0.98) 100%)',
    recommendedBg: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(242,246,252,1) 100%)',
    cardBorder: 'rgba(149, 168, 201, 0.24)',
    buttonSurface: 'rgba(255,255,255,0.8)',
    buttonBorder: 'rgba(149,168,201,0.65)',
    activeBg: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(236,242,250,0.98) 100%)',
    activeBorder: 'rgba(124,146,255,0.35)',
    badgeBg: 'rgba(107,140,255,0.15)',
    badgeText: '#4c5fb8',
    accent: '#6B8CFF',
    accentText: '#4c5fb8',
    green: '#3c8f4a',
    text: '#18253b',
    textSoft: '#41516f',
    textFaint: '#73819c',
    callout: '#53452a',
  },
  sharp: {
    pageBg: 'radial-gradient(circle at top left, #14213c 0%, #0f1526 52%, #0b1120 100%)',
    frameBg: 'linear-gradient(180deg, #1b2948 0%, #121a2d 100%)',
    frameBorder: 'rgba(128, 157, 214, 0.2)',
    sidebarBg: 'linear-gradient(180deg, rgba(31,48,79,0.98) 0%, rgba(15,32,57,1) 100%)',
    sidebarBorder: 'rgba(92, 124, 190, 0.68)',
    topbarBg: 'linear-gradient(180deg, rgba(31,48,79,0.98) 0%, rgba(15,32,57,1) 100%)',
    topbarBorder: 'rgba(92,124,190,0.58)',
    cardBg: 'linear-gradient(180deg, rgba(46, 66, 108, 0.74) 0%, rgba(35, 49, 80, 0.95) 100%)',
    recommendedBg: 'linear-gradient(180deg, rgba(42, 61, 101, 0.92) 0%, rgba(29, 42, 70, 0.98) 100%)',
    cardBorder: 'rgba(128, 157, 214, 0.18)',
    buttonSurface: 'rgba(255,255,255,0.04)',
    buttonBorder: 'rgba(107,140,255,0.42)',
    activeBg: 'linear-gradient(180deg, rgba(34,54,88,0.98) 0%, rgba(18,36,62,1) 100%)',
    activeBorder: 'rgba(107,140,255,0.42)',
    badgeBg: 'rgba(107,140,255,0.2)',
    badgeText: '#aebcff',
    accent: '#6B8CFF',
    accentText: '#aebcff',
    green: '#8ec594',
    text: '#f0f4ff',
    textSoft: '#cad5ee',
    textFaint: '#8b99bb',
    callout: 'rgba(252, 244, 218, 0.96)',
  },
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: 18,
  },
  frame: {
    position: 'relative',
    width: 'min(1480px, calc(100vw - 36px))',
    minHeight: '940px',
    margin: '0 auto',
    borderRadius: 30,
    overflow: 'hidden',
    border: '1px solid',
    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.34)',
  },
  chrome: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    minHeight: 940,
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 8px',
    borderRight: '0.5px solid',
  },
  sidebarTop: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  collapseBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.06)',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  bottomStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 8,
  },
  navItem: {
    minHeight: 34,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 10px',
    borderRadius: 10,
    border: '1px solid transparent',
    opacity: 0.18,
    transition: 'opacity 0.25s ease, transform 0.25s ease',
  },
  visibleItem: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  navIcon: {
    width: 16,
    height: 16,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontSize: 12,
  },
  navLabel: {
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  content: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    height: 54,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '0 20px',
    borderBottom: '0.5px solid',
  },
  topbarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    fontSize: 16,
    letterSpacing: '-0.04em',
  },
  crumb: {
    fontSize: 12,
  },
  topbarActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    height: 38,
    padding: '0 16px',
    borderRadius: 8,
    border: '0.5px solid',
    fontSize: 14,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  primaryBtn: {
    height: 38,
    padding: '0 16px',
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  count: {
    marginLeft: 8,
    minWidth: 22,
    height: 22,
    padding: '0 7px',
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
  },
  centerStage: {
    minHeight: 940,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  centerCopy: {
    textAlign: 'center',
    maxWidth: 720,
  },
  welcomeTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(54px, 6vw, 90px)',
    lineHeight: 1.02,
    letterSpacing: '-0.06em',
    margin: '0 0 12px',
  },
  welcomeCopy: {
    fontSize: 20,
    lineHeight: 1.7,
    margin: '0 auto',
    maxWidth: 620,
  },
  stageActions: {
    display: 'flex',
    gap: 14,
    justifyContent: 'center',
    marginTop: 28,
    flexWrap: 'wrap',
  },
  main: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
  },
  card: {
    minHeight: 164,
    padding: 20,
    borderRadius: 20,
    border: '1px solid',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: 12,
    marginBottom: 18,
  },
  metric: {
    fontSize: 54,
    lineHeight: 1,
    marginBottom: 10,
  },
  metricSub: {
    fontSize: 16,
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  recommendedCard: {
    minHeight: 280,
    borderRadius: 24,
    border: '1px solid',
    padding: '26px 28px 30px',
  },
  recommendedTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(42px, 4.8vw, 70px)',
    lineHeight: 1.03,
    letterSpacing: '-0.05em',
    margin: '0 0 16px',
    maxWidth: 1080,
  },
  recommendedCopy: {
    fontSize: 17,
    lineHeight: 1.8,
    maxWidth: 1100,
    margin: 0,
  },
  zeroState: {
    minHeight: 360,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '50px 24px 24px',
  },
  zeroTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(48px, 5.4vw, 82px)',
    lineHeight: 1.04,
    letterSpacing: '-0.05em',
    margin: '0 0 14px',
  },
  zeroCopy: {
    fontSize: 20,
    lineHeight: 1.7,
    maxWidth: 660,
    margin: 0,
  },
  calloutLayer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '140px 56px 0 0',
    pointerEvents: 'none',
  },
  callout: {
    maxWidth: 420,
    fontSize: 28,
    lineHeight: 1.35,
    fontFamily: '"Caveat", "Brush Script MT", cursive',
    textAlign: 'center',
  },
  demoControls: {
    position: 'absolute',
    right: 24,
    bottom: 22,
    zIndex: 30,
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryCta: {
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 14,
    border: 'none',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghostCta: {
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 14,
    border: '1px solid',
    background: 'rgba(10, 16, 29, 0.38)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
}
