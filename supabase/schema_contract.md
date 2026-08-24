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

PR #56 Foundation hardening is live on `main` at `7bd1a1a6048bcc991ca6a55547e454b10feec832`. Canonical local migration files remain the replay authority; Supabase production has recorded:
- `supabase/migrations/20260823160000_add_unconfirmed_catalog_status.sql` → production `20260823205533 add_unconfirmed_catalog_status`.
- `supabase/migrations/20260823160100_unconfirmed_identity_and_photo_roles.sql` → production `20260823205642 unconfirmed_identity_and_photo_roles`.
- `supabase/migrations/20260823160200_needs_more_evidence_followup.sql` → production `20260823205712 needs_more_evidence_followup`.
- `supabase/migrations/20260824000500_foundation_audit_security_hardening.sql` → production `20260824003029 foundation_audit_security_hardening`.

The immediately preceding PR #51 migrations remain immutable applied history:
- `supabase/migrations/20260823130000_add_sleepwear_lingerie_category.sql` → production `20260823153830 add_sleepwear_lingerie_category`.
- `supabase/migrations/20260823130100_purchase_context_and_sleepwear_taxonomy.sql` → production `20260823153856 purchase_context_and_sleepwear_taxonomy`.
- `supabase/migrations/20260823140000_add_fit_community_preference.sql` → production `20260823153931 add_fit_community_preference`.
- `supabase/migrations/20260823150000_auto_post_provisional_products_and_item_reporting.sql` → production `20260823154024 auto_post_provisional_products_and_item_reporting`.

Earlier production catalog-confidence migration `20260823054933 generalize_catalog_identity_confidence`, sourced from canonical local `supabase/migrations/20260823040000_generalize_catalog_identity_confidence.sql`, and earlier barcode/notification/body-state/catalog migrations remain immutable applied history.

Supabase-assigned production timestamps may differ from local canonical filenames; never rename applied local migration history to chase generated timestamps.

PR #56 final exact-head LikeSized CI run #696 (`32676618920`) on tested head `49293638d878a6b7c0e5b5ce07894653de4c3310` passed canonical integrity, exact dependencies, TypeScript, all focused safeguards, production build, pinned Supabase CLI, fresh replay of every canonical migration and the complete database behavior/privacy suite before merge.

The Foundation migration was applied database-first and verified directly against hosted schema/functions/storage/RLS state before the exact tested tree was squash-merged as `7bd1a1a6048bcc991ca6a55547e454b10feec832`.

Hosted PR #56 verification passed all 12 targeted hardening checks: canonical evidence path constraints, Product Label insertion policy, narrow scanner Product-photo storage helper/policy, hardened direct scanner-image candidate gates, candidate archive trigger/history state, Needs More Evidence audit action support and expected function presence. Security/performance advisors showed no new blocking schema/RLS failure from this migration.

Known production Product evidence remained intact after the rollout: Maidenform / Heirloom Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25` remains Corroborated with 2 distinct wearers and 4 Fit Reports, with UPC `196988323504` still present.

## Foundation Technical Audit — PR #56 COMPLETE / DEPLOYED
The post-PR-#53 Foundation audit found six authorization/history defects not covered by the previous test suite. The single additive migration `supabase/migrations/20260824000500_foundation_audit_security_hardening.sql` fixes them in production.

Live hardening contract:
- pending Product Photo path = submitting member / `pending` / exact Closet item / `product-*`;
- pending Product Label path = submitting member / `pending` / exact Closet item / `label-*`;
- known Product Label path = submitting member / `labels` / exact Product / exact Fit Report / filename;
- Product Label insertion requires the authenticated owner, exact Fit Report owner and exact Fit Report Product to agree;
- private Label/Tag storage is never readable merely because another member is authenticated;
- the only cross-member read from `catalog-submission-photos` is an exact pending Product Photo path proven scanner-eligible by a narrow SECURITY DEFINER boolean helper; the helper exposes no candidate row or review state;
- direct scanner-image RPC calls enforce the same unresolved/non-Unconfirmed/non-Needs-More-Evidence/non-uncertain candidate boundary;
- when a candidate becomes resolved, its internal unique identity key is archived with its candidate UUID while normalized Brand/Item/Type history remains unchanged, freeing the base key for at most one later unresolved candidate;
- Needs More Evidence records `mark_needs_more_evidence` in the resolution ledger.

Production-data compatibility inspection before the migration found zero current `product_label_photo_evidence` rows and zero current pending Product/Label storage paths, so the new path constraints did not conflict with existing production evidence.

The PR #56 regression suite contains 17 focused pgTAP checks. CI #693 replayed the entire migration history and exposed an over-restrictive first-pass storage policy because the policy queried private candidate/submission tables as the requesting member. The test was not weakened; the policy was corrected with the narrow security-definer path helper. Code/test head `b39297983396958105a1f64be1ac121af7ba8ff0` passed CI #694 (`32676273815`), and final reconciled head `49293638d878a6b7c0e5b5ce07894653de4c3310` passed CI #696 (`32676618920`) through the full required verification contract.

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

First-time setup includes Fit Community; post-onboarding editing lives in Profile Settings rather than My Measurements. Database meaning remains unchanged.

# 2. Public Closet target — OWNER LOCKED, LEGACY VISIBILITY STILL PRESENT
Owner-approved product meaning is one public member Closet:
- member garments and Fit Reports are intended public member-facing content;
- no intended per-garment Private / Shared product mode;
- owner view adds owner-only controls;
- visitor view uses the same garment/Fit Report data without mutation controls;
- raw Fit Profile/body-state/private evidence remains protected.

Current executable production schema still contains legacy `closet_items.visibility` and RLS/query paths that distinguish private/shared content. This is implementation debt, not current product meaning. Closet audit must reconcile it canonically without exposing raw body/private system data.

## Narrow owner-only unresolved-identity projection
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

Before Product Detail relies on Exact Variation, roadmap item 11A must audit every controlled question and produce one canonical variation-definition map shared by evidence/recommendation/Admin behavior. Do not create a parallel variation table/system by assumption.

The Foundation audit confirms the current counted-report `objective_variant_key` is deliberately a separate, currently broader concept: application hashing excludes Intended Fit and Not sure, but otherwise includes objective structured answers. Do not silently narrow or repurpose that fingerprint during Foundation hardening. After 11A classification, the owner must decide whether descriptive-only answer changes still represent a distinct same-member counted Fit Report situation.

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

`unconfirmed` is part of `public.product_data_status` for candidate identity-confidence storage, while a database constraint forbids live `products.catalog_status='unconfirmed'`. Unconfirmed is therefore not a fifth live Product state.

Members still do not directly insert Product truth. Automatic posting runs through the audited candidate→Product mapping architecture and records a system action.

`products.identity_confirmation_count` stores the distinct member count currently attached through Product Fit Reports. `products.identity_trust_tier` stores the four live Product identity states. `private.refresh_product_identity_confidence(product_id)` recalculates those fields from attached wearer evidence and authoritative Verified state.

This identity tier is deliberately separate from `products.catalog_status`, which continues to carry broader field/catalog authority semantics. Wearer count must not silently promote description, material, Department, attributes or other Product facts.

## Explicit uncertainty hard-gate
`garment_submissions.identity_uncertain boolean not null default false` records explicit member uncertainty.

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

## Candidate identity-key history
A resolved historical candidate must not permanently occupy the normalized Brand+Item+Type aggregation key and absorb a later unresolved explicit-uncertain submission.

The live PR #56 trigger archives only a resolved candidate's internal unique `identity_key` by appending its candidate UUID. The normalized Brand/Item/Type columns remain unchanged historical truth. Existing resolved candidates were backfilled the same way. The unsuffixed base key is therefore reserved for the single current unresolved candidate for that identity.

## Needs More Evidence candidate status
`catalog_candidates.status` includes `needs_more_evidence`.

This is an admin queue state for an unresolved Unconfirmed identity that cannot reasonably be resolved with current evidence. It is not Product truth, does not map the Fit Report, and does not publish anything.

`public.admin_set_catalog_candidate_status(...)` accepts `needs_more_evidence` only when the candidate remains unresolved and Unconfirmed/explicitly uncertain. The transition is audited through existing catalog-resolution history rather than a parallel queue system and now records exact action `mark_needs_more_evidence`.

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

Explicit Unconfirmed candidate work ordering uses requested identity evidence:
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

Barcode lookup/confirmation boundaries exclude unresolved candidates whose identity confidence is `unconfirmed` or whose status is `needs_more_evidence`. Explicit uncertainty can never become another member's normal scanner suggestion before admin resolution.

`public.get_scan_match_image_source(product_id,candidate_id)` is the narrow authenticated scanner-identification boundary. Scanner image priority is:
1. Product/catalog photo;
2. public/shared member Fit Photo, preferring `photo_role='front'` when available;
3. application placeholder/default when neither exists.

The direct candidate branch now independently enforces unresolved, non-Unconfirmed, non-Needs-More-Evidence and non-uncertain eligibility. A crafted direct RPC call cannot expose image paths for the private review states that normal scanner lookup excludes.

The Fit Photo fallback never becomes canonical Product imagery or Product truth.

# 9. Fit Photo roles and Product/Label evidence
Fit-photo and catalog-photo evidence remain distinct.

## Front/back Fit Photos
`fit_reference_photos.photo_role` is controlled to `front` / `back`. A Closet item may hold at most one of each role. Legacy single-photo rows are migrated/treated as Front so existing evidence remains readable.

Both roles are member wear evidence. They remain separate from Product imagery and do not create separate counted Fit Reports.

## Product Photo
`garment_submissions.product_photo_storage_path` remains unresolved submission Product-display/identity evidence. Known Product photo evidence continues through `product_photo_evidence` and normal Product-photo moderation.

Cross-member pending Product Photo read exists only for scanner-eligible unresolved candidates and uses the exact-path SECURITY DEFINER boolean helper. The helper exposes no candidate row or review state.

## Product Label / Tag Photo
`garment_submissions.product_label_photo_storage_path` and `product_label_photo_evidence` store label/tag identity evidence.

Label/tag photos are private identity-review evidence. They are not generic Product images and must not be surfaced as Product display photos.

Known-label insertion now explicitly binds the authenticated owner’s Fit Report to the same Product and canonical owner/Product/Fit Report storage path. The shared catalog-submission bucket no longer grants bucket-wide authenticated SELECT; another authenticated member cannot read another member’s Label/Tag object merely because it shares that bucket.

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
`Not sure` and Intended Fit do not become positive physical-identity claims. Genuine objective controlled-answer changes currently may create distinct report states.

The objective fingerprint is not automatically identical to the future tracked fit-variation key. Roadmap item 11A must classify each structured question before Exact Variation is implemented. After that classification, counted-report semantics must be reconciled explicitly: a descriptive-only question may be useful metadata without necessarily deserving another same-member counted Fit Report. Do not change this as an incidental side effect of other work.

## Body-state relevance
`private.product_match_measurements(product_id)` is the shared Product-specific measurement source for Fit Match and report-state identity.

For established baseline values, a current relevant measurement is materially different at:
`abs(current - baseline) / abs(baseline) >= 0.02`

Blank→filled can enrich. Missing current values do not erase established baseline evidence. Accepted under-2% values may roll the private comparison baseline while immutable original `fit_profile_version_id` remains unchanged.

# 12. Owner follow-up evidence boundary
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

Database path constraints now bind pending Product/Label evidence to the submission’s canonical member + Closet-item path. Known label evidence uses the stricter member + Product + Fit Report path constraint.

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

The current operational split remains:
- active Unconfirmed review, ordered by requested evidence usefulness;
- `needs_more_evidence` parked candidate bucket;
- admin can return a parked item to Needs Review;
- member follow-up does that automatically when new evidence is supplied.

Needs More Evidence records its exact audit action and does not create a second queue system.

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
- PR #55 application/UI rollout is complete and live on the production line; it changed no database migration state.
- PR #56 Foundation security/history hardening is complete and live in production; its 17 targeted regressions and hosted verification are part of the current foundation contract.
- The proposed sex/body-specific public measurement FAQ wording remains pending owner copy approval.
- Unified public Closet migration and mutation/lifecycle model remain future audit work beyond the narrow Needs More Evidence owner flow.
- Complete all-Products admin priority/filter/merge/split UX remains to build beyond the current operational queue.
- Purchase-context aggregate/admin analytics UI remains open.
- Product merge/split, richer alias UX, spam moderation, broader Product-photo review, external barcode-provider feasibility, SerpAPI admin UX and browser-level regression remain open where previously scoped.
- Tracked variation-definition audit #11A is now the next required logic audit before Product Detail Exact Variation or counted-report fingerprint reconciliation.

# 24. Verification contract
For the current production foundation and future changes prove as applicable:
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
22. a known Product Label/Tag insert must bind the authenticated owner’s exact Fit Report to the same Product and canonical owner/Product/Fit Report path;
23. another authenticated member may not read another member’s Label/Tag object merely because it shares the catalog-submission bucket;
24. an eligible unresolved pending Product Photo remains readable for scanner confirmation without granting the member candidate/submission table visibility;
25. Unconfirmed/Needs More Evidence/explicitly uncertain candidate paths are blocked both by normal scanner lookup and crafted direct scanner-image RPC calls;
26. pending Product/Label SECURITY DEFINER writes reject cross-user/cross-Closet storage paths;
27. a resolved candidate preserves historical normalized identity without permanently blocking a fresh later unresolved candidate for the same Brand+Item+Type;
28. Needs More Evidence writes an exact accountable resolution action;
29. Fit Notes validate at 2,000 characters on initial and later observation paths;
30. second through fourth distinct Product wearers produce Corroborated identity trust;
31. fifth distinct wearer produces Established identity trust without auto-verifying Product facts;
32. Verified remains admin/authoritative only;
33. later reports/conflicts do not silently rewrite/unpublish Product history;
34. Product report reasons create trust-aware catalog flags;
35. published Provisional/Corroborated issues start High while Established/Verified isolated ordinary disagreements start Low and repeated independent signals escalate;
36. near-name/identifier/link signals create review evidence without automatic fuzzy merge;
37. first Product/barcode evidence remains provisional and second distinct member corroborates it;
38. multiple legitimate barcodes coexist under one Product;
39. competing barcode/Product claims do not silently reassign;
40. purchase context remains one owner-scoped observation per Fit Report;
41. direct Product search is not gated by Fit Community/Department;
42. Sleepwear app taxonomy matches replayed database vocabulary;
43. owner interaction review occurs before a surface is marked owner-confirmed;
44. when tracked-variation logic is implemented, Size and Color are excluded and only explicitly approved question keys participate;
45. after 11A, counted-report fingerprint behavior is reconciled deliberately rather than assuming every structured question difference deserves another counted same-member report.

# 25. Forbidden regressions
Do not:
- expose raw current/historical body measurements through social/search/feed/product pages;
- expose another member's Unconfirmed/Needs More Evidence admin state or private owner disclaimer;
- grant broad member read access to `catalog_candidates` merely to render the owner warning or authorize scanner photo access;
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
- allow a resolved historical candidate to absorb a new unresolved explicit-uncertain submission merely because its normalized identity matches;
- promote a scanner fallback Fit Photo or Product Label / Tag Photo into canonical Product imagery;
- make a private Product Label/Tag object readable through bucket-wide authenticated storage access;
- allow a crafted direct scanner-image RPC to expose an Unconfirmed/Needs More Evidence candidate path;
- accept arbitrary cross-user evidence storage paths through SECURITY DEFINER writers;
- require barcode presence for Product identity;
- silently reassign a barcode between competing Products;
- treat purchase context as Product truth;
- make Size or Color a tracked fit-variation key;
- automatically treat every controlled garment question as variation-defining;
- silently equate the current objective counted-report fingerprint with the future tracked-variation map;
- create a second follow/catalog/sizing/moderation/variation system;
- rewrite applied migrations;
- reintroduce star Fit Rating UI;
- treat `supabase/schema.sql` as canonical.