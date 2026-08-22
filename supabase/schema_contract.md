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

Owner-approved Fit Match work from preserved PR #36 was recovered through the ordered `20260821223236` through `20260821223310` migration sequence. Preserved branches remain historical salvage sources, not alternate current schemas. See the master salvage ledger.

## Current baseline architecture
- `profiles` stores member identity; anonymous identity discovery is not allowed where current RLS/grants revoke it.
- `fit_profiles` is a profile shell; raw body values belong in normalized owner-private measurement structures created by ordered migrations.
- immutable Fit Profile version tables preserve historical owner-private body state.
- `fit_reports.fit_profile_version_id` preserves try-on body-state association; later current-body edits do not rewrite old evidence.
- `garment_types`, `garment_attribute_definitions`, and `garment_attribute_options` hold the database vocabulary used by the one controlled application taxonomy; server validation additionally enforces which zero-to-four questions/options belong to each specific Type. `garment_types.intake_active` is the member-facing Type allowlist. The established `active` flag remains the matching/historical compatibility boundary so adding intake Types cannot disable calibrated legacy keys or historical Products.
- `color_families` stores the approved controlled member-facing color list. `product_variants.color_family_key` stores its filterable family; exact Product/variant color wording remains separate in `color_label` where available.
- `fit_reports.reported_condition` preserves New / Used / Altered. New and Used map to the canonical normal-evidence boundary; Altered remains excluded from normal-product recommendation evidence.
- current-person matching RPCs return safe derived scores/coverage only; raw body measurements remain private.
- historical Product/Fit Report matching uses immutable snapshots.
- Private Closet items remain owner-only; Shared evidence is member-readable only under the current RLS rules.
- fit/reference photos may exist only under the Shared evidence rule.

## Community catalog foundation — CURRENT BRANCH DIRECTION

The current owner direction retires external/API catalog import and uses the LikeSized database plus member contributions as the active catalog source.

### Applied external-import history
The earlier external-provider migrations were already part of ordered/applied history and therefore remain immutable files. Migration `20260822073000_community_catalog_intake_and_seed.sql` retires their active runtime objects by dropping the provider/source-record tables and RPCs. Do not delete or rewrite the historical migrations merely because the strategy was abandoned.

Current product behavior must not depend on:
- `private.catalog_import_providers`;
- provider usage/request/alert tables;
- `private.catalog_source_records`;
- Channel3/Brave/UPCItemDB or another external catalog provider.

If any application code, tests, environment requirements, or current documentation still treats those provider objects as active product behavior, that is cleanup debt and must be removed before this intake work is called complete.

### Starter catalog seed
`20260822073000_community_catalog_intake_and_seed.sql` seeds the owner-supplied 150 starter Products using only Brand + Item/Model + Garment Type. The migration intentionally does not invent Color, Size, Department, material, attributes, identifiers, descriptions, or retailer listings.

### Department and material evidence
- `product_departments` is the controlled Department vocabulary.
- `products.department_key` stores the current canonical Department when one exists.
- Department claims use the existing `product_metadata_evidence` lifecycle rather than a second evidence graph.
- `product_material_evidence` is reused for optional controlled member Material/Fabric Composition claims.
- `record_member_product_evidence(...)` accepts controlled Department/material evidence together with the existing garment metadata/attribute evidence.
- Repeated claims by the same member do not count as independent corroboration.
- `Not sure` is a UI no-claim state and is not stored as a positive Department/material fact.
- Material is stored catalog evidence only; it does not become Match/recommendation input or a Browse filter without a later owner-approved change.
- Stretch remains outside current V1 member input/filter behavior.

### Product-photo evidence
- `product_photo_evidence` stores member-contributed Product photos separately from personal Fit Photos.
- Product photos are shared catalog content for authenticated members and start provisional.
- `product-photos` is the dedicated Storage bucket created by the community-catalog migration.
- members may upload their own Product-photo objects under the storage ownership policy;
- authorized admins have the deletion boundary required for moderation.

### Identity disagreement evidence
`20260822073100_add_community_identity_evidence.sql` adds `product_identity_evidence` for member-reported disagreement with:
- canonical Brand name;
- Item/Model name;
- manufacturer Style/Article value.

`record_member_product_identity_issue(...)` records one member's current claim per Product/identity field. A materially different value flags `products.catalog_review_needed`; it does **not** silently rewrite Product identity.

The current database foundation therefore supports field-level disagreement evidence, but the broader owner-required duplicate system is still implementation debt: hidden Brand/Product aliases, scored possible-duplicate candidates, audited merge behavior, and audited split behavior must be added by later ordered migrations/functions rather than implemented as an ad-hoc parallel system.

## Product identity / retailer listing foundation
- `brands` and `products` remain the one canonical identity graph.
- `product_identifiers`/canonical identifier structures provide UPC/barcode identity evidence where present.
- manufacturer Style/Article identity stays attached to Product/evidence rather than being treated as globally unique by itself.
- SKU is not globally unique Product identity.
- `retailer_listings` is the one-to-many retailer-listing relationship for canonical Products/variants.
- a new retailer URL must append/dedupe through the listing model; it must not overwrite another valid retailer URL merely because it was submitted later.
- normalized retailer URLs may contribute duplicate/identity evidence, but a retailer URL is not itself a second Product catalog.
- future Skimlinks/affiliate routing must preserve the original canonical retailer listing/URL and should not require a second Product identity table.

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
- Shop/affiliate actions are conditional presentation over valid `retailer_listings`; they do not create a second save graph.

## Outfit foundation
- canonical Outfit posts/links/likes remain preserved in V1.
- Outfit item links expose garment evidence only while the underlying Closet evidence is Shared.
- Outfit likes are distinct from garment/product likes.
- existing atomic outfit-creation behavior must remain transactional.

## Search foundation
- catalog/member search uses canonical Product/Brand/identifier/listing/member sources rather than duplicate catalogs or profile indexes.
- grouped search also uses canonical Outfit captions/creators/tagged Products, returns an exact group count, and limits suggestions independently for Garments, Outfits, and People.
- normal Product search deduplicates to one canonical Product result.
- New Fit Report Brand/Item suggestions must prefer canonical Brand/Product records and future reviewed aliases before creating new identities.
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

`lib/recommendation.ts::recommendSize()` is the application recommendation-confidence implementation recovered from the owner-audited Fit Match work.

Help Me Size It must reuse the same canonical recommendation architecture; no second sizing engine/table is authorized.

`Would Buy Again` must not be used as size-recommendation/confidence input under the owner-locked Fit Match audit.

## Recovered Fit Match database work
The ordered `20260821223236` through `20260821223310` recovery migrations are the canonical, replayable implementations of the owner-audited Match, evidence, Preferred Fit, body-proportion, freshness, garment-condition, and historical-snapshot rules. Earlier PR #36 filenames are historical salvage references only and are not alternate current schema files.

## Moderation and catalog-conflict foundation
- `private.admin_users` is the explicit admin allowlist; the earliest existing Auth account bootstraps the owner and later members are never auto-promoted.
- `content_reports` stores member reports for currently supported report targets under reporter-own/admin-only RLS.
- `moderation_actions` is the append-only audit trail for dismissals and content removal.
- Admin deletion policies cover supported member-visible rows/private Storage objects; ordinary member ownership policies remain unchanged.
- Existing Product metadata/attribute evidence remains the one confirmation system. Independent member agreement corroborates provisional facts; conflicting evidence sets `products.catalog_review_needed`.
- `catalog_moderation_actions` records final verified controlled values where the current admin flow supports them. Verified admin evidence cannot be overwritten by later member submissions; later disagreements remain review evidence.
- `product_description_evidence` applies the provisional → corroborated/conflict → admin-verified lifecycle to member-supplied descriptions where retained.
- `product_evidence_notifications` is an owner-scoped watch table used only when Explore has insufficient useful evidence. A later Fit Report for that Product activates an in-app notification; it is not a second recommendation or matching engine.
- `product_identity_evidence` extends the conflict boundary to Brand/Item/Style disagreements.

Owner-required admin behavior that is **not yet safe to claim as complete database behavior** includes a full Possible Duplicates queue/data model, transactional canonical Product merge, transactional Product split, spam-intake/Fit-Report removal coverage, and complete Product-photo moderation/audit integration. Those must extend the current moderation/evidence system in later ordered migrations/functions rather than create a parallel admin architecture.

## Verification contract
Canonical CI must:
1. run canonical integrity/drift checks;
2. typecheck;
3. run focused recommendation/UI tests where present;
4. build the application;
5. start a disposable local Supabase database from the complete canonical migration directory;
6. run canonical pgTAP/database behavior/privacy tests.

The community-catalog conversion is not complete until fresh replay proves the historical external-import migrations can run in order and the later retirement migration cleanly removes their active runtime objects.

Historical successful CI on another commit is preservation evidence only. A newly reconciled branch must pass its own gates before work is marked complete.

## Forbidden regressions
Do not:
- add fixed body-measurement columns back to `fit_profiles` as current architecture;
- blend current-person scores with historical garment evidence;
- count repeated observations as multiple unique wearers for recommendation aggregation;
- expose raw body data through search/social/feed/notifications;
- create a second catalog/member/follow/sizing system;
- revive an external/API catalog provider as active intake without a new explicit owner decision and full canonical reconciliation;
- rewrite/delete applied external-import migrations to pretend the abandoned experiment never happened;
- let a member disagreement silently overwrite canonical Product identity/facts;
- auto-merge fuzzy duplicate Products without sufficient identity evidence/review;
- overwrite an existing valid retailer listing with a newly submitted different retailer URL;
- reintroduce private fit-photo state;
- reintroduce star Fit Rating UI from a legacy DB identifier;
- treat `supabase/schema.sql` as canonical schema;
- expose dormant stretch logic as current V1 without a new owner decision.
