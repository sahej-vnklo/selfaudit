import { createClient } from '@supabase/supabase-js'
import { PROVIDER_CONFIGS } from '../../lib/connectors/providers.js'
import { synthesizeUserIntelligence } from '../../lib/intelligence/synthesize.js'
import { verifyOAuthState } from '../lib/connectors/oauth-state.js'
import { getUserPlan } from '../lib/plans.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  const config = PROVIDER_CONFIGS.stripe
  const appUrl = process.env.APP_URL || 'https://tryselfaudit.com'
  const code     = req.query?.code
  const rawState = req.query?.state

  try {
    const decoded = verifyOAuthState(rawState, process.env.OAUTH_STATE_SECRET)
    if (!code || decoded?.provider !== 'stripe' || !decoded?.userId) {
      return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
    }

    const supabase = getSupabase()
    const plan = await getUserPlan(decoded.userId, supabase).catch(() => 'foundation')
    if (plan !== 'intelligence') {
      return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_secret: config.clientSecret || '',
        code:          String(code),
      }),
    })

    if (!tokenResponse.ok) {
      console.error('[stripe-callback] token exchange failed:', await tokenResponse.text())
      return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
    }

    const tokenData = await tokenResponse.json()
    // Stripe Connect returns access_token (a live secret key for the connected account)
    // and stripe_user_id (the connected account ID)
    const integration = {
      access_token:   tokenData.access_token,
      stripe_user_id: tokenData.stripe_user_id,
      scope:          tokenData.scope,
      livemode:       tokenData.livemode ?? true,
      connected_at:   new Date().toISOString(),
      last_synced_at: null,
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('integrations')
      .eq('id', decoded.userId)
      .single()

    if (profileError) {
      return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ integrations: { ...(profile?.integrations || {}), stripe: integration } })
      .eq('id', decoded.userId)

    if (updateError) {
      return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
    }

    synthesizeUserIntelligence(decoded.userId, { supabase }).catch(() => {})

    return res.redirect(302, `${appUrl}/#connectors?connected=stripe`)
  } catch (err) {
    console.error('[stripe-callback]', err.message)
    return res.redirect(302, `${appUrl}/#connectors?error=stripe`)
  }
}
