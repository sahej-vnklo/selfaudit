# SelfAudit — Full Codebase Sweep (2026-05-31)

**Scope:** every tracked source file — `src/` (28 files incl. the 8.1k-line `Dashboard.jsx`), `api/` (76 files), `shared/`, `supabase/` (3 edge functions + 22 migrations).
**Method:** 10 deep review passes (one per cohesive zone) + repo-wide wiring/env/grep analysis. The highest-severity items were re-verified by hand (marked ✓).
**Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low. "(unverified — …)" = depends on runtime/DB state not visible in the repo.

> "100% perfect" is aspirational — but the roadmap at the end gets this codebase to *secure, correct, and lean*. Fix the 🔴 block before anything else.

---

## Severity tally (deduped, approximate)

| | 🔴 Critical | 🟠 High | 🟡 Medium | ⚪ Low |
|---|---|---|---|---|
| Count | 12 | ~40 | ~85 | ~90 |

The Critical/High items are fully detailed below. Medium/Low are itemized per category.

---

## 🔴 CRITICAL — fix before next deploy

1. **Hardcoded `service_role` JWT committed to git** — `supabase/migrations/20260503000000_attio_sync_trigger.sql:17` ✓
   A live Supabase service-role key (decoded payload `"role":"service_role"`, exp ~2036) **and** the project ref `spinhhzpboojmpndaxue` are inlined in a trigger function. Service-role bypasses *all* RLS. It's in git history. **→ Rotate the key NOW**, then store it in Vault / `current_setting('app.settings.service_key')` and reference it from the trigger.

2. **Both data connectors crash on load — wrong relative import paths** — `api/connect/hubspot/auth.js:3,4,6`, `hubspot/callback.js:4,5`, `hubspot/preview.js:3`, `connect/stripe/auth.js:4,6`, `connect/stripe/callback.js:4,5` ✓
   These files import from `../lib/…` which resolves to `api/connect/lib/` — **a directory that does not exist** (`ls` confirmed). Real files are at `api/lib/…` (`../../lib/`). Native ESM → `ERR_MODULE_NOT_FOUND` on every invocation. The entire HubSpot *and* Stripe OAuth flows (connect, callback, preview) are non-functional in production. Note the same files use the *correct* `../../lib/` on adjacent lines. **→ Change `../lib/` to `../../lib/` (7 import lines).**

3. **World-open RLS on sensitive per-user tables** — `supabase/migrations/20260504000004_user_memory.sql:24-25`, `20260505000001_business_state.sql:47-49` ✓ (and `area_metric_snapshots.sql:32-38`)
   Policies are `FOR ALL USING (true)` with **no `TO service_role`** → they apply to role `public` (incl. `authenticated`/`anon`). Because RLS policies are OR'd, this permissive policy **overrides** the `auth.uid() = user_id` owner policy: any logged-in user can read/write *every* user's memory and business state via the anon key. **→ Add `TO service_role` to every "Service role full access" policy.**

4. **Sensitive tables have no migration and unmanaged RLS** — `risk_alerts`, `business_health_checks`, `admin_user_overview` (schemas exist only as comments in `api/lib/monitoring/risk-alerts.js:3-20`, `api/run-health-check.js`, and read by `api/mcp.ts:96-115`)
   No `CREATE TABLE`, no RLS, no policy anywhere in `supabase/migrations/`. They hold per-user risk/health data and admin user lists, queried with the service role. RLS state depends entirely on manual SQL-editor setup. If created without RLS, all rows are world-readable to any anon-key client. **→ Add real migrations creating these WITH RLS enabled + owner-only + service-role policies.**

5. **Stripe webhook trusts client-supplied tier** — `api/stripe-webhook.js:138,144` ✓
   `checkout.session.completed` writes `session.metadata.tier` verbatim into `profiles.tier`. That value originates from the checkout-create request body, not from Stripe's verified price. (The `subscription.*` handler correctly derives tier from `price.id` — this branch should too.) **→ Resolve tier from the subscription's price ID, never from metadata.**

6. **`set-profile` = self-serve tier escalation** — `api/set-profile.js:7,20,28` ✓
   Accepts `tier` from the body and upserts it with the **service-role key (bypasses RLS)**; only checks the caller owns `userId`, never that the tier is legitimate. Any authenticated user can POST `{tier:'intelligence'}` and unlock paid features. Also appears **unused by the frontend** (no fetch references) — dead *and* dangerous. **→ Reject client-supplied `tier`/`stripe_*`; make the webhook the only tier writer. Or delete the endpoint.**

7. **`create-stripe-subscription` edge function has no auth** — `supabase/functions/create-stripe-subscription/index.ts:23-30,53-65`
   Unlike the other two edge functions, it never reads `Authorization`/`getUser()`. It charges a card and upserts `profiles.tier` for a **client-supplied `userId`** via service role. Privilege escalation + arbitrary Stripe-customer creation. It's also **dead** (no caller; live path is `/api/create-checkout-session`). **→ Delete it (or add JWT auth + `user.id === userId`).**

8. **No rate limiting on anonymous, expensive endpoints** — `api/audit.js`, `api/dual-agent.js`, `api/generate-artifact.js:259-291`, `api/send-auth-link.js` ✓ (grep: no throttle anywhere)
   `audit` and `generate-artifact` allow anonymous calls that each fire Claude completions (up to 3-4k tokens); `dual-agent` fires planner + 2 agents per request; `send-auth-link` sends Resend emails + enumerates users. An attacker can exhaust your Claude/Resend budget at will. **→ Add IP/user rate limiting (e.g. Upstash) + max body size; require auth for the artifact-generation branch.**

9. **dual-agent loads no context — plan shape mismatch** — `api/dual-agent.js:102` + `api/lib/agent/gather-context.js:128` ✓
   `gatherAgentContext` reads `plan.available_sources`, but `dual-agent` passes the raw planner output (which uses `sources_to_fetch`) → `needed = []` → intelligence brief, recent audits, health checks, risk alerts, and HubSpot are **never fetched**. Agents X/Y only ever see the company brain. (`agent-query.js:109` remaps correctly; dual-agent doesn't.) **→ Build `{available_sources: plan.sources_to_fetch, missing_sources: …}` before calling, mirroring `agent-query.js`.**

10. **Stripe connector data never flows** — `api/lib/monitoring/health-check.js:519` vs `api/connect/stripe/callback.js:52-58`
    Health-check gates on `integrations?.stripe?.api_key`, but the OAuth callback stores `access_token`. Even with imports fixed, Stripe metrics are never read. **→ Gate on `integrations?.stripe?.access_token`.**

11. **`delete-account` orphans all user data** — `api/delete-account.js:22`
    Only calls `auth.admin.deleteUser(userId)`; never deletes `profiles`, `reports`, `chats`, `user_memory`, `business_state`, `intelligence_*`, `risk_alerts`, `patterns`, `artifacts`, etc. GDPR/CCPA "delete my account" leaves private business data indefinitely **unless every table has `ON DELETE CASCADE`** (most don't — only `user_memory`/`reports` do). **→ Explicitly delete from each user table (service role) before `deleteUser`, or add cascading FKs everywhere.**

12. **Customer-service governance area is dead in the monitoring loop** — `api/lib/governance/metric-snapshots.js:21-32`
    The rule pack keys on `first_response_time`/`resolution_time`/`repeat_issue_rate`/`csat`, but the snapshot builder only emits `ticket_volume` (which has no rule). The entire area can never produce a finding. Combined with #goal-progress (below), the governance engine emits false/empty signals on real accounts. **→ Produce the four metrics the rules need, or add a `ticket_volume` rule.**

---

## 🟠 HIGH

**Security / billing**
- 🟠 **Account enumeration** — `api/send-auth-link.js:130-135`: distinct 404 ("no account") vs 409 ("already exists") lets anyone enumerate registered emails; no rate limit. → Return a generic 200 regardless.
- 🟠 **Stripe webhook not idempotent** — `api/stripe-webhook.js:135-168`: no `event.id` dedupe; Stripe retries + out-of-order events can flip a paying user's tier. → Insert `event.id` into a `processed_stripe_events` table (unique) and early-return on conflict.
- 🟠 **Webhook ignores subscription status** — `api/stripe-webhook.js:58-67`: `past_due`/`unpaid`/`incomplete` subs still grant the paid tier. → Only grant when `status ∈ {active,trialing}`.
- 🟠 **Two contradictory tier-constraint migrations** — `20260509000004` sets default `'free'`; `20260510000000`/`20260522010000` set `'foundation'` + `CHECK (tier IN ('foundation','intelligence'))`. A partially-migrated DB accepts tiers the code can't map. → Collapse to one constraint; delete the `'free'` default migration.
- 🟠 **CORS `*` on billing edge functions** — `supabase/functions/*/index.ts:5`: any origin can invoke with a forwarded JWT. → Restrict to `APP_URL`.
- 🟠 **`disconnect` lacks plan gate + validates nothing** — `api/connect/disconnect.js:24-46`: no `requireIntelligencePlan`; uses unvalidated `provider` as an object key written back into `profiles.integrations`. → Gate + validate `provider` against the registry.
- 🟠 **Unencrypted OAuth tokens at rest** — `api/connect/hubspot/callback.js:50-59`, `refresh-token.js:43-58`: HubSpot access+refresh tokens (full CRM read) stored plaintext in `profiles.integrations`. → Encrypt at rest (pgcrypto/KMS).
- 🟠 **Anonymous uncapped artifact generation** — `api/generate-artifact.js:259-291`: no `userId` ⇒ no auth, still fires a 3k-token Claude call. → Require auth for generation.
- 🟠 **Admin gate is client-side only** — `src/pages/AdminDashboard.jsx:68,1884`: `email === 'sahej@vnklo.com'` check is trivially bypassable; safety depends entirely on every `tsa_*` MCP tool re-authorizing server-side (`api/mcp.ts:323,338` does check `TSA_ADMIN_KEY` + email — confirm none trust the client).

**Correctness / functional**
- 🟠 **Goal-progress false-positive for every new user** — `api/lib/governance/metric-snapshots.js:103` + `company-brain.js:105`: `goal_score` defaults to `0`, rule fires `< 60` ⇒ "Goal progress soft" for everyone with no goal set. → Treat `0`/no-active-goal as `no-signal` (return null).
- 🟠 **Compound (cross-area) findings never reach advice** — `api/lib/governance/monitoring.js:161` vs `advice.js:90-99`: advice only iterates `governance.areas[].findings`; the 5 most severe cross-area diagnoses (cash fragility, pipeline collapse, etc.) live in `governance.compoundFindings` and are silently dropped. → Fold `compoundFindings` into the diagnosis list.
- 🟠 **`area-trends` misclassifies metrics → inverted trend arrows** — `api/area-trends.js:17-25`: `runway_months`/`ticket_volume` aren't in either direction set, so unknown metrics default to "lower-is-better"; the sets also list metrics that are never written. → Drive direction from the area modules' `preferredDirection`; return `'stable'` for unknowns.
- 🟠 **`Cockpit` DeptCard colors ignore metric direction** — `src/components/Cockpit.jsx:249-253`: `delta > 0 ? red : green` shows higher-is-better metrics (open_deals, runway, goal_progress, csat) as red when they *improve*. → Use `preferredDirection`.
- 🟠 **`OpenIssuesTracker` gets the wrong `issueState` shape** — `src/components/Dashboard.jsx:2308`: live Oversight passes the already-flattened map, but the tracker re-applies `getOpenIssueStatuses(issueState, reportId)` expecting the raw row ⇒ saved statuses never render and a save **wipes other reports' statuses**. → Pass `issueState={businessState}` and wire `onIssueStateChange={setBusinessState}`.
- 🟠 **`cockpit`/`dept-*` routes missing from `SECTIONS`** — `src/components/Dashboard.jsx:365`: any `hashchange`/reload/back on Cockpit or a department bounces the user to Home (`getSectionFromHash` whitelists only 10 ids). → Add `cockpit` + the four `dept-*` ids.
- 🟠 **Undefined theme tokens blank out two report types** — `src/pages/AdminDashboard.jsx:670,679,796,811`: EXECUTION/GOAL_GAP renderers use `G.ink`/`G.inkMuted` which don't exist on `G` (only `text`/`textMuted`) ⇒ near-invisible text. → Use `G.text`/`G.textMuted`.
- 🟠 **Unguarded Claude response shape** — `api/audit.js:851,911`, `api/generate-artifact.js:298`: `data.content[0].text` throws on an empty/refusal/tool response → leaked 500. → Guard `data?.content?.[0]?.text`, return clean 502.
- 🟠 **`JSON.parse` of model output leaks parser errors to client** — `api/audit.js:855,912`: non-JSON model output → raw 500 with parser message. → Wrap in try/catch, return graceful retry message.
- 🟠 **`run-health-check` (on-demand) never emails critical alerts** — `api/run-health-check.js:66-71`: creates alerts but only the daily cron sends email; the cron's dedup may then suppress them. → Factor the email path into a shared helper used by both.
- 🟠 **`loadRiskAlerts` crashes the whole block on a null `severity`** — `api/lib/agent/gather-context.js:91`: `a.severity.toUpperCase()` with no guard → one bad row drops all risk context. → `String(a.severity||'unknown')`.
- 🟠 **HubSpot pagination not handled** — `api/lib/connectors/hubspot.js:40,42`: hard `limit=20` on deals/contacts; `paging.next` ignored ⇒ all pipeline/contact metrics computed from a 20-record sample for any real account. → Follow the cursor.
- 🟠 **`ExecutionPanel` report selector string/number mismatch** — `src/components/ExecutionPanel.jsx:465,673`: `setSelectedReportId(event.target.value)` (string) vs strict `===` against possibly-numeric `id` ⇒ picker silently falls back to report[0]. → `String(a)===String(b)`.

**Architecture (High)**
- 🟠 **Connector registry advertises undeployed providers** — `api/lib/connectors/registry.js`: marks `stripe` "available" though Stripe endpoints aren't in `vercel.json functions`; 5 providers have no implementation. → Only mark deployed providers available.
- 🟠 **Billing logic split across 3 divergent writers** — `api/stripe-webhook.js` (trusts metadata) vs `checkout-session-status.js` (price-derived + status) vs `supabase/functions/create-stripe-subscription` (client tier, no auth). No single source of truth for entitlement. → Make the webhook the only tier writer.
- 🟠 **Crons run a full Claude health check per user ignoring cadence** — `api/cron/business-health.js:142-145`: the `alertsAreDue` gate runs *after* the expensive check. → Gate before `runBusinessHealthCheck`.
- 🟠 **God-components / god-files** — `Dashboard.jsx` (8.1k lines), `AdminDashboard.jsx` (2k), `api/audit.js` (931), `api/lib/monitoring/health-check.js` (608), `Report.jsx` (1.3k). Each mixes routing/transport/fetch/render/styles. (See Architecture section.)
- 🟠 **AdminDashboard detail-hydration effect re-runs on every cache write** — `src/pages/AdminDashboard.jsx:1861-1882`: `useEffect([...,detailCache])` calls `setDetailCache` inside its loop ⇒ tears down + restarts the loop O(N) times. → Drop `detailCache` from deps.
- 🟠 **Rule/metric catalog defined 4×** — area modules vs `api/dept-data.js:21-51` (`AREA_RULES`) vs `Dashboard.jsx THRESHOLD_AREAS` vs `area-trends.js` direction sets. Units already disagree (`hrs/%` vs `percent/days`). → One exported catalog.

---

## 1. Dead code

**Frontend**
- 🟠 `HomeSection` (~600 lines) never rendered — `Dashboard.jsx:2461-3073`; the home view is inlined at `:1892`. Drags in dead `OperationalOversightSnapshotCard` (3102), `WeeklyDigestAlertsPanel` (3677), `FounderCheckInPanel` (3911).
- 🟠 `buildReportHtml` (~255 lines) — `Report.jsx:512-767`: a full second report renderer with zero callers (PDF path uses html2canvas). Includes a dead `EXECUTION_HUMAN` branch.
- 🟠 `ConfigScreen.jsx` entirely unused — collects `sk-ant-`/`re_` keys client-side; not imported anywhere. → Delete.
- 🟡 `GoalCaptureModal` flow can never open (`Dashboard.jsx:773,1695`; `setGoalModal(true)` never called) and calls undefined `startGoalAudit` (`:1698`). Dead: `GOAL_CATEGORIES`, modal, state.
- 🟡 Dead components: `SidebarButton` (5960), `TopButtons` (4373), `AuditStartButtons` (5281), `WeeklyDigestAlertsCard` (3624), `AuditHistoryRow` (5534), 8 `Icon*` (5981-6058, live sidebar uses inline SVG).
- 🟡 `sendReportEmail` + `buildEmailHTML` (~110 lines) — `src/lib/audit.js:33,48`: no callers; `buildEmailHTML` interpolates user input unescaped (XSS if revived).
- 🟡 Unused App state `userInfo`/`conversationHistory`/`auditSessionId` (`App.jsx:153-155`); dead screens `AUDIT`/`REPORT` (`:17`); `handleReportReady` (`:442`).
- 🟡 `sessionResultCount` set but never read (`Dashboard.jsx:801,1338,1360`) + its `session_result` SSE branch.
- 🟡 Large blocks of unreferenced `styles.*` keys + ~80 unused `sharpTheme` imports in `Dashboard.jsx`; 5 unused style objects in `IntelligenceBrief.jsx` (744-846); `helperText`/`artifactHeaderCompact` in `ExecutionPanel.jsx` (1151,1168); `disclaimer`/`timelineLabel` in `Report.jsx` (1223,1296); `loginPill` in `Signup.jsx:366`.
- 🟡 `collectingContact` state set but never read — `AuditChat.jsx:165` (gating uses `awaitingContactRef`).
- ⚪ Unused CSS: `.btn-ghost` (Landing.css:785), `.site-footer-tag` (875), `.fc-row .value .pct` (502), `@keyframes saLandScrollDown`/`saLandRise` (906-913), duplicate `font-family` (772); duplicate `--green` (`index.css:29` then `34`).
- ⚪ Unused props: `compact` on `ReportSkeletons` (5561), `userId` on `ReportCard`/`ReportList` (5778,5847).
- ⚪ Cockpit returns `active_goal`/`goal_score` never read by the component (`cockpit-data.js:230` + a whole DB branch).

**Backend**
- 🟡 `create-stripe-subscription` edge function — entire file dead (see 🔴#7).
- 🟡 `validateStripeApiKey` + stale "api_key" header — `api/lib/connectors/stripe.js:2,142-149`: documents a key shape nothing writes; seeded the gate bug (🔴#10).
- 🟡 `revenue_qtr` extracted + stored but no consumer (`parse-intelligence-doc.js:6`); `goal_score_delta` written (`save-report.js:140`) but never read; `latest_connector_sync`/`active_goal`/`goal_score` written to `intelligence_profiles` but read from `business_state` instead (`synthesize.js:369`).
- 🟡 Legacy `profiles.context` parser (~40 lines) dead in practice — `audit.js:183-221` (the `user_memory` path always wins).
- ⚪ Unused exports: `buildAccountExportFilename` (`data-governance.js:43`), `getAvailableConnectors`/`getConnectorDefinition` (`registry.js:119`), `GOVERNANCE_*` contract constants (`contracts.js`, never enforced).
- ⚪ Dead `intent` param in `agent-x.js:13`/`agent-y.js:11` system-prompt builders.
- ⚪ Double no-op `.then(()=>{}).then(()=>{})` — `stripe.js:107`. Self-mapping keys in `CATEGORY_TO_AREA` (`dept-data.js:8-18`).

**DB / config**
- 🟡 `business_patterns` table created but never used (only `patterns` is) — `20260504000003` vs `…004:28`. Duplicate `profiles` create + dead columns (`first_name`/`last_name`/`selected_*`/`onboarding_complete`) — `20260428000000:2-12`. `prune_old_metric_snapshots()` defined but never invoked — `20260530000000:42`.
- ⚪ Unused `business_state` columns (`retention_signals`, `team_ownership`, `goal_baseline`, `goal_timeline`); `priceId` in checkout metadata never read back (`stripe-webhook.js:138`).
- ⚪ `.env.example` lists unused keys (`GOOGLE_*`, `NOTION_*`, `SLACK_*`, `STRIPE_PRICE_PORTFOLIO`, `STRIPE_CLIENT_ID`) and **omits** many keys actually used (`CLAUDE_API_KEY`, `CRON_SECRET`, `INTELLIGENCE_CRON_SECRET`, `OAUTH_STATE_SECRET`, `STRIPE_PRICE_FOUNDATION/INTELLIGENCE`, `STRIPE_WEBHOOK_SECRET*`, `SUPABASE_URL/ANON_KEY`, `TSA_ADMIN_KEY`).
- ⚪ README is stale — describes client-side Claude, `Onboarding.jsx`, `ConfigScreen` as dev-only; none match the current server-side architecture.

## 2. Bugs

- See 🔴#5,6,9,10,11,12 and the High "Correctness" block above for the load-bearing ones.
- 🟡 Stale `agentState` closure in `done` SSE branch — `Dashboard.jsx:1533` (use functional updater). Unreachable duplicate `break` — `:1522`. Side effects inside `setState` updaters (rAF scroll) — `:1477,1494`.
- 🟡 `AuditChat` init effect reads `userInfo` with empty deps — `:178` (stale greeting if props change); tier fetch drops the Supabase `error` and uses `.eq` w/o `.single()` — `:189`; `extractNonContactText` can strip legit message text via naive `replace(name,'')` — `:138`.
- 🟡 `getReportMode` remaps `EXECUTION_HUMAN`→`HUMAN_MOMENT` but the badge shows the remapped label — `AdminDashboard.jsx:390,1688`. Funnel "Got report" ternary has identical branches — `:1932`.
- 🟡 Internal error messages leaked to clients (`err.message` in 500s) — `audit.js:929`, `save-report.js:222`, `send-report.js:482`, `delete-account.js:26`, `export-account-data.js:102`, `save-dashboard-checkin.js:119`, `dual-agent.js:174`.
- 🟡 `export-account-data` uses `.single()` on profile → 500 if row missing — `:35` (others use `maybeSingle`). 
- 🟡 HubSpot deal pipeline hardcoded `'default'` while comment says "VNKLO High Ticket"; no `dealRes.ok` check → leads may silently never reach CRM — `send-report.js:397-404`.
- 🟡 `expires_in` missing ⇒ token stored already-expired (`+0`) → refresh on every call — `hubspot/callback.js:53`, `refresh-token.js:47`. Token-refresh + `last_synced_at` writes overwrite the whole `integrations` blob from a stale snapshot → refresh race / clobber — `refresh-token.js:53`, `hubspot.js:131`.
- 🟡 Stripe churn denominator mixes unique-customers with raw canceled-subscription count → inflated churn/LTV — `stripe.js:82-90`. `livemode` defaults `true` on missing field — `stripe/callback.js:56`.
- 🟡 `generate-artifact` `JSON.parse` unguarded — `:298`. `AddCustomMetricForm` reads `j.error` from possibly-non-JSON body + leaves `saving=true` on early-return error — `DepartmentPage.jsx:332-337`.
- ⚪ `maybeHandleEmailAuthConfirm` trusts `next` (protocol-relative `//host`) — `App.jsx:142`. `/api/audit` error path assumes JSON body (`audit.js` client lib:9,25,41). PDF raster slice can bisect a text line — `Report.jsx:338`, `ExecutionPanel.jsx:417`. `stageNameById` can yield a numeric label; `isClosed` stringly-typed — `hubspot.js:60-61`. `timeAgo` unbounded for old/future timestamps — `Cockpit.jsx:67`.
- ⚪ `intelligence-synthesis` cron accepts the secret via query string (logs leak) — `:6`. `runway`/`revenue_qtr` data-contract gap: `analyzeRevenueRisk` reads `runway` the doc parser never writes — `health-check.js:146` (the most important alert can't fire from uploads).

## 3. Misplaced / disconnected wiring

- 🔴 Connector import paths (🔴#2); dual-agent context (🔴#9); Stripe gate (🔴#10).
- 🟠 `cockpit`/`dept-*` routing (High); `OpenIssuesTracker` shape (High); `<Landing onSignUp>` prop never accepted by `Landing` — `App.jsx:536` vs `Landing.jsx:134` (plan-specific signup is dead wiring).
- 🟡 Landing nav "How It Works"/"Pricing" buttons + the entire burger menu (~15 items) have no handlers — `Landing.jsx:40-83,313`. `Cockpit.runHealthCheck` mutates via POST from a "read-only" view with no `res.ok` check — `Cockpit.jsx:371`.
- 🟡 `OpenIssuesTracker.onIssueStateChange={()=>{}}` no-op (`Dashboard.jsx:2309`); live `AiOpportunitiesDetailPanel` omits `initialShared` so a shared user sees "unshared" — `:2329`.
- 🟡 `status.js` vs `connectors.js` answer "what's connected?" from two different provider lists → divergent client state. `monitoring_enabled` filter documented but column never created — `cron/business-health.js:10`.
- 🟡 `dept-data.AREA_RULES` duplicates area-module metadata; `RuleRow` re-sends client `metricKey`/`areaId` derivable server-side — `DepartmentPage.jsx:162`.
- ⚪ `OPERATIONAL_AREA_REGISTRY` spread silently loses label/summary if a module id has no shared entry — `area-registry.js:18`. Stripe `callback.js` missing method check — `:15`.

## 4. Misplaced / misaligned API calls & security

- All 🔴 security items (#1,3,4,5,6,7,8) + High security block.
- 🟡 `findAuthUserByEmail` lists up to 10k users per sign-in — `send-auth-link.js:26` (O(n) scan on an unthrottled endpoint). `weekly-digest` lists 1000 auth users every run though it processes ≤50 — `:248`.
- 🟡 `business-health` re-queries open alerts per user right after creating them — `cron/business-health.js:188`. `generate-artifact` overloads one endpoint for "recommend" vs "generate" by payload presence; failures coerced to empty → server error looks like "no recommendations" — `ExecutionPanel.jsx:554`.
- 🟡 `preview.js` collapses every failure (incl. plan-denied) to `200 {data:null}` — can't distinguish "not connected" from "sync errored". Inconsistent auth contract: 401 vs silent 200/null across connector endpoints.
- ⚪ `config.js` no method check + logs config on every cold start — `:1,6`. Requested HubSpot scope `crm.objects.companies.read` never used — `providers.js:11`.
- ⚪ MCP admin keyed to a hardcoded email — `mcp.ts:323`. `tierFromPriceId` duplicated in 4 files. Inconsistent success envelopes (`{ok}` vs `{success}` vs bare) across endpoints.

## 5. Architectural weaknesses

- 🟠 **God-components/files** (see High): split `Dashboard.jsx` into per-section files + extract the dual-agent SSE engine; extract `AdminDashboard` transport (`callAdminTool`/SSE) + report renderers; split `api/audit.js` into `prompts/context/validate`; migrate `health-check.js`'s 6 hand-rolled analyzers into the governance rule-pack system (they duplicate it with non-overridable thresholds).
- 🟠 **Four sources of truth for the metric/rule catalog** (area modules / `dept-data` / `Dashboard THRESHOLD_AREAS` / `area-trends` direction sets) — already drifting on units; root cause of the Cockpit color bug and area-trends arrow bug.
- 🟠 **Three category vocabularies** for the same concept — legacy analyzer `category` (`pipeline`/`revenue`) vs governance area ids (`marketing-sales`) vs notification prefs (`pipeline_revenue`); `cron/business-health.js:43` hand-maps all three and silently drops unmapped → no email.
- 🟡 **Two divergent health scores** — `business-health.js:17` (domain-status based, shown on dashboard) vs `health-check.js:72` (severity-deduction based, persisted/alerted). User sees a different number than what drives alerts. → Dashboard should read the persisted score.
- 🟡 **Memory format duplicated** — `save-report.js:14` writes an ad-hoc `[Audit — …]` string that `audit.js:197` parses back with regex. → One shared serializer/parser.
- 🟡 **Theme tokens resolved independently in 6+ components** (`Report`, `ExecutionPanel`, `IntelligenceBrief`, `AuditChat`, `Signup`, `AdminDashboard`, `Dashboard`) each reading `localStorage` + rebuilding maps; `Login` hardcodes its own palette. → One `getThemeVars` hook/CSS-var provider.
- 🟡 **Auth OTP flow duplicated + divergent** — `Login.jsx` vs `Signup.jsx` (different success mechanisms, separate error maps, duplicated `CodeField`). → Shared `useEmailOtp` hook.
- 🟡 **Declared area `connectors` aren't wired** — customer-service lists `zendesk`/`gmail`, management-strategy lists `notion`/`slack`, but only Stripe/HubSpot feed metrics. Leaky abstraction.
- 🟡 **OAuth state is signature+TTL only, no one-time nonce** — a captured `state` is replayable within 10 min — `oauth-state.js`.
- ⚪ **Model id + Claude API URL hardcoded in 5+ files** (`'claude-sonnet-4-20250514'` ×9) — a model upgrade means editing every file (planner already mislabeled "Haiku" but runs Sonnet). → One `claude-client.js`.
- ⚪ **`VITE_`-prefixed secret names** — code reads `process.env.VITE_SUPABASE_SERVICE_ROLE_KEY`/`VITE_CLAUDE_API_KEY` as server fallbacks; `VITE_` vars are bundled to the client by Vite — a dangerous naming convention even if currently only read server-side. → Rename to non-`VITE_` server vars.

## 6. Inefficiencies

- 🟠 Crons run full Claude health checks ignoring cadence (High). 
- 🟡 `audit.js` re-runs 6 context queries on **every** conversation turn + re-bills the full system prompt (no Anthropic prompt caching, no per-session cache) — `:819`. `connectorContext` fetched serially after the `Promise.all` instead of inside it — `:819-826`.
- 🟡 `save-report` fires ~7 sequential DB calls + full intelligence synthesis on the request path — `:72-205`. → Parallelize independent writes; defer synthesis to background.
- 🟡 `synthesizeEligibleUsers` runs strictly sequentially over all users — `synthesize.js:443`. → Bounded concurrency.
- 🟡 `gather-context` does 2 sequential DB calls before the parallel fan-out — `:135,160`. Planner runs **Sonnet** (3 Sonnet calls/turn) though it's the cheap structural step labeled "Haiku" — `planner.js:110`. AI-advisor makes an extra Sonnet call to reword advice on every health check — `ai-advisor.js:250`.
- 🟡 Artifacts regenerated via Claude on every request with no cache check on `(report_id, artifact_type)` — `generate-artifact.js:277`. `business-health` loads the full company brain (~6 queries) + recomputes on every dashboard load — `:49`.
- 🟡 Health-check fetches HubSpot then Stripe sequentially — `:512`. `RightRail` recomputes MRR/tier reductions already computed in the parent — `AdminDashboard.jsx:1237`.
- 🟡 `getThemeVars`/`getStyles` rebuild large objects every render (not memoized) — `Dashboard.jsx:755`, `Report.jsx:204`, `ExecutionPanel.jsx:455`, `IntelligenceBrief.jsx:264`, `AuditChat.jsx:171`. `Message` not memoized → all bubbles re-render every keystroke — `AuditChat.jsx:404`. Report parsing (`parseReportContent`/`JSON.parse`) repeated per render across panels — `Dashboard.jsx:4043`,`5520`.
- 🟡 `dept-data` `onSaved`/`onAdded`/`onDeleted` each trigger a full dept refetch (alerts + 120 snapshots + health check) — `DepartmentPage.jsx:536`.
- ⚪ Missing indexes: `profiles(tier)` (both crons scan it), `risk_alerts(user_id,status,notification_sent)` (comment-only). `dept-data` over-fetches 120 snapshots for 14-point sparklines. Duplicate `getSession()` on startup — `supabase.js` + `App.jsx:312`. Per-request Supabase client instantiation in connector handlers. `scopedUserInfo` double-`JSON.stringify` per render — `ExecutionPanel.jsx:494`.

## Cross-cutting / repo-wide

- `console.*` shipped in frontend: `Dashboard.jsx` ×21, `App.jsx` ×7, `Report.jsx` ×4, `supabase.js` ×3, `IntelligenceBrief.jsx` ×3 — gate behind `import.meta.env.DEV`.
- Two untracked docs only (`docs/investor-deck.html`, `docs/landing-mockup.html`) — working tree otherwise clean. (Earlier "untracked API files" suspicion was a false alarm — they're tracked.)
- `agent-query.js:9-28` ships a full `create table` DDL in a comment instead of a migration; the insert (`:125`) swallows failures.

---

## Improvement roadmap — how to get to "secure, correct, lean"

### P0 — Security & integrity (this week)
1. **Rotate the leaked service-role key** and purge it from the trigger (Vault/`current_setting`). Treat the repo as compromised until rotated.
2. **Fix the 7 connector import lines** (`../lib/`→`../../lib/`) — restores HubSpot + Stripe.
3. **Add `TO service_role`** to every `USING (true)` policy; **add migrations** for `risk_alerts`, `business_health_checks`, `admin_user_overview` *with RLS enabled* + owner/service policies. Audit every table for `FOR ALL USING (true)`.
4. **Lock down tier writes**: make the Stripe webhook the *only* writer (price-derived, status-gated, idempotent via `processed_stripe_events`). Reject client `tier` in `set-profile` (or delete it). Delete/auth the `create-stripe-subscription` edge function.
5. **Add rate limiting + max body size** to `audit`, `dual-agent`, `generate-artifact`, `send-auth-link`; make `send-auth-link` non-enumerable (generic 200); require auth for artifact generation.
6. **Encrypt OAuth tokens at rest**; add CSRF nonce store; restrict edge-function CORS to `APP_URL`.
7. **Make `delete-account` actually delete** every user table (or verify cascades).

### P1 — Correctness (next)
8. Fix the dual-agent plan remap (#9), Stripe `access_token` gate (#10), goal-progress `0` false-positive (#12-adjacent), compound-findings→advice wiring, area-trends/Cockpit direction logic, `OpenIssuesTracker` shape, `cockpit`/`dept-*` routing, `G.ink` theme tokens, and the unguarded Claude `content[0].text`/`JSON.parse` paths.
9. Stop leaking `err.message` to clients (generic message + server log) across all handlers.
10. Wire on-demand health-check email; fix HubSpot pagination; fix the report-selector string/number compare.

### P2 — Architecture (de-risk future bugs)
11. **One source of truth for the area/metric/rule catalog** (export from the governance layer; delete `dept-data.AREA_RULES`, `Dashboard.THRESHOLD_AREAS`, `area-trends` direction sets). This kills a whole class of drift bugs.
12. **One billing writer, one tier definition, one `tierFromPriceId`.**
13. **One `claude-client.js`** (model id, URL, headers, prompt-cache helper); downgrade the planner to Haiku.
14. **Centralize theme tokens** (one hook/provider) and a shared `authedFetch`.
15. **Split the god-files**: Dashboard sections, the SSE engine, AdminDashboard transport, `audit.js` prompts/context/validate, and fold `health-check.js` analyzers into the governance rule packs (one risk engine, one health score).
16. **One shared memory serializer/parser** for `save-report` ↔ `audit`.

### P3 — Efficiency & hygiene
17. Add Anthropic **prompt caching** to the static system prompts; cache per-session context across audit turns; cache artifacts by `(report_id, artifact_type)`.
18. Parallelize independent DB writes in `save-report`; defer synthesis to background; gate crons on cadence *before* the Claude call; bounded concurrency in synthesis cron.
19. Memoize `getThemeVars`/`getStyles`/report parsing; `React.memo` chat messages.
20. Add missing indexes (`profiles(tier)`, `risk_alerts(...)`); lower `dept-data` snapshot fetch.
21. **Delete the dead code** in §1 (HomeSection, buildReportHtml, ConfigScreen, dead components/styles, unused exports/tables/columns). Fix `.env.example` and the README. Gate `console.*` behind `DEV`.

### Systemic habits that would prevent recurrence
- Add **ESLint** (`no-unused-vars`, `react-hooks/exhaustive-deps`) + a dead-code pass (`knip`/`ts-prune`) in CI — most of §1 and the stale-closure bugs would have been caught automatically.
- Add a **migration-only DB rule**: no `create table`/RLS in code comments; CI fails if a queried table has no migration.
- A tiny **endpoint contract test** (auth required? method checked? error shape?) per handler would have caught `set-profile`, the connector import crashes, and the missing-auth gaps.
