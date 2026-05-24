import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { normalizeCheckoutTier } from './lib/checkout.js'

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, sessionId } = req.body || {}
  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'userId and sessionId required' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const secretKey = process.env.STRIPE_SECRET_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secretKey || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server config missing' })
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const checkoutUserId = session.client_reference_id || session.metadata?.userId

    if (checkoutUserId !== userId) {
      return res.status(403).json({ error: 'This checkout session does not belong to the current user.' })
    }

    const normalizedTier = normalizeCheckoutTier(session.metadata?.tier)
    const isReady = session.payment_status === 'paid' && session.status === 'complete' && !!session.subscription

    if (!isReady) {
      return res.status(200).json({
        ready: false,
        status: session.status || null,
        paymentStatus: session.payment_status || null,
        tier: normalizedTier || 'foundation',
      })
    }

    const supabase = getServiceSupabase()
    const payload = {
      tier: normalizedTier || 'foundation',
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: session.subscription || null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      ready: true,
      tier: payload.tier,
      stripeCustomerId: payload.stripe_customer_id,
      stripeSubscriptionId: payload.stripe_subscription_id,
    })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not verify checkout session.' })
  }
}
