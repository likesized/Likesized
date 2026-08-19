# LikeSized AI Master Log

## Canonical repository rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for LikeSized source, architecture decisions, schema contract, **executable ordered migrations**, and project handoff state. Never create patch files, `*-fixed`, `*-patched`, `*-new`, `*-v2`, backups, temporary copies, or parallel implementations. Every approved change modifies canonical source/migrations/docs directly. Git history is the history.

The connected Supabase project is the deployed database instance and migration execution ledger. It is **not** allowed to be the only location containing migration SQL. Every migration required to reproduce the current database must exist as executable SQL in `supabase/migrations/`.

## 2026-08-19 — FINAL AUTHORITATIVE V1 ARCHITECTURE UPDATE
Status: applied to the connected Supabase project and synchronized into canonical GitHub `main`.

### Historical body-state rule — LOCKED
- Current Fit Match/Fit Twin percentages are current body vs. current body only.
- Fit Reports are permanently locked to an immutable Fit Profile version representing the wearer's body/size state when that observation was logged.
- Changing current measurements never moves or recalculates an older Fit Report onto the new body state.
- Product evidence compares the viewer's current body to each Fit Report's historical snapshot.
- Recommendation aggregation uses at most one strongest historical observation per unique wearer.
- Fit Profile saves are atomic and normalized; public profile/version RPCs run SECURITY INVOKER under RLS.

Canonical architecture is documented in `docs/V1_PRODUCT_SPEC.md` and `supabase/schema_contract.md`. Deployed authoritative migrations run through `20260819152056_index_authoritative_v1_relationships`. Supabase security advisor is clean; performance has no unindexed-FK findings.

### Canonical migration correction — LOCKED
A verification pass found that several repository migration files had been written as prose pointers to the hosted Supabase ledger even though GitHub is the locked source of truth. That was corrected in-place on canonical `main`: the authoritative V1 architecture, immutable snapshot, historical evidence, atomic Fit Profile save, RPC hardening, and relationship-index migration files now contain executable SQL. No replacement/v2/patch migration set was created.

Rule for all future sessions: **never commit a migration placeholder whose real SQL exists only in Supabase.** Supabase should be reproducible from the repository, not the reverse.

## 2026-08-19 — SOCIAL BUILD STEP COMPLETE
Canonical commit `3628c2e` adds Outfit like/unlike UI and All Outfits / Fit Twins feed tabs. The Fit Twins feed uses the existing `follows` relationship. Because a Closet item may have multiple historical Fit Reports, outfit garment tags deliberately display the latest visible Fit Report rather than an arbitrary historical row. Open comments remain deferred until moderation/reporting exists.

## 2026-08-19 — CLOSET EDIT/REMOVE STEP
Canonical source supports owner editing without rewriting history:
- Current Closet settings can change visibility and wear count.
- A Shared fit/reference photo blocks switching the item to Private until the photo is removed, preserving the locked fit-photo sharing rule.
- Re-trying the same garment after a body change creates a **new Fit Report observation** tied to the current immutable Fit Profile version. Older observations remain unchanged.
- Closet and outfit surfaces intentionally choose the latest visible observation when they need a single current display value.
- Deleting a garment is explicit and removes the Closet item and its dependent Fit Report/history/tag/photo metadata while leaving canonical product catalog records intact.

### Exact next build step
**Profile/privacy controls before public beta.**
