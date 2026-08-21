# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **“How did this garment fit people built like me?”**

The V1 evidence chain is:
**private body measurements + garment-specific body matching + canonical garment/product identity + real-world Fit Reports + shared fit/reference photos → useful fit evidence.**

## Canonical document role
This file owns the current **product/fit architecture**. It does not own roadmap order, deployment status, completion claims, or next actions; those live only in `docs/AI_MASTER_LOG.md`.

This file must never knowingly disagree with a current owner-locked product decision in the master. When an owner decision changes product architecture, update this spec in the same canonical change. Do not preserve stale “LOCKED” product language here and rely on a later superseded note elsewhere.

## Authoritative V1 fit/garment architecture — current through 2026-08-21

### Measurements and immutable body-state history
- `fit_profiles` is a small profile shell, not a permanent column-per-measurement table.
- Current raw values live in owner-only `body_measurements` using controlled `measurement_types`.
- `fit_profile_versions`, `fit_profile_version_measurements`, and `fit_profile_version_size_references` store immutable owner-private historical body states.
- Saving the current Fit Profile normalizes the current measurement set and creates/reuses the matching immutable version.
- Every Fit Report stores an immutable `fit_profile_version_id`; later body edits never rewrite older garment/body associations.
- A later try-on after a body change is a new Fit Report tied to the new version.
- Raw current and historical measurements and size references are never member-visible.
- The old normally-worn-size reference UI is not part of current V1. Existing private size-reference records/schema may remain for compatibility/history until deliberately audited.

### Garment identity and controlled taxonomy
- `brands` uses normalized names plus aliases for deduplication/autocomplete.
- `products` are canonical products; retailer URLs are not product identity.
- `product_families` are intentional compatible same-fit/cut groups only; never fuzzy-name auto-grouping.
- `retailer_listings` preserves retailer-specific URLs/IDs/SKUs while pointing to canonical products/variants.
- `product_identifiers` preserves manufacturer style/model, SKU, UPC/barcode and other canonical identity values.
- `product_variants` handles variant identity and normalized size.
- Garment market segment describes cut/sizing, never user gender identity.
- Browse and New Fit Report share one controlled **Category → Type → Style** taxonomy. No parallel taxonomy is allowed.
- Current V1 top-level categories are Tops, Bottoms, Dresses & One-Pieces, Outerwear, Activewear, Swimwear, Lingerie and Shoes. Accessories are not V1.
- Brand and recognizable Model/Product Line are first-class canonical metadata used by Browse/Search.
- Standardized member-entered Color is garment discovery context only and does not create duplicate canonical product cards per colorway.
- Material composition may be retained only as reliable manufacturer/product-source background data. Members do not enter or verify it and it is not a V1 Browse filter.
- **Do not collect, classify, infer, or expose stretch as a V1 member field/filter.** Legacy schema/options may remain until a deliberate cleanup; their existence does not make stretch a current product feature.

### Size normalization
- Original manufacturer/retailer `size_label` is always preserved.
- `normalized_sizes` supplies structured identity for alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation and fallback sizes.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` resolve to one logical waist/inseam identity where applicable.
- Dress/work shirts can decompose collar + sleeve; jackets chest + length; bras band + cup + sizing system.
- Free text is fallback only for genuinely unusual manufacturer sizing.

### Two distinct matching contexts — LOCKED
1. **Current person match:** viewer current body ↔ another member current body through the current-person matching engine. Overall/Tops/Bottoms and eventual Fit Twin designation live here.
2. **Historical garment evidence match:** viewer current body ↔ immutable body snapshot attached to a Fit Report.

Never blend current-person scores with historical garment evidence scores.

### Following vs Fit Twin — LOCKED
- **Following is user-controlled.** A member may follow someone for style, outfits, Closet activity, brands, useful Fit Reports or any other reason regardless of Match %.
- **Fit Twin is system-generated.** It is a strong-match designation derived from current-person matching, not a saved/followed relationship.
- A person can be Following + Fit Twin, Following without Fit Twin, or Fit Twin without Following.
- Exact Fit Twin threshold remains intentionally unresolved/configurable until the matching model is validated.
- `follows` is the one canonical social relationship graph. Do not create a second Fit Twin follow/save table.
- Member actions are **Follow / Following / Unfollow**. Do not use Save as Fit Twin, Saved Fit Twin or Remove Fit Twin.
- Public social proof uses **Followers** for the stored relationship count. Do not label follower count as Fit Twins.
- Style Feed is driven by **Following**. Fit Twin status alone does not subscribe a creator’s content.
- Fit Twin badges may appear as match context without exposing raw measurements.

### Fit matching and evidence
- No separate men's/women's matching engines. Garment type selects controlled measurement weights.
- Missing relevant measurements reduce coverage/confidence instead of failing unnecessarily.
- Current recommendation evidence hierarchy is:
  **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
- Current production evidence weights are `exact_variant` 1.00, `exact_product` 0.94, `product_family` 0.82, `similar_garments` 0.70, `brand_garment_type` 0.58 and `category_fit` 0.42.
- Exact Variant requires the variant to belong to the target Product; invalid/foreign variant IDs fall back safely.
- Product Family evidence exists only through explicit compatible family membership.
- Product evidence uses historical snapshot match scores, never current Fit Twin/person scores.
- Recommendation aggregation is capped to one strongest historical observation per unique wearer.
- All legitimate same-product observations may still be browsed as Fit Reports; the unique-wearer cap applies only to recommendation aggregation.

### Recommendation confidence
- Production `recommendSize()` is the single current recommendation-confidence implementation.
- Evidence below 50% historical body match is not recommendation-eligible in that engine.
- Confidence reflects unique-wearer/sample strength, historical closeness, relevant coverage, evidence-tier exactness, fit outcome agreement/conflict, applicable Similar Garments overlap, existing buy-again evidence where valid, and competing-size support.
- Confidence caps at 99%.
- Missing coverage, weak fallback tiers and conflicting evidence reduce confidence rather than being hidden.
- Do not create a second gift-sizing engine or Help Me Size It engine.

### Help Me Size It — LOCKED fallback behavior
**Help Me Size It is fallback sizing assistance, not a primary feature competing with real matched-wearer evidence.**

Visibility hierarchy:
1. Strong/normal useful same-product matches available → show the normal LikeSized matched evidence. Do not show Help Me Size It.
2. Some useful same-product evidence exists but normal confidence is limited → show the useful reports first, then a smaller Help Me Size It option.
3. Zero meaningful close matches → Help Me Size It becomes the primary fallback CTA.

Opening Help Me Size It:
- stay inside the Browse/Product mini-browser flow;
- show an estimated size only when the canonical recommendation engine can responsibly produce one;
- explicitly label the output as an estimate and distinguish its confidence from normal strong-match evidence;
- use the best canonical evidence available rather than generic unsupported brand claims;
- Brand + Garment Type acts as derived LikeSized brand-sizing tendency when exact evidence is thin;
- after the estimate/explanation, show **Other Fit Reports** for the same canonical garment, including other sizes, so the member can review the real-world evidence;
- Other Fit Reports may show wearer identity/photo where permitted, historical garment Match %, size and Fit Result;
- do not call them “non-matching” reports;
- if no responsible estimate exists, say so and still show available Other Fit Reports;
- if no same-product reports and no responsible estimate exist, do not invent a size; keep Notify available.

`View More Fit Reports (X)` remains the normal same-product evidence path when strong evidence is featured. Help Me Size It is the preferred combined fallback path when strong evidence is insufficient.

### Fit Reports, Fit Result and photos
- The user-facing physical fit outcome is **Fit Result**: Too Small / Snug / Just Right / Relaxed / Too Big.
- **There is no current V1 1–5-star Fit Rating UI.** Do not request or display stars in New Fit Report, Closet, Browse, Search, Help Me Size It, Product, Shared Closet, Outfit garment tags or Fit Report lists.
- Existing old schema/history related to rating experiments may remain until deliberately audited; do not treat that dormant data as a current product feature.
- `Would Buy Again` may remain as existing background recommendation evidence where valid, but it is not a replacement public star-rating system and its final member-facing role remains subject to the dedicated audit.
- Optional garment-specific controlled fit dimensions live in `fit_report_dimensions`.
- Multiple historical Fit Reports may exist for one Closet item.
- `closet_items.visibility` is `private` or `shared`; RLS controls access.
- Shared history may expose safe garment/product/size/Fit Report/history-match/photo context, never raw measurements.
- Fit/reference photo upload is optional. If uploaded, the garment is Shared and the photo is member-visible. There is no private fit-photo mode.

### Browse and Search
- Browse is one dynamic discovery page with **Garments | Outfits** and **My Fit Matches | All** scopes.
- Fresh Browse defaults to My Fit Matches.
- Garments My Fit Matches requires 75%+ garment-specific historical Match; Outfits My Fit Matches requires 75%+ current Overall Match to the creator.
- Fit Alert remains a separate 85%+ garment-specific threshold.
- Normal garment discovery/search returns one canonical product card/result rather than duplicate rows for every wearer/Fit Report.
- Explicit wearer-name search may anchor a canonical garment result to that wearer’s latest Shared report as contextual evidence.
- Mobile live search suggestions are compact list rows under the search field; do not render giant Browse cards/carousels in the suggestion surface.
- Search spans Garments, Outfits and People and is not restricted by My Fit Matches.
- Search preserves raw-measurement privacy and does not create a second catalog/member index/social graph.

### Browse card/detail interaction
- Garment image priority: Shared wearer fit photo → valid canonical/product image → garment-type LikeSized fallback. Blank image areas are not acceptable.
- Product/image tap opens Garment Quick-Detail.
- Wearer identity tap opens Wearer Mini Profile.
- Like, Save and Notify are independent tap targets and must not open product/person detail accidentally.
- Garment Like belongs to the canonical product. Fit Reports have no Like action/count.
- Save stores the canonical product in private LikeLocker.
- Notify attaches to the canonical product; Notify-on auto-saves, Notify-off leaves Saved, removing Save disables Notify.
- On mobile, the mini-browser is a true opaque full-screen detail flow with clean Back/X behavior and no underlying Browse bleed-through.

### Following Feed and notifications
- Meaningful Followed-person activity can include newly Shared Closet garments, new/retried Shared Fit Reports and new Outfits.
- Likes are not feed activity.
- Private content and raw body measurements never appear.
- Existing database/function names containing `fit_twin` are legacy implementation naming until the dedicated 6.5.3 cleanup; they must not redefine the product meaning of Fit Twin.
- Per-person Notify is separate from Follow. Notification behavior must attach to the one canonical social relationship/settings rather than create another relationship graph.

### Outfit social behavior
- Outfit posts are authenticated-member-readable social content.
- Outfit likes are one per member/post and contribute to creator **Style Likes**.
- Garment Likes belong to canonical products and do not contribute to creator Style Likes.
- Posting uses existing owned Closet garments; Outfit creation does not re-enter garment taxonomy/product data.
- Outfit discovery lives in Browse; followed-person Outfit activity lives in Style Feed; owned Outfits live inside My Closet.
- Fit Twin status alone never auto-subscribes a creator.
- Tagged garment evidence remains linked to the original garment/Fit Report context and never exposes raw measurements.

### LikeLocker and Gift Lists
- **LikeLocker = private saved fashion content** such as canonical products/garments and saved Outfits. It is not for people.
- **Following = people. Fit Twin = system match designation.**
- A LikeLocker save never automatically becomes a Gift List item.
- LikeSized Gift Lists reference canonical Products and reuse the same recommendation/confidence system; they do not duplicate products or sizing logic.
- Gift List sharing is owner-controlled. A random person cannot search a member and retrieve that member’s recommended size.
- Raw measurements are never exposed through Gift Lists.

## Data-quality rule
**Controlled when possible. Normalize when necessary. Free text only when useful.** Search/autocomplete must prefer canonical brands/products before creation. Text, identifiers and URLs are normalized for matching while useful original human-facing values are preserved.

## Core V1 loop
1. Create a private, versioned Fit Profile.
2. Receive current garment-relevant person Match scores and system Fit Twin context.
3. Browse strong shared historical garment evidence first.
4. When strong same-product evidence is insufficient, use Help Me Size It as a clearly labeled fallback estimate and inspect Other Fit Reports.
5. Log garments with canonical product identity, normalized size, Fit Result and optional Shared fit photo; each observation locks to the body state from that try-on.
6. Follow useful people independently of whether they qualify as Fit Twins.
7. Learn from followed people through Style Feed/activity while keeping current-person matching separate from historical garment matching.
8. Save fashion content to LikeLocker, create/share Outfits, and use canonical Search/Browse discovery.
9. Gift Lists may later share owner-approved wanted products with confidence-gated recommended sizes without revealing raw measurements.

Project completion status, roadmap order, preview state and exact next work live only in `docs/AI_MASTER_LOG.md`.