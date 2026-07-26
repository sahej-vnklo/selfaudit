import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildUserMetricMap,
  buildBaselineFacts,
  buildDecisionBrief,
  buildDelta,
  computeAfterValue,
  projectKnownRelationship,
} from '../simulation.js'

test('saved user metrics become numeric Foresight baselines', () => {
  assert.deepEqual(buildUserMetricMap([
    { name: 'churn_rate', value: '6.6' },
    { name: 'mrr', value: 79000 },
    { name: 'invalid', value: 'not-a-number' },
  ]), {
    churn_rate: 6.6,
    mrr: 79000,
  })
})

test('scenario changes support set, absolute, and percent operations', () => {
  assert.equal(computeAfterValue(100, 'set', 75), 75)
  assert.equal(computeAfterValue(100, 'absolute', -15), 85)
  assert.equal(computeAfterValue(100, 'percent', -20), 80)
  assert.equal(computeAfterValue(100, 'percent', 25), 125)
})

test('scenario changes never create negative business metrics', () => {
  assert.equal(computeAfterValue(10, 'absolute', -25), 0)
  assert.equal(computeAfterValue(10, 'percent', -200), 0)
})

test('burn to runway is calculated with cash held constant', () => {
  const projection = projectKnownRelationship(
    'burn_rate',
    'runway_months',
    100000,
    80000,
    { runway_months: 12 },
  )
  assert.deepEqual(projection, {
    value: 15,
    evidenceTier: 'calculated',
    basis: 'Cash held constant while burn changes.',
  })
})

test('churn to MRR is explicitly an estimate, not a calculated fact', () => {
  const projection = projectKnownRelationship(
    'churn_rate',
    'mrr',
    5,
    7,
    { mrr: 100000 },
  )
  assert.equal(projection.evidenceTier, 'estimated')
  assert.ok(projection.value < 100000)
  assert.match(projection.basis, /acquisition and pricing held constant/i)
})

test('delta reports findings that disappear as improvements', () => {
  const finding = { id: 'runway-risk', status: 'bad', severity: 'high' }
  const delta = buildDelta(
    { findings: [finding], areas: [] },
    { findings: [], areas: [] },
  )
  assert.deepEqual(delta.improvedFindings, [finding])
  assert.deepEqual(delta.newFindings, [])
})

test('baseline facts preserve source and observation time', () => {
  const facts = buildBaselineFacts([{
    checkedAt: '2026-07-25T10:00:00.000Z',
    metricsByKey: { churn_rate: 6.6 },
    metrics: [{ key: 'churn_rate', source: 'Stripe connector' }],
  }], [])
  assert.deepEqual(facts.get('churn_rate'), {
    key: 'churn_rate',
    value: 6.6,
    sourceType: 'connector',
    sourceLabel: 'Stripe connector',
    observedAt: '2026-07-25T10:00:00.000Z',
  })
})

test('decision brief labels a metric stress test as incomplete, not a recommendation', () => {
  const brief = buildDecisionBrief({
    scenario: {
      mode: 'metric_stress_test',
      statedAssumptions: [],
      missingInputs: [],
      label: 'Churn rate',
    },
    delta: { newFindings: [], worsenedFindings: [], improvedFindings: [], areaStatusChanges: [] },
    comparisonRows: [
      {
        key: 'churn_rate',
        label: 'Churn rate',
        areaLabel: 'Finance',
        baseline: 6.6,
        scenario: 3,
        direction: 'positive',
        evidenceTier: 'assumed',
        basis: 'User-defined scenario value.',
      },
      {
        key: 'mrr',
        label: 'Monthly recurring revenue',
        areaLabel: 'Finance',
        baseline: 79000,
        scenario: 88000,
        direction: 'positive',
        evidenceTier: 'estimated',
        basis: 'Three-month retention effect with acquisition and pricing held constant.',
      },
    ],
    causalGraph: { edges: [{ from: 'churn_rate', to: 'mrr', confidence: 'high' }] },
    patterns: [],
  })
  assert.match(brief.verdict, /decision incomplete/i)
  assert.doesNotMatch(JSON.stringify(brief), /net positive|no downside/i)
  assert.ok(brief.missingData.includes('How the metric change will be achieved.'))
  assert.equal(brief.confidence.feasibility, 'not_assessed')
})

test('decision brief does not claim net economics when implementation cost is unmodeled', () => {
  const brief = buildDecisionBrief({
    scenario: {
      mode: 'decision',
      action: { description: 'Hire two warehouse leads' },
      costs: [{ label: 'Annual payroll', amount: 160000, cadence: 'annual' }],
      statedAssumptions: [],
      missingInputs: [],
      label: 'Fulfilment time',
    },
    delta: { newFindings: [], worsenedFindings: [], improvedFindings: [], areaStatusChanges: [] },
    comparisonRows: [{
      key: 'fulfilment_time_hrs',
      label: 'Fulfilment time',
      areaLabel: 'Operations',
      baseline: 48,
      scenario: 36,
      direction: 'positive',
      evidenceTier: 'assumed',
      basis: 'User-defined scenario value.',
    }],
    causalGraph: { edges: [] },
    patterns: [],
  })
  assert.match(brief.verdict, /economics incomplete/i)
  assert.ok(brief.downside.some((item) => /not netted/i.test(item)))
  assert.ok(brief.missingData.some((item) => /net financial effect/i.test(item)))
})
