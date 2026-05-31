// Returns trend direction per area based on area_metric_snapshots.
// Direction is computed by comparing the most recent snapshot to the prior one.
// Used to show ↑ ↓ → arrows on area cards in the Oversight section.

import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const AREAS = ['customer-service', 'marketing-sales', 'finance-accounting', 'management-strategy']

// Higher value = better for these metrics
const HIGHER_IS_BETTER = new Set(['open_deals', 'pipeline_value', 'lead_volume', 'stage_conversion', 'mrr', 'ltv_cac_ratio', 'goal_progress', 'followthrough_rate', 'csat'])
// Lower value = better for these metrics
const LOWER_IS_BETTER  = new Set(['churn_rate', 'burn_rate', 'first_response_time', 'resolution_time', 'repeat_issue_rate', 'sales_cycle_days', 'priority_backlog', 'repeated_blockers', 'watchouts'])

function metricDirection(metricName, delta) {
  if (delta == null || delta === 0) return 'stable'
  const improving = HIGHER_IS_BETTER.has(metricName) ? delta > 0 : delta < 0
  return improving ? 'improving' : 'worsening'
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  // Fetch the last 48 hours of snapshots — enough for two health check cycles
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: rows, error } = await supabase
    .from('area_metric_snapshots')
    .select('area, metric_name, value, delta_from_prior, captured_at')
    .eq('user_id', userId)
    .gte('captured_at', cutoff)
    .order('captured_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Group by area, compute direction per area from key metrics
  const trends = {}
  for (const area of AREAS) {
    const areaRows = (rows ?? []).filter((r) => r.area === area)
    if (!areaRows.length) {
      trends[area] = { direction: 'stable', delta: null, label: '—', key_metric: null }
      continue
    }

    // Use the metric with the largest absolute delta as the representative signal
    const withDelta = areaRows.filter((r) => r.delta_from_prior != null)
    if (!withDelta.length) {
      trends[area] = { direction: 'stable', delta: null, label: '—', key_metric: null }
      continue
    }

    const representative = withDelta.reduce((best, r) =>
      Math.abs(r.delta_from_prior) > Math.abs(best.delta_from_prior) ? r : best
    )

    const direction = metricDirection(representative.metric_name, representative.delta_from_prior)
    const label = direction === 'improving' ? '↑' : direction === 'worsening' ? '↓' : '→'

    trends[area] = {
      direction,
      delta: representative.delta_from_prior,
      label,
      key_metric: representative.metric_name,
      value: representative.value,
    }
  }

  return res.status(200).json({ trends })
}
