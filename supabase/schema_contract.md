# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Never rewrite or delete an applied migration to hide a superseded experiment.
- Future database changes use new ordered migrations.
- Do not hard-code migration count as architectural truth.
- `supabase/schema.sql` is retired and must not be treated as current schema authority.
- `supabase/storage.sql` is reference/support only where consistent with applied migrations.

This file owns current database behavior/privacy plus explicit implementation debt. Product meaning lives in `docs/V1_PRODUCT_SPEC.md`; roadmap/status/deployment history live in `docs/AI_MASTER_LOG.md`.

# Production checkpoint — 2026-08-24
Production Supabase project: `rlksidwniuoxoacumyaf`.

Current application behavior is production-live through PR #79 squash merge `8835a413680daef0b78ec890ffa50c84424bdc37`. Exact PR #79 head `ec4bebec4f2743cb8461a724d50e2cb7c1b1529e` passed full LikeSized CI #869 (`32799021871`): canonical integrity, exact dependency install, TypeScript, all focused application safeguards, production Next.js build, complete fresh replay of every canonical migration and the complete database behavior/privacy suite all passed. PR #79 added no production database migration.

PR #77 remains the most recent production database migration batch. The owner explicitly authorized that production batch on 2026-08-24, and its three additive migrations were applied database-first and smoke-verified before application cutover:
- `supabase/migrations/20260824231500_outfit_comment_likes.sql` → production `20260825000654 outfit_comment_likes`;
- `supabase/migrations/20260824234500_live_profile_identity.sql` → production `20260825000708 live_profile_identity`;
- `supabase/migrations/20260825000500_fix_live_comment_like_count_projection.sql` → production `20260825000722 fix_live_comment_like_count_projection`.

The established Roadmap 12 foundation migrations remain immutable production history:
- `20260824133400_add_outfit_comment_moderation_target.sql` → production `20260824164156 add_outfit_comment_moderation_target`;
- `20260824133500_new_outfit_v1_social_foundation.sql` → production `20260824164328 new_outfit_v1_social_foundation`;
- `20260824133600_complete_new_outfit_v1_boundaries.sql` → production `20260824164410 complete_new_outfit_v1_boundaries`;
- `20260824133700_harden_new_outfit_v1_social_controls.sql` → production `20260824164420 harden_new_outfit_v1_social_controls`;
- `20260824133800_canonical_public_closet_and_outfit_public_identity.sql` → production `20260824164452 canonical_public_closet_and_outfit_public_identity`;
- `20260824133900_fix_outfit_compatibility_photo_registration.sql` → production `20260824164507 fix_outfit_compatibility_photo_registration`.

Earlier catalog, Fit Report, identity, privacy and security migrations remain immutable applied history. Supabase-assigned production timestamps may differ from local canonical filenames; never rename applied local migration history to chase generated timestamps.

After PR #77 database application, hosted smoke verification confirmed:
- `profile-photos` is a public storage bucket for public current member identity;
- `public.outfit_comment_likes` exists;
- `public.get_public_outfit_comments(uuid,integer)` executes cleanly with its declared `bigint` Like-count projection.

PR #79 application deployment `dpl_3aSPoi4UwKgZHHDyMQKdosatgYVh` reached READY for merge `8835a413680daef0b78ec890ffa50c84424bdc37`, aliases `likesized.com`, the live site returned HTTP 200, and the checked runtime-error window was clean.

## PR #80 branch-only database change — NOT PRODUCTION APPLIED
Active repair PR #80 adds `supabase/migrations/20260825021000_outfit_comment_cursor_pagination.sql`.

This migration is **not applied to production**. It creates `public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` for real newest-first cursor pagination of published Outfit comments. If PR #80 receives production authorization, this migration must be applied and smoke-verified before the PR #80 application cutover because the repaired comment API depends on it.

# 1. Privacy / body-state foundations — LOCKED
- `profiles` stores member identity; exact Fit Profile/body measurements are not stored there.
- `fit_profiles` is a shell; raw body values live in normalized owner-private measurement structures.
- Immutable Fit Profile versions preserve historical private body state.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` is the active matching/body-state evidence pointer and does not rewrite original history.
- `private.fit_report_body_identity_measurements` stores established Product-relevant comparison baselines.
- Raw current/historical body measurements and private size references are never exposed to other members.
- Current-person Match and historical-garment Match expose only derived safe values.

## Public current profile identity
A member profile photo, when uploaded, is public current identity rather than a content-time snapshot.

- Storage bucket `profile-photos` is public-readable and remains owner-controlled for writes.
- Outfit, Explore and public-comment surfaces resolve the current `profiles.avatar_url` at render/query time.
- Outfit/comment rows do not copy an avatar path merely to preserve the photo that existed when content was created.
- A later profile-photo update therefore changes the identity photo shown on existing Outfit/comment surfaces without rewriting those historical content rows.
- Raw body data remains private; making the profile photo public does not change Fit Profile privacy.

## Fit Community
`public.fit_community` controls Men / Women / Both. `fit_profiles.fit_community` stores the member's private default. Current-person/social RPCs accept an explicit view override without making this value part of body Match math.

Fit Community describes the person/wearer. It is not Product Department. First-time setup includes Fit Community; post-onboarding editing lives in Profile Settings rather than My Measurements.

# 2. Unified member-visible Closet — OWNER LOCKED / DEPLOYED
LikeSized has one authenticated-member-visible Closet foundation:
- no member-controlled per-garment Private / Shared product mode;
- owner view adds owner-only controls to the same canonical garment/Fit Report content;
- **My Closet** is the application owned-content hub for Garments, Outfits and FITuition; this does not create a second database content system;
- raw Fit Profile/body state, private size references, private catalog/label evidence and admin candidate/review state remain separately protected.

`20260824133800_canonical_public_closet_and_outfit_public_identity.sql` keeps the historical physical `closet_items.visibility` column only for immutable replay compatibility, defaults/backfills it to `shared`, and enforces the current shared-only V1 value. The column is not a product setting and must not reappear as a member choice.

Authenticated members may read current Closet items, Fit Reports, controlled Fit dimensions and Fit-reference-photo metadata. Ownership continues to govern writes/deletes. Fit-reference-photo storage is authenticated-member-readable wear evidence and owner-writable without a visibility transition.

## Narrow owner-only unresolved-identity projection
`public.get_own_unconfirmed_submission_status()` is a security-definer projection for the authenticated member's own unresolved Unconfirmed submissions. It returns only the minimum fields needed for owner UI and does not grant broad read access to `catalog_candidates` or admin review state.

Active Unconfirmed review remains invisible to the member. The owner UI renders a disclaimer only for `needs_more_evidence`. Other members never receive that private queue status through Closet/social/Outfit surfaces.

# 3. Controlled taxonomy and tracked variation — LOCKED
- `garment_types`, `garment_attribute_definitions`, `garment_attribute_options` hold controlled database vocabulary aligned to `lib/garment-taxonomy.ts`.
- `garment_types.intake_active` controls current member-facing Type availability while preserving historical keys.
- Overall Category is a controlled grouping; `garment_type_key` remains Product identity.
- `color_families` stores controlled colors.
- Material remains evidence, not a Match input.

Current tracked-variation rules:
- only structured questions actually asked for a current Garment Type are eligible;
- every structured question remaining in current V1 intake is variation-defining;
- `intended_fit` is retired from every current Garment Type question set;
- `sneakers.shoe_use` is retired from current intake;
- **Size never defines tracked variation identity**;
- **Color never defines tracked variation identity**.

`lib/garment-taxonomy.ts` and its derived `GARMENT_VARIATION_DEFINITION_MAP` are the canonical current application classification. Do not create a parallel variation table/system by assumption.

Historical stored answers for retired questions may remain inert for migration/history compatibility. The counted-report `objective_variant_key` remains deliberately separate from tracked variation; historical report rekeying requires a separate deliberate design with collision/history handling.

# 4. Submission-first catalog architecture — LOCKED
Database layers remain:
1. member garment submission / Fit Report;
2. catalog candidate staging/audit object;
3. canonical Product.

`garment_submissions` preserves member-provided identity/enrichment evidence. `catalog_candidates` holds staging/review state. `catalog_review_flags` holds exception evidence. `catalog_resolution_actions` records accountable system/admin resolution history.

## Product identity trust
- **Unconfirmed** = candidate-only pre-publication identity state when the member explicitly marks Item / Style / Model uncertain.
- **Provisional** = 1 distinct wearer.
- **Corroborated** = 2–4 distinct wearers.
- **Established** = 5+ distinct wearers.
- **Verified** = authoritative/admin-reviewed only.

`unconfirmed` may exist in candidate identity-confidence storage, while a constraint forbids live `products.catalog_status='unconfirmed'`. Repeated reports from one member do not manufacture distinct-wearer trust.

A clean unique first real submission may be materialized/mapped through the audited candidate→Product boundary. Blocking ambiguity—explicit uncertainty, competing exact Products, duplicate/identifier/listing conflict or other genuine identity ambiguity—keeps the candidate unresolved and reviewable.

## Needs More Evidence
`catalog_candidates.status='needs_more_evidence'` parks an unresolved Unconfirmed identity that cannot reasonably be resolved with current evidence. It is not Product truth and publishes nothing. The transition is audited as `mark_needs_more_evidence`.

`public.add_unconfirmed_catalog_evidence(...)` lets only the owning member add/replace Retail/Product webpage, Product Photo and Product Label / Tag Photo evidence. New evidence returns the candidate to `needs_review` and recalculates priority; it does not directly create or rewrite Product truth.

## Known Product correction
`public.record_member_product_identity_issue(product_id, field_key, value)` is the authenticated member evidence boundary for disputing known Product Brand/Item/Style/Barcode identity. It records provisional review evidence without directly overwriting canonical Product identity. The general normalization helper remains unavailable to ordinary authenticated direct EXECUTE.

# 5. Product review, moderation and conflict boundaries — LOCKED
Product reports and internal identity signals create auditable review evidence; ordinary members never rewrite Product truth directly.

Published Product trust-aware priority:
- Provisional or Corroborated + credible issue → High;
- Established → one isolated ordinary disagreement starts Low, repeated independent signals escalate;
- Verified → isolated ordinary reports start Low, repeated independent reports/conflicts may escalate;
- strong competing identifiers/duplicate evidence may escalate regardless of trust.

Explicit Unconfirmed candidate priority is based on useful identity evidence present. `needs_more_evidence` remains parked until follow-up.

`public.report_product_item(product_id, reason, details)` is the member-facing Product reporting boundary. Controlled reasons include inappropriate content, image mismatch, incorrect information and other. The function creates/refreshes report evidence and marks review need; it does not grant field-write authority.

Existing content moderation applies to supported Outfit/photo/comment targets. Admin authority remains behind `private.admin_users` and audited server/database boundaries.

# 6. Barcode relationship confidence and scanner imagery — LOCKED
Barcode confidence is separate from Product confidence.

- first distinct member associating a new Product/barcode relationship is provisional;
- second distinct member with corresponding Product Fit Report evidence corroborates it;
- one Product may have multiple legitimate barcodes;
- competing Product claims for one barcode become review evidence, never silent reassignment;
- Unconfirmed/Needs More Evidence/explicitly uncertain candidate identities are excluded from other-member scanner suggestions.

`public.get_scan_match_image_source(product_id,candidate_id)` is the narrow scanner-identification boundary. Image priority is Product/catalog photo → shared Front Fit Photo when available → other shared Fit Photo → application placeholder. A Fit Photo fallback never becomes canonical Product imagery or Product truth.

# 7. Fit Photo, Product Photo and Label evidence — LOCKED
- `fit_reference_photos.photo_role` is controlled to Front/Back; each is separate wear evidence and neither creates another counted Fit Report by itself.
- Product Photo is catalog-display evidence subject to normal evidence/moderation rules.
- Product Label / Tag Photo is private identity-review evidence and must never be promoted to generic Product imagery.
- Known-label insertion binds the authenticated owner, exact Product and exact Fit Report to the canonical storage path.
- Shared catalog-submission storage never grants bucket-wide authenticated access to another member's private Label/Tag evidence.

# 8. Direct Product search — LOCKED
`search_catalog_products` is the canonical broad textual Product search. Direct Product search does not accept Fit Community or Department as a hidden gate.

Men's, women's and unisex Products may all appear when they match the query. Unresolved candidates are not independent Product results; Unconfirmed/Needs More Evidence identities remain excluded until controlled resolution creates/maps canonical Product truth.

# 9. Fit Report counted identity — LOCKED
`public.save_known_fit_report(...)` is the authoritative resolved-Product save boundary.

Compatible counted report identity uses:
- authenticated member;
- exact Product;
- normalized Size;
- objective physical-answer fingerprint;
- compatible garment-relevant body state.

Color, retailer, barcode, Product/Label/Fit photos, purchase context, Fit Result, Condition and notes do not independently create another counted identity.

For established relevant body baseline values, a current measurement is materially different at `abs(current - baseline) / abs(baseline) >= 0.02`. Blank→filled may enrich; missing current values do not erase established baseline evidence. Original `fit_profile_version_id` remains immutable.

There is **no current V1 1–5-star Fit Rating UI**; the database's historical compatibility vocabulary must not be interpreted as current numeric Fit Rating product behavior.

# 10. Purchase/acquisition context — LOCKED
`fit_report_purchase_context` is owner-scoped observation data keyed by Fit Report.

- one counted Fit Report contributes at most one acquisition observation;
- blank context creates no row;
- Purchased From may reference an existing retailer by exact normalized match but does not create a retailer or Product listing;
- another member's context is never inherited;
- purchase context does not participate in Product identity, report identity, Match, recommendation or retailer ranking.

# 11. Retailer listings / shopping — LOCKED
`retailer_listings` is the canonical resolved-Product shopping destination model. Valid destinations append/dedupe rather than overwrite one another. Purchase-context retailer observations remain separate. Commission never affects Match, recommendation, Product identity, search ranking or retailer choice.

# 12. Following, Twin context and notifications — LOCKED
`follows` is the one canonical **Following** relationship; Fit Twin remains **system-generated** from current-person Match among followed members.

Twin designation is calculated from current Tops and Bottoms regional Match quality in application/current-person matching logic; Overall Match by itself does not grant Twin status. The database must not create a second user-controlled Twin relationship table.

Follow alone does not enable person notifications. Person notifications and Product one-shot Match notifications remain separate from Following, Like and Wish state.

# 13. LikeLocker / Wish Locker / Outfit foundations — ROADMAP 12 DEPLOYED THROUGH PR #79
Product likes, Outfit likes, comment likes and Wish Locker purchase intent are distinct states. Outfits reuse canonical Closet/Product/taxonomy foundations; no second garment or shopping system exists.

Core Outfit schema:
- `outfit_posts` draft/published lifecycle with Headline, Story, comment toggle, publish timestamp and counters;
- `outfit_photos` canonical 1–6 gallery rows with Main/order and display/feed paths;
- owner-private `outfit-draft-photos` before publish and public `outfit-photos` for published editorial imagery;
- `outfit_photo_tags` normalized hotspot coordinates limited to garments already tagged on the Outfit;
- `outfit_occasions` controlled 1–2 published Occasion values;
- `outfit_style_tags` normalized community Style vocabulary, maximum three;
- flat plain-text `outfit_comments` with authenticated write/delete boundaries and safe public projection;
- `member_blocks`, integrated with the one canonical Following graph;
- public view/share counters plus follow-attribution counter;
- private `outfit_shop_clicks` commerce attribution.

Drafts are owner-only and never enter Following activity or anonymous views. Publication requires valid Headline, 1–6 public photos with one Main, 1–6 tagged owned Closet garments and 1–2 Occasions.

## Outfit comments and comment Likes
PR #77 adds `outfit_comment_likes(comment_id,user_id)` as member-private Like state for visible plain-text Outfit comments.

- primary key prevents one member from liking the same comment more than once;
- RLS allows an authenticated member to read their own Like state, Like a visible eligible comment and remove their own Like;
- `outfit_comments.like_count` is the safe visible aggregate;
- a trigger recalculates the aggregate after insert/delete;
- comment Likes do not become Outfit likes or Product likes.

Comments remain plain text only at the product layer; the schema stores text content and does not introduce a rich-text/media-comment subsystem.

## Safe published Outfit identity projections
Anonymous published Outfit access remains deliberately narrow:
- direct anon access to private/member tables is not broadened merely to render a public page;
- `get_public_outfit_creator`, `get_public_outfit_comments` and `get_public_outfit_product_teasers` remain production-safe minimum-field projections;
- unresolved candidate/review state, raw private body data, private Closet linkage and authenticated member state do not leak merely because the Outfit URL is public.

`get_public_outfit_comments(uuid,integer)` resolves current `profiles.username`, `display_name` and `avatar_url` at query time and returns the comment aggregate Like count as declared `bigint`. The later additive migration explicitly casts the stored integer counter to `bigint`, preserving immutable migration history while fixing the projection contract.

## PR #80 newest-first cursor comment projection — BRANCH ONLY UNTIL DEPLOYED
`public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` is the PR #80 replacement read path for scalable opened-Outfit comment browsing.

- the Outfit must be published and comments enabled;
- signed-in blocked-member rules are preserved;
- results are ordered newest-first by `(created_at,id)`;
- the optional `(before_created_at,before_id)` cursor loads strictly earlier rows;
- each request is bounded to 1–50 comments;
- current public commenter `username`, `display_name` and `avatar_url` are resolved live;
- aggregate `like_count` remains safe;
- `liked_by_viewer` and `can_delete` are safe booleans calculated from the authenticated viewer, without exposing raw interaction identities or private profile/body data;
- anon callers receive public comments with viewer-specific booleans false;
- the application API turns the last row into the next cursor rather than preloading a fixed 200-comment array.

This function is not production authority until its migration is applied. The current production projection remains `get_public_outfit_comments` until PR #80 receives production authorization and database-first cutover.

Blocking suppresses signed-in social interaction between blocked members but does not make an otherwise public Outfit URL disappear from anonymous web access.

## Legacy compatibility
`20260824133900_fix_outfit_compatibility_photo_registration.sql` keeps the retired one-photo Outfit creation RPC only as historical/integration compatibility. New creator UI does not use it. It reuses canonical Outfit tables/storage and does not introduce a parallel Outfit system.

# 14. Search / recommendation foundations — LOCKED
Direct Product search is global as above. Unresolved candidates are not ordinary Product results. Barcode lookup is a narrow recognition exception and ambiguity is never auto-selected. Raw private Fit Profile data is never exposed through search.

Recommendation evidence hierarchy remains:
- exact_variant
- exact_product
- product_family
- similar_garments
- brand_garment_type
- category_fit

Help Me Size It is fallback sizing assistance and reuses the same canonical recommendation architecture. `Would Buy Again` does not affect size recommendation/confidence. Pending/unmapped candidate reports do not count as exact canonical Product evidence until mapped.

The viewer's own eligible Fit Report/Closet history is valid recommendation evidence; it must not be discarded merely because the evidence belongs to the current viewer. Tagged-Outfit `Matching Fit Reports` is a personalized useful exact-item count, not `get_product_fit_summary.total_fit_count` or another raw Product total.

Before Product Detail consumes `exact_variant`, recommendation/evidence/Admin behavior must consume `GARMENT_VARIATION_DEFINITION_MAP`. Size and Color must never become exact-variation key fields. Body Match remains body similarity and must not be collapsed with Fit Result into a synthetic fit percentage.

# 15. Current implementation debt / open verification
- Production application is live through PR #79 merge `8835a413680daef0b78ec890ffa50c84424bdc37`; exact tested PR head `ec4bebec4f2743cb8461a724d50e2cb7c1b1529e` passed full CI #869 (`32799021871`).
- The PR #77 migrations remain the latest production database changes and were smoke-verified before their application cutover.
- PR #80 is the active owner-approved stopping-point repair and is **not production-live**. Its `20260825021000_outfit_comment_cursor_pagination.sql` migration is not applied to production and must remain marked branch-only until explicit production authorization.
- Owner live re-audit remains the Roadmap 12 gate; Roadmap 13 must not be treated as unblocked until the owner finishes the New Outfit audit.
- The legacy physical `closet_items.visibility` column remains intentionally in immutable replay history and locked to compatibility `shared`; broader Closet lifecycle/mutation rules remain future audit work.
- Historical counted-report fingerprint reconciliation for retired questions remains separate from tracked-variation/Outfit work.
- Full My Circle Following / Fit Twins / Discover ranking and richer Outfit discovery/search remain later roadmap work.
- Proposed sex/body-specific public measurement FAQ wording remains pending owner copy approval.
- Complete all-Products admin priority/filter/merge/split UX, purchase-context aggregate/admin analytics, Product merge/split, richer alias UX, spam moderation, broader Product-photo review, external barcode-provider feasibility and SerpAPI admin UX remain open where separately scoped.
