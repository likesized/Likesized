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
- `fit_report_dimensions` stores controlled garment-specific responses with DB validation.
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

## PR #36 database work — preserved / pending recovery
The following migration files are mandatory salvage candidates and must not be lost or treated as applied to production merely because they exist on the old branch:
- `20260820153100_confidence_aware_fit_matching.sql`
- `20260820153200_fit_match_engine_rpc_boundary.sql`
- `20260820153400_contextual_optional_measurements.sql`
- `20260820203500_garment_enrichment_provenance.sql`
- `20260820211800_directional_fit_recommendation.sql`
- `20260820215500_garment_fit_preferences.sql`
- `20260820221000_derived_body_proportion_refinement.sql`
- `20260820222100_bust_shaping_context.sql`
- `20260820234000_fit_match_audit_consolidation.sql`
- `20260820235000_garment_condition_evidence.sql`
- `20260821011600_fit_profile_reference_normalization_boundary.sql`
- `20260821014000_harden_historical_snapshot_match_boundary.sql`

Their recovery must preserve owner-approved directional recommendation, Preferred Fit, derived proportions, chest/full-bust context, measurement freshness, garment-condition evidence, hardened historical snapshot boundaries and associated privacy constraints, while later owner decisions supersede active V1 stretch/member-stretch behavior.

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