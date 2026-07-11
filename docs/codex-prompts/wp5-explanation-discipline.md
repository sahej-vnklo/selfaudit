# WP5 — Explanation discipline: dollars, sources, honest language (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (ESM, Vercel serverless `api/`, Supabase). WP1–WP4.1
are merged: one graph artifact with citations (`getExplanationContext`), verified Ecommerce
semantics, reproducible `evidence_snapshot` on alerts, and governance as the only detector
(override-aware). WP5 makes the *output* trustworthy: every alert speaks in honest language,
carries a defensible dollar figure where one exists, and shows the published source behind
its causal claim.

## Three principles (from the product's external architecture review — non-negotiable)

1. **"Likely driver," never "root cause."** Correlation and graph paths justify a
   hypothesis, not a verdict. User-facing text must say what the evidence supports.
2. **Dollar impact in three tiers, never one confident number:**
   - `observed` — directly measured from data (e.g. refunded dollars in the window)
   - `estimated_exposure` — a RANGE with stated assumptions (e.g. "at the current pace,
     next 30 days"), computed deterministically
   - `none` — insufficient evidence; say so instead of inventing a figure
3. **Every causal claim separates:** company evidence (their numbers) / general mechanism
   (the published source) / remaining uncertainty.

## Tasks

1. **Refund dollars into the SKU rollups.** In `normalize.js` `normalizeEcommerce`, add
   `refunded_amount` (sum of refund subtotals for that SKU in the window) to each SKU
   rollup entity, and `refunded_amount` total as a store-level metric
   (`refunded_amount_30d`) with an entry in `metric-definitions.js`. Update fixture tests
   with hand-computed literals (show arithmetic in comments).

2. **Deterministic financial impact on entity findings.** In `monitoring.js`, extend the
   two entity rules to attach a `financialImpact` object to the finding when data allows:
   ```js
   financialImpact: {
     tier: 'observed+estimated',            // 'observed' | 'observed+estimated' | 'none'
     observed: 560,                          // refunded dollars in window (SKU or store scope)
     observed_scope: 'sku:ATLAS-HOODIE-M',
     estimated_exposure: { low: 392, high: 728, basis: 'current 30-day refund pace continuing, ±30%' },
     assumptions: ['refund pace unchanged', 'no intervention'],
   }
   ```
   Exposure math (deterministic, explainable): `pace = observed / window_days`, projection
   `pace × 30`, range = projection ±30%, rounded to whole dollars. If inputs are missing,
   `tier: 'none'` and NO numbers. Weave the dollars into the finding's `summary` text
   ("Observed refunds $X; if the current pace continues, $Y–$Z over the next 30 days.").
   Include `financialImpact` in `buildEvidenceSnapshot`'s output when present on the risk.

3. **Language discipline in deterministic texts.** Audit every user-facing string emitted
   by parity/entity/compound rules in `monitoring.js` (title, summary, recommendation,
   rootCause, impact): replace verdict language with evidence language where the claim is
   inferential — "is caused by" → "the most likely driver is", "will" → "at the current
   pace, is on track to". Keep field NAMES unchanged (shape stability); only text changes.
   Do not weaken statements that are direct arithmetic facts ("refund rate is 13.33%").

4. **Sources into the AI advisor.** In `ai-advisor.js`:
   - Build a `causal_context` block for the prompt: for each bad/watch metric in the
     governance findings, call `getExplanationContext([...])` and include the matched
     concept edges (id, effect, conditions, delay, sources) — cap at 5 edges per metric,
     highest confidence first.
   - Extend the system prompt rules: (a) "Describe causes as 'likely driver' or
     'consistent with', never as certain root cause, unless the evidence is arithmetic."
     (b) "When you use a causal mechanism from causal_context, name its source in the
     diagnosis (e.g. 'a known fulfilment-to-refund pattern — Factory Physics')." (c) "Never
     cite a source not present in causal_context." (d) "State what remains unverified."
   - Extend the output JSON schema ADDITIVELY: each diagnosis may include
     `"likely_driver": "...", "sources": ["..."], "unverified": "..."`. Existing fields and
     their meanings unchanged — downstream consumers must not break.
   - The word "rootCause" stays as a JSON key (compatibility), but instruct the model that
     its content is the likely driver statement.

5. **Tests.**
   - Fixture: ATLAS refunded_amount hand-computed; store `refunded_amount_30d`
     hand-computed; exposure range math verified against literals (show arithmetic).
   - Entity finding carries correct financialImpact; `tier: 'none'` path when amounts are
     absent (fixture variant without refund subtotals).
   - evidence_snapshot includes financialImpact.
   - Language: mechanical test asserting no parity/entity/compound emitted `summary`,
     `description`, `rootCause` text contains the phrases "is caused by" or "root cause"
     (case-insensitive).
   - ai-advisor: unit-test the prompt-builder function (extract one if needed) — given fake
     governance findings, the built prompt contains causal_context with sources and the new
     rules; NO live API call in tests.
   - All prior suites still pass.

## Hard boundaries

- No migrations (financialImpact lives inside jsonb evidence_snapshot / finding objects).
- No frontend changes. No new dependencies. No new API calls at runtime beyond what exists.
- AI advisor output schema: additive only; never rename/remove existing keys.
- Do not change detection thresholds, override behavior, dedup, or metric semantics
  (except the new `refunded_amount` additions).
- No paths outside the repo (EI folder forbidden).

## Acceptance criteria

- All suites pass (`node --test` across graph/connectors/monitoring/governance tests).
- From the WP2 fixture through `runGovernanceMonitoring`: the SKU-spike finding's summary
  contains observed dollars and an exposure range, and its financialImpact matches the
  hand-computed literals.
- `grep -rin "root cause" api/lib/governance/monitoring.js` returns nothing in emitted
  user-facing strings (comments are fine).
- The ai-advisor prompt builder provably includes concept-edge sources.

When done, output: files changed, test results, the hand-computed dollar arithmetic, one
example finding summary text, and any interpretation you made beyond this spec.
