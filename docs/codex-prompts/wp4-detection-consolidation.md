# WP4 — Detection consolidation: one detection layer (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (ESM, Vercel serverless `api/`, Supabase). WP1–WP3 are
merged (graph loader; Ecommerce normalizer + metric definitions; fact layer + evidence
snapshots). WP4 is a surgical consolidation: today the codebase detects problems in THREE
places, producing duplicate/conflicting alerts and one lost detection path. After WP4,
**governance is the only detector.**

## The current mess (verified)

1. **`api/lib/monitoring/health-check.js`** has 6 hardcoded analyzers
   (`analyzePipelineRisk`, `analyzeRevenueRisk`, `analyzeCustomerRisk`,
   `analyzeExecutionRisk`, `analyzeGoalRisk`, `analyzeOperationalRisk`) → `result.risks` →
   alert candidates. These duplicate governance area evaluators at different thresholds
   with different titles, so dedup misses them.
2. **`api/lib/governance/monitoring.js`** (`runGovernanceMonitoring`) — the real detection
   layer: area evaluators + compound rules + causal diagnosis. Its deterministic findings
   only reach alerts indirectly via AI-refined `alert_candidates`.
3. **`api/lib/connectors/normalize.js`** normalizers emit `risks`/`opportunities` signals —
   including WP2's Ecommerce store-refund-rate and SKU-spike rules — but **`normalized.risks`
   is never consumed by the alert pipeline at all** (verify with grep). The flagship
   SKU-spike detection is currently unreachable.

Alert assembly today (`risk-alerts.js` line ~170):
`alertCandidates = [...healthCheck.risks, ...healthCheck.governance.alert_candidates]`.

## Target state

- `normalize.js` = pure data (metrics + entities). No risk/opportunity signals.
- Governance = ALL deterministic detection, including entity-level rules.
- health-check.js = orchestration only: fetch → normalize → governance → AI enrich →
  score → persist. No analyzer functions.
- Alerts = deterministic governance findings + AI alert_candidates (unchanged dedup).

## Tasks

1. **Parity matrix FIRST (deliver it in your final output).** Before changing code, list
   every deterministic rule currently in (a) the six health-check analyzers and (b) the
   normalizer risk emissions (CRM + Ecommerce + any others). For each rule: the metric(s)/
   fields it reads, threshold, severity — and whether an equivalent governance evaluator
   rule already exists (cite it) or must be ported. Rules reading `brain` fields
   (execution/goal/operational analyzers) count too. Nothing is dropped silently: every
   row ends in `exists | ported | dropped (reason)`.

2. **Port the gaps into governance.** Missing rules go into the area evaluator system
   (`api/lib/governance/area-registry.js` + `api/lib/governance/areas/*` — follow existing
   module patterns; add new area modules only if an analyzer covers an area with no module,
   e.g. inventory-operations). Preserve each ported rule's threshold, severity, title,
   recommendation, and rootCause/impact text (carry rootCause/impact into the finding
   object; extend `toLegacyRisk` to pass them through so alert quality doesn't regress).

3. **Entity-level detection in governance.** `runGovernanceMonitoring` already receives
   `normalized`. Add an entity-rule pass that consumes `normalized.entities`:
   port the two WP2 Ecommerce rules (store refund_rate > 10% high; SKU with refund_rate
   ≥ 3× store average AND ≥ 5 refunds high — "SKU-level refund spike") as governance rules.
   Findings carry `entityType`/`entityId`/`entityLabel` so evidence snapshots include them
   (extend `buildEvidenceSnapshot`'s finding block with these fields when present).
   Then DELETE all risk/opportunity signal emission from `normalize.js` (all normalizers,
   not just Ecommerce). Update WP2 tests: normalizer tests now assert metrics/entities
   only; add governance tests asserting the two Ecommerce rules fire from the same fixture
   data via `runGovernanceMonitoring`.

4. **Rewire health-check.js.** Delete the six analyzer functions and `allRisks`.
   `result.risks` is now built from governance findings via `toLegacyRisk` (keeping the
   exact legacy risk object shape: severity, category, title, description, evidence,
   recommended_action, source, rootCause, impact) so every downstream consumer and the
   stored health-check row shape stay identical. `health_score` = `scoreFromRisks` over
   those risks. `recommended_actions` and `summary` keep working from the new source.
   KEEP: snapshot persistence, DNA recompute call, AI-enrichment gating, `evidence` block,
   `writeHealthCheckToIntelligenceBrief`.

5. **Alert assembly:** in `risk-alerts.js`, alertCandidates =
   `[...healthCheck.risks, ...governance.alert_candidates]` — unchanged line, but
   healthCheck.risks is now governance-derived, so the duplicate-source problem dies.
   Do NOT touch dedup logic.

6. **Kill the wrong-industry fallback.** In `monitoring.js`, `evaluateCompoundRules`
   currently falls back to `COMPOUND_RULES_SAAS` when no schema exists. Change: when
   schema is absent, use the compound rules for the user's industry if derivable from the
   `brain.industry` field via the catalog's industry map, else empty array. A bakery must
   never trigger SaaS compound rules.

7. **Tests.**
   - Each ported rule: one unit test (fake metrics/brain in → expected finding out),
     hand-written expectations.
   - Ecommerce entity rules fire via `runGovernanceMonitoring` from the WP2 fixture data.
   - `normalize.js` emits zero risks/opportunities (mechanical assertion across all
     normalizers with the existing fixtures).
   - Legacy risk shape: one test asserting `toLegacyRisk` output keys exactly match the
     documented legacy shape.
   - health-check smoke test: with governance stubbed inputs, `result` has same top-level
     keys as before (userId, checked_at, schema_version, health_score, risks,
     opportunities, summary, recommended_actions, evidence, governance).
   - All WP1–WP3 suites still pass (update only tests whose behavior legitimately changed
     per task 3; explain each in output).

## Hard boundaries

- Do NOT touch: `ai-advisor.js` prompts/behavior, alert dedup logic, migrations/tables,
  auth, billing, frontend `src/`, graph JSON artifacts, `metric-definitions.js` semantics,
  anything outside the repo (EI folder forbidden).
- Do NOT change the stored health-check result's top-level shape or the legacy risk object
  shape — downstream consumers (cockpit, UI, writeback) depend on them.
- Do NOT weaken thresholds or drop any rule without a `dropped (reason)` row in the parity
  matrix.
- No new dependencies. No new API calls.

## Acceptance criteria

- Parity matrix delivered; zero silent drops.
- `grep -n "analyzePipelineRisk\|analyzeRevenueRisk\|analyzeCustomerRisk\|analyzeExecutionRisk\|analyzeGoalRisk\|analyzeOperationalRisk" api/` → nothing.
- `grep -n "out.risks.push\|out.opportunities.push" api/lib/connectors/normalize.js` → nothing.
- All test suites pass (`node --test` across graph/connectors/monitoring/governance tests).
- A run of `runGovernanceMonitoring` with the WP2 Shopify fixture's normalized output
  produces the SKU-spike finding — proving the demo detection now reaches the alert path.

When done, output: the parity matrix, files changed, test results, and every place you had
to interpret rather than follow this spec.
