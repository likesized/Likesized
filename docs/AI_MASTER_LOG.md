# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current-status record, owner-decision ledger, deployment ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/status/decision/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy contract plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth. `main` is the single production line. Current files describe current truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
LikeSized is not yet a public active service with an external audience. `likesized.com` is the owner's current verification environment. After explicit deployment authorization, finish exact-head CI, merge the frozen branch to `main`, wait for Vercel production to reach READY, verify the live deployment/runtime state, then return the site to the owner for live browser testing.

## Live repair fast path — OWNER DIRECTED 2026-08-24
During an owner live audit, when the owner identifies concrete breakage and directs it fixed, that instruction authorizes implementation of the named repair on the one active repair branch. Do not stop for repeated re-audits, duplicate approval questions or status-only handoffs. Read the canonical rules/master once at batch start, implement the repair in canonical source, add focused coverage, run the required verification and continue through a branch-ready handoff. Production/main remains a separate boundary and still requires explicit owner deployment authorization.

## Future app transition — OWNER LOCKED 2026-08-24
LikeSized remains web-first while V1 is completed and owner-audited, but the intended product direction is to move into app form after the web product is finished enough to justify that transition. New work must therefore avoid unnecessary browser-only architecture that would force a later rebuild.

Going forward:
- Keep product/business rules, Match logic, validation, permissions and canonical data behavior outside UI-specific code whenever practical so web and a future app client can share the same product truth.
- Prefer reusable service/data boundaries and stable typed contracts over burying important behavior inside individual Next.js pages/components.
- Keep the Supabase data model, authentication boundaries, storage rules, media contracts and server-side validation usable by both the current web client and a future app client.
- Isolate browser-specific concerns such as DOM behavior, file inputs, browser history and local browser state from reusable product logic where practical.
- Treat phone/mobile UX, camera/photo intake, touch interactions and constrained-device behavior as first-class now rather than desktop-only behavior that will later need to be redesigned.
- Do not create a second web-vs-app product system. The future app should consume the same canonical backend rules/data instead of duplicating them.
- Do not prematurely choose or lock a native framework, rewrite working V1 solely for hypothetical portability, or introduce abstraction that has no present value. The rule is to avoid needless coupling while finishing the current product efficiently.
- When future roadmap work has two reasonably equivalent implementation choices, prefer the one that can be reused or exposed cleanly to a future app without compromising the current web product.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE
- `main` is the one production implementation line and is coupled to Vercel production.
- Current production **application** merge is `e4af3074806a0e2307d7e8d0c21e821c70425eaa`, squash merge of PR #76 **Fix iOS Outfit photo conversion failure**.
- PR #76 exact final head `36d5a433a16d844ada1e5cfdd67264f8caf5a918` passed full LikeSized CI #801 (`32780524136`) before merge: canonical integrity, dependency install, TypeScript, focused application safeguards including the Safari photo fallback regression, production build, complete fresh migration replay and database behavior/privacy tests passed.
- The owner explicitly authorized production deployment of PR #76 on 2026-08-24.
- Production Vercel deployment `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6` for merge `e4af3074806a0e2307d7e8d0c21e821c70425eaa` reached READY and aliases `likesized.com`, `likesized.vercel.app` and the canonical main-branch aliases.
- Live homepage verification returned HTTP 200 from deployment `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6`; deployment-scoped runtime inspection found no error/fatal logs in the checked post-cutover window.
- PR #76 contains no database migration; production Supabase schema/migrations were unchanged.
- Previous New Outfit live-audit batch 2 production application merge was `f1030fdad78623b0c7dc31020595bf89c54e5a96` through PR #74; PR #75 completed its docs-only reconciliation.
- Previous signed-in published Outfit Product-read repair remains `f10ac414d65583411a304ec7ea6d518535a2bdd8` through PR #72; docs reconciliation for that deployment shipped through PR #73.
- Previous Roadmap 12 repair merge remains `0742b759c1b8a39baf0db0bf81d4eed6b7a4e214` through PR #70; PR #71 completed its docs-only reconciliation.
- Previous homepage-copy production merge remains `4fc64957809ee18a6c7c0ac203f29147ef2c8646` through PR #68.
- Previous Roadmap 12 foundation merge remains `965274351a2f10f893631d769c9caeccdcc5e402` through PR #67.
- Active owner-review line is `agent/roadmap-app-transition-live-review`; it is branch-only, begins from reconciled production `main`, owns the app-transition direction plus the current live-review issue ledger, and is not production-live.
- Applied database migrations are immutable; future corrections use later ordered migrations.
- No paid Supabase branches.

## Roadmap 12 — New Outfit — COMPLETE / DEPLOYED / OWNER LIVE RE-AUDIT ACTIVE
Roadmap 12 foundation shipped through PR #67. The first owner live-audit repair batch shipped through PR #70. The signed-in published Outfit Product-read blocker shipped through PR #72. The owner's next seven live-audit findings shipped through PR #74. The owner-reported iPhone/Safari photo-conversion blocker shipped through PR #76 and is now production-live. Do not advance to Roadmap 13 until this New Outfit live audit is handled.

### Owner-approved Roadmap 12 product state
- Photo-only V1: 1 required Cover/Main photo + up to 5 additional photos; reorder and Set as Main; no video.
- Required Headline ≤100; optional Outfit Story ≤5,000.
- Required Occasion 1–2 from the fixed approved list; optional community Style Tags up to 3, normalized/suggested without silently rewriting creator text.
- 1–6 owned Closet garments; adding a new garment reuses the existing canonical `/closet/add` Fit Report intake inside the Outfit flow, never a second garment system.
- Optional per-photo garment hotspots use only the master Outfit garment set.
- Drafts are unpublished owner-only work; first publish requires Preview; no scheduled publishing; published edits update the same Outfit.
- Published `/outfits/[id]` is a shareable logged-out editorial page with OG/Twitter metadata.
- Anonymous view gets photos, Headline, creator display identity, Occasion/Style, Story, social counts/comments and resolved canonical Product teasers only—not Size Worn, Fit Result, Fit/body evidence, Closet linkage, unresolved review state or authenticated shopping state.
- Signed-in members get the detailed tagged-garment layer with Product image/link, Size Worn, Fit Result, hotspots and normal Product Like/Wishlist/Shop actions.
- Social controls are Like / Comment / Follow / Share; comments are flat V1 text; creator/member/admin delete/report boundaries exist; member blocking reuses/removes the canonical follow graph.
- Creator-only analytics are Views / Likes / Comments / Shares / Follows generated; Shop clicks remain internal-only V1 attribution.
- Outfit likes remain separate from Product likes.
- Outfit browsing is image-first with a Pinterest-like masonry/pinboard rhythm, natural Main Photo proportions, staggered columns, minimal card chrome and a compact two-column feed on normal mobile widths. This is a visual direction, not copied Pinterest behavior.
- Accessories outside current garment taxonomy may appear in photos/Story but are not canonical Closet/Product tags.
- Unconfirmed/Needs More Evidence owner garments may be styled, but private candidate/review state does not leak and unresolved identity does not create public Product truth.
- Current V1 has no per-garment Private / Shared product mode. The historical physical `closet_items.visibility` column remains only for immutable replay compatibility and is locked to `shared` for current V1.

### PR #70 live-audit repairs now deployed
- New Outfit is a compact creator workspace rather than a landing-page hero: smaller header/section treatment, quiet back navigation and compact actions instead of giant pill buttons.
- Photos uses **Cover photo (required)** plus optional additional photos, compact upload/photo-management rows and no redundant optimization/count helper clutter.
- The Post uses **Tell people about the look.**, the approved Headline/Story placeholders and reduced visual weight.
- Occasion uses a normal required select plus an optional second select; Style Tags remain community-created, max 3, with suggestions after typing and compact removable chips.
- Step 4 is **Items in this Outfit**: choose the 1–6 master Closet items once through search, Category/Garment Type and Brand filters, Recently added / Brand A–Z / Garment type sorting, progressive Load more and a persistent selected-items area.
- Step 5 is **Photo Tags (optional)** after item selection; hotspots may only place already-selected Outfit items and never present an unexplained empty tagging panel.
- Embedded canonical Fit Report intake returns directly to the same Outfit after a garment is saved and auto-selects that Closet item.
- Comments copy is reduced to **Comments** / **Allow people to comment on this Outfit**.
- Preview is bounded and reviewable, with previous/next controls, clickable thumbnails and per-photo hotspot display instead of one oversized static image.
- Draft saving has explicit in-progress/saved feedback; `/outfits/drafts` provides a clear owner-only resume workspace; `/outfits` exposes a creator-facing Drafts entry instead of relying on a buried feed strip.
- Avoidable independent media/storage work is parallelized without weakening persistence guarantees.
- `/outfits` and signed-in `/outfits/[id]` no longer rely on fragile nested PostgREST relationship reads for creator/comment/Product/Brand details; canonical records are resolved explicitly.
- No database migration was part of PR #70.

### PR #72 publish-blocker repair now deployed
- Signed-in published Outfit detail no longer requests nonexistent `products.retailer_url`.
- Product rows are loaded only from columns that exist in canonical `products`.
- Shopping destinations come from canonical `retailer_listings.product_url`.
- The focused New Outfit safeguard now fails if `retailer_url` is reintroduced into the published Outfit detail source and requires `retailer_listings` to remain the shopping-link source.
- No schema migration was required.

### PR #74 live-audit batch 2 — DEPLOYED
Branch `agent/outfit-live-audit-batch-2` is recovered through PR #74. Exact final head `a32fd722d410c94c88fb6a6790bc8342bd66bafc` passed full LikeSized CI #796 (`32776895479`), then owner-authorized squash merge `f1030fdad78623b0c7dc31020595bf89c54e5a96` deployed to Vercel production `dpl_8jGX2SPrYjnW55u3BU9itJdNfXPY`, which reached READY and aliases `likesized.com`. No database migration was part of PR #74.

Production-live behavior:
1. **+ Add a new garment** replaces the misleading “missing garment” wording while continuing to reuse the canonical embedded Fit Report intake.
2. Photo reorder visibly moves cards during desktop drag and provides explicit **↑ / ↓** controls as the reliable mobile/fallback method; the displayed order is the saved order.
3. Mobile photo preparation accepts normal phone image selection including JPEG/PNG/WebP and HEIC/HEIF inputs where the device can decode them, raises the normal input ceiling to 24 MB, retries substantially smaller dimensions/quality instead of failing early, lowers mobile memory pressure by preparing derivatives sequentially and preserves successfully prepared additional photos if another selected photo fails.
4. Items in this Outfit shows contextual **Clear filters** only when filtering/search/sort differs from default; it resets search, category, garment type, brand and sort to Recently added.
5. Successful Save Draft clears the dirty state before navigation handling, keeps the editor in place instead of forcing a full reload, returns newly registered photo IDs so already-saved photos are not uploaded again on the next save and shows **Draft saved.** without the false browser leave warning.
6. Draft resume/hydration reduces sequential server reads by parallelizing independent profile/Closet/style/Outfit and Outfit-part work, while existing saved photos are reused rather than reprocessed.
7. Preview is smaller and review-focused: desktop shell/gallery/image bounds are reduced and mobile uses viewport-aware image height rather than a near-full-screen static banner.

### PR #76 iOS/Safari Outfit photo encoding repair — DEPLOYED
Branch `agent/outfit-ios-photo-encoding-repair` is recovered through PR #76. Exact final head `36d5a433a16d844ada1e5cfdd67264f8caf5a918` passed full LikeSized CI #801 (`32780524136`), then owner-authorized squash merge `e4af3074806a0e2307d7e8d0c21e821c70425eaa` deployed to Vercel production `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6`, which reached READY and aliases `likesized.com`. Live homepage verification returned HTTP 200 from that deployment and the checked deployment-scoped runtime window contained no error/fatal logs. No database migration was required.

Production-live behavior:
- Root cause addressed: some Safari/iOS environments can decode a normal camera photo into canvas but do not provide a working canvas WebP encoder. That previously caused the exact client error **“Photo conversion failed on this device.”** before the photo could be added.
- Native browser WebP encoding remains the preferred path.
- If WebP canvas encoding is unavailable, the client uses a size-bounded JPEG transport fallback instead of rejecting the photo.
- The server validates the actual derivative bytes and normalizes that JPEG fallback to a real canonical WebP using the existing server-side Sharp dependency before any Supabase storage write.
- Existing canonical storage paths, WebP content type, 600 KB display limit and 220 KB feed limit stay unchanged; no alternate photo-storage representation is introduced.
- Focused regression coverage generates a JPEG transport payload and proves it becomes real WebP before storage.

### Roadmap 12 database foundation
Production Supabase project: `rlksidwniuoxoacumyaf`.

Roadmap 12 canonical migrations and hosted production mappings remain:
- `20260824133400_add_outfit_comment_moderation_target.sql` → hosted `20260824164156 add_outfit_comment_moderation_target`.
- `20260824133500_new_outfit_v1_social_foundation.sql` → hosted `20260824164328 new_outfit_v1_social_foundation`.
- `20260824133600_complete_new_outfit_v1_boundaries.sql` → hosted `20260824164410 complete_new_outfit_v1_boundaries`.
- `20260824133700_harden_new_outfit_v1_social_controls.sql` → hosted `20260824164420 harden_new_outfit_v1_social_controls`.
- `20260824133800_canonical_public_closet_and_outfit_public_identity.sql` → hosted `20260824164452 canonical_public_closet_and_outfit_public_identity`.
- `20260824133900_fix_outfit_compatibility_photo_registration.sql` → hosted `20260824164507 fix_outfit_compatibility_photo_registration`.

Verified production foundations include canonical member-visible Closet behavior, New Outfit draft/public/social/privacy/storage boundaries, full fresh migration replay and database behavior/privacy coverage.

## Homepage brand copy — COMPLETE / DEPLOYED
PR #68 shipped the approved campaign copy. Current locked homepage campaign includes:
- eyebrow **YOUR BODY ISN’T A SIZE CHART.**
- headline **Billions of bodies. A handful of sizes.**
- supporting line **Yeah, we thought that sounded ridiculous too.**
- body **A size label was never going to tell the whole story. LikeSized adds what’s been missing: measurements, firsthand Fit Reports, and a better way to compare the information that actually matters.**
- closing brand line **LikeSized. Because not all sizes are alike.**
- first What LikeSized Does card title remains **FIND PEOPLE MY SIZE**; CTA is **Find My Fit Twin →**.
- Build Your Circle description is **See what they wear, how they style it, what they recommend, and how they put it all together.**

## Authenticated browser → backend wiring — COMPLETE
The six ordered Fit Report/browser-to-backend checks remain complete:
1. Normal known Product — PASS.
2. Explicit identity uncertainty — PASS.
3. Known Product correction/conflict — PASS after PR #59 repair.
4. Mobile Item Change — PASS.
5. Clean new manual Product — PASS.
6. Known barcode — PASS.

Controlled production test identity remains Maidenform / Heirloom / Bra Product `4086fdaa-172d-4a3f-b6c4-2c155094bb25`, UPC `196988323504`. Its deliberate `catalog_review_needed` state came from the controlled correction test, not barcode corruption.

## Roadmap 11A — Garment-question variation classification — COMPLETE / DEPLOYED
Locked 11A rules:
- Intended Fit is deleted from every current Garment Type question set.
- Sneakers Use is deleted.
- Every other structured Garment Type question remaining in current V1 intake is variation-defining.
- Cropped, sleeve/sleeve length, neckline and closure are globally variation-defining wherever asked.
- Shape values such as Fitted / Flowy remain variation-defining when they describe the garment's physical cut rather than the wearer's subjective Fit Result.
- Size never defines tracked variation.
- Color never defines tracked variation.
- `lib/garment-taxonomy.ts` is the one canonical current Type-question source and owns the derived variation-definition map.
- Current counted-report `objective_variant_key` remains a separate historical/report-dedup concept; 11A did not silently rekey historical reports.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Direct Product search
Direct Product search is global across men's, women's and unisex Products. Fit Community does not silently gate direct Product search. Unconfirmed and Needs More Evidence are candidate states, not live Products, and do not leak into other members' Product search/suggestions/discovery/barcode suggestions.

## Fit Community / Following / Fit Twin
- Fit Community is Men / Women / Both, private member relevance metadata and never changes Body Match math.
- Following is member-controlled.
- Fit Twin is **system-generated** among followed members from strong current-person Match quality.
- One canonical `follows` relationship exists; there is no second user-controlled Fit Twin graph.
- Following and Fit Twin remain separate concepts.

## Product identity trust
- Unconfirmed = pre-publication candidate only.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
Repeated reports by one member do not manufacture distinct-member trust.

## Product identity / barcode boundary
Base Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define a new base Product. Barcode confidence is separate from Product confidence. Conflicts are preserved for review and never silently rewrite Product identity.

## New Fit Report — evidence-first normal flow
Opening:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Approved opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

Main form order after identification:
1. Brand / Make.
2. Item / Style / Model.
3. Compact optional Product Label / Tag Photo only when that evidence was not already supplied at opening.
4. Overall Category.
5. Specific Garment Type filtered by Category.
6. optional Department.
7. zero-to-four controlled Type questions; Not sure always last.
8. Color.
9. Size.
10. Overall Fit Result.
11. Condition.
12. optional Front Fit Photo and Back Fit Photo.
13. optional Fit Notes up to 2,000 characters.
14. optional Retail Link.

When no Product match is active, standard guidance is **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**

A new/unresolved garment retains **I’m not sure this is the correct item/style name**. Changing Brand invalidates the previous Product match. Changing Item invalidates the Product match while preserving Brand. A scanned barcode may remain evidence after either reset but may not silently reattach a Product whose Brand or Item no longer agrees with the member submission.

Optional Additional Information remains collapsed by default: Purchased From, Price Paid, Purchase Method, Approx. Purchase Date, UPC/barcode when not already scanned, Manufacturer Style / Article Number, Material / Fabric Composition, Product Photo.

Product Photo and Product Label / Tag Photo remain separate evidence roles.

## Fit Result / Fit Rating
Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big. There is **no current V1 1–5-star Fit Rating UI**.

## Counted Fit Report identity
For a resolved Product, counted Fit Report identity remains Member + exact Product + normalized Size + objective physical-answer fingerprint + compatible garment-relevant body state. Size stays report-specific. Product Label/Tag evidence does not create another counted report by itself.

## Tracked fit variation
Tracked variation is separate from base Product and report Size. Only structured questions LikeSized actually asks for that Garment Type are eligible, every current remaining structured Type question is variation-defining, Size never defines tracked variation, Color never defines tracked variation, and the one canonical map lives in `lib/garment-taxonomy.ts`.

## Product Detail evidence — ROADMAP DEFERRED
When reached, exact tracked-variation evidence comes first regardless of whether a related variation has a higher Body Match. Related evidence is secondary and must identify the actual variation difference. Strong Fit Reports aggregate only the same exact variation. Body Match means body similarity, not garment-fit probability.

## Shopping
Like, Wishlist and Shop/Cart remain independent. Shop appears only with a valid retailer destination. No retailer link = no Shop action. Affiliate commission never changes Match, recommendation or retailer relevance. Canonical Product shopping destinations are represented by retailer listing records; published Outfit detail must not invent a nonexistent Product-level `retailer_url` field.

# FOUNDATION / DATABASE STATUS — VERIFIED PRODUCTION BASELINE
Verified-good production foundations include:
- clean candidate→Product materialization and Product trust progression from distinct wearers;
- explicit Unconfirmed anti-publication gating;
- Needs More Evidence parking and member evidence re-entry;
- known-Product conflicts preserved as evidence/review rather than silent Product mutation;
- barcode two-member corroboration and conflict handling;
- Product reporting/review priority accumulation;
- Fit Report relevant-body-state identity and 2% state split behavior;
- Front/Back Fit Photo compatibility;
- Fit Community separation from Match math/Product Department;
- global Product search exclusion of unresolved candidates;
- purchase-context isolation;
- hardened Product Label/Tag RLS and storage boundaries;
- hardened direct scanner-image candidate eligibility;
- canonical evidence-path constraints and resolved-candidate history handling;
- known-Product member correction RPC least-privilege boundary;
- canonical member-visible Closet with no per-garment Private/Shared product setting;
- New Outfit V1 draft/public/social/privacy/storage boundaries;
- full fresh migration replay and database behavior/privacy suites.

# CANONICAL RECOVERY / BRANCH LINEAGE
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. PR #43 promoted the verified recovery line to `main`.

Historical branches have no current authority. Git history preserves superseded implementations; current files define current truth.

Recent branch classification:
- `agent/new-outfit-v1` — RECOVERED via PR #67 / DEPLOYED.
- `agent/homepage-brand-copy` — RECOVERED via PR #68 / DEPLOYED.
- `agent/outfit-live-audit-repairs` — RECOVERED via PR #70 / DEPLOYED; no longer active.
- `agent/post-pr70-production-reconciliation` — RECOVERED via PR #71 / docs-only; no longer active.
- `agent/outfit-publish-product-read-fix` — RECOVERED via PR #72 / DEPLOYED; no longer active.
- `agent/post-pr72-production-reconciliation` — RECOVERED via PR #73 / docs-only; no longer active.
- `agent/outfit-live-audit-batch-2` — RECOVERED via PR #74 / DEPLOYED; no longer active.
- `agent/post-pr74-production-reconciliation` — RECOVERED via PR #75 / docs-only; no longer active.
- `agent/outfit-ios-photo-encoding-repair` — RECOVERED via PR #76 / DEPLOYED; no longer active.
- `agent/roadmap-app-transition-live-review` — ACTIVE owner-review line; app-transition direction + current live-review issue ledger; branch-only / not deployed.

# OWNER RE-AUDIT ORDER
1. Homepage + FAQ — live; exact sex/body-specific measurement FAQ wording still pending owner approval.
2. Global header / member menu / admin entry — broader owner interaction audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — per-garment visibility product mode reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — audit remains.
10. My Circle / Following / system-generated Fit Twin — audit remains; future Outfit view direction is Following / Fit Twins / Discover.
11. New Fit Report — six browser/backend wiring checks complete; cleanup through PR #65 deployed.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED through PR #66.**
12. **New Outfit — production deployed through PR #76; authenticated owner live re-audit remains the current gate.**
13. Outfits / Style Feed — follows Roadmap 12 foundation; full discovery/ranking audit remains after the owner finishes the New Outfit live audit.
14. Garment/Product detail — Exact Variation may consume the canonical 11A map when this audit item is reached.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# ACTIVE OWNER LIVE-REVIEW ISSUE LOG — BRANCH-ONLY
Active branch: `agent/roadmap-app-transition-live-review`.

Review logging rule:
- As the owner calls out issues during live testing, record each issue here immediately and keep the owner's meaning intact.
- Merely reporting an issue means **RECORDED**, not permission to change production. Do not silently fix recorded items unless the owner directs that issue fixed.
- When the owner explicitly directs a concrete issue fixed, the live-repair fast path applies on this same active branch: implement → focused verification → exact-head CI → branch-ready handoff without repeated approval/status stops.
- Production remains a separate explicit authorization boundary.
- Status vocabulary for this queue: **RECORDED / APPROVED TO FIX / IMPLEMENTED / VERIFIED / DEPLOYED / DEFERRED**.

Current issues after PR #76 deployment:
- **RECORDED — New Outfit / Photo Tags:** **Use Cover Photo Tags** needs to read much more obviously as a button/action; its current presentation is too easy to mistake for non-interactive text or a passive control.
- **RECORDED — New Outfit / Items in this Outfit filters:** The picker must use progressive/dynamic filtering rather than showing every narrowing control up front. Initial state should be **All garments** with only the sort choices **Recently added** and **A–Z** visible. Additional narrowing filters should appear only as the user drills down and they become relevant. **Garment Type is a filter, not a sort choice, and must not appear in the same control/list as Recently added and A–Z.**
- **RECORDED — New Outfit / Garment picker selection + quick view:** Clicking a garment card must **not** immediately add/select it. Clicking the card should open a compact detail preview so the user can verify they have the right garment. The quick view must show **Brand, Item/Model, Category, Size, Color, available photos and every answered garment-specific structured question (up to the four questions for that Garment Type)** so different versions/variations can be identified. Actual selection should require an explicit **Add** action or checkmark.
- **RECORDED — New Outfit embedded Add Garment / Brand suggestions:** Brand suggestions currently open over the active Brand input and cover the text being typed. The suggestion panel must anchor below the field and never obscure the active input.
- **RECORDED — New Outfit embedded Add Garment / Item-Style-Model suggestions performance:** Item / Style / Model suggestions are still taking far too long to populate in live use. This remains unresolved despite the earlier PR #65 suggestion-speed work and despite a prior commitment to address it; do not treat the historical speed improvement as closure for this embedded-flow latency.
- **RECORDED — New Outfit / Save Draft performance:** Saving a draft is still noticeably slow in live use and briefly makes the editor appear frozen before the save completes. Previous draft-save optimization does not count as closure while this pause remains visible.
- **RECORDED — New Outfit / Preview scroll position:** Entering **Preview Publish** currently opens near the bottom of the preview around the **Publish Outfit** button. Preview must start at the top of the page/content instead of inheriting or landing on the bottom scroll position.
- **RECORDED — Published/opened Outfit / photo gallery navigation:** When viewing an Outfit, photo navigation should be direct and touch-friendly: **swipe** between photos on touch devices and **tap/click the displayed photo** to advance to the next image. The viewer should not require clicking a row of image-preview thumbnails underneath as the primary way to move through the gallery.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #76 is production-live. The owner's first retest is the same normal iPhone photo that previously produced **“Photo conversion failed on this device.”**
- Continue the broader Roadmap 12 authenticated New Outfit audit after that blocker retest: create, Draft/resume, Preview, Publish, opened Outfit/gallery/hotspots, edit, comments/social, and practical mobile/desktop behavior.
- Future roadmap implementation must preserve the owner-locked app-transition direction above: finish web V1 efficiently while avoiding needless web-only coupling that would force a later rebuild.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification; do not silently rekey/collapse historical reports.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics remain open.
- Exact post-submit Fit Report mutation/lifecycle schema remains open.
- Full My Circle Outfit Following / Fit Twins / Discover ranking and richer Outfit discovery/search are later roadmap work, not hidden Roadmap 12 scope.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- `main` is currently not branch-protected; enabling required PR + CI protection remains a separate owner decision and must not be changed silently.

# CONDENSED DEPLOYMENT LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line; PR #43 promoted it.
- PR #56 hardened Product Label privacy/storage/scanner/candidate-history boundaries; production migration applied and verified.
- PR #59 repaired known Product correction save permissions; production migration applied and verified.
- PR #61 polished final Fit Report desktop/item-search UX; deployed.
- PR #63 made Fit Report intake evidence-first; deployed.
- PR #64 repaired Fit Report identity reset/copy; deployed.
- PR #65 sped Fit Report suggestions and restored photo feedback; deployed.
- PR #66 locked tracked garment variation definitions; deployed.
- PR #67 built New Outfit V1; exact head `113e9d474afe19e82df154982d4d4ddd741ad67d` passed full CI #765, six Roadmap 12 migrations were applied database-first, squash merge `965274351a2f10f893631d769c9caeccdcc5e402`, production Vercel `dpl_H9MRX5S1Z1uc1w9UCTRBdFfSxvrK` reached READY.
- PR #68 updated homepage brand copy; exact head `3193772517682ab2336f1cbc7368fe0236f8b93b` passed full CI #771, squash merge `4fc64957809ee18a6c7c0ac203f29147ef2c8646`, production Vercel `dpl_Hd1Ys6BfCEJxBERP4kNr2UQMdLp6` reached READY.
- PR #70 repaired New Outfit live-audit issues; exact head `ab7277487a69de78369eba878005741f0846062f` passed full CI #781, owner authorized deployment, squash merge `0742b759c1b8a39baf0db0bf81d4eed6b7a4e214`, production Vercel `dpl_DCMbfcMyE23CDbMde4Fq2aoVLHru` reached READY and aliases `likesized.com`; no database migration was included.
- PR #71 reconciled the PR #70 production record in canonical documentation after exact head `65b9938281ec40ed2c02a8ffe73aca21f2f054e1` passed full CI #783; docs-only.
- PR #72 repaired the signed-in published Outfit Product read; exact head `53cce002736ca02091dd11677fc7fbcb6a51a4a8` passed full CI #788; owner authorized immediate deployment; squash merge `f10ac414d65583411a304ec7ea6d518535a2bdd8`; production Vercel `dpl_6SRPe9UQYEu5ZKpn2s9j4JArwZm1` reached READY and aliases `likesized.com`; no schema migration was included.
- PR #73 reconciled PR #72 production documentation; exact head `8c438b87e68b293e2a60e58f03b01e9cf487b8ae` passed full CI #790; docs-only squash merge `4b2995fec9abf2610e76eb4566db64447c1ff693`.
- PR #74 deployed New Outfit live-audit batch 2; exact final head `a32fd722d410c94c88fb6a6790bc8342bd66bafc` passed full CI #796 (`32776895479`), owner authorized deployment, squash merge `f1030fdad78623b0c7dc31020595bf89c54e5a96`, production Vercel `dpl_8jGX2SPrYjnW55u3BU9itJdNfXPY` reached READY and aliases `likesized.com`; deployment-scoped runtime inspection found no errors; no database migration was included.
- PR #75 reconciled the PR #74 production deployment in canonical documentation; docs-only.
- PR #76 repaired the owner-reported iOS/Safari Outfit photo conversion blocker; exact final head `36d5a433a16d844ada1e5cfdd67264f8caf5a918` passed full CI #801 (`32780524136`), owner authorized deployment, squash merge `e4af3074806a0e2307d7e8d0c21e821c70425eaa`, production Vercel `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6` reached READY and aliases `likesized.com`; live homepage returned HTTP 200 from that deployment and deployment-scoped runtime inspection found no error/fatal logs in the checked post-cutover window; no database migration was included.

# EXACT NEXT ACTION — CURRENT
1. Owner live-reviews production and calls out issues; record every issue immediately in the active branch ledger without silently changing production.
2. When the owner directs a recorded concrete issue fixed, implement it on `agent/roadmap-app-transition-live-review`, verify it, and keep the branch as the one active repair line.
3. Continue Roadmap 12 create→draft/resume→Preview→Publish→detail/gallery/hotspots→edit→comments/social mobile/desktop audit, starting with the same iPhone photo that previously failed.
4. Do not advance to Roadmap 13 until the New Outfit owner live audit is complete.
