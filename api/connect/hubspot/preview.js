import { createClient } from '@supabase/supabase-js'
import { fetchHubspotBusinessState } from '../../lib/connectors/hubspot.js'

function getAnonSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
}

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    const { userId } = req.body || {}
    if (!token || !userId) return res.status(200).json({ data: null })

    const anon = getAnonSupabase()
    const { data: authData, error: authError } = await anon.auth.getUser(token)
    if (authError || authData?.user?.id !== userId) return res.status(200).json({ data: null })

    const service = getServiceSupabase()
    const { data } = await service
      .from('profiles')
      .select('integrations')
      .eq('id', userId)
      .single()

    const hubspotData = await fetchHubspotBusinessState(userId, data?.integrations || {})
    return res.status(200).json(hubspotData || { data: null })
  } catch {
    return res.status(200).json({ data: null })
  }
}
