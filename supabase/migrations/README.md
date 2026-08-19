# LikeSized ordered migrations

## Canonical rule — LOCKED
GitHub `likesized/Likesized` is the single source of truth. Every migration file in this directory must contain the executable SQL needed to reproduce that migration. Never replace migration SQL with a pointer to the hosted database, a prose-only summary, a patch/fixed/v2 copy, or a parallel schema implementation.

The connected Supabase project is the deployed instance. Its migration ledger verifies which canonical migrations have been applied and in what order; it is not the only storage location for migration SQL.

Authoritative V1 architecture sequence:
- `20260819144032_authoritative_v1_fit_garment_architecture.sql` — normalized/extensible body measurements; product families/listings/identifiers; structured sizes; garment taxonomy/attributes; controlled fit dimensions; Shared Closet; shared fit-reference photos; garment-specific matching; evidence fallback.
- `20260819144343_authoritative_v1_architecture_constraints.sql` — product identity uniqueness, brand alias normalization, helper privileges, URL pair validation, schema comments.
- `20260819150022_immutable_fit_profile_versions.sql` — immutable historical body/size snapshots; Fit Reports lock to the try-on body state; multiple observations per Closet item; safe snapshot matcher.
- `20260819150923_historical_fit_evidence_unique_wearers.sql` — historical product evidence uses snapshot match and returns at most one strongest observation per unique wearer; safe batch historical score RPC for visible reports.
- `20260819151101_atomic_fit_profile_version_saves.sql` — one-transaction current Fit Profile replacement/normalization/version commit.
- `20260819152030_harden_fit_profile_version_rpcs.sql` — public profile/version RPCs run SECURITY INVOKER under RLS; only the narrow private auth-bound snapshot helper is SECURITY DEFINER.
- `20260819152056_index_authoritative_v1_relationships.sql` — covering indexes for all new authoritative-V1 foreign keys.

Future database changes are new ordered executable migrations in this same directory. Update `docs/V1_PRODUCT_SPEC.md`, `docs/AI_MASTER_LOG.md`, and `supabase/schema_contract.md` when architecture or locked behavior changes.
