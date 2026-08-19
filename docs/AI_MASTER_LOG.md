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
10. Product Fit Families are intentional same-fit/cut groups only. No fuzzy-name auto-grouping. New products default to their own family unless the member explicitly selects a compatible existing family; family compatibility requires the same brand, garment type and market/cut segment.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application data; repeatable verification uses disposable local Supabase CI.
- **24 canonical migrations** through `20260819192804_enforce_product_family_compatibility.sql`.
- Supabase Security Advisor: **0 findings** after the Phase 4.2 family guard.
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
- Garment-specific controlled Fit Report capture works for first logs and repeat observations, with DB-level garment/dimension guards.
- Post Outfit picker intentionally uses the latest Fit Report observation.
- Add Garment searches/reuses exact canonical Product IDs before creation.
- Closet integration/privacy suite verifies Shared/Private transitions, fit-photo forced sharing, history and deletion cascades.
- Phase 3 final CI `32291185899` passed clean replay of 22 migrations and every canonical database suite; Security Advisor 0 findings.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ▶️ IN PROGRESS

### 4.1 Exact-variant targeting — ✅ COMPLETE
- Product pages load variants belonging to the displayed Product and expose an Exact Product / Exact Variant evidence target selector.
- Closet Product links carry the logged `variant_id` when present so users land on the exact garment variant they logged.
- Migration `20260819191518_validate_product_evidence_variant_target.sql` independently validates variant ownership inside the evidence RPC; foreign/invalid variant IDs cannot gain Exact Variant rank.
- Exact Variant remains rank 1 and falls back through Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit when needed.
- `product_evidence_variant_targeting.test.sql` runs **12 assertions** covering exact-variant priority, one-per-wearer behavior, other-variant Product evidence and safe foreign-variant fallback.
- PR #17 / CI `32292794210` passed install, typecheck, production build, clean replay of all 23 then-current migrations and every database suite.
- Security Advisor after the exact-variant migration: 0 findings.

### 4.2 Product-family population/maintenance — ✅ COMPLETE
- New canonical Products created through the single Closet flow receive a Product Fit Family at creation.
- Safe default: a new standalone family keyed to that product/style. A new Product may explicitly join an existing family only for a genuinely same-fit/cut non-fit-critical release.
- The Add Garment UI shows only compatible family choices after brand, garment type and market/cut segment line up. Choosing an existing exact Product does not expose family reassignment.
- Migration `20260819192804_enforce_product_family_compatibility.sql` enforces same brand + garment type + market/cut segment at the database boundary.
- Similar names alone never create family membership; existing shared canonical Products are not member-reassigned through the normal Data API path.
- `product_family_evidence.test.sql` runs **11 assertions** covering compatibility rejection, Product Family rank 3 and explicit-family evidence vs unlinked same-brand/type lookalikes.
- PR #18 / CI `32293810777` passed install, typecheck, production build, clean replay of all **24 migrations**, and every canonical database suite.
- Security Advisor after the family guard: 0 findings.

### 4.3 Similar Garments attributes/materials — ▶️ NEXT
- Existing controlled dictionary already covers fit/cut, rise, stretch level, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- Add a controlled V1 primary material/fabric-family signal, then capture only category-relevant controlled attributes when a new canonical Product is created. Reusing an existing Product must preserve its established attributes rather than letting a later Closet log silently rewrite shared catalog identity.
- Add a DB guard so category-scoped attributes cannot be attached to an incompatible Product category.

### 4.4 Evidence-tier exercise — QUEUED
Exercise all six fallback tiers together and verify labels/ranking with controlled data.

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
**PHASE 4.3 — extend the controlled garment-attribute dictionary with a V1 primary material/fabric-family signal, enforce category compatibility at the database boundary, capture relevant controlled attributes only when creating a new canonical Product, and verify Similar Garments evidence before proceeding to the all-tier hierarchy test.**
