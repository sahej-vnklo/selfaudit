import React, { useEffect, useMemo, useRef, useState } from 'react'
import { initSupabase } from '../lib/supabase.js'

// ── Cube geometry ──────────────────────────────────────────────────────────────
const CUBE = {
  primary: { w: 54, topH: 14, bodyH: 48, half: 27 },
  driver:  { w: 40, topH: 10, bodyH: 32, half: 20 },
  health:  { w: 32, topH:  8, bodyH: 26, half: 16 },
}

// ── Per-area neutral tints (subtle distinction per domain) ─────────────────────
const TINT = {
  'finance-accounting':   { t: '#ECE9E1', l: '#C8C3B4', r: '#B3ADA1' },
  'customer-service':     { t: '#E1EAEB', l: '#B4C6CB', r: '#9BB0B5' },
  'marketing-sales':      { t: '#E1EAE3', l: '#B4C5B5', r: '#9BABA0' },
  'management-strategy':  { t: '#EBE1E1', l: '#C5B5B5', r: '#B09898' },
  'revenue-sales':        { t: '#EAE7E1', l: '#C4BFB3', r: '#ADA89D' },
  'inventory-operations': { t: '#E5E8E8', l: '#B9C1C2', r: '#9EA9A9' },
  'production':           { t: '#E7E7E5', l: '#C1C0BB', r: '#A9A8A2' },
  'client-delivery':      { t: '#E1E8E6', l: '#B4C4C0', r: '#9BAEAA' },
  'product-engineering':  { t: '#E3E5EA', l: '#B5BCCA', r: '#9BA5B4' },
  'people-hr':            { t: '#E8E4EB', l: '#C4BCCA', r: '#AFA3B4' },
  _default:               { t: '#E8E6E0', l: '#C4C1B8', r: '#ADAAA2' },
}

const STATE_COLORS = {
  bad:  { t: '#F7C1C1', l: '#E24B4A', r: '#A32D2D' },
  warn: { t: '#FAC775', l: '#EF9F27', r: '#BA7517' },
  good: { t: '#C0DD97', l: '#639922', r: '#3B6D11' },
}

const STATE_TEXT  = { neutral: '#2C2C2A', bad: '#A32D2D', warn: '#854F0B', good: '#3B6D11' }
const STATE_LABEL = { neutral: '#888780', bad: '#791F1F', warn: '#633806', good: '#27500A' }
const STATE_LINE  = { neutral: '#D3D1C7', bad: '#E24B4A', warn: '#EF9F27', good: '#639922' }

// ── Per-area layout configs — each area has its own spatial fingerprint ─────────
// SVG viewBox is 0 0 210 222. Metric positions are top-left of the cube.
const AREA_LAYOUTS = {

  // Finance: symmetric crown — two inputs top, MRR center, two health bottom
  'finance-accounting': {
    positions: {
      churn_rate:    { type: 'driver',  x: 10,  y: 14  },
      burn_rate:     { type: 'driver',  x: 150, y: 14  },
      mrr:           { type: 'primary', x: 73,  y: 78  },
      runway_months: { type: 'health',  x: 15,  y: 165 },
      ltv_cac_ratio: { type: 'health',  x: 154, y: 165 },
    },
    connections: [
      ['churn_rate', 'mrr'],
      ['burn_rate',  'mrr'],
      ['mrr', 'runway_months'],
      ['mrr', 'ltv_cac_ratio'],
    ],
  },

  // Customer Service: left-column inputs cascade into right-side CSAT outcome
  'customer-service': {
    positions: {
      ticket_volume:      { type: 'health',  x: 5,   y: 6   },
      first_response_time:{ type: 'driver',  x: 5,   y: 80  },
      csat:               { type: 'primary', x: 120, y: 58  },
      resolution_time:    { type: 'driver',  x: 5,   y: 150 },
      repeat_issue_rate:  { type: 'health',  x: 158, y: 156 },
    },
    connections: [
      ['ticket_volume',       'first_response_time'],
      ['first_response_time', 'csat'],
      ['resolution_time',     'csat'],
      ['repeat_issue_rate',   'csat'],
    ],
  },

  // Marketing & Sales: L-shape — left-column funnel gates, right-side pipeline outcome
  'marketing-sales': {
    positions: {
      lead_volume:     { type: 'driver',  x: 8,   y: 10  },
      stage_conversion:{ type: 'driver',  x: 8,   y: 88  },
      pipeline_value:  { type: 'primary', x: 110, y: 70  },
      open_deals:      { type: 'health',  x: 110, y: 165 },
      sales_cycle_days:{ type: 'health',  x: 10,  y: 170 },
    },
    connections: [
      ['lead_volume',      'stage_conversion'],
      ['stage_conversion', 'pipeline_value'],
      ['pipeline_value',   'open_deals'],
      ['pipeline_value',   'sales_cycle_days'],
    ],
  },

  // Management: organic scatter — blockers and backlog converge on goal from different angles
  'management-strategy': {
    positions: {
      priority_backlog:   { type: 'health',  x: 5,   y: 8   },
      repeated_blockers:  { type: 'health',  x: 155, y: 8   },
      followthrough_rate: { type: 'driver',  x: 8,   y: 98  },
      goal_progress:      { type: 'primary', x: 100, y: 74  },
      watchouts:          { type: 'health',  x: 85,  y: 170 },
    },
    connections: [
      ['priority_backlog',   'followthrough_rate'],
      ['repeated_blockers',  'goal_progress'],
      ['followthrough_rate', 'goal_progress'],
      ['goal_progress',      'watchouts'],
    ],
  },

  // Revenue & Sales (ecommerce): inverted — daily revenue at top-center, drivers below
  'revenue-sales': {
    positions: {
      daily_revenue:   { type: 'primary', x: 73,  y: 8   },
      conversion_rate: { type: 'driver',  x: 8,   y: 98  },
      aov:             { type: 'driver',  x: 150, y: 98  },
      repeat_rate:     { type: 'health',  x: 8,   y: 170 },
      refund_rate:     { type: 'health',  x: 155, y: 170 },
    },
    connections: [
      ['conversion_rate', 'daily_revenue'],
      ['aov',             'daily_revenue'],
      ['refund_rate',     'repeat_rate'],
      ['daily_revenue',   'repeat_rate'],
    ],
  },

  // Inventory: supply-chain horizontal — stock level left, out-of-stock primary right
  'inventory-operations': {
    positions: {
      avg_days_of_stock:   { type: 'driver',  x: 5,   y: 10  },
      supplier_lead_time:  { type: 'driver',  x: 5,   y: 92  },
      out_of_stock_skus:   { type: 'primary', x: 112, y: 62  },
      fulfilment_time_hrs: { type: 'health',  x: 112, y: 162 },
      overstock_skus:      { type: 'health',  x: 155, y: 5   },
    },
    connections: [
      ['avg_days_of_stock',  'out_of_stock_skus'],
      ['supplier_lead_time', 'out_of_stock_skus'],
      ['out_of_stock_skus',  'fulfilment_time_hrs'],
    ],
  },

  // Production: industrial — uptime + defect left side, OEE right, output/scrap below
  'production': {
    positions: {
      avg_machine_uptime: { type: 'driver',  x: 8,   y: 8   },
      defect_rate:        { type: 'driver',  x: 8,   y: 118 },
      oee:                { type: 'primary', x: 118, y: 58  },
      output_vs_plan:     { type: 'health',  x: 60,  y: 164 },
      scrap_rate:         { type: 'health',  x: 155, y: 158 },
    },
    connections: [
      ['avg_machine_uptime', 'oee'],
      ['defect_rate',        'oee'],
      ['oee',                'output_vs_plan'],
      ['defect_rate',        'scrap_rate'],
    ],
  },

  // Client Delivery: risk flow — utilisation + milestones → projects at risk → satisfaction
  'client-delivery': {
    positions: {
      utilisation_rate:    { type: 'driver',  x: 5,   y: 8   },
      overdue_milestones:  { type: 'driver',  x: 150, y: 8   },
      projects_at_risk:    { type: 'primary', x: 73,  y: 78  },
      avg_client_csat:     { type: 'health',  x: 155, y: 158 },
      avg_budget_consumed: { type: 'health',  x: 10,  y: 168 },
    },
    connections: [
      ['utilisation_rate',   'projects_at_risk'],
      ['overdue_milestones', 'projects_at_risk'],
      ['projects_at_risk',   'avg_client_csat'],
      ['projects_at_risk',   'avg_budget_consumed'],
    ],
  },
}

// Fallback: compute generic positions for any unknown area
function fallbackPositions(metrics) {
  const slots = [
    { type: 'driver',  x: 10,  y: 14  },
    { type: 'driver',  x: 150, y: 14  },
    { type: 'primary', x: 73,  y: 78  },
    { type: 'health',  x: 15,  y: 165 },
    { type: 'health',  x: 154, y: 165 },
    { type: 'health',  x: 80,  y: 165 },
  ]
  const positions = {}
  metrics.forEach((m, i) => {
    const p = slots[i] || { type: 'health', x: 8, y: 8 + i * 52 }
    positions[m.key] = p
  })
  return positions
}

// ── SVG helpers ────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function trunc(label, max = 14) {
  const s = String(label || '')
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function getCubeColors(state, areaId) {
  if (state !== 'neutral') return STATE_COLORS[state]
  return TINT[areaId] || TINT._default
}

function cubeSVG(m, state, areaId, value) {
  const d = CUBE[m.type]
  const c = getCubeColors(state, areaId)
  const tc = STATE_TEXT[state]
  const lc = STATE_LABEL[state]
  const cx = d.half
  const topFace  = `${cx},0 ${d.w},${d.topH} ${cx},${d.topH * 2} 0,${d.topH}`
  const leftFace = `0,${d.topH} ${cx},${d.topH * 2} ${cx},${d.topH * 2 + d.bodyH} 0,${d.topH + d.bodyH}`
  const rightFace = `${d.w},${d.topH} ${cx},${d.topH * 2} ${cx},${d.topH * 2 + d.bodyH} ${d.w},${d.topH + d.bodyH}`
  const lblY = d.topH * 2 + d.bodyH + 12
  const valY = d.topH * 2 + d.bodyH + 25
  const lblSize = m.type === 'primary' ? 8 : 7.5
  const valSize = m.type === 'primary' ? 12.5 : m.type === 'driver' ? 10.5 : 9.5
  return `<g transform="translate(${m.x},${m.y})">
    <polygon points="${topFace}" fill="${c.t}"/>
    <polygon points="${leftFace}" fill="${c.l}"/>
    <polygon points="${rightFace}" fill="${c.r}"/>
    <text x="${cx}" y="${lblY}" text-anchor="middle" font-size="${lblSize}" fill="${lc}" font-family="sans-serif">${esc(trunc(m.label))}</text>
    <text x="${cx}" y="${valY}" text-anchor="middle" font-size="${valSize}" font-weight="700" fill="${tc}" font-family="sans-serif">${esc(value)}</text>
  </g>`
}

function connLine(fromM, toM, areaState) {
  const fd = CUBE[fromM.type], td = CUBE[toM.type]
  const fx = fromM.x + fd.half
  const fy = fromM.y + fd.topH * 2 + fd.bodyH
  const tx = toM.x + td.half
  const ty = toM.y + td.topH
  const stroke = STATE_LINE[areaState] || STATE_LINE.neutral
  const strokeW = areaState !== 'neutral' ? 1 : 0.5
  const opacity = areaState !== 'neutral' ? 0.85 : 0.55
  return `<line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="3,2" opacity="${opacity}"/>`
}

function buildAreaSVG(area, metricStates, metricValues) {
  const config = AREA_LAYOUTS[area.id]
  const positions = config ? config.positions : fallbackPositions(area.metrics)
  const connections = config?.connections || []

  const positionedMetrics = area.metrics
    .filter(m => positions[m.key])
    .map(m => ({ ...m, ...positions[m.key] }))

  const posMap = Object.fromEntries(positionedMetrics.map(m => [m.key, m]))

  const worstAreaState = (() => {
    const ss = area.metrics.map(m => metricStates[`${area.id}:${m.key}`] || 'neutral')
    if (ss.includes('bad')) return 'bad'
    if (ss.includes('warn')) return 'warn'
    return 'neutral'
  })()

  const lines = connections
    .map(([fk, tk]) => {
      const fm = posMap[fk], tm = posMap[tk]
      return fm && tm ? connLine(fm, tm, worstAreaState) : ''
    })
    .join('')

  const cubes = positionedMetrics
    .map(m => {
      const state = metricStates[`${area.id}:${m.key}`] || 'neutral'
      const value = metricValues[`${area.id}:${m.key}`] || '—'
      return cubeSVG(m, state, area.id, value)
    })
    .join('')

  return lines + cubes
}

// ── Scenario parsing ───────────────────────────────────────────────────────────
// Common synonyms so users can speak naturally
const METRIC_SYNONYMS = {
  churn:       ['churn', 'churn rate', 'monthly churn', 'customer churn'],
  mrr:         ['mrr', 'revenue', 'monthly revenue', 'monthly recurring'],
  pipeline_value: ['pipeline', 'pipeline value', 'deals pipeline', 'deal pipeline'],
  open_deals:  ['deals', 'open deals', 'number of deals'],
  lead_volume: ['leads', 'lead volume', 'lead flow', 'inbound leads'],
  stage_conversion: ['conversion', 'conversion rate', 'stage conversion', 'deal conversion'],
  burn_rate:   ['burn', 'burn rate', 'monthly burn'],
  runway_months: ['runway', 'cash runway', 'months of runway'],
  ltv:         ['ltv', 'lifetime value', 'customer lifetime value'],
  cac:         ['cac', 'acquisition cost', 'customer acquisition'],
  csat:        ['csat', 'satisfaction', 'customer satisfaction', 'nps'],
  headcount:   ['headcount', 'team size', 'employees', 'staff'],
}

function parseScenario(text, allMetrics) {
  const lower = text.toLowerCase()

  // Try to find a metric — first by synonym map, then by label/key substring
  let metric = null

  for (const [key, synonyms] of Object.entries(METRIC_SYNONYMS)) {
    if (synonyms.some(s => lower.includes(s))) {
      metric = allMetrics.find(m => m.key === key)
      if (metric) break
    }
  }

  if (!metric) {
    metric = allMetrics.find(m =>
      lower.includes(m.label.toLowerCase()) ||
      lower.includes(m.key.replace(/_/g, ' ')) ||
      m.key.split('_').some(word => word.length > 3 && lower.includes(word))
    )
  }

  if (!metric) return null

  const numMatch = text.match(/[\d.]+/)
  if (!numMatch) return null
  const value = parseFloat(numMatch[0])
  if (!Number.isFinite(value)) return null

  const hasPercent = lower.includes('%') || metric.unit === 'percent'
  let deltaType = 'set', deltaValue = value
  if (lower.match(/increase|up\b|grow|rise|\+/) && hasPercent)      { deltaType = 'percent'; deltaValue = value }
  else if (lower.match(/drop|decreas|down\b|fall|lose|lose|-/) && hasPercent) { deltaType = 'percent'; deltaValue = -value }
  else if (lower.match(/increase|up\b|grow|rise|\+/))                { deltaType = 'absolute'; deltaValue = value }
  else if (lower.match(/drop|decreas|down\b|fall|lose|by\s+\d|-/))  { deltaType = 'percent'; deltaValue = -value }

  return {
    metricKey: metric.key,
    deltaType,
    deltaValue,
    label: deltaType === 'percent'
      ? `${metric.label} ${deltaValue < 0 ? '−' : '+'}${value}%`
      : `${metric.label} → ${value}${hasPercent ? '%' : ''}`,
  }
}

// ── Result → canvas state mapping ─────────────────────────────────────────────
const STATUS_RANK = { neutral: 0, good: 1, warn: 2, bad: 3 }

function mapResult(result, areas) {
  const metricArea = {}
  for (const area of areas) {
    for (const m of area.metrics) metricArea[m.key] = area.id
  }

  const states = {}, values = {}

  const triggerKey = result.cascade?.triggerMetricKey
  if (triggerKey) {
    const areaId = metricArea[triggerKey]
    if (areaId) {
      states[`${areaId}:${triggerKey}`] = 'bad'
      const patch = result.appliedPatch
      if (patch?.after != null) {
        const area = areas.find(a => a.id === areaId)
        const m = area?.metrics.find(x => x.key === triggerKey)
        if (m) values[`${areaId}:${triggerKey}`] = fmtVal(patch.after, m.unit)
      }
    }
  }

  for (const finding of result.scenario?.findings || []) {
    const mk = finding.metricKey
    if (!mk) continue
    const areaId = metricArea[mk] || finding.areaId
    if (!areaId) continue
    const k = `${areaId}:${mk}`
    const st = finding.status === 'bad' ? 'bad' : finding.status === 'watch' ? 'warn' : 'neutral'
    if ((STATUS_RANK[st] || 0) > (STATUS_RANK[states[k]] || 0)) states[k] = st
  }

  return { states, values }
}

function fmtVal(v, unit) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  if (unit === 'percent') return `${n.toFixed(1)}%`
  if (unit === 'currency') {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
    return `$${n.toFixed(0)}`
  }
  if (unit === 'months') return `${n.toFixed(0)}mo`
  if (unit === 'days')   return `${n.toFixed(0)}d`
  if (unit === 'hours')  return `${n.toFixed(0)}h`
  if (unit === 'ratio')  return `${n.toFixed(1)}x`
  return `${n}`
}

// ── Dynamic suggestion pills from user schema ──────────────────────────────────
const SUGGESTION_CATALOG = [
  { keys: ['churn_rate'],       text: 'What if churn hits 7%?',              deltaType: 'set',     deltaValue: 7,   label: 'Churn → 7%' },
  { keys: ['csat'],             text: 'What if CSAT drops to 75?',            deltaType: 'set',     deltaValue: 75,  label: 'CSAT → 75' },
  { keys: ['pipeline_value'],   text: 'What if pipeline drops 30%?',          deltaType: 'percent', deltaValue: -30, label: 'Pipeline −30%' },
  { keys: ['mrr'],              text: 'What if MRR drops 20%?',               deltaType: 'percent', deltaValue: -20, label: 'MRR −20%' },
  { keys: ['runway_months'],    text: 'What if runway falls to 8 months?',    deltaType: 'set',     deltaValue: 8,   label: 'Runway → 8mo' },
  { keys: ['avg_machine_uptime'], text: 'What if machine uptime drops to 75%?', deltaType: 'set',  deltaValue: 75,  label: 'Uptime → 75%' },
  { keys: ['d30_retention'],    text: 'What if D30 retention falls to 8%?',   deltaType: 'set',     deltaValue: 8,   label: 'D30 → 8%' },
  { keys: ['daily_revenue'],    text: 'What if daily revenue drops 25%?',     deltaType: 'percent', deltaValue: -25, label: 'Revenue −25%' },
  { keys: ['out_of_stock_skus'], text: 'What if 5 SKUs go out of stock?',     deltaType: 'set',     deltaValue: 5,   label: 'OOS → 5 SKUs' },
  { keys: ['projects_at_risk'], text: 'What if 2 projects go at risk?',       deltaType: 'set',     deltaValue: 2,   label: 'At-risk → 2' },
]

function buildSuggestions(allMetrics) {
  const metricKeys = new Set(allMetrics.map(m => m.key))
  const pills = []
  for (const sg of SUGGESTION_CATALOG) {
    const matchKey = sg.keys.find(k => metricKeys.has(k))
    if (matchKey) {
      pills.push({ text: sg.text, metricKey: matchKey, deltaType: sg.deltaType, deltaValue: sg.deltaValue, label: sg.label })
      if (pills.length === 3) break
    }
  }
  if (pills.length === 0 && allMetrics.length > 0) {
    const m = allMetrics[0]
    pills.push({ text: `What if ${m.label} drops 20%?`, metricKey: m.key, deltaType: 'percent', deltaValue: -20, label: `${m.label} −20%` })
  }
  return pills
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingDots() {
  const [n, setN] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setN(c => (c % 3) + 1), 380)
    return () => clearInterval(t)
  }, [])
  return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{'·'.repeat(n)}</span>
}

// ── Grid helper ────────────────────────────────────────────────────────────────
function gridCols(n) {
  if (n <= 2) return 2
  if (n <= 4) return 2
  if (n <= 6) return 3
  return 4
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SimulationPage({ userId }) {
  const [areas, setAreas] = useState([])
  const [allMetrics, setAllMetrics] = useState([])
  const [hasSchema, setHasSchema] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')

  const [metricStates, setMetricStates] = useState({})
  const [metricValues, setMetricValues] = useState({})

  const [messages, setMessages] = useState([
    { role: 'ai', text: 'This is your what-if engine.\n\nShift any metric and every connected area updates instantly — based on your actual business logic, not a generic model.\n\nPick a scenario below or type your own: "What if churn hits 8%?" or "What if pipeline drops 30%?"' },
  ])
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [scenariosUsed, setScenariosUsed] = useState(false)

  const msgsEndRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      try {
        const sb = await initSupabase()
        const { data: { session } } = await sb.auth.getSession()
        const token = session?.access_token || ''

        const res = await fetch(`/api/simulate-metrics?userId=${encodeURIComponent(userId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('Failed to load metrics')
        const data = await res.json().catch(() => ({}))

        setAreas(data.areas || [])
        setAllMetrics(data.metrics || [])
        setHasSchema(data.hasSchema !== false)
      } catch (err) {
        setDataError(err?.message || 'Could not load simulation context.')
        setHasSchema(false)
      } finally {
        setDataLoading(false)
      }
    })()
  }, [userId])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const suggestions = useMemo(() => buildSuggestions(allMetrics), [allMetrics])

  const runScenario = async (scenario) => {
    if (isRunning) return
    setIsRunning(true)

    const label = scenario.label || scenario.text || scenario.metricKey
    setMessages(prev => [
      ...prev,
      { role: 'user', text: label },
      { role: 'ai', typing: true },
    ])

    try {
      const sb = await initSupabase()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token || ''

      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, scenario }),
      })

      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.error || 'Simulation failed')

      const { states, values } = mapResult(result, areas)
      setMetricStates(states)
      setMetricValues(values)
      setScenariosUsed(true)

      const delta = result.delta || {}
      const patch = result.appliedPatch || {}
      const newFindings = delta.newFindings || []
      const worsenedFindings = delta.worsenedFindings || []
      const improvedFindings = delta.improvedFindings || []
      const areaChanges = delta.areaStatusChanges || []

      // Detect unit from metric key for human-readable formatting
      const mk = patch.metricKey || ''
      const isPercent = mk.includes('rate') || mk.includes('pct') || mk.includes('churn') || mk.includes('margin') || mk.includes('conversion')
      const isMoney  = mk.includes('mrr') || mk.includes('revenue') || mk.includes('value') || mk.includes('arr') || mk.includes('ltv') || mk.includes('cac')
      const fmtVal = (v) => {
        if (v == null) return null
        const n = Math.round(v * 100) / 100
        if (isMoney) return `$${n.toLocaleString()}`
        if (isPercent) return `${n}%`
        return String(n)
      }
      const beforeStr = patch.before != null ? fmtVal(patch.before) : null
      const afterStr  = fmtVal(patch.after) ?? String(patch.after)
      const metricLabel = scenario.label || mk.replace(/_/g, ' ')

      const cleanLabel = mk.replace(/_/g, ' ')
      const lines = []
      lines.push(beforeStr
        ? `If ${cleanLabel} goes to ${afterStr} (currently ${beforeStr}):`
        : `Simulating ${cleanLabel} at ${afterStr}:`)

      if (newFindings.length || worsenedFindings.length) {
        const triggered = [...newFindings, ...worsenedFindings]
        // Dedupe: if multiple findings fire on the same metric key, keep only worst severity
        const sevRank = { critical: 4, high: 3, medium: 2, low: 1 }
        const seen = new Map()
        for (const f of triggered) {
          const key = f.metricKey || f.areaId || f.title
          const existing = seen.get(key)
          if (!existing || (sevRank[f.severity] || 0) > (sevRank[existing.severity] || 0)) seen.set(key, f)
        }
        const deduped = [...seen.values()].slice(0, 3)
        deduped.forEach(f => {
          const desc = f.summary || f.description || f.title
          lines.push(`• ${desc}`)
        })
      } else if (improvedFindings.length) {
        lines.push(`This actually helps — ${improvedFindings.length} issue${improvedFindings.length > 1 ? 's' : ''} move in the right direction.`)
      } else {
        lines.push('No threshold breaches at this level. You\'re still in the safe zone.')
      }

      if (areaChanges.length) {
        const changeStr = areaChanges.map(c => {
          const label = c.areaId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
          return `${label} moves from ${c.before} → ${c.after}`
        }).join('. ')
        lines.push(changeStr + '.')
      }

      const cascade = result.cascade?.downstream || []
      if (cascade.length) {
        const chain = cascade.slice(0, 3).map(c => c.nodeId).join(' → ')
        lines.push(`Downstream pressure: ${chain}.`)
      }

      let reply = lines.join('\n\n')

      setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: reply }])
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'ai', text: err?.message || 'Simulation failed. Check your connection.' },
      ])
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isRunning) return
    setInput('')
    const parsed = parseScenario(text, allMetrics)
    if (parsed) {
      runScenario(parsed)
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'ai', text: `I didn't catch which metric you meant. Try something like:\n\n"What if churn hits 7%?"\n"What if pipeline drops 30%?"\n"What if MRR grows 20%?"` },
      ])
    }
  }

  const handleReset = () => {
    setMetricStates({})
    setMetricValues({})
  }

  const cols = gridCols(areas.length)

  // ── Render ──
  return (
    <div style={st.page}>
      {dataLoading ? (
        <div style={st.status}>Loading your business canvas…</div>
      ) : dataError ? (
        <div style={st.status}>{dataError}</div>
      ) : !hasSchema || areas.length === 0 ? (
        <div style={{ ...st.status, ...st.statusCard }}>
          <div style={st.eyebrow}>Simulate</div>
          <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Complete onboarding to configure your business areas before running simulations.
          </p>
        </div>
      ) : (
        <div style={st.main}>

          {/* Left: canvas grid */}
          <div
            style={{
              ...st.canvas,
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {areas.map((area) => (
              <div key={area.id} style={st.abox}>
                <div style={st.aname}>{area.label}</div>
                {!area.hasMetrics ? (
                  <div style={st.noLogic}>
                    <div style={st.nlText}>No metrics defined</div>
                    <div style={st.nlSub}>Go to Logic to configure this area</div>
                  </div>
                ) : (
                  <svg
                    style={st.asvg}
                    viewBox="0 0 210 222"
                    preserveAspectRatio="xMidYMid meet"
                    dangerouslySetInnerHTML={{ __html: buildAreaSVG(area, metricStates, metricValues) }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Right: chat panel */}
          <div style={st.chat}>
            <div style={st.chatHead}>
              <div style={st.chatTitle}>What-if</div>
              <div style={st.chatSub}>Real-time cascade engine</div>
            </div>

            {suggestions.length > 0 && !scenariosUsed && (
              <div style={st.pills}>
                <div style={st.pillsLabel}>Quick scenarios</div>
                {suggestions.map((sg, i) => (
                  <button
                    key={i}
                    style={st.pill}
                    onClick={() => runScenario(sg)}
                    disabled={isRunning}
                  >
                    {sg.text}
                  </button>
                ))}
              </div>
            )}

            <div style={st.msgs}>
              {messages.map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? st.msgUser : st.msgAi}>
                  {msg.typing ? <TypingDots /> : (
                    <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
                  )}
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>

            {Object.keys(metricStates).length > 0 && (
              <button style={st.resetBtn} onClick={handleReset}>Reset canvas</button>
            )}

            <div style={st.inputRow}>
              <input
                style={st.input}
                value={input}
                placeholder="What if churn hits 7%?"
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={isRunning}
              />
              <button
                style={st.sendBtn}
                onClick={handleSubmit}
                disabled={isRunning || !input.trim()}
                aria-label="Send"
              >
                <i className="ti ti-arrow-right" style={{ fontSize: 13, color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const st = {
  page: {},
  eyebrow: { fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-text)' },

  status: { padding: '14px 0', color: 'var(--text-secondary)', fontSize: 14 },
  statusCard: {
    padding: 24, borderRadius: 16, background: 'var(--surface)',
    border: '1px solid var(--border)', maxWidth: 500,
  },

  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 230px',
    borderRadius: 18,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    height: 'calc(100vh - 120px)',
    boxShadow: '0 18px 40px -28px rgba(0,0,0,0.35)',
  },

  canvas: {
    display: 'grid',
    overflow: 'hidden',
  },

  abox: {
    borderRight: '0.5px solid var(--border)',
    borderBottom: '0.5px solid var(--border)',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
  },

  aname: {
    fontSize: 13,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 500,
    flexShrink: 0,
    marginBottom: 2,
  },

  asvg: { flex: 1, width: '100%', display: 'block', overflow: 'visible' },

  noLogic: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    border: '0.5px dashed var(--border)',
    borderRadius: 8,
    marginTop: 6,
  },
  nlText: { fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' },
  nlSub:  { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 130, lineHeight: 1.4 },

  // Chat
  chat: {
    borderLeft: '0.5px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  chatHead: {
    padding: '10px 12px',
    borderBottom: '0.5px solid var(--border)',
    flexShrink: 0,
  },
  chatTitle: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  chatSub:   { fontSize: 13, color: 'var(--text-secondary)', marginTop: 1 },

  pills: { padding: '8px 10px 4px', flexShrink: 0 },
  pillsLabel: {
    fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: 'var(--text-muted)', marginBottom: 4,
  },
  pill: {
    display: 'block', width: '100%', textAlign: 'left',
    fontSize: 13, padding: '5px 8px', marginBottom: 3,
    borderRadius: 6, border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer',
    color: 'var(--text-secondary)', fontFamily: 'inherit',
  },

  msgs: {
    flex: 1, overflowY: 'auto',
    padding: '8px 10px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  msgUser: {
    fontSize: 13, lineHeight: 1.5, padding: '7px 9px',
    borderRadius: 7, background: 'var(--surface)',
    color: 'var(--text)', alignSelf: 'flex-end', maxWidth: '90%',
  },
  msgAi: {
    fontSize: 13, lineHeight: 1.5, padding: '7px 9px',
    borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text)',
  },

  resetBtn: {
    margin: '0 10px 4px',
    fontSize: 13, padding: '4px 8px', borderRadius: 5,
    border: '1px solid var(--border)', background: 'transparent',
    cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit',
    textAlign: 'left',
  },

  inputRow: {
    padding: '8px 10px', borderTop: '0.5px solid var(--border)',
    display: 'flex', gap: 5, flexShrink: 0,
  },
  input: {
    flex: 1, fontSize: 13, border: '1px solid var(--border)',
    borderRadius: 6, padding: '6px 8px',
    background: 'var(--surface)', color: 'var(--text)',
    fontFamily: 'inherit', outline: 'none',
  },
  sendBtn: {
    width: 26, height: 26, borderRadius: 6,
    border: '1px solid var(--border)', background: 'transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
}
