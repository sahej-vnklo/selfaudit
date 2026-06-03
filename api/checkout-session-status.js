import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function tierFromPriceId(priceId) {
  if (!priceId) return null
  const professionalPrice = process.env.STRIPE_PRICE_PROFESSIONAL || process.env.STRIPE_PRICE_INTELLIGENCE || process.env.STRIPE_PRICE_BUSINESS
  const enterprisePrice   = process.env.STRIPE_PRICE_ENTERPRISE || null
  if (enterprisePrice && priceId === enterprisePrice)   return 'intelligence'
  if (professionalPrice && priceId === professionalPrice) return 'intelligence'
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
  if (!secretKey || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

    const subscription     = typeof session.subscription === 'object' ? session.subscription : null
    const subscriptionId   = subscription?.id || session.subscription || null
    const subscriptionStatus = subscription?.status || null

    // Tier is always intelligence — both plans give full access
    const inferredTier = session.metadata?.tier
      || tierFromPriceId(subscription?.items?.data?.[0]?.price?.id)
      || tierFromPriceId(session.line_items?.data?.[0]?.price?.id)
      || 'intelligence'

    const isReady = session.status === 'complete'
      && !!subscriptionId
      && ['active', 'trialing'].includes(subscriptionStatus || '')

    if (!isReady) {
      return res.status(200).json({
        ready:             false,
        status:            session.status || null,
        paymentStatus:     session.payment_status || null,
        subscriptionStatus,
        tier:              inferredTier,
      })
    }

    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('profiles')
      .update({
        tier:                   inferredTier,
        stripe_customer_id:     session.customer  || null,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', userId)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      ready:                true,
      tier:                 inferredTier,
      stripeCustomerId:     session.customer  || null,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus,
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Could not verify checkout session.' })
  }
}
