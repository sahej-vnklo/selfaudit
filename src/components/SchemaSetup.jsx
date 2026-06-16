import React, { useState } from 'react'
import { initSupabase } from '../lib/supabase.js'

const INDUSTRIES = [
  { id: 'saas', label: 'SaaS / Software' },
  { id: 'ecommerce', label: 'E-commerce / Retail' },
  { id: 'professional_services', label: 'Professional Services' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'consumer_app', label: 'Consumer App' },
  { id: 'fintech', label: 'Fintech' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'media_content', label: 'Media & Content' },
]

const AREAS = [
  { id: 'marketing-sales', label: 'Marketing & Sales', description: 'Pipeline, leads, conversion' },
  { id: 'finance-accounting', label: 'Finance & Accounting', description: 'Revenue, burn, runway' },
  { id: 'customer-service', label: 'Customer Service', description: 'Support, NPS, retention' },
  { id: 'management-strategy', label: 'Strategy & Management', description: 'Goals, priorities, execution' },
  { id: 'product-engineering', label: 'Product & Engineering', description: 'Build velocity, debt, uptime' },
  { id: 'people-hr', label: 'People & HR', description: 'Team health, hiring, capacity' },
  { id: 'operations', label: 'Operations', description: 'Process efficiency, delivery' },
  { id: 'legal-compliance', label: 'Legal & Compliance', description: 'Risk, contracts, obligations' },
]

async function getSessionToken() {
  const sb = await initSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return session?.access_token || ''
}

export default function SchemaSetup({ user, onComplete }) {
  const [step, setStep] = useState(1)
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedAreas, setSelectedAreas] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleArea = (areaId) => {
    setSelectedAreas((current) => (
      current.includes(areaId)
        ? current.filter((item) => item !== areaId)
        : [...current, areaId]
    ))
  }

  const saveSchema = async () => {
    if (!user?.id || !selectedIndustry || selectedAreas.length === 0) return

    setSaving(true)
    setError('')
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('You need to be signed in to save your setup.')

      const response = await fetch('/api/schema-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          industryId: selectedIndustry,
          areaIds: selectedAreas,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Could not save your schema right now.')
      }

      setStep(3)
    } catch (err) {
      setError(err?.message || 'Could not save your schema right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0, 0, 0, 0.58)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '880px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 28px 80px rgba(0, 0, 0, 0.34)',
          padding: '28px',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '22px' }}>
          <div>
            <div style={{ color: 'var(--ember)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Schema Setup
            </div>
            <h2 style={{ margin: 0, fontSize: '28px', lineHeight: 1.1, fontWeight: 600 }}>
              {step === 1 && 'What type of business are you?'}
              {step === 2 && 'Which areas do you want to monitor?'}
              {step === 3 && "You're set up."}
            </h2>
            {step === 2 && (
              <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.5 }}>
                Pick the ones relevant to your business. You can change this later.
              </p>
            )}
            {step === 3 && (
              <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '15px', lineHeight: 1.5 }}>
                Your monitoring backbone is in place. You can start running audits against a real business structure now.
              </p>
            )}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Step {step} of 3
          </div>
        </div>

        {step === 1 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {INDUSTRIES.map((industry) => (
              <button
                key={industry.id}
                type="button"
                onClick={() => {
                  setSelectedIndustry(industry.id)
                  setStep(2)
                }}
                style={{
                  textAlign: 'left',
                  background: 'linear-gradient(180deg, var(--surface), var(--surface2))',
                  border: '1px solid var(--border)',
                  borderRadius: '18px',
                  color: 'var(--text)',
                  padding: '18px',
                  cursor: 'pointer',
                  minHeight: '106px',
                  transition: 'border-color 120ms ease, transform 120ms ease',
                }}
              >
                <div style={{ color: 'var(--ember)', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Industry
                </div>
                <div style={{ fontSize: '17px', lineHeight: 1.35, fontWeight: 600 }}>
                  {industry.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              {AREAS.map((area) => {
                const checked = selectedAreas.includes(area.id)
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    style={{
                      textAlign: 'left',
                      background: checked ? 'oklch(0.62 0.18 35 / 0.12)' : 'linear-gradient(180deg, var(--surface), var(--surface2))',
                      border: checked ? '1px solid var(--ember)' : '1px solid var(--border)',
                      borderRadius: '18px',
                      color: 'var(--text)',
                      padding: '18px',
                      cursor: 'pointer',
                      minHeight: '128px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ fontSize: '16px', lineHeight: 1.35, fontWeight: 600 }}>
                        {area.label}
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '999px',
                          border: checked ? '1px solid var(--ember)' : '1px solid var(--border)',
                          background: checked ? 'var(--ember)' : 'transparent',
                          boxShadow: checked ? '0 0 0 4px oklch(0.62 0.18 35 / 0.12)' : 'none',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>
                      {area.description}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '22px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  borderRadius: '999px',
                  padding: '11px 18px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={saveSchema}
                disabled={selectedAreas.length === 0 || saving}
                style={{
                  background: selectedAreas.length === 0 || saving ? 'rgba(255,255,255,0.08)' : 'var(--ember)',
                  border: '1px solid transparent',
                  color: selectedAreas.length === 0 || saving ? 'var(--muted)' : 'var(--bg)',
                  borderRadius: '999px',
                  padding: '12px 20px',
                  fontWeight: 600,
                  cursor: selectedAreas.length === 0 || saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '18px',
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '18px',
                border: '1px solid var(--border)',
                background: 'linear-gradient(180deg, var(--surface), var(--surface2))',
                color: 'var(--muted)',
                lineHeight: 1.6,
              }}
            >
              SelfAudit now knows the shape of your business and what to watch first.
            </div>
            <button
              type="button"
              onClick={onComplete}
              style={{
                background: 'var(--ember)',
                border: '1px solid transparent',
                color: 'var(--bg)',
                borderRadius: '999px',
                padding: '13px 22px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start your first audit →
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: '18px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 107, 107, 0.35)',
              background: 'rgba(255, 107, 107, 0.08)',
              color: 'var(--text)',
              padding: '12px 14px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
