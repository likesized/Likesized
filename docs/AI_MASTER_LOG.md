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

## Deployment-batch discipline — OWNER LOCKED 2026-08-23
Once the owner says **push**, **deploy**, or otherwise authorizes a specific accumulated change list for production, that deployment batch is frozen. Later requests start the next batch and require separate authorization.

## Live owner-testing workflow — OWNER LOCKED 2026-08-24
`likesized.com` is the owner's current verification environment. After explicit deployment authorization, finish exact-head verification, merge the frozen branch to `main`, wait for Vercel production to reach READY, verify live runtime state, reconcile canonical docs, and return the deployed site for owner browser testing.

## Live repair fast path — OWNER DIRECTED 2026-08-24
During an owner live audit, when the owner identifies concrete breakage and directs it fixed, that instruction authorizes implementation on the one active repair branch. Do not stop for repeated re-audits, duplicate approval questions or status-only handoffs. Implement canonical source, add focused coverage, run required verification and continue through the authorized deployment boundary. Production/main still requires explicit owner authorization unless already granted for the current frozen batch.

## Rapid live-review logging correction — OWNER DIRECTED 2026-08-24
During rapid-fire live review, keep the issue queue in the active conversation instead of rewriting this file after every owner message. When the review pass ends or the owner directs the batch fixed, reconcile the complete corrected queue into this one canonical master update. Do not create a second notes file. This prevents slow per-message GitHub writes and reduces stale/misread issue drift.

## Small-fix / stopping-point verification workflow — OWNER LOCKED 2026-08-24
The owner must review fixes on the actual production site and wants implementation changes kept small enough to reduce assistant error risk. The working loop is therefore:

**small fix → targeted relevant check → owner-authorized production deploy → owner inspects live → next small fix**.

Do not solve latency by accumulating a large unreviewable repair batch, and do not force the entire exhaustive CI/database replay after every microscopic visual correction when a focused relevant check can safely validate it first.

At deliberate **stopping points**, stop implementation and perform a cold repository checkpoint audit: compare the prior known production baseline with the candidate state, account for every changed file/line, compare behavior to canonical product rules, run the full canonical CI/build/fresh migration replay/database suite, then verify the deployed production state. During the audit itself, report findings before repairing them. Once the owner accepts a clean production checkpoint, record that exact production SHA as the next known-good baseline.

## Future app transition — OWNER LOCKED 2026-08-24
LikeSized remains web-first while V1 is completed and owner-audited, with intended app transition after the web product is mature enough.

Going forward:
- keep product/business rules, Match logic, validation, permissions and canonical data behavior reusable outside UI-specific code when practical;
- prefer stable service/data boundaries and typed contracts shared by web and a future app;
- keep Supabase auth/data/storage/media/server-validation behavior reusable;
- isolate browser-only DOM/file/history/local-state concerns;
- treat mobile camera, touch and constrained devices as first-class now;
- never create separate web-vs-app product truth;
- do not prematurely choose a native framework or rewrite working V1 solely for hypothetical portability;
- when choices are otherwise equivalent, prefer the one reusable by a future app.

# CURRENT STATUS — 2026-08-24

## Canonical production line — LIVE THROUGH PR #80
- PR #77 prior Roadmap 12 repair batch: exact head **`2a6ada938db7772bf27819593d97f5d3556e4312`**; full LikeSized CI #853 (`32791915054`) passed; three additive migrations applied/smoke-verified; squash merge **`41c92a5c94a8d03d59b627f8f5b55e37bdcf482f`**; Vercel **`dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`** READY and production-live.
- PR #78 post-PR77 canonical reconciliation: exact head **`b088784773c192a09cb42d00ce10d7ac2c1c2b93`**; full CI #855 (`32792808295`) passed; squash merge **`3618632c75f502469d9f7d49254d3edd85211aa1`**; docs-only Vercel **`dpl_DCh7D9gSFKjmCY1rJGwvwhF5HnRJ`** READY; no application/database behavior change.
- PR #79 **Complete Roadmap 12 live-audit follow-up**: exact head **`ec4bebec4f2743cb8461a724d50e2cb7c1b1529e`**; full LikeSized CI #869 (`32799021871`) passed; squash merge **`8835a413680daef0b78ec890ffa50c84424bdc37`**; Vercel **`dpl_3aSPoi4UwKgZHHDyMQKdosatgYVh`** READY and production-live.
- PR #80 **Repair Roadmap 12 checkpoint findings** is merged and production-live. Exact PR head: **`5540cd9b31d2a4bff2c6e13fa2c3a03031d42527`**. Full LikeSized CI #878 (`32802733649`) passed on that exact head, including canonical integrity, exact dependencies, TypeScript, all focused safeguards, production build, fresh replay of all canonical migrations and database behavior/privacy tests.
- PR #80 additive migration `20260825021000_outfit_comment_cursor_pagination.sql` was applied to production Supabase and recorded by Supabase as **`20260825025014 outfit_comment_cursor_pagination`**. Smoke verification confirmed `public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` exists as the intended security-definer cursor-paginated comment projection.
- PR #80 squash merge / current production application commit: **`2856b77dda00b7d8bf373579cef2acb36d21cf69`**.
- PR #80 Vercel production deployment: **`dpl_4QfH5QhtRcDn4gXLuAQXau1jyCDJ`**. It reached READY, owns `likesized.com`, returned HTTP 200, and the checked post-deploy runtime-error window was clean.
- Owner explicitly authorized PR #80 production deployment on 2026-08-24 so the live audit could continue.
- Applied database migrations are immutable; future corrections use later ordered migrations.
- No paid Supabase branches.

## Roadmap 12 — New Outfit — PRODUCTION THROUGH PR #80 / OWNER LIVE AUDIT CONTINUES
Roadmap 12 foundation and successive owner-review/repair batches are production-live through PR #80. The stopping-point defects found after PR #79 were repaired and deployed in PR #80. **Roadmap 13 remains blocked until the owner explicitly finishes the New Outfit audit and accepts the production stopping point.**

# PR #80 STOPPING-POINT REPAIR — DEPLOYED / VERIFIED
Owner-approved checkpoint and live-screenshot corrections shipped in PR #80:
1. **Real comment pagination:** PR #79's comment sheet only revealed slices of an already-loaded oldest-first 200-comment array. PR #80 removes the eager 200-comment page load and adds a newest-first cursor-paginated database RPC + API. The tab loads a small newest preview, the full sheet loads bounded newest-first pages, and **Load earlier comments** requests the next server/database cursor page. The sticky bottom composer and compact comment identity/actions remain.
2. **Session-safe Outfit Views restored:** PR #79 accidentally replaced the browser-session guard with a mount-only ref, causing refresh/reopen inflation. PR #80 restores one View attempt per Outfit per browser session, while allowing a failed request to clear the marker for retry.
3. **Matching Fit Reports corrected:** the PR #79 UI mislabeled total Product Fit Report count as `Matching Fit Reports`. Total raw count is not useful and is no longer substituted. `Matching Fit Reports: X` now means useful personalized exact-item evidence for that viewer.
4. **Viewer's own Fit Report is useful:** PR #79 explicitly filtered the viewer out of the quick-view recommendation. PR #80 includes the viewer's eligible Fit Report/Closet history as recommendation evidence rather than discarding it merely because the viewer authored it. Other useful wearer evidence and the viewer's relevant Closet history feed the same recommendation engine.
5. **Tagged FITuition no longer uses a total-report shortcut:** the tagged-fit route no longer calls the Product total-fit summary to manufacture the visible match count. It evaluates personalized evidence and relevant Closet history, returns useful exact-item match context, and keeps confidence semantics from the canonical recommendation engine.
6. **Logged-out Outfit behavior:** public visitors may view the published Outfit normally. Clicking a tagged item opens a compact create-account/sign-in gate. LikeSized does not show a fake personalized Matching Fit Report count, Body Match, FITuition result or “not enough evidence” message before it can evaluate the visitor.
7. **One canonical tagged-item quick view:** the separate impoverished photo-hotspot popup is removed. Signed-in Tagged Items and photo hotspots open the same useful middle-layer quick view, which includes Product identity/category, useful Matching Fit Reports, useful Body Match/size/Fit context when available, FITuition context and Full details.
8. **Symbol action bar:** the tagged quick view uses compact symbols/icons for Like Locker, Wish Locker, Shop, Share and Report; accessible labels/titles preserve exact meanings. Like/Wish remain in-place and do not close the modal. Shop still requires a valid retailer destination.
9. **Quick-view density:** the tagged modal is materially smaller/tighter and no longer spends a large card on sparse information.
10. **New Outfit Closet picker density:** the fat `Search your Closet` field and progressive filter dropdowns are specifically compacted rather than relying only on generic form styles.
11. **Global page-shell scope creep reversed:** the prior attempt to make controls compact had also reduced global `.pageShell` vertical spacing across unrelated pages. PR #80 restores the prior general page-shell spacing while retaining compact controls where intended.
12. **Canonical privacy/product wording restored and clarified:** public Outfit content remains viewable, raw/private body/Closet/admin state remains protected, and personalized tagged-item intelligence is gated rather than being silently exposed or falsely evaluated.

# OWNER-LOCKED STYLE FEED DIRECTION — 2026-08-24
The owner locked the next social-feed direction after PR #80 went live. This is product meaning to preserve when Roadmap 13 / Style Feed is implemented; it is not yet an implementation/deployment claim.

1. **Rename `My Circle` to `Style Feed`.** The old My Circle name should not remain as competing current UX terminology once this change is implemented.
2. **Purpose:** Style Feed is a generic Instagram/Pinterest-like rolling Outfit feed for passive inspiration — fresh fits selected/ranked algorithmically for the viewer to scroll. It is not the place for specific Product/garment hunting.
3. **Following-only source:** Style Feed contains Outfits only from people the viewer already follows. It does not become an open global discovery feed.
4. **Top relationship switch:** the primary feed switch is **All | Fit Twins**.
   - **All** = Outfits from everyone the viewer follows.
   - **Fit Twins** = followed people who currently qualify as **Fit Twin, Tops Twin, or Bottoms Twin**. All three twin designations are included in this filter.
5. **Only additional feed filter:** **Occasion**. There is **no Style Tag filter** in Style Feed.
6. **Search/Explore boundary:** Browse/Explore/Search remain the intentional tools when the user wants something specific. Style Feed is for fresh algorithmic inspiration and scrolling, not a duplicate search/filter surface.
7. **Homepage `WHAT LIKESIZED DOES` third card:** replace the prior Build Your Circle framing with:
   - Eyebrow/title: **FIT YOUR STYLE**
   - Main line: **Follow people whose fit and style you trust.**
   - Supporting meaning: see what they wear, how they style it, what they recommend, and how they put it all together.
   - CTA: **Get Inspired →**
8. The three homepage feature ideas should now read conceptually as: **Find People My Size → See What Works for Them → Fit Your Style.**

Do not invent extra Style Feed filters. Specifically, **Style Tags are not a Style Feed filter** under the current owner lock.

# PR #79 OWNER LIVE-REVIEW FOLLOW-UP — DEPLOYED / SUPERSEDED WHERE PR #80 CORRECTS IT
PR #79 shipped these owner-approved visible directions:
1. another member's Outfit: Like · Follow · Share · Flag; creator's own Outfit: Share only;
2. social actions directly below media with counts attached to their corresponding actions;
3. compact opened Outfit/media rhythm with no dead media container below the actual image;
4. comment preview + full comments sheet + sticky bottom composer and compact identity/action layout;
5. Style Notes without redundant `OUTFIT TITLE`, `OUTFIT TAGS`, `OUTFIT DESCRIPTION` labels;
6. compact Tagged Items identity cards and a middle-layer Product quick view;
7. Like Locker / Wish Locker / Shop / Share / Report Product actions, with Shop conditional on valid retailer destination and Like/Wish staying in place;
8. one-photo gallery with per-photo tag hotspots restored;
9. responsive My Closet across desktop/tablet/mobile;
10. compact-control direction;
11. owner-approved homepage FAQ wording for Fit Twin and the LikeSized differentiation/FITuition explanation.

The stopping-point audit showed that several PR #79 implementations were semantically incomplete despite full green CI: comment paging was not true paging, View semantics drifted, the tagged count used total reports, the viewer's own evidence was discarded, FITuition was incomplete, logged-out personalized messaging was false, privacy wording loosened, and generic page-shell spacing was changed outside the intended control scope. Those specific implementations were superseded by deployed PR #80; the rest of PR #79 remains canonical.

# PR #77 OWNER LIVE-REVIEW BATCH — DEPLOYED / VERIFIED
The corrected prior rapid live-review queue is implemented, verified and production-live. The prior mistaken interpretation that the owner wanted tagged-garment detail fields “less stacked” was invalid and is not canonical. The actual stacking issue was the Outfit feed collapsing into a single vertical column instead of the intended pinboard layout.

Deployed corrections:
1. **Photo Tags / Use Cover Photo Tags:** rendered as an obvious interactive action/button rather than passive-looking text.
2. **Items picker progressive filtering:** default is **All Garments**; initial sorting is **Recently Added** and **A–Z**; deeper filters appear when relevant; Garment Type is a filter, never a sort option.
3. **Garment card click:** opens compact quick detail instead of immediately selecting the garment.
4. **Actual selection:** requires explicit **Add**/check action.
5. **Garment quick view:** identifies similar versions with Brand, Item/Model, Category/Garment Type, Size, Color, available photos, Fit Result where applicable and every answered garment-specific structured question.
6. **Embedded Brand suggestions:** anchor below the active input and do not cover typed text.
7. **Item / Style / Model suggestion speed:** uses immediate cached/prefetched results plus a brief 60 ms network debounce rather than the old slow path.
8. **Save Draft responsiveness:** keeps explicit pending/saved feedback, avoids unnecessary photo re-upload/reprocessing and does not intentionally freeze/reload the editor after a successful save.
9. **Preview scroll:** Preview Publish starts at the top rather than inheriting a bottom scroll position.
10. **Opened Outfit gallery:** one-photo viewer on **mobile and desktop**; secondary images stay hidden behind the active image; no visible thumbnail/secondary strip is the primary navigation. Mobile swipe/tap and desktop click/pointer-drag/keyboard navigation are supported where applicable.
11. **Tagged garment context:** signed-in opened Outfit data may resolve the tagged canonical Product/category and underlying Fit Report evidence, but later batches own the final viewer-facing Tagged Items presentation.
12. **Outfit feed layout:** uses the intended responsive multi-column masonry/pinboard rhythm rather than unnecessary one-column stacking.
13. **Creator analytics:** separate creator analytics expose **Views + Follows generated** only. Likes/Comments/Shares are not duplicated because those social counts are already visible. Shop-click attribution stays internal LikeSized data and is not a creator-facing metric/explanatory block.
14. **Delete safety:** deleting a published Outfit requires explicit confirmation.
15. **Tagged Product action foundation:** canonical Product actions and retailer-listing routing are available from the opened Outfit.
16. **Comments:** **plain text only** — no rich text, markup/formatting controls, embedded media or nested reply system.

Additional production-live PR #77 work tied to the same owner review:
- **Comment Likes:** signed-in members can Like visible comments; member Like state is private while the safe aggregate count is visible. Comment author/Outfit creator delete boundaries and report controls remain.
- **My Closet is the owned-content hub:** Garments, Outfits and FITuition live under one canonical My Closet surface; `/outfits` is compatibility routing into the Closet Outfits view, not a second creator-content system.
- **Live profile identity:** profile photos are current public identity when uploaded. Owned/discovered/opened/commented Outfit surfaces resolve the current profile photo instead of snapshotting an old avatar onto content.
- **Opened Outfit hierarchy:** compact creator identity/header, active photo, social actions and exclusive Style Notes / Comments / Tagged Items tabs.
- **Regional Twin designation:** both Tops Match and Bottoms Match clearing the configured strong-match threshold = Fit Twin; Tops only = Tops Twin; Bottoms only = Bottoms Twin. Overall Match remains the general score but does not grant Twin status by itself. Public FAQ and relevant member/Outfit contexts use this rule.
- **Blocking context:** member blocking belongs to profile/member context rather than a redundant Outfit-level block action.

# OWNER-LOCKED CURRENT PRODUCT DECISIONS

## Core privacy and Match
- Exact current/historical measurements and private size references remain private.
- Body Match means body similarity, not probability a garment will fit.
- Current-person Match is separate from historical garment Match.
- There is **no current V1 1–5-star Fit Rating UI**. Fit Result remains Too Small / Snug / Just Right / Relaxed / Too Big.

## Fit Community / Following / Twin status
- Fit Community = Men / Women / Both, private social/wearer relevance metadata; it never changes Match math.
- **Following** is member-controlled.
- **Fit Twin is system-generated** among followed people from strong current regional Match quality.
- One canonical `follows` relationship exists; there is no second member-controlled Twin graph.
- Both Tops + Bottoms qualify → Fit Twin; one regional qualifier → Tops Twin or Bottoms Twin; Overall Match alone never grants Twin status.

## Product identity trust
- Unconfirmed = pre-publication candidate only.
- Provisional = 1 distinct wearer.
- Corroborated = 2–4 distinct wearers.
- Established = 5+ distinct wearers.
- Verified = authoritative/admin-reviewed only.
Repeated reports by one member do not manufacture distinct-member trust.

## Product identity / barcode boundary
Base Product identity centers on normalized Brand + Item + Garment Type. Size, Color, retailer, Fit Result, materials, Condition, Notes, purchase context and legitimate alternate barcodes do not independently define a new base Product. Barcode confidence is separate. Conflicts are preserved for review rather than silently rewriting Product truth.

## New Fit Report — evidence-first flow
Opening:
1. **Scan barcode**.
2. **Add tag photo**.
3. Smaller fallback: **Tags missing? Enter item manually →**.

Opening helper: **“Scan the barcode or add a photo of the tag so we can verify the exact item.”**

Main flow remains Brand/Make → Item/Style/Model → optional Tag evidence when not already supplied → Overall Category → Specific Garment Type → optional Department → zero-to-four structured Type questions → Color → Size → Fit Result → Condition → optional Front/Back Fit Photos → optional Fit Notes → optional Retail Link.

When no Product match is active: **“Enter as much information as you can about the item. If you’re unsure about something, just leave it blank.”**

New/unresolved garments retain **I’m not sure this is the correct item/style name**. Changing Brand invalidates the prior Product identity; changing Item invalidates the Product while preserving Brand. A scanned barcode may remain evidence but may not silently reattach an incompatible Product.

Optional Additional Information remains collapsed: Purchased From, Price Paid, Purchase Method, Approx. Purchase Date, UPC/barcode when not scanned, Manufacturer Style/Article Number, Material/Fabric Composition, Product Photo.

## Tracked variation
- only structured questions LikeSized actually asks for the Garment Type are eligible;
- every current remaining structured Type question is variation-defining;
- Intended Fit is retired globally;
- Sneakers Use is retired;
- Cropped, sleeve/sleeve length, neckline and closure are variation-defining wherever asked;
- Size never defines tracked variation;
- Color never defines tracked variation;
- `lib/garment-taxonomy.ts` owns the one current map.

## Shopping / lockers
Like Locker, Wish Locker and Shop/Cart remain independent. Shop appears only with a valid retailer destination. No destination = no Shop. Canonical shopping destinations are `retailer_listings`; affiliate commission never changes relevance/Match/recommendation.

## Product Detail evidence — ROADMAP DEFERRED
Exact tracked-variation evidence comes first. Related variation evidence is secondary and must identify the actual variation difference. Strong reports aggregate only the exact same variation. Body Match remains body similarity, not garment-fit probability.

## FITuition
FITuition combines Size Match evidence with Closet History to recommend size. Exact-variation evidence is strongest; related variation is fallback/supporting evidence. Closet History is weighted by garment relevance. The viewer's own eligible Fit Reports/Closet history are useful evidence and are not discarded simply because the viewer authored them. Confidence is separate from recommendation score and reflects evidence quantity/quality/agreement/separation. Member-facing UI shows recommendation, confidence and understandable evidence—not the internal numeric FITuition score.

## Matching Fit Reports in Outfit tagged-item UI
`Matching Fit Reports: X` is a personalized useful-evidence count, never a raw Product report total. Logged-out visitors do not receive a personalized count until LikeSized can evaluate them. A signed-in viewer's own eligible exact-item Fit Report can count as useful evidence.

# ROADMAP / OWNER RE-AUDIT ORDER
1. Homepage + FAQ — production-live through PR #80; owner has newly locked the `FIT YOUR STYLE` third homepage card direction but that copy is not implemented yet; exact sex/body-specific measurement FAQ wording still pending owner approval.
2. Global header / member menu / admin entry — broader owner interaction audit remains.
3. Auth — owner confirmed.
4. Fit Profile / My Measurements — broader audit remains.
5. Profile Settings — Fit Community editor live.
6. Notifications — audit remains.
7. Unified Closet/member profile Closet — canonical visibility meaning reconciled; broader lifecycle/mutation audit remains.
8. Post-submit Fit Report mutation/lifecycle model — remains.
9. People My Size — broader audit remains; regional Twin rule is production-live.
10. **Style Feed / Following / system-generated Fit Twin** — owner has locked the Style Feed purpose/filter model above; implementation/ranking audit remains. The old `My Circle` terminology is superseded for future current UX by `Style Feed`.
11. New Fit Report — current evidence-first flow and suggestion-speed fixes deployed.
11A. **Garment-question variation classification — COMPLETE / DEPLOYED.**
12. **New Outfit — production-live through PR #80; owner live audit continues.**
13. **Outfits / Style Feed — next broader discovery/ranking implementation after the owner finishes Roadmap 12.** Preserve the locked Following-only `All | Fit Twins` + Occasion model and do not add a Style Tag filter.
14. Garment/Product detail — Exact Variation consumes the canonical 11A map when reached.
15. Explore.
16. Search + `/browse` compatibility.
17. LikeLocker / Wish Locker.
18. Full Admin Catalog + Moderation.
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

PR #77 mappings:
- `20260824231500_outfit_comment_likes.sql` → hosted **`20260825000654 outfit_comment_likes`**.
- `20260824234500_live_profile_identity.sql` → hosted **`20260825000708 live_profile_identity`**.
- `20260825000500_fix_live_comment_like_count_projection.sql` → hosted **`20260825000722 fix_live_comment_like_count_projection`**.

PR #80 mapping:
- `20260825021000_outfit_comment_cursor_pagination.sql` → hosted **`20260825025014 outfit_comment_cursor_pagination`**.

Production smoke verification after PR #77 proved `profile-photos` public identity storage, the comment-Like table and corrected public comment projection. PR #80 smoke verification additionally proved the cursor-paginated Outfit comment function exists in production before application cutover.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Continue the owner New Outfit re-audit on production commit `2856b77dda00b7d8bf373579cef2acb36d21cf69` across create → Draft/resume → Preview → Publish → opened Outfit/detail/gallery/hotspots → edit → comments/social → practical mobile/desktop behavior.
- **Roadmap 13 remains blocked until the owner says the Roadmap 12/New Outfit audit is complete.**
- The newly locked **Style Feed** rename/purpose/filter model and homepage **FIT YOUR STYLE** third card are documented decisions, not yet implemented. Preserve them for the next implementation pass; do not silently add a Style Tag filter.
- After the owner accepts a stopping point, perform the cold production diff/canonical audit and record the exact accepted production SHA as the next known-good checkpoint.
- Future work must preserve the owner-locked app-transition direction and avoid needless browser-only coupling.
- Historical counted-report fingerprint reconciliation for retired structured questions remains separate from tracked-variation classification.
- Exact public sex/body-specific measurement FAQ wording remains pending owner review.
- Full Admin all-Products priority/filter/merge/split presentation remains.
- Purchase-context aggregate/admin reporting UI remains open.
- Broader Closet mutation/lifecycle semantics and exact post-submit Fit Report mutation model remain open.
- Full Style Feed ranking and richer Outfit discovery/search remain later roadmap work beyond the locked source/filter semantics above.
- Product merge/split, richer alias management, spam handling, broader Product-photo moderation, field lock/reopen, external barcode-provider evaluation, SerpAPI admin UX and starter-catalog enrichment remain open where previously scoped.
- `main` is currently not branch-protected; required PR + CI protection remains a separate owner decision and must not be changed silently.

# CANONICAL RECOVERY / BRANCH LINEAGE
The 2026-08-21 **CANONICAL RECOVERY** is complete. No recovery freeze is active. Historical branches have no current authority; Git history preserves superseded implementations and current files define current truth.

Recent relevant lineage:
- `agent/new-outfit-v1` — RECOVERED via PR #67 / DEPLOYED.
- `agent/outfit-live-audit-repairs` — RECOVERED via PR #70 / DEPLOYED.
- `agent/outfit-publish-product-read-fix` — RECOVERED via PR #72 / DEPLOYED.
- `agent/outfit-live-audit-batch-2` — RECOVERED via PR #74 / DEPLOYED.
- `agent/outfit-ios-photo-encoding-repair` — RECOVERED via PR #76 / DEPLOYED.
- `agent/roadmap-app-transition-live-review` — RECOVERED via **PR #77 / DEPLOYED**.
- `agent/post-pr77-production-reconciliation` — RECOVERED via **PR #78 / DEPLOYED docs-only**.
- `agent/roadmap12-live-audit-2` — RECOVERED via **PR #79 / DEPLOYED**.
- `agent/roadmap12-checkpoint-repair` — RECOVERED via **PR #80 / DEPLOYED**.
- `agent/roadmap12-handoff-style-feed-lock` — **documentation-only reconciliation branch created after PR #80; no application behavior change and not production-live.**

# CONDENSED DEPLOYMENT LEDGER
- 2026-08-21 CANONICAL RECOVERY established one clean source-of-truth line; PR #43 promoted it.
- PR #56 hardened Product Label/privacy/storage/scanner/candidate-history boundaries; production migration applied and verified.
- PR #59 repaired known Product correction save permissions; production migration applied and verified.
- PR #61 polished Fit Report desktop/item-search UX; deployed.
- PR #63 made Fit Report intake evidence-first; deployed.
- PR #64 repaired Fit Report identity reset/copy; deployed.
- PR #65 sped Fit Report suggestions and restored photo feedback; deployed.
- PR #66 locked tracked garment variation definitions; deployed.
- PR #67 established New Outfit V1 foundation and six Roadmap 12 migrations; deployed.
- PR #68 shipped approved homepage brand copy; deployed.
- PR #70 shipped first New Outfit live-audit repairs; deployed.
- PR #72 fixed signed-in published Outfit Product reads/shopping source; deployed.
- PR #74 shipped New Outfit live-audit batch 2; deployed.
- PR #76 fixed iOS/Safari Outfit photo conversion fallback; exact head `36d5a433a16d844ada1e5cfdd67264f8caf5a918`, CI #801, merge `e4af3074806a0e2307d7e8d0c21e821c70425eaa`, Vercel `dpl_AU3ZyuW84yEi5X1G27kCd3mX6iX6` READY.
- **PR #77 completed the prior Roadmap 12 live-review repair batch**: exact head `2a6ada938db7772bf27819593d97f5d3556e4312`; full CI #853 (`32791915054`) passed; production migrations `20260825000654`, `20260825000708`, `20260825000722` applied/smoke-verified; squash merge **`41c92a5c94a8d03d59b627f8f5b55e37bdcf482f`**; Vercel **`dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`** READY and serving `likesized.com`; live HTTP 200; checked deployment-scoped error/fatal logs clean.
- **PR #78 reconciled canonical production truth after PR #77**: exact head `b088784773c192a09cb42d00ce10d7ac2c1c2b93`; full CI #855 (`32792808295`) passed; squash merge **`3618632c75f502469d9f7d49254d3edd85211aa1`**; docs-only Vercel **`dpl_DCh7D9gSFKjmCY1rJGwvwhF5HnRJ`** READY and serving `likesized.com`; no application/database behavior change.
- **PR #79 completed the next Roadmap 12 live-audit follow-up**: exact head `ec4bebec4f2743cb8461a724d50e2cb7c1b1529e`; full CI #869 (`32799021871`) passed; squash merge **`8835a413680daef0b78ec890ffa50c84424bdc37`**; Vercel **`dpl_3aSPoi4UwKgZHHDyMQKdosatgYVh`** READY and serving `likesized.com`; live HTTP 200; checked runtime-error window clean. A later stopping-point audit found semantic defects repaired by PR #80.
- **PR #80 repaired the stopping-point defects and is production-live**: exact head **`5540cd9b31d2a4bff2c6e13fa2c3a03031d42527`**; full CI #878 (`32802733649`) passed; production migration **`20260825025014 outfit_comment_cursor_pagination`** applied/smoke-verified; squash merge **`2856b77dda00b7d8bf373579cef2acb36d21cf69`**; Vercel **`dpl_4QfH5QhtRcDn4gXLuAQXau1jyCDJ`** READY and serving `likesized.com`; live HTTP 200; checked runtime-error window clean.

# EXACT NEXT ACTION — CURRENT
1. In the next conversation/tab, start from production commit **`2856b77dda00b7d8bf373579cef2acb36d21cf69`** and continue the owner live Roadmap 12/New Outfit audit. Do not assume Roadmap 12 is complete until the owner says so.
2. Preserve the newly locked **Style Feed** direction: rename My Circle → Style Feed; Following-only rolling Outfit feed; top switch **All | Fit Twins** where Fit Twins includes Fit Twin + Tops Twin + Bottoms Twin; **Occasion is the only additional feed filter; no Style Tag filter**; Search/Explore remain for intentional specific discovery.
3. Preserve the newly locked homepage third feature-card direction: **FIT YOUR STYLE** / **Follow people whose fit and style you trust.** / supporting see-what-they-wear/style/recommend meaning / **Get Inspired →**.
4. The documentation-only branch carrying this reconciliation is `agent/roadmap12-handoff-style-feed-lock`. It is not merged/deployed; do not treat that branch itself as a new production application state.
5. Keep Roadmap 13 blocked until the owner explicitly finishes the New Outfit/Roadmap 12 audit.