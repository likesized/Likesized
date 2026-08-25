# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current-status record, owner-decision ledger, deployment ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/deployment/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
`likesized.com` is the owner's current verification environment. After explicit deployment authorization, finish exact-head verification, merge the frozen branch to `main`, wait for Vercel production to reach READY, verify live runtime state, reconcile canonical docs, and return the deployed site for owner browser testing.

## Live repair fast path — OWNER DIRECTED 2026-08-24
During an owner live audit, when the owner identifies concrete breakage and directs it fixed, that instruction authorizes implementation on the one active repair branch. Do not stop for repeated re-audits, duplicate approval questions or status-only handoffs. Implement canonical source, add focused coverage, run required verification and continue through the authorized deployment boundary. Production/main still requires explicit owner authorization unless already granted for the current frozen batch.

## Rapid live-review logging correction — OWNER DIRECTED 2026-08-24
During rapid-fire live review, keep the issue queue in the active conversation instead of rewriting this file after every owner message. When the review pass ends or the owner directs the batch fixed, reconcile the complete corrected queue into this one canonical master update. Do not create a second notes file. This prevents slow per-message GitHub writes and reduces stale/misread issue drift.

## Future app transition — OWNER LOCKED 2026-08-24
LikeSized remains web-first while V1 is completed and owner-audited, with intended app transition after the web product is mature enough.

Going forward:
- keep product/business rules, Match logic, validation, permissions and canonical data behavior reusable outside UI-specific code when practical;
- prefer stable service/data boundaries and typed contracts shared by web and a future app;
- keep Supabase auth/data/storage/media/server-validation behavior reusable;
- isolate browser-only DOM/file/history/local-state concerns;
- treat mobile camera, touch and constrained devices as first-class now;
- never create separate web-vs-app product truth;
- do not prematurely choose a native framework or rewrite working V1 solely for hypothetical portability;
- when choices are otherwise equivalent, prefer the one reusable by a future app.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE THROUGH PR #77
- Current production application merge: **`41c92a5c94a8d03d59b627f8f5b55e37bdcf482f`**, squash merge of PR #77 **Complete Roadmap 12 live-review repairs**.
- Exact PR #77 final head: **`2a6ada938db7772bf27819593d97f5d3556e4312`**.
- Full LikeSized CI #853 (`32791915054`) passed on that exact head: canonical integrity, exact dependencies, TypeScript, all focused application safeguards, production build, complete fresh migration replay and complete database behavior/privacy suite.
- Owner explicitly authorized production deployment of the finished batch on 2026-08-24.
- Three additive PR #77 migrations were applied and smoke-verified in production Supabase before application cutover.
- Production Vercel deployment: **`dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`**.
- Deployment reached READY and aliases **`likesized.com`** and `likesized.vercel.app`.
- Live `likesized.com` returned HTTP 200 from deployment `dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`.
- Deployment-scoped post-cutover error/fatal runtime inspection found no matching logs.
- Current active line is **`agent/post-pr77-production-reconciliation`**, docs-only, created from production merge `41c92a5c94a8d03d59b627f8f5b55e37bdcf482f` to reconcile exact production truth. It contains no new product/application behavior.
- Applied database migrations are immutable; future corrections use later ordered migrations.
- No paid Supabase branches.

## Roadmap 12 — New Outfit — DEPLOYED THROUGH PR #77 / OWNER LIVE RE-AUDIT REMAINS THE GATE
Roadmap 12 foundation and successive live-repair batches are production-live through PR #77. The owner has already exercised create/draft/preview/publish/opened-Outfit behavior and supplied the latest repair batch. Continue owner live re-audit on the new production. **Do not advance to Roadmap 13 until the owner finishes the New Outfit audit.**

# PR #77 OWNER LIVE-REVIEW BATCH — DEPLOYED / VERIFIED
The corrected rapid live-review queue is now implemented, verified and production-live. The prior mistaken interpretation that the owner wanted tagged-garment detail fields “less stacked” was invalid and is not canonical. The actual stacking issue was the Outfit feed collapsing into a single vertical column instead of the intended pinboard layout.

Deployed corrections:
1. **Photo Tags / Use Cover Photo Tags:** rendered as an obvious interactive action/button rather than passive-looking text.
2. **Items picker progressive filtering:** default is **All Garments**; initial sorting is **Recently Added** and **A–Z**; deeper filters appear when relevant; Garment Type is a filter, never a sort option.
3. **Garment card click:** opens compact quick detail instead of immediately selecting the garment.
4. **Actual selection:** requires explicit **Add**/check action.
5. **Garment quick view:** identifies similar versions with Brand, Item/Model, Category/Garment Type, Size, Color, available photos, Fit Result where applicable and every answered garment-specific structured question.
6. **Embedded Brand suggestions:** anchor below the active input and do not cover typed text.
7. **Item / Style / Model suggestion speed:** uses immediate cached/prefetched results plus a brief 60 ms network debounce rather than the old slow path.
8. **Save Draft responsiveness:** keeps explicit pending/saved feedback, avoids unnecessary photo re-upload/reprocessing and does not intentionally freeze/reload the editor after a successful save.
9. **Preview scroll:** Preview Publish starts at the top rather than inheriting a bottom scroll position.
10. **Opened Outfit gallery:** one-photo viewer on **mobile and desktop**; secondary images stay hidden behind the active image; no visible thumbnail/secondary strip is the primary navigation. Mobile swipe/tap and desktop click/pointer-drag/keyboard navigation are supported where applicable.
11. **Tagged garment details:** include Garment Category/Type, such as **Bra**, alongside Brand/Item, Size and Fit Result.
12. **Outfit feed layout:** uses the intended responsive multi-column masonry/pinboard rhythm rather than unnecessary one-column stacking.
13. **Creator analytics:** separate creator analytics expose **Views + Follows generated** only. Likes/Comments/Shares are not duplicated because those social counts are already visible. Shop-click attribution stays internal LikeSized data and is not a creator-facing metric/explanatory block.
14. **Delete safety:** deleting a published Outfit requires explicit confirmation.
15. **Tagged Product action layout:** Product identity and View/Like/Wish Locker/Shop actions are grouped in a compact balanced responsive card on mobile and desktop instead of large dead spacing.
16. **Comments:** **plain text only** — no rich text, markup/formatting controls, embedded media or nested reply system.

Additional production-live PR #77 work tied to the same owner review:
- **Comment Likes:** signed-in members can Like visible comments; member Like state is private while the safe aggregate count is visible. Comment author/Outfit creator delete boundaries and report controls remain.
- **My Closet is the owned-content hub:** Garments, Outfits and FITuition live under one canonical My Closet surface; `/outfits` is compatibility routing into the Closet Outfits view, not a second creator-content system.
- **Live profile identity:** profile photos are current public identity when uploaded. Owned/discovered/opened/commented Outfit surfaces resolve the current profile photo instead of snapshotting an old avatar onto content.
- **Opened Outfit hierarchy:** compact creator identity/header, active photo, social actions and exclusive Style Notes / Comments / Tagged Items tabs.
- **Regional Twin designation:** both Tops Match and Bottoms Match clearing the configured strong-match threshold = Fit Twin; Tops only = Tops Twin; Bottoms only = Bottoms Twin. Overall Match remains the general score but does not grant Twin status by itself. Public FAQ and relevant member/Outfit contexts use this rule.
- **Blocking context:** member blocking belongs to profile/member context rather than a redundant Outfit-level block action.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

## Fit Community / Following / Twin status
- Fit Community = Men / Women / Both, private social/wearer relevance metadata; it never changes Match math.
- **Following** is member-controlled.
- **Fit Twin is system-generated** among followed people from strong current regional Match quality.
- One canonical `follows` relationship exists; there is no second member-controlled Twin graph.
- Both Tops + Bottoms qualify → Fit Twin; one regional qualifier → Tops Twin or Bottoms Twin; Overall Match alone never grants Twin status.

## Product identity trust
- Unconfirmed = pre-publication candidate only.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
Repeated reports by one member do not manufacture distinct-member trust.

## Product identity / barcode boundary
Base Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define a new base Product. Barcode confidence is separate. Conflicts are preserved for review rather than silently rewriting Product truth.

## New Fit Report — evidence-first flow
Opening:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

Main flow remains Brand/Make → Item/Style/Model → optional Tag evidence when not already supplied → Overall Category → Specific Garment Type → optional Department → zero-to-four structured Type questions → Color → Size → Fit Result → Condition → optional Front/Back Fit Photos → optional Fit Notes → optional Retail Link.

When no Product match is active: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**

New/unresolved garments retain **I’m not sure this is the correct item/style name**. Changing Brand invalidates the prior Product identity; changing Item invalidates the Product while preserving Brand. A scanned barcode may remain evidence but may not silently reattach an incompatible Product.

Optional Additional Information remains collapsed: Purchased From, Price Paid, Purchase Method, Approx. Purchase Date, UPC/barcode when not scanned, Manufacturer Style/Article Number, Material/Fabric Composition, Product Photo.

## Tracked variation
- only structured questions LikeSized actually asks for the Garment Type are eligible;
- every current remaining structured Type question is variation-defining;
- Intended Fit is retired globally;
- Sneakers Use is retired;
- Cropped, sleeve/sleeve length, neckline and closure are variation-defining wherever asked;
- Size never defines tracked variation;
- Color never defines tracked variation;
- `lib/garment-taxonomy.ts` owns the one current map.

## Shopping / wishlist
Like, Wishlist and Shop/Cart remain independent. Shop appears only with a valid retailer destination. No destination = no Shop. Canonical shopping destinations are `retailer_listings`; affiliate commission never changes relevance/Match/recommendation.

## Product Detail evidence — ROADMAP DEFERRED
Exact tracked-variation evidence comes first. Related variation evidence is secondary and must identify the actual variation difference. Strong reports aggregate only the exact same variation. Body Match remains body similarity, not garment-fit probability.

## FITuition
FITuition combines Size Match evidence with Closet History to recommend size. Exact-variation evidence is strongest; related variation is fallback/supporting evidence. Closet History is weighted by garment relevance. Confidence is separate from recommendation score and reflects evidence quantity/quality/agreement/separation. Member-facing UI shows recommendation, confidence and understandable evidence—not the internal numeric FITuition score.

# ROADMAP / OWNER RE-AUDIT ORDER
1. Homepage + FAQ — live; exact sex/body-specific measurement FAQ wording still pending owner approval.
2. Global header / member menu / admin entry — broader owner interaction audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — canonical visibility meaning reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — broader audit remains; regional Twin rule is now production-live.
10. My Circle / Following / system-generated Fit Twin — broader ranking/activity audit remains; regional Twin rule is production-live.
11. New Fit Report — current evidence-first flow and suggestion-speed fixes deployed.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit — production deployed through PR #77; authenticated owner live re-audit remains the current gate.**
13. Outfits / Style Feed — follows Roadmap 12; full discovery/ranking audit remains after owner finishes Roadmap 12 audit.
14. Garment/Product detail — Exact Variation consumes the canonical 11A map when reached.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# ROADMAP 12 DATABASE FOUNDATION — PRODUCTION
Production Supabase project: `rlksidwniuoxoacumyaf`.

Original Roadmap 12 foundation mappings remain immutable:
- `20260824133400_add_outfit_comment_moderation_target.sql` → hosted `20260824164156 add_outfit_comment_moderation_target`.
- `20260824133500_new_outfit_v1_social_foundation.sql` → hosted `20260824164328 new_outfit_v1_social_foundation`.
- `20260824133600_complete_new_outfit_v1_boundaries.sql` → hosted `20260824164410 complete_new_outfit_v1_boundaries`.
- `20260824133700_harden_new_outfit_v1_social_controls.sql` → hosted `20260824164420 harden_new_outfit_v1_social_controls`.
- `20260824133800_canonical_public_closet_and_outfit_public_identity.sql` → hosted `20260824164452 canonical_public_closet_and_outfit_public_identity`.
- `20260824133900_fix_outfit_compatibility_photo_registration.sql` → hosted `20260824164507 fix_outfit_compatibility_photo_registration`.

PR #77 mappings:
- `20260824231500_outfit_comment_likes.sql` → hosted **`20260825000654 outfit_comment_likes`**.
- `20260824234500_live_profile_identity.sql` → hosted **`20260825000708 live_profile_identity`**.
- `20260825000500_fix_live_comment_like_count_projection.sql` → hosted **`20260825000722 fix_live_comment_like_count_projection`**.

Production smoke verification after these migrations proved `profile-photos` public identity storage, the comment-Like table and the corrected public comment projection were live before application cutover.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Continue owner live re-audit of PR #77 production across create → Draft/resume → Preview → Publish → opened Outfit/detail/gallery/hotspots → edit → comments/social → practical mobile/desktop behavior. New findings belong to the next review batch.
- **Roadmap 13 remains blocked until the owner says the Roadmap 12/New Outfit audit is complete.**
- Future work must preserve the owner-locked app-transition direction and avoid needless browser-only coupling.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Full My Circle Following / Fit Twins / Discover ranking and richer Outfit discovery/search remain later roadmap work.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- `main` is currently not branch-protected; required PR + CI protection remains a separate owner decision and must not be changed silently.

# CANONICAL RECOVERY / BRANCH LINEAGE
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. Historical branches have no current authority; Git history preserves superseded implementations and current files define current truth.

Recent relevant lineage:
- `agent/new-outfit-v1` — RECOVERED via PR #67 / DEPLOYED.
- `agent/outfit-live-audit-repairs` — RECOVERED via PR #70 / DEPLOYED.
- `agent/outfit-publish-product-read-fix` — RECOVERED via PR #72 / DEPLOYED.
- `agent/outfit-live-audit-batch-2` — RECOVERED via PR #74 / DEPLOYED.
- `agent/outfit-ios-photo-encoding-repair` — RECOVERED via PR #76 / DEPLOYED.
- `agent/roadmap-app-transition-live-review` — RECOVERED via **PR #77 / DEPLOYED**.
- `agent/post-pr77-production-reconciliation` — **ACTIVE docs-only reconciliation line** from PR #77 production `main`; no product behavior changes.

# CONDENSED DEPLOYMENT LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line; PR #43 promoted it.
- PR #56 hardened Product Label/privacy/storage/scanner/candidate-history boundaries; production migration applied and verified.
- PR #59 repaired known Product correction save permissions; production migration applied and verified.
- PR #61 polished Fit Report desktop/item-search UX; deployed.
- PR #63 made Fit Report intake evidence-first; deployed.
- PR #64 repaired Fit Report identity reset/copy; deployed.
- PR #65 sped Fit Report suggestions and restored photo feedback; deployed.
- PR #66 locked tracked garment variation definitions; deployed.
- PR #67 established New Outfit V1 foundation and six Roadmap 12 migrations; deployed.
- PR #68 shipped approved homepage brand copy; deployed.
- PR #70 shipped first New Outfit live-audit repairs; deployed.
- PR #72 fixed signed-in published Outfit Product reads/shopping source; deployed.
- PR #74 shipped New Outfit live-audit batch 2; deployed.
- PR #76 fixed iOS/Safari Outfit photo conversion fallback; exact head `36d5a433a16d844ada1e5cfdd67264f8caf5a918`, CI #801, merge `e4af3074806a0e2307d7e8d0c21e821c70425eaa`, Vercel `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6` READY.
- **PR #77 completed the current Roadmap 12 live-review repair batch**: exact head `2a6ada938db7772bf27819593d97f5d3556e4312`; full CI #853 (`32791915054`) passed; production migrations `20260825000654`, `20260825000708`, `20260825000722` applied/smoke-verified; squash merge **`41c92a5c94a8d03d59b627f8f5b55e37bdcf482f`**; Vercel **`dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`** READY and serving `likesized.com`; live HTTP 200; checked deployment-scoped error/fatal logs clean.

# EXACT NEXT ACTION — CURRENT
1. Finish this docs-only PR #77 production reconciliation with exact-head canonical CI and merge it to `main`; verify the resulting docs-only Vercel production deployment.
2. Return `likesized.com` to the owner for continued live testing of the PR #77 repair batch.
3. New owner findings become the next live-review batch and may be implemented on one new active branch when directed.
4. Do not advance to Roadmap 13 until the owner explicitly finishes the New Outfit/Roadmap 12 audit.
