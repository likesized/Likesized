# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current-status record, owner-decision ledger, deployment ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Do not add later requests into that batch. Any request made after deployment authorization starts the next change list and waits for a separate deployment instruction.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE
- `main` is the one production implementation line and is coupled to Vercel production.
- Current production commit before the active evidence-first intake batch: `245bfab0d0d918671cfce3856b78e57525867df2` — squash merge of PR #62, **Promote Product Label photo in Fit Report**.
- Production Vercel deployment `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G` is READY and aliases `likesized.com`.
- PR #62 exact tested head `39684abed6312f5d317697f58454b7bd1a6c7572` passed full LikeSized CI #712 before merge.
- PR #61 exact tested head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed full LikeSized CI #708 and was squash-merged as `24fb0e42b6e05d42a10b1912a5493367975952da`; Vercel production `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG` reached READY.
- PR #61 delivered the final desktop Fit Report width correction, one shared **Change category / type** control, and faster Item suggestions using a 100 ms lookup delay plus in-session reuse.
- PR #62 moved Product Label / Tag Photo out of collapsed Optional Additional Information while preserving Product Photo at the bottom and preserving one canonical `product_label_photo` evidence input. The owner then rejected the oversized card presentation, which is superseded by the active evidence-first intake batch below.
- No database/schema change was part of PR #61 or PR #62.
- Applied database migrations are immutable; corrections use later ordered migrations.
- No paid Supabase branches.

## Authenticated browser → backend wiring — COMPLETE
The six ordered browser-to-backend checks are complete:
1. **Normal known Product — PASS.** Fit Report saved to intended Product/size/variant and the confirm-pending flow completed normally.
2. **Explicit identity uncertainty — PASS.** Uncertain manual garment saved normally, remained unresolved/Unconfirmed for review and did not publish a shared Product.
3. **Known Product correction/conflict — PASS after PR #59 repair.** The first attempt exposed an RPC permission defect; PR #59 repaired the least-privilege boundary, and the retry stored correction evidence without silently mutating canonical Product identity.
4. **Mobile Item Change — PASS.** Known Item unlocked, focused, re-searched and rematched successfully on mobile.
5. **Clean new manual Product — PASS.** Clean first submission materialized/mapped a Provisional Product rather than entering mandatory admin review.
6. **Known barcode — PASS.** Controlled UPC resolved the intended Product, confirmation/save succeeded and two-member barcode evidence preserved Corroborated trust.

Controlled production test identity remains Maidenform / Heirloom / Bra Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25`, UPC `196988323504`. Its deliberate `catalog_review_needed` state came from the controlled correction test, not barcode corruption.

## Evidence-first Fit Report intake — ACTIVE OWNER-AUTHORIZED BATCH
Primary active implementation line: `agent/evidence-first-fit-report-intake`, based directly on production PR #62 merge `245bfab0d0d918671cfce3856b78e57525867df2`.

The owner explicitly authorized this batch to proceed straight through production. The frozen scope is:
- replace the old opening choice with **Identify your item**;
- primary choice **Scan barcode**;
- primary choice **Take / upload tag photo**;
- smaller fallback beneath them: **Cut the tags out? Enter item manually →**;
- tag photos are physical/private identity evidence for later verification; selecting a photo does **not** claim LikeSized can automatically read or identify every Product field from the image;
- all paths converge on the same canonical Brand / Item / Product and Fit Report flow;
- one underlying `product_label_photo` input/evidence path only;
- a tag photo selected at the opening is retained and is not asked for again later in that flow;
- barcode/manual paths keep a small compact optional Product Label / Tag Photo row directly below Brand / Item;
- if a tag photo already exists from the opening, that compact uploader is hidden rather than duplicated;
- **I’m not sure this is the correct item/style name** remains available for new/unresolved identity and becomes evidence-aware: Retail / Product URL + Product Photo always remain useful; Tag/Style Label is offered only when a tag photo has not already been supplied;
- Product Photo remains optional catalog-display evidence at the bottom of Optional Additional Information;
- Product Label / Tag Photo remains private identity-review evidence and never becomes generic Product imagery merely because it exists;
- no schema, migration, Product-trust formula, Match formula, recommendation formula or RLS relaxation is part of this batch.

This batch is not complete until its exact final head passes full CI, the PR is merged with expected-head protection, the Git-triggered Vercel production deployment reaches READY on `likesized.com`, runtime/protected-route sanity passes and the owner can visually verify the new flow.

# RECENT PRODUCTION HISTORY

## PR #59 — COMPLETE / DEPLOYED
**Repair known Product correction save path.** Authenticated known-Product correction evidence could fail because `record_member_product_identity_issue` referenced restricted `normalize_identifier`. The repair kept the correction RPC callable while keeping the general normalization helper restricted. Canonical migration `supabase/migrations/20260824015612_repair_known_product_identity_correction_rpc.sql` was applied in production as hosted `20260824020058 repair_known_product_identity_correction_rpc`. Exact head `046ccea8e4981a8cf8da3b9c84e1b7dc68ce69b4` passed full CI #704. Squash merge: `b6de93464f55bb03d7c1c0be879c636141cceb40`. Production Vercel: `dpl_29RqGFcbACjyDVQsbWqta1XuC3KD`.

## PR #60 — COMPLETE / DOCS-ONLY
Production reconciliation after PR #58/#59. Exact head `f28d988ca7018653ae82d641b758fc4f4c020481` passed CI #706 and was squash-merged as `c6e643f707bf5f0c44cb26a5cd5fa7f903bbca28`. No application/database behavior change.

## PR #61 — COMPLETE / DEPLOYED
**Polish final Fit Report desktop and item-search UX.** Exact head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed CI #708; squash merge `24fb0e42b6e05d42a10b1912a5493367975952da`; production Vercel `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG`. Delivered 680px desktop single-field cap, shared Category/Type Change control and faster/cached Item suggestions. No database change.

## PR #62 — COMPLETE / DEPLOYED
**Promote Product Label photo in Fit Report.** Exact head `39684abed6312f5d317697f58454b7bd1a6c7572` passed CI #712; squash merge `245bfab0d0d918671cfce3856b78e57525867df2`; production Vercel `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G`. It correctly preserved one private Label/Tag evidence input and kept Product Photo in Optional Additional Information, but its large in-form Label/Tag card presentation is now superseded by the owner-approved evidence-first intake design.

# FOUNDATION / DATABASE STATUS — VERIFIED
Production Supabase project: `rlksidwniuoxoacumyaf`.

Relevant immutable migration mappings:
- `supabase/migrations/20260823160000_add_unconfirmed_catalog_status.sql` → hosted `20260823205533 add_unconfirmed_catalog_status`.
- `supabase/migrations/20260823160100_unconfirmed_identity_and_photo_roles.sql` → hosted `20260823205642 unconfirmed_identity_and_photo_roles`.
- `supabase/migrations/20260823160200_needs_more_evidence_followup.sql` → hosted `20260823205712 needs_more_evidence_followup`.
- `supabase/migrations/20260824000500_foundation_audit_security_hardening.sql` → hosted `20260824003029 foundation_audit_security_hardening`.
- `supabase/migrations/20260824015612_repair_known_product_identity_correction_rpc.sql` → hosted `20260824020058 repair_known_product_identity_correction_rpc`.

Verified-good foundations include:
- clean candidate→Product materialization and Product trust progression from distinct wearers;
- explicit Unconfirmed anti-publication gating;
- Needs More Evidence parking and member evidence re-entry;
- known-Product conflicts remain evidence/review rather than silent Product mutation;
- barcode two-member corroboration and conflict handling;
- Product reporting/review priority accumulation;
- Fit Report relevant-body-state identity and 2% state split behavior;
- Front/Back Fit Photo compatibility;
- Fit Community separation from Match math/Product Department;
- global Product search exclusion of unresolved candidates;
- purchase-context isolation;
- hardened Product Label/Tag RLS and storage boundaries;
- hardened direct scanner-image candidate eligibility;
- canonical evidence-path constraints and resolved-candidate history handling;
- known-Product member correction RPC least-privilege boundary;
- full fresh migration replay and database behavior/privacy suites.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Direct Product search
Direct Product search is global across men's, women's and unisex Products. Fit Community does not silently gate direct Product search. Unconfirmed and Needs More Evidence are candidate states, not live Products, and do not leak into other members’ Product search/suggestions/discovery/barcode suggestions.

## Fit Community / Following / Fit Twin
- Fit Community is Men / Women / Both, private member relevance metadata and never changes Body Match math.
- Following is member-controlled.
- Fit Twin is **system-generated** among followed members from strong current-person Match quality.
- One canonical `follows` relationship exists; there is no second user-controlled Fit Twin graph.
- Following and Fit Twin remain separate concepts.

## Product identity trust
- Unconfirmed = pre-publication candidate only.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
Repeated reports by one member do not manufacture distinct-member trust.

## Product identity / barcode boundary
Base Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define a new base Product. Barcode confidence is separate from Product confidence. Conflicts are preserved for review and never silently rewrite Product identity.

## New Fit Report — evidence-first normal flow
Opening:
1. **Scan barcode**.
2. **Take / upload tag photo**.
3. Smaller fallback: **Cut the tags out? Enter item manually →**.

Tag photo is private identity evidence. It is useful because LikeSized can inspect/verify the physical label later; it does not eliminate typing mistakes and does not guarantee automatic identification/OCR.

Main form order after identification:
1. Brand / Make.
2. Item / Style / Model.
3. Compact optional Product Label / Tag Photo only when that evidence was not already supplied at opening.
4. Overall Category.
5. Specific Garment Type filtered by Category.
6. optional Department.
7. zero-to-four controlled Type questions; Not sure always last.
8. Color.
9. Size.
10. Overall Fit Result.
11. Condition.
12. optional Front Fit Photo and Back Fit Photo.
13. optional Fit Notes up to 2,000 characters.
14. optional Retail Link.

A new/unresolved garment retains **I’m not sure this is the correct item/style name**. The helper is evidence-aware: Retail/Product URL and Product Photo are offered; Product Label / Tag Photo is offered only when not already present. One canonical evidence value exists per role; no duplicate Tag/Label input.

Optional Additional Information remains collapsed by default:
1. Purchased From.
2. Price Paid.
3. Purchase Method.
4. Approx. Purchase Date.
5. UPC/barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo at the bottom.

Product Photo is catalog-display evidence. Product Label / Tag Photo is private identity-review evidence.

## Fit Result / Fit Rating
Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

## Counted Fit Report identity
For a resolved Product, counted Fit Report identity remains Member + exact Product + normalized Size + objective physical-answer fingerprint + compatible garment-relevant body state. Size stays report-specific. Product Label/Tag evidence does not create another counted report by itself.

## Tracked fit variation — NEXT LOGIC AUDIT
Tracked variation is separate from base Product and report Size. Before Product Detail implements Exact Variation, roadmap item 11A must classify every structured Garment Type question as:
- variation-defining;
- descriptive-only;
- cosmetic/ignored.

Absolute rules:
- Size never defines tracked variation.
- Color never defines tracked variation.
- One canonical variation-definition map must be shared by Product Detail, recommendation/evidence aggregation and Admin tooling.
- Do not change the current broader counted-report `objective_variant_key` until 11A is owner-approved and the owner decides how descriptive-only changes affect same-member duplicate counting.

## Product Detail evidence — DEFERRED UNTIL 11A
When reached, exact tracked variation evidence comes first regardless of whether a related variation has a higher Body Match. Related evidence is secondary and must identify the actual variation difference. Strong Fit Reports aggregate only the same exact variation. Body Match means body similarity, not garment-fit probability.

## Shopping
Like, Wishlist and Shop/Cart remain independent. Shop appears only with a valid retailer destination. No retailer link = no Shop action. Affiliate commission never changes Match, recommendation or retailer relevance.

# CANONICAL RECOVERY / BRANCH LINEAGE
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. PR #43 promoted the verified recovery line to `main`.

Historical branches have no current authority. Merged PR branches are RECOVERED through `main`; superseded experiments remain in Git history only. Current desired long-lived branch state remains `main` plus at most one temporary active PR branch.

Recent branch classification:
- `agent/post-pr59-production-reconciliation` — RECOVERED via PR #60.
- `agent/final-fit-report-ux-polish` — RECOVERED via PR #61.
- `agent/promote-label-photo` — RECOVERED/SUPERSEDED via PR #62 and the current intake redesign.
- accidental duplicate refs created during PR #62 work contained no unique product work and were reset to production; they have no authority.
- `agent/evidence-first-fit-report-intake` — **ACTIVE PRIMARY LINE** for the owner-authorized current batch. Do not start a second product-decision branch until it is reconciled into `main`.

Older recovery/feature/verification branches classified in Git history remain RECOVERED, SUPERSEDED, OBSOLETE or DUPLICATE; none overrides current `main` or this one active line.

# OWNER RE-AUDIT ORDER
1. Homepage + FAQ — live; sex/body-specific measurement FAQ wording still pending owner approval.
2. Global header / member menu / admin entry — broader owner interaction audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — legacy visibility/lifecycle cleanup remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — audit remains.
10. My Circle / Following / system-generated Fit Twin — audit remains.
11. New Fit Report — all six browser/backend wiring checks complete. Current evidence-first intake batch is owner-authorized through deployment; after rollout the owner should visually verify opening hierarchy, compact tag row and evidence-aware uncertainty helper.
11A. **Garment-question variation classification audit — NEXT PRODUCT-LOGIC AUDIT after the current intake rollout.**
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — Exact Variation behavior only after 11A.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish the active evidence-first intake batch through full CI, exact-head merge and production sanity.
- Owner visual verification of the new opening screen, compact tag uploader and uncertainty helper after deployment.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- 11A variation-definition audit is the next logic audit after this rollout and before Product Detail Exact Variation or counted-report fingerprint reconciliation.
- `main` is currently not branch-protected; enabling required PR + CI protection remains a separate owner decision and must not be changed silently.

# CONDENSED DEPLOYMENT LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line; PR #43 promoted it.
- PR #44 optimized Outfit photo storage.
- PR #45 restored/reordered public homepage content/FAQ.
- PR #46 repaired Fit Profile schema/grouped navigation.
- PR #47 rebuilt Explore/My Circle/LikeLocker/moderation foundations.
- PR #49 generalized catalog identity confidence; production migration applied.
- PR #50 reconciled production status.
- PR #51 added Sleepwear/Lingerie, purchase context, Fit Community and clean Provisional auto-post behavior; production migrations applied.
- PR #52 reconciled canonical status.
- PR #53 completed the Unconfirmed/Needs More Evidence/front-back-photo repair batch and production hardening flow.
- PR #55 polished FAQ/Settings/Fit Report UI and deployed.
- PR #56 hardened Product Label privacy/storage/scanner/candidate-history boundaries; exact head passed CI #696, migration hosted as `20260824003029`, squash merge `7bd1a1a6048bcc991ca6a55547e454b10feec832`, production Vercel `dpl_nBJQsoxraFUj5KEMGxVjwQ55dzt9`.
- PR #57 reconciled PR #56 production docs.
- PR #58 final tested head `30034515c11fedfe8d776723957220e32f1bf3bb` passed CI #702; squash merge `d2b546e1ebac2ff537b1375bd9a8909a8cf51b62`; production Vercel `dpl_Aju4MBwpwnjAx55gsSmfLwh2qzuV`.
- PR #59 exact head `046ccea8e4981a8cf8da3b9c84e1b7dc68ce69b4` passed CI #704; correction migration hosted `20260824020058`; squash merge `b6de93464f55bb03d7c1c0be879c636141cceb40`; Vercel `dpl_29RqGFcbACjyDVQsbWqta1XuC3KD`.
- PR #60 exact head `f28d988ca7018653ae82d641b758fc4f4c020481` passed CI #706; docs-only squash merge `c6e643f707bf5f0c44cb26a5cd5fa7f903bbca28`.
- PR #61 exact head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed CI #708; squash merge `24fb0e42b6e05d42a10b1912a5493367975952da`; Vercel `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG`.
- PR #62 exact head `39684abed6312f5d317697f58454b7bd1a6c7572` passed CI #712; squash merge `245bfab0d0d918671cfce3856b78e57525867df2`; Vercel `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G`.

# EXACT NEXT ACTION — CURRENT
1. Finish the single active `agent/evidence-first-fit-report-intake` branch with only the frozen owner-approved scope.
2. Audit the PR diff against production `245bfab0d0d918671cfce3856b78e57525867df2`; no unrelated scanner, backend, schema, trust, Match or recommendation changes may enter.
3. Run full LikeSized CI on the exact final head: canonical integrity, exact dependencies, TypeScript, focused application safeguards, production build, pinned Supabase CLI, complete fresh migration replay and full database behavior/privacy suite.
4. If green, freeze that exact head, mark the PR ready and squash-merge with expected-head protection under the owner’s explicit production authorization.
5. Follow the Git-triggered Vercel production deployment until READY on `likesized.com`, verify the merge SHA, protected-route behavior and runtime errors.
6. Owner visually verifies the evidence-first opening, compact in-form tag control for barcode/manual paths and evidence-aware uncertainty helper.
7. Then conduct roadmap item **11A Garment-question variation classification** before any Product Detail Exact Variation work.
