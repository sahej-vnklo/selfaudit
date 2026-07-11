import { getCompanyBrain } from '../../../lib/intelligence/company-brain.js'
import { getAvailableDataSources, planWithClaude } from '../../../lib/agent/planner.js'
import { gatherAgentContext } from '../../../lib/agent/gather-context.js'
import { generateAgentAnswer } from '../../../lib/agent/generate-agent-answer.js'
import { getComposioConnectionMap } from '../../../lib/connectors/composio.js'

// Bridge to the existing SelfAudit agent brain.
// Routes a spoken question through the same planner → gather → answer pipeline
// used by the dashboard chat, then returns a spoken-friendly version of the answer.
export async function askQuestion(userId, question) {
  if (!question?.trim()) {
    return "I didn't catch the question. Could you repeat that?"
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')

  const [brain, connectionMap] = await Promise.allSettled([
    getCompanyBrain(userId),
    getComposioConnectionMap(userId),
  ])

  const brainData      = brain.status      === 'fulfilled' ? brain.value      : null
  const connectionData = connectionMap.status === 'fulfilled' ? connectionMap.value : {}

  const availableSources = getAvailableDataSources(brainData, connectionData)

  const plan = await planWithClaude(question, brainData, availableSources, [], apiKey)
  const context = await gatherAgentContext(userId, {
    ...plan,
    available_sources: plan.sources_to_fetch,
    missing_sources: [],
  })

  const result = await generateAgentAnswer({
    query: question,
    plan,
    context,
    conversationHistory: [],
  })

  // Convert structured JSON answer into speakable text
  const parts = []

  if (result.answer) {
    parts.push(result.answer)
  }

  if (result.root_cause && result.confidence !== 'low') {
    parts.push(`Root cause: ${result.root_cause}`)
  }

  if (result.execution_plan?.length) {
    const steps = result.execution_plan.slice(0, 3)
    parts.push(`What to do: ${steps.join('. ')}.`)
  }

  if (result.follow_up_question) {
    parts.push(result.follow_up_question)
  }

  return parts.join(' ') || "I don't have enough data to answer that confidently right now."
}
