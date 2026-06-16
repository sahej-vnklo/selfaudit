import { AREA_CATALOG } from './lib/blueprint/catalog/areas.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const seen = new Set()
  const metrics = []

  for (const area of Object.values(AREA_CATALOG)) {
    for (const metric of area.metricFamilies || []) {
      if (!metric?.key || seen.has(metric.key)) continue
      seen.add(metric.key)
      metrics.push({
        key: metric.key,
        label: metric.label,
        unit: metric.unit,
        areaId: area.id,
      })
    }
  }

  return res.status(200).json(metrics)
}
