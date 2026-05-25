import test from 'node:test'
import assert from 'node:assert/strict'

import { getCheckoutAppUrl, getCheckoutCancelUrl, getCheckoutPriceId, getCheckoutSuccessUrl, normalizeCheckoutTier } from '../api/lib/checkout.js'
import { isAuthorisedCronRequest } from '../api/lib/cron-auth.js'
import { signOAuthState, verifyOAuthState } from '../api/lib/connectors/oauth-state.js'
import { validateSaveReportPayload } from '../api/lib/save-report-validation.js'
import { buildAccountDataExport, buildAccountExportFilename, sanitizeIntegrationsForExport } from '../api/lib/data-governance.js'
import { isIntelligencePlan, normalizePlan, VALID_PLANS } from '../api/lib/plans.js'
import { evaluateOperationalArea, getOperationalAreaModule } from '../api/lib/governance/area-registry.js'
import { normalizeGovernanceMetrics, evaluateThresholdRule } from '../api/lib/governance/shared/contracts.js'

test('checkout only accepts current plan names', () => {
  const env = {
    APP_URL: 'https://tryselfaudit.com',
    STRIPE_PRICE_FOUNDATION: 'price_foundation',
    STRIPE_PRICE_INTELLIGENCE: 'price_intelligence',
  }

  assert.equal(normalizeCheckoutTier('foundation'), 'foundation')
  assert.equal(normalizeCheckoutTier('intelligence'), 'intelligence')
  assert.equal(normalizeCheckoutTier('legacy-tier'), 'legacy-tier')
  assert.equal(getCheckoutPriceId('foundation', env), 'price_foundation')
  assert.equal(getCheckoutPriceId('intelligence', env), 'price_intelligence')
  assert.equal(getCheckoutPriceId('legacy-tier', env), null)
  assert.equal(getCheckoutAppUrl({ APP_URL: 'https://tryselfaudit.com' }), 'https://tryselfaudit.com')
  assert.equal(
    getCheckoutSuccessUrl('intelligence', env),
    'https://tryselfaudit.com/#billing?checkout=success&plan=intelligence&session_id={CHECKOUT_SESSION_ID}',
  )
  assert.equal(
    getCheckoutCancelUrl('intelligence', env),
    'https://tryselfaudit.com/#signup?plan=intelligence',
  )
})

test('plan helper normalizes access to foundation or intelligence only', () => {
  assert.deepEqual(VALID_PLANS, ['foundation', 'intelligence'])
  assert.equal(normalizePlan('foundation'), 'foundation')
  assert.equal(normalizePlan('intelligence'), 'intelligence')
  assert.equal(normalizePlan('legacy-tier'), 'foundation')
  assert.equal(isIntelligencePlan('intelligence'), true)
  assert.equal(isIntelligencePlan('foundation'), false)
})

test('cron auth accepts header and query secret', () => {
  const secret = 'top-secret'
  assert.equal(
    isAuthorisedCronRequest({ headers: { authorization: `Bearer ${secret}` }, query: {} }, secret),
    true,
  )
  assert.equal(
    isAuthorisedCronRequest({ headers: {}, query: { secret } }, secret),
    true,
  )
  assert.equal(
    isAuthorisedCronRequest({ headers: {}, url: `https://tryselfaudit.com/api/cron/test?secret=${secret}` }, secret),
    true,
  )
  assert.equal(
    isAuthorisedCronRequest({ headers: { authorization: 'Bearer wrong' }, query: {} }, secret),
    false,
  )
})

test('oauth state verification rejects tampering and expiry', () => {
  const secret = 'oauth-secret'
  const payload = {
    provider: 'hubspot',
    userId: 'user-123',
    nonce: 'abc',
    ts: Date.now(),
  }
  const signed = signOAuthState(payload, secret)

  assert.deepEqual(verifyOAuthState(signed, secret), payload)
  assert.equal(verifyOAuthState(`${signed}oops`, secret), null)

  const expired = signOAuthState({ ...payload, ts: Date.now() - (11 * 60 * 1000) }, secret)
  assert.equal(verifyOAuthState(expired, secret), null)
})

test('save-report validation guards required payload', () => {
  assert.equal(validateSaveReportPayload({}), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1' }), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1', report: 'bad' }), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1', report: {} }), null)
})

test('data export sanitizes connector secrets and builds stable filenames', () => {
  const integrations = {
    hubspot: {
      access_token: 'secret',
      refresh_token: 'refresh',
      connected_at: '2026-05-22T00:00:00.000Z',
      last_synced_at: '2026-05-22T01:00:00.000Z',
      expires_at: 123,
      scopes: ['crm.objects.contacts.read'],
    },
  }

  const sanitized = sanitizeIntegrationsForExport(integrations)
  assert.deepEqual(sanitized.hubspot, {
    connected_at: '2026-05-22T00:00:00.000Z',
    last_synced_at: '2026-05-22T01:00:00.000Z',
    expires_at: 123,
    scopes: ['crm.objects.contacts.read'],
    has_access_token: true,
    has_refresh_token: true,
  })

  const bundle = buildAccountDataExport({ profile: { id: 'u1' } })
  assert.equal(bundle.format_version, 1)
  assert.equal(bundle.data.profile.id, 'u1')
  assert.match(buildAccountExportFilename('sahej@vnklo.com'), /^sahej-vnklo-com-account-data\.json$/)
})

test('governance metrics normalize from arrays and threshold rules evaluate cleanly', () => {
  const metrics = normalizeGovernanceMetrics([
    { key: 'runway_months', value: 5 },
    { key: 'churn_rate', value: 6 },
  ])

  assert.deepEqual(metrics, {
    runway_months: 5,
    churn_rate: 6,
  })

  const finding = evaluateThresholdRule(
    {
      id: 'test-runway',
      type: 'threshold',
      metricKey: 'runway_months',
      comparator: 'lt',
      value: 6,
      status: 'bad',
      severity: 'critical',
      title: 'Runway is critical',
      summary: 'The company has less than six months of runway remaining.',
      recommendation: 'Cut non-essential spend immediately.',
      rationale: 'Short runway removes optionality.',
    },
    metrics,
  )

  assert.equal(finding?.id, 'test-runway')
  assert.equal(finding?.metricValue, 5)
  assert.equal(finding?.status, 'bad')
  assert.equal(finding?.severity, 'critical')
})

test('governance area registry exposes modular area logic and default findings', () => {
  const financeArea = getOperationalAreaModule('finance-accounting')
  assert.equal(financeArea?.id, 'finance-accounting')
  assert.ok(financeArea?.businessLogic?.objective)
  assert.ok(financeArea?.defaultRulePack?.defaults?.length > 0)

  const financeFindings = evaluateOperationalArea('finance-accounting', {
    churn_rate: 6,
    runway_months: 5,
    ltv_cac_ratio: 0.9,
  })

  assert.ok(financeFindings.some((finding) => finding.id === 'finance-accounting:churn-bad'))
  assert.ok(financeFindings.some((finding) => finding.id === 'finance-accounting:runway-bad'))
  assert.ok(financeFindings.some((finding) => finding.id === 'finance-accounting:ltv-cac-bad'))

  const managementFindings = evaluateOperationalArea('management-strategy', {
    goal_progress: 45,
    priority_backlog: 6,
    repeated_blockers: 3,
    followthrough_rate: 55,
  })

  assert.ok(managementFindings.some((finding) => finding.id === 'management-strategy:goal-progress-watch'))
  assert.ok(managementFindings.some((finding) => finding.id === 'management-strategy:priority-backlog-bad'))
  assert.ok(managementFindings.some((finding) => finding.id === 'management-strategy:followthrough-bad'))
})
