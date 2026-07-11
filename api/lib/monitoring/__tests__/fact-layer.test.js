import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetricHistoryRows, buildEntityHistoryRows } from '../../../cron/sync-connectors.js'
import { METRIC_DEFINITIONS } from '../../connectors/metric-definitions.js'
import { NORMALIZER_VERSION } from '../../connectors/normalize.js'
import { DETECTION_VERSION } from '../../governance/monitoring.js'
import { buildEvidenceSnapshot } from '../risk-alerts.js'

test('evidence snapshot builder freezes alert facts and context', () => {
  const risk = {
    severity: 'high',
    category: 'revenue-sales',
    title: 'Refund rate is critically high',
    description: 'Over 10% of orders are being refunded.',
    source: 'governance',
    status: 'bad',
    areaId: 'revenue-sales',
    metricKey: 'refund_rate',
    metricValue: 13.33,
    comparator: 'gt',
    thresholdValue: 10,
    financialImpact: {
      tier: 'observed+estimated',
      observed: 560,
      observed_scope: 'store',
      estimated_exposure: { low: 392, high: 728, basis: 'current 30-day refund pace continuing, +/-30%' },
      assumptions: ['refund pace unchanged', 'no intervention'],
    },
    supportCorrelation: {
      scope: 'sku_order_linked',
      recent_count: 13,
      prior_count: 4,
      ratio: 3.25,
      ratio_text: 'tripled',
    },
  }
  const healthCheck = {
    checked_at: '2026-07-10T12:00:00.000Z',
    governance: {
      snapshots: [
        {
          areaId: 'revenue-sales',
          metrics: [
            { key: 'refund_rate', value: 13.33, source: 'shopify' },
            { key: 'daily_revenue', value: 3090, source: 'shopify' },
          ],
        },
      ],
      causalDiagnosis: {
        chains: [
          {
            driver: 'refund_rate',
            effects: [
              {
                key: 'daily_revenue',
                mechanism: 'Each refund reverses booked revenue, creating a direct drag on net daily revenue.',
                confidence: 'high',
                hops: 1,
              },
            ],
          },
        ],
      },
    },
  }

  const snapshot = buildEvidenceSnapshot(risk, healthCheck)

  // concept_context comes from the graph bindings (refund_rate bound in bindings v1.1.0):
  // assert its shape, not its exact contents, so graph growth doesn't break this test.
  assert.ok(snapshot.concept_context.length >= 1, 'refund_rate must resolve concept edges')
  for (const edge of snapshot.concept_context) {
    assert.ok(edge.id, 'concept edge must carry id')
    assert.ok(Array.isArray(edge.sources) && edge.sources.length >= 1, 'concept edge must carry sources')
  }

  assert.deepEqual({ ...snapshot, concept_context: [] }, {
    origin: 'governance',
    finding: {
      metricKey: 'refund_rate',
      metricValue: 13.33,
      comparator: 'gt',
      thresholdValue: 10,
      areaId: 'revenue-sales',
    },
    related_metrics: [
      {
        key: 'refund_rate',
        value: 13.33,
        capturedAt: '2026-07-10T12:00:00.000Z',
      },
    ],
    causal_chain: [
      {
        driver: 'refund_rate',
        effects: [
          {
            key: 'daily_revenue',
            mechanism: 'Each refund reverses booked revenue, creating a direct drag on net daily revenue.',
            confidence: 'high',
            hops: 1,
          },
        ],
      },
    ],
    concept_context: [],
    financialImpact: {
      tier: 'observed+estimated',
      observed: 560,
      observed_scope: 'store',
      estimated_exposure: { low: 392, high: 728, basis: 'current 30-day refund pace continuing, +/-30%' },
      assumptions: ['refund pace unchanged', 'no intervention'],
    },
    supportCorrelation: {
      scope: 'sku_order_linked',
      recent_count: 13,
      prior_count: 4,
      ratio: 3.25,
      ratio_text: 'tripled',
    },
    normalizer_version: NORMALIZER_VERSION,
    detection_version: DETECTION_VERSION,
    checked_at: '2026-07-10T12:00:00.000Z',
  })
})

test('AI-originated alert candidates are marked as enrichment evidence', () => {
  const snapshot = buildEvidenceSnapshot(
    {
      source: 'governance-ai',
      category: 'governance',
      title: 'AI-enriched alert',
      metricKey: 'compound',
    },
    { checked_at: '2026-07-10T12:00:00.000Z', governance: { snapshots: [], causalDiagnosis: { chains: [] } } }
  )

  assert.equal(snapshot.origin, 'ai-enrichment')
})

test('sync metric row builder stamps version and metric definition window', () => {
  const rows = buildMetricHistoryRows(
    '00000000-0000-0000-0000-000000000001',
    {
      provider: 'shopify',
      metrics: [
        { key: 'refund_rate', value: 13.33, source: 'shopify' },
        { key: 'open_deals', value: 3, source: 'hubspot' },
      ],
    },
    '2026-07-10T12:00:00.000Z'
  )

  assert.deepEqual(rows, [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      provider: 'shopify',
      metric_key: 'refund_rate',
      metric_value: 13.33,
      synced_at: '2026-07-10T12:00:00.000Z',
      normalizer_version: NORMALIZER_VERSION,
      window_days: METRIC_DEFINITIONS.refund_rate.window_days,
    },
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      provider: 'hubspot',
      metric_key: 'open_deals',
      metric_value: 3,
      synced_at: '2026-07-10T12:00:00.000Z',
      normalizer_version: NORMALIZER_VERSION,
      window_days: null,
    },
  ])
})

test('sync entity row builder stores aggregate entity payloads', () => {
  const rows = buildEntityHistoryRows(
    '00000000-0000-0000-0000-000000000001',
    {
      provider: 'shopify',
      entities: [
        {
          type: 'sku',
          id: 'ATLAS-HOODIE-M',
          label: 'Atlas Hoodie / M',
          refund_count: 6,
          refund_rate: 60,
          orders_count: 10,
          refunded_amount: 500,
          order_ids: ['gid://shopify/Order/0001', 'gid://shopify/Order/0002'],
          source: 'shopify',
        },
      ],
    },
    '2026-07-10T12:00:00.000Z'
  )

  assert.deepEqual(rows, [
    {
      user_id: '00000000-0000-0000-0000-000000000001',
      provider: 'shopify',
      entity_type: 'sku',
      entity_id: 'ATLAS-HOODIE-M',
      label: 'Atlas Hoodie / M',
      dimensions: {
        type: 'sku',
        id: 'ATLAS-HOODIE-M',
        label: 'Atlas Hoodie / M',
        refund_count: 6,
        refund_rate: 60,
        orders_count: 10,
        refunded_amount: 500,
        order_ids: ['gid://shopify/Order/0001', 'gid://shopify/Order/0002'],
        source: 'shopify',
      },
      synced_at: '2026-07-10T12:00:00.000Z',
    },
  ])
})
