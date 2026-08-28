# LikeSized database schema contract

## Canonical database source — LOCKED
Ordered SQL files in `supabase/migrations/` are the executable database history and replay/deployment source.

- Never rewrite or delete an applied migration to hide a superseded experiment.
- Future database changes use new ordered migrations.
- Do not hard-code migration count as architectural truth.
- `supabase/schema.sql` is retired and must not be treated as current schema authority.
- `supabase/storage.sql` is reference/support only where consistent with applied migrations.

This file owns current database behavior/privacy plus explicit implementation debt. Product meaning lives in `docs/V1_PRODUCT_SPEC.md`; roadmap/status/deployment history live in `docs/AI_MASTER_LOG.md`.

# Production database checkpoint — 2026-08-27
Production Supabase project: `rlksidwniuoxoacumyaf`.

Application merge/deployment status is intentionally not duplicated here. `docs/AI_MASTER_LOG.md` is the sole owner of the current application line, CI/deployment status and production deployment history.

The established Roadmap 12 foundation migrations remain immutable production history:
- `20260824133400_add_outfit_comment_moderation_target.sql` → production `20260824164156 add_outfit_comment_moderation_target`;
- `20260824133500_new_outfit_v1_social_foundation.sql` → production `20260824164328 new_outfit_v1_social_foundation`;
- `20260824133600_complete_new_outfit_v1_boundaries.sql` → production `20260824164410 complete_new_outfit_v1_boundaries`;
- `20260824133700_harden_new_outfit_v1_social_controls.sql` → production `20260824164420 harden_new_outfit_v1_social_controls`;
- `20260824133800_canonical_public_closet_and_outfit_public_identity.sql` → production `20260824164452 canonical_public_closet_and_outfit_public_identity`;
- `20260824133900_fix_outfit_compatibility_photo_registration.sql` → production `20260824164507 fix_outfit_compatibility_photo_registration`.

Later immutable Roadmap 12/13 production history includes:
- `20260824231500_outfit_comment_likes.sql` → production **`20260825000654 outfit_comment_likes`**;
- `20260824234500_live_profile_identity.sql` → production **`20260825000708 live_profile_identity`**;
- `20260825000500_fix_live_comment_like_count_projection.sql` → production **`20260825000722 fix_live_comment_like_count_projection`**;
- `20260825021000_outfit_comment_cursor_pagination.sql` → production **`20260825025014 outfit_comment_cursor_pagination`**;
- `20260825122000_outfit_photo_captions.sql` → production **`20260825133233 outfit_photo_captions`**;
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → production **`20260825155645 outfit_public_hotspots_and_comment_sorting`**;
- `20260825183000_private_profile_location_metadata.sql` → production **`20260825192738 private_profile_location_metadata`**;
- production **`20260826001512 username_change_cooldown`**;
- production **`20260826001531 exact_variation_evidence_watches`**;
- `20260826003000_atomic_outfit_cover_switch.sql` → production **`20260826020651 atomic_outfit_cover_switch`**;
- production **`20260826020710 preserve_tracked_variation_recommendation_evidence`**;
- `20260826190000_outfit_tag_consistency.sql` → production **`20260826193527 outfit_tag_consistency`**;
- `20260827214500_batch_outfit_tagged_fit_counts.sql` → production **`20260827214500 batch_outfit_tagged_fit_counts`**.

Earlier catalog, Fit Report, identity, privacy and security migrations remain immutable applied history. Supabase-assigned production timestamps may differ from local canonical filenames; never rename applied local migration history to chase generated timestamps.

Hosted verification across these production batches confirms, among other boundaries:
- `profile-photos` is public storage for current public member identity while write ownership remains controlled;
- `public.profile_locations` is production-applied private owner-scoped metadata, not branch-only;
- `public.outfit_comment_likes` exists and its safe aggregate projection uses the declared `bigint` count;
- `public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` exists as immutable prior cursor-pagination history;
- `public.get_public_outfit_tagged_items(uuid)` and `public.get_public_outfit_hotspots(uuid)` are security-definer minimum-field public projections available to `anon` and `authenticated` callers for published Outfit identification;
- `public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer)` is the current sorted/paginated comment projection, with **Top** and **Newest** behavior described below;
- `public.get_outfit_tagged_fit_counts(uuid,integer)` exists as the bounded authenticated tagged-garment summary projection used by current Outfit cards.

PR #94 and PR #95 introduced no production database migration. PR #96 introduced ordered migration **`20260826190000_outfit_tag_consistency.sql`**, now applied to production as hosted **`20260826193527 outfit_tag_consistency`**.

## PR #96 Outfit tag consistency contract — PRODUCTION
The current Outfit editor treats `outfit_photo_tags` as subordinate to the Outfit's current selected/tagged garment set in `outfit_post_items`.

Production migration `20260826190000_outfit_tag_consistency.sql` updates the canonical Outfit save path so that:
- stale photo-hotspot rows whose `closet_item_id` is no longer present in the same Outfit's selected `outfit_post_items` are removed during the canonical save/synchronization operation;
- current legitimate hotspot rows whose Closet item remains selected are preserved;
- the creator is not forced to manually recover from historical stale state by receiving the internal **“Hotspot garment is not tagged in this Outfit”** consistency error;
- the existing normalized hotspot requirement remains: a persisted hotspot may reference only a Closet item currently tagged on that Outfit;
- this repair does not broaden public/private data access, expose private Closet linkage to anonymous users, create a second hotspot system or change Product/variation identity.

This migration exists because production data investigation found real stale persisted hotspot relationships, not merely a client display problem. It passed complete fresh migration replay and database behavior/privacy tests on the exact PR #96 candidate before production application, and the `main` push verification passed again afterward.

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

## Private city/state profile metadata — OWNER LOCKED / PRODUCTION
`profile_locations` is the dedicated private owner-scoped location store introduced by applied migration `20260825183000_private_profile_location_metadata.sql` / hosted `20260825192738 private_profile_location_metadata`.

- The table allows a compatibility null-pair state but enforces that City and State are otherwise stored together; the **current application setup/settings flow requires both City and State**.
- The table is keyed one-to-one by `user_id` and cascades with the owning profile.
- RLS permits an authenticated member to read/insert/update only their own row.
- `anon` receives no table access and ordinary authenticated members receive no cross-member read path.
- City/state is not projected through public profile/Outfit/member identity helpers and is not a body measurement, Match input, Fit Twin input or Product identity field.
- Initial Fit Profile setup requires City + State once. Later edits belong to Profile Settings; My Measurements updates do not re-request location.
- The `(state_region, city)` normalized index exists to support future controlled server/admin aggregate analysis such as regional wishlist demand without making member-level location public.
- Any future regional statistic must expose aggregate output only through a separately reviewed privacy-safe boundary; this table itself is not a public analytics API.

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

`public.get_scan_match_image_source(product_id,candidate_id)` is the narrow scanner-identification boundary. Image priority is **Product/catalog photo → shared Front Fit Photo → other shared Fit Photo → application placeholder**. A Fit Photo fallback never becomes canonical Product imagery or Product truth.

# 7. Fit Photo, Product Photo and Label evidence — LOCKED
- `fit_reference_photos.photo_role` is controlled to Front/Back; each is separate wear evidence and neither creates another counted Fit Report by itself.
- Product Photo is separate catalog-display evidence subject to normal evidence/moderation rules.
- Product Label / Tag Photo is private identity-review evidence and must never be promoted to generic Product imagery.
- Known-label insertion binds the authenticated owner, exact Product and exact Fit Report to the canonical storage path.
- Shared catalog-submission storage never grants bucket-wide authenticated access to another member's private Label/Tag evidence.
- Current new-Fit-Report application/server validation requires at least one of **Product Photo, Front Fit Photo or Back Fit Photo**. This requirement was intentionally not imposed as a blanket database constraint on historical reports that may predate the rule.
- Fit Report/Closet presentation priority is **Front Fit Photo → Product Photo → Back Fit Photo**. This is separate from scanner Product-identification priority and does not change evidence roles.

## Automatic canonical Product image scoring — ROADMAP 13A / PR #126 BRANCH ONLY
Roadmap 13A is implemented on draft Product Change PR #126 but is **not production schema** until the exact candidate is verified, owner-authorized, merged and its migrations are applied/verified. The branch uses ordered migrations rather than ad-hoc hosted schema changes:
- `20260828001000_canonical_product_image_scoring.sql` — quality fields, tracked-variation key, persisted winners/config, automatic recompute, safe batch resolver and audited admin controls;
- `20260828001100_canonical_product_image_privacy_boundary.sql` — admin-only direct canonical-selection metadata and generic member-visible ineligibility reason boundary;
- `20260828001200_fit_photo_perceptual_duplicates.sql` — private 64-bit dHash fingerprints and product-scoped perceptual duplicate grouping;
- `20260828001300_canonical_product_image_legacy_score_transition.sql` — synthetic legacy-neutral bootstrap transition so first measured evidence is not blocked by an artificial migration score.

The branch database contract is:
- `fit_reference_photos` carries normalized technical component scores, dimensions, `duplicate_of`, canonical eligibility and generated `photo_quality_score`; the Product-image selector never rewrites the original Fit Photo/storage object attached to the member's report;
- score weighting is deterministic at **garment visibility 35 / sharpness 20 / resolution 15 / framing 20 / exposure 10**;
- current Fit Photo technical analysis is computed from the submitted file on the server action path; the database stores the resulting auditable numeric components while moderation/admin eligibility remains authoritative when the garment is missing or the image is unsuitable;
- `private.fit_photo_perceptual_fingerprints` stores the dHash itself; ordinary members never receive that fingerprint through table access or the canonical resolver;
- perceptual duplicate matching starts at Hamming distance **≤5** and is configurable in `canonical_product_image_config`; among near duplicates the stronger deterministic candidate remains the representative and weaker copies receive `duplicate_of`, preventing duplicate photos from competing independently;
- `fit_reports.tracked_variation_key` is a separate current tracked-variation identity derived from current controlled variation-defining garment answers. It deliberately does not reuse counted-report `objective_variant_key`, and Size/Color never enter it;
- `canonical_product_images` is the persisted winning pointer for Product-level and exact tracked-variation image selection. Reads do not re-rank all candidates on every request;
- automatic Fit Photo-to-Fit Photo replacement uses the configurable five-point margin **between measured candidates**. A pre-13A `legacy_neutral` incumbent is only a synthetic bootstrap winner and yields to the first eligible measured winner without requiring that measured photo to clear an artificial five-point gap; once a measured incumbent exists, the normal +5 anti-churn rule resumes. Admin locks always win until explicitly unlocked;
- automatic eligibility excludes deleted/duplicate/ineligible photos, currently open moderation reports and newly scored extremely low-resolution photos; dismissed reports may return to eligibility through the same recompute path;
- `public.get_canonical_product_images(uuid[],text[])` is the single bounded authenticated resolver, capped at 200 requested Products. It returns only the chosen source/path metadata needed by the application; private Fit Photo URLs are signed in one batched storage operation rather than one request per Product;
- ordinary members do not directly read `canonical_product_images`, lock reasons or private fingerprints. Admin direct selection/audit reads remain behind `private.is_admin()`;
- admin RPCs provide intentional **Set as Product Image**, **Lock Product Image**, unlock and Fit Photo eligibility decisions with required audit reasons;
- exact tracked-variation Fit Photo winners override the Product-level winner. When no exact row exists the resolver falls back to the broader Product winner. The current catalog has no separate authoritative exact-variation official-image field, so the system does not invent one; Product-level Product Photo/official imagery remains the current non-wear fallback.

This section describes the **draft PR #126 branch contract only**. It must be relabeled production only after the release path and hosted migration verification actually complete.

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

# 13. LikeLocker / Wish Locker / Outfit foundations — ROADMAP 12 PRODUCTION THROUGH PR #96
Product likes, Outfit likes, comment likes and Wish Locker purchase intent are distinct states. Outfits reuse canonical Closet/Product/taxonomy foundations; no second garment or shopping system exists.

Core Outfit schema:
- `outfit_posts` draft/published lifecycle with Headline, Story, comment toggle, publish timestamp and counters;
- `outfit_photos` canonical 1–6 gallery rows with Main/order, display/feed paths and optional caption constrained to 200 characters;
- owner-private `outfit-draft-photos` before publish and public `outfit-photos` for published editorial imagery;
- `outfit_post_items` is the Outfit's selected/tagged Closet-item set;
- `outfit_photo_tags` normalized hotspot coordinates limited to Closet items currently present in that same Outfit's `outfit_post_items` set;
- `outfit_occasions` controlled 1–2 published Occasion values;
- `outfit_style_tags` normalized community Style vocabulary, maximum three;
- flat plain-text `outfit_comments` with authenticated write/delete boundaries and safe public projection;
- `member_blocks`, integrated with the one canonical Following graph;
- public view/share counters plus follow-attribution counter;
- private `outfit_shop_clicks` commerce attribution.

Drafts are owner-only and never enter Following activity or anonymous views. Publication requires valid Headline, 1–6 public photos with one Main, 1–6 tagged owned Closet garments and 1–2 Occasions.

The production canonical save/sync path heals stale `outfit_photo_tags` rows that no longer have a corresponding current `outfit_post_items` row before final consistency validation. This preserves the existing invariant rather than weakening it.

## Outfit comments and comment Likes
`outfit_comment_likes(comment_id,user_id)` is member-private Like state for visible plain-text Outfit comments.

- primary key prevents one member from liking the same comment more than once;
- RLS allows an authenticated member to read their own Like state, Like a visible eligible comment and remove their own Like;
- `outfit_comments.like_count` is the safe visible aggregate;
- a trigger recalculates the aggregate after insert/delete;
- comment Likes do not become Outfit likes or Product likes.

Comments remain plain text only at the product layer; the schema stores text content and does not introduce a rich-text/media-comment subsystem.

### Current sorted comment projection
`public.get_outfit_comments_sorted_page(uuid,text,bigint,timestamptz,uuid,integer)` is the current production read path for opened-Outfit comments.

- `p_sort` accepts `top` or `newest`;
- **Top** order is `like_count DESC`, then `created_at DESC`, then `id DESC`;
- **Newest** order is `created_at DESC`, then `id DESC`;
- cursor comparisons preserve the selected sort semantics;
- each request is bounded;
- current commenter identity is resolved live;
- `liked_by_viewer` and `can_delete` are safe viewer booleans rather than exposed interaction identities;
- published/comment-enabled/blocking boundaries remain enforced;
- anon callers receive only safe public comment data and no private body/profile state.

The older `public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` migration remains immutable production history but is no longer the current application comment-sort contract.

## Safe published Outfit identity / hotspot projections
Anonymous published Outfit access remains deliberately narrow:
- direct anon access to private/member tables is not broadened merely to render a public page;
- current safe public helper projections include `get_public_outfit_creator`, public comment projections, `get_public_outfit_tagged_items` and `get_public_outfit_hotspots`;
- `get_public_outfit_tagged_items(uuid)` exposes only safe resolved Product identification for published Outfits and excludes rejected/unresolved identities;
- `get_public_outfit_hotspots(uuid)` exposes only safe normalized published-photo hotspot coordinates tied to eligible tagged items;
- raw/private body data, private Closet linkage, unresolved candidate/review state and authenticated member state do not leak merely because the Outfit URL is public.

Public hotspot visibility is intentionally independent of authentication. Personalized tagged-item intelligence—Relevant Fit Reports, Body Match, FITuition, private Closet evidence—remains application/auth/Fit-Profile gated.

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

The viewer's own eligible Fit Report/Closet history is valid recommendation evidence; it must not be discarded merely because the evidence belongs to the current viewer. Tagged-Outfit `Relevant Fit Reports` is a personalized useful exact-item/exact-tracked-variation count, not `get_product_fit_summary.total_fit_count` or another raw Product total.

Repeated reports from the same **person + Product + tracked fit variation** represent one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color never create tracked variation identity.

Before Product Detail consumes `exact_variant`, recommendation/evidence/Admin behavior must consume `GARMENT_VARIATION_DEFINITION_MAP`. Size and Color must never become exact-variation key fields. Body Match remains body similarity and must not be collapsed with Fit Result into a synthetic fit percentage.

## Bounded Outfit tagged-fit count projection — PRODUCTION
Migration `20260827214500_batch_outfit_tagged_fit_counts.sql` adds `public.get_outfit_tagged_fit_counts(uuid,integer)` as the one lightweight personalized batch boundary for the counts displayed on an Outfit's tagged-garment cards. It is applied in production under the same canonical version/name.

- The function is `security invoker`, executable only by `authenticated`, and returns only tagged `closet_item_id` plus the derived personalized `matching_fit_reports` count; it exposes no raw body measurements or private report bodies.
- One application request resolves the complete bounded tagged set for an Outfit. The projection reuses the canonical `get_product_evidence_candidates` matcher with the same per-target evidence cap used by detailed FITuition rather than launching a separate HTTP/full-FITuition request for every visible garment.
- Count semantics remain exact Product + exact objective tracked variation. Qualifying other-wearer evidence must clear the supplied strong-match threshold; the viewer's eligible own latest exact evidence is included consistently with the existing bounded recent-Closet evidence window.
- The application passes the threshold from the canonical `STRONG_FIT_REPORT_MATCH_THRESHOLD` constant instead of hard-coding a second matching rule in the route.
- This batch projection is only the compact-card summary. Full recommendation, Body Match, strong-report breakdown and Closet-history FITuition remain lazy and are loaded through the existing detailed selected-garment boundary only after the member opens that garment.

The production schema/function is verified present. Owner live QA confirmed tagged-garment results work again after the migration was applied; user-perceived card latency remains a separate unresolved application-performance issue and is not represented here as a database correctness failure.

# 15. Current implementation debt / open verification
- Application deployment/current-line facts and historical CI exceptions live only in `docs/AI_MASTER_LOG.md`; this database contract intentionally does not duplicate them.
- `profile_locations` is production-applied at hosted migration **`20260825192738 private_profile_location_metadata`**; current application setup/settings require both City and State while the table retains pair-null compatibility for historical/compatibility rows.
- Production also includes `20260826001512 username_change_cooldown`, `20260826001531 exact_variation_evidence_watches`, `20260826020651 atomic_outfit_cover_switch`, `20260826020710 preserve_tracked_variation_recommendation_evidence`, **`20260826193527 outfit_tag_consistency`**, and **`20260827214500 batch_outfit_tagged_fit_counts`**.
- The local canonical Outfit tag-consistency migration is **`20260826190000_outfit_tag_consistency.sql`**; Supabase assigned hosted version `20260826193527`. Do not rename the local immutable file to chase the hosted timestamp.
- Roadmap 13A canonical Product-image scoring is active only on draft PR #126 until exact-final verification/release. Its four new ordered migrations are not production truth yet.
- The current catalog does not yet carry a separate authoritative exact-tracked-variation official/imported image source. Roadmap 13A therefore resolves an exact Fit Photo when available and otherwise falls back to the Product-level canonical image; it does not invent parallel variation imagery.
- The legacy physical `closet_items.visibility` column remains intentionally in immutable replay history and locked to compatibility `shared`; broader Closet lifecycle/mutation rules remain future audit work.
- Historical counted-report fingerprint reconciliation for retired questions remains separate from tracked-variation image selection.
- Proposed sex/body-specific public measurement FAQ wording remains pending owner copy approval.
- Complete all-Products admin priority/filter/merge/split UX, purchase-context aggregate/admin analytics, Product merge/split, richer alias UX, spam moderation, broader Product-photo review, external barcode-provider feasibility and SerpAPI admin UX remain open where separately scoped.

## Versioned Match / FITuition scale architecture — PR #130 BRANCH ONLY
PR #130 adds a private demand-driven scale layer on top of the existing canonical Match and recommendation math. It is **not production schema** until the exact final candidate is verified, separately owner-authorized for production, merged and its migrations are applied/verified.

Branch migrations are:
- `20260828100000_scalable_fit_evidence_reads.sql` — set-wise/bounded Match and Product-evidence read foundations retained as the exact fallback/scoring layer;
- `20260828120000_versioned_match_and_fituition_cache.sql` — private Match-input versioning, bounded current-person candidate fingerprints/discovery, current-person Match caches, direct-pair resolver, FITuition evidence scope versioning and private personalized evidence cache;
- `20260828121000_route_match_reads_to_versioned_cache.sql` — routes existing current-person Match compatibility reads through the versioned cached/bounded canonical resolver;
- `20260828122000_route_full_fituition_reads_to_cache.sql` — routes full personalized garment evidence through the demand-driven FITuition cache while preserving the existing recommendation owner;
- `20260828123000_historical_snapshot_candidate_scaling.sql` — adds private immutable Fit Profile snapshot candidate buckets, bounded historical Product discovery and immediate Fit Community neighborhood invalidation;
- `20260828124000_preserve_latest_historical_evidence_units.sql` — after historical snapshot shortlisting, evaluates each shortlisted wearer's complete relevant report history and keeps the latest person + Product + tracked-variation evidence unit before exact historical scoring;
- `20260828125000_qualify_person_match_cache_conflict.sql` — preserves direct-person Match behavior while qualifying the cache upsert by its primary-key constraint so the PL/pgSQL `match_category` output variable cannot collide with the conflict target.

The branch database contract is:
- `fit_profiles.match_input_version` is the monotonic private revision for current Match-relevant input state. Current Match cache validity is keyed to viewer/target input revisions plus the private Match algorithm version rather than global recomputation. A Fit Community change advances that same revision so target eligibility changes invalidate cached neighborhoods immediately instead of waiting only for TTL expiry.
- `private.fit_match_candidate_fingerprints` stores only derived/indexable current-body candidate buckets used for bounded current-person discovery; raw measurements remain in their existing private stores and are not exposed through this cache layer.
- `private.fit_profile_version_candidate_buckets` stores private derived buckets from immutable historical Fit Profile snapshots. Historical Product/FITuition discovery shortlists snapshot-era wear evidence through these buckets rather than using another wearer's current body state as a proxy for how they were built when the Fit Report was logged.
- `private.current_person_match_cache` is pair/category-scoped. `public.get_person_fit_match_cached(uuid)` reuses a valid exact result or recalculates only the requested pair when its version tuple is stale. Its cache upsert is conflict-targeted by the table primary key, avoiding PL/pgSQL output-variable ambiguity without changing Match semantics.
- `private.fit_match_neighborhood_cache` is viewer/category/community-scoped bounded discovery state. `public.get_fit_matches_cached_batch(...)` builds from bounded candidate neighborhoods and then applies the exact canonical Match calculation; the candidate layer is not itself the displayed score.
- Historical snapshot discovery is only a bounded shortlist. Once wearers are shortlisted, `private.resolve_product_evidence_core(...)` considers each shortlisted wearer's complete relevant report history, dedupes to the newest person + Product + tracked-variation evidence unit, and then applies exact immutable-snapshot Match scoring. An older body-similar report therefore cannot outrank that wearer's newer observation of the same Product/tracked variation merely because the newer snapshot fell outside the initial shortlist.
- Full FITuition uses `private.fit_evidence_scope_versions`, a private evidence token and `private.fituition_evidence_cache` keyed to viewer/product/variant plus viewer Match-input version, FITuition algorithm version and relevant evidence state. Broad fallback also has a bounded TTL rather than a permanent stale result.
- Fit Report, Product-attribute and Closet-visibility evidence changes bump narrow evidence scopes so personalized results become stale without synchronously recalculating every affected person × garment answer.
- The private evidence core preserves `garment_condition='normal'`, the authenticated/shared Closet evidence boundary, `objective_variant_key` tracked-evidence deduplication, exact historical snapshot scoring and the established evidence hierarchy.
- Public compatibility functions expose only the same safe derived Match/recommendation outputs; the new private tables/functions do not grant ordinary members or anonymous callers raw Match inputs, fingerprints, cache internals or another member's private body state.
- The architecture deliberately does not materialize all person × person or person × garment combinations. Derived records are demand-driven, bounded and version-invalidated.

## PR #130 production reconciliation — 2026-08-28
The branch-only heading immediately above is retained as historical branch wording, but its release condition has now been satisfied. PR #130 was exact-final verified, separately production-authorized, squash-merged to `main` as **`ec7838fa8257ff704287b756c3484863c79d8f66`**, and its seven ordered migrations were applied and verified on production Supabase. Hosted Supabase assigned versions `20260828194418`, `20260828194621`, `20260828194634`, `20260828194653`, `20260828194811`, `20260828194835`, and `20260828194851` to the seven local canonical migration names above. The Match/FITuition scale architecture described above is therefore current production database truth.

## Advisor security / RLS hardening — PR #132 BRANCH ONLY
Draft Product Change PR #132 adds ordered migration **`20260828203000_advisor_security_and_rls_hardening.sql`**. It is not production schema until its exact final candidate is verified, separately production-authorized, merged, and the hosted migration is applied/verified.

Current branch database contract:
- Product meaning does not change: the existing Product Spec already defines Outfit drafts as unpublished owner-only work. The migration closes a stale RLS path that conflicted with that rule.
- The legacy `members read shared outfit item links` policy is removed. Because current V1 locks every Closet item to compatibility `visibility='shared'`, that policy could otherwise let another authenticated member read a draft Outfit's `outfit_post_items` relationship solely because the linked garment was shared. The surviving canonical policy requires Outfit ownership or a published, unblocked Outfit.
- Advisor-warned duplicate permissive policies for Outfit/Fit Photo reads/deletes are consolidated into equivalent single OR policies so intended owner, published, blocking, commenter, Outfit-owner and admin behavior is preserved without evaluating redundant policies.
- Anonymous `SECURITY DEFINER` access remains deliberately limited to the narrow published-Outfit projection/counter surface. Raw Profile, Closet, Fit Report and private body stores do not become anonymous-readable merely to silence an advisor warning.
- Public `admin_*` `SECURITY DEFINER` functions remain behind the existing `private.is_admin(...)` authorization boundary; the additive safeguard asserts anonymous admin execution stays blocked and the guard remains present.
- Covering indexes are added for the foreign-key relationships currently reported by the Supabase advisor. Newly deployed or otherwise legitimate indexes are not removed merely because production telemetry has not used them yet; an `unused_index` observation is not by itself proof an index is unnecessary.
- Supabase leaked-password protection is an Auth service configuration rather than database SQL. It remains a separate operational follow-up and is not falsely represented as changed by this migration.
- `supabase/tests/advisor_security_and_rls_hardening.test.sql` proves the draft Outfit item-link boundary, the intended anonymous definer allowlist, admin guard expectations, representative FK indexes and raw-table anonymity boundaries.
