# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current product/fit architecture. Roadmap order, completion status, recovery state, deployment state, and exact next action live only in `docs/AI_MASTER_LOG.md`.

This file must never knowingly contradict the current owner-locked decisions in the master. When a product decision changes, rewrite this current-state architecture in the same canonical change. Do not preserve conflicting old LOCKED wording here.

# 1. Privacy and body-state architecture

- `fit_profiles` is a small profile shell, not a permanent column-per-measurement table.
- Current raw measurements live in owner-private normalized measurement tables.
- Immutable Fit Profile versions preserve historical body state.
- Every Fit Report/try-on stores an immutable body-version reference so later body edits never rewrite historical garment evidence.
- Raw current/historical measurements and private size references are never member-visible.
- The old normally-worn-size input UI is not current V1. Existing private records/schema may remain for compatibility/history until deliberately audited.

# 2. Two matching contexts — LOCKED

1. **Current person match** — viewer current body ↔ another member current body. Overall/Tops/Bottoms and eventual Fit Twin designation live here.
2. **Historical garment evidence match** — viewer current body ↔ immutable body snapshot attached to a historical garment observation.

Never blend the two contexts.

# 3. Following vs Fit Twin — LOCKED

- **Following is user-controlled.** A member may follow someone at any Match % for style/content usefulness.
- **Fit Twin is system-generated within Following** from strong current-person Match quality.
- Following places someone in My Circle; LikeSized—not the member—decides whether that followed person qualifies as a Fit Twin.
- A followed member may be Following + Fit Twin or Following without Fit Twin. A non-followed person may still have a strong Match %, but is not one of that member’s Fit Twins.
- Initial Fit Twin threshold is a configurable 85% Overall Match and may be calibrated as real distributions become available.
- `follows` is the one canonical social graph. Do not create a second Fit Twin graph.
- Member actions are **Follow / Following / Unfollow**.
- Public relationship count is **Followers**, never Fit Twins.
- My Circle and Style Feed eligibility are driven by Following. Fit Twin is a designation within that followed set, not a separate subscription.
- Legacy source/function/database identifiers containing `fit_twin` are implementation debt and do not redefine product meaning.

# 4. Community-built garment catalog and identity — LOCKED

LikeSized V1 uses a **community-built catalog**. External/API product import is retired as an active intake strategy. Historical migrations from the failed import experiments may remain immutable migration history where already applied, but they do not define current product behavior and must be retired by later canonical migrations rather than rewritten or deleted.

Core catalog rule:
**A clothing catalog built by the people who actually wear it. Tell us what you know. Leave what you do not. Each independent contribution can improve the Product record for the next person.**

- `brands` has one canonical identity plus hidden aliases for normalized punctuation, spelling variants, and reviewed common typos.
- `products` are canonical products. Retailer URLs are listings/evidence, not Product identity.
- Product families are explicit compatible same-fit/cut groups, never fuzzy-name grouping.
- Retailer listings, product identifiers, variants, manufacturer Style/Article Numbers, Product photos, controlled Department, and community material evidence attach to canonical Products.
- SKU is not assumed globally unique product identity.
- Product facts use provenance states such as provisional / corroborated / verified / rejected.
- Repeat submissions by the same member do not count as independent corroboration.
- Conflicts trigger review instead of silently replacing stronger facts.
- Admin-locked facts cannot be overwritten by later member submissions. Later disagreement remains evidence for review.

## Product resolution and duplicate prevention

Resolution should reuse an existing canonical Product whenever identity is sufficiently supported. Strong signals include:
1. explicit canonical Product selection;
2. UPC/barcode;
3. Brand + manufacturer Style/Article Number;
4. normalized retailer listing URL as supporting identity evidence;
5. normalized canonical Brand/alias + Item/Model plus compatible Garment Type and controlled Product characteristics.

The duplicate engine may combine multiple signals, including UPC, Style/Article Number, canonical Brand/aliases, normalized Item/Model, Garment Type, Department, controlled attributes, and retailer URLs.

- Hard/strong identity evidence may resolve to the existing canonical Product.
- Soft/fuzzy similarity must create a **Possible Duplicate** review candidate rather than blindly merge Products.
- If a duplicate Brand or Product is later caught, admin can merge it into the canonical record while preserving useful aliases, evidence, retailer listings, Fit Reports, and audit history.
- If items were wrongly combined, admin must be able to **split** them without destroying historical evidence.

## Barcode opening path

New Fit Report begins with a simple choice immediately above manual entry:
- **Scan barcode**
- **Enter item manually**

Barcode scanning searches **LikeSized's own catalog only**. It does not call an external retail/catalog provider.

When a scanned barcode matches a LikeSized Product:
- load that canonical Product;
- prefill known Product facts;
- keep existing known Product facts locked/read-only by default;
- allow a member to use a field-level **Report an issue / This is incorrect** action to submit an alternative value as evidence rather than silently overwrite the Product.

When a scanned barcode does not match:
- explain that LikeSized does not have information for that barcode yet;
- open normal manual/community intake;
- retain the scanned barcode behind the scenes and save it automatically with the new Product/identifier evidence when the Fit Report succeeds;
- never make the member scan or type the same barcode twice.

## Manual entry opening path

Manual entry starts with:
1. **Brand / Make** — required. Typeahead searches canonical LikeSized Brands and aliases first. A genuinely new Brand can be created only when no real match exists.
2. **Item / Model** — required. Suggestions are narrowed to Products already associated with the selected Brand. A genuinely new Product remains provisional.

The goal is to prevent duplicate identities such as `Levis`, `Levi's`, `Levi’s®`, and capitalization/punctuation variants from becoming separate Brands when they refer to the same Brand.

## Final New Fit Report order — LOCKED

The main Fit Report section is intentionally short and asks the member to make an explicit selection for each required controlled question.

1. **Brand / Make** — required.
2. **Item / Model** — required.
3. **Garment Type** — required and specific/member-facing. LikeSized derives the broader Category.
4. **Garment-specific controlled questions** — up to four for that Garment Type. Each displayed question requires a physical selection. The default is blank/disabled **Select an answer**; **Not sure** is always the final option and is never preselected. Selecting Not sure satisfies the interaction requirement but records no positive Product claim for that field.
5. **Color family** — required and controlled.
6. **Exact Size** — required using the canonical structured size controls. The size-system selector starts blank with **Choose your measurement system**; no size system or size is preselected.
7. **Overall Fit Result** — required: Too Small / Snug / Just Right / Relaxed / Too Big.
8. **Condition** — required: New / Used / Altered.
9. **Fit Photo** — optional but remains grouped with the primary Fit Report because LikeSized wants this evidence. Uploaded Fit Photos follow the Shared evidence rule.
10. **Fit notes** — optional.

Then show a clear visual break:

**Want to help build the LikeSized catalog?**
*Everything below is optional. Add anything you know to help make this item's record better for the next person.*

Optional community-catalog enrichment follows in this order:
1. **Retail link**
2. **UPC / Barcode** — omitted/hidden as a duplicate input when a barcode was already scanned; the scanned value is retained automatically.
3. **Manufacturer Style / Article Number**
4. **Material / Fabric Composition** — controlled add-material input so blends can be represented uniformly; no free-form material spelling variants. Percentages may be stored when explicitly supplied but are not required.
5. **Product photo** — clear image of the product itself, separate from the member's Fit Photo and subject to moderation.
6. **Department** — controlled.

Initial controlled Department choices are:
- Women's
- Men's
- Unisex
- Girls'
- Boys'
- Kids / Unisex
- Baby / Toddler
- Not sure

Department starts blank and **Not sure** is last.

Initial controlled Material/Fabric vocabulary includes canonical values such as Cotton, Organic Cotton, Polyester, Recycled Polyester, Nylon, Recycled Nylon, Wool, Merino Wool, Cashmere, Linen, Rayon, Viscose, Modal, Lyocell/Tencel, Elastane/Spandex, Acrylic, Silk, Leather, Suede, Synthetic Leather, Other, and Not sure. The application must use one canonical controlled vocabulary rather than user-created spelling variants.

## Existing/partial Product guidance

The intake copy adapts to Product completeness:
- **New Product:** tell the member they may be the first person helping build this Product's LikeSized record.
- **Partially completed Product:** show known facts and invite the member to fill any missing information they know.
- **Well-completed Product:** show the existing community-built facts locked by default; the member focuses on their own Fit Report and may report a specific incorrect Product field if necessary.

Existing Product facts must not be hidden behind a generic yes/no confirmation question. The member should see the actual facts being relied on.

## Starter catalog seed — LOCKED

The owner-supplied initial Brand/Model seed list is part of launch preparation. Seed Products receive only the known starter facts—canonical Brand + Item/Model + Garment Type. Do not invent Color, material, identifiers, Department, attributes, descriptions, or retailer links merely to make a seed Product look complete. Community evidence fills those facts over time.

## V1 taxonomy
Explore and New Fit Report must share one controlled garment taxonomy. No parallel category/type/style systems.

Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- Shoes

Accessories are not V1.

New Fit Report asks for the specific physical Type only; LikeSized derives the broad Category. Explore asks for the broad Category first, then exposes only Types in that Category. After a Type is selected, Explore and intake share the same zero-to-four controlled questions for that Type. In intake, displayed questions start blank, require a selection, and place **Not sure** last. Color is required, controlled, and separate from the four-question ceiling.

The database keeps the approved member-facing Type set separate from legacy matching compatibility. `garment_types.intake_active` controls the Types selectable in New Fit Report and Explore. The older `active` flag and historical umbrella/plural keys may remain available internally so existing Products and calibrated matching rules keep working; those keys must not reappear as member-facing choices.

For jeans/pants, owner review identified explicit controlled structural descriptors such as:
- leg shape/cut: Skinny, Slim, Straight, Relaxed, Wide, Bootcut, Flare;
- rise: Low, Mid, High where applicable.

The complete owner-approved per-Type mapping is recorded in the canonical master and implemented once in `lib/garment-taxonomy.ts`; do not create a second pants-only or Explore-only taxonomy.

## Material / stretch boundary
- Material/Fabric Composition is now an **optional community-catalog enrichment field** using controlled values; it is not part of the required Fit Report and must not become free text.
- Community material evidence follows the same provenance/conflict rules as other Product facts.
- Material does not affect the calibrated Fit Match/recommendation engine unless a later owner-approved audit explicitly adds it.
- Material is not automatically a V1 Explore filter merely because it is stored; filter exposure requires its own approved product decision.
- **Do not collect, classify, infer, or expose stretch as a current V1 member field/filter.**
- Legacy stretch schema/PR #36 logic may remain dormant only for compatibility until deliberately audited. Dormant support does not make stretch a current product feature.

# 5. Size normalization

- Preserve useful original manufacturer size labels when deliberately provided, but do not ask the member for the same size twice.
- Normalize logical identities for alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation, and fallback sizes.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` normalize to one logical waist/inseam identity when appropriate.
- Work shirts can decompose collar + sleeve, jackets chest + length, bras band + cup + sizing system.
- Free text is fallback only for unusual manufacturer sizing.

# 6. Fit Result — LOCKED / STAR SYSTEM REMOVED

Physical outcome values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is **no current V1 1–5-star Fit Rating UI**.

Do not request/display stars in New Fit Report, Closet, Browse, Search, Product, Help Me Size It, Shared Closet, Outfit garment tags, or Fit Report lists.

A legacy database type named `fit_rating` may remain if it stores the five physical Fit Result values. The legacy identifier does not authorize star/satisfaction semantics.

Bad outcomes are valuable evidence. Too Small/Too Big do not reduce the wearer's body Match %; body similarity and garment outcome remain separate.

`Would Buy Again` may exist as optional product feedback but **does not influence size recommendation or recommendation confidence** under the owner-locked Fit Match audit.

# 7. Deep Fit Match architecture — OWNER LOCKED

## Match semantics
- One primary Match % = garment-relevant body similarity, not probability that the garment will fit.
- Body Match is symmetric.
- Confidence is secondary and qualitative when exposed: **High / Good / Limited**.
- Raw measurement coverage is not a fake confidence label.
- Internal recommendation-confidence percentages are implementation/calibration detail rather than a competing public Match percentage.

## Confidence-aware matching
- Smooth tolerance similarity replaces brittle all-or-nothing cutoffs where the audit implemented it.
- Similarity and coverage/confidence roles are separate.
- Optional missing measurements reduce available refinement/confidence rather than generating fake values.
- Edge-body/uncommon-proportion cases use the same algorithm. Fix garment logic when a range performs worse; do not create hidden body-type scorers.

## Directional recommendation evidence
- Match remains symmetric.
- Size recommendation may privately use direction of viewer-vs-historical-wearer differences for target-garment measurements.
- Raw signed deltas/private directional pressure never reach clients.
- Only safe outcome-specific aggregate directional support may reach the recommendation layer.

## Preferred Fit
Private Fit Profile preference by garment type:
- Fitted
- Standard
- Relaxed

Rules:
- Standard is the neutral default.
- Preference-only edits do not create new immutable body versions.
- Preferred Fit does not change Match %, Fit Twin qualification, or person matching.
- It affects only interpretation of physical Fit Result when recommending size.
- Too Small/Too Big remain negative for every preference.

## Derived body proportions
- derived privately from measurements already supplied;
- no user-entered ratio fields;
- not stored as separate body-profile values;
- small garment-specific refinement only;
- missing numerator/denominator leaves qualified base Match unchanged;
- total influence cap: **8%**;
- final Match movement cap: **±4 percentage points** from the qualified confidence-aware base Match;
- examples include chest-to-waist, bust-to-waist, shoulder-to-chest/bust, waist-to-hip, thigh-to-hip, torso-to-height, inseam-to-height, rise-to-height when relevant.

## Chest vs Full Bust
- Chest and Full Bust are distinct measurements.
- Generic Overall/Tops does not penalize missing Full Bust where bust shaping is irrelevant.
- Product-specific bust shaping activates only for explicitly women's products configured as bust-shaped.
- Audit-configured V1 bust-shaped types: blouse, dresses, bodysuits, suit jackets, blazers.
- Unknown/unisex products are not inferred into a women's fit context from measurement combinations or names.
- Bras/intimates retain specialized Full Bust + Underbust + High Bust handling.
- Optional Full-Bust-to-Chest proportion refinement remains private and inside the global derived-proportion cap.

## Measurement freshness
- current measurements carry private last-confirmed timestamps and measurement-specific reconfirmation cadence;
- age does not change stored value, raw similarity, qualification, or coverage;
- stale age may apply only a mild confidence discount after the reconfirmation window;
- UI may show **Remeasure recommended** + **Confirm unchanged**;
- ordinary unchanged save does not silently refresh confirmation time;
- confirmation-only changes do not create fake immutable history versions;
- historical snapshots do not decay merely because time passes;
- V1 intake remains manual tape/scale; no device/import reliability workflow.

## Bra / shoes / outerwear
- Bras: Full Bust + Underbust core, High Bust supporting; existing bust-point geometry optional low-weight evidence; no second bra formula.
- Shoes: Foot Length dominant, Foot Width secondary under the audit's existing 70/30 profile.
- Outerwear: jackets/coats may use modestly wider circumference tolerances for normal layering; suit jackets/blazers remain more precise; no separate layering preference/input.

## Garment condition / changed state
Options:
- New
- Used
- Altered

New and Used observations use normal sizing evidence. Altered observations remain in personal Fit History but are excluded from normal-product community summaries/recommendation evidence. Filtering happens before unique-wearer selection so an earlier unaltered observation may still count if the physical garment is later altered.

## Actual garment measurements — deferred
- V1 must work without manufacturer physical garment measurements/specs.
- Generic brand body-size charts are not actual garment dimensions/ease.
- Reliable physical garment dimensions may be future optional enrichment only.

## Learned calibration — future controlled rule
- aggregated LikeSized Fit Result data may calibrate existing weights/tolerances only with meaningful sample sizes, unique wearers, versioned tests/review, and owner approval before production behavior changes;
- no autonomous self-rewriting model in V1.

# 8. Recommendation evidence hierarchy

**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Current engine weights recovered from the owner-audited recommendation code:
- exact_variant 1.00
- exact_product 0.94
- product_family 0.82
- similar_garments 0.70
- brand_garment_type 0.58
- category_fit 0.42

Current `recommendSize()` architecture:
- uses Fit Result support, historical body Match, evidence exactness, sample strength/conflict and directional/preference support where implemented;
- excludes recommendation evidence below 50% historical body Match unless a later audited change explicitly replaces that boundary;
- caps confidence below 100%;
- must not use `Would Buy Again` as recommendation/confidence input.

# 9. Help Me Size It — LOCKED FALLBACK

**Help Me Size It is fallback sizing assistance, not a primary feature. Real matched-wearer evidence comes first.**

Visibility hierarchy:
1. Strong normal same-product matches available → show normal LikeSized evidence; do not show Help Me Size It.
2. Some useful evidence but limited normal confidence → show useful reports first, then smaller Help Me Size It fallback.
3. Zero meaningful close matches → Help Me Size It becomes the main fallback CTA.

Rules:
- reuse canonical `recommendSize()`/recommendation evidence architecture;
- do not create a second sizing engine/table;
- estimated size appears only when the engine can responsibly produce one;
- label fallback result as an estimate;
- Brand + Garment Type is the canonical derived brand-sizing tendency rather than unsupported generic “Brand X runs small/large” claims;
- show **Other Fit Reports** for that same canonical garment under the estimate/explanation, including other sizes;
- do not call them non-matching reports;
- if no responsible estimate exists, say so and still show available Other Fit Reports;
- if no same-product reports and no responsible estimate exist, do not invent a size.

Notify belongs to the insufficient/no-useful-fit-evidence fallback state so a member may be alerted when useful matching evidence arrives. Notify is not a permanent always-visible matched-card action.

# 10. Explore / Search — CURRENT OWNER-LOCKED DESIGN

## Structure
- one dynamic Explore page at `/explore`; legacy `/browse` links redirect without owning a second implementation;
- search at top;
- **Garments | Outfits**;
- each content type: **My Fit Matches | All**;
- fresh visit defaults to My Fit Matches;
- garment/outfit scope/filter/sort/search state remembered independently during the active Explore session only.

## Eligibility/ranking
Garments My Fit Matches:
- 75%+ garment-specific historical Match.

Outfits My Fit Matches:
- 75%+ current Overall Match to creator.

Tiers:
- 90–99
- 85–89
- 80–84
- 75–79

Within tier: Match % → unseen/freshness → recency → likes/popularity.

Fit Alert remains separate at 85%+ garment-specific Match with legitimate relevant measurement support.

## Batches
- carousel: 8
- initial results: 24
- Keep Browsing: +24

## Search
- Garments, Outfits, People across full available inventory;
- not restricted to My Fit Matches;
- normal garment search returns one canonical product result, not one row per wearer/Fit Report;
- wearer-name contextual search may anchor the canonical product to that wearer's latest Shared report;
- suggestions appear directly below the search field while typing;
- each non-empty Garments, Outfits, and People group shows its exact result count and up to five top suggestions;
- choosing a suggestion or submitting a full grouped search opens over Explore instead of replacing the browsing route, preserving filters, batches, carousel position, and scroll state;
- query relevance is primary; catalog trust breaks ties among similarly relevant garment results.

## Strict filters
- user selections never silently relax;
- Category and Type never relax; changing Category clears incompatible Type/question selections;
- Type-specific filters expose only the approved controlled questions and options for the selected Type; a Polo cannot inherit Jeans cuts;
- See Similar proposes one visible relaxation before applying it;
- Color remains browsable/searchable even when card UI displays color separately from taxonomy tags;
- Brand/Item name remain first-class canonical metadata;
- no V1 stretch filter;
- Material storage does not automatically create a Material filter.

## Garment card interaction and shopping
- image priority: Shared wearer fit photo → valid canonical/product image → LikeSized garment-type fallback;
- blank image state is invalid;
- product/image → Garment Quick-Detail;
- wearer identity → Wearer Mini Profile;
- **heart = Like**;
- **wishlist control = wishlist/save action**;
- heart likes save ordinary garment inspiration to LikeLocker → Garments; the Wish Locker control records separate purchase intent in LikeLocker → Wish Locker; future Gift Lists may reuse canonical products but must not collapse these private intents;
- when the canonical Product has at least one valid retailer listing, relevant garment imagery/surfaces show the three-action set **Like + Wishlist + Shopping Cart/Shop**;
- when no valid retailer listing exists, the Shopping Cart/Shop action disappears entirely rather than showing a dead or disabled purchase control;
- the same conditional retail-link behavior applies to **Shop Here** or equivalent CTAs under Fit Reports/Product details and to shopping links presented from Wish Locker/Gift Lists;
- Notify is not shown as a permanent normal action when useful Fit Matches exist; it appears in insufficient/no-useful-fit-evidence fallback states;
- Like/Wishlist/Shop/Notify must be distinct tap targets and never open detail accidentally;
- no stars.

## Mobile mini-browser
- opaque true full-screen mobile flow;
- clean Back + X controls;
- underlying Explore state preserved but visually hidden;
- overlay history supports garment/person/outfit/report exploration.

# 11. Retail listings, affiliate monetization, LikeLocker and Gift Lists

## Retail listings — LOCKED
- A canonical Product may have **multiple retailer listings**.
- A newly contributed legitimate retail URL appends; it never overwrites another retailer/version.
- Normalize URLs so the same effective listing is not duplicated repeatedly.
- Preserve the original retailer URL/provenance even when an affiliate/tracking layer is later applied.
- The same retailer URL attached to apparently different Products is a strong duplicate/conflict signal for review.
- Dead or invalid links may later be marked inactive without erasing historical provenance.

## Skimlinks / affiliate retail monetization — ROADMAP LOCKED
- LikeSized plans to monetize eligible outbound retail traffic through **Skimlinks or an owner-approved equivalent affiliate layer**.
- Affiliate monetization is a commerce layer over canonical retailer listings, never a Product-identity system.
- The original canonical retailer URL/listing remains preserved; affiliate routing/tracking must not replace the underlying Product/listing evidence.
- Affiliate disclosure, eligibility, click behavior, privacy/cookie implications, retailer exceptions, and production integration must be audited against the then-current Skimlinks requirements before launch.
- No affiliate system may fabricate a Shop action when a valid retail listing does not exist.

## LikeLocker
- previously approved private saved-fashion destination for canonical products/garments and saved Outfits;
- not for people.

## Wish Locker — OWNER LOCKED
- LikeLocker opens to Garments and filters **Garments / Outfits / Wish Locker**.
- Garments = ordinary product likes.
- Outfits = Outfit likes.
- Wish Locker = products the member specifically wants to buy.
- The three states have distinct intent but live in one LikeLocker destination; people never belong there.

## LikeSized Gift Lists
- roadmap-locked after Product/retailer/save/recommendation foundations;
- owner-approved wanted garments with confidence-gated recommended size;
- reuse canonical Products and canonical sizing engine;
- no second gift-sizing engine;
- owner-controlled sharing only;
- random member search must never reveal another person's recommended size;
- raw measurements never exposed;
- below sufficient confidence, say there is not enough fit data rather than fabricate a recommendation;
- eligible retail links may be surfaced conditionally using the same canonical retailer/affiliate layer.

# 12. Outfits / social content

- Outfits remain in V1; the earlier remove-Outfits decision is superseded.
- Outfit posts use existing owned Closet garments; do not duplicate garment product/taxonomy data.
- Outfit likes contribute to creator Style Likes.
- Garment/product likes do not contribute to Style Likes.
- Other-member Outfit discovery lives in Explore.
- Followed-person Outfit activity lives in Style Feed.
- Owned Outfits live in My Closet.
- Fit Twin designation never creates a second subscription; it can only exist for someone already followed.

# 13. Admin moderation, duplicate review and catalog verification — LOCKED

Only explicitly authorized admins may use the administrative review surfaces.

Admin must have distinct review queues/tabs for at least:
- **Conflicting Product Facts**
- **Possible Duplicates**
- **Reported / Spam Content**
- **Review / Moderation History**

Catalog powers:
- inspect competing field values, supporting independent members, evidence status, identifiers, retailer listings, and relevant Product/Fit Report context;
- merge duplicate Brands/Products into the correct canonical record while retaining aliases, evidence, retailer links, Fit Reports, and history;
- **split** a Product that was incorrectly combined, moving the correct identifiers/listings/evidence/reports to the resulting Product records without silent data loss;
- choose/override the correct canonical Product value or description;
- permanently **verify/lock** a Product field/description when the answer is known;
- reopen a field only through an authorized audited admin action;
- preserve later member disagreement as evidence without allowing it to overwrite a locked value.

Content/moderation powers:
- review reported Outfit posts, Fit Photos, Product Photos, spam intakes, and spam Fit Reports;
- remove inappropriate or spam content and associated member-visible photo files where applicable;
- close duplicate reports on the same removed target while preserving the report/action history;
- retain an append-only accountable audit trail of who acted, when, what changed/was removed, and why.

Member reports/flags never directly rewrite canonical Product truth or permanently delete content without the applicable authorized moderation path.

# 14. Images / sharing

- Fit/reference photo upload is optional.
- If uploaded, the garment is Shared and the photo is visible to authenticated LikeSized members.
- There is no private fit-photo mode.
- Never use another member's personal fit photo as a generic product fallback.
- Product Photo is a separate optional community-catalog image of the item itself and is subject to the Product evidence/moderation rules.
- Outfit photo intake may accept JPEG, PNG, or WebP files up to 8 MB, but the original must not be stored directly.
- Before upload, new outfit photos are converted to WebP as a display image capped at 600 KB and a feed image capped at 220 KB.
- Outfit and Following feeds use the feed-sized image. The display image is reserved for detail/full presentation.
- Existing legacy outfit-photo paths remain readable; new optimized paths must not break older posts.
- Both files remain in the private, authenticated-member-readable `outfit-photos` bucket with owner-only writes/deletes.

## Public homepage / FAQ — LOCKED

- The public homepage remains useful without registration and includes the FAQ inline; public visitors must not need an account or an unfinished Help route to read it.
- Homepage section order after the hero is **The Loop → What LikeSized Does → Help / FAQ**.
- The three capability calls to action are **Find My Matches → / Shop Smarter → / Get Inspired →**.
- Public Fit Twin, Following, Match, Fit Result, and privacy explanations must agree with the canonical product definitions and must not expose raw measurements.
- Community-catalog copy should frame LikeSized as **a clothing catalog built by the people who actually wear it** and explain that members contribute what they confidently know while later independent members can strengthen or correct the record.
- FAQ must explain that unknown Product details may be left blank in the optional community section, while the simple required observable garment questions still require an explicit answer or Not sure selection.
- FAQ must explain that disagreement is preserved/reviewed rather than one member silently replacing another member's Product facts.

# 15. Data-quality rule

**Controlled when possible. Normalize when necessary. Free text only when useful.**

Search/autocomplete must prefer canonical brands/products before creation. Identifiers/URLs are normalized for matching while useful human-facing original values are preserved. Hidden aliases handle reviewed spelling/punctuation variants without exposing duplicate Brands as separate catalog identities.

# 16. Current V1 loop

1. Create/update a private versioned Fit Profile.
2. Receive garment-relevant current-person Match context and eventual Fit Twin designation.
3. Browse strong real-world historical garment evidence first.
4. When strong same-product evidence is insufficient, use Help Me Size It as a clearly labeled fallback estimate and inspect Other Fit Reports.
5. Log a garment by scanning a barcode against LikeSized or entering Brand/Make + Item/Model manually; complete the required observable Product/Fit fields and optional catalog-enrichment section; preserve the immutable body state from that try-on.
6. Each independent contribution can improve the one canonical Product record; conflicts and possible duplicates flow to admin review rather than silent overwrite/merge.
7. Follow useful people into My Circle; LikeSized may designate the strongest followed body matches as Fit Twins.
8. Consume followed-person style/activity while keeping current-person matching separate from historical garment matching.
9. Save ordinary garment and Outfit inspiration in LikeLocker; use Wish Locker separately for products specifically wanted for purchase.
10. When a valid retailer listing exists, expose the conditional Shop action and route eligible outbound commerce through the approved affiliate layer without changing Product identity.
11. Create/share Outfits using existing Closet garments.
12. Gift Lists may later share owner-approved wanted products with confidence-gated recommended sizes and eligible retail links without revealing raw measurements.

For recovery status, roadmap order, implementation completeness, deployment state, and exact next work, read `docs/AI_MASTER_LOG.md`.
