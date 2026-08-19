# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for database architecture and executable history. Ordered SQL in `supabase/migrations/` is the authoritative replay/deployment history. `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only.

The canonical directory contains all **30 migrations** recorded by the connected project, from `20260819132934_initial_likesized_schema.sql` through `20260819212753_canonical_search_discovery_rpcs.sql`.

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
- `private.following_activity_events`: private canonical Following Feed ledger with only `closet_shared`, `fit_report_added`, and `outfit_posted`. Authenticated clients have no direct table access; likes never create activity.
- Shared→Private removes garment activity; re-share creates fresh share activity from the latest Fit Report; source deletion cascades activity.
- `public.get_following_feed(integer,timestamptz)` is a SECURITY INVOKER wrapper over a private auth-bound helper that re-checks current canonical follows and source visibility/existence and never returns raw body data.
- Fit Twin notification preferences, per-follow mutes, and recipient notification rows live in private tables. Missing global preference means ON by default. Notification fanout uses canonical Following Feed activity and only current eligible followers.
- Global notification off, per-Twin mute and unfollow suppress future notifications only; they do not modify the Following Feed or erase still-valid prior notifications. Re-enable/refollow does not backfill missed activity; unfollow clears the relationship-specific mute.
- Notification rows reference canonical activity with cascade, so source privacy/deletion removes corresponding existing notifications. Public notification functions are SECURITY INVOKER wrappers over narrow private auth-bound helpers. V1 sends no Fit Twin activity email or phone push.
- `outfit_posts` are authenticated-member-readable social posts. `outfit_post_items` are readable only while linked Closet evidence is Shared. A garment may later become Private without deleting the independent outfit post.
- `outfit_likes` has one like per `(post_id,user_id)`; only the liker may insert/delete their own like; post deletion cascades likes.
- `public.create_outfit_post(uuid,text,text,uuid[])` is the canonical SECURITY INVOKER transaction requiring an authenticated completed member, owner-scoped photo path, 1–6 unique owned Closet garments and Fit Report evidence for each; it atomically shares selected garments, creates the outfit and creates tag links. Any DB failure rolls back sharing/post/tag state. The app removes the prior uploaded photo if the transaction fails.
- `public.search_catalog_products(text,integer)` is authenticated-only SECURITY INVOKER catalog discovery. It searches canonical Product names, canonical Brand names, Brand aliases, manufacturer style numbers, `product_identifiers` (including SKU/UPC/barcode), retailer product IDs/SKUs and retailer listing titles; punctuation/case normalization is applied internally and results deduplicate to one canonical Product with its canonical slug/brand display identity.
- `public.search_members(text,integer)` is authenticated-only SECURITY INVOKER member discovery over member-readable username/display name. It excludes `auth.uid()`, is case-insensitive and returns only member identity fields—never raw measurements/private size references.
- Search RPCs do not expose the intentionally non-public general normalizer helper functions and do not create a duplicate search catalog, member index or follow system.

## Canonical verification contract
CI replays the complete migration directory on a disposable local Supabase database, runs production recommendation calibration, production build, and pgTAP under `supabase/tests/`.

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
- `following_feed_activity.test.sql` — **25 assertions**
- `fit_twin_activity_notifications.test.sql` — **48 assertions**
- `social_outfit_integration.test.sql` — **49 assertions**
- `search_discovery_integration.test.sql` — **35 assertions** covering product/brand/alias/style/SKU/UPC/retailer/listing-title discovery, member username/display-name discovery, self/raw-data privacy boundaries, People My Size reachability, canonical follow creation, and searched-member Shared activity reaching Following Feed + Fit Twin notifications.

`tests/recommendation-confidence.test.ts` calls production `recommendSize()` directly with **9 calibration cases**.

Final Phase 5 corrected CI **`32304787008`** passed npm install, typecheck, recommendation calibration, production build, fresh replay of all **30 migrations**, and every canonical database suite. Supabase Security Advisor after Phase 5.5: **0 findings**.

Do not add fixed measurement columns back to `fit_profiles`; blend current-person scores with historical garment evidence; count repeated observations as multiple wearers; fuzzy-group Product Families; expose raw body data through social/search/notifications; allow anonymous member/follow/feed/notification discovery; reintroduce a private fit-photo state; add Fit Twin activity email/phone push without an explicit future decision; reintroduce non-atomic outfit auto-sharing; or create a second catalog/member/follow system for search.