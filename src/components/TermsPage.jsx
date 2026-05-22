import React from 'react'
import { PRIVACY_POLICY_URL } from '../lib/legal.js'

const sections = [
  {
    title: '1. The Service',
    body: [
      'SelfAudit is an AI-powered business diagnostic and advisory product operated by Vnklo. It provides operational analysis, business health monitoring, and strategic recommendations based on information you provide and, where available, connected business data.',
      'SelfAudit is not a law firm, accounting firm, licensed financial advisor, or management consultancy. Its outputs are informational tools to support decision-making and should not be treated as professional legal, financial, tax, or investment advice.',
    ],
  },
  {
    title: '2. Accounts',
    body: [
      'You may use certain SelfAudit experiences without creating an account. To save reports, access paid features, or use persistent account-based functionality, you must register with accurate account information.',
      'You are responsible for maintaining the confidentiality of your account and for activity that occurs under it.',
    ],
  },
  {
    title: '3. Plans, Billing, and Cancellation',
    body: [
      'SelfAudit currently offers a free audit experience, a Foundation plan, and an Intelligence plan. Current features and pricing are described on tryselfaudit.com and may be updated from time to time.',
      'Paid subscriptions are billed on a recurring monthly basis through Stripe unless otherwise stated. You may cancel at any time. Cancellation takes effect at the end of the current billing period. Except where required by law, payments are non-refundable once a billing period has started.',
    ],
  },
  {
    title: '4. Free Access',
    body: [
      'Any free audit or free-access experience is provided as-is so you can evaluate the product. We may modify, limit, or discontinue free access at any time.',
    ],
  },
  {
    title: '5. Your Data',
    body: [
      'You retain ownership of the business information, documents, and other content you provide to SelfAudit.',
      'By using the service, you grant us a limited right to host, process, transmit, and analyze that information as needed to operate the service, generate outputs, provide support, maintain security, and improve reliability and product performance.',
    ],
  },
  {
    title: '6. Privacy',
    body: [
      'Our Privacy Policy explains how we collect, use, and protect personal information. By using SelfAudit, you also acknowledge that policy.',
    ],
  },
  {
    title: '7. Acceptable Use',
    body: [
      'You agree not to use SelfAudit for unlawful activity, attempt to reverse engineer or copy the service, scrape data from the product, interfere with service operations, submit information you do not have the right to use, or misuse the product in a way that harms us, other users, or third parties.',
    ],
  },
  {
    title: '8. Availability and Changes',
    body: [
      'We may update, improve, limit, or discontinue parts of the service from time to time. We do not guarantee uninterrupted availability or that every feature will always remain available in the same form.',
    ],
  },
  {
    title: '9. Disclaimers and Limitation of Liability',
    body: [
      'SelfAudit generates outputs using AI systems and the information available to it. We do not guarantee that outputs will always be accurate, complete, or suitable for any particular business decision.',
      'To the maximum extent permitted by law, Vnklo is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost revenue, lost business opportunity, lost goodwill, lost data, or business interruption arising from or related to your use of SelfAudit.',
      'To the maximum extent permitted by law, our aggregate liability for claims arising out of or relating to SelfAudit will not exceed the amount you paid us in the three months before the event giving rise to the claim.',
    ],
  },
  {
    title: '10. Suspension and Termination',
    body: [
      'We may suspend or terminate access to SelfAudit if you violate these terms, misuse the service, create security or legal risk, engage in fraud, or if suspension or termination is reasonably necessary to protect the service, our users, or third parties.',
      'Where practical, we will provide reasonable notice. You may stop using the service or cancel your account at any time. Data handling after cancellation or deletion is governed by our Privacy Policy.',
    ],
  },
  {
    title: '11. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. If we make material changes, we may provide notice through the site, the product, or email. Continued use of SelfAudit after updated Terms take effect constitutes acceptance of the updated Terms.',
    ],
  },
  {
    title: '12. Governing Law',
    body: [
      'These Terms are governed by the laws of the Province of Quebec and the applicable laws of Canada, without regard to conflict-of-law principles. Any disputes arising from these Terms will be resolved in the courts located in Montreal, Quebec, unless applicable law requires otherwise.',
    ],
  },
  {
    title: '13. Contact',
    body: [
      'For questions about these Terms, contact Vnklo at sahej@vnklo.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topRow}>
          <a href="#/" style={styles.backLink}>← Back to SelfAudit</a>
        </div>

        <header style={styles.header}>
          <div style={styles.eyebrow}>Legal</div>
          <h1 style={styles.title}>Terms of Service</h1>
          <p style={styles.meta}>Last updated: May 22, 2026</p>
          <p style={styles.intro}>
            These Terms of Service govern your use of SelfAudit at tryselfaudit.com, operated by Vnklo. By accessing or using SelfAudit, you agree to these Terms.
          </p>
        </header>

        <main style={styles.content}>
          {sections.map((section) => (
            <section key={section.title} style={styles.section}>
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} style={styles.paragraph}>
                  {paragraph === 'Our Privacy Policy explains how we collect, use, and protect personal information. By using SelfAudit, you also acknowledge that policy.'
                    ? <>Our <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={styles.inlineLink}>Privacy Policy</a> explains how we collect, use, and protect personal information. By using SelfAudit, you also acknowledge that policy.</>
                    : paragraph}
                </p>
              ))}
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F6F1E8',
    color: '#1E1A16',
  },
  shell: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '32px 20px 80px',
  },
  topRow: {
    marginBottom: 24,
  },
  backLink: {
    color: '#8A5A1F',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
  },
  header: {
    background: '#FBF7F2',
    border: '1px solid #E6D9C9',
    borderRadius: 18,
    padding: '32px 28px',
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#8A5A1F',
    fontWeight: 700,
    marginBottom: 10,
  },
  title: {
    fontFamily: '"DM Serif Display", serif',
    fontSize: 'clamp(32px, 5vw, 48px)',
    lineHeight: 1.05,
    margin: '0 0 10px',
  },
  meta: {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#6B6257',
  },
  intro: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.75,
    color: '#3A342D',
  },
  content: {
    background: '#FBF7F2',
    border: '1px solid #E6D9C9',
    borderRadius: 18,
    padding: '12px 28px 24px',
  },
  section: {
    padding: '20px 0',
    borderBottom: '1px solid #EFE4D7',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 1.3,
    margin: '0 0 12px',
    color: '#1E1A16',
  },
  paragraph: {
    margin: '0 0 12px',
    fontSize: 15,
    lineHeight: 1.8,
    color: '#3A342D',
  },
  inlineLink: {
    color: '#8A5A1F',
  },
}
