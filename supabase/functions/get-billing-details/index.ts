import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno&no-check'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, subscriptionId } = await req.json()

    if (!customerId || !subscriptionId) {
      throw new Error('Missing required fields: customerId, subscriptionId')
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Get the default payment method on the subscription or customer
    const pmId =
      (subscription.default_payment_method as string | null) ??
      (await stripe.customers.retrieve(customerId) as Stripe.Customer)
        .invoice_settings?.default_payment_method as string | null

    const paymentMethod = pmId
      ? await stripe.paymentMethods.retrieve(pmId)
      : null

    return new Response(
      JSON.stringify({
        current_period_end: subscription.current_period_end,
        status: subscription.status,
        card: paymentMethod?.card
          ? {
              last4:     paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year:  paymentMethod.card.exp_year,
              brand:     paymentMethod.card.brand,
            }
          : null,
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
