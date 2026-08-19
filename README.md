# LikeSized

Working prototype for **LikeSized — See what fits people built like you.**

## Canonical rule
GitHub `likesized/Likesized` is the source of truth. No patch/fixed/v2/backup/parallel implementations. Database history and product status must remain canonical in-repo.

## Project planning
`docs/AI_MASTER_LOG.md` is the **sole master guide, roadmap, status record and AI handoff**. README does not define build order.

Reference documents:
- `AI_REPOSITORY_RULES.md` — repository policy.
- `docs/V1_PRODUCT_SPEC.md` — authoritative product/fit architecture.
- `supabase/schema_contract.md` — database behavior/privacy contract.

## What is implemented
- Supabase email/password auth with protected routes
- Privacy-first RLS and least-privilege Data API grants
- Extensible private Fit Profile using controlled normalized body measurements
- Immutable private Fit Profile versions for historical try-on state
- Garment-specific People My Size matching with safe derived scores
- Canonical brands/products, product families, variants, retailer listings and normalized identifiers
- Controlled extensible garment taxonomy/attributes
- Original garment-size preservation plus structured normalized size identity
- Private and Shared Closet architecture
- Closet edit/remove controls that preserve immutable fit history; repeat try-ons create new observations
- Controlled overall Fit Reports plus schema support for garment-specific Fit Report dimensions
- Optional member-shared fit/reference photos in a non-public Storage bucket
- Evidence hierarchy from Exact Variant through Category Fit
- Historical garment evidence matched to the body snapshot from that try-on, unique-wearer capped for recommendations
- Fit Twins/following and member Shared Fit History
- Outfit posting, likes, All/Fit-Twins feeds and outfit-photo storage
- Product/brand/member search and discovery

## Important prototype boundaries
- The connected database currently has no users/products/Fit Reports, so database-backed flows are implemented but not yet exercised end to end with representative data.
- The public homepage still uses `lib/mock-data.ts` for demonstration match cards and must be converted before V1 beta.
- Garment-specific Fit Report dimension dictionaries exist in the database, but the current Closet logging UI does not yet collect those structured responses.
- Product Family / Similar Garment fallback structures exist, but current user logging does not yet populate enough family/attribute/material data to make those tiers broadly operational.
- Product pages currently target the canonical product rather than a selected exact variant.
- Canonical CI now uses the committed npm lockfile, runs `npm ci`, typecheck and Next.js build, and replays the complete ordered Supabase migration set on a fresh disposable local database.

## Authoritative fit rules
Raw current and historical body measurements are owner-only. Current Fit Twin scores are current-body to current-body; garment evidence uses the immutable historical snapshot attached to each Fit Report. Do not blend the two.

## Closet history rule
Changing current body measurements or logging a new try-on never rewrites an old Fit Report. Closet edit controls change current sharing/wear-count settings. A new fit experience creates a new observation tied to the current immutable body snapshot. Deleting a Closet item is explicit and removes that item's fit history; canonical product catalog records remain.

## Storage
- `fit-reference-photos`: non-public; authenticated members may read shared references; only the owner writes/deletes.
- `outfit-photos`: non-public/member-readable; owner-only writes.
- Legacy `closet-photos`: retired/empty with no application access policies.

**Fit-photo rule:** upload is optional. If uploaded, it is shared with authenticated LikeSized members. There is no private fit-photo mode.

## Product evidence
Exact evidence is preferred. Fallback hierarchy: Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit. Recommendation aggregation uses at most one strongest observation per unique wearer.

## Fit Twins
A Fit Twin is a Fit Match the user deliberately saves/follows; no universal percentage cutoff is invented. Member profile headers show current match scores separately from historical Shared Fit History.

## Key routes
- `/` — public home
- `/signup`, `/login` — auth
- `/onboarding` — private versioned Fit Profile
- `/search` — discovery
- `/people` — People My Size
- `/people/[username]` — member/Fit Twin profile and Shared Fit History
- `/twins` — saved Fit Twins
- `/closet`, `/closet/add`, `/closet/[id]/edit` — Closet
- `/item/[slug]` — product evidence/recommendation
- `/outfits`, `/outfits/new` — outfits, likes and All/Fit-Twins feeds

For exact current status and the next phase, read `docs/AI_MASTER_LOG.md`.
