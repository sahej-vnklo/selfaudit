import { buildSchemaFromSelections } from './lib/blueprint/schema-builder.js'
import { loadSchema } from './lib/blueprint/schema-registry.js'
import { createArea } from './lib/blueprint/schema.js'
import { validateUserToken } from './lib/auth.js'

const INDUSTRY_ALIASES = {
  saas: 'saas-software',
  ecommerce: 'ecommerce-d2c',
  professional_services: 'professional-services',
  marketplace: 'saas-software',
  consumer_app: 'saas-software',
  fintech: 'saas-software',
  healthcare: 'healthcare',
  media_content: 'other',
}

const AREA_ALIASES = {
  'marketing-sales': 'marketing-sales',
  'finance-accounting': 'finance-accounting',
  'customer-service': 'customer-service',
  'management-strategy': 'management-strategy',
}

const CUSTOM_AREA_DEFS = {
  'product-engineering': {
    label: 'Product & Engineering',
    description: 'Build velocity, debt, uptime',
  },
  'people-hr': {
    label: 'People & HR',
    description: 'Team health, hiring, capacity',
  },
  operations: {
    label: 'Operations',
    description: 'Process efficiency, delivery',
  },
  'legal-compliance': {
    label: 'Legal & Compliance',
    description: 'Risk, contracts, obligations',
  },
}

function resolveIndustryId(industryId) {
  return INDUSTRY_ALIASES[industryId] || industryId || 'other'
}

function buildAreaSelection(areaIds = [], industryId = 'other') {
  const selectedAreaIds = []
  const customAreas = []

  for (const rawAreaId of areaIds) {
    const resolvedAreaId = AREA_ALIASES[rawAreaId]
    if (resolvedAreaId) {
      selectedAreaIds.push(resolvedAreaId)
      continue
    }

    const customArea = CUSTOM_AREA_DEFS[rawAreaId]
    if (!customArea) continue

    customAreas.push(createArea({
      id: rawAreaId,
      label: customArea.label,
      description: customArea.description,
      industries: [industryId],
      connectors: [],
      businessLogic: {},
      metricFamilies: [],
      defaultRulePack: { defaults: [], notes: [] },
      metricMappings: [],
    }))
  }

  return { selectedAreaIds, customAreas }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.method === 'GET' ? req.query.userId : req.body?.userId
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    if (req.method === 'GET') {
      const schema = await loadSchema(userId)
      return res.status(200).json({ schema })
    }

    const industryId = resolveIndustryId(req.body?.industryId)
    const areaIds = Array.isArray(req.body?.areaIds) ? req.body.areaIds : []
    if (!industryId || areaIds.length === 0) {
      return res.status(400).json({ error: 'Missing industryId or areaIds' })
    }

    const { selectedAreaIds, customAreas } = buildAreaSelection(areaIds, industryId)
    const schema = await buildSchemaFromSelections(userId, {
      industryId,
      selectedAreaIds,
      customAreas,
    })

    return res.status(200).json({ success: true, schema })
  } catch (error) {
    console.error('[schema-setup]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Schema setup failed' })
  }
}
