import { createClient } from '@supabase/supabase-js'

export const VALID_PLANS = ['foundation', 'intelligence']

export function normalizePlan(raw) {
  return raw === 'intelligence' ? 'intelligence' : 'foundation'
}

export function isIntelligencePlan(raw) {
  return normalizePlan(raw) === 'intelligence'
}

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export async function getUserPlan(userId, supabase = null) {
  if (!userId) return 'foundation'
  const sb = supabase || getServiceSupabase()
  const { data, error } = await sb
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  if (error) throw error
  return normalizePlan(data?.tier)
}

export async function requireIntelligencePlan({ userId, res, supabase = null, feature = 'This feature' }) {
  try {
    const plan = await getUserPlan(userId, supabase)
    if (plan !== 'intelligence') {
      res.status(403).json({ error: `${feature} is available on the Intelligence plan.` })
      return null
    }
    return plan
  } catch (error) {
    res.status(500).json({ error: error?.message || 'Could not verify plan access' })
    return null
  }
}
