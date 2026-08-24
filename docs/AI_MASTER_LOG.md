# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current-status record, owner-decision ledger, deployment ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Do not add later requests into that batch. Any request made after deployment authorization starts the next change list and waits for a separate deployment instruction.

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
LikeSized is not yet a public active service with an external audience. For the owner's current build/test workflow, the live `likesized.com` site is the owner verification environment. Do not stop an owner-authorized straight-through batch at a Vercel branch preview or send preview links as a required review gate. After the owner authorizes deployment, finish exact-head CI, merge the frozen branch to `main`, wait for the live Vercel deployment to reach READY, and have the owner verify the change on the live site. This does not remove the requirement for explicit owner deployment authorization.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE
- `main` is the one production implementation line and is coupled to Vercel production.
- Current product implementation commit: `00b6245325bad003e9a82bed438930fd91e13dff` — squash merge of PR #66, **Lock tracked garment variation definitions**.
- PR #66 exact tested head `d585d7df34a5f6370cdd242afcee2ebd5fd6f1c4` passed full LikeSized CI #727 (`32694226884`) before merge.
- Owner explicitly authorized deployment of PR #66 on 2026-08-24.
- Production Vercel deployment `dpl_BtWuyaxVRFRGChT25Qn7oLDGXf4w` reached READY for merge commit `00b6245325bad003e9a82bed438930fd91e13dff` and aliases `likesized.com`.
- PR #65 exact tested head `f9d49a9ad66a11183dcbf5086e706be5b3c8d8a7` passed full LikeSized CI #723 before merge; merge `f75acec9bea0af8a6e8b1b691942f080f9668ea5`; production Vercel `dpl_FdQSyuvSBTDrpEnK4hThiAMdjQ1E` reached READY before PR #66 superseded it.
- PR #64 exact tested head `63fb7698c8338e729cf71495c9b4abac10c6b4a9` passed full LikeSized CI #721 and merged as `97fb30aeee6b08c08f90a369438c85f6be7a5e11`; production Vercel deployment `dpl_CV2dFjk4wim1gfatEtdsEpNwgU1q` reached READY before being superseded by later production.
- PR #63 exact tested head `2f086f73d6784fb5f78f2d2f6fcd85109ee245d0` passed full LikeSized CI #716 before merge; squash merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`; production Vercel deployment `dpl_BQxgW1vq2UrqfVJagWf7FeGcVGB` reached READY before later production updates.
- PR #62 merge `245bfab0d0d918671cfce3856b78e57525867df2` and production `dpl_3DXrLcVy13gwc4L8CSLtvspFLc9G` are superseded by later production.
- PR #61 exact tested head `d4c84b9926ed3b2b53666a399b131e6e14cedfa3` passed full LikeSized CI #708 and was squash-merged as `24fb0e42b6e05d42a10b1912a5493367975952da`; Vercel production `dpl_J9cnoV8VxewwZDZfbjpusi3Gx4RG` reached READY.
- No database/schema migration was part of PR #61 through PR #66.
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

## Roadmap 11A — Garment-question variation classification — COMPLETE / DEPLOYED
Roadmap 11A is merged to `main` through PR #66 and live in production.

Locked 11A decisions:
- **Intended Fit is deleted from every current Garment Type question set.** It was judged subjective/redundant with actual Fit Result and wearer evidence.
- **Sneakers → Use is deleted.** Casual / Running / Training / Court is use/category context, not tracked fit variation identity.
- **Every other structured Garment Type question that remains in current V1 intake is variation-defining.** There are currently no descriptive-only or cosmetic structured Type questions.
- Cropped, sleeve/sleeve length, neckline and closure are globally variation-defining wherever asked.
- Shape values such as Fitted / Flowy remain variation-defining when they describe the garment's physical cut rather than the wearer's subjective Fit Result.
- All remaining clothing questions are variation-defining.
- Approved shoe variation questions are: Sneakers Height/Closure; Boots Style/Height/Heel/Closure; Dress shoes Style/Toe; Loafers Style/Toe; Flats Style/Toe; Heels Heel height/Heel style/Toe; Sandals Style/Closure; Slides Sole; Clogs Heel/Back.
- **Size never defines tracked variation.** Size remains report-specific.
- **Color never defines tracked variation.** Color remains cosmetic for tracked variation identity.
- `lib/garment-taxonomy.ts` is the canonical current Type-question source and owns the derived variation-definition map. Product Detail, recommendation/evidence aggregation and Admin tooling must consume that one map rather than invent parallel logic.
- Current counted-report `objective_variant_key` remains a separate historical/report-dedup concept during 11A. PR #66 did not silently rekey historical Fit Reports or collapse possible legacy duplicates merely because a question was retired. A deliberate counted-report fingerprint reconciliation remains separate work if needed.
- No schema migration was required merely to retire current intake questions; historical database vocabulary/answers may remain inert for compatibility with immutable history.

Exact implementation head `d585d7df34a5f6370cdd242afcee2ebd5fd6f1c4` passed full LikeSized CI #727 (`32694226884`): canonical integrity, TypeScript, all focused application safeguards including the tracked-variation test, production build, fresh replay of every canonical migration and the complete database behavior/privacy suite all passed. PR #66 then squash-merged as `00b6245325bad003e9a82bed438930fd91e13dff`. Production Vercel `dpl_BtWuyaxVRFRGChT25Qn7oLDGXf4w` reached READY and runtime-error inspection after deployment found no errors in the checked window.

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
**Make Fit Report intake evidence-first.** Exact head `2f086f73d6784fb5f78f2d2f6fcd85109ee245d0` passed full CI #716; squash merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`; production Vercel `dpl_BQxgW1vq2UrqfVJagWf7FeGcVGB`. Delivered the evidence-first opening, one canonical tag-photo input, compact conditional tag control and evidence-aware uncertainty path. Owner visual review identified copy/spacing and match-reset defects later repaired by PR #64.

## PR #64 — COMPLETE / DEPLOYED
**Fix Fit Report identity reset and intake copy.** Exact head `63fb7698c8338e729cf71495c9b4abac10c6b4a9` passed full LikeSized CI #721; merge commit `97fb30aeee6b08c08f90a369438c85f6be7a5e11`; production Vercel `dpl_CV2dFjk4wim1gfatEtdsEpNwgU1q` reached READY. Delivered the owner-approved Identify Item/uncertainty copy and spacing cleanup plus canonical Change Brand / Change Item stale-Product reset behavior and barcode non-reattachment safeguards. No database change.

## PR #65 — COMPLETE / DEPLOYED
**Speed Fit Report suggestions and restore photo feedback.** Exact head `f9d49a9ad66a11183dcbf5086e706be5b3c8d8a7` passed full LikeSized CI #723; merge `f75acec9bea0af8a6e8b1b691942f080f9668ea5`; production Vercel `dpl_FdQSyuvSBTDrpEnK4hThiAMdjQ1E` reached READY. Removed the artificial Item-suggestion debounce, restored uncertainty-helper Retail Link alignment and Product Photo explanation/selected-photo confirmation while preserving PR #64 stale-match safeguards. No database change.

## PR #66 — COMPLETE / DEPLOYED
**Lock tracked garment variation definitions.** Exact head `d585d7df34a5f6370cdd242afcee2ebd5fd6f1c4` passed full LikeSized CI #727; squash merge `00b6245325bad003e9a82bed438930fd91e13dff`; production Vercel `dpl_BtWuyaxVRFRGChT25Qn7oLDGXf4w` reached READY. Retired current Intended Fit and Sneakers Use questions, made every remaining current structured Type question explicitly variation-defining, added the one canonical derived variation-definition map and regression coverage, and left historical counted-report fingerprint semantics unchanged. No database change.

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

Product Photo and Product Label / Tag Photo remain separate evidence roles. Current intake cleanup does not change their existing database/storage access controls.

## Fit Result / Fit Rating
Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

## Counted Fit Report identity
For a resolved Product, counted Fit Report identity remains Member + exact Product + normalized Size + objective physical-answer fingerprint + compatible garment-relevant body state. Size stays report-specific. Product Label/Tag evidence does not create another counted report by itself.

11A tracked-variation classification does **not** silently rewrite the existing `objective_variant_key` history. `Not sure` and historical Intended Fit remain excluded by the current fingerprint behavior; legacy retired-question fingerprints are a separate reconciliation concern.

## Tracked fit variation — COMPLETE / DEPLOYED
Tracked variation is separate from base Product and report Size.

Current 11A rules:
- only structured questions LikeSized actually asks for that Garment Type are eligible;
- every remaining current structured Type question is variation-defining;
- Intended Fit is retired globally from current Type questions;
- Sneakers Use is retired;
- Size never defines tracked variation;
- Color never defines tracked variation;
- one canonical map from `lib/garment-taxonomy.ts` must be shared by Product Detail, recommendation/evidence aggregation and Admin tooling;
- current broader counted-report `objective_variant_key` remains separate and was not rekeyed by 11A.

## Product Detail evidence — ROADMAP DEFERRED
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
- `agent/fit-report-intake-ux-cleanup` — RECOVERED via PR #64; no longer active.
- `agent/faster-item-suggestions` — RECOVERED via PR #65; no longer active.
- `agent/variation-definition-map` — RECOVERED via PR #66; no longer active.

Older recovery/feature/verification branches classified in Git history remain RECOVERED, SUPERSEDED, OBSOLETE or DUPLICATE; none overrides current `main`.

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
11. New Fit Report — six browser/backend wiring checks complete; cleanup through PR #65 is deployed.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED through PR #66.**
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — Exact Variation may now consume the canonical 11A map when this audit item is reached.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification; do not silently rekey/collapse historical reports.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Unified public Closet legacy visibility cleanup remains open.
- Exact post-submit mutation/lifecycle schema remains open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
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
- PR #64 exact head `63fb7698c8338e729cf71495c9b4abac10c6b4a9` passed full CI #721; merge `97fb30aeee6b08c08f90a369438c85f6be7a5e11`; Vercel `dpl_CV2dFjk4wim1gfatEtdsEpNwgU1q` reached READY.
- PR #65 exact head `f9d49a9ad66a11183dcbf5086e706be5b3c8d8a7` passed full CI #723; merge `f75acec9bea0af8a6e8b1b691942f080f9668ea5`; Vercel `dpl_FdQSyuvSBTDrpEnK4hThiAMdjQ1E` reached READY.
- PR #66 exact head `d585d7df34a5f6370cdd242afcee2ebd5fd6f1c4` passed full CI #727; squash merge `00b6245325bad003e9a82bed438930fd91e13dff`; Vercel `dpl_BtWuyaxVRFRGChT25Qn7oLDGXf4w` reached READY.

# EXACT NEXT ACTION — CURRENT
1. Owner verifies roadmap 11A behavior on the live `likesized.com` site as needed.
2. Continue the owner re-audit at the next selected item; by the current ordered roadmap this is **12. New Outfit**.
3. Garment/Product Detail Exact Variation work, when reached at item 14, must consume the one canonical `GARMENT_VARIATION_DEFINITION_MAP` and must not reintroduce Size, Color, Intended Fit or Sneakers Use into tracked variation identity.