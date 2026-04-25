import { createClient } from '@supabase/supabase-js'

function safeStr(s) {
  return s ? s.replace(/[^\x00-\xFF]/g, '') : s
}

const url = safeStr(import.meta.env.VITE_SUPABASE_URL)
const key = safeStr(import.meta.env.VITE_SUPABASE_ANON_KEY)

console.log('[supabase] url:', url || '(empty)')
console.log('[supabase] key prefix:', key ? key.slice(0, 20) + '...' : '(empty)')
console.log('[supabase] url length:', url?.length ?? 0, '| key length:', key?.length ?? 0)

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth disabled')
}

export const supabase = url && key ? createClient(url, key) : null

if (supabase) {
  console.log('[supabase] client created — testing reachability...')
  fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
  })
    .then(r => console.log('[supabase] reachability check:', r.status, r.statusText))
    .catch(e => console.error('[supabase] reachability check FAILED:', e.message))
} else {
  console.warn('[supabase] client is null — skipping reachability check')
}
