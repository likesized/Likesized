# LikeSized ordered migrations

## Canonical rule — LOCKED
GitHub `likesized/Likesized` is the single source of truth. Every migration file in this directory contains the executable SQL needed to reproduce that migration. Never replace migration SQL with a pointer to the hosted database, a prose-only summary, a fixed/v2 copy, or a parallel schema implementation.

The connected Supabase project is the deployed instance and execution ledger. Its migration history verifies what was applied and in what order; it is not the source from which a future environment must be reconstructed.

**Database replay/deployment history is this ordered directory.** `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only. Do not run them before or in addition to the migration directory when replaying a fresh database.

## Complete V1 migration sequence
1. `20260819132934_initial_likesized_schema.sql` — original V1 schema, RLS, grants and first current-body matching engine.
2. `20260819132948_fit_rating_relaxed_value.sql` — adds the `relaxed` overall fit value.
3. `20260819133114_index_relationships_and_streamline_profile_read.sql` — relationship indexes and completed/own-profile read policies.
4. `20260819134229_private_closet_photo_storage.sql` — original private `closet-photos` storage bootstrap.
5. `20260819135959_harden_public_table_privileges.sql` — explicit least-privilege Data API grants.
6. `20260819140445_member_readable_outfit_photo_storage.sql` — member-readable/owner-written `outfit-photos` storage.
7. `20260819141225_outfit_likes.sql` — Outfit likes table, RLS and grants.
8. `20260819144032_authoritative_v1_fit_garment_architecture.sql` — normalized/extensible body measurements; product families/listings/identifiers; structured sizes; garment taxonomy/attributes; controlled fit dimensions; Shared Closet; shared fit-reference photos; garment-specific matching; evidence fallback.
9. `20260819144343_authoritative_v1_architecture_constraints.sql` — product identity uniqueness, brand alias normalization, helper privileges, URL validation and schema comments.
10. `20260819150022_immutable_fit_profile_versions.sql` — immutable historical body/size snapshots; Fit Reports lock to try-on body state; multiple observations per Closet item; safe snapshot matching.
11. `20260819150923_historical_fit_evidence_unique_wearers.sql` — historical evidence uses snapshot match and returns at most one strongest observation per unique wearer; safe batch historical score RPC.
12. `20260819151101_atomic_fit_profile_version_saves.sql` — one-transaction current Fit Profile measurement replacement/normalization/version commit.
13. `20260819152030_harden_fit_profile_version_rpcs.sql` — public profile/version RPCs run SECURITY INVOKER under RLS; only the narrow private auth-bound snapshot helper is SECURITY DEFINER.
14. `20260819152056_index_authoritative_v1_relationships.sql` — covering indexes for authoritative-V1 foreign keys.
15. `20260819164005_atomic_fit_profile_size_references.sql` — extends the canonical Fit Profile save so current private normally-worn size references and body measurements are replaced in one transaction before immutable-version creation/reuse; removes the redundant non-unique size-reference index.
16. `20260819165124_profile_identity_constraints.sql` — bounds member-facing display name, bio and reserved avatar URL fields at the database layer.
17. `20260819165756_member_only_profile_identity.sql` — V1 privacy lock: completed member identity is readable only to authenticated LikeSized members; anonymous profile SELECT access is revoked.
18. `20260819170808_inline_private_size_reference_normalization.sql` — keeps generic private shirt/pants/dress/other reference normalization inside the SECURITY INVOKER Fit Profile save without reopening authenticated EXECUTE on the general-purpose text normalizer helper.
19. `20260819173357_qualify_current_match_profile_owner.sql` — fixes the current-person matcher replay by qualifying the Fit Profile owner reference inside the SECURITY DEFINER derived-match helper.
20. `20260819174045_restore_current_match_helper_execute.sql` — restores the narrow authenticated EXECUTE/USAGE path required by the SECURITY INVOKER public matching wrappers; the helper remains auth-bound and returns only member identity plus derived score/coverage, never raw measurements.
21. `20260819183601_enforce_fit_report_dimension_garment_type.sql` — adds the trigger-only database guard that prevents a controlled Fit Report dimension from being attached to a garment type for which that dimension is not defined.
22. `20260819190312_enforce_shared_fit_photo_invariant.sql` — enforces the V1 no-private-fit-photo invariant at the database boundary: fit-photo metadata must match the Closet owner and a Shared Closet item cannot become Private until its fit-photo metadata is removed.
23. `20260819191518_validate_product_evidence_variant_target.sql` — validates that a requested Exact Variant target belongs to the target product before granting Exact Variant rank; invalid/foreign IDs safely fall back to Exact Product and broader evidence.
24. `20260819192804_enforce_product_family_compatibility.sql` — protects Product Family evidence integrity by requiring family-linked products to match the family brand, garment type and market/cut segment.
25. `20260819194010_controlled_primary_material_and_attribute_category.sql` — adds controlled Primary material/fabric-family options and prevents category-scoped construction attributes from being attached to incompatible Product categories.

The first seven files were recovered from `supabase_migrations.schema_migrations` during the 2026-08-19 canonical audit. Their Git blob SHAs were verified byte-for-byte against the SQL stored in the deployed migration ledger before being committed. They are historical migration records, not newly invented database changes, and must not be re-applied to the already-migrated connected project.

Migration 15 was verified against the deployed ledger after application: the executed SQL Git-blob SHA is `953271fb22263cb577793290df2c96fa498128d9`, matching the canonical repository file exactly. Migrations 16–25 are stored under the exact versions recorded by the deployed Supabase ledger.

Future database changes are new ordered executable migrations in this same directory. Update `docs/V1_PRODUCT_SPEC.md`, `docs/AI_MASTER_LOG.md`, and `supabase/schema_contract.md` when architecture or locked behavior changes.
