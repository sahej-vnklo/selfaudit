// GET /api/logic-catalog?userId=xxx
// Returns the user's selected areas with metricFamilies from the catalog,
// default watch/bad thresholds, and the user's existing saved values —
// all in one call so the Logic page can render without multiple round-trips.

import { createClient }       from '@supabase/supabase-js'
import { validateUserToken }  from './lib/auth.js'
import { getArea, getIndustry } from './lib/blueprint/catalog/index.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function extractThresholds(area) {
  const rules = area?.defaultRulePack?.rules ?? []
  const byKey = {}
  for (const rule of rules) {
    if (!rule?.metricKey) continue
    if (!byKey[rule.metricKey]) byKey[rule.metricKey] = {}
    if (rule.status === 'watch') byKey[rule.metricKey].watch = { value: rule.value, comparator: rule.comparator }
    if (rule.status === 'bad')   byKey[rule.metricKey].bad   = { value: rule.value, comparator: rule.comparator }
  }
  return byKey
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  const [schemaRes, metricsRes] = await Promise.all([
    sb.from('company_schemas').select('schema').eq('user_id', userId).single(),
    sb.from('user_custom_metrics').select('area_id, name, value, unit, updated_at').eq('user_id', userId),
  ])

  const schemaData   = schemaRes.data?.schema ?? null
  const savedMetrics = metricsRes.data ?? []

  // Build index of saved values: { [area_id]: { [metric_key]: { value, unit } } }
  const savedByArea = {}
  for (const row of savedMetrics) {
    if (!savedByArea[row.area_id]) savedByArea[row.area_id] = {}
    savedByArea[row.area_id][row.name] = { value: row.value, unit: row.unit, updated_at: row.updated_at }
  }

  // Resolve selected areas from schema — same fallback logic as cockpit-data
  const rawAreas = Array.isArray(schemaData?.areas) && schemaData.areas.length > 0
    ? schemaData.areas
    : (getIndustry(schemaData?.industryId)?.defaultAreas ?? []).map(id => getArea(id)).filter(Boolean)

  const areas = rawAreas.map((a) => {
    const catalogArea  = getArea(a.id) ?? a
    const thresholds   = extractThresholds(catalogArea)
    const metrics      = (catalogArea.metricFamilies ?? []).map((m) => {
      const saved = savedByArea[a.id]?.[m.key] ?? null
      return {
        key:                  m.key,
        label:                m.label,
        unit:                 m.unit,
        preferredDirection:   m.preferredDirection,
        defaultInterpretation: m.defaultInterpretation,
        thresholds:           thresholds[m.key] ?? {},
        savedValue:           saved?.value ?? null,
        savedUnit:            saved?.unit  ?? null,
        updated_at:           saved?.updated_at ?? null,
      }
    })

    return {
      id:      a.id,
      label:   a.label ?? catalogArea.label,
      metrics,
    }
  }).filter(a => a.metrics.length > 0)

  return res.status(200).json({ areas })
}
