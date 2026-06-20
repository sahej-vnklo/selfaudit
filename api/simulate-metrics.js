import { loadSchema } from './lib/blueprint/schema-registry.js'
import { validateUserToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  if (!await validateUserToken(req, res, userId)) return

  try {
    const schema = await loadSchema(userId)

    if (!schema || !Array.isArray(schema.areas) || schema.areas.length === 0) {
      return res.status(200).json({ areas: [], metrics: [], hasSchema: false })
    }

    const seen = new Set()
    const metrics = []
    const areas = []

    for (const area of schema.areas) {
      const areaId = area.id || area.areaId
      const areaLabel = area.label || areaId
      const areaMetrics = []

      for (const metric of area.metricFamilies || []) {
        if (!metric?.key || seen.has(metric.key)) continue
        seen.add(metric.key)
        const m = {
          key: metric.key,
          label: metric.label,
          unit: metric.unit,
          areaId,
          preferredDirection: metric.preferredDirection,
        }
        metrics.push(m)
        areaMetrics.push(m)
      }

      areas.push({
        id: areaId,
        label: areaLabel,
        hasMetrics: areaMetrics.length > 0,
        metrics: areaMetrics,
      })
    }

    return res.status(200).json({ areas, metrics, hasSchema: true })
  } catch (err) {
    console.error('[simulate-metrics]', err?.message || err)
    return res.status(500).json({ error: err?.message || 'Failed to load metrics' })
  }
}
