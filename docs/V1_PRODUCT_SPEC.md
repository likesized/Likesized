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
- A member profile photo, when uploaded, is public current identity. Outfit, Explore and comment surfaces resolve the member's current profile photo rather than snapshotting an old avatar onto historical content.
- City and State are required **private profile metadata** in the current setup/settings flow, not body measurements, not Match inputs and not public member-profile fields.
- City/State may support future privacy-safe aggregate insights such as regional wishlist demand, but individual member location is never exposed merely to produce those aggregates.

# 2. Current-person Match vs historical garment Match — LOCKED
1. **Current-person Match** compares the viewer's current body with another member's current body. Overall/Tops/Bottoms and Twin designation live here.
2. **Historical garment Match** compares the viewer's current body with the relevant private body state attached to a historical Fit Report.

Match % means **garment-relevant body similarity**, not probability a garment will fit.

Where a Match percentage is shown, LikeSized uses one universal visual tier treatment so members can read closeness at a glance without changing the numeric Match itself: **85–100 green, 70–84 blue, 50–69 amber, under 50 neutral gray**. Low Match is not an error state, so the universal Match treatment does not use red. Fit Twin / Tops Twin / Bottoms Twin designation remains a separate relationship label rather than replacing the percentage.

# 3. Fit Community, private profile location, Following and Fit Twin — LOCKED
## Fit Community
- Member preference is **Men / Women / Both**.
- It is owner-private relevance metadata for people/wearer discovery, not a body measurement and not Product Department.
- It never changes Match %.
- **People My Size** defaults to the member's saved Fit Community and may temporarily switch community without rewriting the saved preference.
- **Style Feed** is restricted to people the viewer already follows and does not use a separate Fit Community switch to hide followed people.
- The community belongs to the person wearing/posting the garment. Wearing a men's or women's Department item does not change the member's community.
- Fit Community is asked during first-time profile setup. After onboarding it is managed in Profile Settings, not My Measurements.

## Private City / State
- First-time Fit Profile setup requires **City + State** alongside the initial setup information.
- City and State are collected as a pair; the current application setup/edit flow requires both together.
- After the first Fit Profile is completed, City/State does **not** appear again on My Measurements. Later changes belong in Profile Settings.
- City/State remains private to the member at the ordinary application/data-access layer.
- The database may retain a null-pair compatibility state for historical rows, but that compatibility does not make City/State optional in the current member setup/settings UX.
- Future regional analytics may use this metadata only through separately designed aggregate/privacy-safe boundaries—for example “people in New York are wishlisting this Product”—without exposing which individual members live there.

## Following / Twin designation
- Following is member-controlled.
- Twin status is **system-generated** among followed members from strong current-person regional Match quality.
- One canonical `follows` graph exists; there is no second user-controlled Fit Twin graph.
- Tops Match and Bottoms Match qualify independently against the centrally configured strong-match threshold.
- **Fit Twin** requires both Tops Match and Bottoms Match to clear that threshold.
- **Tops Twin** means only Tops Match clears it. **Bottoms Twin** means only Bottoms Match clears it.
- Overall Match remains the visible general body-similarity score but **does not grant Twin status by itself**.
- **People My Size defaults to Twin-level discovery only.** Before someone is followed, a qualifying result may be described as a Fit Twin/Tops Twin/Bottoms Twin **Match** rather than implying a followed relationship already exists. **All Matches** is the alternate broader view.
- **Style Feed** is the Following-only Outfit inspiration surface. Its default relationship filter is **Fit Twins**; **All Following** is the alternate view. The two relationship choices appear at the top of the feed as the first feed control. The Fit Twins view includes followed Fit Twins, Tops Twins and Bottoms Twins.
- Style Feed does **not** show Body Match/Overall Match percentages on posts. The current Twin badge is sufficient relationship context there.
- Style Feed is chronological within the selected filters: newest published Outfit first. There is no hidden Match-based feed ranking.
- Style Feed supports **Occasion** and **Style Tags** filtering. Style Tags must be searchable in the filter control rather than forcing the member to scan a long static list. These controls stay compact on constrained screens and do not require a large standalone Apply button.
- Style Feed Outfit cards reuse the canonical Outfit gallery: all Outfit photos may be swiped in-card, and tapping the photo opens the full-screen multi-photo viewer rather than navigating or opening an Outfit metadata quick view.
- Style Feed Comments opens the canonical comments sheet over the feed instead of forcing navigation to full Outfit details.
- Creator avatar / Display Name / `@username` uses the one universal Person quick-view behavior. Do not create separate Style Feed-specific member/profile preview systems.
- Full Outfit navigation is a separate explicit **View Full Outfit →** control. Photo and creator identity are not full-detail navigation.
- The default Fit Twins view never silently broadens to All Following. When the Fit Twins feed is exhausted, the bottom prompt keeps two separate actions: **See All Following →** switches the feed to All Following, and **Find More Fit Twins →** routes to **People My Size**. Find More Fit Twins never replaces the All Following switch.
- `/following` is compatibility-only and resolves to `/circle`.
- Signed-in `/` currently resolves to `/circle`; logged-out `/` is the public homepage.
- Follow alone does not enable person notifications.

# 4. Controlled community Product catalog — LOCKED
LikeSized uses one controlled community-built canonical Product catalog.

> **Members contribute garments and Fit Reports. A clean, unique first member submission may be system-posted immediately as a Provisional Product; members still do not directly write canonical Product truth. Explicitly uncertain identity stays Unconfirmed until admin review.**

A canonical Product is the normalized identity used for Product search, evidence, Product details, variants, identifiers, Product photos, retailer listings and reviewed shared facts.

## Pre-publication Unconfirmed + four live Product identity-trust tiers
Publishing and identity-trust strength are separate. A clean Product does not wait for five reports before it may appear.

- **Unconfirmed — pre-publication candidate only.** A member explicitly said the Item / Style / Model identity may be wrong. It is below Provisional and hard-gates automatic publication. It can never be a live Product status.
- **Provisional — 1 distinct wearer.** A clean unique first submission may auto-post immediately.
- **Corroborated — 2–4 distinct wearers.** Independent wearer evidence strengthens the identity.
- **Established — 5+ distinct wearers.** The five-wearer milestone remains the stronger community-evidence tier.
- **Verified — authoritative/admin-reviewed.** It is never granted merely from community count.
- Repeated reports from one member do not manufacture distinct-member Product identity confidence.

The identity-trust tier is separate from field-level Product fact authority. Community wearer count does not silently verify Product description, material, Department, attributes or other facts.

A candidate is a staging/audit object, not a second public catalog. A candidate remains unresolved when a blocking ambiguity already exists—for example explicit member identity uncertainty, conflicting identity, competing exact Products, barcode/listing collision or another genuine duplicate signal. Clean candidates are materialized/mapped automatically instead of creating a routine admin queue.

## Unconfirmed active review — invisible to the member
When a member checks **I’m not sure this is the correct item/style name**:
- the Fit Report and Closet garment save normally;
- the garment remains fully usable in the member's Closet and in Styles/Outfits;
- active admin review creates no member-facing warning, badge or abnormal state;
- the unresolved identity does not appear as a Product in other members' search, suggestions, browse/discovery or unresolved barcode-match suggestions;
- admin may map it to an existing Product or create/map a new Product after identity review;
- a new Product created from this path starts at Provisional unless separate authoritative evidence supports stronger trust.

## Needs More Evidence — private owner follow-up
If admin cannot reasonably identify an Unconfirmed item, the candidate moves to **Needs More Evidence** instead of remaining indefinitely in the active review queue.

Only then does the submitting member see a small private disclaimer in their own personal Closet view. The disclaimer explains that:
- the garment still works normally in their Closet and Styles/Outfits;
- the unresolved item remains unavailable in other members' garment searches until verified;
- **Add More Information** lets them provide a Retail/Product webpage, Product Photo and/or Product Label / Tag Photo.

Previously supplied evidence stays preserved. Submitting new evidence automatically returns the candidate to active Needs Review and refreshes its review priority. The disclaimer and review state are not visible to other members.

## Later conflicts do not unpublish history
An already-posted Product is not automatically deleted, hidden, demoted or rewritten because a later member reports a problem. The Product remains usable while review evidence is retained unless an audited resolution changes its identity/status.

## Identity boundaries
Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, report-scoped physical answers, condition, notes, purchase context and legitimate alternate barcodes do not independently define a new base Product.

Explicit uncertainty does not change those identity fields. The member still enters their best Item / Style / Model text; the uncertainty signal says that text must not become automatic Product truth.

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
- Unresolved Unconfirmed and Needs More Evidence candidates are never offered as barcode-match suggestions to other members.

## Scanner flow
- Supports normal retail UPC/EAN 1-D barcodes; QR is not required.
- Lookup checks canonical identifiers, unique provisional Product→barcode evidence and eligible unresolved candidate evidence, excluding Unconfirmed/Needs More Evidence.
- Unique recognition pauses at **Is this the item?**.
- Confirmation card shows Brand, Item, Category/Type, **Yes — this is the item**, and **No — enter manually**.
- Scanner confirmation image priority is: **Product/catalog photo first → shared Front Fit Photo second → other shared Fit Photo third → default/placeholder if none exists**.
- The confirmation image is click/tap expandable in the shared accessible full-size viewer; Escape/background dismissal and swipe-down dismissal are supported where applicable.
- A member Fit Photo used as scanner fallback remains personal wear evidence only; it is not promoted into canonical Product imagery or Product truth.
- Physical garment questions stay in the Fit Report, not the barcode identity card.
- Unknown/no match continues manual fallback while retaining barcode evidence.
- Ambiguous barcode identities are never auto-selected.

# 6. New Fit Report intake — LOCKED
Ordinary member intake begins with one simple **Identify your item** screen.

Approved opening helper copy: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

Primary choices:
1. **Scan barcode**.
2. **Add tag photo** — the device may offer camera capture or an existing photo. Taking a tag photo does not imply LikeSized can automatically read or identify every Product field from it.

A smaller fallback appears beneath those choices: **Tags missing? Enter item manually →**.

The three paths converge on the same canonical Brand / Item / Product flow and the same Fit Report form. There is no second tag-photo evidence system and no parallel manual catalog.

Ordinary member intake never calls SerpAPI.

## Evidence-first behavior
- Barcode evidence is retained when a barcode path continues into manual/new-item details.
- A tag photo chosen from the opening screen is retained on the same Fit Report as private identity evidence and is not requested again later in that flow.
- Barcode and manual-entry paths retain a small optional Product Label / Tag Photo control directly below Brand / Item so the member can still add that evidence.
- When the member began with a tag photo, that compact in-form uploader is hidden because the evidence is already present.
- Product Label / Tag Photo never becomes generic Product display imagery merely because it was supplied during intake.
- Whenever no canonical Product match is active—tag-photo path, manual entry, barcode with no Product match, or after rejecting a previous match—the top of the form says: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**
- When a canonical Product match is active, the existing prefilled/community-match guidance is shown instead.

## Matched Product identity reset
- **Change Brand** means the previous Product identity is no longer trusted. It clears the matched Product, Item / Style / Model, Category, Specific Garment Type, prefilled structured item answers, matched Product image/message and Product-derived defaults. It does not erase unrelated Fit Report information or evidence the member entered themselves.
- **Change Item** also invalidates the previous matched Product. It keeps the current Brand but clears Item / Style / Model, Category, Specific Garment Type, prefilled structured item answers, matched Product image/message and Product-derived defaults.
- After either identity reset, the normal unmatched guidance and **I’m not sure this is the correct item/style name** control return.
- If the previous match came from a scanned barcode, the barcode remains evidence. A barcode resolution may not silently reattach the old Product when the member-submitted Brand or Item no longer agrees with that Product identity.
- Selecting a new real LikeSized Product suggestion establishes that new Product match normally.

## Main information order
1. Brand / Make — required.
2. Item / Style / Model — required.
3. Product Label / Tag Photo — conditional compact optional control for barcode/manual paths when a tag photo was not already supplied at the opening step.
4. **Overall Category** — required.
5. **Specific Garment Type** — required and filtered to the selected category.
6. Department — optional.
7. Zero-to-four Type-specific controlled physical questions; **Not sure** is final and records no positive physical claim.
8. Color family — required.
9. Size — required structured size.
10. Overall Fit Result — Too Small / Snug / Just Right / Relaxed / Too Big.
11. Condition — New / Used / Altered.
12. **Photos — at least one required for every new Fit Report.** The controls appear in this order: **Front Fit Photo → Back Fit Photo → Product Photo (not being worn)**. Any one of the three satisfies the new-report photo requirement.
13. Fit Notes — optional, up to 2,000 characters.
14. Retail Link — optional.

Photo-role rules:
- Front Fit Photo and Back Fit Photo are separate controlled wear-evidence roles and are visible to the LikeSized community.
- Product Photo is a separate Product/catalog-display evidence role; it is not a Fit Photo.
- The UI must use one canonical Product Photo file input/evidence value even when different helpers can open that chooser. Do not create a second Product Photo field.
- Fit Report/Closet display image priority is **Front Fit Photo → Product Photo → Back Fit Photo**. This is a presentation priority only and does not merge or relabel the evidence roles.

Item / Style / Model stays required for new unresolved/manual items. Do not offer a generic blank **No model** escape. Examples must not duplicate the separate Brand field.

Manual Item suggestions render as the actual dropdown immediately under the Item / Style / Model field. Suggestions use a short network debounce with immediate cached results/prefetch so the UI does not intentionally block on a long search delay.

## Identity uncertainty checkbox/modal
For a new or unresolved item, the member may check **I’m not sure this is the correct item/style name**.

The helper is evidence-aware and uses the same underlying evidence fields as the rest of intake:
- Retail Link;
- Product Label / Tag Photo, only when one has not already been supplied;
- Product Photo.

If the member started with a tag photo, the helper does not ask for a second tag photo. If the member came through barcode/manual entry without a tag photo, the helper may offer one. Existing evidence is preserved; **Save & Continue** keeps the values and **I’ll Add This Later** closes the helper without erasing the Unconfirmed signal.

The uncertainty helper keeps the established pre-redesign explanatory copy rather than introducing new evidence descriptions solely because the intake entry point changed.

The form must never create duplicate copies of the same evidence values or a second Label/Tag upload path.

The checkbox creates the Unconfirmed pre-publication behavior in Section 4. It is not a way to leave Item / Style / Model blank.

## Optional Additional Information — collapsed by default
Exact order:
1. Purchased From — free-form with known-retailer suggestions.
2. Price Paid — non-negative normal currency decimals.
3. Purchase Method — Online / In Store / Received as a Gift.
4. Approx. Purchase Date — Month + Year.
5. UPC / barcode when not already scanned.
6. Manufacturer Style / Article Number.
7. Material / Fabric Composition.

Product Photo is intentionally **not duplicated** in Optional Additional Information; its single canonical control lives in the required Photos block described above. Product Label / Tag Photo remains separate private identity-review evidence.

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
Before server submission show **Does this look right?** with main Fit Report information only: Brand/Item, Category, Garment Type, Department, controlled item details, Color, Size, Fit Result, Condition, photo added-state, Fit Notes and Retail Link when present.

Do not repeat Optional Additional Information there. Actions are **Go Back & Edit** and **Confirm Fit Report**. Nothing submits before confirmation.

# 7. Direct Product search vs discovery filters — LOCKED
Direct Product search is **global** across men's, women's and unisex Products. A user does not need to switch Fit Community or Department to find a matching Product by Brand, Item, alias, style number, SKU, UPC/barcode or retailer identifier.

Fit Community filters people/wearer relevance in social discovery. Product Department/taxonomy filters may narrow explicit browse/explore contexts when the user chooses them, but they do not silently suppress a direct textual Product search.

Unconfirmed and Needs More Evidence are unresolved candidate states, not Products. They never appear in other members' direct Product search, suggestions or ordinary Product discovery until admin resolves them.

# 8. Public measurement FAQ copy — PENDING OWNER APPROVAL
A future FAQ may explain that complete, accurate measurements improve Match precision and that different body/garment contexts can make certain measurements especially informative. The exact public wording and any sex/body-specific measurement examples are **not approved** and must not be published until the owner reviews the copy.

# 9. Product/item reporting and exception-driven review — LOCKED
Every published Product must expose one **Report this item** action. Initial reasons:
- Inappropriate content
- Image doesn't match this Product
- Incorrect Product information
- Something else

A report creates/refreshes review evidence; it does not let the reporter directly rewrite Product truth.

LikeSized may also create review flags from conflicts and conservative internal signals such as possible duplicate names, competing identifiers/barcodes, reused retailer links, aliases or other identity evidence. Internal similarity is a flagging aid, never an automatic fuzzy merge.

## Published Product review priority
Priority derives from the four live Product identity-trust tiers plus independent evidence:
- **Provisional (1 wearer) → High** when a credible issue is flagged.
- **Corroborated (2–4 wearers) → High** when a credible issue is flagged; at this evidence level the conflict may still reveal an undiscovered Product problem.
- **Established (5+ wearers) → Low** for one isolated ordinary disagreement because a single entry error is more likely after substantial agreement; repeated independent signals escalate to Medium and then High.
- **Verified → Low** for one isolated ordinary member report; multiple independent reports/conflicts may escalate Medium/High.
- Competing barcode/Product claims, strong duplicate evidence or multiple identity conflicts may escalate regardless of current trust.

## Unconfirmed identity-review priority
Explicit Unconfirmed intake review is prioritized by the requested identity evidence the member supplied:
- Retail/Product webpage + Product Photo + Product Label / Tag Photo = highest review usefulness;
- partial requested evidence = intermediate priority;
- none of those requested evidence types = lowest priority because the identity may be impossible to determine.

If admin cannot reasonably resolve the item, moving it to Needs More Evidence parks it outside the active review queue. New member evidence reopens active review and recalculates priority.

Low priority means review later, not discard the evidence.

# 10. Counted Fit Report identity — LOCKED
For a resolved Product, a counted Fit Report represents a distinct state for:
- Member
- exact Product
- normalized Size
- objective physical garment-answer fingerprint
- garment-relevant body state

Fit Result, Condition, Color, material, retailer URL, barcode, Style/Article Number, Department, notes, Product Photo, Product Label / Tag Photo, Fit Photos and purchase context do not independently create another counted report.

An unresolved Unconfirmed garment still preserves its Fit Report/body evidence while Product identity remains unresolved. Admin resolution later maps that history to the canonical Product without rewriting the original try-on/body evidence.

## Objective fingerprint
- current physical controlled answers may participate;
- `Not sure` is stored but excluded from positive physical fingerprint;
- historical Intended Fit remains excluded from the existing fingerprint and is no longer a current intake question;
- a genuine objective physical-answer change may create a distinct state.

The counted-report `objective_variant_key` is deliberately separate from tracked fit-variation identity. The 11A tracked-variation audit does not silently rekey historical reports or collapse possible legacy duplicates created by retired questions. Any counted-report fingerprint reconciliation must be a deliberate later change with historical collision handling.

## Body relevance and 2% rule
Use the same Product measurement map as Match: `private.product_match_measurements(product_id)`.
For an established relevant measurement:
`abs(new - baseline) / abs(baseline) >= 0.02`
means materially different report state.

Under 2% is compatible. Blank→filled relevant values may enrich a compatible report. Value→blank does not erase established evidence. Accepted under-2% values may roll the active private comparison baseline while original `fit_profile_version_id` stays immutable.

# 11. Fit Report mutation direction — CLOSET AUDIT REQUIRED
The owner direction is to preserve original confirmed try-on evidence rather than allow unrestricted rewriting. Closet audit must classify fields as immutable historical evidence, add-missing enrichment, narrowly correctable with history, or later lifecycle observations.

Kept / Returned / Exchanged and after-use changes such as shrinkage/stretching belong to later dated lifecycle observations rather than silent rewrites of the original try-on report.

PR #53's **Add More Information** flow is a narrow unresolved-identity evidence addition, not unrestricted Fit Report editing. It may add/replace the owner-supplied retail/product webpage, Product Photo and Product Label / Tag Photo for an unresolved Unconfirmed garment and return it to admin review; it does not directly rewrite Product truth.

Do not introduce unrestricted Edit Item product meaning before the broader mutation contract is settled.

# 12. Unified member-visible Closet — LOCKED
LikeSized has one canonical member Closet meaning, not separate My Closet and Shared Closet systems.
- **My Closet is the owned-content hub** with Garments, Outfits and FITuition sections/tabs. Owned Outfit drafts and published Outfits live there rather than in a second creator-content system; `/outfits` is a compatibility route into the Closet Outfits view.
- Current V1 has **no member-controlled per-garment Private / Shared state**. Garments and Fit Reports are authenticated-member-visible content; self view adds owner-only management controls to the same canonical content.
- The historical physical `closet_items.visibility` column remains only so immutable migration history can replay. Current V1 locks that compatibility value to `shared`; it is not a product setting or UI choice.
- Raw body measurements, historical body snapshots, owner size references, private catalog/label evidence and admin review state remain protected by their separate privacy boundaries.
- Fit/reference photos are member-visible wear evidence and do not require a visibility transition.
- Active Unconfirmed review remains invisible to other members and creates no searchable Product identity. Only Needs More Evidence shows a small private owner-only disclaimer and **Add More Information** action.
- Unconfirmed/Needs More Evidence garments remain usable by the owner in Styles/Outfits while unresolved identity/review state stays private.
- FITuition in My Closet explains/reuses the same canonical Fit Report and Closet-history recommendation evidence; it is not a second recommendation engine.
- Broader Closet lifecycle/mutation behavior remains a later Closet audit; it must not reintroduce a second visibility system.
- My Closet layout and behavior are responsive across desktop, tablet and mobile. A correction to the canonical Closet surface is not considered complete when only one breakpoint receives it.

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

## Tracked fit variation identity — OWNER LOCKED
A tracked fit variation is not the base Product and is not the member's size.

Only structured questions LikeSized actually asks for that Garment Type are eligible to define a tracked variation. The completed 11A owner audit produced these current rules:
- **Every structured Garment Type question that remains in current V1 intake is variation-defining.** There are currently no descriptive-only or cosmetic structured Type questions.
- **Intended Fit is retired from every Garment Type question set.** It is subjective/redundant with actual Fit Result and wearer evidence.
- **Sneakers → Use is retired.** Casual / Running / Training / Court is use/category context rather than tracked fit variation identity.
- Cropped, sleeve/sleeve length, neckline and closure are variation-defining wherever asked.
- Shape questions remain variation-defining when their options describe the garment's physical cut, such as Fitted / Flowy.
- All other retained clothing and shoe questions in `lib/garment-taxonomy.ts` are variation-defining.
- **Size never defines a tracked variation.** Size stays on the Fit Report.
- **Color never defines a tracked variation.** Color is cosmetic for variation identity.

`lib/garment-taxonomy.ts` is the one canonical current question/classification source. `GARMENT_VARIATION_DEFINITION_MAP` is derived from those same question definitions; Product Detail, recommendation/evidence aggregation and Admin tooling must consume that map rather than create parallel variation logic.

Historical database vocabulary/answers for retired questions may remain inert for compatibility with immutable migration history. Retiring an intake question does not itself authorize historical counted-report rekeying.

# 14. Product evidence boundaries — LOCKED
Shared Product facts resolve field by field; one Fit Report never wholesale-replaces another.

Product identity becoming Provisional, Corroborated, Established or Verified does **not** turn another member's Size, Color, Material, Fit Result, physical answers, Condition, Notes, purchase context, Product Label / Tag Photo or Fit Photo into unquestioned Product truth.

Product Photo and Product Label / Tag Photo are distinct:
- Product Photo may be catalog-display evidence subject to normal evidence/moderation rules.
- Product Label / Tag Photo is private identity evidence used for review and must not be promoted to generic Product imagery.

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

# 17. Preferred Fit / Intended Fit — RETIRED
Old member-level Preferred Fit by garment type is not current V1 behavior. It is absent from current Fit Profile UI and does not change Match %, Twin designation or counted report identity. Historical DB rows may remain inert.

The old per-report **Intended Fit** structured question is also retired from current V1 intake. Historical Intended Fit values may remain inert for compatibility and remain excluded from the existing counted-report objective fingerprint.

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

Pending/unmapped submissions, including Unconfirmed and Needs More Evidence, do not count as exact canonical Product evidence. `Would Buy Again` does not affect size recommendation/confidence.

**Exact Variant** must consume the one approved variation-definition map from Section 13 when Exact Variant behavior is implemented. Size and Color are never variation-key fields.

## Product Detail fit-evidence presentation — OWNER LOCKED, ROADMAP DEFERRED
Do not implement this ahead of the Garment/Product Detail audit.

Default evidence behavior:
1. **Primary:** the closest Body Match for the exact variation being viewed, always first even when a related variation has a higher Body Match.
2. When useful, explain under that exact-variation result: **“This is the closest Fit Report we currently have for this exact variation. A lower Body Match does not mean this item will not fit you — it means we do not yet have a report from someone closer to your measurements.”**
3. When enough strong Body Match evidence exists for that exact variation, show a compact **Strong Fit Reports** aggregate underneath the closest individual report. The aggregate may summarize size worn + Fit Result, but it must never mix related variations.
4. **Secondary:** only the single closest Body Match from related approved variations. Show what they wore and state the actual difference, such as different cut, rise, dress length, sleeve length, neckline, crop or leg cut.
5. **See more evidence** opens all available evidence for the garment family: exact and related variations, Body Match, size worn, Fit Result, variation attributes/differences, aggregates and the individual reports behind them.

Body Match means wearer-body similarity, not garment probability. Approved helper meaning: **“Body Match shows how closely your measurements match the person who submitted this Fit Report — not how likely the garment is to fit you.”**

A high Body Match does not turn a bad Fit Result into a recommendation. Example: a 95% Body Match report where 30×30 was Too Small remains strong body-similarity evidence and poor size/outcome evidence. Recommendation interpretation may reduce confidence in that size without lowering Body Match itself.

Later lifecycle evidence such as shrinking, stretching, alterations and Kept/Returned/Exchanged may affect recommendation confidence/warnings only after the Closet lifecycle model is settled. It must not rewrite the original try-on Fit Report.

Do not collapse Body Match, exact-variation equality, size worn, Fit Result and lifecycle evidence into one synthetic fit percentage.

# 20. Help Me Size It — LOCKED
Help Me Size It is fallback sizing assistance and reuses the canonical recommendation engine. There is no second sizing engine/table and no invented size when evidence is insufficient.

# 21. Explore / search — LOCKED DIRECTION
- `/explore` canonical; `/browse` compatibility only.
- Garments | Outfits.
- My Fit Matches | All.
- My Fit Matches eligibility begins at 75%+ relevant historical Match.
- Strict explicit taxonomy filters do not silently relax.
- Ordinary Product results dedupe to one canonical Product.
- Provisional/Corroborated/Established/Verified Products remain searchable unless rejected/otherwise explicitly moderated.
- Unresolved candidates are not ordinary Product results; Unconfirmed/Needs More Evidence are explicitly excluded from other-member search, suggestions, browse/discovery and unresolved barcode suggestions.
- Direct textual Product search remains global as defined in Section 7.
- Outfit creator identity shown in discovery resolves the creator's current public profile identity/photo rather than a content-time snapshot.
- No blank image state and no star Fit Rating.

# 22. Product actions / notifications / shopping — LOCKED
Independent actions:
- Heart — LikeLocker
- **Shopping bag + heart vector — Wishlist / Wish Locker destination**
- Bell — one-shot exact-Product Match notification
- Cart — Shop only when a valid retailer destination exists

The Wishlist visual is one deterministic SVG/vector: one shopping-bag outline with the heart integrated inside it. The inactive state is outlined; the active state uses the same icon with the heart filled. Do not compose multiple Unicode/emoji glyphs and do not substitute a generic bookmark.

Garment utility actions do **not** show public counts. Wishlist, Share, Shop and Report never need public count clutter on garment surfaces. Counts remain for genuinely social engagement where useful, such as Outfit Likes/Comments.

No action silently performs another. Product bell is separate from person bell. One valid listing routes direct; multiple show a compact retailer picker; zero hides Shop. Commission never affects Match, recommendation, Product identity, search rank or retailer choice.

Locked disclosure when required: **“LikeSized may earn a commission from purchases made through our shopping links.”**

# 23. Outfits / Style Feed — V1 LOCKED
Outfits are member-created mini editorial posts built from owned Closet garments and the same canonical Product/Fit system. Outfit likes and Product likes remain separate. Owned Outfit drafts and published Outfits are managed from **My Closet → Outfits**; `/outfits` is compatibility routing, not a second owned-content hub.

## Creator model
- V1 is photo-only: **1 required Main Photo + up to 5 optional Additional Photos**; no video and no scheduled publishing.
- Main Photo is the cover/feed image. Additional photos may be reordered, and any photo may later be made Main without delete/re-upload.
- **Headline** is required, maximum 100 characters. **Outfit Story** is optional, maximum 5,000 characters.
- **Occasion** is required: choose 1–2 from the fixed LikeSized Occasion vocabulary. **Style Tags** are optional: up to 3 community-created tags, normalized behind the scenes and suggested from existing vocabulary without silently rewriting the creator's display text.
- A published Outfit tags **1–6 owned Closet garments**. If a garment is missing, the creator reuses the canonical `/closet/add` Fit Report intake inside the Outfit flow; there is no simplified second garment-intake system. **`+ Add a new garment` opens that embedded intake in a fixed/current-viewport modal on desktop and mobile; it must never render at the bottom of the Outfit composer.**
- The garment picker starts at **All Garments** with only **Recently Added** and **A–Z** sorting. Narrowing controls such as Garment Type and Brand appear progressively when relevant; Garment Type is a filter, never a sort option.
- The Outfit garment-picker search and progressive filters are deliberately compact/content-sized. The universal compact-control rule applies to controls themselves; it does not authorize shrinking unrelated site-wide page-shell spacing.
- The Outfit garment-picker list/card view stays compact: it shows the basic garment/report context but **does not dump variation-defining structured answers onto the list card**. Clicking a garment opens the compact quick view, and that clicked quick view identifies the garment with Brand, Item/Model, Category/Garment Type, Size, Color, available photos, Fit Result where applicable and every answered garment-specific structured question. Selection requires an explicit **Add**/check action.
- When the same base Product appears more than once because the wearer has legitimate distinct tracked Fit Report variations, the compact picker list keeps those entries separate without exposing the structured variation-answer dump. The **clicked picker quick view** shows the answered variation-defining structured questions needed to tell those entries apart. Same Product identity alone is never grounds to dedupe legitimate distinct tracked variations. Size and Color may still be displayed as report context but remain excluded from tracked-variation identity.
- Embedded Brand/Item suggestions stay anchored below the active field and use the same cached/prefetched fast search path as canonical Fit Report intake.
- Accessories outside the V1 garment taxonomy may appear in photos and Outfit Story but are not separate Product/Closet tags.
- Each photo may optionally map one or more master tagged garments to on-image hotspots. **Use Cover Photo Tags** is an explicit action when reusing cover tags rather than passive helper text. The photo-tagging workspace starts on the current Cover/Main photo.
- **Back to My Closet** from a new Outfit returns directly to **My Closet → Outfits**; editing an existing published Outfit may return to that Outfit detail page.

## Draft / preview / publish
- Drafts are unpublished owner-only work and are not private published Outfits.
- First publication requires **Preview Outfit** before **Publish Outfit**. The same draft becomes the published Outfit; publishing does not create a duplicate post.
- Successful Save Draft gives immediate pending/saved feedback, keeps the editor stable, reuses already-persisted photo IDs and avoids unnecessary photo re-upload/reprocessing.
- Entering Preview starts at the top of the preview content rather than inheriting the editor's prior bottom scroll position.
- Unsaved creator navigation uses an immediately visible **fixed/current-viewport confirmation dialog**. New/draft work offers **Save Draft · Leave Without Saving · Keep Editing**; a published Outfit edit uses **Save Changes · Leave Without Saving · Keep Editing**. The confirmation must never render unnoticed at the bottom of the composer. Browser refresh/close uses the standard unsaved-changes warning.
- Published Outfits may later be edited in place—Headline, Story, photos/order/Main, garments, Occasion and Style Tags.
- On existing-Outfit save, persisted photo-hotspot relationships must remain a subset of the Outfit's current selected/tagged garments. If historical/stale hotspot rows point to a Closet item that is no longer selected for the Outfit, the canonical save path removes those stale relationships instead of exposing an internal **“Hotspot garment is not tagged in this Outfit”** consistency error to the creator. Legitimate current hotspots remain intact.
- Deleting a published Outfit requires an explicit confirmation step before the destructive action executes.

## Published Outfit detail and public sharing
- Every published Outfit has one canonical shareable detail URL at `/outfits/[id]` with social-preview metadata using the Main Photo, Headline, creator identity and LikeSized branding.
- The opened Outfit defaults to a **compact social-post scale**, not a giant billboard. Desktop uses a restrained content/media width and tight vertical rhythm; mobile remains touch-friendly without arbitrarily inflating cards, controls or modals. LikeSized controls default compact/content-sized unless a deliberate mobile primary action genuinely needs full width.
- The opened gallery is a **single-image viewer on both mobile and desktop**. Secondary photos stay hidden behind the active image instead of appearing as a thumbnail/secondary strip. Touch swipe/drag and tap advance work on mobile. When an Outfit has more than one photo, the **normal desktop gallery must also show visible Previous and Next controls**; pointer/trackpad drag and keyboard arrows remain supported but are supplemental rather than the only discoverable desktop navigation.
- Clicking/tapping the photo background opens a full-size viewer. Tag hotspots, Caption controls and other overlays remain independent and do not accidentally trigger the full-size viewer. The full-size view supports intentional close, keyboard dismissal/navigation, **left/right swipe between Outfit photos**, and swipe-down dismissal on touch devices.
- The gallery container ends with the rendered media instead of reserving dead space beneath it. Social actions sit immediately below the media and are right-aligned on desktop.
- Photo hotspots remain attached to the specific active photo they belong to. Combining the photos into a one-image viewer never removes or merges away the active photo's tag overlays.
- Safe already-resolved photo hotspots remain visible to logged-out visitors on published Outfits. Clicking one keeps public Product identification available while personalized fit intelligence remains authenticated/Fit-Profile gated.
- Logged-out visitors may view the published Outfit normally: gallery, Headline, creator public identity/handle, Occasion, Style Tags, Outfit Story, social counts, readable comments and safe already-resolved tagged-Product identification remain visible. Logging out does not turn the Outfit itself into a crippled teaser page.
- Creator/comment profile identity is resolved live from the member's current public profile identity/photo; old profile photos are not snapshotted onto Outfit/comment records.
- Public compact identity presentation uses **Display Name + `@username` on one line** where space permits, with `@username` remaining visible/truncatable rather than being removed. Display Name alone is never treated as sufficient account identity on posts/comments.
- The creator avatar/name opens one compact member quick view. The stat hierarchy is **Overall Match** alone, then **Tops Match | Bottoms Match**, then **Total Garments | Total Outfits**. These stats are not rendered as a bordered table/grid. Total Garments means distinct garment evidence/items rather than a relabeled raw Fit Report count. The quick view also provides **View Full Profile** and appropriate Follow/notification controls. Raw measurements never appear there.
- Raw body measurements, historical body snapshots, private Closet linkage, unresolved candidate/review state, private City/State and authenticated member action state remain protected in every Outfit context.
- Personalized tagged-item intelligence is account/Fit-Profile gated. A logged-out visitor who clicks a tagged item is kept in Outfit context and receives a compact **create account / sign in** gate instead of a fake personalized quick view. Before authentication LikeSized does **not** claim a Relevant Fit Report count, Body Match result, FITuition result or “not enough personalized evidence” state for that visitor.
- The **Style Notes** tab presents the actual Headline, tags and Story directly. Redundant labels such as `OUTFIT TITLE`, `OUTFIT TAGS` and `OUTFIT DESCRIPTION` are not shown.
- The **Tagged Items** compact signed-in card is viewer-facing Product identification, not a dump of the poster's Fit Report. It shows Product photo, Brand + Item Name, Category/Garment Type and the viewer's **Relevant Fit Reports: X** when loaded. **For a signed-in viewer, the page begins loading that personalized Relevant Fit Report metadata for every tagged garment when the Tagged Items panel mounts; the user must not have to open each garment first to make its count appear.** While a request is in flight the card may show a compact checking state, and a failed request must resolve to an error/retry state rather than silently hang. Variation-defining answer detail does **not** get dumped onto this compact card/bar.
- When the same base Product appears through legitimate distinct tracked variations, the **clicked tagged-garment quick-view path** shows the relevant answered variation-defining structured attributes so the member can tell which variation they are looking at. The UI must not label legitimate repeated same-Product tracked variations as duplicates merely because Product, size or color presentation looks similar.
- On the Outfit tagged-item surface, **Relevant Fit Reports: X means useful personalized evidence for the exact Product + exact tracked variation shown.** It never means the total number of Fit Reports attached to the Product. The viewer's own eligible exact-variation Fit Report **does increment this visible count**, and qualifying other-wearer exact-variation reports also count. Related/similar tracked variations do **not** inflate this Outfit count; those broader reports belong on the full Garment Detail evidence view.
- The viewer's own eligible Fit Report is useful evidence and must not be discarded merely because the viewer authored it. When it matches the clicked exact Product + tracked variation, it participates in the visible Relevant Fit Report count as well as the viewer's Closet/FITuition evidence. Broader own history is weighted through the same canonical relevance hierarchy rather than becoming a second recommendation engine.
- Repeated evidence from the **same person + same Product + same tracked fit variation** is one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color do not create tracked fit variations.
- Opening a tagged item uses **one canonical compact quick view** whether the action began from Tagged Items or an on-photo hotspot. There is no second impoverished hotspot popup. The quick view shows Product identity/category, clicked-only tracked-variation detail when available, and the appropriate inline FITuition state/evidence.
- **Zero Relevant Fit Reports hard-gates tagged-item recommendation presentation.** The quick view does not show a size recommendation merely because broader Closet History can produce a numerical winner. Instead it uses **“Not enough fit data to confidently recommend a size.”** and offers the compact bell + **Notify me** action with the explanation **“FITuition will notify you when people close to your size post a Fit Report for this item.”** After subscription the compact state is **Notifications on**. A viewer with an eligible own exact-variation Fit Report must not be placed in this zero state merely because they authored that report.
- With **one or more Relevant Fit Reports but insufficient recommendation confidence**, the quick view uses the owner-approved wording **“Not enough fit data to confidently recommend a size.”**, shows **Relevant Fit Reports: X**, and directly shows the single best available exact report. With enough evidence to recommend, the quick view uses **“Our FITuition suggests: [SIZE]”** and **“Confidence: [label]”**, then directly shows **Relevant Fit Reports: X** and the closest exact individual report. When a compact **Strong Fit Reports** aggregate exists, it is additional exact-variation evidence and appears **underneath the closest individual report** as count + Size + Fit Result rows; it never replaces that closest report.
- The tagged-garment quick view has **no intermediate FITuition Details / closest-match / Strong-report link**. The relevant compact evidence lives directly in the first quick view. Another wearer's exact report is labeled **Best Available Matching Fit Report** with Body Match, Size and Fit Result. If the viewer's own exact report is surfaced, identify it simply as **Your Fit Report** with Size and Fit Result; do not describe it as “Body Match unavailable.” The only deeper evidence navigation is the bottom **See Full Details →** link to the full Garment Detail page, where broader evidence including related/similar tracked variations belongs.
- The full Garment Detail page must remain loadable when optional/supplemental FITuition enrichment is unavailable; a supplemental profile/product/snapshot/attribute lookup failure must not turn an otherwise valid Product page into a generic server-error screen.
- The tagged garment image is expandable into the shared full-size viewer with swipe-down dismissal rather than a separate one-off image interaction.
- Tagged Product quick-view actions use the shared compact garment vocabulary: **LikeLocker · Wishlist · Shop · Share · Report**, with no garment-action counts. The Wishlist visual is the canonical shopping-bag + heart vector. Shop exists only with a valid `retailer_listings` destination. LikeLocker and Wishlist update in place and do not dismiss the quick view; the modal closes only from an intentional dismissal/back/outside action or the explicit **See Full Details →** navigation.
- An Unconfirmed or Needs More Evidence garment may be used by its owner in an Outfit, but unresolved identity/admin-review state never leaks and never creates a public/searchable Product teaser until resolved.

## Social controls
- On **another member's Outfit**, the Outfit-content action row is **LikeLocker · Share · Report**. Follow is a person relationship, so Follow/notification controls belong in creator/profile context, including the creator quick view, rather than being mixed into the Outfit-content action row.
- On the **creator's own Outfit**, self-LikeLocker and self-Report are hidden; **Share** remains available. Owner management controls such as Edit, comments on/off, delete and creator analytics remain separate from the content action row.
- Social controls stay visually tight to the media/content they act on. A count is rendered directly beside its corresponding social action/icon rather than in a separate count line. This does not create garment utility-action counts.
- Reports start with no preselected reason. The member must deliberately choose a reason; **Other** is never silently selected by default.
- Comments are **plain text only** in V1: no rich-text editor, markup/formatting controls, embedded media or nested replies. The restriction is enforced without permanently displaying a noisy “plain text only / no GIFs / no external links” helper under the composer.
- Outfit comments default to **Top** with **Newest** as the alternate sort. **Top** sorts by comment Like count descending, then newest first as the tie-break. Newest sorts newest first.
- The Outfit Comments tab shows a small bounded preview rather than an unbounded vertical thread. **View all X comments** opens the dedicated full comments view/sheet. Both sorts use real server/database cursor pagination in bounded batches; the client must not fetch a fixed giant thread and merely reveal pieces of it in memory. The comment composer remains sticky at the bottom.
- Comment creation, comment Like/unlike and Top/Newest switching update through the local/API interaction path without forcing whole-Outfit navigation/refresh for each interaction.
- Comment identity is compact: avatar, **Display Name + `@username` on one line**, then comment text. The username remains visible/truncatable rather than hidden so a display name cannot stand alone as the account identifier. Like/Flag/Delete actions stay tight to the comment they affect; Delete appears only when the viewer is authorized.
- Logged-out visitors may read visible comments but must sign in to comment.
- Signed-in members may Like visible comments. Comment-Like state is private to the liking member while the safe aggregate count is visible.
- Members may delete their own comments; an Outfit creator may remove comments on their Outfit. Outfit posts/comments support reporting; signed-in members may block another member from that member's profile context.
- Creators may turn comments off and back on without deleting the preserved thread.
- The creator-facing incremental analytics are **Views · Follows generated**. Likes, Comments and Shares are not duplicated in a separate analytics block because those social counts are already visible on the Outfit. Shop clicks remain internal-only LikeSized commerce attribution and no creator-facing Shop-click metric/explanatory copy is shown.
- Current Outfit View behavior is session-safe: reopening/refreshing the same Outfit within the same browser session does not repeatedly increment the View counter. A failed View request may clear the session marker so a real retry can occur.

## Feed/discovery boundary
- General Outfit browsing/discovery may use an **image-first Pinterest-like masonry/pinboard rhythm**: natural Main Photo proportions, staggered multi-column layout, minimal card chrome and lightweight Headline/creator/Occasion/Style/social metadata beneath the image. This remains distinct from the Following-only Style Feed.
- **Style Feed (`/circle`) is a passive social Outfit feed from people the viewer already follows only.** It does not mix Fit Reports, Closet-add activity or generic Product discovery into the feed.
- Style Feed defaults to **Fit Twins** and offers **All Following** beside it at the top as the alternate relationship filter. Fit Twins includes followed Fit Twin, Tops Twin and Bottoms Twin designations.
- Style Feed shows the creator's current public identity and Twin badge where applicable, but **no Body Match/Overall Match percentage** on the feed card.
- Style Feed ordering is **newest published Outfit first** inside the active filters; no Match-based priority/ranking is applied.
- Style Feed filters are **Occasion** and **Style Tags**. Style Tags use a searchable filter control. On mobile/constrained screens these controls remain compact and do not sit inside a large filter card or require a giant standalone Apply button.
- Each Style Feed Outfit reuses the **canonical Outfit gallery** rather than a feed-specific photo viewer. All Outfit photos are swipeable in the card, the current photo can be tapped into the same full-screen multi-photo viewer, and feed rendering may use the optimized feed derivative while full-screen uses the display image.
- A Style Feed photo tap is a photo-viewing action only. It does not navigate to `/outfits/[id]` and does not invoke the generic Outfit metadata quick-view popup.
- The Style Feed **Comments** action opens the canonical comments sheet over the feed so the viewer can read/add comments without navigating away from their feed position.
- Creator avatar / Display Name / `@username` uses the same universal Person quick view used elsewhere. LikeSized does not maintain separate per-page Person or garment preview implementations.
- Full Outfit details are reached through a dedicated explicit **View Full Outfit →** navigation control; photo and creator identity are not full-detail navigation targets.
- The default Fit Twins view never silently falls back to All Following. If there are no Twin Outfit posts for the active filters, the page says so. When the Fit Twins feed is exhausted, the bottom prompt shows both **See All Following →** to switch the feed to All Following and **Find More Fit Twins →** to route to **People My Size**. Find More Fit Twins never replaces the All Following switch.
- People My Size defaults to Twin-level qualifying results and exposes **All Matches** as the alternate broader discovery view.
- Drafts never create feed activity.
- Explore/Search remain separate intentional Product/garment/Outfit discovery surfaces; Style Feed does not replace them.

# 24. Images — LOCKED
- Every **new Fit Report** requires at least one of **Front Fit Photo / Back Fit Photo / Product Photo**.
- Front Fit Photo and Back Fit Photo are separate controlled member wear-evidence roles attached to the Closet/Fit Report garment; either may independently satisfy the new-report photo requirement and both are community-visible wear evidence.
- Product Photo is separate catalog-display evidence and may independently satisfy the new-report photo requirement. The member-facing control is labeled **Product Photo (not being worn)** where the three photo choices are presented together.
- Product Label / Tag Photo = separate private identity-review evidence, never generic Product imagery and never a substitute for one of the three new-report photo choices.
- Fit Report/Closet display image priority is **Front Fit Photo → Product Photo → Back Fit Photo**. This display priority never changes the underlying evidence roles.
- Scanner Product-identification priority is separate: **Product/catalog photo → shared Front Fit Photo → other shared Fit Photo → placeholder**.
- Profile Photo = public current member identity when uploaded; social/editorial surfaces resolve the current profile photo rather than storing content-time avatar snapshots.
- A public/shared member Fit Photo used as scanner fallback never becomes generic/canonical Product imagery merely because it was used for recognition.
- Shared image expansion should use the canonical full-size viewer behavior, including swipe-down dismissal on touch where appropriate, rather than proliferating one-off lightbox implementations.

## Planned automatic canonical Product image selection — ROADMAP 13A OWNER LOCKED
Fit Report imagery stays permanently attached to the report/member that supplied it. Generic Product representation is a separate selection layer used by Search, Explore, recommendations, Wish Locker and other general Product cards.

General priority:
1. Admin-locked image.
2. Highest-scoring eligible real Fit Report photo.
3. Official/imported retailer or brand image as fallback.
4. Placeholder.

A good real Fit Report image outranks retailer imagery by tier; it does not need to beat the retailer image's numeric score. When no eligible real wear image exists yet, retailer/brand imagery may represent the Product temporarily.

Fit Report candidates are scored deterministically from normalized garment visibility, sharpness, resolution, framing and exposure components, with perceptual duplicate detection. Starting weighting is **35 / 20 / 15 / 20 / 10** respectively. AI/image recognition may locate the relevant garment but does not invent the final quality score.

Do not switch Fit Report canonical candidates for trivial score changes. Starting replacement rule is approximately **new score ≥ current score + 5**, configurable later. Admin locks always override automatic replacement until explicitly unlocked.

For a specific tracked variation, the hierarchy is: admin-locked exact-variation image → eligible exact-variation Fit Report image → broader garment-family Fit Report canonical → exact-variation official image → garment-family official image → placeholder. This image relevance layer must consume the canonical tracked-variation model rather than inventing a second variation definition.

# 25. Admin catalog target — LOCKED
Admin must expose Products/candidates, identity-trust tier, distinct confirmation counts, open flags, flag priority, identifiers/barcode confidence, retailer links, Product Photo/Label evidence history and system-vs-admin resolution provenance.

Required review views/filters include at least Needs Review, **Needs More Evidence**, Provisional, Corroborated, Established, Verified, Has Conflicts and priority.

Unconfirmed active review is an exception queue prioritized by requested identity evidence. If admin cannot reasonably resolve an item, **Needs More Evidence** parks it outside active review. Member-added follow-up evidence automatically returns it to active Needs Review and recalculates priority.

Admin work is exception-driven: duplicate/identity conflict, explicit member uncertainty, incorrect information, member reports, content/photo problems, identifier/listing collisions and evidence disagreements—not mandatory approval of every clean new garment.

When variation tooling is reached, Admin must distinguish base Product identity, tracked fit variation, descriptive metadata, cosmetic fields and report-specific Size/Color/Fit Result. Admin tooling must consume the canonical variation-definition map and must not accidentally promote Size or Color into variation identity.

When Roadmap 13A canonical Product image selection is implemented, Admin must also expose intentional **Set as Product Image**, **Lock Product Image** and unlock controls plus enough score/eligibility/moderation context to audit why an automatic candidate did or did not win.

# 26. SerpAPI — ADMIN RESEARCH ONLY
SerpAPI checks private cache first, dedupes queries, respects caps and requires explicit resolution. Raw results never write directly to Product truth. Ordinary member search/intake/scanner does not use it.

# 27. Public homepage / FAQ — LOCKED
Homepage remains useful logged out; signed-in `/` enters the current Style Feed route.

Homepage order is Hero → distinct **WHAT LIKESIZED DOES** feature band → **THE LOOP** → FAQ. Published FAQ copy must be owner-approved and accurately explain current behavior without unverifiable competitor claims.

The locked third feature card is **FIT YOUR STYLE** / **Follow people whose fit and style you trust.** / supporting see-what-they-wear/style/recommend meaning / **Get Inspired →**. The three conceptual cards are **Find People My Size → See What Works for Them → Fit Your Style**.

The Fit Twin FAQ uses the current regional qualification rule: both Tops and Bottoms clearing the strong-match threshold qualify Fit Twin; one qualifying region yields Tops Twin or Bottoms Twin; Overall Match alone never grants Twin status.

The FAQ includes the community-built catalog explanation and a dedicated explanation for what to do when the member is not sure of the item/style/model, including use of the uncertainty checkbox instead of guessing. The proposed measurement-specific men/women FAQ wording remains pending owner review and must not be published until separately approved.

# 28. Data-quality rule
**Controlled when possible. Normalize when necessary. Free text only when useful.**

For implementation status, production checkpoints, owner re-audit order and exact next work, read `docs/AI_MASTER_LOG.md`.

## Roadmap 13A branch implementation reconciliation — PR #126 / NOT PRODUCTION YET
The Roadmap 13A image-selection direction above is now implemented on the explicitly owner-authorized draft Product Change branch `product/roadmap-13a-canonical-product-images`. This branch section supersedes the word **Planned** above only for PR #126 branch truth; production remains unchanged until exact-final verification, separate owner production authorization, merge and migration application.

The implemented Product contract is:
- generic Product representation uses one **persisted canonical winner** rather than page-specific ranking or request-time rescoring;
- individual Fit Report/Closet/Outfit evidence continues to use the member/report-specific image where that evidence is what the surface represents; canonical selection never rewrites the original Fit Photo;
- candidate technical scoring is server-authoritative and deterministic, with owner-locked starting weights **garment visibility 35 / sharpness 20 / resolution 15 / framing 20 / exposure 10**;
- the current scorer computes technical image metrics and dimensions and does not pretend that a full garment-recognition model exists; moderation/admin eligibility remains the authoritative escape hatch when the relevant garment is absent or the image is unsuitable;
- near-identical Fit Photos are grouped from private perceptual **dHash** fingerprints so duplicate copies do not compete independently;
- the automatic replacement margin is configurable and begins at **+5 points between measured Fit Photo candidates**; a pre-13A `legacy_neutral` synthetic bootstrap score yields to the first eligible measured candidate without forcing that candidate to clear an artificial +5 gap, after which the normal measured-to-measured anti-churn rule resumes;
- exact tracked-variation image identity remains separate from counted-report `objective_variant_key`; Size and Color do not become tracked-variation identity;
- exact variation resolves to its eligible Fit Photo winner when present, otherwise to the broader Product canonical. The current catalog does not invent a second exact-variation official-image store solely for 13A;
- real eligible Fit Photo imagery outranks Product Photo/official-imported fallback tiers; official/imported imagery is not a numeric-score competitor against real wear imagery;
- audited admin **Set as Product Image / Lock Product Image / Unlock Product Image** and eligibility controls remain authoritative, with a lock always winning;
- one bounded batch resolver handles up to 200 requested Products and batches private Fit Photo URL signing so consuming surfaces can later reuse the same canonical read boundary without N+1 selection/signing work.

Roadmaps 14–17 may consume this shared canonical resolver when their own audits are authorized; PR #126 does not opportunistically redesign Garment Detail, Explore, Search or Wish Locker.

## Demand-driven Match and FITuition scale architecture — PR #130 BRANCH ONLY
PR #130 changes the computation/reuse architecture without changing the canonical Match formulas, thresholds, coverage/reliability semantics, Body Match meaning or Fit Twin/Tops Twin/Bottoms Twin meaning. It remains branch-only until exact-final verification, separate owner production authorization, merge and release verification are complete.

- Current-person Match results are demand-driven and version-aware. A derived pair/category result is reusable only while both members' current Match-input revisions and the Match algorithm version remain current; a direct person view recalculates only the requested pair when needed.
- People discovery must not scan or materialize every possible person × person relationship. Discovery uses bounded/indexable candidate neighborhoods and then applies the exact canonical Match calculation to those candidates.
- LikeSized does not globally materialize every person × person or person × garment answer. Persistent derived caches are private/server-owned, bounded and invalidated by versions or relevant evidence changes.
- Full personalized garment FITuition is lazy/on-demand. Product and garment shells plus canonically required cheap summaries/report counts may load first. When current detailed personalization is not cached, the UI explicitly shows **Calculating your FITuition…** while the bounded calculation runs, and failures resolve to a controlled retry/error state instead of spinning indefinitely.
- Valid FITuition results may be reused only while the viewer's current Match inputs, the FITuition algorithm version and relevant garment evidence remain current. Evidence invalidation must avoid synchronous global recomputation storms.
- Cache/discovery optimization never changes the recommendation evidence hierarchy, historical snapshot Match math, exact tracked-variation identity/deduplication, the normal-condition and authenticated/shared evidence boundaries, or raw-measurement privacy.
- The performance budget for normal uncached personalized garment detail is approximately one second and under about two seconds at p95 as scale/load testing matures; this is a performance target, never permission to weaken correctness or privacy.
