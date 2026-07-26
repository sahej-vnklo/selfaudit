import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDeterministicScenario } from '../scenario-parser.js'

const metrics = [
  { key: 'churn_rate', label: 'Churn rate', unit: 'percent' },
  { key: 'burn_rate', label: 'Burn rate', unit: 'currency' },
  { key: 'headcount', label: 'Headcount', unit: 'number' },
]

test('target parsing uses the value after "to"', () => {
  const result = parseDeterministicScenario('What if churn moves from 6.6% to 3%?', metrics)
  assert.equal(result.changes[0].operation, 'set')
  assert.equal(result.changes[0].value, 3)
})

test('percentage cuts preserve a negative change', () => {
  const result = parseDeterministicScenario('What if monthly burn falls by 15%?', metrics)
  assert.equal(result.changes[0].operation, 'percent')
  assert.equal(result.changes[0].value, -15)
})

test('an operational action is not converted into a blind metric override', () => {
  const result = parseDeterministicScenario('What if we hire two warehouse leads?', metrics)
  assert.equal(result, null)
})
