import { listIndustries } from './lib/blueprint/catalog/index.js'
import { AREA_CATALOG } from './lib/blueprint/catalog/index.js'
import { UNIT_TYPE_CATALOG } from './lib/blueprint/catalog/index.js'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const industries = listIndustries().map(ind => ({
      id: ind.id,
      label: ind.label,
      description: ind.description,
    }))

    const areas = {}
    for (const [id, area] of Object.entries(AREA_CATALOG)) {
      const unitIds = Object.values(UNIT_TYPE_CATALOG)
        .filter(u => Array.isArray(u.areas) && u.areas.includes(id))
        .map(u => u.id)
      areas[id] = {
        id: area.id,
        label: area.label,
        industries: area.industries || [],
        objective: area.businessLogic?.objective || '',
        unitIds,
      }
    }

    const units = {}
    for (const [id, unit] of Object.entries(UNIT_TYPE_CATALOG)) {
      units[id] = {
        id: unit.id,
        label: unit.label,
        description: unit.description || '',
        interfaces: unit.interfaces || [],
        properties: (unit.properties || []).map(p => ({ key: p.key, label: p.label, type: p.type })),
        links: (unit.links || []).map(l => ({ id: l.id, label: l.label, to: l.toUnitTypeId, cardinality: l.cardinality })),
      }
    }

    return res.status(200).json({ industries, areas, units })
  } catch (error) {
    console.error('[catalog]', error?.message || error)
    return res.status(500).json({ error: 'Failed to load catalog' })
  }
}
