import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// All tables that store per-user data — wiped before the auth user is deleted.
const USER_TABLES = [
  'agent_findings',
  'area_metric_snapshots',
  'artifacts',
  'audit_sessions',
  'business_health_checks',
  'business_state',
  'chats',
  'company_causal_patterns',
  'company_schemas',
  'connector_snapshots',
  'connector_sync_logs',
  'decision_records',
  'execution_log',
  'goal_nodes',
  'intelligence_brief',
  'intelligence_notification_preferences',
  'intelligence_profiles',
  'pending_actions',
  'reports',
  'risk_alerts',
  'user_connector_prefs',
  'user_custom_metrics',
  'user_memory',
  'user_rule_overrides',
  'voice_calls',
]

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
    // 1. Wipe all user data rows first
    for (const table of USER_TABLES) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId)
      if (error) {
        console.warn(`[delete-account] failed to clear ${table} for ${userId}:`, error.message)
        // Non-fatal — continue and still delete the auth user
      }
    }

    // 2. Delete the profile row (user_id = id on profiles, not a user_id column)
    await supabase.from('profiles').delete().eq('id', userId)

    // 3. Delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    return res.status(200).json({ ok: true })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not delete account' })
  }
}
