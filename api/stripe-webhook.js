import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function tierFromPriceId(priceId) {
  if (!priceId) return null
  const intelligencePrice = process.env.STRIPE_PRICE_INTELLIGENCE || process.env.STRIPE_PRICE_BUSINESS
  if (priceId === intelligencePrice) return 'intelligence'
  return null
}

async function handleSubscriptionDeleted(event, supabase) {
  const subscription = event.data.object
  const customerId   = subscription.customer

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile?.id) {
    console.warn('[stripe-webhook] could not find profile for deleted subscription:', customerId)
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({ tier: 'foundation', stripe_subscription_id: null })
    .eq('id', profile.id)

  if (error) {
    console.error('[stripe-webhook] subscription deleted — profile update failed:', error.message)
  } else {
    console.log('[stripe-webhook] subscription cancelled, tier reset to foundation for user', profile.id)
  }
}

async function handleSubscriptionCreatedOrUpdated(event, supabase) {
  const subscription = event.data.object
  const customerId   = subscription.customer
  const priceId      = subscription.items?.data?.[0]?.price?.id
  const tier         = tierFromPriceId(priceId)

  if (!tier) {
    console.warn('[stripe-webhook] unknown price ID — cannot map to tier:', priceId)
    return
  }

  // Find the user whose profile has this stripe_customer_id
  let { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  // Fallback: look up by customer email if customer_id isn't written yet
  if (!profile) {
    const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
    const customer  = await stripe.customers.retrieve(customerId)
    if (customer?.email) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single()
      profile = byEmail
    }
  }

  if (!profile?.id) {
    console.warn('[stripe-webhook] could not find profile for customer:', customerId)
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      tier,
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('[stripe-webhook] profile update failed:', error.message)
  } else {
    console.log('[stripe-webhook] tier set to', tier, 'for user', profile.id)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secretKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe env vars not configured' })
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })
  const sig    = req.headers['stripe-signature']

  let event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` })
  }

  const supabase = getSupabase()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId  = session.client_reference_id || session.metadata?.userId
    const { tier, priceId } = session.metadata || {}

    if (userId && tier) {
      const { error } = await supabase
        .from('profiles')
        .update({
          tier,
          stripe_customer_id:     session.customer     || null,
          stripe_subscription_id: session.subscription || null,
        })
        .eq('id', userId)

      if (error) {
        console.error('[stripe-webhook] checkout profile update failed:', error.message)
        return res.status(500).json({ error: error.message })
      }
    }
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    await handleSubscriptionCreatedOrUpdated(event, supabase)
  }

  if (event.type === 'customer.subscription.deleted') {
    await handleSubscriptionDeleted(event, supabase)
  }

  return res.status(200).json({ received: true })
}
