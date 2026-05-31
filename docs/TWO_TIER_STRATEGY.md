# SelfAudit — Two-Tier Deployment Strategy

*Captured 2026-05-26. The strategic vision for SelfAudit as a dual-tier product: cloud SaaS for SMBs + embedded enterprise software for organizations that can't share data. This is the Palantir / McKinsey / Anthropic / Snowflake playbook — applied to strategic intelligence.*

---

## THE THESIS

SelfAudit is not one product. It is one **strategic intelligence engine** that ships in two deployment modes:

| Tier | Deployment | Who it's for | Price |
|---|---|---|---|
| **Tier 1 — SelfAudit Cloud** | Hosted SaaS, multi-tenant | SMB founders & operators ($250K–$10M revenue) | Free first audit, then **$99/mo** flat |
| **Tier 2 — SelfAudit Embedded** | Self-hosted, single-tenant, customer's own network | Enterprises with data, security, or compliance constraints | **$50K–$1M+/yr** (call for pricing) |

Same engine. Same six analytical loops. Same diagnostic brain. Two completely different sales motions, two completely different price points, two completely different addressable markets — combined under one platform.

---

## WHY THIS IS THE RIGHT MOVE

This is exactly the playbook of every category-defining infrastructure company:

| Company | Cloud product | Enterprise/embedded product |
|---|---|---|
| **Palantir** | Foundry (cloud) | Foundry / Gotham (on-prem, air-gapped for governments) |
| **Anthropic** | Claude API (self-serve) | Claude for Enterprise (private deployment, custom contracts) |
| **Snowflake** | Standard tenants | Private deployment, single-tenant clusters |
| **Datadog** | Cloud SaaS | Datadog On-Prem (regulated industries) |
| **GitHub** | github.com | GitHub Enterprise Server (self-hosted) |
| **Notion** | Cloud | Notion Enterprise (private cloud) |

The pattern is universal because the *economics* are universal:

- **SMB cloud tier captures volume** — millions of small customers at low ACV, low touch.
- **Enterprise embedded tier captures depth** — hundreds of large customers at high ACV, white-glove.
- **Combined, both tiers reinforce each other** — cloud generates the product velocity and brand; enterprise generates the cash flow and category gravity.

SelfAudit was *already* on the trajectory to be a cloud SaaS. Layering Tier 2 on top of the same engine is what turns a $50M company into a $5B one.

---

## TIER 1 — SELFAUDIT CLOUD

**What it is:** The current product. Multi-tenant SaaS hosted on Vercel + Supabase. Users sign up, connect HubSpot/Stripe/Slack/etc., and get continuous strategic intelligence through the six analytical loops.

**Who it's for:** Founders and operators of businesses doing $250K–$10M in revenue. The 30M SMBs that have never had access to strategic intelligence infrastructure.

**Pricing:**
- Free Audit — $0 (acquisition funnel)
- **SelfAudit Cloud — $99/mo flat** (single plan; no $29 tier — dilutes the premium position against McKinsey)

**GTM motion:** Product-led. Free-audit funnel → in-product upgrade. Low-touch. Self-serve. Brand-driven (operational debt thesis, audacity positioning, organic + paid social).

**Sales cycle:** Minutes to days.

**Margins:** SaaS-typical 70–85% gross margin after infra + LLM costs.

---

## TIER 2 — SELFAUDIT EMBEDDED (the enterprise play)

**What it is:** The same six-loop strategic intelligence engine, packaged as installable software that runs inside the customer's own infrastructure. Air-gappable. Compliance-ready. Custom-integrated with their internal tools (Salesforce, NetSuite, Workday, SAP, custom data warehouses).

**Who it's for:**
- Mid-market and enterprise companies who refuse to send business data to a third party
- Regulated industries (healthcare, financial services, defense, government contractors)
- Multinationals with data residency requirements (GDPR, regional sovereignty laws)
- Companies that have internal-audit, internal-strategy, or COO functions and want to *augment* them rather than replace them
- Private equity portfolio operators running intelligence across their portfolio companies

**Pricing (annual contracts):**

| Plan | Annual cost | What's included |
|---|---|---|
| **Embedded — Starter** | $50K–$120K/yr | Single deployment, one entity, up to 100 users. Standard six-loop intelligence + custom connectors |
| **Embedded — Scale** | $200K–$500K/yr | Multi-entity, custom rule packs, dedicated support, SLA |
| **Embedded — Sovereign** | $1M+/yr | Air-gapped, custom LLM endpoint, white-glove implementation, custom intelligence modules, compliance certifications |

**GTM motion:** Outbound + inbound enterprise sales. Discovery → security review → pilot → procurement → annual contract. Long-cycle, high-touch.

**Sales cycle:** 3–12 months.

**Margins:** 60–75% gross margin (implementation costs are real), but ACV is 100–1000× cloud.

---

## ARCHITECTURAL IMPLICATIONS — WHAT TO DO NOW

The single most important decision: **build the engine today as if it were always going to be embedded.** This means making choices now that don't paint Tier 2 into a corner later.

### Required architectural posture from day one:

1. **Containerize everything.** Docker from the start. The same image must run on Vercel/Supabase or on-prem.
2. **Externalize every dependency via config.** No hardcoded API endpoints, keys, or service URLs. All via environment variables.
3. **LLM endpoint must be pluggable.** Today: Anthropic API. Tomorrow: AWS Bedrock private endpoint, Azure OpenAI, or a customer's own model deployment. Wrap the LLM call in a single adapter so the rest of the code doesn't know or care.
4. **Database must be standard Postgres.** Use Supabase for cloud convenience but avoid Supabase-specific features that aren't portable. Customer-hosted Postgres must work as a drop-in.
5. **Billing must be a module, not a hardcoded dependency.** Stripe for cloud, invoice/PO for enterprise. The auth + entitlements layer must work without billing.
6. **Connectors must support customer-hosted instances.** A customer's on-prem HubSpot, internal CRM, or SAP instance must connect the same way as cloud HubSpot.
7. **All data must be tenant-isolated by default.** Row-level security or schema-per-tenant. No shared tables that would block single-tenant deployment.
8. **Audit logging must be first-class.** Enterprises will demand a full audit trail of every query, every action, every model invocation. Build it now, not later.

### What this means today, practically:

- Don't lean further into Supabase-specific RPC functions unless you're willing to also write Postgres equivalents
- Wrap the Anthropic SDK in a `lib/llm/` adapter so the model endpoint is one config value away from being changed
- Start logging every Claude call to a local table with prompt, response, latency, cost (this becomes both telemetry AND audit trail)
- Make the connector framework provider-agnostic (HubSpot OAuth ≠ HubSpot enterprise SSO; both should plug in)

**None of this slows down Tier 1.** It just keeps Tier 2 viable.

---

## PRICING IMPLICATIONS

The 10× multiplier the user mentioned is the *floor*, not the ceiling. Realistic enterprise pricing for embedded strategic intelligence:

| What enterprises pay today | What for |
|---|---|
| **$1M–$5M per engagement** | A McKinsey strategy project |
| **$500K–$2M per year** | A Big-4 internal audit retainer |
| **$50M+ multi-year contract** | A Palantir deployment |
| **$15K–$50K/month** | A fractional COO + Chief of Staff combined |

SelfAudit Embedded sitting at $50K–$1M/year is **deeply underpriced relative to alternatives** — which is exactly the right place to start. We undercut on price, win on capability, and grow ACV over time.

The price weapon for enterprise:

> *"What Palantir delivers in 18 months and $50M, SelfAudit delivers in 90 days and $500K — embedded in your stack, learning your business, compounding every quarter."*

---

## GTM MOTION DIFFERENCES (treat as two businesses)

| Dimension | Tier 1 Cloud | Tier 2 Embedded |
|---|---|---|
| Acquisition | Brand, content, paid social | Outbound, partners, RFP, founder network |
| First touch | Landing page → free audit | Discovery call → security review |
| Sales involvement | Zero (self-serve) | High (named AE, SE, security team) |
| Onboarding | Self-serve, in-product | 2-8 week implementation |
| Support | Help docs + AI agent | Dedicated CSM + Slack channel |
| Pricing visibility | On the website | Private, custom-quoted |
| Decision-makers | The founder | CFO + CIO + CISO + Procurement |
| Contract length | Monthly | 1–3 year |
| Renewal motion | Auto-renew | RFP defense |

**Implication:** When the day comes to launch Tier 2, you cannot run it out of the same Slack channel as Tier 1. It needs different humans (enterprise AE, solutions engineer, security/compliance lead) and different processes (security questionnaires, master service agreements, SOC 2 reports).

But you don't need that until you have your first 3–5 enterprise pilots in market. Until then, the same person can run both.

---

## THE FUNNEL BETWEEN TIERS

The two tiers aren't independent silos — they feed each other. The upmarket path looks like:

```
SMB founder uses SelfAudit Cloud for 12–18 months
  ↓
Business grows to 100+ employees
  ↓
Adds compliance / data-residency requirements (or gets acquired)
  ↓
Hits a wall with cloud version (limits, security needs)
  ↓
Converts to SelfAudit Embedded
  ↓
ACV jumps from $1,188 to $250K+
```

Even a 1% conversion from Cloud to Embedded would 200× the customer's lifetime value. That's the moat. **Every Tier 1 customer is a Tier 2 lead in waiting.**

The reverse also works — a portfolio operator (PE firm, holding company) buys SelfAudit Embedded for the holdco, then deploys SelfAudit Cloud to each portfolio company under a master agreement. **One enterprise sale unlocks N cloud subscriptions.**

---

## RISKS & CONSIDERATIONS

Honest risks to be aware of:

1. **Two-product complexity tax.** Maintaining a cloud SKU and an embedded SKU doubles the QA, support, security, and documentation surface. Don't launch Tier 2 until Tier 1 is humming.

2. **Pre-mature enterprise distraction.** Enterprise pilots can eat 80% of founder time for 10% of revenue if rushed. Don't open Tier 2 until Tier 1 has product-market fit signal (e.g., $20K MRR, 100+ paying users, retention curve flattening).

3. **Security/compliance debt.** Enterprises demand SOC 2 Type II, GDPR, sometimes HIPAA or FedRAMP. Each certification is 6–12 months of work. Start with SOC 2 in the next 6 months even before pitching Tier 2 publicly.

4. **LLM dependency lock-in.** If Anthropic API is your only LLM path, an enterprise that demands a private model deployment will block you. Build the LLM adapter layer NOW so any provider can plug in.

5. **Pricing fence-walking.** Don't let cloud users find out enterprises are paying 100× for "the same thing." Differentiate publicly via: deployment, support, custom integrations, compliance certifications, dedicated success — not via feature unlocks alone.

6. **Brand split.** Palantir-the-defense-contractor and Palantir-the-AIP-cloud have a real tension. Decide early how to message a product that's both "$99/month for founders" and "$500K/year for the Fortune 500."

---

## WHERE THIS PUTS SELFAUDIT (the $5B vision)

The math changes when Tier 2 is on the roadmap.

**Cloud-only path:**
- 100,000 paying customers × $99/mo × 12 = ~$120M ARR ceiling
- Valuation multiple: 8–12× ARR = $1–1.5B company

**Cloud + Embedded path:**
- 50,000 paying Cloud customers ($60M ARR) **+** 200 Embedded customers × $250K avg ($50M ARR)
- $110M ARR with a *much higher quality* mix (enterprise revenue is stickier, higher-margin, higher-multiple)
- Valuation multiple: 15–25× ARR (the enterprise contribution lifts it) = $1.5–2.75B company

Add the **category-defining intangible** (you own Strategic Intelligence for SMBs *and* are the embedded version that competes with Palantir at the high end) and the multiple goes higher. **$5B+ outcome becomes achievable** instead of theoretical.

---

## DECISION CRITERIA — WHEN DO WE OPEN TIER 2?

Don't launch Tier 2 publicly until ALL of these are true:

- [ ] SelfAudit Cloud has product-market fit (>$20K MRR, 50+ paying users, retention positive)
- [ ] SOC 2 Type II certification in progress (or completed)
- [ ] The engine has been architected with embedded deployment in mind (containerized, LLM-pluggable, Postgres-portable)
- [ ] At least one warm enterprise lead (private equity firm, mid-market COO who's a brand fan, etc.) has expressed interest
- [ ] Founder has the bandwidth to run a 6-month enterprise sales cycle without dropping Cloud momentum

Pre-condition that should be true *today*: **every architectural decision should be made as if Tier 2 will exist.** That's free. Doing the opposite is expensive to reverse.

---

## ONE-PARAGRAPH SUMMARY (FOR INVESTORS / PARTNERS)

> *SelfAudit ships in two deployment modes. Tier 1 (Cloud) is the strategic-intelligence-as-a-service product for the 30 million SMBs that have never had access to operational intelligence — currently $29–$99/month, self-serve, brand-led. Tier 2 (Embedded) is the same six-loop intelligence engine packaged for enterprise deployment inside the customer's own infrastructure — sold to regulated industries, multinationals, and portfolio operators who can't or won't send data to a third party. This is the Palantir, Anthropic, and Snowflake playbook applied to strategic intelligence: cloud captures volume, enterprise captures depth, and the same engine runs both. Architectural decisions today are being made with both tiers in mind, so Tier 2 can launch without rewriting the core.*

---

*Captured by Sahej · 2026-05-26 · This doc is the strategic vision. Implementation decisions flow downstream from here. Keep in sync with the live architecture as it evolves.*
