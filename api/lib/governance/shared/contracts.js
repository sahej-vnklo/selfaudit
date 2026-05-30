export const GOVERNANCE_SIGNAL_STATUSES = ['good', 'watch', 'bad']

export const GOVERNANCE_RULE_TYPES = [
  'threshold',
  'trend',
  'absence',
  'anomaly',
  'checklist',
]

export const GOVERNANCE_SEVERITIES = ['low', 'medium', 'high', 'critical']

export const GOVERNANCE_FINDING_TYPES = [
  'risk',
  'drift',
  'opportunity',
  'anomaly',
  'execution-gap',
]

export const GOVERNANCE_COMPARATORS = [
  'lt',
  'lte',
  'gt',
  'gte',
  'eq',
  'neq',
]

export function createMetricDefinition({
  key,
  label,
  unit = 'count',
  description = '',
  preferredDirection = 'neutral',
  defaultInterpretation = '',
}) {
  return { key, label, unit, description, preferredDirection, defaultInterpretation }
}

export function createThresholdRule({
  id,
  metricKey,
  comparator,
  value,
  status = 'watch',
  severity = 'medium',
  title,
  summary,
  recommendation,
  rationale = '',
}) {
  return {
    id,
    type: 'threshold',
    metricKey,
    comparator,
    value,
    status,
    severity,
    title,
    summary,
    recommendation,
    rationale,
  }
}

export function createRulePack({ defaults = [], notes = [] }) {
  return { defaults, notes }
}

function compareMetricValue(metricValue, comparator, targetValue) {
  switch (comparator) {
    case 'lt':
      return metricValue < targetValue
    case 'lte':
      return metricValue <= targetValue
    case 'gt':
      return metricValue > targetValue
    case 'gte':
      return metricValue >= targetValue
    case 'eq':
      return metricValue === targetValue
    case 'neq':
      return metricValue !== targetValue
    default:
      return false
  }
}

export function normalizeGovernanceMetrics(metrics) {
  if (!metrics) return {}

  if (Array.isArray(metrics)) {
    return Object.fromEntries(
      metrics
        .filter((metric) => metric && metric.key)
        .map((metric) => [metric.key, metric.value])
    )
  }

  return { ...metrics }
}

export function evaluateThresholdRule(rule, metrics) {
  if (!rule || rule.type !== 'threshold') return null

  const normalizedMetrics = normalizeGovernanceMetrics(metrics)
  const metricValue = normalizedMetrics[rule.metricKey]

  if (metricValue == null || Number.isNaN(metricValue)) {
    return null
  }

  if (!compareMetricValue(metricValue, rule.comparator, rule.value)) {
    return null
  }

  return {
    id: rule.id,
    type: 'risk',
    status: rule.status,
    severity: rule.severity,
    metricKey: rule.metricKey,
    metricValue,
    comparator: rule.comparator,
    thresholdValue: rule.value,
    title: rule.title,
    summary: rule.summary,
    recommendation: rule.recommendation,
    rationale: rule.rationale,
  }
}

export function evaluateRulePack(rulePack, metrics, overrides = null) {
  const defaults = rulePack?.defaults ?? []

  return defaults
    .map((rule) => {
      if (overrides) {
        const override = overrides.get(rule.id)
        if (override && !override.enabled) return null
        if (override) return evaluateThresholdRule({ ...rule, value: override.value }, metrics)
      }
      return evaluateThresholdRule(rule, metrics)
    })
    .filter(Boolean)
}
