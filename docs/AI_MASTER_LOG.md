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
11. Similar Garments uses controlled Product construction attributes. V1 includes a controlled Primary material/fabric-family field rather than free-form composition percentages. Category-scoped attributes are allowed only on compatible Product categories.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application data; repeatable verification uses disposable local Supabase CI.
- **25 canonical migrations** through `20260819194010_controlled_primary_material_and_attribute_category.sql`.
- Supabase Security Advisor: **0 findings** after the Phase 4.3 attribute/material guard.
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
- Product pages expose Exact Product / Exact Variant targeting and Closet links carry the logged variant when present.
- Migration `20260819191518_validate_product_evidence_variant_target.sql` independently validates target-variant ownership in the evidence RPC.
- `product_evidence_variant_targeting.test.sql`: **12/12** assertions.
- PR #17 / CI `32292794210` passed full app checks, 23-migration replay and all DB tests.

### 4.2 Product-family population/maintenance — ✅ COMPLETE
- New Products receive a standalone Product Fit Family by default or may explicitly join a compatible intentional same-fit/cut family.
- No fuzzy-name family grouping and no normal member-side reassignment of existing shared Products.
- Migration `20260819192804_enforce_product_family_compatibility.sql` enforces brand + garment type + market/cut segment compatibility.
- `product_family_evidence.test.sql`: **11/11** assertions.
- PR #18 / CI `32293810777` passed full app checks, 24-migration replay and all DB tests.

### 4.3 Similar Garments attributes/materials — ✅ COMPLETE
- Controlled dictionary now includes fit/cut, rise, stretch, Primary material/fabric family, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- Add Garment renders only global + category-relevant controlled Product attributes.
- Product attributes are applied only when this flow truly creates a new canonical Product; reusing/deduplicating an existing Product preserves its established shared catalog attributes.
- Migration `20260819194010_controlled_primary_material_and_attribute_category.sql` adds controlled material options and the DB category-compatibility guard.
- `similar_garment_attributes.test.sql`: **10/10** assertions proving category rejection, exact attribute-overlap counts, Similar Garments rank 4 and non-overlap Brand + Garment Type rank 5.
- PR #19 / CI `32294768975` passed install, typecheck, production build, clean replay of all **25 migrations**, and every canonical database suite.
- Security Advisor after the attribute/material guard: 0 findings.

### 4.4 Evidence-tier exercise — ▶️ NEXT
Exercise Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit **simultaneously** with six distinct evidence wearers and assert labels, ranks, ordering and one-per-wearer behavior.

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
**PHASE 4.4 — build one controlled evidence-hierarchy test that reaches all six evidence tiers at once and proves exact ranks/order and one-per-unique-wearer behavior, then proceed to recommendation confidence calibration only after that hierarchy gate is green.**
