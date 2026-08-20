# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the **one and only LikeSized roadmap, status record, completed-work ledger, phase checklist, and AI handoff**. Repository policy lives in `AI_REPOSITORY_RULES.md`; product architecture lives in `docs/V1_PRODUCT_SPEC.md`; database/privacy behavior lives in `supabase/schema_contract.md`. If old planning text conflicts with this guide, this guide wins for roadmap/status/handoff and stale planning text must be removed.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the permanent canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations. Approved changes modify canonical source; Git history is history.
- **Every completed task, approved update, canonical source change, configuration change, deployment checkpoint, verification result, and owner-locked decision must be logged in this master.**
- **A task is not complete until the canonical repository and this master both reflect the final verified state.** When practical, the implementation and master-log update belong in the same canonical change set.
- Never record planned, attempted, failed, local-only, preview-only, approved-but-unimplemented, or unverified work as complete. Record meaningful unresolved work explicitly.
- Before any handoff, this master must contain the current phase, completed work, unresolved work, deployment state, and exact next action.
- If an audit proves a prior completion claim does not match canonical source or verified production, correct this master immediately. Canonical source and verified production determine implementation status.
- Ordered executable SQL in `supabase/migrations/` is the only database replay/deployment history.
- Supabase project `rlksidwniuoxoacumyaf` is the deployed instance/ledger, not a competing source of truth.
- Do not deploy production unless the owner explicitly authorizes it. Updating `main` may trigger Vercel and therefore requires owner authorization when it will cause production deployment.
- Work Phases 0→7 in order without diversion. Ask the owner only for genuine product/business/cost/credential decisions.

## Product / privacy rules — LOCKED
1. Exact body measurements are private by default and must never be exposed on public/member surfaces.
2. Match scoring is garment-specific and should weight relevant measurements differently for tops vs bottoms rather than using one generic percentage.
3. Closet/fit data is product-level real-world fit evidence tied to canonical brands/products and member Fit Profiles.
4. Fit Twins are relationship/discovery features derived from compatible body/fit evidence, not public measurement exposure.
5. Shared Closet / Fit Report / Outfit behavior must preserve privacy transitions and canonical relationships.
6. Search must use canonical database identity, not a parallel search catalog.

## Current baseline — 2026-08-20
- Full Next.js app, Supabase integration, matching/recommendation logic, canonical docs, and Vercel production connection are in GitHub.
- **30 canonical migrations** through `20260819212753_canonical_search_discovery_rpcs.sql`.
- Supabase Security Advisor was last verified at **0 findings** after the canonical Phase 5 work and production readiness checks.
- CI covers install, typecheck, recommendation calibration, production build, fresh migration replay, and canonical pgTAP suites.
- Prototype homepage data, `lib/mock-data.ts`, and obsolete standalone `lib/fit.ts` have been removed.
- Vercel project: **`likesized`**, project ID `prj_ioYhiOjBNHDzPx2otiCY6XpNL3Um`, team `likesized-6817s-projects`.
- Production domains include **`https://likesized.com`** and `https://likesized.vercel.app`.
- Owner explicitly authorized the approved measurement-guide artwork promotion to production on 2026-08-20. Live deployment verification remains pending until Vercel reaches READY on the promoted commit.

# PHASES

## PHASE 0 — FOUNDATION / CANONICALIZATION — ✅ COMPLETE
Canonical repository structure, docs, initial app scaffold, schema contract, repository policy and master-log structure established.

## PHASE 1 — AUTH / PRIVATE FIT PROFILE FOUNDATION — ✅ COMPLETE
Supabase auth, private member profile, private body-measurement storage, onboarding and edit flows established.

## PHASE 2 — PRODUCT / BRAND / CLOSET FOUNDATION — ✅ COMPLETE
Canonical brand/product identity and member closet/fit logging foundation established.

## PHASE 3 — FIT MATCH / PEOPLE MY SIZE — ✅ COMPLETE
Garment-relevant matching and People My Size data paths established against canonical private Fit Profile data.

## PHASE 4 — MEMBER PROFILE / FIT TWIN RELATIONSHIPS — ✅ COMPLETE
Member-facing profile/discovery relationship foundation and Fit Twin/follow behavior established without raw measurement exposure.

## PHASE 5 — SOCIAL / DISCOVERY / SEARCH — ✅ COMPLETE
Following Feed, outfit/share privacy behavior, and canonical search/discovery RPCs implemented and verified.

## PHASE 6 — PRODUCTION READINESS / RESPONSIVE POLISH — ▶️ IN PROGRESS

### 6.3 Production configuration + auth readiness — ✅ COMPLETE
Production auth, likesized.com, Supabase redirects, Resend SMTP, confirmation, password recovery, repeated-signup recovery, and long-lived session handling are complete.

### 6.4 Responsive/accessibility + Fit Profile polish — ▶️ IN PROGRESS

#### Completed canonical work
- Canonical LikeSized brand assets wired into the site; header/logo updated.
- Homepage brand/copy refreshed and multiple mobile spacing/readability passes completed.
- Logged-out header account entry is **My Fit Profile** and routes through login.
- Signed-in mobile header was compacted to a Menu control so the header no longer overflows.
- Fit Profile headline changed to **Personalize LikeSized to fit your needs**.
- Privacy copy changed to: **Your measurements stay 100% private and help LikeSized make smarter fit matches and recommendations. The more information you provide, the more personalized your results become.**
- Precision section removed.
- Core Fit Profile heading moved above profile controls.
- Username UI label changed to **Display Name**.
- Core helper copy changed to: **Add only what you know right now. More details lead to better fit matches and recommendations. You can always update your profile measurements anytime.**
- Optional Advanced Measurements copy changed to: **Add more detailed measurements for even smarter fit matches. Fill in only what you know and come back anytime to add more or make changes.**
- `?` measurement-help dialog added to all body-measurement fields.
- Core/advanced display-name cleanup implemented, including Chest, Full Bust, High Bust, Natural Waist, Pants Waist, High Hip, Hips / Seat, Waist-to-Hip Length, Shoulder Width, Individual Shoulder Length, and Torso Length.
- **Individual Shoulder Length** wording is locked and must remain exactly that unless owner changes it.
- Overbust removed from active entry and excluded server-side during save.
- High Bust guide copy rewritten to distinguish upper chest from Full Bust.
- Imperial height entry standardized to **feet + whole inches dropdown (0–11)**, internally normalized to total inches.
- Every other imperial length measurement standardized to **whole inches + fraction dropdown (0, ¼, ½, ¾)**.
- Server-side validation enforces whole inches for height and quarter-inch increments for other imperial length measurements.
- Metric length entry remains centimeters; weight remains lb/kg numeric entry.

#### Approved measurement-guide artwork — IMPLEMENTED / PRODUCTION PROMOTION AUTHORIZED
- Owner-approved **overall unisex body artwork** is the sole body base used for normal body-measurement help diagrams; measurement-specific line/circumference overlays remain dynamic.
- Owner-approved shared **Natural Waist / High Hip / Hips / Seat / Waist-to-Hip** artwork is the sole guide for those four measurements.
- Owner-approved **Torso Girth** front/back magenta artwork is the sole Torso Girth guide.
- Obsolete inline generic body/stick-figure drawing, `WaistHipDiagram`, and `TorsoGirthDiagram` were removed rather than retained as fallbacks.
- Canonical asset paths are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- Implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644` (`Use approved measurement guide artwork`).
- Vercel preview reached READY.
- Owner explicitly authorized live promotion on 2026-08-20. Production READY/live verification remains pending.

#### Known blockers / bugs — NOT COMPLETE
- Signed-in mobile Menu stays open after navigation unless manually closed; needs close-on-destination, route change, outside tap, and Escape.
- iPhone Safari focus zoom remains because mobile form controls are below 16px; controls need accessible 16px+ mobile font sizing.

### 6.4 measurement audit checkpoint
Reviewed/locked naming: Height, Weight, Chest, Full Bust, Natural Waist, Hips / Seat, Inseam, Shoulder Width, Torso Length, High Bust, Underbust, Pants Waist, High Hip, Waist-to-Hip Length, and **Individual Shoulder Length**. Overbust is removed.

## PHASE 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Use a controlled representative population, smoke the full user loop, explicitly test privacy boundaries, rerun advisors, and require green CI plus browser smoke before beta-ready.

# Completed update ledger

## 2026-08-20
- Wired locked LikeSized brand assets into canonical source.
- Refreshed homepage brand/copy and mobile layout.
- Switched production site URL to `likesized.com`.
- Added/completed password recovery and existing-account signup recovery.
- Standardized logged-out account entry to **My Fit Profile**.
- Polished Fit Profile copy, labels and measurement-help UI.
- Standardized imperial Fit Profile measurement entry and server validation.
- Production application checkpoint `1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2` reached READY.
- Canonical master/repository policy synchronized at `fd347ab624322d7109f43014762f973801a04caa`.
- Approved measurement-guide replacement implemented at `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`; preview READY; owner authorized live promotion on 2026-08-20. Production verification pending.
- Mobile-menu auto-close and iPhone input-zoom fixes remain not complete.

# Exact next action
1. Promote this owner-authorized guide implementation to `main`; verify Vercel production READY and live guide rendering; record that completed checkpoint here.
2. Fix mobile Menu auto-close.
3. Fix iPhone form-focus zoom.
4. Verify Fit Profile save/load.
5. Resume measurement-name audit at **Individual Shoulder Length**.
