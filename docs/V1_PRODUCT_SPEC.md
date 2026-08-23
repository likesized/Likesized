# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current product/fit architecture. Roadmap/status/deployment history live in `docs/AI_MASTER_LOG.md`. Database behavior/privacy and implementation debt live in `supabase/schema_contract.md`.

Current-state wording here must match owner-approved product meaning. Superseded behavior belongs in Git history, not as competing current truth.

# 1. Privacy and body-state architecture — LOCKED

- `fit_profiles` is a small profile shell; raw measurements live in normalized owner-private structures.
- Immutable Fit Profile versions preserve historical body snapshots.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` may advance as active matching/body-state evidence without rewriting original history.
- raw current/historical measurements and private size references are never exposed to other members.
- current-person Match and historical garment Match are separate contexts.

# 2. Current-person Match vs historical garment Match — LOCKED

1. **Current-person Match** compares the viewer's current body with another member's current body. Overall/Tops/Bottoms and Fit Twin designation live here.
2. **Historical garment Match** compares the viewer's current body with the relevant body state attached to a historical Fit Report.

Match % means **garment-relevant body similarity**, not probability a garment will fit.

# 3. Following vs Fit Twin — LOCKED

- Following is member-controlled.
- Fit Twin is **system-generated** among followed members from strong current-person Match quality.
- one canonical `follows` graph exists; there is no separate user-controlled Fit Twin graph.
- member actions are Follow / Following / Unfollow.
- public relationship count is Followers.
- initial Fit Twin threshold is configurable and currently starts at 85% Overall Match.
- My Circle and Style Feed are Following-driven; Fit Twin is designation/filter/context only.

# 4. Controlled community catalog — LOCKED

LikeSized uses one controlled community-built canonical Product catalog.

> **Members contribute garments and Fit Reports. Members do not directly create canonical Products. Controlled system rules may automatically promote a community candidate once the locked evidence threshold is satisfied.**

A canonical Product is the normalized identity used for Product search, exact-Product evidence, Product details, variants, identifiers, Product photos, retailer listings, and reviewed shared facts.

A member submission is evidence. Manual Brand/Model text, one barcode, retailer URL, Style/Article Number, Product Photo, raw external search result, Shopping `product_id`, color/size/retailer listing, or another single weak signal does not by itself create or define canonical Product truth.

Product identity confidence is independent of intake method. Matching manual submissions, barcode-assisted submissions, or a mixture of both may support the same normalized Brand + Item + Garment Type candidate.

Locked Product-identity thresholds:
- **1 distinct confirming member → Provisional.**
- **2 distinct confirming members → Corroborated.** The candidate may provide narrow safe New Fit Report assistance but is still not an ordinary Product/search result.
- **5 distinct confirming members → automatic canonical Product promotion is allowed** when identity is unambiguous and conflict rules permit it. Automatic promotion creates/maps a **Corroborated** Product, never a Verified Product.
- **Verified** remains stronger authoritative/admin-reviewed evidence and is never granted merely from member count.

A genuine identity conflict does not erase prior confirmations. One conflict may coexist with five confirmations and still permit automatic promotion while retaining a review flag. Two or more independent identity conflicts freeze automatic promotion at Corroborated + Needs Review. Conflicts equal to or greater than confirmations are always Needs Review. Size, color, retailer URL, legitimate alternate barcode, Fit Result, materials, and other report/variant differences are not identity conflicts by themselves.

From the ordinary member's point of view, Corroborated and Verified Products use the same simple known-Product flow and safe editable defaults. The difference is backend trust: Verified authoritative evidence can outrank conflicting community-derived evidence.

**SERPAPI RESULT ≠ CANONICAL PRODUCT.**

# 5. New Fit Report intake — LOCKED

Member flow:

**Search LikeSized → select exact Product if we have it → otherwise add the garment quickly and keep going.**

Ordinary member intake never calls SerpAPI.

## 5.1 Known Product
When exact Product exists:
- select canonical Product;
- prefill reviewed/learned safe Product facts where available;
- member disagreement is evidence/review, not silent overwrite;
- save Fit Report against that Product.

## 5.2 Unknown Product
When Product is unresolved:
- use short manual fallback;
- persist Closet item/Fit Report immediately;
- preserve best-known identity/enrichment evidence;
- create/associate pending catalog candidate;
- keep member garment usable while review is pending;
- do not directly create a canonical Product from one member submission.

A second distinct matching member may corroborate the unresolved candidate whether either member used a barcode or both entered the item manually. A uniquely matched Corroborated candidate may then supply safe editable intake defaults such as the learned broad size-system kind, while remaining excluded from ordinary Product search until canonicalized.

Authorized admin resolution may map the submission to an existing Product or create a genuinely new canonical Product. Separately, the controlled five-member system threshold may automatically map/create an unambiguous Corroborated Product. Both paths preserve original member evidence and immutable body snapshots.

## 5.3 Barcode — OWNER LOCKED

- Scanner supports ordinary retail UPC/EAN 1-D barcodes; QR is not required.
- Barcode lookup checks LikeSized's canonical Product identifiers, unique provisional Product-to-barcode evidence, and unresolved candidate barcode evidence. Ordinary member intake does **not** call SerpAPI or an external barcode catalog.
- A unique recognized barcode pauses on **Is this the item?** before identity fields are accepted.
- **Yes — this is the item** on a canonical Product loads that Product and continues known-Product flow.
- **Yes** on an unresolved candidate prefills previously seen Brand / Item / Garment Type and continues the pending candidate flow.
- **No — enter manually** switches to manual entry while retaining the scanned barcode as evidence.
- unknown barcode retains the scan and continues manual fallback.
- multiple conflicting identities for the same barcode are never auto-selected.

Barcode confidence is separate from Product confidence:
- one Product may legitimately have multiple barcodes/UPCs, including different retailer or packaging identifiers;
- the first distinct member who associates a new barcode with an already-known Product creates a **Provisional Product-to-barcode relationship**;
- a second distinct member with corresponding Product Fit Report evidence corroborates that Product-to-barcode relationship;
- once corroborated, that barcode may become a canonical Product identifier for future direct recognition;
- a new barcode on a known Product does not create a new Product and is not an identity conflict merely because another valid barcode already exists;
- the same barcode accumulating credible evidence for competing Products is an identity conflict and must be flagged rather than silently reassigned.

Product confidence itself does **not** require a barcode. Manual, barcode-assisted, and mixed submissions use the same distinct-member Product thresholds in Section 4.

# 6. New Fit Report information structure — LOCKED

Primary Fit Report information:
1. Brand / Make — required.
2. Item / Model — required.
3. Garment Type — required; Category derives automatically.
4. zero-to-four Type-specific controlled physical questions — each begins blank; **Not sure** is last and records no positive physical claim.
5. Color family — required.
6. Size — required structured size.
7. Overall Fit Result — Too Small / Snug / Just Right / Relaxed / Too Big.
8. Condition — New / Used / Altered.
9. Fit Photo — optional.
10. Fit notes — optional.

Optional Product/candidate evidence:
- Retail link
- UPC / barcode when not already scanned
- Manufacturer Style / Article Number
- Material / Fabric Composition
- Product Photo
- Department

Fit Photo is personal wear evidence. Product Photo is separate catalog/candidate evidence. A private member Fit Photo is never promoted into generic Product imagery.

# 7. Size-system behavior — CURRENT

Supported structured size families include alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation, freeform fallback, and Not sure.

- unresolved/new Product with no learned default starts at **Choose your measurement system**;
- a uniquely matched Corroborated unresolved candidate may preselect the unique most-common prior **broad size-system kind** from distinct-member submissions;
- known Product may preselect its unique most-common prior broad size-system kind;
- tie/no usable history produces no preselection;
- member can change the suggested kind;
- actual size always starts blank and is never copied from another member;
- nested sizing-system choices such as US/UK/EU remain separate and are not implied by the broad-size default unless separately approved.

# 8. Counted Fit Report identity — OWNER LOCKED

A counted Fit Report represents a **distinct body-fit state for one physical garment situation**, not a chronological episode.

For a resolved Product, identity dimensions are:
- Member
- exact canonical Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body-fit state

Color/variant listing, retailer URL, UPC, Style/Article Number, Product Photo, material evidence, Department evidence, Fit Result, Condition, Fit notes, and Fit Photo do **not** independently create another counted Fit Report.

## 8.1 Objective garment-answer fingerprint
- applicable physical controlled answers are included;
- `Not sure` is stored but excluded from positive physical fingerprint;
- Intended Fit is report/filter metadata only and excluded from physical fingerprint;
- a genuine physical controlled-answer change can create a distinct report.

## 8.2 Body-state relevance source
Use the **same garment-to-measurement relevance source as Fit Match**, currently `private.product_match_measurements(product_id)`. No second hard-coded report relevance list.

Therefore an irrelevant measurement cannot split that Product's reports. Height/Weight do not split a T-shirt unless the canonical Product match map actually uses them.

## 8.3 The 2% state rule
For an established relevant measurement:

`abs(new - baseline) / abs(baseline) >= 0.02`

means materially different for report-state identity.

- under 2% → compatible state/report;
- 2% or more → different from that candidate state;
- direction is symmetric;
- if an older existing report already represents the returned state, reuse/update that state rather than creating a chronological duplicate.

## 8.4 Blank/reintroduced measurements
- blank→newly filled relevant measurement enriches a compatible report rather than creating a new one;
- value→blank does not create a report or erase established evidence;
- missing optional values reduce precision/confidence rather than inventing values.

## 8.5 Rolling body-state baseline
Accepted under-2% relevant values become the report's active comparison baseline. Original `fit_profile_version_id` remains immutable; `match_fit_profile_version_id` and private baseline may advance.

# 9. Fit Report update behavior — LOCKED

A compatible existing report is updated in place. Latest report-scoped values replace/update prior values for that counted state, including Fit Result, Intended Fit metadata, Condition, notes, and Fit Photo.

Catalog evidence may accumulate separately without forcing duplicate counted reports.

Member-facing states:
- **FIT REPORT ADDED** — genuinely new counted state;
- **FIT REPORT UPDATED** — compatible existing state reused;
- **FIT REPORT SAVED · ITEM UNDER REVIEW** — member work preserved while Product identity requires review.

# 10. Garment Type identity conflicts — LOCKED

Garment Type is Product identity, not a report-level majority-vote field.

When member-selected Type conflicts with a known Product:
- preserve report unresolved/pending rather than mutate Product;
- Fit Report remains `product_id = NULL` until resolved;
- candidate becomes Needs Review;
- canonical Product is flagged for catalog review;
- pending report does not count as normal exact-Product evidence;
- admin must correct Product, map to another Product, or dismiss/reject disputed identity.

# 11. Product evidence and material defaults — CURRENT

Shared Product facts resolve field by field; one Fit Report never wholesale-replaces another.

Product identity confidence is separate from report-scoped Product facts. A Product becoming Corroborated or automatically canonical does not turn size, color, material, Fit Result, the controlled garment-question answers, condition, notes, or another member's photos into unquestioned Product truth.

## Material/Fabric Composition
- member material default uses complete **exact submitted recipes/compositions**;
- never average percentages into a composition nobody submitted;
- unique most-common exact recipe wins;
- tie clears non-verified member-derived default;
- verified authoritative Product material evidence outranks member-derived defaults;
- updating same counted Fit Report replaces that report's prior recipe vote.

Current recipe-frequency selection counts valid Fit Reports. Product-identity distinct-member thresholds do not silently alter material voting semantics.

# 12. Pending catalog candidates — LOCKED

Candidate workflow lifecycle:
- Pending Product
- Needs Enrichment
- Needs Review
- Merged

Workflow status and identity confidence are separate. Candidate identity evidence may be Provisional or Corroborated while still unresolved. Verified identity remains authoritative/admin-reviewed.

Corroborated unresolved candidates remain excluded from ordinary Product search, but an exact unique New Fit Report identity may use safe learned defaults. At five distinct confirming members, the system may automatically map/create a Corroborated canonical Product if the candidate has no blocking ambiguity. Five confirmations plus one identity conflict may still promote while preserving review visibility; two or more independent identity conflicts block automatic promotion.

Queue priority should focus first on preventing weak uncertain identities from accumulating bad downstream data:
- Provisional/barely Corroborated identity conflict → **high priority**;
- Corroborated/auto-promoted Product with multiple or growing conflicts → **medium priority**;
- Verified Product with one isolated member conflict → **low priority** while retaining the evidence;
- barcode collisions across Products, multiple independent conflicts, conflicts approaching confirmations, or signs of an incorrect merge always escalate.

Low priority means safe to review later, never delete/ignore the evidence.

# 13. Duplicate prevention / aliases / resolution — LOCKED

Resolution attempts to reuse existing canonical Product before creating a new one.

Reviewed Brand/Product aliases normalize proven spelling/punctuation/capitalization/naming variants without creating duplicate identities.

No fuzzy title, raw external title, retailer listing, color, size, Shopping product ID, or ambiguous barcode may force a Product merge.

Admin merge/split must preserve Fit Reports, immutable body links, submissions, identifiers, aliases, listings, evidence, valid photos, and audit history.

An already-promoted Product is not deleted or demoted merely because one later conflict arrives. Keep it usable, preserve the conflict, flag it for review, and only change canonical identity through the audited resolution process.

# 14. Admin catalog + moderation — LOCKED TARGET

Only explicitly authorized admins may access administrative controls.

Required operating areas:
1. Catalog Enrichment
2. All Products / Identity Status
3. Conflicting Product Facts
4. Possible Duplicates / Identity Review
5. Reported / Spam Content
6. Review / Audit History

The all-Products admin view must expose, as applicable: Product/candidate identity status, distinct confirming-member count, identity-conflict count, known barcodes and each barcode's confidence, retailer links, open flags, evidence history, and whether canonicalization came from admin review or automatic community promotion. Filters must support at least Needs Review, Corroborated, auto-promoted, Verified, and Has Conflicts.

Admin review ordering follows the confidence-aware priority rules in Section 12. A Verified Product with one isolated conflict should not outrank a weak candidate whose identity could become entrenched incorrectly.

Admin must ultimately support candidate inspection/demand ordering, map/create, merge/split, aliases, field verification/lock/reopen, photo/content moderation, spam handling, retailer/identifier conflict resolution, and accountable history.

# 15. SerpAPI — ADMIN RESEARCH ONLY

SerpAPI is admin discovery/enrichment, never ordinary member intake or Product authority.

Admin research should check private cache first, dedupe queries, distinguish cached/new results, respect caps/hard stop, preserve responses, require explicit resolution, and never write raw results directly into Product truth.

External barcode-provider enrichment is not part of current member flow. A zero-write admin test/probe may be evaluated separately.

# 16. Starter catalog — CURRENT

Owner-supplied starter catalog remains launch-preparation research data. Specific reviewed entries may be canonical Products; broad/ambiguous entries remain candidates. Do not invent missing metadata.

# 17. Controlled garment taxonomy — LOCKED

Explore and New Fit Report share one canonical taxonomy.

Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- Shoes

Accessories are not V1. Specific definitions live in `lib/garment-taxonomy.ts` and must agree with database vocabulary.

# 18. Fit Result — LOCKED

Physical values:
- Too Small
- Snug
- Just Right
- Relaxed
- Too Big

There is no current V1 1–5-star Fit Rating UI. Bad fits are useful evidence and do not reduce body Match %.

# 19. Preferred Fit — RETIRED

Old member-level **Preferred Fit by garment type** is not current V1 behavior.
- removed from Fit Profile UI;
- does not alter Match %, Fit Twin, counted report identity, or current recommendation behavior;
- historical rows may remain preserved/inert.

This is distinct from per-report **Intended Fit**, which remains report/filter metadata while excluded from physical identity.

# 20. Deep Fit Match architecture — LOCKED

- Match is symmetric body similarity.
- recommendation may privately use viewer-vs-historical-wearer direction for relevant measurements.
- raw signed deltas never reach clients.
- exposed confidence is qualitative: High / Good / Limited.
- missing optional measurements reduce refinement/confidence rather than generating fake values.
- derived body proportions are private small refinement only: total influence max 8%, final Match movement max ±4 points.
- Chest and Full Bust remain distinct.
- Bras retain specialized Full Bust + Underbust + High Bust handling.
- shoes use Foot Length dominant / Foot Width secondary calibration.
- New and Used are normal sizing evidence; Altered remains history but is excluded from normal recommendation evidence.

# 21. Recommendation hierarchy — LOCKED

**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

Pending/unmapped submissions do not count as exact canonical Product evidence until mapped. `Would Buy Again` does not affect size recommendation/confidence.

# 22. Help Me Size It — LOCKED FALLBACK

Help Me Size It is fallback sizing assistance and reuses the canonical recommendation engine. No second sizing engine/table. Never invent a size when evidence is insufficient.

# 23. Explore / Search — OWNER-LOCKED DESIGN

- `/explore` canonical; `/browse` compatibility redirect only;
- Garments | Outfits;
- My Fit Matches | All;
- fresh Explore defaults My Fit Matches;
- Garments My Fit Matches: 75%+ garment-specific historical Match;
- Outfits My Fit Matches: 75%+ creator current Overall Match;
- tiers 90–99 → 85–89 → 80–84 → 75–79;
- within tier: Match → unseen/freshness → recency → popularity;
- strict taxonomy filters with no silent relaxation;
- ordinary Product results dedupe to canonical Product;
- unresolved submissions are not ordinary Product results;
- no blank image state and no stars.

# 24. People Like You Who Wore This / evidence counting

Fit summaries may count all legitimate distinct Fit Report situations, including multiple valid states from one member. Member-facing wearer lists should avoid repeating one person across top slots solely because they have multiple observations. Evidence counting and unique-wearer presentation are separate.

# 25. Product actions / notifications / shopping — OWNER LOCKED

The four Product actions are independent:

- **Heart — Like Locker:** add/remove Product from Like Locker and contribute to Product popularity/like count. No notifications and no shopping intent.
- **Shooting star — Wish Locker:** add/remove Product from private Wish Locker shopping/wish list. No Like and no notifications.
- **Bell — Match notification:** Product-only one-shot alert. It does not Like, Wish, or follow anyone. It subscribes the member to a future new Fit Report on that exact Product that reaches **75%+ historical garment Match with required measurement coverage**. After the qualifying alert fires, bell turns off until member enables it again.
- **Cart — Shop:** opens/selects a valid retailer destination. No Like/Wish/Bell side effects.

Product bell is not the same as person bell. Person bell may auto-follow; Product bell never does.

Retail behavior:
- zero valid listings → no cart/Shop action;
- one valid listing → direct retailer route;
- multiple valid listings → compact retailer picker;
- valid destinations append/dedupe, never overwrite each other;
- commission never affects Match, recommendation, Product identity, search rank, or retailer choice.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# 26. LikeLocker / Wish Locker / Gift Lists

LikeLocker is private saved fashion, not people.

Current intents remain separate:
- Product likes / Like Locker;
- Outfit likes;
- Wish Locker purchase intent.

Wish Locker is surfaced inside Like Locker and uses the shooting-star action language. Adding to Wish Locker never adds a Like or notification. Product Like never adds a Wish or notification.

Gift Lists remain roadmap-locked after Product/retailer/save/recommendation foundations: owner-approved wanted Products, confidence-gated recommended size, no raw measurements, owner-controlled sharing, same retailer-shopping rules.

# 27. Outfits / Style Feed — V1 RETAINED

- Outfits use owned Closet garments; no duplicate Product/taxonomy system.
- owned Outfits live in My Closet;
- other-member Outfit discovery lives in Explore;
- followed-person Outfit activity lives in Style Feed;
- Outfit likes contribute Style Likes; Product likes do not;
- Following drives feed; Fit Twin remains designation only.

# 28. Images / sharing

- Fit Photo is optional personal wear evidence and follows current shared evidence boundary.
- Product Photo is separate optional catalog/candidate evidence.
- never use another member's personal Fit Photo as generic Product image.
- New Outfit uploads use optimized WebP display/feed assets under deployed pipeline.

# 29. Public homepage / FAQ

Homepage remains useful logged out and keeps FAQ inline. Before Beta, public story must accurately cover measurement privacy, Match %, current-person vs historical Match, People My Size, Following vs Fit Twin, Fit/Product Photo behavior, Fit Result/no stars, Help Me Size It, LikeLocker/Wish Locker, Outfits/Style Feed, controlled catalog/manual fallback, unresolved item review, admin-side SerpAPI role, shopping/affiliate behavior, immutable historical try-on state, and Gift Lists if implemented.

# 30. Data-quality rule

**Controlled when possible. Normalize when necessary. Free text only when useful.**

Search/autocomplete prefers canonical Brands/Products and reviewed aliases before fallback. Identifiers/URLs normalize for matching while useful originals/provenance remain preserved.

For implementation status, owner re-audit order, production checkpoints, and exact next work, read `docs/AI_MASTER_LOG.md`.
