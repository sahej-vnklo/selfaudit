import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from '../lib/auth.js'
import { getActionForArtifact } from '../lib/actions/registry.js'
import { executePendingAction } from '../lib/actions/execute-action.js'
import { createDecisionRecord } from '../lib/decisions/service.js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, pendingActionId, decision, finalArgs } = req.body || {}
  if (!userId || !pendingActionId || !decision) {
    return res.status(400).json({ error: 'userId, pendingActionId, and decision are required' })
  }
  if (!['approve', 'dismiss'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approve or dismiss' })
  }
  if (!await validateUserToken(req, res, userId)) return

  const { data: pendingAction, error: loadError } = await supabase
    .from('pending_actions')
    .select('*')
    .eq('id', pendingActionId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single()

  if (loadError || !pendingAction) {
    return res.status(404).json({ error: 'Pending action not found or already resolved' })
  }

  if (decision === 'dismiss') {
    const now = new Date().toISOString()
    await supabase
      .from('pending_actions')
      .update({ status: 'dismissed', updated_at: now })
      .eq('id', pendingActionId)

    const { data: executionLogRow, error: executionLogError } = await supabase.from('execution_log').insert({
      user_id: userId,
      pending_action_id: pendingActionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: {},
      outcome: 'dismissed',
      executed_at: now,
    }).select('*').single()

    if (executionLogError) {
      return res.status(500).json({ error: executionLogError.message })
    }

    createDecisionRecord(supabase, userId, { pendingAction, executionLogRow }).catch((err) => {
      console.warn('[decisions]', err?.message || err)
    })

    return res.status(200).json({ outcome: 'dismissed' })
  }

  const action = getActionForArtifact(pendingAction.action_type)
  if (!action) {
    return res.status(500).json({ error: 'Action type not found in registry' })
  }

  const startTime = new Date().toISOString()
  await supabase
    .from('pending_actions')
    .update({ status: 'executing', updated_at: startTime })
    .eq('id', pendingActionId)

  try {
    const { composioResult, mergedArgs } = await executePendingAction({
      userId,
      pendingAction,
      action,
      finalArgs,
    })

    const completeTime = new Date().toISOString()
    await supabase
      .from('pending_actions')
      .update({ status: 'executed', updated_at: completeTime })
      .eq('id', pendingActionId)

    const { data: executionLogRow, error: executionLogError } = await supabase.from('execution_log').insert({
      user_id: userId,
      pending_action_id: pendingActionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: mergedArgs,
      outcome: 'success',
      composio_result: composioResult || null,
      executed_at: completeTime,
    }).select('*').single()

    if (executionLogError) {
      return res.status(500).json({ error: executionLogError.message })
    }

    createDecisionRecord(supabase, userId, { pendingAction, executionLogRow }).catch((err) => {
      console.warn('[decisions]', err?.message || err)
    })

    return res.status(200).json({ outcome: 'success', result: composioResult })
  } catch (error) {
    const failedTime = new Date().toISOString()
    await supabase
      .from('pending_actions')
      .update({
        status: 'failed',
        updated_at: failedTime,
      })
      .eq('id', pendingActionId)

    const { data: executionLogRow, error: executionLogError } = await supabase.from('execution_log').insert({
      user_id: userId,
      pending_action_id: pendingActionId,
      action_type: pendingAction.action_type,
      tool_slug: pendingAction.tool_slug,
      connector: pendingAction.connector,
      final_args: {
        ...(pendingAction?.staged_args && typeof pendingAction.staged_args === 'object' ? pendingAction.staged_args : {}),
        ...(finalArgs && typeof finalArgs === 'object' ? finalArgs : {}),
      },
      outcome: 'failed',
      composio_result: null,
      error_message: error?.message || 'Execution failed',
      executed_at: failedTime,
    }).select('*').single()

    if (!executionLogError && executionLogRow) {
      createDecisionRecord(supabase, userId, { pendingAction, executionLogRow }).catch((err) => {
        console.warn('[decisions]', err?.message || err)
      })
    }

    const payload = {
      error: error?.message || 'Execution failed',
      outcome: 'failed',
    }
    if (error?.missingInputs) payload.missingInputs = error.missingInputs
    return res.status(error?.code === 'MISSING_INPUTS' || error?.code === 'CONNECTOR_NOT_CONNECTED' ? 400 : 500).json(payload)
  }
}
