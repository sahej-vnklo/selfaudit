import { OPERATIONAL_AREAS, getOperationalArea, isOperationalArea } from '../../../shared/governance/operational-areas.js'
import { CUSTOMER_SERVICE_AREA } from './areas/customer-service/index.js'
import { MARKETING_SALES_AREA } from './areas/marketing-sales/index.js'
import { FINANCE_ACCOUNTING_AREA } from './areas/finance-accounting/index.js'
import { MANAGEMENT_STRATEGY_AREA } from './areas/management-strategy/index.js'
import { evaluateCustomerServiceArea } from './areas/customer-service/index.js'
import { evaluateMarketingSalesArea } from './areas/marketing-sales/index.js'
import { evaluateFinanceAccountingArea } from './areas/finance-accounting/index.js'
import { evaluateManagementStrategyArea } from './areas/management-strategy/index.js'

const AREA_MODULES = [
  CUSTOMER_SERVICE_AREA,
  MARKETING_SALES_AREA,
  FINANCE_ACCOUNTING_AREA,
  MANAGEMENT_STRATEGY_AREA,
]

export const OPERATIONAL_AREA_REGISTRY = AREA_MODULES.map((module) => ({
  ...getOperationalArea(module.id),
  ...module,
}))

export const OPERATIONAL_AREA_REGISTRY_MAP = Object.fromEntries(
  OPERATIONAL_AREA_REGISTRY.map((area) => [area.id, area])
)

export { OPERATIONAL_AREAS, getOperationalArea, isOperationalArea }

export function getOperationalAreaModule(areaId) {
  return OPERATIONAL_AREA_REGISTRY_MAP[areaId] ?? null
}

const AREA_EVALUATORS = {
  'customer-service': evaluateCustomerServiceArea,
  'marketing-sales': evaluateMarketingSalesArea,
  'finance-accounting': evaluateFinanceAccountingArea,
  'management-strategy': evaluateManagementStrategyArea,
}

export function evaluateOperationalArea(areaId, metrics) {
  const evaluator = AREA_EVALUATORS[areaId]
  if (!evaluator) return []
  return evaluator(metrics)
}
