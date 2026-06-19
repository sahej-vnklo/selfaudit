import React, { useEffect, useMemo, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_BORDER,
  DARK_BORDER_STRONG,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_RED_TEXT,
  DARK_SOLID_PANEL_ALT,
  DARK_TEXT,
  DARK_TEXT_FAINT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_BORDER,
  LIGHT_BORDER_STRONG,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED,
  LIGHT_RED_TEXT,
  LIGHT_SOLID_PANEL_ALT,
  LIGHT_TEXT,
  LIGHT_TEXT_FAINT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_BORDER,
  SHARP_BORDER_STRONG,
  SHARP_GREEN,
  SHARP_GREEN_TEXT,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_RED_TEXT,
  SHARP_SOLID_PANEL_ALT,
  SHARP_TEXT,
  SHARP_TEXT_FAINT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    surface3: DARK_SOLID_PANEL_ALT,
    border: DARK_BORDER,
    border2: DARK_BORDER_STRONG,
    text: DARK_TEXT,
    textSecondary: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    textFaint: DARK_TEXT_FAINT,
    accent: DARK_ACCENT,
    accentLight: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    buttonText: DARK_TEXT,
    red: DARK_RED,
    redText: DARK_RED_TEXT,
  },
  light: {
    bg: '#ffffff',
    surface: 'linear-gradient(155deg, #fcfcfd 0%, #ececee 100%)',
    surface2: '#f1f1f3',
    surface3: '#f4f4f6',
    border: LIGHT_BORDER,
    border2: LIGHT_BORDER_STRONG,
    text: LIGHT_TEXT,
    textSecondary: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    textFaint: LIGHT_TEXT_FAINT,
    accent: LIGHT_ACCENT,
    accentLight: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    buttonText: '#FBF7F2',
    red: LIGHT_RED,
    redText: LIGHT_RED_TEXT,
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    surface3: SHARP_SOLID_PANEL_ALT,
    border: SHARP_BORDER,
    border2: SHARP_BORDER_STRONG,
    text: SHARP_TEXT,
    textSecondary: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    textFaint: SHARP_TEXT_FAINT,
    accent: SHARP_ACCENT,
    accentLight: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    buttonText: SHARP_TEXT,
    red: SHARP_RED,
    redText: SHARP_RED_TEXT,
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
  if (value === 0) return true
  if (typeof value === 'number') return Number.isFinite(value)
  return !!String(value ?? '').trim()
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

function hasAnyBriefData(financialFields, financial, operational, context) {
  const visibleFields = [
    ...financialFields.map((field) => financial[field.key]),
    ...operationalFields.map((field) => operational[field.key]),
    ...getVisibleContextFields(context).map((field) => context[field.key]),
  ]
  return visibleFields.some(isFilled)
}

function SynthCard({ synthProfile, openSections, setOpenSections }) {
  return (
    <SectionCard
      title="Synthesized intelligence"
      isOpen={openSections.synthesized}
      onToggle={() => setOpenSections((prev) => ({ ...prev, synthesized: !prev.synthesized }))}
      showSave={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {synthProfile ? (
          <>
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
          </>
        ) : (
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
            Your intelligence profile will start compounding after audits, reports, brief data, and connector signals accumulate.
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export default function IntelligenceBrief({ user, profile, theme: themeProp, onProfileChange, synthOnly = false }) {
  const theme = themeProp || localStorage.getItem('sa-theme') || 'dark'
  const themeVars = getThemeVars(theme)
  const [financial, setFinancial] = useState({})
  const [operational, setOperational] = useState({})
  const [context, setContext] = useState({})
  const [synthProfile, setSynthProfile] = useState(null)
  const [openSections, setOpenSections] = useState({
    synthesized: true,
    financial: false,
    operational: false,
    context: false,
  })
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState('')
  const [toast, setToast] = useState('')

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
          .select('financial, operational, context')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cancelled) return
        if (data?.financial) setFinancial(data.financial)
        if (data?.operational) setOperational(data.operational)
        if (data?.context) setContext(data.context)

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
  }, [intelligenceUnlocked, user?.id])

  const saveBrief = async (sectionKey) => {
    if (!user?.id) return
    setSavingSection(sectionKey)
    try {
      const sb = await initSupabase()
      const nextFinancial = normalizeFieldGroup(financialFields, financial)
      const nextOperational = normalizeFieldGroup(operationalFields, operational)
      const nextContext = normalizeFieldGroup(visibleContextFields, context)
      const payload = {
        user_id: user.id,
        financial: nextFinancial,
        operational: nextOperational,
        context: nextContext,
        updated_at: new Date().toISOString(),
      }

      const { error } = await sb
        .from('intelligence_brief')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error

      const profileUpdate = {
        intelligence_complete: hasAnyBriefData(financialFields, nextFinancial, nextOperational, nextContext),
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

  if (synthOnly) {
    return (
      <div style={{ ...themeVars, maxWidth: 980 }}>
        {loading ? (
          <div style={loadingCard}>Loading…</div>
        ) : intelligenceUnlocked ? (
          <SynthCard synthProfile={synthProfile} openSections={openSections} setOpenSections={setOpenSections} />
        ) : (
          <div style={{ fontSize: 14, color: COLORS.textSecondary, padding: '20px 0' }}>
            Intelligence synthesis is available on the Intelligence plan. Upgrade to see your compounded business profile.
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ ...themeVars, maxWidth: 980 }}>
      <div style={pageHeader}>
        <div>
          <h1 style={pageTitle}>Intelligence brief</h1>
          <p style={pageSub}>
            Add the business context you want SelfAudit to reason from. Missing fields are treated as assumptions.
          </p>
        </div>
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      {loading ? (
        <div style={loadingCard}>Loading intelligence brief…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {intelligenceUnlocked ? (
            <SectionCard
              title="Synthesized intelligence"
              isOpen={openSections.synthesized}
              onToggle={() => setOpenSections((prev) => ({ ...prev, synthesized: !prev.synthesized }))}
              showSave={false}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {synthProfile ? (
                  <>
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
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                    Your intelligence profile will start compounding after audits, reports, brief data, and connector signals accumulate.
                  </div>
                )}
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              title="Intelligence layer"
              isOpen={openSections.synthesized}
              onToggle={() => setOpenSections((prev) => ({ ...prev, synthesized: !prev.synthesized }))}
              showSave={false}
            >
              <div style={{ marginTop: 16 }}>
                <div style={panelLabel}>Intelligence layer</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                  Cross-audit synthesis, compounding business memory, and alert preferences are reserved for Intelligence users. Foundation still gets audits and saved report history.
                </div>
              </div>
            </SectionCard>
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

function SectionCard({ title, isOpen, onToggle, children, onSave, saving, showSave = true, label = 'Section' }) {
  return (
    <div style={card}>
      <button type="button" onClick={onToggle} style={cardHeader}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 16, color: COLORS.text }}>{title}</div>
        </div>
        <div style={{ ...chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</div>
      </button>
      {isOpen && (
        <div style={cardBody}>
          {children}
          {showSave && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" onClick={onSave} disabled={saving} style={saveBtn}>
                {saving ? 'Saving…' : 'Save section'}
              </button>
            </div>
          )}
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
