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
Once the owner says **push**, **deploy**, **submit**, **proceed**, **get it live**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

The working batch loop is:

**implement the complete approved batch → reconcile branch product/status/schema truth in the canonical docs → run targeted relevant checks → run full CI on the exact final candidate → merge the exact tested candidate → deploy the exact merge → verify live production → append immutable merge/deployment facts to the canonical record**.

Do not call a batch done merely because source was edited or a preview built. Do not wait until after merge to record owner-approved product meaning that already exists on the active branch. The owner verifies fixes on `likesized.com`.

An explicit owner deployment command is production authorization for the current frozen batch; do not ask for the same permission again. That authorization does **not** waive verification. If a later required gate fails, repair the underlying branch and continue automatically until the exact candidate passes. A failed/incomplete candidate may be deployed only if the owner is told the exact failed/skipped gates and then explicitly overrides them after that disclosure.

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

# CURRENT STATUS — 2026-08-27

## Canonical production line — LIVE THROUGH PR #100
Production application source of truth is PR #100 squash merge **`29d1167628d4ee634729b5efee4b9e2725b8b261`** on `main`.

PR #100 **Restore approved Outfit FITuition UI and scope safeguards** is the verified current production application line:
- exact final branch head before squash merge: **`b93dceb4e3428068b7224487dc02346d8c3c168a`**;
- exact-head LikeSized CI **#1034 / `33030833182`** completed successfully;
- squash merge: **`29d1167628d4ee634729b5efee4b9e2725b8b261`**;
- the resulting `main` push CI **`33030989868`** completed successfully through canonical integrity, exact dependency install, typecheck, the complete application safeguard suite, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- PR #100 introduced **no database migration**;
- Vercel production **`dpl_46JmEKLXn9QLZMpiHSw1EQqEgAAd`** reached READY for exact merge `29d1167628d4ee634729b5efee4b9e2725b8b261` and served the production line;
- the checked immediate production runtime window contained no runtime errors.

PR #94 and PR #95 remain immutable verification exceptions: neither had a successful completed full exact-candidate verification chain before production. Do not rewrite either as fully CI-verified. PR #96 restored the full exact-head/main verification discipline; PR #97, PR #98, PR #99 and PR #100 preserved it.

Production lineage after PR #87 is immutable and summarized in **RECENT CANONICAL LINEAGE** below. Current application/deployment status belongs here only; `supabase/schema_contract.md` does not duplicate the current app or Vercel line.

Production Supabase includes, after the earlier Roadmap 12 migrations:
- `20260825183000_private_profile_location_metadata.sql` → hosted **`20260825192738 private_profile_location_metadata`**;
- hosted **`20260826001512 username_change_cooldown`**;
- hosted **`20260826001531 exact_variation_evidence_watches`**;
- `20260826003000_atomic_outfit_cover_switch.sql` → hosted **`20260826020651 atomic_outfit_cover_switch`**;
- hosted **`20260826020710 preserve_tracked_variation_recommendation_evidence`**;
- `20260826190000_outfit_tag_consistency.sql` → hosted **`20260826193527 outfit_tag_consistency`**.

PR #94, PR #95, PR #97, PR #98, PR #99 and PR #100 introduced no new production database migration. PR #96 introduced the Outfit tag-consistency migration above.

## Current primary line — ROADMAP 12 CANONICAL CLOSEOUT
Active branch: **`agent/roadmap-12-canonical-closeout`**

This branch starts from the exact current production baseline **`29d1167628d4ee634729b5efee4b9e2725b8b261`**. It must not restore, rebase from or merge the diverged historical repair branch.

The current owner-approved Product behavior scope is exactly these three Roadmap 12 closeout items and no others:
1. **Label another person's best exact report clearly.** In the low-confidence FITuition evidence layer, another wearer's best/closest exact report is labeled **Best Available Matching Fit Report**, followed by **[NN]% Body Match**, Size and Fit Result.
2. **Keep the viewer's own exact report clean.** It is labeled only **Your Fit Report**, with Size and Fit Result underneath. The retired helper **“Your own exact report”** must not appear.
3. **Make strong/aggregated Outfit FITuition evidence use the same exact evidence units represented by Relevant Fit Reports.** The viewer's own eligible exact Product + exact tracked-variation report is included. Same person + same Product + same tracked variation remains one evidence unit; each other qualifying exact-match wearer counts independently; related/similar variations remain excluded from this Outfit aggregate. Therefore the aggregate must account for the same evidence-unit total shown by `Relevant Fit Reports: X`.

Canonical audit/governance scope in the same closeout branch is limited to repairing the audit failures without changing unrelated Product behavior:
- preserve PR #100 / `29d1167628d4ee634729b5efee4b9e2725b8b261` as the immutable production baseline;
- remove stale current-app/deployment ownership from `supabase/schema_contract.md`;
- restore `supabase/storage.sql` to support/reference-only authority;
- make canonical integrity fail closed on false storage authority, duplicated current app/deployment status outside this master, incomplete Product/safeguard master synchronization, unexecuted committed regression tests, and forbidden patch-style filenames;
- keep CI test discovery automatic for every committed `tests/*.test.ts` safeguard;
- do not make Search/Explore, Roadmap 13, Roadmap 13A or any other adjacent Product change in this batch.

PR #100's completed behavior remains protected and is not reopened except where one of the three explicit closeout defects above directly requires the canonical owning source to change.

## Roadmap 12 — New Outfit / Style an Outfit — CLOSEOUT GATE
Roadmap 12 is production-live through verified PR #100. The remaining source closeout is the three explicit owner-reported FITuition evidence defects above plus the canonical-governance reconciliation needed to prevent the same drift from returning.

**Do not mark Roadmap 12 / Style an Outfit fully complete merely because this branch contains code changes.** Completion requires the exact final branch candidate to pass the complete CI chain, owner-authorized production deployment, and live owner verification of the three closeout behaviors. Once those gates pass, Roadmap 12 may be marked **COMPLETE / DEPLOYED** and Roadmap 13 may be unblocked without reopening completed Outfit work.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means garment-relevant body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.
- A profile photo, when uploaded, is public current identity. Outfit/comment/profile surfaces resolve current identity rather than snapshotting an old avatar.
- City/state is private member metadata, not a public profile field and not part of Body Match. It may support future anonymous regional aggregate insights such as regional wishlist demand.
- **City + State are required during initial setup.** After completion, they are edited in Settings and do not reappear on My Measurements. The database may retain a null-pair compatibility state for historical rows, but current member setup/edit flows require both fields together.

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
`Matching Fit Reports: X` / `Relevant Fit Reports: X` represent personalized useful evidence, never a raw Product total.

On the Outfit tagged-item surface specifically, `Relevant Fit Reports: X` is useful personalized **exact Product + exact tracked-variation** evidence for the clicked/tagged garment. The viewer's own eligible exact-variation Fit Report counts, and qualifying other-wearer exact-variation reports count. Related/similar tracked variations do not inflate this Outfit count; broader related evidence belongs on the full Garment Detail page.

The viewer's own eligible exact Product evidence is useful both in the visible exact-variation count when it matches the clicked variation and as supporting Closet/FITuition evidence. Authorship alone must never discard it.

Recommendation evidence dedupes **same person + same Product + same tracked fit variation** to one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color do not create tracked variations.

FITuition combines Size Match evidence with the viewer's relevant Closet History. Exact Product/variation evidence is strongest; related variation is reduced fallback/support. Confidence is separate from recommendation score. `Would Buy Again` does not affect recommendation.

For the **clicked Outfit tagged-garment quick view**, zero Relevant Fit Reports hard-gates the presentation: no size recommendation is shown, even if broader Closet History could otherwise produce a numerical winner. Instead the member receives the compact notification state. When one or more Relevant Fit Reports exist but confidence is insufficient, the quick view uses the locked wording **“Not enough fit data to confidently recommend a size.”**, shows the exact count and offers the in-Outfit FITuition details layer. When confidence is sufficient, it uses **“Our FITuition suggests: [SIZE]”** with **“Confidence: [label]”** and that same FITuition details layer.

The intermediate FITuition details layer remains inside the Outfit modal/context and is evidence-only rather than a repeated summary of the quick view. In low-confidence state, another wearer's best exact report is labeled **Best Available Matching Fit Report**, followed by **[NN]% Body Match**, Size and Fit Result. If the viewer's own exact report is surfaced, identify it only as **Your Fit Report** with Size and Fit Result. A **View more Relevant Fit Reports →** control appears when additional exact reports exist. In recommendation state, the aggregated strong exact-report evidence uses the same eligible exact evidence units counted by `Relevant Fit Reports: X`, including the viewer's own eligible exact report, and renders compact count + Size + Fit Result rows. Related/similar tracked variations stay excluded from this Outfit aggregate. The separate **View Garment Detail →** navigation remains for the full page/broader evidence set.

On tagged Outfit quick view, when no Relevant Fit Reports are currently available, the member may opt into a compact bell + **Notify me** action. Its explanatory copy is **“FITuition will notify you when people close to your size post a Fit Report for this item.”** The notification control must not masquerade as a large primary CTA.

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
- When more than one photo exists, the normal desktop gallery exposes visible **Previous / Next** navigation; pointer/trackpad drag and keyboard arrows remain supplemental.
- Clicking/tapping the photo background opens full-size; tags/caption overlays retain independent behavior.
- Full-size imagery uses the shared viewer with intentional close/Escape, **left/right swipe between Outfit photos**, plus drag/swipe-down dismissal; the image follows the drag and a short drag returns instead of dismissing.
- Optional Outfit photo captions are maximum 200 characters and hidden by default behind Caption control.
- Safe public hotspots remain visible logged out.
- Tagged Items and on-photo hotspots open the same canonical tagged-item quick view.
- Signed-in Tagged Items cards preload personalized Relevant Fit Report metadata for every visible tagged garment; opening the card is not a prerequisite for its count to appear.
- Tagged Items compact cards remain compact Product identification; tracked-variation answers are exposed only after the user opens the tagged garment.
- Tagged quick view is personalized only when the viewer is signed in and eligible for personalized evidence.
- Where multiple legitimate entries share one base Product but differ by tracked fit variation, the Outfit garment-picker **list stays compact and does not display the tracked-variation answer dump**. Clicking a picker entry opens the garment quick view, and that clicked quick view exposes the answered variation-defining structured attributes needed to distinguish the legitimate entries. Same Product does not imply duplicate entry.
- The first clicked tagged-garment quick view keeps direct **View Garment Detail →** navigation at its bottom in every FITuition state. FITuition Details opens the in-Outfit evidence-only intermediate layer before any optional full-page navigation.
- **`+ Add a new garment` opens the embedded Fit Report intake in a fixed/current-viewport modal.** It must never render at the bottom of the Outfit composer merely because the dialog node is after the composer in the DOM.
- Existing Outfit save keeps photo-hotspot relationships subordinate to the current Outfit selected-garment set; stale orphan relationships are healed rather than exposed as an internal consistency error.
- Edit/New Outfit unsaved internal navigation uses the existing Save Changes/Save Draft · Leave Without Saving · Keep Editing confirmation in a fixed/current-viewport dialog; it must never render as an unnoticed block at the bottom of the composer.
- Tagged garment actions are **LikeLocker · Wishlist · Shop · Share · Report** with no garment-action counts.
- LikeLocker/Wishlist update locally/in place and independently.
- Report reason starts unselected; Other is deliberate, never silently defaulted.
- Outfit-content actions are **LikeLocker · Share · Report**. Follow/Notify belong to creator/profile context.
- Creator quick view hierarchy is **Overall Match** on its own row, **Tops Match | Bottoms Match**, then **Total Garments | Total Outfits**. Do not render these stats as a boxed table/grid with cell borders.
- Total Garments means distinct garment evidence/items, not a relabeled raw Fit Report count.
- Creator quick view may also show View Full Profile, Follow and notification state without exposing raw measurements.
- Comments default to **Top** and may switch to **Newest**. Top = Like count descending, newest tie-break. Newest = newest first.
- Comment submit, Like/unlike and sort switching use the API/local interaction path rather than whole-Outfit navigation for every action.
- Owner management controls—Edit, comments on/off, delete, Views, Follows generated—remain separate from viewer content actions.
- New Outfit photo tagging opens on the current **Cover/Main photo**.
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
4. **Fit Profile / My Measurements — OWNER-COMPLETE.** Required private City/State is collected only on first-time setup and edited in Settings; it does not reopen My Measurements.
5. Profile Settings — Fit Community and required private City/State editors are production-live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — canonical visibility meaning reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — broader audit remains; regional Twin rule live.
10. Style Feed relationship semantics — direction locked above; full feed behavior remains Roadmap 13.
11. New Fit Report — evidence-first flow live; visible photo validation is live.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit / Style an Outfit — CLOSEOUT GATE. Production through verified PR #100; active closeout line `agent/roadmap-12-canonical-closeout` is limited to the three owner-reported evidence defects plus canonical audit safeguards above. Mark COMPLETE / DEPLOYED only after exact-head CI, owner-authorized production deployment and live verification.**
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

Later Roadmap 12 production mappings:
- `20260824231500_outfit_comment_likes.sql` → hosted **`20260825000654 outfit_comment_likes`**.
- `20260824234500_live_profile_identity.sql` → hosted **`20260825000708 live_profile_identity`**.
- `20260825000500_fix_live_comment_like_count_projection.sql` → hosted **`20260825000722 fix_live_comment_like_count_projection`**.
- `20260825021000_outfit_comment_cursor_pagination.sql` → hosted **`20260825025014 outfit_comment_cursor_pagination`**.
- `20260825122000_outfit_photo_captions.sql` → hosted **`20260825133233 outfit_photo_captions`**.
- `20260825152000_outfit_public_hotspots_and_comment_sorting.sql` → hosted **`20260825155645 outfit_public_hotspots_and_comment_sorting`**.
- `20260825183000_private_profile_location_metadata.sql` → hosted **`20260825192738 private_profile_location_metadata`**.
- hosted **`20260826001512 username_change_cooldown`**.
- hosted **`20260826001531 exact_variation_evidence_watches`**.
- `20260826003000_atomic_outfit_cover_switch.sql` → hosted **`20260826020651 atomic_outfit_cover_switch`**.
- hosted **`20260826020710 preserve_tracked_variation_recommendation_evidence`**.
- `20260826190000_outfit_tag_consistency.sql` → hosted **`20260826193527 outfit_tag_consistency`**.

Applied migrations are immutable. PR #94, PR #95, PR #97, PR #98, PR #99 and PR #100 added no migration. PR #96 added the Outfit tag-consistency migration and it is production-applied at the hosted timestamp above.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish only the Roadmap 12 closeout batch on `agent/roadmap-12-canonical-closeout`: the three explicit FITuition evidence defects plus the canonical audit/governance reconciliation recorded above. Do not add adjacent Product work.
- PR #100's locked Outfit behavior remains regression-protected; tests are verification consumers, not an independent product-decision ledger.
- Keep all canonical integrity, TypeScript, focused application, build, fresh migration replay and pgTAP/database behavior/privacy gates active. Do not treat PR #94/#95 verification exceptions as precedent; PR #96 restored the full exact-head/main verification chain and PR #97/#98/#99/#100 preserved it.
- Roadmap 13A Automatic Canonical Product Image Scoring is owner-locked and planned; do not implement it opportunistically before its roadmap turn unless the owner explicitly changes the order.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- **Repository-governance external setting remains unresolved:** GitHub currently has no repository ruleset and `main` is not protected by required status checks. Written rules now require server-side protection; configure `main` to require pull requests and `LikeSized CI / verify`, block force pushes/deletion, and enable merged-head cleanup where supported. This setting cannot be represented as complete merely because CI is green.
- Historical remote repair branches remain non-authoritative. After salvage verification, merged/stale heads should be deleted rather than left as competing active-looking work lines.

# CANONICAL RECOVERY — COMPLETE
The 2026-08-21 canonical recovery is complete. No recovery freeze is active. Historical repair branches and superseded files have no current authority; Git history preserves them for provenance while current canonical files and `main` define present truth. Do not resurrect an old branch/file as a competing source merely because it still exists in Git history.

# RECENT CANONICAL LINEAGE
Recent production lineage:
- PR #80 — stopping-point Roadmap 12 repair — DEPLOYED.
- PR #81 — tagged-item live regression repair — DEPLOYED, merge `1743b0638ac80a5465dba8fb52cab831f6f35148`.
- PR #82 — visible Style Feed rename/copy slice — DEPLOYED; full Roadmap 13 behavior was intentionally not implemented.
- PR #83 — Roadmap 12 follow-up — DEPLOYED, merge `ccbe87d8391e56d106c58353eaceae1be6aaaa4f`.
- PR #84 — Outfit polish/captions — DEPLOYED, merge `332ff38cf214c09125cb8e02b39246a6b0e3e8d9`.
- PR #85 — Outfit interaction/Fit Report photo batch — DEPLOYED, merge `95cd89724ab01d85ab2ea3732af4c4f552d700b8`.
- PR #86 — Roadmap 12 interaction consistency — DEPLOYED, merge `6dccf40032d12fd68c5fc5ee85ad4a4e75a8db19`.
- PR #87 — Fit Report/Outfit live interaction regression repair — DEPLOYED, merge `96905b411dcef2b2a7b0cd55ef379986eff402db`.
- PR #88 — Roadmap 12 visual/profile completion + Roadmap 13A recording — DEPLOYED, merge `2d4bb3a193cc61d409f2c2221af17ffe5f4baa0c`.
- PR #89 — Settings/comments/global entity quick views — DEPLOYED, merge `f8378343bd5a9882daed6fd35b8fe4a8eb72bbda`.
- PR #90 — canonical LikeSized UI system — DEPLOYED, merge `ed4daa7d776517c6aa096facb4fe266d6e120100`.
- PR #91 — Outfit flow/FITuition repair — DEPLOYED, merge `7b86358353327d345c2a3e70f92eeea7abc80b2d`.
- PR #92 — Outfit Explore/FITuition production repair — DEPLOYED, merge `bd3e35bd30ae285e847089e4e355e3fd8f90997d`.
- PR #93 — Outfit tag navigation/FITuition notification state — DEPLOYED, merge `2568e316fdfb772094cbb23b6e4c19b9a9e1e449`.
- PR #94 — Outfit live-audit regression repair — DEPLOYED, merge **`15b48373857cd090e418bff942123fe57f013984`**, production **`dpl_BTxsXJxMW3NgPo5e6XBmcbJ14yz3`**, full-CI limitation recorded above.
- PR #95 — Outfit owner-audit continuation — DEPLOYED, merge **`5c52fb29cb6bb54d21015e5c87b9f1e775f0bc81`**, production **`dpl_52b8K3YGnMbJGRfiEGApdqNJcYj6`**, failed exact-head/main CI limitation recorded above.
- PR #96 — Outfit owner-audit closure — DEPLOYED, exact branch **`f4e8f4813841e1257382cedb87be8b88ba0ad4d2`**, merge **`87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7`**, exact-head CI **#994** green, main CI **#995** green, production **`dpl_C6UoK4zTr8bQA13n6SYr3uymRQaP`**, migration hosted **`20260826193527 outfit_tag_consistency`**.
- PR #97 — tagged Outfit FITuition flow — DEPLOYED, exact branch **`9cc02f75b2afd6e46c821505775b7e521f16eb61`**, merge **`6cb6902a3bc297cd36f45fc77de1af115058d996`**, exact-head CI **#1005** green, main CI **#1007** green, production **`dpl_21H4Srw7S5dUmrHx3yxNFkoG21RX`**, no database migration.
- PR #98 — Outfit garment detail link + compact picker — DEPLOYED, exact branch **`351c34cfbe40ba6075205e3f01f537c8a4a12151`**, merge **`5bac3eaace74b0194782faf8a6b2bc60c71996cb`**, exact-head CI **#1016** green, main CI **#1017** green, production **`dpl_23wXzLbNmXxumw4PMhGJpA6iJx1g`**, no database migration.
- PR #99 — own Relevant Fit Report + embedded Add a Garment viewport repair — DEPLOYED, exact branch **`102265cbde14dfd61ebcff241c612e81715857d0`**, merge **`54f77889c56bea6b2e76aa4e0200add757e6a606`**, exact-head CI **#1020** green, main CI **#1021** green, production **`dpl_4hG6Zp57VAozSSs9ZSFD52W5FU4p`**, no database migration.
- PR #100 — approved Outfit FITuition UI + scope safeguards — DEPLOYED, exact branch **`b93dceb4e3428068b7224487dc02346d8c3c168a`**, merge **`29d1167628d4ee634729b5efee4b9e2725b8b261`**, exact-head CI **#1034 / `33030833182`** green, main push CI **`33030989868`** green, production **`dpl_46JmEKLXn9QLZMpiHSw1EQqEgAAd`**, no database migration.

# EXACT NEXT ACTION — CURRENT
1. Complete only the three owner-approved Roadmap 12 closeout defects on **`agent/roadmap-12-canonical-closeout`** and keep the Product change scope frozen.
2. Verify another wearer's best exact report displays **Best Available Matching Fit Report** + **[NN]% Body Match** + Size + Fit Result.
3. Verify the viewer's own surfaced exact report displays only **Your Fit Report** + Size + Fit Result and never **“Your own exact report.”**
4. Verify strong Outfit FITuition aggregation accounts for the exact same eligible exact evidence units as `Relevant Fit Reports: X`, including the viewer's own eligible exact report and excluding related/similar variations.
5. Verify canonical audit safeguards: storage is support/reference only; schema contract contains no duplicated current app/Vercel ledger; the checker covers full PR diff, every committed regression test, Product/safeguard master synchronization and forbidden patch-style artifacts.
6. Run the complete exact-head CI chain on the final candidate. **Do not merge or deploy from this instruction alone.** Production remains PR #100 / `29d1167628d4ee634729b5efee4b9e2725b8b261` until explicit owner production authorization.
7. After owner-authorized deployment and live verification of the three closeout behaviors, mark Roadmap 12 / Style an Outfit **COMPLETE / DEPLOYED** and unblock Roadmap 13 without reopening completed Outfit work.
