# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current product/fit architecture. Roadmap order, implementation status, deployment history, audit status, and exact next action live in `docs/AI_MASTER_LOG.md`. Database behavior and implementation debt live in `supabase/schema_contract.md`.

Current-state wording here must match owner-approved product meaning and current production behavior. Superseded behavior belongs in Git history, not as competing current truth.

# 1. Privacy and body-state architecture — LOCKED

- `fit_profiles` is a small profile shell; raw measurements live in normalized owner-private measurement structures.
- Immutable Fit Profile versions preserve historical body snapshots.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot and is never rewritten when the member later changes measurements.
- A Fit Report may also maintain `match_fit_profile_version_id` as the active matching/body-state evidence used to safely enrich or roll an existing report without rewriting the original historical snapshot.
- Raw current or historical body measurements and private size references are never exposed to other members.
- Current-person Match and historical garment Match are different contexts and must never be blended.

# 2. Current-person Match vs historical garment Match — LOCKED

1. **Current-person Match** compares the viewer's current body with another member's current body. Overall/Tops/Bottoms and Fit Twin designation live here.
2. **Historical garment Match** compares the viewer's current body with the relevant body state attached to a historical Fit Report.

Match % means **garment-relevant body similarity**, not probability that a garment will fit.

# 3. Following vs Fit Twin — LOCKED

- Following is member-controlled.
- Fit Twin is system-derived among followed members from strong current-person Match quality.
- One canonical `follows` graph exists; there is no separate user-controlled Fit Twin graph.
- Member actions are Follow / Following / Unfollow.
- Public relationship count is Followers.
- Initial Fit Twin threshold remains configurable and currently starts at 85% Overall Match.
- My Circle and Style Feed are driven by Following; Fit Twin is a designation/filter/context, not a second subscription.
- Legacy identifiers containing `fit_twin` are implementation naming debt only.

# 4. Controlled community catalog — LOCKED

LikeSized uses one controlled community-built canonical Product catalog.

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products.**

A canonical Product is the normalized identity used for Product search, exact-Product evidence, Product details, variants, identifiers, Product photos, retailer listings, and reviewed shared facts.

A member garment submission is evidence. Manual Brand/Model text, barcode, retailer URL, Style/Article Number, Product Photo, raw external search result, Google Shopping `product_id`, color/size/retailer listing, or other single weak signal does not by itself create or define a canonical Product.

**SERPAPI RESULT ≠ CANONICAL PRODUCT.**

# 5. New Fit Report intake — LOCKED

The member flow is:

**Search LikeSized → select the exact Product if we have it → otherwise add the garment quickly and keep going.**

Ordinary member intake never calls SerpAPI.

## 5.1 Known Product
When the exact Product exists:
- select the canonical Product;
- prefill reviewed Product facts where available;
- allow member disagreement to be recorded as evidence/review rather than silently overwriting Product truth;
- save the member's Fit Report against that Product.

## 5.2 Unknown Product
When the Product is not resolved:
- use the short manual fallback;
- persist the Closet item/Fit Report immediately;
- preserve the member's best-known identity and optional enrichment evidence;
- create or associate a pending catalog candidate;
- keep the member's garment usable while review is pending;
- do not create a canonical Product directly from the manual fallback.

Later authorized catalog resolution may map the submission to an existing Product or create one genuinely new canonical Product while preserving the original member evidence and immutable try-on body snapshot.

## 5.3 Barcode
- Barcode scanning searches LikeSized's known identifiers only.
- Known barcode → load the canonical Product.
- Unknown barcode → retain the scanned code and continue manual fallback without forcing re-entry.
- Conflicting barcode identity evidence routes to admin review.
- Barcode scanning remains an owner-testing item; do not treat it as owner-confirmed merely because the source exists.

# 6. New Fit Report information structure — LOCKED

Primary Fit Report information:
1. Brand / Make — required.
2. Item / Model — required.
3. Garment Type — required; LikeSized derives Category.
4. Zero-to-four Type-specific controlled physical questions — each shown question starts blank; **Not sure** is last and records no positive physical claim.
5. Color family — required.
6. Size — required structured size.
7. Overall Fit Result — Too Small / Snug / Just Right / Relaxed / Too Big.
8. Condition — New / Used / Altered.
9. Fit Photo — optional.
10. Fit notes — optional.

Optional shared Product/candidate evidence:
- Retail link
- UPC / barcode when not already scanned
- Manufacturer Style / Article Number
- Material / Fabric Composition
- Product Photo
- Department

Fit Photo and Product Photo are different evidence types. A Fit Photo is personal wear evidence; a Product Photo is catalog/candidate evidence.

# 7. Size-system behavior — CURRENT

Supported structured size families include alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation, freeform fallback, and Not sure.

- For an unresolved/new Product with no learned default, Size system starts at **Choose your measurement system**.
- For a known Product, LikeSized may preselect a **unique most-common prior size-system kind** learned from existing Fit Reports.
- A tie produces no preselection.
- The member can change the preselected size-system kind if their item uses something else.
- The actual size value always starts blank; LikeSized must never prefill the member's size from another person's report.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, and `30 x 30` normalize to the same logical waist/inseam identity where appropriate.

# 8. Counted Fit Report identity — OWNER LOCKED

A counted Fit Report represents a **distinct body-fit state for one physical garment situation**, not a chronological episode.

For a resolved Product, the counted identity dimensions are:
- Member
- exact canonical Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body-fit state

The Product's color/variant listing, retailer URL, UPC, Style/Article Number, Product Photo, material evidence, Department evidence, Fit Result, Condition, Fit notes, and Fit Photo do **not** independently create another counted Fit Report.

## 8.1 Objective garment-answer fingerprint
- The fingerprint includes applicable physical controlled answers.
- `Not sure` is stored but excluded from the positive physical fingerprint.
- Intended Fit is report/filter metadata only and is excluded from the objective physical fingerprint.
- A genuine physical controlled-answer change can create a distinct report.

## 8.2 Body-state relevance source
The body-state identity must use the **same garment-to-measurement relevance source as Fit Match**, currently derived through `private.product_match_measurements(product_id)`. Do not maintain a second hard-coded relevance list for report deduplication.

Therefore:
- a measurement irrelevant to that Product's Fit Match cannot split its Fit Reports;
- Weight or Height alone do not split a T-shirt report unless the canonical match map actually uses them for that Product;
- any relevant measurement can matter if it is part of the Product's current match-measurement map.

## 8.3 The 2% state rule
For an already-established garment-relevant measurement:

`abs(new - baseline) / abs(baseline) >= 0.02`

means materially different for report-state identity.

- under 2% → same body state/report;
- 2% or more → different from that candidate state;
- direction does not matter;
- if another already-existing report represents the new state within its accepted windows, reuse/update that existing state instead of creating a chronological duplicate.

## 8.4 Blank/reintroduced measurements
- Blank → newly filled relevant measurement does **not** create a new report; it enriches an existing compatible report and establishes that measurement for future comparisons.
- Value → blank does not create a new report by itself and must not erase previously established body-state evidence.
- Missing optional measurements reduce precision/confidence rather than inventing values.

## 8.5 Rolling body-state baseline
When an existing report accepts a new relevant value inside the <2% window, that accepted value becomes the report's active comparison baseline. This allows a report-state cluster to move gradually with the member while avoiding unnecessary duplicate reports.

The original immutable `fit_profile_version_id` remains historical truth. `match_fit_profile_version_id` and the private report-body identity baseline may advance for matching/state reuse without rewriting the original try-on snapshot.

## 8.6 State reuse
If a member later returns to a body state already represented by an older report for the same Product + normalized Size + objective fingerprint, LikeSized reuses/updates that old state rather than creating a new report just because time passed.

Example: if 25-inch Chest and 29-inch Chest states already exist, returning to the 25-inch state reuses the compatible 25-inch report.

# 9. Fit Report update behavior — LOCKED

A compatible existing report is updated in place. Its latest report-scoped values replace/update the prior values for that counted state, including current Fit Result, Intended Fit metadata, Condition, notes, and Fit Photo.

Catalog evidence such as retailer links, identifiers, Product photos, and other legitimate Product evidence may accumulate separately rather than forcing duplicate counted reports.

Member-facing confirmation states:
- **FIT REPORT ADDED** for a genuinely new counted state;
- **FIT REPORT UPDATED** when an existing state is reused;
- **FIT REPORT SAVED · ITEM UNDER REVIEW** when member work is preserved but Product identity requires review.

# 10. Garment Type identity conflicts — LOCKED

Garment Type is Product identity, not a report-level majority-vote field.

When a member selects a known Product but reports a conflicting Garment Type:
- preserve the member's work as unresolved/pending rather than mutating the Product;
- the conflicted Fit Report remains `product_id = NULL` until resolved;
- candidate status becomes Needs Review;
- the canonical Product is marked for catalog review;
- the pending report must not count as ordinary exact-Product fit evidence until resolved;
- admin must correct the canonical Product, map the member submission to another Product, or dismiss/reject the disputed identity.

# 11. Product evidence and material defaults — CURRENT

Shared Product facts resolve field by field; one Fit Report never wholesale-replaces another.

## Material/Fabric Composition
- Member material default selection uses complete **exact submitted recipes/compositions**.
- Never average percentages into a composition nobody submitted.
- A unique most-common exact recipe becomes the member-derived default.
- A tie clears the non-verified member-derived default rather than inventing certainty.
- Verified authoritative Product material evidence outranks member-derived defaults.
- Updating the same counted Fit Report's material evidence replaces that report's prior recipe rather than adding another vote.

Current implementation counts valid Fit Report recipes when choosing the member-derived default. Distinct-member corroboration/trust status is a separate quality question and must not be confused with recipe-frequency selection.

## Other shared facts
Department, controlled attributes, descriptions, identifiers, retailer listings, and similar facts remain evidence with provenance. Conflicts can trigger review rather than silently rewriting canonical truth.

# 12. Pending catalog candidates — LOCKED

Candidate lifecycle:
- Pending Product
- Needs Enrichment
- Needs Review
- Merged

A sufficiently resolved canonical Product is the Verified Catalog Item state rather than a duplicate candidate status.

Candidate queue priority should favor real member demand: submission count/frequency first, with recency, affected Fit Reports, flags, and admin judgment as supporting signals.

# 13. Duplicate prevention / aliases / resolution — LOCKED

Resolution attempts to reuse an existing canonical Product before creating a new one.

Reviewed Brand/Product aliases normalize proven spelling, punctuation, capitalization, and common naming variants without creating duplicate public identities.

No weak fuzzy-title match, raw Google title, retailer listing, color, size, or Google Shopping `product_id` may force a Product merge.

Different Style/Article IDs may be variants/SKUs of one Product; shared broad model wording may also hide multiple fit-distinct Products. Meaningful fit-changing modifiers must not be stripped blindly.

Admin merge/split must preserve Fit Reports, immutable body links, submissions, identifiers, aliases, listings, evidence, valid photos, and audit history.

# 14. Admin catalog + moderation — LOCKED TARGET

Only explicitly authorized admins may access administrative controls.

Required operating areas:
1. Catalog Enrichment
2. Conflicting Product Facts
3. Possible Duplicates / Identity Review
4. Reported / Spam Content
5. Review / Audit History

Admin powers ultimately include candidate inspection, demand ordering, map/create, merge/split, Brand/Product alias management, field verification/lock/reopen, photo/content moderation, spam submission/Fit Report handling, retailer/identifier conflict resolution, and accountable history.

The current admin surface is a working foundation but remains subject to the full owner re-audit and is not yet considered owner-confirmed.

# 15. SerpAPI — ADMIN RESEARCH ONLY

SerpAPI is an admin-side discovery/enrichment tool. It is not member-facing intake or Product authority.

Admin research should:
- normalize/dedupe intended queries;
- check the private LikeSized cache first;
- reuse suitable cached research;
- distinguish cached vs newly fetched results;
- respect usage warnings/caps/hard stop;
- preserve responses for reuse;
- require explicit catalog-resolution action after research;
- never write raw SerpAPI results directly into canonical Products.

The completed owner-approved 150-item benchmark produced 150/150 first-pass searches and preserved 5,901 raw Shopping listings in the private cache for reuse.

# 16. Starter catalog — CURRENT

The owner-supplied starter catalog remains launch-preparation data. Specific reviewed entries may be canonical Products; broad/ambiguous entries remain candidates until resolved. Do not invent missing metadata. Reuse cached research before spending new searches.

# 17. Controlled garment taxonomy — LOCKED

Explore and New Fit Report share one canonical taxonomy. No parallel category/type/style system.

Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- Shoes

Accessories are not V1.

Specific Type/question definitions live in `lib/garment-taxonomy.ts` and must agree with database vocabulary.

# 18. Fit Result — LOCKED

Physical values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is no current V1 1–5-star Fit Rating UI. Legacy `fit_rating` identifiers may remain only as implementation names for these physical outcomes.

Bad fits are useful evidence. Too Small/Too Big do not reduce body Match %.

# 19. Preferred Fit — RETIRED

The old member-level **Preferred Fit by garment type** feature is not part of current V1 product behavior.

- It is removed from the Fit Profile UI.
- It does not alter Match %, Fit Twin designation, counted Fit Report identity, or current size recommendation behavior.
- Historical database rows may remain preserved/inert so editing measurements does not unexpectedly rewrite legacy data.
- Do not reintroduce Preferred Fit UI or recommendation semantics without a new owner decision.

This is distinct from **Intended Fit** captured on a Fit Report, which may remain report/filter metadata while being excluded from objective physical report identity.

# 20. Deep Fit Match architecture — LOCKED

- Match is symmetric body similarity.
- Recommendation may privately use viewer-vs-historical-wearer direction for relevant measurements.
- Raw signed deltas never reach clients.
- Confidence is qualitative where exposed: High / Good / Limited.
- Missing optional measurements reduce refinement/confidence rather than generating fake values.
- Derived body proportions are private refinement only: total influence max 8%, final Match movement max ±4 points.
- Chest and Full Bust remain distinct.
- Bust-shaped handling activates only in configured relevant contexts.
- Bras retain specialized Full Bust + Underbust + High Bust handling.
- Shoes use Foot Length dominant / Foot Width secondary calibration.
- Outerwear may use modest layering tolerance; suit jackets/blazers remain more precise.
- New and Used observations are normal sizing evidence; Altered remains history but is excluded from normal Product recommendation evidence.
- Measurement age can affect confidence where configured, not raw stored value or historical snapshot truth.

# 21. Recommendation hierarchy — LOCKED

**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

Pending/unmapped submissions do not count as exact canonical Product evidence until safely mapped.

`Would Buy Again` does not affect size recommendation or confidence.

# 22. Help Me Size It — LOCKED FALLBACK

Help Me Size It is fallback sizing assistance:
1. strong same-product evidence → normal evidence, no fallback;
2. useful but limited evidence → useful reports first, smaller fallback;
3. no meaningful close matches → fallback may become primary.

It reuses the canonical recommendation engine. No second sizing engine/table. Never invent a size when evidence is insufficient.

# 23. Explore / Search — OWNER-LOCKED DESIGN

- canonical route `/explore`; `/browse` is compatibility redirect only;
- Garments | Outfits;
- My Fit Matches | All;
- fresh Explore defaults My Fit Matches;
- Garments My Fit Matches: 75%+ garment-specific historical Match;
- Outfits My Fit Matches: 75%+ creator current Overall Match;
- tiers: 90–99 → 85–89 → 80–84 → 75–79;
- within tier: Match % → unseen/freshness → recency → likes/popularity;
- carousel 8; initial 24; Keep Browsing +24;
- strict Category → Type → Type questions → Brand → Item → Color filters;
- no silent filter relaxation;
- ordinary Product search returns one canonical Product result, not one row per wearer/Fit Report;
- unresolved pending submissions do not appear as pseudo-Products;
- no blank image state and no stars.

# 24. People Like You Who Wore This / evidence counting

Product fit summaries may count all legitimate distinct Fit Report situations, including multiple body-fit states from one member when they are genuinely distinct under the counted-report rules.

Member presentation surfaces such as **People Like You Who Wore This** should still avoid repeating one member across top wearer slots merely because they have multiple observations. Evidence counting and unique-wearer presentation are separate concerns.

# 25. Retail listings + shopping — OWNER LOCKED

A canonical Product may have zero, one, or multiple valid retailer destinations.

- append/dedupe legitimate destinations; never overwrite one valid retailer with another;
- preserve clean provider-independent retailer URLs/provenance;
- pending URLs remain candidate evidence until Product mapping;
- same normalized URL on apparently different Products is a conflict/duplicate signal;
- commission never affects Match, recommendation, Product identity, search ranking, or retailer choice.

Shopping behavior:
- zero valid listings → no Shop/cart action;
- one valid listing → direct retailer route;
- multiple valid listings → compact retailer picker.

Where a valid retailer destination exists, the approved garment action set is **Like + Wishlist + Shopping Cart/Shop**. If no valid retailer link exists, the shopping action disappears entirely.

The same conditional behavior applies to Product/Garment detail, Shop Here equivalents, Wish Locker, Gift Lists, and other approved shopping surfaces.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# 26. LikeLocker / Wish Locker / Gift Lists

LikeLocker is private saved fashion, not people.

Tabs:
- Garments
- Outfits
- Wish Locker

Product Like, Outfit Like, and purchase intent remain separate states.

Gift Lists remain roadmap-locked after Product/retailer/save/recommendation foundations: owner-approved wanted Products, confidence-gated recommended size, no raw measurements, owner-controlled sharing, and the same retailer-shopping rules.

# 27. Outfits / Style Feed — V1 RETAINED

- Outfits use owned Closet garments; no duplicate Product/taxonomy system.
- owned Outfits live in My Closet;
- other-member Outfit discovery lives in Explore;
- followed-person Outfit activity lives in Style Feed;
- Outfit likes contribute Style Likes; Product likes do not;
- Following drives the feed; Fit Twin remains designation only;
- no V1 DMs, Stories, Reels, creator payouts, or sponsorship marketplace unless separately approved.

# 28. Images / sharing

- Fit Photo is optional and follows the current Shared evidence boundary.
- Product Photo is separate optional catalog/candidate evidence.
- Never use another member's personal Fit Photo as a generic Product image.
- New Outfit uploads use optimized WebP display/feed assets under the deployed photo pipeline; the original is not retained for new uploads under that behavior.

# 29. Public homepage / FAQ

Homepage remains useful logged out and keeps FAQ inline.

Before Beta, public explanation must accurately cover measurement privacy, Match %, current-person vs historical Match, People My Size, Following vs Fit Twin, Private vs Shared Closet, Fit/Product Photo behavior, Fit Result/no stars, Help Me Size It, LikeLocker/Wish Locker, Outfits/Style Feed, controlled catalog/manual fallback, unresolved item review, admin-side SerpAPI role, shopping/affiliate behavior, immutable historical try-on state, and Gift Lists if implemented.

# 30. Data-quality rule

**Controlled when possible. Normalize when necessary. Free text only when useful.**

Search/autocomplete prefers canonical Brands/Products and reviewed aliases before fallback. Identifiers/URLs are normalized for matching while useful originals/provenance remain preserved.

For implementation status, owner re-audit order, production checkpoints, and exact next work, read `docs/AI_MASTER_LOG.md`.
