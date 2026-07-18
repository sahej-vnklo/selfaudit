import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FONT_FLOOR_PX = 13
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')
const SOURCE_EXTENSIONS = new Set(['.css', '.js', '.jsx'])

const checks = [
  /font-size\s*:\s*(\d*\.?\d+)(px|rem)/gi,
  /fontSize\s*:\s*['"]?(\d*\.?\d+)(px|rem)?['"]?/g,
  /\.style\.fontSize\s*=\s*['"](\d*\.?\d+)(px|rem)['"]/g,
  /font(?:Size|-size)\s*=\s*['"](\d*\.?\d+)(px|rem)?['"]/g,
  /font\s*:\s*[^;\n]*?\s(\d*\.?\d+)px(?=[\s/])/gi,
]

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : []
  })
}

function toPixels(value, unit = 'px') {
  return Number(value) * (unit === 'rem' ? 16 : 1)
}

const violations = []

for (const file of walk(ROOT)) {
  const relativePath = path.relative(path.dirname(ROOT), file)
  const lines = fs.readFileSync(file, 'utf8').split('\n')

  lines.forEach((line, index) => {
    // Small letters rendered inside connector SVG marks are artwork, not UI copy.
    if (line.includes('<text')) return

    for (const pattern of checks) {
      pattern.lastIndex = 0
      for (const match of line.matchAll(pattern)) {
        const pixels = toPixels(match[1], match[2])
        if (pixels < FONT_FLOOR_PX) {
          violations.push(`${relativePath}:${index + 1} uses ${pixels}px`)
        }
      }
    }
  })
}

if (violations.length > 0) {
  console.error(`Typography floor failed. UI text must be at least ${FONT_FLOOR_PX}px:`)
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`Typography floor passed: no UI text below ${FONT_FLOOR_PX}px.`)
