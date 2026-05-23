import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'
import { PRIVACY_POLICY_URL, TERMS_HASH } from '../lib/legal.js'
import IntelligenceBrief from './IntelligenceBrief.jsx'
import ExecutionPanel from './ExecutionPanel.jsx'
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

const THEME_ORDER = ['dark', 'light', 'sharp']

const THEMES = {
  dark: {
    bg: DARK_PAGE_BG,
    surface: DARK_HERO_SURFACE,
    surface2: DARK_PANEL_SURFACE,
    surface3: DARK_SOLID_PANEL_ALT,
    panel: DARK_PANEL_SURFACE,
    panelAlt: DARK_HERO_SURFACE,
    border: DARK_BORDER,
    border2: DARK_BORDER_STRONG,
    text: DARK_TEXT,
    textSecondary: DARK_TEXT_SOFT,
    textMuted: DARK_TEXT_MUTED,
    textFaint: DARK_TEXT_FAINT,
    accent: DARK_ACCENT,
    accentLight: DARK_ACCENT_SOFT,
    accentText: DARK_ACCENT_TEXT,
    red: DARK_RED,
    redBg: DARK_RED_BG,
    redText: DARK_RED_TEXT,
    amber: DARK_AMBER,
    amberBg: DARK_AMBER_BG,
    amberText: DARK_AMBER_TEXT,
    green: DARK_GREEN,
    greenBg: DARK_GREEN_BG,
    greenText: DARK_GREEN_TEXT,
    blue: '#7090B0',
    violet: '#9070A0',
    sand: '#B79A92',
    white: DARK_TEXT,
    overlay: 'rgba(3,0,0,0.7)',
    overlaySoft: 'rgba(0,0,0,0.4)',
  },
  light: {
    bg: LIGHT_PAGE_BG,
    surface: LIGHT_HERO_SURFACE,
    surface2: LIGHT_PANEL_SURFACE,
    surface3: LIGHT_SOLID_PANEL_ALT,
    panel: LIGHT_PANEL_SURFACE,
    panelAlt: LIGHT_HERO_SURFACE,
    border: LIGHT_BORDER,
    border2: LIGHT_BORDER_STRONG,
    text: LIGHT_TEXT,
    textSecondary: LIGHT_TEXT_SOFT,
    textMuted: LIGHT_TEXT_MUTED,
    textFaint: LIGHT_TEXT_FAINT,
    accent: LIGHT_ACCENT,
    accentLight: LIGHT_ACCENT_SOFT,
    accentText: LIGHT_ACCENT_TEXT,
    red: LIGHT_RED,
    redBg: LIGHT_RED_BG,
    redText: LIGHT_RED_TEXT,
    amber: LIGHT_AMBER,
    amberBg: LIGHT_AMBER_BG,
    amberText: LIGHT_AMBER_TEXT,
    green: LIGHT_GREEN,
    greenBg: LIGHT_GREEN_BG,
    greenText: LIGHT_GREEN_TEXT,
    blue: '#4A7A6A',
    violet: '#6A7A5A',
    sand: '#4F6642',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.14)',
    overlaySoft: 'rgba(0,0,0,0.07)',
  },
  sharp: {
    bg: SHARP_PAGE_BG,
    surface: SHARP_HERO_SURFACE,
    surface2: SHARP_PANEL_SURFACE,
    surface3: SHARP_SOLID_PANEL_ALT,
    panel: SHARP_PANEL_SURFACE,
    panelAlt: SHARP_HERO_SURFACE,
    border: SHARP_BORDER,
    border2: SHARP_BORDER_STRONG,
    text: SHARP_TEXT,
    textSecondary: SHARP_TEXT_SOFT,
    textMuted: SHARP_TEXT_MUTED,
    textFaint: SHARP_TEXT_FAINT,
    accent: SHARP_ACCENT,
    accentLight: SHARP_ACCENT_SOFT,
    accentText: SHARP_ACCENT_TEXT,
    red: SHARP_RED,
    redBg: SHARP_RED_BG,
    redText: SHARP_RED_TEXT,
    amber: SHARP_AMBER,
    amberBg: SHARP_AMBER_BG,
    amberText: SHARP_AMBER_TEXT,
    green: SHARP_GREEN,
    greenBg: SHARP_GREEN_BG,
    greenText: SHARP_GREEN_TEXT,
    blue: SHARP_ACCENT,
    violet: '#8EA0FF',
    sand: '#8AABDE',
    white: SHARP_TEXT,
    overlay: 'rgba(5,15,30,0.6)',
    overlaySoft: 'rgba(0,0,0,0.35)',
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
  const C = THEMES[theme] || THEMES.dark
  const rich =
    theme === 'sharp'
      ? {
          heroSurface: SHARP_HERO_SURFACE,
          panelSurface: SHARP_PANEL_SURFACE,
          heroBorder: SHARP_HERO_BORDER,
          panelBorder: SHARP_PANEL_BORDER,
          heroInset: SHARP_HERO_INSET,
          heroShadow: SHARP_HERO_SHADOW,
          panelShadow: SHARP_PANEL_SHADOW,
        }
      : theme === 'dark'
        ? {
            heroSurface: DARK_HERO_SURFACE,
            panelSurface: DARK_PANEL_SURFACE,
            heroBorder: DARK_HERO_BORDER,
            panelBorder: DARK_PANEL_BORDER,
            heroInset: DARK_HERO_INSET,
            heroShadow: DARK_HERO_SHADOW,
            panelShadow: DARK_PANEL_SHADOW,
          }
        : theme === 'light'
          ? {
              heroSurface: LIGHT_HERO_SURFACE,
              panelSurface: LIGHT_PANEL_SURFACE,
              heroBorder: LIGHT_HERO_BORDER,
              panelBorder: LIGHT_PANEL_BORDER,
              heroInset: LIGHT_HERO_INSET,
              heroShadow: LIGHT_HERO_SHADOW,
              panelShadow: LIGHT_PANEL_SHADOW,
            }
        : {
            heroSurface: C.surface,
            panelSurface: C.surface2,
            heroBorder: `1px solid ${C.border}`,
            panelBorder: `1px solid ${C.border}`,
            heroInset: 'none',
            heroShadow: 'none',
            panelShadow: 'none',
          }
  return {
    '--bg': C.bg,
    '--surface': C.surface,
    '--surface2': C.surface2,
    '--surface3': C.surface3,
    '--panel': C.panel,
    '--panel-alt': C.panelAlt,
    '--border': C.border,
    '--border2': C.border2,
    '--text': C.text,
    '--text-secondary': C.textSecondary,
    '--text-muted': C.textMuted,
    '--text-faint': C.textFaint,
    '--accent': C.accent,
    '--accent-light': C.accentLight,
    '--accent-text': C.accentText,
    '--red': C.red,
    '--red-bg': C.redBg,
    '--red-text': C.redText,
    '--amber': C.amber,
    '--amber-bg': C.amberBg,
    '--amber-text': C.amberText,
    '--green': C.green,
    '--green-bg': C.greenBg,
    '--green-text': C.greenText,
    '--blue': C.blue,
    '--violet': C.violet,
    '--sand': C.sand,
    '--white': C.white,
    '--overlay': C.overlay,
    '--overlay-soft': C.overlaySoft,
    '--rich-hero-surface': rich.heroSurface,
    '--rich-panel-surface': rich.panelSurface,
    '--rich-hero-border': rich.heroBorder,
    '--rich-panel-border': rich.panelBorder,
    '--rich-hero-inset': rich.heroInset,
    '--rich-hero-shadow': rich.heroShadow,
    '--rich-panel-shadow': rich.panelShadow,
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
  foundation:  { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Foundation' },
  intelligence: { bg: 'var(--surface3)', color: 'var(--blue)', label: 'Intelligence' },
  essential:   { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Foundation' },
  business:    { bg: 'var(--surface3)', color: 'var(--blue)', label: 'Intelligence' },
  portfolio:   { bg: 'var(--surface3)', color: 'var(--violet)', label: 'Intelligence' },
  free:        { bg: 'var(--accent-light)', color: 'var(--accent-text)', label: 'Foundation' },
  paid:        { bg: 'var(--surface3)', color: 'var(--blue)', label: 'Intelligence' },
}

const TIERS = [
  {
    key: 'foundation',
    name: 'Foundation',
    price: '$29',
    desc: 'The truth about your business.',
    features: ['Full drill-down audit', 'Complete written report', 'Root cause diagnosis', 'Fix-first priority list', 'Email delivery'],
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    price: '$99',
    popular: true,
    desc: 'Persistent intelligence embedded into the business.',
    features: ['Everything in Foundation', 'AI opportunity breakdown', 'Re-audit anytime', 'Track progress'],
  },
]

const TIER_ORDER = { foundation: 0, intelligence: 1, essential: 0, business: 1, portfolio: 2, free: 0, paid: 1 }
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
const SECTIONS = ['home', 'reports', 'intelligence', 'business-state', 'alerts', 'connectors', 'agent', 'billing', 'account']

function normalizeTier(raw) {
  if (raw === 'intelligence') return 'intelligence'
  return 'foundation'
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

export default function Dashboard({ user, onStartAudit, onSignOut }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sa-theme') || 'dark')
  const themeVars = getThemeVars(theme)
  const sharpThemeActive = theme === 'sharp'
  const darkThemeActive = theme === 'dark'
  const lightThemeActive = theme === 'light'
  const richThemeActive = sharpThemeActive || darkThemeActive || lightThemeActive
  const [profile, setProfile] = useState(null)
  const [businessState, setBusinessState] = useState(null)
  const [businessStateLoading, setBusinessStateLoading] = useState(true)
  const [healthIntel, setHealthIntel] = useState(null)
  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [billing, setBilling] = useState(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [section, setSection] = useState(() => getSectionFromHash())
  const [requiresPayment, setRequiresPayment] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [scopeSetupOpen, setScopeSetupOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState('')
  const [updatingAlertIds, setUpdatingAlertIds] = useState({})
  const pendingAuditRef = useRef(null)

  const name = profile?.name?.trim() || user?.user_metadata?.name?.trim() || ''
  const email = user?.email || ''
  const initials = getInitials(name, email)
  const tier = normalizeTier(profile?.tier)
  const badge = TIER_BADGE[tier] || TIER_BADGE.essential

  useEffect(() => {
    localStorage.setItem('sa-theme', theme)
  }, [theme])

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
    if (!user) return
    let cancelled = false

    ;(async () => {
      try {
        const sb = await initSupabase()
        if (cancelled) return

        const { data, error } = await sb
          .from('profiles')
          .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete, shared_with_vnklo, shared_report_id, notification_email, last_digest_sent_at, last_digest_summary')
          .eq('id', user.id)
          .single()

        if (cancelled) return
        if (error) {
          console.error('[dashboard] profile fetch error:', error.message)
          return
        }

        if (data) {
          setProfile(data)
          // No tier and no subscription means the user signed up via OAuth but
          // never completed payment — gate them to the billing screen.
          if (!data.tier && !data.stripe_subscription_id) {
            setRequiresPayment(true)
            setSection('billing')
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800))
          const retry = await sb
            .from('profiles')
            .select('tier, industry, domain, context, name, phone, onboarding_complete, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete, shared_with_vnklo, shared_report_id, notification_email, last_digest_sent_at, last_digest_summary')
            .eq('id', user.id)
            .single()
          if (!cancelled && retry.data) {
            setProfile(retry.data)
            if (!retry.data.tier && !retry.data.stripe_subscription_id) {
              setRequiresPayment(true)
              setSection('billing')
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
    history.pushState({ section: nextSection }, '', `#${nextSection}`)
    setSection(nextSection)
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
    ensureScopeThen((scope) => onStartAudit({ ...baseAuditInfo(), ...scope }))
  }

  const startGoalAudit = (goalData) => {
    ensureScopeThen((scope) => onStartAudit({ ...baseAuditInfo(), ...scope, goalMode: true, ...goalData }))
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

  return (
    <div style={{ ...themeVars, ...styles.shell }} data-theme={theme}>
      {goalModal && (
        <GoalCaptureModal onClose={() => setGoalModal(false)} onStart={(goalData) => {
          setGoalModal(false)
          startGoalAudit(goalData)
        }} />
      )}
      {scopeSetupOpen && (
        <AuditScopeSetupModal
          user={user}
          onClose={() => {
            setScopeSetupOpen(false)
            pendingAuditRef.current = null
          }}
          onSaved={(scope) => {
            setProfile((prev) => ({ ...(prev || {}), ...scope }))
            setScopeSetupOpen(false)
            pendingAuditRef.current?.(scope)
            pendingAuditRef.current = null
          }}
        />
      )}

      <aside
        style={{
          ...styles.sidebar,
          ...(sidebarExpanded ? styles.sidebarExpanded : {}),
          ...(sharpThemeActive ? styles.sidebarSharp : {}),
          ...(darkThemeActive ? styles.sidebarDark : {}),
          ...(lightThemeActive ? styles.sidebarLight : {}),
        }}
      >
        <button
          type="button"
          onClick={() => setSidebarExpanded(p => !p)}
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: 34, height: 34,
            borderRadius: 8, border: 'none',
            background: richThemeActive ? 'rgba(255,255,255,0.03)' : 'transparent',
            color: G.textMuted,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            marginBottom: 6,
            alignSelf: sidebarExpanded ? 'flex-end' : 'center',
            boxShadow: richThemeActive ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
          }}
        >
          {sidebarExpanded
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
        </button>
        <SidebarButton icon={<IconHome />} active={section === 'home'} onClick={() => navigateSection('home')} label="Home" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <SidebarButton icon={<IconReports />} active={section === 'reports'} onClick={() => navigateSection('reports')} label="Reports" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <SidebarButton icon={<IconIntelligence />} active={section === 'intelligence'} onClick={() => navigateSection('intelligence')} label="Intelligence Brief" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <SidebarButton icon={<IconBrain />} active={section === 'business-state'} onClick={() => navigateSection('business-state')} label="What We Know" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <SidebarButton icon={<IconConnectors />} active={section === 'connectors'} onClick={() => navigateSection('connectors')} label="Connectors" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <SidebarButton icon={<IconAgent />} active={section === 'agent'} onClick={() => navigateSection('agent')} label="Ask SelfAudit" expanded={sidebarExpanded} sharpTheme={richThemeActive} />
        <div style={{ flex: 1 }} />
        <SidebarButton icon={<IconGear />} active={section === 'billing'} onClick={() => navigateSection('billing')} label="Billing" expanded={sidebarExpanded} />
        <button
          type="button"
          onClick={() => navigateSection('account')}
          style={{
            ...styles.avatarButton,
            ...(sidebarExpanded ? styles.avatarButtonExpanded : {}),
            ...(section === 'account' ? styles.avatarButtonActive : {}),
            ...(richThemeActive ? styles.avatarButtonSharp : {}),
            ...(richThemeActive && section === 'account' ? styles.avatarButtonActiveSharp : {}),
          }}
          aria-label="Account"
          title="Account"
        >
          <span style={{ ...styles.avatarChip, ...(section === 'account' ? styles.avatarChipActive : {}) }}>{initials}</span>
          {sidebarExpanded && <span style={styles.sidebarLabel}>Account</span>}
        </button>
      </aside>

      <div style={styles.appFrame}>
        <header style={{ ...styles.topbar, ...(sharpThemeActive ? styles.topbarSharp : {}), ...(darkThemeActive ? styles.topbarDark : {}), ...(lightThemeActive ? styles.topbarLight : {}) }}>
          <div style={styles.topbarLeft}>
            <div style={styles.logo} onClick={() => navigateSection('home')}>
              self<span style={{ color: G.accentText }}>audit</span>
            </div>
            <div style={styles.breadcrumb}>{sectionMeta[section] || '/ command centre'}</div>
          </div>

          <div style={styles.topbarActions}>
            <button type="button" style={{ ...styles.themeToggleButton, ...(richThemeActive ? styles.themeToggleButtonSharp : {}) }} onClick={toggleTheme} aria-label="Cycle theme">
              <span style={styles.themeToggleIcon}>◐</span>
              <span>Theme</span>
            </button>
            {tier === 'intelligence' && (
              <button type="button" style={{ ...styles.ghostButton, ...(richThemeActive ? styles.ghostButtonSharp : {}) }} onClick={() => navigateSection('alerts')}>
                <span>Alerts</span>
                <span style={styles.topbarCountBadge}>{alertsLoading ? '…' : alerts.length}</span>
              </button>
            )}
            <button type="button" style={{ ...styles.ghostButton, ...(richThemeActive ? styles.ghostButtonSharp : {}) }} onClick={startAudit}>
              diagnose a problem
            </button>
            <button type="button" style={styles.primaryButton} onClick={() => setGoalModal(true)}>
              map a goal
            </button>
          </div>
        </header>

        <main style={{ ...styles.main, ...(sharpThemeActive ? styles.mainSharp : {}), ...(darkThemeActive ? styles.mainDark : {}), ...(lightThemeActive ? styles.mainLight : {}) }}>
          {section === 'home' && (
            <HomeSection
              user={user}
              profile={profile}
              businessState={businessState}
              businessStateLoading={businessStateLoading}
              reports={reports}
              reportsLoading={reportsLoading}
              onStartAudit={startAudit}
              onStartGoalAudit={() => setGoalModal(true)}
              healthIntel={healthIntel}
              theme={theme}
            />
          )}

          {section === 'reports' && (
            <PageShell
              title="Reports"
              sub="Your saved audit reports."
            >
              {reportsLoading
                ? <ReportSkeletons />
                : reports.length > 0
                  ? <ReportList reports={reports} userId={user?.id} />
                  : <EmptyReports onStartAudit={startAudit} />}
            </PageShell>
          )}

          {section === 'intelligence' && (
            <PageShell>
              <IntelligenceBrief
                user={user}
                profile={profile}
                onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              />
            </PageShell>
          )}

          {section === 'business-state' && (
            <PageShell
              title="What we know"
              sub="Your current operating picture, compiled from saved audit context and editable when something changes."
            >
              <BusinessStateCard user={user} businessState={businessState} loading={businessStateLoading} />
            </PageShell>
          )}

          {section === 'alerts' && (
            <PageShell
              title="Alerts"
              sub="Review unresolved monitoring signals, acknowledge what you have seen, and resolve what is actually handled."
            >
              <AlertsInboxSection
                intelligenceUnlocked={tier === 'intelligence'}
                alerts={alerts}
                alertsLoading={alertsLoading}
                alertsError={alertsError}
                onRefreshAlerts={refreshAlerts}
                onUpdateAlert={updateAlertStatus}
                updatingAlertIds={updatingAlertIds}
              />
            </PageShell>
          )}

          {section === 'connectors' && (
            <ConnectorsSection user={user} />
          )}

          {section === 'agent' && (
            <AgentSection user={user} />
          )}

          {section === 'billing' && (
            <PageShell
              title="Subscription"
              sub={requiresPayment ? 'Choose a plan to activate your account and access the full dashboard.' : 'Your current plan is highlighted. Upgrade or downgrade any time.'}
            >
              {requiresPayment && (
                <div style={{ background: 'var(--amber-bg, #2a1f00)', border: '1px solid var(--amber, #d97706)', borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16 }}>⚠</span>
                  <span style={{ fontSize: 14, color: 'var(--amber, #d97706)', fontWeight: 500 }}>
                    Your account isn't active yet. Pick a plan below to get started.
                  </span>
                </div>
              )}
              {tier === 'intelligence' && (
                <LiveBillingCard
                  billing={billing}
                  billingLoading={billingLoading}
                  billingError={billingError}
                  onOpenPortal={openPortal}
                  portalLoading={portalLoading}
                />
              )}
              <div style={styles.tierGrid}>
                {TIERS.map((item) => (
                  <TierCard key={item.key} tier={item} currentTier={tier} userId={user?.id} email={user?.email} />
                ))}
              </div>
            </PageShell>
          )}

          {section === 'account' && (
            <AccountSection
              user={user}
              profile={profile}
              onProfileChange={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
              onSignOut={onSignOut}
            />
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

function HomeSection({ user, profile, businessState, businessStateLoading, reports, reportsLoading, onStartAudit, onStartGoalAudit, healthIntel, theme }) {
  const sharpThemeActive = theme === 'sharp' || theme === 'dark' || theme === 'light'
  const [businessHealthExpanded, setBusinessHealthExpanded] = useState(false)
  const [openIssuesExpanded, setOpenIssuesExpanded] = useState(false)
  const [auditHistoryExpanded, setAuditHistoryExpanded] = useState(false)
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
  const openIssuesCount = flaggedDomains.length
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
  const opportunityItems = buildAiOpportunityItems(reports, profile?.tier || 'foundation')
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
    if (!businessHealthExpanded && !openIssuesExpanded && !auditHistoryExpanded && !aiOpportunitiesExpanded && !weeklyDigestExpanded) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBusinessHealthExpanded(false)
        setOpenIssuesExpanded(false)
        setAuditHistoryExpanded(false)
        setAiOpportunitiesExpanded(false)
        setWeeklyDigestExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [businessHealthExpanded, openIssuesExpanded, auditHistoryExpanded, aiOpportunitiesExpanded, weeklyDigestExpanded])

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
                setAuditHistoryExpanded(false)
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
          value={reportsLoading ? '…' : healthScore ?? '—'}
          delta={healthScore === null ? 'No recent diagnostic report' : healthScore >= 70 ? 'Stable' : healthScore >= 45 ? 'Watch closely' : 'Needs attention'}
          tone={healthScore === null ? 'neutral' : healthScore >= 70 ? 'up' : healthScore >= 45 ? 'warn' : 'down'}
          hint={businessHealthExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setOpenIssuesExpanded(false)
            setAuditHistoryExpanded(false)
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
            setAuditHistoryExpanded(false)
            setAiOpportunitiesExpanded(false)
            setWeeklyDigestExpanded(false)
            setOpenIssuesExpanded((prev) => !prev)
          }}
          active={openIssuesExpanded}
        />
        <KpiCard
          sharpTheme={sharpThemeActive}
          label="Audit history"
          value={reportsLoading ? '…' : reports.length}
          delta={reports.length > 0 ? `Latest: ${lastReportDate}` : 'No reports yet'}
          tone="neutral"
          hint={auditHistoryExpanded ? 'Click to hide details' : 'Click for more'}
          onClick={() => {
            setBusinessHealthExpanded(false)
            setOpenIssuesExpanded(false)
            setAiOpportunitiesExpanded(false)
            setWeeklyDigestExpanded(false)
            setAuditHistoryExpanded((prev) => !prev)
          }}
          active={auditHistoryExpanded}
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
            setAuditHistoryExpanded(false)
            setWeeklyDigestExpanded(false)
            setAiOpportunitiesExpanded((prev) => !prev)
          }}
          active={aiOpportunitiesExpanded}
        />
      </div>

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
        <div style={styles.leftColumn}>
          <ExecutionPanel
            variant="dashboard"
            reports={reports}
            report={latestDiagnosticReport || latestReport}
            userInfo={shareUserInfo}
          />
        </div>

        <div style={styles.rightColumn}>
          <WeeklyDigestAlertsCard
            theme={theme}
            profile={profile}
            notificationPrefs={notificationPrefs}
            prefsLoading={prefsLoading}
            onClick={() => {
              setBusinessHealthExpanded(false)
              setOpenIssuesExpanded(false)
              setAuditHistoryExpanded(false)
              setAiOpportunitiesExpanded(false)
              setWeeklyDigestExpanded(true)
            }}
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

      {auditHistoryExpanded && (
        <div
          style={styles.businessHealthOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setAuditHistoryExpanded(false)
          }}
        >
          <div style={styles.businessHealthModal}>
            <AuditHistoryDetailPanel
              reports={reports}
              reportsLoading={reportsLoading}
              right={(
                <button
                  type="button"
                  style={styles.businessHealthCloseBtn}
                  onClick={() => setAuditHistoryExpanded(false)}
                  aria-label="Close audit history details"
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
              tier={profile?.tier || 'foundation'}
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

function AuditHistoryDetailPanel({ reports, reportsLoading, right = null }) {
  return (
    <PanelCard title="audit history" right={right}>
      {reportsLoading ? (
        <ReportSkeletons compact />
      ) : reports.length === 0 ? (
        <EmptyPanel message="No past audits yet." />
      ) : (
        <>
          <div style={styles.openIssuesSummaryRow}>
            <div style={styles.openIssuesSummaryValue}>{reports.length}</div>
            <div style={styles.openIssuesSummaryText}>
              {reports.length === 1 ? '1 saved audit so far' : `${reports.length} saved audits so far`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map((report) => (
              <AuditHistoryRow key={report.id} report={report} />
            ))}
          </div>
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

function FounderCheckInPanel({ draft, setDraft, saving, error, reportDate, onToggleArea, onSave, right = null }) {
  return (
    <PanelCard title="founder follow-up" right={right}>
      <div style={styles.weeklyDigestPrefsIntro}>
        Give SelfAudit the cleanest signal it can get: what actually changed since your {reportDate} audit. This becomes grounded context for future digests, alerts, and rankings.
      </div>

      <div style={styles.weeklyDigestFieldShell}>
        <span style={styles.businessHealthSectionTitle}>what happened since the last audit?</span>
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

      <div style={styles.weeklyDigestPrefsGrid}>
        <label style={styles.weeklyDigestFieldShell}>
          <span style={styles.businessHealthSectionTitle}>action follow-through</span>
          <select
            value={draft.actionStatus}
            onChange={(event) => setDraft((prev) => ({ ...prev, actionStatus: event.target.value }))}
            style={styles.weeklyDigestSelect}
          >
            <option value="done">We executed the key action</option>
            <option value="partial">We made partial progress</option>
            <option value="not_started">We have not acted on it yet</option>
          </select>
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

          <div style={styles.aiCtaWrap}>
            {shared ? (
              <div style={styles.aiSuccessText}>Already shared with VNKLO. We&apos;ll review the strongest opportunity and follow up.</div>
            ) : (
              <button type="button" style={styles.aiShareButton} onClick={handleShare} disabled={sharing || !sourceReport || !sourcePayload}>
                {sharing ? 'Sharing…' : 'Share strongest opportunity with VNKLO'}
              </button>
            )}
            {error && <div style={styles.aiErrorText}>{error}</div>}
          </div>
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

function PanelCard({ title, right, children }) {
  return (
    <div style={styles.panelCard}>
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
      const response = await fetch('/api/connect/hubspot/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
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
      await fetch('/api/connect/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, provider }),
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
                    onClick={() => { window.location.href = `/api/connect/${connector.id}/auth?state=${user.id}` }}
                  >
                    Connect {connector.name}
                  </button>
                )
              ) : (
                <div style={styles.connectorSoonText}>Available in a later release.</div>
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

function AccountSection({ user, profile, onProfileChange, onSignOut }) {
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

  return (
    <PageShell title="Account settings" sub="Manage your profile and preferences.">
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
        style={{ ...styles.reportCardHeader, background: open ? G.surface2 : 'transparent' }}
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

function TierCard({ tier, currentTier, userId, email }) {
  const [loading, setLoading] = useState(false)
  const current = tier.key === currentTier
  const isUpgrade = (TIER_ORDER[tier.key] ?? 0) > (TIER_ORDER[currentTier] ?? 0)
  const isDowngrade = (TIER_ORDER[tier.key] ?? 0) < (TIER_ORDER[currentTier] ?? 0)

  const handleCheckout = async () => {
    if (!userId || !email) return
    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ ...styles.tierCard, borderColor: current ? G.accent : G.border, background: current ? G.surface2 : G.surface }}>
      {current && <div style={styles.tierRibbon}>Current plan</div>}
      {tier.popular && !current && <div style={styles.tierRibbonAlt}>Most popular</div>}
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
      {isUpgrade && (
        <button type="button" onClick={handleCheckout} disabled={loading} style={styles.tierUpgradeBtn}>
          {loading ? 'Redirecting…' : `Upgrade to ${tier.name}`}
        </button>
      )}
      {isDowngrade && (
        <button type="button" onClick={handleCheckout} disabled={loading} style={styles.tierDowngradeBtn}>
          {loading ? 'Redirecting…' : `Downgrade to ${tier.name}`}
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
    background: G.surface,
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
    background: G.surface2,
    border: `1px solid ${G.border}`,
    borderRadius: 10,
    overflow: 'hidden',
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
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
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
    background: G.surface2,
    border: `0.5px solid ${G.border}`,
    borderRadius: 12,
    padding: '4px 0',
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
