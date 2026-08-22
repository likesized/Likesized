# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, deployment ledger, and AI handoff. Repository/source-of-truth policy lives in `AI_REPOSITORY_RULES.md`. Current product/fit architecture lives in `docs/V1_PRODUCT_SPEC.md`. Current database behavior/privacy lives in `supabase/schema_contract.md`.

GitHub `likesized/Likesized` is the source of truth. Current files describe current truth; Git history preserves superseded attempts. Do not create patch/fixed/v2/temp/backup implementations, duplicate product systems, or a second master plan.

# CURRENT STATUS — 2026-08-22

## Canonical production baseline
- Production/canonical `main` currently includes the completed recovery + later owner-authorized PR #44, #45 and #46 work.
- Last owner-recorded production merge in this master: PR #46 → `main` commit `ec987f5a22575b54806341615309a150558467dc`.
- Vercel production deployment for PR #46: `dpl_FZ2MeLLXaecG8QYVoK284e1n4x2E` — **READY**.
- No PR #47 code is authorized for production.

## Primary active implementation line
- PR #47
- branch: `correct-grouped-menu-layout`
- purpose: Phase 6.5 owner-preview work plus the owner-priority final New Fit Report/community-catalog conversion.
- production merge/promotion: **NOT AUTHORIZED**.
- current community-catalog documentation/source work is **branch-only and unverified until the new head passes the complete canonical gate**.

## Active owner priority — FINAL NEW FIT REPORT + COMMUNITY CATALOG
The failed API/external catalog-import strategy is **SUPERSEDED / RETIRED**. Do not revive Channel3, Brave, UPCItemDB, a retail-search waterfall, or another external catalog provider without a new explicit owner decision and a full canonical reconciliation.

Current direction:
- LikeSized builds its Product catalog organically from the starter seed + member contributions.
- Barcode scanning searches **LikeSized only**.
- Manual entry uses canonical LikeSized Brand/Product suggestions.
- Every member answers the simple required observable garment questions; unknown optional catalog facts may be left blank.
- Later independent members see the accumulated Product information and contribute missing facts or field-level disagreements.
- Community agreement strengthens Product facts; disagreements become evidence/flags rather than silent overwrite.
- The owner-supplied 150 starter Brand/Model Products are part of launch preparation.
- After the final intake is accepted, build the canonical duplicate/alias system, conflict-resolution/admin system, multi-retailer-link behavior, and retail monetization layer described below.

Applied external-provider migration files remain immutable historical migration history where already applied. Migration `20260822073000_community_catalog_intake_and_seed.sql` is the branch migration that retires their active runtime objects and seeds the starter catalog. **Do not delete or rewrite applied historical migrations.**

# CANONICAL RECOVERY — COMPLETE / FEATURE FREEZE CLEARED

Owner approved canonical recovery on **2026-08-21** after a repository audit found severe source-of-truth drift. Recovery passed CI and the owner explicitly cleared the freeze and authorized PR #43 for production.

## Recovery baseline / preserved sources
- Recovery baseline at start: `main` `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`.
- Recovery branch: `canonical-recovery-2026-08-21`.
- PR #43 merged recovery to `main` as `426881a57d859be8bd9bf1382d358cc238a3d58e`; Vercel `dpl_Cmuonko9HpHrfGTaCZMYwwbHPLmF` reached READY.
- Preserved Fit Match audit: branch `fit-match-engine-audit`, PR #36, preserved head `fcf87fa1782f2ed704a4856c99487900b1445db5`.
- Preserved Phase 6.5 navigation decisions: `phase-6-5-1-navigation-ia`, head `b56f663199a9f7252c27cddfebfdae710230cb5e`.
- Preserved old Browse preview: `phase-6-5-2-browse-preview`, head `2d150bc3d7238a50d80cac98d6ddde92c310ae3b`.

## Recovery classification summary
- PR #36 matching/recommendation code, migrations, tests, provenance/condition work and valid owner decisions were **RECOVERED / ADAPTED**.
- stale normally-worn-size UI, old History notice, Save-as-Fit-Twin semantics, 1–5-star UI and active member stretch direction were **SUPERSEDED / EXCLUDED**.
- old Phase 6.5 placeholder Browse/Help/LikeLocker implementations were **OBSOLETE**; valid decisions were recovered as product truth, not copied as stale implementations.
- rejected synthetic Browse preview source was **OBSOLETE / NOT RECOVERED**.
- deferred responsive Closet work remains a later My Closet audit concern rather than a parallel implementation.
- salvage classification is complete. Branch deletion/cleanup is a separate hygiene action and must never discard unclassified work.

## Recovery verification checkpoints
- recovered recommendation/DB work passed CI #349/#351 during recovery.
- master/source classification passed CI #352.
- final technical recovery commit `4cf9ea2ddff4d8ed26821c3c9501ede2e976185a` passed CI #353: canonical integrity, typecheck, focused tests, production build, fresh migration replay and DB behavior/privacy tests.
- owner clearance passed CI #354/#355 before PR #43 promotion.

# CURRENT OWNER-LOCKED PRODUCT TRUTH

## Core promise
**See what fits people built like you.**

LikeSized prioritizes real-world garment evidence from people with garment-relevant body similarity. Algorithmic/fallback estimation is secondary when strong same-product network evidence is insufficient.

## Privacy and body-state boundaries — LOCKED
- Exact current and historical body measurements are private/owner-only.
- Current-person matching and historical-garment matching are distinct contexts and must never be blended.
- Current-person Match: viewer current body ↔ another member current body.
- Historical garment Match: viewer current body ↔ immutable body snapshot attached to that historical Fit Report/try-on.
- Fit Reports retain immutable `fit_profile_version_id`; later body changes never rewrite historical garment evidence.

## Following / Fit Twin / My Circle — LOCKED
- Following is member-controlled.
- Fit Twin is system-derived **within the followed set** from strong current-person Match quality.
- `follows` remains the one canonical social graph.
- initial Fit Twin threshold is configurable and currently 85% Overall Match.
- member actions are Follow / Following / Unfollow.
- follower count is Followers, never Fit Twins.
- My Circle contains followed people; Style Feed is driven by Following.
- `Save as Fit Twin`, `Saved Fit Twin`, `Remove Fit Twin`, and follower counts labeled Fit Twins are obsolete.

## Fit Result / star system — LOCKED
Physical Fit Result values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is no current V1 1–5-star Fit Rating UI. Legacy DB identifiers containing `fit_rating` may remain if they store the five physical outcomes, but they do not authorize stars.

## Deep Fit Match / recommendation rules — LOCKED
- Match % means garment-relevant body similarity, not probability the garment will fit.
- Body Match is symmetric.
- member-facing confidence is qualitative when shown: High / Good / Limited.
- missing optional measurements reduce refinement/confidence rather than inventing data.
- directional viewer-vs-wearer differences may privately influence size recommendation but never expose raw signed deltas.
- Preferred Fit is private by garment type: Fitted / Standard / Relaxed; missing preference means Standard.
- Preferred Fit changes recommendation translation only, not Match %, Fit Twin status, or historical body state.
- derived body proportions are private refinements only; total proportion influence max 8%, final Match movement max ±4 percentage points.
- Chest and Full Bust stay distinct; bust shaping activates only in explicitly relevant configured women's Product contexts.
- measurement age may mildly reduce confidence after reconfirmation cadence; it never rewrites the stored measurement or historical snapshot.
- shoes retain Foot Length dominant / Foot Width secondary behavior from the recovered engine.
- outerwear may use modestly wider layering tolerances; suit jackets/blazers remain more precise.
- stretch is not an active V1 member field/filter.
- Altered observations remain historical but are excluded from normal new/used recommendation evidence.

Recommendation evidence hierarchy:
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Current recovered engine weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

`Would Buy Again` does not influence size recommendation or recommendation confidence.

## Help Me Size It — LOCKED FALLBACK
1. Strong normal same-product Fit Matches exist → show normal evidence; no Help Me Size It.
2. Some useful evidence but limited confidence → useful reports first, smaller Help Me Size It fallback.
3. No meaningful close matches → Help Me Size It becomes the main fallback CTA.

Rules:
- reuse the canonical recommendation engine; never create a second sizing engine;
- clearly label estimates;
- show Other Fit Reports for the same canonical Product below the fallback estimate/explanation;
- if no responsible estimate exists, say so rather than invent a size;
- Notify belongs only to insufficient/no-useful-evidence states, not as a permanent matched-card action.

# COMMUNITY-BUILT PRODUCT CATALOG — OWNER LOCKED

## Catalog philosophy
**A clothing catalog built by the people who actually wear it.**

Recurring brand language:
**Tell us what you know. Leave what you don't. Together, we make LikeSized better.**

One member may contribute only the facts they know. A later independent member sees the existing Product record, fills missing optional facts, and can dispute an incorrect individual field. Independent agreement strengthens data; conflict is preserved and reviewed rather than one Fit Report silently replacing another.

## Starter catalog — LOCKED
The owner-supplied initial seed list contains 150 Products across Jeans/Denim, Chinos/Casual Pants, T-Shirts, Hoodies/Sweatshirts, Button-Down Shirts/Blouses, Jackets/Outerwear, Shorts, Dresses/Jumpsuits, Sneakers and Boots.

Seed rule:
- create/reuse canonical Brand;
- create/reuse Item/Model;
- set the known Garment Type;
- do **not** invent Color, Department, material, controlled attributes, UPC, Style/Article Number, description, retailer listing, price or photo.

Migration `20260822073000_community_catalog_intake_and_seed.sql` contains the branch seed. It is not called live/complete until migration replay + target-environment verification pass.

## Brand / Product normalization and future aliases
- canonical Brand/Product suggestions are always preferred before new identity creation.
- Brand/Product aliases will store reviewed spelling, punctuation and common typo variants behind the scenes.
- example: `Levis`, `Levi's`, capitalization/punctuation variants should resolve toward the canonical Brand once proven equivalent.
- hidden aliases are not duplicate public Brands.

## Duplicate matching — REQUIRED NEXT CATALOG ARCHITECTURE
Potential identity signals include:
- UPC/barcode;
- Brand + manufacturer Style/Article Number;
- canonical Brand/alias;
- normalized Item/Model;
- Garment Type;
- Department;
- the controlled garment-specific Product questions;
- retailer URLs/listings.

Rules:
- strong/hard identity may resolve automatically when safely proven;
- soft/fuzzy similarity creates a **Possible Duplicate** flag for admin review;
- never auto-merge two Products merely because their names look similar;
- merge keeps Fit Reports, identifiers, aliases, retailer listings, evidence and audit history;
- admin must be able to split Products that were incorrectly combined.

## Community Product evidence / conflict rules
- one Fit Report never wholesale-replaces another Fit Report.
- personal size, Fit Result, condition, Fit Photo and notes remain that member's historical Fit Report evidence.
- shared Product facts resolve **field by field**.
- one member's new Product claim begins provisional unless already verified/locked by stronger evidence.
- repeat submissions by the same member do not count as independent agreement.
- independent agreement strengthens/corroborates a value.
- competing values flag the Product/field for admin review.
- locked admin decisions cannot be overwritten by later member evidence; later conflict remains visible in evidence/history.
- when disagreement may actually indicate two different Products/variants, duplicate/split review takes precedence over treating it as a simple vote.

# FINAL NEW FIT REPORT — OWNER LOCKED ORDER

## Opening choice
The intake begins with **Scan barcode** immediately above **Enter item manually**.

### Scan barcode
- barcode searches LikeSized's own catalog only.
- no external retail/API lookup.
- known barcode → load the existing canonical Product.
- existing known Product facts are prefilled and read-only/locked by default.
- a member may click a field-level **Report an issue / This is incorrect** action to submit their alternative value as evidence.
- unknown barcode → explain LikeSized does not have information for that barcode yet and begin manual/community intake.
- the unknown scanned barcode is retained behind the scenes and saved with the Product/identifier evidence after successful Fit Report creation.
- never require the member to scan or type the same barcode twice.

### Manual entry
1. **Brand / Make** — required; typeahead searches LikeSized Brands/aliases first; create new only when no real match exists.
2. **Item / Model** — required; suggestions are narrowed to Products associated with that selected Brand; create provisional new Product only when no real match exists.

Selecting an existing Product loads the community Product information that already exists. Known values stay locked/read-only unless the member reports that specific field as incorrect. Missing values may be contributed where the form exposes them.

## Main required / desired Fit Report section
Order is locked:
1. **Brand / Make** — required.
2. **Item / Model** — required.
3. **Garment Type** — required.
4. **Garment-specific controlled questions** — up to four for the selected Garment Type. Every displayed question requires a physical selection. Default is blank/disabled **Select an answer**. **Not sure** is always the final option and is never preselected. Not sure records no positive Product claim.
5. **Color** — required controlled Color family.
6. **Size** — required structured size. Size system starts blank at **Choose your measurement system**; no Letter/M or other default.
7. **Overall Fit Result** — required: Too Small / Snug / Just Right / Relaxed / Too Big.
8. **Condition** — required: New / Used / Altered.
9. **Fit Photo** — optional but grouped with the main Fit Report because LikeSized wants it.
10. **Fit notes** — optional but grouped with the main Fit Report.

Then show a strong visual break:

**Want to help build the LikeSized catalog?**
*Everything below is optional. Add anything you know to help make this item's record better for the next person.*

Optional catalog enrichment order:
1. **Retail link**
2. **UPC / Barcode** — do not show as a duplicate input when already scanned; retain scanned value automatically.
3. **Manufacturer Style / Article Number**
4. **Material / Fabric Composition** — controlled add-material selection; support blends; percentages may be captured when explicitly known but are not required.
5. **Product photo** — clear image of the product itself, separate from Fit Photo.
6. **Department** — controlled.

Department choices:
- Women's
- Men's
- Unisex
- Girls'
- Boys'
- Kids / Unisex
- Baby / Toddler
- Not sure

Department defaults blank; Not sure is last.

Controlled Material/Fabric vocabulary starts with:
- Cotton
- Organic Cotton
- Polyester
- Recycled Polyester
- Nylon
- Recycled Nylon
- Wool
- Merino Wool
- Cashmere
- Linen
- Rayon
- Viscose
- Modal
- Lyocell/Tencel
- Elastane/Spandex
- Acrylic
- Silk
- Leather
- Suede
- Synthetic Leather
- Other
- Not sure

Material is optional Product enrichment only; it does not affect Match/recommendation and is not automatically a Browse filter. Stretch remains out of V1.

## Intake guidance by Product completeness
- **New Product:** “Don't see it yet? Add it. You might be the first person helping build this product's LikeSized record.”
- **Partial Product:** “Built by the community. Fill in anything you know that's still missing.”
- **Well-completed Product:** show the existing community-built facts; member focuses on personal Fit Report and reports a specific incorrect field only when necessary.
- recurring supporting copy: **“Every Fit Report makes LikeSized smarter.”**

Do not use the obsolete generic embedded **Are the saved item details correct? Yes / change / Not sure** box. Members should see the actual known Product facts and dispute individual fields where needed.

# APPROVED CONTROLLED GARMENT QUESTIONS

Color remains separate and required for every Type. Displayed questions require a selection, begin blank, and place Not sure last.

## Tops
- **T-shirt:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Neckline (Crew / V-neck / Scoop / Square / Turtleneck).
- **Polo:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long); Opening (Button Placket / Quarter-zip / Full-zip).
- **Dress Shirt:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Work Shirt:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Casual Button-down:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Flannel Shirt:** Intended Fit (Slim / Regular / Oversized); Sleeve (Short / 3/4 / Long).
- **Blouse:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Sleeveless / Short / 3/4 / Long); Neckline (Crew / V-neck / Scoop / Square / Turtleneck / Cowl / Boat Neck).
- **Tank Top:** Intended Fit (Fitted / Regular / Loose); Cropped (Yes / No); Neckline (Crew / V-neck / Scoop / Square).
- **Camisole:** Intended Fit (Fitted / Regular / Loose); Cropped (Yes / No); Neckline (V-neck / Scoop / Square).
- **Strapless Top:** Shape (Fitted / Flowy); Cropped (Yes / No).
- **Halter Top:** Shape (Fitted / Flowy); Cropped (Yes / No); Neckline (High / Low).
- **Sweater:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Neck/Opening (Crew / V-neck / Turtleneck / Quarter-zip / Full-zip).
- **Cardigan:** Intended Fit (Fitted / Regular / Oversized); Length (Cropped / Regular / Long); Sleeve (Short / 3/4 / Long); Closure (Open-front / Button / Zip / Tie).
- **Sweatshirt:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Closure (Pullover / Quarter-zip / Full-zip).
- **Hoodie:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Closure (Pullover / Quarter-zip / Full-zip).

## Bottoms
- **Jeans:** Cut (Skinny / Slim / Straight / Relaxed / Wide / Bootcut / Flare); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long).
- **Chinos:** Cut (Slim / Tapered / Straight / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long).
- **Dress Pants:** Cut (Slim / Straight / Wide / Flare); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long); Pleated (Yes / No).
- **Trousers:** Cut (Slim / Straight / Wide / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long); Pleated (Yes / No).
- **Cargo Pants:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long).
- **Shorts:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Short / Mid / Long).
- **Joggers:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Cropped / Full).
- **Sweatpants:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Leg Opening (Cuffed / Open).
- **Leggings:** Rise (Low / Mid / High); Length (Capri / 7/8 / Full); Leg Shape (Fitted / Bootcut / Flare).
- **Skirt:** Shape (Straight / A-line / Pencil / Full / Pleated / Wrap); Rise (Low / Mid / High); Length (Mini / Knee / Midi / Maxi); Skort (Yes / No).

## Dresses & One-Pieces
- **Dress:** Shape (Fitted / Flowy); Length (Mini / Knee / Midi / Maxi); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low), hidden when Strapless makes it inapplicable.
- **Jumpsuit:** Shape (Fitted / Flowy); Leg Shape (Slim / Straight / Wide / Flare); Length (Cropped / Full); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long).
- **Romper:** Shape (Fitted / Flowy); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low).
- **Bodysuit:** Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low); Bottom Coverage (Thong / Brief).
- **Overalls:** Intended Fit (Slim / Regular / Relaxed); Leg Shape (Straight / Wide / Flare); Length (Shorts / Cropped / Full).
- **Coveralls:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long); Length (Cropped / Full).

## Outerwear
- **Suit Jacket:** Intended Fit (Slim / Regular / Relaxed); Length (Cropped / Regular / Long); Front (Single-breasted / Double-breasted).
- **Blazer:** Intended Fit (Slim / Regular / Oversized); Length (Cropped / Regular / Long); Front (Single-breasted / Double-breasted).
- **Jacket / Coat:** Style (Denim / Leather / Bomber / Puffer / Rain / Utility / Trench / Peacoat / Overcoat); Intended Fit (Slim / Regular / Oversized); Length (Cropped / Waist / Hip / Mid-thigh / Knee / Long); Hooded (Yes / No).
- **Vest:** Style (Puffer / Tailored / Utility); Intended Fit (Slim / Regular / Oversized); Length (Cropped / Regular / Long); Hooded (Yes / No).
- **Wrap / Shawl:** Length (Short / Regular / Long); Closure (Open / Fastened / Belted).

## Swimwear
- **One-piece Swimsuit:** Top (Strapless / Halter / Straps); Neckline (High / Low); Leg Cut (Low / Regular / High); Coverage (Minimal / Moderate / Full); hide invalid Neckline when Strapless.
- **Bikini Top:** Style (Bandeau / Halter / Triangle / Bra-style); Support (Light / Medium / High); Coverage (Minimal / Moderate / Full); Underwire (Yes / No).
- **Bikini Bottom:** Rise (Low / Mid / High); Coverage (Minimal / Moderate / Full); Leg Cut (Low / Regular / High); Skirted (Yes / No).
- **Tankini Top:** Intended Fit (Fitted / Flowy); Length (Cropped / Regular / Long); Top (Strapless / Halter / Straps); Support (Light / Medium / High).
- **Swim Trunks:** Intended Fit (Slim / Regular / Relaxed); Length (Short / Mid / Long); Liner (Yes / No).
- **Board Shorts:** Intended Fit (Slim / Regular / Relaxed); Length (Mid / Long); Closure (Pull-on / Drawstring / Fly).

## Intimates
- **Bra:** Style (T-shirt / Balconette / Plunge / Push-up / Strapless / Minimizer); Underwire (Yes / No); Padding (None / Light / Padded); Coverage (Minimal / Moderate / Full).
- **Bralette:** Style (Triangle / Standard / Longline); Padding (Yes / No); Closure (Pull-on / Hook); Coverage (Minimal / Moderate / Full).
- **Sports Bra:** Support (Light / Medium / High); Padding (Yes / No); Closure (Pull-on / Hook / Zip); Coverage (Minimal / Moderate / Full).
- **Underwear:** Cut (Brief / Bikini / Hipster / Boyshort / Thong / Boxer / Boxer Brief / Trunk); Rise (Low / Mid / High); Coverage (Minimal / Moderate / Full).
- **Shapewear:** Form (Brief / Shorts / Cami / Bodysuit); Target Area (Waist / Hips / Thighs / Full Body); Compression (Light / Medium / Firm).

## Shoes
- **Sneakers:** Height (Low / Mid / High); Use (Casual / Running / Training / Court); Closure (Lace / Slip-on / Hook-and-loop).
- **Boots:** Style (Casual / Work / Hiking / Combat / Cowboy / Dress / Rain / Snow); Height (Ankle / Mid-calf / Knee / Over-the-knee); Heel (Flat / Low / Mid / High); Closure (Pull-on / Zip / Lace).
- **Dress Shoes:** Style (Oxford / Derby / Monk-strap); Toe (Round / Pointed / Square).
- **Loafers:** Style (Penny / Tassel / Bit); Toe (Round / Pointed / Square).
- **Flats:** Style (Ballet / Mary Jane / Slingback); Toe (Round / Pointed / Square).
- **Heels:** Heel Height (Low / Mid / High); Heel Style (Block / Stiletto / Wedge / Kitten); Toe (Round / Pointed / Square / Open).
- **Sandals:** Style (Flat / Heeled / Platform); Closure (Slip-on / Ankle Strap / Back Strap).
- **Slides:** Sole (Flat / Platform).
- **Clogs:** Heel (Flat / Low / Mid / High); Back (Open / Strap / Closed).

Additional taxonomy locks:
- Activewear is not a garment Type; use the actual physical Type.
- member-facing umbrella Swimwear, Bras / Intimate Apparel and Shoes are replaced by the specific Types above.
- Vest, Overalls and Coveralls are approved Types.
- Work Pants is removed as a member-facing Type; Cargo Pants replaces it.
- Sweatpants remains separate from Joggers.
- Jacket and Coat are combined as **Jacket / Coat**; Suit Jacket and Blazer remain separate.
- `garment_types.intake_active` controls member-facing availability without breaking legacy matching compatibility keys.

# RETAIL LINKS + SHOPPING + MONETIZATION — OWNER LOCKED ROADMAP

## Multiple retailer listings
- Retail links belong to canonical Product/listing data, not individual Fit Reports.
- one Product may accumulate multiple retailer listings.
- a new valid retailer link appends; it does not overwrite another retailer/version.
- normalize URLs to avoid repeated identical listings.
- retain provenance and allow dead links to be marked inactive later without erasing history.
- the same retailer URL appearing on apparently different Products is a strong duplicate/conflict signal.

## Conditional shopping UI
When a valid retail link exists, every relevant garment image/surface should show the approved three-action set:
**Like + Wishlist + Shopping Cart/Shop**.

If no valid retail link exists, the Shopping Cart/Shop action disappears entirely.

The same rule applies to:
- Shop Here / equivalent CTA under Product/Fit Report detail;
- Wish Locker;
- Gift Lists;
- other approved shopping surfaces.

No dead/disabled fake Shop button.

## Skimlinks / affiliate monetization
- Add **Skimlinks or an owner-approved equivalent affiliate layer** after canonical retailer-link behavior is stable.
- affiliate monetization wraps eligible outbound retailer traffic; it never becomes Product identity.
- preserve the original canonical retailer URL/listing behind the affiliate/tracking layer.
- commission must never affect Fit Match, size recommendation, search relevance, or product ranking.
- before production implementation, audit current Skimlinks integration/disclosure/cookie/privacy/merchant eligibility requirements rather than relying on stale assumptions.

# ADMIN / FLAGS / MODERATION — OWNER LOCKED

Admin must have authorized tabs/queues for at least:
1. **Conflicting Product Facts**
2. **Possible Duplicates**
3. **Reported / Spam Content**
4. **Review History / Audit**

## Conflicting Product Facts
Admin can:
- inspect actual competing values;
- see distinct supporting members/evidence statuses;
- inspect identifiers, Product context, retailer listings and relevant evidence;
- choose/override the correct value/description;
- verify and permanently lock the field/description;
- reopen a lock only through an authorized audited action.

## Possible Duplicates
Admin can:
- compare suspected Brands/Products side by side;
- inspect similarity/identity signals;
- merge proven duplicates while preserving aliases, identifiers, retailer listings, Product evidence, Fit Reports and history;
- dismiss false-positive duplicate flags;
- **split** an incorrectly combined Product and move the appropriate identifiers/listings/evidence/Fit Reports without silent loss.

## Reported / Spam Content
Admin can review/remove:
- inappropriate Fit Photos;
- inappropriate Product Photos;
- inappropriate Outfit content;
- spam intakes;
- spam Fit Reports.

Removal should remove member-visible/storage content where applicable while retaining accountable moderation history. Member flags never directly rewrite or permanently delete canonical data without the authorized moderation path.

# EXPLORE / BROWSE — CURRENT OWNER-LOCKED DESIGN

- canonical route `/explore`; `/browse` is compatibility redirect only.
- Garments | Outfits.
- My Fit Matches | All for each content type.
- fresh Explore defaults to My Fit Matches.
- Garments My Fit Matches: 75%+ garment-specific historical Match.
- Outfits My Fit Matches: 75%+ creator current Overall Match.
- tiers: 90–99 → 85–89 → 80–84 → 75–79; exhaust stronger tiers first.
- within tier: Match % → unseen/freshness → recency → likes/popularity.
- carousel 8; initial results 24; Keep Browsing +24.
- strict Category → Type → that Type's controlled questions → Brand → Item name → Color filters.
- no silent filter relaxation.
- Search spans Garments/Outfits/People across full available inventory, not only current My Fit Matches.
- garment search deduplicates to one canonical Product result rather than one result per wearer/Fit Report.
- query relevance is primary in Search; catalog trust is a tie-breaker among similarly relevant results.
- mobile live suggestions use compact rows.
- product/image tap opens Garment Quick Detail; wearer tap opens wearer context; Like/Wishlist/Shop/Notify are separate targets.
- image fallback must never leave blank areas.
- no stars.

Catalog trust order for ordinary Browse:
admin-locked/verified → community-confirmed/corroborated → provisional → unresolved/conflicted lower among otherwise comparable results.

Provisional non-rejected controlled Product facts may still participate in applicable filters/Similar Garments. Material storage alone does not make Material an approved filter.

# LIKELOCKER / WISH LOCKER / GIFT LISTS — OWNER LOCKED

LikeLocker is private saved fashion content, not a people graph.

LikeLocker tabs:
- Garments — ordinary Product likes
- Outfits — Outfit likes
- Wish Locker — Product purchase intent

LikeLocker provenance may remember that a Product was saved from a particular Shared Fit observation while privacy still removes inaccessible source evidence if that observation becomes private/deleted.

LikeSized Gift Lists remain roadmap-locked after Product/retailer/save/recommendation foundations:
- owner-approved wanted Products;
- confidence-gated recommended size from canonical sizing engine;
- raw measurements never shared;
- sharing initiated/controlled by the list owner;
- if confidence is insufficient, say so rather than invent a size;
- eligible retail/affiliate links may be included, but commerce never influences fit recommendation.

# OUTFITS / STYLE FEED — V1 RETAINED

- Outfits remain in V1.
- one Outfit is composed from existing owned Closet garments; do not duplicate Product/fit/taxonomy data.
- owned Outfits live in My Closet.
- other-member Outfit discovery lives in Explore.
- followed-person Outfit activity lives in Style Feed.
- Outfit likes contribute to Style Likes; garment/product likes do not.
- Fit Twin designation does not create a second social subscription.
- no V1 DMs, Stories, Reels/video feed, creator payouts or sponsorship marketplace unless separately approved.

# PUBLIC HOMEPAGE / HELP / FAQ — CURRENT REQUIRED MEANING

Public homepage remains useful logged out and keeps FAQ inline.

Community-catalog FAQ/copy must include the substance of:

**Where does LikeSized get its product information?**
LikeSized is building a community-powered clothing catalog. Members contribute what they know about clothes they actually own. One person may know the model, another the cut, another the material or other Product details. As more independent people contribute, the Product record gets better.

**What if I don't know all the details about my item?**
Tell LikeSized what you confidently know. Required observable garment questions still require an explicit choice or Not sure. Optional catalog-enrichment details can be left blank. Later members can add what they know.

**How do you know the information is accurate?**
LikeSized does not treat one person's answer as unquestionable fact. Independent agreement strengthens Product facts. Disagreement is preserved/flagged instead of silently replacing another answer; admin can resolve and lock known facts.

Recurring marketing/support language:
- **A clothing catalog built by the people who actually wear it.**
- **Powered by people who wear it.**
- **Every Fit Report makes LikeSized smarter.**
- **Retailers tell you how clothes are supposed to fit. LikeSized is built from how they actually fit.**

Help/FAQ before Beta must also explain measurement privacy, Match %, current-person vs historical garment Match, People My Size, Following vs Fit Twin, Private vs Shared Closet, photo behavior, Fit Result/no stars, Help Me Size It, LikeLocker/Wish Locker, Outfits/Style Feed, retailer links/shopping, different sizes among matched people, immutable historical evidence, community-catalog contributions/conflicts, and Gift Lists if implemented.

# PHASE 6.5 — V1 PRODUCT SURFACE + NAVIGATION AUDIT

The Phase 6.5 page-by-page audit remains the master roadmap. **The community-catalog/New Fit Report priority is an insertion into this roadmap, not a replacement master plan.**

## CURRENT OWNER-PRIORITY INSERT — finish before returning to the remaining audit
### 6.5 CURRENT INSERT A — Final New Fit Report/community intake
- finish the final intake flow exactly as locked above;
- remove active external/API import source/routes/config/test assumptions;
- preserve applied historical import migrations but retire their runtime objects with the later canonical migration;
- ensure barcode searches LikeSized only and unknown scanned barcode persists automatically;
- Brand/Make → Item/Model canonical suggestions;
- field-level issue reporting on prefilled Product facts;
- required observable question behavior with blank default + Not sure last;
- exact Fit Report ordering + optional community section;
- controlled Material/Department;
- Product Photo pipeline/moderation boundary;
- new/partial/complete community guidance;
- full desktop/mobile owner Preview review.

### 6.5 CURRENT INSERT B — Starter catalog
- fresh-replay verify all 150 starter Products are seeded once/canonically;
- Brand + Item/Model + Garment Type only;
- no invented metadata;
- verify seed is idempotent/dedupe-safe.

### 6.5 CURRENT INSERT C — Community catalog identity/conflict foundation
After intake is owner-accepted:
- implement hidden Brand/Product aliases for reviewed spelling/punctuation/common typos;
- implement multi-signal possible-duplicate detection;
- hard vs soft identity rules;
- admin Possible Duplicates queue;
- transactional merge;
- transactional split;
- field-level conflict/consensus behavior;
- admin lock/override/reopen behavior;
- spam intake/Fit Report + Product Photo moderation coverage;
- audit history.

### 6.5 CURRENT INSERT D — Retail listing aggregation + commerce
- multiple retailer listings per canonical Product; append/dedupe, never overwrite valid alternatives;
- conditional Shop action everywhere a valid listing exists;
- no Shop action when no valid listing exists;
- implement/audit Skimlinks or approved equivalent affiliate layer;
- affiliate disclosure/privacy/compliance review;
- commission never affects fit/search/ranking.

After the current insert is complete/accepted, continue the remaining Phase 6.5 audit without dropping any page below.

## 6.5.1 Navigation / information architecture audit — IMPLEMENTED/VERIFY THROUGH REMAINING AUDIT
- LikeSized logo = Home.
- one fixed notification bell + one Menu control on desktop/mobile.
- Discover: Explore / People My Size / My Circle / LikeLocker.
- My Closet: My Closet / New Fit Report / New Outfit.
- Account: Fit Profile / Settings / Help / FAQ / Sign Out.
- no obsolete Fit-Twin-owned social navigation.

## 6.5.2 Explore / Discover hub — IMPLEMENTATION + OWNER REVIEW STILL PART OF AUDIT
Audit/finalize:
- Garments/Outfits;
- My Fit Matches/All;
- ranking/tiers/batches;
- strict dynamic taxonomy filters;
- search behavior;
- card actions including conditional Shop;
- mobile mini-browser;
- image fallbacks;
- Help Me Size It/Notify fallback states;
- real canonical data only; no synthetic parallel implementation in production source.

## Deferred Phase 6.4 desktop Fit Profile verification — MUST OCCUR AFTER CURRENT EXPLORE OWNER REVIEW
Phase 6.4 remains technically open only for this intentionally deferred desktop verification:
- desktop Fit Profile layout;
- edit/review/confirm/save;
- Added/Changed/Removed presentation;
- revisit treatment.

Do not mark Phase 6.4 complete until owner desktop verification is done.

## 6.5.3 My Circle / Following + Fit Twins social hub
Audit/finalize:
- Following user-controlled;
- Fit Twin system-derived within followed set;
- one `follows` graph;
- Follow/Following/Unfollow;
- safe Match context without measurements;
- Followers public count;
- Fit Twin badges/filtering only where useful;
- Style Feed subscription driven by Following;
- privacy boundaries.

## 6.5.4 Preserve V1 Outfits while underlying surfaces are audited
- preserve existing canonical Outfit tables/storage/likes/Closet links;
- no parallel Outfit system;
- Outfit classification inherited from attached garments;
- maintain privacy.

## 6.5.5 My Closet audit/redesign
Audit/finalize:
- owned garments + outfits in one useful library;
- All / Garments / Outfits filters;
- useful cards/grid;
- sharing controls/status;
- Update Fit / Tried It Again;
- Fit History only when multiple observations exist;
- preview of how Shared items appear to other members;
- mobile/desktop responsiveness.

## 6.5.6 New Fit Report / garment-post usability gate
The owner-priority insert above is the current implementation of this hard checkpoint. Do not mark 6.5.6 complete until the owner confirms intake is fast/clear enough and canonical DB/source/tests agree.

## 6.5.7 Fit Result / satisfaction-signal audit
- Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big;
- no 1–5-star UI anywhere;
- legacy DB names/history remain compatibility only;
- do not invent a replacement subjective rating without owner approval.

## 6.5.8 Member Profile + Shared Closet
Audit/finalize:
- avatar/name/bio as approved;
- Follow/Following;
- safe Overall/Tops/Bottoms current-person Match context;
- Shared Closet as main other-member garment evidence surface;
- member Outfit presentation;
- search/filter behavior;
- privacy.

## 6.5.9 Shared Closet garment cards
Show useful evidence without raw measurements:
- image;
- Brand + Item/Model;
- size worn;
- historical Match % for that try-on;
- Fit Result;
- useful note/context;
- conditional retail Shop action if available;
- clear wearer/current-person-vs-historical-match semantics.

## 6.5.10 Garment image fallback hierarchy
1. member's own Fit Photo when supplied;
2. member-contributed Product/garment-only photo when appropriate;
3. canonical Product/variant image;
4. garment-type LikeSized fallback.

Never use another member's personal Fit Photo as a generic Product image. Blank image areas are invalid.

## 6.5.11 Garment Detail interaction
Audit/finalize:
- image/gallery and source context;
- Brand/Item/Model;
- size + Fit Result evidence;
- historical Match context;
- Product/community facts;
- Help Me Size It fallback when appropriate;
- Other Fit Reports;
- People Like You Who Wore This;
- retail listings/conditional Shop;
- Like/Wishlist actions;
- no stars.

## 6.5.12 People Like You Who Wore This
For one canonical Product:
- top 3–5 unique Shared wearers;
- rank by viewer's historical Match to each immutable try-on snapshot;
- one member should not occupy several top slots solely from repeated observations;
- show Match, size, Fit Result and useful context;
- never expose raw measurements.

## 6.5.13 Canonical Product page audit
Product becomes the collective evidence destination for the garment:
- one canonical identity;
- Brand + Item/Model;
- controlled community Product facts + trust/conflict state as appropriate;
- Product image(s);
- available colors/variants where trustworthy;
- same-product Fit Reports/wearers;
- Help Me Size It fallback;
- Other Fit Reports;
- Like/Wishlist/Shop actions;
- multiple retailer listings;
- See All Fits;
- admin conflict/duplicate integration behind authorized surfaces.

## 6.5.14 Retail links / commerce
The new owner direction expands this audit:
- one-to-many retailer listings;
- no overwrite of alternate valid links;
- hide shopping section/action when no valid link exists;
- no fake/stale price claims without reliable current-price source;
- Skimlinks/affiliate monetization layer;
- disclosure/privacy/compliance;
- commission has zero influence on fit/search/ranking.

## 6.5.15 LikeLocker / saved fashion architecture
- LikeLocker = saved fashion, not people;
- ordinary Product Like vs Wish Locker purchase intent stay distinct;
- Outfit saves/likes remain distinct;
- no competing Favorites destination;
- eligible Shop action conditional on retailer listing.

## 6.5.16 LikeLocker provenance
- retain optional source observation/provenance such as Saved from a specific fit;
- if source Shared evidence becomes private/deleted, inaccessible evidence disappears immediately;
- the Product save itself may remain;
- no duplicate save graph.

## 6.5.17 LikeLocker view
Useful Garments / Outfits / Wish Locker presentation:
- image;
- Brand/Item/Model;
- useful fit context;
- source provenance where still accessible;
- remove/save controls;
- conditional Shop where listing exists.

## 6.5.17A LikeSized Gift Lists
Roadmap-locked after Product/retailer/LikeLocker/recommendation foundations:
- owner-approved wanted Products;
- confidence-gated recommended size;
- owner-controlled sharing to members/non-members as later audited;
- no raw measurements;
- insufficient data → no invented recommendation;
- eligible affiliate retail links allowed but never affect sizing/ranking;
- sharing/revoke/privacy audit before Beta.

## 6.5.18 V1 Outfits social-layer audit
Audit/finalize:
- one Outfit photo;
- 1–6 unique owned Closet garments with fit evidence unless owner later changes the limit;
- caption;
- likes;
- LikeLocker save;
- Outfit Type + Season controlled labels;
- garment tags with Product/size/Fit Result/viewer-relevant historical Match context;
- tag → canonical garment/Product detail;
- current-person vs historical-garment Match contexts remain separate;
- profile/Browse/Style Feed placement;
- privacy when tagged garment changes visibility/deletes;
- Followers + Style Likes as social proof without overriding fit relevance.

## 6.5.19 Style Feed audit
- followed-person Shared garment activity;
- fit updates/retries;
- Outfit posts;
- click through to real evidence;
- Fit Twin may be context, not subscription source;
- Outfit-only mute does not unfollow or hide garment evidence.

## 6.5.20 Explore/Browse Search audit
- canonical Brand/Product/model/identifier search;
- Garments/Outfits/People across full inventory;
- one canonical Product result, not per-wearer duplicates;
- compact mobile suggestions;
- member discovery distinct from People My Size algorithmic matching;
- Product results support Like/Wishlist/conditional Shop;
- Help Me Size It fallback on exact Product when strong matches are absent;
- member results use Follow/Following + derived Fit Twin badge.

## 6.5.21 Help / FAQ audit
Must explain at minimum:
- measurement privacy;
- Match %;
- current-person vs historical-garment Match;
- People My Size;
- Following vs Fit Twin;
- Private vs Shared Closet;
- Fit Photo/Product Photo behavior;
- Fit Result/no stars;
- Help Me Size It fallback;
- LikeLocker/Wish Locker;
- Outfits/Style Feed;
- community-built catalog and field-level conflict handling;
- retail links/affiliate shopping disclosure where required;
- why highly matched people can choose different sizes;
- immutable historical try-on body state;
- Gift Lists if implemented.

## 6.5.22 Remaining product surfaces + admin/moderation audit
Audit every remaining V1 surface:
- Fit Profile;
- Settings;
- Notifications;
- homepage;
- login/signup/auth confirmation;
- forgot/reset password;
- logged-out states;
- empty states;
- error states;
- profile/account editing;
- avatar upload/replace/remove/fallback;
- desktop/mobile layouts;
- admin authorization/navigation;
- Conflicting Product Facts queue;
- Possible Duplicates queue;
- merge/split controls;
- permanent field/description lock + reopen;
- inappropriate Fit/Product/Outfit photo removal;
- spam intake/Fit Report removal;
- audit history.

## 6.5.23 Terminology cleanup
Current primary vocabulary:
- Explore
- People My Size
- My Circle
- Following / Followers
- Fit Twin / Fit Twins only as system-derived match designation
- Style Feed
- My Closet
- LikeLocker
- Wish Locker
- Fit Profile
- Fit Result
- Help Me Size It
- Other Fit Reports
- Outfit
- New Fit Report
- LikeSized Gift Lists

Remove stale/competing terms, old Save-as-Fit-Twin language, Favorites destinations, star-rating language, and external-import jargon from current product source/docs.

## 6.5.24 Full Preview verification before Phase 7
Phase 6.5 is not complete until source + migrations + canonical docs + verification + owner review agree.

Verify at minimum:
- desktop/mobile;
- multiple users;
- Private/Shared boundaries;
- navigation + notification bell;
- Explore Garments/Outfits, My Fit Matches/All, filters/search/ranking/batches;
- mobile mini-browser interaction safety;
- separate Product/wearer/Like/Wishlist/Shop/Notify targets;
- image fallback;
- 75% My Fit Matches and separate 85% Fit Alert semantics;
- Help Me Size It fallback only where appropriate;
- recommendation evidence hierarchy;
- taxonomy;
- Brand/Item autocomplete;
- final barcode/manual New Fit Report;
- starter catalog seed;
- controlled questions blank default + Not sure last;
- color/size/Fit Result/condition ordering;
- Fit Photo/Fit notes + optional enrichment break;
- community evidence/corroboration/conflict;
- duplicate alias/candidate/merge/split behavior;
- locked admin fields/descriptions;
- Product/Department/material/photo evidence;
- immutable historical body links;
- no stars;
- Product Likes / Wish Locker / Outfit Likes;
- Following/Fit Twin separation;
- Outfits + Style Feed;
- same-product top matched wearers;
- multiple retailer listings;
- conditional Shop behavior;
- Skimlinks/affiliate behavior and disclosure when implemented;
- Gift Lists if implemented;
- content/spam moderation;
- no external catalog provider in active intake;
- no parallel/legacy current implementation;
- branch hygiene/salvage classification;
- canonical integrity;
- TypeScript;
- focused application tests;
- production build;
- complete fresh migration replay;
- database behavior/privacy/security tests.

# PHASE 7 — V1 BETA END-TO-END VERIFICATION
Begin only after Phase 6.5 is complete.

Representative Beta verification:
- signup/login/auth/recovery;
- Fit Profile;
- Explore;
- People My Size;
- Following/My Circle/Fit Twin designation;
- Shared Closet;
- canonical Product/Garment Detail;
- Help Me Size It;
- LikeLocker/Wish Locker;
- retailer shopping/affiliate behavior;
- New Fit Report barcode/manual/community contribution;
- later Fit History/Update Fit;
- Outfits;
- Style Feed;
- privacy boundaries;
- recommendations;
- no star UI;
- Gift Lists if implemented;
- duplicate/conflict/admin moderation;
- mobile UX;
- CI/migration/privacy/security verification.

# BRANCH / SOURCE HYGIENE — REQUIRED BEFORE PRODUCTION
- PR #47 remains the sole primary active implementation line unless the owner explicitly authorizes otherwise.
- compare/reconcile PR #47 with `main` before promotion.
- no new retry/fixed/v2 branch as a substitute for canonical correction.
- old recovery/deferred branches may be deleted only after the salvage ledger proves nothing unique is being discarded and cleanup is authorized/available.
- classify obsolete retry/verification branches and remove them when safe; do not describe them as active product futures.
- production promotion requires explicit owner authorization after full verification.

# COMPLETED PRODUCTION WORK TO PRESERVE

## Phase 6.4 mobile Fit Profile / navigation
Preserve:
- mobile Fit Profile save/load/edit/revisit/review/confirm behavior;
- Added / Changed / Removed review state;
- compact revisit hero;
- two-column mobile Review Changes + scroll-to-top;
- username initial-setup-only in Fit Profile; later username changes in Settings;
- previous username reservation for 30 days;
- removal of anatomical plausibility hard stops while retaining valid-positive technical validation;
- normally-worn-size UI removed while historical records remain behind scenes;
- owner-approved measurement wording/help;
- owner-verified combined `public/measurement-guides/crotch-guide.png` for both crotch measurements; do not alter/recompress/redraw/substitute;
- Mobile Menu close on navigation/outside click/tap.

Desktop Fit Profile verification remains intentionally unfinished until its roadmap point above.

## Outfit photo pipeline — COMPLETE / DEPLOYED / VERIFIED
- PR #44 merged as `04319c76469819c6178eeb31a3e3f3c987e7694c` after owner authorization.
- new Outfit photo processing creates optimized WebP display/feed assets; original is not stored.
- Vercel `dpl_GCRvJjDHgTCDPbSAsN357QN1CHjv` reached READY.

## Public homepage content — DEPLOYED / FAQ REVIEW EVOLVING
- PR #45 merged as `0961ca6635f790debdbcf7df0b194247caa3eaf4` after owner authorization.
- The Loop → What LikeSized Does → FAQ ordering preserved.
- Get Inspired CTA preserved.
- the community-catalog FAQ/copy in this master supersedes older sourcing wording and must be reconciled into the public/help surfaces during current work/6.5.21.

## Live schema + grouped navigation repair — COMPLETE / DEPLOYED / VERIFIED
- 13 recovered migrations were applied live in locked order after the prior missing-schema incident.
- PR #46 merged as `ec987f5a22575b54806341615309a150558467dc`.
- Vercel `dpl_FZ2MeLLXaecG8QYVoK284e1n4x2E` reached READY.
- grouped one-Menu + fixed-bell navigation and My Circle destination are preserved.

# PR #47 VERIFIED HISTORICAL CHECKPOINTS — PRESERVATION EVIDENCE ONLY
Earlier PR #47 heads passed full CI/Preview gates, including:
- `95e8e34f0e9eb7194f4b3d784c5a3887c5bfc1aa` → CI #381, preview `dpl_EKLzUtVFHDerEf7ywJ8kfoGUN7au` READY.
- `4c17951e8848e9106bf01c15a84aea376f09228e` → CI #385, preview `dpl_5kfBk3bMsfpxR845sKKUNXwB2b7x` READY.
- prior lookup work head `bf36b673c071f9b93304401b0df7da68bfb2b87d` → CI #396 and preview READY.

Those historical green runs do **not** prove the current community-catalog head passes. The strategy changed afterward. Run the complete gate again before claiming current PR #47 is green.

# CURRENT BRANCH COMMUNITY-CATALOG MIGRATION WORK — UNVERIFIED UNTIL NEW GATE
Branch migrations currently include:
- historical external-provider migrations that remain immutable ordered history;
- `20260822073000_community_catalog_intake_and_seed.sql` — retires active external-provider objects, adds controlled Department/material/Product Photo community foundation, and seeds the 150 starter Products;
- `20260822073100_add_community_identity_evidence.sql` — adds field-level Brand/Item/Style disagreement evidence without silent identity rewrite.

These files are branch implementation, not production/live truth until verified and explicitly promoted. Duplicate alias/candidate/merge/split/admin coverage is still a required next implementation and must not be falsely marked complete.

# EXACT NEXT ACTION
1. Finish canonical documentation reconciliation to this community-built catalog truth.
2. Audit the current PR #47 code against the final New Fit Report specification and remove remaining active external-import remnants without rewriting historical migrations.
3. Fix any intake/server/data mismatches, including barcode persistence, canonical Brand/Item suggestions, field-level issue handling, required question selection, size default, optional enrichment, Product Photo, controlled Material/Department, and new/partial/complete guidance.
4. Verify the 150-item seed and community migrations by full fresh replay.
5. Run canonical integrity → typecheck → focused application tests → production build → fresh Supabase migration replay → all DB privacy/behavior tests.
6. Produce the protected PR #47 Preview and perform owner desktop/mobile intake review.
7. Only after the intake is accepted, implement the duplicate/alias + conflict/admin + multi-retailer/Skimlinks work in the current canonical line, then resume the full Phase 6.5 page-by-page audit above.
8. Do not merge to `main` or promote production without explicit owner authorization.
