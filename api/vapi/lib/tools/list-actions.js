import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

const CONNECTOR_LABELS = {
  gmail:   'Gmail',
  slack:   'Slack',
  notion:  'Notion',
  hubspot: 'HubSpot',
}

function connectorLabel(connector) {
  return CONNECTOR_LABELS[connector] || connector || 'your tools'
}

// Returns a spoken list of pending actions.
// Includes the action_id in the response so Vapi's LLM can pass it to approve/dismiss.
export async function listPendingActions(userId) {
  const sb = getSupabase()

  const { data: actions, error } = await sb
    .from('pending_actions')
    .select('id, title, connector, action_type, staged_args')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  if (!actions?.length) {
    return "You have no pending actions right now. Everything is clear."
  }

  const lines = actions.map((a, i) => {
    const label = connectorLabel(a.connector)
    return `${i + 1}. ${a.title} — via ${label}. Action ID: ${a.id}.`
  })

  const intro = `You have ${actions.length} action${actions.length > 1 ? 's' : ''} waiting.`
  const outro = `Say "approve action" followed by the ID, or "approve number 1", "approve number 2", and so on.`

  return [intro, ...lines, outro].join(' ')
}
