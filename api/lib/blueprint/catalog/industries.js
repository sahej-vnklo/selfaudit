import { createIndustry } from '../schema.js'

// Canonical industry types. defaultAreas are pre-selected when a user picks this industry.
// defaultUnitTypes are the units recommended on first load.
export const INDUSTRY_CATALOG = {
  'saas-software': createIndustry({
    id: 'saas-software',
    label: 'SaaS / Software',
    description: 'Subscription-based software products sold online.',
    defaultAreas: ['customer-service', 'finance-accounting', 'marketing-sales', 'management-strategy'],
    defaultUnitTypes: ['customer', 'deal', 'lead', 'support-ticket', 'goal', 'team-member', 'decision'],
  }),

  'ecommerce-d2c': createIndustry({
    id: 'ecommerce-d2c',
    label: 'E-commerce / D2C',
    description: 'Online retail selling directly to consumers.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['order', 'sku', 'supplier', 'ecom-customer', 'decision'],
  }),

  'manufacturing': createIndustry({
    id: 'manufacturing',
    label: 'Manufacturing',
    description: 'Physical goods production at scale.',
    defaultAreas: ['production', 'inventory-operations', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['machine', 'production-line', 'raw-material', 'manufacturing-order', 'mfg-supplier', 'decision'],
  }),

  'professional-services': createIndustry({
    id: 'professional-services',
    label: 'Professional Services',
    description: 'Consulting, agencies, and expertise-driven client businesses.',
    defaultAreas: ['client-delivery', 'finance-accounting', 'marketing-sales', 'management-strategy'],
    defaultUnitTypes: ['project', 'ps-client', 'consultant', 'invoice', 'decision'],
  }),

  'retail-hospitality': createIndustry({
    id: 'retail-hospitality',
    label: 'Retail & Hospitality',
    description: 'Physical retail stores, restaurants, and hospitality businesses.',
    defaultAreas: ['revenue-sales', 'inventory-operations', 'customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['sku', 'order', 'ecom-customer', 'decision'],
  }),

  'healthcare': createIndustry({
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Clinics, health tech, and healthcare services.',
    defaultAreas: ['customer-service', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['ps-client', 'invoice', 'team-member', 'decision'],
  }),

  'real-estate': createIndustry({
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Property sales, lettings, and real estate investment.',
    defaultAreas: ['marketing-sales', 'finance-accounting', 'management-strategy'],
    defaultUnitTypes: ['deal', 'lead', 'invoice', 'decision'],
  }),

  'other': createIndustry({
    id: 'other',
    label: 'Other',
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
