# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for the database architecture and executable history.

The **ordered executable SQL in `supabase/migrations/` is the authoritative replay/deployment history from an empty Supabase database to the current LikeSized schema.** The connected Supabase project is the deployed instance and execution ledger used to verify that those migrations were applied in the expected order; it must never be the only place where required SQL exists.

`supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only. They are not a second migration history and must not be combined with the ordered migration replay on a fresh environment.

The canonical directory now contains all 14 migrations recorded by the connected project, from `20260819132934_initial_likesized_schema.sql` through `20260819152056_index_authoritative_v1_relationships.sql`. During the 2026-08-19 canonical audit, the first seven historical migrations were recovered from the deployed migration ledger and their Git blob SHAs were verified byte-for-byte against the SQL Supabase originally executed before they were committed.

Do not rewrite historical migrations that have already been applied. Future database changes are new ordered executable migrations. Do not create alternate current-state schema files, patch migrations, fixed/v2 copies, or parallel database implementations.

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

Do not add fixed measurement columns back to `fit_profiles`. Do not use current-person match scores to weight historical garment evidence. Do not count multiple historical observations from one member as multiple people.
