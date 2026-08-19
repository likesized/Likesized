# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the **one and only LikeSized roadmap, status record, phase checklist, and AI handoff**. Repository policy lives in `AI_REPOSITORY_RULES.md`; product architecture lives in `docs/V1_PRODUCT_SPEC.md`; database/privacy behavior lives in `supabase/schema_contract.md`. If old planning text conflicts with this guide, this guide wins and stale planning text must be removed.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations. Approved changes modify canonical source; Git history is history.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Do not deploy production unless the owner explicitly authorizes it.
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

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application population; repeatable verification uses disposable local Supabase CI.
- **30 canonical migrations** through `20260819212753_canonical_search_discovery_rpcs.sql`.
- Supabase Security Advisor: **0 findings** after Phase 5.5 search architecture.
- CI runs npm ci, typecheck, production recommendation calibration, production build, fresh migration replay and all pgTAP suites.

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
- Migrations `20260819202515_following_feed_activity_foundation.sql` and `20260819202851_harden_following_feed_rpc_boundary.sql`.
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
- Found/fixed non-atomic outfit auto-share failure path.
- Migration `20260819211614_atomic_outfit_post_creation.sql` makes selected-garment share + outfit post + tag creation transactional; app removes uploaded photo if RPC fails.
- All Outfits member-wide; Fit-Twins Outfits filtered by canonical follows; latest visible Fit Report used for tags; likes do not feed/notify; Private transitions hide garment evidence while independent outfit post may remain.
- `social_outfit_integration.test.sql`: **49/49**.
- Final Phase 5.4 CI `32303418989` green; Security Advisor 0.
- Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification — ✅ COMPLETE
- Migration `20260819212753_canonical_search_discovery_rpcs.sql` adds authenticated SECURITY INVOKER production search RPCs rather than another catalog/index system.
- `/search` now uses `search_catalog_products` and `search_members` for queried discovery.
- Catalog search covers product name, canonical brand, brand aliases, manufacturer style number, product identifiers (SKU/UPC/barcode), retailer product ID/SKU, and listing title; results deduplicate to one canonical Product and return its canonical slug/brand.
- Member search covers username/display name, excludes the current viewer, remains authenticated-member-only, and returns no raw measurements.
- Search/People My Size → member profile → canonical follow → new Shared Fit activity → Following Feed + Fit Twin notification loop is permanently exercised.
- `search_discovery_integration.test.sql`: **35/35 assertions**.
- Final corrected Phase 5.5 PR #30 / CI **`32304787008`** passed npm install, typecheck, recommendation calibration, production build, clean replay of all **30 migrations**, and every canonical database suite.
- Supabase Security Advisor after Phase 5.5: **0 findings**.

**Phase 5 exit criterion: ✅ MET.** Following, Following Feed, notifications, existing social/outfit surfaces, and search/discovery all operate on canonical relationships/evidence with privacy boundaries intact.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — ▶️ NEXT

### 6.1 Remove fake/prototype homepage state
Replace homepage mock match/product/member state with real database-backed or clearly static non-fake content. No fabricated live match percentages or user activity may remain.

### 6.2 Remove dead prototype logic
Remove `lib/mock-data.ts` after all usage is gone. Audit `lib/fit.ts` and other old prototype helpers; remove only if truly unused. No parallel implementations.

### 6.3 Production configuration readiness
Verify/configure `NEXT_PUBLIC_SITE_URL`, Supabase Site URL/redirect allowlist/email confirmation behavior, and required Vercel environment variables. Do **not** deploy production without explicit owner authorization.

### 6.4 Responsive/accessibility review
Run mobile/responsive/accessibility review across V1 primary flows and correct blockers in canonical source.

**Phase 6 exit:** no fake live state, no dead prototype path competing with canonical logic, production auth/environment configuration is ready, and primary V1 flows are responsive/accessibility-ready. Production remains undeployed until owner explicitly authorizes it.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

## Exact next action
**PHASE 6.1 — audit and replace homepage mock/fabricated live state with real database-backed or clearly static non-fake content, then remove the canonical mock-data dependency before proceeding to other Phase 6 work.**