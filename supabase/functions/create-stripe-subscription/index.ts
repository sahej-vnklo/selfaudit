import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno&no-check'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const PRICE_IDS: Record<string, string | undefined> = {
  foundation:   Deno.env.get('STRIPE_PRICE_FOUNDATION')   || Deno.env.get('STRIPE_PRICE_ESSENTIAL'),
  intelligence: Deno.env.get('STRIPE_PRICE_INTELLIGENCE') || Deno.env.get('STRIPE_PRICE_BUSINESS'),
  // legacy aliases — kept for backward compat with any in-flight sessions
  essential:    Deno.env.get('STRIPE_PRICE_FOUNDATION')   || Deno.env.get('STRIPE_PRICE_ESSENTIAL'),
  business:     Deno.env.get('STRIPE_PRICE_INTELLIGENCE') || Deno.env.get('STRIPE_PRICE_BUSINESS'),
  portfolio:    Deno.env.get('STRIPE_PRICE_PORTFOLIO'),
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email, name, tier, paymentMethodId } = await req.json()

    if (!userId || !email || !tier || !paymentMethodId) {
      throw new Error('Missing required fields: userId, email, tier, paymentMethodId')
    }

    const priceId = PRICE_IDS[tier]
    if (!priceId) {
      throw new Error(`No price configured for tier: ${tier}`)
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({ email, name })

    // Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    })

    return new Response(
      JSON.stringify({
        customerId: customer.id,
        subscriptionId: subscription.id,
        status: subscription.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
