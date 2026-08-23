# LikeSized ordered migrations

## Canonical rule — LOCKED
Every SQL file in this directory is part of the ordered executable database history used to reproduce LikeSized database state.

- The authoritative migration set is **the ordered files actually present in this directory**.
- Do **not** hard-code a total migration count in canonical documentation. The count changes as legitimate ordered migrations are added.
- Applied migrations are immutable. Future DB changes use new ordered migrations.
- Never replace migration SQL with prose, a pointer to the hosted database, a fixed/v2 copy, or an alternate schema file.
- `supabase/schema.sql` is retired and is not a current-state schema source.
- The connected Supabase project is an execution/deployment ledger; the repository migration directory is the replay source.

## Canonical recovery status — COMPLETE 2026-08-21
The canonical recovery is complete. PR #43 promoted the verified recovery line to `main`.

The owner-approved Fit Match/database work preserved in PR #36 (`fit-match-engine-audit`) was deliberately classified and recovered/re-sequenced into the canonical migration history before that promotion. The old PR #36 branch is historical source only and is not an alternate migration authority.

The final salvage/cleanup disposition for PR #36 and other historical branches is recorded in `docs/AI_MASTER_LOG.md`.

## Current production checkpoint — 2026-08-23
The four PR #51 migration domains are live in production while their local filenames remain canonical replay history:
- `20260823130000_add_sleepwear_lingerie_category.sql` → hosted ledger `20260823153830`.
- `20260823130100_purchase_context_and_sleepwear_taxonomy.sql` → hosted ledger `20260823153856`.
- `20260823140000_add_fit_community_preference.sql` → hosted ledger `20260823153931`.
- `20260823150000_auto_post_provisional_products_and_item_reporting.sql` → hosted ledger `20260823154024`.

Never rename or rewrite the local applied files to match hosted-assigned timestamps.

## Naming debt
Some older migration filenames/types/functions contain `fit_twin` or `fit_rating` terminology from earlier product semantics. Do not infer current product meaning from those legacy identifiers:
- `follows` now means Following; Fit Twin is system-derived.
- legacy `fit_rating` naming may store physical Fit Result values; current V1 has no 1–5-star Fit Rating UI.

Any rename must be a deliberate forward migration/refactor with tests; never rewrite applied history to cosmetically rename old files.

## Verification
CI must replay the complete current directory on a fresh disposable Supabase database and run the canonical pgTAP/database behavior/privacy suite.

Whenever a DB/product decision changes, synchronize `docs/AI_MASTER_LOG.md`, `docs/V1_PRODUCT_SPEC.md`, and `supabase/schema_contract.md` in the same canonical change where applicable.