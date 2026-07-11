# SelfAudit — Foundation Architecture Blueprint

*Written 2026-07-10, after the three-model brainstorm (Claude + ChatGPT + Gemini), the EI audit,
and a code-verified gap analysis. This is the canonical statement of what the foundation is,
what exists, what's missing, and the order of work.*

---

## 1. The foundation in one line

One causal graph (EI) bound to live metric keys, weighted per company by the DNA layer,
detecting deterministically, explaining only along evidenced edges, quantifying from
entity-level data, and asking the owner when — and only when — it knows what it doesn't know.

**Positioning note (from the brainstorm):** the foundation is sold as *use cases*, never as
itself. Use case #1: loss prevention / margin protection. The words "BI", "analytics",
"dashboard", and "company brain" never appear in marketing.

**Founder decision (2026-07-11, final):** SelfAudit stays HORIZONTAL — the product and pitch
claim any industry (the blueprint/logic layer genuinely supports this: industry-agnostic
onboarding, per-schema rules, connector catalog across 18 categories). The external
reviewers' vertical-wedge advice is retained below only as interview-fallback and GTM
tactics, not product direction. Additionally: the EI repo is READ-ONLY reference — SelfAudit
derives a one-way graph snapshot into its own repo; no wiring between the two, ever.

---

## 2. The four layers (what "company brain" means concretely)

| Layer | What it is | Code today |
|---|---|---|
| 1. Blueprint | Industry, areas, unit types, compound rules, user-defined KPIs | `api/lib/blueprint/` — built (13 industries, area catalog) |
| 2. Qualitative state | Offer, funnel, bottlenecks, goals, session memory, unverified assumptions | `api/lib/intelligence/company-brain.js` — built |
| 3. Quantitative history | Daily metric snapshots with deltas | `area_metric_snapshots` — built |
| 4. Learned causality (DNA) | Universal causal edges re-weighted against THIS company's own history | `api/lib/intelligence/company-dna.js` + `company_causal_patterns` — built, but runs on the small graph |

On top: deterministic monitoring (`api/lib/governance/monitoring.js`), AI explanation with
guardrails (`api/lib/governance/ai-advisor.js`), probing (not yet built), chat
(`api/agent-query.js` — built).

The reasoning substrate is **EI** (`~/Documents/EI/brain/`): 177 nodes, 175 evidenced causal
edges (polarity, strength, conditions, delay, confidence, evidence documents, sources),
7 motifs. Source audit (2026-07-10): 100% of edges sourced, QC-enforced; ~92% rest on
identities, published research, standards, or the named canon. Remaining EI work: chapter-level
citations (67 vague), verification pass, confidence recalibration.

---

## 3. Today vs. target — the honest table

| Claim (target state) | Truth today |
|---|---|
| "Connects any tools" | 91 connectors *registered* via Composio across 18 categories. But registration ≠ working (see §4). |
| "Learns which fields mean revenue/margin/refunds" | **0% built.** Six hand-written category normalizers; the CRM one is HubSpot-shaped. No AI binder, no validation layer, no binding store, no drift detection. |
| "Identity map across systems" | **0% built.** No entity resolution anywhere. |
| "Asks questions to fill gaps" | **0% built** as a system (hooks exist: `assumptions_unverified`, coverage tracking). |
| "Math watches daily, graph explains, alerts carry diagnosis" | **Built and running.** The strongest part. |
| "Gets smarter per company daily" | Half-built: DNA works, but on the 50-edge graph; no probe/identity learning. |
| "Works directly on databases (no BI tool)" | **Not designed today.** No Postgres/MySQL/warehouse connector exists. See §6. |

**Rule until the gap closes:** never demo or write "maps itself." Say "pre-built for your
stack" — true, and sufficient for a wedge vertical where the stack is known.

---

## 4. Connector strategy — why "just HubSpot + Stripe," and why Composio's hundreds don't save us

### What Composio actually provides
Composio is **transport**: OAuth, token refresh, rate limits, and raw API calls to hundreds of
tools. It answers *"can I fetch the data?"* It does not answer *"what does this data mean?"*

### Where meaning actually happens (and why it's the product)
Meaning lives in `api/lib/connectors/normalize.js` — OUR code that turns raw payloads into
canonical metrics (`open_deals`, `churn_rate`, `refund_rate`). Facts verified in code:

- **91 connectors registered, 6 normalizers written** (CRM, Revenue, Comms, Support, Docs,
  Email). Twelve categories — including **Ecommerce, the wedge vertical** — currently have
  NO normalizer: their data fetches and then feeds nothing.
- The CRM normalizer reads **HubSpot's field names** (`lifecyclestage`, `hs_lead_status`,
  `properties.dealstage`). Pipedrive/Zoho/Salesforce payloads map partially or wrongly.
- Therefore true semantic coverage today ≈ HubSpot + Stripe (+ partial comms/support/email).

### Why "hundreds of connectors" is a vanity number for anyone
Every tool ships different field names, units, currencies, statuses, and edge cases. A
connector without a verified semantic mapping produces **wrong numbers**, and in an alerting
product wrong numbers are fatal (trust is binary — one false $5,000 alert = churn). Nobody —
including Composio — can pre-write correct semantics for our canonical metric layer across
hundreds of tools. That mapping IS SelfAudit's proprietary work; it is also (per the
three-model consensus) the *implementation moat* competitors leave to customers.

### The strategy (hybrid, in order)
1. **Hand-verify the wedge stack** (~8 connectors: Shopify, Stripe, QuickBooks/Xero, one
   support tool, one 3PL/fulfillment source, email/Slack). Golden-tested, reconciliation-
   checked. These are marketing-grade "supported."
2. **AI binder for the long tail** (build item #5): AI proposes field→metric bindings at
   setup; deterministic validation (type/unit/reconciliation against a second source) accepts
   or rejects; low confidence → probe question; accepted bindings frozen per company;
   drift detection re-opens them. AI maps once — runtime is pure lookup.
3. **Registry honesty:** every connector carries a semantic status — `verified` /
   `ai-bound` / `transport-only` — and the UI never claims more than the status.

---

## 5. Build items (from the 2026-07-09/10 sessions)

**Brain unification**
1. Adopt EI edge format as the single standard; retire the hardcoded 50-edge `CAUSAL_GRAPH`
   in `api/lib/governance/causal-engine.js`.
2. Export EI graph as a versioned JSON artifact; causal-engine loads it at runtime.
3. Add `metrics:` binding field to EI nodes (concept → canonical metric key).
4. Point company DNA at the unified graph.

**Data layer**
5. AI auto-binder at setup + deterministic validation + per-company frozen bindings + drift
   detection. Keep hand-coded mappings for the wedge stack.
6. Per-company **entity identity map**: deterministic joins only (email, order ID,
   invoice #); fuzzy candidates → probe queue for one-tap confirm; LLM never merges silently.
7. Deeper aggregates (per-SKU/supplier/segment rollups) + **on-demand drill** at alert time
   (fetch only entities explaining the change; use; discard). Preserves process-don't-store.

**Diagnosis & trust**
8. Constrain AI explanations to paths through evidenced graph edges with conditions checked;
   no path = "unexplained anomaly + what to check." Detection stays deterministic — sacred.
9. Every alert carries a dollar impact computed from the data layer.
10. Surface the edge's source in the diagnosis ("pricing-waterfall effect — Marn & Rosiello,
    HBR"). Sources are the trust-transfer mechanism.
11. Golden-test harness for diagnoses; precision / false-positive rate as first-class metrics.

**Probing**
12. Gap-detection → question queue. Triggers: zero-coverage areas, unknown edge conditions,
    unexplained anomalies, data-vs-stated contradictions. One question at a time; answers
    stored with provenance ("owner-stated, date"); unverified until data confirms.

**EI side**
13. Source-verification pass (batches of ~20), chapter-level citations, demote the 4
    practice-only "high" edges, keep filling regions that back the wedge metrics first.

**Build order:** 1-4 (graph merge) → 6 (identity, narrow) → 5 (binder) → 12 (probes) →
7 (drill) → 8-11 (trust layer) — with 13 running continuously in parallel.

---

## 6. The direct-database question (can SelfAudit replace BI tools on raw databases?)

**Current answer: no — not designed, not present.** There is no Postgres/MySQL/Snowflake/
BigQuery/warehouse connector in the registry. SelfAudit today is SaaS-API-first: it reads
tools, not databases. The chat feature (`api/agent-query.js`: planner → context gatherer →
plain-English answer) operates over connected-tool data and the brain — not over arbitrary SQL.

**Is it reachable? Yes — via the same AI binder (item #5), which is exactly the mechanism
that makes raw databases possible.** A customer database has NO standard field names, so
hand-coded normalizers can never exist for it; but the binder flow generalizes cleanly:

Databases speak SQL only — there is no "see the whole database at once," and none is needed.
SelfAudit interacts the way an analyst does, automated:

1. Read-only SQL connector (introspect `information_schema` — the schema map, never write).
2. Sample 20–50 rows per table to understand column meaning.
3. AI proposes table/column → canonical-metric bindings AND writes the SQL that computes each
   metric (e.g. `revenue = SUM(net_amt) WHERE status='paid'`) — once, at setup.
4. Deterministic validation reconciles each query's output against a second source (e.g.
   Stripe payouts). Low-confidence bindings become probe questions; accepted queries are
   **frozen** per company; schema drift re-opens them.
5. Daily monitoring = replaying the frozen queries — small aggregate results, no AI in the
   loop. Alert-time investigation = narrower drill-down SQL (targeted questions, like a
   doctor ordering specific tests), never full-table scans.
6. From then on the daily loop treats the database like any other connector — deterministic
   detection, causal explanation, plain-English answers. No dashboard is ever built; the
   answer to "what's wrong" arrives as a diagnosed alert, and any question is answered in
   chat. That is the BI-replacement claim, made honestly: **not "we visualize your data" but
   "you stop needing visualization."**

**Sequencing caution:** the wedge customer (SMB on SaaS tools) rarely has a raw database;
direct-DB matters for slightly larger/custom-built businesses. Ship it as connector class
v2 after the binder proves itself on SaaS payloads — same engine, bigger market later.

---

## 7. Cleanup list (do alongside the build — each is verified in code, not speculative)

1. **Three overlapping risk-detection paths** produce duplicate/conflicting alerts:
   `normalize.js` emits risks, `health-check.js` has its own hardcoded analyzers
   (`analyzePipelineRisk` etc. duplicating the same "empty pipeline" logic), and governance
   monitoring emits findings. Consolidate detection into governance only; delete the
   hardcoded analyzers and `normalize.js` risk emission.
2. **`company-dna.js` loads `causal-engine.js` via regex + `new Function`** (reads source
   text, extracts the array, `eval`s it). Fragile. Dies naturally when the graph becomes a
   JSON artifact (build item #2) — do them together.
3. **`toLegacyRisk` and legacy risk shapes** in `monitoring.js` / `health-check.js` — remove
   after (1).
4. **CRM normalizer is HubSpot-specific but routed for 6 CRM providers** — falls out of the
   binder work; until then, mark non-HubSpot CRMs `transport-only` in the registry.
5. **12 of 18 connector categories have no normalizer** — including Ecommerce (Shopify!).
   Write the Ecommerce normalizer as part of the wedge-stack verification. Highest priority
   cleanup — the wedge vertical currently produces zero metrics.
6. **Wrong-industry fallback:** `monitoring.js` falls back to `COMPOUND_RULES_SAAS` when a
   user has no schema — SaaS rules can fire for a bakery. Fallback should be industry-derived
   or empty.
7. **Goal state duplicated:** `business_state.active_goal/goal_score` vs the goals service
   (`goal_hierarchy`). Pick the goals service as source of truth; make brain read-through.
8. **Ad-hoc table creation:** `agent-query.js` carries "run this SQL once in the dashboard"
   comments (`agent_findings`). Move all tables into `supabase/migrations/`.
9. **Env var hygiene:** server code falls back to `VITE_`-prefixed secrets
   (`VITE_CLAUDE_API_KEY`, `VITE_SUPABASE_URL`). `VITE_` vars are bundled into client builds —
   service keys must never use them. Standardize server-side names; audit what shipped.
10. **Model pin:** `ai-advisor.js` hardcodes `claude-sonnet-4-6`. Centralize model choice in
    one config; adopt current model ids.
11. **`dist/` build output inside the repo** — ensure ignored, remove if tracked.
12. **`docs/` clutter:** personal files (immigration .docx, job materials), pitch-deck
    drafts, and screenshots sit untracked in the product repo. Move personal files out
    entirely; commit or archive the rest deliberately.
13. **API sprawl:** 50+ serverless functions under `api/`. Vercel plans cap function count;
    consolidate related endpoints (e.g. voice-waitlist admin trio, connector prefs/status)
    behind fewer handlers when next touched — not a dedicated rewrite.

---

## 8. External architecture review (ChatGPT + Gemini, 2026-07-10) — verdicts adopted

Both models reviewed the full design independently. Consensus verdict: **"architecturally
disciplined, commercially overbuilt"** (ChatGPT) / **"remarkably mature — you solved the
hallucination problem that kills 99% of AI data analysts; now stop building infrastructure
for a $100M company"** (Gemini). Adopted corrections:

**Endorsed — keep as-is:** deterministic-first detection, LLM-as-bounded-explainer,
constrained explanations along cited graph paths, identity discipline, frozen bindings,
provenance. This trust boundary IS the moat.

**V1 scope cuts (both models converged independently):**
- **Company DNA → shadow mode.** SMB data is sparse/seasonal/confounded; lag correlation
  learns noise ("Tuesday rain causes Wednesday refunds"). Keep it running dark (log outputs,
  never act on them); activate only with statistical controls: minimum samples, volume
  normalization, seasonality controls, shrinkage toward the universal prior, holdout checks.
- **AI binder → deferred.** V1 supports ONLY the hand-verified wedge stack. A prospect on
  BigCommerce is "not a fit for the beta." Binder ships after core value is proven.
- **Direct-database connectors → deferred** (v2 connector class, as already planned).
- **General Q&A → scoped.** Answer questions about active alerts, known metrics, supported
  incident types, and evidence — never promise "ask anything about your business."
- **Probe/confirm queues → onboarding + incident review only.** Three queues demanding owner
  labor = fatigue = churn. Fuzzy identity matches are dropped, not queued, in v1. A probe
  fires only when the answer changes whether/how an alert fires.
- **Graph → vertical namespace.** Runtime loads a wedge subset (~20-30 concepts, 30-50 edges,
  5-10 motifs, 10-20 canonical metrics), not the whole 177-node graph. Depth beats breadth:
  at 175 edges / 177 nodes the graph is a sparse forest, and cross-system chains only exist
  where edges are dense. Long-term model: small universal core + vertical incident packs +
  company evidence adjusting confidence (never rewriting causal truth automatically).

**New requirements the review surfaced:**
1. **Semantic correctness > structural validation.** A binding can pass type/unit/
   reconciliation checks and still be semantically wrong (gross vs net of refunds, invoice vs
   recognized revenue, tax in/out, exchanges-as-refunds, multi-currency, edited orders).
   Every canonical metric needs: a precise accounting definition, source-specific calculation
   logic, reconciliation tolerance, known exclusions, versioned tests on real fixtures, and a
   visible data-confidence score. The LLM never invents metric formulas.
2. **Auditable fact layer (storage posture revised).** On-demand raw fetch at alert time is a
   mirage: rate limits, pagination, records edited/deleted since the incident, alerts that
   can't be reproduced. Store a minimal normalized fact layer — canonical event IDs,
   timestamps, metric values, relevant dimensions, source record hashes, binding version,
   detection-rule version, and the evidence used by each alert. Raw payloads still discarded.
   Honest privacy claim: "we retain normalized business facts, never raw records."
3. **Dollar impact in three tiers, not one number.** Observed loss (measured) / estimated
   exposure (range + assumptions) / risk-without-estimate. Forced single numbers = false
   precision = trust damage.
4. **Language discipline:** alerts say "likely driver," never "root cause," unless direct
   evidence exists. Each alert separates: company evidence / general mechanism (citation) /
   remaining uncertainty. Citations live in the evidence view, not the headline.
5. **The eval framework is the real product:** historical incident replay, false-positive
   review, precision by motif, detection delay, estimated-vs-verified impact, owner action
   rate. A deterministic system can be consistently wrong; only measurement proves it isn't.

**The 90-day product (both models, near-identical):** one wedge (Shopify brands), 3-5
hand-verified integrations (Shopify orders/refunds, Stripe, one support tool, optional 3PL),
~5 deterministic incident detectors — flagship: SKU/batch-level return-spike detection —
human-reviewed alerts before they reach customers, manual onboarding. Target alert:
*"Refunds for SKU X rose 6%→18% over nine days; support tickets tied to it tripled in the
same window. Increase began with fulfillment batch B-104. Observed refunds $8,420; estimated
remaining exposure $11,000–17,000."* That is a sellable product.

## 9. Guardrails (unchanged, non-negotiable)

- **Analyst-depth, not content-depth (founder decision 2026-07-11):** diagnosis depth =
  a senior analyst on structured data — decomposition, timing, cross-area joins. The system
  counts and correlates; it does NOT read emails, ticket text, or invoice contents. Interview
  framing: "It doesn't read your email. It works like your analyst would — on the numbers."
- **Deterministic-first:** math detects; AI only explains, handcuffed (never invent numbers,
  never overrule severity, never mention zero-coverage areas).
- **Selection over generation:** the explainer chooses among evidenced edges; it does not
  freestyle causality.
- **Identity is never guessed:** exact keys or human-confirmed. No silent LLM merging.
- **Trust is binary:** precision > coverage. Miss a weak signal before sending a false alarm.
- **Claim only what exists:** "pre-built for your stack" until the binder ships.
- **One brain, two products** (EI guardrail #7): the graph feeds SelfAudit and EI; one
  go-to-market motion.
