# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current-status record, owner-decision ledger, deployment ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/deployment/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED
Once the owner says **push**, **deploy**, **submit**, **proceed**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

The working batch loop is:

**implement the complete approved batch → targeted relevant checks → full CI at the deliberate stopping point → merge the exact tested candidate → deploy the exact merge → verify live production → reconcile canonical docs**.

Do not call a batch done merely because source was edited or a preview built. The owner verifies fixes on `likesized.com`.

## Live repair fast path — OWNER DIRECTED
During an owner live audit, concrete owner-reported breakage plus a direction to fix it authorizes implementation on the one active repair branch. Do not stop for repeated approval questions, repeated status-only handoffs or parallel repair branches. Production/main still requires explicit authorization unless the owner has already granted deployment for the current frozen batch.

## Future app transition — OWNER LOCKED 2026-08-24
LikeSized remains web-first while V1 is completed and owner-audited, with intended app transition after the web product is mature enough.

Going forward:
- keep product/business rules, Match logic, validation, permissions and canonical data behavior reusable outside UI-specific code when practical;
- prefer stable service/data boundaries and typed contracts shared by web and a future app;
- keep Supabase auth/data/storage/media/server-validation behavior reusable;
- isolate browser-only DOM/file/history/local-state concerns;
- treat mobile camera, touch and constrained devices as first-class now;
- never create separate web-vs-app product truth;
- do not prematurely choose a native framework or rewrite working V1 solely for hypothetical portability.

# CURRENT STATUS — 2026-08-25

## Canonical production line — LIVE THROUGH PR #87
Production application source of truth is PR #87 squash merge **`96905b411dcef2b2a7b0cd55ef379986eff402db`** on `main`.

PR #87 **Repair Fit Report and Outfit interaction regressions**:
- exact tested PR head: **`c0df62b3593c27dc61decdf5115e22d2c367bcd2`**;
- full LikeSized CI #918 (`32882956817`) passed canonical integrity, exact dependencies, TypeScript, all focused application safeguards, production build, fresh migration replay and database behavior/privacy tests;
- squash merge: **`96905b411dcef2b2a7b0cd55ef379986eff402db`**;
- post-merge CI #919 (`32883274244`) passed;
- Vercel production: **`dpl_FxhPv4KL3ecgQBghX2mwhsRoSHNL`** READY and serving `likesized.com`;
- live homepage returned HTTP 200;
- public logged-out Outfit smoke on `/outfits/d9ce4a2f-055c-4267-9ab3-11654b86965c` returned HTTP 200 with public safe hotspots and no personalized Body Match/FITuition leakage;
- checked deployment runtime error/fatal window was clean;
- no new Supabase migration was introduced.

PR #87 repaired the current Roadmap 12 interaction regressions without changing the underlying Product/Fit evidence model:
1. missing required Fit Report photos now produce a visible Photos-section error rather than a silent submit no-op;
2. full-size image dismissal now supports a real drag/swipe-down interaction while retaining intentional close/Escape behavior;
3. garment Wishlist uses a dedicated shopping-bag + heart visual instead of an unexplained generic symbol;
4. garment utility actions do not expose meaningless public counts;
5. tagged garment quick view has one navigation destination, **View Garment →**, rather than competing **See fit evidence** and **Full details** links.

PR #86 **Finish Roadmap 12 interaction consistency batch** is prior immutable production history:
- exact tested PR head: **`0873fbfdf087b1a3d6eca1d89b010ef0e4e320c0`**;
- full pre-merge CI #915 (`32879246213`) passed;
- squash merge: **`6dccf40032d12fd68c5fc5ee85ad4a4e75a8db19`**;
- Vercel production: **`dpl_CcFjyZDHZmP6rxEwNWuRrQtUVEdP`** READY before PR #87 superseded it;
- no new Supabase migration was introduced.

PR #85 **Finish Outfit interaction and Fit Report photo batch** and earlier Roadmap 12 batches remain immutable Git/deployment history. Current product truth is described below rather than retaining superseded repair-state prose as competing current instructions.

Latest production database mappings relevant to Roadmap 12:
- `20260825021000_outfit_comment_cursor_pagination.sql` → **`20260825025014 outfit_comment_cursor_pagination`**;
- `20260825122000_outfit_photo_captions.sql` → **`20260825133233 outfit_photo_captions`**;
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → **`20260825155645 outfit_public_hotspots_and_comment_sorting`**.

## Current primary active line — COMPLETION REPAIR + ROADMAP RECORDING
Active branch: **`agent/canonical-product-image-roadmap`**.

This line contains the owner-locked Roadmap 13A canonical Product-image-scoring plan plus the current owner-directed completion repairs. It is **not production-live** and has no production authorization merely because implementation is present.

Current completion-repair scope:
1. replace the invalid composed Wishlist emoji/glyph with one deterministic shopping-bag + heart SVG whose active state fills the heart;
2. simplify Outfit creator quick view to **Overall Match** alone, then **Tops Match | Bottoms Match**, then **Total Garments | Total Outfits**, with no boxed table/grid chrome;
3. make Total Garments count distinct garment/Fit Report associations rather than relabeling raw Fit Report count;
4. collect optional **City + State** only during initial Fit Profile setup, keep it private, make it editable later in Settings, and do not re-show it on My Measurements updates;
5. add owner-private database storage for city/state so future anonymous regional aggregates such as wishlist demand can be built without exposing location on public/member profile surfaces.

## Roadmap 12 — New Outfit — CURRENT OWNER AUDIT GATE
Roadmap 12 is production-live through PR #87 and is still under owner audit.

**Roadmap 13 remains blocked until the owner explicitly finishes the New Outfit/Roadmap 12 audit and accepts the production stopping point.**

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means garment-relevant body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.
- A profile photo, when uploaded, is public current identity. Outfit/comment/profile surfaces resolve current identity rather than snapshotting an old avatar.
- City/state is private member metadata, not a public profile field and not part of Body Match. It may support future anonymous regional aggregate insights such as regional wishlist demand.
- Initial setup may ask City + State once. After completion, city/state is edited in Settings and does not reappear on My Measurements.

## Fit Community / Following / Twin status
- Fit Community = Men / Women / Both; it is wearer/social relevance metadata and never changes Match math.
- **Following** is member-controlled.
- One canonical `follows` graph exists.
- **Fit Twin is system-generated** among followed people from strong current regional Match quality.
- Both Tops + Bottoms qualify → Fit Twin; Tops only → Tops Twin; Bottoms only → Bottoms Twin; Overall Match alone never grants Twin status.
- Follow alone does not enable person notifications.

## Controlled Product identity trust
- Unconfirmed = pre-publication candidate only when Item / Style / Model identity is explicitly uncertain.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
- Repeated reports from one member do not manufacture distinct-wearer Product trust.
- Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define another base Product.
- Barcode relationship confidence is separate from Product confidence; competing Product claims for one barcode are review evidence, never silent reassignment.

## New Fit Report — evidence-first flow
Opening:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

When no Product match is active: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**

Brand/Item identity reset rules remain canonical: changing Brand invalidates the matched Product and clears Product-derived Item/type/details; changing Item invalidates the matched Product while preserving Brand. A scanned barcode may remain evidence but may not silently reattach an incompatible Product.

Every **new Fit Report** requires at least one of:
- Front Fit Photo;
- Back Fit Photo;
- Product Photo.

Photo controls are presented **Front → Back → Product Photo (not being worn)**. Front/Back are community-visible wear evidence. Product Photo is separate Product/catalog evidence. Product Label / Tag Photo remains private identity-review evidence. The form uses one canonical Product Photo input; different helpers may open it but may not create duplicate evidence fields.

If a member attempts to submit without any required Front/Back/Product photo, the UI must visibly explain the missing-photo requirement in the Photos section and take the member to that error. Silent submit failure is not acceptable.

Fit Report/Closet display priority is **Front Fit Photo → Product Photo → Back Fit Photo**. Scanner identification priority is separately **Product/catalog photo → shared Front Fit Photo → other shared Fit Photo → placeholder**.

Optional Additional Information remains collapsed for purchase context, UPC when not scanned, Style/Article Number and Material/Fabric Composition; Product Photo is not duplicated there.

## Tracked fit variation — LOCKED
- only structured questions LikeSized actually asks for the Garment Type are eligible;
- every current remaining structured Type question is variation-defining;
- Intended Fit is retired globally;
- Sneakers Use is retired;
- Cropped, sleeve/sleeve length, neckline and closure are variation-defining wherever asked;
- Size never defines tracked variation;
- Color never defines tracked variation;
- `lib/garment-taxonomy.ts` owns the one current map through `GARMENT_VARIATION_DEFINITION_MAP`.

Historical counted-report `objective_variant_key` remains separate; retiring questions does not silently authorize historical rekeying/collision changes.

## Matching Fit Reports / FITuition — LOCKED
`Matching Fit Reports: X` is personalized useful evidence, never a raw Product total.

The viewer's own eligible exact Product evidence is useful and may be the strongest evidence. It must not disappear merely because the viewer authored it.

Recommendation evidence dedupes **same person + same Product + same tracked fit variation** to one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color do not create tracked variations.

FITuition combines Size Match evidence with the viewer's relevant Closet History. Exact Product/variation evidence is strongest; related variation is reduced fallback/support. Confidence is separate from recommendation score. `Would Buy Again` does not affect recommendation.

When evidence exists but confidence is insufficient, current quick-view direction is **“FITuition isn’t confident enough yet.”** with a relevant-match explanation. With no relevant evidence: **“FITuition needs more evidence.”**

## Shopping / lockers
LikeLocker, Wish Locker and Shop are independent.
- LikeLocker = product affinity/save state.
- Wish Locker = purchase-intent wishlist state.
- The compact garment Wishlist action uses **one deterministic shopping-bag + heart vector/SVG**. Do not compose multiple Unicode/emoji symbols, and do not substitute a generic bookmark. The inactive state is outlined; the active state uses the same icon with the heart filled.
- When the Wish Locker page is built/audited, the same Wishlist symbol must be prominent enough to connect the garment action with the destination.
- Garment utility actions do **not** show public counts. No Wishlist count, Share count, Shop count, Report count or other utility-action clutter on garment surfaces.
- Social counts belong only where the count itself is meaningful, such as Outfit Likes/Comments or profile follower context.
- Shop appears only when a valid canonical retailer destination exists.
- No retailer destination = no Shop action.
- Affiliate commission never changes Product identity, Match, recommendation or ranking.

## Outfit public/privacy boundary
Published Outfits are public readable editorial content.

Logged-out visitors may see safe public Outfit content, resolved Product identification and public photo hotspots. Logged-out users do **not** receive fake personalized Matching Fit Reports, Body Match or FITuition results; tapping a tagged item uses an auth gate for personalized fit intelligence.

Raw/private body data, private Closet linkage, unresolved candidate/review state and authenticated member interaction state remain protected.

## Outfit interaction — CURRENT ROADMAP 12 DIRECTION
- One published Outfit uses one shareable `/outfits/[id]` route.
- Gallery is one active photo at a time; secondary photos remain behind it rather than a thumbnail strip.
- Clicking/tapping the photo background opens full-size; tags/caption overlays retain independent behavior.
- Full-size imagery uses the shared viewer with intentional close/Escape plus drag/swipe-down dismissal; the image follows the drag and a short drag returns instead of dismissing.
- Optional Outfit photo captions are maximum 200 characters and hidden by default behind Caption control.
- Safe public hotspots remain visible logged out.
- Tagged Items and on-photo hotspots open the same canonical tagged-item quick view.
- Tagged quick view is personalized only when the viewer is signed in and eligible for personalized evidence.
- Tagged garment actions are **LikeLocker · Wishlist · Shop · Share · Report** with no garment-action counts.
- LikeLocker/Wishlist update locally/in place and independently.
- Tagged quick view has one full-Product navigation action: **View Garment →**. Do not restore competing **See fit evidence** / **Full details** links.
- Report reason starts unselected; Other is deliberate, never silently defaulted.
- Outfit-content actions are **LikeLocker · Share · Report**. Follow/Notify belong to creator/profile context.
- Creator quick view hierarchy is **Overall Match** on its own row, **Tops Match | Bottoms Match**, then **Total Garments | Total Outfits**. Do not render these stats as a boxed table/grid with cell borders.
- Total Garments means distinct garment evidence/items, not a relabeled raw Fit Report count.
- Creator quick view may also show View Full Profile, Follow and notification state without exposing raw measurements.
- Comments default to **Top** and may switch to **Newest**. Top = Like count descending, newest tie-break. Newest = newest first.
- Comment submit, Like/unlike and sort switching use the API/local interaction path rather than whole-Outfit navigation for every action.
- Owner management controls—Edit, comments on/off, delete, Views, Follows generated—remain separate from viewer content actions.
- New Outfit back navigation returns to **My Closet → Outfits**.

# OWNER-LOCKED STYLE FEED DIRECTION — ROADMAP 13, FULL BEHAVIOR NOT YET IMPLEMENTED
The current `/circle` route has the visible **Style Feed** name, and homepage/navigation copy may point to it. This does **not** mean the full Roadmap 13 feed behavior is complete.

When Roadmap 13 is explicitly unblocked:
1. Style Feed is a passive Instagram/Pinterest-like rolling Outfit inspiration feed.
2. Source is **people the viewer already follows only**.
3. Top relationship controls are **All | Fit Twins**.
4. Fit Twins includes Fit Twin, Tops Twin and Bottoms Twin.
5. **Occasion** is the only additional feed filter.
6. **There is no Style Tag filter in Style Feed.**
7. Explore/Search remain for intentional Product/garment discovery.
8. Exact ranking remains undefined until the roadmap is reached; do not invent it earlier.

Homepage third feature-card direction is locked:
- eyebrow/title **FIT YOUR STYLE**;
- headline **Follow people whose fit and style you trust.**;
- supporting meaning: see what they wear, how they style it, what they recommend, and how they put it all together;
- CTA **Get Inspired →**.

Conceptual feature flow: **Find People My Size → See What Works for Them → Fit Your Style**.

Approved FAQ Fit Twin copy direction: users may follow anyone; Fit Twin is an automatic designation for especially similar Tops + Bottoms measurements, while Tops Twin/Bottoms Twin identify one-region qualification.

# OWNER-LOCKED AUTOMATIC CANONICAL PRODUCT IMAGE SCORING — ROADMAP 13A / BEFORE GARMENT DETAIL
Status: **planned / not implemented**. This belongs before Garment/Product detail, Explore, Search and Wish Locker audit because those surfaces consume the general Product/variation representation chosen by this system.

## Purpose and ownership boundary
Fit Report photos remain permanently attached to the specific report/member that uploaded them. Canonical Product image selection is a separate representation layer used for general Product discovery surfaces such as Search, Explore, recommendations, Wish Locker and other generic garment cards.

The canonical image should preferably show a **real person wearing the garment**, not a generic retailer/catalog image.

The image-selection system must never overwrite, detach or replace the original photo associated with an individual Fit Report.

Examples of the distinction:
- member's own Fit Report / garment history → that Fit Report's photo;
- member's Outfit tag when representing their worn item → that member/report photo where applicable;
- Fit Report detail → that Fit Report's photo;
- general Search / Explore / recommendation / generic Product representation → automatically selected canonical Product image.

Users do not rate Product photos. Admin intervention is optional and only needed when an admin intentionally selects/locks a specific Product image.

## Canonical image priority — LOCKED
General Product hierarchy:
1. **Admin-locked image**.
2. **Highest-scoring eligible Fit Report photo**.
3. **Official/imported retailer or brand image as fallback**.
4. **Placeholder**.

A retailer/imported image is a fallback tier, not a scoring competitor against real Fit Report wear imagery. It must **not** take precedence over a good eligible Fit Report photo.

If no usable Fit Report photo exists, the official/imported Product image may represent the garment temporarily. As soon as a qualifying Fit Report photo exists, the eligible Fit Report tier takes over without requiring that photo to beat the retailer image's quality score.

Do not randomly rotate canonical Product images and do not permanently freeze the first uploaded image.

## Automatic scoring pipeline — LOCKED DIRECTION
When a Fit Report photo is uploaded:
1. upload normally to Supabase Storage;
2. analyze it server-side;
3. calculate objective component measurements;
4. normalize components to `0.0–1.0`;
5. combine them deterministically into one `photo_quality_score`;
6. persist the score and component values;
7. determine canonical eligibility;
8. compare against the current Fit Report canonical candidate;
9. replace only when the new eligible candidate is meaningfully better and no admin lock prevents replacement.

Use AI/image recognition only where needed to identify and locate the relevant garment. Do **not** ask an AI model to invent an arbitrary overall quality number. Blur, resolution, framing, exposure, duplicate detection and the final score remain deterministic/auditable code.

## Scoring components
**Garment visibility**
- LikeSized already knows the garment type from the Fit Report; detection only needs to locate that relevant garment.
- Score how much of the relevant garment is visible, how much of the frame it occupies, whether important regions are cut off and whether it can survive the normal LikeSized card crop.

**Sharpness / blur**
- Calculate from image pixels, for example Laplacian variance via OpenCV or an equivalent deterministic method.
- Sharp = higher score; blurry/out-of-focus = lower score.

**Resolution**
- Read actual image dimensions.
- Higher usable resolution scores better; tiny screenshots/heavily compressed images score poorly.

**Framing**
- Use the detected garment bounding box.
- Score centering, edge cutoff and whether standard card cropping would remove important garment areas.

**Exposure / lighting**
- Calculate luminance/tonal distribution.
- Penalize extremely dark, extremely bright, blown-out or crushed-black images.

**Duplicate detection**
- Generate a perceptual hash (`pHash`) or equivalent deterministic perceptual fingerprint.
- Compare against existing Product/Fit Report photos.
- Near-identical images may be marked duplicates so copies of the same photo do not compete independently.

## Starting score formula
Initial owner-approved weighting:

```text
score =
    garment_visibility * 35
  + sharpness          * 20
  + resolution         * 15
  + framing            * 20
  + exposure           * 10
```

Each component is normalized to `0.0–1.0`; the resulting `photo_quality_score` is on an approximate `0–100` scale.

Example:

```text
garment_visibility = 0.91
sharpness          = 0.84
resolution         = 1.00
framing            = 0.93
exposure           = 0.87

photo_quality_score = 90.95
```

Weights are the starting configuration, not a reason to hard-code the algorithm so rigidly that later calibration requires redesigning the system.

## Suggested persisted fields
At minimum plan for:

```text
photo_quality_score
garment_visibility_score
sharpness_score
resolution_score
framing_score
exposure_score
duplicate_of
canonical_eligible
canonical_locked
```

Exact table placement/schema is deferred until Roadmap 13A implementation and must use an ordered migration rather than ad-hoc schema patching.

## Eligibility
Exclude a photo from automatic canonical selection when it is:
- deleted;
- moderation flagged / not suitable for public display;
- extremely low resolution;
- a detected duplicate that should not compete independently;
- missing the relevant garment;
- otherwise objectively unsuitable for canonical public representation.

## Automatic Fit Report-photo replacement threshold
A new eligible Fit Report photo does not replace the current Fit Report canonical merely because it is one fraction/point higher.

Starting rule:

```text
new_photo_score >= current_canonical_score + 5
```

Examples:

```text
Current score 87 / New score 89 → keep 87
Current score 87 / New score 92 → replace with 92
```

The improvement threshold starts at roughly **5 points** and must be configurable/calibratable without redesigning the selection system. This prevents constant visual flipping among nearly equivalent candidates.

The threshold applies when comparing Fit Report candidates within the same selection tier. It does **not** make official retailer fallback imagery compete with real eligible Fit Report imagery.

## Variation handling — LOCKED
For a specific tracked Product variation, prefer the most relevant real-world image available:

```text
Admin-locked exact-variation image
→ best eligible exact-variation Fit Report photo
→ broader garment-family Fit Report canonical
→ exact-variation official/imported image
→ garment-family official/imported image
→ placeholder
```

This allows exact-variation wear imagery to win where available without requiring every variation to have its own uploaded photo immediately.

Color remains cosmetic for fit-variation identity under the tracked-variation rules; image relevance implementation must respect the canonical Product/variation model rather than creating a second conflicting variation definition.

## Admin control — LOCKED
Admins should have intentional controls such as:
- **Set as Product Image**;
- **Lock Product Image**;
- explicit unlock when returning control to automatic selection.

An admin-locked image always wins. A newly uploaded photo may score 100 and still must not replace an admin-locked image. Once unlocked, normal hierarchy/scoring resumes.

## Locked implementation behavior
- Prefer **real people wearing the garment**.
- Automatically improve the canonical Product image when meaningfully better eligible Fit Report photos arrive.
- Require roughly a **5-point improvement** before switching between Fit Report candidates.
- Use official retailer/brand imagery only when no usable higher-tier real-world Fit Report image exists.
- Never override an admin-locked image.
- Never alter the original photo attached to an individual Fit Report.
- Keep scoring deterministic and auditable; image recognition locates the garment but does not invent the final quality score.

# ROADMAP / OWNER RE-AUDIT ORDER
1. Homepage + FAQ — current public copy live; exact sex/body-specific measurement FAQ wording remains pending owner approval.
2. Global header / member menu / admin entry — current Roadmap 12 interaction repairs are live; broader audit may continue afterward.
3. Auth — owner-confirmed baseline.
4. **Fit Profile / My Measurements — OWNER-COMPLETE.** The current active completion repair adds private City/State only to first-time setup and Settings; it does not reopen the My Measurements surface.
5. Profile Settings — Fit Community editor live; private City/State editor is included in the current active completion repair.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — canonical visibility meaning reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — broader audit remains; regional Twin rule live.
10. Style Feed relationship semantics — direction locked above; full feed behavior remains Roadmap 13.
11. New Fit Report — evidence-first flow live; current visible photo-validation repair is live.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit — CURRENT OWNER AUDIT GATE; production through PR #87.**
13. **Style Feed full behavior/ranking — BLOCKED until the owner closes Roadmap 12.**
13A. **Automatic Canonical Product Image Scoring — OWNER LOCKED / PLANNED; implement before Garment/Product detail, Explore, Search and Wish Locker audit so those surfaces consume one canonical image-selection system.**
14. Garment/Product detail — Exact Variation consumes the canonical 11A map and Roadmap 13A canonical-image hierarchy when reached.
15. Explore — consume Roadmap 13A canonical imagery rather than inventing its own image selection.
16. Search + `/browse` compatibility — consume Roadmap 13A canonical imagery.
17. LikeLocker / Wish Locker — consume canonical Product imagery where the surface represents the Product generally; preserve report-specific imagery where the surface represents a member's actual Fit Report/worn item.
18. Full Admin Catalog + Moderation — include Roadmap 13A Product-image set/lock/unlock controls and eligibility/moderation visibility.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# ROADMAP 12 DATABASE FOUNDATION — PRODUCTION
Production Supabase project: `rlksidwniuoxoacumyaf`.

Original Roadmap 12 foundation mappings remain immutable:
- `20260824133400_add_outfit_comment_moderation_target.sql` → hosted `20260824164156 add_outfit_comment_moderation_target`.
- `20260824133500_new_outfit_v1_social_foundation.sql` → hosted `20260824164328 new_outfit_v1_social_foundation`.
- `20260824133600_complete_new_outfit_v1_boundaries.sql` → hosted `20260824164410 complete_new_outfit_v1_boundaries`.
- `20260824133700_harden_new_outfit_v1_social_controls.sql` → hosted `20260824164420 harden_new_outfit_v1_social_controls`.
- `20260824133800_canonical_public_closet_and_outfit_public_identity.sql` → hosted `20260824164452 canonical_public_closet_and_outfit_public_identity`.
- `20260824133900_fix_outfit_compatibility_photo_registration.sql` → hosted `20260824164507 fix_outfit_compatibility_photo_registration`.

Later Roadmap 12 mappings:
- `20260824231500_outfit_comment_likes.sql` → hosted **`20260825000654 outfit_comment_likes`**.
- `20260824234500_live_profile_identity.sql` → hosted **`20260825000708 live_profile_identity`**.
- `20260825000500_fix_live_comment_like_count_projection.sql` → hosted **`20260825000722 fix_live_comment_like_count_projection`**.
- `20260825021000_outfit_comment_cursor_pagination.sql` → hosted **`20260825025014 outfit_comment_cursor_pagination`**.
- `20260825122000_outfit_photo_captions.sql` → hosted **`20260825133233 outfit_photo_captions`**.
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → hosted **`20260825155645 outfit_public_hotspots_and_comment_sorting`**.

Applied migrations are immutable. PR #86 and PR #87 added no migration. The current active completion repair proposes new ordered migration `20260825183000_private_profile_location_metadata.sql`; it is not production-applied until the owner authorizes and the exact tested batch is merged/deployed.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Verify the current completion-repair branch as one exact candidate, including TypeScript, focused safeguards, production build, complete fresh migration replay and database behavior/privacy tests before any merge.
- Continue the owner New Outfit/Roadmap 12 re-audit on production. **Roadmap 13 remains blocked until the owner says Roadmap 12/New Outfit is complete.**
- Roadmap 13A Automatic Canonical Product Image Scoring is owner-locked and planned; do not implement it opportunistically before its roadmap turn unless the owner explicitly changes the order.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- `main` is currently not branch-protected; required PR + CI protection remains a separate owner decision and must not be changed silently.

# CANONICAL RECOVERY — COMPLETE
The 2026-08-21 canonical recovery is complete. No recovery freeze is active. Historical repair branches and superseded files have no current authority; Git history preserves them for provenance while current canonical files and `main` define present truth. Do not resurrect an old branch/file as a competing source merely because it still exists in Git history.

# RECENT CANONICAL LINEAGE
Recent production lineage:
- PR #80 — stopping-point Roadmap 12 repair — DEPLOYED.
- PR #81 — tagged-item live regression repair — DEPLOYED, merge `1743b0638ac80a5465dba8bb52cab831f6f35148`.
- PR #82 — visible Style Feed rename/copy slice — DEPLOYED; full Roadmap 13 behavior was intentionally not implemented.
- PR #83 — Roadmap 12 follow-up — DEPLOYED, merge `ccbe87d8391e56d106c58353eaceae1be6aaaa4f`.
- PR #84 — Outfit polish/captions — DEPLOYED, merge `332ff38cf214c09125cb8e02b39246a6b0e3e8d9`.
- PR #85 — Outfit interaction/Fit Report photo batch — DEPLOYED, merge `95cd89724ab01d85ab2ea3732af4c4f552d700b8`.
- PR #86 — Roadmap 12 interaction consistency — DEPLOYED, merge `6dccf40032d12fd68c5fc5ee85ad4a4e75a8db19`.
- PR #87 — Fit Report/Outfit live interaction regression repair — DEPLOYED, merge `96905b411dcef2b2a7b0cd55ef379986eff402db`.
- `agent/canonical-product-image-roadmap` — **CURRENT PRIMARY ACTIVE LINE** containing Roadmap 13A owner-locked planning plus the current owner-directed Wishlist/creator-quick-view/private-location completion repairs. Not production-live.

# EXACT NEXT ACTION — CURRENT
1. Verify the exact current active-line candidate across canonical integrity, TypeScript, focused application safeguards, production build, fresh migration replay and database behavior/privacy tests.
2. Review the complete diff against `main` for only the owner-directed completion repair plus Roadmap 13A canonical recording; no opportunistic scope drift.
3. Do not merge/deploy this new batch without explicit production authorization for this batch.
4. After any authorized production deployment, verify `likesized.com` and reconcile the exact merge/deployment/migration facts here.
5. Keep Roadmap 13 blocked until the owner explicitly closes Roadmap 12/New Outfit.
6. Preserve Roadmap 13A as the shared future canonical Product-image system; do not create competing Explore/Search/Wish Locker image selection before its roadmap turn.
