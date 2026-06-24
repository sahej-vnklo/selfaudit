import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body || {}
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    // Tables that have a user_id column (uuid FK to auth.users).
    // company_schemas uses user_id as a text PK and is handled separately below.
    const tables = [
      'business_state',
      'intelligence_profiles',
      'intelligence_notification_preferences',
      'intelligence_brief',
      'business_health_checks',
      'risk_alerts',
      'reports',
      'user_memory',
      'artifacts',
      'area_metric_snapshots',
      'pending_actions',
      'execution_log',
      'user_rule_overrides',
      'user_custom_metrics',
      'user_connector_prefs',
      'connector_snapshots',
    ]

    // 2. Wipe all user data rows
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      if (error) {
        console.warn(`[delete-account] failed to clear ${table} for ${userId}:`, error.message)
      }
    }

    // company_schemas uses user_id as text PK
    await supabase.from('company_schemas').delete().eq('user_id', userId)

    // Delete the profile row (user_id = id on profiles, not a user_id column)
    await supabase.from('profiles').delete().eq('id', userId)

    // 3. Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not delete account' })
  }
}
