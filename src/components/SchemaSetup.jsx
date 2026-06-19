import React, { useState, useEffect, useRef } from 'react'
import { initSupabase } from '../lib/supabase.js'

const C = {
  bg:       'var(--black)',
  accent:   'var(--accent)',
  accentText: 'var(--accent-text)',
}

// All cards, panels, drawer → light surface with jet-black text
const CARD = {
  bg:             '#F9F8F6',
  bgHover:        '#F1F0EE',
  bgSelected:     'rgba(107,92,231,0.07)',
  border:         '#DEDAD5',
  borderSelected: 'var(--accent)',
  heading:        '#111111',
  body:           '#555555',
  label:          '#888888',
  inputBg:        '#EDECE9',
  pillBorder:     '#CCCAC5',
}

async function getSessionToken() {
  const sb = await initSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token || ''
}

function UnitDrawer({ unit, areaLabel, pendingOverride, onSave, onClose, allUnits }) {
  const [name, setName] = useState(pendingOverride?.label || unit.label)
  const [description, setDescription] = useState(
    pendingOverride?.description !== undefined ? pendingOverride.description : (unit.description || '')
  )
  const [properties, setProperties] = useState(() => {
    const propOverrides = pendingOverride?.properties || {}
    const customProps = pendingOverride?.customProperties || {}
    return [
      ...(unit.properties || []).map(p => ({
        ...p,
        label: propOverrides[p.key]?.label || p.label,
        _core: true,
      })),
      ...Object.entries(customProps).map(([key, val]) => ({
        key,
        label: val.label || key,
        type: val.type || 'string',
        _core: false,
      })),
    ]
  })
  const [links, setLinks] = useState(() => {
    const linkOverrides = pendingOverride?.links || {}
    return (unit.links || []).map(l => ({
      ...l,
      label: linkOverrides[l.id]?.label || l.label,
    }))
  })
  const [newPropKey, setNewPropKey] = useState('')
  const [newPropLabel, setNewPropLabel] = useState('')

  const SectionLabel = ({ text }) => (
    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: CARD.label, marginBottom: 6, marginTop: 16 }}>{text}</div>
  )

  const inputStyle = {
    width: '100%', background: CARD.inputBg, border: `1px solid ${CARD.border}`,
    color: CARD.heading, fontSize: 12, padding: '6px 9px', boxSizing: 'border-box',
  }

  const updatePropLabel = (key, val) =>
    setProperties(prev => prev.map(p => p.key === key ? { ...p, label: val } : p))

  const updateLinkLabel = (id, val) =>
    setLinks(prev => prev.map(l => l.id === id ? { ...l, label: val } : l))

  const removeCustomProp = (key) =>
    setProperties(prev => prev.filter(p => p.key !== key))

  const addCustomProp = () => {
    const k = newPropKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!k || !newPropLabel.trim()) return
    if (properties.find(p => p.key === k)) return
    setProperties(prev => [...prev, { key: k, label: newPropLabel.trim(), type: 'string', _core: false }])
    setNewPropKey('')
    setNewPropLabel('')
  }

  const handleSave = () => {
    const propOverrides = {}
    properties.filter(p => p._core).forEach(p => { propOverrides[p.key] = { label: p.label } })
    const customProperties = {}
    properties.filter(p => !p._core).forEach(p => { customProperties[p.key] = { label: p.label, type: p.type || 'string' } })
    const linkOverrides = {}
    links.forEach(l => { linkOverrides[l.id] = { label: l.label } })
    onSave(unit.id, { label: name.trim() || unit.label, description, properties: propOverrides, links: linkOverrides, customProperties })
    onClose()
  }

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 320,
      background: CARD.bg, borderLeft: `1px solid ${CARD.border}`,
      padding: 20, overflowY: 'auto', zIndex: 10,
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>

      <button onClick={onClose} style={{ background: 'none', border: 'none', color: CARD.label, fontSize: 12, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
        ← back
      </button>

      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.accentText, marginBottom: 2 }}>{areaLabel}</div>
      <div style={{ fontSize: 11, color: CARD.label, fontFamily: 'monospace', marginBottom: 14 }}>{unit.id}</div>

      <SectionLabel text="Name" />
      <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />

      <SectionLabel text="Definition" />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
      />

      <SectionLabel text="Properties" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {properties.map(p => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ fontSize: 10, color: CARD.label, width: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.key}</div>
            <input value={p.label} onChange={e => updatePropLabel(p.key, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            {!p._core && (
              <button onClick={() => removeCustomProp(p.key)} style={{ background: 'none', border: 'none', color: CARD.label, cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
        <input value={newPropKey} onChange={e => setNewPropKey(e.target.value)} placeholder="key" style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
        <input value={newPropLabel} onChange={e => setNewPropLabel(e.target.value)} placeholder="label" style={{ ...inputStyle, flex: 1, fontSize: 11 }} />
        <button onClick={addCustomProp} style={{ background: C.accent, border: 'none', color: '#fff', padding: '6px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>+</button>
      </div>

      {links.length > 0 && (
        <>
          <SectionLabel text="Relations" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {links.map(l => {
              const targetLabel = allUnits?.[l.to]?.label || l.to
              return (
                <div key={l.id}>
                  <div style={{ fontSize: 10, color: CARD.label, marginBottom: 3 }}>→ {targetLabel} <span style={{ opacity: 0.6 }}>({l.cardinality})</span></div>
                  <input value={l.label} onChange={e => updateLinkLabel(l.id, e.target.value)} style={inputStyle} />
                </div>
              )
            })}
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        style={{
          marginTop: 24, width: '100%', background: C.accent, border: 'none',
          color: '#fff', padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Save
      </button>
    </div>
  )
}

export default function SchemaSetup({ user, onComplete }) {
  const [catalog, setCatalog]           = useState(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [phase, setPhase]               = useState('industry') // 'industry' | 'areas' | 'units'
  const [phaseVisible, setPhaseVisible] = useState(true)
  const [selectedIndustry, setSelectedIndustry] = useState(null)
  const [selectedAreas, setSelectedAreas]       = useState([])
  const [selectedUnits, setSelectedUnits]       = useState({})
  const [pendingOverrides, setPendingOverrides] = useState({})
  const [editingUnit, setEditingUnit]           = useState(null) // { areaId, unitId }
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [companyName, setCompanyName]           = useState('')
  const [showCustomPanel, setShowCustomPanel]   = useState(false)
  const [customBizDesc, setCustomBizDesc]       = useState('')

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then(data => { setCatalog(data); setCatalogLoading(false) })
      .catch(() => setCatalogLoading(false))
  }, [])

  const transitionTo = (nextPhase, fn) => {
    setPhaseVisible(false)
    setTimeout(() => {
      if (fn) fn()
      setPhase(nextPhase)
      setTimeout(() => setPhaseVisible(true), 30)
    }, 280)
  }

  const pickIndustry = (industryId) => {
    setSelectedIndustry(industryId)
    if (industryId === 'other') setShowCustomPanel(true)
  }

  const submitCustomBusiness = () => {
    setShowCustomPanel(false)
  }

  const confirmIndustry = () => {
    if (!selectedIndustry || !companyName.trim()) return
    transitionTo('areas', () => {
      setSelectedAreas([])
      setSelectedUnits({})
    })
  }

  const toggleArea = (areaId) => {
    setSelectedAreas(prev =>
      prev.includes(areaId) ? prev.filter(a => a !== areaId) : [...prev, areaId]
    )
  }

  const confirmAreas = () => {
    if (!selectedAreas.length) return
    transitionTo('units', () => {})
  }

  const toggleUnit = (areaId, unitId) => {
    setSelectedUnits(prev => {
      const list = prev[areaId] || []
      return {
        ...prev,
        [areaId]: list.includes(unitId) ? list.filter(u => u !== unitId) : [...list, unitId],
      }
    })
  }

  const totalUnits = Object.values(selectedUnits).flat().length

  const saveBlueprint = async () => {
    if (!user?.id || !selectedIndustry || !selectedAreas.length) return
    setSaving(true)
    setError('')
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Sign in required.')
      const res = await fetch('/api/schema-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          industryId: selectedIndustry,
          areaIds: selectedAreas,
          unitIds: Object.values(selectedUnits).flat(),
          customBusinessName: companyName.trim() || undefined,
          customBusinessDescription: selectedIndustry === 'other' ? customBizDesc.trim() : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not save your blueprint.')

      // Apply any unit customizations made during onboarding
      if (Object.keys(pendingOverrides).length > 0) {
        await fetch('/api/schema-customizations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId: user.id, customizations: { unitTypes: pendingOverrides } }),
        })
      }

      onComplete()
    } catch (err) {
      setError(err?.message || 'Could not save your blueprint.')
    } finally {
      setSaving(false)
    }
  }

  const areasForIndustry = catalog
    ? (selectedIndustry === 'other'
        ? Object.values(catalog.areas)
        : Object.values(catalog.areas).filter(a => a.industries.includes(selectedIndustry)))
    : []

  const unitsForArea = (areaId) => {
    if (!catalog) return []
    const area = catalog.areas[areaId]
    if (!area) return []
    return area.unitIds.map(uid => catalog.units[uid]).filter(Boolean)
  }

  const industryLabel = companyName.trim()
    || (selectedIndustry === 'other'
        ? 'Something else'
        : (selectedIndustry && catalog
            ? catalog.industries.find(i => i.id === selectedIndustry)?.label || ''
            : ''))

  const phaseStyle = {
    opacity: phaseVisible ? 1 : 0,
    transform: phaseVisible ? 'none' : 'translateY(8px)',
    transition: 'opacity 0.28s ease, transform 0.28s ease',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: C.bg,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Main content area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex' }}>

        {/* ── Phase: Industry ─────────────────────────────────────────── */}
        {phase === 'industry' && (
          <div style={{ ...phaseStyle, flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Left — heading + company name input */}
            <div style={{
              width: '40%', flexShrink: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '48px 44px',
            }}>
              <h1 style={{
                fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
                fontSize: 'clamp(28px, 2.8vw, 40px)',
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                margin: '0 0 36px',
                whiteSpace: 'nowrap',
              }}>
                What type of business<br />are you ?
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                  Company name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Logistics"
                  style={{
                    width: '100%', height: 48, padding: '0 14px',
                    background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.15)`,
                    color: '#ffffff', fontSize: 15,
                    boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.4)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                  onKeyDown={e => { if (e.key === 'Enter') confirmIndustry() }}
                />
              </div>

              <button
                onClick={confirmIndustry}
                disabled={!selectedIndustry || !companyName.trim()}
                style={{
                  marginTop: 28,
                  width: '100%', height: 48,
                  background: selectedIndustry && companyName.trim() ? '#ffffff' : 'rgba(255,255,255,0.08)',
                  color: selectedIndustry && companyName.trim() ? '#111111' : 'rgba(255,255,255,0.25)',
                  border: 'none', borderRadius: 4,
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.04em',
                  cursor: selectedIndustry && companyName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {selectedIndustry && companyName.trim() ? 'Next →' : !companyName.trim() ? 'Enter company name' : 'Select a business type'}
              </button>
            </div>

            {/* Right — 3×5 visible industry grid, padded box */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 60px 0 0', position: 'relative' }}>
              <div className="sa-ind-scroll" style={{
                width: '100%',
                height: 'calc(100% - 120px)',
                overflowY: 'scroll',
              }}>
              {catalogLoading ? (
                <div style={{ color: '#888', fontSize: 14, padding: 40 }}>Loading…</div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}>
                  {(catalog?.industries || []).map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => pickIndustry(ind.id)}
                      className={selectedIndustry === ind.id ? 'sa-ind-card sa-ind-selected' : 'sa-ind-card'}
                      style={{
                        textAlign: 'left',
                        background: selectedIndustry === ind.id ? '#111111' : CARD.bg,
                        border: `1px solid ${selectedIndustry === ind.id ? C.accent : CARD.border}`,
                        padding: '16px 14px',
                        cursor: 'pointer',
                        minHeight: 90,
                        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                      }}
                    >
                      <div className="sa-ind-label" style={{ fontSize: 13, fontWeight: 700, color: selectedIndustry === ind.id ? '#E8E4DC' : CARD.heading, lineHeight: 1.3, transition: 'color 0.15s' }}>{ind.label}</div>
                      <div className="sa-ind-desc" style={{ fontSize: 11, color: selectedIndustry === ind.id ? '#888888' : CARD.body, marginTop: 5, lineHeight: 1.4, transition: 'color 0.15s' }}>{ind.description}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Custom business description panel (for "Something else") */}
              {showCustomPanel && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0, width: 300,
                  background: CARD.bg, borderLeft: `1px solid ${CARD.border}`,
                  padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                  animation: 'slideInRight 0.2s ease', zIndex: 10,
                }}>
                  <button onClick={() => setShowCustomPanel(false)} style={{ background: 'none', border: 'none', color: CARD.label, fontSize: 12, cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
                    ← back
                  </button>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: CARD.heading, marginBottom: 6 }}>Tell us more</div>
                    <div style={{ fontSize: 12, color: CARD.body, lineHeight: 1.5 }}>What does your business do?</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: CARD.label, marginBottom: 6 }}>
                      Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </div>
                    <textarea
                      value={customBizDesc}
                      onChange={e => setCustomBizDesc(e.target.value)}
                      placeholder="One or two lines about your business"
                      rows={4}
                      style={{ width: '100%', background: CARD.inputBg, border: `1px solid ${CARD.border}`, color: CARD.heading, fontSize: 13, padding: '8px 10px', boxSizing: 'border-box', resize: 'none', lineHeight: 1.5 }}
                    />
                  </div>

                  <button
                    onClick={submitCustomBusiness}
                    style={{
                      marginTop: 'auto', background: C.accent,
                      border: 'none', color: '#fff',
                      padding: '11px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >
                    Continue →
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {/* ── Phase: Areas ────────────────────────────────────────────── */}
        {phase === 'areas' && (
          <div style={{ ...phaseStyle, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Split row — left label + right grid */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Left — heading */}
              <div style={{
                width: '40%', flexShrink: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                padding: '60px 44px 48px',
              }}>
                <h1 style={{
                  fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
                  fontSize: 'clamp(28px, 2.8vw, 40px)',
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                }}>
                  Tell us where<br />to look.
                </h1>
                {selectedAreas.length > 0 && (
                  <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                    {selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {/* Right — scrollable area cards */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 60px 0 0', position: 'relative' }}>
                <div className="sa-ind-scroll" style={{
                  width: '100%',
                  height: 'calc(100% - 120px)',
                  overflowY: 'scroll',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}>
                    {areasForIndustry.map(area => {
                      const on = selectedAreas.includes(area.id)
                      return (
                        <button
                          key={area.id}
                          onClick={() => toggleArea(area.id)}
                          className={on ? 'sa-area-card sa-area-on' : 'sa-area-card'}
                          style={{
                            textAlign: 'left',
                            background: on ? '#111111' : CARD.bg,
                            border: `1px solid ${on ? C.accent : CARD.border}`,
                            padding: '16px 14px',
                            cursor: 'pointer',
                            minHeight: 90,
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div className="sa-area-label" style={{ fontSize: 13, fontWeight: 700, color: on ? '#E8E4DC' : CARD.heading, lineHeight: 1.3, transition: 'color 0.15s' }}>{area.label}</div>
                            <div style={{
                              width: 14, height: 14, flexShrink: 0, marginTop: 1,
                              border: `1px solid ${on ? C.accent : CARD.pillBorder}`,
                              background: on ? C.accent : 'transparent',
                              transition: 'background 0.15s, border-color 0.15s',
                            }} />
                          </div>
                          <div className="sa-area-desc" style={{ fontSize: 11, color: on ? '#888888' : CARD.body, lineHeight: 1.5, transition: 'color 0.15s' }}>{area.objective}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar — Back + Continue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `1px solid ${CARD.border}` }}>
              <button
                onClick={() => transitionTo('industry', () => { setSelectedIndustry(null) })}
                style={{ background: 'none', border: `1px solid #444`, color: '#AAAAAA', padding: '9px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Back
              </button>
              <button
                onClick={confirmAreas}
                disabled={!selectedAreas.length}
                style={{
                  background: selectedAreas.length ? C.accent : '#2A2A2A',
                  border: 'none', color: selectedAreas.length ? '#fff' : '#666',
                  padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  cursor: selectedAreas.length ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: Units ────────────────────────────────────────────── */}
        {phase === 'units' && (
          <div style={{ ...phaseStyle, flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Canvas */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', position: 'relative' }}>
              <div style={{ fontSize: 13, color: '#AAAAAA', marginBottom: 20 }}>
                Select the units to track in each area
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
              }}>
                {selectedAreas.map((areaId, i) => {
                  const area = catalog?.areas[areaId]
                  if (!area) return null
                  const units = unitsForArea(areaId)
                  const selUnits = selectedUnits[areaId] || []
                  return (
                    <div
                      key={areaId}
                      style={{
                        background: CARD.bg, border: `1px solid ${CARD.border}`,
                        padding: 14,
                        animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.accentText, marginBottom: 10 }}>
                        {area.label}
                      </div>
                      {units.map(unit => {
                        const on = selUnits.includes(unit.id)
                        const displayLabel = pendingOverrides[unit.id]?.label || unit.label
                        return (
                          <div
                            key={unit.id}
                            onClick={() => toggleUnit(areaId, unit.id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 8,
                              padding: '6px 8px', cursor: 'pointer', marginBottom: 2,
                              background: on ? CARD.bgSelected : 'transparent',
                              border: `1px solid ${on ? 'rgba(107,92,231,0.3)' : 'transparent'}`,
                              transition: 'background 0.12s, border-color 0.12s',
                            }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = CARD.bgHover }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                          >
                            <div style={{
                              width: 11, height: 11, flexShrink: 0, marginTop: 3,
                              border: `1px solid ${on ? C.accent : CARD.pillBorder}`,
                              background: on ? C.accent : 'transparent',
                              transition: 'background 0.12s',
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: CARD.heading }}>{displayLabel}</div>
                              <div style={{ fontSize: 11, color: CARD.body, marginTop: 1, lineHeight: 1.4 }}>{unit.description}</div>
                            </div>
                            <div
                              onClick={e => { e.stopPropagation(); setEditingUnit({ areaId, unitId: unit.id }) }}
                              style={{
                                fontSize: 10, color: C.accentText, cursor: 'pointer',
                                padding: '2px 6px', border: `1px solid rgba(107,92,231,0.3)`,
                                flexShrink: 0, opacity: 0, transition: 'opacity 0.1s',
                              }}
                              className="unit-edit-btn"
                            >
                              edit
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {editingUnit && catalog && (() => {
                const area = catalog.areas[editingUnit.areaId]
                const unit = catalog.units[editingUnit.unitId]
                if (!area || !unit) return null
                return (
                  <UnitDrawer
                    unit={unit}
                    areaLabel={area.label}
                    pendingOverride={pendingOverrides[unit.id]}
                    allUnits={catalog.units}
                    onSave={(unitId, overrides) => setPendingOverrides(prev => ({ ...prev, [unitId]: overrides }))}
                    onClose={() => setEditingUnit(null)}
                  />
                )
              })()}
            </div>

            {/* Right panel */}
            <div style={{
              width: 200, flexShrink: 0, borderLeft: `1px solid ${CARD.border}`,
              padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
              background: CARD.bg,
            }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: CARD.label, marginBottom: 12 }}>Summary</div>
                {[
                  { key: 'Industry', val: industryLabel.split(' / ')[0] },
                  { key: 'Areas', val: selectedAreas.length },
                  { key: 'Units', val: totalUnits },
                ].map(row => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${CARD.border}` }}>
                    <span style={{ fontSize: 12, color: CARD.body }}>{row.key}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: CARD.heading }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: CARD.body, lineHeight: 1.6, marginTop: 'auto' }}>
                {!totalUnits
                  ? 'Select units inside each area card.'
                  : `${totalUnits} unit${totalUnits !== 1 ? 's' : ''} selected. Ready to confirm.`
                }
              </div>

              {error && (
                <div style={{ fontSize: 11, color: '#C05050', background: '#FDF0F0', border: '1px solid #E8C0C0', padding: '8px 10px', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button
                onClick={saveBlueprint}
                disabled={!totalUnits || saving}
                style={{
                  background: totalUnits && !saving ? C.accent : CARD.inputBg,
                  border: 'none', color: totalUnits && !saving ? '#fff' : CARD.label,
                  padding: '10px', fontSize: 12, fontWeight: 600,
                  cursor: totalUnits && !saving ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Saving…' : 'Confirm blueprint'}
              </button>

              <button
                onClick={() => transitionTo('areas', () => {})}
                style={{ background: 'none', border: 'none', color: CARD.label, fontSize: 11, cursor: 'pointer', padding: 0 }}
              >
                ← Change areas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar — shows selected industry once picked ────────── */}
      {selectedIndustry && phase !== 'industry' && (
        <div style={{
          borderTop: `1px solid ${CARD.border}`,
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          background: CARD.bg,
          animation: 'fadeUp 0.25s ease',
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: CARD.heading }}>{industryLabel}</span>
          <button
            onClick={() => transitionTo('industry', () => { setSelectedIndustry(null); setSelectedAreas([]); setSelectedUnits({}) })}
            style={{ background: 'none', border: `1px solid ${CARD.pillBorder}`, color: CARD.label, fontSize: 11, padding: '3px 10px', cursor: 'pointer' }}
          >
            change
          </button>
        </div>
      )}

      <style>{`
        div:hover > .unit-edit-btn { opacity: 1 !important; }

        /* Industry cards: dark bg + white text on hover */
        .sa-ind-card:hover { background: #111111 !important; border-color: var(--accent) !important; }
        .sa-ind-card:hover .sa-ind-label { color: #E8E4DC !important; }
        .sa-ind-card:hover .sa-ind-desc  { color: #888888 !important; }

        /* Area cards: white text when selected (dark bg) */
        .sa-area-on .sa-area-label { color: #E8E4DC !important; }
        .sa-area-on .sa-area-desc  { color: #888888 !important; }

        /* Visible scrollbar on the industry grid */
        .sa-ind-scroll::-webkit-scrollbar { width: 6px; }
        .sa-ind-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 3px; }
        .sa-ind-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 3px; }
        .sa-ind-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.38); }
      `}</style>
    </div>
  )
}
