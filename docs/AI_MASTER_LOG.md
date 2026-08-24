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
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Do not add later requests into that batch. Any request made after deployment authorization starts the next change list and waits for separate deployment authorization.

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
LikeSized is not yet a public active service with an external audience. For the owner's current build/test workflow, the live `likesized.com` site is the owner verification environment. Do not stop an owner-authorized straight-through batch at a Vercel branch preview or require a preview link as a review gate. After explicit deployment authorization, finish exact-head CI, merge the frozen branch to `main`, wait for the live Vercel deployment to reach READY and have the owner verify the change on the live site.

# CURRENT STATUS — 2026-08-24

## Canonical production line
- `main` is the one production implementation line and is coupled to Vercel production.
- Current `main` commit: `f75acec9bea0af8a6e8b1b691942f080f9668ea5` — merge of PR #65, **Speed Fit Report suggestions and restore photo feedback**.
- PR #64, **Fix Fit Report identity reset and intake copy**, merged as `97fb30aeee6b08c08f90a369438c85f6be7a5e11` from exact head `63fb7698c8338e729cf71495c9b4abac10c6b4a9`.
- PR #65 merged on top of PR #64 as `f75acec9bea0af8a6e8b1b691942f080f9668ea5` from exact head `f9d49a9ad66a11183dcbf5086e706be5b3c8d8a7`.
- The previous Fit Report intake UX cleanup line is complete and no longer the active branch.
- PR #61 through PR #65 contained no new database/schema migration. Applied migrations remain immutable.
- Exact Vercel deployment ID/status for the PR #65 production build has not been re-queried during the 11A branch work; do not invent it in this ledger.
- No paid Supabase branches.

## Authenticated browser → backend wiring — COMPLETE
The six ordered browser-to-backend checks are complete:
1. **Normal known Product — PASS.**
2. **Explicit identity uncertainty — PASS.**
3. **Known Product correction/conflict — PASS after PR #59 repair.**
4. **Mobile Item Change — PASS.**
5. **Clean new manual Product — PASS.**
6. **Known barcode — PASS.**

Controlled production test identity remains Maidenform / Heirloom / Bra Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25`, UPC `196988323504`. Its deliberate `catalog_review_needed` state came from the controlled correction test, not barcode corruption.

## Roadmap 11A — Garment-question variation classification — OWNER AUDIT COMPLETE / IMPLEMENTATION ACTIVE
Primary active implementation line: `agent/variation-definition-map`, based directly on current `main` commit `f75acec9bea0af8a6e8b1b691942f080f9668ea5`.

Owner audit is complete. Locked 11A decisions:
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
- Current counted-report `objective_variant_key` remains a separate historical/report-dedup concept during 11A. This implementation must not silently rekey historical Fit Reports or collapse possible legacy duplicates merely because a question was retired. A deliberate counted-report fingerprint reconciliation remains separate work if needed.
- No schema migration is required merely to retire current intake questions; historical database vocabulary/answers may remain inert for compatibility with immutable history.

**Deployment state:** 11A has not been authorized for production. Do not merge/update `main` or deploy this branch without explicit owner authorization.

# FOUNDATION / DATABASE STATUS — VERIFIED
Production Supabase project: `rlksidwniuoxoacumyaf`.

Relevant immutable migration mappings:
- `supabase/migrations/20260823160000_add_unconfirmed_catalog_status.sql` → hosted `20260823205533 add_unconfirmed_catalog_status`.
- `supabase/migrations/20260823160100_unconfirmed_identity_and_photo_roles.sql` → hosted `20260823205642 unconfirmed_identity_and_photo_roles`.
- `supabase/migrations/20260823160200_needs_more_evidence_followup.sql` → hosted `20260823205712 needs_more_evidence_followup`.
- `supabase/migrations/20260824000500_foundation_audit_security_hardening.sql` → hosted `20260824003029 foundation_audit_security_hardening`.
- `supabase/migrations/20260824015612_repair_known_product_identity_correction_rpc.sql` → hosted `20260824020058 repair_known_product_identity_correction_rpc`.

Verified-good foundations include clean candidate→Product materialization, distinct-wearer Product trust, Unconfirmed anti-publication gating, Needs More Evidence re-entry, conflict review without silent Product mutation, barcode corroboration/conflict handling, Product reporting priority, garment-relevant body-state identity, Front/Back Fit Photos, Fit Community separation from Match/Department, global Product search exclusion of unresolved candidates, purchase-context isolation, private Product Label boundaries and the known-Product correction least-privilege boundary.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Direct Product search
Direct Product search is global across men's, women's and unisex Products. Fit Community does not silently gate direct Product search. Unconfirmed and Needs More Evidence are candidate states, not live Products, and do not leak into other members' Product search/suggestions/discovery/barcode suggestions.

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

Approved helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

Main form order after identification:
1. Brand / Make.
2. Item / Style / Model.
3. conditional compact Product Label / Tag Photo.
4. Overall Category.
5. Specific Garment Type.
6. optional Department.
7. zero-to-four controlled Type questions; Not sure always last.
8. Color.
9. Size.
10. Overall Fit Result.
11. Condition.
12. optional Front/Back Fit Photos.
13. optional Fit Notes up to 2,000 characters.
14. optional Retail Link.

When no Product match is active, standard guidance is **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”** A matched Product shows the prefilled/community-match message instead.

Changing Brand invalidates the whole previous Product match. Changing Item invalidates Product match while preserving Brand. A retained scanned barcode cannot silently reattach a Product whose Brand or Item no longer agrees with the member submission.

Optional Additional Information remains collapsed: Purchased From, Price Paid, Purchase Method, Approx. Purchase Date, UPC/barcode when not already scanned, Manufacturer Style / Article Number, Material / Fabric Composition, Product Photo.

Product Photo and Product Label / Tag Photo remain separate evidence roles.

## Fit Result / Fit Rating
Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

## Counted Fit Report identity
For a resolved Product, counted Fit Report identity remains Member + exact Product + normalized Size + objective physical-answer fingerprint + compatible garment-relevant body state. Size stays report-specific. Product Label/Tag evidence does not create another counted report by itself.

11A tracked-variation classification does **not** silently rewrite the existing `objective_variant_key` history. `Not sure` and historical Intended Fit remain excluded by the current fingerprint behavior; legacy retired-question fingerprints are a separate reconciliation concern.

## Product Detail evidence — ROADMAP DEFERRED
When Product Detail exact-variation work is reached, exact tracked variation evidence comes first regardless of whether a related variation has a higher Body Match. Related evidence is secondary and identifies the actual variation difference. Strong Fit Reports aggregate only the same exact variation. Body Match means body similarity, not garment-fit probability.

## Shopping
Like, Wishlist and Shop/Cart remain independent. Shop appears only with a valid retailer destination. No retailer link = no Shop action. Affiliate commission never changes Match, recommendation or retailer relevance.

# CANONICAL RECOVERY / BRANCH LINEAGE
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. PR #43 promoted the verified recovery line to `main`.

Historical branches have no current authority. Merged PR branches are RECOVERED through `main`; superseded experiments remain in Git history only. Current desired long-lived branch state remains `main` plus at most one temporary active PR branch.

Recent branch classification:
- `agent/post-pr59-production-reconciliation` — RECOVERED via PR #60.
- `agent/final-fit-report-ux-polish` — RECOVERED via PR #61.
- `agent/promote-label-photo` — RECOVERED/SUPERSEDED via PR #62/PR #63.
- `agent/evidence-first-fit-report-intake` — RECOVERED via PR #63.
- `agent/fit-report-intake-ux-cleanup` — RECOVERED via PR #64.
- `agent/faster-item-suggestions` — RECOVERED via PR #65.
- `agent/variation-definition-map` — **ACTIVE PRIMARY LINE** for roadmap 11A; no production authorization.

Older branches classified in Git history remain RECOVERED, SUPERSEDED, OBSOLETE, DUPLICATE or DEFERRED; none overrides current `main` or the active 11A line.

# OWNER RE-AUDIT ORDER
1. Homepage + FAQ — live; exact sex/body-specific measurement FAQ wording still pending owner approval.
2. Global header / member menu / admin entry — broader audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — legacy visibility/lifecycle cleanup remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — audit remains.
10. My Circle / Following / system-generated Fit Twin — audit remains.
11. New Fit Report — browser/backend wiring and the evidence-first cleanup are complete through PR #65.
11A. **Garment-question variation classification — owner audit complete; canonical implementation/verification active on `agent/variation-definition-map`.**
12. New Outfit.
13. Outfits / Style Feed.
14. Garment/Product detail — Exact Variation may proceed only after 11A implementation is verified and reconciled.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish 11A canonical map implementation and synchronize `lib/garment-taxonomy.ts`, `docs/V1_PRODUCT_SPEC.md`, `supabase/schema_contract.md`, focused tests and this master on the one active branch.
- Run required exact-head verification before describing 11A implementation as COMPLETE.
- Do not merge/deploy 11A without explicit owner authorization.
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
- PR #56 hardened Product Label privacy/storage/scanner/candidate-history boundaries; migration hosted `20260824003029`; squash merge `7bd1a1a6048bcc991ca6a55547e454b10feec832`.
- PR #57 reconciled PR #56 production docs.
- PR #58 squash merge `d2b546e1ebac2ff537b1375bd9a8909a8cf51b62`.
- PR #59 correction migration hosted `20260824020058`; squash merge `b6de93464f55bb03d7c1c0be879c636141cceb40`.
- PR #60 docs-only reconciliation merge `c6e643f707bf5f0c44cb26a5cd5fa7f903bbca28`.
- PR #61 squash merge `24fb0e42b6e05d42a10b1912a5493367975952da`.
- PR #62 squash merge `245bfab0d0d918671cfce3856b78e57525867df2`.
- PR #63 squash merge `25ffa95b15295d2138fae1e476d28c392c4d45f1`.
- PR #64 merged as `97fb30aeee6b08c08f90a369438c85f6be7a5e11`.
- PR #65 merged as current `main` `f75acec9bea0af8a6e8b1b691942f080f9668ea5`.

# EXACT NEXT ACTION — CURRENT
1. Finish 11A source + canonical-doc synchronization on `agent/variation-definition-map`.
2. Run `npm run canonical:check`, TypeScript/typecheck, focused taxonomy/variation tests and production build on the exact branch head; run database replay/tests only if the final diff affects database behavior.
3. If green, create/refresh the 11A PR and record its exact verified head here. Do **not** merge or deploy without separate explicit owner authorization.
4. After 11A is verified/reconciled, proceed to the next owner-selected audit item; Product Detail Exact Variation must consume the one canonical variation-definition map.
