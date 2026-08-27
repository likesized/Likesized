## LikeSized canonical-change checklist

Before requesting merge, confirm every applicable item:

- [ ] I read `AI_REPOSITORY_RULES.md` and `docs/AI_MASTER_LOG.md` first.
- [ ] The **Frozen owner scope** below contains only the defects/behavior/copy the owner explicitly authorized for this batch.
- [ ] Every changed file maps directly to at least one frozen owner-scope item; unrelated cleanup, redesign, copy changes, refactors, reopened work, or convenience edits are absent.
- [ ] I reviewed the **entire PR diff against canonical `main`**, not only the final commit.
- [ ] This change edits the canonical source that owns the behavior; it does not add a patch/fixed/hotfix/v2/temp/backup/copy/parallel implementation.
- [ ] No `noop`/trigger/debug artifact is committed.
- [ ] If an owner decision changed product meaning, `docs/AI_MASTER_LOG.md` and every affected canonical document were synchronized in this change.
- [ ] I searched current source, canonical docs, and overlapping regression tests for superseded terminology/behavior and reconciled stale current-state assertions instead of leaving two competing answers.
- [ ] Regression tests verify the recorded owner-approved behavior; they are not being rewritten to bless an unapproved implementation.
- [ ] Database changes are ordered migrations; applied migrations were not rewritten.
- [ ] I did not create or restore `supabase/schema.sql` or any other alternate current-state schema source.
- [ ] Every committed `tests/*.test.ts` safeguard is covered by CI discovery.
- [ ] `npm run canonical:check` passes.
- [ ] Typecheck/build/focused tests pass as applicable.
- [ ] Fresh migration replay + database behavior/privacy tests pass when DB behavior changed.
- [ ] The exact final candidate has a successful full required CI run after its final code/test/doc/safeguard change.
- [ ] Any old branch/PR being closed has a completed salvage classification in the master.
- [ ] This PR does **not** imply production authorization. Production/main promotion requires explicit owner authorization when it can trigger production.

## Frozen owner scope
List the exact authorized defects, behaviors, and copy for this batch. Anything not listed here is out of scope unless the owner explicitly adds it.

## Changed-file scope map
For every changed file, state which frozen owner-scope item requires it. If a changed file cannot be mapped, remove that change before merge.

## Current truth changed
Describe the one current product/source truth after this change. Do not write a patch-note chain of old vs new behavior.

## Canonical reconciliation
State which canonical documents and overlapping regression assertions were reviewed/reconciled. If none needed changes, say why.

## Verification
List exact checks and results for the final candidate, including the full CI run.

## Deployment
State one: `not deployed`, `preview only`, or exact owner-authorized production deployment.