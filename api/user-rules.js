import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { AREA_CATALOG } from './lib/blueprint/catalog/index.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Derive valid rule IDs and defaults from the catalog at startup.
// Any area added to the catalog automatically becomes overridable.
const KNOWN_RULE_IDS = new Set()
const RULE_DEFAULTS  = {}

for (const area of Object.values(AREA_CATALOG)) {
  for (const rule of area.defaultRulePack?.defaults ?? []) {
    KNOWN_RULE_IDS.add(rule.id)
    RULE_DEFAULTS[rule.id] = {
      value: rule.value,
      label: rule.title,
    }
  }
}

export default async function handler(req, res) {
  const { userId } = req.method === 'GET' ? req.query : (req.body || {})

  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  // GET — return all overrides for the user plus defaults for the UI
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_rule_overrides')
      .select('rule_id, area_id, metric_key, value, enabled, updated_at')
      .eq('user_id', userId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({
      overrides: data ?? [],
      defaults: RULE_DEFAULTS,
    })
  }

  // POST — upsert a single override
  if (req.method === 'POST') {
    const { ruleId, areaId, metricKey, value, enabled = true } = req.body || {}

    if (!ruleId || !KNOWN_RULE_IDS.has(ruleId)) {
      return res.status(400).json({ error: 'Unknown rule ID' })
    }
    if (typeof value !== 'number' || !isFinite(value) || value < 0) {
      return res.status(400).json({ error: 'value must be a non-negative finite number' })
    }

    const { data, error } = await supabase
      .from('user_rule_overrides')
      .upsert({
        user_id:    userId,
        rule_id:    ruleId,
        area_id:    areaId || ruleId.split(':')[0],
        metric_key: metricKey || '',
        value,
        enabled:    Boolean(enabled),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,rule_id' })
      .select('rule_id, area_id, metric_key, value, enabled, updated_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ override: data })
  }

  // DELETE — remove an override, restoring the hardcoded default
  if (req.method === 'DELETE') {
    const ruleId = req.query.ruleId || req.body?.ruleId

    if (!ruleId || !KNOWN_RULE_IDS.has(ruleId)) {
      return res.status(400).json({ error: 'Unknown rule ID' })
    }

    const { error } = await supabase
      .from('user_rule_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('rule_id', ruleId)

    if (error) return res.status(500).json({ error: error.message })

    return res.status(200).json({ deleted: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
