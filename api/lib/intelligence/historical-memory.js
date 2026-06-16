const PRIORITY_METRICS = [
  'churn_rate',
  'mrr',
  'runway_months',
  'ltv_cac_ratio',
  'open_deals',
  'pipeline_value',
  'goal_progress',
  'followthrough_rate',
  'first_response_time',
  'csat',
]

const MODE_DESCRIPTIONS = {
  year_over_year: 'last 30 days vs nearest 30-day window 12 months earlier',
  quarter_over_quarter: 'last 30 days vs comparable window 3 months earlier',
  month_over_month: 'last 4 weeks vs prior 4 weeks',
}

const SCHEMA_MATCH_LABELS = {
  match: 'yes',
  partial_schema_match: 'partial (schema changed between periods)',
  unknown: 'unknown',
}

function startOfUtcDay(value) {
  const date = new Date(value)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function daysBetween(earliest, latest) {
  const ms = startOfUtcDay(latest).getTime() - startOfUtcDay(earliest).getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

function bucketDay(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function isFiniteNumber(value) {
  const num = Number(value)
  return Number.isFinite(num)
}

function inferUnit(metricKey) {
  const key = String(metricKey || '').toLowerCase()
  if (key.endsWith('_rate') || key === 'csat') return 'percent'
  if (key.includes('mrr') || key.includes('pipeline') || key.includes('ltv')) return 'currency'
  return 'number'
}

function formatLabel(metricKey) {
  const custom = {
    churn_rate: 'Churn rate',
    mrr: 'MRR',
    runway_months: 'Runway',
    ltv_cac_ratio: 'LTV:CAC',
    open_deals: 'Open deals',
    pipeline_value: 'Pipeline value',
    goal_progress: 'Goal progress',
    followthrough_rate: 'Followthrough rate',
    first_response_time: 'First response time',
    csat: 'CSAT',
  }
  return custom[metricKey] || String(metricKey || '').replace(/_/g, ' ')
}

function formatMetricValue(value, unit, metricKey) {
  if (!isFiniteNumber(value)) return 'n/a'
  const num = Number(value)

  if (unit === 'percent') {
    return `${Number(num.toFixed(1))}%`
  }

  if (unit === 'currency') {
    if (metricKey === 'ltv_cac_ratio') return `$${Number(num.toFixed(1))}`
    if (Math.abs(num) >= 1000) return `$${Math.round(num / 1000)}k`
    return `$${Math.round(num)}`
  }

  return Number(num.toFixed(1)).toString()
}

function formatDelta(metric) {
  const unit = metric.unit
  const delta = Number(metric.delta)
  if (!Number.isFinite(delta)) return 'n/a'

  if (unit === 'percent') {
    const sign = delta > 0 ? '+' : ''
    return `${sign}${Number(delta.toFixed(1))} pts`
  }

  if (unit === 'currency') {
    if (Number.isFinite(metric.deltaPercent)) {
      const sign = metric.deltaPercent > 0 ? '+' : ''
      return `${sign}${Number(metric.deltaPercent.toFixed(1))}%`
    }
    const sign = delta > 0 ? '+' : ''
    return `${sign}$${Math.round(delta)}`
  }

  if (Number.isFinite(metric.deltaPercent)) {
    const sign = metric.deltaPercent > 0 ? '+' : ''
    return `${sign}${Number(metric.deltaPercent.toFixed(1))}%`
  }

  const sign = delta > 0 ? '+' : ''
  return `${sign}${Number(delta.toFixed(1))}`
}

export async function selectComparisonWindow(supabase, userId) {
  const { data, error } = await supabase
    .from('area_metric_snapshots')
    .select('captured_at')
    .eq('user_id', userId)
    .order('captured_at', { ascending: true })

  if (error || !data?.length) {
    return { mode: 'insufficient_history' }
  }

  const earliest = data[0]?.captured_at
  const latest = data[data.length - 1]?.captured_at
  if (!earliest || !latest) {
    return { mode: 'insufficient_history' }
  }

  const spanDays = daysBetween(earliest, latest)

  if (spanDays >= 365) {
    return { mode: 'year_over_year', currentDays: 30, priorDays: 30, priorOffsetDays: 365 }
  }
  if (spanDays >= 180) {
    return { mode: 'quarter_over_quarter', currentDays: 30, priorDays: 30, priorOffsetDays: 90 }
  }
  if (spanDays >= 56) {
    return { mode: 'month_over_month', currentDays: 28, priorDays: 28, priorOffsetDays: 56 }
  }

  return { mode: 'insufficient_history' }
}

async function fetchWindowRows(supabase, userId, start, end) {
  const { data, error } = await supabase
    .from('area_metric_snapshots')
    .select('metric_name, value, captured_at, schema_version')
    .eq('user_id', userId)
    .gte('captured_at', start.toISOString())
    .lt('captured_at', end.toISOString())

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getConsistentMetrics(supabase, userId, currentStart, priorStart, windowDays) {
  const currentEnd = new Date(currentStart.getTime() + windowDays * 24 * 60 * 60 * 1000)
  const priorEnd = new Date(priorStart.getTime() + windowDays * 24 * 60 * 60 * 1000)
  const [currentRows, priorRows] = await Promise.all([
    fetchWindowRows(supabase, userId, currentStart, currentEnd),
    fetchWindowRows(supabase, userId, priorStart, priorEnd),
  ])

  const countDaysByMetric = (rows) => {
    const map = new Map()
    for (const row of rows) {
      const key = String(row.metric_name || '')
      if (!key) continue
      if (!map.has(key)) map.set(key, new Set())
      map.get(key).add(bucketDay(row.captured_at))
    }
    return map
  }

  const currentCounts = countDaysByMetric(currentRows)
  const priorCounts = countDaysByMetric(priorRows)
  const qualified = new Set()

  for (const [metricKey, daySet] of currentCounts.entries()) {
    if (daySet.size >= 3 && (priorCounts.get(metricKey)?.size ?? 0) >= 3) {
      qualified.add(metricKey)
    }
  }

  return qualified
}

export function computeWindowAverage(rows, metricKey) {
  const values = rows
    .filter((row) => row.metric_name === metricKey && isFiniteNumber(row.value))
    .map((row) => Number(row.value))

  if (values.length < 3) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function checkSchemaMatch(currentRows, priorRows) {
  const currentVersions = [...new Set(
    currentRows.map((row) => row.schema_version).filter(Boolean)
  )]
  const priorVersions = [...new Set(
    priorRows.map((row) => row.schema_version).filter(Boolean)
  )]

  if (!currentVersions.length || !priorVersions.length) return 'unknown'

  const priorSet = new Set(priorVersions)
  if (currentVersions.some((value) => priorSet.has(value))) return 'match'
  return 'partial_schema_match'
}

export async function getHistoricalMemory(supabase, userId) {
  const window = await selectComparisonWindow(supabase, userId)
  if (window.mode === 'insufficient_history') {
    return { status: 'insufficient_history', summary: null, metrics: [] }
  }

  const now = Date.now()
  const currentEnd = new Date(now)
  const currentStart = new Date(now - window.currentDays * 24 * 60 * 60 * 1000)
  const priorEnd = new Date(now - window.priorOffsetDays * 24 * 60 * 60 * 1000)
  const priorStart = new Date(priorEnd.getTime() - window.priorDays * 24 * 60 * 60 * 1000)

  const [currentRows, priorRows, qualifyingMetrics] = await Promise.all([
    fetchWindowRows(supabase, userId, currentStart, currentEnd),
    fetchWindowRows(supabase, userId, priorStart, priorEnd),
    getConsistentMetrics(supabase, userId, currentStart, priorStart, window.currentDays),
  ])

  const metrics = []
  for (const key of PRIORITY_METRICS) {
    if (!qualifyingMetrics.has(key)) continue

    const currentAvg = computeWindowAverage(currentRows, key)
    const priorAvg = computeWindowAverage(priorRows, key)
    if (currentAvg == null || priorAvg == null) continue

    const delta = currentAvg - priorAvg
    const deltaPercent = priorAvg !== 0 ? ((currentAvg - priorAvg) / Math.abs(priorAvg)) * 100 : null
    metrics.push({
      key,
      currentAvg,
      priorAvg,
      delta,
      deltaPercent,
      unit: inferUnit(key),
    })

    if (metrics.length >= 8) break
  }

  return {
    status: metrics.length ? 'active' : 'insufficient_history',
    mode: window.mode,
    schemaMatch: checkSchemaMatch(currentRows, priorRows),
    metrics,
    summary: null,
  }
}

export function formatHistoricalMemoryForPrompt(memory) {
  if (!memory || memory.status !== 'active' || !Array.isArray(memory.metrics) || memory.metrics.length === 0) {
    return null
  }

  const lines = memory.metrics.map((metric) => {
    const label = formatLabel(metric.key)
    const currentFormatted = formatMetricValue(metric.currentAvg, metric.unit, metric.key)
    const priorFormatted = formatMetricValue(metric.priorAvg, metric.unit, metric.key)
    const deltaFormatted = formatDelta(metric)
    return `- ${label}: ${currentFormatted} now vs ${priorFormatted} in the comparable historical window (${deltaFormatted}).`
  })

  return [
    'MULTI-YEAR MEMORY / HISTORICAL COMPARISON:',
    ...lines,
    `Comparison basis: ${MODE_DESCRIPTIONS[memory.mode] || 'comparable historical window'}.`,
    `Schema match: ${SCHEMA_MATCH_LABELS[memory.schemaMatch] || 'unknown'}.`,
  ].join('\n')
}
