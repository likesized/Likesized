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
15. **Fit Twin activity notifications are V1.** Exact default/quieting behavior is the next owner decision.
16. **Fit Twin/follow relationships are community-public within LikeSized.** Any signed-in member may see who follows whom; only the follower can change their relationship. Anonymous visitors cannot query the graph.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application population; verification uses disposable local Supabase CI.
- **27 canonical migrations** through `20260819202851_harden_following_feed_rpc_boundary.sql`.
- Supabase Security Advisor: **0 findings** after the hardened Following Feed RPC.
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

### 5.3 Fit Twin activity notifications — ▶️ NEXT / OWNER DECISION REQUIRED
Build in-app notification support from the same canonical activity ledger and privacy rules as the Following Feed. No duplicate event system. Before implementation, lock the default/quieting UX: whether activity notifications are on by default, and whether V1 supports a global toggle, per-Fit-Twin mute, or both.

### 5.4 Existing social surfaces verification — QUEUED
Re-test Shared Fit History, outfit creation/auto-sharing, outfit likes, All/Fit-Twins outfit feed and interaction with Following Feed. Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification — QUEUED
Re-test representative member/brand/product search and the People My Size/search/profile → follow → Following Feed loop.

**Phase 5 exit:** following stable; Following Feed exposes only authorized meaningful Shared activity; current context remains distinct from historical evidence; activity notifications obey the same privacy rules; existing social/search surfaces remain green.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — QUEUED
Replace homepage mock match data, remove dead prototype logic, configure production auth/Vercel environment settings, and run mobile/responsive/accessibility review. No production deploy without owner authorization.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

## Exact next action
**PHASE 5.3 OWNER DECISION — lock V1 Fit Twin activity-notification defaults/quieting controls, then implement notifications from the existing canonical Following Feed activity ledger.**