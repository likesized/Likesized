# LikeSized AI Master Log

## Canonical repository rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for LikeSized source, architecture decisions, schema contract, ordered migration ledger, and project handoff state. Never create patch files, `*-fixed`, `*-patched`, `*-new`, `*-v2`, backups, temporary copies, or parallel implementations. Every approved change modifies canonical source/migrations/docs directly. Git history is the history. The connected Supabase project is the deployed database instance/operational migration ledger, not a competing project record.

## 2026-08-19 — FINAL AUTHORITATIVE V1 ARCHITECTURE UPDATE
Status: applied and synchronized to canonical GitHub `main` in commit `8d535f2`.

Authoritative product rule: LikeSized answers **“How did this garment fit people built like me?”** using private body measurements, garment-specific matching, canonical product/variant/family/listing identity, real Fit Reports, and member-shared fit/reference photos.

### Historical body-state rule — LOCKED
- Current Fit Match/Fit Twin percentages are **current body vs. current body only**.
- Fit Reports are permanently locked to an immutable Fit Profile version representing the wearer's body/size state when that observation was logged.
- Changing current measurements never moves or recalculates an older Fit Report onto the new body state.
- Product evidence compares the viewer's current body to each Fit Report's historical snapshot.
- Shared member profiles retain legitimate old shared garment observations and label their safe historical match separately from current-person match scores.
- Recommendation aggregation uses at most one strongest historical observation per unique wearer. Multiple observations remain in history but never let one prolific member inflate the number of people or confidence.
- Fit Profile saves are atomic: replace current normalized measurements + commit/reuse immutable current version in one DB transaction.
- Public profile/version RPCs are SECURITY INVOKER under RLS; immutable snapshot creation is confined to a narrow private auth.uid()-bound helper.

Canonical architecture is documented in `docs/V1_PRODUCT_SPEC.md` and `supabase/schema_contract.md`. Deployed authoritative migrations run through `20260819152056_index_authoritative_v1_relationships`.

Verified live architecture:
- 39 controlled measurement types, 32 active garment types, 21 controlled fit dimensions.
- Quarter-inch/manual precision and metric canonical normalization work.
- Structured pants/dress-shirt/jacket/bra sizing normalization works.
- Current-person match engine reads current measurements only and excludes historical snapshots.
- Historical garment matcher compares viewer current measurements to the Fit Report snapshot.
- Product evidence is unique-wearer capped.
- Raw current/historical body measurements are owner-only; safe derived matches only are member-facing.
- Supabase security advisor: zero findings.
- Performance advisor: no unindexed foreign-key findings; only expected unused-index INFO notices while the DB has no application rows.

## 2026-08-19 — SOCIAL BUILD STEP RESUMED
Outfit likes UI and the Fit-Twins-only outfit feed are now implemented on the canonical source path. The All Outfits / Fit Twins feed tabs use the existing `follows` relationship; like/unlike actions use the existing `outfit_likes` table and RLS. Because one Closet item may now have multiple historical Fit Reports, outfit garment tags intentionally display the latest visible Fit Report rather than selecting an arbitrary history row.

Open comments remain deferred until moderation/reporting exists.

### Exact next build step
**Closet garment edit/remove controls.** Preserve canonical architecture and historical Fit Report immutability while designing edits/deletes.
