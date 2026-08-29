# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, current product/status decision record and AI handoff for LikeSized. Git history and merged PRs preserve detailed release history; this file must describe current durable truth rather than functioning as a duplicate commit ledger.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — current roadmap, durable owner decisions, unresolved work and handoff state.
- `docs/V1_PRODUCT_SPEC.md` — current Product/fit architecture.
- `supabase/schema_contract.md` — current database behavior/privacy plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.
- GitHub — implementation/PR/CI history.
- Vercel — current deployment operational truth.

LikeSized has one current implementation and one current Product truth. Never create patch/fixed/v2/temp/backup implementations, parallel Product systems, or a second master plan.

## Deployment-batch discipline — OWNER LOCKED
The working batch is:

**implement the complete approved batch → reconcile current Product/status/schema truth → run relevant draft checks → freeze the exact candidate → run complete exact-candidate Release Verification → merge the exact tested candidate → verify resulting `main` checks and Vercel operational truth → owner live-audits personalized behavior.**

A deployment authorization does not waive verification. A later commit invalidates a prior final result. Do not call a batch complete because CI is green when the owner-reported live behavior has not actually been verified.

## Universal performance / scale baseline — OWNER LOCKED 2026-08-27
Performance/scalability is a default requirement across LikeSized.
- Avoid N+1 data access, unbounded/full-table reads, duplicate requests, eager hidden/offscreen heavy UI, unnecessary full-page navigation/revalidation and avoidable work on every render/click.
- Prefer bounded pagination/limits, set-based/batched queries, indexed lookups, caching/request deduplication, lazy/deferred nonessential work and media sized for the rendered context.
- Shared canonical components/services own shared performance behavior; do not create page-specific fast forks.
- Evaluate expected multi-user scale when a feature is introduced or materially changed.
- Correctness, privacy, security and owner-approved semantics may not be weakened for performance.

# CURRENT STATUS — 2026-08-29

## Production baseline
Canonical production `main` is **`b8d0a76f3989cec09d63a0872d07ffb7ca267620`**. The prior Style Feed repair passed automated release verification but subsequent owner live QA proved two reported presentation behaviors were still wrong: the shared gallery retained a giant forced-height stage and the intended garment experience was not available from the audited feed presentation. Automated green status therefore did not establish owner-facing completion.

Style Feed and Garment Detail are **not owner-complete**.

## Active owner-authorized Product Change — PR #136
Active branch: **`product/style-feed-garment-detail-final-batch`**  
Active PR: **#136 — draft / exact-final verification pending**

The owner explicitly authorized the accumulated Style Feed + Garment Detail audit batch and production deployment after verification so it can be audited on `likesized.com`.

### Style Feed current Product truth
- Style Feed remains published Outfit inspiration from people the viewer already follows.
- Default relationship filter is **Fit Twins**; **All Following** remains the alternate view. Fit Twins includes Fit Twin, Tops Twin and Bottoms Twin.
- Ordering remains newest published Outfit first within active filters. Occasion and searchable Style Tags remain additional compact filters.
- The main Style Feed is now **image-first compact discovery**, not a full Outfit-detail card repeated down the page.
- Desktop shows a compact multi-column image board. Mobile reference scale is **2 columns with roughly 2 rows / 4 Outfit images visible at once** on a normal phone viewport.
- Each Outfit contributes one lead image to the main board. Multi-photo Outfits do not create multiple giant feed cards.
- Main-board tiles do not permanently render creator rows, descriptions, actions, garment panels or comment panels under every image.
- Tapping/clicking a feed tile opens the Outfit detail in a large in-place popup/overlay. The popup owns the creator identity, Twin context, Tops/Bottoms Body Match where calculable, description, tags, canonical photo gallery, Like, comments, Share, tagged garments and explicit **View Full Outfit →** navigation.
- Where a current Body Match percentage can be calculated, show the actual percentage. Where there are not enough matching measurements between the two profiles, show **Not enough information** with a clickable `?` explanation that either person may need additional matching measurements; do not imply only the viewer is incomplete.
- Creator/profile, comments, tagged garments, action bars and Outfit gallery remain shared/canonical systems rather than Style Feed-specific replacements.
- Comment counts must represent comments the canonical comments experience can actually open.
- **View Garments** uses the canonical tagged-garment data/quick-view path and must expose every legitimate tagged garment returned for the Outfit. Loading stays lazy/cached/deduped rather than launching full garment/FITuition work for the entire feed.
- The shared Outfit gallery no longer reserves a giant fixed viewport-height stage. In-card/popup media follows the displayed image's natural bounded height. Full-size imagery opens through the shared viewer and oversized images can be scrolled naturally without stretching/cropping or a giant blank stage.
- Feed data remains bounded/batched; offscreen garment detail remains lazy.

### Garment Detail current Product truth
- The Garment Detail page contains the Product hero, shopper-facing attribute filters, canonical utility actions, **one FITuition section**, and bounded **Style Inspiration** at the bottom. It does not expose multiple technical evidence/history sections as separate page architecture.
- Meaningful tracked garment configuration is represented to shoppers as **independent attribute rows**, not compound combination pills and not internal tracked-variation terminology.
- Example: **Cut** has Bootcut / Slim / Straight / Skinny pills; **Rise** independently has Low Rise / Mid Rise / High Waisted pills.
- Selecting a pill changes only that attribute. Selecting **High Waisted** once remains active while the member changes Cut. The combined selected attribute values resolve the matching internal tracked configuration and scope Product imagery/evidence behind the scenes.
- Only relevant variation-defining questions from the canonical garment taxonomy may become filter rows. Size and Color do not become tracked fit-variation identity.
- Product utility actions remain LikeLocker · Wishlist/Wish Locker · Shop when available · Share · Report, with no public utility-action counts.

### Full Garment Detail FITuition — owner-approved hierarchy
FITuition recommendation math and Body Match math remain canonical; this Product Change is presentation/configuration scoping, not a new recommendation algorithm.

**Strong evidence state**
- Lead with **FITuition recommends: Size [X]**.
- Show recommendation confidence and the number of relevant Fit Reports supporting the recommendation.
- Show **Aggregate Fit Report evidence** for qualifying strong Body Matches, grouped by actual size/Fit Result evidence.
- Then show **Your Closest Match** as supporting individual evidence: actual Body Match percentage, clickable `@username`, size worn and actual Fit Result.
- An individual username opens the canonical member profile so the viewer can find/follow a potential Fit Twin.

**Insufficient evidence state**
- Never force a recommended size.
- Use the exact leading meaning: **Not enough evidence yet to confidently recommend a size.**
- Show the best available individual Fit Reports for the selected garment configuration even if their Body Matches are weaker, with Body Match, clickable username, size worn and Fit Result.
- Transparently explain that weaker Body Matches may be less predictive.
- Offer the compact **Notify Me** path so the member can be notified when materially better Product evidence arrives.

LikeSized does not collect body-area garment-fit ratings such as fabricated Waist/Hips/Thighs/Length fit scores. Never invent those fields.

### Style Inspiration
- Bottom heading: **STYLE INSPIRATION** with **See how people are styling this garment.**
- Use published Outfits that tag the relevant Product/configuration.
- Zero eligible Outfits: hide the section.
- One to three: show available thumbnails.
- Four or more: show three plus **View More in Explore →** using the canonical Explore garment-filter contract.
- Candidate discovery is bounded; only the displayed thumbnails are loaded as media. Recent eligibility uses a 90-day window and existing engagement signals with recency tie-break.

### Current batch verification boundary
- PR #136 intentionally introduces **no database migration**.
- Production audits already confirmed sampled published Outfit tagged-item counts agree with the canonical `get_public_outfit_tagged_items` function and production `outfit_posts.comment_count` matched actual comment rows in the mismatch audit; do not invent a schema migration for those presentation problems.
- Current source/tests/docs must pass trusted governance, canonical integrity, typecheck, every application safeguard, production build, complete fresh migration replay and database behavior/privacy tests on the exact final SHA before merge.
- After merge, resulting `main` verification and exact Vercel READY/alias/runtime state must be checked before telling the owner the batch is live.
- Even after deployment, Style Feed and Garment Detail remain **owner-audit pending** until the owner verifies the personalized live pages.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means garment-relevant body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.
- Profile photo is public current identity when supplied. City/State remains private member metadata and is not a Match input/public profile field.
- City + State are required in initial setup and later edited in Settings rather than My Measurements.

## Fit Community / Following / Fit Twin
- Fit Community = Men / Women / Both and never changes Match math.
- **Following** is member-controlled and uses one canonical `follows` graph.
- **Fit Twin is system-generated** from current regional Match quality; the member does not manually create Fit Twin status.
- Both Tops + Bottoms qualify → Fit Twin; Tops only → Tops Twin; Bottoms only → Bottoms Twin; Overall Match alone never grants Twin status.
- People My Size defaults to Twin-level qualifying people and offers All Matches as the broader alternate view.
- Follow/Following updates in place where the canonical person quick view provides the interaction.

## Tracked fit variation
- Only variation-defining structured questions actually asked for the Garment Type may define tracked fit configuration.
- `lib/garment-taxonomy.ts` is the one current question/classification owner.
- Size never defines tracked variation.
- Color never defines tracked variation.
- Historical `objective_variant_key` is not interchangeable with the shopper-facing/internal tracked-variation key.

## FITuition evidence
- Relevant/Matching Fit Reports are personalized useful evidence, not raw Product totals.
- Recommendation evidence dedupes same person + same Product + same tracked fit configuration to one recommendation evidence unit.
- Distinct people remain independent evidence.
- FITuition combines relevant community Size Match evidence with useful Closet history through the canonical recommendation engine.
- Exact Product/configuration evidence is strongest; broader related evidence is reduced support when allowed by the canonical engine.
- Confidence remains separate from recommendation score.
- Would Buy Again is not FITuition evidence.
- Tagged-garment summary counts remain bounded/batched; full selected-garment FITuition work is lazy.
- Product evidence notifications use the canonical notification service/table and the correct objective evidence identity; never assume `tracked_variation_key === objective_variant_key`.

## Shopping / lockers
LikeLocker, Wish Locker and Shop remain independent.
- LikeLocker = Product affinity/save state.
- Wish Locker = purchase-intent state.
- Shop appears only with a valid canonical retailer destination.
- Utility actions do not show public counts.

## Outfit public/privacy boundary
Published Outfits are public editorial content. Logged-out visitors never receive fabricated personalized Body Match/FITuition. Private measurements, private Closet linkage and authenticated interaction state remain protected.

# CANONICAL FEATURE CONTRACTS — OWNER LOCKED
## Style Feed relationship/footer contract — OWNER LOCKED 2026-08-27
- Style Feed defaults to **Fit Twins** and keeps **All Following** as the alternate relationship view at the top.
- Fit Twins never silently broadens to All Following.
- At the end of the Fit Twins feed, **See All Following →** switches the current feed to All Following.
- At the end of the Fit Twins feed, **Find More Fit Twins →** routes to **People My Size** to discover more qualifying people.
- **See All Following →** and **Find More Fit Twins →** are separate actions with separate purposes. Find More Fit Twins must never replace the All Following switch.
# END CANONICAL FEATURE CONTRACTS

# ROADMAP / OWNER RE-AUDIT ORDER
1. Complete and owner-audit current **Style Feed + Garment Detail** batch on production.
2. **Explore** — next owner audit; preserve canonical imagery/evidence and do not invent a parallel Product/Outfit system.
3. **People My Size** — Twin-level default is already established; broader page audit next after Explore.
4. **Member/Public Profile** — audit self-view vs other-member view, profile content/stats, public/private boundaries and the one relationship to Profile Settings.
5. Continue remaining page audits including My Closet/lifecycle, Notifications, Search/Browse, LikeLocker/Wish Locker, Admin and final cross-site mobile/desktop/privacy/security/performance regression.

# PLANNED MEMBER / PUBLIC PROFILE AUDIT — NOT YET IMPLEMENTED
- Audit the profile reached from Outfit/person identity for both self-view and other-member view.
- Keep raw measurements and private City/State private.
- Settle one canonical division between member-facing Profile and Profile Settings rather than maintaining duplicate editors.
- Audit profile Garments/Outfits/Closet presentation and canonical navigation.
- Do not move settings or invent another profile editor before this audit is explicitly authorized.

# PLANNED MY CLOSET GARMENT / FIT REPORT LIFECYCLE — OWNER-APPROVED / NOT YET IMPLEMENTED
This work belongs to the later My Closet audit, not the current batch.

Member-facing non-destructive choices:
1. **Edit your report →** — correct entered report data while preserving the historical body snapshot/timestamp and keeping Product-identity changes reviewable/auditable.
2. **Log how it fits now →** — create a new current-body-state observation for the same physical garment while preserving history; backend logic prevents immaterial measurement changes from manufacturing duplicate weighted evidence.
3. **Update garment quality →** — record aging/condition history such as shrinking, stretching, fading, wear/durability and optional Would Buy Again; quality/aging does not silently teach FITuition that a new copy normally fits like an altered old garment.

Separate destructive action: **Delete This Garment**. Require an explicit warning and typed **DELETE** confirmation. Offer **Edit Report** as a real escape from the destructive path. Deletion removes the member's active Closet item/reports/photos and Outfit garment links/hotspots while preserving canonical Product/catalog records and the Outfit post itself.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- PR #136 is the only active owner-authorized Style Feed/Garment Detail release candidate. Do not resurrect closed/rejected branches as alternate current implementations.
- Style Feed and Garment Detail are not owner-complete until live audit after deployment.
- Explore, People My Size and Profile are explicitly the next audit sequence and are out of the current batch.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- My Closet lifecycle work remains deferred to its audit.
- Notifications broader audit remains.
- Search/`/browse`, Wish Locker page, Admin Catalog/Moderation and final cross-site regression remain.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where already scoped.
- Universal performance/scalability remains mandatory; known scalable architecture may not be punted for short-term convenience.

# EXACT NEXT ACTION — CURRENT
1. Finish PR #136 source + Product Spec reconciliation and verify the complete diff stays inside the authorized Style Feed/Garment Detail batch.
2. Keep the PR draft until trusted governance and fast/relevant checks are green.
3. Freeze the exact head and mark it Ready for Review to run the complete Release Verification chain.
4. Any later commit invalidates the prior exact-final result.
5. Merge only the verified exact head, then verify resulting `main` CI and Vercel production READY/alias/runtime health.
6. Have the owner audit Style Feed and Garment Detail on `likesized.com`; do not mark either complete before owner approval.
7. After sign-off, continue audits in order: Explore → People My Size → Profile → remaining surfaces.
