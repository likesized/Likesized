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
- Approved changes go directly into canonical files. Never create fixed/v2/backup/temp copies or parallel feature implementations. Git history is history.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Production deployment remains owner-controlled.
- Work through phases below in order. Do not divert while an earlier exit criterion is unresolved.
- Ask the owner only for a genuine product/business/cost/credential decision; otherwise continue automatically.

## Product promise — LOCKED
**See what fits people built like you.**

Primary question: **“How did this garment fit people built like me?”**

Stack: Next.js + Supabase + Vercel target.

Privacy: exact current/historical body measurements and normally-worn size references are owner-private. Member-facing matching exposes safe derived values, never another member’s raw Fit Profile data.

## Architecture rules that must not regress
1. **Current person / Fit Twin matching** = viewer current body vs other member current body.
2. **Historical garment matching** = viewer current body vs immutable Fit Profile snapshot attached to that Fit Report.
3. Never blend current-person and historical-garment scores.
4. Current-body changes never rewrite an older Fit Report/body association.
5. Product recommendation aggregation uses at most one strongest relevant observation per unique wearer.
6. Preserve original manufacturer size text; use normalized sizing for logical matching when possible.
7. Private Closet items are owner-only. Shared Closet evidence is member-readable. Fit/reference photo upload is optional, but any uploaded fit/reference photo is shared with authenticated members; no private fit-photo mode exists.
8. Controlled values drive matching/filtering/search/analytics where defined; free text is supplemental/fallback.
9. **V1 member identity is authenticated-member-only.** Completed username/display name/bio may be found by signed-in LikeSized members; anonymous visitors have no `profiles` SELECT access.

## Current canonical baseline — 2026-08-19
- Full Next.js application, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase contains no deliberate test-member/application data; repeatable verification uses disposable local Supabase in CI.
- Live migration ledger and GitHub contain **20 migrations** through `20260819174045_restore_current_match_helper_execute.sql`.
- Supabase Security Advisor remained at **0 findings** through Phase 1 schema/privacy changes.
- Canonical CI performs `npm ci`, typecheck, production build, fresh migration replay, and pgTAP database tests.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY
**Status: ✅ COMPLETE.**
- Missing early migrations recovered byte-for-byte from Supabase ledger.
- Ordered migration directory locked as sole replay history.
- One master guide locked.
- `package-lock.json` + permanent CI established.
- Zero-added-cost disposable local Supabase replay used instead of a paid branch.
- PR #1 / CI `32276450771` passed install, typecheck, build and clean replay.

**Exit criterion: ✅ MET.**

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY CONTROLS
**Status: ▶️ IN PROGRESS — 1.1–1.4 COMPLETE; 1.5 FINAL GATE.**

### 1.1 Private normally-worn size references — ✅ COMPLETE
- Fit Profile reads/edits owner-private size references.
- Structured bra/shoe; shirt/pants/dress/other are private reference context only.
- `20260819164005_atomic_fit_profile_size_references.sql` makes measurements + size references one atomic save before immutable-version creation/reuse.
- PR #2 / CI `32277761390` passed app checks and clean replay.

### 1.2 Owner profile/privacy controls — ✅ COMPLETE
- Canonical `/settings` edits optional display name/bio and explains privacy state.
- Avatar editing intentionally remains unexposed until an avatar Storage design exists.
- Owner decision locked: **signed-in-member-only member profiles**.
- `20260819165124_profile_identity_constraints.sql` bounds identity fields.
- `20260819165756_member_only_profile_identity.sql` removes anonymous profile reads.
- Live privilege verification confirms `anon` has no `profiles` SELECT; Security Advisor 0 findings.
- PR #3 / CI `32279397793` passed.

### 1.3 Fit Profile behavior verification — ✅ COMPLETE
- Fixed generic private size-reference normalization without reopening the general normalizer helper.
- `20260819170808_inline_private_size_reference_normalization.sql` keeps normalization inside SECURITY INVOKER `save_fit_profile`.
- `supabase/tests/fit_profile_behavior.test.sql` proves partial saves, unit normalization, atomic refs, current-state replacement and immutable version creation/reuse.
- CI `32280574740`: **21/21 behavior assertions passed** plus app checks/replay.

### 1.4 Raw measurement/privacy RLS verification — ✅ COMPLETE
- `supabase/tests/fit_profile_privacy_rls.test.sql` uses two authenticated identities plus `anon`.
- Proves owner-only current/historical raw Fit Profile data, cross-user write/delete protection, signed-in identity discovery and anonymous denial.
- CI `32281527759`: **16/16 privacy assertions passed** plus app checks/replay.

### 1.5 Current-body vs historical-body integrity — ▶️ FINAL VERIFICATION
- `supabase/tests/fit_profile_history_integrity.test.sql` proves old/new garment observations remain tied to v1/v2 immutable body snapshots while current-person matching follows current body state.
- The history gate exposed a real ambiguity in `private.calculate_fit_matches_for_profile`; `20260819173357_qualify_current_match_profile_owner.sql` fixes the owner lookup with explicit table aliases.
- Re-running then exposed a permission regression caused by that function recreation: the authoritative architecture intentionally allows authenticated EXECUTE on this **one** SECURITY DEFINER current-match helper because it derives the viewer from `auth.uid()` and returns only safe identity/match/coverage values. Raw measurements remain private and all other private helpers remain restricted.
- `20260819174045_restore_current_match_helper_execute.sql` restores exactly that narrow architecture grant. `get_fit_matches` and `get_garment_fit_matches` remain SECURITY INVOKER public wrappers.
- Live verification confirms authenticated EXECUTE is present on `private.calculate_fit_matches_for_profile(text,integer)` and no raw measurement access was broadened.
- Final CI must pass all Fit Profile behavior/privacy/history suites plus a fresh replay of all 20 migrations before Phase 1 closes.

**Phase 1 exit criterion:** complete private Fit Profile + current-vs-historical body-state behavior is proven by repeatable canonical tests.

## PHASE 2 — PEOPLE MY SIZE / MATCHING VERIFICATION
**Status: QUEUED.**
1. Create controlled disposable users with deliberately different upper/lower-body profiles.
2. Verify Overall/Tops/Bottoms ranking and missing-measurement coverage.
3. Verify current Fit Twin scores recalculate with current-body changes independently of historical garment evidence.
4. **Owner decision after validation:** decide whether richer garment-specific People My Size filters belong in V1 UI.

**Exit criterion:** expected relative rankings are demonstrated without exposing raw measurements.

## PHASE 3 — CLOSET & FIT REPORT COMPLETION
**Status: QUEUED.**
1. Build garment-specific controlled Fit Report inputs from existing dictionaries/taxonomy; show only relevant dimensions.
2. Persist responses to `fit_report_dimensions` for first logs and later observations.
3. Make Post Outfit picker deliberately use the latest Fit Report per Closet item.
4. Improve brand/product search-before-create UX while preserving canonical normalization/deduplication.
5. Test Private/Shared visibility, fit-photo forced sharing, history-safe editing, repeat try-ons and deletion cascades.

**Exit criterion:** Closet captures the evidence the authoritative schema was designed for and history-sensitive surfaces intentionally select the correct observation.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATION COMPLETION
**Status: QUEUED.**
1. Add real exact-variant targeting.
2. Populate/maintain product families where non-fit-critical releases should share fit evidence.
3. Populate controlled garment attributes/materials needed for Similar Garments evidence.
4. Exercise every fallback tier and verify labels/ranking.
5. Calibrate confidence with multiple unique wearers, conflicting outcomes and incomplete coverage.

**Exit criterion:** every intended evidence tier is reachable and recommendation confidence is exercised, not merely coded.

## PHASE 5 — FIT TWINS / SOCIAL / SEARCH FINISH
**Status: QUEUED.**
1. Re-test follow/unfollow, live Fit Twin scores and Shared Fit History after Phases 1–4.
2. Re-test outfit creation, auto-sharing tagged private garments, likes and Fit-Twins-only feed.
3. Re-test product/brand/member search with representative data.
4. Comments remain outside V1 until moderation/reporting is intentionally designed.

**Exit criterion:** social/discovery consumes finalized current/historical evidence rules everywhere.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT
**Status: QUEUED.**
1. Replace homepage mock match cards/demo percentages with real data or clearly static non-fake marketing content.
2. Remove dead prototype-only logic once unused.
3. Configure production site/auth/Vercel environment settings.
4. Run mobile/responsive/accessibility review across core routes.

**Exit criterion:** no fabricated data is presented as live state and deployment/auth configuration is production-ready.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION
**Status: QUEUED.**
1. Use controlled test population covering body differences, partial measurements, body changes, Shared/Private Closet items and repeated observations.
2. Smoke the full user loop.
3. Explicitly test privacy boundaries.
4. Re-run Security/Performance Advisors with representative data.
5. Require green CI + browser smoke verification before beta-ready.
6. Never deploy production without explicit owner authorization.

## Exact next action
**Complete the Phase 1.5 matcher/history-integrity CI gate from the 20-migration canonical head. If green, mark PHASE 1 complete and proceed immediately to PHASE 2.1 matching verification.**
