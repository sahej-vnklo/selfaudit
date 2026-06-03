import Stripe from 'stripe'
import { validateUserToken } from './lib/auth.js'
import { getCheckoutCancelUrl, getCheckoutPriceId, getCheckoutSuccessUrl } from './lib/checkout.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tier, userId, email } = req.body
  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const plan = ['professional', 'enterprise'].includes(tier) ? tier : 'professional'
  const priceId = getCheckoutPriceId(plan)
  if (!priceId) {
    return res.status(500).json({ error: `Stripe price not configured for plan: ${plan}` })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe secret key not configured' })
  }

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: getCheckoutSuccessUrl(plan),
      cancel_url:  getCheckoutCancelUrl(plan),
      metadata: { userId, tier: 'intelligence', plan, priceId },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
