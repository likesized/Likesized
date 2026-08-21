# LikeSized

V1 application for **LikeSized — See what fits people built like you.**

## Canonical source-of-truth roles
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — sole roadmap, status, owner-decision, recovery/salvage, deployment and AI-handoff record.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract and explicit implementation debt.
- `supabase/migrations/` — executable ordered database history.
- `README.md` — summary only; never a competing decision source.

If the canonical docs disagree, stop feature work and reconcile them. Do not resurrect an old LOCKED decision from another branch/file.

## Recovery status
A canonical recovery is active on `canonical-recovery-2026-08-21`, based exactly on production `main` commit `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`.

Feature work is frozen while owner-approved work from `fit-match-engine-audit` / PR #36 and the Phase 6.5 branches is reconciled into one line. Those source branches must not be deleted until the master salvage ledger classifies every meaningful file/decision.

No production deployment is authorized merely because recovery work exists or a PR is ready.

## Current product meaning

### Following vs Fit Twin
**Following controls My Circle; Fit Twin is a designation inside it.**

- Following = user-controlled social relationship stored in canonical `follows`.
- A member may follow anyone regardless of Match %.
- Fit Twin = system-generated strong current-person Match designation applied only to someone the member follows.
- A followed person may or may not qualify as a Fit Twin; a non-followed person is not one of that member’s Fit Twins.
- Style Feed is driven by Following and contains posts from My Circle.
- Public relationship count is Followers, not Fit Twins.
- `Save as Fit Twin`, `Saved Fit Twin`, and `Remove Fit Twin` remain obsolete member-facing actions because LikeSized applies the designation.
- Legacy route/function/database names containing `fit_twin` are implementation debt, not product meaning.

### Fit Result
- Fit Result = Too Small / Snug / Just Right / Relaxed / Too Big.
- There is **no current V1 1–5-star Fit Rating UI**.
- A legacy DB type named `fit_rating` may store those physical outcomes, but that identifier does not authorize star/satisfaction UI.

### Matching
- current-person body matching and historical garment-evidence matching are separate contexts;
- historical garment evidence remains attached to the immutable body state from that try-on;
- PR #36 contains owner-approved confidence-aware, directional, Preferred Fit, derived-proportion, chest/full-bust, measurement-freshness, garment-condition and edge-case matching work that is being deliberately recovered into the single canonical line rather than blindly merged.

### Recommendation evidence
Current hierarchy:
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.

Help Me Size It is a fallback only when strong normal matched-wearer evidence is insufficient. It reuses the canonical recommendation engine and never invents a second sizing engine.

`Would Buy Again` does not influence size recommendation/confidence under the owner-locked Fit Match audit.

### Garment metadata boundaries
- one controlled taxonomy shared by Browse + New Fit Report;
- Material may exist only as reliable manufacturer/background data and is not a member filter/input;
- Stretch is not an active V1 member input/classification/filter;
- Color remains garment Browse/search data;
- jeans/pants need controlled leg-shape/cut and rise handling reconciled into the one taxonomy before implementation resumes.

### Browse
Current owner-approved direction includes:
- Garments | Outfits;
- My Fit Matches | All;
- 75%+ My Fit Matches eligibility;
- separate 85%+ Fit Alert threshold;
- one canonical product result rather than duplicate wearer/Fit Report search rows;
- compact mobile search suggestions;
- true full-screen opaque mobile mini-browser;
- image fallback instead of blank cards;
- product, wearer, Like, Wishlist and fallback Notify interactions must not swallow one another.

Garment card correction:
- heart = Like;
- wishlist control = wishlist/save action;
- Notify is not an always-visible action when useful Fit Matches exist; it belongs to the insufficient/no-useful-fit-evidence fallback state;
- no stars.

The exact Wishlist ↔ LikeLocker ↔ Gift List relationship is intentionally unresolved until the owner confirms it. Do not create duplicate save systems by assumption.

### LikeSized Gift Lists
Roadmap-locked. Reuse canonical Product + canonical sizing/confidence systems; owner-controlled sharing; raw measurements never exposed; random member search never reveals another member's recommended size.

### Outfits
Outfits remain in V1. Earlier removal direction is superseded.

## Database rule
`supabase/migrations/` is the executable database history. Do not hard-code a migration count in documentation. `supabase/schema.sql` is retired as an alternate schema source and must not be used to reconstruct current architecture.

## Verification
Canonical CI must run the integrity/drift check before typecheck/build/database replay. Full recovery is not complete until canonical integrity, TypeScript, build, fresh migration replay and database behavior/privacy tests pass on the reconciled branch.

For exact recovery status, preserved source SHAs, owner decisions and next action, read `docs/AI_MASTER_LOG.md`.