import { createHmac, timingSafeEqual } from 'crypto'

export function signOAuthState(payload, secret) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(raw).digest('hex')
  return `${raw}.${signature}`
}

export function verifyOAuthState(rawState, secret, maxAgeMs = 10 * 60 * 1000) {
  if (!secret || !rawState) return null

  const dot = rawState.lastIndexOf('.')
  if (dot === -1) return null

  const raw = rawState.slice(0, dot)
  const providedSig = rawState.slice(dot + 1)
  const expectedSig = createHmac('sha256', secret).update(raw).digest('hex')

  if (providedSig.length !== expectedSig.length) return null
  try {
    if (!timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) return null
  } catch {
    return null
  }

  let payload
  try {
    payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!payload?.userId || !payload?.nonce || !payload?.ts) return null
  if (Date.now() - payload.ts > maxAgeMs) return null

  return payload
}
