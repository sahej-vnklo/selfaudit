# WP8 — Cockpit honesty fixes: signal counting, Because-text coverage, twin alerts (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (ESM, Vercel serverless `api/`, Supabase). WP1–7 are
deployed. Three small production-verified defects. Fix exactly these; no scope creep.

## Fix 1 — Areas say "no signal" while their own findings fire

**Defect:** `buildSnapshotForArea` in `api/lib/governance/metric-snapshots.js` counts
`coverage` only from mapping-resolved metrics. `userMetrics` (Logic-page values) fill
`metricsByKey` — so detection rules fire — but add nothing to `metrics`/`coverage`/`sources`.
Production result: Finance & Accounting shows "no signal" directly beside its own critical
runway alert. Worse, the early-return path (area with no `metricMappings`, e.g. custom
areas) skips userMetrics entirely.

**Fix:** in BOTH paths (normal and no-mappings early return), when a userMetric fills a key
not already resolved, also append a metric row with `source: 'manual'` so it counts toward
coverage and appears in `sources`. Honesty preserved: the source label says the number came
from the user, not a connector. `metricOverrides` (simulation) behavior unchanged — they
remain force-writes that do NOT add coverage.

## Fix 2 — "Because / If ignored" text missing on most alerts

**Defect:** the Cockpit prints `Because {evidence.rootCause}` and `If ignored
{evidence.impact}` only when those fields exist. Three rule generations, uneven dress code:
- Legacy parity + entity rules: have hand-written rootCause/impact ✅
- Catalog threshold rules (`createThresholdRule` in `api/lib/blueprint/catalog/areas.js`):
  have a written `rationale` field that is NEVER wired into the finding's rootCause ❌
  (see `api/lib/governance/shared/contracts.js` ~line 136: `rootCause: rule.rootCause ?? null`)
- Compound rules (`createCompoundRule`): no rootCause/impact at all ❌

**Fix:**
1. In `contracts.js`, finding construction: `rootCause: rule.rootCause ?? rule.rationale ??
   null`. Do NOT copy rationale into impact — never duplicate the same sentence into both
   slots; impact stays null unless explicitly authored.
2. Author `rootCause` and `impact` for every compound rule in the catalog (~15 rules across
   industries). One sentence each, plain English, language discipline applies: "likely
   driver" phrasing, no verdict language ("is caused by" forbidden), impact = what happens
   if ignored. Follow the tone of the existing legacy-rule texts in
   `api/lib/governance/monitoring.js`.
3. Verify the compound finding mapper (`evaluateCompoundRules` in `monitoring.js`) and
   `toLegacyRisk`/compoundRisks pass rootCause/impact through to the alert payload (WP4
   added the fields; confirm the chain end-to-end with a test).

## Fix 3 — Twin alerts born in the same run

**Defect:** `createRiskAlertsFromHealthCheck` in `api/lib/monitoring/risk-alerts.js` dedups
new risks against PREVIOUSLY OPEN alerts (`loadOpenAlertIndex`), but two candidates in the
SAME run with the same `category::normalisedTitle` key both insert. Production showed
"Follow-through is materially weak" twice (parity rule + area rule firing together).

**Fix:** within the run, track seen keys; on a duplicate key keep the candidate with the
higher severity (severity order exists as `SEVERITY_ORDER` in `health-check.js` — move or
duplicate a small rank map locally), drop the other. Existing open-alert dedup behavior
unchanged.

## Tests (add to existing suites)

- Coverage: area with only userMetrics → coverage > 0, source includes 'manual', status not
  'no-signal'; custom area with no mappings + userMetrics → same; metricOverrides alone →
  coverage still 0.
- Because-text: a catalog threshold finding (e.g. runway) now carries rootCause equal to its
  rationale; impact stays null; a compound finding (cash-fragility) carries its new authored
  rootCause AND impact; end-to-end: buildAlertPayload's evidence contains them.
- Language: authored compound texts contain no "is caused by" / "root cause" phrasing
  (extend the existing mechanical language test).
- Twin dedup: two same-key candidates in one run → one insert, higher severity wins;
  different keys unaffected; pre-existing open alert still dedups as before.
- All prior suites pass.

## Hard boundaries

- No migrations. No frontend changes (`src/` untouched — the UI already renders these fields).
- No changes to thresholds, override behavior, financial impact math, AI prompts,
  normalizers, or the graph artifacts.
- No new dependencies. Nothing outside the repo.

## Acceptance criteria

- `node --test` across graph/connectors/monitoring/governance suites: all pass.
- Every compound rule in the catalog has non-empty rootCause and impact.
- `grep -in "is caused by" api/lib/blueprint/catalog/areas.js api/lib/governance/monitoring.js`
  → nothing in emitted strings.

When done, output: files changed, test results, the full list of authored compound-rule
texts (for review), and any interpretation you made.
