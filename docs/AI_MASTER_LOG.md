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
- Measurement-guide implementation, binary repair, production deployment, and owner visual verification: COMPLETE.
- Phase 6.5 V1 Product Surface + Navigation Audit: LOCKED / QUEUED immediately after Phase 6.4.

## Phase 6.4 canonical completed work
- Fit Profile copy/labels/help UI polished.
- Overbust removed.
- Height uses feet + whole inches.
- Other imperial length measurements use whole inches + 0/¼/½/¾ dropdowns.
- Server validates height as whole inches and other imperial lengths in quarter-inch increments.

## Approved measurement-guide artwork — COMPLETE / LIVE / OWNER VERIFIED
- Approved unisex body artwork is the base for normal measurement guides and remained valid.
- Approved shared waist/hip artwork is used for Natural Waist, High Hip, Hips / Seat, and Waist-to-Hip Length.
- Approved front/back magenta artwork is used for Torso Girth.
- Old coded body figure and old WaistHipDiagram / TorsoGirthDiagram implementations remain removed; there are no fallback copies.
- Canonical asset paths are `public/measurement-guides/body-guide.webp`, `public/measurement-guides/waist-hip-guide.webp`, and `public/measurement-guides/torso-girth-guide.webp`.
- Original implementation commit: `14c60617fc5ad391198f1f6ea64bf6bcc11d7644`.
- Corrected waist/hip Git blob: `207cef3553aacb70909d95427e5541be81f9782a`.
- Corrected Torso Girth Git blob: `f8933270c7d75888a531587ecbf7eee31f5268e4`.
- Repair commit `c9de2165280ff7b13591eb64665774394af932a9` deployed through Vercel production deployment `dpl_2zn8KbfppxY8CkMKZ7JsdPEFH5qv`, which reached READY with no build errors.
- Live verification confirmed corrected canonical binaries, and the owner confirmed the rendered measurement guides work.
- Binary verification rule remains locked: HTTP 200 alone is not sufficient for image assets. Verify deployed files are complete/decodable and match expected canonical bytes/hash.

## Phase 6.4 measurement audit — owner-locked decisions
- **Individual Shoulder Length:** keep current name, description, how-to, and guide as-is.
- **Torso Girth:** keep current name, description, how-to, tip, and approved guide as-is.
- **Bust Point to Bust Point:** keep the measurement and guide; use title capitalization `Bust Point to Bust Point`; description stays `The horizontal distance between the fullest points of the bust.`; how-to is `Measure straight across from the fullest point of one bust to the fullest point of the other while standing naturally.`

## Phase 6.4 — remaining work
1. Mobile Menu auto-close behavior.
2. iPhone Safari form-focus zoom fix.
3. Final Fit Profile save/load/edit regression verification.
4. Continue the remaining measurement-name/help audit after **Bust Point to Bust Point**.
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

Current separate top-level concepts Search, People My Size, Following, and Outfits must be audited against this hierarchy rather than automatically retained as peer menu items.

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

### 6.5.4 Remove the V1 Outfits concept
- LikeSized V1 is about individual articles of clothing, not full-outfit posts composed from multiple garments.
- Remove Outfits from the user-facing navigation and audit/remove the current V1 outfit-post surface.
- Remove/supersede outfit activity from feeds/notifications/docs where appropriate.
- Do not rewrite applied migrations. If database cleanup is required, use a new ordered canonical migration.
- Update product/spec/schema documentation so V1 no longer presents full-outfit posting as a feature.

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
- no Outfits tab in V1

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

### 6.5.18 Fit Twin Activity audit
Activity should focus on garment evidence:
- newly Shared garment
- new/retried fit observation on an existing garment
- click through to the actual garment/detail evidence

Current person-to-person Fit Match may appear as relationship context, while the garment evidence remains tied to its historical body snapshot.

### 6.5.19 Search audit
After the new hierarchy exists:
- search canonical products/brands/identifiers
- search members
- product results support Favorite
- member results open member Shared Closet/profile
- keep Search distinct from People My Size algorithmic discovery

### 6.5.20 Help / FAQ
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
- retailer links
- why highly matched people may still choose different sizes
- why historical evidence remains attached to the body state from the original try-on

Help/FAQ can live in the account/menu/support hierarchy rather than requiring a major primary-navigation slot.

### 6.5.21 Remaining product-surface audit
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

### 6.5.22 Terminology cleanup
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

“Fit Report” may remain an internal engineering/database term but should not be presented as a second member-facing object separate from the garment.

### 6.5.23 Preview verification before Phase 7
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
- same-product top matched wearers
- retailer links
- Search / People My Size distinction
- no unintended legacy Outfit surface
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
- Fit Twin Activity
- Search
- privacy boundaries
- recommendation behavior
- mobile UX
- CI/database/security verification

## Exact next action
Continue Phase 6.4 in order:
1. Finish verification for mobile Menu auto-close and iPhone Safari focus zoom fixes on the working branch.
2. Verify Fit Profile save/load/edit regression behavior.
3. Continue the measurement-name/help audit with **Shoulder to Bust Point**.
4. Finish the remaining measurement audit.
5. Close Phase 6.4, then begin Phase 6.5 at navigation/information architecture audit.
