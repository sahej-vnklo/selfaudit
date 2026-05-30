# Dashboard — Architecture Record
*Written before visual redesign (2026-05-30). Use this to understand the original setup during the wiring phase.*

---

## File location
`src/components/Dashboard.jsx` — 7020 lines, single file.

---

## Props received from App.jsx

| Prop | Type | Purpose |
|---|---|---|
| `user` | Supabase User object | Current authenticated user (`user.id`, `user.email`, `user.user_metadata.name`) |
| `onStartAudit` | `(info) => void` | Navigates to AuditChat with a userInfo object |
| `onSignOut` | `() => void` | Signs out and clears session |

---

## State variables

| Variable | Purpose |
|---|---|
| `theme` | `'dark'` / `'light'` / `'sharp'` — persisted in `localStorage` as `sa-theme` |
| `profile` | Full `profiles` row from Supabase (tier, name, industry, domain, etc.) |
| `businessState` | Merged business state (from `business_state` table + `user_memory` fallback) |
| `businessStateLoading` | Loading flag for business state |
| `healthIntel` | Response from `/api/business-health` — AI-generated intelligence |
| `reports` | Array of last 24 `reports` rows, ordered by `created_at desc` |
| `reportsLoading` | Loading flag |
| `billing` | Billing details from Supabase function `get-billing-details` |
| `billingLoading` / `billingError` | Billing fetch state |
| `checkoutSyncing` | True while polling `/api/checkout-session-status` after Stripe redirect |
| `portalLoading` | True while opening Stripe billing portal |
| `section` | Current nav section — read from URL hash (see Section Routing below) |
| `requiresPayment` | True if profile has no active subscription — locks dashboard to billing screen |
| `sidebarExpanded` | Whether sidebar is at 220px width |
| `goalModal` | Controls GoalCaptureModal visibility |
| `scopeSetupOpen` | Controls AuditScopeSetupModal visibility |
| `alerts` | Array of risk alerts from `/api/risk-alerts` |
| `alertsLoading` / `alertsError` | Alert fetch state |
| `updatingAlertIds` | Map of alertId → true for in-progress status updates |
| `completingOnboarding` | True while saving `onboarding_complete: true` to Supabase |

---

## Section routing

URL hash drives navigation. Sections are stored in hash (e.g., `#home`, `#reports`).

```
home            → HomeSection (command centre)
oversight       → OperationalOversightSection (intelligence only)
reports         → ReportList
intelligence    → IntelligenceBrief
business-state  → BusinessStateCard
alerts          → AlertsInboxSection (intelligence only)
connectors      → ConnectorsSection (intelligence only)
agent           → AgentSection (intelligence only)
billing         → TierCard grid + LiveBillingCard
account         → AccountSection
```

**Intelligence-only sections:** `oversight`, `alerts`, `connectors`, `agent` — redirected to home if `tier !== 'intelligence'`.

**Key function:** `navigateSection(section)` — calls `history.pushState` and `setSection`.

---

## Data fetching

### Supabase tables read
| Table | Fields selected | Purpose |
|---|---|---|
| `profiles` | `tier, industry, domain, context, name, phone, onboarding_complete, created_at, stripe_customer_id, stripe_subscription_id, intelligence_docs, intelligence_complete, shared_with_vnklo, shared_report_id, notification_email, last_digest_sent_at, last_digest_summary` | User profile + subscription status |
| `reports` | `id, title, content, headline, industry, domain, conversation_mode, status, created_at` | Audit history, last 24 records |
| `business_state` | `*` | Persistent business context |
| `user_memory` | `business_state, created_at` | Fallback memory rows |
| `intelligence_notification_preferences` | `enabled, frequency, channels, areas` | Notification settings (HomeSection) |

### API endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/business-health` | GET `?userId=` | AI health intelligence (non-blocking) |
| `/api/risk-alerts` | POST `{userId}` | Load alerts (intelligence tier only) |
| `/api/update-risk-alert` | POST `{userId, alertId, status}` | Update alert status |
| `/api/send-auth-link` | — | (Login, not dashboard) |
| `/api/create-checkout-session` | POST | Create Stripe checkout |
| `/api/checkout-session-status` | POST `{userId, sessionId}` | Poll checkout activation |

### Supabase Edge Functions
| Function | Purpose |
|---|---|
| `get-billing-details` | Fetch Stripe billing summary |
| `create-portal-session` | Open Stripe billing portal |

---

## Theme system (BEFORE redesign)

Three themes: `dark`, `light`, `sharp`. Stored in `localStorage('sa-theme')`.

`getThemeVars()` returns an object of CSS custom properties injected as inline style on the root div:
```
--bg, --surface, --surface2, --surface3, --panel, --panel-alt,
--border, --border2, --text, --text-secondary, --text-muted, --text-faint,
--accent, --accent-light, --accent-text,
--red, --red-bg, --red-text,
--amber, --amber-bg, --amber-text,
--green, --green-bg, --green-text,
--blue, --violet, --sand, --white, --overlay, --overlay-soft,
--rich-hero-surface, --rich-panel-surface,
--rich-hero-border, --rich-panel-border, --rich-hero-inset,
--rich-hero-shadow, --rich-panel-shadow
```

The `G` object maps friendly names to these CSS vars:
```js
G.text        → var(--text)
G.textMuted   → var(--text-muted)
G.border      → var(--border)
G.accent      → var(--accent)
G.accentText  → var(--accent-text)
// ... etc
```

All inline styles throughout the component use `G.xxx`.

---

## Business logic functions (do not touch during visual redesign)

| Function | Purpose |
|---|---|
| `normalizeTier(raw)` | Normalises tier string to 'foundation' or 'intelligence' |
| `profileRequiresPayment(profile)` | Returns true if no active subscription |
| `shouldShowWelcomeTourForProfile(profile)` | Determines if welcome tour should show |
| `computeHealthScore(domains)` | Weighted health score from domain array |
| `extractGoalState(profile, reports, businessState)` | Extracts current goal from context |
| `buildAiOpportunityItems(reports, tier)` | Builds AI opportunity cards from reports |
| `parseReportContent(input)` | Parses report JSON/string content |
| `mergeBusinessState(primary, fallback)` | Merges business_state rows |
| `normalizeBusinessStateSnapshot(source)` | Normalises business state fields |
| `severityRank(status)` | Sorts domains by severity |
| `domainScore(domain)` | Score for a single domain |
| `formatRelativeTime(input)` | Human-readable time labels |
| `alertSeverityTone(value)` | Color tone for alert severity |
| `governanceStatusTone(value)` | Color tone for governance status |

---

## Key sub-components (all in Dashboard.jsx)

| Component | Line | Purpose |
|---|---|---|
| `Dashboard` | 772 | Main exported component |
| `HomeSection` | 1574 | Command centre home page — most complex |
| `PageShell` | 1557 | Wrapper for non-home sections |
| `KpiCard` | 2185 | Metric card with delta |
| `OperationalOversightSection` | 2249 | 4-lane operational view |
| `AlertsInboxSection` | 2324 | Risk alerts list |
| `OpenIssuesDetailPanel` | 2429 | Issue tracking panel |
| `BusinessHealthPanel` | 2452 | Health score + goal state |
| `WeeklyDigestAlertsPanel` | 2610 | Notification settings |
| `FounderCheckInPanel` | 2754 | Check-in / follow-up |
| `AiOpportunitiesDetailPanel` | 2839 | AI opportunity items |
| `BusinessStateCard` | 3011 | Business state viewer/editor |
| `ConnectorsSection` | 3186 | HubSpot + other connectors |
| `AgentSection` | 3410 | Ask SelfAudit chat agent |
| `AccountSection` | 3760 | Profile + sign out |
| `TierCard` | 4664 | Pricing plan card |
| `LiveBillingCard` | 4626 | Active subscription details |
| `SidebarButton` | 4731 | Old sidebar nav button |
| `GoalCaptureModal` | 4058 | Goal input modal |
| `AuditScopeSetupModal` | 4150 | Industry/domain setup |
| `OpenIssuesTracker` | 4217 | Mini issue list |
| `ReportCard` / `ReportList` | 4549 / 4618 | Report history items |

### External components imported
| Import | File | Purpose |
|---|---|---|
| `IntelligenceBrief` | `./IntelligenceBrief.jsx` | Intelligence brief section |
| `ExecutionPanel` | `./ExecutionPanel.jsx` | Execution panel |
| `DashboardWelcomeTour` | `./DashboardWelcomeTour.jsx` | Onboarding tour |

---

## Layout (BEFORE redesign)

```
<div>   ← root, inline themeVars, data-theme={theme}
  <aside>   ← sidebar (52px, expandable to 220px)
    ↳ collapse toggle
    ↳ SidebarButton × N (home, oversight, reports, intelligence, business-state, connectors, agent)
    ↳ billing button
    ↳ avatar/account button
  </aside>
  <div>   ← appFrame (flex column, fills remaining width)
    <header>   ← topbar (54px height)
      ↳ logo + breadcrumb
      ↳ theme toggle + alerts button + diagnose + map goal
    </header>
    <main>   ← main content area (scrollable)
      ↳ {section === 'home'} HomeSection
      ↳ {section === 'oversight'} PageShell → OperationalOversightSection
      ↳ {section === 'reports'} PageShell → ReportList
      ↳ {section === 'intelligence'} PageShell → IntelligenceBrief
      ↳ {section === 'business-state'} PageShell → BusinessStateCard
      ↳ {section === 'alerts'} PageShell → AlertsInboxSection
      ↳ {section === 'connectors'} ConnectorsSection
      ↳ {section === 'agent'} AgentSection
      ↳ {section === 'billing'} PageShell → TierCard grid
      ↳ {section === 'account'} AccountSection
    </main>
  </div>
</div>
```

---

## New design navigation mapping

For the wiring phase, these are the new nav item → existing section mappings:

| New nav button | Old section | Notes |
|---|---|---|
| Command | `home` | Will show Agent X + Agent Y cards + command bar |
| Sessions | `reports` | Audit history |
| Context | `business-state` | Business intelligence state |
| Connectors | `connectors` | Tool integrations |
| Account | `account` | Profile + sign out |
| Topbar "Oversight" | `oversight` | Intelligence only |
| Topbar "AI Opportunities" | `intelligence` | Intelligence only |

---

## Protected zones — DO NOT TOUCH

- All `useEffect` blocks (lines 811–1280)
- All Supabase queries and API calls
- `normalizeTier`, `profileRequiresPayment`, checkout sync logic
- `HomeSection` internal state and data logic
- `AgentSection` internal logic
- `ConnectorsSection` internal logic
- `IntelligenceBrief` (separate file)
- `ExecutionPanel` (separate file)

---

## Checkout flow

On return from Stripe:
1. URL hash becomes `#billing?checkout=success&session_id=xxx&plan=yyy`
2. `captureCheckoutReturnFromHash()` in App.jsx saves to localStorage
3. Dashboard polls `/api/checkout-session-status` up to 6 times (1.2s apart)
4. On `data.ready` → updates profile, clears `requiresPayment`, navigates to `#home`

---

*End of record. This file should not need updating during the visual redesign — it documents the original state.*
