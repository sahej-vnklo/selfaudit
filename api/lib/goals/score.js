function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function computeProgress(goalNode) {
  const baseline = Number(goalNode?.baseline_value)
  const target = Number(goalNode?.target_value)
  const current = Number(goalNode?.current_value)

  if (!isFiniteNumber(baseline) || !isFiniteNumber(target) || !isFiniteNumber(current)) {
    const fallback = Number(goalNode?.progress)
    return clamp(Number.isFinite(fallback) ? fallback : 0)
  }

  if (goalNode?.metric_direction === 'increase') {
    const denominator = target - baseline
    if (denominator === 0) return clamp(Number(goalNode?.progress) || 0)
    return clamp(((current - baseline) / denominator) * 100)
  }

  if (goalNode?.metric_direction === 'decrease') {
    const denominator = baseline - target
    if (denominator === 0) return clamp(Number(goalNode?.progress) || 0)
    return clamp(((baseline - current) / denominator) * 100)
  }

  return clamp(Number(goalNode?.progress) || 0)
}

function hasOppositeTrajectory(goalNode, recentSnapshots) {
  if (!goalNode?.metric_direction || !Array.isArray(recentSnapshots) || recentSnapshots.length < 2) {
    return false
  }

  const ordered = [...recentSnapshots].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at))
  const prior = Number(ordered[0]?.value)
  const latest = Number(ordered[1]?.value)
  if (!Number.isFinite(prior) || !Number.isFinite(latest)) return false

  if (goalNode.metric_direction === 'increase') return latest < prior
  if (goalNode.metric_direction === 'decrease') return latest > prior
  return false
}

export function computeGoalScore(goalNode, recentSnapshots = null, areaStatus = null) {
  const progress = computeProgress(goalNode)
  let healthScore = progress

  const deadline = goalNode?.deadline ? new Date(goalNode.deadline) : null
  if (deadline && !Number.isNaN(deadline.getTime()) && deadline < new Date() && progress < 100) {
    healthScore -= 15
  }

  if (hasOppositeTrajectory(goalNode, recentSnapshots)) {
    healthScore -= 10
  }

  if (areaStatus === 'watch') healthScore -= 10
  if (areaStatus === 'bad') healthScore -= 20

  return {
    progress,
    health_score: clamp(healthScore),
  }
}
