export function getCronQuerySecret(req) {
  try {
    if (req?.query?.secret) return req.query.secret
    const url = new URL(req?.url || '', 'http://localhost')
    return url.searchParams.get('secret')
  } catch {
    return null
  }
}

export function isAuthorisedCronRequest(req, secret) {
  if (!secret) return false
  const authHeader = String(req?.headers?.authorization || '')
  if (authHeader === `Bearer ${secret}`) return true
  return getCronQuerySecret(req) === secret
}
