import { createClient } from '@supabase/supabase-js'
import { buildGovernanceAdvice } from './advice.js'
import { findRelevantDecisions } from '../decisions/matcher.js'
import { formatDecisionsForPrompt } from '../decisions/context.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )
}

function compactObject(value) {
  if (!value || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value
      .map(compactObject)
      .filter((item) => item !== null && item !== undefined && item !== '')
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null && item !== undefined && item !== '')
      .map(([key, item]) => [key, compactObject(item)])
  )
}

function buildSystemPrompt() {
  return `You are TSA — The Self Audit operational strategist. You are a senior operator reviewing governance findings across a business.

Your rules:
- Keep the findings grounded in the provided evidence. Never invent numbers or events.
- Do not overrule the deterministic finding severity or status. Your job is to sharpen interpretation.
- Distinguish facts from assumptions and missing data inside the wording when needed.
- Give root cause when evidence supports it. If it does not, say what is most likely and why.
- Be direct, founder-level, and operational. No filler. No motivational language.
- Preserve the structure you are asked for and output only valid JSON.

Return JSON in this exact shape:
{
  "summary": "One executive summary sentence for the whole business.",
  "diagnoses": [
    {
      "areaId": "finance-accounting",
      "title": "Runway is critical",
      "summary": "Sharper explanation of what is happening.",
      "rootCause": "Why this is likely happening.",
      "impact": "Why it matters if ignored.",
      "recommendation": "Best next move."
    }
  ],
  "recommended_actions": ["Action 1", "Action 2"],
  "alert_candidates": [
    {
      "category": "finance-accounting",
      "title": "Runway is critical",
      "description": "Sharper alert description.",
      "recommended_action": "Best next move."
    }
  ]
}`
}

function buildBusinessSnapshot(brain, intelligenceBrief) {
  return compactObject({
    active_goal: brain?.active_goal ?? null,
    goal_score: brain?.goal_score ?? null,
    goal_timeline: brain?.goal_timeline ?? null,
    top_priorities: brain?.top_priorities?.slice(0, 5) ?? [],
    repeated_blockers: brain?.repeated_blockers?.slice(0, 5) ?? [],
    watchouts: brain?.watchouts?.slice(0, 5) ?? [],
    retention_signals: brain?.retention_signals?.slice(0, 5) ?? [],
    last_session: brain?.last_session
      ? {
          headline: brain.last_session.headline ?? null,
          status: brain.last_session.status ?? null,
        }
      : null,
    financial: intelligenceBrief?.financial
      ? compactObject({
          mrr: intelligenceBrief.financial.mrr ?? null,
          churn: intelligenceBrief.financial.churn ?? null,
          burn_rate: intelligenceBrief.financial.burn_rate ?? null,
          runway: intelligenceBrief.financial.runway ?? null,
          ltv: intelligenceBrief.financial.ltv ?? null,
          cac: intelligenceBrief.financial.cac ?? null,
        })
      : null,
    operational: intelligenceBrief?.operational
      ? compactObject({
          sales_cycle: intelligenceBrief.operational.sales_cycle ?? null,
          support_tickets_per_week: intelligenceBrief.operational.support_tickets_per_week ?? null,
        })
      : null,
    context: intelligenceBrief?.context ?? null,
  })
}

function buildFindingsByArea(governance) {
  const areas = Array.isArray(governance?.areas) ? governance.areas : []
  return areas
    .filter((area) => Array.isArray(area.findings) && area.findings.length > 0)
    .map((area) => ({
      areaId: area.areaId,
      areaLabel: area.label,
      status: area.status,
      findings: area.findings.map((finding) =>
        compactObject({
          id: finding.id,
          title: finding.title,
          status: finding.status,
          severity: finding.severity,
          metricKey: finding.metricKey,
          metricValue: finding.metricValue,
          comparator: finding.comparator,
          thresholdValue: finding.thresholdValue,
          summary: finding.summary,
          rationale: finding.rationale,
          recommendation: finding.recommendation,
        })
      ),
    }))
}

function buildUserMessage({ governance, brain, intelligenceBrief, deterministicAdvice, decisionMemory = [] }) {
  const payload = {
    business_snapshot: buildBusinessSnapshot(brain, intelligenceBrief),
    governance_summary: governance?.summary ?? {},
    findings_by_area: buildFindingsByArea(governance),
    current_output: {
      summary: deterministicAdvice.summary,
      diagnoses: deterministicAdvice.diagnoses.map((item) => ({
        areaId: item.areaId,
        title: item.title,
        summary: item.summary,
        rootCause: item.rootCause,
        impact: item.impact,
        recommendation: item.recommendation,
        evidence: item.evidence,
      })),
      recommended_actions: deterministicAdvice.recommended_actions,
      alert_candidates: deterministicAdvice.alert_candidates.map((item) => ({
        category: item.category,
        title: item.title,
        description: item.description,
        recommended_action: item.recommended_action,
        evidence: item.evidence,
      })),
    },
  }

  if (Array.isArray(decisionMemory) && decisionMemory.length > 0) {
    payload.decision_memory = decisionMemory
  }

  if (brain?.company_dna_formatted) {
    payload.company_dna = brain.company_dna_formatted
  }

  if (brain?.historical_memory_formatted) {
    payload.historical_memory = brain.historical_memory_formatted
  }

  return `Review these governance findings and improve the diagnosis quality without changing the underlying facts or severity.

Rules:
- Use the provided metrics and evidence only.
- Keep the same number of diagnoses unless evidence clearly does not support one of them.
- Keep advice practical and founder-level.
- If data is thin, say what is likely instead of pretending certainty.
- Recommended actions should be specific and non-duplicative.

Input:
${JSON.stringify(payload, null, 2)}`
}

function cleanJson(raw) {
  return raw.replace(/```json|```/g, '').trim()
}

function indexBy(list, getKey) {
  const map = new Map()
  for (const item of list) {
    map.set(getKey(item), item)
  }
  return map
}

function mergeDiagnoses(base, enriched) {
  if (!Array.isArray(enriched) || !enriched.length) return base
  const byKey = indexBy(enriched, (item) => `${item.areaId}::${item.title}`)

  return base.map((item) => {
    const overlay = byKey.get(`${item.areaId}::${item.title}`)
    if (!overlay) return item
    return {
      ...item,
      summary: typeof overlay.summary === 'string' && overlay.summary.trim() ? overlay.summary.trim() : item.summary,
      rootCause: typeof overlay.rootCause === 'string' && overlay.rootCause.trim() ? overlay.rootCause.trim() : item.rootCause,
      impact: typeof overlay.impact === 'string' && overlay.impact.trim() ? overlay.impact.trim() : item.impact,
      recommendation: typeof overlay.recommendation === 'string' && overlay.recommendation.trim()
        ? overlay.recommendation.trim()
        : item.recommendation,
    }
  })
}

function mergeAlertCandidates(base, enriched) {
  if (!Array.isArray(enriched) || !enriched.length) return base
  const byKey = indexBy(enriched, (item) => `${item.category}::${item.title}`)

  return base.map((item) => {
    const overlay = byKey.get(`${item.category}::${item.title}`)
    if (!overlay) return item
    return {
      ...item,
      description: typeof overlay.description === 'string' && overlay.description.trim()
        ? overlay.description.trim()
        : item.description,
      recommended_action: typeof overlay.recommended_action === 'string' && overlay.recommended_action.trim()
        ? overlay.recommended_action.trim()
        : item.recommended_action,
    }
  })
}

function dedupeActions(items) {
  const seen = new Set()
  const output = []
  for (const item of items) {
    const text = typeof item === 'string' ? item.trim() : ''
    const key = text.toLowerCase()
    if (!text || seen.has(key)) continue
    seen.add(key)
    output.push(text)
  }
  return output
}

function mergeAdvice(base, parsed) {
  const diagnoses = mergeDiagnoses(base.diagnoses, parsed?.diagnoses)
  const alertCandidates = mergeAlertCandidates(base.alert_candidates, parsed?.alert_candidates)
  const recommendedActions = Array.isArray(parsed?.recommended_actions) && parsed.recommended_actions.length
    ? dedupeActions(parsed.recommended_actions).slice(0, 6)
    : base.recommended_actions

  return {
    summary: typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : base.summary,
    diagnoses,
    recommended_actions: recommendedActions,
    alert_candidates: alertCandidates,
  }
}

export async function enrichGovernanceWithAI({
  userId,
  governance,
  brain,
  intelligenceBrief,
  deterministicAdvice,
}) {
  const baseAdvice = deterministicAdvice ?? buildGovernanceAdvice(governance)
  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY
  let decisionMemory = []

  if (userId) {
    try {
      const supabase = getSupabase()
      const relevantDecisions = await findRelevantDecisions(supabase, userId, governance?.findings ?? [])
      decisionMemory = formatDecisionsForPrompt(relevantDecisions)
    } catch {
      decisionMemory = []
    }
  }

  if (!apiKey || !baseAdvice.diagnoses?.length) {
    return baseAdvice
  }

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2200,
        system: buildSystemPrompt(),
        messages: [{
          role: 'user',
          content: buildUserMessage({ governance, brain, intelligenceBrief, deterministicAdvice: baseAdvice, decisionMemory }),
        }],
      }),
    })

    if (!response.ok) {
      return baseAdvice
    }

    const data = await response.json().catch(() => null)
    const raw = data?.content?.[0]?.text ?? ''
    if (!raw) return baseAdvice

    const parsed = JSON.parse(cleanJson(raw))
    return mergeAdvice(baseAdvice, parsed)
  } catch {
    return baseAdvice
  }
}
