export function validateSaveReportPayload(body) {
  if (!body?.userId) return 'Missing userId or report'
  if (!body?.report || typeof body.report !== 'object') return 'Missing userId or report'
  return null
}
