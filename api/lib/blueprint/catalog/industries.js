import { createIndustry } from '../schema.js'

export const INDUSTRY_CATALOG = {
  'saas-software': createIndustry({
    id: 'saas-software',
    label: 'Software / SaaS',
    description: 'Subscription or software product sold online.',
    defaultAreas: ['product-engineering', 'customer-service', 'marketing-sales', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['customer', 'support-ticket', 'deal', 'lead', 'goal', 'team-member', 'decision'],
  }),

  'ecommerce-d2c': createIndustry({
    id: 'ecommerce-d2c',
    label: 'E-commerce',
    description: 'Sell products online directly to consumers.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['order', 'sku', 'supplier', 'ecom-customer', 'decision'],
  }),

  'marketplace-platform': createIndustry({
    id: 'marketplace-platform',
    label: 'Marketplace / Platform',
    description: 'Connect buyers and sellers on a shared platform.',
    defaultAreas: ['marketplace-transactions', 'marketplace-trust', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['transaction', 'marketplace-seller', 'marketplace-buyer', 'dispute', 'decision'],
  }),

  'consumer-app': createIndustry({
    id: 'consumer-app',
    label: 'Consumer App',
    description: 'App people download and use on mobile or desktop.',
    defaultAreas: ['app-engagement', 'app-growth', 'app-monetisation', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['app-user', 'install', 'in-app-purchase', 'decision'],
  }),

  'professional-services': createIndustry({
    id: 'professional-services',
    label: 'Agency / Professional Services',
    description: 'Sell expertise, time, or deliverables to clients.',
    defaultAreas: ['client-delivery', 'marketing-sales', 'people-hr', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['project', 'ps-client', 'consultant', 'invoice', 'decision'],
  }),

  'life-sciences': createIndustry({
    id: 'life-sciences',
    label: 'Life Sciences',
    description: 'Biotech, pharma, or medical research business.',
    defaultAreas: ['rd-pipeline', 'clinical-regulatory', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['experiment', 'clinical-trial', 'regulatory-submission', 'decision'],
  }),

  'manufacturing': createIndustry({
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Make physical goods at scale.',
    defaultAreas: ['production', 'inventory-operations', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['machine', 'production-line', 'raw-material', 'manufacturing-order', 'mfg-supplier', 'decision'],
  }),

  'wholesale-distribution': createIndustry({
    id: 'wholesale-distribution',
    label: 'Wholesale / Distribution',
    description: 'Sell products in bulk to business customers.',
    defaultAreas: ['wholesale-sales', 'inventory-operations', 'wholesale-credit', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['wholesale-order', 'wholesale-account', 'sku', 'supplier', 'decision'],
  }),

  'logistics-freight': createIndustry({
    id: 'logistics-freight',
    label: 'Logistics & Freight',
    description: 'Move goods via fleet, carrier, or last-mile delivery.',
    defaultAreas: ['logistics-shipments', 'logistics-fleet', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['shipment', 'vehicle', 'freight-invoice', 'decision'],
  }),

  'retail': createIndustry({
    id: 'retail',
    label: 'Retail',
    description: 'Physical store selling products to consumers.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['order', 'sku', 'ecom-customer', 'decision'],
  }),

  'retail-hospitality': createIndustry({
    id: 'retail-hospitality',
    label: 'Retail & Hospitality',
    description: 'Physical retail stores, restaurants, and hospitality businesses.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['sku', 'order', 'ecom-customer', 'decision'],
  }),

  'hospitality-fb': createIndustry({
    id: 'hospitality-fb',
    label: 'Hospitality / F&B',
    description: 'Hotel, restaurant, venue, or food service business.',
    defaultAreas: ['hospitality-revenue', 'hospitality-guest', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['booking', 'guest-complaint', 'reservation-cover', 'decision'],
  }),

  'healthcare': createIndustry({
    id: 'healthcare',
    label: 'Healthcare / Wellness',
    description: 'Health, medical, or wellness services.',
    defaultAreas: ['healthcare-patients', 'healthcare-billing', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['patient-appointment', 'healthcare-invoice', 'decision'],
  }),

  'real-estate': createIndustry({
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Property sales, rentals, or development.',
    defaultAreas: ['real-estate-portfolio', 'marketing-sales', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['deal', 'lead', 'invoice', 'decision'],
  }),

  'construction': createIndustry({
    id: 'construction',
    label: 'Construction',
    description: 'Build projects for clients — residential, commercial, or infrastructure.',
    defaultAreas: ['construction-pipeline', 'construction-delivery', 'construction-billing', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['bid', 'construction-project', 'draw-request', 'subcontractor-event', 'decision'],
  }),

  'agriculture': createIndustry({
    id: 'agriculture',
    label: 'Agriculture',
    description: 'Farming, crop production, or agribusiness.',
    defaultAreas: ['agriculture-production', 'agriculture-inputs', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['harvest', 'crop-sale', 'input-purchase', 'decision'],
  }),

  'fintech-finance': createIndustry({
    id: 'fintech-finance',
    label: 'Fintech / Finance',
    description: 'Financial products or services, including banking.',
    defaultAreas: ['fintech-customers', 'fintech-risk', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['fintech-account', 'fraud-event', 'loan', 'decision'],
  }),

  'insurance': createIndustry({
    id: 'insurance',
    label: 'Insurance',
    description: 'Underwrite and manage risk — policies and claims.',
    defaultAreas: ['insurance-policy', 'insurance-claims', 'insurance-risk', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['policy', 'claim', 'decision'],
  }),

  'telecommunications': createIndustry({
    id: 'telecommunications',
    label: 'Telecommunications',
    description: 'Subscriber networks — mobile, broadband, or enterprise.',
    defaultAreas: ['telecom-subscribers', 'telecom-network', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['subscriber', 'network-outage', 'telecom-invoice', 'decision'],
  }),

  'media-creator': createIndustry({
    id: 'media-creator',
    label: 'Media / Creator',
    description: 'Content, publishing, or creator business.',
    defaultAreas: ['media-audience', 'media-engagement', 'media-monetisation', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['media-subscriber', 'content-piece', 'sponsorship-deal', 'decision'],
  }),

  'education': createIndustry({
    id: 'education',
    label: 'Education',
    description: 'School, training provider, or online learning.',
    defaultAreas: ['education-enrolment', 'education-retention', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['student-enrolment', 'student-dropout', 'tuition-payment', 'decision'],
  }),

  'energy-utilities': createIndustry({
    id: 'energy-utilities',
    label: 'Energy & Utilities',
    description: 'Power generation, grid operations, or utility services.',
    defaultAreas: ['energy-generation', 'energy-billing', 'energy-compliance', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['outage-event', 'energy-customer-bill', 'compliance-filing', 'decision'],
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
