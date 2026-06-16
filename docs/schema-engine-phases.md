# SelfAudit — Build Phases (Path A)

## What SelfAudit is

Free AI business audit product evolving into an ops-governance + advisor
platform. Solo founder (Sahej Singh / VNKLO). Stack: Vite/React frontend,
Vercel serverless API, Supabase (Postgres + auth), Claude as the AI brain.
Repo: github.com/sahej-vnklo/selfaudit. Production: tryselfaudit.com.
Supabase project ID: spinhhzpboojmpndaxue.

## Build workflow

Claude writes implementation prompt → Sahej pastes to Codex → Codex implements
→ Claude does QC on every file → Claude runs Supabase migration (has MCP access)
→ push to main. Never skip the QC step.

## Recommended sequence (from image)

Phases 1–4 complete. Remaining order: **8 → 9 → 6 → 12 → 10 → 13 → 5 → 11 → 7**

---

## Phase 1 — Schema Engine ✅ COMPLETE

**What was built:**

- **Blueprint catalog** (`api/lib/blueprint/`) — declarative catalog of 8
  industries, 8 operational areas, 19 unit types, 5 interfaces (Observable,
  Actionable, Sourced, Linked, Financial), shared properties. Modelled on
  Palantir's ontology layer (Objects, Properties, Links, Interfaces).

- **Declarative metric mappings** — replaced 4 hardcoded `buildMetrics` JS
  functions with `metricMappings` config on each area. A generic two-pass
  mapper resolves `safeNumber`, `arrayLength`, `computed`, `divide` transforms
  at runtime.

- **Schema registry** (`schema-registry.js`) — Supabase-backed, userId-keyed
  `company_schemas` table. One row per user, upserted on onboarding.

- **Schema builder** (`schema-builder.js`) — `buildSchemaFromSelections`,
  `previewSchemaSelections`, `getSelectableAreas`.

- **Causal engine** (`causal-engine.js`) — 35-edge universal business
  relationship graph. `traceRootCause`, `projectDownstream`,
  `buildCompoundDiagnosis`. Core product IP.

- **Monitoring engine refactor** — `monitoring.js` now accepts `schema` param.
  Compound rules are schema-driven, fall back to SaaS defaults when no schema.
  Returns `causalDiagnosis` on every health check run.

- **Migration live** — `company_schemas` table in Supabase with RLS.

**Key files:**
- `api/lib/blueprint/` — full catalog (industries, areas, units, interfaces)
- `api/lib/blueprint/schema-registry.js` — Supabase persistence
- `api/lib/blueprint/schema-builder.js` — schema assembly
- `api/lib/governance/causal-engine.js` — causal graph
- `api/lib/governance/monitoring.js` — schema-driven engine
- `api/lib/monitoring/health-check.js` — wired entry point

---

## Phase 2 — Integration Layer ✅ COMPLETE

**What was built:**

Replaced manual per-connector files with universal Composio integration.
Adding a new connector = edit one config file only. Zero per-connector code.

- `api/lib/connectors/composio.js` — Composio REST client. Exports:
  `getComposioAuthLink`, `getComposioConnections`, `getComposioConnectionMap`,
  `executeTool`, `disconnectComposio`. **`executeTool(userId, toolSlug, args)`
  is the execution primitive for Phase 4.**
- `api/lib/connectors/tool-registry.js` — pure config mapping connector → Composio
  tool slugs. Add new connector here only, never elsewhere.
- `api/lib/connectors/data-fetcher.js` — generic `fetchAllConnectedData(userId)`.
  Never has per-connector code.
- `api/lib/connectors/normalize.js` — category-based normalization (crm, revenue,
  comms, support, docs, email).
- `api/connect/composio/auth.js` — POST `/api/connect/composio/auth` → OAuth URL
- `api/connect/composio/disconnect.js` — POST `/api/connect/composio/disconnect`
- `api/connect/composio/preview.js` — POST `/api/connect/composio/preview`
- `api/connectors.js` — reads from Composio connection map

Supported connectors: hubspot, stripe, gmail, googledrive, slack, notion, zendesk.
Note: registry uses `id: 'googledrive'` (not `google_drive`).

Composio auth configs (in composio.js):
- hubspot: `ac_EkxRNE1G9SPd`, stripe: `ac_UH0RLsixqvUv`, gmail: `ac_1PmkB8cE4IBB`
- slack: `ac_X3Kpp80Or5bc`, notion: `ac_RGheSSclY33r`, zendesk: `ac_hsgqzfVxc3r2`
- googledrive: `ac_sxu9Kz2eLUcM`

---

## Phase 3 — Intelligence Loop ✅ COMPLETE

**What was built:**

- **Health check writeback** (`api/lib/monitoring/writeback.js`) —
  `writeHealthCheckToIntelligenceBrief(userId, healthResult, supabase)`.
  Called non-blocking at end of every health check. Writes causal_summary,
  root_candidates, top_diagnoses, advice_summary, health_score,
  last_health_check_at to `intelligence_brief.context`. Merges connector metrics
  (mrr, arr, churn_rate, active_customers, open_deals) into
  `intelligence_brief.operational`. Non-blocking — wrapped in try/catch.

- **Schema onboarding UI** — `src/components/SchemaSetup.jsx` — 3-step modal
  (industry picker → area multi-select → success). Shows on dashboard home
  when user has no schema. `api/schema-setup.js` GET/POST endpoint.
  Industry aliases in `INDUSTRY_ALIASES` map UI IDs to catalog IDs.
  4 placeholder areas (product-engineering, people-hr, operations,
  legal-compliance) built as empty custom areas via `createArea({...})`.

- **Connection-aware cron scheduling** (`api/cron/business-health.js`) —
  users with Composio connections run every cron cycle; users without
  connections run every other 12-hour slot using
  `Math.floor(Date.now() / (12 * 60 * 60 * 1000)) % 2`.

- **Dashboard wiring** — Dashboard.jsx fetches `/api/schema-setup?userId=...`
  on load, shows SchemaSetup overlay when `hasSchema === false`.

**Blueprint catalog handover doc:** `docs/blueprint-catalog-handover.md` —
4 placeholder areas need full metric/rule definitions before units step can
be built. Waiting on Sahej to provide the full industry/area/unit list.

---

## Phase 4 — Execution Queue ✅ COMPLETE

**What was built:**

Turns SelfAudit from a diagnosis engine into an operating agent with approval.
Artifacts from ExecutionPanel can be pushed into Gmail, Slack, Notion via
Composio — with mandatory human approval at every step. Nothing auto-executes.

**Four-layer separation (never blur):**
1. Findings → from health check
2. Artifacts → Claude-written outputs (ExecutionPanel, already existed)
3. Action Candidates → what to DO with an artifact (Phase 4 adds this)
4. Executions → what actually happened (Phase 4 adds this)

**Backend files:**
- `api/lib/actions/registry.js` — pure JS config. Maps artifact types to
  Composio tools. EMAIL→GMAIL_CREATE_EMAIL_DRAFT, TEAM_BRIEF→SLACK_SEND_MESSAGE,
  ACTION_PLAN→NOTION_CREATE_NOTION_PAGE. Add new action types here only.
- `api/lib/actions/execute-action.js` — validates connector is connected,
  merges staged + final args, calls `executeTool`.
- `api/lib/actions/validate.js` — checks required user inputs before execution.
- `api/actions/stage.js` — POST `/api/actions/stage` — queues an artifact as
  a pending action. Never calls executeTool.
- `api/actions/feed.js` — GET `/api/actions/feed?userId=xxx` — returns
  `{ pending: [...], history: [...] }` for dashboard home.
- `api/actions/execute.js` — POST `/api/actions/execute` — body:
  `{ userId, pendingActionId, decision: 'approve'|'dismiss', finalArgs }`.
  Loads from queue → validates connector → calls Composio → logs result.

**Supabase tables (live in production):**
- `artifacts` — generated artifacts (user_id, report_id, artifact_type, title,
  summary, artifact_data). Type constraint: 8 artifact types only.
- `pending_actions` — action candidates awaiting approval (user_id, artifact_id,
  action_type, tool_slug, connector, title, staged_args, status). Status values:
  pending → executing → executed | dismissed | failed.
- `execution_log` — permanent log of every approve/dismiss/fail (user_id,
  pending_action_id, action_type, tool_slug, connector, final_args, outcome,
  composio_result, error_message, executed_at).

**Frontend additions:**
- ExecutionPanel.jsx — push button appears after generating EMAIL, TEAM_BRIEF,
  or ACTION_PLAN artifact. Stages action, shows "Queued ✓".
- Dashboard.jsx home — Action Queue block (pending actions with input +
  approve/dismiss) and Execution History block (last 5 executions).
  Both hidden until there is data.

**Verified Composio slugs (exact, confirmed via API):**
```
GMAIL_CREATE_EMAIL_DRAFT   → params: recipient_email, subject, body, is_html
SLACK_SEND_MESSAGE         → params: channel, markdown_text, fallback_text
NOTION_CREATE_NOTION_PAGE  → params: parent_id, title, markdown
```

**Also shipped with Phase 4:**
- Cockpit right panel — "AT A GLANCE" now always visible. No longer swaps to
  calibration panel when data exists. Empty state: "Connect your tools to see
  live metrics here."
- Oversight page — `ThresholdEditorPanel` (monitoring standards / threshold
  overrides) now rendered at bottom of Oversight section. Was built but never
  placed anywhere before.

---

## Phase 5 — Voice Layer

**Why Phase 4 enables it:** the action queue is the backbone voice needs.
User speaks → system stages an action → voice confirms → it executes.

**What to build:**
- Twilio/Vapi integration wired to the monitoring output
- Voice briefing reads `causalDiagnosis.summary` as the lead
- Approved voice commands write to `pending_actions` — same queue as UI
- Schema context tells the voice layer which areas to brief on for this user

---

## Phase 6 — Simulation Engine

**Why Phase 1 enables it:** the schema IS the model. Units, properties, links,
and causal relationships are already defined. `projectDownstream` in
`causal-engine.js` is the core primitive.

**What to build:**
- "What if churn increases 3%?" — run the causal graph forward
- Shows cascade: churn → LTV:CAC → runway → decisions
- Scenario panel in cockpit or oversight UI

---

## Phase 7 — Path B (Local-First)

**Trigger:** when funded. Path A is the prerequisite.

**What it is:**
- Electron desktop app wrapper
- Schema engine, causal engine, monitoring all run locally
- Schema registry swaps Supabase → encrypted local SQLite
- Data never leaves the machine unless user explicitly syncs
- Engine is already stateless and portable — extraction is clean

---

## Phase 8 — Goal Hierarchy

**Why Phase 1 enables it:** goal is just another unit type with links to
departments/teams/individuals. Schema supports it on day one.

**What to build:**
- `goal` unit type already in catalog — wire it to the monitoring engine
- Goals have properties: owner, deadline, metric it moves, current progress
- Links to: team-member (owner), area (which area it affects), parent goal
- Goal health score computed from linked metric trajectory
- Goal progress surfaces in `management-strategy` area automatically

---

## Phase 9 — Decision Memory

**Why Phase 4 enables it:** `execution_log` already records every actioned
finding. Decision memory is a richer query layer on top.

**What to build:**
- `decision` unit type — add to catalog
- Every significant governance finding that gets actioned becomes a decision
  record (links back to metrics that triggered it and outcomes observed)
- AI advisor references past decisions when similar patterns re-emerge
- Phase 4's `execution_log` is the seed data

---

## Phase 10 — Company DNA

**Why it needs Phase 3 first:** needs the intelligence loop running long enough
to accumulate patterns.

**What to build:**
- Cross-run pattern detection — which metrics consistently move together for
  this specific company
- Company-specific causal weights layered on top of the universal graph in
  `causal-engine.js`
- Feeds into AI advisor as long-term company context

---

## Phase 11 — External Intelligence

**What to build:**
- Connect external data source (news, industry signals, competitor moves)
  keyed to the user's `industryId` from their schema
- Surface relevant external signals alongside internal monitoring findings
- Causal engine reasons about external triggers for internal metric changes

---

## Phase 12 — Escalation Intelligence

**Why Phase 1 enables it:** severity levels and compound rules already live in
the schema. Five-tier filter is logic on top.

**What to build:**
- Escalation tiers: watch → flag → escalate → alert → critical
- Compound rules in the schema already have severity — escalation reads them
- Escalation paths: who gets notified, at what tier, via which channel
- Connects to Phase 5 (voice) and Phase 4 (execution queue) for automated
  escalation response

---

## Phase 13 — Multi-Year Memory

**What to build:**
- Query layer over `area_metric_snapshots` and `business_health_checks` tables
- Year-over-year comparisons keyed to schema (same metric keys, consistent)
- Schema versioning — tag snapshots with schema version when schema changes
- "This time last year, churn was X. Here's what changed."

---

## Notes for next session

**What's done (all on main, live in production):**
- Phases 1–4 complete and pushed to main
- Supabase tables live: `company_schemas`, `artifacts`, `pending_actions`,
  `execution_log` (all with RLS + service_role bypass policies)
- Cockpit AT A GLANCE always visible; ThresholdEditorPanel now in Oversight

**Pending / blocked:**
- Blueprint catalog completion — 4 placeholder areas (product-engineering,
  people-hr, operations, legal-compliance) have no metrics/rules/units yet.
  Waiting on Sahej to provide the full prebuilt list. Doc at:
  `docs/blueprint-catalog-handover.md`
- SchemaSetup units picker (step 3 of onboarding) — blocked on catalog
  completion. `previewSchemaSelections` already returns unitTypesByArea
  for the picker when ready.

**Architecture rules (never break these):**
- No per-connector files. System handles any connector generically.
- `pending_actions` is source of truth. Frontend never calls Composio directly.
- Four layers never blur: Findings → Artifacts → Action Candidates → Executions.
- `executeTool(userId, toolSlug, args)` in composio.js is the only Composio
  execution primitive. Only `api/actions/execute.js` calls it.
- `validateUserToken(req, res, userId)` pattern on all API endpoints — returns
  false on failure and handles 401 itself. Usage: `if (!await validateUserToken(...)) return`
- `SUPABASE_SERVICE_ROLE_KEY` is the env var name for service key (not SERVICE_KEY).
- registry uses `id: 'googledrive'` (not `google_drive`).

**Recommended next phases in order:** 8 → 9 → 6 → 12 → 10 → 13 → 5 → 11 → 7
