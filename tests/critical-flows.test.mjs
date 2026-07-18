import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import { getCheckoutAppUrl, getCheckoutCancelUrl, getCheckoutPriceId, getCheckoutSuccessUrl } from '../api/lib/checkout.js'
import { isAuthorisedCronRequest } from '../api/lib/cron-auth.js'
import { validateSaveReportPayload } from '../api/lib/save-report-validation.js'
import { buildAccountDataExport, buildAccountExportFilename, sanitizeIntegrationsForExport } from '../api/lib/data-governance.js'
import { isIntelligencePlan, normalizePlan, VALID_PLANS } from '../api/lib/plans.js'
import { evaluateOperationalArea, getOperationalAreaModule } from '../api/lib/governance/area-registry.js'
import { normalizeGovernanceMetrics, evaluateThresholdRule } from '../api/lib/governance/shared/contracts.js'
import { buildAreaMetricSnapshots } from '../api/lib/governance/metric-snapshots.js'
import { runGovernanceMonitoring } from '../api/lib/governance/monitoring.js'
import { buildGovernanceAdvice } from '../api/lib/governance/advice.js'
import { enrichGovernanceWithAI } from '../api/lib/governance/ai-advisor.js'
import { isConversational } from '../api/lib/agent/planner.js'
import { buildCounselSources, canOfferCounselReport, normalizeCounselResult } from '../api/lib/agent/counsel.js'
import { normalizeDispatchPackage, selectReportArtifactType } from '../api/lib/dispatch/packages.js'
import { withoutInternalActionMetadata } from '../api/lib/actions/execute-action.js'

test('every explicitly configured Vercel function exists', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  for (const functionPath of Object.keys(config.functions || {})) {
    assert.equal(existsSync(new URL(`../${functionPath}`, import.meta.url)), true, `${functionPath} is missing`)
  }
})

test('checkout only accepts current plan names', () => {
  const env = {
    APP_URL: 'https://tryselfaudit.com',
    STRIPE_PRICE_PROFESSIONAL: 'price_professional',
    STRIPE_PRICE_ENTERPRISE: 'price_enterprise',
  }

  assert.equal(getCheckoutPriceId('professional', env), 'price_professional')
  assert.equal(getCheckoutPriceId('enterprise', env), 'price_enterprise')
  assert.equal(getCheckoutPriceId('legacy-tier', env), 'price_professional')
  assert.equal(getCheckoutAppUrl({ APP_URL: 'https://tryselfaudit.com' }), 'https://tryselfaudit.com')
  assert.equal(
    getCheckoutSuccessUrl('enterprise', env),
    'https://tryselfaudit.com/#billing?checkout=success&plan=enterprise&session_id={CHECKOUT_SESSION_ID}',
  )
  assert.equal(
    getCheckoutCancelUrl('legacy-tier', env),
    'https://tryselfaudit.com/#signup?plan=professional',
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

test('save-report validation guards required payload', () => {
  assert.equal(validateSaveReportPayload({}), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1' }), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1', report: 'bad' }), 'Missing userId or report')
  assert.equal(validateSaveReportPayload({ userId: 'u1', report: {} }), null)
})

test('Counsel investigates business questions even when they sound conversational', () => {
  assert.equal(isConversational('Hey'), true)
  assert.equal(isConversational('Thanks, that makes sense'), true)
  assert.equal(isConversational('Can you show me our churn?'), false)
  assert.equal(isConversational('How can you help with pipeline conversion?'), false)
})

test('Counsel normalizes model output before it reaches the interface', () => {
  const result = normalizeCounselResult({
    answer: '  Revenue is slowing.  ',
    severity_score: 99,
    fix_priority: 'whenever',
    execution_plan: ['Call the five stalled deals', null, 'Review qualification'],
    confidence: 'certain',
  })

  assert.equal(result.answer, 'Revenue is slowing.')
  assert.equal(result.severity_score, 10)
  assert.equal(result.fix_priority, 'monitor')
  assert.deepEqual(result.execution_plan, ['Call the five stalled deals', 'Review qualification'])
  assert.equal(result.confidence, 'low')
})

test('Counsel exposes traceable Sentinel source details and only offers grounded reports', () => {
  const sources = buildCounselSources({
    sources_used: ['company_brain', 'risk_alerts'],
    structured_context: {
      risk_alerts: [{
        id: 'alert-1',
        title: 'Runway is critical',
        metric_key: 'runway_months',
        metric_value: 5,
        threshold_value: 6,
        comparator: 'lt',
        evidence_snapshot: { checked_at: '2026-07-17T12:00:00.000Z' },
      }],
    },
  })

  const sentinel = sources.find((source) => source.key === 'risk_alerts')
  assert.equal(sentinel.label, 'Sentinel alerts')
  assert.equal(sentinel.freshness, '2026-07-17T12:00:00.000Z')
  assert.equal(sentinel.records[0].metric_value, 5)

  const grounded = normalizeCounselResult({
    answer: 'Runway needs attention.',
    evidence: ['Runway is 5 months', 'Threshold is 6 months'],
    confidence: 'high',
  })
  assert.equal(canOfferCounselReport(grounded, sources, 2), true)
  assert.equal(canOfferCounselReport({ ...grounded, confidence: 'low' }, sources, 2), false)
})

test('Dispatch selects a governed artifact from report intent', () => {
  assert.equal(selectReportArtifactType({
    conversation_mode: 'EXECUTION',
    headline: 'Roll out the new customer handoff',
    delivery_plan: [{ action: 'Brief the customer success team' }],
  }), 'TEAM_BRIEF')

  assert.equal(selectReportArtifactType({
    conversation_mode: 'DIAGNOSTIC',
    headline: 'Renewal follow-up is inconsistent',
    priority_actions: ['Create a renewal email sequence'],
  }), 'EMAIL')

  assert.equal(selectReportArtifactType({
    conversation_mode: 'GOAL_GAP',
    headline: 'Runway is below the operating threshold',
    priority_actions: ['Reduce non-essential spend'],
  }), 'ACTION_PLAN')
})

test('Dispatch normalizes legacy staged actions without losing approval context', () => {
  const normalized = normalizeDispatchPackage({
    id: 'action-1',
    action_type: 'TEAM_BRIEF',
    connector: 'slack',
    title: 'Prepare customer response',
    status: 'pending',
    staged_args: {
      channel: '',
      __dispatch: {
        sourceType: 'sentinel',
        sourceId: 'alert-1',
        objective: 'Coordinate the support response.',
        evidence: [{ label: 'CSAT', value: 72 }],
        approvalBoundary: 'Posts only the approved brief.',
      },
    },
  })

  assert.equal(normalized.source_type, 'sentinel')
  assert.equal(normalized.objective, 'Coordinate the support response.')
  assert.equal(normalized.evidence_snapshot[0].value, 72)
  assert.equal(normalized.approval_boundary, 'Posts only the approved brief.')
})

test('Dispatch never forwards internal provenance metadata to connector tools', () => {
  assert.deepEqual(withoutInternalActionMetadata({
    recipient_email: 'owner@example.com',
    subject: 'Operating update',
    __dispatch: { sourceType: 'counsel', evidence: [{ label: 'Churn', value: '7%' }] },
  }), {
    recipient_email: 'owner@example.com',
    subject: 'Operating update',
  })
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

test('governance metric snapshots derive area metrics from existing business sources', () => {
  const snapshots = buildAreaMetricSnapshots({
    brain: {
      goal_score: 42,
      top_priorities: ['Fix onboarding', 'Tighten pricing'],
      repeated_blockers: ['handoff gap'],
      watchouts: ['thin team'],
      recent_sessions: [
        { status: 'open' },
        { status: 'resolved' },
      ],
    },
    brief: {
      financial: {
        mrr: 12000,
        churn: 4.5,
        burn_rate: 9000,
        runway: 8,
        ltv: 3600,
        cac: 1800,
      },
      operational: {
        sales_cycle: 55,
        support_tickets_per_week: 12,
      },
    },
    normalized: {
      metrics: [
        { key: 'open_pipeline_value', value: 75000 },
        { key: 'open_deals', value: 2 },
        { key: 'leads', value: 20 },
        { key: 'sqls', value: 2 },
      ],
    },
  })

  const finance = snapshots.find((snapshot) => snapshot.areaId === 'finance-accounting')
  const marketing = snapshots.find((snapshot) => snapshot.areaId === 'marketing-sales')
  const management = snapshots.find((snapshot) => snapshot.areaId === 'management-strategy')

  assert.equal(finance.metricsByKey.runway_months, 8)
  assert.equal(finance.metricsByKey.ltv_cac_ratio, 2)
  assert.equal(marketing.metricsByKey.open_deals, 2)
  assert.equal(marketing.metricsByKey.stage_conversion, 10)
  assert.equal(management.metricsByKey.goal_progress, 42)
  assert.equal(management.metricsByKey.followthrough_rate, 50)
})

test('governance monitoring turns snapshots into area statuses and findings', () => {
  const governance = runGovernanceMonitoring({
    brain: {
      goal_score: 35,
      top_priorities: ['Fix onboarding', 'Tighten pricing', 'Hire AE', 'Fix handoff', 'Reduce churn', 'Improve reporting'],
      repeated_blockers: ['handoff gap', 'owner unclear', 'approval delay'],
      watchouts: ['thin team'],
      recent_sessions: [
        { status: 'open' },
        { status: 'unknown (not followed up)' },
        { status: 'resolved' },
      ],
    },
    brief: {
      financial: {
        churn: 6,
        burn_rate: 12000,
        runway: 5,
        ltv: 900,
        cac: 1200,
      },
      operational: {
        sales_cycle: 60,
      },
    },
    normalized: {
      metrics: [
        { key: 'open_deals', value: 2 },
        { key: 'leads', value: 12 },
        { key: 'sqls', value: 1 },
      ],
    },
  })

  assert.equal(governance.summary.areasWithSignals >= 3, true)
  assert.equal(governance.summary.areasNeedingAttention >= 2, true)
  assert.ok(governance.risks.some((risk) => risk.category === 'finance-accounting'))
  assert.ok(governance.risks.some((risk) => risk.category === 'management-strategy'))
  assert.ok(governance.areas.some((area) => area.areaId === 'marketing-sales' && area.status !== 'good'))
})

test('governance advice turns findings into alert candidates and action guidance', () => {
  const monitoring = runGovernanceMonitoring({
    brain: {
      goal_score: 35,
      top_priorities: ['Fix onboarding', 'Tighten pricing', 'Hire AE', 'Fix handoff', 'Reduce churn', 'Improve reporting'],
      repeated_blockers: ['handoff gap', 'owner unclear', 'approval delay'],
      watchouts: ['thin team'],
      recent_sessions: [
        { status: 'open' },
        { status: 'unknown (not followed up)' },
        { status: 'resolved' },
      ],
    },
    brief: {
      financial: {
        churn: 6,
        burn_rate: 12000,
        runway: 5,
        ltv: 900,
        cac: 1200,
      },
      operational: {
        sales_cycle: 60,
      },
    },
    normalized: {
      metrics: [
        { key: 'open_deals', value: 2 },
        { key: 'leads', value: 12 },
        { key: 'sqls', value: 1 },
      ],
    },
  })

  const advice = buildGovernanceAdvice(monitoring)
  assert.ok(advice.summary.length > 0)
  assert.ok(advice.diagnoses.length > 0)
  assert.ok(advice.recommended_actions.length > 0)
  assert.ok(advice.alert_candidates.some((item) => item.category === 'finance-accounting'))
  assert.ok(advice.alert_candidates.some((item) => item.category === 'marketing-sales'))
})

test('governance AI advisor enriches deterministic diagnoses when Claude returns valid JSON', async () => {
  const monitoring = runGovernanceMonitoring({
    brain: {
      active_goal: 'Reach profitability',
      goal_score: 35,
      top_priorities: ['Fix onboarding', 'Tighten pricing', 'Reduce churn'],
      repeated_blockers: ['handoff gap', 'owner unclear'],
      watchouts: ['thin team'],
    },
    brief: {
      financial: {
        churn: 6,
        runway: 5,
        ltv: 900,
        cac: 1200,
      },
    },
    normalized: {
      metrics: [
        { key: 'open_deals', value: 2 },
        { key: 'leads', value: 12 },
        { key: 'sqls', value: 1 },
      ],
    },
  })

  const deterministicAdvice = buildGovernanceAdvice(monitoring)
  const originalFetch = global.fetch
  process.env.CLAUDE_API_KEY = 'test-key'

  global.fetch = async () => ({
    ok: true,
    async json() {
      return {
        content: [{
          text: JSON.stringify({
            summary: 'Finance pressure is the main threat right now because cash and revenue efficiency are both weak.',
            diagnoses: deterministicAdvice.diagnoses.map((item) => ({
              areaId: item.areaId,
              title: item.title,
              summary: `AI summary for ${item.title}`,
              rootCause: `AI root cause for ${item.title}`,
              impact: `AI impact for ${item.title}`,
              recommendation: `AI recommendation for ${item.title}`,
            })),
            recommended_actions: ['Protect cash now', 'Rebuild pipeline quality'],
            alert_candidates: deterministicAdvice.alert_candidates.map((item) => ({
              category: item.category,
              title: item.title,
              description: `AI description for ${item.title}`,
              recommended_action: `AI action for ${item.title}`,
            })),
          }),
        }],
      }
    },
  })

  try {
    const advice = await enrichGovernanceWithAI({
      governance: monitoring,
      brain: { active_goal: 'Reach profitability', goal_score: 35 },
      intelligenceBrief: { financial: { churn: 6, runway: 5 } },
      deterministicAdvice,
    })

    assert.equal(advice.summary, 'Finance pressure is the main threat right now because cash and revenue efficiency are both weak.')
    assert.match(advice.diagnoses[0].rootCause, /^AI root cause/)
    assert.match(advice.diagnoses[0].recommendation, /^AI recommendation/)
    assert.deepEqual(advice.recommended_actions, ['Protect cash now', 'Rebuild pipeline quality'])
    assert.match(advice.alert_candidates[0].description, /^AI description/)
  } finally {
    global.fetch = originalFetch
    delete process.env.CLAUDE_API_KEY
  }
})

test('governance AI advisor falls back to deterministic output when Claude fails', async () => {
  const monitoring = runGovernanceMonitoring({
    brain: {
      goal_score: 35,
      top_priorities: ['Fix onboarding', 'Tighten pricing', 'Reduce churn'],
      repeated_blockers: ['handoff gap', 'owner unclear'],
    },
    brief: {
      financial: {
        churn: 6,
        runway: 5,
      },
    },
    normalized: {
      metrics: [
        { key: 'open_deals', value: 2 },
        { key: 'leads', value: 12 },
        { key: 'sqls', value: 1 },
      ],
    },
  })

  const deterministicAdvice = buildGovernanceAdvice(monitoring)
  const originalFetch = global.fetch
  process.env.CLAUDE_API_KEY = 'test-key'

  global.fetch = async () => {
    throw new Error('network down')
  }

  try {
    const advice = await enrichGovernanceWithAI({
      governance: monitoring,
      brain: {},
      intelligenceBrief: {},
      deterministicAdvice,
    })

    assert.deepEqual(advice, deterministicAdvice)
  } finally {
    global.fetch = originalFetch
    delete process.env.CLAUDE_API_KEY
  }
})
