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
`likesized.com` is the owner's current verification environment. After explicit deployment authorization, finish the relevant verification, merge the frozen branch to `main`, wait for Vercel production to reach READY, verify live runtime state, reconcile canonical docs, and return the deployed site for owner browser testing.

## Live repair fast path — OWNER DIRECTED 2026-08-24
During an owner live audit, when the owner identifies concrete breakage and directs it fixed, that instruction authorizes implementation on the one active repair branch. Do not stop for repeated re-audits, duplicate approval questions or status-only handoffs. Implement canonical source, add focused coverage, run relevant verification and continue through the authorized deployment boundary. Production/main still requires explicit owner authorization unless already granted for the current frozen batch.

## Rapid live-review logging correction — OWNER DIRECTED 2026-08-24
During rapid-fire live review, keep the issue queue in the active conversation instead of rewriting this file after every owner message. When the review pass ends or the owner directs the batch fixed, reconcile the complete corrected queue into this one canonical master update. Do not create a second notes file. This prevents slow per-message GitHub writes and reduces stale/misread issue drift.

## Small-fix / stopping-point verification workflow — OWNER LOCKED 2026-08-24
The owner must review fixes on the actual production site and wants implementation changes kept small enough to reduce assistant error risk. The working loop is:

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

## Canonical production line — LIVE THROUGH PR #80; PR #81 ACTIVE
- PR #77 prior Roadmap 12 repair batch: exact head **`2a6ada938db7772bf27819593d97f5d3556e4312`**; full LikeSized CI #853 (`32791915054`) passed; three additive migrations applied/smoke-verified; squash merge **`41c92a5c94a8d03d59b627f8f5b55e37bdcf482f`**; Vercel **`dpl_3EUNtQettqxv8LwvTt9FGer8FaJL`** READY and production-live.
- PR #78 post-PR77 canonical reconciliation: exact head **`b088784773c192a09cb42d00ce10d7ac2c1c2b93`**; full CI #855 (`32792808295`) passed; squash merge **`3618632c75f502469d9f7d49254d3edd85211aa1`**; docs-only Vercel **`dpl_DCh7D9gSFKjmCY1rJGwvwhF5HnRJ`** READY; no application/database behavior change.
- PR #79 **Complete Roadmap 12 live-audit follow-up**: exact head **`ec4bebec4f2743cb8461a724d50e2cb7c1b1529e`**; full LikeSized CI #869 (`32799021871`) passed; squash merge **`8835a413680daef0b78ec890ffa50c84424bdc37`**; Vercel **`dpl_3aSPoi4UwKgZHHDyMQKdosatgYVh`** READY and production-live.
- PR #80 **Repair Roadmap 12 checkpoint findings** is merged and production-live. Exact PR head: **`5540cd9b31d2a4bff2c6e13fa2c3a03031d42527`**. Full LikeSized CI #878 (`32802733649`) passed on that exact head, including canonical integrity, exact dependencies, TypeScript, all focused safeguards, production build, fresh replay of all canonical migrations and database behavior/privacy tests.
- PR #80 additive migration `20260825021000_outfit_comment_cursor_pagination.sql` was applied to production Supabase and recorded by Supabase as **`20260825025014 outfit_comment_cursor_pagination`**. Smoke verification confirmed `public.get_outfit_comments_page(uuid,timestamptz,uuid,integer)` exists as the intended security-definer cursor-paginated comment projection.
- PR #80 squash merge / current production application commit: **`2856b77dda00b7d8bf373579cef2acb36d21cf69`**.
- PR #80 Vercel production deployment: **`dpl_4QfH5QhtRcDn4gXLuAQXau1jyCDJ`**. It reached READY, owns `likesized.com`, returned HTTP 200, and the checked post-deploy runtime-error window was clean.
- Owner explicitly authorized PR #80 production deployment on 2026-08-24 so the live audit could continue.
- **Active implementation line:** `agent/roadmap12-handoff-style-feed-lock`, PR #81 **Fix Outfit tagged-item live regressions**. Despite the branch's original documentation-oriented name, it is now the single active live-audit repair line and includes both the Style Feed lock documentation and the current Outfit repairs. It is not merged and not production-live.
- PR #81 source head before this master-log reconciliation was **`f7f89c8269b1c54904310e74aeea2c3da80b1715`**. Its Vercel preview deployment **`dpl_8qukjMkWcJA6a2N33AC6HYanzSRf`** reached READY. A focused production-data check also proved the live zero-count bug was real: recent tagged Products owned by the Outfit creator already have normal exact-Product owner Fit Reports, including examples with **1, 2 and 4** distinct reports, so `Matching Fit Reports: 0` was impossible for those cases.
- Applied database migrations are immutable; future corrections use later ordered migrations.
- No paid Supabase branches.

## Roadmap 12 — New Outfit — PRODUCTION THROUGH PR #80 / PR #81 LIVE-AUDIT REPAIR IS CURRENT GATE
Roadmap 12 foundation and successive owner-review/repair batches are production-live through PR #80. The owner continued the live audit and found that several PR #80 tagged-item repairs still failed in the real interaction path. Those findings are now implemented on PR #81 for live verification. **Roadmap 13 remains blocked until the owner explicitly finishes the New Outfit audit and accepts the production stopping point.**

# PR #81 POST-PR80 LIVE-AUDIT REPAIR — IMPLEMENTED / NOT PRODUCTION-LIVE
The owner directed the current checklist fixed after confirming the previous targeted-repair process had still failed to prove the real behavior. Current PR #81 repairs:

1. **Photo hotspot opens from every Outfit tab.** PR #80 mounted `TaggedItemsPanel` only when the Tagged Items tab itself was active, so the custom photo-hotspot event had no listener while Style Notes or Comments was active. PR #81 keeps the canonical tagged quick-view host mounted across all three Outfit tabs while hiding only the Tagged Items grid when that tab is inactive. The same quick view therefore remains available from a photo hotspot on desktop and mobile without requiring the user to switch tabs first.
2. **Mobile photo-tag quick view is the canonical useful view, not an unreadable mini-card.** The same tagged quick view now remains the one interaction target from photo hotspots. Mobile sizing is constrained to the viewport, the card has an actual border/card boundary, item/FITuition text wraps instead of clipping, and the image/text columns use bounded dimensions that preserve readable copy.
3. **Mobile Report stays in the viewport.** The tagged-item Report form no longer expands below the visible quick-view card on small screens. On mobile it is positioned as a viewport-bound fixed panel with safe bottom spacing and its own bounded scrolling area, so tapping Report does not require scrolling the underlying garment card to discover the form.
4. **Viewer-owned exact Fit Reports count as Matching Fit Reports.** PR #80 still derived the visible count only from `get_product_evidence_candidates` rows that cleared the normal personalized match threshold, which could yield zero even when the viewer had submitted the exact tagged Product themselves. PR #81 explicitly unions the viewer's own normal exact-Product Fit Report IDs into the useful exact-item count. Multiple distinct eligible exact-Product Fit Reports remain distinct evidence; the count is not forced to one.
5. **Own exact evidence survives candidate-RPC failure.** The route no longer returns a fabricated zero solely because the broader candidate RPC fails or returns nothing. The viewer's own exact normal Fit Reports can still establish the visible useful count independently.
6. **Focused regression coverage added.** `tests/outfit-tagged-quickview-regression.test.ts` locks the always-mounted hotspot quick-view host, own exact-report count union, mobile text wrapping and viewport-bound mobile Report behavior.

No new database migration is required for PR #81.

# PR #80 STOPPING-POINT REPAIR — DEPLOYED / VERIFIED, WITH PR #81 CORRECTING THE REAL-WORLD GAPS ABOVE
Owner-approved checkpoint and live-screenshot corrections shipped in PR #80:
1. **Real comment pagination:** PR #79's comment sheet only revealed slices of an already-loaded oldest-first 200-comment array. PR #80 removes the eager 200-comment page load and adds a newest-first cursor-paginated database RPC + API. The tab loads a small newest preview, the full sheet loads bounded newest-first pages, and **Load earlier comments** requests the next server/database cursor page. The sticky bottom composer and compact comment identity/actions remain.
2. **Session-safe Outfit Views restored:** PR #79 accidentally replaced the browser-session guard with a mount-only ref, causing refresh/reopen inflation. PR #80 restores one View attempt per Outfit per browser session, while allowing a failed request to clear the marker for retry.
3. **Matching Fit Reports direction corrected:** total raw Product Fit Report count is not substituted for personalized useful evidence. PR #81 further corrects the implementation so the viewer's own exact eligible reports cannot disappear from that useful count.
4. **Viewer's own Fit Report is useful:** the viewer's eligible Fit Report/Closet history belongs in recommendation evidence rather than being discarded merely because the viewer authored it. PR #81 additionally guarantees own exact reports appear in the visible matching-report count.
5. **Tagged FITuition no longer uses a total-report shortcut:** tagged quick view evaluates personalized evidence and relevant Closet history rather than a raw Product total.
6. **Logged-out Outfit behavior:** public visitors may view the published Outfit normally. Clicking a tagged item opens a compact create-account/sign-in gate. LikeSized does not show a fake personalized Matching Fit Report count, Body Match, FITuition result or “not enough evidence” message before it can evaluate the visitor.
7. **One canonical tagged-item quick-view direction:** Tagged Items and photo hotspots are supposed to open the same useful middle-layer quick view. PR #81 repairs the mounting bug that prevented that from working outside the Tagged Items tab and repairs the mobile presentation.
8. **Symbol action bar:** the tagged quick view uses compact symbols/icons for Like Locker, Wish Locker, Shop, Share and Report; accessible labels/titles preserve exact meanings. Like/Wish remain in-place and do not close the modal. Shop still requires a valid retailer destination.
9. **Quick-view density:** the tagged modal is materially smaller/tighter rather than a large sparse card. PR #81 further constrains and wraps the mobile presentation.
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
`Matching Fit Reports: X` is a personalized useful-evidence count, never a raw Product report total. Logged-out visitors do not receive a personalized count until LikeSized can evaluate them. A signed-in viewer's own eligible exact-item Fit Report counts as useful evidence. Multiple distinct eligible own exact-Product Fit Reports may contribute separately; the count must not become zero merely because broader Body Match candidate retrieval does not return the viewer's own row.

# ROADMAP / OWNER RE-AUDIT ORDER
1. Homepage + FAQ — production-live through PR #80; owner has locked the `FIT YOUR STYLE` third homepage card direction but that copy is not implemented yet; exact sex/body-specific measurement FAQ wording still pending owner approval.
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
12. **New Outfit — production-live through PR #80; PR #81 current live-audit repair is implemented but not production-live.**
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

Production smoke verification after PR #77 proved `profile-photos` public identity storage, the comment-Like table and corrected public comment projection. PR #80 smoke verification additionally proved the cursor-paginated Outfit comment function exists in production before application cutover. PR #81 adds no migration.

# CURRENT IMPLEMENTATION DEBT / OPEN WORK
- Finish the focused verification of PR #81's exact current head. The preview build is already READY for the pre-master-reconciliation repair head; PR CI may run in parallel, but this live-audit batch should use the owner-locked targeted-check workflow rather than another unnecessary stopping-point ritual.
- Do not merge/deploy PR #81 until the owner explicitly authorizes production.
- After owner authorization, merge the exact reviewed PR #81 head to `main`, wait for Vercel production READY, verify the live route/runtime state, then return `likesized.com` immediately for the owner's desktop/mobile check of hotspots, Matching Fit Reports and mobile Report positioning.
- Continue the owner New Outfit re-audit after that live check. **Roadmap 13 remains blocked until the owner says the Roadmap 12/New Outfit audit is complete.**
- The locked **Style Feed** rename/purpose/filter model and homepage **FIT YOUR STYLE** third card are documented decisions, not yet implemented. Preserve them for the next implementation pass; do not silently add a Style Tag filter.
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
- `agent/roadmap12-handoff-style-feed-lock` — **ACTIVE via PR #81 / NOT DEPLOYED**. It began as the post-PR80 documentation reconciliation branch, then became the single active branch for the owner's next tagged-item live-audit repair checklist.

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
- **PR #81 is the active post-PR80 tagged-item repair and is not production-live.** No migration is required.

# EXACT NEXT ACTION — CURRENT
1. Finish focused verification on PR #81's reconciled exact head. The intended live proof points are: photo hotspots open the canonical quick view while Style Notes/Comments is active; the same mobile quick view wraps readable content inside a bounded card; mobile Report appears inside the viewport; and the owner's own normal exact-Product Fit Reports produce a nonzero Matching Fit Reports count, including multiple distinct exact reports where they exist.
2. Do not merge/deploy PR #81 until the owner explicitly authorizes production.
3. After authorization, merge/deploy promptly under the small-fix workflow and hand `likesized.com` back to the owner for direct desktop/mobile verification.
4. Preserve the locked **Style Feed** direction: rename My Circle → Style Feed; Following-only rolling Outfit feed; top switch **All | Fit Twins** where Fit Twins includes Fit Twin + Tops Twin + Bottoms Twin; **Occasion is the only additional feed filter; no Style Tag filter**; Search/Explore remain for intentional specific discovery.
5. Preserve the locked homepage third feature-card direction: **FIT YOUR STYLE** / **Follow people whose fit and style you trust.** / supporting see-what-they-wear/style/recommend meaning / **Get Inspired →**.
6. Keep Roadmap 13 blocked until the owner explicitly finishes the New Outfit/Roadmap 12 audit.
