import { getActionForArtifact } from '../actions/registry.js'

const SOURCE_LABELS = {
  sentinel: 'Sentinel',
  counsel: 'Counsel',
  foresight: 'Foresight',
  audit: 'Audit',
}

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low']

function compactText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim()
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function reportEvidence(report) {
  const critical = list(report?.domains).filter((domain) => domain?.status === 'critical')
  const needsWork = list(report?.domains).filter((domain) => domain?.status === 'needs_work')
  return [...critical, ...needsWork].slice(0, 3).map((domain) => ({
    label: domain.name || 'Finding',
    value: domain.finding || domain.action || domain.status,
  }))
}

function reportPriority(report) {
  if (list(report?.domains).some((domain) => domain?.status === 'critical')) return 'critical'
  if (report?.ranking_logic?.urgency === 'immediate') return 'high'
  return 'medium'
}

export function selectReportArtifactType(report) {
  const mode = String(report?.conversation_mode || '').toUpperCase()
  const text = JSON.stringify({
    headline: report?.headline,
    actions: report?.priority_actions,
    plan: report?.delivery_plan,
    fixes: report?.non_ai_fixes,
    domains: report?.domains,
  }).toLowerCase()
  if (/outreach|follow[- ]?up|prospect|renewal email|customer email|email sequence/.test(text)) return 'EMAIL'
  if (mode === 'EXECUTION' || /team|handoff|rollout|announcement|communicat|ownership/.test(text)) return 'TEAM_BRIEF'
  return 'ACTION_PLAN'
}

function reportArtifact(report) {
  const actions = list(report?.priority_actions)
  const ranked = list(report?.ranked_path).map((item) => item?.move).filter(Boolean)
  const delivery = list(report?.delivery_plan).map((item) => item?.action).filter(Boolean)
  const steps = [...actions, ...ranked, ...delivery].filter(Boolean).slice(0, 6)
  const topAction = steps[0] || report?.goal_gap_analysis?.fastest_path || report?.honest_truth || report?.headline
  const blockers = list(report?.non_ai_fixes).map((item) => item?.issue).filter(Boolean).slice(0, 3)
  const assumptions = list(report?.timeline_reality?.assumptions)

  const type = selectReportArtifactType(report)
  const common = {
    type,
    title: compactText(report?.headline, 'Execute the recommended business move').slice(0, 180),
    summary: compactText(topAction, 'Turn the report recommendation into an owned execution plan.'),
  }

  if (type === 'EMAIL') {
    return {
      ...common,
      sections: [
        { label: 'Subject Line', content: compactText(report?.headline, 'Next steps on the recommended business move') },
        { label: 'Body', content: `Hello,\n\n${compactText(report?.execution_context || report?.overall_verdict || report?.honest_truth)}\n\nThe next step is: ${compactText(topAction)}\n\nPlease reply with availability and ownership so we can move this forward.` },
        { label: 'CTA', content: 'Confirm the owner and next working session.' },
      ],
    }
  }

  if (type === 'TEAM_BRIEF') {
    return {
      ...common,
      sections: [
        { label: 'Situation', content: compactText(report?.execution_context || report?.overall_verdict || report?.honest_truth) },
        { label: 'What Needs to Change', content: steps.length ? steps.map((step, index) => `${index + 1}. ${step}`).join('\n') : compactText(topAction) },
        { label: 'Who Owns What', content: list(report?.domains).slice(0, 3).map((domain) => `${domain.name}: ${domain.action || 'Confirm an accountable owner.'}`).join('\n') || 'Confirm an accountable owner for each step before execution.' },
        { label: 'Success Criteria', content: compactText(report?.timeline_reality?.honest_take || report?.what_to_expect || 'Review progress against the stated objective at the next operating check-in.') },
      ],
    }
  }

  return {
    ...common,
    sections: [
      { label: 'Objective', content: compactText(report?.business_state?.goal_state || report?.goal_gap_analysis?.goal || topAction) },
      { label: 'Recommended steps', content: steps.length ? steps.map((step, index) => `${index + 1}. ${step}`).join('\n') : compactText(topAction) },
      { label: 'Evidence', content: reportEvidence(report).map((item) => `${item.label}: ${item.value}`).join('\n') || compactText(report?.overall_verdict || report?.execution_context || report?.honest_truth) },
      { label: 'Risks and assumptions', content: [...blockers, ...assumptions].join('\n') || 'Confirm ownership, timing, and destination before approval.' },
    ],
  }
}

function foresightEvidence(result) {
  return list(result?.comparisonRows).slice(0, 4).map((row) => ({
    label: row.label || row.key || 'Metric',
    value: row.scenario == null
      ? 'Directional impact'
      : `${row.baseline ?? '—'} → ${row.scenario}${row.unit === 'percent' ? '%' : ''}`,
  }))
}

function foresightArtifact(result) {
  const brief = result?.decisionBrief || {}
  const affectedAreas = list(brief.affectedAreas)
  return {
    type: 'ACTION_PLAN',
    title: compactText(result?.title || result?.scenario?.title, 'Activate the selected Foresight scenario').slice(0, 180),
    summary: compactText(brief.verdict, 'Prepare the selected scenario for controlled execution.'),
    sections: [
      { label: 'Objective', content: compactText(brief.verdict || result?.title) },
      { label: 'Expected upside', content: list(brief.upside).join('\n') || 'No quantified upside crossed the evidence threshold.' },
      { label: 'Downside and risk', content: list(brief.downside).join('\n') || 'No material downside crossed the evidence threshold.' },
      { label: 'Affected areas', content: affectedAreas.join('\n') || 'Only the selected metric is directly modeled.' },
      { label: 'Assumptions', content: list(brief.assumptions).join('\n') || 'Review the modeled assumptions before approval.' },
      { label: 'Missing data', content: list(brief.missingData).join('\n') || 'No material data gap was identified for this run.' },
    ],
  }
}

function metadataForArtifact({ sourceType, sourceId, sourceLabel, artifact, objective, evidence, priority, owner, destination, approvalBoundary, sourceCreatedAt }) {
  const defaultDestination = artifact?.type === 'TEAM_BRIEF'
    ? 'Slack team channel'
    : artifact?.type === 'EMAIL'
      ? 'Gmail draft'
      : 'Notion workspace'
  const defaultBoundary = artifact?.type === 'TEAM_BRIEF'
    ? 'Posts the approved brief to the selected Slack channel. No other operational change is made.'
    : artifact?.type === 'EMAIL'
      ? 'Creates an approved Gmail draft. It does not send the email automatically.'
      : 'Creates the approved action plan in Notion. No operational or financial changes are made automatically.'
  return {
    sourceType,
    sourceId: String(sourceId || ''),
    sourceLabel: sourceLabel || SOURCE_LABELS[sourceType] || 'SelfAudit',
    objective: compactText(objective || artifact?.summary || artifact?.title),
    evidence: list(evidence),
    priority: PRIORITY_ORDER.includes(priority) ? priority : 'medium',
    owner: owner || 'Operator',
    destination: destination || defaultDestination,
    approvalBoundary: approvalBoundary || defaultBoundary,
    artifacts: [{ type: artifact?.type || 'ACTION_PLAN', title: artifact?.title || 'Action plan' }],
    sourceCreatedAt: sourceCreatedAt || new Date().toISOString(),
  }
}

async function insertArtifact(supabase, userId, reportId, artifact) {
  const { data, error } = await supabase.from('artifacts').insert({
    user_id: userId,
    report_id: reportId || null,
    artifact_type: artifact.type,
    title: artifact.title,
    summary: artifact.summary,
    artifact_data: artifact,
    updated_at: new Date().toISOString(),
  }).select('*').single()
  if (error) throw error
  return data
}

async function findExisting(supabase, userId, fingerprint) {
  const { data } = await supabase
    .from('pending_actions')
    .select('*')
    .eq('user_id', userId)
    .eq('finding_fingerprint', fingerprint)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

async function insertPackage(supabase, userId, artifactRow, artifact, metadata) {
  const action = getActionForArtifact(artifact.type)
  if (!action) throw new Error(`No governed action is registered for ${artifact.type}`)
  const fingerprint = `dispatch:${metadata.sourceType}:${metadata.sourceId}`
  const existing = await findExisting(supabase, userId, fingerprint)
  if (existing) return { action: existing, artifact: artifactRow, created: false }

  const stagedArgs = {
    ...action.buildArgs(artifact, {}),
    __dispatch: metadata,
  }
  const core = {
    user_id: userId,
    artifact_id: artifactRow.id,
    action_type: artifact.type,
    tool_slug: action.tool,
    connector: action.connector,
    title: artifact.title,
    staged_args: stagedArgs,
    finding_snapshot: {
      areaId: metadata.sourceType,
      title: artifact.title,
      severity: metadata.priority,
      status: metadata.priority === 'critical' ? 'bad' : 'watch',
      recommendation: metadata.objective,
    },
    finding_fingerprint: fingerprint,
    status: 'pending',
    updated_at: new Date().toISOString(),
  }
  const enriched = {
    ...core,
    source_type: metadata.sourceType,
    source_id: metadata.sourceId,
    source_label: metadata.sourceLabel,
    objective: metadata.objective,
    evidence_snapshot: metadata.evidence,
    owner_label: metadata.owner,
    destination_label: metadata.destination,
    approval_boundary: metadata.approvalBoundary,
    artifact_bundle: metadata.artifacts,
    priority: metadata.priority,
    source_created_at: metadata.sourceCreatedAt,
  }

  let result = await supabase.from('pending_actions').insert(enriched).select('*').single()
  if (result.error && /column .* does not exist|schema cache/i.test(result.error.message || '')) {
    result = await supabase.from('pending_actions').insert(core).select('*').single()
  }
  if (result.error) throw result.error
  return { action: result.data, artifact: artifactRow, created: true }
}

export async function stageReportDispatchPackage(supabase, userId, reportId, report, sourceType = 'audit') {
  const mode = String(report?.conversation_mode || 'DIAGNOSTIC').toUpperCase()
  if (!['DIAGNOSTIC', 'GOAL_GAP', 'EXECUTION'].includes(mode)) return null
  const normalizedSource = sourceType === 'counsel' ? 'counsel' : 'audit'
  const existing = await findExisting(supabase, userId, `dispatch:${normalizedSource}:${reportId}`)
  if (existing) return { action: existing, artifact: null, created: false }
  const artifact = reportArtifact(report)
  const metadata = metadataForArtifact({
    sourceType: normalizedSource,
    sourceId: reportId,
    artifact,
    objective: artifact.summary,
    evidence: reportEvidence(report),
    priority: reportPriority(report),
    owner: report?.domains?.[0]?.name || 'Business owner',
    sourceCreatedAt: new Date().toISOString(),
  })
  const artifactRow = await insertArtifact(supabase, userId, reportId, artifact)
  return insertPackage(supabase, userId, artifactRow, artifact, metadata)
}

export async function stageForesightDispatchPackage(supabase, userId, sourceId, result) {
  const existing = await findExisting(supabase, userId, `dispatch:foresight:${sourceId}`)
  if (existing) return { action: existing, artifact: null, created: false }
  const artifact = foresightArtifact(result)
  const metadata = metadataForArtifact({
    sourceType: 'foresight',
    sourceId,
    artifact,
    objective: artifact.summary,
    evidence: foresightEvidence(result),
    priority: result?.decisionBrief?.tone === 'negative' ? 'high' : 'medium',
    owner: result?.decisionBrief?.affectedAreas?.[0] || 'Strategy owner',
    sourceCreatedAt: new Date().toISOString(),
  })
  const artifactRow = await insertArtifact(supabase, userId, null, artifact)
  return insertPackage(supabase, userId, artifactRow, artifact, metadata)
}

export function normalizeDispatchPackage(action, artifact = null) {
  const embedded = action?.staged_args?.__dispatch || {}
  return {
    ...action,
    source_type: action?.source_type || embedded.sourceType || (action?.source_health_check_id ? 'sentinel' : 'audit'),
    source_id: action?.source_id || embedded.sourceId || action?.source_health_check_id || null,
    source_label: action?.source_label || embedded.sourceLabel || SOURCE_LABELS[action?.source_type] || 'SelfAudit',
    objective: action?.objective || embedded.objective || action?.finding_snapshot?.recommendation || artifact?.summary || action?.title,
    evidence_snapshot: list(action?.evidence_snapshot).length ? action.evidence_snapshot : list(embedded.evidence),
    owner_label: action?.owner_label || embedded.owner || 'Operator',
    destination_label: action?.destination_label || embedded.destination || `${String(action?.connector || 'workspace').toUpperCase()} destination`,
    approval_boundary: action?.approval_boundary || embedded.approvalBoundary || `Runs ${action?.tool_slug || 'the prepared connector action'} only after approval.`,
    artifact_bundle: list(action?.artifact_bundle).length ? action.artifact_bundle : (list(embedded.artifacts).length ? embedded.artifacts : artifact ? [{ type: artifact.artifact_type, title: artifact.title }] : []),
    priority: action?.priority || embedded.priority || action?.finding_snapshot?.severity || 'medium',
    source_created_at: action?.source_created_at || embedded.sourceCreatedAt || action?.created_at,
    artifact: artifact || null,
  }
}
