export function getMissingRequiredInputs(action, args = {}) {
  const requiredFields = Array.isArray(action?.requiresInput) ? action.requiresInput : []
  return requiredFields.filter((field) => {
    const value = args?.[field.key]
    if (Array.isArray(value)) return value.length === 0
    return value == null || String(value).trim() === ''
  })
}
