export const OPERATIONAL_AREA_IDS = [
  'customer-service',
  'marketing-sales',
  'finance-accounting',
  'management-strategy',
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
