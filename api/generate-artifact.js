import { createClient } from '@supabase/supabase-js'
import { validateUserToken } from './lib/auth.js'
import { ARTIFACT_SYSTEM_PROMPT, ARTIFACT_TYPE_INSTRUCTIONS, ARTIFACT_JSON_SCHEMA } from './lib/artifacts/instructions.js'

const CLAUDE_API = 'https://api.anthropic.com/v1/messages'

const ARTIFACT_TYPES = ['ACTION_PLAN', 'SOP', 'PROCESS_CHANGE', 'PRICING_MODEL', 'HIRING_BRIEF', 'EMAIL', 'INVESTOR_UPDATE', 'TEAM_BRIEF']

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function recommend(report) {
  const recommended = []
  const domains = report.domains ?? []
  const nonAiFixes = report.non_ai_fixes ?? []
  const goalMode = report.goal_gap_analysis != null
  const missingCaps = (report.missing_capabilities ?? []).length > 0

  const allText = [
    report.honest_truth ?? '',
    ...(report.priority_actions ?? []),
    ...nonAiFixes.map(f => `${f.issue} ${f.fix}`),
    ...domains.map(d => `${d.name} ${d.finding ?? ''} ${d.action ?? ''}`),
    ...(report.missing_capabilities ?? []),
    report.goal_gap_analysis?.gap ?? '',
    report.goal_gap_analysis?.fastest_path ?? '',
  ].join(' ').toLowerCase()

  if (goalMode && missingCaps) recommended.push('ACTION_PLAN')

  const hasProcessIssues = nonAiFixes.some(f =>
    /process|workflow|system|procedure|manual|repetitive|inconsistent/i.test(`${f.issue} ${f.fix}`)
  ) || /broken process|process gap|no process|process doesn't|no clear process/i.test(allText)
  if (hasProcessIssues) {
    if (!recommended.includes('SOP')) recommended.push('SOP')
    if (!recommended.includes('PROCESS_CHANGE')) recommended.push('PROCESS_CHANGE')
  }

  const pricingDomain = domains.find(d => /pricing|price|revenue|monetiz/i.test(d.name))
  if (pricingDomain && ['needs_work', 'critical'].includes(pricingDomain.status)) {
    if (!recommended.includes('PRICING_MODEL')) recommended.push('PRICING_MODEL')
  } else if (/undercharg|pricing model|price point|pricing structure|wrong price/i.test(allText)) {
    if (!recommended.includes('PRICING_MODEL')) recommended.push('PRICING_MODEL')
  }

  if (/hiring|hire\b|headcount|team gap|missing role|need.*hire|no.*head of|lacks a/i.test(allText)) {
    if (!recommended.includes('HIRING_BRIEF')) recommended.push('HIRING_BRIEF')
  }

  if (/sales outreach|cold email|follow.?up|prospect|lead generation|outreach/i.test(allText)) {
    if (!recommended.includes('EMAIL')) recommended.push('EMAIL')
  }

  if (recommended.length === 0) {
    recommended.push('ACTION_PLAN')
    const topDomain = domains.find(d => d.status === 'critical') ?? domains.find(d => d.status === 'needs_work')
    if (topDomain && /process|ops|operation|delivery|service|fulfil/i.test(topDomain.name)) {
      recommended.push('SOP')
    } else {
      recommended.push('PROCESS_CHANGE')
    }
  }

  if (!recommended.includes('ACTION_PLAN')) recommended.unshift('ACTION_PLAN')

  // INVESTOR_UPDATE: runway tight, churn bad, or goal feasibility is tight/unrealistic
  const financeWords = /runway|churn|burn|cash|ltv|unit economics/i
  if (financeWords.test(allText) || report.timeline_feasibility?.startsWith('tight') || report.timeline_feasibility?.startsWith('unrealistic')) {
    if (!recommended.includes('INVESTOR_UPDATE')) recommended.push('INVESTOR_UPDATE')
  }

  // TEAM_BRIEF: multiple critical domains, or execution/management issues
  const criticalDomains = domains.filter(d => d.status === 'critical')
  if (criticalDomains.length >= 2 || /team|management|execution|follow.?through|ownership/i.test(allText)) {
    if (!recommended.includes('TEAM_BRIEF')) recommended.push('TEAM_BRIEF')
  }

  return {
    recommended: [...new Set(recommended)].slice(0, 3),
    available: ARTIFACT_TYPES,
  }
}


// Strip report fields not needed for a given artifact type to keep the prompt tight.
function compactReportForArtifact(report, artifactType) {
  const always = {
    headline: report.headline,
    honest_truth: report.honest_truth,
    priority_actions: report.priority_actions,
    domains: report.domains,
    conversation_mode: report.conversation_mode,
  }
  switch (artifactType) {
    case 'ACTION_PLAN':
      return { ...always, goal_gap_analysis: report.goal_gap_analysis, missing_capabilities: report.missing_capabilities, forward_trajectory: report.forward_trajectory, timeline_feasibility: report.timeline_feasibility }
    case 'EMAIL':
      return { ...always, non_ai_fixes: report.non_ai_fixes, goal_gap_analysis: report.goal_gap_analysis }
    case 'SOP':
    case 'PROCESS_CHANGE':
      return { ...always, non_ai_fixes: report.non_ai_fixes, overall_verdict: report.overall_verdict }
    case 'HIRING_BRIEF':
      return { ...always, missing_capabilities: report.missing_capabilities, non_ai_fixes: report.non_ai_fixes }
    case 'PRICING_MODEL':
      return { ...always, non_ai_fixes: report.non_ai_fixes, goal_gap_analysis: report.goal_gap_analysis }
    case 'INVESTOR_UPDATE':
      return { ...always, forward_trajectory: report.forward_trajectory, goal_gap_analysis: report.goal_gap_analysis, timeline_feasibility: report.timeline_feasibility, overall_verdict: report.overall_verdict }
    case 'TEAM_BRIEF':
      return { ...always, non_ai_fixes: report.non_ai_fixes, overall_verdict: report.overall_verdict, missing_capabilities: report.missing_capabilities }
    default:
      return report
  }
}

function buildUserPrompt(artifactType, report, userInfo, brain) {
  const goalContext = userInfo.goalMode
    ? `\nGoal: ${userInfo.goal || 'not specified'}\nGoal timeline: ${userInfo.goalTimeline || 'not specified'}`
    : ''

  const brainContext = brain ? `
BUSINESS CONTEXT (from memory — use to make the artifact specific to this business):
Core offer: ${brain.core_offer || 'not specified'}
Target customer: ${brain.target_customer || 'not specified'}
Active goal: ${brain.active_goal || 'none'}
Known blockers: ${(brain.repeated_blockers || []).join(', ') || 'none'}
` : ''

  return `Generate a ${artifactType} artifact based on this audit report.

USER CONTEXT:
Name: ${userInfo.name || '[user]'}
Industry: ${userInfo.industry || 'not specified'}
Domain: ${userInfo.domain || 'not specified'}${goalContext}
${brainContext}
${ARTIFACT_TYPE_INSTRUCTIONS[artifactType]}

AUDIT REPORT:
${JSON.stringify(compactReportForArtifact(report, artifactType), null, 2)}
${ARTIFACT_JSON_SCHEMA(artifactType)}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { artifactType, report, userInfo, reportId, userId, brain } = req.body
  if (!report) {
    return res.status(400).json({ error: 'Missing report' })
  }

  // userId is optional (anonymous report viewers). If present, validate ownership.
  if (userId && !await validateUserToken(req, res, userId)) return

  const recommendations = recommend(report)

  if (!artifactType) {
    return res.status(200).json({ recommendations })
  }

  if (!ARTIFACT_TYPES.includes(artifactType)) {
    return res.status(400).json({ error: 'Invalid artifact type' })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key not configured' })
  }

  try {
    const response = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: ARTIFACT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserPrompt(artifactType, report, userInfo, brain) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(response.status).json({ error: err.error?.message || 'Claude API error' })
    }

    const data = await response.json()
    const text = data.content[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    const artifact = JSON.parse(clean)

    let savedArtifact = null

    if (userId && reportId) {
      try {
        const { data, error } = await supabase
          .from('artifacts')
          .insert({
            user_id: userId,
            report_id: reportId,
            artifact_type: artifactType,
            title: artifact.title ?? null,
            summary: artifact.summary ?? null,
            artifact_data: artifact,
            updated_at: new Date().toISOString(),
          })
          .select('id, created_at')
          .single()

        if (error) throw error
        savedArtifact = data
      } catch (saveErr) {
        console.warn('[generate-artifact] artifact save failed:', saveErr.message)
      }
    }

    return res.status(200).json({ artifact, recommendations, savedArtifact })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
