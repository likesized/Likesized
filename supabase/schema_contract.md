# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for database architecture and executable history. Ordered SQL in `supabase/migrations/` is the authoritative replay/deployment history. `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only.

The canonical directory contains all **28 migrations** recorded by the connected project, from `20260819132934_initial_likesized_schema.sql` through `20260819205518_fit_twin_activity_notifications.sql`.

Do not rewrite applied migrations. Future database changes are new ordered executable migrations. No alternate current-state schema files, patch migrations, fixed/v2 copies, or parallel database implementations.

## Locked current-state contract
- `profiles`: completed member identity readable to authenticated LikeSized members only; anonymous SELECT revoked.
- `fit_profiles`, `body_measurements`, `user_size_references`: current Fit Profile shell plus owner-private raw body/size-reference state.
- immutable Fit Profile version tables: owner-private historical body state.
- `fit_reports.fit_profile_version_id`: immutable try-on body-state association; multiple reports may exist per Closet item.
- `fit_report_dimensions`: controlled garment-specific responses with DB garment/dimension validation.
- current-person matching RPCs return safe current scores/coverage only; historical product/Fit Report matching uses immutable snapshots.
- product evidence is unique-wearer capped and ranked Exact Variant 1 → Exact Product 2 → Product Family 3 → Similar Garments 4 → Brand + Garment Type 5 → Category Fit 6.
- Product Fit Families are intentional same-fit/cut groups with compatibility enforcement; Similar Garments uses controlled construction/material attributes.
- Private Closet items remain owner-only; Shared items/reports are member-readable under RLS. Fit/reference photos may exist only while the Closet item is Shared.
- `follows`: canonical Fit Twin relationship. Signed-in LikeSized members may read the community follow graph; only `auth.uid() = follower_id` may insert/delete. Anonymous users have no SELECT grant.
- `private.following_activity_events`: private canonical activity ledger containing only meaningful V1 Following Feed source references: `closet_shared`, `fit_report_added`, and `outfit_posted`. Authenticated clients have no direct table access.
- activity triggers record the first Fit Report on an already-Shared garment as `closet_shared`, later Shared Fit Reports as `fit_report_added`, and new outfit posts as `outfit_posted`. Likes do not create activity.
- when a Closet item becomes Private, its garment activity ledger rows are removed. Re-sharing creates one fresh `closet_shared` event from the latest Fit Report rather than resurrecting old re-try-on activity. Deleting source Closet/outfit records cascades corresponding activity.
- `public.get_following_feed(integer,timestamptz)` is a SECURITY INVOKER wrapper over `private.get_following_feed_for_current_user`. The private helper is auth-bound, reads only the current viewer's canonical follows, re-checks current source visibility/existence, and returns safe activity/product/Fit Report/outfit fields. No raw body data is stored or returned.
- `private.fit_twin_activity_notification_preferences`: private owner global preference. Missing row means Fit Twin activity notifications are enabled by default.
- `private.fit_twin_notification_mutes`: private per-active-follow mute state keyed by `(follower_id, followed_id)` and cascading when the canonical follow is deleted.
- `private.fit_twin_activity_notifications`: private recipient notification rows referencing the canonical Following Feed activity ledger. Notification creation is fanned out only to current followers whose global setting is enabled and who have not muted that Fit Twin.
- global notification off, per-Twin mute and unfollow suppress future notifications only; they do not modify the Following Feed or erase already-valid prior notifications. Re-enable/refollow does not backfill missed activity.
- because recipient notifications reference canonical activity with `ON DELETE CASCADE`, making a garment Private or deleting source Closet/outfit content removes the corresponding existing notifications. No stale notification may preserve access to Private/deleted source content.
- notification preference/mute/recipient tables have no direct authenticated client read/write grants. Public notification RPCs are SECURITY INVOKER wrappers over narrow private auth-bound helpers: `get_fit_twin_notification_settings`, `set_fit_twin_activity_notifications`, `get_fit_twin_notification_mutes`, `set_fit_twin_notification_mute`, `get_fit_twin_activity_notifications`, `get_fit_twin_notification_unread_count`, and `mark_fit_twin_notifications_read`.
- Fit Twin activity notifications are in-app only in V1. Likes do not generate notifications. No email or phone-push delivery exists in the V1 notification architecture.

## Canonical verification contract
CI replays the complete migration directory on a disposable local Supabase database, runs the production TypeScript recommendation calibration, and runs pgTAP under `supabase/tests/`.

Key suites include:
- `fit_profile_behavior.test.sql`
- `fit_profile_privacy_rls.test.sql`
- `fit_profile_history_integrity.test.sql`
- `people_my_size_matching.test.sql`
- `fit_report_dimensions.test.sql`
- `closet_integration_privacy.test.sql` — **32 assertions**
- `product_evidence_variant_targeting.test.sql` — **12 assertions**
- `product_family_evidence.test.sql` — **11 assertions**
- `similar_garment_attributes.test.sql` — **10 assertions**
- `product_evidence_full_hierarchy.test.sql` — **18 assertions**
- `fit_twin_follow_foundation.test.sql` — **14 assertions**
- `following_feed_activity.test.sql` — **25 assertions** verifying the safe RPC against Private/Shared transitions, first-share/re-try-on/outfit events, like exclusion, follow/unfollow filtering, re-share behavior, source deletion, anonymous denial, and private-ledger denial.
- `fit_twin_activity_notifications.test.sql` — **48 assertions** verifying default-on behavior, global toggle, per-Twin mute, no backfill, like exclusion, unread/read state, unfollow/refollow semantics, Following Feed independence, source privacy/deletion cleanup, anonymous denial, and private notification/preference/mute table denial.

`tests/recommendation-confidence.test.ts` calls production `recommendSize()` directly with **9 calibration cases**.

Phase 5.3 final UI/foundation CI **`32302356811`** passed npm install, typecheck, recommendation calibration, production build including `/notifications`, fresh replay of all **28 migrations** and every canonical database suite. Supabase Security Advisor after Phase 5.3: **0 findings**.

Do not add fixed measurement columns back to `fit_profiles`; blend current-person scores with historical garment evidence; count repeated observations as multiple wearers; fuzzy-group Product Families; expose raw body data through social activity or notifications; allow anonymous profile/follow/feed/notification discovery; reintroduce a private fit-photo state; or add Fit Twin activity email/phone push without an explicit future product decision and canonical implementation.