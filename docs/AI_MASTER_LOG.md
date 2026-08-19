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
- The post-Phase-4 owner checkpoint is **resolved** by the explicit V1 Following Feed decision recorded below. Phase 5 may begin with that functionality included.

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
12. Product evidence fallback order is locked and verified: **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
13. **Following Feed is V1.** Members can follow useful Fit Twins / People My Size and continue learning from their future Shared fit activity. The dedicated feed includes meaningful new fit content from followed members: Shared Closet additions, new Fit Report observations/re-try-ons, and outfit posts. Likes are not feed events. Private Closet activity never appears.
14. A Following Feed card may show the followed member's **current relevant Fit Match** (Overall/Tops/Bottoms as appropriate) as relationship context. That current-person score is never substituted for the historical snapshot match attached to a garment Fit Report.
15. **Fit Twin activity notifications are V1.** Followed-member Shared fit activity can generate in-app activity notifications. Exact notification default/quieting controls may be finalized during Phase 5 UX implementation, but the notification capability itself is not deferred beyond V1.

## Current baseline — 2026-08-19
- Full Next.js app, Supabase integration, matching/recommendation logic and canonical docs are in GitHub.
- Live Supabase has no deliberate test-user/application data; repeatable verification uses disposable local Supabase CI.
- **25 canonical migrations** through `20260819194010_controlled_primary_material_and_attribute_category.sql`.
- Supabase Security Advisor: **0 findings** after final Phase 4 verification.
- CI runs `npm ci`, typecheck, the production recommendation-confidence calibration, production build, fresh migration replay and all pgTAP database tests.

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

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ✅ 100% COMPLETE

### 4.1 Exact-variant targeting — ✅ COMPLETE
- Product pages expose Exact Product / Exact Variant targeting and Closet links carry the logged variant when present.
- Migration `20260819191518_validate_product_evidence_variant_target.sql` independently validates target-variant ownership in the evidence RPC; a foreign/invalid variant cannot receive Exact Variant rank.
- `product_evidence_variant_targeting.test.sql`: **12/12** assertions.
- PR #17 / CI `32292794210` passed full app checks, 23-migration replay and all DB tests.

### 4.2 Product-family population/maintenance — ✅ COMPLETE
- New Products receive a standalone Product Fit Family by default or may explicitly join a compatible intentional same-fit/cut family.
- No fuzzy-name family grouping and no normal member-side reassignment of existing shared Products.
- Migration `20260819192804_enforce_product_family_compatibility.sql` enforces brand + garment type + market/cut segment compatibility.
- `product_family_evidence.test.sql`: **11/11** assertions.
- PR #18 / CI `32293810777` passed full app checks, 24-migration replay and all DB tests.

### 4.3 Similar Garments attributes/materials — ✅ COMPLETE
- Controlled dictionary includes fit/cut, rise, stretch, Primary material/fabric family, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- Add Garment renders only global + category-relevant controlled Product attributes.
- Product attributes are applied only when this flow truly creates a new canonical Product; reusing/deduplicating an existing Product preserves its established shared catalog attributes.
- Migration `20260819194010_controlled_primary_material_and_attribute_category.sql` adds controlled material options and the DB category-compatibility guard.
- `similar_garment_attributes.test.sql`: **10/10** assertions.
- PR #19 / CI `32294768975` passed full app checks, 25-migration replay and every canonical DB suite.

### 4.4 Full evidence hierarchy — ✅ COMPLETE
- `product_evidence_full_hierarchy.test.sql` creates six distinct evidence wearers and exercises every tier simultaneously.
- **18/18 assertions passed**: Exact Variant rank 1, Exact Product 2, Product Family 3, Similar Garments 4, Brand + Garment Type 5, Category Fit 6.
- The test also proves one strongest historical observation per unique wearer when the same wearer has stronger and weaker records.
- PR #20 / CI `32295291639` passed typecheck, production build, clean 25-migration replay and every database suite.

### 4.5 Recommendation confidence calibration — ✅ COMPLETE
- `tests/recommendation-confidence.test.ts` calls the production `recommendSize()` function directly; no copied scoring formula or test-only recommendation engine exists.
- Permanent CI step **Recommendation confidence calibration** runs before the production build.
- **9/9 calibration cases passed**, exercising:
  - 50% historical body-match eligibility floor,
  - unique-wearer/sample-strength growth,
  - incomplete measurement coverage,
  - weaker historical match quality,
  - evidence-tier exactness,
  - conflicting fit outcomes,
  - competing supported sizes,
  - Similar Garments attribute overlap,
  - buy-again weighting.
- Current calibrated reference cases include: one perfect Exact Variant wearer ≈ **56%** confidence, four ≈ **76%**, ten cap at **99%**; ten perfect wearers with 50% coverage produce **50%**; ten perfect Category Fit observations produce **42%**; five positive + five too-small reports on the same size reduce confidence to **61%**; a 5-vs-5 supported-size split produces **40%**.
- PR #21 / final Phase 4 CI `32295755268` passed **npm ci → typecheck → recommendation calibration → production build → clean 25-migration replay → every canonical pgTAP suite**.
- Final Supabase Security Advisor: **0 findings**.

**Phase 4 exit criterion: ✅ MET.** Every intended evidence tier is reachable and verified in the locked order; one-per-wearer aggregation is enforced; recommendation confidence is exercised against representative strong, weak, incomplete and conflicting evidence.

## OWNER CHECKPOINT AFTER PHASE 4 — ✅ RESOLVED
The owner explicitly locked a dedicated **Following Feed** into V1 before Phase 5. Following Fit Twins / People My Size was already part of the LikeSized concept; the newly locked requirement is the persistent personalized activity feed plus Fit Twin activity notifications described above.

This checkpoint is complete. Phase 5 may now proceed with the Following Feed treated as core V1 scope, not a future social enhancement.

## PHASE 5 — FIT TWINS / FOLLOWING FEED / SOCIAL / SEARCH — ▶️ NEXT

### 5.1 Existing follow/Fit Twin foundation audit
Re-test the existing follow/unfollow relationship, current Fit Twin scores, member profile relationships and privacy boundaries before adding new feed behavior. Preserve the rule that a Fit Twin is a deliberately followed/saved useful match with no universal percentage threshold.

### 5.2 Dedicated Following Feed — V1 LOCKED
Build and verify a personalized feed of meaningful Shared activity from followed Fit Twins / People My Size.

Feed activity includes:
- a newly Shared Closet garment,
- a new Shared Fit Report observation/re-try-on,
- a new outfit post.

Feed activity excludes:
- likes as standalone feed events,
- Private Closet items or Private activity,
- raw current or historical body measurements.

A garment activity card should make the useful fit context obvious, for example:
**Sarah — 96% Tops Fit Match**
**Added Levi's Ribcage Straight Jeans**
**Size 29 — “Perfect waist, tight through thighs”**
**View Fit Report**

The displayed current Fit Match is contextual and may change as either member's current body changes. The linked garment Fit Report continues to use its immutable historical body snapshot for garment evidence.

### 5.3 Fit Twin activity notifications — V1 LOCKED
Add in-app notification support for meaningful Shared activity from followed members. Notification generation must obey the same privacy/activity rules as the Following Feed. Exact default notification preference/quieting controls can be finalized during this Phase 5 UX implementation without changing the locked requirement that the capability exists in V1.

### 5.4 Existing social surfaces verification
Re-test Shared Fit History, outfit creation/auto-sharing, outfit likes, All/Fit-Twins outfit feed and the interaction between those surfaces and the new Following Feed. Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification
Re-test representative member, brand and product search and ensure members can move cleanly from People My Size/search/member profiles into follow/unfollow and the Following Feed loop.

**Phase 5 exit:** following is stable, the dedicated Following Feed surfaces only authorized meaningful Shared fit activity, current match context remains distinct from historical garment evidence, Fit Twin activity notifications work within the same privacy rules, and the existing social/search surfaces remain green.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — QUEUED
Replace homepage mock match data, remove dead prototype logic, configure production auth/Vercel environment settings, and run mobile/responsive/accessibility review. No production deploy without owner authorization.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun Security/Performance Advisors, and require green CI plus browser smoke verification before beta-ready.

## Exact next action
**PHASE 5.1 — audit and re-verify the existing follow/Fit Twin foundation and privacy behavior, then build the locked dedicated Following Feed on that canonical relationship rather than creating a parallel social-follow system.**
