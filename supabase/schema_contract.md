# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Do not rewrite applied migrations.
- Future DB changes use new ordered migrations.
- Do not hard-code a migration count as architectural truth. The current set is the ordered files actually present in the canonical directory.
- `supabase/schema.sql` is retired and must not be used as an alternate current-state schema.
- `supabase/storage.sql` may remain a reference/storage aid only where consistent with migrations; it never overrides migration history.

This contract owns database behavior/privacy, not product roadmap order. Product meaning is owned by `docs/V1_PRODUCT_SPEC.md`; status/recovery is owned by `docs/AI_MASTER_LOG.md`.

## Recovery note
The production baseline at recovery start is `main` commit `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`.

Owner-approved Fit Match work exists on preserved PR #36 / `fit-match-engine-audit` head `fcf87fa1782f2ed704a4856c99487900b1445db5`. Those migrations/functions/tests are not considered recovered/current on the canonical recovery line until their files are deliberately reapplied and verification passes. See the master salvage ledger.

## Current baseline architecture
- `profiles` stores member identity; anonymous identity discovery is not allowed where current RLS/grants revoke it.
- `fit_profiles` is a profile shell; raw body values belong in normalized owner-private measurement structures created by ordered migrations.
- immutable Fit Profile version tables preserve historical owner-private body state.
- `fit_reports.fit_profile_version_id` preserves try-on body-state association; later current-body edits do not rewrite old evidence.
- `garment_types`, `garment_attribute_definitions`, and `garment_attribute_options` hold the database vocabulary used by the one controlled application taxonomy; server validation additionally enforces which zero-to-four questions/options belong to each specific Type. `garment_types.intake_active` is the member-facing Type allowlist. The established `active` flag remains the matching/historical compatibility boundary so adding intake Types cannot disable calibrated legacy keys or historical Products.
- `color_families` stores the approved controlled member-facing color list. `product_variants.color_family_key` stores its filterable family; exact trustworthy manufacturer color/wash wording remains separate in `color_label`.
- `fit_reports.reported_condition` preserves New / Used / Altered. New and Used map to the canonical normal-evidence boundary; Altered remains excluded from normal-product recommendation evidence.
- current-person matching RPCs return safe derived scores/coverage only; raw body measurements remain private.
- historical Product/Fit Report matching uses immutable snapshots.
- Private Closet items remain owner-only; Shared evidence is member-readable only under the current RLS rules.
- fit/reference photos may exist only under the Shared evidence rule.

## Following vs Fit Twin — product semantics over legacy identifiers
- `follows` is the one canonical **Following** relationship: `follower_id → followed_id`.
- Only the follower controls creation/removal of their relationship under the existing RLS/functions.
- **`follows` does not mean Fit Twin.** Fit Twin is a system-derived strong-match designation from current-person matching. The product-wide threshold starts at 85% Overall Match and is read from the singleton `fit_twin_settings` row so calibration does not create a second relationship graph.
- Do not create a second Fit Twin relationship table/graph.
- Existing migration/function/test names containing `fit_twin` are legacy implementation naming until deliberately migrated. Their names do not redefine product semantics.

## Feed / notification foundation
- existing Following activity infrastructure remains based on the `follows` graph and Shared content visibility.
- likes are not activity events.
- private/deleted source content must not continue to expose feed/notification content.
- current Fit-Twin-named notification helpers/tables are legacy naming debt; dedicated social cleanup must migrate terminology safely without duplicating relationship state.
- V1 does not send followed-person activity email/phone push unless the owner later changes that.

## LikeLocker foundation
- `product_likes` stores owner-private ordinary garment likes.
- `outfit_likes` remains the existing Outfit-like graph.
- `wish_locker_items` stores owner-private product purchase intent.
- owner-scoped RLS controls read/write/delete for product likes and Wish Locker saves.
- LikeLocker is the one destination exposing these three distinct filters; none of these tables stores people.

## Outfit foundation
- canonical Outfit posts/links/likes remain preserved in V1.
- Outfit item links expose garment evidence only while the underlying Closet evidence is Shared.
- Outfit likes are distinct from garment/product likes.
- existing atomic outfit-creation behavior must remain transactional.

## Search foundation
- catalog/member search uses canonical Product/Brand/identifier/listing/member sources rather than duplicate catalogs or profile indexes.
- grouped search also uses canonical Outfit captions/creators/tagged Products, returns an exact group count, and limits suggestions independently for Garments, Outfits, and People.
- normal Product search deduplicates to one canonical Product result.
- search must not expose raw Fit Profile measurements/private size references.

## Fit Result / legacy `fit_rating` identifier
- current physical fit values are Too Small / Snug / Just Right / Relaxed / Too Big.
- a database type/column/function identifier containing `fit_rating` may be legacy naming for those physical outcomes.
- **There is no current V1 1–5-star Fit Rating product requirement.**
- do not infer star/satisfaction semantics from the legacy identifier.
- historical data is not dropped casually during terminology cleanup.

## Recommendation foundation
Current production/recovery architecture uses evidence levels:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

`lib/recommendation.ts::recommendSize()` is the application recommendation-confidence implementation once the PR #36 recovery step reapplies the owner-audited version.

Help Me Size It must reuse the same canonical recommendation architecture; no second sizing engine/table is authorized.

`Would Buy Again` must not be used as size-recommendation/confidence input under the owner-locked Fit Match audit.

## Recovered Fit Match database work
The ordered `20260821223236` through `20260821223310` recovery migrations are the canonical, replayable implementations of the owner-audited Match, evidence, Preferred Fit, body-proportion, freshness, garment-condition, and historical-snapshot rules. Earlier PR #36 filenames are historical salvage references only and are not alternate current schema files.

## Moderation and catalog-conflict foundation
- `private.admin_users` is the explicit admin allowlist; the earliest existing Auth account bootstraps the owner and later members are never auto-promoted.
- `content_reports` stores member reports for Outfit posts and shared Fit Report photos under reporter-own/admin-only RLS.
- `moderation_actions` is the append-only audit trail for dismissals and content removal.
- Admin deletion policies cover the member-visible database row and its private Storage object; ordinary member ownership policies remain unchanged.
- Existing Product metadata/attribute evidence remains the one confirmation system. Independent member agreement corroborates provisional facts; conflicting evidence sets `products.catalog_review_needed`.
- `catalog_moderation_actions` records the final verified controlled value. Verified admin evidence cannot be overwritten by later member submissions; later disagreements remain review evidence.
- `product_description_evidence` applies the same provisional → corroborated/conflict → admin-verified lifecycle to member-supplied descriptions.
- `product_evidence_notifications` is an owner-scoped watch table used only when Explore has insufficient useful evidence. A later Fit Report for that Product activates an in-app notification; it is not a second recommendation or matching engine.

## Material / stretch implementation debt
- reliable manufacturer/product-source material may exist as background data only; member material input/verification/filter is not current V1.
- current V1 does not collect/classify/infer stretch as a member field/filter.
- existing stretch-related schema rows/functions from earlier work may remain dormant during recovery until deliberately audited; dormant support does not authorize UI exposure.

## Verification contract
Canonical CI must:
1. run canonical integrity/drift checks;
2. typecheck;
3. run focused recommendation/UI tests where present;
4. build the application;
5. start a disposable local Supabase database from the complete canonical migration directory;
6. run canonical pgTAP/database behavior/privacy tests.

Historical successful CI on another branch is preservation evidence only. A reconciled recovery branch must pass its own gates before work is marked recovered/complete.

## Forbidden regressions
Do not:
- add fixed body-measurement columns back to `fit_profiles` as current architecture;
- blend current-person scores with historical garment evidence;
- count repeated observations as multiple unique wearers for recommendation aggregation;
- expose raw body data through search/social/feed/notifications;
- create a second catalog/member/follow/sizing system;
- reintroduce private fit-photo state;
- reintroduce star Fit Rating UI from a legacy DB identifier;
- treat `supabase/schema.sql` as canonical schema;
- expose dormant stretch logic as current V1 without a new owner decision.
