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
- `docs/AI_MASTER_LOG.md` — sole roadmap, product/status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, release authorization/verification ledger, and AI handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `README.md` — summary only. It never overrides the files above.

If these documents disagree, STOP feature work and reconcile them before implementation continues.

A canonical document must not duplicate fast-changing status that belongs to another canonical owner. Product/release status and the current active application line belong only in `docs/AI_MASTER_LOG.md`; other canonical documents must cross-reference the master instead of copying a PR number or application checkpoint that can go stale.

**Current runtime deployment state is operational truth owned by Vercel.** The master records owner authorization, release PR/merge lineage and verified release facts, but it must not pretend a repository file can be the live source for whether a Vercel deployment is currently READY, failed, rolled back or reassigned. When exact current deployment state or deployment ID matters, read it from Vercel. Do not duplicate that fast-changing operational state into `supabase/schema_contract.md`, `docs/V1_PRODUCT_SPEC.md`, README or another canonical source.

A supporting/reference artifact must never label itself a second canonical current-state source when authority is assigned above. `supabase/storage.sql` is a support/reference mirror only; it does not override ordered migrations or `supabase/schema_contract.md`.

### Atomic documentation rule
When an owner-locked decision changes product meaning, update the master and every canonical document that owns the affected meaning in the same canonical change set. Do not leave an old statement marked LOCKED and add a newer contradictory statement elsewhere. Rewrite/remove stale current-state wording; Git history is the archive.

## 4. Owner-decision rule — LOCKED

- An owner-approved decision is not safely recorded while it exists only in chat or on a long-lived feature branch.
- During implementation branch work, record the decision in that branch's master immediately and mark branch-only implementation status accurately.
- While a primary active implementation line exists, new owner-approved product decisions belong on that same line by default. Do not branch from stale `main` merely because the change is docs-only or appears independent.
- Before a different feature/decision branch begins, the prior active line must be reconciled into the single recovery/canonical line or explicitly parked in the master with exact source branch + commit SHA and a salvage status.
- Never start a second divergent product future while meaningful owner-approved work remains unclassified on another branch.

### Owner scope lock — LOCKED
- **Discussion, planning, brainstorming, reviewing screenshots, adding items to a to-do list, or agreeing on a future direction does not authorize repository writes.** Before an AI creates a branch or changes source, tests, canonical documents, schema, or configuration for a new batch, the owner must explicitly authorize implementation of that identified batch (for example: **do it, implement it, start it, proceed with this batch**). Do not infer implementation permission merely because a decision was approved.
- After explicit implementation authorization, strictly necessary source/test/canonical-document work for that frozen batch may proceed without repeatedly asking for permission for each file. New adjacent items still require explicit addition to scope.
- The exact defects, behaviors, and copy the owner explicitly authorizes for a repair batch are the complete writable scope for that batch.
- A direction to **fix** a named defect authorizes implementation of that defect only. It does not authorize adjacent cleanup, redesign, copy changes, refactors, test rewrites, documentation rewrites, or reopening completed/deferred work unless those changes are strictly necessary to implement or verify the named defect.
- Existing owner-approved wording is immutable unless the owner explicitly authorizes a wording change. Do not paraphrase, improve, modernize, shorten, or otherwise rewrite approved copy while repairing nearby behavior.
- Newly discovered defects outside the active scope are notes only. Do not implement them until the owner explicitly adds them to scope.
- Completed or deferred issues never re-enter active scope merely because their code is nearby or a prior test mentions them.
- Tests and canonical documents protect the owner-approved behavior. They must never be rewritten to bless an unapproved implementation or to redefine the owner's requirement after the fact.
- Regression tests are verification consumers, not an independent product-decision ledger. If the owner explicitly changes a locked decision, every overlapping older test assertion must be reconciled in the same change so the suite cannot protect two contradictory answers. A historical test filename or prior green run does not make retired wording/behavior canonical.
- Before merge, every changed file must map directly to at least one owner-approved item in the frozen batch. Any unrelated change must be removed before the candidate is considered complete.

### Runtime/safeguard separation gate — LOCKED
- **Implementation must change to satisfy canon; canon and safeguards must never move merely to satisfy implementation.** A runtime Product PR is not allowed to rewrite the rules that judge that same runtime change.
- Stable owner-locked feature behavior contracts live only inside the marked **CANONICAL FEATURE CONTRACTS** section of `docs/AI_MASTER_LOG.md`. A runtime Product PR may update active status/release bookkeeping elsewhere in the master, but it may not change that stable contract section.
- A runtime Product PR may never modify `AI_REPOSITORY_RULES.md`, `scripts/check-canonical-integrity.mjs`, or `.github/workflows/`. Governance changes are a separate non-runtime batch.
- A runtime Product PR may not modify pre-existing `tests/*.test.ts` safeguards or `docs/V1_PRODUCT_SPEC.md` unless canonical `main` **before that implementation PR began** already contains a **Pending owner-approved safeguard change** block for the exact implementation branch and explicitly names every protected file allowed to change. Adding that authorization inside the same runtime PR is invalid; the machine gate reads the PR base, not the proposed branch text.
- A legitimate Product behavior change therefore starts with a separately owner-authorized, non-runtime pending-decision record on canonical `main`. That record states the exact new behavior/copy, implementation branch, and exact safeguard/spec files that may need reconciliation. Only then may the runtime implementation PR change those named safeguards while satisfying the already-recorded owner decision.
- After the runtime change is verified and merged, reconcile the pending decision into the stable feature contract and remove/close the pending authorization in a non-runtime canonical reconciliation. Do not leave a permanent blanket authorization behind.
- The first owner-authorized repair that installs this separation gate may necessarily contain the current runtime regression repair plus the safeguards it is correcting. Machine enforcement activates when this exact gate is already present on canonical `main`; after that bootstrap merge, same-PR self-authorization is rejected automatically.

## 5. Branch discipline / salvage protection — LOCKED

1. Only one primary active implementation/recovery line should exist at a time unless the owner explicitly authorizes parallel work.
2. Before new work starts, compare the active branch with canonical `main`. If it is materially behind/diverged, reconcile first.
3. Before creating **any additional implementation branch or PR**, compare its intended base with both `main` and the current primary active implementation line. If the intended base is missing owner-approved commits/decisions from the active line, STOP. Either put the work directly on the active line or explicitly reconcile/park that active work first.
4. A branch created from `main` while an unreconciled active implementation line exists must not be used for product decisions, canonical schema architecture, or overlapping implementation unless the owner explicitly authorizes that parallel line.
5. A docs-only product decision is still product state and follows the same active implementation-line rule. A post-release non-runtime reconciliation that records already-settled facts is not a second product-decision line.
6. Do not delete a branch or close a salvage PR until every meaningful changed file/decision has been classified as one of: **RECOVERED / SUPERSEDED / OBSOLETE / DUPLICATE / DEFERRED**.
7. Any DEFERRED work must remain recorded in `docs/AI_MASTER_LOG.md` with the exact source branch/commit until recovered or explicitly discarded by the owner.
8. At phase completion, clean obsolete merged/retry/verification branches after the salvage ledger proves nothing unique remains. Remote retry branches are not an archive; Git history and the salvage ledger are the archive.
9. `main` must be protected by GitHub server-side settings/rulesets. At minimum: changes reach `main` through a pull request; the current required `LikeSized CI / verify` check must succeed before merge; force pushes and branch deletion are blocked. These controls are repository settings, not optional prose rules.
10. After a merged branch is classified/salvaged and no unique work remains, delete the merged head branch. Prefer repository auto-delete for merged branches so stale AI retry branches do not accumulate indefinitely.

## 6. Master synchronization rule — LOCKED

A task is not complete until:
- canonical source contains the final implementation;
- obsolete alternatives are removed;
- relevant verification passes;
- canonical docs agree;
- `docs/AI_MASTER_LOG.md` records the verified product/release state, unresolved work, and exact next action.

Never mark planned, attempted, preview-only, failed, branch-only, unverified, or partially salvaged work COMPLETE.

While a Product/runtime implementation PR is open, any `Active branch:` record in `docs/AI_MASTER_LOG.md` must match the actual pull-request head branch. Once the implementation is merged and reconciled, the settled master must use **`Active branch: NONE — canonical main`** rather than preserving a merged branch name as if it were still authoritative. A purely non-runtime post-release reconciliation may use that settled state because it is closing already-verified lineage, not opening a second product future.

Some immutable release facts—such as the final squash SHA, post-merge `main` CI result, and Vercel deployment result—do not exist until after merge. Record owner authorization and all pre-merge product truth on the release branch first. After deployment verification, any follow-up reconciliation that changes **only** non-runtime canonical documentation/CI metadata/regression safeguards must use the canonical Vercel release boundary so it does not create another production application build merely to record the prior release. Never modify runtime source, add a noop, or trigger a second deployment just to close bookkeeping.

## 7. Database source-of-truth rule — LOCKED

- Ordered files in `supabase/migrations/` are the executable database history and replay source.
- Never hard-code a migration count as architectural truth. The current count is whatever ordered migration files exist in the canonical directory.
- `supabase/schema.sql` is retired and must not exist as an alternate schema representation.
- `supabase/storage.sql` is support/reference only. It must never describe itself as an independent canonical current-state schema.
- Applied migrations are immutable. Future database changes use new ordered migrations.
- Dormant legacy columns/types/functions do not define current product semantics merely because their old names remain.
- A PR that adds or changes an ordered migration must update `supabase/schema_contract.md` and `docs/AI_MASTER_LOG.md` in the same branch before it can pass the canonical gate.

## 8. Production deployment rule — LOCKED

- Do not deploy production without explicit owner authorization.
- Runtime-affecting updates to `main` that can create a Vercel production application build require explicit owner authorization.
- `vercel.json` + `scripts/vercel-ignore-build.mjs` own the canonical non-runtime release boundary. A commit may skip a Vercel production build only when **every** changed file is explicitly classified non-runtime by that fail-open classifier. Any unclassified file, classifier failure, runtime source, migration, dependency/config change or classifier/config change itself must continue to a normal production build.
- A non-runtime reconciliation that Vercel correctly skips is not a new production application deployment and must never be padded with a runtime/noop change just to force one.
- Preview/build verification is not production authorization.
- Never infer authorization from a prior deployment, prior conversation, or the fact that a PR is ready.
- If production authorization for an old deployment cannot be proven from canonical records, record it as **authorization status unresolved** rather than inventing history.
- When the owner explicitly says **deploy**, **push**, **submit**, **proceed**, **get it live**, **continue** in the context of an explicitly identified verified release candidate, or equivalent for the current frozen batch, that is production authorization for that batch. Do not ask for the same permission again after the exact candidate becomes verified.
- Deployment authorization does **not** waive verification. Continue automatically through implementation and failing in-scope checks, fixing the underlying branch until the exact candidate has a successful full required CI run. Do not merge a failed, incomplete, stale, or superseded candidate merely because deployment was authorized.
- The only exception is an explicit owner override made **after** the owner is told the exact failed or skipped verification gates and explicitly directs deployment anyway. A generic deployment instruction issued before a later failure is not such an override.
- Exact current deployment readiness, rollback state, alias assignment and deployment ID are read from Vercel when needed; the repository must not invent or stale-cache operational truth that Vercel owns.

## 9. Mandatory machine safeguards — LOCKED

Canonical CI must run `npm run canonical:check` before typecheck/build/database replay. The integrity check must fail when it detects at minimum:
- contradictory current Fit Twin/Following definitions;
- reintroduction of Save-as-Fit-Twin follower semantics;
- current 1–5-star Fit Rating UI/source;
- hard-coded migration-count claims in canonical database docs;
- a live `supabase/schema.sql` alternate schema;
- a support/reference schema file falsely claiming independent canonical current-state authority;
- forbidden temp/noop/version-suffixed source artifacts;
- missing required current terminology in canonical docs;
- duplicated current-application/release status outside the master;
- a Product/runtime implementation PR whose recorded active branch does not match the actual PR head;
- a PR claiming settled `Active branch: NONE — canonical main` while changing runtime/Product/release-boundary source;
- an application/source/safeguard PR that leaves the master untouched;
- a migration PR that leaves the schema contract or master untouched;
- owner-locked source/copy regressions that are explicitly protected by the canonical integrity check;
- a runtime Product PR that attempts to change governance, stable feature contracts, tests, or Product Spec without the required pre-existing canonical authorization;
- removal or weakening of the fail-open Vercel non-runtime release boundary.

Pull-request synchronization and drift checks must inspect the **entire PR diff against canonical `main`**, not only the final commit. A multi-commit PR may not hide earlier application/test/doc changes from the canonical gate.

Every committed `tests/*.test.ts` safeguard must run automatically in CI by discovery. Do not maintain a manual allowlist of test filenames that can silently omit a committed regression suite.

When an owner-approved change retires exact wording/behavior that older regression tests assert, the canonical gate and/or focused suite must reject the retired assertion. Do not keep mutually contradictory regression assertions and then change source back and forth to satisfy whichever test was noticed last.

Do not weaken or remove these checks to make a branch pass. Do not rewrite a failing regression test to accept an unapproved behavior. Fix the underlying drift; when the owner explicitly changed the behavior, reconcile the stale test to that recorded owner decision.

## 10. Verification gates — LOCKED

For relevant changes, verify as applicable:
- canonical integrity check;
- TypeScript/typecheck;
- focused unit/application tests;
- production build when the release boundary classifies runtime impact;
- complete fresh migration replay;
- pgTAP/database behavior/privacy tests;
- mobile + desktop owner verification where required.

The exact candidate proposed for merge must have a successful full required CI run after its final code/test/canonical-doc change. A green historical run on another branch or an earlier SHA is evidence worth preserving, not proof that the current candidate passes. A failed or incomplete run is not a deployable candidate unless the explicit post-failure owner override rule in Section 8 is satisfied.

For owner-reported UI regressions, green source/CI checks are not a substitute for the owner being able to verify the exact interaction on the production site after deployment.

### Universal performance / scale baseline — OWNER LOCKED 2026-08-27
Performance and scalability are default engineering requirements across the entire LikeSized website, not a later page-specific cleanup phase.

- Every new or materially changed path must be designed to remain responsive under multi-user load. Avoid N+1 data access, unbounded/full-table reads, duplicate identical requests, eager loading of hidden/offscreen heavy UI, unnecessary full-page navigation/revalidation for local interactions, and avoidable client/server work on every render or click.
- Prefer bounded pagination/cursors/limits, set-based or batched queries, indexed lookup paths, deliberate caching, request deduplication, lazy/deferred loading for nonessential or offscreen work, and media sized for the rendered context. Full originals are reserved for interactions that need them; lightweight display media should be used when it preserves the approved presentation.
- Shared/canonical components and services own performance behavior when the same interaction appears in multiple surfaces. Never create a page-specific fast fork beside a slower canonical implementation; repair the owning shared path instead.
- Data, query and index design must be evaluated for expected scale when a feature is introduced or materially changed rather than waiting for traffic to expose avoidable load. A feature is not considered well-designed merely because it works against a tiny development dataset.
- Performance work must preserve correctness, privacy, security and owner-approved semantics. Do not hide stale or incorrect data, weaken authorization, or silently change Product behavior to make a benchmark faster.
- Avoidable heavy load, redundant work, interaction blocking or scaling regressions are defects in the owning path and should be repaired canonically. When a changed feature adds meaningful load, verification should include the relevant query/request/media/render path rather than treating visual correctness as the only acceptance criterion.

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