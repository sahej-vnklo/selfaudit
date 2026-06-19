// Lightweight endpoint: returns the user's available communication channels
// and saved channel preference. Used by ExecutionPanel push popup.
//
// GET /api/comm-channels?userId=<uuid>   (requires Authorization: Bearer <token>)

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const COMM_PROVIDERS = ['slack', 'gmail']

const PROVIDER_LABEL = { slack: 'Slack', gmail: 'Gmail' }

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = req.query.userId
  if (!userId) return res.status(400).json({ error: 'userId required' })
  if (!await validateUserToken(req, res, userId)) return

  const sb = getSupabase()

  const [snapRes, prefsRes] = await Promise.allSettled([
    sb.from('connector_snapshots').select('providers').eq('user_id', userId).maybeSingle(),
    sb.from('user_connector_prefs').select('channel_type, params, updated_at').eq('user_id', userId),
  ])

  const providers  = snapRes.status  === 'fulfilled' ? (snapRes.value.data?.providers  ?? []) : []
  const savedPrefs = prefsRes.status === 'fulfilled' ? (prefsRes.value.data ?? []) : []

  const prefMap = Object.fromEntries(savedPrefs.map(p => [p.channel_type, p.params]))

  const channels = [
    { type: 'email', label: 'Account Email', params: prefMap['email'] ?? null },
    ...COMM_PROVIDERS
      .filter(p => providers.includes(p))
      .map(p => ({ type: p, label: PROVIDER_LABEL[p], params: prefMap[p] ?? null })),
  ]

  const savedPref = savedPrefs.length > 0
    ? savedPrefs.sort((a, b) => ((b.updated_at ?? '') > (a.updated_at ?? '') ? 1 : -1))[0]
    : null

  return res.status(200).json({ channels, savedPref })
}
