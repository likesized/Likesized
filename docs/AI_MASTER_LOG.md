# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, product/status record, owner-decision ledger, release authorization/verification ledger, recovery/branch-cleanup ledger and AI handoff for LikeSized.

Canonical ownership:
- `AI_REPOSITORY_RULES.md` — repository/source-of-truth policy.
- `docs/AI_MASTER_LOG.md` — this file; roadmap/product status/decision/release verification/handoff.
- `docs/V1_PRODUCT_SPEC.md` — current product/fit architecture only.
- `supabase/schema_contract.md` — current database behavior/privacy plus explicit implementation debt.
- `supabase/migrations/` — immutable ordered executable database history.

GitHub `likesized/Likesized` is the source of truth for application source and recorded product decisions. `main` is the single production source line. Current files describe current product truth; Git history preserves superseded attempts. Never create patch/fixed/v2/temp/backup implementations, parallel product systems or a second master plan.

**Vercel owns live deployment operational truth.** This master records immutable release facts after they are verified, but whether a deployment is currently READY, rolled back, reassigned or unhealthy must be read from Vercel when that current operational state matters.

## Deployment-batch discipline — OWNER LOCKED
Once the owner says **push**, **deploy**, **submit**, **proceed**, **get it live**, **continue** in the context of an explicitly identified verified release candidate, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

The working batch loop is:

**implement the complete approved batch → reconcile branch product/status/schema truth in the canonical docs → run targeted relevant checks → run full CI on the exact final candidate → merge the exact tested candidate → verify the resulting production application deployment and post-merge CI → record immutable release facts without creating another runtime build merely for bookkeeping**.

Do not call a batch done merely because source was edited or a preview built. Owner-approved product meaning must be recorded on the active implementation branch before merge. The owner verifies owner-reported personalized UI fixes on `likesized.com`.

A deployment authorization does **not** waive verification. If a later required gate fails, repair the underlying branch and continue automatically until the exact candidate passes. A failed/incomplete candidate may be deployed only if the owner is told the exact failed/skipped gates and then explicitly overrides them after that disclosure.

**Planning is not implementation authorization.** Discussion, screenshot review, brainstorming, agreeing on a future design, or placing an item on the to-do list does not authorize repository writes. The owner must explicitly authorize implementation of the identified batch before branch/source/test/doc changes begin. This workflow rule is also locked in `AI_REPOSITORY_RULES.md`.

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

## Canonical application/runtime source — MAIN THROUGH PR #110
Current canonical production application/runtime source on `main` remains PR #110 squash merge **`a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`**. Roadmap 12 remains complete/deployed. PR #106 repaired the earlier owner-reported Style Feed regressions and installed the runtime/safeguard separation gate; PR #108 consolidated person previews onto one canonical shared implementation; PR #110 then completed the owner-authorized Style Feed polish/performance batch. PR #110 exact-head CI and resulting `main` CI both passed, and production deployment **`dpl_NaisTCYEBDgYJX3n4kHaYCLjAFY8`** was verified READY for exact merge `a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`, targeted production, assigned `likesized.com` and reported no alias error at reconciliation time. Owner live QA after that release identified the four-item follow-up repair list recorded below. On 2026-08-27, after reviewing the repository rules, this master and that exact repair list, the owner explicitly authorized implementation by saying **“Continue.”** Implementation is now on the single active branch recorded below and remains unverified/unreleased until the required gates pass and production is separately authorized for the verified candidate.

PR #101 **Close Roadmap 12 Outfit evidence and canonical governance** release facts:
- exact final branch head before squash merge: **`9d37c2e99ed40d0588e516ff40aae08c8233c45d`**;
- exact-head LikeSized CI **#1037 / `33033095382`** completed successfully through canonical integrity, exact dependency install, typecheck, every committed application safeguard, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- owner authorized proceeding with this explicitly identified verified candidate by saying **“continue”** on 2026-08-26;
- squash merge: **`3e2a49eab0a6d60386aa9d66cab46e04c7aa1648`**;
- resulting `main` push LikeSized CI **#1038 / `33033315038`** also completed successfully through the same full verification chain;
- PR #101 introduced **no database migration**;
- Vercel release deployment **`dpl_DCSC1RY3uGpj8RHgUg3SeBHBqQHm`** was verified READY for exact merge `3e2a49eab0a6d60386aa9d66cab46e04c7aa1648`, targeted production, had `likesized.com` assigned and reported no alias error at verification time;
- live production fetch of `/outfits/6bab9c98-b056-4836-a581-5653c46a85b3` returned HTTP 200 and identified deployment `dpl_DCSC1RY3uGpj8RHgUg3SeBHBqQHm`;
- the checked deployment-scoped production error/fatal window contained no matching runtime logs.

PR #102 **Establish canonical Vercel release boundary** governance facts:
- exact final branch head before squash merge: **`45310f1de87fa50e3b38bfb878ca2f91ea551c3f`**;
- exact-head LikeSized CI **#1039 / `33033816436`** completed successfully through canonical integrity, exact dependency install, typecheck, every committed application safeguard including the new release-boundary test, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- squash merge: **`41323f047cb63efc0768f6a95d9aefd74d16d8ba`**;
- resulting `main` push LikeSized CI **#1040 / `33033937464`** completed successfully through the same full verification chain;
- PR #102 introduced **no Product behavior change and no database migration**;
- Vercel deployment **`dpl_6RJgXWTQLbzErVVKLxdtLPcPpDbg`** was verified READY for exact merge `41323f047cb63efc0768f6a95d9aefd74d16d8ba`, targeted production, assigned `likesized.com` and reported no alias error at verification time;
- the boundary installation correctly received a normal application build because `vercel.json` and the classifier itself are intentionally not skippable.

PR #103 **Settle canonical release state without redeploying** governance facts:
- exact final branch head: **`46a018e7f8e96e9dd3bea15803066a6554e91687`**;
- exact-head LikeSized CI **#1041 / `33034277656`** completed successfully through the full verification chain;
- merge: **`c405f96c840f1257eab0ca66bfbfaec051fa7083`**;
- resulting `main` push LikeSized CI **#1042 / `33034418710`** completed successfully through the same chain;
- PR #103 was deliberately non-runtime reconciliation with no Product change and no migration;
- Vercel record **`dpl_HDvXquuygTL5VRN6e55uc2Ur6Fnv`** was CANCELED/ignored by the installed release boundary, correctly leaving the prior READY application deployment in place rather than creating a bookkeeping redeploy.

PR #104 **Rebuild Roadmap 13 Style Feed** release facts:
- exact final branch head before merge: **`c07bad27368c7c8f853186252e6149f47e6b0d18`**;
- exact-head LikeSized CI **#1046 / `33036616784`** completed successfully through canonical integrity, exact dependency install, typecheck, every committed application safeguard, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- merge: **`e67b7928ea7ab6258070ad19ddec01740a5ccdff`**;
- resulting `main` push LikeSized CI **#1047 / `33036747890`** completed successfully through the same full verification chain;
- PR #104 introduced **no database migration**;
- Vercel release **`dpl_EmYv1S3MstYbV8Z66Z3oTWuLBadQ`** was verified READY for exact merge `e67b7928ea7ab6258070ad19ddec01740a5ccdff`, targeted production, assigned `likesized.com` and reported no alias error at verification time.

PR #105 **Repair Style Feed universal interactions** release facts:
- exact final branch head before merge: **`2ce6d347780d1cef6538b7d43b2beab82078f8b6`**;
- exact-head LikeSized CI **#1049 / `33038527194`** passed the full required verification chain;
- merge: **`307ebebd787121bd16a568d0fcf1c496da4e69b9`**;
- PR #105 introduced **no database migration**;
- Vercel production deployment **`dpl_GAN3kVp9YBMHpYo6eAhizVoD84cY`** was verified READY for exact merge `307ebebd787121bd16a568d0fcf1c496da4e69b9`, targeted production, assigned `likesized.com` and reported no alias error at verification time;
- PR #105 delivered the first Style Feed interaction repair, but its removal of the bottom **See All Following →** action was not an owner-approved Product decision. That regression was subsequently corrected by PR #106.

PR #106 **Repair Style Feed regressions and lock canonical safeguards** release facts:
- exact final branch head before squash merge: **`359723367b16df3f695e756096c9c6686094d8f7`**;
- exact-head LikeSized CI **#1063 / `33070271611`** completed successfully through canonical integrity, exact dependency install, typecheck, every committed application safeguard, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- squash merge: **`c4a13af3b0753928c445c78f024be8f8b1934b8e`**;
- resulting `main` push LikeSized CI **#1064 / `33070494560`** completed successfully through the same full verification chain;
- PR #106 introduced **no database migration**;
- Vercel production deployment **`dpl_6xcNWncP2StzjFpEdbjdxdE73nCG`** was verified READY for exact merge `c4a13af3b0753928c445c78f024be8f8b1934b8e`, targeted production, assigned `likesized.com` and reported no alias error at verification time;
- PR #106 restored the visible top **Fit Twins | All Following** control, removed unapproved **Want more inspiration?** copy, restored separate bottom **See All Following →** and **Find More Fit Twins →** actions, moved Style Feed Like to a local optimistic API path, repaired smooth shared Outfit-gallery gesture behavior, primed the canonical comments sheet, and installed the machine-enforced runtime/safeguard separation gate.

PR #108 **Finish canonical person quick-view consolidation** release facts:
- exact final branch head before squash merge: **`9fb72dba543a75c63ada1369ce69492736371904`**;
- exact-head LikeSized CI **#1068 / `33072141110`** completed successfully through canonical integrity, exact dependency install, typecheck, every committed application safeguard, production build, complete fresh migration replay and canonical database behavior/privacy tests;
- the owner explicitly authorized production for this exact verified candidate by saying **“ok proceed”** on 2026-08-27;
- squash merge: **`2d30ed30861ed7e0cd6d199123f37109262fe33e`**;
- resulting `main` push LikeSized CI **#1069 / `33072475137`** completed successfully through the same full verification chain;
- PR #108 introduced **no database migration**;
- Vercel production deployment **`dpl_CPRipAfxBQd3pemDDG2UCCH31ZK7`** was verified READY for exact merge `2d30ed30861ed7e0cd6d199123f37109262fe33e`, targeted production, assigned `likesized.com` and reported no alias error at verification time;
- PR #108 routes Outfit creator, inline/comment and global person-preview entry points through one actual `CanonicalPersonQuickViewCard`, eliminating the active duplicate person-preview implementation problem while preserving route-specific triggers and actions.

PR #107 **Collapse person previews to one canonical card** is **SUPERSEDED / CLOSED WITHOUT MERGE**. Its exact head **`36a370a0efc9fa249163671717dee75d53fc79b7`** contains no unique Product behavior that is not represented by released PR #108. It is non-authoritative history and must not be treated as an alternate current implementation.

PR #109 **Record verified PR108 release state** was the docs-only post-release reconciliation after PR #108:
- exact head **`f1dafdef65058135da18550b665e7fbfe2b0ebba`**;
- exact-head LikeSized CI **#1070 / `33073182977`** succeeded;
- merge **`0954d9e25f7264c2865953084359909cba0edba4`**;
- resulting `main` LikeSized CI **#1071 / `33073414907`** succeeded;
- it changed only the canonical master release bookkeeping and introduced no runtime Product behavior or database migration.

PR #111 and PR #112 were the required docs-only safeguard preauthorizations for the already owner-authorized PR #110 runtime branch:
- PR #111 exact head **`919b488e2e16a5b3a222ff498c0fe4b17e99ab2c`**, exact-head LikeSized CI **#1081 / `33084058737`** succeeded, merge **`68d95da58213223ffd4ce0e9fac78610ce1affb0`**;
- PR #112 exact head **`fccaaacd9e7838fb663c0f666b3cad4fcb12fe61`**, exact-head LikeSized CI **#1085 / `33088117718`** succeeded, merge **`114de2850209a9907f5374ed55ca26296a080bb8`**;
- together they authorized only the named existing Style Feed safeguards required by the runtime/safeguard separation gate; neither changed runtime Product behavior or added a database migration.

PR #110 **Finish Style Feed polish and interaction performance** release facts:
- exact final branch head before squash merge: **`85399208796b368b044359873a416c4e334a8a51`**;
- exact-head LikeSized CI **#1087 / `33089052645`** completed successfully;
- squash merge: **`a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`**;
- resulting `main` push LikeSized CI **#1088 / `33089339088`** completed successfully;
- PR #110 introduced **no database migration**;
- Vercel production deployment **`dpl_NaisTCYEBDgYJX3n4kHaYCLjAFY8`** was verified READY for exact merge `a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`, targeted production, assigned `likesized.com` and reported no alias error at verification time;
- PR #110 delivered the owner-authorized Style Feed polish/performance batch, including the mobile relationship control, distinct caught-up states, in-feed garment access, shared gallery interaction/performance work, person/comments warming, shared Report spacing, More/Show less, server-render performance work and isolated QA mode. Later owner live QA identified the follow-up defects recorded under **Current Style Feed owner-QA follow-up** below; those later observations do not rewrite PR #110's immutable release facts.

Those Vercel details are immutable release-verification facts, not a substitute for querying Vercel for present-day operational state later.

PR #94 and PR #95 remain immutable verification exceptions: neither had a successful completed full exact-candidate verification chain before production. Do not rewrite either as fully CI-verified. PR #96 restored the full exact-head/main verification discipline; PR #97 onward preserve it.

Production Supabase includes, after the earlier Roadmap 12 migrations:
- `20260825183000_private_profile_location_metadata.sql` → hosted **`20260825192738 private_profile_location_metadata`**;
- hosted **`20260826001512 username_change_cooldown`**;
- hosted **`20260826001531 exact_variation_evidence_watches`**;
- `20260826003000_atomic_outfit_cover_switch.sql` → hosted **`20260826020651 atomic_outfit_cover_switch`**;
- hosted **`20260826020710 preserve_tracked_variation_recommendation_evidence`**;
- `20260826190000_outfit_tag_consistency.sql` → hosted **`20260826193527 outfit_tag_consistency`**.

PR #94, PR #95, PR #97, PR #98, PR #99, PR #100, PR #101, PR #102, PR #103, PR #104, PR #105, PR #106, PR #108 and PR #110 introduced no new production database migration. PR #96 introduced the Outfit tag-consistency migration above.

## Current primary line — ACTIVE OWNER-AUTHORIZED STYLE FEED QA REPAIR
Active branch: **`repair/style-feed-shared-qa`**

The owner explicitly authorized the exact four-item Style Feed/shared-system QA repair batch on 2026-08-27 by saying **“Continue”** after reviewing the repository rules, master plan and frozen repair list. `repair/style-feed-shared-qa` is the sole active Product/runtime implementation line. Source implementation for the four repairs is present on this branch but is **not yet verified, merged or released**. No adjacent Product work is authorized on this line.

Frozen writable scope:
1. Style Feed **View Garments** must invoke the existing canonical Outfit tagged-garment/FITuition quick-view system rather than direct Garment Detail navigation or a second Style Feed implementation.
2. Universal person quick-view **Notify** must toggle immediately in place, persist in the background and leave the mini-profile open in both directions.
3. Shared Outfit/Style Feed gallery in-card media must display the proper uncropped display representation rather than the cropped feed derivative.
4. Shared gallery **Caption** control/panel must remain attached to the visible active image.

Explicitly out of scope: Roadmap 13A canonical Product image scoring, Garment/Product Detail overhaul, My Closet/Fit Report lifecycle, Member/Public Profile audit and unrelated cleanup/refactors/copy changes.

## Roadmap 12 — New Outfit / Style an Outfit — COMPLETE / DEPLOYED
The three final source defects were implemented in released PR #101 and regression-protected:
1. another wearer's best exact report is labeled **Best Available Matching Fit Report**, followed by **[NN]% Body Match**, Size and Fit Result;
2. the viewer's own surfaced exact report is labeled only **Your Fit Report**, with Size and Fit Result; **“Your own exact report”** is retired;
3. strong Outfit FITuition aggregation uses the same eligible exact evidence units counted by `Relevant Fit Reports: X`, including the viewer's own eligible exact report; same person + Product + tracked variation counts once; distinct qualifying wearers count independently; related/similar variations remain excluded.

Source, regression, exact-head CI, post-merge CI, production deployment health and a live public Outfit route were verified. The owner confirmed the current dataset does not yet contain enough distinct logged garments/users to naturally render all three multi-user personalized scenarios. That unavailable-data condition is **not a Roadmap 12 completion blocker**. The three scenarios remain regression-protected and are deferred for future live-data QA once enough real/seeded evidence exists.

Roadmap 12 / Style an Outfit is therefore **COMPLETE / DEPLOYED** and must not be reopened merely because the current dataset cannot produce a future QA scenario.

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
- **People My Size defaults to Twin-level qualifying people only.** A qualifying person who is not followed yet is discovery evidence/a Twin-level Match, not a claim that the follow relationship already exists. **All Matches** is the alternate view.
- **Style Feed defaults to followed Fit Twins** and may switch at the top to **All Following**. The feed itself shows the Twin badge but no Body Match/Overall Match percentage.
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

FITuition combines Size Match evidence with the viewer's relevant Closet History. Exact Product/variation evidence is strongest; related variation is reduced fallback/support. Confidence is separate from recommendation score. **Would Buy Again is not a Fit Report question and is not FITuition evidence.**

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

## Outfit interaction — ROADMAP 12 LOCKED BEHAVIOR
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
- Where multiple legitimate entries share one base Product but differ by tracked fit variation, the Outfit garment-picker **list stays compact and does not display the tracked-variation answer dump**. Clicking a picker entry opens the garment quick view, and that clicked quick view exposes the answered variation-defining structured attributes needed to distinguish legitimate entries. Same Product does not imply duplicate entry.
- The first clicked tagged-garment quick view keeps direct **View Garment Detail →** navigation at its bottom in every FITuition state. FITuition Details opens the in-Outfit evidence-only intermediate layer before any optional full-page navigation.
- **`+ Add a new garment` opens the embedded Fit Report intake in a fixed/current-viewport modal.** It must never render at the bottom of the Outfit composer merely because the dialog node is after the composer in the DOM.
- Existing Outfit save keeps photo-hotspot relationships subordinate to the current Outfit selected-garment set; stale orphan relationships are healed rather than exposed as an internal consistency error.
- Edit/New Outfit unsaved internal navigation uses Save Changes/Save Draft · Leave Without Saving · Keep Editing in a fixed/current-viewport dialog.
- Tagged garment actions are **LikeLocker · Wishlist · Shop · Share · Report** with no garment-action counts.
- LikeLocker/Wishlist update locally/in place and independently.
- Report reason starts unselected; Other is deliberate, never silently defaulted.
- Outfit-content actions are **LikeLocker · Share · Report**. Follow/Notify belong to creator/profile context.
- Creator quick view hierarchy is **Overall Match** on its own row, **Tops Match | Bottoms Match**, then **Total Garments | Total Outfits**. Do not render these stats as a boxed table/grid with cell borders.
- Total Garments means distinct garment evidence/items, not a relabeled raw Fit Report count.
- Creator quick view may also show View Full Profile, Follow and notification state without exposing raw measurements.
- **Compact public identity on affected Outfit/comment/social rows is Display Name + `@username` on one line.** Do not hide the unique username and do not fall back to display-name-only identity; truncate gracefully on narrow screens when necessary.
- Comments default to **Top** and may switch to **Newest**. Top = Like count descending, newest tie-break. Newest = newest first.
- Comment submit, Like/unlike and sort switching use the API/local interaction path rather than whole-Outfit navigation for every action.
- Owner management controls—Edit, comments on/off, delete, Views, Follows generated—remain separate from viewer content actions.
- New Outfit photo tagging opens on the current **Cover/Main photo**.
- New Outfit back navigation returns to **My Closet → Outfits**.

# OWNER-LOCKED STYLE FEED — ROADMAP 13 REGRESSION REPAIR
PR #110 remains the current production Style Feed application line, built on the earlier PR #106 regression repair and PR #108 person-preview consolidation. Owner live QA after PR #110 identified the four-item follow-up repair list recorded later in this master, and the owner explicitly authorized that exact batch on 2026-08-27. The active implementation branch is `repair/style-feed-shared-qa`; it is not production truth until verified, merged and released.

Locked behavior:
1. Style Feed is a passive social Outfit inspiration feed, not a mixed activity log.
2. Source is **published Outfits from people the viewer already follows only**.
3. Default relationship filter is **Fit Twins**; **All Following** is the alternate view and appears beside it at the top as the first feed control.
4. Fit Twins includes Fit Twin, Tops Twin and Bottoms Twin.
5. **No Body Match / Overall Match percentage appears on Style Feed cards.** The Twin badge is enough relationship context.
6. Ordering is **newest published Outfit first** inside the active filters. Do not invent hidden Match ranking.
7. Additional filters are **Occasion** and **Style Tags**.
8. **Style Tags are searchable** in the filter control.
9. Occasion + Style Tags stay compact on constrained/mobile screens. They must not consume a large card-sized block before feed content, and the retired giant standalone **Apply** button is not part of the current interaction.
10. The default Fit Twins view never silently broadens to All Following.
11. When the Fit Twins feed is exhausted, the footer keeps two separate actions: **See All Following →** switches the feed to All Following, and **Find More Fit Twins →** routes to People My Size. Find More Fit Twins never replaces the switch-to-All action.
12. Each feed Outfit reuses the canonical Outfit gallery behavior: all photos are swipeable in-card; tapping the photo opens the full-screen gallery; full-screen supports the same multi-photo navigation/dismissal. Photo taps do **not** open an Outfit metadata quick view and do **not** navigate to full details.
13. **Comments** opens the canonical comments sheet over the feed, allowing read/add/reply-style comment interaction without requiring full-Outfit navigation.
14. Creator avatar, Display Name and `@username` use the **one universal Person quick-view behavior** already shared by LikeSized. Do not create Style Feed-specific profile cards or separate page-by-page profile/garment preview systems.
15. Style Feed cards do **not** carry a redundant **View Full Outfit →** CTA. Garment exploration stays in the Style Feed context through **View Garments**; the full Outfit route remains a separate destination when reached intentionally elsewhere.
16. **People My Size is a separate page from Explore and defaults to Twin-level matches only.** It offers All Matches as the alternate view.
17. Explore/Search remain separate intentional discovery surfaces and are not part of this Style Feed flow.
18. Public identity is compact **Display Name + `@username` on one line**; display-name-only presentation is not accepted because the username is the unique identity cue.

# CANONICAL FEATURE CONTRACTS — OWNER LOCKED
## Style Feed relationship/footer contract — OWNER LOCKED 2026-08-27
- Style Feed defaults to **Fit Twins** and keeps **All Following** as the alternate relationship view at the top.
- Fit Twins never silently broadens to All Following.
- At the end of the Fit Twins feed, **See All Following →** switches the current feed to All Following.
- At the end of the Fit Twins feed, **Find More Fit Twins →** routes to **People My Size** to discover more qualifying people.
- **See All Following →** and **Find More Fit Twins →** are separate actions with separate purposes. Find More Fit Twins must never replace the All Following switch.
# END CANONICAL FEATURE CONTRACTS

Homepage third feature-card direction remains locked:
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
2. Global header / member menu / admin entry — current interaction repairs are live; broader audit may continue afterward.
3. Auth — owner-confirmed baseline.
4. **Fit Profile / My Measurements — OWNER-COMPLETE.** Required private City/State is collected only on first-time setup and edited in Settings; it does not reopen My Measurements.
5. Profile Settings — Fit Community and required private City/State editors are production-live.
5A. **Member / Public Profile page — PLANNED AUDIT.** Audit the full member-facing profile reached from Outfit/person identity, including the member viewing their own profile. Settle one canonical boundary between the member-facing profile and Profile Settings so LikeSized does not maintain two competing profile “homes” or duplicate editors. No move or redesign is authorized yet; details are recorded below.
6. Notifications — audit remains.
7. **Unified My Closet / member-profile Closet — lifecycle work deferred to this audit.** Canonical visibility meaning is reconciled; the broader garment/report lifecycle controls approved below belong here when My Closet is audited rather than in the current Style Feed repair or Garment Detail work.
8. **Post-submit Fit Report / Closet garment lifecycle — OWNER-APPROVED PLAN / NOT IMPLEMENTED.** Use the three non-destructive member choices **Edit your report →**, **Log how it fits now →**, and **Update garment quality →**, with **Delete This Garment** as the separate destructive action. Detailed behavior is recorded below and is deferred until the My Closet audit.
9. **People My Size — Twin-level default is DEPLOYED; broader page audit remains later.**
10. **Style Feed relationship semantics — deployed through PR #110; exact four-item owner-QA repair is ACTIVE on `repair/style-feed-shared-qa` and remains unverified/unreleased.**
11. New Fit Report — evidence-first flow live; visible photo validation is live.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit / Style an Outfit — COMPLETE / DEPLOYED.** Future multi-user live-data QA is deferred until enough evidence exists and does not block completion.
13. **Style Feed full behavior — DEPLOYED through PR #110; exact four-item shared-system QA repair is OWNER-AUTHORIZED / IMPLEMENTED ON BRANCH / PENDING VERIFICATION.**
13A. **Automatic Canonical Product Image Scoring — OWNER LOCKED / PLANNED; implement before Garment/Product detail, Explore, Search and Wish Locker audit so those surfaces consume one canonical image-selection system.**
14. Garment/Product detail — Exact Variation consumes the canonical 11A map and Roadmap 13A canonical-image hierarchy when reached. The full Garment Detail page is intentionally not being overhauled during the current Style Feed QA follow-up.
15. Explore — consume Roadmap 13A canonical imagery rather than inventing its own image selection.
16. Search + `/browse` compatibility — consume Roadmap 13A canonical imagery.
17. LikeLocker / Wish Locker — consume canonical Product imagery where the surface represents the Product generally; preserve report-specific imagery where the surface represents a member's actual Fit Report/worn item.
18. Full Admin Catalog + Moderation — include Roadmap 13A Product-image set/lock/unlock controls and eligibility/moderation visibility.
19. Final mobile/desktop/nav/privacy/copy/security/performance/spam/canonical-drift regression.

# PLANNED MEMBER / PUBLIC PROFILE AUDIT — OWNER-REQUESTED / NOT IMPLEMENTED
The current product exposes both Profile Settings/editing and a full member-facing profile reached from Outfit/person identity. The owner wants this audited intentionally rather than accepting two apparent profile homes by accident.

When this roadmap item is reached:
- audit what another member sees on the full profile and what the owner/member sees when viewing their own profile;
- audit every current profile field/stat/content section and its public/private boundary; private Fit Profile measurements and private City/State remain private;
- decide the canonical division between **Profile Settings** and the member-facing profile instead of maintaining duplicate profile editors or competing “home” pages;
- decide whether the member's own full profile should expose the primary **Edit Profile** entry and where that entry routes;
- keep account/privacy/preferences/settings concerns intentionally separated from public/member-facing identity and content;
- audit self-view versus other-member view, navigation into the profile from Outfit/person surfaces, and the profile's Garments/Outfits/Closet presentation;
- do not move existing settings or invent a second editor before this audit is explicitly authorized.

# PLANNED MY CLOSET GARMENT / FIT REPORT LIFECYCLE — OWNER-APPROVED / NOT IMPLEMENTED
This work belongs with the future **My Closet** audit. It is not part of the current Style Feed repair and should not be opportunistically implemented while Garment Detail or another surface is nearby.

The member-facing garment management choices are:

1. **Made an error?**  
   **Edit your report →**  
   Fix something you entered incorrectly. Your original body snapshot stays unchanged.

2. **Measurements changed?**  
   **Log how it fits now →**  
   Add a new fit update using your current measurements while keeping your previous report in your history.

3. **How has it held up?**  
   **Update garment quality →**  
   Tell us about shrinking, stretching, fading, wear, durability, and how the garment has changed over time.

A visually separate **Delete This Garment** action follows those three choices.

## Edit your report — correction, not time travel
- This is the one correction entry point. Do not add a separate competing “wrong garment type” button on the Closet card.
- Open the report the member originally filled out, but keep Product-identity fields such as Brand, Item Name and Garment Type locked by default.
- Normal correction fields may include the member-entered size, the structured garment questions for that Garment Type, Fit Result, notes and Fit Photos.
- The historical body snapshot and original report/observation timestamp remain locked and must never be rewritten to current measurements.
- If the member believes a locked Product-identity field is wrong, an identity-error control inside Edit Report may let them enter the proposed correct identity/type and submit it for admin investigation. The current Product identity does **not** change until admin review approves/reconciles it.
- Keep a correction timestamp and auditable old-value → new-value history. A materially late correction must flag admin for review rather than silently rewriting old evidence; the owner's example was a correction roughly six months later. The exact flag threshold remains an implementation-time calibration decision unless the owner locks a precise threshold later.
- Extensive or suspicious corrections may also flag admin; a flag is review, not an automatic rejection of a legitimate correction.

## Log how it fits now — new body-state observation
- This is for the same physical garment when the member's measurements/body have changed; it must not look like editing the old historical observation.
- Use the member's **current** Fit Profile snapshot for the new observation and keep the prior report/history intact.
- Prefill stable garment/report information so the member does not have to re-enter the garment from the beginning.
- Do not interrogate the member about why measurements changed. Accept the update, then compare current versus prior measurements on the backend.
- Backend logic decides whether the measurement change is meaningful enough to become another weighted evidence unit. No change or an immaterial change must not manufacture duplicate FITuition/community evidence merely because the member clicked the update action.
- Exact persistence/weight treatment for an immaterial update is to be finalized during implementation without changing the member-facing distinction above.

## Update garment quality — garment aging/condition history
This is separate from the Fit Report/body-fit observation. It may collect garment-aging information such as:
- did it shrink;
- did it stretch out;
- approximately how many times has it been worn;
- did it fade;
- durability/quality changes or other wear notes;
- **Would you buy it again?**

**Would Buy Again belongs only in this garment-quality context if used. It is not a Fit Report question and must not feed FITuition.** Any legacy current Fit Report/UI use of `would_buy_again` is non-canonical lifecycle debt to remove/re-scope when this My Closet work is implemented; do not resurrect it as a normal Fit Report field.

Garment-quality state must stay distinguishable from normal new-garment fit evidence. A garment known to have shrunk, stretched or otherwise materially changed must not silently teach FITuition that a brand-new copy normally fits that altered way.

## Delete This Garment — destructive action
- **Delete This Garment** is the destructive action itself; it does not need the three helper-text treatment used by the non-destructive choices.
- Clicking it opens a warning that clearly explains the permanent effects before deletion.
- The warning should tell the member that if the problem is an error, they may not need to delete the garment and can use **Edit Report** instead.
- **Edit Report** inside the delete warning is an actual clickable button/action that exits the destructive path and opens the report editor.
- The warning also reminds the member that Fit Photos can be changed or removed without deleting the entire garment.
- Require the member to type **DELETE** exactly before the destructive delete action becomes available.
- Deleting the garment removes that Closet item, its Fit Reports and Fit Photos from active member/community evidence and removes that garment's Outfit garment links/photo hotspots. The Outfit post itself remains. Canonical Product/catalog records remain.
- Do not use Delete as the normal correction mechanism.

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

Applied migrations are immutable. PR #94, PR #95, PR #97, PR #98, PR #99, PR #100, PR #101, PR #102, PR #103, PR #104, PR #105, PR #106, PR #108 and PR #110 added no migration. PR #96 added the Outfit tag-consistency migration and it is production-applied at the hosted timestamp above.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- **Active Product/runtime implementation branch:** `repair/style-feed-shared-qa`. It is based on canonical `main` and contains only the owner-authorized four-item Style Feed/shared-system repair batch. Source implementation is present but is not verified, merged or released yet.
- **Current Style Feed owner-QA follow-up is OWNER-AUTHORIZED / IMPLEMENTED ON BRANCH / PENDING VERIFICATION:** (1) **View Garments** reuses the one canonical Outfit tagged-garment/FITuition quick-view host instead of direct Garment Detail navigation; (2) universal person quick-view **Notify** now uses an optimistic local state with authenticated background persistence and no redirect; (3) the shared Outfit/Style Feed gallery uses the uncropped display representation in-card rather than the cropped feed derivative; (4) the shared **Caption** control/panel is anchored inside the visible active-image frame. These claims describe branch implementation only until exact-candidate CI and owner live verification succeed.
- The full Garment/Product Detail overhaul remains Roadmap 14 after Roadmap 13A; do not fold unrelated Garment Detail cleanup into the Style Feed follow-up.
- The approved My Closet garment/Fit Report lifecycle is recorded above and deferred until the My Closet audit. Do not implement it opportunistically in Style Feed or Garment Detail.
- The Member/Public Profile page now has an explicit planned audit. Until that audit is authorized, do not create another profile editor or move current Settings fields merely because the two surfaces feel redundant.
- PR #107 is **SUPERSEDED / CLOSED WITHOUT MERGE** by PR #108 and has no unique current Product authority. Its remote branch is historical cleanup debt only; do not use it as a source line.
- After the runtime/safeguard bootstrap reached canonical `main`, runtime Product PRs may not modify governance or the stable feature-contract section, and test/Product-Spec changes require a pre-existing **Pending owner-approved safeguard change** block on canonical `main` naming the exact implementation branch and protected files.
- **Explore is separate and is not part of the Style Feed → Find More Fit Twins flow.** Find More Fit Twins routes to People My Size.
- Keep PR #101's three Outfit closeout behaviors regression-protected. Future live-data QA of those states waits for enough real/seeded users/garments and does not reopen Roadmap 12 by itself.
- Keep all canonical integrity, TypeScript, application safeguard, build, fresh migration replay and pgTAP/database behavior/privacy gates active. Do not treat PR #94/#95 verification exceptions as precedent.
- The canonical Vercel non-runtime release boundary is installed and machine-protected. Operational skip/build behavior is checked against Vercel when needed rather than stale-cached as a permanent repository status.
- Roadmap 13A Automatic Canonical Product Image Scoring is owner-locked and planned; do not implement it opportunistically before its roadmap turn unless the owner explicitly changes the order.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- **Repository-governance external setting remains unresolved:** GitHub currently has no repository ruleset and `main` is not protected by required status checks. Written rules require server-side protection: require pull requests and `LikeSized CI / verify`, block force pushes/deletion, and enable merged-head cleanup where supported. The available connector can read but not configure that setting.
- Historical remote repair branches remain non-authoritative. After salvage verification, merged/stale heads should be deleted rather than left as competing active-looking work lines.

# CANONICAL RECOVERY — COMPLETE
The 2026-08-21 canonical recovery is complete. No recovery freeze is active. Historical repair branches and superseded files have no current authority; Git history preserves them for provenance while current canonical files and `main` define present product truth. Do not resurrect an old branch/file as a competing source merely because it still exists in Git history.

# RECENT CANONICAL LINEAGE
Recent released application/source lineage:
- PR #80 — stopping-point Roadmap 12 repair — DEPLOYED.
- PR #81 — tagged-item live regression repair — merge `1743b0638ac80a5465dba8fb52cab831f6f35148`.
- PR #82 — visible Style Feed rename/copy slice — full Roadmap 13 behavior intentionally not implemented.
- PR #83 — Roadmap 12 follow-up — merge `ccbe87d8391e56d106c58353eaceae1be6aaaa4f`.
- PR #84 — Outfit polish/captions — merge `332ff38cf214c09125cb8e02b39246a6b0e3e8d9`.
- PR #85 — Outfit interaction/Fit Report photo batch — merge `95cd89724ab01d85ab2ea3732af4c4f552d700b8`.
- PR #86 — Roadmap 12 interaction consistency — merge `6dccf40032d12fd68c5fc5ee85ad4a4e75a8db19`.
- PR #87 — Fit Report/Outfit live interaction regression repair — merge `96905b411dcef2b2a7b0cd55ef379986eff402db`.
- PR #88 — Roadmap 12 visual/profile completion + Roadmap 13A recording — merge `2d4bb3a193cc61d409f2c2221af17ffe5f4baa0c`.
- PR #89 — Settings/comments/global entity quick views — merge `f8378343bd5a9882daed6fd35b8fe4a8eb72bbda`.
- PR #90 — canonical LikeSized UI system — merge `ed4daa7d776517c6aa096facb4fe266d6e120100`.
- PR #91 — Outfit flow/FITuition repair — merge `7b86358353327d345c2a3e70f92eeea7abc80b2d`.
- PR #92 — Outfit Explore/FITuition production repair — merge `bd3e35bd30ae285e847089e4e355e3fd8f90997d`.
- PR #93 — Outfit tag navigation/FITuition notification state — merge `2568e316fdfb772094cbb23b6e4c19b9a9e1e449`.
- PR #94 — Outfit live-audit regression repair — merge **`15b48373857cd090e418bff942123fe57f013984`**; full-CI limitation remains recorded historically.
- PR #95 — Outfit owner-audit continuation — merge **`5c52fb29cb6bb54d21015e5c87b9f1e775f0bc81`**; failed exact-head/main CI limitation remains recorded historically.
- PR #96 — Outfit owner-audit closure — merge **`87ffbdcb3ed9d1849d1dc1e28d58c9ec18586ea7`**; exact-head CI #994 and main CI #995 green; migration hosted **`20260826193527 outfit_tag_consistency`**.
- PR #97 — tagged Outfit FITuition flow — merge **`6cb6902a3bc297cd36f45fc77de1af115058d996`**; exact-head CI #1005 and main CI #1007 green; no migration.
- PR #98 — Outfit garment detail link + compact picker — merge **`5bac3eaace74b0194782faf8a6b2bc60c71996cb`**; exact-head CI #1016 and main CI #1017 green; no migration.
- PR #99 — own Relevant Fit Report + embedded Add a Garment viewport repair — merge **`54f77889c56bea6b2e76aa4e0200add757e6a606`**; exact-head CI #1020 and main CI #1021 green; no migration.
- PR #100 — approved Outfit FITuition UI + scope safeguards — merge **`29d1167628d4ee634729b5efee4b9e2725b8b261`**; exact-head CI #1034 / `33030833182` and main push CI `33030989868` green; no migration.
- PR #101 — Roadmap 12 Outfit evidence + canonical governance — exact branch **`9d37c2e99ed40d0588e516ff40aae08c8233c45d`**, merge **`3e2a49eab0a6d60386aa9d66cab46e04c7aa1648`**, exact-head CI **#1037 / `33033095382`** green, main push CI **#1038 / `33033315038`** green, no migration; Vercel release `dpl_DCSC1RY3uGpj8RHgUg3SeBHBqQHm` was verified READY and the checked live Outfit route returned HTTP 200 from that deployment.
- PR #102 — canonical Vercel release boundary — exact branch **`45310f1de87fa50e3b38bfb878ca2f91ea551c3f`**, merge **`41323f047cb63efc0768f6a95d9aefd74d16d8ba`**, exact-head CI **#1039 / `33033816436`** green, main push CI **#1040 / `33033937464`** green, no Product change and no migration; Vercel release `dpl_6RJgXWTQLbzErVVKLxdtLPcPpDbg` was verified READY for the boundary installation.
- PR #103 — canonical release reconciliation — exact branch **`46a018e7f8e96e9dd3bea15803066a6554e91687`**, merge **`c405f96c840f1257eab0ca66bfbfaec051fa7083`**, exact-head CI **#1041 / `33034277656`** green, main push CI **#1042 / `33034418710`** green; Vercel correctly ignored the non-runtime reconciliation.
- PR #104 — Roadmap 13 Style Feed rework — exact branch **`c07bad27368c7c8f853186252e6149f47e6b0d18`**, merge **`e67b7928ea7ab6258070ad19ddec01740a5ccdff`**, exact-head CI **#1046 / `33036616784`** green, main push CI **#1047 / `33036747890`** green, no migration; Vercel release **`dpl_EmYv1S3MstYbV8Z66Z3oTWuLBadQ`** was verified READY on `likesized.com`.
- PR #105 — Style Feed universal interaction repair — exact branch **`2ce6d347780d1cef6538b7d43b2beab82078f8b6`**, merge **`307ebebd787121bd16a568d0fcf1c496da4e69b9`**, exact-head CI **#1049 / `33038527194`** green, no migration; Vercel release **`dpl_GAN3kVp9YBMHpYo6eAhizVoD84cY`** was verified READY on `likesized.com`. Its owner-rejected bottom See All Following removal was subsequently corrected by PR #106.
- PR #106 — Style Feed regression + safeguard-separation repair — exact branch **`359723367b16df3f695e756096c9c6686094d8f7`**, merge **`c4a13af3b0753928c445c78f024be8f8b1934b8e`**, exact-head CI **#1063 / `33070271611`** green, main push CI **#1064 / `33070494560`** green, no migration; Vercel release **`dpl_6xcNWncP2StzjFpEdbjdxdE73nCG`** was verified READY on `likesized.com`.
- PR #107 — person-preview consolidation attempt — **SUPERSEDED / CLOSED WITHOUT MERGE**, exact head **`36a370a0efc9fa249163671717dee75d53fc79b7`**; no unique current Product authority remains outside released PR #108.
- PR #108 — canonical person quick-view consolidation — exact branch **`9fb72dba543a75c63ada1369ce69492736371904`**, merge **`2d30ed30861ed7e0cd6d199123f37109262fe33e`**, exact-head CI **#1068 / `33072141110`** green, main push CI **#1069 / `33072475137`** green, no migration; owner authorized production by saying **“ok proceed”**; Vercel release **`dpl_CPRipAfxBQd3pemDDG2UCCH31ZK7`** was verified READY on `likesized.com` with no alias error.
- PR #109 — PR #108 release reconciliation — exact branch **`f1dafdef65058135da18550b665e7fbfe2b0ebba`**, merge **`0954d9e25f7264c2865953084359909cba0edba4`**, exact-head CI **#1070 / `33073182977`** green and main CI **#1071 / `33073414907`** green; docs-only, no Product behavior and no migration.
- PR #111 — Style Feed safeguard preauthorization — exact branch **`919b488e2e16a5b3a222ff498c0fe4b17e99ab2c`**, merge **`68d95da58213223ffd4ce0e9fac78610ce1affb0`**, exact-head CI **#1081 / `33084058737`** green; docs-only authorization for the named safeguard files, no Product behavior and no migration.
- PR #112 — remaining Style Feed safeguard preauthorization — exact branch **`fccaaacd9e7838fb663c0f666b3cad4fcb12fe61`**, merge **`114de2850209a9907f5374ed55ca26296a080bb8`**, exact-head CI **#1085 / `33088117718`** green; docs-only authorization for the additional named safeguard files, no Product behavior and no migration.
- PR #110 — Style Feed polish/performance repair — exact branch **`85399208796b368b044359873a416c4e334a8a51`**, merge **`a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`**, exact-head CI **#1087 / `33089052645`** green, main push CI **#1088 / `33089339088`** green, no migration; Vercel release **`dpl_NaisTCYEBDgYJX3n4kHaYCLjAFY8`** was verified READY on `likesized.com` with no alias error.

# EXACT NEXT ACTION — CURRENT
1. `repair/style-feed-shared-qa` is the sole active Product/runtime implementation branch. Source implementation is present for only the exact four owner-authorized Style Feed/shared-system repairs and must remain scope-frozen.
2. Open the Product PR against canonical `main` and run the full required exact-candidate LikeSized CI chain: canonical integrity, exact dependency install, TypeScript, every committed application safeguard, production build, fresh migration replay and database behavior/privacy tests.
3. Repair only in-scope failures until the exact candidate is green. Do **not** change governance, stable feature contracts, pre-existing tests or `docs/V1_PRODUCT_SPEC.md` inside this runtime PR without a valid pre-existing canonical authorization.
4. Do **not** merge/deploy merely because source is implemented. After the exact candidate is green, production still requires explicit owner authorization for that verified candidate. Roadmap 13A, Garment Detail, My Closet lifecycle and Member/Public Profile remain future separate batches.
5. Repository governance remains separately incomplete at the GitHub settings layer: `main` protection/ruleset and stale merged/retry branch cleanup still require supported server-side actions before they can be called complete.

## Style Feed polish release closure — PR #110 / 2026-08-27
- PR #110 completed the owner-authorized Style Feed polish/performance batch on exact branch head **`85399208796b368b044359873a416c4e334a8a51`**.
- Exact-head CI **#1087 / `33089052645`** and resulting main CI **#1088 / `33089339088`** passed.
- Canonical production application/runtime remains `main` through **`a4db9989fec96ad15b8f895f0ddf851bdd5aaf95`** until the active follow-up branch is separately verified, authorized, merged and released; production deployment **`dpl_NaisTCYEBDgYJX3n4kHaYCLjAFY8`** was verified READY on `likesized.com` with no alias error at verification time.

## Current Style Feed owner-QA follow-up — OWNER-AUTHORIZED / IMPLEMENTED ON BRANCH / PENDING VERIFICATION
1. **View Garments → canonical garment quick view.** Style Feed **View Garments** must not bypass the shared FITuition flow by sending a selected garment row straight to Garment Detail. It must invoke the same one canonical tagged-garment/FITuition quick-view implementation/data flow used by Outfit, including Relevant Fit Reports/FITuition states and the **View Garment Detail →** link inside that flow. Do not copy the Outfit implementation into a Style Feed-specific second system.
2. **Universal person quick-view Notify stays open.** The shared person mini-profile **Notify** action must update notification state locally/in place and persist it without full-page navigation; toggling off must behave the same way. Repair the shared implementation, not a Style Feed-only copy.
3. **Shared gallery photo framing.** The shared Outfit/Style Feed gallery must not present a cropped feed derivative as if it were the full in-card display photo. The shared media contract must show the appropriate uncropped display representation in-card rather than treating the crop derivative as the full display photo.
4. **Caption control stays with the visible photo.** The shared gallery Caption control/panel must remain attached to and usable on the visible active image across Outfit and Style Feed contexts rather than being positioned against the overall stage/bottom edge.

Branch implementation currently maps those four requirements to the canonical shared systems only. Nothing in this status marks the branch verified, merged, deployed or owner-live-QA complete. Full Garment Detail cleanup, My Closet lifecycle work, Roadmap 13A and Member/Public Profile audit remain separate future roadmap work.