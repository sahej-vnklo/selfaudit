import { getActionForArtifact } from '../actions/registry.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const HEALTH_CHECK_SYSTEM_PROMPT = `You are SelfAudit's execution engine. Your job is to generate a single, specific, ready-to-use Action Plan from a daily business health check alert.

RULES:
1. The plan must be generated FROM the alert findings — not generic
2. Reference the specific risk, root cause, and metric in the alert
3. Every action must be immediately usable — no placeholders like [INSERT NAME]
4. Use the business context provided throughout
5. Artifacts must be copy-paste ready — the operator should be able to use this today

QUALITY TEST:
- Is this specific to their situation? No generic templates.
- Can they act on it today without editing?
- Does it reference actual findings from the alert? Must be grounded.

SAFETY:
- Only use information from the alert and business context provided
- Do not invent numbers or structures not in the alert
- If a specific detail is missing, use a reasonable contextual default in brackets — only when genuinely needed

Return VALID JSON ONLY. No markdown, no backticks, no preamble.`

function buildHealthCheckPrompt(alert, intel) {
  const businessContext = intel ? `
BUSINESS CONTEXT (from memory — use to make the plan specific to this business):
Overall status: ${intel.summary || 'not available'}
Known recurring blockers: ${(intel.repeated_blockers || []).join(', ') || 'none identified'}
Current priorities: ${(intel.top_priorities || []).join(', ') || 'none identified'}
Active watchouts: ${(intel.watchouts || []).join(', ') || 'none'}
` : ''

  const metricLine = alert.metric_key
    ? `Observed metric: ${alert.metric_key} = ${alert.metric_value ?? 'unknown'}`
    : ''

  return `Generate a prioritized ACTION_PLAN for this business health alert detected at 8 AM.

ALERT:
Title: ${alert.title || 'Unknown risk'}
Area: ${alert.category || 'unknown'}
Severity: ${alert.severity || 'unknown'} (tier: ${alert.escalation_tier || 'unknown'})
Situation: ${alert.description || 'A risk was detected.'}
Root cause: ${alert.root_cause || 'not specified'}
Business impact: ${alert.impact || 'not specified'}
${metricLine}
Recommended action: ${alert.recommended_action || 'Review and respond.'}
${businessContext}
Generate a prioritized Action Plan with these EXACT section labels:
- Goal: The specific outcome this plan achieves — state it clearly with a measurable target grounded in this alert
- Timeline: Total timeframe with honest rationale for why it takes that long
- Week 1: Exact actions for the first 7 days — specific, assignable tasks tied to this alert
- Month 1: Key milestones to hit by end of month 1 — measurable checkpoints
- Month 3: Where the business gets to by the 90-day mark if this plan executes
- Blockers: The top 2-3 things that could derail this plan and how to handle each one

Return a single JSON object with this exact structure:
{
  "type": "ACTION_PLAN",
  "title": "Specific descriptive title based on their actual alert — not generic",
  "summary": "One sentence: what this plan does and why it matters for their specific situation",
  "sections": [
    { "label": "Goal", "content": "..." },
    { "label": "Timeline", "content": "..." },
    { "label": "Week 1", "content": "..." },
    { "label": "Month 1", "content": "..." },
    { "label": "Month 3", "content": "..." },
    { "label": "Blockers", "content": "..." }
  ]
}`
}

function buildCriticalActionArtifact(alert) {
  return {
    title: `Critical response: ${alert?.title || 'Risk alert'}`,
    summary: alert?.description || 'A critical risk requires your attention.',
    sections: [
      {
        label: 'Situation',
        content: alert?.description || 'SelfAudit detected a critical business risk that needs review.',
      },
      {
        label: 'Recommended Action',
        content: alert?.recommended_action || 'Review the finding, confirm the root cause, and document the next operating response.',
      },
      {
        label: 'Finding Snapshot',
        content: [
          `Area: ${alert?.category || 'unknown'}`,
          `Severity: ${alert?.severity || 'unknown'}`,
          `Status: ${alert?.finding_status || 'unknown'}`,
          alert?.metric_key ? `Metric: ${alert.metric_key}` : '',
          alert?.metric_value != null ? `Observed value: ${alert.metric_value}` : '',
        ].filter(Boolean).join('\n'),
      },
    ],
  }
}

async function generateHealthCheckArtifact(supabase, userId, alert) {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) return buildCriticalActionArtifact(alert)

  // Fetch latest intelligence profile for business context
  let intel = null
  try {
    const { data } = await supabase
      .from('intelligence_profiles')
      .select('summary, repeated_blockers, top_priorities, watchouts')
      .eq('user_id', userId)
      .order('last_synthesized_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    intel = data
  } catch (_) {
    // continue without brain context
  }

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: HEALTH_CHECK_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildHealthCheckPrompt(alert, intel) }],
      }),
    })

    if (!response.ok) throw new Error(`Claude API ${response.status}`)

    const data = await response.json()
    const text = data.content[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const artifact = JSON.parse(clean)

    if (!Array.isArray(artifact?.sections) || artifact.sections.length === 0) {
      throw new Error('Claude returned empty sections')
    }

    return artifact
  } catch (err) {
    console.warn('[critical-action-staging] Claude artifact generation failed, using static fallback:', err.message)
    return buildCriticalActionArtifact(alert)
  }
}

export async function stageCriticalAction(supabase, userId, alert) {
  try {
    if (!supabase || !userId || !alert?.id) return null
    if (alert.execution_staged) return null
    const ACTIONABLE = new Set(['critical', 'alert', 'escalate'])
    if (!ACTIONABLE.has(String(alert.escalation_tier || '').toLowerCase())) return null

    const action = getActionForArtifact('ACTION_PLAN')
    if (!action) return null

    // Generate a real Claude artifact instead of the static placeholder
    const artifact = await generateHealthCheckArtifact(supabase, userId, alert)
    const stagedArgs = action.buildArgs(artifact, {})

    const { data, error } = await supabase
      .from('pending_actions')
      .insert({
        user_id: userId,
        artifact_id: null,
        action_type: 'ACTION_PLAN',
        tool_slug: action.tool,
        connector: action.connector,
        title: artifact.title || `Action Plan: ${alert.title}`,
        staged_args: stagedArgs,
        finding_snapshot: {
          areaId: alert.category,
          title: alert.title,
          severity: alert.severity,
          status: alert.finding_status,
          metricKey: alert.metric_key,
          metricValue: alert.metric_value,
        },
        source_health_check_id: alert.health_check_id ?? null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.warn('[critical-action-staging]', error.message)
      return null
    }

    // Fetch current evidence so we can merge without overwriting rootCause/impact
    const { data: alertRow } = await supabase
      .from('risk_alerts')
      .select('evidence')
      .eq('id', alert.id)
      .single()

    const ACTION_TYPE_LABELS = { ACTION_PLAN: 'Action Plan', EMAIL: 'Email Draft', TEAM_BRIEF: 'Team Brief' }
    const mergedEvidence = {
      ...(alertRow?.evidence ?? {}),
      pending_action_id:    data.id,
      pending_action_label: ACTION_TYPE_LABELS[data.action_type] ?? 'Action Plan',
    }

    await supabase
      .from('risk_alerts')
      .update({ execution_staged: true, evidence: mergedEvidence })
      .eq('id', alert.id)
      .eq('user_id', userId)

    return data
  } catch (error) {
    console.warn('[critical-action-staging]', error?.message || error)
    return null
  }
}
