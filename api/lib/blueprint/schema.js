// Re-export existing primitives that are still valid
export { createMetricDefinition, createThresholdRule, createRulePack } from '../governance/shared/contracts.js'

export function createSharedProperty({ key, label, type, description = '', required = false, enumValues = [] }) {
  return { key, label, type, description, required, ...(enumValues.length ? { enumValues } : {}) }
}

export function createPropertyDef({ key, label, type, description = '', required = false, shared = false, enumValues = [] }) {
  return { key, label, type, description, required, shared, ...(enumValues.length ? { enumValues } : {}) }
}

export function createLinkDef({ id, label, toUnitTypeId, cardinality = 'many-to-one', direction = 'unidirectional' }) {
  return { id, label, toUnitTypeId, cardinality, direction }
}

export function createUnitType({ id, label, description = '', areas = [], interfaces = [], properties = [], links = [] }) {
  return { id, label, description, areas, interfaces, properties, links }
}

export function createInterface({ id, label, description = '', sharedProperties = [] }) {
  return { id, label, description, sharedProperties }
}

// Declarative metric mapping — replaces per-area buildMetrics JS functions.
// The generic mapper in metric-snapshots.js reads these at runtime.
// transforms: safeNumber | arrayLength | ratio | divide | computed
// source types: brief | brain | integration | normalized
export function createMetricMapping({ metricKey, transform, sources = [], inputs = [], computation = null, source = 'intelligence_brief' }) {
  return { metricKey, transform, sources, inputs, computation, source }
}

export function createCompoundRule({ id, conditions, title, summary, recommendation, severity = 'high', status = 'bad' }) {
  return { id, conditions, title, summary, recommendation, severity, status }
}

export function createArea({
  id, label, description = '', industries = [], connectors = [],
  businessLogic = {}, metricFamilies = [], defaultRulePack = {}, metricMappings = [],
}) {
  return { id, label, description, industries, connectors, businessLogic, metricFamilies, defaultRulePack, metricMappings }
}

export function createIndustry({ id, label, description = '', defaultAreas = [], defaultUnitTypes = [] }) {
  return { id, label, description, defaultAreas, defaultUnitTypes }
}

// A schema is what a single company runs against.
// Built from catalog selections via schema-builder.js or loaded from Supabase.
export function createSchema({ id, label, industryId, areas = [], unitTypes = [], compoundRules = [], causalLinks = [] }) {
  return { id, label, industryId, areas, unitTypes, compoundRules, causalLinks }
}
