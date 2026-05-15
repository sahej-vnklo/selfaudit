const BASE    = 'https://api.attio.com/v2'
const LIST_ID = '0a9bbc2b-9724-44b0-bc5a-4f2d1ec02a3a'

async function attioRequest(method, path, body) {
  const url = `${BASE}${path}`
  console.log(`[attio] → ${method} ${url}`)

  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${process.env.ATTIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log(`[attio] ← ${res.status} ${method} ${path}`)

  if (!res.ok) throw new Error(`Attio ${method} ${path} → ${res.status}: ${text}`)
  return JSON.parse(text)
}

function parseName(name) {
  const full     = (name || '').trim()
  const spaceIdx = full.indexOf(' ')
  if (spaceIdx === -1) return { first_name: full, last_name: '', full_name: full }
  return {
    first_name: full.slice(0, spaceIdx),
    last_name:  full.slice(spaceIdx + 1),
    full_name:  full,
  }
}

async function upsertPerson(email, name) {
  const { first_name, last_name, full_name } = parseName(name)
  const result = await attioRequest(
    'PUT',
    '/objects/people/records?matching_attribute=email_addresses',
    {
      data: {
        values: {
          email_addresses: [{ email_address: email }],
          name: [{ first_name, last_name, full_name }],
        },
      },
    }
  )
  return result?.data?.id?.record_id ?? null
}

// Named export — called directly from api/auth.js on signup (steps 1 + 2)
export async function attioCreateUser({ email, name }) {
  if (!process.env.ATTIO_API_KEY) {
    console.warn('[attioCreateUser] ATTIO_API_KEY not set — skipping')
    return null
  }

  try {
    // Step 1: upsert person
    const recordId = await upsertPerson(email, name)
    console.log('[attioCreateUser] record_id:', recordId)
    if (!recordId) {
      console.error('[attioCreateUser] no record_id returned — skipping list entry')
      return null
    }

    // Step 2: add to TSA Users list
    await attioRequest('POST', `/lists/${LIST_ID}/entries`, {
      data: {
        parent_record_id: recordId,
        parent_object:    'people',
        entry_values:     {},
      },
    })
    console.log('[attioCreateUser] list entry created')
    return recordId
  } catch (e) {
    console.error('[attioCreateUser] error:', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action } = req.body || {}
  console.log('[log-to-attio] action:', action)

  if (!process.env.ATTIO_API_KEY) {
    console.warn('[log-to-attio] ATTIO_API_KEY not configured — skipping')
    return res.json({ ok: true, skipped: true })
  }

  // ── create_user ──────────────────────────────────────────────────────────────
  if (action === 'create_user') {
    const { email, name } = req.body
    if (!email) return res.status(400).json({ error: 'email required' })
    const recordId = await attioCreateUser({ email, name })
    return res.json({ ok: true, record_id: recordId })
  }

  // ── log_audit ────────────────────────────────────────────────────────────────
  if (action === 'log_audit') {
    const { email, name, conversationHistory, report, industry, domain } = req.body
    if (!email) return res.status(400).json({ error: 'email required' })

    try {
      // Step 1: upsert person to get record_id (idempotent)
      const recordId = await upsertPerson(email, name)
      console.log('[log_audit] record_id:', recordId)
      if (!recordId) {
        console.error('[log_audit] no record_id — skipping note')
        return res.json({ ok: true, skipped: true })
      }

      // Step 3: create note with transcript + report
      const date  = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const title = `Audit — ${date} — ${industry || '?'} / ${domain || '?'}`

      const transcript = (conversationHistory || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => `[${m.role === 'user' ? 'User' : 'AI'}]: ${m.content}`)
        .join('\n\n')

      await attioRequest('POST', '/notes', {
        data: {
          parent_object:    'people',
          parent_record_id: recordId,
          title,
          content:          `${transcript}\n\n--- REPORT ---\n\n${JSON.stringify(report, null, 2)}`,
        },
      })
      console.log('[log_audit] note created')
      return res.json({ ok: true })
    } catch (e) {
      console.error('[log_audit] error:', e.message)
      return res.json({ ok: true, skipped: true })
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` })
}
