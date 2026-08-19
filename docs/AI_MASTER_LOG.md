# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This file is the **one and only LikeSized project master guide, roadmap, status record, and AI handoff**.

Other repository documents have narrower jobs and must not maintain a competing build sequence:
- `AI_REPOSITORY_RULES.md` — repository/no-parallel-implementation policy.
- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` — agent instructions.
- `docs/V1_PRODUCT_SPEC.md` — authoritative product/fit architecture.
- `supabase/schema_contract.md` — authoritative database/privacy behavior.
- `supabase/migrations/README.md` — database replay ledger notes.
- `README.md` — repository orientation.

If another file contains an old next step, checklist, phase order, or handoff that conflicts with this guide, **this guide wins and the stale planning text must be removed**.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- Approved changes go directly into the canonical implementation. Do not create fixed/v2/backup/temp copies or parallel feature implementations. Git history is history.
- Database replay/deployment history is the ordered executable SQL in `supabase/migrations/`.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed LikeSized database instance, not a competing source of truth.
- Production deployment remains owner-controlled. Do not deploy merely because implementation/testing is complete.
- Work through the phases below in order. Do not divert to later feature work while an earlier phase has an unresolved exit criterion.
- Ask the owner only when an actual product/business/cost/credential decision is required; otherwise continue automatically.

## Product promise — LOCKED
**See what fits people built like you.**

Primary question: **“How did this garment fit people built like me?”**

Stack: Next.js + Supabase + Vercel target.

Privacy rule: exact current and historical body measurements are owner-private. Member-facing matching exposes safe derived match/evidence values, never another member’s raw measurements.

## Architecture rules that must not regress
1. **Current person / Fit Twin matching** = viewer current body vs other member current body.
2. **Historical garment matching** = viewer current body vs immutable Fit Profile snapshot attached to that specific Fit Report.
3. Never blend those two scores.
4. Changing current measurements never rewrites an older Fit Report/body association.
5. Product recommendation aggregation uses at most one strongest relevant observation per unique wearer.
6. Original manufacturer size text is preserved while matching uses controlled normalized sizing when possible.
7. Private Closet items are owner-only. Shared Closet evidence is member-readable. Fit/reference photo upload is optional, but any uploaded fit/reference photo is shared with authenticated members; there is no private fit-photo mode.
8. Controlled values drive matching/filtering/search/analytics where the architecture defines them; free text is supplemental/fallback.

## 2026-08-19 full canonical audit — current baseline
The full Next.js application, Supabase integration, matching/recommendation logic and product documentation are in GitHub. The separate LikeSized Supabase project exists. The live database currently contains no application users/data, so database-backed product flows are implemented but representative multi-user behavior still needs controlled verification in later phases.

Supabase Security Advisor was clean at the audit. Performance notices were unused-index INFO notices while the database was empty.

### Original-plan reconciliation
- Full V1 scaffold in GitHub: **IMPLEMENTED**.
- LikeSized Supabase project/auth/database: **IMPLEMENTED**.
- Fit Profile: **CORE IMPLEMENTED; completion/real-user verification remains Phase 1**.
- People My Size: **DATABASE-BACKED; validation remains Phase 2**.
- Closet logging: **MOSTLY IMPLEMENTED; richer controlled Fit Reports remain Phase 3**.
- Product fit/recommendation page: **CORE IMPLEMENTED; all fallback tiers are not yet operational from user-entered data; Phase 4**.
- Fit Twins/following/outfits/search: **MOSTLY IMPLEMENTED; final integration verification remains Phase 5**.
- Public homepage still contains prototype mock match cards: **must be removed/replaced in Phase 6**.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY
**Status: ✅ COMPLETE.**

Goal: GitHub can independently reproduce the application/database and every later phase has a reliable verification gate.

### 0.1 Recover complete deployed migration history — ✅ COMPLETE
The live Supabase ledger contained seven early migrations that were not present as files in GitHub. The exact executed SQL was recovered under the original timestamps/names:
1. `20260819132934_initial_likesized_schema.sql`
2. `20260819132948_fit_rating_relaxed_value.sql`
3. `20260819133114_index_relationships_and_streamline_profile_read.sql`
4. `20260819134229_private_closet_photo_storage.sql`
5. `20260819135959_harden_public_table_privileges.sql`
6. `20260819140445_member_readable_outfit_photo_storage.sql`
7. `20260819141225_outfit_likes.sql`

Before commit, each recovered file’s Git blob SHA was calculated independently from `supabase_migrations.schema_migrations` and matched the staged Git blob byte-for-byte. Canonical recovery commit: `4141995`.

The repository now contains all 14 migrations recorded by the connected project through `20260819152056_index_authoritative_v1_relationships`.

### 0.2 Lock the replay contract — ✅ COMPLETE
`supabase/migrations/README.md` and `supabase/schema_contract.md` define the 14-file migration directory as the only database replay/deployment history. `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only and are not layered onto a fresh migration replay.

### 0.3 One master guide — ✅ COMPLETE
This file is the only roadmap/status/handoff. Product spec, database contract, README and agent files do not own phase order.

### 0.4 Reproducible application verification — ✅ COMPLETE
- Permanent `.github/workflows/ci.yml` exists.
- Node 22 is used.
- Canonical `package-lock.json` was generated by GitHub Actions and committed as `c611056` only after `npm ci`, `npm run typecheck`, and `npm run build` succeeded.
- Current CI uses the committed lockfile and runs install/typecheck/build on main and pull requests.

### 0.5 Fresh database replay — ✅ COMPLETE
The owner declined the paid Supabase development-branch option, so verification was moved to a zero-added-cost disposable local Supabase database inside GitHub Actions rather than touching the connected project.

Canonical CI commit `69a6144` pins Supabase CLI `2.84.2`, initializes local Supabase only inside the runner, and executes `supabase db start` against the canonical `supabase/migrations/` directory.

Verification PR #1 (`Verify Phase 0 canonical replay`) ran CI run `32276450771`. The following steps all completed successfully:
- exact npm dependency install;
- TypeScript typecheck;
- Next.js production build;
- pinned Supabase CLI setup;
- disposable local Supabase initialization;
- replay of the complete canonical migration set on a fresh local database.

No paid Supabase branch was created and the connected LikeSized project was not modified by this replay. Verification documentation merged to `main` in commit `4a525ab`.

### 0.6 Resolve compile/type failures — ✅ COMPLETE FOR CURRENT HEAD
The verified Phase 0 run completed typecheck and Next.js build successfully. There are no known compile/type failures at the Phase 0 exit point.

**Phase 0 exit criterion: ✅ MET.** GitHub contains the complete executable migration history, clean database replay is proven, the npm dependency graph is lockfile-backed, and typecheck/build are green.

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY CONTROLS
**Status: ▶️ IN PROGRESS.**
1. Add private normally-worn size-reference UI backed by `user_size_references` for supported references such as bra/shoe sizing.
2. Add owner profile/privacy controls without weakening raw-measurement privacy.
3. Test unit switching, partial measurements, edit saves and immutable version creation/reuse.
4. Verify raw current/historical measurement RLS.
5. Verify body changes affect current matching without rewriting historical Fit Report snapshots.

**Exit criterion:** a real test user can create/edit/manage the complete private Fit Profile and historical body-state behavior is verified end to end.

## PHASE 2 — PEOPLE MY SIZE / MATCHING VERIFICATION
**Status: QUEUED.**
1. Create controlled test users with deliberately different upper/lower-body profiles.
2. Verify Overall/Tops/Bottoms ranking and missing-measurement coverage.
3. Verify current Fit Twin scores recalculate with current-body changes independently of historical garment evidence.
4. After validation only, decide whether richer garment-specific People My Size filters are necessary for V1 UI.

**Exit criterion:** expected relative rankings are demonstrated with real database users without exposing raw measurements.

## PHASE 3 — CLOSET & FIT REPORT COMPLETION
**Status: QUEUED.**
1. Build garment-specific controlled Fit Report inputs from existing dictionaries/taxonomy; show only dimensions relevant to the garment type.
2. Persist those responses to `fit_report_dimensions` for initial logs and later observations.
3. Make the Post Outfit picker explicitly display the latest Fit Report per Closet item.
4. Improve brand/product search-before-create UX while retaining canonical normalization/deduplication.
5. Test Private/Shared visibility, fit-photo forced sharing, history-safe editing, repeat try-ons and deletion cascades.

**Exit criterion:** Closet captures the evidence the authoritative schema was designed for and every history-sensitive surface intentionally selects the right observation.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATION COMPLETION
**Status: QUEUED.**
1. Add a real variant-targeting path so Exact Variant evidence is operational when viewing/selecting a specific variant.
2. Add canonical product-family population/maintenance for releases/colors/washes that should share fit evidence.
3. Populate controlled garment attributes/materials needed by Similar Garments evidence without asking irrelevant questions.
4. Exercise Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit with controlled data and verify labels/ranking.
5. Calibrate recommendation confidence with multiple unique wearers, conflicting outcomes and incomplete measurement coverage.

**Exit criterion:** every intended evidence tier is reachable from canonical data and recommendation confidence has been exercised rather than only coded.

## PHASE 5 — FIT TWINS / SOCIAL / SEARCH FINISH
**Status: QUEUED.**
1. Re-test follow/unfollow, current Fit Twin score refresh and Shared Fit History after Phases 1–4.
2. Re-test outfit creation, auto-sharing tagged private garments, likes and Fit-Twins-only feed.
3. Re-test search across products/brands/members with representative data.
4. Comments remain outside V1 until moderation/reporting is intentionally designed.

**Exit criterion:** social/discovery uses the finalized canonical current/historical evidence rules everywhere.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT
**Status: QUEUED.**
1. Replace homepage `lib/mock-data.ts` match cards/demo percentages with real data or clearly static non-fake marketing content.
2. Remove `lib/mock-data.ts` and other dead prototype-only logic once unused; verify `lib/fit.ts` usage before retaining/removing it.
3. Configure production `NEXT_PUBLIC_SITE_URL`, Supabase Site URL/redirect allow-list/email confirmation behavior and Vercel environment variables.
4. Run mobile/responsive/accessibility review across signup, Fit Profile, People, Closet, product evidence and outfits.

**Exit criterion:** no fabricated data is presented as live product state and deployment/auth configuration is production-ready.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION
**Status: QUEUED.**
1. Build a controlled test population covering different bodies, partial measurements, body changes, Shared/Private Closet items and repeated observations.
2. Smoke the full loop: signup → Fit Profile → People My Size → Fit Twin → Closet → repeat try-on → product recommendation → Shared Fit History → outfit → search.
3. Explicit privacy tests: other users cannot read current/historical raw measurements; Private Closet remains private; Shared reports/photos behave exactly as intended.
4. Re-run Supabase Security/Performance Advisors with representative data.
5. Require green CI plus browser smoke verification before calling V1 beta-ready.
6. Do not deploy production unless the owner explicitly authorizes deployment.

## Exact next action
**PHASE 1.1 — add the private normally-worn size-reference UI to the canonical Fit Profile flow using the existing `user_size_references` architecture.**

Continue through Phase 1 in order. Ask the owner only if an actual product/privacy decision cannot be resolved from the locked product specification and schema contract.
