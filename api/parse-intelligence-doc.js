import { createClient } from '@supabase/supabase-js'
import { CLAUDE_MODEL } from './lib/model-config.js'
import { validateUserToken } from './lib/auth.js'
import { synthesizeUserIntelligence } from './lib/intelligence/synthesize.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const FINANCIAL_KEYS = ['arr', 'mrr', 'gross_margin', 'net_profit_margin', 'burn_rate', 'cac', 'ltv', 'churn', 'revenue_qtr']
const OPERATIONAL_KEYS = ['headcount', 'active_customers', 'nps']

const loadOptional = async (name, message) => {
  try {
    return await import(name)
  } catch {
    throw Object.assign(new Error(message), { status: 400 })
  }
}

const parseClaudeJson = (text) => {
  const clean = String(text || '').replace(/```json|```/g, '').trim()
  try { return JSON.parse(clean) } catch { throw Object.assign(new Error('Claude returned invalid JSON'), { status: 502 }) }
}

async function extractText(name, file) {
  const lower = String(name || '').toLowerCase()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  if (lower.endsWith('.pdf')) {
    const mod = await loadOptional('pdf-parse', 'pdf-parse is not installed on this deployment')
    const parse = mod.default || mod
    return (await parse(buffer)).text || ''
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const mod = await loadOptional('xlsx', 'xlsx is not installed on this deployment')
    const xlsx = mod.default || mod
    const wb = xlsx.read(buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    return sheet ? xlsx.utils.sheet_to_csv(sheet) : ''
  }
  if (lower.endsWith('.csv')) return buffer.toString('utf8')
  if (lower.endsWith('.docx')) {
    const mod = await loadOptional('mammoth', 'mammoth is not installed on this deployment')
    return (await mod.extractRawText({ buffer })).value || ''
  }
  throw Object.assign(new Error('Unsupported file type'), { status: 400 })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase env vars missing' })
  if (!process.env.CLAUDE_API_KEY) return res.status(500).json({ error: 'Claude API key not configured' })

  try {
    const { userId, path, name } = req.body || {}
    if (!userId || !path || !name) return res.status(400).json({ error: 'userId, path, and name are required' })
    if (!await validateUserToken(req, res, userId)) return

    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    const { data: file, error: downloadError } = await sb.storage.from('intelligence-docs').download(path)
    if (downloadError || !file) return res.status(400).json({ error: downloadError?.message || 'Unable to download file' })

    const text = await extractText(name, file)
    const prompt = `Document text:\n${text}\n\nExtract values only for these keys if the document contains a specific number for them: arr, mrr, gross_margin, net_profit_margin, burn_rate, cac, ltv, churn, revenue_qtr, headcount, active_customers, nps. Omit any key you cannot verify from the document. Never guess. Return valid JSON only.`

    const claude = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        system: 'You are a financial data extractor. Extract only verifiable numbers from the document provided. Return valid JSON only, no markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!claude.ok) {
      const err = await claude.json().catch(() => ({}))
      return res.status(claude.status).json({ error: err.error?.message || 'Claude API error' })
    }

    const json = await claude.json()
    const extracted = parseClaudeJson(json.content?.[0]?.text)
    const financial = Object.fromEntries(FINANCIAL_KEYS.filter((key) => extracted[key] != null).map((key) => [key, extracted[key]]))
    const operational = Object.fromEntries(OPERATIONAL_KEYS.filter((key) => extracted[key] != null).map((key) => [key, extracted[key]]))

    const { data: existing, error: existingError } = await sb
      .from('intelligence_brief')
      .select('financial, operational')
      .eq('user_id', userId)
      .maybeSingle()
    if (existingError) return res.status(500).json({ error: existingError.message })

    const payload = {
      user_id: userId,
      financial: { ...(existing?.financial || {}), ...financial },
      operational: { ...(existing?.operational || {}), ...operational },
      updated_at: new Date().toISOString(),
    }
    const { error: upsertError } = await sb.from('intelligence_brief').upsert(payload, { onConflict: 'user_id' })
    if (upsertError) return res.status(500).json({ error: upsertError.message })

    synthesizeUserIntelligence(userId, { supabase: sb }).catch((err) => {
      console.warn('[parse-intelligence-doc] synthesis failed:', err?.message || err)
    })

    return res.status(200).json({ success: true, extracted })
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Failed to parse intelligence document' })
  }
}
