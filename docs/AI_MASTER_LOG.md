# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the **one and only LikeSized roadmap, status record, phase checklist, and AI handoff**. Repository policy lives in `AI_REPOSITORY_RULES.md`; product architecture lives in `docs/V1_PRODUCT_SPEC.md`; database/privacy behavior lives in `supabase/schema_contract.md`. If any old planning text conflicts with this guide, this guide wins and the stale planning text must be removed.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations. Approved changes modify canonical source; Git history is history.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Do not deploy production unless the owner explicitly authorizes it.
- Work Phases 0→7 in order without diversion. Ask the owner only for genuine product/business/cost/credential decisions.

## Product / privacy rules — LOCKED
**See what fits people built like you.** Primary question: **“How did this garment fit people built like me?”**

1. Current person/Fit Twin matching = current body ↔ current body.
2. Historical garment matching = viewer current body ↔ immutable body snapshot attached to that Fit Report.
3. Never blend those scores or rewrite historical Fit Report/body associations after a body change.
4. Recommendation aggregation uses at most one strongest observation per unique wearer.
5. Raw current/historical body measurements and normally-worn size references remain owner-private.
6. Private Closet items are owner-only; Shared evidence is member-readable. Any uploaded fit/reference photo is shared with authenticated members; there is no private fit-photo mode.
7. Original manufacturer size text is preserved while logical matching uses normalized sizing where possible.
8. V1 member identity is authenticated-member-only.
9. V1 People My Size UI is **Overall | Tops | Bottoms**. More garment-specific filters may be exposed later using the existing match-profile engine without a matching rewrite.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application data; repeatable verification uses disposable local Supabase CI.
- **21 canonical migrations** through `20260819183601_enforce_fit_report_dimension_garment_type.sql`.
- Supabase Security Advisor: **0 findings** after Phase 3.1 DDL.
- CI runs `npm ci`, typecheck, production build, fresh migration replay and all pgTAP database tests.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY — ✅ COMPLETE
- Missing early migrations recovered byte-for-byte from the deployed ledger.
- Ordered migration directory locked as sole replay history.
- One master guide, package lock and permanent CI established.
- Zero-added-cost disposable local Supabase replay verified.

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY — ✅ COMPLETE
- Private size references + measurements save atomically.
- Owner `/settings` supports display name/bio; avatar intentionally deferred until a storage design exists.
- Owner decision: member profiles are signed-in-member-only.
- Behavior suite **21/21**, privacy/RLS suite **16/16**, current-vs-historical integrity suite **14/14** all passed.

## PHASE 2 — PEOPLE MY SIZE / MATCHING — ✅ COMPLETE
- Controlled users verify Overall/Tops/Bottoms rankings, missing-measurement coverage, low-coverage tie behavior, no-overlap exclusion and raw-measurement privacy.
- Current scores recalculate from current body changes independently of historical garment evidence.
- PR #11 / CI `32285618067` passed the expanded **16-assertion** matching suite.
- Owner decision: V1 filters remain **Overall | Tops | Bottoms**; richer garment filters are deferred, not architecturally blocked.

## PHASE 3 — CLOSET & FIT REPORT COMPLETION — ▶️ IN PROGRESS

### 3.1–3.2 Garment-specific controlled Fit Report capture — ✅ COMPLETE
- `FitDimensionFields` shows only fit dimensions mapped to the selected garment type.
- Initial Closet logs and repeat observations both persist controlled responses to `fit_report_dimensions` on the immutable Fit Report.
- Server validation rejects invalid/duplicate mappings and invalid responses.
- Migration `20260819183601_enforce_fit_report_dimension_garment_type.sql` provides the final DB guard.
- `fit_report_dimensions.test.sql` verifies accepted/rejected combinations.
- Verification CI `32289232671` passed install, typecheck, build, all 21 migrations and every canonical DB test.
- Security Advisor: 0 findings.

### 3.3 Post Outfit latest-observation correctness — ▶️ VERIFICATION RUNNING
- `app/outfits/new/page.tsx` now orders Fit Reports newest-first and deliberately keeps the first/latest observation per Closet item.
- The picker labels the displayed result as **Latest fit**.
- Outfit storage still correctly references the Closet item rather than freezing a separate Fit Report ID; member-facing feed/history logic can resolve current appropriate evidence independently.
- Full CI gate must pass before 3.3 closes.

### 3.4 Brand/product search-before-create UX — QUEUED
Improve lookup/selection so users reuse canonical brands/products before creating records while preserving normalization/deduplication and product identity rules.

### 3.5 Closet integration/privacy verification — QUEUED
Test Private/Shared visibility, fit-photo forced sharing, history-safe edits, repeat try-ons, controlled dimension persistence and deletion cascades.

**Phase 3 exit:** Closet captures intended evidence and every history-sensitive surface intentionally selects the correct observation.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — QUEUED
1. Exact-variant targeting.
2. Product-family population/maintenance for non-fit-critical releases.
3. Controlled garment attributes/materials for Similar Garments evidence.
4. Exercise every evidence fallback tier and labels/ranking.
5. Calibrate confidence with multiple unique wearers/conflicting outcomes/incomplete coverage.

## PHASE 5 — FIT TWINS / SOCIAL / SEARCH — QUEUED
Re-test follow/unfollow, live Fit Twin scores, Shared Fit History, outfit creation/auto-sharing/likes/Fit-Twins feed and representative product/brand/member search. Comments remain outside V1 until moderation/reporting is intentionally designed.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — QUEUED
Replace homepage mock match data, remove dead prototype logic, configure production auth/Vercel environment settings, and run mobile/responsive/accessibility review. No production deploy without owner authorization.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun Security/Performance Advisors, and require green CI plus browser smoke verification before beta-ready.

## Exact next action
**Complete the Phase 3.3 CI gate. If green, merge this checkpoint and proceed immediately to Phase 3.4 brand/product search-before-create UX.**
