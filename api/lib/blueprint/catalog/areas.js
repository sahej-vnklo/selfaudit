import { createArea, createMetricDefinition, createThresholdRule, createRulePack, createCompoundRule, createMetricMapping } from '../schema.js'

// ─── SaaS / Software ──────────────────────────────────────────────────────────

export const AREA_CUSTOMER_SERVICE = createArea({
  id: 'customer-service',
  label: 'Customer Service',
  industries: ['saas-software', 'ecommerce-d2c', 'professional-services'],
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
    createMetricMapping({ metricKey: 'ticket_volume', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.support_tickets_per_week' }], source: 'intelligence_brief' }),
  ],
})

export const AREA_FINANCE_ACCOUNTING = createArea({
  id: 'finance-accounting',
  label: 'Finance & Accounting',
  industries: ['saas-software', 'ecommerce-d2c', 'professional-services', 'manufacturing'],
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
    createMetricMapping({ metricKey: 'churn_rate',    transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'churn_rate' },    { type: 'brief', path: 'financial.churn' }],      source: 'stripe' }),
    createMetricMapping({ metricKey: 'ltv',           transform: 'safeNumber', sources: [{ type: 'integration', integration: 'stripe', field: 'ltv' },           { type: 'brief', path: 'financial.ltv' }],        source: 'stripe' }),
    createMetricMapping({ metricKey: 'burn_rate',     transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.burn_rate' }],                        source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'runway_months', transform: 'safeNumber', sources: [{ type: 'brief', path: 'financial.runway' }, { type: 'brief', path: 'context.runway' }], source: 'intelligence_brief' }),
    createMetricMapping({ metricKey: 'ltv_cac_ratio', transform: 'divide',     inputs: [{ metricKey: 'ltv' }, { metricKey: 'cac', sources: [{ type: 'brief', path: 'financial.cac' }] }], source: 'derived' }),
  ],
})

export const AREA_MANAGEMENT_STRATEGY = createArea({
  id: 'management-strategy',
  label: 'Management & Strategy',
  industries: ['saas-software', 'ecommerce-d2c', 'professional-services', 'manufacturing'],
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
  ],
})

export const AREA_MARKETING_SALES = createArea({
  id: 'marketing-sales',
  label: 'Marketing & Sales',
  industries: ['saas-software', 'professional-services'],
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
  ],
  defaultRulePack: createRulePack({
    defaults: [
      createThresholdRule({ id: 'marketing-sales:open-deals-bad',          metricKey: 'open_deals',       comparator: 'lt', value: 3,  status: 'bad',   severity: 'high',   title: 'Pipeline is too thin',              summary: 'There are not enough active deals to absorb normal fallout.',                  recommendation: 'Increase pipeline creation now and review where lead flow or qualification is slowing down.', rationale: 'A thin pipeline makes revenue highly fragile and reactive.' }),
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
    createMetricMapping({ metricKey: 'stage_conversion', transform: 'ratio',      inputs: [{ metricKey: 'sqls', sources: [{ type: 'normalized', field: 'sqls' }] }, { metricKey: 'lead_volume' }], source: 'derived' }),
    createMetricMapping({ metricKey: 'sales_cycle_days', transform: 'safeNumber', sources: [{ type: 'brief', path: 'operational.sales_cycle' }],                              source: 'intelligence_brief' }),
  ],
})

// ─── E-commerce / D2C ─────────────────────────────────────────────────────────

export const AREA_REVENUE_SALES = createArea({
  id: 'revenue-sales',
  label: 'Revenue & Sales',
  industries: ['ecommerce-d2c'],
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
  industries: ['ecommerce-d2c', 'manufacturing'],
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
  createCompoundRule({ id: 'compound:cash-fragility',           conditions: [{ metricKey: 'churn_rate', comparator: 'gt', value: 5 }, { metricKey: 'runway_months', comparator: 'lt', value: 9 }],       title: 'Cash fragility',              summary: 'High churn combined with short runway creates compounding financial pressure.',              recommendation: 'Treat churn reduction and cash conservation as a single priority — one directly extends the other.',  severity: 'critical' }),
  createCompoundRule({ id: 'compound:pipeline-collapse',        conditions: [{ metricKey: 'open_deals', comparator: 'eq', value: 0 }, { metricKey: 'lead_volume', comparator: 'lt', value: 10 }],         title: 'Pipeline collapse',           summary: 'No open deals and lead flow below 10 — the revenue engine has stalled at both ends.',       recommendation: 'Start an outbound sprint immediately and review every lead source for blockage.',                    severity: 'critical' }),
  createCompoundRule({ id: 'compound:unit-economics-inversion', conditions: [{ metricKey: 'ltv_cac_ratio', comparator: 'lt', value: 1 }, { metricKey: 'churn_rate', comparator: 'gt', value: 5 }],        title: 'Unit economics are inverted', summary: 'LTV:CAC below 1 and churn above 5% means acquiring customers is destroying value.',           recommendation: 'Pause acquisition spend and fix retention before scaling further.',                                  severity: 'critical' }),
  createCompoundRule({ id: 'compound:execution-breakdown',      conditions: [{ metricKey: 'goal_progress', comparator: 'lt', value: 60 }, { metricKey: 'followthrough_rate', comparator: 'lt', value: 60 }], title: 'Execution breakdown',      summary: 'Goal progress below 60% and follow-through below 60% — strategy is not surviving execution.', recommendation: 'Cut active priorities to 3 or fewer and rebuild weekly accountability.',                           severity: 'high' }),
  createCompoundRule({ id: 'compound:sales-process-breakdown',  conditions: [{ metricKey: 'stage_conversion', comparator: 'lt', value: 15 }, { metricKey: 'sales_cycle_days', comparator: 'gt', value: 45 }], title: 'Sales process breakdown',  summary: 'Conversion below 15% and sales cycle above 45 days — the funnel is leaking at every stage.', recommendation: 'Run a focused sales process diagnostic and fix qualification and late-stage friction first.', severity: 'high' }),
]

export const COMPOUND_RULES_ECOMMERCE = [
  createCompoundRule({ id: 'compound:revenue-inventory-risk',  conditions: [{ metricKey: 'out_of_stock_skus', comparator: 'gt', value: 3 }, { metricKey: 'daily_revenue', comparator: 'lt', value: 0 }], title: 'Revenue blocked by inventory', summary: 'Multiple stockouts are directly suppressing revenue.',                                         recommendation: 'Emergency reorder on stocked-out SKUs and review demand forecasting.', severity: 'critical' }),
  createCompoundRule({ id: 'compound:margin-pressure',         conditions: [{ metricKey: 'refund_rate', comparator: 'gt', value: 8 }, { metricKey: 'repeat_rate', comparator: 'lt', value: 15 }],         title: 'Margin and retention both weak', summary: 'High refunds and low repeat rate together are destroying margin from both sides.',              recommendation: 'Fix the product or fulfilment issues driving refunds — these are the same issues killing repeat rate.', severity: 'high' }),
]

export const COMPOUND_RULES_MANUFACTURING = [
  createCompoundRule({ id: 'compound:production-quality-spiral', conditions: [{ metricKey: 'avg_machine_uptime', comparator: 'lt', value: 80 }, { metricKey: 'defect_rate', comparator: 'gt', value: 4 }], title: 'Production quality spiral', summary: 'Low uptime and high defect rate together signal a machine or process failure cascading into quality.', recommendation: 'Stop affected lines for inspection before the defect rate spreads to customer shipments.', severity: 'critical' }),
]

export const COMPOUND_RULES_PS = [
  createCompoundRule({ id: 'compound:delivery-revenue-risk', conditions: [{ metricKey: 'projects_at_risk', comparator: 'gt', value: 1 }, { metricKey: 'overdue_milestones', comparator: 'gt', value: 2 }], title: 'Delivery and revenue at risk', summary: 'Multiple at-risk projects and overdue milestones together create significant renewal and billing risk.', recommendation: 'Convene a delivery review and reset client expectations immediately on the most critical engagements.', severity: 'critical' }),
]

// ─── Area catalog index ───────────────────────────────────────────────────────

export const AREA_CATALOG = {
  'customer-service':     AREA_CUSTOMER_SERVICE,
  'finance-accounting':   AREA_FINANCE_ACCOUNTING,
  'management-strategy':  AREA_MANAGEMENT_STRATEGY,
  'marketing-sales':      AREA_MARKETING_SALES,
  'revenue-sales':        AREA_REVENUE_SALES,
  'inventory-operations': AREA_INVENTORY_OPERATIONS,
  'production':           AREA_PRODUCTION,
  'client-delivery':      AREA_CLIENT_DELIVERY,
}

export function getArea(id) {
  return AREA_CATALOG[id] ?? null
}

export function getAreasForIndustry(industryId) {
  return Object.values(AREA_CATALOG).filter((a) => a.industries.includes(industryId))
}
