import { createMetricDefinition, createRulePack, createThresholdRule, evaluateRulePack } from '../../shared/contracts.js'

export const MARKETING_SALES_AREA = {
  id: 'marketing-sales',
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
      createThresholdRule({
        id: 'marketing-sales:open-deals-bad',
        metricKey: 'open_deals',
        comparator: 'lt',
        value: 3,
        status: 'bad',
        severity: 'high',
        title: 'Pipeline is too thin',
        summary: 'There are not enough active deals to absorb normal fallout.',
        recommendation: 'Increase pipeline creation now and review where lead flow or qualification is slowing down.',
        rationale: 'A thin pipeline makes revenue highly fragile and reactive.',
      }),
      createThresholdRule({
        id: 'marketing-sales:lead-volume-watch',
        metricKey: 'lead_volume',
        comparator: 'lt',
        value: 10,
        status: 'watch',
        severity: 'medium',
        title: 'Lead flow looks light',
        summary: 'New lead volume is below a healthy baseline for consistent pipeline growth.',
        recommendation: 'Review demand generation sources and top-of-funnel follow-up speed.',
        rationale: 'Weak lead flow shows up later as an empty pipeline if not corrected early.',
      }),
      createThresholdRule({
        id: 'marketing-sales:stage-conversion-watch',
        metricKey: 'stage_conversion',
        comparator: 'lt',
        value: 25,
        status: 'watch',
        severity: 'medium',
        title: 'Deals are not progressing cleanly',
        summary: 'Conversion through the funnel is weaker than a healthy sales process should allow.',
        recommendation: 'Audit qualification, objections, and where opportunities are getting stuck.',
        rationale: 'Poor conversion usually means the team is filling the funnel but not moving revenue forward.',
      }),
      createThresholdRule({
        id: 'marketing-sales:stage-conversion-bad',
        metricKey: 'stage_conversion',
        comparator: 'lt',
        value: 15,
        status: 'bad',
        severity: 'high',
        title: 'Conversion is materially weak',
        summary: 'Too little of the funnel is advancing into real revenue opportunities.',
        recommendation: 'Run a focused sales process diagnosis and fix qualification, messaging, or handoff gaps.',
        rationale: 'This is a strong sign of hidden operational debt in growth execution.',
      }),
      createThresholdRule({
        id: 'marketing-sales:sales-cycle-watch',
        metricKey: 'sales_cycle_days',
        comparator: 'gt',
        value: 45,
        status: 'watch',
        severity: 'medium',
        title: 'Sales cycle is slowing',
        summary: 'Deals are taking longer than expected to close.',
        recommendation: 'Inspect delay points, approval friction, and follow-up quality in late-stage deals.',
        rationale: 'Long cycles often hide buyer hesitation or poor process discipline.',
      }),
    ],
    notes: [
      'Watch thin pipeline, stalled conversions, weak follow-through, and falling demand quality.',
      'This area should answer: is growth healthy, and where is revenue creation getting stuck?',
    ],
  }),
}

export function evaluateMarketingSalesArea(metrics) {
  return evaluateRulePack(MARKETING_SALES_AREA.defaultRulePack, metrics)
}
