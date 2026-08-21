## LikeSized canonical-change checklist

Before requesting merge, confirm every applicable item:

- [ ] I read `AI_REPOSITORY_RULES.md` and `docs/AI_MASTER_LOG.md` first.
- [ ] This change edits the canonical source that owns the behavior; it does not add a patch/fixed/v2/temp/parallel implementation.
- [ ] No `noop`/trigger/debug artifact is committed.
- [ ] If an owner decision changed product meaning, `docs/AI_MASTER_LOG.md` and every affected canonical document were synchronized in this change.
- [ ] I searched for superseded terminology/behavior and removed or explicitly classified stale current-state references.
- [ ] Database changes are ordered migrations; applied migrations were not rewritten.
- [ ] I did not create or restore `supabase/schema.sql` as an alternate schema source.
- [ ] `npm run canonical:check` passes.
- [ ] Typecheck/build/focused tests pass as applicable.
- [ ] Fresh migration replay + database behavior/privacy tests pass when DB behavior changed.
- [ ] Any old branch/PR being closed has a completed salvage classification in the master.
- [ ] This PR does **not** imply production authorization. Production/main promotion requires explicit owner authorization when it can trigger production.

## Current truth changed
Describe the one current product/source truth after this change. Do not write a patch-note chain of old vs new behavior.

## Verification
List exact checks and results.

## Deployment
State one: `not deployed`, `preview only`, or exact owner-authorized production deployment.