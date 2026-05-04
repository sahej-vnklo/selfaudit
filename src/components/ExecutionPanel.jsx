import React, { useState, useEffect } from 'react'

const ARTIFACT_TYPES = ['ACTION_PLAN', 'SOP', 'PROCESS_CHANGE', 'PRICING_MODEL', 'HIRING_BRIEF', 'EMAIL']

const ARTIFACT_LABELS = {
  ACTION_PLAN:    'Action Plan',
  SOP:            'Standard SOP',
  PROCESS_CHANGE: 'Process Redesign',
  PRICING_MODEL:  'Pricing Model',
  HIRING_BRIEF:   'Hiring Brief',
  EMAIL:          'Email Draft',
}

export default function ExecutionPanel({ report, userInfo }) {
  const [selectedType, setSelectedType]   = useState(null)
  const [generating, setGenerating]       = useState(false)
  const [currentArtifact, setCurrentArtifact] = useState(null)
  const [pastArtifacts, setPastArtifacts] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [expandedPast, setExpandedPast]   = useState({})
  const [copyState, setCopyState]         = useState({})
  const [error, setError]                 = useState(null)

  useEffect(() => {
    fetch('/api/generate-artifact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report, userInfo }),
    })
      .then(r => r.json())
      .then(d => { if (d.recommendations?.recommended) setRecommendations(d.recommendations.recommended) })
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!selectedType || generating) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactType: selectedType, report, userInfo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (currentArtifact) {
        setPastArtifacts(prev => [currentArtifact, ...prev])
        setExpandedPast(prev => {
          const shifted = {}
          Object.entries(prev).forEach(([k, v]) => { shifted[parseInt(k) + 1] = v })
          return shifted
        })
      }
      setCurrentArtifact(data.artifact)
      if (data.recommendations?.recommended && recommendations.length === 0) {
        setRecommendations(data.recommendations.recommended)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopySection = (key, content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyState(prev => ({ ...prev, [key]: 'copied' }))
      setTimeout(() => setCopyState(prev => ({ ...prev, [key]: 'idle' })), 2000)
    }).catch(() => {})
  }

  const handleCopyAll = (artifact, key) => {
    const lines = [artifact.title, artifact.summary, '']
    artifact.sections.forEach(s => {
      lines.push(`[${s.label.toUpperCase()}]`)
      lines.push(s.content)
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n').trimEnd()).then(() => {
      setCopyState(prev => ({ ...prev, [key]: 'copied' }))
      setTimeout(() => setCopyState(prev => ({ ...prev, [key]: 'idle' })), 2000)
    }).catch(() => {})
  }

  const isGenerateDisabled = !selectedType || generating

  return (
    <div style={ep.wrapper} data-pdf-hide>
      <div style={ep.header}>
        <h2 style={ep.sectionTitle}>Turn This Into Action</h2>
        <p style={ep.subtitle}>Generate ready-to-use outputs from your audit findings.</p>
      </div>

      <div style={ep.pillRow}>
        {ARTIFACT_TYPES.map(type => {
          const isSelected = selectedType === type
          const isRec = recommendations.includes(type)
          return (
            <button
              key={type}
              style={{
                ...ep.pill,
                ...(isSelected ? ep.pillSelected : {}),
                ...(generating ? ep.pillDisabled : {}),
              }}
              onClick={() => !generating && setSelectedType(type)}
            >
              {ARTIFACT_LABELS[type]}
              {isRec && <span style={ep.recBadge}>Recommended</span>}
            </button>
          )
        })}
      </div>

      <button
        style={{ ...ep.generateBtn, ...(isGenerateDisabled ? ep.generateBtnDisabled : {}) }}
        onClick={handleGenerate}
        disabled={isGenerateDisabled}
      >
        {generating ? (
          <span style={ep.generateBtnInner}>
            <span style={ep.spinner} />
            Generating...
          </span>
        ) : (
          `Generate ${selectedType ? ARTIFACT_LABELS[selectedType] : '...'}`
        )}
      </button>

      {error && <p style={ep.errorMsg}>{error}</p>}

      {currentArtifact && (
        <div style={ep.artifactPanel}>
          <ArtifactContent
            artifact={currentArtifact}
            copyKey="cur"
            copyState={copyState}
            onCopySection={handleCopySection}
            onCopyAll={handleCopyAll}
          />
        </div>
      )}

      {pastArtifacts.length > 0 && (
        <div style={ep.pastList}>
          {pastArtifacts.map((a, i) => (
            <div key={i} style={ep.pastCard}>
              <div
                style={ep.pastCardHeader}
                onClick={() => setExpandedPast(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <div style={ep.pastCardLeft}>
                  <span style={ep.pastTypeBadge}>{ARTIFACT_LABELS[a.type] ?? a.type}</span>
                  <span style={ep.pastTitle}>{a.title}</span>
                </div>
                <span style={ep.expandIcon}>{expandedPast[i] ? '▲' : '▼'}</span>
              </div>
              {expandedPast[i] && (
                <div style={ep.pastExpanded}>
                  <ArtifactContent
                    artifact={a}
                    copyKey={`past-${i}`}
                    copyState={copyState}
                    onCopySection={handleCopySection}
                    onCopyAll={handleCopyAll}
                    compact
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactContent({ artifact, copyKey, copyState, onCopySection, onCopyAll, compact }) {
  const copyAllKey = `${copyKey}-all`
  return (
    <>
      <div style={{ ...ep.artifactHeader, ...(compact ? ep.artifactHeaderCompact : {}) }}>
        <div style={ep.artifactTitleGroup}>
          <div style={ep.artifactTitle}>{artifact.title}</div>
          {artifact.summary && <div style={ep.artifactSummary}>{artifact.summary}</div>}
        </div>
        <button
          style={ep.copyAllBtn}
          onClick={() => onCopyAll(artifact, copyAllKey)}
        >
          {copyState[copyAllKey] === 'copied' ? '✓ Copied' : 'Copy All'}
        </button>
      </div>
      {(artifact.sections ?? []).map((s, i) => {
        const sKey = `${copyKey}-s${i}`
        const isLast = i === artifact.sections.length - 1
        return (
          <div key={i} style={isLast ? ep.sectionCardLast : ep.sectionCard}>
            <div style={ep.sectionCardHeader}>
              <span style={ep.sectionLabel}>{s.label}</span>
              <button
                style={ep.copySectionBtn}
                onClick={() => onCopySection(sKey, s.content)}
              >
                {copyState[sKey] === 'copied' ? '✓' : 'Copy'}
              </button>
            </div>
            <div style={ep.sectionContent}>{s.content}</div>
          </div>
        )
      })}
    </>
  )
}

const ep = {
  wrapper: {
    marginTop: '2.5rem',
    paddingTop: '2.5rem',
    borderTop: '0.5px solid var(--gray-200)',
    marginBottom: '2.5rem',
  },
  header: { marginBottom: '1.25rem' },
  sectionTitle: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px',
    color: 'var(--gray-400)', marginBottom: '0.375rem', fontWeight: 500,
  },
  subtitle: {
    fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, margin: 0,
  },
  pillRow: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem',
  },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    border: '1.5px solid var(--gray-200)',
    background: 'var(--white)', color: 'var(--gray-700)',
    transition: 'border-color 0.1s, background 0.1s, color 0.1s',
    lineHeight: 1,
  },
  pillSelected: {
    border: '1.5px solid var(--black)',
    background: 'var(--black)', color: 'white',
  },
  pillDisabled: {
    cursor: 'not-allowed', opacity: 0.55,
  },
  recBadge: {
    fontSize: 10, fontWeight: 600,
    color: 'var(--green)',
    letterSpacing: '0.2px',
  },
  generateBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--green)', color: 'white',
    fontSize: 14, fontWeight: 500,
    padding: '10px 20px',
    borderRadius: 'var(--radius)', border: 'none',
    cursor: 'pointer', minWidth: 160,
    transition: 'background 0.15s',
  },
  generateBtnDisabled: {
    background: 'var(--gray-200)', color: 'var(--gray-400)', cursor: 'not-allowed',
  },
  generateBtnInner: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
  errorMsg: {
    fontSize: 12, color: '#A32D2D', marginTop: 8,
  },
  artifactPanel: {
    marginTop: '1.25rem',
    border: '1.5px solid var(--green)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  artifactHeader: {
    background: 'var(--green)',
    padding: '14px 18px',
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 12,
  },
  artifactHeaderCompact: {
    background: 'var(--green-light)',
    borderBottom: '0.5px solid var(--green-mid)',
  },
  artifactTitleGroup: { flex: 1, minWidth: 0 },
  artifactTitle: {
    fontSize: 14, fontWeight: 500, color: 'white',
    lineHeight: 1.4, marginBottom: 4,
  },
  artifactSummary: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic', lineHeight: 1.5,
  },
  copyAllBtn: {
    flexShrink: 0,
    fontSize: 11, fontWeight: 500, color: 'white',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 'var(--radius-sm)', padding: '5px 10px',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  sectionCard: {
    padding: '14px 18px',
    borderBottom: '0.5px solid var(--gray-200)',
    background: 'var(--white)',
  },
  sectionCardLast: {
    padding: '14px 18px',
    background: 'var(--white)',
  },
  sectionCardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 500, color: 'var(--gray-400)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  copySectionBtn: {
    fontSize: 11, color: 'var(--gray-500)',
    background: 'none',
    border: '0.5px solid var(--gray-200)',
    borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
    flexShrink: 0,
  },
  sectionContent: {
    fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.75,
    whiteSpace: 'pre-wrap', margin: 0,
  },
  pastList: {
    marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8,
  },
  pastCard: {
    border: '0.5px solid var(--gray-200)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    background: 'var(--white)',
  },
  pastCardHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px', cursor: 'pointer',
    userSelect: 'none',
  },
  pastCardLeft: {
    display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
  },
  pastTypeBadge: {
    fontSize: 10, fontWeight: 600, color: 'var(--green)',
    background: 'var(--green-light)',
    borderRadius: 4, padding: '2px 7px',
    letterSpacing: '0.2px', flexShrink: 0,
  },
  pastTitle: {
    fontSize: 13, fontWeight: 500, color: 'var(--black)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  expandIcon: {
    fontSize: 9, color: 'var(--gray-400)', flexShrink: 0, marginLeft: 8,
  },
  pastExpanded: {
    borderTop: '0.5px solid var(--gray-200)',
  },
}
