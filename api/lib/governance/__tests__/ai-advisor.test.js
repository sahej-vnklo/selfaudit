import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSystemPrompt, buildUserMessage } from '../ai-advisor.js'

test('AI advisor prompt includes causal context sources and discipline rules', () => {
  const governance = {
    findings: [
      {
        id: 'entity:ecommerce-refund-rate-high',
        status: 'bad',
        severity: 'high',
        areaId: 'revenue-sales',
        metricKey: 'refund_rate',
        metricValue: 13.33,
        comparator: 'gt',
        thresholdValue: 10,
        title: 'Refund rate is critically high',
        summary: 'Refund rate is 13.33% over the trailing 30 days.',
      },
    ],
    areas: [
      {
        areaId: 'revenue-sales',
        label: 'Revenue & Sales',
        status: 'bad',
        coverage: 1,
        findings: [
          {
            id: 'entity:ecommerce-refund-rate-high',
            status: 'bad',
            severity: 'high',
            metricKey: 'refund_rate',
            metricValue: 13.33,
            comparator: 'gt',
            thresholdValue: 10,
            title: 'Refund rate is critically high',
            summary: 'Refund rate is 13.33% over the trailing 30 days.',
          },
        ],
      },
    ],
    summary: { totalAreas: 1 },
  }
  const deterministicAdvice = {
    summary: 'Refunds need review.',
    diagnoses: [
      {
        areaId: 'revenue-sales',
        title: 'Refund rate is critically high',
        summary: 'Refund rate is 13.33% over the trailing 30 days.',
        rootCause: 'The likely driver is a product or fulfilment issue.',
        impact: 'Refunds pressure margin.',
        recommendation: 'Review the refunded products.',
        evidence: 'refund_rate gt 10 (observed 13.33)',
      },
    ],
    recommended_actions: ['Review the refunded products.'],
    alert_candidates: [],
  }

  const systemPrompt = buildSystemPrompt()
  const userMessage = buildUserMessage({ governance, deterministicAdvice })

  assert.match(systemPrompt, /likely driver/)
  assert.match(systemPrompt, /Never cite a source not present in causal_context/)
  assert.match(systemPrompt, /State what remains unverified/)
  assert.match(userMessage, /"causal_context"/)
  assert.match(userMessage, /"refund_rate"/)
  assert.match(userMessage, /Hopp & Spearman, Factory Physics/)
  assert.doesNotMatch(userMessage, /made-up source/i)
})
