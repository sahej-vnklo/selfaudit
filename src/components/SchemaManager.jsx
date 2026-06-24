import React, { useState, useEffect, useCallback } from 'react'
import { initSupabase } from '../lib/supabase.js'

async function getToken() {
  const sb = await initSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token || ''
}

// Apply label/property overrides from customizations onto a unit type object
function applyOverrides(unit, customizations) {
  const overrides = customizations?.unitTypes?.[unit.id] || {}
  const propOverrides = overrides.properties || {}
  const linkOverrides = overrides.links || {}
  const customProps = overrides.customProperties || {}

  return {
    ...unit,
    label: overrides.label || unit.label,
    description: overrides.description !== undefined ? overrides.description : unit.description,
    properties: [
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
    ],
    links: (unit.links || []).map(l => ({
      ...l,
      label: linkOverrides[l.id]?.label || l.label,
      _core: true,
    })),
  }
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditUnitModal({ unit, onSave, onClose }) {
  const [label, setLabel] = useState(unit.label)
  const [description, setDescription] = useState(unit.description || '')
  const [properties, setProperties] = useState(
    (unit.properties || []).map(p => ({ ...p }))
  )
  const [links, setLinks] = useState(
    (unit.links || []).map(l => ({ ...l }))
  )
  const [newPropKey, setNewPropKey] = useState('')
  const [newPropLabel, setNewPropLabel] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleSave = async () => {
    setSaving(true)
    // Build the overrides object
    const propOverrides = {}
    properties.filter(p => p._core).forEach(p => {
      propOverrides[p.key] = { label: p.label }
    })
    const customProperties = {}
    properties.filter(p => !p._core).forEach(p => {
      customProperties[p.key] = { label: p.label, type: p.type || 'string' }
    })
    const linkOverrides = {}
    links.forEach(l => {
      linkOverrides[l.id] = { label: l.label }
    })

    await onSave(unit.id, {
      label,
      description,
      properties: propOverrides,
      links: linkOverrides,
      customProperties,
    })
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 540,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, color: 'var(--text)',
        maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ember)', marginBottom: 6 }}>
              Edit unit
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              ID: <code style={{ fontSize: 12, opacity: 0.7 }}>{unit.id}</code> — locked, used internally
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', borderRadius: 8, padding: '4px 10px',
            cursor: 'pointer', fontSize: 13,
          }}>✕</button>
        </div>

        {/* Label */}
        <Field label="Name">
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Definition */}
        <Field label="Definition">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>

        {/* Properties */}
        <div>
          <SectionLabel>Properties</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {properties.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140, fontSize: 12, color: 'var(--muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {p._core && <LockIcon />}
                  <span style={{ opacity: 0.7 }}>{p.key}</span>
                </div>
                <input
                  value={p.label}
                  onChange={e => updatePropLabel(p.key, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {!p._core && (
                  <button onClick={() => removeCustomProp(p.key)} style={{
                    background: 'transparent', border: 'none', color: 'var(--muted)',
                    cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom property */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              value={newPropKey}
              onChange={e => setNewPropKey(e.target.value)}
              placeholder="field_key"
              style={{ ...inputStyle, flex: 1, fontSize: 12 }}
            />
            <input
              value={newPropLabel}
              onChange={e => setNewPropLabel(e.target.value)}
              placeholder="Display label"
              style={{ ...inputStyle, flex: 1, fontSize: 12 }}
            />
            <button onClick={addCustomProp} style={{
              background: 'var(--ember)', border: 'none', color: 'var(--bg)',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>+ Add</button>
          </div>
        </div>

        {/* Relations */}
        {links.length > 0 && (
          <div>
            <SectionLabel>Relations</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 140, fontSize: 12, color: 'var(--muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LockIcon />
                    <span style={{ opacity: 0.7 }}>{l.toUnitTypeId}</span>
                  </div>
                  <input
                    value={l.label}
                    onChange={e => updateLinkLabel(l.id, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', borderRadius: 999, padding: '10px 18px', cursor: 'pointer', fontSize: 13,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            background: 'var(--ember)', border: 'none', color: 'var(--bg)',
            borderRadius: 999, padding: '10px 20px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13,
            opacity: saving ? 0.6 : 1,
          }}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Unit card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, onEdit }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{unit.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>{unit.id}</div>
        </div>
        <button onClick={() => onEdit(unit)} style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted)', borderRadius: 8, padding: '5px 12px',
          cursor: 'pointer', fontSize: 12, flexShrink: 0,
        }}>Edit</button>
      </div>

      {unit.description && (
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{unit.description}</div>
      )}

      {unit.properties?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {unit.properties.map(p => (
            <span key={p.key} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: p._core ? 'rgba(255,255,255,0.05)' : 'oklch(0.62 0.18 35 / 0.1)',
              border: `1px solid ${p._core ? 'var(--border)' : 'oklch(0.62 0.18 35 / 0.3)'}`,
              color: 'var(--muted)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {p._core && <LockIcon size={9} />}
              {p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SchemaManager({ user }) {
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingUnit, setEditingUnit] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getToken().then(token =>
      fetch(`/api/schema-setup?userId=${encodeURIComponent(user.id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(d => setSchema(d.schema || null))
        .catch(() => {})
        .finally(() => setLoading(false))
    )
  }, [user?.id])

  const handleSaveOverride = useCallback(async (unitId, overrides) => {
    setSaveError('')
    setSaveOk(false)
    try {
      const token = await getToken()
      const res = await fetch('/api/schema-customizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          customizations: { unitTypes: { [unitId]: overrides } },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Save failed')

      // Update local schema state with new customizations
      setSchema(prev => ({ ...prev, customizations: data.customizations }))
      setEditingUnit(null)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2500)
    } catch (err) {
      setSaveError(err.message || 'Could not save changes')
    }
  }, [user?.id])

  if (loading) return (
    <div style={{ padding: 40, color: 'var(--muted)', fontSize: 14 }}>Loading schema…</div>
  )

  if (!schema) return (
    <div style={{ padding: 40, color: 'var(--muted)', fontSize: 14 }}>
      No schema found. Complete onboarding first.
    </div>
  )

  const customizations = schema.customizations || {}
  const unitTypes = (schema.unitTypes || []).map(u => applyOverrides(u, customizations))

  const industryLabel = schema.label || schema.industryId || 'Your business'
  const areas = schema.areas || []

  return (
    <div style={{ padding: '32px 32px 64px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ember)', marginBottom: 10 }}>
          Schema
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>
          {industryLabel}
        </h2>
        <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
          {areas.length} areas monitored · {unitTypes.length} unit types tracked.
          Edit any unit to rename it or adjust its properties to match your terminology.
        </p>
      </div>

      {saveOk && (
        <div style={{
          marginBottom: 20, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(80,200,120,0.1)', border: '1px solid rgba(80,200,120,0.3)',
          color: 'var(--text)', fontSize: 13,
        }}>
          Changes saved.
        </div>
      )}

      {saveError && (
        <div style={{
          marginBottom: 20, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.25)',
          color: 'var(--text)', fontSize: 13,
        }}>
          {saveError}
        </div>
      )}

      {/* Areas */}
      <Section title="Monitored areas">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {areas.map(a => (
            <span key={a.id} style={{
              fontSize: 13, padding: '6px 12px', borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)',
            }}>{a.label}</span>
          ))}
        </div>
      </Section>

      {/* Unit types */}
      <Section title="Unit types">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {unitTypes.map(unit => (
            <UnitCard key={unit.id} unit={unit} onEdit={setEditingUnit} />
          ))}
        </div>
      </Section>

      {/* Edit modal */}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          onSave={handleSaveOverride}
          onClose={() => { setEditingUnit(null); setSaveError('') }}
        />
      )}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}

function LockIcon({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1.5" fill="currentColor" />
      <path d="M4 5.5V3.5a2 2 0 1 1 4 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const inputStyle = {
  width: '100%', padding: '8px 11px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontSize: 13,
  boxSizing: 'border-box',
}
