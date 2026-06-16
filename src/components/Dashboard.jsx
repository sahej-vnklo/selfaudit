import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import { generateReport } from '../lib/audit.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import IntelligenceBrief from './IntelligenceBrief.jsx'
import ExecutionPanel from './ExecutionPanel.jsx'
import DashboardWelcomeTour from './DashboardWelcomeTour.jsx'
import CockpitSection from './Cockpit.jsx'
import DepartmentPage from './DepartmentPage.jsx'
import SchemaSetup from './SchemaSetup.jsx'
import SimulationPage from './SimulationPage.jsx'
import { OPERATIONAL_AREAS } from '../lib/governance/areaRegistry.js'
import './Dashboard.css'
// Legacy sharpTheme imports kept for sub-component backward-compatibility
// (sub-components still reference old color constants in their internal styles)
import {
  DARK_ACCENT,
  DARK_ACCENT_SOFT,
  DARK_ACCENT_TEXT,
  DARK_AMBER,
  DARK_AMBER_BG,
  DARK_AMBER_TEXT,
  DARK_BORDER,
  DARK_BORDER_STRONG,
  DARK_GREEN,
  DARK_GREEN_BG,
  DARK_GREEN_TEXT,
  DARK_HERO_BORDER,
  DARK_HERO_INSET,
  DARK_HERO_SHADOW,
  DARK_HERO_SURFACE,
  DARK_PAGE_BG,
  DARK_PANEL_BORDER,
  DARK_PANEL_SHADOW,
  DARK_PANEL_SURFACE,
  DARK_RED,
  DARK_RED_BG,
  DARK_RED_TEXT,
  DARK_SOLID_PANEL_ALT,
  DARK_TEXT,
  DARK_TEXT_FAINT,
  DARK_TEXT_MUTED,
  DARK_TEXT_SOFT,
  LIGHT_ACCENT,
  LIGHT_ACCENT_SOFT,
  LIGHT_ACCENT_TEXT,
  LIGHT_AMBER,
  LIGHT_AMBER_BG,
  LIGHT_AMBER_TEXT,
  LIGHT_BORDER,
  LIGHT_BORDER_STRONG,
  LIGHT_GREEN,
  LIGHT_GREEN_BG,
  LIGHT_GREEN_TEXT,
  LIGHT_HERO_BORDER,
  LIGHT_HERO_INSET,
  LIGHT_HERO_SHADOW,
  LIGHT_HERO_SURFACE,
  LIGHT_PAGE_BG,
  LIGHT_PANEL_BORDER,
  LIGHT_PANEL_SHADOW,
  LIGHT_PANEL_SURFACE,
  LIGHT_RED,
  LIGHT_RED_BG,
  LIGHT_RED_TEXT,
  LIGHT_SOLID_PANEL_ALT,
  LIGHT_TEXT,
  LIGHT_TEXT_FAINT,
  LIGHT_TEXT_MUTED,
  LIGHT_TEXT_SOFT,
  SHARP_ACCENT,
  SHARP_ACCENT_SOFT,
  SHARP_ACCENT_TEXT,
  SHARP_AMBER,
  SHARP_AMBER_BG,
  SHARP_AMBER_TEXT,
  SHARP_BORDER,
  SHARP_BORDER_STRONG,
  SHARP_GREEN,
  SHARP_GREEN_BG,
  SHARP_GREEN_TEXT,
  SHARP_HERO_BORDER,
  SHARP_HERO_INSET,
  SHARP_HERO_SHADOW,
  SHARP_HERO_SURFACE,
  SHARP_PAGE_BG,
  SHARP_PANEL_BORDER,
  SHARP_PANEL_SHADOW,
  SHARP_PANEL_SURFACE,
  SHARP_RED,
  SHARP_RED_BG,
  SHARP_RED_TEXT,
  SHARP_SOLID_PANEL_ALT,
  SHARP_TEXT,
  SHARP_TEXT_FAINT,
  SHARP_TEXT_MUTED,
  SHARP_TEXT_SOFT,
} from '../lib/sharpTheme.js'

const THEME_ORDER = ['dark', 'light']

const THEMES = {
  // ── Dark — ember on near-black ───────────────────────────────────────────
  dark: {
    bg:            '#0a0707',
    surface:       '#110b0a',
    surface2:      '#1a1110',
    surface3:      '#18120f',
    panel:         '#18120f',
    panelAlt:      '#241a16',
    border:        'rgba(244, 235, 227, 0.08)',
    border2:       'rgba(244, 235, 227, 0.14)',
    text:          '#f4ebe3',
    textSecondary: '#a89a91',
    textMuted:     '#6b5f58',
    textFaint:     'rgba(244, 235, 227, 0.32)',
    accent:        'oklch(0.68 0.18 35)',
    accentLight:   'oklch(0.68 0.18 35 / 0.12)',
    accentText:    'oklch(0.78 0.16 40)',
    red:           'oklch(0.68 0.18 35)',
    redBg:         'oklch(0.68 0.18 35 / 0.1)',
    redText:       'oklch(0.78 0.16 40)',
    amber:         'oklch(0.78 0.15 70)',
    amberBg:       'oklch(0.78 0.15 70 / 0.1)',
    amberText:     'oklch(0.78 0.15 70)',
    green:         'oklch(0.78 0.16 150)',
    greenBg:       'oklch(0.78 0.16 150 / 0.1)',
    greenText:     'oklch(0.78 0.16 150)',
    blue:          'oklch(0.72 0.12 250)',
    violet:        'oklch(0.7 0.14 290)',
    sand:          '#a89a91',
    white:         '#f4ebe3',
    overlay:       'rgba(10, 7, 7, 0.72)',
    overlaySoft:   'rgba(10, 7, 7, 0.4)',
  },
  // ── Light — ember on white paper ─────────────────────────────────────────
  light: {
    bg:            '#ffffff',
    surface:       '#f7f4ef',
    surface2:      '#efeae2',
    surface3:      '#f1f1f3',
    panel:         '#f1f1f3',
    panelAlt:      '#f7f7f9',
    border:        'rgba(26, 17, 16, 0.1)',
    border2:       'rgba(26, 17, 16, 0.16)',
    text:          '#1a1110',
    textSecondary: '#6b5d54',
    textMuted:     '#9a8a7f',
    textFaint:     'rgba(26, 17, 16, 0.35)',
    accent:        'oklch(0.52 0.18 32)',
    accentLight:   'oklch(0.52 0.18 32 / 0.1)',
    accentText:    'oklch(0.5 0.19 33)',
    red:           'oklch(0.52 0.18 32)',
    redBg:         'oklch(0.52 0.18 32 / 0.08)',
    redText:       'oklch(0.5 0.19 33)',
    amber:         'oklch(0.65 0.15 70)',
    amberBg:       'oklch(0.65 0.15 70 / 0.08)',
    amberText:     'oklch(0.65 0.15 70)',
    green:         'oklch(0.55 0.14 150)',
    greenBg:       'oklch(0.55 0.14 150 / 0.08)',
    greenText:     'oklch(0.55 0.14 150)',
    blue:          'oklch(0.55 0.12 250)',
    violet:        'oklch(0.55 0.12 290)',
    sand:          '#9a8a7f',
    white:         '#ffffff',
    overlay:       'rgba(255, 255, 255, 0.72)',
    overlaySoft:   'rgba(255, 255, 255, 0.4)',
  },
}

const G = {
  black: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  panel: 'var(--panel)',
  panelAlt: 'var(--panel-alt)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textFaint: 'var(--text-faint)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  accentText: 'var(--accent-text)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  redText: 'var(--red-text)',
  amber: 'var(--amber)',
  amberBg: 'var(--amber-bg)',
  amberText: 'var(--amber-text)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  greenText: 'var(--green-text)',
  blue: 'var(--blue)',
  violet: 'var(--violet)',
  sand: 'var(--sand)',
  white: 'var(--white)',
  overlay: 'var(--overlay)',
  overlaySoft: 'var(--overlay-soft)',
}

function getThemeVars(theme) {
  const C   = THEMES[theme] || THEMES.dark
  const dark = theme !== 'light'
  // Dashboard-specific surface tokens (injected as CSS vars for Dashboard.css)
  // Glass surface treatment — gradient fill + inset highlight + layered shadow + hairline border
  const dSurface    = dark
    ? 'linear-gradient(155deg, #261c17 0%, #16100d 100%)'
    : 'linear-gradient(155deg, #fcfcfd 0%, #ececee 100%)'
  const dRaised     = dark
    ? 'linear-gradient(180deg, #2c221c 0%, #1e1612 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f1f1f3 100%)'
  const dBorder       = dark ? 'rgba(244,235,227,0.17)' : 'rgba(20,16,15,0.16)'
  const dBorderStrong = dark ? 'rgba(244,235,227,0.28)' : 'rgba(20,16,15,0.26)'
  const dShadow     = dark
    ? '0 2px 5px rgba(0,0,0,0.5), 0 18px 40px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)'
    : '0 1px 2px rgba(20,16,15,0.07), 0 12px 28px -16px rgba(20,16,15,0.24), 0 0 0 1px rgba(20,16,15,0.04), inset 0 1px 0 rgba(255,255,255,0.9)'
  const dBtnShadow  = dark
    ? '0 1px 2px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
    : '0 1px 2px rgba(20,16,15,0.08), 0 1px 1px rgba(20,16,15,0.04), inset 0 1px 0 rgba(255,255,255,0.85)'
  // Kept for sub-component backward-compat (PanelCard, KpiCard etc. use --rich-* vars)
  const rich = theme === 'light'
    ? { heroSurface: LIGHT_HERO_SURFACE, panelSurface: LIGHT_PANEL_SURFACE, heroBorder: LIGHT_HERO_BORDER, panelBorder: LIGHT_PANEL_BORDER, heroInset: LIGHT_HERO_INSET, heroShadow: LIGHT_HERO_SHADOW, panelShadow: LIGHT_PANEL_SHADOW }
    : { heroSurface: DARK_HERO_SURFACE,  panelSurface: DARK_PANEL_SURFACE,  heroBorder: DARK_HERO_BORDER,  panelBorder: DARK_PANEL_BORDER,  heroInset: DARK_HERO_INSET,  heroShadow: DARK_HERO_SHADOW,  panelShadow: DARK_PANEL_SHADOW  }
  return {
    // ── Semantic tokens (G.xxx aliases) ──────────────────────────────────
    '--bg':             C.bg,
    '--surface':        C.surface,
    '--surface2':       C.surface2,
    '--surface3':       C.surface3,
    '--panel':          C.panel,
    '--panel-alt':      C.panelAlt,
    '--border':         C.border,
    '--border2':        C.border2,
    '--text':           C.text,
    '--text-secondary': C.textSecondary,
    '--text-muted':     C.textMuted,
    '--text-faint':     C.textFaint,
    '--accent':         C.accent,
    '--accent-light':   C.accentLight,
    '--accent-text':    C.accentText,
    '--red':            C.red,
    '--red-bg':         C.redBg,
    '--red-text':       C.redText,
    '--amber':          C.amber,
    '--amber-bg':       C.amberBg,
    '--amber-text':     C.amberText,
    '--green':          C.green,
    '--green-bg':       C.greenBg,
    '--green-text':     C.greenText,
    '--blue':           C.blue,
    '--violet':         C.violet,
    '--sand':           C.sand,
    '--white':          C.white,
    '--overlay':        C.overlay,
    '--overlay-soft':   C.overlaySoft,
    // ── New design tokens (used by Dashboard.css) ─────────────────────────
    '--fg':             C.text,
    '--fg-dim':         C.textSecondary,
    '--fg-mute':        C.textMuted,
    '--ember':          C.accent,
    '--ember-glow':     C.accentText,
    '--line':           C.border,
    '--line-2':         C.border2,
    '--bg-2':           C.surface,
    '--bg-3':           C.surface2,
    '--d-surface':      dSurface,
    '--d-raised':       dRaised,
    '--d-border':       dBorder,
    '--d-border-strong':dBorderStrong,
    '--d-shadow':       dShadow,
    '--d-btn-shadow':   dBtnShadow,
    '--ok':             C.green,
    '--warn':           C.amber,
    // ── Sub-component backward-compat ─────────────────────────────────────
    '--rich-hero-surface':  rich.heroSurface,
    '--rich-panel-surface': rich.panelSurface,
    '--rich-hero-border':   rich.heroBorder,
    '--rich-panel-border':  rich.panelBorder,
    '--rich-hero-inset':    rich.heroInset,
    '--rich-hero-shadow':   rich.heroShadow,
    '--rich-panel-shadow':  rich.panelShadow,
  }
}

const DOMAIN_MAP = {
  SaaS: ['Strategy', 'Product', 'Sales', 'Marketing', 'Customer Experience', 'Technology', 'Data & Analytics', 'Finance', 'People & Culture'],
  Agency: ['Strategy', 'Sales', 'Marketing', 'Operations', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  Retail: ['Strategy', 'Operations', 'Marketing', 'Sales', 'Supply Chain', 'Customer Experience', 'Finance', 'Brand'],
  'E-commerce': ['Strategy', 'Marketing', 'Operations', 'Technology', 'Customer Experience', 'Supply Chain', 'Data & Analytics', 'Finance'],
  'Restaurant / Food': ['Operations', 'Marketing', 'Finance', 'People & Culture', 'Customer Experience', 'Brand', 'Supply Chain'],
  Healthcare: ['Operations', 'Strategy', 'Legal & Compliance', 'People & Culture', 'Finance', 'Technology', 'Customer Experience'],
  Legal: ['Operations', 'Strategy', 'Legal & Compliance', 'Finance', 'People & Culture', 'Brand', 'Customer Experience'],
  'Real Estate': ['Sales', 'Marketing', 'Operations', 'Finance', 'Strategy', 'Brand', 'Customer Experience'],
  Construction: ['Operations', 'Finance', 'People & Culture', 'Supply Chain', 'Strategy', 'Legal & Compliance'],
  Manufacturing: ['Operations', 'Supply Chain', 'Finance', 'Technology', 'People & Culture', 'Strategy', 'Legal & Compliance'],
  Logistics: ['Operations', 'Supply Chain', 'Technology', 'Finance', 'Strategy', 'People & Culture'],
  Education: ['Strategy', 'Operations', 'Marketing', 'Technology', 'People & Culture', 'Finance', 'Customer Experience'],
  'Finance / Accounting': ['Strategy', 'Operations', 'Legal & Compliance', 'Technology', 'People & Culture', 'Finance', 'Data & Analytics'],
  Insurance: ['Operations', 'Legal & Compliance', 'Finance', 'Technology', 'Strategy', 'Customer Experience'],
  Consulting: ['Strategy', 'Operations', 'Sales', 'Marketing', 'People & Culture', 'Finance', 'Brand'],
  Marketing: ['Strategy', 'Brand', 'Data & Analytics', 'Operations', 'Sales', 'Customer Experience', 'Technology'],
  'Media / Publishing': ['Strategy', 'Brand', 'Marketing', 'Operations', 'Finance', 'Technology', 'Data & Analytics'],
  'Travel / Hospitality': ['Operations', 'Customer Experience', 'Marketing', 'Finance', 'Brand', 'People & Culture'],
  Nonprofit: ['Strategy', 'Operations', 'Finance', 'Marketing', 'People & Culture', 'Partnerships'],
  'Freelancer / Solo': ['Strategy', 'Sales', 'Marketing', 'Finance', 'Brand', 'Operations'],
  Other: ['Strategy', 'Operations', 'Sales', 'Marketing', 'Finance', 'People & Culture', 'Technology', 'Customer Experience'],
}

const BUSINESS_OPTIONS = [
  'SaaS', 'Agency', 'Retail', 'E-commerce', 'Restaurant / Food',
  'Healthcare', 'Legal', 'Real Estate', 'Construction', 'Manufacturing',
  'Logistics', 'Education', 'Finance / Accounting', 'Insurance',
  'Consulting', 'Marketing', 'Media / Publishing', 'Travel / Hospitality',
  'Nonprofit', 'Freelancer / Solo', 'Other',
]

const TIER_BADGE = {
  intelligence: { bg: 'var(--surface3)', color: 'var(--blue)', label: 'SelfAudit' },
}

const TIERS = [
  {
    key: 'professional',
    name: 'Professional',
    price: '$99',
    popular: true,
    desc: 'Persistent intelligence embedded into your business.',
    features: ['Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'AI opportunity breakdown', 'Re-audit anytime', 'Track progress over time', 'Email delivery'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$999',
    desc: 'Everything in Professional, for larger teams.',
    features: ['Everything in Professional', 'Priority support', 'Dedicated onboarding'],
  },
]
const NOTIFICATION_AREAS = [
  { key: 'goal_progress', label: 'Goal progress' },
  { key: 'pipeline_revenue', label: 'Pipeline & revenue' },
  { key: 'execution', label: 'Execution' },
  { key: 'customer_health', label: 'Customer health' },
  { key: 'critical_risks', label: 'Critical risks' },
]
const DEFAULT_NOTIFICATION_PREFS = {
  enabled: true,
  frequency: 'daily',
  channels: ['in_app'],
  areas: NOTIFICATION_AREAS.map((area) => area.key),
}
const FOUNDER_CHECKIN_SNOOZE_MS = 24 * 60 * 60 * 1000
const BUSINESS_STATE_FIELDS = ['core_offer', 'revenue_streams', 'operational_blockers', 'target_customer', 'funnel_stages']
const LEGACY_NOTIFICATION_AREA_MAP = {
  revenue: 'pipeline_revenue',
  connectors: 'pipeline_revenue',
  operations: 'execution',
  people: 'execution',
  customer_experience: 'customer_health',
}
const GOVERNANCE_AREA_LABELS = Object.fromEntries(OPERATIONAL_AREAS.map((area) => [area.id, area.label]))
const SECTIONS = ['home', 'oversight', 'reports', 'intelligence', 'business-state', 'alerts', 'connectors', 'simulate', 'agent', 'billing', 'account']
const INTELLIGENCE_ONLY_SECTIONS = new Set(['oversight', 'alerts', 'connectors', 'agent'])
const WELCOME_TOUR_ROLLOUT_AT = Date.parse('2026-05-24T00:30:00-04:00')

function normalizeTier(raw) {
  return 'intelligence'
}

function profileRequiresPayment(profile) {
  // Pilot users with unexpired access don't need to pay
  if (profile?.is_pilot && profile?.access_expires_at) {
    if (new Date(profile.access_expires_at) > new Date()) return false
  }
  return !profile?.stripe_subscription_id
}

function shouldShowWelcomeTourForProfile(profile) {
  if (!profile) return false
  if (profile.onboarding_complete) return false
  const createdAt = Date.parse(profile.created_at || '')
  if (!Number.isFinite(createdAt)) return false
  return createdAt >= WELCOME_TOUR_ROLLOUT_AT
}

function normalizeNotificationAreas(input) {
  const allowed = new Set(NOTIFICATION_AREAS.map((area) => area.key))
  const next = []
  for (const area of Array.isArray(input) ? input : []) {
    const mapped = LEGACY_NOTIFICATION_AREA_MAP[area] || area
    if (allowed.has(mapped) && !next.includes(mapped)) next.push(mapped)
  }
  return next.length > 0 ? next : DEFAULT_NOTIFICATION_PREFS.areas
}

function notificationFrequencyLabel(value) {
  if (value === 'every_3_days') return 'Every 3 days'
  if (value === 'weekly') return 'Weekly'
  return 'Daily'
}

function notificationChannelLabel(value) {
  if (value === 'email') return 'Email'
  return 'Dashboard'
}

function alertSeverityTone(value) {
  if (value === 'critical') return { bg: G.redBg, color: G.redText, border: G.red }
  if (value === 'high') return { bg: G.amberBg, color: G.amberText, border: G.amber }
  return { bg: G.surface3, color: G.textSecondary, border: G.border2 }
}

function alertStatusTone(value) {
  if (value === 'acknowledged') return { bg: G.accentLight, color: G.accentText, border: G.accent }
  return { bg: G.surface3, color: G.textSecondary, border: G.border2 }
}

function governanceStatusTone(value) {
  if (value === 'bad') return { bg: G.redBg, color: G.redText, border: G.red, label: 'Needs attention' }
  if (value === 'watch') return { bg: G.amberBg, color: G.amberText, border: G.amber, label: 'Watch closely' }
  if (value === 'good') return { bg: G.greenBg, color: G.greenText, border: G.green, label: 'Stable' }
  return { bg: G.surface3, color: G.textSecondary, border: G.border2, label: 'No signal' }
}

function alertAgeLabel(input) {
  if (!input) return 'just now'
  const created = new Date(input)
  if (Number.isNaN(created.getTime())) return 'just now'
  const hours = (Date.now() - created.getTime()) / (1000 * 60 * 60)
  if (hours >= 48) return `${Math.round(hours / 24)} days old`
  if (hours >= 24) return '1 day old'
  if (hours >= 1) return `${Math.round(hours)}h old`
  return 'New'
}

function getFounderCheckInSnooze(state, reportId) {
  const snooze = state?.founder_checkin_snooze
  if (!reportId || !snooze || typeof snooze !== 'object') return null
  const until = Number(snooze.until)
  if (!Number.isFinite(until) || until <= Date.now()) return null
  if (snooze.report_id && snooze.report_id !== reportId) return null
  return { until, reportId: snooze.report_id || reportId }
}

function isFounderCheckInSnoozed(state, reportId) {
  return !!getFounderCheckInSnooze(state, reportId)
}

function getOpenIssueStatuses(state, reportId) {
  if (!reportId || !state?.open_issue_statuses || typeof state.open_issue_statuses !== 'object') return {}
  const reportStatuses = state.open_issue_statuses[reportId]
  return reportStatuses && typeof reportStatuses === 'object' ? reportStatuses : {}
}

function hasMeaningfulBusinessState(source) {
  return BUSINESS_STATE_FIELDS.some((field) => {
    const value = source?.[field]
    return Array.isArray(value) ? value.some(Boolean) : !!String(value || '').trim()
  })
}

function normalizeBusinessStateSnapshot(source) {
  if (!source || typeof source !== 'object') return {}
  return {
    ...source,
    core_offer: typeof source.core_offer === 'string' ? source.core_offer.trim() : source.core_offer,
    revenue_streams: Array.isArray(source.revenue_streams)
      ? source.revenue_streams.filter(Boolean)
      : source.revenue_streams,
    operational_blockers: Array.isArray(source.operational_blockers)
      ? source.operational_blockers.filter(Boolean)
      : (Array.isArray(source.current_constraints) ? source.current_constraints.filter(Boolean) : source.operational_blockers),
    target_customer: typeof source.target_customer === 'string' ? source.target_customer.trim() : source.target_customer,
    funnel_stages: Array.isArray(source.funnel_stages)
      ? source.funnel_stages.filter(Boolean)
      : source.funnel_stages,
  }
}

function mergeBusinessState(primary, fallback) {
  const base = normalizeBusinessStateSnapshot(primary)
  const backup = normalizeBusinessStateSnapshot(fallback)
  const next = { ...backup, ...base }
  let usedFallback = false

  BUSINESS_STATE_FIELDS.forEach((field) => {
    const primaryValue = base[field]
    const fallbackValue = backup[field]
    const primaryPresent = Array.isArray(primaryValue) ? primaryValue.length > 0 : !!String(primaryValue || '').trim()
    if (!primaryPresent && fallbackValue != null) {
      next[field] = fallbackValue
      usedFallback = true
    }
  })

  if (usedFallback) {
    next._autofilled_from_memory = true
  } else {
    delete next._autofilled_from_memory
  }

  return next
}

function parseReportContent(input) {
  if (!input) return null
  if (typeof input === 'object' && !Array.isArray(input)) {
    if (input.report_data && typeof input.report_data === 'object') return input.report_data
    if (input.content) return parseReportContent(input.content)
    if (input.conversation_mode || input.goal_gap_analysis || input.ai_opportunities || input.domains) return input
  }
  try {
    return typeof input === 'string' ? JSON.parse(input) : input
  } catch {
    return null
  }
}

function computeHealthScore(domains) {
  if (!domains?.length) return 0
  const total = domains.reduce((sum, domain) => {
    if (domain.status === 'critical') return sum + 30
    if (domain.status === 'needs_work') return sum + 60
    return sum + 85
  }, 0)
  return Math.round(total / domains.length)
}

function severityRank(status) {
  if (status === 'critical') return 0
  if (status === 'needs_work') return 1
  return 2
}

function domainScore(domain) {
  if (domain.status === 'critical') return 30
  if (domain.status === 'needs_work') return 60
  return 85
}

function domainSeverityColor(status) {
  if (status === 'critical') return G.red
  if (status === 'needs_work') return G.amber
  return G.green
}

function modeDotColor(mode) {
  if (mode === 'EXECUTION') return G.violet
  if (mode === 'HUMAN_MOMENT' || mode === 'EXECUTION_HUMAN') return G.sand
  return G.blue
}

function getInitials(name, email) {
  if (name) return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] || '?').toUpperCase()
}

function getSectionFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const section = hash.split('?')[0]
  return SECTIONS.includes(section) ? section : 'home'
}

function getHashParams() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  return new URLSearchParams(query)
}

function formatRelativeTime(input) {
  if (!input) return 'just now'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return 'just now'

  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const units = [
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  for (const [unit, size] of units) {
    if (absMs >= size || unit === 'minute') {
      return rtf.format(Math.round(diffMs / size), unit)
    }
  }

  return 'just now'
}

function extractGoalFromContext(context) {
  if (!context) return { goal: '', progress: null, timeline: '' }
  if (typeof context === 'object') {
    return {
      goal: context.active_goal || context.goal || context.current_goal || '',
      progress: typeof context.goal_progress === 'number' ? context.goal_progress : null,
      timeline: context.goal_timeline || context.timeline_assessment || '',
    }
  }
  const goalMatch = String(context).match(/active goal:\s*(.+)/i)
  return { goal: goalMatch?.[1]?.trim() || '', progress: null, timeline: '' }
}

function extractGoalState(profile, reports, businessState) {
  if (businessState?.active_goal_id) {
    const structuredDeadline = businessState.goal_deadline
      ? new Date(businessState.goal_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : ''

    return {
      goal: businessState.active_goal || '',
      progress: typeof businessState.goal_score === 'number' ? businessState.goal_score : null,
      timeline: structuredDeadline,
      goal_health_score: typeof businessState.goal_health_score === 'number' ? businessState.goal_health_score : null,
      goal_deadline: businessState.goal_deadline || null,
      goal_metric_key: businessState.goal_metric_key || null,
      goal_area_id: businessState.goal_area_id || null,
    }
  }

  const savedScore = typeof businessState?.goal_score === 'number' ? businessState.goal_score : null
  const fromProfile = extractGoalFromContext(profile?.context)
  if (fromProfile.goal) {
    return {
      ...fromProfile,
      progress: savedScore ?? fromProfile.progress,
    }
  }

  for (const report of reports) {
    const parsed = parseReportContent(report.content)
    if (!parsed) continue
    const goal = parsed.goal_gap_analysis?.goal || parsed.business_state?.goal_state || parsed.business_state?.active_goal || ''
    const timeline = parsed.timeline_feasibility || parsed.goal_gap_analysis?.realistic_timeline || parsed.timeline_reality?.honest_take || ''
    const timelineText = String(timeline || '').trim().toLowerCase()
    const fallbackProgress = savedScore != null
      ? savedScore
      : timelineText.startsWith('feasible')
        ? 80
        : timelineText.startsWith('tight')
          ? 50
          : timelineText.startsWith('unrealistic')
            ? 20
            : null
    if (goal) return { goal, progress: fallbackProgress, timeline }
  }

  return { goal: '', progress: null, timeline: '' }
}

function formatGoalDeadline(dateString) {
  if (!dateString) return 'No deadline set'
  const parsed = new Date(dateString)
  if (Number.isNaN(parsed.getTime())) return 'No deadline set'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getGoalHealthMeta(score) {
  if (typeof score !== 'number') return { label: 'Not scored', color: G.textFaint, background: G.surface2 }
  if (score >= 70) return { label: 'On track', color: G.greenText, background: G.greenBg }
  if (score >= 40) return { label: 'Watch', color: G.amberText, background: G.amberBg }
  return { label: 'At risk', color: G.redText, background: G.redBg }
}

function formatAuditDate(dateString, options = { month: 'short', day: 'numeric' }) {
  if (!dateString) return 'Latest audit'
  return new Date(dateString).toLocaleDateString('en-US', options)
}

function getLatestDiagnosticReport(reports) {
  return reports.find((report) => {
    const parsed = parseReportContent(report)
    return parsed && Array.isArray(parsed.domains) && parsed.domains.length > 0
  }) || null
}

function compactOpportunityText(text, maxLength = 68) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`
}

function normalizeOpportunityKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getOpportunitySignal(area, why) {
  const text = `${area || ''} ${why || ''}`.toLowerCase()
  if (/revenue|sales|lead|pricing|pipeline|book|close|upsell|conversion/.test(text)) {
    return { label: '↑ Revenue', tone: 'green' }
  }
  if (/cost|ops|operation|workflow|manual|dispatch|routing|support|time|efficiency|onboarding/.test(text)) {
    return { label: '↓ Cost', tone: 'amber' }
  }
  if (/retention|churn|customer|follow-up|experience/.test(text)) {
    return { label: '↑ Retention', tone: 'blue' }
  }
  return { label: '↑ Growth', tone: 'blue' }
}

function buildAiOpportunityItems(reports, tier) {
  const parsedReports = reports
    .map((report) => ({ report, parsed: parseReportContent(report) }))
    .filter(({ parsed }) => parsed)

  if (parsedReports.length === 0) return []

  if (tier !== 'intelligence') {
    const source = parsedReports.find(({ parsed }) => Array.isArray(parsed.ai_opportunities) && parsed.ai_opportunities.length > 0)
    if (!source) return []

    return source.parsed.ai_opportunities.slice(0, 3).map((item, index) => ({
      id: `${source.report.id}-${index}`,
      title: item.area || `Opportunity ${index + 1}`,
      summary: compactOpportunityText(item.why, 72),
      signal: getOpportunitySignal(item.area, item.why),
      reportId: source.report.id,
      reportDate: source.report.created_at,
      reportLabel: `From: ${formatAuditDate(source.report.created_at)} audit`,
      frequency: 1,
      intelligenceMeta: '',
    }))
  }

  const aggregated = new Map()

  parsedReports.forEach(({ report, parsed }) => {
    const items = Array.isArray(parsed.ai_opportunities) ? parsed.ai_opportunities : []
    items.forEach((item) => {
      const title = item?.area || ''
      if (!title) return

      const key = normalizeOpportunityKey(title)
      const existing = aggregated.get(key) || {
        id: key,
        title,
        summary: compactOpportunityText(item.why, 72),
        signal: getOpportunitySignal(title, item.why),
        reportId: report.id,
        reportDate: report.created_at,
        frequency: 0,
        reportIds: new Set(),
      }

      existing.frequency += 1
      existing.reportIds.add(report.id)

      if (!existing.reportDate || new Date(report.created_at) > new Date(existing.reportDate)) {
        existing.title = title
        existing.summary = compactOpportunityText(item.why, 72)
        existing.signal = getOpportunitySignal(title, item.why)
        existing.reportId = report.id
        existing.reportDate = report.created_at
      }

      aggregated.set(key, existing)
    })
  })

  return [...aggregated.values()]
    .sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency
      return new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    })
    .slice(0, 3)
    .map((item) => ({
      ...item,
      reportLabel: `From: ${formatAuditDate(item.reportDate)} audit`,
      intelligenceMeta: item.frequency > 1 ? `Seen in ${item.frequency} audits` : 'Latest audit only',
    }))
}

function formatPendingActionType(actionType) {
  return String(actionType || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function Dashboard({ user, onStartAudit, onSignOut, auditJustCompleted = false, onAuditCompletedAck }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sa-theme')
    // Migrate away from removed 'sharp' theme
    return (saved === 'dark' || saved === 'light') ? saved : 'dark'
  })
  const themeVars = getThemeVars(theme)
  const [profile, setProfile] = useState(null)
  const [businessState, setBusinessState] = useState(null)
  const [businessStateLoading, setBusinessStateLoading] = useState(true)
  const [healthIntel, setHealthIntel]   = useState(null)
  const [areaTrends, setAreaTrends]     = useState({})
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [checkoutSyncing, setCheckoutSyncing] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [section, setSection]       = useState(() => getSectionFromHash())
  const [deptView, setDeptView]     = useState('all')
  const [accountTab, setAccountTab] = useState('profile')
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [scopeSetupOpen, setScopeSetupOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState('')
  const [updatingAlertIds, setUpdatingAlertIds] = useState({})
  const [completingOnboarding, setCompletingOnboarding] = useState(false)
  const [hasSchema, setHasSchema] = useState(null)
  const [actionFeed, setActionFeed] = useState({ pending: [], history: [] })
  const [actionFeedLoaded, setActionFeedLoaded] = useState(false)
  const pendingAuditRef        = useRef(null)
  const pendingAuditParamsRef  = useRef(null)
  const [decisionLogOpen, setDecisionLogOpen]         = useState(false)
  const [decisionLogFeedback, setDecisionLogFeedback] = useState([])

  // ── Dual-agent engine state ───────────────────────────────────────────────
  const [cmdInput,        setCmdInput]        = useState('')
  const [sessionActive,   setSessionActive]   = useState(false)
  const [agentState,      setAgentState]      = useState('idle')
  // 'idle' | 'planning' | 'agent_x' | 'agent_y' | 'complete' | 'error'
  const [agentXStream,    setAgentXStream]    = useState('')
  const [agentYStream,    setAgentYStream]    = useState('')
  const [agentXDone,      setAgentXDone]      = useState(false)
  const [agentYDone,      setAgentYDone]      = useState(false)
  const [sessionSaved,    setSessionSaved]    = useState(false)
  const [dualHistory,     setDualHistory]     = useState([])
  const [agentError,      setAgentError]      = useState(null)
  const [currentMode,     setCurrentMode]     = useState(null)
  // currentMode: { mode, label, xLabel, yLabel }
  const [sessionLog,      setSessionLog]      = useState([])
  // sessionLog: [{ query, xOutput, yOutput, mode, label, xLabel, yLabel }]
  const [sessionResultCount, setSessionResultCount] = useState(0)
  const [showResultsPanel,   setShowResultsPanel]   = useState(false)
  const [selectedMode,       setSelectedMode]       = useState(null)
  // null = auto-detect | 'diagnose' | 'goal' | 'scan'
  const agentXScrollRef  = useRef(null)
  const agentYScrollRef  = useRef(null)
  const agentXFinalRef   = useRef('')  // tracks Agent X full output for history

  const name = profile?.name?.trim() || user?.user_metadata?.name?.trim() || ''
  const email = user?.email || ''
  const initials = getInitials(name, email)
  const tier = normalizeTier(profile?.tier)
  const badge = TIER_BADGE[tier] || TIER_BADGE.intelligence
  const intelligenceUnlocked = tier === 'intelligence'
  const activationLocked = requiresPayment || checkoutSyncing
  const shouldShowWelcomeTour = false

  // ── Report-derived values (shared across Oversight + AI Opportunities) ──
  const latestDiagnosticReport = useMemo(() => getLatestDiagnosticReport(reports), [reports])
  const latestParsedContent    = useMemo(() => latestDiagnosticReport ? parseReportContent(latestDiagnosticReport) : null, [latestDiagnosticReport])
  const latestDomains          = latestParsedContent?.domains || []
  const sortedDomains          = useMemo(() => [...latestDomains].sort((a, b) => severityRank(a.status) - severityRank(b.status)), [latestDomains])
  const flaggedDomains         = sortedDomains.filter(d => d.status === 'critical' || d.status === 'needs_work')
  const healthScore            = latestDomains.length ? computeHealthScore(latestDomains) : null
  const goalState              = useMemo(() => extractGoalState(profile, reports, businessState), [profile, reports, businessState])
  const issueState             = useMemo(() => latestDiagnosticReport ? getOpenIssueStatuses(businessState, latestDiagnosticReport.id) : {}, [businessState, latestDiagnosticReport])
  const opportunityItems       = useMemo(() => buildAiOpportunityItems(reports, profile?.tier || 'intelligence'), [reports, profile?.tier])
  const shareUserInfo          = useMemo(() => ({
    name:     profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email:    user?.email || '',
    phone:    profile?.phone || '',
    context:  profile?.context || '',
    userId:   user?.id || null,
    tier:     profile?.tier || null,
    industry: profile?.industry || null,
    domain:   profile?.domain || null,
  }), [profile, user])

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

  const getSessionToken = useCallback(async () => {
    const sb = await initSupabase()
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token || ''
  }, [])

  const fetchActionFeed = useCallback(async () => {
    if (!user?.id) return

    try {
      const token = await getSessionToken()
      if (!token) {
        setActionFeedLoaded(true)
        return
      }

      const response = await fetch(`/api/actions/feed?userId=${encodeURIComponent(user.id)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Could not load action feed.')
      }

      setActionFeed({
        pending: Array.isArray(data?.pending) ? data.pending : [],
        history: Array.isArray(data?.history) ? data.history : [],
      })
    } catch (error) {
      console.warn('[dashboard] action feed load failed:', error?.message || error)
    } finally {
      setActionFeedLoaded(true)
    }
  }, [getSessionToken, user?.id])

  useEffect(() => {
    const syncSection = () => setSection(getSectionFromHash())
    window.addEventListener('hashchange', syncSection)
    window.addEventListener('popstate', syncSection)
    if (window.location.hash === '#dashboard' || !window.location.hash) {
      history.replaceState({ section: 'home' }, '', '#home')
    }
    return () => {
      window.removeEventListener('hashchange', syncSection)
      window.removeEventListener('popstate', syncSection)
    }
  }, [])

  useEffect(() => {
    if (intelligenceUnlocked) return
    if (!INTELLIGENCE_ONLY_SECTIONS.has(section)) return
    history.replaceState({ section: 'home' }, '', '#home')
    setSection('home')
  }, [intelligenceUnlocked, section])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    ;(async () => {
      try {
        const sb = await initSupabase()
        if (cancelled) return

        const { data, error } = await sb
          .from('profiles')
          .select('tier, industry, domain, context, name, phone, onboarding_complete, created_at, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete, shared_with_vnklo, shared_report_id, notification_email, last_digest_sent_at, last_digest_summary, is_pilot, access_expires_at')
          .eq('id', user.id)
          .single()

        if (cancelled) return
        if (error) {
          console.error('[dashboard] profile fetch error:', error.message)
          return
        }

        if (data) {
          setProfile(data)
          // Any authenticated account without an active subscription still
          // needs to finish billing before the dashboard is fully unlocked.
          if (profileRequiresPayment(data)) {
            setRequiresPayment(true)
            history.replaceState({ section: 'billing' }, '', '#billing')
            setSection('billing')
          } else {
            setRequiresPayment(false)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800))
          const retry = await sb
            .from('profiles')
            .select('tier, industry, domain, context, name, phone, onboarding_complete, created_at, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete, shared_with_vnklo, shared_report_id, notification_email, last_digest_sent_at, last_digest_summary, is_pilot, access_expires_at')
            .eq('id', user.id)
            .single()
          if (!cancelled && retry.data) {
            setProfile(retry.data)
            if (profileRequiresPayment(retry.data)) {
              setRequiresPayment(true)
              history.replaceState({ section: 'billing' }, '', '#billing')
              setSection('billing')
            } else {
              setRequiresPayment(false)
            }
          }
        }

        const { data: reportData } = await sb
          .from('reports')
          .select('id, title, content, headline, industry, domain, conversation_mode, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(24)

        if (!cancelled) setReports(reportData ?? [])
      } catch (err) {
        console.error('[dashboard] profile fetch threw:', err?.message ?? err)
      } finally {
        if (!cancelled) setReportsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setHasSchema(null)

    ;(async () => {
      try {
        const token = await getSessionToken()
        if (!token) {
          if (!cancelled) setHasSchema(true)
          return
        }

        const response = await fetch(`/api/schema-setup?userId=${encodeURIComponent(user.id)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data?.error || 'Could not load schema status.')
        }

        if (!cancelled) setHasSchema(!!data?.schema)
      } catch (error) {
        console.warn('[dashboard] schema status load failed:', error?.message || error)
        if (!cancelled) setHasSchema(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getSessionToken, user?.id])

  useEffect(() => {
    if (!user?.id) return
    setActionFeedLoaded(false)
    fetchActionFeed()
  }, [fetchActionFeed, user?.id])

  // Refresh reports from DB — called when Execution Panel opens so it always shows the latest session
  const refreshReports = useCallback(async () => {
    if (!user?.id) return
    try {
      const sb = await initSupabase()
      const { data } = await sb
        .from('reports')
        .select('id, title, content, headline, industry, domain, conversation_mode, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(24)
      if (data) setReports(data)
    } catch { /* non-blocking */ }
  }, [user?.id])

  // Poll DB for new report when panel is open after a session and save hasn't completed yet
  useEffect(() => {
    if (!showResultsPanel || !agentYDone || sessionSaved || !user?.id) return
    const knownFirstId = reports[0]?.id ?? null
    const interval = setInterval(async () => {
      try {
        const sb = await initSupabase()
        const { data } = await sb
          .from('reports')
          .select('id, title, content, headline, industry, domain, conversation_mode, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(24)
        if (data && data[0]?.id && data[0].id !== knownFirstId) {
          setReports(data)
          setSessionSaved(true)
        }
      } catch { /* non-blocking */ }
    }, 6000)
    return () => clearInterval(interval)
  }, [showResultsPanel, agentYDone, sessionSaved, user?.id])

  useEffect(() => {
    if (section !== 'billing') return
    if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) return
    if (billing) return
    setBillingLoading(true)
    setBillingError('')

    ;(async () => {
      try {
        const sb = await initSupabase()
        const { data, error } = await sb.functions.invoke('get-billing-details', {
          body: {
            customerId: profile.stripe_customer_id,
            subscriptionId: profile.stripe_subscription_id,
          },
        })
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        setBilling(data)
      } catch (err) {
        setBillingError(err.message || 'Could not load billing details.')
      } finally {
        setBillingLoading(false)
      }
    })()
  }, [billing, profile?.stripe_customer_id, profile?.stripe_subscription_id, section])

  useEffect(() => {
    if (!user?.id) return

    const params = getHashParams()
    const sessionId = params.get('session_id')
    const checkoutState = params.get('checkout')
    const returnPlan = normalizeTier(params.get('plan'))

    if (section !== 'billing' || checkoutState !== 'success' || !sessionId) return
    if (profile?.stripe_subscription_id && normalizeTier(profile?.tier) === returnPlan) return

    let cancelled = false

    ;(async () => {
      setCheckoutSyncing(true)
      setBillingError('')
      try {
        const sb = await initSupabase()
        const { data: { session } } = await sb.auth.getSession()
        const token = session?.access_token || ''

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetch('/api/checkout-session-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ userId: user.id, sessionId }),
          })

          const data = await response.json().catch(() => ({}))
          if (!response.ok) {
            throw new Error(data?.error || 'Could not verify your checkout session.')
          }

          if (data?.ready) {
            if (cancelled) return
            setProfile((prev) => ({
              ...prev,
              tier: data.tier || returnPlan,
              stripe_customer_id: data.stripeCustomerId || prev?.stripe_customer_id || null,
              stripe_subscription_id: data.stripeSubscriptionId || prev?.stripe_subscription_id || null,
            }))
            setRequiresPayment(false)
            setBilling(null)
            history.replaceState({ section: 'home' }, '', '#home')
            setSection('home')
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 1200))
        }

        if (!cancelled) {
          setBillingError('Your payment went through, but account activation is still syncing. Refresh in a few seconds if this does not resolve.')
        }
      } catch (err) {
        if (!cancelled) {
          setBillingError(err.message || 'Could not verify your checkout session.')
        }
      } finally {
        if (!cancelled) setCheckoutSyncing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [profile?.stripe_subscription_id, profile?.tier, section, user?.id])

  useEffect(() => {
    if (!user?.id) {
      setBusinessStateLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setBusinessStateLoading(true)
      try {
        const sb = await initSupabase()
        const [{ data, error }, { data: memoryRows, error: memoryError }] = await Promise.all([
          sb
            .from('business_state')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          sb
            .from('user_memory')
            .select('business_state, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20),
        ])

        if (cancelled) return
        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('[dashboard] business_state fetch error:', error.message)
          }
        }
        if (memoryError) {
          console.warn('[dashboard] user_memory fallback fetch error:', memoryError.message)
        }

        const fallbackMemory = Array.isArray(memoryRows)
          ? memoryRows.find((row) => hasMeaningfulBusinessState(row?.business_state))
          : null
        const fallbackState = fallbackMemory?.business_state
          ? { ...fallbackMemory.business_state, updated_at: fallbackMemory.created_at, _autofilled_from_memory: true }
          : null
        const mergedState = data
          ? mergeBusinessState(data, fallbackState)
          : fallbackState

        setBusinessState(mergedState || null)

        // Non-blocking: enrich health panel with cross-session intelligence
        sb.auth.getSession().then(({ data: { session: _s } }) => {
          const _tok = _s?.access_token || ''
          fetch(`/api/business-health?userId=${user.id}`, {
            headers: _tok ? { Authorization: `Bearer ${_tok}` } : {},
          })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (!cancelled && d) setHealthIntel(d) })
            .catch(() => {})

          fetch(`/api/area-trends?userId=${user.id}`, {
            headers: _tok ? { Authorization: `Bearer ${_tok}` } : {},
          })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (!cancelled && d?.trends) setAreaTrends(d.trends) })
            .catch(() => {})

          fetch(`/api/goals?userId=${encodeURIComponent(user.id)}`, {
            headers: _tok ? { Authorization: `Bearer ${_tok}` } : {},
          })
            .then(r => r.ok ? r.json() : null)
            .then((d) => {
              if (!cancelled && d?.active) {
                setBusinessState((prev) => ({
                  ...(prev || {}),
                  active_goal_id: d.active.id,
                  active_goal: d.active.title || prev?.active_goal || '',
                  goal_score: typeof d.active.progress === 'number' ? d.active.progress : prev?.goal_score ?? null,
                  goal_health_score: typeof d.active.health_score === 'number' ? d.active.health_score : null,
                  goal_deadline: d.active.deadline || null,
                  goal_metric_key: d.active.metric_key || null,
                  goal_area_id: d.active.area_id || null,
                }))
              }
            })
            .catch(() => {})
        }).catch(() => {})
      } catch (error) {
        if (!cancelled) {
          console.error('[dashboard] business_state fetch threw:', error?.message ?? error)
          setBusinessState(null)
        }
      } finally {
        if (!cancelled) setBusinessStateLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || tier !== 'intelligence') {
      setAlerts([])
      setAlertsLoading(false)
      setAlertsError('')
      return
    }

    let cancelled = false

    ;(async () => {
      setAlertsLoading(true)
      setAlertsError('')
      try {
        const sb = await initSupabase()
        const { data: { session } } = await sb.auth.getSession()
        const response = await fetch('/api/risk-alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ userId: user.id }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || 'Could not load alerts right now.')
        if (!cancelled) setAlerts(Array.isArray(payload?.alerts) ? payload.alerts : [])
      } catch (error) {
        if (!cancelled) {
          setAlerts([])
          setAlertsError(error?.message || 'Could not load alerts right now.')
        }
      } finally {
        if (!cancelled) setAlertsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [tier, user?.id])

  const navigateSection = (nextSection) => {
    const [sectionName, query = ''] = nextSection.split('?')
    const view = new URLSearchParams(query).get('view') || 'all'
    if (activationLocked && sectionName !== 'billing' && sectionName !== 'account') {
      history.pushState({ section: 'billing' }, '', '#billing')
      setSection('billing')
      return
    }
    history.pushState({ section: sectionName }, '', `#${nextSection}`)
    setSection(sectionName)
    setDeptView(view)
  }

  const baseAuditInfo = () => ({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    phone: '',
    context: profile?.context || '',
    userId: user?.id || null,
    tier: profile?.tier || null,
    industry: profile?.industry || null,
    domain: profile?.domain || null,
  })

  const ensureScopeThen = (next) => {
    if (profile?.industry) {
      next({ industry: profile.industry, domain: profile?.domain || null })
      return
    }
    pendingAuditRef.current = next
    setScopeSetupOpen(true)
  }

  const startAudit = () => {
    if (activationLocked) {
      navigateSection('billing')
      return
    }
    ensureScopeThen((scope) => {
      const params = { ...baseAuditInfo(), ...scope }
      const priorActions = latestParsedContent?.priority_actions?.slice(0, 3) ?? []
      if (priorActions.length > 0) {
        pendingAuditParamsRef.current = params
        setDecisionLogFeedback(priorActions.map((text) => ({ text, status: '', outcome: '' })))
        setDecisionLogOpen(true)
      } else {
        onStartAudit(params)
      }
    })
  }

  const proceedFromDecisionLog = async (feedback) => {
    setDecisionLogOpen(false)
    if (user?.id && latestDiagnosticReport?.id) {
      const filledFeedback = feedback.filter((f) => f.status)
      if (filledFeedback.length > 0) {
        try {
          const sb = await initSupabase()
          const { data: { session: s } } = await sb.auth.getSession()
          const token = s?.access_token || ''
          fetch('/api/save-dashboard-checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              userId: user.id,
              reportId: latestDiagnosticReport.id,
              sinceLast: 'Action follow-up before new session',
              actionFeedback: filledFeedback,
            }),
          }).catch(() => {})
        } catch { /* non-blocking */ }
      }
    }
    if (pendingAuditParamsRef.current) {
      onStartAudit(pendingAuditParamsRef.current)
      pendingAuditParamsRef.current = null
    }
  }

  // ── Save dual-agent session as a report ──────────────────────────────────
  // Called after a full diagnosis completes. Runs generateReport() in the
  // background (second Claude call) then saves to reports table.
  const saveSessionAsReport = async (history, mode) => {
    if (!user?.id) return
    try {
      const sb = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''

      // Convert dual-agent history to AuditChat message format
      const messages = (history || []).reduce((acc, msg) => {
        if (msg.role === 'user')    acc.push({ role: 'user',      content: msg.content })
        if (msg.role === 'agent_x') acc.push({ role: 'assistant', content: msg.content })
        return acc
      }, [])

      if (messages.length < 2) return

      // Generate structured report from conversation
      const report = await generateReport(messages, {
        industry:     profile?.industry || '',
        domain:       profile?.domain || '',
        userId:       user.id,
        goalMode:     mode === 'goal',
        goal:         '',
        goalTimeline: '',
        goalBaseline: '',
        token,
      })

      if (!report) return

      // Save to reports table
      const saveRes = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId:       user.id,
          sessionId:    null,
          report,
          industry:     profile?.industry || '',
          domain:       profile?.domain || '',
          goalMode:     mode === 'goal',
          goalTimeline: '',
          goalBaseline: '',
          userEmail:    user.email || '',
          userName:     profile?.name || user?.user_metadata?.name || '',
        }),
      })

      if (saveRes.ok) {
        const saved = await saveRes.json()
        // Prepend to reports state so Sessions tab shows it immediately
        setReports(prev => [{
          id:                saved.reportId || crypto.randomUUID(),
          title:             report.headline,
          headline:          report.headline,
          content:           JSON.stringify(report),
          report_data:       report,
          industry:          profile?.industry || '',
          domain:            profile?.domain || '',
          conversation_mode: report.conversation_mode,
          status:            'unknown',
          created_at:        new Date().toISOString(),
        }, ...prev].slice(0, 24))
        // Signal that the new report is in state — button can now say "Results ready"
        setSessionSaved(true)
        setSessionResultCount(prev => prev + 1)
      }
    } catch (err) {
      console.warn('[saveSessionAsReport] failed:', err.message)
    }
  }

  // ── Dual-agent engine ────────────────────────────────────────────────────

  const resetSession = () => {
    setSessionActive(false)
    setAgentState('idle')
    setAgentXStream('')
    setAgentYStream('')
    setAgentXDone(false)
    setAgentYDone(false)
    setAgentError(null)
    setCmdInput('')
    setCurrentMode(null)
    setSessionLog([])
    setDualHistory([])      // reset so pills reappear on next session
    setSelectedMode(null)   // reset selected mode
    setSessionResultCount(0)
    setSessionSaved(false)
    setShowResultsPanel(false)
    agentXFinalRef.current = ''
  }

  const activateSession = () => {
    resetSession()
    setSessionActive(true)
    // Do NOT clear cmdInput — user may have typed something already
    setTimeout(() => {
      document.querySelector('.dash-cmd-input')?.focus()
    }, 50)
  }

  const submitDualAgent = async () => {
    let rawInput = cmdInput.trim()
    if (!rawInput || agentState === 'planning' || agentState === 'agent_x' || agentState === 'agent_y') return

    // Parse slash-command prefix and strip it from query
    let parsedMode = selectedMode
    const slashMatch = rawInput.match(/^\/(\w+)\s+(.+)/s)
    if (slashMatch) {
      const cmd = slashMatch[1].toLowerCase()
      if (['diagnose', 'goal', 'scan'].includes(cmd)) {
        parsedMode = cmd
        rawInput = slashMatch[2].trim()
      }
    }
    const q = rawInput
    if (!q) return

    // Auto-activate session if not active yet
    if (!sessionActive) setSessionActive(true)

    // Save ALL completed turns to session log so history persists between messages
    if (agentXStream || agentYStream) {
      setSessionLog((prev) => [...prev, {
        query:   q,
        xOutput: agentXStream,
        yOutput: agentYStream,
        mode:    currentMode?.mode || 'diagnose',
        label:   currentMode?.label || 'DIAGNOSING',
        xLabel:  currentMode?.xLabel || 'AGENT X',
        yLabel:  currentMode?.yLabel || 'AGENT Y',
      }])
    }

    setCmdInput('')
    setAgentState('planning')
    setAgentXStream('')
    setAgentYStream('')
    setAgentXDone(false)
    setAgentYDone(false)
    setAgentError(null)
    setCurrentMode(null)
    agentXFinalRef.current = ''

    try {
      const sb = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''

      const res = await fetch('/api/dual-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query:               q,
          userId:              user?.id ?? null,
          conversationHistory: dualHistory.slice(-8),
          industry:            profile?.industry ?? null,
          domain:              profile?.domain   ?? null,
          // Use explicit selection, or carry the last active mode, or default to diagnose
          modeOverride:        parsedMode ?? currentMode?.mode ?? 'diagnose',
        }),
      })

      if (!res.ok || !res.body) {
        setAgentState('error')
        setAgentError('Could not connect to the engine. Try again.')
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            let data
            try { data = JSON.parse(line.slice(6)) } catch { continue }

            switch (currentEvent) {
              case 'mode':
                setCurrentMode(data)
                break
              case 'status':
                break
              case 'agent_x_start':
                setAgentState('agent_x')
                break
              case 'agent_x_token':
                agentXFinalRef.current += (data.token || '')
                setAgentXStream((prev) => {
                  const next = prev + (data.token || '')
                  requestAnimationFrame(() => {
                    if (agentXScrollRef.current) {
                      agentXScrollRef.current.scrollTop = agentXScrollRef.current.scrollHeight
                    }
                  })
                  return next
                })
                break
              case 'agent_x_complete':
                setAgentXDone(true)
                break
              case 'agent_y_start':
                setAgentState('agent_y')
                break
              case 'agent_y_token':
                setAgentYStream((prev) => {
                  const next = prev + (data.token || '')
                  requestAnimationFrame(() => {
                    if (agentYScrollRef.current) {
                      agentYScrollRef.current.scrollTop = agentYScrollRef.current.scrollHeight
                    }
                  })
                  return next
                })
                break
              case 'agent_y_complete': {
                const isGathering = data.output === '__gathering__'
                setAgentYDone(true)
                setAgentState('complete')
                if (!isGathering) setSelectedMode(null)
                const newHistory = [
                  ...dualHistory,
                  { role: 'user',    content: q },
                  { role: 'agent_x', content: agentXFinalRef.current || '' },
                  ...(!isGathering ? [{ role: 'agent_y', content: data.output || '' }] : []),
                ]
                setDualHistory(newHistory)
                // Save as a proper report in the background (non-blocking)
                if (!isGathering && agentXFinalRef.current) {
                  saveSessionAsReport(newHistory, parsedMode || 'diagnose').catch(() => {})
                }
                break
              }
                break
              case 'session_result':
                if (data.componentCount > 0) {
                  setSessionResultCount(data.componentCount)
                }
                break
              case 'error':
                setAgentState('error')
                setAgentError(data.message || 'Engine error')
                break
              case 'done':
                if (agentState !== 'complete' && agentState !== 'error') {
                  setAgentState('complete')
                }
                break
            }
          }
        }
      }
    } catch (err) {
      setAgentState('error')
      setAgentError(err.message || 'Connection failed')
    }
  }

  const openPortal = async () => {
    if (!profile?.stripe_customer_id) return
    setPortalLoading(true)
    try {
      const sb = await initSupabase()
      const { data, error } = await sb.functions.invoke('create-portal-session', {
        body: { customerId: profile.stripe_customer_id, returnUrl: window.location.href },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err) {
      setBillingError(err.message || 'Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const sectionMeta = {
    home: '/ command centre',
    oversight: '/ operational oversight',
    reports: '/ reports',
    intelligence: '/ Intelligence Brief',
    'business-state': '/ What We Know',
    alerts: '/ alerts',
    connectors: '/ connectors',
    agent: '/ Ask SelfAudit',
    billing: '/ billing',
    account: '/ account',
  }

  const toggleTheme = () => {
    setTheme((prev) => {
      const idx = THEME_ORDER.indexOf(prev)
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length]
    })
  }

  const refreshAlerts = async () => {
    if (!user?.id || tier !== 'intelligence') return
    setAlertsLoading(true)
    setAlertsError('')
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/risk-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Could not load alerts right now.')
      setAlerts(Array.isArray(payload?.alerts) ? payload.alerts : [])
    } catch (error) {
      setAlertsError(error?.message || 'Could not load alerts right now.')
    } finally {
      setAlertsLoading(false)
    }
  }

  const updateAlertStatus = async (alertId, nextStatus) => {
    if (!user?.id || !alertId || !nextStatus) return
    setUpdatingAlertIds((prev) => ({ ...prev, [alertId]: true }))
    setAlertsError('')
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/update-risk-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id, alertId, status: nextStatus }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Could not update alert right now.')
      const updated = payload?.alert
      setAlerts((prev) => {
        if (nextStatus === 'resolved') return prev.filter((alert) => alert.id !== alertId)
        return prev.map((alert) => (alert.id === alertId ? { ...alert, ...updated } : alert))
      })
    } catch (error) {
      setAlertsError(error?.message || 'Could not update alert right now.')
    } finally {
      setUpdatingAlertIds((prev) => {
        const next = { ...prev }
        delete next[alertId]
        return next
      })
    }
  }

  const completeWelcomeTour = async () => {
    if (!user?.id || completingOnboarding) return
    setCompletingOnboarding(true)
    try {
      const sb = await initSupabase()
      const { error } = await sb
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id)

      if (error) throw error
      setProfile((prev) => ({ ...(prev || {}), onboarding_complete: true }))
      history.replaceState({ section: 'home' }, '', '#home')
      setSection('home')
    } catch (error) {
      console.error('[dashboard] onboarding completion failed:', error?.message ?? error)
    } finally {
      setCompletingOnboarding(false)
    }
  }

  if (shouldShowWelcomeTour) {
    return (
      <DashboardWelcomeTour
        onComplete={completeWelcomeTour}
        completing={completingOnboarding}
        theme={theme}
      />
    )
  }

  return (
    <div
      className={`sa-dash${sidebarExpanded ? ' rail-open' : ''}`}
      style={themeVars}
      data-theme={theme}
    >
      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {decisionLogOpen && (
        <DecisionLogModal
          feedback={decisionLogFeedback}
          setFeedback={setDecisionLogFeedback}
          onProceed={proceedFromDecisionLog}
          onSkip={() => {
            setDecisionLogOpen(false)
            if (pendingAuditParamsRef.current) {
              onStartAudit(pendingAuditParamsRef.current)
              pendingAuditParamsRef.current = null
            }
          }}
        />
      )}
      {goalModal && (
        <GoalCaptureModal onClose={() => setGoalModal(false)} onStart={(goalData) => {
          setGoalModal(false)
          startGoalAudit(goalData)
        }} />
      )}
      {scopeSetupOpen && (
        <AuditScopeSetupModal
          user={user}
          onClose={() => { setScopeSetupOpen(false); pendingAuditRef.current = null }}
          onSaved={(scope) => {
            setProfile((prev) => ({ ...(prev || {}), ...scope }))
            setScopeSetupOpen(false)
            pendingAuditRef.current?.(scope)
            pendingAuditRef.current = null
          }}
        />
      )}

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="dash-topbar">
        <div className="dash-logo" onClick={() => navigateSection('home')}>
          <span className="logo-mark">
            <svg viewBox="0 0 32 32" fill="none" width="26" height="26">
              <g stroke="currentColor" strokeLinejoin="round" strokeLinecap="round" fill="none">
                <path d="M16,2 L28.1,9 L28.1,23 L16,30 L3.9,23 L3.9,9 Z" strokeWidth="1.8"/>
                <path d="M16,9.5 L21.6,12.75 L21.6,19.25 L16,22.5 L10.4,19.25 L10.4,12.75 Z" strokeWidth="1.4"/>
                <path d="M16,2 L16,9.5 M28.1,9 L21.6,12.75 M28.1,23 L21.6,19.25 M16,30 L16,22.5 M3.9,23 L10.4,19.25 M3.9,9 L10.4,12.75" strokeWidth="1.2"/>
              </g>
            </svg>
          </span>
          <span className="logo-text">SelfAudit</span>
        </div>

        {(() => {
          const hasNewResults = agentYDone && sessionActive
          return (
            <button
              className="dash-status"
              type="button"
              onClick={() => setShowResultsPanel(p => !p)}
            >
              <span className="dot" style={hasNewResults ? { background: 'var(--green)', boxShadow: '0 0 10px -1px var(--green)' } : {}} />
              {hasNewResults ? 'Results ready' : 'Execution Panel'}
              <span className="chev">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={showResultsPanel ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/>
                </svg>
              </span>
            </button>
          )
        })()}

        <div className="dash-top-right">
          <button className="dash-pill" type="button" onClick={() => navigateSection(section === 'oversight' ? 'home' : 'oversight')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Oversight
          </button>
          <button className="dash-pill" type="button" onClick={() => navigateSection(section === 'intelligence' ? 'home' : 'intelligence')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.7 5.1a2 2 0 0 0 1.2 1.2L20 11l-5.1 1.7a2 2 0 0 0-1.2 1.2L12 19l-1.7-5.1a2 2 0 0 0-1.2-1.2L4 11l5.1-1.7a2 2 0 0 0 1.2-1.2z"/>
            </svg>
            AI Opportunities
          </button>
          <button className="dash-iconbtn" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>
            <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Execution Panel (fixed overlay — doesn't push content, doesn't cover sidebar) ── */}
      {showResultsPanel && (
        <div style={{
          position: 'fixed',
          top: 68,
          left: sidebarExpanded ? 214 : 66,
          right: 0,
          height: 'calc(100vh - 68px)',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--d-border)',
          overflow: 'auto',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          zIndex: 200,
        }}>
          {/* Immediate session output — shown while generateReport runs in background */}
          {agentYDone && !sessionSaved && agentYStream ? (
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <svg style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: 'var(--fg-mute)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>
                  Structuring execution plan — updates automatically
                </span>
              </div>
              <div style={{ background: 'var(--d-surface)', border: '1px solid var(--d-border)', borderRadius: 12, padding: '22px 24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 14 }}>
                  Agent Y · Session output
                </div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', lineHeight: 1.85, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {agentYStream}
                </div>
              </div>
            </div>
          ) : reports.length > 0 ? (
            <div style={{ padding: '28px 28px 28px' }}>
              <ExecutionPanel
                key={reports[0]?.id ?? 'empty'}
                reports={reports}
                userInfo={shareUserInfo}
                variant="dashboard"
                healthIntel={healthIntel}
                theme={theme}
                onActionStaged={fetchActionFeed}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--fg-mute)', fontSize: '0.85rem', textAlign: 'center', padding: '48px 0' }}>
              Complete a /diagnose session to generate your execution panel.
            </div>
          )}
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="dash-body">

        {/* Icon rail sidebar */}
        <aside className="dash-side">
          <button
            className="dash-rail-toggle"
            type="button"
            onClick={() => setSidebarExpanded(p => !p)}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            title="Expand / collapse"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <nav className="dash-nav">
            <button className={`dash-navbtn${section === 'cockpit' ? ' active' : ''}`} data-label="Cockpit" aria-label="Cockpit" type="button" onClick={() => navigateSection('cockpit')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>
              </svg>
              <span className="navlabel">Cockpit</span>
            </button>
            <button className={`dash-navbtn${section === 'home' ? ' active' : ''}`} data-label="Command" aria-label="Command" type="button" onClick={() => navigateSection('home')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/>
              </svg>
              <span className="navlabel">Command</span>
            </button>
            <button className={`dash-navbtn${section === 'reports' ? ' active' : ''}`} data-label="Sessions" aria-label="Sessions" type="button" onClick={() => navigateSection('reports')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V10M10 19V5M16 19v-7M22 19H2"/>
              </svg>
              <span className="navlabel">Sessions</span>
            </button>
            <button className={`dash-navbtn${section === 'business-state' ? ' active' : ''}`} data-label="Context" aria-label="Context" type="button" onClick={() => navigateSection('business-state')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
                <path d="M14 3v5h5M9 13h6M9 17h6"/>
              </svg>
              <span className="navlabel">Context</span>
            </button>
            <button className={`dash-navbtn${section === 'connectors' ? ' active' : ''}`} data-label="Connectors" aria-label="Connectors" type="button" onClick={() => navigateSection('connectors')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="12" cy="18" r="2.4"/>
                <path d="M6 8.4v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3M12 13.4v2.2"/>
              </svg>
              <span className="navlabel">Connectors</span>
            </button>
            <button className={`dash-navbtn${section === 'simulate' ? ' active' : ''}`} data-label="Simulate" aria-label="Simulate" type="button" onClick={() => navigateSection('simulate')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>
              </svg>
              <span className="navlabel">Simulate</span>
            </button>
          </nav>

          <div className="dash-side-foot">
            <button className={`dash-navbtn${section === 'account' ? ' active' : ''}`} data-label="Account" aria-label="Account" type="button" onClick={() => navigateSection('account')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>
              </svg>
              <span className="navlabel">Account</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="dash-content">

          {/* Command / Home — two agent cards + command bar */}
          {section === 'home' && (
            <>
              {hasSchema === false && <SchemaSetup user={user} onComplete={() => setHasSchema(true)} />}
              <div className="dash-cards">
                {auditJustCompleted ? (
                  <>
                    <section className="dash-card" aria-label="Agent X — Diagnostic engine" />
                    <section className="dash-card" aria-label="Agent Y — Solution engine">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: 'var(--muted)' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>Audit complete.</div>
                        <div style={{ fontSize: '0.78rem' }}>Check Results in the nav bar.</div>
                        <button
                          type="button"
                          onClick={onAuditCompletedAck}
                          style={{ marginTop: '12px', padding: '4px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </section>
                  </>
                ) : (() => {
                  // Terminal line renderer — applies color by content type
                  const renderTerminalLines = (text, accentColor = '#4ade80') => {
                    if (!text) return null
                    return text.split('\n').map((line, i) => {
                      let color = 'var(--text)'
                      let fontWeight = 'normal'
                      let opacity = 1
                      let fontSize = '0.73rem'
                      let marginTop = 0

                      if (/^CRITICAL/.test(line))  { color = 'var(--red-text)'; fontWeight = '700' }
                      else if (/^HIGH/.test(line)) { color = 'var(--amber-text)'; fontWeight = '700' }
                      else if (/^MEDIUM/.test(line)){ color = 'var(--amber-text)'; fontWeight = '600' }
                      else if (/^LOW/.test(line))  { color = 'var(--text-muted)' }
                      else if (/^(DIAGNOSIS|ROOT CAUSE|WHAT TO STOP|DATA GAPS)/.test(line)) {
                        color = 'var(--text)'; fontWeight = '700'; fontSize = '0.7rem'
                        marginTop = 12
                      }
                      else if (/^(SOLUTIONS|STOP DOING|EXECUTION ORDER|CONTINGENT ON)/.test(line)) {
                        color = 'var(--text)'; fontWeight = '700'; fontSize = '0.7rem'
                        marginTop = 12
                      }
                      else if (/^(IMMEDIATE|BUILD NEXT)/.test(line)) {
                        color = 'var(--accent-text)'; fontWeight = '700'
                      }
                      else if (/^━+$/.test(line))  {
                        return <div key={i} style={{ height: 1, background: 'var(--border)', margin: '4px 0 8px' }} />
                      }
                      else if (/^(Evidence:|Addresses:|Effort:|Owner:|Confidence:)/.test(line)) {
                        color = 'var(--text-muted)'; fontSize = '0.68rem'
                      }

                      return (
                        <div key={i} style={{ color, fontWeight, opacity, fontSize, marginTop, minHeight: line ? undefined : '0.6em', letterSpacing: '0.01em' }}>
                          {line || ''}
                        </div>
                      )
                    })
                  }

                  // Show terminal mode when session is active or engines are running
                  if (sessionActive || agentState !== 'idle') {
                    const xActive   = agentState === 'agent_x' || agentState === 'planning'
                    const yActive   = agentState === 'agent_y'
                    const xComplete = agentXDone
                    const yComplete = agentYDone

                    return (
                      <>
                        {/* Agent X — Diagnostic terminal */}
                        <section className="dash-card" aria-label="Agent X — Diagnostic engine">
                          <header className="card-head" style={{ borderBottom: '1px solid var(--d-border)' }}>
                            <div className="card-head-text">
                              <div className="card-eyebrow" style={{ color: '#4ade80' }}>Agent X</div>
                              <h2 className="card-title">Diagnostic engine</h2>
                            </div>
                            <div className="card-status" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, gap: 6 }}>
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                                background: xActive ? '#4ade80' : xComplete ? '#4ade80' : 'var(--d-border2)',
                                boxShadow: (xActive || xComplete) ? '0 0 8px #4ade80' : 'none',
                              }} />
                              <span style={{ color: xActive ? '#4ade80' : xComplete ? '#4ade80' : 'var(--text-muted)' }}>
                                {xActive
                                  ? (currentMode?.xLabel || 'SCANNING')
                                  : xComplete
                                    ? (currentMode?.xLabel || 'DONE')
                                    : selectedMode === 'diagnose' ? 'DIAGNOSING'
                                    : selectedMode === 'goal'     ? 'GOAL MODE'
                                    : selectedMode === 'scan'     ? 'SCANNING'
                                    : 'STANDBY'}
                              </span>
                            </div>
                          </header>
                          {/* Agent X terminal — always dark container */}
                          <div style={{ flex: 1, padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div
                              ref={agentXScrollRef}
                              style={{ flex: 1, overflow: 'auto', minHeight: 0, border: '1px solid var(--d-border)', borderRadius: 8, padding: '14px 16px', fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.72rem', lineHeight: 1.85, wordBreak: 'break-word' }}
                            >
                              {/* Past turns — compact history */}
                              {sessionLog.map((turn, i) => (
                                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(74,222,128,0.08)', opacity: 0.5 }}>
                                  <div style={{ color: 'rgba(74,222,128,0.5)', fontSize: '0.6rem', marginBottom: 4, letterSpacing: '0.08em' }}>[{turn.label}] {String(turn.query || '').slice(0, 60)}</div>
                                  {renderTerminalLines(String(turn.xOutput || '').split('\n').slice(0, 4).join('\n'), '#4ade80')}
                                  {(turn.xOutput || '').split('\n').length > 4 && <div style={{ color: 'rgba(74,222,128,0.3)' }}>…</div>}
                                </div>
                              ))}
                              {/* Current state */}
                              {agentState === 'idle' && !agentXStream && (
                                <div style={{ color: 'var(--text-faint)' }}>{'> AGENT_X // STANDBY'}</div>
                              )}
                              {agentState === 'planning' && !agentXStream && (
                                <div style={{ color: 'rgba(74,222,128,0.5)' }}>{'> routing'}<span style={{ animation: 'termBlink 1s step-end infinite', color: '#4ade80' }}>█</span></div>
                              )}
                              {agentXStream.length > 0 && agentState === 'agent_x' && agentXStream.length < 10 && (
                                <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{'> AGENT_X // DIAGNOSTIC_ENGINE'}</div>
                              )}
                              {renderTerminalLines(agentXStream, '#4ade80')}
                              {xActive && agentXStream && <span style={{ color: '#4ade80', opacity: 0.8 }}>█</span>}
                              {agentState === 'error' && agentError && <div style={{ color: '#ff6b6b' }}>{'> ERROR: '}{agentError}</div>}
                            </div>
                          </div>
                        </section>

                        {/* Agent Y — Solution terminal */}
                        <section className="dash-card" aria-label="Agent Y — Solution engine">
                          <header className="card-head" style={{ borderBottom: '1px solid var(--d-border)' }}>
                            <div className="card-head-text">
                              <div className="card-eyebrow" style={{ color: '#fb923c' }}>Agent Y</div>
                              <h2 className="card-title">Solution engine</h2>
                            </div>
                            <div className="card-status" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, gap: 6 }}>
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                                background: yActive ? '#fb923c' : yComplete ? '#fb923c' : 'var(--d-border2)',
                                boxShadow: (yActive || yComplete) ? '0 0 8px #fb923c' : 'none',
                              }} />
                              <span style={{ color: yActive ? '#fb923c' : yComplete ? '#fb923c' : 'var(--text-muted)' }}>
                                {yActive
                                  ? (currentMode?.yLabel || 'PROPOSING')
                                  : yComplete
                                    ? (currentMode?.yLabel || 'DONE')
                                    : selectedMode === 'diagnose' ? 'SOLUTIONS'
                                    : selectedMode === 'goal'     ? 'FASTEST PATH'
                                    : selectedMode === 'scan'     ? 'QUICK ACTIONS'
                                    : xComplete ? 'STARTING' : 'WAITING'}
                              </span>
                            </div>
                          </header>
                          {/* Agent Y terminal — always dark container */}
                          <div style={{ flex: 1, padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div
                              ref={agentYScrollRef}
                              style={{ flex: 1, overflow: 'auto', minHeight: 0, border: '1px solid var(--d-border)', borderRadius: 8, padding: '14px 16px', fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.72rem', lineHeight: 1.85, wordBreak: 'break-word' }}
                            >
                              {/* Past turns — compact history */}
                              {sessionLog.map((turn, i) => (
                                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(251,146,60,0.08)', opacity: 0.5 }}>
                                  <div style={{ color: 'rgba(251,146,60,0.5)', fontSize: '0.6rem', marginBottom: 4, letterSpacing: '0.08em' }}>[{turn.yLabel}] {String(turn.query || '').slice(0, 60)}</div>
                                  {turn.yOutput && turn.yOutput !== '__gathering__'
                                    ? renderTerminalLines(String(turn.yOutput).split('\n').slice(0, 4).join('\n'), '#fb923c')
                                    : <div style={{ color: 'rgba(251,146,60,0.3)' }}>{'> gathering context...'}</div>}
                                  {(turn.yOutput || '').split('\n').length > 4 && <div style={{ color: 'rgba(251,146,60,0.3)' }}>…</div>}
                                </div>
                              ))}
                              {/* Current state */}
                              {agentState === 'idle' && !agentYStream && (
                                <div style={{ color: 'var(--text-faint)' }}>{'> AGENT_Y // STANDBY'}</div>
                              )}
                              {(agentState === 'planning' || agentState === 'agent_x') && !agentYStream && (
                                <div style={{ color: 'rgba(251,146,60,0.3)' }}>{'> waiting for Agent X...'}</div>
                              )}
                              {agentState === 'complete' && !agentYStream && agentYDone && (
                                <div style={{ color: 'rgba(251,146,60,0.4)' }}>
                                  <div>{'> AGENT_Y // STANDING BY'}</div>
                                  <div style={{ marginTop: 6, opacity: 0.7 }}>{'> Reply to Agent X to continue'}</div>
                                </div>
                              )}
                              {agentYStream.length > 0 && agentState === 'agent_y' && agentYStream.length < 10 && (
                                <div style={{ color: 'rgba(251,146,60,0.5)', marginBottom: 8 }}>{'> AGENT_Y // SOLUTION_ENGINE'}</div>
                              )}
                              {renderTerminalLines(agentYStream, '#fb923c')}
                              {yActive && agentYStream && <span style={{ color: '#fb923c', opacity: 0.8 }}>█</span>}
                            </div>
                          </div>
                        </section>
                      </>
                    )
                  }

                  // Idle state — no active session
                  const hasMemory     = (reports?.length ?? 0) > 0 || !!latestParsedContent?.headline
                  const hasConnectors = (healthIntel?.governance_areas_with_signals ?? 0) > 0
                  const idleState     = hasConnectors ? 'connectors' : hasMemory ? 'memory' : 'empty'
                  const lastHeadline  = latestParsedContent?.headline || null
                  const topAction     = latestParsedContent?.priority_actions?.[0] || null
                  const govSummary    = healthIntel?.governance_summary || null
                  const topAction2    = healthIntel?.health_check_actions?.[0] || null
                  const checkedAt     = healthIntel?.governance_checked_at
                    ? new Date(healthIntel.governance_checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : null

                  return (
                    <>
                      <section className="dash-card" aria-label="Agent X — Diagnostic engine">
                        <header className="card-head">
                          <div className="card-head-text">
                            <div className="card-eyebrow">Agent X</div>
                            <h2 className="card-title">Diagnostic engine</h2>
                          </div>
                          <div className="card-status">
                            <span className="cs-dot" style={{ background: idleState === 'empty' ? 'var(--muted)' : idleState === 'connectors' ? '#4CAF50' : '#FFC107' }} />
                            {idleState === 'empty' ? 'Waiting' : idleState === 'connectors' ? 'Monitoring' : 'Ready'}
                          </div>
                        </header>
                        <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {/* Capability lines — always shown at top */}
                          <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--d-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: 'var(--ember)', letterSpacing: '0.04em', marginRight: 8 }}>/diagnose</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--fg-dim)' }}>finds root causes, not symptoms</span>
                              </div>
                              <div>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: 'rgba(74,222,128,0.6)', letterSpacing: '0.04em', marginRight: 8 }}>/scan</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--fg-dim)' }}>investigates a specific question with evidence</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="dash-card" aria-label="Agent Y — Solution engine">
                        <header className="card-head">
                          <div className="card-head-text">
                            <div className="card-eyebrow">Agent Y</div>
                            <h2 className="card-title">Solution engine</h2>
                          </div>
                          <div className="card-status">
                            <span className="cs-dot" style={{ background: idleState === 'empty' ? 'var(--muted)' : '#4CAF50' }} />
                            {idleState === 'empty' ? 'Standby' : 'Proposing'}
                          </div>
                        </header>
                        <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {/* Capability lines — always shown at top */}
                          <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--d-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: 'var(--ember)', letterSpacing: '0.04em', marginRight: 8 }}>/goal</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--fg-dim)' }}>maps the gap and sequences the fastest path</span>
                              </div>
                              <div>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: 'rgba(251,146,60,0.6)', letterSpacing: '0.04em', marginRight: 8 }}>/scan</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--fg-dim)' }}>gives 3 quick actions from the investigation</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </>
                  )
                })()}
              </div>

              {/* ── Command bar — collapsed pill or expanded input ──────── */}
              {(() => {
                const isEnginesRunning = agentState === 'planning' || agentState === 'agent_x' || agentState === 'agent_y'
                const isExpanded       = selectedMode !== null || sessionActive || agentState !== 'idle'

                const PILLS = [
                  { key: 'diagnose', label: 'diagnose', desc: 'find root causes' },
                  { key: 'goal',     label: 'goal',     desc: 'map a goal' },
                  { key: 'scan',     label: 'scan',     desc: 'investigate fast' },
                ]

                if (!isExpanded) {
                  // ── Collapsed: centered skill picker ──────────────────────
                  return (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        padding: '10px 14px',
                        background: 'var(--d-surface)',
                        border: '1px solid var(--d-border)',
                        borderRadius: 40,
                        boxShadow: 'var(--d-shadow)',
                      }}>
                        {PILLS.map(({ key, label, desc }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedMode(key)
                              setSessionActive(true)
                              setTimeout(() => document.querySelector('.dash-cmd-input')?.focus(), 80)
                            }}
                            title={desc}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 30,
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--fg)',
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.72rem',
                              letterSpacing: '0.05em',
                              cursor: 'pointer',
                              transition: 'color .15s, background .15s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--ember)'; e.currentTarget.style.background = 'oklch(0.62 0.18 35 / 0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.background = 'transparent' }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }

                // ── Expanded: full input bar ───────────────────────────────
                return (
                  <div className="dash-cmd">
                    {/* End session */}
                    <button
                      className="dash-newbtn"
                      type="button"
                      onClick={resetSession}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                      End
                    </button>
                    <span className="dash-cmd-div" />

                    {/* Status dots */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        <i style={{ width: 6, height: 6, borderRadius: '50%', display: 'block', background: isEnginesRunning ? 'var(--ember)' : 'rgba(255,255,255,0.15)' }} />
                        <i style={{ width: 6, height: 6, borderRadius: '50%', display: 'block', background: agentState === 'agent_y' || agentState === 'complete' ? '#4CAF50' : 'rgba(255,255,255,0.15)' }} />
                      </span>
                      {isEnginesRunning && (
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '0.03em' }}>
                          {agentState === 'planning' ? 'thinking…'
                            : agentState === 'agent_x' ? `${currentMode?.xLabel || 'x'}…`
                            : `${currentMode?.yLabel || 'y'}…`}
                        </span>
                      )}
                    </div>

                    {/* Input */}
                    <input
                      className="dash-cmd-input"
                      type="text"
                      value={cmdInput}
                      autoFocus
                      onChange={(e) => setCmdInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (cmdInput.trim()) submitDualAgent()
                        }
                      }}
                      placeholder={
                        isEnginesRunning
                          ? 'Engines running…'
                          : selectedMode === 'diagnose'
                            ? dualHistory.length === 0 ? 'What\'s going on in your business?' : 'Reply to continue the diagnosis…'
                            : selectedMode === 'goal'
                              ? dualHistory.length === 0 ? 'What\'s the goal and by when?' : 'Reply to continue mapping your goal…'
                              : selectedMode === 'scan'
                                ? 'What do you want to investigate?'
                                : 'Continue the session…'
                      }
                      disabled={isEnginesRunning}
                    />

                    {/* Send */}
                    <button
                      className="dash-cmd-send"
                      type="button"
                      aria-label="Send"
                      disabled={!cmdInput.trim() || isEnginesRunning}
                      onClick={() => { if (cmdInput.trim()) submitDualAgent() }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    </button>
                  </div>
                )
              })()}

              {(actionFeedLoaded && (actionFeed.pending.length > 0 || actionFeed.history.length > 0)) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 18 }}>
                  {actionFeed.pending.length > 0 && (
                    <section style={styles.actionQueueCard}>
                      <div style={styles.actionQueueEyebrow}>Action Queue</div>
                      <div style={styles.actionQueueTitle}>Waiting for approval</div>
                      <div style={styles.actionQueueSub}>Approve the work SelfAudit is ready to push into your tools.</div>
                      <div style={{ marginTop: 10 }}>
                        {actionFeed.pending.map((action) => (
                          <PendingActionCard
                            key={action.id}
                            action={action}
                            userId={user.id}
                            onResolved={fetchActionFeed}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {actionFeed.history.length > 0 && (
                    <section style={styles.executionHistoryCard}>
                      <div style={styles.actionQueueEyebrow}>Execution History</div>
                      <div style={styles.actionQueueTitle}>What already ran</div>
                      <div style={styles.actionQueueSub}>A quick view of draft creation, posts, pushes, and anything that failed.</div>
                      <div style={{ marginTop: 10 }}>
                        {actionFeed.history.slice(0, 5).map((log) => (
                          <div key={log.id} style={styles.executionHistoryRow}>
                            <div>
                              <div style={styles.executionHistoryAction}>{formatPendingActionType(log.action_type)}</div>
                              <div style={styles.executionHistoryMeta}>{String(log.connector || '').toUpperCase() || 'APP'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                ...styles.executionHistoryOutcome,
                                color: log.outcome === 'success'
                                  ? 'var(--ember)'
                                  : log.outcome === 'failed'
                                    ? 'var(--red-text)'
                                    : 'var(--text-muted)',
                              }}
                              >
                                {log.outcome}
                              </div>
                              <div style={styles.executionHistoryDate}>
                                {log.executed_at
                                  ? new Date(log.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

          {/* All other sections — scrollable content */}
          {section !== 'home' && (
            <div className="section-scroll">
              {/* ── Oversight → Business Health + Open Issues + Oversight lanes ── */}
              {section === 'oversight' && (
                <PageShell title="Oversight" sub="Business health, open issues, and your four operational lanes.">
                  <BusinessHealthPanel
                    latestDomains={latestDomains}
                    healthIntel={healthIntel}
                    goalState={goalState}
                  />
                  <div style={{ marginTop: 24 }}>
                    <OperationalOversightSection intelligenceUnlocked={intelligenceUnlocked} healthIntel={healthIntel} userId={user?.id} areaTrends={areaTrends} />
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <ThresholdEditorPanel userId={user?.id} />
                  </div>
                </PageShell>
              )}

              {/* ── Sessions → Audit report history ─────────────────────── */}
              {section === 'reports' && (
                <PageShell title="Sessions" sub="Your saved audit reports.">
                  {reportsLoading ? <ReportSkeletons /> : reports.length > 0 ? <ReportList reports={reports} userId={user?.id} /> : <EmptyReports onStartAudit={startAudit} />}
                </PageShell>
              )}

              {/* ── AI Opportunities → ranked opportunity items ──────────── */}
              {section === 'intelligence' && (
                <PageShell title="AI Opportunities" sub="Ranked opportunities surfaced from your audit findings.">
                  <AiOpportunitiesDetailPanel
                    user={user}
                    userInfo={shareUserInfo}
                    reports={reports}
                    items={opportunityItems}
                    tier={tier}
                  />
                </PageShell>
              )}

              {/* ── Context → Intelligence brief ─────────────────────────── */}
              {section === 'business-state' && (
                <PageShell title="Context" sub="Your intelligence brief and operating picture in one place.">
                  <IntelligenceBrief
                    user={user}
                    profile={profile}
                    theme={theme}
                    onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
                  />
                </PageShell>
              )}

              {section === 'alerts' && (
                <PageShell title="Alerts" sub="Review unresolved monitoring signals, acknowledge what you have seen, and resolve what is actually handled.">
                  <AlertsInboxSection intelligenceUnlocked={tier === 'intelligence'} alerts={alerts} alertsLoading={alertsLoading} alertsError={alertsError} onRefreshAlerts={refreshAlerts} onUpdateAlert={updateAlertStatus} updatingAlertIds={updatingAlertIds} />
                </PageShell>
              )}
              {section === 'connectors' && <ConnectorsSection user={user} />}
              {section === 'simulate'  && (
                <PageShell title="Simulate" sub="Run a what-if scenario against the current governance engine without changing live data.">
                  <SimulationPage userId={user?.id} />
                </PageShell>
              )}
              {section === 'agent'      && <AgentSection user={user} />}
              {section === 'cockpit'    && <CockpitSection user={user} navigateSection={navigateSection} />}
              {section === 'dept-customer-service'    && <DepartmentPage areaId="customer-service"    user={user} navigateSection={navigateSection} view={deptView} />}
              {section === 'dept-marketing-sales'     && <DepartmentPage areaId="marketing-sales"     user={user} navigateSection={navigateSection} view={deptView} />}
              {section === 'dept-finance-accounting'  && <DepartmentPage areaId="finance-accounting"  user={user} navigateSection={navigateSection} view={deptView} />}
              {section === 'dept-management-strategy' && <DepartmentPage areaId="management-strategy" user={user} navigateSection={navigateSection} view={deptView} />}

              {/* ── Account → tabbed: Profile / Billing / Data ───────── */}
              {section === 'account' && (
                <div>
                  {/* Tab switcher */}
                  <div style={{ display: 'flex', gap: 4, padding: '20px 28px 0', borderBottom: `1px solid ${G.border}` }}>
                    {['profile', 'billing', 'data'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setAccountTab(tab)}
                        style={{
                          padding: '8px 18px', borderRadius: '8px 8px 0 0',
                          border: `1px solid ${accountTab === tab ? G.border2 : 'transparent'}`,
                          borderBottom: accountTab === tab ? `1px solid ${G.surface}` : 'transparent',
                          background: accountTab === tab ? G.surface : 'transparent',
                          color: accountTab === tab ? G.text : G.textMuted,
                          fontSize: 13, fontWeight: accountTab === tab ? 600 : 500,
                          cursor: 'pointer', textTransform: 'capitalize',
                          marginBottom: accountTab === tab ? -1 : 0,
                          fontFamily: 'inherit',
                          transition: 'all 0.12s',
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Profile tab */}
                  {accountTab === 'profile' && (
                    <AccountSection
                      user={user}
                      profile={profile}
                      onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
                      onSignOut={onSignOut}
                    />
                  )}

                  {/* Billing tab */}
                  {accountTab === 'billing' && (
                    <PageShell title="Subscription" sub={requiresPayment ? 'Activate your account to get started.' : 'Your current plan.'}>
                      {requiresPayment && (
                        <div style={{ background: G.amberBg, border: `1px solid ${G.amber}`, borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 16 }}>⚠</span>
                          <span style={{ fontSize: 14, color: G.amberText, fontWeight: 500 }}>Your account isn't active yet. Pick a plan below to get started.</span>
                        </div>
                      )}
                      {checkoutSyncing && (
                        <div style={{ background: G.accentLight, border: `1px solid ${G.accent}`, borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 16 }}>↻</span>
                          <span style={{ fontSize: 14, color: G.accentText, fontWeight: 500 }}>Finalizing your checkout and updating your plan…</span>
                        </div>
                      )}
                      {tier === 'intelligence' && <LiveBillingCard billing={billing} billingLoading={billingLoading} billingError={billingError} onOpenPortal={openPortal} portalLoading={portalLoading} />}
                      <div style={styles.tierGrid}>
                      </div>
                    </PageShell>
                  )}

                  {/* Data tab */}
                  {accountTab === 'data' && (
                    <AccountSection
                      user={user}
                      profile={profile}
                      onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
                      onSignOut={onSignOut}
                      dataOnly
                    />
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

function PageShell({ title, sub, actions, children }) {
  return (
    <div style={styles.pageShell}>
      {(title || actions) && (
        <div style={styles.pageHeader}>
          <div>
            {title && <h1 style={styles.pageTitle}>{title}</h1>}
            {sub && <p style={styles.pageSub}>{sub}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

function PendingActionCard({ action, userId, onResolved }) {
  const actionMeta = {
    EMAIL:      { inputKey: 'recipient_email', inputLabel: 'Recipient email', inputPlaceholder: 'name@example.com' },
    TEAM_BRIEF: { inputKey: 'channel', inputLabel: 'Slack channel', inputPlaceholder: '#channel or ID' },
    ACTION_PLAN: { inputKey: 'parent_id', inputLabel: 'Notion page ID', inputPlaceholder: 'Paste Notion page ID' },
  }[action?.action_type] || null

  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolve = async (decision) => {
    setLoading(true)
    setError('')
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const finalArgs = decision === 'approve' && actionMeta
        ? { [actionMeta.inputKey]: inputVal.trim() }
        : {}

      const response = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          pendingActionId: action.id,
          decision,
          finalArgs,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Could not resolve action.')
      if (typeof onResolved === 'function') onResolved()
    } catch (resolveErr) {
      setError(resolveErr?.message || 'Could not resolve action.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.pendingActionRow}>
      <div style={styles.pendingActionTop}>
        <div>
          <div style={styles.pendingActionTitle}>{action.title || formatPendingActionType(action.action_type)}</div>
          <div style={styles.pendingActionMeta}>{formatPendingActionType(action.action_type)} via {String(action.connector || '').toUpperCase()}</div>
        </div>
      </div>
      {actionMeta && (
        <>
          <div style={styles.pendingActionLabel}>{actionMeta.inputLabel}</div>
          <input
            type="text"
            value={inputVal}
            onChange={(event) => setInputVal(event.target.value)}
            placeholder={actionMeta.inputPlaceholder}
            style={styles.pendingActionInput}
          />
        </>
      )}
      <div style={styles.pendingActionButtons}>
        <button
          type="button"
          disabled={loading || (actionMeta && !inputVal.trim())}
          onClick={() => resolve('approve')}
          style={{
            ...styles.pendingActionApprove,
            ...(loading || (actionMeta && !inputVal.trim()) ? styles.pendingActionApproveDisabled : {}),
          }}
        >
          {loading ? '...' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => resolve('dismiss')}
          style={styles.pendingActionDismiss}
        >
          Dismiss
        </button>
      </div>
      {error && <div style={styles.pendingActionError}>{error}</div>}
    </div>
  )
}

function HomeSection({ user, profile, businessState, businessStateLoading, reports, reportsLoading, onStartAudit, onStartGoalAudit, healthIntel, theme, onOpenOversight }) {
  const sharpThemeActive = theme === 'sharp' || theme === 'dark' || theme === 'light'
  const [businessHealthExpanded, setBusinessHealthExpanded] = useState(false)
  const [openIssuesExpanded, setOpenIssuesExpanded] = useState(false)
  const [aiOpportunitiesExpanded, setAiOpportunitiesExpanded] = useState(false)
  const [weeklyDigestExpanded, setWeeklyDigestExpanded] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState(DEFAULT_NOTIFICATION_PREFS)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsToast, setPrefsToast] = useState('')
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(true)
  const [checkInSaving, setCheckInSaving] = useState(false)
  const [checkInSaved, setCheckInSaved] = useState(false)
  const [checkInSnoozed, setCheckInSnoozed] = useState(false)
  const [checkInError, setCheckInError] = useState('')
  const [checkInDraft, setCheckInDraft] = useState({
    sinceLast: '',
    improved: '',
    blocked: '',
    actionStatus: 'partial',
    changedAreas: ['goal_progress'],
    actionFeedback: [],
  })
  const latestReport = reports[0] || null
  const latestDiagnosticReport = getLatestDiagnosticReport(reports)
  const latestContent = latestDiagnosticReport ? parseReportContent(latestDiagnosticReport) : null
  const latestDomains = latestContent?.domains || []
  const sortedDomains = [...latestDomains].sort((a, b) => severityRank(a.status) - severityRank(b.status))
  const flaggedDomains = sortedDomains.filter((domain) => domain.status === 'critical' || domain.status === 'needs_work')
  const staleReport = latestDiagnosticReport && (Date.now() - new Date(latestDiagnosticReport.created_at).getTime()) > 24 * 60 * 60 * 1000
  const alertDomain = flaggedDomains[0]
  const healthScore = latestDomains.length ? computeHealthScore(latestDomains) : null
  const criticalIssuesCount = latestDomains.filter((domain) => domain.status === 'critical').length
  const openIssuesCount = flaggedDomains.length
  const businessHealthStatus = healthScore === null
    ? '—'
    : healthScore >= 70
      ? 'Stable'
      : healthScore >= 45
        ? 'Watch closely'
        : 'Needs attention'
  const businessHealthReason = healthScore === null
    ? 'No recent diagnostic report'
    : criticalIssuesCount > 0
      ? `${criticalIssuesCount} critical ${criticalIssuesCount === 1 ? 'area needs' : 'areas need'} action`
      : openIssuesCount > 0
        ? `${openIssuesCount} ${openIssuesCount === 1 ? 'area needs' : 'areas need'} attention`
        : 'All core areas look stable'
  const goalState = extractGoalState(profile, reports, businessState)
  const normalizedTier = normalizeTier(profile?.tier)
  const intelligenceUnlocked = normalizedTier === 'intelligence'
  const lastReportDate = latestDiagnosticReport?.created_at
    ? new Date(latestDiagnosticReport.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—'
  const alertKey = latestDiagnosticReport && alertDomain
    ? `tsa_alert_dismissed_${latestDiagnosticReport.id}_${alertDomain.name}`
    : null
  const [alertDismissed, setAlertDismissed] = useState(false)
  const opportunityItems = buildAiOpportunityItems(reports, profile?.tier || 'intelligence')
  const shareUserInfo = {
    name: profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    phone: profile?.phone || '',
    context: profile?.context || '',
    userId: user?.id || null,
    tier: profile?.tier || null,
    industry: profile?.industry || null,
    domain: profile?.domain || null,
  }

  useEffect(() => {
    if (!alertKey) {
      setAlertDismissed(false)
      return
    }
    setAlertDismissed(localStorage.getItem(alertKey) === '1')
  }, [alertKey])

  const dismissAlert = () => {
    if (alertKey) localStorage.setItem(alertKey, '1')
    setAlertDismissed(true)
  }

  useEffect(() => {
    if (!prefsToast) return undefined
    const timeout = setTimeout(() => setPrefsToast(''), 2200)
    return () => clearTimeout(timeout)
  }, [prefsToast])

  useEffect(() => {
    let cancelled = false
    if (!user?.id || !intelligenceUnlocked) {
      setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS)
      setPrefsLoading(false)
      return undefined
    }

    ;(async () => {
      setPrefsLoading(true)
      try {
        const sb = await initSupabase()
        const { data: prefsData } = await sb
          .from('intelligence_notification_preferences')
          .select('enabled, frequency, channels, areas')
          .eq('user_id', user.id)
          .maybeSingle()

        if (cancelled) return
        setNotificationPrefs({
          ...DEFAULT_NOTIFICATION_PREFS,
          ...(prefsData || {}),
          channels: Array.isArray(prefsData?.channels) && prefsData.channels.length > 0 ? prefsData.channels : DEFAULT_NOTIFICATION_PREFS.channels,
          areas: normalizeNotificationAreas(prefsData?.areas),
        })
      } catch (err) {
        console.warn('[dashboard] notification prefs load failed:', err?.message || err)
        if (!cancelled) setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS)
      } finally {
        if (!cancelled) setPrefsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [intelligenceUnlocked, user?.id])

  useEffect(() => {
    let cancelled = false
    if (!user?.id || !latestDiagnosticReport?.id) {
      setCheckInSnoozed(false)
      setCheckInLoading(false)
      return undefined
    }

    ;(async () => {
      setCheckInLoading(true)
      try {
        const sb = await initSupabase()
        const [{ data }, { data: stateRow }] = await Promise.all([
          sb
            .from('user_memory')
            .select('id, business_state, created_at')
            .eq('user_id', user.id)
            .eq('report_id', latestDiagnosticReport.id)
            .order('created_at', { ascending: false })
            .limit(1),
          sb
            .from('business_state')
            .select('founder_checkin_snooze')
            .eq('user_id', user.id)
            .single(),
        ])

        if (cancelled) return
        const snoozed = isFounderCheckInSnoozed(stateRow, latestDiagnosticReport.id)
        const existing = Array.isArray(data) ? data.find((row) => row?.business_state?.checkin_type === 'dashboard_followup') : null
        setCheckInSaved(!!existing)
        setCheckInSnoozed(snoozed)
        setCheckInOpen(!existing && staleReport && !snoozed)
      } catch (error) {
        console.warn('[dashboard] check-in lookup failed:', error?.message || error)
        if (!cancelled) {
          setCheckInSnoozed(false)
          setCheckInOpen(staleReport)
        }
      } finally {
        if (!cancelled) setCheckInLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [latestDiagnosticReport?.id, staleReport, user?.id])

  const snoozeFounderCheckIn = () => {
    if (!user?.id || !latestDiagnosticReport?.id) {
      setCheckInOpen(false)
      setCheckInSnoozed(true)
      return
    }

    const until = Date.now() + FOUNDER_CHECKIN_SNOOZE_MS
    ;(async () => {
      try {
        const sb = await initSupabase()
        const payload = {
          user_id: user.id,
          founder_checkin_snooze: {
            report_id: latestDiagnosticReport.id,
            until,
          },
          updated_at: new Date().toISOString(),
        }
        const { data, error } = await sb
          .from('business_state')
          .upsert(payload, { onConflict: 'user_id' })
          .select('*')
          .single()
        if (error) throw error
        setBusinessState((prev) => mergeBusinessState(data || payload, prev))
        setCheckInOpen(false)
        setCheckInSnoozed(true)
      } catch (error) {
        console.warn('[dashboard] snooze save failed:', error?.message || error)
        setPrefsToast('Could not snooze reminder')
      }
    })()
  }

  useEffect(() => {
    if (!businessHealthExpanded && !openIssuesExpanded && !aiOpportunitiesExpanded && !weeklyDigestExpanded) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBusinessHealthExpanded(false)
        setOpenIssuesExpanded(false)
        setAiOpportunitiesExpanded(false)
        setWeeklyDigestExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [businessHealthExpanded, openIssuesExpanded, aiOpportunitiesExpanded, weeklyDigestExpanded])

  const togglePreferenceArea = (areaKey) => {
    setNotificationPrefs((prev) => {
      const hasArea = prev.areas.includes(areaKey)
      const nextAreas = hasArea
        ? prev.areas.filter((item) => item !== areaKey)
        : [...prev.areas, areaKey]
      return { ...prev, areas: nextAreas }
    })
  }

  const toggleCheckInArea = (areaKey) => {
    setCheckInDraft((prev) => {
      const hasArea = prev.changedAreas.includes(areaKey)
      const nextAreas = hasArea
        ? prev.changedAreas.filter((item) => item !== areaKey)
        : [...prev.changedAreas, areaKey]
      return { ...prev, changedAreas: nextAreas.length > 0 ? nextAreas : [areaKey] }
    })
  }

  const saveNotificationPrefs = async () => {
    if (!user?.id || !intelligenceUnlocked) return
    setSavingPrefs(true)
    try {
      const sb = await initSupabase()
      const payload = {
        user_id: user.id,
        enabled: !!notificationPrefs.enabled,
        frequency: notificationPrefs.frequency,
        channels: notificationPrefs.enabled ? notificationPrefs.channels : ['in_app'],
        areas: notificationPrefs.enabled ? notificationPrefs.areas : [],
        updated_at: new Date().toISOString(),
      }
      const { error } = await sb
        .from('intelligence_notification_preferences')
        .upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setPrefsToast('Alert preferences saved')
    } catch (err) {
      console.error('[dashboard] prefs save failed:', err?.message || err)
      setPrefsToast('Save failed')
    } finally {
      setSavingPrefs(false)
    }
  }

  const saveDashboardCheckIn = async () => {
    if (!user?.id || !latestDiagnosticReport?.id) return
    setCheckInSaving(true)
    setCheckInError('')
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/save-dashboard-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          reportId: latestDiagnosticReport.id,
          reportTitle: latestDiagnosticReport.title || latestDiagnosticReport.headline || '',
          sinceLast: checkInDraft.sinceLast,
          improved: checkInDraft.improved,
          blocked: checkInDraft.blocked,
          actionStatus: checkInDraft.actionStatus,
          changedAreas: checkInDraft.changedAreas,
          actionFeedback: checkInDraft.actionFeedback,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Could not save update right now.')
      setCheckInSaved(true)
      setCheckInSnoozed(false)
      try {
        const payload = {
          user_id: user.id,
          founder_checkin_snooze: {},
          updated_at: new Date().toISOString(),
        }
        const { data: stateData, error: stateError } = await sb
          .from('business_state')
          .upsert(payload, { onConflict: 'user_id' })
          .select('*')
          .single()
        if (stateError) throw stateError
        setBusinessState((prev) => mergeBusinessState(stateData || payload, prev))
      } catch (clearError) {
        console.warn('[dashboard] snooze clear failed:', clearError?.message || clearError)
      }
      setCheckInOpen(false)
      setPrefsToast('Founder update saved')
    } catch (error) {
      setCheckInError(error?.message || 'Could not save update right now.')
    } finally {
      setCheckInSaving(false)
    }
  }

  return (
    <div style={styles.pageShell}>
      {staleReport && alertDomain && !alertDismissed && (
        <div style={styles.alertBar}>
          <div style={styles.alertTextWrap}>
            <span style={styles.alertDot} />
            <span style={styles.alertText}>
              {alertDomain.name} is still flagged from your {lastReportDate} audit. Worth updating before it compounds.
            </span>
          </div>
          <div style={styles.alertActions}>
            <button
              type="button"
              style={styles.alertButton}
              onClick={() => {
                setBusinessHealthExpanded(false)
                setOpenIssuesExpanded(true)
                setAiOpportunitiesExpanded(false)
                setWeeklyDigestExpanded(false)
              }}
            >
              update status
            </button>
            <button type="button" style={styles.alertDismissButton} onClick={dismissAlert} aria-label="Dismiss notification" title="Dismiss notification">
              ×
            </button>
          </div>
        </div>
      )}

      <div style={styles.kpiGrid}>
        <KpiCard
          sharpTheme={sharpThemeActive}
          label="Business health"
          value={reportsLoading ? '…' : businessHealthStatus}
          delta={reportsLoading ? 'Reviewing your latest report' : businessHealthReason}
          tone={healthScore === null ? 'neutral' : healthScore >= 70 ? 'up' : healthScore >= 45 ? 'warn' : 'down'}
          hint={businessHealthExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setOpenIssuesExpanded(false)
            setAiOpportunitiesExpanded(false)
            setWeeklyDigestExpanded(false)
            setBusinessHealthExpanded((prev) => !prev)
          }}
          active={businessHealthExpanded}
        />
        <KpiCard
          sharpTheme={sharpThemeActive}
          label="Open issues"
          value={reportsLoading ? '…' : openIssuesCount}
          delta={openIssuesCount === 0 ? 'Nothing flagged' : `${openIssuesCount} domains still open`}
          tone={openIssuesCount === 0 ? 'up' : openIssuesCount > 2 ? 'down' : 'warn'}
          hint={openIssuesExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setBusinessHealthExpanded(false)
            setAiOpportunitiesExpanded(false)
            setWeeklyDigestExpanded(false)
            setOpenIssuesExpanded((prev) => !prev)
          }}
          active={openIssuesExpanded}
        />
        <KpiCard
          sharpTheme={sharpThemeActive}
          label="AI opportunities"
          value={reportsLoading ? '…' : opportunityItems.length}
          delta={opportunityItems.length === 0 ? 'No opportunities extracted yet' : `${opportunityItems.length} ranked opportunities ready to review`}
          tone={opportunityItems.length > 0 ? 'up' : 'neutral'}
          hint={aiOpportunitiesExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setBusinessHealthExpanded(false)
            setOpenIssuesExpanded(false)
            setWeeklyDigestExpanded(false)
            setAiOpportunitiesExpanded((prev) => !prev)
          }}
          active={aiOpportunitiesExpanded}
        />
        <KpiCard
          sharpTheme={sharpThemeActive}
          label="Weekly digest & alerts"
          value={notificationPrefs.enabled ? notificationFrequencyLabel(notificationPrefs.frequency) : 'Paused'}
          delta={profile?.last_digest_sent_at
            ? `Latest digest ${new Date(profile.last_digest_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : (prefsLoading ? 'Loading preferences…' : 'Every Monday · 9am UTC')}
          tone={notificationPrefs.enabled ? 'neutral' : 'warn'}
          hint={weeklyDigestExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setBusinessHealthExpanded(false)
            setOpenIssuesExpanded(false)
            setAiOpportunitiesExpanded(false)
            setWeeklyDigestExpanded((prev) => !prev)
          }}
          active={weeklyDigestExpanded}
        />
      </div>

      {intelligenceUnlocked && (
        <OperationalOversightSnapshotCard
          healthIntel={healthIntel}
          onOpenOversight={onOpenOversight}
        />
      )}

      {staleReport && !checkInSaved && !checkInLoading && !checkInSnoozed && (
        <div style={styles.checkInCard}>
          <div>
            <div style={styles.panelTitle}>founder follow-up</div>
            <div style={styles.checkInTitle}>What changed since your {lastReportDate} audit?</div>
            <div style={styles.checkInText}>
              Tell SelfAudit what actually moved, what improved, and what is still stuck so the next digest and alerts use founder-confirmed facts.
            </div>
          </div>
          <div style={styles.checkInActions}>
            <button type="button" style={styles.checkInGhostBtn} onClick={snoozeFounderCheckIn}>
              Later
            </button>
            <button type="button" style={styles.checkInPrimaryBtn} onClick={() => setCheckInOpen(true)}>
              Add update
            </button>
          </div>
        </div>
      )}

      <div style={styles.homeColumns}>
        <div style={styles.leftColumnFull}>
          <ExecutionPanel
            variant="dashboard"
            reports={reports}
            report={latestDiagnosticReport || latestReport}
            userInfo={shareUserInfo}
            healthIntel={healthIntel}
            theme={theme}
          />
        </div>
      </div>

      {businessHealthExpanded && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setBusinessHealthExpanded(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <BusinessHealthPanel
              latestDomains={latestDomains}
              healthIntel={healthIntel}
              goalState={goalState}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setBusinessHealthExpanded(false)}
                  aria-label="Close business health details"
                >
                  Close
                </button>
              )}
            />
          </div>
        </div>
      )}

      {openIssuesExpanded && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpenIssuesExpanded(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <OpenIssuesDetailPanel
              report={latestDiagnosticReport}
              domains={sortedDomains}
              userId={user?.id}
              issueState={businessState}
              onIssueStateChange={setBusinessState}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setOpenIssuesExpanded(false)}
                  aria-label="Close open issues details"
                >
                  Close
                </button>
              )}
            />
          </div>
        </div>
      )}

      {aiOpportunitiesExpanded && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setAiOpportunitiesExpanded(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <AiOpportunitiesDetailPanel
              user={user}
              userInfo={shareUserInfo}
              reports={reports}
              items={opportunityItems}
              tier={profile?.tier || 'intelligence'}
              initialShared={!!profile?.shared_with_vnklo}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setAiOpportunitiesExpanded(false)}
                  aria-label="Close AI opportunities details"
                >
                  Close
                </button>
              )}
            />
          </div>
        </div>
      )}

      {weeklyDigestExpanded && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setWeeklyDigestExpanded(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <WeeklyDigestAlertsPanel
              profile={profile}
              intelligenceUnlocked={intelligenceUnlocked}
              notificationPrefs={notificationPrefs}
              setNotificationPrefs={setNotificationPrefs}
              prefsLoading={prefsLoading}
              savingPrefs={savingPrefs}
              prefsToast={prefsToast}
              onToggleArea={togglePreferenceArea}
              onSavePrefs={saveNotificationPrefs}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setWeeklyDigestExpanded(false)}
                  aria-label="Close weekly digest and alerts"
                >
                  Close
                </button>
              )}
            />
          </div>
        </div>
      )}

      {checkInOpen && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setCheckInOpen(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <FounderCheckInPanel
              draft={checkInDraft}
              setDraft={setCheckInDraft}
              saving={checkInSaving}
              error={checkInError}
              reportDate={lastReportDate}
              onToggleArea={toggleCheckInArea}
              onSave={saveDashboardCheckIn}
              priorityActions={latestContent?.priority_actions ?? []}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setCheckInOpen(false)}
                  aria-label="Close founder update"
                >
                  Close
                </button>
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, delta, tone, hint, onClick, active = false, sharpTheme = false }) {
  const toneColor = tone === 'up' ? G.greenText : tone === 'warn' ? G.amberText : tone === 'down' ? G.redText : G.textFaint
  const cardStyle = active
    ? { ...styles.kpiCard, ...(sharpTheme ? styles.kpiCardSharp : {}), ...styles.kpiCardActive }
    : { ...styles.kpiCard, ...(sharpTheme ? styles.kpiCardSharp : {}) }

  if (onClick) {
    return (
      <button type="button" style={{ ...cardStyle, ...styles.kpiCardButton }} onClick={onClick}>
        <div style={styles.kpiLabel}>{label}</div>
        <div style={styles.kpiValue}>{value}</div>
        <div style={{ ...styles.kpiDelta, color: toneColor }}>{delta}</div>
        {hint ? <div style={styles.kpiHint}>{hint}</div> : null}
      </button>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={styles.kpiLabel}>{label}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={{ ...styles.kpiDelta, color: toneColor }}>{delta}</div>
      {hint ? <div style={styles.kpiHint}>{hint}</div> : null}
    </div>
  )
}

function OperationalOversightSnapshotCard({ healthIntel, onOpenOversight }) {
  const attention = healthIntel?.governance_areas_needing_attention ?? 0
  const watch = healthIntel?.governance_areas_to_watch ?? 0
  const summary = healthIntel?.governance_summary || healthIntel?.health_check_summary || 'Run monitoring to see which operating lanes need attention.'
  const topDiagnosis = Array.isArray(healthIntel?.governance_top_diagnoses) ? healthIntel.governance_top_diagnoses[0] : null
  const topLabel = topDiagnosis?.area_id ? (GOVERNANCE_AREA_LABELS[topDiagnosis.area_id] || topDiagnosis.area_id) : ''
  const statusTone = attention > 0 ? governanceStatusTone('bad') : watch > 0 ? governanceStatusTone('watch') : governanceStatusTone('good')

  return (
    <div style={styles.oversightSnapshotCard}>
      <div style={styles.oversightSnapshotTop}>
        <div>
          <div style={styles.panelTitle}>operational oversight</div>
          <div style={styles.oversightSnapshotHeadline}>{statusTone.label}</div>
          <div style={styles.oversightSnapshotSummary}>{summary}</div>
        </div>
        <button type="button" style={styles.oversightSnapshotButton} onClick={onOpenOversight}>
          Open oversight
        </button>
      </div>
      <div style={styles.oversightSnapshotMetaRow}>
        <span>{healthIntel?.governance_areas_with_signals ?? 0} areas with live signals</span>
        <span>{attention} need attention</span>
        <span>{watch} to watch</span>
      </div>
      {topDiagnosis && (
        <div style={styles.oversightSnapshotDiagnosis}>
          <span style={{ ...styles.alertPill, background: statusTone.bg, color: statusTone.color, borderColor: statusTone.border }}>
            {topLabel || 'Top issue'}
          </span>
          <span style={styles.oversightSnapshotDiagnosisText}>{topDiagnosis.title}</span>
        </div>
      )}
    </div>
  )
}

const THRESHOLD_AREAS = [
  {
    id: 'customer-service',
    label: 'Customer Service',
    rules: [
      { ruleId: 'customer-service:first-response-watch', label: 'First response — watch above', unit: 'hrs', defaultValue: 8,  min: 1,   max: 168 },
      { ruleId: 'customer-service:first-response-bad',   label: 'First response — bad above',   unit: 'hrs', defaultValue: 24, min: 1,   max: 168 },
      { ruleId: 'customer-service:resolution-watch',     label: 'Resolution time — watch above', unit: 'hrs', defaultValue: 48, min: 1,   max: 336 },
      { ruleId: 'customer-service:repeat-issue-bad',     label: 'Repeat issue rate — bad above', unit: '%',   defaultValue: 20, min: 0,   max: 100 },
      { ruleId: 'customer-service:csat-bad',             label: 'CSAT — bad below',              unit: 'pts', defaultValue: 80, min: 0,   max: 100 },
    ],
  },
  {
    id: 'marketing-sales',
    label: 'Marketing & Sales',
    rules: [
      { ruleId: 'marketing-sales:open-deals-bad',            label: 'Open deals — bad below',        unit: 'deals', defaultValue: 3,  min: 0, max: 999 },
      { ruleId: 'marketing-sales:lead-volume-watch',         label: 'Lead volume — watch below',     unit: 'leads', defaultValue: 10, min: 0, max: 999 },
      { ruleId: 'marketing-sales:stage-conversion-watch',    label: 'Stage conversion — watch below',unit: '%',     defaultValue: 25, min: 0, max: 100 },
      { ruleId: 'marketing-sales:stage-conversion-bad',      label: 'Stage conversion — bad below',  unit: '%',     defaultValue: 15, min: 0, max: 100 },
      { ruleId: 'marketing-sales:sales-cycle-watch',         label: 'Sales cycle — watch above',     unit: 'days',  defaultValue: 45, min: 1, max: 365 },
    ],
  },
  {
    id: 'finance-accounting',
    label: 'Finance & Accounting',
    rules: [
      { ruleId: 'finance-accounting:churn-watch',    label: 'Churn — watch above',   unit: '%',    defaultValue: 2,  min: 0,  max: 100 },
      { ruleId: 'finance-accounting:churn-bad',      label: 'Churn — bad above',     unit: '%',    defaultValue: 5,  min: 0,  max: 100 },
      { ruleId: 'finance-accounting:runway-watch',   label: 'Runway — watch below',  unit: 'mo',   defaultValue: 12, min: 1,  max: 120 },
      { ruleId: 'finance-accounting:runway-bad',     label: 'Runway — bad below',    unit: 'mo',   defaultValue: 6,  min: 1,  max: 120 },
      { ruleId: 'finance-accounting:ltv-cac-watch',  label: 'LTV:CAC — watch below', unit: 'ratio',defaultValue: 3,  min: 0,  max: 20  },
      { ruleId: 'finance-accounting:ltv-cac-bad',    label: 'LTV:CAC — bad below',   unit: 'ratio',defaultValue: 1,  min: 0,  max: 20  },
    ],
  },
  {
    id: 'management-strategy',
    label: 'Management & Strategy',
    rules: [
      { ruleId: 'management-strategy:goal-progress-watch',   label: 'Goal progress — watch below',     unit: '%',   defaultValue: 60, min: 0, max: 100 },
      { ruleId: 'management-strategy:priority-backlog-bad',  label: 'Priority backlog — bad above',    unit: 'items',defaultValue: 5,  min: 0, max: 50  },
      { ruleId: 'management-strategy:repeated-blockers-watch',label:'Repeated blockers — watch above', unit: 'count',defaultValue: 2,  min: 0, max: 20  },
      { ruleId: 'management-strategy:followthrough-watch',   label: 'Follow-through — watch below',    unit: '%',   defaultValue: 80, min: 0, max: 100 },
      { ruleId: 'management-strategy:followthrough-bad',     label: 'Follow-through — bad below',      unit: '%',   defaultValue: 60, min: 0, max: 100 },
    ],
  },
]

function ThresholdEditorPanel({ userId }) {
  const [overrides, setOverrides] = useState({})
  const [saving, setSaving]       = useState({})
  const [saved, setSaved]         = useState({})
  const [open, setOpen]           = useState({})

  useEffect(() => {
    if (!userId) return
    async function load() {
      try {
        const sb = await initSupabase()
        const { data: { session: s } } = await sb.auth.getSession()
        const token = s?.access_token || ''
        const res = await fetch(`/api/user-rules?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return
        const data = await res.json()
        const map = {}
        for (const row of data.overrides ?? []) map[row.rule_id] = row.value
        setOverrides(map)
      } catch { /* non-blocking */ }
    }
    load()
  }, [userId])

  const getValue = (ruleId, defaultValue) =>
    overrides[ruleId] !== undefined ? overrides[ruleId] : defaultValue

  const handleBlur = async (ruleId, areaId, metricKey, value, defaultValue) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    if (num === defaultValue && overrides[ruleId] === undefined) return
    setSaving((prev) => ({ ...prev, [ruleId]: true }))
    try {
      const sb = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      const res = await fetch('/api/user-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, ruleId, areaId, metricKey, value: num }),
      })
      if (res.ok) {
        setOverrides((prev) => ({ ...prev, [ruleId]: num }))
        setSaved((prev) => ({ ...prev, [ruleId]: true }))
        setTimeout(() => setSaved((prev) => ({ ...prev, [ruleId]: false })), 2000)
      }
    } catch { /* non-blocking */ }
    setSaving((prev) => ({ ...prev, [ruleId]: false }))
  }

  const handleReset = async (ruleId, defaultValue) => {
    try {
      const sb = await initSupabase()
      const { data: { session: s } } = await sb.auth.getSession()
      const token = s?.access_token || ''
      await fetch(`/api/user-rules?userId=${userId}&ruleId=${encodeURIComponent(ruleId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setOverrides((prev) => { const next = { ...prev }; delete next[ruleId]; return next })
    } catch { /* non-blocking */ }
  }

  return (
    <PanelCard title="your standards">
      <div style={styles.weeklyDigestPrefsIntro}>
        These thresholds define what "watch" and "bad" mean for your business. SelfAudit defaults are shown — override any value and the monitoring system uses your number instead.
      </div>
      {THRESHOLD_AREAS.map((area) => (
        <div key={area.id} style={{ marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setOpen((prev) => ({ ...prev, [area.id]: !prev[area.id] }))}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 500 }}
          >
            {area.label}
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{open[area.id] ? '▲' : '▼'}</span>
          </button>
          {open[area.id] && (
            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 8 }}>
              {area.rules.map((rule) => {
                const currentValue = getValue(rule.ruleId, rule.defaultValue)
                const isOverridden = overrides[rule.ruleId] !== undefined
                return (
                  <div key={rule.ruleId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ flex: 1, fontSize: '0.77rem', color: 'var(--text-soft)', minWidth: 160 }}>{rule.label}</span>
                    <input
                      type="number"
                      min={rule.min}
                      max={rule.max}
                      step="any"
                      defaultValue={currentValue}
                      key={`${rule.ruleId}-${currentValue}`}
                      onBlur={(e) => handleBlur(rule.ruleId, area.id, rule.ruleId.split(':')[1] ?? '', e.target.value, rule.defaultValue)}
                      style={{ width: 72, padding: '4px 6px', borderRadius: 6, border: `1px solid ${isOverridden ? 'var(--accent)' : 'var(--border)'}`, background: 'var(--input-bg, var(--surface))', color: 'var(--text)', fontSize: '0.78rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', width: 36 }}>{rule.unit}</span>
                    {saving[rule.ruleId] && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>…</span>}
                    {saved[rule.ruleId]  && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Saved</span>}
                    {isOverridden && !saving[rule.ruleId] && !saved[rule.ruleId] && (
                      <button type="button" onClick={() => handleReset(rule.ruleId, rule.defaultValue)} style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        reset
                      </button>
                    )}
                    {!isOverridden && <span style={{ fontSize: '0.7rem', color: 'var(--muted)', opacity: 0.5 }}>default</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </PanelCard>
  )
}

function OperationalOversightSection({ intelligenceUnlocked, healthIntel, userId, areaTrends = {} }) {
  if (!intelligenceUnlocked) {
    return (
      <PanelCard title="operational oversight">
        <EmptyPanel message="Operational oversight is reserved for Intelligence users." />
      </PanelCard>
    )
  }

  const statuses = Array.isArray(healthIntel?.governance_area_statuses) ? healthIntel.governance_area_statuses : []
  const topDiagnoses = Array.isArray(healthIntel?.governance_top_diagnoses) ? healthIntel.governance_top_diagnoses : []
  const actions = Array.isArray(healthIntel?.health_check_actions) ? healthIntel.health_check_actions : []

  return (
    <div style={styles.oversightGrid}>
      <PanelCard title="founder view" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={styles.oversightFounderSummary}>
          <div style={styles.oversightFounderHeadline}>
            {healthIntel?.governance_summary || 'No governance summary yet.'}
          </div>
          <div style={styles.oversightFounderMeta}>
            <span>{healthIntel?.governance_areas_with_signals ?? 0} areas with signals</span>
            <span>{healthIntel?.governance_alert_candidates ?? 0} alert candidates</span>
            <span>{healthIntel?.governance_diagnoses_count ?? 0} diagnoses</span>
          </div>
        </div>
        {actions.length > 0 ? (
          <div style={styles.oversightActionList}>
            {actions.slice(0, 5).map((action, index) => (
              <div key={`${index}-${action}`} style={styles.oversightActionItem}>
                <span style={styles.oversightActionIndex}>{index + 1}</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel message="Run monitoring again to populate recommended actions." />
        )}
        </div>
      </PanelCard>

      <PanelCard title="area workspaces" style={{ display: 'flex', flexDirection: 'column' }}>
        {statuses.length === 0 ? (
          <EmptyPanel message="No area-level monitoring signals yet." />
        ) : (
          <div style={{ ...styles.oversightAreaList, overflowY: 'auto', flex: 1 }}>
            {statuses.map((item) => {
              const tone = governanceStatusTone(item.status)
              const areaLabel = GOVERNANCE_AREA_LABELS[item.area_id] || item.area_id
              const matchingDiagnosis = topDiagnoses.find((diag) => diag.area_id === item.area_id)
              const trend = areaTrends[item.area_id]
              const trendColor = trend?.direction === 'improving' ? '#4CAF50' : trend?.direction === 'worsening' ? '#E57373' : 'var(--text-muted)'
              return (
                <div key={item.area_id} style={styles.oversightAreaCard}>
                  <div style={styles.oversightAreaTop}>
                    <div>
                      <div style={styles.oversightAreaLabel}>{areaLabel}</div>
                      <div style={styles.oversightAreaCoverage}>
                        {item.coverage > 0 ? `${item.coverage} live signal${item.coverage !== 1 ? 's' : ''}` : 'No live signals yet'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {trend && trend.direction !== 'stable' && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor }}>
                          {trend.label}
                        </span>
                      )}
                      <span style={{ ...styles.alertPill, background: tone.bg, color: tone.color, borderColor: tone.border }}>
                        {tone.label}
                      </span>
                    </div>
                  </div>
                  <div style={styles.oversightAreaDiagnosis}>
                    {matchingDiagnosis?.title || 'No major issue flagged right now.'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PanelCard>

    </div>
  )
}

function AlertsInboxSection({
  intelligenceUnlocked,
  alerts,
  alertsLoading,
  alertsError,
  onRefreshAlerts,
  onUpdateAlert,
  updatingAlertIds,
}) {
  if (!intelligenceUnlocked) {
    return (
      <PanelCard title="alerts inbox">
        <EmptyPanel message="Alerts inbox is reserved for Intelligence users." />
      </PanelCard>
    )
  }

  return (
    <PanelCard
      title="alerts inbox"
      right={(
        <button type="button" style={styles.businessHealthCloseBtn} onClick={onRefreshAlerts} disabled={alertsLoading}>
          {alertsLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      )}
    >
      <div style={styles.alertsSummaryRow}>
        <div>
          <div style={styles.alertsSummaryValue}>{alertsLoading ? '…' : alerts.length}</div>
          <div style={styles.openIssuesSummaryText}>
            {alerts.length === 1 ? '1 unresolved alert' : `${alerts.length} unresolved alerts`}
          </div>
        </div>
        <div style={styles.alertsSummaryMeta}>
          Acknowledge what you have seen. Resolve only when the underlying issue is truly handled.
        </div>
      </div>

      {alertsError ? <div style={styles.alertsError}>{alertsError}</div> : null}

      {alertsLoading ? (
        <div style={styles.weeklyDigestEmpty}>Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <EmptyPanel message="No unresolved alerts right now." />
      ) : (
        <div style={styles.alertsList}>
          {alerts.map((alert) => {
            const severityTone = alertSeverityTone(alert.severity)
            const statusTone = alertStatusTone(alert.status)
            const busy = !!updatingAlertIds?.[alert.id]
            return (
              <div key={alert.id} style={styles.alertRow}>
                <div style={styles.alertRowTop}>
                  <div style={styles.alertTitleWrap}>
                    <div style={styles.alertTitle}>{alert.title}</div>
                    <div style={styles.alertMeta}>
                      <span>{alert.category?.replace(/_/g, ' ') || 'general'}</span>
                      <span>·</span>
                      <span>{alertAgeLabel(alert.created_at)}</span>
                    </div>
                  </div>
                  <div style={styles.alertPills}>
                    <span style={{ ...styles.alertPill, background: severityTone.bg, color: severityTone.color, borderColor: severityTone.border }}>
                      {alert.severity || 'medium'}
                    </span>
                    <span style={{ ...styles.alertPill, background: statusTone.bg, color: statusTone.color, borderColor: statusTone.border }}>
                      {alert.status || 'open'}
                    </span>
                  </div>
                </div>

                {alert.description ? <div style={styles.alertDescription}>{alert.description}</div> : null}
                {alert.recommended_action ? (
                  <div style={styles.alertActionCopy}>
                    <strong style={{ color: G.text }}>Recommended:</strong> {alert.recommended_action}
                  </div>
                ) : null}

                <div style={styles.alertActionRow}>
                  <button
                    type="button"
                    style={styles.alertInboxGhostBtn}
                    disabled={busy || alert.status === 'acknowledged'}
                    onClick={() => onUpdateAlert(alert.id, 'acknowledged')}
                  >
                    {busy && alert.status !== 'acknowledged' ? 'Saving…' : alert.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                  <button
                    type="button"
                    style={styles.alertInboxPrimaryBtn}
                    disabled={busy}
                    onClick={() => onUpdateAlert(alert.id, 'resolved')}
                  >
                    {busy ? 'Saving…' : 'Resolve'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PanelCard>
  )
}

function OpenIssuesDetailPanel({ report, domains, userId, issueState, onIssueStateChange, right = null }) {
  const persisted = getOpenIssueStatuses(issueState, report?.id)
  const count = domains.filter((domain) => (persisted[domain.name] || 'open') !== 'resolved').length

  return (
    <PanelCard title="open issues" right={right}>
      {!report || domains.length === 0 ? (
        <EmptyPanel message="Run an audit to populate issue tracking." />
      ) : (
        <>
          <div style={styles.openIssuesSummaryRow}>
            <div style={styles.openIssuesSummaryValue}>{count}</div>
            <div style={styles.openIssuesSummaryText}>
              {count === 1 ? '1 domain still open' : `${count} domains still open`}
            </div>
          </div>
          <OpenIssuesTracker report={report} domains={domains} userId={userId} issueState={issueState} onIssueStateChange={onIssueStateChange} limit={null} />
        </>
      )}
    </PanelCard>
  )
}

function BusinessHealthPanel({ latestDomains, healthIntel, goalState, right = null }) {
  const score = latestDomains.length ? computeHealthScore(latestDomains) : 0
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const fill = (score / 100) * circumference
  const progress = typeof goalState?.progress === 'number' ? Math.max(0, Math.min(100, goalState.progress)) : 0
  const structuredGoal = !!(goalState?.goal && typeof goalState?.goal_health_score === 'number')
  const goalHealthMeta = getGoalHealthMeta(goalState?.goal_health_score)

  const activeRisks       = healthIntel?.active_risks?.slice(0, 3)       ?? []
  const unresolvedActions = healthIntel?.unresolved_actions?.slice(0, 3) ?? []

  return (
    <PanelCard title="business health" right={right}>
      {latestDomains.length === 0 ? (
        <EmptyPanel message="Health bars appear after your first diagnostic report." />
      ) : (
        <>
          <div style={styles.healthHeader}>
            <div style={styles.donutWrap}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={radius} fill="none" stroke={G.border} strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke={G.accent}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${fill} ${circumference}`}
                  transform="rotate(-90 32 32)"
                />
              </svg>
              <div style={styles.donutScore}>{score}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: G.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>overall score</div>
              <div style={{ fontSize: 15, color: G.text, marginTop: 6 }}>
                {score >= 70 ? 'Healthy foundation' : score >= 45 ? 'Mixed signals' : 'Structural risk'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {latestDomains.slice(0, 5).map((domain) => {
              const value = domainScore(domain)
              const barColor = value < 40 ? G.red : value <= 65 ? G.amber : G.green
              return (
                <div key={domain.name} style={styles.domainBarRow}>
                  <div style={styles.domainBarLabel}>{domain.name}</div>
                  <div style={styles.domainBarTrack}>
                    <div style={{ ...styles.domainBarFill, width: `${value}%`, background: barColor }} />
                  </div>
                  <div style={styles.domainBarValue}>{value}</div>
                </div>
              )
            })}
          </div>

          <div style={styles.businessHealthSection}>
            <div style={styles.businessHealthSectionTitle}>goal progress</div>
            {structuredGoal ? (
              <div style={styles.goalTrackerCard}>
                <div style={styles.goalTrackerHeader}>
                  <div style={styles.businessHealthGoalText}>{goalState.goal}</div>
                  <div style={{ ...styles.goalHealthBadge, color: goalHealthMeta.color, background: goalHealthMeta.background }}>
                    {goalHealthMeta.label}
                  </div>
                </div>
                <div style={styles.goalTrack}>
                  <div style={{ ...styles.goalFill, width: `${progress}%` }} />
                </div>
                <div style={styles.goalMetaGrid}>
                  <div style={styles.goalMetaBlock}>
                    <span style={styles.goalMetaLabel}>Progress</span>
                    <span>{typeof goalState.progress === 'number' ? `${goalState.progress}% complete` : 'Progress not quantified yet'}</span>
                  </div>
                  <div style={styles.goalMetaBlock}>
                    <span style={styles.goalMetaLabel}>Deadline</span>
                    <span>{formatGoalDeadline(goalState.goal_deadline)}</span>
                  </div>
                  {goalState.goal_area_id && (
                    <div style={styles.goalMetaBlock}>
                      <span style={styles.goalMetaLabel}>Area</span>
                      <span style={styles.goalAreaTag}>{goalState.goal_area_id}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div style={styles.businessHealthGoalText}>
                  {goalState?.goal || 'No active goal'}
                </div>
                <div style={styles.goalTrack}>
                  <div style={{ ...styles.goalFill, width: `${goalState?.goal ? progress : 0}%` }} />
                </div>
                <div style={styles.goalMetaRow}>
                  <div>{goalState?.goal ? (typeof goalState.progress === 'number' ? `${goalState.progress}% of the way there` : 'Progress not quantified yet') : 'No goal progress yet'}</div>
                  <div>{goalState?.timeline || 'Timeline still being assessed'}</div>
                </div>
              </>
            )}
          </div>

          {activeRisks.length > 0 && (
            <div style={styles.businessHealthSection}>
              <div style={styles.businessHealthSectionTitle}>active risks</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeRisks.map((risk, i) => (
                  <div key={i} style={{ fontSize: 12, color: G.textSecondary, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: G.red, flexShrink: 0 }}>↑</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unresolvedActions.length > 0 && (
            <div style={styles.businessHealthSection}>
              <div style={styles.businessHealthSectionTitle}>unresolved actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {unresolvedActions.map((action, i) => (
                  <div key={i} style={{ fontSize: 12, color: G.textSecondary, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: G.amber, flexShrink: 0 }}>→</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PanelCard>
  )
}

function WeeklyDigestAlertsCard({ profile, notificationPrefs, prefsLoading, onClick, theme }) {
  const digest   = profile?.last_digest_summary ?? null
  const sentAt   = profile?.last_digest_sent_at ?? null
  const sentDate = sentAt
    ? new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  if (profile?.tier !== 'intelligence') return null

  const channelLabel = prefsLoading
    ? 'Loading preferences…'
    : notificationPrefs.enabled
      ? notificationChannelLabel(notificationPrefs.channels?.[0] || 'in_app')
      : 'Alerts off'
  const cadenceLabel = prefsLoading
    ? 'Loading cadence…'
    : notificationPrefs.enabled
      ? notificationFrequencyLabel(notificationPrefs.frequency)
      : 'Paused'
  const digestLabel = sentDate
    ? `Latest digest ${sentDate}`
    : 'Every Monday · 9am UTC'

  return (
    <button
      type="button"
      style={{
        ...styles.panelCard,
        ...((theme === 'sharp' || theme === 'dark' || theme === 'light') ? styles.panelCardSharp : {}),
        ...styles.weeklyDigestCardButton,
      }}
      onClick={onClick}
    >
      <div style={styles.panelTitle}>weekly digest & alerts</div>
      <div style={styles.weeklyDigestRail}>
        <div style={styles.weeklyDigestRailRow}>
          <span style={styles.weeklyDigestRailLabel}>Digest</span>
          <span style={styles.weeklyDigestRailValue}>{digestLabel}</span>
        </div>
        <div style={styles.weeklyDigestRailRow}>
          <span style={styles.weeklyDigestRailLabel}>Alerts</span>
          <span style={styles.weeklyDigestRailValue}>{channelLabel}</span>
        </div>
        <div style={styles.weeklyDigestRailRow}>
          <span style={styles.weeklyDigestRailLabel}>Cadence</span>
          <span style={styles.weeklyDigestRailValueMuted}>{cadenceLabel}</span>
        </div>
      </div>
      <div style={styles.kpiHint}>Click for more</div>
    </button>
  )
}

function WeeklyDigestAlertsPanel({
  profile,
  intelligenceUnlocked,
  notificationPrefs,
  setNotificationPrefs,
  prefsLoading,
  savingPrefs,
  prefsToast,
  onToggleArea,
  onSavePrefs,
  right = null,
}) {
  const digest = profile?.last_digest_summary ?? null
  const sentAt = profile?.last_digest_sent_at ?? null
  const sentDate = sentAt
    ? new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const scoreColor = digest?.health_score == null ? G.textFaint
    : digest.health_score >= 70 ? G.greenText
    : digest.health_score >= 40 ? G.amberText
    : G.redText

  return (
    <PanelCard title="weekly digest & alerts" right={right}>
      <div style={styles.businessHealthSectionTitle}>weekly digest</div>
      {!sentDate ? (
        <div style={styles.weeklyDigestEmpty}>Weekly digest is currently a Monday 9am UTC business recap. It does not change when alert cadence changes.</div>
      ) : (
        <>
          {digest?.health_score != null && (
            <div style={styles.weeklyDigestScoreRow}>
              <span style={{ ...styles.weeklyDigestScore, color: scoreColor }}>{digest.health_score}</span>
              <span style={styles.weeklyDigestScoreLabel}>health score</span>
              {digest.connector_used && (
                <span style={styles.weeklyDigestConnectorTag}>via {digest.connector_used}</span>
              )}
            </div>
          )}

          {digest?.summary && (
            <p style={styles.weeklyDigestSummary}>{digest.summary}</p>
          )}

          {digest?.top_risks?.length > 0 && (
            <div style={styles.businessHealthSection}>
              <div style={styles.businessHealthSectionTitle}>top risks covered</div>
              {digest.top_risks.map((r, i) => {
                const dot = r.severity === 'critical' ? G.redText : r.severity === 'high' ? G.amberText : G.textFaint
                return (
                  <div key={i} style={styles.weeklyDigestRiskRow}>
                    <span style={{ color: dot, flexShrink: 0, marginTop: 2 }}>●</span>
                    {r.title}
                  </div>
                )
              })}
            </div>
          )}

          <div style={styles.weeklyDigestMetaRow}>
            <span style={styles.weeklyDigestMetaText}>Last sent {sentDate}</span>
            {digest?.risk_count > 0 && <span style={styles.weeklyDigestMetaText}>{digest.risk_count} risk{digest.risk_count !== 1 ? 's' : ''} flagged</span>}
            {digest?.open_alerts > 0 && <span style={styles.weeklyDigestMetaText}>{digest.open_alerts} open alert{digest.open_alerts !== 1 ? 's' : ''}</span>}
          </div>
        </>
      )}

      <div style={styles.businessHealthSection}>
        <div style={styles.businessHealthSectionTitle}>alert preferences</div>
        {!intelligenceUnlocked ? (
          <div style={styles.weeklyDigestEmpty}>Alert preferences are reserved for Intelligence users.</div>
        ) : prefsLoading ? (
          <div style={styles.weeklyDigestEmpty}>Loading alert preferences…</div>
        ) : (
          <>
            <div style={styles.weeklyDigestPrefsIntro}>Choose what the system should watch between digests. These settings control alert routing and cadence, not the weekly digest send time.</div>

            <label style={styles.weeklyDigestToggleRow}>
              <input
                type="checkbox"
                checked={notificationPrefs.enabled}
                onChange={(event) => setNotificationPrefs((prev) => ({ ...prev, enabled: event.target.checked }))}
              />
              <span style={styles.weeklyDigestToggleLabel}>Enable proactive intelligence alerts</span>
            </label>

            <div style={styles.weeklyDigestPrefsGrid}>
              <label style={styles.weeklyDigestFieldShell}>
                <span style={styles.businessHealthSectionTitle}>alert cadence</span>
                <select
                  value={notificationPrefs.frequency}
                  onChange={(event) => setNotificationPrefs((prev) => ({ ...prev, frequency: event.target.value }))}
                  style={styles.weeklyDigestSelect}
                  disabled={!notificationPrefs.enabled}
                >
                  <option value="daily">Daily</option>
                  <option value="every_3_days">Every 3 days</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>

              <label style={styles.weeklyDigestFieldShell}>
                <span style={styles.businessHealthSectionTitle}>preferred delivery</span>
                <select
                  value={notificationPrefs.channels?.[0] || 'in_app'}
                  onChange={(event) => setNotificationPrefs((prev) => ({ ...prev, channels: [event.target.value] }))}
                  style={styles.weeklyDigestSelect}
                  disabled={!notificationPrefs.enabled}
                >
                  <option value="in_app">Dashboard</option>
                  <option value="email">Email</option>
                </select>
              </label>
            </div>

            <div style={styles.businessHealthSection}>
              <div style={styles.businessHealthSectionTitle}>areas to watch</div>
              <div style={styles.weeklyDigestAreaGrid}>
                {NOTIFICATION_AREAS.map((area) => (
                  <label key={area.key} style={styles.weeklyDigestAreaPill}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.areas.includes(area.key)}
                      onChange={() => onToggleArea(area.key)}
                      disabled={!notificationPrefs.enabled}
                    />
                    <span style={styles.weeklyDigestAreaLabel}>{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.weeklyDigestSaveRow}>
              {prefsToast ? <div style={styles.weeklyDigestToast}>{prefsToast}</div> : <div />}
              <button type="button" onClick={onSavePrefs} disabled={savingPrefs} style={styles.weeklyDigestSaveBtn}>
                {savingPrefs ? 'Saving…' : 'Save alert preferences'}
              </button>
            </div>
          </>
        )}
      </div>
    </PanelCard>
  )
}

const ACTION_FEEDBACK_STATUSES = [
  { value: 'done',        label: 'Done' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'failed',      label: 'Did not work' },
  { value: 'skipped',     label: 'Skipped' },
]

const STATUS_OPTIONS = [
  { value: 'done',        label: 'Done' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'failed',      label: "Didn't work" },
  { value: 'skipped',     label: 'Skipped' },
]

function DecisionLogModal({ feedback, setFeedback, onProceed, onSkip }) {
  const updateFeedback = (idx, field, value) => {
    setFeedback((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 28px 24px', maxWidth: 520, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
          Before we start
        </div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
          What happened with last session?
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Quick check-in — mark what moved. This sharpens the next diagnosis.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          {feedback.map((item, idx) => (
            <div key={idx} style={{ padding: '12px 14px', background: 'var(--rich-panel-surface, var(--surface))', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>
                {item.text}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: item.status ? 8 : 0 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFeedback(idx, 'status', item.status === opt.value ? '' : opt.value)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 500,
                      border: `1px solid ${item.status === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: item.status === opt.value ? 'var(--accent-soft)' : 'transparent',
                      color: item.status === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {item.status && item.status !== 'done' && (
                <input
                  type="text"
                  placeholder="What happened? (optional)"
                  value={item.outcome}
                  onChange={(e) => updateFeedback(idx, 'outcome', e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg, var(--surface))', color: 'var(--text)', fontSize: '0.78rem', marginTop: 4 }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onSkip}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => onProceed(feedback)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--button-text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Continue to session →
          </button>
        </div>
      </div>
    </div>
  )
}

function FounderCheckInPanel({ draft, setDraft, saving, error, reportDate, onToggleArea, onSave, priorityActions = [], right = null }) {
  const topActions = priorityActions.slice(0, 3)

  const getFeedback = (text) => draft.actionFeedback?.find(a => a.text === text) ?? { text, status: 'skipped', outcome: '' }

  const setFeedback = (text, patch) => {
    setDraft((prev) => {
      const existing = prev.actionFeedback ?? []
      const idx = existing.findIndex(a => a.text === text)
      const updated = idx >= 0
        ? existing.map((a, i) => i === idx ? { ...a, ...patch } : a)
        : [...existing, { text, status: 'skipped', outcome: '', ...patch }]
      return { ...prev, actionFeedback: updated }
    })
  }

  return (
    <PanelCard title="founder follow-up" right={right}>
      <div style={styles.weeklyDigestPrefsIntro}>
        Give SelfAudit the cleanest signal it can get: what actually changed since your {reportDate} audit. This becomes grounded context for future digests, alerts, and rankings.
      </div>

      {topActions.length > 0 && (
        <div style={styles.businessHealthSection}>
          <div style={styles.businessHealthSectionTitle}>what happened with these actions?</div>
          {topActions.map((action) => {
            const fb = getFeedback(action)
            return (
              <div key={action} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '4px', lineHeight: 1.4 }}>{action}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ACTION_FEEDBACK_STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedback(action, { status: value })}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${fb.status === value ? 'var(--accent)' : 'var(--border)'}`,
                        background: fb.status === value ? 'var(--accent)' : 'transparent',
                        color: fb.status === value ? 'var(--button-text)' : 'var(--muted)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(fb.status === 'failed' || fb.status === 'in_progress') && (
                  <input
                    type="text"
                    value={fb.outcome}
                    onChange={(e) => setFeedback(action, { outcome: e.target.value })}
                    placeholder={fb.status === 'failed' ? 'What blocked it?' : 'Where does it stand?'}
                    style={{ ...styles.checkInTextarea, marginTop: '4px', padding: '5px 8px', minHeight: 'unset', height: '32px', fontSize: '0.78rem' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={styles.weeklyDigestFieldShell}>
        <span style={styles.businessHealthSectionTitle}>what else happened since the last audit?</span>
        <textarea
          value={draft.sinceLast}
          onChange={(event) => setDraft((prev) => ({ ...prev, sinceLast: event.target.value }))}
          style={styles.checkInTextarea}
          placeholder="Short version: what actually moved in the business?"
        />
      </div>

      <div style={styles.weeklyDigestPrefsGrid}>
        <label style={styles.weeklyDigestFieldShell}>
          <span style={styles.businessHealthSectionTitle}>what improved?</span>
          <textarea
            value={draft.improved}
            onChange={(event) => setDraft((prev) => ({ ...prev, improved: event.target.value }))}
            style={styles.checkInTextarea}
            placeholder="What got better, even slightly?"
          />
        </label>

        <label style={styles.weeklyDigestFieldShell}>
          <span style={styles.businessHealthSectionTitle}>what is still blocked?</span>
          <textarea
            value={draft.blocked}
            onChange={(event) => setDraft((prev) => ({ ...prev, blocked: event.target.value }))}
            style={styles.checkInTextarea}
            placeholder="What is still not moving?"
          />
        </label>
      </div>

      <div style={styles.businessHealthSection}>
        <div style={styles.businessHealthSectionTitle}>what changed most?</div>
        <div style={styles.weeklyDigestAreaGrid}>
          {NOTIFICATION_AREAS.map((area) => (
            <label key={area.key} style={styles.weeklyDigestAreaPill}>
              <input
                type="checkbox"
                checked={draft.changedAreas.includes(area.key)}
                onChange={() => onToggleArea(area.key)}
              />
              <span style={styles.weeklyDigestAreaLabel}>{area.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={styles.weeklyDigestSaveRow}>
        {error ? <div style={styles.checkInError}>{error}</div> : <div />}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !draft.sinceLast.trim()}
          style={styles.weeklyDigestSaveBtn}
        >
          {saving ? 'Saving…' : 'Save founder update'}
        </button>
      </div>
    </PanelCard>
  )
}

function AiOpportunitiesDetailPanel({ user, userInfo, reports, items, tier, initialShared = false, right = null }) {
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(initialShared)
  const [error, setError] = useState('')
  const topItem = items[0] || null
  const sourceReport = topItem ? reports.find((report) => report.id === topItem.reportId) : null
  const sourcePayload = sourceReport ? parseReportContent(sourceReport) : null
  const isIntelligence = tier === 'intelligence'
  const subtitle = items.length === 0
    ? 'No opportunities extracted yet'
    : isIntelligence
      ? `${items.length} ranked opportunities compounding across your audits`
      : `${items.length} wins found in this audit`

  useEffect(() => {
    setShared(Boolean(initialShared))
  }, [initialShared])

  const handleShare = async () => {
    if (!user?.id || !sourceReport || !sourcePayload || sharing || shared) return
    setSharing(true)
    setError('')
    try {
      const shareContext = [
        userInfo?.context,
        topItem?.title ? `Top opportunity: ${topItem.title}` : '',
      ].filter(Boolean).join(' · ')

      const _shareSb = await initSupabase()
      const { data: { session: _shareSess } } = await _shareSb.auth.getSession()
      const _shareToken = _shareSess?.access_token || ''

      const response = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(_shareToken ? { Authorization: `Bearer ${_shareToken}` } : {}) },
        body: JSON.stringify({
          userInfo: {
            ...userInfo,
            context: shareContext || userInfo?.context || sourceReport.title || 'Audit review',
            industry: sourceReport.industry || userInfo?.industry || '',
            domain: sourceReport.domain || userInfo?.domain || '',
          },
          report: sourcePayload,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Could not share this report right now.')

      try {
        const sb = await initSupabase()
        await sb
          .from('profiles')
          .update({
            shared_with_vnklo: true,
            shared_report_id: sourceReport.id,
          })
          .eq('id', user.id)
      } catch (updateError) {
        console.warn('[dashboard] shared_with_vnklo update failed:', updateError?.message ?? updateError)
      }

      setShared(true)
    } catch (shareError) {
      setError(shareError?.message || 'Could not share this report right now.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <PanelCard title="AI opportunities" right={right}>
      <div style={styles.openIssuesSummaryRow}>
        <div style={styles.openIssuesSummaryValue}>{items.length}</div>
        <div style={styles.openIssuesSummaryText}>{subtitle}</div>
      </div>

      {items.length === 0 ? (
        <EmptyPanel message="Run a diagnostic report to surface concrete AI opportunities." />
      ) : (
        <>
          <div style={styles.aiList}>
            {items.map((item, index) => (
              <div key={item.id} style={styles.aiOpportunityRow}>
                <div style={{ ...styles.aiOpportunityBar, background: item.signal.tone === 'green' ? G.green : item.signal.tone === 'amber' ? G.amber : G.blue }} />
                <div style={styles.aiOpportunityBody}>
                  <div style={styles.aiOpportunityTop}>
                    <div style={styles.aiOpportunityTitle}>{item.title}</div>
                    <span style={{
                      ...styles.aiSignalPill,
                      ...(item.signal.tone === 'green'
                        ? styles.aiSignalPillGreen
                        : item.signal.tone === 'amber'
                          ? styles.aiSignalPillAmber
                          : styles.aiSignalPillBlue),
                    }}
                    >
                      {item.signal.label}
                    </span>
                  </div>
                  <div style={styles.aiOpportunityMeta}>
                    {item.summary}
                    {item.intelligenceMeta ? ` · ${item.intelligenceMeta}` : ''}
                  </div>
                  <div style={styles.aiOpportunityFoot}>
                    <span>{item.reportLabel}</span>
                    {index === 0 && isIntelligence && item.frequency > 1 && <span>Highest signal</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <div style={styles.aiErrorText}>{error}</div>}
        </>
      )}
    </PanelCard>
  )
}

function formatAuditUpdateLabel(updatedAt) {
  if (!updatedAt) return 'latest'
  return new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function looksAssumed(value) {
  if (Array.isArray(value)) return value.some((item) => String(item || '').includes('[assumption]'))
  return String(value || '').includes('[assumption]')
}

function displayBusinessStateValue(value, emptySeparator = ', ') {
  if (Array.isArray(value)) return value.filter(Boolean).join(emptySeparator)
  return typeof value === 'string' ? value.trim() : ''
}

function parseBusinessStateList(value, mode) {
  if (!value.trim()) return []
  if (mode === 'funnel') {
    return value
      .split(/\n|→|->/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (mode === 'blockers') {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function BusinessStateValue({ value, emptyLabel = 'Not discussed yet', separator = ', ' }) {
  const rendered = displayBusinessStateValue(value, separator)
  const assumed = looksAssumed(value)
  if (!rendered) {
    return <div style={styles.businessStateEmpty}>{emptyLabel}</div>
  }
  return <div style={{ ...styles.businessStateValue, ...(assumed ? styles.businessStateAssumed : {}) }}>{rendered}</div>
}

function BusinessStateCard({ user, businessState, loading }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({
    core_offer: '',
    revenue_streams: '',
    operational_blockers: '',
    target_customer: '',
    funnel_stages: '',
  })
  const [savedState, setSavedState] = useState(businessState)

  useEffect(() => {
    setSavedState(businessState)
  }, [businessState])

  useEffect(() => {
    if (!editing) {
      setDraft({
        core_offer: savedState?.core_offer || '',
        revenue_streams: displayBusinessStateValue(savedState?.revenue_streams, ', '),
        operational_blockers: displayBusinessStateValue(savedState?.operational_blockers, '; '),
        target_customer: savedState?.target_customer || '',
        funnel_stages: displayBusinessStateValue(savedState?.funnel_stages, ' → '),
      })
    }
  }, [editing, savedState])

  const subtitle = savedState?._autofilled_from_memory
    ? `Auto-filled from your latest audit on ${formatAuditUpdateLabel(savedState?.updated_at)}`
    : `Updated after ${formatAuditUpdateLabel(savedState?.updated_at)} audit`

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      const sb = await initSupabase()
      const payload = {
        user_id: user.id,
        core_offer: draft.core_offer.trim(),
        revenue_streams: parseBusinessStateList(draft.revenue_streams, 'streams'),
        operational_blockers: parseBusinessStateList(draft.operational_blockers, 'blockers'),
        target_customer: draft.target_customer.trim(),
        funnel_stages: parseBusinessStateList(draft.funnel_stages, 'funnel'),
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await sb
        .from('business_state')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single()

      if (error) throw error
      setSavedState(data || payload)
      setEditing(false)
    } catch (error) {
      console.error('[dashboard] business_state save failed:', error?.message ?? error)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setEditing(false)
    setDraft({
      core_offer: savedState?.core_offer || '',
      revenue_streams: displayBusinessStateValue(savedState?.revenue_streams, ', '),
      operational_blockers: displayBusinessStateValue(savedState?.operational_blockers, '; '),
      target_customer: savedState?.target_customer || '',
      funnel_stages: displayBusinessStateValue(savedState?.funnel_stages, ' → '),
    })
  }

  return (
    <div style={styles.businessStateCard}>
      <div style={styles.panelHeader}>
        <div>
          <div style={styles.businessStateTitle}>What we know</div>
          <div style={styles.businessStateSub}>{subtitle}</div>
        </div>
        {editing ? (
          <div style={styles.businessStateActions}>
            <button type="button" style={styles.businessStateGhostBtn} onClick={cancel} disabled={saving}>Cancel</button>
            <button type="button" style={styles.businessStateSaveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button type="button" style={styles.businessStateEditBtn} onClick={() => setEditing(true)}>
            edit
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.emptyPanel}>Loading business context…</div>
      ) : editing ? (
        <div style={styles.businessStateGrid}>
          <BusinessStateEditor label="Core offer" value={draft.core_offer} onChange={(value) => setDraft((prev) => ({ ...prev, core_offer: value }))} />
          <BusinessStateEditor label="Revenue streams" value={draft.revenue_streams} onChange={(value) => setDraft((prev) => ({ ...prev, revenue_streams: value }))} />
          <BusinessStateEditor label="Operational blockers" value={draft.operational_blockers} onChange={(value) => setDraft((prev) => ({ ...prev, operational_blockers: value }))} />
          <BusinessStateEditor label="Target customer" value={draft.target_customer} onChange={(value) => setDraft((prev) => ({ ...prev, target_customer: value }))} />
          <BusinessStateEditor label="Funnel stages" value={draft.funnel_stages} onChange={(value) => setDraft((prev) => ({ ...prev, funnel_stages: value }))} />
        </div>
      ) : (
        <div style={styles.businessStateGrid}>
          <div>
            <div style={styles.businessStateLabel}>Core offer</div>
            <BusinessStateValue value={savedState?.core_offer} />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Revenue streams</div>
            <BusinessStateValue value={savedState?.revenue_streams} separator=", " />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Operational blockers</div>
            <BusinessStateValue value={savedState?.operational_blockers} separator="; " />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Target customer</div>
            <BusinessStateValue value={savedState?.target_customer} />
          </div>
          <div>
            <div style={styles.businessStateLabel}>Funnel stages</div>
            <BusinessStateValue value={savedState?.funnel_stages} separator=" → " />
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessStateEditor({ label, value, onChange }) {
  return (
    <label style={styles.businessStateEditorShell}>
      <div style={styles.businessStateLabel}>{label}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        style={styles.businessStateTextarea}
      />
    </label>
  )
}

function PanelCard({ title, right, children, style }) {
  return (
    <div style={{ ...styles.panelCard, ...style }}>
      <div style={styles.panelHeader}>
        <div style={styles.panelTitle}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

function EmptyPanel({ message }) {
  return <div style={styles.emptyPanel}>{message}</div>
}

function TopButtons({ onDiagnose, onGoal }) {
  return (
    <div style={styles.topbarActions}>
      <button type="button" style={styles.ghostButton} onClick={onDiagnose}>
        diagnose a problem
      </button>
      <button type="button" style={styles.primaryButton} onClick={onGoal}>
        map a goal
      </button>
    </div>
  )
}

function ConnectorsSection({ user }) {
  const [connectorList, setConnectorList] = useState([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState('')
  const [toast, setToast] = useState('')
  const [preview, setPreview] = useState(null)

  const getSessionToken = async () => {
    const sb = await initSupabase()
    const { data: { session } } = await sb.auth.getSession()
    return session?.access_token || ''
  }

  const loadConnectors = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const token = await getSessionToken()
      if (!token) return
      const response = await fetch('/api/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json()
      setConnectorList(Array.isArray(data?.connectors) ? data.connectors : [])
    } catch {
      setConnectorList([])
    } finally {
      setLoading(false)
    }
  }

  const loadHubspotPreview = async () => {
    if (!user?.id) return
    try {
      const token = await getSessionToken()
      if (!token) return
      const response = await fetch('/api/connect/composio/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, provider: 'hubspot' }),
      })
      const data = await response.json()
      if (data?.source === 'hubspot') setPreview(data)
      else setPreview(null)
    } catch {
      setPreview(null)
    }
  }

  useEffect(() => {
    loadConnectors()
  }, [user?.id])

  useEffect(() => {
    const hash = window.location.hash || ''
    const [, rawQuery = ''] = hash.split('?')
    if (!rawQuery) return

    const params = new URLSearchParams(rawQuery)
    const connected = params.get('connected')
    const error = params.get('error')
    if (!connected && !error) return

    setToast(connected ? `${connected} connected.` : `Could not connect ${error}.`)
    history.replaceState(history.state, '', '/#connectors')
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [])

  const hubspot = connectorList.find((c) => c.id === 'hubspot')
  useEffect(() => {
    if (hubspot?.connected) {
      loadHubspotPreview()
      return
    }
    setPreview(null)
  }, [hubspot?.connected, hubspot?.last_synced_at, user?.id])

  const disconnect = async (provider) => {
    if (!user?.id) return
    setDisconnecting(provider)
    try {
      const token = await getSessionToken()
      if (!token) return
      await fetch('/api/connect/composio/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider }),
      })
      if (provider === 'hubspot') setPreview(null)
      await loadConnectors()
    } finally {
      setDisconnecting('')
    }
  }

  return (
    <PageShell title="Connectors" sub="Connect live systems so audits can reason from verified data, not just self-reported context.">
      {toast && <div style={styles.connectorsToast}>{toast}</div>}
      <div style={styles.connectorsGrid}>
        {connectorList.map((connector) => {
          const available = connector.status === 'available'
          const comingSoon = connector.status === 'coming_soon'
          const connected = !!connector.connected
          const busy = disconnecting === connector.id

          return (
            <div key={connector.id} style={{ ...styles.connectorCard, opacity: comingSoon ? 0.68 : 1 }}>
              <div style={styles.connectorCardTop}>
                <div>
                  <div style={styles.connectorName}>{connector.name}</div>
                  <div style={styles.connectorCategory}>{connector.category}</div>
                </div>
                <span
                  style={{
                    ...styles.connectorBadge,
                    ...(connected
                      ? styles.connectorBadgeConnected
                      : available
                        ? styles.connectorBadgeAdd
                        : styles.connectorBadgeSoon),
                  }}
                >
                  {connected ? 'Connected' : available ? 'Add' : 'Coming soon'}
                </span>
              </div>

              <div style={styles.connectorBodyText}>
                {connector.description || ''}
              </div>

              {available ? (
                connected ? (
                  <button type="button" style={styles.connectorDisconnectBtn} onClick={() => disconnect(connector.id)} disabled={busy}>
                    {busy ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    type="button"
                    style={styles.connectorConnectBtn}
                    onClick={async () => {
                      const token = await getSessionToken()
                      if (!token) return
                      const response = await fetch('/api/connect/composio/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ userId: user.id, provider: connector.id }),
                      })
                      const data = await response.json().catch(() => ({}))
                      if (response.ok && data?.url) { window.location.href = data.url; return }
                      setToast(data?.error || `Could not connect ${connector.name}.`)
                    }}
                  >
                    Connect {connector.name}
                  </button>
                )
              ) : (
                <div style={styles.connectorSoonText}>Available in a later release.</div>
              )}

              {connector.id === 'stripe' && connected && (
                <div style={styles.connectorPreview}>
                  <div style={styles.connectorPreviewMeta}>
                    Connected · {connector.account_name ? `${connector.account_name} · ` : ''}Run a health check to pull live data.
                  </div>
                </div>
              )}

              {connector.id === 'hubspot' && connected && preview?.source === 'hubspot' && (
                <div style={styles.connectorPreview}>
                  <div style={styles.connectorPreviewMeta}>
                    Last synced: {formatRelativeTime(connector.last_synced_at || preview.fetched_at)}
                  </div>
                  {preview.pipeline && (
                    <div style={styles.connectorPreviewStat}>
                      Open deals: {preview.pipeline.total_open_deals ?? 0}
                      {typeof preview.pipeline.total_open_value === 'number' ? ` · $${preview.pipeline.total_open_value.toLocaleString()}` : ''}
                    </div>
                  )}
                  {!!preview.signals?.length && (
                    <div style={styles.connectorSignals}>
                      {preview.signals.slice(0, 2).map((signal) => (
                        <div key={signal} style={styles.connectorSignalLine}>{signal}</div>
                      ))}
                    </div>
                  )}
                  <button type="button" style={styles.connectorSyncBtn} onClick={loadHubspotPreview}>
                    Sync now
                  </button>
                </div>
              )}

              {connector.required_tier && (
                <div style={styles.connectorTierLabel}>
                  {connector.required_tier === 'intelligence' ? 'Intelligence' : connector.required_tier}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {loading && <div style={styles.connectorsLoading}>Checking connector status…</div>}
    </PageShell>
  )
}

const FIX_PRIORITY_LABEL = {
  immediate:   { label: 'Immediate', color: '#A32D2D' },
  this_week:   { label: 'This week', color: '#BA7517' },
  this_month:  { label: 'This month', color: '#6B6860' },
  monitor:     { label: 'Monitor',    color: '#6B6860' },
}

const CONFIDENCE_COLOR = { high: G.green, medium: G.amber, low: G.red }

function AgentSection({ user }) {
  const [query, setQuery]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [history, setHistory]         = useState([])
  const textareaRef                   = useRef(null)

  const SUGGESTED = [
    'Why is revenue not growing?',
    'What is blocking my pipeline?',
    'Should I hire a salesperson now?',
    'What is my biggest risk right now?',
    'Where am I losing customers?',
  ]

  async function submit(q) {
    const trimmed = (q || query).trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const sb    = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || null

      const res = await fetch('/api/agent-query', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query:               trimmed,
          userId:              user?.id,
          conversationHistory: history.slice(-6),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Agent query failed')

      setResult(data)
      setHistory((prev) => [
        ...prev,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: data.answer },
      ])
      setQuery('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const fp = result?.fix_priority ? (FIX_PRIORITY_LABEL[result.fix_priority] || null) : null
  const isConversational = result?.intent === 'conversational'

  return (
    <PageShell
      title="Ask SelfAudit"
      sub="Your operational strategist. Investigates your live business data before answering."
    >
      {/* Suggested prompts (only when no result yet) */}
      {!result && !loading && (
        <div style={agent.suggestedWrap}>
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              style={agent.suggestedChip}
              onClick={() => { setQuery(s); submit(s) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={agent.inputWrap}>
        <textarea
          ref={textareaRef}
          style={agent.textarea}
          placeholder="Ask anything about your business…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          type="button"
          style={{ ...agent.sendBtn, opacity: loading || !query.trim() ? 0.45 : 1 }}
          onClick={() => submit()}
          disabled={loading || !query.trim()}
        >
          {loading ? '…' : '→'}
        </button>
      </div>

      {error && <div style={agent.errorBox}>{error}</div>}

      {loading && (
        <div style={agent.thinkingBox}>
          <span style={agent.thinkingDot} />
          SelfAudit is planning the investigation…
        </div>
      )}

      {/* Result card */}
      {result && (
        <div style={agent.resultCard}>
          {/* Header row — hidden for conversational responses */}
          {!isConversational && (
            <div style={agent.resultHeader}>
              <span style={agent.intentTag}>{(result.intent || '').replace(/_/g, ' ')}</span>
              {fp && (
                <span style={{ ...agent.priorityTag, color: fp.color, borderColor: fp.color }}>
                  {fp.label}
                </span>
              )}
              {result.confidence && (
                <span style={{ ...agent.confidenceTag, color: CONFIDENCE_COLOR[result.confidence] || G.textMuted }}>
                  {result.confidence} confidence
                </span>
              )}
              {result.severity_score != null && (
                <span style={agent.severityTag}>severity {result.severity_score}/10</span>
              )}
            </div>
          )}

          {/* Answer */}
          <p style={agent.answerText}>{result.answer}</p>

          {/* Investigation plan — what TSA decided to check and why */}
          {!isConversational && result.investigation_plan?.hypothesis && (
            <div style={agent.hypothesisBlock}>
              <div style={agent.hypothesisLabel}>Hypothesis going in</div>
              <p style={agent.hypothesisText}>{result.investigation_plan.hypothesis}</p>
              {result.investigation_plan.focus_areas?.length > 0 && (
                <div style={agent.focusAreaRow}>
                  {result.investigation_plan.focus_areas.map((f) => (
                    <span key={f} style={agent.focusChip}>{f}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Root cause */}
          {result.root_cause && (
            <div style={agent.subSection}>
              <div style={agent.subLabel}>Root cause</div>
              <p style={agent.subText}>{result.root_cause}</p>
            </div>
          )}

          {/* Financial impact */}
          {result.financial_impact && (
            <div style={agent.subSection}>
              <div style={agent.subLabel}>Financial impact</div>
              <p style={agent.subText}>{result.financial_impact}</p>
            </div>
          )}

          {/* Execution plan */}
          {result.execution_plan?.length > 0 && (
            <div style={agent.subSection}>
              <div style={agent.subLabel}>Execution plan</div>
              <ol style={agent.planList}>
                {result.execution_plan.map((step, i) => (
                  <li key={i} style={agent.planItem}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Evidence */}
          {result.evidence?.length > 0 && (
            <div style={agent.subSection}>
              <div style={agent.subLabel}>Evidence used</div>
              <ul style={agent.bulletList}>
                {result.evidence.map((e, i) => <li key={i} style={agent.bulletItem}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Risks + Opportunities row */}
          {(result.risks_found?.length > 0 || result.opportunities_found?.length > 0) && (
            <div style={agent.roRow}>
              {result.risks_found?.length > 0 && (
                <div style={agent.roBox}>
                  <div style={{ ...agent.subLabel, color: G.red }}>Risks identified</div>
                  <ul style={agent.bulletList}>
                    {result.risks_found.map((r, i) => <li key={i} style={agent.bulletItem}>{r}</li>)}
                  </ul>
                </div>
              )}
              {result.opportunities_found?.length > 0 && (
                <div style={agent.roBox}>
                  <div style={{ ...agent.subLabel, color: G.green }}>Opportunities</div>
                  <ul style={agent.bulletList}>
                    {result.opportunities_found.map((o, i) => <li key={i} style={agent.bulletItem}>{o}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Follow-up question */}
          {result.follow_up_question && (
            <button
              type="button"
              style={agent.followUpBtn}
              onClick={() => { setQuery(result.follow_up_question); submit(result.follow_up_question) }}
            >
              ↪ {result.follow_up_question}
            </button>
          )}

          {/* Missing data / assumptions */}
          {(result.missing_data?.length > 0 || result.assumptions?.length > 0) && (
            <details style={agent.detailsBlock}>
              <summary style={agent.detailsSummary}>Assumptions &amp; missing data</summary>
              {result.assumptions?.length > 0 && (
                <ul style={agent.bulletList}>
                  {result.assumptions.map((a, i) => <li key={i} style={agent.bulletItem}>{a}</li>)}
                </ul>
              )}
              {result.missing_data?.length > 0 && (
                <ul style={{ ...agent.bulletList, color: G.amber }}>
                  {result.missing_data.map((m, i) => <li key={i} style={agent.bulletItem}>{m}</li>)}
                </ul>
              )}
            </details>
          )}

          {/* Data sources */}
          {result.data_sources_used?.length > 0 && (
            <div style={agent.sourcesRow}>
              {result.data_sources_used.map((s) => (
                <span key={s} style={agent.sourceChip}>{s.replace(/_/g, ' ')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ask another */}
      {result && (
        <button type="button" style={agent.resetBtn} onClick={() => { setResult(null); setError(null) }}>
          Ask another question
        </button>
      )}
    </PageShell>
  )
}

const agent = {
  suggestedWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  suggestedChip: {
    background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 20,
    padding: '6px 14px', fontSize: 13, color: G.textSecondary, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inputWrap: { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'stretch' },
  textarea: {
    flex: 1, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 999,
    color: G.text, fontSize: 14, padding: '18px 20px', resize: 'none',
    fontFamily: 'inherit', lineHeight: 1.5, outline: 'none',
    minHeight: 62,
    boxSizing: 'border-box',
  },
  sendBtn: {
    background: G.text, color: G.black, border: 'none', borderRadius: 18,
    width: 62, height: 62, fontSize: 22, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    background: G.redBg, border: `1px solid ${G.red}`, color: G.redText,
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12,
  },
  thinkingBox: {
    display: 'flex', alignItems: 'center', gap: 8, color: G.textMuted,
    fontSize: 13, padding: '12px 0',
  },
  thinkingDot: {
    width: 8, height: 8, borderRadius: '50%', background: G.accent,
    display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite',
  },
  resultCard: {
    background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12,
    padding: 24, marginBottom: 16,
  },
  resultHeader: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' },
  intentTag: {
    background: G.surface2, color: G.textSecondary, fontSize: 11,
    padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  priorityTag: {
    fontSize: 11, padding: '3px 10px', borderRadius: 20,
    border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  confidenceTag: { fontSize: 12, fontWeight: 500 },
  severityTag: { fontSize: 12, color: G.textMuted },
  answerText: { fontSize: 15, color: G.text, lineHeight: 1.7, margin: '0 0 20px' },
  hypothesisBlock: { background: G.surface2, borderRadius: 8, padding: '12px 16px', marginBottom: 20 },
  hypothesisLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: G.textMuted, fontWeight: 600, marginBottom: 6 },
  hypothesisText: { fontSize: 13, color: G.textSecondary, lineHeight: 1.6, margin: '0 0 8px', fontStyle: 'italic' },
  focusAreaRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  focusChip: { fontSize: 11, color: G.textMuted, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12, padding: '2px 10px' },
  subSection: { marginBottom: 16 },
  subLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: G.textMuted, marginBottom: 6, fontWeight: 600 },
  subText: { fontSize: 14, color: G.textSecondary, lineHeight: 1.6, margin: 0 },
  planList: { paddingLeft: 20, margin: 0 },
  planItem: { fontSize: 14, color: G.textSecondary, lineHeight: 1.7, marginBottom: 4 },
  bulletList: { paddingLeft: 18, margin: 0 },
  bulletItem: { fontSize: 13, color: G.textSecondary, lineHeight: 1.6, marginBottom: 2 },
  roRow: { display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' },
  roBox: { flex: 1, minWidth: 180 },
  followUpBtn: {
    display: 'block', width: '100%', textAlign: 'left', background: G.surface2,
    border: `1px solid ${G.border}`, borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: G.textSecondary, cursor: 'pointer', marginBottom: 16,
  },
  detailsBlock: { marginBottom: 12 },
  detailsSummary: { fontSize: 12, color: G.textMuted, cursor: 'pointer', marginBottom: 6 },
  sourcesRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  sourceChip: {
    background: G.surface2, color: G.textFaint, fontSize: 11,
    padding: '2px 8px', borderRadius: 10,
  },
  resetBtn: {
    background: 'transparent', border: `1px solid ${G.border}`, borderRadius: 8,
    padding: '8px 18px', fontSize: 13, color: G.textSecondary, cursor: 'pointer',
  },
}

function AccountSection({ user, profile, onProfileChange, onSignOut, dataOnly = false }) {
  const email = user?.email || ''
  const [nameVal, setNameVal] = useState('')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConf, setDeleteConf] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [exportError, setExportError] = useState('')
  const nameRef = useRef(null)
  const phoneRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setNameVal(profile.name || user?.user_metadata?.name || '')
      setPhoneVal(profile.phone || '')
    }
  }, [profile, user])

  useEffect(() => {
    if (nameEditing) nameRef.current?.focus()
  }, [nameEditing])

  useEffect(() => {
    if (phoneEditing) phoneRef.current?.focus()
  }, [phoneEditing])

  async function saveName() {
    const trimmed = nameVal.trim()
    if (!trimmed || trimmed === (profile?.name || user?.user_metadata?.name || '')) {
      setNameEditing(false)
      return
    }
    setNameSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ name: trimmed }).eq('id', user.id)
      onProfileChange({ name: trimmed })
    } catch (error) {
      console.error(error)
    } finally {
      setNameSaving(false)
      setNameEditing(false)
    }
  }

  async function savePhone() {
    const trimmed = phoneVal.trim()
    if (trimmed === (profile?.phone || '')) {
      setPhoneEditing(false)
      return
    }
    setPhoneSaving(true)
    try {
      const sb = await initSupabase()
      await sb.from('profiles').update({ phone: trimmed }).eq('id', user.id)
      onProfileChange({ phone: trimmed })
    } catch (error) {
      console.error(error)
    } finally {
      setPhoneSaving(false)
      setPhoneEditing(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConf.trim().toLowerCase() !== 'delete') {
      setDeleteError('Type "delete" to confirm.')
      return
    }
    setDeleting(true)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || 'Could not delete account right now.')
      try {
        await sb.auth.signOut()
      } catch (signOutError) {
        console.warn('[dashboard] sign-out after delete failed:', signOutError?.message || signOutError)
      }
      window.location.href = '/'
    } catch (error) {
      console.error(error)
      setDeleteError(error?.message || 'Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  async function handleExportData() {
    setExportingData(true)
    setExportError('')
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const response = await fetch('/api/export-account-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || 'Could not export your data right now.')

      const safePrefix = String(email || 'selfaudit-user')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'selfaudit-user'
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safePrefix}-account-data.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setExportError(error?.message || 'Could not export your data right now.')
    } finally {
      setExportingData(false)
    }
  }

  if (dataOnly) {
    return (
      <PageShell title="Your Data" sub="Export or delete your account data.">
        <div style={account.dataCard}>
          <div style={account.dataCardTitle}>Your data</div>
          <div style={account.dataCardText}>
            Download a JSON export of your saved reports, chats, business context, alerts, and related account data. Connector access tokens are not included in the export.
          </div>
          <div style={account.dataCardMeta}>
            SelfAudit currently keeps your account data until you delete the account. Deletion is permanent.
          </div>
          {exportError ? <div style={account.dataCardError}>{exportError}</div> : null}
          <button type="button" style={account.dataExportBtn} onClick={handleExportData} disabled={exportingData}>
            {exportingData ? 'Preparing export…' : 'Export my data'}
          </button>
        </div>
        <div style={account.legalRow}>
          <span style={account.legalLabel}>Legal</span>
          <div style={account.legalLinks}>
            <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={account.legalLink}>Privacy Policy</a>
            <a href={TERMS_HASH} style={account.legalLink}>Terms of Service</a>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Profile" sub="Manage your account details.">
      <div style={account.card}>
        <AccountRow
          label="Name"
          editing={nameEditing}
          saving={nameSaving}
          value={nameVal}
          onEdit={() => setNameEditing(true)}
          placeholder="—"
          inputRef={nameRef}
          onChange={setNameVal}
          onBlur={saveName}
          onEscape={() => setNameEditing(false)}
          onEnter={saveName}
        />
        <div style={account.divider} />
        <div style={account.row}>
          <div style={account.label}>Email</div>
          <div style={{ ...account.value, color: G.textSecondary }}>{email}</div>
        </div>
        <div style={account.divider} />
        <AccountRow
          label="Phone number"
          editing={phoneEditing}
          saving={phoneSaving}
          value={phoneVal}
          onEdit={() => setPhoneEditing(true)}
          placeholder="Add phone number"
          inputRef={phoneRef}
          onChange={setPhoneVal}
          onBlur={savePhone}
          onEscape={() => setPhoneEditing(false)}
          onEnter={savePhone}
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <span style={{ fontSize: 12, color: G.textFaint }}>Need to leave? </span>
        <button
          type="button"
          style={account.deleteLink}
          onClick={() => {
            setShowDelete(true)
            setDeleteConf('')
            setDeleteError('')
          }}
        >
          Delete account
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button type="button" style={account.signOutBtn} onClick={onSignOut}>
          Sign out
        </button>
      </div>

      <div style={account.dataCard}>
        <div style={account.dataCardTitle}>Your data</div>
        <div style={account.dataCardText}>
          Download a JSON export of your saved reports, chats, business context, alerts, and related account data. Connector access tokens are not included in the export.
        </div>
        <div style={account.dataCardMeta}>
          SelfAudit currently keeps your account data until you delete the account. Deletion is permanent.
        </div>
        {exportError ? <div style={account.dataCardError}>{exportError}</div> : null}
        <button type="button" style={account.dataExportBtn} onClick={handleExportData} disabled={exportingData}>
          {exportingData ? 'Preparing export…' : 'Export my data'}
        </button>
      </div>

      <div style={account.legalRow}>
        <span style={account.legalLabel}>Legal</span>
        <div style={account.legalLinks}>
          <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" style={account.legalLink}>
            Privacy Policy
          </a>
          <a href={TERMS_HASH} style={account.legalLink}>
            Terms of Service
          </a>
        </div>
      </div>

      {showDelete && (
        <div style={account.overlay} onClick={() => setShowDelete(false)}>
          <div style={account.modal} onClick={(event) => event.stopPropagation()}>
            <div style={account.modalTitle}>Delete your account?</div>
            <p style={account.modalBody}>This permanently deletes your account and all audit data. This cannot be undone.</p>
            <p style={account.modalBody}>Type <strong>delete</strong> to confirm.</p>
            <input
              value={deleteConf}
              onChange={(event) => {
                setDeleteConf(event.target.value)
                setDeleteError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleDeleteAccount()
              }}
              placeholder="delete"
              style={account.input}
              autoFocus
            />
            {deleteError && <p style={{ fontSize: 12, color: G.redText, marginTop: 10 }}>{deleteError}</p>}
            <div style={account.modalActions}>
              <button type="button" style={account.modalCancel} onClick={() => setShowDelete(false)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" style={account.modalDelete} onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

function AccountRow({ label, editing, saving, value, onEdit, placeholder, inputRef, onChange, onBlur, onEscape, onEnter }) {
  return (
    <div style={account.row}>
      <div style={account.label}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onEnter()
              if (event.key === 'Escape') onEscape()
            }}
            disabled={saving}
            placeholder={placeholder}
            style={account.input}
          />
          {saving && <span style={{ fontSize: 12, color: G.textFaint }}>Saving…</span>}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={account.value}>{value || <span style={{ color: G.textFaint }}>{placeholder}</span>}</div>
          <button type="button" style={account.editButton} onClick={onEdit}>
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

function AuditStartButtons({ onDiagnose, onGoal }) {
  return <TopButtons onDiagnose={onDiagnose} onGoal={onGoal} />
}

const GOAL_CATEGORIES = ['Revenue', 'Growth', 'Operations', 'Team', 'Exit']

function GoalCaptureModal({ onClose, onStart }) {
  const [goal, setGoal] = useState('')
  const [category, setCategory] = useState('')
  const [timeline, setTimeline] = useState('')
  const [baseline, setBaseline] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!goal.trim()) {
      setError('Tell us your goal first.')
      return
    }
    if (!timeline.trim()) {
      setError('Add a timeline.')
      return
    }
    onStart({
      goal: goal.trim(),
      goalCategory: category,
      goalTimeline: timeline.trim(),
      goalBaseline: baseline.trim(),
    })
  }

  return (
    <div style={gm.overlay} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div style={gm.modal}>
        <button type="button" style={gm.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div style={gm.eyebrow}>Goal mode</div>
        <h2 style={gm.title}>Map a goal</h2>
        <p style={gm.sub}>Define where you want to get to and we&apos;ll identify the gap between here and there.</p>

        <div style={gm.field}>
          <label style={gm.label}>What&apos;s your goal? <span style={{ color: G.accentText }}>*</span></label>
          <input
            style={gm.input}
            value={goal}
            onChange={(event) => { setGoal(event.target.value); setError('') }}
            placeholder='e.g. "Double revenue to $1M ARR", "Reduce churn below 3%"'
            autoFocus
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Category</label>
          <div style={gm.categoryRow}>
            {GOAL_CATEGORIES.map((item) => (
              <button
                type="button"
                key={item}
                style={{ ...gm.categoryPill, ...(category === item ? gm.categoryActive : {}) }}
                onClick={() => setCategory((prev) => prev === item ? '' : item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Timeline <span style={{ color: G.accentText }}>*</span></label>
          <input
            style={gm.input}
            value={timeline}
            onChange={(event) => { setTimeline(event.target.value); setError('') }}
            placeholder='e.g. "by end of Q3 2026", "within 6 months"'
          />
        </div>

        <div style={gm.field}>
          <label style={gm.label}>Where are you now?</label>
          <input
            style={gm.input}
            value={baseline}
            onChange={(event) => setBaseline(event.target.value)}
            placeholder='e.g. "$420K ARR, growing 5% MoM, 8% churn"'
          />
          <p style={gm.hint}>Optional — the more specific, the sharper the gap analysis.</p>
        </div>

        {error && <p style={gm.error}>{error}</p>}

        <button type="button" style={gm.startBtn} onClick={submit}>
          Start gap audit
        </button>
      </div>
    </div>
  )
}

function AuditScopeSetupModal({ user, onClose, onSaved }) {
  const [industry, setIndustry] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!industry) {
      setError('Pick your industry first.')
      return
    }

    setSaving(true)
    try {
      const sb = await initSupabase()
      const { error: updateError } = await sb
        .from('profiles')
        .update({ industry })
        .eq('id', user.id)

      if (updateError) throw updateError
      onSaved({ industry })
    } catch (updateError) {
      console.error('[dashboard] scope setup failed:', updateError?.message ?? updateError)
      setError('Could not save your audit setup. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={gm.overlay} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div style={gm.modal}>
        <button type="button" style={gm.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div style={gm.eyebrow}>Audit setup</div>
        <h2 style={gm.title}>Before we start</h2>
        <p style={gm.sub}>Pick your industry to get started.</p>

        <div style={gm.field}>
          <label style={gm.label}>Industry <span style={{ color: G.accentText }}>*</span></label>
          <div style={gm.categoryRow}>
            {BUSINESS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option}
                style={{ ...gm.categoryPill, ...(industry === option ? gm.categoryActive : {}) }}
                onClick={() => {
                  setIndustry(option)
                  setError('')
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={gm.error}>{error}</p>}

        <button type="button" style={gm.startBtn} onClick={submit} disabled={saving}>
          {saving ? 'Saving…' : 'Start audit'}
        </button>
      </div>
    </div>
  )
}

function OpenIssuesTracker({ report, domains, userId, issueState, onIssueStateChange, limit = 3 }) {
  const [statuses, setStatuses] = useState(() => {
    const initial = {}
    const persisted = getOpenIssueStatuses(issueState, report?.id)
    domains.forEach((domain) => {
      initial[domain.name] = persisted[domain.name] || 'open'
    })
    return initial
  })

  useEffect(() => {
    const initial = {}
    const persisted = getOpenIssueStatuses(issueState, report?.id)
    domains.forEach((domain) => {
      initial[domain.name] = persisted[domain.name] || 'open'
    })
    setStatuses(initial)
  }, [domains, issueState, report?.id])

  const cycleStatus = (domainName) => {
    const current = statuses[domainName] || 'open'
    const next = current === 'open' ? 'in_progress' : current === 'in_progress' ? 'resolved' : 'open'
    const nextStatuses = { ...statuses, [domainName]: next }
    setStatuses(nextStatuses)

    if (!userId || !report?.id) return
    ;(async () => {
      try {
        const sb = await initSupabase()
        const existingByReport = {
          ...(issueState?.open_issue_statuses && typeof issueState.open_issue_statuses === 'object' ? issueState.open_issue_statuses : {}),
        }
        existingByReport[report.id] = nextStatuses
        const payload = {
          user_id: userId,
          open_issue_statuses: existingByReport,
          updated_at: new Date().toISOString(),
        }
        const { data, error } = await sb
          .from('business_state')
          .upsert(payload, { onConflict: 'user_id' })
          .select('*')
          .single()
        if (error) throw error
        onIssueStateChange?.((prev) => mergeBusinessState(data || payload, prev))
      } catch (error) {
        console.warn('[dashboard] open issue save failed:', error?.message || error)
        setStatuses((prev) => ({ ...prev, [domainName]: current }))
      }
    })()
  }

  const rows = (typeof limit === 'number' ? domains.slice(0, limit) : domains).map((domain) => ({
    ...domain,
    issueStatus: statuses[domain.name] || 'open',
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((domain) => (
        <button
          key={domain.name}
          type="button"
          onClick={() => cycleStatus(domain.name)}
          style={styles.issueRow}
        >
          <div style={{ ...styles.issueSeverityBar, background: domainSeverityColor(domain.status) }} />
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={styles.issueTitle}>{domain.name}</div>
            <div style={styles.issueSub}>
              {[domain.status?.replace(/_/g, ' '), new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })].filter(Boolean).join(' · ')}
            </div>
          </div>
          <span style={{ ...styles.statusBadge, ...issueStatusStyle(domain.issueStatus) }}>
            {domain.issueStatus.replace(/_/g, ' ')}
          </span>
        </button>
      ))}
    </div>
  )
}

function issueStatusStyle(status) {
  if (status === 'resolved') return { background: G.greenBg, color: G.greenText }
  if (status === 'in_progress') return { background: G.amberBg, color: G.amberText }
  return { background: G.redBg, color: G.redText }
}

function AuditHistoryRow({ report }) {
  const [open, setOpen] = useState(false)
  const headline = report.headline || report.title || '(untitled)'
  const scope = [report.industry, report.domain].filter(Boolean).join(' / ')
  const mode = report.conversation_mode || 'DIAGNOSTIC'

  return (
    <div style={styles.historyCard}>
      <button type="button" style={styles.historyButton} onClick={() => setOpen((prev) => !prev)}>
        <div style={{ ...styles.modeDot, background: modeDotColor(mode) }} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <div style={styles.historyTitle}>{headline}</div>
          <div style={styles.historySub}>{[scope, new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })].filter(Boolean).join(' · ')}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', color: G.textFaint }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={styles.historyExpanded}>
          <DashReportContent content={report.content} />
        </div>
      )}
    </div>
  )
}

function ReportSkeletons({ compact = false }) {
  return (
    <>
      <style>{'@keyframes dashSkeletonPulse{0%,100%{opacity:.55}50%{opacity:.22}}'}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              background: G.panel,
              border: `0.5px solid ${G.border}`,
              borderRadius: 10,
              height: compact ? 48 : 58,
              animation: 'dashSkeletonPulse 1.4s ease-in-out infinite',
              animationDelay: `${index * 0.18}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

function EmptyReports({ onStartAudit }) {
  return (
    <div style={styles.emptyReports}>
      <div style={styles.emptyReportsText}>Run your first audit to see your report here.</div>
      <button type="button" style={styles.emptyReportsBtn} onClick={onStartAudit}>
        Start audit
      </button>
    </div>
  )
}

const REPORT_STATUS_COLORS = {
  critical: { bg: G.redBg, color: G.redText },
  needs_work: { bg: G.amberBg, color: G.amberText },
  good: { bg: G.greenBg, color: G.greenText },
}

function DashSectionLabel({ children }) {
  return <p style={reportStyles.sectionLabel}>{children}</p>
}

function DashTextSection({ label, text, italic }) {
  if (!text) return null
  return (
    <div>
      <DashSectionLabel>{label}</DashSectionLabel>
      <p style={{ ...reportStyles.bodyText, fontStyle: italic ? 'italic' : 'normal' }}>{text}</p>
    </div>
  )
}

function DashReportSchemaB({ p }) {
  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Acknowledgment" text={p.acknowledgment} />
      <DashTextSection label="What This Actually Is" text={p.what_this_actually_is} />
      {p.delivery_script && (
        <div>
          <DashSectionLabel>Delivery Script</DashSectionLabel>
          <div style={reportStyles.codeBlock}>{p.delivery_script}</div>
        </div>
      )}
      <DashTextSection label="What To Expect" text={p.what_to_expect} />
      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportSchemaA({ p }) {
  const domains = p.domains ?? []
  const nonAiFixes = p.non_ai_fixes ?? []
  const aiOpportunities = p.ai_opportunities ?? []
  const priorityActions = p.priority_actions ?? []

  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Verdict" text={p.overall_verdict} />

      <div>
        <DashSectionLabel>Domains</DashSectionLabel>
        {domains.length === 0 ? (
          <p style={reportStyles.emptyText}>No domain breakdown available.</p>
        ) : (
          <div style={reportStyles.listStack}>
            {domains.map((domain, index) => {
              const colors = REPORT_STATUS_COLORS[domain.status] ?? { bg: G.surface3, color: G.textSecondary }
              const urgencyColors = domain.urgency === 'immediate'
                ? { bg: G.redBg, color: G.redText }
                : domain.urgency === 'this_quarter'
                  ? { bg: G.amberBg, color: G.amberText }
                  : { bg: G.surface3, color: G.textFaint }
              return (
                <div key={`${domain.name || 'domain'}-${index}`} style={reportStyles.card}>
                  <div style={reportStyles.cardTopRow}>
                    <p style={reportStyles.cardTitle}>{domain.name}</p>
                    {domain.status && <span style={{ ...reportStyles.pill, background: colors.bg, color: colors.color }}>{domain.status.replace(/_/g, ' ')}</span>}
                  </div>
                  {domain.finding && <p style={reportStyles.bodyText}>{domain.finding}</p>}
                  {domain.action && <p style={reportStyles.actionText}><span style={{ fontWeight: 600 }}>→ Action:</span> {domain.action}</p>}
                  {domain.urgency && <span style={{ ...reportStyles.pill, background: urgencyColors.bg, color: urgencyColors.color }}>{domain.urgency}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {nonAiFixes.length > 0 && (
        <div>
          <DashSectionLabel>Non-AI Fixes</DashSectionLabel>
          <div style={reportStyles.listStack}>
            {nonAiFixes.map((item, index) => (
              <div key={index} style={reportStyles.card}>
                {item.issue && <p style={reportStyles.cardTitle}>{item.issue}</p>}
                {item.fix && <p style={reportStyles.bodyText}>{item.fix}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {aiOpportunities.length > 0 && (
        <div>
          <DashSectionLabel>AI Opportunities</DashSectionLabel>
          <div style={reportStyles.listStack}>
            {aiOpportunities.map((item, index) => (
              <div key={index} style={reportStyles.card}>
                {item.area && <p style={reportStyles.cardTitle}>{item.area}</p>}
                {item.why && <p style={reportStyles.bodyText}>{item.why}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <DashSectionLabel>Priority Actions</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {priorityActions.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>
                {typeof item === 'string' ? item : (item.action ?? item.text ?? JSON.stringify(item))}
              </li>
            ))}
          </ol>
        </div>
      )}

      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportSchemaGoal({ p }) {
  const gap = p.goal_gap_analysis || {}
  const missingCapabilities = p.missing_capabilities || []
  const priorityActions = p.priority_actions || []

  return (
    <div style={reportStyles.stack}>
      {p.headline && <p style={reportStyles.headline}>{p.headline}</p>}
      <DashTextSection label="Verdict" text={p.overall_verdict} />
      <DashTextSection label="Goal" text={gap.goal} />
      <DashTextSection label="Current Position" text={gap.current_position} />
      <DashTextSection label="The Gap" text={gap.gap} />
      <DashTextSection label="Fastest Path" text={gap.fastest_path} />
      <DashTextSection label="Timeline" text={p.timeline_feasibility || gap.realistic_timeline} />

      {missingCapabilities.length > 0 && (
        <div>
          <DashSectionLabel>Missing Capabilities</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {missingCapabilities.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      {priorityActions.length > 0 && (
        <div>
          <DashSectionLabel>Priority Actions</DashSectionLabel>
          <ol style={reportStyles.priorityList}>
            {priorityActions.map((item, index) => (
              <li key={index} style={reportStyles.priorityItem}>
                {typeof item === 'string' ? item : (item.action ?? item.text ?? JSON.stringify(item))}
              </li>
            ))}
          </ol>
        </div>
      )}

      <DashTextSection label="Honest Truth" text={p.honest_truth} italic />
    </div>
  )
}

function DashReportContent({ content }) {
  if (!content) return <p style={reportStyles.emptyText}>No content stored.</p>
  let parsed
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content
  } catch {
    return <pre style={reportStyles.fallbackBlock}>{content}</pre>
  }
  const mode = parsed.conversation_mode
  if (mode === 'GOAL_GAP') return <DashReportSchemaGoal p={parsed} />
  return (mode === 'EXECUTION_HUMAN' || mode === 'EXECUTION' || mode === 'HUMAN_MOMENT')
    ? <DashReportSchemaB p={parsed} />
    : <DashReportSchemaA p={parsed} />
}

function ReportCard({ report, userId }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(report.status ?? 'unknown')
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (event, nextStatus) => {
    event.stopPropagation()
    if (updating) return
    setUpdating(true)
    try {
      const sb = await initSupabase()
      await sb.from('reports').update({ status: nextStatus }).eq('id', report.id)
      setStatus(nextStatus)
    } catch (error) {
      console.warn('[report-status] update failed:', error.message)
    } finally {
      setUpdating(false)
    }
  }

  const statusPill = {
    unknown: { bg: G.surface3, color: G.textFaint },
    ongoing: { bg: G.amberBg, color: G.amberText },
    resolved: { bg: G.greenBg, color: G.greenText },
  }[status] ?? { bg: G.surface3, color: G.textFaint }

  return (
    <div style={{ ...styles.reportCard, borderColor: open ? G.accent : G.border }}>
      <div
        onClick={() => setOpen((prev) => !prev)}
        style={{ ...styles.reportCardHeader, background: open ? 'var(--panel)' : 'transparent' }}
      >
        <p style={styles.reportCardTitle}>{report.title || '(untitled)'}</p>
        <div style={styles.reportCardActions}>
          <span style={{ ...styles.statusBadge, background: statusPill.bg, color: statusPill.color }}>
            {status === 'unknown' ? 'not followed up' : status}
          </span>
          {status !== 'resolved' && (
            <button type="button" onClick={(event) => updateStatus(event, 'resolved')} disabled={updating} style={styles.reportActionDone}>
              Done
            </button>
          )}
          {status === 'unknown' && (
            <button type="button" onClick={(event) => updateStatus(event, 'ongoing')} disabled={updating} style={styles.reportActionWarn}>
              Still open
            </button>
          )}
          {status === 'resolved' && (
            <button type="button" onClick={(event) => updateStatus(event, 'ongoing')} disabled={updating} style={styles.reportActionGhost}>
              Reopen
            </button>
          )}
          <p style={styles.reportDate}>
            {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
          </p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: G.textFaint, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}>
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {open && (
        <div style={styles.reportCardBody}>
          <DashReportContent content={report.content} />
        </div>
      )}
    </div>
  )
}

function ReportList({ reports, userId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reports.map((report) => <ReportCard key={report.id} report={report} userId={userId} />)}
    </div>
  )
}

function LiveBillingCard({ billing, billingLoading, billingError, onOpenPortal, portalLoading }) {
  const nextDate = billing?.current_period_end
    ? new Date(billing.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const card = billing?.card
  const expiry = card ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : null
  const brand = card?.brand ? `${card.brand.charAt(0).toUpperCase()}${card.brand.slice(1)}` : 'Card'

  return (
    <div style={styles.billingCard}>
      {billingLoading && <div style={styles.billingLoading}>Loading billing details…</div>}
      {billingError && !billingLoading && <div style={styles.billingError}>{billingError}</div>}
      {!billingLoading && !billingError && (
        <div style={styles.billingGrid}>
          <BillingMetric label="Next billing" value={nextDate || '—'} />
          <BillingMetric label="Payment method" value={card ? `${brand} ···· ${card.last4}` : '—'} sub={expiry ? `Expires ${expiry}` : ''} />
          <BillingMetric label="Status" value={billing?.status || 'active'} accent />
          <div style={styles.billingActionCell}>
            <button type="button" onClick={onOpenPortal} disabled={portalLoading} style={styles.billingPortalBtn}>
              {portalLoading ? 'Redirecting…' : 'Update payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BillingMetric({ label, value, sub, accent }) {
  return (
    <div style={styles.billingMetric}>
      <div style={styles.billingLabel}>{label}</div>
      <div style={accent ? styles.billingStatus : styles.billingValue}>{value}</div>
      {sub && <div style={styles.billingSub}>{sub}</div>}
    </div>
  )
}

function TierCard({ tier, currentTier, userId, email, requiresPayment = false }) {
  const [loading, setLoading] = useState(false)
  const current = !requiresPayment && tier.key === currentTier

  const handleCheckout = async () => {
    if (!userId || !email) return
    setLoading(true)
    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier: tier.key, userId, email }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...styles.tierCard, background: 'var(--d-surface)', border: `1px solid var(--d-border)`, boxShadow: 'var(--d-shadow)' }}>
      {current && <div style={styles.tierRibbon}>Current plan</div>}
      <div style={styles.tierName}>{tier.name}</div>
      <div style={styles.tierPrice}>
        {tier.price}
        <span style={styles.tierPriceUnit}>/mo</span>
      </div>
      <div style={styles.tierDesc}>{tier.desc}</div>
      <ul style={styles.tierFeatures}>
        {tier.features.map((feature) => (
          <li key={feature} style={styles.tierFeatureItem}>
            <span style={styles.tierArrow}>→</span>
            {feature}
          </li>
        ))}
      </ul>
      {current && <div style={styles.activePlan}>Active plan</div>}
      {requiresPayment && (
        <button type="button" onClick={handleCheckout} disabled={loading} style={styles.tierUpgradeBtn}>
          {loading ? 'Redirecting…' : 'Get started — $99/mo'}
        </button>
      )}
    </div>
  )
}

function SidebarButton({ icon, active, onClick, label, expanded, sharpTheme = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.sidebarButton,
        ...(expanded ? styles.sidebarButtonExpanded : {}),
        ...(active ? styles.sidebarButtonActive : {}),
        ...(sharpTheme ? styles.sidebarButtonSharp : {}),
        ...(sharpTheme && active ? styles.sidebarButtonActiveSharp : {}),
      }}
      aria-label={label}
      title={label}
    >
      <span style={styles.sidebarIcon}>{icon}</span>
      {expanded && <span style={styles.sidebarLabel}>{label}</span>}
    </button>
  )
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 6.5L8 2L13.5 6.5V13.5H9.75V9.75H6.25V13.5H2.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function IconOversight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 13.5V8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6.5 13.5V4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10.5 13.5V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 13.5V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.5H10.5L13 5V13.5H4V2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.5 2.5V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 8H11M6 10.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconIntelligence() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="3.5" rx="4.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 3.5V7.75C3.5 8.85 5.51 9.75 8 9.75C10.49 9.75 12.5 8.85 12.5 7.75V3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 7.75V12.5C3.5 13.6 5.51 14.5 8 14.5C10.49 14.5 12.5 13.6 12.5 12.5V7.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.4 2.1C4.8 2.1 3.5 3.4 3.5 5c0 .4.1.7.2 1A2.9 2.9 0 0 0 2.5 8.5c0 1.3.8 2.4 2 2.8v.2c0 1.3 1 2.3 2.3 2.3.8 0 1.5-.4 1.9-1 .4.6 1.1 1 1.9 1 1.3 0 2.3-1 2.3-2.3v-.2a3 3 0 0 0 .6-5.3c.1-.3.2-.6.2-1 0-1.6-1.3-2.9-2.9-2.9-.8 0-1.6.3-2.1.9-.6-.6-1.3-.9-2.1-.9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M8 4.2v7.2M8 7.1c-.6 0-1 .4-1 1M8 6.4c.6 0 1 .4 1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconConnectors() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 3.5H6a2.5 2.5 0 0 0 0 5h4a2.5 2.5 0 0 1 0 5H7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5A2.5 2.5 0 1 0 8 5.5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.75V3.25M8 12.75V14.25M12.45 3.55L11.39 4.61M4.61 11.39L3.55 12.45M14.25 8H12.75M3.25 8H1.75M12.45 12.45L11.39 11.39M4.61 4.61L3.55 3.55" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconAgent() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 8.5l1.5 1.5-1.5 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: G.black,
    overflow: 'hidden',
  },
  sidebar: {
    width: 52,
    background: G.black,
    borderRight: `0.5px solid ${G.border}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
    gap: 4,
    flexShrink: 0,
    transition: 'width 0.18s ease',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  sidebarSharp: {
    background: SHARP_HERO_SURFACE,
    boxShadow: `${SHARP_HERO_INSET}, inset -1px 0 0 rgba(107,140,255,0.22)`,
  },
  sidebarDark: {
    background: DARK_HERO_SURFACE,
    boxShadow: `${DARK_HERO_INSET}, inset -1px 0 0 rgba(183,154,146,0.18)`,
  },
  sidebarLight: {
    background: LIGHT_HERO_SURFACE,
    boxShadow: `${LIGHT_HERO_INSET}, inset -1px 0 0 rgba(92,114,72,0.12)`,
  },
  sidebarExpanded: {
    width: 220,
    alignItems: 'stretch',
    padding: '16px 8px',
  },
  sidebarButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: G.textSecondary,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
  },
  sidebarButtonExpanded: {
    width: '100%',
    padding: '0 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  sidebarButtonActive: {
    background: G.panel,
    color: G.text,
  },
  sidebarButtonSharp: {
    border: '1px solid transparent',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
  },
  sidebarButtonActiveSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  sidebarIcon: {
    width: 16,
    height: 16,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  sidebarLabel: {
    fontSize: 13,
    color: 'inherit',
    whiteSpace: 'nowrap',
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    color: G.textSecondary,
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: 4,
  },
  avatarButtonExpanded: {
    width: '100%',
    padding: '0 12px',
    justifyContent: 'flex-start',
    gap: 12,
  },
  avatarButtonActive: {
    background: G.panel,
    color: G.text,
  },
  avatarButtonSharp: {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
  },
  avatarButtonActiveSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  avatarChip: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: G.surface3,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  avatarChipActive: {
    background: G.surface2,
  },
  appFrame: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  topbar: {
    height: 54,
    background: G.surface,
    borderBottom: `0.5px solid ${G.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    gap: 16,
    flexShrink: 0,
  },
  topbarSharp: {
    background: SHARP_HERO_SURFACE,
    boxShadow: `${SHARP_HERO_INSET}, inset 0 -1px 0 rgba(107,140,255,0.24)`,
  },
  topbarDark: {
    background: DARK_HERO_SURFACE,
    boxShadow: `${DARK_HERO_INSET}, inset 0 -1px 0 rgba(183,154,146,0.18)`,
  },
  topbarLight: {
    background: LIGHT_HERO_SURFACE,
    boxShadow: `${LIGHT_HERO_INSET}, inset 0 -1px 0 rgba(92,114,72,0.12)`,
  },
  topbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    minWidth: 0,
  },
  logo: {
    fontSize: 16,
    color: G.text,
    letterSpacing: '-0.04em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  breadcrumb: {
    fontSize: 12,
    color: G.textMuted,
    whiteSpace: 'nowrap',
  },
  topbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  themeToggleButton: {
    border: `0.5px solid ${G.border2}`,
    background: G.surface2,
    color: G.textSecondary,
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 14,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  themeToggleButtonSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  themeToggleIcon: {
    fontSize: 15,
    lineHeight: 1,
  },
  ghostButton: {
    border: `1px solid ${G.border2}`,
    background: 'none',
    color: G.text,
    borderRadius: 8,
    padding: '9px 22px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  ghostButtonSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  topbarCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    padding: '0 7px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: G.accentLight,
    color: G.accentText,
    fontSize: 11,
    marginLeft: 8,
  },
  primaryButton: {
    background: G.accent,
    color: G.white,
    borderRadius: 8,
    padding: '9px 22px',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  main: {
    background: G.black,
    flex: 1,
    overflowY: 'auto',
    padding: 20,
  },
  mainSharp: {
    background: 'radial-gradient(circle at top left, rgba(66,108,184,0.12) 0%, rgba(16,27,51,0) 24%), linear-gradient(180deg, #12213D 0%, #0D1930 100%)',
  },
  mainDark: {
    background: DARK_PAGE_BG,
  },
  mainLight: {
    background: LIGHT_PAGE_BG,
  },
  pageShell: {
    maxWidth: 1240,
    margin: '0 auto',
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 28,
    color: G.text,
    fontWeight: 500,
    letterSpacing: '-0.04em',
    margin: 0,
  },
  pageSub: {
    marginTop: 8,
    fontSize: 13,
    color: G.textSecondary,
  },
  actionQueueCard: {
    background: 'var(--d-surface)',
    border: '1px solid var(--d-border)',
    borderRadius: 16,
    boxShadow: 'var(--d-shadow)',
    padding: '18px 20px',
  },
  executionHistoryCard: {
    background: 'var(--d-surface)',
    border: '1px solid var(--d-border)',
    borderRadius: 16,
    boxShadow: 'var(--d-shadow)',
    padding: '18px 20px',
  },
  actionQueueEyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--ember)',
    fontWeight: 700,
    marginBottom: 8,
  },
  actionQueueTitle: {
    fontSize: 16,
    color: 'var(--fg)',
    fontWeight: 600,
    marginBottom: 4,
  },
  actionQueueSub: {
    fontSize: 13,
    color: 'var(--fg-dim)',
    lineHeight: 1.6,
  },
  pendingActionRow: {
    padding: '12px 0',
    borderBottom: '1px solid var(--d-border)',
  },
  pendingActionTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  pendingActionTitle: {
    fontSize: 13,
    color: 'var(--fg)',
    fontWeight: 600,
  },
  pendingActionMeta: {
    fontSize: 11,
    color: 'var(--fg-mute)',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  pendingActionLabel: {
    fontSize: 11,
    color: 'var(--fg-mute)',
    marginBottom: 6,
  },
  pendingActionInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid var(--d-border)',
    background: 'var(--d-bg)',
    color: 'var(--fg)',
    fontSize: 12,
    marginBottom: 10,
  },
  pendingActionButtons: {
    display: 'flex',
    gap: 8,
  },
  pendingActionApprove: {
    padding: '7px 14px',
    fontSize: 12,
    background: 'var(--ember)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  pendingActionApproveDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },
  pendingActionDismiss: {
    padding: '7px 14px',
    fontSize: 12,
    background: 'transparent',
    color: 'var(--fg-dim)',
    border: '1px solid var(--d-border)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  pendingActionError: {
    fontSize: 12,
    color: 'var(--red-text)',
    marginTop: 8,
  },
  executionHistoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid var(--d-border)',
  },
  executionHistoryAction: {
    fontSize: 13,
    color: 'var(--fg)',
    fontWeight: 600,
  },
  executionHistoryMeta: {
    fontSize: 11,
    color: 'var(--fg-mute)',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  executionHistoryOutcome: {
    fontSize: 12,
    fontWeight: 600,
  },
  executionHistoryDate: {
    fontSize: 11,
    color: 'var(--fg-mute)',
    marginTop: 3,
  },
  alertBar: {
    background: G.amberBg,
    border: `0.5px solid ${G.amber}`,
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  alertTextWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: G.amberText,
    flexShrink: 0,
  },
  alertText: {
    color: G.amberText,
    fontSize: 12,
  },
  alertButton: {
    background: 'transparent',
    color: G.amberText,
    border: `0.5px solid ${G.amber}`,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  alertActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  alertDismissButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `0.5px solid ${G.amber}`,
    background: 'transparent',
    color: G.amberText,
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    padding: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
    marginBottom: 10,
  },
  kpiCard: {
    background: G.panel,
    border: `0.5px solid ${G.border}`,
    borderRadius: 10,
    padding: 12,
    minWidth: 0,
    minHeight: 112,
    display: 'flex',
    flexDirection: 'column',
  },
  kpiCardSharp: {
    background: 'var(--rich-panel-surface)',
    border: 'var(--rich-panel-border)',
    boxShadow: 'var(--rich-panel-shadow)',
  },
  kpiCardButton: {
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    appearance: 'none',
  },
  kpiCardActive: {
    borderColor: G.accent,
    boxShadow: `0 0 0 1px ${G.accentLight}`,
  },
  kpiLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  kpiValue: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: 500,
    color: G.text,
  },
  kpiDelta: {
    marginTop: 6,
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  kpiHint: {
    marginTop: 'auto',
    paddingTop: 10,
    fontSize: 9.5,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
  },
  oversightSnapshotCard: {
    background: G.panelAlt,
    border: `0.5px solid ${G.border}`,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  oversightSnapshotTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    alignItems: 'flex-start',
  },
  oversightSnapshotHeadline: {
    marginTop: 8,
    fontSize: 18,
    color: G.text,
    lineHeight: 1.2,
  },
  oversightSnapshotSummary: {
    marginTop: 8,
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.7,
    maxWidth: 760,
  },
  oversightSnapshotButton: {
    border: `0.5px solid ${G.border2}`,
    background: G.accent,
    color: G.white,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
  oversightSnapshotMetaRow: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 12,
    fontSize: 11.5,
    color: G.textFaint,
  },
  oversightSnapshotDiagnosis: {
    marginTop: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  oversightSnapshotDiagnosisText: {
    fontSize: 12.5,
    color: G.textSecondary,
  },
  checkInCard: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'flex-end',
  },
  checkInTitle: {
    marginTop: 8,
    fontSize: 18,
    color: G.text,
    lineHeight: 1.25,
  },
  checkInText: {
    marginTop: 8,
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.7,
    maxWidth: 720,
  },
  checkInActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexShrink: 0,
  },
  checkInGhostBtn: {
    border: `0.5px solid ${G.border2}`,
    background: 'transparent',
    color: G.textSecondary,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  checkInPrimaryBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  homeColumns: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.95fr) minmax(260px, 0.62fr)',
    gap: 12,
    alignItems: 'start',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  leftColumnFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
    gridColumn: '1 / -1',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minWidth: 0,
  },
  panelCard: {
    background: G.panelAlt,
    border: `0.5px solid ${G.border}`,
    borderRadius: 10,
    padding: 14,
  },
  panelCardSharp: {
    background: 'var(--rich-hero-surface)',
    border: 'var(--rich-hero-border)',
    boxShadow: 'var(--rich-hero-inset), var(--rich-hero-shadow)',
  },
  oversightGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
    gap: 12,
    alignItems: 'stretch',
  },
  oversightFounderSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  oversightFounderHeadline: {
    fontSize: 15,
    color: G.text,
    lineHeight: 1.7,
  },
  oversightFounderMeta: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    fontSize: 11.5,
    color: G.textFaint,
  },
  oversightActionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 14,
  },
  oversightActionItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    fontSize: 13,
    color: G.textSecondary,
  },
  oversightActionIndex: {
    width: 20,
    height: 20,
    borderRadius: 999,
    background: G.accent,
    color: G.white,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    flexShrink: 0,
    marginTop: 1,
  },
  oversightAreaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  oversightAreaCard: {
    border: `0.5px solid ${G.border}`,
    borderRadius: 10,
    padding: 12,
    background: G.panel,
  },
  oversightAreaTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  oversightAreaLabel: {
    fontSize: 14,
    color: G.text,
  },
  oversightAreaCoverage: {
    marginTop: 4,
    fontSize: 11.5,
    color: G.textFaint,
  },
  oversightAreaDiagnosis: {
    marginTop: 10,
    fontSize: 12.5,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  weeklyDigestCardButton: {
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    appearance: 'none',
  },
  weeklyDigestCardMeta: {
    marginTop: 10,
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  weeklyDigestCardSub: {
    marginTop: 10,
    fontSize: 13,
    color: G.greenText,
    lineHeight: 1.6,
  },
  weeklyDigestRail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 12,
  },
  weeklyDigestRailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingBottom: 10,
    borderBottom: `0.5px solid ${G.border}`,
  },
  weeklyDigestRailLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
  },
  weeklyDigestRailValue: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.55,
  },
  weeklyDigestRailValueMuted: {
    fontSize: 12,
    color: G.textMuted,
    lineHeight: 1.5,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  panelMeta: {
    fontSize: 11,
    color: G.textFaint,
  },
  businessHealthOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 320,
    background: G.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  businessHealthModal: {
    width: 'min(900px, 100%)',
    maxHeight: '88vh',
    overflowY: 'auto',
    zoom: 1.05,
  },
  businessHealthCloseBtn: {
    border: `0.5px solid ${G.border2}`,
    background: G.surface,
    color: G.textSecondary,
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 11,
    cursor: 'pointer',
  },
  panelToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 12,
  },
  panelToggleRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  panelCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    padding: '0 8px',
    display: 'grid',
    placeItems: 'center',
    background: G.surface,
    color: G.textSecondary,
    fontSize: 11,
  },
  inlineLink: {
    border: 'none',
    background: 'transparent',
    color: G.textSecondary,
    fontSize: 12,
    cursor: 'pointer',
  },
  emptyPanel: {
    fontSize: 12,
    color: G.textSecondary,
    padding: '8px 0',
  },
  weeklyDigestEmpty: {
    fontSize: 13,
    color: G.textFaint,
    lineHeight: 1.6,
  },
  alertsSummaryRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 180px) minmax(0, 1fr)',
    gap: 16,
    alignItems: 'end',
    marginBottom: 16,
  },
  alertsSummaryValue: {
    fontSize: 28,
    color: G.text,
    lineHeight: 1,
    marginBottom: 8,
  },
  alertsSummaryMeta: {
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.65,
  },
  alertsError: {
    fontSize: 12,
    color: G.redText,
    marginBottom: 12,
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  alertRow: {
    border: `0.5px solid ${G.border}`,
    background: G.surface,
    borderRadius: 10,
    padding: '14px 15px',
  },
  alertRowTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertTitleWrap: {
    minWidth: 0,
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    color: G.text,
    lineHeight: 1.4,
  },
  alertMeta: {
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flexWrap: 'wrap',
  },
  alertPills: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  alertPill: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid transparent',
    borderRadius: 999,
    padding: '4px 9px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  alertDescription: {
    marginTop: 12,
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.65,
  },
  alertActionCopy: {
    marginTop: 10,
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  alertActionRow: {
    marginTop: 14,
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  alertInboxGhostBtn: {
    border: `0.5px solid ${G.border2}`,
    background: 'transparent',
    color: G.textSecondary,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  alertInboxPrimaryBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  weeklyDigestScoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  weeklyDigestScore: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
  },
  weeklyDigestScoreLabel: {
    fontSize: 12,
    color: G.textFaint,
  },
  weeklyDigestConnectorTag: {
    fontSize: 11,
    color: G.textFaint,
    background: G.surface,
    borderRadius: 4,
    padding: '2px 6px',
    marginLeft: 4,
  },
  weeklyDigestSummary: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  weeklyDigestRiskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
    fontSize: 12,
    color: G.textSecondary,
  },
  weeklyDigestMetaRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  weeklyDigestMetaText: {
    fontSize: 11,
    color: G.textFaint,
  },
  weeklyDigestPrefsIntro: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.7,
    marginBottom: 16,
  },
  weeklyDigestToggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  weeklyDigestToggleLabel: {
    fontSize: 13,
    color: G.text,
  },
  weeklyDigestPrefsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    marginTop: 16,
  },
  weeklyDigestFieldShell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  checkInTextarea: {
    width: '100%',
    minHeight: 96,
    resize: 'vertical',
    background: G.black,
    color: G.text,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 13,
    lineHeight: 1.6,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  weeklyDigestSelect: {
    background: G.black,
    color: G.text,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 13,
  },
  weeklyDigestAreaGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  weeklyDigestAreaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 999,
    padding: '10px 14px',
  },
  weeklyDigestAreaLabel: {
    fontSize: 12,
    color: G.text,
  },
  weeklyDigestSaveRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
  },
  weeklyDigestToast: {
    fontSize: 12,
    color: G.accentText,
  },
  checkInError: {
    fontSize: 12,
    color: G.redText,
  },
  weeklyDigestSaveBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 12,
    cursor: 'pointer',
  },
  issueRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: '12px 10px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  issueSeverityBar: {
    width: 4,
    height: 34,
    borderRadius: 999,
    flexShrink: 0,
  },
  issueTitle: {
    fontSize: 13,
    color: G.textSecondary,
  },
  issueSub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  historyCard: {
    background: G.surface,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  historyButton: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 10px',
    cursor: 'pointer',
    color: 'inherit',
  },
  modeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  historyTitle: {
    fontSize: 13,
    color: G.text,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historySub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 4,
  },
  historyExpanded: {
    borderTop: `0.5px solid ${G.border}`,
    padding: '12px 10px',
  },
  healthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  donutWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    flexShrink: 0,
  },
  donutScore: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    color: G.text,
    fontSize: 18,
  },
  domainBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  domainBarLabel: {
    width: 80,
    fontSize: 11,
    color: G.textMuted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  domainBarTrack: {
    flex: 1,
    height: 3,
    background: G.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  domainBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  domainBarValue: {
    width: 24,
    textAlign: 'right',
    fontSize: 11,
    color: G.textFaint,
  },
  openIssuesSummaryRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 14,
  },
  openIssuesSummaryValue: {
    fontSize: 28,
    fontWeight: 600,
    color: G.text,
    lineHeight: 1,
  },
  openIssuesSummaryText: {
    fontSize: 13,
    color: G.textSecondary,
  },
  businessHealthSection: {
    marginTop: 18,
  },
  businessHealthSectionTitle: {
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  businessHealthGoalText: {
    fontSize: 14,
    color: G.textSecondary,
    lineHeight: 1.5,
  },
  goalTrackerCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 14,
    border: `1px solid ${G.border}`,
    borderRadius: 12,
    background: G.surface2,
  },
  goalTrackerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  goalHealthBadge: {
    flexShrink: 0,
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  goalTrack: {
    marginTop: 14,
    height: 4,
    background: G.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    background: G.accent,
    borderRadius: 999,
  },
  goalMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
    fontSize: 11,
    color: G.textFaint,
  },
  goalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
    fontSize: 12,
    color: G.textSecondary,
  },
  goalMetaBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  goalMetaLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  goalAreaTag: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    padding: '5px 8px',
    borderRadius: 999,
    background: G.accentLight,
    color: G.accentText,
    fontSize: 11,
    fontWeight: 600,
  },
  aiCard: {
    background: G.surface2,
    border: `1.5px solid ${G.border}`,
    borderRadius: 8,
    padding: 14,
  },
  aiCardSub: {
    marginTop: 5,
    fontSize: 12,
    color: G.textSecondary,
  },
  aiList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  aiOpportunityRow: {
    display: 'flex',
    gap: 10,
    background: G.panel,
    border: `0.5px solid ${G.border}`,
    borderRadius: 8,
    padding: '12px 10px',
  },
  aiOpportunityBar: {
    width: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  aiOpportunityBody: {
    flex: 1,
    minWidth: 0,
  },
  aiOpportunityTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aiOpportunityTitle: {
    fontSize: 13,
    color: G.text,
    fontWeight: 500,
  },
  aiOpportunityMeta: {
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.5,
    marginTop: 4,
  },
  aiOpportunityFoot: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    fontSize: 11,
    color: G.textFaint,
  },
  aiSignalPill: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  aiSignalPillGreen: {
    background: G.greenBg,
    color: G.greenText,
  },
  aiSignalPillAmber: {
    background: G.amberBg,
    color: G.amberText,
  },
  aiSignalPillBlue: {
    background: G.accentLight,
    color: G.accentText,
  },
  aiCtaWrap: {
    marginTop: 12,
  },
  aiShareButton: {
    width: '100%',
    background: 'transparent',
    color: G.accentText,
    border: `0.5px solid ${G.accent}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  aiSuccessText: {
    fontSize: 12,
    color: G.accentText,
    lineHeight: 1.5,
  },
  aiErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: G.redText,
  },
  businessStateCard: {
    background: G.surface2,
    border: `1.5px solid ${G.accent}`,
    borderRadius: 8,
    padding: 14,
  },
  businessStateSub: {
    marginTop: 5,
    fontSize: 12,
    color: G.textSecondary,
  },
  businessStateTitle: {
    fontSize: 15,
    color: G.text,
    letterSpacing: '-0.02em',
  },
  businessStateGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  businessStateLabel: {
    fontSize: 10,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  businessStateValue: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  businessStateEmpty: {
    fontSize: 13,
    color: G.textFaint,
    fontStyle: 'italic',
    lineHeight: 1.6,
  },
  businessStateAssumed: {
    color: G.textFaint,
    fontStyle: 'italic',
  },
  businessStateEditBtn: {
    border: `1px solid ${G.border2}`,
    background: G.surface3,
    color: G.text,
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    boxShadow: `0 0 0 1px ${G.overlaySoft}`,
    cursor: 'pointer',
  },
  businessStateActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  businessStateGhostBtn: {
    border: `0.5px solid ${G.border2}`,
    background: 'transparent',
    color: G.textSecondary,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  businessStateSaveBtn: {
    border: 'none',
    background: G.accent,
    color: G.white,
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    cursor: 'pointer',
  },
  businessStateEditorShell: {
    display: 'flex',
    flexDirection: 'column',
  },
  businessStateTextarea: {
    width: '100%',
    minHeight: 74,
    resize: 'vertical',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: G.text,
    fontSize: 13,
    lineHeight: 1.5,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  scopeSetupGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  scopeSetupPill: {
    fontSize: 12,
    padding: '9px 12px',
    borderRadius: 8,
    border: `0.5px solid ${G.border2}`,
    background: G.surface,
    color: G.textSecondary,
    cursor: 'pointer',
    textAlign: 'left',
  },
  scopeSetupPillActive: {
    background: G.accentLight,
    color: G.accentText,
    borderColor: G.accent,
  },
  scopePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  scopePill: {
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    color: G.textSecondary,
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
  },
  emptyReports: {
    border: `1px dashed ${G.border2}`,
    borderRadius: 12,
    padding: '42px 24px',
    textAlign: 'center',
    background: G.surface,
  },
  emptyReportsText: {
    fontSize: 13,
    color: G.textSecondary,
    marginBottom: 16,
  },
  emptyReportsBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 12,
    cursor: 'pointer',
  },
  connectorsToast: {
    marginBottom: 16,
    border: `0.5px solid ${G.border}`,
    background: G.accentLight,
    color: G.accentText,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 13,
  },
  connectorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  connectorCard: {
    background: G.panel,
    border: `0.5px solid ${G.border}`,
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  connectorCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  connectorName: {
    fontSize: 16,
    fontWeight: 600,
    color: G.text,
  },
  connectorCategory: {
    marginTop: 4,
    fontSize: 12,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  connectorBadge: {
    borderRadius: 999,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  connectorBadgeConnected: {
    background: G.greenBg,
    color: G.greenText,
  },
  connectorBadgeAdd: {
    background: G.accentLight,
    color: G.accentText,
  },
  connectorBadgeSoon: {
    background: G.surface3,
    color: G.textFaint,
  },
  connectorBodyText: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.5,
  },
  connectorConnectBtn: {
    border: 'none',
    borderRadius: 999,
    background: G.accent,
    color: G.white,
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorDisconnectBtn: {
    border: `0.5px solid ${G.border}`,
    borderRadius: 999,
    background: 'transparent',
    color: G.text,
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorSoonText: {
    fontSize: 12,
    color: G.textFaint,
  },
  connectorPreview: {
    borderTop: `0.5px solid ${G.border}`,
    paddingTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  connectorPreviewMeta: {
    fontSize: 12,
    color: G.textFaint,
  },
  connectorPreviewStat: {
    fontSize: 13,
    color: G.textSecondary,
  },
  connectorSignals: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  connectorSignalLine: {
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.45,
  },
  connectorSyncBtn: {
    alignSelf: 'flex-start',
    border: `0.5px solid ${G.border}`,
    borderRadius: 999,
    background: G.surface2,
    color: G.text,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  connectorsLoading: {
    marginTop: 14,
    fontSize: 12,
    color: G.textFaint,
  },
  connectorTierLabel: {
    fontSize: 11,
    color: G.textFaint,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  reportCard: {
    background: 'var(--d-surface)',
    border: '1px solid var(--d-border)',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: 'var(--d-shadow)',
  },
  reportCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '13px 16px',
    cursor: 'pointer',
  },
  reportCardTitle: {
    flex: 1,
    minWidth: 0,
    color: G.text,
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reportCardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  reportActionDone: {
    fontSize: 11,
    color: G.accentText,
    background: G.accentLight,
    border: 'none',
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportActionWarn: {
    fontSize: 11,
    color: G.amberText,
    background: G.amberBg,
    border: 'none',
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportActionGhost: {
    fontSize: 11,
    color: G.textSecondary,
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    borderRadius: 6,
    padding: '4px 9px',
    cursor: 'pointer',
  },
  reportDate: {
    fontSize: 11,
    color: G.textFaint,
  },
  reportCardBody: {
    padding: '14px 16px',
    borderTop: `0.5px solid ${G.border}`,
  },
  billingCard: {
    background: 'var(--d-surface)',
    border: `1px solid var(--d-border)`,
    boxShadow: 'var(--d-shadow)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  billingLoading: {
    padding: '18px 22px',
    fontSize: 13,
    color: G.textSecondary,
  },
  billingError: {
    padding: '14px 22px',
    fontSize: 13,
    color: G.redText,
    background: G.redBg,
  },
  billingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    alignItems: 'stretch',
  },
  billingMetric: {
    padding: '18px 22px',
    borderRight: `0.5px solid ${G.border}`,
  },
  billingActionCell: {
    padding: '18px 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: G.textFaint,
    marginBottom: 6,
  },
  billingValue: {
    fontSize: 14,
    color: G.text,
  },
  billingStatus: {
    display: 'inline-block',
    background: G.greenBg,
    color: G.greenText,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
  },
  billingSub: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 4,
  },
  billingPortalBtn: {
    background: 'transparent',
    color: G.accentText,
    border: `0.5px solid ${G.accent}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 16,
  },
  tierCard: {
    position: 'relative',
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 360,
  },
  tierRibbon: {
    position: 'absolute',
    top: -11,
    left: 16,
    background: G.accent,
    color: G.white,
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tierRibbonAlt: {
    position: 'absolute',
    top: -11,
    right: 16,
    background: G.surface3,
    color: G.textSecondary,
    borderRadius: 999,
    padding: '3px 10px',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  tierName: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: G.textFaint,
  },
  tierPrice: {
    marginTop: 6,
    fontSize: 28,
    color: G.text,
  },
  tierPriceUnit: {
    fontSize: 13,
    color: G.textFaint,
    marginLeft: 2,
  },
  tierDesc: {
    marginTop: 10,
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  tierFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '16px 0 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  tierFeatureItem: {
    fontSize: 12,
    color: G.textSecondary,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 7,
  },
  tierArrow: {
    color: G.accentText,
  },
  activePlan: {
    background: G.accentLight,
    color: G.accentText,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    textAlign: 'center',
  },
  tierUpgradeBtn: {
    background: G.accent,
    color: G.white,
    border: 'none',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  tierDowngradeBtn: {
    background: 'transparent',
    color: G.textSecondary,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
}

const account = {
  card: {
    background: 'var(--d-surface)',
    border: '1px solid var(--d-border)',
    borderRadius: 12,
    padding: '4px 0',
    boxShadow: 'var(--d-shadow)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '14px 22px',
  },
  divider: {
    height: 1,
    background: G.border,
    margin: '0 22px',
  },
  label: {
    fontSize: 11,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    width: 120,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: G.text,
    flex: 1,
  },
  editButton: {
    background: 'transparent',
    border: 'none',
    color: G.accentText,
    fontSize: 12,
    cursor: 'pointer',
  },
  input: {
    flex: 1,
    width: '100%',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    padding: '9px 11px',
    color: G.text,
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  deleteLink: {
    background: 'transparent',
    border: 'none',
    color: G.redText,
    textDecoration: 'underline',
    fontSize: 12,
    cursor: 'pointer',
  },
  signOutBtn: {
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    color: G.textSecondary,
    padding: '8px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  dataCard: {
    marginTop: 22,
    background: 'var(--d-surface)',
    border: '1px solid var(--d-border)',
    borderRadius: 12,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: 'var(--d-shadow)',
  },
  dataCardTitle: {
    fontSize: 13,
    color: G.text,
  },
  dataCardText: {
    fontSize: 12,
    color: G.textSecondary,
    lineHeight: 1.65,
    maxWidth: 760,
  },
  dataCardMeta: {
    fontSize: 11,
    color: G.textFaint,
    lineHeight: 1.6,
  },
  dataCardError: {
    fontSize: 12,
    color: G.redText,
  },
  dataExportBtn: {
    alignSelf: 'flex-start',
    background: G.accent,
    border: 'none',
    borderRadius: 8,
    color: G.white,
    padding: '9px 13px',
    fontSize: 12,
    cursor: 'pointer',
  },
  legalRow: {
    marginTop: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legalLabel: {
    fontSize: 12,
    color: G.textFaint,
  },
  legalLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  legalLink: {
    color: G.accentText,
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 500,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: G.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: 380,
    maxWidth: '90vw',
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 14,
    padding: '26px 24px 22px',
    boxShadow: `0 24px 60px ${G.overlaySoft}`,
  },
  modalTitle: {
    fontSize: 16,
    color: G.text,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  modalCancel: {
    background: 'transparent',
    border: `0.5px solid ${G.border2}`,
    color: G.textSecondary,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  modalDelete: {
    background: G.red,
    border: 'none',
    color: G.white,
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
}

const gm = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 300,
    background: G.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 16,
    padding: '2rem',
    width: '100%',
    maxWidth: 480,
    position: 'relative',
    boxShadow: `0 24px 60px ${G.overlaySoft}`,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'transparent',
    border: 'none',
    color: G.textFaint,
    fontSize: 14,
    cursor: 'pointer',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: G.accentText,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    color: G.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  field: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: G.text,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: G.surface,
    border: `0.5px solid ${G.border2}`,
    borderRadius: 8,
    color: G.text,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  hint: {
    fontSize: 11,
    color: G.textFaint,
    marginTop: 5,
  },
  categoryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    fontSize: 12,
    padding: '5px 12px',
    borderRadius: 999,
    border: `0.5px solid ${G.border2}`,
    background: G.surface,
    color: G.textSecondary,
    cursor: 'pointer',
  },
  categoryActive: {
    background: G.accentLight,
    color: G.accentText,
    borderColor: G.accent,
  },
  startBtn: {
    width: '100%',
    padding: 13,
    background: G.accent,
    color: G.white,
    fontSize: 14,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    marginTop: 8,
  },
  error: {
    fontSize: 12,
    color: G.redText,
    marginBottom: 8,
  },
}

const reportStyles = {
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  headline: {
    fontSize: 16,
    color: G.text,
    lineHeight: 1.45,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: G.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  },
  bodyText: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.65,
  },
  actionText: {
    marginTop: 7,
    fontSize: 13,
    color: G.text,
    lineHeight: 1.6,
  },
  emptyText: {
    fontSize: 13,
    color: G.textFaint,
    fontStyle: 'italic',
  },
  listStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    background: G.surface,
    border: `1px solid ${G.border}`,
    borderRadius: 8,
    padding: '12px 14px',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    color: G.text,
    fontWeight: 700,
  },
  pill: {
    borderRadius: 999,
    padding: '2px 9px',
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  priorityList: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  priorityItem: {
    fontSize: 13,
    color: G.textSecondary,
    lineHeight: 1.6,
  },
  codeBlock: {
    background: G.black,
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 13,
    color: G.text,
    lineHeight: 1.7,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  fallbackBlock: {
    fontSize: 12,
    color: G.textSecondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.6,
  },
}
