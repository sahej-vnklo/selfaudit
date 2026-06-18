import { buildSchemaFromSelections } from './lib/blueprint/schema-builder.js'
import { loadSchema, saveSchema } from './lib/blueprint/schema-registry.js'
import { createArea } from './lib/blueprint/schema.js'
import { validateUserToken } from './lib/auth.js'

const INDUSTRY_ALIASES = {
  saas: 'saas-software',
  ecommerce: 'ecommerce-d2c',
  professional_services: 'professional-services',
  marketplace: 'marketplace-platform',
  consumer_app: 'consumer-app',
  fintech: 'fintech-finance',
  healthcare: 'healthcare',
  media_content: 'media-creator',
}

// Areas now in the catalog — pass through as real area IDs
const AREA_ALIASES = {
  'marketing-sales':       'marketing-sales',
  'finance-accounting':    'finance-accounting',
  'customer-service':      'customer-service',
  'management-strategy':   'management-strategy',
  'product-engineering':   'product-engineering',
  'people-hr':             'people-hr',
  'revenue-sales':         'revenue-sales',
  'inventory-operations':  'inventory-operations',
  'production':            'production',
  'client-delivery':       'client-delivery',
}

// Areas not yet in the catalog — built as lightweight custom areas
const CUSTOM_AREA_DEFS = {
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
    if (customArea) {
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
      continue
    }

    // Fall through: treat as a catalog area ID directly.
    // schema-builder does getArea(id).filter(Boolean) so invalid IDs are harmless.
    selectedAreaIds.push(rawAreaId)
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

    const customBusinessName = typeof req.body?.customBusinessName === 'string'
      ? req.body.customBusinessName.slice(0, 100).trim()
      : undefined
    const customBusinessDescription = typeof req.body?.customBusinessDescription === 'string'
      ? req.body.customBusinessDescription.slice(0, 500).trim()
      : undefined

    const { selectedAreaIds, customAreas } = buildAreaSelection(areaIds, industryId)
    const builtSchema = await buildSchemaFromSelections(userId, {
      industryId,
      selectedAreaIds,
      customAreas,
    })

    const schema = {
      ...builtSchema,
      ...(customBusinessName ? { customBusinessName } : {}),
      ...(customBusinessDescription ? { customBusinessDescription } : {}),
    }

    // Re-save with custom name if present (buildSchemaFromSelections already saved once)
    if (customBusinessName || customBusinessDescription) {
      await saveSchema(userId, schema)
    }

    return res.status(200).json({ success: true, schema })
  } catch (error) {
    console.error('[schema-setup]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Schema setup failed' })
  }
}
