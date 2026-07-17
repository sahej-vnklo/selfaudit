const ACTIONABLE_TIERS = new Set(['escalate', 'alert', 'critical'])

const TIER_RANK = {
  critical: 5,
  alert: 4,
  escalate: 3,
  flag: 2,
  watch: 1,
}
const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const URGENCY_COPY = {
  critical: { label: 'Critical', detail: 'Highest escalation tier' },
  alert: { label: 'High', detail: 'Alert tier' },
  escalate: { label: 'Elevated', detail: 'Escalation tier' },
}

function finitePositive(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

function formatCurrency(value) {
  const amount = finitePositive(value)
  if (amount == null) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function financialImpactFor(alert) {
  const impact = alert?.evidence_snapshot?.financialImpact
  if (!impact || impact.tier === 'none') return null

  const low = finitePositive(impact?.estimated_exposure?.low)
  const high = finitePositive(impact?.estimated_exposure?.high)
  if (low != null && high != null) {
    return {
      score: (low + high) / 2,
      display: `${formatCurrency(low)}–${formatCurrency(high)}`,
      label: 'Estimated exposure',
      basis: impact.estimated_exposure?.basis || null,
    }
  }

  const observed = finitePositive(impact.observed)
  if (observed != null) {
    return {
      score: observed,
      display: formatCurrency(observed),
      label: 'Observed impact',
      basis: impact.observed_scope ? `Observed scope: ${impact.observed_scope}` : null,
    }
  }

  return null
}

function fallbackAreaLabel(category) {
  return String(category || 'Unassigned area')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function buildTopSignals(alerts = [], selectedAreas = []) {
  const areaLabelById = new Map(selectedAreas.map((area) => [area.id, area.label]))

  return alerts
    .filter((alert) => ACTIONABLE_TIERS.has(alert?.escalation_tier))
    .map((alert) => {
      const snapshotFinding = alert.evidence_snapshot?.finding || {}
      const areaId = snapshotFinding.areaId || alert.category || null
      const areaLabel = areaLabelById.get(areaId) || fallbackAreaLabel(areaId)
      const entityLabel = snapshotFinding.entityLabel || null
      const financialImpact = financialImpactFor(alert)
      const urgency = URGENCY_COPY[alert.escalation_tier] || {
        label: alert.severity || 'Review',
        detail: 'Open signal',
      }

      return {
        id: alert.id,
        title: alert.title,
        issue_summary: alert.description || 'No issue summary is available yet.',
        likely_driver: alert.evidence?.rootCause || null,
        impact_summary: alert.evidence?.impact || null,
        affected_label: entityLabel ? 'Affected entity' : 'Affected area',
        affected_detail: entityLabel || areaLabel,
        area_id: areaId,
        area_label: areaLabel,
        financial_impact: financialImpact,
        urgency,
        recommended_next_step: alert.recommended_action || null,
        severity: alert.severity || null,
        escalation_tier: alert.escalation_tier,
        created_at: alert.created_at || null,
        checked_at: alert.evidence_snapshot?.checked_at || null,
        execution_staged: alert.execution_staged === true,
      }
    })
    .sort((a, b) => {
      const aHasImpact = a.financial_impact?.score != null
      const bHasImpact = b.financial_impact?.score != null
      if (aHasImpact !== bHasImpact) return aHasImpact ? -1 : 1
      if (aHasImpact && bHasImpact && a.financial_impact.score !== b.financial_impact.score) {
        return b.financial_impact.score - a.financial_impact.score
      }

      const tierDifference = (TIER_RANK[b.escalation_tier] || 0) - (TIER_RANK[a.escalation_tier] || 0)
      if (tierDifference) return tierDifference

      const severityDifference = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)
      if (severityDifference) return severityDifference

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
    .map((signal, index) => ({ ...signal, rank: index + 1 }))
}
