# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for database architecture and executable history. Ordered SQL in `supabase/migrations/` is the authoritative replay/deployment history. `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only.

Do not rewrite applied migrations. Future database changes are new ordered executable migrations. No alternate current-state schema files, patch migrations, fixed/v2 copies, or parallel database implementations.

This file describes **database behavior**, not product-roadmap order. Product meaning is owned by `docs/V1_PRODUCT_SPEC.md` and owner decisions/status by `docs/AI_MASTER_LOG.md`. Legacy table/function/test names may remain after a product terminology change; when they do, this contract must call that out explicitly instead of treating the old name as current product semantics.

## Locked current-state contract
- `profiles`: completed member identity readable to authenticated LikeSized members only; anonymous SELECT revoked.
- `fit_profiles`, `body_measurements`, `user_size_references`: current Fit Profile shell plus owner-private raw body/size-reference state.
- Immutable Fit Profile version tables preserve owner-private historical body state.
- `fit_reports.fit_profile_version_id` preserves immutable try-on body-state association; multiple reports may exist per Closet item.
- `fit_report_dimensions` stores controlled garment-specific responses with DB garment/dimension validation.
- Current-person matching RPCs return safe current scores/coverage only; historical Product/Fit Report matching uses immutable snapshots.
- Product evidence is unique-wearer capped and ranked **Exact Variant 1 → Exact Product 2 → Product Family 3 → Similar Garments 4 → Brand + Garment Type 5 → Category Fit 6**.
- Product Fit Families are intentional compatible same-fit/cut groups. Recommendation/product evidence must not fuzzy-group unrelated Products.
- Private Closet items remain owner-only; Shared items/reports are member-readable under RLS. Fit/reference photos may exist only while the Closet item is Shared.

## Following vs Fit Twin — product semantics over legacy naming
- `follows` is the **canonical Following relationship**: `follower_id → followed_id`.
- Signed-in LikeSized members may read the community follow graph; only `auth.uid() = follower_id` may insert/delete their own relationship. Anonymous users have no SELECT grant.
- **`follows` does not mean “Fit Twin.”** Fit Twin is a system-derived strong-match designation from current-person matching and is not stored as a second social relationship graph.
- Do not create a `fit_twin_follow`, saved-Fit-Twin table, or other duplicate relationship system.
- Existing migrations, private tables, functions or tests containing `fit_twin` in their names are **legacy implementation naming** from the earlier product model. Until the dedicated social cleanup migrates/renames them safely, their relationship semantics are Following-based; the old identifier does not make followed members Fit Twins.

## Following activity / Style Feed foundation
- `private.following_activity_events` is the private canonical followed-person activity ledger with `closet_shared`, `fit_report_added`, and `outfit_posted` source events.
- Authenticated clients have no direct table access; likes never create activity.
- Shared→Private removes garment activity; re-share creates fresh share activity from the latest eligible Fit Report; source deletion cascades activity.
- `public.get_following_feed(integer,timestamptz)` is a SECURITY INVOKER wrapper over a private auth-bound helper that re-checks current follows and current source visibility/existence and never returns raw body data.
- Product/UI terminology for this content is **Style Feed** according to the current master. Eligibility is driven by Following; Fit Twin status alone does not subscribe content.

## Followed-person notification foundation
- Existing notification preference/mute/recipient tables and functions may retain Fit-Twin-era names until the dedicated canonical cleanup.
- Their relationship basis is the existing `follows` graph; they must not create a second Fit Twin graph.
- Missing global preference currently means ON by default under the existing implementation.
- Global notification off, per-person mute and unfollow suppress future eligible notifications only; they do not alter Style Feed history or create backfill on re-enable/refollow.
- Unfollow clears relationship-specific mute state where the current implementation requires it.
- Source privacy/deletion must remove notification exposure tied to unavailable content.
- Public notification functions are narrow SECURITY INVOKER wrappers over private auth-bound helpers.
- V1 sends no followed-person activity email or phone push unless a later owner decision changes that.

## Outfit foundation
- `outfit_posts` are authenticated-member-readable social posts.
- `outfit_post_items` are readable only while linked Closet evidence is Shared.
- `outfit_likes` has one like per `(post_id,user_id)`; only the liker may insert/delete their own like; post deletion cascades likes.
- `public.create_outfit_post(uuid,text,text,uuid[])` is the canonical SECURITY INVOKER transaction requiring an authenticated completed member, owner-scoped photo path, 1–6 unique owned Closet garments and Fit Report evidence for each; it atomically shares selected garments, creates the Outfit and creates tag links.
- Outfit Likes contribute to creator Style Likes at the product layer; garment/product Likes are a separate concept.
- Fit Twin status alone must not drive Outfit subscription; followed-person Outfit activity comes through the Following/Style Feed relationship.

## Search foundation
- `public.search_catalog_products(text,integer)` is authenticated-only SECURITY INVOKER catalog discovery over canonical Product/Brand/identifier/listing data.
- Product results deduplicate to one canonical Product rather than one result per wearer/Fit Report.
- `public.search_members(text,integer)` is authenticated-only SECURITY INVOKER member discovery over member-readable username/display name, excludes the current viewer, and returns no raw measurements/private size references.
- Search RPCs do not create a duplicate catalog, duplicate member index, duplicate social graph or raw-data exposure path.

## Recommendation / Help Me Size It foundation
- Production `lib/recommendation.ts::recommendSize()` is the single current application recommendation-confidence implementation.
- Current evidence levels are `exact_variant`, `exact_product`, `product_family`, `similar_garments`, `brand_garment_type`, and `category_fit`.
- Brand sizing tendency is therefore derived from accumulated LikeSized evidence at **Brand + Garment Type** level; there is no separate generic database of unsupported “Brand X runs small/large” claims.
- **Help Me Size It must reuse this canonical recommendation architecture.** No separate fallback sizing engine/table is authorized.
- Recommendation output must remain confidence-gated; absence of sufficient evidence must result in no recommendation rather than a fabricated size.

## Fit Result / retired star UI
- The controlled `fit_reports.fit` outcome remains current evidence for Too Small / Snug / Just Right / Relaxed / Too Big.
- **There is no current V1 1–5-star Fit Rating user interface.** Dormant/legacy schema created during earlier rating work must not be treated as a live product requirement merely because it still exists.
- Do not drop historical fields/data during unrelated work. Any schema cleanup/rename is a deliberate migration with tests.
- Existing `would_buy_again` evidence may remain available to the recommendation engine until its dedicated product audit; it is not a public star-rating replacement by default.

## Material / stretch implementation debt
- Existing schema/migrations may contain garment construction/material/stretch attribute definitions created before the current product decision.
- Current V1 product rule is: reliable manufacturer/product-source material may remain background data; members do not enter/verify it and it is not a Browse filter.
- **Current V1 does not collect, classify or infer stretch.** Existing stretch-related schema rows are dormant/legacy support until deliberately cleaned; do not expose them merely because the columns/options exist.

## Canonical verification contract
CI must replay the complete current migration directory on a disposable local Supabase database and run relevant production recommendation, build, privacy and pgTAP suites.

Core suites currently include Fit Profile behavior/privacy/history, People My Size matching, Fit Report dimensions, Closet privacy, product evidence hierarchy/variant/family/similar-garment behavior, Following/feed/notification behavior, Outfit integration and Search discovery tests.

When product semantics change without an immediate database rename (for example Following vs legacy Fit-Twin identifiers), tests may temporarily retain old filenames/function names for migration compatibility, but their assertions and this contract must reflect the current intended behavior. Rename/refactor them only in the dedicated canonical cleanup; do not duplicate them.

Do not add fixed measurement columns back to `fit_profiles`; blend current-person scores with historical garment evidence; count repeated observations as multiple wearers; expose raw body data through social/search/notifications; allow anonymous member/follow/feed/notification discovery; reintroduce a private fit-photo state; create a second sizing engine; create a second social graph; or infer current product semantics from a stale legacy identifier.