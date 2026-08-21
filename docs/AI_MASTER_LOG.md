# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, deployment ledger, and AI handoff. Repository policy lives in `AI_REPOSITORY_RULES.md`.

# CANONICAL RECOVERY — ACTIVE / FEATURE FREEZE

Owner approved canonical recovery on **2026-08-21** after a full repository audit found severe source-of-truth drift. No new feature work resumes until this recovery is complete and the owner clears the freeze.

## Recovery baseline
- Production/canonical baseline at recovery start: `main` commit **`e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`** — `Finish Settings mobile cleanup (#42)`.
- Recovery branch: **`canonical-recovery-2026-08-21`**, created directly from that exact main commit.
- Production must remain unchanged during recovery unless the owner separately authorizes a production promotion.
- No old branch/PR may be deleted or closed until its unique decisions/files are classified and salvaged.

## Preserved recovery sources
1. **Fit Match audit**
   - branch: `fit-match-engine-audit`
   - PR: #36 `Build confidence-aware garment-specific Fit Match engine`
   - preserved head: **`fcf87fa1782f2ed704a4856c99487900b1445db5`**
   - state at audit: 81 commits ahead / 16 behind current main, 41 changed files, non-mergeable/diverged.
2. **Phase 6.5 navigation/product decisions**
   - branch: `phase-6-5-1-navigation-ia`
   - preserved head: **`b56f663199a9f7252c27cddfebfdae710230cb5e`**
3. **Browse preview/UX work**
   - branch: `phase-6-5-2-browse-preview`
   - preserved head: **`2d150bc3d7238a50d80cac98d6ddde92c310ae3b`**

No branch above is canonical by itself. Their unique decisions/files have now been classified below; do not delete/close preserved sources until the owner-facing final salvage report has been delivered.

## PR #36 salvage ledger — every file classified

### Application/UI files
- `app/closet/[id]/edit/page.tsx` — **RECOVERED / ADAPTED**: immutable Fit History now records/displays garment condition without importing obsolete UI.
- `app/closet/actions.ts` — **RECOVERED / ADAPTED**: canonical Product resolution/provisional creation, provenance evidence boundary, garment condition, and server-side exclusion of superseded member material/stretch inputs.
- `app/closet/add/CatalogGarmentFields.tsx` — **RECOVERED / ADAPTED**: controlled product evidence retained; `primary_material` and `stretch_level` explicitly excluded from member V1 input.
- `app/closet/add/page.tsx` — **RECOVERED / ADAPTED**: physical Fit Result + garment-condition intake retained; member material/stretch UI excluded.
- `app/closet/closet.module.css` — **DEFERRED** from PR #36 preserved head `fcf87fa1782f2ed704a4856c99487900b1445db5`; responsive Closet-list styling belongs to the later My Closet UX phase and is not a recovery dependency.
- `app/closet/edit-actions.ts` — **RECOVERED / ADAPTED**: garment condition saved on new immutable observations.
- `app/closet/page.tsx` — **DEFERRED** from PR #36 preserved head `fcf87fa1782f2ed704a4856c99487900b1445db5`; its responsive/list-presentation changes belong to the later My Closet phase. Its valid “bad fits are useful evidence” meaning is already represented in recovered New Fit Report/Product copy.
- `app/item/[slug]/page.tsx` — **RECOVERED / ADAPTED**: normal-condition product summary, directional recommendation support, Preferred Fit, qualitative confidence, and Fit Result/Match separation restored; `Would Buy Again` is not passed to sizing.
- `app/onboarding/FitProfileForm.tsx` — **RECOVERED / ADAPTED into later owner-verified production flow**: measurement reconfirmation and Preferred Fit retained. PR #36’s normally-worn-size UI and old History notice are **SUPERSEDED** and were not restored.
- `app/onboarding/MeasurementHelp.module.css` — **RECOVERED / DUPLICATE-IN-CURRENT-SOURCE**: reconfirmation styles are already present alongside later production UI styles.
- `app/onboarding/actions.ts` — **RECOVERED / ADAPTED**: confirmation flags and Preferred Fit persistence retained; retired normally-worn-size UI is not reintroduced and existing private size-reference records are preserved behind the scenes.
- `app/onboarding/page.tsx` — **RECOVERED / ADAPTED into later production flow**: freshness fields and Preferred Fit data loading retained while later initial/revisit Fit Profile UX remains canonical.
- `app/people/page.tsx` — **RECOVERED / ADAPTED** for body-Match semantics. PR #36 `Save as Fit Twin` / `Remove Fit Twin` actions and saved-Fit-Twin wording are **SUPERSEDED** by current Follow/Unfollow semantics.

### Core recommendation code
- `lib/recommendation.ts` — **RECOVERED / VERIFIED** with the canonical evidence hierarchy, directional Fit Result support, Preferred Fit translation, qualitative member-facing confidence helper, and no `Would Buy Again` sizing influence.

### Ordered migrations
All twelve PR #36 migration domains are **RECOVERED / RE-SEQUENCED** after the later production migration head:
- `20260820153100_confidence_aware_fit_matching.sql` → `20260821201000_recover_confidence_aware_fit_matching.sql`
- `20260820153200_fit_match_engine_rpc_boundary.sql` → `20260821201100_recover_fit_match_engine_rpc_boundary.sql`
- `20260820153400_contextual_optional_measurements.sql` → `20260821201200_recover_contextual_optional_measurements.sql`
- `20260820203500_garment_enrichment_provenance.sql` → `20260821201300_recover_garment_enrichment_provenance.sql`
- `20260820211800_directional_fit_recommendation.sql` → `20260821201400_recover_directional_fit_recommendation.sql`
- `20260820215500_garment_fit_preferences.sql` → `20260821201500_recover_garment_fit_preferences.sql`
- `20260820221000_derived_body_proportion_refinement.sql` → `20260821201600_recover_derived_body_proportion_refinement.sql`
- `20260820222100_bust_shaping_context.sql` → `20260821201700_recover_bust_shaping_context.sql`
- `20260820234000_fit_match_audit_consolidation.sql` → `20260821201800_recover_fit_match_audit_consolidation.sql`
- `20260820235000_garment_condition_evidence.sql` → `20260821201900_recover_garment_condition_evidence.sql`
- `20260821011600_fit_profile_reference_normalization_boundary.sql` → `20260821202000_recover_fit_profile_reference_normalization_boundary.sql`
- `20260821014000_harden_historical_snapshot_match_boundary.sql` → `20260821202100_recover_harden_historical_snapshot_match_boundary.sql`
- Additional canonical recovery migration `20260821202200_reassert_positive_only_measurement_normalization.sql` reasserts the later owner decision after the recovered sequence.

### Database/application tests
All preserved PR #36 database/application tests are **RECOVERED / VERIFIED** on the recovery line:
- `supabase/tests/bust_shaping_context.test.sql`
- `supabase/tests/derived_body_proportions.test.sql`
- `supabase/tests/fit_match_edge_body_cases.test.sql`
- `supabase/tests/fit_match_engine.test.sql`
- `supabase/tests/fit_profile_history_integrity.test.sql`
- `supabase/tests/garment_condition_evidence.test.sql`
- `supabase/tests/garment_enrichment_and_directional_fit.test.sql`
- `supabase/tests/garment_fit_preferences.test.sql`
- `supabase/tests/measurement_freshness_and_bra_geometry.test.sql`
- `supabase/tests/people_my_size_matching.test.sql`
- `supabase/tests/search_discovery_integration.test.sql`
- `tests/fit-match-audit-ui.test.ts`
- `tests/recommendation-confidence.test.ts`

### Documentation files from PR #36
- `docs/AI_MASTER_LOG.md` — **SUPERSEDED AS A WHOLE FILE** because later owner decisions changed Phase 6.5/social/product truth; valid Fit Match decisions were **RECOVERED** into this canonical master instead of copying the stale document wholesale.
- `supabase/schema_contract.md` — **RECOVERED / RECONCILED** into the current contract rather than copied wholesale.

### PR #36 closure status
The PR #36 salvage classification is complete. **Do not close/delete PR #36 or its preserved branch yet.** Recovery gate #10 still requires the owner-facing final salvage report across all preserved branches.

## Phase 6.5 preserved-branch salvage ledger — every file classified

### `phase-6-5-1-navigation-ia` at `b56f663199a9f7252c27cddfebfdae710230cb5e`
- `AI_REPOSITORY_RULES.md` — **RECOVERED / ADAPTED** into the stronger current canonical repository policy and CI drift guard.
- `README.md` — **SUPERSEDED AS A WHOLE FILE**; surviving product/architecture decisions are reconciled into current canonical docs.
- `app/browse/page.tsx` — **OBSOLETE PLACEHOLDER IMPLEMENTATION**. It did not implement canonical Browse and was later replaced by a rejected preview demo; the Browse route/product decision survives, not this placeholder.
- `app/help/page.tsx` — **OBSOLETE PLACEHOLDER IMPLEMENTATION**. Help / FAQ remains roadmap-locked, but the empty placeholder is not canonical recovery source.
- `app/likelocker/page.tsx` — **OBSOLETE PLACEHOLDER IMPLEMENTATION**. LikeLocker remains roadmap-locked; the empty placeholder is not recovered as product code.
- `app/page.tsx` — **DEFERRED IMPLEMENTATION** from preserved head `b56f663199a9f7252c27cddfebfdae710230cb5e`: the homepage Help / FAQ entry/copy remains a valid later Help/FAQ task, but recovery does not introduce that surface ahead of its roadmap gate.
- `components/Header.tsx` — **DEFERRED / PARTLY SUPERSEDED** from preserved head `b56f663199a9f7252c27cddfebfdae710230cb5e`. The grouped IA concept and persistent notification-bell decision survive, but the old `Fit Twins → My Fit Twins / Style Feed` group is **SUPERSEDED** by the Following-vs-system-Fit-Twin decision and cannot be copied without inventing the unresolved 6.5.3 social-hub wording.
- `components/HeaderResponsive.module.css` — **DEFERRED WITH HEADER IMPLEMENTATION** from the same preserved head; styles are coupled to the deferred grouped-nav implementation.
- `components/MobileMenu.tsx` — **DEFERRED / PARTLY SUPERSEDED** from the same preserved head. Owner-verified close-on-navigation/outside-tap behavior remains in current production source; the stale Fit-Twin social grouping and `?feed=twins` link are not recovered.
- `docs/AI_MASTER_LOG.md` — **SUPERSEDED AS A WHOLE FILE**; surviving owner decisions are reconciled here.
- `docs/V1_PRODUCT_SPEC.md` — **SUPERSEDED AS A WHOLE FILE**; surviving product decisions are reconciled into current canonical product truth.
- `supabase/schema_contract.md` — **SUPERSEDED AS A WHOLE BRANCH VERSION**; current recovery contract is authoritative.

### Durable Phase 6.5.1 decisions recovered from that branch
- **RECOVERED AS DECISIONS, NOT STALE CODE:** grouped navigation intent; Discover contains Browse / People My Size / LikeLocker; My Closet contains My Closet / New Fit Report / New Outfit; Account contains Fit Profile / Settings / Help / Sign Out; notification bell stays persistent; logo returns Home.
- **SUPERSEDED:** the old navigation assumption that manual/saved Fit Twins own the Style Feed. Following now owns subscription/feed semantics, while Fit Twin remains a system designation.
- **DEFERRED:** exact social-group/hub navigation wording until Phase 6.5.3 so recovery does not invent a new label.

### `phase-6-5-2-browse-preview` at `2d150bc3d7238a50d80cac98d6ddde92c310ae3b`
- Inherited repository-rule/docs files carry the same dispositions above: current recovery docs/policy win; valid Browse decisions are already reconciled into this master.
- `app/browse/BrowseExperience.tsx` — **SUPERSEDED / OBSOLETE PREVIEW IMPLEMENTATION**. It is a hard-coded client-side demo with synthetic people/garments/outfits, local-only Like/Save/Notify/Following state, and a numeric `rating` field from the removed star system. It is not connected to canonical Product/Fit Report data and the owner explicitly rejected its mobile behavior.
- `app/browse/browse.module.css` — **OBSOLETE WITH REJECTED PREVIEW**. It exists solely to style the superseded demo and is not recovered.
- `app/browse/page.tsx` — **SUPERSEDED / OBSOLETE PREVIEW FORK**. It conditionally serves the demo only when `VERCEL_ENV === "preview"` and a different placeholder outside preview, creating exactly the kind of parallel preview/product implementation recovery forbids.
- **NO Browse preview source files are copied into the recovery branch.** The next Browse implementation must be built once, canonically, against real LikeSized data after the recovery freeze clears.

### Durable Phase 6.5.2 Browse decisions recovered from that branch
- **RECOVERED AS OWNER-LOCKED PRODUCT TRUTH:** Garments / Outfits, My Fit Matches / All, 75% eligibility, progressive fit tiers, 8-item carousel, 24-item result batches, strict taxonomy filters, full-universe Search, one canonical Product result, compact mobile suggestions, opaque full-screen mobile mini-browser, exact wearer/report context, image fallback hierarchy, Fit Result instead of stars, Following separate from system Fit Twin, and Help Me Size It as fallback only.
- **SUPERSEDED BY LATER OWNER CORRECTIONS:** always-visible Notify; old Save/Fit-Twin semantics; star/rating presentation; duplicate per-wearer product results; rejected mini-browser interaction; preview-only synthetic data implementation.
- **UNRESOLVED / DEFERRED TO CANONICAL BUILD:** Wishlist-vs-LikeLocker storage/action relationship, exact Fit Twin threshold, exact replacement social-hub wording, final jeans/pants controlled cut/rise taxonomy details, and exact Help Me Size It strong-evidence suppression threshold.

### Phase 6.5 preserved-source closure status
Both preserved Phase 6.5 branch heads are now fully classified. **Do not delete them yet.** They remain available until the final owner-facing salvage report is delivered and branch cleanup is separately undertaken.

## Recovery classification rule
Each preserved file/decision must end as one of:
- **RECOVERED** — applied to recovery source and verified.
- **SUPERSEDED** — owner later changed the decision; newer owner decision wins.
- **OBSOLETE** — no longer required by current architecture.
- **DUPLICATE** — equivalent current source already exists.
- **DEFERRED** — still valid but intentionally postponed; exact source SHA remains recorded.

# CURRENT OWNER-LOCKED PRODUCT TRUTH

## Core promise
**See what fits people built like you.**

LikeSized prioritizes real-world garment evidence from people with garment-relevant body similarity. Algorithmic/fallback estimation is secondary when the network does not yet have enough strong evidence.

## Privacy and matching contexts — LOCKED
- Exact current and historical body measurements are private/owner-only.
- Current-person matching and historical-garment matching are distinct contexts and must never be blended.
- Current-person match: viewer current body ↔ another member current body.
- Historical garment match: viewer current body ↔ immutable body snapshot attached to that Fit Report/try-on.
- Fit Reports preserve immutable `fit_profile_version_id`; later body changes never rewrite historical garment evidence.

## Following vs Fit Twin — LOCKED
- **Following is user-controlled.** A member may follow anyone for style/content regardless of Match %.
- **Fit Twin is system-generated from strong current-person match quality.** It is not a manual save/follow relationship.
- A person can be:
  - Following + Fit Twin + Match %
  - Following + not Fit Twin
  - Fit Twin + not Following
- Exact Fit Twin threshold remains intentionally unresolved/configurable until the final matching model is validated.
- `follows` remains the one canonical social graph. Do not create a second Fit Twin graph.
- Member actions are **Follow / Following / Unfollow**.
- `Save as Fit Twin`, `Saved Fit Twin`, `Remove Fit Twin`, and follower counts labeled Fit Twins are obsolete semantics and must be removed from current UI/source/docs.
- Public social relationship count is **Followers**.
- Style Feed eligibility is driven by Following. Fit Twin status alone does not subscribe content.

## Fit Result / star system — LOCKED
- **Fit Result** is the physical garment outcome:
  - Too Small
  - Snug
  - Just Right
  - Relaxed
  - Too Big
- There is **no current V1 1–5-star Fit Rating UI**.
- Existing database enum/type names containing `fit_rating` may remain as legacy internal naming if they actually store the five physical Fit Result values; legacy identifier names do not authorize a star system.
- Do not show/request stars in Browse, Search, Closet, Product, Help Me Size It, Outfit tags, Shared Closet, or Fit Report lists.

## Deep Fit Match audit — OWNER LOCKED / RECOVERED

### Primary Match semantics
- One primary Match % means garment-relevant body similarity, not probability the garment will fit.
- Match is symmetric.
- Confidence is secondary and qualitative when shown: **High / Good / Limited**.
- Raw measurement coverage is not a fake confidence label.
- Product-size recommendation confidence is qualitative in member UI; internal numeric confidence remains calibration detail.

### Confidence-aware matching
- Use smooth similarity/tolerance behavior rather than a brittle hard cutoff.
- Similarity and confidence/coverage roles remain separate.
- Missing optional measurements reduce available confidence/refinement rather than inventing values.
- Edge-body/uncommon-proportion cases use the same algorithm; do not create hidden body-type scoring systems.

### Directional recommendation evidence
- Body Match remains symmetric, but size recommendation may privately use direction of viewer-vs-historical-wearer differences for garment-relevant measurements.
- Example: a smaller wearer reporting M Too Small is stronger negative evidence against M for a larger viewer.
- Raw signed deltas/directional pressure never reach clients.
- Only safe aggregated directional support may feed the recommendation layer.

### Preferred Fit — OWNER LOCKED
- Private Fit Profile setting **by garment type**, not one global preference.
- Choices: **Fitted / Standard / Relaxed**.
- Missing preference means Standard.
- Preference changes do not alter Match %, Fit Twin qualification, or historical body snapshots.
- Preference affects only translation of physical Fit Results into the viewer's recommended size.
- Too Small and Too Big remain negative for all preferences.
- Preference-only edits do not create fake body-history versions.

### Derived body proportions — OWNER LOCKED
- Derived privately from measurements already supplied; members do not enter ratio fields.
- Not stored as separate profile values.
- Small garment-specific refinement only; not a second matching engine or qualification requirement.
- Missing inputs do not lower the already-qualified base Match.
- Total influence capped at **8%**, with final Match movement capped at **±4 percentage points** from the confidence-aware base Match.
- Examples include chest-to-waist, bust-to-waist, shoulder-to-chest/bust, waist-to-hip, thigh-to-hip, torso-to-height, inseam-to-height, rise-to-height when relevant.

### Chest vs Full Bust — OWNER LOCKED
- Chest and Full Bust are distinct measurements and labels.
- Generic Overall/Tops does not penalize missing Full Bust where bust shaping is not relevant.
- Product-specific bust shaping activates only for explicitly women's products configured as bust-shaped.
- V1 bust-shaped types from the audit: blouse, dresses, bodysuits, suit jackets, blazers.
- Bras/intimates retain specialized Full Bust + Underbust + High Bust handling.
- Unknown/unisex products are not inferred into a women's fit context from body measurements or names.

### Measurement freshness — OWNER LOCKED
- Current measurements have private last-confirmed timestamps and measurement-specific reconfirmation cadence.
- Age never changes the stored measurement, raw similarity, qualification, or coverage.
- After the reconfirmation window, age may apply only a mild confidence discount.
- UI may show **Remeasure recommended** and **Confirm unchanged**.
- Editing refreshes that measurement; an ordinary unchanged save does not silently refresh it.
- Confirmation-only changes do not create fake immutable body-history versions.
- Historical snapshots do not decay simply because time passes.
- V1 intake remains manual tape/scale; no device/import reliability workflow.

### Bra / shoes / outerwear — OWNER LOCKED
- Bras: Full Bust + Underbust core, High Bust supporting; existing bust-point geometry remains optional low-weight evidence; no second bra formula.
- Shoes: Foot Length dominant, Foot Width secondary using the existing 70/30 profile.
- Outerwear: jackets/coats may use slightly wider circumference tolerances for normal layering; suit jackets/blazers remain more precise; no separate layering input.

### Stretch — LATER OWNER DECISION SUPERSEDES PR #36 ACTIVE-STRETCH DIRECTION
- Current V1 does **not** collect, classify, infer, or expose stretch as a member field/filter.
- Legacy schema/PR #36 stretch logic may remain dormant only if required for compatibility during recovery; it must not be reintroduced as active V1 behavior without a new owner decision.

### Garment condition / changed state — OWNER LOCKED
Question: **Has this garment changed from its original fit?**
Options:
- No / Normal wear
- Shrunk
- Stretched out
- Altered / Tailored

Changed-state observations stay in personal Fit History but are excluded from normal-new-product community summaries/recommendation evidence. Filtering occurs before unique-wearer selection so an earlier normal observation from the same physical garment can remain valid.

### Garment information/provenance — OWNER LOCKED
- Resolution order: explicit canonical Product → UPC/barcode → normalized Product URL → Brand + manufacturer Style ID → normalized Brand + Product fallback/new provisional Product.
- SKU is not globally unique product identity.
- Product facts use provenance states: provisional / corroborated / verified / rejected.
- Repeat submissions by the same member do not become independent corroborating votes.
- Conflicts trigger review instead of silently replacing stronger facts.
- Similar Garments requires trustworthy controlled overlap rather than a one-member coincidence.
- Member garment evidence is recorded atomically only after the garment/fit log succeeds.

### Actual garment measurements — OWNER DEFERRED
- V1 must work without manufacturer physical garment measurements/specs.
- Generic brand body-size charts are not actual garment measurements/ease.
- Reliable physical garment dimensions may be future optional enrichment only.

### Learned calibration — OWNER LOCKED FUTURE RULE
- Aggregated LikeSized Fit Result data may calibrate existing weights/tolerances only with meaningful samples, unique wearers, versioned tests/review, and owner approval before production behavior changes.
- No autonomous self-rewriting Match model in V1.

### Would Buy Again — OWNER LOCKED FIT MATCH AUDIT RESULT
- `Would Buy Again` may exist as optional product feedback, but **does not influence size recommendation or recommendation confidence**.
- Any newer document/source implying otherwise is drift and must be corrected.

## Recommendation evidence hierarchy — LOCKED CURRENT ENGINE
**Exact Variant → Exact Product → Product Family → Similar Garments → Brand + Garment Type → Category Fit**

Current engine weights recovered from the matching/recommendation work:
- Exact Variant: 1.00
- Exact Product: 0.94
- Product Family: 0.82
- Similar Garments: 0.70
- Brand + Garment Type: 0.58
- Category Fit: 0.42

Recommendation eligibility currently excludes historical body matches below 50% in `recommendSize()` unless a later audited engine change explicitly replaces that rule.

## Help Me Size It — LOCKED FALLBACK
Help Me Size It is not a primary feature competing with normal LikeSized matching.

1. Strong normal same-product Fit Matches available → show normal evidence; **do not show Help Me Size It**.
2. Some useful evidence but limited confidence → show useful reports first, then a smaller **Help Me Size It** fallback.
3. Zero meaningful close matches → Help Me Size It becomes the main fallback CTA.

Fallback rules:
- reuse the canonical recommendation engine; never create a second sizing engine;
- label output as an estimate;
- use weaker evidence in the existing hierarchy only when legitimate;
- Brand + Garment Type is the canonical derived brand-sizing tendency; do not invent unsupported generic “Brand X runs small” claims;
- show **Other Fit Reports** for the same product below the estimate, including other sizes;
- if no responsible estimate exists, say so and still show available Other Fit Reports;
- if no same-product reports and no responsible estimate exist, do not invent a size.

### Notify relationship
Notify is not a permanent normal garment-card action. It belongs to the insufficient/no-useful-fit-evidence fallback state so the member can ask to be alerted when useful matching evidence arrives.

## Browse — CURRENT OWNER-LOCKED DESIGN, IMPLEMENTATION NOT YET ACCEPTED

### Structure
- one Browse page;
- universal search at top;
- primary switch **Garments | Outfits**;
- each content type has **My Fit Matches | All**;
- fresh Browse defaults to My Fit Matches;
- Garments and Outfits remember their own state during the active session only.

### My Fit Matches eligibility
- Garments: 75%+ garment-specific historical Match.
- Outfits: 75%+ current Overall Match to creator.
- Tiers: 90–99 → 85–89 → 80–84 → 75–79; exhaust stronger tiers first.
- Within tier: Match % → unseen/freshness → recency → likes/popularity.
- Below 75% never silently enters My Fit Matches.
- Fit Alert remains a separate 85%+ garment-specific threshold.

### Batch rules
- carousel: 8;
- initial results: 24;
- Keep Browsing: +24.

### Search
- searches Garments, Outfits, People across full available inventory, not only My Fit Matches;
- one canonical product result per garment/product, not duplicate results per wearer/Fit Report;
- wearer-name contextual exception may anchor the canonical product to that wearer's latest Shared report;
- mobile live suggestions are compact list rows below the search field, not giant cards/carousels;
- full Search Results remain compact and preserve search/Browse state through mini-browser navigation.

### Filters
- strict; never silently relax user selections;
- controlled taxonomy shared with New Fit Report;
- Category → Type → Style, then Brand → Model; Color remains garment-search/filter data;
- Category and Type never relaxed;
- Color remains browsable even if card display treats it separately from taxonomy descriptors;
- later owner review identified jeans/pants need explicit controlled leg-shape/cut such as Skinny, Slim, Straight, Relaxed, Wide, Bootcut, Flare, plus Rise Low/Mid/High where applicable. Exact taxonomy/card-display implementation must be reconciled with the single controlled taxonomy before code resumes.
- Material is manufacturer/background only; no member material verification/filter.
- Stretch is not V1 active input/filter.

### Garment card interaction — CURRENT OWNER CORRECTION
- image priority: Shared wearer fit photo → valid canonical/product image → garment-type LikeSized fallback; blank image is never acceptable.
- Brand + Model/Product identity visible.
- Match context visible where legitimate.
- wearer line uses Display Name/photo where available and includes size + Fit Result.
- **Heart = Like.**
- **Wishlist control = wishlist/save action.** The exact relationship/naming between this control, LikeLocker, and future Gift Lists must be resolved before implementation; do not silently invent a second save graph.
- **Notify is NOT always shown when Fit Matches exist.** It appears in the insufficient/no-useful-fit-match fallback state.
- product/image tap → Garment Quick-Detail.
- wearer identity tap → Wearer Mini Profile.
- Like/Wishlist/Notify are independent targets and must never open detail accidentally.
- no stars.

### Mobile mini-browser
- true opaque full-screen mobile detail flow;
- clean Back + X controls;
- underlying Browse state preserved but not visually bleeding through;
- internal overlay history for garment/person/outfit/report exploration.

### Preview review status
The prior mobile preview is **NOT ACCEPTED**. Owner found blocking issues including dynamic-filter behavior, blank fallback imagery, broken overlapping mini-browser, failed wearer-profile interaction, Like opening detail, duplicate/oversized search results, and stale star/action semantics. Do not resume ordinary preview testing until recovery is complete and a corrected canonical implementation is built.

## LikeLocker / saved fashion content
- LikeLocker is the previously approved private saved-fashion destination for canonical products/garments and saved Outfits.
- It is not a people graph.
- Because the owner later explicitly called the garment-card control **Wishlist**, the exact UI/storage relationship between Wishlist and LikeLocker must be resolved before implementation. Do not create duplicate save systems by assumption.

## LikeSized Gift Lists — ROADMAP LOCKED
- feature remains on roadmap after LikeLocker/Product/retailer/recommendation foundations;
- not a generic wishlist: owner-approved wanted products plus confidence-gated recommended size;
- reuse canonical Product and canonical sizing engine;
- no second gift-sizing engine;
- owner-controlled sharing only;
- random member search must never reveal another member's recommended size;
- raw measurements never shared;
- below sufficient confidence, say there is not enough fit data rather than invent a size.

## Outfits — V1 RETAINED
- prior remove-Outfits decision is superseded;
- preserve canonical Outfit tables/storage/likes/linking;
- other-member outfit discovery lives in Browse;
- followed-person outfit activity lives in Style Feed;
- member's own outfits live in My Closet;
- Outfit likes contribute to Style Likes; garment/product likes do not.

# PHASE / ROADMAP ORDER AFTER RECOVERY
No phase resumes until canonical recovery is COMPLETE.

Then:
1. Resume/finalize Phase 6.5.2 Browse canonical implementation + owner mobile review.
2. Immediately perform the intentionally deferred Phase 6.4 desktop Fit Profile verification.
3. Phase 6.5.3 Following + Fit Twins social hub/terminology cleanup.
4. Preserve/audit Outfits social layer.
5. My Closet.
6. New Fit Report usability gate.
7. Fit Result / remaining satisfaction-signal audit (stars stay removed).
8. Member profile + Shared Closet.
9. Shared Closet cards.
10. Image fallback.
11. Garment detail.
12. People Like You Who Wore This.
13. Canonical Product.
14. Retail links.
15. LikeLocker/save architecture.
16. LikeLocker provenance.
17. LikeLocker view.
17A. Gift Lists.
18. Outfits social-layer audit.
19. Style Feed.
20. Browse search semantics.
21. Help / FAQ.
22. Remaining Settings/admin/moderation/product surfaces.
23. Terminology cleanup.
24. Full preview verification.
25. Phase 7 Beta end-to-end verification.

# PRODUCTION / DEPLOYMENT RECORD

## Current production baseline
- current `main`: `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`.
- audit identified Vercel production deployment for that Settings head: `dpl_4SzuLvPSku4wqNgADq1bQK6EjM2X`.
- Settings mobile cleanup included Display Name retention, Discoverability paragraph removal, live 300-character bio counter, tighter profile form spacing, and mobile Settings card fixes.
- That completed production work was not synchronized into the old master; this recovery record corrects the omission.

## Accidental production history found by audit
- accidental Settings stylesheet state at commit beginning `4c005b6...` received a production deployment;
- removal commit beginning `fc293c2...` received a production deployment;
- final Settings cleanup `e997a217...` received production deployment.
- Repository metadata does not prove whether each production-triggering main update had explicit owner authorization. **Authorization status unresolved. Do not invent it.**

# PHASE 6.4 VERIFIED PRODUCTION WORK TO PRESERVE
- Mobile Fit Profile save/load/edit/revisit/review/confirm behavior owner-verified working.
- Review Changes distinguishes Added / Changed / Removed.
- existing-profile mobile visits use compact revisit hero.
- mobile Review Changes uses two compact cards per row and scrolls to top after transition.
- username initial-setup-only in Fit Profile; later changes live in Settings.
- previous username reserved to same account for 30 days.
- anatomical plausibility hard stops removed; technically valid positive values remain accepted.
- normally-worn-size input UI removed; existing records preserved behind scenes.
- measurement-name/help copy audit owner-locked and implemented in `app/onboarding/MeasurementHelp.tsx`.
- combined `public/measurement-guides/crotch-guide.png` owner-verified for Crotch Depth + Total Crotch Length and must not be altered/recompressed/redrawn/substituted.
- Mobile Menu close on navigation and outside click/tap owner-verified.
- desktop Fit Profile verification remains intentionally unfinished.

# RECOVERY GATES — ALL MUST PASS BEFORE FREEZE CLEARS
1. Canonical docs agree: master, product spec, README, schema contract, migration README.
2. `supabase/schema.sql` alternate schema removed/retired.
3. Machine canonical-integrity check added to CI and passing.
4. Main stale Fit Twin/Following semantics removed from current source/UI or explicitly migrated without duplicate graphs.
5. Current star-rating UI/source removed; no active `rating`/star Browse semantics.
6. PR #36 matching engine, migrations, tests and owner decisions classified/recovered without overwriting later production Fit Profile work.
7. Phase 6.5 Browse work classified/recovered; preview-only stale semantics removed.
8. Database docs describe actual migration directory without hard-coded count claims.
9. Full recovery branch typecheck/build/migration replay/database tests pass.
10. Owner receives a final salvage report showing what was RECOVERED / SUPERSEDED / OBSOLETE / DUPLICATE / DEFERRED.
11. Only after #10 may obsolete branches/PRs be closed/deleted.
12. No production promotion until separately authorized by owner.

## Recovery progress — 2026-08-21
- **RECOVERED:** canonical documentation hierarchy, migration documentation, CI canonical-integrity guard, CODEOWNERS, and recovery PR checklist.
- **RECOVERED:** PR #36 core recommendation engine and all preserved Fit Match migrations re-sequenced after the production migration head, with the later positive-only body-measurement normalization reasserted last.
- **RECOVERED:** measurement freshness/reconfirmation and Preferred Fit merged into the later owner-verified Fit Profile flow without restoring retired normally-worn-size input UI or the removed History notice.
- **RECOVERED:** Following/Fit Twin application semantics on the recovery line. Following is now Follow/Unfollow through `follows`; member profiles and People My Size no longer save/remove Fit Twins; Following Feed and outfit Following filter are driven by `follows`; notification UI is Following-based; `/twins` no longer reads `follows` and deliberately does not invent an unresolved Fit Twin threshold.
- **SAFEGUARD ADDED:** canonical CI now rejects the old source action names/wording, rejects `/outfits?feed=twins`, and fails if `app/twins/page.tsx` derives Fit Twins from `follows`.
- **RECOVERY-LINEAGE SAFEGUARD:** social-source work and the master checkpoint briefly existed as sibling commits during recovery. Both were preserved and reconciled into the active recovery line with merge commit **`efa6f4c10f6dd9182d1738b798c78ab359ff3b6a`**; no force push and no work discarded.
- **VERIFIED CHECKPOINT:** recovery head **`5cb4a246a41aba51916447424c4838fdbebc2db6`** passed CI run **#344**: canonical integrity, typecheck, recommendation calibration, Fit Match UI semantics, Next.js build, fresh full migration replay, and canonical database behavior/privacy tests.
- **RECOVERED / VERIFIED:** Closet/Product provenance + garment-condition application integration on source head **`bf6318ffe376dec396731fbd9e64ebeb431bcc59`**. New Fit Report resolves known Product identity through the canonical resolver before creating anything new; newly created Products are provisional; member controlled construction facts are routed through `record_member_product_evidence` only after the Closet/Fit Report write succeeds rather than being written directly as trusted Product truth; Fit Reports record garment condition; changed-state observations remain in personal Fit History but canonical product summaries/recommendation evidence use normal-condition observations only.
- **SUPERSEDED / EXCLUDED:** PR #36 member-entered material composition and active stretch collection. Current New Fit Report hides `primary_material` and `stretch_level`, and the server rejects crafted submissions for both keys. `record_member_product_evidence` receives no member material rows. Legacy material/stretch schema support may remain dormant for compatibility/future manufacturer enrichment; it does not authorize active V1 member collection.
- **VERIFIED CHECKPOINT:** source head **`bf6318ffe376dec396731fbd9e64ebeb431bcc59`** passed CI run **#349** end-to-end: canonical integrity, typecheck, recommendation calibration, Fit Match UI semantics, Next.js build, pinned Supabase setup, fresh full migration replay, and canonical database behavior tests.
- **RECOVERED / VERIFIED:** Product Detail now consumes the recovered matching model correctly: viewer Preferred Fit, safe aggregated directional Fit Result support, normal-condition exact-product fit summary, qualitative recommendation confidence, and explicit body-Match-vs-physical-Fit semantics. `Would Buy Again` remains outside recommendation input.
- **VERIFIED CHECKPOINT:** source head **`c71fcff2bfd7a2a9302a52dd2120283b930a9914`** passed CI run **#351** end-to-end, including fresh migration replay and database behavior tests.
- **PR #36 CLASSIFICATION COMPLETE:** every preserved application/UI file, engine file, migration, test, and documentation file has a RECOVERED / SUPERSEDED / DUPLICATE / DEFERRED disposition above.
- **PHASE 6.5 PRESERVED-SOURCE CLASSIFICATION COMPLETE:** both old Phase 6.5 branches have file/decision dispositions above. The rejected Browse preview is not present in recovery source; only the surviving owner decisions remain canonical.
- **VERIFIED CHECKPOINT:** master classification commit **`3f44a832cde628331cb759a8a3b89c87b36bbad0`** passed CI run **#352** end-to-end.
- Legacy database RPC/table/test identifiers containing `fit_twin` remain an explicitly known internal cleanup item until a safe ordered migration/compatibility plan is audited. Their existence does not authorize old user-facing semantics.
- Draft PR **#43** exists only as the recovery CI harness and remains **DO NOT MERGE / DO NOT DEPLOY**.
- Production/main remain untouched during recovery.

## Exact next action
Run the full recovery CI against this completed salvage ledger. If green, prepare and deliver the owner-facing final salvage report required by recovery gate #10. Do not close/delete preserved branches or PR #36 before that report is delivered, and do not merge PR #43 or promote production without separate explicit owner authorization.