import { createArea, createMetricDefinition, createThresholdRule, createRulePack, createCompoundRule, createMetricMapping } from '../schema.js'

const ALL_INDUSTRY_IDS = [
  'saas-software', 'ecommerce-d2c', 'marketplace-platform', 'consumer-app',
  'professional-services', 'life-sciences', 'manufacturing', 'wholesale-distribution',
  'logistics-freight', 'retail', 'retail-hospitality', 'hospitality-fb', 'healthcare',
  'real-estate', 'construction', 'agriculture', 'fintech-finance', 'insurance',
  'telecommunications', 'media-creator', 'education', 'energy-utilities', 'other',
]

// ─── SaaS / Software ──────────────────────────────────────────────────────────

export const AREA_CUSTOMER_SERVICE = createArea({
  id: 'customer-service',
  label: 'Customer Service',
  industries: ['saas-software', 'ecommerce-d2c', 'professional-services', 'retail', 'retail-hospitality'],
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
    createMetricDefinition({ key: 'ticket_volume',        label: 'Ticket volume',        unit: 'count',   preferredDirection: 'contextual',      defaultInterpretation: 'Volume alone is not bad, but sudden surges can signal product or service stress.' }),
    createMetricDefinition({ key: 'first_response_time',  label: 'First response time',  unit: 'hours',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Long waits reduce trust and make issue escalation more likely.' }),
    createMetricDefinition({ key: 'resolution_time',      label: 'Resolution time',      unit: 'hours',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Slow resolution usually means handoff friction or unclear ownership.' }),
    createMetricDefinition({ key: 'repeat_issue_rate',    label: 'Repeat issue rate',    unit: 'percent', preferredDirection: 'lower-is-better', defaultInterpretation: 'Repeats mean the team is treating symptoms, not root causes.' }),
    createMetricDefinition({ key: 'csat',                 label: 'Customer satisfaction', unit: 'score',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Falling satisfaction is an early warning that service quality is hurting customer confidence.' }),
    createMetricDefinition({ key: 'negative_retention_signals', label: 'Negative retention signals', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Churn, downgrade, complaint, and escalation signals indicate customer health risk.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'customer-service:first-response-watch', metricKey: 'first_response_time', comparator: 'gt', value: 8,  status: 'watch', severity: 'medium',   title: 'Support response time is slowing',   summary: 'Customers are waiting longer than a healthy same-day response window.',       recommendation: 'Review queue coverage and owner handoffs before slow replies become normal.',                    rationale: 'Support trust starts with speed. Slow first responses often show capacity or process strain.' }),
      createThresholdRule({ id: 'customer-service:first-response-bad',   metricKey: 'first_response_time', comparator: 'gt', value: 24, status: 'bad',   severity: 'high',     title: 'Support response time is at risk',   summary: 'Customers are waiting more than a day for a first response.',                recommendation: 'Prioritize queue triage, assign backup coverage, and reduce time-to-first-touch immediately.',    rationale: 'Multi-day waits usually mean customers feel ignored and are more likely to churn or escalate.' }),
      createThresholdRule({ id: 'customer-service:resolution-watch',     metricKey: 'resolution_time',      comparator: 'gt', value: 48, status: 'watch', severity: 'medium',   title: 'Issue resolution is dragging',       summary: 'Customer issues are taking more than two days to close.',                    recommendation: 'Audit common blockers and tighten escalation paths for stuck issues.',                            rationale: 'Long resolution times usually indicate unclear ownership or repeated back-and-forth.' }),
      createThresholdRule({ id: 'customer-service:repeat-issue-bad',     metricKey: 'repeat_issue_rate',    comparator: 'gt', value: 20, status: 'bad',   severity: 'high',     title: 'Repeat issues are too common',       summary: 'Too many customer problems are reopening or coming back.',                   recommendation: 'Identify the top recurring issue types and fix the underlying process or product cause.',         rationale: 'Recurring issues are a direct sign of operational debt in service delivery.' }),
      createThresholdRule({ id: 'customer-service:csat-bad',             metricKey: 'csat',                 comparator: 'lt', value: 80, status: 'bad',   severity: 'high',     title: 'Customer satisfaction is slipping',  summary: 'Service satisfaction has dropped below a healthy confidence line.',          recommendation: 'Review the latest negative interactions and isolate the causes behind dissatisfaction.',          rationale: 'Falling satisfaction often appears before churn or escalation becomes obvious.' }),
    ],
    notes: [
      'Watch backlog growth, slow responses, repeated complaints, and satisfaction drops.',
      'This area should answer: are customers getting help fast enough, and are the same problems recurring?',
    ],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'ticket_volume', transform: 'safeNumber', sources: [{ type: 'normalized', field: 'open_tickets' }, { type: 'brief', path: 'operational.support_tickets_per_week' }], source: 'support' }),
    createMetricMapping({ metricKey: 'negative_retention_signals', transform: 'computed', computation: 'negative-retention-signal-count', sources: [{ type: 'brain', path: 'retention_signals' }], source: 'company_brain' }),
  ],
})

export const AREA_FINANCE_ACCOUNTING = createArea({
  id: 'finance-accounting',
  label: 'Finance & Accounting',
  industries: ALL_INDUSTRY_IDS,
  connectors: ['stripe', 'quickbooks'],
  businessLogic: {
    objective: 'Protect cash, margins, and unit economics so the business can keep executing without hidden financial fragility.',
    questions: [
      'Is the business retaining enough revenue to justify growth?',
      'Is cash health strong enough to support the current plan?',
      'Are unit economics healthy, or is the company scaling something fragile?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'mrr',          label: 'Monthly recurring revenue', unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Revenue trend matters, but on its own MRR does not tell you whether the business is healthy.' }),
    createMetricDefinition({ key: 'active_customers', label: 'Active customers',       unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Zero active customers means recurring revenue may have stopped or the billing connection is incomplete.' }),
    createMetricDefinition({ key: 'churn_rate',   label: 'Churn rate',                unit: 'percent',  preferredDirection: 'lower-is-better',  defaultInterpretation: 'High churn means growth effort is leaking out faster than it should.' }),
    createMetricDefinition({ key: 'burn_rate',    label: 'Burn rate',                 unit: 'currency', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Burn is not always bad, but it must match runway and growth reality.' }),
    createMetricDefinition({ key: 'runway_months', label: 'Runway',                   unit: 'months',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Short runway removes strategic choices and forces reactive decisions.' }),
    createMetricDefinition({ key: 'ltv_cac_ratio', label: 'LTV to CAC',              unit: 'ratio',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Weak unit economics mean the business may be scaling something that does not pay back cleanly.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'finance-accounting:churn-watch',     metricKey: 'churn_rate',    comparator: 'gt', value: 2,  status: 'watch', severity: 'medium',   title: 'Churn is above a healthy line',     summary: 'Revenue or customer loss is starting to compound against growth.',              recommendation: 'Review the main churn reasons and isolate which customers are most at risk.',                     rationale: 'Elevated churn is one of the clearest signs that operational and product issues are leaking revenue.' }),
      createThresholdRule({ id: 'finance-accounting:churn-bad',       metricKey: 'churn_rate',    comparator: 'gt', value: 5,  status: 'bad',   severity: 'high',     title: 'Churn is materially high',          summary: 'Too much revenue is leaking out every month for healthy compounding growth.',   recommendation: 'Treat churn reduction as a top operating priority and run a focused retention diagnosis.',        rationale: 'At this level, churn is usually hiding deeper delivery, product, or fit issues.' }),
      createThresholdRule({ id: 'finance-accounting:runway-watch',    metricKey: 'runway_months', comparator: 'lt', value: 12, status: 'watch', severity: 'high',     title: 'Runway is getting tight',           summary: 'The company has less than a year of runway at the current burn.',               recommendation: 'Start scenario planning now rather than waiting for the business to become reactive.',            rationale: 'Sub-12-month runway compresses optionality and increases decision pressure.' }),
      createThresholdRule({ id: 'finance-accounting:runway-bad',      metricKey: 'runway_months', comparator: 'lt', value: 6,  status: 'bad',   severity: 'critical', title: 'Runway is critical',                summary: 'The company has less than six months of runway remaining.',                     recommendation: 'Cut non-essential spend, accelerate collections, and make immediate capital planning decisions.', rationale: 'Below six months, financial fragility becomes an existential operating issue.' }),
      createThresholdRule({ id: 'finance-accounting:ltv-cac-watch',   metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 3,  status: 'watch', severity: 'medium',   title: 'Unit economics are thinner than ideal', summary: 'Customer value is not outpacing acquisition cost by a healthy margin.',       recommendation: 'Look for the fastest path to improve retention, pricing, or acquisition efficiency.',            rationale: 'Below 3x LTV:CAC, scaling can create pressure faster than value.' }),
      createThresholdRule({ id: 'finance-accounting:ltv-cac-bad',     metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 1,  status: 'bad',   severity: 'critical', title: 'Unit economics are upside down',    summary: 'The business is spending as much or more to acquire customers than they return.', recommendation: 'Pause aggressive growth spend and fix the economics before scaling further.',                    rationale: 'This is a strong sign that growth is amplifying operational debt instead of solving it.' }),
    ],
    notes: [
      'Watch cash stress, weak unit economics, revenue loss, and concentration risk.',
      'This area should answer: is the business financially healthy enough to keep executing the plan?',
    ],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'mrr',           transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'mrr' },           { type: 'brief', path: 'financial.mrr' }],        source: 'stripe' }),
    createMetricMapping({ metricKey: 'active_customers', transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'active_customers' }], source: 'stripe' }),
    createMetricMapping({ metricKey: 'churn_rate',    transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'churn_rate' },    { type: 'brief', path: 'financial.churn' }],      source: 'stripe' }),
    createMetricMapping({ metricKey: 'ltv',           transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'ltv' },           { type: 'brief', path: 'financial.ltv' }],        source: 'stripe' }),
    createMetricMapping({ metricKey: 'burn_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.burn_rate' }],                        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'runway_months', transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.runway' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'ltv_cac_ratio', transform: 'divide',     inputs: [{ metricKey: 'ltv' }, { metricKey: 'cac', sources: [{ type: 'brief', path: 'financial.cac' }] }], source: 'derived' }),
  ],
})

export const AREA_MANAGEMENT_STRATEGY = createArea({
  id: 'management-strategy',
  label: 'Management & Strategy',
  industries: ALL_INDUSTRY_IDS,
  connectors: ['notion', 'google-drive', 'slack'],
  businessLogic: {
    objective: 'Keep leadership focus clear and execution disciplined so growth is not slowed by indecision or follow-through gaps.',
    questions: [
      'Is the company actually executing against its stated priorities?',
      'Are blockers being cleared, or are they becoming normalized?',
      'Is management attention staying on the highest-leverage work?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'goal_progress',      label: 'Goal progress',       unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Healthy progress shows the company is converting priorities into real movement.' }),
    createMetricDefinition({ key: 'priority_backlog',   label: 'Priority backlog',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'A large backlog means leadership is collecting priorities faster than it is clearing them.' }),
    createMetricDefinition({ key: 'repeated_blockers',  label: 'Repeated blockers',   unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Repeated blockers are a strong sign of unmanaged operational debt.' }),
    createMetricDefinition({ key: 'watchouts',          label: 'Watchouts',           unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Watchouts are fine if they are managed; too many means attention is diffusing.' }),
    createMetricDefinition({ key: 'followthrough_rate', label: 'Follow-through rate', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Low follow-through means strategy is not surviving contact with the week-to-week operation.' }),
    createMetricDefinition({ key: 'last_session_unfollowed', label: 'Last session unfollowed', unit: 'flag', preferredDirection: 'lower-is-better', defaultInterpretation: 'A prior audit with no follow-up means accountability is missing.' }),
    createMetricDefinition({ key: 'goal_timeline_unrealistic', label: 'Goal timeline unrealistic', unit: 'flag', preferredDirection: 'lower-is-better', defaultInterpretation: 'An unrealistic goal timeline creates pressure without a credible execution path.' }),
    createMetricDefinition({ key: 'goal_timeline_tight', label: 'Goal timeline tight', unit: 'flag', preferredDirection: 'lower-is-better', defaultInterpretation: 'A tight timeline can still work, but only with active risk management.' }),
    createMetricDefinition({ key: 'operational_blockers', label: 'Operational blockers', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Multiple active blockers reduce throughput and execution pace.' }),
    createMetricDefinition({ key: 'conversion_bottlenecks', label: 'Conversion bottlenecks', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Known journey bottlenecks reduce the yield from sales and marketing effort.' }),
    createMetricDefinition({ key: 'current_constraints', label: 'Current constraints', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Stacked constraints create compound drag across the operation.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'management-strategy:goal-progress-watch',    metricKey: 'goal_progress',      comparator: 'lt', value: 60, status: 'watch', severity: 'medium', title: 'Goal progress looks soft',              summary: 'The company is behind a healthy pace on its active goal.',                      recommendation: 'Review what is blocking progress and whether priorities are too fragmented.',   rationale: 'Slow progress is often an execution problem before it becomes a strategy problem.' }),
      createThresholdRule({ id: 'management-strategy:priority-backlog-bad',   metricKey: 'priority_backlog',   comparator: 'gt', value: 5,  status: 'bad',   severity: 'high',   title: 'Priority backlog is too large',         summary: 'Too many high-priority items are open at once.',                               recommendation: 'Reduce active priorities and force ownership, sequencing, and deadlines.',     rationale: 'A swollen backlog usually means the company is spreading attention too thin.' }),
      createThresholdRule({ id: 'management-strategy:repeated-blockers-watch', metricKey: 'repeated_blockers', comparator: 'gt', value: 2,  status: 'watch', severity: 'medium', title: 'Recurring blockers are stacking up',    summary: 'The same execution blockers are appearing across multiple cycles.',             recommendation: 'Stop treating them as one-off issues and fix the underlying operating constraint.', rationale: 'Repeated blockers are one of the clearest forms of operational debt.' }),
      createThresholdRule({ id: 'management-strategy:followthrough-watch',    metricKey: 'followthrough_rate', comparator: 'lt', value: 80, status: 'watch', severity: 'medium', title: 'Follow-through is inconsistent',        summary: 'Too many agreed actions are missing deadlines or staying unfinished.',          recommendation: 'Tighten ownership, review cadence, and priority discipline.',                  rationale: 'This usually means the company is deciding well but executing weakly.' }),
      createThresholdRule({ id: 'management-strategy:followthrough-bad',      metricKey: 'followthrough_rate', comparator: 'lt', value: 60, status: 'bad',   severity: 'high',   title: 'Follow-through is materially weak',     summary: 'The business is not reliably converting decisions into completed work.',        recommendation: 'Rebuild weekly execution discipline and cut active priorities until completion improves.', rationale: 'At this point, management debt itself is becoming the bottleneck.' }),
    ],
    notes: [
      'Watch goal slippage, repeated blockers, weak follow-through, and strategy-to-execution gaps.',
      'This area should answer: is leadership focus clear, and is the business actually executing on that focus?',
    ],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'goal_progress',      transform: 'safeNumber',   sources: [{ type: 'brain', path: 'goal_score' }],          source: 'company_brain' }),
    createMetricMapping({ metricKey: 'priority_backlog',   transform: 'arrayLength',  sources: [{ type: 'brain', path: 'top_priorities' }],       source: 'company_brain' }),
    createMetricMapping({ metricKey: 'repeated_blockers',  transform: 'arrayLength',  sources: [{ type: 'brain', path: 'repeated_blockers' }],    source: 'company_brain' }),
    createMetricMapping({ metricKey: 'watchouts',          transform: 'arrayLength',  sources: [{ type: 'brain', path: 'watchouts' }],            source: 'company_brain' }),
    createMetricMapping({ metricKey: 'followthrough_rate', transform: 'computed',     computation: 'session-followthrough-rate', sources: [{ type: 'brain', path: 'recent_sessions' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'last_session_unfollowed', transform: 'computed', computation: 'last-session-unfollowed', sources: [{ type: 'brain', path: 'last_session.status' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'goal_timeline_unrealistic', transform: 'computed', computation: 'goal-timeline-unrealistic', sources: [{ type: 'brain', path: 'goal_timeline' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'goal_timeline_tight', transform: 'computed', computation: 'goal-timeline-tight', sources: [{ type: 'brain', path: 'goal_timeline' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'operational_blockers', transform: 'arrayLength', sources: [{ type: 'brain', path: 'operational_blockers' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'conversion_bottlenecks', transform: 'arrayLength', sources: [{ type: 'brain', path: 'conversion_bottlenecks' }], source: 'company_brain' }),
    createMetricMapping({ metricKey: 'current_constraints', transform: 'arrayLength', sources: [{ type: 'brain', path: 'current_constraints' }], source: 'company_brain' }),
  ],
})

export const AREA_MARKETING_SALES = createArea({
  id: 'marketing-sales',
  label: 'Marketing & Sales',
  industries: ['saas-software', 'professional-services', 'real-estate'],
  connectors: ['hubspot', 'zoho'],
  businessLogic: {
    objective: 'Keep demand creation and revenue generation healthy enough that growth does not stall silently.',
    questions: [
      'Is there enough pipeline to support the revenue goal?',
      'Are leads and deals actually progressing through the funnel?',
      'Is growth quality strong, or are we masking weak conversion with more activity?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'pipeline_value',    label: 'Pipeline value',    unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Thin pipeline leaves no room for normal deal slippage.' }),
    createMetricDefinition({ key: 'open_deals',        label: 'Open deals',        unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'A very low deal count usually means revenue creation is underfed.' }),
    createMetricDefinition({ key: 'lead_volume',       label: 'Lead volume',       unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Low lead flow makes future quarters fragile even if this month still looks fine.' }),
    createMetricDefinition({ key: 'stage_conversion',  label: 'Stage conversion',  unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Poor conversion means demand quality or sales process is breaking down.' }),
    createMetricDefinition({ key: 'sales_cycle_days',  label: 'Sales cycle',       unit: 'days',     preferredDirection: 'lower-is-better',  defaultInterpretation: 'A long sales cycle ties up revenue and usually hides friction in the funnel.' }),
    createMetricDefinition({ key: 'sqls',              label: 'SQLs',              unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'SQL count shows whether leads are becoming qualified opportunities.' }),
    createMetricDefinition({ key: 'customers',         label: 'Customers in CRM',  unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Customer count in CRM should reflect closed-won conversion and data hygiene.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'marketing-sales:open-deals-bad',          metricKey: 'open_deals',       comparator: 'lt', value: 3,  status: 'bad',   severity: 'high',   title: 'Pipeline is too thin',              summary: 'There are not enough active deals to absorb normal fallout.',                  recommendation: 'Increase pipeline creation now and review where lead flow or qualification is slowing down.', rationale: 'A thin pipeline makes revenue highly fragile and reactive.' }),
      createThresholdRule({ id: 'marketing-sales:pipeline-value-watch',    metricKey: 'pipeline_value',   comparator: 'lt', value: 25000, status: 'watch', severity: 'medium', title: 'Pipeline value is getting thin',    summary: 'Total open pipeline is below $25k — not enough to cover normal deal slippage and still hit targets.', recommendation: 'Add new opportunities to the pipeline and review whether existing deals are stalling.', rationale: 'A pipeline below $25k leaves almost no buffer for deals that slip, delay, or fall through.' }),
      createThresholdRule({ id: 'marketing-sales:pipeline-value-bad',      metricKey: 'pipeline_value',   comparator: 'lt', value: 10000, status: 'bad',   severity: 'high',   title: 'Pipeline value has collapsed',      summary: 'Total pipeline is under $10k — at this level, hitting any meaningful revenue target is nearly impossible.', recommendation: 'Treat this as a revenue emergency. Run an outbound sprint and review every lead source immediately.', rationale: 'Sub-$10k pipeline means the business has effectively lost its near-term revenue visibility.' }),
      createThresholdRule({ id: 'marketing-sales:lead-volume-watch',       metricKey: 'lead_volume',      comparator: 'lt', value: 10, status: 'watch', severity: 'medium', title: 'Lead flow looks light',             summary: 'New lead volume is below a healthy baseline for consistent pipeline growth.',   recommendation: 'Review demand generation sources and top-of-funnel follow-up speed.',        rationale: 'Weak lead flow shows up later as an empty pipeline if not corrected early.' }),
      createThresholdRule({ id: 'marketing-sales:stage-conversion-watch',  metricKey: 'stage_conversion', comparator: 'lt', value: 25, status: 'watch', severity: 'medium', title: 'Deals are not progressing cleanly', summary: 'Conversion through the funnel is weaker than a healthy sales process should allow.', recommendation: 'Audit qualification, objections, and where opportunities are getting stuck.', rationale: 'Poor conversion usually means the team is filling the funnel but not moving revenue forward.' }),
      createThresholdRule({ id: 'marketing-sales:stage-conversion-bad',    metricKey: 'stage_conversion', comparator: 'lt', value: 15, status: 'bad',   severity: 'high',   title: 'Conversion is materially weak',    summary: 'Too little of the funnel is advancing into real revenue opportunities.',      recommendation: 'Run a focused sales process diagnosis and fix qualification, messaging, or handoff gaps.', rationale: 'This is a strong sign of hidden operational debt in growth execution.' }),
      createThresholdRule({ id: 'marketing-sales:sales-cycle-watch',       metricKey: 'sales_cycle_days', comparator: 'gt', value: 45, status: 'watch', severity: 'medium', title: 'Sales cycle is slowing',           summary: 'Deals are taking longer than expected to close.',                              recommendation: 'Inspect delay points, approval friction, and follow-up quality in late-stage deals.', rationale: 'Long cycles often hide buyer hesitation or poor process discipline.' }),
    ],
    notes: [
      'Watch thin pipeline, stalled conversions, weak follow-through, and falling demand quality.',
      'This area should answer: is growth healthy, and where is revenue creation getting stuck?',
    ],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'pipeline_value',   transform: 'safeNumber', sources: [{ type: 'normalized', field: 'open_pipeline_value' }],                            source: 'hubspot' }),
    createMetricMapping({ metricKey: 'open_deals',       transform: 'safeNumber', sources: [{ type: 'normalized', field: 'open_deals' }],                                     source: 'hubspot' }),
    createMetricMapping({ metricKey: 'lead_volume',      transform: 'safeNumber', sources: [{ type: 'normalized', field: 'leads' }, { type: 'normalized', field: 'new_contacts_this_month' }], source: 'hubspot' }),
    createMetricMapping({ metricKey: 'sqls',             transform: 'safeNumber', sources: [{ type: 'normalized', field: 'sqls' }], source: 'hubspot' }),
    createMetricMapping({ metricKey: 'customers',        transform: 'safeNumber', sources: [{ type: 'normalized', field: 'customers' }], source: 'hubspot' }),
    createMetricMapping({ metricKey: 'stage_conversion', transform: 'ratio',      inputs: [{ metricKey: 'sqls', sources: [{ type: 'normalized', field: 'sqls' }] }, { metricKey: 'lead_volume' }], source: 'derived' }),
    createMetricMapping({ metricKey: 'sales_cycle_days', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.sales_cycle' }],                              source: 'intelligence_brief' }),
  ],
})

// ─── E-commerce / D2C ─────────────────────────────────────────────────────────

export const AREA_REVENUE_SALES = createArea({
  id: 'revenue-sales',
  label: 'Revenue & Sales',
  industries: ['ecommerce-d2c', 'retail', 'retail-hospitality'],
  connectors: ['shopify', 'stripe', 'woocommerce'],
  businessLogic: {
    objective: 'Keep revenue creation healthy by watching order flow, AOV, and repeat purchase rate.',
    questions: [
      'Is revenue trending in the right direction?',
      'Is average order value holding up?',
      'Are customers coming back, or is the business dependent on new acquisition?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'daily_revenue',      label: 'Daily revenue',       unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Daily revenue trend is the clearest early signal of a business going up or down.' }),
    createMetricDefinition({ key: 'aov',                label: 'Average order value', unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Falling AOV often means discounting pressure or a shift toward lower-value products.' }),
    createMetricDefinition({ key: 'repeat_rate',        label: 'Repeat purchase rate', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Low repeat rate means the business is dependent on expensive new customer acquisition.' }),
    createMetricDefinition({ key: 'conversion_rate',    label: 'Site conversion rate', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Conversion below baseline usually signals friction in checkout, pricing, or product-market fit.' }),
    createMetricDefinition({ key: 'refund_rate',        label: 'Refund rate',         unit: 'percent',  preferredDirection: 'lower-is-better',  defaultInterpretation: 'High refunds signal product quality, expectation, or fulfilment problems.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'revenue-sales:repeat-rate-watch',     metricKey: 'repeat_rate',     comparator: 'lt', value: 20, status: 'watch', severity: 'medium',   title: 'Repeat purchases are weak',       summary: 'Less than 20% of customers are returning, making growth heavily dependent on acquisition.', recommendation: 'Run a retention campaign targeting lapsed customers and diagnose why repeat rate is low.', rationale: 'Repeat purchases are the cheapest revenue a D2C brand can generate.' }),
      createThresholdRule({ id: 'revenue-sales:refund-rate-watch',     metricKey: 'refund_rate',     comparator: 'gt', value: 5,  status: 'watch', severity: 'medium',   title: 'Refund rate is elevated',         summary: 'More than 5% of orders are being refunded, signalling product or expectation problems.',    recommendation: 'Identify the top refund reasons and fix the root cause in product, packaging, or fulfilment.', rationale: 'Elevated refunds burn margin and signal quality or trust issues.' }),
      createThresholdRule({ id: 'revenue-sales:refund-rate-bad',       metricKey: 'refund_rate',     comparator: 'gt', value: 10, status: 'bad',   severity: 'high',     title: 'Refund rate is critically high',  summary: 'Over 10% of orders are being refunded — margin is being destroyed.',                      recommendation: 'Halt the most-refunded products or channels and run an immediate root cause review.', rationale: 'At this level, refunds are a structural margin problem, not an exception.' }),
      createThresholdRule({ id: 'revenue-sales:conversion-watch',      metricKey: 'conversion_rate', comparator: 'lt', value: 1.5,status: 'watch', severity: 'medium',   title: 'Site conversion is below baseline', summary: 'Conversion rate is under 1.5% — traffic is not turning into orders efficiently.',         recommendation: 'Review checkout flow, page load times, pricing, and product imagery.', rationale: 'Low conversion means acquisition spend is being wasted on traffic that does not convert.' }),
    ],
    notes: ['Watch revenue trend, AOV, refunds, and repeat rate as the daily pulse of a D2C business.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'daily_revenue',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.daily_revenue' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'aov',             transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.aov' }],            source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'repeat_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.repeat_rate' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'conversion_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.conversion_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'refund_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.refund_rate' }],    source: 'intelligence_brief' }),
  ],
})

export const AREA_INVENTORY_OPERATIONS = createArea({
  id: 'inventory-operations',
  label: 'Inventory & Operations',
  industries: ['ecommerce-d2c', 'manufacturing', 'retail', 'retail-hospitality', 'wholesale-distribution'],
  connectors: ['shopify', 'linnworks', 'skuvault'],
  businessLogic: {
    objective: 'Protect fulfilment speed and stock health so operations do not become a ceiling on revenue.',
    questions: [
      'Are we at risk of going out of stock on key SKUs?',
      'Is fulfilment speed meeting customer expectations?',
      'Are supplier lead times stable?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'out_of_stock_skus',   label: 'Out-of-stock SKUs',     unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Any out-of-stock item is revenue you cannot capture.' }),
    createMetricDefinition({ key: 'avg_days_of_stock',   label: 'Avg days of stock',     unit: 'days',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Too few days of stock leaves no buffer for demand spikes or supplier delays.' }),
    createMetricDefinition({ key: 'fulfilment_time_hrs', label: 'Fulfilment time',       unit: 'hours',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Slow fulfilment increases cancellations, negative reviews, and chargeback risk.' }),
    createMetricDefinition({ key: 'supplier_lead_time',  label: 'Avg supplier lead time', unit: 'days',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Long or unpredictable lead times make stock planning fragile.' }),
    createMetricDefinition({ key: 'overstock_skus',      label: 'Overstock SKUs',        unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Excess stock ties up cash and can force discounting.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'inventory-operations:oos-watch',           metricKey: 'out_of_stock_skus',   comparator: 'gt', value: 0,  status: 'watch', severity: 'high',     title: 'SKUs are out of stock',         summary: 'One or more SKUs are out of stock.',                              recommendation: 'Identify which SKUs are stocked out and trigger emergency reorders.', rationale: 'Every out-of-stock item is lost revenue and a potential customer lost to a competitor.' }),
      createThresholdRule({ id: 'inventory-operations:stock-days-watch',    metricKey: 'avg_days_of_stock',   comparator: 'lt', value: 14, status: 'watch', severity: 'medium',   title: 'Stock levels are getting thin',  summary: 'Average days of stock is under 2 weeks — margin for demand spikes is thin.', recommendation: 'Review reorder points and trigger top-up orders on fast-moving SKUs.', rationale: 'Less than 14 days of stock creates fragility against demand spikes or supplier delays.' }),
      createThresholdRule({ id: 'inventory-operations:fulfilment-watch',    metricKey: 'fulfilment_time_hrs', comparator: 'gt', value: 48, status: 'watch', severity: 'medium',   title: 'Fulfilment is slowing down',    summary: 'Orders are taking over 48 hours to dispatch.',                    recommendation: 'Audit the pick-pack-ship process and resolve whatever is creating the slowdown.', rationale: 'Slow fulfilment is one of the fastest drivers of negative reviews and chargebacks.' }),
    ],
    notes: ['Watch stockouts, thin coverage, slow fulfilment, and supplier reliability as operational health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'out_of_stock_skus',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.out_of_stock_skus' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_days_of_stock',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_days_of_stock' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'fulfilment_time_hrs', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.fulfilment_time_hrs' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'supplier_lead_time',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.supplier_lead_time' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'overstock_skus',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.overstock_skus' }],      source: 'intelligence_brief' }),
  ],
})

// ─── Manufacturing ────────────────────────────────────────────────────────────

export const AREA_PRODUCTION = createArea({
  id: 'production',
  label: 'Production',
  industries: ['manufacturing'],
  connectors: ['erp', 'mes'],
  businessLogic: {
    objective: 'Keep production lines running at planned capacity with acceptable defect rates.',
    questions: [
      'Are machines running at planned uptime?',
      'Is output meeting daily targets?',
      'Are defect rates within acceptable bounds?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'avg_machine_uptime',   label: 'Machine uptime (%)',    unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Uptime below 85% usually signals maintenance debt or process instability.' }),
    createMetricDefinition({ key: 'oee',                  label: 'OEE score',             unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'OEE combines availability, performance, and quality into one production health number.' }),
    createMetricDefinition({ key: 'defect_rate',          label: 'Defect rate (%)',       unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising defect rates usually trace to material quality, process drift, or machine wear.' }),
    createMetricDefinition({ key: 'output_vs_plan',       label: 'Output vs plan (%)',    unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Consistent underperformance against plan is an early signal of a structural capacity problem.' }),
    createMetricDefinition({ key: 'scrap_rate',           label: 'Scrap rate (%)',        unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Scrap is both a quality signal and a direct cost — it hides margin.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'production:uptime-watch',  metricKey: 'avg_machine_uptime', comparator: 'lt', value: 85, status: 'watch', severity: 'medium',   title: 'Machine uptime is slipping',    summary: 'Average machine uptime has dropped below 85%.',                recommendation: 'Audit the machines with the most downtime and review maintenance schedules.', rationale: 'Uptime below 85% is a standard threshold for production fragility.' }),
      createThresholdRule({ id: 'production:uptime-bad',    metricKey: 'avg_machine_uptime', comparator: 'lt', value: 75, status: 'bad',   severity: 'high',     title: 'Machine uptime is critically low', summary: 'Average uptime is below 75% — production is at significant risk.', recommendation: 'Escalate to maintenance leadership immediately and assess for unplanned downtime root causes.', rationale: 'Below 75% uptime, production output will miss plan consistently.' }),
      createThresholdRule({ id: 'production:defect-watch',  metricKey: 'defect_rate',        comparator: 'gt', value: 2,  status: 'watch', severity: 'medium',   title: 'Defect rate is elevated',       summary: 'More than 2% of output is defective.',                         recommendation: 'Identify which lines or shifts have the highest defect concentration and run a root cause review.', rationale: 'Rising defects usually precede a larger quality event if not addressed.' }),
      createThresholdRule({ id: 'production:defect-bad',    metricKey: 'defect_rate',        comparator: 'gt', value: 5,  status: 'bad',   severity: 'high',     title: 'Defect rate is critically high', summary: 'Over 5% of output is defective — quality control has broken down.', recommendation: 'Consider stopping affected lines and running a full quality audit before resuming.', rationale: 'At 5%+ defect rate, scrap cost and customer risk are both significant.' }),
      createThresholdRule({ id: 'production:output-watch',  metricKey: 'output_vs_plan',     comparator: 'lt', value: 90, status: 'watch', severity: 'medium',   title: 'Output is behind plan',         summary: 'Production output is more than 10% below the daily target.',   recommendation: 'Identify the primary bottleneck (uptime, staffing, or materials) and address it today.', rationale: 'Consistent underperformance against plan compounds into order delays and customer risk.' }),
    ],
    notes: ['Watch uptime, defect rate, OEE, and output vs plan as the daily production health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'avg_machine_uptime', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_machine_uptime' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'oee',                transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.oee' }],                source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'defect_rate',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.defect_rate' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'output_vs_plan',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.output_vs_plan' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'scrap_rate',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.scrap_rate' }],         source: 'intelligence_brief' }),
  ],
})

// ─── Professional Services ────────────────────────────────────────────────────

export const AREA_CLIENT_DELIVERY = createArea({
  id: 'client-delivery',
  label: 'Client Delivery',
  industries: ['professional-services'],
  connectors: ['asana', 'jira', 'notion', 'clickup'],
  businessLogic: {
    objective: 'Keep project health strong and client satisfaction high to protect renewals and referrals.',
    questions: [
      'Are projects on track and within budget?',
      'Is client satisfaction strong enough to protect renewals?',
      'Are overdue milestones becoming a pattern?',
    ],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'projects_at_risk',    label: 'Projects at risk',     unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Any project at risk is a renewal and referral at risk.' }),
    createMetricDefinition({ key: 'avg_budget_consumed', label: 'Avg budget used (%)',  unit: 'percent', preferredDirection: 'contextual',       defaultInterpretation: 'Budget consumption relative to timeline tells you whether projects are on track financially.' }),
    createMetricDefinition({ key: 'overdue_milestones',  label: 'Overdue milestones',   unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Missed milestones erode client trust faster than almost any other signal.' }),
    createMetricDefinition({ key: 'avg_client_csat',     label: 'Avg client CSAT',      unit: 'score',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Falling client satisfaction is the earliest signal of a renewal at risk.' }),
    createMetricDefinition({ key: 'utilisation_rate',    label: 'Team utilisation (%)', unit: 'percent', preferredDirection: 'contextual',       defaultInterpretation: 'Under-utilisation wastes capacity; over-utilisation burns out delivery quality.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'client-delivery:projects-at-risk-watch', metricKey: 'projects_at_risk',    comparator: 'gt', value: 0,  status: 'watch', severity: 'high',   title: 'Projects flagged at risk',        summary: 'One or more active projects are flagged as at risk.',                     recommendation: 'Review the at-risk projects and determine if timeline, budget, or scope needs to be reset with the client.', rationale: 'At-risk projects rarely self-correct without intervention.' }),
      createThresholdRule({ id: 'client-delivery:overdue-watch',          metricKey: 'overdue_milestones',  comparator: 'gt', value: 1,  status: 'watch', severity: 'medium', title: 'Overdue milestones are stacking', summary: 'More than one milestone is overdue across the portfolio.',               recommendation: 'Identify root causes for each overdue milestone and communicate proactively with the affected clients.', rationale: 'Missed milestones compound client dissatisfaction if not managed immediately.' }),
      createThresholdRule({ id: 'client-delivery:csat-watch',             metricKey: 'avg_client_csat',     comparator: 'lt', value: 75, status: 'watch', severity: 'high',   title: 'Client satisfaction is softening', summary: 'Average client satisfaction has dropped below 75.',                      recommendation: 'Identify the lowest-scoring relationships and schedule a direct check-in call.', rationale: 'Satisfaction below 75 is an early signal of a renewal at risk.' }),
      createThresholdRule({ id: 'client-delivery:utilisation-low',        metricKey: 'utilisation_rate',    comparator: 'lt', value: 65, status: 'watch', severity: 'medium', title: 'Team utilisation is low',          summary: 'Team is running below 65% utilisation — capacity is being wasted.',       recommendation: 'Review pipeline to increase billable work, or right-size the team.', rationale: 'Under-utilisation directly hurts margin and signals a pipeline problem is approaching.' }),
      createThresholdRule({ id: 'client-delivery:utilisation-high',       metricKey: 'utilisation_rate',    comparator: 'gt', value: 90, status: 'watch', severity: 'medium', title: 'Team is over-utilised',            summary: 'Team utilisation is above 90% — delivery quality and burn risk are increasing.', recommendation: 'Review staffing plans and assess whether any projects need additional resources.', rationale: 'Sustained over-utilisation degrades delivery quality and increases attrition risk.' }),
    ],
    notes: ['Watch at-risk projects, missed milestones, client satisfaction, and team utilisation as the weekly delivery pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'projects_at_risk',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.projects_at_risk' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_budget_consumed', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_budget_consumed' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'overdue_milestones',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.overdue_milestones' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_client_csat',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_client_csat' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'utilisation_rate',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.utilisation_rate' }],    source: 'intelligence_brief' }),
  ],
})

// ─── Compound rules by industry ───────────────────────────────────────────────

export const COMPOUND_RULES_SAAS = [
  createCompoundRule({ id: 'compound:cash-fragility',           conditions: [{ metricKey: 'churn_rate', comparator: 'gt', value: 5 }, { metricKey: 'runway_months', comparator: 'lt', value: 9 }],       title: 'Cash fragility',              summary: 'High churn combined with short runway creates compounding financial pressure.',              recommendation: 'Treat churn reduction and cash conservation as a single priority — one directly extends the other.',  rootCause: 'The likely driver is revenue retention weakening while the cash buffer is already narrow.', impact: 'If ignored, the company has less room to fix churn before cash decisions become reactive.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:pipeline-collapse',        conditions: [{ metricKey: 'open_deals', comparator: 'eq', value: 0 }, { metricKey: 'lead_volume', comparator: 'lt', value: 10 }],         title: 'Pipeline collapse',           summary: 'No open deals and lead flow below 10 — the revenue engine has stalled at both ends.',       recommendation: 'Start an outbound sprint immediately and review every lead source for blockage.',                    rootCause: 'The likely driver is a stalled demand engine with too little lead flow to create new opportunities.', impact: 'If ignored, upcoming revenue will depend on chance rather than an active pipeline.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:unit-economics-inversion', conditions: [{ metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 1 }, { metricKey: 'churn_rate', comparator: 'gt', value: 5 }],        title: 'Unit economics are inverted', summary: 'LTV:CAC below 1 and churn above 5% means acquiring customers is destroying value.',           recommendation: 'Pause acquisition spend and fix retention before scaling further.',                                  rootCause: 'The likely driver is acquisition spend reaching customers who do not retain long enough to pay back.', impact: 'If ignored, growth spend can increase losses faster than it increases durable revenue.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:execution-breakdown',      conditions: [{ metricKey: 'goal_progress', comparator: 'lt', value: 60 }, { metricKey: 'followthrough_rate', comparator: 'lt', value: 60 }], title: 'Execution breakdown',      summary: 'Goal progress below 60% and follow-through below 60% — strategy is not surviving execution.', recommendation: 'Cut active priorities to 3 or fewer and rebuild weekly accountability.',                           rootCause: 'The likely driver is weak operating cadence: goals are set, but commitments are not consistently closed.', impact: 'If ignored, strategy will keep turning into unfinished work instead of measurable progress.', severity: 'high' }),
  createCompoundRule({ id: 'compound:sales-process-breakdown',  conditions: [{ metricKey: 'stage_conversion', comparator: 'lt', value: 15 }, { metricKey: 'sales_cycle_days', comparator: 'gt', value: 45 }], title: 'Sales process breakdown',  summary: 'Conversion below 15% and sales cycle above 45 days — the funnel is leaking at every stage.', recommendation: 'Run a focused sales process diagnostic and fix qualification and late-stage friction first.', rootCause: 'The likely driver is sales friction that is both slowing deals down and reducing conversion quality.', impact: 'If ignored, pipeline will consume more time while producing fewer closed customers.', severity: 'high' }),
]

export const COMPOUND_RULES_ECOMMERCE = [
  createCompoundRule({ id: 'compound:revenue-inventory-risk',  conditions: [{ metricKey: 'out_of_stock_skus', comparator: 'gt', value: 3 }, { metricKey: 'daily_revenue', comparator: 'lt', value: 0 }], title: 'Revenue blocked by inventory', summary: 'Multiple stockouts are directly suppressing revenue.',                                         recommendation: 'Emergency reorder on stocked-out SKUs and review demand forecasting.', rootCause: 'The likely driver is inventory availability limiting what customers can actually buy.', impact: 'If ignored, demand can be wasted while customers switch to available alternatives.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:margin-pressure',         conditions: [{ metricKey: 'refund_rate', comparator: 'gt', value: 8 }, { metricKey: 'repeat_rate', comparator: 'lt', value: 15 }],         title: 'Margin and retention both weak', summary: 'High refunds and low repeat rate together are destroying margin from both sides.',              recommendation: 'Fix the product or fulfilment issues driving refunds — these are the same issues killing repeat rate.', rootCause: 'The likely driver is a post-purchase experience that is both triggering refunds and discouraging repeat orders.', impact: 'If ignored, the store pays to acquire customers who return once and do not come back.', severity: 'high' }),
]

export const COMPOUND_RULES_MANUFACTURING = [
  createCompoundRule({ id: 'compound:production-quality-spiral', conditions: [{ metricKey: 'avg_machine_uptime', comparator: 'lt', value: 80 }, { metricKey: 'defect_rate', comparator: 'gt', value: 4 }], title: 'Production quality spiral', summary: 'Low uptime and high defect rate together signal a machine or process failure cascading into quality.', recommendation: 'Stop affected lines for inspection before the defect rate spreads to customer shipments.', rootCause: 'The likely driver is equipment or process instability showing up as both downtime and defects.', impact: 'If ignored, production shortfalls can turn into scrap cost, rework, and customer shipment risk.', severity: 'critical' }),
]

export const COMPOUND_RULES_PS = [
  createCompoundRule({ id: 'compound:delivery-revenue-risk', conditions: [{ metricKey: 'projects_at_risk', comparator: 'gt', value: 1 }, { metricKey: 'overdue_milestones', comparator: 'gt', value: 2 }], title: 'Delivery and revenue at risk', summary: 'Multiple at-risk projects and overdue milestones together create significant renewal and billing risk.', recommendation: 'Convene a delivery review and reset client expectations immediately on the most critical engagements.', rootCause: 'The likely driver is delivery execution slipping across multiple projects at the same time.', impact: 'If ignored, clients may delay payment, reduce scope, or question renewals.', severity: 'critical' }),
]

export const COMPOUND_RULES_MARKETPLACE = [
  createCompoundRule({ id: 'compound:platform-trust-failure',     conditions: [{ metricKey: 'disputes',           comparator: 'gt', value: 10  }, { metricKey: 'failed_transactions', comparator: 'gt', value: 5   }], title: 'Platform trust failure',              summary: 'High disputes and failed transactions simultaneously — both buyer and seller trust is breaking down.',                                           recommendation: 'Investigate whether the failure pattern concentrates by seller, category, or payment method and fix the root source.',        rootCause: 'The likely driver is transaction reliability breaking down in ways users can see and contest.', impact: 'If ignored, buyers and sellers may reduce activity because the platform feels unreliable.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:marketplace-liquidity-thin', conditions: [{ metricKey: 'take_rate',          comparator: 'lt', value: 10  }, { metricKey: 'transaction_count',   comparator: 'lt', value: 10  }], title: 'Marketplace liquidity thinning',       summary: 'Low transaction volume and falling take rate together signal supply or demand quality is deteriorating.',                                recommendation: 'Run a supply-side and demand-side health review simultaneously — identify where liquidity is leaking.',                         rootCause: 'The likely driver is marketplace liquidity weakening on either the supply side, demand side, or both.', impact: 'If ignored, fewer successful matches can make the marketplace feel empty and reduce monetisation.', severity: 'high'     }),
]

export const COMPOUND_RULES_CONSUMER_APP = [
  createCompoundRule({ id: 'compound:retention-revenue-spiral', conditions: [{ metricKey: 'd30_retention',  comparator: 'lt', value: 10 }, { metricKey: 'sub_cancellation', comparator: 'gt', value: 10 }], title: 'Retention and revenue spiral',     summary: 'Low D30 retention and rising subscription cancellations mean the app is losing users and paid revenue simultaneously.',          recommendation: 'Fix the core habit loop before pushing paid conversion — retention is the prerequisite to revenue.',                  rootCause: 'The likely driver is a weak product habit loop that is not holding users or paid subscribers.', impact: 'If ignored, monetisation work will have less effect because users leave before value compounds.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:acquisition-spend-wasted', conditions: [{ metricKey: 'cpi',           comparator: 'gt', value: 5  }, { metricKey: 'uninstall_rate',   comparator: 'gt', value: 30 }], title: 'Paid acquisition spend wasted',    summary: 'High CPI and high uninstall rate mean money is being spent acquiring users who immediately leave.',                            recommendation: 'Pause or cut paid spend until first-session experience is fixed — every install at this uninstall rate burns cash.', rootCause: 'The likely driver is paid traffic reaching users who do not find enough value in the first sessions.', impact: 'If ignored, acquisition spend can keep buying installs without building a retained audience.', severity: 'high'     }),
]

export const COMPOUND_RULES_HOSPITALITY = [
  createCompoundRule({ id: 'compound:guest-experience-revenue-spiral', conditions: [{ metricKey: 'occupancy_rate',  comparator: 'lt', value: 60  }, { metricKey: 'avg_review_score', comparator: 'lt', value: 4.0 }], title: 'Guest experience destroying occupancy', summary: 'Low occupancy and poor reviews compound — the experience problem is now directly suppressing future bookings.',                    recommendation: 'Fix the top complaint categories this week — they are the cause of the occupancy gap, not a separate issue.', rootCause: 'The likely driver is guest experience quality reducing both reviews and future booking confidence.', impact: 'If ignored, poor reviews can continue lowering occupancy even when marketing spend increases.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:cancellation-review-risk',        conditions: [{ metricKey: 'cancellations',   comparator: 'gt', value: 10  }, { metricKey: 'avg_review_score', comparator: 'lt', value: 4.0 }], title: 'Cancellations and review decline',      summary: 'High cancellations and falling reviews together signal a booking channel or expectations problem compounding.',                   recommendation: 'Review the booking sources driving most cancellations and the reviews citing unmet expectations.',                    rootCause: 'The likely driver is an expectation gap between what guests book and what they experience.', impact: 'If ignored, cancellations and reviews can reinforce each other and make future bookings harder to win.', severity: 'high'     }),
]

export const COMPOUND_RULES_HEALTHCARE = [
  createCompoundRule({ id: 'compound:patient-and-revenue-leaking', conditions: [{ metricKey: 'no_show_rate', comparator: 'gt', value: 20 }, { metricKey: 'collection_rate', comparator: 'lt', value: 90 }], title: 'Patient flow and collections both failing', summary: 'High no-show rate and low collection rate are destroying capacity and revenue simultaneously — neither problem is being caught.', recommendation: 'Fix appointment reminders first — reducing no-shows is the single highest-leverage move for both capacity and revenue.', rootCause: 'The likely driver is front-office operating discipline weakening across attendance and collections.', impact: 'If ignored, the practice loses usable capacity while collecting less from the care it does deliver.', severity: 'critical' }),
]

export const COMPOUND_RULES_WHOLESALE = [
  createCompoundRule({ id: 'compound:customer-quality-deterioration', conditions: [{ metricKey: 'account_churn',          comparator: 'gt', value: 2  }, { metricKey: 'days_sales_outstanding', comparator: 'gt', value: 45 }], title: 'Account quality deteriorating',  summary: 'Accounts churning and DSO rising together signal the customer base is deteriorating in both count and payment quality.', recommendation: 'Segment accounts by risk level and address the highest-risk ones before they worsen further.', rootCause: 'The likely driver is customer quality weakening: accounts are leaving and remaining accounts are paying more slowly.', impact: 'If ignored, revenue quality can deteriorate even while booked sales still look acceptable.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:cash-flow-squeeze',             conditions: [{ metricKey: 'overdue_invoices',        comparator: 'gt', value: 3  }, { metricKey: 'days_sales_outstanding', comparator: 'gt', value: 60 }], title: 'Cash flow squeeze',             summary: 'Multiple overdue invoices and DSO above 60 days mean cash conversion is breaking down at a structural level.',          recommendation: 'Run an immediate collections sweep and suspend credit terms for all accounts over 60 days outstanding.',          rootCause: 'The likely driver is collections discipline lagging while receivables age beyond normal terms.', impact: 'If ignored, cash can tighten even when sales volume appears healthy on paper.', severity: 'high'     }),
]

export const COMPOUND_RULES_LOGISTICS = [
  createCompoundRule({ id: 'compound:fleet-delivery-failure', conditions: [{ metricKey: 'on_time_rate', comparator: 'lt', value: 90 }, { metricKey: 'breakdowns', comparator: 'gt', value: 3 }], title: 'Fleet issues causing delivery failure', summary: 'Breakdowns and on-time delivery failures are compounding — fleet reliability is the likely driver of the service deterioration.', recommendation: 'Prioritise emergency maintenance on the highest-breakdown vehicles before late deliveries trigger customer exits.', rootCause: 'The likely driver is fleet reliability degrading enough to show up in delivery performance.', impact: 'If ignored, late deliveries can become a customer retention issue rather than an operations-only problem.', severity: 'critical' }),
]

export const COMPOUND_RULES_CONSTRUCTION = [
  createCompoundRule({ id: 'compound:pipeline-collapse-and-cash', conditions: [{ metricKey: 'bid_win_rate', comparator: 'lt', value: 20 }, { metricKey: 'runway_months', comparator: 'lt', value: 6 }], title: 'Pipeline collapse with critical runway', summary: 'Low bid win rate and less than 6 months runway together create existential risk — the front-end is failing while cash runs out.', recommendation: 'Prioritise any in-progress bids and reduce non-essential costs immediately — do not wait for results.', rootCause: 'The likely driver is weak bid conversion arriving at the same time as a tight cash position.', impact: 'If ignored, the company may have too little runway to wait for the next bid cycle to recover.', severity: 'critical' }),
]

export const COMPOUND_RULES_REAL_ESTATE = [
  createCompoundRule({ id: 'compound:vacancy-and-arrears', conditions: [{ metricKey: 'vacancy_days_avg', comparator: 'gt', value: 30 }, { metricKey: 'rent_arrears', comparator: 'gt', value: 3 }], title: 'Vacancy and arrears creating double cash squeeze', summary: 'Long vacancy periods and multiple rent arrears together create a compound income shortfall from both ends of the portfolio.', recommendation: 'Address arrears through formal process and improve vacant unit marketing simultaneously — they share the same urgency.', rootCause: 'The likely driver is portfolio cash collection weakening from both empty units and unpaid occupied units.', impact: 'If ignored, portfolio income can fall from two directions while fixed property costs continue.', severity: 'critical' }),
]

// ─── Extended areas (38 industry-specific) ──────────────────────────────────

export const AREA_PRODUCT_ENGINEERING = createArea({
  id: 'product-engineering',
  label: 'Product & Engineering',
  industries: ['saas-software', 'consumer-app'],
  connectors: ['github', 'jira', 'linear'],
  businessLogic: {
    objective: 'Keep shipping velocity high and technical health stable so product delivery does not become the bottleneck.',
    questions: ['Is the team shipping consistently?', 'Are bugs and incidents rising?', 'Is reliability strong enough to hold customer trust?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'features_shipped',  label: 'Features shipped',  unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Shipping cadence is the most visible signal of product team health.' }),
    createMetricDefinition({ key: 'bugs_open',         label: 'Open bugs',         unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'A growing bug backlog means technical debt accumulates faster than it is cleared.' }),
    createMetricDefinition({ key: 'incidents',         label: 'Incidents',         unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Recurring incidents signal reliability problems eroding customer confidence.' }),
    createMetricDefinition({ key: 'uptime_pct',        label: 'Uptime (%)',        unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Uptime below 99.5% is a customer-facing reliability problem.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'product-engineering:bugs-watch',    metricKey: 'bugs_open',   comparator: 'gt', value: 20,   status: 'watch', severity: 'medium', title: 'Bug backlog is growing',         summary: 'Open bug count is compounding — technical debt building.', recommendation: 'Dedicate a sprint to triage and clear top-severity bugs.', rationale: 'Unmanaged bug backlogs slow future shipping velocity.' }),
      createThresholdRule({ id: 'product-engineering:uptime-bad',    metricKey: 'uptime_pct',  comparator: 'lt', value: 99.5, status: 'bad',   severity: 'high',   title: 'Uptime below acceptable baseline', summary: 'Service reliability is slipping.', recommendation: 'Run a post-mortem on recent incidents and fix the recurring root cause.', rationale: 'Uptime below 99.5% is visible to customers and damages trust.' }),
      createThresholdRule({ id: 'product-engineering:incidents-watch', metricKey: 'incidents', comparator: 'gt', value: 3,    status: 'watch', severity: 'medium', title: 'Incident rate is elevated',      summary: 'Multiple incidents this period — systemic reliability gap.', recommendation: 'Investigate whether incidents share a root cause.', rationale: 'Repeated incidents compound if not addressed at the system level.' }),
    ],
    notes: ['Watch shipping velocity, bug backlog, incident rate, uptime as the weekly engineering pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'features_shipped', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.features_shipped' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'bugs_open',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.bugs_open' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'incidents',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.incidents' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'uptime_pct',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.uptime_pct' }],       source: 'intelligence_brief' }),
  ],
})

// ─── People & HR ──────────────────────────────────────────────────────────────

export const AREA_PEOPLE_HR = createArea({
  id: 'people-hr',
  label: 'People & HR',
  industries: ['saas-software', 'professional-services', 'manufacturing', 'consumer-app', 'retail', 'retail-hospitality', 'hospitality-fb', 'logistics-freight', 'wholesale-distribution', 'construction', 'healthcare', 'education'],
  connectors: ['bamboohr', 'gusto'],
  businessLogic: {
    objective: 'Keep team capacity, retention, and hiring pipeline healthy so people do not become the execution bottleneck.',
    questions: ['Is attrition rising?', 'Are open roles being filled in time?', 'Is the team over-stretched or under-utilised?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'headcount',      label: 'Headcount',       unit: 'count',   preferredDirection: 'contextual',       defaultInterpretation: 'Headcount alone is not good or bad — it must be read against output and burn.' }),
    createMetricDefinition({ key: 'open_roles',     label: 'Open roles',      unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Too many open roles for too long signals hiring debt that slows the business.' }),
    createMetricDefinition({ key: 'attrition_rate', label: 'Attrition rate',  unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Elevated attrition destroys institutional knowledge and hiring investment.' }),
    createMetricDefinition({ key: 'time_to_hire',   label: 'Time to hire (days)', unit: 'days', preferredDirection: 'lower-is-better', defaultInterpretation: 'Long time-to-hire means roles stay open too long, slowing capacity.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'people-hr:attrition-watch', metricKey: 'attrition_rate', comparator: 'gt', value: 10, status: 'watch', severity: 'medium', title: 'Attrition is elevated',     summary: 'Annualised attrition above 10% — knowledge and hiring investment at risk.', recommendation: 'Identify the primary departure reasons and address the top cause.', rationale: 'Elevated attrition compounds delivery risk faster than hiring can offset.' }),
      createThresholdRule({ id: 'people-hr:attrition-bad',   metricKey: 'attrition_rate', comparator: 'gt', value: 20, status: 'bad',   severity: 'high',   title: 'Attrition is critically high', summary: 'Over 20% annualised — team stability is at risk.', recommendation: 'Treat retention as an operating priority — survey and act fast.', rationale: 'At this level, attrition creates a delivery and morale spiral.' }),
      createThresholdRule({ id: 'people-hr:open-roles-watch', metricKey: 'open_roles',    comparator: 'gt', value: 3,  status: 'watch', severity: 'medium', title: 'Open roles backlog building', summary: 'More than 3 open roles — capacity gap forming.', recommendation: 'Prioritise the highest-leverage roles and accelerate the hiring pipeline.', rationale: 'Sustained open roles create delivery bottlenecks that compound over quarters.' }),
    ],
    notes: ['Watch attrition, open roles, and time-to-hire as the people health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'headcount',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.headcount' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'open_roles',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.open_roles' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'attrition_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.attrition_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'time_to_hire',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.time_to_hire' }],   source: 'intelligence_brief' }),
  ],
})

// ─── Marketplace / Platform ───────────────────────────────────────────────────

export const AREA_MARKETPLACE_TRANSACTIONS = createArea({
  id: 'marketplace-transactions',
  label: 'Transactions & GMV',
  industries: ['marketplace-platform'],
  connectors: ['stripe'],
  businessLogic: {
    objective: 'Keep transaction volume, take rate, and GMV growing without hidden quality deterioration.',
    questions: ['Is GMV healthy?', 'Is take rate holding?', 'Are failed transactions rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'gmv',                  label: 'GMV',                   unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'GMV is the top-level health signal for a marketplace.' }),
    createMetricDefinition({ key: 'take_rate',            label: 'Take rate (%)',         unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Falling take rate signals pricing pressure or seller negotiation leverage.' }),
    createMetricDefinition({ key: 'transaction_count',    label: 'Transactions',          unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Volume trend separate from GMV reveals whether AOV is driving growth or volume is.' }),
    createMetricDefinition({ key: 'failed_transactions',  label: 'Failed transactions',   unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising failures signal payment rail or trust issues.' }),
    createMetricDefinition({ key: 'avg_order_value',      label: 'Average order value',   unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'AOV shift reveals product mix or pricing changes on the supply side.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'marketplace-transactions:take-rate-watch', metricKey: 'take_rate',           comparator: 'lt', value: 10, status: 'watch', severity: 'medium', title: 'Take rate is softening',        summary: 'Take rate has dropped — revenue efficiency per transaction is falling.', recommendation: 'Review pricing changes, seller negotiations, and promotional discounts.', rationale: 'Falling take rate is often the earliest revenue quality signal on a marketplace.' }),
      createThresholdRule({ id: 'marketplace-transactions:failed-tx-watch', metricKey: 'failed_transactions', comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'Failed transactions rising',    summary: 'Transaction failure rate is elevated — trust or payment rail issue.', recommendation: 'Investigate whether failures are buyer-side, seller-side, or payment gateway.', rationale: 'Failed transactions destroy buyer trust and suppress repeat purchase.' }),
    ],
    notes: ['Watch GMV, take rate, and transaction failure rate as the primary marketplace health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'gmv',               transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.gmv' }],               source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'take_rate',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.take_rate' }],         source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'transaction_count', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.transaction_count' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_order_value',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_order_value' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_MARKETPLACE_TRUST = createArea({
  id: 'marketplace-trust',
  label: 'Trust & Safety',
  industries: ['marketplace-platform'],
  connectors: [],
  businessLogic: {
    objective: 'Keep disputes, fraud, and policy violations low enough that buyer and seller trust in the platform is preserved.',
    questions: ['Are disputes rising?', 'Is fraud increasing?', 'Are policy violations undermining supply quality?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'disputes',          label: 'Disputes raised',    unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Rising disputes signal quality or trust breakdown on the platform.' }),
    createMetricDefinition({ key: 'fraud_flagged',     label: 'Fraud flagged',      unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Fraud events signal platform safety gaps that compound if not closed.' }),
    createMetricDefinition({ key: 'policy_violations', label: 'Policy violations',  unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Violations damage supply quality and expose the platform to liability.' }),
    createMetricDefinition({ key: 'dispute_resolution_days', label: 'Avg dispute resolution (days)', unit: 'days', preferredDirection: 'lower-is-better', defaultInterpretation: 'Slow resolution erodes trust for both parties.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'marketplace-trust:disputes-watch',    metricKey: 'disputes',          comparator: 'gt', value: 5,  status: 'watch', severity: 'high',   title: 'Disputes are rising',          summary: 'Dispute volume is elevated — trust or quality issue forming.', recommendation: 'Identify whether disputes concentrate on specific sellers or categories.', rationale: 'Rising disputes damage both buyer and seller trust simultaneously.' }),
      createThresholdRule({ id: 'marketplace-trust:fraud-watch',       metricKey: 'fraud_flagged',     comparator: 'gt', value: 3,  status: 'watch', severity: 'high',   title: 'Fraud events detected',       summary: 'Fraud flags above baseline — platform safety gap.', recommendation: 'Review fraud detection rules and recent flagged events for patterns.', rationale: 'Fraud compounds quickly if not closed at the pattern level.' }),
      createThresholdRule({ id: 'marketplace-trust:violations-watch',  metricKey: 'policy_violations', comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'Policy violations accumulating', summary: 'Policy breach count is above a healthy baseline.', recommendation: 'Enforce platform policy consistently and address repeat violators.', rationale: 'Unaddressed violations degrade supply quality and set bad norms.' }),
    ],
    notes: ['Watch disputes, fraud, and policy violations as the trust health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'disputes',          transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.disputes' }],          source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'fraud_flagged',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.fraud_flagged' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'policy_violations', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.policy_violations' }], source: 'intelligence_brief' }),
  ],
})

// ─── Consumer App ─────────────────────────────────────────────────────────────

export const AREA_APP_ENGAGEMENT = createArea({
  id: 'app-engagement',
  label: 'Engagement & Retention',
  industries: ['consumer-app'],
  connectors: ['amplitude', 'mixpanel'],
  businessLogic: {
    objective: 'Keep users active and returning — engagement depth is the foundation of all app monetisation.',
    questions: ['Are users returning after install?', 'Is session depth healthy?', 'Is the D7/D30 retention holding?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'dau',         label: 'Daily active users',  unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'DAU is the clearest daily signal of app engagement health.' }),
    createMetricDefinition({ key: 'mau',         label: 'Monthly active users', unit: 'count',  preferredDirection: 'higher-is-better', defaultInterpretation: 'DAU/MAU ratio reveals stickiness — how often monthly users return daily.' }),
    createMetricDefinition({ key: 'd7_retention', label: 'D7 retention (%)',   unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'D7 retention is the strongest early signal of product-market fit for a consumer app.' }),
    createMetricDefinition({ key: 'd30_retention', label: 'D30 retention (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'D30 retention shows whether the product has a habit loop, not just initial curiosity.' }),
    createMetricDefinition({ key: 'avg_session_min', label: 'Avg session (min)', unit: 'minutes', preferredDirection: 'higher-is-better', defaultInterpretation: 'Session depth shows whether users are getting value or just bouncing.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'app-engagement:d7-retention-watch', metricKey: 'd7_retention',  comparator: 'lt', value: 20, status: 'watch', severity: 'high',   title: 'D7 retention is below baseline', summary: 'Fewer than 20% of new users are returning after 7 days.', recommendation: 'Audit onboarding — the first session is not creating enough value to drive return.', rationale: 'D7 below 20% means the product is not forming a habit in early users.' }),
      createThresholdRule({ id: 'app-engagement:d30-retention-bad',  metricKey: 'd30_retention', comparator: 'lt', value: 10, status: 'bad',   severity: 'high',   title: 'D30 retention is critically low', summary: 'Under 10% of users are still active after 30 days.', recommendation: 'Run a cohort analysis to identify where and when users drop and fix the core loop.', rationale: 'D30 below 10% means the product lacks a sustainable habit loop.' }),
    ],
    notes: ['D7 and D30 retention are the most important signals for consumer app health.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'dau',            transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.dau' }],            source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'mau',            transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.mau' }],            source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'd7_retention',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.d7_retention' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'd30_retention',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.d30_retention' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_session_min', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_session_min' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_APP_GROWTH = createArea({
  id: 'app-growth',
  label: 'Growth & Acquisition',
  industries: ['consumer-app'],
  connectors: ['appsflyer', 'adjust'],
  businessLogic: {
    objective: 'Keep install volume healthy with a good organic/paid mix to avoid being acquisition-dependent.',
    questions: ['Are installs growing?', 'Is uninstall rate too high?', 'What is the organic vs paid split?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'new_installs',    label: 'New installs',       unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Install volume is the top-of-funnel signal for growth.' }),
    createMetricDefinition({ key: 'uninstall_rate',  label: 'Uninstall rate (%)', unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'High uninstall rate means new users are quickly deciding the app is not worth keeping.' }),
    createMetricDefinition({ key: 'organic_pct',     label: 'Organic installs (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Organic share shows whether the product has word-of-mouth pull.' }),
    createMetricDefinition({ key: 'cpi',             label: 'Cost per install',   unit: 'currency', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising CPI means paid acquisition is getting more expensive.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'app-growth:uninstall-watch', metricKey: 'uninstall_rate', comparator: 'gt', value: 30, status: 'watch', severity: 'medium', title: 'Uninstall rate is elevated', summary: 'More than 30% of installs are uninstalling — early value is not landing.', recommendation: 'Review first-session experience and push notification strategy.', rationale: 'High uninstall rate burns acquisition spend before any LTV is captured.' }),
      createThresholdRule({ id: 'app-growth:cpi-watch',       metricKey: 'cpi',            comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'Paid acquisition cost rising', summary: 'CPI above $5 — paid growth efficiency is declining.', recommendation: 'Test new creative angles and review audience targeting.', rationale: 'Rising CPI quickly erodes LTV/CAC if not offset by improved retention.' }),
    ],
    notes: ['Watch installs, uninstall rate, and CPI as the growth efficiency signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'new_installs',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.new_installs' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'uninstall_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.uninstall_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'organic_pct',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.organic_pct' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'cpi',            transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.cpi' }],            source: 'intelligence_brief' }),
  ],
})

export const AREA_APP_MONETISATION = createArea({
  id: 'app-monetisation',
  label: 'Monetisation',
  industries: ['consumer-app'],
  connectors: ['stripe', 'revenuecat'],
  businessLogic: {
    objective: 'Keep in-app revenue healthy by watching conversion, subscription health, and refund signals.',
    questions: ['Is the free-to-paid conversion holding?', 'Are subscriptions being retained?', 'Are refunds elevated?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'arpu',              label: 'ARPU',                  unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'ARPU is the clearest single number for monetisation health.' }),
    createMetricDefinition({ key: 'paid_conversion',   label: 'Free-to-paid (%)',      unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Conversion rate shows whether engaged users are finding the paywall compelling.' }),
    createMetricDefinition({ key: 'sub_cancellation',  label: 'Subscription cancellations', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Cancellations tell you whether retained users still find the product worth paying for.' }),
    createMetricDefinition({ key: 'refund_rate',       label: 'Refund rate (%)',       unit: 'percent',  preferredDirection: 'lower-is-better',  defaultInterpretation: 'Elevated refunds signal buyer remorse or unclear value proposition.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'app-monetisation:conversion-watch',  metricKey: 'paid_conversion', comparator: 'lt', value: 2,  status: 'watch', severity: 'medium', title: 'Free-to-paid conversion is low', summary: 'Less than 2% of users are converting to paid.', recommendation: 'Review paywall placement, pricing, and the moment of conversion offer.', rationale: 'Low conversion means engaged users are not finding the paid value compelling.' }),
      createThresholdRule({ id: 'app-monetisation:cancellations-watch', metricKey: 'sub_cancellation', comparator: 'gt', value: 10, status: 'watch', severity: 'medium', title: 'Subscription cancellations rising', summary: 'Cancellation volume is elevated — retention of paying users is weakening.', recommendation: 'Survey recently churned paid users to identify the primary reason.', rationale: 'Paid churn destroys LTV and signals the product is not delivering enough value at the price.' }),
    ],
    notes: ['Watch ARPU, free-to-paid conversion, and subscription cancellations as the monetisation pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'arpu',             transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.arpu' }],             source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'paid_conversion',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.paid_conversion' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'sub_cancellation', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.sub_cancellation' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'refund_rate',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.refund_rate' }],      source: 'intelligence_brief' }),
  ],
})

// ─── Life Sciences ─────────────────────────────────────────────────────────────

export const AREA_RD_PIPELINE = createArea({
  id: 'rd-pipeline',
  label: 'R&D Pipeline',
  industries: ['life-sciences'],
  connectors: [],
  businessLogic: {
    objective: 'Keep the research pipeline advancing and runway sufficient to reach the next value milestone.',
    questions: ['Are experiments advancing candidates?', 'Is the pipeline moving through phases?', 'Is burn matching progress pace?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'experiments_run',       label: 'Experiments run',         unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Experiment cadence shows research team velocity.' }),
    createMetricDefinition({ key: 'candidates_advanced',   label: 'Candidates advanced',     unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Candidates advancing through phases is the clearest R&D output signal.' }),
    createMetricDefinition({ key: 'rd_burn',               label: 'R&D monthly burn',        unit: 'currency', preferredDirection: 'lower-is-better', defaultInterpretation: 'R&D burn must be matched against pipeline progress to assess efficiency.' }),
    createMetricDefinition({ key: 'runway_months',         label: 'Runway (months)',         unit: 'months',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Runway below 12 months creates pressure before the next milestone or raise.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'rd-pipeline:runway-watch', metricKey: 'runway_months',       comparator: 'lt', value: 12, status: 'watch', severity: 'high',   title: 'Runway is tightening',           summary: 'Less than 12 months of runway — next milestone or raise is time-constrained.', recommendation: 'Start fundraising process now; do not wait until runway is critical.', rationale: 'Life sciences fundraising takes 6-9 months — sub-12 runway is already urgent.' }),
      createThresholdRule({ id: 'rd-pipeline:runway-bad',   metricKey: 'runway_months',       comparator: 'lt', value: 6,  status: 'bad',   severity: 'critical', title: 'Runway is critical',           summary: 'Under 6 months of runway — existential timeline.', recommendation: 'Initiate bridge financing, grants, or partnership discussions immediately.', rationale: 'Below 6 months, all strategic optionality is gone.' }),
      createThresholdRule({ id: 'rd-pipeline:stalled',      metricKey: 'candidates_advanced', comparator: 'lt', value: 1,  status: 'watch', severity: 'medium', title: 'No candidates advancing',        summary: 'No research candidates have progressed this period.', recommendation: 'Review whether experiments are generating decision-quality data and adjust protocols.', rationale: 'A stalled pipeline with burning runway is the core life sciences risk.' }),
    ],
    notes: ['Watch runway, candidate advancement, and R&D burn as the pipeline health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'experiments_run',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.experiments_run' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'candidates_advanced', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.candidates_advanced' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'rd_burn',             transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.rd_burn' }],               source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'runway_months',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.runway' }],               source: 'intelligence_brief' }),
  ],
})

export const AREA_CLINICAL_REGULATORY = createArea({
  id: 'clinical-regulatory',
  label: 'Clinical & Regulatory',
  industries: ['life-sciences'],
  connectors: [],
  businessLogic: {
    objective: 'Keep clinical execution on plan and regulatory filings on schedule to protect the approval timeline.',
    questions: ['Is enrolment on pace?', 'Are adverse events within expected bounds?', 'Are regulatory submissions on schedule?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'patients_enrolled',      label: 'Patients enrolled',      unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Enrolment pace determines trial timeline and burn rate.' }),
    createMetricDefinition({ key: 'adverse_events',         label: 'Adverse events',         unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Adverse events above expected rate trigger regulatory scrutiny and trial risk.' }),
    createMetricDefinition({ key: 'regulatory_submissions', label: 'Regulatory submissions', unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Submission cadence tracks regulatory engagement progress.' }),
    createMetricDefinition({ key: 'protocol_amendments',    label: 'Protocol amendments',   unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Amendments delay trials and increase cost — too many signal execution instability.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'clinical-regulatory:adverse-watch', metricKey: 'adverse_events',    comparator: 'gt', value: 2, status: 'watch', severity: 'high',   title: 'Adverse events above threshold', summary: 'Adverse event count exceeding expected — regulatory and safety review needed.', recommendation: 'Convene safety monitoring committee and assess whether trial pause is warranted.', rationale: 'Adverse events beyond expected rates create regulatory and liability risk.' }),
      createThresholdRule({ id: 'clinical-regulatory:amendments',   metricKey: 'protocol_amendments', comparator: 'gt', value: 1, status: 'watch', severity: 'medium', title: 'Protocol amendments accumulating', summary: 'Multiple protocol amendments signal execution instability.', recommendation: 'Stabilise protocol before next site activation to reduce timeline risk.', rationale: 'Amendments delay trials by months and signal design or execution problems.' }),
    ],
    notes: ['Watch enrolment pace, adverse events, and protocol amendments as the clinical health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'patients_enrolled',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.patients_enrolled' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'adverse_events',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.adverse_events' }],         source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'regulatory_submissions', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.regulatory_submissions' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'protocol_amendments',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.protocol_amendments' }],    source: 'intelligence_brief' }),
  ],
})

// ─── Wholesale / Distribution ─────────────────────────────────────────────────

export const AREA_WHOLESALE_SALES = createArea({
  id: 'wholesale-sales',
  label: 'Sales & Accounts',
  industries: ['wholesale-distribution'],
  connectors: ['hubspot'],
  businessLogic: {
    objective: 'Keep account volume, order frequency, and average order value healthy across the B2B customer base.',
    questions: ['Are accounts growing or churning?', 'Is order frequency holding?', 'Is AOV shifting?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'active_accounts',  label: 'Active accounts',      unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Active account count is the B2B equivalent of subscriber count.' }),
    createMetricDefinition({ key: 'orders_this_period', label: 'Orders this period', unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Order frequency shows whether accounts are reordering at a healthy pace.' }),
    createMetricDefinition({ key: 'avg_order_value',  label: 'Average order value',  unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'AOV shift reveals whether accounts are trading down or reducing volumes.' }),
    createMetricDefinition({ key: 'account_churn',    label: 'Accounts churned',     unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'B2B churn is high-impact — each lost account removes a recurring revenue stream.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'wholesale-sales:account-churn-watch', metricKey: 'account_churn',   comparator: 'gt', value: 2, status: 'watch', severity: 'high',   title: 'Account churn is rising',   summary: 'Multiple B2B accounts have churned — recurring revenue at risk.', recommendation: 'Identify departing accounts and the primary reason for exit.', rationale: 'Each wholesale account represents significant recurring revenue — churn compounds fast.' }),
      createThresholdRule({ id: 'wholesale-sales:aov-watch',           metricKey: 'avg_order_value',  comparator: 'lt', value: 0,  status: 'watch', severity: 'medium', title: 'Average order value declining', summary: 'AOV is falling — accounts are ordering less or trading down.', recommendation: 'Check whether volume discounts are being over-applied or a product mix shift is happening.', rationale: 'Falling AOV erodes revenue per account even when order count holds steady.' }),
    ],
    notes: ['Watch active account count, order frequency, and AOV as the wholesale sales pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'active_accounts',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.active_accounts' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'orders_this_period', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.orders_this_period' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_order_value',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_order_value' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'account_churn',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.account_churn' }],      source: 'intelligence_brief' }),
  ],
})

export const AREA_WHOLESALE_CREDIT = createArea({
  id: 'wholesale-credit',
  label: 'Credit & Collections',
  industries: ['wholesale-distribution'],
  connectors: [],
  businessLogic: {
    objective: 'Keep receivables healthy and overdue exposure low so cash flow is not silently eroded by credit risk.',
    questions: ['Are overdue invoices building?', 'Is the credit exposure concentrated?', 'Are write-offs increasing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'overdue_invoices',     label: 'Overdue invoices',        unit: 'count',    preferredDirection: 'lower-is-better', defaultInterpretation: 'Overdue invoice count is the earliest cash flow risk signal in wholesale.' }),
    createMetricDefinition({ key: 'overdue_value',        label: 'Overdue value',           unit: 'currency', preferredDirection: 'lower-is-better', defaultInterpretation: 'Overdue value shows the cash flow impact of the collections backlog.' }),
    createMetricDefinition({ key: 'days_sales_outstanding', label: 'DSO (days)',            unit: 'days',     preferredDirection: 'lower-is-better', defaultInterpretation: 'DSO rising means cash is tied up in receivables — collections are slowing.' }),
    createMetricDefinition({ key: 'write_offs',           label: 'Write-offs',              unit: 'currency', preferredDirection: 'lower-is-better', defaultInterpretation: 'Write-offs signal credit decisions are not being made conservatively enough.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'wholesale-credit:dso-watch',    metricKey: 'days_sales_outstanding', comparator: 'gt', value: 45, status: 'watch', severity: 'medium', title: 'DSO is getting long',           summary: 'Days sales outstanding above 45 — cash conversion is slowing.', recommendation: 'Run an active collections sweep on the oldest overdue accounts.', rationale: 'Rising DSO silently drains cash even when revenue looks healthy.' }),
      createThresholdRule({ id: 'wholesale-credit:writeoff-watch', metricKey: 'write_offs',            comparator: 'gt', value: 0,  status: 'watch', severity: 'high',   title: 'Write-offs this period',       summary: 'Bad debt is being written off — credit quality deteriorating.', recommendation: 'Review credit terms for the accounts that wrote off and tighten approvals.', rationale: 'Write-offs are the most expensive form of credit risk realised.' }),
    ],
    notes: ['Watch DSO, overdue invoices, and write-offs as the credit and collections health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'overdue_invoices',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.overdue_invoices' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'overdue_value',           transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.overdue_value' }],             source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'days_sales_outstanding',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.days_sales_outstanding' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'write_offs',              transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.write_offs' }],               source: 'intelligence_brief' }),
  ],
})

// ─── Logistics & Freight ──────────────────────────────────────────────────────

export const AREA_LOGISTICS_SHIPMENTS = createArea({
  id: 'logistics-shipments',
  label: 'Shipment Operations',
  industries: ['logistics-freight'],
  connectors: [],
  businessLogic: {
    objective: 'Keep on-time delivery rates high and failed/late shipment rates low to protect customer relationships and margins.',
    questions: ['Is on-time delivery holding?', 'Are late and failed deliveries rising?', 'Are penalties accumulating?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'shipments_completed',    label: 'Shipments completed',     unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Volume is the top-line output signal for a logistics business.' }),
    createMetricDefinition({ key: 'on_time_rate',           label: 'On-time delivery (%)',    unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'On-time rate is the primary service quality metric for logistics.' }),
    createMetricDefinition({ key: 'late_deliveries',        label: 'Late deliveries',         unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Late deliveries trigger penalty clauses and damage customer trust.' }),
    createMetricDefinition({ key: 'failed_deliveries',      label: 'Failed deliveries',       unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Failed deliveries create re-delivery cost and customer relationship risk.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'logistics-shipments:on-time-watch', metricKey: 'on_time_rate',    comparator: 'lt', value: 95, status: 'watch', severity: 'high',   title: 'On-time delivery slipping',   summary: 'On-time rate below 95% — customer SLAs at risk.', recommendation: 'Identify the route or carrier segment with the most late deliveries and address root cause.', rationale: 'Below 95% on-time, SLA penalties and customer churn risk escalate quickly.' }),
      createThresholdRule({ id: 'logistics-shipments:failed-watch',  metricKey: 'failed_deliveries', comparator: 'gt', value: 5, status: 'watch', severity: 'medium', title: 'Failed deliveries rising',    summary: 'Failed delivery count is elevated — re-delivery costs and customer friction mounting.', recommendation: 'Review the most common failure reasons (access, address, recipient).', rationale: 'Failed deliveries are the highest-cost shipment type and destroy NPS.' }),
    ],
    notes: ['Watch on-time rate and failed delivery count as the primary shipment health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'shipments_completed', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.shipments_completed' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'on_time_rate',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.on_time_rate' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'late_deliveries',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.late_deliveries' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'failed_deliveries',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.failed_deliveries' }],   source: 'intelligence_brief' }),
  ],
})

export const AREA_LOGISTICS_FLEET = createArea({
  id: 'logistics-fleet',
  label: 'Fleet & Drivers',
  industries: ['logistics-freight'],
  connectors: [],
  businessLogic: {
    objective: 'Keep fleet availability and driver capacity high while managing fuel costs and breakdown risk.',
    questions: ['Is fleet availability sufficient?', 'Are breakdowns rising?', 'Is fuel cost under control?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'vehicles_active',   label: 'Vehicles active',       unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Active vehicle count relative to total fleet shows operational capacity.' }),
    createMetricDefinition({ key: 'breakdowns',        label: 'Breakdowns',            unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising breakdowns signal maintenance debt and create late delivery risk.' }),
    createMetricDefinition({ key: 'fuel_cost',         label: 'Fuel cost (monthly)',   unit: 'currency', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Fuel is typically the largest variable cost for logistics — movement signals margin impact.' }),
    createMetricDefinition({ key: 'driver_utilisation', label: 'Driver utilisation (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Under-utilised drivers represent idle cost; over-utilised drivers create safety risk.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'logistics-fleet:breakdowns-watch', metricKey: 'breakdowns', comparator: 'gt', value: 3, status: 'watch', severity: 'medium', title: 'Breakdowns are elevated', summary: 'Multiple vehicle breakdowns — maintenance debt or fleet age issue.', recommendation: 'Review the maintenance schedule for the vehicles with the most breakdowns.', rationale: 'Repeated breakdowns create late deliveries and compound repair costs.' }),
    ],
    notes: ['Watch vehicle availability, breakdowns, and fuel cost as the fleet health signal.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'vehicles_active',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.vehicles_active' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'breakdowns',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.breakdowns' }],         source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'fuel_cost',          transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.fuel_cost' }],            source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'driver_utilisation', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.driver_utilisation' }], source: 'intelligence_brief' }),
  ],
})

// ─── Hospitality / F&B ────────────────────────────────────────────────────────

export const AREA_HOSPITALITY_REVENUE = createArea({
  id: 'hospitality-revenue',
  label: 'Revenue & Occupancy',
  industries: ['hospitality-fb', 'retail-hospitality'],
  connectors: [],
  businessLogic: {
    objective: 'Keep RevPAR, ADR, and occupancy healthy so revenue per available asset is maximised.',
    questions: ['Is occupancy holding?', 'Is ADR being maintained or discounted away?', 'Are cancellations rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'occupancy_rate', label: 'Occupancy rate (%)', unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Occupancy is the volume signal for hospitality — empty rooms/covers are lost revenue.' }),
    createMetricDefinition({ key: 'adr',            label: 'ADR',               unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'ADR shows whether pricing strategy is holding or being discounted to drive occupancy.' }),
    createMetricDefinition({ key: 'revpar',         label: 'RevPAR',            unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'RevPAR combines occupancy and rate — it is the single best hospitality revenue health number.' }),
    createMetricDefinition({ key: 'cancellations',  label: 'Cancellations',     unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising cancellations disrupt revenue predictability and may signal booking channel issues.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'hospitality-revenue:occupancy-watch', metricKey: 'occupancy_rate', comparator: 'lt', value: 60, status: 'watch', severity: 'medium', title: 'Occupancy below healthy baseline', summary: 'Occupancy under 60% — revenue per available unit is suffering.', recommendation: 'Review pricing, channel mix, and promotional offers to stimulate demand.', rationale: 'Below 60% occupancy, fixed costs become proportionally more damaging to margin.' }),
    ],
    notes: ['RevPAR is the primary health signal — watch it alongside ADR to separate volume vs. rate stories.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'occupancy_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.occupancy_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'adr',            transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.adr' }],            source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'revpar',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.revpar' }],           source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'cancellations',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.cancellations' }],  source: 'intelligence_brief' }),
  ],
})

export const AREA_HOSPITALITY_GUEST = createArea({
  id: 'hospitality-guest',
  label: 'Guest Experience',
  industries: ['hospitality-fb', 'retail-hospitality'],
  connectors: [],
  businessLogic: {
    objective: 'Keep guest satisfaction strong enough to drive repeat visits and positive reviews.',
    questions: ['Are complaints rising?', 'Are reviews improving or declining?', 'Which shift or service period is the source of problems?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'complaints',       label: 'Complaints',        unit: 'count', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Complaint volume is the most direct guest experience signal.' }),
    createMetricDefinition({ key: 'avg_review_score', label: 'Avg review score',  unit: 'score', preferredDirection: 'higher-is-better', defaultInterpretation: 'Online review score directly affects booking demand and channel ranking.' }),
    createMetricDefinition({ key: 'repeat_guests',   label: 'Repeat guests',      unit: 'count', preferredDirection: 'higher-is-better', defaultInterpretation: 'Repeat guests are the cheapest revenue for a hospitality business.' }),
    createMetricDefinition({ key: 'nps',             label: 'NPS',                unit: 'score', preferredDirection: 'higher-is-better', defaultInterpretation: 'NPS is the forward-looking reputation signal.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'hospitality-guest:review-watch',    metricKey: 'avg_review_score', comparator: 'lt', value: 4.0, status: 'watch', severity: 'high',   title: 'Review score slipping',   summary: 'Average online review score below 4.0 — booking demand at risk.', recommendation: 'Identify the most common complaint themes and address them this week.', rationale: 'Review scores below 4.0 materially impact organic booking conversion.' }),
      createThresholdRule({ id: 'hospitality-guest:complaints-watch', metricKey: 'complaints',       comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'Complaint volume rising', summary: 'Complaints are above a healthy baseline — service issue forming.', recommendation: 'Identify whether complaints concentrate in a specific area, shift, or service type.', rationale: 'Rising complaints are the earliest signal of a service or staffing problem.' }),
    ],
    notes: ['Watch review score and complaint volume — a divergence between them reveals lag in public reputation.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'complaints',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.complaints' }],       source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_review_score', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_review_score' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'repeat_guests',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.repeat_guests' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'nps',             transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.nps' }],              source: 'intelligence_brief' }),
  ],
})

// ─── Healthcare / Wellness ────────────────────────────────────────────────────

export const AREA_HEALTHCARE_PATIENTS = createArea({
  id: 'healthcare-patients',
  label: 'Patient & Client Flow',
  industries: ['healthcare'],
  connectors: [],
  businessLogic: {
    objective: 'Keep patient flow healthy — appointments filled, no-shows minimised, and retention strong.',
    questions: ['Are appointment books full?', 'Is no-show rate too high?', 'Are patients returning?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'appointments_attended', label: 'Appointments attended', unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Attended appointments are the primary revenue driver in healthcare services.' }),
    createMetricDefinition({ key: 'no_show_rate',          label: 'No-show rate (%)',      unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'High no-shows waste practitioner time and destroy revenue predictability.' }),
    createMetricDefinition({ key: 'new_patients',          label: 'New patients',          unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'New patient flow shows acquisition health and referral pipeline.' }),
    createMetricDefinition({ key: 'patient_churn',         label: 'Patients churned',      unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Patients not returning indicate care quality or service experience issues.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'healthcare-patients:no-show-watch', metricKey: 'no_show_rate', comparator: 'gt', value: 10, status: 'watch', severity: 'medium', title: 'No-show rate is elevated',        summary: 'Over 10% of appointments are not attended — revenue and capacity are being wasted.', recommendation: 'Introduce appointment reminders and review booking confirmation process.', rationale: 'No-shows are the highest-waste event in healthcare — each represents 100% lost slot revenue.' }),
      createThresholdRule({ id: 'healthcare-patients:no-show-bad',   metricKey: 'no_show_rate', comparator: 'gt', value: 20, status: 'bad',   severity: 'high',   title: 'No-show rate is critically high', summary: 'Over 20% no-show rate — operational and revenue impact is severe.', recommendation: 'Implement double-booking or same-day fill policy for high-risk appointment types.', rationale: 'Above 20%, no-shows become a structural capacity problem.' }),
    ],
    notes: ['No-show rate and patient retention are the core operational health signals for a healthcare practice.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'appointments_attended', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.appointments_attended' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'no_show_rate',          transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.no_show_rate' }],          source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'new_patients',          transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.new_patients' }],          source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'patient_churn',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.patient_churn' }],         source: 'intelligence_brief' }),
  ],
})

export const AREA_HEALTHCARE_BILLING = createArea({
  id: 'healthcare-billing',
  label: 'Billing & Revenue',
  industries: ['healthcare'],
  connectors: [],
  businessLogic: {
    objective: 'Keep billing collection healthy and minimise write-offs and insurance claim rejections.',
    questions: ['Are invoices being collected?', 'Are insurance claims clearing?', 'Are write-offs growing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'invoices_raised',  label: 'Invoices raised',     unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Invoice volume tracks billing output against appointment volume.' }),
    createMetricDefinition({ key: 'collection_rate',  label: 'Collection rate (%)', unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Collection rate below 90% means significant revenue is not being captured.' }),
    createMetricDefinition({ key: 'claim_rejections', label: 'Claim rejections',    unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rejected insurance claims delay cash and create administrative debt.' }),
    createMetricDefinition({ key: 'write_offs',       label: 'Write-offs',          unit: 'currency', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Write-offs are permanent revenue loss — usually from billing errors or patient non-payment.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'healthcare-billing:collection-watch', metricKey: 'collection_rate', comparator: 'lt', value: 90, status: 'watch', severity: 'high',   title: 'Collection rate below 90%', summary: 'More than 10% of invoiced revenue is not being collected.', recommendation: 'Identify whether the gap is claim rejections, patient non-payment, or billing errors.', rationale: 'A 10% collection gap compounds silently into large revenue leakage over time.' }),
      createThresholdRule({ id: 'healthcare-billing:writeoffs-watch',  metricKey: 'write_offs',       comparator: 'gt', value: 0,  status: 'watch', severity: 'medium', title: 'Write-offs occurring',      summary: 'Bad debt is being written off this period.', recommendation: 'Review the categories of write-offs and tighten billing and payment processes.', rationale: 'Write-offs are permanent revenue loss — identifying root cause prevents recurrence.' }),
    ],
    notes: ['Watch collection rate and claim rejections as the primary billing health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'invoices_raised',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.invoices_raised' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'collection_rate',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.collection_rate' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'claim_rejections', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.claim_rejections' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'write_offs',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.write_offs' }],         source: 'intelligence_brief' }),
  ],
})

// ─── Real Estate ──────────────────────────────────────────────────────────────

export const AREA_REAL_ESTATE_PORTFOLIO = createArea({
  id: 'real-estate-portfolio',
  label: 'Portfolio Health',
  industries: ['real-estate'],
  connectors: [],
  businessLogic: {
    objective: 'Keep occupancy high, rent arrears low, and lease renewal rate strong to protect the income portfolio.',
    questions: ['Is vacancy rising?', 'Are rent arrears building?', 'Are leases renewing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'occupancy_rate',   label: 'Occupancy rate (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Occupancy is the primary income health signal for a property portfolio.' }),
    createMetricDefinition({ key: 'rent_arrears',     label: 'Rent in arrears',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Arrears build silently and become bad debt if not addressed early.' }),
    createMetricDefinition({ key: 'lease_renewals',   label: 'Lease renewals',     unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Renewals are the lowest-cost way to maintain income — tracking them shows retention quality.' }),
    createMetricDefinition({ key: 'vacancy_days_avg', label: 'Avg vacancy days',   unit: 'days',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Long vacancy periods destroy income — every day empty is lost revenue.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'real-estate-portfolio:occupancy-watch', metricKey: 'occupancy_rate', comparator: 'lt', value: 90, status: 'watch', severity: 'medium', title: 'Occupancy below 90%',    summary: 'Portfolio occupancy slipping — income gap forming.', recommendation: 'Review marketing and pricing on vacant units and accelerate leasing outreach.', rationale: 'Every empty unit is 100% income loss on that asset.' }),
      createThresholdRule({ id: 'real-estate-portfolio:arrears-watch',   metricKey: 'rent_arrears',   comparator: 'gt', value: 1,  status: 'watch', severity: 'high',   title: 'Rent arrears building', summary: 'Multiple tenants in arrears — cash flow at risk.', recommendation: 'Contact arrear tenants immediately and escalate to formal process if no response.', rationale: 'Arrears compound — early action converts most into collections; late action into write-offs.' }),
    ],
    notes: ['Watch occupancy rate, arrears, and vacancy days as the portfolio health pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'occupancy_rate',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.occupancy_rate' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'rent_arrears',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.rent_arrears' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'lease_renewals',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.lease_renewals' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'vacancy_days_avg', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.vacancy_days_avg' }], source: 'intelligence_brief' }),
  ],
})

// ─── Construction ─────────────────────────────────────────────────────────────

export const AREA_CONSTRUCTION_PIPELINE = createArea({
  id: 'construction-pipeline',
  label: 'Pipeline & Bids',
  industries: ['construction'],
  connectors: [],
  businessLogic: {
    objective: 'Keep bid win rate and contracted backlog healthy enough to sustain future revenue.',
    questions: ['Is the bid win rate holding?', 'Is the backlog of contracted work building?', 'Are new bids being submitted?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'bids_submitted', label: 'Bids submitted',     unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Bid volume is the construction equivalent of lead flow.' }),
    createMetricDefinition({ key: 'bids_won',       label: 'Bids won',           unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Win rate reveals pricing competitiveness and estimating quality.' }),
    createMetricDefinition({ key: 'bid_win_rate',   label: 'Bid win rate (%)',   unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Win rate below 20% signals pricing or scope is not competitive.' }),
    createMetricDefinition({ key: 'backlog_value',  label: 'Contracted backlog', unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Backlog is the clearest revenue visibility signal for a construction business.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'construction-pipeline:win-rate-watch', metricKey: 'bid_win_rate', comparator: 'lt', value: 20, status: 'watch', severity: 'medium', title: 'Bid win rate is low',        summary: 'Winning fewer than 1 in 5 bids — pricing or competitive position issue.', recommendation: 'Review recent losses for price vs. scope patterns and adjust estimating.', rationale: 'Low win rate means the estimating or positioning is not competitive.' }),
      createThresholdRule({ id: 'construction-pipeline:backlog-watch',  metricKey: 'backlog_value', comparator: 'lt', value: 0,  status: 'watch', severity: 'high',   title: 'Contracted backlog is thin', summary: 'Low backlog value — future revenue pipeline is not secured.', recommendation: 'Increase bid activity and prioritise outreach to target clients.', rationale: 'A thin construction backlog creates revenue cliffs 3-6 months out.' }),
    ],
    notes: ['Backlog value is the most important forward-looking signal for a construction business.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'bids_submitted', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.bids_submitted' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'bids_won',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.bids_won' }],       source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'bid_win_rate',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.bid_win_rate' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'backlog_value',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.backlog_value' }],    source: 'intelligence_brief' }),
  ],
})

export const AREA_CONSTRUCTION_DELIVERY = createArea({
  id: 'construction-delivery',
  label: 'Project Delivery',
  industries: ['construction'],
  connectors: [],
  businessLogic: {
    objective: 'Keep active projects on schedule and on budget — delays and overruns erode margin and client trust.',
    questions: ['Are projects on schedule?', 'Are change orders accumulating?', 'Are subcontractors causing delays?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'projects_on_track',    label: 'Projects on track',     unit: 'count', preferredDirection: 'higher-is-better', defaultInterpretation: 'On-track project count relative to total active shows delivery health.' }),
    createMetricDefinition({ key: 'projects_delayed',     label: 'Projects delayed',      unit: 'count', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Delayed projects risk penalty clauses and client relationship damage.' }),
    createMetricDefinition({ key: 'change_orders',        label: 'Change orders raised',  unit: 'count', preferredDirection: 'contextual',       defaultInterpretation: 'Change orders increase scope but also signal initial scoping or client alignment issues.' }),
    createMetricDefinition({ key: 'subcontractor_delays', label: 'Subcontractor delays',  unit: 'count', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Subcontractor delays are one of the most common root causes of project timeline slippage.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'construction-delivery:delayed-watch', metricKey: 'projects_delayed',    comparator: 'gt', value: 0, status: 'watch', severity: 'high',   title: 'Projects behind schedule',         summary: 'One or more active projects are delayed.', recommendation: 'Identify the root cause per delayed project and determine whether client notification is needed.', rationale: 'Delayed projects rarely recover without intervention — they compound.' }),
      createThresholdRule({ id: 'construction-delivery:subcon-watch',  metricKey: 'subcontractor_delays', comparator: 'gt', value: 1, status: 'watch', severity: 'medium', title: 'Subcontractor delays accumulating', summary: 'Multiple subcontractor delays — cascade risk to project timelines.', recommendation: 'Review subcontractor commitments and add buffer or contingency resourcing.', rationale: 'Subcontractor delays are the most common construction delay driver and compound quickly.' }),
    ],
    notes: ['Watch delayed projects and subcontractor performance as the primary delivery health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'projects_on_track',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.projects_on_track' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'projects_delayed',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.projects_delayed' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'change_orders',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.change_orders' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'subcontractor_delays', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.subcontractor_delays' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_CONSTRUCTION_BILLING = createArea({
  id: 'construction-billing',
  label: 'Billing & Cash Flow',
  industries: ['construction'],
  connectors: [],
  businessLogic: {
    objective: 'Keep draw requests flowing and overdue invoices low — construction cash flow is highly dependent on billing cycle discipline.',
    questions: ['Are draws being approved on time?', 'Are invoices overdue?', 'Is cash flow positive?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'draws_submitted',  label: 'Draw requests submitted', unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Draw cadence shows billing discipline — late draws starve cash flow.' }),
    createMetricDefinition({ key: 'draws_approved',   label: 'Draw requests approved',  unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Approvals lagging submissions signals client or bank approval delays.' }),
    createMetricDefinition({ key: 'overdue_invoices', label: 'Overdue invoices',        unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Overdue invoices create cash flow gaps that force reliance on credit lines.' }),
    createMetricDefinition({ key: 'cash_in_hand',     label: 'Cash in hand',            unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Construction cash flow is volatile — monitoring cash directly is essential.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'construction-billing:draws-lag',    metricKey: 'draws_approved',  comparator: 'lt', value: 0, status: 'watch', severity: 'high',   title: 'Draw approvals lagging',    summary: 'Submitted draws are not being approved at pace — cash flow gap forming.', recommendation: 'Follow up with clients or lenders on pending draw approval bottlenecks.', rationale: 'Draw approval delays are the most common construction cash flow problem.' }),
      createThresholdRule({ id: 'construction-billing:overdue-watch', metricKey: 'overdue_invoices', comparator: 'gt', value: 1, status: 'watch', severity: 'medium', title: 'Overdue invoices building', summary: 'Invoices past due — receivables are not converting to cash.', recommendation: 'Send formal overdue notices and escalate to principals if no response.', rationale: 'Overdue construction invoices compound — they rarely self-resolve.' }),
    ],
    notes: ['Watch draw approval lag and overdue invoices as the primary construction cash flow signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'draws_submitted',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.draws_submitted' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'draws_approved',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.draws_approved' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'overdue_invoices', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.overdue_invoices' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'cash_in_hand',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.cash_in_hand' }],       source: 'intelligence_brief' }),
  ],
})

// ─── Agriculture ──────────────────────────────────────────────────────────────

export const AREA_AGRICULTURE_PRODUCTION = createArea({
  id: 'agriculture-production',
  label: 'Crop Production',
  industries: ['agriculture'],
  connectors: [],
  businessLogic: {
    objective: 'Keep yield per field healthy and crop loss events minimised to protect seasonal revenue.',
    questions: ['Is yield on track for season?', 'Are crop loss events occurring?', 'Is harvest timing on plan?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'yield_per_unit',   label: 'Yield per unit',      unit: 'number',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Yield per hectare/acre is the core production efficiency signal.' }),
    createMetricDefinition({ key: 'crop_loss_events', label: 'Crop loss events',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Crop loss events are high-impact — each reduces harvestable volume directly.' }),
    createMetricDefinition({ key: 'harvest_on_plan',  label: 'Harvest on plan (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Harvest completion vs. plan shows whether seasonal execution is on schedule.' }),
    createMetricDefinition({ key: 'fields_planted',   label: 'Fields planted',      unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Planted area is the volume signal for an agricultural business.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'agriculture-production:loss-watch', metricKey: 'crop_loss_events', comparator: 'gt', value: 0, status: 'watch', severity: 'high',   title: 'Crop loss event detected',     summary: 'Crop loss has occurred — seasonal revenue impact likely.', recommendation: 'Assess affected area, trigger insurance claim if applicable, and review salvage options.', rationale: 'Any crop loss event reduces seasonal revenue that cannot be recovered by working harder.' }),
      createThresholdRule({ id: 'agriculture-production:plan-watch', metricKey: 'harvest_on_plan', comparator: 'lt', value: 80, status: 'watch', severity: 'medium', title: 'Harvest behind seasonal plan', summary: 'Harvest completion is more than 20% behind plan — timing and revenue at risk.', recommendation: 'Review equipment availability, weather delays, and labour capacity.', rationale: 'Late harvests risk quality degradation and market timing penalties.' }),
    ],
    notes: ['Yield per unit and crop loss events are the primary agricultural production signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'yield_per_unit',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.yield_per_unit' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'crop_loss_events', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.crop_loss_events' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'harvest_on_plan',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.harvest_on_plan' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'fields_planted',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.fields_planted' }],   source: 'intelligence_brief' }),
  ],
})

export const AREA_AGRICULTURE_INPUTS = createArea({
  id: 'agriculture-inputs',
  label: 'Inputs & Supply',
  industries: ['agriculture'],
  connectors: [],
  businessLogic: {
    objective: 'Keep input costs controlled and supply chain stable to protect seasonal margin.',
    questions: ['Are input costs rising?', 'Are supplier delays threatening planting or harvest?', 'Is equipment reliable?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'input_cost_total',   label: 'Total input cost',   unit: 'currency', preferredDirection: 'lower-is-better', defaultInterpretation: 'Input costs (seed, fertiliser, fuel) are the primary variable cost in agriculture.' }),
    createMetricDefinition({ key: 'supplier_delays',    label: 'Supplier delays',    unit: 'count',    preferredDirection: 'lower-is-better', defaultInterpretation: 'Input delivery delays can disrupt planting windows and cascade into yield loss.' }),
    createMetricDefinition({ key: 'equipment_downtime', label: 'Equipment downtime', unit: 'days',     preferredDirection: 'lower-is-better', defaultInterpretation: 'Equipment downtime during critical periods directly reduces yield and causes harvest delays.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'agriculture-inputs:supplier-delay', metricKey: 'supplier_delays',    comparator: 'gt', value: 0, status: 'watch', severity: 'high',   title: 'Input supplier delays',       summary: 'Supplier delays detected — planting or harvest window at risk.', recommendation: 'Source alternative supplier immediately for time-critical inputs.', rationale: 'Input delays during planting windows directly reduce seasonal output.' }),
      createThresholdRule({ id: 'agriculture-inputs:equipment-down', metricKey: 'equipment_downtime', comparator: 'gt', value: 2, status: 'watch', severity: 'medium', title: 'Equipment downtime this week', summary: 'Equipment down for multiple days — harvest or fieldwork capacity at risk.', recommendation: 'Escalate repair priority or source rental equipment for the critical period.', rationale: 'Equipment downtime during harvest is irreversible lost yield.' }),
    ],
    notes: ['Input cost and supplier reliability are the primary supply chain health signals for agriculture.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'input_cost_total',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.input_cost_total' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'supplier_delays',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.supplier_delays' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'equipment_downtime', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.equipment_downtime' }], source: 'intelligence_brief' }),
  ],
})

// ─── Fintech / Finance ────────────────────────────────────────────────────────

export const AREA_FINTECH_CUSTOMERS = createArea({
  id: 'fintech-customers',
  label: 'Customer Growth',
  industries: ['fintech-finance'],
  connectors: [],
  businessLogic: {
    objective: 'Keep account activation, onboarding completion, and churn signals healthy.',
    questions: ['Are new accounts activating?', 'Where is onboarding dropping off?', 'Is churn rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'new_accounts',        label: 'New accounts',        unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'New account creation is the top-of-funnel signal for fintech growth.' }),
    createMetricDefinition({ key: 'activation_rate',     label: 'Activation rate (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Accounts that do not activate represent wasted acquisition cost.' }),
    createMetricDefinition({ key: 'kyc_completion_rate', label: 'KYC completion (%)',  unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'KYC drop-off is often the primary fintech onboarding bottleneck.' }),
    createMetricDefinition({ key: 'account_churn',       label: 'Accounts churned',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Account churn reveals whether product value or trust is failing post-activation.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'fintech-customers:activation-watch', metricKey: 'activation_rate',     comparator: 'lt', value: 60, status: 'watch', severity: 'medium', title: 'Activation rate below 60%', summary: 'Less than 60% of new accounts are activating — onboarding is leaking.', recommendation: 'Audit the onboarding funnel step-by-step to find where users are dropping.', rationale: 'Low activation wastes acquisition cost and signals the product experience is not working.' }),
      createThresholdRule({ id: 'fintech-customers:kyc-watch',        metricKey: 'kyc_completion_rate', comparator: 'lt', value: 70, status: 'watch', severity: 'high',   title: 'KYC completion rate low',   summary: 'Less than 70% of users completing KYC — regulatory gate is a barrier.', recommendation: 'Review KYC flow for friction and consider optimising document verification steps.', rationale: 'KYC is the most common fintech drop-off point — fixing it directly improves activation.' }),
    ],
    notes: ['Watch activation rate and KYC completion as the primary fintech onboarding health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'new_accounts',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.new_accounts' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'activation_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.activation_rate' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'kyc_completion_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.kyc_completion_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'account_churn',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.account_churn' }],       source: 'intelligence_brief' }),
  ],
})

export const AREA_FINTECH_RISK = createArea({
  id: 'fintech-risk',
  label: 'Risk & Compliance',
  industries: ['fintech-finance'],
  connectors: [],
  businessLogic: {
    objective: 'Keep fraud, default, and compliance events within acceptable bounds.',
    questions: ['Is fraud rising?', 'Are defaults increasing?', 'Are compliance obligations current?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'fraud_events',      label: 'Fraud events',      unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Fraud events directly destroy margin and signal systemic security gaps.' }),
    createMetricDefinition({ key: 'default_rate',      label: 'Default rate (%)',  unit: 'percent', preferredDirection: 'lower-is-better', defaultInterpretation: 'Rising default rate signals credit underwriting is not matching actual borrower risk.' }),
    createMetricDefinition({ key: 'chargebacks',       label: 'Chargebacks',       unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Chargebacks are costly and too many risk payment processor penalties.' }),
    createMetricDefinition({ key: 'compliance_alerts', label: 'Compliance alerts', unit: 'count',   preferredDirection: 'lower-is-better', defaultInterpretation: 'Unresolved compliance alerts accumulate into regulatory risk.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'fintech-risk:fraud-watch',      metricKey: 'fraud_events',      comparator: 'gt', value: 3, status: 'watch', severity: 'high',   title: 'Fraud events elevated',       summary: 'Fraud detection has flagged multiple events — pattern risk.', recommendation: 'Review flagged events for common patterns and tighten detection rules.', rationale: 'Fraud events compound if not closed at the pattern level.' }),
      createThresholdRule({ id: 'fintech-risk:default-watch',    metricKey: 'default_rate',      comparator: 'gt', value: 3, status: 'watch', severity: 'high',   title: 'Default rate rising',         summary: 'Over 3% default rate — credit quality is deteriorating.', recommendation: 'Tighten underwriting criteria for new approvals and review the current book for concentration risk.', rationale: 'Rising defaults compound — early tightening prevents portfolio-level damage.' }),
      createThresholdRule({ id: 'fintech-risk:compliance-watch', metricKey: 'compliance_alerts', comparator: 'gt', value: 2, status: 'watch', severity: 'high',   title: 'Compliance alerts unresolved', summary: 'Multiple open compliance alerts — regulatory risk building.', recommendation: 'Assign owners to each open alert and set resolution deadlines.', rationale: 'Unresolved compliance alerts invite regulatory scrutiny and fines.' }),
    ],
    notes: ['Watch fraud, default rate, and compliance alerts as the fintech risk pulse.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'fraud_events',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.fraud_events' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'default_rate',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.default_rate' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'chargebacks',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.chargebacks' }],       source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'compliance_alerts', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.compliance_alerts' }], source: 'intelligence_brief' }),
  ],
})

// ─── Insurance ────────────────────────────────────────────────────────────────

export const AREA_INSURANCE_POLICY = createArea({
  id: 'insurance-policy',
  label: 'Policy & Growth',
  industries: ['insurance'],
  connectors: [],
  businessLogic: {
    objective: 'Keep policy count, renewal rate, and premium income growing.',
    questions: ['Are new policies being written?', 'Is the renewal rate holding?', 'Are lapses rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'new_policies',   label: 'New policies written', unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'New policy count is the primary growth signal for an insurance book.' }),
    createMetricDefinition({ key: 'renewal_rate',   label: 'Renewal rate (%)',     unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Renewal rate reveals customer satisfaction and pricing competitiveness.' }),
    createMetricDefinition({ key: 'lapse_rate',     label: 'Lapse rate (%)',       unit: 'percent',  preferredDirection: 'lower-is-better',  defaultInterpretation: 'Lapses erode the policy book and destroy renewal premium income.' }),
    createMetricDefinition({ key: 'premium_income', label: 'Premium income',       unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Premium income is the top-line health signal for insurance.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'insurance-policy:renewal-watch', metricKey: 'renewal_rate', comparator: 'lt', value: 80, status: 'watch', severity: 'high',   title: 'Renewal rate below 80%', summary: 'Fewer than 80% of policies are renewing — book is shrinking.', recommendation: 'Identify top reasons for non-renewal and address pricing or service gaps.', rationale: 'Below 80% renewal, new policy volume cannot outpace book erosion.' }),
      createThresholdRule({ id: 'insurance-policy:lapse-watch',   metricKey: 'lapse_rate',   comparator: 'gt', value: 10, status: 'watch', severity: 'medium', title: 'Lapse rate elevated',    summary: 'Over 10% of policies are lapsing — premium income at risk.', recommendation: 'Review lapse triggers and implement proactive renewal outreach.', rationale: 'Lapses are higher-cost than non-renewals — they often involve mid-term payment failure.' }),
    ],
    notes: ['Watch renewal rate and lapse rate as the primary insurance book health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'new_policies',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.new_policies' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'renewal_rate',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.renewal_rate' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'lapse_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.lapse_rate' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'premium_income', transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.premium_income' }],   source: 'intelligence_brief' }),
  ],
})

export const AREA_INSURANCE_CLAIMS = createArea({
  id: 'insurance-claims',
  label: 'Claims',
  industries: ['insurance'],
  connectors: [],
  businessLogic: {
    objective: 'Keep claim frequency, loss ratio, and processing time within acceptable bounds.',
    questions: ['Is the loss ratio rising?', 'Are claims taking too long to process?', 'Are large loss events occurring?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'claims_filed',      label: 'Claims filed',       unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Claims frequency is the primary cost signal for an insurance business.' }),
    createMetricDefinition({ key: 'loss_ratio',        label: 'Loss ratio (%)',     unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Loss ratio above 65% signals underwriting quality is deteriorating.' }),
    createMetricDefinition({ key: 'avg_claim_days',    label: 'Avg claim days',     unit: 'days',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Slow claim processing creates customer dissatisfaction and regulatory risk.' }),
    createMetricDefinition({ key: 'large_loss_events', label: 'Large loss events',  unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Large loss events require individual monitoring — each can swing the loss ratio materially.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'insurance-claims:loss-ratio-watch', metricKey: 'loss_ratio',       comparator: 'gt', value: 65, status: 'watch', severity: 'high', title: 'Loss ratio above 65%',       summary: 'Claims costs are consuming more than 65% of premium — profitability at risk.', recommendation: 'Review underwriting criteria for the highest-frequency claim categories.', rationale: 'Loss ratio above 65% typically makes combined ratio unprofitable after expenses.' }),
      createThresholdRule({ id: 'insurance-claims:large-loss-watch', metricKey: 'large_loss_events', comparator: 'gt', value: 0, status: 'watch', severity: 'high', title: 'Large loss event occurring', summary: 'A large loss event has been filed — material financial impact likely.', recommendation: 'Activate claims management protocol and review reinsurance cover.', rationale: 'A single large loss can swing the period loss ratio materially.' }),
    ],
    notes: ['Watch loss ratio and large loss events as the primary insurance claims health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'claims_filed',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.claims_filed' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'loss_ratio',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.loss_ratio' }],           source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_claim_days',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_claim_days' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'large_loss_events', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.large_loss_events' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_INSURANCE_RISK = createArea({
  id: 'insurance-risk',
  label: 'Risk & Fraud',
  industries: ['insurance'],
  connectors: [],
  businessLogic: {
    objective: 'Identify fraud patterns and concentration risk before they damage the book.',
    questions: ['Are fraud flags rising?', 'Is risk concentrated in a segment?', 'Are SIU investigations increasing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'fraud_flags',        label: 'Fraud flags',        unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Fraud flags signal claims that may not be legitimate — each costs investigation time and claim dollars.' }),
    createMetricDefinition({ key: 'siu_investigations', label: 'SIU investigations', unit: 'count', preferredDirection: 'lower-is-better', defaultInterpretation: 'Rising SIU investigations signal a systemic fraud pattern worth addressing at the underwriting level.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'insurance-risk:fraud-watch', metricKey: 'fraud_flags', comparator: 'gt', value: 3, status: 'watch', severity: 'high', title: 'Fraud flags elevated', summary: 'Multiple fraud flags this period — pattern likely.', recommendation: 'Review flagged claims for common indicators and update detection rules.', rationale: 'Fraud patterns compound if not closed at the systemic level.' }),
    ],
    notes: ['Watch fraud flags and SIU investigations as the primary insurance risk signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'fraud_flags',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.fraud_flags' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'siu_investigations', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.siu_investigations' }], source: 'intelligence_brief' }),
  ],
})

// ─── Telecommunications ───────────────────────────────────────────────────────

export const AREA_TELECOM_SUBSCRIBERS = createArea({
  id: 'telecom-subscribers',
  label: 'Subscribers',
  industries: ['telecommunications'],
  connectors: [],
  businessLogic: {
    objective: 'Keep subscriber count, ARPU, and churn rate healthy.',
    questions: ['Is subscriber count growing?', 'Is churn accelerating?', 'Is ARPU holding or declining?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'active_subscribers', label: 'Active subscribers', unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Active subscriber count is the primary base for telecom revenue.' }),
    createMetricDefinition({ key: 'new_subscribers',    label: 'New subscribers',    unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'New subscriber additions show acquisition health.' }),
    createMetricDefinition({ key: 'churn_rate',         label: 'Churn rate (%)',     unit: 'percent',  preferredDirection: 'lower-is-better',  defaultInterpretation: 'Subscriber churn is the most critical metric for telecom revenue sustainability.' }),
    createMetricDefinition({ key: 'arpu',               label: 'ARPU',               unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'ARPU decline signals plan downgrades or competitive pricing pressure.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'telecom-subscribers:churn-watch', metricKey: 'churn_rate', comparator: 'gt', value: 2, status: 'watch', severity: 'high',   title: 'Subscriber churn elevated', summary: 'Monthly churn above 2% — base is eroding faster than additions.', recommendation: 'Identify churn drivers — pricing, network quality, or competitive switching.', rationale: '2%+ monthly churn annualises to 24% — the base cannot grow under this pressure.' }),
      createThresholdRule({ id: 'telecom-subscribers:arpu-watch',  metricKey: 'arpu',       comparator: 'lt', value: 0, status: 'watch', severity: 'medium', title: 'ARPU declining',            summary: 'Average revenue per user is falling — plan mix or discounting issue.', recommendation: 'Review plan mix trends and promotional discount levels.', rationale: 'Falling ARPU erodes revenue even when subscriber count holds.' }),
    ],
    notes: ['Churn rate and ARPU are the two most important subscriber health signals for telecom.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'active_subscribers', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.active_subscribers' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'new_subscribers',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.new_subscribers' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'churn_rate',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.churn_rate' }],         source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'arpu',               transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.arpu' }],                 source: 'intelligence_brief' }),
  ],
})

export const AREA_TELECOM_NETWORK = createArea({
  id: 'telecom-network',
  label: 'Network Operations',
  industries: ['telecommunications'],
  connectors: [],
  businessLogic: {
    objective: 'Keep network uptime, SLA compliance, and outage response times within customer commitments.',
    questions: ['Are outages occurring?', 'Are SLAs being breached?', 'Is network ticket volume rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'network_outages',    label: 'Network outages',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Outages are the most visible network reliability failure — each drives churn.' }),
    createMetricDefinition({ key: 'sla_breaches',       label: 'SLA breaches',       unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'SLA breaches trigger financial penalties and customer trust erosion.' }),
    createMetricDefinition({ key: 'network_tickets',    label: 'Network tickets',    unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Rising network tickets signal quality degradation before outages occur.' }),
    createMetricDefinition({ key: 'uptime_pct',         label: 'Network uptime (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Uptime below 99.9% is a customer-impacting reliability problem for telecom.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'telecom-network:outage-watch', metricKey: 'network_outages', comparator: 'gt', value: 0, status: 'watch', severity: 'high', title: 'Network outage occurred',  summary: 'A network outage has occurred — customer impact and churn risk.', recommendation: 'Complete root cause analysis and implement preventive fix before next incident.', rationale: 'Each outage increases churn probability for affected subscribers.' }),
      createThresholdRule({ id: 'telecom-network:sla-watch',    metricKey: 'sla_breaches',    comparator: 'gt', value: 0, status: 'watch', severity: 'high', title: 'SLA breaches this period', summary: 'SLA commitments have been missed — financial and relationship penalties likely.', recommendation: 'Trigger SLA breach protocols and communicate proactively with affected enterprise clients.', rationale: 'SLA breaches create direct financial liability and accelerate contract non-renewal.' }),
    ],
    notes: ['Watch outages and SLA breaches as the primary network health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'network_outages', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.network_outages' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'sla_breaches',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.sla_breaches' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'network_tickets', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.network_tickets' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'uptime_pct',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.uptime_pct' }],      source: 'intelligence_brief' }),
  ],
})

// ─── Media / Creator ──────────────────────────────────────────────────────────

export const AREA_MEDIA_AUDIENCE = createArea({
  id: 'media-audience',
  label: 'Audience',
  industries: ['media-creator'],
  connectors: [],
  businessLogic: {
    objective: 'Keep audience size and subscriber growth healthy — audience is the asset that all media monetisation depends on.',
    questions: ['Is audience growing?', 'Are subscribers churning?', 'Is the email list engaged?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'total_subscribers', label: 'Total subscribers',   unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Subscriber count is the owned audience — the most valuable media asset.' }),
    createMetricDefinition({ key: 'subscriber_growth', label: 'Subscriber growth',   unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Net new subscribers per period shows audience momentum.' }),
    createMetricDefinition({ key: 'subscriber_churn',  label: 'Subscriber churn',   unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Churn erodes the audience base and reduces monetisation potential.' }),
    createMetricDefinition({ key: 'email_open_rate',   label: 'Email open rate (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Email open rate is the clearest engagement signal for media audiences.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'media-audience:churn-watch',    metricKey: 'subscriber_churn', comparator: 'gt', value: 0,  status: 'watch', severity: 'medium', title: 'Subscriber churn rising',    summary: 'Audience is losing subscribers — content or value proposition issue.', recommendation: 'Survey churned subscribers to identify content or format reasons.', rationale: 'Subscriber churn is the most direct signal that the content is losing relevance.' }),
      createThresholdRule({ id: 'media-audience:email-open-bad', metricKey: 'email_open_rate',  comparator: 'lt', value: 20, status: 'watch', severity: 'medium', title: 'Email open rate below 20%', summary: 'Less than 20% of subscribers are opening emails — list engagement is weak.', recommendation: 'Review subject line, send timing, and content relevance for the email audience.', rationale: 'Below 20% open rate, email becomes an unreliable monetisation and engagement channel.' }),
    ],
    notes: ['Watch subscriber growth and email open rate as the primary audience health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'total_subscribers', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.total_subscribers' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'subscriber_growth', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.subscriber_growth' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'subscriber_churn',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.subscriber_churn' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'email_open_rate',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.email_open_rate' }],   source: 'intelligence_brief' }),
  ],
})

export const AREA_MEDIA_ENGAGEMENT = createArea({
  id: 'media-engagement',
  label: 'Engagement',
  industries: ['media-creator'],
  connectors: [],
  businessLogic: {
    objective: 'Keep content engagement depth strong — engagement drives algorithm reach and advertiser value.',
    questions: ['Are views growing?', 'Is watch/read time holding?', 'Are shares and saves increasing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'views',         label: 'Views / streams',    unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'View count is the primary reach signal for content.' }),
    createMetricDefinition({ key: 'avg_watch_pct', label: 'Avg watch time (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Watch percentage shows whether content is holding attention after the click.' }),
    createMetricDefinition({ key: 'shares',        label: 'Shares',             unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Shares are the primary organic growth multiplier for media content.' }),
    createMetricDefinition({ key: 'saves',         label: 'Saves / bookmarks',  unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Saves signal content that users find worth returning to — high-intent engagement.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'media-engagement:watch-pct-watch', metricKey: 'avg_watch_pct', comparator: 'lt', value: 40, status: 'watch', severity: 'medium', title: 'Watch time below 40%', summary: 'Less than 40% of content is being watched — content is not holding attention.', recommendation: 'Review hook quality, pacing, and topic alignment with audience interest.', rationale: 'Low watch percentage depresses algorithm reach and advertiser CPM rates.' }),
    ],
    notes: ['Watch view count trend and watch time percentage as the primary engagement health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'views',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.views' }],         source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'avg_watch_pct', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.avg_watch_pct' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'shares',        transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.shares' }],        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'saves',         transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.saves' }],         source: 'intelligence_brief' }),
  ],
})

export const AREA_MEDIA_MONETISATION = createArea({
  id: 'media-monetisation',
  label: 'Monetisation',
  industries: ['media-creator'],
  connectors: [],
  businessLogic: {
    objective: 'Keep revenue diversified and each monetisation channel performing at or above baseline.',
    questions: ['Are sponsorship deals closing?', 'Is ad revenue stable?', 'Are paid subscribers growing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'sponsorship_revenue', label: 'Sponsorship revenue', unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Sponsorship revenue is the highest-margin media revenue stream.' }),
    createMetricDefinition({ key: 'ad_revenue',          label: 'Ad revenue',          unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Ad revenue is driven by views and CPM — watch both together.' }),
    createMetricDefinition({ key: 'paid_subscribers',    label: 'Paid subscribers',    unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Paid subscribers are the most predictable media revenue stream.' }),
    createMetricDefinition({ key: 'revenue_per_view',    label: 'Revenue per view',    unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Revenue per view combines CPM and monetisation efficiency — the best single media unit economics signal.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'media-monetisation:rev-per-view-watch', metricKey: 'revenue_per_view', comparator: 'lt', value: 0, status: 'watch', severity: 'medium', title: 'Revenue per view declining', summary: 'Monetisation efficiency is dropping — content is reaching audience but not converting revenue.', recommendation: 'Review CPM trends and whether sponsorship deals are matching audience growth.', rationale: 'Falling revenue per view means scale is growing but monetisation is not keeping pace.' }),
    ],
    notes: ['Watch sponsorship revenue, paid subscribers, and revenue per view as the monetisation health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'sponsorship_revenue', transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.sponsorship_revenue' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'ad_revenue',          transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.ad_revenue' }],           source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'paid_subscribers',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.paid_subscribers' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'revenue_per_view',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.revenue_per_view' }],     source: 'intelligence_brief' }),
  ],
})

// ─── Education ────────────────────────────────────────────────────────────────

export const AREA_EDUCATION_ENROLMENT = createArea({
  id: 'education-enrolment',
  label: 'Enrolment & Growth',
  industries: ['education'],
  connectors: [],
  businessLogic: {
    objective: 'Keep enrolment pipeline healthy and conversion from application to confirmed enrolment strong.',
    questions: ['Are applications growing?', 'Is offer-to-enrolment conversion holding?', 'Are deferrals and withdrawals rising?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'applications',    label: 'Applications received',      unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Application volume is the top-of-funnel signal for an education business.' }),
    createMetricDefinition({ key: 'enrolments',      label: 'Enrolments confirmed',       unit: 'count',   preferredDirection: 'higher-is-better', defaultInterpretation: 'Confirmed enrolments are the revenue-realising output of the admissions funnel.' }),
    createMetricDefinition({ key: 'conversion_rate', label: 'Application conversion (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Conversion from application to enrolment shows admissions process effectiveness.' }),
    createMetricDefinition({ key: 'withdrawals',     label: 'Enrolment withdrawals',      unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Withdrawals after enrolment signal onboarding or expectation-setting failures.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'education-enrolment:conversion-watch', metricKey: 'conversion_rate', comparator: 'lt', value: 50, status: 'watch', severity: 'medium', title: 'Enrolment conversion below 50%', summary: 'Less than half of applications are converting to enrolment.', recommendation: 'Review offer timing, financial aid availability, and competitor positioning.', rationale: 'Low conversion rate wastes admissions marketing spend and suggests a competitive or value gap.' }),
      createThresholdRule({ id: 'education-enrolment:withdrawals-watch', metricKey: 'withdrawals',    comparator: 'gt', value: 3,  status: 'watch', severity: 'medium', title: 'Enrolment withdrawals rising',  summary: 'Multiple students withdrawing after enrolment.', recommendation: 'Survey withdrawing students to identify the primary reason.', rationale: 'Withdrawals are revenue loss and a signal that expectation-setting in admissions is failing.' }),
    ],
    notes: ['Watch application volume and conversion rate as the primary enrolment health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'applications',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.applications' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'enrolments',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.enrolments' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'conversion_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.conversion_rate' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'withdrawals',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.withdrawals' }],     source: 'intelligence_brief' }),
  ],
})

export const AREA_EDUCATION_RETENTION = createArea({
  id: 'education-retention',
  label: 'Student Retention',
  industries: ['education'],
  connectors: [],
  businessLogic: {
    objective: 'Keep dropout rate low and at-risk student identification early enough to intervene.',
    questions: ['Is dropout rate rising?', 'Are at-risk students being identified early?', 'Is course completion healthy?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'dropout_rate',    label: 'Dropout rate (%)',      unit: 'percent', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Dropout rate is the most important student retention signal for an education business.' }),
    createMetricDefinition({ key: 'at_risk_count',   label: 'At-risk students',      unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'At-risk flag count shows how many students need proactive intervention now.' }),
    createMetricDefinition({ key: 'completion_rate', label: 'Course completion (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Completion rate shows whether enrolled students are actually finishing and getting value.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'education-retention:dropout-watch', metricKey: 'dropout_rate', comparator: 'gt', value: 10, status: 'watch', severity: 'high',   title: 'Dropout rate above 10%',    summary: 'More than 10% of students dropping out — retention problem.', recommendation: 'Identify whether dropouts share common demographics, programs, or engagement patterns.', rationale: 'High dropout rates destroy revenue, reputation, and regulatory standing.' }),
      createThresholdRule({ id: 'education-retention:atrisk-watch', metricKey: 'at_risk_count',  comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'At-risk students building', summary: 'Multiple students flagged at risk — early intervention needed.', recommendation: 'Assign academic advisors to flagged students and initiate contact this week.', rationale: 'At-risk students not contacted within 2 weeks have dramatically higher dropout probability.' }),
    ],
    notes: ['Dropout rate and at-risk flag count are the primary student retention health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'dropout_rate',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.dropout_rate' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'at_risk_count',   transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.at_risk_count' }],   source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'completion_rate', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.completion_rate' }], source: 'intelligence_brief' }),
  ],
})

// ─── Energy & Utilities ───────────────────────────────────────────────────────

export const AREA_ENERGY_GENERATION = createArea({
  id: 'energy-generation',
  label: 'Generation & Supply',
  industries: ['energy-utilities'],
  connectors: [],
  businessLogic: {
    objective: 'Keep generation output on plan and outage events minimised.',
    questions: ['Is generation on plan?', 'Are outages occurring?', 'Is equipment reliability holding?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'generation_output',  label: 'Generation output',   unit: 'number',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Generation output vs. plan shows whether the business is delivering on its supply commitments.' }),
    createMetricDefinition({ key: 'outage_events',      label: 'Outage events',       unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Outages are the primary operational failure signal for energy — each has regulatory and revenue impact.' }),
    createMetricDefinition({ key: 'capacity_factor',    label: 'Capacity factor (%)', unit: 'percent', preferredDirection: 'higher-is-better', defaultInterpretation: 'Capacity factor shows how efficiently available capacity is being used.' }),
    createMetricDefinition({ key: 'equipment_failures', label: 'Equipment failures',  unit: 'count',   preferredDirection: 'lower-is-better',  defaultInterpretation: 'Equipment failures are early indicators of maintenance debt before outages occur.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'energy-generation:outage-watch',   metricKey: 'outage_events',     comparator: 'gt', value: 0, status: 'watch', severity: 'high',   title: 'Outage event occurred',       summary: 'A generation or network outage has occurred — regulatory and revenue impact likely.', recommendation: 'Complete root cause analysis and implement preventive fix.', rationale: 'Each outage event triggers regulatory reporting obligations and potential revenue penalties.' }),
      createThresholdRule({ id: 'energy-generation:failures-watch', metricKey: 'equipment_failures', comparator: 'gt', value: 2, status: 'watch', severity: 'medium', title: 'Equipment failures elevated', summary: 'Multiple equipment failures — maintenance debt or asset age issue.', recommendation: 'Review maintenance schedule for failing assets and prioritise repair or replacement.', rationale: 'Equipment failures are leading indicators of outages — fix them before they cascade.' }),
    ],
    notes: ['Watch outage events and equipment failures as the primary generation health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'generation_output',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.generation_output' }],  source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'outage_events',      transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.outage_events' }],      source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'capacity_factor',    transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.capacity_factor' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'equipment_failures', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.equipment_failures' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_ENERGY_BILLING = createArea({
  id: 'energy-billing',
  label: 'Revenue & Billing',
  industries: ['energy-utilities'],
  connectors: [],
  businessLogic: {
    objective: 'Keep billing collection healthy and overdue account exposure low.',
    questions: ['Are customers paying?', 'Are overdue accounts building?', 'Is revenue on plan?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'bills_issued',     label: 'Bills issued',        unit: 'count',    preferredDirection: 'higher-is-better', defaultInterpretation: 'Bills issued tracks billing cycle completeness.' }),
    createMetricDefinition({ key: 'collection_rate',  label: 'Collection rate (%)', unit: 'percent',  preferredDirection: 'higher-is-better', defaultInterpretation: 'Collection rate shows how much billed revenue is actually being received.' }),
    createMetricDefinition({ key: 'overdue_accounts', label: 'Overdue accounts',    unit: 'count',    preferredDirection: 'lower-is-better',  defaultInterpretation: 'Overdue accounts accumulate into write-offs and disconnection costs if not addressed.' }),
    createMetricDefinition({ key: 'monthly_revenue',  label: 'Monthly revenue',     unit: 'currency', preferredDirection: 'higher-is-better', defaultInterpretation: 'Monthly revenue tracks against plan and prior period to show billing health.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'energy-billing:collection-watch', metricKey: 'collection_rate',  comparator: 'lt', value: 90, status: 'watch', severity: 'high',   title: 'Collection rate below 90%', summary: 'Over 10% of billed revenue is not being collected.', recommendation: 'Segment overdue accounts by age and initiate collections process.', rationale: 'A 10% collection gap compounds silently into large revenue leakage.' }),
      createThresholdRule({ id: 'energy-billing:overdue-watch',    metricKey: 'overdue_accounts', comparator: 'gt', value: 5,  status: 'watch', severity: 'medium', title: 'Overdue accounts building', summary: 'Multiple customer accounts in arrears.', recommendation: 'Initiate formal overdue notice process for the oldest accounts.', rationale: 'Overdue accounts in utilities have regulatory-constrained resolution options — early action is essential.' }),
    ],
    notes: ['Watch collection rate and overdue accounts as the primary energy billing health signals.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'bills_issued',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.bills_issued' }],     source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'collection_rate',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.collection_rate' }],    source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'overdue_accounts', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.overdue_accounts' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'monthly_revenue',  transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.monthly_revenue' }],    source: 'intelligence_brief' }),
  ],
})

export const AREA_ENERGY_COMPLIANCE = createArea({
  id: 'energy-compliance',
  label: 'Compliance & Safety',
  industries: ['energy-utilities'],
  connectors: [],
  businessLogic: {
    objective: 'Keep regulatory filings current and safety incidents at zero to protect licence and community trust.',
    questions: ['Are regulatory filings current?', 'Are safety incidents occurring?', 'Are inspections passing?'],
  },
  metricFamilies: [
    createMetricDefinition({ key: 'regulatory_filings_due', label: 'Filings overdue',      unit: 'count', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Overdue regulatory filings create licence risk and penalties.' }),
    createMetricDefinition({ key: 'safety_incidents',       label: 'Safety incidents',     unit: 'count', preferredDirection: 'lower-is-better',  defaultInterpretation: 'Safety incidents in energy/utilities have regulatory, liability, and community trust consequences.' }),
    createMetricDefinition({ key: 'inspections_passed',     label: 'Inspections passed',   unit: 'count', preferredDirection: 'higher-is-better', defaultInterpretation: 'Passed inspections confirm ongoing compliance with regulatory standards.' }),
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'energy-compliance:filings-watch',  metricKey: 'regulatory_filings_due', comparator: 'gt', value: 0, status: 'bad', severity: 'high',     title: 'Regulatory filings overdue',   summary: 'Regulatory submission deadlines are being missed — licence risk.', recommendation: 'Assign filing owner and submit within 48 hours with regulator notification.', rationale: 'Overdue filings in energy utilities carry direct financial penalty and licence risk.' }),
      createThresholdRule({ id: 'energy-compliance:incident-watch', metricKey: 'safety_incidents',       comparator: 'gt', value: 0, status: 'bad', severity: 'critical', title: 'Safety incident occurred',     summary: 'A safety incident has occurred — mandatory reporting and investigation required.', recommendation: 'Activate incident response protocol, notify regulators, and initiate root cause investigation.', rationale: 'Safety incidents in energy have regulatory, liability, and community consequences that compound without immediate action.' }),
    ],
    notes: ['Any overdue filing or safety incident is bad — these are zero-tolerance signals in energy and utilities.'],
  }),
  metricMappings: [
    createMetricMapping({ metricKey: 'regulatory_filings_due', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.regulatory_filings_due' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'safety_incidents',       transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.safety_incidents' }],       source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'inspections_passed',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.inspections_passed' }],     source: 'intelligence_brief' }),
  ],
})

// ─── Area catalog index ───────────────────────────────────────────────────────

export const AREA_CATALOG = {
  'customer-service':          AREA_CUSTOMER_SERVICE,
  'finance-accounting':        AREA_FINANCE_ACCOUNTING,
  'management-strategy':       AREA_MANAGEMENT_STRATEGY,
  'marketing-sales':           AREA_MARKETING_SALES,
  'revenue-sales':             AREA_REVENUE_SALES,
  'inventory-operations':      AREA_INVENTORY_OPERATIONS,
  'production':                AREA_PRODUCTION,
  'client-delivery':           AREA_CLIENT_DELIVERY,
  'product-engineering':       AREA_PRODUCT_ENGINEERING,
  'people-hr':                 AREA_PEOPLE_HR,
  'marketplace-transactions':  AREA_MARKETPLACE_TRANSACTIONS,
  'marketplace-trust':         AREA_MARKETPLACE_TRUST,
  'app-engagement':            AREA_APP_ENGAGEMENT,
  'app-growth':                AREA_APP_GROWTH,
  'app-monetisation':          AREA_APP_MONETISATION,
  'rd-pipeline':               AREA_RD_PIPELINE,
  'clinical-regulatory':       AREA_CLINICAL_REGULATORY,
  'wholesale-sales':           AREA_WHOLESALE_SALES,
  'wholesale-credit':          AREA_WHOLESALE_CREDIT,
  'logistics-shipments':       AREA_LOGISTICS_SHIPMENTS,
  'logistics-fleet':           AREA_LOGISTICS_FLEET,
  'hospitality-revenue':       AREA_HOSPITALITY_REVENUE,
  'hospitality-guest':         AREA_HOSPITALITY_GUEST,
  'healthcare-patients':       AREA_HEALTHCARE_PATIENTS,
  'healthcare-billing':        AREA_HEALTHCARE_BILLING,
  'real-estate-portfolio':     AREA_REAL_ESTATE_PORTFOLIO,
  'construction-pipeline':     AREA_CONSTRUCTION_PIPELINE,
  'construction-delivery':     AREA_CONSTRUCTION_DELIVERY,
  'construction-billing':      AREA_CONSTRUCTION_BILLING,
  'agriculture-production':    AREA_AGRICULTURE_PRODUCTION,
  'agriculture-inputs':        AREA_AGRICULTURE_INPUTS,
  'fintech-customers':         AREA_FINTECH_CUSTOMERS,
  'fintech-risk':              AREA_FINTECH_RISK,
  'insurance-policy':          AREA_INSURANCE_POLICY,
  'insurance-claims':          AREA_INSURANCE_CLAIMS,
  'insurance-risk':            AREA_INSURANCE_RISK,
  'telecom-subscribers':       AREA_TELECOM_SUBSCRIBERS,
  'telecom-network':           AREA_TELECOM_NETWORK,
  'media-audience':            AREA_MEDIA_AUDIENCE,
  'media-engagement':          AREA_MEDIA_ENGAGEMENT,
  'media-monetisation':        AREA_MEDIA_MONETISATION,
  'education-enrolment':       AREA_EDUCATION_ENROLMENT,
  'education-retention':       AREA_EDUCATION_RETENTION,
  'energy-generation':         AREA_ENERGY_GENERATION,
  'energy-billing':            AREA_ENERGY_BILLING,
  'energy-compliance':         AREA_ENERGY_COMPLIANCE,
}

export function getArea(id) {
  return AREA_CATALOG[id] ?? null
}

export function getAreasForIndustry(industryId) {
  return Object.values(AREA_CATALOG).filter((a) => a.industries.includes(industryId))
}
