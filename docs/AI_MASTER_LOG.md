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
- Owner authorized the live measurement-guide correction on 2026-08-20 after reporting broken waist/hip and Torso Girth images.
- Diagnosis: the prior `waist-hip-guide.webp` and `torso-girth-guide.webp` binaries were truncated during upload even though their production URLs returned HTTP 200. The body guide was valid and remained unchanged.
- The two corrupted binaries were replaced canonically on `main` by complete locally decoded/validated approved-image WebPs.
- Repair commit `c9de2165280ff7b13591eb64665774394af932a9` deployed through Vercel production deployment `dpl_2zn8KbfppxY8CkMKZ7JsdPEFH5qv`, which reached READY with no build errors.
- Live verification confirmed `waist-hip-guide.webp` is `image/webp` at exactly 9,920 bytes and `torso-girth-guide.webp` is `image/webp` at exactly 11,234 bytes, matching the corrected canonical binaries.

## Phase 6.4 canonical completed work
- Fit Profile copy/labels/help UI polished.
- Overbust removed.
- Height uses feet + whole inches.
- Other imperial length measurements use whole inches + 0/¼/½/¾ dropdowns.
- Server validates height as whole inches and other imperial lengths in quarter-inch increments.

## Approved measurement-guide artwork — LIVE / BINARY REPAIR VERIFIED
- Approved unisex body artwork is the base for normal measurement guides and remained valid.
- Approved shared waist/hip artwork is used for Natural Waist, High Hip, Hips / Seat, and Waist-to-Hip Length.
- Approved front/back magenta artwork is used for Torso Girth.
- Old coded body figure and old WaistHipDiagram / TorsoGirthDiagram implementations remain removed; there are no fallback copies.
- Canonical asset paths are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- Original implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`.
- Corrected waist/hip Git blob: `207cef3553aacb70909d95427e5541be81f9782a`.
- Corrected Torso Girth Git blob: `f8933270c7d75888a531587ecbf7eee31f5268e4`.
- Binary verification rule: HTTP 200 alone is not sufficient for image assets. Verify the deployed file is complete/decodable and that its expected byte length/hash matches the canonical binary.
- Owner visual confirmation of the corrected rendered authenticated dialogs is still pending.

## Not complete
- Mobile Menu auto-close behavior.
- iPhone Safari form-focus zoom fix.
- Final Fit Profile save/load regression verification.
- Measurement-name audit resumes at **Individual Shoulder Length**.

## Exact next action
1. Owner visually confirms the corrected live waist/hip and Torso Girth dialogs on `likesized.com`.
2. Fix mobile Menu auto-close behavior canonically.
3. Fix iPhone Safari form-focus zoom canonically.
4. Verify Fit Profile save/load regression behavior.
5. Resume measurement-name audit at **Individual Shoulder Length**.