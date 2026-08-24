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

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
LikeSized is not yet a public active service with an external audience. For the owner's current build/test workflow, the live `likesized.com` site is the owner verification environment. Do not stop an owner-authorized straight-through batch at a Vercel branch preview or send preview links as a required review gate. After the owner authorizes deployment, finish exact-head CI, merge the frozen branch to `main`, wait for the live Vercel deployment to reach READY, and have the owner verify the change on the live site. This does not remove the requirement for explicit owner deployment authorization.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE
- `main` is the one production implementation line and is coupled to Vercel production.
- Current production commit: `25ffa95b15295d2138fae1e476d28c392c4d45f1` — squash merge of PR #63, **Make Fit Report intake evidence-first**.
- PR #63 exact tested head `2f086f73d6784fb5f78f2d2f6fcd85109ee245d0` passed full LikeSized CI #716 before merge.
- Production Vercel deployment `dpl_BQxgW1vq2UrqfVJagWf7FeGcVGB` is READY and aliases `likesized.com`.
- PR #63 introduced the evidence-first **Identify your item** entry, one canonical tag-photo input, compact in-form tag upload for barcode/manual paths, and evidence-aware uncertainty behavior. Owner visual review then identified copy/spacing and matched-identity reset defects; those are the only purpose of the active cleanup branch below.
- PR #62 merge `245bfab0d0d918671cfce3856b78e57525867df2` and production `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G` are superseded by PR #63 production.
- PR #61 exact tested head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed full LikeSized CI #708 and was squash-merged as `24fb0e42b6e05d42a10b1912a5493367975952da`; Vercel production `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG` reached READY.
- No database/schema migration was part of PR #61, PR #62 or PR #63.
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

## Fit Report intake UX cleanup — ACTIVE / OWNER AUTHORIZED THROUGH LIVE DEPLOYMENT
Primary active implementation line: `agent/fit-report-intake-ux-cleanup`, based directly on production PR #63 merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`.

The owner has authorized this cleanup to proceed through merge and live deployment. The implementation head `84bc7066819e3daca1623dabb4eba331f2a8e0f5` passed full LikeSized CI #718 before this documentation-only workflow reconciliation. Because this workflow note changes the branch head, the final exact head must pass CI again before merge. Do not stop at or require a Vercel preview; owner verification happens on the live site after deployment.

Frozen scope:
- tighten the **Identify your item** spacing/presentation;
- opening helper copy: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**;
- opening actions: **Scan barcode**, **Add tag photo**, and smaller **Tags missing? Enter item manually →**;
- whenever no canonical Product match is active, show the standard top-of-form guidance: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**;
- matched Products keep the existing prefilled/community-match message instead;
- preserve the compact optional Product Label / Tag Photo row on barcode/manual paths and do not duplicate it when the opening tag photo is already present;
- restore the pre-redesign uncertainty-modal wording and field labels rather than invent new descriptions; keep the tag-photo prompt conditional on whether that evidence already exists;
- constrain the uncertainty modal heading and tighten its spacing without redesigning unrelated UI;
- **Change Brand** invalidates the entire matched Product identity and clears matched Item, Category, Garment Type, structured Product answers/image/message/defaults while preserving unrelated member-entered Fit Report information/evidence;
- **Change Item** invalidates the matched Product while keeping Brand, then restores the unresolved/manual path and uncertainty control;
- if the rejected match came from a scanned barcode, keep the barcode as evidence but do not silently reattach the old Product when submitted Brand or Item no longer agrees;
- selecting a new real LikeSized Product suggestion establishes that new Product match normally;
- no schema, migration, RLS, Product-trust formula, Match formula or recommendation formula change is part of this cleanup.

# RECENT PRODUCTION HISTORY

## PR #59 — COMPLETE / DEPLOYED
**Repair known Product correction save path.** Authenticated known-Product correction evidence could fail because `record_member_product_identity_issue` referenced restricted `normalize_identifier`. The repair kept the correction RPC callable while keeping the general normalization helper restricted. Canonical migration `supabase/migrations/20260824015612_repair_known_product_identity_correction_rpc.sql` was applied in production as hosted `20260824020058 repair_known_product_identity_correction_rpc`. Exact head `046ccea8e4981a8cf8da3b9c84e1b7dc68ce69b4` passed full CI #704. Squash merge: `b6de93464f55bb03d7c1c0be879c636141cceb40`. Production Vercel: `dpl_29RqGFcbACjyDVQsbWqta1XuC3KD`.

## PR #60 — COMPLETE / DOCS-ONLY
Production reconciliation after PR #58/#59. Exact head `f28d988ca7018653ae82d641b758fc4f4c020481` passed CI #706 and was squash-merged as `c6e643f707bf5f0c44cb26a5cd5fa7f903bbca28`. No application/database behavior change.

## PR #61 — COMPLETE / DEPLOYED
**Polish final Fit Report desktop and item-search UX.** Exact head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed CI #708; squash merge `24fb0e42b6e05d42a10b1912a5493367975952da`; production Vercel `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG`. Delivered 680px desktop single-field cap, shared Category/Type Change control and faster/cached Item suggestions. No database change.

## PR #62 — COMPLETE / DEPLOYED
**Promote Product Label photo in Fit Report.** Exact head `39684abed6312f5d317697f58454b7bd1a6c7572` passed CI #712; squash merge `245bfab0d0d918671cfce3856b78e57525867df2`; production Vercel `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G`. It preserved one Label/Tag evidence input and kept Product Photo in Optional Additional Information, but its large in-form Label/Tag card presentation was superseded by PR #63.

## PR #63 — COMPLETE / DEPLOYED
**Make Fit Report intake evidence-first.** Exact head `2f086f73d6784fb5f78f2d2f6fcd85109ee245d0` passed full CI #716; squash merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`; production Vercel `dpl_BQxgW1vq2UrqfVJagWf7FeGcVGB`. Delivered the evidence-first opening, one canonical tag-photo input, compact conditional tag control and evidence-aware uncertainty path. Owner visual verification exposed the copy/spacing and match-reset defects now isolated to `agent/fit-report-intake-ux-cleanup`.

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
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Approved opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

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

When no Product match is active, standard guidance is **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”** A matched Product instead shows the existing prefilled/community-match message.

A new/unresolved garment retains **I’m not sure this is the correct item/style name**. The uncertainty helper reuses the same underlying Retail Link, Product Photo and conditional Product Label / Tag Photo fields rather than creating duplicate evidence inputs. The pre-redesign explanatory wording is retained; the intake entry-point redesign does not authorize unrelated copy rewrites.

Changing Brand invalidates the entire previous Product match. Changing Item invalidates the Product match while preserving Brand. A scanned barcode may remain evidence after either reset, but it may not silently reattach a Product whose Brand or Item no longer agrees with the member submission.

Optional Additional Information remains collapsed by default:
1. Purchased From.
2. Price Paid.
3. Purchase Method.
4. Approx. Purchase Date.
5. UPC/barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo at the bottom.

Product Photo and Product Label / Tag Photo remain separate evidence roles. This cleanup does not change their existing database/storage access controls.

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
- `agent/promote-label-photo` — RECOVERED/SUPERSEDED via PR #62/PR #63.
- accidental duplicate refs created during PR #62 work contained no unique product work and were reset to production; they have no authority.
- `agent/evidence-first-fit-report-intake` — RECOVERED via PR #63; no longer active.
- `agent/fit-report-intake-ux-cleanup` — **ACTIVE PRIMARY LINE**, based on current production PR #63 and owner-authorized through live deployment. Do not start a second product-decision branch while it is active.

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
11. New Fit Report — six browser/backend wiring checks complete and PR #63 is deployed. Current narrow intake UX/match-reset cleanup is owner-authorized through live deployment; visually verify the tightened opening/modal and Brand/Item reset behavior on `likesized.com` after rollout.
11A. **Garment-question variation classification audit — NEXT PRODUCT-LOGIC AUDIT after the current cleanup rollout.**
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — Exact Variation behavior only after 11A.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish `agent/fit-report-intake-ux-cleanup` through exact-head CI, expected-head merge and live production sanity; do not stop at a separate Vercel preview gate.
- After deployment, owner visually verifies opening spacing/copy, uncertainty modal spacing/copy, unmatched guidance, compact tag uploader, Change Brand full reset, Change Item Product reset and barcode non-reattachment behavior on the live site.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- 11A variation-definition audit is the next logic audit after this cleanup rollout and before Product Detail Exact Variation or counted-report fingerprint reconciliation.
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
- PR #63 exact head `2f086f73d6784fb5f78f2d2f6fcd85109ee245d0` passed full CI #716; squash merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`; Vercel `dpl_BQxgW1vq2UrqfVJagWf7FeGcVGB`.

# EXACT NEXT ACTION — CURRENT
1. Run full LikeSized CI on the new exact head after this owner workflow reconciliation.
2. If green, freeze that exact head and squash-merge PR #64 with expected-head protection under the owner's current production authorization.
3. Follow the Git-triggered Vercel production deployment until READY on `likesized.com`; verify merge SHA, protected-route behavior and runtime errors.
4. Owner visually verifies the tightened opening, standard unmatched guidance, compact in-form tag control, restored uncertainty modal and matched Brand/Item reset behavior on the live site.
5. Then conduct roadmap item **11A Garment-question variation classification** before any Product Detail Exact Variation work.