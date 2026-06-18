import { loadSchema, saveSchema } from './lib/blueprint/schema-registry.js'
import { validateUserToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, customizations } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!customizations || typeof customizations !== 'object') {
    return res.status(400).json({ error: 'Missing customizations' })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    const schema = await loadSchema(userId)
    if (!schema) return res.status(404).json({ error: 'No schema found for this user' })

    // Merge — deep merge unit type overrides into existing customizations
    const existing = schema.customizations || {}
    const existingUnitTypes = existing.unitTypes || {}
    const incomingUnitTypes = customizations.unitTypes || {}

    const mergedUnitTypes = { ...existingUnitTypes }
    for (const [unitId, overrides] of Object.entries(incomingUnitTypes)) {
      mergedUnitTypes[unitId] = {
        ...(existingUnitTypes[unitId] || {}),
        ...overrides,
        properties: {
          ...(existingUnitTypes[unitId]?.properties || {}),
          ...(overrides.properties || {}),
        },
        links: {
          ...(existingUnitTypes[unitId]?.links || {}),
          ...(overrides.links || {}),
        },
        // Custom properties added by the user (not from catalog)
        customProperties: {
          ...(existingUnitTypes[unitId]?.customProperties || {}),
          ...(overrides.customProperties || {}),
        },
      }
    }

    const updatedSchema = {
      ...schema,
      customizations: {
        ...existing,
        unitTypes: mergedUnitTypes,
      },
    }

    await saveSchema(userId, updatedSchema)
    return res.status(200).json({ ok: true, customizations: updatedSchema.customizations })
  } catch (err) {
    console.error('[schema-customizations] error:', err)
    return res.status(500).json({ error: 'Failed to save customizations' })
  }
}
