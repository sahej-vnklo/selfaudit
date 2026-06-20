import { createSchema } from './schema.js'
import {
  getArea,
  getAreasForIndustry,
  getIndustry,
  getUnitType,
  getUnitTypesForArea,
  COMPOUND_RULES_SAAS,
  COMPOUND_RULES_ECOMMERCE,
  COMPOUND_RULES_MANUFACTURING,
  COMPOUND_RULES_PS,
  COMPOUND_RULES_MARKETPLACE,
  COMPOUND_RULES_CONSUMER_APP,
  COMPOUND_RULES_HOSPITALITY,
  COMPOUND_RULES_HEALTHCARE,
  COMPOUND_RULES_WHOLESALE,
  COMPOUND_RULES_LOGISTICS,
  COMPOUND_RULES_CONSTRUCTION,
  COMPOUND_RULES_REAL_ESTATE,
} from './catalog/index.js'
import { saveSchema, loadSchema } from './schema-registry.js'

const COMPOUND_RULES_BY_INDUSTRY = {
  'saas-software':          COMPOUND_RULES_SAAS,
  'ecommerce-d2c':          COMPOUND_RULES_ECOMMERCE,
  'manufacturing':          COMPOUND_RULES_MANUFACTURING,
  'professional-services':  COMPOUND_RULES_PS,
  'marketplace':            COMPOUND_RULES_MARKETPLACE,
  'consumer-app':           COMPOUND_RULES_CONSUMER_APP,
  'hospitality-fb':         COMPOUND_RULES_HOSPITALITY,
  'retail-hospitality':     COMPOUND_RULES_HOSPITALITY,
  'healthcare':             COMPOUND_RULES_HEALTHCARE,
  'wholesale-distribution': COMPOUND_RULES_WHOLESALE,
  'logistics-freight':      COMPOUND_RULES_LOGISTICS,
  'construction':           COMPOUND_RULES_CONSTRUCTION,
  'real-estate':            COMPOUND_RULES_REAL_ESTATE,
}

/**
 * Build and persist a schema from a user's onboarding selections.
 *
 * @param {string} userId
 * @param {{ industryId: string, selectedAreaIds: string[], selectedUnitTypeIds: string[], customAreas?: object[], causalLinks?: object[] }} selections
 * @returns {object} The persisted schema
 */
export async function buildSchemaFromSelections(userId, {
  industryId,
  selectedAreaIds = [],
  selectedUnitTypeIds = [],
  customAreas = [],
  causalLinks = [],
}) {
  const industry = getIndustry(industryId)
  if (!industry) throw new Error(`Unknown industry: ${industryId}`)

  // Resolve catalog areas. Custom areas are passed through as-is.
  const catalogAreas = selectedAreaIds
    .map((id) => getArea(id))
    .filter(Boolean)

  const allAreas = [...catalogAreas, ...customAreas]

  // Resolve unit types. If no selection is made, fall back to the area defaults.
  let unitTypes = []
  if (selectedUnitTypeIds.length > 0) {
    unitTypes = selectedUnitTypeIds.map((id) => getUnitType(id)).filter(Boolean)
  } else {
    const seen = new Set()
    for (const areaId of selectedAreaIds) {
      for (const unit of getUnitTypesForArea(areaId)) {
        if (!seen.has(unit.id)) {
          seen.add(unit.id)
          unitTypes.push(unit)
        }
      }
    }
  }

  // Pull compound rules for this industry that involve the selected area metrics
  const selectedMetricKeys = new Set(
    allAreas.flatMap((a) => (a.metricFamilies ?? []).map((m) => m.key)),
  )
  const industryCompoundRules = (COMPOUND_RULES_BY_INDUSTRY[industryId] ?? []).filter(
    (rule) => rule.conditions.every((c) => selectedMetricKeys.has(c.metricKey)),
  )

  const schema = createSchema({
    id: `schema:${userId}`,
    label: `${industry.label} schema`,
    industryId,
    areas: allAreas,
    unitTypes,
    compoundRules: industryCompoundRules,
    causalLinks,
  })

  return saveSchema(userId, schema)
}

/**
 * Return the user's schema, or build one from their industry defaults if they
 * skipped onboarding.
 */
export async function getOrBuildDefaultSchema(userId, industryId) {
  const existing = await loadSchema(userId)
  if (existing) return existing

  const industry = getIndustry(industryId)
  if (!industry) return null

  return buildSchemaFromSelections(userId, {
    industryId,
    selectedAreaIds: industry.defaultAreas,
    selectedUnitTypeIds: industry.defaultUnitTypes,
  })
}

/**
 * Return a preview of what areas and units a schema would contain,
 * without persisting anything. Used in onboarding UI.
 */
export function previewSchemaSelections(industryId, selectedAreaIds = []) {
  const industry = getIndustry(industryId)
  if (!industry) return null

  const areas = (selectedAreaIds.length > 0 ? selectedAreaIds : industry.defaultAreas)
    .map((id) => getArea(id))
    .filter(Boolean)

  const unitTypesByArea = areas.map((area) => ({
    areaId: area.id,
    areaLabel: area.label,
    unitTypes: getUnitTypesForArea(area.id).map((u) => ({ id: u.id, label: u.label, description: u.description })),
  }))

  return {
    industry: { id: industry.id, label: industry.label },
    areas: areas.map((a) => ({ id: a.id, label: a.label, description: a.description ?? '' })),
    unitTypesByArea,
  }
}

/**
 * Return all areas selectable for a given industry, with metadata for display.
 */
export function getSelectableAreas(industryId) {
  return getAreasForIndustry(industryId).map((a) => ({
    id: a.id,
    label: a.label,
    description: a.description ?? '',
    connectors: a.connectors,
    metricCount: a.metricFamilies.length,
  }))
}
