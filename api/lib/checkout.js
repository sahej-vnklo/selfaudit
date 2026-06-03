export function getCheckoutPriceId(env = process.env) {
  return env.STRIPE_PRICE_INTELLIGENCE || env.STRIPE_PRICE_BUSINESS || null
}

export function getCheckoutAppUrl(env = process.env) {
  return env.APP_URL || 'http://localhost:3000'
}

export function getCheckoutSuccessUrl(env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  return `${appUrl}/#billing?checkout=success&plan=intelligence&session_id={CHECKOUT_SESSION_ID}`
}

export function getCheckoutCancelUrl(env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  return `${appUrl}/#signup?plan=intelligence`
}
