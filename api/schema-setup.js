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
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // PATCH — partial schema update from chat (unit label/description, area notes)
  if (req.method === 'PATCH') {
    const { userId, patch } = req.body || {}
    if (!userId) return res.status(400).json({ error: 'Missing userId' })
    if (!patch || typeof patch !== 'object') return res.status(400).json({ error: 'Missing patch' })
    // Internal service calls from audit.js are exempt from user token check
    const isInternal = req.headers['x-internal-service'] === 'audit'
    if (!isInternal && !await validateUserToken(req, res, userId)) return

    try {
      const schema = await loadSchema(userId)
      if (!schema) return res.status(404).json({ error: 'No schema found' })

      let updated = { ...schema }

      // unitCustomizations: { [unitId]: { label?, description? } }
      if (patch.unitCustomizations && typeof patch.unitCustomizations === 'object') {
        const existing = updated.customizations?.unitTypes || {}
        const merged   = { ...existing }
        for (const [unitId, overrides] of Object.entries(patch.unitCustomizations)) {
          if (!unitId || typeof overrides !== 'object') continue
          merged[unitId] = {
            ...(existing[unitId] || {}),
            ...(typeof overrides.label       === 'string' ? { label:       overrides.label.slice(0, 80).trim()  } : {}),
            ...(typeof overrides.description === 'string' ? { description: overrides.description.slice(0, 300).trim() } : {}),
          }
        }
        updated = {
          ...updated,
          customizations: { ...(updated.customizations || {}), unitTypes: merged },
        }
      }

      // areaInsights: { [areaId]: { note: string } } — stored as area-level notes for probing context
      if (patch.areaInsights && typeof patch.areaInsights === 'object') {
        const existingNotes = updated.areaInsights || {}
        const mergedNotes   = { ...existingNotes }
        for (const [areaId, val] of Object.entries(patch.areaInsights)) {
          if (!areaId || typeof val?.note !== 'string') continue
          mergedNotes[areaId] = { note: val.note.slice(0, 400).trim(), updatedAt: new Date().toISOString() }
        }
        updated = { ...updated, areaInsights: mergedNotes }
      }

      // dismissBlindArea: [areaId] — user said "we don't track this"; remove from probing
      if (Array.isArray(patch.dismissBlindArea)) {
        const dismissed = new Set(updated.dismissedBlindAreas || [])
        for (const id of patch.dismissBlindArea) {
          if (typeof id === 'string' && id) dismissed.add(id)
        }
        updated = { ...updated, dismissedBlindAreas: [...dismissed] }
      }

      await saveSchema(userId, updated)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[schema-setup PATCH]', err?.message || err)
      return res.status(500).json({ error: err?.message || 'Schema patch failed' })
    }
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
