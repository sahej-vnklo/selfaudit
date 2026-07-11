# WP1 — Graph Unification (Codex work package)

Copy everything below this line into Codex.

---

You are working in the SelfAudit repo (Vite + React frontend, Vercel serverless `api/`
functions, Supabase). Node is ESM (`"type": "module"`). Your task is a focused refactor of
the causal-graph layer. Do exactly what's specified — no scope creep.

## Context

The repo now contains a versioned causal-graph artifact (already generated, do NOT modify):

- `api/lib/governance/graph/causal-graph.v1.json` — 177 concept nodes, 175 concept edges
  (each with `id, from, to, effect, polarity, strength, conditions[], delay, confidence,
  evidence[], sources[]`), and 7 motifs (named multi-edge failure patterns).
- `api/lib/governance/graph/metric-bindings.v1.json` — seed map from concept-node ids to
  canonical runtime metric keys (e.g. `"mkt.retention-churn": ["churn_rate","repeat_rate"]`).

Currently `api/lib/governance/causal-engine.js` hardcodes a ~50-edge metric-level graph
(`CAUSAL_GRAPH` array, keys like `churn_rate`, `mrr`) plus algorithms (`traceRootCause`,
`projectDownstream`, `buildCompoundDiagnosis`). And `api/lib/intelligence/company-dna.js`
loads those edges by READING THE SOURCE FILE with a regex and `new Function` (see
`loadCausalGraph()` around line 36) — a hack that must die.

## Tasks

1. **Move the metric edges to data.** Extract the `CAUSAL_GRAPH` array from
   `causal-engine.js` verbatim into a new file
   `api/lib/governance/graph/metric-edges.v1.json` as
   `{ "version": "1.0.0", "edges": [ ... ] }`. Do not change any edge content.

2. **Create a loader module** `api/lib/governance/graph/index.js` that:
   - Reads all three JSON files once (module-level cache) using
     `fs.readFileSync` + `JSON.parse` with the `fileURLToPath(import.meta.url)` /
     `path.join(__dirname, ...)` pattern already used in `company-dna.js`.
   - Exports:
     - `getMetricEdges()` → array of metric edges
     - `getConceptGraph()` → `{ nodes, concept_edges, motifs }`
     - `getBindings()` → the bindings map
     - `getConceptEdgesForMetric(metricKey)` → concept edges whose `from` or `to` node is
       bound to that metric key (via bindings, inverted at load time)
     - `getEnrichedMetricEdge(from, to)` → the metric edge, plus (when a concept edge exists
       whose bound metrics include both `from` and `to`) attached
       `{ sources, conditions, delay, concept_edge_id }` from that concept edge. Cache the
       enrichment at load time, not per call.
   - Validates on load: every binding's node id exists in the concept graph; every motif
     edge id exists in `concept_edges`. Throw with a clear message on failure.

3. **Refactor `causal-engine.js`:** delete the hardcoded array; import
   `getMetricEdges()` from the loader; keep `traceRootCause`, `projectDownstream`,
   `buildCompoundDiagnosis` with IDENTICAL signatures and IDENTICAL behavior (they still
   operate on metric edges only). Add one new export
   `getExplanationContext(metricKeys)` → for each key, the bound concept edges
   (via `getConceptEdgesForMetric`) with their `effect, conditions, delay, sources` — this
   is for the AI explanation layer (a later work package consumes it; just build and test it).

4. **Fix `company-dna.js`:** replace `loadCausalGraph()`'s regex/`new Function` hack with a
   direct import of `getMetricEdges()` from the loader. Behavior must be unchanged
   otherwise.

5. **Find any other importer** of `CAUSAL_GRAPH` / the causal-engine internals
   (grep the repo) and update imports accordingly. `api/lib/governance/monitoring.js`
   imports `buildCompoundDiagnosis` — that must keep working untouched.

6. **Tests** (vitest if configured, otherwise a plain node test runnable with
   `node --test`): put them in `api/lib/governance/graph/__tests__/` or the repo's existing
   test location if one exists.
   - artifact files load and validate (no broken motif/binding references)
   - `traceRootCause('csat')` and `buildCompoundDiagnosis(['churn_rate','mrr'])` return the
     same shapes/values as before the refactor (write the expectation from current behavior
     BEFORE refactoring, then assert it after)
   - `getConceptEdgesForMetric('churn_rate')` returns ≥1 concept edge with sources
   - `getEnrichedMetricEdge` attaches concept metadata where a mapping exists
   - `company-dna.js` gets edges without reading source text (assert `new Function` and
     the regex are gone)

## Hard boundaries

- Do NOT touch: `api/lib/auth.js`, anything under billing/checkout/stripe, report
  generation, alert tables/migrations, the frontend (`src/`), or any file under `dist/`.
- Do NOT modify the two generated JSON artifacts (`causal-graph.v1.json`,
  `metric-bindings.v1.json`).
- Do NOT reference, import from, or read any path outside this repo (there is an external
  `~/Documents/EI` folder — it is out of bounds, forever).
- Do NOT rename exported functions used elsewhere.
- No new dependencies.

## Acceptance criteria

- `node -e "import('./api/lib/governance/graph/index.js').then(m => console.log(m.getMetricEdges().length, m.getConceptGraph().concept_edges.length))"` prints `<metric edge count> 175`.
- All tests pass; existing behavior of monitoring/health-check paths unchanged.
- `grep -rn "new Function" api/` returns nothing.
- `git diff --stat` touches only: `causal-engine.js`, `company-dna.js`, new files under
  `api/lib/governance/graph/`, tests, and (if needed) import lines in direct consumers.

When done, output: a summary of files changed, the test results, and any behavior
difference you could not avoid (there should be none).
