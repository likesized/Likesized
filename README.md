# LikeSized V1

Working prototype for **LikeSized — See what fits people built like you.**

## Canonical rule
GitHub `likesized/Likesized` is the source of truth. No patch/fixed/v2/backup/parallel implementations. Database history is the ordered Supabase migration history; `supabase/schema.sql` is the historical bootstrap and `supabase/schema_contract.md` explains the current contract.

## What is implemented
- Supabase email/password auth with protected routes
- Privacy-first RLS and least-privilege Data API grants
- Extensible private Fit Profile using controlled normalized `body_measurements`
- Garment-specific People My Size matching with safe derived scores
- Canonical brands/products, product families, variants, retailer listings and normalized identifiers
- Controlled extensible garment taxonomy/attributes
- Original garment-size preservation plus structured normalized size identity
- Private and Shared Closet architecture
- Controlled overall + garment-specific Fit Reports
- Optional member-shared fit/reference photos in a non-public Storage bucket
- Evidence hierarchy from Exact Variant through Category Fit
- Fit Twins/follows, member profiles, outfits and search/discovery
- Outfit-like database support

## Authoritative architecture
`docs/V1_PRODUCT_SPEC.md` is the authoritative V1 fit/garment product architecture. `docs/AI_MASTER_LOG.md` is the durable AI-session handoff. The final architecture supersedes the earlier fixed-column Fit Profile/simple product-size/photo model.

Raw body measurements and normally worn bra/shoe size references are owner-only. Other members receive safe Fit Match percentages and only deliberately shared Closet/Fit Report/photo evidence.

## Storage
- `fit-reference-photos`: private from the public internet; authenticated LikeSized members may read photos whose associated Closet item is shared; only the owner may write/delete their files.
- `outfit-photos`: private from the public internet and member-readable; owner-only writes.
- Legacy `closet-photos`: retired/empty and has no application access policies. Application code must not use it.

**Fit-photo rule:** upload is optional. If uploaded, the fit/reference photo is shared with authenticated LikeSized members. There is no private fit-photo mode.

## Product evidence
Exact evidence is preferred. When unavailable, the data foundation supports Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit. Evidence level must be surfaced rather than presenting fallback evidence as exact-product data.

## Fit Twins
A Fit Twin is a Fit Match the user deliberately saves/follows; no universal percentage cutoff is invented. Raw body measurements never appear on Fit Twin/member pages.

## Key routes
- `/` — public home
- `/signup`, `/login` — auth
- `/onboarding` — private Fit Profile
- `/search` — product/brand/member discovery
- `/people` — People My Size
- `/people/[username]` — member/Fit Twin profile
- `/twins` — saved Fit Twins
- `/closet`, `/closet/add` — Closet
- `/item/[slug]` — product evidence/recommendation
- `/outfits`, `/outfits/new` — outfits

## Exact build checkpoint
Before the authoritative architecture correction, canonical `main` was `2fd2fcb` and the next incomplete step was **Outfit likes UI + Fit-Twins-only outfit feed UI**. After this correction is synchronized and verified, resume that exact step. Then continue Closet edit/remove controls and profile/privacy controls.
