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

function buildBlueprintContext(blueprint) {
  if (!blueprint) return null

  const areas     = blueprint.areas     ?? []
  const unitTypes = blueprint.unitTypes ?? []
  const compound  = blueprint.compoundRules ?? []

  // Group unit types by area id so we can list them under each area
  const unitsByArea = {}
  for (const unit of unitTypes) {
    for (const areaId of (unit.areas ?? [])) {
      if (!unitsByArea[areaId]) unitsByArea[areaId] = []
      unitsByArea[areaId].push(unit)
    }
  }

  const areaLines = areas.map(area => {
    const objective = area.businessLogic?.objective ?? ''
    const questions = area.businessLogic?.questions ?? []
    const units     = unitsByArea[area.id] ?? []

    const unitDesc = units.map(u => {
      const props = (u.properties ?? []).slice(0, 4).map(p => p.key).join(', ')
      return `${u.label}${props ? ` [${props}]` : ''}`
    }).join('; ')

    const lines = [`${area.label}: ${objective}`]
    if (questions.length) lines.push(`  Diagnose: ${questions.join(' | ')}`)
    if (unitDesc)         lines.push(`  Entities: ${unitDesc}`)
    return lines.join('\n')
  })

  const compoundLines = compound.length
    ? `\nCross-area risks:\n${compound.map(r => `- ${r.title}: ${r.summary}`).join('\n')}`
    : ''

  return `Industry: ${blueprint.industry ?? 'unknown'}\n\nSelected areas:\n${areaLines.join('\n\n')}${compoundLines}`
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
- Areas listed in zero_coverage_areas have NO measured data at all. Do not reference them, do not generate diagnoses or alert_candidates for them, and do not mention them in the summary.
- Set recurring: true on a diagnosis or alert_candidate when its pattern clearly matches something in repeated_blockers. Set recurring: false otherwise.
- When business_blueprint is provided, ground every diagnosis in the actual areas and entity types defined there. Reference entities by their real name (e.g. "Deal", "Customer", "SupportTicket") not generic terms. Let the area objectives and diagnostic questions shape the framing of each finding.

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
      "recommendation": "Best next move.",
      "recurring": false
    }
  ],
  "recommended_actions": ["Action 1", "Action 2"],
  "alert_candidates": [
    {
      "category": "finance-accounting",
      "title": "Runway is critical",
      "description": "Sharper alert description.",
      "recommended_action": "Best next move.",
      "recurring": false
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
    changes_since_last: brain?.changes_since_last?.slice(0, 5) ?? [],
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

function buildUserMessage({ governance, brain, intelligenceBrief, deterministicAdvice, decisionMemory = [], blueprint = null }) {
  const zeroCoverageAreas = (governance?.areas ?? [])
    .filter((a) => !a.coverage || a.coverage === 0)
    .map((a) => a.areaId)

  const payload = {
    business_snapshot: buildBusinessSnapshot(brain, intelligenceBrief),
    governance_summary: governance?.summary ?? {},
    findings_by_area: buildFindingsByArea(governance),
    ...(zeroCoverageAreas.length > 0 ? { zero_coverage_areas: zeroCoverageAreas } : {}),
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

  const blueprintContext = buildBlueprintContext(blueprint)
  if (blueprintContext) {
    payload.business_blueprint = blueprintContext
  }

  return `Review these governance findings and improve the diagnosis quality without changing the underlying facts or severity.

Rules:
- Use the provided metrics and evidence only.
- Keep the same number of diagnoses unless evidence clearly does not support one of them.
- Keep advice practical and founder-level.
- If data is thin, say what is likely instead of pretending certainty.
- Recommended actions should be specific and non-duplicative.
- Do not generate any diagnoses or alert_candidates for areas listed in zero_coverage_areas — no data was collected for them.
- If business_blueprint is present: read it first. Let the area objectives and entity types (Deals, Customers, SupportTickets, etc.) shape the language and framing of every diagnosis. Reference the actual entities by name, not generic terms.

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
      recurring: typeof overlay.recurring === 'boolean' ? overlay.recurring : (item.recurring ?? false),
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
      recurring: typeof overlay.recurring === 'boolean' ? overlay.recurring : (item.recurring ?? false),
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

// After AI enrichment sharpens diagnoses, copy the enriched rootCause/impact back
// onto matching alert_candidates (they're 1:1 by category::title from advice.js).
// The AI's alert_candidate output schema doesn't include these fields, so we pull
// from the already-merged diagnoses instead of expecting them from Claude.
function applyDiagnosisRootCauseToAlerts(alertCandidates, diagnoses) {
  if (!Array.isArray(alertCandidates) || !Array.isArray(diagnoses)) return alertCandidates
  const diagByKey = indexBy(diagnoses, (d) => `${d.areaId}::${d.title}`)

  return alertCandidates.map((alert) => {
    const diag = diagByKey.get(`${alert.category}::${alert.title}`)
    if (!diag) return alert
    return {
      ...alert,
      rootCause: diag.rootCause ?? alert.rootCause ?? null,
      impact:    diag.impact    ?? alert.impact    ?? null,
    }
  })
}

function mergeAdvice(base, parsed, zeroCoverageAreas = []) {
  const blocked = new Set(zeroCoverageAreas)
  const diagnoses = mergeDiagnoses(base.diagnoses, parsed?.diagnoses)
    .filter((d) => !blocked.has(d.areaId))
  const alertCandidates = applyDiagnosisRootCauseToAlerts(
    mergeAlertCandidates(base.alert_candidates, parsed?.alert_candidates)
      .filter((a) => !blocked.has(a.category)),
    diagnoses,
  )
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
  blueprint = null,
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
          content: buildUserMessage({ governance, brain, intelligenceBrief, deterministicAdvice: baseAdvice, decisionMemory, blueprint }),
        }],
      }),
    })

    if (!response.ok) {
      return baseAdvice
    }

    const data = await response.json().catch(() => null)
    const raw = data?.content?.[0]?.text ?? ''
    if (!raw) return baseAdvice

    const zeroCoverageAreas = (governance?.areas ?? [])
      .filter((a) => !a.coverage || a.coverage === 0)
      .map((a) => a.areaId)
    const parsed = JSON.parse(cleanJson(raw))
    return mergeAdvice(baseAdvice, parsed, zeroCoverageAreas)
  } catch {
    return baseAdvice
  }
}
