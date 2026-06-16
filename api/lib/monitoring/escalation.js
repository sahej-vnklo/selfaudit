const TIER_RANK = {
  watch: 1,
  flag: 2,
  escalate: 3,
  alert: 4,
  critical: 5,
}

export function mapFindingToEscalationTier(finding) {
  const status = String(finding?.status || '').toLowerCase()
  const severity = String(finding?.severity || '').toLowerCase()

  if (severity === 'critical') return 'critical'
  if (status === 'bad' && severity === 'high') return 'alert'
  if (status === 'watch' && severity === 'high') return 'escalate'
  if (status === 'bad' && severity === 'medium') return 'escalate'
  if (status === 'watch' && severity === 'medium') return 'flag'
  if (status === 'bad' && severity === 'low') return 'flag'
  return 'watch'
}

export function tierRank(tier) {
  return TIER_RANK[tier] ?? 0
}

export function meetsEmailThreshold(tier, threshold) {
  return tierRank(tier) >= tierRank(threshold || 'alert')
}

export function tierTone(tier) {
  const tones = {
    watch: 'muted',
    flag: 'info',
    escalate: 'warning',
    alert: 'danger',
    critical: 'critical',
  }
  return tones[tier] ?? 'muted'
}
