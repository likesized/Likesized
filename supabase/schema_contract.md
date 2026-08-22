# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Do not rewrite applied migrations.
- Future database changes use new ordered migrations.
- Do not hard-code migration count as architectural truth.
- `supabase/schema.sql` is retired and must not be used as an alternate current-state schema.
- `supabase/storage.sql` may remain a storage/reference aid only where consistent with migrations; it never overrides migration history.

This contract owns database behavior/privacy and explicitly records implementation debt when current migrations/source have not yet caught up with owner-approved product meaning.

Product meaning: `docs/V1_PRODUCT_SPEC.md`.
Roadmap/status: `docs/AI_MASTER_LOG.md`.

# Current stable foundations to preserve

- `profiles` stores member identity under existing authorization boundaries.
- `fit_profiles` is a profile shell; raw body values belong in normalized owner-private measurement structures.
- immutable Fit Profile version tables preserve historical owner-private body state.
- `fit_reports.fit_profile_version_id` preserves the body state of each try-on; later body edits do not rewrite history.
- current-person matching returns safe derived scores/coverage only; raw measurements remain private.
- historical Product/Fit Report matching uses immutable snapshots.
- Private Closet evidence remains owner-only; Shared evidence follows current RLS rules.
- fit/reference photos follow the current Shared evidence boundary.
- **`follows` is the one canonical **Following** relationship**; Fit Twin is a derived designation within the followed set, not another relationship table.
- LikeLocker Product Likes, Outfit Likes and Wish Locker remain separate intents.
- canonical Outfit structures/storage/likes remain in V1.

# Controlled taxonomy foundation

- `garment_types`, `garment_attribute_definitions`, and `garment_attribute_options` hold database vocabulary aligned with the one canonical application taxonomy.
- `garment_types.intake_active` controls member-facing Type availability without breaking historical/matching compatibility keys.
- `color_families` stores controlled Color families.
- `product_variants.color_family_key` stores canonical color family where a resolved Product/variant exists.
- `fit_reports.reported_condition` preserves New / Used / Altered.
- Altered evidence remains personal history but is excluded from normal Product recommendation evidence.
- Material/Fabric Composition may be controlled evidence but does not become Match/recommendation input or an Explore filter without a later owner-approved change.
- Stretch remains outside current V1 member input/filter behavior.

# Submission-first catalog direction — OWNER LOCKED / BRANCH IMPLEMENTATION IN PROGRESS

The canonical architecture separates:

1. **member garment submission / Fit Report**
2. **pending catalog candidate**
3. **canonical Product**

Members must not directly create canonical Products from manual fallback.

## Required database behavior

When an exact canonical Product is known:
- Closet item/Fit Report references that Product normally;
- reviewed Product facts remain canonical;
- member disagreement is stored as evidence/flagging rather than silent Product overwrite.

When Product identity is unresolved:
- persist the member's garment submission and Fit Report without blocking the member;
- preserve best-known Brand/Model/Type and optional identity/enrichment evidence;
- associate the submission with a pending catalog candidate;
- **do not create a canonical Product solely because the member submitted manual text**;
- do not include the unresolved item in exact canonical Product search/aggregation as if its identity were verified.

Later catalog resolution must be able to:
- map one or many submissions to an existing Product;
- create one genuinely new canonical Product through an authorized catalog-resolution path;
- preserve immutable Fit Report/body snapshot while assigning the canonical Product;
- preserve original submission/evidence/audit history;
- split incorrectly grouped submissions/Products without silent loss.

## Branch implementation now present
Migration `20260822162000_submission_first_catalog_foundation.sql` is the current branch implementation foundation. It is **not production truth until full replay/tests/owner-authorized promotion pass**.

It currently proposes:
- nullable `closet_items.product_id` and `fit_reports.product_id` for unresolved submissions;
- `catalog_candidates` as the one pending-candidate queue/state graph;
- `garment_submissions` as member-supplied unresolved identity/enrichment evidence linked to the real Closet item/Fit Report;
- `catalog_review_flags` as typed review flags;
- `catalog_resolution_actions` as catalog-resolution audit history;
- `product_aliases` as reviewed hidden Product-name aliases;
- private `catalog-submission-photos` storage for unresolved Product Photo evidence;
- `record_pending_garment_submission(...)` for authenticated pending submission recording/aggregation;
- `flag_catalog_possible_duplicate(...)` for the authorized duplicate-flag write boundary;
- admin map/create/status RPCs for resolving candidates.

Application source on PR #47 now has a separate known-Product path and unresolved-submission path. The unresolved path writes nullable Product references and candidate evidence instead of inserting into `products` directly.

**This implementation remains unverified until canonical CI, typecheck, build, complete fresh migration replay and database behavior/privacy tests pass.**

## Pending-candidate lifecycle
The one candidate state model currently uses:
- `pending`
- `needs_enrichment`
- `needs_review`
- `merged`

A resolved canonical Product is the **Verified Catalog Item** state rather than another duplicate candidate status.

Candidates support submission count and recency for demand prioritization.

# Canonical Product / identity foundation

- `brands` and `products` remain the one canonical Product identity graph.
- Product aliases/Brand aliases normalize reviewed spelling/punctuation/common typo variants without creating duplicate public identities.
- Product families are explicit compatible groups, not fuzzy-title buckets.
- `product_identifiers` provide UPC/barcode/other identifier evidence where applicable.
- manufacturer Style/Article values are evidence and are not globally unique Product IDs by default.
- SKU is not assumed globally unique Product identity.
- `retailer_listings` is the one-to-many relationship for legitimate canonical Product/variant retail destinations.

Identity resolution must be conservative:
- different manufacturer Style/Article IDs may still belong to one base Product as variants/SKUs;
- shared broad model wording may contain multiple fit-distinct Products;
- no fuzzy-title-only automatic merge;
- ambiguous identity creates review state/flag.

`product_identity_evidence` includes Brand, Item/Model, manufacturer Style/Article and barcode disagreement evidence. Barcode disagreement uses identifier normalization rather than Product-name normalization.

# Duplicate / alias / merge / split

The branch now has a canonical typed flag model and candidate→Product mapping foundation. The complete owner-required duplicate system still must support:

- reviewed Brand aliases;
- reviewed Product aliases;
- possible-duplicate candidate/Product flags and identity reasons;
- audited duplicate dismissal;
- audited candidate→existing Product mapping;
- audited new Product creation from a reviewed candidate;
- transactional canonical Product-to-Product merge;
- transactional canonical Product/candidate split;
- preservation/reassignment of submissions, Fit Reports, identifiers, retailer listings, aliases, evidence and photos as appropriate.

A merge/split must never silently destroy Fit Report history or immutable body-version links.

`catalog_review_flags`, `product_identity_evidence`, and `products.catalog_review_needed` must be used as one coherent review architecture rather than parallel independent systems.

# Product evidence / field conflict

Shared Product facts resolve field by field.

Existing evidence lifecycle concepts such as provisional / corroborated / verified / rejected remain valid where applicable.

Rules:
- repeat claims by one member do not count as independent corroboration;
- independent agreement may strengthen a value;
- materially competing values trigger Product/candidate review;
- admin-verified/locked facts cannot be silently overwritten by later member evidence;
- later disagreement remains auditable evidence;
- if conflict may represent different Products/variants, duplicate/split review takes precedence over simple consensus voting.

`product_identity_evidence`, metadata/attribute/material/description evidence, and moderation history should be extended/reused rather than replaced by a second graph.

# Flag/review model — OWNER LOCKED

`catalog_review_flags.flag_type` must distinguish at least:

## Possible Duplicate
Potential equivalent Brands/Products/candidates without enough evidence for safe auto-merge.

## Conflicting Product Fact
Competing Brand/Model/Type/attribute/Department/material/Style/description or other shared Product values.

## Ambiguous Catalog Identity / Needs Review
Unresolved candidate identity or broad/generic naming that requires judgment/research.

## Reported / Spam Content
Supported inappropriate/spam Fit Photos, Product Photos, Outfit content, garment submissions and Fit Reports.

## Retail / Identifier Conflict
Conflicting UPC/Style/listing identity evidence, including one normalized retailer URL associated with apparently different Products.

Flags themselves do not rewrite data or remove content. Resolution actions are authorized/audited.

# Admin authorization / audit

- `private.admin_users` remains the explicit admin allowlist/authorization boundary unless deliberately replaced by a later canonical admin-role model.
- ordinary members must never gain admin catalog powers through client-controlled state.
- moderation/catalog actions require authorized server/database boundaries.
- append-only audit/history records actor, time, target, action and reason/context appropriate to the action.

Current branch admin foundation includes candidate queue reads and RPCs to map a candidate to an existing Product, create one reviewed Product from a candidate, and update candidate queue status. These actions remain branch-only/unverified.

Required complete admin capabilities include:
- inspect candidate submissions/evidence and demand count;
- map pending candidate/submissions to existing Product;
- create one new canonical Product through authorized resolution;
- merge/split;
- create aliases;
- verify/override/lock Product fields/descriptions;
- audited reopen;
- dismiss false flags;
- remove supported inappropriate/spam content;
- append/dedupe legitimate retailer listings;
- inspect/use cached SerpAPI research;
- trigger controlled SerpAPI research batches through the application/server boundary.

# SerpAPI discovery cache — CURRENT BRANCH FOUNDATION

Migration `20260822152000_add_serpapi_discovery_cache.sql` creates `private.serpapi_discovery_cache` for reusable external research evidence.

The cache is private and must never become a member-visible shadow catalog.

The owner-approved 150-item benchmark populated reusable research responses. Later temporary benchmark writer/control migrations existed only to perform that one-time run; `20260822154000_close_serpapi_benchmark_writer.sql` removes the temporary public write functions/control table while preserving the cache.

Required semantics:
- cached raw SerpAPI responses are evidence/candidate data only;
- cache row does not create/update/merge canonical `products`;
- Google Shopping `product_id` is not LikeSized Product identity;
- raw Shopping titles are not canonical Product names.

# Admin SerpAPI batch research — REQUIRED TARGET / NOT YET COMPLETE

The final admin research system must use the private cache first.

Before a paid query:
1. normalize intended query;
2. check for equivalent cached research;
3. reuse suitable cache;
4. make a SerpAPI call only when missing or an authorized refresh is justified.

Batch research must:
- accept explicit admin-selected candidates;
- dedupe equivalent queries inside the batch;
- show cached vs newly fetched status;
- respect configurable usage warnings/caps/hard stop;
- preserve successful responses for reuse;
- allow no-useful-result caching with a shorter freshness policy if implemented;
- never convert bulk research into bulk Product creation/approval;
- require explicit catalog-resolution actions after research.

The current private cache and completed benchmark do **not** by themselves satisfy the final admin batch-research feature.

# Starter 150 — CURRENT DATABASE DIRECTIVE

The owner-supplied 150 starter entries remain launch-preparation data.

Migration `20260822073000_community_catalog_intake_and_seed.sql` is retained in ordered branch history and seeds those entries into the prior provisional Product model during replay.

Migration `20260822162100_reclassify_starter_seed_as_candidates.sql` is the later canonical branch transition for the new direction. It:
- inserts/reuses all 150 as `catalog_candidates` / enrichment research input;
- preserves the already-cached SerpAPI benchmark evidence independently;
- removes only empty/unreferenced provisional seed Products created by the earlier seed migration;
- preserves any starter Product that already gained real Closet/Fit/variant/identifier/listing/evidence/photo references for review rather than destructive deletion;
- removes only orphaned seed Product families after Product cleanup.

The full replay must prove this transition behaves exactly as intended before production.

# Barcode behavior — OWNER LOCKED

Member barcode scanning queries LikeSized only.

Known barcode:
- resolve to canonical Product.

Unknown barcode:
- preserve barcode on unresolved garment submission/candidate evidence;
- continue member Fit Report;
- do not directly create Product;
- do not call SerpAPI from member intake.

Conflicting barcode evidence routes to identity/duplicate review.

# Retailer listing foundation — OWNER LOCKED

- `retailer_listings` remains the canonical one-to-many listing relationship for resolved Products/variants.
- a Product may have zero, one or multiple valid retailer listings.
- a new valid retailer URL appends/dedupes; it must not overwrite another valid retailer listing.
- normalized URLs support dedupe/identity review.
- a retailer URL submitted with an unresolved garment remains candidate evidence until Product mapping.
- same normalized URL apparently tied to different Products is a strong identity/duplicate flag.
- future affiliate routing must preserve the original clean canonical retailer URL/listing.
- valid retailer destinations remain valid even when not currently affiliate-monetizable.
- retailer selection/order must not be driven by commission.
- affiliate/click-source metadata must never disclose private body measurements.

# Product photos

- Product Photo is separate from personal Fit Photo.
- Product photos are candidate/Product evidence subject to moderation.
- unresolved Product Photo is stored under the private pending-submission boundary and must not be silently attached to an arbitrary canonical Product before mapping.
- resolved Product photos may use the existing canonical Product-photo evidence pipeline where applicable.
- authorized admins need deletion/moderation boundaries and audit history.

# Following vs Fit Twin database semantics

- `follows` = user-controlled `follower_id → followed_id` relationship.
- `follows` does not itself mean Fit Twin.
- Fit Twin is a derived strong current-person Match designation inside the followed set.
- initial configurable threshold remains 85% Overall Match under the current product decision.
- do not create a second Fit Twin relationship graph.
- legacy function/table names containing `fit_twin` remain naming debt until deliberately migrated.

# Feed / notification foundation

- Following activity remains based on `follows` + Shared content visibility.
- private/deleted source content must not continue exposing activity.
- Fit-Twin-named helper identifiers are legacy naming debt, not product semantics.
- `product_evidence_notifications` remains an owner-scoped insufficient-evidence watch mechanism where applicable; it is not a second recommendation engine.

# LikeLocker foundation

- `product_likes` = private ordinary Product likes.
- `outfit_likes` = Outfit likes.
- `wish_locker_items` = private purchase intent.
- LikeLocker exposes these distinct states in one destination.
- Shop/affiliate actions are presentation over valid retailer listings, not a second save graph.

# Outfit foundation

- existing canonical Outfit posts/links/likes remain preserved.
- Outfit item links expose garment evidence only under valid visibility rules.
- Outfit likes remain distinct from Product likes.
- existing atomic Outfit creation behavior must remain transactional.

# Search foundation

- member catalog search uses canonical Products/Brands/identifiers/listings and does not treat unresolved pending submissions as independent Product results.
- grouped Explore search may include Garments, Outfits and People while preserving privacy.
- ordinary Product search deduplicates to one canonical Product result.
- New Fit Report suggestions prefer canonical Brands/Products/reviewed aliases.
- `product_aliases` must be integrated into canonical search/resolution before the alias feature is called complete.
- search must not expose raw Fit Profile measurements/private size references.

# Fit Result / legacy identifier

Current physical values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

Legacy identifiers containing `fit_rating` may remain for these physical outcomes. There is **no current V1 1–5-star Fit Rating UI**.

# Recommendation foundation

Evidence hierarchy:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

`lib/recommendation.ts::recommendSize()` remains the recovered canonical application recommendation implementation unless later owner-approved work changes it.

Help Me Size It reuses the same architecture; no second sizing engine/table.

`Would Buy Again` does not influence size recommendation/confidence.

**Pending/unmapped garment submissions must not count as exact Product evidence until safely mapped.**

# Moderation foundation

Existing moderation tables/actions remain useful foundations where compatible:
- `content_reports`
- `moderation_actions`
- `catalog_moderation_actions`
- Product evidence review structures
- `product_identity_evidence`
- `catalog_review_flags`
- `catalog_resolution_actions`

Final admin work must extend these rather than create a parallel moderation/catalog system.

Current owner-required behavior still not safe to claim complete includes:
- full Product-to-Product merge/split;
- admin batch SerpAPI UI/server workflow;
- Product alias search integration;
- field lock/reopen coverage across final shared facts;
- spam garment-submission/Fit Report coverage;
- complete pending→canonical Product-photo transfer/moderation integration;
- full browser-level behavioral regression verification.

# Verification contract

Before current catalog work is called complete, canonical CI/verification must prove:
1. canonical integrity/drift checks;
2. typecheck;
3. focused application tests;
4. production build;
5. complete fresh replay of the canonical migration directory;
6. canonical DB privacy/behavior/security tests;
7. submission-first member fallback does not create canonical Product directly;
8. pending Fit Reports remain usable and preserve immutable body state;
9. candidate→Product mapping is auditable/safe;
10. aliases/duplicate flags/merge/split preserve evidence/history;
11. SerpAPI admin research checks cache first and cannot directly write Products;
12. starter 150 state is reconciled;
13. retailer listings append/dedupe rather than overwrite;
14. admin moderation/auth boundaries hold.

Historical green CI on another commit is preservation evidence only. Current head must pass its own gate.

# Forbidden regressions

Do not:
- add fixed raw body columns back to `fit_profiles` as current architecture;
- blend current-person Match with historical garment Match;
- expose raw body data through search/social/feed/notifications;
- create a second follow/catalog/sizing/moderation system;
- let member manual fallback directly create canonical Product;
- call SerpAPI from ordinary member intake;
- let SerpAPI raw result/title/Google Product ID directly define Product identity;
- auto-merge fuzzy duplicates without sufficient evidence/review;
- let member disagreement silently overwrite canonical facts;
- overwrite one valid retailer listing with another;
- rewrite/delete applied migrations to hide superseded experiments;
- reintroduce private Fit Photo state;
- reintroduce star Fit Rating UI from legacy identifiers;
- treat `supabase/schema.sql` as canonical;
- expose dormant stretch logic as current V1 without a new owner decision.
