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

## Live repair fast path — OWNER DIRECTED
During an owner live audit, concrete owner-reported breakage plus a direction to fix it authorizes implementation on the one active repair branch. Do not stop for repeated approval questions, repeated status-only handoffs or parallel repair branches. “Fast path” means remove unnecessary conversational/process pauses—not remove canonical safeguards, exact-head CI, build, migration replay or database/privacy verification.

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

# CURRENT STATUS — 2026-08-26

## Canonical production line — LIVE THROUGH PR #96
Production application source of truth is PR #96 squash merge **`87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7`** on `main`.

PR #94 **Repair remaining Outfit audit regressions** remains an important verification exception in the lineage:
- exact repair-branch head before squash merge: **`e1931c2558622e97c842aaa5aa966b216e1349a5`**;
- the GitHub Actions attempt for the PR #94 repair line did not produce a completed full CI job before production;
- the owner explicitly authorized deployment with **“get this deployed”** on 2026-08-26;
- squash merge: **`15b48373857cd090e418bff942123fe57f013984`**;
- Vercel production: **`dpl_BTxsXJxMW3NgPo5e6XBmcbJ14yz3`** reached READY and served `likesized.com`;
- post-deploy checks returned HTTP 200 for the homepage and a published Outfit route, and the checked deployment-scoped runtime window contained no error/fatal entries.

PR #95 **Complete current Outfit owner-audit repairs** also remains a verification exception:
- exact repair-branch head before squash merge: **`34c436e0f6d5fb37c608b64e0d8b2fd0894779cf`**;
- PR exact-head CI run **#979 / `32994041367` failed** before completing the full verification chain;
- owner then explicitly authorized deployment;
- squash merge: **`5c52fb29cb6bb54d21015e5c87b9f1e775f0bc81`**;
- the resulting `main` push CI run **#978 / `32993535307` also failed**;
- therefore PR #95 did **not** have a successful exact-candidate full CI run covering every later application test, production build, fresh migration replay and database behavior/privacy test before or after merge;
- Vercel production **`dpl_52b8K3YGnMbJGRfiEGApdqNJcYj6`** reached READY on `likesized.com`; the live site returned HTTP 200 and the checked immediate deployment runtime window contained no error/fatal entries.

PR #96 **Close current Outfit owner-audit failures** is the verified current production application line:
- exact final repair-branch head before squash merge: **`f4e8f4813841e1257382cedb87be8b88ba0ad4d2`**;
- owner explicitly authorized the frozen batch for production with **“fix it all and deploy”** on 2026-08-26;
- exact-head LikeSized CI **#994 / `33005686076`** completed successfully through canonical integrity, exact dependency install, typecheck, the full application safeguard suite, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- squash merge: **`87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7`**;
- resulting `main` push LikeSized CI **#995 / `33005905387`** also completed successfully through the same full verification chain;
- local ordered migration **`20260826190000_outfit_tag_consistency.sql`** was applied to production as hosted **`20260826193527 outfit_tag_consistency`**;
- Vercel production **`dpl_C6UoK4zTr8bQA13n6SYr3uymRQaP`** reached READY for exact merge `87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7` with `likesized.com` assigned and no alias error;
- live checks returned HTTP 200 for the homepage and published Outfit `/outfits/6bab9c98-b056-4836-a581-5653c46a85b3`; the Outfit response identified deployment `dpl_C6UoK4zTr8bQA13n6SYr3uymRQaP` and rendered the explicit Previous/Next gallery controls;
- the checked post-deploy runtime-error window contained no runtime errors.

Do not rewrite PR #94 or PR #95 as fully CI-verified. Their verification gaps remain historical fact. PR #96 is the first of these three Outfit closure batches with both an exact-final-branch full green run and a successful full `main` push run.

Production lineage after PR #87 is complete and immutable:
- PR #88 **Finish Roadmap 12 visual and profile completion repairs** → merge **`2d4bb3a193cc61d409f2c2221af17ffe5f4baa0c`**. This carried the deterministic Wishlist SVG, creator quick-view cleanup, private City/State foundation, and Roadmap 13A canonical-image planning into production.
- PR #89 **Finish Settings, comments, and global entity quick views** → merge **`f8378343bd5a9882daed6fd35b8fe4a8eb72bbda`**. Current application behavior makes private City + State required profile metadata at initial setup and editable in Settings.
- PR #90 **Establish canonical LikeSized UI system** → merge **`ed4daa7d776517c6aa096facb4fe266d6e120100`**.
- PR #91 **Repair live Outfit flows and evolve FITuition** → merge **`7b86358353327d345c2a3e70f92eeea7abc80b2d`**.
- PR #92 **Repair remaining Outfit Explore and FITuition production failures** → merge **`bd3e35bd30ae285e847089e4e355e3fd8f90997d`**.
- PR #93 **Fix Outfit tag navigation and FITuition notification state** → merge **`2568e316fdfb772094cbb23b6e4c19b9a9e1e449`**.
- PR #94 **Repair remaining Outfit audit regressions** → merge **`15b48373857cd090e418bff942123fe57f013984`**.
- PR #95 **Complete current Outfit owner-audit repairs** → merge **`5c52fb29cb6bb54d21015e5c87b9f1e775f0bc81`**.
- PR #96 **Close current Outfit owner-audit failures** → merge **`87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7`**, current production application source.

Production Supabase includes, after the earlier Roadmap 12 migrations:
- `20260825183000_private_profile_location_metadata.sql` → hosted **`20260825192738 private_profile_location_metadata`**;
- hosted **`20260826001512 username_change_cooldown`**;
- hosted **`20260826001531 exact_variation_evidence_watches`**;
- `20260826003000_atomic_outfit_cover_switch.sql` → hosted **`20260826020651 atomic_outfit_cover_switch`**;
- hosted **`20260826020710 preserve_tracked_variation_recommendation_evidence`**;
- `20260826190000_outfit_tag_consistency.sql` → hosted **`20260826193527 outfit_tag_consistency`**.

PR #94 and PR #95 introduced no new production database migration. PR #96 introduced the Outfit tag-consistency migration above.

## Current primary line — ROADMAP 12 OWNER AUDIT REPAIR IN PROGRESS
Active branch: **`agent/outfit-relevance-notify-closure`**

The one active repair line is **PR #97 `Repair tagged Outfit FITuition flow`** on branch **`agent/outfit-relevance-notify-closure`**, based on current canonical `main` after PR #96. PR #97 is currently open/unverified; no competing repair branch is authorized.

PR #96 remains the production baseline and its four repaired behaviors stay protected:
1. **Relevant Fit Reports preload on every signed-in Tagged Items card.** Opening a garment is not required to make its count appear.
2. **The normal desktop Outfit gallery provides obvious Previous/Next navigation when more than one photo exists.** Pointer/trackpad drag and keyboard arrows remain supplemental.
3. **Existing Outfit edit/save heals stale hotspot-to-selected-garment relationships instead of surfacing the internal `Hotspot garment is not tagged in this Outfit` consistency error.** Legitimate current hotspots remain intact; relationships no longer represented by the Outfit's selected-garment set are removed.
4. **Tracked variation identity remains available where a person must distinguish legitimate same-Product entries.** Legitimate repeated same-Product entries are not deduped merely because the base Product is the same.

Current owner-locked repair scope on PR #97 / `agent/outfit-relevance-notify-closure`:
1. **Visible Relevant Fit Report count is other-wearer exact evidence.** `Relevant Fit Reports: X` on the Outfit tagged item/quick view counts useful reports from other wearers for the exact Product + exact tracked variation being shown. The viewer's own eligible exact-variation report remains supporting Closet/FITuition evidence internally but does not increment this visible count and does not suppress the zero-report Notify state. Related/similar tracked variations do not inflate this Outfit count; broader related evidence belongs on the full Garment Detail page.
2. **Zero exact Relevant Fit Reports must never surface a tagged-item size recommendation.** The clicked quick view shows the compact notification state instead, using a visible bell/`Notify me` action and the existing FITuition notification explanation. Closet History may remain supporting recommendation evidence internally but does not authorize a tagged-item recommendation when the visible exact Relevant Fit Report count is zero.
3. **Positive exact evidence has two presentation states.** When one or more Relevant Fit Reports exist but confidence is insufficient, the quick view says FITuition cannot recommend a size yet, shows the count and opens a concise intermediate FITuition detail layer. When evidence is strong enough, the quick view shows recommended size + confidence and opens that same intermediate detail layer.
4. **The intermediate FITuition detail layer stays inside Outfit context.** Low-confidence state shows the single best/closest exact report first and, when more reports exist, provides a control that leaves for the full Garment Detail page to see the rest. Recommendation state shows the aggregated strong exact-report summary. The intermediate layer has the explicit full Garment Detail navigation for broader evidence/related variations; the first click from the Outfit does not immediately eject the viewer from their Outfit position.
5. **Tagged Items cards stay compact.** The normal card remains Product photo, Brand + Item, Category/Garment Type and Relevant Fit Reports count/status. Tracked-variation attributes appear only after the garment is clicked; they are not dumped onto the compact card/bar.
6. **Edit Outfit unsaved navigation confirmation must be immediately visible in the current viewport.** `Save Changes`/`Save Draft`, `Leave Without Saving` and `Keep Editing` remain the existing actions; the dialog is fixed/current-viewport rather than appended out of sight at the bottom of the editor.

The separately reported Explore/Search behavior remains deferred to the later Search audit. Do not fold Search into this Roadmap 12 Outfit repair unless the owner explicitly changes scope.

PR #97 is implementation-in-progress and is **not yet verified, merged or deployed**. Do not describe any of these repairs as production behavior until the exact final candidate passes required verification, is merged with owner deployment authorization, and live behavior is checked.

## Roadmap 12 — New Outfit — CURRENT OWNER AUDIT GATE
Roadmap 12 is production-live through PR #96 and remains under owner live audit until the owner explicitly accepts the Roadmap 12/New Outfit stopping point. The current owner-audit repair line is PR #97 on `agent/outfit-relevance-notify-closure`.

**Roadmap 13 remains blocked until the owner explicitly finishes the New Outfit/Roadmap 12 audit and accepts the production stopping point.**

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

On the Outfit tagged-item surface specifically, `Relevant Fit Reports: X` is the useful personalized **other-wearer exact Product + exact tracked-variation** evidence count for the clicked/tagged garment. The viewer's own eligible exact-variation Fit Report remains useful supporting Closet/FITuition evidence but does not increment this visible count and does not suppress the zero-report Notify state. Related/similar tracked variations do not inflate this Outfit count; broader related evidence belongs on the full Garment Detail page.

The viewer's own eligible exact Product evidence is useful and may be the strongest supporting Closet evidence. It must not disappear merely because the viewer authored it, but it is distinct from the Outfit's visible other-wearer Relevant Fit Report count.

Recommendation evidence dedupes **same person + same Product + same tracked fit variation** to one recommendation evidence unit. Distinct people remain independent; distinct tracked variations may remain distinct. Size and Color do not create tracked variations.

FITuition combines Size Match evidence with the viewer's relevant Closet History. Exact Product/variation evidence is strongest; related variation is reduced fallback/support. Confidence is separate from recommendation score. `Would Buy Again` does not affect recommendation.

For the **clicked Outfit tagged-garment quick view**, zero Relevant Fit Reports hard-gates the presentation: no size recommendation is shown, even if broader Closet History could otherwise produce a numerical winner. Instead the member receives the compact notification state. When one or more Relevant Fit Reports exist but confidence is insufficient, the quick view says it cannot recommend a size yet, shows the exact count and offers the in-Outfit FITuition details layer. When confidence is sufficient, it shows recommended size + confidence and that same FITuition details layer.

The intermediate FITuition details layer remains inside the Outfit modal/context. In low-confidence state it shows the single best/closest exact report first; if more exact reports exist, the full Garment Detail page is the destination for the rest. In recommendation state it shows the aggregated strong exact-report summary. The full Garment Detail page remains the place for the broader evidence set, including related/similar tracked variations.

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
- Where multiple legitimate entries share one base Product but differ by tracked fit variation, the Outfit picker and clicked/tagged quick-view path expose the answered variation-defining structured attributes needed to distinguish them. Same Product does not imply duplicate entry.
- The clicked tagged-garment quick view opens one in-Outfit FITuition detail layer for deeper exact-variation evidence. That intermediate layer—not the first click—contains the explicit navigation to the full Garment Detail page, which is where broader/related evidence lives.
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
12. **New Outfit — CURRENT OWNER AUDIT GATE; production through verified PR #96; active repair PR #97 is open/unverified.**
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

Applied migrations are immutable. PR #94 and PR #95 added no migration. PR #96 added the Outfit tag-consistency migration and it is production-applied at the hosted timestamp above.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish and verify the single active Roadmap 12 owner-audit repair PR #97 on `agent/outfit-relevance-notify-closure`; do not expand it into Search or Roadmap 13.
- Keep all canonical integrity, TypeScript, focused application, build, fresh migration replay and pgTAP/database behavior/privacy gates active. Do not treat PR #94/#95 verification exceptions as precedent; PR #96 restored the full exact-head/main verification chain.
- Source-format regression tests that assert incidental JSX spelling/placement should be corrected to preserve the real behavior contract rather than forcing application code backward to satisfy stale regex. This is not permission to weaken behavioral checks.
- Roadmap 13A Automatic Canonical Product Image Scoring is owner-locked and planned; do not implement it opportunistically before its roadmap turn unless the owner explicitly changes the order.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- GitHub currently returns **no repository rulesets** for this repository. Branch-protection details are not readable through the connected integration, and the fact that failed PR #95 entered `main` proves there was no effective required-green-CI barrier for that merge. Machine-level protection should be added later only through an explicitly reviewed repository-governance change; meanwhile the repository rule and exact-head verification discipline are mandatory.

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

# EXACT NEXT ACTION — CURRENT
1. Finish the owner-locked Roadmap 12 repair scope on the one active PR **#97 / `agent/outfit-relevance-notify-closure`**: zero-report Notify behavior, corrected other-wearer Relevant Fit Report counts, positive-report FITuition states/intermediate evidence layer, compact tagged cards with clicked-only variation detail, and current-viewport unsaved navigation confirmation.
2. Keep the viewer's own eligible exact report in Closet/FITuition recommendation evidence without incrementing the visible Outfit `Relevant Fit Reports` count or suppressing Notify; do not inflate the Outfit count with related/similar tracked variations.
3. Keep the separately reported Explore/Search behavior deferred to the later Search audit unless the owner explicitly changes the order.
4. `docs/V1_PRODUCT_SPEC.md` has been reconciled to the same owner-locked interaction semantics. Run the focused application safeguards and full exact-head CI on the final PR #97 candidate; fix failures rather than weakening/bypassing the gates.
5. Keep canonical integrity, TypeScript, complete application safeguards, production build, full fresh migration replay and pgTAP/database behavior/privacy verification mandatory for every relevant final candidate.
6. Keep Roadmap 13 blocked until the owner explicitly closes Roadmap 12/New Outfit.
7. Preserve Roadmap 13A as the shared future canonical Product-image system; do not create competing Explore/Search/Wish Locker image selection before its roadmap turn.
8. Production remains PR #96 until this owner-authorized PR #97 candidate is fully verified, merged and deployed.