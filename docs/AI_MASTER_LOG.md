# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap/status/handoff. Repository policy lives in `AI_REPOSITORY_RULES.md`.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations.
- Every completed task/update must be logged here; a task is not complete until canonical source and this master match the verified final state.
- Do not deploy production or update `main` when that can trigger production unless the owner explicitly authorizes it.

## Current status — 2026-08-20
- Phase 6.3 auth/configuration: COMPLETE.
- Phase 6.4 responsive/accessibility + Fit Profile polish: IN PROGRESS.
- The owner has completed and locked the full Fit Profile measurement-name/help wording audit. The approved source batch is on PR #37 and is pending final CI/preview/production verification before this portion is called live.
- The owner explicitly authorized finishing this Fit Profile batch, merging it, and pushing it through Vercel production.
- The final crotch artwork is one single owner-approved PNG used by both **Crotch Depth** and **Total Crotch Length**. The owner manually added `public/measurement-guides/crotch-guide.png` to canonical `main` in commit `c120691db0f1ae94186d27547ad6027b9a9735f7`; PR #37 wiring points both help entries to that same path.
- The **Normally worn sizes — private reference only** UI and the Fit Profile **History** notice are owner-removed for V1. Existing private size-reference records are retained behind the scenes and are not silently deleted when measurements are saved.
- The former Fit Profile **Display Name** label is now **Username**. Username remains 3–32 letters/numbers/underscores, no spaces, case-insensitively unique, and may be changed later.
- Owner locked a 30-day reservation for a member's previous username after a change. Supabase migration `20260821033107_reserve_previous_usernames` is applied to the connected LikeSized project and its exact SQL is recorded in the canonical migration file on PR #37.
- Mobile Menu navigation-close behavior is owner-verified working on production.
- Outside-click/tap close is deployed but still pending final owner functional confirmation.
- iPhone Safari form-focus zoom prevention is deployed but still pending final functional verification.
- Phase 6.5 V1 Product Surface + Navigation Audit: LOCKED / QUEUED immediately after Phase 6.4.
- **Owner decision — 2026-08-20:** Outfits remain in V1. The prior Phase 6.5 instruction to remove Outfits is superseded. Existing canonical Outfit code/data are preserved, and the final V1 Outfits / Fits social-layer audit is scheduled after the Closet/Product/Favorites foundation and before Fit Twin Activity.

## Phase 6.4 canonical completed work / locked source decisions
- Fit Profile copy/labels/help UI polished.
- Overbust removed.
- Height uses feet + whole inches.
- Other imperial length measurements use whole inches + 0/¼/½/¾ dropdowns.
- Server validates height as whole inches and other imperial lengths in quarter-inch increments.
- Mobile Menu uses a single canonical React-controlled open state rather than native `<details>` state. Selecting any navigation link closes it, pathname changes close it, and the latest canonical implementation also closes it on any click/tap outside the menu. Navigation-close is owner-verified; outside-click remains pending owner functional confirmation.
- iPhone Safari form-focus zoom prevention is implemented in canonical source and deployed via 16px form-control text; final functional verification remains before Phase 6.4 closes.
- **Username** replaces the misleading user-facing **Display Name** label on Fit Profile. The underlying canonical identity remains `profiles.username`; no parallel identity field was introduced.
- Username format remains `[A-Za-z0-9_]{3,32}`, no spaces. Existing `profiles_username_ci_uq` continues to enforce case-insensitive current ownership.
- Username changes are allowed. Relationships/matches/follows/Closet/history remain attached to UUIDs and therefore continue through a username change.
- Previous usernames are reserved to the same account for 30 days after a normalized username change. A member may reclaim their own reserved username during that period; another member may not claim it until expiration. Reservations are private/internal and do not create a public username-history surface.
- The normally-worn-size form surface is removed from V1 because actual body measurements plus product-specific size/fit evidence are the useful fit inputs. The dormant schema is retained for forward compatibility.
- Fit Profile saves preserve any pre-existing `user_size_references` unchanged even though the fields are no longer displayed, preventing accidental historical-data deletion.
- The user-facing Fit Profile History note is removed; immutable historical Fit Report/body snapshot architecture remains intact internally.

## Phase 6.4 measurement audit — COMPLETE / OWNER LOCKED
Canonical owner-approved wording is implemented in `app/onboarding/MeasurementHelp.tsx`. Key locked decisions:
- **Individual Shoulder Length:** keep current name, description, how-to, and guide as-is.
- **Torso Girth:** keep current name, description, how-to, tip, and approved guide as-is.
- **Bust Point to Bust Point:** title capitalization standardized; how-to is “Measure straight across from the fullest point of one bust to the fullest point of the other while standing naturally.”
- **Shoulder to Bust Point:** description is “The distance from the middle of the shoulder to the fullest point of the bust.” How-to is “Start at the middle of the shoulder, where a bra strap naturally sits. Measure straight down to the fullest point of the bust.”
- **Front Waist Length:** description is “The distance from the shoulder at the base of the neck to the natural waist along the front of the body.” How-to is “Start where the neck meets the shoulder. Measure down the front of the body, passing over the fullest part of the bust, to the natural waist.”
- **Back Waist Length:** description is “The distance from the base of the neck to the natural waist along the center back.” How-to is “Start at the prominent bone at the base of the neck. Measure straight down the center of the back to the natural waist.”
- **Shoulder to Waist:** description is “The distance from the outer shoulder point to the natural waist.” How-to is “Start at the outer shoulder point where a sleeve seam would sit. Measure down the side of the torso to the natural waist, following the body.”
- **Across-Back Width:** horizontal upper-back width between rear arm creases; measure straight across, tape level, do not wrap around body.
- **Across-Front Chest Width:** horizontal upper-front chest width between front arm creases; measure above the fullest bust/chest, tape level, do not wrap around body.
- **Arm / Sleeve Length:** outer shoulder point to wrist along outside of slightly bent arm, over elbow.
- **Upper Arm Circumference:** fullest upper arm with arm relaxed; tape level/snug, not tight.
- **Elbow Circumference:** fullest elbow with elbow slightly bent; tape snug, not tight.
- **Wrist Circumference:** around wrist bone where watch/cuff naturally sits; tape snug, not tight.
- **Neck / Collar Circumference:** base of neck at natural collar level; comfortably snug. Tip retains about one finger of space for shirt-collar fit.
- **Thigh Circumference:** fullest upper thigh while standing naturally with weight evenly distributed.
- **Knee Circumference:** fullest knee while standing relaxed with leg straight.
- **Calf Circumference:** widest part of calf while standing naturally.
- **Outseam:** normal waistband position down outside leg to desired hem or floor.
- **Front Rise:** center front waistband to the point between the legs where front/back seams meet.
- **Back Rise:** center back waistband down along body to the point between the legs where front/back seams meet.
- **Crotch Depth:** description is “The vertical distance from the natural waist to the surface you are sitting on.” How-to is “Sit upright on a firm, flat chair. Measure straight down from the side of your natural waist to the chair surface.”
- **Total Crotch Length:** description is “The full distance from the center front waist, through the legs, to the center back waist.” How-to is “Start at the center front of your natural waist. Run the tape down through the legs and up to the center back of your natural waist, following the body.”
- **Foot Length:** heel to longest toe while standing with full weight on foot. Tip: measure both feet and use the larger measurement.
- **Foot Width:** widest part of forefoot / ball of foot while standing with full weight on foot. Tip: measure both feet and use the larger measurement.

## Phase 6.4 production checkpoint — 2026-08-20
- Owner explicitly authorized the Phase 6.4 mobile/measurement batches promoted during this session.
- Working PR #33 passed LikeSized CI before promotion.
- PR #33 was squash-merged into canonical `main` as commit `a22e1732311050e6d4c6e0fd26a3708f67bcbbac`.
- That production batch contained the first Mobile Menu auto-close implementation, iPhone Safari focus-zoom prevention, and owner-approved measurement guidance through Front Waist Length.
- Vercel production deployment `dpl_G9qQawDkjNto8HAEXGscK5kHoqUg` for commit `a22e1732311050e6d4c6e0fd26a3708f67bcbbac` reached READY with no alias error.
- Owner functional verification then showed the first Mobile Menu auto-close implementation still left the menu open after navigation; it was therefore not accepted as complete.
- Corrective PR #34 replaced native `<details>` open-state handling with the canonical React-controlled Mobile Menu state and changed no parallel/duplicate implementation files.
- PR #34 passed LikeSized CI and its Vercel preview reached READY.
- PR #34 was squash-merged into canonical `main` as commit `599904e09a885120448dcea354a5784c8fae398e`.
- Vercel production deployment `dpl_7Dwb4hJ7YSexqHZKCnddwaXcF9mr` for commit `599904e09a885120448dcea354a5784c8fae398e` reached READY with no alias error.
- Owner then confirmed that selecting a Mobile Menu item closes the menu correctly on production.
- Owner required one additional behavior: clicking/tapping anywhere outside an open Mobile Menu must close it.
- PR #35 implemented that behavior in the existing canonical `components/MobileMenu.tsx` only; no patch/fixed/v2/temp or parallel implementation files were introduced.
- PR #35 passed LikeSized CI and its Vercel preview reached READY.
- PR #35 was squash-merged into canonical `main` as commit `3a6e3ac81b78d830c5f45cc7d608729f6b230055` after explicit owner authorization.
- Vercel production deployment `dpl_JBRpLEd2qE5ynsYAazTdJrFJBZWC` for commit `3a6e3ac81b78d830c5f45cc7d608729f6b230055` reached READY with no alias error and owns `likesized.com`, `likesized.vercel.app`, and the canonical main-branch aliases.
- Outside-click/tap behavior remains pending owner functional confirmation; do not mark that behavior complete until confirmed.
- Owner manually added the final combined crotch guide to canonical `main` as `public/measurement-guides/crotch-guide.png` in commit `c120691db0f1ae94186d27547ad6027b9a9735f7`.
- Supabase migration `20260821033107_reserve_previous_usernames` was applied successfully to project `rlksidwniuoxoacumyaf`; source is recorded in `supabase/migrations/20260821033107_reserve_previous_usernames.sql` on PR #37.
- PR #37 is the active Fit Profile completion batch and is owner-authorized for production promotion after CI/preview verification.

## Approved measurement-guide artwork
- Approved unisex body artwork is the base for normal measurement guides.
- Approved shared waist/hip artwork is used for Natural Waist, High Hip, Hips / Seat, and Waist-to-Hip Length.
- Approved front/back magenta artwork is used for Torso Girth.
- Owner-approved combined crotch artwork is one image shared by Crotch Depth and Total Crotch Length; canonical path is `public/measurement-guides/crotch-guide.png`.
- Do not split, crop, redraw, recolor, compress, convert, or substitute the combined crotch guide. Both measurement help entries intentionally render the same full image.
- Old coded body figure and old WaistHipDiagram / TorsoGirthDiagram implementations remain removed; there are no fallback copies.
- Existing canonical asset paths are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, `public/measurement-guides/torso-girth-guide.webp`, and `public/measurement-guides/crotch-guide.png`.
- Original shared-artwork implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`.
- Corrected waist/hip Git blob: `207cef3553aacb70909d95427e5541be81f9782a`.
- Corrected Torso Girth Git blob: `f8933270c7d75888a531587ecbf7eee31f5268e4`.
- Shared-artwork repair commit `c9de2165280ff7b13591eb64665774394af932a9` deployed through Vercel production deployment `dpl_2zn8KbfppxY8CkMKZ7JsdPEFH5qv`, which reached READY with no build errors.
- Existing live shared-artwork verification confirmed corrected canonical binaries, and the owner confirmed those rendered measurement guides work.
- The new combined crotch image is owner-approved and present on `main`; final rendered production verification is still required after PR #37 wiring is promoted.
- Binary verification rule remains locked: HTTP 200 alone is not sufficient for image assets. Verify deployed files are complete/decodable and match the intended canonical asset.

## Phase 6.4 — remaining work
1. Complete PR #37 CI/preview verification, promote the owner-authorized Fit Profile completion batch to canonical `main`, and verify Vercel production rendering including the combined crotch guide.
2. Final Fit Profile save/load/edit regression verification after promotion, including username change behavior and preservation of dormant private size-reference data.
3. Owner functional confirmation that outside-click/tap closes the deployed Mobile Menu.
4. Final functional verification of the deployed iPhone Safari form-focus zoom fix.
5. Close Phase 6.4 only after the canonical source, verification result, and this master agree.

# Phase 6.5 — V1 PRODUCT SURFACE + NAVIGATION AUDIT — LOCKED

## Core product-model decision — LOCKED
- Members do not experience a garment and a Fit Report as separate concepts.
- The user-facing unit is one individual garment post/log containing the fit information for that try-on.
- `fit_reports` may remain an internal historical/data model because LikeSized needs immutable body snapshots and repeat try-ons, but “Fit Report” must not become a separate member-facing workflow or destination.
- Later try-ons use user-facing language such as **Update Fit** / **Tried It Again** and create a new historical observation internally.
- A member sees one garment in their Closet; historical observations appear only as Fit History when useful.

## Phase 6.5 sequence — LOCKED

### 6.5.1 Navigation / information architecture audit
Simplify overlapping top-level destinations before polishing individual pages.

Target hierarchy:
- **Discover**
- **Fit Twins**
- **My Closet**
- **Fit Profile**
- Notifications
- Settings
- Help / FAQ

Current separate top-level concepts Search, People My Size, Following, and Outfits must be audited against this hierarchy rather than automatically retained as peer menu items. Outfits remain a V1 feature, but whether the member-facing destination is named **Outfits**, **Fits**, lives within Discover, or receives another placement is decided here and in the dedicated Outfit social-layer audit rather than assumed from the legacy navigation.

### 6.5.2 Discover hub
Discover owns finding products and people.
- Search products/brands/identifiers and members.
- People My Size remains algorithmic discovery using Overall / Tops / Bottoms matching.
- Favorites lives under Discover.
- Search = intentional query.
- People My Size = algorithmic discovery.
- Avoid duplicate discovery experiences.

### 6.5.3 Fit Twins hub
Fit Twins are saved/followed people.
- **My Fit Twins** = saved people.
- **Activity** = new Shared garment posts and updated fits from those people.
- “Following” should not remain a competing top-level product concept if it can live cleanly as Fit Twin Activity.
- Reuse the canonical `follows` relationship; no parallel social model.

### 6.5.4 Preserve V1 Outfits; defer final social-layer audit
- **Supersedes the prior decision to remove Outfits from V1.**
- Preserve the existing canonical Outfit implementation, migrations, storage behavior, likes, and Closet-item linking while the underlying garment/product experience is audited.
- Do not create a parallel Outfit implementation or alternate social graph.
- Do not expand Outfits yet; the dedicated V1 Outfit/Fits social-layer audit occurs after Favorites so it can build on the final Closet, garment-detail, Product, Fit Twin, privacy, and save behavior.
- Existing Outfit behavior must continue to respect raw-measurement privacy and the canonical `follows` relationship.

### 6.5.5 My Closet audit/redesign
**My Closet = all individual garments the member has logged and how they fit.**

Audit/build:
- garment cards/grid
- product/brand
- size
- Fit Result
- Fit Rating
- image
- Private / Shared state
- search/filtering by useful garment fields
- Add Garment
- edit garment
- delete garment
- change sharing
- Update Fit / Tried It Again
- Fit History only when multiple observations exist
- preview how a Shared item appears to other members

### 6.5.6 Add Garment / garment-post flow
One member-facing action: log one garment and tell LikeSized how it fits.

Required user-facing information:
- garment/product
- size
- **Fit Result**
- **Fit Rating — 1–5 stars**

Optional where useful:
- fit details/notes
- photo
- garment-specific controlled fit questions
- Would Buy Again if retained after audit

Privacy/share behavior must continue to respect the canonical Private/Shared and fit-photo rules.

### 6.5.7 Fit Result vs Fit Rating — LOCKED distinction
- **Fit Result** = physical fit outcome, e.g. Too Small / Snug / Just Right / Relaxed / Too Big.
- **Fit Rating** = member’s personal 1–5 star satisfaction with that fit/experience.
- These are separate signals. A deliberately snug garment can still receive five stars.
- Any new database field must use a non-conflicting name such as `personal_rating` or `fit_satisfaction_rating`, rather than colliding with the existing fit-outcome enum terminology.

### 6.5.8 Fit Twin/member profile + Shared Closet
Other-member profile should make Shared Closet the main garment evidence experience.

Header/context:
- avatar/name
- follow control
- current Overall Match %
- current Tops Match %
- current Bottoms Match %

Primary content:
- Shared Closet
- Activity
- Outfit/profile presentation is finalized in 6.5.18 rather than removed in advance.

Shared Closet:
- only intentionally Shared garments
- search
- category filters
- dynamic subfilters based on available content
- no empty/useless filters

### 6.5.9 Shared Closet garment cards
Show useful fit evidence without exposing raw body measurements:
- image
- brand/product
- size worn
- historical Match % to viewer for that try-on
- Fit Result
- Fit Rating
- optional fit details

Matching context rule remains locked:
- profile Overall/Tops/Bottoms = viewer current body ↔ other member current body
- garment Match % = viewer current body ↔ immutable historical body snapshot from that garment observation
- never blend those contexts.

### 6.5.10 Garment image fallback hierarchy — LOCKED
For Shared Closet / garment discovery:
1. member’s own fit photo when supplied
2. member-uploaded garment-only photo when supplied
3. canonical product/variant image
4. category-specific LikeSized garment placeholder

Rules:
- never substitute another member’s personal fit photo as a generic product image
- catalog/manufacturer imagery should be distinguishable as **Product Image** when needed so it is not mistaken for the member’s own photo

### 6.5.11 Garment Detail interaction
Clicking the garment/card/image opens useful garment detail, not merely a larger image.

Detail should support:
- large image/gallery and source context
- brand/product
- size
- historical Match %
- Fit Result
- Fit Rating
- optional details
- garment-specific fit evidence
- relevant date/history
- Fit History if the member has multiple observations
- product destination
- retailer links when available

This same destination must remain useful even when the visible card uses a generic placeholder.

### 6.5.12 “People Like You Who Wore This” — LOCKED
For a canonical Product, show up to the top 3–5 unique Shared wearers ranked by the viewer’s historical match to each wearer’s immutable try-on body snapshot.

Rules:
- same canonical Product for this section
- one member should not consume multiple top slots merely because they have multiple observations
- show fewer when fewer qualifying people exist
- no filler from Similar Garments
- exact same variant may receive a subtle **Same Variant** badge
- if more qualifying people exist, offer **See All Fits**

Useful row/card information may include:
- historical Match %
- size
- Fit Rating
- Fit Result
- brief note/details

### 6.5.13 Canonical Product page audit
Product page becomes the collective fit-evidence destination for that garment.

Audit/support:
- canonical product identity
- product/variant image
- Favorite heart
- viewer recommendation context
- strongest historical matches
- reported sizes
- Fit Results
- Fit Ratings
- evidence hierarchy
- same-product Shared wearer evidence
- retailer links
- See All Fits destination

### 6.5.14 Retail links — LOCKED direction
- Show **Shop This Item** when valid retailer listings are known.
- Support one or multiple retailer listings.
- Hide the section when no valid listing exists.
- Do not present stale/fake prices unless LikeSized has a reliable current-price source.
- Retailer URLs/listings remain attached to the canonical Product; they are not product identity.

### 6.5.15 Favorites / saved garments — LOCKED
- **Favorite = save a canonical Product/garment.**
- **Fit Twin = save a person.**
- Favorites are private in V1.
- No public favorite count.
- No notification to the member whose Shared fit led to discovery.
- No Following/Fit Twin Activity event for favorites.
- One favorite per user/product.

Heart/save behavior should be available wherever useful, including:
- Shared Closet cards
- garment detail
- canonical Product page
- product Search results
- Fit Twin Activity garment entries
- People Like You Who Wore This results

### 6.5.16 Favorite provenance
If a user favorites a Product while viewing a specific member’s Shared garment evidence, LikeSized may retain the originating Shared observation as provenance, e.g. **Saved from Tina’s fit**.

Rules:
- Favorite remains attached to the canonical Product.
- If the source garment becomes Private/deleted/unavailable, private evidence disappears immediately.
- The Favorite itself remains unless the user removes it.

### 6.5.17 Favorites view under Discover
Saved garments should be useful fit-shopping bookmarks, not just names.

Useful content:
- product image
- brand/product
- strongest available fit evidence for viewer
- useful reported size context
- View Fits
- Shop
- remove Favorite

### 6.5.18 V1 Outfits / Fits social-layer audit — LOCKED POSITION
Outfits are the social wrapper around LikeSized garment fit evidence, not a disconnected generic social feed.

Audit/finalize:
- one Outfit post is composed from existing owned Closet garments rather than duplicating product/fit data
- require an Outfit photo and 1–6 unique owned Closet garments with fit evidence unless the owner later changes that limit
- caption
- likes
- whether Save Outfit belongs in V1
- garment tags showing useful product, size, Fit Result/Fit Rating, and viewer-relevant historical match context without exposing raw measurements
- click garment tag → canonical garment/Product detail
- current person/Fit Twin match context must remain distinct from each garment’s immutable historical match context
- member profile Outfit presentation
- member-wide discovery versus Fit-Twin-focused Outfit discovery
- ranking should prioritize body/fit relevance before generic popularity; exact ranking formula is audited here rather than assumed
- privacy behavior when a tagged garment becomes Private or is deleted
- Outfit activity integration with Fit Twins and notifications
- creator/influencer usefulness, including making body-relevant creators discoverable through fit similarity rather than follower count alone
- creator-facing aggregate concepts such as Fit Twin count / close-fit audience may be considered, but raw member body measurements remain private and no advanced brand dashboard is required for V1
- no V1 DMs, Stories, Reels/video feed, creator payouts, sponsorship marketplace, or other broad social-network expansion unless separately owner-approved
- reuse canonical `follows`, Closet, Product, Fit Report/history, storage, and Outfit tables; no parallel social model

Naming/navigation rule:
- **Outfit** remains the content object unless owner changes it.
- The destination may ultimately be labeled **Fits**, **Outfits**, or placed inside Discover based on the 6.5.1/6.5.18 audit; no naming change is locked merely by preserving the feature.

### 6.5.19 Fit Twin Activity audit
Activity should focus on useful fit evidence:
- newly Shared garment
- new/retried fit observation on an existing garment
- new Outfit post when allowed by the final 6.5.18 rules
- click through to the actual garment/detail or Outfit evidence

Current person-to-person Fit Match may appear as relationship context, while garment evidence remains tied to its historical body snapshot.

### 6.5.20 Search audit
After the new hierarchy exists:
- search canonical products/brands/identifiers
- search members
- product results support Favorite
- member results open member Shared Closet/profile
- keep Search distinct from People My Size algorithmic discovery

### 6.5.21 Help / FAQ
Add a deliberate help surface before Beta.

Must explain at minimum:
- measurement privacy
- Match % meaning
- current Fit Twin match vs historical garment match
- People My Size
- Fit Twins
- Private vs Shared Closet
- photo sharing behavior
- Fit Result vs Fit Rating
- Favorites
- Outfits/Fits social behavior after 6.5.18 is finalized
- retailer links
- why highly matched people may still choose different sizes
- why historical evidence remains attached to the body state from the original try-on

Help/FAQ can live in the account/menu/support hierarchy rather than requiring a major primary-navigation slot.

### 6.5.22 Remaining product-surface audit
Audit all remaining V1 surfaces for terminology, privacy, usability, responsiveness, and hierarchy:
- Fit Profile
- Settings
- Notifications
- homepage
- auth/password recovery
- empty states
- error states
- mobile layouts
- logged-out states
- profile/account editing

### 6.5.23 Terminology cleanup
Primary member-facing vocabulary should be coherent and minimal:
- Discover
- People My Size
- Fit Twins
- My Closet
- Shared Closet
- Favorites
- Fit Profile
- Fit Result
- Fit Rating
- final Outfit/Fits terminology locked by the preceding navigation/social audit

“Fit Report” may remain an internal engineering/database term but should not be presented as a second member-facing object separate from the garment.

### 6.5.24 Preview verification before Phase 7
Phase 6.5 is not complete until canonical source + verification + master agree.

Verify at minimum:
- desktop/mobile
- multiple users
- Private vs Shared
- garment creation/edit/update
- repeat try-on / history behavior
- immutable historical body links
- Fit Rating and Fit Result
- Favorites
- favorite-source privacy changes
- Fit Twins and Activity
- Outfit/Fits creation, privacy, garment links, likes, profile/discovery placement, and Fit Twin integration
- same-product top matched wearers
- retailer links
- Search / People My Size distinction
- no unintended duplicate/legacy social surface
- CI, migration replay, privacy/security tests as relevant

# Phase 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Begin only after Phase 6.5 is complete.

Representative end-to-end verification must cover:
- signup/auth
- Fit Profile
- Discover / People My Size
- saving Fit Twins
- Shared Closet browsing
- garment/product discovery
- Favorites
- retailer links
- My Closet garment logging
- later fit updates/history
- Outfits/Fits social flow
- Fit Twin Activity
- Search
- privacy boundaries
- recommendation behavior
- mobile UX
- CI/database/security verification

## Exact next action
Finish PR #37 CI/preview verification, merge the owner-authorized Fit Profile completion batch to canonical `main`, verify the production Fit Profile and combined crotch guide, then run the final save/load/edit regression and outstanding owner functional checks before closing Phase 6.4 and beginning Phase 6.5.
