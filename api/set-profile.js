import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email, name, tier, stripeCustomerId, stripeSubscriptionId } = req.body || {}
  if (!userId || !tier) return res.status(400).json({ error: 'userId and tier required' })
  if (!await validateUserToken(req, res, userId)) return

  const supabaseUrl        = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server config missing' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const payload = { id: userId, tier }
  if (email)                payload.email                  = email
  if (name)                 payload.name                   = name
  if (stripeCustomerId)     payload.stripe_customer_id     = stripeCustomerId
  if (stripeSubscriptionId) payload.stripe_subscription_id = stripeSubscriptionId

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    console.error('[set-profile] error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.json({ ok: true })
}
