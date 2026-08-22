# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, deployment ledger, and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; sole roadmap/status/decision/handoff record.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems, or a second master plan.

# CURRENT STATUS — 2026-08-22

## Canonical production baseline
- Production/canonical `main` remains at commit `36205c2731e9d1dc863934c065c9a281a57c37b9` and contains the completed canonical recovery plus owner-authorized PR #44, #45 and #46 work.
- Last owner-recorded production feature merge: PR #46 → `main` commit `ec987f5a22575b54806341615309a150558467dc`, followed by the recorded production repair/status commit above.
- Recorded Vercel production deployment for PR #46: `dpl_FZ2MeLLXaecG8QYVoK284e1n4x2E` — READY.
- PR #47 is **not authorized for production**.

## Sole active implementation line
- PR #47
- branch: `correct-grouped-menu-layout`
- current development lineage; live GitHub PR #47 branch HEAD is authoritative for exact commit status.
- PR remains open/unmerged.
- purpose: controlled consolidation of Phase 6.5 work plus the submission-first catalog/New Fit Report architecture.
- production merge/promotion: **NOT AUTHORIZED**.

## Verified consolidation checkpoint — AUTOMATED GATE GREEN
The latest implementation checkpoint before this status-only master reconciliation is:
- implementation commit: `5632c05ee452ff00547265ca51dd60186c403034`;
- LikeSized CI run: #466 / run `32586621388` — **SUCCESS**;
- canonical integrity/drift guard — PASS;
- TypeScript — PASS;
- all focused application safeguards — PASS;
- production build — PASS;
- complete fresh replay of every canonical Supabase migration — PASS;
- canonical database behavior/privacy/security tests — PASS;
- matching Vercel Preview deployment `dpl_2PiiEQz3oxzs92Tg6qTdenRu6gsg` — **READY**.

That checkpoint proves the current submission-first intake/catalog foundation, reviewed Product-alias reuse, RLS changes, and authorized pending-to-canonical mapping behavior replay and test cleanly from scratch. It does **not** mean Phase 6.5 is complete, it does **not** mean the new migrations have been applied to the live Supabase project, and it does **not** authorize a production merge.

## Active consolidation directive — OWNER AUTHORIZED
The owner explicitly authorized the cleanup/consolidation work with the goal of getting LikeSized back on solid canonical ground.

Current rule:
- PR #47 is the **only active development lineage**.
- do not create another implementation/decision/retry branch while this consolidation is active.
- historical branches are inspection/salvage sources only until classified; never copy an old file wholesale back into current source.
- do not merge/promote PR #47 until the current intake/catalog checkpoint is coherent, CI/migration replay/Preview pass, owner interaction review is complete, and the owner explicitly authorizes production.

## PR #48 salvage — COMPLETE / HISTORICAL ONLY
PR #48 (`owner-decision-retail-affiliate-plan`) was created from stale `main` while PR #47 was already the active line. It contained documentation-only retail/affiliate decisions.

The PR #48 diff was reviewed against current PR #47 canonical docs. Every unique approved decision has been preserved on PR #47:
- zero valid retailer links → no Shop/cart;
- exactly one valid retailer → direct route;
- multiple valid retailers → compact retailer picker;
- clean retailer names rather than raw URLs;
- valid non-monetizable retailer links remain usable;
- no commission-based retailer selection/ranking;
- provider-independent clean canonical retailer destinations;
- click-source tracking must never expose private body measurements;
- Fit Report / Wish Locker / Gift List shopping uses the same conditional behavior;
- exact disclosure: **“LikeSized may earn a commission from purchases made through our shopping links.”**

No unique approved product decision remains solely on PR #48. PR #48 is therefore **closed without merge**. Its commits remain inert Git history/salvage evidence and its branch must not be used as a development base.

# ACTIVE OWNER DIRECTION — CONTROLLED CATALOG + SUBMISSION-FIRST INTAKE

The earlier member-facing external/API import strategy is superseded.

The community-catalog concept is retained but tightened:

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products.**

SerpAPI is approved only as an **admin-side discovery/research/enrichment tool**, not as a member-facing search/import authority.

The desired system is a controlled canonical catalog that compounds over time from member demand plus admin resolution.

## Member-facing principle
The member experience is intentionally simple:

**Search LikeSized → select the exact Product if we have it → otherwise add the garment quickly and keep going.**

A member must never be blocked from logging a garment because LikeSized has not resolved that Product yet.

## Canonical Product boundary — LOCKED
A canonical Product is created/selected only by the catalog-resolution layer, not by raw member text and not by SerpAPI.

The following are evidence/candidates, not canonical Product authority:
- a member's manual Brand/Model text;
- an unknown barcode;
- a retailer URL;
- a manufacturer Style/Article Number whose scope is not yet understood;
- a SerpAPI/Google Shopping result;
- a Google Shopping `product_id`;
- a raw Google/retailer product title;
- a color/size/retailer-specific listing.

**SERPAPI RESULT ≠ CANONICAL PRODUCT.**

# MEMBER INTAKE — FINAL TARGET ARCHITECTURE

## Opening flow
New Fit Report begins with internal LikeSized discovery only:

1. **Scan barcode** — searches LikeSized's catalog/known identifiers only.
2. **Search / enter item manually** — searches LikeSized canonical Brands/Product aliases first.

No SerpAPI call occurs from ordinary member intake.

## If the exact Product exists
- member selects the clean canonical Product;
- reviewed Product facts may be prefilled/locked;
- the member completes their personal garment/Fit Report;
- a specific incorrect Product fact may be reported with **Report an issue / This is incorrect**;
- disagreement becomes evidence/flagging, never a silent overwrite.

## If the Product does not exist
The member uses the short manual fallback.

The submission creates/persists:
- the member's garment submission;
- the member's Closet/Fit Report evidence;
- best-known identity/evidence entered by the member;
- a pending catalog candidate or association to an existing pending candidate.

It **does not directly create a canonical Product**.

The member can immediately continue using the garment/Fit Report while the Product remains unresolved.

When catalog resolution later identifies the Product:
- map the member's garment submission/Fit Report to the correct canonical Product;
- do not rewrite the member's immutable historical body state or personal Fit Result;
- preserve the original submission/evidence/audit trail.

## Required Fit Report information order
The controlled Fit Report information remains:
1. **Brand / Make** — required; canonical search first, best-known manual fallback when unresolved.
2. **Item / Model** — required; canonical Product search first, best-known manual fallback when unresolved.
3. **Garment Type** — required.
4. **Garment-specific controlled questions** — zero-to-four as defined by the one canonical taxonomy; each displayed question starts blank and requires a physical selection; **Not sure** is always last and records no positive claim.
5. **Color family** — required controlled value.
6. **Size** — required structured size; selector starts at **Choose your measurement system** with no default size/system.
7. **Overall Fit Result** — required: Too Small / Snug / Just Right / Relaxed / Too Big.
8. **Condition** — required: New / Used / Altered.
9. **Fit Photo** — optional, deliberately kept with important Fit Report evidence.
10. **Fit notes** — optional, deliberately kept with important Fit Report evidence.

Then a clear optional evidence break:

**Want to help us identify/build this item?**
Everything below is optional and can help LikeSized/admin resolve or enrich the catalog record.

Optional order:
1. **Retail link**
2. **UPC / Barcode** — hidden/omitted when already captured by scanner; scanned value is retained behind scenes.
3. **Manufacturer Style / Article Number**
4. **Material / Fabric Composition** — controlled multi-material selection; percentages optional when explicitly known.
5. **Product Photo** — clear photo of the item by itself; separate from Fit Photo.
6. **Department** — controlled.

For unresolved garments, all optional shared facts remain **submission/candidate evidence** until the Product is safely resolved.

## Barcode rules
- scan searches LikeSized only;
- known barcode → resolve to the known canonical Product;
- unknown barcode → keep it on the pending garment submission/candidate and continue manual fallback;
- do not force rescan/retyping;
- unknown barcode does not create a Product by itself;
- barcode conflicts become identity/review evidence.

# PENDING CATALOG CANDIDATES — LOCKED

Member submissions may aggregate into backend catalog candidates without destroying the underlying individual submissions.

Required lifecycle meanings:

### Verified Catalog Item
A sufficiently resolved canonical Product available as the clean catalog identity.

### Pending Product
One or more member garment submissions exist, but Product identity has not been sufficiently resolved.

### Needs Enrichment
Base Product identity is largely understood, but useful shared facts such as image, retailer links, identifiers, Department/material/attributes, or cleaner naming remain incomplete.

### Needs Review
Ambiguous identity, possible duplicate, conflicting facts/identifiers, suspicious external result, or another issue requires admin judgment.

### Merged
A pending candidate/submission group was mapped into an already-existing canonical Product. `Merged` is candidate-resolution history, not another Product.

If a candidate is genuinely new, the catalog-resolution layer creates **one** canonical Product and maps applicable submissions to it.

## Demand-prioritized enrichment
Admin queue priority should default heavily toward real member demand.

Examples:
- unresolved candidate with 37 member submissions should generally rank above a one-off obscure item;
- submission count/frequency, recency, flags, and number of affected Fit Reports may contribute to priority;
- admins can still manually select/override queue order.

This allows catalog effort to compound where it benefits the most members.

# DUPLICATE PREVENTION / ALIASES — REQUIRED CATALOG FOUNDATION

## Hidden aliases
Reviewed hidden aliases normalize common spelling/punctuation/typo variants without creating duplicate public Brands/Products.

Examples:
- `Levis`
- `Levi's`
- `Levi’s®`
- capitalization/punctuation variants

Once proven equivalent, those should resolve to one canonical Brand.

Product aliases may similarly retain reviewed model-name variants.

## Product identity signals
Potential evidence includes:
- explicit existing Product selection;
- canonical Brand/aliases;
- cleaned Item/Model name;
- UPC/barcode where identifier scope is understood;
- manufacturer Style/Article Number where identifier scope is understood;
- Garment Type;
- Department/fit context;
- controlled garment characteristics;
- retailer URLs/listings;
- reviewed product images/descriptions;
- SerpAPI research evidence.

## Conservative identity rule
Different manufacturer Style/Article IDs do **not** automatically mean different base Products; they may identify colors/variants/SKUs.

Likewise, a shared broad model word does **not** automatically mean the same Product.

Examples discovered during benchmark research include families containing meaningful distinctions such as:
- standard vs Shrink-to-Fit;
- standard vs Selvedge;
- standard vs Wide;
- standard vs EasyOn;
- men's vs women's vs kids;
- different dress constructions sharing a family name;
- different jacket/shoe constructions sharing broad model wording.

Never strip fit-changing modifiers blindly.

## Duplicate outcomes
Catalog resolution should broadly produce:
1. **Safe existing match** → attach/map to existing Product.
2. **Possible duplicate / ambiguous** → flag for admin; no automatic merge.
3. **Genuinely new** → catalog-resolution path may create one canonical Product.

## Merge
Admin merge must preserve:
- member garment submissions;
- Fit Reports and immutable Fit Profile-version links;
- aliases;
- identifiers;
- retailer listings;
- Product evidence;
- photos where valid;
- review/audit history.

## Split
Admin must be able to split an incorrectly combined Product/candidate and move the appropriate submissions, Fit Reports, identifiers, listings and evidence without silent loss.

# FIELD CONFLICT / CONSENSUS RULES

A Fit Report never wholesale-replaces another Fit Report.

Personal garment evidence remains personal/historical:
- Size
- Color of that garment
- Fit Result
- Condition
- Fit Photo
- Fit notes

Shared Product facts resolve field by field.

Rules:
- one member's claim is evidence, not unquestionable truth;
- repeat submissions by the same member do not count as independent agreement;
- independent agreement may strengthen/corroborate a value;
- competing material values flag review;
- when disagreement may indicate two distinct Products/variants, duplicate/split review takes precedence over a simple vote;
- admin can verify/override/lock known Product fields/descriptions;
- locked facts cannot be overwritten by later member evidence;
- later disagreement remains visible/auditable evidence;
- reopening a locked fact requires authorized audited admin action.

# FLAGS — OWNER-LOCKED REQUIRED SYSTEM

Flags/queues must distinguish the reason for review rather than putting every issue in one pile.

Required flag families:

## 1. Possible Duplicate
Created when two Brands/Products/candidates appear potentially equivalent but evidence is not strong enough for safe automatic mapping/merge.

Examples/signals:
- typo/punctuation Brand variants;
- similar normalized Item/Model names;
- shared barcode/identifier evidence;
- same retailer URL;
- multiple member submissions that appear to describe one Product;
- SerpAPI cluster suggesting the same base Product.

## 2. Conflicting Product Fact
Field-level competing Product claims such as:
- Brand identity;
- Item/Model;
- Garment Type;
- controlled attributes;
- Department;
- material;
- manufacturer Style/Article Number;
- description or other shared Product fact.

## 3. Ambiguous Catalog Identity / Needs Review
Used when the candidate cannot yet be confidently mapped or created, including broad/generic model names or external research showing multiple materially different Products.

## 4. Reported / Spam Content
Member/admin moderation flags for:
- inappropriate Fit Photos;
- inappropriate Product Photos;
- inappropriate Outfit content;
- spam garment submissions;
- spam Fit Reports;
- abusive/inappropriate content where the supported moderation surface allows it.

## 5. Retail/Identifier Conflict
May be a subtype of Product conflict/duplicate review when:
- same normalized retailer URL appears on apparently different Products;
- UPC/identifier conflicts with current mapping;
- listing evidence indicates candidate may belong elsewhere.

Flags never directly rewrite Product truth or delete content.

Every admin resolution must be auditable.

# ADMIN — CATALOG + MODERATION ACCESS

Only explicitly authorized admins may use administrative surfaces.

Required primary admin tabs/queues:

1. **Catalog Enrichment**
   - Pending Product
   - Needs Enrichment
   - demand/submission count
   - last submitted/researched
   - cached SerpAPI availability
   - research status

2. **Conflicting Product Facts**
   - field-level conflicts
   - competing values
   - independent support counts/evidence provenance

3. **Possible Duplicates / Identity Review**
   - suspected duplicate Brands/Products/candidates
   - ambiguous Product identity
   - side-by-side evidence

4. **Reported / Spam Content**
   - reported photos/content
   - spam submissions/Fit Reports

5. **Review / Audit History**
   - append-only record of admin actions, mapping/merges/splits/locks/removals/dismissals/research decisions.

## Admin catalog powers
Admin must be able to:
- inspect all pending submissions contributing to a candidate;
- inspect member-supplied identifiers, Product photos, retailer URLs and controlled facts;
- see demand/submission count;
- inspect cached external research;
- trigger SerpAPI research manually or in controlled batches;
- compare candidate ↔ existing Product;
- map a candidate/submissions into an existing Product;
- create one new canonical Product after sufficient review;
- merge duplicates;
- split wrongly combined records;
- add reviewed Brand/Product aliases;
- override/verify/lock a canonical Product field or description;
- reopen a lock through an audited action;
- append/dedupe legitimate retailer listings;
- mark invalid/dead listings appropriately without erasing provenance;
- dismiss false duplicate/conflict flags;
- remove inappropriate Product/Fit/Outfit photos/content where authorized;
- remove spam garment submissions/Fit Reports while preserving accountable moderation history.

# SERPAPI — ADMIN RESEARCH ENGINE ONLY

## Role
SerpAPI is discovery/enrichment assistance for admins.

It is not:
- member-facing intake;
- Product identity authority;
- a second catalog;
- permission to insert raw Google Shopping titles as Products;
- permission to create one Product per color, size, retailer or Google `product_id`.

## Admin batch research
Admin must be able to select unresolved/enrichment candidates and run SerpAPI research in batches.

The batch system must:
1. normalize intended queries;
2. dedupe equivalent queries within the batch;
3. check LikeSized's private SerpAPI cache first;
4. reuse cached responses whenever suitable;
5. clearly indicate cached vs newly fetched research;
6. call SerpAPI only for missing/authorized-refresh queries;
7. respect configurable usage caps/warnings;
8. preserve every successful response for future reuse;
9. never treat a successful batch search as automatic Product approval/creation;
10. allow admin to inspect clusters/results and choose the correct resolution action.

## Cache rules
Private SerpAPI cache is reusable research evidence.

Before a paid call:
- normalize query;
- look for equivalent cached query/research;
- use cache when suitable;
- refresh only when an authorized admin chooses and the reason justifies spending another call.

Failed/no-useful-result searches should also be cacheable with a shorter freshness policy so repeated members/admins do not immediately burn the same search again.

## Cap protection
SerpAPI is convenience, never dependency.

Admin research must remain safe when the monthly cap is approached/reached.

Implement configurable thresholds such as:
- warning threshold;
- critical threshold;
- hard external-search stop.

If the cap is reached, normal member intake and pending-candidate creation must continue unaffected.

# COMPLETED SERPAPI BENCHMARK — EXPERIMENTAL EVIDENCE

An owner-approved live benchmark was run against the exact 150 starter entries across all 10 starter groups.

Recorded benchmark outcome:
- 150/150 first-pass Google Shopping searches completed;
- 5,901 raw Shopping listings were captured in the reusable private discovery cache;
- no member-facing SerpAPI intake was enabled;
- the temporary benchmark writer was later shut down/removed from the active write surface;
- the cached responses remain reusable research evidence.

The benchmark confirmed:
- Google Shopping routinely returns the same underlying garment multiple times across retailers/colors/sizes;
- Google `product_id` cannot be treated as LikeSized Product identity;
- many clean model searches can provide useful admin research;
- broad/generic fashion names frequently return several genuinely different Products and require review;
- conservative cluster-first resolution is safer than raw-title insertion or aggressive fuzzy merge.

The benchmark did **not** authorize SerpAPI to create Products or become member-facing intake.

# STARTER 150 — CURRENT DIRECTIVE

The owner-supplied 150 starter entries remain part of launch preparation and must not be forgotten.

Current reconciliation:
- keep/load the 150 starter Brand/Model/garment-group entries in the database/research pipeline;
- do not invent Color, Department, material, identifiers, descriptions, retailer links or other facts merely to make them look complete;
- specific, sufficiently reviewed entries may become clean canonical selectable Products;
- broad/generic/ambiguous entries exposed by the benchmark must be treated as Pending / Needs Enrichment / Needs Review until resolved rather than falsely presented as verified exact Products;
- reuse the already-cached SerpAPI benchmark results for these entries before spending another search.

The earlier branch migration seeds the 150 as provisional Products for replay/history. The later submission-first reconciliation migration reclassifies them into catalog candidates and removes only empty/unreferenced provisional seed Products. Any starter Product that already gained real evidence must be preserved and reviewed rather than destructively erased.

Do not rewrite/delete an already-applied migration. Use a later canonical migration/data-state transition where required.

# RETAILER LISTINGS + SHOPPING — OWNER LOCKED

## One-to-many retailer listings
A canonical Product may have zero, one, or multiple valid retailer destinations.

Rules:
- append/dedupe; do not overwrite one retailer with another;
- validate/normalize member-provided retailer URLs and preserve the clean provider-independent destination;
- members never need to provide an affiliate-formatted URL;
- preserve original retailer URL/provenance;
- pending submission retailer URLs remain candidate evidence until Product mapping;
- when mapping is resolved, reviewed legitimate URLs may be attached to the correct canonical Product;
- same URL apparently attached to different Products creates identity/duplicate review evidence;
- dead/invalid links may be marked inactive later without erasing history;
- a valid retailer does not need to be affiliate-monetizable to remain a valid shopping destination.

## Conditional shopping UI
- **Zero valid retail links:** no cart/Shop action renders. No disabled placeholder or dead-end control.
- **Exactly one valid retail link:** the cart/Shop action routes directly to that retailer.
- **Multiple valid retail links:** the cart/Shop action opens a compact retailer picker for that exact canonical Product.
- show a clean retailer name such as Nordstrom, Macy's, or Levi's; do not use the raw URL as the shopping label.
- do not silently choose or rank a retailer because it pays LikeSized a larger commission. Future ordering may use shopper-value signals such as exact variant match, reliable availability, or price when trustworthy.

Where a valid destination exists, the approved garment action set is:
**Like + Wishlist + Shopping Cart/Shop**.

Apply the same zero/one/multiple-retailer behavior consistently to:
- garment imagery/cards/details where approved;
- Product/Garment detail;
- Fit Report/Product **Shop Here** equivalent;
- Wish Locker;
- Gift Lists;
- other approved shopping surfaces.

Like/Wishlist/Shopping/Notify remain distinct tap targets where present.

## Skimlinks / affiliate monetization — ROADMAP LOCKED
After canonical retailer-listing behavior is stable:
- integrate/audit Skimlinks or an owner-approved equivalent aggregator; direct affiliate-program overrides may be added later without changing canonical retailer identity;
- preserve the original clean retailer URL beneath affiliate routing;
- affiliate/click-source tracking may identify the LikeSized source surface but must never expose private body measurements to retailers/affiliate providers;
- audit then-current disclosure/privacy/cookie/merchant eligibility requirements before production;
- commission never changes Match, recommendation, Product identity, retailer choice, search relevance or ranking;
- locked disclosure copy: **“LikeSized may earn a commission from purchases made through our shopping links.”** Display it unobtrusively but visibly wherever required for the affiliate shopping experience.

# CONTROLLED GARMENT TAXONOMY — PRESERVE

Explore and New Fit Report share one canonical taxonomy. No parallel category/type/style systems.

Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- Shoes

Accessories are not V1.

The owner-approved specific garment Types and zero-to-four controlled question mappings remain locked in `lib/garment-taxonomy.ts` / `docs/V1_PRODUCT_SPEC.md` and must be validated against the database vocabulary.

Global question behavior:
- displayed question starts blank;
- user must physically select an answer;
- **Not sure** is always last;
- Not sure is no positive catalog claim;
- Color is separate and required;
- no active V1 stretch field/filter;
- Material is optional controlled evidence only and does not automatically become a Match input or Explore filter.

# FIT / MATCH PRODUCT TRUTH — PRESERVE

## Core promise
**See what fits people built like you.**

## Privacy/body state
- exact current/historical body measurements remain private;
- current-person Match and historical-garment Match are separate contexts;
- Fit Reports attach immutable `fit_profile_version_id` body state;
- later body edits never rewrite historical garment evidence.

## Following vs Fit Twin
- Following is member-controlled;
- Fit Twin is system-generated within the followed set from strong current-person Match quality;
- one canonical `follows` graph;
- initial threshold remains configurable, currently 85% Overall Match;
- actions: Follow / Following / Unfollow;
- public count: Followers;
- no Save-as-Fit-Twin graph/actions.

## Fit Result
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is **no current V1 1–5-star Fit Rating UI**.

## Match semantics
- Match % = garment-relevant body similarity, not probability a garment fits;
- current-person body Match is symmetric;
- confidence is qualitative where exposed: High / Good / Limited;
- missing optional measurements reduce refinement/confidence rather than inventing values;
- Preferred Fit translates recommendation only; it does not alter Match %, Fit Twin status or historical body state;
- derived proportions are private refinement only, total influence max 8%, final movement max ±4 points;
- Chest/Full Bust stay distinct;
- shoes retain Foot Length dominant / Foot Width secondary calibration;
- outerwear may use modest layering tolerance; suit jackets/blazers remain more precise;
- Altered evidence remains history but excluded from normal recommendation evidence;
- Stretch is not an active V1 member input/filter.

## Recommendation hierarchy
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

`Would Buy Again` does not affect size recommendation/confidence.

**Pending/unmapped garment submissions must not count as exact canonical Product evidence until safely mapped.**

## Help Me Size It
Fallback only:
1. strong normal same-product evidence → normal evidence; no Help Me Size It;
2. useful but limited evidence → useful reports first, smaller fallback;
3. no meaningful close matches → fallback CTA may become primary.

Reuse the canonical recommendation engine. Never create a second sizing engine or invent a size.

# EXPLORE / BROWSE — OWNER-LOCKED DESIGN

- canonical route `/explore`; `/browse` compatibility redirect only;
- Garments | Outfits;
- My Fit Matches | All;
- fresh Explore defaults My Fit Matches;
- Garments My Fit Matches: 75%+ garment-specific historical Match;
- Outfits My Fit Matches: 75%+ creator current Overall Match;
- tiers: 90–99 → 85–89 → 80–84 → 75–79;
- within tier: Match % → unseen/freshness → recency → likes/popularity;
- carousel 8;
- initial results 24;
- Keep Browsing +24;
- strict Category → Type → Type questions → Brand → Item → Color filtering;
- no silent filter relaxation;
- Search spans Garments/Outfits/People;
- ordinary Product search returns one canonical Product result, not each wearer/Fit Report;
- unresolved pending submissions do **not** appear as duplicate pseudo-Products in ordinary catalog search;
- query relevance primary, catalog trust tie-breaker;
- compact mobile suggestions;
- separate Product/wearer/Like/Wishlist/Shop/Notify tap targets;
- no blank image state;
- no stars.

# LIKELOCKER / WISH LOCKER / GIFT LISTS

LikeLocker is private saved fashion, not people.

Tabs:
- Garments
- Outfits
- Wish Locker

Ordinary Product Like, Outfit Like and purchase intent remain distinct.

LikeSized Gift Lists remain roadmap-locked after Product/retailer/save/recommendation foundations:
- owner-approved wanted Products;
- confidence-gated recommended size;
- no raw measurements;
- owner-controlled sharing;
- insufficient confidence → say so, do not invent size;
- eligible retail/affiliate links allowed without influencing sizing/ranking.

# OUTFITS / STYLE FEED — V1 RETAINED

- Outfits remain in V1;
- use existing owned Closet garments; no duplicate Product/taxonomy system;
- owned Outfits → My Closet;
- other-member Outfit discovery → Explore;
- followed-person Outfit activity → Style Feed;
- Outfit likes contribute Style Likes; garment/Product likes do not;
- Following drives Style Feed; Fit Twin designation is not a second subscription;
- no V1 DMs/Stories/Reels/creator payouts/sponsorship marketplace unless separately approved.

# PUBLIC HOMEPAGE / HELP / FAQ — REQUIRED MEANING

Public homepage remains useful logged out and keeps FAQ inline.

Catalog FAQ must explain:
- LikeSized maintains a controlled community-built catalog;
- members search the LikeSized catalog first;
- if an item is not yet known, they can still log it through the manual fallback;
- unresolved submissions can be researched/resolved later without blocking the member;
- independent member evidence can improve/conflict with shared facts;
- admins resolve ambiguous Product identity rather than letting raw external search results become Products;
- SerpAPI is an admin research tool, not the member-facing catalog authority.

Also cover before Beta:
- measurement privacy;
- Match %;
- current-person vs historical garment Match;
- People My Size;
- Following vs Fit Twin;
- Private vs Shared Closet;
- Fit Photo/Product Photo behavior;
- Fit Result/no stars;
- Help Me Size It;
- LikeLocker/Wish Locker;
- Outfits/Style Feed;
- retailer/affiliate behavior;
- immutable historical try-on body state;
- Gift Lists if implemented.

# PHASE 6.5 — FULL V1 PRODUCT SURFACE + NAVIGATION AUDIT

**This remains the master Phase 6.5 roadmap. The catalog/intake work is an insertion into it, not a replacement roadmap.**

## CURRENT OWNER-PRIORITY INSERT — complete before returning to remaining page audits

### 6.5 INSERT A — Submission-first intake — AUTOMATED FOUNDATION VERIFIED
The branch implementation through `5632c05...` passed the complete automated gate. Owner desktop/mobile interaction review is still required before this insert is accepted as complete.

Target/checklist:
- internal LikeSized Product/barcode search only — implemented/tested at source boundary;
- exact Product selection path — implemented;
- manual fallback creates garment submission/pending candidate, **not a canonical Product** — implemented and DB-tested;
- member Fit Report/Closet remains usable while pending — implemented and DB-tested;
- preserve scanned unknown barcode on submission — implemented/safeguarded;
- canonical Brand/Product suggestions/aliases — Brand aliases and reviewed Product aliases integrated/safeguarded;
- required controlled-question behavior: blank default + Not sure last — safeguarded;
- size-system blank default — safeguarded;
- exact information ordering — safeguarded;
- optional Retail/UPC/Style/Material/Product Photo/Department evidence — implemented in intake foundation;
- existing Product field-level issue reporting — retained;
- pending-candidate mapping without rewriting historical Fit Report/body state — DB-tested with narrow authorized NULL→canonical resolution exception;
- remove/retire active member-facing external-import remnants — safeguarded;
- full desktop/mobile owner Preview interaction review — **STILL REQUIRED**.

### 6.5 INSERT B — Reconcile starter 150 — REPLAY FOUNDATION VERIFIED / ITEM REVIEW REMAINS
- all 150 owner-supplied starter entries remain preserved in the research/enrichment pipeline;
- existing 150-search SerpAPI cache remains reusable;
- no invented metadata;
- reconciliation migration `20260822162100_reclassify_starter_seed_as_candidates.sql` reclassifies empty/unreferenced research seeds into candidates and preserves referenced/evidenced Products;
- complete fresh migration replay passed;
- specific-entry classification/enrichment of ambiguous starter candidates is **still ongoing roadmap work**, not falsely marked complete.

### 6.5 INSERT C — Pending candidate + flag architecture — FOUNDATION VERIFIED
Verified foundation includes:
- garment-submission/pending-candidate data model;
- aggregation of equivalent unresolved submissions without destroying originals;
- statuses: Pending / Needs Enrichment / Needs Review / Merged plus canonical verified Product state;
- demand/submission-count prioritization foundation;
- hidden Brand/Product aliases and reviewed Product-alias reuse in intake search;
- typed catalog review flags including possible duplicate, Product-fact conflict, ambiguous identity, spam/report and retail/identifier conflict;
- admin-only candidate → existing Product mapping;
- reviewed new canonical Product creation through resolution layer;
- immutable Fit Profile snapshot/Fit Result preservation during first-time pending Product resolution;
- accountable resolution audit.

Still required under this insert:
- full Product-to-Product merge behavior/tooling;
- audited split behavior/tooling;
- richer automated duplicate detection beyond current flag/RPC foundation.

### 6.5 INSERT D — Admin catalog dashboard — PARTIAL FOUNDATION
Implemented/available on branch:
- demand-prioritized catalog candidates;
- catalog flags/evidence visibility;
- map candidate to existing Product;
- reviewed new-Product creation;
- existing content/Product moderation foundation and audit history.

Still required:
- complete queue/tab UX across Catalog Enrichment / Conflicting Product Facts / Possible Duplicates / Reported-Spam / Audit History;
- merge/split controls;
- complete Brand/Product alias management UX;
- complete spam garment-submission/Fit Report controls;
- complete Product-photo transfer/removal workflows;
- full field lock/reopen UX where not already covered by existing moderation foundation.

### 6.5 INSERT E — Admin SerpAPI research + cache/batching — CACHE/BENCHMARK DONE, ADMIN WORKFLOW NOT BUILT
Done:
- private SerpAPI discovery cache exists;
- exact 150-item benchmark is stored and reusable;
- benchmark writer is retired;
- no member-facing SerpAPI path exists.

Still required:
- admin-only single and selected-batch research controls;
- normalized query dedupe/cached-vs-new indicators;
- usage warning/critical/hard-stop thresholds;
- admin cluster/review workflow;
- accountable research action records;
- no direct SerpAPI → `products` write path.

### 6.5 INSERT F — Retail aggregation + monetization — ROADMAP REMAINS
- zero/one/multiple retailer behavior exactly as locked above;
- append/dedupe, never overwrite valid alternatives;
- unresolved URLs stay candidate evidence until mapping;
- conditional Shop action;
- retailer picker for multiple valid destinations;
- Skimlinks/approved equivalent after retail behavior stable;
- disclosure/privacy/compliance audit;
- commission never affects fit/search/ranking/retailer choice.

After the current insert is owner-accepted, continue every audit below.

## 6.5.1 Navigation / information architecture audit
- LikeSized logo = Home;
- one fixed notification bell + one Menu;
- Discover: Explore / People My Size / My Circle / LikeLocker;
- My Closet: My Closet / New Fit Report / New Outfit;
- Account: Fit Profile / Settings / Help / FAQ / Sign Out;
- no obsolete Fit-Twin-owned social navigation.

## 6.5.2 Explore / Discover hub
Audit/finalize:
- Garments/Outfits;
- My Fit Matches/All;
- ranking/tiers/batches;
- strict dynamic taxonomy filters;
- search behavior;
- pending items excluded as pseudo-Products;
- conditional Shop;
- mobile mini-browser;
- image fallbacks;
- Help Me Size It/Notify fallback states;
- real canonical data only.

## Deferred Phase 6.4 desktop Fit Profile verification
Still required after current owner-priority work / Explore review:
- desktop layout;
- edit/review/confirm/save;
- Added/Changed/Removed;
- revisit treatment.

Phase 6.4 is not complete until owner desktop verification.

## 6.5.3 My Circle / Following + Fit Twins
- Following user-controlled;
- Fit Twin system-generated inside followed set;
- one `follows` graph;
- Follow/Following/Unfollow;
- safe Match context;
- Followers count;
- Fit Twin badge/filter where useful;
- Style Feed driven by Following;
- privacy.

## 6.5.4 Preserve V1 Outfits
- preserve canonical Outfit tables/storage/likes/Closet links;
- no parallel system;
- classification inherited from attached garments;
- maintain privacy.

## 6.5.5 My Closet audit/redesign
- owned garments + outfits;
- All/Garments/Outfits;
- useful cards/grid;
- sharing controls/status;
- Update Fit / Tried It Again;
- Fit History only with multiple observations;
- pending catalog state must not stop member use;
- member sees sensible status if garment is still unresolved;
- preview Shared appearance;
- responsive desktop/mobile.

## 6.5.6 New Fit Report usability gate
Do not mark complete until submission-first flow, database behavior, owner review and canonical docs agree.

## 6.5.7 Fit Result / satisfaction audit
- physical Fit Result only;
- no 1–5-star UI;
- legacy names compatibility only.

## 6.5.8 Member Profile + Shared Closet
- avatar/name/bio;
- Follow/Following;
- Overall/Tops/Bottoms current-person Match context;
- Shared Closet as garment-evidence surface;
- Outfit presentation;
- search/filter;
- privacy.

## 6.5.9 Shared Closet garment cards
- image;
- Brand + Item/Model when resolved;
- sensible pending identity presentation when unresolved without fabricating canonical Product;
- size;
- historical Match;
- Fit Result;
- note/context;
- conditional Shop only when canonical listing is valid;
- clear current-person vs historical Match semantics.

## 6.5.10 Image fallback hierarchy
1. member's Fit Photo where supplied/allowed;
2. valid member-contributed Product photo where appropriate;
3. canonical Product/variant image;
4. garment-type LikeSized fallback.

Never use another member's Fit Photo as generic Product image. No blank image areas.

## 6.5.11 Garment Detail interaction
- image/gallery/source context;
- canonical Product identity or honest unresolved state;
- size + Fit Result;
- historical Match;
- Product facts;
- Help Me Size It when appropriate;
- Other Fit Reports;
- People Like You Who Wore This;
- retailer listings/conditional Shop;
- Like/Wishlist;
- no stars.

## 6.5.12 People Like You Who Wore This
For one canonical Product:
- top 3–5 unique Shared wearers;
- historical Match to immutable try-on snapshots;
- one member not repeated in top slots solely via repeat observations;
- show Match/size/Fit Result/context;
- no raw measurements.

## 6.5.13 Canonical Product page
- one canonical identity;
- Brand + Item/Model;
- reviewed shared facts/trust/conflict state;
- Product images;
- trustworthy colors/variants;
- same-product Fit Reports/wearers;
- Help Me Size It;
- Other Fit Reports;
- Like/Wishlist/Shop;
- multiple retailer listings;
- See All Fits;
- admin conflict/duplicate integration behind authorized surfaces.

## 6.5.14 Retail links / commerce
- zero valid listings → no Shop;
- one valid listing → direct retailer route;
- multiple valid listings → retailer picker;
- no overwrite of alternate valid links;
- clean retailer names, not raw URLs;
- avoid fake stale price claims;
- Skimlinks/affiliate layer;
- locked disclosure/privacy/compliance;
- commission has zero fit/search/ranking/retailer-choice influence.

## 6.5.15 LikeLocker architecture
- saved fashion, not people;
- Product Like vs Wish Locker distinct;
- Outfit saves/likes distinct;
- no competing Favorites destination;
- Shop conditional.

## 6.5.16 LikeLocker provenance
- optional source observation provenance;
- if source Shared evidence becomes private/deleted, inaccessible evidence disappears;
- Product save may remain;
- no duplicate save graph.

## 6.5.17 LikeLocker view
Garments / Outfits / Wish Locker with useful image, identity, fit context, accessible provenance, remove/save controls, conditional Shop.

## 6.5.17A LikeSized Gift Lists
After Product/retailer/LikeLocker/recommendation foundations:
- owner-approved wanted Products;
- confidence-gated recommended size;
- owner-controlled sharing;
- no raw measurements;
- insufficient data → no invented recommendation;
- eligible affiliate listings allowed without influencing sizing/ranking;
- shopping uses the same zero/one/multiple-retailer behavior;
- sharing/revoke/privacy audit.

## 6.5.18 V1 Outfits social-layer audit
- one Outfit photo;
- 1–6 unique owned Closet garments with fit evidence unless changed later;
- caption;
- likes;
- LikeLocker save;
- Outfit Type + Season;
- garment tags with safe Product/size/Fit Result/historical Match context;
- tag → canonical detail where resolved;
- pending garment handling must not fabricate a Product link;
- privacy;
- Followers + Style Likes social proof without overriding fit relevance.

## 6.5.19 Style Feed audit
- followed-person Shared garment activity;
- fit updates/retries;
- Outfit posts;
- real evidence destinations;
- Fit Twin context only;
- Outfit-only mute does not unfollow/hide garment evidence.

## 6.5.20 Explore/Browse Search audit
- canonical Brand/Product/model/identifier search;
- Garments/Outfits/People;
- one canonical Product result, not wearer duplicates;
- unresolved submissions do not become Product results;
- compact mobile suggestions;
- member discovery distinct from People My Size;
- Product Like/Wishlist/Shop;
- Help Me Size It fallback;
- member Follow/Following + derived Fit Twin badge.

## 6.5.21 Help / FAQ audit
Explain at minimum:
- measurement privacy;
- Match %;
- current-person vs historical Match;
- People My Size;
- Following vs Fit Twin;
- Private vs Shared Closet;
- Fit/Product Photo behavior;
- Fit Result/no stars;
- Help Me Size It;
- LikeLocker/Wish Locker;
- Outfits/Style Feed;
- submission-first catalog behavior;
- unresolved garment still usable;
- Product conflict/duplicate review;
- admin-side SerpAPI research/canonical safeguards in user-appropriate language;
- retailer/affiliate shopping disclosures where required;
- immutable historical try-on state;
- Gift Lists if implemented.

## 6.5.22 Remaining product surfaces + admin/moderation audit
Audit all remaining V1 surfaces:
- Fit Profile;
- Settings;
- Notifications;
- homepage;
- login/signup/auth confirmation;
- forgot/reset password;
- logged-out states;
- empty/error states;
- profile/account editing;
- avatar behavior;
- desktop/mobile;
- admin auth/navigation;
- Catalog Enrichment queue;
- Conflicting Product Facts queue;
- Possible Duplicates/Identity Review;
- SerpAPI batch research controls/cache/cap state;
- merge/split;
- field/description lock + reopen;
- inappropriate Fit/Product/Outfit photo removal;
- spam garment submission/Fit Report removal;
- audit history.

## 6.5.23 Terminology cleanup
Primary current vocabulary:
- Explore
- People My Size
- My Circle
- Following / Followers
- Fit Twin / Fit Twins only as system-generated designation
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
- Product / canonical Product
- garment submission / pending Product only where status must be shown
- LikeSized Gift Lists

Remove stale Save-as-Fit-Twin, Favorites, star-rating, member-facing external import, Channel3/retail-import jargon and any wording that implies raw member/API data directly creates canonical Product identity.

## 6.5.24 Full Preview verification before Phase 7
Phase 6.5 is not complete until source + migrations + docs + verification + owner review agree.

Verify at minimum:
- desktop/mobile;
- multiple users;
- privacy;
- navigation/bell;
- Explore Garments/Outfits + scopes/filters/search/ranking/batches;
- mobile mini-browser safety;
- Product/wearer/Like/Wishlist/Shop/Notify targets;
- image fallback;
- 75% My Fit Matches / separate Fit Alert semantics;
- Help Me Size It fallback;
- recommendation hierarchy;
- taxonomy;
- Brand/Item autocomplete;
- internal barcode lookup;
- exact Product select path;
- unknown manual submission path does not directly create Product;
- pending member garment remains usable;
- starter 150 classification/seed reconciliation;
- controlled questions blank + Not sure last;
- size no default;
- exact Fit information ordering;
- optional evidence section;
- candidate aggregation/demand priority;
- Product field conflict/corroboration;
- duplicate aliases/candidates/merge/split;
- admin locks;
- Product/Department/material/photo evidence;
- SerpAPI admin-only research;
- cache reuse;
- batch dedupe/cap handling;
- no direct SerpAPI → Product creation;
- immutable Fit history/body links;
- no stars;
- LikeLocker/Wish Locker/Outfit Likes;
- Following/Fit Twin separation;
- Outfits/Style Feed;
- same-product matched wearers;
- multiple retailer listings;
- zero/one/multiple retailer Shop behavior;
- Skimlinks/affiliate behavior if implemented;
- locked affiliate disclosure if implemented;
- Gift Lists if implemented;
- content/spam moderation;
- no stale member-facing external catalog-import implementation;
- no parallel active implementation;
- branch/source hygiene;
- canonical integrity;
- TypeScript;
- focused tests;
- production build;
- complete fresh migration replay;
- DB privacy/behavior/security tests.

# PHASE 7 — V1 BETA END-TO-END VERIFICATION
Begin only after Phase 6.5 is complete.

Representative Beta verification:
- signup/login/auth/recovery;
- Fit Profile;
- Explore;
- People My Size;
- Following/My Circle/Fit Twin;
- Shared Closet;
- canonical Product/Garment Detail;
- Help Me Size It;
- LikeLocker/Wish Locker;
- retailer/affiliate behavior;
- New Fit Report exact-select + pending-manual paths;
- pending candidate resolution/remapping;
- Fit History/Update Fit;
- Outfits;
- Style Feed;
- privacy;
- recommendations;
- no stars;
- Gift Lists if implemented;
- duplicate/conflict/admin moderation;
- admin SerpAPI research/cache/caps;
- mobile UX;
- CI/migration/privacy/security verification.

# BRANCH / SOURCE HYGIENE — REQUIRED BEFORE PRODUCTION

## Active-line rule
- PR #47 is the sole primary active implementation line unless the owner explicitly changes it.
- `main` is the deployed baseline while PR #47 is in progress; it is not a competing future and must not be used as the base for new side work.
- no retry/fixed/v2/owner-decision side branch as a substitute for canonical correction.

## Historical branch salvage rule
- inventory historical/retry/verification branches as **ACTIVE / SAFE TO REMOVE / HOLD**.
- old branches may be inspected as historical evidence but their files must never be copied wholesale into current source.
- any unique useful work must be extracted deliberately and adapted to current canonical files before the old branch is classified safe.
- preserve applied migration history; supersede runtime behavior with later canonical migrations rather than rewriting history.
- the completed SerpAPI benchmark cache is retained as research evidence; temporary benchmark write surfaces are retired.
- production promotion requires explicit owner authorization after full verification.

## Branch salvage ledger — IN PROGRESS / NO DELETIONS YET
**ACTIVE**
- `main` — deployed production baseline only.
- `correct-grouped-menu-layout` / PR #47 — sole active development lineage.

**HISTORICAL, APPROVED CONTENT SALVAGED**
- `owner-decision-retail-affiliate-plan` / closed PR #48 — approved retail decisions are already represented on PR #47; do not build from this branch.

**SAFE-TO-REMOVE CANDIDATES VERIFIED SO FAR**
These refs were compared to `main` and showed `ahead_by = 0`; no unique commit content exists beyond what is already in `main`:
- `FINAL-NO`
- `NO-MORE`
- `STOP-TEST`
- `THIS-IS-BAD`
- `agent/canonicalize-migration-version`
- `auth-supabase`
- `closet-live`
- `fit-profile-persistence`
- `fit-twins`
- `outfits-live`
- `people-live-matches`
- `product-fit-live`
- `search-discovery`
- `phase-6-4-diagram-assets`
- `phase-6-4-diagram-assets-check`
- `phase-6-4-diagram-assets-check2`

**HOLD / UNIQUE OR DIVERGED CONTENT SEEN**
Do not remove until the unique content is explicitly classified against current canon:
- `agent/phase-0-replay-verification` — one unique README-only commit was observed;
- `fix/high-res-measurement-guides` — unique workflow content exists and must be deliberately classified;
- `phase-6-4-fit-profile-help` — unique `tmp-placeholder.txt` artifact observed; likely disposable, but still HOLD until final branch pass records the decision;
- all other historical refs not yet explicitly listed above remain HOLD by default until compared.

Physical branch-pointer deletion has **not** been performed. Git history is preserved regardless; branch cleanup must never precede salvage classification.

# CANONICAL RECOVERY — COMPLETE / PRESERVE

Owner approved canonical recovery on 2026-08-21 after severe source-of-truth drift was audited.

Preserved historical references:
- recovery baseline: `main` `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`;
- recovery branch: `canonical-recovery-2026-08-21`;
- PR #43 merged recovery as `426881a57d859be8bd9bf1382d358cc238a3d58e`;
- preserved Fit Match audit branch `fit-match-engine-audit`, PR #36, head `fcf87fa1782f2ed704a4856c99487900b1445db5`;
- preserved Phase 6.5 navigation decisions branch `phase-6-5-1-navigation-ia`, head `b56f663199a9f7252c27cddfebfdae710230cb5e`;
- preserved old Browse preview branch `phase-6-5-2-browse-preview`, head `2d150bc3d7238a50d80cac98d6ddde92c310ae3b`.

Recovery classification remains:
- valid Fit Match/recommendation, migrations, tests, provenance/condition work: RECOVERED/ADAPTED;
- stale normally-worn-size UI, old History notice, Save-as-Fit-Twin, stars and active stretch direction: SUPERSEDED/EXCLUDED;
- stale Phase 6.5 placeholder Browse/Help/LikeLocker implementations: OBSOLETE, decisions recovered where valid;
- synthetic Browse preview source: OBSOLETE/NOT RECOVERED;
- deferred Closet/responsive work remains later audit work.

Historical recovery verification remains preservation evidence only; current PR #47 must pass its own final gate.

# COMPLETED PRODUCTION WORK TO PRESERVE

## Phase 6.4 mobile Fit Profile / navigation
Preserve:
- mobile Fit Profile save/load/edit/revisit/review/confirm;
- Added/Changed/Removed review state;
- compact revisit hero;
- two-column mobile Review Changes + scroll-to-top;
- username initial setup in Fit Profile; later changes in Settings;
- previous username reservation for 30 days;
- no anatomical plausibility hard stops beyond valid-positive technical validation;
- normally-worn-size UI removed while historical records may remain;
- approved measurement wording/help;
- owner-verified combined `public/measurement-guides/crotch-guide.png` unchanged;
- Mobile Menu closes on navigation/outside interaction.

Desktop Fit Profile verification remains intentionally unfinished.

## Outfit photo pipeline
- PR #44 merged as `04319c76469819c6178eeb31a3e3f3c987e7694c` after owner authorization;
- new Outfit photo processing creates optimized WebP display/feed assets;
- original is not stored;
- recorded Vercel deployment READY.

## Public homepage content
- PR #45 merged as `0961ca6635f790debdbcf7df0b194247caa3eaf4` after owner authorization;
- The Loop → What LikeSized Does → FAQ preserved;
- Get Inspired CTA preserved;
- catalog FAQ meaning must be updated to current submission-first controlled-catalog direction during current/6.5.21 work.

## Live schema + grouped navigation repair
- recovered migrations were applied in locked order during prior repair;
- PR #46 merged as `ec987f5a22575b54806341615309a150558467dc`;
- recorded Vercel deployment READY;
- grouped one-Menu + fixed-bell navigation and My Circle destination preserved.

# PR #47 HISTORICAL CHECKPOINTS — PRESERVATION EVIDENCE ONLY

Earlier PR #47 heads had green CI/Preview checkpoints, including previously recorded:
- `95e8e34f0e9eb7194f4b3d784c5a3887c5bfc1aa` → CI #381 / Preview READY;
- `4c17951e8848e9106bf01c15a84aea376f09228e` → CI #385 / Preview READY;
- `bf36b673c071f9b93304401b0df7da68bfb2b87d` → CI #396 / Preview READY.

Those remain preservation evidence only. The current submission-first direction is instead proven by the verified checkpoint recorded above.

# CURRENT CONSOLIDATION IMPLEMENTATION — BRANCH ONLY / VERIFIED CHECKPOINT

PR #47 contains the verified submission-first checkpoint foundation, including:
- `20260822162000_submission_first_catalog_foundation.sql` — nullable unresolved Product links, pending catalog candidates, garment submissions, typed catalog flags, resolution audit, Product aliases, pending-product photo storage, member submission RPC, duplicate-flag RPC, and admin map/create/status resolution RPCs;
- `20260822162100_reclassify_starter_seed_as_candidates.sql` — keeps all 150 starter entries in the enrichment pipeline and removes only empty/unreferenced provisional research-seed Products after reclassification;
- `20260822162200_allow_pending_fit_report_rls.sql` — preserves owner/Closet consistency while permitting unresolved `NULL Product ↔ NULL Product` Fit Reports;
- `20260822162300_allow_authorized_pending_product_resolution.sql` — preserves historical Fit Report immutability while allowing the private authorized catalog resolver to assign a canonical Product/variant exactly once to a previously unresolved report;
- New Fit Report server action has a known-Product path and an unresolved submission path that does not directly insert a Product;
- unresolved Closet/Fit Report rows remain usable and display supplied Brand/Model plus catalog-review state;
- moderation/admin surface includes demand-prioritized catalog candidates, typed flags, evidence, map-to-existing and reviewed new-Product creation actions;
- barcode identity disagreement evidence includes the `barcode` field;
- reviewed Brand aliases and Product aliases resolve back to canonical Products in internal member intake search;
- member intake contains no SerpAPI/Google Shopping discovery path;
- private SerpAPI research cache and completed 150-item benchmark remain preserved;
- `AI_REPOSITORY_RULES.md` now explicitly blocks stale-base parallel product branches during an active unreconciled lineage.

## What the verified automated checkpoint proves
At implementation commit `5632c05ee452ff00547265ca51dd60186c403034`:
- canonical integrity/drift guard passed;
- TypeScript passed;
- recommendation/Fit Match/Outfit/homepage/navigation/Explore/My Circle/LikeLocker/controlled-intake/moderation safeguards passed;
- production Next.js build passed;
- every canonical migration replayed successfully on a fresh local Supabase database;
- all canonical DB tests passed;
- `submission_first_catalog.test.sql` proves unresolved member intake does not create a Product, equivalent submissions aggregate without erasing originals, ordinary members cannot see the admin candidate queue or one another's pending submissions, authorized admin mapping resolves to one canonical Product, original submissions remain audit evidence, and the immutable Fit Profile snapshot/Fit Result survive mapping;
- the matching Vercel Preview is READY.

## What is **not** complete yet
Do not overstate the checkpoint. Still required before this consolidation can be promoted to production:
- owner desktop/mobile interaction review of the real New Fit Report flow, specifically scanner opening, exact Product selection, clear-and-search-again behavior, unknown/pending fallback, known-field locking/issue reporting, and responsive layout;
- live Supabase migration application/promotion plan; the new submission-first migrations have not been declared/applied as the production schema checkpoint here;
- full Product-to-Product merge and audited split behavior/UI;
- complete admin queue/tab UX and complete Brand/Product alias management UX;
- admin SerpAPI single/batch UI/server workflow, cache indicators and usage-cap controls;
- full spam garment-submission/Fit Report moderation coverage;
- complete Product-photo moderation/transfer behavior;
- browser-level behavioral regression automation beyond the current source/DB safeguards;
- complete branch salvage ledger across every remaining historical branch and physical removal of only those refs proven safe;
- specific enrichment/review of ambiguous members of the starter 150;
- remaining Phase 6.5 page-by-page audits and deferred desktop Fit Profile review.

# EXACT NEXT ACTION — AFTER VERIFIED SUBMISSION-FIRST CHECKPOINT

1. Documentation-only reconciliation commit `5a76852953829119bd514bd0a157278895ba9f6c` is verified: LikeSized CI #467 / run `32587165951` — **SUCCESS**; matching Vercel Preview `dpl_GgkUpUxjhXk4KRkn8BzyPHSictq7` — **READY**. This checkpoint is complete; do not repeat it unless the branch head changes.
2. Perform owner desktop/mobile interaction review of PR #47 New Fit Report against the verified submission-first architecture.
3. Fix only review failures on PR #47; do not create another branch.
4. Finish the historical branch salvage ledger. Classify every remaining ref as ACTIVE / SAFE TO REMOVE / HOLD before any physical cleanup.
5. Finish the minimum admin catalog tooling needed for practical operation: complete queue visibility, merge/split/alias controls, and spam/Product-photo moderation gaps.
6. Build the admin-only SerpAPI single/batch research workflow using the existing private cache first, with dedupe and usage caps; SerpAPI remains incapable of directly creating Products.
7. Review/enrich ambiguous starter-150 candidates using the existing cache before spending new calls.
8. Add browser-level regression coverage for owner-locked intake interactions where practical.
9. Re-run canonical integrity → typecheck → focused tests → production build → complete fresh Supabase replay → DB tests on the final consolidation head.
10. Produce one exact-SHA READY Preview for final owner desktop/mobile review and determine the live Supabase migration/promotion sequence.
11. **STOP before production.** Do not merge PR #47 to `main`, apply/promote the production schema, or promote Vercel production until the owner explicitly authorizes the final consolidation promotion.
