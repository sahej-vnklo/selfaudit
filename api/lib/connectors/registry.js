// Connector registry — single source of truth for all connectors TSA supports.
// Dashboard UI, /api/connectors endpoint, and future automation all read from here.

export const CONNECTOR_REGISTRY = [
  {
    id:          'hubspot',
    name:        'HubSpot',
    category:    'CRM',
    status:      'available',
    auth_type:   'oauth',
    description: 'Pull pipeline, deal, and contact data to sharpen sales and revenue diagnostics.',
    data_types:  ['deals', 'contacts', 'companies', 'pipeline_stages'],
    intelligence_use_cases: [
      'Sales conversion rate analysis',
      'Pipeline health and deal velocity',
      'Customer segment profiling',
      'Revenue bottleneck identification',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'stripe',
    name:        'Stripe',
    category:    'Revenue',
    status:      'available',
    auth_type:   'oauth',
    description: 'Connect revenue, churn, and subscription data for financial health analysis.',
    data_types:  ['mrr', 'churn_rate', 'subscriptions', 'refunds', 'ltv'],
    intelligence_use_cases: [
      'MRR trend and churn analysis',
      'LTV vs CAC health check',
      'Subscription cohort patterns',
      'Revenue concentration risk',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'gmail',
    name:        'Gmail',
    category:    'Email',
    status:      'available',
    auth_type:   'oauth',
    description: 'Surface email volume, response patterns, and customer communication signals.',
    data_types:  ['email_volume', 'response_time', 'thread_patterns'],
    intelligence_use_cases: [
      'Customer communication health',
      'Sales follow-up gap detection',
      'Support response time benchmarking',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'googledrive',
    name:        'Google Drive',
    category:    'Docs',
    status:      'available',
    auth_type:   'oauth',
    description: 'Index business documents, SOPs, and playbooks to enrich the intelligence layer.',
    data_types:  ['documents', 'spreadsheets', 'shared_files'],
    intelligence_use_cases: [
      'SOP coverage gap detection',
      'Playbook consistency analysis',
      'Documentation debt surfacing',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'slack',
    name:        'Slack',
    category:    'Comms',
    status:      'available',
    auth_type:   'oauth',
    description: 'Analyse team communication patterns and operational signal from Slack activity.',
    data_types:  ['channel_activity', 'response_times', 'team_patterns'],
    intelligence_use_cases: [
      'Team velocity and bottleneck signals',
      'Cross-functional communication gaps',
      'Operational noise vs signal ratio',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'notion',
    name:        'Notion',
    category:    'Docs',
    status:      'available',
    auth_type:   'oauth',
    description: 'Pull strategy docs, OKRs, and wikis into the intelligence layer for context.',
    data_types:  ['pages', 'databases', 'okrs'],
    intelligence_use_cases: [
      'Goal alignment between stated OKRs and audit findings',
      'Strategy document vs execution gap',
    ],
    required_tier: 'intelligence',
  },
  {
    id:          'zendesk',
    name:        'Zendesk',
    category:    'Support',
    status:      'available',
    auth_type:   'api_key',
    description: 'Surface ticket volume, resolution time, and recurring customer issues.',
    data_types:  ['ticket_volume', 'resolution_time', 'csat', 'recurring_issues'],
    intelligence_use_cases: [
      'Support load and team capacity analysis',
      'Recurring issue pattern detection',
      'Customer satisfaction trend monitoring',
    ],
    required_tier: 'intelligence',
  },
]

// Returns the full registry
export function getConnectorRegistry() {
  return CONNECTOR_REGISTRY
}

// Returns only connectors with status === 'available'
export function getAvailableConnectors() {
  return CONNECTOR_REGISTRY.filter(c => c.status === 'available')
}

// Returns a single connector definition by id, or null
export function getConnectorDefinition(id) {
  return CONNECTOR_REGISTRY.find(c => c.id === id) ?? null
}
