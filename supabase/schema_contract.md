# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Never rewrite or delete an applied migration to hide a superseded experiment.
- Future database changes use new ordered migrations.
- Do not hard-code migration count as architectural truth.
- `supabase/schema.sql` is retired and must not be treated as current schema authority.
- `supabase/storage.sql` is reference/support only where consistent with applied migrations.

This file owns current database behavior/privacy plus explicit implementation debt. Product meaning lives in `docs/V1_PRODUCT_SPEC.md`; roadmap/status/audit order live in `docs/AI_MASTER_LOG.md`.

# Production checkpoint — 2026-08-22

Production Supabase project: `rlksidwniuoxoacumyaf`.

Latest observed applied migration tail:
- `20260823031701` — `require_two_confirmed_barcode_submitters`
- `20260823031508` — `barcode_confirmation_corroboration`
- `20260823023807` — `one_shot_matched_product_notifications`
- `20260823015741` — `default_following_notifications_off`
- `20260823015601` — `explicit_following_notification_opt_in`
- `20260823010127` — `add_member_profile_photo_storage`
- `20260822231014` — `restore_state_based_body_report_identity`
- `20260822230502` — `compare_body_change_to_latest_report` — historical applied experiment, superseded by the later restore migration
- `20260822225515` — `roll_fit_report_body_identity_baseline`
- `20260822224350` — `fix_body_identity_conflict_target`
- `20260822223342` — `garment_relevant_body_report_identity`
- `20260822210009` — `count_all_distinct_fit_situations`
- `20260822205854` — `consensus_material_defaults_and_identity_flags`
- `20260822203208` — `accept_report_scoped_attribute_variants`
- `20260822203048` — `harden_report_scoped_evidence_writer`
- `20260822202955` — `fit_report_variant_deduplication`
- `20260822195045` — `add_product_size_kind_default_rpc`
- submission-first catalog/admin migrations are also applied in production.

Local migration filenames remain the canonical replay history. Supabase-assigned production timestamps may differ from local filenames; do not rename applied local files to match generated production timestamps.

## Active branch change — NOT PRODUCTION

`agent/catalog-evidence-confidence` contains owner-approved but not-yet-deployed migration `20260823040000_generalize_catalog_identity_confidence.sql`. Until that branch is verified and explicitly authorized for production, the production checkpoint above still reflects the older barcode-specific corroboration implementation.

The branch migration replaces that product meaning with the generalized community-confidence model described below; it does not rewrite the already-applied barcode migrations.

# 1. Privacy / body-state foundations

- `profiles` stores member identity under authenticated-member authorization boundaries.
- `fit_profiles` is a shell; raw body values live in normalized owner-private measurement structures.
- immutable Fit Profile version tables preserve historical owner-private body state.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` is the current match/body-state evidence pointer for safe enrichment/rolling behavior and does not rewrite the original historical snapshot.
- `private.fit_report_body_identity_measurements` stores established Product-relevant comparison baselines.
- raw current/historical body measurements and private size references are never exposed to other members.
- current-person Match and historical-garment Match return derived scores/context only.

# 2. Controlled taxonomy foundations

- `garment_types`, `garment_attribute_definitions`, and `garment_attribute_options` hold database vocabulary aligned with `lib/garment-taxonomy.ts`.
- `garment_types.intake_active` controls member-facing Type availability while preserving historical compatibility keys.
- `color_families` stores controlled colors.
- `product_variants.color_family_key` stores resolved Product/variant color where applicable.
- `fit_reports.reported_condition` preserves New / Used / Altered.
- Altered evidence remains history but is excluded from normal Product recommendation evidence.
- Material is Product/report evidence, not a Match input.

# 3. Submission-first catalog

The database separates:
1. member garment submission / Fit Report;
2. pending catalog candidate;
3. canonical Product.

Members do not directly create canonical Products from manual fallback. On the active branch, controlled system rules may automatically canonicalize a candidate after the owner-locked five-distinct-member threshold is satisfied.

## Known Product
- Closet item/Fit Report references the canonical Product.
- Reviewed Product facts remain canonical.
- Member disagreement becomes evidence/review rather than a silent Product overwrite.

## Unresolved Product
- `closet_items.product_id` and `fit_reports.product_id` may be NULL for unresolved submissions where permitted by canonical invariants/RLS.
- `garment_submissions` preserves member-supplied identity/enrichment evidence.
- `catalog_candidates` holds pending workflow state.
- `catalog_review_flags` holds typed review reasons.
- `catalog_resolution_actions` holds accountable admin/system resolution history.
- unresolved member work remains usable without pretending Product identity is canonical.
- ordinary exact-Product search/aggregation excludes unresolved pseudo-Products.

Candidate workflow states include `pending`, `needs_enrichment`, `needs_review`, and `merged`.

## Product identity confidence — OWNER APPROVED / ACTIVE BRANCH

Product identity confidence no longer depends on having a barcode.

`catalog_candidates` tracks:
- `identity_confidence` — provisional / corroborated / verified / rejected vocabulary;
- `identity_confirmation_count` — distinct member submissions supporting the normalized candidate identity;
- `identity_conflict_count` — independent open identity-review evidence currently gating automatic promotion;
- `auto_promoted_at` — records threshold-driven system canonicalization.

Locked thresholds implemented by the branch migration:
- 1 distinct member → provisional;
- 2 distinct members → corroborated;
- 5 distinct members → eligible for automatic map/create as a corroborated canonical Product;
- verified is never granted automatically from member count.

Manual, barcode-assisted, and mixed submissions all count toward the Product identity threshold because the candidate identity is normalized Brand + Item + Garment Type.

Conflict gate:
- fewer than five confirmations → no automatic Product creation;
- five confirmations with one identity conflict may still promote, but the resulting Product remains marked for review and receives retained Product-level review visibility;
- two or more independent identity conflicts block automatic promotion and move/keep the candidate at `needs_review`;
- conflicts equal to or greater than confirmations also block automatic promotion;
- existing confirmations are not erased by a conflict.

`private.auto_promote_catalog_candidate(candidate_id)` first reuses one exact existing canonical Product when possible. If no exact canonical Product exists and the candidate is eligible, it creates one corroborated Product and calls the same safe pending→canonical mapping boundary used by admin resolution. If multiple exact Products exist, it refuses to choose and flags ambiguity.

`catalog_resolution_actions.actor_kind` distinguishes `admin` from `system`; automatic mapping/creation is audited as `auto_map_existing` / `auto_create_product`. System promotion never impersonates an admin.

The branch uses a deferred post-submission constraint trigger so Product promotion evaluates only after `record_pending_garment_submission(...)` has finished preserving the member submission and running its existing conflict checks.

## Narrow Corroborated-candidate defaults

`public.lookup_corroborated_candidate_defaults(brand, model, garment_type)` is an authenticated narrow New Fit Report boundary. It returns only one exact unresolved corroborated/verified candidate and its unique learned broad size-system kind. It does not make that candidate an ordinary Product search result.

The candidate broad size-system helper counts distinct members per normalized size kind, excludes `not_sure`, and returns NULL on a top tie.

# 4. Canonical Product identity / aliases / identifiers

- `brands` and `products` are the one canonical Product graph.
- reviewed `brand_aliases` and `product_aliases` normalize proven naming variants without creating duplicate public identities.
- Product families are explicit compatible groups, not fuzzy-title buckets.
- `product_identifiers` stores canonical UPC/barcode/other identifier relationships and on the active branch carries source/status provenance.
- Style/Article Number is evidence and is not globally unique Product identity by default.
- `retailer_listings` is the one-to-many canonical retailer destination relationship for resolved Products/variants.

## Barcode relationship confidence — OWNER APPROVED / ACTIVE BRANCH

Barcode confidence is separate from Product confidence.

- `private.product_barcode_evidence` stores private per-member Product-to-barcode evidence tied to that member's Product Fit Report.
- first distinct member on a new Product/barcode relationship remains provisional and is not inserted as a canonical `product_identifiers` relationship;
- a unique provisional relationship may still be recognized by `public.lookup_barcode_catalog_match(...)` so the next member can confirm/use the known Product;
- after two distinct member Fit Reports support the same Product/barcode relationship, the barcode becomes a corroborated `product_identifiers` row;
- one Product may have multiple independently corroborated barcodes;
- a second legitimate barcode does not by itself flag the Product;
- the same barcode corroborating toward competing Products marks both for review and does not silently reassign the barcode.

The New Fit Report known-Product save path calls `public.record_product_barcode_evidence(product_id, fit_report_id, barcode)` instead of immediately writing a member-entered barcode into `product_identifiers`.

`private.barcode_identity_confirmations` remains preserved from the already-applied scan-confirmation history and still records explicit **Is this the item?** interactions, but it no longer defines Product-level corroboration by itself on the active branch.

Identity resolution remains conservative:
- fuzzy title alone cannot force merge;
- a barcode collision/ambiguity cannot silently choose a Product;
- different Style/Article IDs may be variants/SKUs of one base Product;
- one broad model word may hide multiple fit-distinct Products;
- color/size/retailer differences normally do not define separate base Products.

# 5. Fit Report counted identity — LIVE PRODUCTION

`public.save_known_fit_report(...)` is the authoritative resolved-Product save boundary for counted Fit Report reuse/creation.

A compatible report lookup is scoped by:
- authenticated member;
- exact Product;
- normalized Size;
- `objective_variant_key`;
- compatible garment-relevant body state.

Color/variant ID is not part of counted report identity.

## Objective fingerprint
The application excludes filter-only `intended_fit` and `not_sure` positive claims from the objective fingerprint. A genuine physical controlled-answer change can create a distinct report while Intended Fit alone cannot.

## Body relevance source
`private.product_match_measurements(product_id)` is the canonical Product-specific measurement map used by Fit Match and Fit Report body-state identity. There is no second hard-coded report relevance list.

## 2% comparison
For an established baseline measurement, a candidate report is disqualified when current relevant measurement data exists and:

`abs(current - baseline) / abs(baseline) >= 0.02`

Any one established relevant measurement crossing that threshold disqualifies that candidate state. Missing current relevant measurements do not themselves force a split.

## Candidate state selection
Among compatible reports for the same member + Product + normalized Size + objective fingerprint, production prefers:
1. greatest count of established baseline measurements also present currently;
2. most recent `updated_at`;
3. report ID for deterministic ordering.

This is state-based reuse, not chronological-episode identity.

## Blank/enrichment and rolling baseline
- newly supplied relevant measurements may enrich a compatible existing report without creating another report;
- missing current values do not erase established baseline evidence;
- `match_fit_profile_version_id` may advance safely;
- `private.roll_fit_report_body_identity_baseline()` rolls accepted under-2% Product-relevant values into the active comparison baseline;
- immutable `fit_profile_version_id` remains unchanged.

# 6. Distinct Fit Report evidence counting — LIVE

Product fit summary/evidence functions count legitimate distinct Fit Report situations rather than collapsing all reports by member. One member may therefore contribute multiple legitimate body-fit states/physical variants. Presentation surfaces that require unique people must dedupe wearers separately from evidence counting.

Product identity confirmation counts are separate and distinct-member based; multiple legitimate Fit Reports from one member do not manufacture extra Product-identity confirmations.

# 7. Garment Type conflicts — LIVE

`public.flag_known_product_garment_type_conflict(...)` enforces current known-Product Type-conflict behavior.

When submitted Garment Type differs from canonical Product Type:
- member Fit Report remains unresolved (`product_id IS NULL`);
- candidate moves to `needs_review`;
- canonical Product receives `catalog_review_needed = true`;
- an `ambiguous_identity` review flag records the conflict;
- the conflict cannot silently rewrite Product truth.

Admin later corrects the Product, maps the submission to another Product, or dismisses/rejects the disputed identity.

An already-canonical Product is not automatically deleted/demoted because one later conflict appears. Review state and evidence change; Product usability remains until an audited resolution changes identity.

# 8. Product material default — LIVE

`private.refresh_product_material_default(product_id)` chooses the current member-derived Product material default from **exact complete Fit Report recipe signatures**.

Rules today:
- group non-rejected member material evidence by counted Fit Report;
- compose exact material+percentage/unknown signatures;
- choose unique most-common signature;
- tie removes the non-verified member-derived default;
- verified Product materials outrank member-derived defaults;
- winning recipe is copied exactly; never average percentages;
- one winning report is `provisional` with current confidence .55;
- 2+ winning report votes currently produce `corroborated` with current confidence .80.

Implementation debt: recipe-frequency selection and independent-member Product-identity trust are different. The Product-identity threshold does **not** silently change material-recipe voting semantics.

# 9. Size-system default

`public.get_product_default_size_kinds(product_ids)` derives a Product size-system default from existing normalized Fit Report sizes.

- exclude `not_sure`;
- count Fit Reports by normalized size kind;
- unique highest-vote kind → return it;
- tied top kinds → NULL.

New Fit Report may preselect that kind for a known Product while the actual member size remains blank/editable.

On the active branch, a uniquely matched unresolved Corroborated candidate may also preselect its unique highest-vote **broad size kind** using distinct-member candidate evidence. Actual size remains blank. Nested US/UK/EU sizing systems are not automatically inferred by this rule.

# 10. Preferred Fit — LEGACY / INERT

Legacy structures such as `user_garment_fit_preferences` and `p_fit_preferences` on `save_fit_profile(...)` remain in applied history. Current member UI does not expose Preferred Fit and current Match/recommendation database functions do not use it. Do not repurpose/drop legacy structures casually.

# 11. Product evidence / field conflicts

Shared Product facts resolve field by field.

Evidence lifecycle statuses provisional / corroborated / verified / rejected remain valid where applicable.

- one member claim is evidence, not unquestionable truth;
- Product identity confidence does not automatically promote report-scoped size/color/material/physical-question/Fit Result facts;
- admin-verified/locked facts cannot be silently overwritten;
- disagreement remains auditable evidence;
- identity ambiguity takes precedence over simple voting;
- Verified and Corroborated Products use the same ordinary member flow; Verified differs in backend authority/precedence.

`product_identity_evidence`, metadata/attribute/material/description evidence, `catalog_review_flags`, barcode evidence, and moderation history are one coherent evidence/review architecture.

# 12. Admin authorization / moderation

- `private.admin_users` is the explicit admin authorization boundary unless deliberately replaced later.
- ordinary members cannot obtain admin powers through client state.
- catalog/moderation changes require authorized server/database boundaries.
- accountable history records actor/time/target/action/reason/context as appropriate.
- threshold-driven system promotion is auditable as a system actor and does not grant itself Verified authority.

Admin review priority is owner-locked to prevent weak bad identity data from becoming entrenched:
- Provisional/barely Corroborated identity conflict = high priority;
- Corroborated/auto-promoted Product with multiple/growing conflicts = medium priority;
- Verified Product with one isolated member conflict = low priority while retaining evidence;
- multiple independent conflicts, conflict counts approaching confirmations, competing Product barcode links, or incorrect-merge signals escalate regardless of current status.

Current foundation supports candidate visibility, mapping to existing Product, reviewed new-Product creation, status controls, evidence/flags, aliases, Product-photo actions, and content moderation. The owner-approved all-Products admin view must ultimately expose identity status, distinct confirmation/conflict counts, barcode relationship status, retailer links, flags, evidence history, and admin-vs-system promotion provenance. Full admin operating UX remains under owner re-audit.

# 13. SerpAPI discovery cache

`private.serpapi_discovery_cache` is private reusable external research evidence.

- not a member-visible shadow catalog;
- cache rows do not create/update/merge `products`;
- raw Shopping title/product IDs are not LikeSized Product identity;
- completed benchmark research remains reusable;
- ordinary member intake and barcode confirmation do not call SerpAPI.

Admin research must check cache first, dedupe queries, show cached/new state, respect usage limits, preserve results, and require explicit resolution.

# 14. Starter catalog

Owner-supplied starter catalog remains research/enrichment data. Empty/unreferenced provisional seed records were moved into candidate workflow while Products with real evidence/references were preserved. Do not invent missing metadata.

# 15. Retailer listings / shopping data

- `retailer_listings` is one-to-many for resolved Products/variants.
- valid destinations append/dedupe; they do not overwrite one another.
- unresolved URLs remain candidate evidence.
- normalized URL conflicts can trigger identity/duplicate review.
- affiliate routing must preserve clean destination/provenance.
- commission never affects Match, recommendation, Product identity, search ranking, or retailer choice.

# 16. Following, person notifications, and Product notifications

- `follows` is the one member-controlled relationship graph.
- Fit Twin is derived current-person Match among followed members; there is no second Fit Twin subscription graph.
- `private.following_notification_subscriptions` stores explicit per-person bell subscriptions.
- Follow alone does not enable notifications.
- Person bell ON may auto-follow; bell OFF stops future notifications but leaves Follow intact.
- global Following-notification preference defaults OFF and acts as a master switch over chosen person bells; no missed-notification backfill.
- Product notification watch is separate from follows/person bells and from Like/Wish state.
- Product watch is a one-shot alert for a future Fit Report on that exact Product that reaches the locked 75%+ historical garment Match threshold with required matching coverage; after the qualifying notification, the watch turns off until re-enabled.

# 17. LikeLocker / Wish Locker / Outfit foundations

- `product_likes` = ordinary private Product likes / popularity intent.
- `outfit_likes` = Outfit likes.
- `wish_locker_items` = private purchase intent.
- these are separate intents surfaced through LikeLocker.
- Product Like never turns on Product notifications.
- Wish Locker never turns on Like or notifications.
- canonical Outfit posts/links/likes remain V1 and must remain transactional/visibility-safe.

# 18. Search foundations

- ordinary member catalog search uses canonical Products/Brands/identifiers/listings/reviewed aliases.
- unresolved pending submissions are not independent Product search results.
- New Fit Report barcode lookup is a narrow exception: a unique canonical Product, unique provisional Product-to-barcode relationship, or unique unresolved candidate may be surfaced only as a sanitized confirmation/recognition path; ambiguity is never auto-selected.
- New Fit Report exact Brand + Item + Garment Type may use the narrow corroborated-candidate default RPC without exposing the candidate as an ordinary Product result.
- ordinary Product search deduplicates to one canonical Product result.
- New Fit Report text suggestions can resolve reviewed Brand/Product aliases.
- raw Fit Profile measurements/private size references must never be exposed through search.

# 19. Recommendation foundations

Evidence hierarchy:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

Help Me Size It reuses the canonical recommendation architecture. `Would Buy Again` does not affect size recommendation/confidence. Pending/unmapped submissions do not count as exact canonical Product evidence until mapped.

# 20. Current implementation debt / open verification

Do not claim these complete merely because branch foundations exist:
- `agent/catalog-evidence-confidence` migration/application changes require full canonical check, TypeScript, build, fresh migration replay, and focused pgTAP before any production authorization request;
- the generalized community-confidence migration is **not deployed to production**;
- external barcode enrichment/provider experiment is not implemented;
- full Product-to-Product merge tooling;
- audited Product/candidate split tooling;
- complete all-Products admin queue/tab information architecture and confidence-aware sorting/filtering;
- complete alias management UX;
- complete spam garment-submission/Fit Report moderation;
- complete pending→canonical Product-photo transfer/review workflow;
- complete field lock/reopen UX;
- admin SerpAPI single/batch research UI, cache indicators, and cap handling;
- starter-catalog item-by-item enrichment/review;
- Department consensus/default behavior beyond current evidence foundations;
- material `corroborated` trust semantics vs same-member multiple Fit Report votes;
- browser-level behavioral regression coverage;
- remaining full owner page-by-page re-audit.

# 21. Verification contract

Before a surface/major DB behavior is called complete, prove as applicable:
1. canonical integrity/drift guard;
2. TypeScript/typecheck;
3. focused application tests;
4. production build;
5. fresh replay of complete migration directory;
6. database privacy/behavior/security tests;
7. one manual fallback submission does not directly create Product;
8. two distinct manual/barcode/mixed submissions can corroborate one normalized Product candidate;
9. five distinct confirmations auto-promote only when conflict gates permit it and never auto-verify;
10. pending reports remain usable and preserve immutable history through automatic/admin mapping;
11. first Product/barcode evidence remains provisional while two distinct member Fit Reports corroborate that relationship;
12. multiple legitimate barcodes can coexist under one Product without identity conflict;
13. competing Product claims for one barcode do not silently reassign it;
14. counted report state reuse follows actual Product match-measurement map;
15. size/objective/body-state splitting obeys locked identity rules;
16. admin/SerpAPI boundaries do not bypass Product review;
17. retailer listings append/dedupe;
18. owner interaction review for the actual surface.

# 22. Forbidden regressions

Do not:
- add fixed raw body columns back to `fit_profiles` as current architecture;
- blend current-person Match and historical garment Match;
- expose raw body measurements through social/search/feed/notifications;
- create a second follow/catalog/sizing/moderation system;
- let one manual fallback submission directly create canonical Product;
- require barcode presence for Product identity corroboration;
- let unresolved/corroborated candidate assistance turn that candidate into an ordinary Product/search result before canonicalization;
- treat a second legitimate barcode for one Product as an automatic identity conflict;
- call SerpAPI from ordinary member intake;
- let raw external identity define Product truth;
- auto-merge fuzzy/ambiguous duplicates without sufficient evidence/review;
- let one member's repeated reports manufacture distinct-member Product identity corroboration;
- let member disagreement silently overwrite canonical facts;
- auto-upgrade member-vote Product identity to Verified;
- overwrite one valid retailer listing with another;
- rewrite applied migrations;
- reintroduce star Fit Rating UI;
- reintroduce Preferred Fit member UI/recommendation behavior without a new owner decision;
- treat `supabase/schema.sql` as canonical.
