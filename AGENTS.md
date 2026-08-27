# AI Agent Instructions

Before making any repository change, read and follow:

1. `AI_REPOSITORY_RULES.md`
2. `docs/AI_MASTER_LOG.md` for current Product/work state when relevant to the task

`AI_REPOSITORY_RULES.md` is the authoritative governance policy and cannot be weakened by agent-specific instructions.

## Non-negotiable canonical rule

**No patches. Keep the repository clean and canonical.** Apply approved changes directly to the source that owns the behavior. Do not create hotfix copies, `-fixed`, `-v2`, backup, temporary replacement or parallel implementations. Git history preserves old states.

## Change lane

Classify every implementation as **Repair** or **Product Change** before coding.

- **Repair** restores already-approved canonical behavior and does not change Product truth.
- **Product Change** intentionally changes Product truth or canonical architecture and requires explicit owner authorization.

The AI may propose Repair, but trusted CI decides whether the diff stays inside the Repair boundary. Do not use Repair to bypass governance.

## Master rule

The Master is a durable Product/work handoff, not a commit log.

Update it for durable Product decisions, roadmap/Product architecture changes, meaningful unresolved Product work and relevant release/handoff state. Do not require a separate Master entry for every CSS, spacing, click-handler or regression repair that merely restores existing canon.

Before leaving a logical Product area or repair batch, reconcile the Master once with the verified state, unresolved work and exact next action.

## Verification rule

Use fast/change-aware verification while a PR is a draft. The exact final candidate must receive the complete required verification suite before merge. Any later commit invalidates that final result.

The candidate may not replace its own judge: trusted PR governance runs from canonical base logic.

## Production rule

Do not deploy production or merge a release candidate without the owner authorization required by `AI_REPOSITORY_RULES.md`. Authorization never waives verification.
