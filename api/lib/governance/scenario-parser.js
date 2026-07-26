import { CLAUDE_MODEL } from '../model-config.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const SYNONYMS = {
  churn_rate: ['churn', 'churn rate', 'customer churn'],
  mrr: ['mrr', 'monthly recurring revenue', 'monthly revenue'],
  pipeline_value: ['pipeline', 'pipeline value'],
  lead_volume: ['leads', 'lead volume'],
  stage_conversion: ['conversion', 'conversion rate'],
  burn_rate: ['burn', 'burn rate', 'monthly burn'],
  runway_months: ['runway', 'cash runway'],
  csat: ['csat', 'customer satisfaction', 'satisfaction'],
  headcount: ['headcount', 'team size', 'employees'],
}

const ACTION_WITH_UNSTATED_EFFECT = /\b(hire|launch|invest|automate|outsource|open|close|replace|enter|expand|delay|reorganize|restructure)\b/i

function metricNames(metric) {
  return [
    metric.label?.toLowerCase(),
    metric.key?.replace(/_/g, ' ').toLowerCase(),
    ...(SYNONYMS[metric.key] || []),
  ].filter(Boolean)
}

function findMetric(question, metrics) {
  const lower = question.toLowerCase()
  return [...metrics]
    .sort((a, b) => String(b.label || '').length - String(a.label || '').length)
    .find((metric) => metricNames(metric).some((name) => lower.includes(name)))
}

function readRequestedChange(question) {
  const lower = question.toLowerCase()
  const targetMatch = lower.match(/\b(?:to|at|reaches?|hits?)\s*\$?(-?\d+(?:\.\d+)?)/)
  const byMatch = lower.match(/\bby\s*\$?(-?\d+(?:\.\d+)?)/)
  const numberMatches = [...lower.matchAll(/\$?(-?\d+(?:\.\d+)?)/g)]
  const selected = targetMatch?.[1] ?? byMatch?.[1] ?? numberMatches[0]?.[1]
  if (selected == null) return null

  const rawValue = Math.abs(Number(selected))
  if (!Number.isFinite(rawValue)) return null
  const isDecrease = /drop|decreas|declin|fall|reduce|cut|lower|lose/.test(lower)
  const isIncrease = /increase|grow|rise|raise|improve|higher|add/.test(lower)
  const explicitTarget = Boolean(targetMatch)
  const percentChange = Boolean(byMatch) || (lower.includes('%') && (isDecrease || isIncrease) && !explicitTarget)
  const operation = explicitTarget ? 'set' : percentChange ? 'percent' : 'set'
  const value = operation === 'percent' && isDecrease ? -rawValue : rawValue
  return { operation, value }
}

export function parseDeterministicScenario(question, metrics = []) {
  const clean = String(question || '').trim()
  if (!clean) return null
  const metric = findMetric(clean, metrics)
  const requested = readRequestedChange(clean)
  if (!metric || !requested) return null

  // An action such as "hire two people" needs an effect model, not a blind
  // headcount override. Let the structured interpreter identify what is absent.
  if (ACTION_WITH_UNSTATED_EFFECT.test(clean) && !/\b(burn|runway|churn|mrr|pipeline|conversion|csat)\b/i.test(clean)) {
    return null
  }

  return {
    version: 2,
    title: clean,
    question: clean,
    mode: 'metric_stress_test',
    action: null,
    changes: [{
      metricKey: metric.key,
      label: metric.label,
      operation: requested.operation,
      value: requested.value,
      evidenceType: 'user_assumption',
    }],
    costs: [],
    horizonMonths: null,
    statedAssumptions: [],
    parser: 'deterministic',
  }
}

function sanitizeAIResult(raw, question, metrics) {
  const allowed = new Map(metrics.map((metric) => [metric.key, metric]))
  const changes = Array.isArray(raw?.changes)
    ? raw.changes
      .filter((change) =>
        allowed.has(change?.metric_key)
        && ['set', 'percent', 'absolute'].includes(change?.operation)
        && Number.isFinite(Number(change?.value))
        && change?.explicitly_stated === true
      )
      .map((change) => ({
        metricKey: change.metric_key,
        label: allowed.get(change.metric_key).label,
        operation: change.operation,
        value: Number(change.value),
        evidenceType: 'user_assumption',
      }))
    : []

  const costs = Array.isArray(raw?.costs)
    ? raw.costs
      .filter((cost) => Number.isFinite(Number(cost?.amount)) && cost?.explicitly_stated === true)
      .map((cost) => ({
        label: String(cost.label || 'Stated cost').slice(0, 120),
        amount: Number(cost.amount),
        cadence: ['one_time', 'monthly', 'annual'].includes(cost.cadence) ? cost.cadence : 'one_time',
        evidenceType: 'user_assumption',
      }))
    : []

  return {
    version: 2,
    title: String(raw?.title || question).slice(0, 180),
    question,
    mode: changes.length ? (raw?.mode === 'decision' ? 'decision' : 'metric_stress_test') : 'insufficient_evidence',
    action: raw?.action_description ? { description: String(raw.action_description).slice(0, 500) } : null,
    changes,
    costs,
    horizonMonths: Number.isFinite(Number(raw?.horizon_months)) ? Number(raw.horizon_months) : null,
    statedAssumptions: Array.isArray(raw?.stated_assumptions)
      ? raw.stated_assumptions.map((item) => String(item).slice(0, 300)).slice(0, 6)
      : [],
    missingInputs: Array.isArray(raw?.missing_inputs)
      ? raw.missing_inputs.map((item) => String(item).slice(0, 300)).slice(0, 6)
      : [],
    parser: 'structured_ai',
  }
}

export async function interpretScenarioQuestion(question, metrics = [], { apiKey = process.env.CLAUDE_API_KEY } = {}) {
  const deterministic = parseDeterministicScenario(question, metrics)
  if (deterministic) return deterministic

  if (!apiKey) {
    return {
      version: 2,
      title: String(question || '').slice(0, 180),
      question: String(question || ''),
      mode: 'insufficient_evidence',
      action: null,
      changes: [],
      costs: [],
      horizonMonths: null,
      statedAssumptions: [],
      missingInputs: ['Name the business metric to change and the amount of the change.'],
      parser: 'fallback',
    }
  }

  const metricCatalog = metrics.map((metric) => ({
    key: metric.key,
    label: metric.label,
    unit: metric.unit,
  }))
  const prompt = `Extract only what the operator explicitly stated in this business scenario.

QUESTION:
${String(question || '').slice(0, 2000)}

AVAILABLE METRICS:
${JSON.stringify(metricCatalog)}

Rules:
- Do not estimate, recommend, infer an impact, or invent a number.
- A change may be returned only when the operator explicitly names the metric and amount.
- If the operator describes an action but not its measurable effect, return no changes and list the missing inputs.
- Costs may be returned only when explicitly stated.
- Use mode "decision" when an action is named, otherwise "metric_stress_test".
- Output only valid JSON.

{
  "title": "short title",
  "mode": "decision | metric_stress_test",
  "action_description": "explicit action or null",
  "changes": [
    {
      "metric_key": "one available metric key",
      "operation": "set | percent | absolute",
      "value": 0,
      "explicitly_stated": true
    }
  ],
  "costs": [
    {
      "label": "cost description",
      "amount": 0,
      "cadence": "one_time | monthly | annual",
      "explicitly_stated": true
    }
  ],
  "horizon_months": null,
  "stated_assumptions": [],
  "missing_inputs": ["specific fact required to model the action"]
}`

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!response.ok) throw new Error(`Scenario interpreter failed with ${response.status}`)
    const payload = await response.json()
    const text = payload.content?.[0]?.text || ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return sanitizeAIResult(parsed, String(question || ''), metrics)
  } catch {
    return {
      version: 2,
      title: String(question || '').slice(0, 180),
      question: String(question || ''),
      mode: 'insufficient_evidence',
      action: null,
      changes: [],
      costs: [],
      horizonMonths: null,
      statedAssumptions: [],
      missingInputs: ['The scenario could not be structured safely. State the metric, change, cost, and time horizon explicitly.'],
      parser: 'fallback',
    }
  }
}
