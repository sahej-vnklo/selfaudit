import test from 'node:test'
import assert from 'node:assert/strict'
import { getOwnedForesightRun, persistForesightRun } from '../foresight-runs.js'

test('persisted runs store the server result and provenance timestamp', async () => {
  let inserted = null
  const supabase = {
    from(table) {
      assert.equal(table, 'foresight_runs')
      return {
        async insert(payload) {
          inserted = payload
          return { error: null }
        },
      }
    },
  }
  await persistForesightRun(supabase, 'user-1', 'What if burn falls by 15%?', {
    id: 'run-1',
    modelVersion: 'foresight-v2.0.0',
    status: 'modeled',
    scenario: { metricKey: 'burn_rate' },
    baseline: { facts: [{ observedAt: '2026-07-25T10:00:00.000Z' }] },
    createdAt: '2026-07-26T00:00:00.000Z',
  })
  assert.equal(inserted.user_id, 'user-1')
  assert.equal(inserted.baseline_observed_at, '2026-07-25T10:00:00.000Z')
  assert.equal(inserted.question, 'What if burn falls by 15%?')
})

test('owned run lookup scopes by both run and user', async () => {
  const filters = []
  const query = {
    select() { return this },
    eq(key, value) { filters.push([key, value]); return this },
    async maybeSingle() { return { data: { id: 'run-1' }, error: null } },
  }
  const supabase = { from: () => query }
  const run = await getOwnedForesightRun(supabase, 'user-1', 'run-1')
  assert.deepEqual(filters, [['id', 'run-1'], ['user_id', 'user-1']])
  assert.equal(run.id, 'run-1')
})
