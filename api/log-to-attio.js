const BASE    = 'https://api.attio.com/v2'
const LIST_ID = '0a9bbc2b-9724-44b0-bc5a-4f2d1ec02a3a'

async function attio(method, path, body) {
  const url = `${BASE}${path}`
  console.log(`[attio] → ${method} ${url}`)
  if (body !== undefined) console.log(`[attio]   request body:`, JSON.stringify(body, null, 2))

  const res = await fetch(url, {
    method,
    headers: {
      Authorization:  `Bearer ${process.env.ATTIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const text = await res.text()
  console.log(`[attio] ← ${res.status} ${method} ${url}`)
  console.log(`[attio]   response body:`, text)

  if (!res.ok) {
    throw new Error(`Attio ${method} ${path} → ${res.status}: ${text}`)
  }

  return JSON.parse(text)
}

// Named export so api/auth.js can call this directly without an HTTP round-trip
export async function attioCreateUser({ email, name, tier, industry, domain }) {
  console.log('[attioCreateUser] called with:', { email, name, tier, industry, domain })

  const apiKey = process.env.ATTIO_API_KEY
  if (!apiKey) {
    console.warn('[attioCreateUser] ATTIO_API_KEY not set — aborting')
    return null
  }
  console.log('[attioCreateUser] API key present, prefix:', apiKey.slice(0, 12) + '...')

  const [firstName, ...rest] = (name || '').trim().split(' ')
  const lastName = rest.join(' ')
  console.log('[attioCreateUser] parsed name:', { firstName, lastName })

  // 1. Assert (upsert) the person record
  console.log('[attioCreateUser] step 1: asserting person')
  const personPayload = {
    data: {
      values: {
        email_addresses: [{ email_address: email }],
        name: [{ first_name: firstName || '', last_name: lastName || '' }],
      },
    },
  }
  const personResult = await attio(
    'PUT',
    '/objects/people/records?matching_attribute=email_addresses',
    personPayload
  )
  const recordId = personResult?.data?.id?.record_id
  console.log('[attioCreateUser] person record_id:', recordId)

  if (!recordId) {
    console.error('[attioCreateUser] no record_id in person response — aborting list entry step')
    return null
  }

  // 2. Upsert list entry
  // Attribute slugs must match exactly what Attio has configured on the list entry.
  // If any attribute below returns a 422/400, check the slugs in Attio → List settings → Attributes.
  console.log('[attioCreateUser] step 2: upserting list entry with attributes:', {
    tier:         tier || 'essential',
    industry:     industry || '',
    domain:       domain || '',
    report_count: 0,
    joined_at:    new Date().toISOString(),
  })

  const listPayload = {
    data: {
      record_id: { object: 'people', record_id: recordId },
      entry_values: {
        tier:         [{ value: tier      || 'essential' }],
        industry:     [{ value: industry  || ''          }],
        domain:       [{ value: domain    || ''          }],
        report_count: [{ value: 0                        }],
        joined_at:    [{ value: new Date().toISOString() }],
      },
    },
  }
  await attio('PUT', `/lists/${LIST_ID}/entries?matching_attribute=record_id`, listPayload)
  console.log('[attioCreateUser] list entry upserted successfully')

  return recordId
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  console.log('[log-to-attio] received action:', req.body?.action)

  if (!process.env.ATTIO_API_KEY) {
    console.warn('[log-to-attio] ATTIO_API_KEY not configured — skipping')
    return res.json({ ok: true, skipped: true })
  }

  const { action } = req.body || {}

  try {
    // ── create_user ────────────────────────────────────────────────────────────
    if (action === 'create_user') {
      const { email, name, tier, industry, domain } = req.body
      console.log('[log-to-attio] create_user payload:', { email, name, tier, industry, domain })
      if (!email) return res.status(400).json({ error: 'email required' })
      const recordId = await attioCreateUser({ email, name, tier, industry, domain })
      console.log('[log-to-attio] create_user complete, record_id:', recordId)
      return res.json({ ok: true, record_id: recordId })
    }

    // ── log_audit ──────────────────────────────────────────────────────────────
    if (action === 'log_audit') {
      const { email, conversationHistory, report, industry, domain } = req.body
      console.log('[log-to-attio] log_audit for:', email, { industry, domain })
      if (!email) return res.status(400).json({ error: 'email required' })

      console.log('[log-to-attio] querying person by email')
      const queryResult = await attio('POST', '/objects/people/records/query', {
        filter: { email_addresses: { $contains: { email_address: email } } },
        limit: 1,
      })
      const person = queryResult?.data?.[0]
      console.log('[log-to-attio] person query result:', person ? `found record_id=${person.id?.record_id}` : 'not found')
      if (!person) return res.status(404).json({ error: 'Person not found in Attio' })

      const recordId = person.id.record_id
      const date     = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const title    = `Audit Session — ${date} — ${industry || '?'}/${domain || '?'}`
      console.log('[log-to-attio] creating note:', title)

      const transcript = (conversationHistory || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => `[${m.role === 'user' ? 'User' : 'AI'}]: ${m.content}`)
        .join('\n\n')

      await attio('POST', '/notes', {
        data: {
          parent_object:     'people',
          parent_record_id:  recordId,
          title,
          content_plaintext: `${transcript}\n\n--- REPORT ---\n\n${JSON.stringify(report, null, 2)}`,
        },
      })
      console.log('[log-to-attio] note created successfully')

      return res.json({ ok: true })
    }

    // ── increment_report_count ─────────────────────────────────────────────────
    if (action === 'increment_report_count') {
      const { email } = req.body
      console.log('[log-to-attio] increment_report_count for:', email)
      if (!email) return res.status(400).json({ error: 'email required' })

      console.log('[log-to-attio] querying list entry')
      const entriesResult = await attio('POST', `/lists/${LIST_ID}/entries/query`, {
        filter: { 'record.email_addresses': { $contains: { email_address: email } } },
        limit: 1,
      })
      const entry = entriesResult?.data?.[0]
      console.log('[log-to-attio] list entry result:', entry ? `found entry_id=${entry.id?.entry_id}` : 'not found')
      if (!entry) return res.status(404).json({ error: 'List entry not found' })

      const entryId = entry.id.entry_id
      const current = entry.entry_values?.report_count?.[0]?.value ?? 0
      console.log('[log-to-attio] current report_count:', current, '→ patching to:', current + 1)

      await attio('PATCH', `/lists/${LIST_ID}/entries/${entryId}`, {
        data: { entry_values: { report_count: [{ value: current + 1 }] } },
      })
      console.log('[log-to-attio] report_count incremented successfully')

      return res.json({ ok: true, report_count: current + 1 })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (e) {
    console.error('[log-to-attio] unhandled error for action:', action)
    console.error('[log-to-attio] error message:', e.message)
    console.error('[log-to-attio] error stack:', e.stack)
    return res.status(500).json({ error: e.message })
  }
}
