// GET  /api/connector-prefs?userId=xxx  — returns all saved channel prefs for the user
// PATCH /api/connector-prefs             — upsert { userId, channel_type, params }

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = req.query.userId
    if (!userId) return res.status(400).json({ error: 'Missing userId' })
    if (!await validateUserToken(req, res, userId)) return

    const sb = getSupabase()
    const { data, error } = await sb
      .from('user_connector_prefs')
      .select('channel_type, params, updated_at')
      .eq('user_id', userId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ prefs: data ?? [] })
  }

  if (req.method === 'PATCH') {
    const { userId, channel_type, params } = req.body || {}
    if (!userId || !channel_type) return res.status(400).json({ error: 'userId and channel_type are required' })
    if (!await validateUserToken(req, res, userId)) return

    const sb = getSupabase()
    const { error } = await sb
      .from('user_connector_prefs')
      .upsert(
        { user_id: userId, channel_type, params: params ?? {}, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,channel_type' }
      )

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
