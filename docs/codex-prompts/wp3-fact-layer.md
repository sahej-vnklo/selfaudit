# WP3 — Auditable fact layer + reproducible alert evidence (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (Vercel serverless `api/`, ESM, Supabase, migrations
under `supabase/migrations/`). WP1 (graph loader) and WP2 (Ecommerce normalizer +
metric-definitions) are merged. WP3's goal: **every alert must be reproducible from stored
facts** — never dependent on re-fetching a third-party API that may have changed. Partial
infrastructure already exists; extend it, don't duplicate it.

## Context — read these first

- `api/cron/sync-connectors.js` — daily sync; already writes `connector_metric_history`
  (one row per metric per sync) and raw rows to `connector_deals` / `connector_subscriptions`
  / `connector_tickets` via `extractRawRows`.
- `api/lib/monitoring/risk-alerts.js` — alert persistence + dedup. `buildEvidence()` today
  stores only `{ raw (string), rootCause, impact, recurring }` — not reproducible.
- `api/lib/governance/monitoring.js` — findings carry `metricKey, metricValue, comparator,
  thresholdValue, severity, areaId`; `runGovernanceMonitoring` also returns
  `causalDiagnosis` (chains of metric edges).
- `api/lib/monitoring/health-check.js` — orchestrates: normalize → governance monitoring →
  AI enrich → risk alerts. See how `risks` flow into alert creation.
- `api/lib/connectors/normalize.js` — WP2's `normalizeEcommerce` emits `entities`
  (SKU rollups: `{ type:'sku', id, label, refund_count, refund_rate, orders_count }`).
- `supabase/migrations/` — follow the existing migration style (RLS enabled, user-scoped
  select policy, service-role manage policy; see `20260618000000_connector_snapshots.sql`).

## Tasks

0. **Small fix from WP2 QC — AOV to gross basis.** Industry convention (and Shopify's own
   admin) computes AOV on gross order value, and our number must match what the merchant
   sees. In `metric-definitions.js` change the `aov` definition to gross (numerator: gross
   item revenue before refunds), update `normalizeEcommerce` accordingly, and update the
   fixture test literal (gross 3650 ÷ 60 = 60.83, comment showing arithmetic).
   `daily_revenue` stays net — unchanged.

1. **Migration: `connector_entity_history`** (new table, timestamped filename per repo
   convention, e.g. `2026XXXX_connector_entity_history.sql`):
   ```sql
   create table connector_entity_history (
     id           uuid primary key default gen_random_uuid(),
     user_id      uuid not null references auth.users(id) on delete cascade,
     provider     text not null,
     entity_type  text not null,            -- 'sku' | 'deal' | ...
     entity_id    text not null,
     label        text,
     dimensions   jsonb,                    -- the full entity rollup payload
     synced_at    timestamptz not null,
     created_at   timestamptz not null default now()
   );
   ```
   Index on `(user_id, entity_type, entity_id, synced_at desc)`. RLS per existing pattern.

2. **Migration: additive columns on existing history + alerts** (one migration, ALTER ADD
   only, nothing dropped or renamed):
   - `connector_metric_history`: add `normalizer_version text`, `window_days integer`.
   - `risk_alerts`: add `evidence_snapshot jsonb`, add `detection_version text`.

3. **Version constants.** In `api/lib/connectors/normalize.js` export
   `NORMALIZER_VERSION = '2.0.0'` (WP2 introduced Ecommerce; bump on future semantic
   changes). In `api/lib/governance/monitoring.js` export `DETECTION_VERSION = '1.0.0'`.

4. **Sync write path** (`sync-connectors.js` → `writeHistoryRows`):
   - Write `normalized.entities` into `connector_entity_history` (all entity types, not
     just SKU — the `dimensions` jsonb carries the whole object).
   - Stamp `normalizer_version` and (when the metric's definition in
     `metric-definitions.js` has `window_days`) `window_days` onto metric history rows.
   - Failures stay non-blocking, matching the existing swallow-and-warn style.

5. **Reproducible alert evidence** (`risk-alerts.js` + its caller in `health-check.js`):
   Extend alert creation so each NEW alert stores `evidence_snapshot`:
   ```js
   {
     finding: { metricKey, metricValue, comparator, thresholdValue, areaId },
     related_metrics: [ { key, value, capturedAt } ],   // the governance snapshot values used this run
     causal_chain: [ ... ],       // the causalDiagnosis chains touching this metric, if any
     concept_context: [ ... ],    // from getExplanationContext(metricKey) — edge ids + sources only
     normalizer_version, detection_version,
     checked_at,
   }
   ```
   Build it from data already in memory during the health check — do NOT add new API
   calls. For compound/cross-area findings include the contributing metric values. For
   AI-originated alert candidates (source `governance-ai`), snapshot whatever finding
   fields exist and mark `origin: 'ai-enrichment'`. Dedup behavior for existing open
   alerts stays exactly as-is (do not update evidence on dedup hits).

6. **Tests** (`api/lib/monitoring/__tests__/` or existing test location):
   - evidence snapshot builder: given a fake finding + snapshot set + causal diagnosis,
     produces the expected structure (hand-written literal expectation).
   - AOV fix: fixture test now expects 60.83 and passes.
   - version constants exported and stamped (unit-test the row-builder functions, not the
     DB writes; extract row-building into pure functions if needed to make them testable).
   - WP1 graph tests and WP2 connector tests still pass.

## Hard boundaries

- Migrations: ADD ONLY. No ALTER of existing columns, no DROP, no data backfill.
- Do NOT touch: auth, billing/checkout/stripe-webhook, report generation, frontend `src/`,
  `dist/`, graph JSON artifacts, the EI folder (outside repo, forbidden), existing alert
  dedup logic.
- Do NOT add new third-party API calls anywhere.
- No new dependencies.

## Acceptance criteria

- All test suites pass: `node --test api/lib/governance/graph/__tests__/*.test.js
  api/lib/connectors/__tests__/*.test.js api/lib/monitoring/__tests__/*.test.js`.
- New migrations are syntactically valid SQL and follow the repo's RLS pattern.
- `git diff --stat` touches only: the two new migrations, `normalize.js`,
  `metric-definitions.js`, the WP2 fixture test, `sync-connectors.js`, `risk-alerts.js`,
  `monitoring.js` (version constant + any pure-function extraction), `health-check.js`
  (evidence wiring), and new tests.
- An alert created after this change can be fully explained from `evidence_snapshot` +
  `connector_metric_history` + `connector_entity_history` without any live API call.

When done, output: files changed, test results, one example `evidence_snapshot` JSON from
the test run, and any decision not covered by this spec (list it — never decide silently).
