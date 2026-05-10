// Expected Supabase table (create if not exists):
//
// create table business_health_checks (
//   id                uuid primary key default gen_random_uuid(),
//   user_id           uuid not null references profiles(id) on delete cascade,
//   checked_at        timestamptz not null,
//   health_score      int,
//   risks             jsonb,
//   opportunities     jsonb,
//   summary           text,
//   recommended_actions jsonb,
//   evidence          jsonb,
//   created_at        timestamptz default now()
// );
// create index on business_health_checks (user_id, checked_at desc);

import { createClient } from '@supabase/supabase-js'
import { runBusinessHealthCheck } from './lib/monitoring/health-check.js'
import { upsertCompanyBrain } from './lib/intelligence/company-brain.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body || {}
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }

  try {
    // 1. Run the health check
    const result = await runBusinessHealthCheck(userId)

    // 2. Persist to business_health_checks — non-blocking on failure
    try {
      await supabase.from('business_health_checks').insert({
        user_id:             userId,
        checked_at:          result.checked_at,
        health_score:        result.health_score,
        risks:               result.risks,
        opportunities:       result.opportunities,
        summary:             result.summary,
        recommended_actions: result.recommended_actions,
        evidence:            result.evidence,
      })
    } catch (persistErr) {
      console.warn('[run-health-check] persist failed:', persistErr.message)
    }

    // 3. Propagate new risk/opportunity signals into intelligence_profiles
    //    so the company brain stays current without a full re-audit.
    //    watchouts ← critical+high risk titles
    //    opportunities ← opportunity titles from this run
    try {
      const newWatchouts = result.risks
        .filter((r) => r.severity === 'critical' || r.severity === 'high')
        .map((r) => r.title)
        .filter(Boolean)

      const newOpportunities = result.opportunities
        .map((o) => o.title)
        .filter(Boolean)

      const patch = {}
      if (newWatchouts.length)    patch.watchouts     = newWatchouts
      if (newOpportunities.length) patch.opportunities = newOpportunities

      if (Object.keys(patch).length > 0) {
        await upsertCompanyBrain(userId, patch)
      }
    } catch (brainErr) {
      console.warn('[run-health-check] brain update failed:', brainErr.message)
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('[run-health-check]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
