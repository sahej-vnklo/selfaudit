import React from 'react'

export default function ExecutionReport({ report, Section, ForwardTrajectorySection, styles }) {
  return (
    <>
      {report.delivery_plan?.length > 0 && (
        <Section title="Delivery Plan">
          <div style={styles.planList}>
            {report.delivery_plan.map((s, i) => (
              <div key={i} style={styles.planItem}>
                <div style={styles.planStep}>{s.step}</div>
                <div>
                  <div style={styles.planAction}>{s.action}</div>
                  <div style={styles.planWhy}>{s.why}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.what_to_expect && (
        <Section title="What to Expect">
          <p style={styles.prose}>{report.what_to_expect}</p>
        </Section>
      )}

      {report.key_message && (
        <Section title="Key Message">
          <div style={styles.keyMessage}>
            <p style={styles.keyMessageText}>{report.key_message}</p>
          </div>
        </Section>
      )}

      <ForwardTrajectorySection
        forwardTrajectory={report.forward_trajectory}
        Section={Section}
        styles={styles}
      />
    </>
  )
}
