# LikeSized

Working prototype for **LikeSized — See what fits people built like you.**

## Canonical rule
GitHub `likesized/Likesized` is the source of truth. No patch/fixed/v2/backup/parallel implementations. Database history is the ordered Supabase migration history; `supabase/schema.sql` is the historical bootstrap and `supabase/schema_contract.md` explains the current contract.

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
- Controlled overall + garment-specific Fit Reports
- Optional member-shared fit/reference photos in a non-public Storage bucket
- Evidence hierarchy from Exact Variant through Category Fit
- Historical garment evidence matched to the body snapshot from that try-on, unique-wearer capped for recommendations
- Fit Twins/following and member Shared Fit History
- Outfit posting, likes, All/Fit-Twins feeds and outfit-photo storage
- Product/brand/member search and discovery

## Authoritative architecture
`docs/V1_PRODUCT_SPEC.md` is the authoritative V1 fit/garment product architecture. `docs/AI_MASTER_LOG.md` is the durable AI-session handoff. Raw current and historical body measurements are owner-only. Current Fit Twin scores are current-body to current-body; garment evidence uses the historical snapshot attached to each Fit Report.

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
- `/closet`, `/closet/add` — Closet
- `/item/[slug]` — product evidence/recommendation
- `/outfits`, `/outfits/new` — outfits, likes and All/Fit-Twins feeds

## Next build milestone
1. Closet garment edit/remove controls.
2. Profile/privacy controls before public beta.
3. Continue richer garment-specific UX where the authoritative foundation is already in place.

Open comments remain deferred until moderation/reporting exists.

## Verification note
The connected Supabase schema/migrations, RLS and security policies have been verified live. A complete local npm build/typecheck still needs to run in an environment with package/network access; the current automation environment has previously been unable to resolve npm/GitHub package hosts.
