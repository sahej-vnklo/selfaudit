import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#F8F7F4',
  ink: '#1A1A1A',
  inkSoft: '#4A4A4A',
  inkMuted: '#7A7A7A',
  accent: '#5C8D6E',
  accentDark: '#3F6B52',
  accentSoft: '#E6F0EA',
  border: '#E8E6E0',
  card: '#FFFFFF',
}

// Industry → domain mapping
const INDUSTRY_DOMAINS = {
  'E-Commerce':            ['Operations', 'Marketing', 'Customer Success', 'Technology', 'Finance', 'Product'],
  'SaaS':                  ['Product', 'Sales', 'Marketing', 'Technology', 'Customer Success', 'Finance', 'Strategy'],
  'Agency / Consulting':   ['Sales', 'Operations', 'People & Culture', 'Finance', 'Strategy', 'Marketing'],
  'Professional Services': ['Sales', 'Operations', 'People & Culture', 'Finance', 'Technology'],
  'Retail':                ['Operations', 'Marketing', 'Finance', 'People & Culture', 'Customer Success'],
  'Hospitality':           ['Operations', 'Marketing', 'People & Culture', 'Customer Success', 'Finance'],
  'Manufacturing':         ['Operations', 'Finance', 'People & Culture', 'Technology', 'Strategy'],
  'Startup':               ['Strategy', 'Product', 'Marketing', 'Sales', 'Finance', 'Technology', 'People & Culture'],
  'Real Estate':           ['Sales', 'Marketing', 'Finance', 'Operations', 'Strategy'],
  'Healthcare':            ['Operations', 'Technology', 'Finance', 'People & Culture', 'Customer Success'],
}

const ALL_INDUSTRIES = Object.keys(INDUSTRY_DOMAINS)
const ALL_DOMAINS = [...new Set(Object.values(INDUSTRY_DOMAINS).flat())]

export default function AccountOnboarding({ user, tier: tierProp, onComplete }) {
  // tier can come from prop or be fetched from profiles
  const [tier, setTier] = useState(tierProp || null)
  const [loadingTier, setLoadingTier] = useState(!tierProp)

  // Essential / Business state
  const [selectedIndustry, setSelectedIndustry] = useState('')

  // Essential: single domain
  const [selectedDomain, setSelectedDomain] = useState('')

  // Business / Portfolio: multi-domain pills
  const [revealedDomains, setRevealedDomains] = useState([])
  const [selectedDomains, setSelectedDomains] = useState(new Set())

  // Portfolio: industry pills
  const [revealedIndustries, setRevealedIndustries] = useState([])
  const [selectedIndustries, setSelectedIndustries] = useState(new Set())

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch tier from profile if not provided
  useEffect(() => {
    if (tierProp) return
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single()
      if (data) setTier(data.tier)
      setLoadingTier(false)
    })()
  }, [tierProp, user.id])

  // Portfolio: animate all industries in, then cascade all domains
  useEffect(() => {
    if (tier !== 'portfolio') return

    const industryTimeouts = ALL_INDUSTRIES.map((ind, i) =>
      setTimeout(() => {
        setRevealedIndustries(prev => [...prev, ind])
        setSelectedIndustries(prev => new Set([...prev, ind]))
      }, i * 150)
    )

    const domainStart = ALL_INDUSTRIES.length * 150 + 400
    const domainTimeouts = ALL_DOMAINS.map((dom, i) =>
      setTimeout(() => {
        setRevealedDomains(prev => [...prev, dom])
        setSelectedDomains(prev => new Set([...prev, dom]))
      }, domainStart + i * 80)
    )

    return () => {
      industryTimeouts.forEach(clearTimeout)
      domainTimeouts.forEach(clearTimeout)
    }
  }, [tier])

  // Business: when industry changes, animate that industry's domains in as pre-selected
  useEffect(() => {
    if (tier !== 'business' || !selectedIndustry) return

    const domains = INDUSTRY_DOMAINS[selectedIndustry] || []
    setRevealedDomains([])
    setSelectedDomains(new Set())

    const timeouts = domains.map((dom, i) =>
      setTimeout(() => {
        setRevealedDomains(prev => [...prev, dom])
        setSelectedDomains(prev => new Set([...prev, dom]))
      }, i * 120)
    )

    return () => timeouts.forEach(clearTimeout)
  }, [tier, selectedIndustry])

  const toggleIndustry = (ind) => {
    setSelectedIndustries(prev => {
      const next = new Set(prev)
      next.has(ind) ? next.delete(ind) : next.add(ind)
      return next
    })
  }

  const toggleDomain = (dom) => {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      next.has(dom) ? next.delete(dom) : next.add(dom)
      return next
    })
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')

    try {
      let updatePayload = { onboarding_complete: true }

      if (tier === 'essential') {
        if (!selectedIndustry || !selectedDomain) {
          setError('Please select an industry and domain.')
          setSaving(false)
          return
        }
        updatePayload.selected_industry = selectedIndustry
        updatePayload.selected_domains = [selectedDomain]
      } else if (tier === 'business') {
        if (!selectedIndustry) {
          setError('Please select an industry.')
          setSaving(false)
          return
        }
        updatePayload.selected_industry = selectedIndustry
        updatePayload.selected_domains = [...selectedDomains]
      } else if (tier === 'portfolio') {
        updatePayload.selected_industry = [...selectedIndustries].join(',')
        updatePayload.selected_domains = [...selectedDomains]
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)

      if (dbError) throw dbError
      onComplete()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingTier) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", color: C.inkMuted }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <nav style={{ padding: '24px 32px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: C.ink }}>
          self<span style={{ color: C.accent, fontWeight: 500 }}>audit</span>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>
            Account setup
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', color: C.ink, marginBottom: 10 }}>
            {tier === 'portfolio'
              ? 'Select your industries and domains'
              : tier === 'business'
              ? 'Choose your focus industry'
              : 'Select your industry and domain'}
          </h1>
          <p style={{ fontSize: 16, color: C.inkMuted }}>
            {tier === 'portfolio'
              ? 'We\'ll scope your audit dashboard across all selected areas. Deselect anything that doesn\'t apply.'
              : tier === 'business'
              ? 'Pick your primary industry. Your domains will auto-populate — deselect any that don\'t apply.'
              : 'This helps us tailor your audit to your business type.'}
          </p>
        </div>

        {/* ESSENTIAL */}
        {tier === 'essential' && (
          <EssentialSelectors
            selectedIndustry={selectedIndustry}
            onIndustryChange={(ind) => { setSelectedIndustry(ind); setSelectedDomain('') }}
            selectedDomain={selectedDomain}
            onDomainChange={setSelectedDomain}
          />
        )}

        {/* BUSINESS */}
        {tier === 'business' && (
          <div>
            <IndustryDropdown
              value={selectedIndustry}
              onChange={(ind) => setSelectedIndustry(ind)}
            />

            {revealedDomains.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.inkMuted, marginBottom: 14 }}>
                  Domains — click to deselect
                </div>
                <DomainPills
                  revealed={revealedDomains}
                  selected={selectedDomains}
                  onToggle={toggleDomain}
                />
              </div>
            )}
          </div>
        )}

        {/* PORTFOLIO */}
        {tier === 'portfolio' && (
          <div>
            {revealedIndustries.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.inkMuted, marginBottom: 14 }}>
                  Industries — click to deselect
                </div>
                <DomainPills
                  revealed={revealedIndustries}
                  selected={selectedIndustries}
                  onToggle={toggleIndustry}
                />
              </div>
            )}

            {revealedDomains.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.inkMuted, marginBottom: 14 }}>
                  Domains — click to deselect
                </div>
                <DomainPills
                  revealed={revealedDomains}
                  selected={selectedDomains}
                  onToggle={toggleDomain}
                />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#FDE9E7', borderRadius: 8, fontSize: 14, color: '#B84A3E' }}>
            {error}
          </div>
        )}

        {/* Continue */}
        <button
          onClick={handleComplete}
          disabled={saving}
          style={{
            marginTop: 32, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: saving ? C.inkMuted : C.accent,
            color: 'white', fontSize: 15, fontWeight: 600,
            padding: '15px', borderRadius: 100, border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving…' : 'Continue to dashboard →'}
        </button>
      </div>
    </div>
  )
}

function EssentialSelectors({ selectedIndustry, onIndustryChange, selectedDomain, onDomainChange }) {
  const domains = selectedIndustry ? INDUSTRY_DOMAINS[selectedIndustry] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: C.ink, display: 'block', marginBottom: 8 }}>
          Industry <span style={{ color: C.accent }}>*</span>
        </label>
        <select
          value={selectedIndustry}
          onChange={e => onIndustryChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select your industry…</option>
          {ALL_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
      </div>

      {selectedIndustry && (
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: C.ink, display: 'block', marginBottom: 8 }}>
            Primary domain <span style={{ color: C.accent }}>*</span>
          </label>
          <select
            value={selectedDomain}
            onChange={e => onDomainChange(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select a domain…</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

function IndustryDropdown({ value, onChange }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, color: C.ink, display: 'block', marginBottom: 8 }}>
        Industry <span style={{ color: C.accent }}>*</span>
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        <option value="">Select your industry…</option>
        {ALL_INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
      </select>
    </div>
  )
}

function DomainPills({ revealed, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {revealed.map(item => {
        const isSelected = selected.has(item)
        return (
          <button
            key={item}
            onClick={() => onToggle(item)}
            style={{
              padding: '8px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500,
              border: `1.5px solid ${isSelected ? C.accent : C.border}`,
              background: isSelected ? C.accentSoft : C.card,
              color: isSelected ? C.accentDark : C.inkMuted,
              cursor: 'pointer', transition: 'all 0.15s',
              animation: 'pillIn 0.3s ease forwards',
            }}
          >
            {isSelected && <span style={{ marginRight: 6, fontSize: 12 }}>✓</span>}
            {item}
          </button>
        )
      })}
      <style>{`
        @keyframes pillIn {
          from { opacity: 0; transform: scale(0.85) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

const selectStyle = {
  width: '100%', padding: '11px 14px',
  fontSize: 14, color: C.ink, background: C.card,
  border: `1.5px solid ${C.border}`, borderRadius: 8,
  outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
  appearance: 'auto',
}
