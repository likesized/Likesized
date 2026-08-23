# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current status record, owner-decision ledger, implementation-debt ledger, deployment checkpoint and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

# CURRENT STATUS — 2026-08-23

## Canonical production line
- `main` is the one production implementation line and is coupled to Vercel production.
- Applied database migrations are immutable; corrections use later additive migrations.
- No paid Supabase branches.
- PR #49 generalized community catalog confidence and is live production history.
- PR #50 reconciled that production status to `main` commit `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 / `agent/fit-report-review-purchase-context` is the one active implementation line.

## Catalog-confidence production checkpoint — LIVE BEFORE PR #51
Production Supabase project: `rlksidwniuoxoacumyaf`.

Latest confirmed catalog-confidence production record is `20260823054933 generalize_catalog_identity_confidence`, sourced from local canonical `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`. That production behavior still uses the older candidate-first confidence implementation until a later authorized migration is applied.

The known Maidenform / Heirloom test artifact is preserved:
- candidate `de34b6dd-47c9-4795-af77-5117e4f8b554`;
- UPC `196988323504`;
- two-account production testing already proved distinct-member corroboration worked under the currently deployed model.

Do not delete or manufacture evidence around this artifact. The new PR #51 backfill should preserve it and materialize it only according to the new canonical rules if/when deployment is authorized.

# ACTIVE PR #51 — IMPLEMENTED BRANCH, NOT YET PRODUCTION
PR #51 currently combines the owner-approved New Fit Report refinement, Sleepwear, purchase context, Fit Community and the latest exception-driven Product catalog decision.

Pending ordered migrations on this branch:
- `20260823130000_add_sleepwear_lingerie_category.sql`
- `20260823130100_purchase_context_and_sleepwear_taxonomy.sql`
- `20260823140000_add_fit_community_preference.sql`
- `20260823150000_auto_post_provisional_products_and_item_reporting.sql`

The owner had previously authorized the earlier New Fit Report/Sleepwear/Fit Community line for production. The later change that makes a first clean item auto-post as a Provisional Product materially changes catalog trust/promotion behavior. Treat that expanded scope as branch-only until full exact-head verification is green and the owner explicitly authorizes this expanded production deployment.

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. Normal development must still obey the one-source/one-line/no-patch rules.

# OWNER-LOCKED LATEST PRODUCT DECISIONS

## 1. Direct Product search is global
A direct Product search must return matching men's, women's and unisex Products without requiring the member to switch Fit Community or Department first.

Fit Community affects people/wearer relevance. Product Department/taxonomy may narrow an explicit browse/filter context when intentionally selected, but it is not a hidden direct-search gate.

## 2. Fit Community — Men / Women / Both
- stored privately on Fit Profile;
- used as a default for People My Size/My Circle social relevance;
- temporary view switching does not rewrite saved preference;
- never changes body Match %;
- belongs to the person/wearer, not the garment Department.

A woman wearing/reporting men's jeans remains Women-community evidence; a man wearing/reporting a women's item remains Men-community evidence if that is his saved community.

## 3. Men/women measurement FAQ guidance
Public FAQ explains LikeSized works for men and women and that every accurate measurement can improve precision. It may note that some measurements are often especially useful depending on body/garment, while making clear these are examples rather than rigid sex rules.

Current examples:
- many men's fits: chest, shoulders, sleeve length, upper arm/bicep, waist, rise, inseam;
- many women's fits: full bust, high bust, underbust, waist, hip/seat, torso length and related shaping measurements.

Exact measurements remain private and actual Match logic stays garment-relevant.

## 4. Clean first-time items auto-post Provisional — NEW LOCK
Routine unique new garments must not require admin approval.

Current trust model:
- **1 clean distinct member submission → system may immediately materialize/map a searchable canonical Provisional Product.**
- **2 distinct member Product Fit Reports → Provisional may strengthen to Corroborated.**
- **Verified remains authoritative/admin-reviewed only.**

This supersedes the former current rule that held ordinary clean candidates out of the Product catalog until five members confirmed them.

Members still do not directly write canonical Product truth. Auto-posting occurs through the controlled audited candidate→Product mapping boundary.

## 5. Blocking ambiguity stays reviewable
Do not auto-post questionable Product truth when a real blocking signal already exists. Examples:
- multiple exact canonical Products share the normalized identity;
- identity conflict;
- credible possible duplicate;
- identifier/barcode collision;
- retailer-link collision tied to another canonical Product.

Such cases remain unresolved/Needs Review. Clean candidates are the normal auto-post path; unresolved candidates are the exception.

## 6. Later reports do not automatically remove Products
An already-posted Product remains usable when later disagreement arrives. Preserve evidence and flag it. Do not automatically delete, unpublish or silently overwrite the Product because one later report conflicts.

## 7. Every published Product has one Report feature
**Report this item** is available from Product detail. Initial reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A member report creates review evidence; it does not grant direct edit authority.

## 8. Trust-aware review priority
Flag priority derives from Product/candidate trust plus independent evidence:
- Provisional / uncorroborated flagged target → **High**;
- Corroborated flagged target → normally **Medium**;
- Verified target with one isolated ordinary member report → normally **Low**;
- repeated independent reporters/conflicts, competing barcode/Product claims or stronger duplicate evidence escalate priority.

Low means safe to review later, not delete evidence.

## 9. Internal review signals may find likely reassignment/duplicates
The system may generate conservative review flags from similar same-brand/type names, barcodes, retailer links, aliases and other identity evidence. These signals help find potential mistakes; they never authorize a fuzzy automatic merge by themselves.

# NEW FIT REPORT — OWNER LOCKED
Main form order:
1. Brand / Make.
2. Item / Model.
3. Overall Category.
4. Specific Garment Type filtered by Category.
5. optional Department.
6. zero-to-four controlled Type questions; Not sure always last.
7. Color.
8. Size.
9. Overall Fit Result.
10. Condition.
11. optional Fit Photo.
12. optional Fit Notes.
13. optional Retail Link.

Retail Link remains reusable Product/retailer evidence rather than purchase context.

## Optional Additional Information
Collapsed by default, exact order:
1. Purchased From.
2. Price Paid.
3. Purchase Method — Online / In Store / Received as a Gift.
4. Approx. Purchase Date — Month + Year.
5. UPC / barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo.

Purchase context is one member's acquisition observation keyed to the Fit Report. It is not Product truth, does not inherit from another member, does not create retailer listings and does not affect Match/recommendation/Product confidence.

## Final confirmation
Before any write, valid form data opens **Does this look right?**. It reviews main Fit Report details only and intentionally excludes Optional Additional Information.

Actions: **Go Back & Edit** and **Confirm Fit Report**.

# SLEEPWEAR & LINGERIE — OWNER LOCKED
Top-level category **Sleepwear & Lingerie** contains:
- Pajama pants
- Pajama shorts
- Pajama set
- Nightgown
- Robe
- Chemise
- Babydoll
- Teddy
- Corset & bustier
- Costume lingerie

Sleep Shirt is intentionally absent. Sweatpants remains Bottoms. Bra, Bralette, Sports Bra, Underwear and Shapewear remain Intimates. Each controlled Type uses no more than four questions and automatic final Not sure.

Pajama set uses the printed whole-set size unless pieces are genuinely separate Products. Costume lingerie uses Garment form, Top style, Bottom style and Structure / Support; Closure is intentionally omitted in favor of the more fit-relevant Structure / Support question.

# PRODUCT IDENTITY / BARCODE CONFIDENCE — OWNER LOCKED
Product identity confidence is intake-method independent and centered on normalized Brand + Item + Garment Type.

Size, Color, retailer link, legitimate alternate barcode, Fit Result, Material, Condition, Notes, purchase context and report-scoped physical questions do not independently define base Product identity.

Barcode confidence remains separate:
- first distinct member association to known Product = provisional Product→barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned.

Scanner recognition remains LikeSized-local and pauses on **Is this the item?** for a unique recognized identity. Confirmation card shows only safe photo if available, Brand, Item, Category/Type and Yes/No actions. Physical questions stay in the Fit Report.

# OWNER-LOCKED FIT REPORT EVIDENCE RULES
For a resolved Product, one counted Fit Report represents Member + exact Product + normalized Size + objective physical-answer fingerprint + garment-relevant body state.

Fit Result, Intended Fit, Condition, Color, Material, retailer URL, barcode, Department, Notes, Product Photo, Fit Photo and purchase context do not independently create another counted report.

Use `private.product_match_measurements(product_id)` as the shared Product relevance map. Established relevant measurement values split state at a symmetric 2% change threshold. Blank→filled can enrich; blanking a value does not erase established evidence. Original try-on Fit Profile version stays immutable.

There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

# CLOSET / POST-SUBMIT MUTATION — OWNER DIRECTION
Owner target is one public member Closet, not separate My Closet and Shared Closet systems. Self view adds owner-only controls to the same public garment/Fit Report content. Raw body data remains private.

Legacy `closet_items.visibility` and private/shared implementation are debt to remove/neutralize during Closet audit.

Original confirmed Fit Report evidence should not become an unrestricted rewrite surface. Closet audit must settle immutable fields, add-missing enrichment, preserved-history corrections and dated lifecycle observations. Kept / Returned / Exchanged and after-use shrink/stretch belong to later lifecycle observations rather than silent rewrites.

# FOLLOWING / FIT TWIN / NOTIFICATIONS — OWNER LOCKED
- Following is member-controlled.
- Fit Twin is **system-generated** from strong current-person Match among followed members.
- one `follows` graph only.
- `/following` resolves to `/circle`.
- signed-in `/` uses My Circle.
- Follow alone does not enable notifications.
- person bell and Product bell are separate systems.

# PRODUCT ACTIONS / LIKELOCKER / SHOP — OWNER LOCKED
- Heart → Like Locker.
- Shooting star → Wish Locker.
- Product bell → one-shot future qualifying Product Match notification.
- Cart → Shop only when valid retailer destination exists.

No action silently triggers another. One valid Shop listing routes direct; multiple show a picker; zero hides Shop. Commission never affects Match, recommendation, Product identity, search rank or retailer choice.

# SERPAPI — ADMIN RESEARCH ONLY
SerpAPI is never ordinary member intake or Product authority. Admin research checks cache, dedupes, respects caps, preserves evidence and requires explicit resolution. Raw external results never write directly into Product truth.

# OWNER RE-AUDIT STATUS / ORDER
A surface is not complete merely because code exists. Completion requires current/live inspection, owner interaction, corrections, production verification, owner confirmation and this master update.

Current order:
1. Homepage + FAQ — PR #51 includes approved FAQ/routing changes; latest men/women FAQ addition still needs production/live owner review if deployed.
2. Global header + member Menu + admin entry/navigation — needs final re-confirmation.
3. Auth — owner confirmed.
4. Fit Profile — previously owner confirmed; PR #51 Fit Community addition requires owner review when live.
5. Profile Settings — previously owner confirmed; Fit Community addition requires owner review when live.
6. Notifications — unfinished audit.
7. Unified Closet/member profile Closet — remove legacy private/shared meaning and settle mutation/lifecycle model.
8. Update/Edit Fit Report only within settled Closet mutation model.
9. People My Size — Fit Community addition branch-implemented; full audit remains.
10. My Circle / Following / Fit Twin — Fit Community branch-implemented; full page audit remains.
11. New Fit Report — active PR #51 line, branch verification/deployment pending.
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — now includes Report this item on PR #51; full detail audit remains.
15. Explore.
16. Search + `/browse` compatibility — direct global Product search rule locked.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation — priority-filter/queue UX still needs completion beyond backend trust scoring.
19. Final mobile/desktop/nav/privacy/copy regression.

Dependency after PR #51 verification: finish Notifications, then unified Closet/Update before People My Size and later social/product surfaces reuse those components.

# ADMIN CATALOG / EVIDENCE TARGET
Admin all-Products/candidate tooling must expose trust status, distinct confirming-member count, open flag count/reasons, priority, barcode confidence, retailer links, evidence history and resolution provenance.

Required views/filters include Needs Review, Provisional, Corroborated, Verified, Has Conflicts and priority.

Admin workload is exception-driven. Do not recreate a mandatory review queue for every clean new garment.

# RETAIL / PURCHASE METRICS — OWNER LOCKED
Purchase reporting must preserve denominators: eligible Fit Reports, response count/rate, retailer observations among responders, Online/In Store/Gift distribution, useful price distributions, month/year trends and retailer demand/catalog gaps.

One counted Fit Report contributes at most one acquisition observation. Reprocessing cannot multiply metrics.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# PREFERRED FIT — RETIRED
Member-level Preferred Fit by garment type is not current V1 behavior. Legacy database structures may remain inert. Per-report Intended Fit is separate metadata.

# BETA / POST-BETA DIRECTION
Before Beta:
- finish ordered member-facing audits and reusable components;
- finish minimum exception-driven Admin Catalog/Moderation tools;
- expand/review starter catalog enough for useful Product hit rate;
- confirm retailer/Shop behavior;
- build denominator-aware purchase reporting before relying on it for decisions;
- run mobile/desktop/browser, privacy/RLS/security, performance, spam/moderation and canonical-drift regression;
- use controlled Beta behavior to tune catalog, Match, social and purchase priorities.

During Beta watch direct Product hit rate/manual intake, Provisional→Corroborated progression, Product-report/duplicate false-positive rates, barcode learning/conflicts, Fit Report friction, purchase response rates and People My Size usefulness.

Early post-Beta review mobile app options and AI build viability before creating a second app codebase. Prefer reuse of Supabase/backend/domain logic and one canonical architecture.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #51 exact-head verification is not complete yet.
- New migration `20260823150000_auto_post_provisional_products_and_item_reporting.sql` is not production-applied.
- Existing production still displays old pending-candidate behavior for clean unique items until the new migration is deliberately deployed.
- Admin backend flag priority exists on PR #51; full all-Products priority/filter presentation remains to build in the Admin audit.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, Product-photo workflow, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX, starter-catalog enrichment and browser regression remain open where previously scoped.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line.
- PR #49 generalized catalog identity confidence and deployed as `0b569e4a25b7f75a313e57ca94d79286ec3df1df`; production migration `20260823054933` applied; Vercel deployment `dpl_AbdpdRMyvdJ3c7C1sKeDe3qbQK66` was READY.
- PR #50 reconciled that production status at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 was created from that clean line and now includes New Fit Report category-first intake, Sleepwear, purchase persistence, final review, My Circle routing, Fit Community, inclusive FAQ guidance, global-search safeguard, first-clean-item Provisional auto-post, Product reporting and trust-aware review priority.
- PR #51 remains unmerged/unapplied as of this status entry.

# EXACT NEXT ACTION — CURRENT
1. Finish exact-head PR #51 CI after the latest catalog-trust changes: canonical check, TypeScript, all focused app safeguards, build, fresh migration replay and full pgTAP suite.
2. Fix only canonical owning sources if CI finds an error; do not patch around tests.
3. Confirm all current docs/tests contain the new 1-member Provisional / 2-member Corroborated model and no competing five-member current rule.
4. Update PR #51 metadata to list all four pending migrations and latest Product-report/trust behavior.
5. Confirm branch remains mergeable and 0 behind `main`.
6. Stop before production merge/migration apply unless the owner explicitly authorizes deploying this materially expanded first-item auto-post behavior.
7. If authorized later: merge PR #51, apply migrations in order, verify Supabase state/backfill, wait for Vercel READY, smoke direct search/FAQ/Product report/New Fit Report and read-only verify Maidenform/Heirloom preserved/materialized correctly.
8. Record observed production IDs/timestamps in this master/schema after actual deployment.
