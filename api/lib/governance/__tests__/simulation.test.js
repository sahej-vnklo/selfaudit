import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDelta,
  computeAfterValue,
  projectKnownRelationship,
} from '../simulation.js'

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
