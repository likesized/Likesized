# LikeSized V1 Master Guide

## Sole master-guide rule — LOCKED
This is the one canonical roadmap, status record, owner-decision ledger, recovery/salvage ledger, completed-work ledger, deployment ledger, and AI handoff. Repository policy lives in `AI_REPOSITORY_RULES.md`.

# CANONICAL RECOVERY — COMPLETE / FEATURE FREEZE CLEARED

Owner approved canonical recovery on **2026-08-21** after a full repository audit found severe source-of-truth drift. The recovered source passed CI runs **#354** and **#355**. The owner then explicitly cleared the recovery freeze and authorized PR #43 for `main`/production. PR #43 merged to canonical `main` as **`426881a57d859be8bd9bf1382d358cc238a3d58e`**, and Vercel production deployment **`dpl_Cmuonko9HpHrfGTaCZMYwwbHPLmF`** reached **READY**. Feature work may resume in the locked roadmap order.

## Recovery baseline
- Production/canonical baseline at recovery start: `main` commit **`e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`** — `Finish Settings mobile cleanup (#42)`.
- Recovery branch: **`canonical-recovery-2026-08-21`**, created directly from that exact main commit.
- The owner explicitly authorized promotion of the verified recovery line through PR #43 on **2026-08-21** after CI #354 passed; the updated clearance commit then passed CI #355 before merge.
- Preserved branches/PR #36 remain untouched until the owner-facing final salvage report is delivered and cleanup is separately undertaken.

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

No branch above is canonical by itself. Their unique decisions/files are classified below.

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
- `20260820153100_confidence_aware_fit_matching.sql` → `20260821223236_recover_confidence_aware_fit_matching.sql`
- `20260820153200_fit_match_engine_rpc_boundary.sql` → `20260821223239_recover_fit_match_engine_rpc_boundary.sql`
- `20260820153400_contextual_optional_measurements.sql` → `20260821223241_recover_contextual_optional_measurements.sql`
- `20260820203500_garment_enrichment_provenance.sql` → `20260821223243_recover_garment_enrichment_provenance.sql`
- `20260820211800_directional_fit_recommendation.sql` → `20260821223246_recover_directional_fit_recommendation.sql`
- `20260820215500_garment_fit_preferences.sql` → `20260821223250_recover_garment_fit_preferences.sql`
- `20260820221000_derived_body_proportion_refinement.sql` → `20260821223252_recover_derived_body_proportion_refinement.sql`
- `20260820222100_bust_shaping_context.sql` → `20260821223255_recover_bust_shaping_context.sql`
- `20260820234000_fit_match_audit_consolidation.sql` → `20260821223257_recover_fit_match_audit_consolidation.sql`
- `20260820235000_garment_condition_evidence.sql` → `20260821223301_recover_garment_condition_evidence.sql`
- `20260821011600_fit_profile_reference_normalization_boundary.sql` → `20260821223303_recover_fit_profile_reference_normalization_boundary.sql`
- `20260821014000_harden_historical_snapshot_match_boundary.sql` → `20260821223308_recover_harden_historical_snapshot_match_boundary.sql`
- Additional canonical recovery migration `20260821223310_reassert_positive_only_measurement_normalization.sql` reasserts the later owner decision after the recovered sequence.

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
The PR #36 salvage classification is complete. **Do not close/delete PR #36 or its preserved branch automatically.** Cleanup is a separate post-report action.

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
Both preserved Phase 6.5 branch heads are fully classified. **Do not delete them automatically.** Cleanup is a separate post-report action.

## Recovery classification rule
Each preserved file/decision ends as one of:
- **RECOVERED** — applied to recovery source and verified.
- **SUPERSEDED** — owner later changed the decision; newer owner decision wins.
- **OBSOLETE** — no longer required by current architecture.
- **DUPLICATE** — equivalent current source already exists.
- **DEFERRED** — still valid but intentionally postponed; preserved source SHA remains recorded.

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
- **Fit Twin is a system-generated designation within Following.** A person must first be followed; LikeSized then decides whether that followed person qualifies as a Fit Twin from strong current-person Match quality.
- A followed person can be:
  - Following + Fit Twin + Match %
  - Following + not Fit Twin + Match %
- A person who is not followed may still have a strong Match %, but is not designated as one of that member’s Fit Twins
- The initial Fit Twin threshold is **85% Overall Match** and is stored as a configurable product setting so it can be calibrated as real network evidence grows.
- `follows` remains the one canonical social graph. Do not create a second Fit Twin graph.
- Member actions are **Follow / Following / Unfollow**.
- `Save as Fit Twin`, `Saved Fit Twin`, `Remove Fit Twin`, and follower counts labeled Fit Twins are obsolete semantics and must be removed from current UI/source/docs.
- Public social relationship count is **Followers**.
- My Circle and Style Feed eligibility are driven by Following. Fit Twins are the system-designated strongest matches within that same followed set, never a separate subscription.

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

### Garment condition — OWNER LOCKED, LATER OWNER DECISION SUPERSEDES THE EARLIER CHANGED-STATE QUESTION
The Fit Report uses exactly these controlled condition choices:
- New
- Used
- Altered

Altered observations stay in personal Fit History but are excluded from normal new/used-product community summaries and recommendation evidence. Filtering occurs before unique-wearer selection so an earlier unaltered observation from the same physical garment can remain valid.

### New Fit Report intake — OWNER LOCKED
For an unidentified item, request only the information required to identify the garment and record its fit:
- **Brand** — required.
- **Item name** — required.
- **Garment type** — required and specific/member-facing (for example, Jeans rather than Bottoms). LikeSized derives and stores the broader Category behind the scenes.
- **Garment-specific controlled questions** — shown only after Garment type is selected. Each garment type may have no more than four garment-specific Style questions; four is a ceiling, not a target. Every such question is optional. **Not sure** is the first and default UI choice. Not sure/blank stores no Product attribute or evidence claim and therefore cannot affect filters, corroboration, conflict flags, or matching. The exact useful question set must be owner-approved per garment type before the form or Explore filters are rebuilt. A global Style question or universal option list is prohibited.
- **Color family** — required and separate from the garment-specific Style-question limit.
- **Exact size** — required, using the canonical structured size controls.
- **Product link, barcode, or manufacturer Style ID** — optional identifiers when available.
- **Overall Fit Result** — required, using Too Small / Snug / Just Right / Relaxed / Too Big.
- **Garment condition** — required, using New / Used / Altered.
- **Fit Photo** — optional. There is no photo-visibility choice: an uploaded Fit Photo is shared with LikeSized members; members who do not want to share a photo do not upload one. LikeSized does not retain a private Fit Photo for the member.
- **Fit notes** — optional.

The normal Fit Report must not ask members to complete a broad catalog questionnaire. Manufacturer/retailer facts are acquired from trustworthy product sources first. Important missing facts use the canonical provisional → independent confirmation → conflict flag → admin verified/locked evidence flow.

Controlled input is the default wherever a finite or canonical choice exists:
- Garment type, garment-specific attributes, Color family, structured size components, Overall Fit Result, and Garment condition use fixed controlled options.
- Brand and Item name search/suggest canonical records first. A member may enter a new value only after no existing result is found; the new value is normalized and remains provisional pending corroboration or admin verification.
- Product link, barcode, and manufacturer Style ID use validated identifier inputs rather than uncontrolled catalog-description fields.
- Fit notes are the intentional free-text exception.
- Fixed options are garment-specific and context-dependent. The application must never reuse one global option list for every garment type.
- Every applicable Sleeve question includes 3/4 Sleeve alongside the other type-appropriate controlled sleeve lengths.
- Neckline is available only for garment Types where it is a meaningful broad distinction (for example, V-neck or Turtleneck); it is not forced onto every Top.
- Garment Types with meaningful opening/closure variation may use a broad controlled Closure question such as Pullover / Quarter-zip / Full-zip.

The owner-approved controlled Color families are:
- Black
- White
- Gray
- Silver
- Brown
- Tan / Beige
- Cream / Ivory
- Red
- Orange
- Yellow
- Green
- Blue
- Purple
- Pink
- Gold
- Multicolor

The controlled Color family is the member-facing input and Explore filter. When trustworthy manufacturer/retailer data supplies an exact marketed color or wash name (for example, Midnight Navy or Medium Stonewash), LikeSized stores that exact source value separately and maps it to the approved Color family. Members do not free-type custom Color values.

Garment taxonomy uses one canonical Category → Type hierarchy in two different interfaces:
- **New Fit Report:** the member selects only the specific physical Type, such as Jeans or Bra. LikeSized automatically derives and stores the broader Category, such as Bottoms or Intimates.
- **Explore:** the member selects the broad Category first. The Type filter then dynamically exposes only Types assigned to that Category. Selecting Bottoms before Jeans is the owner-approved interaction.
- Activewear is not a physical garment Type. An active item uses its actual Type (for example, T-shirt, Tank, Shorts, Joggers, Leggings, Sports Bra, or Jacket).
- The prior umbrella Types Swimwear, Bras / Intimate Apparel, and Shoes must be replaced with specific physical Types before the intake/filter rebuild.
- Approved Swimwear Types: One-piece Swimsuit, Bikini Top, Bikini Bottom, Tankini Top, Swim Trunks, Board Shorts.
- Approved Intimates Types: Bra, Bralette, Sports Bra, Underwear, Shapewear.
- Approved Shoes Types: Sneakers, Boots, Dress Shoes, Loafers, Flats, Heels, Sandals, Slides, Clogs.
- Vest, Overalls, and Coveralls are approved missing physical Types.
- **Work Pants is superseded and removed as a member-facing Type. Cargo Pants replaces it.**
- **Sweatpants** is an approved separate Bottoms Type and must not be forced into Joggers.
- **Skirt** includes the controlled question **Skort (Yes / No)** in addition to its other owner-reviewed broad questions.
- **Jacket and Coat are combined into one member-facing Type: Jacket / Coat.** Members are not required to understand the inconsistent jacket-versus-coat distinction. Trustworthy manufacturer wording may remain as source metadata behind the scenes. Suit Jacket and Blazer remain separate Types.
- Member-facing availability is recorded separately as `garment_types.intake_active`. Legacy umbrella/plural keys remain internal where required by historical Products and the existing calibrated Match engine, but they are not selectable in New Fit Report or Explore. Intake work must not deactivate or rewrite those established matching keys.

#### Approved garment-specific questions: Tops
Color family remains required and separate for every Type.
- **T-shirt:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Neckline (Crew / V-neck / Scoop / Square / Turtleneck).
- **Polo:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long); Opening (Button Placket / Quarter-zip / Full-zip).
- **Dress Shirt:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Work Shirt:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Casual Button-down:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long).
- **Flannel Shirt:** Intended Fit (Slim / Regular / Oversized); Sleeve (Short / 3/4 / Long). There is no Worn-as question. Flannel remains trustworthy manufacturer material metadata when available rather than a member-entered material field.
- **Blouse:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Sleeveless / Short / 3/4 / Long); Neckline (Crew / V-neck / Scoop / Square / Turtleneck / Cowl / Boat Neck).
- **Tank Top:** Intended Fit (Fitted / Regular / Loose); Cropped (Yes / No); Neckline (Crew / V-neck / Scoop / Square).
- **Camisole:** Intended Fit (Fitted / Regular / Loose); Cropped (Yes / No); Neckline (V-neck / Scoop / Square).
- **Strapless Top:** Shape (Fitted / Flowy); Cropped (Yes / No). Tube Tops are included in this specific Tops Type rather than forced into T-shirt, Tank Top, or Camisole.
- **Halter Top:** Shape (Fitted / Flowy); Cropped (Yes / No); Neckline (High / Low). Halter Tops remain a separate physical Type from Strapless Tops.
- **Sweater:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Neck/Opening (Crew / V-neck / Turtleneck / Quarter-zip / Full-zip).
- **Cardigan:** Intended Fit (Fitted / Regular / Oversized); Length (Cropped / Regular / Long); Sleeve (Short / 3/4 / Long); Closure (Open-front / Button / Zip / Tie).
- **Sweatshirt:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Sleeve (Short / 3/4 / Long); Closure (Pullover / Quarter-zip / Full-zip).
- **Hoodie:** Intended Fit (Fitted / Regular / Oversized); Cropped (Yes / No); Closure (Pullover / Quarter-zip / Full-zip).

#### Approved garment-specific questions: Bottoms
Color family remains required and separate for every Type.
- **Jeans:** Cut (Skinny / Slim / Straight / Relaxed / Wide / Bootcut / Flare); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long).
- **Chinos:** Cut (Slim / Tapered / Straight / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long).
- **Dress Pants:** Cut (Slim / Straight / Wide / Flare); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long); Pleated (Yes / No).
- **Trousers:** Cut (Slim / Straight / Wide / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long); Pleated (Yes / No).
- **Cargo Pants:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Cropped / Ankle / Regular / Long). Cargo Pants supersedes the removed Work Pants Type.
- **Shorts:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Short / Mid / Long).
- **Joggers:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Length (Cropped / Full).
- **Sweatpants:** Intended Fit (Slim / Regular / Relaxed); Rise (Low / Mid / High); Leg Opening (Cuffed / Open).
- **Leggings:** Rise (Low / Mid / High); Length (Capri / 7/8 / Full); Leg Shape (Fitted / Bootcut / Flare).
- **Skirt:** Shape (Straight / A-line / Pencil / Full / Pleated / Wrap); Rise (Low / Mid / High); Length (Mini / Knee / Midi / Maxi); Skort (Yes / No).

#### Approved garment-specific questions: Dresses & One-Pieces
Color family remains required and separate for every Type.
- **Dress:** Shape (Fitted / Flowy); Length (Mini / Knee / Midi / Maxi); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low). Neckline is conditional and hidden when Strapless is selected.
- **Jumpsuit:** Shape (Fitted / Flowy); Leg Shape (Slim / Straight / Wide / Flare); Length (Cropped / Full); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long).
- **Romper:** Shape (Fitted / Flowy); Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low).
- **Bodysuit:** Top/Sleeve (Strapless / Halter / Sleeveless / Short / 3/4 / Long); Neckline (High / Low); Bottom Coverage (Thong / Brief).
- **Overalls:** Intended Fit (Slim / Regular / Relaxed); Leg Shape (Straight / Wide / Flare); Length (Shorts / Cropped / Full).
- **Coveralls:** Intended Fit (Slim / Regular / Relaxed); Sleeve (Short / 3/4 / Long); Length (Cropped / Full).
- Dependent questions are dynamic: when an earlier controlled answer makes a later question invalid, the invalid question is hidden and is not stored.

#### Approved garment-specific questions: Outerwear
Color family remains required and separate for every Type.
- **Suit Jacket:** Intended Fit (Slim / Regular / Relaxed); Length (Cropped / Regular / Long); Front (Single-breasted / Double-breasted).
- **Blazer:** Intended Fit (Slim / Regular / Oversized); Length (Cropped / Regular / Long); Front (Single-breasted / Double-breasted).
- **Jacket / Coat:** Style (Denim / Leather / Bomber / Puffer / Rain / Utility / Trench / Peacoat / Overcoat); Intended Fit (Slim / Regular / Oversized); Length (Cropped / Waist / Hip / Mid-thigh / Knee / Long); Hooded (Yes / No).
- **Vest:** Style (Puffer / Tailored / Utility); Intended Fit (Slim / Regular / Oversized); Length (Cropped / Regular / Long); Hooded (Yes / No).
- **Wrap / Shawl:** Length (Short / Regular / Long); Closure (Open / Fastened / Belted).

#### Approved garment-specific questions: Swimwear
Color family remains required and separate for every Type. Swim Dress and Rash Guard are explicitly excluded from this intake taxonomy.
- **One-piece Swimsuit:** Top (Strapless / Halter / Straps); Neckline (High / Low); Leg Cut (Low / Regular / High); Coverage (Minimal / Moderate / Full). Neckline is hidden when Strapless makes it inapplicable.
- **Bikini Top:** Style (Bandeau / Halter / Triangle / Bra-style); Support (Light / Medium / High); Coverage (Minimal / Moderate / Full); Underwire (Yes / No).
- **Bikini Bottom:** Rise (Low / Mid / High); Coverage (Minimal / Moderate / Full); Leg Cut (Low / Regular / High); Skirted (Yes / No).
- **Tankini Top:** Intended Fit (Fitted / Flowy); Length (Cropped / Regular / Long); Top (Strapless / Halter / Straps); Support (Light / Medium / High).
- **Swim Trunks:** Intended Fit (Slim / Regular / Relaxed); Length (Short / Mid / Long); Liner (Yes / No).
- **Board Shorts:** Intended Fit (Slim / Regular / Relaxed); Length (Mid / Long); Closure (Pull-on / Drawstring / Fly).

#### Approved garment-specific questions: Intimates
Color family remains required and separate for every Type.
- **Bra:** Style (T-shirt / Balconette / Plunge / Push-up / Strapless / Minimizer); Underwire (Yes / No); Padding (None / Light / Padded); Coverage (Minimal / Moderate / Full).
- **Bralette:** Style (Triangle / Standard / Longline); Padding (Yes / No); Closure (Pull-on / Hook); Coverage (Minimal / Moderate / Full).
- **Sports Bra:** Support (Light / Medium / High); Padding (Yes / No); Closure (Pull-on / Hook / Zip); Coverage (Minimal / Moderate / Full).
- **Underwear:** Cut (Brief / Bikini / Hipster / Boyshort / Thong / Boxer / Boxer Brief / Trunk); Rise (Low / Mid / High); Coverage (Minimal / Moderate / Full).
- **Shapewear:** Form (Brief / Shorts / Cami / Bodysuit); Target Area (Waist / Hips / Thighs / Full Body); Compression (Light / Medium / Firm).

#### Approved garment-specific questions: Shoes
Color family remains required and separate for every Type.
- **Sneakers:** Height (Low / Mid / High); Use (Casual / Running / Training / Court); Closure (Lace / Slip-on / Hook-and-loop).
- **Boots:** Style (Casual / Work / Hiking / Combat / Cowboy / Dress / Rain / Snow); Height (Ankle / Mid-calf / Knee / Over-the-knee); Heel (Flat / Low / Mid / High); Closure (Pull-on / Zip / Lace).
- **Dress Shoes:** Style (Oxford / Derby / Monk-strap); Toe (Round / Pointed / Square).
- **Loafers:** Style (Penny / Tassel / Bit); Toe (Round / Pointed / Square).
- **Flats:** Style (Ballet / Mary Jane / Slingback); Toe (Round / Pointed / Square).
- **Heels:** Heel Height (Low / Mid / High); Heel Style (Block / Stiletto / Wedge / Kitten); Toe (Round / Pointed / Square / Open).
- **Sandals:** Style (Flat / Heeled / Platform); Closure (Slip-on / Ankle Strap / Back Strap).
- **Slides:** Sole (Flat / Platform).
- **Clogs:** Heel (Flat / Low / Mid / High); Back (Open / Strap / Closed).

The owner completed and approved the full V1 Category → Type → controlled garment-question audit on 2026-08-21. The approved taxonomy is now the only source for the New Fit Report intake and Explore facets. Implementation must not revive the prior global Style/options list.

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

## Explore — CURRENT OWNER-LOCKED DESIGN, CANONICAL REBUILD IN PROGRESS

### Structure
- one Explore page at `/explore`; `/browse` is compatibility redirect only;
- universal search at top;
- primary switch **Garments | Outfits**;
- each content type has **My Fit Matches | All**;
- fresh Explore visits default to My Fit Matches;
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

### Catalog trust in Browse, Search, and Similar Garments — OWNER LOCKED
- Provisional controlled Product information participates immediately in filters and Similar Garments. It is never discarded merely because only one person supplied it.
- **Ordinary Browse prioritizes catalog trust:** Admin-locked and trusted verified Products first, then community-confirmed/corroborated Products, then provisional Products. Conflicted/unresolved Products remain available but rank below otherwise comparable unconflicted Products until review.
- Within each Browse trust tier, the existing applicable Fit tier, relevance, freshness/unseen, recency, and popularity rules continue to order results.
- **Search is different:** text/query relevance is primary. An exact or stronger Brand/Item/identifier/attribute match must not be buried beneath a less relevant Product merely because the less relevant Product is verified. Catalog trust is a tie-breaker among similarly relevant Search results.
- Similar Garments may use all non-rejected controlled values. Admin-locked/verified values receive full authority, community-confirmed values receive stronger authority, and provisional values receive reduced but nonzero authority. This confidence weighting never replaces or weakens actual Exact Product/Exact Variant Fit Reports.

### Search
- searches Garments, Outfits, People across full available inventory, not only My Fit Matches;
- one canonical product result per garment/product, not duplicate results per wearer/Fit Report;
- wearer-name contextual exception may anchor the canonical product to that wearer's latest Shared report;
- mobile live suggestions are compact list rows below the search field, not giant cards/carousels;
- full Search Results remain compact and preserve search/Explore state through mini-browser navigation.

### Filters
- strict; never silently relax user selections;
- controlled taxonomy shared with New Fit Report;
- Category → Type → Style, then Brand → Item Name; Color remains garment-search/filter data;
- Category and Type never relaxed;
- Color remains browsable even if card display treats it separately from taxonomy descriptors;
- later owner review identified jeans/pants need explicit controlled leg-shape/cut such as Skinny, Slim, Straight, Relaxed, Wide, Bootcut, Flare, plus Rise Low/Mid/High where applicable. Exact taxonomy/card-display implementation must be reconciled with the single controlled taxonomy before code resumes.
- Material is manufacturer/background only; no member material verification/filter.
- Stretch is not V1 active input/filter.
- A member-submitted controlled value participates in the applicable Explore facet immediately, including when it is the only submitted value. Provisional/corroborated/verified remains internal provenance and does not gate whether the current Product value can appear as a filter. This follows the same practical rule as a provisional Brand or Item Name on an unidentified Product.
- A later matching confirmation strengthens the value. A conflicting submission flags admin review but does not silently replace the current Product value; the current value continues to drive the public facet until admin resolves and, when appropriate, locks the correct value.

### Garment card interaction — CURRENT OWNER CORRECTION
- image priority: Shared wearer fit photo → valid canonical/product image → garment-type LikeSized fallback; blank image is never acceptable.
- Brand + Item Name identity visible.
- Match context visible where legitimate.
- wearer line uses Display Name/photo where available and includes size + Fit Result.
- **Heart = Like.**
- **Wishlist control = wishlist/save action.** The exact relationship/naming between this control, LikeLocker, and future Gift Lists must be resolved before implementation; do not silently invent a second save graph.
- **Notify is NOT always shown when Fit Matches exist.** It appears in the insufficient/no-useful-fit-match fallback state.
- product/image tap → Garment Quick-Detail.
- wearer identity tap → Wearer Mini Profile.
- Like/Wishlist/Notify are independent targets and must never open detail accidentally.
- no stars.
- The owner-directed copy correction removes internal 75% eligibility/threshold language and Match-percentage explanations from empty states. It does **not** remove the legitimate Match percentage/context from an actual Garment card. Threshold mechanics remain internal; the card may still show the member's useful result.

### Mobile mini-browser
- true opaque full-screen mobile detail flow;
- clean Back + X controls;
- underlying Explore state preserved but not visually bleeding through;
- internal overlay history for garment/person/outfit/report exploration.

### Preview review status
The rejected synthetic Browse preview remains excluded as historical recovery context. The active PR #47 now rebuilds one canonical **Explore** implementation against real Product, Outfit, member-search, current-person Match, and historical garment-evidence sources. It is branch-only and must pass CI plus owner desktop/mobile review before production authorization.

## Admin moderation and member-confirmed garment facts — OWNER LOCKED / BRANCH IMPLEMENTATION IN PROGRESS
- Members can report Outfit posts and shared Fit Report photos with a controlled reason and optional details.
- The owner/admin moderation queue shows open reports, flagged content, involved members, resolution totals, and an append-only action history.
- Admin may dismiss a report or remove the inappropriate post/photo. Removal includes stored photo files and records who acted, when, and why.
- The earliest existing Auth account bootstraps the initial owner/admin. Later admin access is explicit; new members never become admins automatically.
- Missing garment facts submitted by a member remain provisional evidence.
- Later members may independently confirm the same controlled value or submit a different value through the existing canonical evidence path.
- Matching confirmations strengthen/corroborate the value. Conflicting confirmations automatically set `products.catalog_review_needed` and enter the garment-information admin queue.
- An admin decision writes verified evidence and locks the controlled tag/value. Later member conflicts remain evidence for review and cannot overwrite the verified value.
- This extends the existing Product/provenance system; it does not create a second catalog or tagging graph.

## LikeLocker / saved fashion content
- LikeLocker is the previously approved private saved-fashion destination for canonical products/garments and saved Outfits.
- It is not a people graph.
- LikeLocker opens to **Garments** and has exactly three tabs: **Garments / Outfits / Wish Locker**.
- Garments contains ordinary product likes; Outfits contains Outfit likes; Wish Locker contains products the member specifically wants to buy. These are distinct intents but one destination, not duplicate save graphs.

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
The owner cleared the recovery freeze on **2026-08-21**, PR #43 was promoted to `main`, and production reached READY. Continue in this order:
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
22. Remaining Settings/admin/product surfaces beyond the content-report and catalog-conflict moderation foundation implemented in PR #47.
23. Terminology cleanup.
24. Full preview verification.
25. Phase 7 Beta end-to-end verification.

# PRODUCTION / DEPLOYMENT RECORD

## Current production baseline
- current canonical recovery promotion on `main`: `426881a57d859be8bd9bf1382d358cc238a3d58e`.
- Vercel production deployment for that exact commit: `dpl_Cmuonko9HpHrfGTaCZMYwwbHPLmF` — **READY**.
- pre-recovery Settings baseline was `e997a217e8fa6f33df4f84a7f18f581e1ac7de3c`, deployed as `dpl_4SzuLvPSku4wqNgADq1bQK6EjM2X`.
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

# RECOVERY GATES
1. Canonical docs agree: **PASS**.
2. `supabase/schema.sql` alternate schema removed/retired: **PASS**.
3. Machine canonical-integrity check added to CI and passing: **PASS**.
4. Stale Fit Twin/Following semantics removed from current source/UI without duplicate graphs: **PASS**; legacy internal DB identifiers remain known naming debt only.
5. Current star-rating UI/source removed: **PASS**.
6. PR #36 matching engine/migrations/tests/owner decisions classified/recovered without overwriting later production Fit Profile work: **PASS**.
7. Phase 6.5 Browse/navigation sources classified; rejected preview source excluded: **PASS**.
8. Database docs describe actual migration directory without hard-coded count claims: **PASS**.
9. Full recovery branch typecheck/build/migration replay/database tests: **PASS** on completed salvage-ledger commit **`4cf9ea2ddff4d8ed26821c3c9501ede2e976185a`**, CI run **#353**.
10. Owner receives final salvage report: **PASS**; delivered in the recovery handoff before freeze clearance.
11. Obsolete branch/PR cleanup: **NOT STARTED**; allowed only after final report and should be treated as a separate cleanup action.
12. Production promotion: **PASS**. Owner-authorized PR #43 merged as `426881a57d859be8bd9bf1382d358cc238a3d58e`; Vercel production deployment `dpl_Cmuonko9HpHrfGTaCZMYwwbHPLmF` reached READY.

## Recovery progress — 2026-08-21
- **RECOVERED:** canonical documentation hierarchy, migration documentation, CI canonical-integrity guard, CODEOWNERS, and recovery PR checklist.
- **RECOVERED:** PR #36 core recommendation engine and all preserved Fit Match migrations re-sequenced after the production migration head, with the later positive-only body-measurement normalization reasserted last.
- **RECOVERED:** measurement freshness/reconfirmation and Preferred Fit merged into the later owner-verified Fit Profile flow without restoring retired normally-worn-size input UI or the removed History notice.
- **RECOVERED:** Following/Fit Twin application semantics on the recovery line. Following is now Follow/Unfollow through `follows`; member profiles and People My Size no longer save/remove Fit Twins; Following Feed and outfit Following filter are driven by `follows`; notification UI is Following-based; `/twins` no longer reads `follows` and deliberately does not invent an unresolved Fit Twin threshold.
- **SAFEGUARD ADDED:** canonical CI rejects old source action names/wording, rejects `/outfits?feed=twins`, and fails if `app/twins/page.tsx` derives Fit Twins from `follows`.
- **RECOVERY-LINEAGE SAFEGUARD:** social-source work and the master checkpoint briefly existed as sibling commits during recovery. Both were preserved and reconciled into the active recovery line with merge commit **`efa6f4c10f6dd9182d1738b798c78ab359ff3b6a`**; no force push and no work discarded.
- **VERIFIED CHECKPOINT:** recovery head **`5cb4a246a41aba51916447424c4838fdbebc2db6`** passed CI run **#344**.
- **RECOVERED / VERIFIED:** Closet/Product provenance + garment-condition application integration on source head **`bf6318ffe376dec396731fbd9e64ebeb431bcc59`**.
- **SUPERSEDED / EXCLUDED:** PR #36 member-entered material composition and active stretch collection; current UI hides them and server rejects crafted submissions.
- **VERIFIED CHECKPOINT:** source head **`bf6318ffe376dec396731fbd9e64ebeb431bcc59`** passed CI run **#349** end-to-end.
- **RECOVERED / VERIFIED:** Product Detail consumes viewer Preferred Fit, safe aggregated directional Fit Result support, normal-condition exact-product fit summary, qualitative recommendation confidence, and explicit body-Match-vs-physical-Fit semantics. `Would Buy Again` remains outside recommendation input.
- **VERIFIED CHECKPOINT:** source head **`c71fcff2bfd7a2a9302a52dd2120283b930a9914`** passed CI run **#351** end-to-end.
- **PR #36 CLASSIFICATION COMPLETE:** every preserved application/UI file, engine file, migration, test, and documentation file has a disposition.
- **PHASE 6.5 PRESERVED-SOURCE CLASSIFICATION COMPLETE:** both old Phase 6.5 branches have file/decision dispositions; rejected Browse preview code is not present in recovery source.
- **VERIFIED CHECKPOINT:** master classification commit **`3f44a832cde628331cb759a8a3b89c87b36bbad0`** passed CI run **#352**.
- **FINAL TECHNICAL RECOVERY VERIFICATION:** completed salvage-ledger commit **`4cf9ea2ddff4d8ed26821c3c9501ede2e976185a`** passed CI run **#353**: canonical integrity, exact dependency install, typecheck, recommendation confidence calibration, Fit Match UI semantics, Next.js production build, pinned Supabase setup, fresh full migration replay, and canonical database behavior tests.
- Legacy database RPC/table/test identifiers containing `fit_twin` remain known internal naming debt pending a safe ordered migration/compatibility audit; they do not authorize stale user-facing semantics.
- PR **#43** merged into canonical `main` as **`426881a57d859be8bd9bf1382d358cc238a3d58e`** after the clearance commit passed CI run **#355** end-to-end.
- Vercel production deployment **`dpl_Cmuonko9HpHrfGTaCZMYwwbHPLmF`** for that exact merge commit reached **READY**.

# POST-RECOVERY CORRECTION — OUTFIT PHOTO PIPELINE

Status: **COMPLETE / DEPLOYED / VERIFIED**.

- Active branch: `optimize-outfit-photo-pipeline`.
- New outfit intake still accepts JPEG, PNG, or WebP up to 8 MB for normal phone-photo usability.
- The original file is not uploaded. Browser processing creates:
  - `display.webp`: maximum 1600×2000 and 600 KB;
  - `feed.webp`: maximum 800×1000 and 220 KB.
- The server accepts only those capped optimized WebP outputs and removes partial uploads on failure.
- Outfit and Following feeds request `feed.webp`; legacy posts fall back to their existing stored path.
- Storage remains private/member-readable with owner-only writes/deletes.
- CI includes `tests/outfit-photo-pipeline.test.ts`.
- Branch head `ad05b5541947972bf83dbc499c0c11b6204f6b43` passed CI run **#358** end-to-end: canonical integrity, typecheck, focused application tests, production build, full fresh migration replay, and database behavior/privacy tests.
- No Fit Match cache or matching-engine change is included.
- On **2026-08-21**, the owner explicitly authorized PR #44 for `main`/production promotion after CI #359 passed.
- Authorization commit `20c61c808465480e0e744d1452c7fa7bad0a8c6a` passed CI #360 end-to-end.
- PR #44 merged to `main` as `04319c76469819c6178eeb31a3e3f3c987e7694c`.
- Vercel production deployment `dpl_GCRvJjDHgTCDPbSAsN357QN1CHjv` for that exact merge commit reached **READY**.

# POST-RECOVERY CORRECTION — PUBLIC HOMEPAGE CONTENT

Status: **DEPLOYED / VERIFIED / FAQ OWNER REVIEW PENDING**.

- Active branch: `fix-public-homepage-content`.
- The third capability CTA is owner-approved as **Get Inspired →**, restoring the three-card rhythm: Find My Matches / Shop Smarter / Get Inspired.
- **The Loop** now appears above **What LikeSized Does**.
- A substantive five-question FAQ is restored directly on the public homepage, with no registration or missing Help route required.
- FAQ wording preserves canonical privacy, garment-specific Match, Fit Result, Fit Twin, and Following definitions.
- CI includes `tests/public-homepage-content.test.ts` to prevent recurrence.
- Branch head `1b2212eee821015d642d13f88fbbefb63e97c84d` passed CI run **#364** end-to-end.
- On **2026-08-21**, the owner explicitly authorized PR #45 for `main`/production promotion after CI #365 passed.
- Authorization commit `1f94f774fdef375188a360ba1cb14435300a9e51` passed CI run **#366** end-to-end.
- PR #45 merged to `main` as `0961ca6635f790debdbcf7df0b194247caa3eaf4`.
- Vercel production deployment `dpl_FScqLGEXYJAgQEmqUsMeokKzfbCd` for that exact merge commit reached **READY**.
- The owner explicitly requires review of all five FAQ questions after deployment; the homepage must not be called repaired/complete until that review is finished.

# POST-RECOVERY REPAIR — LIVE SCHEMA + GROUPED NAVIGATION

Status: **COMPLETE / DEPLOYED / VERIFIED**.

- The recovery promotion deployed application code but did not apply the 13 recovered database migrations to live Supabase.
- This caused the Fit Profile measurement-type query to fail because production lacked the recovered `reconfirm_after_days` column; all measurement controls therefore disappeared even though the 39 measurement definitions remained stored.
- On **2026-08-21**, the owner authorized repair. All 13 canonical recovery migrations were applied to live Supabase in their locked order.
- Live verification now returns all 39 measurement definitions, including nine core measurements, through the exact column selection used by the Fit Profile page.
- Canonical migration filenames are synchronized to the versions recorded by the live Supabase migration ledger so future pushes do not replay the recovery migrations.
- The grouped menu is restored without the obsolete Fit-Twin-owned Style Feed or `/outfits?feed=twins` route. Desktop and mobile use the exact same owner-approved control: one fixed notification bell beside one Menu button. That single menu contains Discover (Explore / People My Size / My Circle / LikeLocker), My Closet (My Closet / New Fit Report / New Outfit), and Account (Fit Profile / Settings / Help / FAQ / Sign Out). There are no separate desktop dropdowns.
- **My Circle** is the single social destination for everyone the member follows. The Style Feed shows posts from that followed set, and LikeSized marks qualifying followed people as Fit Twins. Legacy `/twins` and `/following` routes redirect to `/circle`.
- PR #46 repair head `f0068d761eb4d110f6663863522a42fd8013e705` passed CI run **#369** end-to-end.
- PR #46 merged to `main` as `ec987f5a22575b54806341615309a150558467dc`.
- Vercel production deployment `dpl_FZ2MeLLXaecG8QYVoK284e1n4x2E` for that exact merge commit reached **READY**.
- Final live verification returned 39 measurement definitions, nine core measurements, and non-null freshness metadata across the catalog.
- FAQ owner review remains pending and the homepage is still not called complete.

# ACTIVE OWNER PREVIEW — EXPLORE / MY CIRCLE / LIKELOCKER

Status: **BRANCH-ONLY / GREEN OWNER-REVIEW TEST ENVIRONMENT READY / NOT PRODUCTION**.

- Active line: PR #47, `correct-grouped-menu-layout`.
- Desktop and mobile use the same one Menu + one fixed notification bell control.
- Explore uses real catalog, Outfit, People, current Overall Match, and historical garment-evidence sources; it defaults to 75%+ My Fit Matches and also exposes All.
- My Circle Style Feed orders posts from followed people qualifying at the configurable initial 85% Overall Match Fit Twin threshold first, then fills with other followed activity, without duplicates.
- LikeLocker opens to Garments and filters Garments / Outfits / Wish Locker. Product likes, Outfit likes, and purchase-intent Wish Locker saves remain distinct.
- Migration `20260821231040_add_likelocker_and_fit_twin_settings.sql` is the canonical replay source for the already-applied live tables/settings.
- Earlier source head `ccac70f1b5413b0b566db6218baa68552f3a9a26` passed CI run **#378** and produced preview deployment `dpl_Ai2mywe1dLrp8ai4ncWT27pQQVEc`; that preview is now superseded by the owner-requested Explore and moderation rebuild on the same branch.
- Current branch work renames the canonical page/route to Explore (`/explore`), retains `/browse` only as a compatibility redirect, adds the eight-item leading carousel and 24-item Keep Browsing expansion, and keeps real Product/Outfit/People/Match sources.
- Explore now implements strict broad Category → specific Type → only that Type's approved controlled questions, followed by Brand → Item name → Color. Changing Category clears incompatible Type/question values. Filters never silently broaden, and the former global Style list is removed.
- Explore search stays over the active browsing page. Typing is debounced and shows exact result counts plus up to five suggestions in each non-empty Garments, Outfits, and People group. Full grouped results and selected detail mini-browsers do not replace the Explore route or discard filters/batches/scroll state.
- The New Fit Report intake now uses Brand, Item name, specific Garment type, zero-to-four optional controlled Type questions with Not sure as the no-evidence default, required controlled Color, exact Size, optional identifiers/link, required Fit Result and New/Used/Altered condition, optional Shared Fit photo, and optional notes. The broad questionnaire, Market/cut segment, Fit Family, product description, visibility, buy-again, and times-worn inputs are removed from normal intake.
- The controlled taxonomy migration uses a dedicated `intake_active` allowlist and preserves established active legacy keys, Match profiles, adjustment rules, and historical Product compatibility. Shared legacy attribute category guards are also preserved when the new per-Type question vocabulary is added.
- Existing exact Products ask **Yes, they’re correct / I need to change something / Not sure**. A distinct agreeing person strengthens the one canonical evidence record; disagreement enters the existing catalog-review queue; Not sure records no confirmation.
- A preview-only fixture layer supplies labeled temporary Garments, Outfits, and Wearers for owner testing. It is gated to development/Vercel Preview, never writes those records or media to live Supabase, disables fixture mutation controls, and must be removed before production merge.
- Fixture-mode New Fit Report includes the same temporary garment identities so exact-item confirmation and dynamic controlled questions can be tested. Saving is explicitly disabled in that mode; the test form cannot write a Fit Report, Product, Variant, photo, or evidence row to live Supabase.
- Product/image opens an opaque mini-browser with Back + X and preserves Explore underneath; Like, Wish Locker, wearer, and Notify remain separate targets.
- Notify appears only below the 75% useful-evidence threshold. The owner-scoped watch produces a real in-app alert/bell count when a later Fit Report arrives for that Product.
- Current branch work adds member reports for Outfit posts/shared Fit Report photos, an admin moderation queue, accountable removal/dismissal history, and admin-only file/content removal.
- The admin queue displays the reported photo before action. Removing a target closes all duplicate open reports for that same target while keeping the action audit.
- Current branch work connects existing member Product-evidence confirmation/conflict rules to an admin garment-information queue and final verified/locked decisions, including controlled tags and member-supplied product descriptions.
- Each flagged Product now shows the actual competing garment-type/attribute/description values, number of distinct people supporting each value, and evidence status before the owner chooses and audits the final locked value.
- On **2026-08-21**, the owner explicitly authorized the additive moderation/catalog-confirmation database foundation for the review preview. Live Supabase now records `20260822000129_add_content_moderation`, `20260822000737_index_moderation_relationships`, `20260822001113_add_product_evidence_notifications`, and `20260822001218_bootstrap_first_admin_safely`; the owner account is the sole bootstrapped admin and later signups cannot self-promote.
- Post-DDL verification confirms RLS on report, audit/evidence, and notification tables; admin-only deletion policies for both private photo buckets; the admin-lock RPC; and the product-evidence notification trigger. Supabase advisors found no missing RLS or unindexed foreign key introduced by this work. The intentionally exposed admin RPCs remain guarded by `private.is_admin`.
- PR #47 head `95e8e34f0e9eb7194f4b3d784c5a3887c5bfc1aa` passed CI run **#381** end-to-end: canonical integrity, TypeScript, all focused safeguards, production build, complete fresh migration replay, and every database privacy/behavior test including `moderation_and_evidence_notifications.test.sql`.
- Vercel preview deployment `dpl_EKLzUtVFHDerEf7ywJ8kfoGUN7au` for that exact commit reached **READY**. This is an owner-review preview only; no code from PR #47 has been merged or promoted to production.
- Owner review locked the member-facing garment filter label as **Item name**. The existing internal query key remains an implementation detail only.
- Owner review locked all no-result states to the compact **No garments/outfits found** treatment. My Fit Matches adds only the useful instruction to try All or remove a filter; no threshold percentage or large missing-evidence headline is shown.
- PR #47 feature head `4c17951e8848e9106bf01c15a84aea376f09228e` passed CI run **#385** end-to-end: canonical drift guard, TypeScript, all focused safeguards, production build, complete fresh migration replay, and every database behavior/privacy test. That includes the historical Match compatibility and preview-no-write regressions added after CI exposed the original intake-taxonomy collision.
- Vercel Preview deployment `dpl_5kfBk3bMsfpxR845sKKUNXwB2b7x` for that exact feature head reached **READY**. The protected preview entry was browser-verified through the expected LikeSized sign-in boundary with rendered content, no framework error overlay, and no application console errors. Authenticated owner review remains required to inspect member-only routes.
- Public homepage five-question FAQ owner review remains pending.

## Exact next action
The owner reviews desktop/mobile Explore and fixture-mode New Fit Report, then My Circle, LikeLocker, shared navigation, reporting, photo moderation, notifications, and catalog-conflict locking in the protected test environment. Apply feedback only on this same canonical line. Do not merge or promote production without explicit owner authorization. FAQ owner review and deferred desktop Fit Profile verification remain open.
