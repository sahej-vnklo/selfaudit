# SelfAudit — Product Context

*The single source of truth on what SelfAudit is, what it claims, why it can claim it, and where it's going. Read this cold and you'll feel the gravity of the product.*

---

## TABLE OF CONTENTS

1. [The Audacity Statement](#audacity)
2. [The Category We Own](#category)
3. [The Thesis: Operational Debt](#thesis)
4. [Who It's For](#who)
5. [Why Now](#why-now)
6. [The Six Analytical Loops](#loops)
7. [Capabilities — Mapped to the Loops](#capabilities)
8. [The Four Operational Areas](#areas)
9. [Pricing & The Price Weapon](#pricing)
10. [What SelfAudit Is NOT](#not)
11. [The Moat](#moat)
12. [Two-Tier Deployment Strategy](#tiers)
13. [Where It's Going](#roadmap)
14. [Brand Voice & Sacred Lines](#voice)
15. [One-Page Handoff Summary](#handoff)

---

<a name="audacity"></a>
## 1. THE AUDACITY STATEMENT

> # **We kill your operational debt.**
> # **We engineer your growth.**
>
> ## *The first with the audacity to claim both.*
> ## *The first with the architecture to deliver it.*

That's the entire pitch. Every other section in this document exists to justify those four lines.

The promise is total. Not "reduce" operational debt — **kill** it. Not "help you grow" — **engineer** the growth. Not "one of the AI tools that helps with this" — **the first** with the audacity, and the first with the architecture.

Both claims are defensible. The code is the receipt.

---

<a name="category"></a>
## 2. THE CATEGORY WE OWN

**SelfAudit is Strategic Intelligence — for the 30 million businesses that have never had any.**

Strategic intelligence is what built every great company. McKinsey is strategic intelligence (sold for $1M engagements). Palantir is strategic intelligence (sold for $50M government contracts). Bloomberg Terminal is strategic intelligence (sold for $30K/year). Every Fortune 500 has it. **Zero SMBs do.**

We are not entering a category. We are **creating** one. And there is no incumbent to fight.

The sub-category we lead with publicly is **operational debt diagnostics** — because that's the visceral pain founders feel. The umbrella category we own with investors is **strategic intelligence for SMBs** — because that's the venture-scale bet.

---

<a name="thesis"></a>
## 3. THE THESIS: OPERATIONAL DEBT

Every business carries debt that doesn't appear on any balance sheet. Not financial. Not technical. **Operational.**

It is the accumulated weight of decisions deferred, processes normalized, problems absorbed into the daily rhythm — until nobody questions them anymore. It compounds silently. It doesn't trigger an alert. It just quietly raises the cost of every unit of growth until scaling feels impossible.

A $1M business carrying moderate operational debt loses an estimated **20–25% of productive capacity** — roughly **$230,000 per year** — absorbed into friction, rework, and decisions that should have been pre-made. At $3M revenue: **$690,000/year**.

Most founders never name it. They just feel it. They pay the tax of guessing wrong.

**SelfAudit names it. Measures it. Kills it.** That's the visceral promise.

Full thesis: `OPERATIONAL_DEBT_ARTICLE.md`.

---

<a name="who"></a>
## 4. WHO IT'S FOR

**Founders and operators of businesses doing $250K–$10M in annual revenue.** Typically 1–50 employees. They have:

- Revenue that's real but plateauing
- A nagging sense that something's wrong but no way to name it
- Tools (HubSpot, Stripe, Notion) but nothing reading them together
- No budget for a fractional COO ($5K–$15K/mo) or McKinsey ($50K+ engagements)
- A team that's busy but not necessarily productive
- The decision-making weight of a Fortune 500 CEO, with none of the staff

**Not for:** Pre-revenue founders, enterprises with internal BI teams, agency owners with simple bookkeeping needs.

The lived feeling we sell against:

> *"I know something's off. I just can't tell what. Sales feel slow. Cash is moving funny. The team's busy but nothing's shipping. I don't know if I should hire, raise prices, fix churn, or hold the line."*

That feeling has a name (operational debt) and a price tag ($230K/yr at $1M revenue). We give founders both — and then we kill it.

---

<a name="why-now"></a>
## 5. WHY NOW

Three things converged that did not exist three years ago:

1. **AI got smart enough to investigate, not just chat.** Multi-step reasoning + tool use means an AI can plan an investigation, pull real business data, form a hypothesis, test it, and produce a structured answer.
2. **Founders run leaner than ever.** Post-ZIRP, every team is small, every hire is scrutinized. Demand for "fractional everything" is at an all-time high.
3. **Consultants stayed expensive.** $300–$500/hour rates haven't moved. The gap between what founders need and what they can afford has only widened.

Whoever owns Strategic Intelligence as a category in the next 18 months owns it permanently. **That window is open now. We are inside it.**

---

<a name="loops"></a>
## 6. THE SIX ANALYTICAL LOOPS

Strategic intelligence operations are built on a specific architecture: **interlocking analytical loops.** Not one model. Not one feature. **Loops.**

This is the proof of capability. The receipts. The reason "audacity" lands and doesn't bounce.

| # | Loop | What it does | Code location |
|---|---|---|---|
| 1 | **Reconnaissance** | Continuous monitoring across 4 functional areas, 24/7 | `api/lib/governance/monitoring.js` |
| 2 | **Diagnostic** | Mode-aware analysis (Diagnostic / Execution / Human Moment / Goal Gap) | `api/audit.js` |
| 3 | **Investigative** | Planner → Gatherer → Reasoner agent pipeline | `api/lib/agent/*` |
| 4 | **Synthesis** | Multi-source signal fusion + AI-augmented diagnosis | `api/lib/governance/advice.js` + `ai-advisor.js` |
| 5 | **Memory** | Compounding business context across every interaction | `api/lib/intelligence/company-brain.js` |
| 6 | **Feedback** | Findings → alerts → user response → re-evaluation | `api/lib/monitoring/risk-alerts.js` + cron |

**Six analytical loops, running in parallel, thinking about one specific business — every minute of every day.**

No other AI product for SMBs has this architecture. Most have one loop (a chat). Some have two (chat + memory). We have six, and they share context. That is the moat made of code, not marketing.

---

<a name="capabilities"></a>
## 7. CAPABILITIES — MAPPED TO THE LOOPS

### 7.1 The Audit (Diagnostic Loop)

The first time SelfAudit thinks about a business — out loud, with the founder. Six to ten sharp questions. Structured report. Mode-aware: it classifies the conversation as **DIAGNOSTIC** (something is broken), **EXECUTION** (decision is made, help me do it), **HUMAN_MOMENT** (something heavy, give me a script for what to say), or **GOAL_GAP** (here's my target, name what's missing and stamp the timeline as Feasible / Tight / Unrealistic). No other AI tool reads conversational mode. Ours does.

### 7.2 Continuous Governance (Reconnaissance Loop)

A background loop watches the business across Customer Service, Marketing & Sales, Finance & Accounting, and Management & Strategy. Default rule packs flag drift; AI advisor sharpens the narrative. Statuses surface to the dashboard as good / watch / bad / no-signal.

### 7.3 Compounding Memory (Memory Loop)

Every audit, every signal, every interaction updates a persistent model: goals, blockers, priorities, retention signals, watchouts, recurring themes. **By month 6, SelfAudit knows the customer's business better than any consultant ever could.** This is the per-customer data moat.

### 7.4 AI Advisor on Top of Governance (Synthesis Loop)

The same Claude diagnose brain that powers the audit now sharpens every governance finding. Rules produce the finding (severity, threshold, status); Claude rewrites the narrative (root cause, impact, recommendation, executive summary). Numbers are sacred. Words are smart.

### 7.5 Ask SelfAudit (Investigative Loop)

A 3-step agent: **Planner** (Haiku) reads the question, picks data sources, forms a hypothesis. **Gatherer** pulls only what's relevant. **Reasoner** (Sonnet) tests the hypothesis against the evidence. Returns structured JSON: answer, root_cause, severity_score, financial_impact, fix_priority, execution_plan, evidence, assumptions, missing_data, confidence, follow-up question. Every finding persists in `agent_findings`.

### 7.6 Alerts & Digests (Feedback Loop)

Findings flow into a persistent alert system (active / open / acknowledged / resolved). Users get scheduled email digests + proactive alerts. Notification preferences are configurable. User responses feed back into the system for tuning.

### 7.7 Execution Outputs

SelfAudit doesn't just diagnose — it produces. Reports include action plans, SOPs, email drafts, conversation scripts. Findings can be turned into copy-ready artifacts.

### 7.8 Founder Command Center (the Dashboard)

A dedicated oversight surface shows the executive summary, area workspace cards, recommended actions, and home snapshot card. **This is the command center, not a dashboard.** It's where the founder sees what the intelligence operation found while they were sleeping.

---

<a name="areas"></a>
## 8. THE FOUR OPERATIONAL AREAS

Every analytical loop is organized around these four lanes. They mirror how real businesses are structured.

| Area | Objective | Key Metrics | Sample Findings |
|---|---|---|---|
| **Customer Service** | Keep customers happy and supported | Ticket volume, resolution time, repeat complaints, CSAT, backlog | Slow response patterns, churn-risk customers, escalation spikes |
| **Marketing & Sales** | Build pipeline that converts | Open deals, leads, conversion, sales cycle, CAC | Pipeline drying up, stage stagnation, weak follow-up |
| **Finance & Accounting** | Protect cash, margins, unit economics | MRR, churn, burn, runway, LTV:CAC, gross margin | Runway tight, churn compounding, unit economics upside-down |
| **Management & Strategy** | Move the company forward against goals | Goal progress, priority backlog, repeated blockers, follow-through rate | Strategy-execution gap, leadership bottlenecks, decision avoidance |

Each area has: its own business objective, key management questions, metric definitions, default threshold rule pack, and evaluator function. Modular. Each area can deepen independently.

---

<a name="pricing"></a>
## 9. PRICING & THE PRICE WEAPON

| Tier | Price | What's Included |
|---|---|---|
| **Free Audit** | $0 | One full audit. No account. No card. The first time it thinks about your business. |
| **SelfAudit Cloud** | $99/mo | The full intelligence operation. Unlimited audits, live connectors (HubSpot, Stripe, Slack, Gmail), compounding memory, weekly governance, Ask SelfAudit on-demand investigator, goal tracking with reality checks, action plans + SOPs + email drafts from every finding. |
| **SelfAudit Embedded** | Call for pricing | The same six-loop engine, installed inside your own network. Air-gappable, compliance-ready, custom integrations. For regulated industries, multinationals, PE portfolios. ($50K–$1M+/yr range — see `TWO_TIER_STRATEGY.md`) |

### The Price Weapon

| Strategic intelligence equivalent | What it costs |
|---|---|
| McKinsey engagement | $500K – $5M per engagement |
| Bloomberg Terminal | $30,000 / year |
| Fractional COO | $5,000 – $15,000 / month |
| One hour of a top consultant | $300 – $500 |
| **SelfAudit Intelligence** | **$99 / month** |

$1,188/year for what McKinsey delivers in 6 weeks. The gap between $99 and $1M is the moat — and the FOMO line for every investor.

---

<a name="not"></a>
## 10. WHAT SELFAUDIT IS NOT

Critical for positioning. Do not let people put us in these boxes:

- **Not a chatbot.** Chatbots respond. We investigate.
- **Not a dashboard.** Dashboards show numbers. We tell you why and what to do.
- **Not a CRM / project tool.** We read your CRM; we don't replace it.
- **Not ChatGPT for business.** ChatGPT forgets you, has no data, gives ten options. We remember, read your live data, pick one move.
- **Not a coaching app.** We diagnose with evidence, not motivation.
- **Not a consultant.** Consultants leave. We compound.
- **Not enterprise BI.** Tableau and Looker visualize. We *think.*
- **Not an "AI diagnostic tool."** That framing is small. We are a strategic intelligence operation.
- **Not an audit tool with memory.** That was the old framing. Bury it.

We are the first strategic intelligence operation for small businesses. Say it that way every time.

---

<a name="moat"></a>
## 11. THE MOAT

What makes SelfAudit defensible — even against AI-native competitors who try to copy us:

1. **Six interlocking analytical loops.** Competitors will copy the chat. They will not copy the architecture. Replicating six loops with shared context takes 12–18 months of focused engineering, minimum.
2. **Compounding data per customer.** Every audit, every signal, every connector pull makes our model of that business sharper. After 6 months, switching costs are real. After 12 months, they are prohibitive.
3. **Mode-aware reasoning.** No competitor classifies conversations into Diagnostic / Execution / Human Moment / Goal Gap. Product-design moat, not just tech.
4. **Bridged brain.** The same AI brain powers the on-demand agent AND the background governance, sharing context. Most tools have one or the other. We have both.
5. **Category ownership.** We are the only product naming and measuring operational debt directly, and the only one calling itself a strategic intelligence operation for SMBs. Owning a category beats owning a feature.
6. **Sub-$100 price point + always-on.** Anyone competing on price has to undercut consultants. Anyone competing on capability has to match always-on. Few will do both.

---

<a name="tiers"></a>
## 12. TWO-TIER DEPLOYMENT STRATEGY

SelfAudit ships in two deployment modes. Same six-loop engine. Two completely different markets.

### Tier 1 — SelfAudit Cloud ($99/month)

Multi-tenant SaaS, self-serve. The default product for SMB founders and operators of $250K–$10M businesses. Free first audit → $99/month flat. Brand-led, product-led, low-touch.

### Tier 2 — SelfAudit Embedded (Call for pricing — $50K–$1M+/yr)

The same engine, installed inside the customer's own infrastructure. Air-gappable, compliance-ready, custom integrations. For regulated industries (healthcare, financial services, defense), multinationals with data residency requirements, and PE/holding companies running intelligence across portfolios.

### Why two tiers, not one

This is the Palantir / Anthropic / Snowflake / Datadog / GitHub playbook:

- **Cloud captures volume.** Millions of small customers, low ACV, low touch.
- **Embedded captures depth.** Hundreds of large customers, 100–1000× ACV, white-glove.
- **Same engine runs both.** Architectural decisions today are made with both deployments in mind so Tier 2 can launch without rewriting the core.

### The upmarket funnel

Every Cloud customer is a future Embedded lead. PE firms can buy Embedded for the holding company and deploy Cloud to every portfolio business under a master agreement. **One enterprise sale unlocks N cloud subscriptions.** The reverse also works — Cloud customers grow into compliance constraints and convert to Embedded.

### Full strategic vision: `TWO_TIER_STRATEGY.md`

For architectural posture requirements, GTM motion differences, risk analysis, and decision criteria for when to open Tier 2 publicly — see the dedicated strategy doc.

---

<a name="roadmap"></a>
## 13. WHERE IT'S GOING

**Shipped:**
- 4-area governance skeleton with business logic and continuous monitoring
- Multi-mode audit (Diagnostic / Execution / Human Moment / Goal Gap)
- Findings flow into alerts, diagnoses, recommended actions
- Founder command center on the dashboard
- AI advisor enriches governance findings (same brain as audit chat)
- Ask SelfAudit on-demand investigator (3-step agent)
- Compounding memory layer
- HubSpot live integration

**Next 90 days (priority order):**
1. User-defined rule overrides ("alert me if churn > 3%") — biggest power-user unlock
2. Historical metric snapshots so trends become visible over time
3. Per-area drill-down pages (currently only summary cards)
4. Stripe + Slack connectors (broaden real signal coverage)
5. Richer execution artifacts auto-generated from governance findings

**Bigger bets:**
- Founder-defined risk matrix UI (the missing governance configuration layer)
- Multi-user / agency view (one operator managing many businesses)
- Industry-specific rule packs (SaaS, agency, ecom, services)
- API for embedding diagnoses into other tools
- Investor-facing reporting layer (let portfolios run intelligence on their cap table)

---

<a name="voice"></a>
## 14. BRAND VOICE & SACRED LINES

How SelfAudit talks — product and marketing:

- **Audacious.** Claim the heaviest version of every truth. No hedge.
- **Direct.** No filler. No "we believe" or "we think." We *do.*
- **Founder-level.** Talk like a senior operator who's seen 100 businesses, not a CS rep.
- **Brutally honest.** "Brutally honest" is in our tagline for a reason. Vague is forbidden.
- **Evidence-first.** Quote specific numbers. Distinguish facts from assumptions from missing data. Never invent figures.
- **Root cause, not symptom.** Surface-level answers are forbidden.
- **No motivational language.** Founders aren't here to be inspired. They're here to be told what's wrong.
- **One move, not ten options.** Most tools hedge to ten. We pick one.
- **Category authority.** Speak as if Strategic Intelligence is already a known category and we already own it. Because that's how you make it true.

### Sacred lines (do not edit, ever):

- *"We kill your operational debt. We engineer your growth."*
- *"The first with the audacity to claim both. The first with the architecture to deliver it."*
- *"Most tools answer. SelfAudit investigates."*
- *"Brutally honest."*
- *"Begin."* (final CTA)
- *"See it think."* (free-audit invitation)

### The subliminal feed — burn these into every surface:

1. **"Kill operational debt."** (the visceral promise)
2. **"Engineer growth."** (the active verb)
3. **"The first with the audacity."** (the authority)
4. **"Strategic intelligence."** (the category)
5. **"Six analytical loops."** (the proof)
6. **"$99 vs $1M."** (the price weapon)

Every tweet, ad, landing section, cold email — pick two and lead. Repeat until people start saying them back.

---

<a name="handoff"></a>
## 15. ONE-PAGE HANDOFF SUMMARY

*If a stranger reads only this section, this is what they get.*

**Product:** SelfAudit is the first strategic intelligence operation built for small businesses. Six interlocking analytical loops — reconnaissance, diagnostic, investigative, synthesis, memory, feedback — running 24/7 inside a single business. It thinks about that business when the founder can't.

**Category:** Strategic Intelligence (umbrella). Operational Debt Diagnostics (wedge).

**Headline claim:** *We kill your operational debt. We engineer your growth. The first with the audacity to claim both. The first with the architecture to deliver.*

**Pain:** Every $1M business loses an estimated $230K/year to operational debt it cannot see. Founders feel it. Consultants are too expensive. Dashboards don't diagnose. ChatGPT forgets you. There has never been a product priced for SMBs that does what McKinsey does.

**Why now:** AI got smart enough to investigate (not just chat). Founders run leaner than ever. Consultants stayed expensive. The gap is wide. The window is 18 months. We are inside it.

**Capabilities:**
- Mode-aware audit (Diagnostic / Execution / Human Moment / Goal Gap)
- Continuous governance across 4 functional areas
- AI advisor on top of governance (Claude sharpens every finding)
- Ask SelfAudit on-demand investigator (planner → gatherer → reasoner)
- Compounding memory that knows the business deeper every week
- Execution outputs (SOPs, action plans, scripts, drafts)
- Alerts, digests, founder command center

**Pricing:** Free first audit · $99/mo Cloud · Enterprise (Embedded) by call.

**Price weapon:** $1,188/year for what McKinsey charges $500K–$5M to deliver in 6 weeks.

**Moat:** Six interlocking loops (architectural) + compounding per-customer data (data) + mode-aware reasoning (product design) + bridged brain shared context (technical) + category ownership (positioning) + sub-$100 always-on price point (commercial).

**Market:** 30M+ SMBs in the US alone. Zero incumbents in strategic intelligence for this segment. Category is being defined right now.

**Stack:** React + Vite. Vercel serverless functions. Supabase Postgres. Anthropic Claude (Haiku + Sonnet). Stripe. Resend. PostHog. Sentry.

**Status:** Live. Architecture shipped. Already paying users. Currently iterating on landing-page positioning and investor readiness.

**Built by:** Vnklo. [tryselfaudit.com](https://tryselfaudit.com).

**The one paragraph for investors:**

> *"I'm building Strategic Intelligence — the McKinsey / Palantir / Bloomberg function — for the 30 million SMBs that have never had access to any version of it. The mechanism is operational debt: every small business carries it, none can measure it, all of them pay the tax. I built the first system audacious enough to claim it can kill operational debt completely and engineer growth better than any consultant, COO, or AI to date. Six analytical loops running continuously. AI-native architecture. Defensible data moat. Already paying users. The category is being defined right now, and I'm the one defining it."*

---

*Last updated: 2026-05-24. Keep this in sync as the product evolves. The voice does not soften.*
