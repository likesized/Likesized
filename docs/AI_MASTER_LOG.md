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
- Production deployment remains owner-controlled. Do not deploy merely because implementation/testing is complete.
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
10. **V1 People My Size UI stays Overall | Tops | Bottoms.** Garment-specific match profiles remain available under the hood and may be exposed later without rebuilding the matching engine.

## Current canonical baseline — 2026-08-19
- Full Next.js application, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase contains no deliberate test-member/application data; repeatable verification uses disposable local Supabase in CI.
- Live migration ledger and GitHub contain **21 migrations** through `20260819183601_enforce_fit_report_dimension_garment_type.sql`.
- Supabase Security Advisor: **0 findings** after the Phase 3.1 DDL change.
- Canonical CI performs `npm ci`, typecheck, production build, fresh migration replay, and pgTAP database tests.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY
**Status: ✅ COMPLETE.**
- Missing early migrations recovered byte-for-byte from the Supabase ledger.
- Ordered migration directory locked as sole replay history.
- One master guide locked.
- `package-lock.json` + permanent CI established.
- Zero-added-cost disposable local Supabase replay used instead of a paid branch.
- Phase 0 verification passed install, typecheck, build and clean migration replay.

**Exit criterion: ✅ MET.**

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY CONTROLS
**Status: ✅ COMPLETE.**
- Private normally-worn size references are editable and saved atomically with measurements.
- `/settings` edits supported member identity fields; avatar remains intentionally unexposed until a deliberate Storage design exists.
- Owner decision locked: member profiles are signed-in-member-only.
- Behavior suite: **21/21** assertions passed.
- Multi-user privacy/RLS suite: **16/16** assertions passed.
- Current-vs-historical body integrity suite: **14/14** assertions passed.
- Current matching and historical garment matching remain separate by architecture and tests.

**Exit criterion: ✅ MET.**

## PHASE 2 — PEOPLE MY SIZE / MATCHING VERIFICATION
**Status: ✅ COMPLETE.**
- `supabase/tests/people_my_size_matching.test.sql` uses controlled disposable users with deliberately different upper/lower-body profiles.
- Overall/Tops/Bottoms relative ranking is verified.
- Missing-measurement behavior is verified: a partial profile may have a high score on shared evidence but carries reduced coverage; a member with no relevant overlap is excluded.
- Raw candidate measurements remain unreadable to the viewer.
- Current-body recalculation is verified: changing top-relevant current measurements changes Tops and Overall immediately while Bottoms remains unchanged when its relevant inputs are unchanged.
- PR #10 validated the initial controlled ranking/coverage suite.
- PR #11 / CI `32285618067` validated the expanded **16-assertion** People My Size suite and was merged.
- **Owner decision locked:** keep V1 People My Size filters at **Overall | Tops | Bottoms**. Do not expose a long garment-specific filter list in V1. The underlying match-profile architecture remains extensible for later Jeans/Work Shirt/Bra/etc. filters without a full matching rewrite.

**Exit criterion: ✅ MET.**

## PHASE 3 — CLOSET & FIT REPORT COMPLETION
**Status: ▶️ IN PROGRESS — GARMENT-SPECIFIC FIT REPORT CAPTURE COMPLETE; NEXT = POST OUTFIT LATEST-OBSERVATION RULE.**

### 3.1–3.2 Garment-specific controlled Fit Report capture — ✅ COMPLETE
- `app/closet/FitDimensionFields.tsx` renders only the controlled fit dimensions mapped to the selected garment type.
- First-time Closet logging and later repeat observations both write selected controlled responses to `fit_report_dimensions` on the immutable Fit Report for that try-on.
- Server validation rejects duplicate dimensions, dimensions not mapped to the selected garment type, and responses not defined for the selected dimension.
- Migration `20260819183601_enforce_fit_report_dimension_garment_type.sql` adds the final database trigger guard so invalid garment/dimension combinations cannot bypass the application.
- `supabase/tests/fit_report_dimensions.test.sql` verifies valid mapped responses are accepted and invalid dimension/response combinations are rejected.
- PR #12 was a verification-only branch and was deliberately **closed without merge** so its temporary marker never entered canonical `main`.
- CI run `32289232671` passed install, typecheck, production build, clean replay of all 21 migrations, and every canonical database test.
- Security Advisor after the new trigger: **0 findings**.

### 3.3 Post Outfit history correctness — ▶️ NEXT
Make the Post Outfit garment picker deliberately choose/display the **latest Fit Report observation** for each Closet item, matching the already history-safe Closet/feed behavior.

### 3.4 Brand/product search-before-create UX — QUEUED
Improve lookup/selection so members reuse canonical brands/products before creating new records while preserving normalization/deduplication and product identity rules.

### 3.5 Closet integration/privacy verification — QUEUED
Test Private/Shared visibility, fit-photo forced sharing, history-safe settings edits, repeat try-ons, controlled dimension persistence and deletion cascades.

**Phase 3 exit criterion:** Closet captures the evidence the authoritative schema was designed for and every history-sensitive surface intentionally selects the correct observation.

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
1. Use a controlled test population covering body differences, partial measurements, body changes, Shared/Private Closet items and repeated observations.
2. Smoke the full user loop.
3. Explicitly test privacy boundaries.
4. Re-run Security/Performance Advisors with representative data.
5. Require green CI + browser smoke verification before beta-ready.
6. Never deploy production without explicit owner authorization.

## Exact next action
**PHASE 3.3 — inspect and correct the Post Outfit garment picker so every Closet item intentionally uses its latest Fit Report observation, then verify that change before proceeding to brand/product search-before-create UX.**
