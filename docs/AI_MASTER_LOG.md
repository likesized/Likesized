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

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Do not add later requests into that batch. Any request made after the deployment authorization starts the next change list and waits for a separate deployment instruction.

This rule exists to keep production batches small enough for owner review and to prevent unrelated late changes from breaking already-approved work.

# CURRENT STATUS — 2026-08-23

## Canonical production line
- `main` is the one production implementation line and is coupled to Vercel production.
- Applied database migrations are immutable; corrections use later ordered migrations.
- No paid Supabase branches.
- PR #49 generalized community catalog confidence and is live production history.
- PR #50 reconciled that production status to `main` commit `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 / `agent/fit-report-review-purchase-context` is the one active implementation/deployment line.

## Catalog-confidence production checkpoint — LIVE BEFORE PR #51
Production Supabase project: `rlksidwniuoxoacumyaf`.

Latest confirmed catalog-confidence production record before this batch is `20260823054933 generalize_catalog_identity_confidence`, sourced from local canonical `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`.

Known production test evidence is preserved:
- Maidenform / Heirloom / Bra candidate `de34b6dd-47c9-4795-af77-5117e4f8b554`;
- UPC `196988323504`;
- two distinct members already proved corroboration under the currently deployed candidate-first model;
- a shared Fit Photo exists for this item and must remain preserved through backfill/materialization.

# ACTIVE PR #51 — CURRENT FROZEN DEPLOYMENT BATCH, PRODUCTION AUTHORIZED
The owner explicitly authorized getting this entire current batch **live and verified**. No later unrelated request may be added before deployment completes.

Pending ordered migrations:
- `20260823130000_add_sleepwear_lingerie_category.sql`
- `20260823130100_purchase_context_and_sleepwear_taxonomy.sql`
- `20260823140000_add_fit_community_preference.sql`
- `20260823150000_auto_post_provisional_products_and_item_reporting.sql`

Current frozen batch includes:
- category-first New Fit Report intake;
- Sleepwear & Lingerie taxonomy;
- optional purchase/acquisition context + persistence;
- final **Does this look right?** confirmation;
- username-format guidance and compact mobile Fit Profile update hero;
- Fit Community Men / Women / Both in onboarding/settings/social relevance;
- global direct Product search independent of Fit Community/Department;
- clean first-item Product auto-post with four identity-trust tiers;
- Product **Report this item** and trust-aware flag urgency;
- conservative possible-duplicate review signals;
- scanner confirmation image priority Product/catalog photo → shared Fit Photo → placeholder;
- signed-in `/` → My Circle and previously approved FAQ/product-differentiation copy.

The proposed new sex/body-specific measurement FAQ wording is **not approved** and is intentionally excluded from this deployment. It may be revisited only after the owner reviews exact copy.

# CANONICAL RECOVERY / LINEAGE STATUS
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. Normal development must still obey the one-source/one-line/no-patch rules.

# OWNER-LOCKED LATEST PRODUCT DECISIONS

## 1. Direct Product search is global
A direct Product search returns matching men's, women's and unisex Products without requiring the member to switch Fit Community or Department first.

Fit Community affects people/wearer relevance. Product Department/taxonomy may narrow an explicit browse/filter context when intentionally selected, but it is not a hidden direct-search gate.

## 2. Fit Community — Men / Women / Both
- stored privately on Fit Profile;
- used as a default for People My Size/My Circle social relevance;
- temporary view switching does not rewrite saved preference;
- never changes body Match %;
- belongs to the person/wearer, not the garment Department.

A person remains in their saved Fit Community even when wearing/reviewing a garment sold in a different Department.

## 3. Public measurement FAQ copy — PENDING OWNER APPROVAL
The concept may later explain that more accurate measurements improve Match precision and that garment relevance determines which measurements matter. No new sex/body-specific measurement examples or wording are approved for the current production batch.

## 4. Clean first-time items auto-post + four identity-trust tiers
Routine unique new garments must not require admin approval. Publishing and trust strength are separate.

- **Provisional — 1 distinct wearer.** A clean unique first member submission may immediately materialize/map a searchable Product.
- **Corroborated — 2–4 distinct wearers.** Independent wearer evidence strengthens Product identity.
- **Established — 5+ distinct wearers.** The five-wearer milestone remains the stronger community-evidence tier.
- **Verified — authoritative/admin-reviewed only.** Never achieved merely from community count.

Repeated reports by one member do not manufacture distinct-member identity trust. Wearer count does not silently verify unrelated Product facts such as material, description or Department.

## 5. Blocking ambiguity stays reviewable
Do not auto-post questionable Product truth when a real blocking signal already exists. Examples include multiple exact Products, identity conflict, credible duplicate evidence, barcode/identifier collision or retailer-link collision tied to another Product.

Such cases remain unresolved/Needs Review. Clean candidates are normal auto-post; unresolved candidates are the exception.

## 6. Later reports do not automatically remove Products
An already-posted Product remains usable when later disagreement arrives. Preserve evidence and flag it. Do not automatically delete, unpublish or silently overwrite the Product because one later report conflicts.

## 7. Every published Product has one Report feature
**Report this item** reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A member report creates review evidence; it does not grant direct edit authority.

## 8. Four-tier trust controls initial flag urgency
- Provisional (1 wearer) flagged issue → **High**.
- Corroborated (2–4 wearers) flagged issue → **High** because a genuine Product problem may still be undiscovered.
- Established (5+ wearers) → one isolated ordinary disagreement starts **Low** because an individual entry error is more likely after substantial agreement; a second independent signal escalates **Medium**; three or more escalate **High**.
- Verified → isolated ordinary report starts **Low**; repeated independent evidence may escalate Medium/High.
- Strong barcode collisions, duplicate evidence or multiple identity conflicts may escalate regardless of tier.

Low priority means review later, never discard evidence.

## 9. Internal review signals may find likely duplicates/reassignment
Conservative same-brand/type name similarity, barcodes, retailer links, reviewed aliases and other identity evidence may create review flags. They never authorize fuzzy automatic merge by themselves.

## 10. Scanner confirmation image priority
For **Is this the item?**:
1. Product/catalog photo first.
2. Public/shared member Fit Photo second.
3. Default/placeholder if neither exists.

A member Fit Photo used as scanner fallback is only identification display evidence; it never becomes canonical Product imagery or Product truth.

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

Purchase context is one member's acquisition observation keyed to the Fit Report. It is not Product truth, does not inherit from another member, does not create retailer listings and does not affect Match/recommendation/Product identity trust.

## Final confirmation
Before any write, valid form data opens **Does this look right?**. It reviews main Fit Report details only and intentionally excludes Optional Additional Information.

Actions: **Go Back & Edit** and **Confirm Fit Report**.

# SLEEPWEAR & LINGERIE — OWNER LOCKED
Top-level category **Sleepwear & Lingerie** contains Pajama pants, Pajama shorts, Pajama set, Nightgown, Robe, Chemise, Babydoll, Teddy, Corset & bustier and Costume lingerie.

Sleep Shirt is intentionally absent. Sweatpants remains Bottoms. Bra, Bralette, Sports Bra, Underwear and Shapewear remain Intimates. Each controlled Type uses no more than four questions and automatic final Not sure.

Pajama set uses the printed whole-set size unless pieces are genuinely separate Products. Costume lingerie uses Garment form, Top style, Bottom style and Structure / Support; Closure is intentionally omitted.

# PRODUCT IDENTITY / BARCODE CONFIDENCE — OWNER LOCKED
Product identity is centered on normalized Brand + Item + Garment Type. Size, Color, retailer link, legitimate alternate barcode, Fit Result, Material, Condition, Notes, purchase context and report-scoped physical questions do not independently define base Product identity.

Barcode confidence remains separate:
- first distinct member association to known Product = provisional Product→barcode evidence;
- second distinct member with corresponding Product Fit Report evidence = corroborated relationship;
- one Product may have multiple legitimate barcodes;
- one barcode credibly supporting competing Products is flagged and never silently reassigned.

Scanner recognition remains LikeSized-local and pauses on **Is this the item?** for a unique recognized identity. Physical questions stay in the Fit Report.

# OWNER-LOCKED FIT REPORT EVIDENCE RULES
For a resolved Product, one counted Fit Report represents Member + exact Product + normalized Size + objective physical-answer fingerprint + garment-relevant body state.

Fit Result, Intended Fit, Condition, Color, Material, retailer URL, barcode, Department, Notes, Product Photo, Fit Photo and purchase context do not independently create another counted report.

Use `private.product_match_measurements(product_id)` as the shared Product relevance map. Established relevant measurement values split state at a symmetric 2% change threshold. Blank→filled can enrich; blanking a value does not erase established evidence. Original try-on Fit Profile version stays immutable.

There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

# PRODUCT DETAIL FIT-EVIDENCE QUESTION — ROADMAP LOCK FOR ITEM DETAIL AUDIT
Do not jump ahead of audit order. When the Garment/Product Detail audit is reached, resolve how high body Match and poor physical Fit Result are presented separately, and how later lifecycle observations such as shrinkage/stretching affect recommendations without rewriting the original Fit Report.

The intended principle is that Match % says how similar the wearer body was; Fit Result and later lifecycle evidence determine whether that size/garment outcome was actually good. Full design belongs to the Product Detail audit after Closet lifecycle storage is settled.

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
1. Homepage + FAQ — routing/approved copy in current batch; new measurement FAQ wording withheld pending owner approval.
2. Global header + member Menu + admin entry/navigation — needs final re-confirmation.
3. Auth — owner confirmed.
4. Fit Profile — previously owner confirmed; current batch adds Fit Community + username/mobile corrections, requiring live review.
5. Profile Settings — Fit Community addition requires live review.
6. Notifications — unfinished audit.
7. Unified Closet/member profile Closet — remove legacy private/shared meaning and settle mutation/lifecycle model.
8. Update/Edit Fit Report only within settled Closet mutation model.
9. People My Size — Fit Community implemented; full audit remains.
10. My Circle / Following / Fit Twin — Fit Community implemented; full audit remains.
11. New Fit Report — current frozen deployment batch; live owner interaction pending deployment.
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — current batch adds Report this item; full detail audit later must handle poor-fit/lifecycle evidence presentation.
15. Explore.
16. Search + `/browse` compatibility — direct global Product search rule locked.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation — priority/filter/queue UX still needs completion beyond backend scoring.
19. Final mobile/desktop/nav/privacy/copy regression.

Dependency after current deployment/live review: finish Notifications, then unified Closet/Update before People My Size and later social/product surfaces reuse those components.

# ADMIN CATALOG / EVIDENCE TARGET
Admin all-Products/candidate tooling must expose identity-trust tier, distinct confirming-member count, open flag count/reasons, priority, barcode confidence, retailer links, evidence history and resolution provenance.

Required views/filters include Needs Review, Provisional, Corroborated, Established, Verified, Has Conflicts and priority.

Admin workload is exception-driven. Do not recreate a mandatory review queue for every clean new garment.

# RETAIL / PURCHASE METRICS — OWNER LOCKED
Purchase reporting must preserve denominators: eligible Fit Reports, response count/rate, retailer observations among responders, Online/In Store/Gift distribution, useful price distributions, month/year trends and retailer demand/catalog gaps.

One counted Fit Report contributes at most one acquisition observation. Reprocessing cannot multiply metrics.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# PREFERRED FIT — RETIRED
Member-level Preferred Fit by garment type is not current V1 behavior. Legacy database structures may remain inert. Per-report Intended Fit is separate metadata.

# BETA / POST-BETA DIRECTION
Before Beta finish ordered member-facing audits/reusable components, minimum exception-driven Admin Catalog/Moderation, useful starter catalog coverage, retailer/Shop behavior, denominator-aware purchase reporting, and mobile/desktop/browser/privacy/RLS/security/performance/spam/canonical-drift regression.

During Beta watch direct Product hit rate/manual intake, Provisional→Corroborated→Established progression, Product-report/duplicate false-positive rates, barcode learning/conflicts, Fit Report friction, purchase response rates and People My Size usefulness.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #51 exact-head verification must be green before production apply/merge.
- Four PR #51 migrations are not production-applied as of this pre-deployment status.
- Existing production still displays old pending-candidate behavior for clean unique items until migration `20260823150000...` is deployed.
- Admin backend flag priority exists in this batch; full all-Products priority/filter presentation remains for Admin audit.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, Product-photo workflow, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX, starter-catalog enrichment and browser regression remain open where previously scoped.

# CONDENSED DEPLOYMENT / RECOVERY LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line.
- PR #49 generalized catalog identity confidence and deployed as `0b569e4a25b7f75a313e57ca94d79286ec3df1df`; production migration `20260823054933` applied; Vercel deployment `dpl_AbdpdRMyvdJ3c7C1sKeDe3qbQK66` was READY.
- PR #50 reconciled that production status at `9431366660f813bd2dda68ee5db9c6f4fdc5ddfa`.
- PR #51 is the current frozen owner-authorized deployment batch described above and remains unmerged/unapplied until exact-head verification passes.

# EXACT NEXT ACTION — CURRENT
1. Finish exact-head PR #51 CI: canonical check, TypeScript, all focused app safeguards, build, fresh migration replay and full pgTAP suite.
2. Fix only canonical owning sources if CI finds an error; do not patch around tests.
3. Confirm PR #51 remains mergeable and 0 behind `main`.
4. Apply the four authorized migrations in canonical order, verify Supabase/backfill and preserve Maidenform/Heirloom evidence.
5. Mark PR ready and merge the exact green head to `main`.
6. Wait for Vercel production READY and verify likesized.com plus direct search, scanner fallback, New Fit Report/purchase context, Fit Community, Product reporting and no routine Pending Review for clean items.
7. Record actual migration/deployment IDs and smoke results in this master/schema as the final status reconciliation for this frozen batch.
8. Only after this batch is live/verified begin the owner's next requested change list.