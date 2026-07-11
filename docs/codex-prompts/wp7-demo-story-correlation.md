# WP7 — Support-ticket correlation + demo seed (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (ESM, Vercel serverless `api/`, Supabase). WP1–WP6 are
merged. WP7 makes the flagship alert's full story computable and provides a seed path so it
can be shown live. Target alert text (every clause must be earned by real computation):

> "Refunds for SKU ATLAS-HOODIE-M rose to 60% over nine days — support tickets tied to its
> orders tripled in the same window. Observed refunds $500; if the current pace continues,
> $350–$650 over the next 30 days."

**Design principle (non-negotiable, from the founder):** analyst-depth, not content-depth.
The system counts, joins on exact IDs (order IDs), and compares time windows. It NEVER
reads ticket text, subjects, emails, or invoice contents. Any temptation to keyword-match
ticket bodies is out of scope — refuse it.

## Tasks

1. **Support normalizer: structured ticket entities + window ratio.** In `normalize.js`
   `normalizeSupport`, additively (existing metrics unchanged):
   - Emit `ticket` entities when the payload has ticket rows:
     `{ type: 'ticket', id, created_at, order_id }` — `order_id` only when the ticket row
     carries an explicit order reference field (e.g. Gorgias-style order association);
     null otherwise. NO parsing of subject/body text to find order numbers.
   - Emit metric `support_ticket_surge_ratio`: tickets created in the last 9 days ÷
     tickets created in the 9 days before that (both from `created_at`; anchor on
     `data.as_of` else newest ticket). Emit only when the prior window has ≥ 3 tickets
     (a ratio over a near-zero base is noise). Add a `metric-definitions.js` entry
     documenting numerator/denominator/windows/threshold.

2. **SKU → order linkage in Ecommerce rollups.** In `normalizeEcommerce`, add to each SKU
   rollup: `order_ids` — array of order ids containing that SKU (cap at 200, note the cap
   in a comment). This is the deterministic join key for ticket correlation.

3. **Correlation in governance.** In `monitoring.js`, extend the SKU-spike entity rule:
   when the run's `normalized` data has both the spiking SKU's `order_ids` and ticket
   entities:
   - Count tickets whose `order_id` is in the SKU's order_ids, split into last-9-days vs
     prior-9-days windows. If prior ≥ 2 and recent ÷ prior ≥ 2, append to the finding
     summary: ` Support tickets tied to its orders ${ratioText} in the same window.`
     (ratioText: "doubled" for ≥2, "tripled" for ≥3, "rose Nx" above that — integer N,
     round down).
   - Fallback: if no ticket has order linkage but `support_ticket_surge_ratio` ≥ 2 exists,
     append the weaker, honest phrasing: ` Store-wide support volume ${ratioText} in the
     same window.`
   - Neither condition met → summary unchanged. Correlation details (counts, windows,
     ratio) go into the finding via `extra` so `buildEvidenceSnapshot` freezes them.
   - The correlation NEVER creates an alert alone and never changes severity — it only
     enriches the SKU-spike finding.

4. **Demo seed script** `scripts/seed-demo.mjs` (new folder ok):
   - Reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from process.env (never hardcode,
     never log values) and a `--user <uuid>` argument (fail with usage text if missing).
   - Builds a demo `normalized_data` payload with the complete hoodie story by importing
     and running the REAL normalizers over two fixtures (do not hand-write normalized
     output): extend `__tests__/fixtures/shopify-orders.json`-style data into a new
     `scripts/fixtures/demo-store.json` (orders; the ATLAS spike; realistic spread) and
     `scripts/fixtures/demo-tickets.json` (support tickets: ~4 in the prior window, ~13 in
     the last 9 days, most carrying order_ids of ATLAS orders). Merge with
     `mergeNormalized`.
   - Upserts into `connector_snapshots` for that user (`normalized_data`, fresh
     `fetched_at`) so the next health check consumes it, and prints (no secrets): what was
     seeded, and the manual next step — trigger a health check (`api/run-health-check` or
     the admin trigger) and open the Cockpit.
   - Add `"seed:demo": "node scripts/seed-demo.mjs"` to package.json scripts.

5. **Tests.**
   - normalizeSupport: fixture with tickets across both windows → hand-computed
     `support_ticket_surge_ratio`; below-threshold prior window → metric absent; ticket
     entities carry order_id only from explicit fields.
   - SKU rollup `order_ids` correct on the WP2 fixture (hand-count).
   - Correlation: linked path appends "tripled" phrasing with hand-computed counts
     (e.g. prior 4 linked, recent 13 → 13/4 = 3.25 → "tripled"); fallback path appends
     store-wide phrasing; neither → unchanged summary; correlation data present in
     evidence snapshot.
   - All prior suites pass.

## Hard boundaries

- NO reading/matching of ticket text, subject, body, or email content anywhere.
- No migrations. No new dependencies. No frontend changes. No changes to thresholds,
  overrides, dedup, or existing metric semantics. Nothing outside the repo.
- Seed script: upsert only the demo user's `connector_snapshots` row — touch no other
  table, no other user, never print env values.

## Acceptance criteria

- All suites pass (`node --test` across graph/connectors/monitoring/governance).
- Running the correlation over the demo fixtures through `runGovernanceMonitoring`
  produces the full target alert sentence (SKU spike + dollars + "tripled in the same
  window"), and the evidence snapshot contains the correlation counts.
- `grep -rin "subject\|body_text\|snippet" api/lib/connectors/normalize.js` shows no new
  ticket-content reads.

When done, output: files changed, test results, the exact final alert summary produced
from the demo fixtures, hand-computed correlation arithmetic, and any interpretation made.
