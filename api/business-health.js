import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain } from './lib/intelligence/company-brain.js'
import { validateUserToken } from './lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function domainScore(status) {
  if (status === 'critical')   return 30
  if (status === 'needs_work') return 60
  return 85
}

function computeScore(brain, latestDomains) {
  // Base: domain scores from latest diagnostic report if available,
  // otherwise start at 75 (we know something but not domain-level detail).
  let score = latestDomains.length
    ? Math.round(latestDomains.reduce((s, d) => s + domainScore(d.status), 0) / latestDomains.length)
    : 75

  // Deductions from cross-session intelligence
  const risks     = brain.watchouts       ?? []
  const blockers  = brain.repeated_blockers ?? []
  const actions   = brain.top_priorities  ?? []

  score -= Math.min(risks.length    * 4, 20)
  score -= Math.min(blockers.length * 3, 12)
  score -= Math.min(actions.length  * 1,  8)

  // Small boost if last session was marked done/resolved
  if (brain.last_session?.status === 'done') score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = req.method === 'GET' ? req.query.userId : req.body?.userId
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  if (!await validateUserToken(req, res, userId)) return

  try {
    const [brain, reportRes, healthCheckRes] = await Promise.allSettled([
      getCompanyBrain(userId),
      supabase
        .from('reports')
        .select('content, created_at')
        .eq('user_id', userId)
        .eq('conversation_mode', 'DIAGNOSTIC')
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('business_health_checks')
        .select('checked_at, summary, recommended_actions, evidence, risks')
        .eq('user_id', userId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single(),
    ])

    const b = brain.status === 'fulfilled' ? brain.value : null
    const latestReport = reportRes.status === 'fulfilled' ? reportRes.value.data : null
    const latestHealthCheck = healthCheckRes.status === 'fulfilled' ? healthCheckRes.value.data : null

    // Parse domain statuses from the latest diagnostic report
    let latestDomains = []
    let strongestArea = null
    let weakestArea   = null

    if (latestReport?.content) {
      try {
        const parsed = typeof latestReport.content === 'string'
          ? JSON.parse(latestReport.content)
          : latestReport.content
        if (Array.isArray(parsed.domains)) {
          latestDomains = parsed.domains
          const sorted = [...parsed.domains].sort((a, z) => domainScore(z.status) - domainScore(a.status))
          strongestArea = sorted[0]?.name ?? null
          weakestArea   = sorted[sorted.length - 1]?.name ?? null
        }
      } catch {
        // non-blocking
      }
    }

    const healthScore = b ? computeScore(b, latestDomains) : (latestDomains.length ? Math.round(latestDomains.reduce((s, d) => s + domainScore(d.status), 0) / latestDomains.length) : null)
    const governance = latestHealthCheck?.evidence?.governance && typeof latestHealthCheck.evidence.governance === 'object'
      ? latestHealthCheck.evidence.governance
      : {}

    return res.status(200).json({
      health_score:       healthScore,
      strongest_area:     strongestArea,
      weakest_area:       weakestArea,
      active_risks:       b?.watchouts             ?? [],
      unresolved_actions: b?.top_priorities        ?? [],
      ai_opportunities:   b?.opportunities         ?? [],
      known_bottlenecks:  b?.repeated_blockers     ?? [],
      last_updated_at:    b?.last_synthesized_at   ?? latestReport?.created_at ?? null,
      summary:            b?.intelligence_summary  ?? null,
      health_check_summary: latestHealthCheck?.summary ?? null,
      health_check_actions: Array.isArray(latestHealthCheck?.recommended_actions) ? latestHealthCheck.recommended_actions : [],
      governance_summary: governance.advice_summary || null,
      governance_area_statuses: Array.isArray(governance.area_statuses) ? governance.area_statuses : [],
      governance_top_diagnoses: Array.isArray(governance.top_diagnoses) ? governance.top_diagnoses : [],
      governance_alert_candidates: Number(governance.alert_candidates || 0) || 0,
      governance_diagnoses_count: Number(governance.diagnoses || 0) || 0,
      governance_areas_with_signals: Number(governance.areas_with_signals || 0) || 0,
      governance_areas_needing_attention: Number(governance.areas_needing_attention || 0) || 0,
      governance_areas_to_watch: Number(governance.areas_to_watch || 0) || 0,
      governance_checked_at: latestHealthCheck?.checked_at ?? null,
    })
  } catch (err) {
    console.error('[business-health]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
