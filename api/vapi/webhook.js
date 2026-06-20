// Vapi voice webhook — handles all inbound Vapi events.
// Called by Vapi for every function-call during a phone conversation.
// Identity is established via the caller's phone number (registered in Account settings).

import { identifyCaller } from './lib/identify-caller.js'
import { getBusinessOverview } from './lib/tools/get-overview.js'
import { listPendingActions } from './lib/tools/list-actions.js'
import { executeVoiceAction } from './lib/tools/execute-action.js'
import { askQuestion } from './lib/tools/ask-question.js'

function validateSecret(req) {
  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (!secret) return true
  return req.headers['x-vapi-secret'] === secret
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!validateSecret(req)) {
    console.warn('[vapi/webhook] rejected: invalid secret')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const message = req.body?.message
  if (!message) return res.status(400).json({ error: 'Missing message' })

  // Vapi sends many event types — we only handle function-call
  if (message.type !== 'function-call') {
    return res.status(200).json({})
  }

  const phoneNumber = message.call?.customer?.number
  const caller = await identifyCaller(phoneNumber).catch(() => null)

  if (!caller) {
    return res.status(200).json({
      result: "I don't recognise this phone number. To use SelfAudit by voice, go to your account settings and add this number under Phone Number. Then call back and I'll know it's you.",
    })
  }

  const userId = caller.id
  const toolName = message.functionCall?.name
  const params = message.functionCall?.parameters ?? {}

  console.log(`[vapi/webhook] user=${userId} tool=${toolName}`)

  try {
    let result

    switch (toolName) {
      case 'get_business_overview':
        result = await getBusinessOverview(userId)
        break

      case 'list_pending_actions':
        result = await listPendingActions(userId)
        break

      case 'approve_action':
        result = await executeVoiceAction(userId, params.action_id, 'approve')
        break

      case 'dismiss_action':
        result = await executeVoiceAction(userId, params.action_id, 'dismiss')
        break

      case 'ask_question':
        result = await askQuestion(userId, params.question)
        break

      default:
        result = "I didn't understand that request. You can ask for a business overview, list your pending actions, or ask me a specific question about your business."
    }

    return res.status(200).json({ result })
  } catch (err) {
    console.error(`[vapi/webhook] error tool=${toolName} user=${userId}:`, err.message)
    return res.status(200).json({
      result: "Something went wrong on my end. Please try again in a moment, or check your dashboard.",
    })
  }
}
