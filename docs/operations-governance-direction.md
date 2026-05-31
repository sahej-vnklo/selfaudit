# SelfAudit Operations Governance Direction

## Why this document exists

This document is meant to preserve the product direction, the current system state, and the proposed build plan for evolving SelfAudit into an operations governance + advisor layer.

It is written so a future session can pick this up without losing context, and so external review can happen without needing to re-read the full codebase first.

This is not a commitment to ship everything exactly as written. It is a planning map.

---

## Phase 1 conclusion: protect, continue, add

Phase 1 is about identifying what must be protected, what should be extended, and what should not be used as the base for the next architecture.

### Protected live foundation: do not casually touch

These are working live surfaces and should be treated as protected:

#### Auth, signup, billing, and post-payment activation

Files:

- `/Users/VNKLO/Documents/selfaudit/src/App.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/auth/Login.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/auth/Signup.jsx`
- `/Users/VNKLO/Documents/selfaudit/api/send-auth-link.js`
- `/Users/VNKLO/Documents/selfaudit/api/create-checkout-session.js`
- `/Users/VNKLO/Documents/selfaudit/api/checkout-session-status.js`
- `/Users/VNKLO/Documents/selfaudit/api/stripe-webhook.js`

Protection rule:

- do not mix future operations-governance work into auth or billing logic
- do not change this flow unless there is a direct bug
- future governance work should start after authenticated and paid entry

#### Dashboard shell and current user-facing app surface

Files:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/DashboardWelcomeTour.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/IntelligenceBrief.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/ExecutionPanel.jsx`

Protection rule:

- this is the live shell users see today
- do not rip it apart during early governance work
- extend it behind existing sections or via additive area modules

#### Audit, report, and save pipeline

Files:

- `/Users/VNKLO/Documents/selfaudit/api/audit.js`
- `/Users/VNKLO/Documents/selfaudit/api/save-report.js`
- `/Users/VNKLO/Documents/selfaudit/src/components/Report.jsx`

Protection rule:

- this is the strongest existing product behavior
- do not weaken or replace it
- future governance should feed better context into this layer, not compete with it

#### Memory, synthesis, and alert persistence core

Files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/synthesize.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/update-risk-alert.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/business-health.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/weekly-digest.js`

Protection rule:

- these are real operating assets
- keep them alive and compatible
- refactor around them only when replacing with something clearly better and still backward-compatible

### Continue building on top of these

These are the best extension points for the next architecture:

#### `business_state`

Files:

- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260505000001_business_state.sql`
- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`

How to use it:

- keep this as shared executive/company context
- do not overload it forever with area-specific governance internals
- let it remain the cross-business summary layer

#### `intelligence_profiles`

Files:

- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260508000002_intelligence_backbone.sql`
- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`

How to use it:

- keep this as the synthesized intelligence layer
- use it for rolled-up cross-area understanding
- do not make it the only place where area governance state lives

#### `intelligence_notification_preferences`

Files:

- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260508000002_intelligence_backbone.sql`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260516000000_refine_notification_areas.sql`
- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

How to use it:

- keep as the current user preference foundation
- cadence, channel, and broad watch areas are already useful
- later extend governance rules separately instead of forcing this table to do everything

#### connector registry and connect/disconnect flow

Files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/connectors/registry.js`
- `/Users/VNKLO/Documents/selfaudit/api/connectors.js`
- `/Users/VNKLO/Documents/selfaudit/api/connect/disconnect.js`

How to use it:

- keep as the connector entrypoint
- later assign connectors clearly to functional areas
- treat available vs coming-soon status carefully in product claims

### Safe additions to introduce next

These are the kinds of additions that are safe and aligned with the future architecture:

#### New additive schema

Safe next schema additions:

- `area_metric_snapshots`
- `area_alert_rules`

Why:

- these do not require ripping apart current tables
- they add governance primitives cleanly
- they let the future system be modular by area

#### New additive backend folders

Safe new folders:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/shared/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/customer-service/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/marketing-sales/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/finance-accounting/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/management-strategy/`

Why:

- lets us build modularly without destabilizing the current monitoring engine immediately

#### New additive front-end area surfaces

Safe next frontend direction:

- new area-level sections or panels inside dashboard
- area settings and rule configuration screens
- additive UI only, not routing rewrites

### Caution zones: do not build the future on these

These parts should be treated carefully because they are either legacy, transitional, or too generic to carry the full future vision by themselves.

#### Legacy auth helpers

Files:

- `/Users/VNKLO/Documents/selfaudit/api/auth.js`
- `/Users/VNKLO/Documents/selfaudit/api/set-profile.js`
- `/Users/VNKLO/Documents/selfaudit/api/get-tier.js`

Why:

- they reflect older auth/profile behavior
- they are not the current stabilized signup/signin path
- do not use them as the foundation for operations governance work

#### Duplicate or transitional connector status surfaces

Files:

- `/Users/VNKLO/Documents/selfaudit/api/connect/status.js`
- `/Users/VNKLO/Documents/selfaudit/api/connectors.js`

Why:

- both expose connector-related status
- future work should be deliberate about which API becomes the single source of truth

#### The current all-in-one health check engine

File:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`

Why:

- this file is useful and live, but it is too centralized for the long-term architecture
- do not keep endlessly growing it
- use it as the source to split from later

#### Generic “coming soon” connector promises

File:

- `/Users/VNKLO/Documents/selfaudit/api/lib/connectors/registry.js`

Why:

- many connectors are listed, but only HubSpot is truly available now
- future planning should not assume those integrations are already real

### Current state summary in plain English

Right now the product is:

- strong at diagnostic audits
- strong at report generation
- meaningful at longitudinal memory and synthesis
- partially real at monitoring and alerts
- early at operational governance
- early at connector breadth

So the right Phase 1 call is:

- protect the live product core
- do not restart
- do not rebuild auth/billing/reporting
- do not keep stuffing everything into the current generic intelligence files
- add a new modular governance layer beside the current core

### Phase 1 output

After Phase 1, the safe direction is clear:

- Protected core:
  - auth
  - billing
  - dashboard shell
  - report pipeline
  - memory layer
  - alerts layer
- Continue on top of:
  - `business_state`
  - `intelligence_profiles`
  - `risk_alerts`
  - `intelligence_notification_preferences`
  - connector registry
- Add next:
  - area modules
  - metric snapshots
  - alert rules
- Avoid basing future work on:
  - legacy auth helpers
  - duplicated connector status APIs
  - endlessly extending the current monolithic health-check file

---

## Phase 2 conclusion: area structure added safely

Phase 2 is about introducing a clean structural skeleton for the 4 operating areas without changing live product behavior.

### What Phase 2 added

#### 1. Canonical shared operational-area definitions

New file:

- `/Users/VNKLO/Documents/selfaudit/shared/governance/operational-areas.js`

What it does:

- defines the 4 first-class operational areas
- provides shared IDs, labels, summaries, and outcomes
- gives both frontend and backend one common vocabulary

Areas defined:

- `customer-service`
- `marketing-sales`
- `finance-accounting`
- `management-strategy`

Why this matters:

- future work can refer to areas consistently across UI, backend, and data model
- future sessions no longer need to invent naming every time

#### 2. Backend governance registry

New file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/area-registry.js`

What it does:

- builds a registry of the 4 operational area modules
- lets backend governance work look up a module by area ID

Why this matters:

- the next phases can add rules, analyzers, and findings in a modular way

#### 3. Shared governance contracts

New file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/shared/contracts.js`

What it does:

- defines shared governance concepts
- signal statuses
- rule types
- severities
- finding types
- simple helpers for metric definitions and default rule packs

Why this matters:

- future modules can stay structurally consistent
- avoids one-off ad hoc shapes per area

#### 4. Area modules for the 4 functional lanes

New files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/customer-service/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/marketing-sales/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/finance-accounting/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/management-strategy/index.js`

What each currently contains:

- area ID
- planned connector ownership
- initial KPI / metric families
- default rule-pack notes

Why this matters:

- this is the first clean separation of the product by operating lane
- future work can improve one area without forcing changes into all others

#### 5. Front-end shared area access point

New file:

- `/Users/VNKLO/Documents/selfaudit/src/lib/governance/areaRegistry.js`

What it does:

- gives the frontend access to the same canonical area list later

Why this matters:

- future UI work can use the same area naming and area identity as backend work

### What Phase 2 did not do

This is equally important.

Phase 2 did not:

- change auth
- change billing
- change signup or onboarding
- change live dashboard behavior
- change report generation
- change monitoring logic
- change database schema
- change user-facing routing

So this was a safe additive architecture step only.

### What Phase 2 proves

The codebase can now support future work by area without first doing a risky rewrite.

This means future phases can now:

- attach area-specific metrics
- attach area-specific rules
- attach area-specific analyzers
- attach area-specific findings
- attach area-specific UI

without needing to overload the existing generic intelligence layer further.

### Phase 2 output

After Phase 2, the current system now has:

- protected live core still intact
- shared canonical area naming
- modular governance folder structure
- backend area registry
- frontend area registry hook
- area-level KPI and rule-pack placeholders

This is the clean starting point for Phase 3.

---

## Phase 3 and Phase 4 conclusion: business logic and rules foundation added safely

Phase 3 and Phase 4 are about giving each operational area a real opinion:

- what it is trying to protect
- what questions it should answer
- what metrics matter
- what good, watch, and bad mean by default
- how SelfAudit turns a metric breach into a finding

This was done as a safe backend-only foundation without changing live app behavior.

### What Phase 3 and 4 added

#### 1. Shared governance rule contracts now support real evaluation

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/shared/contracts.js`

What changed:

- added comparator vocabulary
- expanded metric definitions to include preferred direction and default interpretation
- added threshold-rule creation helper
- added metric normalization helper
- added threshold evaluation helper
- added rule-pack evaluation helper

Why this matters:

- governance modules can now define actual judgment, not just notes
- future phases can evaluate signals consistently instead of inventing one-off logic every time

#### 2. Each area now has explicit business logic

Updated files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/customer-service/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/marketing-sales/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/finance-accounting/index.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/management-strategy/index.js`

What each area now contains:

- business objective
- key management questions
- richer metric definitions
- default interpretations of those metrics
- default threshold rules
- area-level evaluator function

Why this matters:

- the system now has a first version of operating judgment by area
- SelfAudit no longer has to start from a blank “tell me what good looks like” posture
- future user-defined rules can sit on top of these defaults instead of replacing them

#### 3. Registry-level evaluation entrypoint

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/area-registry.js`

What changed:

- added a shared `evaluateOperationalArea(areaId, metrics)` entrypoint

Why this matters:

- later monitoring work can call one consistent area-evaluation interface
- keeps future monitoring modular instead of pushing more logic into the old monolithic health-check file

#### 4. Test coverage for the new governance layer

Updated file:

- `/Users/VNKLO/Documents/selfaudit/tests/critical-flows.test.mjs`

What changed:

- added tests for:
  - governance metric normalization
  - threshold rule evaluation
  - area registry integrity
  - default findings across finance and management areas

Why this matters:

- the new phase is not just structural, it is already executable and verified

### What Phase 3 and 4 did not do

This phase did not:

- change auth
- change billing
- change signup or onboarding
- change live dashboard behavior
- change the report pipeline
- change the old monitoring engine
- change the database schema
- add live connectors
- create any new user-facing settings yet

So this was still a safe additive foundation step.

### What Phase 3 and 4 prove

The codebase now supports the next important shift:

- from generic area placeholders
- to explicit operational judgment by area

This means the next phases can build on top of:

- shared business logic
- shared threshold evaluation
- default system opinions
- area-level findings

without needing to invent the core model later.

### Current gap after Phase 3 and 4

The system can now define and evaluate area rules, but it still needs:

- signal intake and normalized metric snapshots
- monitoring runs that call the new area evaluators
- translation of findings into alerts, diagnosis, and advice
- area-level UI and founder-facing oversight surfaces

So after this phase, SelfAudit has:

- a diagnostic brain
- a shared memory layer
- a modular area skeleton
- a default governance judgment layer

But it does not yet have the full operating loop that watches the business continuously.

### Phase 3 and 4 output

After this phase, the safe next build target is:

- Phase 5 and Phase 6:
  - signal intake
  - normalized metric snapshots
  - monitoring runs that use the new area logic

---

## Phase 5 and Phase 6 conclusion: signal intake and monitoring loop added safely

Phase 5 and Phase 6 are about taking the new governance logic and feeding it actual business signals that already exist in the product.

This phase was kept intentionally safe:

- no auth changes
- no billing changes
- no onboarding changes
- no dashboard rewrites
- no new user-facing configuration yet
- no live alerting behavior change yet

Instead, the focus was:

- build area metric snapshots from existing stored business data
- run those snapshots through the new area evaluators
- expose governance monitoring output inside the health-check result

### What Phase 5 and 6 added

#### 1. Area metric snapshot builder

New file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/metric-snapshots.js`

What it does:

- takes existing sources:
  - company brain
  - intelligence brief
  - normalized connector data
- maps them into area-specific metric snapshots

Current first-pass mapping:

- Customer Service
  - support ticket volume from intelligence brief
- Marketing & Sales
  - open deals from HubSpot
  - lead volume from HubSpot
  - derived stage conversion from leads to SQLs
  - sales cycle from intelligence brief
- Finance & Accounting
  - MRR from intelligence brief
  - churn from intelligence brief
  - burn from intelligence brief
  - runway from intelligence brief
  - derived LTV:CAC ratio
- Management & Strategy
  - goal progress from company brain
  - priority backlog from company brain
  - repeated blockers from company brain
  - watchouts from company brain
  - derived follow-through rate from recent session statuses

Why this matters:

- the system now has a repeatable way to convert existing business context into area-ready governance inputs
- future connector expansion can plug into the same snapshot layer instead of bypassing it

#### 2. Governance monitoring runner

New file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/monitoring.js`

What it does:

- builds snapshots
- evaluates each area
- derives area status:
  - `good`
  - `watch`
  - `bad`
  - `no-signal`
- creates area summaries
- creates compatible risk-shaped records for future alerting use

Why this matters:

- this is the first real backend monitoring loop for the new governance layer
- SelfAudit can now evaluate the operating areas from actual business signals already present in the system

#### 3. Existing health check now runs a shadow governance pass

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`

What changed:

- the existing business health check now also runs governance monitoring
- it adds a `governance` block to the returned result
- it includes governance counts in `evidence`

Important:

- this does not yet change the live alert persistence behavior
- it does not replace the current risk logic yet
- it enriches the health-check result safely without destabilizing current product behavior

Why this matters:

- the new architecture is no longer just isolated helper code
- it is now actually executing inside the existing monitoring path

#### 4. Additional test coverage

Updated file:

- `/Users/VNKLO/Documents/selfaudit/tests/critical-flows.test.mjs`

What was added:

- tests for metric snapshot derivation
- tests for governance monitoring output
- tests that verify area statuses and findings are produced correctly

Why this matters:

- the new monitoring loop is verified, not speculative

### What Phase 5 and 6 did not do

This phase did not:

- persist snapshots to a dedicated table yet
- replace the old health-check engine
- route governance findings into live risk alerts yet
- add user-defined rule editing
- add area-level UI surfaces
- add new connectors

So the system now has a working internal loop, but not yet the full surfaced product loop.

### What Phase 5 and 6 prove

The codebase now supports this internal flow:

1. load existing business signals
2. normalize them into area metrics
3. evaluate area rules
4. produce findings and area status
5. attach that monitoring output to the existing health-check result

This is the first version of the operating loop SelfAudit needs.

### Current gap after Phase 5 and 6

The biggest things still missing are:

- user-defined rules on top of the defaults
- persistence for metric snapshots if we want historical comparisons later
- turning governance findings into clear user-facing alerts
- diagnosis and advice directly on governance findings
- area-level UI

### Phase 5 and 6 output

After this phase, the next clean build target is:

- Phase 7, Phase 8, and Phase 9:
  - findings to alerts
  - findings to diagnosis
  - findings to advice

At this point, SelfAudit has moved from:

- “area structure and rule definitions”

to:

- “actual monitored area output from real stored business signals”

---

## Phase 7, Phase 8, and Phase 9 conclusion: findings now flow into alerts, diagnosis, and advice

Phase 7, Phase 8, and Phase 9 are about turning the new governance monitoring output into something operationally useful.

The target for this phase was:

- findings become alert candidates
- findings become plain-English diagnosis
- findings become recommended next actions

This was done without replacing the existing alert system or changing live dashboard UI.

### What Phase 7 to 9 added

#### 1. Governance advice builder

New file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/advice.js`

What it does:

- turns governance findings into:
  - diagnosis items
  - alert candidates
  - recommended actions
  - an executive summary sentence

The diagnosis output includes:

- area
- issue title
- plain-English cause explanation
- likely impact
- supporting evidence
- recommended next action

Why this matters:

- the governance layer now produces interpretation, not just findings
- this is the first real bridge from monitored signal to advisor behavior

#### 2. Existing health check now carries governance diagnosis and advice

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`

What changed:

- governance monitoring output is now enriched with:
  - `advice_summary`
  - `diagnoses`
  - `recommended_actions`
  - `alert_candidates`
- top-level health-check recommended actions now merge existing health-check actions with governance actions
- saved evidence now includes a compact governance overview:
  - area statuses
  - diagnosis count
  - alert candidate count
  - top diagnoses

Why this matters:

- the current monitoring path now carries operating advice, not only score and risks
- the saved health-check result becomes more useful for later founder-facing interpretation

#### 3. Governance findings now feed the existing alert system

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/risk-alerts.js`

What changed:

- alert creation now considers:
  - legacy health-check risks
  - governance alert candidates

Why this matters:

- the new governance layer does not need a second alert table or second inbox
- the existing alert persistence can now carry both legacy and governance risks

#### 4. Existing cron notification mapping now understands governance categories

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/cron/business-health.js`

What changed:

- governance categories are now mapped into the existing notification preference buckets:
  - `customer-service` → `customer_health`
  - `marketing-sales` → `pipeline_revenue`
  - `finance-accounting` → `pipeline_revenue`
  - `management-strategy` → `goal_progress`

Why this matters:

- governance alerts remain compatible with the current notification system
- users do not need a new preference system yet just to receive governance signals

#### 5. Additional tests for advice and alert-candidate generation

Updated file:

- `/Users/VNKLO/Documents/selfaudit/tests/critical-flows.test.mjs`

What was added:

- tests that governance advice produces:
  - summary
  - diagnoses
  - actions
  - area-based alert candidates

Why this matters:

- the operating loop now has verification through:
  - metrics
  - monitoring
  - diagnosis
  - action generation

### What Phase 7 to 9 did not do

This phase did not:

- add a new user-facing governance UI
- replace the dashboard alerts inbox
- introduce user-defined rule editing yet
- introduce new connectors
- create a new database schema for historical area snapshots yet

So the new value is now alive in backend behavior first, without forcing a frontend rewrite.

### What Phase 7 to 9 prove

The new governance architecture now supports this full internal loop:

1. read existing business signals
2. normalize them into area metrics
3. evaluate rules
4. create findings
5. convert findings into alert candidates
6. convert findings into diagnosis
7. convert findings into recommended actions
8. feed those into the existing health-check and alert system

This is the first usable operating-governance loop in the codebase.

### Current gap after Phase 7 to 9

The biggest remaining gaps are:

- user-facing area UI
- user-defined rule overrides
- historical metric snapshot persistence
- stronger connector breadth later
- executive/founder surface for the 4 areas

### Phase 7 to 9 output

After this phase, the next clean build target is:

- Phase 10, Phase 11, and Phase 12:
  - execution-ready outputs
  - area workspaces
  - founder-level executive surface

At this point, SelfAudit has moved from:

- “internal governance monitoring”

to:

- “internal governance monitoring that can now explain itself and suggest action”

---

## Phase 10, Phase 11, and Phase 12 conclusion: execution-ready founder surface added safely

Phase 10, Phase 11, and Phase 12 are about making the governance loop visible and usable for the founder.

The goal for this phase was:

- expose the new governance output in the dashboard
- give the founder a compact executive view
- create a simple area-workspace surface without disturbing the rest of the product

This was kept deliberately additive and low-risk.

### What Phase 10 to 12 added

#### 1. Existing business-health API now exposes governance summary data

Updated file:

- `/Users/VNKLO/Documents/selfaudit/api/business-health.js`

What changed:

- the route now reads the latest saved health check
- it exposes:
  - governance summary
  - area statuses
  - top diagnoses
  - recommended actions
  - governance counts

Why this matters:

- the dashboard can now render founder-facing oversight without needing to recompute or duplicate governance logic client-side

#### 2. New founder oversight section in the dashboard

Updated file:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

What changed:

- added a new Intelligence-only `oversight` section in the app shell
- added an oversight entry to sidebar routing
- added a founder-level oversight page that shows:
  - executive summary
  - recommended actions
  - area-by-area workspace cards

Why this matters:

- the new governance system is no longer hidden only in backend output
- the founder now has one clear place to see how the business is drifting by operating lane

#### 3. Home screen oversight snapshot

Updated file:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

What changed:

- added a compact operational-oversight summary card on Home for Intelligence users
- it shows:
  - whether the business is stable, watch, or needs attention
  - the governance summary sentence
  - area count summary
  - the top diagnosis
  - a direct path into the oversight section

Why this matters:

- the new operating-brain layer is now visible immediately on entry
- founders do not need to hunt for it

#### 4. Area workspace surface

Updated file:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

What changed:

- each area now has a visible workspace card in the oversight section
- each card shows:
  - area name
  - status
  - signal coverage
  - top flagged issue

Why this matters:

- the product is now starting to organize itself around the 4 operating areas in the actual user experience

### What Phase 10 to 12 did not do

This phase did not:

- replace the existing home KPI cards
- replace the alert inbox
- add deep editable per-area settings yet
- add historical charts yet
- add custom rule editing yet

So the founder-facing layer is now present, but still intentionally compact and safe.

### What Phase 10 to 12 prove

The new governance system is now:

- structured
- monitored
- explainable
- actionable
- visible in the product

This means the architecture has crossed an important line:

- it is no longer only backend foundation
- it is now a real founder-facing operating surface

### Current gap after Phase 10 to 12

The biggest remaining gaps are:

- deeper area pages or drill-down views
- custom founder-defined rule overrides
- historical trend views
- richer execution artifact generation from governance findings

### Phase 10 to 12 output

After this phase, SelfAudit now has:

- area structure
- default business logic
- signal intake
- monitoring
- alerts
- diagnosis
- advice
- founder-facing oversight surface

At this point, the next work is not “build the basic governance system.”

The next work is:

- deepen it
- refine it
- make it more configurable
- make each area more useful over time

---

## One-line product direction

SelfAudit should become a functional operating brain for the founder or COO: it watches the business through real tools, detects drift and risk, explains what is wrong and why, and helps the user take the next action with decision-ready outputs.

---

## The intended product mental model

SelfAudit should not be just:

- a one-time diagnostic tool
- a memory store
- a static dashboard
- a dumb KPI robot that only reacts to numbers the user typed in

SelfAudit should become:

- a manager layer across key business functions
- an advisor layer on top of that manager layer
- a monitoring and governance system that can proactively flag problems
- a root-cause analysis and coaching system that can interpret those problems
- an execution helper that produces usable artifacts and next-step outputs

The desired product loop is:

1. The business connects tools and/or fills in critical business metrics.
2. The user defines what matters: KPIs, goals, thresholds, red lines, watchouts.
3. SelfAudit watches the business continuously.
4. SelfAudit detects risk, drift, bottlenecks, upside, and repeated patterns.
5. SelfAudit diagnoses why that is happening.
6. SelfAudit recommends what to do next.
7. SelfAudit produces a usable artifact or action-ready output.

The ambition is not generic AI advice.

The ambition is:

"Replace a large part of the reporting, monitoring, first-pass thinking, and next-step recommendation work that managers normally do."

---

## Functional-area framing

The clean direction is to organize SelfAudit around 4 operational areas:

1. Customer Service
2. Marketing & Sales
3. Finance & Accounting
4. Management & Strategy

These are the operating lanes.

For each lane, SelfAudit should be able to:

- read data from the main tools used in that lane
- normalize that data into meaningful KPIs
- compare actual signals against user-defined good/bad logic
- detect risks, drift, anomalies, or upside
- report what changed and why
- advise the founder on best next moves
- generate artifacts, summaries, and execution outputs

This mirrors what real businesses already do:

- each function has tools
- each function has a manager
- managers surface reporting upward
- the founder or COO interprets, decides, and acts

SelfAudit should become that reporting + interpretation + first-pass advisory layer.

---

## What currently exists in the codebase

This is important: the codebase already contains useful foundations. This should be extended, not thrown away.

### 1. Core audit and report pipeline already exists

Current live behavior:

- user brings a problem
- SelfAudit diagnoses it
- a report is generated
- report output is saved
- saved report updates shared business memory

Main files:

- `/Users/VNKLO/Documents/selfaudit/api/audit.js`
- `/Users/VNKLO/Documents/selfaudit/api/save-report.js`
- `/Users/VNKLO/Documents/selfaudit/src/components/Report.jsx`

Why this matters:

- this is already the advisory engine foundation
- this is already the root-cause analysis core
- this is already one of the strongest product differentiators

### 2. Shared business memory already exists

Current memory-related tables and logic:

- `business_state`
- `intelligence_profiles`
- `user_memory`

Main files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260505000001_business_state.sql`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260508000002_intelligence_backbone.sql`

What it currently does:

- stores business context
- stores recurring themes
- stores goals and goal score
- stores blockers, priorities, watchouts
- stores recent audit session memory

Why this matters:

- the system already does not start from zero each time
- this is the base for longitudinal intelligence

### 3. Intelligence Brief already exists

There is already a structured place for entering business metrics and context.

Main file:

- `/Users/VNKLO/Documents/selfaudit/src/components/IntelligenceBrief.jsx`

What it currently collects:

- financial metrics
- operational metrics
- business context

Examples:

- ARR / MRR / churn / CAC / LTV / burn / runway
- headcount / sales cycle / active customers / NPS / support load
- funding stage / competitors / current focus / biggest risk

Why this matters:

- this is already the beginning of area-specific governance input
- it can become the user-defined baseline and rule layer later

### 4. Monitoring and alerting skeleton already exists

Main files:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/business-health.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/weekly-digest.js`
- `/Users/VNKLO/Documents/selfaudit/api/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/update-risk-alert.js`

What it currently does:

- runs preset business-health checks
- derives risks from signals
- persists alerts
- supports active/open/acknowledged/resolved alert states
- can send scheduled email digests
- can send proactive alert emails

Why this matters:

- the system already has the beginnings of governance behavior
- the cron model and alert persistence are already in place

### 5. User alert preferences already exist

Main files:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260508000002_intelligence_backbone.sql`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260516000000_refine_notification_areas.sql`

Current supported preference areas:

- goal progress
- pipeline & revenue
- execution
- customer health
- critical risks

Current supported controls:

- enabled / paused
- cadence
- channel
- broad areas to watch

Why this matters:

- there is already a user-facing configuration layer
- but it is broad category selection, not yet true risk-matrix configuration

### 6. Connector foundation exists, but coverage is still early

Main file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/connectors/registry.js`

Current state:

- HubSpot is the only truly available connector
- Stripe, Gmail, Drive, Slack, Notion, Zendesk are listed as coming soon

Why this matters:

- the connector mental model is already in place
- but true operational governance needs more real connector coverage

### 7. Dashboard shell for governance already exists

Main file:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

Current surfaced governance-ish UI:

- Business health card
- Open issues
- AI opportunities
- Weekly digest & alerts
- Alerts inbox
- notification preferences
- follow-up/check-in flow

Why this matters:

- this can become the front-end shell for the operations governance system
- it does not need to be reinvented from zero

---

## What the current system is good at

Right now SelfAudit is good at:

- diagnosing specific business problems
- producing structured business reports
- saving context over time
- storing business signals
- capturing core business metrics
- doing rule-based risk checks
- creating alerts
- producing weekly digests
- helping generate execution-ready outputs

This is already meaningful.

---

## What the current system is not yet good at

Right now SelfAudit is not yet a full operations governance system.

Main limitations:

### 1. Monitoring logic is too centralized and hardcoded

The current health-check engine is useful, but it is one shared logic file:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`

Problems:

- business functions are not cleanly separated
- thresholds are preset in code
- logic is not modular per operational area
- future editing per functional area will get messy if this keeps growing

### 2. No true custom KPI threshold / risk matrix system yet

Users can choose broad watch categories, but cannot yet define:

- exact KPI thresholds
- custom cutoffs
- escalation logic
- what "good" or "bad" means for their business
- area-specific governance rules

So current monitoring is:

- system-defined heuristics

not yet:

- user-defined governance logic

### 3. Shared business memory is too generic for the future direction

`business_state` and `intelligence_profiles` are useful, but they are not yet organized by functional area.

That makes them good as a shared executive brain, but not sufficient as the only data model for long-term functional governance.

### 4. Connector coverage is not yet broad enough

Operational governance requires real tools in each functional area.

Current live reality:

- HubSpot is effectively the main connected operational signal source

Needed for future depth:

- Customer Service tools
- Finance / accounting / payment tools
- Management / strategy / documentation tools
- more marketing and sales tools

### 5. The product still leans too much toward reactive diagnosis

It already has proactive ingredients, but the dominant product shape is still:

- founder brings a problem
- SelfAudit diagnoses the problem

The future direction requires:

- SelfAudit watches the business and proactively raises what matters

---

## What should be kept intact

This is critical for safe evolution.

Keep these parts intact and build on top:

### Keep

- auth and billing flows
- audit engine
- report generation and save path
- company brain / memory synthesis
- alert persistence model
- digest infrastructure
- dashboard shell
- artifact and execution output model

### Keep, but repurpose

- `business_state`
  - keep it as shared executive/company context
- `intelligence_profiles`
  - keep it as synthesized cross-area intelligence
- `risk_alerts`
  - keep it as the cross-area alert persistence table
- current notification preferences
  - keep them as a base layer, then extend them later

### Do not do

- do not restart the product from scratch
- do not rewrite auth/billing/onboarding foundations unless necessary
- do not keep shoving all future governance logic into the current generic files forever

---

## Recommended architecture direction

The clean direction is:

- one shared core platform
- four operational area modules
- one advisory layer on top of all four

### Core platform

This should continue to own:

- auth
- billing
- workspace
- dashboard shell
- connectors auth layer
- alert persistence
- digest sending
- memory
- artifacts
- shared advisor utilities

### Functional area modules

Proposed area modules:

- Customer Service
- Marketing & Sales
- Finance & Accounting
- Management & Strategy

Each area should have the same internal shape:

- connectors
- metrics
- rules
- governance
- advisor
- artifacts

That makes the product understandable and the codebase maintainable.

---

## Proposed codebase shape

This is the proposed additive structure.

```txt
src/
  areas/
    customer-service/
    marketing-sales/
    finance-accounting/
    management-strategy/
  components/
  pages/
  lib/
    core/
    advisor/
    connectors/
    alerts/
    artifacts/
    memory/
    governance/

api/
  areas/
    customer-service/
    marketing-sales/
    finance-accounting/
    management-strategy/
  core/
  lib/
    governance/
      shared/
      areas/
        customer-service/
        marketing-sales/
        finance-accounting/
        management-strategy/

supabase/
  migrations/
```

For each functional area:

```txt
area/
  connectors/
  metrics/
  rules/
  governance/
  advisor/
  artifacts/
  config.js
```

This gives future sessions a clear place to improve one area without touching everything else.

---

## Proposed data model direction

Current tables are not enough for the full governance vision by themselves.

Recommended additive tables:

### 1. `area_configs`

Purpose:

- stores which functional areas are active for a workspace
- stores which connectors are relevant to that area
- stores any area-level settings

### 2. `area_metric_snapshots`

Purpose:

- stores normalized KPI snapshots per area over time
- provides historical comparisons and trend detection

Example:

- marketing-sales
  - pipeline value
  - SQL count
  - conversion rate
- finance-accounting
  - burn
  - runway
  - gross margin
- customer-service
  - ticket volume
  - resolution time
  - CSAT

### 3. `area_alert_rules`

Purpose:

- stores user-defined thresholds
- stores cutoffs
- stores risk matrix rules
- stores severity mappings
- stores alert conditions

This is the most important new model.

Without this, SelfAudit remains heuristic-driven only.

### 4. `area_findings`

Purpose:

- stores what the system detected
- drift, anomalies, failures, opportunities, and trend changes

This becomes the layer between raw data and advisory output.

### 5. `area_reports`

Purpose:

- stores generated summaries and area-level periodic reporting

### 6. `area_connector_states`

Purpose:

- sync health
- last fetch time
- data freshness
- connector-specific ingestion state

---

## Recommended implementation strategy

This should be done in phases, not in one giant rewrite.

### Phase 1: Preserve and stabilize the current base

Goal:

- do not break auth
- do not break billing
- do not break existing audit/report flow
- do not break dashboard shell

Work:

- leave current core platform intact
- document current connector and alert paths
- avoid invasive rewrites

### Phase 2: Extract governance logic into modular area analyzers

Goal:

- stop centralizing all governance logic in one giant file

Work:

- split `/api/lib/monitoring/health-check.js` into:
  - shared utilities
  - customer-service analyzer
  - marketing-sales analyzer
  - finance-accounting analyzer
  - management-strategy analyzer

Result:

- same functionality, cleaner shape

### Phase 3: Introduce normalized metric snapshots

Goal:

- stop relying only on ad hoc fetched context or memory fields

Work:

- create metric snapshot model
- build normalized KPI ingestion per area
- preserve raw connector pulls, but store normalized operational facts separately

### Phase 4: Add rule configuration / risk matrix model

Goal:

- let user define what "good" and "bad" mean

Work:

- UI for thresholds, red lines, watchouts, and risk conditions
- backend table for rules
- risk evaluation against those rules

This is where the product moves from:

- "SelfAudit has opinions"

to:

- "SelfAudit governs the business based on real logic + real signals"

### Phase 5: Run the advisor on top of findings

Goal:

- combine monitoring with SelfAudit's strongest differentiator: diagnosis

Work:

- use findings as inputs to advisory prompts
- root-cause the detected issues
- explain why the signal matters
- recommend next move
- produce artifacts

### Phase 6: Improve the front-end by area

Goal:

- present governance as clear functional lanes

Work:

- area dashboards
- area findings
- area alerts
- area KPI summaries
- area artifacts

---

## How the current system maps into the future architecture

### Current system parts to keep using

#### Audit and advisory

Keep using:

- `/Users/VNKLO/Documents/selfaudit/api/audit.js`
- `/Users/VNKLO/Documents/selfaudit/api/save-report.js`
- `/Users/VNKLO/Documents/selfaudit/src/components/Report.jsx`

Future role:

- becomes the core advisor and root-cause engine

#### Shared memory and synthesis

Keep using:

- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`
- `business_state`
- `intelligence_profiles`
- `user_memory`

Future role:

- becomes the executive memory layer above the area modules

#### Alerts layer

Keep using:

- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/update-risk-alert.js`

Future role:

- remains the shared alert persistence mechanism, but alerts become generated by area modules

#### Digest layer

Keep using:

- `/Users/VNKLO/Documents/selfaudit/api/cron/weekly-digest.js`

Future role:

- area summaries feed a stronger digest

#### Dashboard

Keep using:

- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`

Future role:

- becomes the main governance shell
- later organized more clearly around functional areas

### Current parts that should be refactored

#### `health-check.js`

Current role:

- all-in-one governance engine

Future role:

- split into shared evaluation engine + per-area analyzers

#### current broad notification areas

Current role:

- rough category filter

Future role:

- bridge into real area-specific rules and threshold-based monitoring

#### connector registry

Current role:

- list of connectors

Future role:

- connectors assigned explicitly to functional areas
- each area owns its ingestion logic

---

## Connectors by area: suggested starting point

This should stay pragmatic.

Only start with top-used tools that materially improve visibility.

### Customer Service

Suggested first connectors:

- Zendesk
- Gmail

Potential signals:

- ticket volume
- average resolution time
- repeat complaints
- CSAT
- backlog size
- slow response patterns

### Marketing & Sales

Suggested first connectors:

- HubSpot
- one additional marketing/sales source later

Potential signals:

- pipeline value
- lead flow
- conversion
- deal velocity
- stage stagnation
- follow-up gaps

### Finance & Accounting

Suggested first connectors:

- Stripe
- accounting tool later

Potential signals:

- revenue trend
- churn
- refunds
- burn
- runway
- concentration risk
- margin compression

### Management & Strategy

Suggested first connectors:

- Notion
- Google Drive

Potential signals:

- goals and OKRs
- decision documentation
- strategy-vs-execution gaps
- missing SOP coverage
- repeated leadership bottlenecks

---

## What "user-defined good and bad" should really mean

This should not just be:

- "set a number"

It should support:

- KPI thresholds
- watchouts
- critical red lines
- severity levels
- frequency of evaluation
- preferred alerting behavior
- optional notes on why this matters to the business

Examples:

- alert me if churn > 3%
- alert me if runway < 9 months
- alert me if ticket backlog grows 20% in a week
- alert me if pipeline drops below $100k
- alert me if the sales cycle stretches above 45 days
- alert me if customer response time exceeds 12 hours

This is the missing governance layer.

---

## Core design principle

Do not build this as one giant "AI brain".

Build it as:

- structured area modules
- deterministic signal and rule evaluation
- then put the advisory intelligence on top

This matters because:

- pure AI advice will feel generic or fake
- grounded AI over real signals, real thresholds, and real context can feel genuinely useful

So the system should be:

- machine-like in monitoring discipline
- advisor-like in interpretation and recommendation

---

## Risks if we build it the wrong way

### Risk 1: keep everything in current generic tables and logic

Result:

- codebase becomes messy
- business areas blur together
- future improvements become painful

### Risk 2: build too much generic AI before building real governance primitives

Result:

- product sounds smart but behaves vaguely
- users lose trust

### Risk 3: overpromise connector breadth too early

Result:

- brittle integrations
- weak signal quality

### Risk 4: let this become only a dashboard

Result:

- loses differentiation
- becomes passive rather than proactive

---

## Recommended near-term build stance

For the next phase, the safest and cleanest approach is:

1. Keep the current product intact.
2. Add an area-based architecture beside the current core.
3. Refactor existing monitoring into area modules.
4. Add user-defined rules and thresholds.
5. Feed those findings into the current advisory engine.
6. Improve the front-end after the data and architecture are properly shaped.

This avoids:

- breaking auth
- breaking billing
- breaking the report engine
- losing already-built advisory strengths

---

## Files most likely to be touched in the future

These are the most relevant current files for the next architecture step.

### Core live files

- `/Users/VNKLO/Documents/selfaudit/src/App.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/Dashboard.jsx`
- `/Users/VNKLO/Documents/selfaudit/src/components/IntelligenceBrief.jsx`
- `/Users/VNKLO/Documents/selfaudit/api/audit.js`
- `/Users/VNKLO/Documents/selfaudit/api/save-report.js`
- `/Users/VNKLO/Documents/selfaudit/api/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/update-risk-alert.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/business-health.js`
- `/Users/VNKLO/Documents/selfaudit/api/cron/weekly-digest.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/health-check.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/monitoring/risk-alerts.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/intelligence/company-brain.js`
- `/Users/VNKLO/Documents/selfaudit/api/lib/connectors/registry.js`

### Core schema files

- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260505000001_business_state.sql`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260508000002_intelligence_backbone.sql`
- `/Users/VNKLO/Documents/selfaudit/supabase/migrations/20260516000000_refine_notification_areas.sql`

### Likely new folders/files

- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/customer-service/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/marketing-sales/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/finance-accounting/`
- `/Users/VNKLO/Documents/selfaudit/api/lib/governance/areas/management-strategy/`
- `/Users/VNKLO/Documents/selfaudit/src/areas/`
- new Supabase migrations for area config / rules / snapshots / findings

---

## Bottom-line recommendation

Do not restart the product.

Do not keep stretching the current generic intelligence files forever.

Build the next version as:

- current system preserved as the core
- new additive modular governance architecture by functional area
- current advisory/reporting strengths reused as the top-layer intelligence system

That is the cleanest path to turning SelfAudit into the operations governance + advisor product it is trying to become.
