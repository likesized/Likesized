# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **“How did this garment fit people built like me?”**

The V1 evidence chain is:
**private body measurements + garment-specific body matching + canonical garment/product identity + real-world Fit Reports + shared fit/reference photos → useful fit evidence.**

## Planning source
This file defines the **product/fit architecture only**. It does not own project status or build order. The sole canonical roadmap/status/handoff is `docs/AI_MASTER_LOG.md`.

## Authoritative V1 fit/garment architecture — 2026-08-19

### Measurements and immutable body-state history
- `fit_profiles` is a small profile shell, not a permanent column-per-measurement table.
- Current raw values live in owner-only `body_measurements` using controlled `measurement_types`.
- `fit_profile_versions`, `fit_profile_version_measurements`, and `fit_profile_version_size_references` store immutable owner-private historical body states.
- Saving the current Fit Profile atomically replaces the current measurement/reference set, normalizes it, and creates/reuses the matching immutable version.
- Every Fit Report stores an immutable `fit_profile_version_id`; later body edits never rewrite older garment/body associations.
- A later try-on after a body change is a new Fit Report tied to the new version.
- Manual values are numeric, validated and normalized to canonical units/precision.
- Normally worn bra/shoe/other size references are private `user_size_references`; historical copies live with each Fit Profile version.
- Raw current and historical measurements and size references are never member-visible.

### Garment identity and taxonomy
- `brands` uses normalized names plus aliases for deduplication/autocomplete.
- `products` are canonical products; retailer URLs are not product identity.
- `product_families` are **intentional same-fit/cut groups** only; never fuzzy-name auto-grouping.
- New canonical Products receive a standalone family by default or may explicitly join a compatible same-fit/cut family when brand, garment type and market/cut segment match.
- Existing shared Products are not silently reassigned by later Closet logs.
- `retailer_listings` preserves retailer-specific URLs, IDs and SKUs while pointing to canonical products/variants.
- `product_identifiers` preserves manufacturer style, SKU, UPC/barcode and other canonical identity values.
- `product_variants` handles color/variant identity and normalized size.
- Garment market segment is controlled: men's, women's, unisex, kids/youth, unknown. It describes cut/sizing, never user gender identity.
- `garment_types` is an extensible controlled taxonomy.
- Similar Garments uses controlled construction attributes: fit/cut, rise, stretch, Primary material/fabric family, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- V1 does not attempt exact fiber-percentage composition.
- Category-scoped attributes may be stored only for compatible Product categories.
- Product construction attributes are initialized only when a new canonical Product is actually created; reusing an existing Product does not rewrite its shared attributes.

### Size normalization
- Original manufacturer/retailer `size_label` is always preserved.
- `normalized_sizes` supplies logical structured identity for alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length-designation and fallback sizes.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` resolve to one logical waist/inseam identity when they mean 30/30.
- Dress/work shirts can decompose collar + sleeve range; jackets chest + length; bras band + cup + system.
- Free text is fallback only for unusual manufacturer sizing.

### Two distinct matching contexts — LOCKED
1. **Current person / Fit Twin match:** current `body_measurements` ↔ current `body_measurements` through the current-person matching engine.
2. **Historical garment evidence match:** viewer current body ↔ immutable `fit_profile_version_id` attached to that Fit Report.

Do not blend current-person scores with historical garment scores.

### Fit matching and evidence
- No separate men's/women's engines. Garment type selects controlled match profiles/measurement weights.
- Missing relevant measurements reduce coverage/confidence rather than failing unnecessarily.
- Evidence hierarchy: **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
- Exact Variant requires the variant to belong to the target Product; invalid/foreign variant IDs fall back safely.
- Product Family evidence exists only through explicit compatible family membership.
- Similar Garments requires same garment type plus controlled Product-attribute overlap.
- Product evidence uses historical snapshot match scores, never current Fit Twin scores.
- Recommendation evidence is capped to **one strongest historical observation per unique wearer**.
- All legitimate observations remain available in Shared Fit History; the cap applies to recommendation aggregation only.

### Recommendation confidence — LOCKED V1
- Production `recommendSize()` is the single confidence implementation; tests call it directly.
- Evidence below **50% historical body match** is not recommendation-eligible.
- Confidence reflects unique-wearer/sample strength, historical closeness, relevant coverage, evidence-tier exactness, fit outcome agreement/conflict, Similar Garments overlap, buy-again signal and competing-size support.
- Confidence caps at **99%**.
- Missing coverage, weaker fallback tiers and conflicting evidence reduce confidence rather than being hidden.

### Fit Reports, Shared Closet and photos
- Overall fit remains controlled; optional garment-specific dimensions live in `fit_report_dimensions` using controlled responses.
- Multiple historical Fit Reports may exist for one Closet item.
- `closet_items.visibility` is `private` or `shared`; RLS—not UI filtering—controls access.
- Shared history may expose safe garment/product/size/Fit Report/history-match/photo context, never raw measurements.
- Fit/reference photo upload is optional. **If uploaded, the garment must be Shared and the photo is visible to authenticated LikeSized members. There is no private fit-photo mode.**
- `fit-reference-photos` is a non-public Storage bucket with member-read/owner-write behavior tied to Shared evidence.

## Fit Twins, Following and social behavior — LOCKED V1
A Fit Twin is a Fit Match the user deliberately saves/follows. There is no universal percentage threshold. The follow relationship remains stable while live current-person match scores may change.

### Follow visibility
The Fit Twin/follow graph is **community-public within LikeSized**. Authenticated members may see who follows whom; only the follower may create/remove their own relationship. Anonymous web visitors cannot query member identity/follows.

### Dedicated Following Feed
V1 has a dedicated personalized Following Feed driven by the same canonical `follows` relationship.

Meaningful activity includes:
- newly Shared Closet garment,
- new Shared Fit Report observation/re-try-on,
- new outfit post.

Likes are not feed activity. Private Closet/Fit Report activity and raw body measurements never appear.

Current Overall/Tops/Bottoms match badges shown on feed cards are relationship context only. Linked garment evidence still uses its immutable historical snapshot.

If Shared content becomes Private or is deleted, the feed must stop exposing it immediately.

### Fit Twin activity notifications
- In-app only in V1; **ON by default for future Fit Twin activity**.
- One private global on/off setting plus private per-Fit-Twin mute.
- Mute/global off does not alter the Following Feed.
- Same three meaningful activity types as the Following Feed; likes never notify.
- No Fit Twin activity email or phone push in V1.
- Global off, mute or unfollow suppresses future notifications only; no backfill after re-enable/refollow.
- Unfollow clears the relationship-specific mute; refollow starts unmuted subject to the global switch.
- Private/deleted source content removes corresponding existing notifications.
- Notification state and output never expose raw body measurements.

### Outfit social behavior
- Outfit posts are authenticated-member-readable social content.
- Likes are one per member/post and only the liker may remove their own like.
- All Outfits is member-wide; Fit Twins Outfits filters canonical outfit posts through `follows`.
- Posting requires one photo and **1–6 unique owned Closet garments with Fit Report evidence**.
- Selecting a Private garment intentionally publishes its fit evidence by changing it to Shared, but share + post + tag creation must be one atomic database transaction.
- Photo uploads occur before the transaction; if the transaction fails, the app removes the uploaded photo.
- Outfit tags show the **latest currently visible Fit Report** for the tagged garment.
- If a tagged garment later becomes Private, its garment tag/Fit Report evidence disappears for other members, while the independent outfit post and likes may remain.
- Deleting an outfit cascades its links, likes, outfit activity and source-linked notifications. It does not automatically make previously Shared Closet garments Private.
- Likes never create Following Feed activity or Fit Twin notifications.

## Search & discovery — LOCKED V1
- Search must resolve existing canonical data rather than build a second catalog, duplicate profile index or alternate follow system.
- Authenticated **catalog search** uses the canonical Product/Brand/identifier/listing tables and returns one deduplicated canonical Product per result.
- Catalog queries may match:
  - canonical Product name,
  - canonical Brand name,
  - Brand alias,
  - manufacturer style/style number,
  - product identifiers including SKU, UPC/barcode and other stored identifiers,
  - retailer product ID,
  - retailer SKU,
  - retailer listing title.
- Search normalizes punctuation/case where logical identity permits while preserving canonical human-facing result names/slug.
- Authenticated **member search** uses member-readable username/display name only, is case-insensitive, excludes the current viewer, and returns no raw body measurements or private size references.
- Member search remains signed-in-only because V1 profile identity is signed-in-member-only.
- A member found through Search or People My Size opens the same canonical member profile and can be saved through the same canonical `follows` relationship used by Fit Twins, the Following Feed, notifications and Fit-Twins Outfits.

Fit Twin/member pages continue to show current match scores separately from historical Shared Fit History.

## Data-quality rule
**Controlled when possible. Normalize when necessary. Free text only when useful.** Search/autocomplete must prefer canonical brands/products before creation. Text, identifiers and URLs are normalized for matching while original human-facing values are preserved where useful.

## Core V1 loop
1. Create a private, versioned Fit Profile.
2. Receive current garment-relevant Fit Match scores.
3. Browse shared historical fit evidence from current or former body-state matches.
4. Log a garment with canonical product identity, original + normalized size, controlled fit and optional shared fit photo; the observation locks to the current Fit Profile version.
5. Open a product page and see exact evidence first, then clearly labeled fallback evidence weighted against each observation's historical snapshot.
6. Find useful members through People My Size or Search and save them as Fit Twins / followed members.
7. Keep learning from those people through the Following Feed and in-app Fit Twin activity notifications.
8. Post outfits and search/discover canonical products, brands and members.

Project completion status, gaps and exact next work live only in `docs/AI_MASTER_LOG.md`.