import { createClient } from '@supabase/supabase-js'

let _supabase = null
function getClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  }
  return _supabase
}

// Load a user's compiled schema from Supabase.
// Returns null if none exists (user hasn't completed onboarding).
export async function loadSchema(userId) {
  const { data, error } = await getClient()
    .from('company_schemas')
    .select('schema')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data.schema
}

// Persist a compiled schema for a user.
// Upserts — calling this again with a new schema replaces the old one.
export async function saveSchema(userId, schema) {
  const { error } = await getClient()
    .from('company_schemas')
    .upsert(
      { user_id: userId, schema, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) throw new Error(`Failed to save schema for user ${userId}: ${error.message}`)
  return schema
}

// Delete a user's schema — called when they reset onboarding.
export async function deleteSchema(userId) {
  const { error } = await getClient()
    .from('company_schemas')
    .delete()
    .eq('user_id', userId)

  if (error) throw new Error(`Failed to delete schema for user ${userId}: ${error.message}`)
}

// Returns true if the user has a persisted schema.
export async function hasSchema(userId) {
  const schema = await loadSchema(userId)
  return schema !== null
}
