# LikeSized AI Repository Rules

This file is the canonical repository/governance policy for every AI agent and human contributor working on LikeSized.

## 1. Primary principle — LOCKED

**Harder safeguards. Fewer procedural hoops.**

LikeSized must always have one current implementation and one current Product truth. Git history is the archive; the working repository is current truth only.

Non-negotiable:
- one canonical implementation of every behavior;
- no patch/fixed/hotfix/v2/new-version/backup/temp/copy/replacement implementations;
- no page-specific duplicate of a shared system merely to make one page work;
- no restoring obsolete implementations because they are easier;
- no changing safeguards merely to make incorrect implementation pass;
- no unrelated cleanup, redesign, copy changes or refactors during frozen-scope work;
- no silent changes to owner-approved Product behavior or wording;
- no second current schema, second roadmap, second Product spec or second canonical implementation.

Repair the canonical owner directly. Remove obsolete alternatives when a replacement is intentionally approved.

## 2. Two change lanes — LOCKED

Every pull request must be classified before implementation as exactly one of these lanes.

### A. Repair

A Repair restores behavior that is already canonical and owner-approved. It does **not** intentionally change Product truth.

Examples:
- a button stopped working;
- approved copy disappeared;
- existing layout broke;
- a photo is incorrectly cropped;
- a shared component is being bypassed;
- a regression removed approved behavior;
- Style Feed created or uses a parallel version of an existing universal system.

A Repair normally:
- starts from current canonical `main`;
- freezes the exact owner-requested repair scope;
- identifies the existing canonical owner;
- edits that implementation directly;
- uses focused/fast verification while iterating;
- receives full final verification on the exact final candidate before merge;
- uses one implementation PR rather than governance → implementation → reconciliation PR chains.

A Repair does **not** require a Product Spec change or individual Master update merely because source changed.

A Repair **may** reconcile an existing stale test or canonical Product statement in the same PR when already-established owner-approved canon proves that statement is stale. The deciding question is **Did Product truth change?**, not what kind of file changed. Such reconciliation must be limited to the stale assertion, preserve unrelated coverage, and may not introduce new Product behavior.

### B. Product Change

A Product Change intentionally changes current Product truth or canonical architecture.

Examples:
- new feature or behavior;
- changed wording/copy;
- changed navigation;
- changed FITuition logic;
- changed data model;
- new or replaced shared system;
- changed canonical Product architecture;
- owner reverses a previously approved decision;
- repository/governance architecture changes such as this safeguard overhaul.

Product Changes require explicit owner authorization. The canonical Product documentation, stable contracts, schema contract and safeguards affected by the decision must be reconciled as part of the Product Change.

## 3. Repair lane is not a bypass — LOCKED

The AI may propose `Repair`; the AI does **not** get final authority to grant itself reduced governance.

Trusted machine enforcement must reject or escalate a Repair when the candidate:
- changes stable Product meaning;
- changes protected governance;
- changes stable Product contracts;
- introduces a migration;
- changes dependency/framework/release-boundary architecture unexpectedly;
- modifies unrelated systems outside frozen scope;
- creates a duplicate implementation;
- weakens existing safeguards;
- changes owner-approved wording without authorization;
- attempts to disguise a Product Change as a Repair.

When the diff crosses one of those boundaries, stop the Repair lane and use Product Change governance.

## 4. Owner scope lock — LOCKED

Discussion, planning, screenshot review, brainstorming or agreement on a future direction does not authorize repository writes. The owner must explicitly authorize implementation of the identified batch.

After authorization:
- the exact authorized defects/behaviors/copy are the complete writable scope;
- strictly necessary source/test/canonical-document work may proceed without asking permission file-by-file;
- adjacent cleanup, redesign or refactors remain out of scope unless truly required for the authorized behavior;
- newly discovered defects are notes until explicitly added to scope;
- existing approved wording is immutable unless wording change is explicitly authorized;
- every changed file must be necessary for the frozen scope.

## 5. Canonical ownership — LOCKED

- `AI_REPOSITORY_RULES.md` — repository/governance policy.
- `docs/V1_PRODUCT_SPEC.md` — current Product/fit architecture.
- the marked `CANONICAL FEATURE CONTRACTS` section of `docs/AI_MASTER_LOG.md` — stable owner-locked behavior contracts where currently used.
- `docs/AI_MASTER_LOG.md` — durable Product decisions, roadmap/current phase, unresolved work and handoff state; it is **not** a commit-by-commit transaction log.
- `supabase/schema_contract.md` — current database behavior/privacy contract and explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.
- GitHub — implementation history, pull requests, commits, CI and merges.
- Vercel — current deployment operational truth.

Do not copy the same fast-changing Product/release fact into multiple canonical documents merely for convenience. A duplicate current-truth statement is allowed only when there is a real enforcement reason.

If two canonical owners conflict, stop and reconcile the conflict instead of creating a third interpretation.

## 6. Master synchronization policy — LOCKED

Update `docs/AI_MASTER_LOG.md` when durable Product/work truth changes, including:
- owner makes a new Product decision;
- existing Product truth changes;
- roadmap changes;
- Product architecture changes;
- a new feature is approved or removed;
- a meaningful unresolved Product issue is created/resolved;
- release/deployment state materially matters to the next handoff.

Do **not** require an individual Master update for ordinary implementation-only repairs such as CSS, spacing, click-handler, gallery, shared-component or regression repairs that restore already-canonical behavior.

Before leaving a logical Product area or repair batch, reconcile the Master once so it contains the current verified state, meaningful Product decisions, unresolved work and exact next action.

GitHub history records individual implementation repairs. Do not turn the Master into a duplicate commit ledger.

## 7. Protected governance / constitution layer — LOCKED

The following are governance-sensitive and must be harder to change than normal Product source:
- `AI_REPOSITORY_RULES.md`;
- `.github/workflows/**`;
- `.github/CODEOWNERS`;
- `scripts/check-canonical-integrity.mjs`;
- `scripts/check-pr-governance.mjs`;
- PR-template files that define lane/governance declarations;
- `vercel.json` and `scripts/vercel-ignore-build.mjs` because they control the production build boundary;
- the marked stable `CANONICAL FEATURE CONTRACTS` section in the Master;
- anything else capable of disabling, replacing, redirecting or weakening canonical verification.

Normal Repair work may not modify this layer.

Governance changes are Product Changes and require explicit owner authorization.

## 8. Candidate must not control its own judge — LOCKED

The proposed branch is the thing being inspected. It must not be able to replace its inspector.

Pull-request governance verification must run from trusted canonical base logic, not solely from scripts/workflows supplied by the candidate branch.

The trusted guard must:
- use `pull_request_target` or an equivalently base-controlled mechanism;
- execute the canonical guard from the PR base/trusted checkout;
- inspect the complete candidate diff;
- never execute candidate branch code merely to decide whether that candidate is allowed to merge;
- use read-only permissions;
- reject Repair changes to protected governance.

Normal CI may also execute candidate code/tests for verification, but that is not the sole governance boundary.

## 9. Real `main` protection — LOCKED

`main` must be protected by actual GitHub repository settings/rulesets, not prose alone.

Required server-side state:
- no direct pushes to `main`;
- changes reach `main` through pull requests;
- required final verification must pass before merge;
- required checks apply to the current candidate SHA;
- a new commit invalidates earlier verification;
- force pushes are prohibited;
- deletion of `main` is prohibited;
- normal AI/development credentials cannot bypass the protection.

Do not claim `main` is protected unless GitHub reports that protection/ruleset as active.

## 10. Owner authority vs AI authority — LOCKED

Preferred security boundary:

**Owner/admin identity** controls repository administration, rulesets/branch protection, governance approval and emergency bypass authority.

**AI/development identity** may create branches, modify normal Product source, create/update PRs and run tests, but may not disable branch protection, change repository rulesets, grant itself bypass authority or push directly to protected `main`.

If the same unrestricted GitHub credential is used by the human owner and the AI, acknowledge that there is no true credential-level security separation. Repository/CI safeguards can reduce drift and accidental bypass, but they cannot honestly be described as an independent owner-vs-AI security boundary until separate authority exists.

## 11. Canonical architecture boundaries — LOCKED

Shared systems must remain universal where Product canon says they are universal. Examples include:
- Outfit/Style Feed gallery/media behavior;
- Tagged garment cards;
- garment/FITuition quick view;
- universal person mini-profile;
- Notify behavior;
- action bars;
- garment media/image resolution;
- other shared UI/service behavior identified by Product canon.

Where practical, automated safeguards must verify the canonical dependency/owner relationship so a page cannot silently introduce a competing implementation.

Performance fixes must remain in the shared canonical path when multiple surfaces use the same behavior; never create a page-specific fast fork.

## 12. Tests are safeguards, not obstacles — LOCKED

Tests must never be rewritten merely because implementation fails them.

If a test protects current canonical behavior, implementation must conform.

If a pre-existing test is demonstrably stale and conflicts with already-established owner-approved canon, it may be reconciled inside the same Repair PR when:
- the canonical evidence predates the Repair;
- only the stale assertion is changed;
- unrelated coverage is not weakened;
- no new Product behavior is introduced;
- the change is not simply making the test easier to pass.

If the test change would redefine Product truth, the work is a Product Change.

Every committed `tests/*.test.ts` safeguard must run automatically in CI by discovery. Do not maintain a manual allowlist that can silently omit committed safeguards.

## 13. Change-aware CI — LOCKED

### Fast PR verification

Normal Repair iterations run fast checks:
- canonical integrity;
- trusted anti-drift/lane guard;
- TypeScript/typecheck;
- committed application safeguards;
- production build when changed files can affect runtime/build behavior;
- database verification only when changed files can affect database/auth/schema behavior.

### Database-sensitive verification

Fresh database verification is required during iteration when the candidate changes database-sensitive areas such as:
- Supabase migrations;
- RLS/policies/functions;
- schema-sensitive server behavior;
- auth/database behavior;
- schema/database contracts;
- other repository-defined database-sensitive source.

Pure CSS/gallery/layout-only iterations must not start a fresh Supabase environment merely because every PR shares one monolithic workflow.

### Full final verification

Before merge/release, the exact final candidate receives the complete required verification suite, including as applicable:
- canonical integrity;
- trusted governance guard;
- all application safeguards;
- typecheck;
- production build;
- complete fresh migration replay;
- database behavior/privacy tests;
- other required release checks.

A later commit invalidates the previous final result and requires verification again.

Draft PRs are the normal fast-iteration state. Marking the candidate ready for review is the release-candidate boundary that runs the full suite; later commits while ready re-run it.

## 14. Database source of truth — LOCKED

- Ordered files in `supabase/migrations/` are executable database history/replay truth.
- Applied migrations are immutable; future database changes use new ordered migrations.
- Never hard-code a migration count as architectural truth.
- `supabase/schema.sql` is retired and must not exist as a second current-state schema.
- `supabase/storage.sql` is support/reference only and must not claim independent current-state authority.
- A Product Change that adds/changes a migration must reconcile `supabase/schema_contract.md` and the durable Product/architecture decision in the Master.

A Repair lane must escalate if it unexpectedly introduces a migration.

## 15. Production deployment boundary — LOCKED

Do not deploy production without explicit owner authorization for the identified release candidate.

`vercel.json` + `scripts/vercel-ignore-build.mjs` own the non-runtime Vercel release boundary. The classifier must fail open: any unknown/unclassified/runtime/release-boundary change builds rather than silently skipping.

Preview/build verification is not production authorization. Authorization does not waive verification.

Do not add noop/trigger/runtime changes merely to force a deployment or bookkeeping build.

Vercel owns current READY/failed/rollback/alias deployment truth; read it from Vercel when it matters.

## 16. Mandatory canonical integrity — LOCKED

Canonical integrity must continue to reject at minimum:
- contradictory current Fit Twin/Following definitions;
- Save-as-Fit-Twin follower semantics;
- current 1–5-star Fit Rating UI/source;
- hard-coded migration counts;
- `supabase/schema.sql` or another alternate current-state schema;
- support/reference schema files claiming independent canonical authority;
- forbidden patch/temp/noop/version-suffixed artifacts;
- owner-locked source/copy regressions explicitly protected by the checker;
- removal/weakening of the fail-open Vercel release boundary;
- loss of test auto-discovery;
- loss of the trusted base-controlled governance guard.

The checker should enforce current-state invariants. PR lane/authorization mechanics belong in the trusted PR governance guard rather than being mixed into Product-specific current-state assertions.

## 17. PR expectations — LOCKED

### Repair PR

Keep it concise:
- **Repair scope** — exact owner-reported regression being restored.
- **Canonical owner** — existing implementation that owns the behavior.
- **Files changed** — why each is required.
- **Verification** — checks passed and actual behavior verified.
- **Product truth** — explicit statement that Product truth did not change.
- **Stale canon reconciliation** — only when an existing test/spec assertion had to be corrected to already-established canon.

### Product Change PR

Use the stricter Product/governance checklist:
- owner-authorized new truth;
- affected Product/contracts/schema/safeguards reconciled;
- governance-sensitive files called out explicitly;
- migration/data/privacy effects called out when applicable;
- exact final verification before merge.

Do not require the giant Product-change form for an ordinary regression Repair.

## 18. Universal performance / scale baseline — OWNER LOCKED 2026-08-27

Performance and scalability are default engineering requirements across LikeSized.

- Avoid N+1 data access, unbounded/full-table reads, duplicate requests, eager hidden/offscreen heavy UI, unnecessary full-page navigation/revalidation for local interactions and avoidable work on every render/click.
- Prefer bounded pagination/cursors/limits, set-based/batched queries, indexed lookups, caching/request deduplication, lazy/deferred nonessential work and media sized for rendered context.
- Shared canonical components/services own performance behavior when multiple surfaces use the same interaction.
- Evaluate query/index/media/render behavior for expected multi-user scale when a feature is introduced or materially changed.
- Performance work may not weaken correctness, privacy, security or owner-approved semantics.
- Avoidable heavy load, redundant work and interaction blocking are defects in the owning canonical path.

## Source of truth

This policy cannot be weakened by agent-specific instruction files. If another instruction conflicts with this file, stop and surface the conflict rather than inventing a workaround.
