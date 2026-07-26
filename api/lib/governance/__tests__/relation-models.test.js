import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPolarity, buildScenarioGraph } from '../relation-models.js'

test('same and inverse polarity work in both change directions', () => {
  assert.equal(applyPolarity('up', 'same'), 'up')
  assert.equal(applyPolarity('down', 'same'), 'down')
  assert.equal(applyPolarity('up', 'inverse'), 'down')
  assert.equal(applyPolarity('down', 'inverse'), 'up')
})

test('churn graph preserves separate branches instead of serializing them', () => {
  const graph = buildScenarioGraph('churn_rate', 'down', 2)
  const firstLevel = graph.nodes.filter((node) => node.depth === 1).map((node) => node.key)
  assert.ok(firstLevel.includes('mrr'))
  assert.ok(firstLevel.includes('ltv_cac_ratio'))
  assert.ok(graph.edges.some((edge) => edge.from === 'mrr' && edge.to === 'runway_months'))
  assert.ok(graph.edges.some((edge) => edge.from === 'ltv_cac_ratio' && edge.to === 'runway_months'))
})

test('conditional relationships remain unknown rather than inventing pressure', () => {
  const graph = buildScenarioGraph('avg_machine_uptime', 'up', 1)
  const conditional = graph.edges.find((edge) => edge.to === 'defect_rate')
  assert.equal(conditional.changeDirection, 'unknown')
  assert.ok(conditional.conditions.length)
})
