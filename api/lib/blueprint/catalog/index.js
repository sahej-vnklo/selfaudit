// Blueprint catalog — all selectable building blocks
export { SHARED_PROPERTIES } from './shared-properties.js'
export { INTERFACES, INTERFACE_IDS } from './interfaces.js'
export {
  UNIT_TYPE_CATALOG,
  getUnitType,
  getUnitTypesForArea,
} from './units.js'
export {
  AREA_CATALOG,
  AREA_CUSTOMER_SERVICE,
  AREA_FINANCE_ACCOUNTING,
  AREA_MANAGEMENT_STRATEGY,
  AREA_MARKETING_SALES,
  AREA_REVENUE_SALES,
  AREA_INVENTORY_OPERATIONS,
  AREA_PRODUCTION,
  AREA_CLIENT_DELIVERY,
  COMPOUND_RULES_SAAS,
  COMPOUND_RULES_ECOMMERCE,
  COMPOUND_RULES_MANUFACTURING,
  COMPOUND_RULES_PS,
  getArea,
  getAreasForIndustry,
} from './areas.js'
export {
  INDUSTRY_CATALOG,
  getIndustry,
  listIndustries,
} from './industries.js'
