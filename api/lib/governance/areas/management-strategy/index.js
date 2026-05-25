import { createMetricDefinition, createRulePack, createThresholdRule, evaluateRulePack } from '../../shared/contracts.js'

export const MANAGEMENT_STRATEGY_AREA = {
  id: 'management-strategy',
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
      createThresholdRule({
        id: 'management-strategy:goal-progress-watch',
        metricKey: 'goal_progress',
        comparator: 'lt',
        value: 60,
        status: 'watch',
        severity: 'medium',
        title: 'Goal progress looks soft',
        summary: 'The company is behind a healthy pace on its active goal.',
        recommendation: 'Review what is blocking progress and whether priorities are too fragmented.',
        rationale: 'Slow progress is often an execution problem before it becomes a strategy problem.',
      }),
      createThresholdRule({
        id: 'management-strategy:priority-backlog-bad',
        metricKey: 'priority_backlog',
        comparator: 'gt',
        value: 5,
        status: 'bad',
        severity: 'high',
        title: 'Priority backlog is too large',
        summary: 'Too many high-priority items are open at once.',
        recommendation: 'Reduce active priorities and force ownership, sequencing, and deadlines.',
        rationale: 'A swollen backlog usually means the company is spreading attention too thin.',
      }),
      createThresholdRule({
        id: 'management-strategy:repeated-blockers-watch',
        metricKey: 'repeated_blockers',
        comparator: 'gt',
        value: 2,
        status: 'watch',
        severity: 'medium',
        title: 'Recurring blockers are stacking up',
        summary: 'The same execution blockers are appearing across multiple cycles.',
        recommendation: 'Stop treating them as one-off issues and fix the underlying operating constraint.',
        rationale: 'Repeated blockers are one of the clearest forms of operational debt.',
      }),
      createThresholdRule({
        id: 'management-strategy:followthrough-watch',
        metricKey: 'followthrough_rate',
        comparator: 'lt',
        value: 80,
        status: 'watch',
        severity: 'medium',
        title: 'Follow-through is inconsistent',
        summary: 'Too many agreed actions are missing deadlines or staying unfinished.',
        recommendation: 'Tighten ownership, review cadence, and priority discipline.',
        rationale: 'This usually means the company is deciding well but executing weakly.',
      }),
      createThresholdRule({
        id: 'management-strategy:followthrough-bad',
        metricKey: 'followthrough_rate',
        comparator: 'lt',
        value: 60,
        status: 'bad',
        severity: 'high',
        title: 'Follow-through is materially weak',
        summary: 'The business is not reliably converting decisions into completed work.',
        recommendation: 'Rebuild weekly execution discipline and cut active priorities until completion improves.',
        rationale: 'At this point, management debt itself is becoming the bottleneck.',
      }),
    ],
    notes: [
      'Watch goal slippage, repeated blockers, weak follow-through, and strategy-to-execution gaps.',
      'This area should answer: is leadership focus clear, and is the business actually executing on that focus?',
    ],
  }),
}

export function evaluateManagementStrategyArea(metrics) {
  return evaluateRulePack(MANAGEMENT_STRATEGY_AREA.defaultRulePack, metrics)
}
