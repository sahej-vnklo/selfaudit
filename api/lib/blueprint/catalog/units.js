import { createUnitType, createPropertyDef, createLinkDef } from '../schema.js'

// ─── SaaS / Software ──────────────────────────────────────────────────────────

const Customer = createUnitType({
  id: 'customer',
  label: 'Customer',
  description: 'A subscribing company or individual generating recurring revenue',
  areas: ['customer-service', 'finance-accounting'],
  interfaces: ['observable', 'actionable', 'sourced', 'linked'],
  properties: [
    createPropertyDef({ key: 'plan',         label: 'Plan',          type: 'string' }),
    createPropertyDef({ key: 'mrr',          label: 'MRR',           type: 'currency' }),
    createPropertyDef({ key: 'churn_risk',   label: 'Churn risk',    type: 'enum', enumValues: ['low', 'medium', 'high'] }),
    createPropertyDef({ key: 'csat_score',   label: 'CSAT score',    type: 'number' }),
    createPropertyDef({ key: 'cohort_month', label: 'Cohort month',  type: 'date' }),
  ],
  links: [
    createLinkDef({ id: 'customer-has-tickets', label: 'Has support tickets', toUnitTypeId: 'support-ticket', cardinality: 'one-to-many' }),
    createLinkDef({ id: 'customer-has-deals',   label: 'Has deals',           toUnitTypeId: 'deal',           cardinality: 'one-to-many' }),
  ],
})

const SupportTicket = createUnitType({
  id: 'support-ticket',
  label: 'Support Ticket',
  description: 'A customer-reported issue or request tracked in a support system',
  areas: ['customer-service'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'ticket_type',       label: 'Type',            type: 'enum', enumValues: ['bug', 'feature_request', 'billing', 'how_to', 'other'] }),
    createPropertyDef({ key: 'first_response_hrs', label: 'First response', type: 'number' }),
    createPropertyDef({ key: 'resolution_hrs',    label: 'Resolution time', type: 'number' }),
    createPropertyDef({ key: 'is_repeat',         label: 'Is repeat issue', type: 'boolean' }),
    createPropertyDef({ key: 'csat_rating',       label: 'CSAT rating',     type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'ticket-belongs-to-customer', label: 'Belongs to', toUnitTypeId: 'customer', cardinality: 'many-to-one' }),
  ],
})

const Deal = createUnitType({
  id: 'deal',
  label: 'Deal',
  description: 'An active revenue opportunity in the sales pipeline',
  areas: ['marketing-sales'],
  interfaces: ['observable', 'actionable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'stage',          label: 'Stage',           type: 'string' }),
    createPropertyDef({ key: 'age_days',       label: 'Age (days)',      type: 'number' }),
    createPropertyDef({ key: 'close_date',     label: 'Expected close',  type: 'date' }),
    createPropertyDef({ key: 'probability',    label: 'Probability (%)', type: 'number' }),
    createPropertyDef({ key: 'deal_source',    label: 'Source',          type: 'string' }),
  ],
  links: [
    createLinkDef({ id: 'deal-linked-to-lead',     label: 'Originated from', toUnitTypeId: 'lead',     cardinality: 'many-to-one' }),
    createLinkDef({ id: 'deal-linked-to-customer', label: 'Converts to',     toUnitTypeId: 'customer', cardinality: 'many-to-one' }),
  ],
})

const Lead = createUnitType({
  id: 'lead',
  label: 'Lead',
  description: 'A prospective customer entering the top of the sales funnel',
  areas: ['marketing-sales'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'lead_source',    label: 'Source',         type: 'string' }),
    createPropertyDef({ key: 'qualified',      label: 'Qualified (SQL)', type: 'boolean' }),
    createPropertyDef({ key: 'score',          label: 'Lead score',     type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'lead-converts-to-deal', label: 'Converts to deal', toUnitTypeId: 'deal', cardinality: 'one-to-many' }),
  ],
})

const GoalSaaS = createUnitType({
  id: 'goal',
  label: 'Goal',
  description: 'A company, department, or team objective with measurable progress',
  areas: ['management-strategy'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'goal_type',  label: 'Type',        type: 'enum', enumValues: ['company', 'department', 'team', 'individual'] }),
    createPropertyDef({ key: 'progress',   label: 'Progress (%)', type: 'number' }),
    createPropertyDef({ key: 'due_date',   label: 'Due date',    type: 'date' }),
    createPropertyDef({ key: 'department', label: 'Department',  type: 'string' }),
  ],
  links: [
    createLinkDef({ id: 'goal-has-parent', label: 'Reports to', toUnitTypeId: 'goal', cardinality: 'many-to-one' }),
  ],
})

const TeamMember = createUnitType({
  id: 'team-member',
  label: 'Team Member',
  description: 'An employee or contractor who owns actions and drives execution',
  areas: ['management-strategy'],
  interfaces: ['actionable'],
  properties: [
    createPropertyDef({ key: 'role',          label: 'Role',           type: 'string' }),
    createPropertyDef({ key: 'department',    label: 'Department',     type: 'string' }),
    createPropertyDef({ key: 'open_actions',  label: 'Open actions',   type: 'number' }),
    createPropertyDef({ key: 'followthrough', label: 'Follow-through', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'member-owns-goals', label: 'Owns goals', toUnitTypeId: 'goal', cardinality: 'one-to-many' }),
  ],
})

// ─── E-commerce / D2C ─────────────────────────────────────────────────────────

const Order = createUnitType({
  id: 'order',
  label: 'Order',
  description: 'A customer purchase transaction',
  areas: ['revenue-sales', 'inventory-operations'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'order_status',  label: 'Status',       type: 'enum', enumValues: ['pending', 'fulfilled', 'shipped', 'returned', 'cancelled'] }),
    createPropertyDef({ key: 'channel',       label: 'Channel',      type: 'string' }),
    createPropertyDef({ key: 'fulfilment_hrs', label: 'Fulfilment time (hrs)', type: 'number' }),
    createPropertyDef({ key: 'items_count',   label: 'Items',        type: 'number' }),
    createPropertyDef({ key: 'refunded',      label: 'Refunded',     type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'order-from-customer', label: 'Placed by',    toUnitTypeId: 'ecom-customer', cardinality: 'many-to-one' }),
    createLinkDef({ id: 'order-contains-sku',  label: 'Contains SKU', toUnitTypeId: 'sku',           cardinality: 'many-to-many' }),
  ],
})

const SKU = createUnitType({
  id: 'sku',
  label: 'SKU',
  description: 'A stockable product variant tracked in inventory',
  areas: ['inventory-operations'],
  interfaces: ['observable', 'linked'],
  properties: [
    createPropertyDef({ key: 'stock_units',   label: 'Units in stock', type: 'number' }),
    createPropertyDef({ key: 'reorder_point', label: 'Reorder point',  type: 'number' }),
    createPropertyDef({ key: 'days_of_stock', label: 'Days of stock',  type: 'number' }),
    createPropertyDef({ key: 'cogs',          label: 'COGS',           type: 'currency' }),
    createPropertyDef({ key: 'sell_price',    label: 'Sell price',     type: 'currency' }),
  ],
  links: [
    createLinkDef({ id: 'sku-from-supplier', label: 'Supplied by', toUnitTypeId: 'supplier', cardinality: 'many-to-one' }),
  ],
})

const Supplier = createUnitType({
  id: 'supplier',
  label: 'Supplier',
  description: 'A vendor providing goods or materials',
  areas: ['inventory-operations'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'lead_time_days',  label: 'Lead time (days)', type: 'number' }),
    createPropertyDef({ key: 'reliability_pct', label: 'On-time rate (%)', type: 'number' }),
    createPropertyDef({ key: 'active_pos',      label: 'Active POs',       type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'supplier-provides-skus', label: 'Provides SKUs', toUnitTypeId: 'sku', cardinality: 'one-to-many' }),
  ],
})

const EcomCustomer = createUnitType({
  id: 'ecom-customer',
  label: 'Customer',
  description: 'A shopper with purchase history and retention signals',
  areas: ['customer-experience', 'revenue-sales'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'ltv',             label: 'LTV',              type: 'currency' }),
    createPropertyDef({ key: 'order_count',     label: 'Total orders',     type: 'number' }),
    createPropertyDef({ key: 'days_since_last', label: 'Days since order', type: 'number' }),
    createPropertyDef({ key: 'return_rate',     label: 'Return rate (%)',  type: 'number' }),
    createPropertyDef({ key: 'review_score',    label: 'Review score',     type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'ecom-customer-has-orders', label: 'Has orders', toUnitTypeId: 'order', cardinality: 'one-to-many' }),
  ],
})

// ─── Manufacturing ────────────────────────────────────────────────────────────

const Machine = createUnitType({
  id: 'machine',
  label: 'Machine',
  description: 'A production asset with operational metrics and failure risk',
  areas: ['production', 'quality'],
  interfaces: ['observable', 'actionable', 'linked'],
  properties: [
    createPropertyDef({ key: 'uptime_pct',     label: 'Uptime (%)',        type: 'number' }),
    createPropertyDef({ key: 'oee_score',      label: 'OEE score',         type: 'number' }),
    createPropertyDef({ key: 'last_maintenance', label: 'Last maintenance', type: 'date' }),
    createPropertyDef({ key: 'defect_rate',    label: 'Defect rate (%)',   type: 'number' }),
    createPropertyDef({ key: 'throughput_units', label: 'Throughput/hr',   type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'machine-in-line',     label: 'Part of line',     toUnitTypeId: 'production-line', cardinality: 'many-to-one' }),
    createLinkDef({ id: 'machine-uses-material', label: 'Consumes',       toUnitTypeId: 'raw-material',    cardinality: 'many-to-many' }),
  ],
})

const ProductionLine = createUnitType({
  id: 'production-line',
  label: 'Production Line',
  description: 'A sequence of machines producing a product family',
  areas: ['production'],
  interfaces: ['observable', 'linked'],
  properties: [
    createPropertyDef({ key: 'utilisation_pct',  label: 'Utilisation (%)', type: 'number' }),
    createPropertyDef({ key: 'target_units_day', label: 'Target units/day', type: 'number' }),
    createPropertyDef({ key: 'actual_units_day', label: 'Actual units/day', type: 'number' }),
    createPropertyDef({ key: 'shift_count',      label: 'Shifts/day',      type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'line-has-machines', label: 'Contains machines', toUnitTypeId: 'machine', cardinality: 'one-to-many' }),
  ],
})

const RawMaterial = createUnitType({
  id: 'raw-material',
  label: 'Raw Material',
  description: 'An input material consumed in production',
  areas: ['inventory-supply-chain'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'stock_qty',      label: 'Stock quantity',   type: 'number' }),
    createPropertyDef({ key: 'days_of_supply', label: 'Days of supply',   type: 'number' }),
    createPropertyDef({ key: 'reorder_point',  label: 'Reorder point',    type: 'number' }),
    createPropertyDef({ key: 'cost_per_unit',  label: 'Cost per unit',    type: 'currency' }),
  ],
  links: [
    createLinkDef({ id: 'material-from-supplier', label: 'Sourced from', toUnitTypeId: 'mfg-supplier', cardinality: 'many-to-one' }),
  ],
})

const ManufacturingOrder = createUnitType({
  id: 'manufacturing-order',
  label: 'Production Order',
  description: 'A scheduled production run for a specific product',
  areas: ['production', 'orders-sales'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'planned_qty',   label: 'Planned qty',   type: 'number' }),
    createPropertyDef({ key: 'actual_qty',    label: 'Actual qty',    type: 'number' }),
    createPropertyDef({ key: 'due_date',      label: 'Due date',      type: 'date' }),
    createPropertyDef({ key: 'on_time',       label: 'On time',       type: 'boolean' }),
    createPropertyDef({ key: 'scrap_rate',    label: 'Scrap rate (%)', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'mfg-order-on-line', label: 'Runs on', toUnitTypeId: 'production-line', cardinality: 'many-to-one' }),
  ],
})

const MfgSupplier = createUnitType({
  id: 'mfg-supplier',
  label: 'Supplier',
  description: 'A vendor providing raw materials or components',
  areas: ['inventory-supply-chain'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'lead_time_days',  label: 'Lead time (days)',  type: 'number' }),
    createPropertyDef({ key: 'on_time_rate',    label: 'On-time rate (%)', type: 'number' }),
    createPropertyDef({ key: 'defect_rate',     label: 'Defect rate (%)',  type: 'number' }),
    createPropertyDef({ key: 'single_source',   label: 'Single-sourced',   type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'mfg-supplier-provides', label: 'Provides', toUnitTypeId: 'raw-material', cardinality: 'one-to-many' }),
  ],
})

// ─── Professional Services ────────────────────────────────────────────────────

const Project = createUnitType({
  id: 'project',
  label: 'Project',
  description: 'A client engagement with deliverables, timeline, and budget',
  areas: ['client-delivery', 'revenue-billing'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'budget',           label: 'Budget',            type: 'currency' }),
    createPropertyDef({ key: 'budget_consumed',  label: 'Budget used (%)',   type: 'number' }),
    createPropertyDef({ key: 'on_track',         label: 'On track',          type: 'boolean' }),
    createPropertyDef({ key: 'milestone_count',  label: 'Milestones',        type: 'number' }),
    createPropertyDef({ key: 'overdue_tasks',    label: 'Overdue tasks',     type: 'number' }),
    createPropertyDef({ key: 'csat_score',       label: 'Client CSAT',       type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'project-for-client',      label: 'For client',      toUnitTypeId: 'ps-client', cardinality: 'many-to-one' }),
    createLinkDef({ id: 'project-has-team-member', label: 'Staffed with',    toUnitTypeId: 'consultant', cardinality: 'many-to-many' }),
  ],
})

const PSClient = createUnitType({
  id: 'ps-client',
  label: 'Client',
  description: 'A client organisation with active or historical engagements',
  areas: ['client-delivery', 'business-development'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'arr',              label: 'ARR',               type: 'currency' }),
    createPropertyDef({ key: 'renewal_date',     label: 'Renewal date',      type: 'date' }),
    createPropertyDef({ key: 'nps_score',        label: 'NPS score',         type: 'number' }),
    createPropertyDef({ key: 'active_projects',  label: 'Active projects',   type: 'number' }),
    createPropertyDef({ key: 'at_risk',          label: 'At risk',           type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'client-has-projects', label: 'Has projects', toUnitTypeId: 'project', cardinality: 'one-to-many' }),
  ],
})

const Consultant = createUnitType({
  id: 'consultant',
  label: 'Consultant',
  description: 'A billable team member with utilisation and delivery metrics',
  areas: ['resource-management'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'utilisation_pct',  label: 'Utilisation (%)',   type: 'number' }),
    createPropertyDef({ key: 'billable_hrs_week', label: 'Billable hrs/wk',  type: 'number' }),
    createPropertyDef({ key: 'active_projects',  label: 'Active projects',   type: 'number' }),
    createPropertyDef({ key: 'capacity_hrs',     label: 'Capacity (hrs/wk)', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'consultant-on-projects', label: 'Staffed on', toUnitTypeId: 'project', cardinality: 'many-to-many' }),
  ],
})

const Invoice = createUnitType({
  id: 'invoice',
  label: 'Invoice',
  description: 'A billable amount owed by a client',
  areas: ['revenue-billing'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'days_outstanding', label: 'Days outstanding',  type: 'number' }),
    createPropertyDef({ key: 'overdue',          label: 'Overdue',           type: 'boolean' }),
    createPropertyDef({ key: 'invoice_type',     label: 'Type',              type: 'enum', enumValues: ['milestone', 'retainer', 'time_materials', 'fixed'] }),
  ],
  links: [
    createLinkDef({ id: 'invoice-for-client',  label: 'Billed to',  toUnitTypeId: 'ps-client', cardinality: 'many-to-one' }),
    createLinkDef({ id: 'invoice-for-project', label: 'For project', toUnitTypeId: 'project',   cardinality: 'many-to-one' }),
  ],
})

// ─── Exports ──────────────────────────────────────────────────────────────────

export const UNIT_TYPE_CATALOG = {
  // SaaS
  'customer':         Customer,
  'support-ticket':   SupportTicket,
  'deal':             Deal,
  'lead':             Lead,
  'goal':             GoalSaaS,
  'team-member':      TeamMember,
  // E-commerce
  'order':            Order,
  'sku':              SKU,
  'supplier':         Supplier,
  'ecom-customer':    EcomCustomer,
  // Manufacturing
  'machine':          Machine,
  'production-line':  ProductionLine,
  'raw-material':     RawMaterial,
  'manufacturing-order': ManufacturingOrder,
  'mfg-supplier':     MfgSupplier,
  // Professional Services
  'project':          Project,
  'ps-client':        PSClient,
  'consultant':       Consultant,
  'invoice':          Invoice,
}

export function getUnitType(id) {
  return UNIT_TYPE_CATALOG[id] ?? null
}

export function getUnitTypesForArea(areaId) {
  return Object.values(UNIT_TYPE_CATALOG).filter((u) => u.areas.includes(areaId))
}
