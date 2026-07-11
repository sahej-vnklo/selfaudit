# WP2 — Ecommerce + demo-stack semantic normalizers (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (Vercel serverless `api/`, ESM, Supabase). WP1 (graph
loader at `api/lib/governance/graph/`) is merged. This package makes the Ecommerce data
path real: today `api/lib/connectors/normalize.js` has NO normalizer for the `Ecommerce`
category, so Shopify/Shippo/etc. data fetches and feeds nothing. You will add it, with
written metric definitions and fixture tests, because in this product a wrong number is
worse than no number.

## Context — read these first

- `api/lib/connectors/normalize.js` — category normalizers (`CATEGORY_NORMALIZERS` routing
  in `normalizeConnectorData`). Follow the existing patterns: `createNormalizedOutput`,
  `metric()`, `signal()`, `mergeNormalized`.
- `api/lib/connectors/registry.js` — connector definitions. Ecommerce connectors:
  `shopify` (gmv, orders, aov, cart_abandonment, refund_rate), `zohoinventory`
  (stock_levels, fulfilment_rate, inventory_turnover), `shippo` / `shipengine`
  (delivery_time, carrier_performance), `wix`.
- `api/lib/connectors/data-fetcher.js` — how raw connector payloads arrive
  (Composio tool calls; shape: `{ provider, category, data, fetched_at }`).
- `api/lib/governance/metric-snapshots.js` + `api/lib/blueprint/catalog/areas.js` — the
  canonical metric keys the monitoring layer consumes. Ecommerce-relevant keys that already
  exist in the catalog/causal graph: `daily_revenue`, `refund_rate`, `repeat_rate`,
  `conversion_rate`, `fulfilment_time_hrs`, `avg_days_of_stock`, `out_of_stock_skus`.

## Tasks

1. **Create `api/lib/connectors/metric-definitions.js`** — the semantic contract. One
   exported object: for each canonical Ecommerce metric key, a written definition:
   ```js
   export const METRIC_DEFINITIONS = {
     refund_rate: {
       label: 'Refund rate',
       unit: 'percent',
       definition: 'Refunded order count ÷ total order count over the trailing 30 days, ×100. Counts orders with any refund (full or partial). Exchanges represented as refund+reorder count as refunds. Excludes cancelled-before-fulfilment orders.',
       window_days: 30,
       sources: ['shopify'],
       exclusions: ['cancelled orders', 'test orders'],
     },
     // ... every metric the normalizer emits
   }
   ```
   Every metric the new normalizer emits MUST have an entry. Definitions must state:
   numerator, denominator, time window, gross-vs-net stance, refund/exchange handling,
   currency handling (single-currency v1: use the store's primary currency, skip others
   with a console.warn), and exclusions.

2. **Add `normalizeEcommerce(provider, data)` to `normalize.js`** and register it for
   category `'Ecommerce'`. v1 supports `shopify` payload shapes properly; other providers
   degrade gracefully (emit nothing rather than guessing — a provider without verified
   semantics must produce zero metrics, never wrong ones). From Shopify orders/refunds
   data emit at minimum:
   - `daily_revenue` (net of refunds, per definition)
   - `refund_rate` (per definition)
   - `aov` (average order value, add to definitions)
   - `orders_count` (trailing 30d, add to definitions)
   - `fulfilment_time_hrs` (order created → fulfilment created, median, when fulfilment
     timestamps exist)
   - `repeat_rate` (orders from previously-seen customer emails ÷ total, when customer
     data exists)
   Entities: per-SKU rollups for the top movers — `{ type: 'sku', id, label, refund_count,
   refund_rate, orders_count }` for the 10 SKUs with highest refund counts (this feeds
   SKU-level detection later; keep it aggregate-level, no raw customer rows).
   Risks (deterministic only, follow existing signal() patterns): refund_rate above 10% =
   high severity; single SKU with refund_rate ≥ 3× store average and ≥5 refunds = high
   severity ("SKU-level refund spike").
   Defensive parsing throughout: tolerate `data?.orders?.results ?? data?.orders?.data ??
   []` shapes like the CRM normalizer does; never throw on missing fields.

3. **Fixtures + tests** in `api/lib/connectors/__tests__/`:
   - `fixtures/shopify-orders.json` — realistic fabricated payload: ~60 orders across 30
     days, 8 SKUs, one SKU ("ATLAS-HOODIE-M") with a refund spike in the last 9 days,
     mixed fulfilment delays, a couple of partial refunds, one cancelled order, one
     repeat customer.
   - Tests asserting: each emitted metric matches a HAND-COMPUTED expected value from the
     fixture (compute the expectations manually in the test as literals with a comment
     showing the arithmetic — do not recompute them with the same code under test);
     the SKU spike risk fires for ATLAS-HOODIE-M; cancelled orders are excluded per
     definition; unknown provider (`wix`) emits zero metrics and zero risks;
     malformed/empty payload returns null-safe output without throwing.

4. **Reconciliation check (cheap, deterministic):** export
   `reconcileEcommerceRevenue(normalizedEcom, normalizedRevenue)` from `normalize.js` —
   when both Shopify-derived `daily_revenue` (30d sum) and Stripe-derived revenue exist,
   compare within a 15% tolerance; on breach return a `signal('data-quality', 'medium',
   'Revenue sources disagree', ...)` — never silently pick one. Add a fixture test for
   agree + disagree cases. (Wiring it into the health check pipeline happens in a later
   package — just export and test it.)

5. **Registry semantic status:** add a `semantic_status` field to each connector definition
   in `registry.js`: `'verified'` for `shopify`, `stripe`, `hubspot`; `'transport-only'`
   for everything else (they fetch but their category normalizer doesn't verify their
   shape). One-line change per entry; do not restructure the file.

## Hard boundaries

- Do NOT touch: auth, billing/stripe-webhook/checkout, report generation, alerts
  tables/migrations, frontend `src/`, `dist/`, the graph JSON artifacts, anything outside
  this repo.
- Do NOT modify existing normalizers' emitted metrics (CRM/Revenue/Comms/Support/Docs/
  Email behavior unchanged — add, don't alter).
- Do NOT add dependencies.
- Do NOT invent metrics that lack a METRIC_DEFINITIONS entry.

## Acceptance criteria

- `node --test api/lib/connectors/__tests__/` all pass.
- Every metric emitted by `normalizeEcommerce` has a definition entry (add a test that
  cross-checks this mechanically).
- Existing tests (`api/lib/governance/graph/__tests__/`) still pass.
- `git diff --stat` touches only: `normalize.js`, `registry.js` (semantic_status lines),
  new `metric-definitions.js`, new fixtures/tests.

When done, output: files changed, test results, the hand-computed expected values table
from the fixture, and any semantic decision you had to make that isn't covered by the
definitions (list them — do not decide silently).
