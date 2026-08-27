# LikeSized AI Repository Rules

This file is the canonical repository/source-of-truth policy for every AI agent and human contributor working on LikeSized.

## 1. One canonical product truth — LOCKED

- The canonical repository is `likesized/Likesized`.
- After recovery is promoted, `main` is the one canonical production branch. A feature/recovery branch may contain proposed or in-progress work, but it must never be described as a second canonical product universe.
- When one primary implementation/recovery line is active, that line is the only place where new owner-approved in-progress product meaning may accumulate until it is reconciled. `main` remains the production baseline; it is **not** automatically a safe base for a second product-decision branch when the active line contains unreconciled owner-approved changes.
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
- While a primary active line exists, new owner-approved product decisions belong on that same line by default. Do not branch from stale `main` merely because the change is docs-only or appears independent.
- Before a different feature/decision branch begins, the prior active line must be reconciled into the single recovery/canonical line or explicitly parked in the master with exact source branch + commit SHA and a salvage status.
- Never start a second divergent product future while meaningful owner-approved work remains unclassified on another branch.

### Owner scope lock — LOCKED
- The exact defects, behaviors, and copy the owner explicitly authorizes for a repair batch are the complete writable scope for that batch.
- A direction to **fix** a named defect authorizes implementation of that defect only. It does not authorize adjacent cleanup, redesign, copy changes, refactors, test rewrites, documentation rewrites, or reopening completed/deferred work unless those changes are strictly necessary to implement or verify the named defect.
- Existing owner-approved wording is immutable unless the owner explicitly authorizes a wording change. Do not paraphrase, improve, modernize, shorten, or otherwise rewrite approved copy while repairing nearby behavior.
- Newly discovered defects outside the active scope are notes only. Do not implement them until the owner explicitly adds them to scope.
- Completed or deferred issues never re-enter active scope merely because their code is nearby or a prior test mentions them.
- Tests and canonical documents protect the owner-approved behavior. They must never be rewritten to bless an unapproved implementation or to redefine the owner's requirement after the fact.
- Before merge, every changed file must map directly to at least one owner-approved item in the frozen batch. Any unrelated change must be removed before the candidate is considered complete.

## 5. Branch discipline / salvage protection — LOCKED

1. Only one primary active implementation/recovery line should exist at a time unless the owner explicitly authorizes parallel work.
2. Before new work starts, compare the active branch with canonical `main`. If it is materially behind/diverged, reconcile first.
3. Before creating **any additional branch or PR**, compare its intended base with both `main` and the current primary active line. If the intended base is missing owner-approved commits/decisions from the active line, STOP. Either put the work directly on the active line or explicitly reconcile/park that active work first.
4. A branch created from `main` while an unreconciled active line exists must not be used for product decisions, canonical documentation changes, schema architecture, or overlapping implementation unless the owner explicitly authorizes that parallel line.
5. A docs-only decision is still product state. It follows the same active-line rule as code and migrations.
6. Do not delete a branch or close a salvage PR until every meaningful changed file/decision has been classified as one of: **RECOVERED / SUPERSEDED / OBSOLETE / DUPLICATE / DEFERRED**.
7. Any DEFERRED work must remain recorded in `docs/AI_MASTER_LOG.md` with the exact source branch/commit until recovered or explicitly discarded by the owner.
8. At phase completion, clean obsolete merged/retry/verification branches after the salvage ledger proves nothing unique remains.

## 6. Master synchronization rule — LOCKED

A task is not complete until:
- canonical source contains the final implementation;
- obsolete alternatives are removed;
- relevant verification passes;
- canonical docs agree;
- `docs/AI_MASTER_LOG.md` records the verified final state, deployment state, unresolved work, and exact next action.

Never mark planned, attempted, preview-only, failed, branch-only, unverified, or partially salvaged work COMPLETE.

The current active branch recorded in `docs/AI_MASTER_LOG.md` must match the actual pull-request head branch. A PR with an out-of-date active-line record is canonical drift and must fail verification until reconciled.

## 7. Database source-of-truth rule — LOCKED

- Ordered files in `supabase/migrations/` are the executable database history and replay source.
- Never hard-code a migration count as architectural truth. The current count is whatever ordered migration files exist in the canonical directory.
- `supabase/schema.sql` is retired and must not exist as an alternate schema representation.
- Applied migrations are immutable. Future database changes use new ordered migrations.
- Dormant legacy columns/types/functions do not define current product semantics merely because their old names remain.
- A PR that adds or changes an ordered migration must update `supabase/schema_contract.md` and `docs/AI_MASTER_LOG.md` in the same branch before it can pass the canonical gate.

## 8. Production deployment rule — LOCKED

- Do not deploy production without explicit owner authorization.
- Until Git/Vercel production coupling is deliberately changed and verified, treat any update to `main` that can trigger Vercel production as a production deployment action requiring explicit owner authorization.
- Preview/build verification is not production authorization.
- Never infer authorization from a prior deployment, prior conversation, or the fact that a PR is ready.
- If production authorization for an old deployment cannot be proven from canonical records, record it as **authorization status unresolved** rather than inventing history.
- When the owner explicitly says **deploy**, **push**, **submit**, **proceed**, **get it live**, or equivalent for the current frozen batch, that is production authorization for that batch. Do not ask for the same permission again after the exact candidate becomes verified.
- Deployment authorization does **not** waive verification. Continue automatically through implementation and failing in-scope checks, fixing the underlying branch until the exact candidate has a successful full required CI run. Do not merge a failed, incomplete, stale, or superseded candidate merely because deployment was authorized.
- The only exception is an explicit owner override made **after** the owner is told the exact failed or skipped verification gates and explicitly directs deployment anyway. A generic deployment instruction issued before a later failure is not such an override.

## 9. Mandatory machine safeguards — LOCKED

Canonical CI must run `npm run canonical:check` before typecheck/build/database replay. The integrity check must fail when it detects at minimum:
- contradictory current Fit Twin/Following definitions;
- reintroduction of Save-as-Fit-Twin follower semantics;
- current 1–5-star Fit Rating UI/source;
- hard-coded migration-count claims in canonical database docs;
- a live `supabase/schema.sql` alternate schema;
- forbidden temp/noop/version-suffixed source artifacts;
- missing required current terminology in canonical docs;
- a pull request whose recorded active branch does not match the actual PR head;
- an application/source PR that leaves the master untouched;
- a migration PR that leaves the schema contract or master untouched;
- owner-locked source/copy regressions that are explicitly protected by the canonical integrity check.

Pull-request synchronization and drift checks must inspect the **entire PR diff against canonical `main`**, not only the final commit. A multi-commit PR may not hide earlier application/test/doc changes from the canonical gate.

Do not weaken or remove these checks to make a branch pass. Do not rewrite a failing regression test to accept an unapproved behavior. Fix the underlying drift.

## 10. Verification gates — LOCKED

For relevant changes, verify as applicable:
- canonical integrity check;
- TypeScript/typecheck;
- focused unit/application tests;
- production build;
- complete fresh migration replay;
- pgTAP/database behavior/privacy tests;
- mobile + desktop owner verification where required.

The exact candidate proposed for merge must have a successful full required CI run after its final code/test/canonical-doc change. A green historical run on another branch or an earlier SHA is evidence worth preserving, not proof that the current candidate passes. A failed or incomplete run is not a deployable candidate unless the explicit post-failure owner override rule in Section 8 is satisfied.

For owner-reported UI regressions, green source/CI checks are not a substitute for the owner being able to verify the exact interaction on the production site after deployment.

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
