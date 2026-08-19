# LikeSized ordered migrations

GitHub `likesized/Likesized` is the canonical project record. The connected Supabase migration history is the deployed execution ledger used to verify what has been applied.

Authoritative V1 architecture sequence:
- `20260819144032_authoritative_v1_fit_garment_architecture` — normalized/extensible body measurements; product families/listings/identifiers; structured sizes; garment taxonomy/attributes; controlled fit dimensions; Shared Closet; shared fit-reference photos; garment-specific matching; evidence fallback.
- `20260819144343_authoritative_v1_architecture_constraints` — product identity uniqueness, brand alias normalization, helper privileges, URL pair validation, schema comments.
- `20260819150022_immutable_fit_profile_versions` — immutable historical body/size snapshots; Fit Reports lock to the try-on body state; multiple observations per Closet item; safe snapshot matcher.
- `20260819150923_historical_fit_evidence_unique_wearers` — historical product evidence uses snapshot match and returns at most one strongest observation per unique wearer; safe batch historical score RPC for visible reports.
- `20260819151101_atomic_fit_profile_version_saves` — one-transaction current Fit Profile replacement/normalization/version commit.
- `20260819152030_harden_fit_profile_version_rpcs` — public profile/version RPCs run SECURITY INVOKER under RLS; only narrow private auth-bound snapshot helper is SECURITY DEFINER.
- `20260819152056_index_authoritative_v1_relationships` — covering indexes for all new authoritative-V1 foreign keys.

Never manufacture a second migration with the same version, create patch/fixed/v2 schema files, or restore the earlier simplified architecture. Future database changes are new ordered migrations and must keep `docs/V1_PRODUCT_SPEC.md`, `docs/AI_MASTER_LOG.md`, and `supabase/schema_contract.md` synchronized.
