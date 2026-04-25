export default function handler(req, res) {
  const supabaseUrl     = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase config not set on server' })
  }

  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.json({ supabaseUrl, supabaseAnonKey })
}
