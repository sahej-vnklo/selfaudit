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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secretKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
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

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object
    const { userId, tier } = session.metadata || {}

    if (userId && tier) {
      const supabase = getSupabase()
      const { error } = await supabase
        .from('profiles')
        .update({ tier })
        .eq('id', userId)

      if (error) {
        console.error('[stripe-webhook] profile update failed:', error.message)
        return res.status(500).json({ error: error.message })
      }
    }
  }

  return res.status(200).json({ received: true })
}
