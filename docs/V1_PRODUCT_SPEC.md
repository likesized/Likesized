# LikeSized V1 Product Spec

## Promise
**See what fits people built like you.**

LikeSized answers: **How did this garment fit people built like me?**

## Canonical role
This file owns current Product/fit architecture. Roadmap/status/deployment history lives in `docs/AI_MASTER_LOG.md`. Database behavior/privacy lives in `supabase/schema_contract.md`. Superseded behavior belongs in Git history rather than competing current-state prose.

# 1. Privacy and body-state architecture — LOCKED
- Raw current/historical measurements and private size references remain owner-private.
- Immutable Fit Profile versions preserve historical body state for Fit Report evidence.
- Current-person Match and historical garment Match return safe derived scores/context only.
- A member profile photo, when supplied, is public current identity. Outfit/comment/profile/discovery surfaces resolve current identity.
- City/State is required private profile metadata in setup/settings, not public profile data and not a Match input.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

# 2. Match architecture — LOCKED
- **Current-person Match** compares the viewer's current body with another member's current body.
- **Historical garment Match** compares the viewer's current body with the private body snapshot attached to historical Fit Report evidence.
- Match percentage means garment-relevant body similarity, not probability a garment will fit.
- Universal visible Match tiers remain 85–100 green, 70–84 blue, 50–69 amber, under 50 neutral gray. Low Match is not an error state.
- When a Match cannot be calculated because the two profiles do not share enough comparable measurements, show **Not enough information** and explain that either person may need additional matching measurements. Do not fabricate a percentage.

# 3. Fit Community, Following and Fit Twin — LOCKED
- Fit Community is Men / Women / Both and never changes Match math.
- **Following** is member-controlled through one canonical `follows` graph.
- **Fit Twin is system-generated** from strong current-person regional Match quality; it is not a manually saved second relationship graph.
- Tops and Bottoms qualify independently at the canonical threshold. Both qualify → Fit Twin; Tops only → Tops Twin; Bottoms only → Bottoms Twin. Overall Match alone does not grant Twin status.
- People My Size defaults to Twin-level qualifying people and exposes All Matches as the broader alternate view.
- Follow/Following actions use canonical in-place relationship behavior where offered.

# 4. Controlled Product identity — LOCKED
LikeSized uses one controlled community-built canonical Product catalog.
- Product identity centers on normalized Brand + Item / Style / Model + Garment Type.
- Size, Color, retailer, Fit Result, materials, condition, notes and purchase context do not independently define a second base Product.
- Unconfirmed is pre-publication identity uncertainty. Provisional begins with one distinct wearer, Corroborated with 2–4, Established with 5+, Verified only with authoritative/admin review.
- Repeated reports from one member do not manufacture distinct-wearer trust.
- Barcode relationship confidence is separate from Product confidence. One Product may have multiple legitimate barcodes; competing Product claims for one barcode are review evidence rather than silent reassignment.
- SerpAPI is admin research only and never automatic canonical Product truth.

# 5. New Fit Report — LOCKED
Opening choices remain:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback **Tags missing? Enter item manually →**.

Opening helper: **Scan the barcode or add a photo of the tag so we can verify the exact item.**

When no canonical Product match is active: **Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.**

Every new Fit Report requires at least one Front Fit Photo, Back Fit Photo, or Product Photo. Product Label/Tag Photo is separate private identity evidence. Front/Back are wear evidence; Product Photo is Product/catalog evidence. Fit Report/Closet display priority remains Front Fit Photo → Product Photo → Back Fit Photo.

Brand/Item identity reset must invalidate incompatible Product-derived defaults rather than silently retaining a previous Product match.

# 6. Tracked fit configuration — LOCKED
- Only controlled structured questions actually asked for the Garment Type may define tracked fit configuration.
- `lib/garment-taxonomy.ts` is the one canonical variation-defining question map.
- Size never defines tracked variation.
- Color never defines tracked variation.
- Historical counted-report `objective_variant_key` remains distinct from tracked fit-configuration identity. Do not substitute one key for the other.

# 7. Recommendation / FITuition architecture — LOCKED
- FITuition uses the one canonical recommendation engine; page-specific recommendation algorithms are prohibited.
- Recommendation evidence dedupes same person + same Product + same tracked fit configuration to one evidence unit. Distinct people remain independent.
- Exact Product/configuration evidence is strongest. Related Product/configuration evidence is reduced fallback/support only where the canonical engine allows it.
- Viewer Closet history may contribute through the canonical relevance logic without rewriting original historical body snapshots.
- Recommendation confidence is separate from recommendation score.
- Would Buy Again is not Fit Report/FITuition evidence.
- Candidate discovery and personalized enrichment remain bounded, batched and version/cache aware. Do not materialize all person×person or person×Product combinations.

## Tagged Outfit garment FITuition
- `Relevant Fit Reports: X` means useful personalized exact Product + exact tracked-configuration evidence for that clicked Outfit garment.
- Tagged-card counts load through one bounded Outfit-level summary boundary with client cache/in-flight dedupe; full selected-garment FITuition remains lazy.
- Zero relevant exact evidence does not force a size recommendation. Compact Notify remains available through the canonical Product evidence notification system.
- Tagged garment quick view remains a compact surface and routes deeper through **See Full Details →**.

# 8. Full Garment Detail — LOCKED CURRENT DESIGN
The full `/item/[slug]` experience contains only:
1. Product hero / Brand / Product Name.
2. Shopper-facing fit-configuration filter rows when meaningful.
3. Canonical utility actions.
4. One FITuition evidence/recommendation section.
5. Style Inspiration at the bottom when eligible Outfit content exists.

Do not restore separate visible technical sections such as SIZE MATCH EVIDENCE, BEST EXACT VARIATION, CLOSEST RELATED VARIATION, YOUR CLOSET HISTORY or internal tracked-variation dumps.

## Shopper-facing attribute rows
Tracked configuration is exposed as independent understandable filter dimensions rather than compound configuration pills.

Example:
- **Cut:** Bootcut | Slim | Straight | Skinny
- **Rise:** Low Rise | Mid Rise | High Waisted

Rules:
- Each variation-defining question becomes its own row only when more than one meaningful option exists for the Product evidence context.
- Selecting one row changes that dimension while retaining compatible selections in the other rows. Selecting High Waisted once remains active while the member changes Cut.
- Combined active selections resolve one internal tracked fit configuration for evidence/image scoping.
- Never expose tracked-variation hashes, database IDs or technical key terminology.
- Never treat Size or Color as tracked fit-configuration identity.

## Garment utility actions
Use the canonical actions: LikeLocker · Wish Locker/Wishlist · Shop when a valid retailer destination exists · Share · Report. Utility actions do not show public counts.

## Full Garment FITuition strong-evidence state
When the selected configuration has enough strong evidence to safely support the recommendation:
- lead with **FITuition recommends: Size [X]**;
- show **Confidence: [label]** and the relevant Fit Report count supporting the recommendation;
- show **Aggregate Fit Report evidence** for qualifying strong Body Matches, grouped by the actual size/Fit Result evidence;
- then show **Your Closest Match** as supporting individual evidence with Body Match percentage, clickable `@username`, size worn and actual Fit Result.

The closest person's username routes to the canonical member profile so the viewer can find/follow a potential Fit Twin. Aggregate evidence supports the recommendation; the individual closest match does not replace the aggregate.

## Full Garment FITuition insufficient-evidence state
When evidence is not strong enough:
- do not force a recommended size;
- lead with **Not enough evidence yet to confidently recommend a size.**;
- show the best available individual Fit Reports for the selected configuration even if their Body Matches are weaker;
- each surfaced individual shows actual Body Match, clickable `@username`, size worn and actual Fit Result;
- clearly state that weaker Body Matches may be less predictive;
- expose compact **Notify Me** through the canonical Product evidence notification system.

LikeSized does not currently collect body-area garment-fit ratings. Never invent Waist/Hips/Thighs/Length fit-result rows or similar derived claims that were not collected.

# 9. Style Inspiration — LOCKED CURRENT DESIGN
At the bottom of Garment Detail:
- heading **STYLE INSPIRATION**;
- copy **See how people are styling this garment.**;
- zero eligible tagged Outfits → hide the section;
- one to three → show available Outfit thumbnails;
- four or more → show three and **View More in Explore →** through the canonical Explore Product filter;
- thumbnails open the canonical Outfit experience;
- selected tracked configuration scopes eligible evidence where available;
- recent candidate discovery is bounded to a 90-day window and ranked by existing engagement signals with recency tie-break;
- only the small displayed media set is loaded; do not eagerly load Explore/feed content inside Garment Detail.

# 10. Style Feed — LOCKED CURRENT DESIGN
Style Feed is a passive image-first Outfit inspiration surface sourced from published Outfits of people the viewer already follows.

## Relationship and ordering
- Default relationship view is **Fit Twins**; **All Following** is the alternate view shown beside it at the top.
- Fit Twins includes followed Fit Twin, Tops Twin and Bottoms Twin designations.
- The Fit Twins view never silently broadens to All Following.
- Ordering is newest published Outfit first within active filters; do not invent hidden Match ranking.
- Occasion and searchable Style Tags remain compact additional filters.
- When the Fit Twins feed is exhausted, **See All Following →** switches the current feed to All Following and **Find More Fit Twins →** routes to People My Size. Those actions remain distinct.

## Image board
- The main feed is primarily Outfit images, not repeated full Outfit-detail cards.
- Each Outfit contributes one lead image tile to the board.
- Desktop uses a compact multi-column image grid.
- Mobile reference scale is **2 columns** and is sized so roughly **2 rows / 4 Outfit images are visible together** on a normal phone viewport.
- Tile previews may use a reasonable bounded crop to preserve the compact discovery wall; the full photo remains available in the popup/gallery.
- Main-board tiles do not permanently show creator rows, descriptions, action bars, comments or garment panels beneath every image.
- Multi-photo Outfits show one board tile; their complete gallery lives in the popup/full Outfit experience.

## Outfit popup
Tapping/clicking a feed image opens a large in-place Pinterest-style Outfit popup rather than immediately navigating away.

The popup reuses canonical systems and contains:
- canonical Outfit photo gallery;
- creator Display Name + `@username` and canonical profile navigation/behavior;
- Fit Twin/Tops Twin/Bottoms Twin context;
- actual Tops/Bottoms Body Match percentages where calculable;
- **Not enough information ?** where comparable measurement coverage is insufficient, with an explanation that either profile may need more matching measurements;
- headline/description/caption and Outfit tags;
- Like;
- canonical Comments with the accessible comment count;
- Share;
- **View Garments** through the canonical tagged-garment quick-view system;
- explicit **View Full Outfit →** navigation.

The popup is a presentation shell around canonical interactions, not a duplicate Outfit/garment/profile/comments implementation.

## Style Feed media
The shared `OutfitGallery` no longer reserves a giant fixed viewport-height stage. The normal displayed image controls the natural bounded media height. Mixed aspect ratios must not create a giant blank panel, stretch or crop the actual full-display image. Full-size imagery is scrollable when larger than the viewport and retains normal close/navigation behavior.

## Tagged garments and comments
- View Garments must expose every legitimate tagged garment returned by the canonical Outfit tagged-item boundary.
- Tagged garment retrieval/detail remains lazy, cached/in-flight deduped and bounded; do not eager-load full garment/FITuition evidence across the feed.
- Comment counts shown in the popup must correspond to comments the canonical comments experience can actually open.

# 11. Outfit canonical behavior — LOCKED
- One published Outfit uses one shareable `/outfits/[id]` route.
- Gallery supports one active image at a time, multi-photo navigation and full-size view.
- Optional captions remain hidden by default behind Caption control.
- Safe public hotspots and tagged items use the canonical tagged-item quick view.
- Like/comment interactions use local/API interaction paths rather than whole-page navigation for every action.
- Published Outfit public content does not expose private measurements, private Closet linkage or unresolved candidate state.

# 12. Product imagery — LOCKED
Generic Product discovery/detail surfaces use the shared canonical Product image resolver and its stored selection hierarchy rather than page-specific image choice. Report-specific/member-worn surfaces may retain the actual report/worn image appropriate to that evidence. Admin-locked imagery wins. Automatic Fit Report candidate selection remains deterministic/auditable, and official/imported imagery is fallback when no higher-priority eligible real-world image exists.

# 13. Shopping / lockers — LOCKED
LikeLocker, Wish Locker and Shop are independent.
- LikeLocker = Product affinity/save state.
- Wish Locker = purchase-intent state.
- Shop appears only when a valid canonical retailer destination exists.
- Affiliate/retailer state never changes Product identity, Match or recommendation ranking.

# 14. Help Me Size It — LOCKED
**Help Me Size It is fallback**, not the primary route when FITuition already has enough evidence. It may collect additional sizing context without changing canonical Product identity or Body Match meaning.

# 15. Performance and future app boundary — LOCKED
- Avoid N+1, unbounded reads, duplicate requests, eager hidden heavy UI and avoidable full-page revalidation.
- Prefer bounded/indexed/set-based queries, caching/dedupe, Suspense/deferred nonessential personalized work and appropriately sized media.
- Keep Match/recommendation/business rules reusable outside UI-specific code where practical so future app clients can consume the same canonical server/data behavior.
- Never create separate web-vs-app Product truth.

# 16. Audit boundary
Current Style Feed and Garment Detail Product truth above is implemented in the owner-authorized PR #136 candidate but remains owner-audit pending until the exact verified candidate is deployed and reviewed on `likesized.com`.

After that audit, the planned owner-review sequence is Explore → People My Size → Member/Public Profile → remaining surfaces. Those later audits are not authorization to redesign them inside the current batch.
