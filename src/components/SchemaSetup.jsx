import React, { useState, useEffect, useRef } from 'react'
import { initSupabase } from '../lib/supabase.js'

const C = {
  bg:       'var(--black)',
  surface:  'var(--surface)',
  surface2: 'var(--surface-2)',
  border:   'var(--border)',
  border2:  'var(--border-2)',
  text:     'var(--text-primary)',
  muted:    'var(--text-secondary)',
  faint:    'var(--text-tertiary)',
  accent:   'var(--accent)',
  accentText: 'var(--accent-text)',
  accentLight: 'var(--accent-light)',
}

async function getSessionToken() {
  const sb = await initSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token || ''
}

function UnitDrawer({ unit, areaLabel, customLabel, onSave, onClose }) {
  const [name, setName] = useState(customLabel || unit.label)

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 260,
      background: C.surface, borderLeft: `1px solid ${C.border2}`,
      padding: 20, overflowY: 'auto', zIndex: 10,
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>

      <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        ← back
      </button>

      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.accentText, marginBottom: 4 }}>{areaLabel}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{unit.label}</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 20 }}>{unit.description}</div>

      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faint, marginBottom: 6 }}>Rename</div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          width: '100%', background: C.surface2, border: `1px solid ${C.border2}`,
          color: C.text, fontSize: 13, padding: '7px 10px', marginBottom: 20,
        }}
      />

      {unit.interfaces?.length > 0 && (
        <>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faint, marginBottom: 6 }}>Capabilities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
            {unit.interfaces.map(i => (
              <span key={i} style={{ fontSize: 10, padding: '2px 8px', border: `1px solid ${C.border2}`, color: C.muted }}>{i}</span>
            ))}
          </div>
        </>
      )}

      {unit.properties?.length > 0 && (
        <>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.faint, marginBottom: 6 }}>Properties tracked</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {unit.properties.map(p => (
              <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
                <span style={{ color: C.text }}>{p.label}</span>
                <span style={{ color: C.faint, fontSize: 10 }}>{p.type}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => { onSave(unit.id, name.trim() || unit.label); onClose() }}
        style={{
          marginTop: 20, width: '100%', background: C.accent, border: 'none',
          color: '#fff', padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
  const [customLabels, setCustomLabels]         = useState({})
  const [editingUnit, setEditingUnit]           = useState(null) // { areaId, unitId }
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

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
    transitionTo('areas', () => {
      setSelectedIndustry(industryId)
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
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not save your blueprint.')
      onComplete()
    } catch (err) {
      setError(err?.message || 'Could not save your blueprint.')
    } finally {
      setSaving(false)
    }
  }

  const areasForIndustry = catalog
    ? Object.values(catalog.areas).filter(a => a.industries.includes(selectedIndustry))
    : []

  const unitsForArea = (areaId) => {
    if (!catalog) return []
    const area = catalog.areas[areaId]
    if (!area) return []
    return area.unitIds.map(uid => catalog.units[uid]).filter(Boolean)
  }

  const industryLabel = selectedIndustry && catalog
    ? catalog.industries.find(i => i.id === selectedIndustry)?.label || ''
    : ''

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
          <div style={{ ...phaseStyle, flex: 1, padding: 24, overflowY: 'auto' }}>
            {catalogLoading ? (
              <div style={{ color: C.muted, fontSize: 14, padding: 40 }}>Loading…</div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                  What type of business are you?
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 8,
                }}>
                  {(catalog?.industries || []).map(ind => (
                    <button
                      key={ind.id}
                      onClick={() => pickIndustry(ind.id)}
                      style={{
                        textAlign: 'left',
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        color: C.text,
                        padding: '18px 16px',
                        cursor: 'pointer',
                        minHeight: 80,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{ind.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{ind.description}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Phase: Areas ────────────────────────────────────────────── */}
        {phase === 'areas' && (
          <div style={{ ...phaseStyle, flex: 1, padding: 24, overflowY: 'auto' }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Select the areas you want to monitor
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}>
              {areasForIndustry.map(area => {
                const on = selectedAreas.includes(area.id)
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    style={{
                      textAlign: 'left',
                      background: on ? 'rgba(107,92,231,0.08)' : C.surface,
                      border: `1px solid ${on ? C.accent : C.border}`,
                      color: C.text,
                      padding: '16px',
                      cursor: 'pointer',
                      minHeight: 90,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{area.label}</div>
                      <div style={{
                        width: 14, height: 14, flexShrink: 0, marginTop: 1,
                        border: `1px solid ${on ? C.accent : C.border2}`,
                        background: on ? C.accent : 'transparent',
                        transition: 'background 0.15s, border-color 0.15s',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{area.objective}</div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
              <button
                onClick={() => transitionTo('industry', () => { setSelectedIndustry(null) })}
                style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '9px 16px', fontSize: 12, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={confirmAreas}
                disabled={!selectedAreas.length}
                style={{
                  background: selectedAreas.length ? C.accent : C.surface,
                  border: 'none', color: selectedAreas.length ? '#fff' : C.muted,
                  padding: '10px 20px', fontSize: 13, fontWeight: 600,
                  cursor: selectedAreas.length ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
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
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
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
                        background: C.surface, border: `1px solid ${C.border}`,
                        padding: 14,
                        animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.accentText, marginBottom: 10 }}>
                        {area.label}
                      </div>
                      {units.map(unit => {
                        const on = selUnits.includes(unit.id)
                        const displayLabel = customLabels[unit.id] || unit.label
                        return (
                          <div
                            key={unit.id}
                            onClick={() => toggleUnit(areaId, unit.id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 8,
                              padding: '6px 8px', cursor: 'pointer', marginBottom: 2,
                              background: on ? 'rgba(107,92,231,0.07)' : 'transparent',
                              border: `1px solid ${on ? 'rgba(107,92,231,0.25)' : 'transparent'}`,
                              transition: 'background 0.12s, border-color 0.12s',
                            }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = C.surface2 }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent' }}
                          >
                            <div style={{
                              width: 11, height: 11, flexShrink: 0, marginTop: 3,
                              border: `1px solid ${on ? C.accent : C.border2}`,
                              background: on ? C.accent : 'transparent',
                              transition: 'background 0.12s',
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{displayLabel}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 1, lineHeight: 1.4 }}>{unit.description}</div>
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
                    customLabel={customLabels[unit.id]}
                    onSave={(unitId, newLabel) => setCustomLabels(prev => ({ ...prev, [unitId]: newLabel }))}
                    onClose={() => setEditingUnit(null)}
                  />
                )
              })()}
            </div>

            {/* Right panel */}
            <div style={{
              width: 200, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
              padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
              background: C.surface,
            }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.faint, marginBottom: 12 }}>Summary</div>
                {[
                  { key: 'Industry', val: industryLabel.split(' / ')[0] },
                  { key: 'Areas', val: selectedAreas.length },
                  { key: 'Units', val: totalUnits },
                ].map(row => (
                  <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{row.key}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginTop: 'auto' }}>
                {!totalUnits
                  ? 'Select units inside each area card.'
                  : `${totalUnits} unit${totalUnits !== 1 ? 's' : ''} selected. Ready to confirm.`
                }
              </div>

              {error && (
                <div style={{ fontSize: 11, color: 'var(--red-text)', background: 'var(--red-bg)', border: '1px solid var(--red)', padding: '8px 10px', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <button
                onClick={saveBlueprint}
                disabled={!totalUnits || saving}
                style={{
                  background: totalUnits && !saving ? C.accent : C.surface2,
                  border: 'none', color: totalUnits && !saving ? '#fff' : C.muted,
                  padding: '10px', fontSize: 12, fontWeight: 600,
                  cursor: totalUnits && !saving ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Saving…' : 'Confirm blueprint'}
              </button>

              <button
                onClick={() => transitionTo('areas', () => {})}
                style={{ background: 'none', border: 'none', color: C.muted, fontSize: 11, cursor: 'pointer', padding: 0 }}
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
          borderTop: `1px solid ${C.border}`,
          padding: '12px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          background: C.surface,
          animation: 'fadeUp 0.25s ease',
        }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{industryLabel}</span>
          <button
            onClick={() => transitionTo('industry', () => { setSelectedIndustry(null); setSelectedAreas([]); setSelectedUnits({}) })}
            style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, padding: '3px 10px', cursor: 'pointer' }}
          >
            change
          </button>
        </div>
      )}

      {/* Show edit button on hover via global style */}
      <style>{`
        div:hover > .unit-edit-btn { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
