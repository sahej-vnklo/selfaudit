import { createIndustry } from '../schema.js'

export const INDUSTRY_CATALOG = {
  'saas-software': createIndustry({
    id: 'saas-software',
    label: 'Software / SaaS',
    description: 'Subscription or software product sold online.',
    defaultAreas: ['product-engineering', 'customer-service', 'marketing-sales', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      // product & engineering
      'feature', 'bug', 'deployment', 'incident',
      // customer service
      'customer', 'support-ticket', 'agent', 'support-channel',
      // marketing & sales
      'deal', 'lead',
      // finance & accounting
      'saas-invoice', 'expense', 'budget', 'vendor',
      // management & strategy
      'goal', 'team-member', 'decision',
      // people & HR (optional area — units show if user adds it)
      'employee', 'job-opening', 'performance-review',
    ],
  }),

  'ecommerce-d2c': createIndustry({
    id: 'ecommerce-d2c',
    label: 'E-commerce',
    description: 'Sell products online directly to consumers.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'order', 'ecom-customer',                           // revenue-sales
      'sku', 'supplier',                                  // inventory-operations
      'support-ticket', 'agent', 'support-channel',       // customer-service
      'saas-invoice', 'expense', 'budget', 'vendor',      // finance-accounting
      'goal', 'team-member', 'decision',                  // management-strategy
    ],
  }),

  'marketplace-platform': createIndustry({
    id: 'marketplace-platform',
    label: 'Marketplace / Platform',
    description: 'Connect buyers and sellers on a shared platform.',
    defaultAreas: ['marketplace-transactions', 'marketplace-trust', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'transaction', 'marketplace-seller', 'marketplace-buyer', // marketplace-transactions
      'dispute',                                                 // marketplace-trust
      'expense', 'budget', 'vendor',                            // finance-accounting
      'goal', 'team-member', 'decision',                        // management-strategy
    ],
  }),

  'consumer-app': createIndustry({
    id: 'consumer-app',
    label: 'Consumer App',
    description: 'App people download and use on mobile or desktop.',
    defaultAreas: ['app-engagement', 'app-growth', 'app-monetisation', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'app-user', 'app-session',              // app-engagement
      'install',                              // app-growth
      'in-app-purchase', 'app-subscription',  // app-monetisation
      'expense', 'budget', 'vendor',          // finance-accounting
      'goal', 'team-member', 'decision',      // management-strategy
    ],
  }),

  'professional-services': createIndustry({
    id: 'professional-services',
    label: 'Agency / Professional Services',
    description: 'Sell expertise, time, or deliverables to clients.',
    defaultAreas: ['client-delivery', 'marketing-sales', 'people-hr', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'project', 'ps-client', 'consultant', 'invoice',    // client-delivery
      'deal', 'lead',                                      // marketing-sales
      'employee', 'job-opening', 'performance-review',     // people-hr
      'expense', 'budget', 'vendor',                       // finance-accounting
      'goal', 'team-member', 'decision',                   // management-strategy
    ],
  }),

  'life-sciences': createIndustry({
    id: 'life-sciences',
    label: 'Life Sciences',
    description: 'Biotech, pharma, or medical research business.',
    defaultAreas: ['rd-pipeline', 'clinical-regulatory', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'experiment', 'research-grant',                   // rd-pipeline
      'clinical-trial', 'regulatory-submission',        // clinical-regulatory
      'expense', 'budget', 'vendor',                    // finance-accounting
      'goal', 'team-member', 'decision',                // management-strategy
    ],
  }),

  'manufacturing': createIndustry({
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Make physical goods at scale.',
    defaultAreas: ['production', 'inventory-operations', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'machine', 'production-line', 'manufacturing-order',  // production
      'raw-material', 'mfg-supplier', 'sku',                // inventory-operations
      'expense', 'budget', 'vendor',                        // finance-accounting
      'goal', 'team-member', 'decision',                    // management-strategy
    ],
  }),

  'wholesale-distribution': createIndustry({
    id: 'wholesale-distribution',
    label: 'Wholesale / Distribution',
    description: 'Sell products in bulk to business customers.',
    defaultAreas: ['wholesale-sales', 'inventory-operations', 'wholesale-credit', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'wholesale-order', 'wholesale-account',         // wholesale-sales
      'sku', 'supplier',                              // inventory-operations
      'wholesale-invoice',                            // wholesale-credit
      'expense', 'budget', 'vendor',                  // finance-accounting
      'goal', 'team-member', 'decision',              // management-strategy
    ],
  }),

  'logistics-freight': createIndustry({
    id: 'logistics-freight',
    label: 'Logistics & Freight',
    description: 'Move goods via fleet, carrier, or last-mile delivery.',
    defaultAreas: ['logistics-shipments', 'logistics-fleet', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'shipment', 'freight-invoice',          // logistics-shipments
      'vehicle', 'driver', 'maintenance-event', // logistics-fleet
      'expense', 'budget', 'vendor',          // finance-accounting
      'goal', 'team-member', 'decision',      // management-strategy
    ],
  }),

  'retail': createIndustry({
    id: 'retail',
    label: 'Retail',
    description: 'Physical store selling products to consumers.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'order', 'ecom-customer',                           // revenue-sales
      'sku', 'supplier',                                  // inventory-operations
      'support-ticket', 'agent', 'support-channel',       // customer-service
      'saas-invoice', 'expense', 'budget', 'vendor',      // finance-accounting
      'goal', 'team-member', 'decision',                  // management-strategy
    ],
  }),

  'retail-hospitality': createIndustry({
    id: 'retail-hospitality',
    label: 'Retail & Hospitality',
    description: 'Physical retail stores, restaurants, and hospitality businesses.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'order', 'ecom-customer',                           // revenue-sales
      'sku', 'supplier',                                  // inventory-operations
      'support-ticket', 'agent', 'support-channel',       // customer-service
      'saas-invoice', 'expense', 'budget', 'vendor',      // finance-accounting
      'goal', 'team-member', 'decision',                  // management-strategy
    ],
  }),

  'hospitality-fb': createIndustry({
    id: 'hospitality-fb',
    label: 'Hospitality / F&B',
    description: 'Hotel, restaurant, venue, or food service business.',
    defaultAreas: ['hospitality-revenue', 'hospitality-guest', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'booking', 'reservation-cover',                     // hospitality-revenue
      'guest-complaint',                                   // hospitality-guest
      'saas-invoice', 'expense', 'budget', 'vendor',      // finance-accounting
      'goal', 'team-member', 'decision',                  // management-strategy
    ],
  }),

  'healthcare': createIndustry({
    id: 'healthcare',
    label: 'Healthcare / Wellness',
    description: 'Health, medical, or wellness services.',
    defaultAreas: ['healthcare-patients', 'healthcare-billing', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'patient', 'patient-appointment',            // healthcare-patients
      'healthcare-invoice', 'healthcare-claim',    // healthcare-billing
      'expense', 'budget', 'vendor',               // finance-accounting
      'goal', 'team-member', 'decision',           // management-strategy
    ],
  }),

  'real-estate': createIndustry({
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Property sales, rentals, or development.',
    defaultAreas: ['real-estate-portfolio', 'marketing-sales', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'property', 'listing', 'tenant',               // real-estate-portfolio
      'deal', 'lead',                                // marketing-sales
      'saas-invoice', 'expense', 'budget', 'vendor', // finance-accounting
      'goal', 'team-member', 'decision',             // management-strategy
    ],
  }),

  'construction': createIndustry({
    id: 'construction',
    label: 'Construction',
    description: 'Build projects for clients — residential, commercial, or infrastructure.',
    defaultAreas: ['construction-pipeline', 'construction-delivery', 'construction-billing', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'construction-client', 'bid', 'proposal',          // construction-pipeline
      'construction-project', 'subcontractor-event',     // construction-delivery
      'draw-request',                                    // construction-billing
      'expense', 'budget', 'vendor',                     // finance-accounting
      'goal', 'team-member', 'decision',                 // management-strategy
    ],
  }),

  'agriculture': createIndustry({
    id: 'agriculture',
    label: 'Agriculture',
    description: 'Farming, crop production, or agribusiness.',
    defaultAreas: ['agriculture-production', 'agriculture-inputs', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'harvest', 'crop-sale', 'field',             // agriculture-production
      'input-purchase', 'farm-equipment',          // agriculture-inputs
      'expense', 'budget', 'vendor',               // finance-accounting
      'goal', 'team-member', 'decision',           // management-strategy
    ],
  }),

  'fintech-finance': createIndustry({
    id: 'fintech-finance',
    label: 'Fintech / Finance',
    description: 'Financial products or services, including banking.',
    defaultAreas: ['fintech-customers', 'fintech-risk', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'fintech-account', 'fintech-transaction', 'kyc-document', // fintech-customers
      'fraud-event', 'loan',                                     // fintech-risk
      'expense', 'budget', 'vendor',                             // finance-accounting
      'goal', 'team-member', 'decision',                         // management-strategy
    ],
  }),

  'insurance': createIndustry({
    id: 'insurance',
    label: 'Insurance',
    description: 'Underwrite and manage risk — policies and claims.',
    defaultAreas: ['insurance-policy', 'insurance-claims', 'insurance-risk', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'policyholder', 'policy',              // insurance-policy
      'claim', 'claim-settlement',           // insurance-claims
      'expense', 'budget', 'vendor',         // finance-accounting
      'goal', 'team-member', 'decision',     // management-strategy
    ],
  }),

  'telecommunications': createIndustry({
    id: 'telecommunications',
    label: 'Telecommunications',
    description: 'Subscriber networks — mobile, broadband, or enterprise.',
    defaultAreas: ['telecom-subscribers', 'telecom-network', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'subscriber', 'telecom-invoice', 'telecom-service-ticket',  // telecom-subscribers
      'network-outage', 'network-equipment',                      // telecom-network
      'expense', 'budget', 'vendor',                              // finance-accounting
      'goal', 'team-member', 'decision',                          // management-strategy
    ],
  }),

  'media-creator': createIndustry({
    id: 'media-creator',
    label: 'Media / Creator',
    description: 'Content, publishing, or creator business.',
    defaultAreas: ['media-audience', 'media-engagement', 'media-monetisation', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'media-subscriber', 'campaign',               // media-audience
      'content-piece', 'post',                      // media-engagement
      'sponsorship-deal',                           // media-monetisation
      'expense', 'budget', 'vendor',                // finance-accounting
      'goal', 'team-member', 'decision',            // management-strategy
    ],
  }),

  'education': createIndustry({
    id: 'education',
    label: 'Education',
    description: 'School, training provider, or online learning.',
    defaultAreas: ['education-enrolment', 'education-retention', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'student-enrolment', 'tuition-payment',    // education-enrolment
      'student-dropout',                         // education-retention
      'expense', 'budget', 'vendor',             // finance-accounting
      'goal', 'team-member', 'decision',         // management-strategy
    ],
  }),

  'energy-utilities': createIndustry({
    id: 'energy-utilities',
    label: 'Energy & Utilities',
    description: 'Power generation, grid operations, or utility services.',
    defaultAreas: ['energy-generation', 'energy-billing', 'energy-compliance', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: [
      'energy-asset', 'outage-event',             // energy-generation
      'energy-customer', 'energy-customer-bill',  // energy-billing
      'compliance-filing',                        // energy-compliance
      'expense', 'budget', 'vendor',              // finance-accounting
      'goal', 'team-member', 'decision',          // management-strategy
    ],
  }),

  'other': createIndustry({
    id: 'other',
    label: 'Something else',
    description: 'Any business type not in the list above.',
    defaultAreas: ['finance-accounting', 'management-strategy'],
    defaultUnitTypes: [],
  }),
}

export function getIndustry(id) {
  return INDUSTRY_CATALOG[id] ?? null
}

export function listIndustries() {
  return Object.values(INDUSTRY_CATALOG)
}
