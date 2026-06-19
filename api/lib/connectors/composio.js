// Composio v3 REST client — handles OAuth connection management and API proxying.
// All tokens are stored and refreshed by Composio. We never touch credentials directly.

const BASE = 'https://backend.composio.dev'

// Auth config IDs — created once per toolkit in Composio dashboard.
// These map our connector IDs to Composio's managed OAuth apps.
const AUTH_CONFIGS = {
  hubspot:     'ac_EkxRNE1G9SPd',
  stripe:      'ac_UH0RLsixqvUv',
  gmail:       'ac_1PmkB8cE4IBB',
  slack:       'ac_X3Kpp80Or5bc',
  notion:      'ac_RGheSSclY33r',
  zendesk:     'ac_hsgqzfVxc3r2',
  googledrive: 'ac_sxu9Kz2eLUcM',
}

async function composioFetch(path, options = {}) {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) throw new Error('COMPOSIO_API_KEY is not set')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Composio API error ${res.status} on ${path}`)
  }

  return res.json()
}

// Composio toolkit slugs — maps our connector IDs to Composio's toolkit names.
// Only needed when our connector ID differs from the Composio slug.
const TOOLKIT_SLUGS = {
  googleanalytics: 'google_analytics',
  metaads:         'facebook',
  teams:           'microsoft_teams',
  sharepoint:      'share_point',
  onedrive:        'one_drive',
  zohoinvoice:     'zoho_invoice',
  dropboxsign:     'dropbox_sign',
  planyo:          'planyo_online_booking',
  zohocrm:         'zoho',
  zohbooks:        'zoho_books',
  zohoinventory:   'zoho_inventory',
  zohobigin:       'zoho_bigin',
  zohodesk:        'zoho_desk',
  zohomail:        'zoho_mail',
}

// Returns the OAuth redirect URL for a user to connect a specific toolkit.
// Uses a custom auth_config_id if one is configured (for our own OAuth apps),
// otherwise falls back to Composio's shared OAuth for that toolkit.
export async function getComposioAuthLink(userId, toolkit, redirectUrl) {
  const authConfigId = AUTH_CONFIGS[toolkit]
  const toolkitSlug  = TOOLKIT_SLUGS[toolkit] ?? toolkit

  const body = {
    user_id:      userId,
    redirect_url: redirectUrl,
    ...(authConfigId ? { auth_config_id: authConfigId } : { toolkit: toolkitSlug }),
  }

  const data = await composioFetch('/api/v3/connected_accounts/link', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return {
    redirectUrl: data.redirect_url,
    connectedAccountId: data.connected_account_id,
  }
}

// Returns all active Composio connections for a user.
export async function getComposioConnections(userId) {
  const data = await composioFetch(
    `/api/v3/connected_accounts?user_id=${encodeURIComponent(userId)}`
  )
  return (data.items || []).filter(c => c.status === 'ACTIVE')
}

// Returns the active connected account for a specific user + toolkit, or null.
export async function getComposioConnection(userId, toolkit) {
  const connections = await getComposioConnections(userId)
  return connections.find(c => c.toolkit?.slug === toolkit) || null
}

// Returns a map of toolkit → { connected, connectedAt } for a user.
// Used by the status endpoint to show which connectors are active.
export async function getComposioConnectionMap(userId) {
  const connections = await getComposioConnections(userId)
  const map = {}
  for (const conn of connections) {
    const slug = conn.toolkit?.slug
    if (slug) {
      map[slug] = {
        connected: true,
        connected_account_id: conn.id,
        connected_at: conn.createdAt || null,
      }
    }
  }
  return map
}

// Proxy an authenticated HTTP request through a Composio connected account.
// endpoint is just the path (e.g. '/crm/v3/objects/deals'), not the full URL.
// Composio adds auth headers using the stored credentials for that account.
export async function composioProxy(connectedAccountId, { endpoint, method = 'GET', parameters = {}, body = null }) {
  const payload = {
    connected_account_id: connectedAccountId,
    endpoint,
    method,
  }
  if (Object.keys(parameters).length) payload.parameters = parameters
  if (body !== null)                   payload.body = body

  return composioFetch('/api/v3.1/tools/execute/proxy', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Executes a Composio pre-built tool on behalf of a user.
// toolSlug examples: 'HUBSPOT_LIST_DEALS', 'GMAIL_SEND_EMAIL', 'SLACK_SENDS_A_MESSAGE'
// Used for Phase 4 AI actions (drafting, sending, posting).
export async function executeTool(userId, toolSlug, args = {}) {
  return composioFetch(`/api/v3.1/tools/execute/${encodeURIComponent(toolSlug)}`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, arguments: args }),
  })
}

// Disconnects a user's connection for a specific toolkit.
export async function disconnectComposio(userId, toolkit) {
  const conn = await getComposioConnection(userId, toolkit)
  if (!conn) return false

  await composioFetch(`/api/v3/connected_accounts/${conn.id}`, { method: 'DELETE' })
  return true
}
