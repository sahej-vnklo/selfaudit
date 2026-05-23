import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { buildAccountDataExport, sanitizeIntegrationsForExport } from './lib/data-governance.js'

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
    const [
      { data: profile },
      { data: reports },
      { data: chats },
      { data: businessState },
      { data: userMemory },
      { data: intelligenceProfile },
      { data: intelligenceBrief },
      { data: notificationPreferences },
      { data: riskAlerts },
      { data: connectorSyncLogs },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, name, phone, tier, industry, domain, context, onboarding_complete, intelligence_complete, notification_email, created_at, shared_with_vnklo, integrations')
        .eq('id', userId)
        .single(),
      supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('business_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('intelligence_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('intelligence_brief')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('intelligence_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('risk_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('connector_sync_logs')
        .select('*')
        .eq('user_id', userId)
        .order('synced_at', { ascending: false }),
    ])

    const payload = buildAccountDataExport({
      profile: profile ? { ...profile, integrations: sanitizeIntegrationsForExport(profile.integrations) } : null,
      reports: reports || [],
      chats: chats || [],
      business_state: businessState || null,
      user_memory: userMemory || [],
      intelligence_profile: intelligenceProfile || null,
      intelligence_brief: intelligenceBrief || null,
      notification_preferences: notificationPreferences || null,
      risk_alerts: riskAlerts || [],
      connector_sync_logs: connectorSyncLogs || [],
    })

    return res.status(200).json(payload)
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not export account data' })
  }
}
