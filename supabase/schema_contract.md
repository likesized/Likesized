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

Latest confirmed production catalog-confidence migration before PR #51 is `20260823054933 generalize_catalog_identity_confidence`, sourced from canonical local `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`. Earlier barcode, notification, body-state and catalog migrations remain immutable applied history.

The following PR #51 migrations are **branch-only until explicitly applied to production**:
- `20260823130000_add_sleepwear_lingerie_category.sql`
- `20260823130100_purchase_context_and_sleepwear_taxonomy.sql`
- `20260823140000_add_fit_community_preference.sql`
- `20260823150000_auto_post_provisional_products_and_item_reporting.sql`

Do not describe these structures/behaviors as live merely because they exist on the branch. Supabase-assigned production timestamps may differ from local canonical filenames; never rename local applied migration history to chase generated timestamps.

# 1. Privacy / body-state foundations
- `profiles` stores member identity under authenticated-member authorization boundaries.
- `fit_profiles` is a shell; raw body values live in normalized owner-private measurement structures.
- Immutable Fit Profile version tables preserve historical private body state.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` is the active matching/body-state evidence pointer and does not rewrite original history.
- `private.fit_report_body_identity_measurements` stores established Product-relevant comparison baselines.
- Raw current/historical body measurements and private size references are never exposed to other members.
- Current-person Match and historical-garment Match expose only derived safe values.

## Fit Community — PR #51 branch behavior
`public.fit_community` controls Men / Women / Both. `fit_profiles.fit_community` stores the member's private default. Current-person/social RPCs accept an explicit view override without making this value part of body Match math.

Fit Community describes the person/wearer. It is not Product Department. A member reviewing clothing from a different Department remains in their saved community.

# 2. Public Closet target — OWNER LOCKED, LEGACY VISIBILITY STILL PRESENT
Owner-approved product meaning is one public member Closet:
- member garments and Fit Reports are intended public member-facing content;
- no intended per-garment Private / Shared product mode;
- owner view adds owner-only controls;
- visitor view uses the same garment/Fit Report data without mutation controls;
- raw Fit Profile/body-state/private evidence remains protected.

Current executable production schema still contains legacy `closet_items.visibility` and RLS/query paths that distinguish private/shared content. This is implementation debt, not current product meaning. Closet audit must reconcile it canonically without exposing raw body/private system data.

# 3. Controlled taxonomy foundations
- `garment_types`, `garment_attribute_definitions`, `garment_attribute_options` are the database vocabulary aligned to `lib/garment-taxonomy.ts`.
- `garment_types.intake_active` controls current member-facing Type availability while preserving historical compatibility keys.
- Overall Category is a controlled grouping; `garment_type_key` remains Product identity.
- PR #51 adds Sleepwear & Lingerie with ten active Types: Pajama pants, Pajama shorts, Pajama set, Nightgown, Robe, Chemise, Babydoll, Teddy, Corset & bustier, Costume lingerie.
- Sleep Shirt is absent; Sweatpants remains Bottoms; Bra/Bralette/Sports Bra/Underwear/Shapewear remain Intimates.
- `color_families` stores controlled colors.
- Material remains evidence, not a Match input.

# 4. Submission-first catalog architecture
Database layers remain:
1. member garment submission / Fit Report;
2. catalog candidate staging/audit object;
3. canonical Product.

`garment_submissions` preserves member-provided identity/enrichment evidence. `catalog_candidates` holds staging/review state. `catalog_review_flags` holds exception evidence. `catalog_resolution_actions` records accountable system/admin resolution history.

## PR #51 latest owner-locked trust model — branch behavior
`20260823150000_auto_post_provisional_products_and_item_reporting.sql` supersedes the older five-member canonicalization gate for current product meaning.

A **clean unique first real member submission** may be materialized/mapped immediately to a canonical Product by the controlled system boundary:
- one distinct attached member Fit Report → Product is **Provisional**;
- two or more distinct attached member Fit Reports may strengthen a Provisional Product to **Corroborated**;
- **Verified** remains admin/authoritative and is never achieved from member count alone.

Members still do not directly insert Product truth. Automatic posting runs through the same audited candidate→Product mapping architecture and records a system action.

`products.identity_confirmation_count` stores the distinct member count currently attached through Product Fit Reports. `private.refresh_product_identity_confidence(product_id)` refreshes this count and may promote Provisional → Corroborated. It does not auto-demote existing stronger status and never auto-verifies.

## Blocking pre-post ambiguity
A candidate does not auto-post when blocking identity evidence already exists. Examples include:
- multiple exact canonical Products for the normalized identity;
- possible duplicate identity evidence;
- competing barcode/identifier evidence;
- reused canonical retailer-listing URL conflict;
- other genuine identity ambiguity.

Such a candidate remains unresolved/Needs Review. This exception path is why `catalog_candidates` remains necessary even though routine clean items no longer await admin approval.

## Existing Product + later conflict
A later report/conflict does not automatically delete, unpublish or rewrite an existing Product. It sets review evidence/state while the Product remains usable until an audited resolution changes it.

# 5. Catalog review flags and priority — PR #51 branch behavior
`catalog_review_flags` retains existing exception types and adds `member_report` plus:
- `priority`: low / medium / high;
- `priority_score`: 1 / 2 / 3.

Trust-aware priority rules:
- Provisional Product or uncorroborated candidate with an open flag → High;
- Corroborated Product/candidate → normally Medium; multiple independent reporters/conflict signals may escalate High;
- Verified Product → normally Low for one isolated ordinary member report; multiple independent signals escalate Medium/High.

Competing identifiers, multiple identity conflicts and strong duplicate signals may escalate regardless of trust.

`private.recalculate_product_review_priority` and `private.recalculate_candidate_review_priority` maintain current urgency. Triggers re-score flags when relevant status/evidence changes.

# 6. Member Product reporting — PR #51 branch behavior
`public.report_product_item(product_id, reason, details)` is the one member-facing Product report boundary.

Controlled reasons:
- `inappropriate_content`
- `image_mismatch`
- `incorrect_information`
- `other`

The function creates/refreshes an open `member_report` flag for that reporter/Product, sets `products.catalog_review_needed=true`, and recalculates priority. It does not permit the reporter to rewrite Product fields.

The member-facing Product page exposes the corresponding **Report this item** UI.

# 7. Internal duplicate/identity signals
Existing exact Product/barcode/retailer-link conflict checks remain review signals. PR #51 additionally includes a conservative same-brand/same-garment-type related-name detector after a new Product is posted.

The detector may add `possible_duplicate` review evidence but does **not** block a clean first Product post retroactively or automatically fuzzy-merge Products. Similarity is triage evidence only.

Future internal checks may expand to reviewed aliases, stronger link/identifier relationships or other safe signals, but must preserve conservative merge rules.

# 8. Barcode relationship confidence
Barcode confidence remains separate from Product confidence.

- `private.product_barcode_evidence` stores private per-member Product→barcode evidence tied to that member's Product Fit Report.
- first distinct member on a new Product/barcode relationship remains provisional and is not yet canonical `product_identifiers` truth;
- unique provisional barcode evidence may still recognize the Product for the next member;
- second distinct member with corresponding Product Fit Report evidence corroborates the Product→barcode relationship;
- one Product may have multiple corroborated barcodes;
- competing Product claims for one barcode mark review evidence and never silently reassign it.

`private.barcode_identity_confirmations` remains immutable historical scan-confirmation evidence but does not define Product-level confidence by itself.

# 9. Direct Product search
`search_catalog_products` is the canonical broad textual Product search. Current direct Product search does not accept Fit Community or Department as a hidden gate.

Therefore men's, women's and unisex Products may all appear when they match the direct search query. Fit Community is used by social/wearer discovery, not as a Product-search suppression rule.

Ordinary Product search excludes rejected Product state and does not surface unresolved candidates as independent Products.

# 10. Fit Report counted identity
`public.save_known_fit_report(...)` is the authoritative resolved-Product save boundary.

Compatible report identity uses:
- authenticated member;
- exact Product;
- normalized Size;
- objective physical-answer fingerprint;
- compatible garment-relevant body state.

Color, retailer, barcode, Product Photo, purchase context, Fit Result, Condition and notes are not independent counted identity dimensions.

## Objective fingerprint
`Not sure` and Intended Fit do not become positive physical-identity claims. Genuine objective controlled-answer changes may create distinct report states.

## Body-state relevance
`private.product_match_measurements(product_id)` is the shared Product-specific measurement source for Fit Match and report-state identity.

For established baseline values, a current relevant measurement is materially different at:
`abs(current - baseline) / abs(baseline) >= 0.02`

Blank→filled can enrich. Missing current values do not erase established baseline evidence. Accepted under-2% values may roll the private comparison baseline while immutable original `fit_profile_version_id` remains unchanged.

# 11. Purchase/acquisition context — PR #51 branch behavior
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

# 12. Product evidence / field conflicts
Shared facts resolve field by field. Product identity trust does not wholesale promote Size, Color, Material, Fit Result, physical answers, Condition, Notes, purchase context or another member's photos.

Verified evidence outranks ordinary member-derived evidence. Disagreement remains auditable. Garment Type conflicts remain identity review, not silent Product mutation.

Material defaults use exact complete recipe signatures; they are never averaged into a recipe nobody submitted.

# 13. Size-system defaults
`public.get_product_default_size_kinds(product_ids)` may derive a unique broad Product size-system kind from normalized Fit Report history. Actual member size always begins blank.

`lookup_corroborated_candidate_defaults(...)` remains a narrow compatibility/help boundary for exceptional unresolved Corroborated candidates that cannot yet safely materialize. It does not turn the candidate into ordinary Product search truth.

# 14. Admin authorization / moderation
`private.admin_users` remains the explicit admin authorization boundary. Catalog/moderation changes require authorized server/database boundaries and accountable history.

Admin review is exception-driven, not a manual approval queue for every clean first garment. Required operating visibility includes Product/candidate trust, confirmation counts, open flags, priority, barcode confidence, retailer links, evidence history and system-vs-admin resolution provenance.

Existing `content_reports` moderation covers supported member-visible photo/post targets. Product-level `member_report` uses `catalog_review_flags`, keeping Product identity/content concerns inside the catalog review architecture rather than creating a parallel Product moderation system.

# 15. SerpAPI discovery cache
`private.serpapi_discovery_cache` is private admin research evidence, never ordinary member Product authority. Raw external results do not create/update/merge Products automatically.

# 16. Retailer listings / shopping data
- `retailer_listings` is one-to-many for resolved Products/variants.
- valid destinations append/dedupe rather than overwrite one another;
- normalized URL collisions may trigger review;
- purchase-context retailer observations are separate from Product Shop destinations;
- commission never affects Match, recommendation, Product identity, search ranking or retailer choice.

# 17. Following, person notifications and Product notifications
`follows` is the one canonical **Following** relationship; Fit Twin remains system-generated from current-person Match among followed members.

- Follow alone does not enable person notifications.
- Person bell can subscribe to future followed-person activity; bell OFF leaves Follow intact.
- global Following-notification preference is a master switch.
- Product notification watch is separate from people, Like and Wish state and is a one-shot future qualifying exact-Product alert.

# 18. LikeLocker / Wish Locker / Outfit foundations
Product likes, Outfit likes and Wish Locker purchase intent are separate states. Outfits remain V1 and reuse canonical Closet/Product/taxonomy foundations.

# 19. Search foundations
- direct Product search is global as defined above;
- exact Brand/Product aliases and canonical identifiers/listings can aid resolution;
- unresolved candidates are not ordinary Product results;
- barcode lookup is a narrow recognition exception and ambiguity is never auto-selected;
- raw Fit Profile measurements/private size references are never exposed through search.

# 20. Recommendation foundations
Evidence hierarchy remains:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

Help Me Size It reuses this architecture. `Would Buy Again` does not affect size recommendation/confidence. Pending/unmapped candidate reports do not count as exact canonical Product evidence until mapped.

# 21. Current implementation debt / open verification
Before PR #51 may be called complete:
- full exact-head canonical/type/build/migration/database tests must pass;
- new Provisional auto-post must be proven on a fresh migration replay;
- member report priority must be proven at Provisional/Corroborated/Verified trust levels;
- direct Product search global behavior must remain safeguarded;
- Sleepwear, purchase context, Fit Community and New Fit Report review behavior require owner/live verification after any authorized deployment;
- current production Maidenform/Heirloom historical evidence must be preserved through any backfill/materialization;
- unified public Closet migration and mutation model remain future audit work;
- complete all-Products admin priority/filter UX remains to build;
- merge/split, alias UX, spam moderation, Product-photo review, external barcode-provider feasibility, SerpAPI admin UX and browser-level regression remain open where previously scoped.

# 22. Verification contract
Before this line is complete, prove as applicable:
1. canonical integrity/drift guard;
2. TypeScript;
3. focused application safeguards;
4. production build;
5. fresh replay of all ordered migrations;
6. full database behavior/privacy tests;
7. clean first unique member submission auto-materializes/maps a Provisional Product without routine admin approval;
8. blocking pre-post ambiguity remains unresolved/reviewable;
9. second distinct Product wearer can promote Provisional → Corroborated;
10. Verified remains admin/authoritative only;
11. later reports/conflicts do not silently rewrite/unpublish Product history;
12. Product report reasons create trust-aware catalog flags;
13. near-name/identifier/link signals create review evidence without automatic fuzzy merge;
14. first Product/barcode evidence remains provisional and second distinct member corroborates it;
15. multiple legitimate barcodes coexist under one Product;
16. competing barcode/Product claims do not silently reassign;
17. purchase context remains one owner-scoped observation per Fit Report;
18. direct Product search is not gated by Fit Community/Department;
19. Sleepwear app taxonomy matches replayed database vocabulary;
20. owner interaction review occurs before a surface is marked owner-confirmed.

# 23. Forbidden regressions
Do not:
- expose raw current/historical body measurements through social/search/feed/product pages;
- use Fit Community as Match math or Product Department;
- require a Men/Women switch for direct Product search;
- restore routine admin approval for every clean unique new garment;
- let a member directly rewrite canonical Product fields;
- auto-verify from member count;
- use fuzzy similarity as automatic Product merge authority;
- silently delete/unpublish an existing Product because one later report arrives;
- require barcode presence for Product identity;
- silently reassign a barcode between competing Products;
- treat purchase context as Product truth;
- create a second follow/catalog/sizing/moderation system;
- rewrite applied migrations;
- reintroduce star Fit Rating UI;
- treat `supabase/schema.sql` as canonical.
