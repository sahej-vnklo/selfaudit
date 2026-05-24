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

function tierFromPriceId(priceId) {
  if (!priceId) return null
  const foundationPrice = process.env.STRIPE_PRICE_FOUNDATION || process.env.STRIPE_PRICE_ESSENTIAL
  const intelligencePrice = process.env.STRIPE_PRICE_INTELLIGENCE || process.env.STRIPE_PRICE_BUSINESS
  if (priceId === foundationPrice) return 'foundation'
  if (priceId === intelligencePrice) return 'intelligence'
  return null
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
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price'],
    })
    const checkoutUserId = session.client_reference_id || session.metadata?.userId

    if (checkoutUserId !== userId) {
      return res.status(403).json({ error: 'This checkout session does not belong to the current user.' })
    }

    const subscription = typeof session.subscription === 'object' ? session.subscription : null
    const subscriptionId = subscription?.id || session.subscription || null
    const subscriptionStatus = subscription?.status || null
    const inferredTier = normalizeCheckoutTier(session.metadata?.tier)
      || tierFromPriceId(subscription?.items?.data?.[0]?.price?.id)
      || tierFromPriceId(session.line_items?.data?.[0]?.price?.id)
    const isReady = session.status === 'complete'
      && !!subscriptionId
      && ['active', 'trialing'].includes(subscriptionStatus || '')

    if (!isReady) {
      return res.status(200).json({
        ready: false,
        status: session.status || null,
        paymentStatus: session.payment_status || null,
        subscriptionStatus,
        tier: inferredTier || 'foundation',
      })
    }

    const supabase = getServiceSupabase()
    const payload = {
      tier: inferredTier || 'foundation',
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: subscriptionId,
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
      subscriptionStatus,
    })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Could not verify checkout session.' })
  }
}
