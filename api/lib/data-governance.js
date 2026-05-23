export const DATA_EXPORT_COLLECTIONS = [
  'profile',
  'reports',
  'chats',
  'business_state',
  'user_memory',
  'intelligence_profile',
  'intelligence_brief',
  'notification_preferences',
  'risk_alerts',
  'connector_sync_logs',
]

export function sanitizeIntegrationsForExport(integrations) {
  if (!integrations || typeof integrations !== 'object') return {}
  const next = {}
  for (const [provider, value] of Object.entries(integrations)) {
    if (!value || typeof value !== 'object') {
      next[provider] = value
      continue
    }
    next[provider] = {
      connected_at: value.connected_at || null,
      last_synced_at: value.last_synced_at || null,
      expires_at: value.expires_at || null,
      scopes: Array.isArray(value.scopes) ? value.scopes : [],
      has_access_token: !!value.access_token,
      has_refresh_token: !!value.refresh_token,
    }
  }
  return next
}

export function buildAccountDataExport(payload) {
  return {
    exported_at: new Date().toISOString(),
    format_version: 1,
    collections: DATA_EXPORT_COLLECTIONS,
    data: payload,
  }
}

export function buildAccountExportFilename(email = '') {
  const safePrefix = String(email || 'selfaudit-user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'selfaudit-user'
  return `${safePrefix}-account-data.json`
}
