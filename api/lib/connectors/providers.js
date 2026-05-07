export const PROVIDER_CONFIGS = {
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    refreshUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: [
      'crm.objects.contacts.read',
      'crm.objects.deals.read',
      'crm.objects.companies.read',
    ],
    redirectUri: `${process.env.APP_URL}/api/connect/hubspot/callback`,
  },
}
