import Stripe from 'stripe'

const PRICE_IDS = {
  foundation:   process.env.STRIPE_PRICE_FOUNDATION   || process.env.STRIPE_PRICE_ESSENTIAL || null,
  intelligence: process.env.STRIPE_PRICE_INTELLIGENCE || process.env.STRIPE_PRICE_BUSINESS  || 'price_1TRDcRJxpOyRd0sIrivReTDB',
  // legacy aliases
  essential:    process.env.STRIPE_PRICE_FOUNDATION   || process.env.STRIPE_PRICE_ESSENTIAL || null,
  business:     process.env.STRIPE_PRICE_INTELLIGENCE || process.env.STRIPE_PRICE_BUSINESS  || 'price_1TRDcRJxpOyRd0sIrivReTDB',
  portfolio:    process.env.STRIPE_PRICE_PORTFOLIO    || 'price_1TRDcjJxpOyRd0sIaryd6fga',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tier, userId, email } = req.body
  if (!tier || !userId || !email) {
    return res.status(400).json({ error: 'Missing tier, userId, or email' })
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    return res.status(400).json({ error: `Unknown or unconfigured tier: ${tier}` })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe secret key not configured' })
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000'

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${appUrl}/#dashboard`,
      cancel_url:  `${appUrl}/#signup`,
      metadata: { userId, tier, priceId },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
