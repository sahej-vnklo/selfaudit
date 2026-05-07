import { createClient } from '@supabase/supabase-js'
import { PROVIDER_CONFIGS } from './providers.js'

function getServiceSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export async function refreshTokenIfNeeded(userId, provider, integrations = {}) {
  const config = PROVIDER_CONFIGS[provider]
  const current = integrations?.[provider]
  const now = Date.now()

  if (!config || !current?.access_token) {
    throw new Error(`Token refresh failed for ${provider}`)
  }

  if (current.expires_at && current.expires_at - now > 5 * 60 * 1000) {
    return current.access_token
  }

  if (!current.refresh_token) {
    throw new Error(`Token refresh failed for ${provider}`)
  }

  try {
    const response = await fetch(config.refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId || '',
        client_secret: config.clientSecret || '',
        refresh_token: current.refresh_token,
      }),
    })

    if (!response.ok) throw new Error('refresh rejected')
    const tokenData = await response.json()
    const nextIntegration = {
      ...current,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || current.refresh_token,
      expires_at: now + ((tokenData.expires_in || 0) * 1000),
      scopes: Array.isArray(tokenData.scope)
        ? tokenData.scope
        : String(tokenData.scope || '').split(/\s+/).filter(Boolean),
    }

    const nextIntegrations = { ...integrations, [provider]: nextIntegration }
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('profiles')
      .update({ integrations: nextIntegrations })
      .eq('id', userId)

    if (error) throw error
    return nextIntegration.access_token
  } catch {
    throw new Error(`Token refresh failed for ${provider}`)
  }
}
