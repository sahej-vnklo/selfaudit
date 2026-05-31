// POST /api/connect/stripe/save
// Validates a Stripe Restricted API Key and stores it in profiles.integrations.stripe
// Body: { userId, apiKey }

import { createClient } from '@supabase/supabase-js'
import { validateStripeApiKey } from '../../lib/connectors/stripe.js'
import { validateUserToken } from '../../lib/auth.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, apiKey } = req.body ?? {}
  if (!userId)  return res.status(400).json({ error: 'Missing userId' })
  if (!apiKey)  return res.status(400).json({ error: 'Missing apiKey' })
  if (!await validateUserToken(req, res, userId)) return

  // Only accept restricted or secret keys — never publishable keys
  if (!apiKey.startsWith('sk_') && !apiKey.startsWith('rk_')) {
    return res.status(400).json({ error: 'Invalid key format. Use a Stripe Restricted Key (rk_live_...) or Secret Key (sk_live_...).' })
  }

  // Validate key by hitting /v1/account
  let accountInfo
  try {
    accountInfo = await validateStripeApiKey(apiKey)
  } catch (err) {
    return res.status(400).json({ error: `Could not verify key: ${err.message}` })
  }

  // Load existing integrations and merge
  const sb = getSupabase()
  const { data: profile, error: fetchErr } = await sb
    .from('profiles')
    .select('integrations')
    .eq('id', userId)
    .single()

  if (fetchErr) return res.status(500).json({ error: 'Could not load profile' })

  const existing     = profile?.integrations ?? {}
  const updatedInteg = {
    ...existing,
    stripe: {
      api_key:      apiKey,
      account_name: accountInfo.account_name,
      account_id:   accountInfo.account_id,
      connected_at: new Date().toISOString(),
      last_synced_at: null,
    },
  }

  const { error: saveErr } = await sb
    .from('profiles')
    .update({ integrations: updatedInteg })
    .eq('id', userId)

  if (saveErr) return res.status(500).json({ error: 'Could not save key' })

  return res.status(200).json({
    ok:           true,
    account_name: accountInfo.account_name,
    // Return masked key for display — last 4 chars only
    masked_key:   `${'•'.repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}`,
  })
}
