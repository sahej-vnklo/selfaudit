export const OPERATIONAL_AREA_IDS = [
  'customer-service',
  'marketing-sales',
  'finance-accounting',
  'management-strategy',
  'revenue-sales',
  'inventory-operations',
  'production',
  'client-delivery',
]

export const OPERATIONAL_AREAS = [
  {
    id: 'customer-service',
    slug: 'customer-service',
    label: 'Customer Service',
    shortLabel: 'Customer Service',
    summary: 'Monitors support quality, response patterns, recurring issues, and customer risk signals.',
    outcome: 'Keep service quality high, catch support failures early, and surface patterns that hurt retention.',
  },
  {
    id: 'marketing-sales',
    slug: 'marketing-sales',
    label: 'Marketing & Sales',
    shortLabel: 'Marketing & Sales',
    summary: 'Monitors pipeline, demand generation, conversion flow, follow-up quality, and revenue creation signals.',
    outcome: 'Spot weak pipeline, stalled deals, poor conversion, and growth opportunities before they compound.',
  },
  {
    id: 'finance-accounting',
    slug: 'finance-accounting',
    label: 'Finance & Accounting',
    shortLabel: 'Finance & Accounting',
    summary: 'Monitors revenue quality, cash health, burn, churn, margins, and accounting risk signals.',
    outcome: 'Protect runway, surface unit-economics problems, and flag financial drift before it becomes critical.',
  },
  {
    id: 'management-strategy',
    slug: 'management-strategy',
    label: 'Management & Strategy',
    shortLabel: 'Management & Strategy',
    summary: 'Monitors goals, execution follow-through, bottlenecks, leadership attention, and strategy-to-execution gaps.',
    outcome: 'Keep the company pointed at the right priorities and expose where execution is failing the plan.',
  },
  {
    id: 'revenue-sales',
    slug: 'revenue-sales',
    label: 'Revenue & Sales',
    shortLabel: 'Revenue & Sales',
    summary: 'Monitors daily revenue, order value, repeat rate, site conversion, and refund signals for D2C businesses.',
    outcome: 'Keep revenue healthy by catching order flow issues, margin erosion, and repeat-purchase decline early.',
  },
  {
    id: 'inventory-operations',
    slug: 'inventory-operations',
    label: 'Inventory & Operations',
    shortLabel: 'Inventory & Ops',
    summary: 'Monitors stockouts, days of cover, fulfilment speed, and supplier lead times.',
    outcome: 'Prevent inventory gaps from becoming revenue gaps and keep operations moving at the pace of demand.',
  },
  {
    id: 'production',
    slug: 'production',
    label: 'Production',
    shortLabel: 'Production',
    summary: 'Monitors machine uptime, output vs plan, defect rates, OEE, and scrap for manufacturing businesses.',
    outcome: 'Keep production running at capacity with acceptable quality before defects and downtime compound.',
  },
  {
    id: 'client-delivery',
    slug: 'client-delivery',
    label: 'Client Delivery',
    shortLabel: 'Client Delivery',
    summary: 'Monitors project health, overdue milestones, client satisfaction, and team utilisation.',
    outcome: 'Protect renewals and referrals by catching delivery problems before they erode client trust.',
  },
]

export const OPERATIONAL_AREA_MAP = Object.fromEntries(
  OPERATIONAL_AREAS.map((area) => [area.id, area])
)

export function getOperationalArea(areaId) {
  return OPERATIONAL_AREA_MAP[areaId] ?? null
}

export function isOperationalArea(areaId) {
  return Object.prototype.hasOwnProperty.call(OPERATIONAL_AREA_MAP, areaId)
}
