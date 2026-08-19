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
15. **Fit Twin activity notifications are V1 and are in-app only.** Future Fit Twin activity alerts are ON by default. Members have one global on/off control plus per-Fit-Twin mute. Global off/mute does not change the Following Feed. Alerts use the same three meaningful activity types as the Following Feed; likes never alert. V1 sends no Fit Twin activity email or phone push. Global off, mute, or unfollow prevents future alerts without deleting already-valid prior alerts; re-enable/refollow does not backfill missed alerts. Unfollow clears that relationship's mute so refollow starts unmuted, subject to the global setting. If underlying Shared content becomes Private or is deleted, its existing notification is removed with the source activity.
16. **Fit Twin/follow relationships are community-public within LikeSized.** Any signed-in member may see who follows whom; only the follower can change their relationship. Anonymous visitors cannot query the graph.
17. Outfit posting may intentionally auto-share tagged Private Closet garments, but that share/post/tag operation must be atomic. A failed outfit post cannot leave a previously Private garment Shared. If a tagged garment is later made Private, its garment tag/fit evidence disappears from other members while the independent outfit social post may remain visible.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application population; verification uses disposable local Supabase CI.
- **29 canonical migrations** through `20260819211614_atomic_outfit_post_creation.sql`.
- Supabase Security Advisor: **0 findings** after Phase 5.4.
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

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ✅ 100% COMPLETE
Exact Variant, Product Fit Families, Similar Garments attributes/materials, all six evidence tiers and production recommendation-confidence calibration are complete and permanently tested. Final Phase 4 CI `32295755268` green; Security Advisor 0.

## OWNER CHECKPOINT AFTER PHASE 4 — ✅ RESOLVED
Dedicated Following Feed + Fit Twin activity notifications explicitly locked into V1. Follow graph explicitly locked as community-public to signed-in LikeSized members.

## PHASE 5 — FIT TWINS / FOLLOWING FEED / SOCIAL / SEARCH — ▶️ IN PROGRESS

### 5.1 Existing follow/Fit Twin foundation — ✅ COMPLETE
- Existing People My Size, `/twins`, member profiles and Fit-Twins outfit filter all use canonical `follows`.
- No second friend/follow model.
- `fit_twin_follow_foundation.test.sql`: **14/14**.
- Owner decision: follow graph member-public; owner-only relationship changes; anonymous denied.
- PR #22 / CI `32297673470` green.

### 5.2 Dedicated Following Feed — ✅ COMPLETE
- Protected `/following` route added and linked from signed-in navigation.
- Feed uses canonical `follows` and one private activity ledger; no parallel social relationship/event system.
- Migration `20260819202515_following_feed_activity_foundation.sql` adds only three meaningful event types: `closet_shared`, `fit_report_added`, `outfit_posted`.
- First Fit Report on an already-Shared Closet item creates the Shared-garment event; later reports create re-try-on events. Likes never create activity.
- Shared→Private removes that garment's activity rows. Private→Shared creates one fresh share event from the latest report; old re-try-on activity does not resurrect. Source deletion cascades activity.
- Migration `20260819202851_harden_following_feed_rpc_boundary.sql` uses public SECURITY INVOKER wrapper → private auth-bound SECURITY DEFINER helper. Security Advisor returned to **0 findings**.
- Safe feed RPC rechecks canonical follow membership and current source visibility/existence and never stores/returns raw body measurements.
- Feed cards show current Overall/Tops/Bottoms relationship context when calculable, Shared garment size/fit/notes/product links, or outfit photo/caption. Current match context remains separate from historical garment evidence.
- `following_feed_activity.test.sql`: **25/25** safe-API assertions.
- Final Phase 5.2 PR #25 / CI `32299715319` passed typecheck, recommendation calibration, production build including `/following`, clean replay of all **27 migrations**, and every database suite.

### 5.3 Fit Twin activity notifications — ✅ COMPLETE
- Owner locked V1 behavior: in-app notifications ON by default for future Fit Twin activity; one global Settings toggle; per-Fit-Twin mute; no likes; no email or phone push.
- Migration `20260819205518_fit_twin_activity_notifications.sql` adds private owner preferences, private per-follow mute state, and recipient notification rows linked to the canonical Following Feed activity ledger. No duplicate event system exists.
- Fanout occurs only to current followers who are globally enabled and not muted for that Fit Twin.
- Global off, per-Twin mute and unfollow suppress future notifications only; they do not alter the Following Feed or delete already-valid existing notifications. Re-enable/refollow does not backfill missed alerts.
- Per-Twin mute is tied to the canonical follow relationship and cascades on unfollow, so a later refollow starts unmuted subject to the global setting.
- Because notification rows reference canonical activity rows, making a source garment Private or deleting source Closet/outfit content removes the corresponding existing notifications automatically.
- Private notification/preference/mute tables are not directly client-readable; authenticated UI uses narrow public SECURITY INVOKER wrappers over private auth-bound helpers.
- `/notifications` provides unread/new state, mark-one-read and mark-all-read, safe activity context and links. Signed-in header shows unread count.
- `/settings` exposes the global Fit Twin activity toggle and explicitly states V1 is in-app only. `/twins` exposes Mute/Unmute without changing the follow relationship or Following Feed.
- `fit_twin_activity_notifications.test.sql`: **48/48 assertions**.
- Final Phase 5.3 PR #27 / CI **`32302356811`** passed npm install, typecheck, recommendation calibration, production build including `/notifications`, clean replay of all **28 migrations**, and every canonical database suite.
- Supabase Security Advisor after Phase 5.3: **0 findings**.

### 5.4 Existing social surfaces verification — ✅ COMPLETE
- Re-audited Shared Fit History, outfit creation, garment auto-sharing, outfit likes, All/Fit-Twins outfit feed, latest visible Fit Report tags, Following Feed and notification interactions.
- Found and fixed a correctness/privacy failure path in the old multi-request outfit action: selected Private Closet items were being changed to Shared before photo/post/tag creation finished, so a later failure could leave them Shared without a successful outfit.
- Migration `20260819211614_atomic_outfit_post_creation.sql` adds `public.create_outfit_post(...)`, a SECURITY INVOKER transaction that validates 1–6 unique owned Closet garments with Fit Reports, atomically shares them, creates the outfit post, and creates tags. The app uploads the owner-scoped photo first and removes it if the database transaction fails.
- Successful outfit tagging still intentionally auto-shares selected Private garments. Auto-sharing can generate the locked newly-Shared-garment activity plus the outfit activity; likes generate neither Following Feed events nor notifications.
- All Outfits remains member-wide. Fit-Twins Outfits filters through the canonical `follows` relationship only.
- Outfit tags intentionally display the latest visible Fit Report observation for each tagged garment.
- When a tagged garment later becomes Private, other members lose Closet/Fit Report/tag access and garment feed/notification events are removed, while the independent outfit post and its likes may remain visible. Deleting the outfit cascades its tags, likes, outfit activity and source-linked notifications.
- `social_outfit_integration.test.sql`: **49/49 assertions**, including the failed-post rollback that proves a Private garment remains Private when outfit creation fails.
- Final Phase 5.4 PR #28 / CI **`32303418989`** passed npm install, typecheck, recommendation calibration, production build, clean replay of all **29 migrations**, and every canonical database suite.
- Supabase Security Advisor after Phase 5.4: **0 findings**.
- Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification — ▶️ NEXT
Re-test representative member/brand/product search and the People My Size/search/profile → follow → Following Feed loop.

**Phase 5 exit:** following stable; Following Feed exposes only authorized meaningful Shared activity; current context remains distinct from historical evidence; activity notifications obey the same privacy rules; existing social/search surfaces remain green.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — QUEUED
Replace homepage mock match data, remove dead prototype logic, configure production auth/Vercel environment settings, and run mobile/responsive/accessibility review. No production deploy without owner authorization.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

## Exact next action
**PHASE 5.5 — re-test representative member, brand and product search and verify the People My Size/search/member profile → follow → Following Feed/notifications loop without creating another discovery or relationship system.**