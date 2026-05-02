export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' })
  }

  const { plan, email } = req.body

  const priceId =
    plan === 'business'
      ? process.env.STRIPE_PRICE_ID_BUSINESS
      : process.env.STRIPE_PRICE_ID_ESSENTIAL

  if (!priceId) {
    return res.status(500).json({ error: `Price ID for plan "${plan}" not configured` })
  }

  const origin = req.headers.origin || 'https://tryselfaudit.com'
  const successUrl = `${origin}/?session=success`
  const cancelUrl = `${origin}/?session=cancel`

  // Build form-encoded body for Stripe API
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  if (email) {
    params.append('customer_email', email)
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (!response.ok) {
      return res.status(500).json({ error: session.error?.message || 'Stripe error' })
    }

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
