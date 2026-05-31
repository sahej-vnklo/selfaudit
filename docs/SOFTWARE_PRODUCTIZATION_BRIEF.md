# SelfAudit — From SaaS to Software (Productization Brief)

*A short, founder-level roadmap for turning the current SelfAudit cloud codebase into a deployable software product that can ship as both Tier 1 (Cloud) and Tier 2 (Embedded). Read this when brainstorming next architectural moves.*

---

## WHERE YOU ARE TODAY (the current stack)

| Layer | What's there | Coupling to specific vendor |
|---|---|---|
| Frontend | React 18 + Vite | None (portable) |
| Backend | 25+ Vercel serverless functions in `/api` | **High** — Vercel-specific runtime + cron |
| Database | Supabase (Postgres + RLS + Auth) | **High** — uses Supabase client SDK, auth, edge functions |
| LLM | Anthropic SDK direct (Haiku planner + Sonnet reasoner) | **High** — `fetch` calls to api.anthropic.com hardcoded |
| Auth | Supabase magic-link auth | **High** — no SAML/SSO abstraction |
| Billing | Stripe Checkout + Webhooks | **Medium** — Stripe-coupled but isolated to ~5 files |
| Email | Resend | Low — easy to swap |
| Connectors | HubSpot live; Stripe, Slack, Gmail, Notion coming | Medium — OAuth callbacks hit Vercel-hosted endpoints |
| Cron | Vercel cron (`vercel.json`) | **High** — Vercel-specific |
| Telemetry | PostHog + Sentry | Low |
| Frontend env | `VITE_*` env vars baked into bundle | **Critical issue** — `VITE_CLAUDE_API_KEY` is exposed client-side (must fix even for Cloud) |

**Quick verdict:** the codebase is solid for Cloud. It is NOT ready for Embedded deployment. About 6 things need to change before an enterprise can install this on their own infrastructure. None are hard individually. Together they're 2–3 months of focused work.

---

## WHERE YOU NEED TO BE (the embedded software target)

For SelfAudit Embedded to ship, the engine must be:

1. **Containerized** — runs as `docker run selfaudit:latest` with environment config
2. **Runtime-portable** — does not depend on Vercel serverless. Runs on any Node host (AWS ECS, GKE, on-prem K8s, even a single VM)
3. **Database-portable** — works with any standard Postgres, not just Supabase Cloud
4. **LLM-portable** — Anthropic API, AWS Bedrock, Azure OpenAI, or customer's own model — swappable by config
5. **Auth-portable** — Supabase magic link OR SAML/SSO (Okta, Azure AD, custom OIDC)
6. **Billing-optional** — Stripe for Cloud, or skip billing entirely for Embedded (license is in the contract)
7. **Network-portable** — connectors work whether the customer's HubSpot is cloud or on-prem
8. **Auditable** — every model call, every action, every state change logged for enterprise compliance

The good news: **most of this is wrapping existing code in adapters**, not rewriting it. The architecture you have is structurally fine. It's the *boundary conditions* that need to be loosened.

---

## THE 8 GAPS (specific, prioritized)

### GAP 1 — Containerize everything (priority: CRITICAL, ~1 week)

**Today:** Vercel auto-builds. No Dockerfile exists.

**Need:** A `Dockerfile` that builds the entire app (frontend + a Node.js Express/Fastify server that hosts the API routes that are currently Vercel functions). Plus a `docker-compose.yml` that brings up app + Postgres + Redis (for jobs) for local dev and customer deployment.

**Impact:** Single biggest unlock. Once containerized, you can deploy anywhere — including on-prem.

**Side benefit:** local dev gets faster. New engineers onboard in `docker compose up`.

---

### GAP 2 — Replace Vercel serverless with a proper Node server (priority: CRITICAL, ~1–2 weeks)

**Today:** Each file in `/api/*.js` is a Vercel function. Cron is `vercel.json`.

**Need:** A single Node server (Express or Fastify) that mounts all the existing handlers as routes. Background jobs (governance pass, weekly digest) run as scheduled workers via BullMQ + Redis or node-cron.

**Why:** Vercel-coupled = locked to Vercel. Self-hostable = portable.

**How to make this not painful:** keep the file layout. Write a thin router that auto-mounts every file in `/api/` as a route. The handlers themselves don't change. Only the runtime around them does.

---

### GAP 3 — LLM adapter layer (priority: HIGH, ~3 days)

**Today:** 6+ files call `https://api.anthropic.com/v1/messages` directly via `fetch`. The API key comes from `process.env.CLAUDE_API_KEY`.

**Need:** A `lib/llm/` adapter with one interface:
```
llm.completion({ model: 'planner' | 'reasoner', system, messages, max_tokens })
```
Behind the scenes, it routes to whichever provider the env config says: `LLM_PROVIDER=anthropic` (default), `LLM_PROVIDER=bedrock`, `LLM_PROVIDER=azure`, `LLM_PROVIDER=ollama` (for on-prem), etc.

**Why it matters:** Enterprises will demand "run this on our private LLM endpoint." Without the adapter, you say no and lose the deal. With it, you say yes in five minutes.

**Bonus:** the adapter is also where you log every LLM call (audit trail) and track cost.

---

### GAP 4 — Database abstraction (priority: HIGH, ~1 week)

**Today:** Most queries go through `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` from `@supabase/supabase-js`. Some queries use Supabase RPC functions. Auth is Supabase Auth.

**Need:** A `lib/db/` layer that wraps Supabase OR a plain `pg` Postgres connection. Most of the codebase doesn't need to change — only the client initialization.

**The harder part:** Supabase-specific features (Row-Level Security, RPC functions, edge functions in `supabase/functions/`) need plain-Postgres equivalents. Audit your migrations for any Supabase-only SQL.

**Pragmatic shortcut:** Supabase can be self-hosted (it's open source). For Embedded customers who can run Docker, you can ship Supabase as part of the stack. That removes the urgency of full DB abstraction. **This may be the smartest move.**

---

### GAP 5 — Auth provider abstraction (priority: MEDIUM, ~1 week)

**Today:** Supabase magic-link auth. `src/components/auth/Login.jsx`, `Signup.jsx`, `api/send-auth-link.js`.

**Need:** A `lib/auth/` interface that has:
- `auth.signIn()` / `auth.signOut()`
- `auth.getUser(token)` — validates the bearer token
- Pluggable providers: Supabase (default for Cloud), SAML (enterprise), OIDC (enterprise), magic-link (fallback)

**Why:** Enterprises mandate SSO. They will not let employees create individual accounts. SAML/Okta/Azure AD support is table stakes for any Tier 2 sale.

**Recommendation:** use `@workos/node` or `WorkOS` SDK — it handles SAML + OIDC + magic-link with one interface. Saves you 2 months of building this yourself.

---

### GAP 6 — Billing as an optional module (priority: MEDIUM, ~3 days)

**Today:** Stripe Checkout is wired into signup. Webhooks unlock paid tiers. The whole post-payment flow depends on Stripe events.

**Need:** A `lib/billing/` module that's optional. For Cloud, it's Stripe. For Embedded, it's `null` — entitlements come from a license file (signed JWT issued by you) that the deployed instance validates.

**The cleanest pattern:** entitlements live on the `profiles` table as a `tier` field. Stripe webhooks update it for Cloud. For Embedded, a startup script reads `SELFAUDIT_LICENSE_KEY` env var and sets the tier directly.

---

### GAP 7 — Audit trail + observability (priority: MEDIUM-HIGH, ~1 week)

**Today:** PostHog for product analytics. Sentry for errors. Console logs in handlers.

**Need:** A first-class `audit_log` table that records every:
- LLM call (prompt, response, latency, cost, model used)
- User action (audit started, alert acknowledged, report saved)
- System decision (governance finding fired, alert generated, action recommended)
- Auth event (sign-in, sign-out, token issued)

Plus structured logging (JSON logs to stdout, parseable by Datadog/Splunk/whatever the customer uses).

**Why:** enterprises demand "show me everything the AI did on our data, ever." Without this, you fail security review.

---

### GAP 8 — Connectors for self-hosted instances (priority: LOW for now, ~ongoing)

**Today:** HubSpot OAuth callbacks land on `tryselfaudit.com/api/connect/hubspot/callback`. Works for Cloud only.

**Need:** When a customer deploys Embedded, OAuth callbacks need to land on their domain (e.g. `selfaudit.acme-corp.com/api/connect/...`). This is a configuration change, not a code change — every connector OAuth handler just needs to read `process.env.APP_URL` for the redirect URL.

**Bonus future work:** support customers' on-prem versions of common tools (on-prem HubSpot is rare, but Jira/Confluence Data Center, on-prem GitHub, etc. exist). Each gets a connector variant.

---

## THE PHASED ROADMAP

Three phases. 6 months end-to-end if Cloud keeps shipping in parallel. Faster if Tier 2 becomes the priority.

### Phase 1 — Make it deployable (Month 1)

Goal: anyone can `docker compose up` and have a working SelfAudit. This unlocks both:
- Better local dev experience (today)
- The path to enterprise (future)

Deliverables:
- `Dockerfile` (multi-stage build, ~200MB final image)
- `docker-compose.yml` for local dev (app + Postgres + Redis)
- Convert Vercel functions to mounted Express routes (file structure unchanged)
- Replace `vercel.json` crons with BullMQ workers
- Document the local-dev quickstart in README

**Side benefit:** you can now self-host the Cloud version anywhere if Vercel ever fails you or gets expensive.

### Phase 2 — Make it portable (Month 2–3)

Goal: SelfAudit can run with any LLM, any auth, any Postgres. The boundary conditions are loose.

Deliverables:
- `lib/llm/` adapter (Anthropic, Bedrock, Azure, optional Ollama for on-prem)
- `lib/auth/` adapter (Supabase + WorkOS for SAML/OIDC)
- `lib/db/` standardization (works with self-hosted Supabase OR plain Postgres)
- `lib/billing/` as optional module (Stripe OR license-key mode)
- Configuration documented in a single `config.js` schema with sane defaults

**At the end of Phase 2:** you can offer a serious enterprise pilot. Not at scale yet, but credibly.

### Phase 3 — Make it enterprise-ready (Month 4–6)

Goal: pass an enterprise security review. Ship to first paying Embedded customer.

Deliverables:
- `audit_log` table populated by every action; UI surface for admins
- Structured JSON logging + Datadog/Splunk export adapters
- SOC 2 Type II process initiated (~6 month timeline, must start by Phase 3)
- License key system (signed JWT, validation at startup)
- Admin/operator UI (separate from end-user UI) for monitoring deployments
- A deployment runbook + customer-facing install docs

**At the end of Phase 3:** you can sign a Tier 2 contract. First Embedded customer goes live.

---

## THE 3 THINGS TO DO THIS MONTH (the smallest unlock)

If you only have 4 weeks of focus to spend on this, do these three. They give you 80% of the strategic optionality:

### 1. Write the Dockerfile + docker-compose (1 week)
Even if you don't deploy it anywhere else, having it forces you to surface every hidden Vercel dependency. You'll find half of Gap 2 just from doing this.

### 2. Add the `lib/llm/` adapter (3 days)
The cheapest, highest-impact change. Six files call Claude directly. Refactor them to go through one function. Now you're one config flip away from Bedrock or any other provider. This single change is the difference between "we can run on your private LLM" and "we can't."

### 3. Move `VITE_CLAUDE_API_KEY` server-side (1 day — critical security fix)
**This is actually urgent even for Cloud.** Right now your Claude API key is bundled into the frontend JavaScript. Anyone who views your site source can steal it and rack up your Anthropic bill. Every Claude call must go through a server-side proxy that holds the key. The agent-query endpoint already does this — just make sure the audit chat does too.

If those three are done, you've:
- Unlocked containerized deployment (everything else flows from there)
- Made LLM-pluggability one config away
- Plugged a security hole you didn't notice

---

## RISKS & WATCHOUTS

1. **Don't productize prematurely.** Tier 2 only matters if Cloud has PMF. If you spend 3 months on Embedded readiness while Cloud has $0 MRR, you've optimized the wrong loop. Cloud first, then this. The Phase 1 work (containerization) is the only thing worth doing today regardless.

2. **Avoid the "rewrite trap."** Every gap above is a *wrap*, not a *rewrite*. If you find yourself rewriting handlers, stop. The architecture you have is fine. Only the runtime boundaries change.

3. **Don't build SAML before you have a deal that needs it.** SSO integration takes 2 weeks and only matters once you have an actual enterprise pilot. Build the adapter interface now (free), build the SAML provider only when a contract is on the table.

4. **Beware Supabase coupling getting worse, not better.** Every week you don't add the `lib/db/` boundary, more code couples to Supabase-specific features. Add the layer EARLY even if you don't migrate off Supabase. The boundary protects you.

5. **Audit trail is non-negotiable.** Enterprises will ask "show me every prompt your AI ever ran on our data." If you can't, the deal dies. Build the `audit_log` table during Phase 1 — it's free now and infinitely expensive to retrofit later.

6. **License keys are easy. Don't overbuild.** A signed JWT issued by you, validated at instance startup, with an expiry and tier flag — that's the whole license system. Don't build DRM. Trust contract enforcement.

---

## ONE GUT-CHECK QUESTION

After you read this, the question to ask yourself is:

> *"Am I building SelfAudit Cloud as fast as I can, OR am I building SelfAudit Software that happens to also have a Cloud SKU?"*

The answer should be the second one. **Today's choices ladder up to Tier 2 even if Tier 2 doesn't launch for 12 months.** Every shortcut that locks you to Vercel/Supabase/Anthropic/Stripe is a future migration. Every adapter you add now is an enterprise pilot you can say yes to later.

The Cloud product still ships. The motion doesn't change. Only the *posture* of the code does.

---

## ONE-LINE SUMMARY

> *Containerize this month, abstract the LLM and DB this quarter, get audit logging and SAML in place by Q2, sign first Tier 2 customer by Q3. Most of the work is wrapping, not rewriting. The code you've already shipped is the foundation — it just needs to be made portable.*

---

*Captured 2026-05-26. Update this brief as architectural decisions land. Pair with `TWO_TIER_STRATEGY.md` (strategic vision) and `SELFAUDIT_CONTEXT.md` (product blueprint).*
