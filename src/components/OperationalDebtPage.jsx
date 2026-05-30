import React from 'react'

const sections = [
  {
    title: 'What Operational Debt Actually Is',
    paragraphs: [
      'Operational debt is what accumulates every time a business grows without fixing the systems underneath the growth.',
      'A workaround that saved time in 2022 becomes a dependency by 2024. A manual process that one person owns becomes a single point of failure nobody notices until that person takes a week off. A decision that was right at $500K revenue becomes the bottleneck at $2M.',
    ],
    bullets: [
      "The team member who can't take a real vacation because the operation stops without them",
      'The approval process that requires six people to move one thing forward',
      'The onboarding workflow that runs on memory, WhatsApp messages, and goodwill',
      'The pricing structure that made sense three years ago and now creates a different argument on every invoice',
      'The sales process that closes deals fine but hemorrhages margin in delivery',
    ],
    closing: [
      "None of these feel like emergencies. That's what makes operational debt dangerous.",
      "It doesn't announce itself. It just raises the cost of every unit of growth until scaling feels impossible — not because the market dried up, but because the operation underneath can't carry the weight.",
    ],
  },
  {
    title: 'The Cost Nobody Calculates',
    paragraphs: [
      "Here's a number worth sitting with.",
      'A business doing $1M in annual revenue, carrying moderate operational debt — one broken handoff, one key-person dependency, one undefined process generating regular escalations — is consistently losing an estimated 20–25% of its productive capacity — absorbed into friction, rework, and decisions that should have been systematized rather than made fresh every time.',
      "That's $230,000 a year in absorbed cost. Not invoiced. Not tracked. Just gone — into the friction, the rework, the decisions that should have been pre-made, the fires that should never have started.",
      'At $3M revenue, that number becomes $690,000.',
      "The business isn't failing. It's paying a tax it doesn't know it's paying.",
    ],
  },
  {
    title: 'Why It Accumulates',
    paragraphs: [
      "Operational debt isn't a management failure. It's an infrastructure failure.",
      'Large companies have systems that surface operational breakdown before it becomes critical. They have fractional COOs, management consultants, internal analytics, and diagnostic frameworks that tell them exactly where performance is degrading — and when.',
      'A founder running a $2M business has none of that.',
      "They have instinct. They have whoever's loudest in the room. They have a quarterly review that looks at revenue and expenses and tells them nothing about the system generating those numbers.",
      "So the debt accumulates. Not from negligence — from the absence of a diagnostic layer that would catch it.",
      "The consultant who could provide that layer costs $400 an hour, shows up once, and leaves a slide deck. The advice is generic because they don't know the business. And six months later the same problems are back, repackaged.",
      'This is why operational debt compounds. The infrastructure to measure it has always been out of reach for the businesses that need it most.',
    ],
  },
  {
    title: 'What Zero Operational Debt Looks Like',
    paragraphs: [
      "It doesn't mean a perfect business. It means a legible one.",
      'A business with low operational debt knows exactly where its ceiling is and why. It can name the one process generating 70% of its escalations. It knows which role, if vacated tomorrow, would stop the operation. It knows the gap between where it is and where it needs to be — and has a ranked path to close it.',
      "These businesses don't move faster because they're smarter. They move faster because they're not carrying weight they can't see.",
      'Every decision is made with an accurate picture of the system underneath it. Every growth move lands on a foundation that can carry it.',
      "That's the difference between a business that scales and a business that stays stuck at the same revenue for three years wondering what's wrong.",
    ],
  },
  {
    title: 'The Measurement Problem',
    paragraphs: [
      'You cannot reduce operational debt you cannot measure.',
      "That's the trap. The businesses that need a diagnostic layer the most are the ones that have never had access to one.",
      'Until now, the options were:',
    ],
    options: [
      ['Gut feel', 'fast, free, and wrong often enough to be expensive.'],
      ['Hiring a consultant', "slow, expensive, one-time, and generic by design. They don't know your business. They know their framework."],
      ['Business books and podcasts', "built for an average business that doesn't exist. Not for yours."],
    ],
    closing: [
      "None of these give you what you actually need: an honest, specific picture of where your operation is breaking down, updated continuously, grounded in how your business actually runs.",
    ],
  },
  {
    title: 'The Category SelfAudit Is Building',
    paragraphs: [
      'SelfAudit is built to measure and reduce operational debt.',
      "Not through a form. Not through a generic framework. Through a diagnostic conversation that learns how your specific business operates — and gets sharper every time you use it.",
      "It doesn't tell you what every business in your industry should do. It tells you what your business needs to do next, based on what's actually breaking down inside it.",
      "After every session, it updates its model of your business. It tracks whether you're improving or accumulating more debt. It monitors your operation automatically and alerts you when something needs attention before it becomes a crisis.",
      "It's the diagnostic layer that's always been out of reach for businesses under $10M.",
      "It's available now. Free to start.",
    ],
  },
]

export default function OperationalDebtPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topRow}>
          <a href="#/" style={styles.backLink}>← Back to SelfAudit</a>
        </div>

        <header style={styles.hero}>
          <div style={styles.eyebrow}>Field Note</div>
          <h1 style={styles.title}>Operational Debt: The Silent Cost Killing Small Businesses</h1>
          <p style={styles.byline}>Published by SelfAudit</p>
          <p style={styles.lead}>Every business carries debt that doesn&apos;t appear on any balance sheet.</p>
          <p style={styles.sublead}>
            Not financial debt. Not technical debt. <em style={styles.subleadAccent}>Operational debt.</em>
          </p>
          <p style={styles.intro}>
            It&apos;s the accumulated weight of decisions deferred, processes normalized, and problems absorbed into the daily rhythm of the business until nobody questions them anymore. It doesn&apos;t show up in your P&amp;L. It doesn&apos;t trigger an alert. It just quietly compounds — until the business hits a ceiling it can&apos;t explain and can&apos;t break through.
          </p>
          <p style={styles.intro}>Most founders never name it. They just feel it.</p>
        </header>

        <main style={styles.content}>
          {sections.map((section) => (
            <section key={section.title} style={styles.section}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} style={styles.paragraph}>{paragraph}</p>
              ))}
              {section.bullets?.length ? (
                <ul style={styles.list}>
                  {section.bullets.map((bullet) => (
                    <li key={bullet} style={styles.listItem}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.options?.length ? (
                <div style={styles.optionsWrap}>
                  {section.options.map(([label, body]) => (
                    <p key={label} style={styles.paragraph}>
                      <strong style={styles.optionLabel}>{label}</strong> — {body}
                    </p>
                  ))}
                </div>
              ) : null}
              {section.closing?.map((paragraph) => (
                <p key={paragraph} style={styles.paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>The Question Worth Asking</h2>
            <p style={styles.paragraph}>Every founder reading this is carrying some amount of operational debt.</p>
            <p style={styles.paragraph}>The question isn&apos;t whether it exists. The question is whether you know where it is, what it&apos;s costing you, and what it would take to reduce it.</p>
            <p style={styles.paragraph}>If you can&apos;t answer those three questions clearly — that&apos;s the debt talking.</p>
            <p style={styles.ctaLine}>
              <a href="#/" style={styles.ctaLink}>Run your first audit free at tryselfaudit.com</a>
            </p>
            <p style={styles.ctaNote}>No login. No credit card. One conversation that tells you what&apos;s actually wrong.</p>
          </section>
        </main>

        <footer style={styles.footer}>
          <p style={styles.footerText}>
            SelfAudit is an AI business advisor that learns how your business operates, diagnoses what&apos;s holding it back, and tracks your operational health over time. Built for founders and operators who make decisions without the infrastructure that larger companies take for granted.
          </p>
        </footer>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0707',
    color: '#f4ebe3',
  },
  shell: {
    maxWidth: 980,
    margin: '0 auto',
    padding: '32px 20px 96px',
  },
  topRow: {
    marginBottom: 24,
  },
  backLink: {
    color: '#cf6544',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  hero: {
    background: 'linear-gradient(180deg, rgba(26,17,16,0.95), rgba(10,7,7,0.98))',
    border: '1px solid rgba(244,235,227,0.08)',
    borderRadius: 24,
    padding: '44px 32px 38px',
    marginBottom: 24,
    boxShadow: '0 40px 80px -42px rgba(0,0,0,0.9)',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: '#cf6544',
    fontWeight: 600,
    marginBottom: 14,
  },
  title: {
    fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
    fontSize: 'clamp(42px, 7vw, 76px)',
    lineHeight: 0.97,
    letterSpacing: '-0.03em',
    fontWeight: 500,
    margin: '0 0 14px',
  },
  byline: {
    margin: '0 0 26px',
    color: '#a89a91',
    fontSize: 14,
  },
  lead: {
    margin: '0 0 8px',
    fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
    fontSize: 'clamp(28px, 4.2vw, 46px)',
    lineHeight: 1.08,
    letterSpacing: '-0.02em',
  },
  sublead: {
    margin: '0 0 22px',
    fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
    fontSize: 'clamp(28px, 4.2vw, 46px)',
    lineHeight: 1.08,
    letterSpacing: '-0.02em',
  },
  subleadAccent: {
    color: '#cf6544',
    fontStyle: 'italic',
    fontWeight: 400,
  },
  intro: {
    margin: '0 0 16px',
    fontSize: 18,
    lineHeight: 1.85,
    color: '#d4c8c1',
    maxWidth: '62ch',
  },
  content: {
    background: 'rgba(244,235,227,0.03)',
    border: '1px solid rgba(244,235,227,0.08)',
    borderRadius: 24,
    padding: '10px 32px 20px',
    backdropFilter: 'blur(6px)',
  },
  section: {
    padding: '24px 0',
    borderBottom: '1px solid rgba(244,235,227,0.08)',
  },
  sectionTitle: {
    margin: '0 0 14px',
    fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
    fontSize: 36,
    lineHeight: 1.02,
    letterSpacing: '-0.02em',
    fontWeight: 500,
    color: '#f4ebe3',
  },
  paragraph: {
    margin: '0 0 16px',
    fontSize: 17,
    lineHeight: 1.9,
    color: '#d4c8c1',
  },
  list: {
    margin: '0 0 18px',
    paddingLeft: 24,
    color: '#d4c8c1',
  },
  listItem: {
    marginBottom: 10,
    fontSize: 17,
    lineHeight: 1.8,
  },
  optionsWrap: {
    marginBottom: 6,
  },
  optionLabel: {
    color: '#f4ebe3',
    fontWeight: 600,
  },
  ctaLine: {
    margin: '8px 0 10px',
  },
  ctaLink: {
    color: '#cf6544',
    fontWeight: 600,
    textDecoration: 'none',
  },
  ctaNote: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.8,
    color: '#a89a91',
  },
  footer: {
    padding: '28px 4px 0',
  },
  footerText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#8f8179',
  },
}
