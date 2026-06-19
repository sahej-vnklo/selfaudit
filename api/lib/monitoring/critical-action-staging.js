import { getActionForArtifact } from '../actions/registry.js'
import { ARTIFACT_SYSTEM_PROMPT, ARTIFACT_TYPE_INSTRUCTIONS, ARTIFACT_JSON_SCHEMA } from '../artifacts/instructions.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

// ── Artifact type routing ─────────────────────────────────────────────────────

function pickArtifactType(alert) {
  const cat = String(alert?.category || '').toLowerCase()

  // Marketing/Sales + pipeline alerts → EMAIL: direct outreach is the most actionable first step
  if (cat.includes('marketing') || cat.includes('sales') || cat.includes('pipeline')) return 'EMAIL'

  // Customer-facing issues → TEAM_BRIEF: the team needs to know and coordinate
  if (cat.includes('customer')) return 'TEAM_BRIEF'

  // Finance, management, operations, revenue, everything else → ACTION_PLAN
  return 'ACTION_PLAN'
}

function buildApproveLabel(artifactType, alert) {
  const cat = String(alert?.category || '').toLowerCase()

  if (artifactType === 'EMAIL') {
    if (cat.includes('marketing') || cat.includes('sales')) return 'Draft outreach email'
    if (cat.includes('pipeline'))                           return 'Draft pipeline email'
    return 'Draft email'
  }

  if (artifactType === 'TEAM_BRIEF') {
    if (cat.includes('customer')) return 'Draft customer brief'
    return 'Draft team update'
  }

  // ACTION_PLAN
  if (cat.includes('finance'))    return 'Financial action plan'
  if (cat.includes('revenue'))    return 'Revenue recovery plan'
  if (cat.includes('management')) return 'Strategic action plan'
  if (cat.includes('operation') || cat.includes('production')) return 'Operations action plan'
  return 'Action plan'
}

// ── Prompt builder (shared instructions, alert-specific context) ──────────────

function buildAlertPrompt(artifactType, alert, intel) {
  const metricLine = alert.metric_key
    ? `Observed metric: ${alert.metric_key} = ${alert.metric_value ?? 'unknown'}`
    : ''

  const intelContext = intel ? `
BUSINESS CONTEXT (use to make content specific to this business):
Overall status: ${intel.summary || 'not available'}
Known recurring blockers: ${(intel.repeated_blockers || []).join(', ') || 'none identified'}
Current priorities: ${(intel.top_priorities || []).join(', ') || 'none identified'}
Active watchouts: ${(intel.watchouts || []).join(', ') || 'none'}` : ''

  return `Generate a ${artifactType} artifact from this business health alert.

ALERT:
Title: ${alert.title || 'Unknown risk'}
Area: ${alert.category || 'unknown'}
Severity: ${alert.severity || 'unknown'} (tier: ${alert.escalation_tier || 'unknown'})
Situation: ${alert.description || 'A risk was detected.'}
Root cause: ${alert.root_cause || 'not specified'}
Business impact: ${alert.impact || 'not specified'}
${metricLine}
Recommended action: ${alert.recommended_action || 'Review and respond.'}
${intelContext}

${ARTIFACT_TYPE_INSTRUCTIONS[artifactType]}
${ARTIFACT_JSON_SCHEMA(artifactType)}`
}

// ── Static fallbacks (used when Claude API is unavailable) ────────────────────

function buildFallbackArtifact(artifactType, alert) {
  const base = {
    title: `${alert?.title || 'Risk alert'} — response needed`,
    summary: alert?.description || 'A critical risk requires your attention.',
  }

  if (artifactType === 'EMAIL') {
    return {
      ...base,
      type: 'EMAIL',
      sections: [
        { label: 'Subject Line', content: `Following up: ${alert?.title || 'action required'}` },
        {
          label: 'Body',
          content: [
            `Hi [First Name],`,
            ``,
            `I wanted to reach out regarding ${alert?.description || 'a critical business issue we have identified'}.`,
            ``,
            `${alert?.recommended_action || 'We need to act on this urgently.'}`,
            ``,
            `Can we connect this week to align on next steps?`,
            ``,
            `Best,`,
          ].join('\n'),
        },
      ],
    }
  }

  if (artifactType === 'TEAM_BRIEF') {
    return {
      ...base,
      type: 'TEAM_BRIEF',
      sections: [
        { label: 'Situation', content: alert?.description || 'A risk was detected that needs team awareness.' },
        { label: 'Impact', content: alert?.impact || 'Unresolved, this compounds over time.' },
        { label: 'What We Need', content: alert?.recommended_action || 'Review and respond with your assessment.' },
        { label: 'Next Check-in', content: 'Update by end of this week.' },
      ],
    }
  }

  // ACTION_PLAN fallback
  return {
    ...base,
    type: 'ACTION_PLAN',
    sections: [
      { label: 'Situation', content: alert?.description || 'SelfAudit detected a critical business risk.' },
      { label: 'Recommended Action', content: alert?.recommended_action || 'Review the finding and document the next operating response.' },
      {
        label: 'Finding Snapshot',
        content: [
          `Area: ${alert?.category || 'unknown'}`,
          `Severity: ${alert?.severity || 'unknown'}`,
          alert?.metric_key ? `Metric: ${alert.metric_key}` : '',
          alert?.metric_value != null ? `Observed value: ${alert.metric_value}` : '',
        ].filter(Boolean).join('\n'),
      },
    ],
  }
}

// ── Claude generation ─────────────────────────────────────────────────────────

async function generateHealthCheckArtifact(supabase, userId, alert, artifactType) {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) return buildFallbackArtifact(artifactType, alert)

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
  } catch (_) {}

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
        system: ARTIFACT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildAlertPrompt(artifactType, alert, intel) }],
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
    console.warn('[critical-action-staging] Claude generation failed, using static fallback:', err.message)
    return buildFallbackArtifact(artifactType, alert)
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function stageCriticalAction(supabase, userId, alert) {
  try {
    if (!supabase || !userId || !alert?.id) return null
    if (alert.execution_staged) return null

    const ACTIONABLE = new Set(['critical', 'alert', 'escalate'])
    if (!ACTIONABLE.has(String(alert.escalation_tier || '').toLowerCase())) return null

    const artifactType = pickArtifactType(alert)
    const action = getActionForArtifact(artifactType)
    if (!action) return null

    const artifact = await generateHealthCheckArtifact(supabase, userId, alert, artifactType)
    const stagedArgs = action.buildArgs(artifact, {})

    const { data, error } = await supabase
      .from('pending_actions')
      .insert({
        user_id:                userId,
        artifact_id:            null,
        action_type:            artifactType,
        tool_slug:              action.tool,
        connector:              action.connector,
        title:                  artifact.title || `${artifactType}: ${alert.title}`,
        staged_args:            stagedArgs,
        finding_snapshot: {
          areaId:      alert.category,
          title:       alert.title,
          severity:    alert.severity,
          status:      alert.finding_status,
          metricKey:   alert.metric_key,
          metricValue: alert.metric_value,
        },
        source_health_check_id: alert.health_check_id ?? null,
        status:                 'pending',
        updated_at:             new Date().toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.warn('[critical-action-staging]', error.message)
      return null
    }

    const { data: alertRow } = await supabase
      .from('risk_alerts')
      .select('evidence')
      .eq('id', alert.id)
      .single()

    const mergedEvidence = {
      ...(alertRow?.evidence ?? {}),
      pending_action_id:    data.id,
      pending_action_label: buildApproveLabel(artifactType, alert),
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
