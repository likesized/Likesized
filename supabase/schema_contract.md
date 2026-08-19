# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for the database architecture and executable history.

The **ordered executable SQL in `supabase/migrations/` is the authoritative replay/deployment history from an empty Supabase database to the current LikeSized schema.** The connected Supabase project is the deployed instance and execution ledger used to verify that those migrations were applied in the expected order; it must never be the only place where required SQL exists.

`supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only. They are not a second migration history and must not be combined with the ordered migration replay on a fresh environment.

The canonical directory contains all 25 migrations recorded by the connected project, from `20260819132934_initial_likesized_schema.sql` through `20260819194010_controlled_primary_material_and_attribute_category.sql`.

Do not rewrite historical migrations that have already been applied. Future database changes are new ordered executable migrations. Do not create alternate current-state schema files, patch migrations, fixed/v2 copies, or parallel database implementations.

## Locked current-state contract
- `profiles`: member-facing identity shell. Completed username/display name/bio are readable to authenticated LikeSized members only; anonymous SELECT access is revoked.
- `fit_profiles`: current settings/completion/current immutable version pointer only.
- `body_measurements`: current owner-private normalized raw measurements.
- `user_size_references`: current owner-private normally-worn size references.
- `fit_profile_versions` + version measurement/size-reference tables: immutable owner-private historical body/size-reference states.
- `fit_reports.fit_profile_version_id`: immutable body-state association for that try-on. Multiple Fit Reports may exist for one Closet item over time.
- `fit_report_dimensions`: controlled garment-specific Fit Report responses guarded against invalid garment/dimension combinations.
- `get_fit_matches` / `get_garment_fit_matches`: current body ↔ current body discovery only; safe derived score/coverage, never raw measurements.
- `get_product_evidence_candidates`: current viewer body ↔ Fit Report historical snapshot, at most one strongest observation per unique wearer, with locked evidence ranks Exact Variant 1 → Exact Product 2 → Product Family 3 → Similar Garments 4 → Brand + Garment Type 5 → Category Fit 6.
- `product_families`: intentional same-fit/cut grouping only; compatible brand + garment type + market/cut segment required.
- Controlled Similar Garments attributes include fit/cut, rise, stretch, Primary material/fabric family, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- `get_fit_report_snapshot_matches`: safe historical match scores for visible Fit Reports; no raw snapshot values.
- `save_fit_profile`: atomic current body measurements + private size references + immutable-version creation/reuse under RLS.
- Private Closet items remain owner-only; Shared items/reports are member-readable through RLS.
- Fit/reference photos may exist only while their Closet item is Shared; there is no private fit-photo mode.
- `follows`: the canonical Fit Twin relationship. Composite primary key prevents duplicates and a CHECK prevents self-follow. Signed-in LikeSized members may read the relationship graph (`members read follows`); only `auth.uid() = follower_id` may insert/delete. Anonymous users have no SELECT grant. This community-public relationship is intentionally reused by People My Size, `/twins`, member profiles, Fit-Twins outfit filtering and the V1 Following Feed.

## Canonical verification contract
CI replays the complete migration directory on a disposable local Supabase database and runs pgTAP tests under `supabase/tests/`. It also directly tests the production TypeScript recommendation function before the production build.

Key suites include:
- `fit_profile_behavior.test.sql` — Fit Profile save/version behavior.
- `fit_profile_privacy_rls.test.sql` — owner-only raw current/historical Fit Profile data and member identity privacy.
- `fit_profile_history_integrity.test.sql` — current-person vs immutable historical evidence separation.
- `people_my_size_matching.test.sql` — Overall/Tops/Bottoms ranking, coverage and current-body recalculation.
- `fit_report_dimensions.test.sql` — controlled garment-specific fit dimensions.
- `closet_integration_privacy.test.sql` — **32 assertions** for Shared/Private Closet history and photo invariants.
- `product_evidence_variant_targeting.test.sql` — **12 assertions**.
- `product_family_evidence.test.sql` — **11 assertions**.
- `similar_garment_attributes.test.sql` — **10 assertions**.
- `product_evidence_full_hierarchy.test.sql` — **18 assertions** across all six evidence tiers.
- `fit_twin_follow_foundation.test.sql` — **14 assertions** proving save/unfollow ownership, duplicate/self-follow rejection, community-public-to-members graph visibility, cross-user write/delete protection, current match recalculation independent of the saved relationship, and anonymous denial.

`tests/recommendation-confidence.test.ts` calls production `recommendSize()` directly with **9 calibration cases**.

Phase 5.1 CI `32297673470` passed npm install, typecheck, recommendation calibration, production build, fresh replay of all 25 migrations and every canonical database suite.

Do not add fixed measurement columns back to `fit_profiles`. Do not use current-person match scores to weight historical garment evidence. Do not count multiple historical observations from one member as multiple people. Do not fuzzy-group Product Families by name. Do not allow category-incompatible Similar Garments attributes. Do not reintroduce anonymous profile discovery, anonymous follow-graph discovery, or a private fit-photo state without an explicit owner privacy decision and a new canonical migration.