import { getActionForArtifact } from '../actions/registry.js'

function buildCriticalActionArtifact(alert) {
  return {
    title: `Critical response: ${alert?.title || 'Risk alert'}`,
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

export async function stageCriticalAction(supabase, userId, alert) {
  try {
    if (!supabase || !userId || !alert?.id) return null
    if (alert.execution_staged) return null
    const ACTIONABLE = new Set(['critical', 'alert', 'escalate'])
    if (!ACTIONABLE.has(String(alert.escalation_tier || '').toLowerCase())) return null

    const action = getActionForArtifact('ACTION_PLAN')
    if (!action) return null

    const artifact = buildCriticalActionArtifact(alert)
    const stagedArgs = action.buildArgs(artifact, {})

    const { data, error } = await supabase
      .from('pending_actions')
      .insert({
        user_id: userId,
        artifact_id: null,
        action_type: 'ACTION_PLAN',
        tool_slug: action.tool,
        connector: action.connector,
        title: `Critical: ${alert.title}`,
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
