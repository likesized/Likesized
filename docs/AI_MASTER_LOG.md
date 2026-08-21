# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap/status/handoff. Repository policy lives in `AI_REPOSITORY_RULES.md`.

## Working rules — LOCKED
- GitHub `likesized/Likesized` is the canonical source of truth.
- No patch/fixed/v2/backup/temp files or parallel implementations.
- Every completed task/update must be logged here; a task is not complete until canonical source and this master match the verified final state.
- Do not deploy production or update `main` when that can trigger production unless the owner explicitly authorizes it.

## Current status — 2026-08-21
- Phase 6.3 auth/configuration: COMPLETE.
- Phase 6.4 responsive/accessibility + Fit Profile polish: IN PROGRESS only because final desktop Fit Profile verification is intentionally deferred by owner choice.
- The Fit Profile measurement-name/help wording audit is COMPLETE / OWNER LOCKED and is live on production.
- The final combined `public/measurement-guides/crotch-guide.png` is owner-verified working on production for both **Crotch Depth** and **Total Crotch Length** and must not be altered, split, converted, recompressed, redrawn, or substituted.
- The **Normally worn sizes — private reference only** UI and the Fit Profile **History** notice are removed for V1. Existing private size-reference records remain preserved behind the scenes.
- Username is initial-setup-only on Fit Profile. After setup, Fit Profile does not display or edit username; username changes live in Account Settings. Username remains 3–32 letters/numbers/underscores, no spaces, case-insensitively unique, with the locked 30-day reservation for a member's previous username.
- Body measurements no longer have anatomical plausibility hard stops. LikeSized accepts any valid positive measurement in the supported unit/precision format without labeling a body or value unusual.
- Fit Profile uses a **Review → Confirm & Save** flow. On edits, Review Changes distinguishes Added, Changed, and Removed measurements before persistence.
- On mobile revisits, the large Fit Profile onboarding hero collapses to a short update header; the full hero remains for first-time setup.
- On mobile, Review Changes uses two compact measurement cards per row and entering review scrolls to the top after the review view renders.
- **Owner mobile verification — 2026-08-21:** the current Fit Profile mobile flow is confirmed working on production, including save/load/edit, revisit behavior, review/confirm behavior, removal visibility, compact revisit hero, two-column review layout, and review scroll-to-top behavior.
- **Desktop Fit Profile verification is intentionally unfinished** because the owner cannot test desktop right now. Do not mark Phase 6.4 complete until desktop is tested.
- Mobile Menu navigation-close and outside-click/tap close are owner-verified working on production.
- By explicit owner direction, Phase 6.5.1 Navigation / Information Architecture is ACTIVE while desktop Fit Profile verification remains deferred. Do not falsely mark Phase 6.4 fully complete.
- **Owner decision — 2026-08-20:** Outfits remain in V1. The prior Phase 6.5 instruction to remove Outfits is superseded. Existing canonical Outfit code/data are preserved.
- **Owner decision — 2026-08-21:** the V1 navigation/IA, Browse structure, LikeLocker concept, Style Feed placement, unified Closet + Outfit placement, and garment taxonomy decisions below are LOCKED for the current 6.5.1 working branch. No production push has been authorized for this work.

## Phase 6.4 canonical completed work / locked source decisions
- Fit Profile copy/labels/help UI polished.
- Overbust removed.
- Height uses feet + whole inches.
- Other imperial length measurements use whole inches + 0/¼/½/¾ dropdowns.
- Server validates height as whole inches and other imperial lengths in quarter-inch increments.
- Mobile Menu uses a single canonical React-controlled open state rather than native `<details>` state. Selecting any navigation link closes it, pathname changes close it, and the canonical implementation closes it on click/tap outside the menu. Both navigation-close and outside-click/tap close are owner-verified.
- iPhone Safari form controls use 16px text to prevent focus zoom; the owner has confirmed the current Fit Profile mobile experience works on production. Desktop remains separately pending.
- Username is required during initial Fit Profile setup only. Once setup exists, username disappears from Fit Profile and future username changes are owned by Account Settings.
- The underlying canonical identity remains `profiles.username`; no parallel identity field was introduced.
- Username format remains `[A-Za-z0-9_]{3,32}`, no spaces. Existing `profiles_username_ci_uq` continues to enforce case-insensitive current ownership.
- Username changes are allowed in Account Settings. Relationships/matches/follows/Closet/history remain attached to UUIDs and therefore continue through a username change.
- Previous usernames are reserved to the same account for 30 days after a normalized username change. A member may reclaim their own reserved username during that period; another member may not claim it until expiration. Reservations are private/internal and do not create a public username-history surface.
- The normally-worn-size form surface is removed from V1 because actual body measurements plus product-specific size/fit evidence are the useful fit inputs. The dormant schema is retained for forward compatibility.
- Fit Profile saves preserve any pre-existing `user_size_references` unchanged even though the fields are no longer displayed, preventing accidental historical-data deletion.
- The user-facing Fit Profile History note is removed; immutable historical Fit Report/body snapshot architecture remains intact internally.
- Anatomical measurement min/max plausibility hard stops are removed. Measurement persistence still requires technically valid positive values, valid units, and the locked input precision/format.
- Fit Profile persistence is two-step: **Review Fit Profile / Review Changes → Confirm & Save**. Nothing is saved merely by entering the review state.
- Review Changes keeps a previously saved measurement visible when the user clears it and labels that change **Removed**; newly supplied values are **Added** and edited existing values are **Changed**.
- Existing-profile mobile visits use the compact revisit hero; first-time setup keeps the full onboarding hero.
- Mobile Review Changes is a two-column compact card grid and transition into review scrolls to the top after render.

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

## Phase 6.4 production checkpoint — 2026-08-21
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
- Vercel production deployment `dpl_JBRpLEd2qE5ynsYAazTdJrFJBZWC` for commit `3a6e3ac81b78d830c5f45cc7d608729f6b230055` reached READY with no alias error.
- Owner later explicitly confirmed outside-click/tap Mobile Menu close works on production.
- Owner manually added the final combined crotch guide to canonical `main` as `public/measurement-guides/crotch-guide.png`; the owner later verified the exact final combined image working on production for both crotch measurements. Do not reopen or alter that artwork unless explicitly requested.
- Supabase migration `20260821033107_reserve_previous_usernames` was applied successfully to project `rlksidwniuoxoacumyaf`; its exact SQL remains recorded in canonical migrations.
- PR #37 completed the Fit Profile wording/artwork/UI batch and was merged to `main` as `e51ff485d9572ed62f4ccee5d260a1094dd6fd62`; its production deployment reached READY.
- PR #38 removed anatomical plausibility hard stops, introduced Review → Confirm & Save, hid username from Fit Profile after initial setup, and made Account Settings the username-change surface. It passed CI, merged to `main` as `cc359d1d5411d56025d4b775c63778d754442556`, and its production deployment reached READY.
- The owner verified Fit Profile resave/load/edit behavior works on mobile after PR #38.
- PR #39 added the compact mobile revisit hero and made removed measurements visible during Review Changes. It passed CI, merged to `main` as `7fc58f72f0d3dfe72ee438a7b466c323b8b21d03`, and production deployment `dpl_8pTmEL7b5kawpd9PmHkFNnysrQEj` reached READY.
- PR #40 added the two-column compact mobile Review Changes layout and reliable post-render scroll-to-top behavior. It passed full LikeSized CI including typecheck, build, fresh migration replay, and canonical database behavior tests; merged to `main` as `3f7273d361cf16a00cf5daad73ce988c59ecb52f`; production deployment `dpl_5K95KGbY82qiphEbGkfxMoiZ4WAa` reached READY with the production aliases.
- Owner then confirmed all currently targeted Fit Profile mobile behavior is working on production. Desktop verification remains deliberately pending.

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
- The final combined crotch image is owner-verified working on production and is locked against alteration unless explicitly requested.
- Binary verification rule remains locked: HTTP 200 alone is not sufficient for image assets. Verify deployed files are complete/decodable and match the intended canonical asset.

## Phase 6.4 — remaining work
1. **Desktop Fit Profile verification remains unfinished by owner choice for now because desktop access is unavailable.** When desktop is available, verify the production Fit Profile layout, edit/review/confirm/save flow, Added/Changed/Removed presentation, and revisit treatment.
2. Phase 6.5 work may proceed on its working branch by owner direction, but Phase 6.4 itself stays open until desktop verification is complete.

# Phase 6.5 — V1 PRODUCT SURFACE + NAVIGATION AUDIT — LOCKED

## Core product-model decision — LOCKED
- Members do not experience a garment and a Fit Report as separate data objects.
- The user-facing unit is one individual garment post/log containing the fit information for that try-on.
- `fit_reports` may remain an internal historical/data model because LikeSized needs immutable body snapshots and repeat try-ons.
- **New Fit Report** is now an owner-approved create-action label in navigation. It opens the garment logging flow; it does not create a second independent member-facing object separate from the Closet garment.
- Later try-ons use user-facing language such as **Update Fit** / **Tried It Again** and create a new historical observation internally.
- A member sees one garment in their Closet; historical observations appear only as Fit History when useful.

## Phase 6.5 sequence — LOCKED

### 6.5.1 Navigation / information architecture audit — ACTIVE
Simplify overlapping top-level destinations before polishing individual pages.

#### Owner-locked navigation hierarchy
The LikeSized logo is Home; there is no separate Home menu item.

**Notifications**
- Notifications are not a normal menu row.
- Use a persistent notification bell in the header with unread badge when applicable.
- Mobile header target: LikeSized logo | notification bell | Menu.
- Desktop header target: LikeSized logo | DISCOVER dropdown | FIT TWINS dropdown | MY CLOSET dropdown | notification bell | ACCOUNT dropdown.

**DISCOVER** — non-clickable section heading on mobile; dropdown trigger on desktop
- Browse
- People My Size
- LikeLocker

**FIT TWINS** — non-clickable section heading on mobile; dropdown trigger on desktop
- My Fit Twins
- Style Feed

**MY CLOSET** — non-clickable section heading on mobile; dropdown trigger on desktop
- My Closet
- New Fit Report
- New Outfit

**ACCOUNT** — non-clickable section heading on mobile; dropdown trigger on desktop
- Fit Profile
- Settings
- Help / FAQ
- Sign Out

Behavior/rules:
- **Following** is not a separate member-facing destination/term. Reuse canonical `follows` internally.
- **Fit Twins = saved/followed people.**
- **LikeLocker = saved fashion content**, including saved canonical products/garments and saved outfits. It is not for people.
- User-facing Favorites terminology is superseded by LikeLocker/save language; internal schema may remain until its dedicated data audit.
- Outfits do not have a standalone top-level navigation destination.
- Other members' outfit discovery lives inside Browse.
- Fit-Twin/followed-person outfit activity lives in Style Feed.
- The member's own outfits live mixed with garments inside My Closet, filterable there by **All / Garments / Outfits**.
- Mobile keeps the current compact right-side dropdown interaction rather than becoming a full-screen drawer. Because the grouped menu is taller, use max-height + internal scrolling on shorter phones while preserving large destination tap targets and existing close-on-navigation/outside-tap behavior.
- No production deployment of 6.5.1 navigation work without explicit owner authorization.

#### Browse information architecture — OWNER LOCKED
- Browse is one dynamic page, not separate garment and outfit pages.
- Search bar at top.
- Primary content switch: **Garments | Outfits**.
- Default: **Garments → All**.
- Filter controls change dynamically with the selected content type.
- A personalized carousel sits below the filter menu and updates whenever filters change.
- Ranking should combine fit relevance/closeness, recency, and LikeLocker save/popularity signal; do not rely on global popularity alone.
- User-facing popularity language should use **Most Saved**, **Popular Near Your Fit**, **Popular With People Like You**, etc., not Favorites.
- Normal Browse results continue below the carousel.
- People My Size remains a separate destination because it is body-match discovery rather than garment/outfit discovery.

Garment filter structure:
- **Category → Type → Style** is the locked controlled taxonomy hierarchy.
- Style is a controlled multi-select tag layer; one garment may have multiple style tags.
- **Brand → Model / Product Line** is a second persistent cascading filter pair whenever model data is reliably known.
- Brand is a first-class visible V1 filter and should be searchable/multi-select where practical.
- Model/Product Line appears/populates after Brand selection when reliable model data exists, using recognizable member-facing model names such as **Levi's → 501 Original**, not opaque retailer SKUs.
- Category/Type/Style and Brand/Model changes update both the personalized carousel and the normal result set.
- Manufacturer style/model numbers, UPC/GTIN, retailer SKUs, and other identifiers may support canonical product matching behind the scenes but are not all exposed as member-facing filter labels.

Material/stretch:
- **Material composition is background catalog data only in V1.** Store it on the canonical product/variant only when it comes from reliable manufacturer/product-source information.
- Never ask a member to enter or verify material composition in V1.
- Do not expose material as a Browse filter in V1. Preserve reliable manufacturer-supplied material data for possible future use.
- **Do not collect/classify stretch in V1.** No stretch question, no stretch filter, no inferred stretch value, and no attempt to standardize it from fabric composition at this time.

#### V1 garment taxonomy — OWNER LOCKED
Top-level Garment categories:
- All
- Tops
- Bottoms
- Dresses & One-Pieces
- Outerwear
- Activewear
- Swimwear
- Lingerie
- Shoes
- No Accessories in V1

**Tops — Type level**
- T-Shirts
- Tanks & Camisoles
- Shirts & Blouses
- Polos
- Sweaters & Cardigans
- Hoodies & Sweatshirts
- Style tags handle details such as Crop, V-Neck, Long Sleeve, Oversized, etc.

**Bottoms — Type level**
- Jeans
- Pants
- Shorts
- Skirts
- Leggings
- Style tags handle details such as Cargo, Chinos, Dress Pants, Joggers, Bike Shorts, etc.

**Dresses & One-Pieces — Type level**
- Dresses
- Jumpsuits
- Rompers
- Overalls
- Style tags handle details such as Maxi, Midi, Mini, Bodycon, Wrap, etc.

**Outerwear — Type level**
- Jackets
- Coats
- Blazers
- Vests
- Example style tags: Denim, Bomber, Puffer, Leather, Rain, Utility, Moto, Track, Trench, Peacoat, Overcoat, Parka, Single-Breasted, Double-Breasted, Cropped, Oversized, Quilted, Tailored.

**Activewear — Type level**
- Tops
- Bottoms
- Sets
- Sports Bras
- Jackets & Layers
- Example style tags: T-Shirts, Tanks, Long Sleeve, Compression, Leggings, Shorts, Joggers, Bike Shorts, Matching Set, Two-Piece, Light/Medium/High Support, Zip-Up, Pullover, Track Jacket, Windbreaker.

**Swimwear — Type level**
- One-Piece
- Bikini Tops
- Bikini Bottoms
- Tankinis
- Swim Trunks
- Board Shorts
- Swim Briefs
- Rash Guards
- Cover-Ups
- Example style tags: High-Waisted, Triangle, Bandeau, Halter, Cheeky, High-Cut, Longline, String.

**Lingerie — Type level**
- Bras
- Underwear
- Bodysuits
- Bralettes
- Shapewear
- Slips
- Camisoles
- Sleepwear
- Example style tags include T-Shirt, Plunge, Balconette, Push-Up, Strapless, Full Coverage, Wireless, Brief, Bikini, Thong, Boyshort, Hipster, High-Waisted, Shaping, Waist Cincher, etc.

**Shoes — Type level**
- Sneakers
- Boots
- Sandals
- Heels
- Flats
- Loafers
- Dress Shoes
- Slippers
- Example style tags include Running, Lifestyle, High-Top, Low-Top, Slip-On, Ankle, Chelsea, Combat, Knee-High, Western, Work, Slides, Strappy, Sport, Flip-Flops, Pumps, Stiletto, Block Heel, Wedge, Kitten Heel, Ballet, Mary Jane, Pointed-Toe, Penny, Tassel, Driving, Oxford, Derby, Monk Strap, Mule, Moccasin.

Taxonomy implementation rule:
- Browse and New Fit Report must share the same canonical controlled garment taxonomy. Do not create parallel category/type/style systems.

#### Outfit Browse labels — OWNER LOCKED direction
Outfit creation does not reclassify attached garments; garments already carry their garment taxonomy from Closet/Fit Report.

Outfit-level controlled labels:
- **Outfit Type:** Casual, Work, Going Out, Formal, Active, Travel, Lounge, Swimwear, Lingerie.
- **Season:** Spring, Summer, Fall, Winter, Year-Round.
- Browse Outfits can filter by these outfit-level labels; garment taxonomy remains inherited from the attached Closet garments.

### 6.5.2 Browse / Discover hub
Discover owns finding garments/outfits and people without duplicating People My Size.
- **Browse** = intentional garment/outfit discovery and search.
- **People My Size** = algorithmic body-match discovery using Overall / Tops / Bottoms matching.
- **LikeLocker** = private saved fashion content.
- Search within Browse should recognize canonical products, brands, models/product lines, and identifiers where useful.
- Avoid duplicate discovery experiences.

### 6.5.3 Fit Twins hub
Fit Twins are saved/followed people.
- **My Fit Twins** = saved people.
- **Style Feed** = social/fit activity from Fit Twins/people the member follows.
- A member who follows nobody has no personalized Style Feed content; design the empty state later.
- “Following” must not remain a competing member-facing destination/term.
- Reuse the canonical `follows` relationship; no parallel social model.

### 6.5.4 Preserve V1 Outfits; final social-layer audit later
- **Supersedes the prior decision to remove Outfits from V1.**
- Preserve the existing canonical Outfit implementation, migrations, storage behavior, likes, and Closet-item linking while the underlying garment/product experience is audited.
- Do not create a parallel Outfit implementation or alternate social graph.
- Outfits are composed from existing owned Closet garments; garment classification is never re-entered at Outfit creation.
- Other-member Outfit browsing lives in Browse; Fit-Twin-focused Outfit activity lives in Style Feed; owned Outfits live inside My Closet.
- Existing Outfit behavior must continue to respect raw-measurement privacy and the canonical `follows` relationship.

### 6.5.5 My Closet audit/redesign
**My Closet = the member's owned garment + outfit library.**

Audit/build:
- unified cards/grid for owned garments and outfits
- page-level **All / Garments / Outfits** filters
- garment product/brand/model
- size
- Fit Result
- Fit Rating
- image
- Private / Shared state
- search/filtering by useful garment fields
- **New Fit Report** create action for a garment
- **New Outfit** create action
- edit garment
- delete garment
- change sharing
- Update Fit / Tried It Again
- Fit History only when multiple observations exist
- preview how a Shared item appears to other members

### 6.5.6 New Fit Report / garment-post flow — HARD USABILITY CHECKPOINT
One member-facing action: log one garment and tell LikeSized how it fits. This is where the new garment system is built and owner-tested before moving on to 6.5.7.

Required user-facing information:
- garment/product identity
- size
- **Fit Result**
- **Fit Rating — 1–5 stars**

Optional where useful:
- fit details/notes
- photo
- garment-specific controlled fit questions
- Would Buy Again if retained after audit

#### Canonical product/classification workflow — OWNER LOCKED
- Identify the garment using the strongest available combination of canonical product identity, brand, recognizable model/product line, manufacturer style/model number, UPC/GTIN, retailer SKU, product name, retailer listing, and variant information.
- Retailer SKU alone is not a sufficient universal source of truth because retailers may assign their own identifiers.
- Every canonical garment/product classification uses the same **Category → Type → Style** taxonomy as Browse.
- If LikeSized already knows the exact product, prefill its classification.
- While a classification is not locked, the member sees the prefilled values and can verify or correct them.
- If LikeSized cannot classify a new product confidently, the first member selects from the controlled taxonomy rather than creating free-text categories.
- Future members logging the same canonical product should usually verify existing controlled values rather than re-entering them.
- One member gets one active classification response/vote per field/tag; do not allow vote spam.

Classification states and disagreement tracking:
- Track classification independently per field/tag with **Provisional → Verified → Locked** status.
- Category, Type, and each individual Style tag can progress/lock independently so one disputed detail does not hold up obviously stable fields.
- Record confirmations and disagreements per field/tag rather than treating the entire product classification as one all-or-nothing vote.
- A member correction/disagreement must never silently rewrite the canonical product for everyone.
- Meaningful disagreement sends the specific field/tag to a **Classification Review** queue with available product/manufacturer/retailer evidence and vote counts/history.
- Admin/LikeSized can make the canonical final decision, add/remove/replace a classification value, or reopen it for more verification.
- Once a field/tag is **Locked**, ordinary members stop being asked to verify it and cannot casually change it.
- A locked classification can still expose **Report classification issue**; this creates an admin review request and does not alter canonical data.
- Preserve a classification audit history: field/tag, old value, new value, who/what source changed it, timestamp, and reason/evidence where applicable.

Brand/model and background material:
- Brand and recognizable Model/Product Line are canonical product metadata and feed the locked Browse **Brand → Model** filters.
- Preserve manufacturer style/model numbers and other identifiers behind the scenes even when the member-facing model name is friendlier.
- Material composition may be stored only when reliable manufacturer/product-source data supplies it. Never ask members to enter/verify it and do not use it as a V1 Browse filter.
- Do not collect or classify stretch in V1.

Outfits:
- Outfit creation does not repeat garment classification. A garment must already exist in the member's Closet before it can be attached to an Outfit, so the Outfit inherits the garment's canonical product/taxonomy data.

Usability gate before 6.5.7:
- Put the real New Fit Report flow on a safe preview and have the owner test it as a normal user before proceeding.
- Explicitly test both **new/unknown garment** and **known/previously classified garment** scenarios.
- Goal: the first member may need to provide controlled classification information; later members should experience a progressively faster prefilled flow.
- Do not move to 6.5.7 until the owner confirms the flow is not too clunky or burdensome.

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
- Style/Activity presentation consistent with final Style Feed rules
- Outfit/profile presentation finalized without creating parallel data models

Shared Closet:
- only intentionally Shared garments
- search
- category filters
- dynamic subfilters based on available content
- no empty/useless filters

### 6.5.9 Shared Closet garment cards
Show useful fit evidence without exposing raw body measurements:
- image
- brand/product/model
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
- brand/product/model
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
- LikeLocker save action

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
- brand + recognizable model/product line
- product/variant image
- LikeLocker save control
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

### 6.5.15 LikeLocker / saved fashion content — LOCKED
- **LikeLocker = save fashion content.**
- **Fit Twin = save a person.**
- LikeLocker is private in V1 unless a later owner decision explicitly changes that.
- LikeLocker can hold saved canonical products/garments and saved Outfits.
- Do not create a separate user-facing Favorites destination alongside LikeLocker.
- No notification to another member merely because their Shared fit led to a product save.
- No Fit Twin/Style Feed event merely for saving a product.
- One saved canonical product per user/product; Outfit save uniqueness should follow the analogous canonical object rule.

Save behavior should be available wherever useful, including:
- Browse cards/results
- Shared Closet cards
- garment detail
- canonical Product page
- Style Feed garment/outfit entries
- People Like You Who Wore This results
- Outfit detail/cards where Save Outfit is supported

### 6.5.16 LikeLocker provenance
If a user saves a Product while viewing a specific member’s Shared garment evidence, LikeSized may retain the originating Shared observation as provenance, e.g. **Saved from Tina’s fit**.

Rules:
- Saved Product remains attached to the canonical Product.
- If the source garment becomes Private/deleted/unavailable, private evidence disappears immediately.
- The LikeLocker save itself remains unless the user removes it.
- Equivalent provenance may be considered for saved Outfits without creating a parallel save system.

### 6.5.17 LikeLocker view under Discover
Saved fashion content should be useful shopping/style bookmarks, not just names.

Useful product content:
- product image
- brand/product/model
- strongest available fit evidence for viewer
- useful reported size context
- View Fits
- Shop
- remove from LikeLocker

Useful Outfit content:
- Outfit image
- creator/context where still available
- attached garment links/evidence according to privacy rules
- remove from LikeLocker

### 6.5.18 V1 Outfits social-layer audit — LOCKED POSITION
Outfits are the social wrapper around LikeSized garment fit evidence, not a disconnected generic social feed.

Audit/finalize:
- one Outfit post is composed from existing owned Closet garments rather than duplicating product/fit/taxonomy data
- require an Outfit photo and 1–6 unique owned Closet garments with fit evidence unless the owner later changes that limit
- caption
- likes
- Save Outfit into LikeLocker
- controlled Outfit Type + Season labels defined in 6.5.1
- garment tags showing useful product, size, Fit Result/Fit Rating, and viewer-relevant historical match context without exposing raw measurements
- click garment tag → canonical garment/Product detail
- current person/Fit Twin match context must remain distinct from each garment’s immutable historical match context
- member profile Outfit presentation
- member-wide Outfit discovery lives in Browse
- Fit-Twin/followed-person Outfit activity lives in Style Feed
- ranking should prioritize body/fit relevance before generic popularity; exact ranking formula is audited here rather than assumed
- privacy behavior when a tagged garment becomes Private or is deleted
- Outfit activity integration with Fit Twins and notifications
- creator/influencer usefulness, including making body-relevant creators discoverable through fit similarity rather than follower count alone
- creator-facing aggregate concepts such as Fit Twin count / close-fit audience may be considered, but raw member body measurements remain private and no advanced brand dashboard is required for V1
- no V1 DMs, Stories, Reels/video feed, creator payouts, sponsorship marketplace, or other broad social-network expansion unless separately owner-approved
- reuse canonical `follows`, Closet, Product, Fit Report/history, storage, and Outfit tables; no parallel social model

### 6.5.19 Style Feed audit
Style Feed should focus on useful content from Fit Twins/people the member follows:
- newly Shared garment
- new/retried fit observation on an existing garment
- new Outfit post
- click through to the actual garment/detail or Outfit evidence

Current person-to-person Fit Match may appear as relationship context, while garment evidence remains tied to its historical body snapshot.

### 6.5.20 Browse search audit
After the new hierarchy exists:
- search canonical products/brands/models/identifiers within Browse
- search/member discovery behavior must not duplicate People My Size
- product results support LikeLocker saves
- member results, where supported, open member Shared Closet/profile
- keep intentional Search/Browse behavior distinct from People My Size algorithmic discovery

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
- LikeLocker
- Outfits / Style Feed social behavior
- retailer links
- why highly matched people may still choose different sizes
- why historical evidence remains attached to the body state from the original try-on

Help/FAQ can live in the ACCOUNT menu/support hierarchy rather than requiring a major primary-navigation slot.

### 6.5.22 Remaining product-surface + admin/moderation audit
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

Admin/moderation requirement:
- LikeSized needs an authorized admin/moderation surface before Beta; do not expose it as an ordinary member account feature.
- Admin must be able to review canonical product/classification disagreements and classification-issue reports, inspect supporting evidence/vote history, make final classification decisions, and lock/reopen fields/tags.
- Admin must be able to review reported/flagged member content including garment and Outfit photos, remove inappropriate content when needed, and preserve an audit trail of moderation actions.
- Member reports/flags must not directly delete or rewrite canonical data/content without authorized review except where an independently locked safety rule later requires immediate hiding/quarantine.
- Exact moderation policy, report reasons, roles/permissions, escalation, and any automatic image screening are audited before implementation; do not invent them ad hoc.

### 6.5.23 Terminology cleanup
Primary member-facing vocabulary should be coherent and minimal:
- Browse
- People My Size
- Fit Twins
- My Fit Twins
- Style Feed
- My Closet
- LikeLocker
- Fit Profile
- Fit Result
- Fit Rating
- Outfit
- New Fit Report as the approved garment-create action label

Do not surface Following or Favorites as competing member-facing destination names.

### 6.5.24 Preview verification before Phase 7
Phase 6.5 is not complete until canonical source + verification + master agree.

Verify at minimum:
- desktop/mobile
- multiple users
- Private vs Shared
- grouped navigation + persistent notification bell
- Browse Garments/Outfits behavior and filters
- Category → Type → Style taxonomy
- Brand → Model filtering
- garment creation/edit/update
- provisional/verified/locked classification behavior and disagreement review
- known-product vs new-product New Fit Report usability
- manufacturer-only background material behavior; no member material/stretch questions
- repeat try-on / history behavior
- immutable historical body links
- Fit Rating and Fit Result
- LikeLocker product/outfit saves
- save-source privacy changes
- Fit Twins and Style Feed
- Outfit creation, privacy, inherited garment links/taxonomy, likes, Browse placement, Style Feed integration, and LikeLocker save behavior
- same-product top matched wearers
- retailer links
- People My Size distinction
- admin classification-review and content-moderation paths
- no unintended duplicate/legacy social surface
- CI, migration replay, privacy/security tests as relevant

# Phase 7 — V1 BETA END-TO-END VERIFICATION — QUEUED
Begin only after Phase 6.5 is complete.

Representative end-to-end verification must cover:
- signup/auth
- Fit Profile
- Browse / People My Size
- saving Fit Twins
- Shared Closet browsing
- garment/product discovery
- LikeLocker
- retailer links
- My Closet garment + Outfit library
- New Fit Report garment logging
- later fit updates/history
- Outfits social flow
- Style Feed
- privacy boundaries
- recommendation behavior
- admin/moderation basics
- mobile UX
- CI/database/security verification

## Exact next action
Continue **Phase 6.5.1 Navigation / information architecture** on branch `phase-6-5-1-navigation-ia`. The owner-approved IA and taxonomy decisions above are now the source for implementation. Next return to the actual 6.5.1 navigation work rather than expanding the future New Fit Report design further. Desktop Fit Profile verification remains intentionally deferred and does not authorize a production push.
