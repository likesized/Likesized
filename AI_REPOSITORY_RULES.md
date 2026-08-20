# LikeSized AI Repository Rules

This file is the canonical repository policy for every AI agent and human contributor working on LikeSized.

## Canonical Repository Rule — No Patches

LikeSized must remain a clean, canonical repository at all times.

1. **Never create patch files, hotfix files, temporary repair files, duplicate replacement files, or version-suffixed copies as a way to change the product.**
2. **Every approved change must be applied directly to the canonical source file(s) that own that behavior.**
3. Do not leave behind files such as `*-fixed`, `*-patched`, `*-new`, `*-v2`, `*-backup`, `*-temp`, `*-copy`, or similar substitutes when the original file should simply be updated.
4. Do not maintain parallel implementations of the same feature to preserve an older version. Git history is the history. The working tree should represent the current canonical product only.
5. When replacing an implementation, update the canonical file and remove obsolete code/files in the same change when safe to do so.
6. Database changes must be reflected in the canonical schema/migration structure used by the project; do not create ad hoc SQL patch dumps as the long-term source of truth.
7. Documentation and project records must describe the current canonical state, not require a future AI to reconstruct the product from a chain of patch notes.
8. Temporary files created during local debugging must never be committed unless they are an intentional permanent part of the product.
9. Every AI agent must inspect this file and `docs/AI_MASTER_LOG.md` before making repository changes and must preserve these rules unless the repository owner explicitly changes them.
10. If an instruction conflicts with this policy, stop and ask the repository owner rather than creating a patch workaround.

## Master Log Synchronization Rule — LOCKED

`docs/AI_MASTER_LOG.md` is the one canonical roadmap, status record, completed-work ledger, and AI handoff for LikeSized.

1. **Every completed task, approved product update, canonical code change, configuration change, deployment checkpoint, verification result, and owner-locked decision must be recorded in `docs/AI_MASTER_LOG.md`.**
2. **A task is not complete until the canonical repository and the master log both reflect the final state.** When practical, the source change and its master-log update belong in the same canonical commit/change set.
3. The master must always describe the current truth. Do not leave stale phase status, stale next actions, stale deployment/configuration claims, or superseded decisions in place.
4. Never record attempted, planned, approved-but-unimplemented, failed, local-only, preview-only, or unverified work as completed. Record it as pending/unresolved when it matters to the handoff.
5. If an audit finds that prior completion claims do not match canonical source or production, correct the master immediately and treat canonical source/verified production as authoritative for implementation status.
6. Before ending a work session or handing the project to another AI, update the master with the exact current phase, completed work, unresolved work, deployment state, and exact next action.
7. The master is not a substitute for canonical source. Source code, migrations, and repository policy remain authoritative for their respective implementation details; the master must accurately summarize them.

## Production Deployment Rule — LOCKED

Do not deploy production unless the repository owner explicitly authorizes that deployment. Updating `main` may trigger Vercel automatically, so treat any `main` update that can trigger production as a production deployment action requiring owner authorization.

## Definition of Done

A change is not complete until:

- the repository itself is clean and canonical;
- the normal source files contain the final implementation;
- obsolete alternatives are removed;
- relevant verification has passed;
- `docs/AI_MASTER_LOG.md` accurately records the completed change and current status; and
- a new contributor can understand the current product without applying patches or reconstructing missing work from chat history.

## Source of Truth

This file is the authoritative repository policy. Agent-specific instruction files may repeat or point to it, but they must not weaken or override it. `docs/AI_MASTER_LOG.md` is the authoritative roadmap/status/handoff and must stay synchronized with the canonical repository.
