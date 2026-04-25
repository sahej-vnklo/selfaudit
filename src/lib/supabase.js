import { createClient } from '@supabase/supabase-js'

function safeStr(s) {
  return s ? s.replace(/[^\x00-\xFF]/g, '') : s
}

const url = safeStr(import.meta.env.VITE_SUPABASE_URL)
const key = safeStr(import.meta.env.VITE_SUPABASE_ANON_KEY)

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — auth disabled')
}

export const supabase = url && key ? createClient(url, key) : null
