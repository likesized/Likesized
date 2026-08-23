# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Never rewrite or delete an applied migration to hide a superseded experiment.
- Future database changes use new ordered migrations.
- Do not hard-code migration count as architectural truth.
- `supabase/schema.sql` is retired and must not be treated as current schema authority.
- `supabase/storage.sql` is reference/support only where consistent with applied migrations.

This file owns current database behavior/privacy plus explicit implementation debt. Product meaning lives in `docs/V1_PRODUCT_SPEC.md`; roadmap/status/audit order live in `docs/AI_MASTER_LOG.md`.

# Production checkpoint — 2026-08-23
Production Supabase project: `rlksidwniuoxoacumyaf`.

PR #51 database behavior is live. Canonical local migration files remain the replay authority; Supabase production has recorded them under hosted ledger timestamps:
- `supabase/migrations/20260823130000_add_sleepwear_lingerie_category.sql` → production `20260823153830 add_sleepwear_lingerie_category`.
- `supabase/migrations/20260823130100_purchase_context_and_sleepwear_taxonomy.sql` → production `20260823153856 purchase_context_and_sleepwear_taxonomy`.
- `supabase/migrations/20260823140000_add_fit_community_preference.sql` → production `20260823153931 add_fit_community_preference`.
- `supabase/migrations/20260823150000_auto_post_provisional_products_and_item_reporting.sql` → production `20260823154024 auto_post_provisional_products_and_item_reporting`.

Earlier production catalog-confidence migration `20260823054933 generalize_catalog_identity_confidence`, sourced from canonical local `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`, and earlier barcode/notification/body-state/catalog migrations remain immutable applied history.

Supabase-assigned production timestamps may differ from local canonical filenames; never rename applied local migration history to chase generated timestamps.

PR #51 exact-head LikeSized CI run #668 passed the full canonical/type/application/build/fresh-migration/pgTAP suite before merge. Current production Product evidence confirms Maidenform / Heirloom Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25` is Corroborated with 2 distinct wearers and does not require routine catalog review.

## PR #53 database changes — FROZEN / NOT YET PRODUCTION
The current owner-authorized repair batch adds three ordered migrations that must replay successfully and then be applied database-first before the PR #53 application code is merged:
- `20260823160000_add_unconfirmed_catalog_status.sql` — adds enum value `unconfirmed` below `provisional` for candidate-only identity confidence.
- `20260823160100_unconfirmed_identity_and_photo_roles.sql` — implements Unconfirmed gating, front/back Fit Photo roles, Product Label/Tag evidence and related admin/scanner boundaries.
- `20260823160200_needs_more_evidence_followup.sql` — adds Needs More Evidence queue state, evidence-aware Unconfirmed priority, owner-only follow-up status projection and evidence re-entry.

These migrations are **not yet recorded as applied production history**. Do not write hosted versions here until they are actually applied and verified.

# 1. Privacy / body-state foundations
- `profiles` stores member identity under authenticated-member authorization boundaries.
- `fit_profiles` is a shell; raw body values live in normalized owner-private measurement structures.
- Immutable Fit Profile version tables preserve historical private body state.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` is the active matching/body-state evidence pointer and does not rewrite original history.
- `private.fit_report_body_identity_measurements` stores established Product-relevant comparison baselines.
- Raw current/historical body measurements and private size references are never exposed to other members.
- Current-person Match and historical-garment Match expose only derived safe values.

## Fit Community
`public.fit_community` controls Men / Women / Both. `fit_profiles.fit_community` stores the member's private default. Current-person/social RPCs accept an explicit view override without making this value part of body Match math.

Fit Community describes the person/wearer. It is not Product Department. A member reviewing clothing from a different Department remains in their saved community.

PR #53 changes only control placement: first-time setup includes Fit Community; post-onboarding editing lives in Profile Settings rather than My Measurements. Database meaning remains unchanged.

# 2. Public Closet target — OWNER LOCKED, LEGACY VISIBILITY STILL PRESENT
Owner-approved product meaning is one public member Closet:
- member garments and Fit Reports are intended public member-facing content;
- no intended per-garment Private / Shared product mode;
- owner view adds owner-only controls;
- visitor view uses the same garment/Fit Report data without mutation controls;
- raw Fit Profile/body-state/private evidence remains protected.

Current executable production schema still contains legacy `closet_items.visibility` and RLS/query paths that distinguish private/shared content. This is implementation debt, not current product meaning. Closet audit must reconcile it canonically without exposing raw body/private system data.

## PR #53 narrow owner-only unresolved-identity projection
`public.get_own_unconfirmed_submission_status()` is a security-definer owner projection for the authenticated member's own unresolved Unconfirmed submissions. It returns only the minimum fields needed for owner UI: Closet item, candidate id/status, retained retailer URL and Product/Label photo-presence booleans.

This RPC exists specifically so the member UI does **not** gain broad read access to `catalog_candidates` or admin review state.

Active Unconfirmed review remains invisible to the member. The owner UI renders a disclaimer only when the candidate status is `needs_more_evidence`. Other members must never receive that private queue status/disclaimer through Closet/social surfaces.

# 3. Controlled taxonomy foundations
- `garment_types`, `garment_attribute_definitions`, `garment_attribute_options` are the database vocabulary aligned to `lib/garment-taxonomy.ts`.
- `garment_types.intake_active` controls current member-facing Type availability while preserving historical compatibility keys.
- Overall Category is a controlled grouping; `garment_type_key` remains Product identity.
- Sleepwear & Lingerie is live with ten active Types: Pajama pants, Pajama shorts, Pajama set, Nightgown, Robe, Chemise, Babydoll, Teddy, Corset & bustier, Costume lingerie.
- Sleep Shirt is absent; Sweatpants remains Bottoms; Bra/Bralette/Sports Bra/Underwear/Shapewear remain Intimates.
- `color_families` stores controlled colors.
- Material remains evidence, not a Match input.

## Tracked variation definition — IMPLEMENTATION DEBT / ROADMAP LOCK
Current taxonomy stores controlled questions/options and existing recommendation infrastructure includes an `exact_variant` evidence tier. The owner has locked a stricter future tracked-variation meaning:
- only structured questions actually asked for a Garment Type are eligible;
- each question must be explicitly classified as variation-defining, descriptive-only or cosmetic/ignored before it participates;
- **Size must never define tracked variation identity**;
- **Color must never define tracked variation identity**;
- do not assume every controlled question is variation-defining.

Before Product Detail relies on Exact Variation, audit the existing attribute/variant schema and recommendation path and produce one canonical variation-definition map. Do not create a parallel variation table/system by assumption.

# 4. Submission-first catalog architecture
Database layers remain:
1. member garment submission / Fit Report;
2. catalog candidate staging/audit object;
3. canonical Product.

`garment_submissions` preserves member-provided identity/enrichment evidence. `catalog_candidates` holds staging/review state. `catalog_review_flags` holds exception evidence. `catalog_resolution_actions` records accountable system/admin resolution history.

## Pre-publication Unconfirmed + four-tier live Product identity trust
A **clean unique first real member submission** may be materialized/mapped immediately to a canonical Product by the controlled system boundary. Publishing and Product identity trust are separate:
- **Unconfirmed — candidate-only pre-publication identity state** when the member explicitly marks Item / Style / Model uncertain;
- **Provisional — 1 distinct wearer**;
- **Corroborated — 2–4 distinct wearers**;
- **Established — 5+ distinct wearers**;
- **Verified — authoritative/admin-reviewed only**.

`unconfirmed` is added to `public.product_data_status` for candidate identity-confidence storage, but PR #53 adds a database constraint that forbids live `products.catalog_status='unconfirmed'`. Unconfirmed is therefore not a fifth live Product state.

Members still do not directly insert Product truth. Automatic posting runs through the audited candidate→Product mapping architecture and records a system action.

`products.identity_confirmation_count` stores the distinct member count currently attached through Product Fit Reports. `products.identity_trust_tier` stores the four live Product identity states. `private.refresh_product_identity_confidence(product_id)` recalculates those fields from attached wearer evidence and authoritative Verified state.

This identity tier is deliberately separate from `products.catalog_status`, which continues to carry broader field/catalog authority semantics. Wearer count must not silently promote description, material, Department, attributes or other Product facts.

## Explicit uncertainty hard-gate
PR #53 adds `garment_submissions.identity_uncertain boolean not null default false`.

When true:
- the submission/Fit Report/Closet item remain stored normally as unresolved member evidence;
- candidate `identity_confidence` is held at `unconfirmed`;
- candidate is kept in review state;
- an `ambiguous_identity` review flag is retained with requested evidence-presence details;
- `private.auto_promote_catalog_candidate` must return without mapping/creating Product truth;
- additional member submissions or barcode confirmations cannot auto-graduate the candidate while explicit uncertainty remains;
- admin resolution may map to an existing Product or create a new Product, but a newly created Product from this path starts Provisional rather than being automatically treated as Verified.

## Blocking pre-post ambiguity
A candidate does not auto-post when blocking identity evidence already exists. Examples include:
- explicit member identity uncertainty;
- multiple exact canonical Products for the normalized identity;
- possible duplicate identity evidence;
- competing barcode/identifier evidence;
- reused canonical retailer-listing URL conflict;
- other genuine identity ambiguity.

Such a candidate remains unresolved/reviewable. This exception path is why `catalog_candidates` remains necessary even though routine clean items no longer await admin approval.

## Needs More Evidence candidate status
PR #53 extends `catalog_candidates.status` with `needs_more_evidence`.

This is an admin queue state for an unresolved Unconfirmed identity that cannot reasonably be resolved with current evidence. It is not Product truth, does not map the Fit Report, and does not publish anything.

`public.admin_set_catalog_candidate_status(...)` accepts `needs_more_evidence` only when the candidate remains unresolved and Unconfirmed/explicitly uncertain. The transition is audited through existing catalog-resolution history rather than a parallel queue system.

When a member supplies new follow-up evidence through the authorized owner boundary, the candidate automatically returns to `needs_review` and review priority is recalculated.

## Existing Product + later conflict
A later report/conflict does not automatically delete, unpublish or rewrite an existing Product. It sets review evidence/state while the Product remains usable until an audited resolution changes it.

# 5. Catalog review flags and priority
`catalog_review_flags` retains existing exception types and `member_report` plus:
- `priority`: low / medium / high;
- `priority_score`: 1 / 2 / 3.

Published Product trust-aware priority rules:
- Provisional Product (1 wearer) with a credible issue → High;
- Corroborated Product (2–4 wearers) with a credible issue → High;
- Established Product (5+ wearers) → one isolated ordinary disagreement starts Low, a second independent signal escalates Medium, and three or more independent signals escalate High;
- Verified Product → isolated ordinary reports start Low, with repeated independent signals escalating Medium/High;
- strong competing identifiers/duplicate/identity evidence may escalate regardless of trust.

PR #53 changes explicit Unconfirmed candidate work ordering so requested identity evidence drives usefulness:
- Retail/Product webpage + Product Photo + Product Label / Tag Photo present → High;
- one or two requested evidence types present → Medium;
- none present → Low because the case may be impossible to identify;
- `needs_more_evidence` remains Low/parked outside the active work queue until member follow-up.

`private.recalculate_product_review_priority` and `private.recalculate_candidate_review_priority` maintain current urgency. Triggers re-score flags when relevant evidence/status changes, including candidate status transition to/from Needs More Evidence.

Multiple independent member reports may accumulate against the same Product. The schema must not collapse all reporters into one Product-wide open-report row. One reporter also must not be able to manufacture repeated independent signals by submitting duplicates.

# 6. Member Product reporting
`public.report_product_item(product_id, reason, details)` is the one member-facing Product report boundary.

Controlled reasons:
- `inappropriate_content`
- `image_mismatch`
- `incorrect_information`
- `other`

The function creates/refreshes an open `member_report` flag for that reporter/Product, sets `products.catalog_review_needed=true`, and recalculates priority. It does not permit the reporter to rewrite Product fields.

The member-facing Product page exposes the corresponding **Report this item** UI.

# 7. Internal duplicate/identity signals
Existing exact Product/barcode/retailer-link conflict checks remain review signals. The current catalog line includes a conservative same-brand/same-garment-type related-name detector after a new Product is posted.

The detector may add `possible_duplicate` review evidence but does **not** block a clean first Product post retroactively or automatically fuzzy-merge Products. Similarity is triage evidence only.

Future internal checks may expand to reviewed aliases, stronger link/identifier relationships or other safe signals, but must preserve conservative merge rules.

# 8. Barcode relationship confidence and scanner imagery
Barcode confidence remains separate from Product confidence.

- `private.product_barcode_evidence` stores private per-member Product→barcode evidence tied to that member's Product Fit Report.
- first distinct member on a new Product/barcode relationship remains provisional and is not yet canonical `product_identifiers` truth;
- unique provisional barcode evidence may still recognize the Product for the next member;
- second distinct member with corresponding Product Fit Report evidence corroborates the Product→barcode relationship;
- one Product may have multiple corroborated barcodes;
- competing Product claims for one barcode mark review evidence and never silently reassign it.

`private.barcode_identity_confirmations` remains immutable historical scan-confirmation evidence but does not define Product-level confidence by itself.

PR #53 requires `public.lookup_barcode_catalog_match(...)` and confirmation boundaries to exclude unresolved candidates whose identity confidence is `unconfirmed` or whose status is `needs_more_evidence`. Explicit uncertainty can never become another member's scanner suggestion before admin resolution.

`public.get_scan_match_image_source(product_id,candidate_id)` is the narrow authenticated scanner-identification boundary. Scanner image priority is:
1. Product/catalog photo;
2. public/shared member Fit Photo, preferring `photo_role='front'` when available;
3. application placeholder/default when neither exists.

The Fit Photo fallback never becomes canonical Product imagery or Product truth. Authenticated read policies permit scanner display of approved Product/catalog photo storage while shared Fit Photo access continues through its existing shared-photo boundary.

# 9. Fit Photo roles and Product/Label evidence — PR #53
PR #53 changes Fit-photo and catalog-photo evidence without merging their meanings.

## Front/back Fit Photos
`fit_reference_photos.photo_role` is controlled to `front` / `back`. A Closet item may hold at most one of each role. Legacy single-photo rows are migrated/treated as Front so existing evidence remains readable.

Both roles are member wear evidence. They remain separate from Product imagery and do not create separate counted Fit Reports.

## Product Photo
`garment_submissions.product_photo_storage_path` remains unresolved submission Product-display/identity evidence. Known Product photo evidence continues through `product_photo_evidence` and normal Product-photo moderation.

## Product Label / Tag Photo
PR #53 adds `garment_submissions.product_label_photo_storage_path` and `product_label_photo_evidence` for known Product label/tag evidence.

Label/tag photos are private identity-review evidence. They are admin-readable and owner-controlled through the intended evidence flow, but are not generic Product images and must not be surfaced as Product display photos.

# 10. Direct Product search
`search_catalog_products` is the canonical broad textual Product search. Current direct Product search does not accept Fit Community or Department as a hidden gate.

Therefore men's, women's and unisex Products may all appear when they match the direct search query. Fit Community is used by social/wearer discovery, not as a Product-search suppression rule.

Ordinary Product search excludes rejected Product state and does not surface unresolved candidates as independent Products. Unconfirmed/Needs More Evidence candidates therefore never appear in other-member search/suggestions until admin mapping creates/resolves a canonical Product.

# 11. Fit Report counted identity
`public.save_known_fit_report(...)` is the authoritative resolved-Product save boundary.

Compatible report identity uses:
- authenticated member;
- exact Product;
- normalized Size;
- objective physical-answer fingerprint;
- compatible garment-relevant body state.

Color, retailer, barcode, Product Photo, Product Label / Tag Photo, Fit Photo role, purchase context, Fit Result, Condition and notes are not independent counted identity dimensions.

Unresolved Unconfirmed reports preserve their original Fit Profile version/body/fit evidence while `product_id` remains null. Admin resolution later uses the existing controlled candidate→Product mapping transition; it must not rewrite original body/Fit Result history.

Later owner Fit observations on an unresolved garment must preserve its existing garment identity snapshot fields rather than dropping type/answer/fingerprint context merely because `product_id` is still null.

## Objective fingerprint
`Not sure` and Intended Fit do not become positive physical-identity claims. Genuine objective controlled-answer changes may create distinct report states.

The objective fingerprint is not automatically identical to the future tracked fit-variation key. The Product Spec owns that distinction. A future variation-definition audit must determine which structured answers define member-facing Exact Variation while preserving counted-report dedup/history semantics.

## Body-state relevance
`private.product_match_measurements(product_id)` is the shared Product-specific measurement source for Fit Match and report-state identity.

For established baseline values, a current relevant measurement is materially different at:
`abs(current - baseline) / abs(baseline) >= 0.02`

Blank→filled can enrich. Missing current values do not erase established baseline evidence. Accepted under-2% values may roll the private comparison baseline while immutable original `fit_profile_version_id` remains unchanged.

# 12. Owner follow-up evidence boundary — PR #53
`public.add_unconfirmed_catalog_evidence(...)` is the authorized owner-only re-entry boundary for an unresolved explicit-Unconfirmed garment.

It may add/replace only the member's identity-support evidence:
- Retail/Product webpage and normalized form;
- Product Photo storage path;
- Product Label / Tag Photo storage path.

It does not update Product truth or create a Product. It requires the authenticated user to own the unresolved `garment_submissions` row and requires `identity_uncertain=true` with unresolved Unconfirmed candidate state.

At least one new piece of evidence is required. On success:
- evidence is retained on that submission;
- candidate moves to `needs_review`;
- ambiguous-identity flag evidence metadata is refreshed/recreated if necessary;
- priority recalculates.

Storage upload/removal is handled by the authorized server action around this RPC so failed DB writes do not intentionally leave newly uploaded replacement evidence as the final state.

# 13. Purchase/acquisition context
`fit_report_purchase_context` is owner-scoped observation data keyed by `fit_report_id`.

- one counted Fit Report contributes at most one acquisition observation;
- blank context creates no row;
- Purchased From stores free-form text/normalization and may reference an existing retailer by exact normalized match;
- it does not create a retailer or Product retailer listing;
- Price Paid is bounded fixed numeric;
- Purchase Method is Online / In Store / Gift;
- Month + Year are a valid pair; no exact day is invented;
- another member's context is never inherited;
- purchase context does not participate in Product identity, report identity, Match, recommendation or retailer ranking.

Analytics must preserve response denominators.

# 14. Product evidence / field conflicts
Shared facts resolve field by field. Product identity trust does not wholesale promote Size, Color, Material, Fit Result, physical answers, Condition, Notes, purchase context, Product Label / Tag Photo or another member's Fit Photos.

Verified evidence outranks ordinary member-derived evidence. Disagreement remains auditable. Garment Type conflicts remain identity review, not silent Product mutation.

Material defaults use exact complete recipe signatures; they are never averaged into a recipe nobody submitted.

# 15. Size-system defaults
`public.get_product_default_size_kinds(product_ids)` may derive a unique broad Product size-system kind from normalized Fit Report history. Actual member size always begins blank.

`lookup_corroborated_candidate_defaults(...)` remains a narrow compatibility/help boundary for exceptional unresolved Corroborated candidates that cannot yet safely materialize. It does not turn the candidate into ordinary Product search truth. Explicit Unconfirmed candidates do not become public Product truth through this helper.

# 16. Admin authorization / moderation
`private.admin_users` remains the explicit admin authorization boundary. Catalog/moderation changes require authorized server/database boundaries and accountable history.

Admin review is exception-driven, not a manual approval queue for every clean first garment. Required operating visibility includes Product/candidate identity trust, confirmation counts, open flags, priority, barcode confidence, retailer links, Product/Label evidence history and system-vs-admin resolution provenance.

PR #53 adds a dedicated operational split without creating a second catalog system:
- active Unconfirmed review, ordered by requested evidence usefulness;
- `needs_more_evidence` parked candidate bucket;
- admin can return a parked item to Needs Review;
- member follow-up does that automatically when new evidence is supplied.

Existing `content_reports` moderation covers supported member-visible photo/post targets. Product-level `member_report` uses `catalog_review_flags`, keeping Product identity/content concerns inside the catalog review architecture rather than creating a parallel Product moderation system.

# 17. SerpAPI discovery cache
`private.serpapi_discovery_cache` is private admin research evidence, never ordinary member Product authority. Raw external results do not create/update/merge Products automatically.

# 18. Retailer listings / shopping data
- `retailer_listings` is one-to-many for resolved Products/variants.
- valid destinations append/dedupe rather than overwrite one another;
- normalized URL collisions may trigger review;
- purchase-context retailer observations are separate from Product Shop destinations;
- commission never affects Match, recommendation, Product identity, search ranking or retailer choice.

# 19. Following, person notifications and Product notifications
`follows` is the one canonical **Following** relationship; Fit Twin remains **system-generated** from current-person Match among followed members.

- Follow alone does not enable person notifications.
- Person bell can subscribe to future followed-person activity; bell OFF leaves Follow intact.
- global Following-notification preference is a master switch.
- Product notification watch is separate from people, Like and Wish state and is a one-shot future qualifying exact-Product alert.

# 20. LikeLocker / Wish Locker / Outfit foundations
Product likes, Outfit likes and Wish Locker purchase intent are separate states. Outfits remain V1 and reuse canonical Closet/Product/taxonomy foundations.

An unresolved Unconfirmed/Needs More Evidence Closet garment may still be used by its owner in Styles/Outfits. That does not materialize Product truth, and private candidate/review status must not leak to viewers.

# 21. Search foundations
- direct Product search is global as defined above;
- exact Brand/Product aliases and canonical identifiers/listings can aid resolution;
- unresolved candidates are not ordinary Product results;
- Unconfirmed/Needs More Evidence are specifically excluded from shared Product search/suggestions/discovery and unresolved barcode suggestions;
- barcode lookup is a narrow recognition exception and ambiguity is never auto-selected;
- raw Fit Profile measurements/private size references are never exposed through search.

# 22. Recommendation foundations
Evidence hierarchy remains:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

Help Me Size It reuses this architecture. `Would Buy Again` does not affect size recommendation/confidence. Pending/unmapped candidate reports, including Unconfirmed/Needs More Evidence, do not count as exact canonical Product evidence until mapped.

Before member-facing Product Detail uses `exact_variant`, the existing recommendation/variant foundation must be audited against the owner-locked tracked-variation definition. Size and Color must not become exact-variation key fields. Body Match remains body similarity and must not be collapsed with Fit Result into a synthetic garment-fit percentage.

# 23. Current implementation debt / open verification
- PR #51 behavior is complete/live; PR #52 reconciled docs/status on `main`.
- PR #53 is the frozen current repair batch and is not yet production-complete.
- The proposed sex/body-specific public measurement FAQ wording remains pending owner copy approval.
- Unified public Closet migration and mutation/lifecycle model remain future audit work beyond the narrow Needs More Evidence owner flow.
- Complete all-Products admin priority/filter/merge/split UX remains to build beyond the PR #53 operational queue.
- Purchase-context aggregate/admin analytics UI remains open.
- Product merge/split, richer alias UX, spam moderation, broader Product-photo review, external barcode-provider feasibility, SerpAPI admin UX and browser-level regression remain open where previously scoped.
- Tracked variation-definition audit is required before Product Detail Exact Variation behavior is treated as settled.
- A Foundation Technical Audit is required after PR #53 deployment to re-check Product/candidate materialization, Unconfirmed gating, Needs More Evidence re-entry, owner-only privacy, Product/Label photo boundaries, trust refresh, report accumulation, barcode confidence, front/back Fit photos, Fit Report identity, exact-variant foundations, Fit Community/search, purchase isolation, migration/RLS/privacy and recommendation interactions.

# 24. Verification contract
For PR #53/future changes prove as applicable:
1. canonical integrity/drift guard;
2. TypeScript;
3. focused application safeguards;
4. production build;
5. fresh replay of all ordered migrations;
6. full database behavior/privacy tests;
7. clean first unique member submission auto-materializes/maps a Provisional Product without routine admin approval;
8. explicit uncertainty produces an unresolved candidate with `identity_confidence=unconfirmed` and does not create/map a Product automatically;
9. a live Product cannot store `catalog_status=unconfirmed`;
10. Unconfirmed remains blocked from automatic promotion regardless of additional member evidence until admin resolution;
11. Unconfirmed/Needs More Evidence do not appear in other-member Product search, suggestions or unresolved barcode matches;
12. active Unconfirmed review produces no owner/member warning;
13. admin may move only unresolved Unconfirmed identity to `needs_more_evidence`;
14. Needs More Evidence is excluded from active admin flag work and remains unpublished;
15. only the owner can read their minimal unresolved-status projection; other members cannot see the disclaimer/review state;
16. owner follow-up requires at least one new evidence item, preserves prior evidence, returns candidate to Needs Review and recalculates priority;
17. Unconfirmed evidence priority is High with all three requested evidence types, Medium with partial evidence and Low with none/parked state;
18. admin resolution maps history without rewriting original Fit Profile/Fit Result evidence and a newly created Product from explicit Unconfirmed starts Provisional;
19. Front and Back Fit Photos may coexist exactly once per role; legacy single photos remain readable;
20. scanner confirmation image priority is Product/catalog photo → Front/shared Fit Photo when available → other shared Fit Photo → placeholder;
21. Product Label / Tag Photo remains separate/private identity evidence and never becomes generic Product imagery;
22. Fit Notes validate at 2,000 characters on initial and later observation paths;
23. second through fourth distinct Product wearers produce Corroborated identity trust;
24. fifth distinct wearer produces Established identity trust without auto-verifying Product facts;
25. Verified remains admin/authoritative only;
26. later reports/conflicts do not silently rewrite/unpublish Product history;
27. Product report reasons create trust-aware catalog flags;
28. published Provisional/Corroborated issues start High while Established/Verified isolated ordinary disagreements start Low and repeated independent signals escalate;
29. near-name/identifier/link signals create review evidence without automatic fuzzy merge;
30. first Product/barcode evidence remains provisional and second distinct member corroborates it;
31. multiple legitimate barcodes coexist under one Product;
32. competing barcode/Product claims do not silently reassign;
33. purchase context remains one owner-scoped observation per Fit Report;
34. direct Product search is not gated by Fit Community/Department;
35. Sleepwear app taxonomy matches replayed database vocabulary;
36. owner interaction review occurs before a surface is marked owner-confirmed;
37. when tracked-variation logic is implemented, Size and Color are excluded and only explicitly approved question keys participate.

# 25. Forbidden regressions
Do not:
- expose raw current/historical body measurements through social/search/feed/product pages;
- expose another member's Unconfirmed/Needs More Evidence admin state or private owner disclaimer;
- grant broad member read access to `catalog_candidates` merely to render the owner warning;
- use Fit Community as Match math or Product Department;
- require a Men/Women switch for direct Product search;
- surface Unconfirmed/Needs More Evidence as Products in other-member search/suggestions/barcode recognition;
- allow explicit Unconfirmed to auto-promote from member count alone;
- store Unconfirmed as live Product status;
- show a member warning during normal active Unconfirmed review;
- leave impossible unresolved cases indefinitely in the active admin queue when admin has explicitly parked them for more evidence;
- let owner follow-up evidence directly create/rewrite canonical Product truth;
- restore routine admin approval for every clean unique new garment;
- let a member directly rewrite canonical Product fields;
- collapse Provisional/Corroborated/Established/Verified identity trust into unrelated Product-fact catalog status;
- auto-verify from member count;
- use fuzzy similarity as automatic Product merge authority;
- silently delete/unpublish an existing Product because one later report arrives;
- promote a scanner fallback Fit Photo or Product Label / Tag Photo into canonical Product imagery;
- require barcode presence for Product identity;
- silently reassign a barcode between competing Products;
- treat purchase context as Product truth;
- make Size or Color a tracked fit-variation key;
- automatically treat every controlled garment question as variation-defining;
- create a second follow/catalog/sizing/moderation/variation system;
- rewrite applied migrations;
- reintroduce star Fit Rating UI;
- treat `supabase/schema.sql` as canonical.