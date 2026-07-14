import assert from 'node:assert/strict'
import test from 'node:test'

import shopifyFixture from '../../connectors/__tests__/fixtures/shopify-orders.json' with { type: 'json' }
import { mergeNormalized, normalizeConnectorData, normalizeEcommerce } from '../../connectors/normalize.js'
import { getArea } from '../../blueprint/catalog/index.js'
import { createArea } from '../../blueprint/schema.js'
import {
  COMPOUND_RULES_CONSTRUCTION,
  COMPOUND_RULES_CONSUMER_APP,
  COMPOUND_RULES_ECOMMERCE,
  COMPOUND_RULES_HEALTHCARE,
  COMPOUND_RULES_HOSPITALITY,
  COMPOUND_RULES_LOGISTICS,
  COMPOUND_RULES_MANUFACTURING,
  COMPOUND_RULES_MARKETPLACE,
  COMPOUND_RULES_PS,
  COMPOUND_RULES_REAL_ESTATE,
  COMPOUND_RULES_SAAS,
  COMPOUND_RULES_WHOLESALE,
} from '../../blueprint/catalog/areas.js'
import { buildAreaMetricSnapshots } from '../metric-snapshots.js'
import { runGovernanceMonitoring, toLegacyRisk } from '../monitoring.js'

const schema = {
  areas: [
    getArea('marketing-sales'),
    getArea('finance-accounting'),
    getArea('customer-service'),
    getArea('management-strategy'),
    getArea('revenue-sales'),
    getArea('inventory-operations'),
  ].filter(Boolean),
  compoundRules: [],
}

test('Ecommerce entity rules fire through governance from Shopify fixture data', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })

  const skuSpike = governance.findings.find((finding) => finding.title === 'SKU-level refund spike')
  assert.deepEqual({
    title: skuSpike?.title,
    areaId: skuSpike?.areaId,
    severity: skuSpike?.severity,
    entityType: skuSpike?.entityType,
    entityId: skuSpike?.entityId,
    entityLabel: skuSpike?.entityLabel,
    metricValue: skuSpike?.metricValue,
    summary: skuSpike?.summary,
    financialImpact: skuSpike?.financialImpact,
  }, {
    title: 'SKU-level refund spike',
    areaId: 'revenue-sales',
    severity: 'high',
    entityType: 'sku',
    entityId: 'ATLAS-HOODIE-M',
    entityLabel: 'Atlas Hoodie / M',
    metricValue: 60,
    summary: 'ATLAS-HOODIE-M has a 60% refund rate, at least 3× the store average. Observed refunds $500; if the current pace continues, $350–$650 over the next 30 days.',
    financialImpact: {
      tier: 'observed+estimated',
      observed: 500,
      observed_scope: 'sku:ATLAS-HOODIE-M',
      // Exposure: 500 observed / 30 days * 30 = 500; +/-30% = 350-650.
      estimated_exposure: { low: 350, high: 650, basis: 'current 30-day refund pace continuing, +/-30%' },
      assumptions: ['refund pace unchanged', 'no intervention'],
    },
  })

  assert.ok(governance.risks.some((risk) => risk.title === 'SKU-level refund spike'))
})

test('store refund-rate entity finding carries store-scope financial impact', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const finding = governance.findings.find((item) => item.id === 'entity:ecommerce-refund-rate-high')

  assert.deepEqual(finding?.financialImpact, {
    tier: 'observed+estimated',
    observed: 560,
    observed_scope: 'store',
    // Exposure: 560 observed / 30 days * 30 = 560; +/-30% = 392-728.
    estimated_exposure: { low: 392, high: 728, basis: 'current 30-day refund pace continuing, +/-30%' },
    assumptions: ['refund pace unchanged', 'no intervention'],
  })
})

function supportTicketsForAtlasCorrelation() {
  const atlasOrderIds = Array.from({ length: 10 }, (_, index) => `gid://shopify/Order/${String(index + 1).padStart(4, '0')}`)
  return [
    ...Array.from({ length: 13 }, (_, index) => ({
      id: `recent-linked-${index + 1}`,
      created_at: `2026-07-${String(2 + (index % 8)).padStart(2, '0')}T12:00:00.000Z`,
      order_id: atlasOrderIds[index % atlasOrderIds.length],
    })),
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `prior-linked-${index + 1}`,
      created_at: `2026-06-${String(24 + index).padStart(2, '0')}T12:00:00.000Z`,
      order_id: atlasOrderIds[index],
    })),
  ]
}

test('SKU spike summary includes linked support-ticket correlation', () => {
  const ecommerce = normalizeEcommerce('shopify', shopifyFixture)
  const support = normalizeConnectorData({
    gorgias: {
      provider: 'gorgias',
      category: 'support',
      fetched_at: shopifyFixture.as_of,
      data: {
        as_of: shopifyFixture.as_of,
        open_tickets: supportTicketsForAtlasCorrelation(),
      },
    },
  })
  const normalized = mergeNormalized(ecommerce, support)

  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const finding = governance.findings.find((item) => item.id === 'entity:sku-refund-spike')

  assert.equal(finding.summary, 'Refunds for SKU ATLAS-HOODIE-M rose to 60% over nine days — support tickets tied to its orders tripled in the same window. Observed refunds $500; if the current pace continues, $350–$650 over the next 30 days.')
  assert.deepEqual(finding.supportCorrelation, {
    scope: 'sku_order_linked',
    recent_count: 13,
    prior_count: 4,
    ratio: 3.25,
    ratio_text: 'tripled',
    recent_window_days: 9,
    prior_window_days: 9,
    anchor: '2026-07-09T12:00:00.000Z',
  })
})

test('SKU spike summary falls back to store-wide support surge when tickets are unlinked', () => {
  const ecommerce = normalizeEcommerce('shopify', shopifyFixture)
  const support = {
    provider: 'zendesk',
    fetched_at: shopifyFixture.as_of,
    metrics: [{ key: 'support_ticket_surge_ratio', value: 2.5, source: 'zendesk' }],
    entities: [
      { type: 'ticket', id: 'ticket-1', created_at: '2026-07-09T12:00:00.000Z', order_id: null },
      { type: 'ticket', id: 'ticket-2', created_at: '2026-06-25T12:00:00.000Z', order_id: null },
    ],
    signals: [],
    risks: [],
    opportunities: [],
  }
  const normalized = mergeNormalized(ecommerce, support)

  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const finding = governance.findings.find((item) => item.id === 'entity:sku-refund-spike')

  assert.ok(finding.summary.endsWith('Store-wide support volume doubled in the same window.'))
  assert.equal(finding.supportCorrelation.scope, 'store_wide')
  assert.equal(finding.supportCorrelation.ratio, 2.5)
})

test('SKU spike summary is unchanged when support correlation is absent', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const finding = governance.findings.find((item) => item.id === 'entity:sku-refund-spike')

  assert.equal(finding.supportCorrelation, undefined)
  assert.equal(finding.summary, 'ATLAS-HOODIE-M has a 60% refund rate, at least 3× the store average. Observed refunds $500; if the current pace continues, $350–$650 over the next 30 days.')
})

test('entity financial impact falls back to none when refund dollars are absent', () => {
  const normalized = {
    provider: 'shopify',
    metrics: [{ key: 'refund_rate', value: 13.33, source: 'shopify' }],
    entities: [{ type: 'sku', id: 'ATLAS-HOODIE-M', label: 'Atlas Hoodie M', refund_count: 6, refund_rate: 60, orders_count: 10 }],
  }

  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const finding = governance.findings.find((item) => item.id === 'entity:sku-refund-spike')

  assert.deepEqual(finding?.financialImpact, {
    tier: 'none',
    assumptions: ['insufficient measured refund dollars'],
  })
  assert.equal(finding.summary.includes('Observed refunds'), false)
})

test('entity rule overrides can change the refund-rate threshold', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const userOverrides = new Map([
    ['entity:ecommerce-refund-rate-high', { enabled: true, value: 20 }],
  ])
  const governance = runGovernanceMonitoring({ normalized, schema, userOverrides, checkedAt: shopifyFixture.as_of })

  assert.equal(governance.findings.some((finding) => finding.id === 'entity:ecommerce-refund-rate-high'), false)
})

test('disabled entity rules do not fire', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const userOverrides = new Map([
    ['entity:sku-refund-spike', { enabled: false, value: 3 }],
  ])
  const governance = runGovernanceMonitoring({ normalized, schema, userOverrides, checkedAt: shopifyFixture.as_of })

  assert.equal(governance.findings.some((finding) => finding.id === 'entity:sku-refund-spike'), false)
})

test('ported analyzer parity rules fire from governance snapshot inputs', () => {
  const normalized = {
    provider: 'hubspot',
    metrics: [
      { key: 'open_deals', value: 0, source: 'hubspot' },
      { key: 'leads', value: 7, source: 'hubspot' },
      { key: 'sqls', value: 0, source: 'hubspot' },
      { key: 'customers', value: 0, source: 'hubspot' },
    ],
    entities: [
      { type: 'deal', id: 'deal-1', label: 'Enterprise renewal', amount: 12000, closedate: '2026-07-20', source: 'hubspot' },
    ],
    risks: [],
    opportunities: [],
  }
  const brain = {
    retention_signals: ['churn risk on account A'],
    top_priorities: ['a', 'b', 'c', 'd', 'e'],
    repeated_blockers: ['handoff', 'capacity'],
    watchouts: ['w1', 'w2', 'w3'],
    last_session: { status: 'unknown (not followed up)' },
    active_goal: 'Launch demo',
    goal_score: 10,
    goal_timeline: 'unrealistic',
    operational_blockers: ['ops-1', 'ops-2'],
    conversion_bottlenecks: ['checkout', 'pricing'],
    current_constraints: ['cash', 'hiring', 'ops'],
  }

  const governance = runGovernanceMonitoring({ brain, normalized, schema, checkedAt: '2026-07-10T12:00:00.000Z' })
  const titles = new Set(governance.findings.map((finding) => finding.title))

  for (const title of [
    'Empty pipeline',
    'Leads not converting to SQL',
    'No customers in CRM despite active leads',
    'Negative retention signals detected',
    'High unresolved action backlog',
    'Repeated blockers unresolved',
    'Multiple watchouts active',
    'Last audit not followed up',
    'Goal trajectory critical',
    'Goal timeline flagged unrealistic',
    'Multiple operational blockers active',
    'Conversion bottlenecks identified',
    'Multiple constraints stacking',
    '1 high-value deal closing in 14 days',
  ]) {
    assert.ok(titles.has(title), `missing governance finding: ${title}`)
  }
})

test('support ticket volume risk is ported through governance snapshots', () => {
  const normalized = {
    provider: 'zendesk',
    metrics: [
      { key: 'open_tickets', value: 21, source: 'zendesk' },
    ],
    entities: [],
  }

  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: '2026-07-10T12:00:00.000Z' })
  const finding = governance.findings.find((item) => item.id === 'legacy:high-open-ticket-volume')

  assert.deepEqual({
    title: finding?.title,
    summary: finding?.summary,
    areaId: finding?.areaId,
    severity: finding?.severity,
    status: finding?.status,
    metricKey: finding?.metricKey,
    metricValue: finding?.metricValue,
    thresholdValue: finding?.thresholdValue,
  }, {
    title: 'High open ticket volume',
    summary: '21 open tickets — support queue may be backing up.',
    areaId: 'customer-service',
    severity: 'medium',
    status: 'watch',
    metricKey: 'ticket_volume',
    metricValue: 21,
    thresholdValue: 20,
  })
})

test('disabled parity rules do not fire', () => {
  const normalized = {
    provider: 'zendesk',
    metrics: [
      { key: 'open_tickets', value: 21, source: 'zendesk' },
    ],
    entities: [],
  }
  const userOverrides = new Map([
    ['legacy:high-open-ticket-volume', { enabled: false, value: 20 }],
  ])

  const governance = runGovernanceMonitoring({ normalized, schema, userOverrides, checkedAt: '2026-07-10T12:00:00.000Z' })

  assert.equal(governance.findings.some((finding) => finding.id === 'legacy:high-open-ticket-volume'), false)
})

test('Stripe no active subscriptions risk is ported through governance snapshots', () => {
  const normalized = {
    provider: 'stripe',
    metrics: [
      { key: 'mrr', value: 0, source: 'stripe' },
      { key: 'active_customers', value: 0, source: 'stripe' },
    ],
    entities: [],
  }

  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: '2026-07-10T12:00:00.000Z' })
  const finding = governance.findings.find((item) => item.id === 'legacy:no-active-subscriptions')

  assert.deepEqual({
    title: finding?.title,
    summary: finding?.summary,
    areaId: finding?.areaId,
    severity: finding?.severity,
    metricKey: finding?.metricKey,
    metricValue: finding?.metricValue,
  }, {
    title: 'No active subscriptions',
    summary: 'Zero active subscriptions found.',
    areaId: 'finance-accounting',
    severity: 'high',
    metricKey: 'active_customers',
    metricValue: 0,
  })
})

test('legacy risk shape remains stable', () => {
  const risk = toLegacyRisk(
    { areaId: 'management-strategy' },
    {
      severity: 'medium',
      title: 'Action backlog building',
      summary: 'Three actions are open.',
      metricKey: 'priority_backlog',
      comparator: 'gte',
      thresholdValue: 3,
      metricValue: 3,
      recommendation: 'Assign each action an owner.',
      rootCause: 'More actions are identified than completed.',
      impact: 'Work gets deprioritised.',
    }
  )

  assert.deepEqual(Object.keys(risk), [
    'severity',
    'category',
    'title',
    'description',
    'evidence',
    'recommended_action',
    'source',
    'rootCause',
    'impact',
  ])
})

test('manual user metrics count as honest coverage and manual sources', () => {
  const financeSchema = { areas: [getArea('finance-accounting')] }
  const snapshots = buildAreaMetricSnapshots({
    schema: financeSchema,
    userMetrics: { runway_months: 4 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })

  assert.equal(snapshots[0].coverage, 1)
  assert.deepEqual(snapshots[0].sources, ['manual'])
  assert.deepEqual(snapshots[0].metrics, [{ key: 'runway_months', value: 4, source: 'manual' }])

  const governance = runGovernanceMonitoring({
    schema: financeSchema,
    userMetrics: { runway_months: 4 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })

  assert.equal(governance.areas[0].status, 'bad')
  assert.notEqual(governance.areas[0].summary, 'No live signals yet for Finance & Accounting.')
})

test('rule-less custom areas stay no-signal: values fill but do not count as signal', () => {
  const customArea = createArea({ id: 'custom-area', label: 'Custom Area' })
  const snapshots = buildAreaMetricSnapshots({
    schema: { areas: [customArea] },
    userMetrics: { custom_metric: 7 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })

  // available for cross-area evaluation…
  assert.deepEqual(snapshots[0].metricsByKey, { custom_metric: 7 })
  // …but no borrowed-signal green lamp for an area that cannot evaluate anything
  assert.equal(snapshots[0].coverage, 0)
  assert.deepEqual(snapshots[0].sources, [])
})

test('areas only count manual signal for metrics they own', () => {
  const snapshots = buildAreaMetricSnapshots({
    schema: { areas: [getArea('finance-accounting')] },
    userMetrics: { runway_months: 4, csat: 57 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })

  // csat fills for compound evaluation but is not finance's own signal
  assert.equal(snapshots[0].metricsByKey.csat, 57)
  assert.deepEqual(snapshots[0].metrics, [{ key: 'runway_months', value: 4, source: 'manual' }])
  assert.equal(snapshots[0].coverage, 1)
})

test('simulation metric overrides still do not count as coverage', () => {
  const snapshots = buildAreaMetricSnapshots({
    schema: { areas: [getArea('finance-accounting')] },
    metricOverrides: { runway_months: 4 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })

  assert.equal(snapshots[0].coverage, 0)
  assert.deepEqual(snapshots[0].sources, [])
  assert.deepEqual(snapshots[0].metrics, [])
  assert.equal(snapshots[0].metricsByKey.runway_months, 4)
})

test('catalog threshold rationale populates rootCause without duplicating impact', () => {
  const governance = runGovernanceMonitoring({
    schema: { areas: [getArea('finance-accounting')] },
    userMetrics: { runway_months: 4 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })
  const finding = governance.findings.find((item) => item.id === 'finance-accounting:runway-bad')

  assert.equal(finding?.rootCause, 'Below six months, financial fragility becomes an existential operating issue.')
  assert.equal(finding?.impact, null)
})

test('compound rules carry authored because and if-ignored text end to end', () => {
  const governance = runGovernanceMonitoring({
    schema: {
      industryId: 'saas-software',
      areas: [getArea('finance-accounting')],
    },
    userMetrics: { churn_rate: 6, runway_months: 8 },
    checkedAt: '2026-07-14T12:00:00.000Z',
  })
  const finding = governance.compoundFindings.find((item) => item.id === 'compound:cash-fragility')
  const risk = governance.risks.find((item) => item.title === 'Cash fragility')

  assert.deepEqual({
    rootCause: finding?.rootCause,
    impact: finding?.impact,
    riskRootCause: risk?.rootCause,
    riskImpact: risk?.impact,
  }, {
    rootCause: 'The likely driver is revenue retention weakening while the cash buffer is already narrow.',
    impact: 'If ignored, the company has less room to fix churn before cash decisions become reactive.',
    riskRootCause: 'The likely driver is revenue retention weakening while the cash buffer is already narrow.',
    riskImpact: 'If ignored, the company has less room to fix churn before cash decisions become reactive.',
  })
})

test('authored compound texts are complete and avoid forbidden verdict phrasing', () => {
  const allCompoundRules = [
    ...COMPOUND_RULES_SAAS,
    ...COMPOUND_RULES_ECOMMERCE,
    ...COMPOUND_RULES_MANUFACTURING,
    ...COMPOUND_RULES_PS,
    ...COMPOUND_RULES_MARKETPLACE,
    ...COMPOUND_RULES_CONSUMER_APP,
    ...COMPOUND_RULES_HOSPITALITY,
    ...COMPOUND_RULES_HEALTHCARE,
    ...COMPOUND_RULES_WHOLESALE,
    ...COMPOUND_RULES_LOGISTICS,
    ...COMPOUND_RULES_CONSTRUCTION,
    ...COMPOUND_RULES_REAL_ESTATE,
  ]

  assert.equal(allCompoundRules.length, 21)
  for (const rule of allCompoundRules) {
    assert.ok(rule.rootCause?.trim(), `${rule.id} missing rootCause`)
    assert.ok(rule.impact?.trim(), `${rule.id} missing impact`)
    assert.notEqual(rule.rootCause, rule.impact, `${rule.id} duplicated rootCause and impact`)
    assert.doesNotMatch(rule.rootCause, /is caused by|root cause/i)
    assert.doesNotMatch(rule.impact, /is caused by|root cause/i)
  }
})

test('deterministic governance text avoids verdict language', () => {
  const normalized = normalizeEcommerce('shopify', shopifyFixture)
  const governance = runGovernanceMonitoring({ normalized, schema, checkedAt: shopifyFixture.as_of })
  const forbidden = /is caused by|root cause/i
  const texts = [
    ...governance.findings.flatMap((finding) => [finding.summary, finding.rootCause]),
    ...governance.risks.flatMap((risk) => [risk.description, risk.rootCause]),
    ...governance.compoundFindings.flatMap((finding) => [finding.summary, finding.rootCause]),
  ].filter(Boolean)

  for (const text of texts) {
    assert.equal(forbidden.test(text), false, text)
  }
})

test('unknown industry gets no SaaS compound fallback', () => {
  const governance = runGovernanceMonitoring({
    brain: { industry: 'bakery' },
    schema: null,
    metricOverrides: {
      churn_rate: 6,
      runway_months: 5,
      open_deals: 0,
      lead_volume: 0,
      goal_progress: 20,
      followthrough_rate: 20,
    },
  })

  assert.deepEqual(governance.compoundFindings, [])
})

test('entity findings survive when the user has no schema and no matching area', () => {
  // Regression: applyAdditionalFindingsToAreas used to silently drop findings whose
  // areaId (revenue-sales) was not in the snapshot area list. A no-schema Shopify user
  // must still receive the SKU-spike detection.
  const normalized = {
    provider: 'shopify',
    metrics: [{ key: 'refund_rate', value: 13.33, source: 'shopify' }],
    entities: [{ type: 'sku', id: 'ATLAS-HOODIE-M', label: 'Atlas Hoodie M', refund_count: 6, refund_rate: 60, orders_count: 10 }],
  }
  const governance = runGovernanceMonitoring({ normalized })

  assert.equal(governance.findings.some((f) => f.id === 'entity:sku-refund-spike'), true,
    'SKU spike finding must appear in findings without a schema')
  assert.equal(governance.findings.some((f) => f.id === 'entity:ecommerce-refund-rate-high'), true,
    'store refund-rate finding must appear in findings without a schema')
  assert.equal(governance.risks.some((r) => r.title === 'SKU-level refund spike'), true,
    'SKU spike must reach the legacy risks array that feeds alerts')
})
