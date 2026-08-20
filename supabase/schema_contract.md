# LikeSized database schema contract

## Canonical source-of-truth rule — LOCKED
GitHub `likesized/Likesized` is the single canonical source of truth for database architecture and executable history. Ordered SQL in `supabase/migrations/` is the authoritative replay/deployment history. `supabase/schema.sql` and `supabase/storage.sql` are reference/current-state aids only.

The Fit Match audit branch contains **37 migrations** from `20260819132934_initial_likesized_schema.sql` through `20260820221000_derived_body_proportion_refinement.sql`. The newest garment/matching migrations are `20260820203500_garment_enrichment_provenance.sql`, `20260820211800_directional_fit_recommendation.sql`, `20260820215500_garment_fit_preferences.sql`, and `20260820221000_derived_body_proportion_refinement.sql`. These branch migrations are not production-applied until owner-authorized merge/deployment.

Do not rewrite applied production migrations. While an unmerged feature branch is still being audited, keep its new migration history canonical rather than preserving abandoned parallel concepts. Future production database changes are new ordered executable migrations. No alternate current-state schema files, patch migrations, fixed/v2 copies, or parallel database implementations.

## Locked current-state contract
- `profiles`: completed member identity readable to authenticated LikeSized members only; anonymous SELECT revoked.
- `fit_profiles`, `body_measurements`, `user_size_references`, `user_garment_fit_preferences`: current Fit Profile settings plus owner-private raw body/size-reference/preference state.
- Immutable Fit Profile version tables preserve historical body state privately. Current preferred-fit settings are intentionally **not** part of immutable body snapshots.
- `fit_reports.fit_profile_version_id`: immutable try-on body-state association; multiple observations may exist per Closet item.
- **Fit Result is the required physical sizing signal for every new Fit Report.** Allowed outcomes are Too Small, Snug, Just Right, Relaxed, and Too Big.
- The existing PostgreSQL enum is historically named `public.fit_rating`, but it is the **physical Fit Result enum**, not a 1–5 satisfaction/star rating. Do not infer a separate star-rating feature from the internal enum name.
- There is **no separate 1–5 Fit Rating field in the final branch schema**. The discarded satisfaction-rating experiment is not part of the canonical migration history.
- Bad fits are first-class evidence. Too Small and Too Big reports remain valid and useful instead of being filtered out or treated as low-quality submissions.
- Optional product feedback such as `would_buy_again` does **not** alter the size recommendation. Preferred Fit is a separate explicit viewer-personalization layer described below.
- `fit_report_dimensions`: controlled garment-specific responses with DB garment/dimension validation.
- Every canonical `measurement_types` row has a positive default tolerance. Fit Profile body fields are canonical measurements rather than free-text comparison inputs.
- Fit Match similarity uses a smooth tolerance curve: exact measurements = 1.0 similarity, half the configured tolerance = 0.5, and one full tolerance = 0.0625. There is no hard similarity cliff at the tolerance boundary.
- Similarity importance (`weight`) and evidence/completeness importance (`coverage_weight`) are separate. Core measurements establish useful confidence; optional advanced measurements refine a match instead of becoming blanket requirements.
- A user-facing Match percentage is raw garment-relevant anthropometric similarity discounted by evidence coverage, measurement provenance reliability and shared-dimension depth. Confidence can only lower raw similarity; it can never inflate it. Sparse agreement cannot produce a false 100% Fit Twin.
- Match qualification is profile-specific. Overall requires at least 3 shared relevant measurements and 35% weighted coverage; general Tops/Bottoms/Work Shirt require 2 and 35%; Dresses/One Piece require 3 and 40%; Bra requires 2 and 65%; Shoes allows one shared measure only because foot length carries at least 70% of shoe evidence.
- Generic Overall and Tops confidence does **not** require Full Bust. Full Bust may refine raw similarity when both members provide it, but its absence does not lower generic Overall/Tops coverage.
- Product-specific matching uses the Product `market_segment` rather than inferring a user's sex/gender. For normal men's/kids garments, bust-specific measurements are removed from the target Product model. Unisex garments do not require Full Bust for confidence and remove bust-point-specific shaping dimensions unless the garment itself is intimate apparel.
- Current-person matching RPCs return safe current scores/coverage only. Exact raw measurements remain owner-private.
- `garment_type_match_adjustments` is the canonical garment-type refinement layer. It can remove irrelevant measurements and add advanced measurements only where they matter: e.g. sleeveless tops remove sleeve length, shorts/skirts remove inseam dependence, jeans can use knee/calf/crotch details, tailored jackets add shoulder/arm geometry, and one-piece garments add torso/crotch/leg detail.
- `garment_attribute_match_adjustments` is the canonical product-attribute refinement layer. Controlled rise, sleeve length, collar, neckline, stretch level, knit/woven construction, fit/cut, leg shape and length-profile attributes can modify measurement importance/tolerance and can introduce a newly relevant advanced dimension. Long sleeves can add wrist/elbow/bicep evidence; collars can add neck/collar evidence. These are conservative cold-start priors, not a second matching formula.
- Every body measurement currently visible in the V1 Fit Profile participates in at least one legitimate match path. `overbust` remains intentionally hidden and is not used by V1 matching.
- Historical product/Fit Report matching uses immutable body snapshots and the **target product's** garment type + controlled product attributes, so market segment, stretch, rise, cut, sleeve/collar construction and other controlled attributes can affect which historical wearers are most relevant.
- Measurement provenance contributes conservatively to confidence: normal tape/scale/device measurements keep full reliability; imported/stated/unknown methods are discounted rather than discarded.

## Derived body-proportion refinement contract — LOCKED
- LikeSized derives body proportions **only from measurements the member already supplied**. There are no user-entered ratio/proportion fields.
- Derived values are calculated at match time and are **not stored as separate member body data**.
- `private.garment_proportion_rules` is the one canonical configuration for these refinements and remains inaccessible to authenticated clients.
- Proportions are **garment-specific refinements**, not a second matching system. Generic Overall/Tops/Bottoms broad-profile matching remains unchanged.
- Current garment-specific person matching and historical Product/body-snapshot matching may use proportion refinement after the existing confidence-aware base Match has already qualified.
- Missing numerator or denominator measurements leave the base Match unchanged and never reduce coverage, shared-measurement count, or qualification.
- Proportion similarity is symmetric. It refines body Match %, unlike the separate signed/directional layer used later for size recommendation evidence.
- Component measurement provenance reliability is propagated into the derived-proportion influence.
- Current conservative relationships include chest-to-waist, bust-to-waist, shoulder-to-chest/bust, waist-to-hip, thigh-to-hip, torso-to-height, inseam-to-height, rise-to-height, and selected one-piece vertical proportions only where the target garment makes them relevant.
- Total available proportion influence is capped at **8%** and the final qualified Match may move by at most **±4 percentage points** from the base confidence-aware Match.
- `private.fit_proportion_similarity(...)`, `private.apply_proportion_refinement(...)`, `private.refine_current_garment_match_with_proportions(...)`, and `private.refine_snapshot_product_match_with_proportions(...)` are non-public helpers. No ratio, proportion score, or derived value is returned to clients.
- Bra- and shoe-specific advanced geometry remain separate audit topics and are intentionally not introduced through this generic derived-proportion layer.

## Directional Fit Result recommendation contract — LOCKED
- **Body Match % remains symmetric body similarity.** A wearer does not become a worse body Match because a garment fit them badly.
- Size recommendation is directional. The engine privately retains the sign of viewer-vs-historical-wearer differences across the target garment's relevant measurements.
- Positive directional pressure means the viewer is larger/longer than the historical wearer in the aggregate relevant dimensions; negative means smaller/shorter. Body weight is excluded from this directional dimension signal.
- The signed pressure is reliability-weighted, tolerance-normalized and bounded. It is never returned to the client.
- `private.calculate_directional_fit_support_for_product(...)` converts those private signed differences plus the historical Fit Result into a safe support/opposition scalar for that size.
- Examples of the locked interpretation: a smaller wearer reporting Too Small is stronger negative evidence for a larger viewer; a larger wearer reporting Too Big is stronger negative evidence for a smaller viewer; Snug/Relaxed evidence is interpreted in the corresponding direction.
- `public.get_product_evidence_candidates(...)` returns only the safe `directional_fit_support` scalar alongside historical evidence. It never returns raw measurements, signed deltas, or directional pressure.
- The evidence RPC uses a narrow SECURITY DEFINER boundary only because the directional helper is intentionally non-public. It explicitly requires authentication and explicitly restricts candidate evidence to **Shared** Closet items.
- Direct authenticated access to the private directional helper remains revoked.
- Recommendation calibration uses Match closeness, evidence specificity, controlled Similar Garments overlap, coverage quality, Fit Result support/conflict and sample strength. **Would Buy Again and satisfaction fields do not break size ties or change recommendation confidence.** Preferred Fit is the deliberate personalization exception below and operates only on the viewer's interpretation of physically acceptable Fit Results.

## Preferred Fit personalization contract — LOCKED
- `public.garment_fit_preference` is controlled to **Fitted / Standard / Relaxed**.
- `public.user_garment_fit_preferences` is owner-private and keyed by `(user_id, garment_type_key)`, so a member can prefer a fitted T-shirt, relaxed hoodie, standard jeans, etc. without one global preference distorting every garment.
- **Missing preference row means Standard.** Standard is stored sparsely and is the neutral default.
- Preferred Fit is saved through the canonical `public.save_fit_profile(...)` transaction together with current measurements and private size references.
- Preferred Fit is a **current personalization setting**, not historical body state. Preference-only edits do not create a new immutable Fit Profile body version and do not rewrite historical Fit Reports.
- Preferred Fit does **not** change Overall/Tops/Bottoms/Product Match %, does not change who counts as a body Match, and is not used to match people who share the same style preference.
- It is applied only after body similarity, historical Fit Result, evidence hierarchy, and private directional body differences have been established.
- Fitted makes **Snug** more desirable than it is under Standard; Relaxed makes **Relaxed** more desirable; Standard keeps **Just Right** as the strongest neutral target.
- **Too Small and Too Big remain negative evidence for every preference.** They are physical failures, not valid preferred-fit choices.
- Directional support remains layered on top of preference interpretation, so a Snug result can still become stronger/weaker evidence based on whether the viewer is larger or smaller in garment-relevant dimensions.
- Product recommendation UI may disclose the applied preference label (for example, `Fitted`) but never raw body differences or another member's private preferences.

## Garment identity and enrichment provenance contract — LOCKED
- A new Closet log resolves existing canonical Product identity before creating a Product.
- Resolution order is: explicit canonical Product ID → known numeric UPC/barcode → known normalized retailer/product URL → Brand + manufacturer Style ID → app fallback to normalized Brand + Product identity/new provisional Product.
- SKU is retained where useful but is not treated as globally unique Product identity.
- Product classification and garment facts carry provenance/trust states: `provisional`, `corroborated`, `verified`, or `rejected`.
- Evidence sources are controlled: `system`, `manufacturer`, `retailer`, `barcode_catalog`, `member`, and `admin`.
- `product_metadata_evidence`, `product_attribute_evidence`, and `product_material_evidence` are the canonical evidence ledgers.
- One member submission is provisional and cannot masquerade as manufacturer/admin/verified truth. Repeat submissions by the same member/product field do not count as multiple votes.
- Two independent agreeing members can corroborate Product garment type/market segment and controlled attributes/materials when no stronger conflict blocks promotion. Conflicts flag the Product for review rather than silently rewriting verified facts.
- Provisional Product attributes may softly refine the target match model only in proportion to evidence confidence. A one-member provisional guess cannot fully remove/change dimensions as if verified.
- Similar Garments attribute overlap requires corroborated/verified canonical attribute values with sufficient confidence; one provisional coincidence cannot upgrade evidence to Similar Garments.
- Fiber/material composition is separate from construction and stretch. Material evidence never substitutes for knit/woven construction or actual stretch evidence.
- Member garment evidence is recorded atomically through `public.record_member_product_evidence(...)`; a failed Closet logging transaction is not allowed to leave stray member evidence behind.
- Exact-product community summary is physical Fit Result distribution only and uses the latest Shared observation per unique wearer so repeated history from one wearer cannot inflate counts.

## Actual garment-measurement scope — LOCKED FOR V1
- LikeSized V1 does **not** require actual physical garment measurements or manufacturer garment-spec dimensions.
- Manufacturer/retailer garment dimensions may be considered later as optional enrichment, but the current Match/recommendation architecture must work without them.
- Generic manufacturer body-size charts must never be treated as if they were actual garment dimensions/ease measurements.
- Do not make V1 accuracy or product coverage dependent on acquiring manufacturer specs across the clothing catalog.

## Product evidence hierarchy and privacy
- Product evidence is unique-wearer capped and ranked Exact Variant 1 → Exact Product 2 → Product Family 3 → Similar Garments 4 → Brand + Garment Type 5 → Category Fit 6.
- Product Fit Families are intentional same-fit/cut groups with compatibility enforcement; Similar Garments uses controlled corroborated/verified construction attributes.
- Private Closet items remain owner-only; Shared items/reports are member-readable under their canonical boundaries. Fit/reference photos may exist only while the Closet item is Shared.
- `follows`: canonical Fit Twin relationship. Signed-in LikeSized members may read the community follow graph; only `auth.uid() = follower_id` may insert/delete. Anonymous users have no SELECT grant.
- `private.following_activity_events`: private canonical Following Feed ledger with only `closet_shared`, `fit_report_added`, and `outfit_posted`. Authenticated clients have no direct table access; likes never create activity.
- Shared→Private removes garment activity; re-share creates fresh share activity from the latest Fit Report; source deletion cascades activity.
- `public.get_following_feed(integer,timestamptz)` is a SECURITY INVOKER wrapper over a private auth-bound helper that re-checks current canonical follows and source visibility/existence and never returns raw body data.
- Fit Twin notification preferences, per-follow mutes, and recipient notification rows live in private tables. Missing global preference means ON by default. Notification fanout uses canonical Following Feed activity and only current eligible followers.
- Global notification off, per-Twin mute and unfollow suppress future notifications only; they do not modify the Following Feed or erase still-valid prior notifications. Re-enable/refollow does not backfill missed activity; unfollow clears the relationship-specific mute.
- Notification rows reference canonical activity with cascade, so source privacy/deletion removes corresponding existing notifications. Public notification functions are SECURITY INVOKER wrappers over narrow private auth-bound helpers. V1 sends no Fit Twin activity email or phone push.
- `outfit_posts` are authenticated-member-readable social posts in the current schema, pending the separately locked V1 product-surface decision to remove the user-facing Outfits concept. `outfit_post_items` are readable only while linked Closet evidence is Shared.
- `outfit_likes` has one like per `(post_id,user_id)`; only the liker may insert/delete their own like; post deletion cascades likes.
- `public.create_outfit_post(uuid,text,text,uuid[])` remains the current canonical transaction until the queued V1 Outfit removal is implemented through an ordered migration/source update.
- `public.search_catalog_products(text,integer)` is authenticated-only SECURITY INVOKER catalog discovery. It searches canonical Product names, canonical Brand names, Brand aliases, manufacturer style numbers, `product_identifiers` (including SKU/UPC/barcode), retailer product IDs/SKUs and retailer listing titles; punctuation/case normalization is applied internally and results deduplicate to one canonical Product with its canonical slug/brand display identity.
- `public.search_members(text,integer)` is authenticated-only SECURITY INVOKER member discovery over member-readable username/display name. It excludes `auth.uid()`, is case-insensitive and returns only member identity fields—never raw measurements/private size references/preferences. Searchability does not bypass minimum Fit Match evidence requirements.
- Search RPCs do not expose the intentionally non-public general normalizer helper functions and do not create a duplicate search catalog, member index or follow system.

## Canonical verification contract
CI replays the complete migration directory on a disposable local Supabase database, runs production recommendation calibration, production build, and pgTAP under `supabase/tests/`.

Key suites include:
- `fit_profile_behavior.test.sql`
- `fit_profile_privacy_rls.test.sql`
- `fit_profile_history_integrity.test.sql` — confidence-aware current-vs-historical body-state calibration and immutable report linkage
- `people_my_size_matching.test.sql` — exact/near/sparse/reliability-sensitive matching, garment relevance, current-score recalculation and raw-data privacy
- `fit_match_engine.test.sql` — **23 invariants** covering tolerance completeness, smooth similarity, confidence discounting, contextual Full Bust behavior, garment relevance, advanced-measurement reachability, men's Product behavior and product-attribute dimension introduction
- `fit_report_dimensions.test.sql`
- `closet_integration_privacy.test.sql` — **32 assertions**
- `product_evidence_variant_targeting.test.sql` — **12 assertions**
- `product_family_evidence.test.sql` — **11 assertions**
- `similar_garment_attributes.test.sql` — **10 assertions**
- `product_evidence_full_hierarchy.test.sql` — **18 assertions**
- `garment_enrichment_and_directional_fit.test.sql` — **27 assertions** covering provenance, corroboration, exact Product resolution, required physical Fit Result, no star-rating column, directional bad-fit calibration, and Shared unique-wearer physical-fit aggregation
- `garment_fit_preferences.test.sql` — **14 assertions** covering private per-garment preferences, Standard sparse default, atomic Fit Profile saving, preference-only body-history stability, invalid preference rejection, and owner-only privacy
- `derived_body_proportions.test.sql` — **14 assertions** covering private-only rules, no stored member ratios, per-rule/per-garment influence caps, symmetric proportion similarity, ±4 Match cap, no-rule fallback, current-person refinement, immutable-snapshot refinement, coverage neutrality, and direct-client helper denial
- `fit_twin_follow_foundation.test.sql` — **14 assertions**
- `following_feed_activity.test.sql` — **25 assertions**
- `fit_twin_activity_notifications.test.sql` — **48 assertions**
- `social_outfit_integration.test.sql` — **49 assertions**
- `search_discovery_integration.test.sql` — **35 assertions** covering catalog/member discovery, privacy boundaries, minimum-match evidence behavior, canonical follow creation, and searched-member Shared activity reaching Following Feed + Fit Twin notifications.

`tests/recommendation-confidence.test.ts` now defines **13 calibration cases**, including coverage-without-double-penalty behavior, directional Fit Result evidence, Fitted-vs-Standard recommendation behavior, Relaxed-vs-Standard behavior, and the invariant that Too Small/Too Big remain negative for every preference.

Last full Fit Match audit CI run **`32420828278`** on branch source commit `a305f021e72aaaff19901aa0b51c4e70dfb5e856` passed npm install, TypeScript, all **10 then-current** recommendation calibration cases, production build, fresh replay of all **35 then-current branch migrations**, and the complete canonical pgTAP suite.

Preferred Fit source through commit `2a75bf75e46e72654a4f952191f05c44ca2a3d7b` and Derived Proportions source through commit `7ee1a620980b78d7f8e3899becc4f437e17ee878` both have successful Vercel build status, but a new full GitHub CI migration replay/pgTAP run has **not** started while PR #36 remains non-mergeable/diverged from `main`. Do not describe migrations #36/#37 as fully CI-verified until that branch state is reconciled and the complete run passes. The branch remains non-production until the owner explicitly authorizes merge/deployment.

Do not add fixed measurement columns back to `fit_profiles`; blend current-person scores with historical garment evidence; count repeated observations as multiple wearers; fuzzy-group Product Families; expose raw or signed body differences through product/social/search/notification surfaces; expose derived body ratios or private proportion helpers; store user-entered derived-ratio fields; let derived proportions affect qualification/coverage or move a qualified Match by more than the locked cap; expose another member's preferred-fit settings; use Preferred Fit to change body Match % or select Fit Twins; allow Too Small/Too Big as personal preference values; allow Private Closet evidence into recommendations; allow anonymous member/follow/feed/notification discovery; reintroduce a separate 1–5 Fit Rating into the sizing workflow without a new owner decision; use Would Buy Again as a sizing signal; make V1 depend on manufacturer garment measurements; reintroduce a private fit-photo state; add Fit Twin activity email/phone push without an explicit future decision; reintroduce non-atomic outfit auto-sharing; create a second catalog/member/follow system for search; or create a second Fit Match formula outside the canonical profile → garment-type/product-attribute → bounded derived-proportion Match refinement → directional Fit Result → Preferred Fit recommendation pipeline.
