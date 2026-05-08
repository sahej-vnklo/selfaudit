import { synthesizeEligibleUsers, synthesizeUserIntelligence } from './lib/intelligence/synthesize.js'

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET || process.env.INTELLIGENCE_CRON_SECRET
  if (req.headers['x-vercel-cron'] && !secret) return true
  if (!secret) return false
  const provided = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query?.secret || req.body?.secret
  return provided === secret
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const userId = req.body?.userId || req.query?.userId || null
    const result = userId
      ? await synthesizeUserIntelligence(userId)
      : await synthesizeEligibleUsers()

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Synthesis failed' })
  }
}
