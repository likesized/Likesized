# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap/status/handoff. Repository policy lives in `AI_REPOSITORY_RULES.md`.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations.
- Every completed task/update must be logged here; a task is not complete until canonical source and this master match the verified final state.
- Do not deploy production or update `main` when that can trigger production unless the owner explicitly authorizes it.

## Current status — 2026-08-20
- Phase 6.3 auth/configuration: COMPLETE.
- Phase 6.4 responsive/accessibility + Fit Profile polish: IN PROGRESS.
- Owner approved live promotion of the approved measurement-guide implementation on 2026-08-20.

## Phase 6.4 canonical completed work
- Fit Profile copy/labels/help UI polished.
- Overbust removed.
- Height uses feet + whole inches.
- Other imperial length measurements use whole inches + 0/¼/½/¾ dropdowns.
- Server validates height as whole inches and other imperial lengths in quarter-inch increments.

## Approved measurement-guide artwork — IMPLEMENTED / LIVE PROMOTION AUTHORIZED
- Approved unisex body artwork is the base for normal measurement guides.
- Approved shared waist/hip artwork is used for Natural Waist, High Hip, Hips / Seat, and Waist-to-Hip Length.
- Approved front/back magenta artwork is used for Torso Girth.
- Old coded body figure and old WaistHipDiagram / TorsoGirthDiagram implementations were removed rather than retained as fallbacks.
- Canonical assets are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- Implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`.
- Preview reached READY.
- Owner explicitly authorized production promotion on 2026-08-20. Production READY/live verification must still be recorded after deployment.

## Not complete
- Mobile Menu auto-close behavior.
- iPhone Safari form-focus zoom fix.
- Final Fit Profile save/load regression verification.
- Measurement-name audit resumes at **Individual Shoulder Length**.

## Exact next action
Promote the authorized guide implementation to `main`, verify Vercel production READY and live guide rendering, then record the verified production checkpoint here before continuing to the mobile bugs.
