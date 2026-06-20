import { createClient } from '@supabase/supabase-js'
import { getActionForArtifact } from '../../../lib/actions/registry.js'
import { executePendingAction } from '../../../lib/actions/execute-action.js'
import { createDecisionRecord } from '../../../lib/decisions/service.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Approve or dismiss a pending action by voice.
// Uses service role — identity already verified via phone number.
export async function executeVoiceAction(userId, actionId, decision) {
  if (!actionId) return "I need the action ID to proceed. Say 'list my actions' to hear them again."
  if (!['approve', 'dismiss'].includes(decision)) return "Please say approve or dismiss."

  const sb = getSupabase()

  const { data: pendingAction, error } = await sb
    .from('pending_actions')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (error || !pendingAction) {
    return "I couldn't find that action. It may have already been handled. Say 'list my actions' to see what's still waiting."
  }

  const now = new Date().toISOString()

  if (decision === 'dismiss') {
    await sb.from('pending_actions').update({ status: 'dismissed', updated_at: now }).eq('id', actionId)
    const { data: logRow } = await sb.from('execution_log').insert({
      user_id: userId,
      pending_action_id: actionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: {},
      outcome: 'dismissed',
      executed_at: now,
    }).select('*').single()

    if (logRow) {
      createDecisionRecord(sb, userId, { pendingAction, executionLogRow: logRow }).catch(() => {})
    }

    return `Dismissed. "${pendingAction.title}" has been removed from your queue.`
  }

  // Approve
  const action = getActionForArtifact(pendingAction.action_type)
  if (!action) {
    return "I couldn't process that action type. Please handle it from your dashboard."
  }

  await sb.from('pending_actions').update({ status: 'executing', updated_at: now }).eq('id', actionId)

  try {
    const { composioResult, mergedArgs } = await executePendingAction({
      userId,
      pendingAction,
      action,
      finalArgs: {},
    })

    const completeTime = new Date().toISOString()
    await sb.from('pending_actions').update({ status: 'executed', updated_at: completeTime }).eq('id', actionId)

    const { data: logRow } = await sb.from('execution_log').insert({
      user_id: userId,
      pending_action_id: actionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: mergedArgs,
      outcome: 'success',
      composio_result: composioResult || null,
      executed_at: completeTime,
    }).select('*').single()

    if (logRow) {
      createDecisionRecord(sb, userId, { pendingAction, executionLogRow: logRow }).catch(() => {})
    }

    return `Done. "${pendingAction.title}" has been executed successfully.`
  } catch (err) {
    await sb.from('pending_actions').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', actionId)

    if (err?.code === 'CONNECTOR_NOT_CONNECTED') {
      return `I couldn't execute that action because the connector isn't linked. Please connect it from your dashboard first.`
    }
    if (err?.code === 'MISSING_INPUTS') {
      return `That action needs additional details that I can't collect by voice. Please handle it from your dashboard.`
    }

    return `Something went wrong executing "${pendingAction.title}". Please try from your dashboard.`
  }
}
