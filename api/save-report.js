import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { synthesizeUserIntelligence } from './lib/intelligence/synthesize.js'
import { upsertCompanyBrain } from './lib/intelligence/company-brain.js'
import { sendUserReportEmail } from './lib/notifications/user-report-email.js'
import { validateSaveReportPayload } from './lib/save-report-validation.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function buildMemoryEntry(r, industry, domain) {
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const mode = r.conversation_mode ?? 'DIAGNOSTIC'
  const ctx  = [industry, domain].filter(Boolean).join(' / ')

  const lines = [`[Audit — ${date} — ${mode}${ctx ? ` — ${ctx}` : ''}]`]
  lines.push(`Headline: ${r.headline}`)

  // Root causes: non_ai_fixes issues first, fall back to critical domain findings
  const rootCauses = []
  if (r.non_ai_fixes?.length > 0) {
    r.non_ai_fixes.slice(0, 2).forEach(f => { if (f.issue) rootCauses.push(f.issue) })
  }
  if (rootCauses.length === 0 && r.domains?.length > 0) {
    r.domains.filter(d => d.status === 'critical').slice(0, 2).forEach(d => { if (d.finding) rootCauses.push(d.finding) })
  }
  if (rootCauses.length > 0) {
    lines.push(`Root causes found: ${rootCauses.join('; ')}`)
  }

  // Key actions: first 2 priority_actions
  if (r.priority_actions?.length > 0) {
    const actions = r.priority_actions.slice(0, 2).filter(Boolean)
    if (actions.length > 0) lines.push(`Key actions given: ${actions.join('; ')}`)
  }

  // Goal mode extras
  if (r.goal_gap_analysis) {
    if (r.goal_gap_analysis.goal) lines.push(`Goal: ${r.goal_gap_analysis.goal}`)
    if (r.goal_gap_analysis.gap)  lines.push(`Gap identified: ${r.goal_gap_analysis.gap}`)
  }

  lines.push('Status: unknown (not followed up)')
  return lines.join('\n')
}

function goalScoreFromFeasibility(feasibility) {
  if (!feasibility) return null
  const f = feasibility.toLowerCase()
  if (f.startsWith('feasible'))    return 80
  if (f.startsWith('tight'))       return 50
  if (f.startsWith('unrealistic')) return 20
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, sessionId, report: r, industry, domain, goalTimeline, goalBaseline, goalMode, userEmail, userName } = req.body
  const validationError = validateSaveReportPayload(req.body)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }
  if (!await validateUserToken(req, res, userId)) return

  try {
    const { error: insertError } = await supabase.from('reports').insert({
      user_id:           userId,
      session_id:        sessionId ?? null,
      title:             r.headline,
      content:           JSON.stringify(r),
      domains:           r.domains?.map(d => d.name) ?? [],
      report_data:       r,
      industry:          industry ?? null,
      domain:            domain ?? null,
      conversation_mode: r.conversation_mode,
      headline:          r.headline,
    })
    if (insertError) throw insertError

    // Structured memory: append new entry to profiles.context
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('context')
        .eq('id', userId)
        .single()

      const newEntry = buildMemoryEntry(r, industry, domain)
      const existing = profile?.context ? profile.context.trim() : ''
      const updated  = existing ? `${existing}\n\n${newEntry}` : newEntry

      await supabase
        .from('profiles')
        .update({ context: updated })
        .eq('id', userId)
    } catch (memErr) {
      console.warn('[save-report] memory update failed:', memErr.message)
    }

    // Company brain update — safe merge into business_state + intelligence_profiles
    // Uses upsertCompanyBrain so existing non-empty fields are never overwritten with nulls.
    try {
      const bs = r.business_state ?? {}

      // Compute goal_score_delta before handing off to upsertCompanyBrain
      const { data: existingBs } = await supabase
        .from('business_state')
        .select('goal_score')
        .eq('user_id', userId)
        .single()

      const prevScore = existingBs?.goal_score ?? 0
      const newScore  = goalMode
        ? (goalScoreFromFeasibility(r.timeline_feasibility) ?? prevScore)
        : prevScore

      const brainPatch = {
        // Business model fields → business_state
        ...(bs.revenue_streams?.length        && { revenue_streams:        bs.revenue_streams }),
        ...(bs.core_offer                     && { core_offer:             bs.core_offer }),
        ...(bs.target_customer                && { target_customer:        bs.target_customer }),
        ...(bs.funnel_stages?.length          && { funnel_stages:          bs.funnel_stages }),
        ...(bs.conversion_bottlenecks?.length && { conversion_bottlenecks: bs.conversion_bottlenecks }),
        ...(bs.retention_churn_signals?.length && { retention_signals:     bs.retention_churn_signals }),
        ...(bs.team_ownership                 && { team_ownership:         bs.team_ownership }),
        ...(bs.operational_blockers?.length   && { operational_blockers:   bs.operational_blockers }),
        ...(bs.pricing_structure              && { pricing_structure:      bs.pricing_structure }),
        ...(bs.current_constraints?.length    && { current_constraints:    bs.current_constraints }),
        ...(bs.assumptions_unverified?.length && { assumptions_unverified: bs.assumptions_unverified }),
        ...(goalMode && r.goal_gap_analysis?.goal && { active_goal: r.goal_gap_analysis.goal }),
        ...(goalTimeline                      && { goal_timeline:          goalTimeline }),
        ...(goalBaseline                      && { goal_baseline:          goalBaseline }),
        goal_score:          newScore,
        goal_score_delta:    newScore - prevScore,
        last_audit_headline: r.headline ?? null,

        // Intelligence fields → intelligence_profiles (appended/merged, not overwritten)
        ...(r.ai_opportunities?.length && {
          opportunities: r.ai_opportunities.map(a => typeof a === 'string' ? a : a.area ?? a.title ?? JSON.stringify(a)).filter(Boolean),
        }),
        ...(r.priority_actions?.length && { top_priorities: r.priority_actions.filter(Boolean) }),
        ...(r.domains?.filter(d => d.status === 'critical').length && {
          watchouts: r.domains.filter(d => d.status === 'critical').map(d => d.finding ?? d.name).filter(Boolean),
        }),
        ...(r.headline && { top_headlines: [r.headline] }),
        ...(r.domains?.length && {
          domains_audited: r.domains.map(d => d.name).filter(Boolean),
        }),
      }

      await upsertCompanyBrain(userId, brainPatch)
    } catch (bsErr) {
      console.warn('[save-report] company brain update failed:', bsErr.message)
    }

    // Pattern tracking — best-effort, capped per report
    try {
      const patternRows = []
      const fixes = Array.isArray(r.non_ai_fixes) ? r.non_ai_fixes : []

      for (const f of fixes) {
        if (patternRows.length >= 5) break
        if (!f?.issue && !f?.fix) continue
        patternRows.push({
          industry:          industry ?? null,
          domain:            domain ?? null,
          conversation_mode: r.conversation_mode ?? null,
          root_causes:       f?.issue ? [f.issue] : [],
          actions_given:     f?.fix ? [f.fix] : [],
        })
      }

      if (patternRows.length === 0) {
        const priorityActions = Array.isArray(r.priority_actions) ? r.priority_actions.slice(0, 3) : []
        for (const action of priorityActions) {
          if (patternRows.length >= 5) break
          if (!action) continue
          patternRows.push({
            industry:          industry ?? null,
            domain:            domain ?? null,
            conversation_mode: r.conversation_mode ?? null,
            root_causes:       ['priority_action'],
            actions_given:     [action],
          })
        }
      }

      if (patternRows.length > 0) {
        await supabase.from('patterns').insert(patternRows)
      }
    } catch (patternErr) {
      console.warn('[save-report] pattern insert failed:', patternErr.message)
    }

    try {
      await synthesizeUserIntelligence(userId, { supabase })
    } catch (synthErr) {
      console.warn('[save-report] intelligence synthesis failed:', synthErr.message)
    }

    // Auto-email the report to the user — fire-and-forget, never blocks the response
    if (userEmail) {
      // Also persist notification_email so the weekly digest cron can use it
      supabase.from('profiles').update({ notification_email: userEmail }).eq('id', userId).catch(() => {})

      sendUserReportEmail({
        userEmail,
        userName:    userName || '',
        report:      r,
        resendApiKey: process.env.RESEND_API_KEY,
      }).catch(e => console.warn('[save-report] user email failed:', e.message))
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
