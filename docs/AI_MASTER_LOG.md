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

### 5.2 Dedicated Following Feed — ✅ COMPLETE
- `/following` uses canonical follows and a private activity ledger; no parallel social relationship/event system.
- Only `closet_shared`, `fit_report_added`, and `outfit_posted` are feed events. Likes never create activity.
- Private transitions/deletion remove unauthorized source activity; re-share creates fresh share activity without resurrecting old re-try-ons.
- `following_feed_activity.test.sql`: **25/25**.

### 5.3 Fit Twin notifications — ✅ COMPLETE
- Canonical follow activity drives Fit Twin notifications without duplicating social relationship systems.
- Final Phase 5.3 CI `32302356811` green; Security Advisor 0.

### 5.4 Social/outfit verification — ✅ COMPLETE
- Migration `20260819211614_atomic_outfit_post_creation.sql` makes selected-garment share + outfit post + tag creation transactional; app removes uploaded photo if RPC fails.
- All Outfits member-wide; Fit-Twins Outfits filtered by canonical follows; latest visible Fit Report used for tags; likes do not feed/notify; Private transitions hide garment evidence while independent outfit post may remain.
- `social_outfit_integration.test.sql`: **49/49**.
- Final Phase 5.4 CI `32303418989` green; Security Advisor 0.
- Comments remain outside V1 until moderation/reporting is intentionally designed.

### 5.5 Search/discovery verification — ✅ COMPLETE
- Migration `20260819212753_canonical_search_discovery_rpcs.sql` adds authenticated production search RPCs using canonical identity rather than a parallel search catalog.
- Catalog search covers product name, canonical brand, brand aliases, manufacturer style number, product identifiers, retailer identifiers, and listing title, deduplicated to canonical Product.
- Member search covers username/display name, excludes the viewer, remains authenticated-member-only, and returns no raw measurements.
- Search → member profile → follow → Shared Fit activity → Following Feed + Fit Twin notification loop is permanently exercised.
- `search_discovery_integration.test.sql`: **35/35 assertions**.

## PHASE 6 — PRODUCTION READINESS / RESPONSIVE POLISH — ▶️ IN PROGRESS

### 6.1 / 6.2 Production-readiness verification — ✅ COMPLETE
- README stale prototype claims removed.
- Verification PR #32 / CI `32306676280` passed canonical checks.

### 6.3 Production configuration + auth readiness — ✅ COMPLETE
Completed and verified:
- Vercel project connected to canonical repo `likesized/Likesized`.
- Production/Preview Supabase environment configuration connected.
- `likesized.com` connected and used as the production site/auth destination.
- Supabase Site URL and redirect allowlist configured for production and preview/local flows.
- Resend custom SMTP configured for LikeSized and `likesized.com` verified.
- Hosted confirmation template uses canonical `/auth/confirm` token-hash flow.
- Real signup confirmation email flow was completed end-to-end and landed on authenticated LikeSized onboarding.
- Password recovery/reset flow was completed end-to-end and returns the user to login with the password-updated confirmation.
- Existing-account repeated signup behavior routes into account recovery while preserving neutral user-facing messaging.
- Session behavior remains long-lived through Supabase refresh-token handling rather than an unnecessary custom timeout system.

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
- Canonical hidden numeric value continues through the existing save path, e.g. `27 + ¼` → `27.25` inches.
- Server-side validation enforces whole inches for height and quarter-inch increments for other imperial length measurements so malformed/manual requests cannot bypass the UI format.
- Metric length entry remains centimeters; weight remains lb/kg numeric entry.

#### Approved measurement-guide artwork — IMPLEMENTED / PRODUCTION PROMOTION AUTHORIZED
- Owner-approved **overall unisex body artwork** is the sole body base used for normal body-measurement help diagrams; measurement-specific line/circumference overlays remain dynamic.
- Owner-approved shared **Natural Waist / High Hip / Hips / Seat / Waist-to-Hip** artwork is the sole guide for those four measurements.
- Owner-approved **Torso Girth** front/back magenta artwork is the sole Torso Girth guide.
- Obsolete inline generic body/stick-figure drawing, `WaistHipDiagram`, and `TorsoGirthDiagram` were removed from the implementation rather than retained as fallbacks.
- Canonical asset paths are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- Working implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644` (`Use approved measurement guide artwork`).
- Vercel preview for that exact implementation reached READY.
- Owner explicitly authorized promotion of this implementation to production on 2026-08-20. Production READY/live verification is still pending and must be logged before this item is considered fully complete.

#### Known blockers / bugs — NOT COMPLETE
- Signed-in mobile Menu still uses a plain `<details>` implementation and stays open after navigation unless manually closed.
- Mobile Menu still needs close-on-destination, route change, outside tap, and Escape behavior.
- iPhone Safari zooms when focusing Display Name/other small form controls because mobile controls are below 16px; mobile form controls need a canonical minimum 16px font size without disabling user zoom.

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
- Production deployed application commit `1c5e9763cdd6f5e96f5bb2e3e62e47e64d0f4dd2` and reached READY.
- Canonical master/repository policy synchronized at `fd347ab624322d7109f43014762f973801a04caa`.
- Approved measurement-guide replacement implemented at `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`; preview reached READY; owner explicitly authorized live promotion on 2026-08-20. Production verification remains pending.
- Audit confirmed the mobile-menu auto-close fix and iPhone input-zoom fix are **not complete**.

# Exact next action
1. Promote the owner-authorized approved measurement-guide implementation to `main`, verify Vercel production reaches READY, visually verify the approved guides on live Fit Profile, and log that verified deployment checkpoint here.
2. Fix signed-in mobile Menu auto-close behavior.
3. Fix iPhone Safari form-focus zoom with accessible 16px+ mobile form controls.
4. Verify Fit Profile save/load remains correct.
5. Resume measurement-name audit at **Individual Shoulder Length**.
