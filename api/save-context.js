// env-reload
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  console.log('[save-context] received:', req.body)

  const { userId, context, industry, domain } = req.body || {}
  if (!userId || !context) {
    return res.status(400).json({ error: 'userId and context are required' })
  }

  const supabaseUrl         = process.env.SUPABASE_URL
  const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server config missing' })
  }

  // Service role key bypasses RLS — no need for a user session
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const update = { context: context.trim(), onboarding_complete: true }
  if (industry) update.industry = industry
  if (domain)   update.domain   = domain

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)

  if (error) {
    console.error('[save-context] update error:', error.message)
    return res.status(500).json({ error: error.message })
  }

  return res.json({ success: true })
}
