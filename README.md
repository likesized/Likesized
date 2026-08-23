# LikeSized

V1 application for **LikeSized — See what fits people built like you.**

## Canonical source-of-truth roles
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — sole roadmap, status, owner-decision, recovery, deployment and AI-handoff record.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract and explicit implementation debt.
- `supabase/migrations/` — executable ordered database history.
- `README.md` — summary only; never a competing decision source.

If canonical documents disagree, stop feature work and reconcile them. Do not resurrect superseded product meaning from Git history or another branch.

## Current implementation status
Canonical recovery is complete. `main` is the one production line. The active owner-approved implementation line is PR #51 / `agent/fit-report-review-purchase-context`; exact verification/deployment state belongs in `docs/AI_MASTER_LOG.md`.

## Current product meaning

### Community-built Product catalog
**A clothing catalog built by the people who actually wear it.**

- Ordinary member intake searches LikeSized's own Product catalog; it does not call SerpAPI.
- A clean, unique first member submission may automatically become a searchable canonical **Provisional** Product. Routine new clothing should not require admin approval.
- A second distinct member with a Product Fit Report may strengthen a Provisional Product to **Corroborated**.
- **Verified** remains authoritative/admin-reviewed trust and is never granted merely from member count.
- If a new submission already carries a real duplicate, conflicting identity, barcode/listing collision, or other blocking signal, it remains unresolved for review rather than creating questionable Product truth.
- Later conflicts or member reports do not automatically delete or unpublish an existing Product. They create review evidence while the Product remains usable until an audited resolution changes it.
- Product identity confidence and Product-to-barcode confidence are separate.

### Exception-driven catalog review
Every published Product can be reported through one **Report this item** action for concerns such as inappropriate content, an image that does not match the Product, incorrect information, or another issue.

Catalog flags are prioritized by trust and independent evidence:
- Provisional / uncorroborated target → high priority;
- Corroborated target → normally medium;
- Verified target with one isolated ordinary report → normally low;
- repeated independent reports, identity conflicts, duplicate signals, or identifier/listing conflicts escalate priority.

LikeSized may also generate conservative internal possible-duplicate/identity flags from evidence such as closely related names, barcodes, retailer links, aliases, or other Product signals. These are review signals, not permission to fuzzy-merge Products automatically.

### Direct Product search vs Fit Community
Direct Product search is global. A member does **not** need to switch to Men or Women to find a matching men's or women's Product.

**Fit Community — Men / Women / Both** is a private member relevance preference for social/matching discovery such as People My Size and My Circle. It filters the people/wearers being surfaced; it is not Product Department and it never changes body Match %.

A member's Fit Community does not change because they wear a garment sold in another Department. For example, a woman reporting men's jeans remains Women-community social evidence.

### Fit Profile and measurement privacy
Exact current and historical body measurements remain private. LikeSized exposes safe derived Match/context, not raw measurements.

All accurate measurements can improve precision. Depending on the body and garment, some measurements can be especially informative—for example chest, shoulders, sleeve length and upper arm/bicep in many men's fits, or full bust, high bust, underbust, waist and hip/seat in many women's fits. These are examples, not rules; garment-relevant measurements drive the actual Match logic.

### Following vs Fit Twin
**Following controls My Circle; Fit Twin is a designation inside it.**

- Following is member-controlled and uses the one canonical `follows` graph.
- Fit Twin is **system-generated** among followed members from strong current-person Match; the initial threshold starts at 85% Overall Match.
- Follow alone does not make someone a Fit Twin.
- Style Feed/My Circle are Following-driven; Fit Twin is designation/filter/context only.
- `/following` is compatibility-only and resolves to My Circle.

### New Fit Report
Current main flow is Brand / Item → Overall Category → Specific Garment Type → optional Department → up to four controlled item-detail questions → Color → Size → Fit Result → Condition → optional Fit Photo → Fit Notes → Retail Link.

A collapsed **Optional Additional Information** area collects Purchased From, Price Paid, Purchase Method, Approx. Purchase Date, barcode when not already scanned, Style/Article Number, Material/Fabric Composition and Product Photo. Purchase context is one member's acquisition observation, never Product truth.

Before saving, **Does this look right?** reviews only the main Fit Report details. Optional additional information is not repeated there.

### Barcode confidence
- first distinct member supporting a new Product→barcode relationship = provisional barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated barcode relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned.

### Fit Result
Fit Result is Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

### Matching and recommendations
Current-person Match and historical garment Match are separate. Match % means garment-relevant body similarity, not probability that an item will fit.

Current recommendation hierarchy is **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.

Help Me Size It is fallback sizing assistance and reuses the canonical recommendation engine. It never creates a second sizing engine or invents a size when evidence is insufficient.

### Closet, Products and social surfaces
The owner-locked target is one public member Closet for garments/Fit Reports, with owner-only controls layered onto the same content. Legacy per-garment private/shared implementation remains migration debt; raw body data stays private regardless.

Outfits remain V1 and reuse canonical Closet/Product data. Product Like, Wish Locker, Product notification, person notification and Shop are separate actions with separate intent.

### Retail links and commerce
One Product may have multiple valid retailer listings. Listings append/dedupe rather than overwrite one another. Shop appears only when a valid destination exists. Commission must never affect Match, recommendation, Product identity, search relevance, ranking, or retailer choice.

## Database rule
`supabase/migrations/` is executable database history. Do not rewrite applied migrations. `supabase/schema.sql` is retired as an alternate schema source.

## Verification
Canonical CI runs `npm run canonical:check`, TypeScript, focused safeguards, production build, fresh migration replay and database behavior/privacy tests. Current branch status and exact next action are recorded only in `docs/AI_MASTER_LOG.md`.