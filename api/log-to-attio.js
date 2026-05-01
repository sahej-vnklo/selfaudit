const BASE      = 'https://api.attio.com/v2'
const LIST_SLUG = 'tsa-users'

async function attio(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${process.env.ATTIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Attio ${method} ${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json
}

// Named export so api/auth.js can call this directly without an HTTP round-trip
export async function attioCreateUser({ email, name, tier, industry, domain }) {
  const [firstName, ...rest] = (name || '').trim().split(' ')
  const lastName = rest.join(' ')

  // Assert (upsert) the person record
  const { data: person } = await attio(
    'PUT',
    '/objects/people/records?matching_attribute=email_addresses',
    {
      data: {
        values: {
          email_addresses: [{ email_address: email }],
          name: [{ first_name: firstName || '', last_name: lastName || '' }],
        },
      },
    }
  )
  const recordId = person.id.record_id

  // Upsert list entry with plan attributes
  await attio(
    'PUT',
    `/lists/${LIST_SLUG}/entries?matching_attribute=record_id`,
    {
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
  )

  return recordId
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.ATTIO_API_KEY) {
    console.warn('[log-to-attio] ATTIO_API_KEY not configured — skipping')
    return res.json({ ok: true, skipped: true })
  }

  const { action } = req.body || {}

  try {
    // ── create_user ────────────────────────────────────────────────────────────
    if (action === 'create_user') {
      const { email, name, tier, industry, domain } = req.body
      if (!email) return res.status(400).json({ error: 'email required' })
      const recordId = await attioCreateUser({ email, name, tier, industry, domain })
      return res.json({ ok: true, record_id: recordId })
    }

    // ── log_audit ──────────────────────────────────────────────────────────────
    if (action === 'log_audit') {
      const { email, conversationHistory, report, industry, domain } = req.body
      if (!email) return res.status(400).json({ error: 'email required' })

      const { data } = await attio('POST', '/objects/people/records/query', {
        filter: { email_addresses: { $contains: { email_address: email } } },
        limit: 1,
      })
      const person = data?.[0]
      if (!person) return res.status(404).json({ error: 'Person not found in Attio' })

      const recordId = person.id.record_id
      const date     = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const title    = `Audit Session — ${date} — ${industry || '?'}/${domain || '?'}`

      const transcript = (conversationHistory || [])
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => `[${m.role === 'user' ? 'User' : 'AI'}]: ${m.content}`)
        .join('\n\n')

      await attio('POST', '/notes', {
        data: {
          parent_object:    'people',
          parent_record_id: recordId,
          title,
          content_plaintext: `${transcript}\n\n--- REPORT ---\n\n${JSON.stringify(report, null, 2)}`,
        },
      })

      return res.json({ ok: true })
    }

    // ── increment_report_count ─────────────────────────────────────────────────
    if (action === 'increment_report_count') {
      const { email } = req.body
      if (!email) return res.status(400).json({ error: 'email required' })

      const { data: entries } = await attio('POST', `/lists/${LIST_SLUG}/entries/query`, {
        filter: { 'record.email_addresses': { $contains: { email_address: email } } },
        limit: 1,
      })
      const entry = entries?.[0]
      if (!entry) return res.status(404).json({ error: 'List entry not found' })

      const entryId = entry.id.entry_id
      const current = entry.entry_values?.report_count?.[0]?.value ?? 0

      await attio('PATCH', `/lists/${LIST_SLUG}/entries/${entryId}`, {
        data: { entry_values: { report_count: [{ value: current + 1 }] } },
      })

      return res.json({ ok: true, report_count: current + 1 })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (e) {
    console.error('[log-to-attio] error:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
