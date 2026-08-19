# LikeSized ordered migrations

## Canonical rule — LOCKED
GitHub `likesized/Likesized` is the single source of truth. Every migration file in this directory contains the executable SQL needed to reproduce that migration. Never replace migration SQL with a pointer to the hosted database, a prose-only summary, a fixed/v2 copy, or a parallel schema implementation.

The connected Supabase project is the deployed instance and execution ledger. **Database replay/deployment history is this ordered directory.** `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only.

## Complete V1 migration sequence
1. `20260819132934_initial_likesized_schema.sql` — original V1 schema, RLS, grants and first current-body matching engine.
2. `20260819132948_fit_rating_relaxed_value.sql` — adds `relaxed` fit.
3. `20260819133114_index_relationships_and_streamline_profile_read.sql` — relationship indexes/profile reads.
4. `20260819134229_private_closet_photo_storage.sql` — original Closet photo storage bootstrap.
5. `20260819135959_harden_public_table_privileges.sql` — least-privilege API grants.
6. `20260819140445_member_readable_outfit_photo_storage.sql` — outfit photo storage.
7. `20260819141225_outfit_likes.sql` — outfit likes.
8. `20260819144032_authoritative_v1_fit_garment_architecture.sql` — normalized body/product/size/garment/Fit Report architecture.
9. `20260819144343_authoritative_v1_architecture_constraints.sql` — architecture constraints/helper privileges.
10. `20260819150022_immutable_fit_profile_versions.sql` — immutable historical body states.
11. `20260819150923_historical_fit_evidence_unique_wearers.sql` — historical evidence and unique-wearer cap.
12. `20260819151101_atomic_fit_profile_version_saves.sql` — atomic current Fit Profile save.
13. `20260819152030_harden_fit_profile_version_rpcs.sql` — hardened profile/version RPC boundary.
14. `20260819152056_index_authoritative_v1_relationships.sql` — authoritative relationship indexes.
15. `20260819164005_atomic_fit_profile_size_references.sql` — atomic measurements + private size references.
16. `20260819165124_profile_identity_constraints.sql` — profile identity bounds.
17. `20260819165756_member_only_profile_identity.sql` — authenticated-member-only identity.
18. `20260819170808_inline_private_size_reference_normalization.sql` — private reference normalization within save RPC.
19. `20260819173357_qualify_current_match_profile_owner.sql` — current matcher replay fix.
20. `20260819174045_restore_current_match_helper_execute.sql` — narrow safe matcher-helper execution path.
21. `20260819183601_enforce_fit_report_dimension_garment_type.sql` — garment/dimension DB guard.
22. `20260819190312_enforce_shared_fit_photo_invariant.sql` — Shared-only fit-photo invariant.
23. `20260819191518_validate_product_evidence_variant_target.sql` — Exact Variant ownership validation.
24. `20260819192804_enforce_product_family_compatibility.sql` — Product Fit Family compatibility.
25. `20260819194010_controlled_primary_material_and_attribute_category.sql` — controlled material/category attributes.
26. `20260819202515_following_feed_activity_foundation.sql` — private canonical ledger for Shared-garment, re-try-on and outfit Following Feed activity; current visibility/source checks and auth-bound feed output.
27. `20260819202851_harden_following_feed_rpc_boundary.sql` — moves privileged Following Feed implementation to a private auth-bound SECURITY DEFINER helper behind a public SECURITY INVOKER wrapper.

The first seven files were recovered from `supabase_migrations.schema_migrations` during the 2026-08-19 canonical audit and verified byte-for-byte against the deployed migration ledger before being committed. Migrations 16–27 are stored under the exact versions recorded by the deployed Supabase ledger.

Future database changes are new ordered executable migrations in this same directory. Update `docs/V1_PRODUCT_SPEC.md`, `docs/AI_MASTER_LOG.md`, and `supabase/schema_contract.md` when architecture or locked behavior changes.