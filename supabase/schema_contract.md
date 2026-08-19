# LikeSized database schema contract

GitHub `likesized/Likesized` is the canonical project record. `supabase/schema.sql` is the historical V1 bootstrap; current state is that bootstrap plus the ordered migrations documented here and under `supabase/migrations/`. The connected Supabase project is the deployed instance and its migration table verifies the applied order.

Authoritative architecture migrations:
- `20260819144032_authoritative_v1_fit_garment_architecture`
- `20260819144343_authoritative_v1_architecture_constraints`
- `20260819150022_immutable_fit_profile_versions`
- `20260819150923_historical_fit_evidence_unique_wearers`
- `20260819151101_atomic_fit_profile_version_saves`
- `20260819152030_harden_fit_profile_version_rpcs`
- `20260819152056_index_authoritative_v1_relationships`

## Locked current-state contract
- `fit_profiles`: current settings/completion/current immutable version pointer only.
- `body_measurements`: current owner-private normalized raw measurements.
- `fit_profile_versions` + version measurement/size-reference tables: immutable owner-private historical body states.
- `fit_reports.fit_profile_version_id`: immutable body-state association for that try-on. Multiple Fit Reports may exist for one Closet item over time.
- `get_fit_matches` / `get_garment_fit_matches`: current body ↔ current body discovery only.
- `get_product_evidence_candidates`: current viewer body ↔ Fit Report historical snapshot, evidence fallback hierarchy, at most one strongest observation per unique wearer.
- `get_fit_report_snapshot_matches`: safe derived historical match scores for visible Fit Reports; no raw snapshot values.
- `save_fit_profile`: SECURITY INVOKER atomic current measurement replacement + normalization + immutable version commit/reuse under RLS.
- `commit_fit_profile_version`: SECURITY INVOKER public wrapper; private auth-bound helper performs immutable-version creation.
- Product/brand/family/listing/identifier/size/taxonomy/attributes remain normalized as defined in `docs/V1_PRODUCT_SPEC.md`.
- Private Closet items remain owner-only; Shared items/reports are member-readable through RLS.
- Every uploaded fit/reference photo belongs to a Shared Closet item and is member-readable through a non-public bucket. No private fit-photo mode exists.
- Authoritative foreign-key relationships have covering indexes.

Do not add fixed measurement columns back to `fit_profiles`. Do not use current-person match scores to weight historical garment evidence. Do not count multiple historical observations from one member as multiple people. Do not create alternate current-state schema files, patch migrations, or parallel implementations.
