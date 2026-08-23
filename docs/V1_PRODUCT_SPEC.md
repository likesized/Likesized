# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current product/fit architecture. Roadmap/status/deployment history live in `docs/AI_MASTER_LOG.md`. Database behavior/privacy and implementation debt live in `supabase/schema_contract.md`.

Current-state wording here must match owner-approved product meaning. Superseded behavior belongs in Git history, not as competing current truth.

# 1. Privacy and body-state architecture — LOCKED
- `fit_profiles` is a profile shell; raw measurements live in normalized owner-private structures.
- Immutable Fit Profile versions preserve historical body snapshots.
- `fit_reports.fit_profile_version_id` is the immutable original try-on snapshot.
- `fit_reports.match_fit_profile_version_id` may advance as active matching/body-state evidence without rewriting original history.
- Raw current/historical measurements and private size references are never exposed to other members.
- Current-person Match and historical garment Match return safe derived scores/context only.

# 2. Current-person Match vs historical garment Match — LOCKED
1. **Current-person Match** compares the viewer's current body with another member's current body. Overall/Tops/Bottoms and Fit Twin designation live here.
2. **Historical garment Match** compares the viewer's current body with the relevant private body state attached to a historical Fit Report.

Match % means **garment-relevant body similarity**, not probability a garment will fit.

# 3. Fit Community, Following and Fit Twin — LOCKED
## Fit Community
- Member preference is **Men / Women / Both**.
- It is owner-private relevance metadata for people/wearer discovery, not a body measurement and not Product Department.
- It never changes Match %.
- People My Size and My Circle may default to the saved preference and allow a temporary view switch without rewriting it.
- The community belongs to the person wearing/posting the garment. Wearing a men's or women's Department item does not change the member's community.

## Following / Fit Twin
- Following is member-controlled.
- Fit Twin is **system-generated** among followed members from strong current-person Match quality.
- One canonical `follows` graph exists; there is no second user-controlled Fit Twin graph.
- Initial Fit Twin threshold starts at 85% Overall Match.
- My Circle and Style Feed are Following-driven; Fit Twin is designation/filter/context only.
- `/following` is compatibility-only and resolves to `/circle`.
- Signed-in `/` enters My Circle; logged-out `/` is the public homepage.
- Follow alone does not enable person notifications.

# 4. Controlled community Product catalog — LOCKED
LikeSized uses one controlled community-built canonical Product catalog.

> **Members contribute garments and Fit Reports. A clean, unique first member submission may be system-posted immediately as a Provisional Product; members still do not directly write canonical Product truth.**

A canonical Product is the normalized identity used for Product search, evidence, Product details, variants, identifiers, Product photos, retailer listings and reviewed shared facts.

## Four Product identity-trust tiers
Publishing and identity-trust strength are separate. A clean Product does not wait for five reports before it may appear.

- **Provisional — 1 distinct wearer.** A clean unique first submission may auto-post immediately.
- **Corroborated — 2–4 distinct wearers.** Independent wearer evidence strengthens the identity.
- **Established — 5+ distinct wearers.** The five-wearer milestone remains the stronger community-evidence tier.
- **Verified — authoritative/admin-reviewed.** It is never granted merely from community count.
- Repeated reports from one member do not manufacture distinct-member Product identity confidence.

The identity-trust tier is separate from field-level Product fact authority. Community wearer count does not silently verify Product description, material, Department, attributes or other facts.

A candidate is a staging/audit object, not a second public catalog. A candidate remains unresolved when a blocking ambiguity already exists—for example conflicting identity, competing exact Products, barcode/listing collision or another genuine duplicate signal. Clean candidates are materialized/mapped automatically instead of creating a routine admin queue.

## Later conflicts do not unpublish history
An already-posted Product is not automatically deleted, hidden, demoted or rewritten because a later member reports a problem. The Product remains usable while review evidence is retained unless an audited resolution changes its identity/status.

## Identity boundaries
Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, report-scoped physical answers, condition, notes, purchase context and legitimate alternate barcodes do not independently define a new base Product.

Fuzzy title similarity alone never forces a merge. Internal similarity/identifier/listing signals may create review flags, but reassignment/merge remains conservative and auditable.

**SERPAPI RESULT ≠ CANONICAL PRODUCT.** SerpAPI is admin research only.

# 5. Barcode relationship confidence — LOCKED
Barcode confidence is separate from Product confidence.
- Product identity does not require a barcode.
- First distinct member associating a new barcode with a known Product creates a **Provisional Product→barcode relationship**.
- A second distinct member with corresponding Product Fit Report evidence corroborates that relationship.
- Once corroborated, it may become a canonical `product_identifiers` relationship.
- One Product may have multiple legitimate barcodes.
- A second legitimate barcode is not an identity conflict merely because another barcode already exists.
- One barcode accumulating credible evidence toward competing Products is flagged and never silently reassigned.

## Scanner flow
- Supports normal retail UPC/EAN 1-D barcodes; QR is not required.
- Lookup checks canonical identifiers, unique provisional Product→barcode evidence and unresolved candidate evidence.
- Unique recognition pauses at **Is this the item?**.
- Confirmation card shows Brand, Item, Category/Type, **Yes — this is the item**, and **No — enter manually**.
- Scanner confirmation image priority is: **Product/catalog photo first → public/shared member Fit Photo second → default/placeholder if neither exists**.
- A member Fit Photo used as scanner fallback remains personal wear evidence only; it is not promoted into canonical Product imagery or Product truth.
- Physical garment questions stay in the Fit Report, not the barcode identity card.
- Unknown/no match continues manual fallback while retaining barcode evidence.
- Ambiguous barcode identities are never auto-selected.

# 6. New Fit Report intake — LOCKED
Ordinary member flow:
**Search LikeSized → select exact Product when available → otherwise add the garment quickly and continue.**

Ordinary member intake never calls SerpAPI.

## Main information order
1. Brand / Make — required.
2. Item / Model — required.
3. **Overall Category** — required.
4. **Specific Garment Type** — required and filtered to the selected category.
5. Department — optional.
6. Zero-to-four Type-specific controlled physical questions; **Not sure** is final and records no positive physical claim.
7. Color family — required.
8. Size — required structured size.
9. Overall Fit Result — Too Small / Snug / Just Right / Relaxed / Too Big.
10. Condition — New / Used / Altered.
11. Fit Photo — optional.
12. Fit Notes — optional.
13. Retail Link — optional.

## Optional Additional Information — collapsed by default
Exact order:
1. Purchased From — free-form with known-retailer suggestions.
2. Price Paid — non-negative normal currency decimals.
3. Purchase Method — Online / In Store / Received as a Gift.
4. Approx. Purchase Date — Month + Year.
5. UPC / barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.
8. Product Photo.

If scanner already captured a barcode, retain it and do not ask again. Submit remains below/outside the optional area.

## Purchase context
Purchased From, Price Paid, Purchase Method and Approx. Purchase Date describe **that member's acquisition of that Fit Report entry**.
- One counted Fit Report contributes at most one acquisition observation.
- Every new member/entry starts blank; no inheritance from another member/Product.
- Blank context creates no invented observation.
- Purchased From may link to an existing retailer by exact normalized match but does not create a retailer or Product retailer listing.
- Purchase context never changes Product identity, Match, recommendation, Product trust or retailer ranking.
- Retail Link is separate reusable Product/catalog evidence about where the Product can be bought.

## Final review
Before server submission show **Does this look right?** with main Fit Report information only: Brand/Item, Category, Garment Type, Department, controlled item details, Color, Size, Fit Result, Condition, Fit Photo added-state, Fit Notes and Retail Link when present.

Do not repeat Optional Additional Information there. Actions are **Go Back & Edit** and **Confirm Fit Report**. Nothing submits before confirmation.

# 7. Direct Product search vs discovery filters — LOCKED
Direct Product search is **global** across men's, women's and unisex Products. A user does not need to switch Fit Community or Department to find a matching Product by Brand, Item, alias, style number, SKU, UPC/barcode or retailer identifier.

Fit Community filters people/wearer relevance in social discovery. Product Department/taxonomy filters may narrow explicit browse/explore contexts when the user chooses them, but they do not silently suppress a direct textual Product search.

# 8. Public measurement FAQ copy — PENDING OWNER APPROVAL
A future FAQ may explain that complete, accurate measurements improve Match precision and that different garments emphasize different measurements. The exact public wording and any sex/body-specific measurement examples are **not approved for this deployment** and must not be published until the owner reviews the copy.

# 9. Product/item reporting and exception-driven review — LOCKED
Every published Product must expose one **Report this item** action. Initial reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A report creates/refreshes review evidence; it does not let the reporter directly rewrite Product truth.

LikeSized may also create review flags from conflicts and conservative internal signals such as possible duplicate names, competing identifiers/barcodes, reused retailer links, aliases or other identity evidence. Internal similarity is a flagging aid, never an automatic fuzzy merge.

## Review priority
Priority derives from the four Product identity-trust tiers plus independent evidence:
- **Provisional (1 wearer) → High** when a credible issue is flagged.
- **Corroborated (2–4 wearers) → High** when a credible issue is flagged; at this evidence level the conflict may still reveal an undiscovered Product problem.
- **Established (5+ wearers) → Low** for one isolated ordinary disagreement because a single entry error is more likely after substantial agreement; repeated independent signals escalate to Medium and then High.
- **Verified → Low** for one isolated ordinary member report; multiple independent reports/conflicts may escalate Medium/High.
- Competing barcode/Product claims, strong duplicate evidence or multiple identity conflicts may escalate regardless of current trust.

Low priority means review later, not discard the evidence.

# 10. Counted Fit Report identity — LOCKED
For a resolved Product, a counted Fit Report represents a distinct state for:
- Member
- exact Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body state

Fit Result, Intended Fit, Condition, Color, material, retailer URL, barcode, Style/Article Number, Department, notes, photos and purchase context do not independently create another counted report.

## Objective fingerprint
- physical controlled answers may participate;
- `Not sure` is stored but excluded from positive physical fingerprint;
- Intended Fit is filter/report metadata and excluded;
- a genuine objective physical-answer change may create a distinct state.

## Body relevance and 2% rule
Use the same Product measurement map as Match: `private.product_match_measurements(product_id)`.
For an established relevant measurement:
`abs(new - baseline) / abs(baseline) >= 0.02`
means materially different report state.

Under 2% is compatible. Blank→filled relevant values may enrich a compatible report. Value→blank does not erase established evidence. Accepted under-2% values may roll the active private comparison baseline while original `fit_profile_version_id` stays immutable.

# 11. Fit Report mutation direction — CLOSET AUDIT REQUIRED
The owner direction is to preserve original confirmed try-on evidence rather than allow unrestricted rewriting. Closet audit must classify fields as immutable historical evidence, add-missing enrichment, narrowly correctable with history, or later lifecycle observations.

Kept / Returned / Exchanged and after-use changes such as shrinkage/stretching belong to later dated lifecycle observations rather than silent rewrites of the original try-on report.

Do not introduce unrestricted Edit Item product meaning before this contract is settled.

# 12. Unified public Closet target — LOCKED
LikeSized has one canonical member Closet meaning, not separate My Closet and Shared Closet systems.
- Garments and Fit Reports are intended public member-facing content.
- Self view adds owner-only management controls to the same public content.
- Visitor view uses the same canonical garment/Fit Report foundation without owner controls.
- Raw body measurements, historical snapshots and private matching baselines remain protected.
- Legacy `closet_items.visibility` and private/shared RLS/UI are implementation debt to reconcile during Closet audit.

# 13. Controlled taxonomy — LOCKED
Top-level categories:
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Swimwear
- Intimates
- **Sleepwear & Lingerie**
- Shoes

Accessories are not V1. Specific definitions live in `lib/garment-taxonomy.ts` and must agree with database vocabulary.

## Sleepwear & Lingerie
Sleep Shirt is intentionally absent. Sweatpants remains Bottoms. Bra, Bralette, Sports Bra, Underwear and Shapewear remain Intimates.

Controlled types: Pajama pants, Pajama shorts, Pajama set, Nightgown, Robe, Chemise, Babydoll, Teddy, Corset & bustier, Costume lingerie. Each has no more than four controlled questions and automatic final **Not sure**.

Key locked details:
- Pajama set uses the printed whole-set size unless pieces are genuinely separate Products.
- Costume lingerie questions are Garment form, Top style, Bottom style and Structure / Support. Closure is intentionally omitted in favor of Structure / Support.

# 14. Product evidence boundaries — LOCKED
Shared Product facts resolve field by field; one Fit Report never wholesale-replaces another.

Product identity becoming Provisional, Corroborated, Established or Verified does **not** turn another member's Size, Color, Material, Fit Result, physical answers, Condition, Notes, purchase context or Fit Photo into unquestioned Product truth.

Material default uses complete exact submitted recipes/compositions, never averaged recipes nobody submitted. Verified evidence outranks member-derived defaults.

Garment Type is Product identity. A known Product Type conflict saves unresolved/reviewable evidence rather than mutating Product identity silently.

# 15. Size-system behavior — LOCKED
Supported structured families include alpha, numeric, waist×inseam, dress/work shirt, jacket, bra, shoe, length designation, freeform fallback and Not sure.
- Actual member size always starts blank.
- Known Product may preselect a unique learned broad size-system kind; member can change it.
- Exceptional unresolved Corroborated candidate may provide the same narrow safe default while it remains blocked from public Product identity.
- Nested US/UK/EU choices stay blank unless separately supported.

# 16. Fit Result — LOCKED
Physical values are Too Small / Snug / Just Right / Relaxed / Too Big.

There is **no current V1 1–5-star Fit Rating UI**. Bad fits remain useful evidence and do not lower body Match %.

# 17. Preferred Fit — RETIRED
Old member-level Preferred Fit by garment type is not current V1 behavior. It is absent from current Fit Profile UI and does not change Match %, Fit Twin or counted report identity. Historical DB rows may remain inert. Per-report Intended Fit is separate metadata.

# 18. Deep Fit Match architecture — LOCKED
- Match is symmetric body similarity.
- Recommendation may privately use directional viewer-vs-historical-wearer evidence for relevant measurements.
- Raw signed deltas never reach clients.
- Exposed confidence is qualitative: High / Good / Limited.
- Missing optional measurements reduce refinement/confidence rather than inventing values.
- Derived proportions are private small refinement only.
- Chest and Full Bust remain distinct.
- Bras retain specialized Full Bust + Underbust + High Bust handling.
- Shoes emphasize Foot Length, then Foot Width.
- New and Used are normal sizing evidence; Altered remains history but is excluded from normal recommendation evidence.

# 19. Recommendation hierarchy — LOCKED
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Recovered weights:
- Exact Variant 1.00
- Exact Product 0.94
- Product Family 0.82
- Similar Garments 0.70
- Brand + Garment Type 0.58
- Category Fit 0.42

Pending/unmapped submissions do not count as exact canonical Product evidence. `Would Buy Again` does not affect size recommendation/confidence.

# 20. Help Me Size It — LOCKED
Help Me Size It is fallback sizing assistance and reuses the canonical recommendation engine. There is no second sizing engine/table and no invented size when evidence is insufficient.

# 21. Explore / search — LOCKED DIRECTION
- `/explore` canonical; `/browse` compatibility only.
- Garments | Outfits.
- My Fit Matches | All.
- My Fit Matches eligibility begins at 75%+ relevant historical Match.
- Strict explicit taxonomy filters do not silently relax.
- Ordinary Product results dedupe to one canonical Product.
- Provisional/Corroborated/Established/Verified Products remain searchable unless rejected/otherwise explicitly moderated; unresolved candidates are not ordinary Product results.
- Direct textual Product search remains global as defined in Section 7.
- No blank image state and no star Fit Rating.

# 22. Product actions / notifications / shopping — LOCKED
Independent actions:
- Heart — Like Locker
- Shooting star — Wish Locker
- Bell — one-shot exact-Product Match notification
- Cart — Shop only when a valid retailer destination exists

No action silently performs another. Product bell is separate from person bell. One valid listing routes direct; multiple show a compact retailer picker; zero hides Shop. Commission never affects Match, recommendation, Product identity, search rank or retailer choice.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# 23. Outfits / Style Feed — V1 RETAINED
Outfits use owned Closet garments and the same Product/taxonomy system. Other-member Outfit discovery lives in Explore; followed-person activity lives in Style Feed. Outfit likes and Product likes remain separate.

# 24. Images — LOCKED
- Fit Photo = member wear evidence attached to the Fit Report/garment.
- Product Photo = separate catalog evidence.
- Product/catalog imagery is preferred on Product-identification surfaces.
- A public/shared member Fit Photo may be used only as the scanner **Is this the item?** fallback when no Product/catalog photo exists. That fallback never promotes the Fit Photo into generic/canonical Product imagery.

# 25. Admin catalog target — LOCKED
Admin must expose Products/candidates, identity-trust tier, distinct confirmation counts, open flags, flag priority, identifiers/barcode confidence, retailer links, evidence history and system-vs-admin resolution provenance.

Required review views/filters include at least Needs Review, Provisional, Corroborated, Established, Verified, Has Conflicts and priority.

Admin work is exception-driven: duplicate/identity conflict, incorrect information, member reports, content/photo problems, identifier/listing collisions and evidence disagreements—not mandatory approval of every clean new garment.

# 26. SerpAPI — ADMIN RESEARCH ONLY
SerpAPI checks private cache first, dedupes queries, respects caps and requires explicit resolution. Raw results never write directly to Product truth. Ordinary member search/intake/scanner does not use it.

# 27. Public homepage / FAQ — LOCKED
Homepage remains useful logged out; signed-in `/` enters My Circle. Published FAQ copy must be owner-approved and accurately explain current behavior without unverifiable competitor claims. The proposed measurement-specific men/women FAQ wording is pending owner review and is not part of this deployment.

# 28. Data-quality rule
**Controlled when possible. Normalize when necessary. Free text only when useful.**

For implementation status, production checkpoints, owner re-audit order and exact next work, read `docs/AI_MASTER_LOG.md`.