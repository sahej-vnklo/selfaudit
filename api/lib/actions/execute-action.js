import { getComposioConnectionMap, executeTool } from '../connectors/composio.js'
import { getMissingRequiredInputs } from './validate.js'

export async function executePendingAction({ userId, pendingAction, action, finalArgs = {} }) {
  const mergedArgs = {
    ...(pendingAction?.staged_args && typeof pendingAction.staged_args === 'object' ? pendingAction.staged_args : {}),
    ...(finalArgs && typeof finalArgs === 'object' ? finalArgs : {}),
  }

  const missingInputs = getMissingRequiredInputs(action, mergedArgs)
  if (missingInputs.length > 0) {
    const error = new Error(`Missing required inputs: ${missingInputs.map((field) => field.label).join(', ')}`)
    error.code = 'MISSING_INPUTS'
    error.missingInputs = missingInputs
    throw error
  }

  const connectionMap = await getComposioConnectionMap(userId)
  const activeConnection = connectionMap?.[action.connector]
  if (!activeConnection?.connected) {
    const error = new Error(`${action.connector} is not connected`)
    error.code = 'CONNECTOR_NOT_CONNECTED'
    throw error
  }

  const composioResult = await executeTool(userId, action.tool, mergedArgs)

  return {
    composioResult,
    mergedArgs,
  }
}
