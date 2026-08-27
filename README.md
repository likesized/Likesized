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
Canonical recovery is complete. `main` is the one production line. PR #51 is merged and live at `main` commit `93d9414a29f81b5732c42bf277cc085db5e93998`; exact deployment/audit/next-work state belongs in `docs/AI_MASTER_LOG.md`.

A 2026-08-23 canonical audit found stale historical branch refs and pre-deployment documentation, not a second live implementation on `main`. The master owns the final branch-cleanup ledger and current owner review/repair sequence.

## Current product meaning

### Community-built Product catalog
**A clothing catalog built by the people who actually wear it.**

- Ordinary member intake searches LikeSized's own Product catalog; it does not call SerpAPI.
- A clean, unique first member submission may automatically become a searchable canonical **Provisional** Product. Routine new clothing should not require admin approval.
- Product identity trust has four tiers: **Provisional = 1 distinct wearer; Corroborated = 2–4; Established = 5+; Verified = authoritative/admin-reviewed**.
- The five-wearer milestone remains stronger community evidence; it is no longer a publishing gate.
- Community wearer count does not silently verify unrelated Product facts such as material, description, Department or controlled attributes.
- If a new submission already carries a real duplicate, conflicting identity, barcode/listing collision, or other blocking signal, it remains unresolved for review rather than creating questionable Product truth.
- Later conflicts or member reports do not automatically delete or unpublish an existing Product. They create review evidence while the Product remains usable until an audited resolution changes it.
- Product identity confidence and Product-to-barcode confidence are separate.

### Exception-driven catalog review
Every published Product can be reported through one **Report this item** action for inappropriate content, an image that does not match the Product, incorrect information, or another concern.

Catalog flags are prioritized by trust and independent evidence:
- Provisional (1 wearer) → high when flagged;
- Corroborated (2–4 wearers) → high when flagged;
- Established (5+ wearers) → one isolated ordinary disagreement starts low and repeated independent signals escalate medium/high;
- Verified → isolated ordinary reports start low and repeated independent signals may escalate;
- strong duplicate/identity/identifier conflicts can escalate regardless of tier.

LikeSized may also generate conservative internal possible-duplicate/identity flags from evidence such as closely related names, barcodes, retailer links, aliases, or other Product signals. These are review signals, not permission to fuzzy-merge Products automatically.

### Direct Product search vs Fit Community
Direct Product search is global. A member does **not** need to switch to Men or Women to find a matching men's or women's Product.

**Fit Community — Men / Women / Both** is a private member relevance preference for social/matching discovery such as People My Size and My Circle. It filters the people/wearers being surfaced; it is not Product Department and it never changes body Match %.

A member's Fit Community does not change because they wear a garment sold in another Department.

### Fit Profile and measurement privacy
Exact current and historical body measurements remain private. LikeSized exposes safe derived Match/context, not raw measurements. Match logic remains garment-relevant. Exact public sex/body-specific measurement FAQ wording remains pending owner review.

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

### Barcode confidence and scanner confirmation
- first distinct member supporting a new Product→barcode relationship = provisional barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated barcode relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned.

On **Is this the item?**, scanner imagery prioritizes **Product/catalog photo → shared member Fit Photo → placeholder**. A Fit Photo fallback stays personal wear evidence and is never promoted into canonical Product imagery.

### Fit Result
Fit Result is Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

### Matching, tracked variation and recommendations
Current-person Match and historical garment Match are separate. Match % means garment-relevant body similarity, not probability that an item will fit.

Current recommendation hierarchy is **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.

Tracked variation meaning is owner-locked but its question-by-question classification audit is intentionally deferred: only explicitly approved variation-defining structured garment questions may define a tracked variation; **Size and Color never do**. Product Detail must not implement Exact Variation ahead of that audit.

Help Me Size It is fallback sizing assistance and reuses the canonical recommendation engine. It never creates a second sizing engine or invents a size when evidence is insufficient.

### Closet, Products and social surfaces
The owner-locked target is one public member Closet for garments/Fit Reports, with owner-only controls layered onto the same content. Legacy per-garment private/shared implementation remains migration debt; raw body data stays private regardless.

Outfits remain V1 and reuse canonical Closet/Product data. Product Like, Wish Locker, Product notification, person notification and Shop are separate actions with separate intent.

### Retail links and commerce
One Product may have multiple valid retailer listings. Listings append/dedupe rather than overwrite one another. Shop appears only when a valid destination exists. Commission must never affect Match, recommendation, Product identity, search relevance, ranking, or retailer choice.

## Database rule
`supabase/migrations/` is executable database history. Do not rewrite applied migrations. `supabase/schema.sql` is retired as an alternate schema source.

## Verification
Pull requests are classified as Repair or Product Change. Trusted governance is evaluated from canonical base logic, fast PR verification is change-aware during iteration, and the exact final candidate must pass the full `Release Verification` gate before protected `main` can accept it. Current branch status and exact next action are recorded only in `docs/AI_MASTER_LOG.md`.