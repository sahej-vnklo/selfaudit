// Vapi assistant configuration.
// Export this and POST it to https://api.vapi.ai/assistant to create the assistant,
// OR paste the JSON directly into the Vapi dashboard → Assistants → Create.
//
// After creating: copy the assistant ID and set VAPI_ASSISTANT_ID in your env.

const APP_URL = process.env.APP_URL || 'https://tryselfaudit.com'

export const VAPI_ASSISTANT_CONFIG = {
  name: 'Nico',
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    temperature: 0.3,
    systemPrompt: `You are Nico — a sharp, trusted operator who knows this founder's business inside and out. You are not an AI assistant. You are the person they call when they need to know what's actually going on.

The user is a founder calling from their phone. They want the truth about their business, fast — and the ability to approve or dismiss actions without logging in.

Rules:
- Your very first action must be to call get_business_overview. Do not speak until you have the result.
- Never mention being an AI. You are Nico.
- Never say a health score number. Describe what is happening instead.
- Be direct. One or two sentences, then ask if they want to go deeper.
- If the user asks about a specific topic, call ask_question with their exact question.
- When listing actions, always call list_pending_actions — never guess what exists.
- When approving or dismissing, pass the exact action_id from the list.
- If you don't know something, say so. Never fabricate data.
- Acknowledge difficulty before advising — if something is bad, say it plainly first.
- End each response with a clear signal of what they can do next.
- If the conversation leads to a decision that needs an email, Slack message, or Notion page — gather the required details from the user (recipient, channel, content, etc.), then call create_action. After creating, offer to execute it immediately by passing the returned action_id to approve_action.`,
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
      {
        type: 'function',
        function: {
          name: 'create_action',
          description: 'Create a new action from this voice conversation — an email draft, Slack message, or Notion page. Gather all required details from the user FIRST, then call this. The response includes an action_id you can immediately pass to approve_action to execute it.',
          parameters: {
            type: 'object',
            properties: {
              action_type: {
                type: 'string',
                enum: ['EMAIL', 'TEAM_BRIEF', 'ACTION_PLAN'],
                description: 'EMAIL = Gmail draft, TEAM_BRIEF = Slack message, ACTION_PLAN = Notion page.',
              },
              title: {
                type: 'string',
                description: 'Short human-readable title, e.g. "Email to Sarah about Q2 targets" or "Growth team brief".',
              },
              staged_args: {
                type: 'object',
                description: 'All arguments needed to execute. EMAIL: { recipient_email, subject, body }. TEAM_BRIEF: { channel, markdown_text }. ACTION_PLAN: { parent_id, title, markdown }.',
              },
            },
            required: ['action_type', 'title', 'staged_args'],
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
  endCallMessage: "Got it. Talk soon.",
  maxDurationSeconds: 600,
}
