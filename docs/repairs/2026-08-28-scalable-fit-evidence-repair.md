# 2026-08-28 scalable fit-evidence repair

## Reported regression

After representative QA data was seeded into production, core member routes became slow and tagged Outfit garments began showing `Relevant Fit Reports: unavailable`.

Observed production failures included repeated Postgres statement timeouts in the canonical fit/evidence read paths and UUID filters receiving the literal value `null`.

## Frozen repair scope

- Keep the representative QA population in place; do not delete data to hide the scaling failure.
- Preserve current Fit Match scoring, Fit Twin designation, Product evidence hierarchy, recommendation semantics, wording and navigation.
- Replace repeated category scans with one bounded set-wise Fit Match read.
- Deduplicate superseded Product evidence before expensive historical scoring.
- Share Product-specific historical scoring work across candidate snapshots.
- Remove Explore's per-Product RPC fan-out by using one bounded summary RPC.
- Count Outfit tagged-garment exact evidence without invoking the entire FITuition hierarchy.
- Reject invalid/null Product IDs before UUID `IN` filters.

## Production status

This repair is branch/PR-only until the exact merge candidate passes repository verification and the owner separately authorizes production promotion. The QA population remains present so the repaired implementation must prove itself against realistic cardinality.
