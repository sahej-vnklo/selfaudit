import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'

const THEMES = {
  dark: {
    bg: '#060303',
    surface: '#0F0909',
    surface2: '#1D1514',
    surface3: '#16100F',
    border: '#2E211F',
    border2: '#4A3430',
    text: '#F3ECE6',
    textSecondary: '#D2BCB5',
    textMuted: '#A88D85',
    textFaint: '#7E6560',
    accent: '#B79A92',
    accentLight: '#1D1514',
    accentText: '#D2BCB5',
    buttonText: '#F3ECE6',
    red: '#C05050',
    redText: '#C07070',
  },
  light: {
    bg: '#F5F0EA',
    surface: '#EFE7DF',
    surface2: '#E8DDD3',
    surface3: '#FBF7F2',
    border: '#D9C9BE',
    border2: '#C7B3A7',
    text: '#261B19',
    textSecondary: '#6E5B55',
    textMuted: '#8A746D',
    textFaint: '#A28D84',
    accent: '#A98D86',
    accentLight: '#E8DDD3',
    accentText: '#8F7069',
    buttonText: '#FBF7F2',
    red: '#8C2A2A',
    redText: '#8C2A2A',
  },
  sharp: {
    bg: '#0F2239',
    surface: '#132C49',
    surface2: '#193857',
    surface3: '#224567',
    border: '#2D4E72',
    border2: '#44678D',
    text: '#F4F7FC',
    textSecondary: '#D8E2F1',
    textMuted: '#A9BCD5',
    textFaint: '#7B93B1',
    accent: '#3A73EA',
    accentLight: '#193857',
    accentText: '#89A7E2',
    buttonText: '#F4F7FC',
    red: '#C07878',
    redText: '#C07878',
  },
}

const COLORS = {
  black: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  accentText: 'var(--accent-text)',
  buttonText: 'var(--button-text)',
  red: 'var(--red)',
  redText: 'var(--red-text)',
}

function getThemeVars(theme) {
  const C = THEMES[theme] || THEMES.dark
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--surface3': C.surface3,
    '--border': C.border,
    '--border2': C.border2,
    '--text': C.text,
    '--text-secondary': C.textSecondary,
    '--text-muted': C.textMuted,
    '--text-faint': C.textFaint,
    '--accent': C.accent,
    '--accent-light': C.accentLight,
    '--accent-text': C.accentText,
    '--button-text': C.buttonText,
    '--red': C.red,
    '--red-text': C.redText,
  }
}

const FUNDING_STAGES = ['Bootstrapped', 'Pre-seed', 'Seed', 'Series A', 'Series B+', 'Public']
function normalizeTier(raw) {
  if (raw === 'intelligence') return 'intelligence'
  return 'foundation'
}

function isFilled(value) {
  if (Array.isArray(value)) return value.length > 0
  if (value === 0) return true
  if (typeof value === 'number') return Number.isFinite(value)
  return !!String(value ?? '').trim()
}

function clampCompletion(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
}

function getIndustryFlags(industry = '') {
  const label = String(industry || '').toLowerCase()
  return {
    isSaas: label.includes('saas'),
    isAgency: label.includes('agency') || label.includes('consulting'),
    isRetail: label.includes('retail') || label.includes('ecom') || label.includes('e-commerce'),
  }
}

function getFinancialFields(industry = '') {
  const base = [
    { key: 'arr', label: 'Annual revenue (last 12 months)', prefix: '$', type: 'number' },
    { key: 'revenue_qtr', label: 'Revenue this quarter', prefix: '$', type: 'number' },
    { key: 'revenue_same_qtr_last_year', label: 'Revenue same quarter last year', prefix: '$', type: 'number' },
    { key: 'gross_margin', label: 'Gross margin', suffix: '%', type: 'number' },
    { key: 'net_profit_margin', label: 'Net profit margin', suffix: '%', type: 'number' },
    { key: 'burn_rate', label: 'Monthly burn rate (if applicable)', prefix: '$', type: 'number' },
  ]
  const { isSaas, isAgency, isRetail } = getIndustryFlags(industry)
  if (isSaas) {
    base.push(
      { key: 'mrr', label: 'MRR', prefix: '$', type: 'number' },
      { key: 'mom_growth_rate', label: 'MoM growth rate', suffix: '%', type: 'number' },
      { key: 'cac', label: 'CAC (customer acquisition cost)', prefix: '$', type: 'number' },
      { key: 'ltv', label: 'LTV (lifetime value)', prefix: '$', type: 'number' },
      { key: 'churn', label: 'Monthly churn rate', suffix: '%', type: 'number' },
      { key: 'payback_period_months', label: 'Payback period', suffix: 'months', type: 'number' },
    )
  }
  if (isAgency) {
    base.push(
      { key: 'avg_project_value', label: 'Average project value', prefix: '$', type: 'number' },
      { key: 'utilization_rate', label: 'Utilization rate', suffix: '%', type: 'number' },
      { key: 'billable_hours_per_month', label: 'Billable hours per month', type: 'number' },
      { key: 'active_client_count', label: 'Client count (active)', type: 'number' },
    )
  }
  if (isRetail) {
    base.push(
      { key: 'average_order_value', label: 'Average order value', prefix: '$', type: 'number' },
      { key: 'repeat_purchase_rate', label: 'Repeat purchase rate', suffix: '%', type: 'number' },
      { key: 'cogs_pct', label: 'COGS %', suffix: '%', type: 'number' },
      { key: 'inventory_turnover', label: 'Inventory turnover', type: 'number' },
    )
  }
  return base
}

const operationalFields = [
  { key: 'headcount', label: 'Total headcount', type: 'number' },
  { key: 'sales_team_size', label: 'Sales team size', type: 'number' },
  { key: 'sales_cycle', label: 'Average sales cycle', suffix: 'days', type: 'number' },
  { key: 'active_customers', label: 'Number of active customers/clients', type: 'number' },
  { key: 'nps', label: 'NPS score', type: 'number', min: -100, max: 100 },
  { key: 'support_tickets_per_week', label: 'Support tickets per week (avg)', type: 'number' },
  { key: 'biggest_bottleneck', label: 'Biggest operational bottleneck', type: 'textarea', rows: 2 },
]

const contextFields = [
  { key: 'funding_stage', label: 'Funding stage', type: 'select', options: FUNDING_STAGES },
  { key: 'total_raised', label: 'Total raised', prefix: '$', type: 'number', conditional: (state) => state.funding_stage && state.funding_stage !== 'Bootstrapped' },
  { key: 'last_raise_date', label: 'Last raise date', type: 'date', conditional: (state) => state.funding_stage && state.funding_stage !== 'Bootstrapped' },
  { key: 'runway', label: 'Runway (months)', type: 'number', conditional: (state) => state.funding_stage && state.funding_stage !== 'Bootstrapped' },
  { key: 'competitors', label: 'Primary competitors', type: 'text', placeholder: 'comma separated' },
  { key: 'current_focus', label: "What you're trying to solve right now", type: 'textarea', rows: 3 },
  { key: 'biggest_risk', label: 'Biggest risk to the business', type: 'textarea', rows: 2 },
]

function getVisibleContextFields(state) {
  return contextFields.filter((field) => !field.conditional || field.conditional(state || {}))
}

function normalizeFieldValue(field, value) {
  if (value === '' || value === null || value === undefined) return ''
  if (field.type === 'number') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : ''
  }
  return typeof value === 'string' ? value.trim() : value
}

function normalizeFieldGroup(fields, source) {
  const next = {}
  fields.forEach((field) => {
    if (!(field.key in (source || {}))) return
    next[field.key] = normalizeFieldValue(field, source[field.key])
  })
  return next
}

function calculateCompletion(financialFields, financial, operational, context, docPaths) {
  const visibleFields = [
    ...financialFields.map((field) => financial[field.key]),
    ...operationalFields.map((field) => operational[field.key]),
    ...getVisibleContextFields(context).map((field) => context[field.key]),
    docPaths,
  ]
  const filled = visibleFields.filter(isFilled).length
  return clampCompletion((filled / Math.max(visibleFields.length, 1)) * 100)
}

export default function IntelligenceBrief({ user, profile, onProfileChange }) {
  const theme = localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const [financial, setFinancial] = useState({})
  const [operational, setOperational] = useState({})
  const [context, setContext] = useState({})
  const [docPaths, setDocPaths] = useState(() => profile?.intelligence_docs || [])
  const [synthProfile, setSynthProfile] = useState(null)
  const [openSections, setOpenSections] = useState({
    financial: true,
    operational: true,
    context: true,
    documents: true,
  })
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef(null)

  const financialFields = useMemo(() => getFinancialFields(profile?.industry), [profile?.industry])
  const visibleContextFields = useMemo(() => getVisibleContextFields(context), [context])
  const normalizedTier = useMemo(() => normalizeTier(profile?.tier), [profile?.tier])
  const intelligenceUnlocked = normalizedTier === 'intelligence'

  useEffect(() => {
    if (!toast) return undefined
    const timeout = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    if (!user?.id) {
      setLoading(false)
      return undefined
    }

    ;(async () => {
      setLoading(true)
      try {
        const sb = await initSupabase()
        const { data } = await sb
          .from('intelligence_brief')
          .select('financial, operational, context, doc_paths, completion_pct')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cancelled) return
        if (data?.financial) setFinancial(data.financial)
        if (data?.operational) setOperational(data.operational)
        if (data?.context) setContext(data.context)
        if (Array.isArray(data?.doc_paths) && data.doc_paths.length > 0) {
          setDocPaths(data.doc_paths)
        } else if (Array.isArray(profile?.intelligence_docs)) {
          setDocPaths(profile.intelligence_docs)
        }

        if (intelligenceUnlocked) {
          try {
            const { data: synthData } = await sb
              .from('intelligence_profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()

            if (cancelled) return
            setSynthProfile(synthData || null)
          } catch (intelligenceErr) {
            console.warn('[intelligence-brief] synthesized profile load failed:', intelligenceErr?.message || intelligenceErr)
            if (!cancelled) {
              setSynthProfile(null)
            }
          }
        } else {
          setSynthProfile(null)
        }
      } catch (err) {
        console.warn('[intelligence-brief] load failed:', err?.message || err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [intelligenceUnlocked, profile?.intelligence_docs, user?.id])

  const completionPct = useMemo(
    () => calculateCompletion(financialFields, financial, operational, context, docPaths),
    [context, docPaths, financial, financialFields, operational]
  )

  const saveBrief = async (sectionKey, nextDocs = docPaths) => {
    if (!user?.id) return
    setSavingSection(sectionKey)
    try {
      const sb = await initSupabase()
      const nextFinancial = normalizeFieldGroup(financialFields, financial)
      const nextOperational = normalizeFieldGroup(operationalFields, operational)
      const nextContext = normalizeFieldGroup(visibleContextFields, context)
      const nextCompletion = calculateCompletion(financialFields, nextFinancial, nextOperational, nextContext, nextDocs)
      const payload = {
        user_id: user.id,
        financial: nextFinancial,
        operational: nextOperational,
        context: nextContext,
        doc_paths: nextDocs,
        completion_pct: nextCompletion,
        updated_at: new Date().toISOString(),
      }

      const { error } = await sb
        .from('intelligence_brief')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error

      const profileUpdate = {
        intelligence_docs: nextDocs,
        intelligence_complete: nextCompletion > 60,
      }
      const { error: profileError } = await sb
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (profileError) throw profileError
      onProfileChange?.(profileUpdate)
      setToast('Saved')
    } catch (err) {
      console.error('[intelligence-brief] save failed:', err?.message || err)
      setToast('Save failed')
    } finally {
      setSavingSection('')
    }
  }

  const persistDocuments = async (nextDocs) => {
    setDocPaths(nextDocs)
    if (!user?.id) return
    setSavingSection('documents')
    try {
      const sb = await initSupabase()
      const { error } = await sb
        .from('intelligence_brief')
        .upsert(
          {
            user_id: user.id,
            financial: normalizeFieldGroup(financialFields, financial),
            operational: normalizeFieldGroup(operationalFields, operational),
            context: normalizeFieldGroup(visibleContextFields, context),
            doc_paths: nextDocs,
            completion_pct: calculateCompletion(
              financialFields,
              normalizeFieldGroup(financialFields, financial),
              normalizeFieldGroup(operationalFields, operational),
              normalizeFieldGroup(visibleContextFields, context),
              nextDocs
            ),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      if (error) throw error

      const profileUpdate = {
        intelligence_docs: nextDocs,
        intelligence_complete: calculateCompletion(
          financialFields,
          normalizeFieldGroup(financialFields, financial),
          normalizeFieldGroup(operationalFields, operational),
          normalizeFieldGroup(visibleContextFields, context),
          nextDocs
        ) > 60,
      }
      const { error: profileError } = await sb.from('profiles').update(profileUpdate).eq('id', user.id)
      if (profileError) throw profileError
      onProfileChange?.(profileUpdate)
      setToast('Saved')
    } catch (err) {
      console.error('[intelligence-brief] document sync failed:', err?.message || err)
      setToast('Save failed')
    } finally {
      setSavingSection('')
    }
  }

  const handleUpload = async (files) => {
    if (!files?.length || !user?.id) return
    setUploading(true)
    try {
      const sb = await initSupabase()
      const nextDocs = [...docPaths]

      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`
        const { error } = await sb.storage.from('intelligence-docs').upload(path, file, { upsert: false })
        if (error) throw error
        const doc = {
          name: file.name,
          path,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        }
        nextDocs.unshift(doc)

        fetch('/api/parse-intelligence-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, path, name: file.name }),
        }).catch(() => {})
      }

      await persistDocuments(nextDocs)
    } catch (err) {
      console.error('[intelligence-brief] upload failed:', err?.message || err)
      setToast('Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemoveDoc = async (doc) => {
    if (!user?.id) return
    try {
      const sb = await initSupabase()
      await sb.storage.from('intelligence-docs').remove([doc.path])
      const nextDocs = docPaths.filter((item) => item.path !== doc.path)
      await persistDocuments(nextDocs)
    } catch (err) {
      console.error('[intelligence-brief] remove failed:', err?.message || err)
      setToast('Remove failed')
    }
  }

  const renderField = (field, value, onChange) => {
    const baseInputStyle = {
      width: '100%',
      background: COLORS.black,
      color: COLORS.text,
      border: `0.5px solid ${COLORS.border2}`,
      borderRadius: 8,
      padding: field.type === 'textarea' ? '10px 12px' : '10px 12px',
      fontSize: 13,
      outline: 'none',
      fontFamily: 'inherit',
      minHeight: field.type === 'textarea' ? undefined : 40,
    }

    const control = (() => {
      if (field.type === 'textarea') {
        return (
          <textarea
            rows={field.rows || 3}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder || ''}
            style={{ ...baseInputStyle, resize: 'vertical' }}
          />
        )
      }
      if (field.type === 'select') {
        return (
          <select
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
            style={baseInputStyle}
          >
            <option value="">Select</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      }

      const inputType = field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'
      return (
        <input
          type={inputType}
          value={value ?? ''}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder || ''}
          onChange={(event) => onChange(field.type === 'number' ? event.target.value : event.target.value)}
          style={{
            ...baseInputStyle,
            paddingLeft: field.prefix ? 28 : 12,
            paddingRight: field.suffix ? 58 : 12,
          }}
        />
      )
    })()

    if (!field.prefix && !field.suffix) return control

    return (
      <div style={{ position: 'relative' }}>
        {field.prefix && <span style={fieldAffixStyle('left')}>{field.prefix}</span>}
        {field.suffix && <span style={fieldAffixStyle('right')}>{field.suffix}</span>}
        {control}
      </div>
    )
  }

  const sectionTitle = `${completionPct}% complete`

  return (
    <div style={{ ...themeVars, maxWidth: 980 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={pageTitle}>Intelligence brief</h1>
          <p style={pageSub}>
            The more you fill in, the more precise every audit becomes. Incomplete fields are treated as assumptions.
          </p>
        </div>
        <div style={completionBadge}>Profile {sectionTitle}</div>
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      {loading ? (
        <div style={loadingCard}>Loading intelligence brief…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {intelligenceUnlocked ? (
            <div style={card}>
              <div style={cardBodyStandalone}>
                <div style={panelLabel}>Synthesized intelligence</div>
                {synthProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ fontSize: 16, color: COLORS.text, marginBottom: 8 }}>What the system now believes</div>
                        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                          {synthProfile.summary || 'Still gathering enough signal to synthesize a reliable view.'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={summaryBadge}>{String(synthProfile.confidence || 'low').toUpperCase()} confidence</div>
                        <div style={summaryBadge}>Updated {synthProfile.last_synthesized_at ? new Date(synthProfile.last_synthesized_at).toLocaleDateString() : 'just now'}</div>
                      </div>
                    </div>

                    {typeof synthProfile.goal_score === 'number' && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={fieldLabel}>Goal score</span>
                          <span style={{ fontSize: 12, color: COLORS.accentText }}>{Math.round(synthProfile.goal_score || 0)} / 100</span>
                        </div>
                        <ProgressBar value={synthProfile.goal_score || 0} />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                      <div>
                        <div style={fieldLabel}>Focus areas</div>
                        <div style={badgeWrap}>
                          {(synthProfile.focus_areas || []).length > 0
                            ? synthProfile.focus_areas.map((area) => <SummaryBadge key={area}>{area}</SummaryBadge>)
                            : <EmptyInline>Still learning where to focus.</EmptyInline>}
                        </div>
                      </div>
                      <div>
                        <div style={fieldLabel}>Domains audited</div>
                        <div style={badgeWrap}>
                          {(synthProfile.domains_audited || []).length > 0
                            ? synthProfile.domains_audited.map((area) => <SummaryBadge key={area}>{area}</SummaryBadge>)
                            : <EmptyInline>No domain history yet.</EmptyInline>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                      <SummaryList title="Repeated blockers" items={synthProfile.repeated_blockers} empty="No repeated blockers yet." />
                      <SummaryList title="Top priorities" items={synthProfile.top_priorities} empty="No clear priorities yet." />
                    </div>

                    <SummaryList title="Watchouts" items={synthProfile.watchouts} empty="No urgent watchouts right now." />
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                    Your intelligence profile will start compounding after audits, reports, brief data, and connector signals accumulate.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={card}>
              <div style={cardBodyStandalone}>
                <div style={panelLabel}>Intelligence layer</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                  Cross-audit synthesis, compounding business memory, and alert preferences are reserved for Intelligence users. Foundation still gets audits and saved report history.
                </div>
              </div>
            </div>
          )}

          {intelligenceUnlocked && (
            <div style={card}>
              <div style={cardBodyStandalone}>
                <div style={panelLabel}>Alert preferences</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                  Alert preferences now live on the dashboard inside <strong>Weekly digest &amp; alerts</strong>, so your digest settings and proactive alert controls stay together in one place.
                </div>
              </div>
            </div>
          )}

          <SectionCard
            title="Financial metrics"
            isOpen={openSections.financial}
            onToggle={() => setOpenSections((prev) => ({ ...prev, financial: !prev.financial }))}
            onSave={() => saveBrief('financial')}
            saving={savingSection === 'financial'}
          >
            <div style={fieldGrid}>
              {financialFields.map((field) => (
                <FieldShell key={field.key} label={field.label}>
                  {renderField(field, financial[field.key], (nextValue) =>
                    setFinancial((prev) => ({ ...prev, [field.key]: nextValue }))
                  )}
                </FieldShell>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Operational metrics"
            isOpen={openSections.operational}
            onToggle={() => setOpenSections((prev) => ({ ...prev, operational: !prev.operational }))}
            onSave={() => saveBrief('operational')}
            saving={savingSection === 'operational'}
          >
            <div style={fieldGrid}>
              {operationalFields.map((field) => (
                <FieldShell key={field.key} label={field.label} fullWidth={field.type === 'textarea'}>
                  {renderField(field, operational[field.key], (nextValue) =>
                    setOperational((prev) => ({ ...prev, [field.key]: nextValue }))
                  )}
                </FieldShell>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Business context"
            isOpen={openSections.context}
            onToggle={() => setOpenSections((prev) => ({ ...prev, context: !prev.context }))}
            onSave={() => saveBrief('context')}
            saving={savingSection === 'context'}
          >
            <div style={fieldGrid}>
              {visibleContextFields.map((field) => (
                <FieldShell key={field.key} label={field.label} fullWidth={field.type === 'textarea'}>
                  {renderField(field, context[field.key], (nextValue) =>
                    setContext((prev) => ({ ...prev, [field.key]: nextValue }))
                  )}
                </FieldShell>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Documents"
            isOpen={openSections.documents}
            onToggle={() => setOpenSections((prev) => ({ ...prev, documents: !prev.documents }))}
            onSave={() => saveBrief('documents')}
            saving={savingSection === 'documents'}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.xlsx,.csv,.docx"
              multiple
              style={{ display: 'none' }}
              onChange={(event) => handleUpload(event.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={uploadShell}
            >
              <div style={{ fontSize: 14, color: COLORS.text }}>Drop files here or click to upload</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                P&amp;L, balance sheet, pitch deck, contracts — Claude will extract key numbers automatically
              </div>
              <div style={{ fontSize: 11, color: COLORS.textFaint, marginTop: 10 }}>
                Accepted: .pdf, .xlsx, .csv, .docx
              </div>
              {uploading && <div style={{ fontSize: 12, color: COLORS.accentText, marginTop: 10 }}>Uploading…</div>}
            </button>

            {docPaths.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {docPaths.map((doc) => (
                  <div key={doc.path} style={docRow}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textFaint }}>
                        {formatFileSize(doc.size)} · {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Uploaded'}
                      </div>
                    </div>
                    <button type="button" style={removeBtn} onClick={() => handleRemoveDoc(doc)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)))
  return (
    <div style={{ width: '100%', height: 6, background: COLORS.surface, borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: COLORS.accent, borderRadius: 999, transition: 'width 0.3s ease' }} />
    </div>
  )
}

function SectionCard({ title, isOpen, onToggle, children, onSave, saving }) {
  return (
    <div style={card}>
      <button type="button" onClick={onToggle} style={cardHeader}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Section
          </div>
          <div style={{ fontSize: 16, color: COLORS.text }}>{title}</div>
        </div>
        <div style={{ ...chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</div>
      </button>
      {isOpen && (
        <div style={cardBody}>
          {children}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" onClick={onSave} disabled={saving} style={saveBtn}>
              {saving ? 'Saving…' : 'Save section'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FieldShell({ label, children, fullWidth = false }) {
  return (
    <label style={{ ...fieldShell, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

function SummaryBadge({ children }) {
  return <span style={miniBadge}>{children}</span>
}

function EmptyInline({ children }) {
  return <span style={{ color: COLORS.textFaint, fontSize: 12 }}>{children}</span>
}

function SummaryList({ title, items, empty }) {
  return (
    <div>
      <div style={fieldLabel}>{title}</div>
      {Array.isArray(items) && items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <div key={`${title}-${index}`} style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              {item}
            </div>
          ))}
        </div>
      ) : (
        <EmptyInline>{empty}</EmptyInline>
      )}
    </div>
  )
}

function fieldAffixStyle(side) {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 12,
    transform: 'translateY(-50%)',
    fontSize: 12,
    color: COLORS.textFaint,
    pointerEvents: 'none',
    zIndex: 1,
  }
}

const pageHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  marginBottom: 18,
}

const pageTitle = {
  fontSize: 28,
  fontWeight: 500,
  color: COLORS.text,
  lineHeight: 1.1,
}

const pageSub = {
  marginTop: 8,
  fontSize: 13,
  color: COLORS.textSecondary,
  maxWidth: 620,
}

const completionBadge = {
  background: COLORS.accentLight,
  color: COLORS.accentText,
  border: `0.5px solid ${COLORS.border2}`,
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 12,
  whiteSpace: 'nowrap',
}

const card = {
  background: COLORS.surface2,
  border: `0.5px solid ${COLORS.border}`,
  borderRadius: 12,
  overflow: 'hidden',
}

const cardHeader = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 18px',
  textAlign: 'left',
  cursor: 'pointer',
}

const cardBody = {
  padding: '0 18px 18px',
  borderTop: `0.5px solid ${COLORS.border}`,
}

const cardBodyStandalone = {
  padding: '18px',
}

const chevron = {
  color: COLORS.textSecondary,
  fontSize: 18,
  lineHeight: 1,
  transition: 'transform 0.18s ease',
}

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  marginTop: 16,
}

const fieldShell = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
}

const fieldLabel = {
  fontSize: 11,
  color: COLORS.textFaint,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const panelLabel = {
  fontSize: 10,
  color: COLORS.textFaint,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 10,
}

const summaryBadge = {
  background: COLORS.surface,
  color: COLORS.textSecondary,
  border: `0.5px solid ${COLORS.border}`,
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 11,
  whiteSpace: 'nowrap',
}

const miniBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: COLORS.surface,
  border: `0.5px solid ${COLORS.border}`,
  color: COLORS.textSecondary,
  fontSize: 11,
}

const badgeWrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const saveBtn = {
  background: COLORS.accent,
  color: COLORS.buttonText,
  border: 'none',
  borderRadius: 8,
  padding: '9px 14px',
  fontSize: 12,
  cursor: 'pointer',
}

const uploadShell = {
  width: '100%',
  border: `1px dashed ${COLORS.border2}`,
  borderRadius: 8,
  padding: '24px 18px',
  textAlign: 'center',
  background: COLORS.surface,
  cursor: 'pointer',
}

const prefsSelect = {
  width: '100%',
  minHeight: 40,
  background: COLORS.black,
  color: COLORS.text,
  border: `0.5px solid ${COLORS.border2}`,
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const toggleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const checkboxGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginTop: 10,
}

const checkboxPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  border: `0.5px solid ${COLORS.border}`,
  borderRadius: 999,
  background: COLORS.surface,
}

const docRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  background: COLORS.surface,
  border: `0.5px solid ${COLORS.border}`,
  borderRadius: 8,
}

const removeBtn = {
  background: 'transparent',
  color: COLORS.redText,
  border: `0.5px solid ${COLORS.red}`,
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer',
}

const loadingCard = {
  background: COLORS.surface2,
  border: `0.5px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: '24px 20px',
  fontSize: 13,
  color: COLORS.textSecondary,
}

const toastStyle = {
  position: 'sticky',
  top: 12,
  marginLeft: 'auto',
  width: 'fit-content',
  marginBottom: 12,
  zIndex: 4,
  background: COLORS.accentLight,
  border: `0.5px solid ${COLORS.border2}`,
  color: COLORS.accentText,
  padding: '8px 12px',
  borderRadius: 999,
  fontSize: 12,
}
