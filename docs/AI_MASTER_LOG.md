# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This file is the **one and only LikeSized project master guide, roadmap, status record, and AI handoff**.

Other repository documents have narrower jobs and must not maintain a competing build sequence:
- `AI_REPOSITORY_RULES.md` — repository policy only.
- `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` — agent instructions only.
- `docs/V1_PRODUCT_SPEC.md` — authoritative product/fit architecture only.
- `supabase/schema_contract.md` — authoritative database behavior/privacy contract only.
- `supabase/migrations/README.md` — migration ledger notes only.
- `README.md` — repository orientation only.

If another file contains an old “next step,” checklist, phase order, or handoff that conflicts with this guide, **this guide wins and the stale planning text must be removed**.

## Canonical repository rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for LikeSized source code, executable database history, architecture references, and project status. Never create patch files, `*-fixed`, `*-patched`, `*-new`, `*-v2`, backups, temporary replacement files, or parallel implementations. Approved changes go directly into the canonical files. Git history is the history.

Connected Supabase project: `rlksidwniuoxoacumyaf`.

Supabase is the deployed database instance and migration execution ledger. It is not a competing source of truth and must never be the only place containing SQL required to rebuild LikeSized.

## Product promise — LOCKED
**See what fits people built like you.**

Primary question: **“How did this garment fit people built like me?”**

Stack: Next.js + Supabase + Vercel target.

Privacy rule: raw current and historical body measurements are private. Member-facing matching exposes safe derived scores/evidence, never another member’s raw measurements.

## Full repository/database audit — 2026-08-19
Audit baseline: canonical `main` through commit `3bdbb7d` plus the live connected Supabase project.

### What the audit confirmed
- The full V1 Next.js scaffold is in GitHub. The repo is no longer initialization-only.
- Auth routes, Supabase clients, protected application routes, domain/recommendation logic, schema, storage definitions, migrations, and product docs exist in the canonical repo.
- The separate LikeSized Supabase project exists and is connected.
- Live Supabase has 14 applied migrations through `20260819152056_index_authoritative_v1_relationships`.
- The seven authoritative architecture-era migrations currently present in `supabase/migrations/` contain executable SQL, not hosted-ledger placeholders.
- Supabase Security Advisor currently reports **0 findings**.
- Performance Advisor currently reports only unused-index INFO notices. The database contains no application data, so index-use statistics are not meaningful yet.
- Live database counts are currently 0 auth users, 0 Fit Profiles, 0 body measurements, 0 products, 0 Closet items, 0 Fit Reports, and 0 outfits.
- There is no GitHub Actions workflow currently running build/typecheck verification.
- There is no package lockfile in the repository, so installs are not yet reproducibly pinned at the transitive-dependency level.

### Canonical migration-history gap discovered by this audit
The live Supabase ledger contains seven migrations **before** the seven architecture-era migration files currently stored under `supabase/migrations/`:
1. `20260819132934_initial_likesized_schema`
2. `20260819132948_fit_rating_relaxed_value`
3. `20260819133114_index_relationships_and_streamline_profile_read`
4. `20260819134229_private_closet_photo_storage`
5. `20260819135959_harden_public_table_privileges`
6. `20260819140445_member_readable_outfit_photo_storage`
7. `20260819141225_outfit_likes`

Their effects were folded into the current `supabase/schema.sql` / storage reference state, so the repository contains the current concepts, but the exact ordered live migration history is not yet represented entirely by migration files. The exact SQL is recoverable from the Supabase migration ledger and must be recovered without inventing or rewriting history.

**Locked resolution:** Phase 0 must recover these exact seven migrations into `supabase/migrations/` and then make the ordered migration directory the unambiguous database replay/deployment history. `schema.sql` and `storage.sql` remain reference/current-state aids, not a second migration history.

## Original-plan reconciliation
The original plan was: scaffold → Supabase → Fit Profile → People My Size → Closet → product fit pages → Fit Twins/social.

### Original Step: Put full V1 scaffold in GitHub
**Status: IMPLEMENTED.**
The actual Next.js app, Supabase files, matching/recommendation logic, and docs are in `likesized/Likesized`.

### Original Step 1: Create/connect LikeSized Supabase
**Status: IMPLEMENTED; production/e2e verification still pending.**
Separate project, auth schema, application schema, RLS, Storage, RPCs and migrations exist. Security Advisor is clean.

### Original Step 2: Make Fit Profile actually work
**Status: CORE IMPLEMENTED; not yet fully V1-complete or end-to-end proven.**
Done:
- signup/login flow exists;
- authenticated user can enter controlled numeric measurements;
- measurements save privately;
- owner can edit measurements later;
- unit switching converts values instead of relabeling them;
- manual precision is controlled by measurement type;
- save is atomic through `save_fit_profile`;
- changing body measurements creates/reuses an immutable private Fit Profile version;
- old Fit Reports remain tied to the body state from their original try-on.

Remaining for full V1 Fit Profile completion:
- surface private `user_size_references` in the Fit Profile UI for normally worn bra/shoe and other applicable size references already supported by schema;
- add profile/privacy settings UI (display name/bio/avatar and privacy-facing controls as appropriate without exposing raw measurements);
- perform real signup → confirmation/login → save → edit → unit-switch → historical-version smoke testing.

### Original Step 3: Make People My Size real
**Status: IMPLEMENTED; real-user verification pending.**
Done:
- database-backed match percentages;
- Overall, Tops and Bottoms weighting are distinct;
- broader garment-specific match-profile engine exists;
- raw measurements stay private;
- Fit Twin/current-person matching uses current body vs current body only.

Remaining:
- multi-user test data and real match-result validation;
- verify missing-measurement coverage behavior with realistic partial profiles;
- optionally surface richer garment-specific match filters/coverage after core V1 is stable.

### Original Step 4: Make Closet logging real
**Status: MOSTLY IMPLEMENTED.**
Done:
- add garment;
- canonical brand/product resolution;
- garment type + market/cut segment;
- structured normalized sizes for alpha/numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation and fallback;
- exact original printed size label preserved separately;
- style ID, SKU/UPC/barcode, product URL and color/variant support;
- overall fit, fit notes, would-buy-again and wear count;
- Private/Shared Closet visibility;
- optional fit/reference photo with explicit member-sharing rule;
- immutable Fit Profile version locks at Fit Report time;
- repeat try-ons create new historical Fit Reports;
- Closet edit/remove controls preserve history correctly;
- main Closet page intentionally displays the latest Fit Report when it needs one current summary.

Remaining:
- **garment-specific controlled Fit Report dimensions are schema-ready but not collected by the add/new-observation UI yet** (examples: chest/bust/shoulders/sleeves/waist, hips/thigh/rise/length, collar, band/cup/coverage/strap, shoe length/width);
- the “Post Outfit” garment picker must explicitly choose the latest Fit Report for a Closet item instead of relying on an unordered single-row map;
- strengthen catalog autocomplete/search UX beyond the current first-300 datalist approach while preserving search-before-create behavior.

### Original Step 5: Build product fit pages
**Status: CORE IMPLEMENTED; evidence hierarchy is only partially operational from user-entered data.**
Done:
- product fit page exists;
- size recommendations and confidence calculation exist;
- recommendation evidence uses viewer-current-body vs immutable historical try-on snapshot;
- evidence aggregation returns at most one strongest observation per unique wearer;
- original/normalized sizes are used correctly;
- fallback engine supports Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit;
- evidence level is labeled rather than pretending fallback evidence is exact.

Remaining:
- product page currently requests evidence with `p_variant_id = null`, so **Exact Variant is not yet a user-selectable target tier**;
- product-family links are schema-ready but current garment logging does not populate `product_family_id`, so Product Family evidence will usually be unavailable;
- controlled garment attributes/materials are schema-ready but not populated by the current logging flow, so Similar Garments construction/attribute matching cannot reach its intended usefulness;
- calibrate recommendation confidence using real multi-user data before beta.

### Social phase after original core plan
**Status: MOSTLY IMPLEMENTED.**
Done:
- Fit Twins are explicit saved follows;
- Fit Twin/current match scores refresh from current bodies;
- member profiles separate current match from Shared Fit History;
- Shared historical garments can show viewer-vs-historical-snapshot match scores;
- outfit posting + tagged Closet items;
- outfit likes/unlikes;
- All Outfits and Fit Twins feed tabs;
- product/brand/member search.

Remaining:
- profile/privacy settings UI;
- Post Outfit picker latest-observation correction noted above;
- comments remain deliberately deferred until moderation/reporting exists.

## Two matching contexts — DO NOT MERGE
1. **Current person / Fit Twin score:** viewer current measurements vs other member current measurements.
2. **Historical garment score:** viewer current measurements vs immutable body snapshot on that specific Fit Report.

Old garments never alter the wearer’s current Fit Twin percentage. Recommendation evidence never substitutes the wearer’s current profile for the historical body state from the try-on.

## New phased marching orders
Work in this order. Do not skip forward unless the repository owner explicitly changes the order.

### PHASE 0 — CANONICAL BASELINE & REPRODUCIBILITY
**Status: NEXT / IN PROGRESS.**
Goal: make GitHub independently reproducible and establish reliable verification before adding more product behavior.

0.1 Recover the exact first seven live Supabase migrations into `supabase/migrations/` using the SQL already recorded in `supabase_migrations.schema_migrations`. Do not create rewritten equivalents or patch migrations.

0.2 Update `supabase/schema_contract.md` and migration README so the full 14-migration replay path is explicit. `schema.sql`/`storage.sql` become reference/current-state aids only; the ordered migration directory is the deployment history.

0.3 Verify there is only one master project guide: **this file**. Product spec/README/schema docs may reference this guide but do not own build order. **Completed by the 2026-08-19 audit update.**

0.4 Establish reproducible application verification: generate/commit the canonical package lockfile in an environment with npm access and add a minimal CI workflow for `npm run typecheck` and `npm run build`.

0.5 Run a clean database replay in a disposable Supabase development branch/project from the canonical migration set. Never test destructive replay against the connected production project.

0.6 Resolve any compile/type errors found by CI before moving to Phase 1.

**Exit criteria:** all 14 deployed migrations exist as executable canonical files; fresh DB replay succeeds; install is lockfile-backed; typecheck/build are green.

### PHASE 1 — FIT PROFILE COMPLETION & PRIVACY CONTROLS
**Status: CORE EXISTS.**
1.1 Add private normally-worn size-reference UI backed by `user_size_references` where useful (bra/shoe and other supported references).

1.2 Add owner profile/privacy controls without weakening raw-measurement privacy.

1.3 Test unit switching, partial measurements, edit saves, immutable version creation/reuse, and raw measurement RLS.

1.4 Confirm changing weight/body measurements changes current matching but never rewrites old Fit Report snapshots.

**Exit criteria:** a real user can create, edit and manage a complete private Fit Profile and historical version behavior is verified end to end.

### PHASE 2 — PEOPLE MY SIZE / MATCHING VERIFICATION
**Status: IMPLEMENTED, NEEDS DATA.**
2.1 Create controlled test users with deliberately different upper/lower-body profiles.

2.2 Verify Overall/Tops/Bottoms ranking behavior and missing-measurement coverage.

2.3 Verify current Fit Twin scores change when current measurements change, independently of old garment reports.

2.4 Only after validation, decide whether richer garment-specific People My Size filters belong in V1 UI.

**Exit criteria:** matching produces expected relative rankings across real database users without exposing measurements.

### PHASE 3 — CLOSET & FIT REPORT COMPLETION
**Status: MOSTLY IMPLEMENTED.**
3.1 Build garment-specific Fit Report dimension inputs from the existing controlled dictionaries/taxonomy. Only relevant dimensions appear for the selected garment type.

3.2 Persist those controlled responses into `fit_report_dimensions` for both first log and later fit observations.

3.3 Correct the Post Outfit garment picker to deliberately display the latest Fit Report for each Closet item.

3.4 Improve brand/product search-before-create UX while preserving canonical normalization and deduplication.

3.5 Test Private/Shared visibility, fit-photo forced sharing, history-safe edit, repeat try-on, and deletion cascades.

**Exit criteria:** Closet captures the full fit evidence the schema was designed for and all history-sensitive surfaces choose observations intentionally.

### PHASE 4 — PRODUCT EVIDENCE & RECOMMENDATION COMPLETION
**Status: CORE IMPLEMENTED / ENRICHMENT PARTIAL.**
4.1 Add a real variant targeting path so product evidence can evaluate Exact Variant when the user is viewing/selecting a specific variant.

4.2 Create a canonical way to populate/maintain product families where non-fit-critical colors/washes/releases should share evidence.

4.3 Populate controlled garment attributes/materials needed for Similar Garments evidence; do not ask users for irrelevant fields.

4.4 Exercise every fallback tier with test data and verify labels/ranking.

4.5 Calibrate recommendation threshold/confidence behavior with multiple unique wearers, conflicting fit outcomes and incomplete measurement coverage.

**Exit criteria:** all intended evidence tiers can actually be reached from canonical data and recommendation confidence has been tested rather than only coded.

### PHASE 5 — FIT TWINS / SOCIAL / SEARCH FINISH
**Status: MOSTLY IMPLEMENTED.**
5.1 Re-test follow/unfollow, current Fit Twin score refresh and Shared Fit History after Phases 1–4 changes.

5.2 Re-test outfit creation, auto-sharing tagged private garments, likes and Fit-Twins-only feed.

5.3 Re-test search across products/brands/members with real data.

5.4 Keep comments out of V1 until moderation/reporting is intentionally designed.

**Exit criteria:** social/discovery features consume the same canonical current/historical evidence rules as the core fit flows.

### PHASE 6 — REMOVE PROTOTYPE-ONLY SURFACES & PREPARE DEPLOYMENT
**Status: NOT COMPLETE.**
6.1 Replace the public homepage’s `lib/mock-data.ts` match cards/demo percentage with real data or clearly static non-fake marketing content. Do not ship fabricated member matches as live product evidence.

6.2 Remove `lib/mock-data.ts` and any other dead prototype-only logic once no canonical route uses it. Verify `lib/fit.ts` usage before removing or retaining it.

6.3 Configure production `NEXT_PUBLIC_SITE_URL`, Supabase Site URL/redirect allow-list/email confirmation behavior, and Vercel environment variables.

6.4 Mobile/responsive/accessibility pass on signup, Fit Profile, People, Closet, product evidence and outfit flows.

**Exit criteria:** no fake data is presented as live product state and deployment/auth configuration is production-ready.

### PHASE 7 — V1 BETA END-TO-END VERIFICATION
**Status: NOT STARTED.**
7.1 Build a small controlled test population covering different bodies, partial measurements, body changes over time, shared/private Closet items and multiple observations of the same garment.

7.2 Smoke the full loop: signup → Fit Profile → People My Size → Fit Twin → Closet → repeat try-on → product recommendation → Shared Fit History → outfit → search.

7.3 Explicit privacy tests: another user cannot read current or historical raw measurements; private Closet data is not member-readable; shared photos/reports behave exactly as intended.

7.4 Re-run Supabase Security and Performance Advisors after representative data exists.

7.5 Require green CI/typecheck/build and complete browser smoke test before calling V1 beta-ready.

7.6 Production deployment remains owner-controlled. Do not deploy merely because Phase 7 passes unless explicitly instructed.

## Exact next action
**PHASE 0.1 — recover the first seven exact Supabase migrations into the canonical migration directory.**

Do not resume profile/privacy UI or other feature work until Phase 0 exits cleanly.
