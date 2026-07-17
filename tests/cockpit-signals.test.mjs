import assert from 'node:assert/strict'
import test from 'node:test'

import { buildTopSignals } from '../shared/cockpit-signals.js'

function alert(overrides = {}) {
  const value = (key, fallback) => Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : fallback
  return {
    id: value('id', 'alert-1'),
    title: value('title', 'Runway is critical'),
    description: value('description', 'Runway is below the operating threshold.'),
    category: value('category', 'finance-accounting'),
    severity: value('severity', 'critical'),
    escalation_tier: value('escalation_tier', 'critical'),
    evidence: value('evidence', { rootCause: 'Cash burn is outpacing collections.', impact: 'The company can run out of operating cash.' }),
    evidence_snapshot: value('evidence_snapshot', { checked_at: '2026-07-17T12:00:00.000Z', finding: { areaId: 'finance-accounting' } }),
    recommended_action: value('recommended_action', 'Reduce non-essential spend.'),
    created_at: value('created_at', '2026-07-17T12:00:00.000Z'),
  }
}

test('top signals include actionable tiers and leave watching tiers out', () => {
  const result = buildTopSignals([
    alert({ id: 'critical' }),
    alert({ id: 'watch', escalation_tier: 'watch', severity: 'medium' }),
  ], [{ id: 'finance-accounting', label: 'Finance & Accounting' }])

  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'critical')
  assert.equal(result[0].area_label, 'Finance & Accounting')
})

test('quantified signals rank by measured estimate before unquantified signals', () => {
  const result = buildTopSignals([
    alert({ id: 'unquantified', created_at: '2026-07-17T13:00:00.000Z' }),
    alert({
      id: 'smaller',
      evidence_snapshot: {
        finding: { areaId: 'finance-accounting' },
        financialImpact: { tier: 'observed+estimated', estimated_exposure: { low: 100, high: 300, basis: 'measured pace' } },
      },
    }),
    alert({
      id: 'larger',
      evidence_snapshot: {
        finding: { areaId: 'finance-accounting' },
        financialImpact: { tier: 'observed+estimated', estimated_exposure: { low: 800, high: 1200, basis: 'measured pace' } },
      },
    }),
  ])

  assert.deepEqual(result.map((item) => item.id), ['larger', 'smaller', 'unquantified'])
  assert.equal(result[0].financial_impact.display, '$800–$1,200')
  assert.deepEqual(result.map((item) => item.rank), [1, 2, 3])
})

test('signal summaries use honest fallbacks instead of invented owners or impact', () => {
  const [result] = buildTopSignals([
    alert({
      description: null,
      evidence: {},
      recommended_action: null,
      evidence_snapshot: { finding: { areaId: 'customer-service', entityLabel: 'Enterprise queue' } },
    }),
  ])

  assert.equal(result.issue_summary, 'No issue summary is available yet.')
  assert.equal(result.likely_driver, null)
  assert.equal(result.financial_impact, null)
  assert.equal(result.affected_label, 'Affected entity')
  assert.equal(result.affected_detail, 'Enterprise queue')
  assert.equal(result.recommended_next_step, null)
})
