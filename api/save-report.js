import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, sessionId, report: r, industry, domain } = req.body
  if (!userId || !r) {
    return res.status(400).json({ error: 'Missing userId or report' })
  }

  try {
    await supabase.from('reports').insert({
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

    if (sessionId) {
      await supabase
        .from('audit_sessions')
        .update({ conversation_mode: r.conversation_mode ?? null })
        .eq('session_id', sessionId)
    }

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

    // Pattern tracking — anonymous aggregate, best-effort
    try {
      await supabase.from('patterns').insert({
        industry:          industry ?? null,
        domain:            domain ?? null,
        conversation_mode: r.conversation_mode ?? null,
        root_causes:       (r.non_ai_fixes ?? []).slice(0, 3).map(f => f.issue).filter(Boolean),
        actions_given:     (r.priority_actions ?? []).slice(0, 3).filter(Boolean),
      })
    } catch (patternErr) {
      console.warn('[save-report] pattern insert failed:', patternErr.message)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
