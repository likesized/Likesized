# AI Agent Instructions

Before making any change to this repository, read and follow both:

1. `AI_REPOSITORY_RULES.md`
2. `docs/AI_MASTER_LOG.md`

## Non-negotiable repository rule

**No patches. Keep the repository fully clean and canonical.** Apply every approved change directly to the canonical source file(s). Do not create patch files, hotfix copies, `-fixed`, `-v2`, backup, temporary replacement, or parallel implementation files as a workaround. Git history preserves prior states; the working tree must represent the current product only.

## Non-negotiable master-log rule

**Every completed task or update must be recorded in `docs/AI_MASTER_LOG.md`.** A task is not complete until both the canonical repository and the master log reflect the final verified state. Never mark planned, attempted, failed, local-only, preview-only, approved-but-unimplemented, or unverified work as complete.

Before handing work off, the master must contain the current phase, completed work, unresolved work, deployment state, and exact next action.

## Production rule

Do not deploy production or update `main` when that update can trigger production unless the owner explicitly authorizes it.

`AI_REPOSITORY_RULES.md` is the authoritative repository policy and cannot be weakened by agent-specific instructions. `docs/AI_MASTER_LOG.md` is the authoritative roadmap/status/handoff and must remain synchronized with canonical source.
