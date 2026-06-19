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
  'hubspot', 'salesforce', 'pipedrive', 'dynamics365',
  'stripe', 'maxio', 'freshbooks', 'zohoinvoice', 'taxjar',
  'quickbooks', 'xero', 'netsuite', 'brex', 'ramp', 'coupa', 'bench',
  'gmail', 'slack', 'outlook', 'teams', 'whatsapp', 'telegram', 'discord',
  'googleanalytics', 'googleads', 'metaads', 'mailchimp', 'klaviyo', 'mailerlite',
  'googledrive', 'notion', 'confluence', 'sharepoint', 'onedrive', 'egnyte',
  'zendesk', 'intercom', 'gorgias',
  'gusto', 'bamboohr', 'workday', 'greenhouse', 'lever',
  'asana', 'monday', 'clickup', 'basecamp', 'wrike',
  'airtable', 'harvest', 'toggl', 'calendly',
  'jira', 'linear', 'github', 'datadog', 'sentry', 'cloudflare', 'vercel', 'circleci',
  'shopify', 'wix', 'shippo', 'shipengine',
  'mixpanel', 'amplitude', 'posthog',
  'docusign', 'pandadoc', 'dropboxsign',
  'commcare', 'jotform', 'typeform',
  'square', 'lodgify', 'planyo',
  'detrack', 'optimoroute', 'route4me',
  'youtubeanalytics', 'spotify', 'webflow', 'gumroad',
  'zohocrm', 'zohobigin', 'zohbooks', 'zohoinventory', 'zohodesk', 'zohomail',
  'freshdesk', 'freshservice',
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
