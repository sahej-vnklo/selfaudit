const VALID_CONFIDENCE = new Set(['high', 'medium', 'low'])
const VALID_PRIORITY = new Set(['immediate', 'this_week', 'this_month', 'monitor'])

function cleanString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function cleanStringList(value, limit = 8) {
  return Array.isArray(value)
    ? value.map(cleanString).filter(Boolean).slice(0, limit)
    : []
}

export function normalizeCounselResult(value = {}) {
  return {
    answer: cleanString(value.answer) || 'I do not have enough verified information to answer that yet.',
    root_cause: cleanString(value.root_cause),
    severity_score: value.severity_score != null && Number.isFinite(Number(value.severity_score))
      ? Math.max(0, Math.min(10, Number(value.severity_score)))
      : null,
    financial_impact: cleanString(value.financial_impact),
    fix_priority: VALID_PRIORITY.has(value.fix_priority) ? value.fix_priority : 'monitor',
    execution_plan: cleanStringList(value.execution_plan, 6),
    evidence: cleanStringList(value.evidence, 8),
    assumptions: cleanStringList(value.assumptions, 6),
    missing_data: cleanStringList(value.missing_data, 6),
    confidence: VALID_CONFIDENCE.has(value.confidence) ? value.confidence : 'low',
    follow_up_question: cleanString(value.follow_up_question),
    risks_found: cleanStringList(value.risks_found, 6),
    opportunities_found: cleanStringList(value.opportunities_found, 6),
  }
}

function latestTimestamp(rows, field) {
  if (!Array.isArray(rows)) return null
  return rows.map((row) => row?.[field]).filter(Boolean).sort().at(-1) || null
}

export function buildCounselSources(context = {}) {
  const structured = context.structured_context || {}
  const sources = []

  for (const source of context.sources_used || []) {
    if (source === 'decision_memory' || source === 'company_dna' || source === 'historical_memory') {
      sources.push({ key: source, label: source.replaceAll('_', ' '), freshness: null, kind: 'memory' })
      continue
    }

    if (source === 'risk_alerts') {
      sources.push({
        key: source,
        label: 'Sentinel alerts',
        freshness: latestTimestamp(structured.risk_alerts, 'created_at')
          || latestTimestamp((structured.risk_alerts || []).map((row) => row?.evidence_snapshot), 'checked_at'),
        kind: 'verified',
        records: (structured.risk_alerts || []).map((row) => ({
          id: row.id,
          title: row.title,
          metric_key: row.metric_key,
          metric_value: row.metric_value,
          threshold_value: row.threshold_value,
          comparator: row.comparator,
          checked_at: row.evidence_snapshot?.checked_at || row.created_at || null,
        })),
      })
      continue
    }

    if (source === 'health_checks') {
      sources.push({ key: source, label: 'Health check', freshness: structured.health_check?.checked_at || null, kind: 'verified' })
      continue
    }

    if (source === 'recent_audits') {
      sources.push({ key: source, label: 'Previous reports', freshness: latestTimestamp(structured.recent_audits, 'created_at'), kind: 'memory' })
      continue
    }

    if (source === 'intelligence_brief') {
      sources.push({ key: source, label: 'Business metrics', freshness: null, kind: 'verified' })
      continue
    }

    if (source === 'company_brain') {
      sources.push({ key: source, label: 'Business context', freshness: null, kind: 'memory' })
      continue
    }

    sources.push({ key: source, label: source.replaceAll('_', ' '), freshness: null, kind: 'connected' })
  }

  return sources
}

export function canOfferCounselReport(result, sources, priorMessageCount = 0) {
  const groundedSources = (sources || []).filter((source) => source.kind === 'verified' || source.kind === 'connected')
  return priorMessageCount >= 2
    && result.confidence !== 'low'
    && (result.evidence.length >= 2 || groundedSources.length >= 2)
}
