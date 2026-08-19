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
9. **V1 member identity is authenticated-member-only:** completed username/display name/bio may be discovered by signed-in LikeSized members, but anonymous visitors have no `profiles` SELECT access.

## 2026-08-19 full canonical audit — current baseline
The full Next.js application, Supabase integration, matching/recommendation logic and product documentation are in GitHub. The separate LikeSized Supabase project exists. The live database remains free of test-member/application data; representative behavior is verified in disposable local Supabase CI instead of polluting the deployed project.

Supabase Security Advisor has remained clean through the Phase 1 privacy/schema changes. Performance notices were unused-index INFO notices while the database was empty.

### Original-plan reconciliation
- Full V1 scaffold in GitHub: **IMPLEMENTED**.
- LikeSized Supabase project/auth/database: **IMPLEMENTED**.
- Fit Profile: **CORE IMPLEMENTED; behavior/privacy/history verification is active in Phase 1**.
- People My Size: **DATABASE-BACKED; validation remains Phase 2**.
- Closet logging: **MOSTLY IMPLEMENTED; richer controlled Fit Reports remain Phase 3**.
- Product fit/recommendation page: **CORE IMPLEMENTED; all fallback tiers are not yet operational from user-entered data; Phase 4**.
- Fit Twins/following/outfits/search: **MOSTLY IMPLEMENTED; final integration verification remains Phase 5**.
- Public homepage still contains prototype mock match cards: **must be removed/replaced in Phase 6**.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY
**Status: ✅ COMPLETE.**

Goal: GitHub can independently reproduce the application/database and every later phase has a reliable verification gate.

- All original 14 migrations present at Phase 0 exit; first seven recovered byte-for-byte from the deployed ledger.
- Ordered `supabase/migrations/` is the sole replay/deployment history; `schema.sql` / `storage.sql` are reference aids only.
- This file is the sole master guide.
- Canonical `package-lock.json` and `.github/workflows/ci.yml` exist.
- Zero-added-cost disposable local Supabase replay is used instead of a paid development branch.
- Phase 0 verification PR #1 / CI run `32276450771` passed install, typecheck, production build, CLI setup, and clean migration replay.

**Phase 0 exit criterion: ✅ MET.**

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY CONTROLS
**Status: ▶️ IN PROGRESS — 1.1/1.2 COMPLETE; 1.3 VERIFICATION RUNNING.**

### 1.1 Private normally-worn size references — ✅ COMPLETE
- Fit Profile reads/edits owner-private `user_size_references`.
- Bra and shoe references are structured; shirt/pants/dress/other are private reference context only.
- Migration `20260819164005_atomic_fit_profile_size_references.sql` makes measurements + size references one atomic current-state save before immutable-version creation/reuse.
- `save_fit_profile` remains SECURITY INVOKER under RLS.
- Phase 1.1 PR #2 / CI run `32277761390` passed install, typecheck, production build, and clean 15-migration replay.

### 1.2 Owner profile/privacy controls — ✅ COMPLETE
- Canonical `/settings` edits optional display name/bio and explains privacy state; header/self-profile link to the same owner settings surface.
- Avatar editing remains intentionally unexposed until an avatar Storage model is deliberately designed.
- Migration `20260819165124_profile_identity_constraints.sql` bounds profile identity fields.
- Owner decision locked: **V1 member profiles are signed-in-member-only**.
- Migration `20260819165756_member_only_profile_identity.sql` revokes anonymous profile SELECT and removes the anon profile-read policy.
- Live privilege verification: `anon` has no profile SELECT grant; remaining profile SELECT policy targets `authenticated` only.
- Security Advisor after change: **0 findings**.
- Phase 1.2 PR #3 / CI run `32279397793` passed install, typecheck, production build, and clean replay of all 17 then-current migrations; merged as `4d936f7`.

### 1.3 Fit Profile behavior verification — ▶️ IN PROGRESS
Goal: prove unit handling, partial profiles, edit replacement and immutable version reuse/change rather than relying on implementation inspection.

- While writing executable tests, a real regression was found: generic shirt/pants/dress/other references called `public.normalize_search_text` from the SECURITY INVOKER save even though authenticated EXECUTE had been intentionally revoked.
- Canonical fix `20260819170808_inline_private_size_reference_normalization.sql` keeps generic label normalization inline inside `save_fit_profile`; the general normalizer helper remains unexposed.
- `supabase/tests/fit_profile_behavior.test.sql` now exercises partial saves, structured + generic size references, canonical units, metric edits, current-state removals, immutable version creation/reuse and preservation of old snapshot rows.
- CI now runs `supabase test db` after every fresh local migration replay.
- Final Phase 1.3 test run must pass before 1.3 closes.

### 1.4 Raw measurement/privacy RLS verification — QUEUED
Add executable multi-user RLS tests proving current/historical raw measurements and private size references are owner-only.

### 1.5 Current-body vs historical-body behavior — QUEUED
Add executable history tests proving current body changes affect current matching without rewriting Fit Report snapshots/history.

**Phase 1 exit criterion:** the complete private Fit Profile and historical body-state rules are verified end to end in repeatable canonical tests.

## PHASE 2 — PEOPLE MY SIZE / MATCHING VERIFICATION
**Status: QUEUED.**
1. Create controlled disposable test users with deliberately different upper/lower-body profiles.
2. Verify Overall/Tops/Bottoms ranking and missing-measurement coverage.
3. Verify current Fit Twin scores recalculate with current-body changes independently of historical garment evidence.
4. After validation only, decide whether richer garment-specific People My Size filters are necessary for V1 UI.

**Exit criterion:** expected relative rankings are demonstrated without exposing raw measurements.

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
1. Add real exact-variant targeting.
2. Populate/maintain canonical product families where fit evidence should carry across non-fit-critical releases.
3. Populate controlled garment attributes/materials required by Similar Garments evidence.
4. Exercise every evidence fallback tier and verify labels/ranking.
5. Calibrate confidence with multiple unique wearers, conflicting outcomes and incomplete coverage.

**Exit criterion:** every intended evidence tier is reachable and recommendation confidence is exercised, not merely coded.

## PHASE 5 — FIT TWINS / SOCIAL / SEARCH FINISH
**Status: QUEUED.**
1. Re-test follow/unfollow, live Fit Twin scores and Shared Fit History after Phases 1–4.
2. Re-test outfit creation, auto-sharing tagged private garments, likes and Fit-Twins-only feed.
3. Re-test search across products/brands/members with representative data.
4. Comments remain outside V1 until moderation/reporting is intentionally designed.

**Exit criterion:** social/discovery uses finalized current/historical evidence rules everywhere.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT
**Status: QUEUED.**
1. Replace homepage mock match cards/demo percentages with real data or clearly static non-fake marketing content.
2. Remove dead prototype logic once unused.
3. Configure production site/auth/Vercel environment settings.
4. Run mobile/responsive/accessibility review across core routes.

**Exit criterion:** no fabricated data is presented as live state and deployment/auth configuration is production-ready.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION
**Status: QUEUED.**
1. Use a controlled test population covering different bodies, partial measurements, body changes, Shared/Private Closet items and repeated observations.
2. Smoke the full user loop.
3. Explicitly test all privacy boundaries.
4. Re-run Supabase Security/Performance Advisors with representative data.
5. Require green CI plus browser smoke verification before beta-ready.
6. Do not deploy production unless the owner explicitly authorizes deployment.

## Exact next action
**Complete the Phase 1.3 pgTAP CI gate, then proceed immediately to PHASE 1.4 — raw measurement/privacy RLS verification.**

Continue through phases in order. Ask the owner only when a genuine product/business/cost/credential decision is required.
