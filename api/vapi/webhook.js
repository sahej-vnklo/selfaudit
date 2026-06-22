// Vapi voice webhook — handles all inbound Vapi events.
// Identity is established via the caller's phone number (registered in Account settings).
//
// Vapi sends two tool-call formats depending on model/version:
//   - type: 'tool-calls'    → toolCallList array, response: { results: [{ toolCallId, result }] }
//   - type: 'function-call' → functionCall object,  response: { result }
// We handle both.

import { identifyCaller } from './lib/identify-caller.js'
import { getBusinessOverview } from './lib/tools/get-overview.js'
import { listPendingActions } from './lib/tools/list-actions.js'
import { executeVoiceAction } from './lib/tools/execute-action.js'
import { askQuestion } from './lib/tools/ask-question.js'
import { createVoiceAction } from './lib/tools/create-action.js'
import { handleEndOfCall } from './lib/handle-end-of-call.js'

function validateSecret(req) {
  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (!secret) return true
  return req.headers['x-vapi-secret'] === secret
}

async function runTool(toolName, params, userId) {
  switch (toolName) {
    case 'get_business_overview':
      return getBusinessOverview(userId)

    case 'list_pending_actions':
      return listPendingActions(userId)

    case 'approve_action':
      return executeVoiceAction(userId, params.action_id, 'approve')

    case 'dismiss_action':
      return executeVoiceAction(userId, params.action_id, 'dismiss')

    case 'ask_question':
      return askQuestion(userId, params.question)

    case 'create_action':
      return createVoiceAction(userId, params.action_type, params.title, params.staged_args ?? {})

    default:
      return "I didn't understand that request. You can ask for a business overview, list your pending actions, or ask me a specific question about your business."
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!validateSecret(req)) {
    console.warn('[vapi/webhook] rejected: invalid secret')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const message = req.body?.message
  if (!message) return res.status(400).json({ error: 'Missing message' })

  const type = message.type

  // ── New Vapi format: tool-calls (array) ──────────────────────────────────────
  if (type === 'tool-calls') {
    const phoneNumber = message.call?.customer?.number
    const caller = await identifyCaller(phoneNumber).catch(() => null)

    const unknownResponse = [{
      toolCallId: message.toolCallList?.[0]?.id ?? 'unknown',
      result: "This is a private line. If you believe you should have access, reach out to the account holder directly.",
    }]

    if (!caller) return res.status(200).json({ results: unknownResponse })

    const userId = caller.id
    const calls = message.toolCallList ?? []

    const results = await Promise.all(calls.map(async (call) => {
      const toolName = call.function?.name
      const params = (() => {
        try { return JSON.parse(call.function?.arguments ?? '{}') } catch { return {} }
      })()

      console.log(`[vapi/webhook] tool-calls user=${userId} tool=${toolName}`)

      try {
        const result = await runTool(toolName, params, userId)
        return { toolCallId: call.id, result }
      } catch (err) {
        console.error(`[vapi/webhook] error tool=${toolName} user=${userId}:`, err.message)
        return { toolCallId: call.id, result: "Something went wrong. Please try again or check your dashboard." }
      }
    }))

    return res.status(200).json({ results })
  }

  // ── Legacy Vapi format: function-call (single) ────────────────────────────────
  if (type === 'function-call') {
    const phoneNumber = message.call?.customer?.number
    const caller = await identifyCaller(phoneNumber).catch(() => null)

    if (!caller) {
      return res.status(200).json({
        result: "This is a private line. If you believe you should have access, reach out to the account holder directly.",
      })
    }

    const userId = caller.id
    const toolName = message.functionCall?.name
    const params = message.functionCall?.parameters ?? {}

    console.log(`[vapi/webhook] function-call user=${userId} tool=${toolName}`)

    try {
      const result = await runTool(toolName, params, userId)
      return res.status(200).json({ result })
    } catch (err) {
      console.error(`[vapi/webhook] error tool=${toolName} user=${userId}:`, err.message)
      return res.status(200).json({ result: "Something went wrong. Please try again or check your dashboard." })
    }
  }

  // End of call — save summary to dashboard + brain (fire and forget)
  if (type === 'end-of-call-report') {
    handleEndOfCall(message).catch(() => {})
    return res.status(200).json({})
  }

  // All other event types (status-update, etc.) — ignore
  return res.status(200).json({})
}
