# Blueprint Catalog — Handover & Build Spec

> **Purpose of this doc:** When Sahej hands over the complete prebuilt list of industries, areas, and units, read this doc first. It tells you exactly what is already wired, what is a placeholder, and the exact steps to complete the setup. Nothing in here requires guesswork — just fill the gaps and wire.

---

## What the blueprint catalog is

The catalog is the backbone of SelfAudit's monitoring engine. It defines every industry, area, and unit type the product knows about. When a user completes onboarding (picks industry + areas), the system builds a `company_schema` from these definitions. The schema then tells the health check engine what to monitor, what metrics to evaluate, and what rule thresholds to fire.

**Files:**
- `api/lib/blueprint/catalog/industries.js` — industry definitions
- `api/lib/blueprint/catalog/areas.js` — area definitions with metrics + threshold rules
- `api/lib/blueprint/catalog/units.js` — unit type definitions with properties + links
- `api/lib/blueprint/catalog/index.js` — re-exports everything
- `api/lib/blueprint/schema-builder.js` — builds a company schema from user selections
- `api/lib/blueprint/schema-registry.js` — loads a user's saved schema from Supabase
- `api/lib/blueprint/schema.js` — factory functions: `createIndustry`, `createArea`, `createSchema`, `createUnitType` etc.

---

## Current state — what is fully built and working

### Industries in catalog (8)

| ID | Label | Default Areas | Default Units |
|----|-------|---------------|---------------|
| `saas-software` | SaaS / Software | customer-service, finance-accounting, marketing-sales, management-strategy | customer, deal, lead, support-ticket, goal, team-member |
| `ecommerce-d2c` | E-commerce / D2C | revenue-sales, inventory-operations, customer-service, finance-accounting, management-strategy | order, sku, supplier, ecom-customer |
| `manufacturing` | Manufacturing | production, inventory-operations, finance-accounting, management-strategy | machine, production-line, raw-material, manufacturing-order, mfg-supplier |
| `professional-services` | Professional Services | client-delivery, finance-accounting, marketing-sales, management-strategy | project, ps-client, consultant, invoice |
| `retail-hospitality` | Retail & Hospitality | revenue-sales, inventory-operations, customer-service, finance-accounting, management-strategy | sku, order, ecom-customer |
| `healthcare` | Healthcare | customer-service, finance-accounting, management-strategy | ps-client, invoice, team-member |
| `real-estate` | Real Estate | marketing-sales, finance-accounting, management-strategy | deal, lead, invoice |
| `other` | Other | finance-accounting, management-strategy | _(none)_ |

### Areas in catalog — with full metric definitions + threshold rules

| ID | Label | Industries |
|----|-------|------------|
| `customer-service` | Customer Service | saas-software, ecommerce-d2c, professional-services |
| `finance-accounting` | Finance & Accounting | saas-software, ecommerce-d2c, professional-services, manufacturing |
| `management-strategy` | Management & Strategy | saas-software, ecommerce-d2c, professional-services, manufacturing |
| `marketing-sales` | Marketing & Sales | saas-software, professional-services |
| `revenue-sales` | Revenue & Sales | ecommerce-d2c |
| `inventory-operations` | Inventory & Operations | ecommerce-d2c, manufacturing |
| `production` | Production | manufacturing |
| `client-delivery` | Client Delivery | professional-services |

Each of these has: metric definitions (keys, labels, units, direction), threshold rules (watch/bad with severity, title, recommendation, rationale).

### Unit types in catalog (fully defined with properties + links)

| ID | Label | Used in areas |
|----|-------|---------------|
| `customer` | Customer | customer-service, finance-accounting |
| `support-ticket` | Support Ticket | customer-service |
| `deal` | Deal | marketing-sales |
| `lead` | Lead | marketing-sales |
| `goal` | Goal | management-strategy |
| `team-member` | Team Member | management-strategy |
| `order` | Order | revenue-sales, inventory-operations |
| `sku` | SKU / Product | inventory-operations |
| `supplier` | Supplier (ecom) | inventory-operations |
| `ecom-customer` | Customer (ecom) | revenue-sales |
| `machine` | Machine | production |
| `production-line` | Production Line | production |
| `raw-material` | Raw Material | inventory-supply-chain |
| `manufacturing-order` | Production Order | production, orders-sales |
| `mfg-supplier` | Supplier (mfg) | inventory-supply-chain |
| `project` | Project | client-delivery, revenue-billing |
| `ps-client` | Client | client-delivery, business-development |
| `consultant` | Consultant | resource-management |
| `invoice` | Invoice | revenue-billing |

---

## Current state — what is a placeholder or gap

### 1. Onboarding UI industry IDs don't all match catalog IDs

The onboarding screen (`src/components/SchemaSetup.jsx` + `api/schema-setup.js`) shows 8 industries to the user. Only 4 map cleanly to the catalog. The other 4 are aliased as workarounds:

| UI label | UI ID | Aliased to | Problem |
|----------|--------|------------|---------|
| SaaS / Software | `saas` | `saas-software` | Fine |
| E-commerce / Retail | `ecommerce` | `ecommerce-d2c` | Fine |
| Professional Services | `professional_services` | `professional-services` | Fine |
| Healthcare | `healthcare` | `healthcare` | Fine |
| Marketplace | `marketplace` | `saas-software` | **Alias only — no real marketplace industry in catalog** |
| Consumer App | `consumer_app` | `saas-software` | **Alias only — no real consumer app industry in catalog** |
| Fintech | `fintech` | `saas-software` | **Alias only — no real fintech industry in catalog** |
| Media & Content | `media_content` | `other` | **Alias only — maps to empty fallback** |

**What's needed:** When Sahej provides the full list, add the real industry entries to `api/lib/blueprint/catalog/industries.js` and update `INDUSTRY_ALIASES` in `api/schema-setup.js` to map to their real IDs (or remove the aliases entirely if UI IDs are changed to match catalog IDs directly).

### 2. Four areas exist in UI but have no catalog entries

These four areas are shown in the onboarding area picker and stored if selected, but have no metric definitions, no threshold rules, and no unit types in the catalog. They are built as empty custom areas via `createArea({...})` at save time.

| UI label | ID | Status |
|----------|----|--------|
| Product & Engineering | `product-engineering` | **Placeholder — no catalog entry, no rules, no units** |
| People & HR | `people-hr` | **Placeholder — no catalog entry, no rules, no units** |
| Operations | `operations` | **Placeholder — no catalog entry, no rules, no units** |
| Legal & Compliance | `legal-compliance` | **Placeholder — no catalog entry, no rules, no units** |

**What's needed:** For each of these, add a full area definition to `api/lib/blueprint/catalog/areas.js` with metrics + threshold rules, then add relevant unit types to `api/lib/blueprint/catalog/units.js`, and wire the area ID to the relevant industries in `api/lib/blueprint/catalog/industries.js`.

### 3. Units step missing from onboarding UI

The onboarding currently does: **Industry → Areas → Done**.

The full intended flow is: **Industry → Areas → Units → Done**.

The units step lets users confirm or customise which unit types they want to track within their selected areas. The infrastructure already supports this (`buildSchemaFromSelections` accepts `selectedUnitTypeIds`). It is not built in the UI yet because the unit catalog needs to be complete first.

**`src/components/SchemaSetup.jsx`** currently has 3 steps. The units step will be step 3, pushing the success state to step 4.

**What the units step needs to show:** after the user picks areas, fetch available unit types for those areas via `previewSchemaSelections(industryId, selectedAreaIds)` (already exported from `schema-builder.js` — returns `unitTypesByArea` grouped by area). Display them as a confirmation/selection grid. POST the final `areaIds + unitTypeIds` to `/api/schema-setup`.

---

## What Sahej needs to hand over

To complete the catalog and unblock the units step, the following decisions are needed:

1. **The full industry list** — which industries the product will support at launch. For each:
   - The canonical ID (e.g. `fintech`, `marketplace`)
   - The display label
   - Which areas should be pre-selected by default for that industry

2. **The full area list** — including the 4 missing ones. For each area:
   - What metrics should be tracked (name, unit type, direction — higher/lower is better)
   - What the threshold rules are (what value triggers watch vs. bad, and what the recommendation is)
   - Which industries it applies to

3. **The unit types per area** — for the 4 missing areas especially. For each unit type:
   - What properties it has (e.g. a "Hire" unit in people-hr might have `role`, `start_date`, `headcount_budget`, `status`)
   - How unit types link to each other (e.g. a Hire links to a Department)

Once that list is in hand, the build is:

```
Step 1 — Add industries to api/lib/blueprint/catalog/industries.js
Step 2 — Add areas to api/lib/blueprint/catalog/areas.js
Step 3 — Add unit types to api/lib/blueprint/catalog/units.js
Step 4 — Update INDUSTRY_ALIASES in api/schema-setup.js (or remove if IDs now match)
Step 5 — Build units picker step in src/components/SchemaSetup.jsx (step 3 of 4)
Step 6 — Update /api/schema-setup POST to pass selectedUnitTypeIds to buildSchemaFromSelections
```

Steps 1–4 are pure data entry. Step 5–6 is the only code work.

---

## How the health check engine uses the catalog (so you understand why completeness matters)

When a health check runs for a user, it calls `loadSchema(userId)` to get their company schema, then `runGovernanceMonitoring` evaluates each area against the schema's metric rules. Areas with no catalog entry (the 4 placeholders) will be skipped silently — no metrics, no diagnoses, no advice will fire for them. That is why completing the catalog matters before telling users these areas are monitored.

---

## Key function signatures for reference

```js
// Build schema from user selections (called by /api/schema-setup POST)
buildSchemaFromSelections(userId, {
  industryId: string,
  selectedAreaIds: string[],
  selectedUnitTypeIds?: string[],  // optional — defaults auto-populated from areas
  customAreas?: object[],          // for areas not in catalog (currently the 4 placeholders)
})

// Preview what unit types are available for a given industry + area selection
// Use this to populate the units picker in the UI
previewSchemaSelections(industryId, selectedAreaIds)
// returns: { industry, areas, unitTypesByArea: [{ areaId, areaLabel, unitTypes: [{ id, label, description }] }] }

// Load a user's saved schema
loadSchema(userId) // returns schema object or null
```
