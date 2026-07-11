import assert from 'node:assert/strict'
import test from 'node:test'

import shopifyFixture from './fixtures/shopify-orders.json' with { type: 'json' }
import { METRIC_DEFINITIONS } from '../metric-definitions.js'
import {
  normalizeConnectorData,
  normalizeEcommerce,
  reconcileEcommerceRevenue,
} from '../normalize.js'

function metricsByKey(normalized) {
  return Object.fromEntries(normalized.metrics.map((item) => [item.key, item]))
}

test('Shopify fixture emits hand-computed ecommerce metrics', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const metrics = metricsByKey(normalized)

  // 60 included orders; one cancelled-before-fulfilment order is excluded.
  assert.equal(metrics.orders_count.value, 60)

  // Gross revenue: 10*100 + 8*50 + 8*25 + 8*80 + 8*30 + 6*15 + 6*120 + 6*60 = 3650.
  // Refunds: 4*100 full hoodie refunds + 2*50 partial hoodie refunds + 50 tee refund + 10 cap partial refund = 560.
  // Net revenue: 3650 - 560 = 3090.
  assert.equal(metrics.daily_revenue.value, 3090)
  assert.equal(metrics.refunded_amount_30d.value, 560)

  // Refunded order count: 8. Total included orders: 60. 8 / 60 * 100 = 13.33.
  assert.equal(metrics.refund_rate.value, 13.33)

  // AOV: 3650 gross revenue / 60 included orders = 60.83.
  assert.equal(metrics.aov.value, 60.83)

  // Fulfilment hours: 30 orders at 24 hours, 30 orders at 48 hours.
  // Median for 60 values is (24 + 48) / 2 = 36.
  assert.equal(metrics.fulfilment_time_hrs.value, 36)

  // Repeat orders: one later order from repeat@example.com. 1 / 60 * 100 = 1.67.
  assert.equal(metrics.repeat_rate.value, 1.67)
})

test('every Shopify-emitted metric has a written semantic definition', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)

  for (const item of normalized.metrics) {
    assert.ok(METRIC_DEFINITIONS[item.key], `${item.key} is missing from METRIC_DEFINITIONS`)
  }
})

test('fixture emits the seeded ATLAS-HOODIE-M SKU entity', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const atlas = normalized.entities.find((entity) => entity.id === 'ATLAS-HOODIE-M')
  const atlasOrderIds = Array.from({ length: 10 }, (_, index) => `gid://shopify/Order/${String(index + 1).padStart(4, '0')}`)

  assert.deepEqual(atlas, {
    type: 'sku',
    id: 'ATLAS-HOODIE-M',
    label: 'Atlas Hoodie / M',
    refund_count: 6,
    refund_rate: 60,
    orders_count: 10,
    // ATLAS refunds: 4*100 full hoodie refunds + 2*50 partial hoodie refunds = 500.
    refunded_amount: 500,
    order_ids: atlasOrderIds,
    source: 'shopify',
  })
})

test('SKU rollups retain deterministic order ids for joins', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const atlas = normalized.entities.find((entity) => entity.id === 'ATLAS-HOODIE-M')

  // ATLAS appears in ten included orders (#1001-#1010); the cancelled ATLAS order is excluded.
  assert.equal(atlas.order_ids.length, 10)
  assert.equal(atlas.order_ids[0], 'gid://shopify/Order/0001')
  assert.equal(atlas.order_ids.at(-1), 'gid://shopify/Order/0010')
})

test('cancelled-before-fulfilment orders are excluded', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const metrics = metricsByKey(normalized)
  const atlas = normalized.entities.find((entity) => entity.id === 'ATLAS-HOODIE-M')

  // The fixture has 61 total orders, but the cancelled ATLAS order has no fulfilment.
  assert.equal(shopifyFixture.orders.results.length, 61)
  assert.equal(metrics.orders_count.value, 60)
  assert.equal(atlas.orders_count, 10)
})

test('unverified ecommerce providers emit no metrics or signals', () => {
  const normalized = normalizeEcommerce('wix', shopifyFixture)

  assert.deepEqual(normalized.metrics, [])
  assert.deepEqual(normalized.risks, [])
  assert.deepEqual(normalized.opportunities, [])
})

test('malformed and empty Shopify payloads are null-safe', () => {
  assert.doesNotThrow(() => normalizeEcommerce('shopify', {}))
  assert.doesNotThrow(() => normalizeEcommerce('shopify', { orders: { results: null } }))

  assert.deepEqual(normalizeEcommerce('shopify', {}).metrics, [])
  assert.deepEqual(normalizeEcommerce('shopify', { orders: { results: null } }).risks, [])
})

test('normalizers emit metrics and entities only, not risk or opportunity signals', () => {
  const shopify = normalizeConnectorData({
    shopify: {
      provider: 'shopify',
      category: 'Ecommerce',
      fetched_at: shopifyFixture.as_of,
      data: shopifyFixture,
    },
  })
  const mixed = normalizeConnectorData({
    hubspot: {
      provider: 'hubspot',
      category: 'crm',
      fetched_at: shopifyFixture.as_of,
      data: {
        deals: { results: [] },
        contacts: { results: [{ properties: { lifecyclestage: 'lead', createdate: shopifyFixture.as_of } }] },
        pipelines: { results: [] },
      },
    },
    stripe: {
      provider: 'stripe',
      category: 'revenue',
      fetched_at: shopifyFixture.as_of,
      data: {
        active_subs: { data: [{ id: 'sub_1', customer: 'cus_1', created: 1783690000, items: { data: [{ price: { unit_amount: 5000, recurring: { interval: 'month' } } }] } }] },
        canceled_subs: { data: [] },
      },
    },
    zendesk: {
      provider: 'zendesk',
      category: 'support',
      fetched_at: shopifyFixture.as_of,
      data: { open_tickets: [{ id: '1', status: 'open' }] },
    },
    notion: {
      provider: 'notion',
      category: 'docs',
      fetched_at: shopifyFixture.as_of,
      data: { pages: [{ id: 'page-1' }] },
    },
    gmail: {
      provider: 'gmail',
      category: 'email',
      fetched_at: shopifyFixture.as_of,
      data: { threads: [{ id: 'thread-1' }] },
    },
  })

  for (const normalized of [shopify, mixed]) {
    assert.deepEqual(normalized.risks, [])
    assert.deepEqual(normalized.opportunities, [])
  }
})

test('support normalizer emits ticket entities and surge ratio from timestamp windows', () => {
  const tickets = [
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `recent-${index + 1}`,
      created_at: `2026-07-0${Math.min(index + 2, 9)}T12:00:00.000Z`,
      order_id: index === 0 ? 'gid://shopify/Order/0001' : null,
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      id: `prior-${index + 1}`,
      created_at: `2026-06-${25 + index}T12:00:00.000Z`,
      order: index === 0 ? { id: 'gid://shopify/Order/0002' } : null,
    })),
  ]
  const normalized = normalizeConnectorData({
    support: {
      provider: 'gorgias',
      category: 'support',
      fetched_at: '2026-07-10T23:59:59.000Z',
      data: { as_of: '2026-07-10T23:59:59.000Z', open_tickets: tickets },
    },
  })
  const metrics = metricsByKey(normalized)

  // Recent window: 6 tickets. Prior window: 3 tickets. 6 / 3 = 2.
  assert.equal(metrics.support_ticket_surge_ratio.value, 2)
  assert.equal(normalized.entities.filter((entity) => entity.type === 'ticket').length, 9)
  assert.deepEqual(normalized.entities.slice(0, 3).map((entity) => entity.order_id), [
    'gid://shopify/Order/0001',
    null,
    null,
  ])
  assert.equal(normalized.entities.find((entity) => entity.id === 'prior-1').order_id, 'gid://shopify/Order/0002')
})

test('support surge ratio is absent when the prior window is too small', () => {
  const normalized = normalizeConnectorData({
    support: {
      provider: 'zendesk',
      category: 'support',
      fetched_at: '2026-07-10T23:59:59.000Z',
      data: {
        as_of: '2026-07-10T23:59:59.000Z',
        open_tickets: [
          { id: 'recent-1', created_at: '2026-07-07T12:00:00.000Z' },
          { id: 'recent-2', created_at: '2026-07-08T12:00:00.000Z' },
          { id: 'prior-1', created_at: '2026-06-25T12:00:00.000Z' },
          { id: 'prior-2', created_at: '2026-06-26T12:00:00.000Z' },
        ],
      },
    },
  })

  assert.equal(metricsByKey(normalized).support_ticket_surge_ratio, undefined)
  assert.ok(normalized.entities.every((entity) => Object.hasOwn(entity, 'order_id')))
})

test('normalizeConnectorData routes Ecommerce connector payloads', () => {
  const normalized = normalizeConnectorData({
    shopify: {
      provider: 'shopify',
      category: 'Ecommerce',
      fetched_at: shopifyFixture.as_of,
      data: shopifyFixture,
    },
  })

  assert.equal(metricsByKey(normalized).orders_count.value, 60)
})

test('reconcileEcommerceRevenue returns no signal within 15 percent tolerance', () => {
  const normalizedEcom = { metrics: [{ key: 'daily_revenue', value: 3090 }] }
  const normalizedRevenue = { metrics: [{ key: 'revenue_30d', value: 3000 }] }

  assert.equal(reconcileEcommerceRevenue(normalizedEcom, normalizedRevenue), null)
})

test('reconcileEcommerceRevenue flags disagreement over 15 percent', () => {
  const normalizedEcom = { metrics: [{ key: 'daily_revenue', value: 3090 }] }
  const normalizedRevenue = { metrics: [{ key: 'revenue_30d', value: 2400 }] }

  assert.deepEqual(reconcileEcommerceRevenue(normalizedEcom, normalizedRevenue), {
    type: 'data-quality',
    severity: 'medium',
    title: 'Revenue sources disagree',
    description: 'Shopify and revenue-system totals differ by more than 15%.',
    evidence: 'shopify=3090, revenue_system=2400, variance=22.33%',
    source: 'shopify+stripe',
  })
})

test('refund dollars are never reconstructed from list prices', () => {
  // Regression: when refund lines lack explicit amounts (subtotal/total/amount), the
  // normalizer used to fall back to full line price — turning partial refunds into full
  // ones and overstating "observed" loss. Amounts must be explicit or absent.
  const stripped = JSON.parse(JSON.stringify(shopifyFixture))
  for (const order of stripped.orders.results) {
    for (const refund of order.refunds ?? []) {
      for (const line of refund.refund_line_items ?? []) {
        delete line.subtotal
        delete line.total
        delete line.amount
      }
    }
  }

  const normalized = normalizeEcommerce('shopify', stripped)
  const metricKeys = normalized.metrics.map((m) => m.key)

  // refund COUNTING stays presence-based: rate unchanged at 8/60 = 13.33
  const refundRate = normalized.metrics.find((m) => m.key === 'refund_rate')
  assert.equal(refundRate.value, 13.33)

  // refund DOLLARS vanish rather than being invented
  assert.equal(metricKeys.includes('refunded_amount_30d'), false,
    'refunded_amount_30d must not be emitted when any refund lacks an explicit amount')
  const atlas = normalized.entities.find((e) => e.id === 'ATLAS-HOODIE-M')
  assert.equal(atlas.refunded_amount, null, 'SKU refunded_amount must be null when amounts are incomplete')
  assert.equal(atlas.refund_count, 6, 'refund counting must remain presence-based')
})
