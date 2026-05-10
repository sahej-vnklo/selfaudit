// Agent planner — deterministic intent classification and data need mapping.
// No LLM involved. Pure keyword matching and rule-based logic.

// ── Intent classification ─────────────────────────────────────────────────────

const INTENT_PATTERNS = [
  {
    intent: 'revenue_stuck',
    patterns: [/revenue.*(stuck|flat|plateau|not.grow|stagnant|same)/i, /stuck.*revenue/i, /growth.*(slow|stopped|stall)/i, /why.*not.*grow/i, /not.*hitting.*target/i],
  },
  {
    intent: 'pipeline_issue',
    patterns: [/pipeline/i, /deals?.*(stuck|slow|no|empty|dry)/i, /leads?.*(convert|close|not)/i, /sales.*(funnel|cycle|process)/i, /prospect/i, /closing.*rate/i, /not.*closing/i],
  },
  {
    intent: 'churn_issue',
    patterns: [/churn/i, /cancel|cancelling/i, /losing.*customer/i, /customer.*leav/i, /retention/i, /why.*customer.*leav/i, /renewal/i],
  },
  {
    intent: 'hiring_decision',
    patterns: [/hire|hiring|should.*employ|bring.*on/i, /need.*salesperson|need.*sales rep/i, /headcount/i, /expand.*team/i, /afford.*hire/i, /when.*hire/i],
  },
  {
    intent: 'pricing_decision',
    patterns: [/pric(e|ing|ed)/i, /raise.*price|lower.*price|change.*price/i, /how much.*charge/i, /package|tier|plan.*cost/i, /undercharg|overcharg/i],
  },
  {
    intent: 'operations_bottleneck',
    patterns: [/bottleneck/i, /slow.*down|slowing.*down/i, /what.*fix|where.*broken/i, /operational/i, /process.*broken|broken.*process/i, /inefficien/i, /leaking/i, /where.*wast/i],
  },
  {
    intent: 'general_strategy',
    patterns: [/strategy|strategic/i, /direction/i, /priorit/i, /focus/i, /what.*should.*do/i, /advice/i, /recommend/i, /this.*week|next.*quarter/i],
  },
]

export function classifyAgentIntent(query) {
  const q = String(query || '').trim()
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(q))) return intent
  }
  return 'general_strategy'
}

// ── Data needs per intent ─────────────────────────────────────────────────────

const DATA_NEEDS = {
  revenue_stuck: ['company_brain', 'intelligence_brief', 'hubspot_pipeline', 'hubspot_contacts', 'recent_audits', 'risk_alerts'],
  pipeline_issue: ['company_brain', 'hubspot_pipeline', 'hubspot_contacts', 'recent_audits', 'risk_alerts'],
  churn_issue: ['company_brain', 'intelligence_brief', 'hubspot_contacts', 'recent_audits', 'risk_alerts'],
  hiring_decision: ['company_brain', 'intelligence_brief', 'recent_audits', 'risk_alerts'],
  pricing_decision: ['company_brain', 'intelligence_brief', 'hubspot_pipeline', 'recent_audits'],
  operations_bottleneck: ['company_brain', 'intelligence_brief', 'recent_audits', 'risk_alerts', 'health_checks'],
  general_strategy: ['company_brain', 'intelligence_brief', 'recent_audits', 'risk_alerts', 'health_checks'],
}

export function planDataNeeds(intent) {
  return DATA_NEEDS[intent] ?? DATA_NEEDS.general_strategy
}

// ── Available source detection ────────────────────────────────────────────────

export function getAvailableDataSources(userBrain, integrations) {
  const sources = ['company_brain', 'recent_audits', 'health_checks', 'risk_alerts']

  if (userBrain?.intelligence_summary || userBrain?.top_priorities?.length) {
    sources.push('intelligence_brief')
  }

  if (integrations?.hubspot?.access_token) {
    sources.push('hubspot_pipeline', 'hubspot_contacts')
  }

  return sources
}

// ── Investigation plan ────────────────────────────────────────────────────────

export function buildAgentInvestigationPlan(intent, query, availableSources) {
  const needed   = planDataNeeds(intent)
  const available = availableSources.filter((s) => needed.includes(s))
  const missing   = needed.filter((s) => !availableSources.includes(s))

  const steps = []

  if (available.includes('company_brain'))    steps.push('Load company brain — business model, goals, known blockers')
  if (available.includes('intelligence_brief')) steps.push('Load intelligence brief — verified financial and operational metrics')
  if (available.includes('hubspot_pipeline')) steps.push('Fetch HubSpot pipeline — open deals, stages, closing soon')
  if (available.includes('hubspot_contacts')) steps.push('Fetch HubSpot contacts — lifecycle stages, new contacts this month')
  if (available.includes('recent_audits'))    steps.push('Load recent audit findings — domain statuses and root causes')
  if (available.includes('health_checks'))    steps.push('Load latest health check — score and risk breakdown')
  if (available.includes('risk_alerts'))      steps.push('Load open risk alerts — active flagged issues')

  if (missing.length > 0) {
    steps.push(`Note missing context: ${missing.join(', ')} — flag assumptions where data is absent`)
  }

  steps.push('Synthesise evidence → generate finding with root cause, severity, and action plan')

  return {
    intent,
    query,
    needed_sources:  needed,
    available_sources: available,
    missing_sources: missing,
    investigation_steps: steps,
  }
}
