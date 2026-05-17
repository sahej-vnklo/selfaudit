import React from 'react'

export default function DiagnosticReport({
  report,
  userInfo,
  Section,
  GoalGapPanel,
  ForwardTrajectorySection,
  ExecutionPanel,
  styles,
  statusColor,
  statusBg,
  statusLabel,
}) {
  return (
    <>
      {report.goal_gap_analysis && (
        <GoalGapPanel
          gap={report.goal_gap_analysis}
          missingCapabilities={report.missing_capabilities}
          rankingLogic={report.ranking_logic}
          timelineFeasibility={report.timeline_feasibility}
          confidenceLevel={report.confidence_level}
        />
      )}

      <Section title="Domain Findings">
        <div style={styles.domainsGrid}>
          {report.domains?.map((d, i) => (
            <div key={i} style={{ ...styles.domainCard, borderTop: `3px solid ${statusColor[d.status]}` }}>
              <div style={styles.domainTop}>
                <span style={styles.domainName}>{d.name}</span>
                <span style={{
                  ...styles.badge,
                  background: statusBg[d.status],
                  color: statusColor[d.status],
                }}>{statusLabel[d.status]}</span>
              </div>
              <p style={styles.domainFinding}>{d.finding}</p>
              <p style={styles.domainAction}>→ {d.action}</p>
            </div>
          ))}
        </div>
      </Section>

      {report.non_ai_fixes?.length > 0 && (
        <Section title="Fix These First">
          <div style={styles.fixList}>
            {report.non_ai_fixes.map((f, i) => (
              <div key={i} style={styles.fixItem}>
                <div style={styles.fixIssue}>{f.issue}</div>
                <div style={styles.fixSolution}>{f.fix}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.ai_opportunities?.length > 0 && (
        <Section title="If You Actually Built This">
          <div style={styles.aiList}>
            {report.ai_opportunities.map((a, i) => (
              <div key={i} style={styles.aiItem}>
                <div style={styles.aiArea}>{a.area}</div>
                <div style={styles.aiWhy}>{a.why}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Priority Actions">
        <div style={styles.actions}>
          {report.priority_actions?.map((a, i) => (
            <div key={i} style={styles.action}>
              <div style={styles.actionNum}>{i + 1}</div>
              <div style={styles.actionText}>{a}</div>
            </div>
          ))}
        </div>
      </Section>

      <ForwardTrajectorySection
        forwardTrajectory={report.forward_trajectory}
        Section={Section}
        styles={styles}
      />

      <ExecutionPanel report={report} userInfo={userInfo} />
    </>
  )
}
