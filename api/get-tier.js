import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId required' })
  if (!await validateUserToken(req, res, userId)) return

  const supabaseUrl        = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server config missing' })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('profiles')
    .select('tier, industry, domain')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[get-tier] error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.json({ tier: data?.tier ?? 'foundation', industry: data?.industry ?? null, domain: data?.domain ?? null })
}
