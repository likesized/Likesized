# LikeSized

V1 application for **LikeSized — See what fits people built like you.**

## Canonical rule
GitHub `likesized/Likesized` is the source of truth. No patch/fixed/v2/backup/parallel implementations. Git history is history; the working tree and current canonical docs must describe the current product.

## Canonical document roles
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — **sole roadmap, status record, owner-decision ledger and AI handoff**.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract and implementation debt where schema naming lags product terminology.
- `README.md` — summary only; it must never override the master/spec/contract.

If these documents disagree, stop implementation and reconcile them. Do not choose an older “LOCKED” statement simply because it remains in another file.

## Current product architecture
- Private versioned Fit Profile with owner-only raw body measurements.
- Immutable historical body snapshots attached to Fit Reports so later body edits never rewrite old try-on evidence.
- Garment-specific current-person matching plus separate historical garment matching.
- Canonical brands/products, product families, variants, identifiers and retailer listings.
- Controlled Category → Type → Style garment taxonomy shared by Browse and New Fit Report.
- Original garment-size preservation plus structured normalized size identity.
- Private and Shared Closet architecture.
- Optional Shared fit/reference photos with RLS/privacy enforcement.
- Recommendation evidence hierarchy: **Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.
- One strongest historical observation per unique wearer for recommendation aggregation; all legitimate reports remain reviewable evidence.
- Canonical recommendation-confidence implementation in `lib/recommendation.ts`.
- Canonical product/member search and deduplicated product discovery.
- Outfits, Outfit likes and Shared garment links remain in V1.

## Current social meaning — important
**Following and Fit Twin are not the same thing.**

- **Following** is the member-controlled social relationship stored in canonical `follows`.
- **Fit Twin** is a system-generated strong-match designation derived from current-person matching.
- A member may follow someone at any Match %.
- A Fit Twin does not have to be followed.
- Style Feed is driven by Following, not automatic Fit Twin status.
- Public relationship count is **Followers**, never “Fit Twins.”
- Do not use member-facing actions such as Save as Fit Twin / Saved Fit Twin / Remove Fit Twin.
- Some current route/function/database names still contain legacy Fit-Twin wording. They are implementation debt to be cleaned during the dedicated social audit and do not redefine the current product model.

## Current fit-result rule
- **Fit Result** is the user-facing physical outcome: Too Small / Snug / Just Right / Relaxed / Too Big.
- **There is no current V1 1–5-star Fit Rating UI.** Do not display/request stars in Browse, Search, Fit Reports, Closet, Product, Help Me Size It, Outfit garment tags or member surfaces.
- Existing old schema/history may remain until deliberately audited; dormant fields do not make the star system a current feature.

## Help Me Size It
**Help Me Size It is a fallback, not a primary sizing mode.**

Normal strong same-product matched-wearer evidence comes first. When strong evidence is insufficient, Help Me Size It reuses the existing recommendation hierarchy to provide a clearly labeled estimate, then shows **Other Fit Reports** for that same canonical garment underneath. It never creates a second sizing engine and never fabricates certainty.

Brand sizing tendency is derived from LikeSized evidence at **Brand + Garment Type** level rather than a generic database of unsupported claims such as “Brand X runs small.”

## V1 garment metadata boundaries
- Material composition may be retained only as reliable manufacturer/product-source background data; members do not enter/verify it and it is not a V1 Browse filter.
- **Do not collect, classify or infer stretch in V1.** Legacy schema/options may remain dormant until cleanup.
- Standardized Color may be used for garment discovery, but one canonical Product is not duplicated into separate Browse cards for each colorway.

## Privacy and history
Raw current/historical measurements are owner-only. Current person scores and historical garment scores are separate contexts and must never be blended.

Changing current body measurements or logging a later try-on never rewrites an old Fit Report. A new fit experience creates a new observation tied to the body snapshot from that try-on.

Fit/reference photos are optional. If uploaded, the garment is Shared and the photo is visible to authenticated LikeSized members. There is no private fit-photo mode.

## Search / Browse direction
- Browse searches Garments, Outfits and People.
- Normal garment search returns one canonical product result rather than duplicate rows for every wearer/Fit Report.
- Live mobile suggestions are compact list rows under the search field.
- Product/image, wearer, Like, Save and Notify are distinct interaction targets.
- Missing garment imagery falls back to a LikeSized garment placeholder; blank image areas are not acceptable.
- Mobile Browse mini-detail is an opaque full-screen flow with clean Back/X behavior.

## Current routes / implementation note
Current source still contains routes created under earlier terminology, including `/twins`, `/following` and Fit-Twin-named notification helpers. Do **not** infer product semantics from those names. Phase 6.5.3 owns the canonical social terminology/route cleanup after Browse and the deferred desktop Fit Profile check.

For exact current status, owner-locked decisions, deployment state and next action, read `docs/AI_MASTER_LOG.md`.