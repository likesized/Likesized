# LikeSized ordered migrations

## Canonical rule — LOCKED
Every SQL file in this directory is part of the ordered executable database history used to reproduce LikeSized database state.

- The authoritative migration set is **the ordered files actually present in this directory**.
- Do **not** hard-code a total migration count in canonical documentation. The count changes as legitimate ordered migrations are added.
- Applied migrations are immutable. Future DB changes use new ordered migrations.
- Never replace migration SQL with prose, a pointer to the hosted database, a fixed/v2 copy, or an alternate schema file.
- `supabase/schema.sql` is retired and is not a current-state schema source.
- The connected Supabase project is an execution/deployment ledger; the repository migration directory is the replay source.

## Recovery rule — 2026-08-21
Canonical recovery is active. PR #36 (`fit-match-engine-audit`) contains owner-approved migrations that must be deliberately salvaged into the recovery line and independently replayed/tested before being considered recovered. Their existence on the old branch does not mean they were applied to production.

The exact preserved PR #36 migration filenames and salvage status live in `docs/AI_MASTER_LOG.md`.

## Naming debt
Some older migration filenames/types/functions contain `fit_twin` or `fit_rating` terminology from earlier product semantics. Do not infer current product meaning from those legacy identifiers:
- `follows` now means Following; Fit Twin is system-derived.
- legacy `fit_rating` naming may store physical Fit Result values; current V1 has no 1–5-star Fit Rating UI.

Any rename must be a deliberate forward migration/refactor with tests; never rewrite applied history to cosmetically rename old files.

## Verification
CI must replay the complete current directory on a fresh disposable Supabase database and run the canonical pgTAP/database behavior/privacy suite.

Whenever a DB/product decision changes, synchronize `docs/AI_MASTER_LOG.md`, `docs/V1_PRODUCT_SPEC.md`, and `supabase/schema_contract.md` in the same canonical change where applicable.