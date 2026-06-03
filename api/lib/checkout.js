export function getCheckoutPriceId(plan, env = process.env) {
  if (plan === 'enterprise') {
    return env.STRIPE_PRICE_ENTERPRISE || null
  }
  return env.STRIPE_PRICE_PROFESSIONAL || env.STRIPE_PRICE_INTELLIGENCE || env.STRIPE_PRICE_BUSINESS || null
}

export function getCheckoutAppUrl(env = process.env) {
  return env.APP_URL || 'http://localhost:3000'
}

export function getCheckoutSuccessUrl(plan, env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  const safePlan = ['professional', 'enterprise'].includes(plan) ? plan : 'professional'
  return `${appUrl}/#billing?checkout=success&plan=${safePlan}&session_id={CHECKOUT_SESSION_ID}`
}

export function getCheckoutCancelUrl(plan, env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  const safePlan = ['professional', 'enterprise'].includes(plan) ? plan : 'professional'
  return `${appUrl}/#signup?plan=${safePlan}`
}
