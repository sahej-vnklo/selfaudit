import { createClient } from '@supabase/supabase-js'

// Starts null; set by initSupabase(). ESM live binding — all importers
// see the updated value once initSupabase() resolves.
export let supabase = null

let _initPromise = null

export async function initSupabase() {
  if (supabase) return supabase
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    let url, key

    // Production: fetch from server-side API (no VITE_ encoding issues)
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        url = data.supabaseUrl
        key = data.supabaseAnonKey
        console.log('[supabase] config loaded from /api/config')
      }
    } catch (_) {}

    // Local dev fallback: Vite bakes these into the bundle at build time
    if (!url) url = import.meta.env.VITE_SUPABASE_URL
    if (!key) key = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!url || !key) throw new Error('Supabase config unavailable from server and env vars')

    console.log('[supabase] url:', url)
    console.log('[supabase] key prefix:', key.slice(0, 20) + '...')

    supabase = createClient(url, key)

    // Force auth hydration before any caller uses this client.
    // This ensures auth.uid() is valid in RLS before Dashboard queries profiles.
    await supabase.auth.getSession()

    return supabase
  })()

  return _initPromise
}
