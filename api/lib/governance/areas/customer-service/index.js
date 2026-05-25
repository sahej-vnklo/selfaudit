import { createMetricDefinition, createRulePack, createThresholdRule, evaluateRulePack } from '../../shared/contracts.js'

export const CUSTOMER_SERVICE_AREA = {
  id: 'customer-service',
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
      createThresholdRule({
        id: 'customer-service:first-response-watch',
        metricKey: 'first_response_time',
        comparator: 'gt',
        value: 8,
        status: 'watch',
        severity: 'medium',
        title: 'Support response time is slowing',
        summary: 'Customers are waiting longer than a healthy same-day response window.',
        recommendation: 'Review queue coverage and owner handoffs before slow replies become normal.',
        rationale: 'Support trust starts with speed. Slow first responses often show capacity or process strain.',
      }),
      createThresholdRule({
        id: 'customer-service:first-response-bad',
        metricKey: 'first_response_time',
        comparator: 'gt',
        value: 24,
        status: 'bad',
        severity: 'high',
        title: 'Support response time is at risk',
        summary: 'Customers are waiting more than a day for a first response.',
        recommendation: 'Prioritize queue triage, assign backup coverage, and reduce time-to-first-touch immediately.',
        rationale: 'Multi-day waits usually mean customers feel ignored and are more likely to churn or escalate.',
      }),
      createThresholdRule({
        id: 'customer-service:resolution-watch',
        metricKey: 'resolution_time',
        comparator: 'gt',
        value: 48,
        status: 'watch',
        severity: 'medium',
        title: 'Issue resolution is dragging',
        summary: 'Customer issues are taking more than two days to close.',
        recommendation: 'Audit common blockers and tighten escalation paths for stuck issues.',
        rationale: 'Long resolution times usually indicate unclear ownership or repeated back-and-forth.',
      }),
      createThresholdRule({
        id: 'customer-service:repeat-issue-bad',
        metricKey: 'repeat_issue_rate',
        comparator: 'gt',
        value: 20,
        status: 'bad',
        severity: 'high',
        title: 'Repeat issues are too common',
        summary: 'Too many customer problems are reopening or coming back.',
        recommendation: 'Identify the top recurring issue types and fix the underlying process or product cause.',
        rationale: 'Recurring issues are a direct sign of operational debt in service delivery.',
      }),
      createThresholdRule({
        id: 'customer-service:csat-bad',
        metricKey: 'csat',
        comparator: 'lt',
        value: 80,
        status: 'bad',
        severity: 'high',
        title: 'Customer satisfaction is slipping',
        summary: 'Service satisfaction has dropped below a healthy confidence line.',
        recommendation: 'Review the latest negative interactions and isolate the causes behind dissatisfaction.',
        rationale: 'Falling satisfaction often appears before churn or escalation becomes obvious.',
      }),
    ],
    notes: [
      'Watch backlog growth, slow responses, repeated complaints, and satisfaction drops.',
      'This area should answer: are customers getting help fast enough, and are the same problems recurring?',
    ],
  }),
}

export function evaluateCustomerServiceArea(metrics) {
  return evaluateRulePack(CUSTOMER_SERVICE_AREA.defaultRulePack, metrics)
}
