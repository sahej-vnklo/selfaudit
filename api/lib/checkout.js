export function buildPriceIdMap(env = process.env) {
  return {
    foundation: env.STRIPE_PRICE_FOUNDATION || env.STRIPE_PRICE_ESSENTIAL || null,
    intelligence: env.STRIPE_PRICE_INTELLIGENCE || env.STRIPE_PRICE_BUSINESS || null,
  }
}

export function normalizeCheckoutTier(rawTier) {
  if (rawTier === 'foundation') return 'foundation'
  if (rawTier === 'intelligence') return 'intelligence'
  return rawTier || null
}

export function getCheckoutPriceId(rawTier, env = process.env) {
  const normalizedTier = normalizeCheckoutTier(rawTier)
  const priceIds = buildPriceIdMap(env)
  return normalizedTier ? (priceIds[normalizedTier] || null) : null
}

export function getCheckoutAppUrl(env = process.env) {
  return env.APP_URL || 'http://localhost:3000'
}

export function getCheckoutSuccessUrl(tier, env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  const normalizedTier = normalizeCheckoutTier(tier) || 'foundation'
  return `${appUrl}/#billing?checkout=success&plan=${encodeURIComponent(normalizedTier)}&session_id={CHECKOUT_SESSION_ID}`
}

export function getCheckoutCancelUrl(tier, env = process.env) {
  const appUrl = getCheckoutAppUrl(env)
  const normalizedTier = normalizeCheckoutTier(tier) || 'foundation'
  return `${appUrl}/#signup?plan=${encodeURIComponent(normalizedTier)}`
}
