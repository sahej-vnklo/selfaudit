import React from 'react'

export default function GoalGapReport({ report, Section, styles }) {
  const gap = report.goal_gap_analysis || {}
  const missingCapabilities = report.missing_capabilities || []
  const priorityActions = report.priority_actions || []
  const ranking = report.ranking_logic || {}
  const feasibilityText = report.timeline_feasibility || ''
  const feasibilityTone = feasibilityText.toLowerCase()
  const badgeTone = feasibilityTone.startsWith('unrealistic')
    ? { bg: '#FCEBEB', color: '#A32D2D', label: 'Unrealistic' }
    : feasibilityTone.startsWith('tight')
      ? { bg: '#FAEEDA', color: '#BA7517', label: 'Tight' }
      : { bg: '#E1F5EE', color: '#1D9E75', label: 'Feasible' }

  const gapRows = [
    ['Goal', gap.goal],
    ['Current Position', gap.current_position],
    ['The Gap', gap.gap],
    ['Fastest Path', gap.fastest_path],
    ['Realistic Timeline', gap.realistic_timeline],
  ].filter(([, value]) => value)

  const rankingCells = [
    ['Impact', ranking.impact],
    ['Urgency', ranking.urgency],
    ['Cost', ranking.cost],
    ['Dependency', ranking.dependency],
  ]

  const g = {
    panel: { display: 'flex', flexDirection: 'column', gap: 10 },
    block: {
      background: 'var(--surface)', border: '0.5px solid var(--gray-200)',
      borderRadius: 'var(--radius)', padding: '1rem 1.125rem',
    },
    label: {
      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
      color: 'var(--gray-400)', marginBottom: 6, fontWeight: 500,
    },
    text: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.7, margin: 0 },
    bulletList: { margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 },
    bulletItem: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.6 },
    rankingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 },
    rankingCell: {
      background: 'var(--surface2)', border: '0.5px solid var(--gray-200)',
      borderRadius: 'var(--radius)', padding: '1rem',
    },
    rankingValue: { fontSize: 14, color: 'var(--text)', lineHeight: 1.5, margin: 0, fontWeight: 500 },
    timelineRow: { display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
    timelineText: { fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.6, margin: 0, flex: 1 },
  }

  return (
    <>
      {report.overall_verdict && (
        <Section title="Overall Verdict">
          <p style={styles.verdict}>{report.overall_verdict}</p>
        </Section>
      )}

      {gapRows.length > 0 && (
        <Section title="Goal Gap Analysis">
          <div style={g.panel}>
            {gapRows.map(([label, value]) => (
              <div key={label} style={g.block}>
                <p style={g.label}>{label}</p>
                <p style={g.text}>{value}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {missingCapabilities.length > 0 && (
        <Section title="Missing Capabilities">
          <ul style={g.bulletList}>
            {missingCapabilities.map((item, i) => (
              <li key={i} style={g.bulletItem}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Ranking Logic">
        <div style={g.rankingGrid}>
          {rankingCells.map(([label, value]) => (
            <div key={label} style={g.rankingCell}>
              <p style={g.label}>{label}</p>
              <p style={g.rankingValue}>{value || '—'}</p>
            </div>
          ))}
        </div>
      </Section>

      {feasibilityText && (
        <Section title="Timeline Feasibility">
          <div style={g.timelineRow}>
            <span style={{ ...styles.badge, background: badgeTone.bg, color: badgeTone.color }}>
              {badgeTone.label}
            </span>
            <p style={g.timelineText}>{feasibilityText}</p>
          </div>
        </Section>
      )}

      {priorityActions.length > 0 && (
        <Section title="Priority Actions">
          <div style={styles.actions}>
            {priorityActions.map((action, i) => (
              <div key={i} style={styles.action}>
                <div style={styles.actionNum}>{i + 1}</div>
                <div style={styles.actionText}>{action}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="The Honest Truth">
        <div style={styles.truth}>
          <p style={styles.truthText}>{report.honest_truth}</p>
        </div>
      </Section>
    </>
  )
}
