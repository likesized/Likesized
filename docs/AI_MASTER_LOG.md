# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the **one and only LikeSized roadmap, status record, completed-work ledger, phase checklist, and AI handoff**. Repository policy lives in `AI_REPOSITORY_RULES.md`; product architecture lives in `docs/V1_PRODUCT_SPEC.md`; database/privacy behavior lives in `supabase/schema_contract.md`. If old planning text conflicts with this guide, this guide wins for roadmap/status/handoff and stale planning text must be removed.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations. Approved changes modify canonical source; Git history is history.
- **Every completed task, approved update, canonical source change, configuration change, deployment checkpoint, verification result, and owner-locked decision must be logged in this master.**
- **A task is not complete until the canonical repository and this master both reflect the final verified state.** When practical, the implementation and master-log update belong in the same canonical change set.
- Never record planned, attempted, failed, local-only, preview-only, approved-but-unimplemented, or unverified work as complete. Record meaningful unresolved work explicitly.
- Before any handoff, this master must contain the current phase, completed work, unresolved work, deployment state, and exact next action.
- If an audit proves a prior completion claim does not match canonical source or verified production, correct this master immediately. Canonical source and verified production determine implementation status.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Do not deploy production unless the owner explicitly authorizes it. Updating `main` may trigger Vercel and therefore requires owner authorization when it will cause production deployment.
- Work Phases 0→7 in order without diversion. Ask the owner only for genuine product/business/cost/credential decisions.

## Product / privacy rules — LOCKED
**See what fits people built like you.** Primary question: **“How did this garment fit people built like me?”**

1. Current person/Fit Twin matching = current body ↔ current body.
2. Historical garment matching = viewer current body ↔ immutable body snapshot attached to that Fit Report.
3. Never blend those scores or rewrite historical Fit Report/body associations after a body change.
4. Recommendation aggregation uses at most one strongest observation per unique wearer.
5. Raw current/historical body measurements and normally-worn size references remain owner-private.
6. Private Closet items are owner-only; Shared evidence is member-readable. Uploaded fit/reference photos are Shared to authenticated members; no private fit-photo mode.
7. Original manufacturer size text is preserved while logical matching uses normalized sizing where possible.
8. V1 member identity is authenticated-member-only.
9. V1 People My Size UI is **Overall | Tops | Bottoms**; garment-specific filters may be exposed later without a matching-engine rewrite.
10. Product Fit Families are intentional same-fit/cut groups only; no fuzzy-name auto-grouping.
11. Similar Garments uses controlled construction/material attributes.
12. Product evidence order is **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
13. **Following Feed is V1.** Meaningful activity: Shared Closet additions, new Shared Fit Report observations/re-try-ons, outfit posts. Likes are not feed events. Private activity/raw body data never appears.
14. Following Feed current match badges are relationship context only; garment evidence remains historical-snapshot based.
15. **Fit Twin activity notifications are V1 and are in-app only.** Future Fit Twin activity alerts are ON by default. Members have one global on/off control plus per-Fit-Twin mute. Global off/mute does not change the Following Feed. Likes never alert. V1 sends no Fit Twin activity email or phone push. Global off, mute, or unfollow prevents future alerts without deleting already-valid prior alerts; re-enable/refollow does not backfill missed alerts. Unfollow clears that relationship's mute so refollow starts unmuted, subject to the global setting. If underlying Shared content becomes Private or is deleted, its existing notification is removed with the source activity.
16. **Fit Twin/follow relationships are community-public within LikeSized.** Any signed-in member may see who follows whom; only the follower can change their relationship. Anonymous visitors cannot query the graph.
17. Outfit posting may intentionally auto-share tagged Private Closet garments, but share/post/tag creation must be atomic. A failed outfit post cannot leave a previously Private garment Shared. If a tagged garment later becomes Private, its garment tag/fit evidence disappears from other members while the independent outfit social post may remain visible.
18. **V1 Search uses canonical database identity, not a parallel search catalog.** Authenticated catalog discovery searches product name, canonical brand, brand alias, manufacturer style, product identifiers such as SKU/UPC/barcode, retailer product ID/SKU, and listing title, deduplicated to one canonical Product. Member discovery searches authenticated-member-readable username/display name only, excludes the viewer, and never exposes raw Fit Profile data.

## Current baseline — 2026-08-20
- Full Next.js app, Supabase integration, matching/recommendation logic, canonical docs, and Vercel production connection are in GitHub.
- **30 canonical migrations** through `20260819212753_canonical_search_discovery_rpcs.sql`.
- Supabase Security Advisor was last verified at **0 findings** after the canonical Phase 5 work and production readiness checks.
- CI covers install, typecheck, recommendation calibration, production build, fresh migration replay, and canonical pgTAP suites.
- Prototype homepage data, `lib/mock-data.ts`, and obsolete standalone `lib/fit.ts` have been removed.
- Vercel project: **`likesized`**, project ID `prj_ioYhiOjBNHDzPx2otiCY6XpNL3Um`, team `likesized-6817s-projects`.
- Production domains include **`https://likesized.com`** and `https://likesized.vercel.app`.
- Current application-code production checkpoint before this documentation/rules synchronization is canonical commit **`1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2`** (`Style standardized measurement controls and visual guides`). Vercel production deployment **`dpl_4HwXq2dmmzdyzPay64HYJxp6BPC6`** is READY on that application state.
- This 2026-08-20 master/rules synchronization was explicitly authorized by the owner for `main`; it is documentation/policy synchronization and does not represent additional product-feature completion.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY — ✅ COMPLETE
Canonical migration history, package lock, CI and zero-added-cost disposable replay established.

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY — ✅ COMPLETE
Atomic measurements/private size references, immutable versions, member-only identity and multi-user privacy/history tests complete.

## PHASE 2 — PEOPLE MY SIZE / MATCHING — ✅ COMPLETE
Overall/Tops/Bottoms rankings, coverage behavior and current-body recalculation verified. Owner kept V1 UI at Overall | Tops | Bottoms.

## PHASE 3 — CLOSET & FIT REPORT COMPLETION — ✅ COMPLETE
Controlled garment-specific Fit Reports, history-safe Closet editing/re-try-ons, exact Product reuse, photo/privacy invariants and full Closet lifecycle verified.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ✅ COMPLETE
Exact Variant, Product Fit Families, Similar Garments attributes/materials, all six evidence tiers and production recommendation-confidence calibration are complete and permanently tested. Final Phase 4 CI `32295755268` green; Security Advisor 0.

## OWNER CHECKPOINT AFTER PHASE 4 — ✅ RESOLVED
Dedicated Following Feed + Fit Twin activity notifications explicitly locked into V1. Follow graph explicitly locked as community-public to signed-in LikeSized members.

## PHASE 5 — FIT TWINS / FOLLOWING FEED / SOCIAL / SEARCH — ✅ COMPLETE

### 5.1 Follow/Fit Twin foundation — ✅ COMPLETE
- Canonical `follows` relationship reused by People My Size, `/twins`, member profiles and Fit-Twins outfit filter.
- No second friend/follow model.
- `fit_twin_follow_foundation.test.sql`: **14/14**.
- Owner decision: follow graph member-public; owner-only relationship changes; anonymous denied.
- CI `32297673470` green.

### 5.2 Dedicated Following Feed — ✅ COMPLETE
- `/following` uses canonical follows and a private activity ledger; no parallel social relationship/event system.
- Only `closet_shared`, `fit_report_added`, and `outfit_posted` are feed events. Likes never create activity.
- Private transitions/deletion remove unauthorized source activity; re-share creates fresh share activity without resurrecting old re-try-ons.
- `following_feed_activity.test.sql`: **25/25**.
- Final Phase 5.2 CI `32299715319` green; Security Advisor 0.

### 5.3 Fit Twin activity notifications — ✅ COMPLETE
- Migration `20260819205518_fit_twin_activity_notifications.sql`.
- In-app ON by default, global toggle, per-Twin mute, no likes/email/push, no backfill, privacy-safe source cascades.
- `/notifications`, header unread count, Settings global control, `/twins` mute/unmute.
- `fit_twin_activity_notifications.test.sql`: **48/48**.
- Final Phase 5.3 CI `32302356811` green; Security Advisor 0.

### 5.4 Social/outfit verification — ✅ COMPLETE
- Migration `20260819211614_atomic_outfit_post_creation.sql` makes selected-garment share + outfit post + tag creation transactional; app removes uploaded photo if RPC fails.
- All Outfits member-wide; Fit-Twins Outfits filtered by canonical follows; latest visible Fit Report used for tags; likes do not feed/notify; Private transitions hide garment evidence while independent outfit post may remain.
- `social_outfit_integration.test.sql`: **49/49**.
- Final Phase 5.4 CI `32303418989` green; Security Advisor 0.
- Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification — ✅ COMPLETE
- Migration `20260819212753_canonical_search_discovery_rpcs.sql` adds authenticated production search RPCs using canonical identity rather than a parallel search catalog.
- Catalog search covers product name, canonical brand, brand aliases, manufacturer style number, product identifiers, retailer identifiers, and listing title, deduplicated to canonical Product.
- Member search covers username/display name, excludes the viewer, remains authenticated-member-only, and returns no raw measurements.
- Search → member profile → follow → Shared Fit activity → Following Feed + Fit Twin notification loop is permanently exercised.
- `search_discovery_integration.test.sql`: **35/35 assertions**.
- Final corrected Phase 5.5 PR #30 / CI `32304787008` green; Security Advisor 0.

**Phase 5 exit criterion: ✅ MET.**

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — ▶️ IN PROGRESS

### 6.1 Remove fake/prototype homepage state — ✅ COMPLETE
- Removed fabricated member identities, demo garment activity and live-looking match percentages from `/`.
- Homepage uses static capability/explainer content linked to real canonical routes.

### 6.2 Remove dead prototype logic — ✅ COMPLETE
- Removed `lib/mock-data.ts` and obsolete standalone `lib/fit.ts`.
- README stale prototype claims removed.
- Verification PR #32 / CI `32306676280` passed canonical checks.

### 6.3 Production configuration + auth readiness — ✅ COMPLETE
Completed and verified:
- Vercel project connected to canonical repo `likesized/Likesized`.
- Production/Preview Supabase environment configuration connected.
- `likesized.com` connected and used as the production site/auth destination.
- Supabase Site URL and redirect allowlist configured for production and preview/local flows.
- Resend custom SMTP configured for LikeSized and `likesized.com` verified.
- Hosted confirmation template uses canonical `/auth/confirm` token-hash flow.
- Real signup confirmation email flow was completed end-to-end and landed on authenticated LikeSized onboarding.
- Password recovery/reset flow was completed end-to-end and returns the user to login with the password-updated confirmation.
- Existing-account repeated signup behavior routes into account recovery while preserving neutral user-facing messaging.
- Session behavior remains long-lived through Supabase refresh-token handling rather than an unnecessary custom timeout system.

Relevant completed commits include:
- `72bf20da511b63c9bb8f33887c8dafafc42d9c4c` — align signup redirect with SSR confirmation route.
- `aa90e9f64d414d284bdffe6772ce2def0d26e4c4` — record connected production configuration.
- `9b85b082f0a8985e47a0f6e43aeb0b31c65c49b5` — production site URL set to likesized.com checkpoint.
- `9007b8fef992e72d7e1236b097c425ad073432d1` + `625063a2432a74ad5a8c298c7ac07a1dd11d5fd8` — canonical password recovery flow.
- `03bea6665ad828c3b58ad527f44cc29a61a21981` — existing signup recovery behavior.

### 6.4 Responsive/accessibility + Fit Profile polish — ▶️ IN PROGRESS

#### Completed canonical work
- Canonical LikeSized brand assets wired into the site; header/logo updated.
- Homepage brand/copy refreshed and multiple mobile spacing/readability passes completed.
- Logged-out header account entry is **My Fit Profile** and routes through login.
- Signed-in mobile header was compacted to a Menu control so the header no longer overflows.
- Fit Profile headline changed to **Personalize LikeSized to fit your needs**.
- Privacy copy changed to: **Your measurements stay 100% private and help LikeSized make smarter fit matches and recommendations. The more information you provide, the more personalized your results become.**
- Precision section removed.
- Core Fit Profile heading moved above profile controls.
- Username UI label changed to **Display Name**.
- Core helper copy changed to: **Add only what you know right now. More details lead to better fit matches and recommendations. You can always update your profile measurements anytime.**
- Optional Advanced Measurements copy changed to: **Add more detailed measurements for even smarter fit matches. Fill in only what you know and come back anytime to add more or make changes.**
- `?` measurement-help dialog added to all body-measurement fields.
- Core/advanced display-name cleanup implemented, including Chest, Full Bust, High Bust, Natural Waist, Pants Waist, High Hip, Hips / Seat, Waist-to-Hip Length, Shoulder Width, Individual Shoulder Length, and Torso Length.
- **Individual Shoulder Length** wording is locked and must remain exactly that unless owner changes it.
- Overbust removed from active entry and excluded server-side during save.
- High Bust guide copy rewritten to distinguish upper chest from Full Bust.
- Imperial height entry standardized to **feet + whole inches dropdown (0–11)**, internally normalized to total inches.
- Every other imperial length measurement standardized to **whole inches + fraction dropdown (0, ¼, ½, ¾)**.
- Canonical hidden numeric value continues through the existing save path, e.g. `27 + ¼` → `27.25` inches.
- Server-side validation enforces whole inches for height and quarter-inch increments for other imperial length measurements so malformed/manual requests cannot bypass the UI format.
- Metric length entry remains centimeters; weight remains lb/kg numeric entry.
- Current application-code production checkpoint containing these measurement-entry changes is `1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2` and Vercel reports that production deployment READY.

#### Completed-update ledger — 2026-08-20
- `9499b4450033ab7a5b82d7e95e3944be576af8ad` — canonical public asset directory created.
- `11971e7b84611db4b787ea3d36c0a6b1c19e1db5` / `72725c0058ad763713607e021965bc9212e0a27d` — canonical LikeSized header/brand assets staged and wired.
- `d9f278897f156fb0a2c10c0de1c653af1fac4b50` through `fffe652e7a20b5681e70063bbb3f369471d4818f` — homepage brand/copy, spacing, mobile hero/proof-strip, grouping, and feature-card journey refinements.
- `54c0d54d5e42378a5f4f20f4dfb2a5bee1f47a40` / `a4c8f4085ada0d6ec9347de96e0c839b082128c1` — logged-out mobile/header account entry completed as My Fit Profile.
- `562ec8e52e598d9b13512f6204c403de1e32c363` — Fit Profile polish and measurement-help system added.
- `65440c75457c599b2e9991ef1c048f5c3b022c47` — imperial Fit Profile measurement entry standardized.
- `b34e6408190c9fdafde9a064744a56a1cae5d5b2` — canonical imperial measurement increment validation added.
- `1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2` — standardized measurement-control styling and current production checkpoint.

#### Explicitly NOT complete — audit-confirmed 2026-08-20
The following items must **not** be described as completed until canonical source and verification prove otherwise:

1. **Approved measurement-guide image replacement.**
   - Natural Waist, High Hip, Hips / Seat, and Waist-to-Hip Length are mapped to the waist/hip guide type, but the canonical renderer still produces the old coded graphic rather than the owner-approved shared four-measurement image.
   - Torso Girth is mapped to its guide type, but the canonical renderer still produces the old inline SVG rather than the owner-approved front/back magenta image.
   - General body measurement guides still use the old coded stick-figure `BodyDiagram` renderer rather than the approved unisex body silhouette.
   - `public/` currently contains the brand assets only; approved measurement-guide assets are not yet canonical repository assets.
   - Commit `d4ed1681aa683e4c26a7b9ba330e7e6c059c1d16` was an attempted guide update, but audit proved the approved artwork was not actually the resulting canonical implementation. It is **not** a completed approved-image replacement.
   - Required fix: add the approved assets canonically, wire exact measurement-to-asset mappings, and delete obsolete fallback renderers so the old artwork cannot return.

2. **Mobile menu auto-close behavior.**
   - Current signed-in mobile menu is a plain `<details>` implementation.
   - It does not automatically close after route navigation, outside tap, or Escape.
   - Required fix: canonical mobile menu behavior must close on navigation, outside interaction, and Escape without creating parallel header implementations.

3. **iPhone Safari form-focus zoom.**
   - Global form controls do not yet have a mobile minimum 16px font size.
   - Display Name and other small-font inputs can trigger Safari focus zoom that remains after entry.
   - Required fix: mobile form inputs/selects/textareas must use at least 16px font sizing without disabling pinch zoom/accessibility.

4. **Measurement-by-measurement review is not finished.**
   - After the three implementation blockers above are corrected and verified, resume at **Individual Shoulder Length**.

### 6.4 current verification rule
No Phase 6.4 item is complete solely because artwork/code was generated or a commit message says it was applied. Completion requires the canonical source to contain the intended implementation and verification to confirm the correct behavior/result.

**Phase 6 exit:** no fake live state, no dead prototype path competing with canonical logic, production auth/environment configuration is complete, and primary V1 flows are responsive/accessibility-ready with approved Fit Profile measurement guidance in canonical source.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

## Exact next action
**PHASE 6.4 — complete the three audit-confirmed blockers in canonical source without patches: (1) replace/remove the old measurement-guide renderers with the exact owner-approved assets and mappings, (2) make the signed-in mobile menu close correctly after navigation/outside interaction/Escape, and (3) prevent iPhone Safari input-focus zoom with accessible mobile form-control sizing. Verify the measurement save/load path still works. Do not deploy production without explicit owner authorization. After those fixes are verified, resume the measurement audit at Individual Shoulder Length.**
