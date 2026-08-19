# LikeSized AI Master Log

## Canonical repository rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for LikeSized source, architecture decisions, schema contract, ordered migration ledger, and project handoff state. Never create patch files, `*-fixed`, `*-patched`, `*-new`, `*-v2`, backups, temporary copies, or parallel implementations. Every approved change modifies canonical source/migrations/docs directly. Git history is the history. The connected Supabase project is the deployed database instance/operational migration ledger, not a competing project record.

## 2026-08-19 — FINAL AUTHORITATIVE V1 ARCHITECTURE UPDATE
Status: authoritative architecture applied to the connected LikeSized Supabase project and synchronized into canonical source.

Authoritative product rule: LikeSized answers **“How did this garment fit people built like me?”** using private body measurements, garment-specific matching, canonical product/variant/family/listing identity, real Fit Reports, and member-shared fit/reference photos.

This update supersedes earlier simplified decisions for product URLs/SKUs/UPCs, retailer listings, product families/fallbacks, garment market segment, sizing/normalization, measurement architecture/precision, bust/bra/work-shirt/tailoring/shoe measurements, controlled entry, normalization, Fit Reports, shared Closets, Fit Twins, and fit/reference photos.

### Historical body-state rule — LOCKED
- Current Fit Match/Fit Twin percentages are **current body vs. current body only**.
- Fit Reports are permanently locked to an immutable Fit Profile version representing the wearer's body/size state when that observation was logged.
- Changing current measurements never moves or recalculates an older Fit Report onto the new body state.
- Product evidence compares the viewer's current body to each Fit Report's historical snapshot.
- Shared member profiles retain legitimate old shared garment observations and label their safe historical match separately from current-person match scores.
- Recommendation aggregation uses at most one strongest historical observation per unique wearer. Multiple observations remain in history but never let one prolific member inflate the number of people or confidence.
- Fit Profile saves are atomic: replace current normalized measurements + commit/reuse immutable current version in one DB transaction.
- Public profile/version RPCs are SECURITY INVOKER under RLS; immutable snapshot creation is confined to a narrow private auth.uid()-bound helper.

Canonical architecture is documented in `docs/V1_PRODUCT_SPEC.md` and `supabase/schema_contract.md`. Ordered deployed migrations include:
- `20260819144032_authoritative_v1_fit_garment_architecture`
- `20260819144343_authoritative_v1_architecture_constraints`
- `20260819150022_immutable_fit_profile_versions`
- `20260819150923_historical_fit_evidence_unique_wearers`
- `20260819151101_atomic_fit_profile_version_saves`
- `20260819152030_harden_fit_profile_version_rpcs`
- `20260819152056_index_authoritative_v1_relationships`

Verified live architecture:
- 39 controlled measurement types, 32 active garment types, 21 controlled fit dimensions.
- `27.23 in` normalizes to `27.25 in` for quarter-inch measurement types; metric values normalize to canonical units.
- `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` resolve to one logical 30×30 size.
- `16.5 / 34-35`, `42R`, and `36D` decompose into structured dress-shirt, jacket and bra sizes.
- Current-person match engine reads current measurements only and excludes historical snapshots.
- Historical garment matcher compares viewer current measurements to the Fit Report snapshot.
- Product evidence is unique-wearer capped.
- Raw current/historical body measurements are owner-only; safe derived matches only are member-facing.
- Supabase security advisor: zero findings.
- Performance advisor: no unindexed foreign-key findings; only expected unused-index INFO notices while the DB has no application rows.

Exact pre-correction build checkpoint: GitHub `main` was `2fd2fcb` (`Add Outfit likes to canonical schema`). Search/discovery was complete. Outfit-like database support existed, but the Outfit likes UI + Fit-Twins-only outfit feed UI had not yet landed on canonical `main`. Resume that exact step after this architecture synchronization/verification; do not skip ahead.
