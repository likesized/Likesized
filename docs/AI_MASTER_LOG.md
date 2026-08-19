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
- **Owner checkpoint after Phase 4:** once Phase 4 is 100% complete and fully verified, stop before beginning any Phase 5 work and prompt the owner for the addition they want to make.

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
- **22 canonical migrations** through `20260819190312_enforce_shared_fit_photo_invariant.sql`.
- Supabase Security Advisor: **0 findings** after the completed Phase 3 DDL.
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

## PHASE 3 — CLOSET & FIT REPORT COMPLETION — ✅ COMPLETE

### 3.1–3.2 Garment-specific controlled Fit Report capture — ✅ COMPLETE
- `FitDimensionFields` shows only controlled dimensions mapped to the selected garment type.
- Initial Closet logs and repeat observations persist those responses to the immutable Fit Report for that try-on.
- Server validation rejects invalid/duplicate mappings and invalid responses.
- Migration `20260819183601_enforce_fit_report_dimension_garment_type.sql` provides the DB-level garment/dimension guard.
- CI `32289232671` passed install, typecheck, build, all 21 then-current migrations and every canonical DB test.

### 3.3 Post Outfit latest-observation correctness — ✅ COMPLETE
- `app/outfits/new/page.tsx` orders Fit Reports newest-first and deliberately displays the first/latest observation per Closet item.
- Outfit posts continue to store the Closet-item relationship rather than freezing an arbitrary Fit Report ID.
- CI `32289775049` passed the full verification gate.

### 3.4 Brand/product search-before-create UX — ✅ COMPLETE
- Add Garment now searches existing canonical products before creation.
- Choosing an existing match carries its exact `product_id` and fills canonical brand, product, garment type, market/cut segment and known Style ID.
- Server-side exact selection re-fetches the Product ID and verifies all submitted canonical identity fields still match before reuse; tampering/stale identity falls back to failure rather than silently attaching the wrong product.
- Editing an identity field clears the exact selection and returns to the single existing normalized get-or-create path. No parallel catalog workflow exists.
- CI `32290535340` passed install, typecheck, production build, full 21-migration replay and every database test then present.

### 3.5 Closet integration/privacy verification — ✅ COMPLETE
- Migration `20260819190312_enforce_shared_fit_photo_invariant.sql` closes the remaining database-level privacy gap: fit-photo metadata must match the Closet owner and may exist only on a Shared Closet item; a Shared item with a fit photo cannot become Private until photo metadata is removed.
- `closet_integration_privacy.test.sql` runs **32 assertions** with two independent authenticated members.
- Verified: Private vs Shared visibility, Shared Fit Report/dimension visibility, repeat observations, controlled-dimension persistence, cross-user update protection, fit-photo forced sharing, privacy transitions, outfit-item visibility and deletion cascades.
- Closet deletion cascades Fit Reports, fit dimensions, fit-photo metadata and outfit item links while preserving the canonical Product and outfit post.
- CI `32291185899` passed install, typecheck, production build, clean replay of all **22 migrations**, and every canonical database suite.
- Supabase Security Advisor after Phase 3 completion: **0 findings**.

**Phase 3 exit criterion: ✅ MET.** Closet captures the intended evidence and history/privacy-sensitive surfaces intentionally select and expose the correct state.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ▶️ IN PROGRESS

### 4.1 Exact-variant targeting — ▶️ IN PROGRESS
- Product-page variant selector implementation has begun.
- Closet Product links now carry the logged `variant_id` when one exists so the member lands on the exact garment variant they logged.
- Database target validation is being added so a variant can receive Exact Variant rank only when it actually belongs to the displayed target product.
- Preserve fallback to Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit when exact-variant evidence is insufficient.

### 4.2 Product-family population/maintenance — QUEUED
Populate/maintain product families only where non-fit-critical releases should intentionally share fit evidence.

### 4.3 Similar Garments attributes/materials — QUEUED
Capture controlled construction/material attributes needed for useful Similar Garments evidence.

### 4.4 Evidence-tier exercise — QUEUED
Exercise every fallback tier and verify labels/ranking with controlled data.

### 4.5 Recommendation confidence calibration — QUEUED
Calibrate confidence using multiple unique wearers, conflicting outcomes and incomplete measurement coverage.

**Phase 4 exit:** every intended evidence tier is reachable, correctly labeled/ranked, and recommendation confidence has been exercised with representative evidence.

## OWNER CHECKPOINT AFTER PHASE 4 — ⏸️ REQUIRED BEFORE PHASE 5
When Phase 4 exit is fully met and verified, **STOP**. Do not begin Phase 5. Prompt the owner for the new addition they said they want to make before Phase 5 begins. Incorporate that decision into this sole master guide before resuming the phase sequence.

## PHASE 5 — FIT TWINS / SOCIAL / SEARCH — QUEUED / OWNER HOLD
Re-test follow/unfollow, live Fit Twin scores, Shared Fit History, outfit creation/auto-sharing/likes/Fit-Twins feed and representative product/brand/member search. Comments remain outside V1 until moderation/reporting is intentionally designed. **Do not start until the post-Phase-4 owner checkpoint is resolved.**

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — QUEUED
Replace homepage mock match data, remove dead prototype logic, configure production auth/Vercel environment settings, and run mobile/responsive/accessibility review. No production deploy without owner authorization.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun Security/Performance Advisors, and require green CI plus browser smoke verification before beta-ready.

## Exact next action
**PHASE 4.1 — complete and verify the validated Product-page exact-variant evidence target, including database ownership validation and controlled tests proving Exact Variant outranks Exact Product without disabling broader fallback evidence.**
