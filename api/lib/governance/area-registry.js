import { getArea } from '../blueprint/catalog/index.js'
import { evaluateRulePack } from './shared/contracts.js'
import { OPERATIONAL_AREAS, getOperationalArea, isOperationalArea } from '../../../shared/governance/operational-areas.js'

// Keep shared/governance exports for backward compat with any callers
export { OPERATIONAL_AREAS, getOperationalArea, isOperationalArea }

// Derive OPERATIONAL_AREA_REGISTRY from the catalog so it stays in sync
export const OPERATIONAL_AREA_REGISTRY = OPERATIONAL_AREAS.map((sharedArea) => ({
  ...sharedArea,
  ...(getArea(sharedArea.id) ?? {}),
}))

export const OPERATIONAL_AREA_REGISTRY_MAP = Object.fromEntries(
  OPERATIONAL_AREA_REGISTRY.map((area) => [area.id, area])
)

// Returns the full catalog area definition (metricFamilies, defaultRulePack, metricMappings, etc.)
export function getOperationalAreaModule(areaId) {
  return getArea(areaId) ?? null
}

// Evaluate all threshold rules for an area.
// schemaArea — if the user's schema overrides the catalog area definition, pass it here.
export function evaluateOperationalArea(areaId, metrics, overrides = null, schemaArea = null) {
  const area = schemaArea ?? getArea(areaId)
  if (!area?.defaultRulePack) return []
  return evaluateRulePack(area.defaultRulePack, metrics, overrides)
}
