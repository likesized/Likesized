# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the **one and only LikeSized roadmap, current-status record, completed-update ledger, phase checklist, and AI handoff**. Repository policy lives in `AI_REPOSITORY_RULES.md`; product architecture lives in `docs/V1_PRODUCT_SPEC.md`; database/privacy behavior lives in `supabase/schema_contract.md`.

If old planning text, a prior chat, a commit message, or stale documentation conflicts with the current canonical repository state recorded here, the canonical repository wins and this master must be corrected immediately.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- The working repository must remain canonical at all times. No patch/fixed/v2/backup/temp files, duplicate replacement files, or parallel implementations. Git history is the history.
- **Every completed task or update must be logged in this master in the same canonical change. A task is not complete until the master accurately records it.**
- The master must always distinguish **completed**, **in progress**, **approved but not implemented**, and **pending** work. Never log attempted, local-only, uncommitted, or unverified work as complete.
- Before starting new work, read `AI_REPOSITORY_RULES.md` and this master, reconcile them with the current repository, and continue from the exact next action.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Do not deploy production unless the owner explicitly authorizes it. Repository work and production deployment are separate approvals unless the owner explicitly combines them.
- Work Phases 0→7 in order without diversion. Ask the owner only for genuine product/business/cost/credential decisions.

## Product / privacy rules — LOCKED
**See what fits people built like you.** Primary question: **“How did this garment fit people built like me?”**

1. Current person/Fit Twin matching = current body ↔ current body.
2. Historical garment matching = viewer current body ↔ immutable body snapshot attached to that Fit Report.
3. Never blend those scores or rewrite historical Fit Report/body associations after a body change.
4. Recommendation aggregation uses at most one strongest observation per unique wearer.
5. Raw current/historical body measurements and normally-worn size references remain owner-private.
6. Private Closet items are owner-only; Shared evidence is member-readable. Uploaded fit/reference photos are Shared to authenticated members; no private fit-photo mode.
7. Original manufacturer size text is preserved while logical matching uses normalized sizing where possible.
8. V1 member identity is authenticated-member-only.
9. V1 People My Size UI is **Overall | Tops | Bottoms**.
10. Product Fit Families are intentional same-fit/cut groups only; no fuzzy-name auto-grouping.
11. Similar Garments uses controlled construction/material attributes.
12. Product evidence order is **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
13. Following Feed is V1. Likes are not feed events. Private activity/raw body data never appears.
14. Following Feed current match badges are relationship context only; garment evidence remains historical-snapshot based.
15. Fit Twin activity notifications are V1 and in-app only, with global control and per-Twin mute.
16. Fit Twin/follow relationships are community-public to signed-in LikeSized members; only the follower may change their relationship.
17. Outfit auto-share/tag creation must remain atomic; a failed post may not leave a previously Private garment Shared.
18. V1 Search uses canonical database identity rather than a parallel search catalog.

## Current canonical baseline — 2026-08-20
- Canonical repository: `likesized/Likesized`.
- Current `main`: `fd347ab624322d7109f43014762f973801a04caa` — `Synchronize canonical master and repository rules`.
- Current Vercel production deployment: `dpl_ARvPTcTpBcstK5aMGKzLJdCDQZ7E` — **READY**, built from that exact `main` commit. This deployment changed documentation/policy only; application behavior remains the previously verified Fit Profile state.
- Production domains include **`likesized.com`** and `likesized.vercel.app`.
- Vercel project: `likesized`, project ID `prj_ioYhiOjBNHDzPx2otiCY6XpNL3Um`, team `likesized-6817s-projects`.
- Supabase project: `rlksidwniuoxoacumyaf`.
- **30 canonical migrations** through `20260819212753_canonical_search_discovery_rpcs.sql`.
- Supabase Security Advisor last canonical verification: **0 findings**.
- CI remains the canonical verification path for install, typecheck, recommendation calibration, production build, clean migration replay, and pgTAP suites.
- Phase 0 through Phase 5 are complete.
- Phase 6.3 is complete.
- Phase 6.4 is **in progress**.
- Phase 7 remains queued.

# PHASES

## PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY — ✅ COMPLETE
Canonical migration history, package lock, CI and disposable replay established.

## PHASE 1 — FIT PROFILE COMPLETION & PRIVACY — ✅ COMPLETE
Atomic measurements/private size references, immutable versions, member-only identity and privacy/history tests complete.

## PHASE 2 — PEOPLE MY SIZE / MATCHING — ✅ COMPLETE
Overall/Tops/Bottoms rankings, coverage behavior and current-body recalculation verified.

## PHASE 3 — CLOSET & FIT REPORT COMPLETION — ✅ COMPLETE
Controlled garment-specific Fit Reports, history-safe Closet editing/re-try-ons, exact Product reuse, photo/privacy invariants and full Closet lifecycle verified.

## PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATIONS — ✅ COMPLETE
Exact Variant, Product Fit Families, Similar Garments, all evidence tiers and production recommendation-confidence calibration complete.

## PHASE 5 — FIT TWINS / FOLLOWING FEED / SOCIAL / SEARCH — ✅ COMPLETE
Canonical follows/Fit Twins, Following Feed, in-app Fit Twin notifications, atomic outfit posting, and canonical product/member search are complete and permanently tested.

## PHASE 6 — REMOVE PROTOTYPE SURFACES & PREPARE DEPLOYMENT — ▶️ IN PROGRESS

### 6.1 Remove fake/prototype homepage state — ✅ COMPLETE
- Fabricated member/activity/match state removed.
- Homepage uses static capability/explainer content linked to real routes.

### 6.2 Remove dead prototype logic — ✅ COMPLETE
- `lib/mock-data.ts` removed.
- Obsolete standalone `lib/fit.ts` removed.
- Production matching remains canonical in database/RPC paths.

### 6.3 Production configuration, auth and account recovery — ✅ COMPLETE
- Vercel Git is connected to canonical `likesized/Likesized`.
- Production uses `likesized.com`; `NEXT_PUBLIC_SITE_URL` was moved to `https://likesized.com`.
- Supabase Site URL/redirect allowlist and hosted email confirmation route were aligned to `likesized.com`.
- Resend `likesized.com` domain verification completed and confirmation mail flow was owner-tested.
- Signup confirmation reaches `likesized.com`, verifies through `/auth/confirm`, and continues to authenticated onboarding.
- Existing-account signup attempts route into account recovery while preserving neutral user-facing messaging.
- Forgot-password/reset-password flow is implemented and owner-tested end-to-end.
- Successful password reset returns to login with confirmation messaging.
- Default Supabase refresh-token/session behavior is retained for long-lived signed-in sessions.

### 6.4 Responsive/accessibility + Fit Profile UX review — ▶️ IN PROGRESS

#### Completed and canonical
- Homepage brand/copy refresh and mobile spacing/polish completed.
- Logged-out account entry standardized to **My Fit Profile**.
- Signed-in mobile header was compacted behind a **Menu** control.
- Fit Profile intro copy updated:
  - `Personalize LikeSized to fit your needs`
  - private-measurement/personalization explanation
  - Core Fit Profile guidance
  - Optional Advanced Measurements guidance
- `Username` UI label changed to **Display Name**.
- Precision section removed.
- Measurement label cleanup completed for the reviewed fields, including **Chest**, **Full Bust**, **Natural Waist**, **Hips / Seat**, **Shoulder Width**, **Torso Length**, **High Bust**, **Pants Waist**, **High Hip**, **Waist-to-Hip Length**, and **Individual Shoulder Length**.
- **Overbust removed** from active Fit Profile entry and excluded server-side during save.
- Clickable `?` measurement help is wired to measurement fields.
- High Bust help copy was rewritten to clearly distinguish it from Full Bust.
- Imperial **Height** entry is canonical as **feet + whole inches (0–11 dropdown)** and stores normalized total inches.
- Every other imperial **length** measurement is canonical as **whole inches + fraction dropdown** limited to **0, ¼, ½, ¾**.
- Server-side save validation rejects non-quarter-inch imperial length values; height remains whole-inch precision.
- Metric measurement entry remains metric numeric entry.
- Weight remains normal lb/kg entry.
- Current production application state contains the standardized measurement-entry system and remains READY; the latest production commit after that was documentation/policy-only synchronization.

#### Measurement-guide image replacement — IMPLEMENTED ON 6.4 WORK BRANCH / NOT YET PRODUCTION-COMPLETE
- The approved general unisex body silhouette is stored as the permanent body-guide asset and is used beneath the existing measurement-specific overlays for normal body measurements.
- The approved shared four-point **Natural Waist / High Hip / Hips-Seat / Waist-to-Hip** illustration is stored as the permanent waist/hip guide and is shared by all four related help entries.
- The approved **Torso Girth** front/back magenta illustration is stored as the permanent Torso Girth guide.
- The obsolete inline generic body/stick-figure drawing inside `BodyDiagram`, the old inline `WaistHipDiagram`, and the old inline `TorsoGirthDiagram` have been removed from the working-branch implementation rather than hidden or preserved as fallbacks.
- Canonical asset paths in the working branch are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- This item remains **NOT COMPLETE** until the owner authorizes promotion to `main`, production reaches READY, and the rendered guides are verified on the live Fit Profile.

#### Known blockers / bugs — NOT COMPLETE
- Signed-in mobile Menu still uses a plain `<details>` implementation and stays open after navigation unless manually closed.
- Mobile Menu still needs close-on-destination, route change, outside tap, and Escape behavior.
- iPhone Safari zooms when focusing Display Name/other small form controls because mobile controls are below 16px; mobile form controls need a canonical minimum 16px font size without disabling user zoom.
- No deployment is authorized for these pending fixes yet.

### 6.4 measurement audit checkpoint
Reviewed/locked naming:
- Height — keep; imperial UI = feet + inches.
- Weight — keep.
- Chest.
- Full Bust.
- Natural Waist.
- Hips / Seat.
- Inseam.
- Shoulder Width.
- Torso Length.
- High Bust.
- Underbust — keep.
- Overbust — removed.
- Pants Waist.
- High Hip.
- Waist-to-Hip Length.
- **Individual Shoulder Length — keep exactly this wording.**

Next measurement-name review resumes at **Individual Shoulder Length** after the current guide/mobile blockers are resolved.

**Phase 6 exit:** no fake live state, no competing prototype implementation, auth/environment/account recovery ready, and primary V1 flows responsive/accessibility-ready.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

# Completed update ledger

## 2026-08-20
- Wired locked LikeSized brand assets into canonical source.
- Refreshed homepage brand/copy.
- Refined homepage section spacing and rhythm.
- Polished homepage grouping/headline wrapping.
- Tightened mobile hero copy.
- Polished mobile hero spacing.
- Compacted mobile proof strip.
- Clarified homepage feature-card journeys.
- Switched production site URL to `likesized.com`.
- Added and completed canonical password recovery flow.
- Routed existing-account signup attempts into recovery.
- Added logged-out mobile account action and standardized it to **My Fit Profile**.
- Polished Fit Profile copy, labels and measurement-help UI.
- Standardized imperial Fit Profile measurement entry.
- Added canonical server-side imperial quarter-inch validation.
- Styled standardized measurement controls.
- Production deployed current canonical `main` commit `1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2` and reached READY.
- Audit confirmed the approved measurement-guide image replacement was not complete in production; the 6.4 working branch now contains the replacement implementation, still pending owner-authorized `main` promotion and live verification.
- Audit confirmed the mobile-menu auto-close fix and iPhone input-zoom fix are **not complete**.

# Exact next action
Complete Phase 6.4 canonically in this order:
1. Review the working-branch measurement-guide replacement; when the owner explicitly authorizes deployment, promote that exact implementation to `main`, verify production reaches READY, and visually verify the approved body/waist-hip/torso-girth guides on the live Fit Profile.
2. Fix signed-in mobile Menu auto-close behavior.
3. Fix iPhone Safari form-focus zoom with accessible 16px+ mobile form controls.
4. Verify the Fit Profile save/load path still works with the standardized imperial entry system and no regressions were introduced.
5. Update this master with each completed item in the same canonical change.
6. Stop before Vercel production deployment unless the owner explicitly authorizes it.
7. Resume the measurement-name audit at **Individual Shoulder Length**.
