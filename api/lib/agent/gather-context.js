import { createClient } from '@supabase/supabase-js'
import { getCompanyBrain, formatBrainForPrompt } from '../intelligence/company-brain.js'
import { fetchAllConnectedData } from '../connectors/data-fetcher.js'
import { normalizeConnectorData } from '../connectors/normalize.js'
import { getRecentDecisions } from '../decisions/service.js'
import { formatDecisionsForPrompt } from '../decisions/context.js'
import { getCompanyDNASummary } from '../intelligence/company-dna.js'
import { formatHistoricalMemoryForPrompt, getHistoricalMemory } from '../intelligence/historical-memory.js'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

function fmt(n, prefix = '$') {
  if (n == null || n === '') return null
  const num = Number(n)
  return Number.isFinite(num) ? `${prefix}${num.toLocaleString()}` : String(n)
}

// ── Individual context loaders ────────────────────────────────────────────────

async function loadIntelligenceBrief(sb, userId) {
  try {
    const { data } = await sb.from('intelligence_brief').select('financial, operational, context').eq('user_id', userId).single()
    if (!data) return null
    const f = data.financial || {}
    const o = data.operational || {}
    const c = data.context || {}
    const lines = []
    if (f.mrr)          lines.push(`MRR: ${fmt(f.mrr)}`)
    if (f.arr)          lines.push(`ARR: ${fmt(f.arr)}`)
    if (f.churn)        lines.push(`Monthly churn: ${f.churn}%`)
    if (f.cac)          lines.push(`CAC: ${fmt(f.cac)}`)
    if (f.ltv)          lines.push(`LTV: ${fmt(f.ltv)}`)
    if (f.gross_margin) lines.push(`Gross margin: ${f.gross_margin}%`)
    if (f.burn_rate)    lines.push(`Monthly burn: ${fmt(f.burn_rate)}`)
    if (f.runway || c.runway) lines.push(`Runway: ${f.runway || c.runway} months`)
    if (o.headcount)    lines.push(`Headcount: ${o.headcount}`)
    if (o.active_customers) lines.push(`Active customers: ${o.active_customers}`)
    if (o.nps)          lines.push(`NPS: ${o.nps}`)
    if (o.sales_cycle)  lines.push(`Sales cycle: ${o.sales_cycle} days`)
    return lines.length ? { source: 'intelligence_brief', summary: lines.join(' · '), raw: data } : null
  } catch { return null }
}

async function loadRecentAudits(sb, userId) {
  try {
    const { data } = await sb
      .from('reports')
      .select('headline, domains, conversation_mode, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)
    if (!data?.length) return null
    const summaries = data.map((r) => {
      const domains = Array.isArray(r.domains) ? r.domains : []
      return `[${new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}] ${r.headline}${domains.length ? ` (domains: ${domains.join(', ')})` : ''}`
    })
    return { source: 'recent_audits', summary: summaries.join('\n'), raw: data }
  } catch { return null }
}

async function loadHealthChecks(sb, userId) {
  try {
    const { data } = await sb
      .from('business_health_checks')
      .select('health_score, summary, risks, checked_at')
      .eq('user_id', userId)
      .order('checked_at', { ascending: false })
      .limit(1)
      .single()
    if (!data) return null
    const riskTitles = Array.isArray(data.risks)
      ? data.risks.slice(0, 4).map((r) => `[${r.severity}] ${r.title}`).join('; ')
      : ''
    const summary = `Health score: ${data.health_score}/100. ${data.summary || ''}${riskTitles ? ` Top risks: ${riskTitles}` : ''}`
    return { source: 'health_checks', summary, raw: data }
  } catch { return null }
}

async function loadRiskAlerts(sb, userId) {
  try {
    const { data } = await sb
      .from('risk_alerts')
      .select('severity, category, title, description, recommended_action')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5)
    if (!data?.length) return null
    const lines = data.map((a) => `[${a.severity.toUpperCase()}] ${a.title}: ${a.description || ''}`)
    return { source: 'risk_alerts', summary: lines.join('\n'), raw: data }
  } catch { return null }
}

async function loadDecisionMemory(sb, userId) {
  try {
    const decisions = await getRecentDecisions(sb, userId, 10)
    const formatted = formatDecisionsForPrompt(decisions)
    if (!formatted.length) return { source: 'decision_memory', summary: '', raw: [] }
    const lines = formatted.map((item) => {
      const outcome = item.observed_result ? `${item.execution_outcome} -> ${item.observed_result}` : item.execution_outcome
      return `[${item.finding_area_id}] ${item.finding_title} -> ${item.prior_action} (${outcome})`
    })
    return { source: 'decision_memory', summary: lines.join('\n'), raw: formatted }
  } catch {
    return { source: 'decision_memory', summary: '', raw: [] }
  }
}

async function loadConnectorData(userId) {
  try {
    const allData = await fetchAllConnectedData(userId)
    if (!Object.keys(allData).length) return null
    const n = normalizeConnectorData(allData)
    if (!n) return null

    const m = Object.fromEntries(n.metrics.map((x) => [x.key, x.value]))
    const closingSoon = n.entities.filter((e) => e.type === 'deal')

    const lines = []
    if (m.open_deals != null)          lines.push(`Open deals: ${m.open_deals}`)
    if (m.open_pipeline_value != null) lines.push(`Pipeline value: ${fmt(m.open_pipeline_value)}`)
    if (m.avg_deal_size)               lines.push(`Avg deal size: ${fmt(m.avg_deal_size)}`)
    if (m.new_contacts_this_month)     lines.push(`New contacts this month: ${m.new_contacts_this_month}`)
    if (m.leads != null)               lines.push(`Leads: ${m.leads}`)
    if (m.mqls  != null)               lines.push(`MQLs: ${m.mqls}`)
    if (m.sqls  != null)               lines.push(`SQLs: ${m.sqls}`)
    if (m.customers != null)           lines.push(`Customers in CRM: ${m.customers}`)
    if (m.mrr != null)                 lines.push(`MRR: ${fmt(m.mrr)}`)
    if (m.churn_rate != null)          lines.push(`Churn: ${m.churn_rate}%`)
    if (m.open_tickets != null)        lines.push(`Open tickets: ${m.open_tickets}`)
    if (closingSoon.length)            lines.push(`Closing in 14 days: ${closingSoon.map((d) => `${d.label} ${fmt(d.amount)}`).join(', ')}`)

    return {
      source: n.provider,
      summary: lines.join(' · '),
      normalized: n,
    }
  } catch { return null }
}

// ── Main gatherer ─────────────────────────────────────────────────────────────

export async function gatherAgentContext(userId, plan) {
  const sb           = getSupabase()
  const needed       = plan.available_sources ?? []
  const contextBlocks = []
  const sourcesUsed   = []
  const missingSources = [...(plan.missing_sources ?? [])]

  // Company brain (always loaded — it's free and rich)
  let brain = null
  try {
    brain = await getCompanyBrain(userId)
    if (brain) {
      const lines = []
      if (brain.industry)         lines.push(`Industry: ${brain.industry}`)
      if (brain.core_offer)       lines.push(`Core offer: ${brain.core_offer}`)
      if (brain.target_customer)  lines.push(`Target customer: ${brain.target_customer}`)
      if (brain.active_goal)      lines.push(`Active goal: ${brain.active_goal} (score: ${brain.goal_score}/100)`)
      if (brain.revenue_streams?.length)         lines.push(`Revenue streams: ${brain.revenue_streams.join(', ')}`)
      if (brain.conversion_bottlenecks?.length)  lines.push(`Known bottlenecks: ${brain.conversion_bottlenecks.join('; ')}`)
      if (brain.operational_blockers?.length)    lines.push(`Operational blockers: ${brain.operational_blockers.join('; ')}`)
      if (brain.top_priorities?.length)          lines.push(`Unresolved priorities: ${brain.top_priorities.slice(0, 3).join('; ')}`)
      if (brain.watchouts?.length)               lines.push(`Watchouts: ${brain.watchouts.slice(0, 3).join('; ')}`)
      if (brain.repeated_blockers?.length)       lines.push(`Repeated blockers: ${brain.repeated_blockers.join('; ')}`)
      if (brain.last_session?.headline)          lines.push(`Last audit: ${brain.last_session.headline}`)

      const patternSection = formatBrainForPrompt(brain)
      if (patternSection) lines.push('', patternSection)
      contextBlocks.push({ source: 'company_brain', summary: lines.join('\n') })
      sourcesUsed.push('company_brain')
    }
  } catch { /* non-blocking */ }

  const needsConnector = needed.includes('connector_data') || needed.includes('hubspot_pipeline') || needed.includes('hubspot_contacts')

  // Parallel loads for everything
  const [briefBlock, auditBlock, healthBlock, alertBlock, connectorBlock, decisionsBlock, companyDNABlock, historicalMemoryBlock] = await Promise.allSettled([
    needed.includes('intelligence_brief') ? loadIntelligenceBrief(sb, userId) : Promise.resolve(null),
    needed.includes('recent_audits')      ? loadRecentAudits(sb, userId)       : Promise.resolve(null),
    needed.includes('health_checks')      ? loadHealthChecks(sb, userId)        : Promise.resolve(null),
    needed.includes('risk_alerts')        ? loadRiskAlerts(sb, userId)          : Promise.resolve(null),
    needsConnector ? loadConnectorData(userId)                                   : Promise.resolve(null),
    userId ? loadDecisionMemory(sb, userId)                                      : Promise.resolve({ source: 'decision_memory', summary: '', raw: [] }),
    userId ? getCompanyDNASummary(sb, userId)                                    : Promise.resolve({ status: 'insufficient_data', patterns: [], formatted: null }),
    userId ? getHistoricalMemory(sb, userId)                                     : Promise.resolve({ status: 'insufficient_history', summary: null, metrics: [] }),
  ])

  for (const [result, key] of [
    [briefBlock,     'intelligence_brief'],
    [auditBlock,     'recent_audits'],
    [healthBlock,    'health_checks'],
    [alertBlock,     'risk_alerts'],
    [connectorBlock, 'hubspot'],
    [decisionsBlock, 'decision_memory'],
    [companyDNABlock, 'company_dna'],
    [historicalMemoryBlock, 'historical_memory'],
  ]) {
    const block = result.status === 'fulfilled' ? result.value : null
    if (block) {
      if (key === 'company_dna') {
        if (block.formatted) {
          contextBlocks.push({ source: 'company_dna', summary: block.formatted })
          sourcesUsed.push('company_dna')
        }
        continue
      }
      if (key === 'historical_memory') {
        const formatted = formatHistoricalMemoryForPrompt(block)
        if (formatted) {
          contextBlocks.push({ source: 'historical_memory', summary: formatted })
          sourcesUsed.push('historical_memory')
        }
        continue
      }

      if (key !== 'decision_memory' || block.summary) {
        contextBlocks.push(block)
      }
      sourcesUsed.push(block.source)
    } else if (needed.includes(key) || needed.includes(`${key}_pipeline`) || needed.includes(`${key}_contacts`)) {
      if (!missingSources.includes(key)) missingSources.push(key)
    }
  }

  // Structured context — flat object for the prompt builder
  const structured = {
    brain,
    intelligence_brief: briefBlock.status === 'fulfilled' ? briefBlock.value?.raw : null,
    recent_audits:      auditBlock.status === 'fulfilled'  ? auditBlock.value?.raw  : null,
    health_check:       healthBlock.status === 'fulfilled' ? healthBlock.value?.raw : null,
    risk_alerts:        alertBlock.status === 'fulfilled'  ? alertBlock.value?.raw  : null,
    connector:          connectorBlock.status === 'fulfilled' ? connectorBlock.value : null,
    decision_memory:    decisionsBlock.status === 'fulfilled' ? (decisionsBlock.value?.raw ?? []) : [],
    company_dna:        companyDNABlock.status === 'fulfilled'
      ? companyDNABlock.value
      : { status: 'insufficient_data', patterns: [], formatted: null },
    historical_memory:  historicalMemoryBlock.status === 'fulfilled'
      ? {
          ...historicalMemoryBlock.value,
          formatted: formatHistoricalMemoryForPrompt(historicalMemoryBlock.value),
        }
      : { status: 'insufficient_history', summary: null, metrics: [] },
  }

  return { context_blocks: contextBlocks, structured_context: structured, sources_used: sourcesUsed, missing_sources: missingSources }
}
