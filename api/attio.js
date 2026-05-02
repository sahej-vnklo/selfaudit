export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ATTIO_API_KEY = process.env.ATTIO_API_KEY
  if (!ATTIO_API_KEY) {
    return res.status(500).json({ error: 'Attio API key not configured' })
  }

  const headers = {
    'Authorization': `Bearer ${ATTIO_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const { action } = req.body

  if (action === 'upsert_person') {
    const { userInfo } = req.body
    if (!userInfo?.email) {
      return res.status(400).json({ error: 'Missing email' })
    }

    const nameParts = (userInfo.name || '').trim().split(/\s+/)
    const values = {
      email_addresses: [{ email_address: userInfo.email }],
    }
    if (nameParts[0]) {
      values.name = [{
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
      }]
    }
    if (userInfo.phone) {
      values.phone_numbers = [{ phone_number: userInfo.phone }]
    }

    try {
      const response = await fetch('https://api.attio.com/v2/people', {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: { values } }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If person already exists, Attio returns 409 — still a success for our purposes
        if (response.status === 409 && data?.data?.id?.record_id) {
          return res.status(200).json({ success: true, person_id: data.data.id.record_id })
        }
        return res.status(500).json({ error: data.message || 'Attio upsert failed' })
      }

      return res.status(200).json({
        success: true,
        person_id: data.data?.id?.record_id || null,
      })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'create_note') {
    const { person_id, note_content } = req.body
    if (!person_id || !note_content) {
      return res.status(400).json({ error: 'Missing person_id or note_content' })
    }

    try {
      const response = await fetch('https://api.attio.com/v2/notes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: {
            parent_object: 'people',
            parent_record_id: person_id,
            title: `SelfAudit Session — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            content: note_content,
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        return res.status(500).json({ error: err.message || 'Attio note creation failed' })
      }

      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use upsert_person or create_note.' })
}
