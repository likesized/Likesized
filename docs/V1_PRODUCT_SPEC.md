# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current product/fit architecture. Roadmap order, status, recovery/deployment history, and exact next action live only in `docs/AI_MASTER_LOG.md`.

This file must never knowingly contradict the current owner-locked decisions in the master. When product meaning changes, update this current-state architecture in the same canonical change. Do not preserve conflicting old LOCKED wording here.

# 1. Privacy and body-state architecture

- `fit_profiles` is a small profile shell, not a permanent column-per-measurement table.
- Current raw measurements live in owner-private normalized measurement structures.
- Immutable Fit Profile versions preserve historical body state.
- Every Fit Report/try-on stores an immutable body-version reference so later body edits never rewrite historical garment evidence.
- Raw current/historical measurements and private size references are never member-visible.
- The old normally-worn-size input UI is not current V1. Historical/private records may remain until deliberately audited.

# 2. Two matching contexts — LOCKED

1. **Current person match** — viewer current body ↔ another member current body. Overall/Tops/Bottoms and Fit Twin designation live here.
2. **Historical garment evidence match** — viewer current body ↔ immutable body snapshot attached to a historical garment observation.

Never blend the two contexts.

# 3. Following vs Fit Twin — LOCKED

- **Following is user-controlled.** A member may follow someone at any Match % for style/content usefulness.
- **Fit Twin is system-generated within Following** from strong current-person Match quality.
- Following places someone in My Circle; LikeSized—not the member—decides whether that followed person qualifies as a Fit Twin.
- A followed member may be Following + Fit Twin or Following without Fit Twin.
- A non-followed member may still have a strong Match %, but is not one of that member's Fit Twins.
- Initial Fit Twin threshold is configurable and starts at 85% Overall Match.
- `follows` is the one canonical social graph. Do not create a second Fit Twin graph.
- Member actions are **Follow / Following / Unfollow**.
- Public relationship count is **Followers**, never Fit Twins.
- My Circle and Style Feed eligibility are driven by Following.
- Legacy source/function/database identifiers containing `fit_twin` are implementation debt and do not redefine product meaning.

# 4. Controlled community catalog — LOCKED

LikeSized V1 uses a **controlled community-built canonical catalog**.

Members contribute garment/Fit Report evidence, but **members do not directly create canonical Products**.

External search providers are not member-facing intake engines. SerpAPI is approved only as an **admin-side discovery/research/enrichment tool** under the controls in this spec.

Core catalog principle:

> **A clothing catalog built by the people who actually wear it, normalized into one controlled canonical Product catalog.**

## 4.1 Canonical Product vs garment submission

### Canonical Product
A canonical Product is the one normalized LikeSized identity used for:
- Product search/discovery;
- exact Product evidence aggregation;
- Product pages/details;
- variants/identifiers;
- Product photos;
- retailer listings;
- shared reviewed Product facts.

A canonical Product may be created only through the catalog-resolution layer after sufficient identity confidence/review.

### Garment submission
A garment submission is the member's real garment/Fit Report intake when the Product is not yet confidently resolved.

It preserves:
- the member's best-known Brand/Model text;
- Garment Type and controlled observable answers;
- Color;
- Size;
- Fit Result;
- Condition;
- Fit Photo/notes;
- immutable `fit_profile_version_id` body state;
- optional candidate identity/enrichment evidence such as barcode, Style/Article Number, retailer URL, Product Photo, Department and material.

A garment submission may later be mapped to a canonical Product without rewriting the original Fit Report/body snapshot.

A pending submission must not appear as a duplicate pseudo-Product in ordinary Product search or exact-Product recommendation aggregation until it is safely mapped.

## 4.2 Member-facing intake flow

The member experience is intentionally simple:

**Search LikeSized → select the Product if we already know it → otherwise add the garment quickly and keep going.**

The member must never be blocked from logging a garment because LikeSized has not resolved the Product yet.

Opening options:
- **Scan barcode**
- **Search / enter item manually**

Both search LikeSized first. Ordinary member intake does **not** call SerpAPI.

### Known Product path
When the exact Product exists:
- select the canonical Product;
- show reviewed Product facts;
- keep known reviewed facts locked/read-only by default where appropriate;
- allow a field-level **Report an issue / This is incorrect** action;
- disagreement becomes evidence/flagging rather than a silent overwrite;
- complete the member's Fit Report normally.

### Unknown Product path
When the Product is not in the canonical catalog:
- use the short manual fallback;
- persist the garment submission and Fit Report immediately;
- create/update a pending catalog candidate on the backend;
- **do not directly create a canonical Product**;
- allow the member to use their Closet/Fit History while catalog resolution is pending.

Later catalog resolution may:
- map the submission to an existing canonical Product;
- create one genuinely new canonical Product and map submissions to it;
- split an ambiguous candidate when submissions actually represent multiple Products.

## 4.3 Barcode path

Barcode scanning searches LikeSized's own catalog/known identifiers only.

Known barcode:
- load the canonical Product;
- retain the barcode evidence;
- no external lookup during member intake.

Unknown barcode:
- explain LikeSized does not yet have the item resolved;
- continue manual garment-submission fallback;
- retain the scanned barcode automatically on the submission/candidate evidence;
- never require rescan/retyping;
- unknown barcode alone does not create a Product.

Conflicting barcode evidence flows to identity/duplicate review.

## 4.4 Manual search/fallback

1. Search canonical LikeSized Brand/Product records and reviewed aliases first.
2. If exact Product exists, select it.
3. If not, the member provides the best-known Brand/Model and continues the Fit Report.
4. Backend creates/updates pending candidate state, not a Product.

Hidden aliases should normalize proven spelling/punctuation/typo variants such as:
- `Levis`
- `Levi's`
- `Levi’s®`
- capitalization/punctuation variants.

Product aliases may similarly retain reviewed model-name variants without creating duplicate public Products.

# 5. Pending catalog candidate lifecycle — LOCKED

Similar unresolved submissions may aggregate into a backend candidate while the original submissions remain intact and auditable.

Required lifecycle meanings:

## Verified Catalog Item
A sufficiently resolved canonical Product available as the clean selectable catalog identity.

## Pending Product
One or more garment submissions exist, but Product identity is not sufficiently resolved.

## Needs Enrichment
Base identity is largely understood, but useful shared Product details remain incomplete.

## Needs Review
Ambiguous identity, possible duplicate, conflicting facts/identifiers, suspicious research result, or another issue requires admin judgment.

## Merged
A pending candidate/submission group was mapped into an already-existing canonical Product. This is candidate-resolution history, not a second Product.

Queue priority should favor actual member demand. Submission count/frequency is a primary default signal, with recency, number of affected Fit Reports, flags, and admin override available as secondary signals.

# 6. Product resolution and duplicate prevention — LOCKED

Resolution always attempts to reuse an existing canonical Product before creating a new one.

Potential identity evidence includes:
1. explicit existing Product selection;
2. canonical Brand/aliases;
3. cleaned Item/Model name;
4. UPC/barcode where the identifier's scope is understood;
5. manufacturer Style/Article Number where scope is understood;
6. Garment Type;
7. Department/fit context;
8. controlled Product characteristics;
9. normalized retailer listing URLs as supporting evidence;
10. reviewed Product images/descriptions;
11. SerpAPI research evidence.

No single weak identifier or fuzzy title may force a merge.

Important rules confirmed by benchmark research:
- different Style/Article IDs can represent colors/variants/SKUs of one underlying Product;
- one broad family/model word can contain multiple fit-distinct Products;
- color, size, retailer, price and availability differences normally do not create a new base Product;
- meaningful modifiers such as men's/women's/kids, Wide, EasyOn, Shrink-to-Fit, Selvedge, generation/year, construction, sleeve/length or other fit-changing distinctions must not be stripped blindly.

Resolver outcomes:
- **safe existing match** → map to existing Product;
- **ambiguous / possible duplicate** → Needs Review / Possible Duplicate flag;
- **genuinely new** → create one new canonical Product only through catalog resolution.

## Merge
Admin merge must preserve:
- garment submissions;
- Fit Reports and immutable body links;
- aliases;
- identifiers;
- retailer listings;
- Product evidence;
- photos where valid;
- moderation/review history.

## Split
Admin must be able to split an incorrectly combined Product/candidate and move appropriate submissions, Fit Reports, identifiers, listings and evidence without silent data loss.

# 7. Field evidence / conflict / consensus — LOCKED

A Fit Report never wholesale-replaces another Fit Report.

Personal/historical garment evidence remains attached to that member's observation:
- Size;
- Color of that garment;
- Fit Result;
- Condition;
- Fit Photo;
- Fit notes.

Shared Product facts resolve field by field.

Rules:
- one member claim is evidence, not unquestionable Product truth;
- repeat submissions by the same member do not count as independent corroboration;
- independent agreement can strengthen/corroborate a value;
- material competing values trigger review;
- if disagreement may actually represent two Products/variants, duplicate/split review takes precedence over simple voting;
- admin may verify/override/lock Product facts/descriptions;
- locked facts cannot be overwritten by later member evidence;
- later disagreement remains auditable evidence;
- reopening a lock requires an authorized audited action.

# 8. Flag model — LOCKED

Required flag families:

## Possible Duplicate
Potential duplicate Brands/Products/candidates without enough evidence for safe auto-merge.

## Conflicting Product Fact
Competing shared Product values such as Brand, Item/Model, Type, attributes, Department, material, Style/Article, description or another shared fact.

## Ambiguous Catalog Identity / Needs Review
Candidate cannot yet be confidently mapped or created, including broad/generic model naming or external research showing several materially different Products.

## Reported / Spam Content
Inappropriate/spam Fit Photos, Product Photos, Outfit content, garment submissions and Fit Reports.

## Retail / Identifier Conflict
A subtype or dedicated review reason for contradictory UPC/style/listing evidence, such as one normalized retailer URL apparently attached to different Products.

Flags never directly rewrite Product truth or delete content. Resolution is an authorized audited admin action.

# 9. Admin catalog + moderation architecture — LOCKED

Only explicitly authorized admins may access administrative review surfaces.

Required primary tabs/queues:

## Catalog Enrichment
Show Pending Product / Needs Enrichment candidates with:
- submission count/demand;
- last submitted;
- last researched;
- available cached SerpAPI research;
- current status/flags;
- affected submissions/Fit Reports.

## Conflicting Product Facts
Show field-level competing claims and supporting independent evidence.

## Possible Duplicates / Identity Review
Show candidate/Product comparisons, identity signals, ambiguity reasons and merge/split/map actions.

## Reported / Spam Content
Show moderation reports for supported photos/content/submissions/Fit Reports.

## Review / Audit History
Append-only record of admin mapping, merge, split, lock, reopen, removal, dismissal and research decisions.

Admin catalog powers include:
- inspect candidate submissions/evidence;
- see demand/submission count;
- inspect cached external research;
- run SerpAPI single/batch research;
- compare candidate ↔ canonical Product;
- map submissions/candidate to existing Product;
- create one new canonical Product after sufficient review;
- merge/split;
- create reviewed aliases;
- verify/override/permanently lock facts/descriptions;
- reopen through audited action;
- append/dedupe retailer listings;
- mark invalid/dead listings appropriately;
- dismiss false flags;
- remove inappropriate/spam supported content while retaining audit history.

# 10. SerpAPI — ADMIN DISCOVERY + ENRICHMENT ONLY

SerpAPI is an admin research tool. It is not:
- member-facing intake;
- Product identity authority;
- a second catalog;
- permission to insert raw Google Shopping titles as Products;
- permission to create one Product per retailer/color/size/Google `product_id`.

Absolute rule:

> **SERPAPI RESULT ≠ CANONICAL PRODUCT.**

Raw SerpAPI titles/results remain candidate/research evidence.

## 10.1 Admin batch research

Admins may select unresolved/enrichment candidates and run research individually or in controlled batches.

Batch behavior must:
1. normalize intended queries;
2. dedupe equivalent queries within the batch;
3. check private LikeSized SerpAPI cache first;
4. reuse cached results when suitable;
5. clearly distinguish cached vs newly fetched research;
6. call SerpAPI only for missing or authorized-refresh queries;
7. respect configurable monthly usage warnings/caps;
8. preserve every successful response for later reuse;
9. never make bulk search equal bulk Product approval/creation;
10. let admins inspect result clusters and explicitly choose map/create/review actions.

## 10.2 Cache/budget rules

Before a paid search:
- normalize query;
- check cache;
- reuse equivalent cached research where suitable;
- refresh only when an authorized admin chooses and the reason justifies another call.

No-useful-result searches may also be cached with shorter freshness so repeated research does not immediately spend another call.

SerpAPI is convenience, never dependency. If budget is exhausted, member intake and pending-candidate creation continue normally.

## 10.3 Completed 150-item benchmark

The owner-approved benchmark against the exact 150 starter entries produced:
- 150/150 first-pass Google Shopping searches completed;
- 5,901 raw Shopping listings preserved in the private cache;
- no member-facing SerpAPI integration;
- temporary benchmark writer/control surface later closed/removed;
- cached responses remain reusable admin research evidence.

The benchmark confirmed:
- same underlying garment commonly appears many times across retailers/colors/sizes;
- Google Shopping `product_id` is not LikeSized Product identity;
- many model searches are useful admin research;
- broad/generic fashion names frequently represent several genuinely different Products;
- cluster-first conservative resolution is safer than raw-title insertion/aggressive fuzzy merge.

# 11. New Fit Report information structure — LOCKED

The member evidence format remains controlled. The key new rule is **where unresolved information is stored**.

1. **Brand / Make** — required; canonical search first, best-known manual fallback when unresolved.
2. **Item / Model** — required; canonical Product search first, best-known manual fallback when unresolved.
3. **Garment Type** — required and specific/member-facing. LikeSized derives Category.
4. **Garment-specific controlled questions** — zero-to-four for that Type. Each displayed question starts blank and requires selection. **Not sure** is always last and records no positive claim.
5. **Color family** — required and controlled.
6. **Exact Size** — required structured size. Start with **Choose your measurement system**; no default.
7. **Overall Fit Result** — required: Too Small / Snug / Just Right / Relaxed / Too Big.
8. **Condition** — required: New / Used / Altered.
9. **Fit Photo** — optional, grouped with primary Fit Report evidence.
10. **Fit notes** — optional.

Then optional identity/enrichment evidence:
1. **Retail link**
2. **UPC / Barcode** — hidden if already scanned.
3. **Manufacturer Style / Article Number**
4. **Material / Fabric Composition** — controlled; blends supported; percentages optional.
5. **Product Photo** — product alone, separate from Fit Photo.
6. **Department** — controlled.

For unresolved garments, these remain candidate/submission evidence until mapping.

Initial Department values:
- Women's
- Men's
- Unisex
- Girls'
- Boys'
- Kids / Unisex
- Baby / Toddler
- Not sure

Department starts blank; Not sure last.

Initial controlled material vocabulary includes:
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

Material is optional evidence only. It does not affect Match/recommendation and does not automatically become an Explore filter. Stretch remains outside current V1 member input/filter behavior.

# 12. Starter 150 — LOCKED / RECONCILED

All 150 owner-supplied starter entries remain launch-preparation data and must not be forgotten.

The benchmark showed that some entries are clean specific models while others are broad/generic/ambiguous current names.

Rules:
- retain/load all 150 in the database/research pipeline;
- do not invent missing metadata;
- sufficiently specific reviewed entries may be canonical selectable Products;
- broad/generic entries must remain Pending / Needs Enrichment / Needs Review until resolved rather than falsely presented as verified exact Products;
- reuse existing cached benchmark results before spending another search.

The branch now uses a later canonical reconciliation migration after the earlier provisional seed migration: it retains the 150 in the catalog-candidate/enrichment pipeline and removes only empty/unreferenced provisional seed Products. Any starter Product that already gained real evidence remains preserved for review. This branch state is not production truth until fresh replay and owner-approved promotion pass.

# 13. Controlled garment taxonomy — LOCKED

Explore and New Fit Report share one controlled taxonomy. No parallel category/type/style systems.

Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- Shoes

Accessories are not V1.

Specific approved garment Types/questions live once in `lib/garment-taxonomy.ts` and must agree with database vocabulary.

Global question rules:
- zero-to-four Type-specific observable questions;
- displayed question starts blank;
- user physically selects an answer;
- Not sure is last and records no positive claim;
- Color is separate/required;
- no V1 stretch question/filter.

The database may keep legacy compatibility keys for historical/matching behavior, but inactive legacy umbrella keys must not reappear as member-facing choices.

# 14. Size normalization

- Preserve useful original manufacturer labels when deliberately supplied without asking for size twice.
- Normalize alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation and fallback sizes.
- Formatting variants such as `3030`, `30x30`, `30 X 30`, `30×30`, `30 x 30` normalize to the same logical waist/inseam identity where appropriate.
- Work shirts can decompose collar+sleeve; jackets chest+length; bras band+cup+system.
- Free text is fallback only for unusual manufacturer sizing.

# 15. Fit Result — LOCKED / STAR SYSTEM REMOVED

Physical values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is no current V1 1–5-star Fit Rating UI.

Legacy DB identifiers such as `fit_rating` may remain if they store these physical outcomes; they do not authorize stars.

Bad outcomes are valuable evidence. Too Small/Too Big do not reduce body Match %.

`Would Buy Again` does not influence size recommendation or recommendation confidence.

# 16. Deep Fit Match architecture — OWNER LOCKED

## Match semantics
- Match % = garment-relevant body similarity, not probability a garment fits.
- Current-person body Match is symmetric.
- Confidence is secondary/qualitative where exposed: High / Good / Limited.
- Raw measurement coverage is not a fake confidence label.
- Missing optional measurements reduce refinement/confidence rather than generating fake values.

## Directional recommendation evidence
- Match remains symmetric.
- Size recommendation may privately use viewer-vs-historical-wearer direction for relevant measurements.
- Raw signed deltas never reach clients.

## Preferred Fit
Private by garment type:
- Fitted
- Standard
- Relaxed

Preferred Fit affects recommendation translation only, not Match %, Fit Twin qualification or historical body state.

## Derived body proportions
- derived privately from supplied measurements;
- no user-entered ratio fields;
- small garment-specific refinement only;
- total influence max 8%;
- final Match movement max ±4 percentage points;
- missing components leave base Match unchanged.

## Chest vs Full Bust
- Chest and Full Bust remain distinct.
- Generic Tops/Overall do not penalize missing Full Bust where irrelevant.
- Bust-shaped Product handling only activates in explicitly relevant configured contexts.
- bras/intimates retain specialized Full Bust + Underbust + High Bust handling.

## Measurement freshness
- current measurements carry private confirmation timestamps/cadence;
- age does not change stored value or raw similarity;
- staleness may mildly reduce confidence only after applicable window;
- confirmation-only changes do not create fake body-history versions;
- historical snapshots do not decay merely because time passes.

## Bras / shoes / outerwear
- Bras: Full Bust + Underbust core; High Bust supporting.
- Shoes: Foot Length dominant / Foot Width secondary under recovered calibration.
- Outerwear: modest layering tolerance for jackets/coats; suit jackets/blazers remain more precise.

## Garment condition
- New and Used observations use normal sizing evidence.
- Altered remains historical but excluded from normal Product recommendation evidence.

## Actual garment measurements
Deferred. V1 does not require manufacturer physical garment dimensions.

## Learned calibration
Future aggregated Fit Result data may calibrate existing weights/tolerances only with meaningful samples, tests/review and owner approval. No autonomous self-rewriting model in V1.

# 17. Recommendation evidence hierarchy

**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- exact_variant 1.00
- exact_product 0.94
- product_family 0.82
- similar_garments 0.70
- brand_garment_type 0.58
- category_fit 0.42

Pending/unmapped garment submissions are excluded from **exact canonical Product** aggregation until safely mapped. Their historical Fit Report remains preserved and becomes eligible for appropriate evidence once resolved.

# 18. Help Me Size It — LOCKED FALLBACK

Help Me Size It is fallback sizing assistance, not a primary feature.

Visibility hierarchy:
1. strong same-product normal evidence → show normal evidence; no fallback;
2. useful but limited evidence → useful reports first, smaller fallback;
3. no meaningful close matches → fallback may become primary CTA.

Rules:
- reuse canonical recommendation engine;
- never create second sizing engine/table;
- label estimates clearly;
- show Other Fit Reports for same canonical Product where available;
- if no responsible estimate exists, say so;
- Notify belongs only to insufficient/no-useful-fit-evidence state.

# 19. Explore / Search — OWNER-LOCKED DESIGN

## Structure
- canonical `/explore` route; `/browse` compatibility redirect only;
- Garments | Outfits;
- My Fit Matches | All;
- fresh visit defaults to My Fit Matches.

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
- carousel 8;
- initial results 24;
- Keep Browsing +24.

## Search
- Garments, Outfits and People across full available inventory;
- ordinary garment search returns one canonical Product result, not one row per wearer/Fit Report;
- unresolved pending submissions do not surface as duplicate pseudo-Products;
- query relevance is primary; catalog trust breaks ties among similarly relevant Product results;
- compact mobile suggestions.

## Strict filters
- no silent relaxation;
- Category/Type remain strict;
- Type-specific filters use canonical controlled questions;
- Color remains separate/browsable;
- Brand/Item remain canonical metadata;
- no stretch filter;
- storing Material does not automatically create a Material filter.

## Card actions
- image priority: member Shared Fit Photo → valid Product photo/image → LikeSized type fallback;
- no blank image state;
- product/image opens Product/Garment detail;
- wearer identity is separate;
- Like, Wishlist, Shop and Notify are distinct tap targets;
- no stars.

# 20. Retail listings + affiliate monetization — OWNER LOCKED

## Retail destinations
A canonical Product may have **zero, one, or multiple** valid retailer listings/destinations.

- retailer URLs are listing/destination data, never Product identity;
- member-provided retailer URLs are accepted only after validation/normalization and retailer/domain recognition;
- store the clean provider-independent destination; members never need to paste affiliate-formatted URLs;
- append/dedupe legitimate destinations rather than overwriting another retailer;
- preserve original URL/provenance;
- pending-submission retailer URLs remain candidate evidence until Product mapping;
- same normalized URL on apparently different Products is a strong duplicate/conflict signal;
- dead links may later be marked inactive without erasing history;
- a legitimate retailer that is not currently affiliate-monetizable may still be a normal outbound destination.

## Conditional shopping behavior
- **Zero valid retailer links:** no cart/Shop action renders anywhere for that Product. No disabled placeholder or dead-end control.
- **Exactly one valid retailer link:** the cart/Shop action routes directly to that retailer.
- **Multiple valid retailer links:** the cart/Shop action opens one compact retailer picker showing the valid retailer choices for that exact canonical Product.
- member-facing UI shows a clean retailer name such as **Nordstrom**, **Macy's**, or **Levi's**, never a raw URL as the shopping label.
- do not silently choose or rank a retailer because it pays LikeSized more commission. Future ordering may use shopper-value signals such as exact variant match, reliable availability, or price when those data are trustworthy.

Where a valid destination exists, relevant garment actions use:
**Like + Wishlist + Shopping Cart/Shop**.

The same zero/one/multiple-destination behavior applies to:
- garment images/cards/details where shopping is approved;
- Product/Garment detail;
- **Shop Here** under Product/Fit Report surfaces;
- Wish Locker;
- Gift Lists;
- other approved shopping surfaces.

Like/Wishlist/Shopping/Notify are distinct targets and must never open detail accidentally.

## Skimlinks / affiliate layer
- integrate Skimlinks or owner-approved equivalent only after canonical retailer-listing behavior is stable;
- aggregator routing may later be overridden by direct affiliate programs without changing the canonical clean retailer destination;
- preserve the original retailer URL beneath affiliate routing;
- internal click/source tracking may identify the LikeSized surface producing the click, but **private body measurements must never be exposed to retailers or affiliate providers**;
- audit then-current disclosure/privacy/cookie/merchant eligibility requirements before production;
- affiliate commission never affects Match, size recommendation, Product identity, retailer selection, search relevance or ranking;
- locked disclosure copy: **“LikeSized may earn a commission from purchases made through our shopping links.”** It should be unobtrusive but visible wherever required for the shopping/affiliate experience.

# 21. LikeLocker / Wish Locker / Gift Lists

LikeLocker is private saved fashion, not people.

Tabs:
- Garments — ordinary Product likes;
- Outfits — Outfit likes;
- Wish Locker — Product purchase intent.

LikeSized Gift Lists remain roadmap-locked after Product/retailer/save/recommendation foundations:
- owner-approved wanted Products;
- confidence-gated recommended size;
- no raw measurements;
- owner-controlled sharing;
- insufficient confidence → no invented size;
- eligible retailer/affiliate links allowed without influencing sizing/ranking;
- shopping follows the same zero/one/multiple-retailer behavior and shared retailer picker.

# 22. Outfits / Style Feed — V1 RETAINED

- Outfits remain in V1.
- Outfit posts use existing owned Closet garments; no duplicate Product/taxonomy system.
- owned Outfits live in My Closet.
- other-member Outfit discovery lives in Explore.
- followed-person Outfit activity lives in Style Feed.
- Outfit likes contribute creator Style Likes; garment/Product likes do not.
- Following drives feed subscription; Fit Twin is designation only.
- no V1 DMs, Stories, Reels, creator payouts or sponsorship marketplace unless separately approved.

# 23. Images / sharing

- Fit Photo optional.
- Fit Photos follow the Shared evidence/privacy rule; no private-fit-photo mode under current direction.
- never use another member's personal Fit Photo as generic Product fallback.
- Product Photo is separate optional catalog/candidate evidence and subject to moderation.
- Outfit photo pipeline keeps optimized WebP display/feed assets and does not store the original for new uploads under the previously deployed behavior.

# 24. Public homepage / FAQ

Homepage remains useful logged out and keeps FAQ inline.

FAQ/help must explain:
- measurement privacy;
- Match %;
- current-person vs historical garment Match;
- Following vs Fit Twin;
- Fit Result/no stars;
- Help Me Size It;
- LikeLocker/Wish Locker;
- Outfits/Style Feed;
- controlled community catalog;
- search LikeSized first;
- unknown garment can still be logged immediately;
- unresolved submission may be researched/resolved later;
- member evidence can improve/conflict with Product facts;
- admins resolve ambiguous identities;
- SerpAPI is admin research, not member-facing Product authority;
- retailer/affiliate behavior/disclosures where applicable;
- immutable historical try-on body state;
- Gift Lists if implemented.

# 25. Data-quality rule

**Controlled when possible. Normalize when necessary. Free text only when useful.**

Search/autocomplete prefers canonical Brands/Products before fallback. Identifiers/URLs are normalized for matching while useful original values/provenance are retained. Hidden aliases absorb reviewed spelling/punctuation variants without exposing duplicate public identities.

# 26. Current V1 loop

1. Create/update private versioned Fit Profile.
2. Receive garment-relevant current-person Match context and eventual Fit Twin designation among followed people.
3. Browse strong historical garment evidence first.
4. Use Help Me Size It only when strong same-product evidence is insufficient.
5. New Fit Report searches/scans LikeSized's own catalog.
6. Exact Product exists → select it and submit Fit Report.
7. Exact Product absent → submit garment/Fit Report through short manual fallback; keep using it immediately while catalog identity is pending.
8. Backend aggregates unresolved demand into pending candidates without turning raw submissions into Products.
9. Admins prioritize high-demand unknowns, reuse cached SerpAPI research, run controlled batch research when needed, and resolve candidates to existing or one new canonical Product.
10. Mapped historical Fit Reports retain their immutable body/fit evidence while becoming connected to the resolved Product.
11. Duplicate/conflicting data flows to audited review/merge/split/lock behavior.
12. Follow useful people into My Circle; LikeSized may designate strongest followed body matches as Fit Twins.
13. Save inspiration to LikeLocker and purchase intent to Wish Locker.
14. Valid retailer listings enable direct shopping or the shared retailer picker and later affiliate routing without affecting fit/search logic or retailer choice by commission.
15. Create/share Outfits from owned Closet garments.
16. Gift Lists may later share owner-approved wanted Products with confidence-gated recommended sizes and eligible retail links without exposing raw measurements.

For status, roadmap order, implementation completeness, deployment history and exact next work, read `docs/AI_MASTER_LOG.md`.
