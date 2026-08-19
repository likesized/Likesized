# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **“How did this garment fit people built like me?”**

The V1 evidence chain is:
**private body measurements + garment-specific body matching + canonical garment/product identity + real-world Fit Reports + shared fit/reference photos → useful fit evidence.**

## Planning source
This file defines the **product/fit architecture only**. It does not own project status or build order. The sole canonical roadmap/status/handoff is `docs/AI_MASTER_LOG.md`.

## Authoritative V1 fit/garment architecture — 2026-08-19
This section supersedes every earlier simplified architecture decision about measurements, products, sizing, Fit Reports, Closet sharing, Fit Twins, and fit/reference photos.

### Measurements and immutable body-state history
- `fit_profiles` is a small profile shell (unit preference/completion/current version), not a permanent column-per-measurement table.
- Current raw values live in owner-only `body_measurements` using controlled `measurement_types`.
- `fit_profile_versions`, `fit_profile_version_measurements`, and `fit_profile_version_size_references` store immutable owner-private historical body states.
- Saving the current Fit Profile uses one atomic database function that replaces the current measurement set, applies database precision/unit normalization, and creates or reuses the immutable version matching that exact body state.
- Every Fit Report stores an immutable `fit_profile_version_id`. Editing current measurements later never changes the body state attached to an older garment observation.
- A later try-on after a body change is a new Fit Report observation tied to the new version; historical garment/body associations are not rewritten.
- Manual values are numeric, validated and normalized to a canonical internal unit. Measurement types define sensible imperial/metric precision; ordinary body measurements can use quarter-inch precision while foot/device/imported data may be finer.
- Natural waist, lower/pants waist, high hip and full hip/seat are distinct types.
- Full bust, high/upper bust, underbust, overbust, bust-point spacing and shoulder-to-bust-point are distinct types.
- Neck/collar, arm/sleeve, bicep, wrist, across-back/front, rise, thigh/knee/calf, torso girth, crotch/outseam, foot length/width and other tailoring measurements are extensible controlled types.
- Normally worn bra/shoe/other size references are private `user_size_references`; historical copies live with each Fit Profile version.
- Raw current and historical measurements and size references are never member-visible.

### Garment identity and taxonomy
- `brands` uses normalized names plus aliases for deduplication/autocomplete.
- `products` are canonical products; retailer URLs are not product identity.
- `product_families` preserve fit evidence across **intentional non-fit-critical releases that genuinely share the same fit/cut**. Product Families are never created from fuzzy name similarity alone.
- New canonical Products created through the Closet flow receive a Product Fit Family at creation. Safe default is a standalone family for that product/style. A new Product may explicitly join an existing family only when the member knows it is the same fit/cut and the brand, garment type and market/cut segment all match.
- Existing shared canonical Products are not silently reassigned between families by later Closet logs. Reusing an existing Product preserves its established family.
- `retailer_listings` preserves retailer-specific URLs, IDs and SKUs while pointing to one canonical product/variant.
- `product_identifiers` stores original plus normalized manufacturer style, SKU, UPC/barcode and retailer identifiers.
- `product_variants` handles color/variant identity and normalized size.
- Garment market segment is controlled: men's, women's, unisex, kids/youth, unknown. It describes cut/sizing, never user gender identity.
- `garment_types` is an extensible controlled taxonomy (T-shirt, dress/work shirt, blouse, jeans, dresses, bras, shoes, etc.).
- Similar Garments uses controlled construction attributes, not free-text similarity guesses. V1 controlled attributes include fit/cut, rise, stretch level, **Primary material / fabric family**, sleeve length, neckline, collar style, knit/woven construction, length profile and leg shape.
- V1 does **not** attempt exact fiber-percentage composition. Primary material/fabric family is a controlled broad signal such as cotton, denim, linen, wool, silk, polyester, nylon, rayon/viscose, modal/lyocell, leather, fleece, canvas, mixed blend, etc.
- Category-scoped attributes may be stored only for compatible Product categories; global attributes such as primary material may apply across categories.
- Product construction attributes are initialized only when the Closet flow truly creates a new canonical Product. A later log that reuses or deduplicates to an existing Product does not silently rewrite that shared Product's established attributes.

### Size normalization
- Original manufacturer/retailer `size_label` is always preserved.
- `normalized_sizes` supplies logical structured identity for alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length-designation and fallback sizes.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` resolve to the same logical waist/inseam key where they mean 30/30.
- Dress/work shirts can decompose collar + sleeve/sleeve range; jackets chest + length; bras band + cup + system.
- Free text is only the fallback for unusual manufacturer sizing and is never preferred as a matching key.

### Two distinct matching contexts — LOCKED
1. **Current person / Fit Twin match:** `get_fit_matches` and `get_garment_fit_matches` compare the viewer's current `body_measurements` to the other person's current `body_measurements`. Old garments never change this percentage.
2. **Historical garment evidence match:** each Fit Report compares the viewer's current body to the immutable `fit_profile_version_id` attached to that specific observation. A member can be a weak current Fit Twin yet have an older garment report whose historical body state is an excellent match to the viewer today.

Do not blend current-person scores with historical garment scores.

### Fit matching and evidence
- No separate men's/women's engines. Garment type selects `match_profiles` and relevant `match_profile_measurements`.
- Missing relevant measurements reduce coverage/confidence; irrelevant measurements are not used merely because they exist.
- Evidence hierarchy is locked as: **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
- An Exact Variant target is canonical only when that variant belongs to the displayed Product. A foreign/invalid variant ID cannot promote unrelated evidence and safely falls back to Product/broader tiers.
- Product Family evidence exists only through explicit compatible family membership; similar product names alone never create this tier.
- Similar Garments requires same garment type plus controlled Product-attribute overlap; controlled overlap is stronger than mere same-brand/type evidence.
- Product evidence uses historical snapshot match scores, never the wearer's current-person Fit Twin score.
- Product recommendation evidence is capped to **one strongest historical observation per unique wearer**. Five observations from one person never count as five people and cannot inflate confidence.
- All legitimate historical observations remain available in that member's Shared Fit History; the unique-wearer cap applies to recommendation aggregation, not history deletion.

### Recommendation confidence — LOCKED V1 behavior
- The production `recommendSize()` function is the single confidence implementation; tests call it directly rather than duplicating its formula.
- Evidence below **50% historical body match** is not recommendation-eligible.
- Confidence is influenced by unique-wearer/sample strength, historical body-match closeness, relevant measurement coverage, evidence-tier exactness, fit outcome support/conflict, Similar Garments attribute overlap, buy-again signal and whether multiple sizes compete for support.
- Confidence is capped below absolute certainty at **99%**.
- Missing or incomplete relevant measurements reduce confidence rather than failing the recommendation when enough evidence remains.
- Conflicting reports or evidence split across multiple plausible sizes reduce confidence.
- Weaker fallback tiers remain usable but are intentionally less confidence-producing than exact evidence.
- Current calibration reference cases are maintained in `tests/recommendation-confidence.test.ts` and enforced by CI; numerical changes to production confidence behavior must update those tests intentionally rather than drifting silently.

### Fit Reports, Shared Closet and photos
- Overall fit remains controlled; optional garment-specific dimensions live in `fit_report_dimensions` using controlled response dictionaries.
- Multiple historical Fit Report observations may exist for one Closet item across real try-ons/body states.
- `closet_items.visibility` is `private` or `shared`; RLS—not UI filtering—controls member access.
- Shared Closet history may expose brand/product, garment type, original size, Fit Report, safe historical match percentage and fit/reference photo; it never exposes raw measurements.
- Fit/reference photo upload is optional. **If uploaded, it is shared with authenticated LikeSized members. There is no private fit-photo mode.**
- `fit-reference-photos` is a non-public Supabase Storage bucket: authenticated members may read shared references, only the owner may write/delete their folder. A retired empty `closet-photos` bucket has no application policies and is not used.

## Fit Twins
A V1 Fit Twin is a Fit Match the user deliberately saves/follows. There is no universal percentage threshold. The relationship is stable while live current-person match scores may change. Fit Twin/member pages show current match scores separately from historical Shared Fit History.

## Data-quality rule
**Controlled when possible. Normalize when necessary. Free text only when useful.** Search/autocomplete must prefer canonical brands/products before creation. Text, identifiers and URLs are normalized for matching while original human-facing values are preserved where useful.

## Core V1 loop
1. Create a private, versioned Fit Profile.
2. Receive current garment-relevant Fit Match scores.
3. Browse shared historical fit evidence from current or former body-state matches.
4. Log a garment with canonical product identity, original + normalized size, controlled fit and optional shared fit photo; the observation locks to the current Fit Profile version.
5. Open a product page and see exact evidence first, then clearly labeled fallback evidence, weighted against each observation's historical snapshot.
6. Save useful current matches as Fit Twins.
7. Post outfits and search/discover products, brands and members.

Project completion status, gaps and exact next work live only in `docs/AI_MASTER_LOG.md`.
