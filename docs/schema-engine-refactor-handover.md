# SelfAudit — Schema-Driven Engine Refactor (Handover Spec)

## INSTRUCTIONS FOR THE CLAUDE PICKING THIS UP

You are picking up a refactor task on the SelfAudit repo (sahej-vnklo/selfaudit).

**SCOPE: Build only the refactor described in this document — 4 new files, 3 modified files, deletions. The "Onboarding Flow" and "Product Strategy" sections at the end are context for later phases — do NOT build them in this session.**

**Git rules:**
- Work on a new branch: `schema-engine-refactor`
- Do not push to main
- If the repo has tests, run them before starting (baseline) and after finishing (regression check)
- Commit in logical units (new files → modifications → deletions)

**Before writing any code, read these 5 files first to understand the existing wiring:**
- `api/lib/governance/monitoring.js`
- `api/lib/governance/advice.js`
- `api/lib/governance/area-registry.js`
- `api/lib/governance/metric-snapshots.js`
- `api/lib/governance/shared/contracts.js`

**Then follow the implementation spec in this document exactly, in the order listed.**

Rules:
- Do not refactor anything beyond what is specified
- Do not rename existing exports unless the spec says to
- Do not add error handling or abstractions beyond what is shown
- The goal is a clean migration — same behaviour, schema-driven instead of hardcoded
- When migrating the `buildMetrics` logic for each area, verify it matches the original logic in `metric-snapshots.js` exactly. If the code in this spec differs from what the original files do, the original files win — flag the discrepancy in your final summary instead of silently choosing.

**After completing all changes, verify BOTH of the following:**

**Check 1 — structure intact (empty input):**
Call `runGovernanceMonitoring` with `{ brain: null, brief: null, normalized: null }` and confirm the returned object contains:
- `areas` — array of area results
- `findings` — flat array of all findings
- `compoundFindings` — cross-area signals
- `causalDiagnosis` — present as a key (will be `null` with empty input — that's expected)

**Check 2 — causal engine actually fires (stressed input):**
Call `runGovernanceMonitoring` with a mock brief that trips rules, e.g.:
```js
runGovernanceMonitoring({
  brain: null,
  normalized: null,
  brief: { financial: { churn: 6, runway: 4 }, operational: {}, context: {} },
})
```
Confirm:
- `findings` contains the churn and runway findings
- `causalDiagnosis` is a non-null object containing `trigger`, `rootCause` (with `causalChain`), `downstreamRisks`, and `immediateAction`

If both checks pass and existing fields are intact, the migration is complete.

---

## HOW THIS STARTED — CrownRing Second-Order Effects

**Sahej's question:**
"Most things at CrownRing run on computer, rest runs on machines in factories producing rings but then they also come to computer as data. How can I initiate a layer that identifies the second order effect at the beginning of the chain — specially for most basic things like workflow, a process, a task handover — and then suggest what to do instead."

**The answer:**
This is exactly what SelfAudit can be extended to do — not just for SaaS metrics but for any operational chain. The idea: define the objects in your business (Order, Machine, Material, Dealer, Employee), define how they connect, and the system watches for stress in one object and projects what breaks downstream before it happens.

That question led directly into looking at the SelfAudit codebase.

---

## SELFAUDIT CODEBASE — WHAT IT IS TODAY

SelfAudit (repo: sahej-vnklo/selfaudit) is a governance monitoring product with two pipelines:

**Pipeline 1 — Governance (continuous monitoring):**
- Pulls metrics from connected tools (Stripe, HubSpot, Zendesk, Notion, Slack)
- Evaluates them against threshold rules per area
- Detects cross-area compound signals
- Generates advice and recommended actions
- Claude overlay adds narrative context on top

**Pipeline 2 — Conversational Agent:**
- Planner gathers context (company brain + governance state)
- Agent-X runs diagnostic conversation
- Agent-Y generates solutions
- Single-turn and multi-turn modes

**Merge point:** `audit.js` injects governance findings into the agent system prompt so the conversation is always grounded in real operational data.

---

## THE PROBLEM WITH THE CURRENT ARCHITECTURE

The entire governance engine is hardcoded for exactly 4 business areas:
- `customer-service`
- `finance-accounting`
- `management-strategy`
- `marketing-sales`

**Files where this hardcoding lives:**
- `shared/governance/operational-areas.js` — hardcoded array of 4 area IDs
- `api/lib/governance/area-registry.js` — AREA_MODULES and AREA_EVALUATORS as hardcoded imports
- `api/lib/governance/areas/*/index.js` — 4 separate area files with metrics + rules in JS
- `api/lib/governance/metric-snapshots.js` — 4 hardcoded build*Metrics functions
- `api/lib/governance/monitoring.js` — evaluateCompoundRules() as hardcoded if-blocks
- `api/lib/governance/advice.js` — buildImpact() with hardcoded if-blocks per metric key

**The consequence:** If a new company type needs different areas (like CrownRing needing Order, Machine, Dealer areas), a developer has to rewrite the engine. The product only works for one type of company.

---

## THE SHIFT — SCHEMA-DRIVEN ARCHITECTURE

Business structure defined as data, not code. The platform is generic — it reasons against whatever schema you define.

**What we're building:**

3 layers, each owning the right thing:

| Layer | What it does | Who defines it |
|---|---|---|
| Schema | Areas, metrics, thresholds | Company (via dashboard eventually) |
| Engine | Generic evaluation, rule running | Us — never changes |
| Causal engine | Universal business relationships, second-order tracing | Us — hardcoded IP |

**Key insight on the moat:**
The schema is configurable. The causal relationships are NOT configurable. Users define what to watch — the product already knows how things connect and what cascades when something breaks. That's the intelligence. That's what can't be replicated quickly.

---

## FULL IMPLEMENTATION SPEC

### Files to CREATE (4 new files)

---

#### 1. `api/lib/blueprint/schema.js`

```js
export { createMetricDefinition, createThresholdRule, createRulePack } from '../governance/shared/contracts.js'

export function createCompoundRule({ id, conditions, title, summary, recommendation, severity = 'high', status = 'bad' }) {
  return { id, conditions, title, summary, recommendation, severity, status }
}

export function createObject({ id, label, description = '', properties = [], relationships = [] }) {
  return { id, label, description, properties, relationships }
}

export function createArea({ id, label, connectors = [], businessLogic = {}, metricFamilies = [], defaultRulePack = {}, buildMetrics }) {
  return { id, label, connectors, businessLogic, metricFamilies, defaultRulePack, buildMetrics }
}

export function createSchema({ id, label, areas = [], objects = [], compoundRules = [] }) {
  return { id, label, areas, objects, compoundRules }
}
```

Note: No `createRelationship` — relationships are hardcoded in the causal engine, not user-defined.

---

#### 2. `api/lib/blueprint/schemas/saas-startup.js`

This file migrates all 4 existing area files + compound rules from monitoring.js + metric-building logic from metric-snapshots.js into one schema. The engine reads this instead of the 4 separate area files.

**IMPORTANT: The `buildMetrics` functions below must replicate the original logic from `metric-snapshots.js` exactly. Cross-check each one against the original before committing. The originals win over this spec.**

```js
import {
  createMetricDefinition, createThresholdRule, createRulePack,
  createArea, createCompoundRule, createSchema, createObject,
} from '../schema.js'
import { normalizeGovernanceMetrics } from '../../governance/shared/contracts.js'

function metric(key, value, source, metadata = {}) {
  if (value == null || Number.isNaN(value)) return null
  return { key, value, source, ...metadata }
}

function ratio(numerator, denominator) {
  const top = Number(numerator)
  const bottom = Number(denominator)
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= 0) return null
  return Number(((top / bottom) * 100).toFixed(1))
}

function safeNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const customerServiceArea = createArea({
  id: 'customer-service',
  label: 'Customer Service',
  connectors: ['zendesk', 'gmail'],
  businessLogic: {
    objective: 'Protect customer trust by keeping support fast, reliable, and free of repeating failures.',
    questions: [
      'Are customers waiting too long for help?',
      'Are the same issues coming back instead of being fixed properly?',
      'Is service quality slipping in ways that could hurt retention?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'ticket_volume', label: 'Ticket volume', unit: 'count', description: 'Total incoming support load over the selected period.', preferredDirection: 'contextual', defaultInterpretation: 'Volume alone is not bad, but sudden surges can signal product or service stress.' }),
    createMetricDefinition({ key: 'first_response_time', label: 'First response time', unit: 'hours', description: 'How long customers wait for the first meaningful reply.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Long waits reduce trust and make issue escalation more likely.' }),
    createMetricDefinition({ key: 'resolution_time', label: 'Resolution time', unit: 'hours', description: 'How long it takes to fully resolve customer issues.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Slow resolution usually means handoff friction or unclear ownership.' }),
    createMetricDefinition({ key: 'repeat_issue_rate', label: 'Repeat issue rate', unit: 'percent', description: 'How often the same issue returns or reopens.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Repeats mean the team is treating symptoms, not root causes.' }),
    createMetricDefinition({ key: 'csat', label: 'Customer satisfaction', unit: 'score', description: 'Customer-reported service satisfaction signal.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Falling satisfaction is an early warning that service quality is hurting customer confidence.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'customer-service:first-response-watch', metricKey: 'first_response_time', comparator: 'gt', value: 8, status: 'watch', severity: 'medium', title: 'Support response time is slowing', summary: 'Customers are waiting longer than a healthy same-day response window.', recommendation: 'Review queue coverage and owner handoffs before slow replies become normal.', rationale: 'Support trust starts with speed. Slow first responses often show capacity or process strain.' }),
      createThresholdRule({ id: 'customer-service:first-response-bad', metricKey: 'first_response_time', comparator: 'gt', value: 24, status: 'bad', severity: 'high', title: 'Support response time is at risk', summary: 'Customers are waiting more than a day for a first response.', recommendation: 'Prioritize queue triage, assign backup coverage, and reduce time-to-first-touch immediately.', rationale: 'Multi-day waits usually mean customers feel ignored and are more likely to churn or escalate.' }),
      createThresholdRule({ id: 'customer-service:resolution-watch', metricKey: 'resolution_time', comparator: 'gt', value: 48, status: 'watch', severity: 'medium', title: 'Issue resolution is dragging', summary: 'Customer issues are taking more than two days to close.', recommendation: 'Audit common blockers and tighten escalation paths for stuck issues.', rationale: 'Long resolution times usually indicate unclear ownership or repeated back-and-forth.' }),
      createThresholdRule({ id: 'customer-service:repeat-issue-bad', metricKey: 'repeat_issue_rate', comparator: 'gt', value: 20, status: 'bad', severity: 'high', title: 'Repeat issues are too common', summary: 'Too many customer problems are reopening or coming back.', recommendation: 'Identify the top recurring issue types and fix the underlying process or product cause.', rationale: 'Recurring issues are a direct sign of operational debt in service delivery.' }),
      createThresholdRule({ id: 'customer-service:csat-bad', metricKey: 'csat', comparator: 'lt', value: 80, status: 'bad', severity: 'high', title: 'Customer satisfaction is slipping', summary: 'Service satisfaction has dropped below a healthy confidence line.', recommendation: 'Review the latest negative interactions and isolate the causes behind dissatisfaction.', rationale: 'Falling satisfaction often appears before churn or escalation becomes obvious.' }),
    ],
    notes: [
      'Watch backlog growth, slow responses, repeated complaints, and satisfaction drops.',
      'This area should answer: are customers getting help fast enough, and are the same problems recurring?',
    ],
  }),
  buildMetrics({ brief }) {
    const operational = brief?.operational ?? {}
    const metrics = [
      metric('ticket_volume', safeNumber(operational.support_tickets_per_week), 'intelligence_brief'),
    ].filter(Boolean)
    return { metrics, sources: metrics.length ? ['intelligence_brief'] : [] }
  },
})

const financeAccountingArea = createArea({
  id: 'finance-accounting',
  label: 'Finance & Accounting',
  connectors: ['stripe'],
  businessLogic: {
    objective: 'Protect cash, margins, and unit economics so the business can keep executing without hidden financial fragility.',
    questions: [
      'Is the business retaining enough revenue to justify growth?',
      'Is cash health strong enough to support the current plan?',
      'Are unit economics healthy, or is the company scaling something fragile?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'mrr', label: 'Monthly recurring revenue', unit: 'currency', description: 'Recurring monthly revenue baseline.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Revenue trend matters, but on its own MRR does not tell you whether the business is healthy.' }),
    createMetricDefinition({ key: 'churn_rate', label: 'Churn rate', unit: 'percent', description: 'Rate at which customers or revenue are being lost.', preferredDirection: 'lower-is-better', defaultInterpretation: 'High churn means growth effort is leaking out faster than it should.' }),
    createMetricDefinition({ key: 'burn_rate', label: 'Burn rate', unit: 'currency', description: 'Average monthly cash burn.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Burn is not always bad, but it must match runway and growth reality.' }),
    createMetricDefinition({ key: 'runway_months', label: 'Runway', unit: 'months', description: 'Estimated months before cash runs out at current burn.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Short runway removes strategic choices and forces reactive decisions.' }),
    createMetricDefinition({ key: 'ltv_cac_ratio', label: 'LTV to CAC', unit: 'ratio', description: 'Unit-economics health signal comparing customer value to acquisition cost.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Weak unit economics mean the business may be scaling something that does not pay back cleanly.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'finance-accounting:churn-watch', metricKey: 'churn_rate', comparator: 'gt', value: 2, status: 'watch', severity: 'medium', title: 'Churn is above a healthy line', summary: 'Revenue or customer loss is starting to compound against growth.', recommendation: 'Review the main churn reasons and isolate which customers are most at risk.', rationale: 'Elevated churn is one of the clearest signs that operational and product issues are leaking revenue.' }),
      createThresholdRule({ id: 'finance-accounting:churn-bad', metricKey: 'churn_rate', comparator: 'gt', value: 5, status: 'bad', severity: 'high', title: 'Churn is materially high', summary: 'Too much revenue is leaking out every month for healthy compounding growth.', recommendation: 'Treat churn reduction as a top operating priority and run a focused retention diagnosis.', rationale: 'At this level, churn is usually hiding deeper delivery, product, or fit issues.' }),
      createThresholdRule({ id: 'finance-accounting:runway-watch', metricKey: 'runway_months', comparator: 'lt', value: 12, status: 'watch', severity: 'high', title: 'Runway is getting tight', summary: 'The company has less than a year of runway at the current burn.', recommendation: 'Start scenario planning now rather than waiting for the business to become reactive.', rationale: 'Sub-12-month runway compresses optionality and increases decision pressure.' }),
      createThresholdRule({ id: 'finance-accounting:runway-bad', metricKey: 'runway_months', comparator: 'lt', value: 6, status: 'bad', severity: 'critical', title: 'Runway is critical', summary: 'The company has less than six months of runway remaining.', recommendation: 'Cut non-essential spend, accelerate collections, and make immediate capital planning decisions.', rationale: 'Below six months, financial fragility becomes an existential operating issue.' }),
      createThresholdRule({ id: 'finance-accounting:ltv-cac-watch', metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 3, status: 'watch', severity: 'medium', title: 'Unit economics are thinner than ideal', summary: 'Customer value is not outpacing acquisition cost by a healthy margin.', recommendation: 'Look for the fastest path to improve retention, pricing, or acquisition efficiency.', rationale: 'Below 3x LTV:CAC, scaling can create pressure faster than value.' }),
      createThresholdRule({ id: 'finance-accounting:ltv-cac-bad', metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 1, status: 'bad', severity: 'critical', title: 'Unit economics are upside down', summary: 'The business is spending as much or more to acquire customers than they return.', recommendation: 'Pause aggressive growth spend and fix the economics before scaling further.', rationale: 'This is a strong sign that growth is amplifying operational debt instead of solving it.' }),
    ],
    notes: [
      'Watch cash stress, weak unit economics, revenue loss, and concentration risk.',
      'This area should answer: is the business financially healthy enough to keep executing the plan?',
    ],
  }),
  buildMetrics({ brief, normalized }) {
    const financial = brief?.financial ?? {}
    const context = brief?.context ?? {}
    const stripe = {}
    if (normalized?.metrics) {
      for (const m of normalized.metrics.filter(m => m.source === 'stripe')) {
        stripe[m.key] = m.value
      }
    }
    const mrr = stripe.mrr ?? safeNumber(financial.mrr)
    const churn = stripe.churn_rate ?? safeNumber(financial.churn)
    const ltv = stripe.ltv ?? safeNumber(financial.ltv)
    const cac = safeNumber(financial.cac)
    const burnRate = safeNumber(financial.burn_rate)
    const runway = safeNumber(financial.runway ?? context.runway)
    const mrrSource = stripe.mrr != null ? 'stripe' : 'intelligence_brief'
    const churnSource = stripe.churn_rate != null ? 'stripe' : 'intelligence_brief'
    const ltvSource = stripe.ltv != null ? 'stripe' : 'intelligence_brief'
    const metrics = [
      metric('mrr', mrr, mrrSource),
      metric('churn_rate', churn, churnSource),
      metric('burn_rate', burnRate, 'intelligence_brief'),
      metric('runway_months', runway, 'intelligence_brief'),
      metric('ltv_cac_ratio',
        ltv != null && cac != null && cac > 0 ? Number((ltv / cac).toFixed(2)) : null,
        'derived', { derivedFrom: [ltvSource, 'intelligence_brief'] }
      ),
    ].filter(Boolean)
    return { metrics, sources: [...new Set(metrics.map(m => m.source === 'derived' ? mrrSource : m.source))] }
  },
})

const managementStrategyArea = createArea({
  id: 'management-strategy',
  label: 'Management & Strategy',
  connectors: ['notion', 'google_drive', 'slack'],
  businessLogic: {
    objective: 'Keep leadership focus clear and execution disciplined so growth is not slowed by indecision or follow-through gaps.',
    questions: [
      'Is the company actually executing against its stated priorities?',
      'Are blockers being cleared, or are they becoming normalized?',
      'Is management attention staying on the highest-leverage work?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'goal_progress', label: 'Goal progress', unit: 'percent', description: 'Progress toward the active company goal.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Healthy progress shows the company is converting priorities into real movement.' }),
    createMetricDefinition({ key: 'priority_backlog', label: 'Priority backlog', unit: 'count', description: 'Unresolved high-priority actions still sitting open.', preferredDirection: 'lower-is-better', defaultInterpretation: 'A large backlog means leadership is collecting priorities faster than it is clearing them.' }),
    createMetricDefinition({ key: 'repeated_blockers', label: 'Repeated blockers', unit: 'count', description: 'Operational blockers appearing across multiple cycles.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Repeated blockers are a strong sign of unmanaged operational debt.' }),
    createMetricDefinition({ key: 'watchouts', label: 'Watchouts', unit: 'count', description: 'Known issues that need continued management attention.', preferredDirection: 'lower-is-better', defaultInterpretation: 'Watchouts are fine if they are managed; too many means attention is diffusing.' }),
    createMetricDefinition({ key: 'followthrough_rate', label: 'Follow-through rate', unit: 'percent', description: 'How often agreed actions are actually completed on time.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Low follow-through means strategy is not surviving contact with the week-to-week operation.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'management-strategy:goal-progress-watch', metricKey: 'goal_progress', comparator: 'lt', value: 60, status: 'watch', severity: 'medium', title: 'Goal progress looks soft', summary: 'The company is behind a healthy pace on its active goal.', recommendation: 'Review what is blocking progress and whether priorities are too fragmented.', rationale: 'Slow progress is often an execution problem before it becomes a strategy problem.' }),
      createThresholdRule({ id: 'management-strategy:priority-backlog-bad', metricKey: 'priority_backlog', comparator: 'gt', value: 5, status: 'bad', severity: 'high', title: 'Priority backlog is too large', summary: 'Too many high-priority items are open at once.', recommendation: 'Reduce active priorities and force ownership, sequencing, and deadlines.', rationale: 'A swollen backlog usually means the company is spreading attention too thin.' }),
      createThresholdRule({ id: 'management-strategy:repeated-blockers-watch', metricKey: 'repeated_blockers', comparator: 'gt', value: 2, status: 'watch', severity: 'medium', title: 'Recurring blockers are stacking up', summary: 'The same execution blockers are appearing across multiple cycles.', recommendation: 'Stop treating them as one-off issues and fix the underlying operating constraint.', rationale: 'Repeated blockers are one of the clearest forms of operational debt.' }),
      createThresholdRule({ id: 'management-strategy:followthrough-watch', metricKey: 'followthrough_rate', comparator: 'lt', value: 80, status: 'watch', severity: 'medium', title: 'Follow-through is inconsistent', summary: 'Too many agreed actions are missing deadlines or staying unfinished.', recommendation: 'Tighten ownership, review cadence, and priority discipline.', rationale: 'This usually means the company is deciding well but executing weakly.' }),
      createThresholdRule({ id: 'management-strategy:followthrough-bad', metricKey: 'followthrough_rate', comparator: 'lt', value: 60, status: 'bad', severity: 'high', title: 'Follow-through is materially weak', summary: 'The business is not reliably converting decisions into completed work.', recommendation: 'Rebuild weekly execution discipline and cut active priorities until completion improves.', rationale: 'At this point, management debt itself is becoming the bottleneck.' }),
    ],
    notes: [
      'Watch goal slippage, repeated blockers, weak follow-through, and strategy-to-execution gaps.',
      'This area should answer: is leadership focus clear, and is the business actually executing on that focus?',
    ],
  }),
  buildMetrics({ brain }) {
    const sessions = brain?.recent_sessions ?? []
    const resolvedStatuses = new Set(['resolved', 'done', 'closed', 'complete', 'completed'])
    const followedThrough = sessions.filter(s => resolvedStatuses.has(String(s?.status || '').toLowerCase())).length
    const followthroughRate = sessions.length > 0 ? Number(((followedThrough / sessions.length) * 100).toFixed(1)) : null
    const metrics = [
      metric('goal_progress', safeNumber(brain?.goal_score), 'company_brain'),
      metric('priority_backlog', Array.isArray(brain?.top_priorities) ? brain.top_priorities.length : null, 'company_brain'),
      metric('repeated_blockers', Array.isArray(brain?.repeated_blockers) ? brain.repeated_blockers.length : null, 'company_brain'),
      metric('watchouts', Array.isArray(brain?.watchouts) ? brain.watchouts.length : null, 'company_brain'),
      metric('followthrough_rate', followthroughRate, 'derived', { derivedFrom: ['recent_sessions.status'] }),
    ].filter(Boolean)
    return { metrics, sources: [...new Set(metrics.map(m => m.source === 'derived' ? 'company_brain' : m.source))] }
  },
})

const marketingSalesArea = createArea({
  id: 'marketing-sales',
  label: 'Marketing & Sales',
  connectors: ['hubspot'],
  businessLogic: {
    objective: 'Keep demand creation and revenue generation healthy enough that growth does not stall silently.',
    questions: [
      'Is there enough pipeline to support the revenue goal?',
      'Are leads and deals actually progressing through the funnel?',
      'Is growth quality strong, or are we masking weak conversion with more activity?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'pipeline_value', label: 'Pipeline value', unit: 'currency', description: 'Total active pipeline value currently in motion.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Thin pipeline leaves no room for normal deal slippage.' }),
    createMetricDefinition({ key: 'open_deals', label: 'Open deals', unit: 'count', description: 'Number of active opportunities being worked.', preferredDirection: 'higher-is-better', defaultInterpretation: 'A very low deal count usually means revenue creation is underfed.' }),
    createMetricDefinition({ key: 'lead_volume', label: 'Lead volume', unit: 'count', description: 'New inbound or outbound lead flow.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Low lead flow makes future quarters fragile even if this month still looks fine.' }),
    createMetricDefinition({ key: 'stage_conversion', label: 'Stage conversion', unit: 'percent', description: 'How effectively opportunities progress through the funnel.', preferredDirection: 'higher-is-better', defaultInterpretation: 'Poor conversion means demand quality or sales process is breaking down.' }),
    createMetricDefinition({ key: 'sales_cycle_days', label: 'Sales cycle', unit: 'days', description: 'Average time it takes to convert a deal.', preferredDirection: 'lower-is-better', defaultInterpretation: 'A long sales cycle ties up revenue and usually hides friction in the funnel.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'marketing-sales:open-deals-bad', metricKey: 'open_deals', comparator: 'lt', value: 3, status: 'bad', severity: 'high', title: 'Pipeline is too thin', summary: 'There are not enough active deals to absorb normal fallout.', recommendation: 'Increase pipeline creation now and review where lead flow or qualification is slowing down.', rationale: 'A thin pipeline makes revenue highly fragile and reactive.' }),
      createThresholdRule({ id: 'marketing-sales:lead-volume-watch', metricKey: 'lead_volume', comparator: 'lt', value: 10, status: 'watch', severity: 'medium', title: 'Lead flow looks light', summary: 'New lead volume is below a healthy baseline for consistent pipeline growth.', recommendation: 'Review demand generation sources and top-of-funnel follow-up speed.', rationale: 'Weak lead flow shows up later as an empty pipeline if not corrected early.' }),
      createThresholdRule({ id: 'marketing-sales:stage-conversion-watch', metricKey: 'stage_conversion', comparator: 'lt', value: 25, status: 'watch', severity: 'medium', title: 'Deals are not progressing cleanly', summary: 'Conversion through the funnel is weaker than a healthy sales process should allow.', recommendation: 'Audit qualification, objections, and where opportunities are getting stuck.', rationale: 'Poor conversion usually means the team is filling the funnel but not moving revenue forward.' }),
      createThresholdRule({ id: 'marketing-sales:stage-conversion-bad', metricKey: 'stage_conversion', comparator: 'lt', value: 15, status: 'bad', severity: 'high', title: 'Conversion is materially weak', summary: 'Too little of the funnel is advancing into real revenue opportunities.', recommendation: 'Run a focused sales process diagnosis and fix qualification, messaging, or handoff gaps.', rationale: 'This is a strong sign of hidden operational debt in growth execution.' }),
      createThresholdRule({ id: 'marketing-sales:sales-cycle-watch', metricKey: 'sales_cycle_days', comparator: 'gt', value: 45, status: 'watch', severity: 'medium', title: 'Sales cycle is slowing', summary: 'Deals are taking longer than expected to close.', recommendation: 'Inspect delay points, approval friction, and follow-up quality in late-stage deals.', rationale: 'Long cycles often hide buyer hesitation or poor process discipline.' }),
    ],
    notes: [
      'Watch thin pipeline, stalled conversions, weak follow-through, and falling demand quality.',
      'This area should answer: is growth healthy, and where is revenue creation getting stuck?',
    ],
  }),
  buildMetrics({ brief, normalized }) {
    const operational = brief?.operational ?? {}
    const normalizedMetrics = normalizeGovernanceMetrics(normalized?.metrics)
    const leadVolume = normalizedMetrics.leads ?? normalizedMetrics.new_contacts_this_month ?? null
    const sqlCount = normalizedMetrics.sqls ?? null
    const metrics = [
      metric('pipeline_value', normalizedMetrics.open_pipeline_value ?? null, 'hubspot'),
      metric('open_deals', normalizedMetrics.open_deals ?? null, 'hubspot'),
      metric('lead_volume', leadVolume, 'hubspot'),
      metric('stage_conversion', leadVolume ? ratio(sqlCount, leadVolume) : null, 'derived', { derivedFrom: ['sqls', 'leads'] }),
      metric('sales_cycle_days', safeNumber(operational.sales_cycle), 'intelligence_brief'),
    ].filter(Boolean)
    return { metrics, sources: [...new Set(metrics.map(m => m.source === 'derived' ? 'hubspot' : m.source))] }
  },
})

const compoundRules = [
  createCompoundRule({ id: 'compound:cash-fragility', conditions: [{ metricKey: 'churn_rate', comparator: 'gt', value: 5 }, { metricKey: 'runway_months', comparator: 'lt', value: 9 }], title: 'Cash fragility', summary: 'High churn combined with short runway creates compounding financial pressure.', recommendation: 'Treat churn reduction and cash conservation as a single priority — one directly extends the other.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:pipeline-collapse', conditions: [{ metricKey: 'open_deals', comparator: 'eq', value: 0 }, { metricKey: 'lead_volume', comparator: 'lt', value: 10 }], title: 'Pipeline collapse', summary: 'No open deals and lead flow below 10 — the revenue engine has stalled at both ends of the funnel.', recommendation: 'Start an outbound sprint immediately and review every lead source for blockage.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:unit-economics-inversion', conditions: [{ metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 1 }, { metricKey: 'churn_rate', comparator: 'gt', value: 5 }], title: 'Unit economics are inverted', summary: 'LTV:CAC below 1 and churn above 5% means acquiring customers is destroying value, not building it.', recommendation: 'Pause acquisition spend and fix retention before scaling further.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:execution-breakdown', conditions: [{ metricKey: 'goal_progress', comparator: 'lt', value: 60 }, { metricKey: 'followthrough_rate', comparator: 'lt', value: 60 }], title: 'Execution breakdown', summary: 'Goal progress below 60% and follow-through below 60% — strategy is not surviving contact with execution.', recommendation: 'Cut active priorities to 3 or fewer and rebuild weekly accountability before adding new goals.', severity: 'high' }),
  createCompoundRule({ id: 'compound:sales-process-breakdown', conditions: [{ metricKey: 'stage_conversion', comparator: 'lt', value: 15 }, { metricKey: 'sales_cycle_days', comparator: 'gt', value: 45 }], title: 'Sales process breakdown', summary: 'Conversion below 15% and sales cycle above 45 days — the funnel is leaking at every stage and moving too slowly.', recommendation: 'Run a focused sales process diagnostic and fix qualification and late-stage friction first.', severity: 'high' }),
]

export const SAAS_STARTUP_SCHEMA = createSchema({
  id: 'saas-startup',
  label: 'SaaS Startup',
  areas: [customerServiceArea, financeAccountingArea, managementStrategyArea, marketingSalesArea],
  objects: [
    createObject({ id: 'customer', label: 'Customer', properties: [{ key: 'churn_risk', type: 'boolean' }, { key: 'csat_score', type: 'number' }] }),
    createObject({ id: 'deal', label: 'Deal', properties: [{ key: 'value', type: 'currency' }, { key: 'stage', type: 'string' }, { key: 'age_days', type: 'number' }] }),
    createObject({ id: 'team_member', label: 'Team Member', properties: [{ key: 'open_actions', type: 'count' }] }),
  ],
  compoundRules,
})
```

---

#### 3. `api/lib/blueprint/schema-registry.js`

```js
import { SAAS_STARTUP_SCHEMA } from './schemas/saas-startup.js'

const registry = new Map()
registry.set('__default__', SAAS_STARTUP_SCHEMA)

export function registerSchema(companyId, schema) {
  registry.set(companyId, schema)
}

export function getSchema(companyId) {
  return registry.get(companyId) ?? registry.get('__default__')
}

export function resolveAreasForSchema(schema) {
  return schema?.areas ?? []
}

export function resolveCompoundRulesForSchema(schema) {
  return schema?.compoundRules ?? []
}
```

---

#### 4. `api/lib/governance/causal-engine.js`

The relationships here are NOT user-defined. They are universal business causal patterns hardcoded into the engine. This is the product moat — users define what to watch, the engine already knows how things connect.

```js
const CAUSAL_GRAPH = [
  { from: 'customer-service',    to: 'finance-accounting',   reason: 'Support failures drive churn, churn shrinks revenue and runway.' },
  { from: 'marketing-sales',     to: 'finance-accounting',   reason: 'Pipeline weakness means future MRR dries up.' },
  { from: 'management-strategy', to: 'marketing-sales',      reason: 'Execution gaps stall pipeline creation and follow-up.' },
  { from: 'management-strategy', to: 'customer-service',     reason: 'Weak follow-through lets service issues go unresolved.' },
  { from: 'finance-accounting',  to: 'management-strategy',  reason: 'Runway pressure forces reactive strategy and cuts planning time.' },
]

function buildMaps() {
  const upstream = {}
  const downstream = {}
  for (const edge of CAUSAL_GRAPH) {
    if (!downstream[edge.from]) downstream[edge.from] = []
    if (!upstream[edge.to]) upstream[edge.to] = []
    downstream[edge.from].push(edge)
    upstream[edge.to].push(edge)
  }
  return { upstream, downstream }
}

function isStressed(areaId, findings) {
  return findings.some(f => f.areaId === areaId && (f.status === 'bad' || f.status === 'watch'))
}

export function traceRootCause(triggerId, findings) {
  const { upstream } = buildMaps()
  const visited = new Set()
  const causalChain = []
  let current = triggerId

  while (current) {
    if (visited.has(current)) break
    visited.add(current)
    causalChain.push(current)
    const parents = upstream[current] ?? []
    const stressedParent = parents.find(edge => isStressed(edge.from, findings))
    current = stressedParent ? stressedParent.from : null
  }

  return {
    rootCause: causalChain[causalChain.length - 1],
    causalChain,
    isCompound: causalChain.length > 1,
  }
}

export function projectDownstream(triggerId, findings) {
  const { downstream } = buildMaps()
  const visited = new Set()
  const risks = []
  const queue = [triggerId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (visited.has(current)) continue
    visited.add(current)
    for (const edge of downstream[current] ?? []) {
      if (!visited.has(edge.to)) {
        risks.push({ nodeId: edge.to, reason: edge.reason, alreadyStressed: isStressed(edge.to, findings) })
        queue.push(edge.to)
      }
    }
  }

  return risks
}

export function buildCompoundDiagnosis(findings) {
  const badFindings = (findings ?? []).filter(f => f.status === 'bad' || f.status === 'watch')
  if (!badFindings.length) return null

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const trigger = [...badFindings].sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))[0]

  const { rootCause, causalChain, isCompound } = traceRootCause(trigger.areaId, findings)
  const downstreamRisks = projectDownstream(trigger.areaId, findings)

  const alreadyStressed = downstreamRisks.filter(r => r.alreadyStressed)
  const atRisk = downstreamRisks.filter(r => !r.alreadyStressed)

  return {
    trigger: { areaId: trigger.areaId, title: trigger.title, severity: trigger.severity },
    rootCause: { nodeId: rootCause, causalChain, isCompound },
    downstreamRisks: {
      alreadyStressed: alreadyStressed.map(r => ({ nodeId: r.nodeId, reason: r.reason })),
      atRisk: atRisk.map(r => ({ nodeId: r.nodeId, reason: r.reason })),
    },
    immediateAction: alreadyStressed.length > 0
      ? `${trigger.title} is already cascading into ${alreadyStressed.map(r => r.nodeId).join(', ')}. Root cause is at ${rootCause}.`
      : `Fix ${trigger.title} now — it will cascade into ${atRisk.map(r => r.nodeId).join(', ') || 'other areas'} if left.`,
    recommendation: trigger.recommendation,
  }
}
```

---

### Files to MODIFY (3 existing files)

---

#### MODIFY `api/lib/governance/area-registry.js` — replace entirely

```js
import { getSchema, resolveAreasForSchema } from '../blueprint/schema-registry.js'
import { evaluateRulePack } from './shared/contracts.js'

export function getOperationalAreaModule(areaId, schema) {
  const s = schema ?? getSchema('__default__')
  return resolveAreasForSchema(s).find(a => a.id === areaId) ?? null
}

export function evaluateOperationalArea(areaId, metrics, overrides = null, schema) {
  const area = getOperationalAreaModule(areaId, schema)
  if (!area) return []
  return evaluateRulePack(area.defaultRulePack, metrics, overrides)
}

export function getAreaRegistry(schema) {
  const s = schema ?? getSchema('__default__')
  return resolveAreasForSchema(s)
}

export function getOperationalArea(areaId) {
  return getOperationalAreaModule(areaId)
}

export function isOperationalArea(areaId) {
  return !!getOperationalAreaModule(areaId)
}

export const OPERATIONAL_AREAS = resolveAreasForSchema(getSchema('__default__'))
```

---

#### MODIFY `api/lib/governance/metric-snapshots.js` — replace entirely

```js
import { normalizeGovernanceMetrics } from './shared/contracts.js'
import { getSchema, resolveAreasForSchema } from '../blueprint/schema-registry.js'

export function buildAreaMetricSnapshots({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString(), schema = null } = {}) {
  const s = schema ?? getSchema('__default__')
  const areas = resolveAreasForSchema(s)

  return areas
    .filter(area => typeof area.buildMetrics === 'function')
    .map(area => {
      const result = area.buildMetrics({ brain, brief, normalized })
      return {
        areaId: area.id,
        checkedAt,
        metrics: result.metrics,
        metricsByKey: normalizeGovernanceMetrics(result.metrics),
        sources: result.sources,
        coverage: result.metrics.length,
      }
    })
}
```

---

#### MODIFY `api/lib/governance/monitoring.js` — 4 targeted changes

**Change 1 — imports at top:**
```js
// ADD these two new imports alongside existing ones
import { getSchema, resolveCompoundRulesForSchema } from '../blueprint/schema-registry.js'
import { buildCompoundDiagnosis } from './causal-engine.js'
```

**Change 2 — replace entire evaluateCompoundRules function:**
```js
function compareMetricValue(metricValue, comparator, targetValue) {
  switch (comparator) {
    case 'lt': return metricValue < targetValue
    case 'lte': return metricValue <= targetValue
    case 'gt': return metricValue > targetValue
    case 'gte': return metricValue >= targetValue
    case 'eq': return metricValue === targetValue
    case 'neq': return metricValue !== targetValue
    default: return false
  }
}

function evaluateCompoundRules(m, schema) {
  const rules = resolveCompoundRulesForSchema(schema)
  const findings = []
  for (const rule of rules) {
    const allMet = rule.conditions.every(condition => {
      const val = typeof m[condition.metricKey] === 'number' ? m[condition.metricKey] : null
      if (val === null) return false
      return compareMetricValue(val, condition.comparator, condition.value)
    })
    if (allMet) {
      const valuesSummary = rule.conditions.map(c => `${c.metricKey}: ${m[c.metricKey]}`).join(', ')
      findings.push({
        id: rule.id, type: 'risk', status: rule.status ?? 'bad', severity: rule.severity,
        areaId: 'cross', areaLabel: 'Cross-Area', title: rule.title,
        summary: `${rule.summary} (${valuesSummary})`, recommendation: rule.recommendation,
        metricKey: 'compound', comparator: 'compound', thresholdValue: null, metricValue: null,
      })
    }
  }
  return findings
}
```

**Change 3 — add schema param to runGovernanceMonitoring:**
```js
// OLD
export function runGovernanceMonitoring({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString(), userOverrides = null } = {}) {

// NEW
export function runGovernanceMonitoring({ brain = null, brief = null, normalized = null, checkedAt = new Date().toISOString(), userOverrides = null, schema = null } = {}) {
  const s = schema ?? getSchema('__default__')
```

**Change 4 — update the 3 internal calls to pass schema, and add causalDiagnosis to return:**
```js
// Pass schema: s to buildAreaMetricSnapshots
const snapshots = buildAreaMetricSnapshots({ brain, brief, normalized, checkedAt, schema: s })

// Pass s to evaluateOperationalArea inside the .map
const findings = evaluateOperationalArea(snapshot.areaId, snapshot.metricsByKey, userOverrides, s)

// Pass s to evaluateCompoundRules
const compoundFindings = evaluateCompoundRules(combinedMetrics, s)

// Add causalDiagnosis to return object (just before the closing brace of the return)
const causalDiagnosis = buildCompoundDiagnosis(findings)

return {
  checkedAt,
  areas,
  snapshots,
  findings,
  compoundFindings,
  risks,
  causalDiagnosis,  // NEW — second-order diagnosis
  summary: { ... }, // unchanged — keep the existing summary construction exactly as-is
}
```

---

#### MODIFY `api/lib/governance/advice.js` — one function change

```js
// Replace buildImpact entirely
// OLD — hardcoded if-blocks per metric key
// NEW — reads defaultInterpretation from area's metricFamilies

function buildImpact(area, finding) {
  const metricDef = area?.metricFamilies?.find(m => m.key === finding.metricKey)
  if (metricDef?.defaultInterpretation) return metricDef.defaultInterpretation
  return `${area?.label ?? 'This area'} performance will keep drifting if this is not corrected.`
}
```

---

### Files to DELETE

- `api/lib/governance/areas/customer-service/index.js`
- `api/lib/governance/areas/finance-accounting/index.js`
- `api/lib/governance/areas/management-strategy/index.js`
- `api/lib/governance/areas/marketing-sales/index.js`
- `shared/governance/operational-areas.js` — **grep for usages first before deleting**

---

### DO NOT TOUCH

- `api/lib/governance/shared/contracts.js` — already generic, stays as-is
- The public API of `runGovernanceMonitoring` and `buildGovernanceAdvice` is unchanged
- Nothing that calls these functions needs to change

---

## ADDING A NEW COMPANY TYPE LATER

Create `api/lib/blueprint/schemas/YOUR-COMPANY.js` using the same factory functions. Define your own areas, metrics, rules. Call `registerSchema('company-id', YOUR_SCHEMA)` at startup. The entire engine runs against it. Zero engine changes needed.

---

## ONBOARDING FLOW — SCHEMA AUTO-GENERATION
*(CONTEXT ONLY — do not build in this session)*

The eventual product vision: user answers 6 questions, Claude generates a valid schema, it gets saved to Supabase, engine picks it up immediately.

**The 6 onboarding questions:**
1. What does your company do? (one sentence)
2. How do you make money? (subscriptions / one-time sales / services / mix)
3. How big is your team? (1-10 / 10-50 / 50-200)
4. What tools do you currently use? (Stripe, HubSpot, Zendesk, Notion, Slack, Other)
5. What are the top 3 things that could go wrong in your business right now? (free text)
6. How do you currently know when something is going wrong? (free text)

**The Claude prompt that turns answers into a schema:**

```
You are a business operations analyst building a monitoring schema for a company.

Based on the company profile below, generate a SelfAudit schema as a valid JSON object.

COMPANY PROFILE:
- Description: {{answer_1}}
- Revenue model: {{answer_2}}
- Team size: {{answer_3}}
- Connected tools: {{answer_4}}
- Top concerns: {{answer_5}}
- Current monitoring approach: {{answer_6}}

INSTRUCTIONS:
Generate a schema with 3-5 operational areas most relevant to this specific company.
For each area define 3-5 metrics with realistic thresholds for a company of this size and model.
Base the areas and metrics on their stated concerns — don't default to generic SaaS areas unless they are genuinely relevant.

Return valid JSON matching this exact structure:

{
  "id": "slug-from-company-name",
  "label": "Company Name",
  "areas": [
    {
      "id": "area-id",
      "label": "Area Name",
      "businessLogic": {
        "objective": "one sentence on what this area protects",
        "questions": ["question 1", "question 2", "question 3"]
      },
      "metricFamilies": [
        {
          "key": "metric_key",
          "label": "Metric label",
          "unit": "percent | count | currency | days | hours | score",
          "preferredDirection": "lower-is-better | higher-is-better | contextual",
          "defaultInterpretation": "one sentence on what this metric means when stressed"
        }
      ],
      "defaultRulePack": {
        "defaults": [
          {
            "id": "area-id:rule-name",
            "metricKey": "metric_key",
            "comparator": "gt | lt | gte | lte | eq",
            "value": 0,
            "status": "watch | bad",
            "severity": "medium | high | critical",
            "title": "short title",
            "summary": "one sentence description of the problem",
            "recommendation": "specific action to take",
            "rationale": "why this threshold matters"
          }
        ]
      }
    }
  ],
  "compoundRules": [
    {
      "id": "compound:rule-name",
      "conditions": [
        { "metricKey": "metric_key", "comparator": "gt", "value": 0 },
        { "metricKey": "metric_key", "comparator": "lt", "value": 0 }
      ],
      "title": "compound signal title",
      "summary": "what these two things together mean",
      "recommendation": "what to do about it",
      "severity": "high | critical"
    }
  ]
}

Return only the JSON. No explanation. No markdown. Raw JSON only.
```

**The handler code:**

```js
async function generateSchemaFromOnboarding(answers, companyId) {
  const prompt = buildOnboardingPrompt(answers)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const raw = response.content[0].text.trim()
  const schema = JSON.parse(raw)

  if (!schema.areas?.length) throw new Error('Schema generation failed — no areas returned')

  await supabase
    .from('company_schemas')
    .upsert({ company_id: companyId, schema, generated_at: new Date().toISOString() })

  registerSchema(companyId, schema)

  return schema
}
```

**After generation — show the user a summary screen:**
> "We've set up monitoring for 4 areas: Order Fulfilment, Dealer Relations, Inventory Health, Production Output. We'll watch 14 metrics. You can adjust any thresholds before going live."

Give them one screen to tweak thresholds. Most won't touch it. But it builds trust that the product understood their business.

---

## PRODUCT STRATEGY NOTES
*(CONTEXT ONLY — not part of this refactor)*

**The market:**
Companies at 20-150 people. Past "feeling it in the room" but not big enough for dedicated ops/analytics. They hire consultants for $20k to come in, look at data, produce a deck, leave. Problem comes back 6 months later. SelfAudit replaces that with continuous monitoring at $999/month.

**The moat — three things that compound over time:**
1. The causal graph accuracy — gets better as you tune it across real companies
2. Company memory — months of context accumulate, nobody can replicate a specific company's history
3. Intervention quality — knowing what to actually do in the specific context of that company

**What to do before investor meetings:**
Talk to 10-15 founders/operators at 20-150 person companies. Ask: how do you know when something is going wrong operationally? Have you ever been surprised by a problem that was actually caused by something else upstream? What did that cost you? Seven out of ten painful, specific answers = your investor story.

**Pricing:**
$999/month is not crazy for the right buyer. A 50-person company losing one customer because nobody connected the dots costs more than $999/month.

**Next product milestone after this refactor:**
Simple onboarding where a founder answers 6 questions and the schema builds itself. That's when the product stops feeling like software and starts feeling like an advisor.
