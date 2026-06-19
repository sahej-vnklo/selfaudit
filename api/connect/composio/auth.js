// Single OAuth initiation endpoint for all Composio-managed connectors.
// Replaces api/connect/hubspot/auth.js and api/connect/stripe/auth.js.
// Frontend calls POST /api/connect/composio/auth with { provider, userId }
// and gets back { url } to redirect the user to.

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../../lib/auth.js'
import { requireIntelligencePlan } from '../../lib/plans.js'
import { getComposioAuthLink } from '../../lib/connectors/composio.js'

const APP_URL = process.env.APP_URL || 'https://tryselfaudit.com'

const SUPPORTED_PROVIDERS = [
  'hubspot', 'stripe', 'gmail', 'slack', 'notion', 'zendesk', 'googledrive',
  'salesforce', 'pipedrive', 'quickbooks', 'xero', 'googleanalytics', 'googleads',
  'metaads', 'mailchimp', 'klaviyo', 'confluence', 'gusto', 'rippling', 'bamboohr',
  'intercom', 'asana', 'monday', 'clickup', 'airtable', 'jira', 'linear', 'deel',
  'multiplier', 'github', 'datadog', 'sentry', 'shopify', 'woocommerce', 'gorgias',
  'shipstation', 'easypost', 'mixpanel', 'amplitude', 'posthog', 'chargebee',
  'recurly', 'profitwell', 'paddle', 'harvest', 'toggl', 'forecast', 'clio', 'mycase',
  'simplepractice', 'jane', 'mindbody', 'practicefusion', 'kareo',
  'procore', 'buildertrend',
  'toast', 'square', 'opentable', 'resy', 'lightspeed',
  'buildium', 'appfolio', 'yardi',
  'samsara', 'verizonconnect', 'freightpop', 'shipwell',
]

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, provider } = req.body || {}

  if (!userId)   return res.status(400).json({ error: 'Missing userId' })
  if (!provider) return res.status(400).json({ error: 'Missing provider' })
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: `Unsupported provider: ${provider}` })
  }

  if (!await validateUserToken(req, res, userId)) return

  const supabase = getSupabase()
  if (!await requireIntelligencePlan({ userId, res, supabase, feature: 'Connectors' })) return

  try {
    const redirectUrl = `${APP_URL}/#connectors?connected=${provider}`
    const { redirectUrl: composioUrl } = await getComposioAuthLink(userId, provider, redirectUrl)

    return res.status(200).json({ url: composioUrl })
  } catch (err) {
    console.error(`[composio/auth] ${provider} link failed:`, err.message)
    return res.status(500).json({ error: 'Failed to generate connection link' })
  }
}
