import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, sessionId, report: r, industry, domain } = req.body
  if (!userId || !r) {
    return res.status(400).json({ error: 'Missing userId or report' })
  }

  try {
    await supabase.from('reports').insert({
      user_id:           userId,
      session_id:        sessionId ?? null,
      title:             r.headline,
      content:           JSON.stringify(r),
      domains:           r.domains?.map(d => d.name) ?? [],
      report_data:       r,
      industry:          industry ?? null,
      domain:            domain ?? null,
      conversation_mode: r.conversation_mode,
      headline:          r.headline,
    })

    if (sessionId) {
      await supabase
        .from('audit_sessions')
        .update({ conversation_mode: r.conversation_mode ?? null })
        .eq('session_id', sessionId)
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
