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

# 4. Garment identity and controlled taxonomy

- `brands` uses normalized identity/aliases.
- `products` are canonical products; retailer URLs are not product identity.
- product families are explicit compatible same-fit/cut groups, never fuzzy-name grouping.
- retailer listings, product identifiers, variants, and manufacturer style/model identifiers attach to canonical products.
- SKU is not assumed globally unique product identity.
- Product resolution order from the Fit Match audit is:
  **explicit canonical Product → UPC/barcode → normalized Product URL → Brand + manufacturer Style ID → normalized Brand + Product fallback/new provisional Product**.
- Product facts use provenance states such as provisional / corroborated / verified / rejected.
- Repeat submissions by the same member do not count as independent corroboration.
- Conflicts trigger review instead of silently replacing stronger facts.

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

New Fit Report asks for the specific physical Type only; LikeSized derives the broad Category. Explore asks for the broad Category first, then exposes only Types in that Category. After a Type is selected, Explore and intake share the same zero-to-four optional controlled questions for that Type. **Not sure** is the first/default intake choice and records no claim. Color is required, controlled, and separate from the four-question ceiling.

The database keeps the approved member-facing Type set separate from legacy matching compatibility. `garment_types.intake_active` controls the Types selectable in New Fit Report and Explore. The older `active` flag and historical umbrella/plural keys may remain available internally so existing Products and calibrated matching rules keep working; those keys must not reappear as member-facing choices.

The core New Fit Report intake is Brand, Item name, specific Garment type, applicable optional controlled questions, Color, exact Size, optional Product link/barcode/Style ID, Overall Fit Result, Garment condition, optional Shared Fit photo, and optional Fit notes. It does not ask for Market/cut segment, Fit Family, product description, visibility, buy-again, times worn, or a broad construction/fit-dimension questionnaire.

For jeans/pants, owner review identified a need for explicit controlled structural descriptors such as:
- leg shape/cut: Skinny, Slim, Straight, Relaxed, Wide, Bootcut, Flare;
- rise: Low, Mid, High where applicable.

The complete owner-approved per-Type mapping is recorded in the canonical master and implemented once in `lib/garment-taxonomy.ts`; do not create a second pants-only or Explore-only taxonomy.

## Material / stretch boundary
- Material composition may be retained only from reliable manufacturer/product sources as background data.
- Members do not enter/verify material and Material is not a V1 Browse filter.
- **Do not collect, classify, infer, or expose stretch as a current V1 member field/filter.**
- Legacy stretch schema/PR #36 logic may remain dormant only for compatibility until deliberately audited. Dormant support does not make stretch a current product feature.

# 5. Size normalization

- Preserve original manufacturer/retailer size labels.
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
- no member material filter.

## Garment card interaction
- image priority: Shared wearer fit photo → valid canonical/product image → LikeSized garment-type fallback;
- blank image state is invalid;
- product/image → Garment Quick-Detail;
- wearer identity → Wearer Mini Profile;
- **heart = Like**;
- **wishlist control = wishlist/save action**;
- heart likes save ordinary garment inspiration to LikeLocker → Garments; the Wish Locker control records separate purchase intent in LikeLocker → Wish Locker; future Gift Lists may reuse canonical products but must not collapse these private intents;
- Notify is not shown as a permanent normal action when useful Fit Matches exist; it appears in insufficient/no-useful-fit-evidence fallback states;
- Like/Wishlist/Notify must be distinct tap targets and never open detail accidentally;
- no stars.

## Mobile mini-browser
- opaque true full-screen mobile flow;
- clean Back + X controls;
- underlying Explore state preserved but visually hidden;
- overlay history supports garment/person/outfit/report exploration.

# 11. LikeLocker / Wishlist / Gift Lists

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
- below sufficient confidence, say there is not enough fit data rather than fabricate a recommendation.

# 12. Outfits / social content

- Outfits remain in V1; the earlier remove-Outfits decision is superseded.
- Outfit posts use existing owned Closet garments; do not duplicate garment product/taxonomy data.
- Outfit likes contribute to creator Style Likes.
- Garment/product likes do not contribute to Style Likes.
- Other-member Outfit discovery lives in Explore.
- Followed-person Outfit activity lives in Style Feed.
- Owned Outfits live in My Closet.
- Fit Twin designation never creates a second subscription; it can only exist for someone already followed.

# 13. Moderation and catalog verification

- Members can report Outfit posts and shared Fit Report photos with a controlled reason and optional details.
- Only explicitly authorized admins can review all reports, dismiss reports, remove reported content, or resolve disputed catalog facts.
- Removing inappropriate photo content removes its member-visible record and private Storage files; the moderation action remains in an append-only audit trail.
- Member-supplied missing garment facts are provisional. Independent agreement corroborates them; disagreement automatically marks the canonical Product for admin review.
- Admin-reviewed controlled tags become verified/locked values. Later member evidence cannot overwrite them and remains available only as conflict evidence.
- Product confirmation, conflict review, and locking extend the one canonical Product evidence/provenance system. They never create a second catalog.

# 14. Images / sharing

- Fit/reference photo upload is optional.
- If uploaded, the garment is Shared and the photo is visible to authenticated LikeSized members.
- There is no private fit-photo mode.
- Never use another member's personal fit photo as a generic product fallback.
- Outfit photo intake may accept JPEG, PNG, or WebP files up to 8 MB, but the original must not be stored directly.
- Before upload, new outfit photos are converted to WebP as a display image capped at 600 KB and a feed image capped at 220 KB.
- Outfit and Following feeds use the feed-sized image. The display image is reserved for detail/full presentation.
- Existing legacy outfit-photo paths remain readable; new optimized paths must not break older posts.
- Both files remain in the private, authenticated-member-readable `outfit-photos` bucket with owner-only writes/deletes.

## Public homepage — LOCKED

- The public homepage remains useful without registration and includes the FAQ inline; public visitors must not need an account or an unfinished Help route to read it.
- Homepage section order after the hero is **The Loop → What LikeSized Does → Help / FAQ**.
- The three capability calls to action are **Find My Matches → / Shop Smarter → / Get Inspired →**.
- Public Fit Twin, Following, Match, Fit Result, and privacy explanations must agree with the canonical product definitions and must not expose raw measurements.

# 14. Data-quality rule

**Controlled when possible. Normalize when necessary. Free text only when useful.**

Search/autocomplete must prefer canonical brands/products before creation. Identifiers/URLs are normalized for matching while useful human-facing original values are preserved.

# 15. Current V1 loop

1. Create/update a private versioned Fit Profile.
2. Receive garment-relevant current-person Match context and eventual Fit Twin designation.
3. Browse strong real-world historical garment evidence first.
4. When strong same-product evidence is insufficient, use Help Me Size It as a clearly labeled fallback estimate and inspect Other Fit Reports.
5. Log garments using canonical product identity, normalized size, Fit Result, optional controlled fit details/condition, and optional Shared photo; preserve immutable body state from that try-on.
6. Follow useful people into My Circle; LikeSized may designate the strongest followed body matches as Fit Twins.
7. Consume followed-person style/activity while keeping current-person matching separate from historical garment matching.
8. Save ordinary garment and Outfit inspiration in LikeLocker; use Wish Locker separately for products specifically wanted for purchase.
9. Create/share Outfits using existing Closet garments.
10. Gift Lists may later share owner-approved wanted products with confidence-gated recommended sizes without revealing raw measurements.

For recovery status, roadmap order, implementation completeness, deployment state, and exact next work, read `docs/AI_MASTER_LOG.md`.
