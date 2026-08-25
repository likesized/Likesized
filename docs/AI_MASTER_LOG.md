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

## Deployment-batch discipline — OWNER LOCKED
Once the owner says **push**, **deploy**, **submit**, **proceed**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

The working batch loop is:

**implement the complete approved batch → targeted relevant checks → full CI at the deliberate stopping point → merge the exact tested candidate → deploy the exact merge → verify live production → reconcile canonical docs**.

Do not call a batch done merely because source was edited or a preview built. The owner verifies fixes on `likesized.com`.

## Live repair fast path — OWNER DIRECTED
During an owner live audit, concrete owner-reported breakage plus a direction to fix it authorizes implementation on the one active repair branch. Do not stop for repeated approval questions, repeated status-only handoffs or parallel repair branches. Production/main still requires explicit authorization unless the owner has already granted deployment for the current frozen batch.

## Future app transition — OWNER LOCKED 2026-08-24
LikeSized remains web-first while V1 is completed and owner-audited, with intended app transition after the web product is mature enough.

Going forward:
- keep product/business rules, Match logic, validation, permissions and canonical data behavior reusable outside UI-specific code when practical;
- prefer stable service/data boundaries and typed contracts shared by web and a future app;
- keep Supabase auth/data/storage/media/server-validation behavior reusable;
- isolate browser-only DOM/file/history/local-state concerns;
- treat mobile camera, touch and constrained devices as first-class now;
- never create separate web-vs-app product truth;
- do not prematurely choose a native framework or rewrite working V1 solely for hypothetical portability.

# CURRENT STATUS — 2026-08-25

## Canonical production line — LIVE THROUGH PR #85; PR #86 ACTIVE / OWNER-AUTHORIZED FOR DEPLOYMENT
Production application source of truth is currently PR #85 squash merge **`95cd89724ab01d85ab2ea3732af4c4f552d700b8`** on `main`.

PR #85 **Finish Outfit interaction and Fit Report photo batch**:
- exact tested PR head: **`672c05cbb31b3f610fadb2ac1509b161e97b61d1`**;
- full LikeSized CI #899 (`32868592544`) passed canonical integrity, exact dependencies, TypeScript, focused safeguards, production build, fresh migration replay and database behavior/privacy tests;
- squash merge: **`95cd89724ab01d85ab2ea3732af4c4f552d700b8`**;
- post-merge CI #900 (`32869025001`) passed;
- Vercel production: **`dpl_Fa29dikcTBi4zFoG8FAvV3zY6qLv`** READY and serving `likesized.com`;
- live homepage returned HTTP 200;
- public logged-out Outfit smoke on `/outfits/d9ce4a2f-055c-4267-9ab3-11654b86965c` returned HTTP 200 with public safe hotspots and no personalized Body Match/FITuition leakage;
- checked deployment runtime error/fatal window was clean.

Latest production database mappings relevant to Roadmap 12:
- `20260825021000_outfit_comment_cursor_pagination.sql` → **`20260825025014 outfit_comment_cursor_pagination`**;
- `20260825122000_outfit_photo_captions.sql` → **`20260825133233 outfit_photo_captions`**;
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → **`20260825155645 outfit_public_hotspots_and_comment_sorting`**.

PR #84 **Finish Roadmap 12 Outfit polish batch** is prior immutable production history:
- squash merge **`332ff38cf214c09125cb8e02b39246a6b0e3e8d9`**;
- CI #892 and post-merge CI #893 passed;
- Vercel **`dpl_6k8RdoXHZbMxHsttrhrbHR2W9WL2`** READY;
- added the Outfit photo-caption production migration listed above.

PR #83 merge **`ccbe87d8391e56d106c58353eaceae1be6aaaa4f`**, PR #82's visible Style Feed rename, PR #81 merge **`1743b0638ac80a5465dba8bb52cab831f6f35148`**, PR #80 merge **`2856b77dda00b7d8bf373579cef2acb36d21cf69`** and earlier Roadmap 12 batches remain immutable Git/deployment history. Current product truth is described below rather than retaining superseded repair-state prose as competing current instructions.

### Active PR #86
Active branch: **`agent/roadmap12-postaudit-canon`**.

Open PR: **#86 — Finish Roadmap 12 interaction consistency batch**.

The owner explicitly directed the complete accumulated batch implemented and deployed. PR #86 therefore has production authorization once the exact final candidate passes the required verification.

PR #86 is an application/docs batch and currently requires **no new Supabase migration**. Its approved scope is:
1. stop eager authenticated member-menu prefetching that was creating needless request/load churn;
2. menu wording **Add a Garment** and **Style an Outfit**;
3. canonical Fit Report Photos UI ordered **Front Fit Photo → Back Fit Photo → Product Photo (not being worn)** with one canonical Product Photo input and the approved public-sharing copy;
4. keep the new-report requirement that at least one of Front / Back / Product Photo is present;
5. remove the duplicate Product Photo presentation from Optional Additional Information;
6. use one shared full-size image viewer with intentional close/Escape and swipe-down dismissal where appropriate;
7. route New Outfit **Back to My Closet** directly to **My Closet → Outfits**;
8. introduce one shared compact action vocabulary rather than one-off icon/button meanings;
9. Outfit-content action row becomes **LikeLocker · Share · Report**; Follow/Notify remain person/creator context;
10. creator avatar/name opens a compact member quick view with **Overall Match, Tops Match, Bottoms Match, Total Fit Reports, Total Outfits, View Full Profile**, plus appropriate Follow/notification controls;
11. tagged garment quick view uses **LikeLocker · Wish Locker · Shop · Share · Report** and opens the garment image full-size through the shared swipe-dismiss viewer;
12. synchronize safeguards and canonical docs before the production stopping point.

Earlier PR #86 CI runs #901–#903 caught stale regression-test assertions rather than confirmed implementation failures; canonical integrity and TypeScript passed in those runs before the stale assertions stopped the workflow. The final PR #86 candidate must still complete the entire CI/build/fresh migration replay/database suite before merge. Do not treat partial green runs as final verification.

## Roadmap 12 — New Outfit — CURRENT OWNER AUDIT GATE
Roadmap 12 is production-live through PR #85 and is still under owner audit. PR #86 is the current owner-approved interaction-consistency batch.

**Roadmap 13 remains blocked until the owner explicitly finishes the New Outfit/Roadmap 12 audit and accepts the production stopping point.**

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means garment-relevant body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.
- A profile photo, when uploaded, is public current identity. Outfit/comment/profile surfaces resolve current identity rather than snapshotting an old avatar.

## Fit Community / Following / Twin status
- Fit Community = Men / Women / Both; it is wearer/social relevance metadata and never changes Match math.
- **Following** is member-controlled.
- One canonical `follows` graph exists.
- **Fit Twin is system-generated** among followed people from strong current regional Match quality.
- Both Tops + Bottoms qualify → Fit Twin; Tops only → Tops Twin; Bottoms only → Bottoms Twin; Overall Match alone never grants Twin status.
- Follow alone does not enable person notifications.

## Controlled Product identity trust
- Unconfirmed = pre-publication candidate only when Item / Style / Model identity is explicitly uncertain.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
- Repeated reports from one member do not manufacture distinct-wearer Product trust.
- Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define another base Product.
- Barcode relationship confidence is separate from Product confidence; competing Product claims for one barcode are review evidence, never silent reassignment.

## New Fit Report — evidence-first flow
Opening:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

When no Product match is active: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**

Brand/Item identity reset rules remain canonical: changing Brand invalidates the matched Product and clears Product-derived Item/type/details; changing Item invalidates the matched Product while preserving Brand. A scanned barcode may remain evidence but may not silently reattach an incompatible Product.

Every **new Fit Report** requires at least one of:
- Front Fit Photo;
- Back Fit Photo;
- Product Photo.

Photo controls are presented **Front → Back → Product Photo (not being worn)**. Front/Back are community-visible wear evidence. Product Photo is separate Product/catalog evidence. Product Label / Tag Photo remains private identity-review evidence. The form uses one canonical Product Photo input; different helpers may open it but may not create duplicate evidence fields.

Fit Report/Closet display priority is **Front Fit Photo → Product Photo → Back Fit Photo**. Scanner identification priority is separately **Product/catalog photo → shared Front Fit Photo → other shared Fit Photo → placeholder**.

Optional Additional Information remains collapsed for purchase context, UPC when not scanned, Style/Article Number and Material/Fabric Composition; Product Photo is not duplicated there.

## Tracked fit variation — LOCKED
- only structured questions LikeSized actually asks for the Garment Type are eligible;
- every current remaining structured Type question is variation-defining;
- Intended Fit is retired globally;
- Sneakers Use is retired;
- Cropped, sleeve/sleeve length, neckline and closure are variation-defining wherever asked;
- Size never defines tracked variation;
- Color never defines tracked variation;
- `lib/garment-taxonomy.ts` owns the one current map through `GARMENT_VARIATION_DEFINITION_MAP`.

Historical counted-report `objective_variant_key` remains separate; retiring questions does not silently authorize historical rekeying/collision changes.

## Matching Fit Reports / FITuition — LOCKED
`Matching Fit Reports: X` is personalized useful evidence, never a raw Product total.

The viewer's own eligible exact Product evidence is useful and may be the strongest evidence. It must not disappear merely because the viewer authored it.

Recommendation evidence dedupes **same person + same Product + same tracked fit variation** to one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color do not create tracked variations.

FITuition combines Size Match evidence with the viewer's relevant Closet History. Exact Product/variation evidence is strongest; related variation is reduced fallback/support. Confidence is separate from recommendation score. `Would Buy Again` does not affect recommendation.

When evidence exists but confidence is insufficient, current quick-view direction is **“FITuition isn’t confident enough yet.”** with a relevant-match explanation. With no relevant evidence: **“FITuition needs more evidence.”**

## Shopping / lockers
LikeLocker, Wish Locker and Shop are independent.
- LikeLocker = product affinity/save state.
- Wish Locker = purchase-intent wishlist state.
- Shop appears only when a valid canonical retailer destination exists.
- No retailer destination = no Shop action.
- Affiliate commission never changes Product identity, Match, recommendation or ranking.

## Outfit public/privacy boundary
Published Outfits are public readable editorial content.

Logged-out visitors may see safe public Outfit content, resolved Product identification and public photo hotspots. Logged-out users do **not** receive fake personalized Matching Fit Reports, Body Match or FITuition results; tapping a tagged item uses an auth gate for personalized fit intelligence.

Raw/private body data, private Closet linkage, unresolved candidate/review state and authenticated member interaction state remain protected.

## Outfit interaction — CURRENT ROADMAP 12 DIRECTION
- One published Outfit uses one shareable `/outfits/[id]` route.
- Gallery is one active photo at a time; secondary photos remain behind it rather than a thumbnail strip.
- Clicking/tapping the photo background opens full-size; tags/caption overlays retain independent behavior.
- Optional Outfit photo captions are maximum 200 characters and hidden by default behind Caption control.
- Safe public hotspots remain visible logged out.
- Tagged Items and on-photo hotspots open the same canonical tagged-item quick view.
- Tagged quick view is personalized only when the viewer is signed in and eligible for personalized evidence.
- Tagged garment actions are **LikeLocker · Wish Locker · Shop · Share · Report**.
- LikeLocker/Wish Locker update locally/in place and independently.
- Report reason starts unselected; Other is deliberate, never silently defaulted.
- Outfit-content actions are **LikeLocker · Share · Report**. Follow/Notify belong to creator/profile context.
- Creator quick view may show Overall/Tops/Bottoms Match, Total Fit Reports, Total Outfits, View Full Profile, Follow and notification state without exposing raw measurements.
- Comments default to **Top** and may switch to **Newest**. Top = Like count descending, newest tie-break. Newest = newest first.
- Comment submit, Like/unlike and sort switching use the API/local interaction path rather than whole-Outfit navigation for every action.
- Owner management controls—Edit, comments on/off, delete, Views, Follows generated—remain separate from viewer content actions.
- New Outfit back navigation returns to **My Closet → Outfits**.

# OWNER-LOCKED STYLE FEED DIRECTION — ROADMAP 13, FULL BEHAVIOR NOT YET IMPLEMENTED
The current `/circle` route has the visible **Style Feed** name, and homepage/navigation copy may point to it. This does **not** mean the full Roadmap 13 feed behavior is complete.

When Roadmap 13 is explicitly unblocked:
1. Style Feed is a passive Instagram/Pinterest-like rolling Outfit inspiration feed.
2. Source is **people the viewer already follows only**.
3. Top relationship controls are **All | Fit Twins**.
4. Fit Twins includes Fit Twin, Tops Twin and Bottoms Twin.
5. **Occasion** is the only additional feed filter.
6. **There is no Style Tag filter in Style Feed.**
7. Explore/Search remain for intentional Product/garment discovery.
8. Exact ranking remains undefined until the roadmap is reached; do not invent it earlier.

Homepage third feature-card direction is locked:
- eyebrow/title **FIT YOUR STYLE**;
- headline **Follow people whose fit and style you trust.**;
- supporting meaning: see what they wear, how they style it, what they recommend, and how they put it all together;
- CTA **Get Inspired →**.

Conceptual feature flow: **Find People My Size → See What Works for Them → Fit Your Style**.

Approved FAQ Fit Twin copy direction: users may follow anyone; Fit Twin is an automatic designation for especially similar Tops + Bottoms measurements, while Tops Twin/Bottoms Twin identify one-region qualification.

# ROADMAP / OWNER RE-AUDIT ORDER
1. Homepage + FAQ — current public copy live; exact sex/body-specific measurement FAQ wording remains pending owner approval.
2. Global header / member menu / admin entry — PR #86 includes current menu performance/wording repair; broader audit may continue afterward.
3. Auth — owner-confirmed baseline.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — canonical visibility meaning reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — broader audit remains; regional Twin rule live.
10. Style Feed relationship semantics — direction locked above; full feed behavior remains Roadmap 13.
11. New Fit Report — evidence-first flow live; PR #86 reconciles photo-control presentation without changing the core requirement introduced in PR #85.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit — CURRENT OWNER AUDIT GATE; production through PR #85, PR #86 active.**
13. **Style Feed full behavior/ranking — BLOCKED until the owner closes Roadmap 12.**
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

Later Roadmap 12 mappings:
- `20260824231500_outfit_comment_likes.sql` → hosted **`20260825000654 outfit_comment_likes`**.
- `20260824234500_live_profile_identity.sql` → hosted **`20260825000708 live_profile_identity`**.
- `20260825000500_fix_live_comment_like_count_projection.sql` → hosted **`20260825000722 fix_live_comment_like_count_projection`**.
- `20260825021000_outfit_comment_cursor_pagination.sql` → hosted **`20260825025014 outfit_comment_cursor_pagination`**.
- `20260825122000_outfit_photo_captions.sql` → hosted **`20260825133233 outfit_photo_captions`**.
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → hosted **`20260825155645 outfit_public_hotspots_and_comment_sorting`**.

Applied migrations are immutable. PR #86 adds no migration.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish full PR #86 verification after all source/test/doc reconciliation. Exact final head must pass the complete CI/build/fresh migration replay/database suite.
- Compare PR #86 against `main` before merge and confirm there are no accidental temp/backup/duplicate files and no unintended migration.
- Under the owner's already-granted deployment authorization, merge the exact green PR #86 candidate, wait for post-merge CI/Vercel READY and verify `likesized.com` plus the public Outfit hotspot/privacy smoke.
- Reconcile this master with the exact final PR #86 head/CI/merge/deployment facts immediately after production verification; do not leave an active-candidate status as long-term production truth.
- Continue the owner New Outfit re-audit after that live check. **Roadmap 13 remains blocked until the owner says Roadmap 12/New Outfit is complete.**
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- `main` is currently not branch-protected; required PR + CI protection remains a separate owner decision and must not be changed silently.

# RECENT CANONICAL LINEAGE
Historical branches have no current authority; Git history preserves superseded implementations and current files define current truth.

Recent production lineage:
- PR #80 — stopping-point Roadmap 12 repair — DEPLOYED.
- PR #81 — tagged-item live regression repair — DEPLOYED, merge `1743b0638ac80a5465dba8bb52cab831f6f35148`.
- PR #82 — visible Style Feed rename/copy slice — DEPLOYED; full Roadmap 13 behavior was intentionally not implemented.
- PR #83 — Roadmap 12 follow-up — DEPLOYED, merge `ccbe87d8391e56d106c58353eaceae1be6aaaa4f`.
- PR #84 — Outfit polish/captions — DEPLOYED, merge `332ff38cf214c09125cb8e02b39246a6b0e3e8d9`.
- PR #85 — Outfit interaction/Fit Report photo batch — DEPLOYED, merge `95cd89724ab01d85ab2ea3732af4c4f552d700b8`.
- `agent/roadmap12-postaudit-canon` / PR #86 — **ACTIVE OWNER-AUTHORIZED BATCH; NOT YET PRODUCTION-LIVE at this reconciliation point.**

# EXACT NEXT ACTION — CURRENT
1. Finish PR #86 regression synchronization and canonical-doc reconciliation.
2. Run the entire PR CI on the exact final head, including build, fresh replay of all canonical migrations and database behavior tests.
3. Review the full diff against `main` for canonical cleanliness and absence of unintended migration/temp files.
4. Because the owner has already authorized this batch for production, squash-merge the exact green PR #86 candidate.
5. Verify post-merge CI and the exact Vercel production deployment/SHA.
6. Smoke `likesized.com` and the known public Outfit route, including logged-out public hotspots and absence of personalized fit leakage; check deployment-scoped error/fatal logs.
7. Record the exact final PR #86 head, CI run, merge SHA and deployment ID here as the next production checkpoint.
8. Keep Roadmap 13 blocked until the owner explicitly closes the Roadmap 12 audit.
