export default function handler(req, res) {
  const supabaseUrl     = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  console.log('[config] SUPABASE_URL:', supabaseUrl || '(not set)')
  console.log('[config] SUPABASE_ANON_KEY length:', supabaseAnonKey?.length ?? 0)
  console.log('[config] SUPABASE_ANON_KEY prefix:', supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : '(not set)')
  console.log('[config] SUPABASE_ANON_KEY suffix:', supabaseAnonKey ? '...' + supabaseAnonKey.slice(-10) : '(not set)')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[config] Missing env vars — returning 500')
    return res.status(500).json({ error: 'Supabase config not set on server' })
  }

  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.json({ supabaseUrl, supabaseAnonKey })
}
