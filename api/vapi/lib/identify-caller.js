import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Strip everything except digits and leading + so "+1 (555) 123-4567" → "+15551234567"
function normalizePhone(phone) {
  if (!phone) return null
  const stripped = phone.replace(/[^\d+]/g, '')
  return stripped || null
}

// Look up a SelfAudit user by their voice_phone number.
// Returns { id, name } or null if not registered.
export async function identifyCaller(rawPhone) {
  const normalized = normalizePhone(rawPhone)
  if (!normalized) return null

  const sb = getSupabase()

  // Try exact normalized match first
  const { data: exact } = await sb
    .from('profiles')
    .select('id, name')
    .eq('voice_phone', normalized)
    .single()

  if (exact) return exact

  // Fallback: digits-only match for users who saved without country code
  // e.g. user saved "5551234567", Vapi sends "+15551234567"
  const digitsOnly = normalized.replace(/^\+/, '')
  const { data: rows } = await sb
    .from('profiles')
    .select('id, name, voice_phone')
    .not('voice_phone', 'is', null)

  if (!rows?.length) return null

  const match = rows.find((r) => {
    const stored = normalizePhone(r.voice_phone)?.replace(/^\+/, '') ?? ''
    return stored && (stored === digitsOnly || digitsOnly.endsWith(stored) || stored.endsWith(digitsOnly))
  })

  return match ? { id: match.id, name: match.name } : null
}
