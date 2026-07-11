import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  buildCompoundDiagnosis,
  getExplanationContext,
  traceRootCause,
} from '../../causal-engine.js'
import {
  getConceptEdgesForMetric,
  getConceptGraph,
  getEnrichedMetricEdge,
  getMetricEdges,
} from '../index.js'

test('graph artifacts load and validate', () => {
  assert.equal(getMetricEdges().length, 40)

  const conceptGraph = getConceptGraph()
  assert.equal(Object.keys(conceptGraph.nodes).length, 177)
  assert.equal(conceptGraph.concept_edges.length, 175)
  assert.equal(conceptGraph.motifs.length, 7)
})

test('traceRootCause preserves the pre-refactor csat baseline', () => {
  assert.deepEqual(traceRootCause('csat'), [
    {
      rootKey: 'resolution_time',
      path: ['resolution_time', 'csat'],
      mechanisms: [
        {
          conf: 'high',
          text: 'Long resolution times erode trust, compounding even after the issue is fixed.',
        },
      ],
      confidence: 'high',
    },
    {
      rootKey: 'ticket_volume',
      path: ['ticket_volume', 'first_response_time', 'csat'],
      mechanisms: [
        {
          conf: 'medium',
          text: 'Surge in volume reduces available capacity, stretching first-response times.',
        },
        {
          conf: 'high',
          text: 'Slow first responses are the single strongest predictor of low satisfaction scores.',
        },
      ],
      confidence: 'medium',
    },
  ])
})

test('buildCompoundDiagnosis preserves the pre-refactor churn and mrr baseline', () => {
  assert.deepEqual(buildCompoundDiagnosis(['churn_rate', 'mrr']), {
    summary: 'The most likely root issue is churn_rate — it is causally upstream of 1 of the other failing metrics.',
    chains: [
      {
        driver: 'churn_rate',
        effects: [
          {
            key: 'mrr',
            mechanism: 'Every percentage point of monthly churn compounds into exponential MRR erosion over time.',
            confidence: 'high',
            hops: 1,
          },
        ],
      },
    ],
    rootCandidates: ['churn_rate'],
  })
})

test('concept edges can be resolved from a runtime metric', () => {
  const conceptEdges = getConceptEdgesForMetric('churn_rate')

  assert.ok(conceptEdges.length >= 1)
  assert.ok(conceptEdges.some((edge) => Array.isArray(edge.sources) && edge.sources.length > 0))
})

test('metric edges are enriched when concept bindings map both metrics', () => {
  assert.deepEqual(getEnrichedMetricEdge('lead_volume', 'open_deals'), {
    from: 'lead_volume',
    to: 'open_deals',
    mechanism: 'Lead volume is the upstream source for open deals — a drop in leads typically shows up as a pipeline gap in 30–60 days.',
    confidence: 'high',
    sources: ['Aaron Ross, Predictable Revenue', 'Roberge'],
    conditions: [
      'SDRs measured on meetings/activity rather than qualified opportunities',
    ],
    delay: 'one sales cycle',
    concept_edge_id: 'e.outbound-pipeline',
  })
})

test('explanation context exposes concept edge context by metric key', () => {
  const context = getExplanationContext(['churn_rate'])

  assert.ok(Array.isArray(context.churn_rate))
  assert.ok(context.churn_rate.length >= 1)
  assert.ok(context.churn_rate.every((edge) => 'effect' in edge))
})

test('company DNA no longer reads causal-engine source text', () => {
  const source = readFileSync(new URL('../../../intelligence/company-dna.js', import.meta.url), 'utf8')

  assert.equal(source.includes(['new', 'Function'].join(' ')), false)
  assert.equal(source.includes(`source.match(/const ${'CAUSAL'}_GRAPH`), false)
  assert.equal(source.includes(`causal-${'engine'}.js`), false)
})
