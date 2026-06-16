// Pure config. No logic, no imports.
// Adding a new connector = add one entry here. Nothing else changes anywhere.
//
// slug:    Composio tool slug (find at platform.composio.dev)
// args:    arguments passed to that tool
// dataKey: key used to store the result in memory

export const TOOL_REGISTRY = {
  hubspot: {
    category: 'crm',
    tools: [
      {
        slug: 'HUBSPOT_LIST_DEALS',
        args: { limit: 50, properties: ['dealname', 'amount', 'dealstage', 'closedate', 'hs_deal_stage_probability', 'pipeline'] },
        dataKey: 'deals',
      },
      {
        slug: 'HUBSPOT_LIST_CONTACTS',
        args: { limit: 50, properties: ['firstname', 'lastname', 'email', 'hs_lead_status', 'lifecyclestage', 'createdate'] },
        dataKey: 'contacts',
      },
      {
        slug: 'HUBSPOT_LIST_PIPELINES',
        args: {},
        dataKey: 'pipelines',
      },
    ],
  },

  stripe: {
    category: 'revenue',
    tools: [
      {
        slug: 'STRIPE_LIST_SUBSCRIPTIONS',
        args: { status: 'active', limit: 100 },
        dataKey: 'active_subs',
      },
      {
        slug: 'STRIPE_LIST_SUBSCRIPTIONS',
        args: { status: 'canceled', limit: 100 },
        dataKey: 'canceled_subs',
      },
    ],
  },

  gmail: {
    category: 'email',
    tools: [
      {
        slug: 'GMAIL_LIST_THREADS',
        args: { maxResults: 50 },
        dataKey: 'threads',
      },
    ],
  },

  slack: {
    category: 'comms',
    tools: [
      {
        slug: 'SLACK_LIST_CHANNELS',
        args: {},
        dataKey: 'channels',
      },
    ],
  },

  notion: {
    category: 'docs',
    tools: [
      {
        slug: 'NOTION_LIST_PAGES',
        args: {},
        dataKey: 'pages',
      },
    ],
  },

  zendesk: {
    category: 'support',
    tools: [
      {
        slug: 'ZENDESK_LIST_TICKETS',
        args: { status: 'open' },
        dataKey: 'open_tickets',
      },
    ],
  },

  googledrive: {
    category: 'docs',
    tools: [
      {
        slug: 'GOOGLEDRIVE_LIST_FILES',
        args: { pageSize: 20 },
        dataKey: 'files',
      },
    ],
  },
}
