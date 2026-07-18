import { getComposioConnectionMap, executeTool } from '../connectors/composio.js'
import { getMissingRequiredInputs } from './validate.js'

export function withoutInternalActionMetadata(args = {}) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {}
  const { __dispatch: _dispatchMetadata, ...toolArgs } = args
  return toolArgs
}

export async function executePendingAction({ userId, pendingAction, action, finalArgs = {} }) {
  const mergedArgs = {
    ...withoutInternalActionMetadata(pendingAction?.staged_args),
    ...withoutInternalActionMetadata(finalArgs),
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
