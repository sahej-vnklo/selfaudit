// Vapi assistant configuration.
// Export this and POST it to https://api.vapi.ai/assistant to create the assistant,
// OR paste the JSON directly into the Vapi dashboard → Assistants → Create.
//
// After creating: copy the assistant ID and set VAPI_ASSISTANT_ID in your env.

const APP_URL = process.env.APP_URL || 'https://tryselfaudit.com'

export const VAPI_ASSISTANT_CONFIG = {
  name: 'SelfAudit Voice',
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    temperature: 0.3,
    systemPrompt: `You are SelfAudit — an AI business advisor that knows the user's business inside and out.

The user is a founder or operator calling from their phone. They want quick, honest updates about their business and the ability to approve or dismiss pending actions.

Rules:
- Never say a health score number. Describe what is happening instead.
- Be direct and concise. This is a phone call, not a report.
- When the user calls, immediately call get_business_overview so you have fresh context before saying anything.
- If the user asks about a specific topic (churn, sales, team, etc.), call ask_question with their exact question.
- When listing actions, always call list_pending_actions — never guess what actions exist.
- When approving or dismissing, pass the exact action_id from the list.
- If you don't know something, say so clearly. Don't fabricate data.
- Keep responses under 4 sentences unless the user asks for more detail.
- End each response with a clear prompt so the user knows what they can do next.`,
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_business_overview',
          description: 'Get the current state of the user\'s business — key risks, alerts, and pending actions. Call this at the start of every conversation.',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        server: { url: `${APP_URL}/api/vapi/webhook` },
      },
      {
        type: 'function',
        function: {
          name: 'list_pending_actions',
          description: 'List all pending actions waiting for the user\'s approval — emails, Slack messages, briefs, etc.',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        server: { url: `${APP_URL}/api/vapi/webhook` },
      },
      {
        type: 'function',
        function: {
          name: 'approve_action',
          description: 'Approve and execute a pending action.',
          parameters: {
            type: 'object',
            properties: {
              action_id: {
                type: 'string',
                description: 'The UUID of the pending action to approve. Get this from list_pending_actions.',
              },
            },
            required: ['action_id'],
          },
        },
        server: { url: `${APP_URL}/api/vapi/webhook` },
      },
      {
        type: 'function',
        function: {
          name: 'dismiss_action',
          description: 'Dismiss and discard a pending action without executing it.',
          parameters: {
            type: 'object',
            properties: {
              action_id: {
                type: 'string',
                description: 'The UUID of the pending action to dismiss. Get this from list_pending_actions.',
              },
            },
            required: ['action_id'],
          },
        },
        server: { url: `${APP_URL}/api/vapi/webhook` },
      },
      {
        type: 'function',
        function: {
          name: 'ask_question',
          description: 'Ask a specific business question — about churn, revenue, team, customers, strategy, or anything else. Routes through the full SelfAudit intelligence engine.',
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The exact question the user asked, in their own words.',
              },
            },
            required: ['question'],
          },
        },
        server: { url: `${APP_URL}/api/vapi/webhook` },
      },
    ],
  },
  voice: {
    provider: 'openai',
    voiceId: 'onyx',
  },
  firstMessage: "Hey, this is SelfAudit. Let me pull up your business.",
  endCallMessage: "Got it. Talk soon.",
  maxDurationSeconds: 600,
}
