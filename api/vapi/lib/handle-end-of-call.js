import { createClient } from '@supabase/supabase-js'
import { identifyCaller } from './identify-caller.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Build a plain transcript string from Vapi message array
function buildTranscript(messages = []) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'bot')
    .map((m) => `${m.role === 'bot' ? 'SelfAudit' : 'User'}: ${m.message || ''}`)
    .filter((line) => line.split(': ')[1]?.trim())
    .join('\n')
}

// Use Claude to extract a structured summary from the transcript
async function summariseCall(transcript, vapiSummary) {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
  if (!apiKey || !transcript) return null

  const prompt = `You are summarising a voice call between a founder and Nico, their business operator.

TRANSCRIPT:
${transcript}

${vapiSummary ? `VAPI AUTO-SUMMARY: ${vapiSummary}` : ''}

Extract and return ONLY valid JSON in this exact shape:
{
  "headline": "One sentence: what this call was fundamentally about.",
  "topics": ["topic 1", "topic 2"],
  "decisions": ["Any decision made or conclusion reached — omit if none"],
  "core_problem": "The main business problem or question discussed, or null",
  "priority_actions": ["Action item or follow-up mentioned — omit if none"],
  "actions_approved": 0,
  "actions_dismissed": 0,
  "summary": "2-3 sentence plain English summary of what was discussed and resolved."
}`

  const response = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const raw = data.content?.[0]?.text ?? ''
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

// Count approved/dismissed actions from tool calls in the message list
function countActions(messages = []) {
  let approved = 0
  let dismissed = 0
  for (const m of messages) {
    if (m.role === 'tool_calls') {
      for (const tc of (m.toolCalls || [])) {
        if (tc.function?.name === 'approve_action') approved++
        if (tc.function?.name === 'dismiss_action') dismissed++
      }
    }
  }
  return { approved, dismissed }
}

export async function handleEndOfCall(message) {
  try {
    const call = message.call ?? {}
    const phoneNumber = call.customer?.number
    const caller = await identifyCaller(phoneNumber).catch(() => null)
    if (!caller) return // unregistered number — nothing to save

    const userId = caller.id
    const sb = getSupabase()

    const startedAt = call.startedAt ?? null
    const endedAt = call.endedAt ?? null
    const durationSeconds = startedAt && endedAt
      ? Math.round((new Date(endedAt) - new Date(startedAt)) / 1000)
      : null

    const messages = message.messages ?? []
    const transcript = buildTranscript(messages)
    const { approved, dismissed } = countActions(messages)

    // Skip saving if the call was too short to be meaningful (under 10s)
    if (durationSeconds !== null && durationSeconds < 10) return

    const extracted = await summariseCall(transcript, message.summary)

    // ── Save to voice_calls (dashboard history) ───────────────────────────────
    await sb.from('voice_calls').upsert({
      user_id:           userId,
      vapi_call_id:      call.id,
      started_at:        startedAt,
      ended_at:          endedAt,
      duration_seconds:  durationSeconds,
      ended_reason:      message.endedReason ?? null,
      headline:          extracted?.headline ?? message.summary ?? null,
      summary:           extracted?.summary ?? message.summary ?? null,
      topics:            extracted?.topics ?? [],
      decisions:         extracted?.decisions ?? [],
      actions_approved:  extracted?.actions_approved ?? approved,
      actions_dismissed: extracted?.actions_dismissed ?? dismissed,
    }, { onConflict: 'vapi_call_id' })

    // ── Save to user_memory (brain continuity across calls) ───────────────────
    if (extracted?.headline) {
      await sb.from('user_memory').insert({
        user_id:          userId,
        headline:         extracted.headline,
        core_problem:     extracted.core_problem ?? null,
        root_causes:      [],
        priority_actions: extracted.priority_actions ?? [],
        ai_opportunities: [],
        domains_audited:  extracted.topics ?? [],
        status:           'voice_call',
        session_date:     startedAt ? new Date(startedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      })
    }

    console.log(`[vapi/end-of-call] saved call=${call.id} user=${userId} duration=${durationSeconds}s`)
  } catch (err) {
    // Non-blocking — never let this crash the webhook response
    console.error('[vapi/end-of-call] error:', err.message)
  }
}
