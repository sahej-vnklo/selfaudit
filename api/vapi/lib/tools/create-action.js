import { createClient } from '@supabase/supabase-js'
import { ACTION_REGISTRY } from '../../../lib/actions/registry.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Creates a new pending action from a voice conversation.
// Nico gathers the required details from the user, then calls this.
// Returns a spoken string containing the action_id so Nico can pass it to approve_action.
export async function createVoiceAction(userId, actionType, title, stagedArgs) {
  if (!actionType || !title) {
    return "I need to know the action type and a title. What kind of action — email, Slack message, or Notion page?"
  }

  const registryEntry = ACTION_REGISTRY[actionType]
  if (!registryEntry) {
    return `I don't know how to create a ${actionType} action. I can create emails, Slack messages, or Notion pages.`
  }

  const sb = getSupabase()

  const { data, error } = await sb
    .from('pending_actions')
    .insert({
      user_id: userId,
      action_type: actionType,
      tool_slug: registryEntry.tool,
      connector: registryEntry.connector,
      title,
      staged_args: stagedArgs || {},
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[create-action] insert error:', error.message)
    return "Something went wrong creating that action. Please try again."
  }

  return `Done. I've created "${title}". The action ID is ${data.id}. Want me to execute it now?`
}
