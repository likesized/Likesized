# LikeSized

V1 application for **LikeSized — See what fits people built like you.**

## Canonical source-of-truth roles
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — sole roadmap, status, owner-decision, recovery/salvage, deployment and AI-handoff record.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy contract and explicit implementation debt.
- `supabase/migrations/` — executable ordered database history.
- `README.md` — summary only; never a competing decision source.

If the canonical docs disagree, stop feature work and reconcile them. Do not resurrect an old LOCKED decision from another branch/file.

## Current implementation status
Canonical recovery is complete and the recovery freeze is cleared. The primary active owner-preview implementation line is PR #47 / `correct-grouped-menu-layout`. PR #47 is not authorized for production merely because source or CI is ready.

The current owner priority is the final **New Fit Report + community-built catalog** conversion. The earlier external/API catalog-import strategy is superseded. Historical provider migrations remain immutable ordered history where already applied, while the later community-catalog migration retires their active runtime objects.

For exact branch status, verification checkpoints, deployment history and next action, read `docs/AI_MASTER_LOG.md`.

## Current product meaning

### Community-built catalog
**A clothing catalog built by the people who actually wear it.**

- LikeSized grows from the starter Product catalog plus member contributions rather than an external catalog API.
- Barcode scanning searches LikeSized's own canonical catalog only.
- Manual entry searches canonical Brand/Product records first.
- Members answer the simple required observable garment questions and may leave genuinely unknown optional catalog-enrichment facts blank.
- A later independent member sees accumulated Product facts, fills missing facts they know, or reports a specific field as incorrect.
- Independent agreement strengthens Product facts; conflicts are preserved for review instead of silently overwriting another member's claim.
- The owner-supplied 150 starter Products are seeded as Brand + Item/Model + Garment Type only. Unknown metadata is not fabricated.

### New Fit Report
Opening choice:
- Scan barcode
- Enter item manually

Main order:
1. Brand / Make
2. Item / Model
3. Garment Type
4. up to four Type-specific controlled questions; each starts blank and requires a selection, with **Not sure** last
5. Color
6. Size
7. Overall Fit Result
8. Condition
9. optional Fit Photo
10. optional Fit notes

Then a clearly separated optional community-catalog section:
- Retail link
- UPC / Barcode when not already captured by scanning
- Manufacturer Style / Article Number
- controlled Material / Fabric Composition
- Product photo
- controlled Department

Known Product facts are prefilled/read-only by default. A member reports a specific incorrect field as evidence rather than directly rewriting canonical Product truth.

### Following vs Fit Twin
**Following controls My Circle; Fit Twin is a designation inside it.**

- Following = user-controlled social relationship stored in canonical `follows`.
- A member may follow anyone regardless of Match %.
- Fit Twin = **system-generated** strong current-person Match designation applied only to someone the member follows; the initial threshold is configurable and starts at 85% Overall Match.
- A followed person may or may not qualify as a Fit Twin; a non-followed person is not one of that member's Fit Twins.
- Style Feed is driven by Following and contains posts from My Circle.
- Public relationship count is Followers, not Fit Twins.
- `Save as Fit Twin`, `Saved Fit Twin`, and `Remove Fit Twin` are obsolete member-facing actions.
- Legacy route/function/database names containing `fit_twin` are implementation debt, not product meaning.

### Fit Result
- Fit Result = Too Small / Snug / Just Right / Relaxed / Too Big.
- There is **no current V1 1–5-star Fit Rating UI**.
- A legacy DB type named `fit_rating` may store those physical outcomes, but that identifier does not authorize star/satisfaction UI.

### Matching and recommendations
- current-person body matching and historical garment-evidence matching are separate contexts;
- historical garment evidence remains attached to the immutable body state from that try-on;
- Match % means garment-relevant body similarity, not probability the garment will fit;
- Preferred Fit, confidence-aware matching, directional recommendation evidence and the recovered Fit Match rules remain canonical.

Current recommendation hierarchy:
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**.

Help Me Size It is fallback sizing assistance only when strong normal matched-wearer evidence is insufficient. It reuses the canonical recommendation engine and never creates a second sizing engine.

`Would Buy Again` does not influence size recommendation/confidence.

### Garment metadata boundaries
- one controlled taxonomy is shared by Explore + New Fit Report;
- required Type-specific Product questions use controlled values and explicit selection;
- optional Material/Fabric Composition is now controlled community catalog enrichment, not free text and not recommendation input;
- storing Material does not automatically make it a Browse filter;
- Stretch is not an active V1 member input/classification/filter;
- Color remains required controlled garment data.

### Explore
Current owner-approved direction includes:
- Garments | Outfits;
- My Fit Matches | All;
- 75%+ My Fit Matches eligibility;
- separate 85%+ Fit Alert threshold;
- one canonical Product search result rather than duplicate wearer/Fit Report rows;
- compact mobile search suggestions;
- full-screen opaque mobile mini-browser;
- image fallback instead of blank cards;
- Product, wearer, Like, Wishlist, Shop and fallback Notify interactions must remain distinct;
- no stars.

### Retail links and commerce
- one canonical Product may have multiple retailer listings;
- new valid retailer links append/dedupe instead of overwriting other valid retailers;
- **Like + Wishlist + Shopping Cart/Shop** appears on relevant garment surfaces only when a valid retailer listing exists;
- no valid listing means no Shop action;
- Skimlinks or another owner-approved affiliate layer is roadmap-locked after retailer-link behavior is stable;
- affiliate routing must preserve the original canonical retailer listing and commission must never influence fit, recommendation, search relevance or ranking.

### LikeLocker and Gift Lists
LikeLocker opens to Garments and filters **Garments / Outfits / Wish Locker**. Ordinary Product likes, Outfit likes, and products specifically wanted for purchase remain distinct saved intents in that one destination.

LikeSized Gift Lists remain roadmap-locked. They reuse canonical Product + canonical sizing/confidence systems, are owner-controlled for sharing, never expose raw measurements, and may surface eligible retail links without commerce influencing fit recommendations.

### Admin / catalog quality
Authorized admin review must ultimately cover:
- Conflicting Product Facts
- Possible Duplicates
- Reported / Spam Content
- Review / Audit History

The roadmap requires canonical merge/split tools, field/description override + permanent lock/reopen, inappropriate Fit/Product/Outfit photo removal, spam intake/Fit Report removal, and accountable audit history. These extend the existing moderation/evidence system rather than creating a parallel catalog.

### Outfits
Outfits remain in V1. Earlier removal direction is superseded. Owned Outfits live in My Closet, other-member Outfit discovery lives in Explore, and followed-person Outfit activity lives in Style Feed.

## Database rule
`supabase/migrations/` is the executable database history. Do not hard-code a migration count in documentation. Do not rewrite applied migrations. `supabase/schema.sql` is retired as an alternate schema source.

## Verification
Canonical CI runs the integrity/drift check before typecheck/build/database replay. Current community-catalog work is not complete until canonical integrity, TypeScript, focused tests, production build, full fresh migration replay and database behavior/privacy tests pass on the current PR #47 head and the owner reviews the resulting Preview.
