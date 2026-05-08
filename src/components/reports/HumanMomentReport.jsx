import React from 'react'

export default function HumanMomentReport({ report, Section, styles }) {
  return (
    <>
      {report.what_this_actually_is && (
        <Section title="What This Actually Is">
          <p style={styles.prose}>{report.what_this_actually_is}</p>
        </Section>
      )}

      {report.delivery_script && (
        <Section title="What to Say">
          <div style={styles.scriptBlock}>
            <p style={styles.scriptText}>{report.delivery_script}</p>
          </div>
        </Section>
      )}

      {report.what_to_expect && (
        <Section title="What to Expect">
          <p style={styles.prose}>{report.what_to_expect}</p>
        </Section>
      )}
    </>
  )
}
