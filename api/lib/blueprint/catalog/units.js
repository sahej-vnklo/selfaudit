import { createUnitType, createPropertyDef, createLinkDef } from '../schema.js'

// ─── SaaS / Software ──────────────────────────────────────────────────────────

const Customer = createUnitType({
  id: 'customer',
  label: 'Customer',
  description: 'A subscribing company or individual generating recurring revenue',
  areas: ['customer-service'],
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

const DecisionSaaS = createUnitType({
  id: 'decision',
  label: 'Decision',
  description: 'An action taken in response to an important operating finding, with later outcomes attached',
  areas: ['management-strategy'],
  interfaces: ['observable', 'actionable', 'linked'],
  properties: [
    createPropertyDef({ key: 'finding_area',    label: 'Finding area',    type: 'string' }),
    createPropertyDef({ key: 'action_taken',    label: 'Action taken',    type: 'string' }),
    createPropertyDef({ key: 'outcome',         label: 'Execution outcome', type: 'enum', enumValues: ['dismissed', 'success', 'failed'] }),
    createPropertyDef({ key: 'observed_result', label: 'Observed result', type: 'enum', enumValues: ['improved', 'unchanged', 'worsened', 'resolved', 'unknown'] }),
    createPropertyDef({ key: 'executed_at',     label: 'Executed at',     type: 'date' }),
  ],
  links: [
    createLinkDef({ id: 'decision-linked-to-goal-area', label: 'Came from area', toUnitTypeId: 'goal', cardinality: 'many-to-one' }),
  ],
})

// ─── SaaS: Product & Engineering ─────────────────────────────────────────────

const Feature = createUnitType({
  id: 'feature',
  label: 'Feature',
  description: 'A product feature in development or shipped to production',
  areas: ['product-engineering'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'status',     label: 'Status',       type: 'enum', enumValues: ['backlog', 'in_progress', 'shipped', 'rolled_back'] }),
    createPropertyDef({ key: 'priority',   label: 'Priority',     type: 'enum', enumValues: ['p0', 'p1', 'p2', 'p3'] }),
    createPropertyDef({ key: 'area',       label: 'Product area', type: 'string' }),
    createPropertyDef({ key: 'shipped_at', label: 'Shipped at',   type: 'date' }),
  ],
  links: [],
})

const Bug = createUnitType({
  id: 'bug',
  label: 'Bug',
  description: 'A reported defect or regression in the product',
  areas: ['product-engineering'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'severity',   label: 'Severity',  type: 'enum', enumValues: ['p0', 'p1', 'p2', 'p3'] }),
    createPropertyDef({ key: 'status',     label: 'Status',    type: 'enum', enumValues: ['open', 'in_progress', 'resolved', 'wont_fix'] }),
    createPropertyDef({ key: 'days_open',  label: 'Days open', type: 'number' }),
    createPropertyDef({ key: 'regression', label: 'Regression', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'bug-on-feature', label: 'On feature', toUnitTypeId: 'feature', cardinality: 'many-to-one' }),
  ],
})

const Deployment = createUnitType({
  id: 'deployment',
  label: 'Deployment',
  description: 'A code release deployed to an environment',
  areas: ['product-engineering'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'environment',    label: 'Environment',       type: 'enum', enumValues: ['production', 'staging', 'development'] }),
    createPropertyDef({ key: 'status',         label: 'Status',            type: 'enum', enumValues: ['success', 'failed', 'rolled_back'] }),
    createPropertyDef({ key: 'change_failure', label: 'Change failure',    type: 'boolean' }),
    createPropertyDef({ key: 'deploy_mins',    label: 'Deploy time (min)', type: 'number' }),
  ],
  links: [],
})

const Incident = createUnitType({
  id: 'incident',
  label: 'Incident',
  description: 'A production outage or service degradation event',
  areas: ['product-engineering'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'severity',        label: 'Severity',        type: 'enum', enumValues: ['p0', 'p1', 'p2', 'p3'] }),
    createPropertyDef({ key: 'duration_mins',   label: 'Duration (min)',  type: 'number' }),
    createPropertyDef({ key: 'mttr_mins',       label: 'MTTR (min)',      type: 'number' }),
    createPropertyDef({ key: 'resolved',        label: 'Resolved',        type: 'boolean' }),
    createPropertyDef({ key: 'customer_impact', label: 'Customer impact', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'incident-triggered-by-deployment', label: 'Triggered by', toUnitTypeId: 'deployment', cardinality: 'many-to-one' }),
  ],
})

// ─── SaaS: People & HR ───────────────────────────────────────────────────────

const Employee = createUnitType({
  id: 'employee',
  label: 'Employee',
  description: 'A full-time or part-time employee tracked across the employment lifecycle',
  areas: ['people-hr'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'department',    label: 'Department',  type: 'string' }),
    createPropertyDef({ key: 'role',          label: 'Role',        type: 'string' }),
    createPropertyDef({ key: 'status',        label: 'Status',      type: 'enum', enumValues: ['active', 'on_leave', 'probation', 'terminated'] }),
    createPropertyDef({ key: 'tenure_months', label: 'Tenure (mo)', type: 'number' }),
    createPropertyDef({ key: 'start_date',    label: 'Start date',  type: 'date' }),
  ],
  links: [],
})

const JobOpening = createUnitType({
  id: 'job-opening',
  label: 'Job Opening',
  description: 'An open role being actively recruited for',
  areas: ['people-hr'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'role',         label: 'Role',         type: 'string' }),
    createPropertyDef({ key: 'department',   label: 'Department',   type: 'string' }),
    createPropertyDef({ key: 'status',       label: 'Status',       type: 'enum', enumValues: ['open', 'interviewing', 'offer_made', 'filled', 'cancelled'] }),
    createPropertyDef({ key: 'days_open',    label: 'Days open',    type: 'number' }),
    createPropertyDef({ key: 'target_start', label: 'Target start', type: 'date' }),
  ],
  links: [],
})

const PerformanceReview = createUnitType({
  id: 'performance-review',
  label: 'Performance Review',
  description: 'A formal performance evaluation for an employee',
  areas: ['people-hr'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'rating',      label: 'Rating',        type: 'enum', enumValues: ['exceeds', 'meets', 'below', 'pip'] }),
    createPropertyDef({ key: 'period',      label: 'Review period', type: 'string' }),
    createPropertyDef({ key: 'completed',   label: 'Completed',     type: 'boolean' }),
    createPropertyDef({ key: 'department',  label: 'Department',    type: 'string' }),
  ],
  links: [
    createLinkDef({ id: 'review-for-employee', label: 'For employee', toUnitTypeId: 'employee', cardinality: 'many-to-one' }),
  ],
})

// ─── SaaS: Finance & Accounting ──────────────────────────────────────────────

const SaaSInvoice = createUnitType({
  id: 'saas-invoice',
  label: 'Invoice',
  description: 'A subscription or service invoice raised to a customer',
  areas: ['finance-accounting'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'amount',          label: 'Amount',         type: 'currency' }),
    createPropertyDef({ key: 'status',          label: 'Status',         type: 'enum', enumValues: ['draft', 'sent', 'paid', 'overdue', 'disputed', 'written_off'] }),
    createPropertyDef({ key: 'days_overdue',    label: 'Days overdue',   type: 'number' }),
    createPropertyDef({ key: 'payment_method',  label: 'Payment method', type: 'enum', enumValues: ['card', 'bank_transfer', 'direct_debit', 'other'] }),
  ],
  links: [
    createLinkDef({ id: 'saas-invoice-to-customer', label: 'Billed to', toUnitTypeId: 'customer', cardinality: 'many-to-one' }),
  ],
})

const Expense = createUnitType({
  id: 'expense',
  label: 'Expense',
  description: 'A company operating expense or cost item',
  areas: ['finance-accounting'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'category',  label: 'Category', type: 'enum', enumValues: ['payroll', 'software', 'marketing', 'travel', 'office', 'cloud_infra', 'other'] }),
    createPropertyDef({ key: 'amount',    label: 'Amount',   type: 'currency' }),
    createPropertyDef({ key: 'approved',  label: 'Approved', type: 'boolean' }),
    createPropertyDef({ key: 'recurring', label: 'Recurring', type: 'boolean' }),
    createPropertyDef({ key: 'period',    label: 'Period',   type: 'string' }),
  ],
  links: [],
})

const Budget = createUnitType({
  id: 'budget',
  label: 'Budget',
  description: 'A financial budget allocation for a department or initiative',
  areas: ['finance-accounting'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'department',       label: 'Department', type: 'string' }),
    createPropertyDef({ key: 'allocated_amount', label: 'Allocated',  type: 'currency' }),
    createPropertyDef({ key: 'spent_amount',     label: 'Spent',      type: 'currency' }),
    createPropertyDef({ key: 'period',           label: 'Period',     type: 'string' }),
    createPropertyDef({ key: 'over_budget',      label: 'Over budget', type: 'boolean' }),
  ],
  links: [],
})

const Vendor = createUnitType({
  id: 'vendor',
  label: 'Vendor',
  description: 'An external supplier or service provider the company pays',
  areas: ['finance-accounting'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'category',      label: 'Category',      type: 'string' }),
    createPropertyDef({ key: 'monthly_spend', label: 'Monthly spend', type: 'currency' }),
    createPropertyDef({ key: 'contract_end',  label: 'Contract end',  type: 'date' }),
    createPropertyDef({ key: 'active',        label: 'Active',        type: 'boolean' }),
  ],
  links: [],
})

// ─── SaaS: Customer Service (extended) ───────────────────────────────────────

const Agent = createUnitType({
  id: 'agent',
  label: 'Agent',
  description: 'A customer support agent handling tickets and interactions',
  areas: ['customer-service'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'tier',               label: 'Tier',               type: 'enum', enumValues: ['tier_1', 'tier_2', 'tier_3', 'manager'] }),
    createPropertyDef({ key: 'tickets_open',       label: 'Open tickets',       type: 'number' }),
    createPropertyDef({ key: 'avg_resolution_hrs', label: 'Avg resolution (hrs)', type: 'number' }),
    createPropertyDef({ key: 'csat_score',         label: 'CSAT score',         type: 'number' }),
    createPropertyDef({ key: 'utilisation_pct',    label: 'Utilisation (%)',    type: 'number' }),
  ],
  links: [],
})

const SupportChannel = createUnitType({
  id: 'support-channel',
  label: 'Channel',
  description: 'A support channel through which customers reach the team',
  areas: ['customer-service'],
  interfaces: ['observable'],
  properties: [
    createPropertyDef({ key: 'type',                   label: 'Channel type',           type: 'enum', enumValues: ['email', 'live_chat', 'phone', 'social', 'in_app', 'community'] }),
    createPropertyDef({ key: 'ticket_volume',          label: 'Ticket volume',          type: 'number' }),
    createPropertyDef({ key: 'avg_first_response_hrs', label: 'Avg first response (hrs)', type: 'number' }),
    createPropertyDef({ key: 'sla_breach_rate',        label: 'SLA breach rate (%)',    type: 'number' }),
  ],
  links: [],
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
  label: 'Shopper',
  description: 'A shopper with purchase history and retention signals',
  areas: ['revenue-sales', 'customer-service'],
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
  areas: ['inventory-operations'],
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
  areas: ['production'],
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
  label: 'Manufacturer',
  description: 'A vendor providing raw materials or components',
  areas: ['inventory-operations'],
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
  areas: ['client-delivery'],
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
  areas: ['client-delivery'],
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
  label: 'Project Invoice',
  description: 'A billable amount owed by a client for a completed project or milestone',
  areas: ['client-delivery', 'finance-accounting'],
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

// ─── Marketplace / Platform ───────────────────────────────────────────────────

const Transaction = createUnitType({
  id: 'transaction',
  label: 'Transaction',
  description: 'A completed or failed exchange between buyer and seller on the platform',
  areas: ['marketplace-transactions'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'status',     label: 'Status',       type: 'enum', enumValues: ['completed', 'failed', 'disputed', 'refunded'] }),
    createPropertyDef({ key: 'gmv',        label: 'GMV',          type: 'currency' }),
    createPropertyDef({ key: 'take_rate',  label: 'Take rate (%)', type: 'number' }),
    createPropertyDef({ key: 'channel',   label: 'Channel',       type: 'string' }),
  ],
  links: [
    createLinkDef({ id: 'transaction-seller', label: 'Sold by',   toUnitTypeId: 'marketplace-seller', cardinality: 'many-to-one' }),
    createLinkDef({ id: 'transaction-buyer',  label: 'Bought by', toUnitTypeId: 'marketplace-buyer',  cardinality: 'many-to-one' }),
  ],
})

const MarketplaceSeller = createUnitType({
  id: 'marketplace-seller',
  label: 'Seller',
  description: 'A supply-side participant on the marketplace',
  areas: ['marketplace-transactions', 'marketplace-trust'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'gmv_total',     label: 'GMV (total)',       type: 'currency' }),
    createPropertyDef({ key: 'listing_count', label: 'Active listings',   type: 'number' }),
    createPropertyDef({ key: 'review_score',  label: 'Review score',      type: 'number' }),
    createPropertyDef({ key: 'violations',    label: 'Policy violations', type: 'number' }),
    createPropertyDef({ key: 'churned',       label: 'Churned',           type: 'boolean' }),
  ],
  links: [],
})

const MarketplaceBuyer = createUnitType({
  id: 'marketplace-buyer',
  label: 'Buyer',
  description: 'A demand-side participant on the marketplace',
  areas: ['marketplace-transactions'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'order_count',   label: 'Orders placed', type: 'number' }),
    createPropertyDef({ key: 'ltv',           label: 'LTV',           type: 'currency' }),
    createPropertyDef({ key: 'churned',       label: 'Churned',       type: 'boolean' }),
  ],
  links: [],
})

const Dispute = createUnitType({
  id: 'dispute',
  label: 'Dispute',
  description: 'A buyer–seller conflict requiring platform intervention',
  areas: ['marketplace-trust'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'resolution_days',  label: 'Resolution days', type: 'number' }),
    createPropertyDef({ key: 'outcome',          label: 'Outcome',         type: 'enum', enumValues: ['resolved-buyer', 'resolved-seller', 'escalated', 'open'] }),
    createPropertyDef({ key: 'fraud_flagged',    label: 'Fraud flagged',   type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'dispute-on-transaction', label: 'On transaction', toUnitTypeId: 'transaction', cardinality: 'many-to-one' }),
  ],
})

// ─── Consumer App ─────────────────────────────────────────────────────────────

const AppUser = createUnitType({
  id: 'app-user',
  label: 'App User',
  description: 'A registered user of the consumer app with engagement and retention signals',
  areas: ['app-engagement', 'app-growth'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'install_date',    label: 'Install date',    type: 'date' }),
    createPropertyDef({ key: 'last_active',     label: 'Last active',     type: 'date' }),
    createPropertyDef({ key: 'sessions_7d',     label: 'Sessions (7d)',   type: 'number' }),
    createPropertyDef({ key: 'd7_retained',     label: 'D7 retained',     type: 'boolean' }),
    createPropertyDef({ key: 'subscription',    label: 'Subscription',    type: 'enum', enumValues: ['none', 'trial', 'paid'] }),
  ],
  links: [],
})

const Install = createUnitType({
  id: 'install',
  label: 'Install',
  description: 'An app install event, with organic vs paid channel attribution',
  areas: ['app-growth'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'channel',   label: 'Channel',    type: 'enum', enumValues: ['organic', 'paid', 'referral', 'unknown'] }),
    createPropertyDef({ key: 'cpi',       label: 'CPI',        type: 'currency' }),
    createPropertyDef({ key: 'activated', label: 'Activated',  type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'install-linked-to-user', label: 'Created user', toUnitTypeId: 'app-user', cardinality: 'one-to-one' }),
  ],
})

const InAppPurchase = createUnitType({
  id: 'in-app-purchase',
  label: 'In-App Purchase',
  description: 'A monetisation event within the app',
  areas: ['app-monetisation'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'purchase_type', label: 'Type',    type: 'enum', enumValues: ['subscription', 'one_time', 'consumable'] }),
    createPropertyDef({ key: 'revenue',       label: 'Revenue', type: 'currency' }),
    createPropertyDef({ key: 'refunded',      label: 'Refunded', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'iap-by-user', label: 'By user', toUnitTypeId: 'app-user', cardinality: 'many-to-one' }),
  ],
})

// ─── Life Sciences ────────────────────────────────────────────────────────────

const Experiment = createUnitType({
  id: 'experiment',
  label: 'Experiment',
  description: 'A scientific or product experiment with defined hypothesis and outcome',
  areas: ['rd-pipeline'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'stage',     label: 'Stage',    type: 'enum', enumValues: ['hypothesis', 'running', 'completed', 'failed'] }),
    createPropertyDef({ key: 'advanced',  label: 'Advanced', type: 'boolean' }),
    createPropertyDef({ key: 'cost',      label: 'Cost',     type: 'currency' }),
  ],
  links: [],
})

const ResearchGrant = createUnitType({
  id: 'research-grant',
  label: 'Research Grant',
  description: 'A funding grant supporting an R&D programme or experiment pipeline',
  areas: ['rd-pipeline'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'funder',       label: 'Funder',        type: 'string' }),
    createPropertyDef({ key: 'amount',       label: 'Grant amount',  type: 'currency' }),
    createPropertyDef({ key: 'status',       label: 'Status',        type: 'enum', enumValues: ['applied', 'awarded', 'active', 'closed', 'rejected'] }),
    createPropertyDef({ key: 'expiry_date',  label: 'Expiry date',   type: 'date' }),
    createPropertyDef({ key: 'burn_rate',    label: 'Burn rate',     type: 'currency' }),
  ],
  links: [],
})

const ClinicalTrial = createUnitType({
  id: 'clinical-trial',
  label: 'Clinical Trial',
  description: 'A patient study tracking enrolment, adverse events, and regulatory milestones',
  areas: ['clinical-regulatory'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'phase',             label: 'Phase',            type: 'enum', enumValues: ['1', '2', '3', '4'] }),
    createPropertyDef({ key: 'patients_enrolled', label: 'Patients enrolled', type: 'number' }),
    createPropertyDef({ key: 'adverse_events',    label: 'Adverse events',   type: 'number' }),
    createPropertyDef({ key: 'on_schedule',       label: 'On schedule',      type: 'boolean' }),
  ],
  links: [],
})

const RegulatorySubmission = createUnitType({
  id: 'regulatory-submission',
  label: 'Regulatory Submission',
  description: 'A filing or application submitted to a regulatory body',
  areas: ['clinical-regulatory'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'regulator',  label: 'Regulator',  type: 'string' }),
    createPropertyDef({ key: 'submitted',  label: 'Submitted',  type: 'boolean' }),
    createPropertyDef({ key: 'approved',   label: 'Approved',   type: 'boolean' }),
    createPropertyDef({ key: 'due_date',   label: 'Due date',   type: 'date' }),
  ],
  links: [],
})

// ─── Wholesale / Distribution ─────────────────────────────────────────────────

const WholesaleOrder = createUnitType({
  id: 'wholesale-order',
  label: 'Wholesale Order',
  description: 'A bulk purchase order from a B2B account',
  areas: ['wholesale-sales'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'order_value',   label: 'Order value',  type: 'currency' }),
    createPropertyDef({ key: 'status',        label: 'Status',       type: 'enum', enumValues: ['pending', 'shipped', 'delivered', 'returned'] }),
    createPropertyDef({ key: 'late',          label: 'Late',         type: 'boolean' }),
    createPropertyDef({ key: 'discount_pct',  label: 'Discount (%)', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'wholesale-order-from-account', label: 'From account', toUnitTypeId: 'wholesale-account', cardinality: 'many-to-one' }),
  ],
})

const WholesaleAccount = createUnitType({
  id: 'wholesale-account',
  label: 'Account',
  description: 'A B2B buyer account with order history and credit exposure',
  areas: ['wholesale-sales', 'wholesale-credit'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'credit_limit',   label: 'Credit limit',   type: 'currency' }),
    createPropertyDef({ key: 'days_overdue',   label: 'Days overdue',   type: 'number' }),
    createPropertyDef({ key: 'order_frequency', label: 'Order frequency', type: 'string' }),
    createPropertyDef({ key: 'churned',        label: 'Churned',        type: 'boolean' }),
  ],
  links: [],
})

// ─── Logistics & Freight ──────────────────────────────────────────────────────

const Shipment = createUnitType({
  id: 'shipment',
  label: 'Shipment',
  description: 'A dispatched delivery with tracking and completion status',
  areas: ['logistics-shipments'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'status',       label: 'Status',       type: 'enum', enumValues: ['dispatched', 'in_transit', 'delivered', 'failed', 'returned'] }),
    createPropertyDef({ key: 'on_time',      label: 'On time',      type: 'boolean' }),
    createPropertyDef({ key: 'days_late',    label: 'Days late',    type: 'number' }),
    createPropertyDef({ key: 'claim_raised', label: 'Claim raised', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'shipment-on-vehicle', label: 'On vehicle', toUnitTypeId: 'vehicle', cardinality: 'many-to-one' }),
  ],
})

const Vehicle = createUnitType({
  id: 'vehicle',
  label: 'Vehicle',
  description: 'A fleet asset with maintenance and utilisation signals',
  areas: ['logistics-fleet'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'status',            label: 'Status',            type: 'enum', enumValues: ['active', 'in_maintenance', 'breakdown', 'retired'] }),
    createPropertyDef({ key: 'utilisation_pct',   label: 'Utilisation (%)',   type: 'number' }),
    createPropertyDef({ key: 'last_service_date', label: 'Last service date', type: 'date' }),
    createPropertyDef({ key: 'fuel_cost_week',    label: 'Fuel cost (week)',  type: 'currency' }),
  ],
  links: [],
})

const FreightInvoice = createUnitType({
  id: 'freight-invoice',
  label: 'Freight Invoice',
  description: 'A billing document for a completed delivery or logistics service',
  areas: ['logistics-shipments'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'overdue',        label: 'Overdue',         type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue',   label: 'Days overdue',    type: 'number' }),
    createPropertyDef({ key: 'disputed',       label: 'Disputed',        type: 'boolean' }),
  ],
  links: [],
})

// ─── Hospitality / F&B ────────────────────────────────────────────────────────

const Booking = createUnitType({
  id: 'booking',
  label: 'Booking',
  description: 'A reservation or advance booking event',
  areas: ['hospitality-revenue'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'status',      label: 'Status',    type: 'enum', enumValues: ['confirmed', 'cancelled', 'no_show', 'completed'] }),
    createPropertyDef({ key: 'channel',     label: 'Channel',   type: 'enum', enumValues: ['direct', 'ota', 'phone', 'walk_in'] }),
    createPropertyDef({ key: 'revenue',     label: 'Revenue',   type: 'currency' }),
    createPropertyDef({ key: 'adr',         label: 'ADR',       type: 'currency' }),
  ],
  links: [],
})

const GuestComplaint = createUnitType({
  id: 'guest-complaint',
  label: 'Guest Complaint',
  description: 'A complaint raised by a guest during or after a stay or visit',
  areas: ['hospitality-guest'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'category',    label: 'Category',    type: 'string' }),
    createPropertyDef({ key: 'resolved',    label: 'Resolved',    type: 'boolean' }),
    createPropertyDef({ key: 'shift',       label: 'Shift / period', type: 'string' }),
  ],
  links: [],
})

const ReservationCover = createUnitType({
  id: 'reservation-cover',
  label: 'Cover',
  description: 'A restaurant or dining cover — a guest seated for a meal',
  areas: ['hospitality-revenue', 'hospitality-guest'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'avg_spend',   label: 'Avg spend per cover', type: 'currency' }),
    createPropertyDef({ key: 'no_show',     label: 'No show',             type: 'boolean' }),
    createPropertyDef({ key: 'shift',       label: 'Shift / service',     type: 'string' }),
  ],
  links: [],
})

// ─── Healthcare / Wellness ────────────────────────────────────────────────────

const PatientAppointment = createUnitType({
  id: 'patient-appointment',
  label: 'Appointment',
  description: 'A scheduled patient or client appointment at a healthcare or wellness practice',
  areas: ['healthcare-patients'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'status',        label: 'Status',      type: 'enum', enumValues: ['booked', 'attended', 'no_show', 'cancelled'] }),
    createPropertyDef({ key: 'practitioner',  label: 'Practitioner', type: 'string' }),
    createPropertyDef({ key: 'appointment_type', label: 'Type',     type: 'string' }),
    createPropertyDef({ key: 'reminder_sent', label: 'Reminder sent', type: 'boolean' }),
  ],
  links: [],
})

const HealthcareInvoice = createUnitType({
  id: 'healthcare-invoice',
  label: 'Invoice',
  description: 'A billing invoice for a healthcare or wellness service delivered',
  areas: ['healthcare-billing'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'payer_type',   label: 'Payer type',   type: 'enum', enumValues: ['patient', 'insurance', 'government'] }),
    createPropertyDef({ key: 'collected',    label: 'Collected',    type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue', label: 'Days overdue', type: 'number' }),
    createPropertyDef({ key: 'written_off',  label: 'Written off',  type: 'boolean' }),
  ],
  links: [],
})

// ─── Construction ─────────────────────────────────────────────────────────────

const Bid = createUnitType({
  id: 'bid',
  label: 'Bid',
  description: 'A submitted tender or proposal for a construction project',
  areas: ['construction-pipeline'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'bid_value',  label: 'Bid value', type: 'currency' }),
    createPropertyDef({ key: 'status',     label: 'Status',    type: 'enum', enumValues: ['submitted', 'won', 'lost', 'pending'] }),
    createPropertyDef({ key: 'client',     label: 'Client',    type: 'string' }),
  ],
  links: [],
})

const ConstructionProject = createUnitType({
  id: 'construction-project',
  label: 'Project',
  description: 'An active construction project with schedule, budget, and milestone tracking',
  areas: ['construction-delivery', 'construction-billing'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'contract_value',  label: 'Contract value',  type: 'currency' }),
    createPropertyDef({ key: 'on_schedule',     label: 'On schedule',     type: 'boolean' }),
    createPropertyDef({ key: 'budget_consumed', label: 'Budget used (%)', type: 'number' }),
    createPropertyDef({ key: 'change_orders',   label: 'Change orders',   type: 'number' }),
  ],
  links: [],
})

const DrawRequest = createUnitType({
  id: 'draw-request',
  label: 'Draw Request',
  description: 'A billing draw submitted to a client or lender for completed work',
  areas: ['construction-billing'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'draw_amount', label: 'Draw amount',   type: 'currency' }),
    createPropertyDef({ key: 'approved',   label: 'Approved',       type: 'boolean' }),
    createPropertyDef({ key: 'days_lag',   label: 'Days to approve', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'draw-for-project', label: 'For project', toUnitTypeId: 'construction-project', cardinality: 'many-to-one' }),
  ],
})

const SubcontractorEvent = createUnitType({
  id: 'subcontractor-event',
  label: 'Subcontractor Event',
  description: 'A notable event involving a subcontractor — delay, dispute, or completion',
  areas: ['construction-delivery'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'event_type',  label: 'Event type', type: 'enum', enumValues: ['delay', 'dispute', 'completion', 'invoice'] }),
    createPropertyDef({ key: 'impact_days', label: 'Impact days', type: 'number' }),
    createPropertyDef({ key: 'resolved',    label: 'Resolved',    type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'subcon-on-project', label: 'On project', toUnitTypeId: 'construction-project', cardinality: 'many-to-one' }),
  ],
})

// ─── Agriculture ──────────────────────────────────────────────────────────────

const Harvest = createUnitType({
  id: 'harvest',
  label: 'Harvest',
  description: 'A completed or in-progress harvest event for a field or crop',
  areas: ['agriculture-production'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'crop_type',    label: 'Crop type',    type: 'string' }),
    createPropertyDef({ key: 'yield_units',  label: 'Yield (units)', type: 'number' }),
    createPropertyDef({ key: 'on_plan',      label: 'On plan',       type: 'boolean' }),
    createPropertyDef({ key: 'loss_pct',     label: 'Loss (%)',      type: 'number' }),
  ],
  links: [],
})

const CropSale = createUnitType({
  id: 'crop-sale',
  label: 'Crop Sale',
  description: 'A completed sale of harvested crop at a market or contracted price',
  areas: ['agriculture-production'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'price_per_unit', label: 'Price per unit', type: 'currency' }),
    createPropertyDef({ key: 'quantity_sold',  label: 'Quantity sold',  type: 'number' }),
    createPropertyDef({ key: 'contract',       label: 'Contract sale',  type: 'boolean' }),
  ],
  links: [],
})

const InputPurchase = createUnitType({
  id: 'input-purchase',
  label: 'Input Purchase',
  description: 'A purchase of agricultural inputs (seed, fertiliser, fuel, etc.)',
  areas: ['agriculture-inputs'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'input_type', label: 'Input type', type: 'enum', enumValues: ['seed', 'fertiliser', 'fuel', 'chemical', 'equipment', 'other'] }),
    createPropertyDef({ key: 'cost',       label: 'Cost',       type: 'currency' }),
    createPropertyDef({ key: 'on_time',    label: 'On time',    type: 'boolean' }),
  ],
  links: [],
})

// ─── Fintech / Finance ────────────────────────────────────────────────────────

const FintechAccount = createUnitType({
  id: 'fintech-account',
  label: 'Account',
  description: 'A user or business account in the fintech product',
  areas: ['fintech-customers', 'fintech-risk'],
  interfaces: ['observable', 'actionable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'kyc_status',   label: 'KYC status',   type: 'enum', enumValues: ['not_started', 'in_progress', 'completed', 'rejected'] }),
    createPropertyDef({ key: 'activated',    label: 'Activated',    type: 'boolean' }),
    createPropertyDef({ key: 'churned',      label: 'Churned',      type: 'boolean' }),
    createPropertyDef({ key: 'risk_tier',    label: 'Risk tier',    type: 'enum', enumValues: ['low', 'medium', 'high'] }),
  ],
  links: [],
})

const FraudEvent = createUnitType({
  id: 'fraud-event',
  label: 'Fraud Event',
  description: 'A transaction or account event flagged for potential fraud',
  areas: ['fintech-risk'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'flagged_type', label: 'Flag type', type: 'string' }),
    createPropertyDef({ key: 'confirmed',   label: 'Confirmed fraud', type: 'boolean' }),
    createPropertyDef({ key: 'loss_amount', label: 'Loss amount',     type: 'currency' }),
  ],
  links: [],
})

const Loan = createUnitType({
  id: 'loan',
  label: 'Loan',
  description: 'A credit product issued to a borrower with repayment and default tracking',
  areas: ['fintech-risk'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'principal',   label: 'Principal',      type: 'currency' }),
    createPropertyDef({ key: 'status',      label: 'Status',         type: 'enum', enumValues: ['current', 'delinquent', 'defaulted', 'repaid'] }),
    createPropertyDef({ key: 'days_past_due', label: 'Days past due', type: 'number' }),
  ],
  links: [],
})

// ─── Insurance ────────────────────────────────────────────────────────────────

const Policy = createUnitType({
  id: 'policy',
  label: 'Policy',
  description: 'An insurance policy written, active, or in renewal',
  areas: ['insurance-policy', 'insurance-risk'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'premium',       label: 'Premium',      type: 'currency' }),
    createPropertyDef({ key: 'status',        label: 'Status',       type: 'enum', enumValues: ['active', 'lapsed', 'cancelled', 'renewed', 'expired'] }),
    createPropertyDef({ key: 'product_line',  label: 'Product line', type: 'string' }),
    createPropertyDef({ key: 'renewal_due',   label: 'Renewal due',  type: 'date' }),
  ],
  links: [],
})

const Claim = createUnitType({
  id: 'claim',
  label: 'Claim',
  description: 'An insurance claim filed by a policyholder',
  areas: ['insurance-claims', 'insurance-risk'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'claim_amount',  label: 'Claim amount', type: 'currency' }),
    createPropertyDef({ key: 'status',        label: 'Status',       type: 'enum', enumValues: ['filed', 'approved', 'denied', 'paid', 'disputed'] }),
    createPropertyDef({ key: 'days_open',     label: 'Days open',    type: 'number' }),
    createPropertyDef({ key: 'fraud_flagged', label: 'Fraud flagged', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'claim-on-policy', label: 'On policy', toUnitTypeId: 'policy', cardinality: 'many-to-one' }),
  ],
})

// ─── Telecommunications ───────────────────────────────────────────────────────

const Subscriber = createUnitType({
  id: 'subscriber',
  label: 'Subscriber',
  description: 'A telecom subscriber on a service plan',
  areas: ['telecom-subscribers'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'plan',         label: 'Plan',         type: 'string' }),
    createPropertyDef({ key: 'arpu',         label: 'ARPU',         type: 'currency' }),
    createPropertyDef({ key: 'churned',      label: 'Churned',      type: 'boolean' }),
    createPropertyDef({ key: 'tenure_months', label: 'Tenure (mo)', type: 'number' }),
  ],
  links: [],
})

const NetworkOutage = createUnitType({
  id: 'network-outage',
  label: 'Network Outage',
  description: 'A service outage event with impact and resolution tracking',
  areas: ['telecom-network'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'duration_mins',   label: 'Duration (min)',       type: 'number' }),
    createPropertyDef({ key: 'affected_users',  label: 'Affected subscribers', type: 'number' }),
    createPropertyDef({ key: 'sla_breached',    label: 'SLA breached',         type: 'boolean' }),
    createPropertyDef({ key: 'root_cause',      label: 'Root cause',           type: 'string' }),
  ],
  links: [],
})

const TelecomInvoice = createUnitType({
  id: 'telecom-invoice',
  label: 'Invoice',
  description: 'A subscriber billing invoice',
  areas: ['telecom-subscribers'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'overdue',      label: 'Overdue',      type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue', label: 'Days overdue', type: 'number' }),
  ],
  links: [],
})

// ─── Media / Creator ──────────────────────────────────────────────────────────

const MediaSubscriber = createUnitType({
  id: 'media-subscriber',
  label: 'Subscriber',
  description: 'An email or channel subscriber in the media audience',
  areas: ['media-audience'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'channel',     label: 'Channel',     type: 'enum', enumValues: ['email', 'youtube', 'podcast', 'newsletter', 'other'] }),
    createPropertyDef({ key: 'paid',        label: 'Paid',        type: 'boolean' }),
    createPropertyDef({ key: 'churned',     label: 'Churned',     type: 'boolean' }),
    createPropertyDef({ key: 'open_rate',   label: 'Open rate (%)', type: 'number' }),
  ],
  links: [],
})

const ContentPiece = createUnitType({
  id: 'content-piece',
  label: 'Content Piece',
  description: 'A published or in-progress piece of content',
  areas: ['media-engagement', 'media-monetisation'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'format',      label: 'Format',       type: 'enum', enumValues: ['video', 'article', 'episode', 'post', 'reel'] }),
    createPropertyDef({ key: 'views',       label: 'Views',        type: 'number' }),
    createPropertyDef({ key: 'watch_pct',   label: 'Watch time (%)', type: 'number' }),
    createPropertyDef({ key: 'shares',      label: 'Shares',       type: 'number' }),
    createPropertyDef({ key: 'monetised',   label: 'Monetised',    type: 'boolean' }),
  ],
  links: [],
})

const SponsorshipDeal = createUnitType({
  id: 'sponsorship-deal',
  label: 'Sponsorship Deal',
  description: 'A brand partnership or sponsorship revenue arrangement',
  areas: ['media-monetisation'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'deal_value', label: 'Deal value',  type: 'currency' }),
    createPropertyDef({ key: 'status',     label: 'Status',      type: 'enum', enumValues: ['prospecting', 'signed', 'active', 'completed', 'cancelled'] }),
    createPropertyDef({ key: 'brand',      label: 'Brand',       type: 'string' }),
  ],
  links: [],
})

// ─── Education ────────────────────────────────────────────────────────────────

const StudentEnrolment = createUnitType({
  id: 'student-enrolment',
  label: 'Enrolment',
  description: 'A confirmed student enrolment in a program or course',
  areas: ['education-enrolment', 'education-retention'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'program',    label: 'Program',     type: 'string' }),
    createPropertyDef({ key: 'status',     label: 'Status',      type: 'enum', enumValues: ['active', 'at_risk', 'completed', 'dropped', 'withdrawn'] }),
    createPropertyDef({ key: 'cohort',     label: 'Cohort',      type: 'string' }),
    createPropertyDef({ key: 'scholarship', label: 'Scholarship', type: 'boolean' }),
  ],
  links: [],
})

const StudentDropout = createUnitType({
  id: 'student-dropout',
  label: 'Dropout',
  description: 'A student who has left the program before completion',
  areas: ['education-retention'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'reason',       label: 'Reason',        type: 'string' }),
    createPropertyDef({ key: 'weeks_active', label: 'Weeks active',  type: 'number' }),
    createPropertyDef({ key: 'program',      label: 'Program',       type: 'string' }),
  ],
  links: [],
})

const TuitionPayment = createUnitType({
  id: 'tuition-payment',
  label: 'Tuition Payment',
  description: 'A fee or tuition payment from a student or their sponsor',
  areas: ['education-enrolment'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'overdue',      label: 'Overdue',      type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue', label: 'Days overdue', type: 'number' }),
    createPropertyDef({ key: 'waived',       label: 'Fee waived',   type: 'boolean' }),
  ],
  links: [],
})

// ─── Energy & Utilities ───────────────────────────────────────────────────────

const OutageEvent = createUnitType({
  id: 'outage-event',
  label: 'Outage Event',
  description: 'A power or service outage event requiring response and reporting',
  areas: ['energy-generation', 'energy-compliance'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'type',            label: 'Type',               type: 'enum', enumValues: ['planned', 'unplanned', 'partial', 'full'] }),
    createPropertyDef({ key: 'duration_hrs',    label: 'Duration (hrs)',      type: 'number' }),
    createPropertyDef({ key: 'customers_affected', label: 'Customers affected', type: 'number' }),
    createPropertyDef({ key: 'regulatory_report_required', label: 'Report required', type: 'boolean' }),
  ],
  links: [],
})

const EnergyCustomerBill = createUnitType({
  id: 'energy-customer-bill',
  label: 'Customer Bill',
  description: 'A billing invoice issued to an energy customer',
  areas: ['energy-billing'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'overdue',      label: 'Overdue',      type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue', label: 'Days overdue', type: 'number' }),
    createPropertyDef({ key: 'disconnection_notice', label: 'Disconnection notice', type: 'boolean' }),
  ],
  links: [],
})

const ComplianceFiling = createUnitType({
  id: 'compliance-filing',
  label: 'Compliance Filing',
  description: 'A regulatory filing or report submission to an authority',
  areas: ['energy-compliance'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'filing_type', label: 'Filing type', type: 'string' }),
    createPropertyDef({ key: 'due_date',    label: 'Due date',    type: 'date' }),
    createPropertyDef({ key: 'submitted',   label: 'Submitted',   type: 'boolean' }),
    createPropertyDef({ key: 'overdue',     label: 'Overdue',     type: 'boolean' }),
  ],
  links: [],
})

// ─── Real Estate ─────────────────────────────────────────────────────────────

const Property = createUnitType({
  id: 'property',
  label: 'Property',
  description: 'A physical property asset — residential, commercial, or industrial',
  areas: ['real-estate-portfolio'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'property_type', label: 'Type',           type: 'enum', enumValues: ['residential', 'commercial', 'industrial', 'mixed_use', 'land'] }),
    createPropertyDef({ key: 'status',        label: 'Status',         type: 'enum', enumValues: ['vacant', 'leased', 'for_sale', 'under_renovation', 'sold'] }),
    createPropertyDef({ key: 'current_value', label: 'Current value',  type: 'currency' }),
    createPropertyDef({ key: 'gross_yield',   label: 'Gross yield (%)', type: 'number' }),
  ],
  links: [],
})

const Listing = createUnitType({
  id: 'listing',
  label: 'Listing',
  description: 'A property listed for sale or rent on the market',
  areas: ['real-estate-portfolio'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'list_price',    label: 'List price',       type: 'currency' }),
    createPropertyDef({ key: 'days_on_market', label: 'Days on market',  type: 'number' }),
    createPropertyDef({ key: 'status',        label: 'Status',           type: 'enum', enumValues: ['active', 'under_contract', 'sold', 'leased', 'withdrawn'] }),
    createPropertyDef({ key: 'enquiries',     label: 'Enquiries',        type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'listing-for-property', label: 'For property', toUnitTypeId: 'property', cardinality: 'many-to-one' }),
  ],
})

const Tenant = createUnitType({
  id: 'tenant',
  label: 'Tenant',
  description: 'A current or prospective occupant under a lease agreement',
  areas: ['real-estate-portfolio'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'monthly_rent',      label: 'Monthly rent',     type: 'currency' }),
    createPropertyDef({ key: 'lease_end',          label: 'Lease end',        type: 'date' }),
    createPropertyDef({ key: 'rent_in_arrears',    label: 'Rent in arrears',  type: 'boolean' }),
    createPropertyDef({ key: 'renewal_likely',     label: 'Renewal likely',   type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'tenant-at-property', label: 'At property', toUnitTypeId: 'property', cardinality: 'many-to-one' }),
  ],
})

// ─── Consumer App (extended) ──────────────────────────────────────────────────

const AppSession = createUnitType({
  id: 'app-session',
  label: 'Session',
  description: 'A single user session within the app with engagement depth signals',
  areas: ['app-engagement'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'duration_mins',  label: 'Duration (min)', type: 'number' }),
    createPropertyDef({ key: 'screens_visited', label: 'Screens visited', type: 'number' }),
    createPropertyDef({ key: 'action_taken',   label: 'Action completed', type: 'boolean' }),
    createPropertyDef({ key: 'channel',        label: 'Entry channel', type: 'enum', enumValues: ['organic', 'push', 'email', 'paid', 'referral'] }),
  ],
  links: [
    createLinkDef({ id: 'session-by-user', label: 'By user', toUnitTypeId: 'app-user', cardinality: 'many-to-one' }),
  ],
})

const AppSubscription = createUnitType({
  id: 'app-subscription',
  label: 'Subscription',
  description: 'A recurring in-app subscription or paid tier',
  areas: ['app-monetisation'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'plan',          label: 'Plan',         type: 'string' }),
    createPropertyDef({ key: 'status',        label: 'Status',       type: 'enum', enumValues: ['active', 'cancelled', 'paused', 'past_due', 'trialing'] }),
    createPropertyDef({ key: 'mrr',           label: 'MRR',          type: 'currency' }),
    createPropertyDef({ key: 'billing_cycle', label: 'Billing cycle', type: 'enum', enumValues: ['monthly', 'annual', 'lifetime'] }),
  ],
  links: [
    createLinkDef({ id: 'subscription-by-user', label: 'By user', toUnitTypeId: 'app-user', cardinality: 'many-to-one' }),
  ],
})

// ─── Logistics & Freight (extended) ──────────────────────────────────────────

const Driver = createUnitType({
  id: 'driver',
  label: 'Driver',
  description: 'A driver or rider responsible for completing deliveries',
  areas: ['logistics-fleet'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'status',           label: 'Status',             type: 'enum', enumValues: ['active', 'on_leave', 'suspended', 'offboarded'] }),
    createPropertyDef({ key: 'trips_completed',  label: 'Trips completed',    type: 'number' }),
    createPropertyDef({ key: 'on_time_rate',     label: 'On-time rate (%)',   type: 'number' }),
    createPropertyDef({ key: 'safety_incidents', label: 'Safety incidents',   type: 'number' }),
  ],
  links: [],
})

const MaintenanceEvent = createUnitType({
  id: 'maintenance-event',
  label: 'Maintenance Event',
  description: 'A scheduled or unscheduled maintenance activity on a fleet vehicle',
  areas: ['logistics-fleet'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'type',       label: 'Type',           type: 'enum', enumValues: ['scheduled', 'breakdown', 'inspection', 'repair'] }),
    createPropertyDef({ key: 'cost',       label: 'Cost',           type: 'currency' }),
    createPropertyDef({ key: 'duration_hrs', label: 'Duration (hrs)', type: 'number' }),
    createPropertyDef({ key: 'completed',  label: 'Completed',      type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'maintenance-on-vehicle', label: 'On vehicle', toUnitTypeId: 'vehicle', cardinality: 'many-to-one' }),
  ],
})

// ─── Wholesale / Distribution (extended) ─────────────────────────────────────

const WholesaleInvoice = createUnitType({
  id: 'wholesale-invoice',
  label: 'Invoice',
  description: 'A B2B invoice raised to a wholesale account, with overdue tracking',
  areas: ['wholesale-credit'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'amount',       label: 'Amount',       type: 'currency' }),
    createPropertyDef({ key: 'overdue',      label: 'Overdue',      type: 'boolean' }),
    createPropertyDef({ key: 'days_overdue', label: 'Days overdue', type: 'number' }),
    createPropertyDef({ key: 'disputed',     label: 'Disputed',     type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'wholesale-invoice-from-account', label: 'From account', toUnitTypeId: 'wholesale-account', cardinality: 'many-to-one' }),
  ],
})

// ─── Healthcare / Wellness (extended) ────────────────────────────────────────

const Patient = createUnitType({
  id: 'patient',
  label: 'Patient',
  description: 'An active or former patient across the care relationship lifecycle',
  areas: ['healthcare-patients'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'status',                label: 'Status',           type: 'enum', enumValues: ['active', 'discharged', 'referred_out', 'lost_to_followup'] }),
    createPropertyDef({ key: 'first_visit',           label: 'First visit',      type: 'date' }),
    createPropertyDef({ key: 'appointments_completed', label: 'Appts completed', type: 'number' }),
    createPropertyDef({ key: 'high_risk',             label: 'High risk',        type: 'boolean' }),
  ],
  links: [],
})

const HealthcareClaim = createUnitType({
  id: 'healthcare-claim',
  label: 'Insurance Claim',
  description: 'A claim submitted to an insurance payer for a delivered service',
  areas: ['healthcare-billing'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'payer',        label: 'Payer',           type: 'string' }),
    createPropertyDef({ key: 'amount',       label: 'Claim amount',    type: 'currency' }),
    createPropertyDef({ key: 'status',       label: 'Status',          type: 'enum', enumValues: ['submitted', 'approved', 'denied', 'pending', 'appealed'] }),
    createPropertyDef({ key: 'days_pending', label: 'Days pending',    type: 'number' }),
  ],
  links: [],
})

// ─── Construction (extended) ─────────────────────────────────────────────────

const ConstructionClient = createUnitType({
  id: 'construction-client',
  label: 'Client',
  description: 'A current or prospective client for construction services',
  areas: ['construction-pipeline'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'relationship_stage', label: 'Stage',        type: 'enum', enumValues: ['prospect', 'qualified', 'active', 'past', 'lost'] }),
    createPropertyDef({ key: 'projects_won',       label: 'Projects won', type: 'number' }),
    createPropertyDef({ key: 'total_contract_value', label: 'Total contract value', type: 'currency' }),
    createPropertyDef({ key: 'last_contact',       label: 'Last contact', type: 'date' }),
  ],
  links: [],
})

const Proposal = createUnitType({
  id: 'proposal',
  label: 'Proposal',
  description: 'A formal project proposal or tender submitted to a client',
  areas: ['construction-pipeline'],
  interfaces: ['observable', 'actionable', 'financial'],
  properties: [
    createPropertyDef({ key: 'value',       label: 'Proposal value', type: 'currency' }),
    createPropertyDef({ key: 'status',      label: 'Status',         type: 'enum', enumValues: ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'expired'] }),
    createPropertyDef({ key: 'submitted_at', label: 'Submitted',     type: 'date' }),
    createPropertyDef({ key: 'decision_due', label: 'Decision due',  type: 'date' }),
  ],
  links: [
    createLinkDef({ id: 'proposal-for-client', label: 'For client', toUnitTypeId: 'construction-client', cardinality: 'many-to-one' }),
  ],
})

// ─── Agriculture (extended) ───────────────────────────────────────────────────

const Field = createUnitType({
  id: 'field',
  label: 'Field',
  description: 'A cultivated land plot or growing area with crop and soil signals',
  areas: ['agriculture-production', 'agriculture-inputs'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'area_hectares', label: 'Area (hectares)', type: 'number' }),
    createPropertyDef({ key: 'crop_type',     label: 'Crop type',       type: 'string' }),
    createPropertyDef({ key: 'soil_health',   label: 'Soil health',     type: 'enum', enumValues: ['excellent', 'good', 'fair', 'poor'] }),
    createPropertyDef({ key: 'irrigated',     label: 'Irrigated',       type: 'boolean' }),
  ],
  links: [],
})

const FarmEquipment = createUnitType({
  id: 'farm-equipment',
  label: 'Equipment',
  description: 'A farm machinery or equipment asset with maintenance and uptime tracking',
  areas: ['agriculture-inputs'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'equipment_type',   label: 'Type',              type: 'enum', enumValues: ['tractor', 'harvester', 'irrigation', 'sprayer', 'other'] }),
    createPropertyDef({ key: 'status',           label: 'Status',            type: 'enum', enumValues: ['operational', 'in_maintenance', 'breakdown', 'retired'] }),
    createPropertyDef({ key: 'last_service',     label: 'Last service date', type: 'date' }),
    createPropertyDef({ key: 'downtime_days_ytd', label: 'Downtime days (YTD)', type: 'number' }),
  ],
  links: [],
})

// ─── Fintech / Finance (extended) ────────────────────────────────────────────

const FintechTransaction = createUnitType({
  id: 'fintech-transaction',
  label: 'Transaction',
  description: 'A payment, transfer, or financial event processed through the platform',
  areas: ['fintech-customers'],
  interfaces: ['observable', 'sourced', 'financial'],
  properties: [
    createPropertyDef({ key: 'type',    label: 'Type',   type: 'enum', enumValues: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund'] }),
    createPropertyDef({ key: 'amount',  label: 'Amount', type: 'currency' }),
    createPropertyDef({ key: 'status',  label: 'Status', type: 'enum', enumValues: ['completed', 'pending', 'failed', 'reversed', 'flagged'] }),
    createPropertyDef({ key: 'flagged', label: 'Flagged for review', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'transaction-on-account', label: 'On account', toUnitTypeId: 'fintech-account', cardinality: 'many-to-one' }),
  ],
})

const KYCDocument = createUnitType({
  id: 'kyc-document',
  label: 'KYC Document',
  description: 'A know-your-customer identity or compliance document submission',
  areas: ['fintech-customers'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'document_type', label: 'Document type', type: 'enum', enumValues: ['id', 'passport', 'proof_of_address', 'company_registration', 'other'] }),
    createPropertyDef({ key: 'status',        label: 'Status',        type: 'enum', enumValues: ['pending', 'verified', 'rejected', 'expired'] }),
    createPropertyDef({ key: 'submitted_at',  label: 'Submitted',     type: 'date' }),
    createPropertyDef({ key: 'expiry_date',   label: 'Expiry date',   type: 'date' }),
  ],
  links: [
    createLinkDef({ id: 'kyc-for-account', label: 'For account', toUnitTypeId: 'fintech-account', cardinality: 'many-to-one' }),
  ],
})

// ─── Insurance (extended) ─────────────────────────────────────────────────────

const Policyholder = createUnitType({
  id: 'policyholder',
  label: 'Policyholder',
  description: 'An insured customer with one or more active policies',
  areas: ['insurance-policy'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'policies_count', label: 'Policies held',   type: 'number' }),
    createPropertyDef({ key: 'total_premium',  label: 'Total premium',   type: 'currency' }),
    createPropertyDef({ key: 'risk_tier',      label: 'Risk tier',       type: 'enum', enumValues: ['standard', 'preferred', 'high_risk', 'declined'] }),
    createPropertyDef({ key: 'claims_history', label: 'Claims (lifetime)', type: 'number' }),
  ],
  links: [
    createLinkDef({ id: 'policyholder-has-policies', label: 'Has policies', toUnitTypeId: 'policy', cardinality: 'one-to-many' }),
  ],
})

const ClaimSettlement = createUnitType({
  id: 'claim-settlement',
  label: 'Settlement',
  description: 'A claim settlement or payment issued to a policyholder',
  areas: ['insurance-claims'],
  interfaces: ['observable', 'financial'],
  properties: [
    createPropertyDef({ key: 'settlement_amount', label: 'Settlement amount', type: 'currency' }),
    createPropertyDef({ key: 'settled',           label: 'Settled',           type: 'boolean' }),
    createPropertyDef({ key: 'settlement_date',   label: 'Settlement date',   type: 'date' }),
    createPropertyDef({ key: 'disputed',          label: 'Disputed by claimant', type: 'boolean' }),
  ],
  links: [
    createLinkDef({ id: 'settlement-for-claim', label: 'For claim', toUnitTypeId: 'claim', cardinality: 'one-to-one' }),
  ],
})

// ─── Telecommunications (extended) ───────────────────────────────────────────

const NetworkEquipment = createUnitType({
  id: 'network-equipment',
  label: 'Network Equipment',
  description: 'A network infrastructure asset — tower, router, switch, or node',
  areas: ['telecom-network'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'equipment_type',  label: 'Type',              type: 'enum', enumValues: ['tower', 'router', 'switch', 'node', 'antenna', 'other'] }),
    createPropertyDef({ key: 'status',          label: 'Status',            type: 'enum', enumValues: ['operational', 'degraded', 'failed', 'in_maintenance'] }),
    createPropertyDef({ key: 'uptime_pct',      label: 'Uptime (%)',        type: 'number' }),
    createPropertyDef({ key: 'last_maintenance', label: 'Last maintenance', type: 'date' }),
  ],
  links: [],
})

const TelecomServiceTicket = createUnitType({
  id: 'telecom-service-ticket',
  label: 'Service Ticket',
  description: 'A network-related service request or fault report from a subscriber',
  areas: ['telecom-network', 'telecom-subscribers'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'category',       label: 'Category',      type: 'enum', enumValues: ['fault', 'billing', 'plan_change', 'installation', 'complaint'] }),
    createPropertyDef({ key: 'priority',       label: 'Priority',      type: 'enum', enumValues: ['p1', 'p2', 'p3', 'p4'] }),
    createPropertyDef({ key: 'resolution_hrs', label: 'Resolution (hrs)', type: 'number' }),
    createPropertyDef({ key: 'sla_breached',   label: 'SLA breached',  type: 'boolean' }),
  ],
  links: [],
})

// ─── Media / Creator (extended) ──────────────────────────────────────────────

const Campaign = createUnitType({
  id: 'campaign',
  label: 'Campaign',
  description: 'A marketing or content campaign targeting audience growth or engagement',
  areas: ['media-audience'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'channel',        label: 'Channel',        type: 'enum', enumValues: ['email', 'social', 'paid', 'organic', 'partnership'] }),
    createPropertyDef({ key: 'goal',           label: 'Goal',           type: 'enum', enumValues: ['awareness', 'growth', 'engagement', 'conversion', 'retention'] }),
    createPropertyDef({ key: 'reach',          label: 'Reach',          type: 'number' }),
    createPropertyDef({ key: 'new_subscribers', label: 'New subscribers gained', type: 'number' }),
  ],
  links: [],
})

const Post = createUnitType({
  id: 'post',
  label: 'Post',
  description: 'A published social media post or short-form content piece',
  areas: ['media-engagement'],
  interfaces: ['observable', 'sourced'],
  properties: [
    createPropertyDef({ key: 'platform',        label: 'Platform',         type: 'enum', enumValues: ['instagram', 'twitter_x', 'tiktok', 'linkedin', 'youtube', 'other'] }),
    createPropertyDef({ key: 'format',          label: 'Format',           type: 'enum', enumValues: ['reel', 'image', 'carousel', 'story', 'text', 'video'] }),
    createPropertyDef({ key: 'reach',           label: 'Reach',            type: 'number' }),
    createPropertyDef({ key: 'engagement_rate', label: 'Engagement rate (%)', type: 'number' }),
  ],
  links: [],
})

// ─── Energy & Utilities (extended) ───────────────────────────────────────────

const EnergyAsset = createUnitType({
  id: 'energy-asset',
  label: 'Asset',
  description: 'A generation or distribution infrastructure asset (turbine, panel array, transformer, etc.)',
  areas: ['energy-generation'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'asset_type',       label: 'Type',           type: 'enum', enumValues: ['solar', 'wind', 'gas', 'hydro', 'transformer', 'grid_node', 'other'] }),
    createPropertyDef({ key: 'status',           label: 'Status',         type: 'enum', enumValues: ['operational', 'degraded', 'offline', 'in_maintenance'] }),
    createPropertyDef({ key: 'capacity_mw',      label: 'Capacity (MW)',  type: 'number' }),
    createPropertyDef({ key: 'uptime_pct',       label: 'Uptime (%)',     type: 'number' }),
    createPropertyDef({ key: 'last_maintenance', label: 'Last maintenance', type: 'date' }),
  ],
  links: [],
})

const EnergyCustomer = createUnitType({
  id: 'energy-customer',
  label: 'Customer',
  description: 'A utility customer account with service and billing status',
  areas: ['energy-billing'],
  interfaces: ['observable', 'actionable'],
  properties: [
    createPropertyDef({ key: 'status',           label: 'Status',          type: 'enum', enumValues: ['active', 'overdue', 'disconnected', 'in_dispute'] }),
    createPropertyDef({ key: 'balance_overdue',  label: 'Balance overdue', type: 'currency' }),
    createPropertyDef({ key: 'months_overdue',   label: 'Months overdue',  type: 'number' }),
    createPropertyDef({ key: 'payment_plan',     label: 'Payment plan',    type: 'boolean' }),
  ],
  links: [],
})

// ─── Exports ──────────────────────────────────────────────────────────────────

export const UNIT_TYPE_CATALOG = {
  // SaaS — core
  'customer':         Customer,
  'support-ticket':   SupportTicket,
  'deal':             Deal,
  'lead':             Lead,
  'goal':             GoalSaaS,
  'team-member':      TeamMember,
  'decision':         DecisionSaaS,
  // SaaS — product & engineering
  'feature':            Feature,
  'bug':                Bug,
  'deployment':         Deployment,
  'incident':           Incident,
  // SaaS — people & HR
  'employee':           Employee,
  'job-opening':        JobOpening,
  'performance-review': PerformanceReview,
  // SaaS — finance & accounting
  'saas-invoice':       SaaSInvoice,
  'expense':            Expense,
  'budget':             Budget,
  'vendor':             Vendor,
  // SaaS — customer service (extended)
  'agent':              Agent,
  'support-channel':    SupportChannel,
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
  // Marketplace / Platform
  'transaction':          Transaction,
  'marketplace-seller':   MarketplaceSeller,
  'marketplace-buyer':    MarketplaceBuyer,
  'dispute':              Dispute,
  // Consumer App
  'app-user':          AppUser,
  'install':           Install,
  'in-app-purchase':   InAppPurchase,
  'app-session':       AppSession,
  'app-subscription':  AppSubscription,
  // Life Sciences
  'experiment':              Experiment,
  'research-grant':          ResearchGrant,
  'clinical-trial':          ClinicalTrial,
  'regulatory-submission':   RegulatorySubmission,
  // Wholesale / Distribution
  'wholesale-order':    WholesaleOrder,
  'wholesale-account':  WholesaleAccount,
  'wholesale-invoice':  WholesaleInvoice,
  // Logistics & Freight
  'shipment':           Shipment,
  'vehicle':            Vehicle,
  'freight-invoice':    FreightInvoice,
  'driver':             Driver,
  'maintenance-event':  MaintenanceEvent,
  // Hospitality / F&B
  'booking':            Booking,
  'guest-complaint':    GuestComplaint,
  'reservation-cover':  ReservationCover,
  // Healthcare / Wellness
  'patient-appointment':  PatientAppointment,
  'healthcare-invoice':   HealthcareInvoice,
  'patient':              Patient,
  'healthcare-claim':     HealthcareClaim,
  // Real Estate
  'property': Property,
  'listing':  Listing,
  'tenant':   Tenant,
  // Construction
  'bid':                    Bid,
  'construction-project':   ConstructionProject,
  'draw-request':           DrawRequest,
  'subcontractor-event':    SubcontractorEvent,
  'construction-client':    ConstructionClient,
  'proposal':               Proposal,
  // Agriculture
  'harvest':        Harvest,
  'crop-sale':      CropSale,
  'input-purchase': InputPurchase,
  'field':          Field,
  'farm-equipment': FarmEquipment,
  // Fintech / Finance
  'fintech-account':      FintechAccount,
  'fraud-event':          FraudEvent,
  'loan':                 Loan,
  'fintech-transaction':  FintechTransaction,
  'kyc-document':         KYCDocument,
  // Insurance
  'policy':           Policy,
  'claim':            Claim,
  'policyholder':     Policyholder,
  'claim-settlement': ClaimSettlement,
  // Telecommunications
  'subscriber':             Subscriber,
  'network-outage':         NetworkOutage,
  'telecom-invoice':        TelecomInvoice,
  'network-equipment':      NetworkEquipment,
  'telecom-service-ticket': TelecomServiceTicket,
  // Media / Creator
  'media-subscriber': MediaSubscriber,
  'content-piece':    ContentPiece,
  'sponsorship-deal': SponsorshipDeal,
  'campaign':         Campaign,
  'post':             Post,
  // Education
  'student-enrolment': StudentEnrolment,
  'student-dropout':   StudentDropout,
  'tuition-payment':   TuitionPayment,
  // Energy & Utilities
  'outage-event':         OutageEvent,
  'energy-customer-bill': EnergyCustomerBill,
  'compliance-filing':    ComplianceFiling,
  'energy-asset':         EnergyAsset,
  'energy-customer':      EnergyCustomer,
}

export function getUnitType(id) {
  return UNIT_TYPE_CATALOG[id] ?? null
}

export function getUnitTypesForArea(areaId) {
  return Object.values(UNIT_TYPE_CATALOG).filter((u) => u.areas.includes(areaId))
}
