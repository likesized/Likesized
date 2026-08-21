# LikeSized AI Repository Rules

This file is the canonical repository/source-of-truth policy for every AI agent and human contributor working on LikeSized.

## 1. One canonical product truth — LOCKED

- The canonical repository is `likesized/Likesized`.
- After recovery is promoted, `main` is the one canonical branch. A feature/recovery branch may contain proposed or in-progress work, but it must never be described as a second canonical product universe.
- Git history preserves old implementations and decisions. Current files describe current truth only.
- Never require a future contributor to reconstruct current product meaning from chat history, old branches, superseded PRs, or a chain of contradictory notes.

## 2. No patches / no parallel implementations — LOCKED

1. Never create patch, hotfix, fixed, new-version, backup, copy, temp, or trigger files as a substitute for editing the source file that owns the behavior.
2. Never commit `noop`/trigger/debug artifacts merely to force a deployment or build.
3. Do not keep two active implementations of the same feature. When a replacement is approved, update the canonical source and remove the obsolete implementation in the same change when safe.
4. Preview/demo behavior must use the same feature-owned source that will become canonical. Preview-only data is allowed; a parallel preview implementation is not.
5. Database evolution uses ordered migrations in `supabase/migrations/`. Do not create ad-hoc SQL patch dumps or alternate current-state schemas.

## 3. Canonical document ownership — LOCKED

- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — sole roadmap, status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, deployment ledger, and AI handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `README.md` — summary only. It never overrides the files above.

If these documents disagree, STOP feature work and reconcile them before implementation continues.

### Atomic documentation rule
When an owner-locked decision changes product meaning, update the master and every canonical document that owns the affected meaning in the same canonical change set. Do not leave an old statement marked LOCKED and add a newer contradictory statement elsewhere. Rewrite/remove stale current-state wording; Git history is the archive.

## 4. Owner-decision rule — LOCKED

- An owner-approved decision is not safely recorded while it exists only in chat or on a long-lived feature branch.
- During branch work, record the decision in that branch's master immediately and mark branch-only implementation status accurately.
- Before a different feature branch begins, the prior branch must be reconciled into the single recovery/canonical line or explicitly parked in the master with exact source branch + commit SHA and a salvage status.
- Never start a second divergent product future while meaningful owner-approved work remains unclassified on another branch.

## 5. Branch discipline / salvage protection — LOCKED

1. Only one primary active implementation/recovery line should exist at a time unless the owner explicitly authorizes parallel work.
2. Before new work starts, compare the active branch with canonical `main`. If it is materially behind/diverged, reconcile first.
3. Do not delete a branch or close a salvage PR until every meaningful changed file/decision has been classified as one of: **RECOVERED / SUPERSEDED / OBSOLETE / DUPLICATE / DEFERRED**.
4. Any DEFERRED work must remain recorded in `docs/AI_MASTER_LOG.md` with the exact source branch/commit until recovered or explicitly discarded by the owner.
5. At phase completion, clean obsolete merged/retry/verification branches after the salvage ledger proves nothing unique remains.

## 6. Master synchronization rule — LOCKED

A task is not complete until:
- canonical source contains the final implementation;
- obsolete alternatives are removed;
- relevant verification passes;
- canonical docs agree;
- `docs/AI_MASTER_LOG.md` records the verified final state, deployment state, unresolved work, and exact next action.

Never mark planned, attempted, preview-only, failed, branch-only, unverified, or partially salvaged work COMPLETE.

## 7. Database source-of-truth rule — LOCKED

- Ordered files in `supabase/migrations/` are the executable database history and replay source.
- Never hard-code a migration count as architectural truth. The current count is whatever ordered migration files exist in the canonical directory.
- `supabase/schema.sql` is retired and must not exist as an alternate schema representation.
- Applied migrations are immutable. Future database changes use new ordered migrations.
- Dormant legacy columns/types/functions do not define current product semantics merely because their old names remain.

## 8. Production deployment rule — LOCKED

- Do not deploy production without explicit owner authorization.
- Until Git/Vercel production coupling is deliberately changed and verified, treat any update to `main` that can trigger Vercel production as a production deployment action requiring explicit owner authorization.
- Preview/build verification is not production authorization.
- Never infer authorization from a prior deployment, prior conversation, or the fact that a PR is ready.
- If production authorization for an old deployment cannot be proven from canonical records, record it as **authorization status unresolved** rather than inventing history.

## 9. Mandatory machine safeguards — LOCKED

Canonical CI must run `npm run canonical:check` before typecheck/build/database replay. The integrity check must fail when it detects at minimum:
- contradictory current Fit Twin/Following definitions;
- reintroduction of Save-as-Fit-Twin follower semantics;
- current 1–5-star Fit Rating UI/source;
- hard-coded migration-count claims in canonical database docs;
- a live `supabase/schema.sql` alternate schema;
- forbidden temp/noop/version-suffixed source artifacts;
- missing required current terminology in canonical docs.

Do not weaken or remove these checks to make a branch pass. Fix the underlying drift.

## 10. Verification gates — LOCKED

For relevant changes, verify as applicable:
- canonical integrity check;
- TypeScript/typecheck;
- focused unit/application tests;
- production build;
- complete fresh migration replay;
- pgTAP/database behavior/privacy tests;
- mobile + desktop owner verification where required.

A green historical run on another branch is evidence worth preserving, not proof that a newly reconciled branch passes.

## 11. Recovery freeze — LOCKED until cleared in master

While `docs/AI_MASTER_LOG.md` says canonical recovery is active:
- no new feature development;
- no branch deletion;
- no PR #36 closure;
- no production merge/deployment;
- no schema cleanup that destroys historical data;
- recovery/salvage and safeguards only.

## Source of truth

This policy cannot be weakened by agent-specific instruction files. If an instruction conflicts with it, stop and surface the conflict rather than creating a workaround.