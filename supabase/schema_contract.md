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

The production Supabase project has the submission-first catalog foundation and subsequent Fit Report identity migrations applied.

Latest production migration tail observed during canonical reconciliation:
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

Local migration filenames remain the canonical replay history. Supabase-assigned production version timestamps may differ from local filenames; do not rename applied local files to match generated production timestamps.

# 1. Privacy/body-state foundations

- `profiles` stores member identity under existing authorization boundaries.
- `fit_profiles` is a profile shell; raw body values live in normalized owner-private measurement structures.
- immutable Fit Profile version tables preserve historical owner-private body state.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` is the current match/body-state evidence pointer for safe enrichment/rolling behavior and does not rewrite the original historical snapshot.
- `private.fit_report_body_identity_measurements` stores the established garment-relevant baseline values used to decide whether an existing report represents the current body-fit state.
- current-person and historical-garment matching return derived scores/context; raw measurements remain private.
- Private Closet evidence remains owner-only; Shared evidence follows current RLS rules.

# 2. Controlled taxonomy foundations

- `garment_types`, `garment_attribute_definitions`, and `garment_attribute_options` hold database vocabulary aligned with the one canonical application taxonomy.
- `garment_types.intake_active` controls member-facing Type availability while preserving historical compatibility keys.
- `color_families` stores controlled colors.
- `product_variants.color_family_key` stores resolved Product/variant color where applicable.
- `fit_reports.reported_condition` preserves New / Used / Altered.
- Altered observations remain history but are excluded from normal recommendation evidence.
- Material may be controlled Product/report evidence but is not a Match input or automatic Explore filter.
- Stretch is not current V1 member-facing behavior.

# 3. Submission-first catalog — LIVE PRODUCTION

The database separates:
1. member garment submission / Fit Report;
2. pending catalog candidate;
3. canonical Product.

Members do not directly create canonical Products from manual fallback.

## Known Product
- Closet item/Fit Report references the canonical Product.
- Reviewed Product facts remain canonical.
- Member disagreement becomes evidence/review rather than a silent Product overwrite.

## Unresolved Product
- `closet_items.product_id` and `fit_reports.product_id` may be NULL for unresolved submissions where permitted by the canonical RLS/invariant functions.
- `garment_submissions` preserves member-supplied identity/enrichment evidence.
- `catalog_candidates` holds pending candidate state.
- `catalog_review_flags` holds typed review reasons.
- `catalog_resolution_actions` holds accountable resolution history.
- unresolved member work remains usable without pretending the Product identity is verified.
- ordinary exact-Product search/aggregation excludes unresolved pseudo-Products.

Authorized resolution may map pending work to a canonical Product once, preserving the original member evidence and immutable body snapshot.

Candidate lifecycle values in the current model include:
- `pending`
- `needs_enrichment`
- `needs_review`
- `merged`

A resolved canonical Product is the Verified Catalog Item rather than another candidate status.

# 4. Canonical Product identity / aliases / identifiers

- `brands` and `products` remain the one canonical Product graph.
- reviewed `brand_aliases` and `product_aliases` normalize proven naming variants without creating duplicate public identities.
- Product families are explicit compatible groups, not fuzzy-title buckets.
- `product_identifiers` stores UPC/barcode/other identifier evidence.
- Style/Article Number is evidence and is not globally unique Product identity by default.
- `retailer_listings` is the one-to-many canonical retailer destination relationship for resolved Products/variants.

Identity resolution is conservative:
- fuzzy title alone cannot force merge;
- different Style/Article IDs may be variants/SKUs of one base Product;
- one broad model word may contain multiple fit-distinct Products;
- color/size/retailer differences normally do not define separate base Products.

# 5. Fit Report counted identity — LIVE PRODUCTION

`public.save_known_fit_report(...)` is the authoritative resolved-Product save boundary for counted Fit Report reuse/creation.

A compatible report lookup is scoped by:
- authenticated member;
- exact Product;
- normalized Size;
- `objective_variant_key`;
- compatible garment-relevant body state.

Color/variant ID is not part of the counted report lookup even though a Closet item may reference a Product variant.

## Objective fingerprint
The application computes the objective fingerprint from applicable controlled answers after excluding:
- filter-only `intended_fit`;
- `not_sure` positive claims.

A physical objective-answer change can therefore create a distinct counted report, while Intended Fit alone cannot.

## Body relevance source
`private.product_match_measurements(product_id)` is the canonical Product-specific measurement map used by Fit Match and Fit Report body-state identity.

The report identity implementation must not maintain a separate hard-coded relevance list.

## 2% comparison
For an established baseline measurement, a candidate report is disqualified when current relevant measurement data exists and:

`abs(current - baseline) / abs(baseline) >= 0.02`

Any one established relevant measurement crossing that threshold disqualifies that candidate state.

Missing current relevant measurements do not themselves force a split.

## Candidate state selection
Among compatible reports for the same member + Product + normalized Size + objective fingerprint, production currently prefers:
1. the report with the greatest count of established baseline measurements also present in the current profile;
2. then most recent `updated_at`;
3. then report ID for deterministic ordering.

This is state-based reuse, not chronological-episode identity. The applied chronological-only experiment remains in immutable migration history but is superseded by the later restore migration.

## Blank/enrichment behavior
When an existing report is compatible:
- newly supplied relevant measurements may be inserted into `private.fit_report_body_identity_measurements` without creating another report;
- missing current measurements do not erase prior baseline evidence;
- `match_fit_profile_version_id` may advance when the current profile can safely strengthen/preserve the report's matching evidence.

## Rolling baseline
`private.roll_fit_report_body_identity_baseline()` runs after `match_fit_profile_version_id` updates and upserts current Product-relevant measurements into the report baseline.

Therefore an accepted under-2% body change can move the active state baseline while the immutable `fit_profile_version_id` remains unchanged.

# 6. Distinct Fit Report evidence counting — LIVE

Product fit summary/evidence functions count legitimate distinct Fit Report situations rather than collapsing all reports by member.

This allows one member to contribute multiple valid body-fit states or distinct physical variants when they satisfy the counted identity rules.

Presentation surfaces that require unique people should dedupe/choose unique wearers separately from evidence counting.

# 7. Garment Type conflicts — LIVE

`public.flag_known_product_garment_type_conflict(...)` enforces the current known-Product Type-conflict behavior.

When submitted Garment Type differs from canonical Product Type:
- the member Fit Report remains unresolved (`product_id IS NULL`);
- the candidate is moved to `needs_review`;
- the canonical Product receives `catalog_review_needed = true`;
- an `ambiguous_identity` review flag records canonical vs submitted Type and the pending Fit Report/submission;
- the conflict cannot silently rewrite the Product.

Admin must later correct the Product, map the submission to a different Product, or dismiss/reject the disputed identity.

# 8. Product material default — LIVE

`private.refresh_product_material_default(product_id)` chooses the current member-derived Product material default from **exact complete Fit Report recipe signatures**.

Rules implemented today:
- group non-rejected member material evidence by counted Fit Report;
- compose an exact signature from material key + supplied percentage/unknown percentage;
- choose the unique most-common signature;
- tie → remove the non-verified member-derived Product material default;
- verified Product material rows outrank and suppress non-verified defaults;
- the representative winning Fit Report recipe is copied exactly; no percentage averaging;
- a single winning report is `provisional` with current confidence .55;
- 2+ winning report votes are currently marked `corroborated` with current confidence .80.

Important implementation debt: **recipe-frequency selection and independent-member corroboration are different concepts.** Current production uses Fit Report vote count for both the winning recipe and the `corroborated` status threshold. Owner-observed behavior accepts report-frequency selection for the default; distinct-member trust/corroboration semantics still require later audit before changing production behavior.

# 9. Size-system default — LIVE

`public.get_product_default_size_kinds(product_ids)` derives one Product size-system default from existing normalized Fit Report sizes.

- exclude `not_sure`;
- count Fit Reports by normalized size kind;
- unique highest-vote kind → return it;
- tied top kinds → return NULL.

The New Fit Report API returns this as `default_size_kind`; the UI may preselect that kind for a known Product while leaving the actual size value blank and editable.

# 10. Preferred Fit — LEGACY / INERT

Legacy structures such as `user_garment_fit_preferences` and the `p_fit_preferences` argument on `save_fit_profile(...)` remain in applied schema history.

Current behavior:
- the Fit Profile UI does not expose Preferred Fit;
- the current server action reads existing legacy rows only to preserve them unchanged during normal measurement saves;
- production function inspection during reconciliation found `user_garment_fit_preferences` referenced by `save_fit_profile(...)` but not by current Match/recommendation functions;
- Preferred Fit is therefore not a current matching/recommendation input.

Do not drop or repurpose legacy schema casually. Any eventual removal requires a new additive migration and data/compatibility review.

# 11. Product evidence / field conflicts

Shared Product facts resolve field by field.

Evidence lifecycle statuses such as provisional / corroborated / verified / rejected remain valid where applicable.

- one member claim is evidence, not unquestionable Product truth;
- admin-verified/locked facts cannot be silently overwritten;
- later disagreement remains auditable evidence;
- if disagreement may represent different Products/variants, identity/duplicate review takes precedence over simple voting.

`product_identity_evidence`, metadata/attribute/material/description evidence, `catalog_review_flags`, and moderation history are one coherent evidence/review architecture and must not be replaced by parallel graphs.

# 12. Admin authorization / moderation

- `private.admin_users` remains the explicit admin authorization boundary unless deliberately replaced by a later canonical role model.
- ordinary members cannot obtain admin powers through client-controlled state.
- catalog/moderation changes require authorized server/database boundaries.
- accountable audit/history records actor, time, target, action, and reason/context as appropriate.

Current production foundation supports candidate visibility, mapping to an existing Product, reviewed new-Product creation, status controls, evidence/flags, aliases, Product-photo actions, and content moderation foundations.

The complete owner-required admin operating surface remains under re-audit and still has implementation gaps listed below.

# 13. SerpAPI discovery cache

`private.serpapi_discovery_cache` is reusable private external research evidence.

- it is not a member-visible shadow catalog;
- cache rows do not create/update/merge `products`;
- raw Google Shopping title and `product_id` are not LikeSized Product identity;
- the completed 150-item benchmark remains reusable research evidence;
- temporary benchmark write surfaces were retired after the one-time run.

Final admin research must check cache first, dedupe equivalent queries, show cached/new status, respect usage caps, preserve successful results, and require explicit catalog-resolution action after research.

# 14. Starter catalog

The owner-supplied starter catalog remains in the research/enrichment pipeline. The later reconciliation migration moved empty/unreferenced provisional seed records into candidate workflow while preserving any Product that had real evidence/references.

Do not invent missing metadata merely to make starter entries look complete.

# 15. Retailer listings / shopping data

- `retailer_listings` is one-to-many for resolved Products/variants.
- valid retailer destinations append/dedupe; they do not overwrite one another.
- unresolved retailer URLs remain candidate evidence until Product mapping.
- normalized URL conflicts can trigger identity/duplicate review.
- affiliate routing must preserve the clean canonical retailer destination/provenance.
- commission must never influence Match, recommendation, Product identity, search rank, or retailer choice.

# 16. Following / Fit Twin / feed

- `follows` is the one user-controlled relationship graph.
- Fit Twin is derived from current-person Match among followed members.
- no second Fit Twin subscription graph may be created.
- feed visibility remains constrained by Following + content visibility.
- private/deleted source content must not continue exposing activity.

# 17. LikeLocker / Outfit foundations

- `product_likes` = ordinary private Product likes.
- `outfit_likes` = Outfit likes.
- `wish_locker_items` = private purchase intent.
- these remain separate intents surfaced through LikeLocker.
- canonical Outfit posts/links/likes remain V1 and must remain transactional/visibility-safe.

# 18. Search foundations

- member catalog search uses canonical Products/Brands/identifiers/listings/reviewed aliases.
- unresolved pending submissions are not independent Product results.
- ordinary Product search deduplicates to one canonical Product result.
- New Fit Report suggestions can resolve reviewed Brand/Product aliases.
- raw Fit Profile measurements/private size references must never be exposed through search.

# 19. Recommendation foundations

Evidence hierarchy:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

Help Me Size It reuses the canonical recommendation architecture; no second sizing engine/table.

`Would Buy Again` does not affect size recommendation/confidence.

Pending/unmapped submissions do not count as exact canonical Product evidence until mapped.

# 20. Current implementation debt / open verification

Do not claim these complete merely because foundations exist:
- barcode scanner owner interaction verification;
- full Product-to-Product merge tooling;
- audited Product/candidate split tooling;
- richer duplicate-detection/review UX;
- complete admin queue/tab information architecture;
- complete alias management UX;
- complete spam garment-submission/Fit Report moderation controls;
- complete pending→canonical Product-photo transfer/review workflow;
- complete field lock/reopen UX across all intended Product facts;
- admin SerpAPI single/batch research UI, cache indicators, and cap handling;
- starter-catalog item-by-item enrichment/review;
- Department consensus/default behavior beyond currently verified Product evidence behavior;
- material `corroborated` trust semantics vs same-member multiple Fit Report votes;
- browser-level behavioral regression coverage across the reworked site;
- full owner page-by-page re-audit.

# 21. Verification contract

Before a surface or major database behavior is called complete, verification should prove as applicable:
1. canonical integrity/drift guard;
2. TypeScript/typecheck;
3. focused application tests;
4. production build;
5. fresh replay of the complete canonical migration directory;
6. canonical DB privacy/behavior/security tests;
7. member manual fallback does not create Product directly;
8. pending Fit Reports remain usable and preserve immutable history;
9. candidate→Product resolution is authorized/audited;
10. counted Fit Report state reuse follows the Product's actual match-measurement map;
11. size/objective/body-state changes split only under the locked identity rules;
12. admin/SerpAPI boundaries do not bypass canonical Product review;
13. retailer listings append/dedupe rather than overwrite;
14. owner interaction review for the actual surface.

# 22. Forbidden regressions

Do not:
- add fixed raw body columns back to `fit_profiles` as current architecture;
- blend current-person Match and historical garment Match;
- expose raw body measurements through social/search/feed/notifications;
- create a second follow/catalog/sizing/moderation system;
- let manual fallback directly create canonical Product;
- call SerpAPI from ordinary member intake;
- let raw SerpAPI/Google identity define Product truth;
- auto-merge fuzzy duplicates without sufficient evidence/review;
- let member disagreement silently overwrite canonical facts;
- overwrite one valid retailer listing with another;
- rewrite applied migrations;
- reintroduce star Fit Rating UI;
- reintroduce Preferred Fit member UI/recommendation behavior without a new owner decision;
- treat `supabase/schema.sql` as canonical;
- expose dormant stretch logic as current V1 without a new owner decision.
