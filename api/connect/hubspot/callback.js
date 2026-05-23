import { createClient } from '@supabase/supabase-js'
import { PROVIDER_CONFIGS } from '../../lib/connectors/providers.js'
import { synthesizeUserIntelligence } from '../../lib/intelligence/synthesize.js'
import { verifyOAuthState } from '../lib/connectors/oauth-state.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  const config = PROVIDER_CONFIGS.hubspot
  const appUrl = process.env.APP_URL || 'https://tryselfaudit.com'
  const code = req.query?.code
  const rawState = req.query?.state

  try {
    const decoded = verifyOAuthState(rawState, process.env.OAUTH_STATE_SECRET)
    if (!code || decoded?.provider !== 'hubspot' || !decoded?.userId) {
      return res.redirect(302, `${appUrl}/#connectors?error=hubspot`)
    }

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId || '',
        client_secret: config.clientSecret || '',
        redirect_uri: config.redirectUri,
        code: String(code),
      }),
    })

    if (!tokenResponse.ok) {
      return res.redirect(302, `${appUrl}/#connectors?error=hubspot`)
    }

    const tokenData = await tokenResponse.json()
    const integration = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + ((tokenData.expires_in || 0) * 1000),
      scopes: Array.isArray(tokenData.scope)
        ? tokenData.scope
        : String(tokenData.scope || '').split(/\s+/).filter(Boolean),
      connected_at: new Date().toISOString(),
      last_synced_at: null,
    }

    const supabase = getSupabase()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', decoded.userId)
      .single()

    if (profileError) {
      return res.redirect(302, `${appUrl}/#connectors?error=hubspot`)
    }

    const nextIntegrations = {
      ...(profile?.integrations || {}),
      hubspot: integration,
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ integrations: nextIntegrations })
      .eq('id', decoded.userId)

    if (updateError) {
      return res.redirect(302, `${appUrl}/#connectors?error=hubspot`)
    }

    synthesizeUserIntelligence(decoded.userId, { supabase }).catch(() => {})

    return res.redirect(302, `${appUrl}/#connectors?connected=hubspot`)
  } catch {
    return res.redirect(302, `${appUrl}/#connectors?error=hubspot`)
  }
}
