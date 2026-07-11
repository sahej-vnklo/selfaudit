import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

import { mergeNormalized, normalizeConnectorData, normalizeEcommerce } from '../api/lib/connectors/normalize.js'

const here = dirname(fileURLToPath(import.meta.url))

function usage() {
  console.error('Usage: npm run seed:demo -- --user <uuid>')
  console.error('Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

function getUserId(argv) {
  const index = argv.indexOf('--user')
  return index === -1 ? null : argv[index + 1]
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(here, relativePath), 'utf8'))
}

const userId = getUserId(process.argv.slice(2))
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!userId || !supabaseUrl || !serviceRoleKey) {
  usage()
  process.exit(1)
}

const [storeFixture, ticketFixture] = await Promise.all([
  readJson('fixtures/demo-store.json'),
  readJson('fixtures/demo-tickets.json'),
])

const ecommerce = normalizeEcommerce('shopify', storeFixture)
const support = normalizeConnectorData({
  gorgias: {
    provider: 'gorgias',
    category: 'support',
    fetched_at: ticketFixture.as_of,
    data: ticketFixture,
  },
})
const normalized = mergeNormalized(ecommerce, support)
const fetchedAt = new Date().toISOString()

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
const { error } = await supabase
  .from('connector_snapshots')
  .upsert({
    user_id: userId,
    providers: ['shopify', 'gorgias'],
    normalized_data: normalized,
    fetched_at: fetchedAt,
    updated_at: fetchedAt,
  }, { onConflict: 'user_id' })

if (error) {
  console.error(`Demo seed failed: ${error.message}`)
  process.exit(1)
}

const atlas = normalized.entities.find((entity) => entity.type === 'sku' && entity.id === 'ATLAS-HOODIE-M')
const ticketCount = normalized.entities.filter((entity) => entity.type === 'ticket').length

console.log(`Seeded demo connector snapshot for user ${userId}.`)
console.log(`Providers: shopify, gorgias.`)
console.log(`Demo story: ${atlas?.id ?? 'ATLAS-HOODIE-M'} refund rate ${atlas?.refund_rate ?? 'unknown'}%, ${ticketCount} structured support tickets.`)
console.log('Next step: trigger a health check via api/run-health-check or the admin trigger, then open the Cockpit.')
