# WP6 — Cleanup batch: secrets hygiene, broken test, config debt (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (ESM, Vercel serverless `api/`, Vite + React `src/`,
Supabase). WP1–WP5 are merged. This package is pure hygiene — no behavior changes to
detection, alerts, or normalization. Four independent tasks; do them as four separate
commits-worth of changes so each is reviewable.

## Task 1 — Secrets hygiene (highest priority)

`VITE_`-prefixed env vars are bundled into the client build by Vite — a secret with that
prefix ships to every browser. Server code currently falls back to them.

1. Audit every file under `api/` for env fallbacks of the form
   `process.env.X || process.env.VITE_X` (known offenders: `CLAUDE_API_KEY ||
   VITE_CLAUDE_API_KEY`, `SUPABASE_URL || VITE_SUPABASE_URL`, service role keys).
2. Rules:
   - **Secrets** (API keys, service-role keys, webhook secrets): remove the `VITE_`
     fallback entirely. Server reads the unprefixed name only.
   - **Public values** (`SUPABASE_URL`, publishable/anon keys): the `VITE_` fallback may
     stay — they are public by design. Leave those alone.
3. `src/components/ConfigScreen.jsx` references `VITE_CLAUDE_API_KEY` and
   `VITE_RESEND_API_KEY` in copy/logic — report exactly what that screen does with them
   (report only — do NOT modify frontend behavior in this package).
4. Output a table: every env var read anywhere in `api/`, its files, secret vs public,
   changed or left.
   Do NOT print, log, or echo any env var VALUE anywhere — names only.

## Task 2 — Fix the broken critical-flows test

`npm run test:critical` fails: `tests/critical-flows.test.mjs` imports
`signOAuthState, verifyOAuthState` from `api/lib/connectors/oauth-state.js`, which was
deleted in commit `54494ab` ("Phase 2: Wire all connector endpoints and frontend to
Composio").

1. Inspect git history (`git show 54494ab --stat`, and the file's content before deletion
   via `git show 54494ab^:api/lib/connectors/oauth-state.js`) to understand what it did and
   whether ANY runtime code still needs it (grep the whole repo).
2. If nothing at runtime uses OAuth state anymore (Composio owns OAuth now): delete the
   stale test cases for it from `critical-flows.test.mjs` — do not delete unrelated test
   cases in that file.
3. If something still needs it: restore the module from git history instead, and say so.
4. `npm run test:critical` must pass at the end. Report which path you took and why.

## Task 3 — Centralize the model pin

`api/lib/governance/ai-advisor.js` hardcodes `const MODEL = 'claude-sonnet-4-6'`. Grep for
every hardcoded Anthropic model id across `api/`.

1. Create `api/lib/model-config.js` exporting a single `CLAUDE_MODEL` constant, readable
   from `process.env.CLAUDE_MODEL` with the current hardcoded value as default.
2. Point every call site at it. Do not change which model is used (same default) — this is
   a plumbing change only.

## Task 4 — Migrations own all tables

`api/agent-query.js` (and possibly others) carries "run this SQL once in the dashboard"
comment blocks (e.g. `agent_findings`). Tables must live in `supabase/migrations/`.

1. Grep `api/` for `create table` inside comments. For each: create a proper timestamped
   migration with `create table if not exists` + the repo's standard RLS pattern
   (idempotent policy guards, user-select + service-role-manage policies — see
   `supabase/migrations/20260710000000_connector_entity_history.sql` for style).
2. Since these tables already exist in production, `if not exists` everywhere; policies
   guarded by pg_policies existence checks. Nothing destructive.
3. Replace the SQL comment blocks in the JS files with a one-line pointer to the migration
   file.

## Hard boundaries

- NO changes to: detection logic, thresholds, alert dedup, normalizers' emitted values,
  graph artifacts, AI prompts, frontend behavior (`src/` code untouched — ConfigScreen is
  report-only), auth flow logic, billing.
- Migrations: additive/idempotent only. Nothing dropped.
- No new dependencies. Never output the value of any secret.
- Nothing outside the repo (the EI folder remains forbidden).

## Acceptance criteria

- `grep -rn "VITE_CLAUDE_API_KEY\|VITE_.*SERVICE_ROLE\|VITE_STRIPE_SECRET\|VITE_RESEND" api/`
  returns nothing.
- `npm run test:critical` passes. All WP1–WP5 suites still pass. `npm run build` passes.
- `grep -rn "claude-sonnet\|claude-opus\|claude-haiku" api/ --include="*.js" | grep -v model-config`
  returns nothing.
- No `create table` SQL remains in JS comments under `api/`.

When done, output: the env-var table (names only), which path Task 2 took and why, files
changed per task, and all test results.
